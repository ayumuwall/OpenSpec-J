# CLI リファレンス

OpenSpec CLI（`openspec`）は、プロジェクトのセットアップ、検証、ステータス確認、管理のためのターミナルコマンドを提供します。これらのコマンドは、[Commands](commands.md) に記載された `/opsx:new` などの AI スラッシュコマンドを補完します。

> [!NOTE]
> 出力例のコードブロックは、CLI の日本語メッセージが確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO CLI output examples -->

## 概要

| カテゴリ | コマンド | 目的 |
|----------|----------|------|
| **セットアップ** | `init`, `update` | プロジェクトの OpenSpec 初期化・更新 |
| **閲覧** | `list`, `view`, `show` | 変更と仕様を確認 |
| **検証** | `validate` | 変更と仕様の問題をチェック |
| **ライフサイクル** | `archive` | 完了した変更を確定 |
| **ワークフロー** | `status`, `instructions`, `templates`, `schemas` | アーティファクト主導ワークフローの支援 |
| **スキーマ** | `schema init`, `schema fork`, `schema validate`, `schema which` | カスタムワークフローの作成と管理 |
| **設定** | `config` | 設定の閲覧と変更 |
| **ユーティリティ** | `feedback`, `completion` | フィードバック送信とシェル連携 |

---

## 人向けコマンドとエージェント向けコマンド

多くの CLI コマンドは **人がターミナルで使うこと** を想定しています。一部のコマンドは **AI エージェント/スクリプト向け** に JSON 出力を提供します。

### 人向け専用コマンド

これらは対話的で、ターミナル操作向けです。

| コマンド | 目的 |
|---------|------|
| `openspec init` | プロジェクト初期化（対話プロンプト） |
| `openspec view` | 対話型ダッシュボード |
| `openspec config edit` | エディタで設定を開く |
| `openspec feedback` | GitHub へフィードバック送信 |
| `openspec completion install` | シェル補完のインストール |

### エージェント対応コマンド

これらは `--json` に対応し、AI エージェントやスクリプトから利用できます。

| コマンド | 人向け用途 | エージェント用途 |
|---------|-----------|------------------|
| `openspec list` | 変更/仕様の一覧 | `--json` で構造化データ |
| `openspec show <item>` | 内容の閲覧 | `--json` で解析用データ |
| `openspec validate` | 問題の検出 | `--all --json` で一括検証 |
| `openspec status` | 進捗の確認 | `--json` で状態を取得 |
| `openspec instructions` | 次の手順 | `--json` で指示を取得 |
| `openspec templates` | テンプレート参照 | `--json` でパス解決 |
| `openspec schemas` | スキーマ一覧 | `--json` でスキーマ探索 |

---

## グローバルオプション

すべてのコマンドで有効です。

| オプション | 説明 |
|--------|-------------|
| `--version`, `-V` | バージョンを表示 |
| `--no-color` | 色付き出力を無効化 |
| `--help`, `-h` | コマンドのヘルプを表示 |

---

## セットアップコマンド

### `openspec init`

プロジェクトで OpenSpec を初期化します。フォルダ構造を作成し、AI ツール連携を設定します。

```
openspec init [path] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `path` | いいえ | 対象ディレクトリ（デフォルト: 現在のディレクトリ） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--tools <list>` | 対話なしで AI ツールを設定。`all`, `none` またはカンマ区切りの一覧 |
| `--force` | 旧ファイルを確認なしで自動クリーンアップ |

**対応ツール:** `amazon-q`, `antigravity`, `auggie`, `claude`, `cline`, `codex`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `kilocode`, `opencode`, `qoder`, `qwen`, `roocode`, `windsurf`

**例:**

```bash
# 対話的に初期化
openspec init

# 特定ディレクトリで初期化
openspec init ./my-project

# 非対話: Claude と Cursor を設定
openspec init --tools claude,cursor

# すべての対応ツールを設定
openspec init --tools all

# プロンプトをスキップし、旧ファイルを自動クリーンアップ
openspec init --force
```

**作成されるもの:**

```
openspec/
├── specs/              # 仕様（ソース・オブ・トゥルース）
├── changes/            # 変更提案
└── config.yaml         # プロジェクト設定

.claude/skills/         # Claude Code のスキルファイル（claude 選択時）
.cursor/rules/          # Cursor ルール（cursor 選択時）
...（他ツールの設定）
```

---

### `openspec update`

CLI を更新した後に指示ファイルを更新します。AI ツールの設定ファイルを再生成します。

```
openspec update [path] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `path` | いいえ | 対象ディレクトリ（デフォルト: 現在のディレクトリ） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--force` | ファイルが最新でも強制更新 |

**例:**

```bash
# npm でアップグレード後に指示ファイルを更新
npm update @fission-ai/openspec
openspec update
```

---

## 閲覧コマンド

