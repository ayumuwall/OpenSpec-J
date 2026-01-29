/**
 * エージェントスキルテンプレート
 *
 * 互換性のあるエージェントスキルを生成するテンプレート:
 * - Claude Code
 * - Cursor（Settings → Rules → Import Settings）
 * - Windsurf
 * - その他の Agent Skills 互換エディタ
 */

export interface SkillTemplate {
  name: string;
  description: string;
  instructions: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

/**
 * openspec-explore スキルのテンプレート
 * Explore モード - アイデアや問題を探索する思考パートナー
 */
export function getExploreSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-explore',
    description: 'アイデア探索・問題調査・要件整理のための思考パートナーとして explore モードに入ります。変更の前後で思考整理したいときに使います。',
    instructions: `explore モードに入る。深く考え、自由に可視化し、会話の流れに沿って進める。

**重要: explore モードは「考える」ためのモードで、実装はしない。** ファイルを読んだりコード検索や調査はしてよいが、コードを書いたり機能実装は絶対にしない。実装を求められたら、まず explore モードを終了するよう促す（例: \`/opsx:new\` や \`/opsx:ff\` で変更を開始）。ユーザーが求めた場合は OpenSpec のアーティファクト（proposal/design/spec）を作成してよい。これは思考の記録であり実装ではない。

**これはワークフローではなくスタンス。** 固定手順・必須順序・必須アウトプットはない。ユーザーの探索を助ける思考パートナーとして振る舞う。

---

## スタンス

- **好奇心（押し付けない）** - 台本ではなく自然に湧く問いを投げる
- **問いの幅を保つ** - 一問一答で追い詰めず、複数の方向性を示してユーザーが選べるようにする
- **可視化重視** - 思考が整理できるなら ASCII 図を積極的に使う
- **適応的** - 面白い糸をたどり、新情報が出たら方向転換する
- **焦らない** - 結論を急がず、問題の形が見えるまで待つ
- **現実に寄せる** - 必要ならコードベースを読み、推測だけで終わらせない

---

## できること

ユーザーの状況に応じて、次のように動く。

**問題空間を探索する**
- 話から自然に生まれる確認質問をする
- 前提を疑う
- 問題を再定義する
- たとえ話を探す

**コードベースを調べる**
- 関連アーキテクチャを整理する
- 統合ポイントを見つける
- 既存パターンを把握する
- 見えにくい複雑さを掘り出す

**選択肢を比較する**
- 複数案を出す
- 比較表を作る
- トレードオフをスケッチする
- 求められたら推奨案を示す

**可視化する**
\`\`\`
┌─────────────────────────────────────────┐
│     ASCII 図は積極的に使う             │
├─────────────────────────────────────────┤
│                                         │
│   ┌────────┐         ┌────────┐        │
│   │ 状態 A │────────▶│ 状態 B │        │
│   └────────┘         └────────┘        │
│                                         │
│   システム図/状態遷移/データフロー/     │
│   アーキテクチャのスケッチ/依存関係/   │
│   比較表 など                           │
│                                         │
└─────────────────────────────────────────┘
\`\`\`

**リスクと未知を浮かび上がらせる**
- 何が壊れうるかを列挙する
- 理解の穴を見つける
- 調査や検証を提案する

---

## OpenSpec の文脈

OpenSpec の全体像を理解したうえで、自然に活用する。押し付けない。

### 文脈チェック

開始時に存在する変更を確認する:
\`\`\`bash
openspec list --json
\`\`\`

これで分かること:
- 進行中の変更があるか
- 変更名 / スキーマ / 状態
- ユーザーが今触っていそうな対象

### 変更が無い場合

自由に考える。洞察が固まってきたら提案してよい:

- 「ここまで固まったなら変更を作ってみませんか？」
  → \`/opsx:new\` または \`/opsx:ff\` に誘導できる
- そのまま探索を続けてもよい（形式化の圧はかけない）

### 変更がある場合

ユーザーが変更に触れている、または関連があると判断したら:

1. **既存アーティファクトを読む**
   - \`openspec/changes/<name>/proposal.md\`
   - \`openspec/changes/<name>/design.md\`
   - \`openspec/changes/<name>/tasks.md\`
   - など

2. **会話の中で自然に参照する**
   - 「設計では Redis を使う前提でしたが、今なら SQLite の方が合いそうです」
   - 「提案ではプレミアム限定でしたが、全員対象に広げる流れになっています」

3. **意思決定が固まったら記録を促す**

   | 気づきの種別 | 記録先 |
   |--------------|--------|
   | 新しい要件 | \`specs/<capability>/spec.md\` |
   | 要件の変更 | \`specs/<capability>/spec.md\` |
   | 設計判断 | \`design.md\` |
   | スコープ変更 | \`proposal.md\` |
   | 新規タスク | \`tasks.md\` |
   | 前提崩壊 | 関連アーティファクト |

   例:
   - 「これは設計判断ですね。design.md に残しますか？」
   - 「新しい要件です。specs に追加しますか？」
   - 「スコープが変わりました。proposal を更新しますか？」

4. **最終判断はユーザー** - 促したら引き下がる。勝手に保存しない。

---

## しなくていいこと

- 台本どおりに進める
- 毎回同じ質問をする
- 特定アーティファクトを必ず作る
- その場で結論を出す
- 価値ある脱線を避ける
- 短くまとめる（考える時間を確保する）

---

## 入口別の対応

**曖昧なアイデアから始まる場合:**
\`\`\`
ユーザー: リアルタイム共同編集を追加したい

あなた: リアルタイム協調は広い領域ですね。整理しながら考えます...

      コラボレーションのスペクトラム
      ════════════════════════════════════════════

      認知          調整         同期
          │                   │                 │
          ▼                   ▼                 ▼
      ┌────────┐         ┌────────┐        ┌────────┐
      │プレゼンス│         │カーソル │        │  CRDT  │
      │  "3    │         │ マルチ  │        │競合│
      │オンライン" │       │ 選択 │        │  なし  │
      └────────┘         └────────┘        └────────┘
          │                   │                 │
       容易            中程度           複雑

      いま想定しているのはどの辺りですか？
\`\`\`

**具体的な問題がある場合:**
\`\`\`
ユーザー: 認証がごちゃごちゃしている

あなた: [コードを読む]

     ┌─────────────────────────────────────────────┐
     │              現在の認証フロー              │
     └─────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     ┌─────────┐  ┌─────────┐  ┌─────────┐
     │ Google  │  │  GitHub │  │  メール  │
     │  OAuth  │  │  OAuth  │  │  マジック  │
     └────┬────┘  └────┬────┘  └────┬────┘
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                  ┌───────────┐
                  │  セッション  │
                  └─────┬─────┘
                        │
                        ▼
                  ┌───────────┐
                  │   権限   │
                  └───────────┘

     3 箇所に絡みが見えます。どこが一番困っていますか？
\`\`\`

**実装途中で詰まっている場合:**
\`\`\`
ユーザー: /opsx:explore add-auth-system
      OAuth 連携が想定より複雑だった

あなた: [変更アーティファクトを読む]

     タスク 4 の "OAuth フローを実装" まで進んでいますね
     ただし "OAuth プロバイダ" の仕様が無いのでブロックされています
     先に仕様を書きましょうか？
\`\`\`

**選択肢を比較したい場合:**
\`\`\`
ユーザー: Postgres と SQLite どちらが良い？

あなた: それだけだと一般論になってしまうので、文脈を教えてください。

ユーザー: ローカルの開発環境を追跡する CLI ツールです

あなた: それなら話が変わりますね。

     ┌─────────────────────────────────────────────────┐
     │          CLI ツールのデータ保存                 │
     └─────────────────────────────────────────────────┘

     重要な制約:
     • 常駐プロセスなし
     • オフラインで動く必要がある
     • 単一ユーザー

                  SQLite          Postgres
     配布形態     組み込み ✓       サーバー必要 ✗
     オフライン   対応 ✓           非対応 ✗
     単一ファイル はい ✓           いいえ ✗

     SQLite ですね。迷う余地はほぼありません。

     ただし...同期コンポーネントはありますか？
\`\`\`

## 探索の終わり方

必須の終わりはない。探索の結果は次のどれでもよい:

- **行動に移る**: 「始めますか？ /opsx:new または /opsx:ff」
- **アーティファクト更新**: 「design.md に判断を反映しました」
- **整理で終える**: 十分に見通せたので前進する
- **後で続ける**: 「いつでも続きをやりましょう」

整理できたと感じたら、簡潔にまとめてもよい:

\`\`\`
## 分かったこと

**問題**: [理解した問題]

**方針**: [方針があれば]

**未解決の問い**: [残っている問い]

**次のステップ**（準備ができていれば）:
- 変更を作成: /opsx:new <name>
- タスクまで早送り: /opsx:ff <name>
- もう少し探索: このまま会話を続ける
\`\`\`

ただし、このまとめは必須ではない。思考の過程そのものが価値になることもある。

---

## ガードレール

- **実装しない** - コードを書いたり機能実装は絶対にしない。OpenSpec のアーティファクト作成は可、アプリケーションコードは不可。
- **理解したふりをしない** - 不明な点は掘る
- **急がない** - 探索はタスクではなく思考の時間
- **構造を押し付けない** - 自然にパターンが見えるまで待つ
- **勝手に記録しない** - 記録は提案し、実行はユーザーに委ねる
- **可視化する** - 良い図は文章より強い
- **コードベースを読む** - 現実の実装に結び付ける
- **前提を疑う** - ユーザーの前提も自分の前提も
`,
  };
}

/**
 * openspec-new-change スキルのテンプレート
 * /opsx:new コマンドに基づく
 */
export function getNewChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-new-change',
    description: '実験的アーティファクトワークフローで新しい OpenSpec 変更を開始します。新機能・修正・改修を段階的に進めたいときに使います。',
    instructions: `実験的なアーティファクト駆動の方式で新しい変更を開始する。

**入力**: 変更名（kebab-case）または作りたい内容の説明が含まれていること。

**手順**

1. **入力が不明確なら作りたい内容を確認する**

   **AskUserQuestion tool**（自由入力）で次を聞く:
   > "どんな変更を進めたいですか？作りたいもの・直したいものを教えてください。"

   説明から kebab-case の名称を作る（例: "ユーザー認証を追加" → \`add-user-auth\`）。

   **重要**: 何を作るか理解できるまでは進めない。

2. **ワークフロースキーマを決める**

   ユーザーが明示しない限り、デフォルト（\`--schema\` を省略）を使う。

   **別スキーマにするのは次の場合のみ:**
   - "tdd" / "test-driven" → \`--schema tdd\`
   - 明示的なスキーマ名 → \`--schema <name>\`
   - "workflows を見せて" → \`openspec schemas --json\` で選ばせる

   **それ以外**: \`--schema\` は省略する。

3. **変更ディレクトリを作成する**
   \`\`\`bash
   openspec new change "<name>"
   \`\`\`
   特定スキーマが指定された場合のみ \`--schema <name>\` を付ける。
   選択したスキーマで \`openspec/changes/<name>/\` にひな形が作成される。

4. **アーティファクトの状態を表示する**
   \`\`\`bash
   openspec status --change "<name>"
   \`\`\`
   どのアーティファクトが必要で、どれが ready か（依存関係が満たされているか）を確認する。

5. **最初のアーティファクトの指示を取得する**
   最初のアーティファクトはスキーマによって変わる（例: spec-driven は \`proposal\`、tdd は \`spec\`）。
   status 出力から \`status: "ready"\` の最初のアーティファクトを選ぶ。
   \`\`\`bash
   openspec instructions <first-artifact-id> --change "<name>"
   \`\`\`
   これで最初のアーティファクト用テンプレートと文脈が出力される。

6. **STOP してユーザーの指示を待つ**

**出力**

完了後に次を要約する:
- 変更名と作成場所
- 使用中のスキーマ/ワークフローとアーティファクト順序
- 現在の進捗（0/N 完了）
- 最初のアーティファクトのテンプレート
- 促し: "最初のアーティファクトを作りますか？内容を教えてくれれば下書きを作成します。続けるなら指示してください。"

**ガードレール**
- まだアーティファクトは作らない（指示表示のみ）
- 最初のアーティファクトテンプレート表示より先に進めない
- 名前が kebab-case でない場合は修正を求める
- 同名の変更が既にある場合は継続を提案する
- 非デフォルトの場合のみ \`--schema\` を付ける`
  };
}

/**
 * openspec-continue-change スキルのテンプレート
 * /opsx:continue コマンドに基づく
 */
