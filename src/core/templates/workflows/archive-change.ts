/**
 * Archive Change ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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

   status が \`actionContext.mode: "workspace-planning"\` を報告した場合、このスライスでは workspace archive が未対応であると説明して停止する。workspace changes を repo-local archive へ移動したり、リンク済み repo を編集したりしない。

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

**変更:** <change-name>
**スキーマ:** <schema-name>
**アーカイブ先:** openspec/changes/archive/YYYY-MM-DD-<name>/
**仕様:** ✓ メイン仕様へ同期済み（または "差分仕様なし" / "同期スキップ"）

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

   status が \`actionContext.mode: "workspace-planning"\` を報告した場合、このスライスでは workspace archive が未対応であると説明して停止する。workspace changes を repo-local archive へ移動したり、リンク済み repo を編集したりしない。

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

**変更:** <change-name>
**スキーマ:** <schema-name>
**アーカイブ先:** openspec/changes/archive/YYYY-MM-DD-<name>/
**仕様:** ✓ メイン仕様へ同期済み

すべてのアーティファクトが完了。すべてのタスクが完了。
\`\`\`

**成功時の出力（差分仕様なし）**

\`\`\`
## アーカイブ完了

**変更:** <change-name>
**スキーマ:** <schema-name>
**アーカイブ先:** openspec/changes/archive/YYYY-MM-DD-<name>/
**仕様:** 差分仕様なし

すべてのアーティファクトが完了。すべてのタスクが完了。
\`\`\`

**成功時の出力（警告あり）**

\`\`\`
## アーカイブ完了（警告あり）

**変更:** <change-name>
**スキーマ:** <schema-name>
**アーカイブ先:** openspec/changes/archive/YYYY-MM-DD-<name>/
**仕様:** 同期スキップ（ユーザー選択）

**警告:**
- 未完了のアーティファクトが 2 件
- 未完了タスクが 3 件
- 仕様同期をスキップ（ユーザー選択）

意図していない場合はアーカイブ内容を確認してください。
\`\`\`

**エラー時の出力（アーカイブ先が既存）**

\`\`\`
## アーカイブ失敗

**変更:** <change-name>
**対象:** openspec/changes/archive/YYYY-MM-DD-<name>/

ターゲットのアーカイブディレクトリが既に存在します。

**選択肢:**
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
