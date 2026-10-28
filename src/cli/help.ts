import type { Command } from 'commander';

const HELP_TITLES: Record<string, string> = {
  'Usage:': '使用方法:',
  'Arguments:': '引数:',
  'Options:': 'オプション:',
  'Global Options:': '共通オプション:',
  'Commands:': 'コマンド:',
};

function withDetails(description: string, details: string[]): string {
  if (details.length === 0) return description;
  const suffix = `(${details.join(', ')})`;
  return description ? `${description} ${suffix}` : suffix;
}

/** 表示ラベルだけを日本語化し、コマンド・引数・値は変更しない。 */
export function configureJapaneseHelp(command: Command): void {
  command
    .helpOption('-h, --help', 'ヘルプを表示')
    .addHelpCommand('help [command]', '指定したコマンドのヘルプを表示')
    .configureHelp({
      styleTitle(title) {
        return HELP_TITLES[title] ?? title;
      },
      optionDescription(option) {
        const details: string[] = [];
        if (option.argChoices) {
          details.push(`選択肢: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
        }
        // Commander と同じ条件で既定値を表示する。
        if (option.defaultValue !== undefined && (
          option.required || option.optional ||
          (option.isBoolean() && typeof option.defaultValue === 'boolean')
        )) {
          details.push(`既定値: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
        if (option.presetArg !== undefined && option.optional) {
          details.push(`引数省略時: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== undefined) {
          details.push(`環境変数: ${option.envVar}`);
        }
        return withDetails(option.description, details);
      },
      argumentDescription(argument) {
        const details: string[] = [];
        if (argument.argChoices) {
          details.push(`選択肢: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
        }
        if (argument.defaultValue !== undefined) {
          details.push(`既定値: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
        }
        return withDetails(argument.description, details);
      },
    });
}
