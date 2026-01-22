# スキーマワークフロー: エンドツーエンド分析

このドキュメントでは、OpenSpec のスキーマを扱うユーザー体験の流れ全体を分析し、ギャップを特定し、段階的な解決策を提案します。

---

## 現状

### 存在するもの

| コンポーネント | 状態 |
|-----------|--------|
| スキーマ解決 | 3 段階: プロジェクト → ユーザー → パッケージ（PR #522） |
| 内蔵スキーマ | `spec-driven`, `tdd` |
| アーティファクトワークフローコマンド | `status`, `next`, `instructions`, `templates`（`--schema` フラグあり） |
| 変更作成 | `openspec new change <name>` — スキーマ紐付けなし |
| プロジェクト内スキーマ | ✅ `openspec/schemas/` で対応（PR #522） |
| スキーマ管理 CLI | ✅ `schema which`, `validate`, `fork`, `init`（PR #525） |

### 不足しているもの

| コンポーネント | 状態 |
|-----------|--------|
| 変更へのスキーマ紐付け | 未保存 — 毎回 `--schema` を渡す必要がある |
| プロジェクトのデフォルトスキーマ | なし — `spec-driven` に固定 |

---

## ユーザー体験の流れ分析

### シナリオ 1: デフォルト以外のスキーマを使う

**目的:** 新機能で TDD ワークフローを使いたい。

**現在の体験:**
```bash
openspec new change add-auth
# ディレクトリだけ作成され、スキーマ情報は保存されない

openspec status --change add-auth
# spec-driven のアーティファクトが表示される（誤り: ユーザーは TDD を希望）

# ユーザーが間違いに気付く...
openspec status --change add-auth --schema tdd
# 正しいが、毎回 --schema を覚えておく必要がある

# 6 か月後...
openspec status --change add-auth
# また誤り - これが TDD だったことを誰も覚えていない
```

**問題点:**
- スキーマがランタイム引数で、永続化されない
- `--schema` を忘れやすく、誤った結果になる
- 将来の参照のための記録がない

---

### シナリオ 2: スキーマをカスタマイズする

**目的:** `proposal` の前に `research` アーティファクトを追加したい。

**現在の体験:**
```bash
# ステップ 1: 上書き先を確認
# XDG の慣習を知っている必要がある:
#   macOS/Linux: ~/.local/share/openspec/schemas/
#   Windows: %LOCALAPPDATA%\openspec\schemas/

# ステップ 2: ディレクトリ構造を作成
mkdir -p ~/.local/share/openspec/schemas/my-workflow/templates

# ステップ 3: デフォルトをコピーする npm パッケージの場所を探す
npm list -g openspec --parseable
# 出力はパッケージマネージャーで変わる:
#   npm: /usr/local/lib/node_modules/openspec
#   pnpm: ~/.local/share/pnpm/global/5/node_modules/openspec
#   volta: ~/.volta/tools/image/packages/openspec/...
#   yarn: ~/.config/yarn/global/node_modules/openspec

# ステップ 4: ファイルをコピー
cp -r <package-path>/schemas/spec-driven/* \
      ~/.local/share/openspec/schemas/my-workflow/

# ステップ 5: schema.yaml と templates を編集
# 上書きが有効か確認する手段がない
# 元の内容との差分を取る手段がない
```

**問題点:**
- XDG パスの慣習を知っている必要がある
- npm パッケージの場所がインストール方法で変わる
- ひな形作成や検証のツールがない
- openspec 更新時に差分を確認できない

---

### シナリオ 3: チームでカスタムワークフローを共有する

**目的:** チーム全員に同じカスタムスキーマを使ってもらいたい。

**現在の選択肢:**
1. 全員が XDG 上書きを手作業で設定 — ミスやズレが起きやすい
2. README に手順を書く — 依然として手作業で見落としが起きる
3. 別の npm パッケージとして配布 — 多くのチームには大げさ
4. リポジトリにスキーマをコミット — **非対応**（プロジェクト内解決がない）

**問題点:**
- プロジェクト内スキーマ解決がない
- カスタムスキーマをコードベースと一緒にバージョン管理できない
- チーム共通の単一ソースが作れない

---

## ギャップ一覧

