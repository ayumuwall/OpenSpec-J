/**
 * RooCode コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 * RooCode は YAML フロントマターではなく Markdown 見出しを使う。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * RooCode のコマンド生成アダプター。
 * ファイルパス: .roo/commands/opsx-<id>.md
 * 形式: 説明付き Markdown 見出し
 */
export const roocodeAdapter: ToolCommandAdapter = {
  toolId: 'roocode',

  getFilePath(commandId: string): string {
    return path.join('.roo', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `# ${content.name}

${content.description}

${content.body}
`;
  },
};
