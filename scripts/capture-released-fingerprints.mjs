// 公開版の生成ファイルのハッシュを記録し、update が未編集の旧出力と
// 編集済みファイルを判別できるようにする。
// npm の各版をキャッシュへ導入し、一時 HOME とプロジェクトで init --tools all を実行する。
// 対応するプロファイル、過去の既定ワークフローセット、delivery ごとに採取し、
// src/core/shared/released-generated-fingerprints.ts を更新する。
// 使い方: pnpm build && node scripts/capture-released-fingerprints.mjs [--cache DIR] [--only 1.15.0]
// npm 公開後に実行し、次版でその出力を認識できるようにする。

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { fingerprintGeneratedContent, extractOpenSpecBlock } = await import(
  path.join(repoRoot, 'dist/core/shared/generated-fingerprint.js')
);

const PACKAGE = '@ayumuwall/openspec';
const ALL_WORKFLOWS = [
  'propose', 'explore', 'new', 'continue', 'apply', 'update',
  'ff', 'sync', 'archive', 'bulk-archive', 'verify', 'onboard',
];
// 過去の既定ワークフローセット。初回導入時のセットは最初の更新で custom として保存される。
// 他の導入済みワークフローに本文が依存するため、後の各版もこれらのセットで採取する。
const FORMER_DEFAULT_WORKFLOWS = {
  // 1.0.0〜1.1.1
  ten: ['explore', 'new', 'continue', 'apply', 'ff', 'sync', 'archive', 'bulk-archive', 'verify', 'onboard'],
  // 1.2.0〜1.3.1
  four: ['propose', 'explore', 'apply', 'archive'],
  // 1.4.0〜1.5.0
  five: ['propose', 'explore', 'apply', 'sync', 'archive'],
  // 1.6.0 以降
  six: ['propose', 'explore', 'apply', 'update', 'sync', 'archive'],
};
const OUTPUT = path.join(repoRoot, 'src/core/shared/released-generated-fingerprints.ts');

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

const cacheDir = path.resolve(argValue('--cache') ?? path.join(os.tmpdir(), 'openspec-release-cache'));
const only = argValue('--only')?.split(',');
const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-capture-'));

const versions = JSON.parse(
  execFileSync('npm', ['view', PACKAGE, 'versions', '--json'], { encoding: 'utf8' })
).filter((v) => !v.includes('-') && (!only || only.includes(v)));

function install(version) {
  const dir = path.join(cacheDir, `v${version}`);
  const bin = path.join(dir, 'node_modules', PACKAGE, 'bin', 'openspec.js');
  if (!fs.existsSync(bin)) {
    execFileSync(
      'npm',
      ['install', '--silent', '--no-audit', '--no-fund', '--ignore-scripts', '--prefix', dir, `${PACKAGE}@${version}`],
      { stdio: 'ignore' }
    );
  }
  return bin;
}

function run(bin, args, cwd, home) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd,
    input: '',
    timeout: 120_000,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      HOME: home,
      USERPROFILE: home,
      XDG_CONFIG_HOME: path.join(home, '.config'),
      XDG_DATA_HOME: path.join(home, '.local', 'share'),
      CODEX_HOME: path.join(home, '.codex'),
      OPENSPEC_TELEMETRY: '0',
      DO_NOT_TRACK: '1',
      CI: '1',
      NO_COLOR: '1',
      TERM: 'dumb',
    },
  });
}

function listFiles(root, skip) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (skip(path.relative(root, full))) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  if (fs.existsSync(root)) walk(root);
  return out;
}

// 公開版自体の設定であり、利用者が保持する生成出力ではない。
const skipHome = (rel) => rel === '.config/openspec' || rel.startsWith('.npm');

function variantsFor(bin) {
  const help = run(bin, ['init', '--help'], workRoot, path.join(workRoot, 'help-home')).stdout ?? '';
  if (!help.includes('--tools')) return null; // 非対話に非対応の版
  if (!help.includes('--profile')) return [{ name: 'default' }];
  const variants = [];
  for (const delivery of ['both', 'skills', 'commands']) {
    variants.push({ name: `core-${delivery}`, config: { profile: 'core', delivery } });
    variants.push({ name: `all-${delivery}`, config: { profile: 'custom', delivery, workflows: ALL_WORKFLOWS } });
    for (const [name, workflows] of Object.entries(FORMER_DEFAULT_WORKFLOWS)) {
      variants.push({ name: `${name}-${delivery}`, config: { profile: 'custom', delivery, workflows } });
    }
  }
  return variants;
}

const fingerprints = new Set();
// openspec/ とルート直下を除く、ツールフォルダ内のプロジェクト相対パス。
// ルートの CLAUDE.md/AGENTS.md は利用者のファイルに管理ブロックを加えたもの。
const projectPaths = new Set();
const covered = [];
const skipped = [];

