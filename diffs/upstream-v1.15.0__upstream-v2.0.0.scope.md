# Scope (upstream-v1.15.0 → upstream-v2.0.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M CHANGELOG.md
- [x] M README.md
- [x] M docs-lab/README.md
- [x] M docs-lab/customize/overview.md
- [x] M docs-lab/customize/profiles.md
- [x] M docs-lab/customize/schemas.md
- [x] M docs-lab/help/faq.md
- [x] A docs-lab/help/upgrade-to-2.md
- [x] M docs-lab/message-map.md
- [x] M docs-lab/multi-repo/stores.md
- [x] M docs-lab/reference/cli.md
- [x] M docs-lab/reference/configuration/config-json.md
- [x] M docs-lab/reference/configuration/config-yaml.md
- [x] M docs-lab/reference/glossary.md
- [x] M docs-lab/reference/schemas/schema-yaml.md
- [x] M docs-lab/reference/schemas/spec-driven/index.md
- [x] M docs-lab/reference/skills.md
- [x] M docs-lab/reference/supported-tools.md
- [x] M docs-lab/start/installation.md
- [x] M docs-lab/start/setup.md
- [x] M docs/customization.md
- [x] M docs/installation.md
- [x] M docs/troubleshooting.md

## schemas

- [x] M schemas/spec-driven/schema.yaml

## OPSX スキル

- [x] M skills/openspec-apply-change/SKILL.md
- [x] M skills/openspec-archive-change/SKILL.md
- [x] M skills/openspec-bulk-archive-change/SKILL.md
- [x] M skills/openspec-continue-change/SKILL.md
- [x] M skills/openspec-explore/SKILL.md
- [x] M skills/openspec-ff-change/SKILL.md
- [x] M skills/openspec-new-change/SKILL.md
- [x] M skills/openspec-onboard/SKILL.md
- [x] M skills/openspec-propose/SKILL.md
- [x] M skills/openspec-sync-specs/SKILL.md
- [x] M skills/openspec-update-change/SKILL.md
- [x] M skills/openspec-verify-change/SKILL.md
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/ff-change.ts
- [x] M src/core/templates/workflows/new-change.ts
- [x] M src/core/templates/workflows/onboard.ts
- [x] M src/core/templates/workflows/project-root.ts
- [x] M src/core/templates/workflows/propose.ts
- [x] M src/core/templates/workflows/update-change.ts

## init・オンボーディング

- [x] M src/core/available-tools.ts
- [x] M src/core/init.ts
- [x] M src/core/legacy-cleanup.ts
- [x] M src/core/migration.ts
- [x] M src/core/profile-sync-drift.ts
- [x] A src/core/released-output-sweep.ts
- [x] A src/core/retired-tools.ts
- [x] M src/core/shared-skill-target.ts
- [x] A src/core/shared/command-reconcile.ts
- [x] A src/core/shared/generated-fingerprint.ts
- [x] M src/core/shared/ide-restart.ts
- [x] M src/core/shared/index.ts
- [x] A src/core/shared/own-skill-texts.ts
- [x] A src/core/shared/released-generated-fingerprints.ts
- [x] A src/core/shared/shared-skill-install.ts
- [x] M src/core/shared/skill-content-equivalence.ts
- [x] M src/core/shared/skill-generation.ts
- [x] A src/core/shared/skill-links.ts
- [x] M src/core/shared/skill-paths.ts
- [x] M src/core/shared/tool-detection.ts
- [x] M src/core/update-plan.ts
- [x] M src/core/update.ts
- [x] M src/ui/welcome-screen.ts

## CLI

- [x] M src/cli/index.ts
- [x] M src/commands/completion.ts
- [x] M src/commands/config.ts
- [x] M src/commands/validate.ts
- [x] M src/commands/workflow/instructions.ts

## その他

