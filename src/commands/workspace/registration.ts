import { Command } from 'commander';

import { getWorkspaceSkillToolIds } from '../../core/workspace/index.js';
import {
  WorkspaceLinkOptions,
  WorkspaceListOptions,
  WorkspaceOpenOptions,
  WorkspaceSetupOptions,
  WorkspaceUpdateOptions,
} from './types.js';

export interface WorkspaceCommandActions {
  setup(options: WorkspaceSetupOptions): Promise<void>;
  list(options: WorkspaceListOptions): Promise<void>;
  link(
    nameOrPath: string | undefined,
    linkPath: string | undefined,
    options: WorkspaceLinkOptions
  ): Promise<void>;
  relink(
    linkNameInput: string | undefined,
    linkPath: string | undefined,
    options: WorkspaceLinkOptions
  ): Promise<void>;
  doctor(options: WorkspaceLinkOptions): Promise<void>;
  update(
    positionalName: string | undefined,
    options: WorkspaceUpdateOptions
  ): Promise<void>;
  open(
    positionalName: string | undefined,
    options: WorkspaceOpenOptions
  ): Promise<void>;
}

function collectOption(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function addWorkspaceSelectionOptions(command: Command): Command {
  return command
    .option('--workspace <name>', '既知のローカルワークスペースビューから選ぶ workspace 名')
    .option('--json', 'JSON で出力')
    .option('--no-interactive', 'プロンプトを無効化');
}

export function registerWorkspaceCommandWith(
  program: Command,
  workspaceCommand: WorkspaceCommandActions
): void {
  const workspace = program
    .command('workspace')
    .description('調整用ワークスペースをセットアップ・確認');

  workspace
    .command('setup')
    .description('ワークスペースをセットアップし、既存のリポジトリまたはフォルダをリンク')
    .option('--name <name>', 'Workspace 名')
    .option('--link <link>', 'リポジトリまたはフォルダのリンク。<path> または <name>=<path> を使用', collectOption, [])
    .option('--opener <id>', 'デフォルトの開き方: codex-cli, claude, github-copilot, editor')
    .option(
      '--tools <tools>',
      `エージェント向け OpenSpec スキルをインストール。"all" / "none" またはカンマ区切りで指定: ${getWorkspaceSkillToolIds().join(', ')}`
    )
    .option('--json', 'JSON で出力')
    .option('--no-interactive', 'プロンプトを無効化')
    .action(async (options: WorkspaceSetupOptions) => {
      await workspaceCommand.setup(options);
    });

  workspace
    .command('list')
    .description('既知の OpenSpec ワークスペースを一覧表示')
    .option('--json', 'JSON で出力')
    .action(async (options: WorkspaceListOptions) => {
      await workspaceCommand.list(options);
    });

  workspace
    .command('ls')
    .description('既知の OpenSpec ワークスペースを一覧表示')
    .option('--json', 'JSON で出力')
    .action(async (options: WorkspaceListOptions) => {
      await workspaceCommand.list(options);
    });

  addWorkspaceSelectionOptions(
    workspace
      .command('link [nameOrPath] [path]')
      .description('既存のリポジトリまたはフォルダを workspace にリンク')
  ).action(async (
    nameOrPath: string | undefined,
    linkPath: string | undefined,
    options: WorkspaceLinkOptions
  ) => {
    await workspaceCommand.link(nameOrPath, linkPath, options);
  });

  addWorkspaceSelectionOptions(
    workspace
      .command('relink <name> <path>')
      .description('既存 workspace link のローカルパスを更新')
  ).action(async (
    linkName: string | undefined,
    linkPath: string | undefined,
    options: WorkspaceLinkOptions
  ) => {
    await workspaceCommand.relink(linkName, linkPath, options);
  });

  addWorkspaceSelectionOptions(
    workspace
      .command('doctor')
      .description('このマシンで workspace が解決できる内容を確認')
  ).action(async (options: WorkspaceLinkOptions) => {
    await workspaceCommand.doctor(options);
  });

  workspace
    .command('update [name]')
    .description('ワークスペース内の OpenSpec ガイダンスとエージェントスキルを更新')
    .option('--workspace <name>', '既知のローカルワークスペースビューから選ぶ workspace 名')
    .option(
      '--tools <tools>',
      `ワークスペーススキルの対象エージェントを選択。"all" / "none" またはカンマ区切りで指定: ${getWorkspaceSkillToolIds().join(', ')}。Global profile が workflows を選び、--tools が agents を選びます。`
    )
    .option('--json', 'JSON で出力')
    .option('--no-interactive', 'プロンプトを無効化')
    .action(async (name: string | undefined, options: WorkspaceUpdateOptions) => {
      await workspaceCommand.update(name, options);
    });

  workspace
    .command('open [name]')
    .description('workspace をエージェントまたは VS Code editor で開く')
    .option('--workspace <name>', '既知のローカルワークスペースビューから選ぶ workspace 名')
    .option('--initiative <id>', 'initiative をローカルワークスペースビューとして開く')
    .option('--store <id>', '--initiative 用の context store ID')
    .option('--store-path <path>', '--initiative 用の既存ローカル context store ルート')
    .option('--agent <tool>', 'このセッションで使うエージェント: codex-cli, claude, github-copilot')
    .option('--editor', 'VS Code エディタモードで workspace を開く')
    .option('--prepare-only', '未対応: プレビュー出力は将来の context/query コマンドの対象')
    .option('--json', '起動後に生成された workspace view のコンテキストを JSON で出力')
    .option('--change <id>', '未対応: change 単位の open は将来の workspace change planning の対象')
    .option('--no-interactive', 'プロンプトを無効化')
    .action(async (name: string | undefined, options: WorkspaceOpenOptions) => {
      await workspaceCommand.open(name, options);
    });

  // Intentionally no public `workspace create` command in this slice.
}
