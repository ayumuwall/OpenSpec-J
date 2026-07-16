# コマンド

これは、OpenSpec のスラッシュ コマンドのリファレンスです。これらのコマンドは、AI コーディング アシスタントのチャット インターフェイス (Claude Code、Cursor、Windsurf など) で呼び出されます。

ワークフロー パターンと各コマンドをいつ使用するかについては、「Workflows](workflows.md). CLI コマンドについては、「CLI](cli.md).

## クイックリファレンス

### デフォルトのクイック パス (`core` プロファイル)

|コマンド |目的 |
|---------|---------|
| `/opsx:propose` | 1 ステップで変更を作成し、計画成果物を生成します。
| `/opsx:explore` |変更に取り組む前にアイデアをよく考えてください |
| `/opsx:apply` |変更からタスクを実装する |
| `/opsx:update` |変更の計画成果物を改訂し、一貫性を保つ |
| `/opsx:sync` |仕様差分をメイン仕様にマージ |
| `/opsx:archive` |完了した変更をアーカイブする |

### 拡張されたワークフロー コマンド (カスタム ワークフローの選択)

|コマンド |目的 |
|---------|---------|
| `/opsx:new` |新しい変更スキャフォールドを開始する |
| `/opsx:continue` |依存関係に基づいて次のアーティファクトを作成します。
| `/opsx:ff` |早送り: すべての計画成果物を一度に作成します。
| `/opsx:verify` |実装がアーティファクトと一致することを検証する |
| `/opsx:bulk-archive` |複数の変更を一度にアーカイブ |
| `/opsx:onboard` |完全なワークフローを介したガイド付きチュートリアル |

デフォルトのグローバル プロファイルは `core` です。拡張ワークフロー コマンドを有効にするには、`openspec config profile` を実行し、ワークフローを選択して、プロジェクトで `openspec update` を実行します。

---

## コマンドリファレンス

### `/opsx:propose`

新しい変更を作成し、1 つのステップで計画成果物を生成します。これは、`core` プロファイルのデフォルトの開始コマンドです。

**構文：**
```text
/opsx:propose [change-name-or-description]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name-or-description` |いいえ | Kebab ケースの名前または平易な言語の変更の説明 |

**機能:**
- `openspec/changes/<change-name>/` を作成します
- 実装前に必要な成果物を生成します (`spec-driven` の場合: 提案、仕様、設計、タスク)
- `/opsx:apply` の変更の準備ができたら停止します

**例：**
```text
You: /opsx:propose add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     ✓ proposal.md
     ✓ specs/ui/spec.md
     ✓ design.md
     ✓ tasks.md
     Ready for implementation. Run /opsx:apply.
```

**ヒント:**
- 最速のエンドツーエンド パスにこれを使用します
- 段階的なアーティファクト制御が必要な場合は、拡張ワークフローを有効にして、`/opsx:new` + `/opsx:continue` を使用します。

---

### `/opsx:explore`

> **迷ったときはここから始めてください。** Explore は、リスクのない思考パートナーです。コードベースを読み取り、オプションを比較し、変更が存在する前に曖昧なアイデアを具体的な計画に磨き上げます。デフォルトのプロファイルで出荷されます。完全なケースとその他の例については、[Explore First](explore.md) ガイド] を参照してください。

変更に取り組む前に、アイデアを熟考し、問題を調査し、要件を明確にします。

**構文：**
```
/opsx:explore [topic]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `topic` |いいえ |調べたいこと、調べたいこと |

**機能:**
- 構造を必要とせずに探索的な会話を開始します
- 質問に答えるためにコードベースを調査します
- オプションとアプローチを比較します
- 思考を明確にするための視覚的な図を作成します
- 洞察が具体化したら、`/opsx:propose` (デフォルト) または `/opsx:new` (拡張ワークフロー) に移行可能

**例：**
```text
You: /opsx:explore

AI:  What would you like to explore?

You: How should we handle authentication for the mobile app?

