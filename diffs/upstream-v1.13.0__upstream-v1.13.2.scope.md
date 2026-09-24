# Scope (upstream-v1.13.0 → upstream-v1.13.2)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M	CHANGELOG.md
- [x] M	README.md
- [x] M	docs-lab/README.md
- [x] M	docs-lab/customize/project-config.md
- [x] M	docs-lab/customize/schemas.md
- [x] M	docs-lab/help/faq.md
- [x] M	docs-lab/reference/cli.md
- [x] M	docs-lab/reference/configuration/change-metadata.md
- [x] M	docs-lab/reference/configuration/config-json.md
- [x] M	docs-lab/reference/configuration/config-yaml.md
- [x] M	docs-lab/reference/configuration/index.md
- [x] M	docs-lab/reference/glossary.md
- [x] M	docs-lab/reference/schemas/schema-yaml.md
- [x] M	docs-lab/reference/schemas/spec-driven/index.md
- [x] M	docs-lab/reference/skills.md
- [x] M	docs-lab/reference/supported-tools.md
- [x] M	docs-lab/start/installation.md
- [x] M	docs-lab/start/quickstart.md
- [x] M	docs-lab/start/setup.md
- [x] M	docs/README.md
- [x] M	docs/agent-contract.md
- [x] M	docs/commands.md
- [x] M	docs/community.md
- [x] M	docs/concepts.md
- [x] M	docs/examples.md
- [x] M	docs/explore.md
- [x] M	docs/faq.md
- [x] M	docs/getting-started.md
- [x] M	docs/glossary.md
- [x] M	docs/opsx.md
- [x] M	docs/overview.md
- [x] M	docs/supported-tools.md
- [x] M	docs/workflows.md

## schemas

- [x] M	schemas/spec-driven/schema.yaml
- [x] M	schemas/spec-driven/templates/design.md
- [x] M	schemas/spec-driven/templates/proposal.md
- [x] M	schemas/spec-driven/templates/spec.md
- [x] M	schemas/spec-driven/templates/tasks.md

## OPSX スキル

- [x] A	src/core/templates/optional-workflow.ts
- [x] M	src/core/templates/workflows/apply-change.ts
- [x] M	src/core/templates/workflows/archive-change.ts
- [x] M	src/core/templates/workflows/bulk-archive-change.ts
- [x] M	src/core/templates/workflows/continue-change.ts
- [x] M	src/core/templates/workflows/explore.ts
- [x] M	src/core/templates/workflows/ff-change.ts
- [x] M	src/core/templates/workflows/new-change.ts
- [x] M	src/core/templates/workflows/onboard.ts
- [x] A	src/core/templates/workflows/project-root.ts
- [x] M	src/core/templates/workflows/propose.ts
- [x] M	src/core/templates/workflows/sync-specs.ts
- [x] M	src/core/templates/workflows/update-change.ts
- [x] M	src/core/templates/workflows/verify-change.ts
- [x] M	skills/openspec-apply-change/SKILL.md
- [x] M	skills/openspec-archive-change/SKILL.md
- [x] M	skills/openspec-bulk-archive-change/SKILL.md
- [x] M	skills/openspec-continue-change/SKILL.md
- [x] M	skills/openspec-explore/SKILL.md
- [x] M	skills/openspec-ff-change/SKILL.md
- [x] M	skills/openspec-new-change/SKILL.md
- [x] M	skills/openspec-onboard/SKILL.md
- [x] M	skills/openspec-propose/SKILL.md
- [x] M	skills/openspec-sync-specs/SKILL.md
- [x] M	skills/openspec-update-change/SKILL.md
- [x] M	skills/openspec-verify-change/SKILL.md

## artifact engine

- [x] M	src/core/artifact-graph/outputs.ts
- [x] M	src/core/artifact-graph/schema.ts
- [x] M	src/core/artifact-graph/types.ts

## コマンド生成

- [x] M	src/core/command-generation/adapters/continue.ts
- [x] M	src/core/command-generation/adapters/kilocode.ts
- [x] M	src/core/command-generation/generator.ts

## init・オンボーディング

- [x] M	src/core/init.ts
- [x] M	src/core/legacy-cleanup.ts
- [x] M	src/core/migration.ts
- [x] M	src/core/shared/skill-content-equivalence.ts
- [x] M	src/core/shared/skill-generation.ts
- [x] M	src/core/shared/tool-detection.ts
- [x] M	src/core/update.ts
- [x] M	src/prompts/searchable-multi-select.ts

