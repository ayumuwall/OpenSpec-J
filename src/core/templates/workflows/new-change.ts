/**
 * New Change ワークフローテンプレート
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

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
