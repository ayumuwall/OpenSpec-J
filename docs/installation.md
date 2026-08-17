# インストール

## 前提条件

- **Node.js 20.19.0 以上** — バージョン確認: `node --version`

## AIアシスタントでインストール

手作業を避けたい場合は、以下のプロンプトをシェルコマンドを実行できるコーディングアシスタントへ貼り付けてください。Claude Code、Codex、Cursor、Gemini CLI、Copilotなどの[対応ツール](supported-tools.md)で利用できます。CLIをインストールしてプロジェクトを初期化し、実際の結果を報告します。

正しい手順は後述の手動手順です。このプロンプトは、その手順を代行するだけです。アシスタントが途中で停止して確認を求めるのは意図した動作です。権限が必要な操作は事前確認し、シェルの起動ファイルを編集しません。残りは[パッケージマネージャー](#パッケージマネージャー)と[トラブルシューティング](troubleshooting.md)を参照して手動で完了してください。

```text
このプロジェクトにOpenSpecをインストールしてセットアップしてください。以下の順序に従い、
停止するよう指示された手順では停止してください。

1. ランタイム。`node --version` を実行します。OpenSpecにはNode.js 20.19.0以上が必要です。
   Nodeがない、または古い場合はその旨を伝えて停止してください。Nodeのインストール、
   バージョン切り替え、バージョンマネージャーの再設定を代行しないでください。

2. インストール。PATH上にあるパッケージマネージャーを使い、npmを優先します。
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
   マネージャーのインストール先と、利用中のシェル・OSでそのディレクトリをPATHへ追加する
   方法を伝え、確認されるまで停止してください。インストール直後に報告されたものより古い
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

### npm

```bash
npm install -g @ayumuwall/openspec@latest
```

### pnpm

```bash
pnpm add -g @ayumuwall/openspec@latest
```

### yarn

```bash
yarn global add @ayumuwall/openspec@latest
```

Yarn 2 and later (Berry) removed the `global` command. On those versions, install OpenSpec with npm, pnpm, or bun instead — a global CLI doesn't need to share your project's package manager.

### deno

Deno では `@latest` タグの解析に問題が起こる場合があります。その場合は初回インストール時にバージョンを指定できます。
`@latest` を `@^1.3.1` のようなバージョン指定へ置き換えて試してください。

```bash
deno install --global \
  --allow-read --allow-write --allow-env --allow-sys=cpus,homedir --allow-net=edge.openspec.dev \
  npm:@ayumuwall/openspec@latest
# or
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

## 更新

パッケージをアップグレードしてから、各プロジェクトで生成済みファイルを更新します。

```bash
npm install -g @ayumuwall/openspec@latest   # pnpm/yarn/bun でも同等のコマンドを使えます
openspec update                              # 各プロジェクト内で実行します
```

`openspec update` は設定済みツール向けのスキルファイルとコマンドファイルを再生成し、インストール済みバージョンに合わせて最新化します。また、新しいCLIが公開されていないか確認し、アップグレードを提案します。新しいワークフローを利用するにはCLI自体の更新が必要です。詳しくは[CLIリファレンス](cli.md#openspec-update)を参照してください。

<a id="uninstalling"></a>

## アンインストール

`openspec uninstall` コマンドはありません。OpenSpec はグローバルパッケージと、プロジェクト内に生成されたいくつかのファイルで構成されているだけだからです。削除は手動で数ステップ行います。ここで説明する操作がソースコードに触れることはありません。

**1. グローバルパッケージを削除します。**

```bash
npm uninstall -g @ayumuwall/openspec   # または pnpm rm -g / yarn global remove / bun rm -g
```

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
