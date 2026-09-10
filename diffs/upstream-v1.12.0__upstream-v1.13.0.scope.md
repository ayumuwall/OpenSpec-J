# Scope (upstream-v1.12.0 → upstream-v1.13.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M	CHANGELOG.md
- [x] A	CONTRIBUTING.md
- [x] M	README.md
- [x] M	docs/agent-contract.md

## schemas

- [x] M	schemas/spec-driven/schema.yaml

## OPSX スキル

- [x] M	skills/openspec-explore/SKILL.md
- [x] M	skills/openspec-propose/SKILL.md
- [x] M	src/core/templates/workflows/explore.ts
- [x] M	src/core/templates/workflows/propose.ts

## artifact engine

対象なし。

## コマンド生成

対象なし。

## init・オンボーディング

- [x] M	src/core/init.ts
- [x] M	src/core/onboarding-commands.ts
- [x] M	src/core/shared/tool-detection.ts
- [x] M	src/core/update.ts

## CLI

- [x] M	src/commands/workflow/instructions.ts
- [x] M	src/commands/workflow/shared.ts
- [x] M	src/core/parsers/requirement-blocks.ts
- [x] M	src/core/specs-apply.ts

## その他

- [x] M	.github/dependabot.yml
- [x] M	.github/workflows/ci.yml
- [x] M	flake.nix
- [x] M	package.json
- [x] M	pnpm-lock.yaml
- [x] M	pnpm-workspace.yaml
- [x] M	scripts/update-flake.sh

## 翻訳対象外

A	test/commands/apply-instructions-blocked.test.ts
A	test/commands/apply-instructions-warnings.test.ts
M	test/commands/context.test.ts
M	test/commands/store-root-selection.test.ts
M	test/core/archive.test.ts
M	test/core/init.test.ts
M	test/core/onboarding-commands.test.ts
A	test/core/parsers/delta-list-markers.test.ts
A	test/core/parsers/delta-section-collision.test.ts
M	test/core/project-config.test.ts
A	test/core/shared/tool-detection-command-drift.test.ts
A	test/core/specs-apply.fence-preservation.test.ts
M	test/core/templates/propose.test.ts
M	test/core/templates/skill-templates-parity.test.ts
A	test/core/templates/spec-inventory.test.ts
M	test/core/update.test.ts
M	test/pnpm-workspace-config.test.ts
A	test/update-flake-script.test.ts
M	website/package.json
M	website/pnpm-lock.yaml
M	website/pnpm-workspace.yaml
