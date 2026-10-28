# インストール

> `openspec` CLI のインストール、更新、アンインストール方法。

## Install

本家版は Node.js 不要の単一ファイル `openspec` としてインストールできます。以下のバイナリ導入手順は本家版向けです。日本語版は[パッケージマネージャー](#package-managers)から導入してください。

macOS / Linux のターミナルで実行します。

```bash
curl -fsSL https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/scripts/binary/install.sh | sh
```

Windows の PowerShell で実行します。

```powershell
irm https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/scripts/binary/install.ps1 | iex
```

- **保存先**：`~/.local/bin`。Windows は `%LOCALAPPDATA%\Programs\openspec` で、ユーザーの PATH にも追加します。
- **検証**：実行環境に合うファイルを選び、インストール前にリリースの `SHA256SUMS` と照合します。
- **対象リリース**：全ファイルが揃った最新リリース。公開直後のアップロード中は、直前のリリースを導入してその旨を表示します。
- **Alpine Linux**：先に `apk add libstdc++ libgcc` を実行します。
- **オプション**：保存先は `OPENSPEC_INSTALL_DIR`、バージョン固定は `OPENSPEC_VERSION=v1.15.0` で指定します。

保存先が PATH にないと表示されたら、案内に従って追加し、[インストールを確認](#check-it-worked)してください。

ワークフロー自体は、Claude Code、Cursor、または[対応ツール一覧](../reference/supported-tools.md)にある
AI コーディングツール内で実行します。

### 手動でダウンロードする

本家の各[リリース](https://github.com/Fission-AI/OpenSpec/releases/latest)には、環境ごとのファイルがあります。

| 環境 | ファイル |
|---|---|
| macOS 13+（Apple silicon / Intel） | `openspec-darwin-arm64` / `openspec-darwin-x64` |
| Linux、glibc 2.17+（arm64 / x64） | `openspec-linux-arm64` / `openspec-linux-x64` |
| Alpine 3.17+（arm64 / x64） | `openspec-linux-arm64-musl` / `openspec-linux-x64-musl` |
| Windows 10+（arm64 / x64） | `openspec-windows-arm64.exe` / `openspec-windows-x64.exe` |

`openspec`（Windows は `openspec.exe`）へ改名し、macOS / Linux では `chmod +x openspec` を実行して、PATH 上のフォルダに置きます。

> [!NOTE]
> macOS では、ブラウザーでダウンロードしたファイルは `xattr -d com.apple.quarantine openspec` を実行するまでブロックされます。上記のインストールコマンドでは不要です。

### ダウンロードを検証する

各リリースバイナリには、ビルドしたワークフロー実行の署名付き記録があります。[GitHub CLI](https://cli.github.com) を使い、ターミナルで実行します。

```bash
gh attestation verify openspec-darwin-arm64 --repo Fission-AI/OpenSpec
```

リリースのワークフローがビルドしたファイルであることを確認し、一致しなければ失敗します。任意の追加検証です。インストーラーはすべてのダウンロードで `SHA256SUMS` を確認しています。

## AI アシスタントでインストールする

AI チャットに次のプロンプトを貼り付けます。

```text
https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/install.md を取得し、その手順に従ってください。
```

またはターミナルで、CLI エージェントへパイプで渡します。次は Claude Code の例です。

```bash
curl -fsSL https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/install.md | claude
```

これは、シェルコマンドを実行できるエージェント向けのプロンプトである
[リポジトリ直下の install.md](https://github.com/ayumuwall/OpenSpec-J/blob/main/install.md)を取得します。
一部の IDE 統合では実行できません。アシスタントは次の手順を進めます。

1. CLI があればインストールを省略し、既存の導入方法での更新を案内します。npm・Homebrew 版の場合は、`openspec install` で単体実行版へ切り替えられることを一度だけ案内します。未導入の場合はインストールコマンドを示し、確認を待ってから実行します。
2. npm を選ぶ場合は Node.js が20.19.0未満なら停止します。日本語版は npm・Homebrew を使い、本家の単体実行版を希望した場合だけそちらへ切り替えます。
3. `openspec` が PATH に含まれることを確認します。
4. 対象と判断したフォルダ名と、会話中の AI ツールを候補として示します。ほかに使用するツールを確認し、そのフォルダで `openspec init` を実行します（[プロジェクトのセットアップ](setup.md)）。
5. init が作成した内容と、使用するツールで OpenSpec を呼び出す正確な表記を報告します。

権限が必要な操作の前で停止し、シェルの起動ファイルは編集しません。正式な手順は[上記のインストールコマンド](#install)と[以下のパッケージマネージャー](#package-managers)で、このプロンプトはその手順を代わりに実行します。

このインストール方法は新しく、使用するモデルによって結果が異なる場合があります。AI の誤りを
自分で修正できる場合だけ使用してください。そうでない場合は、以下の標準手順を推奨します。

<a id="package-managers"></a>

## パッケージマネージャー

Node.js パッケージとして導入するため、Node.js 20.19.0 以降が必要です（Homebrew と Nix は実行環境を含みます）。ターミナルで確認します。

```bash
node --version
```

`v20.19.0` 以降なら npm でインストールします。

```npm
npm install -g @ayumuwall/openspec@latest
```

古い場合は [nodejs.org](https://nodejs.org) またはバージョンマネージャー（nvm、fnm、asdf、volta）で新しい Node.js を導入してください。本家版なら[単体実行版](#install)も選べます。

### Homebrew

macOS / Linux では、ターミナルで次を実行します。OpenSpec-J と Node.js がインストールされます。

```bash
brew install ayumuwall/tap/openspec-j
```

formula は [ayumuwall/homebrew-tap](https://github.com/ayumuwall/homebrew-tap/blob/main/Formula/openspec-j.rb) で公開しています。上記のコマンドで tap も追加されます。

**ほかの方法から切り替える場合**：本家版の Homebrew パッケージや npm などで導入済みの CLI を、その導入方法で削除してから実行してください。CLI コマンド名は同じ `openspec` です。`which -a openspec` で PATH 上のコピーを確認できます。

### Yarn

`yarn global add`は Yarn Classic（1.x）専用です。現在の Yarn ではグローバルインストールが
廃止されているため、代わりに npm、pnpm、bun のいずれかを使用してください。グローバル CLI と
プロジェクトで同じパッケージマネージャーを使用する必要はありません。

### Bun

Bun は OpenSpec をインストールできますが、実行には Node.js が必要です。上記の
[パッケージマネージャー](#package-managers)を満たしてください。Node.js がない場合、すべてのコマンドが
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

Nix パッケージは Bash、Fish、Zsh の補完スクリプトを標準の場所
（`share/bash-completion/completions`、`share/fish/vendor_completions.d`、
`share/zsh/site-functions`）へ配置します。パッケージとともに読み込まれるため、
`openspec completion install`は不要です。

<a id="check-it-worked"></a>

## インストールを確認する

どの方法を使用した場合も、ターミナルで次を実行します。

```bash
openspec --version
```

バージョン番号が表示されれば、CLI は PATH に含まれています。インストールはマシンごとに一度だけ行います。

次に[プロジェクトをセットアップ](setup.md)します。アシスタントがすでに init を実行した場合も、
作成された内容と調整方法をリンク先のページで確認できます。

## npm 版から単体実行版へ切り替える

切り替えは任意です。npm も引き続き使えます。設定とプロジェクトは保持し、プログラムだけを変更します。

**1. 単体実行版をインストールする。** ターミナルで実行します。

```bash
openspec install
```

単体実行版を導入し、npm・Homebrew 版を削除するコマンドを表示します。

**2. 旧版を削除する。** 通常は旧版が PATH の前方にあるため、削除するまでそちらが実行されます。手順1で表示されたコマンドを実行してください。例：

```npm
npm uninstall -g @ayumuwall/openspec
```

**3. 実行されるコピーを確認する。** 新しいターミナルで実行します。

```bash
openspec version
```

`OpenSpec <version> (standalone)` と表示されれば切り替え完了です。パッケージマネージャー名が表示される場合は、`which -a openspec`（Windows は `where.exe openspec`）で PATH 上のコピーをすべて確認し、ほかのコピーを削除します。

プロジェクトの再初期化は不要です。戻す場合は単体実行ファイルを削除し、npm で再インストールします。

## 更新

Homebrew でインストールした場合は、先に CLI を更新します。

```bash
brew update
brew upgrade ayumuwall/tap/openspec-j
```

init を実行した各プロジェクトで、次のコマンドを実行します。

```bash
openspec update
```

新しい CLI が公開されている場合、[`openspec update`](../reference/cli.md#openspec-update)が通知し、
そのままインストールできます。CLI の更新はマシンごとに一度だけ必要です。実行するたびに、
自動では更新されないプロジェクトの生成済みスキルとコマンドも更新します。最新状態のプロジェクトでは
`✓ All 2 tool(s) up to date (v1.7.0)`と表示されます。

> [!WARNING]
> 単体実行版は `openspec install` で同じ場所へ更新します。`openspec update` が新版を通知します。
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

**2. CLI を削除する。** 単体実行版は `~/.local/bin/openspec` を削除します（Windows は `%LOCALAPPDATA%\Programs\openspec` と、ユーザー PATH のそのフォルダ）。npm 版はターミナルで次を実行します。

```npm
npm uninstall -g @ayumuwall/openspec
```

Homebrew では`brew uninstall openspec-j`、Deno では`deno uninstall --global openspec`、Nix では`nix profile remove openspec`を実行します。
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
  スキーマ上書き、ストア登録、単体実行版の組み込みスキーマ（`binary-schemas/`）です。Windows では`%APPDATA%\openspec`、`%LOCALAPPDATA%\openspec`です。
  登録は参照先を示すだけなので、参照されるストアリポジトリには影響しません。
