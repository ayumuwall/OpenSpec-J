/**
 * GitHub Copilot Cloud Agent Support
 *
 * Generates copilot-setup-steps.yml and .github/agents/openspec.agent.md
 * when the github-copilot tool is selected during init/update.
 * These files enable the GitHub Copilot coding agent (cloud) to use the
 * OpenSpec CLI in its ephemeral dev environment.
 */

import path from 'path';
import { promises as fs } from 'fs';
import { Document, YAMLMap, parseDocument, isMap } from 'yaml';
import { FileSystemUtils } from '../../utils/file-system.js';
import { readProjectConfig, resolveConfigFilePath } from '../project-config.js';

const COPILOT_TOOL_ID = 'github-copilot';
const OPENSPEC_MANAGED_MARKER = 'OpenSpec が GitHub Copilot コーディングエージェント用に生成しました。';

/**
 * Check if a tool list includes github-copilot.
 */
export function includesGitHubCopilot(toolIds: string[]): boolean {
  return toolIds.includes(COPILOT_TOOL_ID);
}

/**
 * Generate the copilot-setup-steps.yml workflow file content.
 * This workflow pre-installs the OpenSpec CLI in the Copilot coding agent's
 * ephemeral GitHub Actions environment.
 */
export function generateCopilotSetupSteps(): string {
  return `# ${OPENSPEC_MANAGED_MARKER}

${generateCopilotSetupStepsBody()}`;
}

function generateCopilotSetupStepsBody(): string {
  return `name: "Copilot セットアップ手順"

# 変更時に検証のため自動実行され、手動でも実行できます。
on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  # Copilot コーディングエージェントが認識するには、ジョブ名を \`copilot-setup-steps\` にする必要があります。
  copilot-setup-steps:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    permissions:
      contents: read

    steps:
      - name: コードをチェックアウト
        uses: actions/checkout@v4

      - name: OpenSpec CLI をインストール
        run: npm install -g @ayumuwall/openspec

      - name: OpenSpec CLI を確認
        run: openspec --version
`;
}

/**
 * Generate the .github/agents/openspec.agent.md custom agent file content.
 * This tells the GitHub Copilot coding agent how to use the OpenSpec CLI.
 */
export function generateCopilotAgentFile(): string {
  return generateCopilotAgentFileBody(true);
}

