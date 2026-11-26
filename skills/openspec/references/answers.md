# よくある質問への回答

OpenSpec の仕組みや設定方法を尋ねられたときに使います。回答にフラグを含める前に、CLI のヘルプ（`openspec <command> --help`）で確認します。

## ファイルの場所

- `openspec/specs/<capability>/spec.md`。現在の振る舞いを要件とシナリオで記述します。
- `openspec/changes/<name>/`。変更提案を 1 件格納します。通常は `proposal.md`、仕様差分の `specs/`、任意の `design.md`、`tasks.md` が入ります。
- `openspec/changes/archive/`。完了した変更提案を格納します。
- `openspec/config.yaml`。プロジェクトのスキーマ、エージェントが読む `context`、アーティファクトごとの `rules` を設定します。

## 状態の確認

- 進行中の変更提案は `openspec list`、仕様は `openspec list --specs` で一覧表示します。
- 変更提案の進捗は `openspec status --change "<name>"` で確認します。
- 変更提案や仕様の内容は `openspec show "<name>"` で表示します。
- ファイルの形式は `openspec validate "<name>"` で検証します。まとめて検証するには `openspec validate --all` を使います。
- 全体をダッシュボードで見るには `openspec view` を実行します。

## セットアップ

- プロジェクトの初期化やエージェントの追加には `openspec init` を実行します。
- 導入するスキルは `openspec config profile` で選択し、各プロジェクトで `openspec update` を実行します。
- OpenSpec のアップグレード後にスキルを更新するには `openspec update` を実行します。
- プロジェクト固有の情報をエージェントへ伝えるには、`openspec/config.yaml` の `context` に短い文を追加します。文面について利用者の同意を得てから編集します。
- アーティファクトのワークフローを確認・変更するには、`openspec schemas` でスキーマを一覧表示し、`openspec templates` で各アーティファクトのテンプレートの場所を確認します。

## ストア

ストアは、このマシンに登録された独立した OpenSpec リポジトリです。仕様をコードの外に置くときに使います。コマンド一覧は `openspec store --help` で確認します。多くのコマンドでは `--store <id>` を指定して、現在のプロジェクトに代えてストアで作業できます。

## 問題が起きた場合

- `openspec doctor` を実行し、診断を確認します。
- メンテナーに連絡するときは、文面について利用者の同意を得てから `openspec feedback "<message>"` を実行します。
