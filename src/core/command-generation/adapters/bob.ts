/**
 * Bob Shell コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 * コマンドは .bob/commands/ ディレクトリに保存される。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { transformToHyphenCommands } from '../../../utils/command-references.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Bob Shell コマンド生成アダプター。
 * ファイルパス: .bob/commands/opsx-<id>.md
 * フロントマター: description, argument-hint
 */
export const bobAdapter: ToolCommandAdapter = {
  toolId: 'bob',

  getFilePath(commandId: string): string {
    return path.join('.bob', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    // コロン形式のコマンド参照をハイフン形式に変換（Bob 用）
    const transformedBody = transformToHyphenCommands(content.body);

    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: コマンド引数
---

${transformedBody}
`;
  },
};
