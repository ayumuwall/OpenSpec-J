# ワークフロー

このガイドでは、OpenSpec の一般的なワークフロー パターンと、それぞれをいつ使用するかについて説明します。基本的なセットアップについては、「はじめに](getting-started.md)」を参照してください。コマンドのリファレンスについては、「コマンド](commands.md)」を参照してください。

## 哲学: フェーズではなくアクション

従来のワークフローでは、計画、実装、完了というフェーズを通過する必要があります。しかし、実際の仕事は枠にきちんと収まるものではありません。

OPSX は異なるアプローチを採用しています。

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

- **フェーズではなくアクション** - コマンドは実行できるものであり、行き詰まっているステージではありません
- **依存関係はイネーブラーです** - 依存関係は次に何が必要かを示すのではなく、何が可能であるかを示します

> **カスタマイズ:** OPSX ワークフローは、アーティファクト シーケンスを定義するスキーマによって駆動されます。カスタム スキーマの作成の詳細については、「Customization](customization.md)」を参照してください。

## 2 つのモード

### デフォルトのクイック パス (`core` プロファイル)

新規インストールのデフォルトは `core` で、以下が提供されます。
- `/opsx:explore`
- `/opsx:propose`
- `/opsx:apply`
- `/opsx:sync`
- `/opsx:archive`

一般的なフロー:

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:sync ──► /opsx:archive
  (optional)
```

#### (形成する価値のある習慣) を探求することから始めましょう

`/opsx:explore` はデフォルトのプロファイルの一部であり、高度なアドオンではありません。これは、問題はあるが計画がまだないときに行う行動であり、AI アシスタントを使用すると、ほとんどの場合そうなります。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: Our search results feel stale. I'm not sure if it's caching,
     indexing, or the query itself.

AI:  Let me look... [reads the search service and cache layer]
     It's the index: it only rebuilds nightly, so edits don't show
     up until the next day. Two options: rebuild on write (simple,
     more load) or a short-TTL cache invalidation (more moving parts,
     less load). Given your write volume is low, rebuild-on-write is
     the cleaner fix. Want to scope it?

You: Yes.

You: /opsx:propose rebuild-search-index-on-write
```

Explore はアーティファクトを作成せず、コードも作成しません。漠然とした不安を的確な変更に変える、自由で賭けのない会話だからこそ、その後に続く提案は鋭い。あなたが何を望んでいるのかはすでに正確にわかっていますか？それをスキップして、`/opsx:propose`に直接進みます。完全ガイド: [First](explore.md) を探索してください。

### 拡張/完全なワークフロー (カスタム選択)

明示的なスキャフォールドとビルドのコマンド (`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:bulk-archive`、`/opsx:onboard`) が必要な場合は、次のようにして有効にします。

```bash
openspec config profile
openspec update
```

## ワークフロー パターン (拡張モード)

### クイック機能

何を構築したいかがわかっていて、あとは実行するだけの場合:

```text
/opsx:new ──► /opsx:ff ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

**会話の例:**

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

**最適な用途:** 小規模から中規模の機能、バグ修正、簡単な変更。

### 探索的

要件が不明瞭な場合、または最初に調査する必要がある場合:

```text
/opsx:explore ──► /opsx:new ──► /opsx:continue ──► ... ──► /opsx:apply
```

**会話の例:**

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

**こんな用途に最適:** パフォーマンスの最適化、デバッグ、アーキテクチャ上の決定、不明瞭な要件。

### 並行した変更

複数の変更を同時に処理します。

```text
Change A: /opsx:new ──► /opsx:ff ──► /opsx:apply (in progress)
                                         │
                                    context switch
                                         │
Change B: /opsx:new ──► /opsx:ff ──────► /opsx:apply
```

**会話の例:**

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

**最適な用途:** 並行作業ストリーム、緊急の中断、チームのコラボレーション。

完了した変更が複数ある場合は、`/opsx:bulk-archive` を使用します。

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

一括アーカイブは、複数の変更が同じ仕様に影響することを検出し、実際に実装されている内容を確認することで競合を解決します。

### 変更の完了

推奨される完了フロー:

```text
/opsx:apply ──► /opsx:verify ──► /opsx:archive
                    │                 │
              validates          prompts to sync
              implementation     if needed
