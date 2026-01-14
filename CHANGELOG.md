# @ayumuwall/openspec 変更履歴

OpenSpec-J（Fission-AI/OpenSpec の日本語フォーク）の公式 changelog を日本語で整理したものです。本プロジェクトで行った変更は **[OpenSpec-J]** タグで記載しています。


## 0.20.0

- **[OpenSpec-J]** v0.20.0 追従のため、README/AGENTS テンプレート/スラッシュコマンドの説明文を更新。
- **[OpenSpec-J]** PowerShell 補完のヘッダーと表示文言を日本語化。

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

- `openspec config` コマンドを追加。
- XDG Base Directory 仕様に従うグローバル設定ディレクトリを追加。
- Oh My Zsh 対応のシェル補完（Zsh）を追加。
- pre-commit フックのハングを回避するため動的 import に切り替え。
- `XDG_CONFIG_HOME` の尊重を全プラットフォームで徹底。
- zsh-installer テストの Windows 互換性を改善。
- `cli-completion` 仕様を実装に合わせて更新。
- スラッシュコマンドのハードコードされた agent フィールドを削除。
- README の AI ツール一覧をアルファベット順に整理し、折りたたみ表示に対応。

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
