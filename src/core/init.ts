/**
 * init コマンド
 *
 * OpenSpec を Agent Skills と /opsx:* スラッシュコマンド付きでセットアップする。
 * 旧 init / experimental を統合したセットアップコマンド。
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { transformToHyphenCommands } from '../utils/command-references.js';
import {
  AI_TOOLS,
  OPENSPEC_DIR_NAME,
  AIToolOption,
} from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from './command-generation/index.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDetectionSummary,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import {
  SKILL_NAMES,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  type ToolSkillStatus,
} from './shared/index.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

// -----------------------------------------------------------------------------
// 定数
// -----------------------------------------------------------------------------

const DEFAULT_SCHEMA = 'spec-driven';

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

// -----------------------------------------------------------------------------
// 型
// -----------------------------------------------------------------------------

type InitCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
};

// -----------------------------------------------------------------------------
// init コマンドクラス
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const openspecDir = OPENSPEC_DIR_NAME;
    const openspecPath = path.join(projectPath, openspecDir);

    // 検証は裏側で静かに実行する
    const extendMode = await this.validate(projectPath, openspecPath);

    // 旧ファイルを検出してクリーンアップを処理する
    await this.handleLegacyCleanup(projectPath, extendMode);

    // アニメーション付きウェルカム画面（対話モードのみ）
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // 処理前にツール状態を取得
    const toolStates = getToolStates(projectPath);

    // ツール選択を取得
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode);

    // 選択されたツールを検証
    const validatedTools = this.validateTools(selectedToolIds, toolStates);

    // ディレクトリ構成と設定を作成
    await this.createDirectoryStructure(openspecPath, extendMode);

    // 各ツールのスキル/コマンドを生成
    const results = await this.generateSkillsAndCommands(projectPath, validatedTools);

    // 必要なら config.yaml を作成
    const configStatus = await this.createConfig(openspecPath, extendMode);

    // 成功メッセージを表示
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus);
  }

  // ═══════════════════════════════════════════════════════════
  // 検証とセットアップ
  // ═══════════════════════════════════════════════════════════

  private async validate(
    projectPath: string,
    openspecPath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(openspecPath);

    // 書き込み権限を確認
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`${projectPath} への書き込み権限がありません`);
    }
    return extendMode;
  }

  private canPromptInteractively(): boolean {
    if (this.interactiveOption === false) return false;
    if (this.toolsArg !== undefined) return false;
    return isInteractive({ interactive: this.interactiveOption });
  }

  // ═══════════════════════════════════════════════════════════
  // 旧ファイルのクリーンアップ
  // ═══════════════════════════════════════════════════════════

  private async handleLegacyCleanup(projectPath: string, extendMode: boolean): Promise<void> {
    // 旧ファイルを検出
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return; // 旧ファイルが見つからない場合は何もしない
    }

    // 検出内容を表示
    console.log();
    console.log(formatDetectionSummary(detection));
    console.log();

    const canPrompt = this.canPromptInteractively();

    if (this.force) {
      // --force 指定: 自動クリーンアップで続行
      await this.performLegacyCleanup(projectPath, detection);
      return;
    }

    if (!canPrompt) {
      // 非対話モードで --force がない場合は中止
      console.log(chalk.red('非対話モードで旧ファイルが検出されました。'));
      console.log(chalk.dim('対話モードでアップグレードするか、--force で自動クリーンアップしてください。'));
      process.exit(1);
    }

    // 対話モード: 確認プロンプトを表示
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: '旧ファイルをアップグレードしてクリーンアップしますか？',
      default: true,
    });

    if (!shouldCleanup) {
      console.log(chalk.dim('初期化を中止しました。'));
      console.log(chalk.dim('--force でこのプロンプトを省略するか、手動で旧ファイルを削除してください。'));
      process.exit(0);
    }

    await this.performLegacyCleanup(projectPath, detection);
  }

  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = ora('旧ファイルをクリーンアップ中...').start();

    const result = await cleanupLegacyArtifacts(projectPath, detection);

    spinner.succeed('旧ファイルのクリーンアップが完了しました');

    const summary = formatCleanupSummary(result);
    if (summary) {
      console.log();
      console.log(summary);
    }

    console.log();
  }

  // ═══════════════════════════════════════════════════════════
  // ツール選択
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    toolStates: Map<string, ToolSkillStatus>,
    extendMode: boolean
  ): Promise<string[]> {
    // 先に --tools 指定を確認
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const canPrompt = this.canPromptInteractively();

    if (!canPrompt || validTools.length === 0) {
      throw new Error(
        `必須オプション --tools が指定されていません。利用可能なツール:\n  ${validTools.join('\n  ')}\n\n--tools all、--tools none、または --tools claude,cursor,... を使用してください。`
      );
    }

    // 対話モード: 検索可能な複数選択を表示
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // 設定済みフラグを付けて、設定済みツールを先に並べる
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          preSelected: configured, // 既に設定済みのツールを先に選択しておく
        };
      })
      .sort((a, b) => {
        // 設定済みツールを先頭に
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        return 0;
      });

    const selectedTools = await searchableMultiSelect({
      message: `セットアップするツールを選択してください（利用可能: ${validTools.length}）`,
      pageSize: 15,
      choices: sortedChoices,
      validate: (selected: string[]) => selected.length > 0 || '少なくとも 1 つ選択してください',
    });

    if (selectedTools.length === 0) {
      throw new Error('少なくとも 1 つのツールを選択してください');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        '--tools には値が必要です。"all" / "none" / ツールIDのカンマ区切りを指定してください。'
      );
    }

    const availableTools = getToolsWithSkillsDir();
    const availableSet = new Set(availableTools);
    const availableList = ['all', 'none', ...availableTools].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableTools;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        '--tools では "all" / "none" 以外の場合、少なくとも 1 つのツールIDが必要です。'
      );
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('予約値 "all" / "none" を特定のツールIDと併用できません。');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `無効なツール: ${invalidTokens.join(', ')}。利用可能な値: ${availableList}`
      );
    }

    // 元の順序を保持しつつ重複を除外
    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  private validateTools(
    toolIds: string[],
    toolStates: Map<string, ToolSkillStatus>
  ): Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> {
    const validatedTools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `未知のツール '${toolId}' です。利用可能なツール:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!tool.skillsDir) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `ツール '${toolId}' はスキル生成に対応していません。\nスキル生成対応ツール:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      const preState = toolStates.get(tool.value);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        wasConfigured: preState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // ディレクトリ構成
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(openspecPath: string, extendMode: boolean): Promise<void> {
    if (extendMode) {
      // extend モードではスピナー無しでディレクトリを確認/作成する
      const directories = [
        openspecPath,
        path.join(openspecPath, 'specs'),
        path.join(openspecPath, 'changes'),
        path.join(openspecPath, 'changes', 'archive'),
      ];

      for (const dir of directories) {
        await FileSystemUtils.createDirectory(dir);
      }
      return;
    }

    const spinner = this.startSpinner('OpenSpec 構成を作成中...');

    const directories = [
      openspecPath,
      path.join(openspecPath, 'specs'),
      path.join(openspecPath, 'changes'),
      path.join(openspecPath, 'changes', 'archive'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('OpenSpec 構成を作成しました'),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // スキル/コマンド生成
  // ═══════════════════════════════════════════════════════════

  private async generateSkillsAndCommands(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    commandsSkipped: string[];
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];

    // スキル/コマンドのテンプレートを一度だけ取得（全ツール共通）
    const skillTemplates = getSkillTemplates();
    const commandContents = getCommandContents();

    // ツールごとに処理する
    for (const tool of tools) {
      const spinner = ora(`${tool.name} をセットアップ中...`).start();

      try {
        // ツール固有の skillsDir を使う
        const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

        // スキルディレクトリと SKILL.md を作成
        for (const { template, dirName } of skillTemplates) {
          const skillDir = path.join(skillsDir, dirName);
          const skillFile = path.join(skillDir, 'SKILL.md');

          // generatedBy を含む YAML フロントマター付き SKILL.md を生成
          // OpenCode 用にハイフン形式のコマンド参照を使う
          const transformer = tool.value === 'opencode' ? transformToHyphenCommands : undefined;
          const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);

          // スキルファイルを書き込む
          await FileSystemUtils.writeFile(skillFile, skillContent);
        }

        // アダプターシステムでコマンドを生成
        const adapter = CommandAdapterRegistry.get(tool.value);
        if (adapter) {
          const generatedCommands = generateCommands(commandContents, adapter);

          for (const cmd of generatedCommands) {
            const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectPath, cmd.path);
            await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
          }
        } else {
          commandsSkipped.push(tool.value);
        }

        spinner.succeed(`${tool.name} のセットアップが完了しました`);

        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      } catch (error) {
        spinner.fail(`${tool.name} のセットアップに失敗しました`);
        failedTools.push({ name: tool.name, error: error as Error });
      }
    }

    return { createdTools, refreshedTools, failedTools, commandsSkipped };
  }

  // ═══════════════════════════════════════════════════════════
  // 設定ファイル
  // ═══════════════════════════════════════════════════════════

  private async createConfig(openspecPath: string, extendMode: boolean): Promise<'created' | 'exists' | 'skipped'> {
    const configPath = path.join(openspecPath, 'config.yaml');
    const configYmlPath = path.join(openspecPath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);

    if (configYamlExists || configYmlExists) {
      return 'exists';
    }

    // 非対話モードで --force がない場合、設定作成をスキップ
    if (!this.canPromptInteractively() && !this.force) {
      return 'skipped';
    }

    try {
      const yamlContent = serializeConfig({ schema: DEFAULT_SCHEMA });
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI と出力
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      commandsSkipped: string[];
    },
    configStatus: 'created' | 'exists' | 'skipped'
  ): void {
    console.log();
    console.log(chalk.bold('OpenSpec セットアップ完了'));
    console.log();

    // 作成/更新したツールを表示
    if (results.createdTools.length > 0) {
      console.log(`新規作成: ${results.createdTools.map((t) => t.name).join(', ')}`);
    }
    if (results.refreshedTools.length > 0) {
      console.log(`更新: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
    }

    // 件数を表示
    const successfulTools = [...results.createdTools, ...results.refreshedTools];
    if (successfulTools.length > 0) {
      const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
      const hasCommands = results.commandsSkipped.length < successfulTools.length;
      if (hasCommands) {
        console.log(`${getSkillTemplates().length} 個のスキルと ${getCommandContents().length} 個のコマンドを ${toolDirs}/ に生成しました`);
      } else {
        console.log(`${getSkillTemplates().length} 個のスキルを ${toolDirs}/ に生成しました`);
      }
    }

    // 失敗を表示
    if (results.failedTools.length > 0) {
      console.log(chalk.red(`失敗: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    // スキップされたコマンドを表示
    if (results.commandsSkipped.length > 0) {
      console.log(chalk.dim(`コマンド生成をスキップ: ${results.commandsSkipped.join(', ')}（アダプタなし）`));
    }

    // 設定ファイルの状態
    if (configStatus === 'created') {
      console.log(`設定: openspec/config.yaml（スキーマ: ${DEFAULT_SCHEMA}）`);
    } else if (configStatus === 'exists') {
      // 実際のファイル名（config.yaml/config.yml）を表示
      const configYaml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yaml');
      const configYml = path.join(projectPath, OPENSPEC_DIR_NAME, 'config.yml');
      const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
      console.log(`設定: openspec/${configName}（既存）`);
    } else {
      console.log(chalk.dim('設定: スキップ（非対話モード）'));
    }

    // はじめに
    console.log();
    console.log(chalk.bold('はじめに:'));
    console.log('  /opsx:new       新しい変更を開始');
    console.log('  /opsx:continue  次のアーティファクトを作成');
    console.log('  /opsx:apply     タスクを実装');

    // リンク
    console.log();
    console.log(`詳細: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J')}`);
    console.log(`フィードバック: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J/issues')}`);

    // いずれかのツールを設定した場合は再起動案内を表示
    if (results.createdTools.length > 0 || results.refreshedTools.length > 0) {
      console.log();
      console.log(chalk.white('スラッシュコマンドを有効にするには IDE を再起動してください。'));
    }

    console.log();
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }
}
