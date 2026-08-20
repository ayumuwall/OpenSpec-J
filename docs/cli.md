# CLI リファレンス

OpenSpec CLI（`openspec`）は、プロジェクトのセットアップ、検証、ステータス確認、管理のためのターミナルコマンドを提供します。これらのコマンドは、[コマンド](commands.md) に記載された `/opsx:propose` などの AI スラッシュコマンドを補完します。

## 概要

| カテゴリ | コマンド | 目的 |
|----------|----------|---------|
| **セットアップ** | `init`, `update` | プロジェクトの OpenSpec 初期化・更新 |
| **ストア（独立した OpenSpec リポジトリ）** | `store setup`, `store register`, `store unregister`, `store remove`, `store list`, `store doctor` | 登録済みの独立 OpenSpec リポジトリを管理 |
| **ヘルスチェック** | `doctor` | 解決されたルートと参照関係の状態を報告 |
| **作業コンテキスト** | `context` | 作業セット（ルート + 参照ストア）を組み立てる |
| **個人用ワークセット** | `workset create`, `workset list`, `workset open`, `workset remove` | 個人用・ローカルの作業ビューを保存し、ツールで開く |
| **閲覧** | `list`, `view`, `show` | 変更と仕様を確認 |
| **検証** | `validate` | 変更と仕様の問題をチェック |
| **ライフサイクル** | `archive` | 完了した変更を確定 |
| **ワークフロー** | `new change`, `status`, `instructions`, `templates`, `schemas` | アーティファクト主導ワークフローを支援 |
| **スキーマ** | `schema init`, `schema fork`, `schema validate`, `schema which` | カスタムワークフローの作成と管理 |
| **設定** | `config` | 設定の閲覧と変更 |
| **ユーティリティ** | `feedback`, `completion` | フィードバック送信とシェル連携 |

---

## 人向けコマンドとエージェント向けコマンド

多くの CLI コマンドは **人がターミナルで使うこと** を想定しています。一部のコマンドは **AI エージェント/スクリプト向け** に JSON 出力を提供します。

### 人向け専用コマンド

これらは対話的で、ターミナル操作向けです。

| コマンド | 目的 |
|---------|---------|
| `openspec init` | プロジェクト初期化（対話プロンプト） |
| `openspec view` | 対話型ダッシュボード |
| `openspec workset open <name>` | 保存済みワークセットを開く（エディターウィンドウまたはターミナルエージェントセッション） |
| `openspec config edit` | エディタで設定を開く |
| `openspec feedback` | GitHub へフィードバック送信 |
| `openspec completion install` | シェル補完のインストール |

### エージェント対応コマンド

これらは `--json` に対応し、AI エージェントやスクリプトから利用できます。

| コマンド | 人向け用途 | エージェント用途 |
|---------|-----------|-----------|
| `openspec list` | 変更/仕様の一覧 | `--json` で構造化データ |
| `openspec show <item>` | 内容の閲覧 | `--json` で解析用データ |
| `openspec validate` | 問題の検出 | `--all --json` で一括検証 |
| `openspec status` | 進捗の確認 | `--json` で状態を取得 |
| `openspec instructions` | 次の手順 | `--json` で指示を取得 |
| `openspec templates` | テンプレート参照 | `--json` でパス解決 |
| `openspec schemas` | 利用可能なスキーマを一覧表示 | `--json` でスキーマを検出。`--store <id>` で登録済みルートを選択 |
| `openspec store setup <id>` | ローカルストアを作成して登録 | 明示的な入力と `--json` で構造化されたセットアップ結果 |
| `openspec store register <path>` | 既存ストアを登録 | `--json` で構造化された登録結果 |
| `openspec store unregister <id>` | ローカルストア登録を解除 | `--json` で構造化された解除結果 |
| `openspec store remove <id>` | 登録済みローカルストアのフォルダーを削除 | `--yes --json` で非対話削除 |
| `openspec store list` | 登録済みストアを表示 | `--json` で構造化された登録一覧 |
| `openspec store doctor` | ローカルストア設定を確認 | `--json` で構造化された診断結果 |
| `openspec new change <id>` | リポジトリローカルの変更ひな形を作成 | `--json`。登録済みストアを OpenSpec ルートとして使う場合は `--store <id>` も指定 |
| `openspec workset create [name]` | 個人用の作業ビューを構成 | `--member <path> --json` で非対話作成 |
| `openspec workset list` | 保存済みワークセットを表示 | `--json` で構造化されたビュー |
| `openspec workset remove <name>` | 保存済みビューを削除 | `--yes --json` で非対話削除 |

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

