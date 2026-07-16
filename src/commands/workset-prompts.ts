/**
 * The workset command's interactive prompt flows (the compose wizard,
 * the open-time tool select, the remove confirm). @inquirer is always
 * imported dynamically at the call site - never at module top.
 */
import * as path from 'node:path';

import { pathIsDirectory } from '../core/file-state.js';
import {
  listOpenerChoices,
  type OpenerChoice,
  type OpenerDefinition,
} from '../core/openers.js';
import { expandUserPath } from '../core/store/operations.js';
import {
  memberLabelProblem,
  validateWorksetName,
  type Workset,
  type WorksetMember,
} from '../core/worksets.js';
import { asErrorMessage } from './shared-output.js';
import {
  assertKnownTool,
  finalizeWorkset,
  formatMemberRows,
  resolveMemberFlags,
} from './workset-input.js';

export interface ComposeInput {
  memberFlags: string[];
  tool?: string;
}

export async function composeInteractively(
  givenName: string | undefined,
  input: ComposeInput,
  table: OpenerDefinition[]
): Promise<Workset> {
  const prompts = await import('@inquirer/prompts');

  console.log('[1/3] ワークセットに名前を付ける');
  let name: string;
  if (givenName !== undefined) {
    name = validateWorksetName(givenName);
    console.log(`  ワークセット名: ${name}`);
  } else {
    name = await prompts.input({
      message: 'ワークセット名:',
      required: true,
      validate(value: string) {
        try {
          validateWorksetName(value);
          return true;
        } catch (error) {
          return asErrorMessage(error);
        }
      },
    });
  }

  // Flag-provided pieces are validated before any prompting, so a
  // bad flag or tool cannot discard a finished wizard walk.
  if (input.tool !== undefined) {
    assertKnownTool(input.tool, table);
  }

  console.log('');
  console.log(
    '[2/3] メンバーフォルダーを追加（最初のフォルダーがプライマリとなり、セッションはそこから開始）'
  );
  const members: WorksetMember[] = await resolveMemberFlags(input.memberFlags);
  if (members.length > 0) {
    finalizeWorkset(name, members, input.tool, table);
    for (const member of members) {
      console.log(`  Added '${member.name}' (${member.path})`);
    }
  }

  while (true) {
    if (members.length > 0) {
      const next = await prompts.select({
        message: '別のフォルダーを追加するか、完了してください:',
        choices: [
          { name: 'Finish', value: 'finish' },
          { name: 'Add another folder', value: 'add' },
        ],
        default: 'finish',
      });
      if (next === 'finish') {
        break;
      }
    }

    const rawPath = await prompts.input({
      message: 'フォルダーのパス:',
      ...(members.length === 0 ? { default: '.', prefill: 'editable' } : {}),
      required: true,
      async validate(value: string) {
        const resolved = path.resolve(expandUserPath(value));
        if (!(await pathIsDirectory(resolved))) {
          return `'${value}' is not an existing folder`;
        }
        return true;
      },
    });

    const resolvedPath = path.resolve(expandUserPath(rawPath));
    let label = path.basename(resolvedPath);
    const collision = members.some((member) => member.name === label);
    if (memberLabelProblem(label) !== null || collision) {
      label = await prompts.input({
        message: 'このメンバーの名前（フォルダーの表示名）:',
        required: true,
        validate(value: string) {
          const problem = memberLabelProblem(value);
          if (problem !== null) {
            return problem;
          }
          if (members.some((member) => member.name === value)) {
            return `duplicate member name '${value}'`;
          }
          return true;
        },
      });
    }

    members.push({ name: label, path: resolvedPath });
    console.log(`  Added '${label}' (${resolvedPath})`);
  }

  console.log('');
  console.log('[3/3] ツールを選択');
  let tool = input.tool;
  if (tool === undefined) {
    const choices = listOpenerChoices(table);
    const available = choices.filter((choice) => choice.available);
    if (available.length === 0) {
      console.log(
        '  既知のツールが PATH にないため、設定は保存しません。'
      );
      console.log(
        `  (Known tools: ${choices.map((choice) => `${choice.opener.id} ${choice.note ?? ''}`.trim()).join(', ')})`
      );
    } else {
      tool = await promptToolFromChoices(available);
    }
  }

  return finalizeWorkset(name, members, tool, table);
}

export async function promptToolFromChoices(
  available: OpenerChoice[]
): Promise<string> {
  const { select } = await import('@inquirer/prompts');
  return select({
    message: '次のツールで開く:',
    choices: available.map((choice) => ({
      name: choice.opener.label,
      value: choice.opener.id,
    })),
  });
}

export async function promptOpenNow(label: string): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');
  return confirm({
    message: `Open it now in ${label}?`,
    default: true,
  });
}

/** Prints the workset (decision 13: remove shows what it removes). */
export async function confirmRemoveInteractively(
  workset: Workset
): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');

  console.log(`Workset '${workset.name}':`);
  for (const row of formatMemberRows(workset.members)) {
    console.log(`  ${row}`);
  }

  return confirm({
    message: `Remove workset '${workset.name}'? (member folders are never touched)`,
    default: false,
  });
}
