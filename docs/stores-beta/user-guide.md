# ストア数: 独自のリポジトリで計画する

> **ベータ版** ストア、参照、作業コンテキスト、およびワークセットは
> 新しい。コマンド名、フラグ、ファイル形式、JSON 出力は引き続き変更される可能性があります
> リリース間の形状を変更します。以下のすべてのウォークスルーは、
> 現在のビルドですが、アップグレード後にこのガイドをもう一度読んでください。

## これで解決する問題

OpenSpec は通常、1 つのコード リポジトリ内に存在します。次の `openspec/` フォルダーです。
コード、そのリポジトリの仕様と変更を保持します。

計画が 1 つのリポジトリよりも大きくなると、これは適合しなくなります。

- 作業は複数のリポジトリにまたがります。1 つの機能は API サーバーに接続します。
Web アプリと共有ライブラリ。 `openspec/` フォルダーが計画を実行するのは誰ですか
住んでいますか？
- チームはコードが存在する前に計画するか、コードが存在しないことを計画します。
*この* リポジトリのコード。
- 要件は 1 つのチームによって所有され、他のチームによって使用されます。ウィキ
バージョンがずれていて、コーディング エージェントがそれを読み取ることができません。

**ストア** がその答えです。つまり、その仕事全体が計画を行うスタンドアロンのリポジトリです。
ご存知の`openspec/`形状と同じ仕様と変更点
加えて、小さな ID ファイルが追加されます。一度マシンに名前で登録すると、
そうすれば、通常の OpenSpec コマンドはどこからでも実行できるようになります。

## 形状

```
            team-plans  (a store: planning in its own repo)
            ├── .openspec-store/store.yaml     identity: "I am team-plans"
            └── openspec/
                ├── specs/      what is true
                └── changes/    what is in motion
                      ▲
                      │ registered on each machine by name;
                      │ shared by pushing/cloning like any repo
        ┌─────────────┼─────────────┐
        │             │             │
    web-app       api-server     mobile-app
   (code repo)   (code repo)    (code repo)
```

これを単純にするために次の 2 つのルールがあります。

1. **ストアは単なる git リポジトリです。** コミット、プッシュ、プル、レビューを行います。
あなた自身。 OpenSpec は、単独で何かを複製したり、同期したり、プッシュしたりすることはありません。
2. **機械ではなく宣言。** リポジトリは、それがどのように関連しているかを *宣言* できます。
ストア（以下に表示）。宣言により、OpenSpec が伝える内容が変わります —
あなたのコマンドが機能する場所では決してありません。

## 最初のストアまで 5 分

2 つのコマンドを使用すると、何もない状態からストア スコープの変更を実行できるようになります。

```bash
openspec store setup team-plans --path ~/openspec/team-plans
```

```
Store ready: team-plans
Location: /Users/you/openspec/team-plans
OpenSpec root: ready
Registry: registered

Next: run normal OpenSpec commands against this store, for example:
  openspec new change <change-id> --store team-plans
Share this store by committing and pushing it like any Git repo.
```

```bash
openspec new change add-login --store team-plans
```

```
Using OpenSpec root: team-plans (/Users/you/openspec/team-plans)
Created change 'add-login' at /Users/you/openspec/team-plans/openspec/changes/add-login/
Schema: spec-driven
Next: openspec status --change add-login --store team-plans
```

それがモデル全体です。ここからのライフサイクルはまさにあなたが知っているとおりです —
`status`、`instructions`、`validate`、`archive` — `--store team-plans` 付き
各コマンドにフラグが付けられ、出力されるすべてのヒントにフラグが付けられます。の
`Using OpenSpec root:` 行は、コマンドがどこで動作しているかを常に示します。

## ストーリー: 1 つのチーム、1 つの計画リポジトリ

チームは仕様と変更を散在させるのではなく、`team-plans` に保持します。
コード リポジトリ全体でそれらを実行します。

**1 日目 (設定者は誰でも):**

```bash
openspec store setup team-plans --path ~/openspec/team-plans \
  --remote git@github.com:acme/team-plans.git
git -C ~/openspec/team-plans push -u origin main
```

`--remote` を渡すと、ストア自体の ID 内のクローン URL が記録されます
ファイル (`.openspec-store/store.yaml`)、最初のコミット。あらゆる未来
クローンはどこから来たのかを知って誕生するため、ヘルスチェックとエラーが発生します
メッセージは、チームメイトが持っていない完全な貼り付け可能な修正を印刷できます。
それはまだです。

**すべてのチームメイト (マシンごとに 1 回):**

```bash
git clone git@github.com:acme/team-plans.git ~/openspec/team-plans
openspec store register ~/openspec/team-plans
```

それ以降、全員が名前で同じ計画リポジトリで作業するようになります。

```bash
openspec status --store team-plans --change add-login
openspec show add-login --store team-plans
```

**作業の共有は、意図的に git です。** 作成した変更は、
チェックアウトをコミットしてプッシュするまでは、コードと同じです。計画は取得します
ストアはブランチ、プルリクエスト、レビューを無料で提供します。
普通のレポ。