既定ではグローバル設定の初期値が使われ、`profile=core`、`delivery=both`、`workflows=propose, explore, apply, update, sync, archive` で動作します。

```
openspec init [path] [options]
```

新規プロジェクトでは `--language <language>` を指定すると、言語に関する指示を `openspec/config.yaml` に追加できます。既存プロジェクトでは、プロジェクト固有の指示をOpenSpecが上書きしないよう、設定の `context` フィールドを直接編集してください。

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `path` | いいえ | 対象ディレクトリ（デフォルト: 現在のディレクトリ） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--tools <list>` | 対話なしで AI ツールを設定。`all`, `none` またはカンマ区切りの一覧 |
| `--language <language>` | 新しい設定を作成するときに、アーティファクトの記述言語を指定 |
| `--force` | 旧ファイルを確認なしで自動クリーンアップ |
| `--profile <profile>` | 今回の `init` 実行に限ってプロファイルを上書き（`core` または `custom`） |
| `--no-animation` | アニメーションの代わりに静的なウェルカム画面を表示 |
| `--copilot-cloud` | GitHub Copilot の[クラウドコーディングエージェントファイル](supported-tools.md#github-copilot-cloud-coding-agent)を確認なしでセットアップ |
| `--no-copilot-cloud` | GitHub Copilot のクラウドコーディングエージェントファイルを確認なしでスキップ |

`--profile custom` を指定すると、グローバル設定（`openspec config profile`）で現在選ばれているワークフロー群を使います。

ウェルカムアニメーションは、`OPENSPEC_NO_ANIMATION` 環境変数が設定されている場合（空値を含む）、`NO_COLOR` に空でない値が設定されている場合、またはOSで視差効果を減らす設定が有効な場合（macOSの「視差効果を減らす」、GNOMEのアニメーション無効化）にも省略されます。

**対応ツール ID（`--tools`）** — `windsurf` は `devin` の別名としても受け付けます: `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `command-code`, `codeartsagent`, `codex`, `devin`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `hermes`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `minimax-code`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `zed`, `zcode`, `agents`

> この一覧は `src/core/config.ts` の `AI_TOOLS` と対応しています。各ツールのスキルパスとコマンドパスは [サポートされているツール](supported-tools.md) を参照してください。

**例:**

```bash
# 対話的に初期化
openspec init

# 特定ディレクトリで初期化
openspec init ./my-project

# 非対話: Claude と Cursor を設定
openspec init --tools claude,cursor

# 非対話: グローバル MiniMax Code スキルを設定
openspec init --tools minimax-code

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
.agents/skills/         # AGENTS.md 対応ツールの共有スキル（agents 選択時）
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
npm install -g @ayumuwall/openspec@latest
openspec update
```

先にパッケージをアップグレードしてください。指示ファイルはインストール済みの CLI で生成されるため、古いインストールに対して `openspec update` を実行しても、より新しいリリースが提供するワークフローを追加せず、すべて最新と報告します。

この状況を分かるようにするため、`openspec update` は npm レジストリに新しい CLI が公開されているか問い合わせます。使用中の CLI が古い場合は、アップグレードを提案します。

```text
より新しい OpenSpec CLI が利用できます（v1.6.0 → v1.7.0）。
  実行元: /usr/local/lib/node_modules/@ayumuwall/openspec
? 今すぐ v1.7.0 へアップグレードしますか？ (Y/n)
```

yes と答えると `npm install -g @ayumuwall/openspec@latest` を実行し、新しい CLI でもう一度 update を実行するため、新しいワークフローも同じコマンドで反映されます。npm の終了コードだけを信用せず、インストール済みバイナリー自身にバージョンを問い合わせてアップグレードを確認します。`PATH` の前方に別の古いインストールが残っている場合は、成功と誤って表示せずにその旨を知らせます。no と答えるとコマンドを表示し、現在の CLI で更新します。Ctrl-C で中止します。

提案が表示されるのは、対話端末かつ npm がインストールを管理している場合だけです。これは `npm install -g` で実際に修正できる唯一のケースです。それ以外では、インストール方法に対応するコマンドを表示します。

