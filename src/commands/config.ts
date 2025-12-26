import { Command } from 'commander';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import {
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  GlobalConfig,
} from '../core/global-config.js';
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
        console.log(formatValueYaml(config));
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
        const confirmed = await confirm({
          message: 'すべての設定をデフォルトに戻しますか？',
          default: false,
        });

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
}
