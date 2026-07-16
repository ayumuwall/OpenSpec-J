import { promises as fs } from 'fs';
import path from 'path';
import { JsonConverter } from '../core/converters/json-converter.js';
import { Validator } from '../core/validation/validator.js';
import { ChangeParser } from '../core/parsers/change-parser.js';
import { Change } from '../core/schemas/index.js';
import type { RootOutput } from '../core/root-selection.js';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { getTaskProgressForChange } from '../utils/task-progress.js';

// Constants for better maintainability
const ARCHIVE_DIR = 'archive';

export class ChangeCommand {
  private converter: JsonConverter;
  private rootPath?: string;

  // rootPath is set only by root-aware callers (top-level `show`); the
  // deprecated noun-form commands stay cwd-based.
  constructor(rootPath?: string) {
    this.converter = new JsonConverter();
    this.rootPath = rootPath;
  }

  private getChangesPath(): string {
    return path.join(this.rootPath ?? process.cwd(), 'openspec', 'changes');
  }

  /**
   * Show a change proposal.
   * - Text mode: raw markdown passthrough (no filters)
   * - JSON mode: minimal object with deltas; --deltas-only returns same object with filtered deltas
   *   Note: --requirements-only is deprecated alias for --deltas-only
   */
  async show(changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; noInteractive?: boolean; rootOutput?: RootOutput }): Promise<void> {
    const changesPath = this.getChangesPath();

    if (!changeName) {
      const canPrompt = isInteractive(options);
      const changes = await this.getActiveChanges(changesPath);
      if (canPrompt && changes.length > 0) {
        const { select } = await import('@inquirer/prompts');
        const selected = await select({
          message: '表示する変更を選んでください',
          choices: changes.map(id => ({ name: id, value: id })),
        });
        changeName = selected;
      } else {
        if (changes.length === 0) {
          console.error('変更が指定されていません。アクティブな変更も見つかりません。');
        } else {
          console.error(`変更が指定されていません。利用可能な ID: ${changes.join(', ')}`);
        }
        console.error('ヒント: 利用可能な変更は "openspec change list" で確認できます。');
        process.exitCode = 1;
        return;
      }
    }

    const proposalPath = path.join(changesPath, changeName, 'proposal.md');

    try {
      await fs.access(proposalPath);
    } catch {
      throw new Error(`変更 "${changeName}" が ${proposalPath} に見つかりません`);
    }

    if (options?.json) {
      const jsonOutput = await this.converter.convertChangeToJson(proposalPath);

      if (options.requirementsOnly) {
        console.error('注意: --requirements-only は非推奨です。代わりに --deltas-only を使用してください。');
      }

      const parsed: Change = JSON.parse(jsonOutput);
      const contentForTitle = await fs.readFile(proposalPath, 'utf-8');
      const title = this.extractTitle(contentForTitle, changeName);
      const id = parsed.name;
      const deltas = parsed.deltas || [];

      const output = {
        id,
        title,
        deltaCount: deltas.length,
        deltas,
        ...(options.rootOutput ? { root: options.rootOutput } : {}),
      };
      console.log(JSON.stringify(output, null, 2));
    } else {
      const content = await fs.readFile(proposalPath, 'utf-8');
      console.log(content);
    }
  }

  /**
   * List active changes.
   * - Text default: IDs only; --long prints minimal details (title, counts)
   * - JSON: array of { id, title, deltaCount, taskStatus }, sorted by id
   */
  async list(options?: { json?: boolean; long?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'openspec', 'changes');
    
    const changes = await this.getActiveChanges(changesPath);
    
    if (options?.json) {
      const changeDetails = await Promise.all(
        changes.map(async (changeName) => {
          const proposalPath = path.join(changesPath, changeName, 'proposal.md');

          try {
            const content = await fs.readFile(proposalPath, 'utf-8');
            const changeDir = path.join(changesPath, changeName);
            const parser = new ChangeParser(content, changeDir);
            const change = await parser.parseChangeWithDeltas(changeName);

            // Resolve task progress through the shared tracked-tasks helper so
            // this deprecated noun-form list cannot re-fork the resolution (#1202).
            const taskStatus = await getTaskProgressForChange(changesPath, changeName, process.cwd());

            return {
              id: changeName,
              title: this.extractTitle(content, changeName),
              deltaCount: change.deltas.length,
              taskStatus,
            };
          } catch (error) {
            return {
              id: changeName,
              title: '不明',
              deltaCount: 0,
              taskStatus: { total: 0, completed: 0 },
            };
          }
        })
      );
      
      const sorted = changeDetails.sort((a, b) => a.id.localeCompare(b.id));
      console.log(JSON.stringify(sorted, null, 2));
    } else {
      if (changes.length === 0) {
        console.log('項目が見つかりません');
        return;
      }
      const sorted = [...changes].sort();
      if (!options?.long) {
        // IDs only
        sorted.forEach(id => console.log(id));
        return;
      }

      // Long format: id: title and minimal counts
      for (const changeName of sorted) {
        const proposalPath = path.join(changesPath, changeName, 'proposal.md');
        try {
          const content = await fs.readFile(proposalPath, 'utf-8');
          const title = this.extractTitle(content, changeName);
          const { total, completed } = await getTaskProgressForChange(changesPath, changeName, process.cwd());
          const taskStatusText = total > 0 ? ` [tasks ${completed}/${total}]` : '';
          const changeDir = path.join(changesPath, changeName);
          const parser = new ChangeParser(await fs.readFile(proposalPath, 'utf-8'), changeDir);
          const change = await parser.parseChangeWithDeltas(changeName);
          const deltaCountText = ` [差分 ${change.deltas.length}]`;
          console.log(`${changeName}: ${title}${deltaCountText}${taskStatusText}`);
        } catch {
          console.log(`${changeName}: (読み取れませんでした)`);
        }
      }
    }
  }

  async validate(changeName?: string, options?: { strict?: boolean; json?: boolean; noInteractive?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'openspec', 'changes');
    
    if (!changeName) {
      const canPrompt = isInteractive(options);
      const changes = await getActiveChangeIds();
      if (canPrompt && changes.length > 0) {
        const { select } = await import('@inquirer/prompts');
        const selected = await select({
          message: '検証する変更を選んでください',
          choices: changes.map(id => ({ name: id, value: id })),
        });
        changeName = selected;
      } else {
        if (changes.length === 0) {
          console.error('変更が指定されていません。アクティブな変更も見つかりません。');
        } else {
          console.error(`変更が指定されていません。利用可能な ID: ${changes.join(', ')}`);
        }
        console.error('ヒント: 利用可能な変更は "openspec change list" で確認できます。');
        process.exitCode = 1;
        return;
      }
    }
    
    const changeDir = path.join(changesPath, changeName);
    
    try {
      await fs.access(changeDir);
    } catch {
      throw new Error(`変更 "${changeName}" が見つかりません (${changeDir})`);
    }
    
    const validator = new Validator(options?.strict || false);
    const report = await validator.validateChangeDeltaSpecs(changeDir);
    
    if (options?.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      if (report.valid) {
        console.log(`変更 "${changeName}" は有効です`);
      } else {
        console.error(`変更 "${changeName}" に問題があります`);
        report.issues.forEach(issue => {
          const label = issue.level === 'ERROR' ? 'ERROR' : 'WARNING';
          const prefix = issue.level === 'ERROR' ? '✗' : '⚠';
          console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
        });
        // Next steps footer to guide fixing issues
        this.printNextSteps();
        if (!options?.json) {
          process.exitCode = 1;
        }
      }
    }
  }

  private async getActiveChanges(changesPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(changesPath, { withFileTypes: true });
      const result: string[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === ARCHIVE_DIR) continue;
        const proposalPath = path.join(changesPath, entry.name, 'proposal.md');
        try {
          await fs.access(proposalPath);
          result.push(entry.name);
        } catch {
          // skip directories without proposal.md
        }
      }
      return result.sort();
    } catch {
      return [];
    }
  }

  private extractTitle(content: string, changeName: string): string {
    const match = content.match(/^#\s+(?:Change:\s+)?(.+)$/im);
    return match ? match[1].trim() : changeName;
  }

  private printNextSteps(): void {
    const bullets: string[] = [];
    bullets.push('- 変更に specs/ 配下の差分があることを確認（## ADDED/MODIFIED/REMOVED/RENAMED Requirements 見出しを使用）');
    bullets.push('- 各 Requirement には少なくとも1つの #### Scenario: ブロックが必要');
    bullets.push('- パース結果の確認: openspec change show <id> --json --deltas-only');
    console.error('次のステップ:');
    bullets.forEach(b => console.error(`  ${b}`));
  }
}
