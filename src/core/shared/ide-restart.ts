/**
 * IDE 再起動の案内
 *
 * init または update で正常に設定されたツールに共通する再起動案内。
 * 生成ファイルをすべて削除する空のワークフロー選択を含め、追加・更新・削除を
 * 同じ文言で扱う。
 */

import { AI_TOOLS } from '../config.js';
import {
  shouldGenerateCommandsForTool,
  shouldGenerateSkillsForTool,
} from '../command-surface.js';
import type { Delivery } from '../global-config.js';

/** 再起動案内で示すサーフェス。案内が不要な場合は存在しない。 */
export type IdeRestartSurface = 'commands' | 'skills';

function isIdeResident(toolId: string): boolean {
  return Boolean(
    AI_TOOLS.find((tool) => tool.value === toolId)?.requiresIdeRestart
  );
}

/**
 * 2つの条件は同じツールに結び付けたままにする。サーフェスが常駐エディター
 * プロセスに読み込まれること（CLI は即座に読み込むため再起動案内は誤り。#1067）と、
 * 現在の delivery で生成サーフェスに対応すること。CLI ツールのコマンドを、
 * スキルだけに対応する IDE ツールの案内判定に使ってはならない。現在の delivery で
 * 両方に対応する場合はコマンドを優先する。
 */
export function resolveIdeRestartSurface(
  toolIds: readonly string[],
  delivery: Delivery
): IdeRestartSurface | null {
  const ideTools = [...new Set(toolIds)].filter(isIdeResident);

  if (ideTools.some((toolId) => shouldGenerateCommandsForTool(toolId, delivery))) {
    return 'commands';
  }

  if (ideTools.some((toolId) => shouldGenerateSkillsForTool(toolId, delivery))) {
    return 'skills';
  }

  return null;
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
