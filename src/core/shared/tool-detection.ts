/**
 * ツール検出ユーティリティ
 *
 * ツール構成とバージョン状態を検出する共通ユーティリティ。
 */

import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS, OPENSPEC_SKILL_NAMES } from '../config.js';
import { CommandAdapterRegistry, generateCommands } from '../command-generation/index.js';
import { getCommandContents } from './skill-generation.js';
import { getGlobalConfig } from '../global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS } from '../profiles.js';
import {
  isSharedSkillTargetActive,
  hasLegacySkills,
  readSharedSkillTarget,
  reconcileSharedSkillTargets,
} from '../shared-skill-target.js';
import {
  shouldGenerateCommandsForTool,
  shouldGenerateSkillsForTool,
  resolveCommandSurfaceCapability,
} from '../command-surface.js';
import {
  getSkillCapableTools,
  resolveToolSkillsDir,
  toolSupportsSkills,
} from './skill-paths.js';

/**
 * openspec init で作成されるスキルディレクトリ名。
 */
export const SKILL_NAMES = OPENSPEC_SKILL_NAMES;

export type SkillName = (typeof SKILL_NAMES)[number];

/**
 * openspec init で作成されるコマンドテンプレートの ID。
 */
export const COMMAND_IDS = [
  'explore',
  'new',
  'continue',
  'apply',
  'update',
  'ff',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
  'propose',
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];

/**
 * ツールのスキル設定状態。
 */
export interface ToolSkillStatus {
  /** スキルが設定済みか */
  configured: boolean;
  /** すべてのスキルが設定済みか */
  fullyConfigured: boolean;
  /** 現在設定済みのスキル数 */
  skillCount: number;
}

/**
 * ツールのスキルに関するバージョン情報。
 */
export interface ToolVersionStatus {
  /** ツール ID */
  toolId: string;
  /** ツール表示名 */
  toolName: string;
  /** スキルまたはコマンドが設定済みか */
  configured: boolean;
  /**
   * The generatedBy version recorded in the tool's skill files. For a tool that
   * has commands but no skills, the current version when the command files match
   * what would be generated now. Null when neither says the files are current.
   */
  generatedByVersion: string | null;
  /** 更新が必要か（バージョン不一致または未検出） */
  needsUpdate: boolean;
}

/**
 * skillsDir が設定されたツール一覧を取得する。
 */
export function getToolsWithSkillsDir(): string[] {
  return getSkillCapableTools().map((tool) => tool.value);
}

/**
 * ツールに存在するスキルファイルを確認する。
 */
export function getToolSkillStatus(projectRoot: string, toolId: string): ToolSkillStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool || !toolSupportsSkills(tool)) {
    return { configured: false, fullyConfigured: false, skillCount: 0 };
  }
  if (tool.skillsDir && !isSharedSkillTargetActive(projectRoot, toolId)) {
    return { configured: false, fullyConfigured: false, skillCount: 0 };
  }

  const skillsDirs = [
    resolveToolSkillsDir(projectRoot, tool),
    ...(tool.legacySkillsDirs ?? []).map((root) =>
      path.join(projectRoot, root, 'skills')
    ),
  ];
  let skillCount = 0;

  for (const skillName of SKILL_NAMES) {
    if (skillsDirs.some((skillsDir) =>
      fs.existsSync(path.join(skillsDir, skillName, 'SKILL.md'))
    )) {
      skillCount++;
    }
  }

  return {
    configured: skillCount > 0,
    fullyConfigured: skillCount === SKILL_NAMES.length,
    skillCount,
  };
}

/**
 * ツールに生成済みOpenSpecコマンドファイルが1つ以上あるか確認する。
 */
export function toolHasAnyConfiguredCommand(projectPath: string, toolId: string): boolean {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return false;

  for (const commandId of COMMAND_IDS) {
    const cmdPath = adapter.getFilePath(commandId);
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
    if (fs.existsSync(fullPath)) {
      return true;
    }
  }

  return false;
}

/**
 * 実際の内容差分ではないcheckout由来のUTF-8 BOMとCRLF改行を正規化する。
 */
