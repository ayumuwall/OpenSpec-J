# Scope (upstream-v1.4.1 → upstream-v1.6.0)

※ 進捗管理用。各項目の `- [ ]` を更新して利用する。

## docs

- [x] M CHANGELOG.md
- [x] M README.md
- [x] A docs/README.md
- [x] A docs/agent-contract.md
- [x] M docs/cli.md
- [x] M docs/commands.md
- [x] M docs/concepts.md
- [x] A docs/editing-changes.md
- [x] A docs/examples.md
- [x] A docs/existing-projects.md
- [x] A docs/explore.md
- [x] A docs/faq.md
- [x] M docs/getting-started.md
- [x] A docs/glossary.md
- [x] A docs/how-commands-work.md
- [x] M docs/installation.md
- [x] M docs/opsx.md
- [x] A docs/overview.md
- [x] A docs/reviewing-changes.md
- [x] A docs/stores-beta/user-guide.md
- [x] M docs/supported-tools.md
- [x] A docs/team-workflow.md
- [x] A docs/troubleshooting.md
- [x] M docs/workflows.md
- [x] D docs/workspaces-beta/agent-cli-playbook.md
- [x] D docs/workspaces-beta/user-guide.md
- [x] A docs/writing-specs.md

## schemas

- [x] D schemas/workspace-planning/schema.yaml
- [x] D schemas/workspace-planning/templates/design.md
- [x] D schemas/workspace-planning/templates/proposal.md
- [x] D schemas/workspace-planning/templates/spec.md
- [x] D schemas/workspace-planning/templates/tasks.md

## OPSX スキル

- [x] M src/core/templates/skill-templates.ts
- [x] M src/core/templates/workflows/apply-change.ts
- [x] M src/core/templates/workflows/archive-change.ts
- [x] M src/core/templates/workflows/bulk-archive-change.ts
- [x] M src/core/templates/workflows/continue-change.ts
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/ff-change.ts
- [x] M src/core/templates/workflows/new-change.ts
- [x] M src/core/templates/workflows/onboard.ts
- [x] M src/core/templates/workflows/propose.ts
- [x] A src/core/templates/workflows/store-selection.ts
- [x] M src/core/templates/workflows/sync-specs.ts
- [x] A src/core/templates/workflows/update-change.ts
- [x] M src/core/templates/workflows/verify-change.ts

## artifact engine

- [x] M src/core/artifact-graph/index.ts
- [x] M src/core/artifact-graph/instruction-loader.ts

## コマンド生成

- [x] M src/core/command-generation/adapters/bob.ts
- [x] M src/core/command-generation/adapters/claude.ts
- [x] M src/core/command-generation/adapters/cursor.ts
- [x] M src/core/command-generation/adapters/index.ts
- [x] A src/core/command-generation/adapters/oh-my-pi.ts
- [x] M src/core/command-generation/adapters/pi.ts
- [x] A src/core/command-generation/adapters/trae.ts
- [x] M src/core/command-generation/adapters/windsurf.ts
- [x] M src/core/command-generation/registry.ts
- [x] A src/core/command-generation/yaml.ts

## init・オンボーディング

- [x] M src/core/init.ts
- [x] A src/core/shared/allowed-tools.ts
- [x] M src/core/shared/skill-generation.ts
- [x] M src/core/shared/tool-detection.ts

## CLI

