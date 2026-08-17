/**
 * Pi Command Adapter
 *
 * Formats commands for Pi (pi.dev) following its prompt template specification.
 * Pi prompt templates live in .pi/prompts/*.md with description frontmatter.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

const PI_INPUT_HEADING = /^\*\*(?:Input|入力)\*\*:[^\n]*$/m;

function injectPiArgs(body: string): string {
  if (body.includes('$@') || body.includes('$ARGUMENTS')) {
    return body;
  }

  return body.replace(
    PI_INPUT_HEADING,
    (heading) => `${heading}\n**入力された引数**: $@`
  );
}

/**
 * Pi adapter for prompt template generation.
 * File path: .pi/prompts/opsx-<id>.md
 * Frontmatter: description
 *
 * Pi はファイル名（.md 除く）をスラッシュコマンド名として使用するため、
 * opsx-propose.md → /opsx-propose となる。generateCommandはアダプターで
 * 整形する前に、本文中のコマンド参照をこの形式へ変換する。
 */
export const piAdapter: ToolCommandAdapter = {
  toolId: 'pi',

  getFilePath(commandId: string): string {
    return path.join('.pi', 'prompts', `opsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${injectPiArgs(content.body)}
`;
  },
};
