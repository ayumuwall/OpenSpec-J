# 対応ツール

OpenSpec は 20 以上の AI コーディングアシスタントに対応しています。`openspec init` を実行すると、使用ツールの選択を促され、適切な連携設定を行います。

> [!NOTE]
> 出力例・コマンド例のコードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO supported-tools examples -->

## 仕組み

選択した各ツールに対して、OpenSpec は次をインストールします。

1. **Skills** — `/opsx:*` ワークフローを動かす再利用可能な指示ファイル
2. **Commands** — ツール固有のスラッシュコマンド紐付け

## ツール別ディレクトリ

| ツール | Skills の場所 | Commands の場所 |
|------|-----------------|-------------------|
| Amazon Q Developer | `.amazonq/skills/` | `.amazonq/prompts/` |
| Antigravity | `.agent/skills/` | `.agent/workflows/` |
| Auggie (Augment CLI) | `.augment/skills/` | `.augment/commands/` |
| Claude Code | `.claude/skills/` | `.claude/commands/opsx/` |
| Cline | `.cline/skills/` | `.clinerules/workflows/` |
| CodeBuddy | `.codebuddy/skills/` | `.codebuddy/commands/opsx/` |
| Codex | `.codex/skills/` | `.codex/prompts/` |
| Continue | `.continue/skills/` | `.continue/prompts/` |
| CoStrict | `.cospec/skills/` | `.cospec/openspec/commands/` |
| Crush | `.crush/skills/` | `.crush/commands/opsx/` |
| Cursor | `.cursor/skills/` | `.cursor/commands/` |
| Factory Droid | `.factory/skills/` | `.factory/commands/` |
| Gemini CLI | `.gemini/skills/` | `.gemini/commands/opsx/` |
| GitHub Copilot | `.github/skills/` | `.github/prompts/` |
| iFlow | `.iflow/skills/` | `.iflow/commands/` |
| Kilo Code | `.kilocode/skills/` | `.kilocode/workflows/` |
| OpenCode | `.opencode/skills/` | `.opencode/command/` |
| Qoder | `.qoder/skills/` | `.qoder/commands/opsx/` |
| Qwen Code | `.qwen/skills/` | `.qwen/commands/` |
| RooCode | `.roo/skills/` | `.roo/commands/` |
| Windsurf | `.windsurf/skills/` | `.windsurf/commands/opsx/` |

## 非対話セットアップ

CI/CD やスクリプトでセットアップする場合は `--tools` フラグを使います。

```bash
# Configure specific tools
openspec init --tools claude,cursor

# Configure all supported tools
openspec init --tools all

# Skip tool configuration
openspec init --tools none
```

**利用可能なツール ID:** `amazon-q`, `antigravity`, `auggie`, `claude`, `cline`, `codebuddy`, `codex`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `kilocode`, `opencode`, `qoder`, `qwen`, `roocode`, `windsurf`

## インストールされるもの

各ツール向けに、OPSX ワークフローを動かす 10 個のスキルファイルが生成されます。

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

これらのスキルは `/opsx:new`, `/opsx:apply` などのスラッシュコマンドで呼び出されます。詳細は [Commands](commands.md) を参照してください。

## 新しいツールを追加する

別の AI コーディングアシスタントを追加したい場合は、[command adapter pattern](../CONTRIBUTING.md) を参照するか GitHub Issue を作成してください。

---

## 関連

- [CLI Reference](cli.md) — ターミナルコマンド
- [Commands](commands.md) — スラッシュコマンドとスキル
- [Getting Started](getting-started.md) — 初回セットアップ
