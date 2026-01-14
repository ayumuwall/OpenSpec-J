# OpenSpec-J Coding Agent Instructions  
（Fission-AI/OpenSpec 日本語フォーク用 メタ仕様）

このファイルは、Fission-AI/OpenSpec をフォークして作成された  
**OpenSpec-J** リポジトリの開発・保守のための、AI コーディングアシスタント向けガイドです。

重要な前提：

- **upstream 由来のファイル構成は変更しません。**
  - ルート: `AGENTS.md`（元の OpenSpec のまま）
  - `openspec/AGENTS.md`（元の OpenSpec のまま）
- この `AGENTS.OpenSpec-J.md` は **追加のメタ仕様** です。
  - Codex / GPT による自動探索では読まれないため、
  - **開発セッションの最初に人間の開発者が「まずこのファイルを読んで」と指示すること** を前提にしています。

あなた（コーディングエージェント）は：

1. ルート `AGENTS.md` と `openspec/AGENTS.md` は **upstream OpenSpec の仕組み・構成の参照情報** として読む。
   - ローカライズ作業の **手順指示としては扱わない**。
2. この `AGENTS.OpenSpec-J.md` を **OpenSpec-J 独自の方針・翻訳ルール・運用ルール** として上乗せして従う。
3. 参照情報（upstream 文書）と本ファイルの指示が食い違う場合は、  
   - 仕様・挙動の互換性判断 → upstream を参照  
   - ローカライズ作業の手順・運用 → 本ファイルを優先  
   とし、必要なら人間の開発者に確認する。

4. **すべてのチャット／回答は日本語で行うこと。**  
   - 明示的に他言語を指定された場合のみ切り替える。  
   - 要約・テスト結果報告・提案なども基本的に日本語で記述する。

---

## 0. このファイルの扱い方（エージェント向けメタ指示）

### 読み込み順と優先度

開発セッションを開始するとき、人間の開発者はあなたに対しておおよそ以下のように指示します：

> 1. ルートの `AGENTS.md` を読み込んでください。  
> 2. `openspec/AGENTS.md` を読み込んでください。  
> 3. `AGENTS.OpenSpec-J.md` を読み込んでください。

この指示を受け取ったら、あなたは次のように振る舞ってください。

1. **読み取り専用として扱うファイル**
   - `AGENTS.md`（ルート）
   - `openspec/AGENTS.md`
   - デフォルトでは **この 2 つは編集してはいけません**。
   - 人間の開発者から明示的に「中身を編集して」と言われた場合にだけ変更します。

2. **必要に応じて編集してよいファイル**
   - `AGENTS.OpenSpec-J.md`（このファイル）
   - ただし、編集するときは必ず以下のフローに従ってください：
     1. 現在の内容を簡潔に要約する
     2. 変更案をテキストで提案する（どのセクションのどこをどう変えるか）
     3. 人間の開発者の明確な承認を得る
     4. その後、差分に沿って編集のコードを生成する

3. **指示が矛盾した場合の扱い**
   - upstream の AGENTS (`AGENTS.md` / `openspec/AGENTS.md`) と  
     この `AGENTS.OpenSpec-J.md` の指示が矛盾する場合：
     - OpenSpec の機能・仕様・挙動 → upstream 側を優先
     - 翻訳 / 日本語体験 / ローカライズ戦略 → 本ファイルを優先
   - チャットで与えられた一時的な指示が上記と矛盾する場合：
     - その場で人間の開発者に確認する（勝手にどちらかを無視しない）

### ローカライズ作業の運用（OpenSpec 手順は使わない）

- 本リポジトリのローカライズ作業では OpenSpec の変更提案フローや `openspec` 手順は使わない。
- `AGENTS.md` と `openspec/AGENTS.md` は **指示ではなく参照情報** として扱う。
- 実際の作業指示は本ファイルと人間の開発者の指示に従う。

### コミットメッセージ運用（強制）

**原則**: Title/Desc 構造を必須とし、本文は日本語、先頭タグは英語 Conventional Commits を使う。

1) Title（件名）

