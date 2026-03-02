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
    name: 'Propose change',
    description: 'Create proposal, design, and tasks from a request',
  },
  explore: {
    name: 'Explore ideas',
    description: 'Investigate a problem before implementation',
  },
  new: {
    name: 'New change',
    description: 'Create a new change scaffold quickly',
  },
  continue: {
    name: 'Continue change',
    description: 'Resume work on an existing change',
  },
  apply: {
    name: 'Apply tasks',
    description: 'Implement tasks from the current change',
  },
  ff: {
    name: 'Fast-forward',
    description: 'Run a faster implementation workflow',
  },
  sync: {
    name: 'Sync specs',
    description: 'Sync change artifacts with specs',
  },
  archive: {
    name: 'Archive change',
    description: 'Finalize and archive a completed change',
  },
  'bulk-archive': {
    name: 'Bulk archive',
    description: 'Archive multiple completed changes together',
  },
  verify: {
    name: 'Verify change',
    description: 'Run verification checks against a change',
  },
  onboard: {
    name: 'Onboard',
    description: 'Guided onboarding flow for OpenSpec',
  },
};

function isPromptCancellationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.message.includes('force closed the prompt with SIGINT'))
  );
}

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

function maybeWarnConfigDrift(
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
  console.log(colorize('Warning: Global config is not applied to this project. Run `openspec update` to sync.'));
}

