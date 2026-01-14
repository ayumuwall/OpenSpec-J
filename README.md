<p align="center">
  <a href="https://github.com/Fission-AI/OpenSpec">
    <picture>
      <source srcset="assets/openspec_pixel_dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="assets/openspec_pixel_light.svg" media="(prefers-color-scheme: light)">
      <img src="assets/openspec_pixel_light.svg" alt="OpenSpec ロゴ" height="64">
    </picture>
  </a>
  
</p>
<p align="center">AI コーディングアシスタントのための仕様駆動開発。</p>
<p align="center">
  <a href="https://github.com/ayumuwall/OpenSpec-J/actions/workflows/ci.yml?query=branch%3Aja-docs"><img alt="CI" src="https://github.com/ayumuwall/OpenSpec-J/actions/workflows/ci.yml/badge.svg?branch=ja-docs" /></a>
  <a href="https://www.npmjs.com/package/@ayumuwall/openspec"><img alt="npm バージョン" src="https://img.shields.io/npm/v/@ayumuwall/openspec?style=flat-square" /></a>
  <a href="https://nodejs.org/"><img alt="Node.js バージョン" src="https://img.shields.io/node/v/@ayumuwall/openspec?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="ライセンス: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="https://conventionalcommits.org"><img alt="Conventional Commits" src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square" /></a>
  <a href="https://discord.gg/YctCnvvshC"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join%20the%20community-5865F2?logo=discord&logoColor=white&style=flat-square" /></a>
</p>

<p align="center">
  <img src="assets/openspec_dashboard.png" alt="OpenSpec ダッシュボードのプレビュー" width="90%">
</p>

<p align="center">
  最新情報は <a href="https://x.com/0xTab">@0xTab on X</a> をフォロー · 質問やサポートは <a href="https://discord.gg/YctCnvvshC">OpenSpec Discord</a> へどうぞ。
</p>

<p align="center">
  <sub>🧪 <strong>新着:</strong> <a href="docs/experimental-workflow.md">実験的ワークフロー (OPSX)</a> — スキーマ駆動で柔軟に拡張でき、流動的。コード変更なしでワークフローを反復できます。</sub>
</p>

# OpenSpec

このリポジトリは、[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) をベースにした日本語ローカライズ版（OpenSpec-J）です。仕様と構成は本家を尊重しつつ、日本語利用者向けにドキュメントとメッセージを最適化しています。**現在の同期元は OpenSpec v0.20.0 です。**

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
- **既存コード重視**: 0→1 だけでなく既存機能の改修にも強い。OpenSpec は `openspec/specs/`（現在の真実）と `openspec/changes/`（提案中の更新）を分離し、機能間の差分を明示的に管理。
- **変更追跡**: 提案・タスク・仕様差分を同居させ、アーカイブ時に承認済みの更新を仕様へ統合。
- **spec-kit / Kiro との比較**: これらは 0→1 の新機能で強いが、OpenSpec は既存挙動を変える 1→n 改修や複数仕様にまたがる更新でも力を発揮。

