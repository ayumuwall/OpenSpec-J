#!/bin/sh
# Installs the standalone `openspec` binary (no Node.js needed) on Linux or macOS.
#
#   curl -fsSL https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/scripts/binary/install.sh | sh
#
# OPENSPEC_VERSION      release to install (default: the newest complete one), e.g. v1.15.0
# OPENSPEC_INSTALL_DIR  where to put it (default: ~/.local/bin)
# OPENSPEC_INSTALL_NAME file name to install as (default: openspec)
# OPENSPEC_RELEASES_URL releases page to install from (default: GitHub's; mirrors, testing)
# OPENSPEC_DOWNLOAD_URL one folder holding the release files (mirrors, testing)
set -eu

fail() { echo "openspec install: $*" >&2; exit 1; }

# The binary and SHA256SUMS come from the same place, so a remote plain HTTP
# source could swap both: only https, or http to this machine. The host is
# parsed, not prefix-matched: http://localhost:80@evil.example/ names
# evil.example, so anything with a user part is refused.
check_source() {
  case "$2" in
    https://*) scheme=https authority=${2#https://} ;;
    http://*) scheme=http authority=${2#http://} ;;
    *) fail "$1 は https（localhost は http も可）を使用してください: $2" ;;
  esac
  authority=${authority%%/*}
  authority=${authority%%\?*}
  authority=${authority%%#*}
  case "$authority" in *@*) fail "$1 は https（localhost は http も可）を使用してください: $2" ;; esac
  [ "$scheme" = https ] && return 0
  host=$authority
  case "$authority" in
    "[::1]:"* | localhost:* | 127.0.0.1:*)
      host=${authority%:*}
      case "${authority##*:}" in "" | *[!0-9]*) fail "$1 のポートが不正です: $2" ;; esac
      ;;
  esac
  case "$host" in
    localhost | 127.0.0.1 | "[::1]") return 0 ;;
    *) fail "$1 は https（localhost は http も可）を使用してください: $2" ;;
  esac
}

# Everything runs from main, so a download cut short while piped into sh
# runs nothing instead of half a script.
main() {
  case "$(uname -s)" in
    Linux) os=linux ;;
    Darwin) os=darwin ;;
    *) fail "未対応の OS です: $(uname -s)。Windows はリリースページから openspec-windows-x64.exe をダウンロードしてください。" ;;
  esac
  case "$(uname -m)" in
    x86_64 | amd64) arch=x64 ;;
    arm64 | aarch64) arch=arm64 ;;
    *) fail "未対応の CPU です: $(uname -m)。代わりに npm で導入してください: npm install -g @ayumuwall/openspec" ;;
  esac
  # An x64 shell under Rosetta still runs on an Apple Silicon Mac.
  if [ "$os" = darwin ] && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)" = 1 ]; then
    arch=arm64
  fi
  asset="openspec-$os-$arch"
  # Alpine and other musl distros cannot run the glibc build. Ask glibc first:
  # a glibc system can have musl installed alongside, loader and all.
  if [ "$os" = linux ] && ! getconf GNU_LIBC_VERSION >/dev/null 2>&1 &&
    { ldd --version 2>&1 | grep -qi musl || ls /lib/ld-musl-* >/dev/null 2>&1; }; then
    asset="$asset-musl"
  fi

  version="${OPENSPEC_VERSION:-latest}"
  case "$version" in latest | v*) ;; *) version="v$version" ;; esac
  releases="${OPENSPEC_RELEASES_URL:-https://github.com/ayumuwall/OpenSpec-J/releases}"
  releases=${releases%/}
  check_source OPENSPEC_RELEASES_URL "$releases"
  if [ -n "${OPENSPEC_DOWNLOAD_URL:-}" ]; then
    check_source OPENSPEC_DOWNLOAD_URL "$OPENSPEC_DOWNLOAD_URL"
  fi
  if [ -n "${OPENSPEC_INSTALL_DIR:-}" ]; then
    dir="$OPENSPEC_INSTALL_DIR"
  elif [ -n "${HOME:-}" ]; then
    dir="$HOME/.local/bin"
  else
    fail "HOME が未設定です。OPENSPEC_INSTALL_DIR でインストール先を指定してください"
  fi

  # Staged inside the install dir, not /tmp: /tmp is often mounted noexec, and
  # a same-filesystem mv replaces an existing copy atomically.
  mkdir -p "$dir" || fail "$dir を作成できません"
  # Absolute, so the PATH advice below works from any directory.
  dir=$(cd "$dir" && pwd) || fail "$dir を使用できません"
  name="${OPENSPEC_INSTALL_NAME:-openspec}"
  tmp=$(mktemp -d "$dir/.openspec-install.XXXXXX") || fail "$dir に書き込めません"
  trap 'rm -rf "$tmp"' EXIT
  download() {
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL --retry 3 -o "$2" "$1"
    elif command -v wget >/dev/null 2>&1; then
      wget -q -O "$2" "$1"
    else
      fail "curl または wget が必要です"
    fi
  }
  fetch() {
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL --retry 3 "$1"
    elif command -v wget >/dev/null 2>&1; then
      wget -q -O - "$1"
    else
      fail "curl または wget が必要です"
    fi
  }

  npm_hint="または npm で導入してください（Node.js 20.19 以降）: npm install -g @ayumuwall/openspec"
  if [ -n "${OPENSPEC_DOWNLOAD_URL:-}" ]; then
    base=${OPENSPEC_DOWNLOAD_URL%/}
  elif [ "$version" != latest ]; then
    base="$releases/download/$version"
  else
    # The newest stable release whose files are all attached. GitHub calls a
    # release "latest" the moment it is published, minutes before the Binaries
    # workflow attaches the files (and for good, if that fails), so "latest"
    # is not trusted. SHA256SUMS is uploaded last: a release that has it is
    # complete.
    newest=""
    tags=$(fetch "$releases.atom" 2>/dev/null |
      grep -o '/releases/tag/v[0-9]*\.[0-9]*\.[0-9]*"' | sed 's#.*/tag/##; s/"$//' | awk '!seen[$0]++') || tags=""
    for tag in $tags; do
      [ -n "$newest" ] || newest=$tag
      if download "$releases/download/$tag/SHA256SUMS" "$tmp/SHA256SUMS" 2>/dev/null; then
        version=$tag
        break
      fi
    done
    if [ "$version" = latest ]; then
      fail "$releases に単体実行ファイルが揃ったリリースがありません。$npm_hint"
    fi
    if [ "$version" != "$newest" ]; then
      echo "$newest は準備中のため、$version をインストールします。"
    fi
    base="$releases/download/$version"
  fi

  echo "$asset ($version) をダウンロード中..."
  download "$base/$asset" "$tmp/$asset" || fail "$base/$asset をダウンロードできませんでした。$npm_hint"
  if [ ! -s "$tmp/SHA256SUMS" ]; then
    download "$base/SHA256SUMS" "$tmp/SHA256SUMS" || fail "$base/SHA256SUMS をダウンロードできませんでした。$npm_hint"
  fi

  expected=$(awk -v f="$asset" '$2 == f { print $1 }' "$tmp/SHA256SUMS")
  [ -n "$expected" ] || fail "$asset が SHA256SUMS にありません"
  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "$tmp/$asset" | awk '{ print $1 }')
  else
    actual=$(shasum -a 256 "$tmp/$asset" | awk '{ print $1 }')
  fi
  [ "$actual" = "$expected" ] || fail "$asset のチェックサムが一致しないため、インストールを中止します"

  chmod 755 "$tmp/$asset"
  if ! installed=$("$tmp/$asset" --version); then
    case "$asset" in
      *-musl) fail "$asset には C++ ランタイムが必要です（Alpine 3.17 以降）: apk add libstdc++ libgcc" ;;
      openspec-darwin-*) fail "$asset には macOS 13 以降が必要です" ;;
      *) fail "ダウンロードした $asset はこの環境で動作しません" ;;
    esac
  fi
  mv -f "$tmp/$asset" "$dir/$name"
  echo "openspec をインストールしました: $installed → $dir/$name"

  case ":$PATH:" in
    *":$dir:"*) ;;
    *) echo "実行するには PATH に $dir を追加してください。例: export PATH=\"$dir:\$PATH\"" ;;
  esac
}

main "$@"
