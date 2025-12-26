# 差分分類: upstream v0.16.0 -> v0.17.2

ローカライズ作業のスコープ確認用に、変更ファイルをカテゴリ分けした一覧。

## Docs / Specs

- `CHANGELOG.md`
- `openspec/changes/archive/2025-11-06-add-shell-completions/design.md`
- `openspec/changes/archive/2025-11-06-add-shell-completions/proposal.md`
- `openspec/changes/archive/2025-11-06-add-shell-completions/specs/cli-completion/spec.md`
- `openspec/changes/archive/2025-11-06-add-shell-completions/tasks.md`
- `openspec/changes/archive/2025-12-20-add-global-config-dir/design.md`
- `openspec/changes/archive/2025-12-20-add-global-config-dir/proposal.md`
- `openspec/changes/archive/2025-12-20-add-global-config-dir/specs/global-config/spec.md`
- `openspec/changes/archive/2025-12-20-add-global-config-dir/tasks.md`
- `openspec/changes/archive/2025-12-21-add-config-command/design.md`
- `openspec/changes/archive/2025-12-21-add-config-command/proposal.md`
- `openspec/changes/archive/2025-12-21-add-config-command/specs/cli-config/spec.md`
- `openspec/changes/archive/2025-12-21-add-config-command/tasks.md`
- `openspec/specs/cli-completion/spec.md`
- `openspec/specs/cli-config/spec.md`
- `openspec/specs/global-config/spec.md`

## Templates

- 該当なし（`src/core/templates/*` と配布テンプレートに差分なし）

## CLI / Core

- `scripts/postinstall.js`
- `scripts/test-postinstall.sh`
- `src/cli/index.ts`
- `src/commands/change.ts`
- `src/commands/completion.ts`
- `src/commands/config.ts`
- `src/commands/show.ts`
- `src/commands/spec.ts`
- `src/commands/validate.ts`
- `src/core/archive.ts`
- `src/core/completions/command-registry.ts`
- `src/core/completions/completion-provider.ts`
- `src/core/completions/factory.ts`
- `src/core/completions/generators/zsh-generator.ts`
- `src/core/completions/installers/zsh-installer.ts`
- `src/core/completions/types.ts`
- `src/core/config-schema.ts`
- `src/core/global-config.ts`
- `src/core/index.ts`
- `src/utils/file-system.ts`
- `src/utils/interactive.ts`
- `src/utils/item-discovery.ts`
- `src/utils/shell-detection.ts`

## Tests

- `test/commands/completion.test.ts`
- `test/commands/config.test.ts`
- `test/commands/validate.test.ts`
- `test/core/completions/completion-provider.test.ts`
- `test/core/completions/generators/zsh-generator.test.ts`
- `test/core/completions/installers/zsh-installer.test.ts`
- `test/core/config-schema.test.ts`
- `test/core/global-config.test.ts`
- `test/utils/interactive.test.ts`
- `test/utils/shell-detection.test.ts`

## Build / Config

- `.github/workflows/ci.yml`
- `.github/workflows/release-prepare.yml`
- `eslint.config.js`
- `package.json`
- `pnpm-lock.yaml`
