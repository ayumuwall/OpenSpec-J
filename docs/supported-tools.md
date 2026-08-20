# 対応ツール

OpenSpec は多くの AI コーディングアシスタントに対応しています。`openspec init` を実行すると、有効なプロファイル、ワークフロー選択、配信モードに基づいて、選択したツール向けの連携設定を行います。

## 仕組み

選択した各ツールに対して、OpenSpec は次をインストールできます。

1. **スキル**（delivery に skills が含まれる場合）: `.../skills/openspec-*/SKILL.md`
2. **コマンド**（delivery に commands が含まれる場合）: ツール固有の `opsx-*` コマンドファイル

Codex はスキル専用です。OpenSpec は delivery を `commands` に設定していても Codex 用に `.agents/skills/openspec-*/SKILL.md` を導入し、Codex カスタムプロンプトファイルは生成しません。レガシー `.codex/skills` パスにある OpenSpec 管理対象スキルは、置換先を書き込んだ後に照合します。カスタムファイルと内容が異なるファイルは保持されます。

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

| OpenSpec が書き込むコマンドファイル | 入力方法 | ツール |
|------------------------------|----------|-------|
| `.../commands/opsx/<id>.*` — `opsx/` フォルダーを名前空間として使用 | `/opsx:<id>` | Claude Code、CodeBuddy、Crush、Gemini CLI、Lingma、Qoder、ZCode |
| `.../opsx-<id>.*` — ファイル名がコマンド名 | `/opsx-<id>` | Amazon Q と Devin を除く、コマンドファイル生成対応ツール |
| `.devin/workflows/opsx-<id>.md` — Devin の 2 エージェントのうち一方だけが読み込み | Devin Desktop は `/opsx-<id>`、Devin Local は `/openspec-<skill>` | Devin Desktop\*\*\*\* |
| `.amazonq/prompts/opsx-<id>.md` — コマンドではなくプロンプト | `@opsx-<id>` | Amazon Q Developer |
| なし — スキルのみ | `/openspec-<skill>` | CodeArts、ForgeCode、Hermes、MiniMax Code、Mistral Vibe、Zed Agent、共通 `.agents` |
| なし — Kimi Code | `/skill:openspec-<skill>` | Kimi Code |
| なし — Codex CLI | `$openspec-<skill>` | Codex（[`/openspec-<skill>` は認識されません](https://github.com/openai/codex/issues/11817)） |

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
| Command Code (`command-code`) | `.commandcode/skills/openspec-*/SKILL.md` | `.commandcode/commands/opsx-<id>.md` |
| CodeArts (`codeartsagent`) | `.codeartsdoer/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/openspec-*/SKILL.md` | `.codebuddy/commands/opsx/<id>.md` |
| Codex (`codex`) | `.agents/skills/openspec-*/SKILL.md` | 生成なし（スキル専用。`$openspec-*` を使用） |
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
| MiniMax Code (`minimax-code`) | `~/.minimax/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。MiniMax Code スキルを使用） |
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |
| Oh My Pi (`oh-my-pi`) | `.omp/skills/openspec-*/SKILL.md` | `.omp/commands/opsx-<id>.md` |
| OpenCode (`opencode`) | `.opencode/skills/openspec-*/SKILL.md` | `.opencode/commands/opsx-<id>.md` |
| Pi (`pi`) | `.pi/skills/openspec-*/SKILL.md` | `.pi/prompts/opsx-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/openspec-*/SKILL.md` | `.qoder/commands/opsx/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/openspec-*/SKILL.md` | `.qwen/commands/opsx-<id>.md` |
| [Rovo Dev CLI](https://support.atlassian.com/rovo/docs/use-rovo-dev-cli/) (`rovodev`) | `.rovodev/skills/openspec-*/SKILL.md` | 生成なし。Rovo にスラッシュコマンド機能はなく、スキルを自動またはプロンプト（例: "use the openspec-propose skill"）で照合します。`/skills` はスキル管理のみを行います。生成コンテンツは `/openspec-*` コマンドとしてではなく、名前でスキルを参照します。 |
| [Zoo Code](https://github.com/Zoo-Code-Org/Zoo-Code) (`roocode`) | `.roo/skills/openspec-*/SKILL.md` | `.roo/commands/opsx-<id>.md` |
| Trae (`trae`) | `.trae/skills/openspec-*/SKILL.md` | `.trae/commands/opsx-<id>.md` |
| [Zed Agent](https://zed.dev/docs/ai/skills) (`zed`) | `.agents/skills/openspec-*/SKILL.md` | 生成なし（スキル専用。`/openspec-*` または `@openspec-*` を使用） |
| ZCode (`zcode`) | `.zcode/skills/openspec-*/SKILL.md` | `.zcode/commands/opsx/<id>.md` |
| 共通 `.agents` スキル (`agents`) | `.agents/skills/openspec-*/SKILL.md` | 生成なし（コマンドアダプターなし。スキルベースの `/openspec-*` 呼び出しを使用） |

\*\* GitHub Copilot プロンプトファイルは、IDE 拡張（VS Code、JetBrains、Visual Studio）でカスタムスラッシュコマンドとして認識されます。Copilot CLI は現在 `.github/prompts/*.prompt.md` を直接読み込みません。`github-copilot` を選ぶと、GitHub で動作する **クラウドコーディングエージェント** もセットアップできます。下記の[GitHub Copilot クラウドコーディングエージェント](#github-copilot-cloud-coding-agent)を参照してください。

\*\*\* Hermesはデフォルトで `~/.hermes/skills/` からスキルを読み込みます。プロジェクトローカルのOpenSpecスキルを使うには、プロジェクトの `.hermes/skills/` ディレクトリを `~/.hermes/config.yaml` の `skills.external_dirs` に追加してください。Hermesでは `/openspec-propose` などのスラッシュ形式でスキルを呼び出せます。

\*\*\*\* Windsurfは2026年6月2日に[Devin Desktopへ名称変更](https://docs.devin.ai/desktop/devin-desktop-faq)され、設定ディレクトリも移動しました。`.devin/` が推奨される読み書き先で、`.windsurf/` は従来の読み取り専用フォールバックです。OpenSpecも名称変更に追従し、ツールIDは `devin` ですが、既存スクリプト向けに `--tools windsurf` も引き続き解決されます。`.windsurf/` にOpenSpecファイルが残るプロジェクトでは、次回の `openspec update` で移動を提案します。拒否した場合はそのまま残り、利用者が作成したファイルには触れません。ワークフローはファイル名で呼び出すため、`.devin/workflows/opsx-apply.md` は `/opsx-apply` です。[Devin Localはワークフロー非対応](https://docs.devin.ai/desktop/devin-local)でスキルだけを使い、`.windsurf/` も読みません。そのためDevin向けスキルと開始時のヒントでは、両エージェントで使える `/openspec-*` スキル呼び出しを使います。commands-only deliveryではスキルを書き込まず、どちらも `/opsx-*` へフォールバックします。

MiniMax Code はグローバルなスキル専用統合です。OpenSpec は
`~/.minimax/skills/` 配下の自身の `openspec-*` ディレクトリだけを書き込みます。
リポジトリローカルの `.minimax` や `.mavis` ディレクトリは作成しません。commands-only delivery では
既存のグローバル MiniMax Code スキルに触れないため、あるプロジェクトの delivery 設定で
別のプロジェクトが使うスキルを削除することはありません。

### GitHub Copilot クラウドコーディングエージェント

GitHub の [Copilot coding agent](https://docs.github.com/en/copilot/using-github-copilot/coding-agent) は、エディター内の Copilot とは別に GitHub Actions 環境で動作します。OpenSpec は次の2ファイルを生成し、OpenSpec CLI を使えるようセットアップします:

- `.github/workflows/copilot-setup-steps.yml` — エージェント環境に `@ayumuwall/openspec` をインストール
- `.github/agents/openspec.agent.md` — OpenSpec の使い方をエージェントに指示

リポジトリへ GitHub Actions ワークフローを書き込むため、これは**オプトイン**です:

| 方法 | 動作 |
|-----|----------|
| `openspec init`（対話） | クラウドファイルをセットアップするか尋ねます。既定は**いいえ**です。 |
| `openspec init --copilot-cloud` | 確認なしでセットアップします（スクリプト／CI 向け）。 |
| `openspec init --no-copilot-cloud` | 確認なしでスキップし、以前に生成したファイルがあれば削除します。 |
| `openspec update` | 確認しません。オプトイン済み、またはプロジェクトに生成済みファイルがある場合だけ更新します。オプトアウト済みなら、OpenSpec 管理対象クラウドファイルを削除します。 |

選択は `openspec/config.yaml` に `githubCopilot.cloudAgent: true|false` として保存されるため、非対話的な更新でも尊重されます。OpenSpec が書き込み・削除するのは、自身が生成した内容のファイルだけです。`copilot-setup-steps.yml` または `openspec.agent.md` をカスタマイズした場合、すでに独自のファイルがある場合は、変更せずに残します（`init`/`update` でその旨を通知します）。

### 共通 `.agents` ターゲットを選ぶ場合

`agents` はベンダー非依存の選択肢です。ツール固有のディレクトリではなく、多くのエージェントツールが読み込む共有ルート `.agents/skills/` へスキルを書き込みます。

| 状況 | 選択 |
|-----------|------|
| 使用ツールが上表にある | そのツール固有の ID。対応していればスラッシュコマンドを含む統合が得られます |
| 1つのリポジトリで複数エージェントが `.agents/skills` を読む | `agents`。ツールごとではなく1つのスキルツリーを使います |
| 使用ツールは未掲載だが `.agents/skills` を読む | `agents` |

ツール固有 ID と同時に選んでも問題ありません。通常はそれぞれ固有のルートへ書き込みます。Codex と Zed Agent は同じ正規 `.agents` ルートを使うため例外です。Codex を Zed または `agents` と同時に選んだ場合、OpenSpec は Codex 主導のツリーを1つだけ維持します。引き継ぎには Codex 用の `$openspec-*` と他エージェント用の `/openspec-*` の両方を示すため、`--tools all` と既存のマルチエージェント構成でも2つの書き込み元が同じファイルを上書きせず動作します。プロジェクトに `.agents/skills/` ディレクトリがあれば OpenSpec は自動的にこの選択肢も提示します。ツールはこのルートをルールやサブエージェント定義にも使うため、空の `.agents/` だけでは十分ではありません。`.agents` と `.agent` は別物であり、単数形のディレクトリは Antigravity 用です。

知っておくべき点は2つあります:

- **スキルのみ。** コマンドアダプターがないため `opsx-*` コマンドファイルは書き込まれません。commands を含む delivery モードでは、`openspec init` が `Commands skipped for: … (no adapter)` に `agents` を表示します。ワークフローはスキル名で呼び出します。`.agents/skills` を読むアシスタントの多くは、OpenSpec のセットアップヒントが表示する `/openspec-propose` 形式を使います。ターゲットはベンダー非依存のため、別形式を使う場合はアシスタント自身のドキュメントを確認してください。
- **`AGENTS.md` は作成・編集しません。** 対象は `.agents/` ディレクトリです。ルート `AGENTS.md` に古い OpenSpec のマーカーブロックが残っている場合は、`openspec update` が取り除きます。[移行ガイド](migration-guide.md)を参照してください。

`Zed` の対応対象は組み込みの Zed Agent です。Agent Skills には [Zed v1.4.2](https://github.com/zed-industries/zed/releases/tag/v1.4.2) 以降が必要で、信頼されていない worktree では [信頼を許可](https://zed.dev/docs/worktree-trust)するまでプロジェクトローカルのスキルを利用できません。

`.agents/skills/` は Codex、Zed Agent、ベンダー非依存ターゲットで共有されるため、OpenSpec がそこで管理する範囲を知っておく必要があります。選択したワークフローの `openspec-*` スキルディレクトリと、共有ツリーを Codex、Zed Agent、ベンダー非依存ターゲットのどれが描画したかを記録する `.openspec-target` マーカーだけを書き込み、更新し、削除します。そのディレクトリ内のその他のものには触れません。`openspec-*` 名とマーカーは OpenSpec 管理対象として扱ってください。中を編集しても、他ツールと同様に次回の `openspec update` で置き換えられます。

マーカー以前のプロジェクトでは、OpenSpec は管理対象スキルの参照から所有者を推測します。`$openspec-*` は Codex、`/openspec-*` はベンダー非依存ターゲットを意味します。汎用の正規ツリーとレガシー `.codex/skills` が並んでいる場合は、古い二重ターゲット導入として扱い、互換性のある共有ツリーへ統合します。

`openspec update` もこの所有者を尊重します。プロジェクトが `.agents` をベンダー非依存ターゲットとして所有し、残ったプロンプトファイルからのみ古い Codex 導入を検出した場合、更新は確立済みの `agents` ツリーを Codex 構文で書き換えず、そのまま維持します。置換を書き込んでいないため、そのレガシープロンプトファイルも削除せず保持します。共有ツリーを Codex へ渡すには、`openspec init --tools codex` を明示的に実行してください。

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

**利用可能なツール ID（`--tools`）** — `windsurf` は `devin` の別名としても受け付けます: `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `command-code`, `codeartsagent`, `codex`, `devin`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `hermes`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `minimax-code`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `zed`, `zcode`, `agents`

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