### `openspec list`

プロジェクト内の変更または仕様を一覧表示します。

```
openspec list [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--specs` | 変更ではなく仕様を一覧表示 |
| `--changes` | 変更を一覧表示（デフォルト） |
| `--sort <order>` | `recent`（デフォルト）または `name` で並び替え |
| `--json` | JSON で出力 |

**例:**

```bash
# 進行中の変更を一覧表示
openspec list

# すべての仕様を一覧表示
openspec list --specs

# スクリプト向け JSON 出力
openspec list --json
```

**出力（テキスト）:**

```
Active changes:
  add-dark-mode     UI theme switching support
  fix-login-bug     Session timeout handling
```

---

### `openspec view`

仕様と変更を探索する対話型ダッシュボードを表示します。

```
openspec view
```

ターミナル上の UI を開き、プロジェクトの仕様や変更をナビゲートします。

---

### `openspec show`

変更または仕様の詳細を表示します。

```
openspec show [item-name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `item-name` | いいえ | 変更名または仕様名（省略時はプロンプト） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--type <type>` | `change` または `spec` を指定（曖昧でなければ自動判別） |
| `--json` | JSON で出力 |
| `--no-interactive` | プロンプトを無効化 |

**変更向けオプション:**

| オプション | 説明 |
|--------|-------------|
| `--deltas-only` | 仕様差分のみを表示（JSON モード） |

**仕様向けオプション:**

| オプション | 説明 |
|--------|-------------|
| `--requirements` | 要件のみを表示し、シナリオを除外（JSON モード） |
| `--no-scenarios` | シナリオを除外（JSON モード） |
| `-r, --requirement <id>` | 1 始まりのインデックスで特定要件を表示（JSON モード） |

**例:**

```bash
# 対話的に選択
openspec show

# 特定の変更を表示
openspec show add-dark-mode

# 特定の仕様を表示
openspec show auth --type spec

# 解析向け JSON 出力
openspec show add-dark-mode --json
```

---

## 検証コマンド

### `openspec validate`

変更と仕様を検証し、構造上の問題を検出します。

```
openspec validate [item-name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `item-name` | いいえ | 検証対象（省略時はプロンプト） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--all` | すべての変更と仕様を検証 |
| `--changes` | すべての変更を検証 |
| `--specs` | すべての仕様を検証 |
| `--type <type>` | 名称が曖昧な場合に `change` / `spec` を指定 |
| `--strict` | 厳密検証モードを有効化 |
| `--json` | JSON で出力 |
| `--concurrency <n>` | 並列検証の上限（デフォルト: 6、`OPENSPEC_CONCURRENCY` 環境変数でも指定可） |
| `--no-interactive` | プロンプトを無効化 |

**例:**

```bash
# 対話的に検証
openspec validate

# 特定の変更を検証
openspec validate add-dark-mode

# すべての変更を検証
openspec validate --changes

# CI/スクリプト向けに JSON で一括検証
openspec validate --all --json

# 厳密検証 + 並列数を増やす
openspec validate --all --strict --concurrency 12
```

**出力（テキスト）:**

```
Validating add-dark-mode...
  ✓ proposal.md valid
  ✓ specs/ui/spec.md valid
  ⚠ design.md: missing "Technical Approach" section

1 warning found
```

**出力（JSON）:**

```json
{
  "version": "1.0.0",
  "results": {
    "changes": [
      {
        "name": "add-dark-mode",
        "valid": true,
        "warnings": ["design.md: missing 'Technical Approach' section"]
      }
    ]
  },
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  }
}
```

---

## ライフサイクルコマンド

### `openspec archive`

完了した変更をアーカイブし、仕様差分を本仕様に統合します。

```
openspec archive [change-name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | アーカイブ対象の変更（省略時はプロンプト） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `-y, --yes` | 確認プロンプトをスキップ |
| `--skip-specs` | 仕様更新をスキップ（インフラ/ツール/ドキュメントのみの変更向け） |
| `--no-validate` | 検証をスキップ（要確認） |

**例:**

```bash
# 対話的にアーカイブ
openspec archive

# 特定の変更をアーカイブ
openspec archive add-dark-mode

# プロンプトを省略（CI/スクリプト向け）
openspec archive add-dark-mode --yes