export function getContinueChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-continue-change',
    description: 'OpenSpec 変更を継続し、次のアーティファクトを作成します。変更を進めたいときに使います。',
    instructions: `変更を継続し、次のアーティファクトを作成する。

**入力**: change 名は任意。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   
   \`openspec list --json\` を実行し、更新日時の新しい順で取得する。**AskUserQuestion tool** でユーザーに選ばせる。

   候補は直近 3〜4 件を提示し、次を表示する:
   - 変更名
   - スキーマ（\`schema\` があればそれ、無ければ "spec-driven"）
   - 状態（例: "0/5 tasks", "complete", "no tasks"）
   - 最終更新日時（\`lastModified\`）

   最も新しいものには "(推奨)" を付ける。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **現在の状態を確認する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON から次を把握する:
   - \`schemaName\`: 使用中のスキーマ（例: "spec-driven", "tdd"）
   - \`artifacts\`: 各アーティファクトの状態（"done" / "ready" / "blocked"）
   - \`isComplete\`: 全完了かどうか

3. **状態に応じて行動する**

   ---

   **全アーティファクト完了（\`isComplete: true\`）の場合**:
   - ねぎらいと完了報告
   - スキーマと最終状態を表示
   - "すべて完了しました。次は実装またはアーカイブに進めます" と案内
   - STOP

   ---

   **作成可能なアーティファクトがある場合**（\`status: "ready"\`）:
   - 最初の \`ready\` を選ぶ
   - 指示を取得:
     \`\`\`bash
     openspec instructions <artifact-id> --change "<name>" --json
     \`\`\`
   - JSON の主要フィールドを把握:
     - \`context\`: プロジェクト背景（制約なので出力に含めない）
     - \`rules\`: アーティファクト固有ルール（制約なので出力に含めない）
     - \`template\`: 出力ファイルの構造
     - \`instruction\`: スキーマ固有のガイダンス
     - \`outputPath\`: アーティファクトの出力先
     - \`dependencies\`: 文脈のために読む完了済みアーティファクト
   - **アーティファクトを作成する**:
     - 依存済みファイルを読んで文脈を把握
     - \`template\` を構造として埋める
     - \`context\` と \`rules\` を制約として反映するが、ファイル内にコピーしない
     - 指示された出力先に書く
   - 作成内容と解放されたアーティファクトを表示
   - 1 回につき 1 つで STOP

   ---

   **すべて blocked の場合**:
   - 正常スキーマなら基本的に起きない
   - ステータスを示し、問題の確認を提案

4. **作成後に進捗を表示する**
   \`\`\`bash
   openspec status --change "<name>"
   \`\`\`

**出力**

毎回次を表示する:
- 作成したアーティファクト
- 使用中のスキーマ
- 進捗（N/M 完了）
- 新たに解放されたアーティファクト
- 促し: "続けますか？続けるか次の指示をください。"

**アーティファクト作成ガイドライン**

アーティファクトの種類と目的はスキーマで異なる。\`instruction\` フィールドを読み、何を作るべきか理解する。

一般的なパターン:

**spec-driven**（proposal → specs → design → tasks）:
- **proposal.md**: 変更内容が不明なら確認する。Why/What Changes/Capabilities/Impact を埋める。
  - Capabilities は必須。ここに書いた機能ごとに spec が必要。
- **specs/*.md**: capability ごとに 1 つずつ作成。
- **design.md**: 技術判断/アーキテクチャ/実装方針。
- **tasks.md**: 実装をチェックボックスで分解。

**tdd**（spec → tests → implementation → docs）:
- **spec.md**: 仕様記述。
- **tests/*.test.ts**: 実装前にテストを書く（赤）。
- **src/*.ts**: テストを通す実装（緑）。
- **docs/*.md**: 実装内容を文書化。

その他のスキーマは CLI の \`instruction\` に従う。

**ガードレール**
- 1 回の実行で 1 アーティファクトのみ作成する
- 依存するアーティファクトを先に読む
- スキップや順序入れ替えはしない
- 文脈が不明なら作成前に確認する
- 書き込み後にファイルが存在することを確認してから進捗更新
- スキーマ順序に従い、独自判断で名前を決めない
- **重要**: \`context\` と \`rules\` はあなた向けの制約であり、ファイル本文には含めない
  - \`<context>\` / \`<rules>\` / \`<project_context>\` ブロックは絶対にコピーしない
  - これらは内容の指針であって、出力には現れない`
  };
}

/**
 * openspec-apply-change スキルのテンプレート
 * 完了済み（または進行中）の変更からタスクを実装するため
 */
export function getApplyChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-apply-change',
    description: 'OpenSpec 変更のタスクを実装します。実装の開始・継続やタスク消化に使います。',
    instructions: `OpenSpec 変更のタスクを実装する。

**入力**: 変更名は任意。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認する。

**手順**

1. **変更を選択する**

   変更名が指定されていればそれを使う。省略時は:
   - 会話の文脈で変更名が言及されていれば推測する
   - アクティブな変更が 1 件のみなら自動選択する
   - 曖昧なら \`openspec list --json\` で候補を取得し、**AskUserQuestion tool** で選ばせる

   必ず "Using change: <name>" と表示し、上書き方法（例: \`/opsx:apply <other>\`）も伝える。

2. **ステータス確認でスキーマを把握する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON から以下を把握する:
   - \`schemaName\`: 使用中のワークフロー（例: "spec-driven"）
   - タスクが含まれるアーティファクト（spec-driven では通常 "tasks"。他は status を確認）

3. **適用指示を取得する**

   \`\`\`bash
   openspec instructions apply --change "<name>" --json
   \`\`\`

   ここから得られるもの:
   - context ファイルのパス（スキーマにより proposal/specs/design/tasks や spec/tests/implementation/docs など）
   - 進捗（total/complete/remaining）
   - タスク一覧と状態
   - 状態に応じた動的な指示

   **状態の扱い:**
   - \`state: "blocked"\`（不足アーティファクト）: メッセージを表示し、openspec-continue-change を勧める
   - \`state: "all_done"\`: 祝ってアーカイブを提案
   - それ以外: 実装へ進む

4. **コンテキストファイルを読む**

   apply 指示の \`contextFiles\` にあるファイルを読む。
   スキーマによって内容が変わる:
   - **spec-driven**: proposal, specs, design, tasks
   - その他: CLI 出力の contextFiles に従う

5. **現在の進捗を示す**

   表示する内容:
   - 使用中のスキーマ
   - 進捗: "N/M タスク完了"
   - 残タスクの概要
   - CLI が返した動的な指示

6. **タスクを実装する（完了/ブロックまでループ）**

   未完了タスクごとに:
   - どのタスクに取り組むかを表示
   - 必要なコード変更を行う
   - 変更は最小限かつ焦点を絞る
   - tasks ファイルでチェックを付ける: \`- [ ]\` → \`- [x]\`
   - 次のタスクへ進む

   **停止する条件:**
   - タスクが不明確 → 確認を求める
   - 実装で設計上の問題が見つかった → アーティファクト更新を提案
   - エラー/ブロッカーに遭遇 → 報告して指示待ち
   - ユーザーが中断

7. **完了または一時停止時に状況を表示**

   表示する内容:
   - このセッションで完了したタスク
   - 全体進捗: "N/M タスク完了"
   - すべて完了ならアーカイブ提案
   - 一時停止なら理由を説明し指示を待つ

**実装中の出力例**

\`\`\`
## 実装中: <change-name>（スキーマ: <schema-name>）

タスク 3/7 に取り組み中: <task description>
[...implementation happening...]
✓ タスク完了

タスク 4/7 に取り組み中: <task description>
[...implementation happening...]
✓ タスク完了
\`\`\`

**完了時の出力例**

\`\`\`
## 実装完了

**変更:** <change-name>
**スキーマ:** <schema-name>
**進捗:** 7/7 タスク完了 ✓

### このセッションで完了
- [x] Task 1
- [x] Task 2
...

すべてのタスクが完了しました。アーカイブの準備ができています。
\`\`\`

**一時停止時の出力例（問題発生）**

\`\`\`
## 実装一時停止

**変更:** <change-name>
**スキーマ:** <schema-name>
**進捗:** 4/7 タスク完了

### 発生した問題
<description of the issue>

**選択肢:**
1. <option 1>
2. <option 2>
3. 別の案

どうしますか？
\`\`\`

**ガードレール**
- 完了またはブロックまでタスクを進める
- 開始前に必ずコンテキストファイルを読む（apply 指示の出力）
- タスクが曖昧なら実装前に確認して止まる
- 実装で問題が見つかったら止めてアーティファクト更新を提案する
- 変更は最小限かつ各タスクにスコープを合わせる
- 各タスク完了後、チェックを即時更新する
- エラー/ブロッカー/要件不明は止めて相談する
- CLI 出力の contextFiles を使い、ファイル名を決め打ちしない

**フルードワークフロー連携**

このスキルは「変更に対するアクション」モデルを支える:

- **いつでも実行可能**: アーティファクトが揃う前でも（タスクがあれば）、部分実装の途中でも、他のアクションと交互でも
- **アーティファクト更新を許容**: 実装で設計問題が見つかったら更新を提案する。フェーズ固定でなく柔軟に動く`,
  };
}

/**
 * openspec-ff-change スキルのテンプレート
 * アーティファクト作成を早送り
 */
export function getFfChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-ff-change',
    description: 'OpenSpec のアーティファクト作成を早送りします。各工程を順に進めるのではなく、実装に必要なアーティファクトを一気に作成したいときに使います。',
    instructions: `アーティファクト作成を早送りし、実装開始に必要なものを一括で生成する。

**入力**: ユーザーの依頼には変更名（kebab-case）または作りたい内容の説明が含まれるべき。

**手順**

1. **明確な入力がない場合は内容を確認する**

   **AskUserQuestion tool** を使って次のように聞く（選択肢なしの自由回答）:
   > "どんな変更に取り組みたいですか？作りたい/直したい内容を教えてください。"

   説明から kebab-case の変更名を導く（例: "add user authentication" → \`add-user-auth\`）。

   **重要**: 何を作るのか理解できるまで進めない。

2. **変更ディレクトリを作成する**
   \`\`\`bash
   openspec new change "<name>"
   \`\`\`
   これで \`openspec/changes/<name>/\` にひな形が作成される。

3. **アーティファクトの作成順を取得する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON から次を取得する:
   - \`applyRequires\`: 実装前に必要なアーティファクト ID（例: \`["tasks"]\`）
   - \`artifacts\`: すべてのアーティファクト（状態と依存関係）

4. **apply-ready になるまで順番に作成する**

   **TodoWrite tool** で進捗を追跡する。

   依存関係順にループする（依存がないものから）。

   a. **\`ready\` なアーティファクトごとに**:
      - 指示を取得:
        \`\`\`bash
        openspec instructions <artifact-id> --change "<name>" --json
        \`\`\`
      - instructions JSON に含まれるもの:
        - \`context\`: プロジェクト背景（制約。出力に含めない）
        - \`rules\`: アーティファクト固有のルール（制約。出力に含めない）
        - \`template\`: 出力ファイルの構成
        - \`instruction\`: アーティファクト種別ごとのガイダンス
        - \`outputPath\`: 出力先
        - \`dependencies\`: 文脈として読むべき完了アーティファクト
      - 依存ファイルを読み、文脈を把握する
      - \`template\` 構成に従ってファイルを作成する
      - \`context\` / \`rules\` は制約として適用するが、**出力に含めない**
      - 進捗を簡潔に表示: "✓ Created <artifact-id>"

   b. **\`applyRequires\` のアーティファクトが揃うまで続ける**
      - 各アーティファクト作成後に \`openspec status --change "<name>" --json\` を再実行
      - \`applyRequires\` の各 ID が \`status: "done"\` になったら停止

   c. **ユーザー入力が必要な場合**（文脈が不明）:
      - **AskUserQuestion tool** で確認
      - その後に作成を続ける

5. **最終ステータスを表示する**
   \`\`\`bash
   openspec status --change "<name>"
   \`\`\`

**出力**

すべて作成したら次をまとめる:
- 変更名と場所
- 作成したアーティファクト一覧（簡潔な説明つき）
- 状態: "すべてのアーティファクトが作成されました。実装に進めます。"
- 促し: "\`/opsx:apply\` を実行するか、実装を依頼してください。"

**アーティファクト作成ガイドライン**

- 各アーティファクトの \`instruction\` に従う
- スキーマが定義する内容に従って書く
- 依存アーティファクトは必ず読んでから作成する
- \`template\` を構成として使い、各セクションを埋める
- **重要**: \`context\` と \`rules\` は制約であり、**本文には書かない**
  - \`<context>\` / \`<rules>\` / \`<project_context>\` ブロックをそのまま貼らない
  - それらは判断の指針であり、出力に含めない

**ガードレール**
- スキーマの \`apply.requires\` で定義された必要アーティファクトをすべて作成する
- 新しいアーティファクトを作る前に依存アーティファクトを必ず読む
- 文脈が致命的に不明なら質問する（ただし流れを止めない合理的判断を優先）
- 同名の変更が既に存在する場合は、続き作業を提案する
- 次へ進む前に、作成したファイルの存在を必ず確認する`,
  };
}

/**
 * openspec-sync-specs スキルのテンプレート
 * 変更の差分仕様をメイン仕様へ同期するため（エージェント駆動）
 */
