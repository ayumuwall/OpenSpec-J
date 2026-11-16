/**
 * Shared project-root guidance for skill template workflows.
 *
 * Generated skills and commands are installed once per machine, so they are
 * offered in every repository the agent opens - including repositories that
 * never ran `openspec init`. Nothing stops the workflow there: `openspec new
 * change` falls back to an implicit root and creates `openspec/` in whatever
 * directory the agent happens to be in.
 *
 * This guidance is interpolated into every workflow so the agent checks for a
 * root before writing. `openspec list --json` is the check because it refuses
 * to fabricate an implicit root: it reports `root: null` both when nothing is
 * set up and when only stores are registered.
 *
 * 確認後の処理は、ワークフローの呼び出し方に応じて分岐する（#1645）。
 * 無関係なリポジトリでモデルが自動選択した場合、OpenSpec は介入しない。
 * 利用者は通常の支援を求めており、セットアップ画面を出すのは報告済みの不具合。
 * OpenSpec やスキルを指定した利用者には OpenSpec について回答する必要があるため、
 * その場合は停止して確認する。
 *
 * 名前でスキルを呼び出す操作は明示的な依頼なので、後者の分岐に該当する。
 */
export const PROJECT_ROOT_GUARD = `**プロジェクトの確認:** この手順は、すでに OpenSpec を使っているプロジェクトを対象とします。最初の書き込み操作（\`new change\`、\`archive\`、\`sync specs\`、アーティファクトファイルの作成など）の前に、プロジェクトにルートがあることを確認してください。\`openspec list --json\` を実行し、\`root\` を読み取ります（ストアを選択している場合は、そのストアがルートになるため \`--store <id>\` を指定します）。ルートオブジェクトがあればセットアップ済みです。\`"root": null\` なら未設定で、この場所には \`openspec/\` ディレクトリがありません。\`openspec new change\` などの書き込み操作を行うと、副作用として作成されます。この場合、コマンドは非ゼロで終了しますが、CLI の故障ではなく確認結果です。再試行や回避策を試すのではなく JSON を読んでください。

\`"root": null\` でも、未設定を意味しない場合があります。\`status\` のエラーメッセージが、このプロジェクトの \`openspec/config.yaml\`（または \`config.yml\`）を示し、「での宣言:」または「のストア宣言が不正です:」と続く場合です。このプロジェクトは宣言したストアを通じて OpenSpec を使っていますが、このマシンではストアを解決できません（ストアが未登録、または \`store:\` 行の形式が不正）。未初期化として扱わず、以下の分岐には進まないでください。書き込み前に停止し、エラーの \`message\` と \`fix\` をユーザーに示します。

それ以外でルートがない場合は、このワークフローを使うに至った経緯に応じて対応します:

- **自動選択した場合**: ユーザーが OpenSpec やこのスキルを指定せず、名前でスキルも呼び出していないのに、自分でこのワークフローを選んだ場合です。OpenSpec の使用をやめ、OpenSpec がインストールされていない場合と同じように、通常どおり依頼に対応してください。セットアップを求めたり、OpenSpec のセットアップに言及したりしないでください。
- **OpenSpec を明示的に指定された場合**: ユーザーが OpenSpec やこのスキルを指定した、または名前でスキルを呼び出した場合です。書き込み前に停止し、このプロジェクトをセットアップする（\`openspec init\`）、既存のストアを対象にする（\`--store <id>\`）、今回の依頼は OpenSpec を使わずに進める、のどれにするかを尋ねて回答を待ちます。

どちらの場合も、副作用としてルートを作成してはいけません。ユーザーが依頼するまでは \`openspec init\` を実行せず、\`openspec/\` 配下のファイルを手作業で作成せず、コマンドによる自動作成も避けてください。`;
