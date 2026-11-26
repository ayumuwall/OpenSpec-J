/**
 * Core template types for skills and slash commands.
 */

export interface SkillTemplate {
  name: string;
  description: string;
  instructions: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  /**
   * SKILL.md の補足資料。各項目を同じフォルダの `references/<file>` に配置し、
   * 読むタイミングは SKILL.md に記載する。
   *
   * 生成する SKILL.md の `metadata.references` には、補足資料の短いハッシュを入れる。
   * 補足資料を編集するとハッシュと SKILL.md が変わるため、
   * `openspec update` がスキル全体を再インストールする。
   */
  references?: Record<string, string>;
}

export interface CommandTemplate {
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
}