function generateCopilotAgentFileBody(includeManagedMarker = false): string {
  const managedMarker = includeManagedMarker
    ? `<!-- ${OPENSPEC_MANAGED_MARKER} -->\n\n`
    : '';

  return `---
name: OpenSpec
description: "OpenSpec CLI を使用して、OpenSpec の変更・仕様・ワークフローを管理します。変更提案、アイデアの探索、アーティファクトの検証、状態確認、完了済み作業のアーカイブに使用してください。"
tools:
  - "execute"
  - "read"
  - "search"
  - "edit"
---

${managedMarker}# OpenSpec エージェント

OpenSpec ワークフローを管理する専門エージェントです。\`openspec\` CLI を使う前に \`openspec --version\` を実行してください。利用できない場合は、\`npm install -g @ayumuwall/openspec\` でインストールします。

## OpenSpec とは

OpenSpec はコードベースの変更を構造化して管理する仕組みです。実装の指針となる計画アーティファクト（提案、仕様、設計、タスク）を **変更** ごとに整理します。

## 利用できるコマンド

### エージェント向け CLI コマンド（構造化出力には \`--json\` を優先）

| コマンド | 目的 |
|---------|---------|
| \`openspec list [--json]\` | すべての変更と仕様を一覧表示 |
| \`openspec show <item> [--json]\` | 特定の変更または仕様を表示 |
| \`openspec validate [--all] [--json]\` | 変更と仕様の問題を検証 |
| \`openspec status [--change <name>] [--json]\` | 変更のアーティファクト進捗を表示 |
| \`openspec instructions [artifact] [--change <name>] [--json]\` | 変更の次の手順を取得 |
| \`openspec templates [--json]\` | 利用可能なテンプレートを一覧表示 |
| \`openspec schemas [--json]\` | 利用可能なワークフロースキーマを一覧表示 |
| \`openspec archive <change> --json [--yes]\` | 完了した変更をアーカイブ。すべてのタスク完了を確認した後だけ \`--yes\` を使用 |

### 対話型 CLI コマンド（ユーザーから求められた場合に使用）

| コマンド | 目的 |
|---------|---------|
| \`openspec init\` | プロジェクトで OpenSpec を初期化 |
| \`openspec update\` | OpenSpec の設定とアーティファクトを更新 |
| \`openspec view\` | 対話型ダッシュボード |
| \`openspec config\` | 設定を表示または変更 |

## ワークフロー

OpenSpec の作業を求められたら、次の流れに従います。

1. **変更を探す**: \`openspec list --json\` を実行してアクティブな変更を確認します。
2. **進捗を確認する**: 選択した変更に対して \`openspec status --change <name> --json\` を実行します。
3. **指示に従う**: 次のアーティファクトに対して \`openspec instructions [artifact] --change <name> --json\` を実行します。
4. **完了前に検証する**: \`openspec validate <name> --json\` を実行します。

## 新しい変更を作成する

ユーザーが新しい変更を提案したい場合:

1. \`openspec new change <name>\` を実行します。
2. \`openspec status --change <name> --json\` を実行してアーティファクトの順序を確認します。
3. 各アーティファクトを作成する前に \`openspec instructions [artifact] --change <name> --json\` を使います。
4. アーティファクトが完了したら \`openspec validate <name> --json\` を実行します。

## 主なディレクトリ

- \`openspec/\` — OpenSpec のルートディレクトリ
- \`openspec/changes/\` — アーティファクトを含むアクティブな変更
- \`openspec/config.yaml\` — プロジェクト設定

## 推奨事項

- 出力をプログラムで解析する場合は常に \`--json\` を使う
- アーティファクトの作成・変更後は \`openspec validate\` を実行する
- 作業開始前に \`openspec status\` で現在の状態を確認する
- アーカイブ前に、すべてのタスクが完了・検証済みであることを確認する
`;
}

function generatePreviousCopilotAgentFileBody(includeManagedMarker = false): string {
  let content = generateCopilotAgentFileBody();
  content = replaceRequired(
    content,
    'OpenSpec ワークフローを管理する専門エージェントです。`openspec` CLI を使う前に `openspec --version` を実行してください。利用できない場合は、`npm install -g @ayumuwall/openspec` でインストールします。',
    'OpenSpec ワークフローを管理する専門エージェントです。`openspec` CLI は `copilot-setup-steps.yml` により開発環境へ事前インストールされ、シェルコマンドから利用できます。',
    'previous CLI access sentence'
  );
  content = replaceRequired(
    content,
    '| `openspec archive <change> --json [--yes]` | 完了した変更をアーカイブ。すべてのタスク完了を確認した後だけ `--yes` を使用 |',
    '| `openspec archive <change>` | 完了した変更をアーカイブ |',
    'previous archive command row'
  );

  if (!includeManagedMarker) {
    return content;
  }

  return replaceRequired(
    content,
    '\n# OpenSpec エージェント',
    `\n<!-- ${OPENSPEC_MANAGED_MARKER} -->\n\n# OpenSpec エージェント`,
    'previous agent heading'
  );
}

