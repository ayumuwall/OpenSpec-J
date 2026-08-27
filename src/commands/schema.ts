import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import ora from 'ora';
import { stringify as stringifyYaml, parseDocument, isMap } from 'yaml';
import {
  getSchemaDir,
  getProjectSchemasDir,
  getUserSchemasDir,
  getPackageSchemasDir,
  isSchemaDir,
  listSchemas,
} from '../core/artifact-graph/resolver.js';
import { parseSchema, SchemaValidationError } from '../core/artifact-graph/schema.js';
import type { SchemaYaml, Artifact } from '../core/artifact-graph/types.js';
import { resolveConfigFilePath } from '../core/project-config.js';
import { FileSystemUtils } from '../utils/file-system.js';

/**
 * Schema source location type
 */
type SchemaSource = 'project' | 'user' | 'package';

/**
 * Result of checking a schema location
 */
interface SchemaLocation {
  source: SchemaSource;
  path: string;
  exists: boolean;
}

/**
 * Schema resolution info with shadowing details
 */
interface SchemaResolution {
  name: string;
  source: SchemaSource;
  path: string;
  shadows: Array<{ source: SchemaSource; path: string }>;
}

/**
 * Validation issue structure
 */
interface ValidationIssue {
  level: 'error' | 'warning';
  path: string;
  message: string;
}

/**
 * Check all three locations for a schema and return which ones exist.
 */
function checkAllLocations(
  name: string,
  projectRoot: string
): SchemaLocation[] {
  const locations: SchemaLocation[] = [];

  // Project location
  const projectDir = path.join(getProjectSchemasDir(projectRoot), name);
  const projectSchemaPath = path.join(projectDir, 'schema.yaml');
  locations.push({
    source: 'project',
    path: projectDir,
    exists: fs.existsSync(projectSchemaPath),
  });

  // User location
  const userDir = path.join(getUserSchemasDir(), name);
  const userSchemaPath = path.join(userDir, 'schema.yaml');
  locations.push({
    source: 'user',
    path: userDir,
    exists: fs.existsSync(userSchemaPath),
  });

  // Package location
  const packageDir = path.join(getPackageSchemasDir(), name);
  const packageSchemaPath = path.join(packageDir, 'schema.yaml');
  locations.push({
    source: 'package',
    path: packageDir,
    exists: fs.existsSync(packageSchemaPath),
  });

  return locations;
}

/**
 * Get resolution info for a schema including shadow detection.
 */
function getSchemaResolution(
  name: string,
  projectRoot: string
): SchemaResolution | null {
  const locations = checkAllLocations(name, projectRoot);
  const existingLocations = locations.filter((loc) => loc.exists);

  if (existingLocations.length === 0) {
    return null;
  }

  const active = existingLocations[0];
  const shadows = existingLocations.slice(1).map((loc) => ({
    source: loc.source,
    path: loc.path,
  }));

  return {
    name,
    source: active.source,
    path: active.path,
    shadows,
  };
}

/**
 * Get all schemas with resolution info.
 */
function getAllSchemasWithResolution(
  projectRoot: string
): SchemaResolution[] {
  const schemaNames = listSchemas(projectRoot);
  const results: SchemaResolution[] = [];

  for (const name of schemaNames) {
    const resolution = getSchemaResolution(name, projectRoot);
    if (resolution) {
      results.push(resolution);
    }
  }

  return results;
}

/**
 * Validate a schema and return issues.
 */
function validateSchema(
  schemaDir: string,
  verbose: boolean = false
): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const schemaPath = path.join(schemaDir, 'schema.yaml');

  // Check schema.yaml exists
  if (verbose) {
    console.log('  schema.yaml の存在を確認中...');
  }
  if (!fs.existsSync(schemaPath)) {
    issues.push({
      level: 'error',
      path: 'schema.yaml',
      message: 'schema.yaml が見つかりません',
  });
    return { valid: false, issues };
  }

  // Parse YAML
  if (verbose) {
    console.log('  YAML を解析中...');
  }
  let content: string;
  try {
    content = fs.readFileSync(schemaPath, 'utf-8');
  } catch (err) {
    issues.push({
      level: 'error',
      path: 'schema.yaml',
      message: `ファイルの読み取りに失敗しました: ${(err as Error).message}`,
  });
    return { valid: false, issues };
  }

  // Validate against Zod schema
  if (verbose) {
    console.log('  スキーマ構造を検証中...');
  }
  let schema: SchemaYaml;
  try {
    schema = parseSchema(content);
  } catch (err) {
    if (err instanceof SchemaValidationError) {
      issues.push({
        level: 'error',
        path: 'schema.yaml',
        message: err.message,
      });
    } else {
      issues.push({
        level: 'error',
        path: 'schema.yaml',
        message: `解析エラー: ${(err as Error).message}`,
      });
    }
    return { valid: false, issues };
  }

  // Check template files exist in the same directory used at runtime.
  if (verbose) {
    console.log('  テンプレートファイルを確認中...');
  }
  for (const artifact of schema.artifacts) {
    const templatesDir = path.join(schemaDir, 'templates');
    const existingTemplatePath = path.join(templatesDir, artifact.template);

    if (!fs.existsSync(existingTemplatePath)) {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: `アーティファクト '${artifact.id}' のテンプレートファイル '${artifact.template}' が見つかりません`,
      });
      continue;
    }

    try {
      FileSystemUtils.assertPathWithin(templatesDir, existingTemplatePath);
    } catch {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: `テンプレートファイル '${artifact.template}' がスキーマの templates ディレクトリ外を指しています`,
      });
    }
  }

  // Dependency graph validation is already done by parseSchema
  // (it throws on cycles and invalid references)
  if (verbose) {
    console.log('  依存グラフの検証に合格しました（parseSchema 経由）');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate schema name format (kebab-case).
 */
function isValidSchemaName(name: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * Copy a directory recursively.
 */
function resolveSchemaCopyPath(allowedRoot: string, sourcePath: string): string {
  try {
    const canonicalRoot = fs.realpathSync(allowedRoot);
    const canonicalPath = fs.realpathSync(sourcePath);
    FileSystemUtils.assertPathWithin(canonicalRoot, canonicalPath);
    return canonicalPath;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `リンク先またはサポートされないエントリを含むスキーマは複製できません: ${sourcePath}: ${detail}`,
      { cause: error }
    );
  }
}

function copyDirRecursive(
  src: string,
  dest: string,
  allowedRoot = src,
  ancestors = new Set<string>()
): void {
  const canonicalSrc = resolveSchemaCopyPath(allowedRoot, src);
  if (ancestors.has(canonicalSrc)) {
    throw new Error(`リンク先ディレクトリの循環を含むスキーマは複製できません: ${src}`);
  }
  ancestors.add(canonicalSrc);
  fs.mkdirSync(dest, { recursive: true });

  try {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      const canonicalEntry = resolveSchemaCopyPath(allowedRoot, srcPath);
      const stats = fs.statSync(canonicalEntry);

      if (stats.isDirectory()) {
        copyDirRecursive(canonicalEntry, destPath, allowedRoot, ancestors);
      } else if (stats.isFile()) {
        // Dereference confined links so the fork is an independent schema.
        fs.copyFileSync(canonicalEntry, destPath);
      } else {
        throw new Error(`リンク先またはサポートされないエントリを含むスキーマは複製できません: ${srcPath}`);
      }
    }
  } finally {
    ancestors.delete(canonicalSrc);
  }
}

