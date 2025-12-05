import { program } from 'commander';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { MarkdownParser } from '../core/parsers/markdown-parser.js';
import { Validator } from '../core/validation/validator.js';
import type { Spec } from '../core/schemas/index.js';
import { select } from '@inquirer/prompts';
import { isInteractive } from '../utils/interactive.js';
import { getSpecIds } from '../utils/item-discovery.js';

const SPECS_DIR = 'openspec/specs';

interface ShowOptions {
  json?: boolean;
  // JSON-only filters (raw-first text has no filters)
  requirements?: boolean;
  scenarios?: boolean; // --no-scenarios sets this to false (JSON only)
  requirement?: string; // JSON only
  noInteractive?: boolean;
}

function parseSpecFromFile(specPath: string, specId: string): Spec {
  const content = readFileSync(specPath, 'utf-8');
  const parser = new MarkdownParser(content);
  return parser.parseSpec(specId);
}

function validateRequirementIndex(spec: Spec, requirementOpt?: string): number | undefined {
  if (!requirementOpt) return undefined;
  const index = Number.parseInt(requirementOpt, 10);
  if (!Number.isInteger(index) || index < 1 || index > spec.requirements.length) {
    throw new Error(`Requirement ${requirementOpt} not found`);
  }
  return index - 1; // convert to 0-based
}

function filterSpec(spec: Spec, options: ShowOptions): Spec {
  const requirementIndex = validateRequirementIndex(spec, options.requirement);
  const includeScenarios = options.scenarios !== false && !options.requirements;

  const filteredRequirements = (requirementIndex !== undefined
    ? [spec.requirements[requirementIndex]]
    : spec.requirements
  ).map(req => ({
    text: req.text,
    scenarios: includeScenarios ? req.scenarios : [],
  }));

  const metadata = spec.metadata ?? { version: '1.0.0', format: 'openspec' as const };

  return {
    name: spec.name,
    overview: spec.overview,
    requirements: filteredRequirements,
    metadata,
  };
}

/**
 * Print the raw markdown content for a spec file without any formatting.
 * Raw-first behavior ensures text mode is a passthrough for deterministic output.
 */
function printSpecTextRaw(specPath: string): void {
  const content = readFileSync(specPath, 'utf-8');
  console.log(content);
}

export class SpecCommand {
  private SPECS_DIR = 'openspec/specs';