function normalizeCommandContent(content: string): string {
  return content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

/**
 * ディスク上のコマンドファイルが現在の生成内容と一致するか確認する。
 *
 * Command files carry no version stamp, so content equality is the only available
 * "is this current?" signal for a commands-only install.
 */
export function areCommandFilesUpToDate(
  projectRoot: string,
  toolId: string,
  options?: {
    workflows?: readonly string[];
  }
): boolean {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return false;

  let workflows: readonly string[];
  if (options?.workflows) {
    workflows = options.workflows;
  } else {
    try {
      const globalCfg = getGlobalConfig();
      const profile = globalCfg.profile ?? 'core';
      workflows = getProfileWorkflows(profile, globalCfg.workflows);
    } catch {
      workflows = ALL_WORKFLOWS;
    }
  }

  const knownWorkflows = workflows.filter((w): w is (typeof ALL_WORKFLOWS)[number] =>
    (ALL_WORKFLOWS as readonly string[]).includes(w)
  );

  const commandContents = getCommandContents(knownWorkflows);
  const generatedCommands = generateCommands(commandContents, adapter);

  if (generatedCommands.length === 0) {
    return false;
  }

  for (const cmd of generatedCommands) {
    const cmdPath = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectRoot, cmd.path);
    if (!fs.existsSync(cmdPath)) {
      return false;
    }
    try {
      const existingContent = fs.readFileSync(cmdPath, 'utf-8');
      if (normalizeCommandContent(existingContent) !== normalizeCommandContent(cmd.fileContent)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Also check no extra command files exist for deselected workflows
  const desiredWorkflowSet = new Set(knownWorkflows);
  for (const workflow of ALL_WORKFLOWS) {
    if (desiredWorkflowSet.has(workflow)) continue;
    const cmdPath = adapter.getFilePath(workflow);
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectRoot, cmdPath);
    if (fs.existsSync(fullPath)) {
      return false;
    }
  }

  return true;
}

/**
 * skillsDirが設定された全ツールのスキル状態を取得する。
 */
export function getToolStates(projectRoot: string): Map<string, ToolSkillStatus> {
  const states = new Map<string, ToolSkillStatus>();
  const tools = getSkillCapableTools();

  for (const tool of tools) {
    const skillStatus = getToolSkillStatus(projectRoot, tool.value);
    const markerConfigured =
      Boolean(tool.skillsDir) &&
      readSharedSkillTarget(projectRoot, tool.skillsDir!) === tool.value;
    states.set(
      tool.value,
      markerConfigured
        ? { ...skillStatus, configured: true }
        : skillStatus
    );
  }

  const configuredTools = tools.filter(
    (tool) => tool.skillsDir && states.get(tool.value)?.configured
  );
  const activeSharedTargets = new Set(
    reconcileSharedSkillTargets(projectRoot, configuredTools).map((tool) => tool.value)
  );
  for (const tool of configuredTools) {
    if (!activeSharedTargets.has(tool.value)) {
      states.set(tool.value, { configured: false, fullyConfigured: false, skillCount: 0 });
    }
  }

  return states;
}

/**
 * スキルファイルの YAML フロントマターから generatedBy を抽出する。
 * フィールドが無い、またはファイルが無い場合は null を返す。
 */
export function extractGeneratedByVersion(skillFilePath: string): string | null {
  try {
    if (!fs.existsSync(skillFilePath)) {
      return null;
    }

    const content = fs.readFileSync(skillFilePath, 'utf-8');

    // YAML フロントマター内の generatedBy を探す
    // ファイル形式:
    // ---
    // ...
    // metadata:
    //   author: openspec
    //   version: "1.0"
    //   generatedBy: "0.23.0"
    // ---
    const generatedByMatch = content.match(/^\s*generatedBy:\s*["']?([^"'\n]+)["']?\s*$/m);

    if (generatedByMatch && generatedByMatch[1]) {
      return generatedByMatch[1].trim();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * スキルファイルからツールのバージョン状態を取得する。スキルがなくコマンドだけの
 * インストールでは、コマンド内容のフィンガープリントへフォールバックする。
 */
export function getToolVersionStatus(
  projectRoot: string,
  toolId: string,
  currentVersion: string,
  options?: {
    workflows?: readonly string[];
  }
): ToolVersionStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool || !toolSupportsSkills(tool)) {
    return {
      toolId,
      toolName: toolId,
      configured: false,
      generatedByVersion: null,
      needsUpdate: false,
    };
  }

  const skillsDirs = [
    resolveToolSkillsDir(projectRoot, tool),
    ...(tool.legacySkillsDirs ?? []).map((root) =>
      path.join(projectRoot, root, 'skills')
    ),
  ];
  let generatedByVersion: string | null = null;
  let foundSkill = false;

  // 1. Find the first skill file that exists and read its version
  for (const skillName of SKILL_NAMES) {
    for (const skillsDir of skillsDirs) {
      const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        generatedByVersion = extractGeneratedByVersion(skillFile);
        foundSkill = true;
        break;
      }
    }
    if (foundSkill) break;
  }

  const skillConfigured = getToolSkillStatus(projectRoot, toolId).configured;
  const commandConfigured = toolHasAnyConfiguredCommand(projectRoot, toolId);
  const markerConfigured =
    Boolean(tool.skillsDir) &&
    readSharedSkillTarget(projectRoot, tool.skillsDir!) === toolId;
  const configured = skillConfigured || commandConfigured || markerConfigured;

  // 2. Commands-only installs have no skill file to read a version from, so fall
  //    back to comparing the generated command content. Deliberately skipped when
  //    skill files exist: an unreadable version there must still force a rewrite.
  if (!skillConfigured && commandConfigured && areCommandFilesUpToDate(projectRoot, toolId, options)) {
    generatedByVersion = currentVersion;
  }
  if (!skillConfigured && !commandConfigured && markerConfigured) {
    const delivery = getGlobalConfig().delivery ?? 'both';
    if (
      !shouldGenerateSkillsForTool(toolId, delivery) &&
      !shouldGenerateCommandsForTool(toolId, delivery)
    ) {
      generatedByVersion = currentVersion;
    }
  }

  const needsUpdate = configured && (generatedByVersion === null || generatedByVersion !== currentVersion);

  return {
    toolId,
    toolName: tool.name,
    configured,
    generatedByVersion,
    needsUpdate,
  };
}

/**
 * プロジェクトで設定済みの全ツール（スキルまたはコマンド）を取得する。
 */
export function getConfiguredTools(projectRoot: string): string[] {
  const configured = AI_TOOLS
    .filter((t) => {
      if (!toolSupportsSkills(t)) return false;
      return (
        getToolSkillStatus(projectRoot, t.value).configured ||
        toolHasAnyConfiguredCommand(projectRoot, t.value) ||
        (
          resolveCommandSurfaceCapability(t.value) === 'adapter-backed' &&
          hasLegacySkills(projectRoot, t)
        ) ||
        (Boolean(t.skillsDir) &&
          readSharedSkillTarget(projectRoot, t.skillsDir!) === t.value)
      );
  });
  const activeProjectTools = new Set(
    reconcileSharedSkillTargets(
      projectRoot,
      configured.filter((tool) => tool.skillsDir)
    ).map((tool) => tool.value)
  );
  return configured
    .filter(
      (tool) =>
        tool.globalSkillsDir ||
        toolHasAnyConfiguredCommand(projectRoot, tool.value) ||
        (
          resolveCommandSurfaceCapability(tool.value) === 'adapter-backed' &&
          hasLegacySkills(projectRoot, tool)
        ) ||
        activeProjectTools.has(tool.value)
    )
    .map((tool) => tool.value);
}

/**
 * 設定済みツールのバージョン状態を取得する。
 */
export function getAllToolVersionStatus(
  projectRoot: string,
  currentVersion: string
): ToolVersionStatus[] {
  const configuredTools = getConfiguredTools(projectRoot);
  return configuredTools.map((toolId) =>
    getToolVersionStatus(projectRoot, toolId, currentVersion)
  );
}
