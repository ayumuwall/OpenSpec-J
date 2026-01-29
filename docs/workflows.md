# ワークフロー

OpenSpec の代表的なワークフローパターンと、使い分けの目安をまとめます。基本的なセットアップは [Getting Started](getting-started.md)、コマンド詳細は [Commands](commands.md) を参照してください。

> [!NOTE]
> 会話例・出力例のコードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO workflows examples -->

## 哲学: フェーズではなくアクション

従来のワークフローは「計画 → 実装 → 完了」と段階に固定されがちです。しかし実際の作業はもっと行き来します。

OPSX は次のアプローチを取ります:

```text
Traditional (phase-locked):

  PLANNING ────────► IMPLEMENTING ────────► DONE
      │                    │
      │   "Can't go back"  │
      └────────────────────┘

OPSX (fluid actions):

  proposal ──► specs ──► design ──► tasks ──► implement
```

**重要な原則:**

- **フェーズではなくアクション** — コマンドは「できること」であり、動けない段階ではない
- **依存関係は進行可能性を示す** — 次に何ができるかを示すだけで、順番を強制しない

> **カスタマイズ:** OPSX ワークフローはスキーマで定義されます。カスタムスキーマの作り方は [Customization](customization.md) を参照してください。

## ワークフローパターン

### クイック機能追加

何を作るか決まっていて、すぐ実行したいとき:

```text
/opsx:new ──► /opsx:ff ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

**会話例:**

```text
You: /opsx:new add-logout-button

AI:  Created openspec/changes/add-logout-button/
     Ready to create: proposal

You: /opsx:ff

AI:  Creating all planning artifacts...
     ✓ proposal.md
     ✓ specs/
     ✓ design.md
     ✓ tasks.md
     Ready for implementation!

You: /opsx:apply

AI:  Working through tasks...
     ✓ Added logout button to header
     ✓ Implemented session clearing
     ✓ Added confirmation dialog
     All tasks complete!

You: /opsx:archive

AI:  ✓ Merged specs
     ✓ Archived change
```

**向いている場面:** 小〜中規模の機能追加、バグ修正、単純な変更。

### 探索型

要件が曖昧、または調査から始めたいとき:

```text
/opsx:explore ──► /opsx:new ──► /opsx:continue ──► ... ──► /opsx:apply
```

**会話例:**

```text
You: /opsx:explore

AI:  What would you like to explore?

You: I want to improve page load performance but I'm not sure
     where the bottlenecks are.

AI:  Let me help investigate...
     [Analyzes bundle sizes, identifies slow queries, reviews
     component render patterns]

     I found three main bottlenecks:
     1. Large unoptimized images
     2. Synchronous data fetching in ProductList
     3. Re-renders from context changes

     Which would you like to address first?

You: Let's tackle the data fetching issue.

You: /opsx:new optimize-product-list-fetching

AI:  Created change. Ready to create: proposal

You: /opsx:continue

AI:  Creating proposal based on our exploration...
     [Writes proposal incorporating investigation insights]

     Ready to create: specs, design
     Which would you like next?

You: /opsx:continue

AI:  Creating specs...
```

**向いている場面:** 性能最適化、デバッグ、アーキテクチャ判断、要件が不明確なとき。

### 並行変更

複数の変更を同時に進めるとき:

```text
Change A: /opsx:new ──► /opsx:ff ──► /opsx:apply (in progress)
                                         │
                                    context switch
                                         │
Change B: /opsx:new ──► /opsx:ff ──────► /opsx:apply
```

**会話例:**

```text
You: I'm working on add-dark-mode but got pulled into a bug fix

You: /opsx:new fix-login-redirect

AI:  Created openspec/changes/fix-login-redirect/

You: /opsx:ff

AI:  ✓ Created planning artifacts

You: /opsx:apply

AI:  Working on fix-login-redirect...
     [Implements the fix]
     All tasks complete!

You: /opsx:archive

AI:  ✓ Archived fix-login-redirect

You: Let's get back to dark mode

You: /opsx:apply add-dark-mode

AI:  Resuming add-dark-mode...
     Picking up at task 2.3: Update Header...
```

**向いている場面:** 並行作業、緊急対応の割り込み、チーム協業。

複数の完了済み変更がある場合は `/opsx:bulk-archive` を使います:

```text
You: /opsx:bulk-archive

AI:  Found 3 completed changes:
     - add-dark-mode (all tasks done)
     - fix-login-redirect (all tasks done)
     - update-footer (all tasks done)

     Checking for spec conflicts...
     ⚠ add-dark-mode and update-footer both touch specs/ui/

     Inspecting codebase to resolve...
     Both changes are implemented. Will apply in chronological order.

     Archive all 3 changes?

You: Yes

AI:  ✓ Archived add-dark-mode
     ✓ Archived fix-login-redirect
     ✓ Archived update-footer
     Specs merged in order: add-dark-mode → update-footer
```

一括アーカイブは、複数の変更が同じ仕様に触れている場合に競合を検出し、実装状況を見て解消します。

### 変更の完了

推奨される完了フロー:

```text
/opsx:apply ──► /opsx:verify ──► /opsx:archive
                    │                 │
              validates          prompts to sync
              implementation     if needed
```

#### Verify: 作業の確認

`/opsx:verify` は、アーティファクトに対する実装の整合性を 3 つの観点で検証します。

```text
You: /opsx:verify

