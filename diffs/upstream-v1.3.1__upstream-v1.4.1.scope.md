# Scope (upstream-v1.3.1 -> upstream-v1.4.1)

※ 進捗管理用。各項目の `- [x]` を更新して利用する。

## docs

- [x] M .changeset/README.md
- [x] M CHANGELOG.md
- [x] M README.md
- [x] M docs/cli.md
- [x] M docs/commands.md
- [x] M docs/concepts.md
- [x] M docs/customization.md
- [x] M docs/getting-started.md
- [x] M docs/installation.md
- [x] M docs/migration-guide.md
- [x] M docs/opsx.md
- [x] M docs/supported-tools.md
- [x] M docs/workflows.md
- [x] A docs/workspaces-beta/agent-cli-playbook.md
- [x] A docs/workspaces-beta/user-guide.md

## schemas

- [x] A schemas/workspace-planning/schema.yaml
- [x] A schemas/workspace-planning/templates/design.md
- [x] A schemas/workspace-planning/templates/proposal.md
- [x] A schemas/workspace-planning/templates/spec.md
- [x] A schemas/workspace-planning/templates/tasks.md

## OPSX スキル

なし

## artifact engine

- [x] M src/core/artifact-graph/index.ts
- [x] M src/core/artifact-graph/instruction-loader.ts
- [x] M src/core/artifact-graph/types.ts
- [x] M src/core/change-status-policy.ts
- [x] M src/core/parsers/requirement-blocks.ts
- [x] M src/core/parsers/spec-structure.ts
- [x] M src/core/specs-apply.ts
- [x] M src/core/validation/validator.ts

## コマンド生成

なし

## init・オンボーディング

- [x] M src/core/config.ts
- [x] M src/core/global-config.ts
- [x] M src/core/profiles.ts
- [x] M src/core/templates/workflows/apply-change.ts
- [x] M src/core/templates/workflows/archive-change.ts
- [x] M src/core/templates/workflows/bulk-archive-change.ts
- [x] M src/core/templates/workflows/continue-change.ts
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/ff-change.ts
- [x] M src/core/templates/workflows/new-change.ts
- [x] M src/core/templates/workflows/onboard.ts
- [x] M src/core/templates/workflows/propose.ts
- [x] M src/core/templates/workflows/sync-specs.ts
- [x] M src/core/templates/workflows/verify-change.ts
- [x] M src/core/update.ts

## CLI

- [x] M src/cli/index.ts
- [x] M src/commands/completion.ts
- [x] M src/commands/config.ts
- [x] A src/commands/context-store.ts
- [x] A src/commands/initiative.ts
- [x] M src/commands/workflow/index.ts
- [x] A src/commands/workflow/initiative-link.ts
- [x] M src/commands/workflow/instructions.ts
- [x] M src/commands/workflow/new-change.ts
- [x] A src/commands/workflow/set-change.ts
- [x] M src/commands/workflow/shared.ts
- [x] M src/commands/workflow/status.ts
- [x] A src/commands/workspace.ts
- [x] A src/commands/workspace/context-status.ts
- [x] A src/commands/workspace/open-target-selection.ts
- [x] A src/commands/workspace/open-view.ts
- [x] A src/commands/workspace/open.ts
- [x] A src/commands/workspace/opener-selection.ts
- [x] A src/commands/workspace/operations.ts
- [x] A src/commands/workspace/prompt-theme.ts
- [x] A src/commands/workspace/registration.ts
- [x] A src/commands/workspace/selection.ts
- [x] A src/commands/workspace/setup-prompts.ts
- [x] A src/commands/workspace/types.ts
- [x] M src/core/completions/command-registry.ts
- [x] M src/core/completions/completion-provider.ts
- [x] M src/core/completions/generators/bash-generator.ts
- [x] M src/core/completions/generators/fish-generator.ts
- [x] M src/core/completions/generators/powershell-generator.ts
- [x] M src/core/completions/generators/zsh-generator.ts
- [x] M src/core/completions/installers/zsh-installer.ts
- [x] A src/core/completions/shared-flags.ts
- [x] M src/core/completions/templates/bash-templates.ts
- [x] M src/core/completions/templates/fish-templates.ts
- [x] M src/core/completions/templates/powershell-templates.ts
- [x] M src/core/completions/templates/zsh-templates.ts
- [x] M src/core/completions/types.ts

## workspace / context-store / initiative

