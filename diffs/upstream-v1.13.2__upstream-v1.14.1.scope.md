# Scope (upstream-v1.13.2 → upstream-v1.14.1)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] A	.github/PULL_REQUEST_TEMPLATE.md
- [x] M	CHANGELOG.md
- [x] M	CONTRIBUTING.md
- [x] M	docs-lab/customize/project-config.md
- [x] M	docs-lab/customize/schemas.md
- [x] M	docs-lab/guides/review-the-plan.md
- [x] M	docs-lab/help/legacy/migration.md
- [x] M	docs-lab/multi-repo/stores.md
- [x] M	docs-lab/reference/cli.md
- [x] M	docs-lab/reference/configuration/change-metadata.md
- [x] M	docs-lab/reference/configuration/config-yaml.md
- [x] M	docs-lab/reference/schemas/spec-driven/index.md
- [x] M	docs-lab/reference/skills.md
- [x] M	docs-lab/reference/supported-tools.md
- [x] M	docs-lab/start/quickstart.md
- [x] M	docs-lab/start/setup.md
- [x] M	docs/agent-contract.md
- [x] M	docs/community.md

## schemas

- [x] M	schemas/spec-driven/schema.yaml
- [x] M	schemas/spec-driven/templates/proposal.md

## OPSX スキル

- [x] M	src/core/templates/workflows/apply-change.ts
- [x] M	src/core/templates/workflows/archive-change.ts
- [x] M	src/core/templates/workflows/bulk-archive-change.ts
- [x] M	src/core/templates/workflows/continue-change.ts
- [x] M	src/core/templates/workflows/verify-change.ts
- [x] M	skills/openspec-apply-change/SKILL.md
- [x] M	skills/openspec-archive-change/SKILL.md
- [x] M	skills/openspec-bulk-archive-change/SKILL.md
- [x] M	skills/openspec-continue-change/SKILL.md
- [x] M	skills/openspec-verify-change/SKILL.md

## artifact engine

- [x] M	src/core/artifact-graph/instruction-loader.ts

## コマンド生成

- [x] A	src/core/command-generation/adapters/atomcode.ts
- [x] A	src/core/command-generation/adapters/codestudio.ts
- [x] A	src/core/command-generation/adapters/easycode.ts
- [x] M	src/core/command-generation/adapters/gemini.ts
- [x] A	src/core/command-generation/adapters/gigacode.ts
- [x] M	src/core/command-generation/adapters/index.ts
- [x] M	src/core/command-generation/registry.ts
- [x] A	src/core/command-generation/toml.ts

## init・オンボーディング

- [x] M	src/core/config-prompts.ts
- [x] M	src/core/init.ts
- [x] M	src/core/legacy-cleanup.ts

## CLI

- [x] A	src/cli/commands/config.ts
- [x] A	src/cli/commands/context.ts
- [x] A	src/cli/commands/doctor.ts
- [x] A	src/cli/commands/schema.ts
- [x] A	src/cli/commands/spec.ts
- [x] A	src/cli/commands/store.ts
- [x] A	src/cli/commands/workset.ts
- [x] M	src/cli/index.ts
- [x] M	src/commands/config.ts
- [x] M	src/commands/context.ts
- [x] M	src/commands/doctor.ts
- [x] M	src/commands/schema.ts
- [x] M	src/commands/spec.ts
- [x] M	src/commands/store.ts
- [x] A	src/commands/workflow/default-schema.ts
- [x] M	src/commands/workflow/instructions.ts
- [x] M	src/commands/workflow/shared.ts
- [x] M	src/commands/workflow/status.ts
- [x] M	src/commands/workset.ts
- [x] M	src/core/archive.ts
- [x] M	src/core/change-metadata/schema.ts
- [x] M	src/core/change-status-policy.ts
- [x] M	src/core/command-surface.ts
- [x] M	src/core/completion-tip.ts
- [x] M	src/core/completions/command-registry.ts
- [x] M	src/core/completions/installers/zsh-installer.ts
- [x] M	src/core/config.ts
- [x] M	src/core/list.ts
- [x] M	src/core/parsers/markdown-parser.ts
- [x] M	src/core/parsers/requirement-blocks.ts
- [x] M	src/core/project-config.ts
- [x] M	src/core/references.ts
- [x] M	src/core/root-selection.ts
- [x] M	src/core/schemas/base.schema.ts
- [x] M	src/core/validation/constants.ts
- [x] M	src/core/validation/validator.ts
- [x] M	src/core/version-check.ts
- [x] M	src/core/view.ts
- [x] M	src/utils/change-metadata.ts
- [x] M	src/utils/command-references.ts
- [x] M	src/utils/index.ts

## その他

- [x] M	.github/CODEOWNERS
- [x] A	.github/ISSUE_TEMPLATE/bug_report.yml
- [x] A	.github/ISSUE_TEMPLATE/config.yml
- [x] A	.github/ISSUE_TEMPLATE/feature_request.yml
- [x] M	.github/workflows/ci.yml
- [x] M	flake.nix
- [x] M	package.json
- [x] M	pnpm-lock.yaml

