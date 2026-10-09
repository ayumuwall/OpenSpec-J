import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = fs.readFileSync(
  path.join(REPO_ROOT, 'docs-lab', 'reference', 'cli.md'),
  'utf-8'
);
const SKILLS = fs.readFileSync(
  path.join(REPO_ROOT, 'docs-lab', 'reference', 'skills.md'),
  'utf-8'
);
const APPLY_INSTRUCTIONS = CLI.split('## openspec instructions')[1].split(
  '## openspec templates'
)[0];
const APPLY_SKILL = SKILLS.split('## openspec-apply-change')[1].split(
  '## openspec-update-change'
)[0];

describe('apply documentation', () => {
  it('documents every task source-location field in the CLI contract', () => {
    const taskFields = ['`id`', '`description`', '`done`', '`sourcePath`', '`line`'];

    for (const field of taskFields) {
      expect(APPLY_INSTRUCTIONS).toContain(field);
    }

    expect(APPLY_INSTRUCTIONS).toContain('追跡対象ファイルの絶対パス');
    expect(APPLY_INSTRUCTIONS).toContain("チェックボックスの行番号（1から開始）");
  });

  it('documents that the apply skill can update tasks across tracked files', () => {
    expect(APPLY_SKILL).toContain(
      '`sourcePath` と行番号 `line`（1から開始）が示す追跡対象ファイル'
    );
    expect(APPLY_SKILL).toContain('複数ファイルでタスクを追跡');
    expect(APPLY_SKILL).not.toContain('タスクファイルだけを変更');
  });
});
