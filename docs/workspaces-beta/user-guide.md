# コーディングエージェントと OpenSpec を使う

Beta note: これは最小限に役立つパスです。ローカルセットアップは人が行い、OpenSpec 作業はエージェントに任せます。

## 1. 共有場所を作成する

```bash
openspec context-store setup
```

OpenSpec は context store 名、配置場所、Git を初期化するかを尋ねます。特定の場所に置きたい場合を除き、Enter を押して管理対象のローカルデータディレクトリを使ってください。

## 2. エージェントに initiative の作成を依頼する

> `team-context` に `billing-launch` という OpenSpec initiative を作成してください。短く有用な内容にしてください。

## 3. ローカル作業台を開く

```bash
openspec workspace open
```

picker から initiative を選択します。まだローカルワークスペースビューがなければ、OpenSpec が作成します。新しいビューを作るときは、含めるローカルリポジトリやフォルダも尋ねます。

開いたエディタビューでは、まずリンク済みリポジトリとフォルダが表示され、initiative context が紐づいている場合はそれが続き、最後に `AGENTS.md`、`.openspec-workspace/view.yaml`、生成された `.code-workspace` ファイルを含む小さな `OpenSpec workspace` フォルダが表示されます。

picker を省略したい場合は `openspec workspace open --initiative team-context/billing-launch --editor` を使います。エージェントを直接開きたい場合は、`--editor` の代わりに `--agent codex-cli`、`--agent claude`、または `--agent github-copilot` を使います。

## 4. ローカルコンテキストを確認する

作業計画を立てる前に、開いたワークスペースをエージェントに確認させます。

> この OpenSpec workspace を確認してください。選択された initiative を解決し、リンク済みリポジトリまたはフォルダを一覧し、作業を探索する前に重要な不足があるか教えてください。

リポジトリやフォルダが不足している場合は、リンクすべきローカルパスをエージェントに伝えます。OpenSpec は何も clone しません。

## 5. アーティファクト作成前に探索する

会話の場としてワークスペースを使います。

> initiative `team-context/billing-launch` を使って、この workspace で作業を探索してください。まず initiative context とリンク済み repo context を読んでください。まだ change は作成せず、何を提案すべきか、OpenSpec アーティファクトをどこに置くべきかを判断するのを手伝ってください。

## 6. 準備ができたらドラフトを依頼する

探索が収束したら、適切な場所に適切なアーティファクトを作成するよう依頼します。

> 所有元の linked repo に repo-local な OpenSpec proposal のドラフトを作成し、`team-context/billing-launch` にリンクしてください。workspace と initiative context は自分で解決し、必要な OpenSpec コマンドを正しい repo から実行し、作成したファイルを報告してください。

## 小さな注意

この beta フローでは、OpenSpec は clone、同期、ブランチ作成、進捗ダッシュボードの追跡を行いません。共有 initiative context、ローカルワークスペースビュー、大きな目的へ紐づく repo-local な計画を提供します。ワークスペースは人とエージェントが一緒に作業する場所です。永続的な計画アーティファクトは、context store の initiative または所有元 repo に置き、ワークスペースルートには置かないでください。
