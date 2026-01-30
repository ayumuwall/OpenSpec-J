# OpenSpec-J upstream 追従ガイド

このファイルは、OpenSpec-J の upstream 追従作業に必要な
**方針（翻訳ポリシー）と手順（実作業フロー）を記述**したものです。
**追従作業開始時はこのファイルだけを読めば十分**な状態を目指しています。

---

## 0. 基本方針（必ず守る）

### 0.1 ゴール

1. **OpenSpec の仕様・挙動は upstream と同一に保つ**
2. **日本語話者にとっての体験を向上**
3. **upstream 追従がしやすい構成を維持**

### 0.2 変更してはいけないもの

- パッケージ名は `@ayumuwall/openspec`
- GitHub リンクは `ayumuwall/OpenSpec-J`
- CLI のサブコマンド名・フラグ名・引数シグネチャ
  - 例: `openspec init`, `openspec list`, `openspec validate --strict --json`
- ディレクトリ構造
- CLI の JSON 出力形式・機械可読なインターフェース

**上記に関する仕様は upstream を真とする。**

### 0.3 翻訳対象の原則

- `/openspec/` 配下は **すべて翻訳対象外**。
- `/test/` など配布物に含まれないファイルは原則翻訳対象外（日本語版テスト検証に必要な場合のみ変更）。
- 変更してよいのは **人間が読むテキスト** のみ。
  - README / docs / コメント
  - CLI の description / help / エラーメッセージ / プロンプト
  - 生成テンプレート内の説明文・ラベル・ガイド文

### 0.4 OPSX の位置づけ（v1.0.0〜）

- OPSX ワークフローがデフォルト。
- `openspec init` が OPSX スキル生成まで担う。
- `openspec experimental` は互換エイリアス（非推奨）。

### 0.5 チャット/コミュニケーション

- すべて日本語で記述する。

---

## 1. 翻訳ポリシー

### 1.1 レイヤー別方針

1. **レイヤー1：docs（ドキュメント）**
   - 対象: `README.md` / `docs/` / `CHANGELOG.md`
   - `README_OLD.md` は更新しない（残す）。
2. **レイヤー2：schemas / OPSX スキル / コマンド生成**
   - schemas: `schemas/**`（テンプレート文言の翻訳対象）
   - OPSX スキル: `src/core/templates/skill-templates.ts`（スラッシュコマンド文言のみ）
   - コマンド生成: `src/core/command-generation/**`（ユーザー向け文言のみ）
3. **レイヤー3：CLI / init・オンボーディング / artifact engine**
   - CLI: `src/cli/**`, `src/commands/**`
   - init・オンボーディング: `src/core/init.ts`, `src/core/shared/**`, `src/ui/**`, `src/prompts/**`（ユーザー向け文言のみ）
   - artifact engine: `src/core/artifact-graph/**`（ユーザー向け文言のみ）

### 1.2 テンプレート翻訳のルール

- 見出しやキーワード（パーサ依存）は変更しない。
  - 例: `## ADDED Requirements`
- 見出しは英語のまま、本文だけ日本語化する。
- Scenario フォーマットは維持。

### 1.3 CLI メッセージ翻訳のルール

- コマンド名・フラグは翻訳しない。
- エラーコードや識別子は変更しない。

### 1.4 用語集（優先訳）

- Spec-driven development → 仕様駆動開発
- spec → 仕様
- change → 変更
- change proposal → 変更提案
- spec delta → 仕様差分
- source-of-truth spec → ソース・オブ・トゥルース仕様 / 単一の真実の仕様
- capability → 機能
- tasks → タスク
- archive (動詞) → アーカイブする
- apply (動詞) → 適用する
- scaffold (動詞) → ひな形を作成する（テンプレートを生成する）
- validate → 検証する
- workflow → ワークフロー
- requirements → 要件
- scenario → シナリオ
- strict validation → 厳密検証
- user journey → ユーザー体験の流れ

---

## 2. upstream 追従フロー（作業手順）

### 2.0 事前確認

```
node -v
git status -sb
git remote -v
```

- Node.js 要件（例: `>= 20.19.0`）を満たす
- 作業ブランチが clean
- `upstream` が Fission-AI/OpenSpec を指している

### 2.1 upstream を main に取り込む（タグ同期）

```
git checkout main
git fetch upstream --tags
git merge vX.Y.Z
git tag -a upstream-vX.Y.Z -m "upstream vX.Y.Z"
```

