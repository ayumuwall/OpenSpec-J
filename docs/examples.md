# 例とレシピ

本当の変更は、始まりから終わりまで。各レシピには、入力するコマンドと何が返されるかが示されているため、状況をパターンに合わせてコピーすることができます。これらは、デフォルトの **core** コマンド (`propose`、`explore`、`apply`、`sync`、`archive`) を使用します。拡張セットが役立つところは明記されています。

A reminder before you start: slash commands like `/opsx:propose` go in your **AI assistant's chat**, and `openspec` commands go in your **terminal**. If that's new, read [How Commands Work](how-commands-work.md) first. In the transcripts below, `You:` and `AI:` are the chat, and lines starting with `$` are the terminal.

> **何を構築しているのかまだわかりませんか?** これらのレシピのほとんどは、最初に `/opsx:explore` から始めてよく考えるとより明確になります。 [レシピ 3](#recipe-3-exploring-before-you-commit) は実際の動作を示しており、[Explore First](explore.md)] ガイドで完全なケースが説明されています。

## レシピ 1: 小さな機能、高速パス

**いつ使用するか:** 何が必要かはわかっており、それは含まれた作品です。これが最も一般的なレシピです。

すべては 3 つのコマンドです。提案、構築、アーカイブ。

```text
You: /opsx:propose add-logout-button

AI:  Created openspec/changes/add-logout-button/
     ✓ proposal.md — why and what
     ✓ specs/      — the new requirement and its scenarios
     ✓ design.md   — technical approach
     ✓ tasks.md    — implementation checklist
     Ready for implementation. Run /opsx:apply.
```

では、計画を読みましょう。プロポーザルと仕様差分を開きます。これは OpenSpec が構築された瞬間です。400 行のコードではなく、まだ 1 つの段落の間に間違った仮定を見つけることです。何かが間違っている場合は、アーティファクトを直接編集してから続行します。

```text
You: /opsx:apply

AI:  Working through tasks...
     ✓ 1.1 Add logout button to header
     ✓ 1.2 Clear session on click
     ✓ 1.3 Add confirmation dialog
     All tasks complete!

You: /opsx:archive

AI:  Archiving add-logout-button...
     ✓ Merged specs into openspec/specs/auth/spec.md
     ✓ Moved to openspec/changes/archive/2026-06-22-add-logout-button/
     Done. Ready for the next change.
```

それでおしまい。ログアウト動作は仕様の一部となり、変更は完全なコンテキストとともにファイルに保存されます。

## レシピ 2: バグ修正

**いつ使用するか:** 何かが壊れており、謎のコミットではなく、意図的な動作変更として修正を記録したい場合。

バグ修正は機能とまったく同じように機能します。違いは、提案の組み立て方にあります。単に「バグを修正する」だけでなく、*正しい*動作を説明します。

```text
You: /opsx:propose fix-login-redirect-loop

AI:  Created openspec/changes/fix-login-redirect-loop/
     The proposal captures the current broken behavior and the
     intended behavior. The delta spec MODIFIES the redirect
     requirement so it's now precise and testable.
     Ready for implementation.
```

修正は新しいシナリオの `MODIFIED` 要件として適用されるため、次の人 (または次の AI セッション) は、修正したことだけでなく、「正しい」の意味がわかります。次に、いつものように `/opsx:apply` と `/opsx:archive` を実行します。

ヒント: 修正するには、散文で回帰テストを行うのが良いシナリオです。 「ログアウトしたユーザーが有効な認証情報を送信すると、ダッシュボードに表示され、再度リダイレクトされません。」それを書くと、実装には明確な目標があります。

## レシピ 3: コミットする前に探索する

**いつ使用するか:** 問題はあるが、まだ計画が立てられていない場合。何を構築すればよいのか、どのアプローチが正しいのかわかりません。

`/opsx:explore` から始めます。それは、構造も作成された成果物も持たない思考パートナーです。コードベースを読み取り、決定を支援します。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: Page loads feel slow but I don't know where the time goes.

AI:  Let me look... I found three likely culprits:
     1. Large unoptimized images on the product list
     2. Synchronous data fetching that blocks render
     3. Re-renders triggered by context changes
     Which should we tackle first?

You: The data fetching one.

You: /opsx:propose optimize-product-list-fetching

AI:  Created the change, with a proposal informed by what we just
     found. Ready for implementation.
```

探索することで、何かを変える前に、自分の考えが明確になります。洞察が具体化したら提案し、AI がそのコンテキストを伝えます。

## レシピ 4: 2 つの変更を同時に操作する

**いつ使用するか:** 機能の途中であり、緊急の修正によりキューが優先されます。

変更は独立したフォルダーであるため、並行作業が競合することはありません。修正を開始して出荷し、中断したところから機能に戻ります。

```text
You: I'm partway through add-dark-mode, but I need to fix a login bug now.

You: /opsx:propose fix-login-redirect

AI:  Created openspec/changes/fix-login-redirect/. Ready for implementation.

You: /opsx:apply

AI:  Implemented the fix. All tasks complete.

You: /opsx:archive

AI:  ✓ Archived fix-login-redirect.

You: Back to dark mode.

You: /opsx:apply add-dark-mode

AI:  Resuming add-dark-mode. Picking up at task 2.3: Update Header...
```

`/opsx:apply add-dark-mode` での変更の名前付けは、複数の変更がアクティブな場合に AI に特定の変更を指示する方法です。タスクは `tasks.md` で完了を追跡するため、AI はどこで停止したかを正確に認識します。

複数の変更が一度に行われた場合、拡張された `/opsx:bulk-archive` はそれらをまとめてファイルし、実際に実装されている内容を確認することで仕様の競合を解決します。 [ワークフロー](workflows.md#parallel-changes)]を参照してください。

## レシピ 5: 動作を変更しないリファクタリング

**いつ使用するか:** コードを再構築しているため、外部から見える動作は同一のままである必要があります。

純粋なリファクタリングには*仕様に何も追加しない*ため、これは興味深いケースです。行動契約は変わりません。実装のみが行います。つまり、作業は設計とタスクの中に存在し、仕様デルタは空か存在しません。

```text
You: /opsx:propose refactor-payment-module

AI:  Created the change. The proposal states the goal (split the
     payment module, no behavior change) and the design captures
     the new structure. No spec changes, since behavior is identical.
     Ready for implementation.
```

仕様に影響を及ぼさない変更をアーカイブする場合は、端末コマンドに仕様ステップをスキップするように指示できます。

```bash
$ openspec archive refactor-payment-module --skip-specs
```

同じフラグは、ツール、CI、およびドキュメントのみの変更に便利です。原則: 仕様は動作を記述するため、動作が変わらない場合は仕様も変更すべきではありません。 [コンセプト](concepts.md#what-a-spec-is-and-is-not)]を参照してください。

## レシピ 6: ステップバイステップの制御 (拡張コマンド)

**いつ使用するか:** 先に進む前に各成果物を確認する必要がある、複雑または危険な変更。

コア `/opsx:propose` はすべてを一度にドラフトします。一度に 1 ステップずつ進めたい場合は、拡張コマンドをオンにします。

```bash
$ openspec config profile      # select the expanded workflows
$ openspec update              # apply them to this project
```

これで、段階的にスキャフォールディングして構築できるようになりました。

```text
You: /opsx:new add-2fa

AI:  Created openspec/changes/add-2fa/. Ready to create: proposal.

You: /opsx:continue

AI:  Created proposal.md. Now available: specs, design.

You: /opsx:continue

AI:  Created specs/auth/spec.md. Now available: design.
```

着地した各アーティファクトを確認し、自由に編集し、満足したら続行します。残りを一度にドラフトしたい場合は、`/opsx:ff` を使用して残りの計画成果物を早送りします。アーカイブする前に、`/opsx:verify` は実装が実際に仕様と一致しているかどうかをチェックします。 [ワークフロー](workflows.md#opsxff-vs-opsxcontinue)]を参照してください。

## レシピ 7: ループ全体を実践的に学習する

**いつ使用するか:** OpenSpec をインストールしており、おもちゃのサンプルではなく、独自のコードでワークフローを *感じたい* と考えています。

拡張コマンドをオンにして (レシピ 6 を参照)、次の操作を行います。

```text
You: /opsx:onboard

AI:  Welcome to OpenSpec! I'll walk you through a complete change
     using your actual codebase. Let me scan for a small, safe
     improvement we can make together...
```

`/opsx:onboard` は、実際の (小さな) 改善を見つけ、変更を作成し、実装し、アーカイブし、すべてのステップを説明します。 15 ～ 30 分かかりますが、実際に変更が得られるので、保持することも破棄することもできます。それが最も優しい学習方法です。 「コマンド](commands.md#opsxonboard)」を参照してください。

## ターミナルから作業内容を確認する

いつでも端末から状態を検査できます。

```bash
$ openspec list                      # active changes
$ openspec show add-dark-mode        # one change in detail
$ openspec validate add-dark-mode    # check structure
$ openspec view                      # interactive dashboard
```

これらは読み取りおよび検査ツールです。提案と構築は依然としてチャットのスラッシュ コマンドによって行われます。詳細については、[CLI リファレンス](cli.md).

## 次にどこへ行くか

- [Explore First](explore.md): 迷ったときに始めるための推奨方法
- [ワークフロー](workflows.md): 上記のパターンと、それぞれをいつ使用するかに関する決定ガイダンス付き
- [コマンド](commands.md): すべてのスラッシュコマンドの詳細
- [はじめに](getting-started.md): 正規の最初の変更のウォークスルー
- [Concepts](concepts.md): なぜ各ピースがこのように組み合わされるのか
