# ストア: 独立したリポジトリで計画する

> **ベータ版** ストア、参照、作業コンテキスト、ワークセットは新しい機能です。コマンド名、フラグ、ファイル形式、JSON 出力の形は、今後のリリースで変わる可能性があります。以下の手順は現在のビルドでは有効ですが、アップグレード後はこのガイドを確認し直してください。

## 何を解決するか

OpenSpec は通常、1 つのコードリポジトリ内にあります。コードの横に `openspec/` フォルダーがあり、そのリポジトリの仕様と変更を保持します。

計画が 1 つのリポジトリを超えると、この形では合わなくなります。

- 作業が複数のリポジトリにまたがる。1 つの機能が API サーバー、Web アプリ、共有ライブラリをまたぐ場合、計画を持つ `openspec/` フォルダーをどこに置くべきでしょうか。
- コードがまだ存在しない段階で計画したい、または *この* リポジトリには存在しないコードについて計画したい。
- あるチームが要件を所有し、別のチームがそれを使う。Wiki はすぐ古くなり、コーディングエージェントも読み取りにくい。

**ストア** は、この問題への答えです。ストアは計画専用の独立したリポジトリです。使い慣れた `openspec/` と同じ形で仕様と変更を持ち、そこに小さな ID ファイルが加わります。一度マシンに名前で登録すれば、通常の OpenSpec コマンドからどこでも使えます。

## 形

```
            team-plans  (ストア: 計画専用の独立リポジトリ)
            ├── .openspec-store/store.yaml     identity: "I am team-plans"
            └── openspec/
                ├── specs/      確定した仕様
                └── changes/    進行中の変更
                      ▲
                      │ 各マシンで名前を付けて登録
                      │ 通常のリポジトリと同じく push / clone で共有
        ┌─────────────┼─────────────┐
        │             │             │
    web-app       api-server     mobile-app
   (code repo)   (code repo)    (code repo)
```

シンプルに保つため、ルールは 2 つです。

1. **ストアはただの Git リポジトリです。** コミット、プッシュ、プル、レビューは自分で行います。OpenSpec が勝手に clone、sync、push することはありません。
2. **機械的に同期するのではなく、宣言します。** リポジトリは、どのストアと関係しているかを *宣言* できます（後述）。宣言は OpenSpec が渡すコンテキストを変えますが、コマンドが実行できる場所を制限するものではありません。

## 最初のストアを 5 分で作る

次の 2 コマンドで、空の状態からストアスコープの変更を作れます。

```bash
openspec store setup team-plans --path ~/openspec/team-plans
```

```
ストア準備完了: team-plans
場所: /Users/you/openspec/team-plans
OpenSpec ルート: 準備完了
レジストリ: 登録済み

次: このストアに対して通常の OpenSpec コマンドを実行します。例:
  openspec new change <change-id> --store team-plans
このストアは、通常の Git リポジトリと同じようにコミットして push することで共有します。
```

```bash
openspec new change add-login --store team-plans
```

```
使用中の OpenSpec ルート: team-plans (/Users/you/openspec/team-plans)
変更 'add-login' を /Users/you/openspec/team-plans/openspec/changes/add-login/ に作成しました
Schema: spec-driven
次: openspec status --change add-login --store team-plans
```

モデルはこれだけです。以降のライフサイクルは通常の OpenSpec と同じで、`status`、`instructions`、`validate`、`archive` などの各コマンドに `--store team-plans` を付けます。出力されるヒントにも同じフラグが含まれます。`Using OpenSpec root:` 行を見ると、コマンドがどのルートに対して動いているかが常に分かります。

## ストーリー: 1 チーム、1 計画リポジトリ

チームは仕様と変更を各コードリポジトリに散らさず、`team-plans` に集約します。

**1 日目（セットアップ担当者）:**

```bash
openspec store setup team-plans --path ~/openspec/team-plans \
  --remote git@github.com:acme/team-plans.git
git -C ~/openspec/team-plans push -u origin main
```

`--remote` を渡すと、ストア自身の ID ファイル（`.openspec-store/store.yaml`）に clone URL が記録され、最初のコミットに含まれます。今後 clone されたストアは自分の取得元を知っているため、ヘルスチェックやエラーは、まだ持っていないチームメイト向けにそのまま貼り付けられる修正コマンドを表示できます。

**すべてのチームメイト（マシンごとに 1 回）:**

```bash
git clone git@github.com:acme/team-plans.git ~/openspec/team-plans
openspec store register ~/openspec/team-plans
```

以後、全員が同じ計画リポジトリを名前で使えます。

```bash
openspec status --store team-plans --change add-login
openspec show add-login --store team-plans
```

**作業の共有は、意図的に Git に任せます。** 作成した変更はコードと同じです。コミットしてプッシュするまでは他の人には共有されません。ストアは普通のリポジトリなので、ブランチ、プルリクエスト、レビューをそのまま使えます。

