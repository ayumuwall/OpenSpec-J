<p align="center">
  <a href="https://github.com/Fission-AI/OpenSpec">
    <picture>
      <source srcset="assets/openspec_pixel_dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/openspec_pixel_light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/openspec_pixel_light.svg" alt="OpenSpec logo" height="64">
    </picture>
  </a>
  
</p>
<p align="center">AI コーディングアシスタントのための仕様駆動開発。</p>
<p align="center">
  <a href="https://github.com/ayumuwall/OpenSpec-J/actions/workflows/ci.yml?query=branch%3Aja-docs"><img alt="CI" src="https://github.com/ayumuwall/OpenSpec-J/actions/workflows/ci.yml/badge.svg?branch=ja-docs" /></a>
  <a href="https://www.npmjs.com/package/@ayumuwall/openspec"><img alt="npm version" src="https://img.shields.io/npm/v/@ayumuwall/openspec?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="node version" src="https://img.shields.io/node/v/@ayumuwall/openspec?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="https://conventionalcommits.org"><img alt="Conventional Commits" src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square" /></a>
  <a href="https://discord.gg/YctCnvvshC"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join%20the%20community-5865F2?logo=discord&logoColor=white&style=flat-square" /></a>
</p>

<p align="center">
  <img src="assets/openspec_dashboard.png" alt="OpenSpec dashboard preview" width="90%">
</p>

<p align="center">
  最新情報は <a href="https://x.com/0xTab">@0xTab on X</a> をフォロー · 質問やサポートは <a href="https://discord.gg/YctCnvvshC">OpenSpec Discord</a> へどうぞ。
</p>

<p align="center">
  <sub>🧪 <strong>新着:</strong> <a href="docs/experimental-workflow.md">実験的ワークフロー (OPSX)</a> — スキーマ駆動で柔軟に拡張でき、流動的。コード変更なしでワークフローを反復できます。</sub>
</p>

# OpenSpec

このリポジトリは、[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) 
をベースにした日本語ローカライズ版（OpenSpec-J）です。仕様と構成は本家を尊重しつつ、日本語利用者向けにドキュメントとメッセージを最適化しています。**現在の同期元は OpenSpec v0.19.0 です。**

OpenSpec は、仕様駆動開発で人と AI コーディングアシスタントをそろえ、コードを書く前に「何を作るか」を合意できるようにします。**API キーは不要です。**

## なぜ OpenSpec か

AI コーディングアシスタントは強力ですが、要件がチャット履歴に散らばると結果が予測しづらくなります。OpenSpec は軽量な仕様ワークフローを追加し、実装前に意図を確定させることで、レビューしやすく再現性のある成果を得られます。

得られる効果:
- 作業前に人と AI が仕様に合意する。
- 提案・タスク・仕様差分がまとまった「変更フォルダー」でスコープを明確化・監査可能にする。
- 提案中・進行中・アーカイブ済みの状態を共有で見渡せる。
- 既存の AI ツールと連携：対応ツールではスラッシュコマンド、その他はコンテキストルールで利用。

## OpenSpec の特徴（ざっくり比較）

- **軽量**: シンプルなワークフロー、API キー不要、最小セットアップ。
- **既存コード重視**: 0→1 だけでなく既存機能の改修にも強い。`openspec/specs/`（現在の真実）と `openspec/changes/`（提案中の更新）を分離し、機能間の差分を明示的に管理。
- **変更追跡**: 提案・タスク・仕様差分を同居させ、アーカイブ時に承認済みの更新を仕様へ統合。
- **spec-kit / Kiro との比較**: これらは 0→1 の新機能で強いが、OpenSpec は既存挙動を変える 1→n 改修や複数仕様にまたがる更新でも力を発揮。