- [x] A src/core/change-metadata/index.ts
- [x] A src/core/change-metadata/schema.ts
- [x] A src/core/collections/index.ts
- [x] A src/core/collections/initiatives/collection.ts
- [x] A src/core/collections/initiatives/index.ts
- [x] A src/core/collections/initiatives/operations.ts
- [x] A src/core/collections/initiatives/resolution.ts
- [x] A src/core/collections/initiatives/schema.ts
- [x] A src/core/collections/initiatives/templates.ts
- [x] A src/core/collections/runtime.ts
- [x] A src/core/context-store/binding.ts
- [x] A src/core/context-store/errors.ts
- [x] A src/core/context-store/foundation.ts
- [x] A src/core/context-store/index.ts
- [x] A src/core/context-store/operations.ts
- [x] A src/core/context-store/registry.ts
- [x] A src/core/planning-home.ts
- [x] A src/core/workspace/foundation.ts
- [x] A src/core/workspace/index.ts
- [x] A src/core/workspace/legacy-state.ts
- [x] A src/core/workspace/link-input.ts
- [x] A src/core/workspace/open-surface.ts
- [x] A src/core/workspace/openers.ts
- [x] A src/core/workspace/registry.ts
- [x] A src/core/workspace/skills.ts
- [x] A src/core/workspace/state-io.ts
- [x] M src/utils/change-metadata.ts
- [x] M src/utils/change-utils.ts

## その他

- [x] M .github/workflows/ci.yml
- [x] M bin/openspec.js
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M src/core/index.ts

## 翻訳対象外

