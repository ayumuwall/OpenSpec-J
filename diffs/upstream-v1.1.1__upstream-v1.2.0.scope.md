# Scope (upstream-v1.1.1 → upstream-v1.2.0)

※ 進捗管理用。各項目の `- [ ]` を更新して利用する。

## docs

- [ ] M CHANGELOG.md
- [ ] M docs/cli.md
- [ ] M docs/commands.md
- [ ] M docs/concepts.md
- [ ] M docs/migration-guide.md
- [ ] M docs/supported-tools.md

## OPSX スキル

- [ ] M src/core/templates/skill-templates.ts
- [ ] A src/core/templates/workflows/apply-change.ts
- [ ] A src/core/templates/workflows/archive-change.ts
- [ ] A src/core/templates/workflows/bulk-archive-change.ts
- [ ] A src/core/templates/workflows/continue-change.ts
- [ ] A src/core/templates/workflows/explore.ts
- [ ] A src/core/templates/workflows/feedback.ts
- [ ] A src/core/templates/workflows/ff-change.ts
- [ ] A src/core/templates/workflows/new-change.ts
- [ ] A src/core/templates/workflows/onboard.ts
- [ ] A src/core/templates/workflows/propose.ts
- [ ] A src/core/templates/workflows/sync-specs.ts
- [ ] A src/core/templates/workflows/verify-change.ts
- [ ] M src/core/templates/index.ts
- [ ] A src/core/templates/types.ts

## コマンド生成

- [ ] M src/core/command-generation/adapters/index.ts
- [ ] A src/core/command-generation/adapters/kiro.ts
- [ ] A src/core/command-generation/adapters/pi.ts
- [ ] M src/core/command-generation/registry.ts

## init・オンボーディング

- [ ] M src/core/init.ts
- [ ] M src/core/shared/index.ts
- [ ] M src/core/shared/skill-generation.ts
- [ ] M src/core/shared/tool-detection.ts
- [ ] M src/prompts/searchable-multi-select.ts

## CLI

- [ ] M src/cli/index.ts
- [ ] M src/commands/config.ts

## その他

- [ ] M package.json
- [ ] M src/core/available-tools.ts
- [ ] M src/core/completions/command-registry.ts
- [ ] M src/core/config-schema.ts
- [ ] M src/core/config.ts
- [ ] M src/core/global-config.ts
- [ ] M src/core/legacy-cleanup.ts
- [ ] A src/core/migration.ts
- [ ] A src/core/profile-sync-drift.ts
- [ ] A src/core/profiles.ts
- [ ] M src/core/update.ts

## 翻訳対象外

A openspec/changes/add-change-stacking-awareness/...
A openspec/changes/add-global-install-scope/...
A openspec/changes/add-qa-smoke-harness/...
A openspec/changes/add-tool-command-surface-capabilities/...
R openspec/changes/archive/... (各種アーカイブ移動)
A openspec/changes/simplify-skill-installation/...
A openspec/changes/unify-template-generation-pipeline/...
M openspec/config.yaml
A openspec/explorations/explore-workflow-ux.md
A openspec/explorations/workspace-architecture.md
D openspec/project.md
A openspec/specs/...（各種 spec 追加・変更）
A package-lock.json
A test/commands/config-profile.test.ts
M test/commands/config.test.ts
M test/commands/spec.test.ts
M test/commands/validate.enriched-output.test.ts
A test/core/available-tools.test.ts
M test/core/command-generation/adapters.test.ts
M test/core/global-config.test.ts
M test/core/init.test.ts
M test/core/legacy-cleanup.test.ts
A test/core/migration.test.ts
A test/core/profile-sync-drift.test.ts
A test/core/profiles.test.ts
M test/core/shared/skill-generation.test.ts
M test/core/shared/tool-detection.test.ts
A test/core/templates/skill-templates-parity.test.ts
M test/core/update.test.ts
A test/prompts/searchable-multi-select.test.ts
A test/specs/source-specs-normalization.test.ts
M test/utils/file-system.test.ts
