/**
 * Available Tools Detection
 *
 * Detects which AI tools are available in a project by scanning
 * for their configuration directories.
 */

import path from 'path';
import { AI_TOOLS, type AIToolOption } from './config.js';
import { readSkillToolList } from './shared-skill-target.js';
import { SKILL_NAMES, isListedToolPresent } from './shared/tool-detection.js';
import { SHARED_SKILLS_ROOT, resolveToolSkillsDir, toolSupportsSkills, usesSharedSkills } from './shared/skill-paths.js';
import { DISK_VIEW, type FileView } from './file-view.js';

/**
 * Scans the project path for AI tool configuration directories and returns
 * the tools that are present.
 *
 * `detectionPaths` が設定されたツールでは、指定されたパス（ファイルまたは
 * ディレクトリ）を確認する。それ以外では、プロジェクトの `skillsDir` を確認する。
 * グローバルスキルが対象なら、ユーザーのホームディレクトリにある管理対象の
 * スキルファイルを確認する。
 *
 * すべてのスキルが `.agents/skills/` にあるため、`.agents` の内容だけでは
 * Amp、Codex、Zed、GSD、agents の検出根拠にならない。設定済み一覧にあるか、
 * `.amp`、`.codex/skills`、`.agents/workflows` など固有のパスが必要。
 */
export function getAvailableTools(projectPath: string, view: FileView = DISK_VIEW): AIToolOption[] {
  const isSharedPath = (p: string) => p === SHARED_SKILLS_ROOT || p.startsWith(`${SHARED_SKILLS_ROOT}/skills`);
  const listed = readSkillToolList(projectPath, view);
  return AI_TOOLS.filter((tool) => {
    if (!toolSupportsSkills(tool)) return false;

    if (tool.globalSkillsDir) {
      const skillsDir = resolveToolSkillsDir(projectPath, tool);
      return SKILL_NAMES.some((skillName) =>
        view.exists(path.join(skillsDir, skillName, 'SKILL.md'))
      );
    }

    if (!tool.skillsDir) return false;

    const hasOwnPath = tool.detectionPaths && tool.detectionPaths.length > 0
      // 検出パスはファイルとディレクトリの両方を許すため、存在だけを確認する
      ? tool.detectionPaths
        .filter((p) => tool.skillsDir !== SHARED_SKILLS_ROOT || !isSharedPath(p))
        .some((p) => {
          if (!view.exists(path.join(projectPath, p))) return false;
          // 設定済み一覧から外れているツールの固有フォルダは、
          // OpenSpec スキルがある場合だけ検出する。独自スキルは根拠にしない。
          if (p.endsWith('/skills') && listed.length > 0 && !listed.includes(tool.value)) {
            return SKILL_NAMES.some((skillName) => view.exists(path.join(projectPath, p, skillName, 'SKILL.md')));
          }
          return true;
        })
      : tool.skillsDir !== SHARED_SKILLS_ROOT && view.isDirectory(path.join(projectPath, tool.skillsDir));
    // 設定済み一覧にあれば、固有フォルダがないツールも検出する。
    // 例: Cursor は `.agents/skills` を読み、`.cursor` を必要としない。
    return hasOwnPath || (usesSharedSkills(tool) && listed.includes(tool.value) && isListedToolPresent(projectPath, tool.value, view));
  });
}