/**
 * Verifies a schema tree before replacing or creating the fork destination.
 */
function assertSchemaTreeCanBeCopied(
  src: string,
  allowedRoot = src,
  ancestors = new Set<string>()
): void {
  const canonicalSrc = resolveSchemaCopyPath(allowedRoot, src);
  if (ancestors.has(canonicalSrc)) {
    throw new Error(`リンク先ディレクトリの循環を含むスキーマは複製できません: ${src}`);
  }
  ancestors.add(canonicalSrc);

  try {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const entryPath = path.join(src, entry.name);
      const canonicalEntry = resolveSchemaCopyPath(allowedRoot, entryPath);
      const stats = fs.statSync(canonicalEntry);
      if (stats.isDirectory()) {
        assertSchemaTreeCanBeCopied(canonicalEntry, allowedRoot, ancestors);
      } else if (!stats.isFile()) {
        throw new Error(`リンク先またはサポートされないエントリを含むスキーマは複製できません: ${entryPath}`);
      }
    }
  } finally {
    ancestors.delete(canonicalSrc);
  }
}

/**
 * Produces a stable content fingerprint of a directory: a SHA-256 over every
 * file's relative path AND its bytes (plus directory paths), walked in sorted
 * order. Two directories with byte-identical trees produce the same digest, and
 * ANY change to a file's contents, size, or the set of paths changes it. Used to
 * detect a concurrent modification of a fork destination between the moment the
 * overwrite is authorized and the moment it is actually moved/deleted, so those
 * changes are never silently destroyed.
 */
function fingerprintDir(dir: string): string {
  const hash = createHash('sha256');
  const walk = (current: string, rel: string): void => {
    const entries = fs
      .readdirSync(current, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      // Use the entry type from readdir (no separate lstat), then read the file
      // directly — avoiding a stat-then-read check/use gap. Size is derived from
      // the bytes actually read, so the digest still covers content and length.
      if (entry.isDirectory()) {
        hash.update(`D:${relPath}\n`);
        walk(abs, relPath);
      } else if (entry.isFile()) {
        const contents = fs.readFileSync(abs);
        hash.update(`F:${relPath}:${contents.length}:`);
        hash.update(contents);
        hash.update('\n');
      } else {
        // Symlinks / other entry types: record the type + path (and the link
        // target when readable) so a swap of one for another is still detected.
        let target = '';
        try {
          target = fs.readlinkSync(abs);
        } catch {
          // Non-symlink or unreadable target; the type marker below suffices.
        }
        hash.update(`O:${relPath}:${target}\n`);
      }
    }
  };
  walk(dir, '');
  return hash.digest('hex');
}

interface PreparedConfigUpdate {
  path: string;
  content: Buffer;
  originalContent: Buffer | null;
  originalMode: number | null;
}

/** @internal File-operation seam for transactional failure tests. */
export const schemaInitFileOperations = {
  renameSync: fs.renameSync,
};

