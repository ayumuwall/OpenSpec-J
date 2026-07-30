# カスタマイズ

OpenSpec には 3 つのカスタマイズレベルがあります。

| レベル | 内容 | 向いている対象 |
|-------|--------------|----------|
| **プロジェクト設定** | デフォルト設定やコンテキスト・ルールの注入 | 多くのチーム |
| **カスタムスキーマ** | 独自のワークフローアーティファクトを定義 | 独自プロセスを持つチーム |
| **グローバル上書き** | 複数プロジェクトでスキーマを共有 | パワーユーザー |

---

<a id="project-configuration"></a>

## プロジェクト設定

`openspec/config.yaml` はチーム向けに最も手軽にカスタマイズする方法です。次ができます:

- **デフォルトスキーマを設定** — 各コマンドでの `--schema` 指定を省略
- **プロジェクトコンテキストを注入** — 技術スタックや規約などをAIへ提供
- **アーティファクト別ルールを追加** — 特定アーティファクト向けのカスタムルール
- **操作別ガイダンスを追加** — applyやarchive作業向けの助言

- **デフォルトスキーマの設定** - `--schema` を毎回付けなくてよい
- **プロジェクト文脈の注入** - 技術スタックや規約を AI に常に見せる
- **アーティファクト別ルールの追加** - 特定アーティファクト向けのルールを設定

### クイックセットアップ

```bash
openspec init
```

対話的に設定を作成します。手動で作る場合は次の通りです。

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  技術スタック: TypeScript, React, Node.js, PostgreSQL
  API スタイル: RESTful、docs/api.md に文書化
  テスト: Jest + React Testing Library
  公開 API はすべて後方互換性を重視

rules:
  proposal:
    - ロールバック計画を含める
    - 影響を受けるチームを明記
  specs:
    - Given/When/Then 形式を使う
    - 新しいパターンを作る前に既存を参照

operations:
  apply:
    guidance:
      - 全テストの前に対象を絞ったテストを実行する
  archive:
    guidance:
      - 完了時の要約は簡潔にする
```

### 仕組み

**デフォルトスキーマ:**

```bash
# 設定なしの場合
openspec new change my-feature --schema spec-driven

# 設定ありの場合 - スキーマは自動
openspec new change my-feature
```

**コンテキストとルールの注入:**

アーティファクト生成時、コンテキストとルールが AI プロンプトに注入されます。

```xml
<context>
技術スタック: TypeScript, React, Node.js, PostgreSQL
...
</context>

<rules>
- ロールバック計画を含める
- 影響を受けるチームを明記
</rules>

<template>
[スキーマの組み込みテンプレート]
</template>
```

- **コンテキスト** はすべてのアーティファクトに入ります
- **ルール** は該当アーティファクトにだけ入ります

**操作別ガイダンス:**

`operations.apply.guidance` と `operations.archive.guidance` は、エージェントが各操作をどのように進めるかを示す任意の助言配列です。`rules` とは別で、操作ガイダンスはアーティファクト内容を制約せず、アーティファクトルールが操作ガイダンスとして扱われることもありません。

applyとarchiveは実行時に次の入力を取得します。

```bash
openspec instructions apply --change my-feature --json
openspec instructions archive --change my-feature --json
```

どちらも現在のプロジェクト `context` と該当する `operationGuidance` を別々の任意フィールドとして返し、呼び出しごとに解決済みルートから最新状態を読み込みます。`--store <id>` を指定した場合、変更、コンテキスト、ガイダンスはすべて現在のリポジトリではなくそのstoreから取得します。archiveのinstructionsコマンドは読み取り専用で、仕様差分の検査・マージ、本仕様への書き込み、変更の移動、静的archiveワークフローの実行は行いません。

プロジェクトコンテキストは必須のプロンプト入力です。生成ワークフローは関連する事実・規約・制約を読み取って適用します。操作ガイダンスは任意の追加助言で、組み込みワークフローと両立し、該当する項目だけに従います。

両フィールドはCLIが管理する状態、解決済みパス、組み込み手順、明示的なユーザー選択、アーティファクトルールとは分離されます。ワークフローはコンテキストの競合を報告しつつ制御側の値を維持します。該当しない、または競合するガイダンスには従わず理由を説明します。どちらも強制的な検査ではなく、ユーザーが別途要求しない限り、実装ファイル、仕様、変更アーティファクト、要約へ内容をコピーしません。

**archiveとspec-syncの入力安全性:**

archive、bulk archive、単独syncは、`openspec status --json` の `artifactPaths.specs.existingOutputPaths` だけを仕様差分の入力元として使います。`specs` アーティファクトがないスキーマや、具体的な出力一覧が空の変更には同期対象がありません。他のアーティファクトから仕様差分を推測しません。

セマンティックマージで本仕様へ書き込む前に、現在の `openspec instructions specs --change <name> --json` 出力を使用します。返された `specs` ルールは、そのマージで生成する本仕様だけを制約します。単独archiveはこのスナップショットをインラインsyncへ渡し、単独syncは直接取得し、bulk archiveは最初の仕様書き込み前に必要なスナップショットをすべて取得します。archive/specs instructionsが0以外で終了する、またはJSONが不正な場合は空入力ではなく取得失敗として扱い、対象仕様の書き込みや変更移動の前に停止します。bulk archiveではバッチ内の書き込み・移動を始める前に停止します。

この設定は、archiveの実行フェーズ、ユーザープロンプト、ファイルシステム操作、セマンティックマージの責務、直接実行する `openspec archive` コマンド、アーティファクト `rules` の構造と出力を変更しません。

### スキーマ解決順

OpenSpec がスキーマを選ぶ順番:

1. CLI フラグ: `--schema <name>`
2. 変更メタデータ（変更フォルダの `.openspec.yaml`）
3. プロジェクト設定（`openspec/config.yaml`）
4. デフォルト（`spec-driven`）

---

<a id="custom-schemas"></a>

## カスタムスキーマ

プロジェクト設定だけでは足りない場合、独自のスキーマでワークフローを定義できます。カスタムスキーマは `openspec/schemas/` に置かれ、コードと一緒にバージョン管理されます。

```text
your-project/
├── openspec/
│   ├── config.yaml        # プロジェクト設定
│   ├── schemas/           # カスタムスキーマの置き場所
│   │   └── my-workflow/
│   │       ├── schema.yaml
│   │       └── templates/
│   └── changes/           # 変更
└── src/
```

### 既存スキーマをフォーク

最速の方法は組み込みスキーマをフォークすることです。

```bash
openspec schema fork spec-driven my-workflow
```

`spec-driven` を `openspec/schemas/my-workflow/` にコピーし、自由に編集できます。

**生成されるもの:**

```text
openspec/schemas/my-workflow/
├── schema.yaml           # ワークフロー定義
└── templates/
    ├── proposal.md       # proposal のテンプレート
    ├── spec.md           # specs のテンプレート
    ├── design.md         # design のテンプレート
    └── tasks.md          # tasks のテンプレート
