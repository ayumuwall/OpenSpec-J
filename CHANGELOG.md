# @ayumuwall/openspec 変更履歴

OpenSpec-J（Fission-AI/OpenSpec の日本語フォーク）の公式 changelog を日本語で整理したものです。本プロジェクトで行った変更は **[OpenSpec-J]** タグで記載しています。

## 1.3.0-2

- **[OpenSpec-J]** v1.3.0 追従で漏れていた upstream 書式変更を反映（`explore.ts` の ASCII 図・表パディング、`onboard.ts` のコマンド表カラム幅、`docs/workflows.md` の「（拡張モード）」見出しと `/opsx:propose` 行追加）
- **[OpenSpec-J]** v1.2.0 以前から残っていた英語メッセージを日本語化（`init.ts` の `Invalid profile` / `OpenSpec configured` / `Detected tool directories` / `Removed: ...`、`migration.ts` の移行完了ログ、`config.ts` のグローバル設定警告、`powershell-installer.ts` の各種 `Warning:` 文言）
- **[OpenSpec-J]** `skill-templates-parity` のハッシュを再計算、`config-profile` / `init` テストの期待値を日本語文言に更新
- **[OpenSpec-J]** `OPENSPEC_TELEMETRY=0 pnpm test` を実施し、`68 files / 1365 tests` の全テスト成功を確認


## 1.3.0-1

- **[OpenSpec-J]** v1.3.0 に `config` / `onboard` 周辺の日本語化漏れがありました。ご不便をおかけして申し訳ありません。
- **[OpenSpec-J]** `openspec config` の一覧表示と `config profile` 対話 UI に残っていた英語文言を日本語化
- **[OpenSpec-J]** `onboard` テンプレートのコマンド表と終了案内に残っていた英語文言を日本語化
- **[OpenSpec-J]** テスト並列実行時の衝突を避けるため、一部テストの一時ディレクトリをユニーク化
- **[OpenSpec-J]** `OPENSPEC_TELEMETRY=0 pnpm test` を実施し、`68 files / 1365 tests` の全テスト成功を確認


## 1.3.0

- **[OpenSpec-J]** v1.3.0 追従のため、README / CLI / OPSX ドキュメントの既定フローを `/opsx:propose` 中心へ更新
- **[OpenSpec-J]** Bob / Junie / Lingma / ForgeCode の追加に合わせてツール一覧・初期化ヘルプ・コマンド生成まわりの日本語化を反映
- **[OpenSpec-J]** `OpenCode` のコマンド出力先変更（`.opencode/command/` → `.opencode/commands/`）を追従し、説明文と生成先を更新
- **[OpenSpec-J]** `pi` のコマンド参照変換、GitHub Copilot 自動検出改善、補完インストールの opt-in 化に追従
- **[OpenSpec-J]** `bulk-archive` / `onboard` テンプレート更新に伴い `skill-templates-parity` のハッシュを再計算

### マイナー変更

