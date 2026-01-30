/**
 * Auggie (Augment CLI) コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Auggie のコマンド生成アダプター。
 * ファイルパス: .augment/commands/opsx-<id>.md
 * フロントマター: description, argument-hint
 */
export const auggieAdapter: ToolCommandAdapter = {
  toolId: 'auggie',

  getFilePath(commandId: string): string {
    return path.join('.augment', 'commands', `opsx-${commandId}.md`);
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
