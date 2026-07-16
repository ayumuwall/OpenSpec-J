# まずは探索してみよう

**`/opsx:explore` はあなたの思考パートナーです。問題はあるが計画がまだないときはいつでも、このツールに手を伸ばしてください。** 単一のアーティファクトまたはコード行が作成される前に、コードベースを調査し、オプションを比較検討し、実際に何が必要かを明確にします。画像が鮮明になったら、`/opsx:propose` にハンドオフします。

これらのドキュメントから習慣を 1 つ取り入れるなら、次の習慣を取り入れてください。**確信が持てない場合は、提案する前に調べてください**。

それが重要な理由は次のとおりです。 AIコーディングアシスタントは熱心です。漠然と質問すると、彼らは自信を持って *何か* を構築しますが、おそらくあなたが必要としていたものではないかもしれません。探索することが治療法です。これは、あなたと AI が一緒に正しい行動を見つけ出す、賭けのない会話です。そのため、あなたが提案する頃には、あなたは正しいことを提案していることになります。

## いつ探索するか

探索は、人々が予想しているよりも多くの場合、適切な最初のステップです。次のいずれかに該当する場合に使用します。

- *問題*はわかっていますが、*解決策*はわかっていません。 (「ページが遅いと感じる。」「認証がめちゃくちゃだ。」「重複した注文が何度も届く。」)
- どちらかのアプローチを選択しており、実際のコードとのトレードオフを検討したいと考えています。
- コードベースを初めて使用するため、変更する前に何かがどのように機能するかを理解する必要があります。
- 要件があいまいで、コミットする前に明確にしておきたい。
- 仕事が見た目より大きいか小さいのではないかと疑っており、正直に調査したいと考えています。

Skip explore only when you already know exactly what you want and how. In that case go straight to [`/opsx:propose`](commands.md#opsxpropose).

## 機能 (および機能しない)

Explore は**会話**であり、ジェネレーターではありません。

**それは次のとおりです:**
- コードベースを読んで検索して、実際の質問に答えます。
- オプションを比較し、それぞれのトレードオフに名前を付けます。
- デザインを読みやすくするために図を描きます。
- 漠然としたアイデアを具体的で構築可能な範囲に絞り込むのに役立ちます。
- 準備ができたら、`/opsx:propose` に移行します。

**そうではありません:**
- 変更フォルダーを作成します。
- 成果物をすべて書きます (提案、仕様、設計、またはタスクは含まれません)。
- コードを作成または変更します。

それがポイントです。探索には費用もかからず、何もする必要もありません。 3 つの行き止まりを探索し、それぞれから何かを学び、それから初めて生き残る道を提案することができます。

## すでにインストールされています

朗報: `/opsx:explore` は、`propose`、`apply`、`sync`、`archive` と並んで、デフォルトの **core** プロファイルで出荷されます。何も有効にする必要はありません。プロジェクトで OpenSpec が設定されている場合、AI チャットで Explore を使用できるようになります。 (すべての `/opsx:*` コマンドと同様、ターミナルではなくアシスタントのチャットに入力します。[コマンドの仕組み](how-commands-work.md)] を参照してください。)

## 完全な例

漠然とした不安が、どのようにして鋭い、構築可能な変更に変わっていくのかを見てみましょう。

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

何が起こったかに注目してください。出発点は「何かがおかしい、触るのが怖い」でした。 20 秒間の探索により、名前付きの根本原因、ランク付けされた 3 つのオプション、既存のコードに関連付けられた推奨事項、および正確な変更が明らかになりました。思考が最初に起こったので、その後の提案は鋭いです。

## プロポーズの引き継ぎ

Explore は何にもアーカイブされません。準備ができたら、変更を開始するだけで、AI が会話のコンテキストを成果物に反映します。

```text
explore  ──►  propose  ──►  apply  ──►  archive
 (think)     (agree)       (build)     (record)
```

わかりやすい言葉 (「これを変更に変えましょう」) で言うことも、`/opsx:propose <name>` を直接実行することもできます。いずれにせよ、今行った検討は、使い捨てのおしゃべりではなく、提案の基礎となります。

拡張されたコマンド セットを使用する場合、Explorer は代わりに `/opsx:new` に引き渡して、段階的にアーティファクトを作成できます。 [ワークフロー](workflows.md)]を参照してください。

## 良い探索のためのヒント

- **解決策ではなく、問題を提示してください。** 「ログインが遅いと感じる」ということは、AI に調査の余地を与えます。 「Redis キャッシュの追加」では、まだテストしていない回答が事前に約束されます。
- **トレードオフについて大声で尋ねます。** 「各オプションの欠点は何ですか?」より正直な比較が可能になります。
- **最初に読んでみましょう。** 最良の探索は、AI が推測ではなく実際にコードを調べることから始まります。役立つ場合は、関連する領域を指し示してください。
- **保釈しても問題ありません。** 探索の結果、そのアイデアに価値がないことが判明した場合、それは勝ちです。安く学べたんですね。
- **変更の途中でもう一度探索してください。** `/opsx:apply` 中にスタックしましたか?一歩下がってサブ問題を調査してから戻ることができます。

## 正直なトレードオフ

**得られるもの:** 探索は、アーティファクトが存在する前に、可能な限り低コストの瞬間に間違ったターンをキャッチします。これは、なじみのないコードで特に強力であり、システムを読み取って要約する AI の機能により、午後の探検に費やすことがなくなります。

**費用:** 少しの忍耐。探索は会話なので、`/opsx:propose` を発射して期待するよりも時間がかかります。すでに完全に理解している作業の場合、その追加の手順は純粋なオーバーヘッドであるため、スキップする必要があります。

経験則: タスクが曖昧であればあるほど、探索の成果は高くなります。タスクが明確であればあるほど、すぐに提案に進むことができます。

## 次にどこへ行くか

- [Commands: `/opsx:explore`](commands.md#opsxexplore): the precise reference
- [Workflows](workflows.md): 日常のループの一部として探索します。
- [例とレシピ](examples.md#recipe-3-exploring-before-you-commit): 完全なウォークスルーで探索する
- [入門](getting-started.md): 最初の変更ガイド、探索が含まれています
