# Scope (upstream-v1.2.0 → upstream-v1.3.0)

※ 進捗管理用。各項目の `- [ ]` を更新して利用する。

## docs

- [x] M CHANGELOG.md
- [x] M README.md
- [x] M docs/cli.md
- [x] M docs/commands.md
- [x] M docs/concepts.md
- [x] M docs/getting-started.md
- [x] M docs/migration-guide.md
- [x] M docs/opsx.md
- [x] M docs/supported-tools.md
- [x] M docs/workflows.md

## schemas

- [ ] 該当なし

## OPSX スキル

- [x] M src/core/templates/workflows/bulk-archive-change.ts
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/onboard.ts

## artifact engine

- [ ] 該当なし

## コマンド生成

- [x] A src/core/command-generation/adapters/bob.ts
- [x] M src/core/command-generation/adapters/index.ts
- [x] A src/core/command-generation/adapters/junie.ts
- [x] A src/core/command-generation/adapters/lingma.ts
- [x] M src/core/command-generation/adapters/opencode.ts
- [x] M src/core/command-generation/adapters/pi.ts
- [x] M src/core/command-generation/registry.ts

## init・オンボーディング

- [x] M src/core/init.ts
- [x] M src/core/legacy-cleanup.ts

## CLI

- [x] M src/commands/workflow/shared.ts
- [x] M src/commands/workflow/status.ts
- [x] M src/core/available-tools.ts
- [x] M src/core/completions/installers/powershell-installer.ts
- [x] M src/core/config.ts
- [x] M src/core/update.ts

## その他

- [x] M .github/workflows/ci.yml
- [x] M .gitignore
- [x] M package-lock.json
- [x] M package.json
- [x] M scripts/postinstall.js
- [x] M scripts/test-postinstall.sh

## 翻訳対象外

A openspec/changes/fix-opencode-commands-directory/.openspec.yaml
A openspec/changes/fix-opencode-commands-directory/design.md
A openspec/changes/fix-opencode-commands-directory/proposal.md
A openspec/changes/fix-opencode-commands-directory/specs/command-generation/spec.md
A openspec/changes/fix-opencode-commands-directory/tasks.md
A openspec/changes/graceful-status-no-changes/.openspec.yaml
A openspec/changes/graceful-status-no-changes/design.md
A openspec/changes/graceful-status-no-changes/proposal.md
A openspec/changes/graceful-status-no-changes/specs/graceful-status-empty/spec.md
A openspec/changes/graceful-status-no-changes/tasks.md
M test/commands/artifact-workflow.test.ts
M test/core/available-tools.test.ts
M test/core/command-generation/adapters.test.ts
M test/core/command-generation/registry.test.ts
M test/core/completions/installers/powershell-installer.test.ts
M test/core/init.test.ts
M test/core/legacy-cleanup.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/update.test.ts
