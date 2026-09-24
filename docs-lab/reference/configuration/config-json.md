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
| `openers`      | ツール ID と設定のマップ                                         | いいえ | workset を開くツールと、各ツールの起動方法です                                    |
| `telemetry`    | マップ                                         | いいえ | テレメトリーの停止設定、匿名 ID、通知表示済み状態です                                      |

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

workset を開くツールを、ツール ID をキーとして指定します。ターミナルで`openspec config edit`を実行し、グローバル`config.json`の`openers`を編集してください。

| フィールド | 仕様 |
| --- | --- |
| `style` | `workspace-file`または`attach-dirs`。新規ツールでは必須、組み込みでは任意です。 |
| `label` | 選択画面に表示する空でない文字列。新規ツールの既定値は ID です。 |
| `command` | 空でない実行ファイル名またはパス。新規ツールの既定値は ID です。引数はこの文字列ではなく`args`に指定します。 |
| `args` | ワークスペースファイルや接続フラグの前に渡す文字列配列。新規ツールの既定値は`[]`です。 |
| `attach_flag` | `attach-dirs`で各メンバーパスと対にする空でない文字列。新規ツールの既定値は`--add-dir`です。`workspace-file`では無視します。 |

**組み込み設定の上書き**：`code`、`cursor`、`claude`、`codex`で省略したフィールドは既存値を保持します。`args`を設定すると引数一覧全体を置き換え、`[]`なら空にします。

**起動方式**：`workspace-file`は生成した`.code-workspace`のパスを実行ファイルへ渡します。`attach-dirs`は主メンバーを含む各メンバーに、フラグとパスの組を渡します。

**利用可否**：Claude Code と Codex を含む`attach-dirs`は既定で無効です。`--tool`で選択・保存できず、保存済みの workset に指定されていても起動を拒否します。設定の上書きでは有効になりません。

**検証**：不明なフィールド、不正な型、新規ツールの`style`省略は、workset コマンドが設定表を読み取るときにエラーになります。

次の例は VS Code Insiders を追加し、組み込みの VS Code の起動時に`--new-window`を渡します。

```json
{
  "openers": {
    "code-insiders": {
      "style": "workspace-file",
      "label": "VS Code Insiders"
    },
    "code": {
      "args": ["--new-window"]
    }
  }
}
```

対応する`code-insiders`または`code`実行ファイルをインストールし、`PATH`から利用できる必要があります。

### telemetry

CLI は匿名 ID と初回通知の表示済み状態を保存します。テレメトリーを無効にするには`telemetry.enabled`を`false`にします。環境変数`OPENSPEC_TELEMETRY=0`または`DO_NOT_TRACK=1`でも停止できます。

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
