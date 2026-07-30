/**
 * Lingma コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue, formatTagsArray } from '../yaml.js';

/**
 * Lingma コマンド生成アダプター。
 * ファイルパス: .lingma/commands/opsx/<id>.md
 * フロントマター: name, description, category, tags
 */
export const lingmaAdapter: ToolCommandAdapter = {
  toolId: 'lingma',

  getFilePath(commandId: string): string {
    return path.join('.lingma', 'commands', 'opsx', `${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
category: ${escapeYamlValue(content.category)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
  },
};
