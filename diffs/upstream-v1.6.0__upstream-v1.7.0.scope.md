# Scope (upstream-v1.6.0 → upstream-v1.7.0)

※ 進捗管理用。各項目の `- [ ]` を更新して利用する。

## docs

- [x] M CHANGELOG.md
- [x] M MAINTAINERS.md
- [x] M README.md
- [x] A SECURITY.md
- [x] M docs/README.md
- [x] M docs/agent-contract.md
- [x] M docs/cli.md
- [x] M docs/commands.md
- [x] M docs/concepts.md
- [x] M docs/customization.md
- [x] M docs/examples.md
- [x] M docs/explore.md
- [x] M docs/faq.md
- [x] M docs/getting-started.md
- [x] M docs/glossary.md
- [x] M docs/how-commands-work.md
- [x] M docs/installation.md
- [x] M docs/migration-guide.md
- [x] M docs/opsx.md
- [x] M docs/stores-beta/user-guide.md
- [x] M docs/supported-tools.md
- [x] M docs/troubleshooting.md
- [x] M docs/workflows.md
- [x] M docs/writing-specs.md

## schemas

- [x] M schemas/spec-driven/schema.yaml
- [x] M schemas/spec-driven/templates/design.md
- [x] M schemas/spec-driven/templates/proposal.md
- [x] M schemas/spec-driven/templates/spec.md

## OPSX スキル

- [x] A skills/README.md
- [x] A skills/openspec-apply-change/SKILL.md
- [x] A skills/openspec-archive-change/SKILL.md
- [x] A skills/openspec-bulk-archive-change/SKILL.md
- [x] A skills/openspec-continue-change/SKILL.md
- [x] A skills/openspec-explore/SKILL.md
- [x] A skills/openspec-ff-change/SKILL.md
- [x] A skills/openspec-new-change/SKILL.md
- [x] A skills/openspec-onboard/SKILL.md
- [x] A skills/openspec-propose/SKILL.md
- [x] A skills/openspec-sync-specs/SKILL.md
- [x] A skills/openspec-update-change/SKILL.md
- [x] A skills/openspec-verify-change/SKILL.md
- [x] M src/core/templates/workflows/apply-change.ts
- [x] M src/core/templates/workflows/archive-change.ts
- [x] M src/core/templates/workflows/bulk-archive-change.ts
- [x] M src/core/templates/workflows/continue-change.ts
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/ff-change.ts
- [x] M src/core/templates/workflows/new-change.ts
- [x] M src/core/templates/workflows/onboard.ts
- [x] M src/core/templates/workflows/propose.ts
- [x] M src/core/templates/workflows/store-selection.ts
- [x] M src/core/templates/workflows/sync-specs.ts
- [x] M src/core/templates/workflows/update-change.ts
- [x] M src/core/templates/workflows/verify-change.ts

## artifact engine

- [x] M src/core/artifact-graph/graph.ts
- [x] M src/core/artifact-graph/instruction-loader.ts
- [x] M src/core/artifact-graph/resolver.ts

## コマンド生成

