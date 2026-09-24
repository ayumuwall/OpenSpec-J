import { Command } from 'commander';
import type { ChildProcess, spawn as nodeSpawn } from 'node:child_process';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import {
  getGlobalConfigPath,
  getGlobalConfig,
  isConfigRootObject,
  isGlobalConfigUnreadable,
  saveGlobalConfig,
  GlobalConfig,
} from '../core/global-config.js';
import type { Profile, Delivery } from '../core/global-config.js';
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  formatValueYaml,
  validateConfigKeyPath,
  hasUnsafeKeySegment,
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';
import { CORE_WORKFLOWS, ALL_WORKFLOWS, getProfileWorkflows } from '../core/profiles.js';
import { OPENSPEC_DIR_NAME } from '../core/config.js';
import { hasProjectConfigDrift } from '../core/profile-sync-drift.js';
import { UpdateCommand } from '../core/update.js';
import { asErrorMessage, isPromptCancellationError } from './shared-output.js';

type EditorOutcome =
  | { code: number | null; signal: NodeJS.Signals | null }
  | { error: Error };

// cross-spawn finds `.cmd` shims such as `code.cmd` on Windows and escapes each
// argument for cmd.exe; elsewhere it is plain spawn. Loaded lazily so other
// commands skip its module graph.
let cachedSpawn: typeof nodeSpawn | undefined;
function loadSpawn(): typeof nodeSpawn {
  if (cachedSpawn === undefined) {
    cachedSpawn = createRequire(import.meta.url)('cross-spawn') as typeof nodeSpawn;
  }
  return cachedSpawn;
}

/**
 * Splits an EDITOR or VISUAL value into a program and its arguments without
 * running a shell, so `;`, `|`, `$VAR`, `~` and backticks are plain characters.
 * Double quotes group words. On POSIX, single quotes group words too and a
 * backslash escapes the next character (inside double quotes only `"` and `\`).
 * On Windows a backslash is a path separator and a single quote is a plain
 * character. Returns null when a quote is left open.
 */
export function splitEditorCommand(value: string, platform: NodeJS.Platform = process.platform): string[] | null {
  const posix = platform !== 'win32';
  const words: string[] = [];
  let word = '';
  let inWord = false;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else word += ch;
      continue;
    }
    if (posix && ch === '\\' && i + 1 < value.length) {
      const next = value[i + 1];
      if (quote === '"' && next !== '"' && next !== '\\') {
        word += ch;
      } else {
        word += next;
        i++;
      }
      inWord = true;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else word += ch;
      continue;
    }
    if (ch === '"' || (posix && ch === "'")) {
      quote = ch;
      inWord = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (inWord) words.push(word);
      word = '';
      inWord = false;
      continue;
    }
    word += ch;
    inWord = true;
  }

  if (quote) return null;
  if (inWord) words.push(word);
  return words;
}

/**
 * Starts the user's editor on `filePath`, never through a shell.
 *
 * EDITOR and VISUAL hold a command line, not a program name: `code --wait`
 * and `"/path with spaces/subl" -w` are both ordinary values, so the value is
 * split into words and the file path is appended as its own argument. A value
 * that is itself the absolute path of an existing file is run as-is, so an
 * unquoted editor path with spaces keeps working.
 */
function spawnEditor(editor: string, filePath: string): ChildProcess {
  const words = path.isAbsolute(editor) && fs.existsSync(editor) ? [editor] : splitEditorCommand(editor);
  if (words === null) {
    throw new Error('値に閉じられていない引用符があります');
  }
  if (words.length === 0) {
    throw new Error('値が空です');
  }
  const [program, ...args] = words;
  return loadSpawn()(program, [...args, filePath], { stdio: 'inherit', shell: false });
}

/** Runs the editor on `filePath` and resolves once it has closed or failed to start. */
function runEditor(editor: string, filePath: string): Promise<EditorOutcome> {
  return new Promise((resolve) => {
    try {
      const child = spawnEditor(editor, filePath);
      child.once('error', (error) => resolve({ error }));
      child.once('close', (code, signal) => resolve({ code, signal }));
    } catch (error) {
      resolve({ error: error instanceof Error ? error : new Error(String(error)) });
    }
  });
}

