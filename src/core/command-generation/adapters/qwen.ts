/**
 * Qwen Code コマンドアダプター
 *
 * Qwen CodeのMarkdownカスタムコマンド仕様に合わせてコマンドを整形する。
 * Qwen CodeではTOMLコマンドが非推奨となり、YAMLフロントマター付きの
 * Markdownファイルへ移行している。
 *
 * @see https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/#markdown-file-format-specification-recommended
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Qwen のコマンド生成アダプター。
 * File path: .qwen/commands/opsx-<id>.md
 * 形式: descriptionフロントマター付きMarkdown
 */
export const qwenAdapter: ToolCommandAdapter = {
  toolId: 'qwen',

  getFilePath(commandId: string): string {
    return path.join('.qwen', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
