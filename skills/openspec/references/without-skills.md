# 対応するスキルが未導入の場合

依頼された手順のスキルがインストールされていないときに使います。各節は 1 つのスキルに対応する CLI での手順です。プロジェクトルートで実行し、`--json` の出力を読みます。スキルを追加するには、利用者が `openspec config profile` を実行して選択し、`openspec update` を実行します。

## openspec-explore

探索は利用者との対話で進めます。`openspec list --json` の出力、関連する仕様とコードを読み、課題を一緒に検討します。作るものが決まるまで、コードも変更提案のファイルも書きません。

## openspec-propose, openspec-new-change, openspec-continue-change, openspec-ff-change

1. 短いケバブケースの名前を使い、`openspec new change "<name>"` で変更提案を開始します。
2. `openspec status --change "<name>" --json` を実行し、作成可能なアーティファクトを確認します。
3. アーティファクトごとに `openspec instructions <artifact-id> --change "<name>" --json` を実行します。`instruction` と `template` に従って、`outputPath` にファイルを書き込みます。
4. 手順 2 と 3 を繰り返します。段階的に進める場合はアーティファクトを 1 つ作ったら停止します。計画全体を依頼された場合は、計画が完成するまで続けます。

## openspec-update-change

変更提案のファイルを読み、利用者が指定したものを修正します。`openspec validate "<name>"` を実行し、指摘された問題を修正します。編集対象は計画ファイルに限ります。

## openspec-apply-change

`openspec instructions apply --change "<name>" --json` を実行します。`contextFiles` に列挙されたファイルを読み、未完了のタスクを順に実行します。各タスクを終えたらすぐに `tasks.md` の `- [ ]` を `- [x]` に変更します。

## openspec-verify-change

変更提案のタスクと仕様を読み、コードと照合します。すべてのタスクが完了し、要件とシナリオが実装されているか確認します。不足を報告し、ファイルは変更しません。

## openspec-sync-specs

変更提案を進行中のまま本仕様だけを更新するコマンドはありません。手動で同期する場合は、`openspec/changes/<name>/specs/` 内のファイルを、対応する `openspec/specs/<capability>/spec.md` へ統合して `openspec validate --specs` を実行します。変更提案をアーカイブする場合は、アーカイブ時に統合されます。

## openspec-archive-change, openspec-bulk-archive-change

まず変更提案が完了しているか確認します。`openspec status --change "<name>" --json` でアーティファクトを確認し、`openspec list --json` で全タスク数 `totalTasks` と完了数 `completedTasks` を確認します。未完了の項目がある場合は、利用者に伝えて続行するか確認します。`openspec archive "<name>" --yes` を実行すると、仕様差分を本仕様へ統合し、変更提案をアーカイブへ移します。複数の変更提案は 1 件ずつ進めます。

## openspec-onboard

利用者自身のプロジェクトで、小さな変更を 1 件選んで案内します。上の手順に沿って、探索、提案、適用、アーカイブまで進めます。
