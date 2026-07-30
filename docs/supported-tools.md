# 対応ツール

OpenSpec は多くの AI コーディングアシスタントに対応しています。`openspec init` を実行すると、有効なプロファイル、ワークフロー選択、配信モードに基づいて、選択したツール向けの連携設定を行います。

## 仕組み

選択した各ツールに対して、OpenSpec は次をインストールできます。

1. **Skills**（delivery に skills が含まれる場合）: `.../skills/openspec-*/SKILL.md`
2. **Commands**（delivery に commands が含まれる場合）: ツール固有の `opsx-*` コマンドファイル

Codexはスキル専用です。deliveryを `commands` に設定していても `.codex/skills/openspec-*/SKILL.md` をインストールし、Codexのカスタムプロンプトファイルは生成しません。

既定では `core` profile が使われ、次のワークフローが含まれます。
- `propose`
- `explore`
- `apply`
- `update`
- `sync`
- `archive`

拡張ワークフロー（`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`）は、`openspec config profile` で有効化し、その後 `openspec update` を実行します。

## 呼び出し方法

このドキュメントでは `/opsx:propose` を標準名として使いますが、各ツールではOpenSpecが書き込んだファイルの読み込み方法に応じた表記を使います。下の[ツール別ディレクトリリファレンス](#ツール別ディレクトリリファレンス)でコマンドパスを確認し、その形式を次の表に当てはめてください。

| OpenSpecが書き込むコマンドファイル | 入力形式 | ツール |
|--------------------------------------|----------|--------|
| `.../commands/opsx/<id>.*`（`opsx/` フォルダーが名前空間） | `/opsx:<id>` | Claude Code、CodeBuddy、Crush、Gemini CLI、Lingma、Qoder、ZCode |
| `.../opsx-<id>.*`（ファイル名がコマンド名） | `/opsx-<id>` | Amazon QとDevin以外のコマンドファイル生成ツール |
| `.devin/workflows/opsx-<id>.md` | Devin Desktopでは `/opsx-<id>`、Devin Localでは `/openspec-<skill>` | Devin Desktop\*\*\*\* |
| `.amazonq/prompts/opsx-<id>.md`（コマンドではなくプロンプト） | `@opsx-<id>` | Amazon Q Developer |
| なし（スキルのみ） | `/openspec-<skill>` | CodeArts、ForgeCode、Hermes、Mistral Vibe |
| なし（Kimi Code） | `/skill:openspec-<skill>` | Kimi Code |
| なし（Codex CLI） | `$openspec-<skill>` | Codex（[`/openspec-<skill>` は認識されません](https://github.com/openai/codex/issues/11817)） |

つまり `/opsx:propose` は、Cursorでは `/opsx-propose`、Amazon Qでは `@opsx-propose`、Codexでは `$openspec-propose` です。

次の2点は独立して異なります。

- **名前。** 最初の2行はファイルによるコマンド名の付け方だけが異なり、生成コマンドを持つ全ツールで `opsx-<id>` / `opsx:<id>` の幹は共通です。
- **呼び出し記号。** Amazon Qはファイルを `@` で呼び出すプロンプトライブラリへ読み込みます。スキル専用ツールはコマンドファイルを生成しないため、最後の3行では[生成されるスキル名](#generated-skill-names)を使います。コマンドIDとは1対1ではなく、`/opsx:apply` に対応するスキルは `openspec-apply-change` です。

上のコマンドパスは意図的に拡張子を `.*` としています。拡張子はツールごとに異なり（Gemini CLIは `.toml`、Continueは `.prompt`、KiroとGitHub Copilotは `.prompt.md`）、選択画面に拡張子付きで表示するツールもあります。拡張子ではなくディレクトリ形式を対応させてください。

OpenSpecが生成するファイルとセットアップ後の「Getting started」には、選択したツール向けの正しい形式が使われています。迷った場合は、この表示を確認するのが最短です。

## ツール別ディレクトリリファレンス

| ツール（ID） | Skills パスパターン | Command パスパターン |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/openspec-*/SKILL.md` | `.amazonq/prompts/opsx-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/openspec-*/SKILL.md` | `.agent/workflows/opsx-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/openspec-*/SKILL.md` | `.augment/commands/opsx-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/openspec-*/SKILL.md` | `.bob/commands/opsx-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/openspec-*/SKILL.md` | `.claude/commands/opsx/<id>.md` |
| Cline (`cline`) | `.cline/skills/openspec-*/SKILL.md` | `.clinerules/workflows/opsx-<id>.md` |
| CodeArts (`codeartsagent`) | `.codeartsdoer/skills/openspec-*/SKILL.md` | Not generated (no command adapter; use skill-based `/openspec-*` invocations) |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/openspec-*/SKILL.md` | `.codebuddy/commands/opsx/<id>.md` |
| Codex (`codex`) | `.codex/skills/openspec-*/SKILL.md` | 生成なし（スキル専用。`.codex/skills/openspec-*` を使用） |
| Devin Desktop（旧Windsurf、`devin`） | `.devin/skills/openspec-*/SKILL.md` | `.devin/workflows/opsx-<id>.md`\*\*\*\* |
| ForgeCode (`forgecode`) | `.forge/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| Continue (`continue`) | `.continue/skills/openspec-*/SKILL.md` | `.continue/prompts/opsx-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/openspec-*/SKILL.md` | `.cospec/openspec/commands/opsx-<id>.md` |
| Crush (`crush`) | `.crush/skills/openspec-*/SKILL.md` | `.crush/commands/opsx/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/openspec-*/SKILL.md` | `.cursor/commands/opsx-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/openspec-*/SKILL.md` | `.factory/commands/opsx-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/openspec-*/SKILL.md` | `.gemini/commands/opsx/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/openspec-*/SKILL.md` | `.github/prompts/opsx-<id>.prompt.md`\*\* |
| Hermes Agent (`hermes`) | `.hermes/skills/openspec-*/SKILL.md`\*\*\* | Not generated (no command adapter; use skill-based `/openspec-*` invocations) |
| iFlow (`iflow`) | `.iflow/skills/openspec-*/SKILL.md` | `.iflow/commands/opsx-<id>.md` |
| Junie (`junie`) | `.junie/skills/openspec-*/SKILL.md` | `.junie/commands/opsx-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/openspec-*/SKILL.md` | `.kilocode/workflows/opsx-<id>.md` |
| Kimi Code (`kimi`) | `.kimi-code/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/skill:openspec-*` 呼び出しを使用） |
| Kiro (`kiro`) | `.kiro/skills/openspec-*/SKILL.md` | `.kiro/prompts/opsx-<id>.prompt.md` |
| Lingma (`lingma`) | `.lingma/skills/openspec-*/SKILL.md` | `.lingma/commands/opsx/<id>.md` |
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| Oh My Pi (`oh-my-pi`) | `.omp/skills/openspec-*/SKILL.md` | `.omp/commands/opsx-<id>.md` |
| OpenCode (`opencode`) | `.opencode/skills/openspec-*/SKILL.md` | `.opencode/commands/opsx-<id>.md` |
| Pi (`pi`) | `.pi/skills/openspec-*/SKILL.md` | `.pi/prompts/opsx-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/openspec-*/SKILL.md` | `.qoder/commands/opsx/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/openspec-*/SKILL.md` | `.qwen/commands/opsx-<id>.md` |
| [Zoo Code](https://github.com/Zoo-Code-Org/Zoo-Code) (`roocode`) | `.roo/skills/openspec-*/SKILL.md` | `.roo/commands/opsx-<id>.md` |
| Trae (`trae`) | `.trae/skills/openspec-*/SKILL.md` | `.trae/commands/opsx-<id>.md` |
| ZCode (`zcode`) | `.zcode/skills/openspec-*/SKILL.md` | `.zcode/commands/opsx/<id>.md` |

\*\* GitHub Copilot の prompt ファイルは IDE 拡張機能（VS Code, JetBrains, Visual Studio）でカスタムスラッシュコマンドとして認識されます。Copilot CLI は現在 `.github/prompts/*.prompt.md` を直接読み込みません。

\*\*\* Hermesはデフォルトで `~/.hermes/skills/` からスキルを読み込みます。プロジェクトローカルのOpenSpecスキルを使うには、プロジェクトの `.hermes/skills/` ディレクトリを `~/.hermes/config.yaml` の `skills.external_dirs` に追加してください。Hermesでは `/openspec-propose` などのスラッシュ形式でスキルを呼び出せます。

\*\*\*\* Windsurfは2026年6月2日に[Devin Desktopへ名称変更](https://docs.devin.ai/desktop/devin-desktop-faq)され、設定ディレクトリも移動しました。`.devin/` が推奨される読み書き先で、`.windsurf/` は従来の読み取り専用フォールバックです。OpenSpecも名称変更に追従し、ツールIDは `devin` ですが、既存スクリプト向けに `--tools windsurf` も引き続き解決されます。`.windsurf/` にOpenSpecファイルが残るプロジェクトでは、次回の `openspec update` で移動を提案します。拒否した場合はそのまま残り、利用者が作成したファイルには触れません。ワークフローはファイル名で呼び出すため、`.devin/workflows/opsx-apply.md` は `/opsx-apply` です。[Devin Localはワークフロー非対応](https://docs.devin.ai/desktop/devin-local)でスキルだけを使い、`.windsurf/` も読みません。そのためDevin向けスキルと開始時のヒントでは、両エージェントで使える `/openspec-*` スキル呼び出しを使います。commands-only deliveryではスキルを書き込まず、どちらも `/opsx-*` へフォールバックします。

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

**利用可能なツールID（`--tools`）** — `windsurf` も `devin` のエイリアスとして使用できます: `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codeartsagent`, `codex`, `devin`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `hermes`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `zcode`

## ワークフロー依存のインストール

OpenSpec は、選択されたワークフローに基づいてワークフロー成果物をインストールします。

- **core プロファイル（デフォルト）:** `propose`, `explore`, `apply`, `update`, `sync`, `archive`
- **カスタム選択:** すべてのワークフロー ID から任意のサブセット:
  `propose`, `explore`, `new`, `continue`, `apply`, `update`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

つまり、skill / command の数は固定ではなく、profile と delivery に依存します。

## 生成されるスキル名

プロファイル / ワークフロー設定で選択された場合、OpenSpec は次のスキルを生成します。

- `openspec-propose`
- `openspec-explore`
- `openspec-new-change`
- `openspec-continue-change`
- `openspec-apply-change`
- `openspec-update-change`
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
