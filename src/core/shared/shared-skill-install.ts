/**
 * スキルの共有コピーを .agents/skills/ に書き込み、このフォルダを直接読まない
 * ツールの専用フォルダへリンクする。旧版が専用フォルダに作ったコピーも整理する。
 * 利用者の記述・編集は削除しない。リンクの作成先や旧コピーを置換するのは、
 * 空、共有コピーへのリンク、共有コピーと同一、旧公開版の未編集出力の場合だけ。
 */
import path from 'path';
import * as fs from 'fs';
import { OPENSPEC_SKILL_NAMES, type AIToolOption } from '../config.js';
import type { FileView } from '../file-view.js';
import type { UpdateFileOps } from '../update-plan.js';
import { transformToSharedSkillReferences } from '../../utils/command-references.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { formatSkillToolList, hasSkillToolList, readKeptSharedSkills, skillToolListPath } from '../shared-skill-target.js';
import { everySkillRendering, generateSkillContent, getSkillTemplates } from './skill-generation.js';
import { sharedSkillTexts } from './own-skill-texts.js';
import { classifySkillFile, classifySkillLinkSpot } from './skill-links.js';
import { resolveFormerOwnSkillsDir, resolveSharedSkillsDir, resolveSkillLinkDir, usesSharedSkills } from './skill-paths.js';

/**
 * 指定ワークフロー（省略時はすべて）の共有スキル内容をフォルダ名ごとに返す。
 * 他の導入済みワークフローに本文が依存するため、実際に書き込むセットで生成する。
 */
export function sharedSkillContents(version: string, workflows?: readonly string[]): Map<string, string> {
  return new Map(
    getSkillTemplates(workflows).map(({ template, dirName }) => [
      dirName,
      generateSkillContent(template, version, transformToSharedSkillReferences),
    ])
  );
}

export interface SharedSkillInstallInput {
  projectPath: string;
  /** 設定済みの全ツール。専用フォルダに保持するツールは除外する。 */
  tools: readonly AIToolOption[];
  /** 各スキルに記録する OpenSpec バージョン。 */
  version: string;
  /** プロファイル（または旧構成の上書き）から得るツールごとのワークフロー。 */
  workflowsFor: (toolId: string) => readonly string[];
  ops: UpdateFileOps;
  /** 今回の処理をここまで反映したツリー。 */
  view: FileView;
  /** ディスクへ書き込むか。dry-run では false。 */
  writesToDisk: boolean;
}

export interface SharedSkillInstallResult {
  /** .agents/skills/ に書き込んだスキル数。 */
  writtenSkillCount: number;
  /** 設定済みツールで不要になり削除した共有スキル数。 */
  removedSkillCount: number;
  /** 削除またはリンクへ置換した、旧公開版の未編集コピー数。 */
  replacedOldCopyCount: number;
  /** 利用者の内容があるため保持したフォルダのプロジェクト相対パス。 */
  kept: string[];
  /** プロジェクト外を指し、OpenSpec スキルが残っている旧スキルフォルダ。 */
  linkedOutside: string[];
  /**
   * 今回更新した共有スキルのうち、現行版・公開済み版の生成内容と異なり、
   * 利用者の編集を上書きしたもの。
   */
  refreshedEdited: string[];
  /**
   * 専用スキルフォルダを更新できなかったツール（プロジェクト外へのリンクなど）。
   * 共有コピーは書き込み、このツールだけを失敗とする。
   */
  toolFailures: Map<string, Error>;
}

const toPosix = (p: string) => p.split(path.sep).join('/');

/**
 * 共有フォルダと各専用フォルダを設定済みツールに必要な状態へ整える。
 * init/update ごとに1回、共有コピーを必要とする旧ルート移行より前に実行する。
 */
