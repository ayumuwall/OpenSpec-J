import { installSkills, removeSkills } from 'skills';
import { parse, stringify } from 'yaml';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transformToSharedSkillReferences } from '../utils/command-references.js';
import { generateSkillFiles, getSkillTemplates, stripVolatileFrontmatter } from './shared/skill-generation.js';

export type SkillScope = 'global' | 'project';

const allFiles = new Map<string, Map<string, Map<string, string>>>();
/** この版がインストールするファイルを、スキル名とフォルダ相対パスで取得する。 */
export function expectedSkillFiles(version: string, workflows?: readonly string[]) {
  if (!workflows && allFiles.has(version)) return allFiles.get(version)!;
  const files = new Map(getSkillTemplates(workflows).map(({ template, dirName }) => [
    dirName,
    new Map([...generateSkillFiles(template, version, transformToSharedSkillReferences)]
      .map(([file, text]) => [file, stripVolatileFrontmatter(text)])),
  ]));
  if (!workflows) allFiles.set(version, files);
  return files;
}

/** インストール済みのスキルが最新かを比較するための各 SKILL.md。 */
export function expectedSkillContents(version: string, workflows?: readonly string[]) {
  return new Map([...expectedSkillFiles(version, workflows)].map(([name, files]) => [name, files.get('SKILL.md')!]));
}

/** Vercel writes Eve a copy with only the frontmatter its agent reads. */
export function projectSkillText(toolId: string, shared: string): string {
  if (toolId !== 'eve') return shared;
  const header = shared.match(/^---\n([\s\S]*?)\n---\n\n?/);
  if (!header) return shared;
  const fields = parse(header[1]);
  delete fields['allowed-tools'];
  return `---\n${stringify(fields)}---\n${shared.slice(header[0].length)}`;
}

type Targets = { scope: SkillScope; cwd?: string; agents: readonly string[] };

/** フォルダ相対パスとファイル内容から GitHub と同じスキルフォルダのハッシュを求める。 */
function skillFolderHash(files: ReadonlyMap<string, string>): string {
  const gitObject = (type: string, body: Buffer) =>
    createHash('sha1').update(`${type} ${body.length}\0`).update(body).digest();
  const tree = (entries: [string, string][]): Buffer => {
    const blobs = new Map<string, Buffer>();
    const dirs = new Map<string, [string, string][]>();
    for (const [file, text] of entries) {
      const [head, ...rest] = file.split('/');
      if (rest.length) dirs.set(head, [...(dirs.get(head) ?? []), [rest.join('/'), text]]);
      else blobs.set(head, gitObject('blob', Buffer.from(text)));
    }
    // Git はフォルダ名の末尾に `/` を付けたものとして並べ替える。
    const rows = [
      ...[...blobs].map(([name, sha]) => ({ key: name, row: Buffer.concat([Buffer.from(`100644 ${name}\0`), sha]) })),
      ...[...dirs].map(([name, sub]) => ({ key: `${name}/`, row: Buffer.concat([Buffer.from(`40000 ${name}\0`), tree(sub)]) })),
    ].sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
    return gitObject('tree', Buffer.concat(rows.map(r => r.row)));
  };
  return tree([...files]).toString('hex');
}

/**
 * グローバルスキルの取得元として、同じ内容を保持する日本語版の GitHub タグを
 * `skills` パッケージのロックファイルに記録する。これにより、`npx skills update -g`、
 * `list`、`remove` で GitHub から導入したスキルと同様に扱える。
 */
async function recordGlobalSkills(names: readonly string[], expected: ReadonlyMap<string, ReadonlyMap<string, string>>, version: string): Promise<void> {
  if (!names.length) return;
  const stateHome = process.env.XDG_STATE_HOME;
  const lockPath = stateHome
    ? path.join(stateHome, 'skills', '.skill-lock.json')
    : path.join(os.homedir(), '.agents', '.skill-lock.json');
  // ロックファイルを読めない場合や形式が古い場合は、新しい内容で初期化する。
  let lock: { version: number; skills: Record<string, Record<string, unknown>>; dismissed?: unknown } = { version: 3, skills: {}, dismissed: {} };
  try {
    const saved = JSON.parse(await fs.readFile(lockPath, 'utf8'));
    if (typeof saved.version === 'number' && saved.version >= 3 && saved.skills) lock = saved;
  } catch {
    // 利用できるロックファイルがない。
  }
  const now = new Date().toISOString();
  for (const name of names) {
    lock.skills[name] = {
      source: 'ayumuwall/OpenSpec-J',
      sourceType: 'github',
      sourceUrl: 'https://github.com/ayumuwall/OpenSpec-J.git',
      ref: `v${version}`,
      skillPath: `skills/${name}/SKILL.md`,
      skillFolderHash: skillFolderHash(expected.get(name)!),
      installedAt: lock.skills[name]?.installedAt ?? now,
      updatedAt: now,
    };
  }
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  await fs.writeFile(lockPath, JSON.stringify(lock, null, 2));
}

export async function installReleaseSkills(targets: Targets, names: string[], version: string): Promise<Map<string, Error>> {
  const failures = new Map<string, Error>();
  if (!names.length) return failures;
  const expected = expectedSkillFiles(version);
  // 同梱スキルを使うため、通信せずに CLI と同じバージョンをインストールできる。
  // 相対 TMPDIR を GitHub の owner/repo と誤認しないよう、絶対パスにする。
  const source = path.resolve(await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-skills-')));
  let result: Awaited<ReturnType<typeof installSkills>>;
  try {
    for (const name of names) {
      for (const [file, text] of expected.get(name)!) {
        const target = path.join(source, 'skills', name, file);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, text);
      }
    }
    result = await installSkills(source, {
      ...targets,
      skills: names,
      telemetry: false,
      lockfile: false,
      // Git cannot carry a Windows junction into a teammate's checkout.
      mode: targets.scope === 'project' && process.platform === 'win32' ? 'copy' : 'auto',
    });
  } finally {
    await fs.rm(source, { recursive: true, force: true }).catch(() => undefined);
  }
  if (targets.scope === 'global') {
    await recordGlobalSkills([...new Set(result.installed.map(entry => entry.skill))], expected, version);
  }
  const matches = async (dir: string, name: string) => {
    for (const [file, text] of expected.get(name) ?? []) {
      const found = await fs.readFile(path.join(dir, file), 'utf8').catch(() => undefined);
      if (found?.replaceAll('\r\n', '\n') !== text) return false;
    }
    return true;
  };
  for (const failure of result.failed) failures.set(failure.agent, new Error(failure.message));
  for (const skip of result.skipped) failures.set(skip.agent, new Error(`${skip.agent} が ${skip.skill} をスキップしました: ${skip.reason}`));
  for (const agent of targets.agents) {
    if (failures.has(agent)) continue;
    for (const name of names) {
      const entry = result.installed.find(target => target.agent === agent && target.skill === name);
      if (entry && targets.scope === 'project') continue;
      if (entry && await matches(entry.path, name)) continue;
      failures.set(agent, new Error(`${agent} に ${name} がインストールされませんでした`));
      break;
    }
  }
  return failures;
}

export async function removeManagedSkills(targets: Targets, names: string[]): Promise<void> {
  if (!names.length) return;
  const result = await removeSkills(names, { ...targets, telemetry: false, lockfile: targets.scope === 'global' });
  if (result.failed.length) throw new Error(result.failed.map(failure => failure.message).join('\n'));
}