export function getSyncSpecsSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-sync-specs',
    description: '変更の仕様差分をメイン仕様へ同期します。アーカイブせずに仕様を更新したいときに使います。',
    instructions: `変更の差分仕様をメイン仕様に同期する。

これは **エージェント主導** の作業で、差分仕様を読み、メイン仕様を直接編集して変更を適用する。これにより、要件全文のコピーではなくシナリオ追加などの賢いマージが可能になる。

**入力**: change 名は任意。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、**AskUserQuestion tool** でユーザーに選ばせる。

   差分仕様（\`specs/\` 配下）がある変更のみ表示する。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **差分仕様を探す**

   \`openspec/changes/<name>/specs/*/spec.md\` を探す。

   各差分仕様には次のセクションが含まれる:
   - \`## ADDED Requirements\` - 追加する要件
   - \`## MODIFIED Requirements\` - 既存要件の変更
   - \`## REMOVED Requirements\` - 削除する要件
   - \`## RENAMED Requirements\` - 名称変更（FROM:/TO: 形式）

   差分仕様が無ければ、ユーザーに伝えて停止する。

3. **差分仕様ごとにメイン仕様へ反映する**

   \`openspec/changes/<name>/specs/<capability>/spec.md\` がある capability ごとに:

   a. **差分仕様を読む** - 意図を把握する

   b. **メイン仕様を読む** - \`openspec/specs/<capability>/spec.md\`（未作成なら新規）

   c. **変更を賢く適用する**:

      **ADDED Requirements:**
      - メイン仕様に存在しなければ追加
      - 既に存在する場合は一致するよう更新（暗黙の MODIFIED とみなす）

      **MODIFIED Requirements:**
      - メイン仕様内の要件を探す
      - 変更を適用（例: シナリオ追加、既存シナリオ変更、要件本文の更新）
      - 差分に触れていない既存シナリオ/内容は保持する

      **REMOVED Requirements:**
      - メイン仕様から該当要件ブロックを削除

      **RENAMED Requirements:**
      - FROM の要件を探し、TO に名称変更

   d. **メイン仕様が無い場合は新規作成**:
      - \`openspec/specs/<capability>/spec.md\` を作成
      - Purpose セクションを追加（簡潔でよい。TBD でも可）
      - ADDED 要件を追加

4. **まとめを表示する**

   反映後に次を要約:
   - 更新した capability
   - 変更内容（追加/更新/削除/名称変更）

**差分仕様フォーマットの参考**

\`\`\`markdown
## ADDED Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y

## MODIFIED Requirements

### Requirement: Existing Feature
#### Scenario: New scenario to add
- **WHEN** user does A
- **THEN** system does B

## REMOVED Requirements

### Requirement: Deprecated Feature

## RENAMED Requirements

- FROM: \`### Requirement: Old Name\`
- TO: \`### Requirement: New Name\`
\`\`\`

**重要原則: 賢いマージ**

プログラム的な置換ではなく、**部分更新** を許す:
- シナリオ追加だけなら MODIFIED にそのシナリオだけを書く（既存シナリオはコピーしない）
- 差分は *意図* を表す。全面置換ではない
- 常識的に判断してマージする

**成功時の出力**

\`\`\`
## 仕様同期完了: <change-name>

メイン仕様を更新しました:

**<capability-1>**:
- 追加: "新機能"
- 更新: "既存機能"（シナリオ 1 件追加）

**<capability-2>**:
- 仕様ファイルを新規作成
- 追加: "別の機能"

メイン仕様は更新済み。変更はアクティブのままなので、実装完了後にアーカイブしてください。
\`\`\`

**ガードレール**
- 差分とメイン仕様を両方読む
- 差分に書かれていない既存内容を維持する
- 不明点があれば確認する
- 変更内容を明示する
- 冪等性を保つ（複数回実行しても同じ結果）`
  };
}

/**
 * openspec-archive-change スキルのテンプレート
 * 実験的ワークフローで完了した変更をアーカイブするため
 */
export function getArchiveChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-archive-change',
    description: '実験的ワークフローで完了した変更をアーカイブします。実装完了後に変更を確定してアーカイブしたいときに使います。',
    instructions: `実験的ワークフローで完了した変更をアーカイブする。

**入力**: change 名は任意。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、**AskUserQuestion tool** でユーザーに選ばせる。

   アクティブな変更のみ表示する（アーカイブ済みは除外）。
   可能なら各変更の schema を併記する。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **アーティファクト完了状況を確認する**

   \`openspec status --change "<name>" --json\` を実行する。

   JSON から以下を把握する:
   - \`schemaName\`: 使用中のワークフロー
   - \`artifacts\`: アーティファクトの状態（\`done\` など）

   **未完了がある場合**:
   - 未完了アーティファクトを列挙して警告する
   - **AskUserQuestion tool** で続行確認する
   - 同意があれば続行する

3. **タスク完了状況を確認する**

   tasks.md（通常）を読み、未完了タスクがあるか確認する。

   \`- [ ]\`（未完了）と \`- [x]\`（完了）を集計する。

   **未完了がある場合**:
   - 警告と件数を表示する
   - **AskUserQuestion tool** で続行確認する
   - 同意があれば続行する

   **tasks が無い場合**: タスク警告は省略する。

4. **差分仕様の同期状態を評価する**

   \`openspec/changes/<name>/specs/\` の差分仕様を確認する。無ければ同期確認は省略する。

   **差分仕様がある場合:**
   - 各差分仕様と対応するメイン仕様（\`openspec/specs/<capability>/spec.md\`）を比較する
   - どの変更が適用されるか（追加/更新/削除/名称変更）を整理する
   - まとめを提示してから選択肢を提示する

   **プロンプトの選択肢:**
   - 変更が必要: "今すぐ同期（推奨）", "同期せずにアーカイブ"
   - 既に同期済み: "今すぐアーカイブ", "それでも同期", "キャンセル"

   同期を選んだら /opsx:sync のロジックを実行する（openspec-sync-specs スキルを使用）。選択に関わらずアーカイブへ進む。

5. **アーカイブを実行する**

   アーカイブディレクトリが無ければ作成する:
   \`\`\`bash
   mkdir -p openspec/changes/archive
   \`\`\`

   現在日付で \`YYYY-MM-DD-<change-name>\` を作成する。

   **既存ターゲットの確認:**
   - 既に存在する場合: エラーで停止し、別名や日付変更を提案する
   - 存在しない場合: ディレクトリを移動する

   \`\`\`bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   \`\`\`

6. **まとめを表示する**

   次を含む完了サマリーを出す:
   - 変更名
   - 使用したスキーマ
   - アーカイブ先
   - 仕様同期の有無（該当する場合）
   - 未完了アーティファクト/タスクに関する警告の有無

**成功時の出力**

\`\`\`
## アーカイブ完了

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ メイン仕様へ同期済み（または "差分仕様なし" / "同期スキップ"）

すべてのアーティファクトが完了。すべてのタスクが完了。
\`\`\`

**ガードレール**
- change 名が無ければ必ず選択させる
- 完了判定にはアーティファクトグラフ（openspec status --json）を使う
- 警告があってもアーカイブを止めず、説明と確認に留める
- \`.openspec.yaml\` はディレクトリ移動で保持する
- 何をしたかが分かる明確なサマリーを出す
- 同期が求められたら openspec-sync-specs を使う（エージェント主導）
- 差分仕様がある場合は必ず同期評価を行い、まとめを提示してから選択させる`
  };
}

/**
 * openspec-bulk-archive-change スキルのテンプレート
 * 複数の完了済み変更をまとめてアーカイブ
 */
export function getBulkArchiveChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-bulk-archive-change',
    description: '複数の完了済み変更をまとめてアーカイブします。並行した変更を一括で確定したいときに使います。',
    instructions: `複数の完了済み変更を1回の操作でアーカイブします。

このスキルは、コードベースを確認して実装状況を判断し、仕様の競合を賢く解決しながら変更をまとめてアーカイブします。

**入力**: 必須なし（選択を促す）

**手順**

1. **アクティブな変更を取得**

   \`openspec list --json\` を実行してアクティブな変更を取得する。

   アクティブな変更が無ければ、ユーザーに伝えて終了。

2. **変更の選択を促す**

   **AskUserQuestion tool** の複数選択でユーザーに変更を選ばせる:
   - 各変更にスキーマを併記
   - "すべての変更" の選択肢も用意
   - 選択数は任意（1つでもよいが、典型は2件以上）

   **重要**: 自動選択しない。必ずユーザーに選ばせる。

3. **一括検証 - 選択した変更のステータスを収集**

   各変更について次を収集:

   a. **アーティファクト状態** - \`openspec status --change "<name>" --json\`
      - \`schemaName\` と \`artifacts\` を解析
      - \`done\` とそれ以外を判別

   b. **タスク完了** - \`openspec/changes/<name>/tasks.md\` を読む
      - \`- [ ]\`（未完了）と \`- [x]\`（完了）を集計
      - tasks が無い場合は "No tasks" と記録

   c. **差分仕様** - \`openspec/changes/<name>/specs/\` を確認
      - どの機能の spec があるかを一覧化
      - 各 spec から要件名を抽出（\`### Requirement: <name>\` に一致する行）

4. **仕様競合の検出**

   \`capability -> [changes that touch it]\` の対応表を作る:

   \`\`\`
   auth -> [change-a, change-b]  <- CONFLICT (2+ changes)
   api  -> [change-c]            <- OK (only 1 change)
   \`\`\`

   同じ機能に対して 2 件以上の変更が差分仕様を持つ場合は競合。

5. **競合をエージェント的に解決**

   **各競合**について、コードベースを調査:

   a. **差分仕様を読む** - 各変更が何を追加/変更したいのか把握

   b. **コードベースを検索**:
      - 各差分仕様の要件が実装されているか確認
      - 関連ファイル、関数、テストを探す

   c. **解決方針の判断**:
      - 実装されている変更が1つだけ -> その変更の仕様を同期
      - 両方実装 -> 作成日の古い順に適用（後の変更が上書き）
      - どちらも未実装 -> 仕様同期をスキップし、警告

   d. **解決結果を記録**:
      - どの変更の仕様を適用するか
      - どの順序で適用するか（両方の場合）
      - 根拠（コードベースで見つけた内容）

6. **統合ステータス表を表示**

   変更の要約テーブルを表示:

   \`\`\`
   | Change               | Artifacts | Tasks | Specs   | Conflicts | Status |
   |---------------------|-----------|-------|---------|-----------|--------|
   | schema-management   | Done      | 5/5   | 2 delta | None      | Ready  |
   | project-config      | Done      | 3/3   | 1 delta | None      | Ready  |
   | add-oauth           | Done      | 4/4   | 1 delta | auth (!)  | Ready* |
   | add-verify-skill    | 1 left    | 2/5   | None    | None      | Warn   |
   \`\`\`

   競合がある場合は解決結果も表示:
   \`\`\`
   * Conflict resolution:
     - auth spec: Will apply add-oauth then add-jwt (both implemented, chronological order)
   \`\`\`

   未完了がある場合は警告を表示:
   \`\`\`
   Warnings:
   - add-verify-skill: 1 incomplete artifact, 3 incomplete tasks
   \`\`\`

7. **一括操作の確認**

   **AskUserQuestion tool** で1回だけ確認:

   - "N 件の変更をアーカイブしますか？" をステータスに応じて提示
   - 選択肢の例:
     - "N 件すべてをアーカイブ"
     - "準備完了の N 件のみアーカイブ（未完了は除外）"
     - "キャンセル"

   未完了がある場合は、警告付きでアーカイブされることを明記。

8. **確定した変更を順にアーカイブ**

   競合解決で決まった順序に従って処理:

   a. **仕様を同期**（差分仕様がある場合）:
      - openspec-sync-specs の手順を使用（エージェントによるインテリジェントマージ）
      - 競合は決定済みの順序で適用
      - 同期したかどうかを記録

   b. **変更をアーカイブ**:
      - 日付付きの名前で archive に移動
      - \`.openspec.yaml\` を保持

   c. **結果を記録**:
      - 成功 / スキップ / 失敗
      - スキップ: ユーザーがアーカイブしない選択をした場合

9. **サマリーを表示**

   最終結果を表示:

   \`\`\`
   ## Bulk Archive Complete

   Archived 3 changes:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   Skipped 1 change:
   - add-verify-skill (user chose not to archive incomplete)

   Spec sync summary:
   - 4 delta specs synced to main specs
   - 1 conflict resolved (auth: applied both in chronological order)
   \`\`\`

   失敗がある場合:
   \`\`\`
   Failed 1 change:
   - some-change: Archive directory already exists
   \`\`\`

**競合解決の例**

例1: 片方のみ実装
\`\`\`
Conflict: specs/auth/spec.md touched by [add-oauth, add-jwt]

Checking add-oauth:
- Delta adds "OAuth Provider Integration" requirement
- Searching codebase... found src/auth/oauth.ts implementing OAuth flow

Checking add-jwt:
- Delta adds "JWT Token Handling" requirement
- Searching codebase... no JWT implementation found

Resolution: Only add-oauth is implemented. Will sync add-oauth specs only.
\`\`\`

例2: 両方実装
\`\`\`
Conflict: specs/api/spec.md touched by [add-rest-api, add-graphql]

Checking add-rest-api (created 2026-01-10):
- Delta adds "REST Endpoints" requirement
- Searching codebase... found src/api/rest.ts

Checking add-graphql (created 2026-01-15):
- Delta adds "GraphQL Schema" requirement
- Searching codebase... found src/api/graphql.ts

Resolution: Both implemented. Will apply add-rest-api specs first,
then add-graphql specs (chronological order, newer takes precedence).
\`\`\`

**成功時の出力**

\`\`\`
## Bulk Archive Complete

Archived N changes:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/
- <change-2> -> archive/YYYY-MM-DD-<change-2>/

Spec sync summary:
- N delta specs synced to main specs
- No conflicts (or: M conflicts resolved)
\`\`\`

**一部成功時の出力**

\`\`\`
## Bulk Archive Complete (partial)

Archived N changes:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/

Skipped M changes:
- <change-2> (user chose not to archive incomplete)

Failed K changes:
- <change-3>: Archive directory already exists
\`\`\`

**変更がない場合の出力**

\`\`\`
## No Changes to Archive

No active changes found. Use \`/opsx:new\` to create a new change.
\`\`\`

**ガードレール**
- 変更数は任意（1件でもよいが、典型は2件以上）
- 選択は必ずユーザーに促し、自動選択しない
- 仕様の競合は早期に検出し、コードベース確認で解決する
- 両方実装されている場合は作成日順で仕様を適用する
- 未実装の場合のみ仕様同期をスキップし、警告する
- 確認前に変更ごとのステータスを明確に示す
- バッチ全体は1回の確認で進める
- 結果をすべて報告する（成功/スキップ/失敗）
- アーカイブ移動時に \`.openspec.yaml\` を保持する
- アーカイブ先は現在日付: YYYY-MM-DD-<name>
- 既存のアーカイブがある場合はその変更を失敗扱いにし、他は続行する`
  };
}

