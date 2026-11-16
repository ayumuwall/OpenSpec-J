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
import { resolveOpenSpecRoot } from './root-selection.js';
import { ANCHORED_OPENSPEC_DIRS, ensureDirectoryAnchor } from './openspec-root.js';
import { getSkillReferenceTransformer, getTransformerForTool, transformToSkillReferences, usesNaturalLanguageSkillReferences } from '../utils/command-references.js';
import {
  AI_TOOLS,
  SKILL_LINKED_TOOL_IDS,
  getUniversalTool,
  universalToolFallbackHint,
  OPENSPEC_DIR_NAME,
  AIToolOption,
  resolveToolIdAlias,
} from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
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
  getConfiguredTools,
  getToolStates,
  getSkillTemplates,
  generateSkillContent,
  hasGlobalSkillTarget,
  resolveToolSkillsDir,
  toolSupportsSkills,
  type ToolSkillStatus,
  formatIdeRestart,
} from './shared/index.js';
import { reconcileCommandFiles, formatKeptCommandFiles } from './shared/command-reconcile.js';
import {
  cleanUpRetiredTools,
  findRetiredTool,
  formatRetiredToolCleanup,
  formatRetiredToolError,
} from './retired-tools.js';
import { pruneEmptyParents } from './released-output-sweep.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, CORE_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import { formatOptionalWorkflowsNote } from './onboarding-commands.js';
import { usesSharedSkills } from './shared/skill-paths.js';
import { formatKeptSkills, installSharedSkills } from './shared/shared-skill-install.js';
import { realFileOps } from './update-plan.js';
import { DISK_VIEW } from './file-view.js';
import { classifyOwnSkill } from './shared/own-skill-texts.js';
import { migrateIfNeeded, migrateLegacyToolDirs, describeLegacyMigration, keptInPlaceNotice, hasMovableContent, scanInstalledWorkflows as scanInstalledWorkflowsShared } from './migration.js';
import {
  resolveCommandSurfaceCapability,
  resolveCommandInvocation,
  shouldReconcileCommandFilesForTool,
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
    const projectPath = FileSystemUtils.canonicalizeExistingPath(targetPath);
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
    let integrationsOnly = false;
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
          if (path.resolve(guardRoot) !== projectPath) {
            throw new Error(
              `このリポジトリの planning はストア '${pointer.value}' に外部化されています (${pointer.filePath})。` +
                '連携機能をインストールするには、ストアを参照するリポジトリのルートで openspec init を実行してください。'
            );
          }

          // A valid pointer repo already has its planning root in the declared
          // store. Init should still be able to install agent integrations in
          // the code repo, without creating a second local planning root.
          await resolveOpenSpecRoot({ startPath: projectPath });
          integrationsOnly = true;
        }
      }
    }

    if (!integrationsOnly) {
      await this.assertLanguageCanBeApplied(projectPath, openspecPath);
    } else if (this.language) {
      throw new Error(
        '--language では、ストアを参照するリポジトリを通じて外部ストアを更新できません。' +
        'ストアのルートで init を実行するか、ストアの設定を直接編集してください。'
      );
    }

    // Pointer repos keep their local planning files untouched. Normal init may
    // still remove OpenSpec-managed artifacts from older layouts.
    const deferredLegacyCleanup = integrationsOnly
      ? null
      : await this.handleLegacyCleanup(projectPath, extendMode);

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

    // Pointer repos only receive integrations. Their planning structure and
    // config stay in the declared store.
    if (!integrationsOnly) {
      await this.createDirectoryStructure(openspecPath, extendMode);
    }

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

    // Create config.yaml if needed. A pointer repo already has the config that
    // declares its store, so preserve it byte-for-byte.
    const configStatus = integrationsOnly
      ? 'exists' as const
      : await this.createConfig(openspecPath, extendMode);

    // Persist an explicit Copilot cloud decision so `openspec update` (which
    // never prompts) honors it. Best-effort: a config-write failure must not
    // fail an otherwise-successful init.
    if (!integrationsOnly && copilotDecision.persist !== undefined) {
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
            'github-copilot ツールが選択されていないため、--copilot-cloud/--no-copilot-cloud を無視しました。'
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
      console.log(chalk.yellow('代替スキルがないため、保留中のグローバルプロンプトを維持しました:'));
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
      const fallbackHint = universalToolFallbackHint(validTools);
      throw new Error(
        `ツールが検出されず、--tools フラグも指定されていません。利用可能なツール:\n  ${validTools.join('\n  ')}\n\n--tools all、--tools none、または --tools claude,cursor,... を使用してください。${fallbackHint ? `\n${fallbackHint}` : ''}`
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
          searchAliases: tool?.searchAliases,
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

    // A search that matches nothing is where someone whose assistant is not on
    // the list gives up (#653), so name the vendor-neutral entry right there.
    const universalTool = getUniversalTool();
    const universalHint =
      universalTool && validTools.includes(universalTool.value)
        ? `使いたいツールが一覧にない場合は、検索をクリアして「${universalTool.name}」を選んでください。`
        : undefined;

    const selectedTools = await searchableMultiSelect({
      message: `セットアップするツールを選択してください（利用可能: ${validTools.length}）`,
      pageSize: 15,
      choices: sortedChoices,
      emptyHint: universalHint,
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

    // 対応終了ツールには、汎用一覧ではなく理由と移行先を案内する。
    const retired = normalizedTokens.map(findRetiredTool).find((tool) => tool !== undefined);
    if (retired) {
      throw new Error(formatRetiredToolError(retired));
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      const fallbackHint = universalToolFallbackHint([...availableSet]);
      throw new Error(
        `無効なツール: ${invalidTokens.join(', ')}。利用可能な値: ${availableList}${fallbackHint ? `\n${fallbackHint}` : ''}`
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

    const generationTools = [...selectedTools];

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
        // 全ツール用の共有スキルは、ツールごとに複製せず一度だけ書く。
        writesSkills: !usesSharedSkills(tool),
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // ディレクトリ構成
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(openspecPath: string, extendMode: boolean): Promise<void> {
    const directories = [
      openspecPath,
      path.join(openspecPath, 'specs'),
      path.join(openspecPath, 'changes'),
      path.join(openspecPath, 'changes', 'archive'),
    ];

    if (extendMode) {
      // extend モードではスピナー無しでディレクトリを確認・作成する
      for (const dir of directories) {
        FileSystemUtils.assertProjectArtifactPath(path.dirname(openspecPath), dir);
        await FileSystemUtils.createDirectory(dir);
      }
      await this.writeGitkeepFiles(openspecPath);
      return;
    }

    const spinner = this.startSpinner('OpenSpec 構成を作成中...');

    for (const dir of directories) {
      FileSystemUtils.assertProjectArtifactPath(path.dirname(openspecPath), dir);
      await FileSystemUtils.createDirectory(dir);
    }

    await this.writeGitkeepFiles(openspecPath);

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('OpenSpec 構成を作成しました'),
    });
  }

  private async writeGitkeepFiles(openspecPath: string): Promise<void> {
    for (const relativeDir of ANCHORED_OPENSPEC_DIRS) {
      await ensureDirectoryAnchor(path.dirname(openspecPath), relativeDir);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // スキル/コマンド生成
  // ═══════════════════════════════════════════════════════════

  /**
   * 選択したツール用のスキルだけを生成し、旧版の生成コマンドファイルを削除する。
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
    removedCommandCount: number;
    leftCommandFiles: { kept: string[]; unchecked: string[] };
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    let removedCommandCount = 0;
    const leftCommandFiles = { kept: [] as string[], unchecked: [] as string[] };
    let removedSkillCount = 0;

    // グローバル設定からプロファイル・デリバリー設定を読み込む（--profile オーバーライドを優先）
    const globalConfig = getGlobalConfig();
    const profile: Profile = this.resolveProfileOverride() ?? globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const workflows = getProfileWorkflows(profile, globalConfig.workflows);

    // プロファイルのワークフローで絞り込んだスキルテンプレートを取得
    const skillTemplates = getSkillTemplates(workflows);

    // プロジェクトのスキルは `.agents/skills/` に一度だけ書く。
    // 選択したツールと既存の設定済みツールを含め、再 init で他のツールを外さない。
    // `--tools none` では新規・設定済みのどちらのツールも変更しない。
    const sharedToolIds =
      tools.length === 0
        ? []
        : [...new Set([...tools.map((tool) => tool.value), ...getConfiguredTools(projectPath)])];
    let ownFolderErrors = new Map<string, Error>();
    try {
      const shared = await installSharedSkills({
        projectPath,
        tools: AI_TOOLS.filter((tool) => sharedToolIds.includes(tool.value)),
        version: OPENSPEC_VERSION,
        workflowsFor: () => workflows,
        ops: realFileOps,
        view: DISK_VIEW,
        writesToDisk: true,
      });
      if (shared.writtenSkillCount === 0) removedSkillCount += shared.removedSkillCount;
      ownFolderErrors = shared.toolFailures;
      if (shared.replacedOldCopyCount > 0) {
        console.log(
          chalk.dim(
            `ツール固有フォルダ内の未編集のスキルコピー${shared.replacedOldCopyCount}件を、.agents/skills の共有コピーに置き換えました。`
          )
        );
      }
      for (const line of formatKeptSkills(shared.kept, shared.linkedOutside, shared.refreshedEdited)) console.log(chalk.yellow(line));
    } catch (error) {
      // フォルダを共有する全ツールを同じエラーで失敗にする。
      const message = error instanceof Error ? error.message : String(error);
      const failure = new Error(`.agents/skills の共有スキルを書き込めませんでした: ${message}`);
      ownFolderErrors = new Map(
        AI_TOOLS.filter((tool) => sharedToolIds.includes(tool.value) && usesSharedSkills(tool))
          .map((tool) => [tool.value, failure])
      );
    }

    // 対応終了ツールの旧生成物を削除する。編集済みのものは保持して報告する。
    for (const retired of await cleanUpRetiredTools(projectPath, {
      view: DISK_VIEW,
      remove: (fullPath) => fs.promises.unlink(fullPath),
      prune: true,
    })) {
      const [headline, ...detail] = formatRetiredToolCleanup(retired, sharedToolIds.includes(retired.tool.successor));
      console.log(chalk.yellow(headline));
      for (const line of detail) console.log(chalk.dim(line));
    }

    const keptOwnSkills: string[] = [];
    const savedOwnSkills: string[] = [];
    // ツールごとに処理する
    for (const tool of tools) {
      const spinner = ora(`${tool.name} をセットアップ中...`).start();

      try {
        const ownFolderError = ownFolderErrors.get(tool.value);
        if (ownFolderError) throw ownFolderError;
        // 固有のスキルを書き込むツールでは、スキルファイルを生成する
        if (tool.writesSkills) {
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

            if (fs.existsSync(skillDir) || DISK_VIEW.linkTarget?.(skillDir) !== undefined) {
              const spot = classifyOwnSkill(skillDir, tool.value, dirName, DISK_VIEW, OPENSPEC_VERSION);
              // 利用者のリンクや、フォルダの位置にある独自ファイルには書き込まない。
              if (spot === 'link' || (spot === 'user' && !DISK_VIEW.isDirectory(skillDir))) {
                keptOwnSkills.push(skillDir);
                continue;
              }
              // 同じ場所で更新する前に、編集済み SKILL.md を隣へ保存する。
              if (spot === 'user') {
                // リンク切れも使用済みとみなし、既存のものを上書きしない。
                const taken = (candidate: string) => fs.existsSync(candidate) || DISK_VIEW.linkTarget?.(candidate) !== undefined;
                let backup = `${skillFile}.bak`;
                for (let n = 1; taken(backup); n += 1) backup = `${skillFile}.bak${n}`;
                FileSystemUtils.assertPathWithin(tool.skillsRoot, backup);
                await FileSystemUtils.writeFile(backup, fs.readFileSync(skillFile, 'utf-8'));
                savedOwnSkills.push(backup);
              }
            }

            // スキルファイルを書き込む
            FileSystemUtils.assertPathWithin(tool.skillsRoot, skillFile);
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
        }
        if (shouldReconcileCommandFilesForTool(tool.value)) {
          const reconciled = await reconcileCommandFiles(projectPath, tool.value, workflows);
          removedCommandCount += reconciled.removed.length;
          leftCommandFiles.kept.push(...reconciled.kept);
          leftCommandFiles.unchecked.push(...reconciled.unchecked);
          // 削除したファイルの親フォルダが空なら削除する。
          await pruneEmptyParents(projectPath, reconciled.removed.map((rel) => FileSystemUtils.toPosixPath(rel)));
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
    // 未選択の設定済みツールも共有インストールの対象。
    // update と同様にフォルダの失敗を報告し、旧生成コマンドも整理する。
    // 編集済みコマンドは保持する。
    const selectedIds = new Set(tools.map((tool) => tool.value));
    for (const other of AI_TOOLS.filter((tool) => sharedToolIds.includes(tool.value) && !selectedIds.has(tool.value))) {
      const failure = ownFolderErrors.get(other.value);
      if (failure) {
        // update と同様、フォルダの更新に失敗したツールのコマンドは保持する。
        failedTools.push({ name: `${other.name}（このプロジェクトで設定済み）`, error: failure });
        continue;
      }
      if (!shouldReconcileCommandFilesForTool(other.value)) continue;
      try {
        const reconciled = await reconcileCommandFiles(projectPath, other.value, workflows);
        removedCommandCount += reconciled.removed.length;
        leftCommandFiles.kept.push(...reconciled.kept);
        leftCommandFiles.unchecked.push(...reconciled.unchecked);
        await pruneEmptyParents(projectPath, reconciled.removed.map((rel) => FileSystemUtils.toPosixPath(rel)));
      } catch (error) {
        failedTools.push({ name: other.name, error: error as Error });
      }
    }
    if (keptOwnSkills.length > 0) {
      console.log(
        chalk.yellow(
          `利用者が作成したスキルフォルダ${keptOwnSkills.length}件（リンクまたはファイル）を保持しました: ${keptOwnSkills.join(', ')}。この場所には書き込んでいません。`
        )
      );
    }
    if (savedOwnSkills.length > 0) {
      console.log(
        chalk.yellow(
          `編集済みスキル${savedOwnSkills.length}件を更新し、編集内容を ${savedOwnSkills.join(', ')} に保存しました。`
        )
      );
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
      removedCommandCount,
      leftCommandFiles,
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
      removedCommandCount: number;
      leftCommandFiles: { kept: string[]; unchecked: string[] };
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
      const workflows = getProfileWorkflows(profile, globalConfig.workflows);

      // スキルは共有フォルダに配置し、必要なツールへリンクする。
      // MiniMax Code はホーム内の固有フォルダを使用。件数はフォルダ単位で数える。
      const toolOption = (id: string) => AI_TOOLS.find((candidate) => candidate.value === id);
      const skillDirs = [...new Set(successfulTools.map((tool) => {
        const option = toolOption(tool.value);
        if (tool.isGlobalSkillTarget && option?.globalSkillsDir) {
          return `~/${option.globalSkillsDir}/skills/`;
        }
        return option && usesSharedSkills(option) ? '.agents/skills/' : `${tool.skillsDir}/skills/`;
      }))];
      const linkedFrom = [...new Set(successfulTools.flatMap((tool) => {
        const option = toolOption(tool.value);
        return option && SKILL_LINKED_TOOL_IDS.has(option.value) ? [`${option.skillsDir}/skills/`] : [];
      }))];
      const links = linkedFrom.length > 0 ? `（${linkedFrom.join(', ')} からリンク）` : '';
      console.log(`${skillDirs.join(', ')} にスキル${getSkillTemplates(workflows).length}個を作成しました${links}`);
    }

    // 失敗を表示
    if (results.failedTools.length > 0) {
      console.log(chalk.red(`失敗: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    // 旧版の生成コマンドファイルの削除結果
    if (results.removedCommandCount > 0) {
      console.log(chalk.dim(`削除: コマンドファイル${results.removedCommandCount}件（OpenSpec 2.0 はスキルだけをインストールします）`));
    }
    for (const [headline, ...detail] of formatKeptCommandFiles(results.leftCommandFiles)) {
      console.log(chalk.yellow(headline));
      for (const line of detail) {
        console.log(chalk.dim(line));
      }
    }
    if (results.removedSkillCount > 0) {
      console.log(chalk.dim(`削除: スキルディレクトリ${results.removedSkillCount}件`));
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
    // 各ツールで使えるスキルの呼び出し形式を案内する。
    // Kimi Code: /skill:openspec-*、Codex CLI: $openspec-*、その他: /openspec-*。
    // 表記が異なる場合は、対象ツール名を付けて別々の行に表示する。
    const startHintLines = (command: string): string[] => {
      const hintToTools = new Map<string, string[]>();
      for (const tool of successfulTools) {
        let hint: string;
        const skillReference = getSkillReferenceTransformer(tool.value)(command);
        // Rovo Dev などスラッシュ形式がないツールは、
        // 実行できないコマンドではなくスキルを使う依頼として案内する。
        if (usesNaturalLanguageSkillReferences(tool.value)) {
          hint = `最初の変更を開始: ${tool.name} に ${skillReference}を使って「あなたのアイデア」を扱うよう依頼してください`;
        } else if (tool.value === 'codex') {
          hint = `最初の変更を開始: ${skillReference} "あなたのアイデア"（Codex CLI または IDE）。Codex デスクトップアプリでは、サイドバーの Skills から ${skillReference.slice(1)} を選択してください`;
        } else {
          hint = `最初の変更を開始: ${skillReference} "あなたのアイデア"`;
        }
        hintToTools.set(hint, [...(hintToTools.get(hint) ?? []), tool.name]);
      }
      if (hintToTools.size === 0) {
        // 成功したツールがなければ、既定のスキル表記で案内する。
        return [`最初の変更を開始: ${transformToSkillReferences(command)} "あなたのアイデア"`];
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
    let advertisedAnInvocation = true;
    if (activeWorkflows.includes('propose')) {
      printStartHints('/opsx:propose');
    } else if (activeWorkflows.includes('new')) {
      printStartHints('/opsx:new');
    } else {
      console.log("完了。ワークフローを設定するには 'openspec config profile' を実行してください。");
      advertisedAnInvocation = false;
    }

    // プロファイルに含まれないワークフローを案内し、未導入のスキルを
    // インストール不備と誤認するのを防ぐ (#1076)。上ですでに設定方法を
    // 案内した場合や、どのツールにもスキルを生成していない場合は省略する。
    // 後者ではワークフローを追加してもファイルが生成されず、解決策にならない。
    if (advertisedAnInvocation && successfulTools.length > 0) {
      const optionalWorkflowsNote = formatOptionalWorkflowsNote(activeWorkflows);
      if (optionalWorkflowsNote) {
        console.log();
        for (const line of optionalWorkflowsNote) {
          console.log(chalk.dim(line));
        }
      }
    }

    // リンク
    console.log();
    console.log(`詳細: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J')}`);
    console.log(`フィードバック: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J/issues')}`);

    // 正常に設定でき、現在の delivery で対応サーフェスがある IDE／エディター常駐型
    // ツールに再起動を案内する。init と update で同じ状況に同じ文言を表示できるよう、
    // 判定と文言は formatIdeRestart に集約する。
    const restartHint = formatIdeRestart(
      successfulTools.map((tool) => tool.value),
      activeDelivery
    );
    if (restartHint) {
      console.log();
      console.log(chalk.white(restartHint));
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
