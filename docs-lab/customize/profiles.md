# プロファイル

> インストールするワークフローを選びます。

プロファイルは、AI ツール用の OpenSpec ワークフロー（[スキル](../start/setup.md#the-workflow-files-skills)）のうち、どれをマシン全体へインストールするかを定める設定です。既定のプロファイルは`core`です。ワークフローを追加または除外すると、その選択は`custom`プロファイルとして保存されます。

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

どのプロファイルでも、ワークフローを 1 つ以上選ぶと、操作の共通窓口となる [`openspec`](../reference/skills.md#openspec) スキルが入ります。このスキルは自動で追加されるため、一覧やピッカーには表示されません。

## セットの拡張：オプションのワークフロー

コアセット以外にも、6 つのワークフローを利用できます。`new` と `continue` では変更提案を段階的に作成し、`ff` では実装に必要な全アーティファクトを一度に作成します。

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

ピッカーには12個のワークフローがチェックボックスで表示され、インストール済みのものは選択状態になります。選択がコアの6個と完全に一致しなければ `custom` プロファイルとして保存されるため、使わないコアワークフローを外すこともできます。

## 配信方式（2.0 で廃止）

OpenSpec 2.0 はスキルだけをインストールするため、`delivery` 設定は動作に影響しません。既存の値は保持されます。`openspec config set delivery <value>` でも引き続き値を保存できますが、効果がない旨を表示します。

1.x では、配信方式でスキル、コマンド、その両方を選択していました。コマンドファイルの扱いは[2.0 へのアップグレード](../help/upgrade-to-2.md)を参照してください。

## プロファイルの切り替え

プロファイルは 2 段階で切り替えます。まずマシン上のプロファイルを変更し、次に各プロジェクトを更新して適用します。

1. プロファイルを変更します。

   ```bash
   openspec config profile        # 対話形式で実行
   openspec config profile core   # コアの 6 つにリセット
   ```

2. 作業している各プロジェクトで更新します。

   ```bash
   openspec update
   ```

カレントディレクトリが既存の OpenSpec プロジェクトであれば、対話形式のフローで手順 2 をその場で実行するか確認されます。