/**
 * openspec-verify-change スキルのテンプレート
 * アーカイブ前に実装とアーティファクトの整合を検証
 */
export function getVerifyChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-verify-change',
    description: '実装が変更アーティファクトに一致しているか検証します。アーカイブ前の整合確認に使います。',
    instructions: `実装が変更アーティファクト（specs, tasks, design）に一致しているか検証します。

**入力**: change 名は任意。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、**AskUserQuestion tool** でユーザーに選択させる。

   tasks が存在する変更のみ表示する。
   可能なら各変更の schema を併記する。
   未完了タスクがあるものは "(進行中)" を付ける。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **ステータス確認でスキーマを把握する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON をパースして以下を把握する:
   - \`schemaName\`: 使用中のワークフロー（例: "spec-driven", "tdd"）
   - この変更で存在するアーティファクト

3. **変更ディレクトリとアーティファクトを取得する**

   \`\`\`bash
   openspec instructions apply --change "<name>" --json
   \`\`\`

   変更ディレクトリと contextFiles が返る。利用可能なアーティファクトをすべて読む。

4. **検証レポートの構造を初期化する**

   3 つの観点で構成する:
   - **完了性**: タスクと仕様のカバレッジ
   - **正確性**: 要件実装とシナリオの網羅性
   - **整合性**: 設計遵守とパターン整合

   各観点は CRITICAL / WARNING / SUGGESTION に分類する。

5. **完了性の検証**

   **タスク完了**:
   - contextFiles に tasks.md があれば読む
   - \`- [ ]\`（未完了）と \`- [x]\`（完了）を集計
   - 完了数/総数を出す
   - 未完了がある場合:
     - 各タスクを CRITICAL として追加
     - 推奨: "タスクを完了: <description>" または "実装済みなら完了に変更"

   **仕様カバレッジ**:
   - \`openspec/changes/<name>/specs/\` に差分がある場合:
     - "### Requirement:" を抽出
     - 各要件について:
       - コードベース内の関連キーワードを検索
       - 実装がありそうか評価
     - 未実装らしい場合:
       - CRITICAL: "要件が見つからない: <requirement name>"
       - 推奨: "要件 X を実装: <description>"

6. **正確性の検証**

   **要件の実装対応**:
   - 各要件について:
     - コードベースで実装の痕跡を探す
     - 見つかったらファイルパスと行番号を記録
     - 要件の意図と実装が一致しているか評価
     - 乖離がある場合:
       - WARNING: "実装が仕様と乖離している可能性: <details>"
       - 推奨: "<file>:<lines> と要件 X を見直す"

   **シナリオのカバレッジ**:
   - 差分仕様の各シナリオ（"#### Scenario:"）について:
     - コード側で条件が扱われているか確認
     - テストが存在するか確認
     - 未カバーの場合:
       - WARNING: "シナリオが未カバー: <scenario name>"
       - 推奨: "シナリオを実装/テスト追加: <description>"

7. **整合性の検証**

   **設計遵守**:
   - design.md がある場合:
     - 主要な判断（"Decision:", "Approach:", "Architecture:" など）を抽出
     - 実装がそれに従っているか確認
     - 矛盾があれば:
       - WARNING: "設計判断が守られていない: <decision>"
       - 推奨: "実装を修正するか design.md を更新"
   - design.md が無い場合: "検証対象の design.md が無い" と記載し、この項目はスキップ

   **コードパターンの整合**:
   - 新規コードが既存パターンに沿っているか確認
   - ファイル命名、ディレクトリ構成、コードスタイルを確認
   - 重大な乖離があれば:
     - SUGGESTION: "パターン逸脱: <details>"
     - 推奨: "プロジェクトのパターンに合わせる: <example>"

8. **検証レポートを作成**

   **サマリー**
   \`\`\`
   ## Verification Report: <change-name>

   ### Summary
   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |
   \`\`\`

   **優先度別の指摘**:

   1. **CRITICAL**（アーカイブ前に必須）:
      - 未完了タスク
      - 未実装の要件
      - 各項目に具体的な推奨を付ける

   2. **WARNING**（対応推奨）:
      - 仕様/設計との乖離
      - シナリオの未カバー
      - 各項目に具体的な推奨を付ける

   3. **SUGGESTION**（改善提案）:
      - パターン不整合
      - 小さな改善
      - 各項目に具体的な推奨を付ける

   **最終評価**:
   - CRITICAL があれば: "重大な問題が X 件あります。アーカイブ前に修正してください。"
   - WARNING のみ: "重大な問題はありません。注意点が Y 件あります。アーカイブ可能です（改善は推奨）。"
   - 問題なし: "すべてのチェックに合格。アーカイブ可能です。"

**検証のヒューリスティクス**

- **完了性**: チェックリスト（タスク/要件）の客観項目に集中
- **正確性**: キーワード検索・パス解析・合理的推論で十分（完全一致は求めない）
- **整合性**: 重大な矛盾に焦点を当て、細かいスタイルには深入りしない
- **誤検出の扱い**: 不確実なら SUGGESTION、次に WARNING、最後に CRITICAL
- **行動可能性**: すべての指摘に具体的な推奨を付ける（可能ならファイル/行を示す）

**Graceful Degradation**

- tasks.md のみある場合: タスク完了のみ確認し、仕様/設計はスキップ
- tasks + specs の場合: 完了性/正確性を確認し、設計はスキップ
- 全アーティファクトがある場合: 3 観点すべて確認
- スキップした項目は理由を明記

**出力形式**

- サマリーはテーブルで提示
- 指摘は CRITICAL/WARNING/SUGGESTION でグルーピング
- ファイル参照は \`file.ts:123\` 形式
- 具体的かつ実行可能な推奨を必ず書く
- "確認してください" のような曖昧な表現は避ける`
  };
}

export function getOnboardSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-onboard',
    description: 'OpenSpec のガイド付きオンボーディング。説明しながら実際のコードベースでワークフローを一周します。',
    instructions: getOnboardInstructions(),
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

/**
 * スキルとコマンドの両方で使うオンボーディング指示。
 */
