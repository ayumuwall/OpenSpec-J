# プロジェクト設定（config.yaml）

> openspec/config.yaml の全フィールド。このプロジェクトの計画で使うスキーマ、コンテキスト、ルールを設定する。

## 場所

各 OpenSpec プロジェクトは、プロジェクトルートの`openspec/config.yaml`に設定ファイルを置きます。

## フィールド

| キー         | 型                                         | 必須   | 動作                                                           |
| ------------ | ------------------------------------------ | ------ | -------------------------------------------------------------- |
| `schema`     | 文字列                                     | はい   | このプロジェクトの変更が従うワークフロースキーマです           |
| `context`    | 文字列                                     | いいえ | すべてのアーティファクトの指示へ挿入します                     |
| `rules`      | アーティファクト ID と文字列リストのマップ | いいえ | 1 つのアーティファクトの組み込みガイダンスへ追加するルールです |
| `operations` | 操作とガイダンスリストのマップ             | いいえ | apply と archive の作業に使う補足ガイダンスです                |
| `store`      | 文字列                                     | いいえ | `openspec/`に設定しかない場合に使う代替 OpenSpec ルートです    |
| `references` | リスト                                     | いいえ | 指示へ仕様索引を追加するストアです                             |

不正なフィールドがあってもコマンドは失敗しません。各フィールドを個別に検証し、不正な値は警告を表示して除外します。

各フィールドに書く内容は[プロジェクト設定](../../customize/project-config.md)を参照してください。

### schema

このプロジェクトのすべての変更が従うワークフロースキーマです。有効な値は`spec-driven`またはプロジェクトで定義したスキーマ名です。名前は[スキーマ](../schemas/index.md)に一覧があります。

### context

すべてのアーティファクトの指示へ挿入する自由記述です。上限は 50 KB で、それを超える値は警告を表示して無視します。

### rules

1 つのアーティファクトへ追加するルールです。スキーマの組み込みガイダンスへ追加されます。

```yaml
rules:
  proposal:
    - proposal は 500 語以内にする
```

アーティファクト ID は組み込みの名前に限定されません。カスタムスキーマのアーティファクトもキーにできます。

### operations

apply と archive の進め方に関する補足ガイダンスです。アーティファクトのルールとは別に指定します。

```yaml
operations:
  apply:
    guidance:
      - テストの要約は簡潔にする
```

読み取られるのは`apply`と`archive`だけです。

### store

OpenSpec ルートとして使うストア ID です。この`openspec/`ディレクトリに設定しかなく、`specs/`も`changes/`もない場合だけ参照します。上書きではなく代替値です。完全な優先順位は[ルート解決](../../multi-repo/stores.md#where-artifacts-get-created-when-using-stores)を参照してください。

### references

このプロジェクトの作業で仕様を参照するストア ID です。各ストアの仕様索引（ID、要約、取得コマンド）が instructions の出力へ追加されます。仕様本文は挿入されず、ルート解決にも影響しません。各項目にはストア ID、または`id`と任意の clone 元`remote`を含むマップを指定します。

```yaml
references:
  - platform-specs
  - id: billing-specs
    remote: git@github.com:acme/billing-specs.git
```

## 例

設定済みの`config.yaml`：

```yaml
schema: spec-driven

context: |
  技術スタック: TypeScript、React、Node.js
  conventional commits を使用する
  ドメイン: E コマースプラットフォーム

rules:
  proposal:
    - proposal は 500 語以内にする
    - 必ず「対象外」セクションを含める
  tasks:
    - タスクは最長 2 時間の単位に分ける

operations:
  apply:
    guidance:
      - テストの要約は簡潔にする
  archive:
    guidance:
      - 完了前に archive の結果を要約する
```

## 旧ファイル名

`config.yaml`がない場合は、`openspec/config.yml`を別名として読み取ります。両方のファイルがある場合は`config.yaml`を優先し、`config.yml`を無視します。`openspec init`は`config.yaml`を作成します。
