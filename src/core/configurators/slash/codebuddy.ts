import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.codebuddy/commands/openspec/proposal.md',
  apply: '.codebuddy/commands/openspec/apply.md',
  archive: '.codebuddy/commands/openspec/archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: OpenSpec: Proposal
description: 新しい OpenSpec の変更のひな形を作成し、厳密に検証します。
argument-hint: "[機能の説明または依頼]"
---`,
  apply: `---
name: OpenSpec: Apply
description: 承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。
argument-hint: "[change-id]"
---`,
  archive: `---
name: OpenSpec: Archive
description: 適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。
argument-hint: "[change-id]"
---`
};

export class CodeBuddySlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'codebuddy';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
