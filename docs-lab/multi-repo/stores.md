# ストア（ベータ）

> 1 つのストアを使い、複数リポジトリにまたがる変更を計画します。

通常、OpenSpec は計画対象のコードと同じリポジトリにある`openspec/`フォルダを使います。ストアを使うと、このフォルダを専用リポジトリへ移し、複数のコードリポジトリで共有できます。

各マシンで一度セットアップすれば、どのディレクトリからでも`status`、`new change`、`archive`などのコマンドでストアを操作できます。

```
         team-plans  （ストア：専用リポジトリ内の OpenSpec）
         ├── .openspec-store/store.yaml   ストア名
         └── openspec/
             ├── specs/
             └── changes/
                   ▲
                   │ 各マシンで一度セットアップし、
                   │ 通常のリポジトリと同様に push と clone で共有
     ┌─────────────┼─────────────┐
     │             │             │
 web-app       api-server     mobile-app
（コード）     （コード）      （コード）
```

ストアはコードと同じように Git で共有します。自分でコミット、push、pull、レビューを行います。仕様と変更も、コードと同様にブランチとプルリクエストで管理します。

<a id="when-you-need-one"></a>

## ストアが必要な場面

ストアを使う一般的な理由は 2 つあります。

- **フロントエンドとバックエンドが別のリポジトリにある**：1 つの機能が両方に影響する場合、計画を 2 つに分けず 1 か所へ置けます。

  ```
        shop-plans  （ストア）
        └── openspec/changes/add-discounts/    機能全体の計画
                  ▲
        ┌─────────┴─────────┐
        │                   │
    storefront             api
  （フロントエンド）    （バックエンド）
  ```

- **1 つの製品に複数のクライアントリポジトリがある**：Android、iOS、Web が別々のリポジトリからリリースされ、期待する振る舞いを共有する場合です。仕様は実装ではなく振る舞いを記述するため、1 つの仕様を 3 つのリポジトリで利用できます。

  ```
          product-specs  （ストア）
          └── openspec/specs/checkout/spec.md    期待する振る舞い
                    ▲
      ┌─────────────┼─────────────┐
      │             │             │
  android-app    ios-app       web-app
  （コード）      （コード）     （コード）
  ```

複数のストアを利用できますが、数を増やしすぎないことを推奨します。

<a id="set-up-a-store"></a>

## ストアのセットアップ

最初に 1 人がストアを作成し、その後ほかのメンバーが参加します。

1. **ストアを作成する**（チームごとに 1 人が一度だけ実行）。`openspec store setup`を実行し、質問に答えます。

   ```bash
   # どこからでも実行可能。作成内容と保存場所を尋ねられる
   openspec store setup
   ```

   3 つの質問に答えます。

   - **ストア名**：`team-plans`
   - **ストアの保存先を指定してください。**：`~/openspec/<name>`が入力済みです。Enter キーで確定するか、別のパスを入力します。
   - **このストアを作成しますか？**：作成予定の内容を確認し、`Yes`と答えます。

   作成後、次の内容が表示されます。

   ```yaml
   ストア準備完了: team-plans
   場所: ~/openspec/team-plans
   OpenSpec ルート: 準備完了
   登録状態: 登録しました

   次に、通常の OpenSpec コマンドをこのストアに対して実行します。例: openspec new change <change-id> --store team-plans
   共有方法: 通常の Git リポジトリと同じように commit / push してください。
   ```

2. **Git ホストへ push する。** 先に、ホスト上へ空の`team-plans`リポジトリを作ります。setup は Git リモートを追加しないため、ストアをリポジトリへ接続してから push します。

   ```bash
   # Git ホスト上の空リポジトリへストアを接続
   cd ~/openspec/team-plans
   git remote add origin git@github.com:acme/team-plans.git

   # 公開
   git push -u origin main
   ```

