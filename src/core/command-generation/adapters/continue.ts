/**
 * Continue コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

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
name: ${escapeYamlValue(`opsx-${content.id}`)}
description: ${escapeYamlValue(content.description)}
invokable: true
---

${content.body}
`;
  },
};
