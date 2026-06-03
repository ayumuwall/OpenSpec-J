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

## 次のステップ

インストール後、プロジェクトで OpenSpec を初期化します。

```bash
cd your-project
openspec init
```

詳細は [はじめに](getting-started.md) を参照してください。
