import chalk from 'chalk';
import * as nodeFs from 'node:fs';
import * as path from 'node:path';

import {
  inferLinkName,
  resolveExistingDirectory,
  validateLinkNameForCommand,
} from './operations.js';
import { workspacePromptTheme, workspaceSelectTheme } from './prompt-theme.js';
import { asErrorMessage } from './types.js';

const fs = nodeFs;

export interface PromptSetupLinksOptions {
  heading?: string;
  intro?: string;
  allowEmpty?: boolean;
  emptyName?: string;
  emptyShort?: string;
  emptyDescription?: string;
  finishName?: string;
  finishShort?: string;
  finishDescription?: string;
}

type LinkPromptAction = 'finish' | 'add';

async function promptExistingPath(message: string, defaultPath?: string): Promise<string> {
  const { input } = await import('@inquirer/prompts');

  const pathInput = await input({
    message,
    default: defaultPath,
    prefill: defaultPath ? 'editable' : undefined,
    required: true,
    theme: workspacePromptTheme,
    validate(value: string) {
      const resolvedPath = path.isAbsolute(value)
        ? path.resolve(value)
        : path.resolve(process.cwd(), value);
      return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()
        ? true
        : '既存のリポジトリまたはフォルダのパスを入力してください。';
    },
  });

  return resolveExistingDirectory(pathInput);
}

async function promptLinkName(existingLinks: Record<string, string>): Promise<string> {
  const { input } = await import('@inquirer/prompts');

  return input({
    message: 'Link 名:',
    required: true,
    theme: workspacePromptTheme,
    validate(value: string) {
      try {
        validateLinkNameForCommand(value);
      } catch (error) {
        return asErrorMessage(error);
      }

      if (existingLinks[value]) {
        return `Link 名 '${value}' は既に ${existingLinks[value]} にリンクされています。`;
      }

      return true;
    },
  });
}

export async function promptSetupLinks(
  options: PromptSetupLinksOptions = {}
): Promise<Record<string, string>> {
  const { select } = await import('@inquirer/prompts');
  const links: Record<string, string> = {};
  const heading = options.heading ?? '[2/5] リポジトリまたはフォルダをリンク';
  const intro = options.intro ?? '現在のディレクトリから始めるか、別のリポジトリパスを入力してください。';

  console.log('');
  console.log(chalk.bold(heading));
  console.log(chalk.dim(intro));
  console.log('');

  while (true) {
    const linkCount = Object.keys(links).length;
    if (linkCount === 0 && options.allowEmpty) {
      const firstAction = await select<LinkPromptAction>({
        message: '続行',
        default: 'finish',
        choices: [
          {
            name: options.emptyName ?? options.finishName ?? 'workspace ファイルを作成',
            short: options.emptyShort ?? options.finishShort ?? 'workspace ファイルを作成',
            value: 'finish',
            description: options.emptyDescription ?? 'リポジトリまたはフォルダをリンクせずに workspace を作成',
          },
          {
            name: 'リポジトリまたはフォルダを追加',
            short: 'リポジトリを追加',
            value: 'add',
            description: 'この workspace にローカル実装コンテキストを含める',
          },
        ],
        theme: workspaceSelectTheme,
      });

      if (firstAction === 'finish') {
        return links;
      }
    }

    const resolvedPath = await promptExistingPath(
      linkCount === 0 ? 'リポジトリまたはフォルダのパス:' : '別のリポジトリまたはフォルダのパス:',
      linkCount === 0 ? '.' : undefined
    );
    let linkName = inferLinkName(resolvedPath);

    try {
      validateLinkNameForCommand(linkName);
    } catch {
      linkName = await promptLinkName(links);
    }

    if (links[linkName]) {
      console.log(`Link 名 '${linkName}' は既に ${links[linkName]} にリンクされています。`);
      linkName = await promptLinkName(links);
    }

    links[linkName] = resolvedPath;
    console.log(chalk.green(`Link '${linkName}' を追加しました`));
    console.log(chalk.dim(`  ${resolvedPath}`));

    const nextAction = await select<LinkPromptAction>({
      message: '続行',
      default: 'finish',
      choices: [
        {
          name: options.finishName ?? 'workspace ファイルを作成',
          short: options.finishShort ?? 'workspace ファイルを作成',
          value: 'finish',
          description: options.finishDescription ?? 'セットアップ後に workspace チェックを実行',
        },
        {
          name: '別のリポジトリまたはフォルダを追加',
          short: '別の項目を追加',
          value: 'add',
          description: 'この workspace に別のローカルディレクトリを含める',
        },
      ],
      theme: workspaceSelectTheme,
    });

    if (nextAction === 'finish') {
      return links;
    }
  }
}