async function prepareDefaultConfigUpdate(
  projectRoot: string,
  schemaName: string
): Promise<PreparedConfigUpdate> {
  const configPath =
    resolveConfigFilePath(projectRoot) ??
    path.join(projectRoot, 'openspec', 'config.yaml');
  FileSystemUtils.assertProjectArtifactPath(projectRoot, configPath);

  if (fs.existsSync(configPath)) {
    const stats = fs.lstatSync(configPath);
    if (stats.isSymbolicLink()) {
      throw new Error(
        `Cannot set the default schema: ${path.basename(configPath)} must be a regular file, not a symbolic link`
      );
    }
    if (!stats.isFile()) {
      throw new Error(
        `Cannot set the default schema: ${path.basename(configPath)} must be a regular file`
      );
    }
    if (
      !(await FileSystemUtils.canWriteFile(configPath)) ||
      !(await FileSystemUtils.canWriteFile(path.dirname(configPath)))
    ) {
      throw new Error(
        `Cannot set the default schema: ${path.basename(configPath)} is not writable`
      );
    }

    const originalContent = fs.readFileSync(configPath);
    const config = parseDocument(originalContent.toString('utf-8'));
    if (config.errors.length > 0) {
      throw new Error(
        `Cannot set the default schema: ${path.basename(configPath)} is invalid YAML`
      );
    }
    if (config.contents !== null && !isMap(config.contents)) {
      throw new Error(
        `Cannot set the default schema: ${path.basename(configPath)} must contain a YAML object`
      );
    }
    config.set('schema', schemaName);
    config.delete('defaultSchema');

    return {
      path: configPath,
      content: Buffer.from(config.toString()),
      originalContent,
      originalMode: stats.mode,
    };
  }

  if (!(await FileSystemUtils.canWriteFile(configPath))) {
    throw new Error(
      `Cannot set the default schema: ${path.dirname(configPath)} is not writable`
    );
  }

  return {
    path: configPath,
    content: Buffer.from(stringifyYaml({ schema: schemaName })),
    originalContent: null,
    originalMode: null,
  };
}

function configMatchesPreparedState(prepared: PreparedConfigUpdate): boolean {
  if (prepared.originalContent === null) {
    return !fs.existsSync(prepared.path);
  }
  if (!fs.existsSync(prepared.path)) return false;

  const stats = fs.lstatSync(prepared.path);
  return (
    stats.isFile() &&
    !stats.isSymbolicLink() &&
    stats.mode === prepared.originalMode &&
    fs.readFileSync(prepared.path).equals(prepared.originalContent)
  );
}

/**
 * Default artifacts with descriptions for schema init.
 */
const DEFAULT_ARTIFACTS: Array<{
  id: string;
  description: string;
  generates: string;
  template: string;
}> = [
  {
    id: 'proposal',
    description: '変更の概要・動機・範囲の説明',
    generates: 'proposal.md',
    template: 'proposal.md',
  },
  {
    id: 'specs',
    description: '要件とシナリオを含む詳細仕様',
    generates: 'specs/**/*.md',
    template: 'specs/spec.md',
  },
  {
    id: 'design',
    description: '技術的な設計判断と実装方針',
    generates: 'design.md',
    template: 'design.md',
  },
  {
    id: 'tasks',
    description: '追跡可能なタスク付きの実装チェックリスト',
    generates: 'tasks.md',
    template: 'tasks.md',
  },
];

/**
 * Register the schema command and all its subcommands.
 */