3. **ストアへ参加する**（各メンバーがマシンごとに一度実行）。

   ```bash
   # ストアをマシンへ取得
   git clone git@github.com:acme/team-plans.git ~/openspec/team-plans

   # OpenSpec へ保存場所を登録
   openspec store register ~/openspec/team-plans
   ```

   ```yaml
   ストアを登録しました: team-plans
   場所: /Users/you/openspec/team-plans
   OpenSpec ルート: 準備完了
   登録状態: 登録しました
   ```

   登録すると、このマシン上でストアの保存場所が分かるようになります。ストア名は`.openspec-store/store.yaml`に保存され、すでにコミットされています。setup を実行した人のコピーはその時点で登録されるため、この手順が必要なのは clone したコピーだけです。

4. **動作を確認する。** どのディレクトリからでも実行できます。

   ```bash
   # ストア名を指定すると、どこからでも通常の OpenSpec コマンドを実行できる
   openspec status --store team-plans
   ```

   ```yaml
   OpenSpec ルートを使用: team-plans (/Users/you/openspec/team-plans)
   アクティブな変更はありません。作成するには: openspec new change <name> --store team-plans
   ```

## セットアップの種類

OpenSpec には 3 種類のセットアップがあります。この後は次の名前を使います。

- **リポジトリ内（`repo-local`）**：ストアを使わず、OpenSpec をリポジトリ内へ置く既定の構成。
- **ストアのみ（`store-only`）**：リポジトリ内に独自の仕様や変更を置かず、すべてをストアへ置く構成。
- **ストアを任意利用（`store-optional`）**：プロジェクト独自の`openspec/`フォルダを持ち、必要なときだけストアも使う構成。

### 既定：OpenSpec をリポジトリ内へ置く（repo-local）

`openspec init`を実行すると、コードと同じ場所に`openspec/`フォルダが作られ、そのリポジトリの仕様と変更が保存されます。ストアは使いません。[プロジェクトのセットアップ](../start/setup.md)で説明している構成で、ほとんどのプロジェクトはこれだけで十分です。

```
web-app  （コードリポジトリ）
└── openspec/
    ├── specs/
    └── changes/
```

### OpenSpec をリポジトリ外のストアへ置く（store-only）

リポジトリには独自の仕様や変更を置きません。すべての計画をストアへ置き、リポジトリの設定 1 行で両者を接続します。