- [x] M src/cli/index.ts
- [x] M src/commands/change.ts
- [x] M src/commands/config.ts
- [x] D src/commands/context-store.ts
- [x] A src/commands/context.ts
- [x] A src/commands/doctor.ts
- [x] D src/commands/initiative.ts
- [x] A src/commands/shared-gather.ts
- [x] A src/commands/shared-output.ts
- [x] M src/commands/show.ts
- [x] M src/commands/spec.ts
- [x] A src/commands/store.ts
- [x] M src/commands/validate.ts
- [x] M src/commands/workflow/index.ts
- [x] D src/commands/workflow/initiative-link.ts
- [x] M src/commands/workflow/instructions.ts
- [x] M src/commands/workflow/new-change.ts
- [x] D src/commands/workflow/set-change.ts
- [x] M src/commands/workflow/shared.ts
- [x] M src/commands/workflow/status.ts
- [x] A src/commands/workset-input.ts
- [x] A src/commands/workset-prompts.ts
- [x] A src/commands/workset.ts
- [x] D src/commands/workspace.ts
- [x] D src/commands/workspace/context-status.ts
- [x] D src/commands/workspace/open-target-selection.ts
- [x] D src/commands/workspace/open-view.ts
- [x] D src/commands/workspace/open.ts
- [x] D src/commands/workspace/opener-selection.ts
- [x] D src/commands/workspace/operations.ts
- [x] D src/commands/workspace/prompt-theme.ts
- [x] D src/commands/workspace/registration.ts
- [x] D src/commands/workspace/selection.ts
- [x] D src/commands/workspace/setup-prompts.ts
- [x] D src/commands/workspace/types.ts

## その他

- [x] M .github/workflows/ci.yml
- [x] A .github/workflows/deploy-docs.yml
- [x] M .github/workflows/release-prepare.yml
- [x] M .gitignore
- [x] M flake.nix
- [x] D package-lock.json
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M src/core/archive.ts
- [x] M src/core/change-metadata/schema.ts
- [x] M src/core/change-status-policy.ts
- [x] D src/core/collections/index.ts
- [x] D src/core/collections/initiatives/collection.ts
- [x] D src/core/collections/initiatives/index.ts
- [x] D src/core/collections/initiatives/operations.ts
- [x] D src/core/collections/initiatives/resolution.ts
- [x] D src/core/collections/initiatives/schema.ts
- [x] D src/core/collections/initiatives/templates.ts
- [x] D src/core/collections/runtime.ts
- [x] M src/core/completions/command-registry.ts
- [x] M src/core/completions/generators/zsh-generator.ts
- [x] M src/core/completions/installers/bash-installer.ts
- [x] M src/core/completions/installers/fish-installer.ts
- [x] M src/core/completions/installers/powershell-installer.ts
- [x] M src/core/completions/installers/zsh-installer.ts
- [x] M src/core/completions/shared-flags.ts
- [x] M src/core/config-schema.ts
- [x] M src/core/config.ts
- [x] D src/core/context-store/binding.ts
- [x] D src/core/context-store/foundation.ts
- [x] D src/core/context-store/operations.ts
- [x] D src/core/context-store/registry.ts
- [x] A src/core/file-state.ts
- [x] M src/core/global-config.ts
- [x] A src/core/id.ts
- [x] M src/core/index.ts
- [x] M src/core/list.ts
- [x] A src/core/openers.ts
- [x] A src/core/openspec-root.ts
- [x] M src/core/parsers/change-parser.ts
- [x] M src/core/parsers/markdown-parser.ts
- [x] M src/core/parsers/requirement-blocks.ts
- [x] A src/core/parsers/requirement-text.ts
- [x] M src/core/planning-home.ts
- [x] M src/core/profile-sync-drift.ts
- [x] M src/core/profiles.ts
- [x] M src/core/project-config.ts
- [x] A src/core/references.ts
- [x] A src/core/relationship-health.ts
- [x] A src/core/root-selection.ts
- [x] M src/core/schemas/base.schema.ts
- [x] M src/core/specs-apply.ts
- [x] R054 src/core/store/errors.ts
- [x] A src/core/store/foundation.ts
- [x] A src/core/store/git.ts
- [x] R080 src/core/store/index.ts
- [x] A src/core/store/operations.ts
- [x] A src/core/store/registry.ts
- [x] M src/core/update.ts
- [x] M src/core/validation/validator.ts
- [x] M src/core/view.ts
- [x] A src/core/working-set.ts
- [x] A src/core/worksets.ts
- [x] D src/core/workspace/foundation.ts
- [x] D src/core/workspace/index.ts
- [x] D src/core/workspace/legacy-state.ts
- [x] D src/core/workspace/link-input.ts
- [x] D src/core/workspace/open-surface.ts
- [x] D src/core/workspace/openers.ts
- [x] D src/core/workspace/registry.ts
- [x] D src/core/workspace/skills.ts
- [x] D src/core/workspace/state-io.ts
- [x] A src/core/zod-issues.ts
- [x] M src/utils/change-metadata.ts
- [x] M src/utils/change-utils.ts
- [x] M src/utils/file-system.ts
- [x] M src/utils/task-progress.ts
- [x] M vitest.setup.ts
- [x] A website/.gitignore
- [x] A website/README.md
- [x] A website/app/(home)/layout.tsx
- [x] A website/app/(home)/page.tsx
- [x] A website/app/api/search/route.ts
- [x] A website/app/docs/[[...slug]]/page.tsx
- [x] A website/app/docs/layout.tsx
- [x] A website/app/global.css
- [x] A website/app/icon.svg
- [x] A website/app/layout.tsx
- [x] A website/app/llms-full.txt/route.ts
- [x] A website/app/llms.mdx/docs/[[...slug]]/route.ts
- [x] A website/app/llms.txt/route.ts
- [x] A website/app/og/docs/[...slug]/route.tsx
- [x] A website/app/robots.ts
- [x] A website/app/sitemap.ts
- [x] A website/components/mdx.tsx
- [x] A website/components/provider.tsx
- [x] A website/components/search.tsx
- [x] A website/docs.sync.config.mjs
- [x] A website/lib/layout.shared.tsx
- [x] A website/lib/shared.ts
- [x] A website/lib/source.ts
- [x] A website/next.config.mjs
- [x] A website/package.json
- [x] A website/pnpm-lock.yaml
- [x] A website/postcss.config.mjs
- [x] A website/scripts/sync-docs.mjs
- [x] A website/source.config.ts
- [x] A website/tsconfig.json

