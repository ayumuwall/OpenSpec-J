# 実験的ワークフロー（OPSX）

> **ステータス:** 実験的です。壊れる可能性があります。フィードバックは [Discord](https://discord.gg/BYjPaKbqMt) へ。
>
> **互換性:** 現時点では Claude Code のみ

## 概要

OPSX は OpenSpec の変更を扱う新しい方法です。1 つの大きな提案ではなく、**アーティファクト**を段階的に作成します:

```
proposal → specs → design → tasks → implementation → archive
```

各アーティファクトには依存関係があります。仕様がないとタスクを書けません。タスクがないと実装できません。システムが「今できること」と「ブロックされていること」を追跡します。

## セットアップ

```bash
# 1. openspec がインストール済みで初期化されていることを確認
openspec init

# 2. 実験的スキルを生成
openspec artifact-experimental-setup
```

Claude Code が自動検出する `.claude/skills/` にスキルが作成されます。

## コマンド

| コマンド | 役割 |
|---------|------|
| `/opsx:new` | 新しい変更を開始 |
| `/opsx:continue` | 次のアーティファクトを作成 |
| `/opsx:ff` | 早送り（すべてのアーティファクトを一括生成） |
| `/opsx:apply` | タスクを実装 |
| `/opsx:sync` | 変更の仕様差分をメイン仕様に同期 |
| `/opsx:archive` | 完了後にアーカイブ |

## 使い方

### 新しい変更を始める
```
/opsx:new
```
何を作るかと、どのワークフロースキーマを使うかを尋ねられます。

### アーティファクトを 1 つずつ作る
```
/opsx:continue
```
1 回に 1 つのアーティファクトを作成します。各ステップを確認しながら進めたい場合に向いています。

### まとめて作成する
```
/opsx:ff add-dark-mode
```
すべてのアーティファクトを一括で作成します。やることが明確なときに便利です。

### 実装する
```
/opsx:apply
```
タスクを順に進め、完了したらチェックを付けます。

### 仕様を同期してアーカイブする
```
/opsx:sync      # 変更の仕様差分をメイン仕様に反映
/opsx:archive   # 完了後にアーカイブへ移動
```

## 何が違うのか？

**標準ワークフロー**（`/openspec:proposal`）:
- 1 つの大きな提案ドキュメント
- 直線的なフェーズ: plan → implement → archive
- アーティファクトを一括生成

**実験的ワークフロー**（`/opsx:*`）:
- 依存関係を持つ離散的なアーティファクト
- フェーズではなくアクション中心で柔軟
- ステップごと／一括のどちらでも進行可能
- スキーマ駆動（ワークフローをカスタマイズ可能）

重要な示唆は、作業は直線的ではないということです。実装してみたら設計が違うと気付き、設計を更新して続ける。OPSX はそうした往復を前提にしています。

## スキーマ

スキーマは、どのアーティファクトが存在し、どのように依存するかを定義します。現在利用可能なもの:

- **spec-driven**（デフォルト）: proposal → specs → design → tasks
- **tdd**: tests → implementation → docs

`openspec schemas` を実行すると利用可能なスキーマが表示されます。

## ヒント

- `/opsx:ff` は方針が固まっているときに、`/opsx:continue` は探索中に向いています
- `tasks.md` のチェックボックスで進捗を追跡します
- `specs/` の差分仕様は `/opsx:sync` でメイン仕様に同期されます
- 行き詰まったら `openspec status --change "name"` でブロック状況を確認できます

## フィードバック

荒削りなのは意図的です。何がうまくいくかを学んでいます。

バグやアイデアがあれば [Discord](https://discord.gg/BYjPaKbqMt) か [GitHub](https://github.com/Fission-AI/openspec/issues) へ。
