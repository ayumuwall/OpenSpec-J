# docs 対話例・出力例 翻訳棚卸し (2026-07-17)

README.md は直前に対応済みのため対象外。`docs/**/*.md` のうち、対話例・AI 出力例・コードブロック内のユーザー向け例文に残る英語を抽出した。

## 優先度高

初回導線または主要リファレンスで目に入りやすく、まとめて日本語化したい箇所。

- [x] `docs/getting-started.md`
  - `You:` / `AI:` の最初の変更例に英語出力が残る。
  - 例: `Created openspec/changes/add-dark-mode/`, `Ready for implementation!`, `Working through tasks...`, `All tasks complete!`, `Archiving add-dark-mode...`, `Done! Ready for the next feature.`
  - `proposal.md` / `spec.md` / `tasks.md` のサンプル本文も英語のまま。見出しや `## ADDED Requirements` などパーサ依存部分は維持し、説明文・要件文・タスク文を日本語化する。
  - CLI コメントに `# View change details`, `# Validate spec formatting` が残る。

- [x] `docs/commands.md`
  - コマンドリファレンス全体に英語の対話例・出力例が多数残る。
  - 対象例: `/opsx:propose`, `/opsx:explore`, `/opsx:new`, `/opsx:continue`, `/opsx:ff`, `/opsx:apply`, `/opsx:update`, `/opsx:verify`, `/opsx:sync`, `/opsx:archive`, `/opsx:bulk-archive`, `/opsx:onboard`
  - 例: `What would you like to explore?`, `Let me investigate...`, `Ready for implementation. Run /opsx:apply.`, `Now available: tasks`, `Ready to archive: Yes (with warnings)`, `Welcome to OpenSpec!`

- [x] `docs/workflows.md`
  - ワークフロー別の会話例に英語が多く残る。
  - 対象例: Explore、クイック機能、探索的、並行変更、一括アーカイブ、検証、アーカイブ。
  - 日本語と英語が混在しているブロックがあり、文体の揺れが目立つ。
  - 同じ文が重複している箇所あり: `完了した変更が複数ある場合は、/opsx:bulk-archive を使用します。`

- [x] `docs/examples.md`
  - レシピ集の会話例がほぼ英語のまま。
  - 対象例: logout button、login redirect、performance exploration、parallel changes、refactor、2FA、onboard。
  - README と同じ方針で、`You:` / `AI:` ラベルとコマンド・ファイルパスは維持し、自然な日本語の対話へ置き換える。

## 優先度中

読む頻度はやや下がるが、対話例として英語が目立つ箇所。

- [x] `docs/explore.md`
  - Explore の代表例が英語。
  - 例: `What would you like to explore?`, `Let me dig into the checkout path...`, `Here's what I found.`, `Want me to scope that?`, `Created openspec/changes/... Ready for implementation.`
  - 図中の `(think)`, `(agree)`, `(build)`, `(record)` も日本語化候補。

- [x] `docs/existing-projects.md`
  - 大規模コードベース向けの探索例と PRD 例が英語。
  - 例: `I need to add rate limiting...`, `Let me trace it...`, `Requests hit Express...`, `Here's the section of our PRD...`, `[reads it, asks clarifying questions...]`
  - bash コメント `# select the expanded workflows`, `# apply them to this project` も日本語化候補。

- [x] `docs/editing-changes.md`
  - 変更方針を変える対話例が英語。
  - 例: `I want to change the approach in this change.`, `[edit design.md, or tell the AI:]`, `Updated design.md. The task list still fits; want me to continue applying?`

- [x] `docs/reviewing-changes.md`
  - `/opsx:verify` の検証出力例が英語。
  - 例: `Verifying add-dark-mode...`, `COMPLETENESS`, `All 8 tasks...`, `Scenario ... has no test coverage`

## 機械抽出件数の目安

`README.md` を除いた `docs/**/*.md` で、`You:` / `AI:` 行および代表的な英語出力パターンを含む行数。

```text
40 docs/commands.md
 4 docs/editing-changes.md
42 docs/examples.md
 9 docs/existing-projects.md
 8 docs/explore.md
 9 docs/getting-started.md
 2 docs/reviewing-changes.md
61 docs/workflows.md
```

## 翻訳時の注意

- コマンド名、フラグ、ファイルパス、変更名、ディレクトリ構造は翻訳しない。
- `## ADDED Requirements` などテンプレート/パーサ依存の見出しは維持する。
- `Scenario` フォーマットは維持する。
- AI 出力例は README と同じ文体に寄せ、直訳ではなく日本語話者が自然に読める表現にする。
- まず `docs/getting-started.md`、次に `docs/commands.md` と `docs/workflows.md` を処理すると、初回導線と参照頻度の高い箇所を優先できる。
