import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS } from './config.js';
import type { Delivery } from './global-config.js';
import { SKILL_WORKFLOWS, withRouter } from './profiles.js';
import { CommandAdapterRegistry } from './command-generation/index.js';
import { getConfiguredTools } from './shared/index.js';
import { classifyCommandFiles } from './shared/command-reconcile.js';
import { shouldReconcileCommandFilesForTool } from './command-surface.js';
import { isToolListed } from './shared-skill-target.js';
import { ownSkillFolderNeedsWork } from './shared/shared-skill-install.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { DISK_VIEW, type FileView } from './file-view.js';
import { isRedundantLegacyCopy } from './shared/skill-content-equivalence.js';
import {
  resolveToolSkillsDir,
  toolSupportsSkills,
  usesSharedSkills,
} from './shared/skill-paths.js';

type WorkflowId = (typeof SKILL_WORKFLOWS)[number];

/**
 * Maps workflow IDs to their skill directory names.
 */
export const WORKFLOW_TO_SKILL_DIR: Record<WorkflowId, string> = {
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
  'router': 'openspec',
};

/** ワークフローのセットに必要なスキル。セットが空でなければルーターも含める。 */
function toKnownWorkflows(workflows: readonly string[]): WorkflowId[] {
  return withRouter(workflows).filter(
    (workflow): workflow is WorkflowId =>
      (SKILL_WORKFLOWS as readonly string[]).includes(workflow)
  );
}

/**
 * Returns tools that are configured via either skills or commands.
 */
export function getConfiguredToolsForProfileSync(
  projectPath: string,
  view: FileView = DISK_VIEW
): string[] {
  return getConfiguredTools(projectPath, view);
}

/**
 * Detects if a single tool has profile/delivery drift against the desired state.
 *
 * This function covers:
 * - required artifacts missing for selected workflows
 * - artifacts that should not exist for the selected delivery mode
 * - artifacts for workflows that were deselected from the current profile
 */
export function hasToolProfileOrDeliveryDrift(
  projectPath: string,
  toolId: string,
  desiredWorkflows: readonly string[],
  _delivery: Delivery,
  view: FileView = DISK_VIEW
): boolean {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool || !toolSupportsSkills(tool)) return false;

  const knownDesiredWorkflows = toKnownWorkflows(desiredWorkflows);
  const desiredWorkflowSet = new Set<WorkflowId>(knownDesiredWorkflows);
  const skillsDir = resolveToolSkillsDir(projectPath, tool);
  const adapter = CommandAdapterRegistry.get(toolId);

  const shared = usesSharedSkills(tool);
  const listed = shared && isToolListed(projectPath, toolId, view);
  for (const root of tool.legacySkillsDirs ?? []) {
    for (const workflow of knownDesiredWorkflows) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const legacySkill = path.join(projectPath, root, 'skills', dirName, 'SKILL.md');
      if (!view.exists(legacySkill)) continue;

      const currentSkill = path.join(skillsDir, dirName, 'SKILL.md');
      if (!view.exists(currentSkill) || (shared && !listed)) {
        return true;
      }
      try {
        if (
          FileSystemUtils.canonicalizeExistingPath(legacySkill) ===
          FileSystemUtils.canonicalizeExistingPath(currentSkill)
        ) {
          continue;
        }
        // 現行内容と一致するコピー、または旧公開版の未編集出力は安全に削除できる。
        // 編集済みは保持し、実行のたびに更新対象として扱わない。
        if (isRedundantLegacyCopy(view.read(legacySkill), view.read(currentSkill), true)) {
          return true;
        }
      } catch {
        return true;
      }
    }
  }

  if (shared) {
    // 共有コピーは全設定済みツールに共通なので、
    // ここでは一覧への登録と固有スキルフォルダだけを確認する。
    if (!listed) return true;
    const linked = new Set<string>(
      knownDesiredWorkflows.map((workflow) => WORKFLOW_TO_SKILL_DIR[workflow])
    );
    if (ownSkillFolderNeedsWork(projectPath, tool, linked, view)) return true;
  }

  for (const workflow of knownDesiredWorkflows) {
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
    const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
    if (!view.exists(skillFile)) {
      return true;
    }
  }

  // プロファイルで選択を解除したワークフローがあれば同期する。
  for (const workflow of SKILL_WORKFLOWS) {
    if (desiredWorkflowSet.has(workflow)) continue;
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
    const skillDir = path.join(skillsDir, dirName);
    if (!view.exists(path.join(skillDir, 'SKILL.md'))) continue;
    return true;
  }

  if (shouldReconcileCommandFilesForTool(toolId) && adapter) {
    // 生成出力だけを同期の必要な差分とする。編集済み・旧版・読めない項目は
    // 意図的に保持するため、それらを数えて毎回同期しないようにする。
    if (classifyCommandFiles(projectPath, toolId, knownDesiredWorkflows, view).generated.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Returns configured tools that currently need a profile/delivery sync.
 */
export function getToolsNeedingProfileSync(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery,
  configuredTools?: readonly string[],
  view: FileView = DISK_VIEW
): string[] {
  const tools = configuredTools
    ? [...new Set(configuredTools)]
    : getConfiguredToolsForProfileSync(projectPath, view);
  return tools.filter((toolId) =>
    hasToolProfileOrDeliveryDrift(projectPath, toolId, desiredWorkflows, delivery, view)
  );
}

function getInstalledWorkflowsForTool(projectPath: string, toolId: string): WorkflowId[] {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool || !toolSupportsSkills(tool)) return [];

  const installed = new Set<WorkflowId>();
  const skillsDir = resolveToolSkillsDir(projectPath, tool);
  for (const workflow of SKILL_WORKFLOWS) {
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
    const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      installed.add(workflow);
    }
  }

  return [...installed];
}

/**
 * Detects whether the current project has any profile/delivery drift.
 */
export function hasProjectConfigDrift(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const configuredTools = getConfiguredToolsForProfileSync(projectPath);
  if (getToolsNeedingProfileSync(projectPath, desiredWorkflows, delivery, configuredTools).length > 0) {
    return true;
  }

  const desiredSet = new Set(toKnownWorkflows(desiredWorkflows));

  for (const toolId of configuredTools) {
    const installed = getInstalledWorkflowsForTool(projectPath, toolId);
    if (installed.some((workflow) => !desiredSet.has(workflow))) {
      return true;
    }
  }

  return false;
}
