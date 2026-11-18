import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCLI } from '../helpers/run-cli.js';

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/released-output');

describe('日本語公開版 v1.15.0 からの移行', () => {
  let root: string;
  let project: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-j-release-upgrade-'));
    project = path.join(root, 'project');
    const home = path.join(root, 'home');
    await fs.mkdir(path.join(project, 'openspec'), { recursive: true });
    await fs.mkdir(home);
    env = {
      HOME: home, USERPROFILE: home,
      XDG_CONFIG_HOME: path.join(home, '.config'),
      XDG_DATA_HOME: path.join(home, '.local/share'),
      CODEX_HOME: path.join(home, '.codex'),
    };
    await fs.writeFile(path.join(project, 'openspec/config.yaml'), 'schema: spec-driven\n');
  });

  afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });

  it.each([false, true])('旧生成物を移行し、編集済みコマンドを保持して組み込みスキルを更新する（編集あり: %s）', async (edited) => {
    const command = path.join(project, '.claude/commands/opsx/propose.md');
    const skill = path.join(project, '.claude/skills/openspec-propose/SKILL.md');
    const suffix = edited ? '\nチーム独自の手順を実行してください。\n' : '';
    const commandText = await fs.readFile(path.join(fixtures, 'v1.15.0-j-claude-command-propose.md'), 'utf8') + suffix;
    const skillText = await fs.readFile(path.join(fixtures, 'v1.15.0-j-claude-skill-propose.md'), 'utf8') + suffix;
    await fs.mkdir(path.dirname(command), { recursive: true });
    await fs.mkdir(path.dirname(skill), { recursive: true });
    await fs.writeFile(command, commandText);
    await fs.writeFile(skill, skillText);

    const result = await runCLI(['update'], { cwd: project, env });
    expect(result.exitCode, result.stdout + result.stderr).toBe(0);
    const shared = path.join(project, '.agents/skills/openspec-propose/SKILL.md');
    expect(await fs.readFile(shared, 'utf8')).toContain('name: openspec-propose');
    if (edited) {
      expect(await fs.readFile(command, 'utf8')).toBe(commandText);
      expect(await fs.readFile(skill, 'utf8')).toBe(await fs.readFile(shared, 'utf8'));
      expect(await fs.readFile(skill, 'utf8')).not.toContain(suffix);
      expect(result.stdout).toContain('コマンドファイル1件を保持しました');
    } else {
      await expect(fs.access(command)).rejects.toThrow();
      expect(await fs.readFile(skill, 'utf8')).toBe(await fs.readFile(shared, 'utf8'));
    }

    const next = await runCLI(['update', '--dry-run', '--json'], { cwd: project, env });
    expect(next.exitCode, next.stdout + next.stderr).toBe(0);
    expect(JSON.parse(next.stdout).changes).toEqual([]);
    const again = await runCLI(['update'], { cwd: project, env });
    expect(again.exitCode, again.stdout + again.stderr).toBe(0);
    expect(again.stdout).toContain('最新です');
    if (edited) {
      expect(await fs.readFile(command, 'utf8')).toBe(commandText);
      expect(await fs.readFile(skill, 'utf8')).toBe(await fs.readFile(shared, 'utf8'));
      expect(await fs.readFile(skill, 'utf8')).not.toContain(suffix);
    }
  });
});
