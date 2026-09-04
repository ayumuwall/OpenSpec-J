# Scope (upstream-v1.11.0 → upstream-v1.12.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M	CHANGELOG.md
- [x] M	README.md
- [x] M	docs-lab/multi-repo/stores.md
- [x] M	docs-lab/reference/cli.md
- [x] M	docs-lab/reference/configuration/config-json.md
- [x] M	docs-lab/reference/configuration/config-yaml.md
- [x] M	docs-lab/reference/configuration/index.md
- [x] M	docs-lab/reference/glossary.md
- [x] M	docs/README.md
- [x] M	docs/cli.md
- [x] A	docs/community.md
- [x] M	docs/supported-tools.md

## schemas

対象なし。

## OPSX スキル

- [x] M	skills/openspec-explore/SKILL.md
- [x] M	skills/openspec-ff-change/SKILL.md
- [x] M	skills/openspec-propose/SKILL.md
- [x] M	src/core/templates/workflows/explore.ts
- [x] M	src/core/templates/workflows/ff-change.ts
- [x] M	src/core/templates/workflows/propose.ts

## artifact engine

対象なし。

## コマンド生成

- [x] A	src/core/command-generation/adapters/codeassistant.ts
- [x] M	src/core/command-generation/adapters/index.ts
- [x] M	src/core/command-generation/registry.ts

## init・オンボーディング

- [x] M	src/core/completions/command-registry.ts
- [x] M	src/core/config.ts
- [x] M	src/core/init.ts
- [x] M	src/core/openspec-root.ts
- [x] A	src/core/shared/ide-restart.ts
- [x] M	src/core/shared/index.ts
- [x] M	src/core/update.ts
- [x] M	src/utils/command-references.ts

## CLI

- [x] M	src/cli/index.ts
- [x] M	src/commands/change.ts
- [x] M	src/commands/validate.ts
- [x] M	src/core/specs-apply.ts
- [x] M	src/core/validation/validator.ts

## その他

- [x] M	.github/dependabot.yml
- [x] M	.github/workflows/ci.yml
- [x] M	.github/workflows/release-prepare.yml
- [x] M	flake.nix
- [x] M	package.json
- [x] M	pnpm-lock.yaml
- [x] M	website/cloudflare/router/worker.js
- [x] M	website/cloudflare/router/wrangler.jsonc
- [x] M	website/package.json
- [x] M	website/pnpm-lock.yaml
- [x] M	website/pnpm-workspace.yaml

## 翻訳対象外

A	openspec/changes/add-validation-findings-report/.openspec.yaml
A	openspec/changes/add-validation-findings-report/design.md
A	openspec/changes/add-validation-findings-report/proposal.md
A	openspec/changes/add-validation-findings-report/specs/cli-validate/spec.md
A	openspec/changes/add-validation-findings-report/tasks.md
M	openspec/specs/ai-tool-paths/spec.md
M	openspec/specs/cli-artifact-workflow/spec.md
M	openspec/specs/cli-change/spec.md
M	test/cli-e2e/basic.test.ts
A	test/cli-e2e/validate-findings.test.ts
M	test/commands/validate.enriched-output.test.ts
A	test/commands/validate.findings.test.ts
M	test/core/available-tools.test.ts
M	test/core/command-generation/adapters.test.ts
A	test/core/completions/validation-report.test.ts
M	test/core/init.test.ts
M	test/core/openspec-root.test.ts
A	test/core/shared-ide-restart.test.ts
M	test/core/templates/explore.test.ts
M	test/core/templates/propose.test.ts
M	test/core/templates/skill-templates-parity.test.ts
M	test/core/update.test.ts
A	test/core/validation.archive-preflight.test.ts
M	test/package-install-scripts.test.ts
M	test/utils/command-references.test.ts
