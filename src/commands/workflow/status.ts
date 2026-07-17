/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */

import ora from 'ora';
import chalk from 'chalk';
import { getChangeDir } from '../../core/planning-home.js';
import {
  resolveRootForCommand,
  toPlanningHome,
  toRootOutput,
  withStoreFlag,
  isStoreSelectedRoot,
} from '../../core/root-selection.js';
import {
  loadChangeContext,
  formatChangeStatus,
  type ChangeStatus,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  getAvailableChanges,
  getStatusIndicator,
  getStatusColor,
} from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StatusOptions {
  change?: string;
  schema?: string;
  store?: string;
  storePath?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function statusCommand(options: StatusOptions): Promise<void> {
  // The root resolves (and the store banner prints) before the spinner starts
  // so the two do not fight over stderr.
  const root = await resolveRootForCommand(options, { json: options.json });
  if (!root) {
    return;
  }

  const spinner = options.json ? undefined : ora('変更ステータスを読み込み中...').start();

  try {
    const planningHome = toPlanningHome(root);
    const projectRoot = root.path;
    const rootOutput = toRootOutput(root);
    const newChangeHint = withStoreFlag(root, 'openspec new change <name>');

    // Handle no-changes case gracefully — status is informational,
    // so "no changes" is a valid state, not an error.
    if (!options.change) {
      const available = await getAvailableChanges(projectRoot, root.changesDir);
      if (available.length === 0) {
        spinner?.stop();
        if (options.json) {
          console.log(
            JSON.stringify(
              { changes: [], message: 'アクティブな変更はありません。', root: rootOutput },
              null,
              2
            )
          );
          return;
        }
        console.log(`アクティブな変更はありません。作成するには: ${newChangeHint}`);
        return;
      }
      // Changes exist but --change not provided
      spinner?.stop();
      throw new Error(
        `必須オプション --change が指定されていません。有効な変更:\n  ${available.join('\n  ')}`
      );
    }

    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      root.changesDir,
      { newChangeHint }
    );

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema, {
      changeDir: getChangeDir(planningHome, changeName),
      planningHome,
    });
    const status = formatChangeStatus(
      context,
      isStoreSelectedRoot(root) ? { storeId: root.storeId } : {}
    );

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({ ...status, root: rootOutput }, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printStatusText(status: ChangeStatus): void {
  const doneCount = status.artifacts.filter((a) => a.status === 'done').length;
  const total = status.artifacts.length;

  console.log(`変更: ${status.changeName}`);
  console.log(`スキーマ: ${status.schemaName}`);
  if (status.changeRoot) {
    console.log(`変更Root: ${status.changeRoot}`);
  }
  console.log(`進捗: ${doneCount}/${total} アーティファクト完了`);
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(` (ブロック元: ${artifact.missingDeps.join(', ')})`);
    }

    console.log(line);
  }

  if (status.isComplete) {
    console.log();
    console.log(chalk.green('すべてのアーティファクトが完了しました！'));
  }
}
