import { Command } from 'commander';
import { spawn, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getGlobalConfigPath,
  getGlobalConfig,
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
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';
import { CORE_WORKFLOWS, ALL_WORKFLOWS, getProfileWorkflows } from '../core/profiles.js';
import { OPENSPEC_DIR_NAME } from '../core/config.js';
import { hasProjectConfigDrift } from '../core/profile-sync-drift.js';
import { isPromptCancellationError } from './shared-output.js';

type ProfileAction = 'both' | 'delivery' | 'workflows' | 'keep';

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

const WORKFLOW_PROMPT_META: Record<string, WorkflowPromptMeta> = {
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
  return `${workflows.length} selected (${profile})`;
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
      tokens.push(`added ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      tokens.push(`removed ${removed.join(', ')}`);
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
            rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          }
        } catch {
          // If reading fails, treat all as defaults
        }

        console.log(formatValueYaml(config));

        // Annotate profile settings
        const profileSource = rawConfig.profile !== undefined ? '(explicit)' : '(default)';
        const deliverySource = rawConfig.delivery !== undefined ? '(explicit)' : '(default)';
        console.log(`\nProfile settings:`);
        console.log(`  profile: ${config.profile} ${profileSource}`);
        console.log(`  delivery: ${config.delivery} ${deliverySource}`);
        if (config.profile === 'core') {
          console.log(`  workflows: ${CORE_WORKFLOWS.join(', ')} (from core profile)`);
        } else if (config.workflows && config.workflows.length > 0) {
          console.log(`  workflows: ${config.workflows.join(', ')} (explicit)`);
        } else {
          console.log(`  workflows: (none)`);
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
      if (!keyValidation.valid && !allowUnknown) {
        const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
        console.error(`エラー: 無効な設定キー "${key}" です。${reason}`);
        console.error('利用可能なキーを確認するには "openspec config list" を使ってください。');
        console.error('このチェックを回避するには --allow-unknown を渡してください。');
        process.exitCode = 1;
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

      saveGlobalConfig({ ...DEFAULT_CONFIG });
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

      // Spawn editor and wait for it to close
      // Avoid shell parsing to correctly handle paths with spaces in both
      // the editor path and config path
      const child = spawn(editor, [configPath], {
        stdio: 'inherit',
        shell: false,
      });

      await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`エディタがコード ${code} で終了しました`));
          }
        });
        child.on('error', reject);
      });

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
    .description('ワークフロー profile を設定（対話選択または preset shortcut）')
    .action(async (preset?: string) => {
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
        console.error(`エラー: 不明な profile preset "${preset}" です。利用可能な preset: core`);
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

        console.log(chalk.bold('\n現在の profile 設定'));
        console.log(`  Delivery: ${currentState.delivery}`);
        console.log(`  Workflows: ${formatWorkflowSummary(currentState.workflows, currentState.profile)}`);
        console.log(chalk.dim('  Delivery = ワークフローのインストール先（skills, commands, both）'));
        console.log(chalk.dim('  Workflows = 利用可能な action（propose, explore, apply など）'));
        console.log();

        const action = await select<ProfileAction>({
          message: '何を設定しますか？',
          choices: [
            {
              value: 'both',
              name: 'Delivery と workflows',
              description: 'インストールモードと利用可能 action をまとめて更新',
            },
            {
              value: 'delivery',
              name: 'Delivery のみ',
              description: 'ワークフローのインストール先を変更',
            },
            {
              value: 'workflows',
              name: 'Workflows のみ',
              description: '利用可能なワークフローアクションを変更',
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

        if (action === 'both' || action === 'delivery') {
          const deliveryChoices: { value: Delivery; name: string; description: string }[] = [
            {
              value: 'both' as Delivery,
              name: '両方（skills + commands）',
              description: 'workflows を skills と slash commands の両方としてインストール',
            },
            {
              value: 'skills' as Delivery,
              name: 'Skills のみ',
              description: 'workflows を skills としてのみインストール',
            },
            {
              value: 'commands' as Delivery,
              name: 'Commands のみ',
              description: 'workflows を slash commands としてのみインストール',
            },
          ];
          for (const choice of deliveryChoices) {
            if (choice.value === currentState.delivery) {
              choice.name += ' [現在]';
            }
          }

          nextState.delivery = await select<Delivery>({
            message: 'Delivery mode（workflows のインストール方法）:',
            choices: deliveryChoices,
            default: currentState.delivery,
          });
        }

        if (action === 'both' || action === 'workflows') {
          const formatWorkflowChoice = (workflow: string) => {
            const metadata = WORKFLOW_PROMPT_META[workflow] ?? {
              name: workflow,
              description: `Workflow: ${workflow}`,
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
            instructions: 'Space で切り替え、Enter で確定',
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
          nextState.profile = deriveProfileFromWorkflowSelection(selectedWorkflows);
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
        config.workflows = nextState.workflows;
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
              execSync('npx openspec update', { stdio: 'inherit', cwd: projectDir });
              console.log('他のプロジェクトに適用するには、それぞれで `openspec update` を実行してください。');
            } catch {
              console.error('`openspec update` に失敗しました。profile 変更を適用するには手動で実行してください。');
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