A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/.openspec.yaml
A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/README.md
A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/design.md
A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/proposal.md
A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/specs/ai-tool-paths/spec.md
A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/specs/cli-init/spec.md
A openspec/changes/archive/2026-04-23-add-kimi-cli-skills-only-support/tasks.md
A openspec/changes/archive/2026-05-04-workspace-foundation/design.md
A openspec/changes/archive/2026-05-04-workspace-foundation/proposal.md
A openspec/changes/archive/2026-05-04-workspace-foundation/specs/openspec-conventions/spec.md
A openspec/changes/archive/2026-05-04-workspace-foundation/specs/workspace-foundation/spec.md
A openspec/changes/archive/2026-05-04-workspace-foundation/tasks.md
A openspec/changes/archive/2026-05-06-workspace-create-and-register-repos/design.md
A openspec/changes/archive/2026-05-06-workspace-create-and-register-repos/proposal.md
A openspec/changes/archive/2026-05-06-workspace-create-and-register-repos/specs/cli-artifact-workflow/spec.md
A openspec/changes/archive/2026-05-06-workspace-create-and-register-repos/specs/workspace-foundation/spec.md
A openspec/changes/archive/2026-05-06-workspace-create-and-register-repos/specs/workspace-links/spec.md
A openspec/changes/archive/2026-05-06-workspace-create-and-register-repos/tasks.md
A openspec/changes/archive/2026-05-06-workspace-open-agent-context/design.md
A openspec/changes/archive/2026-05-06-workspace-open-agent-context/proposal.md
A openspec/changes/archive/2026-05-06-workspace-open-agent-context/specs/workspace-foundation/spec.md
A openspec/changes/archive/2026-05-06-workspace-open-agent-context/specs/workspace-open/spec.md
A openspec/changes/archive/2026-05-06-workspace-open-agent-context/tasks.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/design.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/proposal.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/artifact-graph/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/change-creation/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/cli-artifact-workflow/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/cli-config/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/cli-update/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/openspec-conventions/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/schema-resolution/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/workspace-change-planning/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/specs/workspace-links/spec.md
A openspec/changes/archive/2026-05-14-workspace-change-planning/tasks.md
A openspec/changes/workspace-agent-guidance/.openspec.yaml
A openspec/changes/workspace-agent-guidance/proposal.md
A openspec/changes/workspace-apply-repo-slice/proposal.md
A openspec/changes/workspace-reimplementation-roadmap/HISTORICAL_DIRECTION.md
A openspec/changes/workspace-reimplementation-roadmap/POC_REFERENCE_GUIDE.md
A openspec/changes/workspace-reimplementation-roadmap/README.md
A openspec/changes/workspace-reimplementation-roadmap/START_HERE.md
A openspec/changes/workspace-reimplementation-roadmap/proposal.md
A openspec/changes/workspace-verify-and-archive/proposal.md
M openspec/config.yaml
M openspec/explorations/workspace-architecture.md
A openspec/initiatives/context-store-and-initiatives/.initiative.yaml
A openspec/initiatives/context-store-and-initiatives/README.md
A openspec/initiatives/context-store-and-initiatives/decisions.md
A openspec/initiatives/context-store-and-initiatives/direction.md
A openspec/initiatives/context-store-and-initiatives/questions.md
A openspec/initiatives/context-store-and-initiatives/roadmap.md
A openspec/initiatives/context-store-and-initiatives/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/01-lock-the-direction/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/01-lock-the-direction/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/01-lock-the-direction/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/02-stabilize-workspace-as-local-view/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/02-stabilize-workspace-as-local-view/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/02-stabilize-workspace-as-local-view/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/03-add-context-store-foundation/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/03-add-context-store-foundation/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/03-add-context-store-foundation/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/04-add-collection-foundation/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/04-add-collection-foundation/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/04-add-collection-foundation/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/05-ship-initiative-mvp/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/05-ship-initiative-mvp/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/05-ship-initiative-mvp/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/06-add-minimal-context-store-ux/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/06-add-minimal-context-store-ux/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/06-add-minimal-context-store-ux/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/07-add-agent-first-initiative-discovery/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/07-add-agent-first-initiative-discovery/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/07-add-agent-first-initiative-discovery/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/08-connect-repo-local-changes-to-initiatives/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/08-connect-repo-local-changes-to-initiatives/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/08-connect-repo-local-changes-to-initiatives/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/09-add-initiative-resolve/decision-review.md
A openspec/initiatives/context-store-and-initiatives/work-items/09-add-initiative-resolve/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/09-add-initiative-resolve/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/09-add-initiative-resolve/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/10-let-workspaces-open-initiatives/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/10-let-workspaces-open-initiatives/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/11-manual-beta-reality-pass/notes.md
A openspec/initiatives/context-store-and-initiatives/work-items/11-manual-beta-reality-pass/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/11-manual-beta-reality-pass/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/12-context-store-first-run-and-cleanup-ux/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/12-context-store-first-run-and-cleanup-ux/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/12-context-store-first-run-and-cleanup-ux/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/13-agent-handoff-output-and-delivery-polish/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/13-agent-handoff-output-and-delivery-polish/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/13-agent-handoff-output-and-delivery-polish/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/14-workspaces-beta-guide-split/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/14-workspaces-beta-guide-split/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/15-context-store-project-roots-and-schema-led-initiatives/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/15-context-store-project-roots-and-schema-led-initiatives/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/15-context-store-project-roots-and-schema-led-initiatives/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/16-add-escalation-ux/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/16-add-escalation-ux/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/17-harden-team-shared-coordination/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/17-harden-team-shared-coordination/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/18-explore-initiative-hosted-target-bound-change-artifacts/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/18-explore-initiative-hosted-target-bound-change-artifacts/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/18-explore-initiative-hosted-target-bound-change-artifacts/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/19-review-workspace-beta-compatibility-before-public-release/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/19-review-workspace-beta-compatibility-before-public-release/tasks.md
A openspec/initiatives/context-store-and-initiatives/work-items/proposed-initiative-next-agent-handoff-ux/evidence.md
A openspec/initiatives/context-store-and-initiatives/work-items/proposed-initiative-next-agent-handoff-ux/plan.md
A openspec/initiatives/context-store-and-initiatives/work-items/proposed-initiative-next-agent-handoff-ux/tasks.md
M openspec/specs/ai-tool-paths/spec.md
M openspec/specs/artifact-graph/spec.md
M openspec/specs/change-creation/spec.md
M openspec/specs/cli-artifact-workflow/spec.md
M openspec/specs/cli-config/spec.md
M openspec/specs/cli-init/spec.md
M openspec/specs/cli-update/spec.md
M openspec/specs/openspec-conventions/spec.md
M openspec/specs/schema-resolution/spec.md
A openspec/specs/workspace-change-planning/spec.md
A openspec/specs/workspace-foundation/spec.md
A openspec/specs/workspace-links/spec.md
A openspec/specs/workspace-open/spec.md
A test/AGENTS.md
M test/cli-e2e/basic.test.ts
M test/commands/artifact-workflow.test.ts
A test/commands/change-initiative-link.test.ts
M test/commands/completion.test.ts
M test/commands/config-profile.test.ts
M test/commands/config.test.ts
A test/commands/context-store.test.ts
A test/commands/initiative.test.ts
A test/commands/workspace-initiative-open.test.ts
A test/commands/workspace-open.test.ts
A test/commands/workspace.interactive.test.ts
A test/commands/workspace.test.ts
M test/core/available-tools.test.ts
A test/core/collections/initiatives/operations.test.ts
A test/core/collections/initiatives/resolution.test.ts
A test/core/collections/initiatives/schema.test.ts
A test/core/collections/initiatives/templates.test.ts
A test/core/collections/runtime.test.ts
A test/core/completions/command-registry.test.ts
M test/core/completions/generators/bash-generator.test.ts
M test/core/completions/generators/fish-generator.test.ts
M test/core/completions/generators/powershell-generator.test.ts
M test/core/completions/generators/zsh-generator.test.ts
M test/core/completions/installers/zsh-installer.test.ts
A test/core/context-store/foundation.test.ts
A test/core/context-store/registry.test.ts
M test/core/global-config.test.ts
M test/core/init.test.ts
A test/core/parsers/requirement-blocks.test.ts
A test/core/planning-home.test.ts
M test/core/profile-sync-drift.test.ts
M test/core/profiles.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/update.test.ts
M test/core/validation.test.ts
A test/core/workspace/foundation.test.ts
A test/core/workspace/legacy-state.test.ts
A test/core/workspace/skills.test.ts
A test/helpers/path-env.ts
M test/utils/change-metadata.test.ts
