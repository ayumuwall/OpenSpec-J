# インストール

> `openspec` CLI のインストール、更新、アンインストール方法。

## Prerequisites

OpenSpec は Node.js 製の CLI です。Node.js 20.19.0 以降が必要です。

ターミナルで次を実行します。

```bash
node --version
```

`v20.19.0`以降が表示されれば準備完了です。それより古い場合は、[nodejs.org](https://nodejs.org)または
バージョンマネージャー（nvm、fnm、asdf、volta）から新しい Node.js をインストールしてください。

ワークフロー自体は、Claude Code、Cursor、または[対応ツール一覧](../reference/supported-tools.md)にある
AI コーディングツール内で実行します。

## AI アシスタントでインストールする

AI チャットに次のプロンプトを貼り付けます。

```text
https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/main/install.md を取得し、その手順に従ってください。
```

またはターミナルで、CLI エージェントへパイプで渡します。次は Claude Code の例です。

```bash
curl -fsSL https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/main/install.md | claude
```

これは、シェルコマンドを実行できるエージェント向けのプロンプトである
[リポジトリ直下の install.md](https://github.com/ayumuwall/OpenSpec-J/blob/main/install.md)を取得します。
一部の IDE 統合では実行できません。アシスタントは次の手順を進めます。

1. Node.js のバージョンを確認し、20.19.0 より古い場合は停止します。
2. CLI がすでにインストールされていればインストールを省略します。未インストールの場合はコマンドを示し、確認を待ってから実行します。
3. `openspec`が PATH に含まれていることを確認します。
4. 対象と判断したフォルダ名と、会話中の AI ツールを候補として示します。ほかに使用するツールを確認し、そのフォルダで`openspec init`を実行します（[プロジェクトのセットアップ](setup.md)）。
5. init が作成した内容と、使用するツールで OpenSpec を呼び出す正確な表記を報告します。

権限が必要な操作の前で停止し、シェルの起動ファイルは編集しません。正式な手順は
[以下の手動インストール方法](#install-methods)で、このプロンプトはその手順を代わりに実行します。

このインストール方法は新しく、使用するモデルによって結果が異なる場合があります。AI の誤りを
自分で修正できる場合だけ使用してください。そうでない場合は、以下の標準手順を推奨します。

## Install methods

CLI をグローバルにインストールします。[プロジェクトのセットアップ](setup.md)はその後に行います。

ターミナルで次を実行します。

```npm
npm install -g @ayumuwall/openspec@latest
```

### Yarn

`yarn global add`は Yarn Classic（1.x）専用です。現在の Yarn ではグローバルインストールが
廃止されているため、代わりに npm、pnpm、bun のいずれかを使用してください。グローバル CLI と
プロジェクトで同じパッケージマネージャーを使用する必要はありません。

### Bun

Bun は OpenSpec をインストールできますが、実行には Node.js が必要です。上記の
[前提条件](#prerequisites)を満たしてください。Node.js がない場合、すべてのコマンドが
`env: node: No such file or directory`で失敗します。Bun では
[すべての Node.js CLI](https://bun.com/docs/pm/bunx#shebangs)が同様に動作します。

### Deno

Deno は npm から CLI をインストールします。明示的な権限フラグが必要です。ターミナルで次を実行します。

```bash
deno install --global \
  --allow-read --allow-write --allow-env --allow-sys=cpus,homedir --allow-net=edge.openspec.dev \
  npm:@ayumuwall/openspec@latest
```

一部のコマンドは別のプログラムを起動します。たとえば
[`openspec config edit`](../reference/cli.md)はエディターを開きます。Deno では実行するたびに
権限確認が表示されます。表示を止めるには、対象を限定した`--allow-run=<program>`を
インストールコマンドへ追加してください。

> [!NOTE]
> Deno が`@latest`を解決できない場合は、代わりにバージョン範囲を固定してください：`npm:@ayumuwall/openspec@^1.7.0`

### Nix

OpenSpec リポジトリには Nix flake が含まれています。プロファイルへインストールします。
ターミナルで次を実行します。

```bash
nix profile install github:ayumuwall/OpenSpec-J
```

インストールせず、先に一度だけ実行することもできます。

```bash
nix run github:ayumuwall/OpenSpec-J -- --version
```

この方法では PATH に何も追加されないため、後からインストール状態を確認する必要はありません。

代わりに OpenSpec をプロジェクトの開発シェルへ追加するには、flake を input として追加し、
デフォルトパッケージを使用します。出力の一覧は
[flake.nix](https://github.com/ayumuwall/OpenSpec-J/blob/main/flake.nix)を参照してください。

### インストールを確認する

どの方法を使用した場合も、ターミナルで次を実行します。

```bash
openspec --version
```

バージョン番号が表示されれば、CLI は PATH に含まれています。インストールはマシンごとに一度だけ行います。

次に[プロジェクトをセットアップ](setup.md)します。アシスタントがすでに init を実行した場合も、
作成された内容と調整方法をリンク先のページで確認できます。

## 更新

init を実行した各プロジェクトで、次のコマンドを実行します。

```bash
openspec update
```

新しい CLI が公開されている場合、[`openspec update`](../reference/cli.md#openspec-update)が通知し、
そのままインストールできます。CLI の更新はマシンごとに一度だけ必要です。実行するたびに、
自動では更新されないプロジェクトの生成済みスキルとコマンドも更新します。最新状態のプロジェクトでは
`✓ All 2 tool(s) up to date (v1.7.0)`と表示されます。

> [!WARNING]
> Deno では、[Deno のインストール](#deno)を`-f`付きで再実行してください。このフラグがないと、
> インストール済みのコマンドを上書きしません。Nix では`nix profile upgrade openspec`を使用します。

> [!NOTE]
> npm のグローバルインストールは、1 つの Node.js 環境に属します。nvm で Node.js のバージョンを
> 切り替えても`openspec`コマンドは引き継がれないため、新しい環境で再度インストールしてください。

## アンインストール

OpenSpec をアンインストールするには、以下の手順を実行します。ソースコードには一切触れません。
エージェントにこの節を示し、削除を任せることもできます。

**1. [シェル補完](../reference/cli.md#openspec-completion)を設定している場合は削除する。**
CLI を削除する前に、ターミナルで次を実行します。

```bash
openspec completion uninstall
```

**2. パッケージを削除する。** ターミナルで次を実行します。

```npm
npm uninstall -g @ayumuwall/openspec
```

Deno では`deno uninstall --global openspec`、Nix では`nix profile remove openspec`を実行します。
これでシェルから`openspec`が見つからなくなります。

**3. 残ったファイルを削除するか、そのまま保持する。**

- 生成されたエージェントファイル：プロジェクトごとに`.claude/`や`.agents/`などへ作成された、
  `openspec-*`スキルと`opsx`コマンドです。[対応ツール](../reference/supported-tools.md)に各ツールの
  パスを掲載しています。MiniMax Code のスキルは`~/.minimax/skills`にあります。
- 旧バージョンの残存ファイル：`CLAUDE.md`または`AGENTS.md`内のマーカーブロックと、
  `~/.codex/prompts`内の`opsx-*.md`プロンプトです。マーカーブロックだけを削除し、ファイルは残します。
- `openspec/`フォルダ：削除する前に内容を確認してください。`specs/`と`changes/archive/`は
  システムの記録であり、OpenSpec がなくても読める通常の Markdown ファイルです。
- マシンごとの状態：`~/.config/openspec/`内の設定とテレメトリ ID、`~/.local/share/openspec/`内の
  スキーマ上書きとストア登録です。Windows では`%APPDATA%\openspec`、`%LOCALAPPDATA%\openspec`です。
  登録は参照先を示すだけなので、参照されるストアリポジトリには影響しません。
