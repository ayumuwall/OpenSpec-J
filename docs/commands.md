# コマンド

OpenSpec のスラッシュコマンドのリファレンスです。これらのコマンドは AI コーディングアシスタント（例: Claude Code, Cursor, Windsurf）のチャット UI から呼び出します。

ワークフローの使い分けは [Workflows](workflows.md)、CLI コマンドは [CLI](cli.md) を参照してください。

> [!NOTE]
> 会話例や出力例のコードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO command examples -->

## クイックリファレンス

| コマンド | 目的 |
|---------|---------|
| `/opsx:explore` | 変更を始める前にアイデアを整理する |
| `/opsx:new` | 新しい変更を開始する |
| `/opsx:continue` | 依存関係に基づいて次のアーティファクトを作成する |
| `/opsx:ff` | Fast-forward: 計画アーティファクトを一括生成する |
| `/opsx:apply` | 変更のタスクを実装する |
| `/opsx:verify` | 実装がアーティファクトに沿っているか検証する |
| `/opsx:sync` | 仕様差分を本仕様へ統合する |
| `/opsx:archive` | 完了した変更をアーカイブする |
| `/opsx:bulk-archive` | 複数の変更を一括でアーカイブする |
| `/opsx:onboard` | ワークフロー全体をガイド付きで体験する |

---

## コマンドリファレンス

### `/opsx:explore`

変更を開始する前に、アイデアの整理・課題の調査・要件の明確化を行います。

**構文:**
```
/opsx:explore [topic]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `topic` | いいえ | 探索・調査したいテーマ |

**何をするか:**
- 形式に縛られない探索的な対話を開始
- コードベースを調査して疑問に答える
- 代替案やアプローチを比較
- 思考整理のための図を作成
- 洞察が固まったら `/opsx:new` に移行可能

**例:**
```text
あなた: /opsx:explore

AI:  何を探索しましょうか？

あなた: モバイルアプリの認証はどう実装するべき？

AI:  既存の認証構成を調べます...
     [コードベースを解析]

     Web はセッションベース認証ですね。
     モバイル向けには主に次の 3 案があります:

     1. JWT トークン（ステートレスでオフライン向き）
     2. OAuth2（サードパーティログインが必要な場合）
     3. 既存セッションの拡張（簡単だが接続が必要）

     既に API の CORS 設定はあります。どの方向に興味がありますか？

あなた: JWT にしよう。変更を作って開始できる？

AI:  準備できたら /opsx:new add-jwt-auth を実行してください。
```

**Tips:**
- 要件が曖昧なときや調査が必要なときに使う
- 探索中はアーティファクトを作成しない
- 複数案の比較に向いている
- ファイル読み込みや全文検索も可能

---

### `/opsx:new`

新しい変更を開始します。変更フォルダを作成し、選択したスキーマでひな形を用意します。

**構文:**
```
/opsx:new [change-name] [--schema <schema-name>]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 変更フォルダ名（未指定ならプロンプト） |
| `--schema` | いいえ | 使用するワークフロースキーマ（デフォルト: 設定 or `spec-driven`） |

**何をするか:**
- `openspec/changes/<change-name>/` を作成
- 変更フォルダに `.openspec.yaml` を作成
- 最初に作成できるアーティファクトを表示
- 変更名やスキーマ未指定ならプロンプト

**作成されるもの:**
```
openspec/changes/<change-name>/
└── .openspec.yaml    # 変更メタデータ（スキーマ、作成日など）
```

**例:**
```
あなた: /opsx:new add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     Schema: spec-driven

     Ready to create: proposal
     Use /opsx:continue to create it, or /opsx:ff to create all artifacts.
```

**Tips:**
- わかりやすい名前を付ける: `add-feature`, `fix-bug`, `refactor-module`
- `update`, `changes`, `wip` のような汎用名は避ける
- スキーマは `openspec/config.yaml` でも指定可能

---

### `/opsx:continue`

依存関係チェーン上で次のアーティファクトを作成します。1 つずつ進めたいときに使います。

**構文:**
```
/opsx:continue [change-name]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 続ける変更名（未指定なら文脈から推測） |

**何をするか:**
- アーティファクトの依存関係グラフを参照
- どれが ready / blocked かを表示
- ready の先頭アーティファクトを作成
- 依存ファイルを読み込んで文脈化
- 作成後に次の候補を提示

**例:**
```
あなた: /opsx:continue

AI:  Change: add-dark-mode

     Artifact status:
     ✓ proposal    (done)
     ◆ specs       (ready)
     ◆ design      (ready)
     ○ tasks       (blocked - needs: specs)

     Creating specs...

     [proposal.md を読み、要件に基づき specs を作成]

     ✓ Created openspec/changes/add-dark-mode/specs/ui/spec.md

     Now available: tasks
     Run /opsx:continue to create the next artifact.
