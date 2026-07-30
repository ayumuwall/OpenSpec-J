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

### 1.1 翻訳品質の最重要方針（重要）

- **英語原文を単語単位で置き換えた直訳調にしない。**
- 日本の IT 技術者が README / docs / CLI ヘルプ / CHANGELOG / リリースノートとして読んだときに、自然に意味を取れる日本語へ言い換える。
- 原文の構造や技術的な意味を保ちながら、必要に応じて語順・主語・述語・説明の粒度を日本語として読みやすい形に調整する。
- 技術用語は、日本の開発現場で一般的に通じる表現を優先する。
  - 定着しているカタカナ語は使用してよい（例: ワークフロー、テンプレート、アーカイブ、フォールバック、フェーズ）。
  - 不自然な英語混じりや直訳語は避ける（例: `opt-in 化` ではなく「明示的に実行した場合だけ有効にする方式」など）。
- 日本語に言い換えるべきか判断に迷う技術用語は、勝手に訳語を決めず、作業を進める前に利用者へ確認する。
- コマンド名・フラグ・識別子・ファイルパス・製品名など、仕様や実行に関わる固有名詞は翻訳しない。

### 1.2 レイヤー別方針

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

### 1.3 テンプレート翻訳のルール

- 見出しやキーワード（パーサ依存）は変更しない。
  - 例: `## ADDED Requirements`
- 見出しは英語のまま、本文だけ日本語化する。
- Scenario フォーマットは維持。

### 1.4 CLI メッセージ翻訳のルール

- コマンド名・フラグは翻訳しない。
- エラーコードや識別子は変更しない。

### 1.5 用語集（優先訳）

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
git tag -a upstream-vX.Y.Z -m "upstream vX.Y.Z" vX.Y.Z^{}
```

- **必ずリリースタグで取り込む。** `upstream/main` は使わない。
- `vX.Y.Z^{}` を使い、注釈タグでも確実にコミットを指すようにする。
- **main は本家リリースタグと内容が完全一致している必要がある。**
  - タグ取り込み直後に必ず確認する:
    ```
    git diff --name-status vX.Y.Z..HEAD
    ```
  - 差分がある場合はタグ内容で上書きし、内容一致を担保する:
    ```
    git restore --source vX.Y.Z -- .
    git commit -m "chore: sync main to vX.Y.Z"
    ```
  - ただし、これは一時的な内容一致確認のための追加コミットに留める。最終的には `main` / `origin/main` ともに本家リリースタグの**実コミットそのもの**を指す状態に戻すこと。
    - 例:
      ```
      git branch -f main vX.Y.Z^{}
      git push origin -f main
      ```
    - `vX.Y.Z` が注釈タグの場合は、必ず `vX.Y.Z^{}` を使って実コミットを指す。

### 2.2 差分の収集と分類

```
mkdir -p diffs
git diff --name-status upstream-vA.B.C upstream-vX.Y.Z > diffs/upstream-vA.B.C__upstream-vX.Y.Z.files.txt
git diff upstream-vA.B.C upstream-vX.Y.Z > diffs/upstream-vA.B.C__upstream-vX.Y.Z.diff
```

- 前バージョンの作業用に生成した `diffs/` 配下のファイルは削除してから新規作成する
- ここで収集するのは **upstream の前回版から今回版までの変更**であり、OpenSpec-J 全体のローカライズ差分ではない。
  - upstream で変更されていない既存の日本語訳・パッケージ名・リンク・独自ファイルは scope に現れないが、§2.3 の通常マージでそのまま保持される。
  - scope に現れない既存差分を、パッチ化して再適用したり、本家版から再構築したりしない。
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
JA_DOCS_BEFORE_MERGE=$(git rev-parse HEAD)

# 前回 upstream タグが両ブランチの祖先であることを確認する
git merge-base --is-ancestor upstream-vA.B.C ja-docs
git merge-base --is-ancestor upstream-vA.B.C main

git merge main
```

