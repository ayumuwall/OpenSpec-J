import os from 'node:os';
import path from 'node:path';

import { AI_TOOLS, SKILL_LINKED_TOOL_IDS, type AIToolOption } from '../config.js';

export type SkillCapableTool = AIToolOption & (
  | { skillsDir: string }
  | { globalSkillsDir: string }
);

export function toolSupportsSkills(tool: AIToolOption): tool is SkillCapableTool {
  return Boolean(tool.skillsDir || tool.globalSkillsDir);
}

export function getSkillCapableTools(): SkillCapableTool[] {
  return AI_TOOLS.filter(toolSupportsSkills);
}

export function hasGlobalSkillTarget(tool: AIToolOption): boolean {
  return Boolean(tool.globalSkillsDir);
}

export function resolveToolSkillsDir(
  projectRoot: string,
  tool: SkillCapableTool,
  options: { homeDir?: string } = {}
): string {
  if (tool.globalSkillsDir) {
    const homeDir = options.homeDir ?? process.env.USERPROFILE ?? process.env.HOME ?? os.homedir();
    return path.join(homeDir, tool.globalSkillsDir, 'skills');
  }

  // プロジェクト内のスキルは全ツールで共有する。専用フォルダに保持するツール
  // （usesSharedSkills 参照）だけは自身の skillsDir に書き込む。
  if (usesSharedSkills(tool)) {
    return resolveSharedSkillsDir(projectRoot);
  }

  if (tool.skillsDir) {
    return path.join(projectRoot, tool.skillsDir, 'skills');
  }

  throw new Error(`ツール '${tool.value}' はスキル生成に対応していません。`);
}

/** 全ツールのプロジェクトスキルを書き込む共有ルート。 */
export const SHARED_SKILLS_ROOT = '.agents';

/** プロジェクトスキルを .agents/skills/ で共有するツールか。 */
export function usesSharedSkills(tool: AIToolOption): boolean {
  return Boolean(tool.skillsDir) && !tool.globalSkillsDir;
}

/** 共有スキルフォルダの絶対パス。 */
export function resolveSharedSkillsDir(projectRoot: string): string {
  return path.join(projectRoot, SHARED_SKILLS_ROOT, 'skills');
}

/**
 * リンクを作成するツールの専用 skills/ フォルダ。
 * ツール自身が共有フォルダを読む場合は undefined。
 */
export function resolveSkillLinkDir(projectRoot: string, tool: AIToolOption): string | undefined {
  if (!usesSharedSkills(tool) || !SKILL_LINKED_TOOL_IDS.has(tool.value)) return undefined;
  if (tool.skillsDir === SHARED_SKILLS_ROOT) return undefined;
  return path.join(projectRoot, tool.skillsDir!, 'skills');
}

/**
 * 旧版が共有フォルダ以外に書き込んでいた <skillsDir>/skills/。
 * すでに共有フォルダを使っていたツールでは undefined。
 */
export function resolveFormerOwnSkillsDir(projectRoot: string, tool: AIToolOption): string | undefined {
  if (!usesSharedSkills(tool) || tool.skillsDir === SHARED_SKILLS_ROOT) return undefined;
  return path.join(projectRoot, tool.skillsDir!, 'skills');
}
