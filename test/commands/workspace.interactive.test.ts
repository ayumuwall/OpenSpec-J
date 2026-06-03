import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  createInitiative,
  mountInitiativesCollection,
  registerContextStore,
} from '../../src/core/index.js';
import {
  getManagedWorkspaceRoot,
  getWorkspaceViewStatePath,
  parseWorkspaceViewState,
} from '../../src/core/workspace/index.js';
import { prependProcessPathEnv, setProcessPathEnv } from '../helpers/path-env.js';

const searchableMultiSelectMock = vi.hoisted(() => vi.fn(async () => []));

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
}));

vi.mock('../../src/prompts/searchable-multi-select.js', () => ({
  default: searchableMultiSelectMock,
  searchableMultiSelect: searchableMultiSelectMock,
}));

async function runWorkspaceCommand(args: string[]): Promise<void> {
  const { registerWorkspaceCommand } = await import('../../src/commands/workspace.js');
  const program = new Command();
  registerWorkspaceCommand(program);
  await program.parseAsync(['node', 'openspec', 'workspace', ...args]);
}

async function getPromptMocks(): Promise<{
  input: ReturnType<typeof vi.fn>;
  confirm: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
}> {
  const prompts = await import('@inquirer/prompts');
  return {
    input: prompts.input as unknown as ReturnType<typeof vi.fn>,
    confirm: prompts.confirm as unknown as ReturnType<typeof vi.fn>,
    select: prompts.select as unknown as ReturnType<typeof vi.fn>,
  };
}

