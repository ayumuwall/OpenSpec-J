import { Command } from 'commander';
import { COMMAND_REGISTRY } from '../../core/completions/command-registry.js';
import { printJson } from '../../commands/shared-output.js';
import type {
  StoreCommand,
  StoreJsonOptions,
  StoreRegisterOptions,
  StoreRemoveOptions,
  StoreSetupOptions,
} from '../../commands/store.js';

async function loadStoreCommand(): Promise<StoreCommand> {
  const { StoreCommand } = await import('../../commands/store.js');
  return new StoreCommand();
}

export function registerStoreCommand(program: Command): void {
  // One source for the locked group one-liner: the completions registry
  // entry, which shell completion scripts also consume.
  const storeGroupDescription =
    COMMAND_REGISTRY.find((entry) => entry.name === 'store')?.description ??
    'このマシンに登録する独立した OpenSpec リポジトリ（ストア）を作成・管理';
  const store = program.command('store').description(storeGroupDescription);

  store
    .command('setup [id]')
    .description('ローカルストアを作成して登録')
    .option('--path <path>', 'ストアを配置するフォルダー（例: ~/openspec/<id>）')
    .option('--init-git', 'Git リポジトリを初期化し、初回コミットを作成（デフォルト）')
    .option('--no-init-git', 'すべての Git 操作を省略（init も初回コミットも行いません）')
    .option('--remote <url>', 'store.yaml に記録する正規 clone 元')
    .option('--json', 'JSON として出力')
    .action(async (id: string | undefined, options: StoreSetupOptions) => {
      const storeCommand = await loadStoreCommand();
      await storeCommand.setup(id, options);
    });

  store
    .command('register [path]')
    .description('既存のローカルストアを登録')
    .option('--id <id>', 'ストア ID（デフォルトはメタデータまたはフォルダー名）')
    .option('--yes', '正常な OpenSpec ルートにストア識別メタデータを作成することを確認')
    .option('--json', 'JSON として出力')
    .action(async (inputPath: string | undefined, options: StoreRegisterOptions) => {
      const storeCommand = await loadStoreCommand();
      await storeCommand.register(inputPath, options);
    });

  store
    .command('unregister <id>')
    .description('ファイルを削除せずにローカルストアの登録を解除')
    .option('--json', 'JSON として出力')
    .action(async (id: string, options: StoreJsonOptions) => {
      const storeCommand = await loadStoreCommand();
      await storeCommand.unregister(id, options);
    });

  store
    .command('remove <id>')
    .description('ローカルストアの登録を解除し、ローカルフォルダーを削除')
    .option('--yes', 'ローカルストアフォルダーの削除を確認')
    .option('--json', 'JSON として出力')
    .action(async (id: string, options: StoreRemoveOptions) => {
      const storeCommand = await loadStoreCommand();
      await storeCommand.remove(id, options);
    });

  store
    .command('list')
    .alias('ls')
    .description('ローカルに登録されたストアを一覧表示')
    .option('--json', 'JSON として出力')
    .action(async (options: StoreJsonOptions) => {
      const storeCommand = await loadStoreCommand();
      await storeCommand.list(options);
    });

  store
    .command('doctor [id]')
    .description('ローカルストアの登録とメタデータを確認')
    .option('--json', 'JSON として出力')
    .action(async (id: string | undefined, options: StoreJsonOptions) => {
      const storeCommand = await loadStoreCommand();
      await storeCommand.doctor(id, options);
    });

  const lifecycleRedirects = new Set(
    COMMAND_REGISTRY.filter(
      (entry) =>
        entry.flags.some((flag) => flag.name === 'store') ||
        (entry.subcommands ?? []).some((subcommand) =>
          subcommand.flags.some((flag) => flag.name === 'store')
        )
    ).map((entry) => entry.name)
  );
  const storeSubcommandsLine = store.commands
    .map((subcommand) => {
      const aliases = subcommand.aliases();
      return aliases.length > 0 ? `${subcommand.name()} (${aliases.join(', ')})` : subcommand.name();
    })
    .join(', ');
  // One group action owns missing AND unknown subcommands. Known
  // subcommands dispatch above; everything else — including a bare
  // `store --json` with no operand — lands here, so the handler owns the
  // entire message and exit path (same text for human and --json). The
  // permissive flags route unknown operands/options here instead of
  // letting Commander emit a raw error before the action runs. We detect
  // `--json` in the residual args rather than declaring a group option,
  // which would otherwise shadow each subcommand's own `--json` flag.
  store.allowExcessArguments(true);
  store.allowUnknownOption(true);
  store.action(() => {
    const operands = store.args;
    // Flag values are indistinguishable from operands without a full
    // parse, so the verbatim echo only applies to plain-operand input.
    const attempted = operands.filter((operand) => !operand.startsWith('-'));
    const hasFlagLikeToken = operands.some((operand) => operand.startsWith('-'));
    // The agent contract: --json failures emit one JSON document.
    if (operands.includes('--json')) {
      const message =
        attempted.length > 0
          ? `'openspec store' の不明なコマンド '${attempted[0]}' です。ストアサブコマンド: ${storeSubcommandsLine}。`
          : `'openspec store' のサブコマンドがありません。ストアサブコマンド: ${storeSubcommandsLine}。`;
      printJson({
        status: [
          {
            severity: 'error',
            code: 'unknown_store_subcommand',
            message,
            fix: 'ストアサブコマンドを実行するか、通常のライフサイクルコマンドに --store <id> を指定してください。',
          },
        ],
      });
      process.exitCode = 1;
      return;
    }
    let example = 'openspec new change <change-id> --store <id>';
    if (!hasFlagLikeToken && attempted.length > 0 && lifecycleRedirects.has(attempted[0])) {
      if (attempted[0] === 'new') {
        const changeId = attempted[1] === 'change' && attempted[2] ? attempted[2] : '<change-id>';
        example = `openspec new change ${changeId} --store <id>`;
      } else {
        example = `openspec ${attempted.join(' ')} --store <id>`;
      }
    }
    console.error(
      attempted.length > 0
        ? `エラー: 'openspec store' の不明なコマンド '${attempted[0]}' です。`
        : "エラー: 'openspec store' のサブコマンドがありません。"
    );
    console.error(
      `ストアサブコマンドはストア登録を管理します: ${storeSubcommandsLine}。`
    );
    console.error(
      'ストア内で変更を作成または操作するには、通常のコマンドに --store を指定します。例:'
    );
    console.error(`  ${example}`);
    process.exitCode = 1;
  });
}