- 形式: `<type>(<scope>): <title>`（scope 任意）
- type は Conventional Commits: `feat` | `fix` | `docs` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `style` | `revert`
- 1 行・50 文字以内、末尾句読点なし、命令形/現在形で「何をするか」を簡潔に。
- 破壊的変更は `type!:` とし、Desc に `BREAKING CHANGE:` セクションを入れる。
- 例: `fix: 空の変更/仕様でスピナーが止まらない問題を回避` / `feat: openspec view の概要出力を日本語化`

2) Desc（本文 / Body）

- Title の後ろに空行 1 行を入れて本文を開始。
- 各行は目安 72 文字で改行。Markdown の箇条書き可。
- 原則テンプレート（必要に応じて省略可、ただし「何を/なぜ/どう検証/影響」は入れる）:
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
# 破壊的変更がある場合は下行を使用
# BREAKING CHANGE:
# - ～

関連:
- Issue: #123
- PR: <link があれば>
- 参考: <設計/議論へのリンク等>
```

- 英文のみのコミットは禁止。本文は日本語で、先頭タグだけ英語（Conventional Commits）。

---

### CHANGELOG タグ運用

- `[OpenSpec-J]` は **本ローカライズ作業で生まれた変更** を示すタグとして使用する。
- upstream 由来の変更点はタグを付けず、本文の箇条書きで記述する。

---

## 1. プロジェクトのゴールと範囲

### ゴール

OpenSpec-J の目的は、次の 3 点です。

1. **OpenSpec の仕様・挙動そのものは upstream と同じに保つ**  
   - コマンド名・フラグ・ファイル構造・JSON スキーマなどは変更しない。
2. **日本語話者にとっての開発体験を向上させる**
   - ドキュメント（README / docs）が日本語で読める。
   - `openspec init` などで生成されるテンプレートの文章が日本語で理解しやすい。
   - CLI のヘルプやエラー文が日本語で表示される（英語併記も可）。
3. **upstream のアップデートに追従しやすい構成に保つ**
   - 差分を最小にし、追従時に何を更新すればよいかが明確であること。

### 守るべき制約（絶対に壊してはいけないもの）

AI コーディングアシスタントとして、以下は **変更してはいけません**。

- パッケージ名・bin 名（OpenSpec-J で既に設定されているもの）
- CLI のサブコマンド名・フラグ名・引数のシグネチャ  
  - 例：`openspec init`, `openspec list`, `openspec validate --strict --json`
- `openspec/` ディレクトリ構造
  - `openspec/project.md`
  - `openspec/AGENTS.md`（ユーザーのプロジェクトに生成されるもの）
  - `openspec/specs/`
  - `openspec/changes/`
- CLI の JSON 出力形式・機械可読なインターフェース
- 上記に関する仕様は **upstream の AGENTS.md / openspec/AGENTS.md を真とする**

変更してよいのは、原則として **人間が読むテキスト** です。

- README / docs / コメント
- CLI の description / help / エラーメッセージ / プロンプト
- 生成テンプレート内の説明文・ラベル・ガイド文

---

## 2. レイヤー別のローカライズ方針

OpenSpec-J でのローカライズは、次の 3 レイヤーに分けて考えます。

1. **レイヤー1：ドキュメント（GitHub / 開発者向け）**
2. **レイヤー2：生成テンプレート（ユーザーのプロジェクトに入る）**
3. **レイヤー3：CLI メッセージ（実行時の UX）**

### /openspec 配下の扱い（翻訳対象外）

- `/openspec` 配下のドキュメントや仕様は、上流が OpenSpec を使って開発している名残のため、**ローカライズ対象外**とする。
- 内容は英語のまま維持し、差分同期時も翻訳は行わない。

### 2.1 レイヤー1：ドキュメント

対象：

- `README.md`（日本語版、OpenSpec-J で追加・維持する）
- `docs/` 配下のガイド（あれば）

方針：

1. `README.md` は upstream をベースに維持しつつ、OpenSpec-J 独自の説明を最小限追記する。
2. `README.md` を **日本語のエントリーポイント** として用意する。
   - 冒頭で「OpenSpec-J は Fission-AI/OpenSpec の日本語フォーク」であること。
   - 対応している upstream バージョン（例：`OpenSpec v0.x.y 時点`）を明記。
3. 英語→日本語への翻訳は直訳ではなく、
   - 「OpenSpec を初めて触る日本語開発者」に自然な文章を優先する。
   - 用語は後述の「用語集」を優先する。

エージェントは：

- upstream の README 更新を検知したら、その差分を README.md に反映するタスクを提案する。
- 翻訳編集時、コマンド名・ファイルパスは変更しない。

---

### 2.2 レイヤー2：生成テンプレート

対象（典型例）：

- ユーザープロジェクトに生成される `openspec/project.md`
- ユーザープロジェクトに生成される `openspec/AGENTS.md`
- 変更作成時の `proposal.md` / `tasks.md` / `spec.md` などの Markdown テンプレート

方針：

1. テンプレートのソース位置を特定する（`src/templates/` 等）。
2. 「構造とパーサに必要な要素」は維持しつつ、日本語化する。

   - 見出し構造例：
     - `## Why`
     - `## What Changes`
     - `## Impact`
   - これらの見出しは、可能な限り **英語のまま維持** する。
   - 代わりに、その下の本文・説明・箇条書きを日本語で書く。
   - Scenario フォーマットも同様：
     - `#### Scenario: ...`
     - `- **WHEN** ...`
     - `- **THEN** ...`

