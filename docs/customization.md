# カスタマイズ

OpenSpec には 3 つのカスタマイズレベルがあります。

| レベル | 内容 | 向いている対象 |
|-------|--------------|----------|
| **Project Config** | デフォルト設定やコンテキスト/ルール注入 | 多くのチーム |
| **Custom Schemas** | 独自のワークフローアーティファクトを定義 | 独自プロセスを持つチーム |
| **Global Overrides** | 複数プロジェクトでスキーマを共有 | パワーユーザー |

---

## プロジェクト設定

`openspec/config.yaml` はチーム向けに最も手軽にカスタマイズする方法です。次ができます:

- **デフォルトスキーマの設定** - `--schema` を毎回付けなくてよい
- **プロジェクトコンテキストの注入** - 技術スタックや規約を AI に常に見せる
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

- **Context** はすべてのアーティファクトに入ります
- **Rules** は該当アーティファクトにだけ入ります

### スキーマ解決順

OpenSpec がスキーマを選ぶ順番:

1. CLI フラグ: `--schema <name>`
2. 変更メタデータ（変更フォルダの `.openspec.yaml`）
3. プロジェクト設定（`openspec/config.yaml`）
4. デフォルト（`spec-driven`）

---

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

> **Note:** OpenSpec は `~/.local/share/openspec/schemas/` のユーザーレベルスキーマにも対応します。ですが `openspec/schemas/` に置く方がコードと一緒に管理できるため推奨です。

---

## 例

### Rapid Iteration Workflow

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

## 関連

- [CLI Reference: Schema Commands](cli.md#schema-commands) - スキーマ関連コマンド
