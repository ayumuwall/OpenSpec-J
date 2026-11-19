# Scope (upstream-v2.0.0 → upstream-v2.1.0)

※ 唯一の進捗台帳。上から対象ファイルを必ず1件ずつ確認・作業・差分監査し、そのファイルの作業が完了した直後にだけ `- [ ]` を `- [x]` へ更新する。

最終確認（2026-11-19）：91ファイルすべてについて、本家の変更と日本語版への反映を1件ずつ再監査した。`pnpm build`、`pnpm lint`、全体テストが成功（249ファイル成功、1ファイルスキップ／6,452テスト成功、20テストスキップ、失敗0件）。スキップは明示的な有効化が必要な公開済み旧版からの移行テスト19件と Windows 専用テスト1件。

日本語ヘルプ、一時プロジェクトへのスキル6個の生成と Claude Code からの参照、正常な仕様の厳密検証が成功。変更した表は独立した Markdown プレビューでデスクトップ幅と390px幅を確認した。website 用の依存関係インストール・ビルド・型検査・テストは実行していない。

リポジトリ全体の `validate --strict --all --json --no-interactive` は48件中42件成功、6件が要件文の500文字超の警告で失敗。本家 v2.1.0 の CLI を別ディレクトリでビルドして同じ入力を検証し、項目ごとの成否・指摘レベル・位置の一致を確認した。対象は `ai-tool-paths`、`artifact-graph`、`cli-archive`、`cli-validate`、`cli-view`、`oh-my-pi-tool`。全体の厳密検証は成功扱いにせず、翻訳対象外の仕様は変更していない。

## docs

- [x] M CHANGELOG.md
- [x] M README.md
- [x] M docs-lab/README.md
- [x] A docs-lab/help/upgrade-to-2-1.md
- [x] M docs-lab/help/upgrade-to-2.md
- [x] M docs-lab/multi-repo/stores.md
- [x] M docs-lab/reference/cli.md
- [x] M docs-lab/reference/configuration/config-json.md
- [x] M docs-lab/reference/configuration/config-yaml.md
- [x] M docs-lab/reference/configuration/environment-variables.md
- [x] M docs-lab/reference/skills.md
- [x] M docs-lab/reference/supported-tools.md
- [x] M docs-lab/start/installation.md
- [x] M docs-lab/start/setup.md
- [x] M docs/installation.md
- [x] M docs/troubleshooting.md

## OPSX スキル

- [x] M skills/openspec-apply-change/SKILL.md
- [x] M skills/openspec-archive-change/SKILL.md
- [x] M skills/openspec-bulk-archive-change/SKILL.md
- [x] M skills/openspec-continue-change/SKILL.md
- [x] M skills/openspec-explore/SKILL.md
- [x] M skills/openspec-ff-change/SKILL.md
- [x] M skills/openspec-onboard/SKILL.md
- [x] M skills/openspec-propose/SKILL.md
- [x] M skills/openspec-sync-specs/SKILL.md
- [x] M skills/openspec-update-change/SKILL.md
- [x] M skills/openspec-verify-change/SKILL.md
- [x] D src/core/templates/optional-workflow.ts
- [x] M src/core/templates/workflows/apply-change.ts
- [x] M src/core/templates/workflows/archive-change.ts
- [x] M src/core/templates/workflows/bulk-archive-change.ts
- [x] M src/core/templates/workflows/continue-change.ts
- [x] M src/core/templates/workflows/explore.ts
- [x] M src/core/templates/workflows/ff-change.ts
- [x] M src/core/templates/workflows/new-change.ts
- [x] M src/core/templates/workflows/onboard.ts
- [x] M src/core/templates/workflows/propose.ts
- [x] M src/core/templates/workflows/update-change.ts

## コマンド生成

- [x] M src/core/command-generation/generator.ts

## init・オンボーディング

- [x] A src/core/global-skills.ts
- [x] M src/core/init.ts
- [x] A src/core/known-projects.ts
- [x] M src/core/migration.ts
- [x] M src/core/profile-sync-drift.ts
- [x] A src/core/project-dir.ts
- [x] A src/core/project-skills-scope.ts
- [x] M src/core/released-output-sweep.ts
- [x] M src/core/shared-skill-target.ts
- [x] M src/core/shared/command-reconcile.ts
- [x] M src/core/shared/generated-fingerprint.ts
- [x] D src/core/shared/own-skill-texts.ts
- [x] M src/core/shared/shared-skill-install.ts
- [x] M src/core/shared/skill-generation.ts
- [x] M src/core/shared/skill-links.ts
- [x] M src/core/shared/skill-paths.ts
- [x] M src/core/shared/tool-detection.ts
- [x] A src/core/skill-installer.ts
- [x] M src/core/update-plan.ts
- [x] M src/core/update.ts

