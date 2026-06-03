# CLI リファレンス

OpenSpec CLI（`openspec`）は、プロジェクトのセットアップ、検証、ステータス確認、管理のためのターミナルコマンドを提供します。これらのコマンドは、[コマンド](commands.md) に記載された `/opsx:propose` などの AI スラッシュコマンドを補完します。

## 概要

| カテゴリ | コマンド | 目的 |
|----------|----------|------|
| **セットアップ** | `init`, `update` | プロジェクトの OpenSpec 初期化・更新 |
| **ワークスペース（beta）** | `workspace setup`, `workspace list`, `workspace ls`, `workspace link`, `workspace relink`, `workspace doctor`, `workspace update`, `workspace open` | 連携リポジトリやフォルダをまとめて扱うローカルビューをセットアップ |
| **共有コンテキスト（beta）** | `context-store setup`, `context-store register`, `context-store unregister`, `context-store remove`, `context-store list`, `context-store doctor`, `initiative create`, `initiative show`, `initiative list` | ローカルの context-store 登録と、永続的な initiative コンテキストを管理 |
| **閲覧** | `list`, `view`, `show` | 変更と仕様を確認 |
| **検証** | `validate` | 変更と仕様の問題をチェック |
| **ライフサイクル** | `archive` | 完了した変更を確定 |
| **ワークフロー** | `new change`, `set change`, `status`, `instructions`, `templates`, `schemas` | アーティファクト主導ワークフローの支援 |
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
| `openspec workspace setup --no-interactive` | 明示的な入力でワークスペースを作成 | `--json` で構造化されたセットアップ結果 |
| `openspec workspace list` | 既知のワークスペースを一覧 | `--json` で型付きワークスペースオブジェクト |
| `openspec workspace link` | リポジトリまたはフォルダをリンク | `--json` で構造化されたリンク結果 |
| `openspec workspace relink` | リンク済みパスを修復 | `--json` で構造化されたリンク結果 |
| `openspec workspace doctor` | 1 つのワークスペースを診断 | `--json` で構造化された状態 |
| `openspec workspace update` | ワークスペース内のガイダンスとエージェントスキルを更新 | `--tools` でエージェントを選択し、profile でワークフローを選択 |
| `openspec context-store setup <id>` | ローカルの context store を作成 | 明示入力 + `--json` で構造化されたセットアップ結果 |
| `openspec context-store register <path>` | 既存の context store を登録 | `--json` で構造化された登録結果 |
| `openspec context-store unregister <id>` | ローカルの context-store 登録を解除 | `--json` で構造化されたクリーンアップ結果 |
| `openspec context-store remove <id>` | 登録済みローカル context-store フォルダを削除 | 非対話削除は `--yes --json` |
| `openspec context-store list` | 登録済みの context store を一覧 | `--json` で構造化された登録情報 |
| `openspec context-store doctor` | ローカルの context store 設定を診断 | `--json` で構造化された診断結果 |
| `openspec initiative list` | 共有 initiative を一覧 | `--json` で構造化された initiative レコード |
| `openspec initiative show <id>` | initiative を解決 | `--json` で正規パスとメタデータ |
| `openspec new change <id>` | リポジトリ内の変更ひな形を作成 | `--json`、共有連携には `--initiative` |
| `openspec set change <id>` | チェックイン済み変更メタデータを更新 | `--json`、共有連携には `--initiative` |

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

既定ではグローバル設定の初期値が使われ、`profile=core`、`delivery=both`、`workflows=propose, explore, apply, sync, archive` で動作します。

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
| `--profile <profile>` | 今回の `init` 実行に限ってプロファイルを上書き（`core` または `custom`） |

`--profile custom` を指定すると、グローバル設定（`openspec config profile`）で現在選ばれているワークフロー群を使います。