3. OpenSpec のパーサが依存している見出しやキーワード  
   （例：`## ADDED Requirements` など）は **絶対に変更しない**。

4. ユーザープロジェクト側 `openspec/AGENTS.md` については：
   - 上部に日本語の説明・ガイドラインを追加し、
   - 必要に応じて英語原文も残す（二言語併記でもよい）。

5. テンプレート変更後は必ず、以下を実行する：
   - `openspec init` 相当（テスト or CLI）でテンプレ生成を試す。
   - 生成物を `openspec validate --strict` で検証する。
   - 日本語文が崩れていないか目視確認する。

---

### 2.3 レイヤー3：CLI メッセージ

対象：

- `openspec` コマンドのヘルプ・description 文
- エラー文・警告文・対話プロンプト
- `init`, `list`, `validate`, `archive` など主要コマンド出力

方針：

1. **コマンド名やフラグは翻訳しない。**
   - 例：`openspec validate --strict --json` はそのまま。
   - 日本語メッセージ側で説明を補う。

   2. ヘルプテキストは次のいずれかの形にする：
      - 英語 + 日本語（括弧書きなどで併記）
      - あるいは日本語メイン + 簡潔な英語補足

      例：

   ```text
   Validate OpenSpec changes and specs (OpenSpec の変更と仕様を検証します)
   ```

3. エラーメッセージは、日本語で原因と対処がわかるように書く。

   * 必要に応じて `[original: ...]` で英語原文を短く添えてもよい。
   * エラーコードや識別子（`ERR_***` など）は変更しない。

4. 対話プロンプト（`init` ウィザードなど）では：

   * ステップ説明を日本語で明確にする。
   * 選択肢のラベルは、日本語 + 固有名は英語のまま。

5. CLI メッセージ変更後は、少なくとも以下を確認する：

   * `openspec --help`
   * 主要サブコマンドの `--help`
   * 代表的な成功ケース・エラーケースでメッセージを目視確認。

---

## 3. 翻訳ポリシーと用語集

### トーン・スタイル

* 想定読者：

  * 普段から英語の技術文書を読むが、日本語のほうが理解が早い開発者。
* 文体：

  * ドキュメント：です・ます調。
  * CLI メッセージ：やや簡潔な常体でもよいが、ぶっきらぼうにしない。
* 優先順：

  1. 正確さ（upstream と意味が同じであること）
  2. 簡潔さ（冗長にしない）
  3. 日本語として自然であること

### 用語集（優先して使う訳語）

次の訳語を優先する。既存の日本語がこのポリシーと違っていたら、可能な範囲で合わせてよい。