export async function installSharedSkills(input: SharedSkillInstallInput): Promise<SharedSkillInstallResult> {
  const { projectPath, ops, view } = input;
  const tools = input.tools.filter(usesSharedSkills);
  const result: SharedSkillInstallResult = {
    writtenSkillCount: 0,
    removedSkillCount: 0,
    replacedOldCopyCount: 0,
    kept: [],
    linkedOutside: [],
    refreshedEdited: [],
    toolFailures: new Map(),
  };
  if (tools.length === 0) return result;

  const sharedDir = resolveSharedSkillsDir(projectPath);
  const workflows = [...new Set(tools.flatMap((tool) => [...input.workflowsFor(tool.value)]))];
  // 必要なスキルは今回の内容で生成し、それ以外はコピー判別用に全導入時の内容を生成する。
  const contents = new Map([
    ...sharedSkillContents(input.version),
    ...(workflows.length > 0 ? sharedSkillContents(input.version, workflows) : []),
  ]);
  const wanted = new Set(getSkillTemplates(workflows).map(({ dirName }) => dirName));
  const relative = (p: string) => toPosix(path.relative(projectPath, p));

  // 処理前の共有内容。リンクを作れずコピーしたものは、プロファイルや文言が
  // 変わっていても、この内容と一致すれば OpenSpec のものとして扱う。
  const previous = new Map<string, string>();
  for (const skillName of OPENSPEC_SKILL_NAMES) {
    try {
      previous.set(skillName, view.read(path.join(sharedDir, skillName, 'SKILL.md')));
    } catch {
      // このスキルの共有コピーはまだない。
    }
  }
  // ツール一覧を作るまでは共有フォルダを OpenSpec 管理としない。
  // 既存の openspec-*（npx skills や手書き）は生成内容と一致しなければ利用者のもの。
  // 一覧へ記録して以降も保持し、削除されたら同名を再び OpenSpec で管理する。
  const sharedIsOurs = hasSkillToolList(projectPath, view);
  const previouslyKept = readKeptSharedSkills(projectPath, view);
  // 以前の共有内容を生成物として扱うのはフォルダが管理下にあり、
  // 利用者のものとして保持したスキルでない場合だけ。
  const renderings = new Map<string, string[]>();
  const generatedTexts = (skillName: string): string[] => {
    if (!renderings.has(skillName)) {
      renderings.set(skillName, everySkillRendering(skillName, input.version, transformToSharedSkillReferences));
    }
    return renderings.get(skillName)!;
  };
  const oursFor = (skillName: string) =>
    [
      ...generatedTexts(skillName),
      sharedIsOurs && !previouslyKept.has(skillName) ? previous.get(skillName) : undefined,
    ].filter((text): text is string => text !== undefined);
  const keptShared = new Set<string>();
  const keepAsUsers = (skillName: string) => {
    keptShared.add(skillName);
    if (!previouslyKept.has(skillName)) result.kept.push(relative(path.join(sharedDir, skillName)));
  };
  for (const skillName of OPENSPEC_SKILL_NAMES) {
    const skillDir = path.join(sharedDir, skillName);
    // 共有スキルに OpenSpec はリンクを作らない。既存リンクは利用者のもので、
    // リンク先へは書き込まない。
    if (view.linkTarget?.(skillDir) !== undefined || view.linkTarget?.(path.join(skillDir, 'SKILL.md')) !== undefined) {
      keepAsUsers(skillName);
      continue;
    }
    // フォルダの位置にあるファイル（Git が文字列として取得したリンクなど）も
    // 利用者のものとして保持し、その配下へ書き込まない。
    if (view.exists(skillDir) && !view.isDirectory(skillDir)) {
      keepAsUsers(skillName);
      continue;
    }
    if (!view.exists(path.join(skillDir, 'SKILL.md'))) continue;
    if (previouslyKept.has(skillName)) {
      keptShared.add(skillName);
    } else if (!sharedIsOurs && classifySkillFile(skillDir, oursFor(skillName), view) === 'user') {
      keepAsUsers(skillName);
    }
  }
  const sharedSpotIsUsers = (skillName: string): boolean => keptShared.has(skillName);
  const readOr = (filePath: string): string | undefined => {
    try {
      return view.read(filePath);
    } catch {
      return undefined;
    }
  };

  // 1. 共有コピーと、このプロジェクトのツール一覧。
  for (const dirName of wanted) {
    if (sharedSpotIsUsers(dirName)) continue;
    const skillFile = path.join(sharedDir, dirName, 'SKILL.md');
    FileSystemUtils.assertPathWithin(projectPath, skillFile);
    // 1.x と同じく導入済みスキルをその場で更新する。
    // 編集内容を上書きするときは、保持されないことを明示する。
    if (classifySkillFile(path.join(sharedDir, dirName), generatedTexts(dirName), view) === 'user') {
      result.refreshedEdited.push(relative(skillFile));
    }
    await ops.writeFile(skillFile, contents.get(dirName)!, 'openspec');
    result.writtenSkillCount += 1;
  }
  for (const skillName of OPENSPEC_SKILL_NAMES) {
    if (wanted.has(skillName)) continue;
    const skillDir = path.join(sharedDir, skillName);
    if (!view.exists(skillDir) || sharedSpotIsUsers(skillName)) continue;
    // 選択解除したスキルを削除するが、隣にある利用者の別ファイルは残す。
    // 編集済み SKILL.md も利用者のものとして記録し、保持する。
    // 現行版の生成し得る本文だけと照合する。処理前のファイル内容と比べると
    // 常に一致してしまうため、比較に使わない。
    const generated = generatedTexts(skillName);
    if (
      view.isDirectory(skillDir) &&
      view.exists(path.join(skillDir, 'SKILL.md')) &&
      classifySkillFile(skillDir, generated, view) === 'user'
    ) {
      keepAsUsers(skillName);
      continue;
    }
    const spot = classifySkillLinkSpot(skillDir, skillDir, generated, view);
    if (spot === 'user' && !view.isDirectory(skillDir)) {
      keepAsUsers(skillName);
      continue;
    }
    if (spot === 'user') {
      if (view.exists(path.join(skillDir, 'SKILL.md'))) {
        await ops.removeFile(path.join(skillDir, 'SKILL.md'), 'openspec');
        result.removedSkillCount += 1;
        if (input.writesToDisk) removeIfEmpty(skillDir);
      }
      continue;
    }
    await ops.removeDirectory(skillDir, 'openspec');
    result.removedSkillCount += 1;
  }
  const listPath = skillToolListPath(projectPath);
  // 共有フォルダに利用者のスキルが記録されている間は保持する。
  if (wanted.size > 0 || keptShared.size > 0) {
    // 今回、専用フォルダにファイル（リンク）を作るツール。
    const withOwnFiles = new Set(
      tools
        .filter((tool) => resolveSkillLinkDir(projectPath, tool) !== undefined)
        .map((tool) => tool.value)
    );
    await ops.writeFile(listPath, formatSkillToolList(tools.map((tool) => tool.value), keptShared, withOwnFiles), 'openspec');
  } else if (view.exists(listPath)) {
    // 選択されたワークフローも記録すべき利用者の内容もない。
    await ops.removeFile(listPath, 'openspec');
  }

  // 2. 必要なツールの専用フォルダへリンクし、それ以外は旧コピーを整理する。
  for (const tool of tools) {
    const linkDir = resolveSkillLinkDir(projectPath, tool);
    const ownDir = linkDir ?? resolveFormerOwnSkillsDir(projectPath, tool);
    if (!ownDir) continue;
    // 1.x で利用者が共有のため作ったリンクなど、専用フォルダと共有フォルダが
    // 同じなら、すでに共有コピーを読める。
    if (isSameFolderTree(ownDir, sharedDir)) continue;
    try {
      await settleOwnSkillsFolder(tool, ownDir, linkDir);
    } catch (error) {
      result.toolFailures.set(tool.value, error instanceof Error ? error : new Error(String(error)));
    }
  }

  async function settleOwnSkillsFolder(tool: AIToolOption, ownDir: string, linkDir: string | undefined) {
    // 他の書き込みと同様、フォルダ自体はプロジェクト内に限定する。
    // 個別スキルのリンクは利用者のものとして下で分類・保持する。
    if (!linkDir && !ownFolderInProject(projectPath, ownDir)) {
      // 共有フォルダを読むツールにはここでの作業は不要。外への旧リンクは
      // 失敗にせず保持する。二重読み込みの可能性がある旧スキルだけを報告する。
      let names: string[] = [];
      try {
        names = view.listDirectory ? view.listDirectory(ownDir) : fs.readdirSync(ownDir);
      } catch {
        names = [];
      }
      if (names.some((name) => (OPENSPEC_SKILL_NAMES as readonly string[]).includes(name))) {
        result.linkedOutside.push(relative(ownDir));
      }
      return;
    }
    FileSystemUtils.assertPathWithin(projectPath, ownDir);
    const linksWanted = linkDir !== undefined;
    for (const skillName of OPENSPEC_SKILL_NAMES) {
      const spotPath = path.join(ownDir, skillName);
      const spot = classifySkillLinkSpot(spotPath, path.join(sharedDir, skillName), oursFor(skillName), view);
      if (spot === 'missing') {
        if (linksWanted && wanted.has(skillName)) {
          await ops.linkSkill(spotPath, path.join(sharedDir, skillName), tool.value);
        }
        continue;
      }
      if (spot === 'user') {
        // 共有フォルダを読むツールは旧 SKILL.md を二重に読むため削除する。
        // 利用者の他のファイルは保持する。
        const skillFile = classifySkillFile(spotPath, oursFor(skillName), view);
        if (!linkDir && (skillFile === 'copy' || skillFile === 'released')) {
          await ops.removeFile(path.join(spotPath, 'SKILL.md'), tool.value);
          if (skillFile === 'released') result.replacedOldCopyCount += 1;
          continue;
        }
        result.kept.push(relative(spotPath));
        continue;
      }
      if (linksWanted && wanted.has(skillName)) {
        // 既存リンクと、リンク作成不能時の共有内容と同じコピーは保持する。
        // 旧コピーはリンクへ置き換える。
        if (
          spot === 'copy' &&
          !sharedSpotIsUsers(skillName) &&
          readOr(path.join(spotPath, 'SKILL.md')) === contents.get(skillName)
        ) {
          continue;
        }
        if (spot !== 'link') {
          await ops.linkSkill(spotPath, path.join(sharedDir, skillName), tool.value);
          if (spot === 'released') result.replacedOldCopyCount += 1;
        }
        continue;
      }
      // ここには不要。共有フォルダを読むツールでは二重読み込みとなり、
      // 選択解除したスキルのリンクは参照先がなくなる。
      if (spot === 'link' && !linkDir) continue; // 利用者のリンクなので削除しない
      // 利用者のものとして保持したスキルへのリンクは、その利用者のものを指す。
      if (spot === 'link' && sharedSpotIsUsers(skillName)) continue;
      await ops.removeDirectory(spotPath, tool.value);
      if (spot === 'released') result.replacedOldCopyCount += 1;
    }
    if (input.writesToDisk) {
      removeIfEmpty(ownDir);
      // OpenSpec スキルしか入っていなければツールフォルダ自体も削除する。
      // 例: .cline/skills/ を消した後の .cline/。プロジェクト自体は削除しない。
      const toolDir = path.dirname(ownDir);
      if (path.resolve(toolDir) !== path.resolve(projectPath)) removeIfEmpty(toolDir);
    }
  }

  if (input.writesToDisk && wanted.size === 0) {
    removeIfEmpty(sharedDir);
    removeIfEmpty(path.dirname(sharedDir));
  }
  return result;
}