**対応ツール ID (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `opencode`, `pi`, `qoder`, `lingma`, `qwen`, `roocode`, `trae`, `windsurf`

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

# 今回だけ core プロファイルで初期化
openspec init --profile core

# プロンプトをスキップし、旧ファイルを自動クリーンアップ
openspec init --force
```

**作成されるもの:**

```
openspec/
├── specs/              # 仕様（信頼できる基準）
├── changes/            # 変更提案
└── config.yaml         # プロジェクト設定

.claude/skills/         # Claude Code のスキルファイル（claude 選択時）
.cursor/skills/         # Cursor のスキルファイル（cursor 選択時）
.cursor/commands/       # Cursor の OPSX コマンド（commands 配信時）
...                     # 他ツールの設定
```

---

### `openspec update`

CLI を更新した後に指示ファイルを更新します。現在のグローバルプロファイル、選択済みワークフロー、`delivery` 設定に基づいて AI ツールの設定ファイルを再生成します。

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
npm update @ayumuwall/openspec
openspec update
```

---

## ワークスペースコマンド

ワークスペースコマンドは beta です。現在はローカルビュー方式を採用していますが、外部自動化・連携・長期運用のワークフローでは、コマンドの挙動、状態ファイル、JSON 出力がまだ変わり得るものとして扱ってください。

調整用ワークスペースは、リンク済みリポジトリやフォルダをまとめて見るための、このマシン上だけの作業ビューです。ワークスペースで見えることは変更へのコミットを意味しません。OpenSpec に把握させたいリポジトリやフォルダをリンクし、具体的な作業計画を立てる準備ができたら変更を作成します。

### `openspec workspace setup`

標準の OpenSpec ワークスペース場所にワークスペースを作成し、既存のリポジトリまたはフォルダを少なくとも 1 つリンクします。

```bash
openspec workspace setup [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--name <name>` | ワークスペース名。名前は kebab-case |
| `--link <path>` | 既存のリポジトリまたはフォルダをリンクし、フォルダ名からリンク名を推定 |
| `--link <name>=<path>` | 明示的なリンク名で既存のリポジトリまたはフォルダをリンク |
| `--opener <id>` | 非対話セットアップ時にデフォルトの開き方を保存。`codex-cli`, `claude`, `github-copilot`, `editor` |
| `--tools <tools>` | エージェント向けにワークスペース内の OpenSpec スキルをインストール。`all`, `none`, カンマ区切りのツール ID を指定 |
| `--no-interactive` | プロンプトを無効化。`--name` と 1 つ以上の `--link` が必要 |
| `--json` | JSON を出力。`--no-interactive` が必要 |

**例:**

```bash
openspec workspace setup
openspec workspace setup --no-interactive --name platform --link /repos/api --link web=/repos/web
openspec workspace setup --no-interactive --name platform --link /repos/api --opener codex-cli
openspec workspace setup --no-interactive --name platform --link /repos/api --tools codex,claude
openspec workspace setup --no-interactive --json --name checkout --link /repos/platform/apps/checkout
```

対話セットアップではデフォルトの開き方を確認し、選択したエージェント向けにワークスペース内の OpenSpec スキルをインストールできます。非対話セットアップでは `--opener` を指定した場合だけデフォルトの開き方を保存します。指定しない場合、対応する開き方が利用できる対話端末では後から `workspace open` が確認し、スクリプトには `--agent <tool>` または `--editor` の指定を求めます。

この beta 範囲におけるワークスペーススキルのインストールは skills-only です。グローバルの delivery が `commands` または `both` でも、workspace setup はワークスペースルートにエージェントスキルフォルダを書き込むだけで、スラッシュコマンドファイルは作成しません。有効なグローバル profile がインストール対象のワークフロースキルを選び、`--tools` が配布先エージェントを選びます。非対話セットアップで `--tools` を省略するとスキルはインストールされず、後から `workspace update --tools <ids>` で追加できます。

### `openspec workspace list`

ローカルレジストリにある既知の OpenSpec ワークスペースを一覧表示します。

```bash
openspec workspace list [--json]
openspec workspace ls [--json]
```

一覧には各ワークスペースの場所とリンク済みリポジトリまたはフォルダが表示されます。古いレジストリレコードは報告されますが、自動では修正されません。

### `openspec workspace link`

1 つのワークスペースに既存のリポジトリまたはフォルダを記録します。

```bash
openspec workspace link [name] <path> [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--workspace <name>` | ローカルレジストリから既知のワークスペースを選択 |
| `--json` | JSON を出力 |
| `--no-interactive` | ワークスペース選択プロンプトを無効化 |

**例:**

```bash
openspec workspace link /repos/api
openspec workspace link api-service /repos/api
openspec workspace link --workspace platform /repos/platform/apps/checkout
```

パスは事前に存在している必要があります。相対パスはコマンド実行時の現在ディレクトリを基準に解決され、検証済みの絶対パスとしてこのマシン上のワークスペース状態に保存されます。リンク先はリポジトリ全体、パッケージ、サービス、アプリ、またはリポジトリ内の `openspec/` 状態を持たないフォルダでもかまいません。

### `openspec workspace relink`

既存リンクのローカルパスを修復または変更します。

```bash
openspec workspace relink <name> <path> [options]
```

パスは事前に存在している必要があります。relink は安定したリンク名に対応するマシンローカルパスだけを更新します。

### `openspec workspace doctor`

現在のマシンで 1 つのワークスペースが何を解決できるか確認します。

```bash
openspec workspace doctor [options]
```

doctor はワークスペースの場所、リンク済みリポジトリまたはフォルダ、欠落パス、存在する場合はリポジトリ内 specs パス、推奨修正を表示します。互換性のため、JSON 出力には workspace planning パスも含まれます。問題を報告するだけで、自動修復はしません。

ワークスペースを 1 つ必要とするコマンドは、ワークスペースフォルダまたはそのサブディレクトリ内で実行された場合、現在のワークスペースを使います。それ以外の場所では `--workspace <name>` を渡すか、対話端末の選択画面で選ぶか、既知のワークスペースが 1 つだけならそれを使います。`--json` または `--no-interactive` モードで選択が曖昧な場合は、構造化された status エラーで失敗し、`--workspace <name>` を提案します。

JSON レスポンスは型付きオブジェクトと `status` 配列を使います。主要データは `workspace`, `workspaces`, `link` に入り、警告とエラーは `status` に入ります。

### `openspec workspace update`

ワークスペース内の OpenSpec ガイダンスとエージェントスキルを更新します。

```bash
openspec workspace update [name] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--workspace <name>` | ローカルレジストリから既知のワークスペースを選択 |
| `--tools <tools>` | ワークスペーススキルの対象エージェントを選択。`all`, `none`, カンマ区切りのツール ID を指定 |
| `--json` | JSON を出力 |
| `--no-interactive` | ワークスペース選択プロンプトを無効化 |

**例:**

```bash
openspec workspace update
openspec workspace update platform
openspec workspace update --workspace platform --tools codex,claude
openspec workspace update --workspace platform --tools none
```

`workspace update` は生成済みのワークスペースガイダンスブロックと、ワークスペースを開くためのローカルファイルを更新します。エージェントスキルについては、`--tools` を省略すると保存済みのワークスペーススキル対象エージェントを再利用します。`--tools` を渡すと保存済み選択が置き換わります。ワークスペースルート内の OpenSpec 管理ワークフロースキルディレクトリだけを更新し、選択解除された管理対象ワークフロースキルを削除します。リンク済みリポジトリやフォルダには触れません。

ワークスペース内で `openspec update` を実行しても、ワークスペース内のファイルは更新されません。ワークスペース内のガイダンスとスキルを更新したい場合は `openspec workspace update` を使い、リポジトリ側のツールファイルを更新したい場合は対象リポジトリ内で `openspec update` を実行してください。

### `openspec workspace open`

保存済みの開き方、1 セッションだけのエージェント上書き、または VS Code エディタモードで、ワークスペースの作業セットを開きます。

```bash
openspec workspace open [name] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--workspace <name>` | 位置引数のワークスペース名のエイリアス |
| `--initiative <id>` | initiative をローカルワークスペースビューとして開く。`<id>` または `<store>/<id>` を指定 |
| `--store <id>` | `--initiative` 用の登録済み context store ID |
| `--store-path <path>` | `--initiative` 用の既存ローカル context store ルート |
| `--agent <tool>` | この 1 セッションだけ、使うエージェントを上書き。`codex-cli`, `claude`, `github-copilot` |
| `--editor` | 管理対象の VS Code workspace ファイルを通常のエディタワークスペースとして開く |
| `--no-interactive` | ワークスペースと開き方の選択プロンプトを無効化 |

**例:**

```bash
openspec workspace open
openspec workspace open platform
openspec workspace open platform --agent github-copilot
openspec workspace open --agent codex-cli
openspec workspace open --editor
openspec workspace open --initiative billing-launch --store platform
openspec workspace open --initiative platform/billing-launch
```

`workspace open` はワークスペース内で実行された場合は現在のワークスペースを使い、それ以外の場所で既知のワークスペースが 1 つだけなら自動選択し、複数ある場合は選択を求めます。`--agent` と `--editor` は保存済みの開き方を変更しません。両方の上書きを同時に渡すとエラーです。`--agent <tool>` または `--editor` のどちらかを選んでください。

`--initiative` を使うと、OpenSpec はその initiative 用のプライベートなローカルワークスペースビューを準備または選択します。レジストリから選んだ store は ID で保存されます。ワークスペースビューはプライベートなローカル状態なので、`--store-path` は実行時ローカルのパス選択子を保存します。

OpenSpec は VS Code エディタと GitHub Copilot-in-VS-Code で開くため、ワークスペースルートに `<workspace-name>.code-workspace` を維持します。このファイルはこのマシン上だけのワークスペース状態です。

管理対象の VS Code workspace には、有効なリンク済みリポジトリまたはフォルダ、紐づく initiative のコンテキスト、OpenSpec ワークスペースファイルがこの順で入ります。VS Code はそれらをマルチルートワークスペースとして表示します。

ワークスペースを開くと、調査と文脈把握のためにリンク済みリポジトリやフォルダが見えるようになります。実装編集は、明示的なユーザー依頼と通常の OpenSpec 実装ワークフローの後に開始してください。

---

## 共有コンテキストコマンド

context store と initiative は beta の調整用機能です。context store は永続的な共有コンテキストを、このマシン上のフォルダとして登録する仕組みです。通常は Git 管理されたフォルダ、または既存リポジトリを clone したフォルダを使います。initiative は context store 内の共有調整コンテキストで、リポジトリ内の変更は共有計画を各リポジトリへコピーせずに initiative へリンクできます。

### `openspec context-store setup`

ローカルの context store を作成して登録します。ターミナルで引数なしに実行すると、OpenSpec がセットアップを案内します。エージェントやスクリプトは明示的な入力を渡し、`--json` を使ってください。

```bash
openspec context-store setup [id] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--path <path>` | context store として使うフォルダパス。デフォルトは OpenSpec の管理対象ローカルデータディレクトリ |
| `--init-git` | context store 内に Git リポジトリを初期化 |
| `--no-init-git` | Git リポジトリを初期化しない |
| `--json` | JSON を出力 |

`--path` を省略すると、setup は `getGlobalDataDir()/context-stores/<id>` 配下に context store を作成します。`XDG_DATA_HOME` が設定されている場合は `$XDG_DATA_HOME/openspec/context-stores/<id>`、Unix 系のフォールバックでは `~/.local/share/openspec/context-stores/<id>` です。既に clone 済みのフォルダやチーム用フォルダを使いたい場合は `--path` を渡してください。

例:

```bash
openspec context-store setup
openspec context-store setup team-context
openspec context-store setup team-context --path /repos/team-context --no-init-git
openspec context-store setup team-context --json --no-init-git
```

### `openspec context-store register`

既存のローカル context store フォルダを登録します。

```bash
openspec context-store register [path] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--id <id>` | context store ID。デフォルトはメタデータまたはフォルダ名 |
| `--json` | JSON を出力 |

### `openspec context-store unregister`

ファイルを削除せず、ローカルの context-store 登録だけを解除します。

```bash
openspec context-store unregister <id> [--json]
```

context store を移動した、別の場所へ clone し直した、またはこのマシン上の OpenSpec に表示させたくない場合に使います。

### `openspec context-store remove`

ローカルの context-store 登録を解除し、そのフォルダも削除します。

```bash
openspec context-store remove <id> [--yes] [--json]
```

`remove` は対話端末では削除前に正確なフォルダを表示します。エージェント、スクリプト、JSON 呼び出し元は削除確認として `--yes` を渡す必要があります。OpenSpec は、一致する context-store メタデータを含まないフォルダの削除を拒否します。

### `openspec context-store list`

ローカル登録済みの context store を一覧表示します。

```bash
openspec context-store list [--json]
openspec context-store ls [--json]
```

### `openspec context-store doctor`

ローカルの context-store 登録、メタデータ、Git の有無を確認します。

```bash
openspec context-store doctor [id] [--json]
```

doctor は診断専用です。context store を変更せず、欠落したルート、メタデータ不一致、不正なローカルレジストリ状態を報告します。

### `openspec initiative create`

context store 内に initiative を作成します。

```bash
openspec initiative create <id> --title <title> --summary <summary> [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--store <id>` | ローカルレジストリ上の context store ID |
| `--store-path <path>` | 既存のローカル context store ルート |
| `--title <title>` | initiative のタイトル |
| `--summary <summary>` | initiative の概要 |
| `--json` | JSON を出力 |

### `openspec initiative list`

initiative を一覧表示します。セレクタを指定しない場合、登録済みの context store をすべて検索し、一部を読み取れなかった場合は `status` で警告します。

```bash
openspec initiative list [options]
openspec initiative ls [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--store <id>` | 登録済み context store 1 つだけを対象にする |
| `--store-path <path>` | 既存のローカル context store ルート 1 つだけを対象にする |
| `--json` | JSON を出力 |

### `openspec initiative show`

initiative を解決し、正規の場所を表示します。

```bash
openspec initiative show <id> [options]
openspec initiative show <store>/<id> [options]
```

`--store` を指定しない場合、OpenSpec は登録済み context store を検索します。同じ initiative ID が複数の context store に存在する場合は、`--store <id>` を渡すか `<store>/<id>` 形式を使ってください。

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
アクティブな変更:
  add-dark-mode     UI テーマ切り替え機能
  fix-login-bug     セッションタイムアウト処理
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
add-dark-mode を検証中...
  ✓ proposal.md 有効
  ✓ specs/ui/spec.md 有効
  ⚠ design.md: 「Technical Approach」セクションがありません

警告 1 件
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
        "warnings": ["design.md: 「Technical Approach」セクションがありません"]
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

### `openspec new change`

リポジトリ内の変更ディレクトリと、必要に応じてコミット対象のメタデータを作成します。

```bash
openspec new change <name> [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--description <text>` | `README.md` に追加する説明 |
| `--goal <text>` | change に保存する workspace のプロダクト目標 |
| `--areas <names>` | 影響を受ける workspace link 名のカンマ区切り |
| `--initiative <id>` | リポジトリ内の change を initiative にリンク |
| `--store <id>` | `--initiative` で使う context store ID |
| `--store-path <path>` | `--initiative` で使う既存のローカル context store ルート |
| `--schema <name>` | 使用する workflow schema |
| `--json` | JSON で出力 |

例:

```bash
openspec new change add-billing-api --initiative billing-launch --store platform
openspec new change add-billing-api --initiative platform/billing-launch --json
```

### `openspec set change`

change を作り直さずに、コミット対象のリポジトリ内 change メタデータを更新します。

```bash
openspec set change <name> [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--initiative <id>` | リポジトリ内の change を initiative にリンク |
| `--store <id>` | `--initiative` で使う context store ID |
| `--store-path <path>` | `--initiative` で使う既存のローカル context store ルート |
| `--json` | JSON で出力 |

`set change --initiative` は、指定したリンクが既に存在する場合は冪等に動作し、別の既存 initiative link の置き換えは拒否します。

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
変更: add-dark-mode
スキーマ: spec-driven
進捗: 2/4 アーティファクト完了

[x] proposal
[ ] design
[x] specs
[-] tasks (blocked by: design)
```

**出力（JSON）:**

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "spec-driven",
  "isComplete": false,
  "applyRequires": ["tasks"],
  "artifacts": [
    {"id": "proposal", "outputPath": "proposal.md", "status": "done"},
    {"id": "design", "outputPath": "design.md", "status": "ready"},
    {"id": "specs", "outputPath": "specs/**/*.md", "status": "done"},
    {"id": "tasks", "outputPath": "tasks.md", "status": "blocked", "missingDeps": ["design"]}
  ]
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
スキーマ: spec-driven

テンプレート:
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
利用可能なスキーマ:

  spec-driven (package)
    デフォルトの仕様駆動開発ワークフロー
    フロー: proposal → specs → design → tasks

  my-custom (project)
    このプロジェクト用のカスタムワークフロー
    フロー: research → proposal → tasks
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
  --description "高速に反復するワークフロー" \
  --artifacts "proposal,tasks" \
  --default
```

**作成されるもの:**

```
openspec/schemas/<name>/
├── schema.yaml           # スキーマ定義
└── templates/
    ├── proposal.md       # 各アーティファクトの
    ├── specs.md          # テンプレート
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
spec-driven の解決元: package
  ソース: /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven
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
| `profile [preset]` | ワークフロープロファイルを対話的またはプリセットで設定 |

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
openspec config set user.name "自分の名前" --string

# カスタム設定を削除
openspec config unset user.name

# すべての設定をリセット
openspec config reset --all --yes

# エディタで設定を開く
openspec config edit

# ウィザードでプロファイルを設定
openspec config profile

# すばやく core へ切り替え（`delivery` は維持）
openspec config profile core
```

`openspec config profile` は現在の状態サマリーから始まり、以下を選択できます。
- デリバリー + ワークフローを変更
- デリバリーのみ変更
- ワークフローのみ変更
- 現在の設定を維持（終了）

現在の設定を維持した場合、変更は書き込まれず更新プロンプトも表示されません。
設定変更はないが、現在のプロジェクトまたはワークスペースファイルがグローバル profile / delivery と同期していない場合、OpenSpec は警告を表示します。リポジトリ内プロジェクトでは `openspec update`、ワークスペース内のガイダンスとスキルでは `openspec workspace update` を提案します。
`Ctrl+C` を押しても処理をきれいにキャンセルでき（スタックトレースなし）、コード `130` で終了します。
ワークフローチェックリストで `[x]` はグローバル設定でワークフローが選択済みであることを意味します。プロジェクトファイルに反映するには `openspec update` を実行してください（プロジェクト内で `Apply changes to this project now?` と表示された場合は適用を選択）。ワークスペース内では `openspec workspace update` を使い、ワークスペース内のガイダンスとスキルを更新します。この更新は生成されるエージェントワークフローファイルについては skills-only のままで、ワークスペース用スラッシュコマンドは生成しません。

**対話例:**

```bash
# デリバリーのみ更新
openspec config profile
# 選択: デリバリーのみ変更
# デリバリーを選択: Skills のみ

# ワークフローのみ更新
openspec config profile
# 選択: ワークフローのみ変更
# チェックリストでワークフローを切り替えて確認
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
openspec feedback "独自アーティファクト型のサポートを追加してほしい" \
  --body "組み込み以外の独自アーティファクト型を定義できるようにしたいです。"
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

# 手動インストール用にスクリプトを生成
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
| `OPENSPEC_TELEMETRY` | `0` に設定するとテレメトリを無効化 |
| `DO_NOT_TRACK` | `1` に設定するとテレメトリを無効化（標準 DNT シグナル） |
| `OPENSPEC_CONCURRENCY` | 一括検証のデフォルト並列数（デフォルト: 6） |
| `EDITOR` または `VISUAL` | `openspec config edit` のエディタ指定 |
| `NO_COLOR` | 設定時に色付き出力を無効化 |

---

## 関連ドキュメント

- [コマンド](commands.md) - AI スラッシュコマンド（`/opsx:propose`, `/opsx:apply` など）
- [ワークフロー](workflows.md) - 代表的なフローと使い分け
- [カスタマイズ](customization.md) - カスタムスキーマとテンプレート
- [はじめに](getting-started.md) - 初回セットアップガイド