* Spec-driven development → **仕様駆動開発**
* spec → 仕様
* change → 変更
* change proposal → 変更提案
* spec delta → 仕様差分
* source-of-truth spec → ソース・オブ・トゥルース仕様 / 単一の真実の仕様
* capability → 機能
* tasks → タスク
* archive (動詞) → アーカイブする
* apply (動詞) → 適用する
* scaffold (動詞) → ひな形を作成する（テンプレートを生成する）
* validate → 検証する
* workflow → ワークフロー
* requirements → 要件
* scenario → シナリオ
* strict validation → 厳密検証
* user journey → ユーザー体験の流れ

---

## 4. upstream 同期とブランチ運用

### upstream との関係

* `upstream` リモートは Fission-AI/OpenSpec を指している前提。
* 新しいバージョンが出たときの基本フロー：

```bash
git checkout main
git fetch upstream
git merge upstream/main   # もしくは git rebase upstream/main

git checkout -b ja-sync/v0.x.y   # 必要に応じて同期用ブランチを作る
```

### 同期作業の手順（エージェントの行動指針）

1. upstream の差分を確認する。

   * README / docs
   * CLI コマンド・ヘルプ
   * テンプレート
2. 差分を要約し、人間の開発者に報告する（どこが変わったか）。
3. 影響範囲に応じて、OpenSpec-J 側で必要な更新タスクを提案する。

   * README.ja.md の更新
   * テンプレートの翻訳差分
   * CLI 日本語メッセージの追加・修正
4. 実際の変更は、小さな単位（「docs だけ」「CLI だけ」など）に分けて実施する。

### ブランチ運用とタグ付け（OpenSpec-J）

- `main` は **upstream のスナップショット**として扱う（ローカライズは入れない）。
- `ja-docs` は **ローカライズ版**として扱う。
- タグ運用:
  - upstream 基準点: `upstream-vX.Y.Z` を `main` に付与する（注釈付きタグ推奨）。
  - ローカライズ版: `openspec-j-vX.Y.Z` を `ja-docs` に付与する（注釈付きタグ推奨）。

### 差分作成とローカライズ手順

- ローカライズは **英語版同士の差分**を基準に行う。
- 手順:
  1. upstream の対象タグ（例: `v0.16.0` と `v0.17.2`）を取得し、`main` を同期する。
  2. `upstream-v0.16.0` / `upstream-v0.17.2` を付与する。
  3. 差分ファイルを作成し、変更箇所のみローカライズする。
     - 例: `diffs/upstream-v0.16.0__upstream-v0.17.2.diff`
     - 例: `diffs/upstream-v0.16.0__upstream-v0.17.2.files.txt`
  4. 未変更箇所の日本語は維持し、**変更箇所のみ翻訳**して `ja-docs` に反映する。
  5. ローカライズ完了後に `openspec-j-vX.Y.Z` を付与する（例: `openspec-j-v0.17.2`）。

---

## 5. 典型的なタスク例

### 例1：README の日本語版を更新

1. upstream の README の変更箇所を特定し、内容を要約する。
2. `README.ja.md` の対応箇所を見つけ、意味が揃うように日本語を更新する。
3. コマンド名・ファイルパス・コード例は変更しない。

### 例2：新コマンドの CLI メッセージを日本語化

1. 新規サブコマンド（例：`openspec foo`）の定義ファイルを特定する。
2. description / help / error message などの英語文を確認し、意図を理解する。
3. 上記ポリシーに従って日本語メッセージを追加・修正する。
4. `openspec foo --help` などを実行する想定でメッセージを確認し、必要に応じて調整する。

### 例3：テンプレートの翻訳

1. `proposal.md` テンプレートのソースを見つける。
2. セクション構造は維持しつつ、説明文・ガイド文を日本語で書く。
3. OpenSpec のバリデーションに影響しないことを確認する。

---

## 6. 作業開始前・終了時チェックリスト

### 作業開始前

* [ ] Node.js のバージョンが OpenSpec の要件を満たしている（例：`>= 20.19.0`）
* [ ] `npm install` / `pnpm install` 済みで、テストが実行できる
* [ ] `git status` が clean か、作業用ブランチを作成済み
* [ ] `AGENTS.md`（ルート）, `openspec/AGENTS.md`, `AGENTS.OpenSpec-J.md` を読み、矛盾がないか把握した

### 作業終了時