```

`schema.yaml` を編集してワークフローを変更するか、テンプレートを編集して生成内容を変えます。

### ゼロから作る

完全に新しいワークフローを作成する場合:

```bash
# 対話式
openspec schema init research-first

# 非対話
openspec schema init rapid \
  --description "高速反復ワークフロー" \
  --artifacts "proposal,tasks" \
  --default
```

### スキーマ構造

スキーマはアーティファクトと依存関係を定義します。

```yaml
# openspec/schemas/my-workflow/schema.yaml
name: my-workflow
version: 1
description: チームのカスタムワークフロー

artifacts:
  - id: proposal
    generates: proposal.md
    description: 変更提案書
    template: proposal.md
    instruction: |
      この変更が「なぜ」必要かを説明する提案を作成する。
      解決策ではなく問題に焦点を当てる。
    requires: []

  - id: design
    generates: design.md
    description: 技術設計
    template: design.md
    instruction: |
      「どのように」実装するかを説明する設計書を作成する。
    requires:
      - proposal    # proposal が存在するまで design は作れない

  - id: tasks
    generates: tasks.md
    description: 実装チェックリスト
    template: tasks.md
    requires:
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
```

**主なフィールド:**

| フィールド | 目的 |
|-------|---------|
| `id` | 一意な識別子（コマンドやルールで使用） |
| `generates` | 出力ファイル名（`specs/**/*.md` のような glob も可） |
| `template` | `templates/` 内のテンプレートファイル |
| `instruction` | AI に与える指示 |
| `requires` | 依存関係（先に必要なアーティファクト） |

複数のアーティファクトが同時にreadyになった場合の作成順に `artifacts:` を並べてください。`requires` は作成可能かどうかを決め、一覧の順序は候補間の優先順位を決めます。

### テンプレート

テンプレートは AI を導く Markdown です。アーティファクト生成時にプロンプトへ注入されます。

```markdown
<!-- templates/proposal.md -->
## なぜ

<!-- この変更の動機を説明する。どんな問題を解決するか？ -->

## 何が変わるか

<!-- 変更内容を具体的に記述する。新機能や修正点を明確に。 -->

## 影響範囲

<!-- 影響を受けるコード、API、依存関係、システム -->
```

テンプレートには次を含められます:
- AI が埋めるべき見出し
- ガイドとなる HTML コメント
- 期待する構造の例

### スキーマの検証

カスタムスキーマは使用前に検証します。

```bash
openspec schema validate my-workflow
```

検証内容:
- `schema.yaml` の構文が正しいか
- 参照しているテンプレートが存在するか
- 循環依存がないか
- アーティファクト ID が有効か

### カスタムスキーマの利用

作成したスキーマは次のように使います。

```bash
# コマンドで指定
openspec new change feature --schema my-workflow

# または config.yaml でデフォルト設定
schema: my-workflow
```

### スキーマ解決のデバッグ

どのスキーマが使われているか分からない場合:

```bash
# 特定スキーマの解決元を確認
openspec schema which my-workflow

