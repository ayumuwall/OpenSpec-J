/**
 * Available Tools Detection
 *
 * Detects which AI tools are available in a project by scanning
 * for their configuration directories.
 */

import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS, type AIToolOption } from './config.js';
import { reconcileSharedSkillTargets } from './shared-skill-target.js';
import { SKILL_NAMES } from './shared/tool-detection.js';
import { resolveToolSkillsDir, toolSupportsSkills } from './shared/skill-paths.js';

/**
 * Scans the project path for AI tool configuration directories and returns
 * the tools that are present.
 *
 * `detectionPaths` が設定されたツールでは、指定されたパス（ファイルまたは
 * ディレクトリ）を確認する。それ以外では、プロジェクトの `skillsDir` を確認する。
 * グローバルスキルが対象なら、ユーザーのホームディレクトリにある管理対象の
 * スキルファイルを確認する。
 */
export function getAvailableTools(projectPath: string): AIToolOption[] {
  const available = AI_TOOLS.filter((tool) => {
    if (!toolSupportsSkills(tool)) return false;

    if (tool.globalSkillsDir) {
      const skillsDir = resolveToolSkillsDir(projectPath, tool);
      return SKILL_NAMES.some((skillName) =>
        fs.existsSync(path.join(skillsDir, skillName, 'SKILL.md'))
      );
    }

    if (!tool.skillsDir) return false;

    if (tool.detectionPaths && tool.detectionPaths.length > 0) {
      // detectionPaths はファイルとディレクトリの両方を許すため、isDirectory() は呼ばない
      return tool.detectionPaths.some((p) => {
        try {
          fs.statSync(path.join(projectPath, p));
          return true;
        } catch {
          return false;
        }
      });
    }

    const dirPath = path.join(projectPath, tool.skillsDir);
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  });
  const activeProjectTools = new Set(
    reconcileSharedSkillTargets(
      projectPath,
      available.filter((tool) => tool.skillsDir)
    ).map((tool) => tool.value)
  );
  const hasIndependentDetectionPath = (tool: AIToolOption): boolean =>
    (tool.detectionPaths ?? []).some((detectionPath) => {
      // スキルルートは、この後も管理対象コンテンツの照合を通す。
      // ディレクトリが存在するだけでは、ツールを独立に検出した根拠にはしない。
      if (detectionPath.endsWith('/skills')) return false;
      try {
        fs.statSync(path.join(projectPath, detectionPath));
        return true;
      } catch {
        return false;
      }
    });
  return available.filter(
    (tool) =>
      tool.globalSkillsDir ||
      hasIndependentDetectionPath(tool) ||
      activeProjectTools.has(tool.value)
  );
}
