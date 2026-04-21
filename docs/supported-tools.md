# 対応ツール

OpenSpec は多くの AI コーディングアシスタントに対応しています。`openspec init` を実行すると、現在のプロファイル・ワークフロー選択と `delivery` 設定に基づいて、選択したツール向けの連携設定を行います。

## 仕組み

選択した各ツールに対して、OpenSpec は次をインストールできます。

1. **Skills**（`delivery` に `skills` が含まれる場合）— `/opsx:*` ワークフローを動かす再利用可能な指示ファイル
2. **Commands**（`delivery` に `commands` が含まれる場合）— ツール固有のスラッシュコマンド紐付け

既定では `core` プロファイルが使われ、`propose`, `explore`, `apply`, `archive` が含まれます。拡張ワークフロー（`new`, `continue`, `ff`, `verify`, `sync`, `bulk-archive`, `onboard`）は `openspec config profile` と `openspec update` で有効化できます。

## ツール別ディレクトリ

| ツール | Skills の場所 | Commands の場所 |
|------|-----------------|-------------------|
| Amazon Q Developer | `.amazonq/skills/` | `.amazonq/prompts/` |
| Antigravity | `.agent/skills/` | `.agent/workflows/` |
| Auggie (Augment CLI) | `.augment/skills/` | `.augment/commands/` |
| Bob Shell | `.bob/skills/` | `.bob/commands/` |
| Claude Code | `.claude/skills/` | `.claude/commands/opsx/` |
| Cline | `.cline/skills/` | `.clinerules/workflows/` |
| CodeBuddy | `.codebuddy/skills/` | `.codebuddy/commands/opsx/` |
| Codex | `.codex/skills/` | `~/.codex/prompts/`\* |
| Continue | `.continue/skills/` | `.continue/prompts/` |
| CoStrict | `.cospec/skills/` | `.cospec/openspec/commands/` |
| Crush | `.crush/skills/` | `.crush/commands/opsx/` |
| Cursor | `.cursor/skills/` | `.cursor/commands/` |
| Factory Droid | `.factory/skills/` | `.factory/commands/` |
| ForgeCode | `.forge/skills/` | 生成なし（スキル呼び出しのみ） |
| Gemini CLI | `.gemini/skills/` | `.gemini/commands/opsx/` |
| GitHub Copilot | `.github/skills/` | `.github/prompts/`\*\* |
| iFlow | `.iflow/skills/` | `.iflow/commands/` |
| Junie | `.junie/skills/` | `.junie/commands/` |
| Kilo Code | `.kilocode/skills/` | `.kilocode/workflows/` |
| Kiro | `.kiro/skills/` | `.kiro/prompts/` |
| Lingma | `.lingma/skills/` | `.lingma/commands/` |
| OpenCode | `.opencode/skills/` | `.opencode/commands/` |
| Pi | `.pi/skills/` | `.pi/prompts/` |
| Qoder | `.qoder/skills/` | `.qoder/commands/opsx/` |
| Qwen Code | `.qwen/skills/` | `.qwen/commands/` |
| RooCode | `.roo/skills/` | `.roo/commands/` |
| Trae | `.trae/skills/` | 生成なし（スキルベースの `/openspec-*` 呼び出しを使用） |
| Windsurf | `.windsurf/skills/` | `.windsurf/workflows/` |

\* Codex のコマンドはプロジェクト内ではなく、グローバルなホームディレクトリ（`~/.codex/prompts/` または `$CODEX_HOME/prompts/`）にインストールされます。

\*\* GitHub Copilot の `.github/prompts/*.prompt.md` ファイルは、**IDE 拡張機能のみ**（VS Code, JetBrains, Visual Studio）でカスタムスラッシュコマンドとして認識されます。GitHub Copilot CLI は現在このディレクトリのカスタムプロンプトをサポートしていません — [github/copilot-cli#618](https://github.com/github/copilot-cli/issues/618) を参照してください。Copilot CLI を使用している場合は、`.github/agents/` に[カスタムエージェント](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)を手動でセットアップする必要があります。

## 非対話セットアップ

CI/CD やスクリプトでセットアップする場合は `--tools` フラグを使います。必要なら `--profile` も指定できます。

```bash
# 特定のツールを設定
openspec init --tools claude,cursor

# 全ツールを設定
openspec init --tools all

# ツール設定をスキップ
openspec init --tools none

# 今回だけ core プロファイルで初期化
openspec init --profile core
```

**利用可能なツール ID:** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codebuddy`, `codex`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `forgecode`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kiro`, `lingma`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

## インストールされるもの

生成されるスキルとコマンドの数は固定ではなく、選択したワークフローと `delivery` 設定に依存します。

| スキル | 目的 |
|-------|---------|
| `openspec-explore` | アイデア探索の思考パートナー |
| `openspec-new-change` | 新しい変更の開始 |
| `openspec-continue-change` | 次のアーティファクト作成 |
| `openspec-ff-change` | 計画アーティファクトの一括生成 |
| `openspec-apply-change` | タスク実装 |
| `openspec-verify-change` | 実装の検証 |
| `openspec-sync-specs` | 仕様差分の同期（任意） |
| `openspec-archive-change` | 変更のアーカイブ |
| `openspec-bulk-archive-change` | 複数変更の一括アーカイブ |
| `openspec-onboard` | ワークフロー全体のガイド付きオンボード |
| `openspec-propose` | 変更と計画アーティファクトの一括生成 |

これらのスキルは `/opsx:propose`, `/opsx:new`, `/opsx:apply` などのスラッシュコマンドで呼び出されます。詳細は [コマンド](commands.md) を参照してください。

## 新しいツールを追加する

別の AI コーディングアシスタントを追加したい場合は、[コマンドアダプターパターン](../CONTRIBUTING.md) を参照するか、GitHub Issue を作成してください。

---

## 関連

- [CLI リファレンス](cli.md) — ターミナルコマンド
- [コマンド](commands.md) — スラッシュコマンドとスキル
- [はじめに](getting-started.md) — 初回セットアップ
