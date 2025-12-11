import { TomlSlashCommandConfigurator } from './toml-base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.gemini/commands/openspec/proposal.toml',
  apply: '.gemini/commands/openspec/apply.toml',
  archive: '.gemini/commands/openspec/archive.toml'
};

const DESCRIPTIONS: Record<SlashCommandId, string> = {
  proposal: '新しい OpenSpec の変更のひな形を作成し、厳密に検証します。',
  apply: '承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。',
  archive: '適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。'
};

export class GeminiSlashCommandConfigurator extends TomlSlashCommandConfigurator {
  readonly toolId = 'gemini';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getDescription(id: SlashCommandId): string {
    return DESCRIPTIONS[id];
  }
}