## 翻訳対象外

A	openspec/changes/add-amp-support/.openspec.yaml
A	openspec/changes/add-amp-support/proposal.md
A	openspec/changes/add-amp-support/specs/ai-tool-paths/spec.md
A	openspec/changes/add-amp-support/tasks.md
A	openspec/changes/add-version-command/.openspec.yaml
A	openspec/changes/add-version-command/design.md
A	openspec/changes/add-version-command/proposal.md
A	openspec/changes/add-version-command/specs/cli-version/spec.md
A	openspec/changes/add-version-command/tasks.md
A	openspec/changes/archive/2026-07-11-add-grok-build-skills-only-support/.openspec.yaml
A	openspec/changes/archive/2026-07-11-add-grok-build-skills-only-support/design.md
A	openspec/changes/archive/2026-07-11-add-grok-build-skills-only-support/proposal.md
A	openspec/changes/archive/2026-07-11-add-grok-build-skills-only-support/specs/ai-tool-paths/spec.md
A	openspec/changes/archive/2026-07-11-add-grok-build-skills-only-support/specs/cli-init/spec.md
A	openspec/changes/archive/2026-07-11-add-grok-build-skills-only-support/tasks.md
A	openspec/changes/archive/2026-08-15-add-dsh-support/.openspec.yaml
A	openspec/changes/archive/2026-08-15-add-dsh-support/design.md
A	openspec/changes/archive/2026-08-15-add-dsh-support/proposal.md
A	openspec/changes/archive/2026-08-15-add-dsh-support/specs/ai-tool-paths/spec.md
A	openspec/changes/archive/2026-08-15-add-dsh-support/tasks.md
A	openspec/changes/rename-bob-to-ibm-bob/.openspec.yaml
A	openspec/changes/rename-bob-to-ibm-bob/proposal.md
A	openspec/changes/rename-bob-to-ibm-bob/specs/ai-tool-paths/spec.md
A	openspec/changes/rename-bob-to-ibm-bob/tasks.md
M	openspec/specs/ai-tool-paths/spec.md
M	openspec/specs/cli-artifact-workflow/spec.md
M	openspec/specs/cli-config/spec.md
M	openspec/specs/cli-init/spec.md
M	openspec/specs/cli-view/spec.md
M	openspec/specs/openspec-conventions/spec.md
M	openspec/specs/opsx-archive-skill/spec.md
A	test/apply-docs-claims.test.ts
M	test/cli-e2e/basic.test.ts
A	test/cli-e2e/startup-modules.test.ts
M	test/cli-e2e/view-store-resolution.test.ts
M	test/commands/apply-instructions-tasks.test.ts
M	test/commands/artifact-workflow.test.ts
M	test/commands/config-edit.test.ts
M	test/commands/config-profile.test.ts
M	test/commands/config.test.ts
M	test/commands/declared-store-fallback.test.ts
M	test/commands/schema-fork-fidelity.test.ts
M	test/commands/schema.test.ts
M	test/commands/spec.test.ts
A	test/commands/store-action-context.test.ts
M	test/commands/store-git.test.ts
M	test/commands/store.test.ts
M	test/commands/workset.test.ts
M	test/core/archive.test.ts
M	test/core/available-tools.test.ts
M	test/core/command-generation/adapters.test.ts
M	test/core/command-generation/invocation.test.ts
M	test/core/command-generation/registry.test.ts
M	test/core/completion-tip.test.ts
A	test/core/completions/installers/zsh-installer.round-trip.test.ts
A	test/core/config-prompts.test.ts
M	test/core/global-config.unparseable.test.ts
M	test/core/init.test.ts
M	test/core/legacy-cleanup.test.ts
M	test/core/list.test.ts
M	test/core/parsers/change-parser.test.ts
M	test/core/parsers/markdown-parser.test.ts
M	test/core/project-config.test.ts
M	test/core/shared/skill-paths.test.ts
M	test/core/shared/tool-detection.test.ts
M	test/core/templates/list-json-contract.test.ts
M	test/core/templates/propose.test.ts
A	test/core/templates/requirement-length-guidance.test.ts
M	test/core/templates/skill-templates-parity.test.ts
M	test/core/templates/verify-change.test.ts
M	test/core/update.test.ts
M	test/core/validation.test.ts
A	test/core/validation.unknown-metadata-keys.test.ts
M	test/core/version-check.test.ts
M	test/core/view.test.ts
A	test/core/warp.test.ts
A	test/helpers/record-loaded-modules.mjs
A	test/init-store-docs-claims.test.ts
M	test/setup-docs-claims.test.ts
A	test/skills-docs-claims.test.ts
M	test/update-flake-script.test.ts
M	test/utils/change-metadata.test.ts
M	test/utils/command-references.test.ts
M	website/package.json
M	website/pnpm-lock.yaml
M	website/pnpm-workspace.yaml
