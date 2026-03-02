/**
 * OpenSpec のテンプレート再エクスポート。
 *
 * 旧設定ファイルテンプレート（AGENTS.md, project.md, claude-template など）は削除済み。
 * スキルベースのワークフローでは skill-templates.ts を直接使用する。
 */

// 互換性ファサード経由でスキルテンプレートと関連型をすべて再エクスポート。
export * from './skill-templates.js';
