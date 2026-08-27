# スキーマ

> OpenSpec が生成するアーティファクト、その順序、テンプレートを変更します。

スキーマは、変更提案が生成するアーティファクト、その順序、使用するテンプレートを定義します。たとえば、既定の組み込みスキーマである[spec-driven](../reference/schemas/spec-driven/index.md)は、前のアーティファクトを基に、次の 4 つをおおむねこの順序で生成します。

```
proposal → specs → design → tasks
```

生成する文書の数、名前、構造を変える場合は、スキーマをフォークしてください。

<a id="where-schemas-live"></a>

## スキーマの場所

OpenSpec は次の 3 か所を順に検索し、最初に見つけたスキーマを使います。

1. **プロジェクト**：`openspec/schemas/`。リポジトリへコミットすると、チーム全員が利用できます。
2. **マシン**：macOS と Linux では`~/.local/share/openspec/schemas`です。`$XDG_DATA_HOME`を設定している場合は、その配下になります。Windows では`%LOCALAPPDATA%\openspec\schemas`です。ここに置いたスキーマは、作業するすべてのプロジェクトで利用できます。
3. **パッケージ**：`spec-driven`などの組み込みスキーマは、OpenSpec パッケージに同梱されています。

同じ名前のスキーマが複数の場所にある場合は、一覧の上にある場所が優先されます。`openspec schema which`を実行すると、どのスキーマが使われているかを確認できます。

```
$ openspec schema which spec-driven
スキーマ: spec-driven
ソース: project
パス: /your-project/openspec/schemas/spec-driven

上書き対象:
  package: .../openspec/schemas/spec-driven
```

## スキーマの構成

スキーマは、アーティファクトを宣言する`schema.yaml`と、各アーティファクトのテンプレートで構成されます。組み込みの`spec-driven`は次の構成です。

```
spec-driven/
├── schema.yaml
└── templates/
    ├── proposal.md
    ├── spec.md
    ├── design.md
    └── tasks.md
```

