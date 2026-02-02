/**
 * update コマンド
 *
 * 設定済みツールの OpenSpec スキルとコマンドを更新する。
 * 既に最新の場合はスキップするスマート更新検知に対応。
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { transformToHyphenCommands } from '../utils/command-references.js';
import { AI_TOOLS, OPENSPEC_DIR_NAME } from './config.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from './command-generation/index.js';
import {
  getConfiguredTools,
  getAllToolVersionStatus,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  getToolsWithSkillsDir,
  type ToolVersionStatus,
} from './shared/index.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDetectionSummary,
  getToolsFromLegacyArtifacts,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import { isInteractive } from '../utils/interactive.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

/**
 * update コマンドのオプション。
 */
export interface UpdateCommandOptions {
  /** ツールが最新でも強制更新する */
  force?: boolean;
}

export class UpdateCommand {
  private readonly force: boolean;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const openspecPath = path.join(resolvedProjectPath, OPENSPEC_DIR_NAME);

    // 1. OpenSpec ディレクトリの存在確認
    if (!await FileSystemUtils.directoryExists(openspecPath)) {
      throw new Error("OpenSpec ディレクトリが見つかりません。先に 'openspec init' を実行してください。");
    }

    // 2. 旧ファイル検出とクリーンアップ + 旧ツールのスキル移行
    const newlyConfiguredTools = await this.handleLegacyCleanup(resolvedProjectPath);

    // 3. 設定済みツールの取得
    const configuredTools = getConfiguredTools(resolvedProjectPath);

    if (configuredTools.length === 0 && newlyConfiguredTools.length === 0) {
      console.log(chalk.yellow('設定済みのツールが見つかりません。'));
      console.log(chalk.dim('ツールのセットアップには "openspec init" を実行してください。'));
      return;
    }

    // 4. 設定済みツールのバージョン状態を確認
    const toolStatuses = getAllToolVersionStatus(resolvedProjectPath, OPENSPEC_VERSION);

    // 5. スマート更新検知
    const toolsNeedingUpdate = toolStatuses.filter((s) => s.needsUpdate);
    const toolsUpToDate = toolStatuses.filter((s) => !s.needsUpdate);

    if (!this.force && toolsNeedingUpdate.length === 0) {
      // すべてのツールが最新
      this.displayUpToDateMessage(toolStatuses);
      return;
    }

    // 6. 更新計画を表示
    if (this.force) {
      console.log(`強制更新: ${configuredTools.length} 件（${configuredTools.join(', ')}）`);
    } else {
      this.displayUpdatePlan(toolsNeedingUpdate, toolsUpToDate);
    }
    console.log();

    // 7. テンプレートを準備
    const skillTemplates = getSkillTemplates();
    const commandContents = getCommandContents();

    // 8. ツールを更新（force なら全件、そうでなければ更新対象のみ）
    const toolsToUpdate = this.force ? configuredTools : toolsNeedingUpdate.map((s) => s.toolId);
    const updatedTools: string[] = [];
    const failedTools: Array<{ name: string; error: string }> = [];