AI:  Let me investigate your current auth setup...
     [Analyzes codebase]

     I see you're using session-based auth for the web app.
     For mobile, we have three main options:

     1. JWT tokens (stateless, works offline)
     2. OAuth2 (if you need third-party login)
     3. Extend current sessions (simpler, but requires connectivity)

     Your API already has CORS configured. Which direction interests you?

You: Let's go with JWT. Can we start a change for that?

AI:  Ready when you are. Run /opsx:propose add-jwt-auth to begin.
```

**ヒント:**
- 要件が不明瞭な場合、または調査する必要がある場合に使用します。
- 探索中にアーティファクトは作成されません
- 決定する前に複数のアプローチを比較するのに適しています
- ファイルの読み取りとコードベースの検索が可能

---

### `/opsx:new`

新しい変更の足場を開始します。変更フォルダーを作成し、`/opsx:continue` または `/opsx:ff` でアーティファクトが生成されるのを待ちます。

このコマンドは、拡張ワークフロー セットの一部です (デフォルトの `core` プロファイルには含まれていません)。

**構文：**
```
/opsx:new [change-name] [--schema <schema-name>]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |変更フォルダーの名前 (指定しない場合はプロンプトが表示されます) |
| `--schema` |いいえ |使用するワークフロー スキーマ (デフォルト: 構成または `spec-driven` から) |

**機能:**
- `openspec/changes/<change-name>/` ディレクトリを作成します
- 変更フォルダーに `.openspec.yaml` メタデータ ファイルを作成します
- 作成の準備ができた最初のアーティファクト テンプレートを表示します
- 名前とスキーマが指定されていない場合は変更を求めるプロンプトが表示されます

**作成されるもの:**
```
openspec/changes/<change-name>/
└── .openspec.yaml    # Change metadata (schema, created date)
```

**例：**
```
You: /opsx:new add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     Schema: spec-driven

     Ready to create: proposal
     Use /opsx:continue to create it, or /opsx:ff to create all artifacts.
```

**ヒント:**
- わかりやすい名前を使用します: `add-feature`、`fix-bug`、`refactor-module`
- `update`、`changes`、`wip` などの一般的な名前は避けてください。
- スキーマはプロジェクト構成(`openspec/config.yaml`)でも設定できます

---

### `/opsx:continue`

依存関係チェーンに次のアーティファクトを作成します。段階的に進行するために一度に 1 つのアーティファクトを作成します。

**構文：**
```
/opsx:continue [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |どの変更を続行するか (指定されていない場合はコンテキストから推測) |

**機能:**
- アーティファクトの依存関係グラフをクエリします。
- 準備ができているアーティファクトとブロックされているアーティファクトを表示します
- 最初の準備完了アーティファクトを作成します
- コンテキストの依存関係ファイルを読み取ります
- 作成後に利用可能になるものを表示します

**例：**
```
You: /opsx:continue

AI:  Change: add-dark-mode

     Artifact status:
     ✓ proposal    (done)
     ◆ specs       (ready)
     ◆ design      (ready)
     ○ tasks       (blocked - needs: specs)

     Creating specs...

     [Reads proposal.md, creates specs based on requirements]

     ✓ Created openspec/changes/add-dark-mode/specs/ui/spec.md

     Now available: tasks
     Run /opsx:continue to create the next artifact.