- [x] M src/core/command-generation/adapters/amazon-q.ts
- [x] M src/core/command-generation/adapters/antigravity.ts
- [x] M src/core/command-generation/adapters/auggie.ts
- [x] M src/core/command-generation/adapters/bob.ts
- [x] M src/core/command-generation/adapters/claude.ts
- [x] M src/core/command-generation/adapters/codebuddy.ts
- [x] D src/core/command-generation/adapters/codex.ts
- [x] M src/core/command-generation/adapters/continue.ts
- [x] M src/core/command-generation/adapters/costrict.ts
- [x] M src/core/command-generation/adapters/crush.ts
- [x] M src/core/command-generation/adapters/cursor.ts
- [x] A src/core/command-generation/adapters/devin.ts
- [x] M src/core/command-generation/adapters/factory.ts
- [x] M src/core/command-generation/adapters/gemini.ts
- [x] M src/core/command-generation/adapters/github-copilot.ts
- [x] M src/core/command-generation/adapters/iflow.ts
- [x] M src/core/command-generation/adapters/index.ts
- [x] M src/core/command-generation/adapters/junie.ts
- [x] M src/core/command-generation/adapters/kiro.ts
- [x] M src/core/command-generation/adapters/lingma.ts
- [x] M src/core/command-generation/adapters/oh-my-pi.ts
- [x] M src/core/command-generation/adapters/opencode.ts
- [x] M src/core/command-generation/adapters/pi.ts
- [x] M src/core/command-generation/adapters/qoder.ts
- [x] M src/core/command-generation/adapters/qwen.ts
- [x] M src/core/command-generation/adapters/roocode.ts
- [x] M src/core/command-generation/adapters/trae.ts
- [x] D src/core/command-generation/adapters/windsurf.ts
- [x] A src/core/command-generation/adapters/zcode.ts
- [x] M src/core/command-generation/generator.ts
- [x] M src/core/command-generation/index.ts
- [x] A src/core/command-generation/invocation.ts
- [x] M src/core/command-generation/registry.ts
- [x] M src/core/command-generation/types.ts
- [x] M src/core/command-generation/yaml.ts

## init・オンボーディング

- [x] M src/core/init.ts
- [x] M src/core/legacy-cleanup.ts
- [x] A src/core/onboarding-commands.ts
- [x] M src/core/shared/tool-detection.ts
- [x] M src/prompts/searchable-multi-select.ts
- [x] M src/ui/welcome-screen.ts

## CLI

- [x] M src/cli/index.ts
- [x] M src/commands/change.ts
- [x] M src/commands/config.ts
- [x] M src/commands/doctor.ts
- [x] M src/commands/feedback.ts
- [x] M src/commands/schema.ts
- [x] M src/commands/show.ts
- [x] M src/commands/spec.ts
- [x] M src/commands/validate.ts
- [x] M src/commands/workflow/index.ts
- [x] M src/commands/workflow/instructions.ts
- [x] M src/commands/workflow/shared.ts
- [x] M src/commands/workflow/status.ts

## その他

- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M src/core/archive.ts
- [x] M src/core/change-metadata/schema.ts
- [x] M src/core/change-status-policy.ts
- [x] A src/core/command-surface.ts
- [x] M src/core/completions/command-registry.ts
- [x] M src/core/completions/generators/powershell-generator.ts
- [x] M src/core/completions/installers/zsh-installer.ts
- [x] M src/core/config-prompts.ts
- [x] M src/core/config-schema.ts
- [x] M src/core/config.ts
- [x] M src/core/global-config.ts
- [x] M src/core/list.ts
- [x] M src/core/migration.ts
- [x] M src/core/parsers/change-parser.ts
- [x] A src/core/parsers/code-fence.ts
- [x] M src/core/parsers/markdown-parser.ts
- [x] M src/core/parsers/requirement-blocks.ts
- [x] M src/core/parsers/requirement-text.ts
- [x] M src/core/parsers/spec-structure.ts
- [x] M src/core/profile-sync-drift.ts
- [x] M src/core/project-config.ts
- [x] M src/core/references.ts
- [x] M src/core/relationship-health.ts
- [x] M src/core/root-selection.ts
- [x] M src/core/specs-apply.ts
- [x] M src/core/store/git.ts
- [x] M src/core/update.ts
- [x] M src/core/validation/constants.ts
- [x] M src/core/validation/validator.ts
- [x] A src/core/version-check.ts
- [x] M src/core/view.ts
- [x] M src/telemetry/index.ts
- [x] M src/utils/change-metadata.ts
- [x] M src/utils/change-utils.ts
- [x] M src/utils/command-references.ts
- [x] A src/utils/date.ts
- [x] M src/utils/index.ts
- [x] M src/utils/item-discovery.ts
- [x] M src/utils/shell-detection.ts
- [x] A src/utils/spec-discovery.ts

## 翻訳対象外

