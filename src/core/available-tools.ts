/**
 * Available Tools Detection
 *
 * Detects which AI tools are available in a project by scanning
 * for their configuration directories.
 */

import path from 'path';
import { AI_TOOLS, type AIToolOption } from './config.js';
import { reconcileSharedSkillTargets } from './shared-skill-target.js';
import { SKILL_NAMES } from './shared/tool-detection.js';
import { resolveToolSkillsDir, toolSupportsSkills } from './shared/skill-paths.js';
import { DISK_VIEW, type FileView } from './file-view.js';

/**
 * Scans the project path for AI tool configuration directories and returns
 * the tools that are present.
 *
 * `detectionPaths` が設定されたツールでは、指定されたパス（ファイルまたは
 * ディレクトリ）を確認する。それ以外では、プロジェクトの `skillsDir` を確認する。
 * グローバルスキルが対象なら、ユーザーのホームディレクトリにある管理対象の
 * スキルファイルを確認する。
 */
export function getAvailableTools(projectPath: string, view: FileView = DISK_VIEW): AIToolOption[] {
  const available = AI_TOOLS.filter((tool) => {
    if (!toolSupportsSkills(tool)) return false;

    if (tool.globalSkillsDir) {
      const skillsDir = resolveToolSkillsDir(projectPath, tool);
      return SKILL_NAMES.some((skillName) =>
        view.exists(path.join(skillsDir, skillName, 'SKILL.md'))
      );
    }

    if (!tool.skillsDir) return false;

    if (tool.detectionPaths && tool.detectionPaths.length > 0) {
      // 検出パスはファイルとディレクトリの両方を許すため、存在だけを確認する
      return tool.detectionPaths.some((p) => view.exists(path.join(projectPath, p)));
    }

    return view.isDirectory(path.join(projectPath, tool.skillsDir));
  });
  const activeProjectTools = new Set(
    reconcileSharedSkillTargets(
      projectPath,
      available.filter((tool) => tool.skillsDir),
      view
    ).map((tool) => tool.value)
  );
  const hasIndependentDetectionPath = (tool: AIToolOption): boolean =>
    (tool.detectionPaths ?? []).some((detectionPath) => {
      // スキルルートは、この後も管理対象コンテンツの照合を通す。
      // ディレクトリが存在するだけでは、ツールを独立に検出した根拠にはしない。
      if (detectionPath.endsWith('/skills')) return false;
      return view.exists(path.join(projectPath, detectionPath));
    });
  return available.filter(
    (tool) =>
      tool.globalSkillsDir ||
      hasIndependentDetectionPath(tool) ||
      activeProjectTools.has(tool.value)
  );
}
