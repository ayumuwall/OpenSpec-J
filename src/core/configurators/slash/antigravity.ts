import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.agent/workflows/openspec-proposal.md',
  apply: '.agent/workflows/openspec-apply.md',
  archive: '.agent/workflows/openspec-archive.md'
};

const DESCRIPTIONS: Record<SlashCommandId, string> = {
  proposal: '新しい OpenSpec の変更のひな形を作成し、厳密に検証します。',
  apply: '承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。',
  archive: '適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。'
};

export class AntigravitySlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'antigravity';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const description = DESCRIPTIONS[id];
    return `---\ndescription: ${description}\n---`;
  }
}
