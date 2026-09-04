import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { JsonConverter } from '../core/converters/json-converter.js';
import { Validator } from '../core/validation/validator.js';
import { VALIDATION_MESSAGES } from '../core/validation/constants.js';
import { ChangeParser } from '../core/parsers/change-parser.js';
import { Change, Delta } from '../core/schemas/index.js';
import type { RootOutput } from '../core/root-selection.js';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { getTaskProgressForChange } from '../utils/task-progress.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { discoverSpecFiles } from '../utils/spec-discovery.js';
import {
  foldRequirementName,
  parseDeltaSpec,
} from '../core/parsers/requirement-blocks.js';
import {
  extractRequirementBlock,
  diffRequirementBlock,
  buildRenameMap,
} from '../utils/requirement-diff.js';

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

/** 仕様差分内の要件と、それに対応する本仕様の要件。 */
interface RequirementDiff {
  capability: string;
  operation: 'ADDED' | 'REMOVED' | 'RENAMED' | 'MODIFIED';
  requirementName: string;
  raw: string;
  diff?: string;
  rename?: { from: string; to: string };
  warning?: string;
}

/** `--diff` が MODIFIED 項目へ追加するフィールドを持つ JSON 差分。 */
type DeltaWithDiff = Delta & { diff?: string; warning?: string };

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

  // 本仕様は変更と同じルートを基準に解決する。これにより `--diff` は cwd 配下ではなく、
  // 選択されたストアの仕様を読み込む。
  private getSpecsPath(): string {
    return path.join(this.rootPath ?? process.cwd(), 'openspec', 'specs');
  }

  /**
   * Show a change proposal.
   * - Text mode: raw markdown passthrough (no filters)
   * - JSON mode: minimal object with deltas; --deltas-only returns same object with filtered deltas
   *   Note: --requirements-only is deprecated alias for --deltas-only
   * - --diff: 仕様差分と本仕様を要件単位で比較する。テキストモードでは末尾に追記し、
   *   JSON モードでは MODIFIED 差分に付与する
   */
  async show(changeName?: string, options?: { json?: boolean; requirementsOnly?: boolean; deltasOnly?: boolean; diff?: boolean; noInteractive?: boolean; rootOutput?: RootOutput }): Promise<void> {
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
    FileSystemUtils.assertPathWithin(path.dirname(proposalPath), proposalPath);

    if (options?.json) {
      FileSystemUtils.assertPathWithin(changeDir, proposalPath);
      const jsonOutput = await this.converter.convertChangeToJson(proposalPath);

      if (options.requirementsOnly) {
        console.error('注意: --requirements-only は非推奨です。代わりに --deltas-only を使用してください。');
      }

      const parsed: Change = JSON.parse(jsonOutput);
      FileSystemUtils.assertPathWithin(changeDir, proposalPath);
      const contentForTitle = await fs.readFile(proposalPath, 'utf-8');
      const title = this.extractTitle(contentForTitle, changeName);
      const id = parsed.name;
      const deltas = parsed.deltas || [];

      if (options.diff) {
        await this.enrichDeltasWithDiffs(deltas, changeName, changesPath);
      }

      const output = {
        id,
        title,
        deltaCount: deltas.length,
        deltas,
        ...(options.rootOutput ? { root: options.rootOutput } : {}),
      };
      console.log(JSON.stringify(output, null, 2));
    } else {
      FileSystemUtils.assertPathWithin(changeDir, proposalPath);
      const content = await fs.readFile(proposalPath, 'utf-8');
      console.log(content);

      if (options?.diff) {
        await this.showSpecDiffs(changeName, changesPath);
      }
    }
  }

  /**
   * 変更配下のすべての仕様差分を読み、各要件を対応する本仕様の要件と組み合わせる。
   * テキストモードと JSON モードはどちらもこの1回の結果から描画するため、
   * 2つの出力が食い違わない。
   */
  private async collectSpecDiffs(
    changeName: string,
    changesPath: string
  ): Promise<{ capabilities: string[]; results: RequirementDiff[] }> {
    const specsDir = path.join(changesPath, changeName, 'specs');
    const mainSpecsDir = this.getSpecsPath();

    // ChangeParser と同じ検索処理を使うため、入れ子の capability（specs/<area>/<id>）も
    // 黙ってスキップせず比較でき、ここで得る ID は JSON 差分の `spec` フィールドと一致する。
    const discovered = await discoverSpecFiles(specsDir);

    const capabilities = discovered.map(spec => spec.id);
    const results: RequirementDiff[] = [];

    for (const { id: capability, specFile: deltaSpecPath } of discovered) {
      const deltaContent = await fs.readFile(deltaSpecPath, 'utf-8');

      const mainSpecPath = path.join(mainSpecsDir, ...capability.split('/'), 'spec.md');
      let mainContent: string | null = null;
      try {
        FileSystemUtils.assertPathWithin(mainSpecsDir, mainSpecPath);
        mainContent = await fs.readFile(mainSpecPath, 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
        // 本仕様がディスク上にない。ADDED 要件なら通常の新規 capability だが、
        // MODIFIED 要件は後で不一致として扱う。
      }

      const plan = parseDeltaSpec(deltaContent);
      const renameMap = buildRenameMap(plan.renamed);

      for (const block of plan.added) {
        results.push({ capability, operation: 'ADDED', requirementName: block.name, raw: block.raw });
      }

      // Reason/Migration の内容も読者に届くよう、記述された REMOVED ブロックを優先する。
      // 箇条書き形式には名前しか含まれない。
      const removedBlocks = new Map(
        plan.removedBlocks.map(block => [foldRequirementName(block.name), block.raw])
      );
      for (const name of plan.removed) {
        const raw = removedBlocks.get(foldRequirementName(name));
        results.push({
          capability,
          operation: 'REMOVED',
          requirementName: name,
          raw: raw ?? `### Requirement: ${name}`,
        });
      }

      for (const rename of plan.renamed) {
        results.push({ capability, operation: 'RENAMED', requirementName: rename.to, raw: '', rename });
      }

      for (const block of plan.modified) {
        const entry: RequirementDiff = {
          capability,
          operation: 'MODIFIED',
          requirementName: block.name,
          raw: block.raw,
        };

        // 同じ差分内で改名・変更された要件は、本仕様ではまだ旧名のままなので旧名で検索する。
        const oldName = renameMap.get(foldRequirementName(block.name));
        const lookupName = oldName ?? block.name;

        const match = mainContent ? extractRequirementBlock(mainContent, lookupName) : null;
        if (match) {
          entry.diff = diffRequirementBlock(match.raw, block.raw, `${capability}/${block.name}`);
          if (!match.exact) {
            // アーカイブでは要件名を完全一致で照合するため、大文字・小文字や空白だけが
            // 異なる見出しはマージされない。意図した差分を表示すると同時に、修正しやすい
            // 段階で不一致を明示する。
            entry.warning =
              `本仕様の見出し "${match.name}" と大文字・小文字または空白だけが異なります。` +
              `アーカイブでは名前を完全一致で照合するため、事前に表記を統一してください`;
          }
        } else if (mainContent) {
          entry.warning = `${capability} の本仕様に "${lookupName}" と一致する要件が見つかりません`;
        } else {
          // MODIFIED 要件は既存のはずのブロックを指定するため、本仕様がない場合は
          // 新規 capability ではなく記述エラーとなる。すべて追加行として描画すると、
          // アーカイブで拒否される問題を隠してしまう。
          entry.warning =
            `openspec/specs/${capability}/spec.md に本仕様がないため、` +
            `MODIFIED 要件 "${block.name}" には比較対象がありません`;
        }

        results.push(entry);
      }
    }

    return { capabilities, results };
  }

  /**
   * JSON ペイロード内の各 MODIFIED 差分に `diff`（または `warning`）を付与する。
   * deltas 配列を直接変更する。
   *
   * パース済み Delta オブジェクトの `description` には見出し名ではなく要件本文が入る。
   * そのため、capability とソース内の順序でパース済みブロックに対応付ける。
   * ChangeParser は同じ順序で MODIFIED ブロックごとに1つの Delta を出力する。
   */
  private async enrichDeltasWithDiffs(deltas: Delta[], changeName: string, changesPath: string): Promise<void> {
    const modifiedDeltasBySpec = new Map<string, Delta[]>();
    for (const delta of deltas) {
      if (!delta.spec || delta.operation !== 'MODIFIED') continue;
      const list = modifiedDeltasBySpec.get(delta.spec) ?? [];
      list.push(delta);
      modifiedDeltasBySpec.set(delta.spec, list);
    }
    if (modifiedDeltasBySpec.size === 0) return;

    const { results } = await this.collectSpecDiffs(changeName, changesPath);
    const modifiedEntriesBySpec = new Map<string, RequirementDiff[]>();
    for (const entry of results) {
      if (entry.operation !== 'MODIFIED') continue;
      const list = modifiedEntriesBySpec.get(entry.capability) ?? [];
      list.push(entry);
      modifiedEntriesBySpec.set(entry.capability, list);
    }

    for (const [capability, modifiedDeltas] of modifiedDeltasBySpec) {
      const entries = modifiedEntriesBySpec.get(capability) ?? [];
      for (let i = 0; i < modifiedDeltas.length && i < entries.length; i++) {
        const entry = entries[i];
        if (entry.diff !== undefined) {
          (modifiedDeltas[i] as DeltaWithDiff).diff = entry.diff;
        }
        if (entry.warning !== undefined) {
          (modifiedDeltas[i] as DeltaWithDiff).warning = entry.warning;
        }
      }
    }
  }

  /** テキストモードで、仕様差分と本仕様の差分を要件単位に表示する。 */
  private async showSpecDiffs(changeName: string, changesPath: string): Promise<void> {
    const { capabilities, results } = await this.collectSpecDiffs(changeName, changesPath);

    console.log();
    if (capabilities.length === 0 || results.length === 0) {
      // 提案だけの変更もあり得るためエラーではない。空の見出しを出すより明示する。
      console.log(`変更 "${changeName}" には比較対象の仕様差分がありません。`);
      return;
    }

    console.log(chalk.bold('変更された仕様（差分）'));
    console.log();
    this.printDiffText(results);
  }

  private printDiffText(results: RequirementDiff[]): void {
    let currentCap = '';

    for (const r of results) {
      if (r.capability !== currentCap) {
        if (currentCap) console.log();
        currentCap = r.capability;
        console.log(chalk.bold.underline(currentCap));
        console.log();
      }

      switch (r.operation) {
        case 'ADDED':
          console.log(chalk.green.bold(`  ADDED: ${r.requirementName}`));
          for (const line of r.raw.split('\n')) {
            console.log(chalk.green(`    ${line}`));
          }
          console.log();
          break;

        case 'REMOVED':
          console.log(chalk.red.bold(`  REMOVED: ${r.requirementName}`));
          for (const line of r.raw.split('\n')) {
            console.log(chalk.red(`    ${line}`));
          }
          console.log();
          break;

        case 'RENAMED':
          console.log(chalk.cyan.bold(`  RENAMED: ${r.rename?.from} → ${r.rename?.to}`));
          console.log();
          break;

        case 'MODIFIED':
          console.log(chalk.yellow.bold(`  MODIFIED: ${r.requirementName}`));
          if (r.warning) {
            console.log(chalk.yellow(`    ⚠ ${r.warning}`));
          }
          // 表記だけが近い見出しでは、不一致の警告と、ほぼ一致したブロックとの差分を両方表示する。
          if (r.diff === undefined) {
            for (const line of r.raw.split('\n')) {
              console.log(`    ${line}`);
            }
          } else if (r.diff === '') {
            console.log(chalk.dim('    （テキストの変更なし）'));
          } else {
            for (const line of r.diff.split('\n')) {
              if (line.startsWith('+')) {
                console.log(chalk.green(`    ${line}`));
              } else if (line.startsWith('-')) {
                console.log(chalk.red(`    ${line}`));
              } else {
                console.log(`    ${line}`);
              }
            }
          }
          console.log();
          break;
      }
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
            FileSystemUtils.assertPathWithin(changeDir, proposalPath);
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
        const taskStatusText = total > 0 ? ` [タスク ${completed}/${total}]` : '';
        if (await isDefinitelyMissing(proposalPath)) {
          console.log(`${changeName}: （proposal.md は未作成）${taskStatusText}`);
          continue;
        }
        try {
          FileSystemUtils.assertPathWithin(changeDir, proposalPath);
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
    if (!isChangeDirectoryName(changesPath, changeDir)) {
      throw new Error(`変更 "${changeName}" が見つかりません (${changeDir})`);
    }
    try {
      await fs.access(changeDir);
    } catch {
      throw new Error(`変更 "${changeName}" が見つかりません (${changeDir})`);
    }
    
    const validator = new Validator(options?.strict || false);
    const report = await validator.validateChangeDeltaSpecs(changeDir, {
      // Derived from changesPath so the main specs come from the same root the
      // change itself was resolved against.
      mainSpecsDir: path.join(path.dirname(changesPath), 'specs'),
      projectRoot: path.dirname(path.dirname(changesPath)),
    });
    
    if (options?.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      if (report.valid) {
        console.log(`変更 "${changeName}" は有効です`);
      } else {
        console.error(`変更 "${changeName}" に問題があります`);
      }
      report.issues.forEach(issue => {
        const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
        console.error(`${prefix} [${issue.level}] ${issue.path}: ${issue.message}`);
      });
      if (!report.valid) {
        // 問題の修正方法を案内する「次のステップ」を末尾に表示する
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
