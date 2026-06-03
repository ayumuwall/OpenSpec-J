# エージェント向け OpenSpec CLI プレイブック

ベータ版の注意: workspace と initiative のフローは利用できますが、まだ対象範囲は小さめです。シンプルなコマンド、明確なパス、短いステータス報告を優先してください。

## まずコンテキストを解決する

正確なパスが必要な場合は JSON を使います。

```bash
openspec context-store list --json
openspec initiative list --json
openspec initiative show <store>/<initiative> --json
openspec workspace doctor --json
```

ユーザーが開いたワークスペースから作業している場合は、そのワークスペースをローカルの作業ビューとして扱います。`workspace doctor --json` を使って、リンク済みリポジトリ / フォルダと選択中の initiative を確認します。現在のディレクトリが、実装アーティファクトを置くべきリポジトリだと決めつけないでください。

## コンテキストストアを非対話でセットアップする

人は `openspec context-store setup` を実行してプロンプトに答えられます。エージェントはセットアップ入力を明示的に渡してください。

```bash
openspec context-store setup team-context --no-init-git --json
openspec context-store setup team-context --path /path/to/team-context --init-git --json
```

ファイルを残したままローカル登録だけを解除するには `context-store unregister <id> --json` を使います。`context-store remove <id> --yes --json` は、ユーザーがローカルのコンテキストストアフォルダの削除を明示的に依頼した場合だけ使います。

## コンテキストストア内に initiative を作成する

コンテキストストア内に共有の調整コンテキストを作成します。

```bash
openspec initiative create billing-launch --store team-context --title "Billing Launch" --summary "混乱を避けながら billing を公開する。"
```

その後、コンテキストストア内の initiative ファイルを編集します。

- `requirements.md`
- `design.md`
- `decisions.md`
- `questions.md`
- `tasks.md`

## workspace から検討または提案する

ユーザーが workspace から検討またはドラフト作成を依頼した場合:

1. `openspec workspace doctor --json` で workspace の状態を確認する。
2. `openspec initiative show <store>/<initiative> --json` で initiative の内容を確認する。
3. リンク済みリポジトリまたはフォルダを調べ、作業を担当するリポジトリを特定する。
4. 担当リポジトリが曖昧な場合は、どのリンク済みリポジトリに OpenSpec change を作るべきかユーザーに確認する。
5. explore / propose ワークフローコマンドはワークスペースルートではなく、担当リポジトリで実行する。

workspace は相談と状況確認の場所です。実装計画を永続的に置く場所ではありません。

## 担当リポジトリで change を作成する

リポジトリ内の change は、その作業を担当するリポジトリに属します。

```bash
openspec new change add-billing-api --initiative team-context/billing-launch
```

このコマンドは、担当リポジトリを現在の作業ディレクトリにして実行します。ユーザーに入力させず、ワークスペースルートから initiative に紐づく change を作成しないでください。workspace しか分からない場合は、まずリンク済みリポジトリのパスを確認します。

change を作成したら、作成したファイルの絶対パスと、紐づけた initiative を報告します。

## 推測する前に doctor を使う

```bash
openspec workspace doctor --workspace billing-launch --json
openspec context-store doctor --json
```

## まだ約束しないこと

- 自動 sync / pull / push / conflict handling
- リポジトリの clone
- branch、worktree、submodule の作成
- workspace apply / verify / archive
- 進捗ダッシュボード
- 強制的な編集境界
