# Scope (upstream-v1.3.0 -> upstream-v1.3.1)

※ 進捗管理用。各項目の `- [ ]` を更新して利用する。

## docs

- [x] M CHANGELOG.md
- [x] M README.md
- [x] M docs/cli.md

## CLI / workflow

- [x] M src/commands/workflow/instructions.ts
- [x] M src/commands/workflow/shared.ts
- [x] M src/commands/workflow/status.ts
- [x] M src/commands/workflow/templates.ts

## artifact engine

- [x] M src/core/artifact-graph/index.ts
- [x] M src/core/artifact-graph/instruction-loader.ts
- [x] A src/core/artifact-graph/outputs.ts
- [x] M src/core/artifact-graph/state.ts

## parsers / validation

- [x] M src/core/parsers/change-parser.ts
- [x] M src/core/parsers/markdown-parser.ts
- [x] A src/core/parsers/spec-structure.ts
- [x] M src/core/specs-apply.ts
- [x] M src/core/validation/validator.ts

## templates

- [x] M src/core/templates/workflows/apply-change.ts
- [x] M src/core/templates/workflows/verify-change.ts

## telemetry

- [x] M src/telemetry/config.ts
- [x] M src/telemetry/index.ts

## その他

- [x] M package.json
- [x] M src/utils/file-system.ts

## 翻訳棚卸し

- [x] M src/core/templates/workflows/archive-change.ts
- [x] M src/core/templates/workflows/bulk-archive-change.ts
- [x] M src/core/templates/workflows/onboard.ts
- [x] M test/core/templates/skill-templates-parity.test.ts

## テスト期待値

- [x] M test/core/archive.test.ts
- [x] M test/core/validation.test.ts

## 翻訳対象外

M openspec/explorations/explore-workflow-ux.md
M openspec/explorations/workspace-architecture.md
A openspec/explorations/workspace-roadmap.md
A openspec/explorations/workspace-user-journeys.md
A openspec/explorations/workspace-ux-simplification.md
M openspec/specs/cli-artifact-workflow/spec.md
M openspec/specs/cli-update/spec.md
M openspec/specs/openspec-conventions/spec.md
M test/cli-e2e/basic.test.ts
M test/commands/artifact-workflow.test.ts
A test/core/artifact-graph/outputs.test.ts
M test/core/parsers/markdown-parser.test.ts
M test/specs/source-specs-normalization.test.ts
M test/telemetry/config.test.ts
M test/telemetry/index.test.ts
M test/utils/file-system.test.ts
