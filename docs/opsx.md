# OPSX Workflow

> フィードバックは [Discord](https://discord.gg/YctCnvvshC) で歓迎しています。

## What Is It?

OPSX is now the standard workflow for OpenSpec.

It's a **fluid, iterative workflow** for OpenSpec changes. No more rigid phases — just actions you can take anytime.

## Why This Exists

The legacy OpenSpec workflow works, but it's **locked down**:

- **Instructions are hardcoded** — buried in TypeScript, you can't change them
- **All-or-nothing** — one big command creates everything, can't test individual pieces
- **Fixed structure** — same workflow for everyone, no customization
- **Black box** — when AI output is bad, you can't tweak the prompts

**OPSX opens it up.** Now anyone can:

1. **Experiment with instructions** — edit a template, see if the AI does better
2. **Test granularly** — validate each artifact's instructions independently
3. **Customize workflows** — define your own artifacts and dependencies
4. **Iterate quickly** — change a template, test immediately, no rebuild

```
Legacy workflow:                      OPSX:
┌────────────────────────┐           ┌────────────────────────┐
│  Hardcoded in package  │           │  schema.yaml           │◄── You edit this
│  (can't change)        │           │  templates/*.md        │◄── Or this
│        ↓               │           │        ↓               │
│  Wait for new release  │           │  Instant effect        │
│        ↓               │           │        ↓               │
│  Hope it's better      │           │  Test it yourself      │
└────────────────────────┘           └────────────────────────┘
```

**This is for everyone:**
- **Teams** — create workflows that match how you actually work
- **Power users** — tweak prompts to get better AI outputs for your codebase
- **OpenSpec contributors** — experiment with new approaches without releases

We're all still learning what works best. OPSX lets us learn together.

## The User Experience

**The problem with linear workflows:**
You're "in planning phase", then "in implementation phase", then "done". But real work doesn't work that way. You implement something, realize your design was wrong, need to update specs, continue implementing. Linear phases fight against how work actually happens.

**OPSX approach:**
- **Actions, not phases** — create, implement, update, archive — do any of them anytime
- **Dependencies are enablers** — they show what's possible, not what's required next

```
  proposal ──→ specs ──→ design ──→ tasks ──→ implement
```

## Setup

```bash
# Make sure you have openspec installed — skills are automatically generated
openspec init
```

This creates skills in `.claude/skills/` (or equivalent) that AI coding assistants auto-detect.

By default, OpenSpec uses the `core` workflow profile (`propose`, `explore`, `apply`, `sync`, `archive`). If you want the expanded workflow commands (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`), configure them with `openspec config profile` and apply with `openspec update`.

During setup, you'll be prompted to create a **project config** (`openspec/config.yaml`). This is optional but recommended.

## Project Configuration

Project config lets you set defaults and inject project-specific context into all artifacts.

### Creating Config

Config is created during `openspec init`, or manually:

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  API conventions: RESTful, JSON responses
  Testing: Vitest for unit tests, Playwright for e2e
  Style: ESLint with Prettier, strict TypeScript

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format for scenarios
  design:
    - Include sequence diagrams for complex flows
```

### Config Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema` | string | Default schema for new changes (e.g., `spec-driven`) |
| `context` | string | Project context injected into all artifact instructions |
| `rules` | object | Per-artifact rules, keyed by artifact ID |

### How It Works

**Schema precedence** (highest to lowest):
1. CLI flag (`--schema <name>`)
2. Change metadata (`.openspec.yaml` in change directory)
3. Project config (`openspec/config.yaml`)
4. Default (`spec-driven`)

**Context injection:**
- Context is prepended to every artifact's instructions
- Wrapped in `<context>...</context>` tags
- Helps AI understand your project's conventions

**Rules injection:**
- Rules are only injected for matching artifacts
- Wrapped in `<rules>...</rules>` tags
- Appear after context, before the template

### Artifact IDs by Schema

**spec-driven** (default):
- `proposal` — Change proposal
- `specs` — Specifications
- `design` — Technical design
- `tasks` — Implementation tasks

### Config Validation

- Unknown artifact IDs in `rules` generate warnings
- Schema names are validated against available schemas
- Context has a 50KB size limit
- Invalid YAML is reported with line numbers

### Troubleshooting

**"Unknown artifact ID in rules: X"**
- Check artifact IDs match your schema (see list above)
- Run `openspec schemas --json` to see artifact IDs for each schema

**Config not being applied:**
- Ensure file is at `openspec/config.yaml` (not `.yml`)
- Check YAML syntax with a validator
- Config changes take effect immediately (no restart needed)

**Context too large:**
- Context is limited to 50KB
- Summarize or link to external docs instead

## コマンド

| Command | What it does |
|---------|--------------|
| `/opsx:propose` | Create a change and generate planning artifacts in one step (default quick path) |
| `/opsx:explore` | Think through ideas, investigate problems, clarify requirements |
| `/opsx:new` | Start a new change scaffold (expanded workflow) |
| `/opsx:continue` | Create the next artifact (expanded workflow) |
| `/opsx:ff` | Fast-forward planning artifacts (expanded workflow) |
| `/opsx:apply` | Implement tasks, updating artifacts as needed |
| `/opsx:update` | Revise a change's planning artifacts and keep them coherent |
| `/opsx:verify` | Validate implementation against artifacts (expanded workflow) |
| `/opsx:sync` | Sync delta specs to main (default workflow, optional) |
| `/opsx:archive` | Archive when done |
| `/opsx:bulk-archive` | Archive multiple completed changes (expanded workflow) |
| `/opsx:onboard` | Guided walkthrough of an end-to-end change (expanded workflow) |

## Usage

### Explore an idea
```
/opsx:explore
```
Think through ideas, investigate problems, compare options. No structure required - just a thinking partner. When insights crystallize, transition to `/opsx:propose` (default) or `/opsx:new`/`/opsx:ff` (expanded).

### Start a new change
```
/opsx:propose
```
Creates the change and generates planning artifacts needed before implementation.

If you've enabled expanded workflows, you can instead use:

```text
/opsx:new        # scaffold only
/opsx:continue   # create one artifact at a time
/opsx:ff         # create all planning artifacts at once
```

### Create artifacts
```
/opsx:continue
```
Shows what's ready to create based on dependencies, then creates one artifact. Use repeatedly to build up your change incrementally.

```
/opsx:ff add-dark-mode
```
Creates all planning artifacts at once. Use when you have a clear picture of what you're building.

### Implement (the fluid part)
```
/opsx:apply
```
Works through tasks, checking them off as you go. If you're juggling multiple changes, you can run `/opsx:apply <name>`; otherwise it should infer from the conversation and prompt you to choose if it can't tell.

### Updating a change
```
/opsx:update add-dark-mode - we're storing the theme in a cookie now
```
既存の計画成果物を改訂し、全体の整合性を保ちます。設計の修正が提案へ戻るように、どの方向にも波及できます。対象は計画成果物だけです。コードは編集せず、存在しない成果物も作りません（それは `/opsx:continue` の役割です）。各編集は、先にユーザーへ確認します。すでに実装済みの変更であれば、改訂後の計画にコードを追従させるため `/opsx:apply` を勧めます。改訂によって変更の *意図* が変わる場合は、新しい変更として始めてください。詳しくは [更新するか、新しく始めるか](#when-to-update-vs-start-fresh) を参照してください。

### Finish up
```
/opsx:archive   # Move to archive when done (prompts to sync specs if needed)
```

## When to Update vs. Start Fresh

You can always edit your proposal or specs before implementation. But when does refining become "this is different work"?

### What a Proposal Captures

A proposal defines three things:
1. **Intent** — What problem are you solving?
2. **Scope** — What's in/out of bounds?
3. **Approach** — How will you solve it?

The question is: which changed, and by how much?

### Update the Existing Change When:

**Same intent, refined execution**
- You discover edge cases you didn't consider
- The approach needs tweaking but the goal is unchanged
- Implementation reveals the design was slightly off

**Scope narrows**
- You realize full scope is too big, want to ship MVP first
- "Add dark mode" → "Add dark mode toggle (system preference in v2)"

**Learning-driven corrections**
- Codebase isn't structured how you thought
- A dependency doesn't work as expected
- "Use CSS variables" → "Use Tailwind's dark: prefix instead"

### Start a New Change When:

**Intent fundamentally changed**
- The problem itself is different now
- "Add dark mode" → "Add comprehensive theme system with custom colors, fonts, spacing"

**Scope exploded**
- Change grew so much it's essentially different work
- Original proposal would be unrecognizable after updates
- "Fix login bug" → "Rewrite auth system"

**Original is completable**
- The original change can be marked "done"
- New work stands alone, not a refinement
- Complete "Add dark mode MVP" → Archive → New change "Enhance dark mode"

### The Heuristics

```
                        ┌─────────────────────────────────────┐
                        │     Is this the same work?          │
                        └──────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             Same intent?      >50% overlap?      Can original
             Same problem?     Same scope?        be "done" without
                    │                  │          these changes?
                    │                  │                  │
          ┌────────┴────────┐  ┌──────┴──────┐   ┌───────┴───────┐
          │                 │  │             │   │               │
         YES               NO YES           NO  NO              YES
          │                 │  │             │   │               │
          ▼                 ▼  ▼             ▼   ▼               ▼
       UPDATE            NEW  UPDATE       NEW  UPDATE          NEW
```

| テスト | 更新 | 新しい変更 |
|------|--------|------------|
| **同一性** | 「同じものを洗練している」 | 「別の作業」 |
| **スコープの重なり** | 50% 超が重なる | 50% 未満しか重ならない |
| **完了可能性** | 変更なしでは「完了」にできない | 元の変更を完了でき、新作業が独立する |
| **履歴の読みやすさ** | 更新の連鎖が一貫した物語になる | パッチを重ねると明確さより混乱が増える |

### 原則

> **更新は文脈を保ち、新しい変更は明確さをもたらします。**
>
> 思考の履歴に価値があるなら更新を選びます。
> パッチを重ねるより最初から始めた方が明確なら、新しい変更を選びます。

Git ブランチのように考えてください。
- 同じ機能に取り組んでいる間はコミットを続ける
- 本当に新しい作業なら新しいブランチを始める
- 場合によっては部分的な機能をマージし、フェーズ 2 として新しく始める

## 何が違うのか

| | Legacy (`/openspec:proposal`) | OPSX (`/opsx:*`) |
|---|---|---|
| **構造** | 大きな proposal 文書 1 つ | 依存関係を持つ個別アーティファクト |
| **ワークフロー** | 線形フェーズ: plan → implement → archive | 流動的なアクション。いつでも何でもできる |
| **反復** | 戻りづらい | 学びに応じてアーティファクトを更新 |
| **カスタマイズ** | 固定構造 | スキーマ駆動（独自アーティファクトを定義） |

**重要な洞察:** 作業は線形ではありません。OPSX は線形であるふりをやめます。

## アーキテクチャ詳細

このセクションでは、OPSX が内部でどう動くか、旧ワークフローとどう違うかを説明します。
このセクションの例では拡張コマンドセット（`new`, `continue` など）を使います。既定の `core` ユーザーは、同じ流れを `propose → apply → sync → archive` に対応づけて読めます。

### 哲学: フェーズではなくアクション

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEGACY WORKFLOW                                      │
│                    (Phase-Locked, All-or-Nothing)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│   │   PLANNING   │ ───► │ IMPLEMENTING │ ───► │   ARCHIVING  │             │
│   │    PHASE     │      │    PHASE     │      │    PHASE     │             │
│   └──────────────┘      └──────────────┘      └──────────────┘             │
│         │                     │                     │                       │
│         ▼                     ▼                     ▼                       │
│   /openspec:proposal   /openspec:apply      /openspec:archive              │
│                                                                             │
│   • Creates ALL artifacts at once                                          │
│   • Can't go back to update specs during implementation                    │
│   • Phase gates enforce linear progression                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPSX WORKFLOW                                     │
│                      (Fluid Actions, Iterative)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              ┌────────────────────────────────────────────┐                 │
│              │           アクション（フェーズではない）   │                 │
│              │                                            │                 │
│              │   new ◄──► continue ◄──► apply ◄──► archive │                 │
│              │    │          │           │           │    │                 │
│              │    └──────────┴───────────┴───────────┘    │                 │
│              │              任意の順序                    │                 │
│              └────────────────────────────────────────────┘                 │
│                                                                             │
│   • アーティファクトを 1 つずつ作成、または fast-forward                  │
│   • 実装中に specs/design/tasks を更新                                     │
│   • 進捗は依存関係で制御し、フェーズは存在しない                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### コンポーネントアーキテクチャ

**旧ワークフロー** は TypeScript 内のハードコードされたテンプレートを使います。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LEGACY WORKFLOW COMPONENTS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Hardcoded Templates (TypeScript strings)                                  │
│                    │                                                        │
│                    ▼                                                        │
│   Tool-specific configurators/adapters                                      │
│                    │                                                        │
│                    ▼                                                        │
│   Generated Command Files (.claude/commands/openspec/*.md)                  │
│                                                                             │
│   • Fixed structure, no artifact awareness                                  │
│   • Change requires code modification + rebuild                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**OPSX** は外部スキーマと依存グラフエンジンを使います。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPSX COMPONENTS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Schema Definitions (YAML)                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  name: spec-driven                                                  │   │
│   │  artifacts:                                                         │   │
│   │    - id: proposal                                                   │   │
│   │      generates: proposal.md                                         │   │
│   │      requires: []              ◄── Dependencies                     │   │
│   │    - id: specs                                                      │   │
│   │      generates: specs/**/*.md  ◄── Glob patterns                    │   │
│   │      requires: [proposal]      ◄── Enables after proposal           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Artifact Graph Engine                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Topological sort (dependency ordering)                           │   │
│   │  • State detection (filesystem existence)                           │   │
│   │  • Rich instruction generation (templates + context)                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Skill Files (.claude/skills/openspec-*/SKILL.md)                          │
│                                                                             │
│   • Cross-editor compatible (Claude Code, Cursor, Windsurf)                 │
│   • Skills query CLI for structured data                                    │
│   • Fully customizable via schema files                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 依存グラフモデル

アーティファクトは有向非巡回グラフ（DAG）を形成します。依存関係はゲートではなく、**次を可能にする条件**です。

```
                              proposal
                             (root node)
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
                 specs                       design
              (requires:                  (requires:
               proposal)                   proposal)
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                               tasks
                           (requires:
                           specs, design)
                                  │
                                  ▼
                          ┌──────────────┐
                          │ APPLY PHASE  │
                          │ (requires:   │
                          │  tasks)      │
                          └──────────────┘
```

**状態遷移:**

```
   BLOCKED ────────────────► READY ────────────────► DONE
      │                        │                       │
   依存関係が                すべての依存が            ファイルが
   不足                      DONE                   ファイルシステム上に存在
```

### 情報の流れ

**旧ワークフロー** — エージェントは静的な指示を受け取ります。

```
  User: "/openspec:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  静的な指示:                            │
  │  • proposal.md を作成                   │
  │  • tasks.md を作成                      │
  │  • design.md を作成                     │
  │  • specs/<capability>/spec.md を作成    │
  │                                         │
  │  既存ファイルやアーティファクト間の      │
  │  依存関係を把握できない                 │
  └─────────────────────────────────────────┘
           │
           ▼
  エージェントが全アーティファクトを一度に作成
```

**OPSX** — エージェントは豊富な文脈を問い合わせます。

```
  User: "/opsx:continue"
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  Step 1: 現在の状態を問い合わせる                                       │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec status --change "add-auth" --json                      │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "artifacts": [                                                  │  │
  │  │      {"id": "proposal", "status": "done"},                         │  │
  │  │      {"id": "specs", "status": "ready"},      ◄── 最初に ready     │  │
  │  │      {"id": "design", "status": "ready"},                          │  │
  │  │      {"id": "tasks", "status": "blocked", "missingDeps": ["specs"]}│  │
  │  │    ]                                                               │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 2: ready なアーティファクト向けの詳しい指示を取得                 │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec instructions specs --change "add-auth" --json          │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "template": "# Specification\n\n## ADDED Requirements...",      │  │
  │  │    "dependencies": [{"id": "proposal", "path": "...", "done": true}│  │
  │  │    "unlocks": ["tasks"]                                            │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 3: 依存を読む → 1 つだけ作成 → unlock されたものを表示             │
  └──────────────────────────────────────────────────────────────────────────┘
```

### 反復モデル

**旧ワークフロー** — 反復しづらい構造です。

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │/proposal│ ──► │ /apply  │ ──► │/archive │
  └─────────┘     └─────────┘     └─────────┘
       │               │
       │               ├── "待って、設計が間違っている"
       │               │
       │               ├── 選択肢:
       │               │   • 手動でファイルを編集（文脈が壊れる）
       │               │   • 破棄してやり直す
       │               │   • そのまま進めて後で修正
       │               │
       │               └── 公式の「戻る」仕組みはない
       │
       └── 全アーティファクトを一度に作成
```

**OPSX** — 自然に反復できます。

```
  /opsx:new ───► /opsx:continue ───► /opsx:apply ───► /opsx:archive
      │                │                  │
      │                │                  ├── "設計が間違っている"
      │                │                  │
      │                │                  ▼
      │                │            Just edit design.md
      │                │            and continue!
      │                │                  │
      │                │                  ▼
      │                │         /opsx:apply picks up
      │                │         where you left off
      │                │
      │                └── Creates ONE artifact, shows what's unlocked
      │
      └── Scaffolds change, waits for direction
```

### カスタムスキーマ

スキーマ管理コマンドを使ってカスタムワークフローを作成できます。

```bash
# ゼロから新しいスキーマを作成（対話）
openspec schema init my-workflow

# 既存スキーマを出発点としてフォーク
openspec schema fork spec-driven my-workflow

# スキーマ構造を検証
openspec schema validate my-workflow

# スキーマがどこから解決されるか確認（デバッグに便利）
openspec schema which my-workflow
```

スキーマは `openspec/schemas/`（プロジェクトローカル、バージョン管理対象）または `~/.local/share/openspec/schemas/`（ユーザーグローバル）に保存されます。

**スキーマ構造:**
```
openspec/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md
```

**schema.yaml の例:**
```yaml
name: research-first
artifacts:
  - id: research        # Added before proposal
    generates: research.md
    requires: []

  - id: proposal
    generates: proposal.md
    requires: [research]  # Now depends on research

  - id: tasks
    generates: tasks.md
    requires: [proposal]
```

**依存グラフ:**
```
   research ──► proposal ──► tasks
```

### まとめ

| 観点 | 旧ワークフロー | OPSX |
|--------|----------|------|
| **テンプレート** | ハードコードされた TypeScript | 外部 YAML + Markdown |
| **依存関係** | なし（一括生成） | トポロジカルソート付き DAG |
| **状態** | フェーズベースの考え方 | ファイルシステム上の存在 |
| **カスタマイズ** | ソースを編集して再ビルド | schema.yaml を作成 |
| **反復** | フェーズ固定 | 流動的。何でも編集できる |
| **エディタ対応** | ツール固有の configurator / adapter | 単一の skills ディレクトリ |

## スキーマ

スキーマは、存在するアーティファクトとその依存関係を定義します。現在利用できるもの:

- **spec-driven**（デフォルト）: proposal → specs → design → tasks

```bash
# 利用可能なスキーマを一覧表示
openspec schemas

# すべてのスキーマと解決元を表示
openspec schema which --all

# 対話的に新しいスキーマを作成
openspec schema init my-workflow

# カスタマイズのため既存スキーマをフォーク
openspec schema fork spec-driven my-workflow

# 利用前にスキーマ構造を検証
openspec schema validate my-workflow
```

## ヒント

- 変更に入る前に考えを整理したいときは `/opsx:explore` を使う
- 作りたいものが明確なら `/opsx:ff`、探索しながら進めるなら `/opsx:continue`
- `/opsx:apply` 中に問題が見つかったら、アーティファクトを直してから続ける
- タスクの進捗は `tasks.md` のチェックボックスで追跡する
- 状態はいつでも `openspec status --change "name"` で確認できる

## フィードバック

この仕組みはまだ粗い部分があります。それは意図的です。何がうまく機能するかを学んでいる段階です。

バグを見つけた、またはアイデアがある場合は、[Discord](https://discord.gg/YctCnvvshC) に参加するか、[GitHub](https://github.com/ayumuwall/OpenSpec-J/issues) で Issue を開いてください。
