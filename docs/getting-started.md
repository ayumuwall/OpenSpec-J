# はじめに

このガイドでは、OpenSpec をインストール・初期化した後の使い方を説明します。インストール手順は [README](../README.md#クイックスタート) を参照してください。

## 仕組み

OpenSpec は、コードを書く前に「何を作るか」を人と AI コーディングアシスタントで合意できるようにします。

**既定のクイックパス（`core` プロファイル）:**

```text
/opsx:propose ──► /opsx:apply ──► /opsx:archive
```

**拡張パス（`custom` ワークフロー選択時）:**

```
/opsx:new ──► /opsx:ff または /opsx:continue ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

既定のグローバルプロファイルは `core` で、`propose`, `explore`, `apply`, `archive` が含まれます。拡張ワークフローを使いたい場合は、`openspec config profile` の後に `openspec update` を実行します。

## OpenSpec が作るもの

`openspec init` を実行すると、プロジェクトは次の構造になります。

```
openspec/
├── specs/              # ソース・オブ・トゥルース（システムの挙動）
│   └── <domain>/
│       └── spec.md
├── changes/            # 変更提案（変更ごとに 1 フォルダ）
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/      # 仕様差分（何が変わるか）
│           └── <domain>/
│               └── spec.md
└── config.yaml         # プロジェクト設定（任意）
```

**重要な 2 つのディレクトリ:**

- **`specs/`** - ソース・オブ・トゥルース。現在のシステム挙動を示す仕様が入ります。ドメイン単位で整理します（例: `specs/auth/`, `specs/payments/`）。

- **`changes/`** - 変更提案。変更ごとに 1 つのフォルダを持ち、すべてのアーティファクトをまとめます。完了した変更は `specs/` に統合されます。

## アーティファクトの理解

各変更フォルダには、作業を導くアーティファクトが含まれます。

| アーティファクト | 目的 |
|----------|---------|
| `proposal.md` | 「なぜ / 何を」— 目的、スコープ、アプローチを記録 |
| `specs/` | ADDED/MODIFIED/REMOVED の仕様差分 |
| `design.md` | 「どうやって」— 技術的アプローチと設計判断 |
| `tasks.md` | 実装チェックリスト（チェックボックス） |

**アーティファクトは連鎖する:**

```
proposal ──► specs ──► design ──► tasks ──► 実装
   ▲           ▲          ▲                    │
   └───────────┴──────────┴────────────────────┘
            学びに応じて更新
```

実装しながら学んだことに応じて、前のアーティファクトを更新して構いません。

## 仕様差分の仕組み

仕様差分は OpenSpec の核となる考え方です。現在の仕様に対して「何が変わるか」を明示します。

### 形式

仕様差分はセクションで変更タイプを示します。

```markdown
# Auth の仕様差分

## ADDED Requirements

### Requirement: 二要素認証
システムはログイン時に第二要素を要求しなければならない。(MUST)

#### Scenario: OTP が必要
- GIVEN 2FA を有効にしたユーザー
- WHEN 有効な認証情報を送信したとき
- THEN OTP チャレンジが表示される

## MODIFIED Requirements

### Requirement: セッションタイムアウト
システムは 30 分間操作がない場合にセッションを期限切れにしなければならない。(SHALL)
（以前: 60 分）

#### Scenario: アイドルタイムアウト
- GIVEN 認証済みセッション
- WHEN 30 分間操作がない
- THEN セッションは無効化される

## REMOVED Requirements

### Requirement: ログイン状態を保持
（2FA 導入に伴い廃止）
```

### アーカイブ時に起きること

変更をアーカイブすると:

1. **ADDED** の要件は本仕様に追加
2. **MODIFIED** の要件は既存版を置換
3. **REMOVED** の要件は本仕様から削除

変更フォルダは監査用に `openspec/changes/archive/` へ移動します。

## 例: 最初の変更

例として、アプリにダークモードを追加する流れを見てみましょう。

### 1. 変更を開始（既定）

```text
あなた: /opsx:propose add-dark-mode

AI:  openspec/changes/add-dark-mode/ を作成しました
     ✓ proposal.md — 目的と変更内容
     ✓ specs/       — 要件とシナリオ
     ✓ design.md    — 技術的アプローチ
     ✓ tasks.md     — 実装チェックリスト
     実装の準備ができました！
```

拡張ワークフロープロファイルを有効にしている場合は、`/opsx:new` の後に `/opsx:ff`（または `/opsx:continue` で段階的に作成）という 2 ステップでも進められます。

### 2. 何が作られるか

**proposal.md** - 目的を記録:

```markdown
# 提案: ダークモードの追加

## 目的
夜間使用時の目の疲れを軽減するため、ダークモードが求められています。

## スコープ
- 設定にテーマ切り替えを追加
- システム設定の検出をサポート
- 設定を localStorage に保存

## アプローチ
CSS カスタムプロパティでテーマを管理し、React Context で
状態を管理します。
```

**specs/ui/spec.md** - 新しい要件の差分:

```markdown
# UI の仕様差分

## ADDED Requirements

### Requirement: テーマ選択
システムはユーザーがライト/ダークテーマを選択できるようにしなければならない。(SHALL)

#### Scenario: 手動切り替え
- GIVEN 任意のページにいるユーザー
- WHEN テーマ切り替えをクリックしたとき
- THEN テーマが即座に切り替わる
- AND 設定がセッションを超えて保持される

#### Scenario: システム設定
- GIVEN 保存された設定がないユーザー
- WHEN アプリが読み込まれたとき
- THEN システムの優先カラースキームが使用される
```

**tasks.md** - 実装チェックリスト:

```markdown
# タスク

## 1. テーマ基盤
- [ ] 1.1 light/dark 状態を持つ ThemeContext を作成
- [ ] 1.2 色用の CSS カスタムプロパティを追加
- [ ] 1.3 localStorage への保存を実装

## 2. UI コンポーネント
- [ ] 2.1 ThemeToggle コンポーネントを作成
- [ ] 2.2 設定ページに切り替えを追加
- [ ] 2.3 ヘッダーにクイック切り替えを追加

## 3. スタイリング
- [ ] 3.1 ダークテーマのカラーパレットを定義
- [ ] 3.2 コンポーネントを CSS 変数に対応させる
```

### 4. 実装

```
You: /opsx:apply

AI:  タスクを実行中...
     ✓ 1.1 light/dark 状態を持つ ThemeContext を作成しました
     ✓ 1.2 globals.css に CSS カスタムプロパティを追加しました
     ✓ 1.3 localStorage への保存を実装しました
     ✓ 2.1 ThemeToggle コンポーネントを作成しました
     ...
     すべてのタスクが完了しました！
```

実装中に設計の調整が必要になった場合は、アーティファクトを更新して続ければ OK です。

### 5. アーカイブ

```
You: /opsx:archive

AI:  add-dark-mode をアーカイブ中...
     ✓ 仕様を openspec/specs/ui/spec.md にマージしました
     ✓ openspec/changes/archive/2025-01-24-add-dark-mode/ に移動しました
     完了！次の機能に取り掛かれます。
```

これで仕様差分が本仕様に統合され、システムの挙動が記録されます。

## 検証とレビュー

CLI で変更状況を確認できます。

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

## 次に読むもの

- [ワークフロー](workflows.md) - 代表的なフローと使い分け
- [コマンド](commands.md) - スラッシュコマンドの全リファレンス
- [コンセプト](concepts.md) - 仕様・変更・スキーマの理解
- [カスタマイズ](customization.md) - 自分のワークフローに合わせる
