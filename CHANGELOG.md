# @ayumuwall/openspec 変更履歴

OpenSpec-J（Fission-AI/OpenSpec の日本語フォーク）の公式 changelog を日本語で整理したものです。本プロジェクトで行った変更は **[OpenSpec-J]** タグで記載しています。


## 0.23.0-1

- **[OpenSpec-J]** README の OpenSpec-J 独自文（ローカライズ版の位置づけ/同期元表記）を整理し、補足注釈を追記。
- **[OpenSpec-J]** README の「仕組み」補足（ソース・オブ・トゥルース解説）を復元し、維持用マーカーを追加。
- **[OpenSpec-J]** README と docs のコード例内に残っていた英文を日本語化し、対話例ラベルを日本語表記に統一。
- **[OpenSpec-J]** schema/OPSX 関連 docs の英語例・注記を日本語化。
- **[OpenSpec-J]** upstream 追従手順に README の同期元表記と補足マーカー維持のチェック項目を追記。

## 1.0.2

### Patch Changes

- [#596](https://github.com/Fission-AI/OpenSpec/pull/596) [`e91568d`](https://github.com/Fission-AI/OpenSpec/commit/e91568deb948073f3e9d9bb2d2ab5bf8080d6cf4) Thanks [@TabishB](https://github.com/TabishB)! - ### Bug Fixes

  - Clarified spec naming convention — Specs should be named after capabilities (`specs/<capability>/spec.md`), not changes
  - Fixed task checkbox format guidance — Tasks now clearly require `- [ ]` checkbox format for apply phase tracking

## 1.0.1

### Patch Changes

- [#587](https://github.com/Fission-AI/OpenSpec/pull/587) [`943e0d4`](https://github.com/Fission-AI/OpenSpec/commit/943e0d41026d034de66b9442d1276c01b293eb2b) Thanks [@TabishB](https://github.com/TabishB)! - ### Bug Fixes

  - Fixed incorrect archive path in onboarding documentation — the template now shows the correct path `openspec/changes/archive/YYYY-MM-DD-<name>/` instead of the incorrect `openspec/archive/YYYY-MM-DD--<name>/`

## 1.0.0

### Major Changes

- [#578](https://github.com/Fission-AI/OpenSpec/pull/578) [`0cc9d90`](https://github.com/Fission-AI/OpenSpec/commit/0cc9d9025af367faa1688a7b2606a2549053cd3f) Thanks [@TabishB](https://github.com/TabishB)! - ## OpenSpec 1.0 — The OPSX Release

  The workflow has been rebuilt from the ground up. OPSX replaces the old phase-locked `/openspec:*` commands with an action-based system where AI understands what artifacts exist, what's ready to create, and what each action unlocks.

  ### Breaking Changes

  - **Old commands removed** — `/openspec:proposal`, `/openspec:apply`, and `/openspec:archive` no longer exist
  - **Config files removed** — Tool-specific instruction files (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `project.md`) are no longer generated
  - **Migration** — Run `openspec init` to upgrade. Legacy artifacts are detected and cleaned up with confirmation.

  ### From Static Prompts to Dynamic Instructions

  **Before:** AI received the same static instructions every time, regardless of project state.

  **Now:** Instructions are dynamically assembled from three layers:

  1. **Context** — Project background from `config.yaml` (tech stack, conventions)
  2. **Rules** — Artifact-specific constraints (e.g., "propose spike tasks for unknowns")
  3. **Template** — The actual structure for the output file

  AI queries the CLI for real-time state: which artifacts exist, what's ready to create, what dependencies are satisfied, and what each action unlocks.

  ### From Phase-Locked to Action-Based

  **Before:** Linear workflow — proposal → apply → archive. Couldn't easily go back or iterate.

  **Now:** Flexible actions on a change. Edit any artifact anytime. The artifact graph tracks state automatically.

  | Command              | What it does                                         |
  | -------------------- | ---------------------------------------------------- |
  | `/opsx:explore`      | Think through ideas before committing to a change    |
  | `/opsx:new`          | Start a new change                                   |
  | `/opsx:continue`     | Create one artifact at a time (step-through)         |
  | `/opsx:ff`           | Create all planning artifacts at once (fast-forward) |
  | `/opsx:apply`        | Implement tasks                                      |
  | `/opsx:verify`       | Validate implementation matches artifacts            |
  | `/opsx:sync`         | Sync delta specs to main specs                       |
  | `/opsx:archive`      | Archive completed change                             |
  | `/opsx:bulk-archive` | Archive multiple changes with conflict detection     |
  | `/opsx:onboard`      | Guided 15-minute walkthrough of complete workflow    |

  ### From Text Merging to Semantic Spec Syncing

  **Before:** Spec updates required manual merging or wholesale file replacement.

  **Now:** Delta specs use semantic markers that AI understands:

  - `## ADDED Requirements` — New requirements to add
  - `## MODIFIED Requirements` — Partial updates (add scenario without copying existing ones)
  - `## REMOVED Requirements` — Delete with reason and migration notes
  - `## RENAMED Requirements` — Rename preserving content

  Archive parses these at the requirement level, not brittle header matching.

  ### From Scattered Files to Agent Skills

  **Before:** 8+ config files at project root + slash commands scattered across 21 tool-specific locations with different formats.

  **Now:** Single `.claude/skills/` directory with YAML-fronted markdown files. Auto-detected by Claude Code, Cursor, Windsurf. Cross-editor compatible.

  ### New Features

  - **Onboarding skill** — `/opsx:onboard` walks new users through their first complete change with codebase-aware task suggestions and step-by-step narration (11 phases, ~15 minutes)

  - **21 AI tools supported** — Claude Code, Cursor, Windsurf, Continue, Gemini CLI, GitHub Copilot, Amazon Q, Cline, RooCode, Kilo Code, Auggie, CodeBuddy, Qoder, Qwen, CoStrict, Crush, Factory, OpenCode, Antigravity, iFlow, and Codex

  - **Interactive setup** — `openspec init` shows animated welcome screen and searchable multi-select for choosing tools. Pre-selects already-configured tools for easy refresh.

  - **Customizable schemas** — Define custom artifact workflows in `openspec/schemas/` without touching package code. Teams can share workflows via version control.

  ### Bug Fixes

  - Fixed Claude Code YAML parsing failure when command names contained colons
  - Fixed task file parsing to handle trailing whitespace on checkbox lines
  - Fixed JSON instruction output to separate context/rules from template — AI was copying constraint blocks into artifact files

  ### Documentation

  - New getting-started guide, CLI reference, concepts documentation
  - Removed misleading "edit mid-flight and continue" claims that weren't implemented
  - Added migration guide for upgrading from pre-OPSX versions

## 0.23.0

- **[OpenSpec-J]** schema/feedback コマンドの CLI 文言と補完、関連スキル手順を日本語化。
- **[OpenSpec-J]** プロジェクト設定の警告/コメント/デモガイドを日本語化し、関連テスト期待値を更新。
- **[OpenSpec-J]** 仕様テンプレート/AGENTS/スキーマの規範文ルールを日本語向けに統一（文末括弧と語尾を固定）。
- **[OpenSpec-J]** 日本語要件の規範文を「〜しなければならない。(SHALL/MUST)」形式に統一し、SHOULD/MAY は補足に限定する指示を追加。

### マイナー変更

- [#540](https://github.com/Fission-AI/OpenSpec/pull/540) [`c4cfdc7`](https://github.com/Fission-AI/OpenSpec/commit/c4cfdc7c499daef30d8a218f5f59b8d9e5adb754) Thanks [@TabishB](https://github.com/TabishB)! - ### 新機能

  - **bulk-archive スキル** — `/opsx:bulk-archive` で複数の変更を一括アーカイブ。バッチ検証、仕様衝突検出、統合確認を含む

  ### その他

  - **セットアップ簡略化** — config 作成が対話式ではなく、合理的なデフォルトとコメント付きで生成される

## 0.22.0

### マイナー変更

- [#530](https://github.com/Fission-AI/OpenSpec/pull/530) [`33466b1`](https://github.com/Fission-AI/OpenSpec/commit/33466b1e2a6798bdd6d0e19149173585b0612e6f) Thanks [@TabishB](https://github.com/TabishB)! - プロジェクト設定/プロジェクト内スキーマ/スキーマ管理コマンドを追加

  **新機能**

  - **プロジェクト設定** — `openspec/config.yaml` でプロジェクト単位の挙動を設定（ルール注入、コンテキスト、スキーマ解決設定）
  - **プロジェクト内スキーマ** — `openspec/schemas/` にカスタムアーティファクトスキーマを定義
  - **スキーマ管理コマンド** — `openspec schema` コマンド（`list`, `show`, `export`, `validate`）でスキーマの確認と管理（実験的）

  **修正**

  - プロジェクト設定の `rules` が null の場合でも読み込み可能に修正

## 0.21.0

### マイナー変更

- [#516](https://github.com/Fission-AI/OpenSpec/pull/516) [`b5a8847`](https://github.com/Fission-AI/OpenSpec/commit/b5a884748be6156a7bb140b4941cfec4f20a9fc8) Thanks [@TabishB](https://github.com/TabishB)! - フィードバックコマンドと Nix flake サポートを追加

  **新機能**

  - **フィードバックコマンド** — `openspec feedback` で CLI から直接フィードバックを送信し、GitHub Issue を自動作成（メタデータ付与、手動送信へのフォールバック付き）
  - **Nix flake サポート** — `flake.nix` を追加し、Nix での導入/開発と CI 検証を提供

  **修正**

  - **Explore モードのガードレール** — 実装を明示的に禁止し、思考・探索に集中できるよう改善（アーティファクト作成は許可）

  **その他**

  - `opsx apply` の変更推論を改善 — 会話文脈から変更対象を自動推論し、曖昧なら選択を促す
  - アーカイブ時の同期判定を改善し、差分仕様の場所案内を明確化

## 0.20.0

- **[OpenSpec-J]** v0.20.0 追従のため、README/AGENTS テンプレート/スラッシュコマンドの説明文を更新。
- **[OpenSpec-J]** `openspec/AGENTS.md` と `openspec/project.md` の日本語テンプレートを更新。
- **[OpenSpec-J]** PowerShell 補完のヘッダーと表示文言を日本語化。
- **[OpenSpec-J]** `/opsx:verify` と関連するテンプレートの日本語化を反映。
- **[OpenSpec-J]** 追加/更新されたテンプレート・CLI 文言の翻訳に合わせてテスト期待値を更新。

### マイナー変更

- [#502](https://github.com/Fission-AI/OpenSpec/pull/502) [`9db74aa`](https://github.com/Fission-AI/OpenSpec/commit/9db74aa5ac6547efadaed795217cfa17444f2004) Thanks [@TabishB](https://github.com/TabishB)! - ### 新機能

  - **`/opsx:verify` コマンド** — 変更実装が仕様と一致しているか検証する

  ### 修正

  - vitest のワーカ並列数を制限し、プロセスが暴走する問題を修正
  - 検証コマンドが非対話モードで実行されるように修正
  - PowerShell 補完生成で末尾カンマが残る問題を修正

## 0.19.0

- **[OpenSpec-J]** Bash/Fish/PowerShell 補完の案内・警告・自動設定メッセージを日本語化し、関連テストを更新。
- **[OpenSpec-J]** Continue/CodeBuddy/`/opsx:explore` など v0.19.0 追加スラッシュコマンド/テンプレートの説明文を日本語化。
- **[OpenSpec-J]** テレメトリの初回通知・ヘルプ文言と README/CHANGELOG の案内を日本語化。

### マイナー変更

- eb152eb: ### 新機能

  - **Continue IDE 対応** – OpenSpec が [Continue](https://continue.dev/) 向けのスラッシュコマンドを生成し、Cursor/Windsurf/Claude Code などと並ぶ統合先を拡充
  - **Bash/Fish/PowerShell のシェル補完** – `openspec completion install` で好みのシェルにタブ補完を設定
  - **`/opsx:explore` コマンド** – 変更に着手する前にアイデアを探索・検討するための思考パートナー
  - **CodeBuddy スラッシュコマンド改善** – 互換性向上のため frontmatter 形式を更新

  ### 修正

  - サブコマンドがある場合でも、親階層のフラグ（`--help` など）を補完するよう修正
  - Windows のテスト互換性問題を修正

  ### その他

  - OpenSpec の利用状況を把握するための匿名利用統計を任意で追加。デフォルトは **オプトアウト** 方式で、`OPENSPEC_TELEMETRY=0` または `DO_NOT_TRACK=1` で無効化できます。収集対象はコマンド名とバージョンのみで、引数・パス・内容は収集しません。CI 環境では自動的に無効化されます。

## 0.18.0

- **[OpenSpec-J]** 実験的アーティファクトワークフロー（`/opsx:ff`/`/opsx:sync`/`/opsx:archive` など）の CLI 表示を日本語化し、関連テストを更新。
- **[OpenSpec-J]** `docs/experimental-workflow.md` を日本語化。
- **[OpenSpec-J]** spec-driven スキーマの apply 指示を日本語化。

### マイナー変更

- 8dfd824: OPSX 実験的ワークフローコマンドとアーティファクトシステムの拡張を追加

  **新しいコマンド:**

  - `/opsx:ff` - アーティファクト作成を早送りし、必要なアーティファクトを一括生成
  - `/opsx:sync` - 変更の仕様差分をメイン仕様に同期
  - `/opsx:archive` - 完了した変更をスマートな同期チェック付きでアーカイブ

  **アーティファクトワークフローの強化:**

  - スキーマ認識の apply 指示（インラインガイド付き、XML 出力）
  - 実験的アーティファクトワークフロー向けのスキーマ選択（エージェント）
  - `.openspec.yaml` による変更ごとのスキーマメタデータ
  - 実験的アーティファクトワークフロー向け Agent Skills
  - テンプレート読み込みと変更コンテキストのための instruction loader
  - スキーマをテンプレート同梱のディレクトリ構成に再編

  **改善:**

  - list コマンドに最終更新日時とソートを追加
  - ワークフロー支援のための変更作成ユーティリティを追加

  **修正:**

  - クロスプラットフォームの glob 互換性のためパスを正規化
  - 新規仕様ファイル作成時に REMOVED 要件を許可

## 0.17.2

- **[OpenSpec-J]** CLI 出力/エラー/ヘルプ/スピナー文言の日本語化と関連テストの期待値更新。
- **[OpenSpec-J]** テンプレート（`openspec/AGENTS.md`/`openspec/project.md`/`src/core/templates/*`）とスラッシュコマンド文面の日本語化・表記統一。
- **[OpenSpec-J]** README/運用ドキュメントの日本語化、図表の ASCII/レイアウト調整、プロジェクト案内文の整備。
- **[OpenSpec-J]** 用語統一（capability→機能）と表記ゆれの整理。
- **[OpenSpec-J]** バリデーション/デプリケーション周りの日本語ガイド強化（英日両対応のトリガー追加、集中管理）。
- **[OpenSpec-J]** ローカライズ運用ルールの整理（差分分類、changelog 方針、セッションメモ運用、参照指針）。
- `validate` コマンドの `--no-interactive` がスピナー無効化に正しく効くよう修正し、pre-commit フックや CI のハングを防止。

## 0.17.1

- `config` コマンドで pre-commit フックがハングする問題を修正（`@inquirer/prompts` を動的 import に変更）。
- 静的 import の回帰を防ぐため ESLint を追加。

## 0.17.0

### マイナー変更

- 2e71835: ### 新機能

  - `openspec config` コマンドを追加
  - XDG Base Directory 仕様に従うグローバル設定ディレクトリを追加
  - Oh My Zsh 対応のシェル補完を追加

  ### 修正

  - pre-commit フックのハングを回避するため動的 import に切り替え
  - `XDG_CONFIG_HOME` の尊重を全プラットフォームで徹底
  - zsh-installer テストの Windows 互換性を改善
  - `cli-completion` 仕様を実装に合わせて更新
  - スラッシュコマンドのハードコードされた agent フィールドを削除

  ### ドキュメント

  - README の AI ツール一覧をアルファベット順に整理し、折りたたみ表示に対応

## 0.16.0

- **[OpenSpec-J]** CHANGELOG を OpenSpec-J 用に統一し、日本語 changelog を単一化。
- **[OpenSpec-J]** 初版。upstream v0.16.0 をベースに、CLI 出力・テンプレート・AGENTS・スラッシュコマンド文面・デプリケーション警告などを日本語化。
- iFlow CLI・Antigravity など新規 AI ツール連携を追加し、スラッシュコマンド生成を強化。
- `init` 後に IDE 再起動が必要な場合の案内を追記。
- Qwen Code の TOML コマンド生成を修正し、変更提案のガイドラインを改善（設計先行の方針を明確化）。

## 未リリース

### マイナー変更

- Continue のスラッシュコマンド対応。`openspec init` が `.continue/prompts/openspec-*.prompt` を MARKDOWN frontmatter と `$ARGUMENTS` プレースホルダー付きで生成し、`openspec update` で更新します。
- Antigravity のスラッシュコマンド対応。`openspec init` が `.agent/workflows/openspec-*.md` を description-only frontmatter 付きで生成し、`openspec update` が Windsurf と同様に既存ワークフローを更新します。

## 0.15.0

- Gemini CLI、RooCode、Cline のワークフロー修正など多数の AI アシスタント連携を追加。
- Qwen Code, Qoder, CoStrict など新ツール対応。`apply` コマンドに `$ARGUMENTS` 変数を導入。
- テンプレート再生成の不具合を修正し、タイトル欠落時は change-id をデフォルト使用。

## 0.14.0

- CodeBuddy, CodeRabbit, Cline, Crush, Auggie など複数アシスタントのサポートを追加。
- アーカイブとデルタ検証を改良（ヘッダーの大文字小文字対応、`--no-validate` の尊重など）。
- VS Code devcontainer 追加、スラッシュコマンド文書を拡充。

## 0.13.0

- Amazon Q Developer CLI 連携を追加（`.amazonq/prompts/` にプロンプト生成）。

## 0.12.0

- スラッシュコマンドを関数として定義できる「ファクトリ関数」対応を追加。
- `openspec init` に非対話フラグ `--tools`, `--all-tools`, `--skip-tools` を追加。

## 0.11.0

- Codex / GitHub Copilot で YAML frontmatter + `$ARGUMENTS` を用いたスラッシュコマンドをサポート。

## 0.10.0

- `init` ウィザードの Enter キー動作を改善。

## 0.9.2

- パス解決のクロスプラットフォーム問題を修正。

## 0.9.1

- Windows 環境で Codex 連携が動作しない問題を修正。
