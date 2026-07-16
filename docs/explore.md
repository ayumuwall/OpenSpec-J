# まずは探索する

**`/opsx:explore` は、計画を作る前に使う思考パートナーです。問題はあるが、まだ計画がないときに使います。** アーティファクトやコードを作る前に、コードベースを調べ、選択肢を比較し、本当に必要な変更を明確にします。方向性が見えたら `/opsx:propose` に引き継ぎます。

このドキュメントから 1 つだけ習慣を持ち帰るなら、これです。**確信がないなら、提案する前に探索する。**

理由は単純です。AI コーディングアシスタントは前のめりです。曖昧に頼むと、自信を持って *何か* を作りますが、それが必要なものとは限りません。探索は、その前に行う低コストな会話です。あなたと AI が一緒に正しい方向を見つけるための、安全な下調べです。

## いつ探索するか

探索は、多くの場合で最初の一手になります。次のようなときに使ってください。

- *問題* は分かっているが、*解決策* はまだ分からない（例:「ページが遅い」「認証まわりが複雑」「重複注文が発生する」）。
- 複数のアプローチがあり、実際のコードに照らしてトレードオフを見たい。
- 初めて触るコードベースで、変更前に仕組みを理解したい。
- 要件が曖昧で、作業に入る前に明確にしたい。
- 見た目より大きい、または小さい作業かもしれないので、正直に見積もりたい。

何をどう作るかがすでに明確な場合だけ、探索を省略して [`/opsx:propose`](commands.md#opsxpropose) に進んでください。

## 何をするか、何をしないか

Explore は**会話**であり、生成コマンドではありません。

**Explore がすること:**

- コードベースを読み、検索し、具体的な疑問に答える。
- 選択肢を比較し、それぞれのトレードオフを明確にする。
- 必要なら設計を理解しやすくする図を描く。
- 曖昧なアイデアを、実装可能なスコープへ絞り込む。
- 準備ができたら `/opsx:propose` へつなぐ。

**Explore がしないこと:**

- 変更フォルダーを作成する。
- 提案、仕様、設計、タスクなどのアーティファクトを作る。
- コードを作成・変更する。

そこが重要です。探索は安く、後戻りも簡単です。3 つの行き止まりを試し、それぞれから学んでから、生き残った選択肢だけを提案にできます。

## すでにインストールされています

`/opsx:explore` は、`propose`、`apply`、`sync`、`archive` と同じく、デフォルトの **core** プロファイルに含まれます。追加で有効化する必要はありません。プロジェクトで OpenSpec をセットアップ済みなら、AI チャットで Explore を使えます。ほかの `/opsx:*` コマンドと同じく、ターミナルではなく AI アシスタントのチャットに入力します。詳しくは [コマンドの仕組み](how-commands-work.md) を参照してください。

## 例

曖昧な不安が、どう実装可能な変更へ変わるかを見てみます。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: Our checkout sometimes creates duplicate orders. I don't know why
     and I don't know how to fix it safely.

AI:  Let me dig into the checkout path...
     [reads the order service, the payment webhook handler, and the
      client submit logic]

     Here's what I found. There are two ways a duplicate can happen:

     1. The client can submit twice (double-click, retry on slow network).
        Nothing debounces it.
     2. The payment webhook can fire more than once, and the handler
        creates an order each time. There's no idempotency key.

     Cause #2 is the dangerous one: it can charge and fulfill twice.

     Three ways to fix it, roughly in order of robustness:
     - Idempotency key on the order-creation endpoint (handles both causes)
     - Dedup on the webhook by payment-intent id (handles #2 only)
     - Client-side debounce (handles #1 only, papers over the real bug)

     Given your code already stores the payment-intent id, the
     idempotency-key approach is a small change with the biggest payoff.
     Want me to scope that?

You: Yes, let's do the idempotency key.

You: /opsx:propose add-order-idempotency-key

AI:  Created openspec/changes/add-order-idempotency-key/, with a proposal
     and delta spec grounded in what we just found. Ready for implementation.
```

出発点は「何かがおかしいが、触るのが怖い」でした。短い探索で、根本原因、優先順位付きの選択肢、既存コードに基づく推奨案、具体的な変更スコープが見えました。先に考えたからこそ、その後の提案が鋭くなります。

## 提案への引き継ぎ

Explore 自体は何もアーカイブしません。準備ができたら変更を開始します。AI は探索中の会話を文脈として使い、アーティファクトに反映します。

```text
explore  ──►  propose  ──►  apply  ──►  archive
 (think)     (agree)       (build)     (record)
```

「これを変更にしましょう」と自然文で言っても、`/opsx:propose <name>` を直接実行しても構いません。どちらの場合も、探索で得た検討内容は使い捨ての雑談ではなく、提案の土台になります。

拡張コマンドセットを使っている場合は、`/opsx:new` に引き継いで段階的にアーティファクトを作ることもできます。詳しくは [ワークフロー](workflows.md) を参照してください。

## 良い探索のコツ

- **解決策ではなく、問題を提示します。** 「ログインが遅い気がする」は調査の余地を与えます。「Redis キャッシュを追加して」は、まだ検証していない答えを先に決めてしまいます。
- **トレードオフを明示的に聞きます。** 「各案の欠点は？」と聞くと、比較が現実的になります。
- **まず読ませます。** 良い探索は、AI が推測ではなく実際のコードを読むところから始まります。必要なら関連する領域を示してください。
- **やめても構いません。** 探索の結果、アイデアに価値がないと分かるなら、それは成果です。安く学べています。
- **変更の途中でも使えます。** `/opsx:apply` 中に詰まったら、一歩戻ってサブ問題を探索してから再開できます。

## 正直なトレードオフ

**得られるもの:** 探索は、アーティファクトが存在する前の最も安いタイミングで、方向違いを見つけます。慣れていないコードでは特に効果があります。AI に読ませて要約させることで、午後いっぱいの調査を避けられることがあります。

**コスト:** 少し時間がかかります。Explore は会話なので、すぐ `/opsx:propose` するより遅いです。すでに完全に理解している作業なら、その一手は純粋なオーバーヘッドです。その場合は省略してください。

目安は単純です。曖昧な作業ほど探索の効果は大きく、明確な作業ほどすぐ提案に進めます。

## 次に読むもの

- [Commands: `/opsx:explore`](commands.md#opsxexplore): 正確なコマンドリファレンス
- [ワークフロー](workflows.md): 日常のループの中で探索を使う方法
- [例とレシピ](examples.md#recipe-3-exploring-before-you-commit): 探索を使う完全なウォークスルー
- [はじめに](getting-started.md): 探索を含む最初の変更ガイド
