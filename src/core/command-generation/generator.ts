/**
 * コマンド生成
 *
 * ツールアダプターを使ってコマンドファイルを生成する関数。
 */

import type { CommandContent, ToolCommandAdapter, GeneratedCommand } from './types.js';
import { getInvocationForAdapter, needsInvocationRewrite } from './invocation.js';
import { transformCommandInvocations } from '../../utils/command-references.js';

/**
 * 指定されたアダプターで 1 つのコマンドファイルを生成する。
 *
 * コマンド本文は `/opsx:<id>` 形式で記述される。ファイル名でコマンドを呼び出す
 * ツールは `/opsx-<id>`、Amazon Q はプロンプトライブラリ上で `@opsx-<id>` として
 * 登録するため、アダプターで整形する前に各ツールが認識する形式へ変換する。
 * アダプターごとではなくここで処理することで、全ツールの挙動を揃える。
 *
 * @param content - ツール非依存のコマンド内容
 * @param adapter - ツール固有のアダプター
 * @returns パスと内容を含む生成結果
 */
export function generateCommand(
  content: CommandContent,
  adapter: ToolCommandAdapter
): GeneratedCommand {
  const invocation = getInvocationForAdapter(adapter);
  const formatted = needsInvocationRewrite(invocation)
    ? { ...content, body: transformCommandInvocations(content.body, invocation) }
    : content;

  return {
    path: adapter.getFilePath(content.id),
    fileContent: adapter.formatFile(formatted),
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
