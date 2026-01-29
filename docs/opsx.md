# OPSX ワークフロー

> **互換性:** 現時点では Claude Code のみ対応（フィードバックは [Discord](https://discord.gg/YctCnvvshC) へ）。

> [!NOTE]
> 会話例・出力例のコードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO opsx examples -->

## これは何？

OPSX は OpenSpec 変更のための **流動的で反復的なワークフロー** です。固定フェーズではなく、いつでも実行できるアクションを提供します。

## なぜ必要なのか

標準ワークフローは動きますが、**固定されすぎている**問題がありました。

- **指示がハードコード** — TypeScript に埋め込まれていて変えられない
- **一括生成しかない** — 1 つのコマンドで全部作るため、分割テストが難しい
- **固定構造** — 全員同じ流れでカスタマイズできない
- **ブラックボックス** — AI 出力が悪くてもプロンプトを調整できない

**OPSX はこれを開放します。** 誰でも以下が可能になります。

1. **指示を実験** — テンプレートを編集し、出力を改善
2. **細かくテスト** — アーティファクト単位で検証
3. **ワークフローをカスタム** — 独自アーティファクトと依存関係を定義
4. **高速に反復** — テンプレートを変えたら即検証

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

**対象は全員:**
- **チーム** — 実際の作業に合うワークフローを作れる
- **パワーユーザー** — プロンプトを調整して出力品質を向上
- **OpenSpec 開発者** — リリース不要で新アプローチを試せる

私たちはまだ学習中です。OPSX は皆で学ぶための仕組みです。

## 体験の違い

**線形ワークフローの問題:**
「計画フェーズ→実装フェーズ→完了」と進めると、現実の作業とズレます。実装中に設計が違うと気づくことは多く、仕様に戻る必要があるのに戻りづらい。

**OPSX の考え方:**
- **フェーズではなくアクション** — いつでも作成/更新/実装/アーカイブが可能
- **依存関係は可能性** — 次に何ができるかを示すだけで強制しない

```
  proposal ──→ specs ──→ design ──→ tasks ──→ implement
```

## セットアップ

```bash
# 1. openspec をインストール・初期化済みであること
openspec init

# 2. experimental skills を生成
openspec experimental
```

これにより `.claude/skills/` にスキルが生成され、Claude Code が自動検出します。

セットアップ中に **プロジェクト設定**（`openspec/config.yaml`）の作成が促されます。任意ですが推奨です。

## プロジェクト設定

プロジェクト設定は、デフォルト設定やプロジェクト文脈をアーティファクトに注入するための仕組みです。

### 設定の作成

`experimental` の実行中に作成するか、手動で作成できます。

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

### 設定フィールド

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `schema` | string | 新規変更のデフォルトスキーマ（例: `spec-driven`） |
| `context` | string | 全アーティファクトに注入する文脈 |
| `rules` | object | アーティファクトごとのルール（キーは artifact ID） |

### 仕組み

**スキーマ優先順位**（高→低）:
1. CLI フラグ（`--schema <name>`）
2. 変更メタデータ（変更ディレクトリ内の `.openspec.yaml`）
3. プロジェクト設定（`openspec/config.yaml`）
4. デフォルト（`spec-driven`）

**コンテキスト注入:**
- すべてのアーティファクト指示に追加
- `<context>...</context>` で囲まれる
- プロジェクト規約を AI が把握できる

**ルール注入:**
- 該当アーティファクトにのみ注入
- `<rules>...</rules>` で囲まれる
- context の後、テンプレートの前に挿入

### スキーマ別アーティファクト ID

**spec-driven**（デフォルト）:
- `proposal` — 変更提案
- `specs` — 仕様
- `design` — 技術設計
- `tasks` — 実装タスク

### 設定検証

- `rules` に未知の artifact ID がある場合は警告
- スキーマ名は利用可能なもののみ有効
- context は 50KB まで
- YAML 構文エラーは行番号付きで表示

### トラブルシューティング

**"Unknown artifact ID in rules: X"**
- artifact ID がスキーマと一致するか確認
- `openspec schemas --json` で ID を確認

**設定が反映されない:**
- `openspec/config.yaml` にあるか確認（`.yml` ではない）
- YAML 構文を検証
- 変更は即時反映（再起動不要）

**Context が大きすぎる:**
- 50KB 制限あり
- 重要な情報に絞る

## コマンド

| コマンド | できること |
|---------|------------|
| `/opsx:explore` | 相談・調査・要件整理 |
| `/opsx:new` | 新規変更の開始 |
| `/opsx:continue` | 次のアーティファクト作成 |
| `/opsx:ff` | 計画アーティファクト一括生成 |
| `/opsx:apply` | タスク実装（必要に応じてアーティファクト更新） |
| `/opsx:sync` | 仕様差分を本仕様へ同期（任意） |
| `/opsx:archive` | 完了時のアーカイブ |

## 使い方

### アイデアの探索
```
/opsx:explore
```
構造なしで相談できます。洞察が固まったら `/opsx:new` または `/opsx:ff` へ。

### 変更開始
```
/opsx:new
```
何を作るか、どのスキーマを使うかを尋ねられます。

### アーティファクト作成
```
/opsx:continue
```
依存関係に応じて作成可能なアーティファクトを提示し、1 つずつ作成します。

```
/opsx:ff add-dark-mode
```
計画アーティファクトを一括生成します。

### 実装（流動フェーズ）
```
/opsx:apply
```
タスクを進め、必要ならアーティファクトを更新します。

### 完了
```
/opsx:archive   # 完了時にアーカイブ（仕様同期の確認が入る）
```

## 更新するか新規にするか

proposal や specs はいつでも更新できます。しかし、どの程度変わったら「別の変更」とみなすべきでしょうか。

### proposal が示すもの

proposal は 3 つを定義します。
1. **Intent** — 何を解決するか
2. **Scope** — どこまでやるか
3. **Approach** — どう解決するか

この 3 つのどれがどれだけ変わったかが判断ポイントです。

### 既存変更を更新する場合

**同じ意図で実行を洗練**
- 見落としていたエッジケースが見つかった
- アプローチは調整が必要だが目的は同じ
- 実装で設計が少しずれていた

**スコープの縮小**
- フル機能は大きすぎるので MVP から始める
- "Add dark mode" → "Add dark mode toggle (system preference in v2)"

**学習による修正**
- コード構成が想定と違った
- 依存関係が期待通りに動かなかった
- "Use CSS variables" → "Use Tailwind's dark: prefix instead"

### 新規変更にする場合

**意図が根本的に変わった**
- 問題そのものが別物になった
- "Add dark mode" → "Comprehensive theme system with custom colors"

**スコープが爆発した**
- もはや別作業と言えるほど拡大
- 元の proposal が別物になる
- "Fix login bug" → "Rewrite auth system"

**元の変更を完了できる**
- 元の変更は「完了」にできる
- 新しい作業は独立している
- "Add dark mode MVP" を完了 → 新規変更 "Enhance dark mode"

### 判断のヒューリスティック

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

| テスト | 更新 | 新規変更 |
|------|--------|------------|
| **Identity** | "同じ目的の洗練" | "別の作業" |
| **Scope overlap** | 50%以上重なる | 50%未満 |
| **Completion** | 変更が完了できない | 変更が単独で完了できる |
| **Story** | 更新履歴が自然 | パッチが分かりづらくなる |

### 原則

> **Update は文脈を保つ。New は明瞭さを保つ。**
>
> 思考の履歴が重要なら Update。
> まっさらな方が明快なら New。

git に例えるなら:
- 同じ機能ならコミットを積む
- 別作業ならブランチを切る
- フェーズ 2 は一旦完了してから新規変更にする

## 何が違う？

| | Standard (`/openspec:proposal`) | Experimental (`/opsx:*`) |
|---|---|---|
| **構造** | proposal 1 枚に全て | 依存関係付きの個別アーティファクト |
| **ワークフロー** | 線形フェーズ | 流動的なアクション |
| **反復** | 戻りづらい | いつでも更新可 |
| **カスタマイズ** | 固定構造 | スキーマ駆動 |

**重要:** 仕事は線形ではない。OPSX はそれを前提にする。

## アーキテクチャ詳細

このセクションでは、OPSX の内部構造と標準ワークフローとの差を説明します。

### 哲学: フェーズ vs アクション

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
│              │   new ◄──► continue ◄──► apply ◄──► archive │                 │
│              │    │          │           │           │    │                 │
│              │    └──────────┴───────────┴───────────┘    │                 │
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

**標準ワークフロー** は TypeScript にハードコードされたテンプレートを使います。

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

### 依存グラフモデル

アーティファクトは DAG（有向非巡回グラフ）を形成します。依存関係は **ゲートではなく可能性** です。

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

### 情報フロー

**標準ワークフロー** — 静的な指示のみ:

```
  User: "/openspec:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  Static instructions:                   │
  │  • Create proposal.md                   │
  │  • Create tasks.md                      │
  │  • Create design.md                     │
  │  • Create specs/<capability>/spec.md    │
  │                                         │
  │  No awareness of what exists or         │
  │  dependencies between artifacts         │
  └─────────────────────────────────────────┘
           │
           ▼
  Agent creates ALL artifacts in one go
```

**OPSX** — 状態を問い合わせて指示を生成:

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

### 反復モデル

**標準ワークフロー** — 戻りづらい:

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

**OPSX** — 自然に反復できる:

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

スキーマ管理コマンドで独自ワークフローを作成できます。

```bash
# Create a new schema from scratch (interactive)
openspec schema init my-workflow

# Or fork an existing schema as a starting point
openspec schema fork spec-driven my-workflow

# Validate your schema structure
openspec schema validate my-workflow

# See where a schema resolves from (useful for debugging)
openspec schema which my-workflow
```

スキーマは `openspec/schemas/`（プロジェクトローカル）または `~/.local/share/openspec/schemas/`（ユーザーグローバル）に保存されます。

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

| 項目 | Standard | OPSX |
|--------|----------|------|
| **テンプレート** | TypeScript にハードコード | YAML + Markdown |
| **依存関係** | なし（常に一括生成） | DAG で並び替え |
| **状態** | フェーズ中心 | ファイル存在で判定 |
| **カスタマイズ** | ソース編集 & 再ビルド | schema.yaml を作成 |
| **反復** | フェーズ固定 | 流動的に更新 |
| **対応エディタ** | 18+ configurator クラス | skills ディレクトリで統一 |

## スキーマ

スキーマはアーティファクトと依存関係を定義します。現在利用可能:

- **spec-driven**（デフォルト）: proposal → specs → design → tasks

```bash
# List available schemas
openspec schemas

# See all schemas with their resolution sources
openspec schema which --all

# Create a new schema interactively
openspec schema init my-workflow

# Fork an existing schema for customization
openspec schema fork spec-driven my-workflow

# Validate schema structure before use
openspec schema validate my-workflow
```

## Tips

- `/opsx:explore` でアイデア整理してから進める
- `/opsx:ff` は明確なとき、`/opsx:continue` は探索中に向く
- `/opsx:apply` 中に問題が出たらアーティファクトを修正して続行
- タスク進捗は `tasks.md` のチェックボックスで管理
- いつでも `openspec status --change "name"` で状態確認

## フィードバック

OPSX は実験的です。改善のための意見を歓迎します。

バグや提案は [Discord](https://discord.gg/YctCnvvshC) か [GitHub](https://github.com/Fission-AI/openspec/issues) へ。
