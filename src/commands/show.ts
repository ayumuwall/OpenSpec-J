import path from 'path';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds } from '../utils/item-discovery.js';
import { ChangeCommand } from './change.js';
import { SpecCommand } from './spec.js';
import { nearestMatches } from '../utils/match.js';

type ItemType = 'change' | 'spec';

const CHANGE_FLAG_KEYS = new Set(['deltasOnly', 'requirementsOnly']);
const SPEC_FLAG_KEYS = new Set(['requirements', 'scenarios', 'requirement']);

export class ShowCommand {
  async execute(itemName?: string, options: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: any } = {}): Promise<void> {
    const interactive = isInteractive(options);
    const typeOverride = this.normalizeType(options.type);

    if (!itemName) {
      if (interactive) {
        const { select } = await import('@inquirer/prompts');
        const type = await select<ItemType>({
          message: '何を表示しますか？',
          choices: [
            { name: '変更', value: 'change' as const },
            { name: '仕様', value: 'spec' as const },
          ],
        });
        await this.runInteractiveByType(type, options);
        return;
      }
      this.printNonInteractiveHint();
      process.exitCode = 1;
      return;
    }

    await this.showDirect(itemName, { typeOverride, options });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  private async runInteractiveByType(type: ItemType, options: { json?: boolean; noInteractive?: boolean; [k: string]: any }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    if (type === 'change') {
      const changes = await getActiveChangeIds();
      if (changes.length === 0) {
        console.error('変更が見つかりません。');
        process.exitCode = 1;
        return;
      }
      const picked = await select<string>({ message: '変更を選択してください', choices: changes.map(id => ({ name: id, value: id })) });
      const cmd = new ChangeCommand();
      await cmd.show(picked, options as any);
      return;
    }

    const specs = await getSpecIds();
    if (specs.length === 0) {
      console.error('仕様が見つかりません。');
      process.exitCode = 1;
      return;
    }
    const picked = await select<string>({ message: '仕様を選択してください', choices: specs.map(id => ({ name: id, value: id })) });
    const cmd = new SpecCommand();
    await cmd.show(picked, options as any);
  }

  private async showDirect(itemName: string, params: { typeOverride?: ItemType; options: { json?: boolean; [k: string]: any } }): Promise<void> {
    // Optimize lookups when type is pre-specified
    let isChange = false;
    let isSpec = false;
    let changes: string[] = [];
    let specs: string[] = [];
    if (params.typeOverride === 'change') {
      changes = await getActiveChangeIds();
      isChange = changes.includes(itemName);
    } else if (params.typeOverride === 'spec') {
      specs = await getSpecIds();
      isSpec = specs.includes(itemName);
    } else {
      [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
      isChange = changes.includes(itemName);
      isSpec = specs.includes(itemName);
    }

    const resolvedType = params.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!resolvedType) {
      console.error(`項目 '${itemName}' が見つかりません`);
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      if (suggestions.length) console.error(`もしかして: ${suggestions.join(', ')} ?`);
      process.exitCode = 1;
      return;
    }

    if (!params.typeOverride && isChange && isSpec) {
      console.error(`項目 '${itemName}' は変更と仕様の両方に該当し、あいまいです。`);
      console.error('--type change|spec を指定するか、openspec change show / openspec spec show を使用してください。');
      process.exitCode = 1;
      return;
    }

    this.warnIrrelevantFlags(resolvedType, params.options);
    if (resolvedType === 'change') {
      const cmd = new ChangeCommand();
      await cmd.show(itemName, params.options as any);
      return;
    }
    const cmd = new SpecCommand();
    await cmd.show(itemName, params.options as any);
  }

  private printNonInteractiveHint(): void {
    console.error('表示するものがありません。次のいずれかを試してください:');
    console.error('  openspec show <item>');
    console.error('  openspec change show');
    console.error('  openspec spec show');
    console.error('または対話モードのターミナルで実行してください。');
  }

  private warnIrrelevantFlags(type: ItemType, options: { [k: string]: any }): boolean {
    const irrelevant: string[] = [];
    if (type === 'change') {
      for (const k of SPEC_FLAG_KEYS) if (k in options) irrelevant.push(k);
    } else {
      for (const k of CHANGE_FLAG_KEYS) if (k in options) irrelevant.push(k);
    }
    if (irrelevant.length > 0) {
      console.error(`警告: ${type} には無効なフラグを無視します: ${irrelevant.join(', ')}`);
      return true;
    }
    return false;
  }
}
