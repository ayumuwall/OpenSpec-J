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
    // Continue injects an invoked prompt into the model context. Smaller local
    // models can otherwise mistake the workflow name for a tool to call (#925).
    return `---
name: ${escapeYamlValue(`opsx-${content.id}`)}
description: ${escapeYamlValue(content.description)}
invokable: true
---

このワークフロープロンプトはすでに有効です。記載された指示にそのまま従ってください。このワークフローと同名のツールを呼び出してはいけません。

${content.body}
`;
  },
};