1 つのチームがすべてのリポジトリを開発し、計画を 1 か所で管理する場合によく使います。[前の例](#when-you-need-one)もこの構成です。

```
team-plans  （ストア）
└── openspec/
    ├── specs/       リポジトリの仕様
    └── changes/     リポジトリの変更
          ▲
          │ store: team-plans   （接続する行）
web-app  （コードリポジトリ）
└── openspec/
    └── config.yaml    ほかのファイルは置かない
```

### OpenSpec をリポジトリとストアの両方へ置く（store-optional）

リポジトリ独自の作業にはリポジトリ内の構成を使い、共有する仕様と変更はストアへ置きます。リポジトリ内ではプロジェクトの`openspec/`フォルダが使われ、`--store`を指定したときだけストアへ接続します。

ストアを作る前から OpenSpec を使っていたリポジトリや、普段は独立していて、ときどき共有作業へ参加するリポジトリに適しています。

```
team-plans  （ストア）
└── openspec/          共有する仕様と変更
          ▲
          │ --store team-plans を指定した場合だけ使用
web-app  （コードリポジトリ）
└── openspec/          このリポジトリ独自のもの
    ├── config.yaml
    ├── specs/
    └── changes/
```

リポジトリ内の構成から始め、後で仕様と変更をストアへ移せます。手順は[リポジトリの仕様と変更をストアへ移す](#move-a-repos-specs-and-changes-into-the-store)を参照してください。

<a id="where-artifacts-get-created-when-using-stores"></a>

## ストア利用時のアーティファクト作成先

ストアを使う場合、アーティファクトの作成先も選ばれます。作成先はセットアップによって異なります。

- **ストアのみ**：プロジェクトはストアだけへ書き込みます。すべてのアーティファクトがストアへ作成されます。後述の`store:`行でストアを記録します。
- **ストアを任意利用**：プロジェクト独自の`openspec/`フォルダとストアを併用します。通常、アーティファクトはプロジェクト内へ作成されます。その変更について、依頼時にストア名を指定するか`--store`を渡すと、エージェントが以降のワークフローにもフラグを引き継ぎます。

OpenSpec は、プロジェクトまたはストアの`openspec/`フォルダへアーティファクトを書き出します。次の順に判定し、最初に該当した場所を使います。

1. **コマンドの`--store <id>`。** どのディレクトリから実行しても、常に最優先です。
2. **プロジェクトの`openspec/`フォルダ。** プロジェクト独自の`specs/`または`changes/`フォルダがあれば、その場所を使います。
3. **プロジェクトの`store:`行。** ストアのみのプロジェクトが、使用するストアを記録する方法です。
4. **マシン上の`defaultStore`。** それまでの条件に該当しない場合の代替先です。

OpenSpec がストアを選択すると、コマンド出力の前に `OpenSpec ルートを使用: ...` と表示します。

### store: 行（ストアのみのプロジェクト）

プロジェクトの`openspec/config.yaml`へ 1 行追加します。

```yaml
# web-app/openspec/config.yaml
store: team-plans
```

これ以降、プロジェクト内で利用者またはエージェントが実行する操作は、フラグを指定しなくてもストアを使います。

```bash
# 接続済みの web-app 内で実行
openspec status
```

```yaml
OpenSpec ルートを使用: team-plans (/Users/you/openspec/team-plans)
アクティブな変更はありません。作成するには: openspec new change <name> --store team-plans
```

- **この行がない場合**：ストアのみのプロジェクトで通常のコマンドを実行すると、OpenSpec は停止し、登録済みストアの一覧を表示します。
- **コミットする**：プロジェクトを clone したメンバーにもこの行が渡ります。ただし、各メンバーは自分のマシンへストアを登録する必要があります（[ストアのセットアップの手順 3](#set-up-a-store)）。未登録の場合、OpenSpec はエラーと登録方法を表示します。
- **実際のフォルダと併存する場合**：プロジェクト内に`specs/`または`changes/`フォルダもあると、OpenSpec は警告を表示し、`store:`行を無視してそのフォルダを使います。

### マシン上の `defaultStore`

作業するすべてのプロジェクトで同じストアを使う場合は、一度設定します。フラグ、ローカルの`openspec/`フォルダ、`store:`行のいずれもないとき、OpenSpec はこのストアを使います。

```bash
# ほかにストアの指定がなければ team-plans を使う
openspec config set defaultStore team-plans

# 設定を解除
openspec config unset defaultStore
```

**ローカルだけを操作するコマンド。** `init`、`update`、`templates`、`schemas`、`openspec schema`のサブコマンドはカレントディレクトリだけを操作し、`--store`を受け取りません。

<a id="move-a-repos-specs-and-changes-into-the-store"></a>

## リポジトリの仕様と変更をストアへ移す

リポジトリ内の構成からストアのみの構成へ移行するには、次の手順を実行します。

1. リポジトリの`openspec/specs/`と`openspec/changes/`にあるすべてのファイルを、ストア内の同名フォルダへ移します。
2. 空になったフォルダを削除し、リポジトリの`openspec/`フォルダには`config.yaml`だけを残します。
3. その`config.yaml`へ`store:`行を追加します。

リポジトリ内で`openspec status`を実行すると、出力が`OpenSpec ルートを使用: team-plans`で始まるようになります。

## ストアで作業する

利用者とエージェントが使うワークフローは変わりません。提案、適用、アーカイブは従来どおり動作します。異なるのはアーティファクトの作成先だけです。作成先は[前のセクション](#where-artifacts-get-created-when-using-stores)を参照してください。

ストアのみのリポジトリ内で変更を作成すると、ストアへ保存されます。

```bash
# web-app 内で実行。store: 行により team-plans が選ばれる
openspec new change add-login
```

```yaml
OpenSpec ルートを使用: team-plans (/Users/you/openspec/team-plans)
変更 'add-login' を作成しました: /Users/you/openspec/team-plans/openspec/changes/add-login/
スキーマ: spec-driven
次: openspec status --change add-login --store team-plans
```

- **作成先**：コードの隣ではなく、ストアリポジトリ内です。
- **共有方法**：ストアリポジトリをコミットして push するまで、変更は自分のチェックアウトにしかありません。ほかのメンバーは pull 後に確認できます。ワークフローが作成するすべてのアーティファクトも同様です。
- **ドキュメント内のパス**：ドキュメントで`openspec/`パスを示している場合、ストア構成ではストア内のフォルダを指します。

アーティファクトが予想外の場所へ作成された場合は、`openspec doctor`を実行してください。設定を変更せずに状態を確認し、見つかった問題ごとに修正方法を表示します。

```bash
# 現在のルートとストアを確認
openspec doctor
```

```yaml
診断

ルート
  場所: /Users/you/openspec/team-plans
  OpenSpec ルート: ok
  ストア: team-plans (メタデータ ok)

参照
  (宣言なし)
```

検証せずに同じ情報を確認するには、`openspec context`を使います。カレントディレクトリで利用するルートとストアが表示されます。

エージェントがストアとコードリポジトリの両方を読めるよう、1 つのエディタウィンドウで開く方法は[Worksets（ベータ）](worksets.md)を参照してください。

## 別のストアから仕様を読み込む

リポジトリ独自の`openspec/`フォルダを保ったまま、別のストアにある仕様をエージェントに読ませることもできます。リポジトリの`openspec/config.yaml`で、`references:`にストアを指定します。

```yaml
# api-server/openspec/config.yaml
references:
  - team-plans
```

参照は読み取り専用です。作業内容はリポジトリ内に残り、参照によって変わるのはエージェントが受け取る指示だけです。

ワークフローがアーティファクトを作成するとき、指示へ参照先ストアの仕様一覧が追加されます。各仕様には 1 行の概要と、取得用の正確なコマンドが示されます。

```xml
<referenced_stores>
<!-- Read-only upstream context. Fetch what you need; cite what you use. -->
Store team-plans (/Users/you/openspec/team-plans):
  - payments: 顧客への請求と返金に関する規則。
  取得: openspec show <spec-id> --type spec --store team-plans
</referenced_stores>
```

まだストアがないマシン向けに、参照へ clone 元 URL を含めることもできます。

```yaml
references:
  - team-plans
  - { id: design-system, remote: "git@github.com:acme/design-system.git" }
```

URL を指定しておくと、`openspec doctor`はストアがない場合に、そのまま実行できる修正コマンドを表示します。

```yaml
# 読みやすいよう出力を折り返している
参照
  - team-plans: ok (/Users/you/openspec/team-plans)
  - design-system: Referenced store 'design-system' is not registered on this machine.
    修正: git clone -- git@github.com:acme/design-system.git '/Users/you/openspec/design-system' &&
          openspec store register '/Users/you/openspec/design-system' --id design-system
```

## ベータ版の制限

- **形式が変わる可能性がある**：コマンド名、フラグ、ファイル形式はリリース間で変わる場合があります。アップグレード後に、このページをもう一度確認してください。
- **設計上、同期は行わない**：OpenSpec は clone、pull、push を行いません。pull するまで古いチェックアウトには古い仕様が表示され、参照はディスク上の内容をそのまま読み取ります。
- **1 つのストア名につき 1 つのチェックアウト**：登録済みの名前へ 2 つ目のフォルダを登録すると失敗し、先に`openspec store unregister`を実行するよう案内されます。
