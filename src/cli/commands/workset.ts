import { Command, Option } from 'commander';
import { COMMAND_REGISTRY } from '../../core/completions/command-registry.js';
import type { StoreDiagnostic } from '../../core/store/errors.js';
import { printJson } from '../../commands/shared-output.js';
import type {
  WorksetCommand,
  WorksetCreateOptions,
  WorksetOpenOptions,
  WorksetRemoveOptions,
} from '../../commands/workset.js';

async function loadWorksetCommand(): Promise<WorksetCommand> {
  const { WorksetCommand } = await import('../../commands/workset.js');
  return new WorksetCommand();
}

function collectMember(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function registerWorksetCommand(program: Command): void {
  const groupDescription =
    COMMAND_REGISTRY.find((entry) => entry.name === 'workset')?.description ??
    '個人用の作業ビューを構成・保存・表示（ローカル限定）';
  const workset = program.command('workset').description(groupDescription);
  // Parsed at the group level so `openspec workset --json` keeps the
  // one-JSON-document contract instead of a raw Commander error. The
  // parent option matches anywhere; actions read optsWithGlobals().
  workset.addOption(new Option('--json', 'JSON として出力').hideHelp());

  workset
    .command('create [name]')
    .description('選択したフォルダーから名前付きの作業ビューを構成して保存')
    .option(
      '--member <member>',
      'メンバーフォルダーを <path> または <name>=<path> で指定（複数回指定可、最初がプライマリ）',
      collectMember,
      [] as string[]
    )
    .option('--tool <id>', 'このワークセットを開く優先ツール')
    .option('--json', 'JSON として出力')
    .action(async (name: string | undefined, _options: WorksetCreateOptions, command: Command) => {
      const worksetCommand = await loadWorksetCommand();
      await worksetCommand.create(name, command.optsWithGlobals());
    });

  workset
    .command('list')
    .alias('ls')
    .description('保存済みワークセットとメンバーを表示')
    .option('--json', 'JSON として出力')
    .action(async (_options: { json?: boolean }, command: Command) => {
      const worksetCommand = await loadWorksetCommand();
      await worksetCommand.list(command.optsWithGlobals());
    });

  workset
    .command('open <name>')
    .description('保存済みワークセットをツールで開く（エディターウィンドウまたはエージェントセッション）')
    .option('--tool <id>', '今回だけこのツールで開く')
    .addOption(
      // Parsed so Commander never owns the error; rejected in the
      // action with one JSON document. Hidden because help should not
      // advertise a mode that only rejects.
      new Option('--json', 'open ではサポートされていません').hideHelp()
    )
    .action(async (name: string, _options: WorksetOpenOptions, command: Command) => {
      const worksetCommand = await loadWorksetCommand();
      await worksetCommand.open(name, command.optsWithGlobals());
    });

  workset
    .command('remove <name>')
    .description('保存済みワークセットを削除（メンバーフォルダーは削除しません）')
    .option('--yes', '非対話で削除を確認')
    .option('--json', 'JSON として出力')
    .action(async (name: string, _options: WorksetRemoveOptions, command: Command) => {
      const worksetCommand = await loadWorksetCommand();
      await worksetCommand.remove(name, command.optsWithGlobals());
    });

  const subcommandsLine = workset.commands
    .map((subcommand) => {
      const aliases = subcommand.aliases();
      return aliases.length > 0
        ? `${subcommand.name()} (${aliases.join(', ')})`
        : subcommand.name();
    })
    .join(', ');

  // One handler owns missing AND unknown subcommands: known
  // subcommands dispatch above; everything else lands in this action
  // (allowExcessArguments routes the unknown operand here), keeping
  // the one-JSON-document contract for `--json` probes.
  workset.allowExcessArguments(true);
  workset.action(() => {
    const attempted = workset.args.filter(
      (operand) => !operand.startsWith('-')
    );
    const message =
      attempted.length > 0
        ? `'openspec workset' の不明なコマンド '${attempted[0]}' です。ワークセットサブコマンド: ${subcommandsLine}。`
        : `'openspec workset' のサブコマンドがありません。ワークセットサブコマンド: ${subcommandsLine}。`;
    if (workset.opts().json) {
      printJson({
        status: [
          {
            severity: 'error',
            code: 'unknown_workset_subcommand',
            message,
            fix: 'ワークセットサブコマンドのいずれかを実行してください。',
          } satisfies StoreDiagnostic,
        ],
      });
    } else {
      console.error(`エラー: ${message}`);
    }
    process.exitCode = 1;
  });
}
