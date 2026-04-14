# ローカライズ特有の修正メモ

## 目的
- 単なる文字列翻訳にとどまらない、日本語化に伴うコード上の注意点・修正履歴を集約する。
- upstream 同期時に再発しやすい箇所を把握し、見落としを防ぐ。

## 既知の事例 / 注意点

### バリデーション: ガイド付与が英語メッセージ依存
- ファイル: `src/core/validation/validator.ts` (`enrichTopLevelError`)
- 症状: upstream の英語メッセージを `includes` で判定しガイド文を付加する実装だったため、日本語化後はガイドが付かないケースが発生。
- 対応: 英語メッセージに加え、日本語化済みの定数 (`VALIDATION_MESSAGES.SPEC_PURPOSE_EMPTY`, `SPEC_NO_REQUIREMENTS`, `CHANGE_WHAT_EMPTY` など) や「Why セクション」文字列もトリガーに追加し、両言語でガイドを付与できるよう拡張。
- フォローアップ: upstream でメッセージ文言が増減した場合は、英語/日本語両方のトリガーを見直す。英語/日本語のガイド付与を直接確認するユニットテストを追加すると安全。

### 単数/複数の表記を日本語で統一する扱い
- 仕様: 日本語では単数・複数の揺れを避け、カウントは「件」や「タスク」など固定表記に寄せる。
- 実例: `src/utils/task-progress.ts` の `formatTaskStatus` は常に「タスク」表記、`src/core/view.ts` と `src/core/list.ts` は `件` を用いた固定表記に統一。
- 補足: `src/core/parsers/change-parser.ts` では互換性のため `requirement`/`requirements` の両方を保持しているが、表示文言は日本語の単一表記で運用している。

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