| OpenSpec のインストール方法 | 表示・実行される内容 |
|---------------------------|--------------|
| グローバル npm インストール | 対話端末では確認とアップグレードを実行します。パイプ出力では代わりにコマンドを表示します。 |
| グローバル pnpm、bun、yarn、volta インストール | そのマネージャー固有のコマンド: `pnpm add -g …@latest`、`bun add -g …@latest`、`yarn global add …@latest`、`volta install …@latest` |
| プロジェクトの依存関係 | ロックファイルを管理するパッケージマネージャーで依存関係を更新するよう案内します。 |
| `npx` / `dlx` キャッシュ | `npx @ayumuwall/openspec@latest update`。このコマンド自体が更新なので、次の手順はありません。 |
| Git clone | 何もしません。使用中のバージョンはブランチの内容です。 |

何かを表示する場合は必ず、実行中の CLI を読み込んだディレクトリも示します。アップグレード済みなのに古い shim が `PATH` を優先しているときに確認してください。

npm が `npm_config_registry` を公開している場合はそのレジストリへ、そうでなければ `https://registry.npmjs.org` へ問い合わせます。`.npmrc` は読み取りません。ファイル内容で外部リクエスト先を決められるようにするのは避けるべきであり、プロジェクトの `.npmrc` はリポジトリとともに配布されるためです。プライベートミラーでは `npm_config_registry` を export するか、`OPENSPEC_NO_UPDATE_CHECK` を設定して検査を完全に省略してください。`CI` が明示的なオフ値（`false`、`0`、`no`、`off`、空）以外、`NODE_ENV=test`、または `OPENSPEC_NO_UPDATE_CHECK`（任意の値）、`DO_NOT_TRACK=1`、`OPENSPEC_TELEMETRY=0` が設定されているときは検査を行いません。検査は update 前に実行され、最大 1.5 秒だけ待ちます。ネットワークが黙ってパケットを落としてもそこで中断し、レジストリに到達できない場合は何も表示しません。

**「最新」の判定方法:** スキルファイルには生成時のバージョンが記録されるため、OpenSpec はインストール済み CLI と比較します。コマンドファイルにはバージョン情報がないため、スキルを持たない commands-only のツール（delivery が `commands`）では、現在生成される内容とファイル内容を比較します。編集による差異も drift とみなし、上書きします。delivery が `skills` または `both` の場合は記録済みバージョンだけを確認するため、手編集したファイルでもバージョンが一致すればそのまま残ります。書き直すには `--force` を使ってください。いずれの場合も生成ファイルは OpenSpec の管理対象です。独自の指示は別の場所に保管してください。

---

## ストア（独立した OpenSpec リポジトリ）

> **ベータ版。** ストアと、その上に構築される機能（参照、作業コンテキスト、ワークセット）は新しい機能です。コマンド名、フラグ、ファイル形式、JSON 出力の形はリリース間で変わる可能性があります。問題から順に理解するウォークスルーは [ストアガイド](stores-beta/user-guide.md) を参照してください。

ストアは、このマシンに登録した独立した OpenSpec リポジトリです。たとえば、計画リポジトリや契約リポジトリとして使えます。ストアを登録すると、通常のコマンド（`list`, `show`, `status`, `validate`, `new change`, `archive` など）に `--store <id>` を渡すだけで、どこからでもそのストアを対象に実行できます。

### `openspec store setup`

ローカルストアを作成して登録します。ターミナルで引数なしに実行すると、OpenSpec が対話的にセットアップを案内します。エージェントやスクリプトでは、明示的な入力を渡し、`--json` を使ってください。

```bash
openspec store setup [id] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--path <path>` | ストアを置くフォルダー（例: `~/openspec/<id>`） |
| `--remote <url>` | 新しいストアの `store.yaml` に正規の remote を記録 |
| `--init-git` | Git リポジトリを初期化し、初回コミットを作成（デフォルト） |
| `--no-init-git` | Git 操作をすべてスキップ（初期化も初回コミットもしない） |
| `--json` | JSON を出力 |

非対話実行（`--json`、スクリプト、エージェント）では、ストア ID と `--path` の両方を渡す必要があります。対話ターミナルでは、ユーザーが見える場所（例: `~/openspec/<id>`）を編集可能な候補として表示し、保存場所を尋ねます。OpenSpec の管理データディレクトリがデフォルトになることはありません。

例:

```bash
openspec store setup
openspec store setup team-context
openspec store setup team-context --path ~/openspec/team-context --no-init-git
openspec store setup team-context --path ~/openspec/team-context --no-init-git --json
```

### `openspec store register`