詳細は [How OpenSpec Compares](#how-openspec-compares) を参照してください。

## 仕組み

```
┌──────────────────────────────┐
│ 変更提案ドラフト（下書き）       │
│ (Draft Change)               │
└───────────────┬──────────────┘
                │ AI と意図を共有
                ▼
┌──────────────────────────────┐
│ レビューと合意                  │
│ (仕様・タスク編集)              │ ◀──── フィードバックループ ────┐
└───────────────┬──────────────┘                             │
                │ 承認済み計画                                 │
                ▼                                            │
┌──────────────────────────────┐                             │
│ タスク実装                     │─────────────────────────────┘
│ (AI がコードを書く)            │
└───────────────┬──────────────┘
                │ 変更をリリース
                ▼
┌──────────────────────────────┐
│ アーカイブと仕様更新            │
│ (ソースの仕様)                 │
└──────────────────────────────┘

1. 望む仕様更新を記述した変更提案をドラフト（下書き）する。
2. AI アシスタントとレビューし、合意が取れるまで調整する。
3. 合意済み仕様を参照しながらタスクを実装する。
4. 変更をアーカイブし、承認済みの更新をソース・オブ・トゥルース※の仕様に統合する。
```

※ ソース・オブ・トゥルース（source of truth）は、その時点で「正」とみなされる唯一の仕様群を指します。OpenSpec では `openspec/specs/` 配下の仕様ファイルが該当し、承認済みの変更だけがここに反映されます。

## はじめ方

### 対応 AI ツール

<details>
<summary><strong>ネイティブのスラッシュコマンド</strong>（クリックで展開）</summary>

これらのツールには OpenSpec コマンドが組み込まれています。案内に従って OpenSpec 連携を選択してください。

| Tool | Commands |
|------|----------|
| **Amazon Q Developer** | `@openspec-proposal`, `@openspec-apply`, `@openspec-archive` (`.amazonq/prompts/`) |
| **Antigravity** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.agent/workflows/`) |
| **Auggie (Augment CLI)** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.augment/commands/`) |
| **Claude Code** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` |
| **Cline** | Workflows in `.clinerules/workflows/` directory (`.clinerules/workflows/openspec-*.md`) |
| **CodeBuddy Code (CLI)** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.codebuddy/commands/`) — see [docs](https://www.codebuddy.ai/cli) |
| **Codex** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (global: `~/.codex/prompts`, auto-installed) |
| **Continue** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.continue/prompts/`) |
| **CoStrict** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.cospec/openspec/commands/`) — see [docs](https://costrict.ai)|
| **Crush** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.crush/commands/openspec/`) |
| **Cursor** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` |
| **Factory Droid** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.factory/commands/`) |
| **Gemini CLI** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.gemini/commands/openspec/`) |
| **GitHub Copilot** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.github/prompts/`) |
| **iFlow (iflow-cli)** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.iflow/commands/`) |
| **Kilo Code** | `/openspec-proposal.md`, `/openspec-apply.md`, `/openspec-archive.md` (`.kilocode/workflows/`) |
| **OpenCode** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` |
| **Qoder (CLI)** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.qoder/commands/openspec/`) — see [docs](https://qoder.com/cli) |
| **Qwen Code** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.qwen/commands/`) |
| **RooCode** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.roo/commands/`) |
| **Windsurf** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.windsurf/workflows/`) |

Kilo Code はチームのワークフローを自動検出します。生成されたファイルを `.kilocode/workflows/` に保存し、コマンドパレットから `/openspec-proposal.md`、`/openspec-apply.md`、`/openspec-archive.md` を実行してください。

</details>

<details>
<summary><strong>AGENTS.md 互換</strong>（クリックで展開）</summary>

これらのツールは `openspec/AGENTS.md` からワークフロー手順を自動で読み込みます。必要に応じて OpenSpec ワークフローを実行するよう指示してください。詳細は [AGENTS.md convention](https://agents.md/) を参照。

| Tools |
|-------|
| Amp • Jules • Others |

</details>

### インストールと初期化

#### 前提条件
- **Node.js >= 20.19.0** - `node --version` で確認してください。

#### ステップ 1: CLI をグローバルインストール

```bash
npm install -g @ayumuwall/openspec@latest
```

インストール確認:
```bash
openspec --version
```

#### ステップ 2: プロジェクトで OpenSpec を初期化

プロジェクトディレクトリへ移動:
```bash
cd my-project
```

初期化コマンドを実行:
```bash
openspec init
```

**初期化で行われること:**
- 対応 AI ツール（Claude Code, CodeBuddy, Cursor, OpenCode, Qoder など）の選択を促されます。それ以外のアシスタントは共有の `AGENTS.md` を参照します。
- 選んだツール向けのスラッシュコマンドを自動設定し、ルートに管理対象の `AGENTS.md` を配置します。
- プロジェクト内に `openspec/` ディレクトリ構造が作成されます。

**セットアップ後:**
- 対応 AI ツールは追加設定なしで `/openspec` ワークフローを呼び出せます。
- `openspec list` を実行し、セットアップ確認とアクティブな変更の一覧を確認します。
- スラッシュコマンドがすぐに表示されない場合は、アシスタントを再起動してください。起動時にコマンドが読み込まれます。

### オプション: プロジェクトコンテキストの入力

`openspec init` 完了後、次のステップ用プロンプトが表示されます。そのまま AI ツールに貼り付けてください。:

```text
1. プロジェクトコンテキストを埋める:
   "openspec/project.md を読んで、プロジェクト/技術スタック/規約の情報を
    追記するのを手伝ってください"

