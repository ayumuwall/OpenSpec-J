/**
 * `openspec context` (slice 4.1): the working set a root's declarations
 * describe, as an agent brief (JSON), a human listing, or an editor
 * view (`--code-workspace`). Assembly is presentation over the Phase 3
 * relationship data; doctor is the health surface. The only write this
 * command can perform is the explicitly requested workspace file.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command, Option } from 'commander';

import {
  resolveRootForCommand,
  type ResolvedOpenSpecRoot,
} from '../core/root-selection.js';
import { inspectRelationships } from '../core/relationship-health.js';
import {
  assembleWorkingSet,
  buildCodeWorkspaceJson,
  isAvailableMember,
  type WorkingSet,
  type WorkingSetMember,
} from '../core/working-set.js';
import { StoreError } from '../core/store/errors.js';
import { COMMAND_REGISTRY } from '../core/completions/command-registry.js';
import { COMMON_FLAGS } from '../core/completions/shared-flags.js';
import { emitFailure, printJson } from './shared-output.js';
import { gatherRelationshipData } from './shared-gather.js';

const FAILURE_PAYLOAD = { root: null, members: [] };

async function gatherWorkingSet(
  root: ResolvedOpenSpecRoot
): Promise<{ workingSet: WorkingSet; declaredReferenceCount: number }> {
  const data = await gatherRelationshipData(root);

  // Reuse the 3.6 composition for member classification; the
  // doctor-only wrong-turn detections and store facts are deliberately
  // absent — doctor is the health surface.
  const health = inspectRelationships({
    root,
    rootHealthy: data.rootInspection.healthy,
    rootStatus: data.rootInspection.diagnostics,
    referenceEntries: data.referenceEntries,
    registryUnreadable: data.registrySnapshot.unreadable,
  });

  return {
    workingSet: assembleWorkingSet({
      root,
      referenceEntries: data.referenceEntries,
      topLevelStatus: health.status,
    }),
    declaredReferenceCount: data.projectConfig?.references?.length ?? 0,
  };
}

function memberLine(member: WorkingSetMember): string {
  return `  ${member.id}  ${member.path}`;
}

function printHumanWorkingSet(workingSet: WorkingSet, declaredReferenceCount: number): void {
  const rootLabel = workingSet.root.store_id ?? path.basename(workingSet.root.path);
  console.log(`${rootLabel} の作業コンテキスト (${workingSet.root.path})`);
  console.log('');
  console.log('OpenSpec ルート');
  console.log(`  ${rootLabel}  ${workingSet.root.path}`);

  const availableStores = workingSet.members.filter(
    (member) => member.role === 'referenced_store' && isAvailableMember(member)
  );
  const unavailable = workingSet.members.filter((member) => !isAvailableMember(member));

  if (availableStores.length > 0) {
    console.log('');
    console.log('参照先ストア');
    for (const member of availableStores) {
      console.log(memberLine(member));
      if (member.fetch) {
        console.log(`    取得: ${member.fetch}`);
      }
    }
  }

  if (workingSet.members.length === 0) {
    console.log('');
    // Self-references are silently omitted from the index; an
    // emptied-by-omission set must not claim nothing was declared.
    console.log(
      declaredReferenceCount > 0
        ? '宣言済み参照はすべてこのルートに解決されます。作業セットはこのルートのみです。'
        : '参照は宣言されていません。作業セットはこのルートのみです。'
    );
  }

  if (unavailable.length > 0 || workingSet.status.length > 0) {
    console.log('');
    console.log('このマシンでは利用できません');
    for (const member of unavailable) {
      if (member.status.length === 0) {
        console.log(`  - ${member.id}`);
        continue;
      }
      for (const diagnostic of member.status) {
        console.log(`  - ${member.id}: ${diagnostic.message}`);
        if (diagnostic.fix) {
          console.log(`    修正: ${diagnostic.fix}`);
        }
      }
    }
    for (const diagnostic of workingSet.status) {
      console.log(`  メモ: ${diagnostic.message}`);
      if (diagnostic.fix) {
        console.log(`  修正: ${diagnostic.fix}`);
      }
    }
  }
}

function writeCodeWorkspace(
  workingSet: WorkingSet,
  outputPath: string,
  force: boolean
): void {
  const resolved = path.resolve(outputPath);
  if (fs.existsSync(resolved) && !force) {
    throw new StoreError(
      `${resolved} は上書きしません。`,
      'context_file_exists',
      {
        target: 'context.output',
        fix: `上書きするには --force を指定するか、別のパスを選んでください。`,
      }
    );
  }
  const parent = path.dirname(resolved);
  if (!fs.existsSync(parent)) {
    throw new StoreError(
      `出力ディレクトリが存在しません: ${parent}。`,
      'context_output_dir_missing',
      { target: 'context.output', fix: '先にディレクトリを作成するか、別のパスを選んでください。' }
    );
  }

  const rootName = workingSet.root.store_id ?? path.basename(workingSet.root.path);
  fs.writeFileSync(resolved, buildCodeWorkspaceJson(workingSet, rootName));

  const available = workingSet.members.filter(isAvailableMember).length;
  const skipped = workingSet.members
    .filter((member) => !isAvailableMember(member))
    .map((member) => member.id);
  const summary =
    skipped.length > 0
      ? `${resolved} を書き込みました (${available + 1} フォルダー; 利用不可: ${skipped.join(', ')})`
      : `${resolved} を書き込みました (${available + 1} フォルダー)`;
  // stderr keeps JSON stdout pure; for humans it reads inline.
  console.error(summary);
}

export function registerContextCommand(program: Command): void {
  const description =
    COMMAND_REGISTRY.find((entry) => entry.name === 'context')?.description ??
    '解決済みの OpenSpec ルートに対する作業コンテキストを表示';

  program
    .command('context')
    .description(description)
    .option('--store <id>', COMMON_FLAGS.store.description)
    .addOption(
      new Option('--store-path <path>', '削除済みです。ストアを登録して --store を使ってください').hideHelp()
    )
    .option('--json', 'エージェント向け概要を JSON として出力')
    .option('--code-workspace <path>', 'このセットの VS Code ワークスペースファイルも書き出す')
    .option('--force', '既存の --code-workspace ファイルを上書き')
    .action(
      async (options: {
        store?: string;
        storePath?: string;
        json?: boolean;
        codeWorkspace?: string;
        force?: boolean;
      }) => {
        try {
          const root = await resolveRootForCommand(
            { store: options.store, storePath: options.storePath },
            { json: options.json, failurePayload: FAILURE_PAYLOAD, allowImplicitRoot: false }
          );
          if (!root) {
            return;
          }

          const { workingSet, declaredReferenceCount } = await gatherWorkingSet(root);

          if (options.json) {
            // The write runs FIRST: a write failure must leave stdout
            // holding exactly one JSON document (the failure payload).
            if (options.codeWorkspace) {
              writeCodeWorkspace(workingSet, options.codeWorkspace, options.force === true);
            }
            printJson(workingSet);
          } else {
            printHumanWorkingSet(workingSet, declaredReferenceCount);
            if (options.codeWorkspace) {
              writeCodeWorkspace(workingSet, options.codeWorkspace, options.force === true);
            }
          }
        } catch (error) {
          emitFailure(options.json, FAILURE_PAYLOAD, error, 'context_failed');
        }
      }
    );
}
