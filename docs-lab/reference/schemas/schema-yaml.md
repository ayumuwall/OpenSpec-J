# schema.yaml

> スキーマ定義を読み書きするための全フィールド。

`schema.yaml`は、ワークフローが作成する計画ファイルを列挙します。作成順序と実装への引き継ぎも定義します。

## Location

プロジェクトのスキーマは`openspec/schemas/<name>/`配下に置きます。

```text
openspec/schemas/review-first/
├── schema.yaml
└── templates/
    ├── proposal.md
    └── tasks.md
```

OpenSpec は次の 3 か所からディレクトリを探し、最初に一致したものを使います。

| コピー                          | ディレクトリ                              |
| ------------------------------- | ----------------------------------------- |
| **1. プロジェクト**             | `<project>/openspec/schemas/<name>/`      |
| **2. ユーザー、macOS と Linux** | `~/.local/share/openspec/schemas/<name>/` |
| **2. ユーザー、Windows**        | `%LOCALAPPDATA%\openspec\schemas\<name>\` |
| **3. パッケージ**               | CLI とともにインストールされたスキーマ    |

`XDG_DATA_HOME`を設定した場合は、すべてのプラットフォームでユーザーディレクトリが`$XDG_DATA_HOME/openspec/schemas/<name>/`へ移ります。

ディレクトリ名は、`--schema`、`config.yaml`、[`.openspec.yaml`](../configuration/change-metadata.md#schema)が使う検索キーです。`name`フィールドとディレクトリ名が異なる場合も、OpenSpec はディレクトリ名で検索します。

[`openspec schema which <name>`](../cli.md#openspec-schema-which)は、有効なディレクトリと、そのディレクトリが隠している低優先度のコピーを表示します。

## Top-level fields

| フィールド    | 契約                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `name`        | **必須。** スキーマ名として保存する空でない文字列。検索には引き続きディレクトリ名を使います。      |
| `version`     | **必須。** スキーマのリビジョンとして保存する正の整数。この値は OpenSpec の動作を変えません。      |
| `description` | `openspec schemas`が表示する任意の文字列。値がなければスキーマに説明はありません。                 |
| `artifacts`   | **必須。** 空でない[アーティファクト項目](#artifact-fields)のリスト。                              |
| `apply`       | 任意の[apply 設定](#apply-fields)。ブロックがなければ[apply の既定値](#apply-defaults)を使います。 |

## Artifact fields

`artifacts`配下の各項目は、1 つの計画ファイルまたはファイル群を定義します。

| フィールド    | 契約                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `id`          | **必須。** 依存関係、プロジェクトルール、コマンド、apply 設定で使う、一意で空でない文字列。        |
| `generates`   | **必須。** 変更フォルダ内でアーティファクトを書き込む場所をエージェントへ示す相対パスまたは glob。 |
| `description` | **必須。** エージェントへ送る指示内でアーティファクトを示す文字列。                                |
| `template`    | **必須。** スキーマの`templates/`フォルダにあるアーティファクト形式への相対パス。                  |
| `instruction` | 作成する内容をエージェントへ示す任意のガイダンス。                                                 |
| `requires`    | 先に完了している必要があるアーティファクト ID のリスト。既定値は`[]`です。                         |

### `generates`

パスは変更フォルダを起点にします。`add-auth`という変更の場合：

```yaml
generates: proposal.md
```

アーティファクトは次の場所に作成されます。

```text
openspec/changes/add-auth/proposal.md
```

glob では複数のファイルに一致できます。

```yaml
generates: specs/**/*.md
```

これは`openspec/changes/add-auth/specs/`配下の Markdown ファイルに一致します。OpenSpec は`*`、`?`、`[`を含む値を glob として扱います。

OpenSpec は絶対パスと、`..`セグメントを含むパスを拒否します。

#### Completion

OpenSpec は出力が存在するかを確認します。アーティファクトの完了判定でファイル内容は読みません。

| `generates`の値 | 完了条件                               |
| --------------- | -------------------------------------- |
| `proposal.md`   | ファイルが存在する。                   |
| `specs/**/*.md` | glob に 1 つ以上のファイルが一致する。 |

### `template`

パスはスキーマの`templates/`フォルダを起点にします。`review-first`スキーマの場合：

```yaml
template: proposal.md
```

OpenSpec は次のファイルを読み取ります。

```text
openspec/schemas/review-first/templates/proposal.md
```

OpenSpec はテンプレートの内容を出力形式としてエージェントへ渡します。変更フォルダへテンプレートをコピーすることはありません。

OpenSpec は絶対パスと、`..`セグメントを含むパスを拒否します。

### `requires`

- **依存関係**：`requires`内の各 ID は、同じスキーマにある別のアーティファクトを指定する必要があります。
- **準備完了状態**：すべての依存先が完了すると、アーティファクトは準備完了になります。
- **不正なグラフ**：ID の欠落や重複、依存関係の循環があると検証に失敗します。
- **同順位**：複数のアーティファクトが準備完了の場合は、`artifacts`内の順序で OpenSpec が最初に返すものを決めます。

## Apply fields

`apply`は、実装開始前に存在する必要があるものを定義します。

| フィールド    | 契約                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `requires`    | **必須。** apply 指示が準備完了になる前に存在する必要がある、空でないアーティファクトのリスト。                    |
| `tracks`      | 変更フォルダ内にある Markdown タスクファイルへの任意の相対パス。既定値は`null`です。                               |
| `instruction` | apply の準備が完了したときにエージェントへ送る任意のガイダンス。既定では OpenSpec の組み込みガイダンスを使います。 |

アーティファクトの`requires`は計画の順序を制御します。`apply.requires`は apply 指示が準備完了になる時点を制御します。

### `tracks`

パスは変更フォルダを起点にします。`add-auth`という変更で`tracks: tasks.md`を指定すると、次のファイルを読み取ります。

```text
openspec/changes/add-auth/tasks.md
```

ファイルがない場合や、タスク本文を含むチェックボックスがない場合、Apply はブロックされたままです。OpenSpec は次の形式のチェックボックスを数えます。

```markdown
- [ ] 未完了タスク
- [x] 完了タスク
* [X] 完了タスク
```

行頭の空白は使用できます。既定スキーマが生成する、より厳密な形式は[spec-driven ページの tasks.md セクション](spec-driven/index.md#tasksmd)で定義します。

追跡対象ファイルによって apply の状態が決まります。

- **`blocked`**：ファイルがない、またはタスク本文を含むチェックボックスがない。
- **`ready`**：追跡対象のタスクが 1 つ以上未完了。
- **`all_done`**：追跡対象のすべてのタスクがチェック済み。

OpenSpec は絶対パスと、`..`セグメントを含むパスを拒否します。

### Apply defaults

| 動作                       | 既定値                               |
| -------------------------- | ------------------------------------ |
| 必須アーティファクト       | スキーマ内のすべてのアーティファクト |
| 進捗追跡                   | 追跡対象ファイルなし                 |
| エージェント向けガイダンス | 組み込みの apply ガイダンス          |

## Complete example

```yaml
name: review-first
version: 1
description: 提案と実装のチェックリスト

artifacts:
  - id: proposal
    generates: proposal.md
    description: 変更が必要な理由と影響範囲
    template: proposal.md
    instruction: |
      問題、提案する変更、その影響を説明する。
    requires: []

  - id: tasks
    generates: tasks.md
    description: 追跡可能な実装チェックリスト
    template: tasks.md
    instruction: |
      承認済みの提案を順序付きの実装タスクへ分割する。
    requires:
      - proposal

apply:
  requires:
    - tasks
  tracks: tasks.md
  instruction: |
    未完了タスクを進め、それぞれを完了としてマークする。
```

## Validation

[`openspec schema validate <name>`](../cli.md#openspec-schema-validate)は次の項目を確認します。

- フィールドの型と必須フィールド
- 相対パス
- アーティファクト ID、依存関係、循環
- テンプレートファイル

次の誤りは検証で検出されません。

| 誤り                                                   | 動作                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| `instrution`のようにフィールド名のスペルが間違っている | OpenSpec は無視します。検証ではスペルミスを報告しません。         |
| `apply.requires`に不明なアーティファクト ID がある     | 検証では不明な ID を報告しません。                                |
| `name`がスキーマディレクトリ名と異なる                 | 検証は成功します。OpenSpec は引き続きディレクトリ名で検索します。 |
