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
import { asStatus } from '../shared-output.js';
import type { StoreDiagnostic } from '../../core/store/errors.js';
import {
  validateChangeExists,
  validateSchemaExists,
  getAvailableChanges,
  getStatusIndicator,
  getStatusColor,
} from './shared.js';

// -----------------------------------------------------------------------------
// 型
// -----------------------------------------------------------------------------

export interface StatusOptions {
  change?: string;
  all?: boolean;
  schema?: string;
  store?: string;
  storePath?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

// バッチの各要素には、読み込み済みのステータス、または読み込みに失敗した
// 変更名と診断情報を格納する。1件の失敗で一括処理全体を中止しない。
type BatchStatusEntry = ChangeStatus | { changeName: string; status: StoreDiagnostic[] };

// --all --json の失敗時に返す空の構造。ルート選択の失敗と例外のどちらでも
// 同じ形式を出力するため、両方の呼び出し元でこの定数を共有する。
export const BATCH_STATUS_FAILURE_PAYLOAD: Record<string, unknown> = {
  changes: [],
  root: null,
};

export async function statusCommand(options: StatusOptions): Promise<void> {
  if (options.all && options.change) {
    throw new Error('--all と --change は同時に指定できません。');
  }

  // スピナーより先にルートを解決してストア案内を表示し、stderr上で競合しないようにする。
  // --all --json でルート選択に失敗した場合も `changes: []` を含める。
  const root = await resolveRootForCommand(options, {
    json: options.json,
    failurePayload: options.all ? BATCH_STATUS_FAILURE_PAYLOAD : undefined,
  });
  if (!root) {
    return;
  }

  const spinner = options.json ? undefined : ora('変更ステータスを読み込み中...').start();

  try {
    const planningHome = toPlanningHome(root);
    const projectRoot = root.path;
    const rootOutput = toRootOutput(root);
    const newChangeHint = withStoreFlag(root, 'openspec new change <name>');

    // 1件の変更ステータスを読み込む処理を共通化し、バッチと単一変更の
    // ペイロードが食い違わないようにする。
    const loadStatus = (changeName: string): ChangeStatus =>
      formatChangeStatus(
        loadChangeContext(projectRoot, changeName, options.schema, {
          changeDir: getChangeDir(planningHome, changeName),
          planningHome,
        }),
        isStoreSelectedRoot(root) ? { storeId: root.storeId } : {}
      );

    // Handle no-changes case gracefully — status is informational,
    // so "no changes" is a valid state, not an error.
    if (!options.change) {
      // 変更なしで早期returnする前に検証し、変更の有無にかかわらず
      // 不正な --schema を同じ方法でエラーにする。
      if (options.all && options.schema) {
        validateSchemaExists(options.schema, projectRoot);
      }

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

      if (options.all) {
        // readdirの順序はプラットフォーム依存のため、validate --all と同じ
        // 比較方法で並べ替え、同じ変更集合を常に同じ順序で出力する。
        const entries: BatchStatusEntry[] = [];
        for (const changeName of available.sort((a, b) => a.localeCompare(b))) {
          try {
            entries.push(loadStatus(changeName));
          } catch (error) {
            // 不正な変更が1件あっても一括結果全体を失わず、その位置に
            // 診断情報を格納して処理を続ける。
            entries.push({ changeName, status: [asStatus(error, 'change_error')] });
          }
        }

        spinner?.stop();
        const failed = entries.some((entry) => !('artifacts' in entry));

        if (options.json) {
          console.log(JSON.stringify({ changes: entries, root: rootOutput }, null, 2));
          if (failed) {
            process.exitCode = 1;
          }
          return;
        }

        entries.forEach((entry, index) => {
          if (index > 0) {
            console.log();
          }
          if ('artifacts' in entry) {
            printStatusText(entry);
          } else {
            console.log(chalk.red(`✗ ${entry.changeName}: ${entry.status[0]?.message}`));
          }
        });
        // 一部を読み込めなかった場合は、どちらの出力形式でもコマンドを失敗扱いにする。
        // JSON利用側は終了コードとは別に、完全なペイロードを解析できる。
        if (failed) {
          process.exitCode = 1;
        }
        return;
      }

      // 変更が存在するのに --change も --all も指定されていない。
      // 全件を対象にできることがヘルプを開かなくても分かるよう、--all も案内する。
      spinner?.stop();
      throw new Error(
        `必須オプション --change が指定されていません（すべての有効な変更を対象にする場合は --all）。有効な変更:\n  ${available.join('\n  ')}`
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
    const status = loadStatus(changeName);

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
  const skippedCount = status.artifacts.filter((a) => a.status === 'skipped').length;
  const total = status.artifacts.length - skippedCount;

  console.log(`変更: ${status.changeName}`);
  console.log(`スキーマ: ${status.schemaName}`);
  if (status.changeRoot) {
    console.log(`変更Root: ${status.changeRoot}`);
  }
  const skippedSuffix = skippedCount > 0 ? `（${skippedCount}件スキップ）` : '';
  console.log(`進捗: ${doneCount}/${total} アーティファクト完了${skippedSuffix}`);
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'skipped') {
      line += color('（スキップ: 変更で skip_specs を宣言）');
    }

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(` (ブロック元: ${artifact.missingDeps.join(', ')})`);
    }

    console.log(line);
  }

  if (status.isPlanningComplete) {
    console.log();
    console.log(chalk.green('すべての計画アーティファクトが完了しました！'));
  }
}
