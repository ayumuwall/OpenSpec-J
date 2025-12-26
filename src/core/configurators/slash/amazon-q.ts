import { SlashCommandConfigurator } from './base.js';
import { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: '.amazonq/prompts/openspec-proposal.md',
  apply: '.amazonq/prompts/openspec-apply.md',
  archive: '.amazonq/prompts/openspec-archive.md'
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: 新しい OpenSpec の変更のひな形を作成し、厳密に検証します。
---
ユーザーは次の変更提案の作成を求めています。openspec の手順に従って変更提案を作成してください。

<UserRequest>
  $ARGUMENTS
</UserRequest>`,
  apply: `---
description: 承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。
---
ユーザーは次の変更を適用したいと考えています。承認済みの変更を openspec の手順に従って実装してください。

<ChangeId>
  $ARGUMENTS
</ChangeId>`,
  archive: `---
description: 適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。
---
ユーザーは次のデプロイ済み変更をアーカイブしたいと考えています。openspec の手順に従って変更をアーカイブし、仕様を更新してください。

<ChangeId>
  $ARGUMENTS
</ChangeId>`
};

export class AmazonQSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = 'amazon-q';
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string {
    return FRONTMATTER[id];
  }
}