- [x] M .agents/skills/release-openspec/SKILL.md
- [x] M .devcontainer/README.md
- [x] M .gitattributes
- [x] M .github/dependabot.yml
- [x] M .github/workflows/binaries.yml
- [x] M .github/workflows/ci.yml
- [x] M .github/workflows/security.yml
- [x] M CONTRIBUTING.md
- [x] M flake.nix
- [x] M install.md
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M pnpm-workspace.yaml
- [x] M scripts/README.md
- [x] M scripts/binary/install.ps1
- [x] M scripts/binary/install.sh
- [x] A scripts/capture-released-fingerprints.mjs
- [x] M src/core/command-surface.ts
- [x] M src/core/completions/installers/zsh-installer.ts
- [x] M src/core/config-schema.ts
- [x] M src/core/config.ts
- [x] M src/core/file-view.ts
- [x] M src/core/global-config.ts
- [x] M src/core/id.ts
- [x] M src/core/onboarding-commands.ts
- [x] M src/core/parsers/change-parser.ts
- [x] M src/core/parsers/code-fence.ts
- [x] M src/core/parsers/markdown-parser.ts
- [x] M src/core/parsers/requirement-blocks.ts
- [x] M src/core/parsers/requirement-text.ts
- [x] M src/core/parsers/spec-structure.ts
- [x] M src/core/project-config.ts
- [x] M src/core/root-selection.ts
- [x] M src/core/specs-apply.ts
- [x] M src/core/store/git.ts
- [x] M src/core/validation/purpose-placeholder.ts
- [x] M src/core/validation/validator.ts
- [x] M src/core/version-check.ts
- [x] M src/utils/command-references.ts
- [x] M src/utils/file-system.ts
- [x] M src/utils/shell-detection.ts
- [x] M src/utils/task-progress.ts
- [x] M vitest.config.ts
- [x] M vitest.setup.ts

## 翻訳対象外