**チームのコードリポジトリを接続します。** 計画を完全に外部化したコードリポジトリでは、`openspec/config.yaml` に 1 行だけ追加します。

```yaml
# web-app/openspec/config.yaml
store: team-plans
```

`web-app` 内で実行する OpenSpec コマンドは、明示的なフラグなしで `team-plans` に対して動きます。

```bash
cd ~/src/web-app
openspec status --change add-login
```

```
使用中の OpenSpec ルート: team-plans (/Users/you/openspec/team-plans)
...
```

このポインターはフォールバックであり、上書きではありません。明示的な `--store` は常に優先されます。また、そのリポジトリに実際の計画フォルダーが存在する場合は、そのフォルダーが優先されます（古いポインターを削除するよう警告されます）。

## ストーリー: チームをまたぐ要件

プラットフォームチームが要件を所有し、プロダクトチームがそれを使って自分たちのリポジトリで設計・実装する場合があります。参照を使うと、誰かの作業場所を移動せずに、この関係を表現できます。

```
   platform-reqs (store)                 api-server (code repo)
   platform チームが所有                 product チームが所有
   ┌──────────────────────────┐          ┌──────────────────────────┐
   │ openspec/specs/          │ ◀────────│ openspec/config.yaml     │
   │   payments/spec.md       │ 読み取り │   references:            │
   │   auth/spec.md           │          │     - platform-reqs      │
   │                          │          │ openspec/specs/          │
   │ openspec/changes/        │          │   (自分たちの設計)       │
   │   platform 側の作業      │          │ openspec/changes/        │
   │                          │          │   (自分たちの作業)       │
   │                          │          └──────────────────────────┘
   └──────────────────────────┘
```

**プロダクトチームは、自分たちのリポジトリで何を参照しているかを宣言します。**

`openspec/config.yaml`:

```yaml
references:
  - platform-reqs
```

参照は読み取り専用のコンテキストです。リポジトリは自分自身の `openspec/` ルートを持ち、作業はそこに残ります。変わるのは、そのリポジトリで実行する `openspec instructions` に、参照先ストアの仕様インデックスが含まれることです。各項目には 1 行の概要と、正確な取得コマンド（`openspec show <spec-id> --type spec --store platform-reqs`）が含まれます。`api-server` で作業するエージェントは、上流の支払い要件を引用しつつ、低レベル設計はそのリポジトリ自身のルートに書けます。誰かがコンテキストを貼り付ける必要はありません。

参照には clone 元を保持できるため、未登録の場合でも行き止まりにならず、具体的な修正方法を出せます。

```yaml
references:
  - { id: platform-reqs, remote: "git@github.com:acme/platform-reqs.git" }
```

**計画とコードを一緒に開きたい場合は、ワークセットを作ります。** これは個人用で、明示的な設定です。各人が、自分のマシン上で実際に作業するフォルダーを選びます。これらのローカルチェックアウトパスは共有計画リポジトリにはコミットされません。

```bash
openspec workset create platform \
  --member ~/openspec/platform-reqs \
  --member ~/src/api-server \
  --member ~/src/web-app
```

## いつでも確認できる 2 つの質問

**「セットアップは正常か？」** — `openspec doctor` は現在のルートと参照ストアを確認し、検出結果ごとに貼り付け可能な修正コマンドを表示します。

```
診断

ルート
  場所: /Users/you/src/api-server
  OpenSpec ルート: ok

参照
  - platform-reqs: ok (/Users/you/openspec/platform-reqs)
  - design-system: 参照ストア 'design-system' はこのマシンに登録されていません。
    修正: git clone -- git@github.com:acme/design-system.git '/Users/you/openspec/design-system' && openspec store register '/Users/you/openspec/design-system' --id design-system

```

**「何を対象に作業しているか？」** — `openspec context` は、OpenSpec の宣言から作業コンテキストを組み立てます。現在のルートと、それが参照するストアが表示されます。

```
api-server の作業コンテキスト (/Users/you/src/api-server)

OpenSpec ルート
  api-server  /Users/you/src/api-server

参照ストア
  platform-reqs  /Users/you/openspec/platform-reqs
    取得: openspec show <spec-id> --type spec --store platform-reqs
```

どちらもエージェント向けの `--json` をサポートします。`openspec context --code-workspace <path>` は、さらに VS Code ワークスペースファイルを書き出し、全体のセットを含めます。このコマンドが行う書き込みはそれだけです。

## ワークセット: 一緒に使うフォルダーを開き直す

上記とは別に、多くの人は毎回同じいくつかのフォルダーを一緒に開きます。たとえば、計画リポジトリと 2〜3 個のコードリポジトリです。**ワークセット** は、それを表す個人用の名前付きビューです。保存したワークセットを、選んだツールで開き直せます。