2. 最初の変更提案を作る:
   "［追加したい機能］を実装したい。
    この機能の OpenSpec 変更提案を作って"

3. OpenSpec ワークフローを理解する:
   "openspec/AGENTS.md をもとに、OpenSpec のワークフローと
    このプロジェクトでの進め方を説明して"
```

`openspec/project.md` には、プロジェクト共通の規約・標準・アーキテクチャパターン・ガイドラインなどを記載してください。

### 最初の変更を作成する

以下は OpenSpec のワークフロー全体を示す実例です。どの AI ツールでも機能し、対応ツールならショートカットを自動認識します。

#### 1. 提案を書き出す
AI に変更提案の作成を依頼します:

```text
You: ロールとチームでプロフィール検索フィルターを追加する OpenSpec 変更提案を作って
     （スラッシュコマンド対応ツールなら `/openspec:proposal Add profile search filters`）

AI:  プロフィールフィルター用の OpenSpec 変更提案を作成します。
     *openspec/changes/add-profile-filters/ に proposal.md・tasks.md・spec 差分を生成*
```

#### 2. 確認とレビュー
変更が正しく作成されたか確認し、提案をレビューします:

```bash
$ openspec list                             # 変更フォルダがあるか確認
$ openspec validate add-profile-filters     # 仕様フォーマットを検証
$ openspec show add-profile-filters         # 提案・タスク・差分を確認
```

#### 3. 仕様を磨き込む
必要な状態になるまで仕様を調整します:

```text
You: ロール・チームフィルターの受け入れ条件を追加してもらえる？

AI:  仕様差分にシナリオを追加します。
     *openspec/changes/add-profile-filters/specs/profile/spec.md と tasks.md を編集*
```

#### 4. 変更を実装する
仕様が固まったら実装を始めます:

```text
You: 仕様は良さそう。この変更を実装しよう。
     （スラッシュコマンド対応ツール: `/openspec:apply add-profile-filters`）

AI:  add-profile-filters のタスクを順に進めます。
     *openspec/changes/add-profile-filters/tasks.md のタスクを実装*
     *タスク完了をチェック: Task 1.1 ✓, 1.2 ✓, 2.1 ✓...*
```

#### 5. 完了した変更をアーカイブする
実装完了後、変更をアーカイブします:

```text
AI:  すべてのタスクが完了しました。実装の準備ができています。

You: 変更をアーカイブして
     （スラッシュコマンド対応ツール: `/openspec:archive add-profile-filters`）