D openspec/changes/IMPLEMENTATION_ORDER.md
D openspec/changes/add-change-stacking-awareness/.openspec.yaml
D openspec/changes/add-change-stacking-awareness/proposal.md
D openspec/changes/add-change-stacking-awareness/specs/change-creation/spec.md
D openspec/changes/add-change-stacking-awareness/specs/change-stacking-workflow/spec.md
D openspec/changes/add-change-stacking-awareness/specs/cli-change/spec.md
D openspec/changes/add-change-stacking-awareness/specs/openspec-conventions/spec.md
D openspec/changes/add-change-stacking-awareness/tasks.md
D openspec/changes/add-qa-smoke-harness/proposal.md
D openspec/changes/add-qa-smoke-harness/specs/developer-qa-workflow/spec.md
R100 openspec/changes/add-amp-support/.openspec.yaml openspec/changes/archive/2026-10-19-add-amp-support/.openspec.yaml
R100 openspec/changes/add-amp-support/proposal.md openspec/changes/archive/2026-10-19-add-amp-support/proposal.md
R100 openspec/changes/add-amp-support/specs/ai-tool-paths/spec.md openspec/changes/archive/2026-10-19-add-amp-support/specs/ai-tool-paths/spec.md
R100 openspec/changes/add-amp-support/tasks.md openspec/changes/archive/2026-10-19-add-amp-support/tasks.md
R100 openspec/changes/add-devin-desktop-support/.openspec.yaml openspec/changes/archive/2026-10-19-add-devin-desktop-support/.openspec.yaml
R100 openspec/changes/add-devin-desktop-support/proposal.md openspec/changes/archive/2026-10-19-add-devin-desktop-support/proposal.md
R083 openspec/changes/add-devin-desktop-support/specs/ai-tool-paths/spec.md openspec/changes/archive/2026-10-19-add-devin-desktop-support/specs/ai-tool-paths/spec.md
R080 openspec/changes/add-devin-desktop-support/specs/cli-init/spec.md openspec/changes/archive/2026-10-19-add-devin-desktop-support/specs/cli-init/spec.md
R090 openspec/changes/add-devin-desktop-support/specs/cli-update/spec.md openspec/changes/archive/2026-10-19-add-devin-desktop-support/specs/cli-update/spec.md
R070 openspec/changes/add-devin-desktop-support/specs/command-generation/spec.md openspec/changes/archive/2026-10-19-add-devin-desktop-support/specs/command-generation/spec.md
R100 openspec/changes/add-devin-desktop-support/tasks.md openspec/changes/archive/2026-10-19-add-devin-desktop-support/tasks.md
R100 openspec/changes/add-init-agents-target/.openspec.yaml openspec/changes/archive/2026-10-19-add-init-agents-target/.openspec.yaml
R100 openspec/changes/add-init-agents-target/proposal.md openspec/changes/archive/2026-10-19-add-init-agents-target/proposal.md
R100 openspec/changes/add-init-agents-target/specs/ai-tool-paths/spec.md openspec/changes/archive/2026-10-19-add-init-agents-target/specs/ai-tool-paths/spec.md
R100 openspec/changes/add-init-agents-target/specs/cli-init/spec.md openspec/changes/archive/2026-10-19-add-init-agents-target/specs/cli-init/spec.md
R100 openspec/changes/add-init-agents-target/tasks.md openspec/changes/archive/2026-10-19-add-init-agents-target/tasks.md
R100 openspec/changes/add-skill-cli-auto-approval/proposal.md openspec/changes/archive/2026-10-19-add-skill-cli-auto-approval/proposal.md
R100 openspec/changes/add-skill-cli-auto-approval/specs/cli-init/spec.md openspec/changes/archive/2026-10-19-add-skill-cli-auto-approval/specs/cli-init/spec.md
R069 openspec/changes/add-skill-cli-auto-approval/specs/command-generation/spec.md openspec/changes/archive/2026-10-19-add-skill-cli-auto-approval/specs/command-generation/spec.md
R100 openspec/changes/add-skill-cli-auto-approval/tasks.md openspec/changes/archive/2026-10-19-add-skill-cli-auto-approval/tasks.md
R100 openspec/changes/add-status-next-step/.openspec.yaml openspec/changes/archive/2026-10-19-add-status-next-step/.openspec.yaml
R100 openspec/changes/add-status-next-step/proposal.md openspec/changes/archive/2026-10-19-add-status-next-step/proposal.md
R100 openspec/changes/add-status-next-step/specs/cli-artifact-workflow/spec.md openspec/changes/archive/2026-10-19-add-status-next-step/specs/cli-artifact-workflow/spec.md
R100 openspec/changes/add-status-next-step/tasks.md openspec/changes/archive/2026-10-19-add-status-next-step/tasks.md
R100 openspec/changes/add-update-workflow/.openspec.yaml openspec/changes/archive/2026-10-19-add-update-workflow/.openspec.yaml
R100 openspec/changes/add-update-workflow/design.md openspec/changes/archive/2026-10-19-add-update-workflow/design.md
R100 openspec/changes/add-update-workflow/proposal.md openspec/changes/archive/2026-10-19-add-update-workflow/proposal.md
R100 openspec/changes/add-update-workflow/specs/opsx-update-skill/spec.md openspec/changes/archive/2026-10-19-add-update-workflow/specs/opsx-update-skill/spec.md
R100 openspec/changes/add-update-workflow/tasks.md openspec/changes/archive/2026-10-19-add-update-workflow/tasks.md
R100 openspec/changes/add-validation-findings-report/.openspec.yaml openspec/changes/archive/2026-10-19-add-validation-findings-report/.openspec.yaml
R100 openspec/changes/add-validation-findings-report/design.md openspec/changes/archive/2026-10-19-add-validation-findings-report/design.md
R100 openspec/changes/add-validation-findings-report/proposal.md openspec/changes/archive/2026-10-19-add-validation-findings-report/proposal.md
R100 openspec/changes/add-validation-findings-report/specs/cli-validate/spec.md openspec/changes/archive/2026-10-19-add-validation-findings-report/specs/cli-validate/spec.md
R100 openspec/changes/add-validation-findings-report/tasks.md openspec/changes/archive/2026-10-19-add-validation-findings-report/tasks.md
R100 openspec/changes/add-version-command/.openspec.yaml openspec/changes/archive/2026-10-19-add-version-command/.openspec.yaml
R100 openspec/changes/add-version-command/design.md openspec/changes/archive/2026-10-19-add-version-command/design.md
R100 openspec/changes/add-version-command/proposal.md openspec/changes/archive/2026-10-19-add-version-command/proposal.md
R100 openspec/changes/add-version-command/specs/cli-version/spec.md openspec/changes/archive/2026-10-19-add-version-command/specs/cli-version/spec.md
R100 openspec/changes/add-version-command/tasks.md openspec/changes/archive/2026-10-19-add-version-command/tasks.md
R100 openspec/changes/extend-config-injection-to-apply-archive/.openspec.yaml openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/.openspec.yaml
R100 openspec/changes/extend-config-injection-to-apply-archive/design.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/design.md
R100 openspec/changes/extend-config-injection-to-apply-archive/proposal.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/proposal.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/cli-archive-instructions/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/cli-archive-instructions/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/cli-artifact-workflow/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/cli-artifact-workflow/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/config-loading/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/config-loading/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/context-injection/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/context-injection/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/operation-guidance/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/operation-guidance/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/opsx-apply-skill/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/opsx-apply-skill/spec.md
R096 openspec/changes/extend-config-injection-to-apply-archive/specs/opsx-archive-skill/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/opsx-archive-skill/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/opsx-bulk-archive-skill/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/opsx-bulk-archive-skill/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/specs/specs-sync-skill/spec.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/specs/specs-sync-skill/spec.md
R100 openspec/changes/extend-config-injection-to-apply-archive/tasks.md openspec/changes/archive/2026-10-19-extend-config-injection-to-apply-archive/tasks.md
R100 openspec/changes/feat-add-omp-tool-support/.openspec.yaml openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/.openspec.yaml
R100 openspec/changes/feat-add-omp-tool-support/design.md openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/design.md
R100 openspec/changes/feat-add-omp-tool-support/proposal.md openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/proposal.md
R100 openspec/changes/feat-add-omp-tool-support/specs/cli-init/spec.md openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/specs/cli-init/spec.md
R100 openspec/changes/feat-add-omp-tool-support/specs/cli-update/spec.md openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/specs/cli-update/spec.md
R100 openspec/changes/feat-add-omp-tool-support/specs/oh-my-pi-tool/spec.md openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/specs/oh-my-pi-tool/spec.md
R100 openspec/changes/feat-add-omp-tool-support/tasks.md openspec/changes/archive/2026-10-19-feat-add-omp-tool-support/tasks.md
R100 openspec/changes/fix-archive-retirement-guidance/.openspec.yaml openspec/changes/archive/2026-10-19-fix-archive-retirement-guidance/.openspec.yaml
R100 openspec/changes/fix-archive-retirement-guidance/proposal.md openspec/changes/archive/2026-10-19-fix-archive-retirement-guidance/proposal.md
R100 openspec/changes/fix-archive-retirement-guidance/specs/cli-archive/spec.md openspec/changes/archive/2026-10-19-fix-archive-retirement-guidance/specs/cli-archive/spec.md
R100 openspec/changes/fix-archive-retirement-guidance/tasks.md openspec/changes/archive/2026-10-19-fix-archive-retirement-guidance/tasks.md
R100 openspec/changes/fix-cli-local-date-semantics/.openspec.yaml openspec/changes/archive/2026-10-19-fix-cli-local-date-semantics/.openspec.yaml
R100 openspec/changes/fix-cli-local-date-semantics/design.md openspec/changes/archive/2026-10-19-fix-cli-local-date-semantics/design.md
R100 openspec/changes/fix-cli-local-date-semantics/proposal.md openspec/changes/archive/2026-10-19-fix-cli-local-date-semantics/proposal.md
R100 openspec/changes/fix-cli-local-date-semantics/specs/change-creation/spec.md openspec/changes/archive/2026-10-19-fix-cli-local-date-semantics/specs/change-creation/spec.md
R100 openspec/changes/fix-cli-local-date-semantics/specs/cli-archive/spec.md openspec/changes/archive/2026-10-19-fix-cli-local-date-semantics/specs/cli-archive/spec.md
R100 openspec/changes/fix-cli-local-date-semantics/tasks.md openspec/changes/archive/2026-10-19-fix-cli-local-date-semantics/tasks.md
R100 openspec/changes/fix-opencode-commands-directory/.openspec.yaml openspec/changes/archive/2026-10-19-fix-opencode-commands-directory/.openspec.yaml
R100 openspec/changes/fix-opencode-commands-directory/design.md openspec/changes/archive/2026-10-19-fix-opencode-commands-directory/design.md
R100 openspec/changes/fix-opencode-commands-directory/proposal.md openspec/changes/archive/2026-10-19-fix-opencode-commands-directory/proposal.md
R093 openspec/changes/fix-opencode-commands-directory/specs/command-generation/spec.md openspec/changes/archive/2026-10-19-fix-opencode-commands-directory/specs/command-generation/spec.md
R100 openspec/changes/fix-opencode-commands-directory/tasks.md openspec/changes/archive/2026-10-19-fix-opencode-commands-directory/tasks.md
R100 openspec/changes/fix-schemas-root-selection/.openspec.yaml openspec/changes/archive/2026-10-19-fix-schemas-root-selection/.openspec.yaml
R100 openspec/changes/fix-schemas-root-selection/design.md openspec/changes/archive/2026-10-19-fix-schemas-root-selection/design.md
R100 openspec/changes/fix-schemas-root-selection/proposal.md openspec/changes/archive/2026-10-19-fix-schemas-root-selection/proposal.md
R100 openspec/changes/fix-schemas-root-selection/specs/schema-resolution/spec.md openspec/changes/archive/2026-10-19-fix-schemas-root-selection/specs/schema-resolution/spec.md
R097 openspec/changes/fix-schemas-root-selection/tasks.md openspec/changes/archive/2026-10-19-fix-schemas-root-selection/tasks.md
R100 openspec/changes/fix-spec-parser-fidelity/.openspec.yaml openspec/changes/archive/2026-10-19-fix-spec-parser-fidelity/.openspec.yaml
R100 openspec/changes/fix-spec-parser-fidelity/design.md openspec/changes/archive/2026-10-19-fix-spec-parser-fidelity/design.md
R100 openspec/changes/fix-spec-parser-fidelity/proposal.md openspec/changes/archive/2026-10-19-fix-spec-parser-fidelity/proposal.md
R100 openspec/changes/fix-spec-parser-fidelity/specs/cli-validate/spec.md openspec/changes/archive/2026-10-19-fix-spec-parser-fidelity/specs/cli-validate/spec.md
R100 openspec/changes/fix-spec-parser-fidelity/tasks.md openspec/changes/archive/2026-10-19-fix-spec-parser-fidelity/tasks.md
R100 openspec/changes/fix-validate-view-resolution-parity/.openspec.yaml openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/.openspec.yaml
R100 openspec/changes/fix-validate-view-resolution-parity/design.md openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/design.md
R100 openspec/changes/fix-validate-view-resolution-parity/proposal.md openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/proposal.md
R075 openspec/changes/fix-validate-view-resolution-parity/specs/cli-archive/spec.md openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/specs/cli-archive/spec.md
R085 openspec/changes/fix-validate-view-resolution-parity/specs/cli-validate/spec.md openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/specs/cli-validate/spec.md
R100 openspec/changes/fix-validate-view-resolution-parity/specs/cli-view/spec.md openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/specs/cli-view/spec.md
R100 openspec/changes/fix-validate-view-resolution-parity/tasks.md openspec/changes/archive/2026-10-19-fix-validate-view-resolution-parity/tasks.md
R100 openspec/changes/fix-windows-archive-claim-release/.openspec.yaml openspec/changes/archive/2026-10-19-fix-windows-archive-claim-release/.openspec.yaml
R100 openspec/changes/fix-windows-archive-claim-release/proposal.md openspec/changes/archive/2026-10-19-fix-windows-archive-claim-release/proposal.md
R100 openspec/changes/fix-windows-archive-claim-release/specs/cli-archive/spec.md openspec/changes/archive/2026-10-19-fix-windows-archive-claim-release/specs/cli-archive/spec.md
R100 openspec/changes/fix-windows-archive-claim-release/tasks.md openspec/changes/archive/2026-10-19-fix-windows-archive-claim-release/tasks.md
R100 openspec/changes/graceful-status-no-changes/.openspec.yaml openspec/changes/archive/2026-10-19-graceful-status-no-changes/.openspec.yaml
R100 openspec/changes/graceful-status-no-changes/design.md openspec/changes/archive/2026-10-19-graceful-status-no-changes/design.md
R100 openspec/changes/graceful-status-no-changes/proposal.md openspec/changes/archive/2026-10-19-graceful-status-no-changes/proposal.md
R100 openspec/changes/graceful-status-no-changes/specs/graceful-status-empty/spec.md openspec/changes/archive/2026-10-19-graceful-status-no-changes/specs/graceful-status-empty/spec.md
R100 openspec/changes/graceful-status-no-changes/tasks.md openspec/changes/archive/2026-10-19-graceful-status-no-changes/tasks.md
R100 openspec/changes/make-codex-skills-only/.openspec.yaml openspec/changes/archive/2026-10-19-make-codex-skills-only/.openspec.yaml
R100 openspec/changes/make-codex-skills-only/design.md openspec/changes/archive/2026-10-19-make-codex-skills-only/design.md
R100 openspec/changes/make-codex-skills-only/proposal.md openspec/changes/archive/2026-10-19-make-codex-skills-only/proposal.md
R100 openspec/changes/make-codex-skills-only/specs/ai-tool-paths/spec.md openspec/changes/archive/2026-10-19-make-codex-skills-only/specs/ai-tool-paths/spec.md
R100 openspec/changes/make-codex-skills-only/specs/cli-init/spec.md openspec/changes/archive/2026-10-19-make-codex-skills-only/specs/cli-init/spec.md
R090 openspec/changes/make-codex-skills-only/specs/cli-update/spec.md openspec/changes/archive/2026-10-19-make-codex-skills-only/specs/cli-update/spec.md
R075 openspec/changes/make-codex-skills-only/specs/command-generation/spec.md openspec/changes/archive/2026-10-19-make-codex-skills-only/specs/command-generation/spec.md
R100 openspec/changes/make-codex-skills-only/tasks.md openspec/changes/archive/2026-10-19-make-codex-skills-only/tasks.md
R100 openspec/changes/rename-bob-to-ibm-bob/.openspec.yaml openspec/changes/archive/2026-10-19-rename-bob-to-ibm-bob/.openspec.yaml
R100 openspec/changes/rename-bob-to-ibm-bob/proposal.md openspec/changes/archive/2026-10-19-rename-bob-to-ibm-bob/proposal.md
R100 openspec/changes/rename-bob-to-ibm-bob/specs/ai-tool-paths/spec.md openspec/changes/archive/2026-10-19-rename-bob-to-ibm-bob/specs/ai-tool-paths/spec.md
R100 openspec/changes/rename-bob-to-ibm-bob/tasks.md openspec/changes/archive/2026-10-19-rename-bob-to-ibm-bob/tasks.md
R100 openspec/changes/spec-diffs/.openspec.yaml openspec/changes/archive/2026-10-19-spec-diffs/.openspec.yaml
R100 openspec/changes/spec-diffs/design.md openspec/changes/archive/2026-10-19-spec-diffs/design.md
R100 openspec/changes/spec-diffs/proposal.md openspec/changes/archive/2026-10-19-spec-diffs/proposal.md
R100 openspec/changes/spec-diffs/specs/cli-show/spec.md openspec/changes/archive/2026-10-19-spec-diffs/specs/cli-show/spec.md
R100 openspec/changes/spec-diffs/tasks.md openspec/changes/archive/2026-10-19-spec-diffs/tasks.md
R100 openspec/changes/suppress-telemetry-notice-in-json/.openspec.yaml openspec/changes/archive/2026-10-19-suppress-telemetry-notice-in-json/.openspec.yaml
R100 openspec/changes/suppress-telemetry-notice-in-json/proposal.md openspec/changes/archive/2026-10-19-suppress-telemetry-notice-in-json/proposal.md
R100 openspec/changes/suppress-telemetry-notice-in-json/specs/telemetry/spec.md openspec/changes/archive/2026-10-19-suppress-telemetry-notice-in-json/specs/telemetry/spec.md
R100 openspec/changes/suppress-telemetry-notice-in-json/tasks.md openspec/changes/archive/2026-10-19-suppress-telemetry-notice-in-json/tasks.md
R100 openspec/changes/warn-on-purpose-placeholder/.openspec.yaml openspec/changes/archive/2026-10-19-warn-on-purpose-placeholder/.openspec.yaml
R100 openspec/changes/warn-on-purpose-placeholder/design.md openspec/changes/archive/2026-10-19-warn-on-purpose-placeholder/design.md
R100 openspec/changes/warn-on-purpose-placeholder/proposal.md openspec/changes/archive/2026-10-19-warn-on-purpose-placeholder/proposal.md
R100 openspec/changes/warn-on-purpose-placeholder/specs/cli-validate/spec.md openspec/changes/archive/2026-10-19-warn-on-purpose-placeholder/specs/cli-validate/spec.md
R100 openspec/changes/warn-on-purpose-placeholder/tasks.md openspec/changes/archive/2026-10-19-warn-on-purpose-placeholder/tasks.md
D openspec/changes/schema-alias-support/.openspec.yaml
D openspec/changes/schema-alias-support/proposal.md
R050 openspec/changes/add-qa-smoke-harness/.openspec.yaml openspec/changes/share-skills-in-agents-folder/.openspec.yaml
A openspec/changes/share-skills-in-agents-folder/design.md
A openspec/changes/share-skills-in-agents-folder/proposal.md
A openspec/changes/share-skills-in-agents-folder/specs/ai-tool-paths/spec.md
A openspec/changes/share-skills-in-agents-folder/specs/cli-artifact-workflow/spec.md
A openspec/changes/share-skills-in-agents-folder/specs/cli-config/spec.md
A openspec/changes/share-skills-in-agents-folder/specs/cli-init/spec.md
A openspec/changes/share-skills-in-agents-folder/specs/cli-update/spec.md
A openspec/changes/share-skills-in-agents-folder/tasks.md
D openspec/changes/unify-template-generation-pipeline/.openspec.yaml
D openspec/changes/unify-template-generation-pipeline/design.md
D openspec/changes/unify-template-generation-pipeline/proposal.md
D openspec/changes/unify-template-generation-pipeline/specs/template-artifact-pipeline/spec.md
D openspec/changes/unify-template-generation-pipeline/tasks.md
M openspec/config.yaml
M openspec/specs/ai-tool-paths/spec.md
M openspec/specs/change-creation/spec.md
A openspec/specs/cli-archive-instructions/spec.md
M openspec/specs/cli-archive/spec.md
M openspec/specs/cli-artifact-workflow/spec.md
M openspec/specs/cli-completion/spec.md
M openspec/specs/cli-init/spec.md
M openspec/specs/cli-show/spec.md
M openspec/specs/cli-update/spec.md
M openspec/specs/cli-validate/spec.md
A openspec/specs/cli-version/spec.md
M openspec/specs/cli-view/spec.md
M openspec/specs/command-generation/spec.md
M openspec/specs/config-loading/spec.md
M openspec/specs/context-injection/spec.md
A openspec/specs/graceful-status-empty/spec.md
A openspec/specs/oh-my-pi-tool/spec.md
A openspec/specs/operation-guidance/spec.md
A openspec/specs/opsx-apply-skill/spec.md
M openspec/specs/opsx-archive-skill/spec.md
A openspec/specs/opsx-bulk-archive-skill/spec.md
A openspec/specs/opsx-update-skill/spec.md
M openspec/specs/schema-resolution/spec.md
M openspec/specs/specs-sync-skill/spec.md
M openspec/specs/telemetry/spec.md
M test/binary-installer.test.ts
A test/ci-docs-only.test.ts
A test/cli-e2e/apply-wrapped-tasks.test.ts
M test/cli-e2e/basic.test.ts
A test/cli-e2e/unrecognized-delta-section.test.ts
M test/cli-e2e/update-dry-run.test.ts
A test/cli-e2e/upgrade-from-releases.test.ts
M test/commands/apply-instructions-tasks.test.ts
M test/commands/artifact-workflow.test.ts
M test/commands/config-profile.test.ts
M test/commands/profile-handoffs.test.ts
M test/commands/store-git.test.ts
M test/commands/store-remote.test.ts
A test/commands/validate-unparseable-config.test.ts
M test/core/archive.test.ts
M test/core/available-tools.test.ts
A test/core/command-reconcile.test.ts
M test/core/completions/installers/zsh-installer.round-trip.test.ts
M test/core/completions/installers/zsh-installer.test.ts
M test/core/global-config.test.ts
M test/core/global-config.unparseable.test.ts
M test/core/init.test.ts
M test/core/legacy-cleanup.test.ts
M test/core/migration.test.ts
M test/core/onboarding-commands.test.ts
M test/core/parsers/closed-requirement-heading.test.ts
A test/core/parsers/closed-section-heading.test.ts
A test/core/parsers/code-fence.test.ts
M test/core/parsers/markdown-parser.test.ts
M test/core/parsers/orphaned-requirements.test.ts
A test/core/parsers/spec-structure-unspaced-header.test.ts
M test/core/profile-sync-drift.test.ts
A test/core/released-output-sweep.test.ts
A test/core/retired-tools.test.ts
M test/core/root-selection.test.ts
M test/core/shared-ide-restart.test.ts
M test/core/shared-skill-target.test.ts
A test/core/shared/generated-fingerprint.test.ts
A test/core/shared/skill-links.test.ts
M test/core/shared/skill-paths.test.ts
D test/core/shared/tool-detection-command-drift.test.ts
M test/core/shared/tool-detection.test.ts
A test/core/skills-2-0-hardening.test.ts
A test/core/store/git-repo-name.test.ts
M test/core/templates/explore.test.ts
M test/core/templates/profile-handoffs.test.ts
M test/core/templates/project-root-guard.test.ts
M test/core/templates/propose.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/update-dry-run.test.ts
M test/core/update.test.ts
A test/core/validation.scenario-steps.test.ts
M test/core/version-check.test.ts
M test/core/warp.test.ts
A test/fixtures/released-output/v0.23.0-CLAUDE.md
A test/fixtures/released-output/v0.23.0-claude-command-apply.md
A test/fixtures/released-output/v0.23.0-claude-command-archive.md
A test/fixtures/released-output/v0.23.0-claude-command-proposal.md
A test/fixtures/released-output/v1.0.0-claude-command-opsx-explore.md
A test/fixtures/released-output/v1.0.0-codex-prompt-opsx-new.md
A test/fixtures/released-output/v1.10.0-amazonq/prompts/opsx-apply.md
A test/fixtures/released-output/v1.10.0-amazonq/prompts/opsx-explore.md
A test/fixtures/released-output/v1.10.0-amazonq/skills/openspec-explore/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-apply-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-archive-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-bulk-archive-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-continue-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-explore/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-ff-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-new-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-onboard/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-propose/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-sync-specs/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-update-change/SKILL.md
A test/fixtures/released-output/v1.16.0-claude-skills/openspec-verify-change/SKILL.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-apply.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-archive.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-bulk-archive.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-continue.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-explore.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-ff.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-new.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-onboard.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-propose.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-sync.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-update.md
A test/fixtures/released-output/v1.6.0-codex-prompts/opsx-verify.md
A test/fixtures/released-output/v1.9.0-agents-skills/openspec-propose/SKILL.md
A test/fixtures/released-output/v1.9.0-codex-agents-skills/openspec-propose/SKILL.md
A test/helpers/released-codex-prompt.ts
M test/setup-docs-claims.test.ts
M test/ui/welcome-screen.test.ts
A test/upgrade-to-2-docs-claims.test.ts
M test/utils/command-references.test.ts
M test/utils/shell-detection.test.ts
M test/utils/task-progress.test.ts
M website/README.md
D website/app/icon.svg
M website/app/layout.tsx
M website/cloudflare/router/worker.js
M website/cloudflare/router/wrangler.jsonc
M website/docs.sync.config.mjs
M website/lib/layout.shared.tsx
M website/package.json
M website/pnpm-lock.yaml
A website/public/docs/apple-icon.png
A website/public/docs/icon-32.png
A website/public/docs/icon-512.png
R100 website/public/openspec-pixel.svg website/public/docs/openspec-pixel.svg
