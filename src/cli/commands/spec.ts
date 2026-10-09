import { Command } from 'commander';
import type { ShowOptions } from '../../commands/spec.js';

export function registerSpecCommand(rootProgram: Command) {
  const specCommand = rootProgram
    .command('spec')
    .description('OpenSpec の仕様を閲覧・管理');

  // Deprecation notice for noun-based commands
  specCommand.hook('preAction', () => {
    console.error('警告: "openspec spec ..." コマンドは非推奨です。"openspec show" や "openspec validate --specs" など動詞先行のコマンドを使ってください。');
  });

  specCommand
    .command('show [spec-id]')
    .description('特定の仕様を表示')
    .option('--json', 'JSON で出力')
    .option('--requirements', 'JSON専用: 要件のみ表示（シナリオ除外）')
    .option('--no-scenarios', 'JSON専用: シナリオを除外')
    .option('-r, --requirement <id>', 'JSON専用: 指定 ID(1始まり) の要件のみ表示')
    .option('--no-interactive', '対話プロンプトを無効化')
    .action(async (specId: string | undefined, options: ShowOptions & { noInteractive?: boolean }) => {
      const { specShowCommand } = await import('../../commands/spec.js');
      await specShowCommand(specId, options);
    });

  specCommand
    .command('list')
    .description('利用可能な仕様を一覧表示')
    .option('--json', 'JSON で出力')
    .option('--long', 'ID とタイトルを件数付きで表示')
    .action(async (options: { json?: boolean; long?: boolean }) => {
      const { specListCommand } = await import('../../commands/spec.js');
      await specListCommand(options);
    });

  specCommand
    .command('validate [spec-id]')
    .description('仕様の構造を検証')
    .option('--strict', '厳密検証モードを有効化')
    .option('--json', '検証レポートを JSON 出力')
    .option('--no-interactive', '対話プロンプトを無効化')
    .action(async (specId: string | undefined, options: { strict?: boolean; json?: boolean; noInteractive?: boolean }) => {
      const { specValidateCommand } = await import('../../commands/spec.js');
      await specValidateCommand(specId, options);
    });

  return specCommand;
}
