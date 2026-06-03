# 対応ツール

OpenSpec は多くの AI コーディングアシスタントに対応しています。`openspec init` を実行すると、有効な profile / workflow 選択と delivery mode に基づいて、選択したツール向けの連携設定を行います。

## 仕組み

選択した各ツールに対して、OpenSpec は次をインストールできます。

1. **Skills**（delivery に skills が含まれる場合）: `.../skills/openspec-*/SKILL.md`
2. **Commands**（delivery に commands が含まれる場合）: ツール固有の `opsx-*` コマンドファイル

既定では `core` profile が使われ、次のワークフローが含まれます。
- `propose`
- `explore`
- `apply`
- `sync`
- `archive`

拡張ワークフロー（`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`）は、`openspec config profile` で有効化し、その後 `openspec update` を実行します。

## ツール別ディレクトリリファレンス

| ツール（ID） | Skills パスパターン | Command パスパターン |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/openspec-*/SKILL.md` | `.amazonq/prompts/opsx-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/openspec-*/SKILL.md` | `.agent/workflows/opsx-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/openspec-*/SKILL.md` | `.augment/commands/opsx-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/openspec-*/SKILL.md` | `.bob/commands/opsx-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/openspec-*/SKILL.md` | `.claude/commands/opsx/<id>.md` |
| Cline (`cline`) | `.cline/skills/openspec-*/SKILL.md` | `.clinerules/workflows/opsx-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/openspec-*/SKILL.md` | `.codebuddy/commands/opsx/<id>.md` |
| Codex (`codex`) | `.codex/skills/openspec-*/SKILL.md` | `$CODEX_HOME/prompts/opsx-<id>.md`\* |
| ForgeCode (`forgecode`) | `.forge/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| Continue (`continue`) | `.continue/skills/openspec-*/SKILL.md` | `.continue/prompts/opsx-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/openspec-*/SKILL.md` | `.cospec/openspec/commands/opsx-<id>.md` |
| Crush (`crush`) | `.crush/skills/openspec-*/SKILL.md` | `.crush/commands/opsx/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/openspec-*/SKILL.md` | `.cursor/commands/opsx-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/openspec-*/SKILL.md` | `.factory/commands/opsx-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/openspec-*/SKILL.md` | `.gemini/commands/opsx/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/openspec-*/SKILL.md` | `.github/prompts/opsx-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/openspec-*/SKILL.md` | `.iflow/commands/opsx-<id>.md` |
| Junie (`junie`) | `.junie/skills/openspec-*/SKILL.md` | `.junie/commands/opsx-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/openspec-*/SKILL.md` | `.kilocode/workflows/opsx-<id>.md` |
| Kimi CLI (`kimi`) | `.kimi/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/skill:openspec-*` 呼び出しを使用） |
| Kiro (`kiro`) | `.kiro/skills/openspec-*/SKILL.md` | `.kiro/prompts/opsx-<id>.prompt.md` |
| Lingma (`lingma`) | `.lingma/skills/openspec-*/SKILL.md` | `.lingma/commands/opsx/<id>.md` |
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| OpenCode (`opencode`) | `.opencode/skills/openspec-*/SKILL.md` | `.opencode/commands/opsx-<id>.md` |
| Pi (`pi`) | `.pi/skills/openspec-*/SKILL.md` | `.pi/prompts/opsx-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/openspec-*/SKILL.md` | `.qoder/commands/opsx/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/openspec-*/SKILL.md` | `.qwen/commands/opsx-<id>.toml` |
| RooCode (`roocode`) | `.roo/skills/openspec-*/SKILL.md` | `.roo/commands/opsx-<id>.md` |
| Trae (`trae`) | `.trae/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| Windsurf (`windsurf`) | `.windsurf/skills/openspec-*/SKILL.md` | `.windsurf/workflows/opsx-<id>.md` |

\* Codex のコマンドはプロジェクト内ではなく、グローバルな Codex ホーム（`$CODEX_HOME/prompts/` が設定されている場合はそこ、未設定なら `~/.codex/prompts/`）にインストールされます。

\*\* GitHub Copilot の prompt ファイルは IDE 拡張機能（VS Code, JetBrains, Visual Studio）でカスタムスラッシュコマンドとして認識されます。Copilot CLI は現在 `.github/prompts/*.prompt.md` を直接読み込みません。

## 非対話セットアップ

CI/CD やスクリプトでセットアップする場合は、`--tools` を使います。必要なら `--profile` も指定できます。

```bash
# 特定のツールを設定
openspec init --tools claude,cursor

# すべての対応ツールを設定
openspec init --tools all

# ツール設定をスキップ
openspec init --tools none

# 今回の init 実行だけ profile を上書き
openspec init --profile core
```

**利用可能なツール ID (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `vibe`, `windsurf`

## ワークフロー依存のインストール

OpenSpec は、選択されたワークフローに基づいてワークフロー成果物をインストールします。

- **Core profile（デフォルト）:** `propose`, `explore`, `apply`, `sync`, `archive`
- **Custom selection:** すべての workflow ID から任意のサブセット:
  `propose`, `explore`, `new`, `continue`, `apply`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

つまり、skill / command の数は固定ではなく、profile と delivery に依存します。

## 生成されるスキル名

profile / workflow 設定で選択された場合、OpenSpec は次のスキルを生成します。

- `openspec-propose`
- `openspec-explore`
- `openspec-new-change`
- `openspec-continue-change`
- `openspec-apply-change`
- `openspec-ff-change`
- `openspec-sync-specs`
- `openspec-archive-change`
- `openspec-bulk-archive-change`
- `openspec-verify-change`
- `openspec-onboard`

コマンドの挙動は [コマンド](commands.md)、`init` / `update` オプションは [CLI](cli.md) を参照してください。

## 関連

- [CLI リファレンス](cli.md) - ターミナルコマンド
- [コマンド](commands.md) - スラッシュコマンドとスキル
- [はじめに](getting-started.md) - 初回セットアップ
