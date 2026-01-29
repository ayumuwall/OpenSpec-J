<p align="center">
  <a href="https://github.com/Fission-AI/OpenSpec">
    <picture>
      <source srcset="assets/openspec_bg.png">
      <img src="assets/openspec_bg.png" alt="OpenSpec ロゴ">
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://github.com/ayumuwall/OpenSpec-J/actions/workflows/ci.yml?query=branch%3Aja-docs"><img alt="CI" src="https://github.com/ayumuwall/OpenSpec-J/actions/workflows/ci.yml/badge.svg?branch=ja-docs" /></a>
  <a href="https://www.npmjs.com/package/@ayumuwall/openspec"><img alt="npm バージョン" src="https://img.shields.io/npm/v/@ayumuwall/openspec?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="ライセンス: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="https://discord.gg/YctCnvvshC"><img alt="Discord" src="https://img.shields.io/discord/1411657095639601154?style=flat-square&logo=discord&logoColor=white&label=Discord&suffix=%20online" /></a>
</p>

<!-- OPENSPEC-J:NOTE-START repo-context -->
このリポジトリは、[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) をベースにした日本語ローカライズ版（OpenSpec-J）です。仕様と構成は本家を尊重しつつ、日本語利用者向けにドキュメントとメッセージを最適化しています。**現在の同期元は OpenSpec v1.0.2 です。**
<!-- OPENSPEC-J:NOTE-END repo-context -->

<details>
<summary><strong>最も愛される仕様フレームワーク。</strong></summary>

