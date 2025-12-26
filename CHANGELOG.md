# @ayumuwall/openspec 変更履歴

OpenSpec-J（Fission-AI/OpenSpec の日本語フォーク）の公式 changelog です。以降のリリースはこのファイルで管理します。過去の項目は upstream @fission-ai/openspec の履歴を日本語で整理したものです。

## 0.17.2

- `validate` コマンドの `--no-interactive` がスピナー無効化に正しく効くよう修正し、pre-commit フックや CI のハングを防止。

## 0.17.1

- `config` コマンドで pre-commit フックがハングする問題を修正（`@inquirer/prompts` を動的 import に変更）。
- 静的 import の回帰を防ぐため ESLint を追加。

## 0.17.0

- `openspec config` コマンドを追加。
- XDG Base Directory 仕様に従うグローバル設定ディレクトリを追加。
- Oh My Zsh 対応のシェル補完（Zsh）を追加。
- pre-commit フックのハングを回避するため動的 import に切り替え。
- `XDG_CONFIG_HOME` の尊重を全プラットフォームで徹底。
- zsh-installer テストの Windows 互換性を改善。
- `cli-completion` 仕様を実装に合わせて更新。
- スラッシュコマンドのハードコードされた agent フィールドを削除。
- README の AI ツール一覧をアルファベット順に整理し、折りたたみ表示に対応。

## 0.17.2

### Patch Changes

- 455c65f: Fix `--no-interactive` flag in validate command to properly disable spinner, preventing hangs in pre-commit hooks and CI environments

## 0.17.1

### Patch Changes

- a2757e7: Fix pre-commit hook hang issue in config command by using dynamic import for @inquirer/prompts

  The config command was causing pre-commit hooks to hang indefinitely due to stdin event listeners being registered at module load time. This fix converts the static import to a dynamic import that only loads inquirer when the `config reset` command is actually used interactively.

  Also adds ESLint with a rule to prevent static @inquirer imports, avoiding future regressions.

## 0.17.0

### Minor Changes

- 2e71835: ### New Features

  - Add `openspec config` command for managing global configuration settings
  - Implement global config directory with XDG Base Directory specification support
  - Add Oh-my-zsh shell completions support for enhanced CLI experience

  ### Bug Fixes

  - Fix hang in pre-commit hooks by using dynamic imports
  - Respect XDG_CONFIG_HOME environment variable on all platforms
  - Resolve Windows compatibility issues in zsh-installer tests
  - Align cli-completion spec with implementation
  - Remove hardcoded agent field from slash commands

  ### Documentation

  - Alphabetize AI tools list in README and make it collapsible

## 0.16.0

- [OpenSpec-J] CHANGELOG を OpenSpec-J 用に統一し、日本語 changelog を単一化。
- [OpenSpec-J] 初版。upstream v0.16.0 をベースに、CLI 出力・テンプレート・AGENTS・スラッシュコマンド文面・デプリケーション警告などを日本語化。
- iFlow CLI・Antigravity など新規 AI ツール連携を追加し、スラッシュコマンド生成を強化。
- `init` 後に IDE 再起動が必要な場合の案内を追記。
- Qwen Code の TOML コマンド生成を修正、プロポーザルのガイドラインを改善。

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