/** 専用スキルフォルダがリンクをたどってもプロジェクト内にあるか。 */
function ownFolderInProject(projectPath: string, ownDir: string): boolean {
  try {
    FileSystemUtils.assertPathWithin(projectPath, ownDir);
    return true;
  } catch {
    return false;
  }
}

/** 利用者のものとして保持したスキルについて、init/update に表示する案内。 */
export function formatKeptSkills(
  kept: readonly string[],
  linkedOutside: readonly string[] = [],
  refreshedEdited: readonly string[] = []
): string[] {
  const inShared = kept.filter((rel) => rel.startsWith('.agents/skills/'));
  const elsewhere = kept.filter((rel) => !rel.startsWith('.agents/skills/'));
  const lines: string[] = [];
  if (elsewhere.length > 0) {
    lines.push(
      `独自の変更があるスキルフォルダ${elsewhere.length}件を保持しました: ` +
        `${elsewhere.join(', ')}。上書きしていません。.agents/skills の内容と比較し、` +
        '必要な内容を移した後で独自のフォルダを削除してください。'
    );
  }
  if (inShared.length > 0) {
    lines.push(
      `.agents/skills 内のスキル${inShared.length}件を独自スキルとして保持しました: ` +
        `${inShared.join(', ')}。OpenSpec はこれらを更新・削除しません。` +
        '削除すると、次回は OpenSpec のスキルが再び導入されます。'
    );
  }
  if (refreshedEdited.length > 0) {
    lines.push(
      `OpenSpec がインストールするスキル${refreshedEdited.length}件の編集内容を上書きしました: ` +
        `${refreshedEdited.join(', ')}。OpenSpec は更新のたびにこのスキルを再生成し、コピーは残しません。` +
        'Git から編集内容を復元し、継続して使う変更は別名の独自スキルへ保存してください。'
    );
  }
  for (const folder of linkedOutside) {
    lines.push(
      `${folder} はプロジェクト外へのリンクのため、そのまま保持しました。旧 OpenSpec スキルが残っており、` +
        'ツールが二重に読み込む可能性があります。他で使っていなければ、中の openspec-* フォルダを手動で削除してください。'
    );
  }
  return lines;
}

