/**
 * Apply Change ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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
   - \`contextFiles\`: アーティファクト ID から具体的なファイルパス配列への対応（スキーマにより proposal/specs/design/tasks や spec/tests/implementation/docs など）
   - 進捗（total/complete/remaining）
   - タスク一覧と状態
   - 状態に応じた動的な指示

   **状態の扱い:**
   - \`state: "blocked"\`（不足アーティファクト）: メッセージを表示し、openspec-continue-change を勧める
   - \`state: "all_done"\`: 祝ってアーカイブを提案
   - それ以外: 実装へ進む

   **Workspace guard:** status JSON が \`actionContext.mode: "workspace-planning"\` かつ \`allowedEditRoots\` が空であることを示す場合、このスライスでは full workspace apply が未対応であると説明する。リンク済み repo / folder は読み取り専用コンテキストとして扱い、明示的な実装ワークフローで影響領域を選択するようユーザーに依頼し、ファイル編集前に停止する。

4. **コンテキストファイルを読む**

   apply 指示の \`contextFiles\` に列挙されたすべてのファイルパスを読む。
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
- **アーティファクト更新を許容**: 実装で設計問題が見つかったら更新を提案する。フェーズ固定でなく柔軟に動く`
  };
}

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
   - \`contextFiles\`: アーティファクト ID から具体的なファイルパス配列への対応（スキーマにより変わる）
   - 進捗（total/complete/remaining）
   - タスク一覧と状態
   - 状態に応じた動的な指示

   **状態の扱い:**
   - \`state: "blocked"\`（不足アーティファクト）: メッセージを表示し、\`/opsx:continue\` を案内
   - \`state: "all_done"\`: 祝ってアーカイブを提案
   - それ以外: 実装へ進む

   **Workspace guard:** status JSON が \`actionContext.mode: "workspace-planning"\` かつ \`allowedEditRoots\` が空であることを示す場合、このスライスでは full workspace apply が未対応であると説明する。リンク済み repo / folder は読み取り専用コンテキストとして扱い、明示的な実装ワークフローで影響領域を選択するようユーザーに依頼し、ファイル編集前に停止する。

4. **コンテキストファイルを読む**

   apply 指示の \`contextFiles\` に列挙されたすべてのファイルパスを読む。
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

すべてのタスクが完了しました。\`/opsx:archive\` でアーカイブできます。
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
- **アーティファクト更新を許容**: 実装で設計問題が見つかったら更新を提案する。フェーズ固定でなく柔軟に動く`
  };
}
