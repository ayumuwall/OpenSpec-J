/**
 * コマンドファイルの照合。2.0 はスキルだけを導入するため、
 * 旧版の生成コマンドを削除し、編集済みのものを保持する。
 */

import * as fs from 'fs';
import path from 'path';
import { FileSystemUtils } from '../../utils/file-system.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from '../command-generation/index.js';
import type { GeneratedCommand } from '../command-generation/types.js';
import { ALL_WORKFLOWS } from '../profiles.js';
import { getCommandContents } from './skill-generation.js';
import { normalizeCommandContent } from './tool-detection.js';
import { isReleasedGeneratedContent } from './generated-fingerprint.js';
import { DISK_VIEW, type FileView } from '../file-view.js';

export interface CommandReconcileResult {
  /** 削除した生成コマンドのプロジェクト相対パス。 */
  removed: string[];
  /** 生成内容と異なるため保持したプロジェクト相対パス。 */
  kept: string[];
  /**
   * 読み取り・削除不能、またはプロジェクト内と確認できないリンクのため保持したパス。
   * 編集済みと判明したわけではないので kept と分けて報告する。
   */
  unchecked: string[];
}

interface CommandFileEntry {
  cmdPath: string;
  fullPath: string;
}

interface CommandFileClassification {
  /** 生成内容と一致し、安全に削除できるファイル。 */
  generated: CommandFileEntry[];
  kept: string[];
  unchecked: string[];
}

/**
 * ツールのコマンドを生成出力、独自ファイル、未確認ファイルへ分類する。
 * バージョン刻印がないため、現行 CLI または公開済み OpenSpec の生成内容との
 * 完全一致だけを未編集の根拠とし、それ以外は利用者のものとして保持する。
 * ワークフロー間の参照が導入セットに依存するため、ディスク上のコマンドから
 * 復元したセット、今回のセット、全ワークフローの3候補と比較する。
 * 現在と異なる広さのプロファイルで生成されたファイルにも対応する。
 */
export function classifyCommandFiles(
  projectPath: string,
  toolId: string,
  workflows: readonly string[],
  view: FileView = DISK_VIEW
): CommandFileClassification {
  const generated: CommandFileEntry[] = [];
  const kept: string[] = [];
  const unchecked: string[] = [];

  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return { generated, kept, unchecked };

  const present: (CommandFileEntry & { workflow: string })[] = [];
  for (const workflow of ALL_WORKFLOWS) {
    const cmdPath = adapter.getFilePath(workflow);
    let fullPath: string;
    try {
      fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, cmdPath);
    } catch {
      // プロジェクト外やリンク切れのシンボリックリンクは、内部と確認できない。
      // 読み取り・削除せず、他のコマンドの整理は続行する。実在する項目だけ報告する。
      const lexical = path.join(projectPath, cmdPath);
      if (view.exists(lexical) || view.linkTarget?.(lexical) !== undefined) unchecked.push(cmdPath);
      continue;
    }
    if (view.exists(fullPath)) {
      present.push({ workflow, cmdPath, fullPath });
    }
  }

  if (present.length === 0) return { generated, kept, unchecked };

  const candidateSets = [present.map((entry) => entry.workflow), workflows, ALL_WORKFLOWS];
  const generatedByPath = new Map<string, string[]>();

  for (const workflowSet of candidateSets) {
    let commands: GeneratedCommand[];
    try {
      commands = generateCommands(getCommandContents(workflowSet), adapter);
    } catch {
      // 生成できないセットは比較候補にせず、推測で削除しない。
      continue;
    }
    for (const cmd of commands) {
      const variants = generatedByPath.get(cmd.path) ?? [];
      variants.push(normalizeCommandContent(cmd.fileContent));
      generatedByPath.set(cmd.path, variants);
    }
  }

  for (const { cmdPath, fullPath } of present) {
    try {
      const content = view.read(fullPath);
      const onDisk = normalizeCommandContent(content);
      if ((generatedByPath.get(cmdPath) ?? []).includes(onDisk) || isReleasedGeneratedContent(content)) {
        generated.push({ cmdPath, fullPath });
      } else {
        kept.push(cmdPath);
      }
    } catch {
      // 読めないファイルは生成出力と確認できない。
      unchecked.push(cmdPath);
    }
  }

  return { generated, kept, unchecked };
}

/**
 * 照合時の読み取り・削除処理。dry-run は計画中のツリーと記録処理を渡し、
 * 書き込まずに実更新と同じ削除を計画へ含める。
 */
export interface CommandReconcileIo {
  view: FileView;
  remove(fullPath: string): Promise<void>;
}

const DISK_IO: CommandReconcileIo = {
  view: DISK_VIEW,
  remove: (fullPath) => fs.promises.unlink(fullPath),
};

/**
 * ツールの生成コマンドを削除し、独自のものは保持して報告する。
 * スキルへの一本化で編集内容を黙って失わないための処理。
 * 一致の判定方法は classifyCommandFiles を参照。
 */
export async function reconcileCommandFiles(
  projectPath: string,
  toolId: string,
  workflows: readonly string[],
  io: CommandReconcileIo = DISK_IO
): Promise<CommandReconcileResult> {
  const { generated, kept, unchecked } = classifyCommandFiles(projectPath, toolId, workflows, io.view);
  const removed: string[] = [];

  for (const { cmdPath, fullPath } of generated) {
    try {
      await io.remove(fullPath);
      removed.push(cmdPath);
    } catch {
      // 一致しても削除できなかったファイルを報告し、完全に整理できていないことを伝える。
      unchecked.push(cmdPath);
    }
  }

  return { removed, kept, unchecked };
}

/**
 * 保持したコマンドを、見出し・パス・対処方法のブロックへ整形する。
 * 編集済みと未確認では対処が異なるため分ける。保持したものがなければ空配列。
 */
export function formatKeptCommandFiles(
  result: Pick<CommandReconcileResult, 'kept' | 'unchecked'>
): string[][] {
  const blocks: string[][] = [];
  const files = (count: number) => `コマンドファイル${count}件`;

  if (result.kept.length > 0) {
    blocks.push([
      `OpenSpec の生成内容と一致しない${files(result.kept.length)}を保持しました（編集済みの可能性があります）:`,
      ...result.kept.map((cmdPath) => `  ${cmdPath}`),
      '必要な内容をスキルへ移してから、手動で削除してください。',
    ]);
  }

  if (result.unchecked.length > 0) {
    blocks.push([
      `読み取りまたは削除ができないため、${files(result.unchecked.length)}を保持しました:`,
      ...result.unchecked.map((cmdPath) => `  ${cmdPath}`),
      'ファイルの権限やシンボリックリンクを確認し、手動で削除してください。',
    ]);
  }

  return blocks;
}
