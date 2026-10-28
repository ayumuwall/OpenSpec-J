# OpenSpec Scripts

Utility scripts for OpenSpec maintenance and development.

## update-flake.sh

Updates `flake.nix` pnpm dependency hash automatically.

**When to use**: After updating dependencies (`pnpm install`, `pnpm update`).

**Usage**:
```bash
./scripts/update-flake.sh
```

**What it does**:
1. Reads version from `package.json` (dynamically used by `flake.nix`)
2. Automatically determines the correct pnpm dependency hash
3. Updates the hash in `flake.nix`
4. Verifies the build succeeds

**Example workflow**:
```bash
# After dependency updates
pnpm install
./scripts/update-flake.sh
git add flake.nix
git commit -m "chore: update flake.nix dependency hash"
```

## regen-parity-hashes.mjs

Recomputes the golden hashes pinned in
`test/core/templates/skill-templates-parity.test.ts`.

**When to use**: After any intended workflow-template change, and after
rebasing a branch that edits templates — two branches touching different
templates collide on the same hash map, and hand-editing 64-character hashes
during a conflict is where transcription mistakes happen.

**Usage**:
```bash
pnpm build && pnpm regen:parity-hashes
pnpm vitest run test/core/templates/skill-templates-parity.test.ts
```

**What it does**:
1. Refuses to run if `dist/` is missing or older than `src/` — hashes come from
   the build, while the parity test reads `src/`, so regenerating against a
   stale build writes hashes the test then rejects
2. Recomputes every pinned hash from the built `dist/`
3. Rewrites the map in place and prints which entries moved
4. Exits non-zero, writing nothing, if it cannot account for every pinned hash:
   a label with no matching export (a renamed or deleted template), or a hash
   line these patterns do not recognise. Both would otherwise be left stale
   while the run reported success, so `nothing to update` always means it.

Line endings round-trip unchanged, so a CRLF checkout is safe — `test/**` has no
`text eol=lf` attribute, so the file arrives with CRLF on Windows.

The parity test recomputes the same hashes independently, so this script cannot
silently produce a wrong value. Always run the test afterwards; it, not this
script, is the authority.

The rewriting lives in `parity-hash-shared.mjs` so its guards can be exercised
against fabricated input — see `test/core/templates/parity-hash-shared.test.ts`.
A test that ran this script for real would rewrite the repository's own parity
test file mid-suite.

## pack-version-check.mjs

Validates package version consistency before publishing.

## binary/

Node.js 不要の単体実行版 `openspec` をビルドします。本家では標準の導入方法です。`.github/workflows/binaries.yml` は Linux で全配布ファイルをクロスコンパイルし、それぞれの OS・CPU で検証して、`SHA256SUMS`、`install.sh`、`install.ps1` とともに公開リリースへ添付します。

| ファイル | 用途 |
|---|---|
| `build.mjs` | `dist-bin/` へビルド（先に `pnpm build` を実行） |
| `entry.mjs` | バイナリの起点。スキーマの埋め込みと更新案内 |
| `install.sh` / `install.ps1` | 利用者向けインストーラー（macOS・Linux / Windows） |
| `smoke.sh` | バイナリ1個の簡易検証 |
| `e2e.sh` | Node の代わりにバイナリ1個で CLI の全テストを実行 |

```bash
pnpm build
bun scripts/binary/build.mjs                    # 現在の環境
bun scripts/binary/build.mjs --all              # 全配布ファイル
bash scripts/binary/smoke.sh dist-bin/openspec-<asset>
bash scripts/binary/e2e.sh dist-bin/openspec-<asset>
```
