/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */

import ora from 'ora';
import chalk from 'chalk';
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
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function statusCommand(options: StatusOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('変更の状況を読み込み中...').start();

  try {
    const projectRoot = process.cwd();

    // 変更なしの場合は正常扱い — status は情報提供コマンドなので
    // 「変更なし」は有効な状態であり、エラーではない。
    if (!options.change) {
      const available = await getAvailableChanges(projectRoot);
      if (available.length === 0) {
        spinner?.stop();
        if (options.json) {
          console.log(JSON.stringify({ changes: [], message: '進行中の変更はありません。' }, null, 2));
          return;
        }
        console.log('進行中の変更はありません。`openspec new change <name>` で作成してください。');
        return;
      }
      // 変更は存在するが --change が未指定
      spinner?.stop();
      throw new Error(
        `必須オプション --change が指定されていません。利用可能な変更:\n  ${available.join('\n  ')}`
      );
    }

    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);
    const status = formatChangeStatus(context);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
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
  console.log(`進捗: ${doneCount}/${total} アーティファクト完了`);
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(` （ブロック要因: ${artifact.missingDeps.join(', ')}）`);
    }

    console.log(line);
  }

  if (status.isComplete) {
    console.log();
    console.log(chalk.green('すべてのアーティファクトが完了しました！'));
  }
}