function generateLegacyCopilotAgentFileBody(): string {
  let content = generatePreviousCopilotAgentFileBody();
  content = replaceRequired(
    content,
    `## ワークフロー

OpenSpec の作業を求められたら、次の流れに従います。

1. **変更を探す**: \`openspec list --json\` を実行してアクティブな変更を確認します。
2. **進捗を確認する**: 選択した変更に対して \`openspec status --change <name> --json\` を実行します。
3. **指示に従う**: 次のアーティファクトに対して \`openspec instructions [artifact] --change <name> --json\` を実行します。
4. **完了前に検証する**: \`openspec validate <name> --json\` を実行します。

## 新しい変更を作成する

ユーザーが新しい変更を提案したい場合:

1. \`openspec new change <name>\` を実行します。
2. \`openspec status --change <name> --json\` を実行してアーティファクトの順序を確認します。
3. 各アーティファクトを作成する前に \`openspec instructions [artifact] --change <name> --json\` を使います。
4. アーティファクトが完了したら \`openspec validate <name> --json\` を実行します。`,
    `## ワークフロー

OpenSpec の作業を求められたら、次の流れに従います。

1. **現在の状態を確認する**: \`openspec status --json\` を実行して、変更と進捗を把握します。
2. **指示に従う**: \`openspec instructions --json\` を実行して、コンテキストに応じた次の手順を取得します。
3. **完了前に検証する**: \`openspec validate --all --json\` を実行してアーティファクトを確認します。

## 新しい変更を作成する

ユーザーが新しい変更を提案したい場合:

1. \`openspec/changes/<change-name>/\` 配下に変更ディレクトリを作成します
2. プロジェクトで設定されたワークフロースキーマに基づき、必要な計画アーティファクトを生成します
3. \`openspec validate --json\` を実行して、アーティファクトが正しい形式であることを確認します。`,
    'legacy workflow guidance'
  );
  content = replaceRequired(
    content,
    `tools:
  - "execute"
  - "read"
  - "search"
  - "edit"`,
    `tools:
  - "terminal"`,
    'legacy tool alias'
  );
  content = replaceRequired(
    content,
    'OpenSpec ワークフローを管理する専門エージェントです。`openspec` CLI は `copilot-setup-steps.yml` により開発環境へ事前インストールされ、シェルコマンドから利用できます。',
    'OpenSpec ワークフローを管理する専門エージェントです。`openspec` CLI は `copilot-setup-steps.yml` により開発環境へ事前インストールされ、利用できます。',
    'legacy CLI access sentence'
  );
  content = replaceRequired(
    content,
    '| `openspec status [--change <name>] [--json]` | 変更のアーティファクト進捗を表示 |',
    '| `openspec status [--json]` | アクティブな変更のアーティファクト進捗を表示 |',
    'legacy status command row'
  );
  content = replaceRequired(
    content,
    '| `openspec instructions [artifact] [--change <name>] [--json]` | 変更の次の手順を取得 |',
    '| `openspec instructions [--json]` | 変更の次の手順を取得 |',
    'legacy instructions command row'
  );
  return replaceRequired(
    content,
    '- `openspec/config.yaml` — プロジェクト設定',
    `- \`openspec/config.yaml\` — プロジェクト設定
- \`openspec/explorations/\` — 探索ドキュメント`,
    'legacy exploration directory'
  );
}

function replaceRequired(
  content: string,
  searchValue: string,
  replaceValue: string,
  label: string
): string {
  if (!content.includes(searchValue)) {
    throw new Error(`Copilot クラウドファイルの内容を作成できません: ${label} がありません`);
  }
  return content.replace(searchValue, replaceValue);
}

/**
 * File paths (relative to project root) for the generated files.
 */
export const COPILOT_CLOUD_FILES = {
  setupSteps: path.join('.github', 'workflows', 'copilot-setup-steps.yml'),
  agent: path.join('.github', 'agents', 'openspec.agent.md'),
} as const;

const COPILOT_AGENT_ALTERNATE_FILE = path.join('.github', 'agents', 'openspec.md');

type CopilotCloudFile = (typeof COPILOT_CLOUD_FILES)[keyof typeof COPILOT_CLOUD_FILES];

const COPILOT_CLOUD_FILE_CONTENTS: Record<CopilotCloudFile, string> = {
  [COPILOT_CLOUD_FILES.setupSteps]: generateCopilotSetupSteps(),
  [COPILOT_CLOUD_FILES.agent]: generateCopilotAgentFile(),
};

