import { CommandAdapterRegistry } from './command-generation/index.js';
import { getInvocationForAdapter, type CommandInvocation } from './command-generation/invocation.js';

export type CommandSurfaceCapability = 'adapter-backed' | 'skills-invocable' | 'none';

/**
 * How the tool spells its OpenSpec commands: the name from the command files
 * its adapter writes, the prefix the adapter declares. Returns undefined for
 * tools with no command adapter, which have no command names to spell.
 */
export function resolveCommandInvocation(toolId: string): CommandInvocation | undefined {
  const adapter = CommandAdapterRegistry.get(toolId);
  return adapter ? getInvocationForAdapter(adapter) : undefined;
}

export function resolveCommandSurfaceCapability(toolId: string): CommandSurfaceCapability {
  if (CommandAdapterRegistry.has(toolId)) {
    return 'adapter-backed';
  }

  if (toolId === 'codex' || toolId === 'warp') {
    return 'skills-invocable';
  }

  return 'none';
}

/**
 * 2.0 はスキルだけを導入する。旧設定に残る delivery は読み取るが、
 * ツールや設定値にかかわらず生成コマンドは廃止する。
 * 旧生成物の場所を把握して整理するため、コマンドアダプターは残す。
 * 生成コマンドは削除し、編集済みのものは保持して列挙する
 * （reconcileCommandFiles を参照）。
 */
export function shouldReconcileCommandFilesForTool(toolId: string): boolean {
  return resolveCommandSurfaceCapability(toolId) === 'adapter-backed';
}