* [ ] 関連テスト（単体・統合）を実行した
* [ ] 主要 CLI コマンドを試し、日本語メッセージを目視確認した
* [ ] 変更点を簡潔に要約できる状態になっている（コミットメッセージや PR 説明に使える）

---

## 7. まとめ

* `AGENTS.md`（ルート）と `openspec/AGENTS.md` は **upstream OpenSpec のルール**。
* `AGENTS.OpenSpec-J.md`（このファイル）は **OpenSpec-J のローカライズと運用のためのメタ仕様**。
* あなたは常に：

  * upstream の仕様・構造を壊さないこと
  * 日本語ユーザーの体験をよくすること
    の両方を満たすように振る舞ってください。

不明点や矛盾を見つけた場合は、勝手にどちらかを無視せず、
「どのルールとどのルールが衝突しているか」を整理した上で、人間の開発者に確認してください。

---

## 8. セッションメモ

> **TODO: コミット前に必ず当日のエントリを追記し、実施内容・テスト状況・残タスクを記録すること。**
> **TODO: 新しい作業日は新規エントリとして追加し、過去の記録は残すこと。**
> **TODO: 同日の記録は 1 件に統合し、新しい日付が先頭になるよう降順で並べる。今後もこのルールを守ること。**

### 2026-01-14

#### 実施したこと
- `ja-sync/v0.19.0` に切り替え、upstream v0.19.0 をマージして競合を解消。
- v0.19.0 の CLI/テレメトリ/補完/スラッシュコマンド/ドキュメントの日本語化とテスト期待値更新。
- `CHANGELOG.md` の v0.18.0/v0.19.0 の OpenSpec-J 追記整理。
- `LOCALIZATION-NOTES.md` にロジック依存の注意点と単数/複数表記の統一を追記。
- diffs を `upstream-v0.17.2__upstream-v0.19.0` に更新し、v0.18.0 の差分資料を削除。
- `README.md` の新着バナーと同期元表記を v0.19.0 に更新。
- `docs/experimental-workflow.md` の図表内英語を日本語化。

#### テスト状況
- `pnpm test` を実行し成功。

#### 残タスク（推奨）
- [ ] `schemas/*` の description/instruction とテンプレートコメントの日本語化。

### 2026-01-08

#### 実施したこと
- upstream v0.18.0 を `ja-sync/v0.18.0` にマージし、競合を解消。
- `archive/list/view/update` の挙動更新を取り込み、日本語文言を維持。
- `specs-apply` 分離や `list --sort/--json` など v0.18.0 の機能更新を反映。
- v0.17.2 -> v0.18.0 の差分ファイルと翻訳スコープ一覧を作成。
- `specs-apply` のエラー/警告/ログとスケルトン文を日本語化。
- `view` の見出しを日本語に揃え、関連テスト期待値を更新。
- v0.18.0 で追加された docs 一式（`docs/`）を日本語化。
- `CHANGELOG.md` の v0.18.0 セクションを日本語化。
- `docs/experimental-release-plan.md` の手順・出力例・コメント文の翻訳と体裁修正。
- コードブロック内のコメント的な説明文を日本語化。

#### テスト状況
- `pnpm test -- test/core/archive.test.ts test/core/view.test.ts` を実行。
- それ以外は未実施（ドキュメント更新のみの範囲を含む）。

### 2025-12-26

