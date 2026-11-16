/**
 * Update Command
 *
 * Refreshes OpenSpec skills and commands for configured tools.
 * Supports profile-aware updates, delivery changes, migration, and smart update detection.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { getSkillReferenceTransformer, getTransformerForTool, transformToSharedSkillReferences, transformToSkillReferences } from '../utils/command-references.js';
import { AI_TOOLS, OPENSPEC_DIR_NAME } from './config.js';
import {
  getToolSkillStatus,
  getToolVersionStatus,
  getSkillTemplates,
  generateSkillContent,
  getToolsWithSkillsDir,
  hasGlobalSkillTarget,
  resolveToolSkillsDir,
  toolSupportsSkills,
  type ToolVersionStatus,
  formatIdeRestart,
} from './shared/index.js';
import { reconcileCommandFiles, formatKeptCommandFiles } from './shared/command-reconcile.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  type LegacyCleanupOps,
  formatDeferredGlobalPromptSummary,
  formatCleanupSummary,
  formatDetectionSummary,
  findEditedLegacyGlobalPrompts,
  getLegacyGlobalPromptMatches,
  getLegacyWorkflowIdsForTool,
  getToolsFromLegacyArtifacts,
  legacyCleanupDeletesOnlyReleasedOutput,
  hasRepoLocalLegacyRemovals,
  omitGlobalLegacyPromptFiles,
  omitToolLegacyArtifacts,
  pickGlobalLegacyPromptFiles,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import { isInteractive } from '../utils/interactive.js';
import { findStaleReleasedFiles, pruneEmptyParents } from './released-output-sweep.js';
import { cleanUpRetiredTools, formatRetiredToolCleanup } from './retired-tools.js';
import { getGlobalConfig, getGlobalConfigPath, serializeGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS, CORE_WORKFLOWS } from './profiles.js';
import { formatOptionalWorkflowsNote, getOnboardingCommands } from './onboarding-commands.js';
import { getAvailableTools } from './available-tools.js';
import {
  WORKFLOW_TO_SKILL_DIR,
  getConfiguredToolsForProfileSync,
  getToolsNeedingProfileSync,
} from './profile-sync-drift.js';
import {
  scanInstalledWorkflows as scanInstalledWorkflowsShared,
  migrateIfNeeded as migrateIfNeededShared,
  computeProfileMigration,
  applyProfileMigration,
  findLegacyToolMigrations,
  planLegacyToolMigrations,
  migrateLegacyToolDirs,
  describeLegacyMigration,
  legacyMigrationNotice,
  keptInPlaceNotice,
  hasMovableContent,
  LEGACY_TOOL_ROOTS,
  type LegacyToolMigration,
} from './migration.js';
import {
  resolveCommandSurfaceCapability,
  resolveCommandInvocation,
  shouldReconcileCommandFilesForTool,
} from './command-surface.js';
import { usesSharedSkills } from './shared/skill-paths.js';
import { isToolListed, readKeptSharedSkills } from './shared-skill-target.js';
import { formatKeptSkills, installSharedSkills, type SharedSkillInstallResult } from './shared/shared-skill-install.js';
import { classifyOwnSkill } from './shared/own-skill-texts.js';
import { DISK_VIEW, type FileView } from './file-view.js';
import {
  realFileOps,
  UpdatePlanRecorder,
  type UpdateFileOps,
  type UpdatePlan,
} from './update-plan.js';
import { includesGitHubCopilot, writeCopilotCloudFiles, removeCopilotCloudFiles, isCopilotCloudEnabled, readCopilotCloudOptIn, findUnmanagedCloudFiles, type CopilotCloudFileOps } from './github-copilot/cloud-agent.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

/**
 * Captures legacy migration side effects so update can refresh newly configured
 * tools and honor workflow subsets inferred from legacy Codex prompt filenames.
 */
type LegacyUpgradeResult = {
  newlyConfiguredTools: string[];
  workflowOverrides: Partial<Record<string, readonly (typeof ALL_WORKFLOWS)[number][]>>;
  failedTools?: ToolFailure[];
  deferredGlobalCleanup?: LegacyDetectionResult;
  /**
   * Tools whose skill generation was skipped because another tool already owns
   * their shared skills root. Their repo-local legacy artifacts must be exempt
   * from immediate cleanup — no replacement was written to justify deleting them.
   */
  skippedSharedSkillTools?: string[];
};

type ToolFailure = { name: string; error: string; toolId?: string };

function throwIfUpdateFailed(failedTools: readonly ToolFailure[]): void {
  if (failedTools.length > 0) {
    throw new Error(`次のツールの OpenSpec 更新に失敗しました: ${failedTools.map((tool) => tool.name).join(', ')}`);
  }
}

/**
 * Checkout artifacts that are not real content drift: a UTF-8 BOM and the CRLF
 * line endings a Windows clone with `core.autocrlf` reintroduces on every
 * checkout of committed generated files.
 */
