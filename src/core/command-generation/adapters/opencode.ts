/**
 * OpenCode コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

const OPENCODE_INPUT_BLOCK = /^\*\*(?:Input|入力)\*\*:[^\r\n]*(?:\r?\n(?!\r?\n)[^\r\n]*)*/m;
const OPENCODE_NO_INPUT = /^\*\*(?:Input|入力)\*\*:\s*(?:None required|不要)\b/im;
const OPENCODE_ARGUMENT_PLACEHOLDER = /\$(?:ARGUMENTS\b|[1-9]\d*\b)/;

function injectOpenCodeArgs(body: string): string {
  if (OPENCODE_ARGUMENT_PLACEHOLDER.test(body) || OPENCODE_NO_INPUT.test(body)) {
    return body;
  }

  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  return body.replace(
    OPENCODE_INPUT_BLOCK,
    (input) => `${input}${eol}**指定された引数**: $ARGUMENTS`
  );
}

/**
 * OpenCode のコマンド生成アダプター。
 * ファイルパス: .opencode/commands/opsx-<id>.md
 * フロントマター: description。OpenCodeは明示的なプレースホルダーを介してのみ引数を渡すため、
 * 完全な入力契約の後に $ARGUMENTS を挿入する。
 */
export const opencodeAdapter: ToolCommandAdapter = {
  toolId: 'opencode',

  getFilePath(commandId: string): string {
    return path.join('.opencode', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${injectOpenCodeArgs(content.body)}
`;
  },
};
