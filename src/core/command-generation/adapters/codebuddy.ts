/**
 * CodeBuddy コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * CodeBuddy のコマンド生成アダプター。
 * ファイルパス: .codebuddy/commands/opsx/<id>.md
 * フロントマター: name, description, argument-hint
 */
export const codebuddyAdapter: ToolCommandAdapter = {
  toolId: 'codebuddy',

  getFilePath(commandId: string): string {
    return path.join('.codebuddy', 'commands', 'opsx', `${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${content.name}
description: "${content.description}"
argument-hint: "[コマンド引数]"
---

${content.body}
`;
  },
};
