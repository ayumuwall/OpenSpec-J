# インストール

## 前提条件

- **Node.js 20.19.0 以上** — バージョン確認: `node --version`

## パッケージマネージャー

### npm

```bash
npm install -g @fission-ai/openspec@latest
```

### pnpm

```bash
pnpm add -g @fission-ai/openspec@latest
```

### yarn

```bash
yarn global add @fission-ai/openspec@latest
```

### bun

```bash
bun add -g @fission-ai/openspec@latest
```

## Nix

インストールせずに直接実行:

```bash
nix run github:Fission-AI/OpenSpec -- init
```

プロファイルにインストール:

```bash
nix profile install github:Fission-AI/OpenSpec
```

`flake.nix` に開発環境として追加:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    openspec.url = "github:Fission-AI/OpenSpec";
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

詳細は [Getting Started](getting-started.md) を参照してください。