function normalizeGeneratedFile(content: string): string {
  return content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Force update even when tools are up to date */
  force?: boolean;
  /**
   * Record what the update would change and write nothing. Set by `plan()`;
   * callers use that instead of passing this directly.
   */
  dryRun?: boolean;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 *
 * Wrapper around the shared migration module's scanInstalledWorkflows that accepts tool IDs.
 */
export function scanInstalledWorkflows(
  projectPath: string,
  toolIds: string[],
  view?: FileView
): string[] {
  const tools = toolIds
    .map((id) => AI_TOOLS.find((t) => t.value === id))
    .filter((t): t is NonNullable<typeof t> => t != null);
  return scanInstalledWorkflowsShared(projectPath, tools, view);
}

export class UpdateCommand {
  private readonly force: boolean;
  private readonly dryRun: boolean;
  /** 利用者のものとして保持した専用フォルダ（MiniMax）のスキル。 */
  private keptOwnSkills: string[] = [];
  /** 今回更新した専用スキルの編集内容のバックアップ。 */
  private savedOwnSkills: string[] = [];
  private editedGlobalPromptsReported = false;
  private recorder: UpdatePlanRecorder | null = null;
  private ops: UpdateFileOps = realFileOps;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
    this.dryRun = options.dryRun ?? false;
  }

  /**
   * Reports what `execute` would add, change or delete, writing nothing.
   *
   * Same code path as the real update: the plan is recorded by the write seam
   * the generation loop already goes through, so it cannot drift from it.
   */
  async plan(projectPath: string): Promise<UpdatePlan> {
    if (!this.dryRun) {
      throw new Error('plan() を使うには dryRun: true を指定して更新コマンドを作成してください');
    }
    await this.execute(projectPath);
    return this.recorder?.getPlan() ?? { changes: [], notes: [], failures: [] };
  }

  /** Prints progress on a real run, stays quiet while planning. */
  private log(...args: unknown[]): void {
    if (this.dryRun) return;
    console.log(...args);
  }

  /** A spinner on a real run, a no-op while planning. */
  private startSpinner(text: string): {
    succeed(text: string): void;
    fail(text: string): void;
    info(text: string): void;
  } {
    if (this.dryRun) {
      return { succeed: () => {}, fail: () => {}, info: () => {} };
    }
    return ora(text).start();
  }

  /**
   * Refreshes OpenSpec skills and commands for all configured tools,
   * regenerating artifacts according to the effective profile and delivery mode.
   *
   * @param projectPath - Path to the project root containing the openspec directory
   */
  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const openspecPath = path.join(resolvedProjectPath, OPENSPEC_DIR_NAME);
    this.legacyCleanupSkipped = false;

    if (this.dryRun) {
      this.recorder = new UpdatePlanRecorder(resolvedProjectPath);
      this.ops = this.recorder;
    }

    // 1. Check openspec directory exists
    if (!await FileSystemUtils.directoryExists(openspecPath)) {
      throw new Error(`OpenSpec ディレクトリが見つかりません。先に 'openspec init' を実行してください。`);
    }

    // 2. Migrate OpenSpec-managed skills left in renamed tool directories
    // (e.g. .kimi -> .kimi-code) so they stay detected and get refreshed,
    // then perform the one-time profile migration if needed before any
    // legacy upgrade generation.
    if (!this.dryRun) {
      for (const migration of migrateLegacyToolDirs(resolvedProjectPath)) {
        if (hasMovableContent(migration)) {
          this.log(chalk.dim(`${describeLegacyMigration(migration)}を移行しました: ${migration.from} → ${migration.to}`));
        }
        this.reportKeptInPlace(migration);
      }
    }
    // A dry run plans the same moves. Every later step reads `this.view` -
    // the disk in a real run, the tree as planned in a dry run - so it sees
    // the moved files exactly as the real update would.
    if (this.dryRun) {
      await this.planLegacyToolMoves(resolvedProjectPath, 'before-generation');
    }
    const declinedMigrations = this.dryRun
      ? []
      : await this.offerConsentedLegacyMigrations(resolvedProjectPath);

    // Use detected tool directories to preserve existing opsx skills/commands.
    const detectedTools = getAvailableTools(resolvedProjectPath, this.view);
    if (!this.dryRun) {
      migrateIfNeededShared(resolvedProjectPath, detectedTools);
    }

    // 3. Read global config for profile/delivery. A dry run plans the one-time
    //    profile migration's save instead of making it, and resolves against
    //    the config that save would leave — otherwise the preview would plan
    //    for a different profile than the real update acts on.
    let globalConfig = getGlobalConfig();
    if (this.recorder) {
      const migration = computeProfileMigration(resolvedProjectPath, detectedTools, this.view);
      if (migration) {
        globalConfig = applyProfileMigration(migration);
        await this.recorder.writeFile(
          getGlobalConfigPath(),
          serializeGlobalConfig(globalConfig),
          'openspec'
        );
      }
    }
    const profile = globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const profileWorkflows = getProfileWorkflows(profile, globalConfig.workflows);
    const desiredWorkflows = profileWorkflows.filter((workflow): workflow is (typeof ALL_WORKFLOWS)[number] =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
    );

    // 4. Detect and handle legacy artifacts + upgrade legacy tools using effective config
    const legacyUpgrade = await this.handleLegacyCleanup(
      resolvedProjectPath,
      desiredWorkflows,
      delivery
    );
    const {
      newlyConfiguredTools,
      workflowOverrides: legacyWorkflowOverrides,
      deferredGlobalCleanup,
      failedTools: legacyUpgradeFailures = [],
    } = legacyUpgrade;

    // 4b. 対応終了ツールの旧生成物を削除し、編集済みファイルは保持して報告する。
    for (const retired of await cleanUpRetiredTools(resolvedProjectPath, {
      view: this.view,
      remove: (fullPath) => this.ops.removeFile(fullPath, 'openspec'),
      prune: !this.dryRun,
    })) {
      // 削除したときか --force のときだけ表示する。編集済みだけが残るプロジェクトで
      // 毎回同じ案内を出さない。
      if (retired.removed.length === 0 && !this.force) continue;
      const successorSetUp = getConfiguredToolsForProfileSync(resolvedProjectPath, this.view).includes(retired.tool.successor);
      const [headline, ...detail] = formatRetiredToolCleanup(retired, successorSetUp);
      this.log(chalk.yellow(headline));
      for (const line of detail) this.log(chalk.dim(line));
    }

    // 5. Find configured tools
    const configuredTools = getConfiguredToolsForProfileSync(resolvedProjectPath, this.view);
    const configuredAndNewTools = [...new Set([...configuredTools, ...newlyConfiguredTools])];

    if (configuredTools.length === 0 && newlyConfiguredTools.length === 0) {
      if (deferredGlobalCleanup) {
        await this.performDeferredGlobalPromptCleanup(resolvedProjectPath, deferredGlobalCleanup);
      }
      if (this.stopIfUpdateFailed(legacyUpgradeFailures)) return;
      if (declinedMigrations.length > 0) {
        // Not an unconfigured project — a configured one the user chose to
        // leave in its former directory. Saying "run init" would be wrong.
        for (const migration of declinedMigrations) {
          this.log(
            chalk.yellow(
              `更新対象がありません。このプロジェクトの OpenSpec ファイルは、現在は書き込み対象外の ${migration.from}/ に残っています。`
            )
          );
          this.log(
            chalk.dim(`更新を再開するには "openspec update" を再実行し、${migration.to}/ への移動を許可してください。`)
          );
        }
        return;
      }
      await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools);
      this.log(chalk.yellow('設定済みのツールが見つかりません。'));
      this.log(chalk.dim('ツールを設定するには "openspec init" を実行してください。'));
      return;
    }

    // 6. Check version status for all configured tools, against the same workflow set
    //    the generation loop below writes — otherwise a legacy-upgraded tool would be
    //    fingerprinted against commands it was never given.
    const toolStatuses = configuredTools.map((toolId) =>
      getToolVersionStatus(resolvedProjectPath, toolId, OPENSPEC_VERSION, {
        workflows: legacyWorkflowOverrides[toolId] ?? desiredWorkflows,
        view: this.view,
      })
    );
    const statusByTool = new Map(toolStatuses.map((status) => [status.toolId, status] as const));

    // 7. Smart update detection
    const toolsNeedingVersionUpdate = toolStatuses
      .filter((s) => s.needsUpdate)
      .map((s) => s.toolId);
    const toolsNeedingConfigSync = getToolsNeedingProfileSync(
      resolvedProjectPath,
      desiredWorkflows,
      delivery,
      configuredTools,
      this.view
    );
    const toolsWithDriftedSkills = this.findToolsWithDriftedSkills(
      resolvedProjectPath,
      configuredTools,
      delivery,
      (toolId) => legacyWorkflowOverrides[toolId] ?? desiredWorkflows
    );
    const toolsToUpdateSet = new Set<string>([
      ...toolsNeedingVersionUpdate,
      ...toolsNeedingConfigSync,
      ...toolsWithDriftedSkills,
    ]);
    const toolsUpToDate = toolStatuses.filter((s) => !toolsToUpdateSet.has(s.toolId));

    if (!this.force && toolsToUpdateSet.size === 0 && newlyConfiguredTools.length === 0) {
      if (deferredGlobalCleanup) {
        await this.performDeferredGlobalPromptCleanup(resolvedProjectPath, deferredGlobalCleanup);
      }
      // ツールが最新でも、旧公開版の不要なファイルが残っている場合がある。
      // 保持対象は初回に報告済みなので、最新状態の実行では繰り返し案内しない。
      await this.removeEarlierReleaseLeftovers(
        resolvedProjectPath,
        [],
        legacyUpgradeFailures.length > 0,
        false
      );
      // All tools are up to date
      this.displayUpToDateMessage(toolStatuses);
      await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools);

      // Still check for new tool directories and extra workflows
      this.detectNewTools(resolvedProjectPath, configuredTools);
      this.displayProfileNotes(resolvedProjectPath, configuredTools, desiredWorkflows, profile);
      this.displaySetupNotes(configuredTools);
      this.stopIfUpdateFailed(legacyUpgradeFailures);
      return;
    }

    // 8. Display update plan
    if (this.force) {
      this.log(`強制更新: ${configuredTools.length} 件（${configuredTools.join(', ')}）`);
    } else if (toolsToUpdateSet.size === 0) {
      this.log('旧ファイルの移行後に追加更新は必要ありません。');
    } else {
      this.displayUpdatePlan(
        [...toolsToUpdateSet],
        statusByTool,
        toolsUpToDate,
        new Set(toolsWithDriftedSkills)
      );
    }
    this.log();

    // 9. スキルのみのため、配布方式の選択は不要。
    // 10. 更新対象のツールを処理する（force ならすべて）。
    const toolsToUpdate = this.force ? configuredTools : [...toolsToUpdateSet];
    const updatedTools: string[] = [];
    const updatedToolIds: string[] = [];
    const failedTools: ToolFailure[] = [...legacyUpgradeFailures];
    let removedCommandCount = 0;
    const leftCommandFiles = { kept: [] as string[], unchecked: [] as string[] };
    let removedSkillCount = 0;
    let removedDeselectedSkillCount = 0;
    this.keptOwnSkills = [];
    this.savedOwnSkills = [];

    // 全ツールで共有する .agents/skills/ を1回書き込む。
    // 共有コピーを必要とする旧ルート移行より前に実行する。
    const sharedInstall = await this.installSharedSkillsForRun(
      resolvedProjectPath,
      configuredAndNewTools,
      toolsToUpdate,
      (toolId) => legacyWorkflowOverrides[toolId] ?? desiredWorkflows
    );
    if (sharedInstall.writtenSkillCount === 0) {
      removedSkillCount += sharedInstall.removedSkillCount;
    } else {
      removedDeselectedSkillCount += sharedInstall.removedSkillCount;
    }

    for (const toolId of toolsToUpdate) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool || !toolSupportsSkills(tool)) continue;

      const spinner = this.startSpinner(`${tool.name} を更新中...`);

      try {
        const skillsDir = resolveToolSkillsDir(resolvedProjectPath, tool);
        const skillsRoot = hasGlobalSkillTarget(tool) ? skillsDir : resolvedProjectPath;
        // 共有フォルダのスキルは上で1回書き込み済み。
        const writesSkills = !usesSharedSkills(tool);
        const toolWorkflows = legacyWorkflowOverrides[tool.value] ?? desiredWorkflows;
        const ownFolderError = sharedInstall.toolFailures.get(tool.value);
        if (ownFolderError) throw ownFolderError;
        const skillTemplates = getSkillTemplates(toolWorkflows);

        // 専用フォルダのスキルファイルを生成する。
        if (writesSkills) {
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            const transformer = getTransformerForTool(
              tool.value,
              delivery,
              resolveCommandSurfaceCapability(tool.value),
              resolveCommandInvocation(tool.value)
            );
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
            // リンク切れも他のリンクと同じく利用者のものとして扱う。
            if (this.view.exists(skillDir) || this.view.linkTarget?.(skillDir) !== undefined) {
              const spot = classifyOwnSkill(skillDir, tool.value, dirName, this.view, OPENSPEC_VERSION);
              // 利用者のリンク先や、フォルダの位置にあるファイルへは書き込まない。
              if (spot === 'link' || (spot === 'user' && !this.view.isDirectory(skillDir))) {
                this.keptOwnSkills.push(skillDir);
                continue;
              }
              FileSystemUtils.assertPathWithin(skillsRoot, skillFile);
              // 1.x と同様にその場で更新するが、編集済み SKILL.md は先に隣へ保存する。
              if (spot === 'user') {
                const backup = this.freeBackupPath(skillFile);
                await this.ops.writeFile(backup, this.view.read(skillFile), tool.value);
                this.savedOwnSkills.push(backup);
              }
            }
            FileSystemUtils.assertPathWithin(skillsRoot, skillFile);
            await this.ops.writeFile(skillFile, skillContent, tool.value);
          }
          removedDeselectedSkillCount += await this.removeUnselectedSkillDirs(
            skillsRoot,
            skillsDir,
            toolWorkflows,
            tool.value
          );
        }

        // 旧生成コマンドを整理する。
        if (shouldReconcileCommandFilesForTool(tool.value)) {
          const reconciled = await reconcileCommandFiles(resolvedProjectPath, toolId, toolWorkflows, {
            view: this.view,
            remove: (fullPath) => this.ops.removeFile(fullPath, toolId),
          });
          removedCommandCount += reconciled.removed.length;
          leftCommandFiles.kept.push(...reconciled.kept);
          leftCommandFiles.unchecked.push(...reconciled.unchecked);
          // 削除後に空になった親フォルダも整理する。
          if (!this.dryRun) {
            await pruneEmptyParents(resolvedProjectPath, reconciled.removed.map((rel) => FileSystemUtils.toPosixPath(rel)));
          }
        }

        spinner.succeed(`${tool.name} を更新しました`);
        updatedTools.push(tool.name);
        updatedToolIds.push(tool.value);
        if (!this.dryRun) {
          for (const migration of migrateLegacyToolDirs(
            resolvedProjectPath,
            [tool.value],
            'after-generation'
          )) {
            if (hasMovableContent(migration)) {
              this.log(chalk.dim(`${describeLegacyMigration(migration)}を移行しました: ${migration.from} → ${migration.to}`));
            }
            this.reportKeptInPlace(migration);
          }
        } else {
          await this.planLegacyToolMoves(resolvedProjectPath, 'after-generation', [tool.value]);
        }
      } catch (error) {
        spinner.fail(`${tool.name} の更新に失敗しました`);
        const message = error instanceof Error ? error.message : String(error);
        failedTools.push({ name: tool.name, error: message });
        // A dry run reports the failure in the plan rather than throwing it:
        // one broken tool must not cost the caller the other tools' changes.
        this.recorder?.addFailure(tool.value, message);
      }
    }

    await this.removeEarlierReleaseLeftovers(
      resolvedProjectPath,
      updatedToolIds,
      failedTools.length > 0
    );

    if (deferredGlobalCleanup) {
      await this.performDeferredGlobalPromptCleanup(resolvedProjectPath, deferredGlobalCleanup);
    }

    // 11. Summary
    this.log();
    if (updatedTools.length > 0) {
      this.log(chalk.green(`✓ 更新: ${updatedTools.join(', ')}（v${OPENSPEC_VERSION}）`));
    }
    if (failedTools.length > 0) {
      this.log(chalk.red(`✗ 失敗: ${failedTools.map(f => `${f.name}（${f.error}）`).join(', ')}`));
    }
    if (removedCommandCount > 0) {
      this.log(chalk.dim(`削除: コマンドファイル ${removedCommandCount} 件（OpenSpec 2.0 はスキルだけをインストールします）`));
    }
    for (const [headline, ...detail] of formatKeptCommandFiles(leftCommandFiles)) {
      this.log(chalk.yellow(headline));
      for (const line of detail) {
        this.log(chalk.dim(line));
      }
    }
    if (removedSkillCount > 0) {
      this.log(chalk.dim(`削除: スキルディレクトリ ${removedSkillCount} 件`));
    }
    if (this.keptOwnSkills.length > 0) {
      const count = this.keptOwnSkills.length;
      this.log(
        chalk.yellow(
          `OpenSpec の生成内容と異なるスキルフォルダ${count}件を保持しました（編集済み、またはリンク）: ` +
            `${this.keptOwnSkills.join(', ')}。書き込んでいません。不要になったら削除してください。`
        )
      );
    }
    if (this.savedOwnSkills.length > 0) {
      const count = this.savedOwnSkills.length;
      this.log(
        chalk.yellow(
          `編集済みのスキル${count}件を更新しました。編集内容のコピーは ${this.savedOwnSkills.join(', ')} に保存しました。`
        )
      );
    }
    if (removedDeselectedSkillCount > 0) {
      this.log(chalk.dim(`削除: スキルディレクトリ ${removedDeselectedSkillCount} 件（選択解除されたワークフロー）`));
    }

    // 12. 旧構成から新規設定したツールの開始案内。
    // 各ツールのスキル呼び出し方を使い、一致しなければスキル名を案内する。
    if (newlyConfiguredTools.length > 0) {
      const referenceFor = (command: string): string => {
        const neutralForm = `${transformToSkillReferences(command).slice(1)} スキル`;
        const forms = new Set(
          newlyConfiguredTools.map((toolId) => getSkillReferenceTransformer(toolId)(command))
        );
        return forms.size === 1 ? [...forms][0] : neutralForm;
      };
      // Only hint at workflows these tools actually received. A legacy upgrade
      // can install a narrower set than the profile (inferred Codex prompts).
      const installedWorkflows = [
        ...new Set(
          newlyConfiguredTools.flatMap(
            (toolId) => legacyWorkflowOverrides[toolId] ?? desiredWorkflows
          )
        ),
      ];
      const entries: Array<[string, string]> = getOnboardingCommands(installedWorkflows).map(
        ({ command, description }) => [referenceFor(command), description]
      );
      this.log();
      if (entries.length > 0) {
        const width = Math.max(...entries.map(([reference]) => reference.length));
        this.log(chalk.bold('はじめに:'));
        for (const [reference, description] of entries) {
          this.log(`  ${reference.padEnd(width)}  ${description}`);
        }
        this.log();
      }
      this.log(`詳細: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J')}`);
    }

    await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools);

    // 13. Detect new tool directories not currently configured
    this.detectNewTools(resolvedProjectPath, configuredAndNewTools);

    // 14. プロファイルの補足を表示
    this.displayProfileNotes(resolvedProjectPath, configuredAndNewTools, desiredWorkflows, profile);
    this.displaySetupNotes(configuredAndNewTools);

    // 15. List affected tools
    if (updatedTools.length > 0) {
      const toolDisplayNames = updatedTools;
      this.log(chalk.dim(`ツール: ${toolDisplayNames.join(', ')}`));
    }

    this.log();
    const affectedToolIds = [...new Set([...newlyConfiguredTools, ...updatedToolIds])];
    const restartHint = formatIdeRestart(affectedToolIds, delivery);
    if (restartHint) {
      this.log(chalk.dim(restartHint));
    }
    this.stopIfUpdateFailed(failedTools);
  }

  /**
   * 共有フォルダを使うツールの更新時に、共有コピー・リンク・旧コピーを1回整備する。
   * 共有コピーに書き込めない場合は、共有する全ツールを同じエラーで失敗とし、
   * 今回はそれらの旧ファイルを整理しない。
   */
  private async installSharedSkillsForRun(
    projectPath: string,
    setUpToolIds: readonly string[],
    toolsToRefresh: readonly string[],
    workflowsFor: (toolId: string) => readonly string[]
  ): Promise<SharedSkillInstallResult> {
    const toolOptions = (ids: readonly string[]) =>
      ids
        .map((toolId) => AI_TOOLS.find((tool) => tool.value === toolId))
        .filter((tool): tool is NonNullable<typeof tool> => tool !== undefined);
    const empty: SharedSkillInstallResult = {
      writtenSkillCount: 0,
      removedSkillCount: 0,
      replacedOldCopyCount: 0,
      kept: [],
      linkedOutside: [],
      refreshedEdited: [],
      toolFailures: new Map(),
    };
    if (!toolOptions(toolsToRefresh).some(usesSharedSkills)) return empty;
    try {
      const result = await installSharedSkills({
        projectPath,
        tools: toolOptions(setUpToolIds),
        version: OPENSPEC_VERSION,
        workflowsFor,
        ops: this.ops,
        view: this.view,
        writesToDisk: !this.dryRun,
      });
      if (result.replacedOldCopyCount > 0) {
        this.log(
          chalk.dim(
            `ツールフォルダ内の未編集スキルのコピー${result.replacedOldCopyCount}件を、` +
              '.agents/skills の共有コピーに置き換えました。'
          )
        );
      }
      for (const line of formatKeptSkills(result.kept, result.linkedOutside, result.refreshedEdited)) this.log(chalk.yellow(line));
      // dry-run の案内が、編集内容を保存できる最後の機会になる。
      if (result.refreshedEdited.length > 0) {
        this.recorder?.addNote(
          'edited-skills',
          `更新すると ${result.refreshedEdited.join(', ')} の編集内容を上書きし、コピーは残しません。` +
            'OpenSpec が導入するスキルは毎回再生成されます。先に編集内容を保存し、継続して使う変更は別名の独自スキルへ移してください。'
        );
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // 共有する各ツールの失敗として計画に載るため、別の失敗項目は追加しない。
      this.log(chalk.red(`✗ .agents/skills の共有スキルに書き込めませんでした: ${message}`));
      const failure = new Error(`.agents/skills の共有スキルに書き込めませんでした: ${message}`);
      return {
        ...empty,
        toolFailures: new Map(
          toolOptions(setUpToolIds).filter(usesSharedSkills).map((tool) => [tool.value, failure])
        ),
      };
    }
  }

  /**
   * Where a real update throws for failed tools, it also stops. A dry run
   * stops at the same point - so it plans nothing the real update would not
   * reach - but returns instead of throwing: the failures are already in the
   * plan, and the caller still gets every change planned before them.
   *
   * @returns whether the update stops here.
   */
  private stopIfUpdateFailed(failedTools: readonly ToolFailure[]): boolean {
    if (!this.dryRun) throwIfUpdateFailed(failedTools);
    return failedTools.length > 0;
  }

  /** The tree as the real update would see it at this point. */
  /**
   * 旧ファイルを検出しても整理しなかった場合に設定する。
   * 非対話で --force がない場合や利用者が拒否した場合は、
   * 同意のない旧公開版の残存ファイル削除も行わない。
   */
  private legacyCleanupSkipped = false;

  private get view(): FileView {
    return this.recorder?.view ?? DISK_VIEW;
  }

  /** The update's write seam, in the shape modules with their own writers take. */
  private fileOps(tool: string): LegacyCleanupOps & CopilotCloudFileOps {
    return {
      writeFile: (filePath, content) => this.ops.writeFile(filePath, content, tool),
      removeFile: (filePath) => this.ops.removeFile(filePath, tool),
      removeEmptyDirectory: (dirPath) => this.ops.removeEmptyDirectory(dirPath),
    };
  }

  /**
   * Plans the moves out of former tool roots that a non-interactive update
   * makes, against the tree as planned so far.
   */
  private async planLegacyToolMoves(
    projectPath: string,
    timing: 'before-generation' | 'after-generation',
    toolIds?: string[]
  ): Promise<void> {
    const recorder = this.recorder;
    if (!recorder) return;

    for (const op of planLegacyToolMigrations(projectPath, timing, toolIds, recorder.view)) {
      try {
        if (op.disposition === 'move') {
          await recorder.moveFile(op.source, op.destination, op.toolId);
        } else {
          await recorder.removeFile(op.source, op.toolId);
        }
      } catch {
        // The real migration leaves a file it cannot move where it is, and
        // says nothing; so does the plan.
        continue;
      }
      if (op.needsConsent) {
        recorder.addNote(
          'legacy-tool-directories',
          '改名されたツールディレクトリからの移動は、非対話更新で行う内容を表示します。端末での実行では先に確認し、拒否した場合は元の場所に保持します。'
        );
      }
    }
  }

  private async syncCopilotCloudFiles(projectPath: string, configuredTools: string[]): Promise<void> {
    const ops = this.fileOps('github-copilot');
    try {
      if (includesGitHubCopilot(configuredTools)) {
        // Cloud files are opt-in (see cloud-agent.ts). `update` never prompts,
        // so it only refreshes files the user has already opted into (via
        // `openspec init` or a `githubCopilot.cloudAgent: true` config), or that
        // a pre-opt-in project already has. Opting in is a deliberate init/config
        // step, never a silent side effect of running update.
        if (await isCopilotCloudEnabled(projectPath)) {
          await writeCopilotCloudFiles(projectPath, ops);
          const collisions = await findUnmanagedCloudFiles(projectPath);
          if (collisions.length > 0) {
            this.log(
              chalk.dim(
                `既存の ${collisions.join(' と ')} は変更していません。Copilot のクラウドエージェントで openspec を実行するには、` +
                  `OpenSpec のインストール手順を手動で追加してください。`
              )
            );
          }
          return;
        }

        // Explicit opt-out (githubCopilot.cloudAgent: false) means "not here":
        // remove any managed files a prior opt-in left behind (customized files
        // are preserved). If the user simply never decided, stay quiet unless
        // we're at an interactive terminal, where a one-line hint aids discovery.
        if (readCopilotCloudOptIn(projectPath) === false) {
          const removed = await removeCopilotCloudFiles(projectPath, ops);
          if (removed > 0) {
            this.log(
              chalk.dim(`削除: Copilot クラウドエージェント用ファイル ${removed} 件（クラウドファイルを無効化）`)
            );
          }
        } else if (isInteractive()) {
          this.log(
            chalk.dim(
              "GitHub Copilot のクラウドコーディングエージェント用ファイルを利用できます（明示的な有効化が必要です）。'openspec init --copilot-cloud' で有効にできます。"
            )
          );
        }
        return;
      }

      const removed = await removeCopilotCloudFiles(projectPath, ops);
      if (removed > 0) {
        this.log(chalk.dim(`削除: Copilot クラウドエージェント用ファイル ${removed} 件（github-copilot は未設定）`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`警告: Copilot クラウドエージェント用ファイルの同期に失敗しました: ${message}`);
    }
  }

  /**
   * Tools whose SKILL.md bodies no longer match what this CLI generates.
   *
   * Skill freshness was decided solely by the `generatedBy:` line, so a body
   * edited after generation — a "helpful" PR touching `.claude/skills/**`, a
   * dotfile sync, another agent — left `update` reporting the install healthy.
   * 不足しているスキルファイルは、部分的な導入を扱うプロファイル同期で確認する。
   */
  private findToolsWithDriftedSkills(
    projectPath: string,
    toolIds: string[],
    delivery: Delivery,
    workflowsForTool: (toolId: string) => readonly (typeof ALL_WORKFLOWS)[number][]
  ): string[] {
    return toolIds.filter((toolId) => {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool || !toolSupportsSkills(tool)) return false;
      if (!getToolSkillStatus(projectPath, tool.value, this.view).configured) return false;
      // 一覧に記録した後だけ共有コピーをこのツールのものとする。
      // それまでは専用フォルダのスキルを設定同期で移行する。
      if (usesSharedSkills(tool) && !isToolListed(projectPath, tool.value, this.view)) return false;

      const skillsDir = resolveToolSkillsDir(projectPath, tool);
      // 共有コピーは全ツールで同じ文面。専用フォルダのツールだけ固有の文面を使う。
      const transformer = usesSharedSkills(tool)
        ? transformToSharedSkillReferences
        : getTransformerForTool(
          tool.value,
          delivery,
          resolveCommandSurfaceCapability(tool.value),
          resolveCommandInvocation(tool.value)
        );

      const kept = usesSharedSkills(tool) ? readKeptSharedSkills(projectPath, this.view) : new Set<string>();
      return getSkillTemplates(workflowsForTool(toolId)).some(({ template, dirName }) => {
        // 保持した独自スキルの変更は利用者に任せる。
        if (kept.has(dirName)) return false;
        const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
        if (!this.view.exists(skillFile)) return false;
        // 専用フォルダでも利用者のリンク先へは書き込まない。
        if (!usesSharedSkills(tool) && classifyOwnSkill(path.dirname(skillFile), tool.value, dirName, this.view) === 'link') {
          return false;
        }
        try {
          const existing = this.view.read(skillFile);
          const generated = generateSkillContent(template, OPENSPEC_VERSION, transformer);
          return normalizeGeneratedFile(existing) !== normalizeGeneratedFile(generated);
        } catch {
          return true;
        }
      });
    });
  }

  /**
   * 現行版が書かない旧ルートのコピーや、読まれなくなったパスの旧生成物を整理する。
   * 未編集の公開版出力だけを削除し、それ以外は保持する。旧ルートの保持対象は
   * reportKept が有効な場合に報告する。
   */
  private async removeEarlierReleaseLeftovers(
    projectPath: string,
    updatedToolIds: readonly string[],
    anyToolFailed: boolean,
    reportKept = true
  ): Promise<void> {
    // Codex と Antigravity のようにルートを共有するツールは、以前は別ツールの
    // 所有により処理を省略され、旧コピーが残る場合があった。生成後の移行は
    // 共有先に現行ファイルがある場合だけ働くため、ここでは重複の削除か
    // 差異の報告だけを行い、別ツールのルートへ移動することはない。
    const sharedRootStragglers = Object.entries(LEGACY_TOOL_ROOTS)
      .filter(([toolId, roots]) =>
        !updatedToolIds.includes(toolId) &&
        roots.some((root) => root.timing === 'after-generation')
      )
      .map(([toolId]) => toolId);
    // ツール失敗時は旧ファイルを消さない。整理を拒否した場合でも、
    // 共有先にすでにある重複コピーだけは各ツールの移行と同様に削除できる。
    if (sharedRootStragglers.length > 0 && !anyToolFailed) {
      if (!this.dryRun) {
        for (const migration of migrateLegacyToolDirs(
          projectPath,
          sharedRootStragglers,
          'after-generation'
        )) {
          if (hasMovableContent(migration)) {
            this.log(chalk.dim(`${migration.from} の旧${describeLegacyMigration(migration)}を削除しました`));
          }
          if (reportKept) this.reportKeptInPlace(migration);
        }
      } else {
        await this.planLegacyToolMoves(projectPath, 'after-generation', sharedRootStragglers);
      }
    }

    // 読まれなくなった旧公開版の未編集出力には利用者の内容がない。
    // ただし整理の拒否後や更新失敗後は、旧ファイルが必要な場合があるため残す。
    const staleReleasedFiles = this.legacyCleanupSkipped || anyToolFailed
      ? []
      : await findStaleReleasedFiles(projectPath, this.view);
    const removed: string[] = [];
    for (const rel of staleReleasedFiles) {
      // findStaleReleasedFiles が途中にリンクのない実ファイルと確認済み。
      try {
        await this.ops.removeFile(path.join(projectPath, ...rel.split('/')), 'earlier-release');
        removed.push(rel);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log(chalk.yellow(`${rel} を削除できませんでした: ${message}`));
      }
    }
    if (removed.length > 0) {
      if (!this.dryRun) {
        await pruneEmptyParents(projectPath, removed);
      }
      this.log(
        chalk.dim(
          `旧 OpenSpec が残した、現在はどのツールも読まない未編集ファイル${removed.length}件を削除しました。`
        )
      );
    }
  }

  /**
   * Display message when all tools are up to date.
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    this.log(chalk.green(`✓ 設定済みのツール${toolStatuses.length}件はすべて最新です（v${OPENSPEC_VERSION}）`));
    this.log(chalk.dim(`  ツール: ${toolNames.join(', ')}`));
    this.log();
    this.log(chalk.dim('ファイルを再生成するには --force を使用してください。'));
  }

  /**
   * Display the update plan showing which tools need updating.
   */
  private displayUpdatePlan(
    toolsToUpdate: string[],
    statusByTool: Map<string, ToolVersionStatus>,
    upToDate: ToolVersionStatus[],
    driftedSkills: ReadonlySet<string> = new Set()
  ): void {
    const updates = toolsToUpdate.map((toolId) => {
      const status = statusByTool.get(toolId);
      if (status?.needsUpdate) {
        const fromVersion = status.generatedByVersion ?? '不明';
        return `${status.toolId} (${fromVersion} → ${OPENSPEC_VERSION})`;
      }
      // Say why: a user who edited a SKILL.md on purpose is owed the reason
      // their edit is about to be overwritten.
      if (driftedSkills.has(toolId)) {
        return `${toolId} (スキルファイルが生成内容と異なります)`;
      }
      return `${toolId} (設定同期)`;
    });

    this.log(`更新対象: ${toolsToUpdate.length} 件（${updates.join(', ')}）`);

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      this.log(chalk.dim(`最新: ${upToDateNames.join(', ')}`));
    }
  }

  /**
   * Shows manual setup notes for configured tools that need extra
   * configuration before they pick up generated files.
   */
  private displaySetupNotes(toolIds: string[]): void {
    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (tool?.setupNote) {
        this.log(chalk.yellow(`${tool.name} のセットアップが必要です: ${tool.setupNote}`));
      }
    }
  }

  /**
   * Detects new tool directories that aren't currently configured and displays a hint.
   */
  private detectNewTools(projectPath: string, configuredTools: string[]): void {
    const availableTools = getAvailableTools(projectPath);
    const configuredSet = new Set(configuredTools);

    const newTools = availableTools.filter((t) => !configuredSet.has(t.value));

    if (newTools.length > 0) {
      const newToolNames = newTools.map((tool) => tool.name);
      this.log();
      this.log(
        chalk.yellow(
          `新しいツールが検出されました: ${newToolNames.join(', ')}。追加するには 'openspec init' を実行してください。`
        )
      );
    }
  }

  /**
   * 補足を順番に表示し、設定コマンドの案内が重複するのを防ぐ。
   * 各補足を必ず評価する。|| で呼び出しを連結すると、短絡評価で後続が省略される。
   */
  private displayProfileNotes(
    projectPath: string,
    configuredTools: string[],
    desiredWorkflows: readonly string[] | undefined,
    profile: Profile
  ): void {
    const printedExtraNote = this.displayExtraWorkflowsNote(
      projectPath,
      configuredTools,
      desiredWorkflows ?? []
    );
    const printedMissingCoreNote = this.displayMissingCoreWorkflowsNote(profile, desiredWorkflows);
    this.displayOptionalWorkflowsNote(
      configuredTools,
      desiredWorkflows,
      printedExtraNote || printedMissingCoreNote
    );
  }

  /**
   * Displays a note about extra workflows installed that aren't in the current profile.
   */
  private displayExtraWorkflowsNote(
    projectPath: string,
    configuredTools: string[],
    profileWorkflows: readonly string[]
  ): boolean {
    const installedWorkflows = scanInstalledWorkflows(projectPath, configuredTools);
    const profileSet = new Set(profileWorkflows);
    const extraWorkflows = installedWorkflows.filter((w) => !profileSet.has(w));

    if (extraWorkflows.length > 0) {
      this.log(chalk.dim(`注: 現在のプロファイルに含まれない追加ワークフローが ${extraWorkflows.length} 件あります（管理するには \`openspec config profile\` を使用）`));
      return true;
    }
    return false;
  }

  /**
   * Point out core workflows a custom profile is missing, so releases that
   * grow CORE_WORKFLOWS stay discoverable. Keep custom profiles user-owned;
   * do not mutate them.
   */
  private displayMissingCoreWorkflowsNote(profile: Profile, workflows?: readonly string[]): boolean {
    if (profile !== 'custom' || !workflows) {
      return false;
    }

    const workflowSet = new Set(workflows);
    const missing = CORE_WORKFLOWS.filter((workflow) => !workflowSet.has(workflow));

    if (missing.length === 0) {
      return false;
    }

    this.log(chalk.dim(`注: カスタムプロファイルに core ワークフローが ${missing.length} 件不足しています: ${missing.join(', ')}`));
    this.log(chalk.dim('追加するには `openspec config profile`、core セットを使うには `openspec config profile core` を実行してください。'));
    return true;
  }

  /**
   * 他の補足が出ない場合も、プロファイルに含まれないワークフローを案内する (#1076)。
   * 既定の core でも未導入のワークフローの追加方法を分かるようにする。
   * 設定方法をすでに案内した場合や、ツールが未設定の場合は省略する。
   */
  private displayOptionalWorkflowsNote(
    configuredTools: string[],
    workflows: readonly string[] | undefined,
    alreadyPointedAtProfileConfig: boolean
  ): void {
    if (alreadyPointedAtProfileConfig || !workflows) {
      return;
    }

    if (configuredTools.length === 0) {
      return;
    }

    const note = formatOptionalWorkflowsNote(workflows);
    if (!note) {
      return;
    }
    for (const line of note) {
      this.log(chalk.dim(line));
    }
  }

  /**
   * Removes skill directories for workflows that are no longer selected in the active profile.
   * Returns the number of directories removed.
   */
  private async removeUnselectedSkillDirs(
    skillsRoot: string,
    skillsDir: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][],
    toolId: string
  ): Promise<number> {
    const desiredSet = new Set(desiredWorkflows);
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      if (!this.view.exists(skillDir)) continue;
      // OpenSpec の SKILL.md だけを削除する。リンク、フォルダ位置のファイル、
      // 編集済み SKILL.md、隣の別ファイルは利用者のもの。
      // リンクをたどるパス検査より前に分類する。
      const spot = classifyOwnSkill(skillDir, toolId, dirName, this.view, OPENSPEC_VERSION);
      if (spot === 'link' || spot === 'user') {
        this.keptOwnSkills.push(skillDir);
        continue;
      }
      if (spot === 'missing') continue;
      FileSystemUtils.assertPathWithin(skillsRoot, skillDir);
      try {
        await this.ops.removeFile(path.join(skillDir, 'SKILL.md'), toolId);
        if (!this.dryRun) {
          try {
            fs.rmdirSync(skillDir);
          } catch {
            // 利用者の別ファイルが残っている。
          }
        }
        removed++;
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /** 未使用の SKILL.md.bak、または最初の SKILL.md.bak<n>。 */
  private freeBackupPath(skillFile: string): string {
    for (let n = 0; ; n += 1) {
      const candidate = `${skillFile}.bak${n === 0 ? '' : n}`;
      // リンク切れも使用済みとし、リンク先へ書き込まない。
      if (!this.view.exists(candidate) && this.view.linkTarget?.(candidate) === undefined) return candidate;
    }
  }

  /**
   * Offers to move OpenSpec content out of a renamed tool's former directory
   * when the old location might still be the live one — today, Windsurf's
   * `.windsurf/` after the Devin Desktop rebrand.
   *
   * Interactive runs are asked, because nothing on disk distinguishes a user
   * who took the rebrand from one still on a pre-rebrand Windsurf build that
   * reads only `.windsurf/`. `--force` and non-interactive runs migrate, which
   * is what an unattended upgrade wants.
   */
  /** Surfaces files the move left behind rather than overwriting. */
  private reportKeptInPlace(migration: LegacyToolMigration): void {
    const notice = keptInPlaceNotice(migration);
    if (notice) this.log(chalk.dim(notice));
  }

  private async offerConsentedLegacyMigrations(
    projectPath: string
  ): Promise<LegacyToolMigration[]> {
    const pending = findLegacyToolMigrations(projectPath).filter((m) => m.needsConsent);
    const declined: LegacyToolMigration[] = [];
    if (pending.length === 0) return declined;

    for (const migration of pending) {
      // Nothing movable: every legacy file differs from its counterpart, so
      // there is no move to offer. Still say so — silence would leave two
      // divergent copies the user never hears about.
      if (!hasMovableContent(migration)) {
        this.reportKeptInPlace(migration);
        this.log();
        continue;
      }

      this.log(chalk.yellow(legacyMigrationNotice(migration)));

      if (!this.force && isInteractive()) {
        const { confirm } = await import('@inquirer/prompts');
        let shouldMigrate: boolean;
        try {
          shouldMigrate = await confirm({
            message: `${describeLegacyMigration(migration)}を ${migration.from}/ から ${migration.to}/ へ移動しますか？`,
            default: true,
          });
        } catch {
          // Closed stdin is not consent, and it must not abort the update.
          shouldMigrate = false;
        }
        if (!shouldMigrate) {
          // Say what declining costs. OpenSpec writes the current root now, so
          // the files keep working where they are, but OpenSpec stops managing
          // them — it no longer looks in the former directory.
          this.log(
            chalk.dim(
              `そのまま残します。OpenSpec は今後 ${migration.to}/ に書き込み、${migration.from}/ は管理しません。` +
                `移動するまでファイルは現在のままです。次回の実行時にもう一度確認します。`
            )
          );
          this.log();
          declined.push(migration);
          continue;
        }
      }

      for (const applied of migrateLegacyToolDirs(projectPath, [migration.toolId])) {
        if (hasMovableContent(applied)) {
          this.log(chalk.dim(`${describeLegacyMigration(applied)}を移行しました: ${applied.from} → ${applied.to}`));
        }
        this.reportKeptInPlace(applied);
      }
      this.log();
    }

    return declined;
  }

  /**
   * Detect and handle legacy OpenSpec artifacts.
   * Unlike init, update warns but continues if legacy files found in non-interactive mode.
   * Returns array of tool IDs that were newly configured during legacy upgrade.
   */
  private async handleLegacyCleanup(
    projectPath: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][],
    delivery: Delivery
  ): Promise<LegacyUpgradeResult> {
    // Detect legacy artifacts
    const detection = await detectLegacyArtifacts(projectPath);

    // 編集済みプロンプトは整理対象外なので別途案内する。
    // 削除対象がなくても、--force の実行ごとに報告する。
    if (this.force) await this.reportEditedGlobalPrompts();

    if (!detection.hasLegacyArtifacts) {
      return { newlyConfiguredTools: [], workflowOverrides: {} }; // No legacy artifacts found
    }

    // Show what was detected
    const immediateSummary = formatDetectionSummary(omitGlobalLegacyPromptFiles(detection));
    const deferredSummary = formatDeferredGlobalPromptSummary(detection);
    if (immediateSummary || deferredSummary) {
      this.log();
      if (immediateSummary) {
        this.log(immediateSummary);
        this.log();
      }
      if (deferredSummary) {
        this.log(deferredSummary);
        this.log();
      }
    }

    // A dry run plans a non-interactive update, so it never prompts.
    const canPrompt = !this.dryRun && isInteractive();

    // 未編集の旧公開版出力は確認や --force なしで削除できる。
    // ホーム内のプロンプトは他プロジェクトと共有するため、
    // このプロジェクトの設定には使わず、--force または同意があるときだけ整理する。
    const projectDetection = omitGlobalLegacyPromptFiles(detection);
    const hasProjectRemovals = hasRepoLocalLegacyRemovals(detection);
    const hasGlobalPrompts = detection.globalSlashCommandFiles.length > 0;
    const onlyReleasedOutput =
      !this.force &&
      hasProjectRemovals &&
      !(canPrompt && hasGlobalPrompts) &&
      (await legacyCleanupDeletesOnlyReleasedOutput(projectPath, detection));
    if (onlyReleasedOutput) {
      this.log(
        chalk.dim('旧 OpenSpec の生成内容から変更されていないファイルのため、更新時に削除します。')
      );
      this.log();
    }

    if (this.force || onlyReleasedOutput) {
      // 確認なしの整理では検出した全ツールの置き換え先が必要なので、選択画面を出さない。
      const legacyUpgrade = await this.upgradeLegacyTools(
        projectPath,
        onlyReleasedOutput ? projectDetection : detection,
        canPrompt && !onlyReleasedOutput,
        desiredWorkflows,
        delivery
      );
      // 確認なしの整理は全体で成功した場合だけ実行する。失敗したツールの旧コマンドが
      // openspec/AGENTS.md を必要とする可能性があるため、失敗時はすべて残す。
      if (onlyReleasedOutput && (legacyUpgrade.failedTools ?? []).length > 0) {
        this.legacyCleanupSkipped = true;
        this.log(chalk.yellow('⚠ ツールの設定に失敗したため、旧版のファイルを保持しました。問題を修正して update を再実行してください。'));
        return legacyUpgrade;
      }
      await this.performImmediateLegacyCleanup(projectPath, detection, legacyUpgrade);
      if (onlyReleasedOutput && hasGlobalPrompts) {
        this.log(
          chalk.dim(
            `ホームフォルダの OpenSpec プロンプトファイル${detection.globalSlashCommandFiles.length}件を保持しました。` +
              '他のプロジェクトで使用している可能性があります。削除するには "openspec update --force" を実行してください。'
          )
        );
        return legacyUpgrade;
      }
      return {
        ...legacyUpgrade,
        deferredGlobalCleanup: pickGlobalLegacyPromptFiles(
          detection,
          detection.globalSlashCommandFiles
        ),
      };
    }

    if (!canPrompt) {
      // Non-interactive mode without --force: warn and continue
      // (Unlike init, update doesn't abort - user may just want to update skills)
      this.legacyCleanupSkipped = hasProjectRemovals;
      this.log(chalk.yellow('⚠ --force で旧ファイルを自動クリーンアップするか、対話モードで実行してください。'));
      this.log();
      this.recorder?.addNote(
        'legacy-artifacts',
        '旧形式の OpenSpec ファイルが見つかりました。更新時の削除には --force または端末での確認が必要なため、この計画では保持します。--dry-run --force で削除内容も表示できます。'
      );
      return { newlyConfiguredTools: [], workflowOverrides: {} };
    }

    // 対話モード: 確認プロンプトを表示
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: '旧ファイルをアップグレードしてクリーンアップしますか？',
      default: true,
    });

    if (shouldCleanup) {
      const legacyUpgrade = await this.upgradeLegacyTools(
        projectPath,
        detection,
        canPrompt,
        desiredWorkflows,
        delivery
      );
      await this.performImmediateLegacyCleanup(projectPath, detection, legacyUpgrade);
      return {
        ...legacyUpgrade,
        deferredGlobalCleanup: pickGlobalLegacyPromptFiles(
          detection,
          detection.globalSlashCommandFiles
        ),
      };
    } else {
      this.legacyCleanupSkipped = hasProjectRemovals;
      this.log(chalk.dim('旧ファイルのクリーンアップをスキップし、スキル更新を続行します...'));
      this.log();
      return { newlyConfiguredTools: [], workflowOverrides: {} };
    }
  }

  /**
   * Cleans approved repo-local legacy artifacts before configured tools refresh.
   */
  private async performImmediateLegacyCleanup(
    projectPath: string,
    detection: LegacyDetectionResult,
    legacyUpgrade: LegacyUpgradeResult
  ): Promise<void> {
    // 設定を省略または失敗したツールには代替がないため、プロジェクト内の旧ファイルを残す。
    const toolsWithoutReplacement = [
      ...(legacyUpgrade.skippedSharedSkillTools ?? []),
      ...(legacyUpgrade.failedTools ?? []).flatMap((failure) => failure.toolId ?? []),
    ];
    const immediateDetection = omitToolLegacyArtifacts(
      omitGlobalLegacyPromptFiles(detection),
      toolsWithoutReplacement
    );
    if (immediateDetection.hasLegacyArtifacts) {
      await this.performLegacyCleanup(projectPath, immediateDetection);
    }
  }

  /**
   * Cleans approved global Codex prompts after configured tools refresh so newly
   * installed replacement skills can retire their prompts in the same run.
   */
  private async performDeferredGlobalPromptCleanup(
    projectPath: string,
    detection: LegacyDetectionResult
  ): Promise<void> {
    // Read the tree as planned: a dry run has not written the replacement
    // skills this check looks for.
    const availableCodexWorkflows = new Set(
      scanInstalledWorkflows(projectPath, ['codex'], this.view)
    );
    const removableMatches = getLegacyGlobalPromptMatches(detection)
      .filter((prompt) => prompt.workflowIds.every((workflowId) => availableCodexWorkflows.has(workflowId)));

    if (removableMatches.length > 0) {
      await this.performLegacyCleanup(
        projectPath,
        pickGlobalLegacyPromptFiles(
          detection,
          removableMatches.map((prompt) => prompt.path)
        )
      );
    }

    const blockedMatches = getLegacyGlobalPromptMatches(detection)
      .filter((prompt) => !removableMatches.some((match) => match.path === prompt.path));

    if (removableMatches.length > 0) await this.reportEditedGlobalPrompts();

    if (blockedMatches.length > 0) {
      this.log(chalk.yellow('代替スキルがないため、保留中のグローバルプロンプトを維持しました:'));
      for (const prompt of blockedMatches) {
        this.log(chalk.dim(`  - ${prompt.toolId}: ${prompt.path}`));
      }
      this.log();
    }
  }

  /**
   * 利用者が編集した、OpenSpec と同名のホーム内プロンプトを列挙する。
   * どの整理でも保持されるため、案内は1回の実行につき1回だけにする。
   */
  private async reportEditedGlobalPrompts(): Promise<void> {
    if (this.editedGlobalPromptsReported) return;
    this.editedGlobalPromptsReported = true;
    const edited = await findEditedLegacyGlobalPrompts();
    if (edited.length === 0) return;
    this.log(
      chalk.yellow(
        `OpenSpec の生成内容と異なるホーム内のプロンプトファイル${edited.length}件を保持しました（編集済みの可能性があります）:`
      )
    );
    for (const file of edited) this.log(chalk.dim(`  ${file}`));
    this.log(chalk.dim('必要な内容をスキルへ移してから、手動で削除してください。'));
    this.log();
  }

  /**
   * Perform cleanup of legacy artifacts.
   */
  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = this.startSpinner('旧ファイルをクリーンアップ中...');

    const result = await cleanupLegacyArtifacts(projectPath, detection, this.fileOps('openspec'));

    spinner.succeed('旧ファイルをクリーンアップしました');

    const summary = formatCleanupSummary(result);
    if (summary) {
      this.log();
      this.log(summary);
    }

    this.log();
  }

  /**
   * Upgrades unconfigured legacy tools into the skills-based setup and carries
   * workflow overrides for migrations that should mirror legacy Codex prompts.
   */
  private async upgradeLegacyTools(
    projectPath: string,
    detection: LegacyDetectionResult,
    canPrompt: boolean,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][],
    delivery: Delivery
  ): Promise<LegacyUpgradeResult> {
    // Get tools that had legacy artifacts
    const legacyTools = getToolsFromLegacyArtifacts(detection);

    if (legacyTools.length === 0) {
      return { newlyConfiguredTools: [], workflowOverrides: {} };
    }

    // Get currently configured tools
    const configuredTools = getConfiguredToolsForProfileSync(projectPath, this.view);
    const configuredSet = new Set(configuredTools);

    // Filter to tools that aren't already configured
    const unconfiguredLegacyTools = legacyTools.filter((t) => !configuredSet.has(t));

    if (unconfiguredLegacyTools.length === 0) {
      return { newlyConfiguredTools: [], workflowOverrides: {} };
    }

    // Get valid tools (those with skillsDir)
    const validToolIds = new Set(getToolsWithSkillsDir());
    const validUnconfiguredTools = unconfiguredLegacyTools.filter((t) => validToolIds.has(t));

    if (validUnconfiguredTools.length === 0) {
      return { newlyConfiguredTools: [], workflowOverrides: {} };
    }

    // Show what tools were detected from legacy artifacts
    this.log(chalk.bold('旧アーティファクトから検出したツール:'));
    for (const toolId of validUnconfiguredTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      this.log(`  • ${tool?.name || toolId}`);
    }
    this.log();

    let selectedTools: string[];

    if (this.force || !canPrompt) {
      // Non-interactive with --force: auto-select detected tools
      selectedTools = validUnconfiguredTools;
      this.log(`スキルをセットアップするツール: ${selectedTools.join(', ')}`);
    } else {
      // Interactive mode: prompt for tool selection with detected tools pre-selected
      const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

      const sortedChoices = validUnconfiguredTools.map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        return {
          name: tool?.name || toolId,
          value: toolId,
          searchAliases: tool?.searchAliases,
          configured: false,
          preSelected: true, // Pre-select all detected legacy tools
        };
      });

      selectedTools = await searchableMultiSelect({
        message: '新しいスキルシステムでセットアップするツールを選択してください:',
        pageSize: 15,
        choices: sortedChoices,
        validate: (_selected: string[]) => true, // Allow empty selection (user can skip)
      });

      if (selectedTools.length === 0) {
        this.log(chalk.dim('ツールのセットアップをスキップします。'));
        this.log();
        return { newlyConfiguredTools: [], workflowOverrides: {} };
      }
    }

    const inferredCodexWorkflows = getProfileWorkflows(
      'custom',
      getLegacyWorkflowIdsForTool(detection, 'codex')
    ).filter((workflow): workflow is (typeof ALL_WORKFLOWS)[number] =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
    );

    // Create skills/commands for selected tools using effective profile+delivery.
    const newlyConfigured: string[] = [];
    const skippedSharedSkillTools: string[] = [];
    const failedTools: ToolFailure[] = [];
    const workflowOverrides: LegacyUpgradeResult['workflowOverrides'] = {};
    const workflowsForLegacyTool = (toolId: string) =>
      toolId === 'codex' && inferredCodexWorkflows.length > 0 ? inferredCodexWorkflows : desiredWorkflows;
    // 設定済み・新規追加の全ツールの共有コピーを、旧ルート移行より先に作る。
    const sharedInstall = await this.installSharedSkillsForRun(
      projectPath,
      [...new Set([...configuredTools, ...selectedTools])],
      selectedTools,
      workflowsForLegacyTool
    );

    for (const toolId of selectedTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool || !toolSupportsSkills(tool)) continue;

      const spinner = this.startSpinner(`${tool.name} をセットアップ中...`);

      try {
        const skillsDir = resolveToolSkillsDir(projectPath, tool);
        const skillsRoot = hasGlobalSkillTarget(tool) ? skillsDir : projectPath;
        // 共有フォルダのスキルは上で1回書き込み済み。
        const writesSkills = !usesSharedSkills(tool);
        const ownFolderError = sharedInstall.toolFailures.get(tool.value);
        if (ownFolderError) throw ownFolderError;
        const toolWorkflows = workflowsForLegacyTool(tool.value);
        if (tool.value === 'codex' && inferredCodexWorkflows.length > 0) {
          workflowOverrides[tool.value] = inferredCodexWorkflows;
        }
        const skillTemplates = getSkillTemplates(toolWorkflows);

        // 専用フォルダのスキルファイルを作成する。
        if (writesSkills) {
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            const transformer = getTransformerForTool(
              tool.value,
              delivery,
              resolveCommandSurfaceCapability(tool.value),
              resolveCommandInvocation(tool.value)
            );
            const skillContent = generateSkillContent(template, OPENSPEC_VERSION, transformer);
            FileSystemUtils.assertPathWithin(skillsRoot, skillFile);
            await this.ops.writeFile(skillFile, skillContent, tool.value);
          }
        }

        spinner.succeed(`${tool.name} のセットアップが完了しました`);
        newlyConfigured.push(toolId);
        if (this.dryRun) {
          await this.planLegacyToolMoves(projectPath, 'after-generation', [tool.value]);
        } else {
          for (const migration of migrateLegacyToolDirs(
            projectPath,
            [tool.value],
            'after-generation'
          )) {
            if (hasMovableContent(migration)) {
              this.log(chalk.dim(`${describeLegacyMigration(migration)}を移行しました: ${migration.from} → ${migration.to}`));
            }
            this.reportKeptInPlace(migration);
          }
        }
      } catch (error) {
        spinner.fail(`${tool.name} のセットアップに失敗しました`);
        const message = error instanceof Error ? error.message : String(error);
        this.log(chalk.red(`  ${message}`));
        failedTools.push({ name: tool.name, error: message, toolId: tool.value });
        this.recorder?.addFailure(tool.value, message);
      }
    }

    if (newlyConfigured.length > 0) {
      this.log();
    }

    return {
      newlyConfiguredTools: newlyConfigured,
      workflowOverrides,
      skippedSharedSkillTools,
      failedTools,
    };
  }
}
