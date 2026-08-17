# Scope (upstream-v1.7.0 → upstream-v1.9.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [ ] CHANGELOG.md
- [x] README.md
- [ ] docs/agent-contract.md
- [ ] docs/cli.md
- [ ] docs/commands.md
- [ ] docs/concepts.md
- [ ] docs/customization.md
- [ ] docs/faq.md
- [ ] docs/how-commands-work.md
- [ ] docs/installation.md
- [ ] docs/migration-guide.md
- [ ] docs/opsx.md
- [ ] docs/stores-beta/user-guide.md
- [ ] docs/supported-tools.md
- [ ] docs/troubleshooting.md
- [ ] docs/workflows.md
- [ ] docs/writing-specs.md

## schemas

- [x] schemas/spec-driven/schema.yaml
- [x] schemas/spec-driven/templates/proposal.md

## OPSX スキル

- [ ] skills/openspec-apply-change/SKILL.md
- [ ] skills/openspec-archive-change/SKILL.md
- [ ] skills/openspec-bulk-archive-change/SKILL.md
- [ ] skills/openspec-continue-change/SKILL.md
- [ ] skills/openspec-explore/SKILL.md
- [ ] skills/openspec-ff-change/SKILL.md
- [ ] skills/openspec-new-change/SKILL.md
- [ ] skills/openspec-onboard/SKILL.md
- [ ] skills/openspec-propose/SKILL.md
- [ ] skills/openspec-sync-specs/SKILL.md
- [ ] skills/openspec-update-change/SKILL.md
- [ ] skills/openspec-verify-change/SKILL.md
- [ ] src/core/templates/skill-templates.ts

## artifact engine

- [ ] src/core/archive.ts
- [ ] src/core/artifact-graph/index.ts
- [ ] src/core/artifact-graph/instruction-loader.ts
- [ ] src/core/artifact-graph/outputs.ts
- [ ] src/core/artifact-graph/resolver.ts
- [ ] src/core/artifact-graph/types.ts
- [ ] src/core/specs-apply.ts
- [ ] src/core/validation/task-numbering.ts
- [ ] src/core/validation/validator.ts

## コマンド生成

- [ ] src/core/command-generation/adapters/command-code.ts
- [ ] src/core/command-generation/adapters/index.ts
- [ ] src/core/command-generation/registry.ts

## init・オンボーディング

- [ ] src/core/available-tools.ts
- [ ] src/core/config.ts
- [ ] src/core/global-config.ts
- [ ] src/core/init.ts
- [ ] src/core/legacy-cleanup.ts
- [ ] src/core/migration.ts
- [ ] src/core/profile-sync-drift.ts
- [ ] src/core/project-config.ts
- [ ] src/core/root-selection.ts
- [ ] src/core/shared-skill-target.ts
- [ ] src/core/shared/index.ts
- [ ] src/core/shared/skill-content-equivalence.ts
- [ ] src/core/shared/skill-paths.ts
- [ ] src/core/shared/tool-detection.ts
- [ ] src/core/update.ts

## CLI

- [ ] src/cli/index.ts
- [ ] src/commands/change.ts
- [ ] src/commands/config.ts
- [ ] src/commands/schema.ts
- [ ] src/commands/spec.ts
- [ ] src/commands/validate.ts
- [ ] src/commands/workflow/instructions.ts
- [ ] src/commands/workflow/schemas.ts
- [ ] src/commands/workflow/status.ts
- [ ] src/commands/workflow/templates.ts
- [ ] src/telemetry/index.ts

## その他

- [ ] .github/dependabot.yml
- [ ] .github/workflows/ci.yml
- [ ] .github/workflows/release-prepare.yml
- [ ] .github/workflows/security.yml
- [ ] flake.nix
- [ ] package.json
- [ ] pnpm-lock.yaml
- [ ] pnpm-workspace.yaml
- [ ] src/core/change-metadata/schema.ts
- [ ] src/core/change-status-policy.ts
- [ ] src/core/completions/command-registry.ts
- [ ] src/core/config-schema.ts
- [ ] src/core/file-state.ts
- [ ] src/core/github-copilot/cloud-agent.ts
- [ ] src/core/parsers/requirement-blocks.ts
- [ ] src/core/parsers/requirement-text.ts
- [ ] src/core/parsers/spec-structure.ts
- [ ] src/telemetry/config.ts
- [ ] src/utils/change-metadata.ts
- [ ] src/utils/ci.ts
- [ ] src/utils/command-references.ts
- [ ] src/utils/file-system.ts
- [ ] src/utils/interactive.ts
- [ ] src/utils/spec-discovery.ts
- [ ] src/utils/task-progress.ts
- [ ] website/components/mdx.tsx
- [ ] website/components/mermaid.tsx
- [ ] website/components/search.tsx
- [ ] website/lib/source.ts
- [ ] website/package.json
- [ ] website/pnpm-lock.yaml
- [ ] website/pnpm-workspace.yaml
- [ ] website/source.config.ts

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
