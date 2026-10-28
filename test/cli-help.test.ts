import { Argument, Command, Option } from 'commander';
import { describe, expect, it } from 'vitest';
import { configureJapaneseHelp } from '../src/cli/help.js';

describe('CLIヘルプの日本語表示', () => {
  it('子・孫コマンドにも日本語の見出しと組み込み説明を引き継ぐ', () => {
    const program = new Command('openspec');
    configureJapaneseHelp(program);
    const config = program.command('config').description('設定を管理');
    const get = config.command('get <key>').description('設定値を表示');
    get.addArgument(new Argument('[fallback]', '未設定時の値'));

    for (const command of [program, config, get]) {
      const help = command.helpInformation();
      expect(help).toContain('使用方法: openspec');
      expect(help).toContain('オプション:');
      expect(help).toContain('-h, --help');
      expect(help).toContain('ヘルプを表示');
      expect(help).not.toContain('display help for command');
    }
    expect(config.helpInformation()).toContain('指定したコマンドのヘルプを表示');
    expect(get.helpInformation()).toContain('引数:');
    expect(get.helpInformation()).toContain('get [options] <key> [fallback]');
  });

  it('表示ラベルを訳しても説明内の英語・選択肢・環境変数名を置換しない', () => {
    const program = new Command('openspec');
    configureJapaneseHelp(program);
    program
      .addOption(new Option('--format [value]', 'Usage: の例').choices(['default: en', 'json']).default('default: en').preset('json').env('OPENSPEC_QA_FORMAT'))
      .addArgument(new Argument('[mode]', 'Options: の例').choices(['Commands:', 'plain']).default('Commands:'));

    const help = program.helpInformation();
    expect(help).toContain('Usage: の例');
    expect(help).toContain('Options: の例');
    expect(help).toContain('選択肢: "default: en", "json"');
    expect(help).toContain('既定値: "default: en"');
    expect(help).toContain('引数省略時: "json"');
    expect(help).toContain('環境変数: OPENSPEC_QA_FORMAT');
    expect(help).toContain('選択肢: "Commands:", "plain"');
    expect(help).toContain('既定値: "Commands:"');

    program.parse(['--format', 'json', 'plain'], { from: 'user' });
    expect(program.opts()).toEqual({ format: 'json' });
    expect(program.args).toEqual(['plain']);
  });

  it('真偽値・値を取るオプションの既定値をCommanderと同じ条件で表示する', () => {
    const program = new Command('openspec');
    configureJapaneseHelp(program);
    program
      .addOption(new Option('--count <n>', '件数').default(3, '3件'))
      .addOption(new Option('--enabled', '有効化').default(false))
      .addOption(new Option('--legacy', '旧形式').default('hidden'));
    const help = program.helpInformation();
    expect(help).toContain('件数 (既定値: 3件)');
    expect(help).toContain('有効化 (既定値: false)');
    expect(help).not.toContain('hidden');
  });
});