既存のローカルストアフォルダーを登録します。ストアのベータ期間中は、変更がまだ存在しない、仕様がまだ適用されていない、アーカイブ済み変更がまだない状態でもルートを登録できます。その場合、通常のコマンドが作成するまで `openspec/changes/`、`openspec/specs/`、`openspec/changes/archive/` が存在しないことがあります。`store: <id>` だけを宣言する設定専用リポジトリは、別ストアへのポインターのままであり、そのポインターを削除しない限りストアルートとして登録されません。

```bash
openspec store register [path] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--id <id>` | ストア ID。未指定時はストアメタデータまたはフォルダー名から決定 |
| `--yes` | 正常な OpenSpec ルートにストア識別メタデータを作成することを確認 |
| `--json` | JSON を出力 |

### `openspec store unregister`

ファイルを削除せず、ローカルストア登録だけを解除します。

```bash
openspec store unregister <id> [--json]
```

ストアを移動した、別の場所に clone し直した、このマシン上で OpenSpec に表示したくなくなった場合に使います。

### `openspec store remove`

ローカルストア登録を解除し、そのローカルフォルダーも削除します。

```bash
openspec store remove <id> [--yes] [--json]
```

`remove` は、対話ターミナルでは削除前に対象フォルダーを正確に表示します。エージェント、スクリプト、JSON 呼び出しでは、削除確認として `--yes` が必須です。対応するストアメタデータを含まないフォルダーは削除しません。

### `openspec store list`

ローカルに登録されたストアを一覧表示します。

```bash
openspec store list [--json]
openspec store ls [--json]
```

### `openspec store doctor`

ローカルストア登録、メタデータ、Git の有無を確認します。

```bash
openspec store doctor [id] [--json]
```

doctor は診断専用です。コンテキストやストアは変更せず、欠落したルート、メタデータ不一致、不正なローカルレジストリ状態を報告します。

### プロジェクトからストアを参照する

プロジェクトリポジトリは、作業がどのストアを参照するかを `openspec/config.yaml` で宣言できます。

```yaml
schema: spec-driven
references:
  - team-context
```

以後、そのリポジトリでの `openspec instructions` 出力（アーティファクト別と `apply` の両方、JSON と人向け表示の両方）には、各参照ストアの仕様インデックスが含まれます。インデックスには、仕様 ID、各仕様の Purpose セクションから取った 1 行概要、取得コマンド（`openspec show <spec-id> --type spec --store <id>`）が含まれます。インデックスは実行のたびに登録済みチェックアウトからその場で作られ、仕様本文が出力へコピーされることはありません。

参照は読み取り専用のコンテキストです。コマンドの実行先は変わりません。作業はリポジトリ自身のルートに残り、参照ストアへ書き込むには明示的に `--store` を指定する必要があります。解決できない参照（このマシンに未登録のストアなど）は、正確な修正方法付きの警告としてインデックスに載り、指示自体は生成されます。`openspec doctor` は参照の状態を 1 か所で報告します。

### ストアの clone 元を記録する

ストアは、コミットされる識別ファイルに正規の clone 元を記録できます。これにより、オンボーディングが「ストアを登録してください」で行き止まりになりません。

```bash
openspec store setup team-context --path ~/openspec/team-context \
  --remote git@github.com:acme/team-context.git
```

remote は初回コミット内の `.openspec-store/store.yaml` に保存されるため、以後の clone は取得元を最初から知っています。既存ストアの場合は、`store.yaml` を手で編集してコミットしてください。`store doctor` は記録された remote（およびチェックアウトから観測された Git origin）を表示します。setup/register の共有ガイダンスにも表示され、register はチェックアウトの origin をマシンローカルのレジストリに記録します。

参照宣言にも clone 元を含められます。まだストアを持っていないチームメイトには、そのまま貼り付けられる完全な修正コマンド（`git clone <remote> <path> && openspec store register <path> --id <id>`）が提示されます。

