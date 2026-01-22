import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { stringify as stringifyYaml } from 'yaml';
import {
  getSchemaDir,
  getProjectSchemasDir,
  getUserSchemasDir,
  getPackageSchemasDir,
  listSchemas,
} from '../core/artifact-graph/resolver.js';
import { parseSchema, SchemaValidationError } from '../core/artifact-graph/schema.js';
import type { SchemaYaml, Artifact } from '../core/artifact-graph/types.js';

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

  // Check template files exist
  // Templates can be in schemaDir directly or in a templates/ subdirectory
  if (verbose) {
    console.log('  テンプレートファイルを確認中...');
  }
  for (const artifact of schema.artifacts) {
    // Try templates subdirectory first (standard location), then root
    const templatePathInTemplates = path.join(schemaDir, 'templates', artifact.template);
    const templatePathInRoot = path.join(schemaDir, artifact.template);

    if (!fs.existsSync(templatePathInTemplates) && !fs.existsSync(templatePathInRoot)) {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: `アーティファクト '${artifact.id}' のテンプレートファイル '${artifact.template}' が見つかりません`,
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
function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
            if (!entry.isDirectory()) continue;

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

            if (anyInvalid) {
              process.exitCode = 1;
            }
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
            process.exitCode = 1;
          }
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

        // Check destination
        const destinationDir = path.join(getProjectSchemasDir(projectRoot), destinationName);

        if (fs.existsSync(destinationDir)) {
          if (!options?.force) {
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

          // Remove existing
          if (spinner) spinner.start(`既存のスキーマ '${destinationName}' を削除中...`);
          fs.rmSync(destinationDir, { recursive: true });
        }

        // Copy schema
        if (spinner) spinner.start(`'${source}' を '${destinationName}' に複製中...`);
        copyDirRecursive(sourceDir, destinationDir);

        // Update name in schema.yaml
        const destSchemaPath = path.join(destinationDir, 'schema.yaml');
        const schemaContent = fs.readFileSync(destSchemaPath, 'utf-8');
        const schema = parseSchema(schemaContent);
        schema.name = destinationName;

        fs.writeFileSync(destSchemaPath, stringifyYaml(schema));

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

        // Check if exists
        if (fs.existsSync(schemaDir)) {
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

          if (spinner) spinner.start(`既存のスキーマ '${name}' を削除中...`);
          fs.rmSync(schemaDir, { recursive: true });
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

        // Create schema directory
        if (spinner) spinner.start(`スキーマ '${name}' を作成中...`);
        fs.mkdirSync(schemaDir, { recursive: true });

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

        fs.writeFileSync(
          path.join(schemaDir, 'schema.yaml'),
          stringifyYaml(schema)
        );

        // Create template files in templates/ subdirectory (standard location)
        const templatesDir = path.join(schemaDir, 'templates');
        for (const artifact of selectedArtifacts) {
          const templatePath = path.join(templatesDir, artifact.template);
          const templateDir = path.dirname(templatePath);

          if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir, { recursive: true });
          }

          // Create default template content
          const templateContent = createDefaultTemplate(artifact.id);
          fs.writeFileSync(templatePath, templateContent);
        }

        // Update config if --default
        if (options?.default) {
          const configPath = path.join(projectRoot, 'openspec', 'config.yaml');

          if (fs.existsSync(configPath)) {
            const { parse: parseYaml, stringify: stringifyYaml2 } = await import('yaml');
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const config = parseYaml(configContent) || {};
            config.defaultSchema = name;
            fs.writeFileSync(configPath, stringifyYaml2(config));
          } else {
            // Create config file
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
              fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(configPath, stringifyYaml({ defaultSchema: name }));
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

### New Capabilities
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