/**
 * リンクをたどると2つのフォルダが同一か、一方が他方に含まれるか。
 * この場合、専用フォルダの整理で全ツールが読む共有コピーも消えてしまう。
 */
export function isSameFolderTree(a: string, b: string): boolean {
  return isWithinFolder(a, b) || isWithinFolder(b, a);
}

/**
 * inner が outer 自体かその配下か。大文字小文字など別表記に左右されないよう、
 * パス文字列ではなくファイルの同一性で比較する。
 */
function isWithinFolder(inner: string, outer: string): boolean {
  let outerStat: fs.BigIntStats;
  let current: string;
  try {
    // Windows のファイル ID は64ビットなので bigint を使う。
    outerStat = fs.statSync(outer, { bigint: true });
    current = fs.realpathSync.native(inner);
  } catch {
    return false;
  }
  if (outerStat.ino === 0n) {
    // Windows のネットワーク共有など、ファイル ID がない場合は実パスを比較する。
    // 必要なプラットフォームでは大文字小文字を区別しない。
    let outerReal: string;
    try {
      outerReal = fs.realpathSync.native(outer);
    } catch {
      return false;
    }
    const fold = (p: string) => (process.platform === 'linux' ? p : p.toLowerCase());
    const [i, o] = [fold(current), fold(outerReal)];
    return i === o || i.startsWith(o.endsWith(path.sep) ? o : o + path.sep);
  }
  for (;;) {
    try {
      const stat = fs.statSync(current, { bigint: true });
      if (stat.ino === outerStat.ino && stat.dev === outerStat.dev) return true;
    } catch {
      return false;
    }
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

function removeIfEmpty(dir: string): void {
  try {
    if (fs.lstatSync(dir).isDirectory() && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {
    // 存在しないか削除できない場合、整理は不要。
  }
}

/**
 * 専用フォルダが installSharedSkills の整備後の状態と異なるかを判定する。
 * 必要なリンクの欠落・旧コピー、不要なリンク・未編集コピー、共有フォルダを
 * 読むツールの二重読み込みとなる旧コピーを検出する。利用者の編集は報告せず、
 * 保持した編集のために毎回更新が必要と判定されるのを避ける。
 */
export function ownSkillFolderNeedsWork(
  projectPath: string,
  tool: AIToolOption,
  linkedSkillNames: ReadonlySet<string>,
  view: FileView
): boolean {
  if (!usesSharedSkills(tool)) return false;
  const linkDir = resolveSkillLinkDir(projectPath, tool);
  const ownDir = linkDir ?? resolveFormerOwnSkillsDir(projectPath, tool);
  if (!ownDir) return false;
  const sharedDir = resolveSharedSkillsDir(projectPath);
  if (isSameFolderTree(ownDir, sharedDir)) return false;
  // 外を指す旧フォルダは保持し、案内する。
  if (!linkDir && !ownFolderInProject(projectPath, ownDir)) return false;
  const kept = readKeptSharedSkills(projectPath, view);
  for (const skillName of OPENSPEC_SKILL_NAMES) {
    let sharedContent = '';
    try {
      sharedContent = view.read(path.join(sharedDir, skillName, 'SKILL.md'));
    } catch {
      // 共有コピーがなければ、ここにある内容と同一にはならない。
    }
    // 導入時と同じく共有コピーおよび現行版が生成し得る全本文と比較する。
    // 保持対象のスキルの共有内容は、OpenSpec ではなく利用者のものとして扱う。
    const ours = kept.has(skillName) ? [...sharedSkillTexts(skillName)] : [sharedContent, ...sharedSkillTexts(skillName)];
    const spotPath = path.join(ownDir, skillName);
    const spot = classifySkillLinkSpot(spotPath, path.join(sharedDir, skillName), ours, view);
    if (spot === 'user') {
      const skillFile = classifySkillFile(spotPath, ours, view);
      if (!linkDir && (skillFile === 'copy' || skillFile === 'released')) return true;
      continue;
    }
    // 利用者のものとして保持したスキルへのリンクは、必要かにかかわらず残す。
    const keptSpot = path.join(sharedDir, skillName);
    if (spot === 'link' && kept.has(skillName) && (view.exists(keptSpot) || view.linkTarget?.(keptSpot) !== undefined)) {
      continue;
    }
    const wanted = linkDir !== undefined && linkedSkillNames.has(skillName);
    // 代替コピーを保持するのは、共有コピーと一致する間だけ。
    if (wanted && spot === 'copy' && !kept.has(skillName)) {
      let copied: string | undefined;
      try {
        copied = view.read(path.join(spotPath, 'SKILL.md'));
      } catch {
        copied = undefined;
      }
      if (copied !== sharedContent) return true;
    }
    if (wanted ? spot === 'missing' || spot === 'released' : spot !== 'missing' && !(spot === 'link' && !linkDir)) {
      return true;
    }
  }
  return false;
}
