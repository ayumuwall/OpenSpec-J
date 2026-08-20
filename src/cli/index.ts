import { asStatus } from '../commands/shared-output.js';
import { Command, Option } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, promises as fs } from 'fs';
import { AI_TOOLS, TOOL_ID_ALIASES } from '../core/config.js';
import { UpdateCommand } from '../core/update.js';
import {
  getAvailableCliUpdate,
  displayCliUpdateNote,
  shouldOfferUpgrade,
  getInstallDir,
  offerCliUpgrade,
  rerunUpdateWithUpgradedCli,
  displayUpgradeCommand,
  isSourceCheckout,
} from '../core/version-check.js';
import { ListCommand } from '../core/list.js';
import { ArchiveCommand, type ArchiveOptions } from '../core/archive.js';
import { ViewCommand } from '../core/view.js';
import { resolveRootForCommand, toRootOutput } from '../core/root-selection.js';
import { registerSpecCommand } from '../commands/spec.js';
import { ChangeCommand } from '../commands/change.js';
import { ValidateCommand } from '../commands/validate.js';
import { ShowCommand } from '../commands/show.js';
import { CompletionCommand } from '../commands/completion.js';
import { FeedbackCommand } from '../commands/feedback.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerSchemaCommand } from '../commands/schema.js';
import { registerStoreCommand } from '../commands/store.js';
import { registerDoctorCommand } from '../commands/doctor.js';
import { registerContextCommand } from '../commands/context.js';
import { registerWorksetCommand } from '../commands/workset.js';
import {
  statusCommand,
  instructionsCommand,
  applyInstructionsCommand,
  archiveInstructionsCommand,
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
import { maybeShowCompletionTip } from '../core/completion-tip.js';
import { COMMON_FLAGS } from '../core/completions/shared-flags.js';
import { isInteractive } from '../utils/interactive.js';

const STORE_OPTION_DESCRIPTION = COMMON_FLAGS.store.description;

// Deliberate rejection path: --store-path stays registered (hidden) so the
// resolver can explain that registering the path is the supported route,
// instead of Commander emitting a generic unknown-option error (or, for
// `show`, silently ignoring it via allowUnknownOption).
function hiddenStorePathOption(): Option {
  return new Option(
    '--store-path <path>',
    'サポートされていません。"openspec store register <path>" でパスを登録し、--store <id> を使用してください'
  ).hideHelp();
}

function failWithError(
  error: unknown,
  json?: { enabled: boolean | undefined; payload?: Record<string, unknown>; fallbackCode?: string }
): void {
  // The agent contract: every --json failure leaves exactly one JSON
  // document on stdout (the command's null-shape plus a status array).
  if (json?.enabled) {
    console.log(
      JSON.stringify(
        { ...(json.payload ?? {}), status: [asStatus(error, json.fallbackCode ?? 'command_error')] },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }
  ora().fail(`エラー: ${(error as Error).message}`);
  // Resolution and store errors carry a pasteable fix - never drop it.
  const fix = (error as { diagnostic?: { fix?: string } }).diagnostic?.fix;
  if (fix) {
    console.error(`修正: ${fix}`);
  }
  process.exitCode = process.exitCode ?? 1;
}

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
export function getCommandPath(command: Command): string {
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

/**
 * True when the executing command asked for JSON output — used to suppress the
 * first-run telemetry notice so stdout stays a single valid JSON document.
 *
 * `--json` reaches commands three ways, so a single parsed option is not enough:
 * - declared on the leaf (`openspec status --json`) → `opts().json`
 * - declared on a parent group and read via globals (`openspec workset --json list`)
 *   → `optsWithGlobals().json`
 * - a residual arg on a permissive group that never declares the option
 *   (`openspec store --json`, which detects it from `command.args`) → `args`
 *
 * Suppressing is always safe: the disclosure is only deferred to the next
 * non-JSON run, never lost, whereas printing it on a JSON run corrupts stdout.
 */
export function isJsonRun(command: Command): boolean {
  return (
    command.optsWithGlobals().json === true ||
    command.args.includes('--json')
  );
}

/**
 * True for the commands that exist to serve shell completions: the user-facing
 * `openspec completion ...` group and the hidden `__complete` resolver that
 * generated completion scripts call on every Tab press. Tipping either about
 * completions is noise, and `__complete` would burn the one-shot tip invisibly.
 */
export function isCompletionRun(commandPath: string): boolean {
  return commandPath.split(':')[0] === 'completion' || commandPath === '__complete';
}

/**
 * True when the first-run completions tip must be deferred rather than shown.
 *
 * Deferring keeps the tip unconsumed, so it still reaches the user on a later
 * run that can actually carry it. All three cases are runs nobody would read a
 * hint from: JSON output, the completion machinery itself, and a stderr that is
 * not a terminal — pipes and the agent-driven runs that dominate this CLI's
 * usage would otherwise burn the user's one-shot tip into a log nobody opens.
 */
export function shouldDeferCompletionTip(command: Command, stderrIsTty: boolean): boolean {
  return isJsonRun(command) || isCompletionRun(getCommandPath(command)) || !stderrIsTty;
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

  // Show first-run telemetry notice (if not seen). It's written to stderr, so it
  // never pollutes stdout — but --json runs still defer it (see isJsonRun) so the
  // very first invocation stays free of any incidental output on either stream.
  await maybeShowTelemetryNotice({ silent: isJsonRun(actionCommand) });

  // Track command execution (use actionCommand to get the actual subcommand)
  const commandPath = getCommandPath(actionCommand);

  await trackCommand(commandPath, version);
});

// Shutdown telemetry after command completes
program.hook('postAction', async (_thisCommand, actionCommand) => {
  // Show the first-run shell-completions tip (on stderr, so piped stdout stays
  // clean). postAction, not preAction: the tip trails the command's own output
  // instead of pushing an error message or `init`'s setup summary down the
  // screen. Deferred — not consumed — whenever nobody would read it: JSON runs,
  // `openspec completion ...`, and a stderr that is not a terminal (agents and
  // pipes would otherwise silently burn the user's one-shot tip).
  try {
    await maybeShowCompletionTip({
      silent: shouldDeferCompletionTip(actionCommand, Boolean(process.stderr.isTTY)),
    });
  } finally {
    // The flush runs even if the hint throws: parse() is synchronous, so a
    // rejection here has no catch anywhere above it.
    await shutdown();
  }
});

const availableToolIds = AI_TOOLS
  .filter((tool) => tool.skillsDir || tool.globalSkillsDir)
  .map((tool) => tool.value);
const toolAliasNote = Object.entries(TOOL_ID_ALIASES)
  .map(([retired, current]) => `${retired}（現在は ${current}）`)
  .join(', ');
const toolsOptionDescription = `対話なしでAIツールを設定します。"all"、"none"、または次のIDをカンマ区切りで指定してください: ${availableToolIds.join(', ')}。旧IDも使用できます: ${toolAliasNote}`;

program
  .command('init [path]')
  .description('プロジェクトで OpenSpec を初期化')
  .option('--tools <tools>', toolsOptionDescription)
  .option('--language <language>', '新しいOpenSpecアーティファクトを記述する言語')
  .option('--force', '確認せずに旧ファイルを自動クリーンアップ')
  .option('--profile <profile>', 'グローバル設定 profile を上書き（core または custom）')
  .option('--no-animation', 'アニメーションの代わりに静的なウェルカム画面を表示')
  .option('--copilot-cloud', '確認なしで GitHub Copilot クラウドコーディングエージェント用ファイルをセットアップ')
  .option('--no-copilot-cloud', 'GitHub Copilot クラウドコーディングエージェント用ファイルの生成をスキップ')
  .action(async (targetPath = '.', options?: { tools?: string; language?: string; force?: boolean; profile?: string; animation?: boolean; copilotCloud?: boolean }) => {
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
        } else if (error.message && error.message.includes('ディレクトリではありません')) {
          throw error;
        } else {
          throw new Error(`パス "${targetPath}" にアクセスできません: ${error.message}`);
        }
      }

      const { InitCommand } = await import('../core/init.js');
      const initCommand = new InitCommand({
        tools: options?.tools,
        language: options?.language,
        force: options?.force,
        profile: options?.profile,
        animation: options?.animation,
        copilotCloud: options?.copilotCloud,
      });
      await initCommand.execute(targetPath);
    } catch (error) {
      failWithError(error);
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
      failWithError(error);
      process.exit(1);
    }
  });

