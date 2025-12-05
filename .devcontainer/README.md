# Dev Container セットアップ

このディレクトリには、OpenSpec 開発向けの VS Code Dev Container 設定が入っています。

## 含まれるもの

- **Node.js 20 LTS** (>=20.19.0) — TypeScript/JavaScript ランタイム
- **pnpm** — 高速・省ディスクなパッケージマネージャ
- **Git + GitHub CLI** — バージョン管理ツール
- **VS Code 拡張機能**:
  - ESLint & Prettier（コード品質）
  - Vitest Explorer（テスト実行）
  - GitLens（高度な Git 連携）
  - Error Lens（インラインエラー表示）
  - Code Spell Checker
  - Path IntelliSense

## 使い方

### 初回セットアップ

1. **前提ツールをインストール**（ローカル環境）
   - [VS Code](https://code.visualstudio.com/)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **コンテナーで開く**
   - VS Code でこのプロジェクトを開く
   - 「フォルダーに Dev Container 設定ファイルがあります」と通知が出たら「Reopen in Container」をクリック

   もしくは

   - コマンドパレット（`Cmd/Ctrl+Shift+P`）を開く
   - "Dev Containers: Reopen in Container" を実行

3. **セットアップを待つ**
   - 初回はイメージビルドに数分かかります
   - `postCreateCommand` で `pnpm install` が自動実行されます
   - 拡張機能も自動でインストールされます

### 日常開発

セットアップ後はコンテナーが環境を保持します:

```bash
# 開発ビルド
pnpm run dev

# CLI を開発モードで実行
pnpm run dev:cli

# テスト
pnpm test

# テストのウォッチ実行
pnpm test:watch

# ビルド
pnpm run build
```

### SSH キー

`~/.ssh` が読み取り専用でマウントされるため、GitHub/GitLab への Git 操作がシームレスに行えます。

### コンテナーの再ビルド

`.devcontainer/devcontainer.json` を変更した場合:
- コマンドパレット → "Dev Containers: Rebuild Container"

## メリット

- ローカルに Node.js や pnpm を入れなくてよい
- メンバー間で開発環境を統一できる
- 他の Node.js プロジェクトと分離
- 依存やツールがコンテナー内にまとまる
- 新メンバーのオンボーディングが簡単

## トラブルシューティング

**コンテナーがビルドできない:**
- Docker Desktop が起動しているか確認
- Docker のメモリ割り当て（推奨 4GB 以上）を確認

**拡張機能が出てこない:**
- 「Dev Containers: Rebuild Container」で再ビルド

**権限エラーが出る:**
- コンテナーは `node` ユーザー（非 root）で動作しています
- コンテナー内で作成したファイルの所有者はこのユーザーになります
