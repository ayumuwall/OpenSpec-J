import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemUtils } from '../utils/file-system.js';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import chalk from 'chalk';
import {
  extractRequirementsSection,
  parseDeltaSpec,
  normalizeRequirementName,
  type RequirementBlock,
} from './parsers/requirement-blocks.js';

interface SpecUpdate {
  source: string;
  target: string;
  exists: boolean;
}

export class ArchiveCommand {
  async execute(
    changeName?: string,
    options: { yes?: boolean; skipSpecs?: boolean; noValidate?: boolean; validate?: boolean } = {}
  ): Promise<void> {
    const targetPath = '.';
    const changesDir = path.join(targetPath, 'openspec', 'changes');
    const archiveDir = path.join(changesDir, 'archive');
    const mainSpecsDir = path.join(targetPath, 'openspec', 'specs');

    // Check if changes directory exists
    try {
      await fs.access(changesDir);
    } catch {
      throw new Error("OpenSpec の変更ディレクトリが見つかりません。先に 'openspec init' を実行してください。");
    }

    // Get change name interactively if not provided
    if (!changeName) {
      const selectedChange = await this.selectChange(changesDir);
      if (!selectedChange) {
        console.log('変更が選択されなかったため中止します。');
        return;
      }
      changeName = selectedChange;
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists
    try {
      const stat = await fs.stat(changeDir);
      if (!stat.isDirectory()) {
        throw new Error(`変更 '${changeName}' が見つかりません。`);
      }
    } catch {
      throw new Error(`変更 '${changeName}' が見つかりません。`);
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (non-blocking unless strict mode desired in future)
      const changeFile = path.join(changeDir, 'proposal.md');
      try {
        await fs.access(changeFile);
        const changeReport = await validator.validateChange(changeFile);
        // Proposal validation is informative only (do not block archive)
        if (!changeReport.valid) {
          console.log(chalk.yellow('\nproposal.md の警告（ブロックしません）:'));
          for (const issue of changeReport.issues) {
            const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
            console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
          }
        }
      } catch {
        // Change file doesn't exist, skip validation
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      let hasDeltaSpecs = false;
      try {
        const candidates = await fs.readdir(changeSpecsDir, { withFileTypes: true });
        for (const c of candidates) {
          if (c.isDirectory()) {
            try {
              const candidatePath = path.join(changeSpecsDir, c.name, 'spec.md');
              await fs.access(candidatePath);
              const content = await fs.readFile(candidatePath, 'utf-8');
              if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/m.test(content)) {
                hasDeltaSpecs = true;
                break;
              }
            } catch {}
          }
        }
      } catch {}
      if (hasDeltaSpecs) {
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          console.log(chalk.red('\n変更の差分仕様で検証エラーがありました:'));
          for (const issue of deltaReport.issues) {
            if (issue.level === 'ERROR') {
              console.log(chalk.red(`  ✗ ${issue.message}`));
            } else if (issue.level === 'WARNING') {
              console.log(chalk.yellow(`  ⚠ ${issue.message}`));
            }
          }
        }
      }

      if (hasValidationErrors) {
        console.log(chalk.red('\n検証に失敗しました。アーカイブ前にエラーを修正してください。'));
        console.log(chalk.yellow('検証をスキップする場合（非推奨）は --no-validate を使用してください。'));
        return;
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();
      
      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        const proceed = await confirm({
          message: chalk.yellow('⚠️  警告: 検証をスキップすると不正な仕様をアーカイブする可能性があります。続行しますか？ (y/N)'),
          default: false
        });
        if (!proceed) {
          console.log('アーカイブをキャンセルしました。');
          return;
        }
      } else {
        console.log(chalk.yellow(`\n⚠️  警告: 検証をスキップすると不正な仕様をアーカイブする可能性があります。`));
      }
      
      console.log(chalk.yellow(`[${timestamp}] 検証をスキップ: change=${changeName}`));
      console.log(chalk.yellow(`対象ファイル: ${changeDir}`));
    }

    // Show progress and check for incomplete tasks
    const progress = await getTaskProgressForChange(changesDir, changeName);
    const status = formatTaskStatus(progress);
    console.log(`タスクの進捗: ${status}`);

    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        const proceed = await confirm({
          message: `警告: 未完了タスクが ${incompleteTasks} 件あります。続行しますか？`,
          default: false
        });
        if (!proceed) {
          console.log('アーカイブをキャンセルしました。');
          return;
        }
      } else {
        console.log(`警告: 未完了タスクが ${incompleteTasks} 件ありますが --yes により続行します。`);
      }
    }

    // Handle spec updates unless skipSpecs flag is set
    if (options.skipSpecs) {
      console.log('仕様更新をスキップします (--skip-specs 指定)。');
    } else {
      // Find specs to update
      const specUpdates = await this.findSpecUpdates(changeDir, mainSpecsDir);
      
      if (specUpdates.length > 0) {
        console.log('\n更新する仕様:');
        for (const update of specUpdates) {
          const status = update.exists ? '更新' : '新規作成';
          const capability = path.basename(path.dirname(update.target));
          console.log(`  ${capability}: ${status}`);
        }

        let shouldUpdateSpecs = true;
        if (!options.yes) {
          const { confirm } = await import('@inquirer/prompts');
          shouldUpdateSpecs = await confirm({
            message: '仕様更新を実行しますか？',
            default: true
          });
          if (!shouldUpdateSpecs) {
            console.log('仕様更新をスキップしてアーカイブを続行します。');
          }
        }

        if (shouldUpdateSpecs) {
          // Prepare all updates first (validation pass, no writes)
          const prepared: Array<{ update: SpecUpdate; rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> = [];
          try {
            for (const update of specUpdates) {
              const built = await this.buildUpdatedSpec(update, changeName!);
              prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
            }
          } catch (err: any) {
            console.log(String(err.message || err));
            console.log('中止しました。ファイルは変更されませんでした。');
            return;
          }

          // All validations passed; pre-validate rebuilt full spec and then write files and display counts
          let totals = { added: 0, modified: 0, removed: 0, renamed: 0 };
          for (const p of prepared) {
            const specName = path.basename(path.dirname(p.update.target));
            if (!skipValidation) {
              const report = await new Validator().validateSpecContent(specName, p.rebuilt);
              if (!report.valid) {
                console.log(chalk.red(`\n再構築した仕様 ${specName} の検証エラー（変更は書き込みません）:`));
                for (const issue of report.issues) {
                  if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
                  else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
                }
                console.log('中止しました。ファイルは変更されませんでした。');
                return;
              }
            }
            await this.writeUpdatedSpec(p.update, p.rebuilt, p.counts);
            totals.added += p.counts.added;
            totals.modified += p.counts.modified;
            totals.removed += p.counts.removed;
            totals.renamed += p.counts.renamed;
          }
          console.log(
            `合計: + ${totals.added}, ~ ${totals.modified}, - ${totals.removed}, → ${totals.renamed}`
          );
          console.log('仕様の更新が完了しました。');
        }
      }
    }

    // Create archive directory with date prefix
    const archiveName = `${this.getArchiveDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);

    // Check if archive already exists
    try {
      await fs.access(archivePath);
      throw new Error(`アーカイブ '${archiveName}' は既に存在します。`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create archive directory if needed
    await fs.mkdir(archiveDir, { recursive: true });

    // Move change to archive
    await fs.rename(changeDir, archivePath);
    
    console.log(`変更 '${changeName}' を '${archiveName}' としてアーカイブしました。`);
  }

  private async selectChange(changesDir: string): Promise<string | null> {
    const { select } = await import('@inquirer/prompts');
    // Get all directories in changes (excluding archive)
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort();

    if (changeDirs.length === 0) {
      console.log('アクティブな変更が見つかりません。');
      return null;
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id);
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: 'アーカイブする変更を選択してください',
        choices
      });
      return answer;
    } catch (error) {
      // User cancelled (Ctrl+C)
      return null;
    }
  }

  // Deprecated: replaced by shared task-progress utilities
  private async checkIncompleteTasks(_tasksPath: string): Promise<number> {
    return 0;
  }

  private async findSpecUpdates(changeDir: string, mainSpecsDir: string): Promise<SpecUpdate[]> {
    const updates: SpecUpdate[] = [];
    const changeSpecsDir = path.join(changeDir, 'specs');

    try {
      const entries = await fs.readdir(changeSpecsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const specFile = path.join(changeSpecsDir, entry.name, 'spec.md');
          const targetFile = path.join(mainSpecsDir, entry.name, 'spec.md');
          
          try {
            await fs.access(specFile);
            
            // Check if target exists
            let exists = false;
            try {
              await fs.access(targetFile);
              exists = true;
            } catch {
              exists = false;
            }

            updates.push({
              source: specFile,
              target: targetFile,
              exists
            });
          } catch {
            // Source spec doesn't exist, skip
          }
        }
      }
    } catch {
      // No specs directory in change
    }

    return updates;
  }

  private async buildUpdatedSpec(update: SpecUpdate, changeName: string): Promise<{ rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> {
    // Read change spec content (delta-format expected)
    const changeContent = await fs.readFile(update.source, 'utf-8');

    // Parse deltas from the change spec file
    const plan = parseDeltaSpec(changeContent);
    const specName = path.basename(path.dirname(update.target));

    // Pre-validate duplicates within sections
    const addedNames = new Set<string>();
    for (const add of plan.added) {
      const name = normalizeRequirementName(add.name);
      if (addedNames.has(name)) {
        throw new Error(
          `${specName} の検証に失敗: ADDED セクションに重複する要件があります (ヘッダー "### Requirement: ${add.name}")`
        );
      }
      addedNames.add(name);
    }
    const modifiedNames = new Set<string>();
    for (const mod of plan.modified) {
      const name = normalizeRequirementName(mod.name);
      if (modifiedNames.has(name)) {
        throw new Error(
          `${specName} の検証に失敗: MODIFIED セクションに重複する要件があります (ヘッダー "### Requirement: ${mod.name}")`
        );
      }
      modifiedNames.add(name);
    }
    const removedNamesSet = new Set<string>();
    for (const rem of plan.removed) {
      const name = normalizeRequirementName(rem);
      if (removedNamesSet.has(name)) {
        throw new Error(
          `${specName} の検証に失敗: REMOVED セクションに重複する要件があります (ヘッダー "### Requirement: ${rem}")`
        );
      }
      removedNamesSet.add(name);
    }
    const renamedFromSet = new Set<string>();
    const renamedToSet = new Set<string>();
    for (const { from, to } of plan.renamed) {
      const fromNorm = normalizeRequirementName(from);
      const toNorm = normalizeRequirementName(to);
      if (renamedFromSet.has(fromNorm)) {
        throw new Error(
          `${specName} の検証に失敗: RENAMED セクションの FROM が重複しています (ヘッダー "### Requirement: ${from}")`
        );
      }
      if (renamedToSet.has(toNorm)) {
        throw new Error(
          `${specName} の検証に失敗: RENAMED セクションの TO が重複しています (ヘッダー "### Requirement: ${to}")`
        );
      }
      renamedFromSet.add(fromNorm);
      renamedToSet.add(toNorm);
    }

    // Pre-validate cross-section conflicts
    const conflicts: Array<{ name: string; a: string; b: string }> = [];
    for (const n of modifiedNames) {
      if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'REMOVED' });
      if (addedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'ADDED' });
    }
    for (const n of addedNames) {
      if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'ADDED', b: 'REMOVED' });
    }
    // Renamed interplay: MODIFIED must reference the NEW header, not FROM
    for (const { from, to } of plan.renamed) {
      const fromNorm = normalizeRequirementName(from);
      const toNorm = normalizeRequirementName(to);
      if (modifiedNames.has(fromNorm)) {
        throw new Error(
          `${specName} の検証に失敗: RENAMED がある場合、MODIFIED は新しいヘッダー "### Requirement: ${to}" を参照する必要があります`
        );
      }
      // Detect ADDED colliding with a RENAMED TO
      if (addedNames.has(toNorm)) {
        throw new Error(
          `${specName} の検証に失敗: RENAMED の TO ヘッダーが ADDED と衝突しています ("### Requirement: ${to}")`
        );
      }
    }
    if (conflicts.length > 0) {
      const c = conflicts[0];
      throw new Error(
        `${specName} の検証に失敗: 要件が複数セクション (${c.a} / ${c.b}) に重複しています (ヘッダー "### Requirement: ${c.name}")`
      );
    }
    const hasAnyDelta = (plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length) > 0;
    if (!hasAnyDelta) {
      throw new Error(
        `${path.basename(path.dirname(update.source))} のデルタ解析で操作が見つかりませんでした。` +
        `change の spec に ADDED/MODIFIED/REMOVED/RENAMED セクションを記述してください。`
      );
    }

    // Load or create base target content
    let targetContent: string;
    try {
      targetContent = await fs.readFile(update.target, 'utf-8');
    } catch {
      // Target spec does not exist; only ADDED operations are permitted
      if (plan.modified.length > 0 || plan.removed.length > 0 || plan.renamed.length > 0) {
        throw new Error(
          `${specName}: 対象の仕様が存在しません。新規仕様では ADDED 要件のみ許可されます。`
        );
      }
      targetContent = this.buildSpecSkeleton(specName, changeName);
    }

    // Extract requirements section and build name->block map
    const parts = extractRequirementsSection(targetContent);
    const nameToBlock = new Map<string, RequirementBlock>();
    for (const block of parts.bodyBlocks) {
      nameToBlock.set(normalizeRequirementName(block.name), block);
    }

    // Apply operations in order: RENAMED → REMOVED → MODIFIED → ADDED
    // RENAMED
    for (const r of plan.renamed) {
      const from = normalizeRequirementName(r.from);
      const to = normalizeRequirementName(r.to);
      if (!nameToBlock.has(from)) {
        throw new Error(
          `${specName} の RENAMED 失敗: ヘッダー "### Requirement: ${r.from}" の元要件が見つかりません`
        );
      }
      if (nameToBlock.has(to)) {
        throw new Error(
          `${specName} の RENAMED 失敗: ヘッダー "### Requirement: ${r.to}" の対象が既に存在します`
        );
      }
      const block = nameToBlock.get(from)!;
      const newHeader = `### Requirement: ${to}`;
      const rawLines = block.raw.split('\n');
      rawLines[0] = newHeader;
      const renamedBlock: RequirementBlock = {
        headerLine: newHeader,
        name: to,
        raw: rawLines.join('\n'),
      };
      nameToBlock.delete(from);
      nameToBlock.set(to, renamedBlock);
    }

    // REMOVED
    for (const name of plan.removed) {
      const key = normalizeRequirementName(name);
      if (!nameToBlock.has(key)) {
        throw new Error(
          `${specName} の REMOVED 失敗: ヘッダー "### Requirement: ${name}" が見つかりません`
        );
      }
      nameToBlock.delete(key);
    }

    // MODIFIED
    for (const mod of plan.modified) {
      const key = normalizeRequirementName(mod.name);
      if (!nameToBlock.has(key)) {
        throw new Error(
          `${specName} の MODIFIED 失敗: ヘッダー "### Requirement: ${mod.name}" が見つかりません`
        );
      }
      // Replace block with provided raw (ensure header line matches key)
      const modHeaderMatch = mod.raw.split('\n')[0].match(/^###\s*Requirement:\s*(.+)\s*$/);
      if (!modHeaderMatch || normalizeRequirementName(modHeaderMatch[1]) !== key) {
        throw new Error(
          `${specName} の MODIFIED 失敗: ヘッダー "### Requirement: ${mod.name}" と内容のヘッダーが一致しません`
        );
      }
      nameToBlock.set(key, mod);
    }

    // ADDED
    for (const add of plan.added) {
      const key = normalizeRequirementName(add.name);
      if (nameToBlock.has(key)) {
        throw new Error(
          `${specName} の ADDED 失敗: ヘッダー "### Requirement: ${add.name}" は既に存在します`
        );
      }
      nameToBlock.set(key, add);
    }

    // Duplicates within resulting map are implicitly prevented by key uniqueness.

    // Recompose requirements section preserving original ordering where possible
    const keptOrder: RequirementBlock[] = [];
    const seen = new Set<string>();
    for (const block of parts.bodyBlocks) {
      const key = normalizeRequirementName(block.name);
      const replacement = nameToBlock.get(key);
      if (replacement) {
        keptOrder.push(replacement);
        seen.add(key);
      }
    }
    // Append any newly added that were not in original order
    for (const [key, block] of nameToBlock.entries()) {
      if (!seen.has(key)) {
        keptOrder.push(block);
      }
    }

    const reqBody = [
      parts.preamble && parts.preamble.trim() ? parts.preamble.trimEnd() : ''
    ]
      .filter(Boolean)
      .concat(keptOrder.map(b => b.raw))
      .join('\n\n')
      .trimEnd();

    const rebuilt = [
      parts.before.trimEnd(),
      parts.headerLine,
      reqBody,
      parts.after
    ]
      .filter((s, idx) => !(idx === 0 && s === ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');

    return {
      rebuilt,
      counts: {
        added: plan.added.length,
        modified: plan.modified.length,
        removed: plan.removed.length,
        renamed: plan.renamed.length,
      }
    };
  }

  private async writeUpdatedSpec(update: SpecUpdate, rebuilt: string, counts: { added: number; modified: number; removed: number; renamed: number }): Promise<void> {
    // Create target directory if needed
    const targetDir = path.dirname(update.target);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(update.target, rebuilt);

    const specName = path.basename(path.dirname(update.target));
    console.log(`openspec/specs/${specName}/spec.md に変更を適用:`);
    if (counts.added) console.log(`  + ${counts.added} 追加`);
    if (counts.modified) console.log(`  ~ ${counts.modified} 更新`);
    if (counts.removed) console.log(`  - ${counts.removed} 削除`);
    if (counts.renamed) console.log(`  → ${counts.renamed} リネーム`);
  }

  private buildSpecSkeleton(specFolderName: string, changeName: string): string {
    const titleBase = specFolderName;
    return `# ${titleBase} Specification\n\n## Purpose\nTBD - change ${changeName} をアーカイブして作成されました。アーカイブ後に Purpose を更新してください。\n\n## Requirements\n`;
  }

  private getArchiveDate(): string {
    // Returns date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  }
}
