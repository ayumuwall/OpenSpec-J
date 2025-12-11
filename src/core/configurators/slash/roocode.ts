import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const NEW_FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.roo/commands/openspec-proposal.md',
  apply: '.roo/commands/openspec-apply.md',
  archive: '.roo/commands/openspec-archive.md'
};

export class RooCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'roocode';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return NEW_FILE_PATHS[id];
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