```

**ヒント:**
- 続行する前に各成果物を確認したい場合に使用します
- 制御が必要な複雑な変更に適しています
- 複数のアーティファクトが同時に準備可能になる場合があります
- 続行する前に、作成したアーティファクトを編集できます

---

### `/opsx:ff`

アーティファクトの作成を早送りします。すべての計画成果物を一度に作成します。

**構文：**
```
/opsx:ff [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |早送りする変更 (指定されていない場合はコンテキストから推測) |

**機能:**
- すべてのアーティファクトを依存関係の順序で作成します
- ToDo リストを通じて進捗状況を追跡
- すべての `apply-required` アーティファクトが完了すると停止します
- 次のアーティファクトを作成する前に各依存関係を読み取ります。

**例：**
```
You: /opsx:ff add-dark-mode

AI:  Fast-forwarding add-dark-mode...

     ✓ Creating proposal.md
     ✓ Creating specs/ui/spec.md
     ✓ Creating design.md
     ✓ Creating tasks.md

     All planning artifacts complete!
     Ready for implementation. Run /opsx:apply to begin.
```

**ヒント:**
- 何を構築しているのか明確なイメージがある場合に使用します
- `/opsx:continue` よりも高速で簡単な変更が可能
- 後でもアーティファクトを編集できます
- 小規模から中規模の機能に適しています

---

### `/opsx:apply`

変更からタスクを実装します。コードを記述し、項目にチェックを入れて、タスク リストを実行します。

**構文：**
```
/opsx:apply [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |どの変更を実装するか (指定されていない場合はコンテキストから推測) |

**機能:**
- `tasks.md` を読み取り、不完全なタスクを識別します
- タスクを 1 つずつ実行します
- 必要に応じてコードを記述し、ファイルを作成し、テストを実行します
- チェックボックス `[x]` でタスクが完了したことをマークします

**例：**
```
You: /opsx:apply

AI:  Implementing add-dark-mode...

     Reading tasks.md:
     - [ ] 1.1 Create ThemeContext
     - [ ] 1.2 Add CSS custom properties
     - [ ] 1.3 Implement localStorage persistence

     Working on 1.1: Create ThemeContext...
     [Creates src/context/ThemeContext.tsx]

     ✓ 1.1 Complete

     Working on 1.2: Add CSS custom properties...
     [Updates src/styles/globals.css]

     ✓ 1.2 Complete
     ...
```

**ヒント:**
- 中断された場合、中断したところから再開できます
- 変更名を指定して並行変更に使用します
- 完了状態は `tasks.md` チェックボックスで追跡されます

---

### `/opsx:update`

変更の既存の計画成果物を改訂し、相互の一貫性を保ちます。アーティファクトのみを計画し、コードを編集することはありません。

**構文：**

```text
/opsx:update [change-name]
```

**引数:**

|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |どの変更を更新するか (指定されていない場合はコンテキストから推測) |

**機能:**

- `openspec status --change <name> --json` 経由で変更のアーティファクトを読み取ります
- 要求されたリビジョンを適用するか、アーティファクトに名前を付けていない場合は矛盾がないかレビューします。
- 他の既存の成果物をあらゆる方向に調整します (デザインの編集が提案に反映される可能性があります)
- 執筆前に編集内容を一度に 1 つずつ確認します。
- 次のステップを推奨して終了します: `/opsx:continue` (アーティファクトが欠落)、`/opsx:apply` (修正された計画をコードに取り込む)、または `/opsx:archive` (すべて完了)

**例：**

```text
You: /opsx:update add-dark-mode - we're storing the theme in a cookie now, not localStorage

AI:  Reading add-dark-mode artifacts...

     The design references localStorage in two places; tasks 1.3 covers
     localStorage persistence; the proposal doesn't mention storage.

     Proposed revisions:
     1. design.md - swap localStorage decision for cookie storage
     2. tasks.md - reword task 1.3 to cookie persistence

     Apply revision 1? (design.md)
```

**ヒント:**

- 欠落したアーティファクトは作成されません - それは `/opsx:continue`
- 変更がすでに実装されている場合は、コードが改訂された計画と一致するように `/opsx:apply` をフォローアップします。
- リビジョンによって変更の *意図* が変更される場合は、代わりに新しい変更を新たに開始してください ([いつ更新するか、いつ更新するか。](opsx.md#when-to-update-vs-start-fresh) を開始するかを参照)。

---

### `/opsx:verify`

実装が変更成果物と一致することを検証します。完全性、正確性、一貫性をチェックします。

**構文：**
```
/opsx:verify [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |どの変更を確認するか (指定されていない場合はコンテキストから推測) |

**機能:**
- 実装品質の 3 つの側面をチェックします
- コードベースで実装の証拠を検索します
- 重大、警告、または提案として分類された問題を報告します
- アーカイブはブロックされませんが、問題が表面化します

**検証寸法:**

|寸法 |検証内容 |
|-----------|-------------------|
| **完全性** |すべてのタスクが完了し、すべての要件が実装され、シナリオがカバーされています。
| **正確さ** |実装は仕様の意図と一致し、エッジケースは処理されます。
| **一貫性** |設計上の決定はコードに反映され、パターンは一貫しています |

**例：**
```
You: /opsx:verify

AI:  Verifying add-dark-mode...

     COMPLETENESS
     ✓ All 8 tasks in tasks.md are checked
     ✓ All requirements in specs have corresponding code
     ⚠ Scenario "System preference detection" has no test coverage

     CORRECTNESS
     ✓ Implementation matches spec intent
     ✓ Edge cases from scenarios are handled
     ✓ Error states match spec definitions

     COHERENCE
     ✓ Design decisions reflected in code structure
     ✓ Naming conventions consistent with design.md
     ⚠ Design mentions "CSS variables" but implementation uses Tailwind classes

     SUMMARY
     ─────────────────────────────
     Critical issues: 0
     Warnings: 2
     Ready to archive: Yes (with warnings)

     Recommendations:
     1. Add test for system preference detection
     2. Update design.md to reflect Tailwind usage, or refactor to use CSS variables
```

**ヒント:**
- 不一致を早期に発見するために、アーカイブする前に実行します。
- 警告はアーカイブをブロックしませんが、潜在的な問題を示します
- コミットする前に AI の作業をレビューするのに適しています
- アーティファクトと実装の間のドリフトを明らかにできる

---

### `/opsx:sync`

**オプションのコマンド。** 変更からの仕様差分をメイン仕様にマージします。アーカイブでは、必要に応じて同期を求めるプロンプトが表示されるため、通常はこれを手動で実行する必要はありません。

**構文：**
```
/opsx:sync [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |どの変更を同期するか (指定されていない場合はコンテキストから推測) |

**機能:**
- 変更フォルダーから仕様差分を読み取ります
- 追加/変更/削除/名前変更されたセクションを解析します
- 変更をメインの `openspec/specs/` ディレクトリにマージします
- デルタに記載されていない既存のコンテンツを保持します
- 変更をアーカイブしません (アクティブのままです)

**例：**
```text
You: /opsx:sync

AI:  Syncing add-dark-mode delta specs...

     Reading: openspec/changes/add-dark-mode/specs/ui/spec.md
     Target:  openspec/specs/ui/spec.md

     Changes to apply:
     ✓ ADDED: Theme Selection requirement (2 scenarios)
     ✓ ADDED: Accessibility requirement (1 scenario)

     Merging...
     ✓ openspec/specs/ui/spec.md updated

     Change remains active. Run /opsx:archive when ready to complete.
```

**手動で使用する場合:**

|シナリオ |同期を使用しますか? |
|----------|-----------|
|長期にわたる変更、アーカイブする前にメインで仕様が必要 |はい |
|複数の変更を並行して行うには、基本仕様を更新する必要があります。はい |
|マージを個別にプレビュー/レビューしたい |はい |
|クイック変更、アーカイブに直接移動 |いいえ (アーカイブが処理します) |

**ヒント:**
- 同期はコピーアンドペーストではなくインテリジェントに行われます
- 重複することなく、既存の要件にシナリオを追加できます。
- 変更は同期後もアクティブのままになります (アーカイブされません)
- ほとんどのユーザーはこれを直接呼び出す必要はありません。必要に応じてプロンプトをアーカイブしてください。

---

### `/opsx:archive`

完了した変更をアーカイブします。変更を確定し、アーカイブ フォルダーに移動します。

**構文：**
```
/opsx:archive [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` |いいえ |どの変更をアーカイブするか (指定されていない場合はコンテキストから推測) |

**機能:**
- アーティファクトの完了ステータスを確認します
- タスクの完了を確認します（不完全な場合は警告します）
- まだ同期されていない場合は、仕様差分を同期するよう提案します
- 変更フォルダーを `openspec/changes/archive/YYYY-MM-DD-<name>/` に移動します
- 監査証跡のためにすべての成果物を保存します

**例：**
```text
You: /opsx:archive

AI:  Archiving add-dark-mode...

     Artifact status:
     ✓ proposal.md exists
     ✓ specs/ exists
     ✓ design.md exists
     ✓ tasks.md exists (8/8 tasks complete)

     Delta specs: Not yet synced
     → Sync now? (recommended)

You: Yes

AI:  ✓ Synced specs to openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/

     Change archived successfully.
```

**ヒント:**
- アーカイブは不完全なタスクをブロックしませんが、警告を出します
- 仕様差分はアーカイブ中または事前に同期可能
- アーカイブされた変更は履歴として保存されます
- 問題を見つけるには、最初に `/opsx:verify` を使用してください

---

### `/opsx:bulk-archive`

完了した複数の変更を一度にアーカイブします。変更間の仕様の競合を処理します。

**構文：**
```
/opsx:bulk-archive [change-names...]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-names` |いいえ |アーカイブへの特定の変更 (指定されていない場合は選択を求めるプロンプトが表示されます) |

**機能:**
- 完了したすべての変更をリストします。
- アーカイブする前に各変更を検証します
- 変更にまたがる仕様の競合を検出します
- 実際に実装されている内容を確認して競合を解決します。
- 時系列順にアーカイブ

**例：**
```
You: /opsx:bulk-archive

AI:  Found 3 completed changes:
     - add-dark-mode (8/8 tasks complete)
     - fix-login-bug (3/3 tasks complete)
     - update-footer (2/2 tasks complete)

     Checking for spec conflicts...
     ⚠ add-dark-mode and update-footer both touch specs/ui/

     Inspecting codebase to resolve...
     Both changes are implemented. Will merge in chronological order:
     1. add-dark-mode (created Jan 20)
     2. update-footer (created Jan 22)

     Archive all 3 changes?

You: Yes

AI:  ✓ Archived add-dark-mode
     ✓ Archived fix-login-bug
     ✓ Archived update-footer
     Specs merged: add-dark-mode → update-footer
```

**ヒント:**
- 並行作業ストリームに適しています
- 競合解決はエージェント的です (コードベースをチェックします)
- 変更は作成順にアーカイブされます
- 仕様の内容を上書きする前にプロンプ​​トを表示

---

### `/opsx:onboard`

完全な OpenSpec ワークフローによるガイド付きオンボーディング。実際のコードベースを使用した対話型チュートリアル。

**構文：**
```
/opsx:onboard
```

**機能:**
- ナレーション付きでワークフロー サイクル全体を説明します
- コードベースをスキャンして実際の改善の機会を探します
- 実際の成果物を使用して実際の変更を作成します
- 実際の作業を実装します (小さくて安全な変更)
- 完了した変更をアーカイブします
- 各ステップを発生時に説明します

**フェーズ:**
1. ようこそとコードベース分析
2. 改善の機会を見つける
3. 変更の作成 (`/opsx:new`)
4. 提案書の作成
5. 仕様の作成
6. デザインを書く
7. タスクの作成
8. タスクの実装 (`/opsx:apply`)
9. 実装の検証
10. 変更のアーカイブ
11. まとめと次のステップ

**例：**
```
You: /opsx:onboard

AI:  Welcome to OpenSpec!

     I'll walk you through the complete workflow using your actual codebase.
     We'll find something small to improve, create a proper change for it,
     implement it, and archive it.

     Let me scan your codebase for opportunities...

     [Analyzes codebase]

     I found a few things we could work on:
     1. Add input validation to the contact form
     2. Improve error messages in the auth flow
     3. Add loading states to async buttons

     Which interests you? (or suggest something else)
```

**ヒント:**
- ワークフローを学ぶ新規ユーザーに最適
- おもちゃのサンプルではなく、実際のコードを使用します
- 保持または破棄できる実際の変更を作成します
- 完了までに 15 ～ 30 分かかります

---

## AIツールによるコマンド構文

AI ツールが異なれば、使用するコマンド構文も若干異なります。ツールに一致する形式を使用してください。

|ツール |構文例 |
|------|----------------|
|クロード・コード | `/opsx:propose`、`/opsx:apply` |
|カーソル | `/opsx-propose`、`/opsx-apply` |
|ウィンドサーフィン | `/opsx-propose`、`/opsx-apply` |
|コパイロット (IDE) | `/opsx-propose`、`/opsx-apply` |
|オーマイパイ | `/opsx-propose`、`/opsx-apply` |
|キミ・クリ | `/skill:openspec-propose`、`/skill:openspec-apply-change` などのスキルベースの呼び出し (`opsx-*` コマンド ファイルは生成されません) |
|トレイ | `/opsx-propose`、`/opsx-apply` |

目的はどのツールでも同じですが、コマンドの表示方法は統合によって異なる場合があります。

> **注意:** GitHub Copilot コマンド (`.github/prompts/*.prompt.md`) は、IDE 拡張機能 (VS Code、JetBrains、Visual Studio) でのみ使用できます。 GitHub Copilot CLI は現在、カスタム プロンプト ファイルをサポートしていません。詳細と回避策については、[サポートされているツール](supported-tools.md)] を参照してください。

---

## 従来のコマンド

これらのコマンドは、古い「一括」ワークフローを使用します。これらは引き続き機能しますが、OPSX コマンドの使用をお勧めします。

|コマンド |何をするのか |
|---------|--------------|
| `/openspec:proposal` |すべての成果物 (提案書、仕様書、設計、タスク) を一度に作成 |
| `/openspec:apply` |変更を実装する |
| `/openspec:archive` |変更をアーカイブする |

**従来のコマンドを使用する場合:**
- 古いワークフローを使用している既存のプロジェクト
- 増分アーティファクト作成が不要な単純な変更
- 全か無かのアプローチを好む

**OPSX への移行:**
レガシーの変更は、OPSX コマンドを使用して続行できます。アーティファクト構造は互換性があります。

---

## トラブルシューティング

### 「変更が見つかりません」

コマンドは、どの変更を処理すべきかを特定できませんでした。

**解決策:**
- 変更名を明示的に指定します: `/opsx:apply add-dark-mode`
- 変更フォルダーが存在することを確認します: `openspec list`
- 正しいプロジェクト ディレクトリにいることを確認します

### 「アーティファクトの準備ができていません」

すべてのアーティファクトは完了しているか、欠落している依存関係によってブロックされています。

**解決策:**
- `openspec status --change <name>` を実行して、何がブロックされているかを確認します
- 必要なアーティファクトが存在するかどうかを確認します
- 不足している依存関係アーティファクトを最初に作成します

### 「スキーマが見つかりません」

指定されたスキーマは存在しません。

**解決策:**
- 利用可能なスキーマのリスト: `openspec schemas`
- スキーマ名のスペルを確認してください
- カスタムの場合はスキーマを作成します: `openspec schema init <name>`

### コマンドが認識されません

AI ツールは OpenSpec コマンドを認識しません。

**解決策:**
- OpenSpec が初期化されていることを確認します: `openspec init`
- スキル再生成：`openspec update`
- `.claude/skills/` ディレクトリが存在することを確認します (クロード コードの場合)
- AI ツールを再起動して新しいスキルを習得します

### アーティファクトが正しく生成されない

AI は不完全または不正確なアーティファクトを作成します。

**解決策:**
- `openspec/config.yaml` にプロジェクト コンテキストを追加
- 特定のガイダンスのためのアーティファクトごとのルールを追加します
- 変更の説明にさらに詳細を記載します
- より詳細に制御するには、`/opsx:continue` の代わりに `/opsx:ff` を使用します。

---

## 次のステップ

- [Workflows](workflows.md) - 一般的なパターンと各コマンドの使用時期
- [CLI](cli.md) - 管理と検証のための端末コマンド
- [カスタマイズ](customization.md) - カスタム スキーマとワークフローを作成する
