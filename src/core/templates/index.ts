/**
 * OpenSpec のテンプレート再エクスポート。
 *
 * 旧設定ファイルテンプレート（AGENTS.md, project.md, claude-template など）は削除済み。
 * スキルベースのワークフローでは skill-templates.ts を直接使用する。
 */

// 利便性のためスキルテンプレートを再エクスポート
export {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxVerifyCommandTemplate,
} from './skill-templates.js';
