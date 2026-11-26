# Scope (upstream-v2.1.0 → upstream-v2.2.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

2026-11-26 に対象48件の反映をファイルごとに再確認した。`pnpm build`、`pnpm test`、`pnpm lint` が成功した。全体テストは6,546件成功、20件スキップ、失敗0件。

スキップされた旧公開版からの移行テスト19件は、`OPENSPEC_RELEASE_UPGRADES=1` を指定して別途実行し、すべて成功した。

日本語の CLI ヘルプ、一時プロジェクトへのスキル7個と参照ファイル3件の生成、`validate --strict` による一時仕様1件の検証が成功した。

リポジトリ全体の厳密検証は48件中42件成功、6件失敗。500文字を超える要件文の警告があり、本家 v2.2.0 でも同じ項目と位置で再現した。

## docs

- [x] M CHANGELOG.md
- [x] M docs-lab/README.md
- [x] M docs-lab/customize/profiles.md
- [x] M docs-lab/help/upgrade-to-2-1.md
- [x] M docs-lab/help/upgrade-to-2.md
- [x] M docs-lab/reference/cli.md
- [x] M docs-lab/reference/skills.md
- [x] M docs-lab/reference/supported-tools.md
- [x] M docs-lab/start/installation.md
- [x] M docs-lab/start/quickstart.md
- [x] M docs-lab/start/setup.md

## OPSX スキル

- [x] M src/core/templates/skill-templates.ts
- [x] M src/core/templates/types.ts
- [x] M src/core/templates/workflows/archive-change.ts
- [x] M src/core/templates/workflows/continue-change.ts
- [x] A src/core/templates/workflows/router.ts
- [x] M skills/openspec-archive-change/SKILL.md
- [x] M skills/openspec-continue-change/SKILL.md
- [x] A skills/openspec/SKILL.md
- [x] A skills/openspec/references/answers.md
- [x] A skills/openspec/references/where-things-stand.md
- [x] A skills/openspec/references/without-skills.md

## artifact engine

- [x] M src/core/parsers/requirement-blocks.ts
- [x] M src/core/specs-apply.ts
- [x] M src/core/validation/validator.ts

## init・オンボーディング

- [x] M src/core/config.ts
- [x] M src/core/global-skills.ts
- [x] M src/core/init.ts
- [x] M src/core/migration.ts
- [x] M src/core/profile-sync-drift.ts
- [x] M src/core/profiles.ts
- [x] M src/core/released-output-sweep.ts
- [x] M src/core/shared-skill-target.ts
- [x] M src/core/shared/index.ts
- [x] M src/core/shared/shared-skill-install.ts
- [x] M src/core/shared/skill-generation.ts
- [x] M src/core/skill-installer.ts
- [x] M src/core/update.ts

## CLI

- [x] M src/commands/install-standalone.ts
- [x] M src/core/version-check.ts

## その他

- [x] M flake.nix
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M scripts/binary/install.ps1
- [x] M scripts/generate-skillssh.mjs
- [x] M scripts/parity-hash-shared.mjs
- [x] M scripts/regen-parity-hashes.mjs
- [x] M src/utils/command-references.ts

## 翻訳対象外

M openspec/specs/opsx-archive-skill/spec.md
M test/commands/config-profile.test.ts
M test/commands/install-standalone.test.ts
M test/commands/profile-handoffs.test.ts
M test/core/archive.test.ts
M test/core/global-skills.test.ts
M test/core/init.test.ts
M test/core/parsers/unapplied-content.test.ts
M test/core/profile-sync-drift.test.ts
M test/core/profiles.test.ts
M test/core/project-skills-vercel.test.ts
A test/core/router-skill.test.ts
M test/core/shared-skill-target.test.ts
M test/core/shared/skill-generation.test.ts
M test/core/shared/tool-detection.test.ts
M test/core/skills-2-0-hardening.test.ts
A test/core/templates/archive-existing-target.test.ts
M test/core/templates/one-text-per-skill.test.ts
M test/core/templates/project-root-guard.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/templates/skillssh-parity.test.ts
M test/core/templates/workflow-verb-triggers.test.ts
M test/core/update.test.ts
M test/core/validation.test.ts
M test/core/version-check.test.ts
M test/core/warp.test.ts
M website/docs.sync.config.mjs
M website/package.json
M website/pnpm-lock.yaml
