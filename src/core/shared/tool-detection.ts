/**
 * ツール検出ユーティリティ
 *
 * ツール構成とバージョン状態を検出する共通ユーティリティ。
 */

import path from 'path';
import { AI_TOOLS, agentsByProjectFolder, installerAgent, OPENSPEC_SKILL_NAMES, type AIToolOption } from '../config.js';
import { CommandAdapterRegistry } from '../command-generation/index.js';
import { hasLegacySkills, readSkillToolList, isToolListed, readListedToolsWithOwnFiles } from '../shared-skill-target.js';
import {
  resolveCommandSurfaceCapability,
} from '../command-surface.js';
import {
  getSkillCapableTools,
  resolveFormerOwnSkillsDir,
  resolveSharedSkillsDir,
  resolveSkillLinkDir,
  resolveToolSkillsDir,
  toolSupportsSkills,
  usesSharedSkills,
  type SkillCapableTool,
} from './skill-paths.js';
import { DISK_VIEW, type FileView } from '../file-view.js';
import { classifySkillLinkSpot, isCheckedOutLink } from './skill-links.js';
import { normalizeGeneratedContent } from './generated-fingerprint.js';
import { expectedSkillContents, projectSkillText } from '../skill-installer.js';
import { FileSystemUtils } from '../../utils/file-system.js';

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
   * スキルの generatedBy 行にあるバージョン、または現行の公開本文と一致する
   * 共有スキルの現在バージョン。版の根拠となるスキルがなければ null。
   * コマンドだけの構成は最新版とはみなさない。
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
 * .agents/skills/.openspec-target に列挙したツールが今も設定済みか。
 * コマンドやリンクを持つツールは own-files を記録し、それらが残る間だけ有効。
 * フォルダ削除で設定解除となる。共有フォルダを直接読むツールは一覧だけで記録する。
 */
export function isListedToolPresent(projectRoot: string, toolId: string, view: FileView = DISK_VIEW): boolean {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool || !usesSharedSkills(tool) || !isToolListed(projectRoot, toolId, view)) return false;
  if (!readListedToolsWithOwnFiles(projectRoot, view).has(toolId)) return true;
  if (toolHasAnyConfiguredCommand(projectRoot, toolId, view)) return true;
  const linkDir = resolveSkillLinkDir(projectRoot, tool) ?? resolveFormerOwnSkillsDir(projectRoot, tool);
  return (
    (linkDir !== undefined && OPENSPEC_SKILL_NAMES.some((name) => view.exists(path.join(linkDir, name, 'SKILL.md')))) ||
    hasSkillLinks(projectRoot, tool, view)
  );
}

/**
 * 専用フォルダに共有コピーへのリンクが残っているか。共有フォルダ削除や
 * gitignore によるリンク切れ、リンク非対応 Git が取得したパス入りファイルも含む。
 * いずれも設定済みとし、update でリンク先を再構築する。
 */
export function hasSkillLinks(projectRoot: string, tool: AIToolOption, view: FileView = DISK_VIEW): boolean {
  const linkDir = resolveSkillLinkDir(projectRoot, tool);
  if (!linkDir) return false;
  const sharedDir = resolveSharedSkillsDir(projectRoot);
  return OPENSPEC_SKILL_NAMES.some((name) => {
    const spot = path.join(linkDir, name);
    const target = path.join(sharedDir, name);
    const linked = view.linkTarget?.(spot);
    if (linked !== undefined) return classifySkillLinkSpot(spot, target, [], view) === 'link';
    return view.exists(spot) && !view.isDirectory(spot) && isCheckedOutLink(spot, target, view);
  });
}

/**
 * スキルの探索先を新しい構成から順に返す。共有フォルダはツールが一覧に
 * 記録されているときだけ対象とし、次に専用フォルダの旧コピーやリンク、
 * 最後に旧ルートを探す。
 */
