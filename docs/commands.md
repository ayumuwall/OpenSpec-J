# コマンド

これは OpenSpec のスラッシュコマンドのリファレンスです。これらのコマンドは、Claude Code、Cursor、Windsurf などの AI コーディングアシスタントのチャットで実行します。

ワークフローパターンと各コマンドを使うタイミングは [ワークフロー](workflows.md) を参照してください。CLI コマンドについては [CLI](cli.md) を参照してください。

## クイックリファレンス

### デフォルトのクイックパス（`core` プロファイル）

|コマンド |目的 |
|---------|---------|
| `/opsx:propose` | 1 ステップで変更を作成し、計画成果物を生成する |
| `/opsx:explore` | 変更に取り組む前にアイデアを検討する |
| `/opsx:apply` |変更からタスクを実装する |
| `/opsx:update` |変更の計画成果物を改訂し、一貫性を保つ |
| `/opsx:sync` |仕様差分をメイン仕様にマージ |
| `/opsx:archive` |完了した変更をアーカイブする |

### 拡張ワークフローコマンド（カスタムワークフロー選択時）

|コマンド |目的 |
|---------|---------|
| `/opsx:new` | 新しい変更のひな形を作成する |
| `/opsx:continue` | 依存関係に基づいて次のアーティファクトを作成する |
| `/opsx:ff` | 早送り: すべての計画成果物を一度に作成する |
| `/opsx:verify` |実装がアーティファクトと一致することを検証する |
| `/opsx:bulk-archive` |複数の変更を一度にアーカイブ |
| `/opsx:onboard` | 完全なワークフローを体験するガイド付きチュートリアル |

デフォルトのグローバルプロファイルは `core` です。拡張ワークフローコマンドを有効にするには、`openspec config profile` を実行してワークフローを選び、その後プロジェクトで `openspec update` を実行します。

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
| `change-name-or-description` | いいえ | kebab-case の名前、または自然文で書いた変更の説明 |

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
- 最速のエンドツーエンドパスとして使います
- アーティファクトを段階的に制御したい場合は、拡張ワークフローを有効にして `/opsx:new` + `/opsx:continue` を使います

---

### `/opsx:explore`

> **迷ったときはここから始めてください。** Explore は、リスクのない思考パートナーです。コードベースを読み、選択肢を比較し、変更を作る前に曖昧なアイデアを具体的な計画へ近づけます。デフォルトプロファイルに含まれています。詳しくは [まずは探索する](explore.md) を参照してください。

変更に取り組む前に、アイデアを熟考し、問題を調査し、要件を明確にします。

**構文：**
```
/opsx:explore [topic]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `topic` | いいえ | 調べたいこと、考えたいこと |

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
- 要件が曖昧な場合、または調査が必要な場合に使います
- 探索中にアーティファクトは作成されません
- 決定する前に複数のアプローチを比較するのに適しています
- ファイルの読み取りとコードベースの検索が可能

---

### `/opsx:new`

新しい変更のひな形を作成します。変更フォルダーを作成し、`/opsx:continue` または `/opsx:ff` でアーティファクトを生成できる状態にします。

このコマンドは拡張ワークフローセットの一部です（デフォルトの `core` プロファイルには含まれていません）。

**構文：**
```
/opsx:new [change-name] [--schema <schema-name>]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 変更フォルダーの名前（指定しない場合はプロンプトが表示されます） |
| `--schema` | いいえ | 使用するワークフロースキーマ（デフォルト: 設定値または `spec-driven`） |

**機能:**
- `openspec/changes/<change-name>/` ディレクトリを作成します
- 変更フォルダーに `.openspec.yaml` メタデータファイルを作成します
- 作成可能な最初のアーティファクトテンプレートを表示します
- 名前やスキーマが指定されていない場合は入力を求めます

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

依存関係の順序に従って、次のアーティファクトを作成します。段階的に進めるため、一度に 1 つのアーティファクトを作ります。