describe('workspace command interactive flows', () => {
  let tempDir: string;
  let dataHome: string;
  let configHome: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: string;
  let originalStdinTTY: boolean | undefined;
  let originalExitCode: string | number | undefined;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-workspace-interactive-'));
    dataHome = path.join(tempDir, 'data');
    configHome = path.join(tempDir, 'config');
    originalEnv = { ...process.env };
    originalCwd = process.cwd();
    originalStdinTTY = (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY;
    originalExitCode = process.exitCode;

    process.env = {
      ...process.env,
      XDG_DATA_HOME: dataHome,
      XDG_CONFIG_HOME: configHome,
      OPENSPEC_TELEMETRY: '0',
    };
    delete process.env.CI;
    delete process.env.OPEN_SPEC_INTERACTIVE;
    process.chdir(tempDir);
    (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = true;
    process.exitCode = undefined;

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    searchableMultiSelectMock.mockReset();
    searchableMultiSelectMock.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);
    (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = originalStdinTTY;
    process.exitCode = originalExitCode;
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  function mkdir(relativePath: string): string {
    const dir = path.join(tempDir, relativePath);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function expectedExistingPath(existingPath: string): string {
    return fs.realpathSync.native(existingPath);
  }

  function readWorkspaceState(workspaceName: string) {
    const workspaceRoot = getManagedWorkspaceRoot(workspaceName);
    return parseWorkspaceViewState(fs.readFileSync(getWorkspaceViewStatePath(workspaceRoot), 'utf-8'));
  }

  async function setupInitiative(storeId = 'team-context', initiativeId = 'agent-trace-hooks') {
    const storeRoot = mkdir(`stores/${storeId}`);
    await registerContextStore({
      id: storeId,
      localPath: storeRoot,
    });
    await createInitiative({
      collection: mountInitiativesCollection(storeRoot),
      id: initiativeId,
      title: 'Agent Trace Hooks',
      summary: 'Explore lightweight capture of agent trace events.',
    });

    return {
      storeId,
      storeRoot,
      initiativeId,
      initiativeRoot: path.join(storeRoot, 'initiatives', initiativeId),
    };
  }

  it('asks for the workspace name first and validates kebab-case before asking for links', async () => {
    const api = mkdir('repos/api');
    const expectedApi = expectedExistingPath(api);
    const { input, confirm, select } = await getPromptMocks();

    input.mockImplementation(async (options: { message: string; validate?: (value: string) => true | string }) => {
      if (options.message === 'Workspace 名:') {
        expect(options.validate?.('Bad_Name')).toBe(
          'Workspace 名は小文字・数字・単一ハイフン区切りの kebab-case にしてください'
        );
        return 'platform';
      }

      if (options.message === 'リポジトリまたはフォルダのパス:') {
        expect(options.validate?.('missing-api')).toBe('既存のリポジトリまたはフォルダのパスを入力してください。');
        return api;
      }

      throw new Error(`Unexpected input prompt: ${options.message}`);
    });
    select.mockResolvedValueOnce('finish').mockResolvedValueOnce('editor');

    await runWorkspaceCommand(['setup']);

    expect(process.exitCode).toBeUndefined();
    expect(input.mock.calls.map((call) => call[0].message)).toEqual([
      'Workspace 名:',
      'リポジトリまたはフォルダのパス:',
    ]);
    expect(input.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        theme: expect.objectContaining({ prefix: '' }),
      })
    );
    expect(confirm).not.toHaveBeenCalled();
    expect(select.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        message: '続行',
        default: 'finish',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'finish' }),
          expect.objectContaining({ value: 'add' }),
        ]),
      })
    );
    expect(readWorkspaceState('platform').links).toEqual({ api: expectedApi });
  });

  it('handles prompt cancellation without printing the raw SIGINT error', async () => {
    const { input } = await getPromptMocks();
    const cancellationError = new Error('User force closed the prompt with SIGINT');
    cancellationError.name = 'ExitPromptError';
    input.mockRejectedValueOnce(cancellationError);

    await runWorkspaceCommand(['setup']);

    expect(process.exitCode).toBe(130);
    expect(consoleErrorSpy).toHaveBeenCalledWith('キャンセルしました。');
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('User force closed the prompt with SIGINT')
    );
  });

  it('asks for a default opener after links and records the selected opener', async () => {
    const api = mkdir('repos/api');
    const binDir = mkdir('bin');
    const codePath = path.join(binDir, process.platform === 'win32' ? 'code.cmd' : 'code');
    fs.writeFileSync(codePath, '');
    fs.chmodSync(codePath, 0o755);
    setProcessPathEnv(binDir);
    const { input, confirm, select } = await getPromptMocks();

    input.mockImplementation(async (options: { message: string }) => {
      if (options.message === 'Workspace 名:') {
        return 'platform';
      }

      if (options.message === 'リポジトリまたはフォルダのパス:') {
        return api;
      }

      throw new Error(`Unexpected input prompt: ${options.message}`);
    });
    select.mockImplementation(async (options: { message: string; choices?: Array<{ name: string; value: string }> }) => {
      if (options.message === '続行') {
        return 'finish';
      }

      if (options.message === 'デフォルトの開き方:') {
        expect(options.choices?.map((choice) => choice.value)).toEqual(
          expect.arrayContaining(['editor', 'github-copilot'])
        );
        return 'github-copilot';
      }

      throw new Error(`Unexpected select prompt: ${options.message}`);
    });

    await runWorkspaceCommand(['setup']);

    expect(process.exitCode).toBeUndefined();
    expect(confirm).not.toHaveBeenCalled();
    expect(readWorkspaceState('platform').preferred_opener).toEqual({
      kind: 'agent',
      id: 'github-copilot',
    });
  });

  it('asks which agents get OpenSpec skills and preselects the default opener', async () => {
    const api = mkdir('repos/api');
    const binDir = mkdir('bin');
    const codexPath = path.join(binDir, process.platform === 'win32' ? 'codex.cmd' : 'codex');
    fs.writeFileSync(codexPath, '');
    fs.chmodSync(codexPath, 0o755);
    setProcessPathEnv(binDir);
    const { input, select } = await getPromptMocks();

    input.mockImplementation(async (options: { message: string }) => {
      if (options.message === 'Workspace 名:') {
        return 'platform';
      }

      if (options.message === 'リポジトリまたはフォルダのパス:') {
        return api;
      }

      throw new Error(`Unexpected input prompt: ${options.message}`);
    });
    select.mockImplementation(async (options: { message: string }) => {
      if (options.message === '続行') {
        return 'finish';
      }

      if (options.message === 'デフォルトの開き方:') {
        return 'codex-cli';
      }

      throw new Error(`Unexpected select prompt: ${options.message}`);
    });
    searchableMultiSelectMock.mockImplementationOnce(async (options: {
      message: string;
      choices: Array<{ value: string; preSelected?: boolean }>;
    }) => {
      expect(options.message).toBe('この workspace で OpenSpec スキルを配布するエージェントを選択してください:');
      expect(options.choices.find((choice) => choice.value === 'codex')?.preSelected).toBe(true);
      expect(options.choices.find((choice) => choice.value === 'claude')?.preSelected).toBe(false);
      return ['codex', 'claude'];
    });

    await runWorkspaceCommand(['setup']);

    expect(process.exitCode).toBeUndefined();
    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    expect(readWorkspaceState('platform').workspace_skills).toEqual(
      expect.objectContaining({
        selected_agents: ['codex', 'claude'],
        last_applied_workflow_ids: ['propose', 'explore', 'apply', 'sync', 'archive'],
      })
    );
  });

  it('lets users add another path and rename an inferred link-name conflict', async () => {
    const firstApi = mkdir('repos/current/api');
    const secondApi = mkdir('repos/archive/api');
    const expectedFirstApi = expectedExistingPath(firstApi);
    const expectedSecondApi = expectedExistingPath(secondApi);
    const { input, confirm, select } = await getPromptMocks();

    input.mockImplementation(async (options: { message: string; validate?: (value: string) => true | string }) => {
      if (options.message === 'Workspace 名:') {
        return 'platform';
      }

      if (options.message === 'リポジトリまたはフォルダのパス:') {
        return firstApi;
      }

      if (options.message === '別のリポジトリまたはフォルダのパス:') {
        return secondApi;
      }

      if (options.message === 'Link 名:') {
        expect(options.validate?.('api')).toBe(
          `Link 名 'api' は既に ${expectedFirstApi} にリンクされています。`
        );
        expect(options.validate?.('api-archive')).toBe(true);
        return 'api-archive';
      }

      throw new Error(`Unexpected input prompt: ${options.message}`);
    });
    select.mockResolvedValueOnce('add').mockResolvedValueOnce('finish').mockResolvedValueOnce('editor');

    await runWorkspaceCommand(['setup']);

    expect(process.exitCode).toBeUndefined();
    expect(input.mock.calls.map((call) => call[0].message)).toEqual([
      'Workspace 名:',
      'リポジトリまたはフォルダのパス:',
      '別のリポジトリまたはフォルダのパス:',
      'Link 名:',
    ]);
    expect(confirm).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Link 名 'api' は既に ${expectedFirstApi} にリンクされています。`
    );
    expect(readWorkspaceState('platform').links).toEqual({
      api: expectedFirstApi,
      'api-archive': expectedSecondApi,
    });
  });

  it('asks for a link name when the inferred basename is invalid', async () => {
    const linkedRoot = path.parse(tempDir).root;
    const expectedLinkedRoot = expectedExistingPath(linkedRoot);
    const { input, confirm, select } = await getPromptMocks();

    input.mockImplementation(async (options: { message: string; validate?: (value: string) => true | string }) => {
      if (options.message === 'Workspace 名:') {
        return 'platform';
      }

      if (options.message === 'リポジトリまたはフォルダのパス:') {
        return linkedRoot;
      }

      if (options.message === 'Link 名:') {
        expect(options.validate?.('')).toBe('Workspace link name は空にできません');
        expect(options.validate?.('root')).toBe(true);
        return 'root';
      }

      throw new Error(`Unexpected input prompt: ${options.message}`);
    });
    select.mockResolvedValueOnce('finish').mockResolvedValueOnce('editor');

    await runWorkspaceCommand(['setup']);

    expect(process.exitCode).toBeUndefined();
    expect(input.mock.calls.map((call) => call[0].message)).toEqual([
      'Workspace 名:',
      'リポジトリまたはフォルダのパス:',
      'Link 名:',
    ]);
    expect(confirm).not.toHaveBeenCalled();
    expect(readWorkspaceState('platform').links).toEqual({
      root: expectedLinkedRoot,
    });
  });

  it('shows an interactive workspace picker when multiple workspaces are known', async () => {
    const api = mkdir('repos/api');
    const web = mkdir('repos/web');
    const { select } = await getPromptMocks();

    await runWorkspaceCommand(['setup', '--no-interactive', '--name', 'platform', '--link', `api=${api}`]);
    await runWorkspaceCommand(['setup', '--no-interactive', '--name', 'checkout-web', '--link', `web=${web}`]);
    consoleLogSpy.mockClear();

    select.mockResolvedValueOnce('checkout-web');

    await runWorkspaceCommand(['doctor']);

    expect(process.exitCode).toBeUndefined();
    expect(select).toHaveBeenCalledTimes(1);
    expect(select.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        message: 'Workspace を選択:',
        choices: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('platform'),
            value: 'platform',
          }),
          expect.objectContaining({
            name: expect.stringContaining('checkout-web'),
            value: 'checkout-web',
          }),
        ]),
      })
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Workspace: checkout-web');
  });

  it('prompts for an opener during workspace open when no preference is stored', async () => {
    const api = mkdir('repos/api');
    const binDir = mkdir('bin');
    const codePath = path.join(binDir, process.platform === 'win32' ? 'code.cmd' : 'code');
    fs.writeFileSync(
      codePath,
      process.platform === 'win32' ? '@echo off\r\nexit /B 0\r\n' : '#!/bin/sh\nexit 0\n'
    );
    fs.chmodSync(codePath, 0o755);
    prependProcessPathEnv(binDir);
    const { select } = await getPromptMocks();

    await runWorkspaceCommand(['setup', '--no-interactive', '--name', 'platform', '--link', `api=${api}`]);
    consoleLogSpy.mockClear();
    select.mockResolvedValueOnce('editor');

    await runWorkspaceCommand(['open']);

    expect(process.exitCode).toBeUndefined();
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '開く方法:',
      })
    );
    const openerPrompt = select.mock.calls.find(([options]) => options.message === '開く方法:')?.[0];
    expect(openerPrompt?.default).toBe('editor');
    expect(openerPrompt?.choices.map((choice: { value: string }) => choice.value)).toEqual(
      expect.arrayContaining(['editor', 'github-copilot'])
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Workspace を開きます: platform');
    expect(readWorkspaceState('platform').preferred_opener).toBeUndefined();
  });

  it('fails workspace open without prompting when no opener is available', async () => {
    const api = mkdir('repos/api');
    const { select } = await getPromptMocks();
    setProcessPathEnv('');

    await runWorkspaceCommand(['setup', '--no-interactive', '--name', 'platform', '--link', `api=${api}`]);
    consoleErrorSpy.mockClear();

    await runWorkspaceCommand(['open']);

    expect(process.exitCode).toBe(1);
    expect(select).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('PATH 上に workspace を開ける対応ツールがありません。')
    );
  });

  it('shows the workspace picker for workspace open when multiple workspaces are known', async () => {
    const api = mkdir('repos/api');
    const web = mkdir('repos/web');
    const binDir = mkdir('bin');
    const codePath = path.join(binDir, process.platform === 'win32' ? 'code.cmd' : 'code');
    fs.writeFileSync(
      codePath,
      process.platform === 'win32' ? '@echo off\r\nexit /B 0\r\n' : '#!/bin/sh\nexit 0\n'
    );
    fs.chmodSync(codePath, 0o755);
    prependProcessPathEnv(binDir);
    const { select } = await getPromptMocks();

    await runWorkspaceCommand([
      'setup',
      '--no-interactive',
      '--name',
      'platform',
      '--link',
      `api=${api}`,
      '--opener',
      'editor',
    ]);
    await runWorkspaceCommand([
      'setup',
      '--no-interactive',
      '--name',
      'checkout-web',
      '--link',
      `web=${web}`,
      '--opener',
      'editor',
    ]);
    consoleLogSpy.mockClear();
    select.mockResolvedValueOnce('checkout-web');

    await runWorkspaceCommand(['open']);

    expect(process.exitCode).toBeUndefined();
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Workspace を選択:',
      })
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Workspace を開きます: checkout-web');
  });

  it('shows initiatives in the bare workspace open picker and creates a local view', async () => {
    const initiative = await setupInitiative();
    const api = mkdir('repos/api');
    const expectedApi = expectedExistingPath(api);
    const binDir = mkdir('bin');
    const codePath = path.join(binDir, process.platform === 'win32' ? 'code.cmd' : 'code');
    fs.writeFileSync(
      codePath,
      process.platform === 'win32' ? '@echo off\r\nexit /B 0\r\n' : '#!/bin/sh\nexit 0\n'
    );
    fs.chmodSync(codePath, 0o755);
    prependProcessPathEnv(binDir);
    const { input, select } = await getPromptMocks();
    let continuePromptCount = 0;

    input.mockImplementation(async (options: { message: string }) => {
      if (options.message === 'リポジトリまたはフォルダのパス:') {
        return api;
      }

      throw new Error(`Unexpected input prompt: ${options.message}`);
    });

    select.mockImplementation(async (options: { message: string; choices?: Array<{ name: string; value: unknown }> }) => {
      if (options.message === 'Workspace または initiative を選択:') {
        const choice = options.choices?.find((candidate) =>
          candidate.name.includes('Initiative: team-context/agent-trace-hooks')
        );
        if (!choice) {
          throw new Error('Expected initiative choice to be present');
        }
        expect(choice?.name).toContain('ローカル workspace view を作成');
        return choice.value;
      }

      if (options.message === '続行') {
        continuePromptCount += 1;
        return continuePromptCount === 1 ? 'add' : 'finish';
      }

      throw new Error(`Unexpected select prompt: ${options.message}`);
    });

    await runWorkspaceCommand(['open', '--editor']);

    expect(process.exitCode).toBeUndefined();
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Workspace または initiative を選択:',
        choices: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('Initiative: team-context/agent-trace-hooks'),
            value: expect.objectContaining({
              kind: 'initiative',
              initiative: expect.objectContaining({
                store: 'team-context',
                id: 'agent-trace-hooks',
              }),
            }),
          }),
        ]),
      })
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Workspace を開きます: agent-trace-hooks');
    expect(consoleLogSpy).toHaveBeenCalledWith('Initiative: team-context/agent-trace-hooks');
    const workspaceState = readWorkspaceState('agent-trace-hooks');
    expect(workspaceState.context).toEqual({
      kind: 'initiative',
      store: {
        id: initiative.storeId,
        selector: {
          kind: 'registry',
          id: initiative.storeId,
        },
      },
      initiative: {
        id: initiative.initiativeId,
      },
    });
    expect(workspaceState.links).toEqual({ api: expectedApi });
  });

  it('can create an initiative workspace view without linked repos from the picker', async () => {
    const initiative = await setupInitiative('team-context', 'context-only-launch');
    const binDir = mkdir('bin');
    const codePath = path.join(binDir, process.platform === 'win32' ? 'code.cmd' : 'code');
    fs.writeFileSync(
      codePath,
      process.platform === 'win32' ? '@echo off\r\nexit /B 0\r\n' : '#!/bin/sh\nexit 0\n'
    );
    fs.chmodSync(codePath, 0o755);
    prependProcessPathEnv(binDir);
    const { input, select } = await getPromptMocks();

    select.mockImplementation(async (options: { message: string; choices?: Array<{ name: string; value: unknown }> }) => {
      if (options.message === 'Workspace または initiative を選択:') {
        const choice = options.choices?.find((candidate) =>
          candidate.name.includes('Initiative: team-context/context-only-launch')
        );
        if (!choice) {
          throw new Error('Expected initiative choice to be present');
        }
        return choice.value;
      }

      if (options.message === '続行') {
        expect(options.choices).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'workspace ファイルを作成',
              value: 'finish',
            }),
            expect.objectContaining({
              name: 'リポジトリまたはフォルダを追加',
              value: 'add',
            }),
          ])
        );
        return 'finish';
      }

      throw new Error(`Unexpected select prompt: ${options.message}`);
    });

    await runWorkspaceCommand(['open', '--editor']);

    expect(process.exitCode).toBeUndefined();
    expect(input).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Workspace を開きます: context-only-launch');
    const workspaceState = readWorkspaceState('context-only-launch');
    expect(workspaceState.context).toEqual({
      kind: 'initiative',
      store: {
        id: initiative.storeId,
        selector: {
          kind: 'registry',
          id: initiative.storeId,
        },
      },
      initiative: {
        id: initiative.initiativeId,
      },
    });
    expect(workspaceState.links).toEqual({});
  });

  it('does not prompt for initiative workspace links when JSON output is requested', async () => {
    const initiative = await setupInitiative('team-context', 'json-launch');
    const binDir = mkdir('bin');
    const codePath = path.join(binDir, process.platform === 'win32' ? 'code.cmd' : 'code');
    fs.writeFileSync(
      codePath,
      process.platform === 'win32' ? '@echo off\r\nexit /B 0\r\n' : '#!/bin/sh\nexit 0\n'
    );
    fs.chmodSync(codePath, 0o755);
    prependProcessPathEnv(binDir);
    const { input, select } = await getPromptMocks();

    await runWorkspaceCommand([
      'open',
      '--initiative',
      initiative.initiativeId,
      '--store',
      initiative.storeId,
      '--editor',
      '--json',
    ]);

    expect(process.exitCode).toBeUndefined();
    expect(input).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(readWorkspaceState('json-launch').links).toEqual({});
  });
});
