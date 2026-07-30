/**
 * CoStrict コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * CoStrict のコマンド生成アダプター。
 * ファイルパス: .cospec/openspec/commands/opsx-<id>.md
 * フロントマター: description, argument-hint
 */
export const costrictAdapter: ToolCommandAdapter = {
  toolId: 'costrict',

  getFilePath(commandId: string): string {
    return path.join('.cospec', 'openspec', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: コマンド引数
---

${content.body}
`;
  },
};
