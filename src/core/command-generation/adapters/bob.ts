/**
 * Bob Shell コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 * コマンドは .bob/commands/ ディレクトリに保存される。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Bob Shell コマンド生成アダプター。
 * ファイルパス: .bob/commands/opsx-<id>.md
 * Frontmatter: description
 *
 * Bobはファイル名（.mdを除く）をスラッシュコマンド名として使うため、
 * opsx-propose.md → /opsx-propose となる。generateCommandはアダプターで
 * 整形する前に、本文中のコマンド参照をこの形式へ変換する。
 */
export const bobAdapter: ToolCommandAdapter = {
  toolId: 'bob',

  getFilePath(commandId: string): string {
    return path.join('.bob', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: コマンド引数
---

${content.body}
`;
  },
};
