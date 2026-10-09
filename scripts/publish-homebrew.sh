#!/usr/bin/env bash
# Run after npm publish; never publishes npm itself.
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(node -p 'JSON.parse(require("fs").readFileSync("package.json", "utf8")).version')
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo 'Homebrew updates require a stable version' >&2
  exit 1
fi
gh auth status >/dev/null
for attempt in {1..30}; do
  published=$(npm view "@ayumuwall/openspec@$version" version 2>/dev/null || true)
  latest=$(npm view @ayumuwall/openspec@latest version 2>/dev/null || true)
  if [[ "$published" == "$version" && "$latest" == "$version" ]]; then
    gh workflow run openspec-j.yml --repo ayumuwall/homebrew-tap --ref main -f "version=$version"
    echo "Homebrew verification requested for $version. Confirm completion:"
    echo 'gh run list --repo ayumuwall/homebrew-tap --workflow openspec-j.yml --limit 5'
    exit 0
  fi
  sleep 10
done
echo "npm version $version is not yet available as latest; retry this script later" >&2
exit 1
