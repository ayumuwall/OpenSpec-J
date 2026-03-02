/**
 * Sync Specs ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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

**規範語ルール**

- 規範要件は SHALL/MUST を使う（SHOULD/MAY は避ける）
- 語尾は「〜しなければならない。(SHALL)」の形式に揃える
- 文中に SHALL/MUST を挿入しない

**差分仕様フォーマットの参考**

\`\`\`markdown
## ADDED Requirements

### Requirement: 新機能
システムは新しい機能を提供しなければならない。(SHALL)

#### Scenario: 基本ケース
- **WHEN** ユーザーが X を実行する
- **THEN** システムは Y を返す

## MODIFIED Requirements

### Requirement: 既存機能
#### Scenario: 追加シナリオ
- **WHEN** ユーザーが A を実行する
- **THEN** システムは B を返す

## REMOVED Requirements

### Requirement: 廃止機能

## RENAMED Requirements

- FROM: \`### Requirement: 旧名称\`
- TO: \`### Requirement: 新名称\`
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

**規範語ルール**

- 規範要件は SHALL/MUST を使う（SHOULD/MAY は避ける）
- 語尾は「〜しなければならない。(SHALL)」の形式に揃える
- 文中に SHALL/MUST を挿入しない

**差分仕様フォーマットの参考**

\`\`\`markdown
## ADDED Requirements

### Requirement: 新機能
システムは新しい機能を提供しなければならない。(SHALL)

#### Scenario: 基本ケース
- **WHEN** ユーザーが X を実行する
- **THEN** システムは Y を返す

## MODIFIED Requirements

### Requirement: 既存機能
#### Scenario: 追加シナリオ
- **WHEN** ユーザーが A を実行する
- **THEN** システムは B を返す

## REMOVED Requirements

### Requirement: 廃止機能

## RENAMED Requirements

- FROM: \`### Requirement: 旧名称\`
- TO: \`### Requirement: 新名称\`
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