**構文：**
```
/opsx:continue [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 続行する変更（指定しない場合はコンテキストから推測） |

**機能:**
- アーティファクトの依存関係グラフを確認します
- 準備ができているアーティファクトとブロックされているアーティファクトを表示します
- 最初に作成可能なアーティファクトを作成します
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
- 次へ進む前に各アーティファクトを確認したい場合に使います
- 制御が必要な複雑な変更に適しています
- 複数のアーティファクトが同時に準備可能になる場合があります
- 続行する前に、作成したアーティファクトを編集できます

---

### `/opsx:ff`

アーティファクト作成を fast-forward します。すべての計画成果物を一度に作成します。

**構文：**
```
/opsx:ff [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 早送りする変更（指定しない場合はコンテキストから推測） |

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
- `/opsx:continue` より速く、単純な変更に向いています
- 後でもアーティファクトを編集できます
- 小規模から中規模の機能に適しています

---

### `/opsx:apply`

変更内のタスクを実装します。コードを書き、完了した項目にチェックを入れながらタスクリストを進めます。

**構文：**
```
/opsx:apply [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 実装する変更（指定しない場合はコンテキストから推測） |

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

変更内の既存の計画成果物を改訂し、相互の一貫性を保ちます。対象は計画アーティファクトだけで、コードは編集しません。

**構文：**

```text
/opsx:update [change-name]
```

**引数:**

|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 更新する変更（指定しない場合はコンテキストから推測） |

**機能:**

- `openspec status --change <name> --json` 経由で変更のアーティファクトを読み取ります
- 要求された改訂を適用します。対象アーティファクトが指定されていない場合は、矛盾がないかレビューします
- 他の既存の成果物をあらゆる方向に調整します (デザインの編集が提案に反映される可能性があります)
- 書き込む前に、編集内容を 1 つずつ確認します
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

- 欠落したアーティファクトは作成しません。それは `/opsx:continue` の役割です。
- 変更がすでに実装済みの場合は、改訂後の計画にコードを合わせるため、続けて `/opsx:apply` を実行します。
- 改訂によって変更の *意図* が変わる場合は、新しい変更として始めてください。詳しくは [更新するか、新しく始めるか](opsx.md#when-to-update-vs-start-fresh) を参照してください。

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
| `change-name` | いいえ | 確認する変更（指定しない場合はコンテキストから推測） |

**機能:**
- 実装品質の 3 つの側面をチェックします
- コードベースで実装の証拠を検索します
- 重大、警告、または提案として分類された問題を報告します
- アーカイブはブロックされませんが、問題が表面化します

**検証観点:**

| 観点 | 検証内容 |
|-----------|-------------------|
| **完全性** | すべてのタスクが完了し、すべての要件が実装され、シナリオがカバーされている |
| **正確さ** | 実装が仕様の意図と一致し、エッジケースが処理されている |
| **一貫性** | 設計上の決定がコードに反映され、パターンが一貫している |

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
- アーティファクトと実装のずれを明らかにできます

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
| `change-name` | いいえ | 同期する変更（指定しない場合はコンテキストから推測） |

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

| シナリオ | 同期を使うか |
|----------|-----------|
| 長期の変更で、アーカイブ前にメイン仕様へ反映したい | はい |
| 複数の変更を並行しており、ベース仕様を更新しておきたい | はい |
| マージを個別にプレビュー/レビューしたい | はい |
| 小さな変更で、直接アーカイブする | いいえ（アーカイブが処理します） |

**ヒント:**
- 同期はコピーアンドペーストではなくインテリジェントに行われます
- 重複することなく、既存の要件にシナリオを追加できます。
- 変更は同期後もアクティブのままになります (アーカイブされません)
- ほとんどのユーザーが直接呼び出す必要はありません。必要な場合はアーカイブ時に確認されます。

---

### `/opsx:archive`

完了した変更をアーカイブします。変更を確定し、アーカイブフォルダーに移動します。

**構文：**
```
/opsx:archive [change-name]
```

**引数:**
|引数 |必須 |説明 |
|----------|----------|-------------|
| `change-name` | いいえ | アーカイブする変更（指定しない場合はコンテキストから推測） |

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
| `change-names` | いいえ | アーカイブする特定の変更（指定しない場合は選択を求めるプロンプトが表示されます） |

**機能:**
- 完了したすべての変更をリストします。
- アーカイブする前に各変更を検証します
- 変更にまたがる仕様の競合を検出します
- 実際に実装されている内容を確認して競合を解決します
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
- 競合解決ではエージェントがコードベースを確認します
- 変更は作成順にアーカイブされます
- 仕様の内容を上書きする前に確認します

---

### `/opsx:onboard`

完全な OpenSpec ワークフローを案内するオンボーディングです。実際のコードベースを使う対話型チュートリアルです。

**構文：**
```
/opsx:onboard
```

**機能:**
- ワークフロー全体を説明しながら進めます
- コードベースをスキャンして実際の改善の機会を探します
- 実際の成果物を使用して実際の変更を作成します
- 実際の作業を実装します（小さく安全な変更）
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

## AI ツールごとのコマンド構文

AI ツールが異なれば、使用するコマンド構文も若干異なります。ツールに一致する形式を使用してください。

|ツール |構文例 |
|------|----------------|
| Claude Code | `/opsx:propose`、`/opsx:apply` |
| Cursor | `/opsx-propose`、`/opsx-apply` |
| Windsurf | `/opsx-propose`、`/opsx-apply` |
| Copilot (IDE) | `/opsx-propose`、`/opsx-apply` |
| Oh My Pi | `/opsx-propose`、`/opsx-apply` |
| Kimi CLI | `/skill:openspec-propose`、`/skill:openspec-apply-change` などのスキルベースの呼び出し（`opsx-*` コマンドファイルは生成されません） |
| Trae | `/opsx-propose`、`/opsx-apply` |

目的はどのツールでも同じですが、コマンドの表示方法は統合によって異なる場合があります。

> **注意:** GitHub Copilot コマンド（`.github/prompts/*.prompt.md`）は、IDE 拡張機能（VS Code、JetBrains、Visual Studio）でのみ使用できます。GitHub Copilot CLI は現在、カスタムプロンプトファイルをサポートしていません。詳細と回避策は [サポートされているツール](supported-tools.md) を参照してください。

---

## 従来のコマンド

これらのコマンドは、古い「一括」ワークフローを使います。引き続き動作しますが、OPSX コマンドの使用を推奨します。

|コマンド |何をするのか |
|---------|--------------|
| `/openspec:proposal` |すべての成果物 (提案書、仕様書、設計、タスク) を一度に作成 |
| `/openspec:apply` |変更を実装する |
| `/openspec:archive` |変更をアーカイブする |

**従来のコマンドを使用する場合:**
- 古いワークフローを使用している既存のプロジェクト
- 増分アーティファクト作成が不要な単純な変更
- 一括で進める方法を好む

**OPSX への移行:**
レガシーの変更は OPSX コマンドで続行できます。アーティファクト構造は互換性があります。

---

## トラブルシューティング

### 「変更が見つかりません」

コマンドは、どの変更を処理すべきかを特定できませんでした。

**解決策:**
- 変更名を明示的に指定します: `/opsx:apply add-dark-mode`
- 変更フォルダーが存在することを確認します: `openspec list`
- 正しいプロジェクトディレクトリにいることを確認します

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
- `.claude/skills/` ディレクトリが存在することを確認します（Claude Code の場合）
- AI ツールを再起動して新しいスキルを読み込ませます

### アーティファクトが正しく生成されない

AI が不完全または不正確なアーティファクトを作成する場合があります。

**解決策:**
- `openspec/config.yaml` にプロジェクトコンテキストを追加します
- アーティファクトごとの `rules:` を追加して、具体的なガイダンスを与えます
- 変更の説明にさらに詳細を記載します
- より細かく制御するには、`/opsx:ff` ではなく `/opsx:continue` を使います

---

## 次のステップ

- [ワークフロー](workflows.md) - 一般的なパターンと各コマンドを使うタイミング
- [CLI](cli.md) - 管理と検証のためのターミナルコマンド
- [カスタマイズ](customization.md) - カスタムスキーマとワークフローを作成する
