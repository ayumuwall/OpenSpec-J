# コーディングエージェントと OpenSpec を使う

ベータ版の注意: ここでは、まず使える最小限の流れだけを扱います。ローカル環境の準備は人が行い、OpenSpec の作業はエージェントに任せます。

## 1. 共有場所を作成する

```bash
openspec context-store setup
```

OpenSpec はコンテキストストア名、保存先、Git を初期化するかを尋ねます。特定の場所に置く必要がなければ、Enter を押して OpenSpec 管理のローカルデータディレクトリを使ってください。

## 2. エージェントに initiative の作成を依頼する

> `team-context` に `billing-launch` という OpenSpec initiative を作成してください。短く有用な内容にしてください。

## 3. ローカルの作業スペースを開く

```bash
openspec workspace open
```

選択画面から initiative を選びます。対応するローカルワークスペースがまだなければ、OpenSpec が作成します。新しく作る場合は、含めるローカルリポジトリやフォルダも確認されます。

開いたエディタには、リンク済みリポジトリやフォルダ、関連する initiative のコンテキスト、最後に `AGENTS.md`、`.openspec-workspace/view.yaml`、生成された `.code-workspace` ファイルを含む小さな `OpenSpec workspace` フォルダが表示されます。

選択画面を省略したい場合は `openspec workspace open --initiative team-context/billing-launch --editor` を使います。エージェントを直接起動したい場合は、`--editor` の代わりに `--agent codex-cli`、`--agent claude`、または `--agent github-copilot` を使います。

## 4. ローカルコンテキストを確認する

作業計画を立てる前に、開いたワークスペースの状態をエージェントに確認させます。

> この OpenSpec workspace を確認してください。選択された initiative とリンク済みリポジトリまたはフォルダを確認し、作業を検討する前に重要な不足があるか教えてください。

リポジトリやフォルダが不足している場合は、リンクすべきローカルパスをエージェントに伝えます。OpenSpec は何も clone しません。

## 5. アーティファクト作成前に探索する

ワークスペースを、エージェントと相談しながら方針を固める場所として使います。

> initiative `team-context/billing-launch` を使って、この workspace で作業内容を検討してください。まず initiative のコンテキストとリンク済みリポジトリの情報を読んでください。まだ change は作成せず、何を提案すべきか、OpenSpec アーティファクトをどこに置くべきかを判断するのを手伝ってください。

## 6. 準備ができたらドラフトを依頼する

探索が収束したら、適切な場所に適切なアーティファクトを作成するよう依頼します。

> 作業を担当するリンク済みリポジトリに OpenSpec proposal のドラフトを作成し、`team-context/billing-launch` にリンクしてください。workspace と initiative のコンテキストは自分で確認し、必要な OpenSpec コマンドを正しいリポジトリで実行し、作成したファイルを報告してください。

## 小さな注意

この beta フローでは、OpenSpec は clone、同期、ブランチ作成、進捗ダッシュボードの追跡を行いません。共有 initiative のコンテキスト、ローカルワークスペース、全体目標に紐づくリポジトリ内の計画を扱います。ワークスペースは人とエージェントが一緒に作業する場所です。永続的な計画アーティファクトは、コンテキストストア内の initiative または作業を担当するリポジトリに置き、ワークスペースルートには置かないでください。