function reportEditorFailure(editor: string, outcome: EditorOutcome): void {
  if ('error' in outcome) {
    console.error(`エラー: エディタ "${editor}" を起動できませんでした: ${outcome.error.message}`);
  } else if (outcome.signal) {
    console.error(`エラー: エディタ "${editor}" が ${outcome.signal} により終了しました`);
  } else {
    console.error(`エラー: エディタ "${editor}" がコード ${outcome.code} で終了しました`);
  }
  // Only a missing program earns the hint: EACCES or EPERM means it exists.
  if ('error' in outcome && (outcome.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.error('EDITOR または VISUAL にインストール済みのエディタのコマンドを設定してください。例: export EDITOR="code --wait"');
  }
}

type ProfileAction = 'both' | 'delivery' | 'workflows' | 'keep';

/**
 * A config file that exists but cannot be parsed is still the user's file:
 * getGlobalConfig() reads it as defaults, and saving those back would erase
 * every setting in it. Reports the fix instead, and returns true when it did.
 */
function refuseUnreadableConfig(): boolean {
  if (!isGlobalConfigUnreadable()) {
    return false;
  }
  console.error(`エラー: ${getGlobalConfigPath()} を解析できなかったため、変更しませんでした。`);
  console.error('"openspec config edit" で修正するか、"openspec config reset --all" でリセットしてください。');
  process.exitCode = 1;
  return true;
}

interface ProfileState {
  profile: Profile;
  delivery: Delivery;
  workflows: string[];
}

interface ProfileStateDiff {
  hasChanges: boolean;
  lines: string[];
}

interface WorkflowPromptMeta {
  name: string;
  description: string;
}

export const WORKFLOW_PROMPT_META: Record<string, WorkflowPromptMeta> = {
  propose: {
    name: '変更を提案',
    description: 'リクエストから proposal、design、tasks を作成',
  },
  explore: {
    name: 'アイデアを探索',
    description: '実装前に問題を調査',
  },
  new: {
    name: '新規変更',
    description: '新しい変更のひな形を素早く作成',
  },
  continue: {
    name: '変更を継続',
    description: '既存の変更作業を再開',
  },
  apply: {
    name: 'タスクを適用',
    description: '現在の変更のタスクを実装',
  },
  update: {
    name: '変更を更新',
    description: '既存の変更にある計画アーティファクトを改訂',
  },
  ff: {
    name: 'Fast-forward',
    description: '高速な実装ワークフローを実行',
  },
  sync: {
    name: '仕様を同期',
    description: '変更アーティファクトと仕様を同期',
  },
  archive: {
    name: '変更をアーカイブ',
    description: '完了した変更を確定してアーカイブ',
  },
  'bulk-archive': {
    name: '一括アーカイブ',
    description: '複数の完了済み変更をまとめてアーカイブ',
  },
  verify: {
    name: '変更を検証',
    description: '変更に対する検証チェックを実行',
  },
  onboard: {
    name: 'オンボーディング',
    description: 'OpenSpec のガイド付きオンボーディングフロー',
  },
};


/**
 * Resolve the effective current profile state from global config defaults.
 */
export function resolveCurrentProfileState(config: GlobalConfig): ProfileState {
  const profile = config.profile || 'core';
  const delivery = config.delivery || 'both';
  const workflows = [
    ...getProfileWorkflows(profile, config.workflows ? [...config.workflows] : undefined),
  ];
  return { profile, delivery, workflows };
}

/**
 * Derive profile type from selected workflows.
 */
export function deriveProfileFromWorkflowSelection(selectedWorkflows: string[]): Profile {
  const isCoreMatch =
    selectedWorkflows.length === CORE_WORKFLOWS.length &&
    CORE_WORKFLOWS.every((w) => selectedWorkflows.includes(w));
  return isCoreMatch ? 'core' : 'custom';
}

/**
 * Format a compact workflow summary for the profile header.
 */
export function formatWorkflowSummary(workflows: readonly string[], profile: Profile): string {
  return `${workflows.length}個を選択（${profile}）`;
}

function stableWorkflowOrder(workflows: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const workflow of ALL_WORKFLOWS) {
    if (workflows.includes(workflow) && !seen.has(workflow)) {
      ordered.push(workflow);
      seen.add(workflow);
    }
  }

  const extras = workflows.filter((w) => !ALL_WORKFLOWS.includes(w as (typeof ALL_WORKFLOWS)[number]));
  extras.sort();
  for (const extra of extras) {
    if (!seen.has(extra)) {
      ordered.push(extra);
      seen.add(extra);
    }
  }

  return ordered;
}

