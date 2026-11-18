/**
 * ツール専用 skills/ から .agents/skills/ の共有コピーへリンクする。
 * npx skills と同じく、共有フォルダを直接読まないツールに使う。
 * スキルフォルダごとに相対リンクを作り、移動・clone 後も使えるようにする。
 * リンクを作れない環境ではコピーする。
 */
import path from 'path';
import * as fs from 'fs';
import { isReleasedGeneratedContent, normalizeGeneratedContent } from './generated-fingerprint.js';
import { DISK_VIEW, type FileView } from '../file-view.js';

/**
 * リンクの作成先を分類する。
 * missing: 未作成、link: 共有コピーへのリンク、
 * copy: 共有内容と同一の代替コピー、
 * released: 旧公開版の未編集コピーまたは Git がファイルとして取得したリンク、
 * user: 編集済み、別のリンク、追加ファイルなど、保持すべき利用者の内容。
 */
export type SkillLinkSpot = 'missing' | 'link' | 'copy' | 'released' | 'user';

/**
 * Finder/Explorer やネットワーク・FAT ボリュームが自動で置くファイル。
 * 利用者の内容を含まないため、独自スキルと判定する根拠にはしない。
 */
const OS_JUNK = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
export const isOsJunk = (name: string) => OS_JUNK.has(name) || name.startsWith('._');

/**
 * linkPath から <project>/.agents/skills/<skill> へのリンク文字列。
 * リンクを置く実フォルダからの相対パスとし、.agents 自体のリンク先ではなく
 * .agents の表記を経由する。これにより .agents のリンク先が移動しても壊れない。
 */
export function skillLinkText(linkPath: string, targetDir: string): string {
  const projectRoot = path.dirname(path.dirname(path.dirname(targetDir)));
  const target = path.join(realOrSelf(projectRoot), path.relative(projectRoot, targetDir));
  return path.relative(realOrSelf(path.dirname(linkPath)), target);
}

function realOrSelf(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

function linkPointsTo(linkPath: string, linked: string, targetDir: string): boolean {
  const normalized = linked.replace(/\\/g, '/');
  if (path.resolve(path.dirname(linkPath), normalized) === path.resolve(targetDir)) return true;
  if (path.resolve(realOrSelf(path.dirname(linkPath)), normalized) === path.resolve(realOrSelf(path.dirname(targetDir)), path.basename(targetDir))) return true;
  try {
    return fs.realpathSync(linkPath) === fs.realpathSync(targetDir);
  } catch {
    return false;
  }
}

/**
 * スキルのリンク作成先を分類する。sharedContent は共有コピーが保持する
 * （dry-run では今後保持する）SKILL.md の内容。
 */
export function classifySkillLinkSpot(
  linkPath: string,
  targetDir: string,
  sharedContent: string | readonly string[],
  view: FileView = DISK_VIEW
): SkillLinkSpot {
  // すべて view を介し、dry-run でも先に計画したリンクや移動後のファイルを
  // 実行時のディスクと同じように参照する。
  const linked = view.linkTarget?.(linkPath);
  if (linked !== undefined) return linkPointsTo(linkPath, linked, targetDir) ? 'link' : 'user';
  if (!view.exists(linkPath)) return 'missing';
  if (!view.isDirectory(linkPath)) {
    // リンク非対応の Git（Windows 既定の core.symlinks=false）では、
    // リンク先パスを書いた小さなファイルとして取得される。
    // OpenSpec の生成物として置換できるよう released を返す。
    return isCheckedOutLink(linkPath, targetDir, view) ? 'released' : 'user';
  }
  let entries: string[];
  try {
    entries = view.listDirectory ? view.listDirectory(linkPath) : fs.readdirSync(linkPath);
  } catch {
    return 'user';
  }
  entries = entries.filter((name) => !isOsJunk(name));
  // 中断や SKILL.md の削除で残った空フォルダには利用者の内容がない。
  if (entries.length === 0) return 'missing';
  if (entries.length !== 1 || entries[0] !== 'SKILL.md') return 'user';
  const skillFile = path.join(linkPath, 'SKILL.md');
  if (view.linkTarget?.(skillFile) !== undefined || view.isDirectory(skillFile)) return 'user';
  let content: string;
  try {
    content = view.read(skillFile);
  } catch {
    return 'user';
  }
  if (matchesAny(content, sharedContent)) return 'copy';
  return isReleasedGeneratedContent(content) ? 'released' : 'user';
}

/**
 * リンクを作れない Git が targetDir へのリンクを通常ファイルとして
 * 書き出したものか。リンク先文字列だけを認め、区切りは両方に対応する。
 */
export function isCheckedOutLink(filePath: string, targetDir: string, view: FileView = DISK_VIEW): boolean {
  let text: string;
  try {
    text = view.read(filePath);
  } catch {
    return false;
  }
  if (text.length > 1024) return false;
  const linked = text.trim();
  if (linked === '' || linked.includes('\n')) return false;
  return linkPointsTo(filePath, linked, targetDir);
}

/** 内容が現行・以前の共有コピーのいずれかと一致するか。 */
function matchesAny(content: string, sharedContent: string | readonly string[]): boolean {
  const normalized = normalizeGeneratedContent(content);
  const texts = typeof sharedContent === 'string' ? [sharedContent] : sharedContent;
  return texts.some((text) => normalizeGeneratedContent(text) === normalized);
}

/**
 * フォルダ内の SKILL.md だけを分類する。他のファイルは無視する。
 * 利用者のメモが隣にあっても、生成ファイル自体は未編集の場合がある。
 */
export function classifySkillFile(
  skillDir: string,
  sharedContent: string | readonly string[],
  view: FileView = DISK_VIEW
): 'missing' | 'copy' | 'released' | 'user' {
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (view.linkTarget?.(skillDir) !== undefined || view.linkTarget?.(skillFile) !== undefined) return 'user';
  if (!view.exists(skillFile)) return 'missing';
  if (view.isDirectory(skillFile)) return 'user';
  let content: string;
  try {
    content = view.read(skillFile);
  } catch {
    return 'user';
  }
  if (matchesAny(content, sharedContent)) return 'copy';
  return isReleasedGeneratedContent(content) ? 'released' : 'user';
}

/**
 * copy/released の作成先を targetDir への相対リンクに置き換える。
 * 作成不能ならコピーする。呼び出し元で先に分類し、user は置換しない。
 */
export function createSkillLink(
  linkPath: string,
  targetDir: string,
  symlink: (target: string, linkPath: string, type: 'dir') => void = fs.symlinkSync
): 'link' | 'copy' {
  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(linkPath) || isSymlink(linkPath)) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  try {
    symlink(skillLinkText(linkPath, targetDir), linkPath, 'dir');
    return 'link';
  } catch {
    // コピーはスキル本体だけ。OS の補助ファイルや利用者のメモは含めない。
    fs.mkdirSync(linkPath, { recursive: true });
    fs.copyFileSync(path.join(targetDir, 'SKILL.md'), path.join(linkPath, 'SKILL.md'));
    return 'copy';
  }
}

function isSymlink(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}
