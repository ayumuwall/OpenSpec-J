import path from 'path';
import { FileSystemUtils } from './file-system.js';
import { writeChangeMetadata, validateSchemaName } from './change-metadata.js';
import { readProjectConfig } from '../core/project-config.js';

const DEFAULT_SCHEMA = 'spec-driven';

/**
 * Options for creating a change.
 */
export interface CreateChangeOptions {
  /** The workflow schema to use (default: 'spec-driven') */
  schema?: string;
}

/**
 * Result of creating a change.
 */
export interface CreateChangeResult {
  /** The schema that was actually used (resolved from options, config, or default) */
  schema: string;
}

/**
 * Result of validating a change name.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a change name follows kebab-case conventions.
 *
 * Valid names:
 * - Start with a lowercase letter
 * - Contain only lowercase letters, numbers, and hyphens
 * - Do not start or end with a hyphen
 * - Do not contain consecutive hyphens
 *
 * @param name - The change name to validate
 * @returns Validation result with `valid: true` or `valid: false` with an error message
 *
 * @example
 * validateChangeName('add-auth') // { valid: true }
 * validateChangeName('Add-Auth') // { valid: false, error: '...' }
 */
export function validateChangeName(name: string): ValidationResult {
  // Pattern: starts with lowercase letter, followed by lowercase letters/numbers,
  // optionally followed by hyphen + lowercase letters/numbers (repeatable)
  const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  if (!name) {
    return { valid: false, error: '変更名は空にできません' };
  }

  if (!kebabCasePattern.test(name)) {
    // Provide specific error messages for common mistakes
    if (/[A-Z]/.test(name)) {
      return { valid: false, error: '変更名は小文字である必要があります（kebab-case）' };
    }
    if (/\s/.test(name)) {
      return { valid: false, error: '変更名に空白は使えません（ハイフンを使用）' };
    }
    if (/_/.test(name)) {
      return { valid: false, error: '変更名にアンダースコアは使えません（ハイフンを使用）' };
    }
    if (name.startsWith('-')) {
      return { valid: false, error: '変更名はハイフンで始められません' };
    }
    if (name.endsWith('-')) {
      return { valid: false, error: '変更名はハイフンで終われません' };
    }
    if (/--/.test(name)) {
      return { valid: false, error: '変更名に連続したハイフンは使えません' };
    }
    if (/[^a-z0-9-]/.test(name)) {
      return { valid: false, error: '変更名は小文字・数字・ハイフンのみ使用できます' };
    }
    if (/^[0-9]/.test(name)) {
      return { valid: false, error: '変更名は文字で始める必要があります' };
    }

    return { valid: false, error: '変更名は kebab-case である必要があります（例: add-auth, refactor-db）' };
  }

  return { valid: true };
}

/**
 * Creates a new change directory with metadata file.
 *
 * @param projectRoot - The root directory of the project (where `openspec/` lives)
 * @param name - The change name (must be valid kebab-case)
 * @param options - Optional settings for the change
 * @throws Error if the change name is invalid
 * @throws Error if the schema name is invalid
 * @throws Error if the change directory already exists
 *
 * @returns Result containing the resolved schema name
 *
 * @example
 * // Creates openspec/changes/add-auth/ with default schema
 * const result = await createChange('/path/to/project', 'add-auth')
 * console.log(result.schema) // 'spec-driven' or value from config
 *
 * @example
 * // Creates openspec/changes/add-auth/ with TDD schema
 * const result = await createChange('/path/to/project', 'add-auth', { schema: 'tdd' })
 * console.log(result.schema) // 'tdd'
 */
export async function createChange(
  projectRoot: string,
  name: string,
  options: CreateChangeOptions = {}
): Promise<CreateChangeResult> {
  // Validate the name first
  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Determine schema: explicit option → project config → hardcoded default
  let schemaName: string;
  if (options.schema) {
    schemaName = options.schema;
  } else {
    // Try to read from project config
    try {
      const config = readProjectConfig(projectRoot);
      schemaName = config?.schema ?? DEFAULT_SCHEMA;
    } catch {
      // If config read fails, use default
      schemaName = DEFAULT_SCHEMA;
    }
  }

  // Validate the resolved schema
  validateSchemaName(schemaName, projectRoot);

  // Build the change directory path
  const changeDir = path.join(projectRoot, 'openspec', 'changes', name);

  // Check if change already exists
  if (await FileSystemUtils.directoryExists(changeDir)) {
    throw new Error(`変更 '${name}' は既に存在します: ${changeDir}`);
  }

  // Create the directory (including parent directories if needed)
  await FileSystemUtils.createDirectory(changeDir);

  // Write metadata file with schema and creation date
  const today = new Date().toISOString().split('T')[0];
  writeChangeMetadata(changeDir, {
    schema: schemaName,
    created: today,
  }, projectRoot);

  return { schema: schemaName };
}