for (const version of versions) {
  let bin;
  try {
    bin = install(version);
  } catch (error) {
    skipped.push(`${version} (導入失敗)`);
    continue;
  }
  const variants = variantsFor(bin);
  if (!variants) {
    skipped.push(`${version} (非対話 init に非対応)`);
    continue;
  }
  let files = 0;
  for (const variant of variants) {
    const base = path.join(workRoot, version, variant.name);
    const home = path.join(base, 'home');
    const project = path.join(base, 'project');
    fs.mkdirSync(path.join(home, '.config', 'openspec'), { recursive: true });
    fs.mkdirSync(project, { recursive: true });
    if (variant.config) {
      fs.writeFileSync(
        path.join(home, '.config', 'openspec', 'config.json'),
        JSON.stringify(variant.config, null, 2)
      );
    }
    const result = run(bin, ['init', '--tools', 'all'], project, home);
    if (result.status !== 0) {
      throw new Error(`${version} ${variant.name}: init に失敗\n${result.stdout}\n${result.stderr}`);
    }
    for (const file of [...listFiles(project, () => false), ...listFiles(home, skipHome)]) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.trim() === '') continue; // 空ファイルは判定の根拠にしない
      fingerprints.add(fingerprintGeneratedContent(content));
      // 旧版の CLAUDE.md/AGENTS.md 管理ブロックは、ファイルの残りとは別に認識する。
      const block = extractOpenSpecBlock(content);
      if (block) fingerprints.add(fingerprintGeneratedContent(block));
      files += 1;
      const rel = path.relative(project, file).split(path.sep).join('/');
      if (!rel.startsWith('..') && rel.includes('/') && !rel.startsWith('openspec/')) {
        projectPaths.add(rel);
      }
    }
  }
  covered.push(version);
  console.log(`${version}: ${variants.length} 通り、ファイル${files}件`);
}

fs.rmSync(workRoot, { recursive: true, force: true });

// 常に既存記録へ追加し、本家の出力や --only の対象外の版を失わない。
let upstreamReleases = [];
let upstreamSkipped = [];
if (fs.existsSync(OUTPUT)) {
  const existing = fs.readFileSync(OUTPUT, 'utf8');
  const section = (name) => existing.split(`export const ${name}`)[1]?.split('];')[0] ?? '';
  for (const [, fp] of section('RELEASED_GENERATED_FINGERPRINTS').matchAll(/'([0-9a-f]+)'/g)) fingerprints.add(fp);
  for (const [, p] of section('RELEASED_GENERATED_PATHS').matchAll(/"((?:[^"\\]|\\.)*)"/g)) projectPaths.add(JSON.parse(`"${p}"`));
  upstreamReleases = existing.match(/^\/\/ Releases: (.*)$/m)?.[1].split(', ') ?? [];
  upstreamSkipped = existing.match(/^\/\/ Not captured: (.*)$/m)?.[1].split(/, (?=\d)/) ?? [];
  const earlier = existing.match(/^\/\/ OpenSpec-J Releases: (.*)$/m)?.[1].split(', ') ?? [];
  covered.unshift(...earlier.filter((v) => !covered.includes(v)));
  const notCaptured = existing.match(/^\/\/ OpenSpec-J Not captured: (.*)$/m)?.[1].split(/, (?=\d)/) ?? [];
  skipped.unshift(...notCaptured.filter((entry) => !covered.includes(entry.split(' ')[0])));
}

const sorted = [...fingerprints].sort();
const sortedPaths = [...projectPaths].sort();
const lines = [
  '// scripts/capture-released-fingerprints.mjs による生成ファイル。直接編集しない。',
  '//',
  '// 以下の各公開版が init --tools all で生成した全ファイルのハッシュ。',
  '// 対応する全プロファイル、過去の既定ワークフローセット、delivery を網羅する。',
  ...(upstreamReleases.length ? [`// Releases: ${upstreamReleases.join(', ')}`] : []),
  ...(upstreamSkipped.length ? [`// Not captured: ${upstreamSkipped.join(', ')}`] : []),
  `// OpenSpec-J Releases: ${covered.join(', ')}`,
  ...(skipped.length ? [`// OpenSpec-J Not captured: ${skipped.join(', ')}`] : []),
  'export const RELEASED_GENERATED_FINGERPRINTS: readonly string[] = [',
  ...sorted.map((f) => `  '${f}',`),
  '];',
  '',
  '// 各公開版がツールフォルダ内に生成した全プロジェクト相対パス。',
  'export const RELEASED_GENERATED_PATHS: readonly string[] = [',
  ...sortedPaths.map((p) => `  ${JSON.stringify(p)},`),
  '];',
  '',
];
fs.writeFileSync(OUTPUT, lines.join('\n'));
console.log(`${sorted.length} 種類のハッシュ、パス${sortedPaths.length}件（日本語版${covered.length}リリース） → ${path.relative(repoRoot, OUTPUT)}`);
