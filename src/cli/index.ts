import { Command } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { AI_TOOLS } from '../core/config.js';
import { UpdateCommand } from '../core/update.js';
import { ListCommand } from '../core/list.js';
import { ArchiveCommand } from '../core/archive.js';
import { ViewCommand } from '../core/view.js';
import { registerSpecCommand } from '../commands/spec.js';
import { ChangeCommand } from '../commands/change.js';
import { ValidateCommand } from '../commands/validate.js';
import { ShowCommand } from '../commands/show.js';
import { CompletionCommand } from '../commands/completion.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerArtifactWorkflowCommands } from '../commands/artifact-workflow.js';
import { emitDeprecationWarning } from '../utils/deprecations.js';

const translateHelpHeadings = (text: string): string =>
  text
    .replace(/^Usage:/m, '使い方:')
    .replace(/^Options:/m, 'オプション:')
    .replace(/^Commands:/m, 'コマンド:')
    .replace(/^Arguments:/m, '引数:');

// Override commander のヘルプ出力を日本語見出しに差し替える
const originalHelpInformation = Command.prototype.helpInformation;
Command.prototype.helpInformation = function helpInformation(): string {
  const original = originalHelpInformation.call(this);
  return translateHelpHeadings(original);
};

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

program
  .name('openspec')
  .description('仕様駆動開発のための AI ネイティブツール (AI-native system for spec-driven development)')
  .version(version, '-V, --version', 'バージョンを表示')
  .helpOption('-h, --help', 'ヘルプを表示')
  .addHelpCommand('help [command]', 'コマンドのヘルプを表示');

// Global options
program.option('--no-color', 'カラー出力を無効化');

// Apply global flags before any command runs
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }
});

const availableToolIds = AI_TOOLS.filter((tool) => tool.available).map((tool) => tool.value);
const toolsOptionDescription = `AI ツールを非対話で指定します。"all" "none" またはカンマ区切り (${availableToolIds.join(', ')}) を指定できます。`;