| ギャップ | 影響 | 状態 |
|-----|--------|--------|
| 変更にスキーマが紐付かない | 誤った結果、文脈喪失 | ⏳ 対応予定（Phase 1） |
| プロジェクト内スキーマがない | リポジトリ共有不可 | ✅ 解決済み（PR #522） |
| スキーマ管理 CLI がない | パス探しが手作業 | ✅ 解決済み（PR #525） |
| プロジェクトのデフォルトがない | 毎回指定が必要 | ⏳ 対応予定（Phase 4） |
| init 時のスキーマ選択がない | セットアップ機会を逃す | ⏳ 対応予定（Phase 4） |

---

## 提案アーキテクチャ

### 新しいファイル構成

```
openspec/
├── config.yaml                 # プロジェクト設定（新規）
├── schemas/                    # プロジェクト内スキーマ（新規）
│   └── my-workflow/
│       ├── schema.yaml
│       └── templates/
│           ├── research.md
│           ├── proposal.md
│           └── ...
└── changes/
    └── add-auth/
        ├── change.yaml         # 変更メタデータ（新規）
        ├── proposal.md
        └── ...
```

### config.yaml（プロジェクト設定）

```yaml
# openspec/config.yaml
defaultSchema: spec-driven
```

プロジェクト全体のデフォルトスキーマを設定します。次の場合に使用します:
- `--schema` なしで新しい変更を作成する
- `change.yaml` がない変更に対してコマンドを実行する

### change.yaml（変更メタデータ）

```yaml
# openspec/changes/add-auth/change.yaml
schema: tdd
created: 2025-01-15T10:30:00Z
description: Add user authentication system
```

変更に特定のスキーマを紐付けます。`openspec new change` が自動的に作成します。

### スキーマ解決順序

```
1. ./openspec/schemas/<name>/                    # プロジェクト内
2. ~/.local/share/openspec/schemas/<name>/       # ユーザーグローバル（XDG）
3. <npm-package>/schemas/<name>/                 # 内蔵
```

プロジェクト内が最優先になるため、カスタムスキーマをリポジトリで管理できます。

### コマンドごとのスキーマ選択順序

```
1. --schema CLI flag                    # 明示的な上書き
2. change.yaml in change directory      # 変更ごとの紐付け
3. openspec/config.yaml defaultSchema   # プロジェクトのデフォルト
4. "spec-driven"                        # ハードコードされたフォールバック
```

---

## 理想的なユーザー体験

### 変更を作成する

```bash
# プロジェクトのデフォルトを使用（config.yaml、なければ spec-driven）
openspec new change add-auth
# openspec/changes/add-auth/change.yaml を作成:
#   schema: spec-driven
#   created: 2025-01-15T10:30:00Z

# この変更に明示的なスキーマを指定
openspec new change add-auth --schema tdd
# schema: tdd の change.yaml を作成
```

### 変更を操作する

```bash
# change.yaml から自動取得 — --schema 不要
openspec status --change add-auth
# 出力: "Change: add-auth (schema: tdd)"
# 準備完了/ブロック/完了のアーティファクトを表示

# 明示的な上書きも有効（情報メッセージ付き）
openspec status --change add-auth --schema spec-driven
# "注記: change.yaml は 'tdd' を指定しています。--schema フラグにより 'spec-driven' を使用します"
```

### スキーマをカスタマイズする

```bash
# 利用可能なものを確認
openspec schema list
# 内蔵:
#   spec-driven    proposal → specs → design → tasks
#   tdd            spec → tests → implementation → docs
# プロジェクト: (なし)
# ユーザー: (なし)

# プロジェクトにコピーしてカスタマイズ
openspec schema copy spec-driven my-workflow
# ./openspec/schemas/my-workflow/ を作成
# schema.yaml と templates/ を編集してカスタマイズ

# グローバルにコピー（ユーザーレベルの上書き）
openspec schema copy spec-driven --global
# ~/.local/share/openspec/schemas/spec-driven/ を作成

# スキーマの解決先を確認
openspec schema which spec-driven
# ./openspec/schemas/spec-driven/（プロジェクト）
# または: ~/.local/share/openspec/schemas/spec-driven/（ユーザー）
# または: /usr/local/lib/node_modules/openspec/schemas/spec-driven/（内蔵）

# 上書きと内蔵を比較
openspec schema diff spec-driven
# ユーザー/プロジェクト版と内蔵版の差分を表示

# 上書きを削除して内蔵に戻す
openspec schema reset spec-driven
# ./openspec/schemas/spec-driven/ を削除（ユーザーディレクトリなら --global）
```

