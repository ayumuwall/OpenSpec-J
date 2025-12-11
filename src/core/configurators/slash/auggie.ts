import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.augment/commands/openspec-proposal.md',
  apply: '.augment/commands/openspec-apply.md',
  archive: '.augment/commands/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: 新しい OpenSpec の変更のひな形を作成し、厳密に検証します。
argument-hint: feature description or request
---`,
  apply: `---
description: 承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。
argument-hint: change-id
---`,
  archive: `---
description: 適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。
argument-hint: change-id
---`
};

export class AuggieSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'auggie';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}