**チームのコード リポジトリを接続します。** 計画が完全に完了しているコード リポジトリ
externalized には、`openspec/config.yaml` に次の 1 行が必要です。

```yaml
# web-app/openspec/config.yaml
store: team-plans
```

`web-app` 内で実行されるすべての OpenSpec コマンドは、`team-plans` に対して次のように動作します。
フラグがまったくありません:

```bash
cd ~/src/web-app
openspec status --change add-login
```

```
Using OpenSpec root: team-plans (/Users/you/openspec/team-plans)
...
```

ポインタはフォールバックであり、決してオーバーライドではありません。明示的な `--store` は常に
が勝ち、リポジトリが独自の実際の計画フォルダーを成長させた場合、それらのフォルダーが勝ちます。
(古いポインタを削除するよう警告が表示されます)。

## ストーリー: チームの枠を超えた要件

プラットフォーム チームが要件を所有します。製品チームはそれらに基づいて構築し、
独自のデザインで独自のリポジトリにあります。参考文献には次のように説明されています
誰も仕事を動かすことなく関係を築くことができます。

```
   platform-reqs (store)                 api-server (code repo)
   owned by the platform team            owned by a product team
   ┌──────────────────────────┐          ┌──────────────────────────┐
   │ openspec/specs/          │ ◀────────│ openspec/config.yaml     │
   │   payments/spec.md       │ reads    │   references:            │
   │   auth/spec.md           │          │     - platform-reqs      │
   │                          │          │ openspec/specs/          │
   │ openspec/changes/        │          │   (their own designs)    │
   │   platform work          │          │ openspec/changes/        │
   │                          │          │   (their own work)       │
   │                          │          └──────────────────────────┘
   └──────────────────────────┘
```

**製品チームは、リポジトリで何を利用しているかを宣言します**
`openspec/config.yaml`:

```yaml
references:
  - platform-reqs
```

参照は読み取り専用のコンテキストです。リポジトリは独自の `openspec/` ルートを保持します。
仕事はそこに残ります。変更内容: 現在そのリポジトリの `openspec instructions`
参照されたストアの仕様のインデックスが含まれます。それぞれ 1 行で構成されます。
概要と正確な取得コマンド (`openspec show <spec-id> --type spec)
--store platform-reqs`). An agent working in `api-server` は、
上流の支払い要件を引用し、その低レベルの設計を次のように記述します。
リポジトリ自体のルート — 誰もコンテキストを貼り付ける必要はありません。

リファレンスはそのクローン ソースを保持できるため、
保存しても、行き止まりではなく完全な修正が得られます。

```yaml
references:
  - { id: platform-reqs, remote: "git@github.com:acme/platform-reqs.git" }
```

**計画とコードを一緒に開きたい場合は、ワークセットを作成します。** これは
個人的かつ明示的: 各人が実際に作業するフォルダーを選択します
彼らのマシン上で。これらのローカル チェックアウト パスについては何もありません。
共有計画リポジトリにコミットします。

```bash
openspec workset create platform \
  --member ~/openspec/platform-reqs \
  --member ~/src/api-server \
  --member ~/src/web-app
```

## いつでも尋ねることができる 2 つの質問

**「セットアップは正常ですか?」** — `openspec doctor` は現在のルートを確認し、
参照ストアは読み取り専用で、検出結果ごとに貼り付け可能な修正が含まれています。

```
Doctor

Root
  Location: /Users/you/src/api-server
  OpenSpec root: ok

References
  - platform-reqs: ok (/Users/you/openspec/platform-reqs)
  - design-system: Referenced store 'design-system' is not registered on this machine.
    Fix: git clone -- git@github.com:acme/design-system.git '/Users/you/openspec/design-system' && openspec store register '/Users/you/openspec/design-system' --id design-system

```

**「何を使って作業しているのですか?」** — `openspec context` が作業を組み立てます
OpenSpec 宣言から設定: ルートとそれが参照するストア。

```
Working context for api-server (/Users/you/src/api-server)

OpenSpec root
  api-server  /Users/you/src/api-server

Referenced stores
  platform-reqs  /Users/you/openspec/platform-reqs
    Fetch: openspec show <spec-id> --type spec --store platform-reqs
```

どちらもエージェントの `--json` をサポートします。 `openspec context --code-workspace
<path>` はさらに、全体を含む VS Code ワークスペース ファイルを書き込みます。
set — このコマンドが実行する唯一の書き込み。

## ワークセット: 一緒に作業するフォルダーを再度開きます

上記のすべてとは別に: ほとんどの人は同じいくつかのフォルダーを開きます
すべてのセッション (計画リポジトリと 2 つまたは 3 つのコード リポジトリ) をまとめて実行します。
**ワークセット** は、まさにそれを示す個人的な名前付きビューであり、ワークセットを再度開いたものです。
選択したツールでコマンドを実行します。

