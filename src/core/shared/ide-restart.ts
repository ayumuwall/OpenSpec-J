/**
 * IDE 再起動の案内
 *
 * init または update で正常に設定されたツールに共通する再起動案内。
 * 生成ファイルをすべて削除する空のワークフロー選択を含め、追加・更新・削除を
 * 同じ文言で扱う。
 */

import { AI_TOOLS } from '../config.js';
import type { Delivery } from '../global-config.js';

/** 再起動案内で示すサーフェス。案内が不要な場合は存在しない。 */
export type IdeRestartSurface = 'commands' | 'skills';

function isIdeResident(toolId: string): boolean {
  return Boolean(
    AI_TOOLS.find((tool) => tool.value === toolId)?.requiresIdeRestart
  );
}

/**
 * スキルを常駐エディタープロセスで読み込むツールだけに再起動を案内する。
 * CLI は即座に読み込むため再起動案内は不要（#1067）。
 * 2.0 はスキルだけを導入するので、delivery は判定に影響しない。
 */
export function resolveIdeRestartSurface(
  toolIds: readonly string[],
  _delivery: Delivery
): IdeRestartSurface | null {
  const ideTools = [...new Set(toolIds)].filter(isIdeResident);
  return ideTools.length > 0 ? 'skills' : null;
}

/**
 * 表示する再起動案内。再起動が不要なら null。Amazon Q の生成ファイルは `@` で
 * 呼び出すプロンプトライブラリエントリなので、意図的に「スラッシュコマンド」とは
 * 表現しない。
 */
export function formatIdeRestart(
  toolIds: readonly string[],
  delivery: Delivery
): string | null {
  const surface = resolveIdeRestartSurface(toolIds, delivery);
  if (!surface) return null;
  const surfaceLabel = surface === 'commands' ? 'コマンド' : 'スキル';
  return `IDEを再起動して${surfaceLabel}を再読み込みしてください。`;
}
