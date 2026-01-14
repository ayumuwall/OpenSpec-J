# Changesets

このディレクトリは [Changesets](https://github.com/changesets/changesets) によって管理されています。

## クイックスタート

```bash
pnpm changeset
```

プロンプトに従い、バージョン種別と変更内容を入力します。

## ワークフロー

1. **changeset を追加** — PR の前後にローカルで `pnpm changeset` を実行
2. **Version PR** — changeset が main にマージされると、CI が "Version Packages" PR を作成・更新
3. **リリース** — Version PR のマージで npm publish と GitHub Release を実行

> **Note:** 寄稿者は `pnpm changeset` だけで十分です。バージョニング（`changeset version`）と公開は CI で自動実行されます。

## テンプレート

changeset は次の構成で書きます:

```markdown
---
"@fission-ai/openspec": patch
---

### New Features

- **Feature name** — What users can now do

### Bug Fixes

- Fixed issue where X happened when Y

### Breaking Changes

- `oldMethod()` has been removed, use `newMethod()` instead

### Deprecations

- `legacyOption` is deprecated and will be removed in v2.0

### Other

- Internal refactoring of X for better performance
```

必要なセクションだけ残してください。

## バージョンアップの目安

| 種別 | 使うタイミング | 例 |
| --- | --- | --- |
| `patch` | バグ修正や小さな改善 | 設定が無い場合のクラッシュを修正 |
| `minor` | 新機能や非破壊の追加 | `--verbose` フラグを追加 |
| `major` | 破壊的変更や機能削除 | `init` を `setup` にリネーム |

## changeset を作成するタイミング

**作成する:**
- 新機能や新コマンド
- ユーザー影響のあるバグ修正
- 破壊的変更や deprecation
- ユーザーが体感する性能改善

**不要:**
- ドキュメントのみの変更
- テスト追加・修正
- ユーザー影響のない内部リファクタ
- CI/ツール周りの変更

## よい説明文の書き方

**Do:** ユーザー向けに書く
```markdown
- **Shell completions** — Bash/Fish/PowerShell でタブ補完が使えるようになった
```

**Don't:** 実装詳細を書く
```markdown
- Bash/Fish/PowerShell 向けの ShellCompletionGenerator を追加
```

**Do:** 影響が分かるように説明する
```markdown
- Linux で `XDG_CONFIG_HOME` を尊重するよう設定読み込みを修正
```

**Don't:** 修正番号だけ書く
```markdown
- Fixed #123
```
