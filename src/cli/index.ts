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
import { FeedbackCommand } from '../commands/feedback.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerSchemaCommand } from '../commands/schema.js';
import {
  statusCommand,
  instructionsCommand,
  applyInstructionsCommand,
  templatesCommand,
  schemasCommand,
  newChangeCommand,
  DEFAULT_SCHEMA,
  type StatusOptions,
  type InstructionsOptions,
  type TemplatesOptions,
  type SchemasOptions,
  type NewChangeOptions,
} from '../commands/workflow/index.js';
import { maybeShowTelemetryNotice, trackCommand, shutdown } from '../telemetry/index.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
function getCommandPath(command: Command): string {
  const names: string[] = [];
  let current: Command | null = command;

  while (current) {
    const name = current.name();
    // Skip the root 'openspec' command
    if (name && name !== 'openspec') {
      names.unshift(name);
    }
    current = current.parent;
  }

  return names.join(':') || 'openspec';
}

program
  .name('openspec')
  .description('仕様駆動開発のための AI ネイティブシステム')
  .version(version);

// Global options
program.option('--no-color', '色付き出力を無効化');

// Apply global flags and telemetry before any command runs
// Note: preAction receives (thisCommand, actionCommand) where:
// - thisCommand: the command where hook was added (root program)
// - actionCommand: the command actually being executed (subcommand)
program.hook('preAction', async (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }

  // Show first-run telemetry notice (if not seen)
  await maybeShowTelemetryNotice();

  // Track command execution (use actionCommand to get the actual subcommand)
  const commandPath = getCommandPath(actionCommand);
  await trackCommand(commandPath, version);
});

// Shutdown telemetry after command completes
program.hook('postAction', async () => {
  await shutdown();
});

const availableToolIds = AI_TOOLS.filter((tool) => tool.skillsDir).map((tool) => tool.value);
const toolsOptionDescription = `対話なしで AI ツールを設定します。"all" / "none" またはカンマ区切りで指定してください: ${availableToolIds.join(', ')}`;

