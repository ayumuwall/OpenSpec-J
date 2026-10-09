import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { claudeAdapter } from '../src/core/command-generation/adapters/claude.js';
import { AI_TOOLS } from '../src/core/config.js';
import { formatProjectMdMigrationHint } from '../src/core/legacy-cleanup.js';
import { CORE_WORKFLOWS } from '../src/core/profiles.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETUP = fs.readFileSync(
  path.join(REPO_ROOT, 'docs-lab', 'start', 'setup.md'),
  'utf-8'
);
const PROFILES = fs.readFileSync(
  path.join(REPO_ROOT, 'docs-lab', 'customize', 'profiles.md'),
  'utf-8'
);
const CORE_SECTION = PROFILES.split('## コアセット')[1].split(
  '## セットの拡張：オプションのワークフロー'
)[0];

describe('setup documentation', () => {
  it('matches the AI-assisted project.md migration guidance', () => {
    const hint = formatProjectMdMigrationHint();
    const claims = [
      ['openspec/project.md を確認し、有用な内容を openspec/config.yaml', 'openspec/project.md を確認し、有用な内容を openspec/config.yaml'],
      ['context は簡潔に', 'context は簡潔に'],
      ['プロジェクト全体の事実だけ', 'プロジェクト全体の事実だけ'],
      ['アーティファクト作成、apply、archive', 'アーティファクトの作成、apply、archive'],
      ['対応するアーティファクトの rules', '該当するアーティファクトの rules'],
      ['対応する operations の項目', '該当する operations の項目'],
      ['一般的な内容', '一般論'],
      ['古い内容、冗長な内容は省いて', '古い情報、冗長な内容は除外'],
      ['project.md は削除しないでください', 'project.md は削除しないでください'],
    ];

    expect(SETUP).toContain('init は旧形式の `openspec/project.md` を `config.yaml` へコピーしません');
    for (const [hintClaim, docClaim] of claims) {
      expect(hint).toContain(hintClaim);
      expect(SETUP).toContain(docClaim);
    }
    expect(hint).toContain('config.yaml を確認し、準備ができたら project.md を削除してください。');
    expect(SETUP).toContain('`config.yaml` をレビューし、準備ができたら `project.md` を削除してください。');
  });

  it('keeps the Claude Code paths and recovery commands aligned with OpenSpec', () => {
    const claude = AI_TOOLS.find((tool) => tool.value === 'claude');
    const claudeCommandPath = claudeAdapter.getFilePath('<id>').split(path.sep).join('/');

    expect(claude?.skillsDir).toBeDefined();
    expect(SETUP).toContain(`\`${claude?.skillsDir}/skills/openspec-*/SKILL.md\``);
    expect(SETUP).toContain(`\`${claudeCommandPath}\``);
    expect(SETUP).toContain('openspec config set delivery both');
    expect(SETUP).toContain('openspec update');
    expect(SETUP).toContain('`/openspec-propose`');
  });

  it('lists every workflow in the core profile', () => {
    for (const workflow of CORE_WORKFLOWS) {
      expect(CORE_SECTION).toContain(`\`${workflow}\``);
    }
  });
});