```yaml
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

remote の記録は同期ではありません。OpenSpec が勝手に clone、pull、push することはありません。

### デフォルトストアを宣言する

計画を完全に外部化したリポジトリ、つまりローカルに `openspec/specs/` や `openspec/changes/` を持たないリポジトリでは、毎回 `--store` を渡す代わりにストアを 1 回だけ宣言できます。

```yaml
# openspec/config.yaml (the only file under openspec/)
store: team-context
```

通常のコマンドは、自動的に宣言されたストアへ解決されます。ルートバナーと JSON の `root` ブロックには、ストア ID とともに `source: "declared"` が表示され、出力されるヒントには引き続き `--store <id>` が含まれます。この宣言はフォールバックであり、上書きではありません。明示的な `--store` が常に優先され、実際の計画フォルダーを持つディレクトリではポインターは無視されます（警告あり）。ポインターリポジトリをローカル OpenSpec ルートへ変換するには、`store:` 行を削除して `openspec init` を実行してください。宣言が残っている間、init はひな形作成を拒否します。

マシン上の全リポジトリに適用する形式として、`openspec config set defaultStore <id>` も利用できます（「設定」を参照）。これは `--store`、ローカルルート、プロジェクトポインターのいずれでも解決できない場合だけ使われ、ルートバナーとJSONの `root` ブロックには `source: "global_default"` と表示されます。

## Doctor（関係性のヘルスチェック）

読み取り専用の確認を 1 か所で行います。OpenSpec ルートは正常か、参照しているストアはこのマシンで利用できるかを確認します。

```bash
openspec doctor [--store <id>] [--json]
```

レポートは、ルートの状態、storeメタデータの状態（記録されたremoteとcheckoutのoriginが異なる場合や、最後にfetchしたupstream追跡refよりcheckoutが遅れている場合の注記を含む）、参照の状態（未解決参照に対するclone修正案を含む、instructionsと同じ診断）を分けて表示します。正常性の指摘は深刻度に関係なく終了コード0で、エージェントは `status` 配列を読みます。終了コード1になるのは、ルートがない、未知のstoreなどのコマンド失敗だけです。Doctorはclone、sync、repairを行いません。状態ではなく組み立てられたセット自体を取得するには `openspec context` を使います。

## 作業コンテキスト（組み立てられたセット）

OpenSpec の宣言を通じて、この作業に関係するものを 1 つの作業セットとしてまとめます。対象は OpenSpec ルートと、それが参照するストアです。

```bash
openspec context [--store <id>] [--json] [--code-workspace <path> [--force]]
```

JSON 概要はエージェントが利用できる形式です。利用可能な参照ストアには取得方法が含まれ、未解決メンバーには instructions や doctor と同じ修正手順が含まれます。`--code-workspace` を指定すると、ルートと利用可能な参照ストア（`ref:<id>` フォルダー）を含む VS Code ワークスペースファイルも書き出します。このコマンドが行う書き込みはそれだけです。ファイルが既に存在する場合は、`--force` なしでは拒否されます。利用できないメンバーは報告され、推測で補われることはありません。

「作業コンテキスト」は組み立てられたセットのことです。一方、`openspec/config.yaml` の `context:` フィールドは instructions に注入されるプロジェクト背景情報です。この 2 つは別物です。`openspec doctor` はセットが正常かを答え、`openspec context` はセットの中身を答えます。

## 個人用ワークセット

> **ベータ版。** ワークセットは新しいベータ機能の一部です。コマンド、フラグ、ファイル形式はリリース間で変わる可能性があります。ウォークスルーは [ストアガイド](stores-beta/user-guide.md#ワークセット-一緒に使うフォルダーを開き直す) を参照してください。

ワークセットは、一緒に作業するフォルダーをまとめた個人用の名前付きビューです。計画ルートに加え、自分で選んだ任意のフォルダーを含められます。あなたのマシン上に保存され、名前を指定してツールで開き直せます。完全にローカルな状態であり、コミットされず、共有されず、宣言から自動生成されず、削除してもメンバーフォルダーには触れません。

```bash
openspec workset create [name] [--member <path> | --member <name>=<path>]... [--tool <id>] [--json]
openspec workset list [--json]
openspec workset open <name> [--tool <id>]
openspec workset remove <name> [--yes] [--json]
```

`create` は短いガイド付きフローを実行します（または `--member` フラグで非対話的に指定できます。最初のメンバーが primary で、セッションはそこで開始されます）。`open` は選択したツールを起動します。エディター（VS Code、Cursor）は全メンバーを含むウィンドウを開いて戻ります。CLI エージェント（Claude Code、codex）は、全メンバーを添付したセッションとしてこのターミナルを引き継ぎ、事前入力プロンプトなしで開始し、終了すると戻ります。open 時に存在しないメンバーフォルダーは注記付きでスキップされ、残りは開かれます。保存済みのツール設定は、open ごとに `--tool` で上書きできます。

新しいツールへの対応はコードではなく設定です。各ツールは 2 つの起動方式のどちらかです。`workspace-file`（生成された `.code-workspace` で起動）または `attach-dirs`（メンバーごとに attach フラグを渡す）です。グローバル `config.json` の `openers` キー（`openspec config edit` で開けます）で、ツールを追加したり組み込み設定をフィールド単位で調整したりできます。

```json
{
  "openers": {
    "zed": { "style": "workspace-file" },
    "claude": { "attach_flag": "--dir" }
  }
}
```

ワークセットの状態はすべて、グローバルデータディレクトリ内の `worksets/` フォルダーに保存されます（保存済みビューと、open ごとに再生成される `<name>.code-workspace` ファイル）。このフォルダーを削除すると、ワークセットの痕跡はすべて消えます。

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
Changes:
  add-dark-mode     No tasks      just now
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

変更と仕様の構造上の問題を検証し、変更の MODIFIED 要件を、それが置き換える本仕様と照合します。

```
openspec validate [item-name] [options]
```

仕様差分が0件の変更は、純粋なリファクタリング、ツール、文書作業向けに `.openspec.yaml` で `skip_specs: true` を宣言していない限り検証に失敗します（[レシピ5](examples.md#recipe-5-a-refactor-with-no-behavior-change)を参照）。

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
| `--archived` | アーカイブ済み変更の全タスクが完了しているか検証（pre-commit lint 向け） |
| `--type <type>` | 名称が曖昧な場合に `change` / `spec` を指定 |
| `--strict` | 厳密検証モードを有効化 |
| `--json` | JSON で出力 |
| `--concurrency <n>` | 並列検証の上限（デフォルト: 6、`OPENSPEC_CONCURRENCY` 環境変数でも指定可） |
| `--no-interactive` | プロンプトを無効化 |

`--archived` は独立した対象範囲です。仕様差分はアーカイブ時にすでに適用されているため検証せず、`changes/archive/` 配下のすべての変更で `tasks.md` のチェックボックスが全て完了しているかを検証します。未チェックが1件でもあれば、終了コードは0以外になります。未完了のままアーカイブされた変更を検出でき、pre-commit hook に便利です。

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

# アーカイブ済み変更に未チェックのタスクがあれば失敗
openspec validate --archived
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
| `change-name` | いいえ | アーカイブする変更（省略時は選択を求める。プロンプトに応答できない場合は必須） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `-y, --yes` | 確認プロンプトをスキップ。AI エージェント、CI ジョブ、stdin を閉じた実行など、応答できない場合は必須 |
| `--skip-specs` | 1回のアーカイブで仕様更新をスキップ。恒久的に仕様差分がない変更は、代わりに `.openspec.yaml` で `skip_specs: true` を宣言します。この場合はフラグなしでアーカイブできます |
| `--no-validate` | 検証をスキップ（確認が必要）。capability の廃止も無効化します。validator の判定がない場合は何も廃止しません |

**例:**

```bash
# 対話的にアーカイブ（変更を選択してから確認）
openspec archive

