import type { ProjectConfig } from './project-config.js';

/**
 * Serialize config to YAML string with helpful comments.
 *
 * @param config - Partial config object (schema required, other fields optional)
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
  lines.push('#     言語：日本語');
  lines.push('#     技術スタック: TypeScript, React, Node.js');
  lines.push('#     Conventional Commits を使用');
  lines.push('#     ドメイン: EC プラットフォーム');
  lines.push('#');
  lines.push('#     規範語ルール:');
  lines.push('#     - 規範要件は SHALL/MUST を使う（SHOULD/MAY は避ける）');
  lines.push('#     - 語尾は「〜しなければならない。(SHALL)」の形式に揃える');
  lines.push('#     - 文中に SHALL/MUST を挿入しない');
  lines.push('#');
  lines.push('#     技術用語の扱い:');
  lines.push('#     - "API", "REST", "GraphQL" などの技術用語は英語のまま');
  lines.push('#     - 必要なら日本語訳する用語を明示');
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
  lines.push('');

  // 操作ごとのガイダンス（コメント付き）
  lines.push('# 操作ごとのガイダンス（任意）');
  lines.push('# apply や archive をどのように進めるかについて、助言となる指示を追加します。');
  lines.push('# 上記のアーティファクトルールとは別の設定です。');
  lines.push('# 例:');
  lines.push('#   operations:');
  lines.push('#     apply:');
  lines.push('#       guidance:');
  lines.push('#         - テスト結果の要約は簡潔にする');
  lines.push('#     archive:');
  lines.push('#       guidance:');
  lines.push('#         - 完了前にアーカイブ結果を要約する');

  return lines.join('\n') + '\n';
}
