import { promises as fs } from 'fs';
import path from 'path';
import { JsonConverter } from '../core/converters/json-converter.js';
import { Validator } from '../core/validation/validator.js';
import { VALIDATION_MESSAGES } from '../core/validation/constants.js';
import { ChangeParser } from '../core/parsers/change-parser.js';
import { Change } from '../core/schemas/index.js';
import type { RootOutput } from '../core/root-selection.js';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { getTaskProgressForChange } from '../utils/task-progress.js';

/**
 * True only when `target` is definitively absent. An EACCES or I/O failure
 * means existence cannot be determined, so callers fall through to their
 * read-error path rather than claim the file was never written.
 */
async function isDefinitelyMissing(target: string): Promise<boolean> {
  return fs
    .access(target)
    .then(() => false)
    .catch((error: NodeJS.ErrnoException) => error?.code === 'ENOENT');
}

/**
 * A change is a directory directly under changes/. Rejecting anything else up
 * front keeps a traversing name (`../..`) from reading a proposal outside the
 * changes directory, and keeps the missing-proposal message honest.
 */
function isChangeDirectoryName(changesPath: string, changeDir: string): boolean {
  return path.dirname(path.resolve(changeDir)) === path.resolve(changesPath);
}

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
      // Offer exactly the changes `show <name>` can resolve.
      const changes = await getActiveChangeIds(this.rootPath ?? process.cwd());
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

    const changeDir = path.join(changesPath, changeName);
    const proposalPath = path.join(changeDir, 'proposal.md');

    if (!isChangeDirectoryName(changesPath, changeDir)) {
      throw new Error(`変更 "${changeName}" が ${proposalPath} に見つかりません`);
    }

    try {
      await fs.access(proposalPath);
    } catch {
      // A change can exist without a proposal: `openspec new change` scaffolds
      // only .openspec.yaml, and a custom schema need not define a proposal
      // artifact. Say which of the two cases this is instead of reporting a
      // change that does exist as missing. A stray file under changes/ is not a
      // change, and naming it one would point the user at a `status --change`
      // call that cannot work.
      const isChangeDirectory = await fs
        .stat(changeDir)
        .then((stats) => stats.isDirectory())
        .catch(() => false);
      if (isChangeDirectory) {
        throw new Error(
          `変更 "${changeName}" にはまだ proposal.md がありません。` +
            `次に作成するアーティファクトは "openspec status --change ${changeName}" で確認できます。`
        );
      }
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
    
    // Same directory-based resolution as `openspec list`, the command this
    // deprecated alias points users at. Every output path below already
    // tolerates a change whose proposal.md is missing or unreadable.
    const changes = await getActiveChangeIds();

    if (options?.json) {
      const changeDetails = await Promise.all(
        changes.map(async (changeName) => {
          const changeDir = path.join(changesPath, changeName);
          const proposalPath = path.join(changeDir, 'proposal.md');

          // Resolve task progress through the shared tracked-tasks helper so
          // this deprecated noun-form list cannot re-fork the resolution
          // (#1202). Tasks are independent of the proposal: a change can carry
          // tasks before, or without, a proposal.md.
          const taskStatus = await getTaskProgressForChange(changesPath, changeName, process.cwd());

          // No proposal yet is an ordinary state (scaffolded change, or a
          // schema with no proposal artifact), so name the change rather than
          // labelling it Unknown. Unknown stays for a proposal that exists but
          // cannot be read or parsed.
          if (await isDefinitelyMissing(proposalPath)) {
            return { id: changeName, title: changeName, deltaCount: 0, taskStatus };
          }

          try {
            const content = await fs.readFile(proposalPath, 'utf-8');
            const parser = new ChangeParser(content, changeDir);
            const change = await parser.parseChangeWithDeltas(changeName);

            return {
              id: changeName,
              title: this.extractTitle(content, changeName),
              deltaCount: change.deltas.length,
              taskStatus,
            };
          } catch {
            return { id: changeName, title: '不明', deltaCount: 0, taskStatus };
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
        const changeDir = path.join(changesPath, changeName);
        const proposalPath = path.join(changeDir, 'proposal.md');
        const { total, completed } = await getTaskProgressForChange(changesPath, changeName, process.cwd());
        const taskStatusText = total > 0 ? ` [tasks ${completed}/${total}]` : '';
        if (await isDefinitelyMissing(proposalPath)) {
          console.log(`${changeName}: (no proposal.md yet)${taskStatusText}`);
          continue;
        }
        try {
          const content = await fs.readFile(proposalPath, 'utf-8');
          const title = this.extractTitle(content, changeName);
          const parser = new ChangeParser(content, changeDir);
          const change = await parser.parseChangeWithDeltas(changeName);
          const deltaCountText = ` [差分 ${change.deltas.length}]`;
          console.log(`${changeName}: ${title}${deltaCountText}${taskStatusText}`);
        } catch {
          console.log(`${changeName}: (読み取れませんでした)${taskStatusText}`);
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
        this.printNextSteps(report.issues);
        if (!options?.json) {
          process.exitCode = 1;
        }
      }
    }
  }

  private extractTitle(content: string, changeName: string): string {
    const match = content.match(/^#\s+(?:Change:\s+)?(.+)$/im);
    return match ? match[1].trim() : changeName;
  }

  private printNextSteps(issues: Array<{ message: string }> = []): void {
    const bullets: string[] = [];
    // Branch on the exact marker messages: the generic no-deltas guidance
    // also mentions skip_specs and must not trigger the marker bullets.
    const conflictIssue = issues.some(i =>
      i.message.includes(VALIDATION_MESSAGES.CHANGE_SKIP_SPECS_CONFLICT)
    );
    const invalidMarkerIssue = issues.some(i =>
      i.message.includes(VALIDATION_MESSAGES.CHANGE_SKIP_SPECS_INVALID_METADATA)
    );
    if (conflictIssue) {
      bullets.push('- この変更は skip_specs（仕様差分なし）を宣言しています。specs/ 配下のファイルを削除するか、要件が変わる場合は .openspec.yaml から skip_specs を削除してください');
      bullets.push('- skip_specs は .openspec.yaml が有効な変更メタデータの場合だけ使用できます（schema: <name> が必要です）');
    } else if (invalidMarkerIssue) {
      bullets.push('- skip_specs を使用できるよう .openspec.yaml を修正してください（schema: <name> が必要です）');
      bullets.push('- または .openspec.yaml から skip_specs を削除し、仕様差分を追加してください');
    } else {
      bullets.push('- 変更に specs/ 配下の差分があることを確認（## ADDED/MODIFIED/REMOVED/RENAMED Requirements 見出しを使用）');
      bullets.push('- 各 Requirement には少なくとも1つの #### Scenario: ブロックが必要');
      bullets.push('- パース結果の確認: openspec change show <id> --json --deltas-only');
    }
    console.error('次のステップ:');
    bullets.forEach(b => console.error(`  ${b}`));
  }
}
