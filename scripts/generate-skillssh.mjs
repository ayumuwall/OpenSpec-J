#!/usr/bin/env node

/**
 * skills.sh で配布する OpenSpec のスキルを生成する。
 *
 * `npx skills add ayumuwall/OpenSpec-J` が GitHub から取得する SKILL.md と参照ファイルを、
 * CLI と同じテンプレートから `skills/<name>/` に生成する。
 *
 * `test/core/templates/skillssh-parity.test.ts` が生成物とコミット済みの内容を比較する。
 * テンプレートを変更したら `pnpm build && pnpm generate:skills` を実行する。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSkillTemplates, generateSkillFiles } from '../dist/core/shared/skill-generation.js';
import { transformToSharedSkillReferences } from '../dist/utils/command-references.js';
import {
  cleanSkillSubdirectories,
  prepareSkillDirectory,
  stripVolatileFrontmatter,
  SKILLS_DIR,
} from './skillssh-shared.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, SKILLS_DIR);

cleanSkillSubdirectories(outDir);

let count = 0;
for (const { template, dirName } of getSkillTemplates()) {
  // skills.sh はスキルフォルダだけを配置するため、参照先には /opsx:* コマンドでなくスキル名を使う。
  const skillDir = prepareSkillDirectory(outDir, dirName);
  for (const [file, content] of generateSkillFiles(template, 'skills.sh', transformToSharedSkillReferences)) {
    mkdirSync(dirname(join(skillDir, file)), { recursive: true });
    writeFileSync(join(skillDir, file), stripVolatileFrontmatter(content), 'utf8');
  }
  count++;
}

console.log(`Generated ${count} skills into ${SKILLS_DIR}/`);
