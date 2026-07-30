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
ターミナル   $ npm install -g @ayumuwall/openspec@latest
ターミナル   $ cd your-project && openspec init
AIチャット    /opsx:explore                    (任意: 先に考えを整理する)
AIチャット    /opsx:propose add-dark-mode      (AI が計画を下書きし、あなたが確認する)
AIチャット    /opsx:apply                      (AI が実装する)
AIチャット    /opsx:archive                    (仕様を更新し、変更を保存する)
```

2 つの端末ステップを設定すれば、チャットを開始できます。このガイドの残りの部分では、各ステップの内容と何が表示されるかを明らかにします。

**ターミナルでの作業を自分で行いたくない場合は、** [セットアップ用プロンプト](installation.md#ai-アシスタントでインストール)をアシスタントへ貼り付けてください。2つのコマンドを実行し、作成内容を報告します。

> **何を作るべきかまだはっきりしない場合は、`/opsx:explore` から始めてください。** これは、アーティファクトやコードができる前に、コードベースを読み、選択肢を検討し、曖昧なアイデアを具体的な計画へ絞り込む、利害関係のない検討相手です。方向性がはっきりしたら、`/opsx:propose` に引き継ぎます。AI が自信満々に間違ったものを作ってしまうリスクを下げる、最も有効な習慣の 1 つです。詳しくは [探索ガイド](explore.md) を参照してください。

## 仕組み

OpenSpec は、コードを作成する前に、AI コーディング アシスタントと何を構築するかについて合意するのに役立ちます。

**デフォルトのクイック パス (コア プロファイル):**

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:sync ──► /opsx:archive
   (任意)
```

何をすべきか考えている場合は `/opsx:explore` から始め、すでにわかっている場合は `/opsx:propose` に直接ジャンプします。 Explore はデフォルトのプロファイルに含まれているため、必要なときにいつでも利用できます。

**展開されたパス (カスタム ワークフローの選択):**

```text
/opsx:new ──► /opsx:ff または /opsx:continue ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

デフォルトのグローバルプロファイルは `core` で、`propose`、`explore`、`apply`、`update`、`sync`、`archive` が含まれます。`openspec config profile`、続いて `openspec update` を使うと、拡張ワークフローコマンドを有効にできます。

## OpenSpec が作成するもの

`openspec init` を実行すると、プロジェクトは次の構造になります。

```
openspec/
├── specs/              # ソース・オブ・トゥルース（システムの現在の振る舞い）
│   └── <domain>/
│       └── spec.md
├── changes/            # 変更提案（変更ごとに 1 フォルダー）
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/      # 仕様差分（何を変更するか）
│           └── <domain>/
│               └── spec.md
└── config.yaml         # プロジェクト設定（任意）
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
            学んだことに合わせて更新する
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
システムはログイン時に第 2 要素を要求しなければならない。

#### Scenario: OTP required
- GIVEN 2FA が有効なユーザー
- WHEN ユーザーが有効な認証情報を送信する
- THEN OTP チャレンジが表示される

## MODIFIED Requirements

### Requirement: Session Timeout
システムは 30 分間操作がないセッションを期限切れにするものとする。
（以前: 60 分）

#### Scenario: Idle timeout
- GIVEN 認証済みセッション
- WHEN 操作がないまま 30 分が経過する
- THEN セッションは無効化される

## REMOVED Requirements

### Requirement: Remember Me
（2FA を優先するため非推奨）
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

AI:  openspec/changes/add-dark-mode/ を作成しました
     ✓ proposal.md — 目的と変更内容
     ✓ specs/       — 要件とシナリオ
     ✓ design.md    — 技術的な方針
     ✓ tasks.md     — 実装チェックリスト
     実装に進めます。
```

拡張されたワークフロー プロファイルを有効にしている場合は、`/opsx:new`、次に `/opsx:ff` (または段階的に `/opsx:continue`) の 2 つのステップとしてこれを実行することもできます。

### 2. 何が作成されるか

**proposal.md** - 意図をキャプチャします。

```markdown
# Proposal: Add Dark Mode

## Intent
夜間利用時の目の負担を減らすため、ユーザーから
ダークモードのオプションが求められている。

## Scope
- 設定画面にテーマ切り替えを追加する
- システム設定の検出をサポートする
- 選択した設定を localStorage に保存する

## Approach
テーマ管理には CSS カスタムプロパティを使い、
状態管理には React コンテキストを使う。
```

**specs/ui/spec.md** - 新しい要件を示すデルタ:

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Theme Selection
システムは、ユーザーがライトテーマとダークテーマを選択できるようにするものとする。

#### Scenario: Manual toggle
- GIVEN 任意のページを表示しているユーザー
- WHEN ユーザーがテーマトグルをクリックする
- THEN テーマが即座に切り替わる
- AND 選択内容はセッションをまたいで保持される

#### Scenario: System preference
- GIVEN 保存済み設定がないユーザー
- WHEN アプリケーションが読み込まれる
- THEN システムの優先カラースキームが使用される
```

**tasks.md** - 実装チェックリスト:

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 ライト/ダーク状態を持つ ThemeContext を作成する
- [ ] 1.2 色用の CSS カスタムプロパティを追加する
- [ ] 1.3 localStorage への永続化を実装する

## 2. UI Components
- [ ] 2.1 ThemeToggle コンポーネントを作成する
- [ ] 2.2 設定ページにトグルを追加する
- [ ] 2.3 Header にクイックトグルを追加する

## 3. Styling
- [ ] 3.1 ダークテーマのカラーパレットを定義する
- [ ] 3.2 CSS 変数を使うようにコンポーネントを更新する
```

### 3. 実装する

```
You: /opsx:apply

AI:  タスクを進めています...
     ✓ 1.1 ライト/ダーク状態を持つ ThemeContext を作成
     ✓ 1.2 globals.css に CSS カスタムプロパティを追加
     ✓ 1.3 localStorage への永続化を実装
     ✓ 2.1 ThemeToggle コンポーネントを作成
     ...
     すべてのタスクが完了しました。
```

実装中に、デザインを調整する必要があることがわかった場合は、アーティファクトを更新して続行します。

### 4. アーカイブ

```
You: /opsx:archive

AI:  add-dark-mode をアーカイブしています...
     ✓ 仕様を openspec/specs/ui/spec.md にマージ
     ✓ openspec/changes/archive/2025-01-24-add-dark-mode/ に移動
     完了しました。次の機能に進めます。
```

仕様差分はメイン仕様の一部となり、システムがどのように動作するかを文書化します。

## 検証とレビュー

CLI を使用して変更を確認します。

```bash
# アクティブな変更を一覧表示
openspec list

# 変更の詳細を表示
openspec show add-dark-mode

# 仕様の書式を検証
openspec validate add-dark-mode

# 対話型ダッシュボード
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
