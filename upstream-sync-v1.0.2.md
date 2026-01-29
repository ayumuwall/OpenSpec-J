# OpenSpec v1.0.2 追従手順（OpenSpec-J）

本家（Fission-AI/OpenSpec）の v1.0.2 へ追従するための、最短で安全な作業手順です。
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

## 1. upstream を main に取り込む（リリースタグ同期）

```
git checkout main
git fetch upstream --tags
git merge v1.0.2
git tag -a upstream-v1.0.2 -m "upstream v1.0.2"
```

- **必ずリリースタグ（例: `v1.0.2`）で取り込む。`upstream/main` は進んでいる可能性があるため使用しない。**

## 2. 差分の収集と分類（英語版同士の差分）

```
mkdir -p diffs
git diff --name-status upstream-v0.23.0 upstream-v1.0.2 > diffs/upstream-v0.23.0__upstream-v1.0.2.files.txt
git diff upstream-v0.23.0 upstream-v1.0.2 > diffs/upstream-v0.23.0__upstream-v1.0.2.diff
```

- 変更を docs / templates / CLI / tests に分類
- 変更点が複数レイヤーに跨る場合は、対象ごとに作業単位を分割

## 3. ja-docs に切り替えてローカライズ作業を開始

```
git checkout ja-docs
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
- README.md の OPENSPEC-J 補足マーカー（`OPENSPEC-J:NOTE`）が維持されているか確認
- README_OLD.md は同期対象外（本家の更新があっても反映しない）

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
git tag -a openspec-j-v1.0.2 -m "OpenSpec-J v1.0.2"
```

- `CHANGELOG.md` に v1.0.2 追従内容を追記（OpenSpec-J 独自変更は `[OpenSpec-J]` 付き）
- `README.md` の「現在の同期元は OpenSpec vX.Y.Z」を更新
- `AGENTS.OpenSpec-J.md` のセッションメモに当日の記録を追記（実施内容・テスト状況・残タスク）

## 8. まとめ確認

- `main` は upstream v1.0.2 に一致
- `ja-docs` はローカライズ内容を含むブランチ
- 主要テスト・CLI 出力を確認済み

---

必要に応じて、レイヤー単位（docs/templates/cli/tests）で PR を分割するとレビューが楽になります。
