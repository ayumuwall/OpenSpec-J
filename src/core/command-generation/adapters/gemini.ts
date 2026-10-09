/**
 * Gemini CLI Command Adapter
 *
 * Formats commands for Gemini CLI following its TOML specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

import { escapeTomlBasicString, escapeTomlMultilineBasicString } from '../toml.js';

/**
 * Gemini のコマンド生成アダプター。
 * ファイルパス: .gemini/commands/opsx/<id>.toml
 * 形式: description と prompt フィールドを持つTOML
 */
export const geminiAdapter: ToolCommandAdapter = {
  toolId: 'gemini',

  getFilePath(commandId: string): string {
    return path.join('.gemini', 'commands', 'opsx', `${commandId}.toml`);
  },

  formatFile(content: CommandContent): string {
    return `description = "${escapeTomlBasicString(content.description)}"

prompt = """
${escapeTomlMultilineBasicString(content.body)}
"""
`;
  },
};