```
  workset "platform"                 openspec workset open platform
  ├── team-plans   ~/openspec/team-plans         │
  ├── api-server   ~/src/api-server              ▼
  └── web-app      ~/src/web-app       all three open in your tool
```

```bash
openspec workset create platform \
  --member ~/openspec/team-plans --member ~/src/api-server \
  --tool code
openspec workset list
```

```
platform  (opens in VS Code)
  team-plans  /Users/you/openspec/team-plans
  api-server  /Users/you/src/api-server
```

次に、`openspec workset open platform` は保存されたツールであるエディターを起動します。
(VS コード、カーソル) すべてのメンバーで 1 つのウィンドウを開いて戻ります。最初
メンバーがメインです。 `--tool <id>` でいつでもツールをオーバーライドできます。

ワークセットは意図的に共有状態ではありません。彼らはあなたのマシン上に住んでいます、
決してコミットせず、作品について何の主張もせず、ただ記録するだけです
好きなものを一緒に開いてください。削除してもメンバーには影響しません
フォルダー。新しいツールはコードではなく構成です。
ワークスペース ファイルまたはフォルダーごとの添付フラグは、`openers` の下に追加できます。
グローバル設定のキー (`openspec config edit`)。

## コマンドがどこで動作するかを決定する方法

すべての通常のコマンドは、次の順序で同じ方法でルートを解決します。

```
1. --store <id>          you said so explicitly        → that store
2. nearest openspec/     a real planning root here     → this repo
   (walking up from cwd)
3. store: pointer        config.yaml declares a store  → that store
4. none of the above     stores registered on this     → error with a
                         machine?                        selection hint
                         no stores registered?         → the current
                                                          directory
                                                          (classic behavior)
```

`Using OpenSpec root:` ライン (および `root` 出力の `--json` ブロック)
あなたがどのケースに陥っているかを示します。

## 既知の制限事項

- **ベータ版。** このページの内容はすべて、リリースごとに変更される可能性があります -
名前、フラグ、ファイル形式、JSON キー。
- **マシンごとにストア ID ごとに 1 つのチェックアウト。** 2 番目のチェックアウトの登録
同じ ID での実行は失敗し、最初に `store unregister` へのヒントが表示されます。
- **設計により、同期は一切ありません。** OpenSpec はクローン、プル、プッシュを行いません。
古いチェックアウトでは、「あなたが」プルするまで、古い仕様が表示されます。参考文献は
ディスク上のあらゆるものからライブでインデックス付けされます。
- **空の計画フォルダーが存在しない場合があります。** 新しいストアには、
Git の `openspec/changes/`、`openspec/specs/`、または `openspec/changes/archive/`
まだ。それはベータ版の間は受け入れられます。これらのフォルダーは通常どおり表示されます
コマンドはそれらのファイルを作成します。
- **ポインター リポジトリはポインターのままです。** 構成専用リポジトリ。
`openspec/config.yaml` は、`store: <id>` が外部化されたものとして扱われることを宣言します
登録するためのストアのチェックアウトとしてではなく、計画として。最初に `store:` 行を削除します
そのリポジトリを意図的にローカル ストア ルートに変換したい場合。
- **一部のコマンドはそのまま残ります。** `view`、`templates`、`schemas`、
非推奨の名詞形式 (`openspec change show`, ...) は、
現在のディレクトリのみ - `--store` はありません。
- **マシンごとの状態はマシンごとです。** ストア レジストリとワークセット
はローカル設定です。マシンのレイアウトについては何も関係ありません
共有計画に常に取り組んでいます。
- **ワークセットには 2 つの起動スタイル**
ワークスペース ファイルまたはフォルダーごとの添付フラグをオープナーとして追加することはできません。
- **エージェント JSON には既知の大文字小文字の分割があります** (ストアファミリー キーは
スネークケース、ワークフロー ファミリ キャメルケース)。に文書化されています。
[エージェント契約](../agent-contract.md);統合は延期される
バージョン付きリリース。

## ファイルの保存場所

|何を |どこ |共有されていますか？ |
|---|---|---|
|ストアの企画 | `<store>/openspec/` (仕様、変更点) |はい — コミットしてプッシュします |
|ストアのアイデンティティ | `<store>/.openspec-store/store.yaml` |はい — ストアとコミットしています |
|ストアレジストリ | `<data dir>/openspec/stores/registry.yaml` |いいえ — このマシンのみ |
|ワークセット | `<data dir>/openspec/worksets/` |いいえ — このマシンのみ |

`<data dir>` は、macOS および Linux では `~/.local/share/openspec` (または
設定されている場合は `$XDG_DATA_HOME/openspec`)、オンの場合は `%LOCALAPPDATA%\openspec`
ウィンドウズ。

## 参照

このページのすべてのコマンドの正確なフラグと JSON 形状:
[CLI リファレンス](../cli.md) (ストア、ドクター、作業コンテキスト、個人)
ワークセット) と [エージェント契約](../agent-contract.md).