```

**Tips:**
- 各アーティファクトを都度レビューしたいときに便利
- 複雑な変更でコントロールしたい場合に向く
- 複数のアーティファクトが同時に ready になることがある
- 作成後に編集してから続きを作れる

---

### `/opsx:ff`

アーティファクト作成を Fast-forward します。計画アーティファクトを一括生成します。

**構文:**
```
/opsx:ff [change-name]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 対象の変更名（未指定なら文脈から推測） |

**何をするか:**
- 依存順にすべてのアーティファクトを作成
- TODO リストで進捗を追跡
- `apply-required` のアーティファクトが完了したら停止
- 各アーティファクト作成前に依存を読み込む

**例:**
```
あなた: /opsx:ff add-dark-mode

AI:  Fast-forwarding add-dark-mode...

     ✓ Creating proposal.md
     ✓ Creating specs/ui/spec.md
     ✓ Creating design.md
     ✓ Creating tasks.md

     All planning artifacts complete!
     Ready for implementation. Run /opsx:apply to begin.
```

**Tips:**
- 何を作るか明確なときに向く
- `/opsx:continue` より速い
- 後から編集してもよい
- 小〜中規模の変更に向く

---

### `/opsx:apply`

変更のタスクを実装します。タスク一覧を見ながらコードを書き進めます。

**構文:**
```
/opsx:apply [change-name]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 実装対象の変更名（未指定なら文脈から推測） |

**何をするか:**
- `tasks.md` を読み、不完全なタスクを特定
- タスクを順番に実行
- コードを書き、必要ならテストを実行
- チェックボックス `[x]` で完了を記録

**例:**
```
あなた: /opsx:apply

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

**Tips:**
- 中断しても再開できる
- 変更名を指定すれば並行作業にも対応
- 進捗は `tasks.md` のチェックで管理

---

### `/opsx:verify`

実装がアーティファクトに合っているか検証します。完成度・正確性・整合性をチェックします。

**構文:**
```
/opsx:verify [change-name]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 検証対象の変更名（未指定なら文脈から推測） |

**何をするか:**
- 実装品質を 3 つの観点で確認
- コードベース内に実装の証拠があるか探索
- CRITICAL / WARNING / SUGGESTION で指摘を分類
- アーカイブをブロックしないが、問題を可視化

**検証の観点:**

| 観点 | 検証内容 |
|-----------|-------------------|
| **Completeness** | タスク完了、要件実装、シナリオ網羅 |
| **Correctness** | 仕様意図との一致、エッジケース対応 |
| **Coherence** | 設計意図の反映、パターン整合性 |

**例:**
```
あなた: /opsx:verify

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

**Tips:**
- アーカイブ前に実行してズレを早期発見する
- 警告はアーカイブを止めないが、問題のサイン
- AI 作業のレビューに向く
- 実装とアーティファクトの乖離を見つけられる

---

### `/opsx:sync`

**任意コマンド。** 変更の仕様差分を本仕様へ統合します。通常はアーカイブ時に確認が出るため、手動実行は必須ではありません。

**構文:**
```
/opsx:sync [change-name]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | 同期対象の変更名（未指定なら文脈から推測） |

**何をするか:**
- 変更フォルダの仕様差分を読み込み
- ADDED / MODIFIED / REMOVED / RENAMED を解析
- `openspec/specs/` に統合
- 差分に含まれない既存内容は保持
- 変更自体はアーカイブされない（アクティブのまま）

**例:**
```text
あなた: /opsx:sync

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

**手動で使う場面:**

| 状況 | sync を使う？ |
|----------|-----------|
| 長期変更で先に本仕様へ反映したい | はい |
| 複数の並行変更が最新仕様を必要とする | はい |
| マージ結果を別途レビューしたい | はい |
| すぐアーカイブする予定 | いいえ（アーカイブが処理する） |

**Tips:**
- ただのコピーではなく、差分を賢く統合する
- 既存要件へのシナリオ追加にも対応
- 同期後も変更はアクティブのまま
- 多くの場合はアーカイブ時の確認で十分

---

### `/opsx:archive`

完了した変更をアーカイブします。変更を確定し、アーカイブフォルダへ移動します。

**構文:**
```
/opsx:archive [change-name]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | アーカイブ対象の変更名（未指定なら文脈から推測） |

**何をするか:**
- アーティファクトの完了状況を確認
- タスク完了状況を確認（未完了なら警告）
- 仕様差分が未同期なら同期を提案
- 変更フォルダを `openspec/changes/archive/YYYY-MM-DD-<name>/` に移動
- 監査用にアーティファクトを保存

**例:**
```text
あなた: /opsx:archive

AI:  Archiving add-dark-mode...

     Artifact status:
     ✓ proposal.md exists
     ✓ specs/ exists
     ✓ design.md exists
     ✓ tasks.md exists (8/8 tasks complete)

     Delta specs: Not yet synced
     → Sync now? (recommended)

あなた: Yes

AI:  ✓ Synced specs to openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/

     Change archived successfully.