# 仕様に影響しないツール更新をアーカイブ
openspec archive update-ci-config --skip-specs
```

**動作内容:**

1. 変更を検証（`--no-validate` を指定しない限り）
2. 確認プロンプト（`--yes` を指定しない限り）
3. 仕様差分を `openspec/specs/` に統合
4. 変更フォルダを `openspec/changes/archive/YYYY-MM-DD-<name>/` に移動

---

## ワークフローコマンド

これらは OPSX のアーティファクト主導ワークフローを支援します。人が進捗を確認するときにも、エージェントが次の手順を判断するときにも有用です。

### `openspec status`

変更に対するアーティファクトの完了状況を表示します。

```
openspec status [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--change <id>` | 変更名（省略時はプロンプト） |
| `--schema <name>` | スキーマを上書き指定（変更の設定から自動判定） |
| `--json` | JSON で出力 |

**例:**

```bash
# 対話的にステータス確認
openspec status

# 特定変更のステータス
openspec status --change add-dark-mode

# エージェント向け JSON
openspec status --change add-dark-mode --json
```

**出力（テキスト）:**

```
Change: add-dark-mode
Schema: spec-driven

Artifacts:
  ✓ proposal     proposal.md exists
  ✓ specs        specs/ exists
  ◆ design       ready (requires: specs)
  ○ tasks        blocked (requires: design)

Next: Create design using /opsx:continue
```

**出力（JSON）:**

```json
{
  "change": "add-dark-mode",
  "schema": "spec-driven",
  "artifacts": [
    {"id": "proposal", "status": "complete", "path": "proposal.md"},
    {"id": "specs", "status": "complete", "path": "specs/"},
    {"id": "design", "status": "ready", "requires": ["specs"]},
    {"id": "tasks", "status": "blocked", "requires": ["design"]}
  ],
  "next": "design"
}
```

---

### `openspec instructions`

アーティファクト作成やタスク実装のための拡張指示を取得します。AI エージェントが次に作るべきものを理解するために使用します。

```
openspec instructions [artifact] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `artifact` | いいえ | アーティファクト ID: `proposal`, `specs`, `design`, `tasks`, `apply` |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--change <id>` | 変更名（非対話モードでは必須） |
| `--schema <name>` | スキーマを上書き指定 |
| `--json` | JSON で出力 |

**特記事項:** `apply` を指定すると、タスク実装向けの指示を返します。

**例:**

```bash
# 次に作るべきアーティファクトの指示を取得
openspec instructions --change add-dark-mode

# 特定アーティファクトの指示を取得
openspec instructions design --change add-dark-mode

# 実装（apply）向けの指示を取得
openspec instructions apply --change add-dark-mode

# エージェント向け JSON
openspec instructions design --change add-dark-mode --json
```

**出力内容:**

- アーティファクト用テンプレートの内容
- 設定から読み込んだプロジェクトコンテキスト
- 依存アーティファクトの内容
- 設定のアーティファクト別ルール

---

### `openspec templates`

スキーマ内のアーティファクトに対するテンプレートパスを表示します。

```
openspec templates [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--schema <name>` | 対象スキーマ（デフォルト: `spec-driven`） |
| `--json` | JSON で出力 |

**例:**

```bash
# デフォルトスキーマのテンプレートを表示
openspec templates

# カスタムスキーマのテンプレートを表示
openspec templates --schema my-workflow

# プログラム向け JSON
openspec templates --json
```

**出力（テキスト）:**

```
Schema: spec-driven

Templates:
  proposal  → ~/.openspec/schemas/spec-driven/templates/proposal.md
  specs     → ~/.openspec/schemas/spec-driven/templates/specs.md
  design    → ~/.openspec/schemas/spec-driven/templates/design.md
  tasks     → ~/.openspec/schemas/spec-driven/templates/tasks.md
```

---

### `openspec schemas`

利用可能なワークフロースキーマと、その説明・フローを一覧表示します。

```
openspec schemas [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--json` | JSON で出力 |

**例:**

```bash
openspec schemas
```

**出力:**

```
Available schemas:

  spec-driven (package)
    The default spec-driven development workflow
    Flow: proposal → specs → design → tasks

  my-custom (project)
    Custom workflow for this project
    Flow: research → proposal → tasks
```

---

## スキーマコマンド

カスタムワークフロースキーマの作成・管理に使用します。

### `openspec schema init`

プロジェクトローカルのスキーマを新規作成します。

```
openspec schema init <name> [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | はい | スキーマ名（kebab-case） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--description <text>` | スキーマの説明 |
| `--artifacts <list>` | アーティファクト ID のカンマ区切り（デフォルト: `proposal,specs,design,tasks`） |
| `--default` | プロジェクトのデフォルトスキーマに設定 |
| `--no-default` | デフォルト設定のプロンプトを無効化 |
| `--force` | 既存スキーマを上書き |
| `--json` | JSON で出力 |

**例:**

```bash
# 対話的にスキーマを作成
openspec schema init research-first

# 非対話 + アーティファクト指定
openspec schema init rapid \
  --description "Rapid iteration workflow" \
  --artifacts "proposal,tasks" \
  --default
```

**作成されるもの:**

```
openspec/schemas/<name>/
├── schema.yaml           # スキーマ定義
└── templates/
    ├── proposal.md       # 各アーティファクトのテンプレート
    ├── specs.md
    ├── design.md
    └── tasks.md
```

---

### `openspec schema fork`

既存スキーマをプロジェクトにコピーしてカスタマイズします。

```
openspec schema fork <source> [name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `source` | はい | コピー元スキーマ |
| `name` | いいえ | 新しいスキーマ名（デフォルト: `<source>-custom`） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--force` | 既存のコピー先を上書き |
| `--json` | JSON で出力 |

**例:**

```bash
# ビルトインの spec-driven をフォーク
openspec schema fork spec-driven my-workflow
```

---

### `openspec schema validate`

スキーマ構造とテンプレートを検証します。

```
openspec schema validate [name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | いいえ | 検証対象スキーマ（省略時は全件） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--verbose` | 詳細な検証ステップを表示 |
| `--json` | JSON で出力 |

**例:**

```bash
# 特定スキーマを検証
openspec schema validate my-workflow

# すべてのスキーマを検証
openspec schema validate
```

---

### `openspec schema which`

スキーマがどこから解決されるかを表示します（優先順位のデバッグ用）。

```
openspec schema which [name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | いいえ | スキーマ名 |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--all` | すべてのスキーマとソースを一覧表示 |
| `--json` | JSON で出力 |

**例:**

```bash
# スキーマの解決元を確認
openspec schema which spec-driven
```

**出力:**

```
spec-driven resolves from: package
  Source: /usr/local/lib/node_modules/@fission-ai/openspec/schemas/spec-driven
```

**スキーマの優先順位:**

1. プロジェクト: `openspec/schemas/<name>/`
2. ユーザー: `~/.local/share/openspec/schemas/<name>/`
3. パッケージ: 組み込みスキーマ

---

## 設定コマンド

### `openspec config`

グローバルな OpenSpec 設定を閲覧・変更します。

```
openspec config <subcommand> [options]
```

**サブコマンド:**

| サブコマンド | 説明 |
|------------|-------------|
| `path` | 設定ファイルの場所を表示 |
| `list` | 現在の設定一覧を表示 |
| `get <key>` | 指定キーの値を取得 |
| `set <key> <value>` | 値を設定 |
| `unset <key>` | キーを削除 |
| `reset` | デフォルトに戻す |
| `edit` | `$EDITOR` で開く |

**例:**

```bash
# 設定ファイルのパスを表示
openspec config path

# 設定一覧を表示
openspec config list

# 特定キーの値を取得
openspec config get telemetry.enabled

# 値を設定
openspec config set telemetry.enabled false

# 文字列として明示的に設定
openspec config set user.name "My Name" --string

# カスタム設定を削除
openspec config unset user.name

# すべての設定をリセット
openspec config reset --all --yes

# エディタで設定を開く
openspec config edit
```

---

## ユーティリティコマンド

### `openspec feedback`

OpenSpec へのフィードバックを送信します。GitHub Issue を作成します。

```
openspec feedback <message> [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `message` | はい | フィードバック内容 |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--body <text>` | 詳細説明 |

**要件:** GitHub CLI（`gh`）がインストールされ、認証済みである必要があります。

**例:**

```bash
openspec feedback "Add support for custom artifact types" \
  --body "I'd like to define my own artifact types beyond the built-in ones."
```

---

### `openspec completion`

OpenSpec CLI のシェル補完を管理します。

```
openspec completion <subcommand> [shell]
```

**サブコマンド:**

| サブコマンド | 説明 |
|------------|-------------|
| `generate [shell]` | 補完スクリプトを標準出力に出力 |
| `install [shell]` | シェル補完をインストール |
| `uninstall [shell]` | インストール済み補完を削除 |

**対応シェル:** `bash`, `zsh`, `fish`, `powershell`

**例:**

```bash
# 補完をインストール（シェルを自動検出）
openspec completion install

# 特定シェル向けにインストール
openspec completion install zsh

# 手動インストール用スクリプトを生成
openspec completion generate bash > ~/.bash_completion.d/openspec

# アンインストール
openspec completion uninstall
```

---

## 終了コード

| コード | 意味 |
|------|---------|
| `0` | 成功 |
| `1` | エラー（検証失敗、ファイル欠落など） |

---

## 環境変数

| 変数 | 説明 |
|----------|-------------|
| `OPENSPEC_CONCURRENCY` | 一括検証のデフォルト並列数（デフォルト: 6） |
| `EDITOR` または `VISUAL` | `openspec config edit` のエディタ指定 |
| `NO_COLOR` | 設定時に色付き出力を無効化 |

---

## 関連ドキュメント

- [Commands](commands.md) - AI スラッシュコマンド（`/opsx:new`, `/opsx:apply` など）
- [Workflows](workflows.md) - 代表的なフローと使い分け
- [Customization](customization.md) - カスタムスキーマとテンプレート
- [Getting Started](getting-started.md) - 初回セットアップガイド
