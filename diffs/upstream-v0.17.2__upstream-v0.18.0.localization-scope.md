# 翻訳スコープ: upstream v0.17.2 -> v0.18.0

ローカライズ対象（docs/templates/CLI/tests）を抜粋した一覧。
OpenSpec 内部（`openspec/changes` / `openspec/specs`）は翻訳対象外。

## Docs

- `CHANGELOG.md`
- `docs/artifact_poc.md`
- `docs/experimental-release-plan.md`
- `docs/experimental-workflow.md`
- `docs/schema-customization.md`
- `docs/schema-workflow-gaps.md`

## Templates

- `schemas/spec-driven/schema.yaml`
- `schemas/spec-driven/templates/design.md`
- `schemas/spec-driven/templates/proposal.md`
- `schemas/spec-driven/templates/spec.md`
- `schemas/spec-driven/templates/tasks.md`
- `schemas/tdd/schema.yaml`
- `schemas/tdd/templates/docs.md`
- `schemas/tdd/templates/implementation.md`
- `schemas/tdd/templates/spec.md`
- `schemas/tdd/templates/test.md`

## CLI / Core

- `src/cli/index.ts`
- `src/commands/artifact-workflow.ts`
- `src/core/archive.ts`
- `src/core/artifact-graph/graph.ts`
- `src/core/artifact-graph/index.ts`
- `src/core/artifact-graph/instruction-loader.ts`
- `src/core/artifact-graph/resolver.ts`
- `src/core/artifact-graph/schema.ts`
- `src/core/artifact-graph/state.ts`
- `src/core/artifact-graph/types.ts`
- `src/core/converters/json-converter.ts`
- `src/core/global-config.ts`
- `src/core/index.ts`
- `src/core/list.ts`
- `src/core/specs-apply.ts`
- `src/core/templates/skill-templates.ts`
- `src/core/update.ts`
- `src/core/validation/validator.ts`
- `src/core/view.ts`
- `src/utils/change-metadata.ts`
- `src/utils/change-utils.ts`
- `src/utils/file-system.ts`
- `src/utils/index.ts`

## Tests

- `test/commands/artifact-workflow.test.ts`
- `test/core/archive.test.ts`
- `test/core/artifact-graph/graph.test.ts`
- `test/core/artifact-graph/instruction-loader.test.ts`
- `test/core/artifact-graph/resolver.test.ts`
- `test/core/artifact-graph/schema.test.ts`
- `test/core/artifact-graph/state.test.ts`
- `test/core/artifact-graph/workflow.integration.test.ts`
- `test/core/list.test.ts`
- `test/core/view.test.ts`
- `test/helpers/run-cli.ts`
- `test/utils/change-metadata.test.ts`
- `test/utils/change-utils.test.ts`

## 対象外（翻訳不要）

- `openspec/changes/**`
- `openspec/specs/**`
- `.gitignore`
- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`
- `vitest.setup.ts`