## CLI

- [x] M src/cli/index.ts

## その他

- [x] M .agents/skills/draft-openspec-docs/SKILL.md
- [x] M .agents/skills/release-openspec/SKILL.md
- [x] M .agents/skills/verify-openspec-docs/SKILL.md
- [x] M .agents/skills/write-openspec-docs/SKILL.md
- [x] M .devcontainer/README.md
- [x] M .github/workflows/binaries.yml
- [x] M .github/workflows/ci.yml
- [x] M .github/workflows/release-prepare.yml
- [x] M .github/workflows/security.yml
- [x] M CONTRIBUTING.md
- [x] M LICENSE
- [x] M flake.nix
- [x] M install.md
- [x] M package.json
- [x] M pnpm-lock.yaml
- [x] M scripts/binary/build.mjs
- [x] M scripts/binary/install.ps1
- [x] M scripts/binary/install.sh
- [x] M scripts/binary/smoke.sh
- [x] M scripts/generate-skillssh.mjs
- [x] M scripts/skillssh-shared.mjs
- [x] M src/core/completion-tip.ts
- [x] M src/core/completions/command-registry.ts
- [x] M src/core/config-schema.ts
- [x] M src/core/config.ts
- [x] M src/core/github-copilot/cloud-agent.ts
- [x] M src/core/global-config.ts
- [x] M src/core/project-config.ts
- [x] M src/utils/spec-path-containment.ts
- [x] M vitest.config.ts
- [x] M vitest.setup.ts

## 翻訳対象外

D openspec/changes/add-global-install-scope/design.md
D openspec/changes/add-global-install-scope/proposal.md
D openspec/changes/add-global-install-scope/specs/ai-tool-paths/spec.md
D openspec/changes/add-global-install-scope/specs/cli-config/spec.md
D openspec/changes/add-global-install-scope/specs/cli-init/spec.md
D openspec/changes/add-global-install-scope/specs/cli-update/spec.md
D openspec/changes/add-global-install-scope/specs/command-generation/spec.md
D openspec/changes/add-global-install-scope/specs/global-config/spec.md
D openspec/changes/add-global-install-scope/specs/installation-scope/spec.md
D openspec/changes/add-global-install-scope/tasks.md
R050 openspec/changes/add-global-install-scope/.openspec.yaml openspec/changes/install-skills-globally/.openspec.yaml
A openspec/changes/install-skills-globally/design.md
A openspec/changes/install-skills-globally/proposal.md
A openspec/changes/install-skills-globally/specs/cli-init/spec.md
A openspec/changes/install-skills-globally/specs/cli-update/spec.md
A openspec/changes/install-skills-globally/tasks.md
M openspec/config.yaml
M test/cli-e2e/basic.test.ts
M test/cli-e2e/update-dry-run.test.ts
M test/cli-e2e/upgrade-from-releases.test.ts
M test/commands/profile-handoffs.test.ts
M test/core/available-tools.test.ts
A test/core/global-skills.test.ts
M test/core/init.test.ts
A test/core/known-projects.test.ts
M test/core/profile-sync-drift.test.ts
A test/core/project-skills-scope.test.ts
A test/core/project-skills-vercel.test.ts
M test/core/shared/profile-workflow-references.test.ts
M test/core/shared/skill-links.test.ts
M test/core/shared/skill-paths.test.ts
M test/core/shared/tool-detection.test.ts
M test/core/skills-2-0-hardening.test.ts
M test/core/templates/archive-task-progress.test.ts
M test/core/templates/explore.test.ts
M test/core/templates/glob-path-bounding.test.ts
M test/core/templates/list-json-contract.test.ts
A test/core/templates/one-text-per-skill.test.ts
D test/core/templates/optional-workflow.test.ts
D test/core/templates/profile-handoffs.test.ts
M test/core/templates/propose.test.ts
M test/core/templates/skill-templates-parity.test.ts
M test/core/templates/skillssh-parity.test.ts
M test/core/templates/update-change.test.ts
M test/core/update-dry-run.test.ts
M test/core/update-skill-tamper.test.ts
M test/core/update.test.ts
M test/core/warp.test.ts
A test/fixtures/released-output/published-skills/v1.17.0-openspec-explore.md
A test/fixtures/released-output/published-skills/v2.0.0-openspec-explore.md
A test/helpers/skill-release.mjs
M test/upgrade-to-2-docs-claims.test.ts
M test/utils/command-references.test.ts
M website/docs.sync.config.mjs
M website/package.json
M website/pnpm-lock.yaml
