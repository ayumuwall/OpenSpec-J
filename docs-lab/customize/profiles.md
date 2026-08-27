# プロファイル

> インストールするワークフローと、スキル、コマンド、その両方のどの形式でインストールするかを選びます。

プロファイルは、AI ツール用の OpenSpec ワークフロー（[スキルとコマンド](../start/setup.md#the-workflow-files-skills-and-commands)）のうち、どれをマシン全体へインストールするかを定める設定です。既定のプロファイルは`core`です。ワークフローを追加または除外すると、その選択は`custom`プロファイルとして保存されます。

## コアセット

`core`プロファイルは、アイデアからアーカイブまでの一連の流れを担う 6 つのワークフローをインストールします。

| ワークフロー                                                | 用途                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| [`explore`](../reference/skills.md#openspec-explore)        | 変更提案となる前に、アイデアを検討する                           |
| [`propose`](../reference/skills.md#openspec-propose)        | 変更提案を作成し、その計画アーティファクトをすべて一度に生成する |
| [`apply`](../reference/skills.md#openspec-apply-change)     | 変更提案のタスクを実行する                                       |
| [`update`](../reference/skills.md#openspec-update-change)   | 変更提案の既存の計画アーティファクトを改訂する                   |
| [`sync`](../reference/skills.md#openspec-sync-specs)        | 変更提案の仕様更新をアーカイブせずに `specs/` にマージする       |
| [`archive`](../reference/skills.md#openspec-archive-change) | 完成した変更提案をアーカイブに移動する                           |

各リンク先では、引数、生成物、応答内容を含む詳しい仕様を確認できます。

## セットの拡張：オプションのワークフロー

コアセット以外にも、6 つのワークフローを利用できます。このうち 3 つ（`new`、`continue`、`ff`）は、`propose`のように一度ですべてを作成せず、変更提案をアーティファクトごとに作成します。

| ワークフロー                                                          | 用途                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`new`](../reference/skills.md#openspec-new-change)                   | 空の雛形として変更提案を開始する                                     |
| [`continue`](../reference/skills.md#openspec-continue-change)         | 変更提案内で、計画アーティファクトを一つずつ作成する                 |
| [`ff`](../reference/skills.md#openspec-ff-change)                     | 変更提案と、実装に必要なすべての計画アーティファクトを一度に作成する |
| [`verify`](../reference/skills.md#openspec-verify-change)             | 実装が変更提案のアーティファクトと一致するかどうかを確認する         |
| [`bulk-archive`](../reference/skills.md#openspec-bulk-archive-change) | 複数の変更提案を一度にアーカイブする                                 |
| [`onboard`](../reference/skills.md#openspec-onboard)                  | 実際の変更提案を最初から最後まで進め、ワークフローを学ぶ             |

セットを変更するには、対話型のピッカーを実行します。

```bash
openspec config profile
```

ピッカーでは、設定対象（[配信方式](#delivery-skills-commands-or-both)、ワークフロー、または両方）を選びます。続いて、12 個のワークフローがチェックボックスで表示され、インストール済みのものは選択状態になります。選択がコアの 6 個と完全に一致しなければ`custom`プロファイルとして保存されるため、使わないコアワークフローを外すこともできます。

<a id="delivery-skills-commands-or-both"></a>

## 配信方式：スキル、コマンド、またはその両方

配信方式は、ワークフローをスキルのみ、コマンドのみ、その両方のどの形式でインストールするかを選ぶプロファイル設定です。既定値は`both`です。[プロジェクトのセットアップ](../start/setup.md#the-workflow-files-skills-and-commands)では、2 つの形式と両方が存在する理由を説明しています。このフィールドの正確な仕様は[CLI 設定（config.json）](../reference/configuration/config-json.md#delivery)を参照してください。

変更する方法は 2 通りあります。

**対話形式**：`openspec config profile`を実行し、「Delivery のみ」を選択します。次の例ではスキルのみに切り替えます。

```
現在の profile 設定
  配信方式: both

? 何を設定しますか？ Delivery のみ
? Delivery mode（workflows のインストール方法）: Skills のみ

設定変更:
  delivery: both -> skills
? このプロジェクトに今すぐ変更を適用しますか？ (Y/n) y
```

**直接指定**：プロンプトを表示せず、1 つのコマンドで変更します。

```bash
openspec config set delivery skills   # または: both, commands
```

配信方式を変えてもプロファイル名は変わりません。`core`と`custom`が表すのはワークフローセットだけなので、`core`へ戻しても配信方式の設定は維持されます。

## プロファイルの切り替え

プロファイルは 2 段階で切り替えます。まずマシン上のプロファイルを変更し、次に各プロジェクトを更新して適用します。

1. プロファイルを変更します。

   ```bash
   openspec config profile        # 対話形式で実行
   openspec config profile core   # コアの 6 つにリセット（delivery は保持）
   ```

2. 作業している各プロジェクトで更新します。

   ```bash
   openspec update
   ```

カレントディレクトリが既存の OpenSpec プロジェクトであれば、対話形式のフローで手順 2 をその場で実行するか確認されます。