## CLI

- [x] M	src/commands/change.ts
- [x] M	src/commands/config.ts
- [x] M	src/commands/feedback.ts
- [x] M	src/commands/schema.ts
- [x] M	src/commands/store.ts
- [x] M	src/commands/validate.ts
- [x] M	src/commands/workflow/instructions.ts
- [x] M	src/commands/workflow/new-change.ts
- [x] M	src/commands/workflow/shared.ts
- [x] M	src/commands/workflow/status.ts
- [x] M	src/core/archive.ts
- [x] M	src/core/change-status-policy.ts
- [x] M	src/core/completion-tip.ts
- [x] M	src/core/completions/installers/bash-installer.ts
- [x] A	src/core/completions/installers/shell-quote.ts
- [x] M	src/core/completions/installers/zsh-installer.ts
- [x] M	src/core/config.ts
- [x] M	src/core/global-config.ts
- [x] M	src/core/list.ts
- [x] M	src/core/parsers/change-parser.ts
- [x] M	src/core/parsers/markdown-parser.ts
- [x] M	src/core/parsers/requirement-blocks.ts
- [x] M	src/core/parsers/requirement-text.ts
- [x] M	src/core/parsers/spec-structure.ts
- [x] M	src/core/project-config.ts
- [x] M	src/core/references.ts
- [x] M	src/core/specs-apply.ts
- [x] M	src/core/store/git.ts
- [x] M	src/core/store/operations.ts
- [x] M	src/core/store/registry.ts
- [x] M	src/core/validation/purpose-placeholder.ts
- [x] A	src/core/validation/task-checkboxes.ts
- [x] M	src/core/validation/validator.ts
- [x] M	src/core/version-check.ts
- [x] M	src/core/worksets.ts
- [x] M	src/telemetry/config.ts
- [x] M	src/telemetry/index.ts
- [x] A	src/telemetry/opt-out.ts
- [x] M	src/utils/file-system.ts
- [x] A	src/utils/line-endings.ts
- [x] A	src/utils/nested-change.ts
- [x] M	src/utils/spec-discovery.ts
- [x] M	src/utils/task-progress.ts

## その他

- [x] M	.github/workflows/ci.yml
- [x] M	.github/workflows/release-prepare.yml
- [x] M	.github/workflows/security.yml
- [x] M	flake.nix
- [x] M	package.json
- [x] M	pnpm-lock.yaml
- [x] M	pnpm-workspace.yaml
- [x] M	scripts/pack-version-check.mjs

## 翻訳対象外