# 特定の変更をアーカイブ
openspec archive add-dark-mode

# プロンプトなしでアーカイブ（エージェント、CI、スクリプト）
openspec archive add-dark-mode --yes

# 仕様に影響しないツール更新をアーカイブ
openspec archive update-ci-config --skip-specs
```

**動作内容:**

1. 変更を検証します（`--no-validate` を除く）
2. 確認を求めます（`--yes` を除く）
3. 本仕様を変更する前にアーカイブ先を確保します
4. アクティブな delta spec を検証し、`openspec/specs/` へマージします。変更が最後の要件を削除した capability は廃止され、その仕様ファイルを削除します。ただし、変更の `.openspec.yaml` で `schema:` と並べて `retire_capabilities: true` を宣言している場合に限ります
5. 変更フォルダーを `openspec/changes/archive/YYYY-MM-DD-<name>/` へ移動します
6. 完全なアーカイブを確保する前に仕様変更または最後の移動に失敗した場合は、仕様を復元し、変更をアクティブパスに残すか戻します
7. 検証済みのフォールバックコピーが完了してもステージ済みソースのクリーンアップに失敗した場合は、復旧のため完全なアーカイブとコミット済み仕様の状態を保持します

**端末がない場合:** AI エージェント、CI ジョブ、stdin を閉じた実行は手順2へ応答できません。そのため archive は何も変更せずに停止し、終了コード1で、渡した他のフラグを維持した再実行コマンド `openspec archive <name> --yes` を示します。往復を省くには、変更名と `--yes` を最初から渡してください。

---

## ワークフローコマンド

これらは OPSX のアーティファクト主導ワークフローを支援します。人が進捗を確認するときにも、エージェントが次の手順を判断するときにも有用です。

### `openspec new change`

解決された OpenSpec ルートに変更ディレクトリを作成し、必要に応じてコミット対象のメタデータも作成します。

```bash
openspec new change <name> [options]
```

変更名は小文字のkebab-caseにし、小文字、数字、単一のハイフンだけを使用します。スペース、アンダースコア、大文字、連続ハイフン、先頭・末尾のハイフンは使えません。数字から始められるため、`100-add-feature` や `00001-add-auth` のように順序や階層を示す接頭辞を付けられます。

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--description <text>` | `README.md` に追加する説明 |
| `--goal <text>` | 変更と一緒に保存する任意のゴールメタデータ |
| `--schema <name>` | 使用するワークフロースキーマ |
| `--store <id>` | OpenSpec ルートとして使うストア ID（ストアは登録済みの独立 OpenSpec リポジトリ） |
| `--json` | JSON を出力 |

