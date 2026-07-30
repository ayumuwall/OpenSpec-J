/**
 * Gemini CLI Command Adapter
 *
 * Formats commands for Gemini CLI following its TOML specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * 制御文字（タブ・改行・復帰を除くC0とDEL）はTOML文字列では無効なため、
 * エスケープして書き込む必要がある。
 */
const TOML_CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]', 'g');

/**
 * TOMLの基本文字列ではエスケープが有効になる。バックスラッシュや二重引用符を
 * そのまま書くとファイルが壊れる。単一行の基本文字列には改行も書けないため、
 * あわせてエスケープする。
 */
function escapeTomlBasicString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(TOML_CONTROL_CHARS, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/**
 * 複数行の基本文字列では改行とタブをそのまま保持するが、バックスラッシュには
 * 引き続きエスケープが必要で、二重引用符3個の並びは文字列を終了させる。
 * 単一行と同じ制御文字（単独の復帰を含む）も無効になる。CRLFはLFへ正規化し、
 * バックスラッシュを二重化した後でエスケープを追加して再二重化を防ぐ。
 */
function escapeTomlMultilineBasicString(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '""\\"')
    .replace(/\r/g, '\\r')
    .replace(TOML_CONTROL_CHARS, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

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