```
  workset "platform"                 openspec workset open platform
  ├── team-plans   ~/openspec/team-plans         │
  ├── api-server   ~/src/api-server              ▼
  └── web-app      ~/src/web-app       3 つすべてをツールで開く
```

```bash
openspec workset create platform \
  --member ~/openspec/team-plans --member ~/src/api-server \
  --tool code
openspec workset list
```

```
platform  (VS Code で開く)
  team-plans  /Users/you/openspec/team-plans
  api-server  /Users/you/src/api-server
```

次に `openspec workset open platform` を実行すると、保存されたツール（VS Code、Cursor など）で、すべてのメンバーを含む 1 つのウィンドウが開きます。最初のメンバーがメインです。`--tool <id>` でいつでもツールを上書きできます。

ワークセットは意図的に共有状態ではありません。あなたのマシン上だけに存在し、コミットされず、作業内容について何も主張しません。よく一緒に開くものを記録するだけです。削除してもメンバーフォルダーには影響しません。新しいツールへの対応はコードではなく設定です。ワークスペースファイルやフォルダーごとの追加フラグは、グローバル設定（`openspec config edit`）の `openers` に追加できます。

## コマンドがどこで動くかを決める方法

通常のコマンドは、次の順序で同じようにルートを解決します。

```
1. --store <id>          明示的に指定した             → そのストア
2. nearest openspec/     近くに実体のある計画ルート   → このリポジトリ
   (cwd から親方向に探索)
3. store: pointer        config.yaml が store を宣言  → そのストア
4. none of the above     このマシンにストア登録あり?  → 選択ヒント付きエラー
                         ストア登録なし?             → 現在のディレクトリ
                                                         (従来の挙動)
```

`Using OpenSpec root:` 行（および `--json` 出力の `root` ブロック）を見ると、どのケースに該当したかが分かります。

## 既知の制限

- **ベータ版です。** このページの内容は、名前、フラグ、ファイル形式、JSON キーを含め、リリースごとに変わる可能性があります。
- **1 台のマシンでは、ストア ID ごとにチェックアウトは 1 つです。** 同じ ID で 2 つ目のチェックアウトを登録しようとすると失敗し、先に `store unregister` するためのヒントが表示されます。
- **同期は意図的に行いません。** OpenSpec は clone、pull、push しません。古いチェックアウトでは、自分で pull するまで古い仕様が見えます。参照はディスク上にある内容からその場でインデックスされます。
- **空の計画フォルダーがまだ存在しない場合があります。** 新しいストアには、Git 上で `openspec/changes/`、`openspec/specs/`、`openspec/changes/archive/` がまだ存在しないことがあります。ベータ期間中は許容されます。通常のコマンドがファイルを作ると、これらのフォルダーも作成されます。
- **ポインターリポジトリはポインターのままです。** `openspec/config.yaml` だけを持ち、`store: <id>` を宣言しているリポジトリは、登録対象のストアチェックアウトではなく、外部化された計画を指すものとして扱われます。そのリポジトリを意図的にローカルのストアルートへ変換したい場合は、先に `store:` 行を削除してください。
- **一部のコマンドは対象外です。** `view`、`templates`、`schemas`、非推奨の名詞形式（`openspec change show` など）は、現在のディレクトリだけを対象にします。`--store` はありません。
- **マシンごとの状態はマシンごとです。** ストアレジストリとワークセットはローカル設定です。あなたのマシン上のレイアウトは、共有された計画リポジトリには影響しません。
- **ワークセットには 2 つの起動スタイルがあります。** ワークスペースファイル、またはフォルダーごとの追加フラグを opener として設定できます。
- **エージェント JSON には既知の大文字小文字の違いがあります。** ストア系のキーは snake_case、ワークフロー系は camelCase です。[エージェント契約](../agent-contract.md) に記載しています。統一はバージョン付きリリースまで延期されています。

## ファイルの保存場所

| 何を | どこ | 共有されるか |
| --- | --- | --- |
| ストアの計画 | `<store>/openspec/`（仕様、変更） | はい — コミットしてプッシュします |
| ストアの識別情報 | `<store>/.openspec-store/store.yaml` | はい — ストアと一緒にコミットします |
| ストアレジストリ | `<data dir>/openspec/stores/registry.yaml` | いいえ — このマシンのみ |
| ワークセット | `<data dir>/openspec/worksets/` | いいえ — このマシンのみ |

`<data dir>` は、macOS と Linux では `~/.local/share/openspec`（設定されている場合は `$XDG_DATA_HOME/openspec`）、Windows では `%LOCALAPPDATA%\openspec` です。

## 参照

このページで扱ったコマンドの正確なフラグと JSON 形式は、[CLI リファレンス](../cli.md)（ストア、doctor、作業コンテキスト、個人ワークセット）と [エージェント契約](../agent-contract.md) を参照してください。