- **必ずリリースタグで取り込む。** `upstream/main` は使わない。

### 2.2 差分の収集と分類

```
mkdir -p diffs
git diff --name-status upstream-vA.B.C upstream-vX.Y.Z > diffs/upstream-vA.B.C__upstream-vX.Y.Z.files.txt
git diff upstream-vA.B.C upstream-vX.Y.Z > diffs/upstream-vA.B.C__upstream-vX.Y.Z.diff
```

- 前バージョンの作業用に生成した `diffs/` 配下のファイルは削除してから新規作成する
- `diffs/upstream-vA.B.C__upstream-vX.Y.Z.files.txt` のリストを分類し、`diffs/upstream-vA.B.C__upstream-vX.Y.Z.scope.md` にまとめる（以下の様式）。
  - 各項目の先頭は `- [ ]`（進捗管理用）
  - 末尾に **翻訳対象外** セクションを作る（チェックボックスは付けない）

```
# Scope (upstream-vA.B.C → upstream-vX.Y.Z)

※ 進捗管理用。各項目の `- [ ]` を更新して利用する。

## docs

- [ ] M README.md
- [ ] A docs/...

## schemas

- [ ] M schemas/...

## OPSX スキル

- [ ] M src/core/templates/skill-templates.ts

## artifact engine

- [ ] M src/core/artifact-graph/...

## コマンド生成

- [ ] A src/core/command-generation/...

## init・オンボーディング

- [ ] M src/core/init.ts

## CLI

- [ ] M src/cli/index.ts

## その他

- [ ] M package.json

## 翻訳対象外

A openspec/changes/...
M test/...
```

### 2.3 ja-docs に切り替え

```
git checkout ja-docs
git merge main
```

### 2.4 ローカライズ反映（差分を最小に）

優先順:
1. `README.md` などドキュメント
2. schemas/テンプレート（`schemas/**`）
3. OPSX スキルテンプレート（`src/core/templates/skill-templates.ts`）
4. アーティファクトエンジン・初期化フローのユーザー向け文言
5. CLI メッセージ
6. その他
7. テスト期待値

実施ポイント:
- `scope.md` のチェックボックスを進捗の唯一の記録として更新する
  - すべて完了したら次工程へ進む
- 変更箇所のみ翻訳し、未変更箇所は現行を維持
- コマンド名・フラグ・ファイルパスは翻訳しない
- `OPENSPEC-J:NOTE` を維持
- README_OLD.md は同期対象外
- 翻訳対象外（/openspec/, /test/ など）は編集しない
- 翻訳が一通り終わったら `LOCALIZATION-NOTES.md` を確認し、**文字列置換では解消できないロジック変更**の有無を点検

### 2.5 検証

```
pnpm build
pnpm test
node bin/openspec.js --help
node bin/openspec.js init /tmp/openspec-j-init
node bin/openspec.js validate --strict
```

- 主要コマンドのヘルプ文言を目視確認
- テンプレート生成が日本語で崩れていないか確認
- `openspec init` で OPSX スキル生成が行われることを確認

### 2.6 仕上げ（記録）

- `SESSION_MEMO.md` を参照し、要約して `CHANGELOG.md` に追従内容を追記（OpenSpec-J 独自変更は `[OpenSpec-J]` 付き）
- `README.md` の「現在の同期元は OpenSpec vX.Y.Z」を更新

---

## 3. リリース手順（タグと公開）

### 3.1 リリースタグ付与と GitHub Release 作成

```
git checkout ja-docs
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z

# GitHub Release 作成（CHANGELOG から該当セクションを抜粋して貼る）
gh release create vX.Y.Z --title "vX.Y.Z" --notes "<CHANGELOG.md の該当セクション>"
```

### 3.2 npm 公開

```
pnpm build
npm publish --access public
```

---

## 4. コミット運用

### 4.1 コミットメッセージ

- 形式: `<type>(<scope>): <title>`（scope 任意）
- type: `feat` | `fix` | `docs` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `style` | `revert`
- 50 文字以内、命令形/現在形、末尾句読点なし
- 本文は日本語、先頭タグのみ英語

本文テンプレート:
```
主な変更:
- ～

理由 / 背景:
- ～

動作確認:
- ～

影響範囲:
- ～

互換性:
- 破壊的変更なし
# BREAKING CHANGE:
# - ～

関連:
- Issue: #123
- PR: <link>
- 参考: <link>
```

---