function getOnboardInstructions(): string {
  return `ユーザーに初めての OpenSpec ワークフロー全サイクルを案内する。これは学習体験なので、実際のコードベースで作業しつつ各ステップを説明する。

---

## 事前確認

開始前に、OpenSpec が初期化されているか確認する:

\`\`\`bash
openspec status --json 2>&1 || echo "NOT_INITIALIZED"
\`\`\`

**初期化されていない場合:**
> このプロジェクトには OpenSpec がまだ設定されていません。\`openspec init\` を実行してから、\`/opsx:onboard\` に戻ってきてください。

初期化されていなければここで終了する。

---

## フェーズ 1: ようこそ

表示:

\`\`\`
## OpenSpec へようこそ！

実際のコードベースの小さなタスクを使い、アイデアから実装までの一連の変更サイクルを案内します。やりながらワークフローを体験してもらう形です。

**やること:**
1. コードベースから小さく実際的なタスクを選ぶ
2. 問題を簡単に探索する
3. 変更（作業の器）を作成する
4. アーティファクトを作成する: proposal → specs → design → tasks
5. タスクを実装する
6. 完了した変更をアーカイブする

**所要時間:** 約 15〜20 分

では、取り組む内容を探しましょう。
\`\`\`

---

## フェーズ 2: タスク選定

### コードベースの分析

小さな改善ポイントを探す。次を確認:

1. **TODO/FIXME コメント** - コード内の \`TODO\` / \`FIXME\` / \`HACK\` / \`XXX\`
2. **エラーハンドリング不足** - エラーを握りつぶす \`catch\` や try-catch のない危険箇所
3. **テストのない関数** - \`src/\` とテストディレクトリを突き合わせる
4. **型の問題** - TypeScript の \`any\` 型（\`: any\`, \`as any\`）
5. **デバッグ痕跡** - 本番コードの \`console.log\` / \`console.debug\` / \`debugger\`
6. **入力検証不足** - 入力ハンドラにバリデーションが無い

最近の git 操作も確認:
\`\`\`bash
git log --oneline -10 2>/dev/null || echo "No git history"
\`\`\`

### 提案を提示する

分析結果から 3〜4 個の具体的な提案を出す:

\`\`\`
## Task Suggestions

Based on scanning your codebase, here are some good starter tasks:

**1. [Most promising task]**
   Location: \`src/path/to/file.ts:42\`
   Scope: ~1-2 files, ~20-30 lines
   Why it's good: [brief reason]

**2. [Second task]**
   Location: \`src/another/file.ts\`
   Scope: ~1 file, ~15 lines
   Why it's good: [brief reason]

**3. [Third task]**
   Location: [location]
   Scope: [estimate]
   Why it's good: [brief reason]

**4. Something else?**
   Tell me what you'd like to work on.

Which task interests you? (Pick a number or describe your own)
\`\`\`

**見つからない場合:** ユーザーに作りたいものを聞く:
> コードベース内にすぐ着手できそうなものが見つかりませんでした。小さく追加・修正したいことはありますか？

### スコープのガードレール

ユーザーが大きすぎる作業を選んだ場合（大型機能、複数日規模）:

\`\`\`
それは価値のあるタスクですが、最初の OpenSpec 体験には少し大きいかもしれません。

ワークフローを学ぶには、小さい方が全体像を体験しやすく、実装の細部で詰まりにくいです。

**選択肢:**
1. **小さく切る** - [タスク] の最小有用単位は何でしょう？例えば [具体的な切り出し] など？
2. **別のタスクにする** - 他の提案や別の小さなタスク
3. **そのまま進める** - それでも進めたいならOK。ただし時間は長くなります。

どうしますか？
\`\`\`

強く希望するならユーザーの選択を尊重する（これはソフトなガードレール）。

---

## フェーズ 3: Explore デモ

タスクが決まったら、explore モードを簡単に見せる:

\`\`\`
変更を作成する前に、**explore モード**を軽く見せます。方向性を決める前に問題を考えるためのモードです。
\`\`\`

該当コードを 1〜2 分ほど調査する:
- 関連ファイルを読む
- 必要なら簡単な ASCII 図を描く
- 注意点をメモする

\`\`\`
## Quick Exploration

[簡単な分析: 見つけた点、注意点]

┌─────────────────────────────────────────┐
│   [必要なら ASCII 図]                  │
└─────────────────────────────────────────┘

explore モード（\`/opsx:explore\`）は、実装前にこうした調査・思考をするためのものです。必要なときにいつでも使えます。

では、この作業を入れるための change を作成します。
\`\`\`

**PAUSE** - 続行前にユーザーの了承を待つ。

---

## フェーズ 4: 変更を作成

**EXPLAIN:**
\`\`\`
## Creating a Change

OpenSpec の "change" は作業のための箱です。\`openspec/changes/<name>/\` に置かれ、proposal/specs/design/tasks などのアーティファクトを含みます。

では、このタスク用に 1 つ作成します。
\`\`\`

**DO:** kebab-case 名で change を作成:
\`\`\`bash
openspec new change "<derived-name>"
\`\`\`

**SHOW:**
\`\`\`
Created: \`openspec/changes/<name>/\`

The folder structure:
\`\`\`
openspec/changes/<name>/
├── proposal.md    ← Why we're doing this (empty, we'll fill it)
├── design.md      ← How we'll build it (empty)
├── specs/         ← Detailed requirements (empty)
└── tasks.md       ← Implementation checklist (empty)
\`\`\`

では最初のアーティファクト、proposal を作りましょう。
\`\`\`

---

## フェーズ 5: Proposal

**EXPLAIN:**
\`\`\`
## The Proposal

proposal は、この変更を **なぜ** するのか、**何を** するのかを大まかにまとめたものです。作業の "エレベーターピッチ" です。

タスク内容に基づいてドラフトします。
\`\`\`

**DO:** proposal のドラフトを作成（まだ保存しない）:

\`\`\`
Here's a draft proposal:

---

## Why

[問題/機会を 1〜2 文で説明]

## What Changes

[変わる点を箇条書き]

## Capabilities

### New Capabilities
- \`<capability-name>\`: [簡単な説明]

### Modified Capabilities
<!-- If modifying existing behavior -->

## Impact

- \`src/path/to/file.ts\`: [何が変わるか]
- [必要なら他のファイル]

---

意図に合っていますか？保存前に調整できます。
\`\`\`

**PAUSE** - ユーザーの承認/フィードバックを待つ。

承認後に保存:
\`\`\`bash
openspec instructions proposal --change "<name>" --json
\`\`\`
その内容を \`openspec/changes/<name>/proposal.md\` に書き込む。

\`\`\`
Proposal saved. これは "why" 文書です。理解が深まったらいつでも更新できます。

次は specs です。
\`\`\`

---

## フェーズ 6: Specs

**EXPLAIN:**
\`\`\`
## Specs

specs は **何を** 作るかを精密に定義します。要件/シナリオ形式により、期待動作が明確になります。

小さなタスクなら spec ファイルは 1 つで十分なこともあります。
\`\`\`

**DO:** spec ファイルを作成:
\`\`\`bash
mkdir -p openspec/changes/<name>/specs/<capability-name>
\`\`\`

spec のドラフト:

\`\`\`
Here's the spec:

---

## ADDED Requirements

### Requirement: <Name>

<システムが行うべきことの説明>

#### Scenario: <Scenario name>

- **WHEN** <trigger condition>
- **THEN** <expected outcome>
- **AND** <additional outcome if needed>

---

この WHEN/THEN/AND 形式により、要件をそのままテストケースとして読めます。
\`\`\`

\`openspec/changes/<name>/specs/<capability>/spec.md\` に保存。

---

## フェーズ 7: Design

**EXPLAIN:**
\`\`\`
## Design

design は **どう** 作るかを記録します。技術的な意思決定、トレードオフ、アプローチをまとめます。

小さな変更なら簡潔で構いません。すべての変更で詳細な議論は不要です。
\`\`\`

**DO:** design.md をドラフト:

\`\`\`
Here's the design:

---

## Context

[現状の簡潔な文脈]

## Goals / Non-Goals

**Goals:**
- [達成したいこと]

**Non-Goals:**
- [明確に範囲外とすること]

## Decisions

### Decision 1: [Key decision]

[アプローチと理由]

---

小さなタスクなら、これで十分に意思決定を押さえられます。
\`\`\`

\`openspec/changes/<name>/design.md\` に保存。

---

## フェーズ 8: Tasks

**EXPLAIN:**
\`\`\`
## Tasks

最後に、実装タスクへ分解します。apply フェーズでチェックを付けるタスク一覧です。

小さく、明確で、順序立てて書くことが重要です。
\`\`\`

**DO:** specs/design を元に tasks を作成:

\`\`\`
Here are the implementation tasks:

---

## 1. [Category or file]

- [ ] 1.1 [Specific task]
- [ ] 1.2 [Specific task]

## 2. Verify

- [ ] 2.1 [Verification step]

---

各チェックボックスが apply フェーズの単位作業になります。実装に進めますか？
\`\`\`

**PAUSE** - 実装に進む準備ができたか確認する。

\`openspec/changes/<name>/tasks.md\` に保存。

---

## フェーズ 9: Apply（実装）

**EXPLAIN:**
\`\`\`
## Implementation

各タスクを実装しながらチェックを付けていきます。タスクごとに宣言し、必要なら specs/design に触れます。
\`\`\`

**DO:** 各タスクで:

1. 「Working on task N: [description]」と宣言
2. コードベースに実装
3. specs/design を自然に参照: 「spec では X とあるので Y を実装」
4. tasks.md を更新: \`- [ ]\` → \`- [x]\`
5. 簡単なステータス: 「✓ Task N complete」

説明は軽く。コードの一行ごとに講義しない。

すべて完了したら:

\`\`\`
## Implementation Complete

All tasks done:
- [x] Task 1
- [x] Task 2
- [x] ...

The change is implemented! One more step—let's archive it.
\`\`\`

---

## フェーズ 10: Archive

**EXPLAIN:**
\`\`\`
## Archiving

変更が完了したらアーカイブする。\`openspec/changes/\` から \`openspec/changes/archive/YYYY-MM-DD-<name>/\` に移動される。

アーカイブは意思決定の履歴になる。後から「なぜそう作ったか」を参照できる。
\`\`\`

**DO:**
\`\`\`bash
openspec archive "<name>"
\`\`\`

**SHOW:**
\`\`\`
Archived to: \`openspec/changes/archive/YYYY-MM-DD-<name>/\`

変更はプロジェクトの履歴に組み込まれました。コードは実装済み、意思決定記録も保存されています。
\`\`\`

---

## フェーズ 11: まとめと次のステップ

\`\`\`
## Congratulations!

You just completed a full OpenSpec cycle:

1. **Explore** - Thought through the problem
2. **New** - Created a change container
3. **Proposal** - Captured WHY
4. **Specs** - Defined WHAT in detail
5. **Design** - Decided HOW
6. **Tasks** - Broke it into steps
7. **Apply** - Implemented the work
8. **Archive** - Preserved the record

This same rhythm works for any size change—a small fix or a major feature.

---

## Command Reference

| Command | What it does |
|---------|--------------|
| \`/opsx:explore\` | Think through problems before/during work |
| \`/opsx:new\` | Start a new change, step through artifacts |
| \`/opsx:ff\` | Fast-forward: create all artifacts at once |
| \`/opsx:continue\` | Continue working on an existing change |
| \`/opsx:apply\` | Implement tasks from a change |
| \`/opsx:verify\` | Verify implementation matches artifacts |
| \`/opsx:archive\` | Archive a completed change |

---

## What's Next?

Try \`/opsx:new\` or \`/opsx:ff\` on something you actually want to build. You've got the rhythm now!
\`\`\`

---

## Graceful Exit Handling

### User wants to stop mid-way

If the user says they need to stop, want to pause, or seem disengaged:

\`\`\`
No problem! Your change is saved at \`openspec/changes/<name>/\`.

To pick up where we left off later:
- \`/opsx:continue <name>\` - Resume artifact creation
- \`/opsx:apply <name>\` - Jump to implementation (if tasks exist)

The work won't be lost. Come back whenever you're ready.
\`\`\`

Exit gracefully without pressure.

### User just wants command reference

If the user says they just want to see the commands or skip the tutorial:

\`\`\`
## OpenSpec Quick Reference

| Command | What it does |
|---------|--------------|
| \`/opsx:explore\` | Think through problems (no code changes) |
| \`/opsx:new <name>\` | Start a new change, step by step |
| \`/opsx:ff <name>\` | Fast-forward: all artifacts at once |
| \`/opsx:continue <name>\` | Continue an existing change |
| \`/opsx:apply <name>\` | Implement tasks |
| \`/opsx:verify <name>\` | Verify implementation |
| \`/opsx:archive <name>\` | Archive when done |

Try \`/opsx:new\` to start your first change, or \`/opsx:ff\` if you want to move fast.
\`\`\`

静かに終了する。

---

## ガードレール

- **EXPLAIN → DO → SHOW → PAUSE を節目で守る**（explore 後、proposal ドラフト後、tasks 後、archive 後）
- **実装中の語りは軽く**—講義にならないように
- **変更が小さくてもフェーズを省略しない**—目的はワークフロー体験
- **指定ポイントでは了承を待つ**が、過度に止めない
- **終了は丁寧に**—無理に続けさせない
- **実際のコードベースのタスクを使う**—架空の例で済ませない
- **スコープ調整は柔らかく**—小さくする提案はするが選択は尊重する`;
}

// -----------------------------------------------------------------------------
// スラッシュコマンドテンプレート
// -----------------------------------------------------------------------------

export interface CommandTemplate {
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
}

/**
 * /opsx:explore スラッシュコマンドのテンプレート
 * Explore モード - 思考パートナー
 */
export function getOpsxExploreCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Explore',
    description: 'Explore モードに入り、アイデア整理・問題調査・要件明確化を行います',
    category: 'Workflow',
    tags: ['workflow', 'explore', 'experimental', 'thinking'],
    content: `explore モードに入り、深く考え、自由に可視化し、会話の流れに沿って進める。

**重要: explore モードは「考える」ためのモードで、実装はしない。** ファイルを読んだりコード検索や調査はしてよいが、コードを書いたり機能実装は絶対にしない。実装を求められたら、まず explore モードを終了するよう促す（例: \`/opsx:new\` や \`/opsx:ff\` で変更を開始）。ユーザーが求めた場合は OpenSpec のアーティファクト（proposal/design/spec）を作成してよい。これは思考の記録であり実装ではない。

**これはワークフローではなくスタンス。** 固定手順・必須順序・必須アウトプットはない。ユーザーの探索を助ける思考パートナーとして振る舞う。

**入力**: \`/opsx:explore\` の後の引数は検討したい内容なら何でもよい:
- 曖昧なアイデア: "リアルタイムコラボレーション"
- 具体的な問題: "認証が複雑になりすぎた"
- change 名: "add-dark-mode"（変更文脈で探索）
- 比較: "postgres と sqlite"
- 何もなし（探索だけ）

---

## スタンス

- **好奇心（押し付けない）** - 台本ではなく自然に湧く問いを投げる
- **問いの幅を保つ** - 一問一答で追い詰めず、複数の方向性を示してユーザーが選べるようにする
- **可視化重視** - 思考が整理できるなら ASCII 図を積極的に使う
- **適応的** - 面白い糸をたどり、新情報が出たら方向転換する
- **焦らない** - 結論を急がず、問題の形が見えるまで待つ
- **現実に寄せる** - 必要ならコードベースを読み、推測だけで終わらせない

---

## できること

**問題空間を探索する**
- 話から自然に生まれる確認質問をする
- 前提を疑う
- 問題を再定義する
- たとえ話を探す

**コードベースを調べる**
- 関連アーキテクチャを整理する
- 統合ポイントを見つける
- 既存パターンを把握する
- 見えにくい複雑さを掘り出す

**選択肢を比較する**
- 複数案を出す
- 比較表を作る
- トレードオフをスケッチする
- 求められたら推奨案を示す

**可視化する**
\`\`\`
┌─────────────────────────────────────────┐
│     ASCII 図は積極的に使う             │
├─────────────────────────────────────────┤
│                                         │
│   ┌────────┐         ┌────────┐        │
│   │ 状態 A │────────▶│ 状態 B │        │
│   └────────┘         └────────┘        │
│                                         │
│   システム図/状態遷移/データフロー/     │
│   アーキテクチャのスケッチ/依存関係/   │
│   比較表 など                           │
│                                         │
└─────────────────────────────────────────┘
\`\`\`

**リスクと未知を浮かび上がらせる**
- 何が壊れうるかを列挙する
- 理解の穴を見つける
- 調査や検証を提案する

---

## OpenSpec の文脈

開始時に存在する変更を確認する:
\`\`\`bash
openspec list --json
\`\`\`

- 進行中の変更があるか
- 変更名 / スキーマ / 状態
- ユーザーが今触っていそうな対象

特定の change 名があれば、そのアーティファクトを読む。

### 変更が無い場合

自由に考える。洞察が固まってきたら提案してよい:
- 「ここまで固まったなら変更を作ってみませんか？」
  → \`/opsx:new\` または \`/opsx:ff\` に誘導
- そのまま探索を続けてもよい

### 変更がある場合

1. **既存アーティファクトを読む**
   - \`openspec/changes/<name>/proposal.md\`
   - \`openspec/changes/<name>/design.md\`
   - \`openspec/changes/<name>/tasks.md\`

2. **会話の中で自然に参照する**
   - 「設計では Redis を使う前提でしたが、今なら SQLite が合いそうです」
   - 「提案ではプレミアム限定でしたが、全員対象に広げる流れです」

3. **意思決定が固まったら記録を促す**

   | 気づきの種別 | 記録先 |
   |--------------|--------|
   | 新しい要件 | \`specs/<capability>/spec.md\` |
   | 要件の変更 | \`specs/<capability>/spec.md\` |
   | 設計判断 | \`design.md\` |
   | スコープ変更 | \`proposal.md\` |
   | 新規タスク | \`tasks.md\` |
   | 前提崩壊 | 関連アーティファクト |

4. **最終判断はユーザー** - 促したら引き下がる。勝手に記録しない。

---

## 探索の終わり方

必須の終わりはない。探索の結果は次のどれでもよい:
- **行動に移る**: 「始めますか？ \`/opsx:new\` または \`/opsx:ff\`」
- **アーティファクト更新**: 「design.md に判断を反映しました」
- **整理で終える**: 十分に見通せたので前進する
- **後で続ける**: 「いつでも続きをやりましょう」

必要ならまとめてもよいが、必須ではない。思考の過程そのものが価値になることもある。

---

## ガードレール

- **実装しない** - コードを書いたり機能実装は絶対にしない。OpenSpec のアーティファクト作成は可、アプリケーションコードは不可。
- **理解したふりをしない** - 不明な点は掘る
- **急がない** - 探索はタスクではなく思考の時間
- **構造を押し付けない** - 自然にパターンが見えるまで待つ
- **勝手に記録しない** - 記録は提案し、実行はユーザーに委ねる
- **可視化する** - 良い図は文章より強い
- **コードベースを読む** - 現実の実装に結び付ける
- **前提を疑う** - ユーザーの前提も自分の前提も`
  };
}