function skillDirsForTool(projectRoot: string, tool: SkillCapableTool, view: FileView): string[] {
  const legacy = (tool.legacySkillsDirs ?? []).map((root) => path.join(projectRoot, root, 'skills'));
  if (!usesSharedSkills(tool)) return [resolveToolSkillsDir(projectRoot, tool), ...legacy];
  const own = resolveFormerOwnSkillsDir(projectRoot, tool);
  const target = resolveSkillLinkDir(projectRoot, tool);
  return [
    ...(target ? [target] : []),
    ...(isListedToolPresent(projectRoot, tool.value, view) ? [resolveSharedSkillsDir(projectRoot)] : []),
    ...(own && own !== target ? [own] : []),
    ...legacy,
  ];
}

/** ツールに存在するスキルファイルを確認する。 */
export function getToolSkillStatus(
  projectRoot: string,
  toolId: string,
  view: FileView = DISK_VIEW
): ToolSkillStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool || !toolSupportsSkills(tool)) {
    return { configured: false, fullyConfigured: false, skillCount: 0 };
  }
  const skillsDirs = skillDirsForTool(projectRoot, tool, view);
  let skillCount = 0;

  for (const skillName of SKILL_NAMES) {
    if (skillsDirs.some((skillsDir) =>
      view.exists(path.join(skillsDir, skillName, 'SKILL.md'))
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
export function toolHasAnyConfiguredCommand(
  projectPath: string,
  toolId: string,
  view: FileView = DISK_VIEW
): boolean {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return false;

  for (const commandId of COMMAND_IDS) {
    const cmdPath = adapter.getFilePath(commandId);
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
    if (view.exists(fullPath)) {
      return true;
    }
  }

  return false;
}

/**
 * 実際の内容差分ではないcheckout由来のUTF-8 BOMとCRLF改行を正規化する。
 */
export function normalizeCommandContent(content: string): string {
  return content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

/**
 * skillsDir が設定された全ツールのスキル状態を取得する。
 */
export function getToolStates(projectRoot: string): Map<string, ToolSkillStatus> {
  const states = new Map<string, ToolSkillStatus>();
  const tools = getSkillCapableTools();

  for (const tool of tools) {
    const skillStatus = getToolSkillStatus(projectRoot, tool.value);
    // スキルを書かない構成でも、一覧にあるツールは設定済みとする。
    states.set(
      tool.value,
      isListedToolPresent(projectRoot, tool.value) ? { ...skillStatus, configured: true } : skillStatus
    );
  }

  return states;
}

/**
 * スキルファイルの YAML フロントマターから generatedBy を抽出する。
 * フィールドが無い、またはファイルが無い場合は null を返す。
 */
export function extractGeneratedByVersion(
  skillFilePath: string,
  view: FileView = DISK_VIEW
): string | null {
  try {
    if (!view.exists(skillFilePath)) {
      return null;
    }

    const content = view.read(skillFilePath);

    // YAML フロントマター内の generatedBy を探す
    // ファイル形式:
    // ---
    // ...
    // metadata:
    //   author: openspec
    //   version: "1.0"
    //   generatedBy: "0.23.0"
    // ---
    // Scanned per line, and with `[ \t]` rather than `\s`, so the leading
    // whitespace run can never cross a newline. A single `m`-anchored `\s*`
    // over the whole file re-scans it from every line start, which is
    // quadratic on a whitespace-heavy SKILL.md.
    for (const line of content.split(/\r\n?|\n/)) {
      const generatedByMatch = line.match(
        /^[ \t]*generatedBy:[ \t]*["']?([^"'\n]+)["']?[ \t]*$/
      );

      if (generatedByMatch && generatedByMatch[1]) {
        return generatedByMatch[1].trim();
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 版の刻印がないプロジェクトの .agents/skills のスキルが、
 * 現行版の公開本文と一致するか判定する。
 */
function isPublishedSkillText(skillName: string, skillFile: string, version: string, view: FileView, toolId: string): boolean {
  try {
    const text = normalizeGeneratedContent(view.read(skillFile));
    const source = expectedSkillContents(version).get(skillName);
    return source !== undefined && projectSkillText(toolId, source) === text;
  } catch {
    return false;
  }
}

/**
 * スキルファイルからバージョン状態を取得する。2.0 はスキルだけを導入するため、
 * コマンドファイルの存在は最新版であることの根拠としない。
 */
export function getToolVersionStatus(
  projectRoot: string,
  toolId: string,
  currentVersion: string,
  options?: {
    workflows?: readonly string[];
    /** The tree to read; the disk unless an update is planning. */
    view?: FileView;
  }
): ToolVersionStatus {
  const view = options?.view ?? DISK_VIEW;
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

  const skillsDirs = skillDirsForTool(projectRoot, tool, view);
  const ownDir = resolveSkillLinkDir(projectRoot, tool);
  let generatedByVersion: string | null = null;
  let foundSkill = false;

  // 1. 最初に見つかったスキルファイルからバージョンを読む。
  for (const skillName of SKILL_NAMES) {
    for (const skillsDir of skillsDirs) {
      const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
      if (view.exists(skillFile)) {
        const target = skillsDir === ownDir ? toolId : 'openspec';
        generatedByVersion =
          extractGeneratedByVersion(skillFile, view) ??
          (usesSharedSkills(tool) && isPublishedSkillText(skillName, skillFile, currentVersion, view, target)
            ? currentVersion
            : null);
        foundSkill = true;
        break;
      }
    }
    if (foundSkill) break;
  }

  // 設定済みかは全スキルから判定し、バージョンは上で特定したものだけから判定する。
  const commandConfigured = toolHasAnyConfiguredCommand(projectRoot, toolId, view);
  const markerConfigured = isListedToolPresent(projectRoot, toolId, view) || hasSkillLinks(projectRoot, tool, view);
  const configured =
    getToolSkillStatus(projectRoot, toolId, view).configured || commandConfigured || markerConfigured;
  // 2. 2.0 はスキルだけを導入する。1.x のコマンドのみの構成は必ず更新対象とし、
  // スキルを導入して生成コマンドを整理する。現行スキルの隣に残る旧コマンドは
  // プロファイルの差分検出が削除を扱い、スキルを再生成する理由とはしない。
  const needsUpdate =
    configured && (generatedByVersion === null || generatedByVersion !== currentVersion);

  return {
    toolId,
    toolName: tool.name,
    configured,
    generatedByVersion,
    needsUpdate,
  };
}

/**
 * .agent/workflows の Antigravity など、旧ルートにコマンドが残っているか。
 * 旧スキルと同様、設定済みとみなして update で現行構成の生成と旧構成の整理を
 * 行えるようにする。ツール未設定とは報告しない。
 */
function hasLegacyCommands(projectRoot: string, toolId: string, view: FileView): boolean {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!tool?.skillsDir || !adapter) return false;
  return (tool.legacySkillsDirs ?? []).some((legacyRoot) =>
    COMMAND_IDS.some((commandId) => {
      const commandPath = adapter.getFilePath(commandId);
      const segments = commandPath.split(/[\\/]/);
      if (path.isAbsolute(commandPath) || segments[0] !== tool.skillsDir) return false;
      segments[0] = legacyRoot;
      const file = path.join(projectRoot, ...segments);
      try {
        FileSystemUtils.assertProjectArtifactPath(projectRoot, file);
        return view.exists(file);
      } catch {
        return false;
      }
    })
  );
}

/** プロジェクトで設定済みの全ツール（スキルまたはコマンド）を取得する。 */
export function getConfiguredTools(projectRoot: string, view: FileView = DISK_VIEW): string[] {
  const listed = readSkillToolList(projectRoot, view);
  return AI_TOOLS
    .filter((t) => {
      if (!toolSupportsSkills(t)) return false;
      const aliases = agentsByProjectFolder.get(installerAgent(t.value).projectSkillsDir);
      if (aliases && aliases.length > 1 && !listed.includes(t.value)) {
        if (aliases.some(id => listed.includes(id)) || t.value !== aliases[0]) return false;
      }
      return (
        getToolSkillStatus(projectRoot, t.value, view).configured ||
        toolHasAnyConfiguredCommand(projectRoot, t.value, view) ||
        (
          resolveCommandSurfaceCapability(t.value) === 'adapter-backed' &&
          (hasLegacySkills(projectRoot, t, view) || hasLegacyCommands(projectRoot, t.value, view))
        ) ||
        isListedToolPresent(projectRoot, t.value, view) ||
        hasSkillLinks(projectRoot, t, view)
      );
    })
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
