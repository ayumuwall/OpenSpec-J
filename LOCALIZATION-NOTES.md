# ローカライズ特有の修正メモ

## 目的
- 単なる文字列翻訳にとどまらない、日本語化に伴うコード上の注意点・修正履歴を集約する。
- upstream 同期時に再発しやすい箇所を把握し、見落としを防ぐ。

## 既知の事例 / 注意点

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
