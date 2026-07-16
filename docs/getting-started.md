# はじめる

このガイドでは、OpenSpec をインストールして初期化した後、どのように使うかを説明します。インストール手順は [メイン README](../README.md#quick-start) または [インストールガイド](installation.md) を参照してください。ドキュメント全体の地図は [ドキュメントホーム](README.md) にあります。

> **これらのコマンドはどこに入力すればよいですか?** 2 つの場所に入力し、それらを混同することが初期段階で最もよくあるつまずきです。
>
> - `openspec ...` コマンド (`openspec init` など) は **ターミナル** で実行されます。
> - `/opsx:...` コマンド (`/opsx:propose` など) は、**AI アシスタントのチャット**、つまりコードの作成を要求するのと同じボックスで実行されます。
>
> 開始用の特別な「対話モード」はありません。チャットにスラッシュコマンドを入力するだけで、アシスタントがそこからワークフローを実行します。詳しくは [コマンドの仕組み](how-commands-work.md) を参照してください。

## 最初の 5 分間

ループ全体。各ステップは、それが発生する場所によってラベル付けされています。

```text
TERMINAL   $ npm install -g @ayumuwall/openspec@latest
TERMINAL   $ cd your-project && openspec init
AI CHAT      /opsx:explore                    (optional: think it through first)
AI CHAT      /opsx:propose add-dark-mode      (AI drafts the plan; you review it)
AI CHAT      /opsx:apply                      (AI builds it)
AI CHAT      /opsx:archive                    (specs updated, change filed away)
```

2 つの端末ステップを設定すれば、チャットを開始できます。このガイドの残りの部分では、各ステップの内容と何が表示されるかを明らかにします。

> **何を作るべきかまだはっきりしない場合は、`/opsx:explore` から始めてください。** これは、アーティファクトやコードができる前に、コードベースを読み、選択肢を検討し、曖昧なアイデアを具体的な計画へ絞り込む、利害関係のない検討相手です。方向性がはっきりしたら、`/opsx:propose` に引き継ぎます。AI が自信満々に間違ったものを作ってしまうリスクを下げる、最も有効な習慣の 1 つです。詳しくは [探索ガイド](explore.md) を参照してください。

## 仕組み

OpenSpec は、コードを作成する前に、AI コーディング アシスタントと何を構築するかについて合意するのに役立ちます。

**デフォルトのクイック パス (コア プロファイル):**

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:sync ──► /opsx:archive
   (optional)
```

何をすべきか考えている場合は `/opsx:explore` から始め、すでにわかっている場合は `/opsx:propose` に直接ジャンプします。 Explore はデフォルトのプロファイルに含まれているため、必要なときにいつでも利用できます。

**展開されたパス (カスタム ワークフローの選択):**

```text
/opsx:new ──► /opsx:ff or /opsx:continue ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

デフォルトのグローバル プロファイルは `core` で、これには `propose`、`explore`、`apply`、`sync`、および `archive` が含まれます。 `openspec config profile`、次に `openspec update` を使用して、拡張されたワークフロー コマンドを有効にできます。

## OpenSpec が作成するもの

`openspec init` を実行すると、プロジェクトは次の構造になります。

```
openspec/
├── specs/              # Source of truth (your system's behavior)
│   └── <domain>/
│       └── spec.md
├── changes/            # Proposed updates (one folder per change)
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/      # Delta specs (what's changing)
│           └── <domain>/
│               └── spec.md
└── config.yaml         # Project configuration (optional)
```

**2 つの主要なディレクトリ:**

- **`specs/`** - 真実の情報源。これらの仕様は、システムが現在どのように動作するかを説明します。ドメインごとに整理されます (例: `specs/auth/`、`specs/payments/`)。

- **`changes/`** - 修正案。変更ごとに、関連するすべてのアーティファクトを含む独自のフォルダーが取得されます。変更が完了すると、その仕様はメインの `specs/` ディレクトリにマージされます。

## アーティファクトを理解する

各変更フォルダーには、作業をガイドする成果物が含まれています。

|アーティファクト |目的 |
|----------|---------|
| `proposal.md` | 「なぜ」と「何を」 - 意図、範囲、アプローチを捉える |
| `specs/` |追加/変更/削除された要件を示す仕様差分 |
| `design.md` | 「方法」 - 技術的なアプローチとアーキテクチャの決定 |
| `tasks.md` |チェックボックス付きの実装チェックリスト |

**アーティファクトは相互に構築されます:**

```
proposal ──► specs ──► design ──► tasks ──► implement
   ▲           ▲          ▲                    │
   └───────────┴──────────┴────────────────────┘
            update as you learn
```

実装中に詳細を学びながら、いつでも以前の成果物に戻って改良することができます。

## 仕様差分の仕組み

仕様差分は OpenSpec の重要な概念です。現在の仕様と比較して何が変更されているかを示します。

### フォーマット

仕様差分では、セクションを使用して変更の種類を示します。

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements

### Requirement: Session Timeout
The system SHALL expire sessions after 30 minutes of inactivity.
(Previously: 60 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

### アーカイブで何が起こるか

変更をアーカイブする場合:

1. **追加** 要件が主要仕様に追加されます
2. **修正** 要件は既存のバージョンを置き換えます
3. **削除** 要件がメイン仕様から削除されました

変更フォルダーは監査履歴用に `openspec/changes/archive/` に移動します。

## 例: 最初の変更

アプリケーションにダーク モードを追加する手順を見てみましょう。

### 1. 変更を開始します (デフォルト)

```text
You: /opsx:propose add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     ✓ proposal.md — why we're doing this, what's changing
     ✓ specs/       — requirements and scenarios
     ✓ design.md    — technical approach
     ✓ tasks.md     — implementation checklist
     Ready for implementation!
```

拡張されたワークフロー プロファイルを有効にしている場合は、`/opsx:new`、次に `/opsx:ff` (または段階的に `/opsx:continue`) の 2 つのステップとしてこれを実行することもできます。

### 2. 何が作成されるか

**proposal.md** - 意図をキャプチャします。

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage.

## Scope
- Add theme toggle in settings
- Support system preference detection
- Persist preference in localStorage

## Approach
Use CSS custom properties for theming with a React context
for state management.
```

**specs/ui/spec.md** - 新しい要件を示すデルタ:

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Theme Selection
The system SHALL allow users to choose between light and dark themes.

#### Scenario: Manual toggle
- GIVEN a user on any page
- WHEN the user clicks the theme toggle
- THEN the theme switches immediately
- AND the preference persists across sessions

#### Scenario: System preference
- GIVEN a user with no saved preference
- WHEN the application loads
- THEN the system's preferred color scheme is used
```

**tasks.md** - 実装チェックリスト:

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
```

### 3. 実装する

```
You: /opsx:apply

AI:  Working through tasks...
     ✓ 1.1 Created ThemeContext with light/dark state
     ✓ 1.2 Added CSS custom properties to globals.css
     ✓ 1.3 Implemented localStorage persistence
     ✓ 2.1 Created ThemeToggle component
     ...
     All tasks complete!
```

実装中に、デザインを調整する必要があることがわかった場合は、アーティファクトを更新して続行します。

### 4. アーカイブ

```
You: /opsx:archive

AI:  Archiving add-dark-mode...
     ✓ Merged specs into openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/
     Done! Ready for the next feature.
```

仕様差分はメイン仕様の一部となり、システムがどのように動作するかを文書化します。

## 検証とレビュー

CLI を使用して変更を確認します。

```bash
# アクティブな変更を一覧表示
openspec list

# View change details
openspec show add-dark-mode

# Validate spec formatting
openspec validate add-dark-mode

# Interactive dashboard
openspec view
```

## 次のステップ

- [まずは探索する](explore.md) - コミット前に `/opsx:explore` でアイデアを検討する
- [変更のレビュー](reviewing-changes.md) - 実装前に、AI が下書きした計画で何を確認するか
- [良い仕様を書く](writing-specs.md) - 強力な要件とシナリオはどのようなものであるか]
- [既存プロジェクトで OpenSpec を使う](existing-projects.md) - 大規模なブラウンフィールドコードベースから始める
- [変更の編集と反復](editing-changes.md) - 成果物を更新し、戻り、手動編集と整合させる
- [コアコンセプトの概要](overview.md) - メンタルモデル全体を 1 ページにまとめたもの
- [例とレシピ](examples.md) - 実際の変更、最初から最後まで
- [ワークフロー](workflows.md) - 一般的なパターンと各コマンドを使うタイミング
- [コマンド](commands.md) - すべてのスラッシュコマンドのリファレンス
- [コンセプト](concepts.md) - 仕様、変更、スキーマを深く理解する
- [カスタマイズ](customization.md) - OpenSpec を自分のやり方に合わせる
- [ストア](stores-beta/user-guide.md) - リポジトリやチームをまたぐ計画を独立したリポジトリに置く（ベータ版）
- [FAQ](faq.md) と [トラブルシューティング](troubleshooting.md) - 行き詰まった場合
