/**
 * Amazon Q Developer コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Amazon Q のコマンド生成アダプター。
 * ファイルパス: .amazonq/prompts/opsx-<id>.md
 * フロントマター: description
 *
 * Amazon Q では、これらのファイルはスラッシュコマンドではなくプロンプトライブラリとして
 * 表示されるため、ユーザーは `/opsx-propose` ではなく `@opsx-propose` と入力する。
 * https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-prompts.html
 */
export const amazonQAdapter: ToolCommandAdapter = {
  toolId: 'amazon-q',

  getFilePath(commandId: string): string {
    return path.join('.amazonq', 'prompts', `opsx-${commandId}.md`);
  },

  invocationPrefix: '@',

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