  async show(specId?: string, options: ShowOptions = {}): Promise<void> {
    if (!specId) {
      const canPrompt = isInteractive(options?.noInteractive);
      const specIds = await getSpecIds();
      if (canPrompt && specIds.length > 0) {
        specId = await select({
          message: '表示する仕様を選んでください',
          choices: specIds.map(id => ({ name: id, value: id })),
        });
      } else {
        throw new Error('必須引数 <spec-id> がありません');
      }
    }

    const specPath = join(this.SPECS_DIR, specId, 'spec.md');
    if (!existsSync(specPath)) {
      throw new Error(`Spec '${specId}' not found at openspec/specs/${specId}/spec.md`);
    }

    if (options.json) {
      if (options.requirements && options.requirement) {
        throw new Error('--requirements と --requirement は同時に使えません');
      }
      const parsed = parseSpecFromFile(specPath, specId);
      const filtered = filterSpec(parsed, options);
      const output = {
        id: specId,
        title: parsed.name,
        overview: parsed.overview,
        requirementCount: filtered.requirements.length,
        requirements: filtered.requirements,
        metadata: parsed.metadata ?? { version: '1.0.0', format: 'openspec' as const },
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }
    printSpecTextRaw(specPath);
  }
}

export function registerSpecCommand(rootProgram: typeof program) {
  const specCommand = rootProgram
    .command('spec')
    .description('OpenSpec の仕様を閲覧・管理');

  // Deprecation notice for noun-based commands
  specCommand.hook('preAction', () => {
    console.error('警告: "openspec spec ..." コマンドは非推奨です。"openspec show" や "openspec validate --specs" など動詞先行のコマンドを使ってください。');
  });

  specCommand
    .command('show [spec-id]')
    .description('特定の仕様を表示')
    .option('--json', 'JSON で出力')
    .option('--requirements', 'JSON専用: 要件のみ表示（シナリオ除外）')
    .option('--no-scenarios', 'JSON専用: シナリオを除外')
    .option('-r, --requirement <id>', 'JSON専用: 指定 ID(1始まり) の要件のみ表示')
    .option('--no-interactive', '対話プロンプトを無効化')
    .action(async (specId: string | undefined, options: ShowOptions & { noInteractive?: boolean }) => {
      try {
        const cmd = new SpecCommand();
        await cmd.show(specId, options as any);
      } catch (error) {
        console.error(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
        process.exitCode = 1;
      }
    });

  specCommand
    .command('list')
    .description('利用可能な仕様を一覧表示')
    .option('--json', 'JSON で出力')
    .option('--long', 'ID とタイトルを件数付きで表示')
    .action((options: { json?: boolean; long?: boolean }) => {
      try {
        if (!existsSync(SPECS_DIR)) {
          console.log('項目が見つかりません');
          return;
        }

        const specs = readdirSync(SPECS_DIR, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => {
            const specPath = join(SPECS_DIR, dirent.name, 'spec.md');
            if (existsSync(specPath)) {
              try {
                const spec = parseSpecFromFile(specPath, dirent.name);
                
                return {
                  id: dirent.name,
                  title: spec.name,
                  requirementCount: spec.requirements.length
                };
              } catch {
                return {
                  id: dirent.name,
                  title: dirent.name,
                  requirementCount: 0
                };
              }
            }
            return null;
          })
          .filter((spec): spec is { id: string; title: string; requirementCount: number } => spec !== null)
          .sort((a, b) => a.id.localeCompare(b.id));

        if (options.json) {
          console.log(JSON.stringify(specs, null, 2));
        } else {
          if (specs.length === 0) {
            console.log('No items found');
            return;
          }
          if (!options.long) {
            specs.forEach(spec => console.log(spec.id));
            return;
          }
          specs.forEach(spec => {
            console.log(`${spec.id}: ${spec.title} [requirements ${spec.requirementCount}]`);
          });
        }
      } catch (error) {
        console.error(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
        process.exitCode = 1;
      }
    });

  specCommand
    .command('validate [spec-id]')
    .description('仕様の構造を検証')
    .option('--strict', '厳密検証モードを有効化')
    .option('--json', '検証レポートを JSON 出力')
    .option('--no-interactive', '対話プロンプトを無効化')
    .action(async (specId: string | undefined, options: { strict?: boolean; json?: boolean; noInteractive?: boolean }) => {
      try {
        if (!specId) {
          const canPrompt = isInteractive(options?.noInteractive);
          const specIds = await getSpecIds();
          if (canPrompt && specIds.length > 0) {
            specId = await select({
              message: '検証する仕様を選んでください',
              choices: specIds.map(id => ({ name: id, value: id })),
            });
          } else {
            throw new Error('必須引数 <spec-id> がありません');
          }
        }

        const specPath = join(SPECS_DIR, specId, 'spec.md');
        
        if (!existsSync(specPath)) {
          throw new Error(`仕様 '${specId}' が見つかりません (openspec/specs/${specId}/spec.md)`);
        }

        const validator = new Validator(options.strict);
        const report = await validator.validateSpec(specPath);

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          if (report.valid) {
            console.log(`仕様 '${specId}' は有効です`);
          } else {
            console.error(`仕様 '${specId}' に問題があります`);
            report.issues.forEach(issue => {
              const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
              const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
              console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
            });
          }
        }
        process.exitCode = report.valid ? 0 : 1;
      } catch (error) {
        console.error(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
        process.exitCode = 1;
      }
    });

  return specCommand;
}
