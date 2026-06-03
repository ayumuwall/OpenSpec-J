# エージェント向け OpenSpec CLI プレイブック

ベータ版の注意: workspace と initiative のフローは利用可能ですが、まだ小さな範囲です。平易なコマンド、明確なパス、短いステータス報告を優先してください。

## まずコンテキストを解決する

正確なパスが必要な場合は JSON を使います。

```bash
openspec context-store list --json
openspec initiative list --json
openspec initiative show <store>/<initiative> --json
openspec workspace doctor --json
```

ユーザーが開いたワークスペースから作業している場合は、そのワークスペースをローカルビューとして扱います。`workspace doctor --json` を使って、リンク済み repos / folders と選択中 initiative を読み取ります。現在のディレクトリが実装アーティファクトを所有すべき repo だと決めつけないでください。

## context store を非対話でセットアップする

人は `openspec context-store setup` を実行してプロンプトに答えられます。エージェントはセットアップ入力を明示的に渡してください。

```bash
openspec context-store setup team-context --no-init-git --json
openspec context-store setup team-context --path /path/to/team-context --init-git --json
```

ファイルを残したままローカル登録だけを忘れるには `context-store unregister <id> --json` を使います。`context-store remove <id> --yes --json` は、ユーザーがローカル context-store フォルダの削除を明示的に依頼した場合だけ使います。

## context store 内に initiative を作成する

context store 内に共有調整コンテキストを作成します。

```bash
openspec initiative create billing-launch --store team-context --title "Billing Launch" --summary "混乱を避けながら billing を公開する。"
```

その後、context store 内の initiative ファイルを編集します。

- `requirements.md`
- `design.md`
- `decisions.md`
- `questions.md`
- `tasks.md`

## workspace から探索または提案する

ユーザーが workspace から探索またはドラフト作成を依頼した場合:

1. `openspec workspace doctor --json` で workspace を解決する。
2. `openspec initiative show <store>/<initiative> --json` で initiative を解決する。
3. リンク済み repos または folders を調べ、所有元になりそうな repo を特定する。
4. 所有元が曖昧な場合は、どの linked repo が repo-local な OpenSpec change を所有すべきかユーザーに確認する。
5. explore / propose ワークフローコマンドは workspace root ではなく、所有元 repo から実行する。

workspace は会話のコックピットです。実装計画の永続的な置き場所ではありません。

## 所有元 repo から change を作成する

repo-local な change は、その作業を所有する repo に属します。

```bash
openspec new change add-billing-api --initiative team-context/billing-launch
```

このコマンドは、所有元 repo を現在の作業ディレクトリにして実行します。ユーザーに入力させず、workspace root から initiative-linked change creation を実行しないでください。workspace しか分からない場合は、まず linked repo パスを解決します。

change を作成したら、作成したファイルの絶対パスと、使用した initiative link を報告します。

## 推測する前に doctor を使う

```bash
openspec workspace doctor --workspace billing-launch --json
openspec context-store doctor --json
```

## まだ約束しないこと

- 自動 sync / pull / push / conflict handling
- repo の clone
- branch、worktree、submodule の作成
- workspace apply / verify / archive
- 進捗ダッシュボード
- 強制的な編集境界
