/**
 * SourceCraft Code Assistant コマンドアダプター
 *
 * SourceCraft Code Assistant の VS Code 拡張機能向けにコマンドを整形します。
 *
 * @see https://sourcecraft.dev/portal/docs/en/code-assistant/operations/agent/slash-commands
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * コマンド生成用の SourceCraft Code Assistant アダプター。
 * ファイルパス: .codeassistant/commands/opsx-<id>.md
 * 形式: description を含む YAML frontmatter
 */
export const codeassistantAdapter: ToolCommandAdapter = {
  toolId: 'codeassistant',

  getFilePath(commandId: string): string {
    return path.join('.codeassistant', 'commands', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
