/**
 * The one kebab id grammar. Store ids, change ids, and legacy initiative ids
 * all share it.
 */
export const KEBAB_ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function isKebabId(value: string): boolean {
  return KEBAB_ID_REGEX.test(value);
}

/** Human rendering of the grammar, shared so the wording never forks. */
export const KEBAB_ID_DESCRIPTION =
  'は小文字、数字、単一のハイフン区切りによる kebab-case でなければなりません';

/** The fix-line twin of KEBAB_ID_DESCRIPTION, shared for the same reason. */
export const KEBAB_ID_FIX =
  '小文字、数字、単一のハイフン区切りによる kebab-case を使用してください。';

/**
 * The folder-safe-name grammar (store ids layer the kebab grammar on
 * top of it; workset member labels use it alone). Returns a problem
 * description, or null when valid.
 */
export function folderStyleNameProblem(
  value: string,
  label: string
): string | null {
  if (value.length === 0) {
    return `${label}を空にすることはできません`;
  }

  if (value === '.' || value === '..') {
    return `${label}に '${value}' は使用できません`;
  }

  if (/[\\/]/u.test(value)) {
    return `${label}にパス区切り文字を含めることはできません`;
  }

  return null;
}
