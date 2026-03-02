/**
 * Feedback ワークフローテンプレート
 */
import type { SkillTemplate } from '../types.js';

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
