# 多言語ガイド

OpenSpec が生成するアーティファクトを英語以外の言語で出力する方法を説明します。

## クイックセットアップ

`openspec/config.yaml` に言語指定を追加します。

```yaml
schema: spec-driven

context: |
  Language: Portuguese (pt-BR)
  All artifacts must be written in Brazilian Portuguese.

  # Your other project context below...
  Tech stack: TypeScript, React, Node.js
```

これで生成されるアーティファクトはポルトガル語になります。

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

## Tips

### 技術用語の扱い

技術用語をどう扱うかを明示できます。

```yaml
context: |
  Language: Japanese
  Write in Japanese, but:
  - Keep technical terms like "API", "REST", "GraphQL" in English
  - Code examples and file paths remain in English
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

言語設定が効いているか確認するには:

```bash
# Check the instructions - should show your language context
openspec instructions proposal --change my-change

# Output will include your language context
```

## 関連ドキュメント

- [Customization Guide](./customization.md) - プロジェクト設定
- [Workflows Guide](./workflows.md) - ワークフロー全体
