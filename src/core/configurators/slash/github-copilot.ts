import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.github/prompts/openspec-proposal.prompt.md',
  apply: '.github/prompts/openspec-apply.prompt.md',
  archive: '.github/prompts/openspec-archive.prompt.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: 新しい OpenSpec の変更のひな形を作成し、厳密に検証します。
---

$ARGUMENTS`,
  apply: `---
description: 承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。
---

$ARGUMENTS`,
  archive: `---
description: 適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。
---

$ARGUMENTS`
};

export class GitHubCopilotSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'github-copilot';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