AI:  add-profile-filters をアーカイブします。
    *実行: openspec archive add-profile-filters --yes*
     ✓ アーカイブ成功。仕様を更新済み。次の機能へ進めます！
```

自分でターミナルから実行する場合:
```bash
$ openspec archive add-profile-filters --yes  # 対話なしで完了済みの変更をアーカイブする
```

**補足:** スラッシュコマンド対応ツール（Claude Code, CodeBuddy, Cursor, Codex, Qoder, RooCode など）は上記ショートカットをそのまま使用できます。その他のツールでも「OpenSpec の提案を作成」「OpenSpec の変更を適用」「変更をアーカイブ」と自然文で依頼すれば動作します。

## コマンドリファレンス

```bash
openspec list               # 進行中の変更フォルダを一覧
openspec view               # 仕様と変更のダッシュボード
openspec show <change>      # 変更の詳細（提案・タスク・仕様差分）を表示
openspec validate <change>  # 仕様フォーマットと構造を検証
openspec archive <change> [--yes|-y]   # 完了した変更を archive/ に移動（--yes で非対話）
```

## 例: AI が OpenSpec ファイルを生成する流れ

AI に「二要素認証を追加して」と依頼すると、次のように生成します:

```
openspec/
├── specs/
│   └── auth/
│       └── spec.md           # 現行の認証仕様（既にあれば）
└── changes/
    └── add-2fa/              # AI が生成する変更フォルダ
        ├── proposal.md       # 変更理由と内容
        ├── tasks.md          # 実装チェックリスト
        ├── design.md         # 技術方針（必要なら）
        └── specs/
            └── auth/
                └── spec.md   # 追加差分
```

### 生成される仕様 (`openspec/specs/auth/spec.md`)

```markdown
# Auth Specification

## Purpose
認証とセッション管理。

## Requirements
### Requirement: User Authentication
システムはログイン成功時に JWT を発行する。

#### Scenario: Valid credentials
- WHEN ユーザーが有効な資格情報を送信する
- THEN JWT を返す
```

### 生成される変更差分 (`openspec/changes/add-2fa/specs/auth/spec.md`)

```markdown
# Delta for Auth

## ADDED Requirements
### Requirement: Two-Factor Authentication
システムはログイン時に第二要素を必須とする。

#### Scenario: OTP required
- WHEN ユーザーが有効な資格情報を送信する
- THEN OTP チャレンジを要求する
```

### 生成されるタスク (`openspec/changes/add-2fa/tasks.md`)

```markdown
## 1. Database Setup
- [ ] 1.1 users テーブルに OTP 秘密キー列を追加
- [ ] 1.2 OTP 検証ログテーブルを作成

## 2. Backend Implementation  
- [ ] 2.1 OTP 生成エンドポイントを追加
- [ ] 2.2 ログインフローを変更し OTP を必須にする
- [ ] 2.3 OTP 検証エンドポイントを追加

## 3. Frontend Updates
- [ ] 3.1 OTP 入力コンポーネントを作成
- [ ] 3.2 ログインフロー UI を更新
```

**重要:** これらのファイルを手作業で作る必要はありません。要件と既存コードに基づき、AI アシスタントが自動生成します。

## OpenSpec ファイルの理解

### 差分フォーマット

差分は仕様がどのように変わるかを示す「パッチ」です:

- **`## ADDED Requirements`** - 新しい機能
- **`## MODIFIED Requirements`** - 挙動変更（更新後の全文を記載）
- **`## REMOVED Requirements`** - 廃止する機能

**フォーマット要件:**
- 見出しは `### Requirement: <name>`
- 各要件に少なくとも 1 つの `#### Scenario:` ブロックが必要
- 要件文では SHALL/MUST を使用

## OpenSpec の比較

