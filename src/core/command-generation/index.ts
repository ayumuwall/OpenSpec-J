/**
 * コマンド生成モジュール
 *
 * ツール固有アダプターを使った汎用コマンド生成システム。
 *
 * 使い方:
 * ```typescript
 * import { generateCommands, CommandAdapterRegistry, type CommandContent } from './command-generation/index.js';
 *
 * const contents: CommandContent[] = [...];
 * const adapter = CommandAdapterRegistry.get('cursor');
 * if (adapter) {
 *   const commands = generateCommands(contents, adapter);
 *   // コマンドをディスクに書き込む
 * }
 * ```
 */

// 型
export type {
  CommandContent,
  ToolCommandAdapter,
  GeneratedCommand,
} from './types.js';

// レジストリ
export { CommandAdapterRegistry } from './registry.js';

// 生成関数
export { generateCommand, generateCommands } from './generator.js';

// アダプター（直接参照が必要な場合）
export { claudeAdapter, cursorAdapter, windsurfAdapter } from './adapters/index.js';