A .agents/skills/release-openspec/SKILL.md
A .agents/skills/release-openspec/agents/openai.yaml
A .agents/skills/release-openspec/references/release-notes.md
M .devcontainer/devcontainer.json
A .gitattributes
M .github/CODEOWNERS
A .github/dependabot.yml
M .github/workflows/ci.yml
D .github/workflows/deploy-docs.yml
M .github/workflows/release-prepare.yml
A .github/workflows/security.yml
M .gitignore
M flake.nix
A openspec/changes/add-devin-desktop-support/.openspec.yaml
A openspec/changes/add-devin-desktop-support/proposal.md
A openspec/changes/add-devin-desktop-support/specs/ai-tool-paths/spec.md
A openspec/changes/add-devin-desktop-support/specs/cli-init/spec.md
A openspec/changes/add-devin-desktop-support/specs/cli-update/spec.md
A openspec/changes/add-devin-desktop-support/specs/command-generation/spec.md
A openspec/changes/add-devin-desktop-support/tasks.md
M openspec/changes/add-update-workflow/design.md
M openspec/changes/add-update-workflow/specs/opsx-update-skill/spec.md
A openspec/changes/archive/2026-07-28-fix-schema-init-force-validation-order/.openspec.yaml
A openspec/changes/archive/2026-07-28-fix-schema-init-force-validation-order/design.md
A openspec/changes/archive/2026-07-28-fix-schema-init-force-validation-order/proposal.md
A openspec/changes/archive/2026-07-28-fix-schema-init-force-validation-order/specs/schema-init-command/spec.md
A openspec/changes/archive/2026-07-28-fix-schema-init-force-validation-order/tasks.md
A openspec/changes/extend-config-injection-to-apply-archive/.openspec.yaml
A openspec/changes/extend-config-injection-to-apply-archive/design.md
A openspec/changes/extend-config-injection-to-apply-archive/proposal.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/cli-archive-instructions/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/cli-artifact-workflow/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/config-loading/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/context-injection/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/operation-guidance/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/opsx-apply-skill/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/opsx-archive-skill/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/opsx-bulk-archive-skill/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/specs/specs-sync-skill/spec.md
A openspec/changes/extend-config-injection-to-apply-archive/tasks.md
A openspec/changes/fix-cli-local-date-semantics/.openspec.yaml
A openspec/changes/fix-cli-local-date-semantics/design.md
A openspec/changes/fix-cli-local-date-semantics/proposal.md
A openspec/changes/fix-cli-local-date-semantics/specs/change-creation/spec.md
A openspec/changes/fix-cli-local-date-semantics/specs/cli-archive/spec.md
A openspec/changes/fix-cli-local-date-semantics/tasks.md
A openspec/changes/make-codex-skills-only/.openspec.yaml
A openspec/changes/make-codex-skills-only/design.md
A openspec/changes/make-codex-skills-only/proposal.md
A openspec/changes/make-codex-skills-only/specs/ai-tool-paths/spec.md
A openspec/changes/make-codex-skills-only/specs/cli-init/spec.md
A openspec/changes/make-codex-skills-only/specs/cli-update/spec.md
A openspec/changes/make-codex-skills-only/specs/command-generation/spec.md
A openspec/changes/make-codex-skills-only/tasks.md
M openspec/specs/ai-tool-paths/spec.md
M openspec/specs/artifact-graph/spec.md
M openspec/specs/cli-archive/spec.md
M openspec/specs/cli-artifact-workflow/spec.md
M openspec/specs/cli-feedback/spec.md
M openspec/specs/cli-init/spec.md
M openspec/specs/cli-update/spec.md
M openspec/specs/command-generation/spec.md
M openspec/specs/instruction-loader/spec.md
M openspec/specs/legacy-cleanup/spec.md
M openspec/specs/openspec-conventions/spec.md
M openspec/specs/opsx-archive-skill/spec.md
M openspec/specs/opsx-verify-skill/spec.md
M openspec/specs/schema-init-command/spec.md
M openspec/specs/specs-sync-skill/spec.md
M scripts/README.md
A scripts/generate-skillssh.mjs
A scripts/parity-hash-shared.mjs
A scripts/regen-parity-hashes.mjs
A scripts/skillssh-shared.mjs
A test/cli-e2e/view-store-resolution.test.ts
M test/commands/artifact-workflow.test.ts
M test/commands/change.interactive-show.test.ts
M test/commands/change.interactive-validate.test.ts
M test/commands/config-profile.test.ts
M test/commands/config.test.ts
M test/commands/context.test.ts
M test/commands/doctor.test.ts
M test/commands/feedback.test.ts
A test/commands/global-default-store.test.ts
M test/commands/schema.test.ts
M test/commands/show.test.ts
M test/commands/spec.interactive-show.test.ts
M test/commands/spec.interactive-validate.test.ts
M test/commands/spec.test.ts
M test/commands/store-root-selection.test.ts
M test/commands/validate.enriched-output.test.ts
M test/commands/validate.test.ts
A test/commands/workflow-instructions-skipped.test.ts
M test/core/archive.test.ts
M test/core/artifact-graph/graph.test.ts
M test/core/artifact-graph/instruction-loader.test.ts
M test/core/artifact-graph/outputs.test.ts
M test/core/artifact-graph/resolver.test.ts
M test/core/artifact-graph/state.test.ts
M test/core/artifact-graph/workflow.integration.test.ts
M test/core/available-tools.test.ts
M test/core/command-generation/adapters.test.ts
M test/core/command-generation/generator.test.ts
A test/core/command-generation/invocation.test.ts
M test/core/command-generation/registry.test.ts
M test/core/command-generation/yaml.test.ts
M test/core/commands/change-command.list.test.ts
M test/core/commands/change-command.show-validate.test.ts
M test/core/completions/command-registry.test.ts
M test/core/completions/completion-provider.test.ts
M test/core/completions/generators/powershell-generator.test.ts
M test/core/completions/installers/bash-installer.test.ts
M test/core/completions/installers/fish-installer.test.ts
M test/core/completions/installers/powershell-installer.test.ts
M test/core/completions/installers/zsh-installer.test.ts
M test/core/config-schema.test.ts
M test/core/global-config.test.ts
M test/core/init.test.ts
M test/core/legacy-cleanup.test.ts
M test/core/list.test.ts
M test/core/migration.test.ts
A test/core/onboarding-commands.test.ts
M test/core/parsers/change-parser.test.ts
M test/core/parsers/requirement-blocks.test.ts
M test/core/profile-sync-drift.test.ts
M test/core/project-config.test.ts
M test/core/references.test.ts
M test/core/relationship-health.test.ts
M test/core/root-selection.test.ts
M test/core/shared/tool-detection.test.ts
A test/core/templates/explore.test.ts
A test/core/templates/parity-hash-shared.test.ts
A test/core/templates/propose.test.ts
M test/core/templates/skill-templates-parity.test.ts
A test/core/templates/skillssh-generator-guards.test.ts
A test/core/templates/skillssh-parity.test.ts
M test/core/update.test.ts
A test/core/validation.skip-specs.test.ts
M test/core/validation.test.ts
A test/core/version-check.test.ts
M test/core/view.test.ts
M test/helpers/run-cli.ts
M test/prompts/searchable-multi-select.test.ts
M test/telemetry/config.test.ts
M test/telemetry/index.test.ts
A test/ui/welcome-screen.test.ts
M test/utils/change-metadata.test.ts
M test/utils/change-utils.test.ts
M test/utils/command-references.test.ts
M test/utils/file-system.test.ts
A test/utils/item-discovery.test.ts
M test/utils/marker-updates.test.ts
M test/utils/shell-detection.test.ts
A test/utils/spec-discovery.test.ts
M test/utils/task-progress.test.ts
M website/README.md
M website/app/(home)/page.tsx
A website/cloudflare/router/worker.js
A website/cloudflare/router/wrangler.jsonc
M website/package.json
M website/pnpm-lock.yaml
