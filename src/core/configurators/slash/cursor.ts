import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.cursor/commands/openspec-proposal.md',
  apply: '.cursor/commands/openspec-apply.md',
  archive: '.cursor/commands/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
name: /openspec-proposal
id: openspec-proposal
category: OpenSpec
description: 新しい OpenSpec の変更のひな形を作成し、厳密に検証します。
---`,
  apply: `---
name: /openspec-apply
id: openspec-apply
category: OpenSpec
description: 承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。
---`,
  archive: `---
name: /openspec-archive
id: openspec-archive
category: OpenSpec
description: 適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。
---`
};

export class CursorSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'cursor';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