例:

```bash
openspec new change add-billing-api
openspec new change add-billing-api --store team-context --json
```

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
[x] specs
[ ] design
[-] tasks (blocked by: design)
```

`skip_specs: true` を宣言した変更では、specsステージを `[~] specs (skipped: change declares skip_specs)` と表示し、進捗件数から除外します。

**出力（JSON）:**

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "spec-driven",
  "isPlanningComplete": false,
  "isComplete": false,
  "applyRequires": ["tasks"],
  "artifacts": [
    {"id": "proposal", "outputPath": "proposal.md", "status": "done", "requires": []},
    {"id": "specs", "outputPath": "specs/**/*.md", "status": "done", "requires": ["proposal"]},
    {"id": "design", "outputPath": "design.md", "status": "ready", "requires": ["proposal"]},
    {"id": "tasks", "outputPath": "tasks.md", "status": "blocked", "requires": ["specs", "design"], "missingDeps": ["design"]}
  ]
}
```

`isPlanningComplete` は、スキップされていないすべての計画アーティファクトが存在するかを示します。スキップ済みアーティファクトは作成せずに充足済みとして扱います。実装タスクが完了しているかは示しません。`isComplete` は同じ値を持つ互換性エイリアスとして維持されます。

アーティファクトは依存順に並び、依存先がそれを必要とするアーティファクトより後に現れることはありません。同時に作成可能になるアーティファクト（spec-driven の `specs` と `design` はどちらも `proposal` だけを必要とします）は、アルファベット順ではなくスキーマの宣言順を維持します。したがって、最初の `ready` 項目が次に作成するアーティファクトです。

---

### `openspec instructions`

アーティファクト作成やタスク実装のための拡張指示を取得します。AI エージェントが次に作るべきものを理解するために使用します。

```
openspec instructions [artifact] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `artifact` | いいえ | アーティファクトID、またはワークフロー入力面: `apply`, `archive` |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--change <id>` | 変更名（非対話モードでは必須） |
| `--schema <name>` | スキーマを上書き指定 |
| `--json` | JSON で出力 |

**特記事項:** `apply` はタスク実装用の指示を返します。`archive` は有効な変更について、現在の読み取り専用archive入力（`context` と `operationGuidance`）を返し、archiveや変更操作は行いません。

**例:**

```bash
# 次に作るべきアーティファクトの指示を取得
openspec instructions --change add-dark-mode

# 特定アーティファクトの指示を取得
openspec instructions design --change add-dark-mode

# 実装（apply）向けの指示を取得
openspec instructions apply --change add-dark-mode

# archiveせず現在のarchive操作入力を取得
openspec instructions archive --change add-dark-mode --json

# エージェント向けJSON
openspec instructions design --change add-dark-mode --json
```

**出力内容:**

- アーティファクト用テンプレートの内容
- 設定から読み込んだプロジェクトコンテキスト
- 依存アーティファクトの内容
- 設定のアーティファクト別ルール
- `apply` / `archive` 向けの現在のプロジェクトコンテキストと該当する操作ガイダンス

操作入力は呼び出しごとに、解決したリポジトリまたは選択したstoreから読み込みます。プロジェクトコンテキストは必須のプロンプト入力で、エージェントは関連する事実・規約・制約を適用します。操作ガイダンスは任意の追加助言で、組み込みワークフローと両立し、該当する項目だけに従います。どちらも明示的なユーザー選択、CLI管理の状態、組み込み指示、アーティファクトルールとは分離されます。コンテキストの競合は報告し、競合または該当しないガイダンスには従わず理由を説明します。これは生成エージェントの振る舞いに関する契約であり、CLIによる強制検査ではありません。`instructions archive` は選択した変更、任意入力、ルートメタデータだけを返し、静的archiveワークフローは含みません。

