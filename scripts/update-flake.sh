#!/usr/bin/env bash
set -euo pipefail

# flake.nix のバージョンと依存ハッシュを更新するスクリプト
# package.json のバージョン更新後に実行する

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FLAKE_FILE="$PROJECT_ROOT/flake.nix"
PACKAGE_JSON="$PROJECT_ROOT/package.json"

# OS を判定して sed の in-place フラグを設定
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS（BSD sed）は -i に空文字が必要
  SED_INPLACE=(-i '')
else
  # Linux（GNU sed）
  SED_INPLACE=(-i)
fi

echo "==> flake.nix を更新中..."

# package.json からバージョンを取得
VERSION=$(node -p "require('$PACKAGE_JSON').version")
echo "    検出したバージョン: $VERSION"

# flake.nix のバージョンを更新
if ! grep -q "version = \"$VERSION\"" "$FLAKE_FILE"; then
  echo "    flake.nix のバージョンを更新中..."
  sed "${SED_INPLACE[@]}" "s|version = \"[^\"]*\"|version = \"$VERSION\"|" "$FLAKE_FILE"
else
  echo "    flake.nix のバージョンは最新です"
fi

# エラーを誘発するためプレースホルダーハッシュを設定
echo "    プレースホルダーハッシュを設定中..."
PLACEHOLDER="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
sed "${SED_INPLACE[@]}" "s|hash = \"sha256-[^\"]*\"|hash = \"$PLACEHOLDER\"|" "$FLAKE_FILE"

# ビルドして正しいハッシュを取得
echo "    正しいハッシュを取得するためにビルド（失敗します）..."
BUILD_OUTPUT=$(nix build 2>&1 || true)

# エラー出力から正しいハッシュを抽出（macOS/Linux 両対応）
CORRECT_HASH=$(echo "$BUILD_OUTPUT" | grep -o 'got:[[:space:]]*sha256-[A-Za-z0-9+/=]*' | head -1 | sed 's/got:[[:space:]]*//')

if [ -z "$CORRECT_HASH" ]; then
  echo "❌ エラー: ビルド出力からハッシュを抽出できませんでした"
  echo "ビルド出力:"
  echo "$BUILD_OUTPUT"
  exit 1
fi

echo "    検出したハッシュ: $CORRECT_HASH"

# flake.nix に正しいハッシュを反映
sed "${SED_INPLACE[@]}" "s|hash = \"$PLACEHOLDER\"|hash = \"$CORRECT_HASH\"|" "$FLAKE_FILE"

# ビルドが通ることを確認
echo "    ビルドを検証中..."
if nix build 2>&1 | grep -q "warning: Git tree.*is dirty"; then
  echo "⚠️  警告: Git ツリーが汚れていますがビルドは成功しました"
else
  echo "✅ ビルド成功"
fi

echo ""
echo "✅ flake.nix の更新が完了しました！"
echo "   バージョン: $VERSION"
echo "   ハッシュ: $CORRECT_HASH"
echo ""
echo "次の手順:"
echo "  1. テスト: nix run . -- --version"
echo "  2. コミット: git add flake.nix"
echo "  3. バージョン更新コミットに含める"
