# ローカライズ特有の修正メモ

## 目的
- 単なる文字列翻訳にとどまらない、日本語化に伴うコード上の注意点・修正履歴を集約する。
- upstream 同期時に再発しやすい箇所を把握し、見落としを防ぐ。

## 既知の事例 / 注意点

### Codex の共有スキル参照: 日本語化と旧形式の互換性

- `src/utils/command-references.ts` は `$スキル名（Codex）、/スキル名（その他の対応エージェント）` を生成する。共有される `.agents/skills` のため、両方の呼び出し方を残す。
- `src/core/shared/skill-content-equivalence.ts` は、既知の OpenSpec スキルに限り、旧単独参照・英語の併記・日本語の併記を同等と判定する。独自スキル、左右の名前が異なる参照、本文への追記は同等とみなさない。
- 文言変更時は参照変換・同等性判定・旧 `.codex` からの移行テストを一緒に確認する。

### v1.12.0 動作確認後の日本語修正

- `verify` のシナリオ未対応条件の誤訳を修正し、「3 つの観点」「一部のアーティファクトしかない場合」などの説明に改めた。`tasks.md` の綴りとゼロ幅文字も修正した。
- ワークフローの説明を「仕様差分」「本仕様」「機能」に統一。提案の見出し `New Capabilities` / `Modified Capabilities` はスキーマ指示との対応を保つため英語に戻した。
- `explore` の図の説明を日本語化し、図そのものは ASCII 文字だけに保った。
- 日本語の検証エラーと補足の区切りを句点に変更。`変更ルート`、`アーカイブ完了`、利用統計の停止案内も修正した。
- 本家と共通のプロファイル動作、共有参照の併記、Commander の標準見出し、Node.js の生エラー、言語コンテキストの英語出力は変更しない。

### バリデーション: ガイド付与が英語メッセージ依存
- ファイル: `src/core/validation/validator.ts` (`enrichTopLevelError`)
- 症状: upstream の英語メッセージを `includes` で判定しガイド文を付加する実装だったため、日本語化後はガイドが付かないケースが発生。
- 対応: 英語メッセージに加え、日本語化済みの定数 (`VALIDATION_MESSAGES.SPEC_PURPOSE_EMPTY`, `SPEC_NO_REQUIREMENTS`, `CHANGE_WHAT_EMPTY` など) や「Why セクション」文字列もトリガーに追加し、両言語でガイドを付与できるよう拡張。
- 追加確認（v1.6.0 追従後）: `CHANGE_WHY_TOO_SHORT` のように「必須」ではなく「短すぎる」系の日本語メッセージでも、変更ファイルの必須セクションガイドが付く必要がある。`enrichTopLevelError` の条件を見直すときは、`CHANGE_WHAT_EMPTY` だけでなく `CHANGE_WHY_TOO_SHORT` と `Why セクション` 系メッセージも確認する。
- フォローアップ: upstream でメッセージ文言が増減した場合は、英語/日本語両方のトリガーを見直す。英語/日本語のガイド付与を直接確認するユニットテストを追加すると安全。

### コマンド生成: 入力見出しの検出が英語ラベル依存
- ファイル: `src/core/command-generation/adapters/command-code.ts`, `src/core/command-generation/adapters/oh-my-pi.ts`, `src/core/command-generation/adapters/opencode.ts`, `src/core/command-generation/adapters/pi.ts`
- 症状: upstream のコマンド生成アダプターは `**Input**:` 見出しを正規表現で検出し、その直後へ `$ARGUMENTS` または `$@` を挿入する。見出しを `**入力**:` へ翻訳するだけでは検出されず、生成コマンドへ呼び出し引数が渡らなくなる。
- 対応（v1.9.0）: 見出し検出を `Input` / `入力` の両方に対応させる。Command Code では再生成時の重複挿入を防ぐため、既存の引数行も `Provided arguments` / `入力された引数` の両方を認識する。
- 追加対応（v1.11.0）: 日本語の見出しで全角コロン（`**入力**：`）が使われても引数を挿入できるよう、Command Code と OpenCode の検出を半角・全角コロンの両方に対応させる。
- 追加対応（v1.10.0）: OpenCode に追加された `$ARGUMENTS` 挿入処理も `Input` / `入力` と `None required` / `不要` の両方を認識し、日本語テンプレートでは `指定された引数` を生成する。
- 互換性: 英語版または過去バージョンが生成したファイルを日本語版で更新する場合があるため、日本語だけに限定せず英語ラベルも維持する。
- フォローアップ: 入力見出しや引数行の文言を変更するときは、4アダプターの検出正規表現と `test/core/command-generation/adapters.test.ts` の挿入・重複防止テストを同時に更新する。

