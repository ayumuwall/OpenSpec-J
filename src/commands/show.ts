import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds } from '../utils/item-discovery.js';
import {
  resolveRootForCommand,
  toRootOutput,
  withStoreFlag,
  type ResolvedOpenSpecRoot,
  type RootOutput,
  isStoreSelectedRoot,
} from '../core/root-selection.js';
import { ChangeCommand } from './change.js';
import { SpecCommand } from './spec.js';
import { nearestMatches } from '../utils/match.js';

type ItemType = 'change' | 'spec';

const CHANGE_FLAG_KEYS = new Set(['deltasOnly', 'requirementsOnly']);
const SPEC_FLAG_KEYS = new Set(['requirements', 'scenarios', 'requirement']);

interface ShowExecuteOptions {
  json?: boolean;
  type?: string;
  noInteractive?: boolean;
  store?: string;
  storePath?: string;
  [k: string]: any;
}

export class ShowCommand {
  async execute(itemName?: string, options: ShowExecuteOptions = {}): Promise<void> {
    const root = await resolveRootForCommand(options, { json: options.json });
    if (!root) {
      return;
    }

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
        await this.runInteractiveByType(type, options, root);
        return;
      }
      this.printNonInteractiveHint(root);
      process.exitCode = 1;
      return;
    }

    await this.showDirect(itemName, { typeOverride, options, root });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  private delegateOptions(root: ResolvedOpenSpecRoot, options: ShowExecuteOptions): ShowExecuteOptions & { rootOutput?: RootOutput } {
    return {
      ...options,
      ...(options.json ? { rootOutput: toRootOutput(root) } : {}),
    };
  }

  private async runInteractiveByType(
    type: ItemType,
    options: ShowExecuteOptions,
    root: ResolvedOpenSpecRoot
  ): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    if (type === 'change') {
      const changes = await getActiveChangeIds(root.path);
      if (changes.length === 0) {
        console.error('変更が見つかりません。');
        process.exitCode = 1;
        return;
      }
      const picked = await select<string>({ message: '変更を選択してください', choices: changes.map(id => ({ name: id, value: id })) });
      const cmd = new ChangeCommand(root.path);
      await cmd.show(picked, this.delegateOptions(root, options) as any);
      return;
    }

    const specs = await getSpecIds(root.path);
    if (specs.length === 0) {
      console.error('仕様が見つかりません。');
      process.exitCode = 1;
      return;
    }
    const picked = await select<string>({ message: '仕様を選択してください', choices: specs.map(id => ({ name: id, value: id })) });
    const cmd = new SpecCommand(root.path);
    await cmd.show(picked, this.delegateOptions(root, options) as any);
  }

  private async showDirect(
    itemName: string,
    params: { typeOverride?: ItemType; options: ShowExecuteOptions; root: ResolvedOpenSpecRoot }
  ): Promise<void> {
    const root = params.root;
    // Optimize lookups when type is pre-specified
    let isChange = false;
    let isSpec = false;
    let changes: string[] = [];
    let specs: string[] = [];
    if (params.typeOverride === 'change') {
      changes = await getActiveChangeIds(root.path);
      isChange = changes.includes(itemName);
    } else if (params.typeOverride === 'spec') {
      specs = await getSpecIds(root.path);
      isSpec = specs.includes(itemName);
    } else {
      [changes, specs] = await Promise.all([getActiveChangeIds(root.path), getSpecIds(root.path)]);
      isChange = changes.includes(itemName);
      isSpec = specs.includes(itemName);
    }

    const resolvedType = params.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!resolvedType) {
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      const message = suggestions.length
        ? `不明な項目 '${itemName}' です。次のいずれかですか: ${suggestions.join(', ')}?`
        : `不明な項目 '${itemName}' です。`;
      if (params.options.json) {
        console.log(
          JSON.stringify(
            { status: [{ severity: 'error', code: 'unknown_item', message }] },
            null,
            2
          )
        );
      } else {
        console.error(message);
      }
      process.exitCode = 1;
      return;
    }

    if (!params.typeOverride && isChange && isSpec) {
      if (params.options.json) {
        console.log(
          JSON.stringify(
            {
              status: [
                {
                  severity: 'error',
                  code: 'ambiguous_item',
                  message: `項目 '${itemName}' は変更と spec の両方に一致するため曖昧です。`,
                  fix: '--type change|spec を指定してください。',
                },
              ],
            },
            null,
            2
          )
        );
        process.exitCode = 1;
        return;
      }
      console.error(`項目 '${itemName}' は変更と仕様の両方に該当し、あいまいです。`);
      // The noun-form commands are cwd-based and cannot reach a selected store.
      if (isStoreSelectedRoot(root)) {
        console.error('--type change|spec を指定してください。');
      } else {
        console.error('--type change|spec を指定するか、openspec change show / openspec spec show を使用してください。');
      }
      process.exitCode = 1;
      return;
    }

    this.warnIrrelevantFlags(resolvedType, params.options);
    if (resolvedType === 'change') {
      const cmd = new ChangeCommand(root.path);
      await cmd.show(itemName, this.delegateOptions(root, params.options) as any);
      return;
    }
    const cmd = new SpecCommand(root.path);
    await cmd.show(itemName, this.delegateOptions(root, params.options) as any);
  }

  private printNonInteractiveHint(root: ResolvedOpenSpecRoot): void {
    console.error('表示するものがありません。次のいずれかを試してください:');
    console.error(`  ${withStoreFlag(root, 'openspec show <item>')}`);
    if (isStoreSelectedRoot(root)) {
      // The noun-form commands are cwd-based and cannot reach a selected store.
      console.error(`  ${withStoreFlag(root, 'openspec show <item> --type change')}`);
      console.error(`  ${withStoreFlag(root, 'openspec show <item> --type spec')}`);
    } else {
      console.error('  openspec change show');
      console.error('  openspec spec show');
    }
    console.error('または対話モードのターミナルで実行してください。');
  }

  private warnIrrelevantFlags(type: ItemType, options: { [k: string]: any }): boolean {
    const irrelevant: string[] = [];
    // --no-scenarios makes commander default `scenarios` to true, so its
    // presence alone does not mean the user passed it — only false does.
    const isUserProvided = (k: string) =>
      k === 'scenarios' ? options[k] === false : k in options;
    if (type === 'change') {
      for (const k of SPEC_FLAG_KEYS) if (isUserProvided(k)) irrelevant.push(k);
    } else {
      for (const k of CHANGE_FLAG_KEYS) if (isUserProvided(k)) irrelevant.push(k);
    }
    if (irrelevant.length > 0) {
      console.error(`警告: ${type} には無効なフラグを無視します: ${irrelevant.join(', ')}`);
      return true;
    }
    return false;
  }
}
