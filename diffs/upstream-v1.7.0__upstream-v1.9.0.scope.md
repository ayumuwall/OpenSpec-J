# Scope (upstream-v1.7.0 → upstream-v1.9.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] CHANGELOG.md
- [x] README.md
- [x] docs/agent-contract.md
- [x] docs/cli.md
- [x] docs/commands.md
- [x] docs/concepts.md
- [x] docs/customization.md
- [x] docs/faq.md
- [x] docs/how-commands-work.md
- [x] docs/installation.md
- [x] docs/migration-guide.md
- [x] docs/opsx.md
- [x] docs/stores-beta/user-guide.md
- [x] docs/supported-tools.md
- [x] docs/troubleshooting.md
- [x] docs/workflows.md
- [x] docs/writing-specs.md

## schemas

- [x] schemas/spec-driven/schema.yaml
- [x] schemas/spec-driven/templates/proposal.md

## OPSX スキル

- [x] skills/openspec-apply-change/SKILL.md
- [x] skills/openspec-archive-change/SKILL.md
- [x] skills/openspec-bulk-archive-change/SKILL.md
- [x] skills/openspec-continue-change/SKILL.md
- [x] skills/openspec-explore/SKILL.md
- [x] skills/openspec-ff-change/SKILL.md
- [x] skills/openspec-new-change/SKILL.md
- [x] skills/openspec-onboard/SKILL.md
- [x] skills/openspec-propose/SKILL.md
- [x] skills/openspec-sync-specs/SKILL.md
- [x] skills/openspec-update-change/SKILL.md
- [x] skills/openspec-verify-change/SKILL.md
- [x] src/core/templates/skill-templates.ts

## artifact engine

- [x] src/core/archive.ts
- [x] src/core/artifact-graph/index.ts
- [x] src/core/artifact-graph/instruction-loader.ts
- [x] src/core/artifact-graph/outputs.ts
- [x] src/core/artifact-graph/resolver.ts
- [x] src/core/artifact-graph/types.ts
- [x] src/core/specs-apply.ts
- [x] src/core/validation/task-numbering.ts
- [x] src/core/validation/validator.ts

## コマンド生成

- [x] src/core/command-generation/adapters/command-code.ts
- [x] src/core/command-generation/adapters/index.ts
- [x] src/core/command-generation/registry.ts

## init・オンボーディング

- [x] src/core/available-tools.ts
- [x] src/core/config.ts
- [x] src/core/global-config.ts
- [x] src/core/init.ts
- [x] src/core/legacy-cleanup.ts
- [x] src/core/migration.ts
- [x] src/core/profile-sync-drift.ts
- [x] src/core/project-config.ts
- [x] src/core/root-selection.ts
- [x] src/core/shared-skill-target.ts
- [x] src/core/shared/index.ts
- [x] src/core/shared/skill-content-equivalence.ts
- [x] src/core/shared/skill-paths.ts
- [x] src/core/shared/tool-detection.ts
- [x] src/core/update.ts

## CLI

- [x] src/cli/index.ts
- [x] src/commands/change.ts
- [x] src/commands/config.ts
- [x] src/commands/schema.ts
- [x] src/commands/spec.ts
- [x] src/commands/validate.ts
- [x] src/commands/workflow/instructions.ts
- [x] src/commands/workflow/schemas.ts
- [x] src/commands/workflow/status.ts
- [x] src/commands/workflow/templates.ts
- [x] src/telemetry/index.ts

## その他

- [x] .github/dependabot.yml
- [x] .github/workflows/ci.yml
- [x] .github/workflows/release-prepare.yml
- [x] .github/workflows/security.yml
- [x] flake.nix
- [x] package.json
- [x] pnpm-lock.yaml
- [x] pnpm-workspace.yaml
- [x] src/core/change-metadata/schema.ts
- [x] src/core/change-status-policy.ts
- [x] src/core/completions/command-registry.ts
- [x] src/core/config-schema.ts
- [x] src/core/file-state.ts
- [x] src/core/github-copilot/cloud-agent.ts
- [x] src/core/parsers/requirement-blocks.ts
- [x] src/core/parsers/requirement-text.ts
- [x] src/core/parsers/spec-structure.ts
- [x] src/telemetry/config.ts
- [x] src/utils/change-metadata.ts
- [x] src/utils/ci.ts
- [x] src/utils/command-references.ts
- [x] src/utils/file-system.ts
- [x] src/utils/interactive.ts
- [x] src/utils/spec-discovery.ts
- [x] src/utils/task-progress.ts
- [x] website/components/mdx.tsx
- [x] website/components/mermaid.tsx
- [x] website/components/search.tsx
- [x] website/lib/source.ts
- [x] website/package.json
- [x] website/pnpm-lock.yaml
- [x] website/pnpm-workspace.yaml
- [x] website/source.config.ts

