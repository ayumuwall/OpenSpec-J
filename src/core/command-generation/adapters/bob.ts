/**
 * Bob Shell コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 * コマンドは .bob/commands/ ディレクトリに保存される。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { transformToHyphenCommands } from '../../../utils/command-references.js';

/**
 * Escapes a string value for safe YAML output.
 * Quotes the string if it contains special YAML characters.
 */
function escapeYamlValue(value: string): string {
  // Check if value needs quoting (contains special YAML characters or starts/ends with whitespace)
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    // Use double quotes and escape internal double quotes and backslashes
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Bob Shell コマンド生成アダプター。
 * ファイルパス: .bob/commands/opsx-<id>.md
 * フロントマター: description, argument-hint
 */
export const bobAdapter: ToolCommandAdapter = {
  toolId: 'bob',

  getFilePath(commandId: string): string {
    return path.join('.bob', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    // コロン形式のコマンド参照をハイフン形式に変換（Bob 用）
    const transformedBody = transformToHyphenCommands(content.body);

    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: コマンド引数
---

${transformedBody}
`;
  },
};