```

**Tips:**
- 未完了タスクがあってもアーカイブは可能だが警告される
- 仕様差分の同期はアーカイブ時でも事前でも可
- アーカイブ済み変更は履歴として保持される
- `/opsx:verify` を先に使うと安心

---

### `/opsx:bulk-archive`

複数の変更を一括でアーカイブします。仕様の競合も検出します。

**構文:**
```
/opsx:bulk-archive [change-names...]
```

**引数:**
| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-names` | いいえ | アーカイブ対象の変更（省略時は選択プロンプト） |

**何をするか:**
- 完了済み変更を一覧表示
- 各変更を検証
- 変更間の仕様競合を検出
- 実装状態を確認して競合を解消
- 作成日の古い順にアーカイブ

**例:**
```
あなた: /opsx:bulk-archive

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

あなた: Yes

AI:  ✓ Archived add-dark-mode
     ✓ Archived fix-login-bug
     ✓ Archived update-footer
     Specs merged: add-dark-mode → update-footer
```

**Tips:**
- 並行作業の整理に向く
- 競合解消はエージェントが実装状況を確認して行う
- 変更は作成日の順でアーカイブされる
- 仕様の上書き前に確認が入る

---

### `/opsx:onboard`

OpenSpec のワークフローを一通り体験するガイド付きオンボーディングです。実際のコードベースを使って進めます。

**構文:**
```
/opsx:onboard
```

**何をするか:**
- ワークフロー一周をナレーション付きで案内
- コードベースをスキャンして改善点を探す
- 実際の変更とアーティファクトを作成
- 小さく安全な改善を実装
- 変更をアーカイブ
- 各ステップを解説

**フェーズ:**
1. ウェルカムとコードベース解析
2. 改善ポイントの発見
3. 変更作成（`/opsx:new`）
4. proposal 作成
5. specs 作成
6. design 作成
7. tasks 作成
8. 実装（`/opsx:apply`）
9. 実装検証
10. 変更アーカイブ
11. まとめと次の手順

**例:**
```
あなた: /opsx:onboard

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

**Tips:**
- 初学者がワークフローを学ぶのに最適
- トイ例ではなく実コードで進める
- 作った変更は残しても捨ててもよい
- 所要時間は 15〜30 分程度

---

## AI ツール別のコマンド記法

AI ツールによってコマンド記法が少し異なります。各ツールに合わせた形式を使ってください。

| ツール | 記法例 |
|------|----------------|
| Claude Code | `/opsx:new`, `/opsx:apply` |
| Cursor | `/opsx-new`, `/opsx-apply` |
| Windsurf | `/opsx-new`, `/opsx-apply` |
| Copilot | `/opsx-new`, `/opsx-apply` |

記法が違っても機能は同一です。

---

## 旧コマンド

これらは旧来の「一括生成」ワークフローのコマンドです。現在は OPSX を推奨します。

| コマンド | 内容 |
|---------|--------------|
| `/openspec:proposal` | proposal/specs/design/tasks を一括生成 |
| `/openspec:apply` | 変更を実装 |
| `/openspec:archive` | 変更をアーカイブ |

**旧コマンドを使う場面:**
- 旧ワークフローを使っている既存プロジェクト
- 一括生成で十分な単純な変更
- 一度に作る運用が好みの場合

**OPSX への移行:**
旧来の変更も OPSX コマンドで継続できます。アーティファクト構造は互換です。

---

## トラブルシューティング

### "Change not found"

変更名が特定できませんでした。

**対処:**
- 変更名を明示: `/opsx:apply add-dark-mode`
- 変更フォルダの存在確認: `openspec list`
- 正しいディレクトリで実行しているか確認

### "No artifacts ready"

すべてのアーティファクトが完了済みか、依存関係でブロックされています。

**対処:**
- `openspec status --change <name>` でブロック要因を確認
- 依存アーティファクトの有無を確認
- 先に依存アーティファクトを作成

### "Schema not found"

指定したスキーマが存在しません。

**対処:**
- 利用可能なスキーマ一覧: `openspec schemas`
- スキーマ名の綴りを確認
- カスタムスキーマなら作成: `openspec schema init <name>`

### コマンドが認識されない

AI ツールが OpenSpec コマンドを認識しません。

**対処:**
- OpenSpec を初期化済みか確認: `openspec init`
- スキルを再生成: `openspec update`
- `.claude/skills/` があるか確認（Claude Code の場合）
- AI ツールを再起動してスキルを再読み込み

### アーティファクトがうまく生成されない

AI が不完全または不正確なアーティファクトを作成します。

**対処:**
- `openspec/config.yaml` にプロジェクトコンテキストを追加
- アーティファクト別ルールで補足指示を追加
- 変更説明を具体的にする
- `/opsx:ff` ではなく `/opsx:continue` を使う

---

## 次に読むもの

- [Workflows](workflows.md) - 代表的なフローと使い分け
- [CLI](cli.md) - 管理と検証のターミナルコマンド
- [Customization](customization.md) - カスタムスキーマとワークフロー