## 翻訳対象外

A openspec/changes/add-init-agents-target/.openspec.yaml
A openspec/changes/add-init-agents-target/proposal.md
A openspec/changes/add-init-agents-target/specs/ai-tool-paths/spec.md
A openspec/changes/add-init-agents-target/specs/cli-init/spec.md
A openspec/changes/add-init-agents-target/tasks.md
A openspec/changes/fix-schemas-root-selection/.openspec.yaml
A openspec/changes/fix-schemas-root-selection/design.md
A openspec/changes/fix-schemas-root-selection/proposal.md
A openspec/changes/fix-schemas-root-selection/specs/schema-resolution/spec.md
A openspec/changes/fix-schemas-root-selection/tasks.md
A openspec/changes/suppress-telemetry-notice-in-json/.openspec.yaml
A openspec/changes/suppress-telemetry-notice-in-json/proposal.md
A openspec/changes/suppress-telemetry-notice-in-json/specs/telemetry/spec.md
A openspec/changes/suppress-telemetry-notice-in-json/tasks.md
M openspec/specs/cli-archive/spec.md
M openspec/specs/cli-artifact-workflow/spec.md
M openspec/specs/cli-validate/spec.md
M openspec/specs/openspec-conventions/spec.md
M openspec/specs/opsx-archive-skill/spec.md
M openspec/specs/specs-sync-skill/spec.md
M test/cli-e2e/basic.test.ts
M test/cli-e2e/store-lifecycle.test.ts
A test/cli-e2e/validate-archived-tasks.test.ts
A test/cli-e2e/validate-international.test.ts
A test/cli-e2e/validate-scenario-loss.test.ts
A test/cli-e2e/validate-task-numbering.test.ts
A test/commands/apply-instructions-tasks.test.ts
M test/commands/artifact-workflow.test.ts
M test/commands/config.test.ts
M test/commands/context.test.ts
A test/commands/schema-fork-fidelity.test.ts
M test/commands/schema.test.ts
A test/commands/schemas.test.ts
M test/commands/store-root-selection.test.ts
M test/core/archive.test.ts
M test/core/artifact-graph/instruction-loader.test.ts
M test/core/artifact-graph/outputs.test.ts
M test/core/artifact-graph/resolver.test.ts
M test/core/artifact-graph/schema.test.ts
M test/core/artifact-graph/workflow.integration.test.ts
M test/core/available-tools.test.ts
A test/core/cli-is-json-run.test.ts
M test/core/command-generation/adapters.test.ts
M test/core/command-generation/registry.test.ts
M test/core/commands/change-command.show-validate.test.ts
A test/core/commands/spec-command.security.test.ts
M test/core/completions/command-registry.test.ts
M test/core/config-schema.test.ts
M test/core/file-state.test.ts
A test/core/github-copilot-cloud-agent.test.ts
M test/core/init.test.ts
M test/core/legacy-cleanup.test.ts
M test/core/list.test.ts
M test/core/migration.test.ts
M test/core/parsers/requirement-blocks.test.ts
M test/core/profile-sync-drift.test.ts
M test/core/project-config.test.ts
A test/core/shared-skill-target.test.ts
A test/core/shared/skill-content-equivalence.test.ts
A test/core/shared/skill-paths.test.ts
M test/core/shared/tool-detection.test.ts
A test/core/specs-apply.salvage.test.ts
A test/core/specs-apply.security.test.ts
A test/core/specs-apply.serialization.test.ts
A test/core/task-numbering.test.ts
A test/core/templates/apply-defer-guardrail.test.ts
M test/core/templates/explore.test.ts
M test/core/templates/propose.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/templates/update-change.test.ts
M test/core/update.test.ts
A test/core/validation.scenario-loss.test.ts
M test/core/validation.test.ts
M test/core/version-check.test.ts
M test/core/view.test.ts
A test/pnpm-workspace-config.test.ts
M test/specs/source-specs-normalization.test.ts
M test/telemetry/config.test.ts
M test/telemetry/index.test.ts
A test/utils/ci.test.ts
M test/utils/command-references.test.ts
M test/utils/interactive.test.ts
M test/utils/spec-discovery.test.ts
M test/utils/task-progress.test.ts
