import { SlashCommandConfigurator } from "./base.js";
import { SlashCommandId } from "../../templates/index.js";
import { FileSystemUtils } from "../../../utils/file-system.js";
import { OPENSPEC_MARKERS } from "../../config.js";

const FILE_PATHS: Record<SlashCommandId, string> = {
  proposal: ".opencode/command/openspec-proposal.md",
  apply: ".opencode/command/openspec-apply.md",
  archive: ".opencode/command/openspec-archive.md",
};

const FRONTMATTER: Record<SlashCommandId, string> = {
  proposal: `---
description: 新しい OpenSpec の変更のひな形を作成し、厳密に検証します。
---
ユーザーは次の変更提案の作成を求めています。openspec の手順に従って変更提案を作成してください。
<UserRequest>
  $ARGUMENTS
</UserRequest>
`,
  apply: `---
description: 承認済みの OpenSpec 変更を実装し、タスクの整合性を保ちます。
---
ユーザーは次の変更提案の実装を求めています。該当する変更提案を探し、以下の手順に従ってください。不明点やあいまいさがある場合はユーザーに確認してください。
<UserRequest>
  $ARGUMENTS
</UserRequest>
`,
  archive: `---
description: 適用済みの OpenSpec 変更をアーカイブし、仕様を更新します。
---
<ChangeId>
  $ARGUMENTS
</ChangeId>
`,
};

export class OpenCodeSlashCommandConfigurator extends SlashCommandConfigurator {
  readonly toolId = "opencode";
  readonly isAvailable = true;

  protected getRelativePath(id: SlashCommandId): string {
    return FILE_PATHS[id];
  }

  protected getFrontmatter(id: SlashCommandId): string | undefined {
    return FRONTMATTER[id];
  }

  async generateAll(projectPath: string, _openspecDir: string): Promise<string[]> {
    const createdOrUpdated = await super.generateAll(projectPath, _openspecDir);
    await this.rewriteArchiveFile(projectPath);
    return createdOrUpdated;
  }

  async updateExisting(projectPath: string, _openspecDir: string): Promise<string[]> {
    const updated = await super.updateExisting(projectPath, _openspecDir);
    const rewroteArchive = await this.rewriteArchiveFile(projectPath);
    if (rewroteArchive && !updated.includes(FILE_PATHS.archive)) {
      updated.push(FILE_PATHS.archive);
    }
    return updated;
  }

  private async rewriteArchiveFile(projectPath: string): Promise<boolean> {
    const archivePath = FileSystemUtils.joinPath(projectPath, FILE_PATHS.archive);
    if (!await FileSystemUtils.fileExists(archivePath)) {
      return false;
    }

    const body = this.getBody("archive");
    const frontmatter = this.getFrontmatter("archive");
    const sections: string[] = [];

    if (frontmatter) {
      sections.push(frontmatter.trim());
    }

    sections.push(`${OPENSPEC_MARKERS.start}\n${body}\n${OPENSPEC_MARKERS.end}`);
    await FileSystemUtils.writeFile(archivePath, sections.join("\n") + "\n");
    return true;
  }
}
