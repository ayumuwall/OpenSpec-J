# スキーマのカスタマイズ

このドキュメントでは、OpenSpec のスキーマとテンプレートをユーザーがどのようにカスタマイズできるか、現状の手作業フロー、そして解消すべきギャップを説明します。

---

## 概要

OpenSpec は XDG Base Directory Specification に従った 2 段階のスキーマ解決を採用しています:

1. **ユーザー上書き**: `${XDG_DATA_HOME}/openspec/schemas/<name>/`
2. **パッケージ内蔵**: `<npm-package>/schemas/<name>/`

スキーマが要求されると（例: `spec-driven`）、リゾルバはまずユーザーディレクトリを確認します。見つかればそのスキーマディレクトリを丸ごと使用し、なければパッケージ内蔵のスキーマにフォールバックします。

---

## 現在の手作業フロー

デフォルトの `spec-driven` スキーマを上書きするには、次の作業が必要です。

### 1. 正しいディレクトリパスを特定する

| プラットフォーム | パス |
|----------|------|
| macOS/Linux | `~/.local/share/openspec/schemas/` |
| Windows | `%LOCALAPPDATA%\openspec\schemas\` |
| すべて（設定されている場合） | `$XDG_DATA_HOME/openspec/schemas/` |

### 2. ディレクトリ構造を作成する

```bash
# macOS/Linux の例
mkdir -p ~/.local/share/openspec/schemas/spec-driven/templates
```

### 3. デフォルトのスキーマファイルを探してコピーする

ユーザーは、デフォルトをコピーするためにインストール済み npm パッケージの場所を特定する必要があります。

```bash
# パッケージの場所を特定（インストール方法で変わる）
npm list -g openspec --parseable
# または
which openspec && readlink -f $(which openspec)

# パッケージの schemas/ からファイルをコピー
cp <package-path>/schemas/spec-driven/schema.yaml ~/.local/share/openspec/schemas/spec-driven/
cp <package-path>/schemas/spec-driven/templates/*.md ~/.local/share/openspec/schemas/spec-driven/templates/
```

### 4. コピーしたファイルを編集する

`schema.yaml` を編集してワークフロー構造を変更します。

```yaml
name: spec-driven
version: 1
description: My custom workflow
artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal
    template: proposal.md
    requires: []
  # アーティファクトを追加/削除/変更する...
```

`templates/` 配下のテンプレートを編集して内容のガイダンスをカスタマイズします。

### 5. 上書きが有効になっていることを確認する

現状、どのスキーマが使われているかを確認するコマンドはありません。ユーザーは「正しい場所にファイルがあること」を信じるしかありません。

---

## ギャップ分析

現在の手順には、いくつかの摩擦点があります。

| 課題 | 影響 |
|-------|--------|
| **パスの発見** | ユーザーが XDG の慣習やプラットフォーム固有のパスを知る必要がある |
| **パッケージ位置** | npm パッケージの場所はインストール方法（global/local/pnpm/yarn/volta など）で変わる |
| **ひな形生成なし** | ディレクトリ作成とファイルコピーがすべて手作業 |
| **検証手段なし** | どのスキーマが解決されたか確認できない |
| **差分比較なし** | openspec を更新しても内蔵テンプレートの変更点が分からない |
| **全体コピー必須** | 1 つのテンプレートを変えるだけでもスキーマ全体をコピーする必要がある |

### 現状サポートできないユーザーストーリー

1. *「`proposal` の前に `research` アーティファクトを追加したい」* — 手作業でのコピーと編集が必要
2. *「提案テンプレートだけをカスタマイズしたい」* — スキーマ全体をコピーする必要がある
3. *「デフォルトスキーマの中身を見たい」* — パッケージの場所を探す必要がある
4. *「デフォルトに戻したい」* — ファイルを削除して正しいパスか祈る必要がある
5. *「openspec をアップグレードしたけどテンプレートは変わった？」* — 差分を取る方法がない

---

## 提案: スキーマ構成コマンド

ユーザー向けにパス解決とファイル操作を担う CLI コマンド（またはコマンド群）を用意します。

### 案 A: 単一の `openspec schema` コマンド

```bash
# 利用可能なスキーマ一覧（内蔵とユーザー上書き）
openspec schema list

# スキーマの解決先を表示
openspec schema which spec-driven
# 出力例: /Users/me/.local/share/openspec/schemas/spec-driven/（ユーザー上書き）
# 出力例: /usr/local/lib/node_modules/openspec/schemas/spec-driven/（内蔵）

# 内蔵スキーマをユーザーディレクトリにコピーしてカスタマイズ
openspec schema copy spec-driven
# ~/.local/share/openspec/schemas/spec-driven/ に全ファイルを作成

# ユーザー上書きと内蔵の差分を表示
openspec schema diff spec-driven

# ユーザー上書きを削除（内蔵へ戻す）
openspec schema reset spec-driven

# スキーマを検証
openspec schema validate spec-driven
```

### 案 B: 専用の `openspec customize` コマンド

```bash
# 対話的にスキーマをカスタマイズ
openspec customize
# プロンプト: どのスキーマ？何を変えたい？など

# コピーして編集のために開く
openspec customize spec-driven
# ユーザーディレクトリにコピーしパスを表示、必要なら $EDITOR で開く
```

### 案 C: init 時にスキーマを選択

```bash
# プロジェクト初期化時にスキーマ選択を提示
openspec init
# ? ワークフロースキーマを選択:
#   > spec-driven (デフォルト)
#     tdd
#     minimal
#     custom (コピーして編集)
```

### 推奨アプローチ

**案 A** が最も柔軟で、Unix の慣習（離散操作のサブコマンド）にも沿います。優先度順の主なコマンドは次のとおりです。

1. `openspec schema list` — 使えるスキーマ一覧
2. `openspec schema which <name>` — 解決先の確認
3. `openspec schema copy <name>` — カスタマイズ用のひな形作成
4. `openspec schema diff <name>` — 内蔵との比較
5. `openspec schema reset <name>` — デフォルトへ戻す

---

## 実装上の考慮点

### パス解決

リゾルバはすでに `src/core/artifact-graph/resolver.ts` に存在します:

```typescript
export function getPackageSchemasDir(): string { ... }
export function getUserSchemasDir(): string { ... }
export function getSchemaDir(name: string): string | null { ... }
export function listSchemas(): string[] { ... }
```

新しいコマンドはこれらの既存関数を活用できます。

### ファイル操作

- コピーはファイル権限を保持する
- `--force` なしで既存ファイルを上書きしない
- リセットは確認プロンプトを出す

### テンプレート単体の上書き

将来の拡張として、スキーマ全体をコピーせずに個別テンプレートだけを上書きする案があります。これは解決ロジックの変更を伴います。

```
Current: schema dir (user) OR schema dir (built-in)
Future:  schema.yaml from user OR built-in
         + each template from user OR built-in (independent fallback)
```

複雑さは増えますが「1 つのテンプレートだけ変えたい」というユースケースを満たせます。

---

## 関連ドキュメント

- [スキーマワークフローのギャップ](./schema-workflow-gaps.md) — エンドツーエンドのワークフロー分析と段階的実装プラン

## 関連ファイル

| ファイル | 目的 |
|------|---------|
| `src/core/artifact-graph/resolver.ts` | スキーマ解決ロジック |
| `src/core/artifact-graph/instruction-loader.ts` | テンプレート読み込み |
| `src/core/global-config.ts` | XDG パスのヘルパー |
| `schemas/spec-driven/` | デフォルトスキーマとテンプレート |
