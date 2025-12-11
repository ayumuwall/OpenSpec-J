export type SlashCommandId = 'proposal' | 'apply' | 'archive';

const baseGuardrails = [
  "**Guardrails**",
  "- まずはシンプルで最小限の実装を優先し、明確な依頼や根拠がある場合のみ複雑化してください。",
  "- 変更のスコープを依頼された成果にきっちり合わせ、不要に広げないでください。",
  "- 生成する `proposal.md` / `tasks.md` / `design.md` / 仕様差分は日本語で記述し、見出しやキーワード（Requirement/Scenario, WHEN/THEN, MUST/SHALL）は英語のまま維持してください。",
  "- 追加の OpenSpec 慣習が必要になったら `openspec/AGENTS.md`（`openspec/` ディレクトリ内。見つからなければ `ls openspec` や `openspec update`）を参照してください。"
].join("\n");

const proposalGuardrails = [
  baseGuardrails,
  "- あいまいな要件や不明点があれば、ファイルを編集する前に必ず確認質問をしてください。",
  "- 提案段階ではコードを書かず、`proposal.md`, `tasks.md`, `design.md`, 仕様差分など設計ドキュメントの作成に集中します。実装は承認後の apply ステージで行います。"
].join("\n");

const proposalSteps = [
  "**Steps**",
  "1. `openspec/project.md` を確認し、`openspec list` と `openspec list --specs` を実行して現在の文脈を把握し、必要に応じて `rg` や `ls` で関連コード/ドキュメントを調査する。",
  "2. 動詞始まりで一意な `change-id` を決め、`openspec/changes/<id>/` に `proposal.md`, `tasks.md`, 必要なら `design.md` のひな形を作成する。",
  "3. 変更内容を具体的な機能や要件に割り付け、複数スコープが混ざる場合は関連性や順序が分かるように仕様差分を分割する。",
  "4. 解決策が複数のシステムにまたがる、新しいパターンを導入する、または実装前にトレードオフ整理が必要な場合は `design.md` に判断理由を記録する。",
  "5. `changes/<id>/specs/<capability>/spec.md`（機能ごとに 1 フォルダー）に `## ADDED|MODIFIED|REMOVED Requirements` を使って仕様差分を書き、各要件に最低 1 つの `#### Scenario:` を含め、関連機能を必要に応じて参照する。",
  "6. `tasks.md` には小さく検証可能な作業を順序付きで列挙し、ユーザー価値が見える単位に分割したうえでテストやツールによる検証も含める。",
  "7. `openspec validate <id> --strict` を実行し、すべての指摘を解消してから提案を共有する。"
].join("\n");

const proposalReferences = [
  "**Reference**",
  "- 検証でエラーが出た場合は `openspec show <id> --json --deltas-only` や `openspec show <spec> --type spec` で詳細を確認する。",
  "- 新しい要件を書く前に `rg -n \"Requirement:|Scenario:\" openspec/specs` で既存の仕様を検索する。",
  "- 実装状況と乖離しないよう、`rg <keyword>` や `ls`、直接ファイルを読むなどして現在のコード状態を把握する。"
].join("\n");

const applySteps = [
  "**Steps**",
  "次の手順を TODO として順番に完了してください。",
  "1. `changes/<id>/proposal.md`、（あれば）`design.md`、`tasks.md` を読み、スコープと受け入れ条件を確認する。",
  "2. タスクを順番に実行し、変更は依頼された内容に集中させる。",
  "3. ステータスを更新する前に、`tasks.md` の項目がすべて完了していることを確認する。",
  "4. すべて完了したらチェックリストを `- [x]` に更新して実態と一致させる。",
  "5. 追加の文脈が必要になったら `openspec list` や `openspec show <item>` を参照する。"
].join("\n");

const applyReferences = [
  "**Reference**",
  "- 実装中に提案内容を再確認したい場合は `openspec show <id> --json --deltas-only` を参照する。"
].join("\n");

const archiveSteps = [
  "**Steps**",
  "1. アーカイブ対象の change-id を特定する:",
  "   - プロンプトに既に change-id が含まれている場合（例: スラッシュコマンド引数経由）、前後の空白を除去してその値を使う。",
  "   - 会話内でタイトルや概要だけが示されている場合は `openspec list` を実行して候補を提示し、ユーザーに意図する change-id を確認する。",
  "   - それでも特定できない場合は追加情報を求め、単一の change-id が確定するまでアーカイブを実行しない。",
  "2. `openspec list` や `openspec show <id>` で change-id を検証し、存在しない・既にアーカイブ済み・準備未完了のものは停止する。",
  "3. `openspec archive <id> --yes` を実行し、対話なしで変更を移動して仕様更新を適用する（ツールのみの変更で仕様更新が不要なら `--skip-specs` を付ける）。",
  "4. コマンド出力を確認し、対象の仕様が更新され、変更が `changes/archive/` に移動されたことを確認する。",
  "5. `openspec validate --strict` を実行し、必要に応じて `openspec show <id>` で状態を確認する。"
].join("\n");

const archiveReferences = [
  "**Reference**",
  "- アーカイブ前に `openspec list` で change-id を再確認する。",
  "- `openspec list --specs` で更新された仕様を目視し、問題があれば解決してからユーザーに引き継ぐ。"
].join("\n");

export const slashCommandBodies: Record<SlashCommandId, string> = {
  proposal: [proposalGuardrails, proposalSteps, proposalReferences].join('\n\n'),
  apply: [baseGuardrails, applySteps, applyReferences].join('\n\n'),
  archive: [baseGuardrails, archiveSteps, archiveReferences].join('\n\n')
};

export function getSlashCommandBody(id: SlashCommandId): string {
  return slashCommandBodies[id];
}