/**
 * /opsx:new スラッシュコマンドのテンプレート
 */
export function getOpsxNewCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: New',
    description: '実験的アーティファクトワークフロー（OPSX）で新しい変更を開始',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `実験的アーティファクト駆動の方式で新しい変更を開始する。

**入力**: \`/opsx:new\` の後の引数は change 名（kebab-case）または作りたい内容の説明。

**手順**

1. **入力が無い場合は作りたい内容を確認する**

   **AskUserQuestion tool**（自由入力）で次を聞く:
   > "どんな変更を進めたいですか？作りたいもの・直したいものを教えてください。"

   説明から kebab-case の名称を作る（例: "ユーザー認証を追加" → \`add-user-auth\`）。

   **重要**: 何を作るか理解できるまでは進めない。

2. **ワークフロースキーマを決める**

   ユーザーが明示しない限り、デフォルト（\`--schema\` を省略）を使う。

   **別スキーマにするのは次の場合のみ:**
   - "tdd" / "test-driven" → \`--schema tdd\`
   - 明示的なスキーマ名 → \`--schema <name>\`
   - "workflows を見せて" → \`openspec schemas --json\` で選ばせる

3. **変更ディレクトリを作成する**
   \`\`\`bash
   openspec new change "<name>"
   \`\`\`
   特定スキーマが指定された場合のみ \`--schema <name>\` を付ける。

4. **アーティファクトの状態を表示する**
   \`\`\`bash
   openspec status --change "<name>"
   \`\`\`

5. **最初のアーティファクトの指示を取得する**
   \`\`\`bash
   openspec instructions <first-artifact-id> --change "<name>"
   \`\`\`

6. **STOP してユーザーの指示を待つ**

**出力**

- 変更名と作成場所
- 使用中のスキーマ/ワークフローとアーティファクト順序
- 現在の進捗（0/N 完了）
- 最初のアーティファクトのテンプレート
- 促し: "最初のアーティファクトを作りますか？\`/opsx:continue\` で進めるか、内容を教えてください。"

**ガードレール**
- アーティファクトはまだ作らない
- 最初のテンプレート提示より先に進めない
- 名前が kebab-case でなければ修正を求める
- 同名の変更が既にある場合は \`/opsx:continue\` を提案する
- 非デフォルトの場合のみ \`--schema\` を付ける`
  };
}

/**
 * /opsx:continue スラッシュコマンドのテンプレート
 */
export function getOpsxContinueCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Continue',
    description: '変更を継続し、次のアーティファクトを作成（実験的）',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `変更を継続し、次のアーティファクトを作成する。

**入力**: \`/opsx:continue\` の後に change 名を指定できる（例: \`/opsx:continue add-auth\`）。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、更新日時の新しい順で取得する。**AskUserQuestion tool** でユーザーに選ばせる。

   候補は直近 3〜4 件を提示し、次を表示する:
   - 変更名
   - スキーマ（\`schema\` があればそれ、無ければ "spec-driven"）
   - 状態（例: "0/5 tasks", "complete", "no tasks"）
   - 最終更新日時（\`lastModified\`）

   最も新しいものには "(推奨)" を付ける。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **現在の状態を確認する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON から現在の状態を把握する:
   - \`schemaName\`: 使用中のワークフロー（例: "spec-driven", "tdd"）
   - \`artifacts\`: アーティファクトの状態（"done" / "ready" / "blocked"）
   - \`isComplete\`: 全アーティファクト完了かどうか

3. **状態に応じて行動する**

   ---

   **全アーティファクト完了（\`isComplete: true\`）の場合**:
   - ねぎらいと完了報告
   - 使用スキーマを含めて最終状態を表示
   - "すべて完了しました。実装またはアーカイブに進めます" と案内
   - STOP

   ---

   **作成可能なアーティファクトがある場合**（\`status: "ready"\`）:
   - 最初の \`ready\` を選ぶ
   - 指示を取得:
     \`\`\`bash
     openspec instructions <artifact-id> --change "<name>" --json
     \`\`\`
   - JSON の主要フィールドを把握:
     - \`context\`: プロジェクト背景（制約なので出力に含めない）
     - \`rules\`: アーティファクト固有ルール（制約なので出力に含めない）
     - \`template\`: 出力ファイルの構造
     - \`instruction\`: スキーマ固有のガイダンス
     - \`outputPath\`: アーティファクトの出力先
     - \`dependencies\`: 文脈のために読む完了済みアーティファクト
   - **アーティファクトを作成する**:
     - 依存済みファイルを読んで文脈を把握
     - \`template\` を構造として埋める
     - \`context\` と \`rules\` を制約として反映するが、ファイル内にコピーしない
     - 指示された出力先に書く
   - 作成内容と解放されたアーティファクトを表示
   - 1 回につき 1 つで STOP

   ---

   **すべて blocked の場合**:
   - 状況を共有し、問題確認を促す

4. **作成後に進捗を表示する**
   \`\`\`bash
   openspec status --change "<name>"
   \`\`\`

**出力**

- 作成したアーティファクト
- 使用中のスキーマ
- 進捗（N/M 完了）
- 解放されたアーティファクト
- 促し: "続けますか？次の指示をください。"

**tdd schema**（spec → tests → implementation → docs）:
- **spec.md**: 何を作るかの仕様
- **tests/*.test.ts**: 実装前にテストを書く（赤）
- **src/*.ts**: テストを通す実装（緑）
- **docs/*.md**: 実装内容を文書化する

その他のスキーマは CLI の \`instruction\` に従う。

**ガードレール**
- 1 回の実行で 1 アーティファクトのみ作成
- 依存アーティファクトを先に読む
- 順序は崩さない
- 不明点があれば作成前に確認する
- 書き込み後にファイルが存在することを確認してから進捗更新
- スキーマ順序に従い、独自判断で名前を決めない
- **重要**: \`context\` と \`rules\` はあなた向けの制約であり、ファイル本文には含めない
  - \`<context>\` / \`<rules>\` / \`<project_context>\` ブロックは絶対にコピーしない
  - これらは内容の指針であって、出力には現れない`
  };
}

/**
 * /opsx:apply スラッシュコマンドのテンプレート
 */
export function getOpsxApplyCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Apply',
    description: 'OpenSpec 変更のタスクを実装（実験的）',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `OpenSpec 変更のタスクを実装する。

**入力**: \`/opsx:apply\` の後に変更名を指定できる（例: \`/opsx:apply add-auth\`）。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認する。

**手順**

1. **変更を選択する**

   変更名が指定されていればそれを使う。省略時は:
   - 会話の文脈で変更名が言及されていれば推測する
   - アクティブな変更が 1 件のみなら自動選択する
   - 曖昧なら \`openspec list --json\` で候補を取得し、**AskUserQuestion tool** で選ばせる

   必ず "Using change: <name>" と表示し、上書き方法（例: \`/opsx:apply <other>\`）も伝える。

2. **ステータス確認でスキーマを把握する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON から以下を把握する:
   - \`schemaName\`: 使用中のワークフロー（例: "spec-driven"）
   - タスクが含まれるアーティファクト（spec-driven では通常 "tasks"。他は status を確認）

3. **適用指示を取得する**

   \`\`\`bash
   openspec instructions apply --change "<name>" --json
   \`\`\`

   ここから得られるもの:
   - context ファイルのパス（スキーマにより変わる）
   - 進捗（total/complete/remaining）
   - タスク一覧と状態
   - 状態に応じた動的な指示

   **状態の扱い:**
   - \`state: "blocked"\`（不足アーティファクト）: メッセージを表示し、\`/opsx:continue\` を案内
   - \`state: "all_done"\`: 祝ってアーカイブを提案
   - それ以外: 実装へ進む

4. **コンテキストファイルを読む**

   apply 指示の \`contextFiles\` にあるファイルを読む。
   - **spec-driven**: proposal, specs, design, tasks
   - その他: CLI 出力の contextFiles に従う

5. **現在の進捗を示す**

   表示する内容:
   - 使用中のスキーマ
   - 進捗: "N/M タスク完了"
   - 残タスクの概要
   - CLI が返した動的な指示

6. **タスクを実装する（完了/ブロックまでループ）**

   未完了タスクごとに:
   - どのタスクに取り組むかを表示
   - 必要なコード変更を行う
   - 変更は最小限かつ焦点を絞る
   - tasks ファイルでチェックを付ける: \`- [ ]\` → \`- [x]\`
   - 次のタスクへ進む

   **停止する条件:**
   - タスクが不明確 → 確認を求める
   - 実装で設計上の問題が見つかった → アーティファクト更新を提案
   - エラー/ブロッカーに遭遇 → 報告して指示待ち
   - ユーザーが中断

7. **完了または一時停止時に状況を表示**

   表示する内容:
   - このセッションで完了したタスク
   - 全体進捗: "N/M タスク完了"
   - すべて完了ならアーカイブ提案
   - 一時停止なら理由を説明し指示を待つ

**実装中の出力例**

\`\`\`
## 実装中: <change-name>（スキーマ: <schema-name>）

タスク 3/7 に取り組み中: <task description>
[...implementation happening...]
✓ タスク完了

タスク 4/7 に取り組み中: <task description>
[...implementation happening...]
✓ タスク完了
\`\`\`

**完了時の出力例**

\`\`\`
## 実装完了

**変更:** <change-name>
**スキーマ:** <schema-name>
**進捗:** 7/7 タスク完了 ✓

### このセッションで完了
- [x] Task 1
- [x] Task 2
...

すべてのタスクが完了しました。アーカイブの準備ができています。
\`\`\`

**一時停止時の出力例（問題発生）**

\`\`\`
## 実装一時停止

**変更:** <change-name>
**スキーマ:** <schema-name>
**進捗:** 4/7 タスク完了

### 発生した問題
<description of the issue>

**選択肢:**
1. <option 1>
2. <option 2>
3. 別の案

どうしますか？
\`\`\`

**ガードレール**
- 完了またはブロックまでタスクを進める
- 開始前に必ずコンテキストファイルを読む（apply 指示の出力）
- タスクが曖昧なら実装前に確認して止まる
- 実装で問題が見つかったら止めてアーティファクト更新を提案する
- 変更は最小限かつ各タスクにスコープを合わせる
- 各タスク完了後、チェックを即時更新する
- エラー/ブロッカー/要件不明は止めて相談する
- CLI 出力の contextFiles を使い、ファイル名を決め打ちしない

**フルードワークフロー連携**

このコマンドは「変更に対するアクション」モデルを支える:

- **いつでも実行可能**: アーティファクトが揃う前でも（タスクがあれば）、部分実装の途中でも、他のアクションと交互でも
- **アーティファクト更新を許容**: 実装で設計問題が見つかったら更新を提案する。フェーズ固定でなく柔軟に動く`,
  };
}

export function getOpsxFfCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Fast Forward',
    description: '変更を作成し、実装に必要なアーティファクトを一括作成',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: `アーティファクト作成を早送りし、実装開始に必要なものをまとめて生成する。

**入力**: \`/opsx:ff\` の後の引数は change 名（kebab-case）または作りたい内容の説明。

**手順**

1. **入力が無い場合は作りたい内容を確認する**

   **AskUserQuestion tool**（自由入力）で次を聞く:
   > "どんな変更に取り組みたいですか？作りたい/直したい内容を教えてください。"

   説明から kebab-case 名を作る（例: "add user authentication" → \`add-user-auth\`）。

   **重要**: 何を作るか理解できるまでは進めない。

2. **変更ディレクトリを作成する**
   \`\`\`bash
   openspec new change "<name>"
   \`\`\`
   \`openspec/changes/<name>/\` にひな形が作成される。

3. **アーティファクトの生成順を取得する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON から把握する:
   - \`applyRequires\`: 実装前に必要なアーティファクト ID の配列（例: \`["tasks"]\`）
   - \`artifacts\`: アーティファクト一覧と状態/依存関係

4. **apply-ready になるまで順に作成する**

   **TodoWrite tool** で進捗を管理する。

   依存順にループ（依存が無いものから先に）:

   a. **各アーティファクトが \`ready\` の場合**:
      - 指示を取得:
        \`\`\`bash
        openspec instructions <artifact-id> --change "<name>" --json
        \`\`\`
      - JSON の主要フィールド:
        - \`context\`: プロジェクト背景（制約なので出力に含めない）
        - \`rules\`: アーティファクト固有ルール（制約なので出力に含めない）
        - \`template\`: 出力ファイルの構造
        - \`instruction\`: スキーマ固有のガイダンス
        - \`outputPath\`: 出力先
        - \`dependencies\`: 文脈のために読む完了済みアーティファクト
      - 依存済みファイルを読む
      - \`template\` を構造としてアーティファクトを作成
      - \`context\` と \`rules\` を制約として反映するが、ファイルにはコピーしない
      - 簡単な進捗を表示: "✓ Created <artifact-id>"

   b. **すべての \`applyRequires\` が完了するまで繰り返す**
      - 作成後に \`openspec status --change "<name>" --json\` を再実行
      - \`applyRequires\` のすべてが \`status: "done"\` になったら停止

   c. **ユーザー入力が必要な場合**（文脈不明）:
      - **AskUserQuestion tool** で確認
      - その後続行

5. **最終ステータスを表示する**
   \`\`\`bash
   openspec status --change "<name>"
   \`\`\`

**出力**

作成完了後に次をまとめる:
- 変更名と作成場所
- 作成したアーティファクト一覧（簡単な説明付き）
- "すべてのアーティファクトが作成されました。実装に進めます。"
- "実装を開始するには \`/opsx:apply\` を実行"

**アーティファクト作成ガイドライン**

- 各アーティファクト種別の指示は \`openspec instructions\` の \`instruction\` フィールドに従う
- スキーマがアーティファクトの内容を規定するので必ず従う
- 依存済みアーティファクトを先に読む
- \`template\` をベースに構造を埋める

**ガードレール**
- 実装に必要なすべてのアーティファクトを作成（スキーマの \`apply.requires\` に従う）
- 依存を先に読む
- 文脈が重大に不明な場合は確認するが、できるだけ合理的判断で進める
- 同名の変更が既にある場合は継続するか新規かを確認する
- 各アーティファクト書き込み後に存在確認して次へ進む`,
  };
}

