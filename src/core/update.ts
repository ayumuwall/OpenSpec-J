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
import { getSkillReferenceTransformer, getTransformerForTool, transformToSkillReferences } from '../utils/command-references.js';
import { AI_TOOLS, OPENSPEC_DIR_NAME } from './config.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from './command-generation/index.js';
import {
  getToolVersionStatus,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  getToolsWithSkillsDir,
  hasGlobalSkillTarget,
  resolveToolSkillsDir,
  toolSupportsSkills,
  type ToolVersionStatus,
} from './shared/index.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatDeferredGlobalPromptSummary,
  formatCleanupSummary,
  formatDetectionSummary,
  getLegacyGlobalPromptMatches,
  getLegacyWorkflowIdsForTool,
  getToolsFromLegacyArtifacts,
  omitGlobalLegacyPromptFiles,
  omitToolLegacyArtifacts,
  pickGlobalLegacyPromptFiles,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import { isInteractive } from '../utils/interactive.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS, CORE_WORKFLOWS } from './profiles.js';
import { getOnboardingCommands } from './onboarding-commands.js';
import { getAvailableTools } from './available-tools.js';
import {
  WORKFLOW_TO_SKILL_DIR,
  getConfiguredToolsForProfileSync,
  getToolsNeedingProfileSync,
} from './profile-sync-drift.js';
import {
  scanInstalledWorkflows as scanInstalledWorkflowsShared,
  migrateIfNeeded as migrateIfNeededShared,
  findLegacyToolMigrations,
  migrateLegacyToolDirs,
  describeLegacyMigration,
  legacyMigrationNotice,
  keptInPlaceNotice,
  hasMovableContent,
  type LegacyToolMigration,
} from './migration.js';
import {
  resolveCommandSurfaceCapability,
  resolveCommandInvocation,
  shouldGenerateCommandsForTool,
  shouldGenerateSkillsForTool,
  shouldReconcileCommandFilesForTool,
  shouldRemoveSkillsForTool,
} from './command-surface.js';
import { writeSharedSkillTarget, sharedSkillRootOwner } from './shared-skill-target.js';
import { includesGitHubCopilot, writeCopilotCloudFiles, removeCopilotCloudFiles, isCopilotCloudEnabled, readCopilotCloudOptIn, findUnmanagedCloudFiles } from './github-copilot/cloud-agent.js';

const require = createRequire(import.meta.url);
const { version: OPENSPEC_VERSION } = require('../../package.json');

/**
 * Captures legacy migration side effects so update can refresh newly configured
 * tools and honor workflow subsets inferred from legacy Codex prompt filenames.
 */
type LegacyUpgradeResult = {
  newlyConfiguredTools: string[];
  workflowOverrides: Partial<Record<string, readonly (typeof ALL_WORKFLOWS)[number][]>>;
  deferredGlobalCleanup?: LegacyDetectionResult;
  /**
   * Tools whose skill generation was skipped because another tool already owns
   * their shared skills root. Their repo-local legacy artifacts must be exempt
   * from immediate cleanup — no replacement was written to justify deleting them.
   */
  skippedSharedSkillTools?: string[];
};

/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Force update even when tools are up to date */
  force?: boolean;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 *
 * Wrapper around the shared migration module's scanInstalledWorkflows that accepts tool IDs.
 */
export function scanInstalledWorkflows(projectPath: string, toolIds: string[]): string[] {
  const tools = toolIds
    .map((id) => AI_TOOLS.find((t) => t.value === id))
    .filter((t): t is NonNullable<typeof t> => t != null);
  return scanInstalledWorkflowsShared(projectPath, tools);
}

export class UpdateCommand {
  private readonly force: boolean;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
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

    // 1. Check openspec directory exists
    if (!await FileSystemUtils.directoryExists(openspecPath)) {
      throw new Error(`OpenSpec ディレクトリが見つかりません。先に 'openspec init' を実行してください。`);
    }