- **必ず通常の `git merge main` を使う。競合が多くても、それだけを理由に履歴異常と判断しない。**
  - docs / CLI / OPSX テンプレートを広範囲に翻訳しているため、upstream が同じ周辺を更新すれば、正しい共通祖先でも大量の競合が発生する。
  - 履歴が疑わしい場合は、競合数から推測せず `git merge-base ja-docs main` と上記 `--is-ancestor` の結果で確認する。
  - `--is-ancestor` が失敗した場合や、期待する前回 upstream タグが見つからない場合は、独自に履歴を組み替えず作業を止めて利用者へ確認する。
- 次のような「競合を減らすための合成マージ」は禁止する。
  - `git merge -s ours` で履歴だけを接続する
  - `ja-docs` の作業ツリー全体を `main` / upstream タグの内容で置き換える
  - OpenSpec-J 全体の差分をローカライズパッチとして抽出し、upstream の新ツリーへ再適用する
  - 通常マージを中止し、rebase / squash / cherry-pick などへ独断で切り替える
- 通常マージなら、upstream で同じ行が変更されていない既存のOpenSpec-J差分はGitが保持する。競合したファイルだけを§2.4に従って解消する。

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
- 競合解消では、ファイル全体を一律に upstream 側または日本語版側へ寄せない。次の3点を確認し、変更単位で統合する。
  ```
  git diff upstream-vA.B.C upstream-vX.Y.Z -- <file>
  git show "${JA_DOCS_BEFORE_MERGE}:<file>"
  git show "main:<file>"
  ```
  - upstream の仕様・ロジック・書式変更を取り込む
  - 人間向け文言は既存の日本語を維持し、新規・変更箇所を自然な日本語へ翻訳する
  - パッケージ名、リンク、`OPENSPEC-J:NOTE` などOpenSpec-J固有差分を維持する
- 変更箇所のみ翻訳し、未変更箇所は現行を維持
- **upstream の書式変更（whitespace / padding / 見出し改名 / 表カラム幅 / ASCII 図の整形など）も追従対象**。翻訳と同時にこれらの整形差分も必ず ja 側へ反映する（本文の内容変更がなく純粋な書式更新だけでも対象）
- コマンド名・フラグ・ファイルパスは翻訳しない
- `OPENSPEC-J:NOTE` を維持
- README_OLD.md は同期対象外
- 翻訳対象外（/openspec/, /test/ など）は編集しない
- マージと競合解消の直後に、OpenSpec-J の不変条件を確認する。
  ```
  node -p "require('./package.json').name"
  test -f AGENTS.OpenSpec-J.md
  test -f LOCALIZATION-NOTES.md
  git diff --exit-code "$JA_DOCS_BEFORE_MERGE" -- README_OLD.md
  ```
  - パッケージ名が `@ayumuwall/openspec` であること
  - `AGENTS.OpenSpec-J.md` / `LOCALIZATION-NOTES.md` が残っていること
  - `README_OLD.md` が変更されていないこと
  - `rg '@fission-ai/openspec|Fission-AI/OpenSpec' package.json scripts src` で、OpenSpec-J用に維持すべき名前・リンクが本家へ戻っていないか目視確認すること（upstream参照として意図した記述は除外）
- 翻訳が一通り終わったら `LOCALIZATION-NOTES.md` を確認し、**文字列置換では解消できないロジック変更**の有無を点検
  - 新しく見つけた「ロジック変更しないと本来意図どおりに動かない例外」があれば `LOCALIZATION-NOTES.md` に追記する

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
- **scope.md の `[x]` 項目について、ファイルごとに `git diff upstream-vA.B.C upstream-vX.Y.Z -- <file>` を走らせ、upstream 側の変更が ja HEAD にも反映されているかを 1 件ずつ目視確認する**。書式のみの変更（padding / 見出し改名など）も必ず取り込む。`git diff v<前 ja 版> HEAD -- <file>` が空なのに upstream 差分が非空なら、ほぼ確実に作業漏れ。

### 2.6 仕上げ（記録）

- `SESSION_MEMO.md` を参照し、要約して `CHANGELOG.md` に追従内容を追記（OpenSpec-J 独自変更は `[OpenSpec-J]` 付き）
- `README.md` の「現在の同期元は OpenSpec vX.Y.Z」を更新
- コミット前に `$session-memo` を実行して `SESSION_MEMO.md` を更新する（Codex利用時）
- GitHub Release の本文は `CHANGELOG.md` から転載せず、§3.1 の手順で別途作成する