- [#952](https://github.com/Fission-AI/OpenSpec/pull/952) [`cce787e`](https://github.com/Fission-AI/OpenSpec/commit/cce787ec4083da2b27781f6786f5ce0002909a7b) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 新機能

  - **Junie 対応** — JetBrains Junie 向けのツール/コマンド生成を追加
  - **Lingma IDE 対応** — Lingma IDE 向け設定を追加
  - **ForgeCode 対応** — ForgeCode をサポート対象ツールに追加
  - **IBM Bob 対応** — IBM Bob コーディングアシスタントをサポート対象に追加

  ### バグ修正

  - **シェル補完の opt-in 化** — 補完インストールを明示的実行のみに変更し、PowerShell のエンコード破損を修正
  - **Copilot 自動検出** — 空の `.github/` ディレクトリだけで GitHub Copilot を誤検出しないよう修正
  - **pi.dev のコマンド生成** — コマンド参照変換とテンプレート引数の受け渡しを修正

### パッチ変更

- [#760](https://github.com/Fission-AI/OpenSpec/pull/760) [`61eb999`](https://github.com/Fission-AI/OpenSpec/commit/61eb999f7c6c0fc98d2e7f3678756fce6a3f4378) [@fsilvaortiz](https://github.com/fsilvaortiz) ありがとう！ - **OpenCode アダプター** が公式ディレクトリ規約に合わせて `.opencode/commands/`（複数形）を使うよう修正 (#748)

- [#759](https://github.com/Fission-AI/OpenSpec/pull/759) [`afdca0d`](https://github.com/Fission-AI/OpenSpec/commit/afdca0d5dab1aa109cfd8848b2512333ccad60c3) [@fsilvaortiz](https://github.com/fsilvaortiz) ありがとう！ - `openspec status` が変更ゼロ件のとき致命エラーではなく正常に終了するよう修正 (#714)

## 1.2.0

- **[OpenSpec-J]** v1.2.0 追従のため、全スキルテンプレート（propose 含む）・docs・CLI メッセージを日本語化
- **[OpenSpec-J]** README の同期元バージョンを更新
- **[OpenSpec-J]** `skill-templates.ts` が `workflows/` 配下に分割されたため、各ファイルへ日本語訳を移植（propose は新規翻訳）
- **[OpenSpec-J]** `SKILL_NAMES` / `COMMAND_IDS` に `openspec-propose` を追加（文字列置換ではなくコード変更）
- **[OpenSpec-J]** `searchable-multi-select` のキーバインド変更（Tab→Enter/Space）に伴いヒント文・テスト期待値を更新
- **[OpenSpec-J]** `skill-templates-parity` テストのハッシュ検証化に対応し、日本語化後のハッシュ値を再計算・更新

### マイナー変更

- [#747](https://github.com/Fission-AI/OpenSpec/pull/747) [`1e94443`](https://github.com/Fission-AI/OpenSpec/commit/1e94443a3551b228eecbc89e95d96d3b9600a192) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 新機能

  - **プロファイルシステム** — `core`（4つの基本ワークフロー）または `custom`（任意のサブセットを選択）プロファイルからインストールするスキルを制御。新しい `openspec config profile` コマンドでプロファイルを管理
  - **Propose ワークフロー** — 一度のリクエストで設計・仕様・タスクを含む完全な変更提案を作成する新しいワンステップワークフロー。`new` + `ff` を別々に実行する必要がなくなりました
  - **AI ツール自動検出** — `openspec init` がプロジェクト内の既存ツールディレクトリ（`.claude/`、`.cursor/` 等）をスキャンし、検出されたツールを事前選択
  - **Pi (pi.dev) 対応** — Pi コーディングエージェントがプロンプトとスキル生成に対応したサポート済みツールに追加
  - **Kiro 対応** — AWS Kiro IDE がプロンプトとスキル生成に対応したサポート済みツールに追加
  - **同期時に非選択ワークフローを削除** — `openspec update` が非選択ワークフローのコマンドファイルとスキルディレクトリを削除し、プロジェクトをクリーンに保つようになりました
  - **設定ドリフト警告** — `openspec config list` がグローバル設定と現在のプロジェクトの同期がずれている場合に警告を表示

  ### バグ修正

  - 新しく初期化したプロジェクトで onboard プリフライトが「初期化されていません」という誤ったエラーを表示する問題を修正
  - archive ワークフローが同期中に途中で停止する問題を修正（同期完了後に正しく再開するよう改善）
  - onboard シェルコマンドに Windows PowerShell の代替手順を追加

## 1.1.1

- **[OpenSpec-J]** v1.1.1 追従のため、OpenCode コマンド参照の変換・update/init の日本語コメント/リンクを反映
- **[OpenSpec-J]** README の同期元バージョンを更新
- **[OpenSpec-J]** 過去の revert により、本家に含まれる Nix flake の改善（package.json 参照の動的バージョン、fileset ベースの src 範囲、update-flake.sh の運用改善）が未反映だったため修正しました。ご迷惑をおかけし申し訳ありません。

### パッチ変更

- [#627](https://github.com/Fission-AI/OpenSpec/pull/627) [`afb73cf`](https://github.com/Fission-AI/OpenSpec/commit/afb73cf9ec59c6f8b26d0c538c0218c203ba3c56) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - **OpenCode のコマンド参照** — 生成ファイル内のコマンド参照が `/opsx:` ではなく `/opsx-` のハイフン形式を使うようになり、OpenCode で正しく動作するように修正

## 1.1.0

- **[OpenSpec-J]** v1.1.0 追従のため、OPSX ドキュメント/ツール一覧/テンプレート/コマンド生成の文言を日本語化し、Codex/Windsurf の新パス仕様に合わせて説明を更新
- **[OpenSpec-J]** README の同期元バージョンを更新

### マイナー変更

- [#625](https://github.com/Fission-AI/OpenSpec/pull/625) [`53081fb`](https://github.com/Fission-AI/OpenSpec/commit/53081fb2a26ec66d2950ae0474b9a56cbc5b5a76) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - **Codex のグローバルパス対応** — Codex アダプターがグローバルパスを正しく解決し、プロジェクト外から実行した際のワークフローファイル生成の不具合を修正 (#622)
  - **クロスデバイス/制限パスでのアーカイブ** — rename が EPERM/EXDEV の場合に copy+remove にフォールバックし、ネットワーク/外部ドライブでの失敗を修正 (#605)
  - **ワークフロー完了メッセージのスラッシュコマンド案内** — 次のステップのヒントを表示 (#603)
  - **Windsurf ワークフローファイルパス** — `commands` ではなく `workflows` を使うよう修正 (#610)

### パッチ変更

- [#550](https://github.com/Fission-AI/OpenSpec/pull/550) [`86d2e04`](https://github.com/Fission-AI/OpenSpec/commit/86d2e04cae76a999dbd1b4571f52fa720036be0c) [@jerome-benoit](https://github.com/jerome-benoit) ありがとう！ - ### 改善

  - **Nix flake メンテナンス** — package.json から動的にバージョンを読み取り、同期作業を軽減
  - **Nix ビルド最適化** — node_modules とアーティファクトを除外し、ビルド時間を短縮
  - **update-flake.sh スクリプト** — ハッシュが既に正しい場合は再ビルドをスキップ

  ### その他

  - Nix CI アクションを最新版へ更新（nix-installer v21、magic-nix-cache v13）

## 1.0.2

- **[OpenSpec-J]** v1.0.2 の OPSX 体験を日本語で追えるようにするため、ドキュメント・CLI メッセージとテンプレートを日本語化（会話例・コードブロック含む）
- **[OpenSpec-J]** README に Codex 利用時の注釈（`openspec init` が生成するプロンプトファイルの扱い）を追記
- **[OpenSpec-J]** 新規オンボーディングスキル追加に伴う構造更新（**文字列翻訳だけでは新規スキルが検出・生成されず機能差が出るため**、`skill-templates` と `tool-detection` を整合し `openspec-onboard` の生成数を upstream と一致させた）

### パッチ変更

- [#596](https://github.com/Fission-AI/OpenSpec/pull/596) [`e91568d`](https://github.com/Fission-AI/OpenSpec/commit/e91568deb948073f3e9d9bb2d2ab5bf8080d6cf4) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - 仕様命名規則を明確化 — Specs は変更名ではなく capability 名（`specs/<capability>/spec.md`）で命名する
  - タスクのチェックボックス形式の案内を修正 — apply フェーズの追跡には `- [ ]` 形式が必須であることを明確化

## 1.0.1

### パッチ変更

- [#587](https://github.com/Fission-AI/OpenSpec/pull/587) [`943e0d4`](https://github.com/Fission-AI/OpenSpec/commit/943e0d41026d034de66b9442d1276c01b293eb2b) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - オンボーディングドキュメントのアーカイブパス誤りを修正 — テンプレートを正しい `openspec/changes/archive/YYYY-MM-DD-<name>/` に変更（誤: `openspec/archive/YYYY-MM-DD--<name>/`）

## 1.0.0

### 重大な変更

- [#578](https://github.com/Fission-AI/OpenSpec/pull/578) [`0cc9d90`](https://github.com/Fission-AI/OpenSpec/commit/0cc9d9025af367faa1688a7b2606a2549053cd3f) [@TabishB](https://github.com/TabishB) ありがとう！ - ## OpenSpec 1.0 — OPSX リリース

  ワークフローをゼロから再構築しました。OPSX は旧来のフェーズ固定 `/openspec:*` コマンドを、AI がアーティファクトの存在や作成可能状態、各アクションで何が解放されるかを理解するアクションベースの仕組みに置き換えました。

  ### 破壊的変更

  - **旧コマンドの削除** — `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` は廃止
  - **設定ファイルの削除** — ツール固有の指示ファイル（`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `project.md`）は生成されなくなった
  - **移行** — `openspec init` を実行して移行。旧アーティファクトは検出され、確認のうえでクリーンアップされる

  ### 静的プロンプトから動的指示へ

  **Before:** プロジェクト状態に関係なく、AI は毎回同じ静的指示を受け取っていた。

  **Now:** 指示は 3 層から動的に組み立てられる。

  1. **Context** — `config.yaml` からのプロジェクト背景（技術スタック、規約）
  2. **Rules** — アーティファクト固有の制約（例:「未知にはスパイクタスクを提案する」）
  3. **Template** — 出力ファイルの実際の構造

  AI は CLI にリアルタイム状態を問い合わせ、存在するアーティファクト、作成可能なもの、満たされた依存関係、各アクションが解放する内容を把握する。

  ### フェーズ固定からアクションベースへ

  **Before:** proposal → apply → archive の直線ワークフローで、戻ったり反復したりが難しかった。

  **Now:** 変更に対して柔軟にアクションできる。どのアーティファクトもいつでも編集可能で、状態はアーティファクトグラフが自動追跡する。

  | コマンド             | 内容                                                 |
  | -------------------- | ---------------------------------------------------- |
  | `/opsx:explore`      | 変更に着手する前にアイデアを検討する                 |
  | `/opsx:new`          | 新しい変更を開始する                                 |
  | `/opsx:continue`     | 1 つずつアーティファクトを作成する（ステップ実行）    |
  | `/opsx:ff`           | 計画系アーティファクトをまとめて作成する（高速化）    |
  | `/opsx:apply`        | タスクを実装する                                     |
  | `/opsx:verify`       | 実装がアーティファクトと一致するか検証する           |
  | `/opsx:sync`         | 差分仕様をメイン仕様へ同期する                       |
  | `/opsx:archive`      | 完了した変更をアーカイブする                         |
  | `/opsx:bulk-archive` | 複数の変更を競合検出付きで一括アーカイブする         |
  | `/opsx:onboard`      | 15 分で完走するワークフローのガイド付き体験           |

  ### 文字列マージから意味的な仕様同期へ

  **Before:** 仕様更新は手動マージかファイル丸ごとの置き換えが必要だった。

  **Now:** 差分仕様は AI が理解できる意味的マーカーを使う。

  - `## ADDED Requirements` — 追加する要件
  - `## MODIFIED Requirements` — 既存要件の部分更新（既存内容を残したままシナリオ追加など）
  - `## REMOVED Requirements` — 理由と移行メモ付きで削除
  - `## RENAMED Requirements` — 内容を保持したまま名称変更

  アーカイブ時は要件単位で解析し、脆い見出し一致に依存しない。

  ### 散在ファイルから Agent Skills へ

  **Before:** プロジェクトルートに 8+ の設定ファイルがあり、スラッシュコマンドは 21 のツール固有場所に異なる形式で散在していた。

  **Now:** `.claude/skills/` に YAML フロント付き Markdown を集約。Claude Code / Cursor / Windsurf が自動検出し、エディタ横断で互換。

  ### 新機能

  - **オンボーディングスキル** — `/opsx:onboard` がコードベースを踏まえたタスク提案と手順解説で初回の変更完走を案内（11 フェーズ、約 15 分）

  - **21 の AI ツールに対応** — Claude Code, Cursor, Windsurf, Continue, Gemini CLI, GitHub Copilot, Amazon Q, Cline, RooCode, Kilo Code, Auggie, CodeBuddy, Qoder, Qwen, CoStrict, Crush, Factory, OpenCode, Antigravity, iFlow, Codex

  - **対話式セットアップ** — `openspec init` でアニメーション付きウェルカム画面と検索可能な複数選択を表示。既存設定済みツールは事前選択され、再生成が容易。

  - **カスタマイズ可能なスキーマ** — `openspec/schemas/` に独自ワークフローを定義でき、パッケージコードに触れずに運用可能。チームでバージョン管理共有できる。

  ### バグ修正

  - コマンド名にコロンが含まれる場合の Claude Code YAML パース失敗を修正
  - タスクファイル解析でチェックボックス行の末尾空白を許容するよう修正
  - JSON 指示出力で context/rules と template を分離するよう修正 — AI が制約ブロックをアーティファクトに写してしまう問題を解消

  ### ドキュメント

  - Getting Started ガイド、CLI リファレンス、コンセプト解説を追加
  - 未実装だった「途中で編集して続行できる」といった誤解を招く記述を削除
  - OPSX 以前のバージョンからの移行ガイドを追加

## 0.23.0-1

- **[OpenSpec-J]** README の OpenSpec-J 独自文（ローカライズ版の位置づけ/同期元表記）を整理し、補足注釈を追記。
- **[OpenSpec-J]** README の「仕組み」補足（ソース・オブ・トゥルース解説）を復元し、維持用マーカーを追加。
- **[OpenSpec-J]** README と docs のコード例内に残っていた英文を日本語化し、対話例ラベルを日本語表記に統一。
- **[OpenSpec-J]** schema/OPSX 関連 docs の英語例・注記を日本語化。
- **[OpenSpec-J]** upstream 追従手順に README の同期元表記と補足マーカー維持のチェック項目を追記。

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