AI:  Verifying add-auth...

     COMPLETENESS
     ✓ All 12 tasks in tasks.md are checked
     ✓ All requirements in specs have corresponding code
     ⚠ Scenario "Session timeout after inactivity" not tested

     CORRECTNESS
     ✓ Implementation matches spec intent
     ✓ Edge cases from scenarios are handled
     ✓ Error states match spec definitions

     COHERENCE
     ✓ Design decisions reflected in code structure
     ✓ Naming conventions consistent with design.md
     ⚠ Design mentions "event-driven" but implementation uses polling

     SUMMARY
     ─────────────────────────────
     Critical issues: 0
     Warnings: 2
     Ready to archive: Yes (with warnings)

     Recommendations:
     1. Add test for session timeout scenario
     2. Consider refactoring to event-driven as designed, or update design.md
```

**verify が見る観点:**

| 観点 | 検証内容 |
|-----------|------------------|
| Completeness | タスク完了、要件実装、シナリオ網羅 |
| Correctness | 仕様意図との一致、エッジケース対応 |
| Coherence | 設計判断の反映、パターン整合性 |

verify はアーカイブをブロックしませんが、先に対応した方がよい問題を可視化します。

#### Archive: 変更の確定

`/opsx:archive` は変更を完了し、アーカイブへ移動します。

```text
You: /opsx:archive

AI:  Archiving add-auth...

     Artifact status:
     ✓ proposal.md exists
     ✓ specs/ exists
     ✓ design.md exists
     ✓ tasks.md exists (12/12 tasks complete)

     Delta specs: Not yet synced to main
     → Would you like to sync now?

You: Yes

AI:  ✓ Synced specs to openspec/specs/auth/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-auth/

     Change archived successfully.
```

アーカイブ時に仕様が同期されていなければ確認が入ります。未完了タスクがあってもブロックはしませんが警告が出ます。

## 使い分けの目安

### `/opsx:ff` vs `/opsx:continue`

| 状況 | 使うコマンド |
|-----------|-----|
| 要件が明確で、すぐ作りたい | `/opsx:ff` |
| 探索しながら進めたい | `/opsx:continue` |
| proposal を詰めてから specs に進みたい | `/opsx:continue` |
| 時間がなく早く進めたい | `/opsx:ff` |
| 複雑な変更でコントロールしたい | `/opsx:continue` |

**目安:** 全体像を最初に説明できるなら `/opsx:ff`。進めながら考えるなら `/opsx:continue`。

### 既存変更の更新か、新規変更か

よくある疑問: 既存変更を更新すべきか、新しい変更として切り出すべきか。

**既存変更を更新する場合:**

- 目的は同じで実行だけ洗練した
- スコープを絞る（MVP 先行）
- 学習による修正（コード構成が想定と違う等）
- 実装で設計の微調整が必要

**新しい変更を作る場合:**

- 目的が根本的に変わった
- 別の作業と言えるほどスコープが膨張した
- 元の変更だけで完了できる
- パッチの積み上げが不明瞭になる

```text
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

**例: "Add dark mode"**

- "Need to also support custom themes" → 新規変更（スコープ拡大）
- "System preference detection is harder than expected" → 更新（同じ目的）
- "Let's ship toggle first, add preferences later" → 更新してアーカイブ → 新規変更

## ベストプラクティス

### 変更はフォーカスを絞る

1 つの変更は 1 つの目的に絞るのが原則です。「機能 X を追加しつつ Y をリファクタ」するなら分けるのが安全です。

**理由:**
- レビューしやすい
- アーカイブ履歴が明瞭
- 独立してリリースできる
- ロールバックが簡単

### 要件が曖昧なら `/opsx:explore`

変更を始める前に問題空間を探索します。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: How should we handle rate limiting for our API?

AI:  Let me investigate your current setup and options...
     [Researches codebase, considers patterns]

     I see three approaches we could take:
     1. Middleware-based (simple, per-endpoint)
     2. Redis-backed (scalable, shared state)
     3. Token bucket per user (fair, complex)

     Your current stack suggests #1 or #2. What's your scale?
```

探索で考えを整理してからアーティファクトを作ると効率的です。

### アーカイブ前に verify

`/opsx:verify` で実装とアーティファクトの整合性を確認します。

```text
You: /opsx:verify

AI:  Verifying add-dark-mode...

     ✓ All tasks in tasks.md are checked
     ✓ Requirements in specs have corresponding code
     ✓ Design decisions are reflected in implementation

     Ready to archive!
```

アーカイブ前にズレを発見できます。

### 変更名はわかりやすく

`openspec list` を見たときに内容が分かる名前を付けます。

```text
Good:                          Avoid:
add-dark-mode                  feature-1
fix-login-redirect             update
optimize-product-query         changes
implement-2fa                  wip
```

## コマンド早見表

コマンドの詳細は [Commands](commands.md) を参照してください。

| コマンド | 目的 | 使う場面 |
|---------|---------|-------------|
| `/opsx:explore` | アイデアの整理 | 要件が不明なとき、調査が必要なとき |
| `/opsx:new` | 変更開始 | 新しい作業の開始 |
| `/opsx:continue` | 次のアーティファクト作成 | ステップごとに進めたいとき |
| `/opsx:ff` | 計画アーティファクト一括生成 | スコープが明確なとき |
| `/opsx:apply` | タスク実装 | 実装に進むとき |
| `/opsx:verify` | 実装検証 | アーカイブ前の確認 |
| `/opsx:sync` | 仕様差分の統合 | 任意（必要なら） |
| `/opsx:archive` | 変更完了 | 作業完了時 |
| `/opsx:bulk-archive` | 複数変更の一括アーカイブ | 並行作業の整理 |

## 次に読むもの

- [Commands](commands.md) - コマンド詳細
- [Concepts](concepts.md) - 仕様・アーティファクト・スキーマの理解
- [Customization](customization.md) - カスタムワークフロー
