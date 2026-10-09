import { Command } from 'commander';

/**
 * Register the schema command and all its subcommands.
 */
export function registerSchemaCommand(program: Command): void {
  const schemaCmd = program
    .command('schema')
    .description('ワークフロースキーマを管理（実験的）');

  // Experimental warning
  schemaCmd.hook('preAction', () => {
    console.error('注意: スキーマコマンドは実験的で、将来変更される可能性があります。');
  });

  // schema which
  schemaCmd
    .command('which [name]')
    .description('スキーマの解決元を表示')
    .option('--json', 'JSON で出力')
    .option('--all', 'すべてのスキーマと解決元を一覧表示')
    .action(async (name?: string, options?: { json?: boolean; all?: boolean }) => {
      const { schemaWhichCommand } = await import('../../commands/schema.js');
      await schemaWhichCommand(name, options);
    });

  // schema validate
  schemaCmd
    .command('validate [name]')
    .description('スキーマ構造とテンプレートを検証')
    .option('--json', 'JSON で出力')
    .option('--verbose', '詳細な検証手順を表示')
    .action(async (name?: string, options?: { json?: boolean; verbose?: boolean }) => {
      const { schemaValidateCommand } = await import('../../commands/schema.js');
      await schemaValidateCommand(name, options);
    });

  // schema fork
  schemaCmd
    .command('fork <source> [name]')
    .description('既存スキーマをプロジェクトにコピーしてカスタマイズ')
    .option('--json', 'JSON で出力')
    .option('--force', '既存の出力先を上書き')
    .action(async (source: string, name?: string, options?: { json?: boolean; force?: boolean }) => {
      const { schemaForkCommand } = await import('../../commands/schema.js');
      await schemaForkCommand(source, name, options);
    });

  // schema init
  schemaCmd
    .command('init <name>')
    .description('プロジェクトローカルのスキーマを作成')
    .option('--json', 'JSON で出力')
    .option('--description <text>', 'スキーマの説明')
    .option('--artifacts <list>', 'アーティファクトIDをカンマ区切りで指定（proposal,specs,design,tasks）')
    .option('--default', 'プロジェクトのデフォルトスキーマに設定')
    .option('--no-default', 'デフォルト設定の確認を省略')
    .option('--force', '既存のスキーマを上書き')
    .action(async (
      name: string,
      options?: {
        json?: boolean;
        description?: string;
        artifacts?: string;
        default?: boolean;
        force?: boolean;
      }
    ) => {
      const { schemaInitCommand } = await import('../../commands/schema.js');
      await schemaInitCommand(name, options);
    });
}
