/**
 * Bulk Archive Change ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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
   | Change              | Artifacts | Tasks | Specs   | Conflicts | Status |
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
   ## 一括アーカイブ完了

   3 件の変更をアーカイブしました:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   1 件の変更をスキップしました:
   - add-verify-skill（未完了のためユーザーがアーカイブしないことを選択）

   仕様同期サマリー:
   - 4 件の差分仕様をメイン仕様へ同期
   - 1 件の競合を解決（auth: 両方を時系列順に適用）
   \`\`\`

   失敗がある場合:
   \`\`\`
   1 件の変更に失敗しました:
   - some-change: アーカイブディレクトリが既に存在します
   \`\`\`

**競合解決の例**

例1: 片方のみ実装
\`\`\`
競合: specs/auth/spec.md が [add-oauth, add-jwt] で変更されています

add-oauth を確認:
- 差分は "OAuth Provider Integration" 要件を追加
- コードベースを検索... OAuth フローを実装する src/auth/oauth.ts を検出

add-jwt を確認:
- 差分は "JWT Token Handling" 要件を追加
- コードベースを検索... JWT 実装は見つからず

解決: add-oauth のみ実装済みです。add-oauth の仕様だけを同期します。
\`\`\`

例2: 両方実装
\`\`\`
競合: specs/api/spec.md が [add-rest-api, add-graphql] で変更されています

add-rest-api を確認（2026-01-10 作成）:
- 差分は "REST Endpoints" 要件を追加
- コードベースを検索... src/api/rest.ts を検出

add-graphql を確認（2026-01-15 作成）:
- 差分は "GraphQL Schema" 要件を追加
- コードベースを検索... src/api/graphql.ts を検出

解決: 両方とも実装済みです。add-rest-api の仕様を先に適用し、
次に add-graphql の仕様を適用します（時系列順。新しいものを優先）。
\`\`\`

**成功時の出力**

\`\`\`
## 一括アーカイブ完了

N 件の変更をアーカイブしました:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/
- <change-2> -> archive/YYYY-MM-DD-<change-2>/

仕様同期サマリー:
- N 件の差分仕様をメイン仕様へ同期
- 競合なし（または: M 件の競合を解決）
\`\`\`

**一部成功時の出力**

\`\`\`
## 一括アーカイブ一部完了

N 件の変更をアーカイブしました:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/

M 件の変更をスキップしました:
- <change-2>（未完了のためユーザーがアーカイブしないことを選択）

K 件の変更に失敗しました:
- <change-3>: アーカイブディレクトリが既に存在します
\`\`\`

**変更がない場合の出力**

\`\`\`
## アーカイブ対象の変更なし

進行中の変更はありません。\`/opsx:new\` で新しい変更を作成してください。
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
   | Change              | Artifacts | Tasks | Specs   | Conflicts | Status |
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
   ## 一括アーカイブ完了

   3 件の変更をアーカイブしました:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   1 件の変更をスキップしました:
   - add-verify-skill（未完了のためユーザーがアーカイブしないことを選択）

   仕様同期サマリー:
   - 4 件の差分仕様をメイン仕様へ同期
   - 1 件の競合を解決（auth: 両方を時系列順に適用）
   \`\`\`

   失敗がある場合:
   \`\`\`
   1 件の変更に失敗しました:
   - some-change: アーカイブディレクトリが既に存在します
   \`\`\`

**競合解決の例**

例1: 片方のみ実装
\`\`\`
競合: specs/auth/spec.md が [add-oauth, add-jwt] で変更されています

add-oauth を確認:
- 差分は "OAuth Provider Integration" 要件を追加
- コードベースを検索... OAuth フローを実装する src/auth/oauth.ts を検出

add-jwt を確認:
- 差分は "JWT Token Handling" 要件を追加
- コードベースを検索... JWT 実装は見つからず

解決: add-oauth のみ実装済みです。add-oauth の仕様だけを同期します。
\`\`\`

例2: 両方実装
\`\`\`
競合: specs/api/spec.md が [add-rest-api, add-graphql] で変更されています

add-rest-api を確認（2026-01-10 作成）:
- 差分は "REST Endpoints" 要件を追加
- コードベースを検索... src/api/rest.ts を検出

add-graphql を確認（2026-01-15 作成）:
- 差分は "GraphQL Schema" 要件を追加
- コードベースを検索... src/api/graphql.ts を検出

解決: 両方とも実装済みです。add-rest-api の仕様を先に適用し、
次に add-graphql の仕様を適用します（時系列順。新しいものを優先）。
\`\`\`

**成功時の出力**

\`\`\`
## 一括アーカイブ完了

N 件の変更をアーカイブしました:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/
- <change-2> -> archive/YYYY-MM-DD-<change-2>/

仕様同期サマリー:
- N 件の差分仕様をメイン仕様へ同期
- 競合なし（または: M 件の競合を解決）
\`\`\`

**一部成功時の出力**

\`\`\`
## 一括アーカイブ一部完了

N 件の変更をアーカイブしました:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/

M 件の変更をスキップしました:
- <change-2>（未完了のためユーザーがアーカイブしないことを選択）

K 件の変更に失敗しました:
- <change-3>: アーカイブディレクトリが既に存在します
\`\`\`

**変更がない場合の出力**

\`\`\`
## アーカイブ対象の変更なし

進行中の変更はありません。\`/opsx:new\` で新しい変更を作成してください。
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
