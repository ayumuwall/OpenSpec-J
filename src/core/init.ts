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
import { classifyOpenSpecDir, storePointerProblem } from './project-config.js';
import { findRepoPlanningRootSync } from './planning-home.js';
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
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, CORE_WORKFLOWS, ALL_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import { migrateIfNeeded } from './migration.js';

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

const WORKFLOW_TO_SKILL_DIR: Record<string, string> = {
  'explore': 'openspec-explore',
  'new': 'openspec-new-change',
  'continue': 'openspec-continue-change',
  'apply': 'openspec-apply-change',
  'update': 'openspec-update-change',
  'ff': 'openspec-ff-change',
  'sync': 'openspec-sync-specs',
  'archive': 'openspec-archive-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  'verify': 'openspec-verify-change',
  'onboard': 'openspec-onboard',
  'propose': 'openspec-propose',
};

// -----------------------------------------------------------------------------
// 型
// -----------------------------------------------------------------------------

type InitCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  profile?: string;
};

// -----------------------------------------------------------------------------
// init コマンドクラス
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly profileOverride?: string;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.profileOverride = options.profile;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const openspecDir = OPENSPEC_DIR_NAME;
    const openspecPath = path.join(projectPath, openspecDir);

    // 検証は裏側で静かに実行する
    const extendMode = await this.validate(projectPath, openspecPath);

    // Pointer guard (slice 3.2): a config-only openspec/ with a store:
    // declaration is externalized planning, not a root to extend — and a
    // subdirectory of such a repo must not silently grow a nested root.
    // Refuse before legacy cleanup, migration, or prompts touch anything.
    // In extend mode the walk finds projectPath itself; otherwise it
    // finds the nearest ancestor root (so pointer-repo subdirectories
    // refuse exactly where a normal command would resolve the pointer).
    const guardRoot = findRepoPlanningRootSync(projectPath);
    if (guardRoot) {
      const { hasPlanningShape, pointer } = classifyOpenSpecDir(guardRoot);
      if (!hasPlanningShape) {
        if (pointer.malformed) {
          throw new Error(
            `The store declaration in ${pointer.filePath} is invalid (` +
              storePointerProblem(pointer.malformed) +
              `). Fix or remove the store: line before running openspec init.`
          );
        }
        if (pointer.value !== undefined) {
          throw new Error(
            `This repo's planning is externalized to store '${pointer.value}' (${pointer.filePath}). ` +
              `Remove the store: line first to convert this repo to a local OpenSpec root.`
          );
        }
      }
    }

    // 旧ファイルを検出してクリーンアップを処理する
    await this.handleLegacyCleanup(projectPath, extendMode);

    // プロジェクトで利用可能なツールを検出する
    const detectedTools = getAvailableTools(projectPath);

    // 移行確認: 既存プロジェクトをプロファイルシステムに移行する
    if (extendMode) {
      migrateIfNeeded(projectPath, detectedTools);
    }

    // アニメーション付きウェルカム画面（対話モードのみ）
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // プロファイルオーバーライドを早期に検証する（ツール設定前に無効な値を弾く）
    // 解決値はコード生成時に実際に使用される
    this.resolveProfileOverride();

    // 処理前にツール状態を取得
    const toolStates = getToolStates(projectPath);

    // ツール選択を取得（検出ツールを事前選択に利用）
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

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

  private resolveProfileOverride(): Profile | undefined {
    if (this.profileOverride === undefined) {
      return undefined;
    }

    if (this.profileOverride === 'core' || this.profileOverride === 'custom') {
      return this.profileOverride;
    }

    throw new Error(`無効なプロファイル "${this.profileOverride}"。利用可能なプロファイル: core, custom`);
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

    if (this.force || !canPrompt) {
      // --force 指定または非対話モードでは自動クリーンアップで続行する。
      // 旧スラッシュコマンドは OpenSpec 管理下で、設定ファイルのクリーンアップも
      // マーカー除去のみなので、自動実行してよい。
      await this.performLegacyCleanup(projectPath, detection);
      return;
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
    extendMode: boolean,
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    // 先に --tools 指定を確認
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()]
        .filter(([, status]) => status.configured)
        .map(([toolId]) => toolId)
    );
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
    const canPrompt = this.canPromptInteractively();

    // Non-interactive mode: use detected tools as fallback (task 7.8)
    if (!canPrompt) {
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      throw new Error(
        `ツールが検出されず、--tools フラグも指定されていません。利用可能なツール:\n  ${validTools.join('\n  ')}\n\n--tools all、--tools none、または --tools claude,cursor,... を使用してください。`
      );
    }

    if (validTools.length === 0) {
      throw new Error(
        `スキル生成に利用可能なツールがありません。`
      );
    }

    // 対話モード: 検索可能な複数選択を表示
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // 設定済みツールを先に選択しておき、検出ツールは表示するが未選択とする
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;
        const detected = detectedToolIds.has(toolId);

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          detected: detected && !configured,
          preSelected: configured || (shouldPreselectDetected && detected && !configured),
        };
      })
      .sort((a, b) => {
        // 設定済みツールを先頭に、次に検出済み（未設定）、その他の順に並べる
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        if (a.detected && !b.detected) return -1;
        if (!a.detected && b.detected) return 1;
        return 0;
      });

    const configuredNames = validTools
      .filter((toolId) => configuredToolIds.has(toolId))
      .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);

    if (configuredNames.length > 0) {
      console.log(`OpenSpec 設定済み: ${configuredNames.join(', ')}（事前選択）`);
    }

    const detectedOnlyNames = detectedTools
      .filter((tool) => !configuredToolIds.has(tool.value))
      .map((tool) => tool.name);

    if (detectedOnlyNames.length > 0) {
      const detectionLabel = shouldPreselectDetected
        ? '初回セットアップのため事前選択'
        : '事前選択なし';
      console.log(`検出したツールディレクトリ: ${detectedOnlyNames.join(', ')}（${detectionLabel}）`);
    }

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
    removedCommandCount: number;
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;

    // グローバル設定からプロファイル・デリバリー設定を読み込む（--profile オーバーライドを優先）
    const globalConfig = getGlobalConfig();
    const profile: Profile = this.resolveProfileOverride() ?? globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const workflows = getProfileWorkflows(profile, globalConfig.workflows);

    // プロファイルのワークフローでフィルタリングしたスキル/コマンドテンプレートを取得
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(workflows) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents(workflows) : [];

    // ツールごとに処理する
    for (const tool of tools) {
      const spinner = ora(`${tool.name} をセットアップ中...`).start();

      try {
        // デリバリーにスキルが含まれる場合はスキルファイルを生成する
        if (shouldGenerateSkills) {
          // ツール固有の skillsDir を使う
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

          // スキルディレクトリと SKILL.md を作成
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // generatedBy を含む YAML フロントマター付き SKILL.md を生成する。
            // Use hyphen-based command references for tools where filename === command name (oh-my-pi, opencode, pi)
            const transformer = (tool.value === 'opencode' || tool.value === 'pi' || tool.value === 'oh-my-pi') ? transformToHyphenCommands : undefined;
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);

            // スキルファイルを書き込む
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
        }
        if (!shouldGenerateSkills) {
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
          removedSkillCount += await this.removeSkillDirs(skillsDir);
        }

        // デリバリーにコマンドが含まれる場合はコマンドを生成する
        if (shouldGenerateCommands) {
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
        }
        if (!shouldGenerateCommands) {
          removedCommandCount += await this.removeCommandFiles(projectPath, tool.value);
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

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandsSkipped,
      removedCommandCount,
      removedSkillCount,
    };
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
      removedCommandCount: number;
      removedSkillCount: number;
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

    // 件数を表示（プロファイルフィルターを反映）
    const successfulTools = [...results.createdTools, ...results.refreshedTools];
    if (successfulTools.length > 0) {
      const globalConfig = getGlobalConfig();
      const profile: Profile = (this.profileOverride as Profile) ?? globalConfig.profile ?? 'core';
      const delivery: Delivery = globalConfig.delivery ?? 'both';
      const workflows = getProfileWorkflows(profile, globalConfig.workflows);
      const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
      const skillCount = delivery !== 'commands' ? getSkillTemplates(workflows).length : 0;
      const commandCount = delivery !== 'skills' ? getCommandContents(workflows).length : 0;
      if (skillCount > 0 && commandCount > 0) {
        console.log(`${skillCount} 個のスキルと ${commandCount} 個のコマンドを ${toolDirs}/ に生成しました`);
      } else if (skillCount > 0) {
        console.log(`${skillCount} 個のスキルを ${toolDirs}/ に生成しました`);
      } else if (commandCount > 0) {
        console.log(`${commandCount} 個のコマンドを ${toolDirs}/ に生成しました`);
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
    if (results.removedCommandCount > 0) {
      console.log(chalk.dim(`削除: ${results.removedCommandCount} 個のコマンドファイル（delivery: skills）`));
    }
    if (results.removedSkillCount > 0) {
      console.log(chalk.dim(`削除: ${results.removedSkillCount} 個のスキルディレクトリ（delivery: commands）`));
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

    // はじめに（propose がプロファイルに含まれる場合は propose を優先表示）
    const globalCfg = getGlobalConfig();
    const activeProfile: Profile = (this.profileOverride as Profile) ?? globalCfg.profile ?? 'core';
    const activeWorkflows = [...getProfileWorkflows(activeProfile, globalCfg.workflows)];
    console.log();
    if (activeWorkflows.includes('propose')) {
      console.log(chalk.bold('はじめに:'));
      console.log('  最初の変更を開始: /opsx:propose "あなたのアイデア"');
    } else if (activeWorkflows.includes('new')) {
      console.log(chalk.bold('はじめに:'));
      console.log('  最初の変更を開始: /opsx:new "あなたのアイデア"');
    } else {
      console.log("完了。ワークフローを設定するには 'openspec config profile' を実行してください。");
    }

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

  private async removeSkillDirs(skillsDir: string): Promise<number> {
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      try {
        if (fs.existsSync(skillDir)) {
          await fs.promises.rm(skillDir, { recursive: true, force: true });
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  private async removeCommandFiles(projectPath: string, toolId: string): Promise<number> {
    let removed = 0;
    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    for (const workflow of ALL_WORKFLOWS) {
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }
}
