# インストール

## Install

本家版は Node.js 不要の単一ファイル `openspec` としてインストールできます。以下のバイナリ導入手順は本家版向けです。日本語版は[パッケージマネージャー](#パッケージマネージャー)から導入してください。

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

保存先が PATH にないと表示されたら、案内に従って追加し、[インストールを確認](#インストール確認)してください。

ワークフロー自体は、Claude Code、Cursor、または[対応ツール一覧](supported-tools.md)にある
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
> macOS では、ブラウザーでダウンロードしたファイルは `xattr -d com.apple.quarantine openspec` を実行するまでブロックされます。上記のインストールコマンドでは不要です。Windows では Explorer からの初回実行時に SmartScreen の警告が出る場合があります。

### ダウンロードを検証する

各リリースバイナリには、ビルドしたワークフロー実行の署名付き記録があります。[GitHub CLI](https://cli.github.com) を使い、ターミナルで実行します。

```bash
gh attestation verify openspec-darwin-arm64 --repo Fission-AI/OpenSpec
```

リリースのワークフローがビルドしたファイルであることを確認し、一致しなければ失敗します。任意の追加検証です。インストーラーはすべてのダウンロードで `SHA256SUMS` を確認しています。


## AIアシスタントでインストール

手作業を避けたい場合は、以下のプロンプトをシェルコマンドを実行できるコーディングアシスタントへ貼り付けてください。Claude Code、Codex、Cursor、Gemini CLI、Copilotなどの[対応ツール](supported-tools.md)で利用できます。CLIをインストールしてプロジェクトを初期化し、実際の結果を報告します。

正しい手順は後述の手動手順です。このプロンプトは、その手順を代行するだけです。アシスタントが途中で停止して確認を求めるのは意図した動作です。権限が必要な操作は事前確認し、シェルの起動ファイルを編集しません。残りは[インストール](#install)と[トラブルシューティング](troubleshooting.md)を参照して手動で完了してください。

```text
このプロジェクトにOpenSpecをインストールしてセットアップしてください。以下の順序に従い、
停止するよう指示された手順では停止してください。

1. インストール状況。先に `openspec --version` を実行します。バージョンが表示されたら、
   `openspec version --check` で既存の導入方法の更新コマンドを確認し、実行を提案して
   手順3へ進んでください。判別できなければ元の導入方法で更新します。
   パッケージマネージャー版なら `openspec install` で単体実行版へ切り替えられることを
   一度だけ案内し、依頼された場合だけ切り替えてください。独断で導入方法を変えないでください。
   未導入なら、日本語版は手順2で導入します。本家版の単体実行バイナリを希望する場合は、
   OSに応じた次のコマンドを示し、確認を得てから実行して手順3へ進んでください。
     macOS / Linux:        curl -fsSL https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/scripts/binary/install.sh | sh
     Windows (PowerShell): irm https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/scripts/binary/install.ps1 | iex
   インストーラーが失敗した場合も手順2へ進みます。

2. パッケージマネージャー（手順1で未導入の場合のみ）。`node --version` を実行します。
   Node.js 20.19.0以上が必要です。Nodeがない、または古い場合はその旨を伝えて停止し、
   Nodeのインストール、バージョン切り替え、バージョンマネージャーの再設定を代行しないでください。
   PATH上にあるパッケージマネージャーを使い、npmを優先します。
     npm install -g @ayumuwall/openspec@latest
     pnpm add -g @ayumuwall/openspec@latest
     bun add -g @ayumuwall/openspec@latest
     yarn global add @ayumuwall/openspec@latest   (Yarn 1.xのみ)
   プロジェクトのlockfileで選ばないでください。グローバルインストールは、このリポジトリの
   依存関係のインストール方法とは無関係です。4つとも利用できなければ、独自の方法を試さず
   停止して伝えてください（Nixの場合はOpenSpecインストール文書のNixセクションを案内）。
   実行する正確なコマンドを示し、確認を得てから実行してください。プロジェクト外へ
   ソフトウェアをインストールするため、別のパッケージマネージャーを使いたい場合があります。
   sudoや管理者権限が必要な場合、権限エラーになった場合、グローバルbinディレクトリが
   未設定と表示された場合は停止して再確認してください。シェルの起動ファイル
   （.bashrc、.zshrc、.profile、fish、PowerShellプロファイル）を編集したり、
   それらを編集するセットアップコマンドを実行したりしないでください。変更内容を示し、
   ユーザー自身に適用してもらいます。

3. PATH。`openspec --version` を実行します。コマンドが見つからない場合は、パッケージ
   インストール先（単体実行版は通常 ~/.local/bin）と、利用中のシェル・OSでそのディレクトリをPATHへ追加する
   方法を伝え、確認されるまで停止してください。Windowsの単体実行版はPATHを追加するため、新しいターミナルで反映されます。インストール直後に報告されたものより古い
   バージョンが表示された場合は、PATH上の古いコピーが優先されています。続行せず両方の
   バージョンを伝えてください。バージョンマネージャーを使っている場合はPATHを迂回して
   編集せず、その旨を伝えます。nvmやfnmではインストール時に有効だったNodeバージョンへ
   CLIが結び付き、asdfやvoltaではshimの再生成が必要な場合があります。

4. 初期化。使用するAIコーディングツールを尋ね、`openspec init --help` のIDへ対応付けます
   （Copilotは `github-copilot`、Zoo Codeは `roocode`）。`--tools` はカンマ区切りなので、
   すべて指定してください。`openspec init --tools <ids>` は確認なしで旧OpenSpecの残骸を
   自動削除します。ホームディレクトリの `opsx-*.md` プロンプトも対象です
   （Codexでは ~/.codex/prompts）。実行前に `.../commands/openspec/` フォルダー、
   CLAUDE.mdやAGENTS.md内のOpenSpecマーカーブロック、ホームディレクトリの
   `opsx-*.md` を探してください。見つかったものを列挙して許可を待ち、なければその旨を
   伝えて確認なしで続行します。既存の `openspec/` フォルダーは問題ありません。initは
   内容を更新しますが、仕様と変更は保持します。initはモノレポのパッケージ内を含め、
   実行場所に `openspec/` を作るため、正しいフォルダーにいることも確認してください。
   その後、openspec init --tools <ids> を実行します。

5. 報告。存在するはずのものを推測せず、initの実際の出力を伝えてください。作成した
   スキル・コマンドの数と場所、設定ファイルの行、「Setup required」の注意、
   再起動・再読み込みの対象を報告します。スキル専用ツールではコマンドファイルが0件でも
   正常です。何も生成されなかった場合は再試行せず、出力された解決策を伝えてください。
   最後にツール上でOpenSpecを呼び出す方法を伝えます。表記は要約行ではなく、initが作成した
   ファイルから取得してください。ツールによって `/opsx:propose`、`/opsx-propose`、
   Amazon Qの `@opsx-propose` のように異なります。コマンドではなくスキルを受け取る
   ツールでは、スキル名（`/openspec-propose`、Codexでは `$openspec-propose`、
   Kimi Codeでは `/skill:openspec-propose`）で呼び出します。
```

このプロンプトはベンダー固有ではなく、平易な指示とこのページに掲載したコマンドだけで構成されています。macOS、Linux、Windowsで利用でき、許可が必要な手順では独断で進めず停止します。シェルコマンドを実行できるアシスタントが必要で、一部のIDE連携では利用できません。

## パッケージマネージャー

パッケージマネージャー版には **Node.js 20.19.0 以降**が必要です（`node --version` で確認）。

### npm

```bash
npm install -g @ayumuwall/openspec@latest
```

### Homebrew

macOS / Linux では、OpenSpec-J と Node.js をインストールできます。

```bash
brew install ayumuwall/tap/openspec-j
```

更新・削除と別の導入方法からの切り替えは、[Homebrew のインストール案内](../docs-lab/start/installation.md#homebrew)を参照してください。

### pnpm

```bash
pnpm add -g @ayumuwall/openspec@latest
```

### yarn

```bash
yarn global add @ayumuwall/openspec@latest
```

Yarn 2 以降（Berry）では `global` コマンドが廃止されました。これらのバージョンでは、代わりに npm、pnpm、bun のいずれかで OpenSpec をインストールしてください。グローバル CLI とプロジェクトで同じパッケージマネージャーを使う必要はありません。

### deno

Deno では `@latest` タグの解析に問題が起こる場合があります。その場合は初回インストール時にバージョンを指定できます。
`@latest` を `@^1.3.1` のようなバージョン指定へ置き換えて試してください。

```bash
deno install --global \
  --allow-read --allow-write --allow-env --allow-sys=cpus,homedir --allow-net=edge.openspec.dev \
  npm:@ayumuwall/openspec@latest
# または
deno install --global \
  --allow-read --allow-write --allow-env --allow-sys=cpus,homedir --allow-net=edge.openspec.dev \
  npm:@ayumuwall/openspec@^1.3.1
```

注: config edit、feedback、workspace open のようにサブコマンドが外部ツールを起動する場合は、対象を限定した `--allow-run=<program>` が必要になることがあります。

### bun

Bun で OpenSpec をグローバルインストールできますが、OpenSpec の実行には現在 Node.js が必要です。
`PATH` 上で Node.js 20.19.0 以上を利用できる必要があります。

```bash
bun add -g @ayumuwall/openspec@latest
```

## Nix

インストールせずに直接実行します:

```bash
nix run github:ayumuwall/OpenSpec-J -- init
```

プロファイルにインストールします:

```bash
nix profile install github:ayumuwall/OpenSpec-J
```

`flake.nix` に開発環境として追加します:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    openspec.url = "github:ayumuwall/OpenSpec-J";
  };

  outputs = { nixpkgs, openspec, ... }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [ openspec.packages.x86_64-linux.default ];
    };
  };
}
```

## インストール確認

```bash
openspec --version
```

## npm 版から単体実行版へ切り替える

設定とプロジェクトは保持し、プログラムだけを変更します。

1. `openspec install` を実行します。単体実行版を導入し、旧版を削除するコマンドを表示します。
2. 表示されたコマンドを実行します。例は `npm uninstall -g @ayumuwall/openspec`（Homebrew は `brew uninstall openspec-j`）。削除するまでは、PATH の前方にある旧版が実行されます。
3. 新しいターミナルで `openspec version` を実行し、`OpenSpec <version> (standalone)` を確認します。パッケージマネージャー名が出る場合は、`which -a openspec`（Windows は `where.exe openspec`）で他のコピーを確認してください。

## 更新

単体実行版は [インストールコマンド](#install)を再実行して CLI を更新します。パッケージマネージャー版は `npm install -g @ayumuwall/openspec@latest` か、pnpm・yarn・bun の同等のコマンドを使います。その後、各プロジェクトの生成済みファイルを更新します。

```bash
openspec update   # 各プロジェクト内で実行します
```

`openspec update` は設定済みツール向けのスキルファイルとコマンドファイルを再生成し、インストール済みバージョンに合わせて最新化します。また、新しいCLIが公開されていないか確認し、アップグレードを提案します。新しいワークフローを利用するにはCLI自体の更新が必要です。詳しくは[CLIリファレンス](cli.md#openspec-update)を参照してください。

<a id="uninstalling"></a>

## アンインストール

`openspec uninstall` コマンドはありません。OpenSpec はプログラムと、プロジェクト内のファイルで構成されています。削除は手動で行い、ソースコードには触れません。

**1. CLI を削除する。** 単体実行版は `~/.local/bin/openspec`、Windows は `%LOCALAPPDATA%\Programs\openspec\openspec.exe` とユーザー PATH のそのフォルダを削除します。パッケージマネージャー版は次を実行します。

```bash
npm uninstall -g @ayumuwall/openspec   # または pnpm rm -g / yarn global remove / bun rm -g
```

単体実行版は、書き込み可能な場合、組み込みスキーマをデータディレクトリへ保存します。macOS / Linux は `~/.local/share/openspec/binary-schemas`、Windows は `%LOCALAPPDATA%\openspec\binary-schemas` です。これも削除できます。

**2. プロジェクトから OpenSpec を削除します（任意）。** 仕様と変更が不要であれば、`openspec/` ディレクトリを削除します。

```bash
rm -rf openspec/
```

この操作の前に確認してください。`openspec/specs/` と `openspec/changes/archive/` は、システムがどう振る舞い、なぜ変わったかの記録です。その履歴が必要になる可能性があるなら、アンインストール後もフォルダーを残すか、Git に残してください。

**3. 生成された AI ツール用ファイルを削除します（任意）。** OpenSpec は `.claude/skills/openspec-*/` や `.cursor/commands/opsx-*` など、ツールごとのディレクトリにスキルファイルやコマンドファイルを書き込みます。設定したツールに対応する `openspec-*` スキルと `opsx-*` コマンドを削除してください。ツールごとの正確なパスは [サポートされているツール](supported-tools.md) にあります。

`CLAUDE.md` や `AGENTS.md` などに OpenSpec のマーカーブロックが残っている場合は、そのブロックだけ手動で削除してください。それらのファイル内のあなた自身の内容は、そのまま残して構いません。

## 次のステップ

インストール後、プロジェクトで OpenSpec を初期化します。

```bash
cd your-project
openspec init
```

詳細は [はじめに](getting-started.md) を参照してください。
