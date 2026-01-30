/**
 * Continue コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Continue のコマンド生成アダプター。
 * ファイルパス: .continue/prompts/opsx-<id>.prompt
 * フロントマター: name, description, invokable
 */
export const continueAdapter: ToolCommandAdapter = {
  toolId: 'continue',

  getFilePath(commandId: string): string {
    return path.join('.continue', 'prompts', `opsx-${commandId}.prompt`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: opsx-${content.id}
description: ${content.description}
invokable: true
---

${content.body}
`;
  },
};
