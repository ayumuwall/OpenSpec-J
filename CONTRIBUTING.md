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

### CLI の起動速度を保つ

エディター、エージェント、OpenSpec Desktop は CLI を何度も実行します。コマンドの実行前に読み込むモジュールが多いほど、毎回の起動に時間がかかります。従来の `openspec --version` は485個のモジュールを読み込み、Windows のある環境では約0.5秒かかっていました。各コマンドは、定義と自身の実装だけを読み込むようにします。

- **定義**（名前、オプション、ヘルプ）は `src/cli/index.ts` または `src/cli/commands/<name>.ts` に置きます。zod、yaml、fast-glob、ora などの重い依存や、他のコマンドの実装を読み込まないでください。
- **コマンドの実装**は `src/commands/<name>.ts` または `src/core/` に置き、アクション内で `await import()` を使って読み込みます。

`test/cli-e2e/startup-modules.test.ts` は各コマンドが読み込むモジュールを確認し、定義が実装を読み込むと失敗します。コマンドを追加した場合は、このテストの一覧にも追加してください。

## 4. PR を作成する

- 自分のフォークの `main` からブランチを作成します。
- タイトルは Conventional Commits の `type(scope): subject` 形式にします。例: `fix(archive): keep authored Purpose`。
- 手順 1 で作成した内容へリンクします。Issue は `Closes #123`、Issue がない場合はディスカッションへのリンクを記載します。
- コーディングエージェントがコードを書いた場合は、使用したエージェントとモデル、テスト済みであることを明記します。検証済みの AI 生成コードも歓迎します。

メンテナーは [MAINTAINERS.md](MAINTAINERS.md) に記載しています。
