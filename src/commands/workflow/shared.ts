/**
 * Shared Types and Utilities for Artifact Workflow Commands
 *
 * This module contains types, constants, and validation helpers used across
 * multiple artifact workflow commands.
 */

import chalk from 'chalk';
import path from 'path';
import * as fs from 'fs';
import { getSchemaDir, listSchemas } from '../../core/artifact-graph/index.js';
import type { ReferenceIndexEntry } from '../../core/references.js';
import { isRootSelectionError } from '../../core/root-selection.js';
import { validateChangeName } from '../../utils/change-utils.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChangeCommandStatus {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  target?: string;
  fix?: string;
}

export interface TaskItem {
  id: string;
  description: string;
  done: boolean;
}

export interface ApplyInstructions {
  changeName: string;
  changeDir: string;
  schemaName: string;
  contextFiles: Record<string, string[]>;
  progress: {
    total: number;
    complete: number;
    remaining: number;
  };
  tasks: TaskItem[];
  state: 'blocked' | 'all_done' | 'ready';
  missingArtifacts?: string[];
  instruction: string;
  /** Referenced-store index (read-only upstream context; omitted when none declared) */
  references?: ReferenceIndexEntry[];
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const DEFAULT_SCHEMA = 'spec-driven';

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

export function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

export function statusFromError(error: unknown): ChangeCommandStatus {
  if (isRootSelectionError(error)) {
    return { ...error.diagnostic };
  }

  return {
    severity: 'error',
    code: 'change_error',
    message: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Checks if color output is disabled via NO_COLOR env or --no-color flag.
 */
export function isColorDisabled(): boolean {
  return process.env.NO_COLOR === '1' || process.env.NO_COLOR === 'true';
}

/**
 * Gets the color function based on status.
 */
export function getStatusColor(status: 'done' | 'ready' | 'blocked'): (text: string) => string {
  if (isColorDisabled()) {
    return (text: string) => text;
  }
  switch (status) {
    case 'done':
      return chalk.green;
    case 'ready':
      return chalk.yellow;
    case 'blocked':
      return chalk.red;
  }
}

/**
 * Gets the status indicator for an artifact.
 */
export function getStatusIndicator(status: 'done' | 'ready' | 'blocked'): string {
  const color = getStatusColor(status);
  switch (status) {
    case 'done':
      return color('[x]');
    case 'ready':
      return color('[ ]');
    case 'blocked':
      return color('[-]');
  }
}

/**
 * openspec/changes/ 配下の利用可能な変更ディレクトリ名の一覧を返す。
 * archive ディレクトリと隠しディレクトリは除外する。
 */
export async function getAvailableChanges(
  projectRoot: string,
  changesDir = path.join(projectRoot, 'openspec', 'changes')
): Promise<string[]> {
  const changesPath = changesDir;
  try {
    const entries = await fs.promises.readdir(changesPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name !== 'archive' && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Validates that a change exists and returns available changes if not.
 * Checks directory existence directly to support scaffolded changes (without proposal.md).
 */
export async function validateChangeExists(
  changeName: string | undefined,
  projectRoot: string,
  changesDir = path.join(projectRoot, 'openspec', 'changes'),
  hints: { newChangeHint?: string } = {}
): Promise<string> {
  // Hints must stay pasteable: callers with a selected store pass a
  // store-carrying hint so following it lands in the same root.
  const newChangeHint = hints.newChangeHint ?? 'openspec new change <name>';

  if (!changeName) {
    const available = await getAvailableChanges(projectRoot, changesDir);
    if (available.length === 0) {
      throw new Error(`変更が見つかりません。作成するには: ${newChangeHint}`);
    }
    throw new Error(
      `必須オプション --change が指定されていません。利用可能な変更:\n  ${available.join('\n  ')}`
    );
  }

  // Validate change name format to prevent path traversal
  const nameValidation = validateChangeName(changeName);
  if (!nameValidation.valid) {
    throw new Error(`変更名が不正です '${changeName}': ${nameValidation.error}`);
  }

  // Check directory existence directly
  const changePath = path.join(changesDir, changeName);
  const exists = fs.existsSync(changePath) && fs.statSync(changePath).isDirectory();

  if (!exists) {
    const available = await getAvailableChanges(projectRoot, changesDir);
    if (available.length === 0) {
      throw new Error(
        `変更 '${changeName}' が見つかりません。変更はまだありません。作成するには: ${newChangeHint}`
      );
    }
    throw new Error(
      `変更 '${changeName}' が見つかりません。利用可能な変更:\n  ${available.join('\n  ')}`
    );
  }

  return changeName;
}

/**
 * Validates that a schema exists and returns available schemas if not.
 *
 * @param schemaName - The schema name to validate
 * @param projectRoot - Optional project root for project-local schema resolution
 */
export function validateSchemaExists(schemaName: string, projectRoot?: string): string {
  const schemaDir = getSchemaDir(schemaName, projectRoot);
  if (!schemaDir) {
    const availableSchemas = listSchemas(projectRoot);
    throw new Error(
      `スキーマ '${schemaName}' が見つかりません。利用可能なスキーマ:\n  ${availableSchemas.join('\n  ')}`
    );
  }
  return schemaName;
}
