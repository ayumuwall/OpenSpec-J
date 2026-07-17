/**
 * New Change Command
 *
 * Creates a new change directory with optional description and schema in the
 * resolved OpenSpec root. `--store <id>` selects a registered store's
 * root; initiative linking and workspace affected areas are no longer part of
 * this command.
 */

import ora from 'ora';
import path from 'path';
import { createChange, validateChangeName } from '../../utils/change-utils.js';
import { formatChangeLocation } from '../../core/planning-home.js';
import {
  resolveRootForCommand,
  RootSelectionError,
  toPlanningHome,
  toRootOutput,
  withStoreFlag,
  type ResolvedOpenSpecRoot,
  type RootOutput,
  isStoreSelectedRoot,
} from '../../core/root-selection.js';
import { printJson, statusFromError, validateSchemaExists } from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface NewChangeOptions {
  description?: string;
  goal?: string;
  schema?: string;
  store?: string;
  storePath?: string;
  initiative?: string;
  areas?: string;
  json?: boolean;
}

interface NewChangeOutput {
  change: {
    id: string;
    path: string;
    metadataPath: string;
    schema: string;
  };
  root: RootOutput;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

function assertRemovedOptionsAbsent(options: NewChangeOptions): void {
  if (options.initiative !== undefined) {
    throw new RootSelectionError(
      '--initiative はサポート終了です。通常の変更は initiative に紐づきません。OpenSpec ルートの選択には --store <id> を使ってください。',
      'initiative_option_removed',
      { target: 'change.options' }
    );
  }

  if (options.areas !== undefined) {
    throw new RootSelectionError(
      '--areas はサポート終了です。ワークスペースの影響範囲は通常の OpenSpec ルートパスには含まれません。',
      'areas_option_removed',
      { target: 'change.options' }
    );
  }
}

function printCreatedChangeHuman(
  payload: NewChangeOutput,
  root: ResolvedOpenSpecRoot
): void {
  // A relative path is only honest when the root is where the user
  // stands; a distant ancestor root gets the absolute path.
  const location =
    !isStoreSelectedRoot(root) && root.path === process.cwd()
      ? formatChangeLocation(toPlanningHome(root), payload.change.id)
      : payload.change.path;
  console.log(`変更 '${payload.change.id}' を作成しました: ${location}/`);
  console.log(`スキーマ: ${payload.change.schema}`);
  console.log(`次: ${withStoreFlag(root, `openspec status --change ${payload.change.id}`)}`);
}

export async function newChangeCommand(name: string | undefined, options: NewChangeOptions): Promise<void> {
  const spinner = options.json ? undefined : ora();

  try {
    if (!name) {
      throw new Error('必須引数 <name> が指定されていません');
    }

    const validation = validateChangeName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    assertRemovedOptionsAbsent(options);

    const root = await resolveRootForCommand(options, {
      json: options.json,
      failurePayload: { change: null },
    });
    if (!root) {
      return;
    }

    const projectRoot = root.path;

    // Validate schema if provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    const resolvedSchema = options.schema ?? root.defaultSchema;
    if (spinner) {
      spinner.start(`スキーマ '${resolvedSchema}' で変更 '${name}' を作成中...`);
    }

    const result = await createChange(projectRoot, name, {
      schema: options.schema,
      defaultSchema: root.defaultSchema,
      changesDir: root.changesDir,
      metadata: {
        ...(options.goal ? { goal: options.goal } : {}),
      },
    });

    // If description provided, create README.md with description
    if (options.description) {
      const { promises: fs } = await import('fs');
      const readmePath = path.join(result.changeDir, 'README.md');
      await fs.writeFile(readmePath, `# ${name}\n\n${options.description}\n`, 'utf-8');
    }

    const payload: NewChangeOutput = {
      change: {
        id: name,
        path: result.changeDir,
        metadataPath: path.join(result.changeDir, '.openspec.yaml'),
        schema: result.schema,
      },
      root: toRootOutput(root),
    };

    if (options.json) {
      printJson(payload);
      return;
    }

    spinner?.stop();
    printCreatedChangeHuman(payload, root);
  } catch (error) {
    spinner?.stop();
    if (options.json) {
      printJson({
        change: null,
        status: [statusFromError(error)],
      });
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}