### spec-kit との比較
OpenSpec の 2 フォルダモデル（現在の真実は `openspec/specs/`、提案中の更新は `openspec/changes/`）で状態と差分を分離します。既存機能の改修や複数仕様にまたがる更新でもスケールしやすく、spec-kit が得意とする 0→1 の新規開発よりも既存機能の進化に強みがあります。

### Kiro.dev との比較
OpenSpec は機能ごとの変更を 1 フォルダ（`openspec/changes/feature-name/`）にまとめ、関連する仕様・タスク・設計を一括で追跡できます。Kiro は更新が複数仕様フォルダに分散しやすく、機能単位の追跡が難しくなりがちです。

### 仕様なしの場合
仕様がないと、AI はあいまいなプロンプトからコードを生成し、要件抜けや不要機能が生まれがちです。OpenSpec はコードを書く前に望む挙動への合意を作り、予測可能性をもたらします。

## チーム導入

1. **OpenSpec を初期化** – リポジトリで `openspec init` を実行。
2. **新機能から始める** – 近々の作業を変更提案として AI にまとめてもらう。
3. **段階的に拡張** – 各変更をアーカイブし、仕様としてシステムドキュメントを育てる。
4. **柔軟性を維持** – メンバーは Claude Code、CodeBuddy、Cursor、AGENTS.md 互換ツールなど好きなアシスタントを使いつつ、同じ仕様を共有できる。

メンバーがツールを切り替えたら `openspec update` を実行し、最新の手順とスラッシュコマンド設定を反映させてください。

## OpenSpec のアップデート

1. **パッケージをアップグレード**
   ```bash
   npm install -g @ayumuwall/openspec@latest
   ```
2. **エージェントの手順を更新**
- 各プロジェクトで `openspec update` を実行し、AI ガイダンスとスラッシュコマンドを最新化します。

## 実験的機能

<details>
<summary><strong>🧪 OPSX: 流動的で反復的なワークフロー</strong>（Claude Code のみ）</summary>

**背景:**
- 標準ワークフローは固定されており、手順の調整やカスタマイズができない
- AI の出力が悪いときに、プロンプトを自分で改善できない
- 全員が同じワークフローで、チームのやり方に合わせられない

**違い:**
- **改造可能** — テンプレートやスキーマを直接編集し、ビルドなしで即テストできる
- **粒度が細かい** — アーティファクトごとに手順があり、個別にテスト・調整できる
- **カスタマイズ可能** — 独自のワークフロー、アーティファクト、依存関係を定義できる
- **流動的** — フェーズのゲートがなく、いつでもどのアーティファクトでも更新できる

```
You can always go back:

  proposal ──→ specs ──→ design ──→ tasks ──→ implement
     ▲           ▲          ▲                    │
     └───────────┴──────────┴────────────────────┘
```

| コマンド | 役割 |
|---------|------|
| `/opsx:new` | 新しい変更を開始 |
| `/opsx:continue` | 次のアーティファクトを作成 |
| `/opsx:ff` | 早送り（すべての計画アーティファクトを一括生成） |
| `/opsx:apply` | タスクを実装し、必要に応じて更新 |
| `/opsx:archive` | 完了後にアーカイブ |

**セットアップ:** `openspec artifact-experimental-setup`

[詳細ドキュメント →](docs/experimental-workflow.md)

</details>

<details>
<summary><strong>テレメトリー</strong> – OpenSpec は匿名の利用統計を収集します（オプトアウト: <code>OPENSPEC_TELEMETRY=0</code>）</summary>

利用状況を把握するためにコマンド名とバージョンのみを収集します。引数、パス、内容、PII は収集しません。CI では自動的に無効化されます。

**オプトアウト:** `export OPENSPEC_TELEMETRY=0` または `export DO_NOT_TRACK=1`

</details>

## コントリビュート

- 依存をインストール: `pnpm install`
- ビルド: `pnpm run build`
- テスト: `pnpm test`
- CLI ローカル開発: `pnpm run dev` または `pnpm run dev:cli`
- Conventional Commits（1 行）: `type(scope): subject`

## ライセンス

MIT
