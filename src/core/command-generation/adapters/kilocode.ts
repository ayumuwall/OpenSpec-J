/**
 * Kilo Code コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 * Kilo Code workflows don't use frontmatter.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Kilo Code のコマンド生成アダプター。
 * ファイルパス: .kilo/command/opsx-<id>.md
 * 形式: Plain markdown without frontmatter
 */
export const kilocodeAdapter: ToolCommandAdapter = {
  toolId: 'kilocode',

  getFilePath(commandId: string): string {
    return path.join('.kilo', 'command', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `${content.body}
`;
  },
};
