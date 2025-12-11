import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.clinerules/workflows/openspec-proposal.md',
  apply: '.clinerules/workflows/openspec-apply.md',
  archive: '.clinerules/workflows/openspec-archive.md'
};

export class ClineSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'cline';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    const descriptions: Record<SlashCommandId, string> = {
      proposal: '新しい OpenSpec の変更のひな形を作成し、厳密に検証します。',
      apply: '承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。',
      archive: '適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。'
    };
    const description = descriptions[id];
    return `# OpenSpec: ${id.charAt(0).toUpperCase() + id.slice(1)}\n\n${description}`;
  }
}