## 翻訳対象外

D openspec/changes/add-artifact-regeneration-support/proposal.md
A openspec/changes/add-skill-cli-auto-approval/proposal.md
A openspec/changes/add-skill-cli-auto-approval/specs/cli-init/spec.md
A openspec/changes/add-skill-cli-auto-approval/specs/command-generation/spec.md
A openspec/changes/add-skill-cli-auto-approval/tasks.md
M openspec/changes/add-tool-command-surface-capabilities/proposal.md
M openspec/changes/add-tool-command-surface-capabilities/tasks.md
R050 openspec/changes/add-update-workflow/.openspec.yaml
A openspec/changes/add-update-workflow/design.md
A openspec/changes/add-update-workflow/proposal.md
A openspec/changes/add-update-workflow/specs/opsx-update-skill/spec.md
A openspec/changes/add-update-workflow/tasks.md
A openspec/changes/feat-add-omp-tool-support/.openspec.yaml
A openspec/changes/feat-add-omp-tool-support/design.md
A openspec/changes/feat-add-omp-tool-support/proposal.md
A openspec/changes/feat-add-omp-tool-support/specs/cli-init/spec.md
A openspec/changes/feat-add-omp-tool-support/specs/cli-update/spec.md
A openspec/changes/feat-add-omp-tool-support/specs/oh-my-pi-tool/spec.md
A openspec/changes/feat-add-omp-tool-support/tasks.md
A openspec/changes/fix-spec-parser-fidelity/.openspec.yaml
A openspec/changes/fix-spec-parser-fidelity/design.md
A openspec/changes/fix-spec-parser-fidelity/proposal.md
A openspec/changes/fix-spec-parser-fidelity/specs/cli-validate/spec.md
A openspec/changes/fix-spec-parser-fidelity/tasks.md
A openspec/changes/fix-validate-view-resolution-parity/.openspec.yaml
A openspec/changes/fix-validate-view-resolution-parity/design.md
A openspec/changes/fix-validate-view-resolution-parity/proposal.md
A openspec/changes/fix-validate-view-resolution-parity/specs/cli-archive/spec.md
A openspec/changes/fix-validate-view-resolution-parity/specs/cli-validate/spec.md
A openspec/changes/fix-validate-view-resolution-parity/specs/cli-view/spec.md
A openspec/changes/fix-validate-view-resolution-parity/tasks.md
D openspec/changes/workspace-agent-guidance/proposal.md
D openspec/changes/workspace-apply-repo-slice/proposal.md
D openspec/changes/workspace-reimplementation-roadmap/HISTORICAL_DIRECTION.md
D openspec/changes/workspace-reimplementation-roadmap/POC_REFERENCE_GUIDE.md
D openspec/changes/workspace-reimplementation-roadmap/README.md
D openspec/changes/workspace-reimplementation-roadmap/START_HERE.md
D openspec/changes/workspace-reimplementation-roadmap/proposal.md
D openspec/changes/workspace-verify-and-archive/proposal.md
M openspec/initiatives/context-store-and-initiatives/README.md
M openspec/initiatives/context-store-and-initiatives/decisions.md
A openspec/initiatives/context-store-and-initiatives/direction-git-native-work.md
M openspec/initiatives/context-store-and-initiatives/direction.md
M openspec/initiatives/context-store-and-initiatives/roadmap.md
M openspec/initiatives/context-store-and-initiatives/tasks.md
M openspec/initiatives/context-store-and-initiatives/work-items/13-agent-handoff-output-and-delivery-polish/evidence.md
M openspec/initiatives/context-store-and-initiatives/work-items/13-agent-handoff-output-and-delivery-polish/plan.md
M openspec/initiatives/context-store-and-initiatives/work-items/13-agent-handoff-output-and-delivery-polish/tasks.md
M openspec/specs/artifact-graph/spec.md
M openspec/specs/change-creation/spec.md
M openspec/specs/cli-artifact-workflow/spec.md
M openspec/specs/cli-config/spec.md
M openspec/specs/cli-update/spec.md
M openspec/specs/command-generation/spec.md
M openspec/specs/openspec-conventions/spec.md
M openspec/specs/schema-resolution/spec.md
D openspec/specs/workspace-change-planning/spec.md
D openspec/specs/workspace-foundation/spec.md
D openspec/specs/workspace-links/spec.md
D openspec/specs/workspace-open/spec.md
A openspec/work/AGENTS.md
A openspec/work/README.md
A openspec/work/simplify-context-and-workspace-model/capstone/gauntlet.md
A openspec/work/simplify-context-and-workspace-model/capstone/journeys.md
A openspec/work/simplify-context-and-workspace-model/capstone/release-readiness.md
A openspec/work/simplify-context-and-workspace-model/capstone/technical-audits.md
A openspec/work/simplify-context-and-workspace-model/capstone/usability-audits.md
A openspec/work/simplify-context-and-workspace-model/goal.md
A openspec/work/simplify-context-and-workspace-model/roadmap.md
A openspec/work/simplify-context-and-workspace-model/runbook.md
A openspec/work/simplify-context-and-workspace-model/slices/assemble-working-context/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/assemble-working-context/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/declared-store-fallback/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/declared-store-fallback/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/delete-legacy-command-groups/deletion-ledger.md
A openspec/work/simplify-context-and-workspace-model/slices/delete-legacy-command-groups/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/delete-legacy-command-groups/remainder.md
A openspec/work/simplify-context-and-workspace-model/slices/delete-legacy-command-groups/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/personal-worksets/capstone-dogfood.md
A openspec/work/simplify-context-and-workspace-model/slices/personal-worksets/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/personal-worksets/research.md
A openspec/work/simplify-context-and-workspace-model/slices/personal-worksets/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/relationship-health/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/relationship-health/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/store-canonical-remote/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/store-canonical-remote/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/store-lifecycle-proof/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/store-lifecycle-proof/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/store-references/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/store-references/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/store-rename-and-guidance/dogfood-transcript.md
A openspec/work/simplify-context-and-workspace-model/slices/store-rename-and-guidance/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/store-rename-and-guidance/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/store-root-parity/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/store-root-parity/spec.md
A openspec/work/simplify-context-and-workspace-model/slices/store-root-selection/plan.md
A openspec/work/simplify-context-and-workspace-model/slices/store-root-selection/spec.md
A openspec/work/simplify-context-and-workspace-model/workset-direction.md
A test/cli-e2e/capstone-journeys.test.ts
A test/cli-e2e/store-lifecycle.test.ts
A test/cli-e2e/workset-journey.test.ts
M test/commands/artifact-workflow.test.ts
M test/commands/change-initiative-link.test.ts
M test/commands/config-profile.test.ts
M test/commands/config.test.ts
D test/commands/context-store.test.ts
A test/commands/context.test.ts
A test/commands/declared-store-fallback.test.ts
A test/commands/doctor.test.ts
D test/commands/initiative.test.ts
A test/commands/legacy-groups-removed.test.ts
A test/commands/store-git.test.ts
A test/commands/store-references.test.ts
A test/commands/store-remote.test.ts
A test/commands/store-root-selection.test.ts
A test/commands/store.test.ts
M test/commands/validate.test.ts
A test/commands/workset.test.ts
D test/commands/workspace-initiative-open.test.ts
D test/commands/workspace-open.test.ts
D test/commands/workspace.interactive.test.ts
D test/commands/workspace.test.ts
M test/core/archive.test.ts
M test/core/available-tools.test.ts
D test/core/collections/initiatives/operations.test.ts
D test/core/collections/initiatives/resolution.test.ts
D test/core/collections/initiatives/schema.test.ts
D test/core/collections/initiatives/templates.test.ts
D test/core/collections/runtime.test.ts
M test/core/command-generation/adapters.test.ts
A test/core/command-generation/yaml.test.ts
M test/core/completions/command-registry.test.ts
M test/core/completions/generators/zsh-generator.test.ts
M test/core/completions/installers/bash-installer.test.ts
M test/core/completions/installers/fish-installer.test.ts
M test/core/completions/installers/powershell-installer.test.ts
M test/core/completions/installers/zsh-installer.test.ts
M test/core/config-schema.test.ts
A test/core/file-state.test.ts
M test/core/init.test.ts
M test/core/list.test.ts
A test/core/openers.test.ts
A test/core/openspec-root.test.ts
M test/core/parsers/markdown-parser.test.ts
M test/core/planning-home.test.ts
M test/core/profiles.test.ts
M test/core/project-config.test.ts
A test/core/references.test.ts
A test/core/relationship-health.test.ts
A test/core/root-selection.test.ts
M test/core/shared/skill-generation.test.ts
M test/core/shared/tool-detection.test.ts
R052 test/core/store/foundation.test.ts
R058 test/core/store/registry.test.ts
M test/core/templates/skill-templates-parity.test.ts
A test/core/templates/update-change.test.ts
M test/core/update.test.ts
M test/core/validation.test.ts
M test/core/view.test.ts
A test/core/working-set.test.ts
A test/core/worksets.test.ts
D test/core/workspace/foundation.test.ts
D test/core/workspace/legacy-state.test.ts
D test/core/workspace/skills.test.ts
A test/helpers/fake-tool.ts
A test/helpers/fs-snapshot.ts
A test/helpers/openspec-fixtures.ts
M test/helpers/path-env.ts
M test/helpers/run-cli.ts
A test/helpers/store-git.ts
A test/helpers/temp-cleanup.ts
M test/utils/change-metadata.test.ts
M test/utils/command-references.test.ts
M test/utils/file-system.test.ts
A test/utils/task-progress.test.ts
A test/vocabulary-sweep.test.ts
