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

1. ルート `AGENTS.md` と `openspec/AGENTS.md` を **upstream OpenSpec の基礎ルール** として尊重する。
2. この `AGENTS.OpenSpec-J.md` を **OpenSpec-J 独自の方針・翻訳ルール・運用ルール** として上乗せして従う。
3. これら 3 ファイルの内容が矛盾した場合は、  
   - 仕様・挙動 → upstream (`AGENTS.md`, `openspec/AGENTS.md`) を優先  
   - 翻訳・日本語体験 → 本ファイル（`AGENTS.OpenSpec-J.md`）を優先  
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
* validate → 検証する
* workflow → ワークフロー
* requirements → 要件
* scenario → シナリオ
* strict validation → 厳密検証

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

## 8. セッションメモ（2025-12-11）

> **TODO: コミット前に必ずこのセッションメモを更新し、実施内容・テスト状況・残タスクを記録すること。**
> **TODO: セッションメモの見出し日付（例: 2025-12-05）も、その作業日のものへ必ず更新すること。**

### 実施したこと
- CLI/コアの日本語化を完了し、デプリケーション警告を `src/utils/deprecations.ts` で集中管理。`OPENSPEC_SUPPRESS_DEPRECATIONS` による抑制も実装。
- 主要テスト（`test/commands/*`, `test/core/*`, `test/cli-e2e/basic.test.ts` など）の期待値をすべて日本語メッセージに合わせて更新。
- `CHANGELOG.ja.md` と `openspec-parallel-merge-plan.ja.md` を追加し、日本語ドキュメントの整備を開始。
- `AGENTS.OpenSpec-J.md` に「チャットは日本語」「セッションメモをコミット前に更新」の明示ルールを追記。
- `src/core/templates/*.ts` のテンプレート本文を日本語化し、`test/core/init.test.ts` / `test/core/update.test.ts` の期待値を更新。
- 配布される `openspec/AGENTS.md` と `openspec/project.md` を日本語テンプレートに揃え、関連テンプレート（`src/core/templates/*`）とスラッシュコマンド文面を統一し `.gitignore` に `.idea/` を追加。
- `src/core/init.ts` の「(already configured)」表示と `src/commands/spec.ts` の英語メッセージを日本語化し、関連テストを更新。
- 用語集の capability の訳語を「機能」に統一し、テンプレート・指示文中の「ケイパビリティ」表記を「機能」に置換。

### テスト状況
- Node v22.20.0 / `pnpm test`（Vitest 全体）を実行し 279 件すべて成功。テンプレート日本語化後の回帰確認済み。
- Node v22.20.0（`nvm use 22.20.0`）/ `npx vitest run test/core/init.test.ts test/core/update.test.ts` を実行し成功。
- Node v20.19.6 / `pnpm test` を実行し 23 files / 279 tests すべて成功（CLI メッセージ日本語化後の回帰確認）。
- 今回の訳語統一では文言変更のみのため追加テストは未実施。

### 残タスク（推奨）
- [x] レイヤー2テンプレート（`src/core/templates/*.ts`）の本文を日本語化し、`init` テストを更新して `pnpm test` を実行する。
- [x] デフォルトで配布される `openspec/AGENTS.md` と `openspec/project.md` をテンプレートと同じ日本語文面に揃え、`openspec validate --strict` で整合性を確認する。
- [x] CLI 出力に残る英語メッセージ（例: `src/core/init.ts` の “already configured” 表記や `src/commands/spec.ts` のエラー文）を日本語化し、該当テストを更新して回帰確認する。

### 運用ルール（セッションメモ）
- 作業コミット時には、このセクション（セッションメモ）を更新し、実施内容・テスト状況・残タスクを追記すること。
- 残タスクはチェックボックス形式で管理し、完了したら `[x]` に更新して一目でわかるようにすること。
