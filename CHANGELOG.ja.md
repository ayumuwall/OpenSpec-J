# @fission-ai/openspec 変更履歴（日本語サマリー）

このファイルはトップレベル `CHANGELOG.md` の簡潔な日本語版です。詳細な差分・コミットハッシュは英語版を参照してください。

## 0.16.0
- iFlow CLI・Antigravity など新規 AI ツール連携を追加し、スラッシュコマンド生成を強化。
- `init` 後に IDE 再起動が必要な場合の案内を追記。
- Qwen Code の TOML コマンド生成を修正、プロポーザルのガイドラインを改善。

## Unreleased
- Antigravity 用スラッシュコマンドを `.agent/workflows/openspec-*.md` に生成し、`openspec update` で再生成するよう対応。

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

## 0.9.0
- Codex / GitHub Copilot 向けスラッシュコマンドを追加。`.github/prompts/` への生成と `$ARGUMENTS` プレースホルダに対応。

## 0.8.1
- パッケージ版と `openspec --version` の不一致を防ぐリリースガードを追加。

## 0.8.0
- Windsurf 対応を追加。Codex のグローバルディレクトリにプロンプトを直接生成するように変更。

## 0.7.0
- Kilo Code ワークフローを自動生成・更新。`AGENTS.md` の管理スタブを常にひな形を作成。

## 0.6.0
- 生成されるルートエージェント指示をスリム化し、安全にリフレッシュするフローを追加。

## 0.5.0
- Phase 1 E2E テストを導入し、CLI のクロスプラットフォーム CI マトリクスを整備。`archive` の非対話フラグなどドキュメント改善。

## 0.4.0
- CLI UX 改善のための OpenSpec 変更提案を追加。Opencode スラッシュコマンドサポートを導入。

## 0.3.0
- `openspec init` に拡張モードと複数ツール選択、対話型 `AGENTS.md` コンフィギュレータを追加。

## 0.2.0
- `openspec view` ダッシュボードを追加。`openspec diff` を廃止し `openspec show` へ誘導。
- `openspec/AGENTS.md` をリネームし、AI スラッシュコマンド生成を更新。

## 0.1.0
- 初回リリース。
