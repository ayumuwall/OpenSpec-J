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

### apply 指示はスキーマ優先で出力される
- ファイル: `src/commands/workflow/instructions.ts`, `schemas/spec-driven/schema.yaml`
- 症状: `schema.apply.instruction` がある場合はスキーマ側の文言が最優先で使われるため、コード側のフォールバック文だけ日本語化しても実際の出力は英語のまま残る。
- 対応: `schemas/spec-driven/schema.yaml` の `apply.instruction` も日本語化し、CLI の表示とテスト期待値を一致させた。
- フォローアップ: 新しいスキーマ追加時は `apply` セクションの文言もローカライズ対象に含める。

### v1.0.2: 新規オンボーディングスキル追加に伴う構造更新
- ファイル: `src/core/templates/skill-templates.ts`, `src/core/shared/tool-detection.ts`, `src/core/init.ts`, `src/core/update.ts`
- 症状: v1.0.2 で `openspec-onboard` スキルと `license/compatibility/metadata` が追加され、テンプレート構造と検出リストが更新されている。文字列置換だけだと新規スキルが検出されず、生成数や一覧が upstream と一致しない。
- 対応: `SkillTemplate` に optional fields を追加し、オンボーディング用テンプレートを新設。`SKILL_NAMES` に `openspec-onboard` を追加し、生成・更新の件数が upstream と一致するように反映した。
- フォローアップ: upstream でスキル種別やテンプレートメタデータが増減した場合、検出リストとテンプレート構造を先に合わせてから文言を翻訳する。
- 状況: v1.1.0 でも `tool-detection` 側の見直しは入っておらず、注意点は継続。

### 単数/複数の表記を日本語で統一する扱い
- 仕様: 日本語では単数・複数の揺れを避け、カウントは「件」や「タスク」など固定表記に寄せる。
- 実例: `src/utils/task-progress.ts` の `formatTaskStatus` は常に「タスク」表記、`src/core/view.ts` と `src/core/list.ts` は `件` を用いた固定表記に統一。
- 補足: `src/core/parsers/change-parser.ts` では互換性のため `requirement`/`requirements` の両方を保持しているが、表示文言は日本語の単一表記で運用している。

### v1.2.0: skill-templates-parity テストがハッシュ検証に変更
- ファイル: `test/core/templates/skill-templates-parity.test.ts`
- 症状: v1.2.0 でテンプレートの同一性検証方式が「関数名リスト確認」から「SHA256 ハッシュ比較」に変更された。テンプレート内容（文言含む）を変更するたびにハッシュが変わるため、**翻訳後は必ずハッシュ値を更新しなければならない**。
- 対応: 翻訳後に `pnpm build` → `pnpm vitest run test/core/templates/skill-templates-parity.test.ts` を実行し、テストが出力する "Received" 側の値で `EXPECTED_FUNCTION_HASHES` と `EXPECTED_GENERATED_SKILL_CONTENT_HASHES` の定数を上書きする。
- フォローアップ: upstream が新ワークフローを追加するたびに同テストへのエントリ追加が発生する。テスト失敗時は "Expected/Received" の diff を見て、翻訳済みのハッシュに差し替えるだけでよい（ロジックは変更不要）。

### v1.2.0: skill-templates.ts がワークフロー別ファイルに分割
- ファイル: `src/core/templates/skill-templates.ts` → ファサード化、`src/core/templates/workflows/*.ts` に分割
- 症状: v1.2.0 でモノリシックだった `skill-templates.ts`（3000行超）が `workflows/` 配下の個別ファイルに分割された。ja-docs 側には旧モノリシック版の日本語訳があったため、コンフリクト解消時に各 `workflows/*.ts` へ日本語コンテンツを移植する作業が必要だった。
- 対応: コンフリクト解消エージェントが旧 `skill-templates.ts` の日本語訳を各 `workflows/*.ts` に移植した。`propose.ts` は v1.2.0 で新規追加（ja-docs に旧訳なし）のため、別途日本語化した。
- フォローアップ: 今後 upstream がワークフローを追加・変更した場合、対応する `workflows/` 配下のファイルを個別に翻訳する。`skill-templates.ts` 本体は薄いファサードなので触る必要はない。

### v1.2.0: SKILL_NAMES / CommandId に新ワークフローを追加（propose）
- ファイル: `src/core/shared/tool-detection.ts`
- 症状: v1.2.0 で `openspec-propose` スキルと `propose` コマンド ID が追加された。`SKILL_NAMES` 配列と `COMMAND_IDS` 型へのエントリ追加はコード変更（文字列置換ではない）。
- 対応: upstream の `tool-detection.ts` 変更を採用し、`SKILL_NAMES` に `'openspec-propose'` を追加、`COMMAND_IDS` 定数・`CommandId` 型を新設した（JSDoc は日本語化）。
- フォローアップ: 上記「v1.0.2: 新規オンボーディングスキル追加に伴う構造更新」と同じパターン。**upstream でスキルが増減した場合は、まず `SKILL_NAMES` / `COMMAND_IDS` を合わせてから文言を翻訳する**。

### v1.2.0: searchable-multi-select のキーバインド変更（Tab→Enter/Space）
- ファイル: `src/prompts/searchable-multi-select.ts`
- 症状: v1.2.0 でキーバインドが変更された（確定キー: Tab → Enter、トグルキー: Enter → Space）。ja-docs 側には旧キーバインドに対応した日本語ヒント文があり、コンフリクト解消時に upstream のキーバインドロジックを採用しつつヒント文も更新が必要だった。
- 対応: upstream のキーバインド実装を採用し、ヒント文を「Space 選択 • Enter 確定」に更新。テスト期待値も合わせて更新した。
- フォローアップ: キーバインド変更は文言以外にロジック変更を伴うため、`src/prompts/` のコンフリクト時は動作確認を必ず行う。

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
