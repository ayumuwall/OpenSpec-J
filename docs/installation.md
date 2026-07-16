# インストール

## 前提条件

- **Node.js 20.19.0 以上** — バージョン確認: `node --version`

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

### bun

Bun can install OpenSpec globally, but OpenSpec currently runs on Node.js.
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

## Updating

Upgrade the package, then refresh each project's generated files:

```bash
npm install -g @ayumuwall/openspec@latest   # or pnpm/yarn/bun equivalent
openspec update                              # run inside each project
```

`openspec update` regenerates the skill and command files for the tools you've configured, so your slash commands stay current with the installed version.

<a id="uninstalling"></a>

## アンインストール

`openspec uninstall` コマンドはありません。OpenSpec はグローバルパッケージと、プロジェクト内に生成されたいくつかのファイルで構成されているだけだからです。削除は手動で数ステップ行います。ここで説明する操作がソースコードに触れることはありません。

**1. グローバルパッケージを削除します。**

```bash
npm uninstall -g @ayumuwall/openspec   # or: pnpm rm -g / yarn global remove / bun rm -g
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