    // 2. Migrate OpenSpec-managed skills left in renamed tool directories
    // (e.g. .kimi -> .kimi-code) so they stay detected and get refreshed,
    // then perform the one-time profile migration if needed before any
    // legacy upgrade generation.
    for (const migration of migrateLegacyToolDirs(resolvedProjectPath)) {
      if (hasMovableContent(migration)) {
        console.log(chalk.dim(`${describeLegacyMigration(migration)} を移行しました: ${migration.from} → ${migration.to}`));
      }
      this.reportKeptInPlace(migration);
    }
    const declinedMigrations = await this.offerConsentedLegacyMigrations(resolvedProjectPath);

    // Use detected tool directories to preserve existing opsx skills/commands.
    const detectedTools = getAvailableTools(resolvedProjectPath);
    migrateIfNeededShared(resolvedProjectPath, detectedTools);

    // 3. Read global config for profile/delivery
    const globalConfig = getGlobalConfig();
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
    } = legacyUpgrade;

    // 5. Find configured tools
    const configuredTools = getConfiguredToolsForProfileSync(resolvedProjectPath);
    const configuredAndNewTools = [...new Set([...configuredTools, ...newlyConfiguredTools])];

    if (configuredTools.length === 0 && newlyConfiguredTools.length === 0) {
      if (deferredGlobalCleanup) {
        await this.performDeferredGlobalPromptCleanup(resolvedProjectPath, deferredGlobalCleanup);
      }
      if (declinedMigrations.length > 0) {
        // Not an unconfigured project — a configured one the user chose to
        // leave in its former directory. Saying "run init" would be wrong.
        for (const migration of declinedMigrations) {
          console.log(
            chalk.yellow(
              `更新対象がありません。このプロジェクトのOpenSpecファイルは、現在は書き込み対象外の ${migration.from}/ に残っています。`
            )
          );
          console.log(
            chalk.dim(`更新を再開するには "openspec update" を再実行し、${migration.to}/ への移動を許可してください。`)
          );
        }
        return;
      }
      await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools);
      console.log(chalk.yellow('設定済みのツールが見つかりません。'));
      console.log(chalk.dim('ツールを設定するには "openspec init" を実行してください。'));
      return;
    }

    // 6. Check version status for all configured tools, against the same workflow set
    //    the generation loop below writes — otherwise a legacy-upgraded tool would be
    //    fingerprinted against commands it was never given.
    const toolStatuses = configuredTools.map((toolId) =>
      getToolVersionStatus(resolvedProjectPath, toolId, OPENSPEC_VERSION, {
        workflows: legacyWorkflowOverrides[toolId] ?? desiredWorkflows,
      })
    );
    const statusByTool = new Map(toolStatuses.map((status) => [status.toolId, status] as const));

    // 7. Smart update detection
    const toolsNeedingVersionUpdate = toolStatuses
      .filter((s) => {
        if (!s.needsUpdate || delivery !== 'commands') {
          return s.needsUpdate;
        }

        const tool = AI_TOOLS.find((candidate) => candidate.value === s.toolId);
        return !tool || !hasGlobalSkillTarget(tool);
      })
      .map((s) => s.toolId);
    const toolsNeedingConfigSync = getToolsNeedingProfileSync(
      resolvedProjectPath,
      desiredWorkflows,
      delivery,
      configuredTools
    );
    const toolsToUpdateSet = new Set<string>([
      ...toolsNeedingVersionUpdate,
      ...toolsNeedingConfigSync,
    ]);
    const toolsUpToDate = toolStatuses.filter((s) => !toolsToUpdateSet.has(s.toolId));

    if (!this.force && toolsToUpdateSet.size === 0 && newlyConfiguredTools.length === 0) {
      if (deferredGlobalCleanup) {
        await this.performDeferredGlobalPromptCleanup(resolvedProjectPath, deferredGlobalCleanup);
      }
      // All tools are up to date
      this.displayUpToDateMessage(toolStatuses);
      await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools);

      // Still check for new tool directories and extra workflows
      this.detectNewTools(resolvedProjectPath, configuredTools);
      this.displayExtraWorkflowsNote(resolvedProjectPath, configuredTools, desiredWorkflows);
      this.displayMissingCoreWorkflowsNote(profile, globalConfig.workflows);
      this.displaySetupNotes(configuredTools);
      return;
    }

    // 8. Display update plan
    if (this.force) {
      console.log(`強制更新: ${configuredTools.length} 件（${configuredTools.join(', ')}）`);
    } else if (toolsToUpdateSet.size === 0) {
      console.log('旧ファイルの移行後に追加更新は必要ありません。');
    } else {
      this.displayUpdatePlan([...toolsToUpdateSet], statusByTool, toolsUpToDate);
    }
    console.log();

    // 9. Determine what to generate based on delivery
    const deliveryIncludesCommands = delivery !== 'skills';
    // 10. Update tools (all if force, otherwise only those needing update)
    const toolsToUpdate = this.force ? configuredTools : [...toolsToUpdateSet];
    const updatedTools: string[] = [];
    const failedTools: Array<{ name: string; error: string }> = [];
    const skillsInvocableCommandSkips: string[] = [];
    const zeroArtifactTools: string[] = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;
    let removedDeselectedCommandCount = 0;
    let removedDeselectedSkillCount = 0;

    for (const toolId of toolsToUpdate) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool || !toolSupportsSkills(tool)) continue;

      const spinner = ora(`${tool.name} を更新中...`).start();

      try {
        const skillsDir = resolveToolSkillsDir(resolvedProjectPath, tool);
        const skillsRoot = hasGlobalSkillTarget(tool) ? skillsDir : resolvedProjectPath;
        const shouldGenerateSkills = shouldGenerateSkillsForTool(tool.value, delivery);
        const shouldGenerateCommands = shouldGenerateCommandsForTool(tool.value, delivery);
        const toolWorkflows = legacyWorkflowOverrides[tool.value] ?? desiredWorkflows;
        const skillTemplates = getSkillTemplates(toolWorkflows);
        const commandContents = getCommandContents(toolWorkflows);

        // Generate skill files if delivery includes skills
        if (shouldGenerateSkills) {
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
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
          writeSharedSkillTarget(resolvedProjectPath, tool.value);

          removedDeselectedSkillCount += await this.removeUnselectedSkillDirs(
            skillsRoot,
            skillsDir,
            toolWorkflows
          );
        }

        // Delete skill directories if delivery is commands-only
        if (shouldRemoveSkillsForTool(tool.value, delivery) && !hasGlobalSkillTarget(tool)) {
          removedSkillCount += await this.removeSkillDirs(skillsRoot, skillsDir);
          // Persist the selected owner even when commands-only delivery leaves
          // this target with no generated skills.
          writeSharedSkillTarget(resolvedProjectPath, tool.value);
          // A tool with no command adapter now has zero OpenSpec artifacts;
          // say so like init does, rather than deleting its skills silently
          // and letting tool detection re-suggest an init that would also
          // generate nothing under this delivery setting.
          if (!shouldGenerateCommandsForTool(tool.value, delivery)) {
            zeroArtifactTools.push(tool.name);
          }
        }

        // デリバリーにコマンドが含まれる場合はコマンドを生成する
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = FileSystemUtils.resolveProjectArtifactPath(
                resolvedProjectPath,
                cmd.path
              );
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }

            removedDeselectedCommandCount += await this.removeUnselectedCommandFiles(
              resolvedProjectPath,
              toolId,
              toolWorkflows
            );
          }
        } else if (deliveryIncludesCommands && resolveCommandSurfaceCapability(tool.value) === 'skills-invocable') {
          skillsInvocableCommandSkips.push(tool.value);
        }

        // Delete command files if delivery is skills-only
        if (shouldReconcileCommandFilesForTool(tool.value, delivery)) {
          removedCommandCount += await this.removeCommandFiles(resolvedProjectPath, toolId);
        }

        spinner.succeed(`${tool.name} を更新しました`);
        updatedTools.push(tool.name);
        for (const migration of migrateLegacyToolDirs(
          resolvedProjectPath,
          [tool.value],
          'after-generation'
        )) {
          if (hasMovableContent(migration)) {
            console.log(chalk.dim(`${describeLegacyMigration(migration)} を移行しました: ${migration.from} → ${migration.to}`));
          }
          this.reportKeptInPlace(migration);
        }
      } catch (error) {
        spinner.fail(`${tool.name} の更新に失敗しました`);
        failedTools.push({
          name: tool.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (deferredGlobalCleanup) {
      await this.performDeferredGlobalPromptCleanup(resolvedProjectPath, deferredGlobalCleanup);
    }

    // 11. Summary
    console.log();
    if (updatedTools.length > 0) {
      console.log(chalk.green(`✓ 更新: ${updatedTools.join(', ')}（v${OPENSPEC_VERSION}）`));
    }
    if (failedTools.length > 0) {
      console.log(chalk.red(`✗ 失敗: ${failedTools.map(f => `${f.name}（${f.error}）`).join(', ')}`));
    }
    if (skillsInvocableCommandSkips.length > 0) {
      console.log(chalk.dim(`コマンド生成をスキップ: ${skillsInvocableCommandSkips.join(', ')}（skills を使用）`));
    }
    if (removedCommandCount > 0) {
      console.log(chalk.dim(`削除: コマンドファイル ${removedCommandCount} 件（delivery: skills）`));
    }
    if (removedSkillCount > 0) {
      console.log(chalk.dim(`削除: スキルディレクトリ ${removedSkillCount} 件（delivery: commands）`));
    }
    if (zeroArtifactTools.length > 0) {
      const names = zeroArtifactTools.join(', ');
      console.log(
        chalk.yellow(
          `${names} にスキルもコマンドも残っていません。delivery が 'commands' に設定されていますが、` +
            `対象ツールはスキルだけに対応しています。スキルを生成するには ` +
            `'openspec config set delivery both' を実行してください。`
        )
      );
    }
    if (removedDeselectedCommandCount > 0) {
      console.log(chalk.dim(`削除: コマンドファイル ${removedDeselectedCommandCount} 件（選択解除されたワークフロー）`));
    }
    if (removedDeselectedSkillCount > 0) {
      console.log(chalk.dim(`削除: スキルディレクトリ ${removedDeselectedSkillCount} 件（選択解除されたワークフロー）`));
    }

    // 12. Show onboarding message for newly configured tools from legacy upgrade.
    // Command tools get the command name their files answer to, skill-only
    // tools their documented skill invocation, and disagreements fall back to
    // naming the skill.
    if (newlyConfiguredTools.length > 0) {
      const referenceFor = (command: string): string => {
        const neutralForm = `the ${transformToSkillReferences(command).slice(1)} skill`;
        const forms = new Set(
          newlyConfiguredTools.map((toolId) => {
            if (shouldGenerateCommandsForTool(toolId, delivery)) {
              // Name the command the tool's files actually answer to:
              // /opsx-<id> where the filename is the command name.
              const transformer = getTransformerForTool(
                toolId,
                delivery,
                resolveCommandSurfaceCapability(toolId),
                resolveCommandInvocation(toolId)
              );
              return transformer ? transformer(command) : command;
            }
            return getSkillReferenceTransformer(toolId)(command);
          })
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
      console.log();
      if (entries.length > 0) {
        const width = Math.max(...entries.map(([reference]) => reference.length));
        console.log(chalk.bold('はじめに:'));
        for (const [reference, description] of entries) {
          console.log(`  ${reference.padEnd(width)}  ${description}`);
        }
        console.log();
      }
      console.log(`詳細: ${chalk.cyan('https://github.com/ayumuwall/OpenSpec-J')}`);
    }

    await this.syncCopilotCloudFiles(resolvedProjectPath, configuredAndNewTools);

    // 13. Detect new tool directories not currently configured
    this.detectNewTools(resolvedProjectPath, configuredAndNewTools);

    // 14. Display note about extra workflows not in profile
    this.displayExtraWorkflowsNote(resolvedProjectPath, configuredAndNewTools, desiredWorkflows);
    this.displayMissingCoreWorkflowsNote(profile, globalConfig.workflows);
    this.displaySetupNotes(configuredAndNewTools);

    // 15. List affected tools
    if (updatedTools.length > 0) {
      const toolDisplayNames = updatedTools;
      console.log(chalk.dim(`ツール: ${toolDisplayNames.join(', ')}`));
    }

    console.log();
    console.log(chalk.dim('変更を有効にするには IDE を再起動してください。'));
    if (failedTools.length > 0) {
      throw new Error(`次のツールの OpenSpec 更新に失敗しました: ${failedTools.map((tool) => tool.name).join(', ')}`);
    }
  }

  private async syncCopilotCloudFiles(projectPath: string, configuredTools: string[]): Promise<void> {
    try {
      if (includesGitHubCopilot(configuredTools)) {
        // Cloud files are opt-in (see cloud-agent.ts). `update` never prompts,
        // so it only refreshes files the user has already opted into (via
        // `openspec init` or a `githubCopilot.cloudAgent: true` config), or that
        // a pre-opt-in project already has. Opting in is a deliberate init/config
        // step, never a silent side effect of running update.
        if (await isCopilotCloudEnabled(projectPath)) {
          await writeCopilotCloudFiles(projectPath);
          const collisions = await findUnmanagedCloudFiles(projectPath);
          if (collisions.length > 0) {
            console.log(
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
          const removed = await removeCopilotCloudFiles(projectPath);
          if (removed > 0) {
            console.log(
              chalk.dim(`削除: Copilot クラウドエージェント用ファイル ${removed} 件（クラウドファイルを無効化）`)
            );
          }
        } else if (isInteractive()) {
          console.log(
            chalk.dim(
              "GitHub Copilot のクラウドコーディングエージェント用ファイルを利用できます（明示的な有効化が必要です）。'openspec init --copilot-cloud' で有効にできます。"
            )
          );
        }
        return;
      }

      const removed = await removeCopilotCloudFiles(projectPath);
      if (removed > 0) {
        console.log(chalk.dim(`削除: Copilot クラウドエージェント用ファイル ${removed} 件（github-copilot は未設定）`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`警告: Copilot クラウドエージェント用ファイルの同期に失敗しました: ${message}`);
    }
  }

  /**
   * Display message when all tools are up to date.
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    console.log(chalk.green(`✓ すべての ${toolStatuses.length} ツールは最新です（v${OPENSPEC_VERSION}）`));
    console.log(chalk.dim(`  ツール: ${toolNames.join(', ')}`));
    console.log();
    console.log(chalk.dim('ファイルを再生成するには --force を使用してください。'));
  }

  /**
   * Display the update plan showing which tools need updating.
   */
  private displayUpdatePlan(
    toolsToUpdate: string[],
    statusByTool: Map<string, ToolVersionStatus>,
    upToDate: ToolVersionStatus[]
  ): void {
    const updates = toolsToUpdate.map((toolId) => {
      const status = statusByTool.get(toolId);
      if (status?.needsUpdate) {
        const fromVersion = status.generatedByVersion ?? '不明';
        return `${status.toolId} (${fromVersion} → ${OPENSPEC_VERSION})`;
      }
      return `${toolId} (設定同期)`;
  });

    console.log(`更新対象: ${toolsToUpdate.length} 件（${updates.join(', ')}）`);

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      console.log(chalk.dim(`最新: ${upToDateNames.join(', ')}`));
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
        console.log(chalk.yellow(`${tool.name} のセットアップが必要です: ${tool.setupNote}`));
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
      console.log();
      console.log(
        chalk.yellow(
          `新しいツールが検出されました: ${newToolNames.join(', ')}。追加するには 'openspec init' を実行してください。`
        )
      );
    }
  }

  /**
   * Displays a note about extra workflows installed that aren't in the current profile.
   */
  private displayExtraWorkflowsNote(
    projectPath: string,
    configuredTools: string[],
    profileWorkflows: readonly string[]
  ): void {
    const installedWorkflows = scanInstalledWorkflows(projectPath, configuredTools);
    const profileSet = new Set(profileWorkflows);
    const extraWorkflows = installedWorkflows.filter((w) => !profileSet.has(w));

    if (extraWorkflows.length > 0) {
      console.log(chalk.dim(`注: 現在の profile に含まれない追加ワークフローが ${extraWorkflows.length} 件あります（管理するには \`openspec config profile\` を使用）`));
    }
  }

  /**
   * Point out core workflows a custom profile is missing, so releases that
   * grow CORE_WORKFLOWS stay discoverable. Keep custom profiles user-owned;
   * do not mutate them.
   */
  private displayMissingCoreWorkflowsNote(profile: Profile, workflows?: readonly string[]): void {
    if (profile !== 'custom' || !workflows) {
      return;
    }

    const workflowSet = new Set(workflows);
    const missing = CORE_WORKFLOWS.filter((workflow) => !workflowSet.has(workflow));

    if (missing.length === 0) {
      return;
    }

    console.log(chalk.dim(`注: custom profileにcoreワークフローが${missing.length}件不足しています: ${missing.join(', ')}`));
    console.log(chalk.dim('追加するには `openspec config profile`、coreセットを使うには `openspec config profile core` を実行してください。'));
  }

  /**
   * Removes skill directories for workflows when delivery changed to commands-only.
   * Returns the number of directories removed.
   */
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

  /**
   * Removes skill directories for workflows that are no longer selected in the active profile.
   * Returns the number of directories removed.
   */
  private async removeUnselectedSkillDirs(
    skillsRoot: string,
    skillsDir: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    const desiredSet = new Set(desiredWorkflows);
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
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

  /**
   * Removes command files for workflows when delivery changed to skills-only.
   * Returns the number of files removed.
   */
  private async removeCommandFiles(
    projectPath: string,
    toolId: string,
  ): Promise<number> {
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

  /**
   * Removes command files for workflows that are no longer selected in the active profile.
   * Returns the number of files removed.
   */
  private async removeUnselectedCommandFiles(
    projectPath: string,
    toolId: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    const desiredSet = new Set(desiredWorkflows);

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
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
    if (notice) console.log(chalk.dim(notice));
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
        console.log();
        continue;
      }

      console.log(chalk.yellow(legacyMigrationNotice(migration)));

      if (!this.force && isInteractive()) {
        const { confirm } = await import('@inquirer/prompts');
        let shouldMigrate: boolean;
        try {
          shouldMigrate = await confirm({
            message: `${describeLegacyMigration(migration)} を ${migration.from}/ から ${migration.to}/ へ移動しますか？`,
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
          console.log(
            chalk.dim(
              `そのまま残します。OpenSpec は今後 ${migration.to}/ に書き込み、${migration.from}/ は管理しません。` +
                `移動するまでファイルは現在のままです。次回の実行時にもう一度確認します。`
            )
          );
          console.log();
          declined.push(migration);
          continue;
        }
      }

      for (const applied of migrateLegacyToolDirs(projectPath, [migration.toolId])) {
        if (hasMovableContent(applied)) {
          console.log(chalk.dim(`${describeLegacyMigration(applied)} を移行しました: ${applied.from} → ${applied.to}`));
        }
        this.reportKeptInPlace(applied);
      }
      console.log();
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

    if (!detection.hasLegacyArtifacts) {
      return { newlyConfiguredTools: [], workflowOverrides: {} }; // No legacy artifacts found
    }

    // Show what was detected
    const immediateSummary = formatDetectionSummary(omitGlobalLegacyPromptFiles(detection));
    const deferredSummary = formatDeferredGlobalPromptSummary(detection);
    if (immediateSummary || deferredSummary) {
      console.log();
      if (immediateSummary) {
        console.log(immediateSummary);
        console.log();
      }
      if (deferredSummary) {
        console.log(deferredSummary);
        console.log();
      }
    }

    const canPrompt = isInteractive();

    if (this.force) {
      const legacyUpgrade = await this.upgradeLegacyTools(
        projectPath,
        detection,
        canPrompt,
        desiredWorkflows,
        delivery
      );
      await this.performImmediateLegacyCleanup(
        projectPath,
        detection,
        legacyUpgrade.skippedSharedSkillTools
      );
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
      console.log(chalk.yellow('⚠ --force で旧ファイルを自動クリーンアップするか、対話モードで実行してください。'));
      console.log();
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
      await this.performImmediateLegacyCleanup(
        projectPath,
        detection,
        legacyUpgrade.skippedSharedSkillTools
      );
      return {
        ...legacyUpgrade,
        deferredGlobalCleanup: pickGlobalLegacyPromptFiles(
          detection,
          detection.globalSlashCommandFiles
        ),
      };
    } else {
      console.log(chalk.dim('旧ファイルのクリーンアップをスキップし、スキル更新を続行します...'));
      console.log();
      return { newlyConfiguredTools: [], workflowOverrides: {} };
    }
  }

  /**
   * Cleans approved repo-local legacy artifacts before configured tools refresh.
   */
  private async performImmediateLegacyCleanup(
    projectPath: string,
    detection: LegacyDetectionResult,
    skippedSharedSkillTools: readonly string[] = []
  ): Promise<void> {
    // Tools whose upgrade was skipped (shared root owned by another) had no
    // replacement written, so their repo-local legacy files must be preserved.
    const immediateDetection = omitToolLegacyArtifacts(
      omitGlobalLegacyPromptFiles(detection),
      skippedSharedSkillTools
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
    const availableCodexWorkflows = new Set(scanInstalledWorkflows(projectPath, ['codex']));
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

    if (blockedMatches.length > 0) {
      console.log(chalk.yellow('代替 skill がないため、保留中のグローバルプロンプトを維持しました:'));
      for (const prompt of blockedMatches) {
        console.log(chalk.dim(`  - ${prompt.toolId}: ${prompt.path}`));
      }
      console.log();
    }
  }

  /**
   * Perform cleanup of legacy artifacts.
   */
  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = ora('旧ファイルをクリーンアップ中...').start();

    const result = await cleanupLegacyArtifacts(projectPath, detection);

    spinner.succeed('旧ファイルをクリーンアップしました');

    const summary = formatCleanupSummary(result);
    if (summary) {
      console.log();
      console.log(summary);
    }

    console.log();
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
    const configuredTools = getConfiguredToolsForProfileSync(projectPath);
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
    console.log(chalk.bold('旧アーティファクトから検出したツール:'));
    for (const toolId of validUnconfiguredTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      console.log(`  • ${tool?.name || toolId}`);
    }
    console.log();

    let selectedTools: string[];

    if (this.force || !canPrompt) {
      // Non-interactive with --force: auto-select detected tools
      selectedTools = validUnconfiguredTools;
      console.log(`スキルをセットアップするツール: ${selectedTools.join(', ')}`);
    } else {
      // Interactive mode: prompt for tool selection with detected tools pre-selected
      const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

      const sortedChoices = validUnconfiguredTools.map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        return {
          name: tool?.name || toolId,
          value: toolId,
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
        console.log(chalk.dim('ツールのセットアップをスキップします。'));
        console.log();
        return { newlyConfiguredTools: [], workflowOverrides: {} };
      }
    }

    const inferredCodexWorkflows = getLegacyWorkflowIdsForTool(detection, 'codex');

    // Create skills/commands for selected tools using effective profile+delivery.
    const newlyConfigured: string[] = [];
    const skippedSharedSkillTools: string[] = [];
    const workflowOverrides: LegacyUpgradeResult['workflowOverrides'] = {};

    for (const toolId of selectedTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool || !toolSupportsSkills(tool)) continue;

      const spinner = ora(`${tool.name} をセットアップ中...`).start();

      try {
        const skillsDir = resolveToolSkillsDir(projectPath, tool);
        const skillsRoot = hasGlobalSkillTarget(tool) ? skillsDir : projectPath;
        const shouldGenerateSkills = shouldGenerateSkillsForTool(tool.value, delivery);
        const shouldGenerateCommands = shouldGenerateCommandsForTool(tool.value, delivery);
        const toolWorkflows = (
          tool.value === 'codex' && inferredCodexWorkflows.length > 0
            ? inferredCodexWorkflows
            : desiredWorkflows
        );
        if (tool.value === 'codex' && inferredCodexWorkflows.length > 0) {
          workflowOverrides[tool.value] = inferredCodexWorkflows;
        }
        const skillTemplates = getSkillTemplates(toolWorkflows);
        const commandContents = getCommandContents(toolWorkflows);

        // A shared skills root (e.g. `.agents`) already owned by another tool
        // must not be overwritten by a tool inferred from legacy artifacts: a
        // Codex install detected only from global `~/.codex/prompts` would
        // otherwise rewrite an existing vendor-neutral `agents` tree with
        // Codex-specific syntax and flip its ownership marker `agents → codex`.
        // Leave the established owner in place. (init applies the same
        // one-writer rule up front when both targets are selected.)
        //
        // Skipping here means the tool is never recorded as configured, so a
        // persistent legacy signal re-offers it on later runs. Because no
        // replacement is written, this tool is also exempted from immediate
        // legacy cleanup (see skippedSharedSkillTools) — otherwise a repo-local
        // `.codex/prompts` would be deleted with nothing put in its place. That
        // repeat is idempotent and harmless — the alternative is the silent
        // hijack this prevents.
        const sharedOwner = shouldGenerateSkills
          ? sharedSkillRootOwner(projectPath, tool.value)
          : undefined;
        if (sharedOwner) {
          const ownerName =
            AI_TOOLS.find((candidate) => candidate.value === sharedOwner)?.name ?? sharedOwner;
          spinner.info(
            `${tool.name} をスキップしました: ${tool.skillsDir}/skills は別のツール（${ownerName}）が管理しています。`
          );
          skippedSharedSkillTools.push(tool.value);
          continue;
        }

        // Create skill files when delivery includes skills
        if (shouldGenerateSkills) {
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
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
          writeSharedSkillTarget(projectPath, tool.value);
        }

        // Create commands when delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = FileSystemUtils.resolveProjectArtifactPath(
                projectPath,
                cmd.path
              );
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }
          }
        }

        spinner.succeed(`${tool.name} のセットアップが完了しました`);
        newlyConfigured.push(toolId);
        for (const migration of migrateLegacyToolDirs(
          projectPath,
          [tool.value],
          'after-generation'
        )) {
          if (hasMovableContent(migration)) {
            console.log(chalk.dim(`${describeLegacyMigration(migration)} を移行しました: ${migration.from} → ${migration.to}`));
          }
          this.reportKeptInPlace(migration);
        }
      } catch (error) {
        spinner.fail(`${tool.name} のセットアップに失敗しました`);
        console.log(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    if (newlyConfigured.length > 0) {
      console.log();
    }

    return { newlyConfiguredTools: newlyConfigured, workflowOverrides, skippedSharedSkillTools };
  }
}
