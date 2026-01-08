/**
 * Spec Application Logic
 *
 * Extracted from ArchiveCommand to enable standalone spec application.
 * Applies delta specs from a change to main specs without archiving.
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  extractRequirementsSection,
  parseDeltaSpec,
  normalizeRequirementName,
  type RequirementBlock,
} from './parsers/requirement-blocks.js';
import { Validator } from './validation/validator.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SpecUpdate {
  source: string;
  target: string;
  exists: boolean;
}

export interface ApplyResult {
  capability: string;
  added: number;
  modified: number;
  removed: number;
  renamed: number;
}

export interface SpecsApplyOutput {
  changeName: string;
  capabilities: ApplyResult[];
  totals: {
    added: number;
    modified: number;
    removed: number;
    renamed: number;
  };
  noChanges: boolean;
}

const formatDeltaValidationError = (specName: string, detail: string): string =>
  `${specName} の delta の検証に失敗しました: ${detail}`;

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Find all delta spec files that need to be applied from a change.
 */
export async function findSpecUpdates(changeDir: string, mainSpecsDir: string): Promise<SpecUpdate[]> {
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
            exists,
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

/**
 * Build an updated spec by applying delta operations.
 * Returns the rebuilt content and counts of operations.
 */
export async function buildUpdatedSpec(
  update: SpecUpdate,
  changeName: string
): Promise<{ rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> {
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
        formatDeltaValidationError(
          specName,
          `ADDED に重複した要件があります（"### Requirement: ${add.name}"）`
        )
      );
    }
    addedNames.add(name);
  }
  const modifiedNames = new Set<string>();
  for (const mod of plan.modified) {
    const name = normalizeRequirementName(mod.name);
    if (modifiedNames.has(name)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `MODIFIED に重複した要件があります（"### Requirement: ${mod.name}"）`
        )
      );
    }
    modifiedNames.add(name);
  }
  const removedNamesSet = new Set<string>();
  for (const rem of plan.removed) {
    const name = normalizeRequirementName(rem);
    if (removedNamesSet.has(name)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `REMOVED に重複した要件があります（"### Requirement: ${rem}"）`
        )
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
        formatDeltaValidationError(
          specName,
          `RENAMED の FROM が重複しています（"### Requirement: ${from}"）`
        )
      );
    }
    if (renamedToSet.has(toNorm)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `RENAMED の TO が重複しています（"### Requirement: ${to}"）`
        )
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
        formatDeltaValidationError(
          specName,
          `RENAMED がある場合、MODIFIED は新しい見出し（"### Requirement: ${to}"）を参照する必要があります`
        )
      );
    }
    // Detect ADDED colliding with a RENAMED TO
    if (addedNames.has(toNorm)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `RENAMED の TO が ADDED と衝突しています（"### Requirement: ${to}"）`
        )
      );
    }
  }
  if (conflicts.length > 0) {
    const c = conflicts[0];
    throw new Error(
      formatDeltaValidationError(
        specName,
        `同一の要件が複数のセクションにあります（${c.a} と ${c.b}、"### Requirement: ${c.name}"）`
      )
    );
  }
  const hasAnyDelta = plan.added.length + plan.modified.length + plan.removed.length + plan.renamed.length > 0;
  if (!hasAnyDelta) {
    throw new Error(
      formatDeltaValidationError(
        specName,
        `delta の解析で操作が見つかりませんでした（${path.basename(path.dirname(update.source))}）。` +
          '変更仕様には ADDED/MODIFIED/REMOVED/RENAMED セクションが必要です。'
      )
    );
  }

  // Load or create base target content
  let targetContent: string;
  let isNewSpec = false;
  try {
    targetContent = await fs.readFile(update.target, 'utf-8');
  } catch {
    // Target spec does not exist; MODIFIED and RENAMED are not allowed for new specs
    // REMOVED will be ignored with a warning since there's nothing to remove
    if (plan.modified.length > 0 || plan.renamed.length > 0) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          '対象仕様が存在しません。新規仕様では ADDED のみ許可されます。' +
            'MODIFIED と RENAMED は既存仕様が必要です。'
        )
      );
    }
    // Warn about REMOVED requirements being ignored for new specs
    if (plan.removed.length > 0) {
      console.log(
        chalk.yellow(
          `⚠️  警告: ${specName} - 新規仕様のため REMOVED の要件 ${plan.removed.length} 件を無視しました（削除対象がありません）。`
        )
      );
    }
    isNewSpec = true;
    targetContent = buildSpecSkeleton(specName, changeName);
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
        formatDeltaValidationError(
          specName,
          `RENAMED に失敗しました: 参照元が見つかりません（"### Requirement: ${r.from}"）`
        )
      );
    }
    if (nameToBlock.has(to)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `RENAMED に失敗しました: 変更先が既に存在します（"### Requirement: ${r.to}"）`
        )
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
      // For new specs, REMOVED requirements are already warned about and ignored
      // For existing specs, missing requirements are an error
      if (!isNewSpec) {
        throw new Error(
          formatDeltaValidationError(
            specName,
            `REMOVED に失敗しました: 見つかりません（"### Requirement: ${name}"）`
          )
        );
      }
      // Skip removal for new specs (already warned above)
      continue;
    }
    nameToBlock.delete(key);
  }

  // MODIFIED
  for (const mod of plan.modified) {
    const key = normalizeRequirementName(mod.name);
    if (!nameToBlock.has(key)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `MODIFIED に失敗しました: 見つかりません（"### Requirement: ${mod.name}"）`
        )
      );
    }
    // Replace block with provided raw (ensure header line matches key)
    const modHeaderMatch = mod.raw.split('\n')[0].match(/^###\s*Requirement:\s*(.+)\s*$/);
    if (!modHeaderMatch || normalizeRequirementName(modHeaderMatch[1]) !== key) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `MODIFIED に失敗しました: 本文の見出しが一致しません（"### Requirement: ${mod.name}"）`
        )
      );
    }
    nameToBlock.set(key, mod);
  }

  // ADDED
  for (const add of plan.added) {
    const key = normalizeRequirementName(add.name);
    if (nameToBlock.has(key)) {
      throw new Error(
        formatDeltaValidationError(
          specName,
          `ADDED に失敗しました: 既に存在します（"### Requirement: ${add.name}"）`
        )
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

  const reqBody = [parts.preamble && parts.preamble.trim() ? parts.preamble.trimEnd() : '']
    .filter(Boolean)
    .concat(keptOrder.map((b) => b.raw))
    .join('\n\n')
    .trimEnd();

  const rebuilt = [parts.before.trimEnd(), parts.headerLine, reqBody, parts.after]
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
    },
  };
}

