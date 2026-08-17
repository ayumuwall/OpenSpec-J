/**
 * コマンドアダプターレジストリ
 *
 * ツールのコマンドアダプターを集約するレジストリ。
 * 既存の SlashCommandRegistry と同じパターン。
 */

import type { ToolCommandAdapter } from './types.js';
import { amazonQAdapter } from './adapters/amazon-q.js';
import { antigravityAdapter } from './adapters/antigravity.js';
import { auggieAdapter } from './adapters/auggie.js';
import { bobAdapter } from './adapters/bob.js';
import { claudeAdapter } from './adapters/claude.js';
import { clineAdapter } from './adapters/cline.js';
import { commandCodeAdapter } from './adapters/command-code.js';
import { devinAdapter } from './adapters/devin.js';
import { codebuddyAdapter } from './adapters/codebuddy.js';
import { continueAdapter } from './adapters/continue.js';
import { costrictAdapter } from './adapters/costrict.js';
import { crushAdapter } from './adapters/crush.js';
import { cursorAdapter } from './adapters/cursor.js';
import { factoryAdapter } from './adapters/factory.js';
import { geminiAdapter } from './adapters/gemini.js';
import { githubCopilotAdapter } from './adapters/github-copilot.js';
import { iflowAdapter } from './adapters/iflow.js';
import { junieAdapter } from './adapters/junie.js';
import { kilocodeAdapter } from './adapters/kilocode.js';
import { kiroAdapter } from './adapters/kiro.js';
import { ohMyPiAdapter } from './adapters/oh-my-pi.js';
import { opencodeAdapter } from './adapters/opencode.js';
import { piAdapter } from './adapters/pi.js';
import { qoderAdapter } from './adapters/qoder.js';
import { lingmaAdapter } from './adapters/lingma.js';
import { qwenAdapter } from './adapters/qwen.js';
import { roocodeAdapter } from './adapters/roocode.js';
import { traeAdapter } from './adapters/trae.js';
import { zcodeAdapter } from './adapters/zcode.js';

/**
 * ツールのコマンドアダプターを参照するレジストリ。
 */
export class CommandAdapterRegistry {
  private static adapters: Map<string, ToolCommandAdapter> = new Map();

  // 静的初期化: 組み込みアダプターを登録
  static {
    CommandAdapterRegistry.register(amazonQAdapter);
    CommandAdapterRegistry.register(antigravityAdapter);
    CommandAdapterRegistry.register(auggieAdapter);
    CommandAdapterRegistry.register(bobAdapter);
    CommandAdapterRegistry.register(claudeAdapter);
    CommandAdapterRegistry.register(clineAdapter);
    CommandAdapterRegistry.register(commandCodeAdapter);
    CommandAdapterRegistry.register(devinAdapter);
    CommandAdapterRegistry.register(codebuddyAdapter);
    CommandAdapterRegistry.register(continueAdapter);
    CommandAdapterRegistry.register(costrictAdapter);
    CommandAdapterRegistry.register(crushAdapter);
    CommandAdapterRegistry.register(cursorAdapter);
    CommandAdapterRegistry.register(factoryAdapter);
    CommandAdapterRegistry.register(geminiAdapter);
    CommandAdapterRegistry.register(githubCopilotAdapter);
    CommandAdapterRegistry.register(iflowAdapter);
    CommandAdapterRegistry.register(junieAdapter);
    CommandAdapterRegistry.register(kilocodeAdapter);
    CommandAdapterRegistry.register(kiroAdapter);
    CommandAdapterRegistry.register(ohMyPiAdapter);
    CommandAdapterRegistry.register(opencodeAdapter);
    CommandAdapterRegistry.register(piAdapter);
    CommandAdapterRegistry.register(qoderAdapter);
    CommandAdapterRegistry.register(lingmaAdapter);
    CommandAdapterRegistry.register(qwenAdapter);
    CommandAdapterRegistry.register(roocodeAdapter);
    CommandAdapterRegistry.register(traeAdapter);
    CommandAdapterRegistry.register(zcodeAdapter);
  }

  /**
   * ツールのコマンドアダプターを登録する。
   * @param adapter - 登録するアダプター
   */
  static register(adapter: ToolCommandAdapter): void {
    CommandAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  /**
   * ツール ID でアダプターを取得する。
   * @param toolId - ツール識別子（例: 'claude', 'cursor'）
   * @returns 登録済みのアダプター、未登録なら undefined
   */
  static get(toolId: string): ToolCommandAdapter | undefined {
    return CommandAdapterRegistry.adapters.get(toolId);
  }

  /**
   * 登録済みアダプターを取得する。
   * @returns 登録済みアダプター配列
   */
  static getAll(): ToolCommandAdapter[] {
    return Array.from(CommandAdapterRegistry.adapters.values());
  }

  /**
   * 指定ツールにアダプターが登録されているか確認する。
   * @param toolId - ツール識別子
   * @returns アダプターが存在すれば true
   */
  static has(toolId: string): boolean {
    return CommandAdapterRegistry.adapters.has(toolId);
  }
}