    for (const toolId of toolsToUpdate) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) continue;

      const spinner = ora(`${tool.name} を更新中...`).start();

      try {
        const skillsDir = path.join(resolvedProjectPath, tool.skillsDir, 'skills');

        // スキルファイルを更新
        for (const { template, dirName } of skillTemplates) {
          const skillDir = path.join(skillsDir, dirName);
          const skillFile = path.join(skillDir, 'SKILL.md');

          // OpenCode 用にハイフン形式のコマンド参照を使う
          const transformer = tool.value === 'opencode' ? transformToHyphenCommands : undefined;
          const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
          await FileSystemUtils.writeFile(skillFile, skillContent);
        }

        // コマンドを更新
        const adapter = CommandAdapterRegistry.get(tool.value);
        if (adapter) {
          const generatedCommands = generateCommands(commandContents, adapter);

          for (const cmd of generatedCommands) {
            const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(resolvedProjectPath, cmd.path);
            await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
          }
        }

        spinner.succeed(`${tool.name} を更新しました`);
        updatedTools.push(tool.name);
      } catch (error) {
        spinner.fail(`${tool.name} の更新に失敗しました`);
        failedTools.push({
          name: tool.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 9. サマリー
    console.log();
    if (updatedTools.length > 0) {
      console.log(chalk.green(`✓ 更新: ${updatedTools.join(', ')}（v${OPENSPEC_VERSION}）`));
    }
    if (failedTools.length > 0) {
      console.log(chalk.red(`✗ 失敗: ${failedTools.map(f => `${f.name} (${f.error})`).join(', ')}`));
    }

    // 10. 旧環境から新規設定されたツール向けのオンボーディング案内
    if (newlyConfiguredTools.length > 0) {
      console.log();
      console.log(chalk.bold('はじめに:'));
      console.log('  /opsx:new       新しい変更を開始');
      console.log('  /opsx:continue  次のアーティファクトを作成');
      console.log('  /opsx:apply     タスクを実装');
      console.log();
      console.log(`詳細: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J')}`);
    }

    console.log();
    console.log(chalk.dim('変更を反映するには IDE を再起動してください。'));
  }

  /**
   * すべてのツールが最新の場合のメッセージを表示する。
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    console.log(chalk.green(`✓ すべてのツールが最新です（${toolStatuses.length} 件 / v${OPENSPEC_VERSION}）`));
    console.log(chalk.dim(`  対象ツール: ${toolNames.join(', ')}`));
    console.log();
    console.log(chalk.dim('--force を使うとスキルを強制的に再生成できます。'));
  }

  /**
   * 更新対象ツールを表示する更新計画を表示する。
   */
  private displayUpdatePlan(
    needingUpdate: ToolVersionStatus[],
    upToDate: ToolVersionStatus[]
  ): void {
    const updates = needingUpdate.map((s) => {
      const fromVersion = s.generatedByVersion ?? '不明';
      return `${s.toolId} (${fromVersion} → ${OPENSPEC_VERSION})`;
    });

    console.log(`更新対象: ${needingUpdate.length} 件（${updates.join(', ')}）`);

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      console.log(chalk.dim(`最新: ${upToDateNames.join(', ')}`));
    }
  }

  /**
   * 旧 OpenSpec ファイルを検出して対応する。
   * init と異なり、非対話モードで旧ファイルが見つかっても警告して続行する。
   * 旧環境からの移行で新規設定されたツール ID を返す。
   */
  private async handleLegacyCleanup(projectPath: string): Promise<string[]> {
    // 旧ファイルを検出
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return []; // 旧ファイルが見つからない場合
    }

    // 検出内容を表示
    console.log();
    console.log(formatDetectionSummary(detection));
    console.log();

    const canPrompt = isInteractive();

    if (this.force) {
      // --force 指定: 自動クリーンアップで続行
      await this.performLegacyCleanup(projectPath, detection);
      // その後、旧ツールを新スキルへ移行
      return this.upgradeLegacyTools(projectPath, detection, canPrompt);
    }

    if (!canPrompt) {
      // 非対話モードで --force がない場合は警告して続行
      //（init と異なり、update は中止しない）
      console.log(chalk.yellow('⚠ --force で旧ファイルを自動クリーンアップするか、対話モードで実行してください。'));
      console.log();
      return [];
    }

    // 対話モード: 確認プロンプトを表示
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: '旧ファイルをアップグレードしてクリーンアップしますか？',
      default: true,
    });

    if (shouldCleanup) {
      await this.performLegacyCleanup(projectPath, detection);
      // その後、旧ツールを新スキルへ移行
      return this.upgradeLegacyTools(projectPath, detection, canPrompt);
    } else {
      console.log(chalk.dim('旧ファイルのクリーンアップをスキップし、スキル更新を続行します...'));
      console.log();
      return [];
    }
  }

  /**
   * 旧ファイルのクリーンアップを行う。
   */
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

  /**
   * 旧ツールを新しいスキル構成へ移行する。
   * 新規設定されたツール ID を返す。
   */
  private async upgradeLegacyTools(
    projectPath: string,
    detection: LegacyDetectionResult,
    canPrompt: boolean
  ): Promise<string[]> {
    // 旧ファイルが存在したツールを取得
    const legacyTools = getToolsFromLegacyArtifacts(detection);

    if (legacyTools.length === 0) {
      return [];
    }

    // 現在設定済みのツールを取得
    const configuredTools = getConfiguredTools(projectPath);
    const configuredSet = new Set(configuredTools);

    // 既に設定済みのツールを除外
    const unconfiguredLegacyTools = legacyTools.filter((t) => !configuredSet.has(t));

    if (unconfiguredLegacyTools.length === 0) {
      return [];
    }

    // 有効なツール（skillsDir があるもの）を取得
    const validToolIds = new Set(getToolsWithSkillsDir());
    const validUnconfiguredTools = unconfiguredLegacyTools.filter((t) => validToolIds.has(t));

    if (validUnconfiguredTools.length === 0) {
      return [];
    }

    // 旧ファイルから検出したツールを表示
    console.log(chalk.bold('旧アーティファクトから検出したツール:'));
    for (const toolId of validUnconfiguredTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      console.log(`  • ${tool?.name || toolId}`);
    }
    console.log();

    let selectedTools: string[];

    if (this.force || !canPrompt) {
      // 非対話モード + --force: 検出ツールを自動選択
      selectedTools = validUnconfiguredTools;
      console.log(`スキルをセットアップ: ${selectedTools.join(', ')}`);
    } else {
      // 対話モード: 検出ツールを事前選択した状態で選択プロンプトを表示
      const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

      const sortedChoices = validUnconfiguredTools.map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        return {
          name: tool?.name || toolId,
          value: toolId,
          configured: false,
          preSelected: true, // 検出した旧ツールをすべて選択しておく
        };
      });

      selectedTools = await searchableMultiSelect({
        message: '新しいスキルシステムでセットアップするツールを選択してください:',
        pageSize: 15,
        choices: sortedChoices,
        validate: (_selected: string[]) => true, // 未選択も許可（ユーザーがスキップ可能）
      });

      if (selectedTools.length === 0) {
        console.log(chalk.dim('ツールのセットアップをスキップします。'));
        console.log();
        return [];
      }
    }

    // 選択されたツール向けにスキルを作成
    const newlyConfigured: string[] = [];
    const skillTemplates = getSkillTemplates();
    const commandContents = getCommandContents();

    for (const toolId of selectedTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) continue;

      const spinner = ora(`${tool.name} をセットアップ中...`).start();

      try {
        const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

        // スキルファイルを作成
        for (const { template, dirName } of skillTemplates) {
          const skillDir = path.join(skillsDir, dirName);
          const skillFile = path.join(skillDir, 'SKILL.md');

          // OpenCode 用にハイフン形式のコマンド参照を使う
          const transformer = tool.value === 'opencode' ? transformToHyphenCommands : undefined;
          const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
          await FileSystemUtils.writeFile(skillFile, skillContent);
        }

        // コマンドを作成
        const adapter = CommandAdapterRegistry.get(tool.value);
        if (adapter) {
          const generatedCommands = generateCommands(commandContents, adapter);

          for (const cmd of generatedCommands) {
            const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectPath, cmd.path);
            await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
          }
        }

        spinner.succeed(`${tool.name} のセットアップが完了しました`);
        newlyConfigured.push(toolId);
      } catch (error) {
        spinner.fail(`${tool.name} のセットアップに失敗しました`);
        console.log(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    if (newlyConfigured.length > 0) {
      console.log();
    }

    return newlyConfigured;
  }
}