#### 実施したこと
- `/openspec` 配下は翻訳対象外とする方針を追記。
- CHANGELOG の `[OpenSpec-J]` タグ運用ルールを追記し、v0.17.2/0.17.1/0.17.0 の内容を追記。
- upstream v0.16.0 -> v0.17.2 の差分分類ファイルを追加。
- ローカライズ作業では OpenSpec 手順を使わず、`AGENTS.md` / `openspec/AGENTS.md` を参照情報として扱う方針を明記。
- upstream v0.16.0 / v0.17.2 のスナップショット用タグ（`upstream-v0.16.0`, `upstream-v0.17.2`）を追加。
- 英語版同士の差分確認用に `diffs/` 配下へ diff ファイルを作成。
- v0.16.0 -> v0.17.2 のローカライズ作業を docs / templates / CLI / テストに分割してタスク化。
- `test/cli-e2e/basic.test.ts` のヘルプ出力期待値を日本語表記（`使い方:`）に合わせて更新し、フルテストを実行。
- スラッシュコマンドの frontmatter / description（全ツール）を日本語に統一し、テンプレート出力をローカライズ。
- CLI/コアの日本語化を完了し、デプリケーション警告を `src/utils/deprecations.ts` で集中管理。`OPENSPEC_SUPPRESS_DEPRECATIONS` による抑制も実装。
- 主要テスト（`test/commands/*`, `test/core/*`, `test/cli-e2e/basic.test.ts` など）の期待値をすべて日本語メッセージに合わせて更新。
- `CHANGELOG.ja.md` と `openspec-parallel-merge-plan.ja.md` を追加し、日本語ドキュメントの整備を開始。
- `AGENTS.OpenSpec-J.md` に「チャットは日本語」「セッションメモをコミット前に更新」の明示ルールを追記。
- `src/core/templates/*.ts` のテンプレート本文を日本語化し、`test/core/init.test.ts` / `test/core/update.test.ts` の期待値を更新。
- 配布される `openspec/AGENTS.md` と `openspec/project.md` を日本語テンプレートに揃え、関連テンプレート（`src/core/templates/*`）とスラッシュコマンド文面を統一し `.gitignore` に `.idea/` を追加。
- `src/core/init.ts` の「(already configured)」表示と `src/commands/spec.ts` の英語メッセージを日本語化し、関連テストを更新。
- 用語集の capability の訳語を「機能」に統一し、テンプレート・指示文中の「ケイパビリティ」表記を「機能」に置換。
- `CHANGELOG.ja.md` の内容を本リポ用の `CHANGELOG.md` に統合し、日本語 changelog を単一化。
- CLI 補完/設定/タスク進捗の表示を日本語化し、postinstall 出力を翻訳。関連テスト（completion/config/archive/list/validate）を更新。
- v0.16.0 以降のローカライズ変更点を `CHANGELOG.md` に整理し、`[OpenSpec-J]` タグを太字化。
- CLI/テンプレート/補完/スラッシュコマンドの英語文言を追加で日本語化し、関連テスト期待値を更新。
- README の CI バッジを本リポジトリ参照に変更。
- CI バッジ/ワークフロー URL の到達性を確認（HTTP 200）。

#### テスト状況
- `pnpm test` を実行し成功（32 files / 507 tests）。
- CI バッジ確認のみの作業については追加テスト未実施。

#### 残タスク（推奨）
- [x] 差分一覧を docs / templates / CLI / テストに分類して作業スコープを確定する。
- [x] docs レイヤーの差分をローカライズして反映する。
- [ ] templates レイヤーの差分をローカライズして生成物との差分を確認する。
- [x] CLI メッセージの差分をローカライズし、関連テスト期待値を更新する。
- [x] 全体差分を再確認し、必要なテストを実行する。
- [x] ローカライズ完了後に `openspec-j-v0.17.2` タグを付与する。
- [x] レイヤー2テンプレート（`src/core/templates/*.ts`）の本文を日本語化し、`init` テストを更新して `pnpm test` を実行する。
- [x] デフォルトで配布される `openspec/AGENTS.md` と `openspec/project.md` をテンプレートと同じ日本語文面に揃え、`openspec validate --strict` で整合性を確認する。
- [x] CLI 出力に残る英語メッセージ（例: `src/core/init.ts` の “already configured” 表記や `src/commands/spec.ts` のエラー文）を日本語化し、該当テストを更新して回帰確認する。

#### 実施したこと
- 用語集に user journey の訳語（ユーザー体験の流れ）を追加。
- `docs/schema-workflow-gaps.md` の用語を「ユーザー体験の流れ」に統一。

#### テスト状況
- 未実施（文面のみ）。

### 2026-01-08（追記4）

#### 実施したこと
- `docs/artifact_poc.md` の図表内文言を日本語化。

#### テスト状況
- 未実施（文面のみ）。

### 運用ルール（セッションメモ）
- 作業コミット時には当日のエントリを**追記**すること（過去の記録は消さない）。
- 残タスクはチェックボックス形式で管理し、完了したら `[x]` に更新して一目でわかるようにすること。
