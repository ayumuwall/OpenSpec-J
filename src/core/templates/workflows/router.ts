/**
 * OpenSpec の共通窓口となるルータースキル。プロジェクトの進捗や操作方法に
 * 答え、作業の依頼は担当するスキルへ振り分ける。複数の依頼は順に実行する。
 * 各ワークフローの手順は担当スキルが持ち、必要なときだけ読む補足は
 * `references/` にまとめる。
 */
import type { SkillTemplate } from '../types.js';

export const ROUTER_SKILL_NAME = 'openspec';

const WITHOUT_SKILLS = `# 対応するスキルが未導入の場合

依頼された手順のスキルがインストールされていないときに使います。各節は 1 つのスキルに対応する CLI での手順です。プロジェクトルートで実行し、\`--json\` の出力を読みます。スキルを追加するには、利用者が \`openspec config profile\` を実行して選択し、\`openspec update\` を実行します。

## /opsx:explore

探索は利用者との対話で進めます。\`openspec list --json\` の出力、関連する仕様とコードを読み、課題を一緒に検討します。作るものが決まるまで、コードも変更提案のファイルも書きません。

## /opsx:propose, /opsx:new, /opsx:continue, /opsx:ff

1. 短いケバブケースの名前を使い、\`openspec new change "<name>"\` で変更提案を開始します。
2. \`openspec status --change "<name>" --json\` を実行し、作成可能なアーティファクトを確認します。
3. アーティファクトごとに \`openspec instructions <artifact-id> --change "<name>" --json\` を実行します。\`instruction\` と \`template\` に従って、\`outputPath\` にファイルを書き込みます。
4. 手順 2 と 3 を繰り返します。段階的に進める場合はアーティファクトを 1 つ作ったら停止します。計画全体を依頼された場合は、計画が完成するまで続けます。

## /opsx:update

変更提案のファイルを読み、利用者が指定したものを修正します。\`openspec validate "<name>"\` を実行し、指摘された問題を修正します。編集対象は計画ファイルに限ります。

## /opsx:apply

\`openspec instructions apply --change "<name>" --json\` を実行します。\`contextFiles\` に列挙されたファイルを読み、未完了のタスクを順に実行します。各タスクを終えたらすぐに \`tasks.md\` の \`- [ ]\` を \`- [x]\` に変更します。

## /opsx:verify

変更提案のタスクと仕様を読み、コードと照合します。すべてのタスクが完了し、要件とシナリオが実装されているか確認します。不足を報告し、ファイルは変更しません。

## /opsx:sync

変更提案を進行中のまま本仕様だけを更新するコマンドはありません。手動で同期する場合は、\`openspec/changes/<name>/specs/\` 内のファイルを、対応する \`openspec/specs/<capability>/spec.md\` へ統合して \`openspec validate --specs\` を実行します。変更提案をアーカイブする場合は、アーカイブ時に統合されます。

## /opsx:archive, /opsx:bulk-archive

まず変更提案が完了しているか確認します。\`openspec status --change "<name>" --json\` でアーティファクトを確認し、\`openspec list --json\` で全タスク数 \`totalTasks\` と完了数 \`completedTasks\` を確認します。未完了の項目がある場合は、利用者に伝えて続行するか確認します。\`openspec archive "<name>" --yes\` を実行すると、仕様差分を本仕様へ統合し、変更提案をアーカイブへ移します。複数の変更提案は 1 件ずつ進めます。

## /opsx:onboard

利用者自身のプロジェクトで、小さな変更を 1 件選んで案内します。上の手順に沿って、探索、提案、適用、アーカイブまで進めます。
`;

const WHERE_THINGS_STAND = `# 現状と次の手順を確認する

進捗や次にすることを尋ねられたら、先に実際の状態を確認します。

- \`openspec list --json\` で進行中の変更提案を一覧表示します。
- \`openspec status --change "<name>" --json\` で、作成済みのアーティファクトと次に作成できるものを確認します。\`openspec status --all --json\` は全件を表示します。
- \`openspec show "<name>"\` で変更提案または仕様を表示します。
- 利用者がストアを指定した場合は、各コマンドに \`--store <id>\` を付けます。\`openspec store list --json\` でストアを一覧表示します。

現状を 1、2 文で伝え、次の手順と担当するスキルを示します。実行するか利用者に確認し、同意を得てから着手します。
`;