### 2.7 定期翻訳棚卸し（差分ベース運用の盲点対策）

§2.2 の差分ベース運用は「前バージョンからの差分」しか見ないため、過去バージョンで翻訳漏れした英語文言は以後の追従作業で掘り起こされない。これを補うため、**upstream 追従とは別枠で定期的に棚卸しを実施する**。

- **起点**: **v1.0.0 以降**を対象とする。
- **対象ファイル**: 下記 A から B を差し引いた集合（`A - B`）。`test/` と `/openspec/` は対象外。
  - **A**: `src/**/*.ts` のうち、v1.0.0 以降に upstream で一度でも変更されたファイル
  - **B**: 直近の `diffs/upstream-vX.Y.Z__upstream-vX'.Y'.Z'.scope.md` で `[x]` が付いているファイル（§2.5 の逐一検証を直前に通過済みのため除外）
- **検出方法**: 各ファイルから以下の呼び出しの文字列リテラルを抽出し、「日本語を含まない & 英単語 3 文字以上が連続する」ものを候補として拾う。
  - `console.log` / `console.error` / `console.warn`
  - `throw new Error`
  - `ora(...)` / `spinner.text = ...` / `spinner.fail(` / `spinner.succeed(` / `spinner.start(` / `spinner.warn(`
  - `message:`（inquirer プロンプト等）
  - `chalk.*(` で括られたユーザー向け文字列
- **除外**: コマンド名・フラグ・識別子・URL・エラーコード・ファイルパス・YAML キー等は翻訳対象外（§0.2 / §1.3）。ホワイトリストは必要に応じて `diffs/l10n-audit-whitelist.txt` に切り出す。
- **実施タイミング**:
  - 次回 upstream 追従作業の冒頭（§2.0 の事前確認直後）に 1 回実行し、候補一覧を `diffs/l10n-audit-<YYYY-MM-DD>.md` に保存。
  - 追従 scope と合わせて翻訳対応、または規模が大きい場合は別コミット / 別 PR に切り出す。
  - 頻度目安: 追従作業ごと（毎回）、または四半期に 1 回。
- **記録**: 棚卸しで翻訳した件は `CHANGELOG.md` に `[OpenSpec-J] 翻訳棚卸し: ...` として記載する。

---

## 3. リリース手順（タグと公開）

### 3.1 リリースタグ付与と GitHub Release 作成

リリース本文は次の順序・内容で作成する。

1. 冒頭に、今回のローカライズで発生した OpenSpec-J 独自の変更を `[OpenSpec-J]` と明記して記載する。
2. upstream（`Fission-AI/OpenSpec`）の対象バージョンの GitHub Release 本文を取得し、自然な日本語に翻訳して記載する。
   - GitHub Release 本文を正とし、`CHANGELOG.md` の内容を代用しない。
   - コマンド名・フラグ・識別子・ファイルパス・リンクなどは翻訳しない。
3. 前回の OpenSpec-J リリースから今回のリリースまでに、OpenSpec-J ではリリースしなかった upstream バージョンがある場合は、その各バージョンの GitHub Release 本文も取得・翻訳して併記する。
   - 例: OpenSpec-J の前回リリースが `v1.4.0`、今回が `v1.6.0` で、`v1.5.0` をリリースしていない場合は、upstream の `v1.5.0` と `v1.6.0` の両方を含める。
   - upstream のバージョンごとに見出しを分け、古いバージョンから順に記載する。

upstream の GitHub Release 本文は、対象となる各バージョンについて次のように取得する。

```
gh release view vX.Y.Z --repo Fission-AI/OpenSpec --json body --jq '.body'
```

作成したリリース本文をファイル（例: `/tmp/openspec-j-release-vX.Y.Z.md`）に保存したうえで、タグ付与と GitHub Release 作成を行う。

```
git checkout ja-docs
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z

gh release create vX.Y.Z \
  --title "vX.Y.Z" \
  --notes-file /tmp/openspec-j-release-vX.Y.Z.md
```

- リリースタグは `vX.Y.Z` 形式を使う（`openspec-j-vX.Y.Z` は使わない）。

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
