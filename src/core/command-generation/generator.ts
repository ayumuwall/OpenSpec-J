/**
 * コマンド生成
 *
 * ツールアダプターを使ってコマンドファイルを生成する関数。
 */

import type { CommandContent, ToolCommandAdapter, GeneratedCommand } from './types.js';

/**
 * 指定されたアダプターで 1 つのコマンドファイルを生成する。
 * @param content - ツール非依存のコマンド内容
 * @param adapter - ツール固有のアダプター
 * @returns パスと内容を含む生成結果
 */
export function generateCommand(
  content: CommandContent,
  adapter: ToolCommandAdapter
): GeneratedCommand {
  return {
    path: adapter.getFilePath(content.id),
    fileContent: adapter.formatFile(content),
  };
}

/**
 * 指定されたアダプターで複数のコマンドファイルを生成する。
 * @param contents - ツール非依存のコマンド内容配列
 * @param adapter - ツール固有のアダプター
 * @returns パスと内容を含む生成結果の配列
 */
export function generateCommands(
  contents: CommandContent[],
  adapter: ToolCommandAdapter
): GeneratedCommand[] {
  return contents.map((content) => generateCommand(content, adapter));
}