export function getOpsxSyncCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Sync',
    description: '変更の仕様差分をメイン仕様に同期',
    category: 'Workflow',
    tags: ['workflow', 'specs', 'experimental'],
    content: `変更の差分仕様をメイン仕様に同期する。

これは **エージェント主導** の作業で、差分仕様を読み、メイン仕様を直接編集して変更を適用する。これにより、要件全文のコピーではなくシナリオ追加などの賢いマージが可能になる。

**入力**: \`/opsx:sync\` の後に change 名を指定できる（例: \`/opsx:sync add-auth\`）。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、**AskUserQuestion tool** でユーザーに選ばせる。

   差分仕様（\`specs/\` 配下）がある変更のみ表示する。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **差分仕様を探す**

   \`openspec/changes/<name>/specs/*/spec.md\` を探す。

   各差分仕様には次のセクションが含まれる:
   - \`## ADDED Requirements\` - 追加する要件
   - \`## MODIFIED Requirements\` - 既存要件の変更
   - \`## REMOVED Requirements\` - 削除する要件
   - \`## RENAMED Requirements\` - 名称変更（FROM:/TO: 形式）

   差分仕様が無ければ、ユーザーに伝えて停止する。

3. **差分仕様ごとにメイン仕様へ反映する**

   \`openspec/changes/<name>/specs/<capability>/spec.md\` がある capability ごとに:

   a. **差分仕様を読む** - 意図を把握する

   b. **メイン仕様を読む** - \`openspec/specs/<capability>/spec.md\`（未作成なら新規）

   c. **変更を賢く適用する**:

      **ADDED Requirements:**
      - メイン仕様に存在しなければ追加
      - 既に存在する場合は一致するよう更新（暗黙の MODIFIED とみなす）

      **MODIFIED Requirements:**
      - メイン仕様内の要件を探す
      - 変更を適用（例: シナリオ追加、既存シナリオ変更、要件本文の更新）
      - 差分に触れていない既存シナリオ/内容は保持する

      **REMOVED Requirements:**
      - メイン仕様から該当要件ブロックを削除

      **RENAMED Requirements:**
      - FROM の要件を探し、TO に名称変更

   d. **メイン仕様が無い場合は新規作成**:
      - \`openspec/specs/<capability>/spec.md\` を作成
      - Purpose セクションを追加（簡潔でよい。TBD でも可）
      - ADDED 要件を追加

4. **まとめを表示する**

   反映後に次を要約:
   - 更新した capability
   - 変更内容（追加/更新/削除/名称変更）

**差分仕様フォーマットの参考**

\`\`\`markdown
## ADDED Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y

## MODIFIED Requirements

### Requirement: Existing Feature
#### Scenario: New scenario to add
- **WHEN** user does A
- **THEN** system does B

## REMOVED Requirements

### Requirement: Deprecated Feature

## RENAMED Requirements

- FROM: \`### Requirement: Old Name\`
- TO: \`### Requirement: New Name\`
\`\`\`

**重要原則: 賢いマージ**

プログラム的な置換ではなく、**部分更新** を許す:
- シナリオ追加だけなら MODIFIED にそのシナリオだけを書く（既存シナリオはコピーしない）
- 差分は *意図* を表す。全面置換ではない
- 常識的に判断してマージする

**成功時の出力**

\`\`\`
## 仕様同期完了: <change-name>

メイン仕様を更新しました:

**<capability-1>**:
- 追加: "新機能"
- 更新: "既存機能"（シナリオ 1 件追加）

**<capability-2>**:
- 新しい spec ファイルを作成
- 追加: "別の機能"

メイン仕様は更新済み。変更はアクティブのままなので、実装完了後にアーカイブしてください。
\`\`\`

**ガードレール**
- 差分とメイン仕様を両方読む
- 差分に書かれていない既存内容を維持する
- 不明点があれば確認する
- 変更内容を明示する
- 冪等性を保つ`
  };
}
export function getOpsxArchiveCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Archive',
    description: '実験的ワークフローで完了した変更をアーカイブ',
    category: 'Workflow',
    tags: ['workflow', 'archive', 'experimental'],
    content: `実験的ワークフローで完了した変更をアーカイブする。

**入力**: \`/opsx:archive\` の後に change 名を指定できる（例: \`/opsx:archive add-auth\`）。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、**AskUserQuestion tool** でユーザーに選ばせる。

   アクティブな変更のみ表示する（アーカイブ済みは除外）。
   可能なら各変更の schema を併記する。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **アーティファクト完了状況を確認する**

   \`openspec status --change "<name>" --json\` を実行する。

   JSON から以下を把握する:
   - \`schemaName\`: 使用中のワークフロー
   - \`artifacts\`: アーティファクトの状態（\`done\` など）

   **未完了がある場合**:
   - 未完了アーティファクトを列挙して警告する
   - 続行可否を確認する
   - 同意があれば続行する

3. **タスク完了状況を確認する**

   tasks.md（通常）を読み、未完了タスクがあるか確認する。

   \`- [ ]\`（未完了）と \`- [x]\`（完了）を集計する。

   **未完了がある場合**:
   - 警告と件数を表示する
   - 続行可否を確認する
   - 同意があれば続行する

   **tasks が無い場合**: タスク警告は省略する。

4. **差分仕様の同期状態を評価する**

   \`openspec/changes/<name>/specs/\` に差分仕様があるか確認する。無ければ同期確認は省略する。

   **差分仕様がある場合:**
   - 各差分仕様と対応するメイン仕様（\`openspec/specs/<capability>/spec.md\`）を比較する
   - どの変更が適用されるか（追加/更新/削除/名称変更）を整理する
   - まとめを提示してから選択肢を提示する

   **プロンプトの選択肢:**
   - 変更が必要: "今すぐ同期（推奨）", "同期せずにアーカイブ"
   - 既に同期済み: "今すぐアーカイブ", "それでも同期", "キャンセル"

   同期を選んだら \`/opsx:sync\` のロジックを実行する。選択に関わらずアーカイブへ進む。

5. **アーカイブを実行する**

   アーカイブディレクトリが無ければ作成する:
   \`\`\`bash
   mkdir -p openspec/changes/archive
   \`\`\`

   現在日付で \`YYYY-MM-DD-<change-name>\` を作成する。

   **既存ターゲットの確認:**
   - 既に存在する場合: エラーで停止し、別名や日付変更を提案する
   - 存在しない場合: ディレクトリを移動する

   \`\`\`bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   \`\`\`

6. **まとめを表示する**

   次を含む完了サマリーを出す:
   - 変更名
   - 使用したスキーマ
   - アーカイブ先
   - 仕様同期の状態（同期済み / 同期スキップ / 差分仕様なし）
   - 未完了アーティファクト/タスクに関する警告の有無

**成功時の出力**

\`\`\`
## アーカイブ完了

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ メイン仕様へ同期済み

すべてのアーティファクトが完了。すべてのタスクが完了。
\`\`\`

**成功時の出力（差分仕様なし）**

\`\`\`
## アーカイブ完了

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** 差分仕様なし

すべてのアーティファクトが完了。すべてのタスクが完了。
\`\`\`

**成功時の出力（警告あり）**

\`\`\`
## アーカイブ完了（警告あり）

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** 同期スキップ（ユーザー選択）

**Warnings:**
- 未完了のアーティファクトが 2 件
- 未完了タスクが 3 件
- 仕様同期をスキップ（ユーザー選択）

意図していない場合はアーカイブ内容を確認してください。
\`\`\`

**エラー時の出力（アーカイブ先が既存）**

\`\`\`
## アーカイブ失敗

**Change:** <change-name>
**Target:** openspec/changes/archive/YYYY-MM-DD-<name>/

ターゲットのアーカイブディレクトリが既に存在します。

**Options:**
1. 既存アーカイブをリネームする
2. 既存アーカイブを削除する（重複の場合）
3. 別の日付でアーカイブする
\`\`\`

**ガードレール**
- change 名が無ければ必ず選択させる
- 完了判定にはアーティファクトグラフ（openspec status --json）を使う
- 警告があってもアーカイブを止めず、説明と確認に留める
- \.openspec.yaml はディレクトリ移動で保持する
- 何をしたかが分かる明確なサマリーを出す
- 同期が求められたら /opsx:sync の手順で進める
- 差分仕様がある場合は必ず同期評価を行い、まとめを提示してから選択させる`
  };
}
export function getOpsxOnboardCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Onboard',
    description: 'ガイド付きオンボーディング（説明しながら OpenSpec ワークフローを一周）',
    category: 'Workflow',
    tags: ['workflow', 'onboarding', 'tutorial', 'learning'],
    content: getOnboardInstructions(),
  };
}

export function getOpsxBulkArchiveCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Bulk Archive',
    description: '複数の完了済み変更をまとめてアーカイブ',
    category: 'Workflow',
    tags: ['workflow', 'archive', 'experimental', 'bulk'],
    content: `複数の完了済み変更を1回の操作でアーカイブします。

このスキルは、コードベースを確認して実装状況を判断し、仕様の競合を賢く解決しながら変更をまとめてアーカイブします。

**入力**: 必須なし（選択を促す）

**手順**

1. **アクティブな変更を取得**

   \`openspec list --json\` を実行してアクティブな変更を取得する。

   アクティブな変更が無ければ、ユーザーに伝えて終了。

2. **変更の選択を促す**

   **AskUserQuestion tool** の複数選択でユーザーに変更を選ばせる:
   - 各変更にスキーマを併記
   - "すべての変更" の選択肢も用意
   - 選択数は任意（1つでもよいが、典型は2件以上）

   **重要**: 自動選択しない。必ずユーザーに選ばせる。

3. **一括検証 - 選択した変更のステータスを収集**

   各変更について次を収集:

   a. **アーティファクト状態** - \`openspec status --change "<name>" --json\`
      - \`schemaName\` と \`artifacts\` を解析
      - \`done\` とそれ以外を判別

   b. **タスク完了** - \`openspec/changes/<name>/tasks.md\` を読む
      - \`- [ ]\`（未完了）と \`- [x]\`（完了）を集計
      - tasks が無い場合は "No tasks" と記録

   c. **差分仕様** - \`openspec/changes/<name>/specs/\` を確認
      - どの機能の spec があるかを一覧化
      - 各 spec から要件名を抽出（\`### Requirement: <name>\` に一致する行）

4. **仕様競合の検出**

   \`capability -> [changes that touch it]\` の対応表を作る:

   \`\`\`
   auth -> [change-a, change-b]  <- CONFLICT (2+ changes)
   api  -> [change-c]            <- OK (only 1 change)
   \`\`\`

   同じ機能に対して 2 件以上の変更が差分仕様を持つ場合は競合。

5. **競合をエージェント的に解決**

   **各競合**について、コードベースを調査:

   a. **差分仕様を読む** - 各変更が何を追加/変更したいのか把握

   b. **コードベースを検索**:
      - 各差分仕様の要件が実装されているか確認
      - 関連ファイル、関数、テストを探す

   c. **解決方針の判断**:
      - 実装されている変更が1つだけ -> その変更の仕様を同期
      - 両方実装 -> 作成日の古い順に適用（後の変更が上書き）
      - どちらも未実装 -> 仕様同期をスキップし、警告

   d. **解決結果を記録**:
      - どの変更の仕様を適用するか
      - どの順序で適用するか（両方の場合）
      - 根拠（コードベースで見つけた内容）

6. **統合ステータス表を表示**

   変更の要約テーブルを表示:

   \`\`\`
   | Change               | Artifacts | Tasks | Specs   | Conflicts | Status |
   |---------------------|-----------|-------|---------|-----------|--------|
   | schema-management   | Done      | 5/5   | 2 delta | None      | Ready  |
   | project-config      | Done      | 3/3   | 1 delta | None      | Ready  |
   | add-oauth           | Done      | 4/4   | 1 delta | auth (!)  | Ready* |
   | add-verify-skill    | 1 left    | 2/5   | None    | None      | Warn   |
   \`\`\`

   競合がある場合は解決結果も表示:
   \`\`\`
   * Conflict resolution:
     - auth spec: Will apply add-oauth then add-jwt (both implemented, chronological order)
   \`\`\`

   未完了がある場合は警告を表示:
   \`\`\`
   Warnings:
   - add-verify-skill: 1 incomplete artifact, 3 incomplete tasks
   \`\`\`

7. **一括操作の確認**

   **AskUserQuestion tool** で1回だけ確認:

   - "N 件の変更をアーカイブしますか？" をステータスに応じて提示
   - 選択肢の例:
     - "N 件すべてをアーカイブ"
     - "準備完了の N 件のみアーカイブ（未完了は除外）"
     - "キャンセル"

   未完了がある場合は、警告付きでアーカイブされることを明記。

8. **確定した変更を順にアーカイブ**

   競合解決で決まった順序に従って処理:

   a. **仕様を同期**（差分仕様がある場合）:
      - openspec-sync-specs の手順を使用（エージェントによるインテリジェントマージ）
      - 競合は決定済みの順序で適用
      - 同期したかどうかを記録

   b. **変更をアーカイブ**:
      - 日付付きの名前で archive に移動
      - \.openspec.yaml を保持

   c. **結果を記録**:
      - 成功 / スキップ / 失敗
      - スキップ: ユーザーがアーカイブしない選択をした場合

9. **サマリーを表示**

   最終結果を表示:

   \`\`\`
   ## Bulk Archive Complete

   Archived 3 changes:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   Skipped 1 change:
   - add-verify-skill (user chose not to archive incomplete)

   Spec sync summary:
   - 4 delta specs synced to main specs
   - 1 conflict resolved (auth: applied both in chronological order)
   \`\`\`

   失敗がある場合:
   \`\`\`
   Failed 1 change:
   - some-change: Archive directory already exists
   \`\`\`

**競合解決の例**

例1: 片方のみ実装
\`\`\`
Conflict: specs/auth/spec.md touched by [add-oauth, add-jwt]

Checking add-oauth:
- Delta adds "OAuth Provider Integration" requirement
- Searching codebase... found src/auth/oauth.ts implementing OAuth flow

Checking add-jwt:
- Delta adds "JWT Token Handling" requirement
- Searching codebase... no JWT implementation found

Resolution: Only add-oauth is implemented. Will sync add-oauth specs only.
\`\`\`

例2: 両方実装
\`\`\`
Conflict: specs/api/spec.md touched by [add-rest-api, add-graphql]

Checking add-rest-api (created 2026-01-10):
- Delta adds "REST Endpoints" requirement
- Searching codebase... found src/api/rest.ts

Checking add-graphql (created 2026-01-15):
- Delta adds "GraphQL Schema" requirement
- Searching codebase... found src/api/graphql.ts

Resolution: Both implemented. Will apply add-rest-api specs first,
then add-graphql specs (chronological order, newer takes precedence).
\`\`\`

**成功時の出力**

\`\`\`
## Bulk Archive Complete

Archived N changes:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/
- <change-2> -> archive/YYYY-MM-DD-<change-2>/

Spec sync summary:
- N delta specs synced to main specs
- No conflicts (or: M conflicts resolved)
\`\`\`

**一部成功時の出力**

\`\`\`
## Bulk Archive Complete (partial)

Archived N changes:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/

Skipped M changes:
- <change-2> (user chose not to archive incomplete)

Failed K changes:
- <change-3>: Archive directory already exists
\`\`\`

**変更がない場合の出力**

\`\`\`
## No Changes to Archive

No active changes found. Use \`/opsx:new\` to create a new change.
\`\`\`

**ガードレール**
- 変更数は任意（1件でもよいが、典型は2件以上）
- 選択は必ずユーザーに促し、自動選択しない
- 仕様の競合は早期に検出し、コードベース確認で解決する
- 両方実装されている場合は作成日順で仕様を適用する
- 未実装の場合のみ仕様同期をスキップし、警告する
- 確認前に変更ごとのステータスを明確に示す
- バッチ全体は1回の確認で進める
- 結果をすべて報告する（成功/スキップ/失敗）
- アーカイブ移動時に .openspec.yaml を保持する
- アーカイブ先は現在日付: YYYY-MM-DD-<name>
- 既存のアーカイブがある場合はその変更を失敗扱いにし、他は続行する`
  };
}
export function getOpsxVerifyCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Verify',
    description: 'アーカイブ前に実装とアーティファクトの整合を検証',
    category: 'Workflow',
    tags: ['workflow', 'verify', 'experimental'],
    content: `実装が変更アーティファクト（specs, tasks, design）に一致しているか検証します。

**入力**: \`/opsx:verify\` の後に change 名を指定できる（例: \`/opsx:verify add-auth\`）。省略時は会話の文脈から推測できるか確認し、曖昧なら利用可能な変更を必ず確認させる。

**手順**

1. **change 名が無い場合は選択させる**

   \`openspec list --json\` を実行し、**AskUserQuestion tool** でユーザーに選択させる。

   tasks が存在する変更のみ表示する。
   可能なら各変更の schema を併記する。
   未完了タスクがあるものは "(進行中)" を付ける。

   **重要**: 推測や自動選択はしない。必ずユーザーに選ばせる。

2. **ステータス確認でスキーマを把握する**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   JSON をパースして以下を把握する:
   - \`schemaName\`: 使用中のワークフロー（例: "spec-driven", "tdd"）
   - この変更で存在するアーティファクト

3. **変更ディレクトリとアーティファクトを取得する**

   \`\`\`bash
   openspec instructions apply --change "<name>" --json
   \`\`\`

   変更ディレクトリと contextFiles が返る。利用可能なアーティファクトをすべて読む。

4. **検証レポートの構造を初期化する**

   3 つの観点で構成する:
   - **完了性**: タスクと仕様のカバレッジ
   - **正確性**: 要件実装とシナリオの網羅性
   - **整合性**: 設計遵守とパターン整合

   各観点は CRITICAL / WARNING / SUGGESTION に分類する。

5. **完了性の検証**

   **タスク完了**:
   - contextFiles に tasks.md があれば読む
   - \`- [ ]\`（未完了）と \`- [x]\`（完了）を集計
   - 完了数/総数を出す
   - 未完了がある場合:
     - 各タスクを CRITICAL として追加
     - 推奨: "タスクを完了: <description>" または "実装済みなら完了に変更"

   **仕様カバレッジ**:
   - \`openspec/changes/<name>/specs/\` に差分がある場合:
     - "### Requirement:" を抽出
     - 各要件について:
       - コードベース内の関連キーワードを検索
       - 実装がありそうか評価
     - 未実装らしい場合:
       - CRITICAL: "要件が見つからない: <requirement name>"
       - 推奨: "要件 X を実装: <description>"

6. **正確性の検証**

   **要件の実装マッピング**:
   - 各要件について:
     - 実装の根拠を検索
     - 見つかればファイルパスと行番号を記録
     - 要件意図に合致するか判断
     - 逸脱が疑われる場合:
       - WARNING: "仕様と差異の可能性: <details>"
       - 推奨: "要件 X と <file>:<lines> を突き合わせる"

   **シナリオの網羅**:
   - "#### Scenario:" を抽出
   - 条件がコードで処理されているか、テストがあるかを確認
   - 未対応が疑われる場合:
     - WARNING: "未カバーのシナリオ: <scenario name>"
     - 推奨: "シナリオに対応する実装/テストを追加: <description>"

7. **整合性の検証**

   **設計遵守**:
   - design.md があれば:
     - "Decision:", "Approach:", "Architecture:" などから決定事項を抽出
     - 実装が従っているか確認
     - 反している場合:
       - WARNING: "設計の決定が守られていない: <decision>"
       - 推奨: "実装を直すか design.md を実態に合わせて更新"
   - design.md が無い場合はスキップし、"照合対象の design.md がない" と記録

   **コードパターン整合**:
   - 新規コードがプロジェクトのパターンと一致しているか確認
   - ファイル命名、ディレクトリ構成、コーディングスタイルを確認
   - 目立つ逸脱があれば:
     - SUGGESTION: "パターン逸脱: <details>"
     - 推奨: "既存パターンに合わせる: <example>"

8. **検証レポートを生成する**

   **サマリー評価表**:
   \`\`\`
   ## 検証レポート: <change-name>

   ### サマリー
   | 観点 | 状態 |
   |--------------|------------------|
   | 完了性 | X/Y タスク、N 要件 |
   | 正確性 | M/N 要件をカバー |
   | 整合性 | 遵守/問題あり |
   \`\`\`

   **優先度別の課題**:

   1. **CRITICAL**（アーカイブ前に必須）:
      - 未完了タスク
      - 未実装の要件
      - 具体的かつ実行可能な推奨を添える

   2. **WARNING**（修正推奨）:
      - 仕様/設計の乖離
      - シナリオ未カバー
      - 具体的な推奨を添える

   3. **SUGGESTION**（改善提案）:
      - パターン不一致
      - 軽微な改善
      - 具体的な推奨を添える

   **最終評価**:
   - CRITICAL がある: "重大な問題が X 件あります。アーカイブ前に修正してください。"
   - WARNING のみ: "重大な問題はありません。WARNING が Y 件あります。検討のうえアーカイブ可能です。"
   - 全てクリア: "すべてのチェックに合格しました。アーカイブ可能です。"

**検証の指針**

- **完了性**: チェックリスト（チェックボックス、要件一覧）など客観的項目に集中
- **正確性**: キーワード検索やファイルパスなど合理的推定でよい（完全な確証は求めない）
- **整合性**: 明確な不整合のみ指摘し、細かなスタイルに執着しない
- **誤検出**: 迷う場合は SUGGESTION > WARNING > CRITICAL の順で控えめに
- **実行可能性**: すべての指摘に具体的な推奨を付ける（可能ならファイル/行を添える）

**段階的な対応**

- tasks.md のみ: タスク完了のみ検証し、spec/design はスキップ
- tasks + specs: 完了性と正確性のみ検証し、design はスキップ
- フルアーティファクト: 3 観点すべて検証
- 省略したチェックは理由とともに必ず記載する

**出力形式**

Markdown で明確に書く:
- サマリーのテーブル
- CRITICAL/WARNING/SUGGESTION のグルーピング
- \`file.ts:123\` 形式の参照
- 具体的で実行可能な推奨
- "再確認することを検討" のような曖昧表現は避ける`
  };
}
/**
 * Template for feedback skill
 * For collecting and submitting user feedback with context enrichment
 */
export function getFeedbackSkillTemplate(): SkillTemplate {
  return {
    name: 'feedback',
    description: 'OpenSpec へのフィードバックを文脈補強と匿名化付きで収集・送信する。',
    instructions: `OpenSpec へのフィードバック送信を支援してください。

**目標**: 匿名化でプライバシーを守りながら、フィードバックの収集・補強・送信を案内する。

**手順**

1. **会話から文脈を収集**
   - 直近の会話を確認して文脈を把握する
   - どんな作業をしていたかを特定する
   - 良かった点・悪かった点を整理する
   - 具体的な詰まりや称賛を拾う

2. **補強したフィードバック案を作成**
   - 明確で説明的なタイトルを作る（1文、"Feedback:" などの接頭辞は不要）
   - 本文に含める内容:
     - ユーザーがやろうとしていたこと
     - 起きたこと（良い/悪い）
     - 会話からの関連文脈
     - 具体的な提案や要望

3. **機微情報を匿名化**
   - ファイルパスは \`<path>\` などの一般表記に置き換える
   - API キー/トークン/シークレットは \`<redacted>\` に置き換える
   - 会社/組織名は \`<company>\` に置き換える
   - 個人名は \`<user>\` に置き換える
   - 特定 URL は公開/関連が明確な場合を除き \`<url>\` に置き換える
   - 問題理解に必要な技術情報は残す

4. **ドラフトを提示して承認を得る**
   - まとめたドラフトを全文提示する
   - タイトルと本文を明確に見せる
   - 送信前に明確な承認を求める
   - 修正依頼に対応する

5. **承認後に送信**
   - \`openspec feedback\` コマンドを使って送信する
   - 形式: \`openspec feedback "title" --body "body content"\`
   - コマンドがメタデータ（バージョン/プラットフォーム/タイムスタンプ）を自動付与する

**ドラフト例**

\`\`\`
Title: Error handling in artifact workflow needs improvement

Body:
I was working on creating a new change and encountered an issue with
the artifact workflow. When I tried to continue after creating the
proposal, the system didn't clearly indicate that I needed to complete
the specs first.

Suggestion: Add clearer error messages that explain dependency chains
in the artifact workflow. Something like "Cannot create design.md
because specs are not complete (0/2 done)."

Context: Using the spec-driven schema with <path>/my-project
\`\`\`

**匿名化の例**

Before:
\`\`\`
Working on /Users/john/mycompany/auth-service/src/oauth.ts
Failed with API key: sk_live_abc123xyz
Working at Acme Corp
\`\`\`

After:
\`\`\`
Working on <path>/oauth.ts
Failed with API key: <redacted>
Working at <company>
\`\`\`

**ガードレール**

- 送信前に必ずドラフト全文を提示する
- 明確な承認を必ず求める
- 機微情報は必ず匿名化する
- ユーザーの修正依頼に対応する
- 承認なしに送信しない
- 関連する技術的文脈を含める
- 会話固有の洞察を残す

**ユーザー確認が必須**

常に次を確認:
\`\`\`
以下のフィードバック案を作成しました:

Title: [title]

Body:
[body]

この内容で問題ないですか？必要なら修正しますし、このまま送信もできます。
\`\`\`

ユーザーの確認後にのみ送信を進める。`
  };
}
