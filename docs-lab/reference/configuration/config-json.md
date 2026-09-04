# CLI 設定（config.json）

> config.json の全フィールド。自分のマシンで openspec CLI がどう動作するかを設定する。

## 場所

CLI はマシン単位の設定を、macOS と Linux では`~/.config/openspec/config.json`、Windows では`%APPDATA%\openspec\config.json`に保存します。`$XDG_CONFIG_HOME`を設定した場合は、すべてのプラットフォームでそちらを優先します。`openspec config`コマンドはこのファイルを読み取り、編集します。

## フィールド

| キー           | 型                                             | 必須   | 動作                                                                              |
| -------------- | ---------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `profile`      | 文字列：`core`または`custom`                   | いいえ | `openspec init`がインストールするワークフローセットを選びます                     |
| `delivery`     | 文字列：`both`、`skills`、`commands`のいずれか | いいえ | init がスキル、スラッシュコマンド、またはその両方をインストールするかを指定します |
| `workflows`    | 文字列のリスト                                 | いいえ | `custom`プロファイルがインストールするワークフロー一覧です                        |
| `featureFlags` | フラグと真偽値のマップ                         | いいえ | 真偽値で指定する機能フラグです                                                    |
| `defaultStore` | 文字列                                         | いいえ | ルート解決で使うマシン単位の代替ストアです                                        |
| `openers`      | リスト                                         | いいえ | workset を開くツールと、各ツールの起動方法です                                    |
| `telemetry`    | マップ                                         | いいえ | CLI が保持する匿名 ID と通知表示済み状態です                                      |

### profile

`openspec init`がインストールするワークフローセットです。既定値は`core`で、propose、explore、apply、update、sync、archive を含みます。`custom`を設定すると、代わりに`workflows`の一覧だけをインストールします。

### delivery

init がワークフローをスキル、スラッシュコマンド、またはその両方としてインストールするかを指定します。既定値は`both`です。

### workflows

`custom`プロファイルがインストールするワークフローです。プロファイルが`core`の場合は無視されます。有効な ID は`propose`、`explore`、`new`、`continue`、`apply`、`update`、`ff`、`sync`、`archive`、`bulk-archive`、`verify`、`onboard`です。

### featureFlags

フラグ名をキー、真偽値を値とする機能切り替えです。`openspec config set featureFlags.<flag> true`で設定します。現在、CLI が読み取るフラグはありません。

### defaultStore

ルート解決で使うマシン単位の代替ストア ID です。`--store`フラグ、ローカルの`openspec/`、プロジェクトの`store:`ポインターのいずれでも解決できない場合だけ参照します。完全な優先順位は[ルート解決](../../multi-repo/stores.md#where-artifacts-get-created-when-using-stores)を参照してください。

### openers

workset を開けるツールと、各ツールの起動方法です。各項目は手作業で編集し、使用時に検証されます。項目には`style`（`workspace-file`または`attach-dirs`）、`label`、`command`、`args`、`attach_flag`を設定できます。組み込みの既定値へ項目ごとにマージされます。

### telemetry

CLI がテレメトリ用に書き込む状態です。匿名 ID と、初回通知を表示済みかどうかを含みます。これはオプトアウト設定ではありません。テレメトリを無効にする環境変数は[環境変数](environment-variables.md)を参照してください。

## 例

設定済みの`config.json`：

```json
{
  "profile": "core",
  "delivery": "both",
  "featureFlags": {},
  "telemetry": {
    "anonymousId": "5f8a2c1e-4b6d-4f9a-9c3d-7e1b2a8d4c6f",
    "noticeSeen": true
  }
}
```
