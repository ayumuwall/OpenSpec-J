# 既存のプロジェクトで OpenSpec を使用する

**最初からコードベース全体を文書化する必要はありません。仕様は、変更しようとしているものについてのみ記述します。** これが、既存のプロジェクトに OpenSpec を採用する場合に知っておくべき最も重要な点であり、これが OpenSpec がブラウンフィールド ファーストで構築される理由です。

よくある心配は次のようなものです。「私のアプリは 80,000 行古いです。OpenSpec が役立つようになる前に、すべての仕様を書かなければなりませんか?」いいえ、あなたもそれは嫌でしょう、そして私たちもそうでしょう。 OpenSpec は、一度に 1 つの変更を加えることで仕様を拡張します。最初の変更でそのスライスが文書化され、次の変更でそのスライスが文書化され、数か月にわたって、実際に行う作業に基づいて仕様が自然に埋められていきます。

このガイドでは、海を沸騰させずに初日から始める方法を示します。

## 第 32 バージョン

```bash
$ cd your-existing-project
$ openspec init          # adds openspec/ and your AI tool's commands
```

次に、AI チャットで次のようにします。

```text
/opsx:explore            # optional: have the AI read the area you'll touch
/opsx:propose <a real, small change you actually need>
/opsx:apply
/opsx:archive
```

仕様には、変更が加えられたシステムの部分が正確に記述されており、それ以上の記述はありません。それは正しいです。残りの 80,000 行について心配するのは終わりです。

## なぜデルタファーストが重要なのか

OpenSpec の変更は **デルタ**: `ADDED`、`MODIFIED`、`REMOVED` として記述されます。デルタは、システム全体ではなく、現在の動作と比較して何が変更しているかを説明します。

これはまさにブラウンフィールド作業に必要なものです。何もないところから構築することはほとんどありません。フィールドを追加し、リダイレクトを修正し、タイムアウトを厳しくします。デルタを使用すると、最初にその周囲のすべてについて 40 ページにわたる仕様を作成しなくても、その 1 つの変更を正確に指定できます。

したがって、`openspec/specs/` ディレクトリは完全に開始されず、完全になります。ほぼ空から始まり、蓄積されます。アーカイブされた各変更は、そのデルタをマージします。`auth/` の仕様は、いくつかの認証変更を行った後にのみ完全なものになります。これは、まさに完全なものが必要な場合です。

