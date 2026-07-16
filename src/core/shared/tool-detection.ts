/**
 * ツール検出ユーティリティ
 *
 * ツール構成とバージョン状態を検出する共通ユーティリティ。
 */

import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS } from '../config.js';

/**
 * openspec init で作成されるスキルディレクトリ名。
 */
export const SKILL_NAMES = [
  'openspec-explore',
  'openspec-new-change',
  'openspec-continue-change',
  'openspec-apply-change',
  'openspec-update-change',
  'openspec-ff-change',
  'openspec-sync-specs',
  'openspec-archive-change',
  'openspec-bulk-archive-change',
  'openspec-verify-change',
  'openspec-onboard',
  'openspec-propose',
] as const;

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
  /** スキルが設定済みか */
  configured: boolean;
  /** スキルファイル内の generatedBy バージョン（未検出なら null） */
  generatedByVersion: string | null;
  /** 更新が必要か（バージョン不一致または未検出） */
  needsUpdate: boolean;
}

/**
 * skillsDir が設定されたツール一覧を取得する。
 */
export function getToolsWithSkillsDir(): string[] {
  return AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value);
}

/**
 * ツールに存在するスキルファイルを確認する。
 */
export function getToolSkillStatus(projectRoot: string, toolId: string): ToolSkillStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) {
    return { configured: false, fullyConfigured: false, skillCount: 0 };
  }

  const skillsDir = path.join(projectRoot, tool.skillsDir, 'skills');
  let skillCount = 0;

  for (const skillName of SKILL_NAMES) {
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
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
 * skillsDir がある全ツールのスキル状態を取得する。
 */
export function getToolStates(projectRoot: string): Map<string, ToolSkillStatus> {
  const states = new Map<string, ToolSkillStatus>();
  const toolIds = AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value);

  for (const toolId of toolIds) {
    states.set(toolId, getToolSkillStatus(projectRoot, toolId));
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
 * 最初に見つかったスキルファイルからツールのバージョン状態を取得する。
 */
export function getToolVersionStatus(
  projectRoot: string,
  toolId: string,
  currentVersion: string
): ToolVersionStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) {
    return {
      toolId,
      toolName: toolId,
      configured: false,
      generatedByVersion: null,
      needsUpdate: false,
    };
  }

  const skillsDir = path.join(projectRoot, tool.skillsDir, 'skills');
  let generatedByVersion: string | null = null;

  // 存在する最初のスキルファイルからバージョンを読み取る
  for (const skillName of SKILL_NAMES) {
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      generatedByVersion = extractGeneratedByVersion(skillFile);
      break;
    }
  }

  const configured = getToolSkillStatus(projectRoot, toolId).configured;
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
 * プロジェクト内で設定済みのツールを取得する。
 */
export function getConfiguredTools(projectRoot: string): string[] {
  return AI_TOOLS
    .filter((t) => t.skillsDir && getToolSkillStatus(projectRoot, t.value).configured)
    .map((t) => t.value);
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
