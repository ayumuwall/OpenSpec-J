/**
 * Continue Change ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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
   - 「すべてのアーティファクトが作成されました。\`/opsx:apply\` で実装を進めるか、\`/opsx:archive\` でアーカイブできます。」と案内
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
