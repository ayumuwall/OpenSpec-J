/**
 * Factory Droid コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Factory のコマンド生成アダプター。
 * ファイルパス: .factory/commands/opsx-<id>.md
 * フロントマター: description, argument-hint
 */
export const factoryAdapter: ToolCommandAdapter = {
  toolId: 'factory',

  getFilePath(commandId: string): string {
    return path.join('.factory', 'commands', `opsx-${commandId}.md`);
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