`skip_specs: true` でスキップされたアーティファクトについては警告だけを返し（JSONでは `skipped` / `warning` フィールドを追加）、アーティファクトを作成してはいけません。

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
| `--store <id>` | 登録済み store を OpenSpec ルートとして使う |

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

<a id="schema-commands"></a>

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
  Source: /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven
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

# 値を設定（匿名利用テレメトリーを無効化）
openspec config set telemetry.enabled false

# 文字列として明示的に設定
openspec config set user.name "自分の名前" --string

# カスタム設定を削除
openspec config unset user.name

# マシン共通のデフォルトstoreを設定
# （--store、ローカルルート、プロジェクトのstore:ポインターで解決できない場合のフォールバック）
openspec config set defaultStore team-plans

# すべての設定をリセット
openspec config reset --all --yes

# エディタで設定を開く
openspec config edit

# ウィザードでプロファイルを設定
openspec config profile

# すばやく core へ切り替え（`delivery` は維持）
openspec config profile core
```

**テレメトリーのオプトアウト:** `telemetry.enabled` は未設定時に有効になります（オプトアウト方式）。`false` を設定すると、匿名の利用統計と `openspec update` のバージョン確認を無効化できます。環境変数は設定より優先されます。`OPENSPEC_TELEMETRY=0`、`DO_NOT_TRACK=1`、真値の `CI`（例: `true`／`1`／`yes`）は、設定値にかかわらず常にテレメトリーを無効化します。

`openspec config profile` は現在の状態サマリーから始まり、以下を選択できます。
- デリバリー + ワークフローを変更
- デリバリーのみ変更
- ワークフローのみ変更
- 現在の設定を維持（終了）

現在の設定を維持した場合、変更は書き込まれず更新プロンプトも表示されません。
設定変更がなくても、現在のプロジェクトファイルがグローバルの profile/delivery とずれている場合、OpenSpec は警告を表示し、`openspec update` を提案します。
`Ctrl+C` を押しても処理をきれいにキャンセルでき（スタックトレースなし）、コード `130` で終了します。
ワークフローチェックリストの `[x]` は、そのワークフローがグローバル設定で選択されていることを意味します。その選択をプロジェクトファイルへ反映するには、`openspec update` を実行してください（またはプロジェクト内で確認されたときに `Apply changes to this project now?` を選びます）。

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
| `message` | はい | フィードバックの概要。長い文章はIssueタイトルでは短縮し、本文には完全な形で保持 |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--body <text>` | 概要の後に追加する詳細 |

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

補完は明示的に有効化する方式です。対話端末で初めてコマンドを実行したとき、CLIが標準エラーへ一度だけ案内を表示します。補完がすでにインストール済みの場合は表示しません。案内を完全に抑止するには `OPENSPEC_NO_COMPLETIONS=1` を設定します。

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
| `OPENSPEC_TELEMETRY` | `0` を設定するとテレメトリーと `openspec update` のバージョン確認を無効化（グローバル設定の `telemetry.enabled` を上書き） |
| `DO_NOT_TRACK` | `1` を設定するとテレメトリーと `openspec update` のバージョン確認を無効化（標準 DNT シグナル。設定を上書き） |
| `OPENSPEC_CONCURRENCY` | 一括検証のデフォルト並列数（デフォルト: 6） |
| `EDITOR` または `VISUAL` | `openspec config edit` のエディタ指定 |
| `NO_COLOR` | 設定時に色付き出力を無効化 |
| `OPENSPEC_NO_ANIMATION` | 設定時に `openspec init` のウェルカムアニメーションを無効化 |
| `OPENSPEC_NO_COMPLETIONS` | `1` を設定するとシェル補完の初回案内を抑止 |
| `OPENSPEC_NO_UPDATE_CHECK` | 設定時（空値を含む）に `openspec update` の新しい公開CLI確認を無効化。`CI` が有効（`false` / `0` / `no` / `off` 以外）または `NODE_ENV=test` の場合も省略 |
| `npm_config_registry` | `openspec update` のバージョン確認先。`http(s)` URLでなければ `https://registry.npmjs.org` を使用し、`.npmrc` は読み込まない |

---

## 関連ドキュメント

- [コマンド](commands.md) - AI スラッシュコマンド（`/opsx:propose`, `/opsx:apply` など）
- [ワークフロー](workflows.md) - 代表的なフローと使い分け
- [カスタマイズ](customization.md) - カスタムスキーマとテンプレート
- [はじめに](getting-started.md) - 初回セットアップガイド
