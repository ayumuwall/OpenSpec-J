import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  installStandalone,
  checkSource,
  installerBase,
  removeCommandFor,
  resolveInstallTarget,
} from '../../src/commands/install-standalone.js';
import { findCopiesOnPath } from '../../src/utils/executable-path.js';
import { runCLI } from '../helpers/run-cli.js';

describe('openspec install', () => {
  it.skipIf(process.platform !== 'win32')('charsetのないHTTP応答でもBOM付きインストーラーと日本語出力を保持する', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-install-encoding-'));
    const message = '日本語のインストーラーを実行しました';
    const script = Buffer.from('\uFEFF# UTF-8 installer (no Node.js needed)\nWrite-Output "' + message + '"\n', 'utf8');
    const server = http.createServer((request, response) => {
      if (request.url !== '/install.ps1') {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': 'application/octet-stream' }).end(script);
    });
    try {
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = (server.address() as AddressInfo).port;
      const result = await runCLI(['install'], {
        cwd: root,
        env: {
          XDG_CONFIG_HOME: path.join(root, 'config'),
          XDG_DATA_HOME: path.join(root, 'data'),
          OPENSPEC_DOWNLOAD_URL: `http://127.0.0.1:${port}`,
          OPENSPEC_INSTALL_DIR: path.join(root, 'bin'),
        },
      });
      expect(result.exitCode, result.stdout + result.stderr).toBe(0);
      expect(result.stdout).toContain(message);
      expect(result.stderr).not.toContain('CommandNotFoundException');
      expect(result.stdout + result.stderr).not.toContain('ï»¿');
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  describe('resolveInstallTarget', () => {
    it('uses the installers\' default folder', () => {
      expect(resolveInstallTarget({}, 'darwin', null)).toEqual({
        dir: path.join(os.homedir(), '.local', 'bin'),
        name: 'openspec',
      });
      expect(resolveInstallTarget({ LOCALAPPDATA: 'C:\\Users\\a\\AppData\\Local' }, 'win32', null)).toEqual({
        dir: path.join('C:\\Users\\a\\AppData\\Local', 'Programs', 'openspec'),
        name: 'openspec.exe',
      });
    });

    it('reinstalls the standalone binary where it is, under its own name', () => {
      const binary = path.join(os.tmpdir(), 'tools', 'openspec-linux-x64');
      expect(resolveInstallTarget({}, 'linux', binary)).toEqual({
        dir: path.dirname(binary),
        name: 'openspec-linux-x64',
      });
    });

    it('honors OPENSPEC_INSTALL_DIR and resolves it to an absolute folder', () => {
      expect(resolveInstallTarget({ OPENSPEC_INSTALL_DIR: 'relative/bin' }, 'linux', '/x/openspec')).toEqual({
        dir: path.resolve('relative/bin'),
        name: 'openspec',
      });
    });
  });

  describe('removeCommandFor', () => {
    const global = (packageManager: string | null, location = '/usr/lib/node_modules/@ayumuwall/openspec') =>
      ({ location, packageManager, scope: 'global' }) as Parameters<typeof removeCommandFor>[0];

    it('names the uninstall command of the package manager that owns the copy', () => {
      expect(removeCommandFor(global('npm'))).toBe('npm uninstall -g @ayumuwall/openspec');
      expect(removeCommandFor(global('pnpm'))).toBe('pnpm remove -g @ayumuwall/openspec');
      expect(removeCommandFor(global('yarn'))).toBe('yarn global remove @ayumuwall/openspec');
      expect(removeCommandFor(global('bun'))).toBe('bun remove -g @ayumuwall/openspec');
      expect(removeCommandFor(global('volta'))).toBe('volta uninstall @ayumuwall/openspec');
    });

    it('sends the Homebrew formula to brew', () => {
      const cellar = '/opt/homebrew/Cellar/openspec-j/1.14.3/libexec/lib/node_modules/@ayumuwall/openspec';
      expect(removeCommandFor(global('npm', cellar))).toBe('brew uninstall openspec-j');
    });

    it('suggests nothing for copies that are not a global install', () => {
      expect(removeCommandFor({ location: '/p/node_modules/@ayumuwall/openspec', packageManager: 'npm', scope: 'project' })).toBeNull();
      expect(removeCommandFor({ location: '/repo', packageManager: null, scope: 'source' })).toBeNull();
      expect(removeCommandFor({ location: null, packageManager: null, scope: 'standalone' })).toBeNull();
    });
  });

  describe('findCopiesOnPath', () => {
    let root: string;
    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-path-'));
    });
    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true });
    });

    const place = (dir: string, name: string, mode = 0o755) => {
      fs.mkdirSync(path.join(root, dir), { recursive: true });
      fs.writeFileSync(path.join(root, dir, name), '', { mode });
      return path.join(root, dir, name);
    };

    it.skipIf(process.platform === 'win32')('lists runnable copies in PATH order, once each', () => {
      const first = place('a', 'openspec');
      place('b', 'openspec', 0o644); // not executable: a shell skips it
      const second = place('c', 'openspec');
      const pathValue = ['a', 'missing', 'b', 'c', 'a'].map((dir) => path.join(root, dir)).join(path.delimiter);

      expect(findCopiesOnPath(pathValue, 'linux')).toEqual([first, second]);
    });

    it('finds the Windows executable and npm\'s .cmd shim', () => {
      const exe = place('a', 'openspec.exe');
      const shim = place('b', 'openspec.cmd');
      const pathValue = [path.join(root, 'a'), path.join(root, 'b')].join(path.delimiter);

      expect(findCopiesOnPath(pathValue, 'win32')).toEqual([exe, shim]);
    });
  });

  describe('installerBase', () => {
    it('takes the installer from main, which always has it, unless a mirror is set', () => {
      expect(installerBase({})).toBe('https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/scripts/binary');
      expect(installerBase({ OPENSPEC_DOWNLOAD_URL: 'http://127.0.0.1:8765/' })).toBe('http://127.0.0.1:8765');
    });

    it('checks OPENSPEC_RELEASES_URL too, though the installer is what reads it', () => {
      expect(() => installerBase({ OPENSPEC_RELEASES_URL: 'http://localhost:80@evil.example/' })).toThrow(
        'OPENSPEC_RELEASES_URL は https'
      );
    });
  });

  describe('checkSource', () => {
    it('accepts https anywhere, and plain http only to this machine', () => {
      expect(checkSource('X', 'https://mirror.example.com/openspec/')).toBe('https://mirror.example.com/openspec');
      expect(checkSource('X', 'http://127.0.0.1:8765')).toBe('http://127.0.0.1:8765');
      expect(checkSource('X', 'http://localhost:9/x')).toBe('http://localhost:9/x');
      expect(checkSource('X', 'http://[::1]:8/x')).toBe('http://[::1]:8/x');
    });

    it.each([
      'http://localhost:80@evil.example/x',
      'http://localhost@evil.example',
      'https://user@mirror.example.com',
      'http://127.0.0.1.evil.example/',
      'http://localhost.evil.example',
      'http://mirror.example.com',
      'ftp://localhost/',
      'not a url',
    ])('refuses %s', (unsafe) => {
      expect(() => checkSource('OPENSPEC_DOWNLOAD_URL', unsafe)).toThrow('OPENSPEC_DOWNLOAD_URL');
    });
  });

  it('refuses a version that is not a release version, before downloading anything', async () => {
    await expect(installStandalone({ version: '1.2.3; rm -rf /' })).rejects.toThrow('リリースバージョンではありません');
    await expect(installStandalone({ version: 'main' })).rejects.toThrow('リリースバージョンではありません');
  });
});
