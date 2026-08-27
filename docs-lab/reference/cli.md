# CLI

> `openspec`のターミナルコマンド。

<!-- CLI 本体のインストール、更新、アンインストールは installation.md で扱う。 -->

## コマンド

**セットアップ**

| コマンド                              | 動作                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| [`openspec init`](#openspec-init)     | プロジェクトで OpenSpec を初期化します。               |
| [`openspec update`](#openspec-update) | インストール済みの OpenSpec 指示ファイルを更新します。 |
| [`openspec config`](#openspec-config) | グローバル設定を表示、変更します。                     |

**変更と仕様**

| コマンド                                  | 動作                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| [`openspec list`](#openspec-list)         | 変更を一覧表示します。`--specs`を付けると仕様を表示します。 |
| [`openspec show`](#openspec-show)         | 変更または仕様を Markdown か JSON で表示します。            |
| [`openspec view`](#openspec-view)         | 仕様と変更のダッシュボードを 1 画面で表示します。           |
| [`openspec validate`](#openspec-validate) | 変更と仕様の構造を検証します。                              |
| [`openspec archive`](#openspec-archive)   | 完了した変更をアーカイブへ移し、本仕様を更新します。        |

**ワークフローとスキーマ**

これらのコマンドの多くは、ワークフロー内でエージェントが実行します。

| コマンド                                          | 動作                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`openspec new`](#openspec-new)                   | 新しい変更ディレクトリを作成します。                                             |
| [`openspec status`](#openspec-status)             | 1 件またはすべての進行中の変更について、アーティファクトの完了状況を表示します。 |
| [`openspec instructions`](#openspec-instructions) | アーティファクトの作成、適用、アーカイブに使う指示を表示します。                 |
| [`openspec templates`](#openspec-templates)       | スキーマの各アーティファクトで使うテンプレートの解決済みパスを表示します。       |
| [`openspec schemas`](#openspec-schemas)           | 利用可能なワークフロースキーマを一覧表示します。                                 |
| [`openspec schema`](#openspec-schema)             | スキーマを調査、フォーク、作成します（実験的）。                                 |

**マルチリポジトリ（ベータ）**

| コマンド                                | 動作                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------- |
| [`openspec store`](#openspec-store)     | マシンに登録する独立した OpenSpec リポジトリ（ストア）を作成、管理します。 |
| [`openspec doctor`](#openspec-doctor)   | 解決済み OpenSpec ルートの関連状態を診断します。                           |
| [`openspec context`](#openspec-context) | 解決済み OpenSpec ルートの作業コンテキストを表示します。                   |
| [`openspec workset`](#openspec-workset) | 個人用の作業ビューを作成、保存、表示します。                               |

**ユーティリティ**

| コマンド                                      | 動作                                          |
| --------------------------------------------- | --------------------------------------------- |
| [`openspec feedback`](#openspec-feedback)     | OpenSpec に関するフィードバックを送信します。 |
| [`openspec completion`](#openspec-completion) | シェル補完をインストールまたは生成します。    |

**非推奨**

| コマンド                              | 動作                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`openspec change`](#openspec-change) | 変更を対象とする show、list、validate の名詞形式です。CLI は警告を表示し、動詞から始まるコマンドを案内します。 |
| [`openspec spec`](#openspec-spec)     | 仕様を対象とする show、list、validate の名詞形式です。同じ警告が表示されます。                                 |

すべてのコマンドで`-h, --help`を使用できます。引数なしの`openspec`では、次のオプションも使用できます。

- `-V, --version`：CLI のバージョンを表示します。
- `--no-color`：色付き出力を無効にします。

## openspec init

プロジェクトで OpenSpec を初期化します。

```bash
openspec init                        # カレントディレクトリで対話式にツールを選択
openspec init --tools claude,cursor  # 指定したツールをプロンプトなしで設定
openspec init --tools none           # openspec/ 構成だけを作成し、ツール用ファイルは作らない
```

`--tools`を指定しない場合、対話式ターミナルではツールの選択を求められます。非対話環境では、プロジェクト内で検出したツールを設定します。ツールが見つからなければ終了コード 1 で終了し、有効な ID を表示します。

**引数**

| 引数   | 内容                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| `path` | 初期化するプロジェクトディレクトリ。既定値はカレントディレクトリです。存在しない場合は作成します。 |

**オプション**

| フラグ                | 動作                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--tools <tools>`     | カンマ区切りのツール ID、`all`、`none`。選択画面を省略します。ID は[対応ツール](supported-tools.md)を参照してください。                      |
| `--force`             | 以前の OpenSpec 構成にあるファイルを確認せず削除します。指定しない対話実行では、削除前に確認します。                                         |
| `--profile <profile>` | この実行だけグローバル設定のプロファイルを上書きします。`core`は標準ワークフローセット、`custom`はグローバル設定へ保存したワークフローです。 |
| `--no-animation`      | アニメーションの代わりに静止したウェルカム画面を表示します。                                                                                 |

**出力**

選択したツールごとのディレクトリへ、OpenSpec のスキルとコマンドを作成します。

```
▌ OpenSpec 構成を作成しました
✔ Claude Code のセットアップが完了しました

OpenSpec のセットアップが完了しました

新規作成: Claude Code
.claude/ にスキル 6 個とコマンド 6 個を作成しました
設定: openspec/config.yaml（スキーマ: spec-driven）

はじめに:
  最初の変更を開始: /opsx:propose "あなたのアイデア"

新しいコマンドを有効にするにはIDEを再起動してください。
```

`--tools none`は`openspec/config.yaml`だけを作成します。初期化済みのプロジェクトでは、インストール済みファイルをその場で書き直します。概要には`更新: Claude Code`と`設定: openspec/config.yaml（既存）`が表示されます。

**終了コード**

- `0`：セットアップが完了しました。
- `1`：`--tools`または`--profile`の値が無効です。または、非対話実行でツールを検出できず、`--tools`も指定されていません。

## openspec update

インストール済みの OpenSpec 指示ファイルを更新します。

```bash
openspec update           # CLI より古いツールファイルを更新
openspec update --force   # 最新でもファイルを書き直す
```

update は init で設定したツールを検出し、生成済みファイルを現在の CLI バージョンと比較します。新しい OpenSpec リリースがある場合は、最初に CLI のアップグレードを提案し、更新後のバージョンで再実行します。確認を省くには`OPENSPEC_NO_UPDATE_CHECK=1`を設定してください。

**引数**

| 引数   | 内容                                                                 |
| ------ | -------------------------------------------------------------------- |
| `path` | 更新するプロジェクトディレクトリ。既定値はカレントディレクトリです。 |

**オプション**

| フラグ    | 動作                                                       |
| --------- | ---------------------------------------------------------- |
| `--force` | 最新の場合も、設定済みの全ツールのファイルを書き直します。 |

**出力**

すべてのツールファイルが CLI バージョンと一致している場合：

```
✓ すべての 1 ツールは最新です（v1.7.0）
  ツール: claude

ファイルを再生成するには --force を使用してください。
```

ツールファイルが古い CLI で生成されている場合は、次のように表示されます。`--force`を指定して最新のファイルを書き直す場合、対象ツールには`claude (設定同期)`と表示されます。

```
更新対象: 1 件（claude (1.6.0 → 1.7.0)）

✔ Claude Code を更新しました

✓ 更新: Claude Code（v1.7.0）
ツール: Claude Code

変更を有効にするには IDE を再起動してください。
```

OpenSpec がないディレクトリでは更新しません。

```
✖ エラー: OpenSpec ディレクトリが見つかりません。先に 'openspec init' を実行してください。
```

**終了コード**

- `0`：ファイルを更新しました。または、すべて最新です。
- `1`：指定したパスに OpenSpec ディレクトリがないか、更新に失敗しました。

## openspec config

グローバル設定を表示、変更します。

```bash
openspec config list                  # 現在の設定を表示
openspec config set delivery skills   # 1 つの値を変更
openspec config profile               # 対話式ワークフローピッカー
```

| サブコマンド        | 動作                                                       |
| ------------------- | ---------------------------------------------------------- |
| `path`              | 設定ファイルの場所を表示します。                           |
| `list`              | 現在の設定をすべて表示します。                             |
| `get <key>`         | 1 つの値を加工せず表示します。スクリプトから利用できます。 |
| `set <key> <value>` | 型を自動変換して値を設定します。                           |
| `unset <key>`       | キーを削除し、既定値へ戻します。                           |
| `reset`             | すべての設定を既定値へ戻します。                           |
| `edit`              | 設定ファイルを`$EDITOR`で開きます。                        |
| `profile [preset]`  | 配信方式とワークフローを設定します。                       |

設定はマシン全体へ適用され、`config path`が示す場所に JSON で保存されます。`$XDG_CONFIG_HOME`を設定している場合は`$XDG_CONFIG_HOME/openspec/config.json`です。それ以外は、macOS と Linux では`~/.config/openspec/config.json`、Windows では`%APPDATA%\openspec\config.json`です。すべてのサブコマンドで`--scope <scope>`を指定できますが、現在使えるのは`global`だけです。ほかのスコープを指定すると終了コード 1 で終了し、`エラー: project-local config はまだ実装されていません`と表示します。

### openspec config path

```bash
openspec config path
```

```
/Users/you/.config/openspec/config.json
```

### openspec config list

```bash
openspec config list          # 読みやすい設定とプロファイル概要
openspec config list --json   # 未加工の設定を JSON で表示
```

**オプション**

| フラグ   | 動作                                   |
| -------- | -------------------------------------- |
| `--json` | 設定オブジェクトを JSON で表示します。 |

**出力**

各設定に続いて、値が明示指定か既定値かを示すプロファイル概要を表示します。

```
featureFlags: {}
profile: core
delivery: both

Profile settings:
  profile: core (default)
  delivery: both (default)
  workflows: propose, explore, apply, update, sync, archive (from core profile)
```

### openspec config get

```bash
openspec config get delivery
```

**引数**

| 引数  | 内容                                                                                        |
| ----- | ------------------------------------------------------------------------------------------- |
| `key` | 読み取るキー。ドットを使うと、ネストした値へアクセスできます（`featureFlags.workspaces`）。 |

**出力**

スクリプトでそのまま使える値だけを表示します。オブジェクトは 1 行の JSON で表示します。

```
both
```

**終了コード**

- `0`：値を表示しました。
- `1`：キーに値がありません。この場合は何も表示しません。

### openspec config set

```bash
openspec config set delivery skills
openspec config set featureFlags.workspaces true
```

**引数**

| 引数    | 内容                                                                        |
| ------- | --------------------------------------------------------------------------- |
| `key`   | 書き込むキー。ネストした値にはドットを使います。                            |
| `value` | 新しい値。`true`と`false`は真偽値へ、数字だけの文字列は数値へ変換されます。 |

**オプション**

| フラグ            | 動作                                       |
| ----------------- | ------------------------------------------ |
| `--string`        | 型を変換せず、値を文字列として保存します。 |
| `--allow-unknown` | スキーマにないキーを許可します。           |

**出力**

```
featureFlags.workspaces = true を設定しました
```

未知のキーまたは無効な値を指定すると、保存せず終了コード 1 で終了します。

```
エラー: 無効な設定キー "bogus.key" です。 Unknown top-level key "bogus".
利用可能なキーを確認するには "openspec config list" を使ってください。
このチェックを回避するには --allow-unknown を渡してください。
```

```
エラー: 無効な設定です - delivery: Invalid option: expected one of "both"|"skills"|"commands"
```

### openspec config unset

```bash
openspec config unset delivery
```

キーを削除し、既定値へ戻します。組み込みの既定値があるキーは常に設定済みとして扱うため、一度も明示設定していない場合も成功と表示されます。

```
delivery を削除しました（デフォルトへ戻しました）
```

値がまったくないキーでは、`キー "featureFlags.nothere" は設定されていません`と表示します。どちらの場合も終了コードは 0 です。

### openspec config reset

```bash
openspec config reset --all      # 確認を表示
openspec config reset --all -y   # プロンプトなし
```

**オプション**

| フラグ      | 動作                                 |
| ----------- | ------------------------------------ |
| `--all`     | 必須。すべての設定をリセットします。 |
| `-y, --yes` | 確認プロンプトを省略します。         |

**出力**

```
設定をデフォルトへリセットしました
```

`--all`を指定しない場合は終了コード 1 で終了し、使用方法を表示します。

**終了コード**

- `0`：リセットしました。または、確認で「いいえ」を選びました。
- `1`：`--all`が指定されていません。
- `130`：Ctrl+C でプロンプトをキャンセルしました。

### openspec config edit

```bash
openspec config edit
```

設定ファイルを`$EDITOR`で開きます。`$EDITOR`がなければ`$VISUAL`を使います。ファイルがなければ、先に既定値で作成します。エディタを閉じるとファイルを検証します。JSON または設定が無効な場合は終了コード 1 で終了します。エディタが設定されていない場合も終了コード 1 です。

```
エラー: エディタが設定されていません
EDITOR または VISUAL 環境変数に使いたいエディタを設定してください
例: export EDITOR=vim
```

### openspec config profile

```bash
openspec config profile        # 対話式ピッカー（ターミナルが必要）
openspec config profile core   # core プリセットを直接適用
```

**引数**

| 引数     | 内容                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------- |
| `preset` | 任意のプリセット名。現在使えるのは`core`だけです。コアワークフローを選択し、配信方式の設定は維持します。 |

プリセットを指定しない場合は、対話式ピッカーに現在の配信方式とワークフローが表示されます。配信方式は both、skills のみ、commands のみから選べます。ワークフローはチェックボックスで選びます。変更差分を表示し、OpenSpec プロジェクト内であれば`openspec update`の実行も提案します。非対話環境では終了コード 1 で終了します。

```
対話モードが必要です。`openspec config profile core` を使うか、環境変数 / フラグで設定してください。
```

**出力**

変更した設定は、各プロジェクトを更新するまで反映されません。

```
設定を更新しました。プロジェクトに適用するには各プロジェクトで `openspec update` を実行してください。
```

**終了コード**

- `0`：プロファイルを保存しました。または、現在の設定を維持しました。
- `1`：プリセットが不明、非対話環境、または提案された`openspec update`が失敗しました。
- `130`：Ctrl+C でピッカーをキャンセルしました。

## openspec list

変更を一覧表示します。`--specs`を付けると仕様を表示します。

```bash
openspec list           # 変更を更新日時の新しい順に表示
openspec list --specs   # 仕様と要件数を表示
openspec list --json    # 解決済みルートを含む機械可読形式
```

各行は、解決済みルートの`openspec/changes/`または`openspec/specs/`から取得します。`archive/`フォルダは除外します。

**オプション**

| フラグ           | 動作                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `--specs`        | 変更の代わりに仕様を一覧表示します。                                                           |
| `--changes`      | 変更を一覧表示します。既定の動作です。                                                         |
| `--sort <order>` | `recent`は更新日時の新しい順、`name`は名前順です。既定値は`recent`です。仕様は常に名前順です。 |
| `--json`         | 表の代わりに JSON を表示します。                                                               |
| `--store <id>`   | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。                   |

**出力**

変更ごとに名前、タスク状況、最終更新日時を 1 行で表示します。状況は`タスクなし`、`2/5 タスク`、`✓ 完了`のいずれかです。

```
変更一覧:
  add-rate-limit     タスクなし      just now
```

```
仕様一覧:
  api     要件 1
```

`--json`ではタスク数に加え、`status`へ`no-tasks`、`in-progress`、`complete`のいずれかを出力します。

```json
{
  "changes": [
    {
      "name": "add-rate-limit",
      "completedTasks": 0,
      "totalTasks": 0,
      "lastModified": "2026-08-11T13:44:40.171Z",
      "status": "no-tasks"
    }
  ],
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

対象がない場合は`進行中の変更はありません。`または`仕様が見つかりません。`と表示し、終了コード 0 で終了します。

**終了コード**

- `0`：一覧を表示しました。対象がない場合も 0 です。
- `1`：OpenSpec ルートが見つかりません。プロジェクト外で、`--store`も指定していない場合に発生します。

## openspec show

変更または仕様を Markdown か JSON で表示します。

```bash
openspec show add-rate-limit              # 変更：proposal.md を表示
openspec show add-rate-limit --diff       # 変更：要件差分を追加表示
openspec show api                         # 仕様：spec.md を表示
openspec show api --json --no-scenarios   # シナリオ本文を除いた仕様 JSON
```

名前を指定しない場合、変更と仕様のどちらを表示するか尋ねた後、選択できる項目を一覧表示します。非対話環境では終了コード 1 で終了し、直接指定する形式を表示します。

**引数**

| 引数        | 内容                                                            |
| ----------- | --------------------------------------------------------------- |
| `item-name` | 表示する変更または仕様のフォルダ名（`add-rate-limit`、`api`）。 |

**オプション**

| フラグ                   | 動作                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `--json`                 | Markdown の代わりに構造化 JSON を表示します。                                                                  |
| `--type <change\|spec>`  | 変更と仕様が同じ名前の場合に種類を指定します。                                                                 |
| `--no-interactive`       | プロンプトを表示しません。名前がなければエラーになります。                                                     |
| `--deltas-only`          | 変更の JSON 出力をデルタだけに制限します。変更の JSON は元からデルタだけなので、通常の`--json`と同じ出力です。 |
| `--requirements-only`    | `--deltas-only`の非推奨エイリアスです。標準エラーへ警告を表示します。                                          |
| `--diff`                 | 変更では、要件ごとのデルタ差分を追加します。仕様では警告を表示して無視します。                                 |
| `--requirements`         | 仕様の JSON で要件本文を残し、`scenarios`配列を空にします。                                                    |
| `--no-scenarios`         | 仕様の JSON で`--requirements`と同じ出力にします。                                                             |
| `-r, --requirement <id>` | 仕様の JSON で、1 から始まる位置を使って要件を 1 件表示します。`--requirements`とは併用できません。            |
| `--store <id>`           | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。                                   |

解決後の種類に適用できないフラグは、標準エラーへ警告を表示して無視します。

**出力**

テキストモードではファイル内容をそのまま表示します。変更では`proposal.md`、仕様では`spec.md`を表示します。

```
# Add rate limiting

## Why
未認証のクライアントが API の処理能力を使い切る可能性がある。

## What Changes
- 公開 API にクライアント単位のレート制限を追加する。
```

変更へ`--diff`を指定すると、最初に提案を表示し、その後に`Specifications Changed (diffs)`セクションを表示します。ADDED 要件は全文を含みます。REMOVED 要件は記述済みの Reason と Migration を維持します。RENAMED 要件は FROM と TO を表示します。MODIFIED 要件は、対応する本仕様の要件との差分を unified diff で表示します。

MODIFIED の見出しが大文字と小文字、または空白を無視した場合だけ一致するときは、差分とともに、アーカイブ時の照合では完全一致が必要という警告を表示します。本仕様または要件がなければ、警告とデルタブロック全文を表示します。MODIFIED ブロックに文字上の差がない場合は`(no textual changes)`と表示します。

変更へ`--json`を指定すると、デルタを中心とした形式で出力します。

```json
{
  "id": "add-rate-limit",
  "title": "レート制限を追加",
  "deltaCount": 1,
  "deltas": [
    {
      "spec": "api",
      "operation": "ADDED",
      "description": "要件を追加: API は各クライアントを 1 分あたり 100 リクエストに制限しなければならない。",
      "requirement": {
        "text": "API は各クライアントを 1 分あたり 100 リクエストに制限しなければならない。",
        "scenarios": [
          {
            "rawText": "- **WHEN** クライアントが 1 分以内に 101 件目のリクエストを送信する\n- **THEN** API は 429 を返す"
          }
        ]
      },
      ...
    }
  ],
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

`--json --diff`でも、このトップレベル構造は変わりません。MODIFIED デルタへ`diff`文字列、`warning`文字列、またはその両方が追加されます。ほかの操作は変わりません。空の`diff`文字列は、本仕様とデルタのブロックが文字上同一であることを示します。

仕様へ`--json`を指定すると、要件とシナリオを一覧にします。

```json
{
  "id": "api",
  "title": "api",
  "overview": "公開 HTTP API の振る舞い。",
  "requirementCount": 1,
  "requirements": [
    {
      "text": "API はヘルスチェック用エンドポイントを公開しなければならない。",
      "scenarios": [
        {
          "rawText": "- **WHEN** クライアントが GET /health をリクエストする\n- **THEN** API は 200 を返す"
        }
      ]
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "format": "openspec"
  },
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

名前が見つからない場合は、近い候補を`不明な項目 'does-not-exist' です。次のいずれかですか: add-rate-limit, api?`のように表示します。変更と仕様の両方に一致する名前ではエラーになり、`--type`を指定するよう案内します。

**終了コード**

- `0`：項目を表示しました。
- `1`：名前が不明または曖昧です。非対話環境で名前がありません。`-r`の位置が範囲外です。`--requirements`と`-r`を併用しています。または、`--diff`でデルタか本仕様を読み取れません。

## openspec view

仕様と変更のダッシュボードを 1 画面で表示します。

```bash
openspec view   # プロジェクト概要を 1 画面で表示
```

view はダッシュボードを 1 回表示して終了し、キー入力を待ちません。変更はタスク進捗により、下書き（タスクなし）、進行中（進捗バーと割合を表示）、完了（すべてのタスクをチェック済み）へ分類します。仕様は要件数が多い順に表示します。

**オプション**

| フラグ         | 動作                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| `--store <id>` | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。 |

**出力**

```
OpenSpec ダッシュボード

════════════════════════════════════════════════════════════
概要:
  ● 仕様: 1 件、要件 1 件
  ● 下書きの変更: 1 件
  ● 進行中の変更: 0 件
  ● 完了した変更: 0 件

下書きの変更
────────────────────────────────────────────────────────────
  ○ add-rate-limit

仕様
────────────────────────────────────────────────────────────
  ▪ api                            1 要件

════════════════════════════════════════════════════════════

詳細を見るには openspec list --changes または openspec list --specs を実行してください
```

タスクを実行中の変更がある場合は、概要へ`タスク進捗`行も表示します。

**終了コード**

- `0`：ダッシュボードを表示しました。
- `1`：OpenSpec ルートが見つかりません。プロジェクト外で、`--store`も指定していない場合に発生します。

## openspec validate

変更と仕様の構造を検証します。

```bash
openspec validate add-rate-limit   # 名前で変更または仕様を 1 件指定
openspec validate --all            # すべての変更と仕様
```

名前も一括処理フラグも指定しない場合は、検証する項目の選択を求められます。非対話環境では終了コード 1 で終了し、一括処理フラグを表示します。

**引数**

| 引数        | 内容                                                            |
| ----------- | --------------------------------------------------------------- |
| `item-name` | 検証する変更または仕様のフォルダ名（`add-rate-limit`、`api`）。 |

**オプション**

| フラグ                  | 動作                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| `--all`                 | すべての変更と仕様を検証します。                                                  |
| `--changes`             | すべての変更を検証します。                                                        |
| `--specs`               | すべての仕様を検証します。                                                        |
| `--strict`              | 警告も失敗として扱います。                                                        |
| `--type <change\|spec>` | 変更と仕様が同じ名前の場合に種類を指定します。                                    |
| `--json`                | テキストの代わりに構造化レポートを表示します。                                    |
| `--concurrency <n>`     | 一括実行時の最大並列検証数。既定値は`OPENSPEC_CONCURRENCY`で、未設定なら 6 です。 |
| `--no-interactive`      | プロンプトを表示しません。名前がない、または曖昧な場合はエラーになります。        |
| `--store <id>`          | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。      |

**出力**

項目ごとに 1 行表示します。一括実行の最後には合計を表示します。

```
✓ change/add-rate-limit
✓ spec/api
合計: 2件成功、0件失敗（全2件）
```

検証に失敗した項目では、各問題と修正方法を表示します。

```
変更 'add-rate-limit' に問題があります
✗ [ERROR] api/spec.md: 要件には少なくとも 1 つのシナリオが必要です
次のステップ:
  - 変更に specs/ 配下の差分があることを確認（## ADDED/MODIFIED/REMOVED/RENAMED Requirements 見出しを使用）
  - 各 Requirement には少なくとも1つの #### Scenario: ブロックが必要
  - 解析済みデルタを確認: openspec show add-rate-limit --json --deltas-only
```

`--json`では、実行全体を 1 つのレポートとして表示します。

```json
{
  "items": [
    {
      "id": "add-rate-limit",
      "type": "change",
      "valid": true,
      "issues": [],
      "durationMs": 2
    }
  ],
  "summary": {
    "totals": {
      "items": 1,
      "passed": 1,
      "failed": 0
    },
    "byType": {
      "change": {
        "items": 1,
        "passed": 1,
        "failed": 0
      }
    }
  },
  "version": "1.0",
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

`issues`の各項目には、`ERROR`、`WARNING`、`INFO`のいずれかの`level`が入ります。

**終了コード**

- `0`：検証した全項目が成功しました。
- `1`：項目の検証に失敗したか、名前が不明または対象がないため何も検証できませんでした。

## openspec archive

完了した変更をアーカイブへ移し、本仕様を更新します。

```bash
openspec archive add-rate-limit -y                # 変更 1 件をアーカイブし、デルタをマージ
openspec archive add-rate-limit -y --skip-specs   # 仕様を変更せずアーカイブ
```

名前を指定しない場合は、変更の選択を求められます。非対話環境では終了コード 1 で終了し、再実行用コマンドを表示します。

**引数**

| 引数          | 内容                                                 |
| ------------- | ---------------------------------------------------- |
| `change-name` | アーカイブする変更のフォルダ名（`add-rate-limit`）。 |

**オプション**

| フラグ          | 動作                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| `-y, --yes`     | 仕様更新、未完了タスク、検証省略に関するすべての確認へ「はい」と回答します。             |
| `--skip-specs`  | 本仕様を変更せずにアーカイブします。インフラ、ツール、ドキュメントだけの変更に使います。 |
| `--no-validate` | 検証を省略します。最初に確認が表示され、`-y`を付けると承認します。                       |
| `--json`        | テキストの代わりに構造化結果を表示します。仕様更新の確認には`--yes`も必要です。          |
| `--store <id>`  | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。             |

**出力**

成功すると、タスク進捗と仕様更新のプレビューを表示し、更新を適用してアーカイブフォルダ名を表示します。

```
タスクの進捗: ✓ 完了

更新する仕様:
  api: update
openspec/specs/api/spec.md に変更を適用しています:
  + 1 追加
合計: + 1, ~ 0, - 0, → 0
仕様の更新が完了しました。
変更 'add-rate-limit' を '2026-08-11-add-rate-limit' としてアーカイブしました。
```

変更フォルダ全体を`openspec/changes/archive/2026-08-11-add-rate-limit/`へ移します。フォルダ名の先頭には実行日が付きます。各デルタは対応する本仕様へマージされます。上の ADDED 要件は`openspec/specs/api/spec.md`へ追加されます。`-y`がない場合、更新前にプレビューと確認を表示します。更新を拒否した場合も変更はアーカイブされ、仕様は変更されません。

`--json --yes`を指定した場合：

```json
{
  "archive": {
    "change": "add-rate-limit",
    "archivedAs": "2026-08-11-add-rate-limit",
    "path": "/Users/you/projects/my-app/openspec/changes/archive/2026-08-11-add-rate-limit",
    "specsUpdated": true,
    "totals": {
      "added": 1,
      "modified": 0,
      "removed": 0,
      "renamed": 0
    }
  },
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

archive は最初に変更を検証し、失敗した変更をアーカイブしません。

```
変更の差分仕様で検証エラーがありました:
  ✗ 要件には少なくとも 1 つのシナリオが必要です

検証に失敗しました。アーカイブ前にエラーを修正してください。
検証をスキップする場合（非推奨）は --no-validate を使用してください。
```

未完了タスクがある場合は警告しますが、処理を禁止しません。対話実行では続行するか確認し、`-y`を指定すると自動的に続行します。

```
タスクの進捗: 1/2 タスク
警告: 未完了タスクが 1 件ありますが --yes により続行します。
```

**終了コード**

- `0`：仕様更新の有無にかかわらず、変更をアーカイブしました。
- `1`：検証に失敗、変更名が不明、または確認が必要な状況で回答を読み取れませんでした。

## openspec new

新しい変更ディレクトリを作成します。

```bash
openspec new change add-caching                                # メタデータだけを作成
openspec new change add-search --goal "利用者がドキュメントを検索できる"  # ゴールを記録
```

`new`には`new change <name>`という 1 つのサブコマンドがあります。`openspec/changes/<name>/`を作成し、その中へ [`.openspec.yaml`メタデータファイル](configuration/change-metadata.md)だけを置きます。

```yaml
schema: spec-driven
created: 2026-08-11
```

このコマンドでは、proposal、specs、design、tasks などのアーティファクトを生成しません。アーティファクトは後で作成します。次に作成するものは`openspec status`で確認できます。

**引数**

| 引数   | 内容                                |
| ------ | ----------------------------------- |
| `name` | 変更のフォルダ名（`add-caching`）。 |

**オプション**

| フラグ                 | 動作                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `--description <text>` | 指定した本文を含む`README.md`も変更ディレクトリへ作成します。                         |
| `--goal <text>`        | `.openspec.yaml`へ`goal:`行を保存します。                                             |
| `--schema <name>`      | 変更で使うワークフロースキーマ。既定値は、同梱される唯一のスキーマ`spec-driven`です。 |
| `--json`               | 作成した変更をテキストではなく JSON で表示します。                                    |
| `--store <id>`         | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。          |

**出力**

```
変更 'add-caching' を作成しました: openspec/changes/add-caching/
スキーマ: spec-driven
次: openspec status --change add-caching
```

`--json`を指定した場合：

```json
{
  "change": {
    "id": "add-caching",
    "path": "/Users/you/projects/my-app/openspec/changes/add-caching",
    "metadataPath": "/Users/you/projects/my-app/openspec/changes/add-caching/.openspec.yaml",
    "schema": "spec-driven"
  },
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

**終了コード**

- `0`：変更を作成しました。
- `1`：変更がすでに存在するか、スキーマが不明です。

## openspec status

1 件またはすべての進行中の変更について、アーティファクトの完了状況を表示します。

```bash
openspec status --change add-rate-limit          # チェックリスト表示
openspec status --change add-rate-limit --json   # 構造化レポート
openspec status --all                            # 進行中のすべての変更
openspec status --all --json                     # 1 つの一括レポート
```

進行中の変更がある場合は、`--change`と`--all`のどちらか一方を指定します。どちらもない場合は、変更が 1 件だけでも終了コード 1 で終了し、利用可能な変更を表示します。

```text
✖ エラー: 必須オプション --change（または進行中の全変更を対象とする --all）がありません。利用可能な変更:
  add-rate-limit
```

プロジェクトに進行中の変更がない場合は、どちらのフラグがなくても`アクティブな変更はありません。作成するには: openspec new change <name>`と表示し、終了コード 0 で終了します。`--all --json`では、同じ空の状態を`{ "changes": [], "message": "アクティブな変更はありません。", "root": ... }`と出力します。

**オプション**

| フラグ            | 動作                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `--change <id>`   | 状況を表示する変更のフォルダ名。                                                             |
| `--all`           | 進行中のすべての変更を名前順に表示します。`--change`とは併用できません。                     |
| `--schema <name>` | `openspec/config.yaml`から自動検出したスキーマを上書きします。不明な名前はエラーになります。 |
| `--json`          | テキストの代わりに構造化レポートを表示します。                                               |
| `--store <id>`    | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。                 |

**出力**

スキーマのアーティファクトをチェックリストで表示します。`[x]`は完了、`[ ]`は作成可能、`[-]`は依存するアーティファクトができるまでブロック中です。

```
変更: add-rate-limit
スキーマ: spec-driven
変更ルート: /Users/you/projects/my-app/openspec/changes/add-rate-limit
進捗: 2/4 アーティファクト完了

[x] proposal
[x] specs
[ ] design
[-] tasks（ブロック元: design）
```

`--json`では、アーティファクトごとの依存関係、解決済みファイルパス、推奨する次の手順も表示します。次の例は一部を省略しています。

```json
{
  "changeName": "add-rate-limit",
  "schemaName": "spec-driven",
  "isComplete": false,
  "nextSteps": [
    "Run openspec instructions design --change \"add-rate-limit\" --json before writing that artifact."
  ],
  "artifacts": [
    {
      "id": "proposal",
      "outputPath": "proposal.md",
      "status": "done",
      "requires": []
    },
    {
      "id": "design",
      "outputPath": "design.md",
      "status": "ready",
      "requires": ["proposal"]
    },
    {
      "id": "tasks",
      "outputPath": "tasks.md",
      "status": "blocked",
      "requires": ["specs", "design"],
      "missingDeps": ["design"]
    }
  ]
}
```

`--all --json`では、`changes`に変更ごとの同じ状況オブジェクトが入ります。各変更には`root`を含めず、選択したルートを外側へ 1 回だけ出力します。次の例では、上に示した変更ごとのフィールドを省略しています。

```json
{
  "changes": [
    {
      "changeName": "add-rate-limit",
      "schemaName": "spec-driven",
      "artifacts": []
    }
  ],
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest"
  }
}
```

1 件の変更を読み込めなくても、一括処理は続行します。失敗した項目には`changeName`と診断用の`status`が入り、ほかの項目も出力されます。JSON モードを含め、コマンドは終了コード 1 で終了します。これにより、CI は不完全なレポートを成功として扱いません。JSON 出力は解析可能な 1 つの文書に保たれます。

**終了コード**

- `0`：要求されたすべての状況を表示しました。空の`--all`レポートも 0 です。
- `1`：変更を読み込めません。`--change`と`--all`の両方がない、または両方を指定しています。変更が存在しないか、上書きするスキーマが不明です。

## openspec instructions

アーティファクトの作成、適用、アーカイブに使う指示を表示します。エージェントはワークフロー内でこのコマンドを実行し、次の手順に使う指示を取得します。

```bash
openspec instructions proposal --change add-rate-limit   # アーティファクトの書き方
openspec instructions apply --change add-rate-limit      # 変更の実装方法
openspec instructions archive --change add-rate-limit    # アーカイブ用の入力
```

**引数**

| 引数       | 内容                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `artifact` | スキーマにあるアーティファクト ID。`spec-driven`では`proposal`、`specs`、`design`、`tasks`です。予約語の`apply`と`archive`も指定できます。 |

**オプション**

| フラグ            | 動作                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `--change <id>`   | 指示を生成する変更。必須です。                                               |
| `--schema <name>` | スキーマを上書きします。指定しなければ`config.yaml`から自動検出します。      |
| `--json`          | テキストの代わりに構造化オブジェクトを表示します。                           |
| `--store <id>`    | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。 |

**出力**

アーティファクト形式では、タスク、書き込み先、書き方、テンプレート、完了後に作成可能になるものを 1 つの指示ブロックへ出力します。

```
<artifact id="proposal" change="add-rate-limit" schema="spec-driven">

<task>
変更 "add-rate-limit" の proposal アーティファクトを作成してください。
変更の概要を示す最初の提案文書
</task>

<output>
書き込み先: /Users/you/projects/my-app/openspec/changes/add-rate-limit/proposal.md
</output>

<instruction>
この変更が必要な理由を明確にする提案文書を作成してください。
...
```

`apply`は、コンテキストファイル、タスク進捗、作業指示を表示します。

```
## 適用: add-rate-limit
スキーマ: spec-driven

### コンテキストファイル
- proposal: /Users/you/projects/my-app/openspec/changes/add-rate-limit/proposal.md
- specs: /Users/you/projects/my-app/openspec/changes/add-rate-limit/specs/api/spec.md
- tasks: /Users/you/projects/my-app/openspec/changes/add-rate-limit/tasks.md

### 進捗
1/3 完了

### タスク
- [x] 1.1 レート制限ミドルウェアを追加する
- [ ] 1.2 Retry-After ヘッダー付きで 429 を返す
- [ ] 1.3 バーストトラフィックのテストを追加する

### 指示
コンテキストファイルを読み、未完了タスクを進め、進捗に合わせて完了マークする。
ブロッカーや不明点があれば一旦止めて確認する。

プロジェクトコンテキストまたは操作ガイダンスは設定されていません。
```

必要なアーティファクトがない場合、`apply`は`### ⚠️ ブロック中`と不足アーティファクトを表示します。`archive`は変更名に加え、設定にあるプロジェクトコンテキストと操作ガイダンスを表示します。どちらも設定されていない場合は、その旨だけを表示します。

`--json`では、どの形式も 1 つのオブジェクトを返します。アーティファクト形式は次のフィールドから始まります。

```json
{
  "changeName": "add-rate-limit",
  "artifactId": "proposal",
  "schemaName": "spec-driven",
  "changeDir": "/Users/you/projects/my-app/openspec/changes/add-rate-limit",
  ...
```

この後に`outputPath`、`existingOutputPaths`、全文の`instruction`と`template`、`dependencies`、`unlocks`、`root`が続きます。`apply`形式には`contextFiles`、`progress`、`tasks`、`state`（`blocked`、`ready`、`all_done`）、`instruction`が入ります。

**終了コード**

- `0`：指示を表示しました。
- `1`：アーティファクト、変更、スキーマが不明か、`--change`がありません。各エラーには有効な値を表示します。

## openspec templates

スキーマの各アーティファクトについて、解決済みテンプレートパスを表示します。

```bash
openspec templates          # 既定スキーマ：spec-driven
openspec templates --json   # アーティファクト ID とパスの対応
```

**オプション**

| フラグ            | 動作                                                               |
| ----------------- | ------------------------------------------------------------------ |
| `--schema <name>` | 解決するスキーマ。既定値は`spec-driven`です。                      |
| `--json`          | アーティファクト ID とテンプレートパスの対応を JSON で表示します。 |

**出力**

```
スキーマ: spec-driven
ソース: package

proposal:
  /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/proposal.md
specs:
  /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/spec.md
design:
  /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/design.md
tasks:
  /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/tasks.md
```

`ソース`はスキーマの解決元を示します。`project`はプロジェクトの`openspec/schemas/`、`user`はグローバル上書き、`package`は CLI 組み込みです。優先順位は project、user、package の順です。

```json
{
  "proposal": {
    "path": "/usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/proposal.md",
    "source": "package"
  },
  "specs": {
    "path": "/usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/spec.md",
    "source": "package"
  },
  "design": {
    "path": "/usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/design.md",
    "source": "package"
  },
  "tasks": {
    "path": "/usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven/templates/tasks.md",
    "source": "package"
  }
}
```

**終了コード**

- `0`：パスを表示しました。
- `1`：スキーマが不明です。エラーには利用可能なスキーマを表示します。

## openspec schemas

利用可能なワークフロースキーマを一覧表示します。

```bash
openspec schemas          # 名前、説明、アーティファクトの順序
openspec schemas --json   # エージェント向けの機械可読形式
```

**オプション**

| フラグ   | 動作                                   |
| -------- | -------------------------------------- |
| `--json` | エージェント向けに JSON で出力します。 |

**出力**

```
利用可能なスキーマ:

  spec-driven
    OpenSpec の既定ワークフロー - proposal → specs → design → tasks
    アーティファクト: proposal → specs → design → tasks
```

プロジェクト内のスキーマには`（プロジェクト）`、グローバル上書きには`（ユーザー上書き）`と表示します。

```json
[
  {
    "name": "spec-driven",
    "description": "OpenSpec の既定ワークフロー - proposal → specs → design → tasks",
    "artifacts": ["proposal", "specs", "design", "tasks"],
    "source": "package"
  }
]
```

**終了コード**

- `0`：スキーマを一覧表示しました。
- `1`：スキーマ一覧を読み取れませんでした。

## openspec schema

スキーマを調査、フォーク、作成します（実験的）。すべてのサブコマンドは、最初に標準エラーへ`注意: スキーマコマンドは実験的で、将来変更される可能性があります。`と表示します。

```bash
openspec schema which spec-driven          # スキーマの解決元
openspec schema fork spec-driven my-flow   # スキーマをプロジェクトへコピー
openspec schema init my-schema             # スキーマをゼロから作成
```

| サブコマンド | 動作                                                       |
| ------------ | ---------------------------------------------------------- |
| `which`      | スキーマの解決元を表示します。                             |
| `validate`   | スキーマの構造とテンプレートを検証します。                 |
| `fork`       | カスタマイズ用に既存スキーマをプロジェクトへコピーします。 |
| `init`       | プロジェクト内に新しいスキーマを作成します。               |

スキーマは次の 3 か所から解決します。最初に一致したものを使います。

| ソース    | 場所                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- |
| `project` | 現在のプロジェクトにある`openspec/schemas/`。                                                  |
| `user`    | `~/.local/share/openspec/schemas/`。`XDG_DATA_HOME`と Windows の`%LOCALAPPDATA%`も反映します。 |
| `package` | CLI に同梱されたスキーマ。`spec-driven`はここにあります。                                      |

### openspec schema which

CLI が使用するスキーマの解決元を表示します。

```bash
openspec schema which spec-driven
openspec schema which --all        # 全スキーマをソース別に表示
```

**引数**

| 引数   | 内容                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------ |
| `name` | 調べるスキーマ。`--all`がなければ必須です。どちらもない場合、which は終了コード 1 で終了します。 |

**オプション**

| フラグ   | 動作                                     |
| -------- | ---------------------------------------- |
| `--all`  | 全スキーマとその解決元を一覧表示します。 |
| `--json` | 解決結果を JSON で表示します。           |

**出力**

```
スキーマ: spec-driven
ソース: package
パス: /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven
```

優先度の高いコピーがほかのコピーを隠している場合は、`上書き対象:`セクションへ隠れたコピーを表示します。`--json`を指定した場合：

```json
{
  "name": "my-flow",
  "source": "project",
  "path": "/Users/you/projects/my-app/openspec/schemas/my-flow",
  "shadows": []
}
```

名前が不明な場合は、利用可能なスキーマを表示して終了コード 1 で終了します。

### openspec schema validate

スキーマの構造とテンプレートを検証します。

```bash
openspec schema validate spec-driven   # 任意のソースにある 1 スキーマ
openspec schema validate               # プロジェクト内の全スキーマ
```

`schema.yaml`が存在して解析できること、構造がスキーマ形式に合うこと、各アーティファクトのテンプレートがスキーマの`templates/`ディレクトリ内にあること、依存グラフに循環や不明な参照がないことを検証します。

**オプション**

| フラグ      | 動作                                           |
| ----------- | ---------------------------------------------- |
| `--json`    | テキストの代わりに構造化レポートを表示します。 |
| `--verbose` | 各検証手順を表示します。                       |

**出力**

```
✓ スキーマ 'spec-driven' は有効です
```

名前を指定しない場合は、`検証結果:`見出しの下へプロジェクト内の各スキーマを 1 行ずつ表示します。失敗したスキーマでは問題を一覧表示し、終了コード 1 で終了します。

```
✗ スキーマ 'my-schema' にエラーがあります:
  error: アーティファクト 'tasks' のテンプレートファイル 'tasks.md' が見つかりません
```

### openspec schema fork

既存スキーマをカスタマイズできるよう、プロジェクトへコピーします。

```bash
openspec schema fork spec-driven my-flow
```

**引数**

| 引数     | 内容                                                                                   |
| -------- | -------------------------------------------------------------------------------------- |
| `source` | コピーするスキーマ。どのソースにあるスキーマも指定できます。                           |
| `name`   | コピーの名前。kebab-case（`my-workflow`）で指定します。既定値は`<source>-custom`です。 |

**オプション**

| フラグ    | 動作                                     |
| --------- | ---------------------------------------- |
| `--force` | 出力先にある既存スキーマを上書きします。 |
| `--json`  | 結果を JSON で表示します。               |

**出力**

```
✔ 'spec-driven' を 'my-flow' に複製しました

ソース: /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven (package)
出力先: /Users/you/projects/my-app/openspec/schemas/my-flow
```

フォークは`openspec/schemas/`へ作成され、その`schema.yaml`の`name:`フィールドは新しい名前へ書き換えられます。

```
openspec/schemas/my-flow/
├── schema.yaml
└── templates/
    ├── design.md
    ├── proposal.md
    ├── spec.md
    └── tasks.md
```

出力先がすでに存在する場合は、`--force`を指定しない限りエラーになります。ソースと同じ名前でフォークすると、元のスキーマよりコピーが優先されます。

### openspec schema init

最初のテンプレートを含む新しいスキーマをプロジェクト内へ作成します。

```bash
openspec schema init my-schema --description "軽量フロー" --artifacts proposal,tasks
```

対話式ターミナルで`--description`と`--artifacts`のどちらも指定しない場合は、説明、アーティファクトのチェックリスト、プロジェクトの既定スキーマにするかを尋ねられます。非対話環境では、次の既定値を使います。

**引数**

| 引数   | 内容                                                            |
| ------ | --------------------------------------------------------------- |
| `name` | 新しいスキーマの名前。kebab-case（`my-workflow`）で指定します。 |

**オプション**

| フラグ                 | 動作                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--description <text>` | スキーマの説明。既定値は`<name> 向けのカスタムワークフロースキーマ`です。                                                                                                           |
| `--artifacts <list>`   | `proposal`、`specs`、`design`、`tasks`から選ぶカンマ区切りのアーティファクト ID。既定では 4 つすべてです。                                                                          |
| `--default`            | 既存の`openspec/config.yaml`または`openspec/config.yml`へ`schema: <name>`を書き込みます。どちらもなければ`openspec/config.yaml`を作成します。新しい変更ではこのスキーマを使います。 |
| `--no-default`         | 既定スキーマにするかという質問を省略します。                                                                                                                                        |
| `--force`              | 同じ名前の既存スキーマを上書きします。                                                                                                                                              |
| `--json`               | 結果を JSON で表示します。                                                                                                                                                          |

スキーマの作成と`--default`による設定更新は 1 つの操作です。設定を検証または書き込めない場合、設定と既存スキーマのどちらも変更しません。

**出力**

```
✔ スキーマ 'my-schema' を作成しました

スキーマを作成しました: /Users/you/projects/my-app/openspec/schemas/my-schema

アーティファクト: proposal, tasks
```

ディスク上には次のファイルが作成されます。

```
openspec/schemas/my-schema/
├── schema.yaml
└── templates/
    ├── proposal.md
    └── tasks.md
```

`schema.yaml`では、選択したアーティファクトと依存関係を接続します。`tasks`を含めた場合は、`tasks.md`を追跡する`apply`フェーズも追加されます。`openspec new --schema my-schema`でこのスキーマを使えます。

## openspec store

マシンへ登録する独立した OpenSpec リポジトリ（ストア）を作成、管理します。

```bash
openspec store setup team-context --path ~/openspec/team-context   # 作成して登録
openspec store register ~/stores/design-system                     # 既存チェックアウトを登録
openspec store list                                                # 登録内容を確認
```

登録内容はマシンごとのレジストリ`~/.local/share/openspec/stores/registry.yaml`へ保存されます。`XDG_DATA_HOME`を設定している場合は`$XDG_DATA_HOME/openspec/stores/registry.yaml`です。すべてのサブコマンドで`--json`を指定でき、テキストの代わりに構造化レポートを表示します。サブコマンドなし、または不明なサブコマンドで`openspec store`を実行すると、サブコマンド一覧を表示して終了コード 1 で終了します。

| サブコマンド               | 動作                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `setup [id]`               | ストアフォルダを作成して登録します。                       |
| `register [path]`          | 既存のストアフォルダを登録します。                         |
| `unregister <id>`          | 登録を解除します。フォルダはディスクに残します。           |
| `remove <id>`              | 登録を解除し、フォルダを削除します。                       |
| `list`（エイリアス：`ls`） | 登録済みストアを一覧表示します。                           |
| `doctor [id]`              | 登録済みストアの登録、メタデータ、Git の状態を確認します。 |

### openspec store setup

ストアフォルダを作成して登録します。

```bash
openspec store setup team-context --path ~/openspec/team-context
```

対話式ターミナルでは、不足している名前と場所を尋ね、作成前に確認します。非対話環境で名前または`--path`がない場合は、指定するフラグを表示して終了コード 1 で終了します。登録済みストアへ setup を再実行すると、`登録状態: 登録済み`と表示します。

**引数**

| 引数 | 内容                                      |
| ---- | ----------------------------------------- |
| `id` | ストア名。`--store`へ渡す ID になります。 |

**オプション**

| フラグ           | 動作                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `--path <path>`  | ストアを置くフォルダ。`~`を展開します。                                |
| `--init-git`     | Git リポジトリを初期化し、最初のコミットを作成します。既定の動作です。 |
| `--no-init-git`  | Git 操作をすべて省略します。init も最初のコミットも実行しません。      |
| `--remote <url>` | 正式な clone 元として`store.yaml`へ記録する URL。                      |

**出力**

```
ストア準備完了: team-context
場所: /Users/you/stores/team-context
OpenSpec ルート: 準備完了
登録状態: 登録しました

次に、通常の OpenSpec コマンドをこのストアに対して実行します。例:
  openspec new change <change-id> --store team-context
共有方法: 通常の Git リポジトリと同じように commit / push してください。
```

`--json`では、作成したものと登録場所を表示します。

```json
{
  "store": {
    "id": "design-system",
    "root": "/Users/you/stores/design-system",
    "metadata_path": "/Users/you/stores/design-system/.openspec-store/store.yaml"
  },
  "registry": {
    "path": "/Users/you/.local/share/openspec/stores/registry.yaml",
    "registered": true,
    "already_registered": false
  },
  "git": {
    "is_repository": true,
    "initialized": true,
    "committed": true
  },
  "created_files": [
    "openspec/",
    "openspec/specs/",
    "openspec/changes/",
    "openspec/changes/archive/",
    "openspec/config.yaml",
    "openspec/specs/.gitkeep",
    "openspec/changes/archive/.gitkeep",
    ".openspec-store/store.yaml"
  ],
  "status": []
}
```

### openspec store register

clone したチームメンバーのストアなど、既存のストアフォルダを登録します。

```bash
openspec store register ~/stores/design-system
```

フォルダには正常な`openspec/`ルートが必要です。`.openspec-store/store.yaml`があれば、記録済み ID を使います。なければ、メタデータの作成前に確認します。非対話環境では`--yes`を指定してください。1 台のマシンへ登録できるのは、ストア ID ごとに 1 つのチェックアウトだけです。同じ ID で別のパスを登録するか、同じパスへ別の ID を登録すると、終了コード 1 で終了します。

**引数**

| 引数   | 内容                                                |
| ------ | --------------------------------------------------- |
| `path` | 登録するストアフォルダ。`~`を展開します。必須です。 |

**オプション**

| フラグ      | 動作                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| `--id <id>` | ストア ID。既定値はメタデータにある ID またはフォルダ名です。            |
| `--yes`     | 正常な OpenSpec ルートへストア識別メタデータを作成することを承認します。 |

**出力**

```
ストアを登録しました: design-system
場所: /Users/you/stores/design-system
OpenSpec ルート: 準備完了
登録状態: 登録しました
```

`--json`では`store setup --json`と同じ構造の文書を表示します。

### openspec store unregister

登録を解除します。フォルダはディスクに残します。

```bash
openspec store unregister design-system
```

```
ストアの登録を解除しました: design-system
ファイルは保持しました: /Users/you/stores/design-system
```

### openspec store remove

登録を解除し、フォルダを削除します。

```bash
openspec store remove design-system --yes
```

対話実行では、削除前に確認します。`--json`を指定するか非対話環境で実行する場合、削除には`--yes`が必要です。

```
エラー: 非対話でストアファイルを削除するには --yes を指定してください。
修正: openspec store remove design-system --yes
```

**オプション**

| フラグ  | 動作                                                 |
| ------- | ---------------------------------------------------- |
| `--yes` | ローカルのストアフォルダを削除することを承認します。 |

**出力**

```
ストアを削除しました: design-system
削除しました: /Users/you/stores/design-system
```

### openspec store list

登録済みストアを一覧表示します。`ls`はエイリアスです。

```bash
openspec store list
```

```
OpenSpec ストア (2)

ID              場所
design-system   /Users/you/stores/design-system
team-context    /Users/you/stores/team-context
```

登録がない場合は`登録済みのストアはありません。`と、次に実行する setup、register コマンドを表示します。

### openspec store doctor

登録済みストアの登録、メタデータ、Git の状態を確認します。

```bash
openspec store doctor                # 登録済みの全ストア
openspec store doctor team-context   # 1 つのストア
```

**出力**

```
ストア診断

team-context
  場所: /Users/you/stores/team-context
  OpenSpec ルート: ok
  メタデータ: ok
  Git: リポジトリ検出済み (コミット: あり, 未コミット変更: なし, remote: なし)
  問題: なし
```

**終了コード**

- `0`：レポートを表示しました。ストアに問題がある場合も 0 です。
- `1`：不明なストア ID などにより、レポートを実行できませんでした。

## openspec doctor

解決済み OpenSpec ルートの関連状態を診断します。

```bash
openspec doctor                       # カレントディレクトリから最も近い上位の openspec/ ルート
openspec doctor --store team-context  # 登録済みストアをルートに指定
```

doctor は読み取り専用です。clone、同期、修復は行いません。ルートが正常か、`openspec/config.yaml`で宣言した各参照をこのマシンで解決できるかを表示します。カレントディレクトリより上にルートがなく、`--store`も指定していない場合は、登録済みストアを表示して終了コード 1 で終了します。

**オプション**

| フラグ         | 動作                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| `--store <id>` | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。 |
| `--json`       | 状態レポートを JSON で表示します。                                           |

**出力**

```
診断

ルート
  場所: /Users/you/projects/my-app
  OpenSpec ルート: ok

参照
  - team-context: ok (/Users/you/stores/team-context)
```

`--store`を指定すると、そのストアがルートになり、ストア行も表示します。

```
OpenSpec ルートを使用: team-context (/Users/you/stores/team-context)
診断

ルート
  場所: /Users/you/stores/team-context
  OpenSpec ルート: ok
  ストア: team-context (メタデータ ok)

参照
  (宣言なし)
```

```json
{
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest",
    "healthy": true,
    "status": []
  },
  "store": null,
  "references": [
    {
      "store_id": "team-context",
      "root": "/Users/you/stores/team-context",
      "status": []
    }
  ],
  "status": []
}
```

**終了コード**

- `0`：レポートを表示しました。問題が含まれる場合も 0 です。
- `1`：ルートを解決できないか、`--store`の ID が不明です。ルートを解決できないのは、カレントディレクトリより上に`openspec/`がなく、`--store`も指定していない場合です。

## openspec context

解決済み OpenSpec ルートの作業コンテキストを表示します。ルートと、`openspec/config.yaml`で宣言した全参照ストアが対象です。各参照には取得コマンドも表示します。

```bash
openspec context                       # カレントディレクトリから最も近い上位の openspec/ ルート
openspec context --store team-context  # 登録済みストアをルートに指定
openspec context --json                # エージェント向け概要
```

このマシンで解決できない参照は、`このマシンでは利用できません`セクションへ修正方法とともに表示します。

**オプション**

| フラグ                    | 動作                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| `--store <id>`            | 現在のプロジェクトではなく、登録済みストアを OpenSpec ルートとして使います。 |
| `--json`                  | エージェント向け概要を JSON で表示します。                                   |
| `--code-workspace <path>` | この作業セットの VS Code ワークスペースファイルも書き出します。              |
| `--force`                 | 既存の`--code-workspace`ファイルを上書きします。                             |

**出力**

```
my-app の作業コンテキスト (/Users/you/projects/my-app)

OpenSpec ルート
  my-app  /Users/you/projects/my-app

参照先ストア
  team-context  /Users/you/stores/team-context
    取得: openspec show <spec-id> --type spec --store team-context
```

`--store`を指定した場合は、そのストアだけが作業セットになります。

```
OpenSpec ルートを使用: team-context (/Users/you/stores/team-context)
team-context の作業コンテキスト (/Users/you/stores/team-context)

OpenSpec ルート
  team-context  /Users/you/stores/team-context

参照は宣言されていません。作業セットはこのルートのみです。
```

```json
{
  "root": {
    "path": "/Users/you/projects/my-app",
    "source": "nearest",
    "role": "openspec_root"
  },
  "members": [
    {
      "role": "referenced_store",
      "id": "team-context",
      "path": "/Users/you/stores/team-context",
      "fetch": "openspec show <spec-id> --type spec --store team-context",
      "status": []
    }
  ],
  "status": []
}
```

**ワークスペースファイルの書き出し**

`--code-workspace`は、指定したパスへ VS Code ワークスペースファイルを書き出します。ルート用フォルダが 1 つ、利用可能な各参照ストア用の`ref:<id>`フォルダが 1 つずつ入ります。利用できない参照は省略し、概要行に名前を表示します。概要は`/Users/you/projects/my-app/openspec.code-workspace を書き込みました (2 フォルダー)`の形式です。概要を標準エラーへ出すため、`--json`の標準出力は 1 つの JSON 文書に保たれます。既存ファイルがある場合は、`--force`を指定しない限り終了コード 1 で終了します。

```json
{
  "folders": [
    {
      "name": "my-app",
      "path": "/Users/you/projects/my-app"
    },
    {
      "name": "ref:team-context",
      "path": "/Users/you/stores/team-context"
    }
  ]
}
```

**終了コード**

- `0`：レポートを表示しました。
- `1`：ルートを解決できないか、`--code-workspace`の書き込みを拒否しました。

## openspec workset

個人用の作業ビューを作成、保存、表示します。workset は、一緒に作業するフォルダへ名前を付けて保存した一覧です。

```bash
openspec workset create checkout --member ~/projects/checkout-api --member web=~/projects/checkout-web
openspec workset list
openspec workset remove checkout --yes
```

| サブコマンド    | 動作                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `create [name]` | 選択したフォルダの作業ビューへ名前を付けて保存します。                                          |
| `list`、`ls`    | 保存済み workset とそのメンバーを表示します。                                                   |
| `open <name>`   | 保存済み workset をツールで開きます。エディタウィンドウまたはエージェントセッションが対象です。 |
| `remove <name>` | 保存済み workset を削除します。メンバーフォルダには触れません。                                 |

workset はローカルだけに保存されます。

- 状態は 1 つのフォルダへ保存されます。通常は`~/.local/share/openspec/worksets/`、設定時は`$XDG_DATA_HOME/openspec/worksets/`、Windows では`%LOCALAPPDATA%\openspec\worksets\`です。
- メンバーフォルダには何も書き込まず、コミットや共有も行いません。
- 状態フォルダを削除すると、workset の全データが削除されます。

### openspec workset create

フォルダの作業ビューへ名前を付けて保存します。

```bash
openspec workset create checkout \
  --member ~/projects/checkout-api \
  --member web=~/projects/checkout-web
```

対話式ターミナルでは、フラグで指定していない情報を順に尋ねます。名前、各フォルダ、ツールを選んだ後、すぐに workset を開くか確認します。非対話環境で名前またはメンバーがない場合はエラーです。保存済みの名前は常にエラーになるため、先に削除してください。

**引数**

| 引数   | 内容                                                                                       |
| ------ | ------------------------------------------------------------------------------------------ |
| `name` | workset 名。小文字、数字、単一のハイフンからなる kebab-case です。非対話環境では必須です。 |

**オプション**

| フラグ              | 動作                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--member <member>` | メンバーフォルダを`<path>`または`<name>=<path>`で指定します。複数回指定でき、最初の項目が主メンバーになります。パスには既存フォルダが必要です。ラベルの既定値はフォルダ名です。 |
| `--tool <id>`       | workset を開く優先ツール。組み込み ID は`code`（VS Code）と`cursor`（Cursor）です。`claude`と`codex`は一時的に無効です。                                                        |
| `--json`            | 保存した workset を JSON で表示します。                                                                                                                                         |

**出力**

```
ワークセット 'checkout' をこのマシンに保存しました（メンバー 2 件）。
いつでも次のコマンドで開けます: openspec workset open checkout
```

### openspec workset list

保存済み workset とそのメンバーを名前順に表示します。

```bash
openspec workset list   # エイリアス：ls
```

**オプション**

| フラグ   | 動作                           |
| -------- | ------------------------------ |
| `--json` | workset を JSON で表示します。 |

**出力**

workset ごとに 1 ブロックを表示します。名前、設定されている場合はツール、その後に各メンバーを`name  path`形式で表示します。保存済み workset がない場合は、「保存済みのワークセットはありません。」と`openspec workset create`の案内を表示します。

```
checkout
  checkout-api  /Users/you/projects/checkout-api
  web           /Users/you/projects/checkout-web
checkout-tool  (opens in VS Code)
  checkout-api  /Users/you/projects/checkout-api
```

`--json`を指定した場合：

```json
{
  "worksets": [
    {
      "name": "checkout",
      "members": [
        {
          "name": "checkout-api",
          "path": "/Users/you/projects/checkout-api"
        },
        {
          "name": "web",
          "path": "/Users/you/projects/checkout-web"
        }
      ]
    }
  ],
  "status": []
}
```

### openspec workset open

保存済み workset をツールで開きます。エディタツール（`code`、`cursor`）では`.code-workspace`ファイルを生成し、ウィンドウを開いてからコマンドが終了します。CLI エージェントツール（`claude`、`codex`）では、全メンバーを接続してターミナルを引き継ぐ予定です。この処理の見直し中は一時的に無効なため、現在 workset を開けるのは IDE だけです。

```bash
openspec workset open checkout                # 保存済みツール、またはプロンプトで選択
openspec workset open checkout --tool cursor  # 今回だけ指定したツールを使用
```

**引数**

| 引数   | 内容           |
| ------ | -------------- |
| `name` | 開く workset。 |

**オプション**

| フラグ        | 動作                             |
| ------------- | -------------------------------- |
| `--tool <id>` | 今回だけ、このツールで開きます。 |

`--tool`も保存済みツールもない場合は、インストール済みツールの選択を求められます。非対話環境では終了コード 1 で終了します。

- 存在しないメンバーフォルダは、警告を表示して省略します。主メンバーがなければ、次の利用可能なメンバーが今回の主メンバーになります。利用可能なメンバーフォルダが 1 つもなければ失敗します。
- `--json`は使用できません。open はターミナルをツールへ引き渡すため、JSON モードがありません。
- 起動に失敗した場合は、手動で開くためのワークスペースファイルのパスとメンバー一覧をエラーの最後に表示します。

**終了コード**

- ツールの終了コードをそのまま返します。シグナルの場合は`128+n`となり、Ctrl+C では`130`です。
- `1`：workset が不明、利用可能なメンバーフォルダがない、または使用できるツールがありません。

### openspec workset remove

保存済み workset と、生成済みの`.code-workspace`ファイルを削除します。メンバーフォルダには触れません。

```bash
openspec workset remove checkout --yes
```

対話式ターミナルでは workset を表示し、削除前に確認します。`--json`を指定するか非対話環境で実行する場合は`--yes`が必要で、なければ終了コード 1 で終了します。

**オプション**

| フラグ   | 動作                           |
| -------- | ------------------------------ |
| `--yes`  | 非対話での削除を承認します。   |
| `--json` | 削除結果を JSON で表示します。 |

**出力**

```
ワークセット 'checkout' を削除しました。メンバーフォルダーは変更していません。
```

## openspec feedback

OpenSpec に関するフィードバックを送信します。

```bash
openspec feedback "validate の出力を確認しづらい"
openspec feedback "Windows で archive が失敗する" --body "手順: init、propose、archive。エラー: EPERM。"
```

CLI は`gh` CLI を介して、メッセージを`ayumuwall/OpenSpec-J`リポジトリの GitHub Issue として登録します。タイトルは`Feedback: <message>`です。本文には`--body`の内容と、CLI バージョン、プラットフォーム、タイムスタンプを示すフッターが入ります。Issue には`feedback`ラベルが付きます。リポジトリにこのラベルがない場合は、ラベルなしで再試行し、その旨を表示します。

**引数**

| 引数      | 内容                                                   |
| --------- | ------------------------------------------------------ |
| `message` | 1 行の要約です。Issue のタイトルになります。必須です。 |

**オプション**

| フラグ          | 動作                                   |
| --------------- | -------------------------------------- |
| `--body <text>` | Issue の本文に詳しい説明を追加します。 |

**出力**

成功時：

```
✓ フィードバックを送信しました！
Issue URL（課題 URL）: https://github.com/ayumuwall/OpenSpec-J/issues/1234
```

`gh`がインストールされていない場合や、`gh`にログインしていない場合は送信されません。CLI は`--- 整形済みフィードバック ---`と`--- フィードバック終わり ---`の間に整形済みの内容を表示し、続いて入力済みの新規 Issue URL を表示します。ログインしていない場合は`自動送信するには: gh auth login`も表示します。

**終了コード**

- `0`：Issue を作成した、または手動送信への切り替えを実行した（`gh`がない、または`gh`にログインしていない）。
- `1`：メッセージが指定されていない。
- `gh`自身の終了コード：認証後に`gh`が失敗した（ネットワーク、レート制限、Issue の無効化など）。CLI は終了前にフィードバックと手動送信用 URL を再表示します。

## openspec completion

シェル補完をインストールまたは生成します。

```bash
openspec completion install        # シェルを検出し、インストールして設定
openspec completion generate zsh   # スクリプトを標準出力へ表示
```

対応シェルは`zsh`、`bash`、`fish`、`powershell`です。各サブコマンドはシェルを任意の引数として受け取ります。省略すると、CLI が環境からシェルを検出します。

| サブコマンド        | 動作                                                     |
| ------------------- | -------------------------------------------------------- |
| `generate [shell]`  | 補完スクリプトを標準出力に表示します。                   |
| `install [shell]`   | スクリプトを書き込み、シェルの起動ファイルを設定します。 |
| `uninstall [shell]` | スクリプトと設定ブロックを削除します。                   |

### openspec completion generate

スクリプトを表示します。ファイルには何も書き込みません。

```
#compdef openspec

# Zsh completion script for OpenSpec CLI
# Auto-generated - do not edit manually

_openspec() {
  local context state line
  typeset -A opt_args
...
```

### openspec completion install

スクリプトを書き込み、シェル設定を編集します。設定内容は`# OPENSPEC:START`と`# OPENSPEC:END`のマーカー間に入ります。既存のスクリプトは先に`.backup-<timestamp>`としてバックアップします。

| シェル     | スクリプトの場所                                      | 編集する設定                      |
| ---------- | ----------------------------------------------------- | --------------------------------- |
| zsh        | `~/.zsh/completions/_openspec`                        | `~/.zshrc`                        |
| bash       | `~/.local/share/bash-completion/completions/openspec` | `~/.bashrc`                       |
| fish       | `~/.config/fish/completions/openspec.fish`            | なし。fish が自動で読み込みます。 |
| powershell | プロファイルと同じ場所の`OpenSpecCompletion.ps1`      | `$PROFILE`                        |

Oh My Zsh がインストールされている場合、スクリプトは代わりに`$ZSH_CUSTOM/completions/_openspec`へ配置されます（既定は`~/.oh-my-zsh/custom/completions/_openspec`）。

**オプション**

| フラグ      | 動作                                                               |
| ----------- | ------------------------------------------------------------------ |
| `--verbose` | インストール先、バックアップ先、編集した設定ファイルも表示します。 |

**出力**

```
✓ 補完スクリプトをインストールし、.zshrc の設定が完了しました

シェルを再起動するか、exec zsh を実行してください。
```

### openspec completion uninstall

スクリプトと、マーカーで囲まれた設定ブロックを削除します。設定を変更する前に確認します（既定は No）。

**オプション**

| フラグ      | 動作               |
| ----------- | ------------------ |
| `-y, --yes` | 確認を省略します。 |

**出力**

```
✓ 補完スクリプトを削除しました: /Users/you/.zsh/completions/_openspec. ~/.zshrc から OpenSpec の設定を削除しました
```

**終了コード**

- `0`：スクリプトを生成、インストール、または削除した。アンインストールを取り消した場合も 0 で終了します。
- `1`：シェルが未対応または検出できない、あるいはインストールまたはアンインストールの処理に失敗した。

## openspec change

`show`、`list`、`validate`を名詞から始める非推奨形式です。実行するたびに警告と動詞先行コマンドを表示した後、処理を続行します。

```
警告: "openspec change ..." コマンドは非推奨です。動詞から始まるコマンド（例: "openspec list", "openspec validate --changes"）を使用してください。
警告: "openspec change list" は非推奨です。"openspec list" を使ってください。
add-rate-limit
```

| 非推奨                            | 代わりに使うコマンド                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| `openspec change show <name>`     | `openspec show <name>`                                              |
| `openspec change list`            | `openspec list`                                                     |
| `openspec change validate <name>` | `openspec validate <name>`（全変更：`openspec validate --changes`） |

各フラグは、動詞先行コマンドの節で説明しています。

## openspec spec

`show`、`list`、`validate`を名詞から始める非推奨形式です。実行するたびに警告と動詞先行コマンドを表示した後、処理を続行します。

```
警告: "openspec spec ..." コマンドは非推奨です。"openspec show" や "openspec validate --specs" など動詞先行のコマンドを使ってください。
api
```

| 非推奨                        | 代わりに使うコマンド                                            |
| ----------------------------- | --------------------------------------------------------------- |
| `openspec spec show <id>`     | `openspec show <id>`                                            |
| `openspec spec list`          | `openspec list --specs`                                         |
| `openspec spec validate <id>` | `openspec validate <id>`（全仕様：`openspec validate --specs`） |

各フラグは、動詞先行コマンドの節で説明しています。
