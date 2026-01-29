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
  Tech stack: TypeScript, React, Node.js, PostgreSQL
  API style: RESTful, documented in docs/api.md
  Testing: Jest + React Testing Library
  We value backwards compatibility for all public APIs

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
    - Reference existing patterns before inventing new ones
```

### 仕組み

**デフォルトスキーマ:**

```bash
# Without config
openspec new change my-feature --schema spec-driven

# With config - schema is automatic
openspec new change my-feature
```

**コンテキストとルールの注入:**

アーティファクト生成時、コンテキストとルールが AI プロンプトに注入されます。

```xml
<context>
Tech stack: TypeScript, React, Node.js, PostgreSQL
...
</context>

<rules>
- Include rollback plan
- Identify affected teams
</rules>

<template>
[Schema's built-in template]
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
│   ├── config.yaml        # Project config
│   ├── schemas/           # Custom schemas live here
│   │   └── my-workflow/
│   │       ├── schema.yaml
│   │       └── templates/
│   └── changes/           # Your changes
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
├── schema.yaml           # Workflow definition
└── templates/
    ├── proposal.md       # Template for proposal artifact
    ├── spec.md           # Template for specs
    ├── design.md         # Template for design
    └── tasks.md          # Template for tasks
```

`schema.yaml` を編集してワークフローを変更するか、テンプレートを編集して生成内容を変えます。

### ゼロから作る

完全に新しいワークフローを作成する場合:

```bash
# Interactive
openspec schema init research-first

# Non-interactive
openspec schema init rapid \
  --description "Rapid iteration workflow" \
  --artifacts "proposal,tasks" \
  --default
```

### スキーマ構造

スキーマはアーティファクトと依存関係を定義します。

```yaml
# openspec/schemas/my-workflow/schema.yaml
name: my-workflow
version: 1
description: My team's custom workflow

artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal document
    template: proposal.md
    instruction: |
      Create a proposal that explains WHY this change is needed.
      Focus on the problem, not the solution.
    requires: []

  - id: design
    generates: design.md
    description: Technical design
    template: design.md
    instruction: |
      Create a design document explaining HOW to implement.
    requires:
      - proposal    # Can't create design until proposal exists

  - id: tasks
    generates: tasks.md
    description: Implementation checklist
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
## Why

<!-- Explain the motivation for this change. What problem does this solve? -->

## What Changes

<!-- Describe what will change. Be specific about new capabilities or modifications. -->

## Impact

<!-- Affected code, APIs, dependencies, systems -->
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
# Specify on command
openspec new change feature --schema my-workflow

# Or set as default in config.yaml
schema: my-workflow
```

### スキーマ解決のデバッグ

どのスキーマが使われているか分からない場合:

```bash
# See where a specific schema resolves from
openspec schema which my-workflow

# List all available schemas
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
description: Fast iteration with minimal overhead

artifacts:
  - id: proposal
    generates: proposal.md
    description: Quick proposal
    template: proposal.md
    instruction: |
      Create a brief proposal for this change.
      Focus on what and why, skip detailed specs.
    requires: []

  - id: tasks
    generates: tasks.md
    description: Implementation checklist
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
    description: Pre-implementation review checklist
    template: review.md
    instruction: |
      Create a review checklist based on the design.
      Include security, performance, and testing considerations.
    requires:
      - design

  - id: tasks
    # ... existing tasks config ...
    requires:
      - specs
      - design
      - review    # Now tasks require review too
```

---

## 関連

- [CLI Reference: Schema Commands](cli.md#schema-commands) - スキーマ関連コマンド
