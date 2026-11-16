/**
 * 対応終了ツール。init の選択肢、セットアップ、設定済み件数から除外する。
 * プロジェクト内の旧生成物は通常どおり整理し、未編集なら削除、編集済みなら保持して報告する。
 */
import path from 'path';
import { OPENSPEC_SKILL_NAMES, RETIRED_TOOLS, type RetiredTool } from './config.js';
import { reconcileCommandFiles } from './shared/command-reconcile.js';
import { classifySkillFile } from './shared/skill-links.js';
import { reachesWithoutLink } from './legacy-cleanup.js';
import { pruneEmptyParents } from './released-output-sweep.js';
import { ALL_WORKFLOWS } from './profiles.js';
import type { FileView } from './file-view.js';

export { RETIRED_TOOLS, findRetiredTool, formatRetiredToolError, type RetiredTool } from './config.js';

export interface RetiredToolCleanup {
  tool: RetiredTool;
  /** 削除したプロジェクト相対ファイル（dry-run では削除予定）。 */
  removed: string[];
  /** 編集済み、または確認できないため保持したプロジェクト相対ファイル。 */
  kept: string[];
}

export interface RetiredToolIo {
  view: FileView;
  /** 1ファイルを削除する。update --dry-run では記録用の処理を渡す。 */
  remove(fullPath: string): Promise<void>;
  /** 残った空フォルダを削除するか。dry-run では false。 */
  prune: boolean;
}

/**
 * プロジェクトに残る対応終了ツールの旧生成コマンドとスキルコピーを削除する。
 * 過去の公開版の生成内容と一致するものだけを対象とし、それ以外の独自ファイルは保持する。
 * リンク経由では読み取り・削除を行わない。
 */
export async function cleanUpRetiredTools(
  projectPath: string,
  io: RetiredToolIo
): Promise<RetiredToolCleanup[]> {
  const results: RetiredToolCleanup[] = [];
  for (const tool of RETIRED_TOOLS) {
    const folder = path.join(projectPath, tool.folder);
    if (!io.view.exists(folder) || !(await reachesWithoutLink(projectPath, tool.folder))) continue;

    const commands = await reconcileCommandFiles(projectPath, tool.id, ALL_WORKFLOWS, {
      view: io.view,
      remove: io.remove,
    });
    const removed = [...commands.removed];
    const kept = [...commands.kept, ...commands.unchecked];

    for (const skillName of OPENSPEC_SKILL_NAMES) {
      const rel = `${tool.folder}/skills/${skillName}`;
      const skillDir = path.join(projectPath, ...rel.split('/'));
      if (!io.view.exists(skillDir)) continue;
      if (!(await reachesWithoutLink(projectPath, rel))) {
        kept.push(rel);
        continue;
      }
      // 対応終了ツールには現行コピーがないため、公開版の生成出力だけを未編集とみなす。
      const spot = classifySkillFile(skillDir, [], io.view);
      if (spot === 'released') {
        await io.remove(path.join(skillDir, 'SKILL.md'));
        removed.push(`${rel}/SKILL.md`);
      } else if (spot !== 'missing') {
        kept.push(`${rel}/SKILL.md`);
      }
    }

    if (removed.length === 0 && kept.length === 0) continue;
    if (io.prune) {
      await pruneEmptyParents(projectPath, removed.map((rel) => rel.split(path.sep).join('/')));
    }
    results.push({ tool, removed, kept });
  }
  return results;
}

/** 対応終了ツールの整理後、init と update が表示する内容。 */
export function formatRetiredToolCleanup(result: RetiredToolCleanup, successorSetUp = false): string[] {
  const { tool, removed, kept } = result;
  // 移行先が設定済み、または設定中なら、追加設定を案内しない。
  const advice = successorSetUp
    ? ''
    : `代わりに ${tool.successorName} を設定してください: openspec init --tools ${tool.successor}`;
  const lines = [`${tool.name} の対応は終了しました。${tool.reason}です。${advice}`];
  if (removed.length > 0) {
    lines.push(
      `  ${tool.folder}/ から OpenSpec のファイル${removed.length}件を削除しました。`
    );
  }
  if (kept.length > 0) {
    lines.push(
      `  ${tool.folder}/ 内の OpenSpec の生成内容と異なるファイル${kept.length}件を保持しました（編集済みの可能性があります）。不要になったら削除してください:`,
      ...kept.map((rel) => `    ${rel}`)
    );
  }
  return lines;
}