program
  .command('init [path]')
  .description('プロジェクトで OpenSpec を初期化')
  .option('--tools <tools>', toolsOptionDescription)
  .option('--force', '確認せずに旧ファイルを自動クリーンアップ')
  .action(async (targetPath = '.', options?: { tools?: string; force?: boolean }) => {
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
          console.log(`ディレクトリ "${targetPath}" が存在しないため作成します。`);
        } else if (error.message && error.message.includes('not a directory')) {
          throw error;
        } else {
          throw new Error(`パス "${targetPath}" にアクセスできません: ${error.message}`);
        }
      }

      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tools,
        force: options?.force,
      });
      await initCommand.execute(targetPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Hidden alias: 'experimental' -> 'init' for backwards compatibility
program
  .command('experimental', { hidden: true })
  .description('init の別名（非推奨）')
  .option('--tool <tool-id>', '対象の AI ツール（--tools に対応）')
  .option('--no-interactive', '対話プロンプトを無効化')
  .action(async (options?: { tool?: string; noInteractive?: boolean }) => {
    try {
      console.log('注意: "openspec experimental" は非推奨です。"openspec init" を使ってください。');
      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tool,
        interactive: options?.noInteractive === true ? false : undefined,
      });
      await initCommand.execute('.');
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('update [path]')
  .description('OpenSpec の指示ファイルを更新')
  .option('--force', 'ファイルが最新でも強制更新')
  .action(async (targetPath = '.', options?: { force?: boolean }) => {
    try {
      const resolvedPath = path.resolve(targetPath);
      const updateCommand = new UpdateCommand({ force: options?.force });
      await updateCommand.execute(resolvedPath);
    } catch (error) {
      console.log(); // Empty line for spacing
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('項目を一覧表示（デフォルトは変更）。仕様は --specs を使用')
  .option('--specs', '変更ではなく仕様を一覧表示')
  .option('--changes', '変更を一覧表示（デフォルト）')
  .option('--sort <order>', '並び順: "recent"（デフォルト）または "name"', 'recent')
  .option('--json', 'JSON で出力（プログラム向け）')
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
  .description('仕様と変更の対話型ダッシュボードを表示')
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
  console.error('警告: "openspec change ..." コマンドは非推奨です。動詞から始まるコマンド（例: "openspec list", "openspec validate --changes"）を使用してください。');
});

changeCmd
  .command('show [change-name]')
  .description('変更提案を JSON または Markdown で表示')
  .option('--json', 'JSON で出力')
  .option('--deltas-only', '差分のみ表示（JSON のみ）')
  .option('--requirements-only', '--deltas-only の別名（非推奨）')
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
  .description('アクティブな変更を一覧表示（非推奨: "openspec list" を使用）')
  .option('--json', 'JSON で出力')
  .option('--long', 'ID とタイトルを件数付きで表示')
  .action(async (options?: { json?: boolean; long?: boolean }) => {
    try {
      console.error('警告: "openspec change list" は非推奨です。"openspec list" を使用してください。');
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
  .option('--json', '検証レポートを JSON で出力')
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
  .description('完了した変更をアーカイブし、本仕様を更新')
  .option('-y, --yes', '確認プロンプトをスキップ')
  .option('--skip-specs', '仕様更新をスキップ（インフラ/ツール/ドキュメントのみの変更向け）')
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
registerSchemaCommand(program);

// Top-level validate command
program
  .command('validate [item-name]')
  .description('変更と仕様を検証')
  .option('--all', 'すべての変更と仕様を検証')
  .option('--changes', 'すべての変更を検証')
  .option('--specs', 'すべての仕様を検証')
  .option('--type <type>', '名前が曖昧な場合に指定: change|spec')
  .option('--strict', '厳密検証モードを有効化')
  .option('--json', '検証結果を JSON で出力')
  .option('--concurrency <n>', '並列検証の上限（環境変数 OPENSPEC_CONCURRENCY または 6）')
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
  .option('--type <type>', '名前が曖昧な場合に指定: change|spec')
  .option('--no-interactive', '対話プロンプトを無効化')
  // change-only flags
  .option('--deltas-only', '差分のみ表示（JSON のみ、変更）')
  .option('--requirements-only', '--deltas-only の別名（非推奨、変更）')
  // spec-only flags
  .option('--requirements', 'JSON のみ: 要件だけ表示（シナリオ除外）')
  .option('--no-scenarios', 'JSON のみ: シナリオを除外')
  .option('-r, --requirement <id>', 'JSON のみ: 指定 ID（1 始まり）の要件を表示')
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

// Feedback command
program
  .command('feedback <message>')
  .description('OpenSpec へのフィードバックを送信')
  .option('--body <text>', 'フィードバックの詳細説明')
  .action(async (message: string, options?: { body?: string }) => {
    try {
      const feedbackCommand = new FeedbackCommand();
      await feedbackCommand.execute(message, options);
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
  .option('--verbose', '詳細なインストール出力を表示')
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
  .description('補完データを機械可読形式で出力（内部用）')
  .action(async (type: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.complete({ type });
    } catch (error) {
      // Silently fail for graceful shell completion experience
      process.exitCode = 1;
    }
  });

// ═══════════════════════════════════════════════════════════
// Workflow Commands (formerly experimental)
// ═══════════════════════════════════════════════════════════

// Status command
program
  .command('status')
  .description('変更のアーティファクト完了状況を表示')
  .option('--change <id>', '対象の変更名')
  .option('--schema <name>', 'スキーマを上書き（config.yaml から自動判定）')
  .option('--json', 'JSON で出力')
  .action(async (options: StatusOptions) => {
    try {
      await statusCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Instructions command
program
  .command('instructions [artifact]')
  .description('アーティファクト作成やタスク適用の指示を出力')
  .option('--change <id>', '変更名')
  .option('--schema <name>', 'スキーマを上書き（config.yaml から自動判定）')
  .option('--json', 'JSON で出力')
  .action(async (artifactId: string | undefined, options: InstructionsOptions) => {
    try {
      // Special case: "apply" is not an artifact, but a command to get apply instructions
      if (artifactId === 'apply') {
        await applyInstructionsCommand(options);
      } else {
        await instructionsCommand(artifactId, options);
      }
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('スキーマ内のアーティファクトのテンプレートパスを表示')
  .option('--schema <name>', `使用するスキーマ（デフォルト: ${DEFAULT_SCHEMA}）`)
  .option('--json', 'JSON で出力（アーティファクト ID→パス）')
  .action(async (options: TemplatesOptions) => {
    try {
      await templatesCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Schemas command
program
  .command('schemas')
  .description('利用可能なワークフロースキーマを一覧表示')
  .option('--json', 'JSON で出力（エージェント向け）')
  .action(async (options: SchemasOptions) => {
    try {
      await schemasCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// New command group with change subcommand
const newCmd = program.command('new').description('新規項目を作成');

newCmd
  .command('change <name>')
  .description('新しい変更ディレクトリを作成')
  .option('--description <text>', 'README.md に追加する説明')
  .option('--schema <name>', `使用するワークフロースキーマ（デフォルト: ${DEFAULT_SCHEMA}）`)
  .action(async (name: string, options: NewChangeOptions) => {
    try {
      await newChangeCommand(name, options);
    } catch (error) {
      console.log();
      ora().fail(`エラー: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
