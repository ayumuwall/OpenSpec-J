# 多言語ガイド

OpenSpec が生成するアーティファクトを英語以外の言語で出力する方法を説明します。

## クイックセットアップ

新規プロジェクトでは、初期化時に言語を指定できます。

```bash
openspec init --language "Portuguese (pt-BR)"
```

この指定は言語に関する指示を `openspec/config.yaml` に書き込みます。すでに設定があるプロジェクトでは、既存の指示を保つため `context` フィールドを直接編集してください。

同じ内容を手動で設定することもできます。

`openspec/config.yaml` に言語指定を追加します。

```yaml
schema: spec-driven

context: |
  Language: Portuguese (pt-BR)
  All artifacts must be written in Brazilian Portuguese.
  Keep OpenSpec structural headings and SHALL/MUST keywords in English.

  # 以下にプロジェクトの文脈を追加...
  Tech stack: TypeScript, React, Node.js
```

これで生成されるアーティファクトはポルトガル語になります。

検証処理が依存するため、OpenSpecの文書構造と規範キーワード `SHALL` / `MUST` は英語のまま維持されます。周囲の要件やシナリオ本文には、指定した言語を使用できます。

## 言語設定例

### ポルトガル語（ブラジル）

```yaml
context: |
  Language: Portuguese (pt-BR)
  All artifacts must be written in Brazilian Portuguese.
```

### スペイン語

```yaml
context: |
  Idioma: Español
  Todos los artefactos deben escribirse en español.
```

### 中国語（簡体）

```yaml
context: |
  语言：中文（简体）
  所有产出物必须用简体中文撰写。
```

### 日本語

```yaml
context: |
  言語：日本語
  すべての成果物は日本語で作成してください。

  規範語ルール:
  - 規範要件は SHALL/MUST を使う（SHOULD/MAY は避ける）
  - 語尾は「〜しなければならない。(SHALL)」の形式に揃える
  - 文中に SHALL/MUST を挿入しない
```

### フランス語

```yaml
context: |
  Langue : Français
  Tous les artefacts doivent être rédigés en français.
```

### ドイツ語

```yaml
context: |
  Sprache: Deutsch
  Alle Artefakte müssen auf Deutsch verfasst werden.
```

## ヒント

### 技術用語の扱い

技術用語をどう扱うかを明示できます。

```yaml
context: |
  言語：日本語
  日本語で記述するが:
  - "API", "REST", "GraphQL" などの技術用語は英語のまま
  - コード例やファイルパスは英語のまま
```

### 他のコンテキストと併用

言語設定は他のプロジェクト文脈と併用できます。

```yaml
schema: spec-driven

context: |
  Language: Portuguese (pt-BR)
  All artifacts must be written in Brazilian Portuguese.

  Tech stack: TypeScript, React 18, Node.js 20
  Database: PostgreSQL with Prisma ORM
```

## 検証

言語設定が効いているか確認するには、次のコマンドで生成指示を確認します。

```bash
# 言語コンテキストが表示されることを確認
openspec instructions proposal --change my-change

# 出力に言語コンテキストが含まれる
```

## 関連ドキュメント

- [カスタマイズ](./customization.md) - プロジェクト設定
- [ワークフロー](./workflows.md) - ワークフロー全体
