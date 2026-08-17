/**
 * Shared store-selection guidance for skill template workflows.
 *
 * Interpolated into every workflow's instructions so generated skills
 * consistently teach how to target a registered store with `--store <id>`.
 */
export const STORE_SELECTION_GUIDANCE = `**ストアの選択:** ユーザーがストア（この端末に登録された独立した OpenSpec リポジトリ）を指定した場合、または作業がストアにある場合は、\`openspec store list --json\` で登録済みストア ID を調べます。その後、仕様と変更を読み書きするコマンド（\`new change\`、\`status\`、\`instructions\`、\`list\`、\`show\`、\`validate\`、\`archive\`、\`doctor\`、\`context\`、\`schemas\`、\`view\`）に \`--store <id>\` を指定します。一度選んだら、その後のワークフローでは \`--store <id>\` を維持します。以下にフラグなしで示すコマンド例は省略形なので、実行前にフラグを追加してください。たとえば、フラグなしの例ではなく \`openspec status --change "<name>" --json --store "<id>"\` を実行します。ほかのコマンドはこのフラグを受け取りません。コマンドが出力するヒントには既にフラグが含まれるため、後続コマンドでも維持してください。ストアを使わない場合、コマンドは最も近いローカルの \`openspec/\` ルートを対象にします。`;
