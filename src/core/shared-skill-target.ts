import path from 'path';
import { AI_TOOLS, OPENSPEC_SKILL_NAMES, type AIToolOption } from './config.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { DISK_VIEW, type FileView } from './file-view.js';
import { isReleasedGeneratedContent } from './shared/generated-fingerprint.js';
import { SHARED_SKILLS_ROOT, resolveFormerOwnSkillsDir } from './shared/skill-paths.js';

/**
 * `.agents/skills/.openspec-target` に設定済みツールを1行1 IDで記録する。
 * 全ツールのスキルが1か所にあるため、update はこの一覧で保持するツールを判定する。
 * 2.0 より前は共有フォルダを生成した1つの ID を記録しており、その形式も同じように読む。
 */
const TOOL_LIST_FILE = '.openspec-target';

/** プロジェクトの設定済みツール一覧のパス。 */
export function skillToolListPath(projectPath: string): string {
  return path.join(projectPath, SHARED_SKILLS_ROOT, 'skills', TOOL_LIST_FILE);
}

/**
 * ツール ID をソートして1行ずつ出力する。続いて、OpenSpec が使う前から
 * `.agents/skills/` にあった独自の `openspec-*` スキルを `keep <skill>` として記録。
 * このスキルは上書き・削除しない。
 */
export function formatSkillToolList(
  toolIds: Iterable<string>,
  keptSkills: Iterable<string> = [],
  toolsWithOwnFiles: ReadonlySet<string> = new Set()
): string {
  return [
    // own-files はツール固有のコマンドやリンクを生成済みであることを示す。
    // それらをすべて削除すれば、そのツールも削除する。
    ...[...new Set(toolIds)].sort().map((id) => (toolsWithOwnFiles.has(id) ? `${id} own-files` : id)),
    ...[...new Set(keptSkills)].sort().map((name) => `keep ${name}`),
  ].map((line) => `${line}\n`).join('');
}

/** 一覧内で、固有のコマンドやリンクを生成済みのツール。 */
export function readListedToolsWithOwnFiles(projectPath: string, view: FileView = DISK_VIEW): Set<string> {
  const listPath = skillToolListPath(projectPath);
  try {
    FileSystemUtils.assertProjectArtifactPath(projectPath, listPath);
    if (!view.exists(listPath)) return new Set();
    return new Set(
      view
        .read(listPath)
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/))
        .filter((tokens) => tokens[1] === 'own-files')
        .map((tokens) => tokens[0])
    );
  } catch {
    return new Set();
  }
}

/** `.agents/skills/` で利用者のものとして記録した openspec-* スキル。 */
export function readKeptSharedSkills(projectPath: string, view: FileView = DISK_VIEW): Set<string> {
  const listPath = skillToolListPath(projectPath);
  try {
    FileSystemUtils.assertProjectArtifactPath(projectPath, listPath);
    if (!view.exists(listPath)) return new Set();
    const names = new Set<string>(OPENSPEC_SKILL_NAMES);
    return new Set(
      view
        .read(listPath)
        .split(/\r?\n/)
        .map((line) => line.trim().match(/^keep\s+(\S+)$/)?.[1])
        .filter((name): name is string => name !== undefined && names.has(name))
    );
  } catch {
    return new Set();
  }
}

/**
 * 一覧ファイル導入前の共有フォルダについて、呼び出し表記から生成元ツールを推定する。
 * 汎用の `.agents` ツリーや、利用者が手動で移した Codex ツリーを保持する。
 */
function inferPreListTool(projectPath: string, view: FileView): string | undefined {
  // 全ツールの確認で呼ばれるため、読むものがなければパス検査の前に終了する。
  if (!view.exists(path.join(projectPath, SHARED_SKILLS_ROOT, 'skills'))) return undefined;
  let foundGenericReference = false;
  for (const skillName of OPENSPEC_SKILL_NAMES) {
    const skillFile = path.join(projectPath, SHARED_SKILLS_ROOT, 'skills', skillName, 'SKILL.md');
    if (!view.exists(skillFile)) continue;
    try {
      FileSystemUtils.assertProjectArtifactPath(projectPath, skillFile);
      const content = view.read(skillFile);
      // 生成元ツールの根拠にするのは公開版の出力だけ。
      // 独自スキルや npx skills で導入したスキルは根拠にならない。
      if (!isReleasedGeneratedContent(content)) continue;
      if (content.includes('$openspec-')) return 'codex';
      if (content.includes('/openspec-')) foundGenericReference = true;
    } catch {
      // 存在しない、読めない、プロジェクト外のファイルは根拠にしない。
    }
  }
  return foundGenericReference ? 'agents' : undefined;
}

/** 一覧ファイルに記載された既知のツール。ファイルがなければ空。 */
function readListFileTools(projectPath: string, view: FileView): string[] {
  const listPath = skillToolListPath(projectPath);
  try {
    FileSystemUtils.assertProjectArtifactPath(projectPath, listPath);
    if (!view.exists(listPath)) return [];
    const known = new Set(AI_TOOLS.map((tool) => tool.value));
    return view
      .read(listPath)
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter((id) => known.has(id));
  } catch {
    return [];
  }
}

/**
 * 一覧にツールが載っているか確認する。その場合だけ共有フォルダを管理対象とする。
 * スキルの文面から所有者を推測してはならない。
 */
export function hasSkillToolList(projectPath: string, view: FileView = DISK_VIEW): boolean {
  return readListFileTools(projectPath, view).length > 0;
}

/**
 * プロジェクトの設定済みツール。一覧導入前のプロジェクトでは、
 * 共有フォルダを生成したツールを特定できれば返す。
 */
export function readSkillToolList(projectPath: string, view: FileView = DISK_VIEW): string[] {
  const listed = readListFileTools(projectPath, view);
  // 空または認識できない一覧は根拠にせず、従来どおりフォルダ内の文面で判定する。
  if (listed.length > 0) return listed;
  const inferred = inferPreListTool(projectPath, view);
  return inferred ? [inferred] : [];
}

/** ツールがプロジェクトの設定済み一覧にあるか。 */
export function isToolListed(projectPath: string, toolId: string, view: FileView = DISK_VIEW): boolean {
  return readSkillToolList(projectPath, view).includes(toolId);
}

function hasOpenSpecSkillIn(projectPath: string, skillsDir: string, view: FileView): boolean {
  return OPENSPEC_SKILL_NAMES.some((skillName) => {
    try {
      const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
      FileSystemUtils.assertProjectArtifactPath(projectPath, skillFile);
      return view.exists(skillFile);
    } catch {
      return false;
    }
  });
}

/** 旧ルートに許可リスト内の管理対象スキルが残っているか。 */
export function hasLegacySkills(
  projectPath: string,
  tool: AIToolOption,
  view: FileView = DISK_VIEW
): boolean {
  return (tool.legacySkillsDirs ?? []).some((root) =>
    hasOpenSpecSkillIn(projectPath, path.join(projectPath, root, 'skills'), view)
  );
}

/**
 * 固有の skills/ フォルダに OpenSpec スキルがあるか。
 * 旧版のコピー、またはリンクを受け取るツールのリンクが対象。
 */
export function hasOwnFolderSkills(
  projectPath: string,
  tool: AIToolOption,
  view: FileView = DISK_VIEW
): boolean {
  const ownDir = resolveFormerOwnSkillsDir(projectPath, tool);
  return ownDir !== undefined && hasOpenSpecSkillIn(projectPath, ownDir, view);
}
