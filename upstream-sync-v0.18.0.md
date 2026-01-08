# OpenSpec v0.18.0 追従手順（OpenSpec-J）

本家（Fission-AI/OpenSpec）の v0.18.0 へ追従するための、最短で安全な作業手順です。
OpenSpec-J の運用ルールに合わせ、main は upstream スナップショット、ja-docs はローカライズ版として扱います。

## 前提

- `main` は upstream の素のスナップショット（ローカライズは入れない）
- `ja-docs` は OpenSpec-J のローカライズ版
- `/openspec` 配下は翻訳対象外
- ローカライズ作業に OpenSpec の変更提案フローは使わない

## 0. 事前確認

```
node -v
git status -sb
git remote -v
```

- Node.js 要件（例: `>= 20.19.0`）を満たす
- 作業ブランチが clean
- `upstream` が Fission-AI/OpenSpec を指している

## 1. upstream を main に取り込む（スナップショット更新）

```
git checkout main
git fetch upstream --tags
git merge upstream/main
git tag -a upstream-v0.18.0 -m "upstream v0.18.0"
```

## 2. 差分の収集と分類（英語版同士の差分）

```
mkdir -p diffs
git diff --name-status upstream-v0.17.2 upstream-v0.18.0 > diffs/upstream-v0.17.2__upstream-v0.18.0.files.txt
git diff upstream-v0.17.2 upstream-v0.18.0 > diffs/upstream-v0.17.2__upstream-v0.18.0.diff
```

- 変更を docs / templates / CLI / tests に分類
- 変更点が複数レイヤーに跨る場合は、対象ごとに作業単位を分割

## 3. ローカライズ同期ブランチを作成

```
git checkout ja-docs
git checkout -b ja-sync/v0.18.0
git merge main
```

## 4. ローカライズ反映（差分を最小に）

優先順:
1. `README.md` などドキュメント
2. テンプレート (`src/core/templates/*.ts` など)
3. CLI メッセージ（`src/commands` / `src/utils`）
4. テスト期待値

実施ポイント:
- 変更箇所のみ翻訳し、未変更箇所は現行を維持
- 見出し・キーワードは upstream と同一（パーサ依存のものは変更しない）
- コマンド名・フラグ・ファイルパスは翻訳しない

## 5. 変更点のチェック

```
rg -n "TODO|FIXME|TBD" .
rg -n "[A-Z][a-z].*\\(.*\\)" src README.md
```

- 英語が残るべき箇所と、翻訳漏れを区別してチェック
- `/openspec` 配下は英語維持

## 6. 検証

```
pnpm test
node bin/openspec.js --help
node bin/openspec.js init /tmp/openspec-j-init
node bin/openspec.js validate --strict
```

- 主要コマンドのヘルプ文言を目視確認
- テンプレート生成が日本語で崩れていないか確認

## 7. 仕上げ（記録とタグ）

```
git checkout ja-docs
git merge ja-sync/v0.18.0
git tag -a openspec-j-v0.18.0 -m "OpenSpec-J v0.18.0"
```

- `CHANGELOG.md` に v0.18.0 追従内容を追記（OpenSpec-J 独自変更は `[OpenSpec-J]` 付き）
- `AGENTS.OpenSpec-J.md` のセッションメモに当日の記録を追記（実施内容・テスト状況・残タスク）

## 8. まとめ確認

- `main` は upstream v0.18.0 に一致
- `ja-docs` はローカライズ差分のみ
- 主要テスト・CLI 出力を確認済み

---

必要に応じて、レイヤー単位（docs/templates/cli/tests）で PR を分割するとレビューが楽になります。
