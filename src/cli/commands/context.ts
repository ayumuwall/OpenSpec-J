import { Command, Option } from 'commander';
import { COMMAND_REGISTRY } from '../../core/completions/command-registry.js';
import { COMMON_FLAGS } from '../../core/completions/shared-flags.js';
import type { ContextOptions } from '../../commands/context.js';

export function registerContextCommand(program: Command): void {
  const description =
    COMMAND_REGISTRY.find((entry) => entry.name === 'context')?.description ??
    '解決済みの OpenSpec ルートに対する作業コンテキストを表示';

  program
    .command('context')
    .description(description)
    .option('--store <id>', COMMON_FLAGS.store.description)
    .addOption(
      new Option('--store-path <path>', '削除済みです。ストアを登録して --store を使ってください').hideHelp()
    )
    .option('--json', 'エージェント向け概要を JSON として出力')
    .option('--code-workspace <path>', 'このセットの VS Code ワークスペースファイルも書き出す')
    .option('--force', '既存の --code-workspace ファイルを上書き')
    .action(async (options: ContextOptions) => {
      const { contextCommand } = await import('../../commands/context.js');
      await contextCommand(options);
    });
}
