/**
 * Antigravity コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Antigravity のコマンド生成アダプター。
 * ファイルパス: .agents/workflows/opsx-<id>.md
 * フロントマター: description
 */
export const antigravityAdapter: ToolCommandAdapter = {
  toolId: 'antigravity',

  getFilePath(commandId: string): string {
    return path.join('.agents', 'workflows', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
