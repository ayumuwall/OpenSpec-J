/**
 * 旧公開版が、現行版では使わないコマンドフォルダやプロンプト形式で生成したファイルを整理する。
 * 旧版の生成内容と完全一致し、対応ツールの置換先が導入済みの場合だけ削除する。
 * 利用者の編集を含まず、現行版で代替されているファイルを、古いワークフローの
 * 二重コピーとしてプロジェクトに残し続けないための処理。
 */
import path from 'path';
import { promises as fs } from 'fs';
import { AI_TOOLS, SKILL_LINKED_TOOL_IDS } from './config.js';
import { CommandAdapterRegistry } from './command-generation/index.js';
import { ALL_WORKFLOWS } from './profiles.js';
import { WORKFLOW_TO_SKILL_DIR } from './profile-sync-drift.js';
import { COMMAND_IDS } from './shared/tool-detection.js';
import { isReleasedGeneratedContent } from './shared/generated-fingerprint.js';
import { RELEASED_GENERATED_PATHS } from './shared/released-generated-fingerprints.js';
import { LEGACY_TOOL_ROOTS, legacyCommandPath } from './migration.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { DISK_VIEW, type FileView } from './file-view.js';
import { isToolListed } from './shared-skill-target.js';
import { SHARED_SKILLS_ROOT, usesSharedSkills } from './shared/skill-paths.js';

const SHARED_TARGET_MARKER = '.openspec-target';

const toPosix = (p: string) => p.split(path.sep).join('/').replace(/\\/g, '/');
const topFolder = (rel: string) => rel.split('/')[0];

/**
 * 現行版が特定ツールだけに書き込むプロジェクト相対パス。
 * 固有のリンク、スキル、コマンドが対象。`.agents/skills/` の共有コピーは
 * 全ツールに属するため、特定ツールの設定済み判定には使わない。
 */
function toolSpecificPathsForTool(toolId: string): string[] {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool) return [];
  const paths: string[] = [];
  const ownSkillsRoot = !tool.skillsDir || tool.globalSkillsDir
    ? undefined
    : !usesSharedSkills(tool)
      ? tool.skillsDir
      : SKILL_LINKED_TOOL_IDS.has(tool.value) && tool.skillsDir !== SHARED_SKILLS_ROOT
        ? tool.skillsDir
        : undefined;
  if (ownSkillsRoot) {
    for (const workflow of ALL_WORKFLOWS) {
      const skillDir = `${ownSkillsRoot}/skills/${WORKFLOW_TO_SKILL_DIR[workflow]}`;
      // リンク、またはリンクを作成できない場合の通常コピー。
      paths.push(skillDir, `${skillDir}/SKILL.md`);
    }
  }
  const adapter = CommandAdapterRegistry.get(tool.value);
  if (adapter) {
    for (const commandId of COMMAND_IDS) {
      const file = adapter.getFilePath(commandId);
      if (!path.isAbsolute(file)) paths.push(toPosix(file));
    }
  }
  return paths;
}

/** 現行版が特定ツールに書き込めるプロジェクト相対パス。 */
function currentPathsForTool(toolId: string): string[] {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool) return [];
  const paths = toolSpecificPathsForTool(toolId);
  if (usesSharedSkills(tool)) {
    for (const workflow of ALL_WORKFLOWS) {
      paths.push(`${SHARED_SKILLS_ROOT}/skills/${WORKFLOW_TO_SKILL_DIR[workflow]}/SKILL.md`);
    }
  }
  return paths;
}

/**
 * 全ツール・ワークフロー・配信方式について現行版が書き込めるプロジェクト相対パス。
 * この処理は、内容にかかわらずこれらのパスを変更しない。
 */
export function currentGeneratablePaths(): Set<string> {
  const paths = new Set<string>();
  for (const tool of AI_TOOLS) {
    for (const p of currentPathsForTool(tool.value)) paths.add(p);
  }
  paths.add(`${SHARED_SKILLS_ROOT}/skills/${SHARED_TARGET_MARKER}`);
  for (const tool of AI_TOOLS) {
    // 2.0 より前は、このファイルを各共有スキルルートへ保存していた。
    if (tool.skillsDir && !tool.globalSkillsDir && !usesSharedSkills(tool)) {
      paths.add(`${tool.skillsDir}/skills/${SHARED_TARGET_MARKER}`);
    }
  }
  return paths;
}

/** 2つの一覧から取得した、ツールの旧ルートすべて。 */
function formerRoots(toolId: string): string[] {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  return [
    ...new Set([
      ...(LEGACY_TOOL_ROOTS[toolId] ?? []).map((legacy) => legacy.root),
      ...(tool?.legacySkillsDirs ?? []),
    ]),
  ];
}

/** 最上位フォルダが現在または過去に属していたツール。 */
function folderOwners(): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  const add = (folder: string | undefined, toolId: string) => {
    if (!folder) return;
    if (!owners.has(folder)) owners.set(folder, new Set());
    owners.get(folder)!.add(toolId);
  };
  for (const tool of AI_TOOLS) {
    add(tool.skillsDir, tool.value);
    for (const root of formerRoots(tool.value)) add(root, tool.value);
    for (const p of toolSpecificPathsForTool(tool.value)) add(topFolder(p), tool.value);
  }
  return owners;
}

