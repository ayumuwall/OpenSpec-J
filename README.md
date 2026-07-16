<p align="center">
  <a href="https://github.com/Fission-AI/OpenSpec">
    <picture>
      <source srcset="assets/openspec_bg.png">
      <img src="assets/openspec_bg.png" alt="OpenSpec logo">
    </picture>
  </a>
</p>

<p align="center">
<a href="https://github.com/Fission-AI/OpenSpec/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Fission-AI/OpenSpec/actions/workflows/ci.yml/badge.svg" /></a>
<a href="https://www.npmjs.com/package/@ayumuwall/openspec"><img alt="npm version" src="https://img.shields.io/npm/v/@ayumuwall/openspec?style=flat-square" /></a>
<a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
<a href="https://discord.gg/YctCnvvshC"><img alt="Discord" src="https://img.shields.io/discord/1411657095639601154?style=flat-square&logo=discord&logoColor=white&label=Discord&suffix=%20online" /></a>
</p>

> [!NOTE]
> このリポジトリは、Fission-AI/OpenSpec をベースにした日本語ローカライズ版（[OpenSpec-J](https://github.com/ayumuwall/OpenSpec-J)）です。仕様と構成は本家を尊重しつつ、日本語利用者向けにドキュメントとメッセージを最適化しています。**現在の同期元は OpenSpec v1.6.0 です。**<br>
> 生成物だけ日本語にできれば十分な場合は、本家版の [Multi-Language](docs/multi-language.md) を利用できます。

<details>
<summary><strong>最も愛されている仕様フレームワーク。</strong></summary>

[![Stars](https://img.shields.io/github/stars/Fission-AI/OpenSpec?style=flat-square&label=Stars)](https://github.com/Fission-AI/OpenSpec/stargazers)
[![Downloads](https://img.shields.io/npm/dm/@ayumuwall/openspec?style=flat-square&label=Downloads/mo)](https://www.npmjs.com/package/@ayumuwall/openspec)
[![Contributors](https://img.shields.io/github/contributors/Fission-AI/OpenSpec?style=flat-square&label=Contributors)](https://github.com/Fission-AI/OpenSpec/graphs/contributors)

</details>
<p></p>
私たちの哲学:

```text
→ fluid not rigid
→ iterative not waterfall
→ easy not complex
→ built for brownfield not just greenfield
→ scalable from personal projects to enterprises
```

> [!ヒント]
> **新しいワークフローが利用可能になりました!** 新しいアーティファクトに基づいたワークフローを使用して OpenSpec を再構築しました。
>
> `/opsx:propose "your idea"` を実行して開始します。 → 【詳しくはこちら](docs/opsx.md)

<p align="center">
最新情報については、<a href="https://x.com/0xTab">@0xTab on X</a> をフォローしてください。ヘルプや質問については、<a href="https://discord.gg/YctCnvvshC">OpenSpec Discord</a> に参加してください。
</p>

<!-- TODO: Add GIF demo of /opsx:propose → /opsx:archive workflow -->

## 実際の動作を確認してください

```text
You: /opsx:explore
AI:  What would you like to explore?
You: I want dark mode but I'm not sure how to do it cleanly.
AI:  Let me look at your styling setup...
     Cleanest path here: CSS variables + a small theme context,
     with system-preference detection. No new dependencies. Scope it?
You: Yes, let's do it.

You: /opsx:propose add-dark-mode
AI:  Created openspec/changes/add-dark-mode/
     ✓ proposal.md — why we're doing this, what's changing
     ✓ specs/       — requirements and scenarios
     ✓ design.md    — technical approach
     ✓ tasks.md     — implementation checklist
     Ready for implementation!

You: /opsx:apply
AI:  Implementing tasks...
     ✓ 1.1 Add theme context provider
     ✓ 1.2 Create toggle component
     ✓ 2.1 Add CSS variables
     ✓ 2.2 Wire up localStorage
     All tasks complete!

You: /opsx:archive
AI:  Archived to openspec/changes/archive/2025-01-23-add-dark-mode/
     Specs updated. Ready for the next feature.
```

<details>
<summary><strong>OpenSpec ダッシュボード</strong></summary>

<p align="center">
  <img src="assets/openspec_dashboard.png" alt="OpenSpec dashboard preview" width="90%">
</p>

</details>

## チームが OpenSpec を採用する理由

Solo、OpenSpec は、単一のリポジトリ上でユーザーと AI を正直に保ちます。チームでは、難しい部分が動きます。機能は API サーバー、Web アプリ、共有ライブラリにまたがります。要件は 1 つのチームによって所有され、他のチームによって使用されます。計画はコードが存在する前から始まります。

**[Stores](docs/stores-beta/user-guide.md)** が答えです - 独自のリポジトリで計画しています。すでにご存知の `openspec/` の形状 (仕様と変更点) は、他のものと同様に `git push` でも共有されます。すべてのリポジトリにわたって、チーム全体とすべてのコーディング エージェントが読むことができる 1 つの信頼できる情報源。

- **クロスリポジトリ機能** — コードが 3 つのリポジトリにある場合でも、1 つの変更、1 つの計画。
- **共有要件** — プラットフォーム チームが仕様を所有します。製品チームは、コーディング エージェントがそれらを読み取ることができる場所で、それらを読み取り専用で参照します。ドリフトwikiはありません。
- **コードの前に計画を立てる** — 今すぐストアに計画を取り込みます。コード リポジトリは後で追いつきます。

> ストアは **ベータ版** です。 [Stores User Guide](docs/stores-beta/user-guide.md)] から始めてください。

## クイックスタート

**Node.js 20.19.0 以降が必要です。**

OpenSpec をグローバルにインストールします。

```bash
npm install -g @ayumuwall/openspec@latest
```

次に、プロジェクト ディレクトリに移動して初期化します。

```bash
cd your-project
openspec init
```

次に AI に話しかけます。

- **Not sure what to build yet?** Start with `/opsx:explore`, a no-stakes thinking partner that reads your code, weighs options, and shapes a plan before anything is written. ([Explore guide](docs/explore.md))
- **欲しいものはもう決まっていますか?** `/opsx:propose <what-you-want-to-build>` に直接アクセスしてください。

どちらもデフォルトのプロファイルに含まれています。拡張ワークフロー（`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:bulk-archive`、`/opsx:onboard`）が必要な場合は、`openspec config profile`で選択し、`openspec update`で適用します。

> [!NOTE]
> 使用しているツールがサポートされているかどうか不明ですか? [完全なリストを表示](docs/supported-tools.md) – 私たちは 25 以上のツールをサポートしており、さらに増え続けています。
>
> pnpm、yarn、bun、nix でも動作します。 [インストールオプション](docs/installation.md)を参照してください。

## ドキュメント

**ここから始めてください:** **[Documentation Home](docs/README.md)**] はすべてをマップします。 OpenSpec は初めてですか? [はじめに](docs/getting-started.md)]を読んでから、[コマンドの仕組み](docs/how-commands-work.md) (実際に`/opsx:propose`と入力するところ)]を読んでください。

→ **[はじめに](docs/getting-started.md)**: 最初のステップ<br>
→ **[Explore First](docs/explore.md)**: コミットする前に `/opsx:explore` でよく考えてください<br>
→ **[コマンドの仕組み](docs/how-commands-work.md)**: スラッシュ コマンドが実行される場所と CLI が異なる場所<br>
→ **[コアコンセプトの概要](docs/overview.md)**: メンタルモデル全体、1 ページ<br>
→ **[例とレシピ](docs/examples.md)**: 実際の変更の開始から終了まで<br>
→ **[ワークフロー](docs/workflows.md)**: コンボとパターン<br>
→ **[既存のプロジェクト](docs/existing-projects.md)**: ブラウンフィールド コードベースで OpenSpec を採用<br>
→ **[Change](docs/editing-changes.md) の編集**: 成果物を更新し、戻って、手動編集を調整します<br>
→ **[Commands](docs/commands.md)**: スラッシュコマンドとスキル<br>
→ **[CLI](docs/cli.md)**: 端末リファレンス<br>
→ **[Stores](docs/stores-beta/user-guide.md)**: 別のリポジトリで計画し、チーム全体で共有します (ベータ版)<br>
→ **[サポートされているツール](docs/supported-tools.md)**: ツールの統合とインストール パス<br>
→ **[Concepts](docs/concepts.md)**: すべてがどのように適合するか<br>
→ **[多言語](docs/multi-language.md)**: 多言語サポート<br>
→ **[カスタマイズ](docs/customization.md)**: 自分のものにしましょう<br>
→ **[FAQ](docs/faq.md)** · **[トラブルシューティング](docs/troubleshooting.md)** · **[用語集](docs/glossary.md)**]: クイックヘルプ


## コミュニティスキーマ

スタンドアロン リポジトリ経由で配布されるサードパーティ スキーマ バンドル - これらは、[github/spec-kit のコミュニティ拡張カタログ ](https://github.com/github/spec-kit/tree/main/extensions) がツール統合を処理する方法と同様に、OpenSpec を他のツールと統合する独自のワークフローを提供します。

→ **[カスタマイズ ドキュメントのカタログ](docs/customization.md#community-schemas)**を参照してください。


## なぜ OpenSpec を使うのか?

AI コーディング アシスタントは強力ですが、要件がチャット履歴にのみ存在する場合は予測できません。 OpenSpec は軽量仕様レイヤーを追加するため、コードを記述する前に何を構築するかについて合意できます。

- **構築する前に同意します** — コードを作成する前に人間と AI が仕様を調整します
- **整理整頓** — 変更ごとに、提案、仕様、設計、タスクを含む独自のフォルダーが作成されます。
- **流動的に作業** — 厳格なフェーズ ゲートを使用せず、いつでもアーティファクトを更新できます
- **ツールを使用** — スラッシュ コマンドを使用して 30 以上の AI アシスタントと連携します

### 比較方法

**vs. [Spec Kit](https://github.com/github/spec-kit)** (GitHub) — 徹底的だが重量級。厳格なフェーズ ゲート、大量の Markdown、Python セットアップ。 OpenSpec は軽量で、自由に反復できます。

**vs. [Kiro](https://kiro.dev)** (AWS) — 強力ですが、IDE にロックされており、Claude モデルに限定されています。 OpenSpec は、すでに使用しているツールと連携して動作します。

**vs.何もない** — 仕様のない AI コーディングは、曖昧なプロンプトと予測不可能な結果を​​意味します。 OpenSpec は、形式的な手順を行わずに予測可能性をもたらします。

## OpenSpec の更新

**パッケージをアップグレードします**

```bash
npm install -g @ayumuwall/openspec@latest
```

**エージェントの指示を更新します**

各プロジェクト内でこれを実行して AI ガイダンスを再生成し、最新のスラッシュ コマンドがアクティブであることを確認します。

```bash
openspec update
```

## 使用上の注意

**モデルの選択**: OpenSpec は高度な推論モデルで最もよく機能します。計画と実装の両方に Codex 5.5 と Opus 4.7 をお勧めします。

**コンテキストの衛生管理**: OpenSpec は、クリーンなコンテキスト ウィンドウから恩恵を受けます。実装を開始する前にコンテキストをクリアし、セッション全体を通じてコン​​テキストの健全性を維持します。

## 貢献する

**小さな修正** — バグ修正、タイプミスの修正、および軽微な改善は PR として直接送信できます。

**大規模な変更** — 新機能、重要なリファクタリング、またはアーキテクチャの変更については、実装を開始する前に意図と目標を調整できるよう、まず OpenSpec の変更提案を提出してください。

提案書を作成するときは、OpenSpec の哲学を念頭に置いてください。つまり、私たちはさまざまなコーディング エージェント、モデル、ユース ケースにわたるさまざまなユーザーにサービスを提供しています。変更は誰にとってもうまくいくはずです。

**AI によって生成されたコードは歓迎されます** - テストと検証が行われている限り。 AI によって生成されたコードを含む PR には、使用されたコーディング エージェントとモデルについて言及する必要があります (例: 「claude-opus-4-5-20251101 を使用してクロード コードで生成」)。

### 開発

- 依存関係のインストール: `pnpm install`
- ビルド: `pnpm run build`
- テスト: `pnpm test`
- CLI をローカルで開発: `pnpm run dev` または `pnpm run dev:cli`
- 従来のコミット (1 行): `type(scope): subject`

## 他の

<details>
<summary><strong>テレメトリー</strong></summary>

OpenSpec は匿名の使用状況統計を収集します。

使用パターンを理解するために、コマンド名とバージョンのみを収集します。引数、パス、コンテンツ、PII はありません。 CI では自動的に無効になります。

**オプトアウト:** `export OPENSPEC_TELEMETRY=0` または `export DO_NOT_TRACK=1`

</details>

<details>
<summary><strong>メンテナとアドバイザー</strong></summary>

プロジェクトの指導を支援するコアメンテナーとアドバイザーのリストについては、[MAINTAINERS.md](MAINTAINERS.md)] を参照してください。

</details>



## ライセンス

MIT
