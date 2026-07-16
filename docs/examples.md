# 例とレシピ

実際の変更が、始まりから終わりまでどう進むかを示します。各レシピには、入力するコマンドと返ってくる内容を載せています。自分の状況に近いパターンを選んで使ってください。ここではデフォルトの **core** コマンド（`propose`、`explore`、`apply`、`sync`、`archive`）を使います。拡張セットが有効な場面は、その都度明記します。

先に確認しておきます。`/opsx:propose` のようなスラッシュコマンドは **AI アシスタントのチャット**に入力します。`openspec` コマンドは **ターミナル**で実行します。この区別に慣れていない場合は、先に [コマンドの仕組み](how-commands-work.md) を読んでください。以下の例では、`You:` と `AI:` はチャット、`$` で始まる行はターミナルを表します。

> **まだ何を作るべきか分からない場合:** 多くのレシピは、先に `/opsx:explore` で考えると明確になります。[レシピ 3](#recipe-3-exploring-before-you-commit) に例があります。より詳しくは [まずは探索する](explore.md) を参照してください。

## レシピ 1: 小さな機能を最短ルートで進める

**使う場面:** 何が必要か分かっていて、スコープも小さくまとまっている場合。最もよく使うパターンです。

流れは 3 コマンドです。提案、実装、アーカイブ。

```text
You: /opsx:propose add-logout-button

AI:  Created openspec/changes/add-logout-button/
     ✓ proposal.md — why and what
     ✓ specs/      — the new requirement and its scenarios
     ✓ design.md   — technical approach
     ✓ tasks.md    — implementation checklist
     Ready for implementation. Run /opsx:apply.
```

ここで計画を読みます。`proposal.md` と仕様差分を開いてください。OpenSpec の価値はこの時点にあります。400 行のコードが書かれた後ではなく、まだ短い計画の段階で前提の誤りを見つけられます。間違いがあれば、アーティファクトを直接編集してから続行します。

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

これで完了です。ログアウトの動作は仕様に取り込まれ、変更は完全な文脈ごとファイルとして残ります。

## レシピ 2: バグ修正

**使う場面:** 何かが壊れていて、謎のコミットではなく、意図した動作変更として修正を記録したい場合。

バグ修正も機能追加と同じ流れで進みます。違うのは、提案の書き方です。「バグを直す」だけではなく、*正しい動作* を説明します。

```text
You: /opsx:propose fix-login-redirect-loop

AI:  Created openspec/changes/fix-login-redirect-loop/
     The proposal captures the current broken behavior and the
     intended behavior. The delta spec MODIFIES the redirect
     requirement so it's now precise and testable.
     Ready for implementation.
```

修正は、新しいシナリオを伴う `MODIFIED` 要件として記録されます。そのため、次の担当者や次の AI セッションは、何を直したかだけでなく「正しい」とは何かを理解できます。あとは通常どおり `/opsx:apply` と `/opsx:archive` を実行します。

ヒント: バグ修正では、回帰テストとして読めるシナリオが有効です。たとえば「ログアウト済みユーザーが有効な認証情報を送信すると、ダッシュボードへ遷移し、再リダイレクトされない」のように書くと、実装の目標が明確になります。

## レシピ 3: コミットする前に探索する

**使う場面:** 問題はあるが、まだ計画がない場合。何を作るべきか、どのアプローチが正しいか分からないときです。

`/opsx:explore` から始めます。これは、まだ変更フォルダーも成果物も作らない思考パートナーです。コードベースを読み、判断を助けます。

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

探索すると、何かを変更する前に考えが整理されます。洞察が具体化したら提案へ進み、AI はその文脈を引き継ぎます。

## レシピ 4: 2 つの変更を並行して扱う

**使う場面:** ある機能の途中で、緊急の修正が割り込んだ場合。

変更は独立したフォルダーなので、別々の作業は自然に分離されます。修正を開始して出荷し、あとで元の機能に戻れます。

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

`/opsx:apply add-dark-mode` のように変更名を指定すると、複数の変更がアクティブなときでも AI に対象を明示できます。進捗は `tasks.md` のチェックボックスで追跡されるため、AI はどこから再開すればよいか分かります。

複数の変更をまとめて扱う場合、拡張コマンドの `/opsx:bulk-archive` を使うと、実装済みの内容を確認しながら一括でアーカイブし、仕様の競合も解決できます。詳しくは [ワークフロー](workflows.md#parallel-changes) を参照してください。

## レシピ 5: 動作を変えないリファクタリング

**使う場面:** コード構造を整理するが、外部から見える動作は変えない場合。

純粋なリファクタリングでは、仕様に追加する動作がありません。行動契約は変わらず、実装だけが変わります。そのため、作業の中心は設計とタスクになり、仕様差分は空または存在しないことがあります。

```text
You: /opsx:propose refactor-payment-module

AI:  Created the change. The proposal states the goal (split the
     payment module, no behavior change) and the design captures
     the new structure. No spec changes, since behavior is identical.
     Ready for implementation.
```

仕様に影響しない変更をアーカイブする場合は、ターミナルコマンドで仕様更新をスキップできます。

```bash
$ openspec archive refactor-payment-module --skip-specs
```

同じフラグは、ツール、CI、ドキュメントだけの変更にも便利です。原則は単純です。仕様は動作を記述するものなので、動作が変わらないなら仕様も変える必要はありません。詳しくは [コンセプト](concepts.md#what-a-spec-is-and-is-not) を参照してください。

## レシピ 6: 1 ステップずつ確認する（拡張コマンド）

**使う場面:** 複雑またはリスクの高い変更で、先に進む前に各アーティファクトを確認したい場合。

core の `/opsx:propose` は、計画成果物をまとめて下書きします。1 ステップずつ進めたい場合は、拡張コマンドを有効にします。

```bash
$ openspec config profile      # select the expanded workflows
$ openspec update              # apply them to this project
```

これで、段階的にひな形を作って進められます。

```text
You: /opsx:new add-2fa

AI:  Created openspec/changes/add-2fa/. Ready to create: proposal.

You: /opsx:continue

AI:  Created proposal.md. Now available: specs, design.

You: /opsx:continue

AI:  Created specs/auth/spec.md. Now available: design.
```

作成された各アーティファクトを確認し、必要なら編集し、納得したら次へ進みます。残りを一度に下書きしたい場合は、`/opsx:ff` で残りの計画成果物をまとめて作れます。アーカイブ前には、`/opsx:verify` で実装が仕様と一致しているか確認できます。詳しくは [ワークフロー](workflows.md#opsxff-vs-opsxcontinue) を参照してください。

## レシピ 7: ループ全体を実地で学ぶ

**使う場面:** OpenSpec をインストール済みで、おもちゃの例ではなく、自分のコードでワークフローを体験したい場合。

拡張コマンドを有効にして（レシピ 6 を参照）、次を実行します。

```text
You: /opsx:onboard

AI:  Welcome to OpenSpec! I'll walk you through a complete change
     using your actual codebase. Let me scan for a small, safe
     improvement we can make together...
```

`/opsx:onboard` は、実際の小さな改善を見つけ、変更を作成し、実装し、アーカイブするところまで案内します。15〜30 分ほどかかりますが、実際の変更が残ります。採用しても、破棄しても構いません。最も手触りのある学習方法です。詳しくは [コマンド](commands.md#opsxonboard) を参照してください。

## ターミナルから状態を確認する

状態はいつでもターミナルから確認できます。

```bash
$ openspec list                      # active changes
$ openspec show add-dark-mode        # one change in detail
$ openspec validate add-dark-mode    # check structure
$ openspec view                      # interactive dashboard
```

これらは読み取り・検査用のコマンドです。提案や実装は、引き続きチャット側のスラッシュコマンドで行います。詳しくは [CLI リファレンス](cli.md) を参照してください。

## 次に読むもの

- [まずは探索する](explore.md): 迷ったときの推奨スタート地点
- [ワークフロー](workflows.md): 上記のパターンと、それぞれをいつ使うか
- [コマンド](commands.md): すべてのスラッシュコマンドの詳細
- [はじめに](getting-started.md): 最初の変更のウォークスルー
- [コンセプト](concepts.md): 各要素がこの形になっている理由