/**
 * Register the config command and all its subcommands.
 *
 * @param program - The Commander program instance
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('グローバルな OpenSpec 設定を表示・変更する')
    .option('--scope <scope>', '設定スコープ（現在は "global" のみ対応）')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.scope && opts.scope !== 'global') {
        console.error('エラー: プロジェクトローカル設定はまだ実装されていません');
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
    .description('現在の設定を一覧表示')
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
    .description('特定の値を取得（生値、スクリプト向け）')
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
    .description('値を設定（型は自動推論）')
    .option('--string', '文字列として保存する')
    .option('--allow-unknown', '未知のキーの設定を許可')
    .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      const allowUnknown = Boolean(options.allowUnknown);
      const keyValidation = validateConfigKeyPath(key);
      if (!keyValidation.valid && !allowUnknown) {
        const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
        console.error(`エラー: 設定キー "${key}" が無効です。${reason}`);
        console.error('利用可能なキーは "openspec config list" で確認してください。');
        console.error('--allow-unknown を付けるとこのチェックを無視できます。');
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
        console.error(`エラー: 設定が無効です - ${validation.error}`);
        process.exitCode = 1;
        return;
      }

      // Apply changes and save
      setNestedValue(config, key, coercedValue);
      saveGlobalConfig(config as GlobalConfig);

      const displayValue =
        typeof coercedValue === 'string' ? `"${coercedValue}"` : String(coercedValue);
      console.log(`${key} を ${displayValue} に設定しました`);
    });

  // config unset
  configCmd
    .command('unset <key>')
    .description('キーを削除（デフォルトに戻す）')
    .action((key: string) => {
      const config = getGlobalConfig() as Record<string, unknown>;
      const existed = deleteNestedValue(config, key);

      if (existed) {
        saveGlobalConfig(config as GlobalConfig);
        console.log(`${key} を解除しました（デフォルトに戻しました）`);
      } else {
        console.log(`キー "${key}" は設定されていません`);
      }
    });

  // config reset
  configCmd
    .command('reset')
    .description('設定をデフォルトに戻す')
    .option('--all', 'すべての設定をリセット（必須）')
    .option('-y, --yes', '確認プロンプトをスキップ')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      if (!options.all) {
        console.error('エラー: reset には --all が必要です');
        console.error('使い方: openspec config reset --all [-y]');
        process.exitCode = 1;
        return;
      }

      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        let confirmed: boolean;
        try {
          confirmed = await confirm({
            message: 'すべての設定をデフォルトに戻しますか？',
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
      console.log('設定をデフォルトに戻しました');
    });

  // config edit
  configCmd
    .command('edit')
    .description('$EDITOR で設定を開く')
    .action(async () => {
      const editor = process.env.EDITOR || process.env.VISUAL;

      if (!editor) {
        console.error('エラー: エディタが設定されていません');
        console.error('EDITOR または VISUAL 環境変数に利用したいエディタを設定してください');
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
            reject(new Error(`エディタが終了コード ${code} で終了しました`));
          }
        });
        child.on('error', reject);
      });

      try {
        const rawConfig = fs.readFileSync(configPath, 'utf-8');
        const parsedConfig = JSON.parse(rawConfig);
        const validation = validateConfig(parsedConfig);

        if (!validation.success) {
          console.error(`エラー: 設定が無効です - ${validation.error}`);
          process.exitCode = 1;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          console.error(`エラー: 設定ファイルが見つかりません (${configPath})`);
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
    .description('Configure workflow profile (interactive picker or preset shortcut)')
    .action(async (preset?: string) => {
      // Preset shortcut: `openspec config profile core`
      if (preset === 'core') {
        const config = getGlobalConfig();
        config.profile = 'core';
        config.workflows = [...CORE_WORKFLOWS];
        // Preserve delivery setting
        saveGlobalConfig(config);
        console.log('Config updated. Run `openspec update` in your projects to apply.');
        return;
      }

      if (preset) {
        console.error(`Error: Unknown profile preset "${preset}". Available presets: core`);
        process.exitCode = 1;
        return;
      }

      // Non-interactive check
      if (!process.stdout.isTTY) {
        console.error('Interactive mode required. Use `openspec config profile core` or set config via environment/flags.');
        process.exitCode = 1;
        return;
      }

      // Interactive picker
      const { select, checkbox, confirm } = await import('@inquirer/prompts');
      const chalk = (await import('chalk')).default;

      try {
        const config = getGlobalConfig();
        const currentState = resolveCurrentProfileState(config);

        console.log(chalk.bold('\nCurrent profile settings'));
        console.log(`  Delivery: ${currentState.delivery}`);
        console.log(`  Workflows: ${formatWorkflowSummary(currentState.workflows, currentState.profile)}`);
        console.log(chalk.dim('  Delivery = where workflows are installed (skills, commands, or both)'));
        console.log(chalk.dim('  Workflows = which actions are available (propose, explore, apply, etc.)'));
        console.log();

        const action = await select<ProfileAction>({
          message: 'What do you want to configure?',
          choices: [
            {
              value: 'both',
              name: 'Delivery and workflows',
              description: 'Update install mode and available actions together',
            },
            {
              value: 'delivery',
              name: 'Delivery only',
              description: 'Change where workflows are installed',
            },
            {
              value: 'workflows',
              name: 'Workflows only',
              description: 'Change which workflow actions are available',
            },
            {
              value: 'keep',
              name: 'Keep current settings (exit)',
              description: 'Leave configuration unchanged and exit',
            },
          ],
        });

        if (action === 'keep') {
          console.log('No config changes.');
          maybeWarnConfigDrift(process.cwd(), currentState, chalk.yellow);
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
              name: 'Both (skills + commands)',
              description: 'Install workflows as both skills and slash commands',
            },
            {
              value: 'skills' as Delivery,
              name: 'Skills only',
              description: 'Install workflows only as skills',
            },
            {
              value: 'commands' as Delivery,
              name: 'Commands only',
              description: 'Install workflows only as slash commands',
            },
          ];
          for (const choice of deliveryChoices) {
            if (choice.value === currentState.delivery) {
              choice.name += ' [current]';
            }
          }

          nextState.delivery = await select<Delivery>({
            message: 'Delivery mode (how workflows are installed):',
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
            message: 'Select workflows to make available:',
            instructions: 'Space to toggle, Enter to confirm',
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
          console.log('No config changes.');
          maybeWarnConfigDrift(process.cwd(), nextState, chalk.yellow);
          return;
        }

        console.log(chalk.bold('\nConfig changes:'));
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
            message: 'Apply changes to this project now?',
            default: true,
          });

          if (applyNow) {
            try {
              execSync('npx openspec update', { stdio: 'inherit', cwd: projectDir });
              console.log('Run `openspec update` in your other projects to apply.');
            } catch {
              console.error('`openspec update` failed. Please run it manually to apply the profile changes.');
              process.exitCode = 1;
            }
            return;
          }
        }

        console.log('Config updated. Run `openspec update` in your projects to apply.');
      } catch (error) {
        if (isPromptCancellationError(error)) {
          console.log('Config profile cancelled.');
          process.exitCode = 130;
          return;
        }
        throw error;
      }
    });
}
