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

### v0.19.0: apply 指示はスキーマ優先で出力される
- ファイル: `src/commands/artifact-workflow.ts`, `schemas/spec-driven/schema.yaml`
- 症状: `schema.apply.instruction` がある場合はスキーマ側の文言が最優先で使われるため、コード側のフォールバック文だけ日本語化しても実際の出力は英語のまま残る。
- 対応: `schemas/spec-driven/schema.yaml` の `apply.instruction` も日本語化し、CLI の表示とテスト期待値を一致させた。
- フォローアップ: 新しいスキーマ追加時は `apply` セクションの文言もローカライズ対象に含める。

### v1.0.2: 新規オンボーディングスキル追加に伴う構造更新
- ファイル: `src/core/templates/skill-templates.ts`, `src/core/shared/tool-detection.ts`, `src/core/init.ts`, `src/core/update.ts`
- 症状: v1.0.2 で `openspec-onboard` スキルと `license/compatibility/metadata` が追加され、テンプレート構造と検出リストが更新されている。文字列置換だけだと新規スキルが検出されず、生成数や一覧が upstream と一致しない。
- 対応: `SkillTemplate` に optional fields を追加し、オンボーディング用テンプレートを新設。`SKILL_NAMES` に `openspec-onboard` を追加し、生成・更新の件数が upstream と一致するように反映した。
- フォローアップ: upstream でスキル種別やテンプレートメタデータが増減した場合、検出リストとテンプレート構造を先に合わせてから文言を翻訳する。

### 単数/複数の表記を日本語で統一する扱い
- 仕様: 日本語では単数・複数の揺れを避け、カウントは「件」や「タスク」など固定表記に寄せる。
- 実例: `src/utils/task-progress.ts` の `formatTaskStatus` は常に「タスク」表記、`src/core/view.ts` と `src/core/list.ts` は `件` を用いた固定表記に統一。
- 補足: `src/core/parsers/change-parser.ts` では互換性のため `requirement`/`requirements` の両方を保持しているが、表示文言は日本語の単一表記で運用している。

### 規範文の語尾を日本語で統一（SHALL/MUST）
- 目的: 「MUST を文中に挿入した日本語」が不自然になりやすいため、語尾と括弧表記を固定し、出力の揺れを抑える。
- 方針: 要件本文は SHALL/MUST のみを許可し、SHOULD/MAY は補足的な注意/参考に限定する（検証挙動は変更しない）。
- 実施内容:
  - `src/core/templates/agents-template.ts` / `src/core/templates/slash-command-templates.ts` の TL;DR で「語尾 + 文末括弧」表記と「文中に挿入しない」を指示。
  - `schemas/spec-driven/schema.yaml` / `schemas/tdd/schema.yaml` の要件フォーマットに同ルールを追記。
  - 配布テンプレートの `openspec/AGENTS.md` に同ルールを反映。

## チェックリスト（ローカライズ観点）
- メッセージ判定に `includes` 等の英語ハードコードが無いか確認し、日本語化後も発火するかを両言語で点検。
- エラー/ガイド文を定数化し、テストで文面の一部を検証できるようにする（英語と日本語の両方がトリガーになるテストがあると安心）。
- CLI 出力（特にヘルプやサマリー）はロジックと密結合しがちなので、upstream 変更時に日本語側を手動で同期する。
