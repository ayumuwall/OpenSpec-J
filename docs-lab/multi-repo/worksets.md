# Worksets（ベータ）

> ストアと利用側リポジトリを 1 つのエディタウィンドウで開き、エージェントから両方を参照できるようにします。

ストアを使うと、エージェントが必要とするコンテキストが複数のフォルダに分かれます。仕様と変更はストアにあり、コードは各リポジトリにあります。1 つのリポジトリで起動したエージェントは、そのリポジトリしか読み取り、検索できないため、全体の一部しか把握できません。

OpenSpec では、この問題に workset を使います。workset は、一緒に開くフォルダへ名前を付けて保存した一覧です。このページでは、ストアがすでにセットアップされ、マシンへ登録済みであることを前提とします。手順は[ストア（ベータ）](stores.md)を参照してください。

## 仕組み

- **workset とは**：名前を付けたフォルダ一覧で、マシン上だけに保存されます。対象フォルダには何も書き込まず、コミットも行いません。
- **開くと行われること**：OpenSpec が一覧から`.code-workspace`ファイルを生成し、エディタで開きます。すべての対象フォルダが 1 つのウィンドウに表示されます。
- **得られるもの**：エディタの検索と、そのウィンドウ内で実行するエージェントから、すべての対象フォルダを読み取れます。1 つのセッションでストアの仕様とリポジトリのコードを検索できます。
- **変わらないもの**：コマンドが使う`openspec/`フォルダです。引き続き[アーティファクトの作成先](stores.md#where-artifacts-get-created-when-using-stores)の規則に従います。

## セットアップ

1. **workset を保存する**（マシンごとに一度実行）。リポジトリとストアを対象に指定し、開くツールを選びます。

   ```bash
   # 一緒に開くフォルダ一覧へ名前を付けて保存
   openspec workset create platform \
     --member ~/src/web-app \
     --member ~/openspec/team-plans \
     --tool code
   ```

   ```yaml
   ワークセット 'platform' をこのマシンに保存しました（メンバー 2 件）。
   いつでも次のコマンドで開けます: openspec workset open platform
   ```

2. **作業開始時に開く。**

   ```bash
   # すべての対象フォルダを 1 つの VS Code ウィンドウで開く
   openspec workset open platform
   ```

`openspec workset list`を実行すると保存内容を確認できます。`openspec workset remove <name>`を実行すると、対象フォルダへ触れずに workset だけを削除できます。

```yaml
platform  (opens in VS Code)
web-app     /Users/you/src/web-app
team-plans  /Users/you/openspec/team-plans
```

## 使い方：1 つの変更と 2 つのフォルダ

`add-login`変更が`team-plans`ストアにあり、実装コードが`web-app`にある場合を考えます。`platform`workset を開き、エージェントへ変更の実装を依頼します。1 つのセッションで、エージェントは次の操作を実行できます。

- `team-plans/openspec/changes/add-login/`と同じ場所にある仕様を読み取る
- `web-app/`のコードを編集する
- `web-app`内から`openspec`コマンドを実行する

workset を使わない場合、エージェントが参照できるのは、起動したフォルダだけです。

## 組み込み対応ツール

- **VS Code**（`--tool code`）と**Cursor**（`--tool cursor`）：組み込みで対応しています。すべての対象フォルダを 1 つのウィンドウで開きます。
- **ターミナルの Claude Code と Codex**：workset を開く処理の見直し中のため、一時的に無効です。`--tool claude`または`--tool codex`を指定すると、無効であることと、VS Code または Cursor を使う方法を示すエラーが表示されます。
- **ほかのエディタ**：[CLI 設定（config.json）](../reference/configuration/config-json.md)の`openers`キーへ追加します。
