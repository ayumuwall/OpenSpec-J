/**
 * Codex コマンドアダプター
 *
 * Codex のフロントマター仕様に合わせてコマンドを整形する。
 * Codex のカスタムプロンプトはグローバルホーム (~/.codex/prompts/) に置かれ、
 * リポジトリには共有されない。CODEX_HOME で ~/.codex を上書きできる。
 */

import os from 'os';
import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Codex のホームディレクトリを返す。
 * CODEX_HOME を優先し、未指定なら ~/.codex を使う。
 */
function getCodexHome(): string {
  const envHome = process.env.CODEX_HOME?.trim();
  return path.resolve(envHome ? envHome : path.join(os.homedir(), '.codex'));
}

/**
 * Codex のコマンド生成アダプター。
 * ファイルパス: <CODEX_HOME>/prompts/opsx-<id>.md（絶対パス・グローバル）
 * フロントマター: description, argument-hint
 */
export const codexAdapter: ToolCommandAdapter = {
  toolId: 'codex',

  getFilePath(commandId: string): string {
    return path.join(getCodexHome(), 'prompts', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${content.description}
argument-hint: コマンド引数
---

${content.body}
`;
  },
};
