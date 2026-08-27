# Scope (upstream-v1.10.0 → upstream-v1.11.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

## docs

- [x] M	CHANGELOG.md
- [x] A	docs-lab/Notes.md
- [x] A	docs-lab/README.md
- [x] A	docs-lab/customize/overview.md
- [x] A	docs-lab/customize/profiles.md
- [x] A	docs-lab/customize/project-config.md
- [x] A	docs-lab/customize/schemas.md
- [x] A	docs-lab/customize/skills.md
- [x] A	docs-lab/guides/apply.md
- [x] A	docs-lab/guides/change-course.md
- [x] A	docs-lab/guides/concepts.md
- [x] A	docs-lab/guides/examples.md
- [x] A	docs-lab/guides/existing-codebases.md
- [x] A	docs-lab/guides/explore.md
- [x] A	docs-lab/guides/review-the-plan.md
- [x] A	docs-lab/guides/teams.md
- [x] A	docs-lab/help/faq.md
- [x] A	docs-lab/help/legacy/migration.md
- [x] A	docs-lab/help/troubleshooting.md
- [x] A	docs-lab/message-map.md
- [x] A	docs-lab/multi-repo/stores.md
- [x] A	docs-lab/multi-repo/worksets.md
- [x] A	docs-lab/reference/architecture/design-decisions.md
- [x] A	docs-lab/reference/architecture/index.md
- [x] A	docs-lab/reference/architecture/workflow-runs.md
- [x] A	docs-lab/reference/cli.md
- [x] A	docs-lab/reference/configuration/change-metadata.md
- [x] A	docs-lab/reference/configuration/config-json.md
- [x] A	docs-lab/reference/configuration/config-yaml.md
- [x] A	docs-lab/reference/configuration/environment-variables.md
- [x] A	docs-lab/reference/configuration/index.md
- [x] A	docs-lab/reference/configuration/stores.md
- [x] A	docs-lab/reference/glossary.md
- [x] A	docs-lab/reference/schemas/index.md
- [x] A	docs-lab/reference/schemas/schema-yaml.md
- [x] A	docs-lab/reference/schemas/spec-driven/index.md
- [x] A	docs-lab/reference/skills.md
- [x] A	docs-lab/reference/supported-tools.md
- [x] A	docs-lab/sources.md
- [x] A	docs-lab/start/installation.md
- [x] A	docs-lab/start/overview.md
- [x] A	docs-lab/start/quickstart.md
- [x] A	docs-lab/start/setup.md
- [x] M	docs/agent-contract.md
- [x] A	install.md

## OPSX スキル

- [x] A	.agents/skills/draft-openspec-docs/SKILL.md
- [x] A	.agents/skills/verify-openspec-docs/SKILL.md
- [x] A	.agents/skills/write-openspec-docs/SKILL.md
- [x] A	.agents/skills/write-openspec-docs/full-process.md
- [x] A	.agents/skills/write-openspec-docs/writing.md
- [x] M	skills/openspec-explore/SKILL.md
- [x] M	src/core/templates/workflows/explore.ts

## artifact engine

- [x] M	src/core/artifact-graph/resolver.ts

## コマンド生成

- [x] M	src/core/command-generation/adapters/antigravity.ts

## init・オンボーディング

- [x] M	src/core/available-tools.ts
- [x] M	src/core/completions/command-registry.ts
- [x] M	src/core/completions/generators/fish-generator.ts
- [x] M	src/core/completions/templates/fish-templates.ts
- [x] M	src/core/completions/types.ts
- [x] M	src/core/config.ts
- [x] M	src/core/init.ts
- [x] M	src/core/legacy-cleanup.ts
- [x] M	src/core/migration.ts
- [x] M	src/core/shared-skill-target.ts
- [x] M	src/core/update.ts

## CLI

- [x] M	src/cli/index.ts
- [x] M	src/commands/change.ts
- [ ] M	src/commands/schema.ts
- [ ] M	src/commands/show.ts
- [ ] M	src/commands/workflow/index.ts
- [ ] M	src/commands/workflow/status.ts
- [ ] M	src/core/parsers/requirement-blocks.ts
- [ ] M	src/core/shared/tool-detection.ts
- [ ] M	src/core/specs-apply.ts
- [ ] M	src/core/validation/constants.ts
- [ ] A	src/core/validation/purpose-placeholder.ts
- [ ] M	src/core/validation/validator.ts
- [ ] A	src/utils/requirement-diff.ts

## その他

- [ ] M	flake.nix
- [ ] M	package.json
- [ ] M	pnpm-lock.yaml
- [ ] D	website/app/(home)/layout.tsx
- [ ] D	website/app/(home)/page.tsx
- [ ] M	website/app/docs/[[...slug]]/page.tsx
- [ ] M	website/app/docs/layout.tsx
- [ ] M	website/app/global.css
- [ ] M	website/app/layout.tsx
- [ ] A	website/app/page.tsx
- [ ] M	website/app/sitemap.ts
- [ ] A	website/components/file-steps.tsx
- [ ] M	website/components/mdx.tsx
- [ ] M	website/docs.sync.config.mjs
- [ ] M	website/lib/layout.shared.tsx
- [ ] A	website/lib/remark-faq.ts
- [ ] A	website/lib/remark-file-steps.ts
- [ ] A	website/lib/remark-gfm-alert.ts
- [ ] M	website/lib/source.ts
- [ ] M	website/next.config.mjs
- [ ] M	website/package.json
- [ ] M	website/pnpm-lock.yaml
- [ ] A	website/public/_redirects
- [ ] A	website/public/openspec-pixel.svg
- [ ] M	website/scripts/sync-docs.mjs
- [ ] M	website/source.config.ts

## 翻訳対象外

A	openspec/changes/spec-diffs/.openspec.yaml
A	openspec/changes/spec-diffs/design.md
A	openspec/changes/spec-diffs/proposal.md
A	openspec/changes/spec-diffs/specs/cli-show/spec.md
A	openspec/changes/spec-diffs/tasks.md
A	openspec/changes/warn-on-purpose-placeholder/.openspec.yaml
A	openspec/changes/warn-on-purpose-placeholder/design.md
A	openspec/changes/warn-on-purpose-placeholder/proposal.md
A	openspec/changes/warn-on-purpose-placeholder/specs/cli-validate/spec.md
A	openspec/changes/warn-on-purpose-placeholder/tasks.md
M	openspec/specs/schema-init-command/spec.md
M	test/commands/schema.test.ts
A	test/commands/show-diff.test.ts
A	test/commands/status-all.test.ts
M	test/commands/store-root-selection.test.ts
M	test/core/archive.test.ts
M	test/core/available-tools.test.ts
M	test/core/command-generation/adapters.test.ts
M	test/core/completions/generators/fish-generator.test.ts
M	test/core/init.test.ts
M	test/core/migration.test.ts
M	test/core/parsers/requirement-blocks.test.ts
A	test/core/purpose-placeholder.test.ts
M	test/core/shared-skill-target.test.ts
M	test/core/specs-apply.salvage.test.ts
M	test/core/templates/explore.test.ts
M	test/core/templates/skill-templates-parity.test.ts
M	test/core/update.test.ts
A	test/core/validation.purpose-placeholder.test.ts
A	test/utils/requirement-diff.test.ts
