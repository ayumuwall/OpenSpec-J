/**
 * Cline コマンドアダプター
 *
 * コマンドをツール仕様に合わせて整形する。
 * Cline は YAML フロントマターではなく Markdown 見出しを使う。
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Cline のコマンド生成アダプター。
 * ファイルパス: .clinerules/workflows/opsx-<id>.md
 * 形式: 説明付き Markdown 見出し
 */
export const clineAdapter: ToolCommandAdapter = {
  toolId: 'cline',

  getFilePath(commandId: string): string {
    return path.join('.clinerules', 'workflows', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `# ${content.name}

${content.description}

${content.body}
`;
  },
};
