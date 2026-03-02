/**
 * Fast Forward Change ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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
- 次へ進む前に、作成したファイルの存在を必ず確認する`
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
- 各アーティファクト書き込み後に存在確認して次へ進む`
  };
}
