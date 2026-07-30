/**
 * Zoo Code コマンドアダプター
 *
 * Zoo Codeのワークフロー仕様に合わせてコマンドを整形する。
 * YAMLフロントマターではなくMarkdown見出しを使う。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Zoo Code のコマンド生成アダプター。
 * File path: .roo/commands/opsx-<id>.md
 * 形式: 説明付きMarkdown見出し
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
