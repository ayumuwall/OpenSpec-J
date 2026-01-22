# OpenSpec スクリプト

OpenSpec の保守・開発用ユーティリティスクリプトです。

## update-flake.sh

`flake.nix` のバージョンと依存ハッシュを自動更新します。

**使うタイミング**: 依存更新や新バージョンのリリース後。

**使い方**:
```bash
./scripts/update-flake.sh
```

**やること**:
1. `package.json` からバージョンを取得
2. `flake.nix` のバージョンを更新
3. 正しい pnpm 依存ハッシュを自動計算
4. `flake.nix` のハッシュを更新
5. ビルド成功を検証

**ワークフロー例**:
```bash
# バージョン更新と依存更新の後
pnpm install
./scripts/update-flake.sh
git add flake.nix
git commit -m "chore: update flake.nix for v0.18.0"
```

## postinstall.js

パッケージインストール後に実行されるポストインストールスクリプトです。

## pack-version-check.mjs

公開前にパッケージバージョンの整合性を検証します。
