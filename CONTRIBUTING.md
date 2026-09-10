# コントリビューション

OpenSpec の改善へのご協力ありがとうございます。

## 1. 最初にディスカッションか Issue を作成する

小さな変更も含め、すべての変更はここから始めます。

- OpenSpec の基本設計に関わる場合は、[ディスカッションを開始](https://github.com/ayumuwall/OpenSpec-J/discussions)してください。
- バグやその他の変更は、[Issue を作成](https://github.com/ayumuwall/OpenSpec-J/issues)してください。

実装に時間をかける前に、進め方を合意するためです。関連 Issue や事前のディスカッションがない PR は、クローズされる場合があります。

## 2. 変更提案が必要か判断する

バグ修正、誤字修正、小さな改善は、そのまま PR を作成できます。

新機能、大規模なリファクタリング、OpenSpec のアーキテクチャを変える変更には、先に OpenSpec の変更提案が必要です。実装前に意図と目標を合意するため、`openspec/changes/<name>/` だけを含む PR を作成し、承認を待ってからコードを書いてください。

提案を書くときは、OpenSpec がさまざまなコーディングエージェント、モデル、用途で使われることを念頭に置いてください。幅広い利用者にとって適切に動作する変更を目指します。

判断に迷う場合は、手順 1 のディスカッションか Issue で相談してください。

## 3. 変更を実装する

Node 20.19 以降と pnpm が必要です。

```bash
pnpm install
pnpm build              # テストはビルド出力を使って実行します
pnpm test
pnpm exec tsc --noEmit
pnpm lint
```

CI もこの 4 つの検証コマンドを実行します。ローカルで成功することを確認してください。

利用者に影響する変更では `pnpm changeset` を実行し、生成されたファイルをコミットしてください。

## 4. PR を作成する

- 自分のフォークの `main` からブランチを作成します。
- タイトルは Conventional Commits の `type(scope): subject` 形式にします。例: `fix(archive): keep authored Purpose`。
- 手順 1 で作成した内容へリンクします。Issue は `Closes #123`、Issue がない場合はディスカッションへのリンクを記載します。
- コーディングエージェントがコードを書いた場合は、使用したエージェントとモデル、テスト済みであることを明記します。検証済みの AI 生成コードも歓迎します。

メンテナーは [MAINTAINERS.md](MAINTAINERS.md) に記載しています。
