---
name: openspec
description: OpenSpec に関する質問と操作の共通窓口。スキルを指定せずに OpenSpec の作業を依頼された場合、操作方法や変更提案の進捗、次の手順を尋ねられた場合、複数の手順をまとめて依頼された場合に使います。利用者が「openspec」と指定し、より具体的な OpenSpec スキルが当てはまらない場合にも使います。
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: openspec CLI が必要です。
metadata:
  author: openspec
  version: "1.0"
  references: "ffac437caccd"
---

OpenSpec は、ソフトウェアの振る舞いを利用者とコーディングエージェントが仕様として合意し、コードの変更に合わせて仕様を更新するためのツールです。変更は仕様差分として計画し、コードを書く前にレビューします。実装を終えたら、仕様差分を本仕様へ統合します。

このプロジェクトで OpenSpec の共通窓口を担当します。依頼を確認し、質問に答える、作業を担当スキルへ引き継ぐ、複数のスキルを順に実行する、のいずれかを行います。

**OpenSpec の構成**

- `openspec/specs/` には、システムの現在の振る舞いを記述した仕様があります。
- `openspec/changes/<name>/` には、変更 1 件分の提案、仕様差分、設計、タスクがあります。
- 通常は探索（任意）、提案、適用、検証（任意）、アーカイブの順に進めます。アーカイブは仕様を更新し、変更提案を `openspec/changes/archive/` へ移します。

**利用者が進め方に迷っている場合**

進捗や次の手順を尋ねられたら、`references/where-things-stand.md` を読み、その指示に従います。

OpenSpec の仕組みや設定方法を尋ねられたら、`references/answers.md` を読み、内容に沿って答えます。

**担当スキルを選ぶ**

作業を依頼されたら、該当する行のスキルを呼び出し、その手順に従います。

| 利用者の目的 | 使うスキル |
|---|---|
| 実装する内容を決める前に、アイデアや課題を検討する | `openspec-explore` |
| 実装する内容を伝え、提案・仕様・設計・タスクをまとめて作成する | `openspec-propose` |
| 変更提案を開始し、アーティファクトを 1 つずつ作る | `openspec-new-change` |
| 変更提案の次のアーティファクトを作る | `openspec-continue-change` |
| 変更提案の残りのアーティファクトを一度に作る | `openspec-ff-change` |
| 既存の変更提案の計画を修正する | `openspec-update-change` |
| 変更提案のタスクを実装する | `openspec-apply-change` |
| アーカイブ前に、コードを変更提案と照合する | `openspec-verify-change` |
| 変更提案を進行中のまま、本仕様を更新する | `openspec-sync-specs` |
| 完了した変更提案をアーカイブする | `openspec-archive-change` |
| 完了した複数の変更提案をアーカイブする | `openspec-bulk-archive-change` |
| 案内を受けながら OpenSpec を初めて使う | `openspec-onboard` |

- 複数の行に当てはまる場合は、選択肢を示してどれを指すか確認します。
- 担当スキルが未導入なら、そのことを伝え、`references/without-skills.md` の対応する節に従います。`openspec config profile` で選んでから `openspec update` を実行すると追加できることを案内します。

**複数の手順をまとめて依頼された場合**

「この変更を検証してからアーカイブして」のように複数の行に当たる作業を依頼された場合は、スキルを 1 つずつ順に実行します。各手順を終えてから次へ進みます。担当スキルの指示に従い、利用者の判断を待つ手順では、次の手順を伝えて停止します。

**このプロジェクトで OpenSpec を使っていない場合**

自動でこのスキルを選び、`openspec list --json` が `"root": null` を返した場合は、通常どおり OpenSpec を使わずに依頼へ対応します。利用者が OpenSpec を明示した場合は、`openspec init` でのセットアップを提案します。