# 利用可能なスキーマを一覧
openspec schema which --all
```

出力は、プロジェクト/ユーザー/パッケージのどれから解決されたかを示します。

```text
Schema: my-workflow
Source: project
Path: /path/to/project/openspec/schemas/my-workflow
```

---

> **注:** OpenSpec は `~/.local/share/openspec/schemas/` のユーザーレベルスキーマにも対応します。ただし、`openspec/schemas/` に置く方がコードと一緒に管理できるため推奨です。

---

## 例

### 高速反復ワークフロー

高速な反復を目的とした最小ワークフロー:

```yaml
# openspec/schemas/rapid/schema.yaml
name: rapid
version: 1
description: 最小限のオーバーヘッドで高速反復

artifacts:
  - id: proposal
    generates: proposal.md
    description: 簡易提案
    template: proposal.md
    instruction: |
      この変更の簡潔な提案を作成する。
      何を・なぜに集中し、詳細な仕様は省略。
    requires: []

  - id: tasks
    generates: tasks.md
    description: 実装チェックリスト
    template: tasks.md
    requires: [proposal]

apply:
  requires: [tasks]
  tracks: tasks.md
```

### レビューアーティファクトの追加

デフォルトをフォークしてレビュー手順を追加します。

```bash
openspec schema fork spec-driven with-review
```

次のように `schema.yaml` を編集します。

```yaml
  - id: review
    generates: review.md
    description: 実装前レビューチェックリスト
    template: review.md
    instruction: |
      設計に基づくレビューチェックリストを作成する。
      セキュリティ、性能、テストの観点を含める。
    requires:
      - design

  - id: tasks
    # ... 既存の tasks 設定 ...
    requires:
      - specs
      - design
      - review    # tasks が review も必要に
```

---

<a id="community-schemas"></a>

## コミュニティスキーマ

OpenSpec は、独立したリポジトリで配布されるコミュニティ管理スキーマにも対応しています。[github/spec-kit's community extension catalog](https://github.com/github/spec-kit/tree/main/extensions) が spec-kit で担う役割と同じように、OpenSpec と他のツールやシステムを連携させる意見のあるワークフローを提供します。

コミュニティスキーマは OpenSpec core には同梱されません。それぞれ独自のリポジトリにあり、独自のリリース周期で管理されます。使う場合は、スキーマバンドルをプロジェクトの `openspec/schemas/<schema-name>/` ディレクトリへコピーしてください（各リポジトリの README にインストール手順があります）。

| スキーマ | メンテナー | リポジトリ | 説明 |
|--------|-----------|-----------|-------------|
| `superpowers-bridge` | @JiangWay | [JiangWay/openspec-schemas](https://github.com/JiangWay/openspec-schemas/tree/main/superpowers-bridge) | OpenSpec のアーティファクト管理と [obra/superpowers](https://github.com/obra/superpowers) の実行スキル（brainstorming, writing-plans, subagent 経由の TDD, code review, finishing）を統合します。Superpowers が標準では扱わない範囲を補う、証拠優先の `retrospective` アーティファクトを追加します。 |
| `nanopm` | @nmrtn | [nmrtn/nanopm](https://github.com/nmrtn/nanopm/tree/main/openspec-schema) | PM優先のワークフローです。[nanopm](https://github.com/nmrtn/nanopm) の計画パイプライン（audit → strategy → roadmap → PRD）を実装前に実行し、製品計画をOpenSpecの仕様駆動エンジニアリングへ接続します。`.nanopm/` があれば、proposalはaudit、designはstrategy、tasksはPRDの分解結果を参照します。 |
| `e2e-runbooks` | @Lukk17 | [Lukk17/openspec-schemas](https://github.com/Lukk17/openspec-schemas/tree/master/openspec/schemas/e2e-runbooks) | capability単位のE2Eテストrunbookです。各capabilityに不変のspecとtasks-template、実行ごとにタイムスタンプ付きの記録を作ります。アサーションは観測可能な振る舞い（HTTPステータス、レスポンス本文、永続化状態。ログ部分文字列は対象外）に限定し、開始・終了UTC、所要時間、LLMトークン消費量の推定を記録します。 |
| `anvil` | @jikkujoyce | [jikkujoyce/openspec-schemas](https://github.com/jikkujoyce/openspec-schemas/tree/main/schemas/anvil) | TDD規律と敵対的レビューを含む仕様駆動ワークフローです。`proposal` → `specs` → `design` → `review` → `test-plan` → `tasks` → `apply` → `verify` の順に進みます。`review` は新しいコンテキストの読み取り専用レビュアー（可能なら別モデル）が作成し、`VERDICT:` 行で `test-plan`、`tasks`、`apply` のゲートを指示します。OpenSpec自身はアーティファクトの存在だけを確認するため、ゲートはCIやhookで強制してください。`test-plan` は各specシナリオを名前付きテストへ対応付け、`verify` が監査するred/green台帳としても機能します。 |

> コミュニティスキーマを提供したい場合は、リポジトリへのリンクを含む Issue を開くか、この表に行を追加する PR を送ってください。

---

## 関連

- [CLI リファレンス: スキーマコマンド](cli.md#schema-commands) - スキーマ関連コマンド
