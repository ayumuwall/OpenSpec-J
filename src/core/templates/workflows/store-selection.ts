/**
 * Shared store-selection guidance for skill template workflows.
 *
 * Interpolated into every workflow's instructions so generated skills
 * consistently teach how to target a registered store with `--store <id>`.
 */
export const STORE_SELECTION_GUIDANCE = `**Store の選択:** ユーザーが store 名を挙げた場合（store はこのマシンに登録された独立した OpenSpec リポジトリです）、または作業対象が store 内にある場合は、\`openspec store list --json\` を実行して登録済み store ID を確認し、仕様や変更を読み書きするコマンド（\`new change\`, \`status\`, \`instructions\`, \`list\`, \`show\`, \`validate\`, \`archive\`, \`doctor\`, \`context\`, \`view\`）に \`--store <id>\` を渡します。他のコマンドはこのフラグを取りません。コマンドが出力するヒントには既にこのフラグが含まれるため、後続コマンドでも維持してください。store がない場合、コマンドは最も近いローカルの \`openspec/\` ルートに作用します。`;
