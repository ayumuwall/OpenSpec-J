# 実験的ワークフロー（OPSX）

> **ステータス:** 実験的です。壊れる可能性があります。フィードバックは [Discord](https://discord.gg/BYjPaKbqMt) へ。
>
> **互換性:** 現時点では Claude Code のみ

## 概要

OPSX は OpenSpec の変更に対する**流動的で反復的なワークフロー**です。固定のフェーズではなく、いつでも実行できるアクションで進めます。

## なぜ必要か

標準の OpenSpec ワークフローは機能しますが、**固定されている**点が課題です。

- **手順がハードコード** — TypeScript 内に埋め込まれており変更できない
- **一括実行** — 1 つのコマンドで全部作るため、個別にテストできない
- **固定構造** — 全員同じワークフローでカスタマイズできない
- **ブラックボックス** — AI の出力が悪いときにプロンプトを調整できない

**OPSX で開かれます。** これにより誰でも次のことが可能になります。

1. **指示を試せる** — テンプレートを編集し、AI の出力が改善するか確認
2. **粒度細かくテスト** — アーティファクトごとに手順を独立して検証
3. **ワークフローのカスタマイズ** — 独自のアーティファクトと依存関係を定義
4. **素早く反復** — テンプレートを変えて即テスト、ビルド不要

```
Standard workflow:                    OPSX:
┌────────────────────────┐           ┌────────────────────────┐
│  Hardcoded in package  │           │  schema.yaml           │◄── You edit this
│  (can't change)        │           │  templates/*.md        │◄── Or this
│        ↓               │           │        ↓               │
│  Wait for new release  │           │  Instant effect        │
│        ↓               │           │        ↓               │
│  Hope it's better      │           │  Test it yourself      │
└────────────────────────┘           └────────────────────────┘
```

**これは全員のための仕組みです:**
- **チーム** — 実際の働き方に合うワークフローを作れる
- **パワーユーザー** — 自分のコードベース向けにプロンプトを調整できる
- **OpenSpec コントリビューター** — リリース無しで新しいアプローチを試せる

最適解はまだ模索中です。OPSX は学びを共有できるようにします。

## ユーザー体験

**線形ワークフローの問題:**
「計画フェーズ」「実装フェーズ」「完了」と進む前提ですが、現実の作業はそうなりません。実装してみると設計が違った、仕様を更新したくなった、実装を続ける必要がある。線形フェーズは実際の流れと衝突します。

**OPSX の考え方:**
- **フェーズではなくアクション** — 作成、実装、更新、アーカイブをいつでも実行できる
- **依存関係は許可条件** — 次に何ができるかを示すだけで、順番を強制しない
- **学びながら更新** — 実装途中で設計を修正して戻るのは自然

```
You can always go back:

     ┌────────────────────────────────────┐
     │                                    │
     ▼                                    │
  proposal ──→ specs ──→ design ──→ tasks ──→ implement
     ▲           ▲          ▲               │
     │           │          │               │
     └───────────┴──────────┴───────────────┘
              update as you learn
```

## セットアップ

```bash
# 1. openspec がインストール済みで初期化されていることを確認
openspec init

# 2. 実験的スキルを生成
openspec artifact-experimental-setup
```

Claude Code が自動検出する `.claude/skills/` にスキルが作成されます。

## コマンド

| コマンド | 役割 |
|---------|------|
| `/opsx:explore` | アイデアの整理、問題の調査、要件の明確化を行う |
| `/opsx:new` | 新しい変更を開始 |
| `/opsx:continue` | 次に準備ができたアーティファクトを作成 |
| `/opsx:ff` | 早送り（計画アーティファクトを一括作成） |
| `/opsx:apply` | タスクを実装し、必要に応じてアーティファクトを更新 |
| `/opsx:sync` | 変更の仕様差分をメイン仕様に同期 |
| `/opsx:archive` | 完了後にアーカイブ |

## 使い方

### アイデアを探索する
```
/opsx:explore
```
アイデアを考え、問題を調査し、選択肢を比較します。構造は不要で、思考の相棒として使えます。洞察が固まったら `/opsx:new` または `/opsx:ff` に移行します。

### 新しい変更を始める
```
/opsx:new
```
何を作るかと、どのワークフロースキーマを使うかを尋ねられます。

### アーティファクトを作成する
```
/opsx:continue
```
依存関係にもとづいて作成可能なものを表示し、1 つのアーティファクトを作成します。繰り返し使って段階的に進めます。

```
/opsx:ff add-dark-mode
```
計画アーティファクトを一括で作成します。やることが明確なときに便利です。

### 実装する（流動的な部分）
```
/opsx:apply
```
タスクを順に進め、完了したらチェックを付けます。**重要な違い:** 実装中に問題が見つかったら、仕様・設計・タスクを更新して続行できます。フェーズのゲートはありません。

### 仕上げ
```
/opsx:sync      # 変更の仕様差分をメイン仕様に反映
/opsx:archive   # 完了後にアーカイブへ移動
```

## 更新するか、新規にするか

OPSX はいつでもアーティファクトを更新できます。ですが「学びながら更新」が「別の作業」に変わるのはいつでしょうか？

### 提案が捉えるもの

提案は 3 つを定義します。
1. **意図** — どの問題を解くのか
2. **スコープ** — どこまでが対象か
3. **アプローチ** — どう解決するのか

どれが、どれだけ変わったかが判断の鍵になります。

### 既存の変更を更新するのは次の場合

**同じ意図で、実行方法の洗練**
- 考慮していなかったエッジケースが見つかった
- 目標は同じでアプローチだけ調整する
- 実装中に設計のズレが分かった

**スコープが縮小**
- スコープが大きすぎるのでまず MVP を出す
- "Add dark mode" → "Add dark mode toggle (system preference in v2)"

**学びによる修正**
- コードベースの構造が想定と違った
- 依存関係が想定どおりに動かない
- "Use CSS variables" → "Use Tailwind's dark: prefix instead"

### 新しい変更を始めるのは次の場合

**意図が根本的に変わった**
- 解くべき問題が別物になった
- "Add dark mode" → "Add comprehensive theme system with custom colors, fonts, spacing"

**スコープが膨らんだ**
- 変更が大きくなり、別作業になっている
- 更新すると元の提案が判別できない
- "Fix login bug" → "Rewrite auth system"

**元の変更が完了できる**
- 元の変更を「完了」にできる
- 新しい作業は独立している
- 完了 "Add dark mode MVP" → Archive → 新しい変更 "Enhance dark mode"

### 判断の目安

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
| **同一性** | "同じものの洗練" | "別の作業" |
| **スコープの重なり** | 50% 以上 | 50% 未満 |
| **完了可能性** | 変更無しでは完了できない | 元の変更は完了でき、新しい作業は独立 |
| **ストーリー** | 更新の連鎖が一貫したストーリーになる | つぎはぎが分かりづらい |

### 原則

> **更新は文脈を保ち、新しい変更は明確さをもたらす。**
>
> 思考の履歴に価値があるなら更新を選ぶ。
> 新しく始めるほうが明瞭なら新しい変更を選ぶ。

git のブランチに例えると:
- 同じ機能に取り組む間はコミットを積み重ねる
- 本当に別作業なら新しいブランチを切る
- 部分的にマージして第 2 フェーズを新しく始めることもある

## 何が違うのか？

| | 標準（`/openspec:proposal`） | 実験的（`/opsx:*`） |
|---|---|---|
| **構造** | 1 つの大きな提案ドキュメント | 依存関係を持つ離散的なアーティファクト |
| **ワークフロー** | 直線的なフェーズ: plan → implement → archive | 流動的なアクション — いつでも何でもできる |
| **反復** | 戻るのが難しい | 学びながらアーティファクトを更新 |
| **カスタマイズ** | 固定構造 | スキーマ駆動（独自アーティファクトを定義） |

**重要な示唆:** 作業は直線的ではありません。OPSX はそれを前提にします。

## アーキテクチャ詳解

このセクションでは OPSX の内部構造と、標準ワークフローとの違いを説明します。

### 思想: フェーズ vs アクション

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STANDARD WORKFLOW                                    │
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
│              │           ACTIONS (not phases)             │                 │
│              │                                            │                 │
│              │   new ◄──► continue ◄──► apply ◄──► sync   │                 │
│              │    │          │           │          │     │                 │
│              │    └──────────┴───────────┴──────────┘     │                 │
│              │              any order                     │                 │
│              └────────────────────────────────────────────┘                 │
│                                                                             │
│   • Create artifacts one at a time OR fast-forward                         │
│   • Update specs/design/tasks during implementation                        │
│   • Dependencies enable progress, phases don't exist                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### コンポーネント構成

**標準ワークフロー**は TypeScript 内にハードコードされたテンプレートを使います。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STANDARD WORKFLOW COMPONENTS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Hardcoded Templates (TypeScript strings)                                  │
│                    │                                                        │
│                    ▼                                                        │
│   Configurators (18+ classes, one per editor)                               │
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

### 依存関係グラフモデル

アーティファクトは有向非巡回グラフ（DAG）を形成します。依存関係は**ゲートではなく許可条件**です。

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
   Missing                  All deps               File exists
   dependencies             are DONE               on filesystem
```

### 情報の流れ

**標準ワークフロー** — エージェントは静的な指示を受け取ります。

```
  User: "/openspec:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  Static instructions:                   │
  │  • Create proposal.md                   │
  │  • Create tasks.md                      │
  │  • Create design.md                     │
  │  • Create specs/*.md                    │
  │                                         │
  │  No awareness of what exists or         │
  │  dependencies between artifacts         │
  └─────────────────────────────────────────┘
           │
           ▼
  Agent creates ALL artifacts in one go
```

**OPSX** — エージェントはリッチなコンテキストを照会します。

```
  User: "/opsx:continue"
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  Step 1: Query current state                                             │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec status --change "add-auth" --json                      │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "artifacts": [                                                  │  │
  │  │      {"id": "proposal", "status": "done"},                         │  │
  │  │      {"id": "specs", "status": "ready"},      ◄── First ready      │  │
  │  │      {"id": "design", "status": "ready"},                          │  │
  │  │      {"id": "tasks", "status": "blocked", "missingDeps": ["specs"]}│  │
  │  │    ]                                                               │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 2: Get rich instructions for ready artifact                        │
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
  │  Step 3: Read dependencies → Create ONE artifact → Show what's unlocked  │
  └──────────────────────────────────────────────────────────────────────────┘
```

### イテレーションモデル

**標準ワークフロー** — 反復が難しい。

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │/proposal│ ──► │ /apply  │ ──► │/archive │
  └─────────┘     └─────────┘     └─────────┘
       │               │
       │               ├── "Wait, the design is wrong"
       │               │
       │               ├── Options:
       │               │   • Edit files manually (breaks context)
       │               │   • Abandon and start over
       │               │   • Push through and fix later
       │               │
       │               └── No official "go back" mechanism
       │
       └── Creates ALL artifacts at once
```

**OPSX** — 自然に反復できる。

```
  /opsx:new ───► /opsx:continue ───► /opsx:apply ───► /opsx:archive
      │                │                  │
      │                │                  ├── "The design is wrong"
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

`~/.local/share/openspec/schemas/` にスキーマを追加すれば独自ワークフローを作れます。

```
~/.local/share/openspec/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md

schema.yaml:
┌─────────────────────────────────────────────────────────────────┐
│  name: research-first                                           │
│  artifacts:                                                     │
│    - id: research        # Added before proposal                │
│      generates: research.md                                     │
│      requires: []                                               │
│                                                                 │
│    - id: proposal                                               │
│      generates: proposal.md                                     │
│      requires: [research]  # Now depends on research            │
│                                                                 │
│    - id: tasks                                                  │
│      generates: tasks.md                                        │
│      requires: [proposal]                                       │
└─────────────────────────────────────────────────────────────────┘

Dependency Graph:

   research ──► proposal ──► tasks
```

### まとめ

| 観点 | 標準 | OPSX |
|--------|----------|------|
| **テンプレート** | TypeScript にハードコード | 外部 YAML + Markdown |
| **依存関係** | なし（一括） | DAG とトポロジカルソート |
| **状態** | フェーズベースのメンタルモデル | ファイルの存在で判定 |
| **カスタマイズ** | ソースを編集して再ビルド | schema.yaml を作成 |
| **反復** | フェーズ固定 | 流動的にどこでも編集 |
| **エディタ対応** | 18+ の configurator クラス | 単一の skills ディレクトリ |

## スキーマ

スキーマは、どのアーティファクトが存在し、どのように依存するかを定義します。現在利用可能なもの:

- **spec-driven**（デフォルト）: proposal → specs → design → tasks
- **tdd**: tests → implementation → docs

`openspec schemas` を実行すると利用可能なスキーマが表示されます。

## ヒント

- `/opsx:explore` でアイデアを整理してから変更を開始する
- `/opsx:ff` は方針が固まっているときに、`/opsx:continue` は探索中に向いています
- `/opsx:apply` の途中で問題が見つかったら、アーティファクトを修正して続行する
- `tasks.md` のチェックボックスで進捗を追跡します
- 行き詰まったら `openspec status --change "name"` で状況を確認できます

## フィードバック

荒削りなのは意図的です。何がうまくいくかを学んでいます。

バグやアイデアがあれば [Discord](https://discord.gg/BYjPaKbqMt) か [GitHub](https://github.com/Fission-AI/openspec/issues) へ。