### プロジェクトセットアップ

```bash
openspec init
# ? デフォルトのワークフロースキーマを選択:
#   > spec-driven (proposal → specs → design → tasks)
#     tdd (spec → tests → implementation → docs)
#     （検出したカスタムスキーマ）
#
# openspec/config.yaml に書き込む:
#   defaultSchema: spec-driven
```

---

## 実装フェーズ

### フェーズ 1: 変更メタデータ（change.yaml）

**優先度:** 高
**解決する課題:** `--schema` の忘れ、文脈喪失、誤った結果

**スコープ:**
- `openspec new change` 実行時に `change.yaml` を作成
- `schema` と `created` タイムスタンプを保存
- ワークフローコマンドで `change.yaml` を参照
- `--schema` は上書き（情報メッセージ付き）
- 後方互換: `change.yaml` がなければデフォルトを使う

**change.yaml フォーマット:**
```yaml
schema: tdd
created: 2025-01-15T10:30:00Z
```

**移行:**
- 既存の `change.yaml` がない変更も引き続き動作
- デフォルトは `spec-driven`（現在の挙動）
- 既存変更に `change.yaml` を追加する `openspec migrate`（任意）

---

### フェーズ 2: プロジェクト内スキーマ

**ステータス:** ✅ 完了（PR #522）
**解決する課題:** チーム共有、バージョン管理、XDG 知識不要

**実装内容:**
- `./openspec/schemas/` を解決順序の最優先に追加
- `openspec schema fork <name> [new-name]` がプロジェクト内へ作成
- チームが `openspec/schemas/` をリポジトリにコミット可能

**解決順序:**
```
1. ./openspec/schemas/<name>/           # プロジェクト内（新規）
2. ~/.local/share/openspec/schemas/<name>/  # ユーザーグローバル
3. <npm-package>/schemas/<name>/        # 内蔵
```

---

### フェーズ 3: スキーマ管理 CLI

**ステータス:** ✅ 完了（PR #525）
**解決する課題:** パス探索、ひな形作成、デバッグ

**実装済みコマンド:**
```bash
openspec schema which [name]          # 解決パスを表示（--all で全スキーマ）
openspec schema validate [name]       # スキーマ構造とテンプレートを検証
openspec schema fork <source> [name]  # 既存スキーマをコピーしてカスタマイズ
openspec schema init <name>           # 新しいプロジェクト内スキーマを作成（対話）
```

**Not implemented (may add later):**
- `schema diff` — Compare override with built-in
- `schema reset` — Remove override, revert to built-in

---

### フェーズ 4: プロジェクト設定 + init 改善

**優先度:** 低
**解決する課題:** プロジェクト全体のデフォルト、セットアップの簡略化

**スコープ:**
- `openspec/config.yaml` に `defaultSchema` を追加
- `openspec init` でスキーマ選択を促す
- 選択内容を `config.yaml` に保存
- `change.yaml` がない場合のフォールバックとして利用

**config.yaml フォーマット:**
```yaml
defaultSchema: spec-driven
```

---

## 後方互換性

| シナリオ | 挙動 |
|----------|------|
| `change.yaml` がない既存変更 | `--schema` / プロジェクトデフォルト / `spec-driven` を使用 |
| `config.yaml` がない既存プロジェクト | `spec-driven` にフォールバック |
| `--schema` を指定 | `change.yaml` を上書き（情報メッセージ付き） |
| プロジェクト内スキーマなし | そのままユーザー/内蔵を参照 |

既存の機能はすべて動作し、新機能は追加的に導入されます。

---

## 関連ドキュメント

- [スキーマカスタマイズ](./schema-customization.md) — 手作業の上書き手順と CLI のギャップ
- [アーティファクト POC](./artifact_poc.md) — コアとなるアーティファクトグラフ設計

## 関連コード

| ファイル | 目的 |
|------|---------|
| `src/core/artifact-graph/resolver.ts` | スキーマ解決ロジック |
| `src/core/artifact-graph/instruction-loader.ts` | テンプレート読み込み |
| `src/core/global-config.ts` | XDG パスのヘルパー |
| `src/commands/artifact-workflow.ts` | CLI コマンド |
| `src/utils/change-utils.ts` | 変更作成ユーティリティ |