詳細は [OpenSpec の比較](#openspec-の比較) を参照してください。

## 仕組み

```
┌────────────────────┐
│ 変更提案ドラフト     │
│ (下書き)            │
└────────┬───────────┘
         │ AI と意図を共有
         ▼
┌────────────────────┐
│ レビューと合意      │
│ (仕様・タスク編集)  │◀──── フィードバックループ ──────┐
└────────┬───────────┘                              │
         │ 承認済み計画                              │
         ▼                                          │
┌────────────────────┐                              │
│ タスク実装          │──────────────────────────────┘
│ (AI がコードを書く) │
└────────┬───────────┘
         │ 変更をリリース
         ▼
┌────────────────────┐
│ アーカイブと仕様更新 │
│ (ソースの仕様)      │
└────────────────────┘

1. 望む仕様更新を記述した変更提案をドラフト（下書き）する。
2. AI アシスタントとレビューし、合意が取れるまで調整する。
3. 合意済み仕様を参照しながらタスクを実装する。
4. 変更をアーカイブし、承認済みの更新をソース・オブ・トゥルースの仕様に統合する。
```

## はじめ方

### 対応 AI ツール

<details>
<summary><strong>ネイティブのスラッシュコマンド</strong>（クリックで展開）</summary>

これらのツールには OpenSpec コマンドが組み込まれています。案内に従って OpenSpec 連携を選択してください。

| ツール | コマンド |
|------|----------|
| **Amazon Q Developer** | `@openspec-proposal`, `@openspec-apply`, `@openspec-archive` (`.amazonq/prompts/`) |
| **Antigravity** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.agent/workflows/`) |
| **Auggie (Augment CLI)** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.augment/commands/`) |
| **Claude Code** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` |
| **Cline** | `.clinerules/workflows/` ディレクトリのワークフロー (`.clinerules/workflows/openspec-*.md`) |
| **CodeBuddy Code (CLI)** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.codebuddy/commands/`) — 詳細は [ドキュメント](https://www.codebuddy.ai/cli) |
| **Codex** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (グローバル: `~/.codex/prompts`, 自動インストール) |
| **Continue** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.continue/prompts/`) |
| **CoStrict** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.cospec/openspec/commands/`) — 詳細は [ドキュメント](https://costrict.ai) |
| **Crush** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.crush/commands/openspec/`) |
| **Cursor** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` |
| **Factory Droid** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.factory/commands/`) |
| **Gemini CLI** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.gemini/commands/openspec/`) |
| **GitHub Copilot** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.github/prompts/`) |
| **iFlow (iflow-cli)** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.iflow/commands/`) |
| **Kilo Code** | `/openspec-proposal.md`, `/openspec-apply.md`, `/openspec-archive.md` (`.kilocode/workflows/`) |
| **OpenCode** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` |
| **Qoder (CLI)** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` (`.qoder/commands/openspec/`) — 詳細は [ドキュメント](https://qoder.com/cli) |
| **Qwen Code** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.qwen/commands/`) |
| **RooCode** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.roo/commands/`) |
| **Windsurf** | `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` (`.windsurf/workflows/`) |

Kilo Code はチームのワークフローを自動検出します。生成されたファイルを `.kilocode/workflows/` に保存し、コマンドパレットから `/openspec-proposal.md`、`/openspec-apply.md`、`/openspec-archive.md` を実行してください。

</details>

<details>
<summary><strong>AGENTS.md 互換</strong>（クリックで展開）</summary>

