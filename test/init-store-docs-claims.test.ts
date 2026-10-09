import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readPage(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, ...relativePath.split('/')), 'utf-8');
}

const CLI_INIT = readPage('docs-lab/reference/cli.md')
  .split('## openspec init')[1]
  .split('## openspec update')[0];
const STORE_INTEGRATIONS = readPage('docs-lab/multi-repo/stores.md')
  .split('### ストアのみのリポジトリにツール連携をインストールする')[1]
  .split('### マシン上の `defaultStore`')[0];

describe('store-only init documentation', () => {
  it.each([
    ['CLI reference', CLI_INIT],
    ['Stores guide', STORE_INTEGRATIONS],
  ])('keeps the complete pointer-repository contract in the %s', (_name, section) => {
    expect(section).toContain('リポジトリルート');
    expect(section).toContain('バイト単位で変更せず保持');
    expect(section).toContain('`openspec/specs/` と `openspec/changes/`');
    expect(section).toContain('作成しません');
    expect(section).toContain('`--language`');
    expect(section).toContain("外部ストアの設定");
  });
});