A	openspec/changes/add-status-next-step/.openspec.yaml
A	openspec/changes/add-status-next-step/proposal.md
A	openspec/changes/add-status-next-step/specs/cli-artifact-workflow/spec.md
A	openspec/changes/add-status-next-step/tasks.md
M	openspec/changes/add-update-workflow/design.md
M	openspec/changes/add-update-workflow/specs/opsx-update-skill/spec.md
A	openspec/changes/fix-windows-archive-claim-release/.openspec.yaml
A	openspec/changes/fix-windows-archive-claim-release/proposal.md
A	openspec/changes/fix-windows-archive-claim-release/specs/cli-archive/spec.md
A	openspec/changes/fix-windows-archive-claim-release/tasks.md
M	openspec/specs/artifact-graph/spec.md
M	openspec/specs/cli-update/spec.md
M	openspec/specs/legacy-cleanup/spec.md
M	openspec/specs/opsx-archive-skill/spec.md
M	openspec/specs/opsx-verify-skill/spec.md
M	openspec/specs/specs-sync-skill/spec.md
A	test/cli-e2e/archive-closed-requirement-heading.test.ts
A	test/cli-e2e/archive-requirement-name-near-miss.test.ts
M	test/cli-e2e/basic.test.ts
A	test/cli-e2e/validate-task-checkboxes.test.ts
M	test/commands/apply-instructions-tasks.test.ts
M	test/commands/artifact-workflow.test.ts
M	test/commands/completion.test.ts
A	test/commands/config-edit.test.ts
M	test/commands/declared-store-fallback.test.ts
M	test/commands/feedback.test.ts
A	test/commands/profile-handoffs.test.ts
A	test/commands/schema-apply-references.test.ts
M	test/commands/schema.test.ts
M	test/commands/show.test.ts
M	test/commands/status-all.test.ts
A	test/commands/store-phantom-root.test.ts
A	test/commands/store-remove-nested.test.ts
M	test/commands/store-root-selection.test.ts
A	test/commands/store-setup-no-init-git.test.ts
M	test/commands/store.test.ts
M	test/commands/validate.findings.test.ts
A	test/commands/validate.name-guard.security.test.ts
A	test/commands/workflow-instructions-injection.test.ts
M	test/commands/workset.test.ts
M	test/core/archive.test.ts
M	test/core/artifact-graph/instruction-loader.test.ts
M	test/core/artifact-graph/outputs.test.ts
A	test/core/artifact-graph/schema-apply-references.test.ts
M	test/core/artifact-graph/schema.test.ts
M	test/core/artifact-graph/state.test.ts
A	test/core/change-status-policy.test.ts
M	test/core/command-generation/adapters.test.ts
M	test/core/commands/change-command.show-validate.test.ts
A	test/core/completion-tip.atomic-write.security.test.ts
A	test/core/completions/installers/bash-installer.round-trip.test.ts
M	test/core/completions/installers/bash-installer.test.ts
M	test/core/completions/installers/zsh-installer.test.ts
A	test/core/global-config.unparseable.test.ts
M	test/core/init.test.ts
M	test/core/legacy-cleanup.test.ts
A	test/core/legacy-cleanup.user-files.test.ts
M	test/core/list.test.ts
M	test/core/migration.test.ts
A	test/core/misplaced-delta-files.test.ts
M	test/core/openers.test.ts
A	test/core/parsers/change-parser-delta-agreement.test.ts
A	test/core/parsers/closed-requirement-heading.test.ts
M	test/core/parsers/markdown-parser.test.ts
A	test/core/parsers/orphaned-requirements.test.ts
A	test/core/parsers/renamed-pair-integrity.test.ts
M	test/core/parsers/requirement-blocks.test.ts
M	test/core/purpose-placeholder.test.ts
M	test/core/references.test.ts
M	test/core/root-selection.test.ts
A	test/core/shared/generated-by-scan.security.test.ts
A	test/core/shared/profile-workflow-references.test.ts
A	test/core/specs-apply.comment-masking.security.test.ts
A	test/core/specs-apply.line-endings.test.ts
A	test/core/specs-apply.requirement-name-near-miss.test.ts
A	test/core/specs-apply.symlink-escape.security.test.ts
A	test/core/store/git-probe-limits.test.ts
A	test/core/task-checkboxes.test.ts
M	test/core/task-numbering.test.ts
A	test/core/templates/archive-task-progress.test.ts
A	test/core/templates/bulk-archive-existing-target.test.ts
M	test/core/templates/explore.test.ts
A	test/core/templates/list-json-contract.test.ts
A	test/core/templates/optional-workflow.test.ts
A	test/core/templates/profile-handoffs.test.ts
A	test/core/templates/project-root-guard.test.ts
M	test/core/templates/propose.test.ts
A	test/core/templates/schema-docs-instruction-parity.test.ts
M	test/core/templates/skill-templates-parity.test.ts
M	test/core/templates/update-change.test.ts
A	test/core/templates/verify-change-delta-operations.test.ts
A	test/core/templates/verify-change.test.ts
A	test/core/templates/workflow-verb-triggers.test.ts
A	test/core/tool-search-aliases.test.ts
A	test/core/update-skill-tamper.test.ts
M	test/core/update.test.ts
A	test/core/validation.scenario-body-parity.test.ts
M	test/core/validation.scenario-loss.test.ts
M	test/core/version-check.test.ts
M	test/core/worksets.test.ts
A	test/explore-docs-claims.test.ts
M	test/pnpm-workspace-config.test.ts
M	test/prompts/searchable-multi-select.test.ts
A	test/setup-docs-claims.test.ts
M	test/telemetry/index.test.ts
M	test/utils/command-references.test.ts
A	test/utils/line-endings.test.ts
M	test/utils/marker-updates.test.ts
A	test/utils/nested-change.test.ts
A	test/utils/path-containment.test.ts
A	test/utils/task-progress.list-markers.test.ts
M	test/utils/task-progress.test.ts
M	website/app/llms.txt/route.ts
M	website/package.json
M	website/pnpm-lock.yaml