これらのツールは `openspec/AGENTS.md` からワークフロー手順を自動で読み込みます。必要に応じて OpenSpec ワークフローを実行するよう指示してください。詳細は [AGENTS.md 規約](https://agents.md/) を参照。

| ツール |
|-------|
| Amp • Jules • その他 |

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

`openspec init` 完了後、次のステップ用プロンプトが表示されます。そのまま AI ツールに貼り付けてください。

```text
プロジェクトコンテキストを埋める:
"openspec/project.md を読んで、プロジェクト/技術スタック/規約の情報を
追記するのを手伝ってください"
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

AI に「二要素認証を追加したい」と伝えると、次の構造が生成されます:

```
openspec/
├── specs/
│   └── auth/
│       └── spec.md           # 現在の認証仕様（存在する場合）
└── changes/
    └── add-2fa/              # AI がこの構造を生成
        ├── proposal.md       # 変更理由と概要
        ├── tasks.md          # 実装タスク
        ├── design.md         # 技術的判断（任意）
        └── specs/
            └── auth/
                └── spec.md   # 追加差分
```

### 生成される仕様 (`openspec/specs/auth/spec.md`)

```markdown
# Auth Specification

## Purpose
Authentication and session management.

## Requirements
### Requirement: User Authentication
The system SHALL issue a JWT on successful login.

#### Scenario: Valid credentials
- WHEN a user submits valid credentials
- THEN a JWT is returned
```

### 生成される変更差分 (`openspec/changes/add-2fa/specs/auth/spec.md`)

```markdown
# Delta for Auth

## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- WHEN a user submits valid credentials
- THEN an OTP challenge is required
```

### 生成されるタスク (`openspec/changes/add-2fa/tasks.md`)

```markdown
## 1. Database Setup
- [ ] 1.1 Add OTP secret column to users table
- [ ] 1.2 Create OTP verification logs table

## 2. Backend Implementation  
- [ ] 2.1 Add OTP generation endpoint
- [ ] 2.2 Modify login flow to require OTP
- [ ] 2.3 Add OTP verification endpoint

## 3. Frontend Updates
- [ ] 3.1 Create OTP input component
- [ ] 3.2 Update login flow UI
```

**重要:** これらのファイルを手動で作成する必要はありません。AI アシスタントが要件と既存コードベースを参照して自動生成します。

## OpenSpec ファイルの理解

### 差分フォーマット

差分は「パッチ」として仕様の変更を表現します:

- **`## ADDED Requirements`** - 新しい機能
- **`## MODIFIED Requirements`** - 仕様変更（更新後の全文を記述）
- **`## REMOVED Requirements`** - 既存機能の廃止

**フォーマット要件:**
- 見出しは `### Requirement: <name>` を使用
- 各要件に最低 1 つの `#### Scenario:` が必要
- 要件本文では SHALL/MUST を使用

## OpenSpec の比較

### spec-kit との比較
OpenSpec は二段階フォルダ（`openspec/specs/` が現在の真実、`openspec/changes/` が提案中の更新）で状態と差分を分離します。既存機能の改修や複数仕様の同時変更でもスケールしやすく、spec-kit が得意な 0→1 の新規開発よりも広いケースで活躍します。

### Kiro.dev との比較
OpenSpec は変更単位を 1 つのフォルダ（`openspec/changes/feature-name/`）にまとめるため、仕様・タスク・設計が追いやすい構造です。Kiro は複数の仕様フォルダに分散するため、機能単位の追跡が難しくなることがあります。

### 仕様なしの場合
仕様が無いと、AI コーディングアシスタントは曖昧なプロンプトからコードを生成してしまい、要件漏れや余計な実装が起きがちです。OpenSpec は事前に期待する挙動を合意することで、再現性の高い成果を得られます。

## チーム導入

1. **OpenSpec を初期化** – リポジトリで `openspec init` を実行する。
2. **新機能から始める** – 今後の作業を変更提案として AI にまとめてもらう。
3. **継続的に蓄積** – 各変更はアーカイブされ、生きた仕様として蓄積される。
4. **柔軟に共有** – Claude Code, CodeBuddy, Cursor など複数ツールを跨いでも同じ仕様を共有可能。

ツールを切り替える場合は `openspec update` を実行し、最新の指示とスラッシュコマンドを反映してください。

## OpenSpec のアップデート

1. **パッケージを更新**
   ```bash
   npm install -g @ayumuwall/openspec@latest
   ```
2. **AI 指示を更新**
   - 各プロジェクトで `openspec update` を実行し、最新のスラッシュコマンドとガイダンスを反映します。

## 実験的機能

<details>
<summary><strong>🧪 OPSX: 流動的で反復的なワークフロー</strong>（Claude Code のみ）</summary>

**なぜ必要か:**
- 標準ワークフローは固定で、指示やテンプレートをカスタマイズできない
- AI 出力が悪いときに、プロンプトを自分で改善できない
- 全員同じワークフローしか使えず、チームの流儀と合わない

**何が違うか:**
- **ハック可能** — テンプレートやスキーマを自分で編集し、即時にテスト可能
- **細分化** — アーティファクトごとに指示を分離し、個別に改善できる
- **カスタマイズ** — 独自ワークフローや依存関係を自由に定義できる
- **流動的** — フェーズのゲートがなく、いつでも更新できる

```
いつでも戻って調整できます:

  proposal ──→ specs ──→ design ──→ tasks ──→ implement
     ▲           ▲          ▲                    │
     └───────────┴──────────┴────────────────────┘
```

| コマンド | できること |
|---------|------------|
| `/opsx:new` | 新規変更を開始 |
| `/opsx:continue` | 次のアーティファクトを作成（準備が整ったものから） |
| `/opsx:ff` | 一括で前倒し作成（planning artifact 全生成） |
| `/opsx:apply` | 必要に応じてアーティファクトを更新しつつタスクを実装 |
| `/opsx:archive` | 完了時にアーカイブ |

**セットアップ:** `openspec artifact-experimental-setup`

[詳細ドキュメント →](docs/experimental-workflow.md)

</details>

<details>
<summary><strong>テレメトリ</strong> – OpenSpec は匿名の利用統計を収集します（オプトアウト: <code>OPENSPEC_TELEMETRY=0</code>）</summary>

収集するのはコマンド名とバージョンのみです。引数・パス・内容・個人情報は収集しません。CI では自動で無効化されます。

**オプトアウト:** `export OPENSPEC_TELEMETRY=0` または `export DO_NOT_TRACK=1`

</details>

## コントリビュート

- 依存関係のインストール: `pnpm install`
- ビルド: `pnpm run build`
- テスト: `pnpm test`
- ローカル開発: `pnpm run dev` または `pnpm run dev:cli`
- Conventional Commits（1 行）: `type(scope): subject`

<details>
<summary><strong>Maintainers & Advisors</strong></summary>

プロジェクトを支えるメンテナとアドバイザー一覧は [MAINTAINERS.md](MAINTAINERS.md) を参照してください。

</details>

## ライセンス

MIT
