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
import {
  classifyOpenSpecDir,
  MAX_CONTEXT_SIZE,
  readProjectConfig,
  storePointerProblem,
} from './project-config.js';
import { findRepoPlanningRootSync } from './planning-home.js';
import { getSkillReferenceTransformer, getTransformerForTool, usesNaturalLanguageSkillReferences } from '../utils/command-references.js';
import {
  AI_TOOLS,
  OPENSPEC_DIR_NAME,
  AIToolOption,
  resolveToolIdAlias,
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
  formatDeferredGlobalPromptSummary,
  formatDetectionSummary,
  getLegacyGlobalPromptMatches,
  omitGlobalLegacyPromptFiles,
  pickGlobalLegacyPromptFiles,
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
  hasGlobalSkillTarget,
  resolveToolSkillsDir,
  toolSupportsSkills,
  type ToolSkillStatus,
} from './shared/index.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, CORE_WORKFLOWS, ALL_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import {
  resolveSharedSkillWriters,
  sharedSkillRootOwner,
  writeSharedSkillTarget,
} from './shared-skill-target.js';
import { migrateIfNeeded, migrateLegacyToolDirs, describeLegacyMigration, keptInPlaceNotice, hasMovableContent, scanInstalledWorkflows as scanInstalledWorkflowsShared } from './migration.js';
import {
  resolveCommandSurfaceCapability,
  resolveCommandInvocation,
  shouldGenerateCommandsForTool,
  shouldGenerateSkillsForTool,
  shouldReconcileCommandFilesForTool,
  shouldRemoveSkillsForTool,
} from './command-surface.js';
import {
  writeCopilotCloudFiles,
  readCopilotCloudOptIn,
  hasExistingManagedCloudFiles,
  persistCopilotCloudOptIn,
  removeCopilotCloudFiles,
  findUnmanagedCloudFiles,
  listManagedCloudFiles,
} from './github-copilot/cloud-agent.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

// -----------------------------------------------------------------------------
// 定数
// -----------------------------------------------------------------------------

const DEFAULT_SCHEMA = 'spec-driven';

function formatLanguageContext(language: string): string {
  return [
    `Language: ${language}`,
    `All artifacts must be written in ${language}.`,
    'Keep OpenSpec structural headings and SHALL/MUST keywords in English.',
  ].join('\n');
}

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
  language?: string;
  force?: boolean;
  interactive?: boolean;
  profile?: string;
  /** Commander's --no-animation flag: false disables the welcome animation. */
  animation?: boolean;
  /**
   * Explicit opt-in/out for GitHub Copilot cloud coding-agent files.
   * `--copilot-cloud` sets true, `--no-copilot-cloud` sets false; undefined
   * leaves the decision to config, migration, or an interactive prompt.
   */
  copilotCloud?: boolean;
};

type ValidatedInitTool = {
  value: string;
  name: string;
  skillsDir?: string;
  skillsPath: string;
  skillsRoot: string;
  isGlobalSkillTarget: boolean;
  wasConfigured: boolean;
  requiresIdeRestart?: boolean;
  writesSkills: boolean;
};

/**
 * Holds the global Codex prompt matches that must wait until replacement skills
 * are generated before cleanup can continue.
 */
type DeferredLegacyCleanup = {
  detection: LegacyDetectionResult;
};