const ANSWERS = `# よくある質問への回答

OpenSpec の仕組みや設定方法を尋ねられたときに使います。回答にフラグを含める前に、CLI のヘルプ（\`openspec <command> --help\`）で確認します。

## ファイルの場所

- \`openspec/specs/<capability>/spec.md\`。現在の振る舞いを要件とシナリオで記述します。
- \`openspec/changes/<name>/\`。変更提案を 1 件格納します。通常は \`proposal.md\`、仕様差分の \`specs/\`、任意の \`design.md\`、\`tasks.md\` が入ります。
- \`openspec/changes/archive/\`。完了した変更提案を格納します。
- \`openspec/config.yaml\`。プロジェクトのスキーマ、エージェントが読む \`context\`、アーティファクトごとの \`rules\` を設定します。

## 状態の確認

- 進行中の変更提案は \`openspec list\`、仕様は \`openspec list --specs\` で一覧表示します。
- 変更提案の進捗は \`openspec status --change "<name>"\` で確認します。
- 変更提案や仕様の内容は \`openspec show "<name>"\` で表示します。
- ファイルの形式は \`openspec validate "<name>"\` で検証します。まとめて検証するには \`openspec validate --all\` を使います。
- 全体をダッシュボードで見るには \`openspec view\` を実行します。

## セットアップ

- プロジェクトの初期化やエージェントの追加には \`openspec init\` を実行します。
- 導入するスキルは \`openspec config profile\` で選択し、各プロジェクトで \`openspec update\` を実行します。
- OpenSpec のアップグレード後にスキルを更新するには \`openspec update\` を実行します。
- プロジェクト固有の情報をエージェントへ伝えるには、\`openspec/config.yaml\` の \`context\` に短い文を追加します。文面について利用者の同意を得てから編集します。
- アーティファクトのワークフローを確認・変更するには、\`openspec schemas\` でスキーマを一覧表示し、\`openspec templates\` で各アーティファクトのテンプレートの場所を確認します。

## ストア

ストアは、このマシンに登録された独立した OpenSpec リポジトリです。仕様をコードの外に置くときに使います。コマンド一覧は \`openspec store --help\` で確認します。多くのコマンドでは \`--store <id>\` を指定して、現在のプロジェクトに代えてストアで作業できます。

## 問題が起きた場合

- \`openspec doctor\` を実行し、診断を確認します。
- メンテナーに連絡するときは、文面について利用者の同意を得てから \`openspec feedback "<message>"\` を実行します。
`;

export function getRouterSkillTemplate(): SkillTemplate {
  return {
    name: ROUTER_SKILL_NAME,
    description: 'OpenSpec に関する質問と操作の共通窓口。スキルを指定せずに OpenSpec の作業を依頼された場合、操作方法や変更提案の進捗、次の手順を尋ねられた場合、複数の手順をまとめて依頼された場合に使います。利用者が「openspec」と指定し、より具体的な OpenSpec スキルが当てはまらない場合にも使います。',
    instructions: `OpenSpec は、ソフトウェアの振る舞いを利用者とコーディングエージェントが仕様として合意し、コードの変更に合わせて仕様を更新するためのツールです。変更は仕様差分として計画し、コードを書く前にレビューします。実装を終えたら、仕様差分を本仕様へ統合します。

このプロジェクトで OpenSpec の共通窓口を担当します。依頼を確認し、質問に答える、作業を担当スキルへ引き継ぐ、複数のスキルを順に実行する、のいずれかを行います。

**OpenSpec の構成**

- \`openspec/specs/\` には、システムの現在の振る舞いを記述した仕様があります。
- \`openspec/changes/<name>/\` には、変更 1 件分の提案、仕様差分、設計、タスクがあります。
- 通常は探索（任意）、提案、適用、検証（任意）、アーカイブの順に進めます。アーカイブは仕様を更新し、変更提案を \`openspec/changes/archive/\` へ移します。

**利用者が進め方に迷っている場合**

進捗や次の手順を尋ねられたら、\`references/where-things-stand.md\` を読み、その指示に従います。

OpenSpec の仕組みや設定方法を尋ねられたら、\`references/answers.md\` を読み、内容に沿って答えます。

**担当スキルを選ぶ**

作業を依頼されたら、該当する行のスキルを呼び出し、その手順に従います。

| 利用者の目的 | 使うスキル |
|---|---|
| 実装する内容を決める前に、アイデアや課題を検討する | \`/opsx:explore\` |
| 実装する内容を伝え、提案・仕様・設計・タスクをまとめて作成する | \`/opsx:propose\` |
| 変更提案を開始し、アーティファクトを 1 つずつ作る | \`/opsx:new\` |
| 変更提案の次のアーティファクトを作る | \`/opsx:continue\` |
| 変更提案の残りのアーティファクトを一度に作る | \`/opsx:ff\` |
| 既存の変更提案の計画を修正する | \`/opsx:update\` |
| 変更提案のタスクを実装する | \`/opsx:apply\` |
| アーカイブ前に、コードを変更提案と照合する | \`/opsx:verify\` |
| 変更提案を進行中のまま、本仕様を更新する | \`/opsx:sync\` |
| 完了した変更提案をアーカイブする | \`/opsx:archive\` |
| 完了した複数の変更提案をアーカイブする | \`/opsx:bulk-archive\` |
| 案内を受けながら OpenSpec を初めて使う | \`/opsx:onboard\` |

- 複数の行に当てはまる場合は、選択肢を示してどれを指すか確認します。
- 担当スキルが未導入なら、そのことを伝え、\`references/without-skills.md\` の対応する節に従います。\`openspec config profile\` で選んでから \`openspec update\` を実行すると追加できることを案内します。

**複数の手順をまとめて依頼された場合**

「この変更を検証してからアーカイブして」のように複数の行に当たる作業を依頼された場合は、スキルを 1 つずつ順に実行します。各手順を終えてから次へ進みます。担当スキルの指示に従い、利用者の判断を待つ手順では、次の手順を伝えて停止します。

**このプロジェクトで OpenSpec を使っていない場合**

自動でこのスキルを選び、\`openspec list --json\` が \`"root": null\` を返した場合は、通常どおり OpenSpec を使わずに依頼へ対応します。利用者が OpenSpec を明示した場合は、\`openspec init\` でのセットアップを提案します。`,
    references: {
      'without-skills.md': WITHOUT_SKILLS,
      'answers.md': ANSWERS,
      'where-things-stand.md': WHERE_THINGS_STAND,
    },
    license: 'MIT',
    compatibility: 'openspec CLI が必要です。',
    metadata: { author: 'openspec', version: '1.0' },
  };
}
