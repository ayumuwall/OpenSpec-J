/**
 * スキル生成ユーティリティ
 *
 * スキル/コマンドファイル生成の共通ユーティリティ。
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getOpsxOnboardCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';

/**
 * スキルテンプレートとディレクトリ名の対応。
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
}

/**
 * コマンドテンプレートと ID の対応。
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getOpsxExploreCommandTemplate>;
  id: string;
}

/**
 * すべてのスキルテンプレートとディレクトリ名を取得する。
 */
export function getSkillTemplates(): SkillTemplateEntry[] {
  return [
    { template: getExploreSkillTemplate(), dirName: 'openspec-explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'openspec-new-change' },
    { template: getContinueChangeSkillTemplate(), dirName: 'openspec-continue-change' },
    { template: getApplyChangeSkillTemplate(), dirName: 'openspec-apply-change' },
    { template: getFfChangeSkillTemplate(), dirName: 'openspec-ff-change' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'openspec-sync-specs' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'openspec-archive-change' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'openspec-bulk-archive-change' },
    { template: getVerifyChangeSkillTemplate(), dirName: 'openspec-verify-change' },
    { template: getOnboardSkillTemplate(), dirName: 'openspec-onboard' },
  ];
}

/**
 * すべてのコマンドテンプレートと ID を取得する。
 */
export function getCommandTemplates(): CommandTemplateEntry[] {
  return [
    { template: getOpsxExploreCommandTemplate(), id: 'explore' },
    { template: getOpsxNewCommandTemplate(), id: 'new' },
    { template: getOpsxContinueCommandTemplate(), id: 'continue' },
    { template: getOpsxApplyCommandTemplate(), id: 'apply' },
    { template: getOpsxFfCommandTemplate(), id: 'ff' },
    { template: getOpsxSyncCommandTemplate(), id: 'sync' },
    { template: getOpsxArchiveCommandTemplate(), id: 'archive' },
    { template: getOpsxBulkArchiveCommandTemplate(), id: 'bulk-archive' },
    { template: getOpsxVerifyCommandTemplate(), id: 'verify' },
    { template: getOpsxOnboardCommandTemplate(), id: 'onboard' },
  ];
}

/**
 * コマンドテンプレートを CommandContent 配列に変換する。
 */
export function getCommandContents(): CommandContent[] {
  const commandTemplates = getCommandTemplates();
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * YAML フロントマター付きのスキルファイル内容を生成する。
 *
 * @param template - スキルテンプレート
 * @param generatedByVersion - ファイルに埋め込む OpenSpec バージョン
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string
): string {
  return `---
name: ${template.name}
description: ${template.description}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'OpenSpec CLI が必要です。'}
metadata:
  author: ${template.metadata?.author || 'openspec'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${template.instructions}
`;
}
