# Scope (upstream-v1.9.0 → upstream-v1.10.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M CHANGELOG.md
- [x] M SECURITY.md
- [x] M docs/cli.md
- [x] M docs/commands.md
- [x] M docs/how-commands-work.md
- [x] M docs/multi-language.md
- [x] M docs/supported-tools.md
- [x] M docs/troubleshooting.md
- [x] M docs/workflows.md
- [x] M docs/writing-specs.md

## schemas

- [x] M schemas/spec-driven/schema.yaml

## OPSX スキル

- [x] M skills/openspec-onboard/SKILL.md
- [x] M src/core/templates/workflows/feedback.ts
- [x] M src/core/templates/workflows/onboard.ts

## artifact engine

- [x] M src/core/artifact-graph/instruction-loader.ts
- [x] M src/core/artifact-graph/outputs.ts

## コマンド生成

- [x] M src/core/command-generation/adapters/opencode.ts

## init・オンボーディング

- [x] A src/core/completion-tip.ts
- [x] M src/core/completions/command-registry.ts
- [x] M src/core/completions/factory.ts
- [x] M src/core/completions/installers/bash-installer.ts
- [x] M src/core/completions/installers/fish-installer.ts
- [x] M src/core/completions/installers/powershell-installer.ts
- [x] M src/core/config-prompts.ts
- [x] M src/core/config-schema.ts
- [x] M src/core/config.ts
- [x] M src/core/global-config.ts
- [x] M src/core/init.ts
- [x] M src/core/profiles.ts
- [x] M src/core/update.ts

## CLI

- [x] M src/cli/index.ts
- [x] M src/commands/config.ts
- [x] M src/commands/feedback.ts
- [x] M src/core/archive.ts
- [x] M src/telemetry/index.ts
- [x] M src/utils/change-metadata.ts
- [x] M src/utils/change-utils.ts

## その他

- [x] M .github/workflows/ci.yml
- [x] M flake.nix
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M scripts/README.md
- [x] D scripts/postinstall.js
- [x] D scripts/test-postinstall.sh
- [x] M vitest.config.ts
- [x] M website/package.json
- [x] M website/pnpm-lock.yaml

## 翻訳対象外

A openspec/changes/fix-archive-retirement-guidance/.openspec.yaml
A openspec/changes/fix-archive-retirement-guidance/proposal.md
A openspec/changes/fix-archive-retirement-guidance/specs/cli-archive/spec.md
A openspec/changes/fix-archive-retirement-guidance/tasks.md
M openspec/specs/cli-feedback/spec.md
M openspec/specs/cli-init/spec.md
M test/cli-e2e/basic.test.ts
A test/cli-e2e/completion-tip.test.ts
M test/commands/artifact-workflow.test.ts
M test/commands/config-profile.test.ts
M test/commands/declared-store-fallback.test.ts
M test/commands/feedback.test.ts
M test/core/archive.test.ts
M test/core/artifact-graph/outputs.test.ts
M test/core/available-tools.test.ts
M test/core/cli-is-json-run.test.ts
M test/core/command-generation/adapters.test.ts
A test/core/completion-tip.test.ts
M test/core/completions/installers/bash-installer.test.ts
M test/core/completions/installers/fish-installer.test.ts
M test/core/completions/installers/powershell-installer.test.ts
M test/core/config-schema.test.ts
M test/core/init.test.ts
M test/core/profiles.test.ts
A test/core/templates/main-spec-paths.test.ts
M test/core/templates/propose.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/update.test.ts
A test/package-install-scripts.test.ts
M test/telemetry/index.test.ts
M test/utils/change-metadata.test.ts
