/**
 * Onboard ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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
## 完了です

OpenSpec の一連の流れを 1 周しました。

1. **Explore** - 問題を整理した
2. **New** - 変更コンテナを作成した
3. **Proposal** - WHY を整理した
4. **Specs** - WHAT を具体化した
5. **Design** - HOW を決めた
6. **Tasks** - 実装手順に分解した
7. **Apply** - 実装を進めた
8. **Archive** - 記録として保存した

このリズムは、小さな修正でも大きな機能追加でも同じように使えます。

---

## コマンド一覧

**Core workflow:**

| Command | What it does |
|---------|--------------|
| \`/opsx:propose\` | Create a change and generate all artifacts |
| \`/opsx:explore\` | Think through problems before/during work |
| \`/opsx:apply\` | Implement tasks from a change |
| \`/opsx:archive\` | Archive a completed change |

**Additional commands:**

| Command | What it does |
|---------|--------------|
| \`/opsx:new\` | Start a new change, step through artifacts one at a time |
| \`/opsx:continue\` | Continue working on an existing change |
| \`/opsx:ff\` | Fast-forward: create all artifacts at once |
| \`/opsx:verify\` | Verify implementation matches artifacts |

---

## 次の一歩

次は、実際に作りたいものに対して \`/opsx:propose\` を試してください。expanded workflow を使っているなら \`/opsx:new\` や \`/opsx:ff\` でも始められます。
\`\`\`

---

## Graceful Exit Handling

### User wants to stop mid-way

If the user says they need to stop, want to pause, or seem disengaged:

\`\`\`
問題ありません。変更は \`openspec/changes/<name>/\` に保存されています。

あとで再開するには:
- \`/opsx:continue <name>\` - アーティファクト作成を再開
- \`/opsx:apply <name>\` - 実装へ進む（tasks があれば）

作業は失われません。準備ができたら戻ってきてください。
\`\`\`

Exit gracefully without pressure.

### User just wants command reference

If the user says they just want to see the commands or skip the tutorial:

\`\`\`
## OpenSpec クイックリファレンス

**Core workflow:**

| Command | What it does |
|---------|--------------|
| \`/opsx:propose <name>\` | Create a change and generate all artifacts |
| \`/opsx:explore\` | Think through problems (no code changes) |
| \`/opsx:apply <name>\` | Implement tasks |
| \`/opsx:archive <name>\` | Archive when done |

**Additional commands:**

| Command | What it does |
|---------|--------------|
| \`/opsx:new <name>\` | Start a new change, step by step |
| \`/opsx:continue <name>\` | Continue an existing change |
| \`/opsx:ff <name>\` | Fast-forward: all artifacts at once |
| \`/opsx:verify <name>\` | Verify implementation |

まずは \`/opsx:propose\` を試してください。expanded workflow を使っているなら \`/opsx:new\` や \`/opsx:ff\` でも始められます。
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

export function getOpsxOnboardCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Onboard',
    description: 'ガイド付きオンボーディング（説明しながら OpenSpec ワークフローを一周）',
    category: 'Workflow',
    tags: ['workflow', 'onboarding', 'tutorial', 'learning'],
    content: getOnboardInstructions(),
  };
}