/**
 * Build a user-facing diff summary between two profile states.
 */
export function diffProfileState(before: ProfileState, after: ProfileState): ProfileStateDiff {
  const lines: string[] = [];

  if (before.delivery !== after.delivery) {
    lines.push(`delivery: ${before.delivery} -> ${after.delivery}`);
  }

  if (before.profile !== after.profile) {
    lines.push(`profile: ${before.profile} -> ${after.profile}`);
  }

  const beforeOrdered = stableWorkflowOrder(before.workflows);
  const afterOrdered = stableWorkflowOrder(after.workflows);
  const beforeSet = new Set(beforeOrdered);
  const afterSet = new Set(afterOrdered);

  const added = afterOrdered.filter((w) => !beforeSet.has(w));
  const removed = beforeOrdered.filter((w) => !afterSet.has(w));

  if (added.length > 0 || removed.length > 0) {
    const tokens: string[] = [];
    if (added.length > 0) {
      tokens.push(`追加 ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      tokens.push(`削除 ${removed.join(', ')}`);
    }
    lines.push(`workflows: ${tokens.join('; ')}`);
  }

  return {
    hasChanges: lines.length > 0,
    lines,
  };
}

function maybeWarnProjectConfigDrift(
  projectDir: string,
  state: ProfileState,
  colorize: (message: string) => string
): void {
  const openspecDir = path.join(projectDir, OPENSPEC_DIR_NAME);
  if (!fs.existsSync(openspecDir)) {
    return;
  }
  if (!hasProjectConfigDrift(projectDir, state.workflows, state.delivery)) {
    return;
  }
  console.log(colorize('警告: グローバル設定がこのプロジェクトに反映されていません。同期するには `openspec update` を実行してください。'));
}

function printConfigProfileApplyGuidance(): void {
  console.log('設定を更新しました。プロジェクトに適用するには各プロジェクトで `openspec update` を実行してください。');
}

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
    .action(() => {
      console.log(getGlobalConfigPath());
  });

  // config list
  configCmd
    .command('list')
    .description('現在の設定をすべて表示')
    .option('--json', 'JSON で出力')
    .action((options: { json?: boolean }) => {
      const config = getGlobalConfig();

      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        // Read raw config to determine which values are explicit vs defaults
        const configPath = getGlobalConfigPath();
        let rawConfig: Record<string, unknown> = {};
        try {
          if (fs.existsSync(configPath)) {
            const parsed: unknown = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            // A non-object root holds no explicit settings, and reading a key
            // off `null` would crash this read-only command.
            if (isConfigRootObject(parsed)) {
              rawConfig = parsed as Record<string, unknown>;
            }
          }
        } catch {
          // If reading fails, treat all as defaults
        }

        console.log(formatValueYaml(config));

        // Annotate profile settings
        const profileSource = rawConfig.profile !== undefined ? '(明示指定)' : '(既定値)';
        const deliverySource = rawConfig.delivery !== undefined ? '(明示指定)' : '(既定値)';
        console.log(`\nプロファイル設定:`);
        console.log(`  profile: ${config.profile} ${profileSource}`);
        console.log(`  delivery: ${config.delivery} ${deliverySource}`);
        if (config.profile === 'core') {
          console.log(`  workflows: ${CORE_WORKFLOWS.join(', ')} (core プロファイル由来)`);
        } else if (config.workflows && config.workflows.length > 0) {
          console.log(`  workflows: ${config.workflows.join(', ')} (明示指定)`);
        } else {
          console.log(`  workflows: (なし)`);
        }
      }
  });

  // config get
  configCmd
    .command('get <key>')
    .description('特定の値を取得（raw、スクリプト向け）')
    .action((key: string) => {
      const config = getGlobalConfig();
      const value = getNestedValue(config as Record<string, unknown>, key);

      if (value === undefined) {
        process.exitCode = 1;
        return;
      }

      if (typeof value === 'object' && value !== null) {
        console.log(JSON.stringify(value));
      } else {
        console.log(String(value));
      }
  });

  // config set
  configCmd
    .command('set <key> <value>')
    .description('値を設定（型は自動変換）')
    .option('--string', '値を文字列として保存')
    .option('--allow-unknown', '未知のキーの設定を許可')
    .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      const allowUnknown = Boolean(options.allowUnknown);
      const keyValidation = validateConfigKeyPath(key);
      // --allow-unknown relaxes the known-key check, but never the prototype-safety check.
      const unsafeKey = hasUnsafeKeySegment(key);
      if (!keyValidation.valid && (!allowUnknown || unsafeKey)) {
        const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
        console.error(`エラー: 無効な設定キー "${key}" です。${reason}`);
        console.error('利用可能なキーを確認するには "openspec config list" を使ってください。');
        if (!allowUnknown && !unsafeKey) {
          console.error('このチェックを回避するには --allow-unknown を渡してください。');
        }
        process.exitCode = 1;
        return;
      }

      if (refuseUnreadableConfig()) {
        return;
      }

      const config = getGlobalConfig() as Record<string, unknown>;
      const coercedValue = coerceValue(value, options.string || false);

      // Create a copy to validate before saving
      const newConfig = JSON.parse(JSON.stringify(config));
      setNestedValue(newConfig, key, coercedValue);

      // Validate the new config
      const validation = validateConfig(newConfig);
      if (!validation.success) {
        console.error(`エラー: 無効な設定です - ${validation.error}`);
        process.exitCode = 1;
        return;
      }

      // Apply changes and save
      setNestedValue(config, key, coercedValue);
      saveGlobalConfig(config as GlobalConfig);

      const displayValue =
        typeof coercedValue === 'string' ? `"${coercedValue}"` : String(coercedValue);
      console.log(`${key} = ${displayValue} を設定しました`);
  });

  // config unset
  configCmd
    .command('unset <key>')
    .description('キーを削除（デフォルトへ戻す）')
    .action((key: string) => {
      if (refuseUnreadableConfig()) {
        return;
      }

      const config = getGlobalConfig() as Record<string, unknown>;
      const existed = deleteNestedValue(config, key);

      if (existed) {
        saveGlobalConfig(config as GlobalConfig);
        console.log(`${key} を削除しました（デフォルトへ戻しました）`);
      } else {
        console.log(`キー "${key}" は設定されていません`);
      }
  });

  // config reset
  configCmd
    .command('reset')
    .description('設定をデフォルトへリセット')
    .option('--all', 'すべての設定をリセット（必須）')
    .option('-y, --yes', '確認プロンプトをスキップ')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      if (!options.all) {
        console.error('エラー: reset には --all フラグが必要です');
        console.error('使用方法: openspec config reset --all [-y]');
        process.exitCode = 1;
        return;
      }

      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        let confirmed: boolean;
        try {
          confirmed = await confirm({
            message: 'すべての設定をデフォルトへリセットしますか？',
            default: false,
          });
        } catch (error) {
          if (isPromptCancellationError(error)) {
            console.log('リセットをキャンセルしました。');
            process.exitCode = 130;
            return;
          }
          throw error;
        }

        if (!confirmed) {
          console.log('リセットをキャンセルしました。');
          return;
        }
      }

      // A reset is the one write meant to replace a file that cannot be parsed.
      saveGlobalConfig({ ...DEFAULT_CONFIG }, { replaceUnreadable: true });
      console.log('設定をデフォルトへリセットしました');
    });

  // config edit
  configCmd
    .command('edit')
    .description('$EDITOR で設定を開く')
    .action(async () => {
      const editor = process.env.EDITOR || process.env.VISUAL;

      if (!editor) {
        console.error('エラー: エディタが設定されていません');
        console.error('EDITOR または VISUAL 環境変数に使いたいエディタを設定してください');
        console.error('例: export EDITOR=vim');
        process.exitCode = 1;
        return;
      }

      const configPath = getGlobalConfigPath();

      // Ensure config file exists with defaults
      if (!fs.existsSync(configPath)) {
        saveGlobalConfig({ ...DEFAULT_CONFIG });
      }

      // Wait for the editor to close; a failure is reported, never thrown.
      const outcome = await runEditor(editor, configPath);
      if ('error' in outcome || outcome.code !== 0) {
        reportEditorFailure(editor, outcome);
        process.exitCode = 1;
        return;
      }

      try {
        const rawConfig = fs.readFileSync(configPath, 'utf-8');
        const parsedConfig = JSON.parse(rawConfig);
        const validation = validateConfig(parsedConfig);

        if (!validation.success) {
          console.error(`エラー: 無効な設定です - ${validation.error}`);
          process.exitCode = 1;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          console.error(`エラー: 設定ファイルが見つかりません: ${configPath}`);
        } else if (error instanceof SyntaxError) {
          console.error(`エラー: ${configPath} の JSON が無効です`);
          console.error(error.message);
        } else {
          console.error(`エラー: 設定を検証できません - ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exitCode = 1;
      }
  });

  // config profile [preset]
  configCmd
    .command('profile [preset]')
    .description('ワークフローのプロファイルを設定（対話選択またはプリセット指定）')
    .action(async (preset?: string) => {
      if (refuseUnreadableConfig()) {
        return;
      }

      // Preset shortcut: `openspec config profile core`
      if (preset === 'core') {
        const config = getGlobalConfig();
        config.profile = 'core';
        config.workflows = [...CORE_WORKFLOWS];
        // Preserve delivery setting
        saveGlobalConfig(config);
        printConfigProfileApplyGuidance();
        return;
      }

      if (preset) {
        console.error(`エラー: 不明なプロファイルのプリセット "${preset}" です。利用可能なプリセット: core`);
        process.exitCode = 1;
        return;
      }

      // Non-interactive check
      if (!process.stdout.isTTY) {
        console.error('対話モードが必要です。`openspec config profile core` を使うか、環境変数 / フラグで設定してください。');
        process.exitCode = 1;
        return;
      }

      // Interactive picker
      const { select, checkbox, confirm } = await import('@inquirer/prompts');
      const chalk = (await import('chalk')).default;

      try {
        const config = getGlobalConfig();
        const currentState = resolveCurrentProfileState(config);

        console.log(chalk.bold('\n現在のプロファイル設定'));
        console.log(`  インストール形式: ${currentState.delivery}`);
        console.log(`  ワークフロー: ${formatWorkflowSummary(currentState.workflows, currentState.profile)}`);
        console.log(chalk.dim('  インストール形式: スキル（skills）、スラッシュコマンド（commands）、両方（both）'));
        console.log(chalk.dim('  ワークフロー: 利用する操作（propose, explore, apply など）'));
        console.log();

        const action = await select<ProfileAction>({
          message: '何を設定しますか？',
          choices: [
            {
              value: 'both',
              name: 'インストール形式とワークフロー',
              description: 'インストール形式と利用するワークフローをまとめて変更',
            },
            {
              value: 'delivery',
              name: 'インストール形式のみ',
              description: 'スキルとスラッシュコマンドのどちらをインストールするか変更',
            },
            {
              value: 'workflows',
              name: 'ワークフローのみ',
              description: '利用するワークフローを変更',
            },
            {
              value: 'keep',
              name: '現在の設定を維持（終了）',
              description: '設定を変更せず終了',
            },
          ],
        });

        if (action === 'keep') {
          console.log('設定変更はありません。');
          maybeWarnProjectConfigDrift(process.cwd(), currentState, chalk.yellow);
          return;
        }

        const nextState: ProfileState = {
          profile: currentState.profile,
          delivery: currentState.delivery,
          workflows: [...currentState.workflows],
        };
        let workflowSelectionChanged = false;

        if (action === 'both' || action === 'delivery') {
          const deliveryChoices: { value: Delivery; name: string; description: string }[] = [
            {
              value: 'both' as Delivery,
              name: '両方（スキルとスラッシュコマンド）',
              description: 'ワークフローをスキルとスラッシュコマンドの両方としてインストール',
            },
            {
              value: 'skills' as Delivery,
              name: 'スキルのみ',
              description: 'ワークフローをスキルとしてのみインストール',
            },
            {
              value: 'commands' as Delivery,
              name: 'スラッシュコマンドのみ',
              description: 'ワークフローをスラッシュコマンドとしてのみインストール',
            },
          ];
          for (const choice of deliveryChoices) {
            if (choice.value === currentState.delivery) {
              choice.name += ' [現在]';
            }
          }

          nextState.delivery = await select<Delivery>({
            message: 'ワークフローのインストール形式を選択してください:',
            choices: deliveryChoices,
            default: currentState.delivery,
          });
        }

        if (action === 'both' || action === 'workflows') {
          const formatWorkflowChoice = (workflow: string) => {
            const metadata = WORKFLOW_PROMPT_META[workflow] ?? {
              name: workflow,
              description: `ワークフロー: ${workflow}`,
            };
            return {
              value: workflow,
              name: metadata.name,
              description: metadata.description,
              short: metadata.name,
              checked: currentState.workflows.includes(workflow),
            };
          };

          const selectedWorkflows = await checkbox<string>({
            message: '利用可能にするワークフローを選択してください:',
            pageSize: ALL_WORKFLOWS.length,
            theme: {
              icon: {
                checked: '[x]',
                unchecked: '[ ]',
              },
            },
            choices: ALL_WORKFLOWS.map(formatWorkflowChoice),
          });
          nextState.workflows = selectedWorkflows;
          workflowSelectionChanged =
            selectedWorkflows.length !== currentState.workflows.length ||
            selectedWorkflows.some((workflow) => !currentState.workflows.includes(workflow));
          nextState.profile = workflowSelectionChanged
            ? deriveProfileFromWorkflowSelection(selectedWorkflows)
            : currentState.profile;
        }

        const diff = diffProfileState(currentState, nextState);
        if (!diff.hasChanges) {
          console.log('設定変更はありません。');
          maybeWarnProjectConfigDrift(process.cwd(), nextState, chalk.yellow);
          return;
        }

        console.log(chalk.bold('\n設定変更:'));
        for (const line of diff.lines) {
          console.log(`  ${line}`);
        }
        console.log();

        config.profile = nextState.profile;
        config.delivery = nextState.delivery;
        if (currentState.profile !== 'custom' || workflowSelectionChanged) {
          config.workflows = nextState.workflows;
        }
        saveGlobalConfig(config);

        // Check if inside an OpenSpec project
        const projectDir = process.cwd();
        const openspecDir = path.join(projectDir, OPENSPEC_DIR_NAME);
        if (fs.existsSync(openspecDir)) {
          const applyNow = await confirm({
            message: 'このプロジェクトに今すぐ変更を適用しますか？',
            default: true,
          });

          if (applyNow) {
            try {
              await new UpdateCommand().execute(projectDir);
              console.log('他のプロジェクトに適用するには、それぞれで `openspec update` を実行してください。');
            } catch (error) {
              console.error(`\`openspec update\` に失敗しました: ${asErrorMessage(error)}`);
              console.error('profile 変更を適用するには手動で実行してください。');
              process.exitCode = 1;
            }
            return;
          }
        }

        printConfigProfileApplyGuidance();
      } catch (error) {
        if (isPromptCancellationError(error)) {
          console.log('config profile をキャンセルしました。');
          process.exitCode = 130;
          return;
        }
        throw error;
      }
  });
}