export function registerSchemaCommand(program: Command): void {
  const schemaCmd = program
    .command('schema')
    .description('ワークフロースキーマを管理（実験的）');

  // Experimental warning
  schemaCmd.hook('preAction', () => {
    console.error('注意: スキーマコマンドは実験的で、将来変更される可能性があります。');
  });

  // schema which
  schemaCmd
    .command('which [name]')
    .description('スキーマの解決元を表示')
    .option('--json', 'JSON で出力')
    .option('--all', 'すべてのスキーマと解決元を一覧表示')
    .action(async (name?: string, options?: { json?: boolean; all?: boolean }) => {
      try {
        const projectRoot = process.cwd();

        if (options?.all) {
          // List all schemas
          const schemas = getAllSchemasWithResolution(projectRoot);

          if (options?.json) {
            console.log(JSON.stringify(schemas, null, 2));
          } else {
            if (schemas.length === 0) {
              console.log('スキーマが見つかりません。');
              return;
            }

            // Group by source
            const bySource = {
              project: schemas.filter((s) => s.source === 'project'),
              user: schemas.filter((s) => s.source === 'user'),
              package: schemas.filter((s) => s.source === 'package'),
            };

            if (bySource.project.length > 0) {
              console.log('\nプロジェクトのスキーマ:');
              for (const schema of bySource.project) {
                const shadowInfo = schema.shadows.length > 0
                  ? ` (上書き対象: ${schema.shadows.map((s) => s.source).join(', ')})`
                  : '';
                console.log(`  ${schema.name}${shadowInfo}`);
              }
            }

            if (bySource.user.length > 0) {
              console.log('\nユーザーのスキーマ:');
              for (const schema of bySource.user) {
                const shadowInfo = schema.shadows.length > 0
                  ? ` (上書き対象: ${schema.shadows.map((s) => s.source).join(', ')})`
                  : '';
                console.log(`  ${schema.name}${shadowInfo}`);
              }
            }

            if (bySource.package.length > 0) {
              console.log('\nパッケージのスキーマ:');
              for (const schema of bySource.package) {
                console.log(`  ${schema.name}`);
              }
            }
          }
          return;
        }

        if (!name) {
          console.error('エラー: スキーマ名が必要です（--all で全スキーマを一覧表示できます）');
          process.exitCode = 1;
          return;
        }

        const resolution = getSchemaResolution(name, projectRoot);

        if (!resolution) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              error: `スキーマ '${name}' が見つかりません`,
              available,
            }, null, 2));
          } else {
            console.error(`エラー: スキーマ '${name}' が見つかりません`);
            console.error(`利用可能なスキーマ: ${available.join(', ')}`);
          }
          process.exitCode = 1;
          return;
        }

        if (options?.json) {
          console.log(JSON.stringify(resolution, null, 2));
        } else {
          console.log(`スキーマ: ${resolution.name}`);
          console.log(`ソース: ${resolution.source}`);
          console.log(`パス: ${resolution.path}`);

          if (resolution.shadows.length > 0) {
            console.log('\n上書き対象:');
            for (const shadow of resolution.shadows) {
              console.log(`  ${shadow.source}: ${shadow.path}`);
            }
          }
        }
      } catch (error) {
        console.error(`エラー: ${(error as Error).message}`);
        process.exitCode = 1;
      }
  });

  // schema validate
  schemaCmd
    .command('validate [name]')
    .description('スキーマ構造とテンプレートを検証')
    .option('--json', 'JSON で出力')
    .option('--verbose', '詳細な検証手順を表示')
    .action(async (name?: string, options?: { json?: boolean; verbose?: boolean }) => {
      try {
        const projectRoot = process.cwd();

        if (!name) {
          // Validate all project schemas
          const projectSchemasDir = getProjectSchemasDir(projectRoot);

          if (!fs.existsSync(projectSchemasDir)) {
            if (options?.json) {
              console.log(JSON.stringify({
                valid: true,
                message: 'プロジェクトのスキーマディレクトリが見つかりません',
                schemas: [],
              }, null, 2));
            } else {
              console.log('プロジェクトのスキーマディレクトリが見つかりません。');
            }
            return;
          }

          const entries = fs.readdirSync(projectSchemasDir, { withFileTypes: true });
          const schemaResults: Array<{
            name: string;
            path: string;
            valid: boolean;
            issues: ValidationIssue[];
          }> = [];

          let anyInvalid = false;

          for (const entry of entries) {
            if (!isSchemaDir(projectSchemasDir, entry)) continue;

            const schemaDir = path.join(projectSchemasDir, entry.name);
            const schemaPath = path.join(schemaDir, 'schema.yaml');

            if (!fs.existsSync(schemaPath)) continue;

            if (options?.verbose && !options?.json) {
              console.log(`\n${entry.name} を検証中...`);
            }

            const result = validateSchema(schemaDir, options?.verbose && !options?.json);
            schemaResults.push({
              name: entry.name,
              path: schemaDir,
              valid: result.valid,
              issues: result.issues,
            });

            if (!result.valid) {
              anyInvalid = true;
            }
          }

          if (options?.json) {
            console.log(JSON.stringify({
              valid: !anyInvalid,
              schemas: schemaResults,
            }, null, 2));
          } else {
            if (schemaResults.length === 0) {
              console.log('プロジェクト内にスキーマが見つかりません。');
              return;
            }

            console.log('\n検証結果:');
            for (const result of schemaResults) {
              const status = result.valid ? '✓' : '✗';
              console.log(`  ${status} ${result.name}`);
              for (const issue of result.issues) {
                console.log(`    ${issue.level}: ${issue.message}`);
              }
            }
          }

          if (anyInvalid) {
            process.exitCode = 1;
          }
          return;
        }

        // Validate specific schema
        const schemaDir = getSchemaDir(name, projectRoot);

        if (!schemaDir) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              valid: false,
              error: `スキーマ '${name}' が見つかりません`,
              available,
            }, null, 2));
          } else {
            console.error(`エラー: スキーマ '${name}' が見つかりません`);
            console.error(`利用可能なスキーマ: ${available.join(', ')}`);
          }
          process.exitCode = 1;
          return;
        }

        if (options?.verbose && !options?.json) {
          console.log(`${name} を検証中...`);
        }

        const result = validateSchema(schemaDir, options?.verbose && !options?.json);

        if (options?.json) {
          console.log(JSON.stringify({
            name,
            path: schemaDir,
            valid: result.valid,
            issues: result.issues,
          }, null, 2));
        } else {
          if (result.valid) {
            console.log(`✓ スキーマ '${name}' は有効です`);
          } else {
            console.log(`✗ スキーマ '${name}' にエラーがあります:`);
            for (const issue of result.issues) {
              console.log(`  ${issue.level}: ${issue.message}`);
            }
          }
        }
        if (!result.valid) {
          process.exitCode = 1;
        }
      } catch (error) {
        if (options?.json) {
          console.log(JSON.stringify({
            valid: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(`エラー: ${(error as Error).message}`);
        }
        process.exitCode = 1;
      }
  });

  // schema fork
  schemaCmd
    .command('fork <source> [name]')
    .description('既存スキーマをプロジェクトにコピーしてカスタマイズ')
    .option('--json', 'JSON で出力')
    .option('--force', '既存の出力先を上書き')
    .action(async (source: string, name?: string, options?: { json?: boolean; force?: boolean }) => {
      const spinner = options?.json ? null : ora();

      try {
        const projectRoot = process.cwd();
        const destinationName = name || `${source}-custom`;

        // Validate destination name
        if (!isValidSchemaName(destinationName)) {
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: `無効なスキーマ名 '${destinationName}' です。kebab-case を使用してください（例: my-workflow）`,
            }, null, 2));
          } else {
            console.error(`エラー: 無効なスキーマ名 '${destinationName}' です`);
            console.error('スキーマ名は kebab-case にしてください（例: my-workflow）');
          }
          process.exitCode = 1;
          return;
        }

        // Find source schema
        const sourceDir = getSchemaDir(source, projectRoot);
        if (!sourceDir) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: `スキーマ '${source}' が見つかりません`,
              available,
            }, null, 2));
          } else {
            console.error(`エラー: スキーマ '${source}' が見つかりません`);
            console.error(`利用可能なスキーマ: ${available.join(', ')}`);
          }
          process.exitCode = 1;
          return;
        }

        // Determine source location
        const sourceResolution = getSchemaResolution(source, projectRoot);
        const sourceLocation = sourceResolution?.source || 'package';

        // Validate the complete source before a forced fork removes anything.
        const trustedSourceDir = fs.realpathSync(sourceDir);
        assertSchemaTreeCanBeCopied(trustedSourceDir);

        // Validate the source's schema content up front too, so a structurally
        // invalid source is rejected before the --force path can remove an
        // existing destination. This keeps `fork --force` atomic — an unusable
        // source never destroys a valid destination — matching `schema init`,
        // which likewise validates before it overwrites.
        parseSchema(
          fs.readFileSync(path.join(trustedSourceDir, 'schema.yaml'), 'utf-8')
        );

        // Check destination
        const schemasDir = getProjectSchemasDir(projectRoot);
        const destinationDir = path.join(schemasDir, destinationName);

        // Reject a self-fork. Forking a schema onto itself with --force would
        // otherwise remove the source at the replacement step below and then
        // fail the copy, destroying the only copy of the schema. Resolve both
        // sides to their real paths (realpathSync follows symlinks; path.resolve
        // is a fallback only for a destination that does not exist yet) so a
        // symlink or a `.`/`..` spelling of the same directory is still caught.
        const resolvedDestination = fs.existsSync(destinationDir)
          ? fs.realpathSync(destinationDir)
          : path.resolve(destinationDir);
        if (resolvedDestination === trustedSourceDir) {
          throw new Error(
            `スキーマ '${source}' を自身へ複製することはできません。別の出力先名を指定してください`
          );
        }

        const destinationExists = fs.existsSync(destinationDir);
        if (destinationExists && !options?.force) {
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: `スキーマ '${destinationName}' は既に存在します`,
              suggestion: '--force で上書きできます',
            }, null, 2));
          } else {
            console.error(`エラー: スキーマ '${destinationName}' は既に存在します: ${destinationDir}`);
            console.error('--force で上書きできます');
          }
          process.exitCode = 1;
          return;
        }

        // Fingerprint the destination the user authorized us to overwrite, BEFORE
        // we spend time staging. Staging can take a while, and a concurrent
        // process may edit the destination in that window; the fingerprint lets
        // us detect such a change and abort rather than clobber it.
        const authorizedDestinationFingerprint = destinationExists
          ? fingerprintDir(destinationDir)
          : null;

        // Stage the complete fork in a temporary sibling directory first, then
        // swap it into place. This keeps `fork --force` atomic: an existing
        // destination is only removed once the new fork has been fully copied,
        // name-updated, and (via the up-front parseSchema above) validated. Any
        // failure while staging leaves both the source and the existing
        // destination exactly as they were.
        if (spinner) spinner.start(`'${source}' を '${destinationName}' に複製中...`);
        fs.mkdirSync(schemasDir, { recursive: true });
        const stagingDir = fs.mkdtempSync(path.join(schemasDir, '.fork-staging-'));
        try {
          copyDirRecursive(trustedSourceDir, stagingDir);

          // Update name in the staged schema.yaml via yaml's Document API
          // instead of re-serializing the parsed object, so block scalars,
          // comments, and key order in the source schema.yaml survive the fork.
          const stagedSchemaPath = path.join(stagingDir, 'schema.yaml');
          const schemaContent = fs.readFileSync(stagedSchemaPath, 'utf-8');
          const doc = parseDocument(schemaContent);
          doc.set('name', destinationName);
          fs.writeFileSync(stagedSchemaPath, doc.toString());

          // Authoritative gate: validate the COMPLETED staged schema — the exact
          // bytes we are about to install — not just the source at the pre-check.
          // The source files copyDirRecursive reads can change mid-copy, so a
          // source that was valid up front can still produce an invalid staged
          // fork. Validating here, before ANY destructive step, guarantees we
          // never install an invalid fork or delete a valid destination for one.
          try {
            parseSchema(fs.readFileSync(stagedSchemaPath, 'utf-8'));
          } catch (validationError) {
            throw new Error(
              `'${source}' から準備した複製は有効なスキーマではありません（複製中にソースが変更された可能性があります）。` +
                `処理を中止したため、'${destinationName}' は変更していません。`,
              { cause: validationError }
            );
          }

          // Swap the staged fork into place. When a destination already exists,
          // move it aside to a sibling backup FIRST, then install the staged
          // fork; only once the install succeeds is the backup discarded. If the
          // install rename itself fails (e.g. a Windows lock), the backup is
          // moved back so the user's original destination is never lost.
          if (destinationExists) {
            if (spinner) spinner.text = `既存のスキーマ '${destinationName}' を置き換え中...`;

            // Revalidate immediately before the destructive move: if the
            // destination changed on disk while we were staging (or was removed),
            // its fingerprint no longer matches what the user authorized. Abort
            // WITHOUT touching it, so the concurrent changes are preserved. The
            // outer catch cleans up staging.
            const currentFingerprint = fs.existsSync(destinationDir)
              ? fingerprintDir(destinationDir)
              : null;
            if (currentFingerprint !== authorizedDestinationFingerprint) {
              throw new Error(
                `複製の準備中に ${destinationDir} のスキーマ '${destinationName}' がディスク上で変更されました。` +
                  `同時変更を保護するため中止したので、上書きは行っていません。現在の内容を上書きする場合は、複製をもう一度実行してください。`
              );
            }

            const backupDir = `${destinationDir}.fork-backup-${process.pid}-${Date.now()}`;
            fs.renameSync(destinationDir, backupDir);
            try {
              fs.renameSync(stagingDir, destinationDir);
            } catch (installError) {
              // Install failed after the original was moved aside. Try to move
              // it back. If that restore ALSO fails, the original is stranded in
              // the backup dir — surface an error naming both the backup and the
              // destination so the user can recover manually, and attach the
              // original install error as the cause. Never swallow this.
              try {
                fs.renameSync(backupDir, destinationDir);
              } catch (restoreError) {
                throw new Error(
                  `複製したスキーマの配置に失敗し、以前の '${destinationName}' も復元できませんでした。` +
                    `以前のスキーマは ${backupDir} に保存されています。${destinationDir} へ戻すと復元できます。` +
                    `復元エラー: ${(restoreError as Error).message}`,
                  { cause: installError }
                );
              }
              throw installError;
            }

            // Revalidate before discarding the backup: only delete it if it is
            // still byte-for-byte the original destination we moved aside. If it
            // changed during the install window (a concurrent write to the
            // moved-aside directory), do NOT delete it — leave it in place and
            // surface where it is so nothing is lost.
            if (fingerprintDir(backupDir) === authorizedDestinationFingerprint) {
              fs.rmSync(backupDir, { recursive: true, force: true });
            } else {
              console.error(
                `警告: 複製中に以前の '${destinationName}' が変更されたため、削除しませんでした。` +
                  `複製前の内容は ${backupDir} に保存されています。`
              );
            }
          } else {
            fs.renameSync(stagingDir, destinationDir);
          }
        } catch (error) {
          // Remove only the staging directory we created this run; the source
          // and any existing destination are left exactly as we found them.
          // Guard the cleanup in its own try/catch so a failed removal (e.g. a
          // locked file on Windows) can never mask the original error, then
          // rethrow so the real failure still drives the JSON/exit-code report.
          try {
            fs.rmSync(stagingDir, { recursive: true, force: true });
          } catch {
            // Best-effort cleanup; the original error below is what matters.
          }
          throw error;
        }

        if (spinner) spinner.succeed(`'${source}' を '${destinationName}' に複製しました`);

        if (options?.json) {
          console.log(JSON.stringify({
            forked: true,
            source,
            sourcePath: sourceDir,
            sourceLocation,
            destination: destinationName,
            destinationPath: destinationDir,
          }, null, 2));
        } else {
          console.log(`\nソース: ${sourceDir} (${sourceLocation})`);
          console.log(`出力先: ${destinationDir}`);
          console.log(`\n次の場所でスキーマをカスタマイズできます:`);
          console.log(`  ${destinationDir}/schema.yaml`);
        }
      } catch (error) {
        if (spinner) spinner.fail(`複製に失敗しました`);
        if (options?.json) {
          console.log(JSON.stringify({
            forked: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(`エラー: ${(error as Error).message}`);
        }
        process.exitCode = 1;
      }
  });

  // schema init
  schemaCmd
    .command('init <name>')
    .description('プロジェクトローカルのスキーマを作成')
    .option('--json', 'JSON で出力')
    .option('--description <text>', 'スキーマの説明')
    .option('--artifacts <list>', 'アーティファクトIDをカンマ区切りで指定（proposal,specs,design,tasks）')
    .option('--default', 'プロジェクトのデフォルトスキーマに設定')
    .option('--no-default', 'デフォルト設定の確認を省略')
    .option('--force', '既存のスキーマを上書き')
    .action(async (
      name: string,
      options?: {
        json?: boolean;
        description?: string;
        artifacts?: string;
        default?: boolean;
        force?: boolean;
      }
    ) => {
      const spinner = options?.json ? null : ora();

      try {
        const projectRoot = process.cwd();

        // Validate name
        if (!isValidSchemaName(name)) {
          if (options?.json) {
            console.log(JSON.stringify({
              created: false,
              error: `無効なスキーマ名 '${name}' です。kebab-case を使用してください（例: my-workflow）`,
            }, null, 2));
          } else {
            console.error(`エラー: 無効なスキーマ名 '${name}' です`);
            console.error('スキーマ名は kebab-case にしてください（例: my-workflow）');
          }
          process.exitCode = 1;
          return;
        }

        const schemaDir = path.join(getProjectSchemasDir(projectRoot), name);

        // Check overwrite permission without mutating the destination
        const schemaExists = fs.existsSync(schemaDir);
        if (schemaExists) {
          if (!options?.force) {
            if (options?.json) {
              console.log(JSON.stringify({
                created: false,
                error: `スキーマ '${name}' は既に存在します`,
                suggestion: '--force で上書きするか "openspec schema fork" で複製できます',
              }, null, 2));
            } else {
              console.error(`エラー: スキーマ '${name}' は既に存在します: ${schemaDir}`);
              console.error('--force で上書きするか "openspec schema fork" で複製できます');
            }
            process.exitCode = 1;
            return;
          }
        }

        // Determine artifacts and description
        let description: string;
        let selectedArtifactIds: string[];

        // Check if we have explicit flags (non-interactive mode)
        const hasExplicitOptions = options?.description !== undefined || options?.artifacts !== undefined;
        const isInteractive = !options?.json && !hasExplicitOptions && process.stdout.isTTY;

        if (isInteractive) {
          // Interactive mode
          const { input, checkbox, confirm } = await import('@inquirer/prompts');

          description = await input({
            message: 'スキーマの説明:',
            default: `${name} 向けのカスタムワークフロースキーマ`,
          });

          const artifactChoices = DEFAULT_ARTIFACTS.map((a) => ({
            name: a.id,
            value: a.id,
            checked: true,
          }));

          selectedArtifactIds = await checkbox({
            message: '含めるアーティファクトを選択:',
            theme: {
              icon: {
                checked: '[x]',
                unchecked: '[ ]',
              },
            },
            choices: artifactChoices,
          });

          if (selectedArtifactIds.length === 0) {
            console.error('エラー: 少なくとも1つのアーティファクトを選択してください');
            process.exitCode = 1;
            return;
          }

          // Ask about setting as default (unless --no-default was passed)
          if (options?.default === undefined) {
            const setAsDefault = await confirm({
              message: 'プロジェクトのデフォルトスキーマに設定しますか？',
              default: false,
            });

            if (setAsDefault) {
              options = { ...options, default: true };
            }
          }
        } else {
          // Non-interactive mode
          description = options?.description || `${name} 向けのカスタムワークフロースキーマ`;

          if (options?.artifacts) {
            selectedArtifactIds = options.artifacts.split(',').map((a) => a.trim());

            // Validate artifact IDs
            const validIds = DEFAULT_ARTIFACTS.map((a) => a.id);
            for (const id of selectedArtifactIds) {
              if (!validIds.includes(id)) {
                if (options?.json) {
                  console.log(JSON.stringify({
                    created: false,
                    error: `不明なアーティファクト '${id}'`,
                    valid: validIds,
                  }, null, 2));
                } else {
                  console.error(`エラー: 不明なアーティファクト '${id}'`);
                  console.error(`有効なアーティファクト: ${validIds.join(', ')}`);
                }
                process.exitCode = 1;
                return;
              }
            }
          } else {
            // Default to all artifacts
            selectedArtifactIds = DEFAULT_ARTIFACTS.map((a) => a.id);
          }
        }

        // Build artifacts array with proper dependencies
        const selectedArtifacts = selectedArtifactIds.map((id) => {
          const template = DEFAULT_ARTIFACTS.find((a) => a.id === id)!;
          const artifact: Artifact = {
            id: template.id,
            generates: template.generates,
            description: template.description,
            template: template.template,
            requires: [],
          };

          // Set up dependencies based on typical workflow
          if (id === 'specs' && selectedArtifactIds.includes('proposal')) {
            artifact.requires = ['proposal'];
          } else if (id === 'design' && selectedArtifactIds.includes('specs')) {
            artifact.requires = ['specs'];
          } else if (id === 'tasks') {
            const requires: string[] = [];
            if (selectedArtifactIds.includes('design')) requires.push('design');
            else if (selectedArtifactIds.includes('specs')) requires.push('specs');
            artifact.requires = requires;
          }

          return artifact;
        });

        // Create schema.yaml
        const schema: SchemaYaml = {
          name,
          version: 1,
          description,
          artifacts: selectedArtifacts,
        };

        // Add apply phase if tasks is included
        if (selectedArtifactIds.includes('tasks')) {
          schema.apply = {
            requires: ['tasks'],
            tracks: 'tasks.md',
          };
        }

        // スキーマファイルをステージングする前に設定を解析してシリアライズする。
        // これにより、不正な形式、オブジェクト以外、リンク、読み取り専用の設定は、
        // 既存スキーマの移動や新規スキーマの作成より先にエラーになる。
        const preparedConfig = options?.default
          ? await prepareDefaultConfigUpdate(projectRoot, name)
          : null;
        const schemasDir = getProjectSchemasDir(projectRoot);
        FileSystemUtils.assertProjectArtifactPath(projectRoot, schemaDir);
        const authorizedSchemaFingerprint = schemaExists
          ? fingerprintDir(schemaDir)
          : null;

        if (spinner) spinner.start(`スキーマ '${name}' を作成しています...`);
        fs.mkdirSync(schemasDir, { recursive: true });
        const schemaStagingDir = fs.mkdtempSync(
          path.join(schemasDir, '.init-staging-')
        );
        let configStagingDir: string | null = null;
        let stagedConfigPath: string | null = null;

        try {
          fs.writeFileSync(
            path.join(schemaStagingDir, 'schema.yaml'),
            stringifyYaml(schema)
          );

          const templatesDir = path.join(schemaStagingDir, 'templates');
          for (const artifact of selectedArtifacts) {
            const templatePath = path.join(templatesDir, artifact.template);
            fs.mkdirSync(path.dirname(templatePath), { recursive: true });
            fs.writeFileSync(templatePath, createDefaultTemplate(artifact.id));
          }

          const validation = validateSchema(schemaStagingDir);
          if (!validation.valid) {
            throw new Error(
              `Generated schema failed validation: ${validation.issues
                .map((issue) => issue.message)
                .join('; ')}`
            );
          }

          if (preparedConfig) {
            const configDir = path.dirname(preparedConfig.path);
            configStagingDir = fs.mkdtempSync(
              path.join(configDir, '.schema-init-config-')
            );
            stagedConfigPath = path.join(
              configStagingDir,
              path.basename(preparedConfig.path)
            );
            fs.writeFileSync(stagedConfigPath, preparedConfig.content);
            if (preparedConfig.originalMode !== null) {
              fs.chmodSync(stagedConfigPath, preparedConfig.originalMode);
            }
          }

          // Re-resolve both destinations immediately before the first move so
          // a parent symlink swap during staging cannot redirect the commit.
          FileSystemUtils.assertProjectArtifactPath(projectRoot, schemaDir);
          if (preparedConfig) {
            FileSystemUtils.assertProjectArtifactPath(projectRoot, preparedConfig.path);
          }

          const currentSchemaFingerprint = fs.existsSync(schemaDir)
            ? fingerprintDir(schemaDir)
            : null;
          if (currentSchemaFingerprint !== authorizedSchemaFingerprint) {
            throw new Error(
              `Schema '${name}' changed on disk while initialization was being prepared. ` +
                'Aborted to preserve those concurrent changes.'
            );
          }
          if (preparedConfig && !configMatchesPreparedState(preparedConfig)) {
            throw new Error(
              `${path.basename(preparedConfig.path)} changed on disk while initialization was being prepared. ` +
                'Aborted to preserve those concurrent changes.'
            );
          }

          const token = `${process.pid}-${Date.now()}`;
          const schemaBackup = `${schemaDir}.init-backup-${token}`;
          const configBackup = preparedConfig
            ? `${preparedConfig.path}.init-backup-${token}`
            : null;
          let schemaBackedUp = false;
          let configBackedUp = false;
          let schemaInstalled = false;
          let configInstalled = false;

          try {
            if (schemaExists) {
              schemaInitFileOperations.renameSync(schemaDir, schemaBackup);
              schemaBackedUp = true;
            }
            if (preparedConfig && preparedConfig.originalContent !== null) {
              schemaInitFileOperations.renameSync(preparedConfig.path, configBackup!);
              configBackedUp = true;
            }

            schemaInitFileOperations.renameSync(schemaStagingDir, schemaDir);
            schemaInstalled = true;
            if (preparedConfig && stagedConfigPath) {
              schemaInitFileOperations.renameSync(stagedConfigPath, preparedConfig.path);
              configInstalled = true;
            }
          } catch (installError) {
            const rollbackErrors: string[] = [];
            try {
              if (configInstalled && preparedConfig) {
                fs.rmSync(preparedConfig.path, { force: true });
              }
              if (configBackedUp && preparedConfig && configBackup) {
                schemaInitFileOperations.renameSync(configBackup, preparedConfig.path);
              }
            } catch (rollbackError) {
              rollbackErrors.push(`config: ${(rollbackError as Error).message}`);
            }
            try {
              if (schemaInstalled) {
                fs.rmSync(schemaDir, { recursive: true, force: true });
              }
              if (schemaBackedUp) {
                schemaInitFileOperations.renameSync(schemaBackup, schemaDir);
              }
            } catch (rollbackError) {
              rollbackErrors.push(`schema: ${(rollbackError as Error).message}`);
            }

            if (rollbackErrors.length > 0) {
              throw new Error(
                `Schema initialization failed and rollback was incomplete (${rollbackErrors.join(', ')}). ` +
                  `Recovery backups may remain beside ${schemaDir} and ${preparedConfig?.path ?? 'the config file'}.`,
                { cause: installError }
              );
            }
            throw installError;
          }

          // The transaction is committed. Cleanup cannot turn success into a
          // false failure, so leave a recoverable backup and warn if removal is
          // blocked instead of reporting that initialization failed.
          for (const backup of [
            schemaBackedUp ? schemaBackup : null,
            configBackedUp ? configBackup : null,
          ]) {
            if (!backup) continue;
            try {
              fs.rmSync(backup, { recursive: true, force: true });
            } catch (cleanupError) {
              console.error(
                `Warning: initialization succeeded, but the backup at ${backup} could not be removed: ${(cleanupError as Error).message}`
              );
            }
          }
        } catch (error) {
          try {
            fs.rmSync(schemaStagingDir, { recursive: true, force: true });
          } catch {
            // Best-effort cleanup must not hide the operation's real error.
          }
          throw error;
        } finally {
          if (configStagingDir) {
            try {
              fs.rmSync(configStagingDir, { recursive: true, force: true });
            } catch {
              // Best-effort cleanup. A committed config has already moved out.
            }
          }
        }

        if (spinner) spinner.succeed(`スキーマ '${name}' を作成しました`);

        if (options?.json) {
          console.log(JSON.stringify({
            created: true,
            path: schemaDir,
            schema: name,
            artifacts: selectedArtifactIds,
            setAsDefault: options?.default || false,
          }, null, 2));
        } else {
          console.log(`\nスキーマを作成しました: ${schemaDir}`);
          console.log(`\nアーティファクト: ${selectedArtifactIds.join(', ')}`);
          if (options?.default) {
            console.log(`\nプロジェクトのデフォルトスキーマに設定しました。`);
          }
          console.log(`\n次の手順:`);
          console.log(`  1. ${schemaDir}/schema.yaml を編集してアーティファクトを調整する`);
          console.log(`  2. スキーマディレクトリ内のテンプレートを編集する`);
          console.log(`  3. 利用例: openspec new --schema ${name}`);
        }
      } catch (error) {
        if (spinner) spinner.fail(`作成に失敗しました`);
        if (options?.json) {
          console.log(JSON.stringify({
            created: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(`エラー: ${(error as Error).message}`);
        }
        process.exitCode = 1;
      }
  });
}

/**
 * Create default template content for an artifact.
 */
function createDefaultTemplate(artifactId: string): string {
  switch (artifactId) {
    case 'proposal':
      return `## Why

<!-- この変更の動機を説明します -->

## What Changes

<!-- 何が変わるのかを説明します -->

## Capabilities

### 新しい能力
<!-- 追加する機能を列挙します -->

### Modified Capabilities
<!-- 変更する機能を列挙します -->

## Impact

<!-- 既存機能への影響を説明します -->
`;

    case 'specs':
      return `## ADDED Requirements

### Requirement: <!-- 要件名 -->

<!-- 要件の説明 -->

#### Scenario: <!-- シナリオ名 -->
- **WHEN** <!-- 条件 -->
- **THEN** <!-- 期待結果 -->
`;

    case 'design':
      return `## Context

<!-- 背景と現状 -->

## Goals / Non-Goals

**Goals:**
<!-- この設計で達成したいこと -->

**Non-Goals:**
<!-- 明確にスコープ外とすること -->

## Decisions

### 1. 決定事項名

決定内容と理由。

**検討した代替案:**
- 代替案1: 採用しなかった理由...

## Risks / Trade-offs

<!-- 既知のリスクとトレードオフ -->
`;

    case 'tasks':
      return `## Implementation Tasks

- [ ] タスク1
- [ ] タスク2
- [ ] タスク3
`;

    default:
      return `## ${artifactId}

<!-- ここに内容を追加 -->
`;
  }
}