[![Stars](https://img.shields.io/github/stars/Fission-AI/OpenSpec?style=flat-square&label=Stars)](https://github.com/Fission-AI/OpenSpec/stargazers)
[![Downloads](https://img.shields.io/npm/dm/@fission-ai/openspec?style=flat-square&label=Downloads/mo)](https://www.npmjs.com/package/@fission-ai/openspec)
[![Contributors](https://img.shields.io/github/contributors/Fission-AI/OpenSpec?style=flat-square&label=Contributors)](https://github.com/Fission-AI/OpenSpec/graphs/contributors)

</details>
<p></p>

私たちの哲学:

```text
→ 硬直的ではなく流動的
→ ウォーターフォールではなく反復的
→ 複雑ではなく簡単
→ グリーンフィールドだけでなくブラウンフィールド向け
→ 個人プロジェクトからエンタープライズまでスケール
```

> [!TIP]
> **新しいワークフローが利用可能！** 新しいアーティファクト主導のワークフローで OpenSpec を再構築しました。
>
> まずは `/opsx:onboard` を実行してください。→ [詳しくはこちら](docs/opsx.md)

<p align="center">
  最新情報は <a href="https://x.com/0xTab">@0xTab on X</a> をフォロー · 質問やサポートは <a href="https://discord.gg/YctCnvvshC">OpenSpec Discord</a> へどうぞ。
</p>

### チーム利用

チームで OpenSpec を使いますか？ Slack チャンネルの招待は [こちらにメール](mailto:teams@openspec.dev) してください。

<!-- TODO: Add GIF demo of /opsx:new → /opsx:archive workflow -->

## 動作例

```text
あなた: /opsx:new add-dark-mode
AI:  openspec/changes/add-dark-mode/ を作成しました
     次に作成できます: proposal

あなた: /opsx:ff   # "fast-forward" - すべての計画ドキュメントを生成
AI:  ✓ proposal.md — なぜやるのか、何が変わるのか
     ✓ specs/       — 要件とシナリオ
     ✓ design.md    — 技術的アプローチ
     ✓ tasks.md     — 実装チェックリスト
     実装の準備ができました！

あなた: /opsx:apply
AI:  タスクを実装中...
     ✓ 1.1 テーマのコンテキストプロバイダーを追加
     ✓ 1.2 トグルコンポーネントを作成
     ✓ 2.1 CSS 変数を追加
     ✓ 2.2 localStorage を連携
     すべてのタスクが完了しました！

あなた: /opsx:archive
AI:  openspec/changes/archive/2025-01-23-add-dark-mode/ にアーカイブしました
     仕様を更新済みです。次の機能に進めます。
```

<details>
<summary><strong>OpenSpec ダッシュボード</strong></summary>

<p align="center">
  <img src="assets/openspec_dashboard.png" alt="OpenSpec ダッシュボードのプレビュー" width="90%">
</p>

</details>

## クイックスタート

**Node.js 20.19.0 以上が必要です。**

OpenSpec をグローバルインストール:

```bash
npm install -g @ayumuwall/openspec@latest
```

次に、プロジェクトディレクトリへ移動して初期化します:

```bash
cd your-project
openspec init
```

AI へ次のように伝えてください: `/opsx:new <作りたいもの>`

> [!NOTE]
> 対応ツールが不明ですか？ [全リストはこちら](docs/supported-tools.md) — 20+ ツールに対応しています。
>
> pnpm, yarn, bun, nix でも利用できます。[インストール方法はこちら](docs/installation.md)。

## ドキュメント

→ **[Getting Started](docs/getting-started.md)**: 最初のステップ<br>
→ **[Workflows](docs/workflows.md)**: 組み合わせとパターン<br>
→ **[Commands](docs/commands.md)**: スラッシュコマンドとスキル<br>
→ **[CLI](docs/cli.md)**: ターミナルリファレンス<br>
→ **[Supported Tools](docs/supported-tools.md)**: ツール連携とインストールパス<br>
→ **[Concepts](docs/concepts.md)**: 仕組みの全体像<br>
→ **[Multi-Language](docs/multi-language.md)**: 多言語サポート<br>
→ **[Customization](docs/customization.md)**: 自分流にカスタマイズ

## なぜ OpenSpec なのか？

AI コーディングアシスタントは強力ですが、要件がチャット履歴だけに残ると結果が予測しづらくなります。OpenSpec は軽量な仕様レイヤーを追加し、コードを書く前に「何を作るか」を合意できます。

- **作る前に合意** — 人と AI が仕様に合意してからコードを書く
- **整理された状態を維持** — 変更ごとに proposal/specs/design/tasks をまとめたフォルダを作成
- **流動的に進める** — 固定フェーズに縛られず、どの成果物もいつでも更新可能
- **使っているツールで動く** — 20+ の AI アシスタントにスラッシュコマンドで対応

### 比較

**vs. [Spec Kit](https://github.com/github/spec-kit)** (GitHub) — 徹底的だが重い。厳密なフェーズゲート、大量の Markdown、Python セットアップが必要です。OpenSpec はより軽量で自由に反復できます。

**vs. [Kiro](https://kiro.dev)** (AWS) — 強力だが IDE が固定され、Claude モデルに制限されます。OpenSpec は既存のツールで動作します。

**vs. 仕様なし** — 仕様がない AI コーディングはプロンプトが曖昧になりがちで、結果が不安定になります。OpenSpec は手間を増やさず再現性を高めます。

## OpenSpec の更新

**パッケージを更新**

```bash
npm install -g @ayumuwall/openspec@latest
```

**エージェント指示を更新**

各プロジェクト内で次を実行し、最新のスラッシュコマンドが有効であることを確認してください:

```bash
openspec update
```

## 利用上のメモ

**モデル選定**: OpenSpec は高い推論性能を持つモデルで最適に動作します。計画と実装の両方で Opus 4.5 と GPT 5.2 を推奨します。

**コンテキスト衛生**: OpenSpec はクリーンなコンテキストで最大効果を発揮します。実装開始前にコンテキストをクリアし、セッション中のコンテキスト管理を徹底してください。

## コントリビュート

**小さな修正** — バグ修正、誤字修正、小さな改善は PR を直接送ってください。

**大きな変更** — 新機能、重要なリファクタ、アーキテクチャ変更は、まず OpenSpec の変更提案を提出し、意図と目標を合意してから実装してください。

提案を書く際は、OpenSpec の哲学を意識してください。私たちは多様なコーディングエージェント、モデル、ユースケースの利用者に対応しています。変更は全員にとって使いやすいことが重要です。

**AI 生成コードは歓迎** — ただしテストと検証が済んでいることが条件です。AI 生成コードを含む PR には、使用したコーディングエージェントとモデルを明記してください（例: "Generated with Claude Code using claude-opus-4-5-20251101"）。

### 開発

- 依存関係のインストール: `pnpm install`
- ビルド: `pnpm run build`
- テスト: `pnpm test`
- CLI のローカル開発: `pnpm run dev` または `pnpm run dev:cli`
- Conventional Commits（1 行）: `type(scope): subject`

## その他

<details>
<summary><strong>テレメトリ</strong></summary>

OpenSpec は匿名の利用統計を収集します。

収集するのはコマンド名とバージョンのみです。引数・パス・内容・個人情報は収集しません。CI では自動で無効化されます。

**オプトアウト:** `export OPENSPEC_TELEMETRY=0` または `export DO_NOT_TRACK=1`

</details>

<details>
<summary><strong>Maintainers & Advisors</strong></summary>

プロジェクトを支えるメンテナとアドバイザー一覧は [MAINTAINERS.md](MAINTAINERS.md) を参照してください。

</details>

## ライセンス

MIT
