import type { ProjectConfig } from './project-config.js';

/**
 * Serialize config to YAML string with helpful comments.
 *
 * @param config - Partial config object (schema required, context/rules optional)
 * @returns YAML string ready to write to file
 */
export function serializeConfig(config: Partial<ProjectConfig>): string {
  const lines: string[] = [];

  // Schema (required)
  lines.push(`schema: ${config.schema}`);
  lines.push('');

  // Context section with comments
  lines.push('# プロジェクトの文脈（任意）');
  lines.push('# アーティファクト作成時に AI に提示されます。');
  lines.push('# 技術スタック、慣習、スタイルガイド、ドメイン知識などを追加します。');
  lines.push('# 例:');
  lines.push('#   context: |');
  lines.push('#     技術スタック: TypeScript, React, Node.js');
  lines.push('#     Conventional Commits を使用');
  lines.push('#     ドメイン: EC プラットフォーム');
  lines.push('');

  // Rules section with comments
  lines.push('# アーティファクト別ルール（任意）');
  lines.push('# 特定のアーティファクト向けにカスタムルールを追加します。');
  lines.push('# 例:');
  lines.push('#   rules:');
  lines.push('#     proposal:');
  lines.push('#       - 提案は 500 語以内にする');
  lines.push('#       - "Non-goals" セクションを必ず含める');
  lines.push('#     tasks:');
  lines.push('#       - タスクは最大 2 時間の粒度に分割する');

  return lines.join('\n') + '\n';
}