```

#### 検証: 作業内容を確認してください

`/opsx:verify` は、次の 3 つの次元にわたってアーティファクトに対して実装を検証します。

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

**検証の内容:**

|寸法 |検証内容 |
|-----------|------------------|
|完全性 |すべてのタスクが完了し、すべての要件が実装され、シナリオがカバーされています。
|正確さ |実装は仕様の意図と一致し、エッジケースは処理されます。
|コヒーレンス |設計上の決定はコードに反映され、パターンは一貫しています |

Verify はアーカイブをブロックしませんが、最初に対処すべき問題が表面化します。

#### アーカイブ: 変更を完了する

`/opsx:archive` は変更を完了し、アーカイブに移動します。

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

仕様が同期されていない場合は、アーカイブによってプロンプトが表示されます。未完了のタスクはブロックされませんが、警告は表示されます。

## いつ何を使用するか

### `/opsx:ff` vs `/opsx:continue`

|状況 |使用 |
|-----------|-----|
|要件を明確にし、構築する準備ができています | `/opsx:ff` |
|探索中、各ステップを確認したい | `/opsx:continue` |
|仕様の前に提案を繰り返したい | `/opsx:continue` |
|時間のプレッシャー、迅速に行動する必要があります | `/opsx:ff` |
|複雑な変更、制御が必要 | `/opsx:continue` |

**経験則:** 事前に全範囲を説明できる場合は、`/opsx:ff` を使用してください。途中で解決する場合は、`/opsx:continue` を使用してください。

### 更新する時期と新たに開始する時期

よくある質問: 既存の変更をいつ更新しても問題ありませんか?いつ新しい変更を開始する必要がありますか?

**次の場合に既存の変更を更新します。**

- 同じ意図、洗練された実行
- 範囲が狭くなります (MVP が最初、残りは後で)
- 学習主導型の修正 (コードベースが期待したものと異なる)
- 実装上の発見に基づいた設計の微調整

**次の場合に新しい変更を開始します:**

- 意図が根本的に変更されました
- 範囲が完全に別の作業に拡張されました
- 元の変更はスタンドアロンで「完了」とマークできます
- パッチは明確にするというよりも混乱させるでしょう

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

**例: 「ダークモードを追加」**

- 「カスタム テーマもサポートする必要がある」 → 新たな変更 (範囲が拡大)
- 「システム環境設定の検出は予想よりも難しい」 → 更新 (同じ意図)
- 「最初にトグルを出荷し、後で設定を追加しましょう」 → 更新してからアーカイブし、次に新しい変更を追加します

## ベストプラクティス

### 変更に焦点を当て続ける

変更ごとに 1 つの論理作業単位。 「機能 X を追加し、Y をリファクタリングする」場合は、2 つの個別の変更を検討してください。

**重要な理由:**
- レビューと理解が容易になります
- よりクリーンなアーカイブ履歴
- 個別に発送可能
- 必要に応じてより簡単なロールバック

### 不明瞭な要件には `/opsx:explore` を使用してください

変更をコミットする前に、問題の領域を調査してください。

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

探索により、成果物を作成する前に思考が明確になります。

### アーカイブする前に確認する

`/opsx:verify` を使用して、実装がアーティファクトと一致することを確認します。

```text
You: /opsx:verify

AI:  Verifying add-dark-mode...

     ✓ All tasks in tasks.md are checked
     ✓ Requirements in specs have corresponding code
     ✓ Design decisions are reflected in implementation

     Ready to archive!
```

変更を終了する前に不一致を検出します。

### 名前の変更は明らかです

良い名前は `openspec list` を便利にします。

```text
Good:                          Avoid:
add-dark-mode                  feature-1
fix-login-redirect             update
optimize-product-query         changes
implement-2fa                  wip
```

## コマンドクイックリファレンス

コマンドの完全な詳細とオプションについては、「Commands](commands.md).

|コマンド |目的 |いつ使用するか |
|---------|---------|-------------|
| `/opsx:propose` |変更 + 計画成果物を作成する |高速デフォルト パス (`core` プロファイル) |
| `/opsx:explore` | AI でアイデアを考える |不明な場合はここから始めてください: 不明瞭な要件、調査、オプションの比較 |
| `/opsx:new` |変更の足場を開始する |拡張モード、明示的なアーティファクト制御 |
| `/opsx:continue` |次のアーティファクトを作成する |拡張モード、ステップバイステップのアーティファクト作成 |
| `/opsx:ff` |すべての計画成果物を作成する |拡張モード、明確なスコープ |
| `/opsx:apply` |タスクを実装する |コードを書く準備ができました |
| `/opsx:verify` |実装を検証する |拡張モード、アーカイブ前 |
| `/opsx:sync` |マージ 仕様差分 |拡張モード、オプション |
| `/opsx:archive` |変更を完了します |すべての作業が完了しました |
| `/opsx:bulk-archive` |複数の変更をアーカイブする |拡張モード、並列作業 |

## 次のステップ

- [適切な仕様の作成](writing-specs.md) - 強力な要件とシナリオとはどのようなものなのか、および変更のサイズを適切に調整する方法
- [Change](reviewing-changes.md) のレビュー - コードを作成する前に、草案の計画を 2 分間で確認します。
- [Team](team-workflow.md) の OpenSpec - 変更がブランチとプル リクエストにどのように適合するか
- [Commands](commands.md) - オプション付きの完全なコマンド リファレンス
- [Concepts](concepts.md) - 仕様、アーティファクト、スキーマの詳細
- [カスタマイズ](customization.md) - カスタムワークフローを作成する
