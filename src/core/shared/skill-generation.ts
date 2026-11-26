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
  getUpdateChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxProposeSkillTemplate,
  getRouterSkillTemplate,
  ROUTER_SKILL_NAME,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxProposeCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import { createHash } from 'node:crypto';
import { OPENSPEC_CLI_ALLOWED_TOOLS } from './allowed-tools.js';

/**
 * スキルテンプレートとディレクトリ名・ワークフロー ID の対応。
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

/**
 * コマンドテンプレートと ID の対応。
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getOpsxExploreCommandTemplate>;
  id: string;
}

/**
 * スキルテンプレートとディレクトリ名を取得する。ワークフロー ID でフィルタ可能。
 *
 * フィルターで変わるのは返すスキルだけで、本文は変わらない。
 * どのワークフロー一覧でも同じスキル本文を使う。
 *
 * @param workflowFilter - 指定した場合、workflowId がこの配列に含まれるテンプレートのみ返す
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const all = allSkillTemplates();
  if (!workflowFilter) return all;
  const wanted = new Set<string>(workflowFilter);
  return all.filter(entry => wanted.has(entry.workflowId));
}

/**
 * リリースごとに変わる frontmatter の generatedBy 行を除去する。
 * 残るのはリポジトリの skills/ とプロジェクトの .agents/skills に置く公開形式。
 * スキルを変更しないリリース間では同じ本文になる。
 */
export function stripVolatileFrontmatter(content: string): string {
  return content.replace(/^ {2}generatedBy: .*\n/m, '');
}

function allSkillTemplates(): SkillTemplateEntry[] {
  return [
    { template: getExploreSkillTemplate(), dirName: 'openspec-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'openspec-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(), dirName: 'openspec-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(), dirName: 'openspec-apply-change', workflowId: 'apply' },
    { template: getUpdateChangeSkillTemplate(), dirName: 'openspec-update-change', workflowId: 'update' },
    { template: getFfChangeSkillTemplate(), dirName: 'openspec-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'openspec-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'openspec-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'openspec-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(), dirName: 'openspec-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(), dirName: 'openspec-onboard', workflowId: 'onboard' },
    { template: getOpsxProposeSkillTemplate(), dirName: 'openspec-propose', workflowId: 'propose' },
    { template: getRouterSkillTemplate(), dirName: ROUTER_SKILL_NAME, workflowId: 'router' },
  ];
}

/**
 * コマンドテンプレートと ID を取得する。ワークフロー ID でフィルタ可能。
 *
 * @param workflowFilter - 指定した場合、id がこの配列に含まれるテンプレートのみ返す
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getOpsxExploreCommandTemplate(), id: 'explore' },
    { template: getOpsxNewCommandTemplate(), id: 'new' },
    { template: getOpsxContinueCommandTemplate(), id: 'continue' },
    { template: getOpsxApplyCommandTemplate(), id: 'apply' },
    { template: getOpsxUpdateCommandTemplate(), id: 'update' },
    { template: getOpsxFfCommandTemplate(), id: 'ff' },
    { template: getOpsxSyncCommandTemplate(), id: 'sync' },
    { template: getOpsxArchiveCommandTemplate(), id: 'archive' },
    { template: getOpsxBulkArchiveCommandTemplate(), id: 'bulk-archive' },
    { template: getOpsxVerifyCommandTemplate(), id: 'verify' },
    { template: getOpsxOnboardCommandTemplate(), id: 'onboard' },
    { template: getOpsxProposeCommandTemplate(), id: 'propose' },
  ];

  if (!workflowFilter) return all;
  const wanted = new Set<string>(workflowFilter);
  return all.filter(entry => wanted.has(entry.id));
}

/**
 * コマンドテンプレートを CommandContent 配列に変換する。ワークフロー ID でフィルタ可能。
 *
 * @param workflowFilter - 指定した場合、id がこの配列に含まれるコンテンツのみ返す
 */
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
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
 * @param transformInstructions - instructions を変換する任意のコールバック
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${template.name}
description: ${template.description}
allowed-tools: ${OPENSPEC_CLI_ALLOWED_TOOLS}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'OpenSpec CLI が必要です。'}
metadata:
  author: ${template.metadata?.author || 'openspec'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
${template.metadata?.references ? `  references: "${template.metadata.references}"\n` : ''}---

${instructions}
`;
}

/**
 * SKILL.md とテンプレートの各 `references/<file>` を、スキルフォルダからの相対パスで返す。
 *
 * SKILL.md のフロントマターの `metadata.references` に、全参照ファイルを対象とする
 * SHA-256 の先頭 12 桁（16 進数）を入れる。これにより、ツールのバージョン確認など
 * SKILL.md だけを比較する処理でも、参照ファイルだけが変わった更新を検出できる。
 */
export function generateSkillFiles(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): Map<string, string> {
  const files = new Map<string, string>();
  const references = Object.entries(template.references ?? {});
  if (!references.length) {
    return files.set('SKILL.md', generateSkillContent(template, generatedByVersion, transformInstructions));
  }
  const digest = createHash('sha256');
  for (const [file, text] of references) {
    const content = transformInstructions ? transformInstructions(text) : text;
    files.set(`references/${file}`, content);
    digest.update(`${file}\n${content}\n`);
  }
  const skill = { ...template, metadata: { ...template.metadata, references: digest.digest('hex').slice(0, 12) } };
  return new Map([['SKILL.md', generateSkillContent(skill, generatedByVersion, transformInstructions)], ...files]);
}
