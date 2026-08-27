# spec-driven

> 既定ワークフローのアーティファクト、その順序、形式、作成される変更フォルダ。

`spec-driven`は OpenSpec 組み込みの既定スキーマです。設定するフィールドは[schema.yaml](../schema-yaml.md)で定義します。

## アーティファクト

このワークフローは 4 つのアーティファクトを作成します。

| アーティファクト               | ファイル                                                  | 目的               |
| ------------------------------ | --------------------------------------------------------- | ------------------ |
| [`proposal`](#proposalmd)      | `proposal.md`                                             | 変更が必要な理由   |
| [`specs`](#delta-specs-specmd) | `specs/<capability-path>/spec.md`、機能ごとに 1 つ | 変わる振る舞い     |
| [`design`](#designmd)          | `design.md`                                               | 実装方法           |
| [`tasks`](#tasksmd)            | `tasks.md`                                                | 実装チェックリスト |

## 作成順序

```text
             ┌─ specs ──┐
proposal ────┤          ├── tasks ── apply
             └─ design ─┘
```

最初に proposal を作成します。次に specs と design をどちらの順序でも作成でき、tasks にはその両方が必要です。`tasks.md`ができると実装（[apply](#apply)）を開始できます。

次の 2 つのアーティファクトは省略できます。

- **`design`**：[作成条件](#designmd)に 1 つも該当しない場合、エージェントは省略して`tasks`を作成します。
- **`specs`**：変更の`.openspec.yaml`へ[`skip_specs: true`](../../configuration/change-metadata.md#skip_specs)を設定します。

## 変更フォルダの例

`add-user-auth`という変更です。すべてのアーティファクトを作成しています。

```text
openspec/changes/add-user-auth/
├── .openspec.yaml      変更作成時に書き込む変更メタデータ
├── proposal.md
├── specs/
│   └── user-auth/
│       └── spec.md     機能ごとに 1 つのデルタ仕様
├── design.md
└── tasks.md
```

## proposal.md

変更が必要な理由を明確にします。

### 構造

エージェントが出力形式として受け取るテンプレート（[templates/proposal.md](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/templates/proposal.md)）：

```md
## Why

<!-- この変更の動機を説明します。どんな問題を解決するのか、なぜ今なのか。 -->

## What Changes

<!-- 何が変わるのかを説明します。新しい機能/変更/削除を具体的に。 -->

## Capabilities

### 新しい能力
<!-- 導入する機能。プロジェクトの既存の仕様構成に従い、新しく導入するパス区切りは
     kebab-case にします（例: user-auth または identity/user-auth）。各項目は
     specs/<capability-path>/spec.md を作成します。 -->
- `<capability-path>`: <この機能が対象にする内容の簡潔な説明>

### 変更する機能
<!-- REQUIREMENTS が変わる既存機能（実装のみの変更なら不要）。
     仕様レベルの振る舞いが変わる場合だけ記載してください。各項目には仕様差分ファイルが必要です。
     openspec/specs/ 内の既存パスを正確に使用します。要件変更がなければ空にしてください。
     機能をまったく含まない変更（純粋なリファクタリング、ツール、文書）は
     .openspec.yaml に `skip_specs: true` を設定する必要があります。この指定がない
     仕様差分ゼロの変更は openspec validate で拒否されます。検証を通すためだけに
     要件を作らないでください。 -->
- `<existing-capability-path>`: <変更する要件>

## Impact

<!-- 影響するコード、API、依存関係、システム -->
```

### 指示

このアーティファクトの作成時にエージェントへ送る指示（[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)）：

```md
この変更がなぜ必要か（WHY）を明確にする提案ドキュメントを作成する。

セクション:
- **Why**: 問題または機会を 1〜2 文で示す。どの問題を、なぜ今解決するのか。
- **What Changes**: 変更の箇条書き。新機能、変更、削除を具体的に示す。破壊的変更には **BREAKING** を付ける。
- **Capabilities**: 作成または変更する仕様を特定する:
  - **New Capabilities**: 導入する機能を列挙する。各項目は `specs/<capability-path>/spec.md` になる。新しく導入するパス区切りは kebab-case にし（例: `user-auth` または `identity/user-auth`）、プロジェクトの既存の仕様構成に従う。
  - **Modified Capabilities**: REQUIREMENTS が変わる既存機能を列挙する。実装詳細だけでなく、仕様レベルの振る舞いが変わる場合に限る。各項目には仕様差分ファイルが必要。`openspec/specs/` 内の既存パスを正確に使い、要件変更がなければ空にする。
- **Impact**: 影響するコード、API、依存関係、システム。

重要: Capabilities セクションは必須。proposal と specs フェーズの間の契約になる。
記入前に既存の仕様を調査すること。
ここに書いた各機能には対応する spec ファイルが必要になる。

すべての変更は、1 つ以上の機能（新規または変更）を宣言するか、仕様を明示的に
対象外にする必要がある。仕様差分が 0 件の場合、変更の `.openspec.yaml` に
`skip_specs: true` がなければ `openspec validate` は拒否する。
`skip_specs: true` は仕様レベルの振る舞いが変わらない場合（純粋な
リファクタリング、ツール、文書）だけ使う。検証を通すためだけに要件を作らない。

簡潔に（1〜2 ページ）。「なぜ（why）」に集中し、「どう実装するか」は design.md に書く。

これは土台であり、specs / design / tasks はすべてこれに基づく。
```

## Delta specs (spec.md)

変わる振る舞いを定義します。proposal に列挙した機能ごとに 1 つのデルタ仕様を作成します。

### 構造

エージェントが出力形式として受け取るテンプレート（[templates/spec.md](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/templates/spec.md)）：

```md
## Purpose
<!-- 新しい機能の場合のみ: この機能の目的を1〜2文（50文字以上）で記述します。既存の機能では、このセクションを削除してください。 -->

## ADDED Requirements

### Requirement: <!-- 要件名 -->
<!-- 要件の説明 -->

#### Scenario: <!-- シナリオ名 -->
- **WHEN** <!-- 条件 -->
- **THEN** <!-- 期待結果 -->
```

### 指示

このアーティファクトの作成時にエージェントへ送る指示（[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)）：

````md
システムが何をするか（WHAT）を定義する仕様ファイルを作成する。

spec は実装計画ではなく、振る舞いの契約である。

適切な内容:
- ユーザーや下流システムが依存する観測可能な振る舞い
- 入力、出力、エラー条件
- 外部制約（セキュリティ、プライバシー、信頼性、互換性）
- テストまたは明示的に検証できるシナリオ

含めない内容:
- 内部のクラス名・関数名
- ライブラリやフレームワークの選択
- 段階的な実装詳細
- 詳細な実行計画（design.md または tasks.md に書く）

実装を変えても外部から見える振る舞いが変わらないなら、spec には含めない。

proposal の Capabilities セクションに列挙された機能ごとに、仕様ファイルを 1 つ作成する。
`<capability-path>`は`specs/`からの相対仕様ディレクトリ（例：
`user-auth`または`identity/user-auth`）。完全なパスを維持する:
- 新機能: proposal の`specs/<capability-path>/spec.md`に記載したパスをそのまま使う。proposal で新設するパス区切りは kebab-case にする。プロジェクトの既存構成に従い、フラットな構成なら新しいドメイン階層を加えない。
- 変更機能: `specs/<capability-path>/spec.md`に仕様差分を作成するとき、`openspec/specs/<capability-path>/`の既存パスを正確に使う。機能を移動・改名しない。

`.openspec.yaml`に`skip_specs: true`（仕様レベルの振る舞い変更なし）が
設定されていない限り、少なくとも 1 つの spec ファイルが必要である。
proposal に機能がなく`skip_specs`もない場合は、先に proposal を見直す。

差分操作（## 見出しを使用）:
- **ADDED Requirements**: 新しい機能
- **MODIFIED Requirements**: 振る舞い変更。MUST で全文更新する
- **REMOVED Requirements**: 廃止機能。**Reason**と**Migration**を必ず記載
- **RENAMED Requirements**: 名称変更のみ。FROM:/TO: 形式

書式ルール:
- 各要件: `### Requirement: <name>`の後に本文を書く
- 規範要件は SHALL/MUST を使う（should/may は避ける）
- 各シナリオ: `#### Scenario: <name>`を WHEN/THEN 形式で書く
- **CRITICAL**: シナリオは必ず 4 つのハッシュ（`####`）を使う。3 つや箇条書きにすると静かに失敗する。
- すべての要件は少なくとも 1 つのシナリオを持つ。

新機能の場合だけ、仕様差分を`## Purpose`セクションから始める。機能の目的を 1〜2 文（50 文字以上。
`openspec validate --strict`では短すぎると報告される）で説明する。アーカイブ時に作成する本仕様へコピーされる。
ない場合は、新しい本仕様に`TBD ... Update Purpose after archive`のプレースホルダーが残り、手動で記入する必要がある。
既存機能の仕様差分には`## Purpose`を加えない。その仕様にはすでに存在し、差分側は無視される。既存機能の Purpose（残った`TBD`プレースホルダーを含む）を変更する場合は、`openspec/specs/<capability-path>/spec.md`を直接編集する。

MODIFIED 要件の手順:
1. openspec/specs/<capability-path>/spec.md から既存の要件を見つける
2. 要件ブロック全体（`### Requirement:`からすべてのシナリオまで）をコピーする
3. `## MODIFIED Requirements`の下へ貼り付け、新しい振る舞いを反映するよう編集する
4. 見出しテキストが正確に一致することを確認する（空白は区別しない）

よくある落とし穴: MODIFIED で部分的に書くとアーカイブ時に詳細が失われる。
既存の振る舞いを変えずに追加するなら ADDED を使う。

例（新しい機能なので`## Purpose`から始める）:
```
## Purpose

ユーザーがポータブルな形式で製品からデータを取り出せるようにする。

## ADDED Requirements

### Requirement: ユーザーはデータをエクスポートできる
システムはユーザーが CSV 形式でデータをエクスポートできるようにしなければならない。(SHALL)

#### Scenario: エクスポート成功
- **WHEN** ユーザーが「エクスポート」ボタンをクリックする
- **THEN** システムは全ユーザーデータを含む CSV ファイルをダウンロードする

## REMOVED Requirements

### Requirement: 旧エクスポート
**Reason**: 新しいエクスポートシステムに置き換え
**Migration**: /api/v2/export の新しいエクスポートエンドポイントを使用
```

仕様はテスト可能にすること。各シナリオは潜在的なテストケースになる。
````

## design.md

変更の実装方法を説明します。必要な変更でだけ作成します。

### 構造

エージェントが出力形式として受け取るテンプレート（[templates/design.md](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/templates/design.md)）：

```md
## Context

<!-- アプローチを決める背景・現状・制約。動機は proposal.md を参照し、ここでは繰り返さない -->

## Goals / Non-Goals

**Goals:**
<!-- この設計で達成したいこと -->

**Non-Goals:**
<!-- 明確にスコープ外とすること -->

## Decisions

<!-- 主要な設計判断、その理由、検討した代替案 -->

## Risks / Trade-offs

<!-- 既知のリスクとトレードオフ -->
```

### 指示

このアーティファクトの作成時にエージェントへ送る指示（[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)）：

```md
変更をどう実装するか（HOW）を説明する設計ドキュメントを作成する。

design.md を作成する条件（該当する場合のみ作成）:
- 横断的変更（複数サービス/モジュール）または新しいアーキテクチャパターン
- 新しい外部依存、または大きなデータモデル変更
- セキュリティ、パフォーマンス、移行の複雑さ
- 実装前に技術判断が必要な曖昧さ

セクション:
- **Context**: アプローチの説明に必要な現状と制約だけを書く。動機は proposal を参照する
- **Goals / Non-Goals**: 設計レベルの境界だけを書き、proposal のスコープを繰り返さない
- **Decisions**: 主要な技術判断と理由（なぜ X ではなく Y か）。各判断に代替案の検討も含める。
- **Risks / Trade-offs**: 既知の制約や失敗しうる点。形式: [Risk] → Mitigation
- **Migration Plan**: デプロイ手順、ロールバック戦略（該当する場合）
- **Open Questions**: specs、アプローチ、タスク分解を変えず後で安全に回答できる未決事項。なければ省略

Open Questions は先送りできる未知事項のためのもので、未判断の代用ではない。
specs、アプローチ、タスク分解を変える問いは、推測せず今ユーザーへ確認する。

行ごとの実装詳細ではなく、アーキテクチャと方針に集中する。
why と what は proposal、how は design、要件は specs を参照し、内容を繰り返さない。

良い設計ドキュメントは技術判断の「なぜ」を説明する。
```

## tasks.md

実装を確認可能なタスクへ分割します。[apply](#apply)はこのファイルで進捗を追跡します。

### 構造

エージェントが出力形式として受け取るテンプレート（[templates/tasks.md](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/templates/tasks.md)）：

```md
## 1. <!-- タスクグループ名 -->

- [ ] 1.1 <!-- タスク内容 -->
- [ ] 1.2 <!-- タスク内容 -->

## 2. <!-- タスクグループ名 -->

- [ ] 2.1 <!-- タスク内容 -->
- [ ] 2.2 <!-- タスク内容 -->
```

### 指示

このアーティファクトの作成時にエージェントへ送る指示（[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)）：

````md
実装作業を分解したタスクリストを作成する。

tasks を書く前に design.md の Open Questions を確認する。実装内容を変える問いがあれば、
暗黙の仮定をタスクリストへ入れず、先にユーザーと解決する。

**IMPORTANT: 下記テンプレートに厳密に従う。** apply フェーズは
チェックボックス形式を解析して進捗を追跡する。`- [ ]`を使わないタスクは追跡されない。

ガイドライン:
- 関連タスクを ## 番号付き見出し配下にまとめる
- 各タスクは必ずチェックボックス: `- [ ] X.Y タスク内容`
- 1 セッションで終わる大きさにする
- 依存順に並べる（最初にやるべきものから）

例:
```
## 1. セットアップ

- [ ] 1.1 新しいモジュール構成を作成する
- [ ] 1.2 package.json に依存関係を追加する

## 2. コア実装

- [ ] 2.1 データエクスポート関数を実装する
- [ ] 2.2 CSV 変換ユーティリティを追加する
```

何を作るかは specs、どう作るかは design を参照する。
各タスクは完了を判断できるようにする。
````

## Apply

計画から実装への引き継ぎです。Apply は`tasks.md`を進めるフェーズであり、アーティファクトではありません。

- **開始**：`tasks.md`が存在し、1 つ以上のタスクが記載されている。
- **追跡**：`tasks.md`内のチェックボックス。チェックした項目が進捗記録になります。
- **終了**：すべてのチェックボックスがチェック済み。OpenSpec は変更のアーカイブを提案します。

### 設定

apply 設定（[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)）：

```yaml
apply:
  requires: [tasks]
  tracks: tasks.md
  # instruction: 下記に表示
```

### 指示

実装開始時にエージェントへ送る指示（[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)）：

```md
コンテキストファイルを読み、未完了タスクを進め、進捗に合わせて完了マークする。
ブロッカーや不明点があれば一旦止めて確認する。
```

## schema.yaml

完全な[schema.yaml](https://github.com/ayumuwall/OpenSpec-J/blob/main/schemas/spec-driven/schema.yaml)です。指示本文は省略し、各節で全文を示しています。

```yaml
name: spec-driven
version: 1
description: OpenSpec の既定ワークフロー - proposal → specs → design → tasks
artifacts:
  - id: proposal
    generates: proposal.md
    description: 変更の概要を示す初期提案ドキュメント
    template: proposal.md
    # instruction: 上記 proposal.md に全文を表示
    requires: []

  - id: specs
    generates: "specs/**/*.md"
    description: 変更の詳細仕様
    template: spec.md
    # instruction: 上記「デルタ仕様」に全文を表示
    requires:
      - proposal

  - id: design
    generates: design.md
    description: 実装詳細を含む技術設計ドキュメント
    template: design.md
    # instruction: 上記 design.md に全文を表示
    requires:
      - proposal

  - id: tasks
    generates: tasks.md
    description: 進捗追跡できる実装チェックリスト
    template: tasks.md
    # instruction: 上記 tasks.md に全文を表示
    requires:
      - specs
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
  # instruction: 上記 Apply に全文を表示
```
