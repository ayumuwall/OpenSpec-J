import { OPENSPEC_SKILL_NAMES } from '../config.js';
import {
  isReleasedGeneratedContent,
  normalizeGeneratedContent as normalizeGeneratedSkill,
} from './generated-fingerprint.js';

const OPENSPEC_SKILL_NAME_SET = new Set<string>(OPENSPEC_SKILL_NAMES);

/**
 * Converts only known generated dual references in current Codex content back
 * to the direct syntax used by legacy `.codex` output.
 */
function toLegacyCodexReferences(content: string): string {
  return content.replace(
    /\$(openspec-[a-z0-9-]+)(?: \(Codex\) or \/\1 \(other agents\)|（Codex）、\/\1（その他の対応エージェント）)/g,
    (match, skillName: string) =>
      OPENSPEC_SKILL_NAME_SET.has(skillName) ? `$${skillName}` : match
  );
}

/**
 * Returns whether a legacy Codex skill differs from the current canonical
 * replacement only by generated version, checkout line endings/BOM, or the
 * known Codex/generic dual-reference expansion.
 */
export function isLegacyCodexSkillEquivalentToCurrent(
  legacyContent: string,
  currentContent: string
): boolean {
  const normalizedLegacy = normalizeGeneratedSkill(legacyContent);
  const normalizedCurrent = normalizeGeneratedSkill(currentContent);
  return (
    normalizedLegacy === normalizedCurrent ||
    toLegacyCodexReferences(normalizedLegacy) === toLegacyCodexReferences(normalizedCurrent)
  );
}

/**
 * 現行の置き換え先ができた後、旧管理ファイルのコピーを削除できるか。
 * 置き換え先と一致するか、公開済み版の未編集出力であれば編集内容を失わない。
 * それ以外は利用者の変更を含む可能性があるため保持する。
 */
export function isRedundantLegacyCopy(
  legacyContent: string,
  currentContent: string,
  isSkillFile: boolean
): boolean {
  return (
    legacyContent === currentContent ||
    (isSkillFile && isLegacyCodexSkillEquivalentToCurrent(legacyContent, currentContent)) ||
    isReleasedGeneratedContent(legacyContent)
  );
}