program
  .command('update [path]')
  .description('OpenSpec の指示ファイルを更新')
  .option('--force', 'ファイルが最新でも強制更新')
  .action(async (targetPath = '.', options?: { force?: boolean }) => {
    try {
      const installDir = getInstallDir();
      // Running from a clone: the version is whatever the branch says, so any
      // upgrade advice would be noise. Decided before the request, so a
      // contributor never waits on an answer that gets thrown away.
      const latestVersion = isSourceCheckout(installDir) ? null : await getAvailableCliUpdate();
      const announce = latestVersion !== null;
      // Offer to upgrade first: this process generates files from its own
      // templates, so upgrading afterwards would leave the old ones on disk.
      // Both streams must be a terminal — with stdout redirected the question
      // lands in the file and the user waits at a blank screen forever.
      const canOffer =
        announce &&
        shouldOfferUpgrade({
          installDir,
          projectPath: targetPath,
          interactive: isInteractive(),
          stdoutIsTty: Boolean(process.stdout.isTTY),
        });

      let declined = false;
      if (latestVersion && canOffer) {
        displayCliUpdateNote(latestVersion, targetPath, { withCommand: false });
        const outcome = await offerCliUpgrade(latestVersion);

        // Set the code and return rather than process.exit: exiting here would
        // skip commander's postAction hook, killing the telemetry flush
        // mid-request.
        if (outcome === 'cancelled') {
          // Ctrl-C means stop the command, not fall through to more prompts.
          process.exitCode = 130;
          return;
        }
        if (outcome === 'upgraded') {
          process.exitCode = await rerunUpdateWithUpgradedCli(targetPath, {
            force: options?.force,
          });
          return;
        }
        // Declined, failed, or upgraded-but-unreachable: fall through to the
        // update, then leave the command on screen underneath it.
        declined = true;
      }

      const updateCommand = new UpdateCommand({ force: options?.force });
      await updateCommand.execute(targetPath);

      if (declined) {
        // The headline was printed before the prompt; only the manual route is
        // still owed, and it belongs where the user is looking now.
        displayUpgradeCommand(targetPath);
      } else if (latestVersion) {
        displayCliUpdateNote(latestVersion, targetPath);
      }
    } catch (error) {
      failWithError(error);
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
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (options?: { specs?: boolean; changes?: boolean; sort?: string; json?: boolean; store?: string; storePath?: string }) => {
    try {
      const root = await resolveRootForCommand(options ?? {}, {
        json: options?.json,
        failurePayload: options?.specs ? { specs: [], root: null } : { changes: [], root: null },
        // Preserve the cwd fallback for pre-config.yaml projects. The resolver
        // still lets a registered/default store take precedence over it.
        allowImplicitRoot: existsSync(path.join(process.cwd(), 'openspec', 'project.md')),
      });
      if (!root) {
        return;
      }
      const listCommand = new ListCommand();
      const mode: 'changes' | 'specs' = options?.specs ? 'specs' : 'changes';
      const sort = options?.sort === 'name' ? 'name' : 'recent';
      await listCommand.execute(root.path, mode, {
        sort,
        json: options?.json,
        ...(options?.json ? { root: toRootOutput(root) } : {}),
      });
    } catch (error) {
      failWithError(error, {
        enabled: options?.json,
        payload: options?.specs ? { specs: [], root: null } : { changes: [], root: null },
        fallbackCode: 'list_error',
      });
      process.exit(1);
    }
  });

program
  .command('view')
  .description('仕様と変更の対話型ダッシュボードを表示')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (options?: { store?: string; storePath?: string }) => {
    try {
      // Implicit cwd fallback stays enabled so `view` keeps accepting the same
      // directories as `list`/`status` — notably pre-config.yaml `openspec/`
      // dirs. ViewCommand still reports a missing openspec/ directory itself.
      const root = await resolveRootForCommand(options ?? {});
      if (!root) {
        return;
      }
      const viewCommand = new ViewCommand();
      await viewCommand.execute(root.path);
    } catch (error) {
      failWithError(error);
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
  .description('すべてのアクティブな変更を一覧表示（非推奨: "openspec list" を使用）')
  .option('--json', 'JSON で出力')
  .option('--long', 'ID、タイトル、件数を表示')
  .action(async (options?: { json?: boolean; long?: boolean }) => {
    try {
      console.error('警告: "openspec change list" は非推奨です。"openspec list" を使ってください。');
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
      // validate() already sets process.exitCode, and Node honours it at
      // natural exit. Calling process.exit() here would skip commander's
      // postAction hook — the same trap called out for `update` below — which
      // kills the telemetry flush and the first-run completions tip on what is
      // a routine outcome, not an error: a change that fails validation.
      await changeCommand.validate(changeName, options);
    } catch (error) {
      console.error(`エラー: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  });

program
  .command('archive [change-name]')
  .description('完了した変更をアーカイブし、本仕様を更新')
  .option('-y, --yes', '確認プロンプトをスキップ')
  .option('--skip-specs', '仕様更新処理をスキップ（インフラ、ツール、docs のみの変更に有用）')
  .option('--no-validate', '検証をスキップ（非推奨、確認が必要）')
  .option('--json', 'JSON として出力（非対話）')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (changeName?: string, options?: ArchiveOptions) => {
    try {
      const archiveCommand = new ArchiveCommand();
      await archiveCommand.execute(changeName, options);
    } catch (error) {
      failWithError(error);
      process.exit(1);
    }
  });

registerSpecCommand(program);
registerConfigCommand(program);
registerSchemaCommand(program);
registerStoreCommand(program);
registerDoctorCommand(program);
registerContextCommand(program);
registerWorksetCommand(program);

// Top-level validate command
program
  .command('validate [item-name]')
  .description('変更と仕様を検証')
  .option('--all', 'すべての変更と仕様を検証')
  .option('--changes', 'すべての変更を検証')
  .option('--specs', 'すべての仕様を検証')
  .option('--archived', 'アーカイブ済みの変更ですべてのタスクが完了しているか検証（pre-commit lint 向け）')
  .option('--type <type>', 'あいまいな場合に項目タイプを指定: change|spec')
  .option('--strict', '厳密検証モードを有効化')
  .option('--json', '検証結果を JSON で出力')
  .option('--concurrency <n>', '最大同時検証数（デフォルトは環境変数 OPENSPEC_CONCURRENCY または 6）')
  .option('--no-interactive', '対話プロンプトを無効化')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (itemName?: string, options?: { all?: boolean; changes?: boolean; specs?: boolean; archived?: boolean; type?: string; strict?: boolean; json?: boolean; noInteractive?: boolean; concurrency?: string; store?: string; storePath?: string }) => {
    try {
      const validateCommand = new ValidateCommand();
      await validateCommand.execute(itemName, options);
    } catch (error) {
      failWithError(error, { enabled: options?.json, fallbackCode: 'validate_error' });
      process.exit(1);
    }
  });

// Top-level show command
program
  .command('show [item-name]')
  .description('変更または仕様を表示')
  .option('--json', 'JSON で出力')
  .option('--type <type>', 'あいまいな場合に項目タイプを指定: change|spec')
  .option('--no-interactive', '対話プロンプトを無効化')
  // change-only flags
  .option('--deltas-only', '差分のみ表示（JSON のみ、変更）')
  .option('--requirements-only', '--deltas-only の別名（非推奨、変更）')
  // spec-only flags
  .option('--requirements', 'JSON のみ: 要件のみ表示（シナリオを除外）')
  .option('--no-scenarios', 'JSON のみ: シナリオ内容を除外')
  .option('-r, --requirement <id>', 'JSON のみ: ID（1 始まり）で特定要件を表示')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  // Explicit registration required: allowUnknownOption would otherwise
  // silently swallow --store-path instead of rejecting it deliberately.
  .addOption(hiddenStorePathOption())
  // allow unknown options to pass-through to underlying command implementation
  .allowUnknownOption(true)
  .action(async (itemName?: string, options?: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: any }) => {
    try {
      const showCommand = new ShowCommand();
      await showCommand.execute(itemName, options ?? {});
    } catch (error) {
      failWithError(error, { enabled: options?.json, fallbackCode: 'show_error' });
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
      failWithError(error);
      process.exit(1);
    }
  });

// Completion command with subcommands
const completionCmd = program
  .command('completion')
  .description('OpenSpec CLI のシェル補完を管理');

completionCmd
  .command('generate [shell]')
  .description('シェル用補完スクリプトを生成（標準出力へ出力）')
  .action(async (shell?: string) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.generate({ shell });
    } catch (error) {
      failWithError(error);
      process.exit(1);
    }
  });

completionCmd
  .command('install [shell]')
  .description('シェル用補完スクリプトをインストール')
  .option('--verbose', 'インストールの詳細出力を表示')
  .action(async (shell?: string, options?: { verbose?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.install({ shell, verbose: options?.verbose });
    } catch (error) {
      failWithError(error);
      process.exit(1);
    }
  });

completionCmd
  .command('uninstall [shell]')
  .description('シェル用補完スクリプトをアンインストール')
  .option('-y, --yes', '確認プロンプトをスキップ')
  .action(async (shell?: string, options?: { yes?: boolean }) => {
    try {
      const completionCommand = new CompletionCommand();
      await completionCommand.uninstall({ shell, yes: options?.yes });
    } catch (error) {
      failWithError(error);
      process.exit(1);
    }
  });

// Hidden command for machine-readable completion data
program
  .command('__complete <type>', { hidden: true })
  .description('機械可読形式で補完データを出力（内部用）')
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
  .option('--change <id>', '状態を表示する変更名')
  .option('--schema <name>', 'スキーマを上書き（config.yaml から自動検出）')
  .option('--json', 'JSON で出力')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (options: StatusOptions) => {
    try {
      await statusCommand(options);
    } catch (error) {
      failWithError(error, { enabled: options.json, fallbackCode: 'change_error' });
      process.exit(1);
    }
  });

// Instructions command
program
  .command('instructions [artifact]')
  .description('アーティファクト作成、適用、アーカイブ用の補足付き指示を出力')
  .option('--change <id>', '変更名')
  .option('--schema <name>', 'スキーマを上書き（config.yaml から自動検出）')
  .option('--json', 'JSON で出力')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (artifactId: string | undefined, options: InstructionsOptions) => {
    try {
      // Workflow instruction surfaces are reserved command branches, not artifacts.
      if (artifactId === 'apply') {
        await applyInstructionsCommand(options);
      } else if (artifactId === 'archive') {
        await archiveInstructionsCommand(options);
      } else {
        await instructionsCommand(artifactId, options);
      }
    } catch (error) {
      failWithError(error, { enabled: options.json, fallbackCode: 'change_error' });
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('スキーマ内のアーティファクトのテンプレートパスを表示')
  .option('--schema <name>', `使用するスキーマ（デフォルト: ${DEFAULT_SCHEMA}）`)
  .option('--json', 'アーティファクト ID からテンプレートパスへの対応を JSON で出力')
  .action(async (options: TemplatesOptions) => {
    try {
      await templatesCommand(options);
    } catch (error) {
      failWithError(error);
      process.exit(1);
    }
  });

// Schemas command
program
  .command('schemas')
  .description('利用可能なワークフロースキーマを説明付きで一覧表示')
  .option('--json', 'JSON で出力（エージェント向け）')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  .action(async (options: SchemasOptions) => {
    try {
      await schemasCommand(options);
    } catch (error) {
      failWithError(error, {
        enabled: options.json,
        payload: { schemas: [], root: null },
        fallbackCode: 'schemas_error',
      });
      process.exit(1);
    }
  });

// New command group with change subcommand
const newCmd = program.command('new').description('新規項目を作成');

newCmd
  .command('change <name>')
  .description('新しい変更ディレクトリを作成')
  .option('--description <text>', 'README.md に追加する説明')
  .option('--goal <text>', '変更に保存する任意の目標メタデータ')
  .option('--schema <name>', `使用するワークフロースキーマ（デフォルト: ${DEFAULT_SCHEMA}）`)
  .option('--json', 'JSON で出力')
  .option('--store <id>', STORE_OPTION_DESCRIPTION)
  .addOption(hiddenStorePathOption())
  // Removed options kept registered (hidden) so users get a deliberate
  // explanation instead of a generic unknown-option error.
  .addOption(new Option('--initiative <id>', 'サポート終了').hideHelp())
  .addOption(new Option('--areas <names>', 'サポート終了').hideHelp())
  .action(async (name: string, options: NewChangeOptions) => {
    try {
      await newChangeCommand(name, options);
    } catch (error) {
      failWithError(error);
      process.exit(1);
    }
  });

export { program };

export function runCli(argv = process.argv): void {
  program.parse(argv);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