さらに詳しい仕組みが必要な場合は、[コンセプト: 仕様差分](concepts.md#delta-specs)] を参照してください。

## 実際のコードベースでの最初の変更

小さくて本物のものを選びましょう。おもちゃでも書き直しでもない。とにかく今週行おうとしていた変更。最初は小さな変更を加えることで、リスクの低いワークフローを学ぶことができます。

**ステップ 1: AI に関連領域を読み取らせます。** ここで、`/opsx:explore` は、馴染みのないコードベースや大規模なコードベースで生き残ることができます。何かを提案する前に、これから触れようとしている部分にそれを向けて、物事がどのように機能するかをマッピングさせます。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: I need to add rate limiting to our public API, but I'm not sure
     how requests currently flow through the middleware.

AI:  Let me trace it... [reads the router, middleware stack, and config]
     Requests hit Express, pass through auth middleware, then your
     controllers. There's no rate-limiting layer today. The cleanest
     insertion point is a middleware right after auth. Want me to scope it?
```

AI が実際の構造を理解するようになったので、AI が作成する提案は汎用テンプレートではなくコードに適合することに注目してください。大規模なコードベースでは、この 1 つの習慣が最も手間を省きます。 [First](explore.md) を探索する] を参照してください。

**ステップ 2: 変更を提案します。** 提案とその仕様差分には、この変更だけが含まれています。

```text
You: /opsx:propose add-api-rate-limiting
```

**ステップ 3: `/opsx:apply` および `/opsx:archive` を使用してビルドしてアーカイブ**します。これは他の変更と同様です。アーカイブ後は、とにかく必要な変更から生まれた、レート制限動作の実際の仕様が得られます。

## ガイド付きツアーをご希望ですか?機内で使用する

独自のコードでループ全体が発生する様子をナレーション付きで確認したい場合は、拡張されたコマンド `/opsx:onboard` がまさにそれを実行します。コードベースをスキャンして小規模で安全な改善を行い、提案、構築、アーカイブするまでを手順を追って説明し、各ステップを説明します。

最初に拡張されたコマンドをオンにします。

```bash
$ openspec config profile      # select the expanded workflows
$ openspec update              # apply them to this project
```

次にチャットで:

```text
/opsx:onboard
```

It's the gentlest possible introduction on a real project, and it leaves you with a genuine (small) change you can keep or discard. See [Commands: `/opsx:onboard`](commands.md#opsxonboard).

## 「しかし、要件に関するドキュメントはすでにあります」

おそらく、PRD、SRS、正式な仕様、さらには TLA+ モデルをお持ちかもしれません。良い。卸売りもしないし、廃棄もしない。

既存のドキュメントを、変換する仕様としてではなく、**探索のためのソース資料**として扱います。変更を開始するときは、関連するセクションに AI を貼り付けるかポイントし、そこから焦点を当てた OpenSpec デルタを形成させます。デルタは、OpenSpec のテスト可能な要件とシナリオの形式で、現在変更している動作をキャプチャします。元のドキュメントは背景としてそのまま残ります。

正直な理由: OpenSpec の仕様は意図的に動作を優先しており、変更の対象となっています。 40 ページの PRD は、別の仕事を持つ別の成果物です。 1 回限りの一括変換を強制すると、誰も信頼できない大規模で古い仕様が生成される傾向があります。実際の変更に応じて仕様を拡張することで、仕様の正確さを維持します。

```text
You: /opsx:explore
You: Here's the section of our PRD about checkout. I'm implementing the
     "guest checkout" requirement next.
     [paste the relevant requirement]
AI:  [reads it, asks clarifying questions, then helps scope a change]
You: /opsx:propose add-guest-checkout
```

## 大きなコードベースでの仕様の整理

仕様は `openspec/specs/` の下にあり、**ドメイン** によってグループ化されています。これは、チームがシステムについてどのように考えているかに一致する論理領域です。分類法全体を事前に設計する必要はありません。その領域での最初の変更でドメイン フォルダーが必要になったときに、ドメイン フォルダーを作成します。

ドメインをスライスする一般的な方法:

- **機能分野別:** `auth/`、`payments/`、`search/`
- **コンポーネント別:** `api/`、`frontend/`、`workers/`
- **境界コンテキスト別:** `ordering/`、`fulfillment/`、`inventory/`

初心者がうなずくようなものを選んでください。後から絞り込むこともできます。 [コンセプト:仕様](concepts.md#specs)]を参照してください。

## モノリポジトリと複数のリポジトリにまたがる作業

モノリポジトリの場合、最も単純なモデルは、パッケージまたはサービスにマップされるドメインを持つリポジトリ ルートに 1 つの `openspec/` ディレクトリです。これでほとんどのチームがカバーされます。

作業が実際に **複数のリポジトリ** (または別個として扱う複数のパッケージ) にまたがる場合、OpenSpec にはベータ版の **ストア** 機能があります。プランニングはコード リポジトリのいずれかが参照できる独自のスタンドアロン リポジトリに存在するため、プランは 1 つのリポジトリの `openspec/` フォルダー内に存在する必要はありません。これはベータ版であるため、コマンドと状態は進化しているものとして扱います。メンタル モデルと最小の有用なパスについては、[Stores User Guide](stores-beta/user-guide.md)] から始めてください。

## 正直な注意点をいくつか

- **すべてを埋め戻したいという衝動を抑えてください。** 変更していないコードの仕様を書くことは生産的だと感じますが、通常はそうではありません。現実を追跡することを強制するものがないため、これらの仕様は陳腐化します。実際の変更を仕様に反映させましょう。
- **初期の変更は小さくしてください。** 最初のいくつかの変更は、出荷することと同じくらいリズムを学ぶことが重要です。スコープが狭いとループが速くなり、レッスン料金が安くなります。
- **`openspec/` を git にコミットします。** 仕様とアーカイブは、記述されているコードとともにバージョン管理に属します。
- **AI コンテキストを与えます。** 強力な規則を持つ大規模なコードベースでは、`openspec/config.yaml` または `context:` を入力して、すべての提案がスタックとパターンを尊重するようにします。 「カスタマイズ](customization.md#project-configuration)」を参照してください。

## 次にどこへ行くか

- [First](explore.md) を探索する - コードを変更する前に理解するための重要な習慣
- [はじめに](getting-started.md) - 最初の変更の完全なウォークスルー
- [変更の編集と反復](editing-changes.md) - 学びながら変更を調整する
- [コンセプト: Delta Specs](concepts.md#delta-specs) - デルタがブラウンフィールド作業をクリーンにする理由
- [Customization](customization.md) - OpenSpec にプロジェクトの規則を教える