function getLegacyCopilotCloudFileContents(relPath: CopilotCloudFile): string[] {
  if (relPath === COPILOT_CLOUD_FILES.setupSteps) {
    return [generateCopilotSetupStepsBody()];
  }

  return [
    generateCopilotAgentFileBody(),
    generatePreviousCopilotAgentFileBody(),
    generatePreviousCopilotAgentFileBody(true),
    generateLegacyCopilotAgentFileBody(),
  ];
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

function isCurrentCopilotCloudFile(
  relPath: CopilotCloudFile,
  content: string
): boolean {
  return normalizeLineEndings(content) === COPILOT_CLOUD_FILE_CONTENTS[relPath];
}

function isLegacyCopilotCloudFile(
  relPath: CopilotCloudFile,
  content: string
): boolean {
  const normalized = normalizeLineEndings(content);
  return getLegacyCopilotCloudFileContents(relPath).includes(normalized)
    || (relPath === COPILOT_CLOUD_FILES.agent && isHistoricalEnglishCopilotAgent(normalized));
}

function isHistoricalEnglishCopilotAgent(content: string): boolean {
  return content.includes('description: "Manages OpenSpec changes, specs, and workflows using the OpenSpec CLI.')
    && content.includes('# OpenSpec Agent')
    && content.includes('You are a specialized agent for managing OpenSpec workflows.')
    && content.includes('## Available Commands')
    && content.includes('## Workflow')
    && content.includes('## Key Directories');
}

function isManagedCopilotCloudFile(
  relPath: CopilotCloudFile,
  content: string
): boolean {
  return isCurrentCopilotCloudFile(relPath, content) || isLegacyCopilotCloudFile(relPath, content);
}

async function reconcileCopilotCloudFile(
  fullPath: string,
  relPath: CopilotCloudFile
): Promise<boolean> {
  const currentContent = COPILOT_CLOUD_FILE_CONTENTS[relPath];

  if (!(await FileSystemUtils.fileExists(fullPath))) {
    await FileSystemUtils.writeFile(fullPath, currentContent);
    return true;
  }

  const existingContent = await FileSystemUtils.readFile(fullPath);
  if (isCurrentCopilotCloudFile(relPath, existingContent)) {
    return false;
  }
  if (!isLegacyCopilotCloudFile(relPath, existingContent)) {
    return false;
  }

  await FileSystemUtils.writeFile(fullPath, currentContent);
  return true;
}

async function assertCreatableFilePath(filePath: string): Promise<void> {
  let candidate = path.dirname(filePath);

  while (true) {
    try {
      const stats = await fs.stat(candidate);
      if (!stats.isDirectory()) {
        throw new Error(`親パスがディレクトリではありません: ${candidate}`);
      }
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    const parent = path.dirname(candidate);
    if (parent === candidate) {
      throw new Error(`次のパスの親ディレクトリを解決できません: ${filePath}`);
    }
    candidate = parent;
  }
}

async function assertMissingOrRegularFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`管理対象の Copilot パスが通常ファイルではありません: ${filePath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

async function classifyCopilotAgentReconciliation(
  agentPath: string,
  alternateAgentPath: string
): Promise<'reconcile' | 'skip' | 'remove-managed'> {
  if (!(await FileSystemUtils.fileExists(alternateAgentPath))) {
    return 'reconcile';
  }
  if (!(await FileSystemUtils.fileExists(agentPath))) {
    return 'skip';
  }

  const existingContent = await FileSystemUtils.readFile(agentPath);
  if (isManagedCopilotCloudFile(COPILOT_CLOUD_FILES.agent, existingContent)) {
    return 'remove-managed';
  }

  throw new Error(
    `Copilot エージェントプロファイルが競合しています。${COPILOT_AGENT_ALTERNATE_FILE} または ${COPILOT_CLOUD_FILES.agent} のどちらかを残してください。`
  );
}

/**
 * Reconcile Copilot cloud agent files in the project directory.
 * Creates missing files and refreshes recognized legacy generated files while
 * preserving current generated content and user customizations.
 *
 * @returns Object indicating which files were written.
 */
export async function writeCopilotCloudFiles(
  projectPath: string
): Promise<{ setupStepsWritten: boolean; agentWritten: boolean }> {
  const setupStepsPath = FileSystemUtils.resolveProjectArtifactPath(
    projectPath,
    COPILOT_CLOUD_FILES.setupSteps
  );
  const agentPath = FileSystemUtils.resolveProjectArtifactPath(
    projectPath,
    COPILOT_CLOUD_FILES.agent
  );
  const alternateAgentPath = FileSystemUtils.resolveProjectArtifactPath(
    projectPath,
    COPILOT_AGENT_ALTERNATE_FILE
  );

  await assertCreatableFilePath(setupStepsPath);
  await assertCreatableFilePath(agentPath);
  await assertMissingOrRegularFile(setupStepsPath);
  await assertMissingOrRegularFile(agentPath);
  await assertMissingOrRegularFile(alternateAgentPath);
  const agentReconciliation = await classifyCopilotAgentReconciliation(
    agentPath,
    alternateAgentPath
  );

  const setupStepsWritten = await reconcileCopilotCloudFile(
    setupStepsPath,
    COPILOT_CLOUD_FILES.setupSteps
  );
  let agentWritten = false;
  if (agentReconciliation === 'reconcile') {
    agentWritten = await reconcileCopilotCloudFile(agentPath, COPILOT_CLOUD_FILES.agent);
  } else if (agentReconciliation === 'remove-managed') {
    await fs.unlink(agentPath);
  }

  return { setupStepsWritten, agentWritten };
}

/**
 * Remove copilot cloud agent files from the project directory.
 * Used when github-copilot is deselected.
 *
 * @returns Number of files removed.
 */
export async function removeCopilotCloudFiles(projectPath: string): Promise<number> {
  let removed = 0;
  const managedPaths = Object.values(COPILOT_CLOUD_FILES).map((relPath) => ({
    relPath,
    fullPath: FileSystemUtils.resolveProjectArtifactPath(projectPath, relPath),
  }));
  for (const { fullPath } of managedPaths) {
    await assertMissingOrRegularFile(fullPath);
  }

  for (const { relPath, fullPath } of managedPaths) {
    if (await FileSystemUtils.fileExists(fullPath)) {
      const content = await FileSystemUtils.readFile(fullPath);
      if (!isManagedCopilotCloudFile(relPath, content)) {
        continue;
      }

      await fs.unlink(fullPath);
      removed++;
    }
  }

  return removed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Opt-in
//
// Generating a GitHub Actions workflow into a user's `.github/` is invasive and
// ties us to Copilot's externally-owned coding-agent format, so cloud files are
// opt-in rather than an automatic side effect of selecting the Copilot tool.
// The decision is persisted in openspec/config.yaml so non-interactive
// `openspec update` (CI, agents) honors it without ever prompting.
// ─────────────────────────────────────────────────────────────────────────────

const COPILOT_CONFIG_KEY = 'githubCopilot';
const COPILOT_CLOUD_AGENT_KEY = 'cloudAgent';

/**
 * Read the persisted opt-in for Copilot cloud-file generation.
 *
 * Tri-state: `true` (opted in), `false` (explicitly opted out), or `undefined`
 * (never decided). A malformed value is treated as undecided rather than an
 * error, matching how {@link readProjectConfig} degrades on bad fields.
 */
export function readCopilotCloudOptIn(projectPath: string): boolean | undefined {
  const value = readProjectConfig(projectPath)?.githubCopilot?.cloudAgent;
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * True when a managed Copilot cloud file (the current generation or a
 * recognized legacy one) already exists. Projects created before the opt-in
 * prompt existed are treated as implicitly opted in, so `openspec update`
 * keeps their files current instead of silently abandoning them.
 */
export async function hasExistingManagedCloudFiles(projectPath: string): Promise<boolean> {
  for (const relPath of Object.values(COPILOT_CLOUD_FILES)) {
    const fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, relPath);
    if (!(await FileSystemUtils.fileExists(fullPath))) {
      continue;
    }
    const content = await FileSystemUtils.readFile(fullPath);
    if (isManagedCopilotCloudFile(relPath, content)) {
      return true;
    }
  }
  return false;
}

/**
 * Effective decision on whether to generate/refresh Copilot cloud files.
 * An explicit opt-in or opt-out always wins; when undecided, fall back to
 * whether managed files already exist (the migration path above).
 */
export async function isCopilotCloudEnabled(projectPath: string): Promise<boolean> {
  const optIn = readCopilotCloudOptIn(projectPath);
  if (typeof optIn === 'boolean') {
    return optIn;
  }
  return hasExistingManagedCloudFiles(projectPath);
}

/**
 * Persist the Copilot cloud opt-in into openspec/config.yaml.
 *
 * Uses the YAML document model rather than a re-serialize so the user's
 * existing comments, ordering, and formatting survive untouched — the config
 * file is hand-authored and heavily commented, so a lossy round-trip would be
 * its own source of toil. No-op when no config file exists yet (init creates it
 * before this is called); the caller treats persistence failures as non-fatal.
 */
export async function persistCopilotCloudOptIn(
  projectPath: string,
  value: boolean
): Promise<void> {
  const configPath = resolveConfigFilePath(projectPath);
  if (!configPath) {
    return;
  }
  const existing = await FileSystemUtils.readFile(configPath);
  const parsed = parseDocument(existing);
  // A file YAML can't parse cleanly — a multi-document stream, a tab-indented
  // syntax error — can't be edited without corrupting it, and toString() would
  // throw. Leave it untouched rather than clobber or crash; such a file is
  // already invalid, so readProjectConfig ignores it anyway.
  if (parsed.errors.length > 0) {
    return;
  }
  // `setIn(['githubCopilot', ...])` needs a top-level map. A config whose root
  // is anything else — a scalar (`null`, a bare string) or even a sequence —
  // has no map to set a key on and makes setIn throw. Such a file is already
  // invalid (readProjectConfig rejects it), so start fresh rather than crash.
  // An empty or comment-only file parses to null contents, which setIn fills in
  // while keeping the comments — so only a non-map root is discarded.
  const doc: Document =
    parsed.contents === null || isMap(parsed.contents) ? parsed : new Document();
  // The root is a map now, but the `githubCopilot` node itself may be a stray
  // scalar/sequence/null (e.g. `githubCopilot: false`) — descending into that
  // with setIn also throws. Replace any non-map node with an empty map first.
  const section = doc.getIn([COPILOT_CONFIG_KEY], true);
  if (section !== undefined && !isMap(section)) {
    doc.setIn([COPILOT_CONFIG_KEY], new YAMLMap());
  }
  doc.setIn([COPILOT_CONFIG_KEY, COPILOT_CLOUD_AGENT_KEY], value);
  await FileSystemUtils.writeFile(configPath, doc.toString());
}

/**
 * Return the managed cloud-file paths (relative to the project root) that
 * currently hold user-owned, non-managed content — i.e. files OpenSpec will
 * deliberately leave untouched. Used to tell an opted-in user that we preserved
 * their existing file rather than silently doing nothing, which is the honest
 * answer to "will this affect my existing Copilot cloud setup?".
 */
export async function findUnmanagedCloudFiles(projectPath: string): Promise<string[]> {
  const collisions: string[] = [];
  for (const relPath of Object.values(COPILOT_CLOUD_FILES)) {
    const fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, relPath);
    if (!(await FileSystemUtils.fileExists(fullPath))) {
      continue;
    }
    const content = await FileSystemUtils.readFile(fullPath);
    if (!isManagedCopilotCloudFile(relPath, content)) {
      collisions.push(relPath);
    }
  }
  return collisions;
}

/**
 * Return the managed cloud-file paths (relative to the project root) that
 * currently exist and hold OpenSpec-generated content. Callers report this
 * rather than the intended paths, so output never claims a file that a write
 * skipped (user already owns it) or that reconciliation removed.
 */
export async function listManagedCloudFiles(projectPath: string): Promise<string[]> {
  const present: string[] = [];
  for (const relPath of Object.values(COPILOT_CLOUD_FILES)) {
    const fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, relPath);
    if (!(await FileSystemUtils.fileExists(fullPath))) {
      continue;
    }
    const content = await FileSystemUtils.readFile(fullPath);
    if (isManagedCopilotCloudFile(relPath, content)) {
      present.push(relPath);
    }
  }
  return present;
}