/**
 * Write an updated spec to disk.
 */
export async function writeUpdatedSpec(
  update: SpecUpdate,
  rebuilt: string,
  counts: { added: number; modified: number; removed: number; renamed: number }
): Promise<void> {
  // Create target directory if needed
  const targetDir = path.dirname(update.target);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(update.target, rebuilt);

  const specName = path.basename(path.dirname(update.target));
  console.log(`openspec/specs/${specName}/spec.md に変更を適用:`);
  if (counts.added) console.log(`  + ${counts.added} 追加`);
  if (counts.modified) console.log(`  ~ ${counts.modified} 更新`);
  if (counts.removed) console.log(`  - ${counts.removed} 削除`);
  if (counts.renamed) console.log(`  → ${counts.renamed} 名称変更`);
}

/**
 * Build a skeleton spec for new capabilities.
 */
export function buildSpecSkeleton(specFolderName: string, changeName: string): string {
  const titleBase = specFolderName;
  return `# ${titleBase} Specification\n\n## Purpose\nTBD - change ${changeName} をアーカイブして作成されました。アーカイブ後に Purpose を更新してください。\n\n## Requirements\n`;
}

/**
 * Apply all delta specs from a change to main specs.
 *
 * @param projectRoot - The project root directory
 * @param changeName - The name of the change to apply
 * @param options - Options for the operation
 * @returns Result of the operation with counts
 */
export async function applySpecs(
  projectRoot: string,
  changeName: string,
  options: {
    dryRun?: boolean;
    skipValidation?: boolean;
    silent?: boolean;
  } = {}
): Promise<SpecsApplyOutput> {
  const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
  const mainSpecsDir = path.join(projectRoot, 'openspec', 'specs');

  // Verify change exists
  try {
    const stat = await fs.stat(changeDir);
    if (!stat.isDirectory()) {
      throw new Error(`変更 '${changeName}' が見つかりません。`);
    }
  } catch {
    throw new Error(`変更 '${changeName}' が見つかりません。`);
  }

  // Find specs to update
  const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);

  if (specUpdates.length === 0) {
    return {
      changeName,
      capabilities: [],
      totals: { added: 0, modified: 0, removed: 0, renamed: 0 },
      noChanges: true,
    };
  }

  // Prepare all updates first (validation pass, no writes)
  const prepared: Array<{
    update: SpecUpdate;
    rebuilt: string;
    counts: { added: number; modified: number; removed: number; renamed: number };
  }> = [];

  for (const update of specUpdates) {
    const built = await buildUpdatedSpec(update, changeName);
    prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
  }

  // Validate rebuilt specs unless validation is skipped
  if (!options.skipValidation) {
    const validator = new Validator();
    for (const p of prepared) {
      const specName = path.basename(path.dirname(p.update.target));
      const report = await validator.validateSpecContent(specName, p.rebuilt);
      if (!report.valid) {
        const errors = report.issues
          .filter((i) => i.level === 'ERROR')
          .map((i) => `  ✗ ${i.message}`)
          .join('\n');
        throw new Error(`再構築した仕様 ${specName} の検証エラー:\n${errors}`);
      }
    }
  }

  // Build results
  const capabilities: ApplyResult[] = [];
  const totals = { added: 0, modified: 0, removed: 0, renamed: 0 };

  for (const p of prepared) {
    const capability = path.basename(path.dirname(p.update.target));

    if (!options.dryRun) {
      // Write the updated spec
      const targetDir = path.dirname(p.update.target);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(p.update.target, p.rebuilt);

      if (!options.silent) {
        console.log(`openspec/specs/${capability}/spec.md に変更を適用:`);
        if (p.counts.added) console.log(`  + ${p.counts.added} 追加`);
        if (p.counts.modified) console.log(`  ~ ${p.counts.modified} 更新`);
        if (p.counts.removed) console.log(`  - ${p.counts.removed} 削除`);
        if (p.counts.renamed) console.log(`  → ${p.counts.renamed} 名称変更`);
      }
    } else if (!options.silent) {
      console.log(`openspec/specs/${capability}/spec.md に変更を適用予定:`);
      if (p.counts.added) console.log(`  + ${p.counts.added} 追加`);
      if (p.counts.modified) console.log(`  ~ ${p.counts.modified} 更新`);
      if (p.counts.removed) console.log(`  - ${p.counts.removed} 削除`);
      if (p.counts.renamed) console.log(`  → ${p.counts.renamed} 名称変更`);
    }

    capabilities.push({
      capability,
      ...p.counts,
    });

    totals.added += p.counts.added;
    totals.modified += p.counts.modified;
    totals.removed += p.counts.removed;
    totals.renamed += p.counts.renamed;
  }

  return {
    changeName,
    capabilities,
    totals,
    noChanges: false,
  };
}
