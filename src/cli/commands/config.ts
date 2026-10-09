import { Command } from 'commander';

/**
 * Register the config command and all its subcommands.
 *
 * @param program - The Commander program instance
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('グローバルな OpenSpec 設定を表示・変更')
    .option('--scope <scope>', '設定スコープ（現在は "global" のみ対応）')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.scope && opts.scope !== 'global') {
        console.error('エラー: project-local config はまだ実装されていません');
        process.exit(1);
      }
    });

  // config path
  configCmd
    .command('path')
    .description('設定ファイルの場所を表示')
    .action(async () => {
      const { configPathCommand } = await import('../../commands/config.js');
      configPathCommand();
    });

  // config list
  configCmd
    .command('list')
    .description('現在の設定をすべて表示')
    .option('--json', 'JSON で出力')
    .action(async (options: { json?: boolean }) => {
      const { configListCommand } = await import('../../commands/config.js');
      configListCommand(options);
    });

  // config get
  configCmd
    .command('get <key>')
    .description('特定の値を取得（raw、スクリプト向け）')
    .action(async (key: string) => {
      const { configGetCommand } = await import('../../commands/config.js');
      configGetCommand(key);
    });

  // config set
  configCmd
    .command('set <key> <value>')
    .description('値を設定（型は自動変換）')
    .option('--string', '値を文字列として保存')
    .option('--allow-unknown', '未知のキーの設定を許可')
    .action(async (key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      const { configSetCommand } = await import('../../commands/config.js');
      configSetCommand(key, value, options);
    });

  // config unset
  configCmd
    .command('unset <key>')
    .description('キーを削除（デフォルトへ戻す）')
    .action(async (key: string) => {
      const { configUnsetCommand } = await import('../../commands/config.js');
      configUnsetCommand(key);
    });

  // config reset
  configCmd
    .command('reset')
    .description('設定をデフォルトへリセット')
    .option('--all', 'すべての設定をリセット（必須）')
    .option('-y, --yes', '確認プロンプトをスキップ')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      const { configResetCommand } = await import('../../commands/config.js');
      await configResetCommand(options);
    });

  // config edit
  configCmd
    .command('edit')
    .description('$EDITOR で設定を開く')
    .action(async () => {
      const { configEditCommand } = await import('../../commands/config.js');
      await configEditCommand();
    });

  // config profile [preset]
  configCmd
    .command('profile [preset]')
    .description('ワークフローのプロファイルを設定（対話選択またはプリセット指定）')
    .action(async (preset?: string) => {
      const { configProfileCommand } = await import('../../commands/config.js');
      await configProfileCommand(preset);
    });
}