/**
 * ルート移行が管理する旧ルート内のファイルと、その現在の置換先パス。
 * ツールにまだ必要なら移動し、旧ルートが使用中の可能性があれば先に確認する。
 */
function migrationManagedPaths(toolId: string, root: string): { former: string; current: string }[] {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) return [];
  const paths = Object.values(WORKFLOW_TO_SKILL_DIR).map((dir) => ({
    former: `${root}/skills/${dir}/SKILL.md`,
    current: `${tool.skillsDir}/skills/${dir}/SKILL.md`,
  }));
  const adapter = CommandAdapterRegistry.get(toolId);
  if (adapter) {
    for (const commandId of COMMAND_IDS) {
      const current = adapter.getFilePath(commandId);
      const former = legacyCommandPath(current, tool.skillsDir, root);
      if (former) paths.push({ former: toPosix(former), current: toPosix(current) });
    }
  }
  return paths;
}

/**
 * 置換先の生成後だけ整理する旧ルートか判定する（Codex の `.codex`、Antigravity の `.agent`）。
 * 移行は置換先が存在するファイルだけを処理し、未編集なら削除、編集済みなら保持する。
 * 置換先がないファイルは、現在導入しないワークフローや配信方式のものであり、
 * 移行処理の対象にならないため、移行待ちとはみなさない。
 */
function replacedBeforeCleanup(toolId: string, root: string): boolean {
  return (LEGACY_TOOL_ROOTS[toolId] ?? []).some(
    (legacy) => legacy.root === root && legacy.timing === 'after-generation'
  );
}

/**
 * 現行版が生成しない旧公開版の未編集ファイルで、ツールの置換先が導入済みのものを返す。
 * 最上位フォルダの全所有ツールに現行出力が必要。ルート移行がまだ移動すべき
 * ファイルを持つ旧ルートは保持する。現在導入しないワークフローや配信方式の
 * 旧ファイルも対象に含める。途中にリンクがあるパスは返さず、対象自身だけを削除できる。
 * `view` は更新途中のツリーなので、dry-run でも計画済みの内容を反映して判定する。
 */
export async function findStaleReleasedFiles(
  projectPath: string,
  view: FileView = DISK_VIEW
): Promise<string[]> {
  const current = currentGeneratablePaths();
  const owners = folderOwners();
  const exists = (rel: string) => view.exists(path.join(projectPath, ...rel.split('/')));
  const hasReplacement = new Map<string, boolean>();
  const replaced = (toolId: string) => {
    if (!hasReplacement.has(toolId)) {
      // 現行の固有ファイルがあるか、設定済み一覧に載っていれば導入済み。
      // `.agents/skills` を読むスキル専用ツールには、ほかの固有ファイルがない。
      hasReplacement.set(
        toolId,
        toolSpecificPathsForTool(toolId).some(exists) || isToolListed(projectPath, toolId, view)
      );
    }
    return hasReplacement.get(toolId)!;
  };
  // ルート移行に未移動ファイルや保持した編集済みファイルがあれば、ルート全体を保持する。
  const migrationPending = (folder: string) =>
    AI_TOOLS.some((tool) => {
      if (!formerRoots(tool.value).includes(folder)) return false;
      const needsReplacement = replacedBeforeCleanup(tool.value, folder);
      return migrationManagedPaths(tool.value, folder).some(
        ({ former, current: replacement }) =>
          exists(former) && (!needsReplacement || exists(replacement))
      );
    });

  const root = FileSystemUtils.canonicalizeExistingPath(projectPath);
  const stale: string[] = [];
  for (const rel of RELEASED_GENERATED_PATHS) {
    if (current.has(rel)) continue;
    const folderOwnerIds = owners.get(topFolder(rel));
    if (!folderOwnerIds || folderOwnerIds.size === 0) continue;
    if (![...folderOwnerIds].every(replaced)) continue;
    if (migrationPending(topFolder(rel))) continue;
    const file = path.join(projectPath, ...rel.split('/'));
    const literal = path.join(root, ...rel.split('/'));
    try {
      if (!view.exists(file)) continue;
      if (!(await fs.lstat(literal)).isFile()) continue;
      if (FileSystemUtils.canonicalizeExistingPath(literal) !== literal) continue;
      if (isReleasedGeneratedContent(view.read(file))) stale.push(rel);
    } catch {
      // 存在しないか読めない場合、削除しない。
    }
  }
  return stale;
}

/**
 * ファイルの削除で空になった親フォルダを、プロジェクトルートの手前まで順に削除する。
 * ほかの内容が残るフォルダは保持し、そこで停止する。
 */
export async function pruneEmptyParents(projectPath: string, removed: readonly string[]): Promise<void> {
  const root = FileSystemUtils.canonicalizeExistingPath(projectPath);
  for (const rel of removed) {
    let dir = path.dirname(path.join(root, ...rel.split('/')));
    while (dir !== root && dir.startsWith(root + path.sep)) {
      try {
        await fs.rmdir(dir); // 空でなければ失敗する
      } catch {
        break;
      }
      dir = path.dirname(dir);
    }
  }
}
