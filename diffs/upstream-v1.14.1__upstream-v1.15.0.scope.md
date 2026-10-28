# Scope (upstream-v1.14.1 → upstream-v1.15.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M .devcontainer/README.md
- [x] M CHANGELOG.md
- [x] M CONTRIBUTING.md
- [x] M README.md
- [x] M docs-lab/reference/cli.md
- [x] M docs-lab/reference/configuration/change-metadata.md
- [x] M docs-lab/reference/schemas/schema-yaml.md
- [x] M docs-lab/start/installation.md
- [x] M docs/README.md
- [x] M docs/cli.md
- [x] M docs/community.md
- [x] M docs/concepts.md
- [x] M docs/customization.md
- [x] M docs/faq.md
- [x] M docs/getting-started.md
- [x] M docs/installation.md
- [x] M install.md
- [x] M scripts/README.md

## schemas


## OPSX スキル

- [x] M skills/openspec-continue-change/SKILL.md
- [x] M skills/openspec-explore/SKILL.md
- [x] M skills/openspec-ff-change/SKILL.md
- [x] M skills/openspec-propose/SKILL.md
- [x] M skills/openspec-update-change/SKILL.md
- [x] M skills/openspec-verify-change/SKILL.md
- [x] M src/core/templates/workflows/continue-change.ts
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/ff-change.ts
- [x] M src/core/templates/workflows/propose.ts
- [x] M src/core/templates/workflows/update-change.ts
- [x] M src/core/templates/workflows/verify-change.ts

## artifact engine

- [x] M src/core/artifact-graph/outputs.ts
- [x] M src/core/artifact-graph/resolver.ts

## コマンド生成


## init・オンボーディング

- [x] M src/core/legacy-cleanup.ts
- [x] M src/core/migration.ts
- [x] M src/core/shared/tool-detection.ts
- [x] M src/core/update.ts

## CLI

- [x] M src/cli/index.ts
- [x] M src/commands/change.ts
- [x] M src/commands/completion.ts
- [x] M src/commands/feedback.ts
- [x] A src/commands/install-standalone.ts
- [x] M src/commands/schema.ts
- [x] M src/commands/spec.ts
- [x] M src/commands/validate.ts
- [x] M src/commands/workflow/instructions.ts
- [x] M src/commands/workflow/new-change.ts
- [x] M src/commands/workflow/status.ts
- [x] M src/commands/workflow/templates.ts

## その他

- [x] M .agents/skills/release-openspec/SKILL.md
- [x] M .github/ISSUE_TEMPLATE/bug_report.yml
- [x] M .github/ISSUE_TEMPLATE/config.yml
- [x] A .github/ISSUE_TEMPLATE/docs.yml
- [x] M .github/ISSUE_TEMPLATE/feature_request.yml
- [x] M .github/PULL_REQUEST_TEMPLATE.md
- [x] A .github/workflows/binaries.yml
- [x] M .github/workflows/ci.yml
- [x] M .github/workflows/release-prepare.yml
- [x] M .github/workflows/security.yml
- [x] M .gitignore
- [x] M flake.nix
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M pnpm-workspace.yaml
- [x] A scripts/binary/build.mjs
- [x] A scripts/binary/e2e.sh
- [x] A scripts/binary/entry.mjs
- [x] A scripts/binary/install-check.sh
- [x] A scripts/binary/install.ps1
- [x] A scripts/binary/install.sh
- [x] A scripts/binary/smoke.sh
- [x] M src/core/archive.ts
- [x] M src/core/available-tools.ts
- [x] M src/core/completion-tip.ts
- [x] M src/core/completions/command-registry.ts
- [x] M src/core/completions/completion-provider.ts
- [x] M src/core/config-schema.ts
- [x] A src/core/file-view.ts
- [x] M src/core/github-copilot/cloud-agent.ts
- [x] M src/core/global-config.ts
- [x] M src/core/parsers/requirement-blocks.ts
- [x] M src/core/profile-sync-drift.ts
- [x] M src/core/shared-skill-target.ts
- [x] M src/core/specs-apply.ts
- [x] A src/core/standalone-tip.ts
- [x] A src/core/update-plan.ts
- [x] M src/core/validation/validator.ts
- [x] M src/core/version-check.ts
- [x] M src/utils/change-metadata.ts
- [x] A src/utils/executable-path.ts
- [x] M src/utils/file-system.ts
- [x] M src/utils/interactive.ts
- [x] M src/utils/spec-discovery.ts
- [x] A src/utils/spec-path-containment.ts

## 翻訳対象外

M openspec/changes/fix-validate-view-resolution-parity/design.md
M openspec/specs/artifact-graph/spec.md
M openspec/specs/cli-archive/spec.md
M openspec/specs/opsx-verify-skill/spec.md
M openspec/specs/schema-resolution/spec.md
M openspec/specs/telemetry/spec.md
A test/binary-installer.test.ts
M test/cli-e2e/basic.test.ts
A test/cli-e2e/spec-symlink-into-project.test.ts
M test/cli-e2e/startup-modules.test.ts
M test/cli-e2e/store-lifecycle.test.ts
A test/cli-e2e/update-dry-run.test.ts
M test/commands/feedback.test.ts
A test/commands/install-standalone.test.ts
M test/commands/schema.test.ts
M test/core/archive.test.ts
M test/core/artifact-graph/outputs.test.ts
M test/core/artifact-graph/resolver.test.ts
M test/core/cli-is-json-run.test.ts
M test/core/commands/spec-command.security.test.ts
M test/core/completions/generators/zsh-generator.test.ts
M test/core/config-schema.test.ts
A test/core/parsers/unapplied-content.test.ts
M test/core/shared-skill-target.test.ts
A test/core/specs-apply.project-linked-spec.test.ts
M test/core/specs-apply.security.test.ts
A test/core/standalone-tip.test.ts
M test/core/task-checkboxes.test.ts
A test/core/templates/glob-path-bounding.test.ts
M test/core/templates/propose.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/templates/update-change.test.ts
M test/core/templates/verify-change-delta-operations.test.ts
A test/core/update-dry-run.property.test.ts
A test/core/update-dry-run.test.ts
M test/core/validation.archive-preflight.test.ts
M test/core/validation.unknown-metadata-keys.test.ts
M test/core/version-check.test.ts
M test/explore-docs-claims.test.ts
M test/helpers/run-cli.ts
M test/pnpm-workspace-config.test.ts
M test/utils/change-metadata.test.ts
M test/utils/interactive.test.ts
M test/utils/spec-discovery.test.ts
A test/utils/spec-path-containment.test.ts
A test/website-preview.test.ts
M website/package.json
M website/pnpm-lock.yaml
M website/pnpm-workspace.yaml
A website/scripts/preview.mjs