### Feedback: 日本語タイトルをUnicode書記素単位で短縮
- ファイル: `src/commands/feedback.ts` (`formatTitle`, `formatBody`)
- 症状: GitHub Issueタイトルを単純なUTF-16コード単位やバイト数で切ると、結合文字・絵文字・サロゲートペアを途中で分断する可能性がある。また英語のような空白区切りを前提にすると、空白のない日本語タイトルを適切に短縮できない。
- 対応（v1.10.0）: `Intl.Segmenter` の書記素単位で72文字以内へ短縮する。空白がある場合は最後の語境界を優先し、空白がない日本語では安全な書記素境界までの本文を使う。短縮前のメッセージ全文はIssue本文の「概要」に保持する。
- 互換性: `Feedback: ` はGitHub上で既存Issueを識別する接頭辞として維持し、タイトル表示だけを理由に翻訳しない。
- フォローアップ: タイトル上限や接頭辞を変更するときは、`test/commands/feedback.test.ts` のASCII、日本語、絵文字、本文への全文保持の期待値を同時に更新する。

### 単数/複数の表記を日本語で統一する扱い
- 仕様: 日本語では単数・複数の揺れを避け、カウントは「件」や「タスク」など固定表記に寄せる。
- 実例: `src/utils/task-progress.ts` の `formatTaskStatus` は常に「タスク」表記、`src/core/view.ts` と `src/core/list.ts` は `件` を用いた固定表記に統一。
- 追加実例（v1.9.0）: `src/core/migration.ts` の `keptInPlaceNotice` は、英語の `file` / `files` と `differ` / `differs` の分岐を廃止し、件数にかかわらず「N 件のファイル」に統一。
- 補足: `src/core/parsers/change-parser.ts` では互換性のため `requirement`/`requirements` の両方を保持しているが、表示文言は日本語の単一表記で運用している。`ADDED` / `MODIFIED` だけでなく、`REMOVED` / `RENAMED` の `description` もユーザー向け表示に出る可能性があるため、upstream 追従時に英語へ戻っていないか確認する。

### CLI 結合テスト: 固定一時ディレクトリは並列実行で衝突する
- ファイル: `test/commands/validate.test.ts`, `test/commands/spec.test.ts`
- 症状: リポジトリ直下の固定一時ディレクトリ名を使うと、`pnpm test` の並列実行時に別テストと競合し、`spec not found` などの不安定な失敗が出る。
- 対応: `os.tmpdir()` と `randomUUID()` を使って毎回ユニークな一時ディレクトリを生成する。
- 補足: 本体ロジックではなくテスト安定化のための差分。フルテスト前提で upstream 同期時に戻してしまわないよう注意。

### ドキュメントサイト: FAQ アンカー生成を日本語見出しに対応
- ファイル: `website/lib/remark-faq.ts`
- 症状: upstream のスラッグ生成は ASCII 英数字だけを残すため、日本語だけの FAQ 見出しから空の `id` が生成される。
- 対応（v1.11.0）: Unicode プロパティエスケープを使い、すべての言語の文字と数字を保持してアンカーを生成する。
- フォローアップ: upstream のスラッグ生成ロジックを取り込むときは、日本語見出しの `id` が空にならず、同じ見出しから安定して同じアンカーが生成されることを確認する。

### Purpose プレースホルダー: 生成側と検出側で翻訳を共有
- ファイル: `src/core/validation/constants.ts`, `src/core/specs-apply.ts`, `src/core/validation/purpose-placeholder.ts`
- 症状: archive が書き込むプレースホルダーだけを翻訳すると、検出側が英語文を探し続けて未記入の Purpose を見逃す。検出側だけを翻訳すると、生成したプレースホルダーと一致しない。
- 対応（v1.11.0）: 日本語の前半・後半を `PURPOSE_PLACEHOLDER_PREFIX` / `PURPOSE_PLACEHOLDER_SUFFIX` として共有し、生成と検出の両方で使用する。変更名は2つの定数の間に入るため、文全体を別々に複製しない。
- 構造上の不変条件: `## Purpose`、先頭の `TBD` / `TODO` はパーサーが認識する構造トークンとして維持する。利用者向けの診断とプレースホルダー本文だけを日本語化する。
- フォローアップ: プレースホルダー文を変更するときは、生成した本仕様を strict 検証し、同じ行が1件の警告として報告されることを確認する。

### CLI 出力: 人間向け文言と JSON 契約を分ける
- ファイル: `src/commands/workflow/status.ts`, `src/commands/show.ts`, `src/utils/requirement-diff.ts`, `src/commands/shared-output.ts`
- 症状: `status --all` や `show --diff` の日本語化で JSON キーや診断コードまで翻訳すると、スクリプトとエージェントが出力を解析できなくなる。反対に、テキスト表示や `message` を英語のまま残すと日本語版の利用者向け出力が混在する。
- 対応（v1.11.0）: `changes`, `root`, `status`, `diff`, `warning`, `change_error` などの機械向けキー・コードは維持し、テキスト見出し、診断 `message`、次の操作案内を日本語化する。
- 差分の扱い: unified diff の要件本文は利用者が記述した内容なので翻訳しない。`MODIFIED` / `ADDED` と要件名も OpenSpec の構造・利用者入力として保持する。
- フォローアップ: JSON 対応コマンドの文言を変更するときは、stdout が単一の JSON 文書として解析でき、キー構造が upstream と一致することを確認する。