// -----------------------------------------------------------------------------
// init コマンドクラス
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly language?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly profileOverride?: string;
  private readonly animation: boolean;
  private readonly copilotCloudOption?: boolean;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.language = this.normalizeLanguage(options.language);
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.profileOverride = options.profile;
    this.animation = options.animation ?? true;
    this.copilotCloudOption = options.copilotCloud;
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
            `${pointer.filePath} の store 宣言が不正です (` +
              storePointerProblem(pointer.malformed) +
              `)。openspec init を実行する前に store: 行を修正または削除してください。`
          );
        }
        if (pointer.value !== undefined) {
          throw new Error(
            `このリポジトリの planning はストア '${pointer.value}' に外部化されています (${pointer.filePath})。` +
              `このリポジトリをローカル OpenSpec ルートに変換するには、先に store: 行を削除してください。`
          );
        }
      }
    }

    await this.assertLanguageCanBeApplied(projectPath, openspecPath);

    // 旧ファイルを検出し、クリーンアップを処理する
    const deferredLegacyCleanup = await this.handleLegacyCleanup(projectPath, extendMode);

    // 名称変更前のツールディレクトリに残るOpenSpec管理スキルを検出前に移行する。
    migrateLegacyToolDirs(projectPath);

    // プロジェクトで利用可能なツールを検出する
    const detectedTools = getAvailableTools(projectPath);

    // 移行確認: 既存プロジェクトをプロファイルシステムに移行する
    if (extendMode) {
      migrateIfNeeded(projectPath, detectedTools);
    }

    // profile上書きを早期検証し、ツール設定前に無効値を拒否する。
    this.resolveProfileOverride();

    // アニメーション付きウェルカム画面（対話モードのみ）
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen(this.getActiveWorkflows(), { animate: this.animation });
    }

    // 処理前にツール状態を取得
    const toolStates = getToolStates(projectPath);

    // ツール選択を取得（検出ツールを事前選択に利用）
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

    // Validate selected tools
    const validatedTools = this.validateTools(selectedToolIds, toolStates, projectPath);

    // Selecting a renamed tool is consent to leave its former directory:
    // init is about to write the current one, and leaving OpenSpec content
    // behind would give the user two installs of the same tool.
    for (const migration of migrateLegacyToolDirs(
      projectPath,
      validatedTools.map((tool) => tool.value)
    )) {
      if (hasMovableContent(migration)) {
        console.log(chalk.dim(`${describeLegacyMigration(migration)} を移行しました: ${migration.from} → ${migration.to}`));
      }
      const kept = keptInPlaceNotice(migration);
      if (kept) console.log(chalk.dim(kept));
    }

    // Decide whether to generate GitHub Copilot cloud files. This is opt-in
    // (see cloud-agent.ts): selecting the Copilot tool no longer silently
    // writes a GitHub Actions workflow into the user's .github/. The decision
    // is made before generation so the write can be gated, and persisted after
    // config.yaml exists so future non-interactive updates honor it.
    const copilotDecision = await this.resolveCopilotCloudDecision(projectPath, validatedTools);

    // ディレクトリ構成と設定を作成
    await this.createDirectoryStructure(openspecPath, extendMode);

    // 各ツールのスキル/コマンドを生成
    const results = await this.generateSkillsAndCommands(
      projectPath,
      validatedTools,
      copilotDecision.write
    );

    // Legacy cleanup was deferred to avoid interfering with skill/command generation;
    // now that outputs are written, finalize the cleanup (e.g. remove stale files).
    if (deferredLegacyCleanup) {
      await this.finalizeDeferredLegacyCleanup(projectPath, deferredLegacyCleanup);
    }

    // 必要なら config.yaml を作成
    const configStatus = await this.createConfig(openspecPath, extendMode);

    // Persist an explicit Copilot cloud decision so `openspec update` (which
    // never prompts) honors it. Best-effort: a config-write failure must not
    // fail an otherwise-successful init.
    if (copilotDecision.persist !== undefined) {
      try {
        await persistCopilotCloudOptIn(projectPath, copilotDecision.persist);
      } catch {
        // Non-fatal: the files (if any) were still written correctly.
      }
    }

    // An explicit opt-out means "no cloud files here": clean up any that a
    // previous run (or an older OpenSpec) generated. Only OpenSpec-managed
    // files are removed — a user-customized file is preserved.
    let copilotRemoved = 0;
    if (copilotDecision.optedOut) {
      try {
        copilotRemoved = await removeCopilotCloudFiles(projectPath);
      } catch {
        // Non-fatal: removal targets files from a prior run; a failure here
        // just leaves them for the next `openspec update` to clean up.
      }
    }

    // Report the cloud outcome from what is actually on disk after the write,
    // not from the decision alone: writing over a user-owned file is a no-op,
    // and the alternate-agent path can remove a managed file — so list only
    // managed files that exist, and separately flag any left-untouched ones.
    const copilotSucceeded = [...results.createdTools, ...results.refreshedTools].some(
      (tool) => tool.value === 'github-copilot'
    );
    const wroteCloud = copilotDecision.write && copilotSucceeded;
    const copilotPresent = wroteCloud ? await listManagedCloudFiles(projectPath) : [];
    const copilotCollisions = wroteCloud ? await findUnmanagedCloudFiles(projectPath) : [];

    // 成功メッセージを表示
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus, {
      write: copilotDecision.write,
      skippedUndecided: copilotDecision.skippedUndecided,
      present: copilotPresent,
      collisions: copilotCollisions,
      removed: copilotRemoved,
  });
    if (results.failedTools.length > 0) {
      throw new Error(
        `次のツールで OpenSpec のセットアップに失敗しました: ${results.failedTools.map((tool) => tool.name).join(', ')}`
      );
    }
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

  /**
   * Decide whether to generate GitHub Copilot cloud files, and whether to
   * persist that decision. Precedence:
   *   1. `--copilot-cloud` / `--no-copilot-cloud` flag (explicit this run)
   *   2. persisted opt-in in config.yaml
   *   3. managed files already present (migration for pre-opt-in projects)
   *   4. interactive confirm (default No)
   *   5. non-interactive with no signal: skip, and don't persist a default
   *
   * @returns `write` — generate the files this run; `persist` — value to write
   *   back to config (undefined = leave config untouched); `optedOut` — the user
   *   explicitly declined, so any already-generated managed files should be
   *   removed; `skippedUndecided` — selected but no signal and couldn't ask, so
   *   the caller can hint that the opt-in exists.
   */
  private async resolveCopilotCloudDecision(
    projectPath: string,
    tools: ValidatedInitTool[]
  ): Promise<{ write: boolean; persist?: boolean; optedOut: boolean; skippedUndecided: boolean }> {
    const copilotSelected = tools.some((tool) => tool.value === 'github-copilot');
    if (!copilotSelected) {
      // A flag that can't apply is a likely mistake — say so rather than no-op.
      if (this.copilotCloudOption !== undefined) {
        console.log(
          chalk.yellow(
            '--copilot-cloud/--no-copilot-cloud was ignored because the github-copilot tool was not selected.'
          )
        );
      }
      return { write: false, optedOut: false, skippedUndecided: false };
    }

    if (this.copilotCloudOption !== undefined) {
      return {
        write: this.copilotCloudOption,
        persist: this.copilotCloudOption,
        optedOut: !this.copilotCloudOption,
        skippedUndecided: false,
      };
    }

    const persistedOptIn = readCopilotCloudOptIn(projectPath);
    if (typeof persistedOptIn === 'boolean') {
      return { write: persistedOptIn, optedOut: !persistedOptIn, skippedUndecided: false };
    }

    if (await hasExistingManagedCloudFiles(projectPath)) {
      return { write: true, optedOut: false, skippedUndecided: false };
    }

    if (this.canPromptInteractively()) {
      const { confirm } = await import('@inquirer/prompts');
      const answer = await confirm({
        message:
          'GitHub Copilot のクラウドコーディングエージェント用ファイルをセットアップしますか？ これはエディタ内の Copilot とは別の、GitHub で動作する Copilot コーディングエージェント用です。' +
          '次の2ファイルを作成します: .github/workflows/copilot-setup-steps.yml と .github/agents/openspec.agent.md。',
        default: false,
      });
      return { write: answer, persist: answer, optedOut: !answer, skippedUndecided: false };
    }

    // Non-interactive with no explicit signal: don't write, and leave the
    // decision unpersisted so a later interactive run can still prompt.
    return { write: false, optedOut: false, skippedUndecided: true };
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

  /**
   * Resolves the workflows the effective profile installs, so onboarding output
   * only mentions commands that will actually exist.
   */
  private getActiveWorkflows(): string[] {
    const globalCfg = getGlobalConfig();
    const activeProfile: Profile = this.resolveProfileOverride() ?? globalCfg.profile ?? 'core';
    return [...getProfileWorkflows(activeProfile, globalCfg.workflows)];
  }

  // ═══════════════════════════════════════════════════════════
  // 旧ファイルのクリーンアップ
  // ═══════════════════════════════════════════════════════════

  /**
   * リポジトリ内の旧ファイルを直ちに削除し、グローバルCodexプロンプトの削除は
   * 代替スキルのインストール後まで遅延する。
   */
  private async handleLegacyCleanup(projectPath: string, extendMode: boolean): Promise<DeferredLegacyCleanup | null> {
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return null;
    }

    const immediateDetection = omitGlobalLegacyPromptFiles(detection);

    // 検出内容を表示
    const immediateSummary = formatDetectionSummary(immediateDetection);
    if (immediateSummary) {
      console.log();
      console.log(immediateSummary);
      console.log();
    }

    // 代替スキルの生成後まで削除を遅延するグローバルプロンプトを表示
    const deferredSummary = formatDeferredGlobalPromptSummary(detection);
    if (deferredSummary) {
      console.log(deferredSummary);
      console.log();
    }

    const canPrompt = this.canPromptInteractively();

    if (this.force || !canPrompt) {
      // --force flag or non-interactive mode: proceed with cleanup automatically.
      // Legacy slash commands are 100% OpenSpec-managed, and config file cleanup
      // only removes markers (never deletes files), so auto-cleanup is safe.
      await this.performImmediateLegacyCleanup(projectPath, detection);
      return detection.globalSlashCommandFiles.length > 0 ? { detection } : null;
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

    await this.performImmediateLegacyCleanup(projectPath, detection);
    return detection.globalSlashCommandFiles.length > 0 ? { detection } : null;
  }

  /**
   * Applies the safe subset of legacy cleanup that does not depend on newly
   * generated Codex skills.
   */
  private async performImmediateLegacyCleanup(
    projectPath: string,
    detection: LegacyDetectionResult
  ): Promise<void> {
    const immediateDetection = omitGlobalLegacyPromptFiles(detection);
    if (!immediateDetection.hasLegacyArtifacts) {
      return;
    }

    await this.performLegacyCleanup(projectPath, immediateDetection);
  }

  /**
   * Removes only the legacy global Codex prompts whose workflows now have
   * replacement skills in the project.
   */
  private async finalizeDeferredLegacyCleanup(
    projectPath: string,
    deferredCleanup: DeferredLegacyCleanup
  ): Promise<void> {
    const availableCodexWorkflows = await this.getInstalledWorkflowsForTool(projectPath, 'codex');
    const removableMatches = getLegacyGlobalPromptMatches(deferredCleanup.detection)
      .filter((prompt) => prompt.workflowIds.every((workflowId) => availableCodexWorkflows.has(workflowId)));

    if (removableMatches.length > 0) {
      await this.performLegacyCleanup(
        projectPath,
        pickGlobalLegacyPromptFiles(
          deferredCleanup.detection,
          removableMatches.map((prompt) => prompt.path)
        )
      );
    }

    const blockedMatches = getLegacyGlobalPromptMatches(deferredCleanup.detection)
      .filter((prompt) => !removableMatches.some((match) => match.path === prompt.path));

    if (blockedMatches.length > 0) {
      console.log(chalk.yellow('代替 skill がないため、保留中のグローバルプロンプトを維持しました:'));
      for (const prompt of blockedMatches) {
        console.log(chalk.dim(`  - ${prompt.toolId}: ${prompt.path}`));
      }
      console.log();
    }
  }

  /**
   * Reads the currently installed workflow IDs for a single tool from the
   * generated skill layout on disk.
   */
  private async getInstalledWorkflowsForTool(projectPath: string, toolId: string): Promise<Set<string>> {
    const tool = AI_TOOLS.find((candidate) => candidate.value === toolId);
    if (!tool) {
      return new Set<string>();
    }

    return new Set(scanInstalledWorkflowsShared(projectPath, [tool]));
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

    // Retired ids resolve to their current tool, so a rebrand does not break
    // an existing `--tools windsurf` in someone's setup script.
    const normalizedTokens = tokens.map((token) => resolveToolIdAlias(token.toLowerCase()));

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
    toolStates: Map<string, ToolSkillStatus>,
    projectPath: string
  ): ValidatedInitTool[] {
    const selectedTools: AIToolOption[] = [];
    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `未知のツール '${toolId}' です。利用可能なツール:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!toolSupportsSkills(tool)) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `ツール '${toolId}' はスキル生成に対応していません。\nスキル生成対応ツール:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      selectedTools.push(tool);
    }

    // 選択したツールが、設定済みの担当ツールと物理スキルルートを共有する場合がある。
    // 選択したツールには独立したコマンド面がある可能性があるため除外せず、担当ツールも
    // 更新対象に加える。
    const generationTools = [...selectedTools];
    const delivery: Delivery = getGlobalConfig().delivery ?? 'both';
    for (const selected of selectedTools) {
      if (!selected.skillsDir) continue;
      const selectedOwner = selected.value === 'codex' ||
        !shouldGenerateSkillsForTool(selected.value, delivery)
        ? undefined
        : sharedSkillRootOwner(projectPath, selected.value);
      for (const candidate of AI_TOOLS) {
        if (
          candidate.skillsDir === selected.skillsDir &&
          toolStates.get(candidate.value)?.configured &&
          candidate.value === selectedOwner &&
          !generationTools.includes(candidate)
        ) {
          generationTools.push(candidate);
        }
      }
    }

    const skillWriters = resolveSharedSkillWriters(projectPath, generationTools);
    const sharedRoots = new Map<string, AIToolOption[]>();
    for (const tool of generationTools) {
      if (!tool.skillsDir) continue;
      const group = sharedRoots.get(tool.skillsDir) ?? [];
      group.push(tool);
      sharedRoots.set(tool.skillsDir, group);
    }
    for (const [root, group] of sharedRoots) {
      if (group.length < 2) continue;
      const owner = group.find((tool) => skillWriters.has(tool.value));
      console.log(
        chalk.dim(
          `${group.map((tool) => tool.name).join(', ')} は ${root}/skills を共有するため、${owner?.value} 用の単一ツリーを書き込みます。`
        )
      );
    }

    const validatedTools: ValidatedInitTool[] = [];
    for (const tool of generationTools) {
      if (!toolSupportsSkills(tool)) continue;
      const preState = toolStates.get(tool.value);
      const skillsPath = resolveToolSkillsDir(projectPath, tool);
      const isGlobalSkillTarget = hasGlobalSkillTarget(tool);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        skillsPath,
        skillsRoot: isGlobalSkillTarget ? skillsPath : projectPath,
        isGlobalSkillTarget,
        wasConfigured: preState?.configured ?? false,
        requiresIdeRestart: tool.requiresIdeRestart,
        writesSkills: !tool.skillsDir || skillWriters.has(tool.value),
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
        FileSystemUtils.assertProjectArtifactPath(path.dirname(openspecPath), dir);
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
      FileSystemUtils.assertProjectArtifactPath(path.dirname(openspecPath), dir);
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

  /**
   * Generates skill files and slash commands for each selected tool,
   * honoring the configured delivery mode (skills, commands, or both).
   *
   * @param projectPath - Absolute path to the project root
   * @param tools - Selected tools with their skill directory metadata
   * @returns Created, refreshed, and failed tools plus removed artifact counts
   */
  private async generateSkillsAndCommands(
    projectPath: string,
    tools: ValidatedInitTool[],
    writeCopilotCloud: boolean
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    commandsSkipped: string[];
    skillsInvocableCommandSkips: string[];
    removedCommandCount: number;
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];
    const skillsInvocableCommandSkips: string[] = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;

    // グローバル設定からプロファイル・デリバリー設定を読み込む（--profile オーバーライドを優先）
    const globalConfig = getGlobalConfig();
    const profile: Profile = this.resolveProfileOverride() ?? globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const workflows = getProfileWorkflows(profile, globalConfig.workflows);

    // Get skill and command templates filtered by profile workflows
    const deliveryIncludesCommands = delivery !== 'skills';
    const skillTemplates = getSkillTemplates(workflows);
    const commandContents = getCommandContents(workflows);

    // ツールごとに処理する
    for (const tool of tools) {
      const spinner = ora(`${tool.name} をセットアップ中...`).start();

      try {
        const shouldGenerateSkills = shouldGenerateSkillsForTool(tool.value, delivery);
        const shouldGenerateCommands = shouldGenerateCommandsForTool(tool.value, delivery);

        // 選択したデリバリーとツール機能で許可され、書き込み担当である場合にスキルを生成
        if (shouldGenerateSkills && tool.writesSkills) {
          // スキルディレクトリと SKILL.md を作成
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(tool.skillsPath, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // generatedByを含むYAMLフロントマター付きSKILL.mdを生成
            const transformer = getTransformerForTool(
              tool.value,
              delivery,
              resolveCommandSurfaceCapability(tool.value),
              resolveCommandInvocation(tool.value)
            );
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);

            // スキルファイルを書き込む
            FileSystemUtils.assertPathWithin(tool.skillsRoot, skillFile);
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
          writeSharedSkillTarget(projectPath, tool.value);
        }
        if (
          shouldRemoveSkillsForTool(tool.value, delivery) &&
          tool.writesSkills &&
          !tool.isGlobalSkillTarget
        ) {
          removedSkillCount += await this.removeSkillDirs(tool.skillsRoot, tool.skillsPath);
          // このデリバリーモードでスキルを生成しない場合も選択を明示的に保持し、
          // 内容が異なる旧ルート側へ書き込み担当が戻らないようにする。
          writeSharedSkillTarget(projectPath, tool.value);
        }

        // デリバリーにコマンドが含まれる場合はコマンドを生成する
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = FileSystemUtils.resolveProjectArtifactPath(projectPath, cmd.path);
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }
          }
        } else if (deliveryIncludesCommands) {
          if (resolveCommandSurfaceCapability(tool.value) === 'skills-invocable') {
            skillsInvocableCommandSkips.push(tool.value);
          } else {
            commandsSkipped.push(tool.value);
          }
        }
        if (shouldReconcileCommandFilesForTool(tool.value, delivery)) {
          removedCommandCount += await this.removeCommandFiles(projectPath, tool.value);
        }
        if (tool.value === 'github-copilot' && writeCopilotCloud) {
          await writeCopilotCloudFiles(projectPath);
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

    for (const tool of [...createdTools, ...refreshedTools]) {
      for (const migration of migrateLegacyToolDirs(
        projectPath,
        [tool.value],
        'after-generation'
      )) {
        if (hasMovableContent(migration)) {
          console.log(chalk.dim(`${describeLegacyMigration(migration)} を移行しました: ${migration.from} → ${migration.to}`));
        }
        const kept = keptInPlaceNotice(migration);
        if (kept) console.log(chalk.dim(kept));
      }
    }

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandsSkipped,
      skillsInvocableCommandSkips,
      removedCommandCount,
      removedSkillCount,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 設定ファイル
  // ═══════════════════════════════════════════════════════════

  private normalizeLanguage(language: string | undefined): string | undefined {
    if (language === undefined) return undefined;

    const normalized = language.trim();
    if (!normalized) {
      throw new Error('--language オプションには空でない値が必要です。');
    }
    if (/\p{Cc}|\p{Bidi_Control}|[\u200B\u2028\u2029\uFEFF]/u.test(normalized)) {
      throw new Error(
        '--language オプションは制御文字や不可視の書式文字を含まない1行で指定してください。'
      );
    }
    const serializedContext = `${formatLanguageContext(normalized)}\n`;
    if (Buffer.byteLength(serializedContext, 'utf8') > MAX_CONTEXT_SIZE) {
      throw new Error(
        `--language オプションがOpenSpecのプロジェクトコンテキスト上限（${MAX_CONTEXT_SIZE / 1024}KB）を超えています。`
      );
    }
    return normalized;
  }

  private languageContext(): string | undefined {
    if (!this.language) return undefined;
    return formatLanguageContext(this.language);
  }

  private async assertLanguageCanBeApplied(
    projectPath: string,
    openspecPath: string
  ): Promise<void> {
    const languageContext = this.languageContext();
    if (!languageContext) return;

    const configPath = path.join(openspecPath, 'config.yaml');
    const hasConfig = fs.existsSync(configPath) ||
      fs.existsSync(path.join(openspecPath, 'config.yml'));
    if (!hasConfig) {
      try {
        FileSystemUtils.assertProjectArtifactPath(projectPath, configPath);
      } catch (error) {
        const reason = error instanceof Error ? `: ${error.message}` : '';
        throw new Error(`--language 用の openspec/config.yaml を作成できません${reason}`);
      }
      if (!(await FileSystemUtils.canWriteFile(configPath))) {
        throw new Error(
          '--language 用の openspec/config.yaml を作成できません: 書き込み先に権限がありません。'
        );
      }
      return;
    }

    const existingContext = readProjectConfig(projectPath)?.context;
    if (existingContext?.includes(languageContext)) return;

    throw new Error(
      '--language は既存のOpenSpec設定を上書きしません。' +
      '代わりに context フィールドへ言語の指示を追加してください。'
    );
  }

  private async createConfig(openspecPath: string, extendMode: boolean): Promise<'created' | 'exists' | 'skipped'> {
    const configPath = path.join(openspecPath, 'config.yaml');
    const configYmlPath = path.join(openspecPath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);

    if (configYamlExists || configYmlExists) {
      return 'exists';
    }


    try {
      const yamlContent = serializeConfig({
        schema: DEFAULT_SCHEMA,
        context: this.languageContext(),
      });
      FileSystemUtils.assertProjectArtifactPath(path.dirname(openspecPath), configPath);
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch (error) {
      if (this.language) {
        const reason = error instanceof Error ? `: ${error.message}` : '';
        throw new Error(`--language 用の openspec/config.yaml の作成に失敗しました${reason}`);
      }
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI と出力
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: ValidatedInitTool[],
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      commandsSkipped: string[];
      skillsInvocableCommandSkips: string[];
      removedCommandCount: number;
      removedSkillCount: number;
    },
    configStatus: 'created' | 'exists' | 'skipped',
    copilot: {
      write: boolean;
      skippedUndecided: boolean;
      present: string[];
      collisions: string[];
      removed: number;
    }
  ): void {
    console.log();
    console.log(
      chalk.bold(
        results.failedTools.length > 0 ? 'OpenSpec のセットアップは未完了です' : 'OpenSpec のセットアップが完了しました'
      )
    );
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
      const usesGlobalSkillTarget = successfulTools.some((tool) => tool.isGlobalSkillTarget);

      if (!usesGlobalSkillTarget) {
        const toolDirs = [
          ...new Set(
            successfulTools
              .map((tool) => tool.skillsDir)
              .filter((skillsDir): skillsDir is string => Boolean(skillsDir))
          ),
        ].join(', ');
        const skillCount = successfulTools.some((tool) =>
          shouldGenerateSkillsForTool(tool.value, delivery)
        )
          ? getSkillTemplates(workflows).length
          : 0;
        const commandCount = successfulTools.some((tool) =>
          shouldGenerateCommandsForTool(tool.value, delivery)
        )
          ? getCommandContents(workflows).length
          : 0;
        if (skillCount > 0 && commandCount > 0) {
          console.log(`${toolDirs}/ にスキル ${skillCount} 個とコマンド ${commandCount} 個を作成しました`);
        } else if (skillCount > 0) {
          console.log(`${toolDirs}/ にスキル ${skillCount} 個を作成しました`);
        } else if (commandCount > 0) {
          console.log(`${toolDirs}/ にコマンド ${commandCount} 個を作成しました`);
        }
      } else {
        const skillTools = successfulTools.filter((tool) =>
          shouldGenerateSkillsForTool(tool.value, delivery)
        );
        const skillCount = skillTools.length * getSkillTemplates(workflows).length;
        if (skillCount > 0) {
          const skillDirs = [...new Set(skillTools.map((tool) => tool.skillsPath))];
          console.log(`${skillDirs.join(', ')} にスキル ${skillCount} 個を作成しました`);
        }

        const commandContents = getCommandContents(workflows);
        const commandTools = successfulTools.filter((tool) =>
          shouldGenerateCommandsForTool(tool.value, delivery)
        );
        const commandCount = commandTools.length * commandContents.length;
        if (commandCount > 0) {
          const commandDirs = [
            ...new Set(
              commandTools.flatMap((tool) => {
                const adapter = CommandAdapterRegistry.get(tool.value);
                if (!adapter) return [];
                return commandContents.map((command) => {
                  const commandPath = adapter.getFilePath(command.id);
                  const absolutePath = path.isAbsolute(commandPath)
                    ? commandPath
                    : path.join(projectPath, commandPath);
                  return path.dirname(absolutePath);
                });
              })
            ),
          ];
          console.log(`${commandDirs.join(', ')} にコマンド ${commandCount} 個を作成しました`);
        }
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
    if (results.skillsInvocableCommandSkips.length > 0) {
      console.log(chalk.dim(`コマンドをスキップしたツール: ${results.skillsInvocableCommandSkips.join(', ')}（skill を使用）`));
    }
    if (results.removedCommandCount > 0) {
      console.log(chalk.dim(`削除: ${results.removedCommandCount} 個のコマンドファイル（delivery: skills）`));
    }
    if (results.removedSkillCount > 0) {
      console.log(chalk.dim(`削除: ${results.removedSkillCount} 個のスキルディレクトリ（delivery: commands）`));
    }

    // GitHub Copilot cloud files are opt-in — report what is actually on disk:
    // list the managed files that now exist (never files we didn't write), flag
    // any user-owned file we left untouched, note an opt-out cleanup, or (when
    // skipped for want of a signal) say how to turn them on.
    const copilotSucceeded = successfulTools.some((tool) => tool.value === 'github-copilot');
    if (copilotSucceeded && copilot.write) {
      if (copilot.present.length > 0) {
        console.log(`GitHub Copilot のクラウド用ファイル: ${copilot.present.join(', ')}`);
      }
      if (copilot.collisions.length > 0) {
        console.log(
          chalk.dim(
            `既存の ${copilot.collisions.join(' と ')} は変更していません。Copilot のクラウドエージェントで openspec を実行するには、` +
              `OpenSpec のインストール手順を手動で追加してください。`
          )
        );
      }
    } else if (copilotSucceeded && copilot.removed > 0) {
      console.log(
        chalk.dim(`削除: Copilot クラウドエージェント用ファイル ${copilot.removed} 件（クラウドファイルを無効化）`)
      );
    } else if (copilotSucceeded && copilot.skippedUndecided) {
      console.log(
        chalk.dim("GitHub Copilot のクラウド用ファイルをスキップしました（明示的な有効化が必要です）。'openspec init --copilot-cloud' で有効にできます。")
      );
    }

    // 追加設定が必要なツールの手動セットアップ案内を表示
    for (const tool of successfulTools) {
      const setupNote = AI_TOOLS.find((t) => t.value === tool.value)?.setupNote;
      if (setupNote) {
        console.log(chalk.yellow(`${tool.name} のセットアップが必要です: ${setupNote}`));
      }
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

    // はじめに（プロファイルに含まれる場合はproposeを優先）
    const activeWorkflows = this.getActiveWorkflows();
    // When no tool got /opsx:* commands, point at the skill instead of a
    // command that does not exist.
    const activeDelivery: Delivery = getGlobalConfig().delivery ?? 'both';
    const commandsGenerated = successfulTools.some((tool) => shouldGenerateCommandsForTool(tool.value, activeDelivery));
    const skillsGenerated = successfulTools.some((tool) => shouldGenerateSkillsForTool(tool.value, activeDelivery));
    // Each hint line must be a usable instruction for the tool it serves.
    // Tools that generated commands are told the command name their files
    // answer to (/opsx:* when namespaced under opsx/, /opsx-* when the
    // filename is the command); tools that only got skills are told their
    // documented skill invocation (Kimi Code: /skill:openspec-*; Codex CLI:
    // $openspec-*; others: /openspec-*). Tools that got no artifacts are
    // covered by the configuration correction instead. When the selection
    // disagrees, print one line per distinct instruction, labeled with the
    // tools it applies to.
    const startHintLines = (command: string): string[] => {
      const hintToTools = new Map<string, string[]>();
      for (const tool of successfulTools) {
        let hint: string;
        if (shouldGenerateCommandsForTool(tool.value, activeDelivery)) {
          const transformer = getTransformerForTool(
            tool.value,
            activeDelivery,
            resolveCommandSurfaceCapability(tool.value),
            resolveCommandInvocation(tool.value)
          );
          hint = `最初の変更を開始: ${transformer ? transformer(command) : command} "あなたのアイデア"`;
        } else if (shouldGenerateSkillsForTool(tool.value, activeDelivery)) {
          const skillReference = getSkillReferenceTransformer(tool.value)(command);
          // Tools with no slash surface (e.g. Rovo Dev) reference skills as
          // prose ("the openspec-propose skill"); phrase the hint so it reads
          // as an instruction rather than a dead command with an argument.
          hint = usesNaturalLanguageSkillReferences(tool.value)
            ? `最初の変更を開始: ${tool.name} に ${skillReference} を使って「あなたのアイデア」を扱うよう依頼してください`
            : `最初の変更を開始: ${skillReference} "あなたのアイデア"`;
        } else {
          continue;
        }
        hintToTools.set(hint, [...(hintToTools.get(hint) ?? []), tool.name]);
      }
      if (hintToTools.size === 0) {
        // No successful tools: keep the generic command hint
        return [`最初の変更を開始: ${command} "あなたのアイデア"`];
      }
      if (hintToTools.size === 1) {
        return [[...hintToTools.keys()][0]];
      }
      return [...hintToTools.entries()].map(([hint, toolNames]) => `${hint} (${toolNames.join(', ')})`);
    };
    const printStartHints = (command: string): void => {
      console.log(chalk.bold('はじめに:'));
      for (const line of startHintLines(command)) {
        console.log(`  ${line}`);
      }
    };
    console.log();
    // delivery=commands with tools that only support skills: those tools get
    // no artifacts at all, so print a per-tool configuration correction
    // rather than leave them with a dead (or missing) instruction — even
    // when other selected tools did get commands or skills.
    const zeroArtifactTools = successfulTools.filter(
      (tool) =>
        !shouldGenerateSkillsForTool(tool.value, activeDelivery) &&
        !shouldGenerateCommandsForTool(tool.value, activeDelivery)
    );
    if (zeroArtifactTools.length > 0) {
      const names = zeroArtifactTools.map((tool) => tool.name).join(', ');
      console.log(
        chalk.yellow(
          `${names} 向けのスキルまたはコマンドは生成されませんでした。deliveryが 'commands' ですが、` +
            `対象ツールはスキルだけに対応しています。スキルを生成するには ` +
            `'openspec config set delivery both' を実行してください。`
        )
      );
    }
    if (successfulTools.length > 0 && !commandsGenerated && !skillsGenerated) {
      // Nothing was generated for any tool: the correction above is the
      // whole story, so don't advertise an invocation that doesn't exist.
    } else if (activeWorkflows.includes('propose')) {
      printStartHints('/opsx:propose');
    } else if (activeWorkflows.includes('new')) {
      printStartHints('/opsx:new');
    } else {
      console.log("完了。ワークフローを設定するには 'openspec config profile' を実行してください。");
    }

    // リンク
    console.log();
    console.log(`詳細: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J')}`);
    console.log(`フィードバック: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J/issues')}`);

    // Restart instruction only when at least one IDE/editor-resident tool
    // actually received a generated surface. Two conditions, coupled to the SAME
    // tool: (1) its commands/skills are loaded by a long-running editor process
    // (CLI tools pick the files up immediately, so a restart line would be wrong
    // for them — see #1067), and (2) a surface was actually generated for it
    // under the active delivery (an IDE tool that generated nothing has nothing a
    // restart would pick up, even if a co-configured CLI tool did generate).
    // Wording follows what the IDE tool itself generated, not the global
    // aggregate: it must not say "commands" when the IDE tool only got skills
    // while a co-configured CLI tool got commands. Not "slash commands" either:
    // Amazon Q's generated files are prompt-library entries invoked with @, so a
    // restart line promising slash commands would be wrong for it.
    const restartCommandsGenerated = successfulTools.some(
      (tool) =>
        tool.requiresIdeRestart &&
        shouldGenerateCommandsForTool(tool.value, activeDelivery)
    );
    const restartSkillsGenerated = successfulTools.some(
      (tool) =>
        tool.requiresIdeRestart &&
        shouldGenerateSkillsForTool(tool.value, activeDelivery)
    );
    if (restartCommandsGenerated || restartSkillsGenerated) {
      console.log();
      console.log(
        chalk.white(
          restartCommandsGenerated
            ? '新しいコマンドを有効にするにはIDEを再起動してください。'
            : '新しいスキルを有効にするにはIDEを再起動してください。'
        )
      );
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

  private async removeSkillDirs(skillsRoot: string, skillsDir: string): Promise<number> {
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      if (!fs.existsSync(skillDir)) continue;
      FileSystemUtils.assertPathWithin(skillsRoot, skillDir);
      try {
        await fs.promises.rm(skillDir, { recursive: true, force: true });
        removed++;
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
      const fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, cmdPath);

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
