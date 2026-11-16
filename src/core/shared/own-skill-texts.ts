/**
 * ツール専用フォルダ（MiniMax の ~/.minimax/skills など）のスキルが、
 * OpenSpec の生成物か利用者のものかを判別する。現行版または公開済み版の
 * 生成内容だけを OpenSpec のものとする。リンク、フォルダの代わりにあるファイル、
 * 編集済み SKILL.md は利用者のものとして扱う。
 */
import path from 'path';
import { createRequire } from 'module';
import { getTransformerForTool, transformToSharedSkillReferences } from '../../utils/command-references.js';
import { resolveCommandInvocation, resolveCommandSurfaceCapability } from '../command-surface.js';
import type { FileView } from '../file-view.js';
import { everySkillRendering } from './skill-generation.js';
import { classifySkillFile } from './skill-links.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../../package.json') as { version: string };

/** 現行版がツール専用フォルダの dirName に生成し得る全テキスト。 */
export function ownSkillTexts(toolId: string, dirName: string, version: string = OPENSPEC_VERSION): string[] {
  const key = `${version}\0${toolId}\0${dirName}`;
  const cached = ownTextCache.get(key);
  if (cached) return cached;
  const transformer = getTransformerForTool(
    toolId,
    'skills',
    resolveCommandSurfaceCapability(toolId),
    resolveCommandInvocation(toolId)
  );
  const texts = everySkillRendering(dirName, version, transformer);
  ownTextCache.set(key, texts);
  return texts;
}
const ownTextCache = new Map<string, string[]>();

/** 現行版が共有 .agents/skills の dirName に生成し得る全テキスト。 */
export function sharedSkillTexts(dirName: string, version: string = OPENSPEC_VERSION): string[] {
  const key = `${version}\0${dirName}`;
  let texts = sharedTextCache.get(key);
  if (!texts) {
    texts = everySkillRendering(dirName, version, transformToSharedSkillReferences);
    sharedTextCache.set(key, texts);
  }
  return texts;
}
const sharedTextCache = new Map<string, string[]>();

/**
 * 専用フォルダ内のスキルを分類する。link と user は利用者のもの、
 * ours は OpenSpec の SKILL.md（隣に利用者の別ファイルがあっても同じ）、
 * missing は SKILL.md がないフォルダを示す。
 */
export function classifyOwnSkill(
  skillDir: string,
  toolId: string,
  dirName: string,
  view: FileView,
  version?: string
): 'link' | 'user' | 'ours' | 'missing' {
  if (view.linkTarget?.(skillDir) !== undefined || view.linkTarget?.(path.join(skillDir, 'SKILL.md')) !== undefined) {
    return 'link';
  }
  if (!view.isDirectory(skillDir)) return 'user';
  const spot = classifySkillFile(skillDir, ownSkillTexts(toolId, dirName, version), view);
  if (spot === 'missing') return 'missing';
  return spot === 'user' ? 'user' : 'ours';
}