program
  .command('init [path]')
  .description('OpenSpec をプロジェクトに初期設定する')
  .option('--tools <tools>', toolsOptionDescription)
  .action(async (targetPath = '.', options?: { tools?: string }) => {
    try {
      // Validate that the path is a valid directory
      const resolvedPath = path.resolve(targetPath);
      
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error(`パス "${targetPath}" はディレクトリではありません`);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // Directory doesn't exist, but we can create it
          console.log(`ディレクトリ "${targetPath}" は存在しません。新規作成します。`);
        } else if (error.message && error.message.includes('not a directory')) {
          throw error;
        } else {
          throw new Error(`パス "${targetPath}" にアクセスできません: ${error.message}`);
        }
      }
      
      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tools,
      });
      await initCommand.execute(targetPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('update [path]')
  .description('OpenSpec の手順ファイルを更新する')
  .action(async (targetPath = '.') => {
    try {
      const resolvedPath = path.resolve(targetPath);
      const updateCommand = new UpdateCommand();
      await updateCommand.execute(resolvedPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('アイテム一覧を表示（デフォルトは変更）。--specs で仕様を表示')
  .option('--specs', '変更の代わりに仕様を一覧表示')
  .option('--changes', '変更を明示的に一覧表示（デフォルト）')
  .option('--sort <order>', '並び順: "recent" (デフォルト) または "name"', 'recent')
  .option('--json', 'JSON で出力（プログラム利用向け）')
  .action(async (options?: { specs?: boolean; changes?: boolean; sort?: string; json?: boolean }) => {
    try {
      const listCommand = new ListCommand();
      const mode: 'changes' | 'specs' = options?.specs ? 'specs' : 'changes';
      const sort = options?.sort === 'name' ? 'name' : 'recent';
      await listCommand.execute('.', mode, { sort, json: options?.json });
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('view')
  .description('仕様と変更のインタラクティブダッシュボードを表示')
  .action(async () => {
    try {
      const viewCommand = new ViewCommand();
      await viewCommand.execute('.');
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Change command with subcommands
const changeCmd = program
  .command('change')
  .description('OpenSpec の変更提案を管理');

// Deprecation notice for noun-based commands
changeCmd.hook('preAction', () => {
  emitDeprecationWarning(
    'command:change',
    '警告: "openspec change ..." は非推奨です。"openspec list" や "openspec validate --changes" など動詞先行のコマンドを使ってください。'
  );
});

changeCmd
  .command('show [change-name]')
  .description('変更提案を JSON もしくは Markdown で表示')
  .option('--json', 'JSON で出力')
  .option('--deltas-only', '差分のみを表示（JSON専用）')
  .option('--requirements-only', 'deltas-only の非推奨エイリアス')
  .option('--no-interactive', '対話プロンプトを無効化')
  .action(async (changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; noInteractive?: boolean }) => {
    try {
      const changeCommand = new ChangeCommand();
      await changeCommand.show(changeName, options);
    } catch (error) {
      console.error(`エラー: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

changeCmd
  .command('list')
  .description('アクティブな変更を一覧（非推奨: 代わりに "openspec list" を使用)')
  .option('--json', 'JSON で出力')
  .option('--long', 'ID とタイトルを件数付きで表示')
  .action(async (options?: { json?: boolean; long?: boolean }) => {
    try {
      emitDeprecationWarning(
        'command:change-list',
        '警告: "openspec change list" は非推奨です。"openspec list" を使ってください。'
      );
      const changeCommand = new ChangeCommand();
      await changeCommand.list(options);
    } catch (error) {
      console.error(`エラー: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

changeCmd
  .command('validate [change-name]')
  .description('変更提案を検証')
  .option('--strict', '厳密検証モードを有効化')
  .option('--json', '検証レポートを JSON 出力')
  .option('--no-interactive', '対話プロンプトを無効化')
  .action(async (changeName?: string, options?: { strict?: boolean; json?: boolean; noInteractive?: boolean }) => {
    try {
      const changeCommand = new ChangeCommand();
      await changeCommand.validate(changeName, options);
      if (typeof process.exitCode === 'number' && process.exitCode !== 0) {
        process.exit(process.exitCode);
      }
    } catch (error) {
      console.error(`エラー: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

program
  .command('archive [change-name]')
  .description('完了した変更をアーカイブし、仕様を更新')
  .option('-y, --yes', '確認プロンプトをスキップ')
  .option('--skip-specs', '仕様更新をスキップ（インフラ・ツール・ドキュメントのみ向け）')
  .option('--no-validate', '検証をスキップ（非推奨、要確認）')
  .action(async (changeName?: string, options?: { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean }) => {
    try {
      const archiveCommand = new ArchiveCommand();
      await archiveCommand.execute(changeName, options);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

registerSpecCommand(program);
registerConfigCommand(program);

// Top-level validate command
program
  .command('validate [item-name]')
  .description('変更・仕様を検証')
  .option('--all', '変更と仕様をまとめて検証')
  .option('--changes', '変更のみ検証')
  .option('--specs', '仕様のみ検証')
  .option('--type <type>', 'あいまいなときに種別を指定: change|spec')
  .option('--strict', '厳密検証モードを有効化')
  .option('--json', '結果を JSON で出力')
  .option('--concurrency <n>', '同時検証の上限（環境変数 OPENSPEC_CONCURRENCY または 6 がデフォルト）')
  .option('--no-interactive', '対話プロンプトを無効化')
  .action(async (itemName?: string, options?: { all?: boolean; changes?: boolean; specs?: boolean; type?: string; strict?: boolean; json?: boolean; noInteractive?: boolean; concurrency?: string }) => {
    try {
      const validateCommand = new ValidateCommand();
      await validateCommand.execute(itemName, options);
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Top-level show command
program
  .command('show [item-name]')
  .description('変更または仕様を表示')
  .option('--json', 'JSON で出力')
  .option('--type <type>', 'あいまいなときに種別を指定: change|spec')
  .option('--no-interactive', '対話プロンプトを無効化')
  // change-only flags
  .option('--deltas-only', '差分のみを表示（JSON専用、変更）')
  .option('--requirements-only', 'deltas-only の非推奨エイリアス（変更）')
  // spec-only flags
  .option('--requirements', 'JSON専用: 要件のみ表示（シナリオ除外）')
  .option('--no-scenarios', 'JSON専用: シナリオを除外')
  .option('-r, --requirement <id>', 'JSON専用: 指定 ID(1始まり) の要件のみ表示')
  // allow unknown options to pass-through to underlying command implementation
  .allowUnknownOption(true)
  .action(async (itemName?: string, options?: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: any }) => {
    try {
      const showCommand = new ShowCommand();
      await showCommand.execute(itemName, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Completion command with subcommands
const completionCmd = program
  .command('completion')
  .description('OpenSpec CLI のシェル補完を管理');

completionCmd
  .command('generate [shell]')
  .description('シェル補完スクリプトを生成（標準出力へ出力）')
  .action(async (shell?: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.generate({ shell });
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

completionCmd
  .command('install [shell]')
  .description('シェル補完スクリプトをインストール')
  .option('--verbose', '詳細なインストール内容を表示')
  .action(async (shell?: string, options?: { verbose?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.install({ shell, verbose: options?.verbose });
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

completionCmd
  .command('uninstall [shell]')
  .description('シェル補完スクリプトをアンインストール')
  .option('-y, --yes', '確認プロンプトをスキップ')
  .action(async (shell?: string, options?: { yes?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.uninstall({ shell, yes: options?.yes });
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Hidden command for machine-readable completion data
program
  .command('__complete <type>', { hidden: true })
  .description('シェル補完用データを機械可読形式で出力（内部用）')
  .action(async (type: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.complete({ type });
    } catch (error) {
      // Silently fail for graceful shell completion experience
      process.exitCode = 1;
    }
  });

// Register artifact workflow commands (experimental)
registerArtifactWorkflowCommands(program);

program.parse();