- **schema.yaml**：各アーティファクト、生成するファイル、使用するテンプレート、先に必要なアーティファクト、作成時にエージェントが受け取る指示を宣言します。各フィールドの仕様は[schema.yaml](../reference/schemas/schema-yaml.md)を参照してください。
- **templates/**：アーティファクトごとの Markdown の骨組みです。エージェントが内容を記入します。

次の例は、`schema.yaml`にある`tasks`アーティファクトの定義を一部省略したものです。

```yaml
artifacts:
  - id: tasks
    generates: tasks.md
    description: 進捗を追跡できる実装チェックリスト
    template: tasks.md
    instruction: |
      ...tasks.md の作成時にエージェントへ伝える内容...
    requires:
      - specs
      - design
```

組み込みスキーマは OpenSpec パッケージ内にあるため、直接編集しません。編集用のコピーを作るにはフォークします。

## カスタムスキーマの作成

独自のスキーマは、次のどちらかの方法で作成します。

1. **既存のスキーマをフォークして編集する**。目的に近いスキーマがある場合は、動作する一式を基にできるこの方法から始めてください。
2. **ゼロから作成する**。目的に合うスキーマがない場合は、`openspec schema init`で空のスキーマを生成します。

### 既存のスキーマをフォークする

1. プロジェクトルートで、基にするスキーマをフォークします。

   ```console
   $ openspec schema fork spec-driven

   注意: スキーマコマンドは実験的で、将来変更される可能性があります。
   ✔ 'spec-driven' を 'spec-driven-custom' に複製しました

   ソース: .../openspec/schemas/spec-driven (package)
   出力先: /your-project/openspec/schemas/spec-driven-custom
   ```

   2 番目の引数で名前を指定できます（`openspec schema fork spec-driven team-flow`）。名前は kebab-case にします。

2. コピーの`schema.yaml`とテンプレートを編集します。変更する内容は[フォークの編集](#editing-your-fork)を参照してください。

3. スキーマを検証します。

   ```bash
   openspec schema validate spec-driven-custom
   ```

   このコマンドを実行すると、変更の途中で使う前に、テンプレートの欠落、YAML の誤り、循環依存などを検出できます。

4. `openspec/config.yaml`で、プロジェクトが使うスキーマを指定します。フォークでは`config.yaml`が変更されないため、この設定は手動で追加します。

   ```yaml
   schema: spec-driven-custom
   ```

5. 新しく作成する変更提案で、このスキーマが使われます。すでに作成済みの変更では、作成時のスキーマが維持されます。

`config.yaml`を変更せず、プロジェクト内で既定スキーマを置き換えるには、`openspec schema fork spec-driven spec-driven`のように同じ名前でフォークします。プロジェクト内のコピーが組み込みスキーマより優先されます。詳しくは[スキーマの場所](#where-schemas-live)を参照してください。

### ゼロから作成する

`openspec schema init`は、既存のスキーマをコピーせず、新しいスキーマの骨組みを生成します。

```console
$ openspec schema init lite --description "軽量フロー" --artifacts proposal,tasks

✔ スキーマ 'lite' を作成しました
スキーマを作成しました: /your-project/openspec/schemas/lite

アーティファクト: proposal, tasks
```

生成される骨組みは最小限です。選べるアーティファクトは、組み込みの 4 つの ID だけです。生成されたテンプレートには指示がないため、独自の指示を書くまでは、エージェントが受け取る案内も少なくなります。その後の手順はフォークの場合と同じです。スキーマを検証し、`config.yaml`で指定してください。

<a id="editing-your-fork"></a>

## フォークの編集

フォークでは、次の 2 種類のファイルを編集します。

- **templates/**：各文書の骨組みを変更します。tasks テンプレートへセクションを追加すると、新しい`tasks.md`はすべてそのセクションを含む状態で始まります。
- **schema.yaml**：ワークフロー自体を変更します。存在するアーティファクト、それぞれの依存先、作成時にエージェントが受け取る指示を定義します。

たとえば、設計文書を省いた簡潔なフローにするには、次のように編集します。

1. `schema.yaml`から`design`の定義を削除します。
2. `tasks`の`requires`リストから`design`を削除します。
3. 検証します。

   ```console
   $ openspec schema validate spec-driven-custom

   ✓ スキーマ 'spec-driven-custom' は有効です
   ```

手順 2 を省くと、検証で次のエラーが見つかります。

```console
✗ スキーマ 'spec-driven-custom' にエラーがあります:
  error: アーティファクト 'tasks' の依存参照が不正です: 'design' は存在しません
```

手動で編集するたびに検証してください。検証しないと、ワークフローが存在しないファイルを要求した時点で、壊れたスキーマが見つかることになります。`config.yaml`と同様に、スキーマの編集内容は次の実行からエージェントへ渡されます。

## フォークはスナップショット

`openspec update`はインストール済みのスキルとコマンドを更新しますが、`openspec/schemas/`には触れません。フォークしたスキーマは編集した状態を保ちます。そのため、組み込みスキーマが更新されても、改善は自動で取り込まれません。後から改善を取り込むには、組み込みスキーマを別の名前でもう一度フォークし、差分を移植します。

## スキーマの共有

スキーマを共有するには、そのフォルダをコピーします。

- **チームで共有する**：`openspec/schemas/`をコミットすると、リポジトリを使う全員が利用できます。
- **複数のプロジェクトで共有する**：[スキーマの場所](#where-schemas-live)に示したユーザー用ディレクトリへフォルダを置きます。
- **コミュニティから入手する**：[コミュニティカタログ](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md#community-schemas)に共有スキーマの一覧があります。スキーマを`openspec/schemas/<name>`へコピーすると、独自スキーマと同じように利用できます。

現在、手動でコピーする代わりに名前を指定してインストールできる、公開用と非公開用のスキーマレジストリを開発しています。