### 生成スキルと仕様: 構造トークンを翻訳しない
- ファイル: `src/core/shared/skill-generation.ts`, `src/core/templates/workflows/`, `schemas/spec-driven/schema.yaml`, `skills/`
- 翻訳対象: `description` の値、スキル本文、質問、警告、操作案内、生成するアーティファクトの説明文。
- 翻訳しない対象: YAML frontmatter のキー、`allowed-tools`, `metadata`, `generatedBy`, `## Why`, `## What Changes`, `## ADDED/MODIFIED/REMOVED/RENAMED Requirements`, `### Requirement:`, `#### Scenario:`, `SHALL`, `MUST`, `WHEN`, `THEN`。
- 理由: これらは英語表示ではなく、パーサー、ツール、検証規則が読む構造トークン。翻訳するとファイルが自然な日本語に見えても、status、validate、archive が認識できなくなる。
- フォローアップ: テンプレート文面を翻訳した後は静的 `skills/` を再生成し、parity ハッシュを更新する。生成物の本文が日本語で、構造トークンだけが英語で残ることを確認する。

### ドキュメントサイト: 日本語版の参照先を維持
- ファイル: `website/app/layout.tsx`, `website/lib/shared.ts`, `website/docs.sync.config.mjs`, `website/scripts/sync-docs.mjs`, `website/package.json`
- 症状: upstream 同期で `lang="en"`、`Fission-AI/OpenSpec`、upstream のブランチ名、`@fission-ai/openspec` が戻ると、表示は日本語でも編集リンク、GitHubリンク、npmリンク、同期元が本家を指す。
- 対応（v1.11.0）: HTML の言語を `ja`、リポジトリを `ayumuwall/OpenSpec-J`、同期ブランチを `ja-docs`、npm パッケージを `@ayumuwall/openspec` に統一する。
- フォローアップ: Webサイト同期設定を取り込んだ後は、トップページ、ドキュメントの「編集」、GitHub、npm、sitemap、redirect の参照先をまとめて確認する。

### CLI ヘルプ: Commander の既定英語が残る
- 現状（v1.11.0）: コマンドとオプションの説明は日本語化されているが、Commander が生成する `Usage`, `Options`, `Commands`, `display help for command`, `output the version number` は英語のまま表示される。
- 影響: 機能動作には影響しないが、利用者向けヘルプでは日本語と英語が混在する。パッケージの手動確認では、動作成功と翻訳未完了を分けて記録する。
- フォローアップ: 完全に日本語化する場合は出力文字列の後処理ではなく、Commander の Help 設定で見出しと組み込み説明を差し替える。`--help` の全体表示と各サブコマンド表示を確認する。

## テスト期待値の更新が必要だった事例

- `v1.2.0` `test/core/templates/skill-templates-parity.test.ts`
  テンプレート文面変更後は `EXPECTED_FUNCTION_HASHES` / `EXPECTED_GENERATED_SKILL_CONTENT_HASHES` を更新する。
- `v1.2.0` `src/prompts/searchable-multi-select.ts` 関連テスト
  キーバインド変更に合わせてヒント文の期待値も更新する。
- `v1.3.0` `test/commands/artifact-workflow.test.ts`
  `status` の日本語化では CLI 出力と JSON `message` の期待値を更新する。
- `v1.3.0` `test/core/templates/skill-templates-parity.test.ts`
  `onboard` などワークフローテンプレート文面変更後は parity ハッシュを再計算する。

### 規範文の語尾を日本語で統一（SHALL/MUST）
- 目的: 「MUST を文中に挿入した日本語」が不自然になりやすいため、語尾と括弧表記を固定し、出力の揺れを抑える。
- 方針: 要件本文は SHALL/MUST のみを使用し、SHOULD/MAY は避ける。
- ルール:
  - 語尾は「〜しなければならない。(SHALL)」の形式に揃える
  - 文中に SHALL/MUST を挿入しない
- 実施内容（v1.0.2 以降）:
  - `src/core/templates/skill-templates.ts` の差分仕様フォーマット説明に規範語ルールを追記し、例文を日本語化。
  - `schemas/spec-driven/schema.yaml` の書式ルールに同ルールを追記。
  - `src/core/validation/constants.ts` のエラーガイド例文を日本語化。
  - `src/core/config-prompts.ts` の config.yaml テンプレートに言語設定・規範語ルールの例示を追加。
- 廃止されたファイル（v1.0.2）:
  - `src/core/templates/agents-template.ts` → 削除済み（skill-templates.ts に統合）
  - `src/core/templates/slash-command-templates.ts` → 削除済み（skill-templates.ts に統合）
  - `schemas/tdd/schema.yaml` → 削除済み
  - `openspec/AGENTS.md` → 廃止（スキルベースのワークフローに移行）
