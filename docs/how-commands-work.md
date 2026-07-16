# コマンドの仕組み

**OpenSpec には 2 種類のコマンドがあります。実行する場所も違います。**

- `openspec ...` コマンドは **ターミナル** で実行します（例: `openspec init`）。
- `/opsx:...` コマンドは **AI アシスタントのチャット**で実行します（例: `/opsx:propose`）。

ターミナルに `/opsx:propose` と入力しても何も起こらない場合、その理由はここにあります。スラッシュコマンドはターミナルコマンドではありません。普段「ログインフォームを追加して」と入力するのと同じチャット欄で、AI コーディングアシスタントに渡す指示です。

この違いが新規ユーザーにとって最も多い混乱点なので、明確に分けて考えます。

## 2 つの役割

OpenSpec は 1 つのプロジェクトですが、役割は 2 つあります。

**CLI（ターミナル側）。** `openspec` という名前のプログラムです。シェルから実行します。プロジェクトのセットアップ、変更の一覧表示、検証、ダッシュボード表示、完了した変更のアーカイブなどを行います。iTerm、VS Code ターミナル、PowerShell など、`git` や `npm` を実行する場所で使います。

```bash
openspec init        # set up OpenSpec in this project
openspec list        # see active changes
openspec view        # open the interactive dashboard
```

**スラッシュコマンド（チャット側）。** `/opsx:propose` や `/opsx:apply` のような短いコマンドです。AI に OpenSpec のワークフローに従うよう指示します。提案を作り、仕様を書き、タスクリストから実装し、完了したらアーカイブします。Claude Code、Cursor、Windsurf、Copilot など、使っている AI アシスタントのチャットに入力します。

```text
/opsx:propose add-dark-mode    (typed in your AI chat)
/opsx:apply                    (typed in your AI chat)
/opsx:archive                  (typed in your AI chat)
```

図にするとこうです。

```text
        YOUR TERMINAL                         YOUR AI ASSISTANT'S CHAT
   ┌──────────────────────┐               ┌──────────────────────────────┐
   │  $ openspec init     │   installs    │  /opsx:propose add-dark-mode  │
   │  $ openspec list     │  ──────────►  │  /opsx:apply                  │
   │  $ openspec view     │   commands    │  /opsx:archive                │
   └──────────────────────┘    & skills   └──────────────────────────────┘
        run openspec here                       run /opsx:* here
```

`openspec init` をターミナルで実行すると、AI ツール側にスラッシュコマンドやスキルがインストールされます。ターミナル側がチャット側をセットアップします。その後の日常的な作業は、主にチャットで進みます。

## 「対話モード」はありません

**開始用の特別な対話モードはありません。** よくある質問なので、はっきり書いておきます。

OpenSpec 専用モードに入る必要はありません。普段どおり AI コーディングアシスタントを開き、チャットにスラッシュコマンドを入力します。アシスタントがそれを認識し、対応する OpenSpec スキルを読み込み、ワークフローに従います。

手順は次のとおりです。

1. プロジェクトで AI コーディングアシスタント（Claude Code、Cursor、Windsurf など）を開く。
2. 普段リクエストを書くチャット欄に `/opsx:propose` と入力する。
3. オートコンプリートを確認する。OpenSpec がインストールされていれば、`/opsx:propose`、`/opsx:apply` などが候補に出ます。

モード切り替えも、デーモン起動も、別ウィンドウも不要です。

例外として、`openspec view` は対話型のターミナル機能です。仕様と変更を閲覧するダッシュボードを開きます。ただし、これはビューアであり、提案作成や実装の入口ではありません。提案や実装はチャット側のスラッシュコマンドで進めます。

## なぜ分かれているのか

この分割を理解すると、OpenSpec が 25 以上の AI ツールで動く理由が分かります。

CLI は **エンジン** です。変更フォルダーの構造、アーティファクト同士の依存関係、仕様差分をソース・オブ・トゥルースへマージする方法などのルールを持っています。この挙動はどの環境でも同じです。

スラッシュコマンドは **ハンドル** です。AI ツールごとに形式が少し違います。Claude Code ではコマンド、Cursor や Windsurf では別形式のコマンド、ツールによってはスキルとして扱われます。`openspec init` を実行すると、OpenSpec は選択したツールに合うファイルを生成します。そのため、どのアシスタントでも同じ `/opsx:propose` の意図で作業できます。

一度ワークフローを覚えれば、多くのツールで同じ考え方を使えます。トレードオフとして、正確な入力形式はツールごとに少し違う場合があります。

## ツール別のスラッシュコマンド構文

意図は同じですが、記号が違うことがあります。使っているアシスタントに合う形式を使ってください。

| ツール | 入力方法 |
| --- | --- |
| Claude Code | `/opsx:propose`、`/opsx:apply` |
| Cursor | `/opsx-propose`、`/opsx-apply` |
| Windsurf | `/opsx-propose`、`/opsx-apply` |
| GitHub Copilot (IDE) | `/opsx-propose`、`/opsx-apply` |
| Oh My Pi | `/opsx-propose`、`/opsx-apply` |
| Kimi CLI | スキル形式。例: `/skill:openspec-propose` |
| Trae | `/opsx-propose`、`/opsx-apply` |

多くのツールはコロン形式（`/opsx:propose`）またはダッシュ形式（`/opsx-propose`）を使います。一部のツールでは、OpenSpec がスラッシュコマンドではなく名前付きスキルとして表示されます。ツールごとのファイル配置まで含む完全な一覧は、[サポートされているツール](supported-tools.md) を参照してください。

迷ったら、AI チャットで `/` を入力してオートコンプリートを見てください。ツールが期待する形式が表示されます。

## スキルとコマンドファイル

`openspec init` または `openspec update` を実行すると、AI ツールがワークフローを見つけられるように、OpenSpec は小さなファイルをプロジェクトに書き込みます。ツールと設定に応じて、それらは **スキル**、**コマンドファイル**、またはその両方です。

- **スキル**は、`.claude/skills/openspec-*/SKILL.md` のような場所にあります。アシスタントが自動検出する、クロスツール向けの命令フォルダーです。
- **コマンドファイル**は、`.claude/commands/opsx/<id>.md` のような場所にあります。従来のツール別スラッシュコマンドファイルです。

通常、どちらが使われているかを意識する必要はありません。スラッシュコマンドを入力すれば動きます。ただし、コマンドが表示されないときは、これらのファイルがない、または古い可能性があります。その場合は `openspec update` で再生成できます。

ツールごとの正確なパスは [サポートされているツール](supported-tools.md) を参照してください。コマンドファイル中心の方式からスキル中心の方式へ移る背景は、[移行ガイド](migration-guide.md) にあります。

## インストール確認

短い確認手順です。

1. **AI チャットに `/` を入力する。** `/opsx` と入力し始め、候補が表示されるか確認します。表示されればセットアップ済みです。
2. **ファイルを確認する。** Claude Code なら `.claude/skills/` に `openspec-*` フォルダーがあるか確認します。他のツールは [サポートされているツール](supported-tools.md) に記載のディレクトリを使います。
3. **セットアップを再実行する。** プロジェクトルートで `openspec update` を実行します。設定済みツールのスキルファイルとコマンドファイルが再生成されます。
4. **アシスタントを再起動する。** 多くのツールは起動時にスキルやコマンドを読み込むため、再起動しないと新しいファイルが見えない場合があります。

## 利用できるコマンド

デフォルトでは、OpenSpec は **core** のスラッシュコマンドをインストールします。

- `/opsx:explore`: 変更を提案する前に、AI と一緒にアイデアを検討する。迷っているときの最初の一手。
- `/opsx:propose`: 変更を作成し、計画成果物をまとめて下書きする。
- `/opsx:apply`: タスクリストに沿って変更を実装する。
- `/opsx:sync`: 変更の仕様差分をメイン仕様へマージする（通常は自動）。
- `/opsx:archive`: 完了した変更をアーカイブする。

基本のリズムは、迷ったら `explore`、次に `propose`、`apply`、`archive` です。[まずは探索する](explore.md) では、最初に探索する価値を説明しています。

より細かく制御したい場合は、**拡張** セットもあります。`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:bulk-archive`、`/opsx:onboard` です。`openspec config profile` で有効にし、`openspec update` でプロジェクトへ適用します。

初めてで一通り体験したい場合は、拡張セットの `/opsx:onboard` が便利です。自分のコードベースで小さな変更を進めながら、各ステップを案内します。

各コマンドの詳細は [コマンド](commands.md) を参照してください。どのタイミングでどれを使うかは [ワークフロー](workflows.md) にあります。

## 最初の実行例

全体の流れを、実行場所付きで示します。

```text
TERMINAL   $ npm install -g @ayumuwall/openspec@latest
TERMINAL   $ cd your-project
TERMINAL   $ openspec init
              (installs slash commands into your AI tool)

AI CHAT      /opsx:explore
              (optional: think the idea through with the AI first)

AI CHAT      /opsx:propose add-dark-mode
              (AI drafts proposal, specs, design, tasks)

AI CHAT      /opsx:apply
              (AI builds it, checking off tasks)

AI CHAT      /opsx:archive
              (change is merged into your specs and filed away)
```

セットアップはターミナルで行います。その後の作業は主にチャットで進みます。これが基本のリズムです。

## 関連

- [はじめに](getting-started.md): 最初の変更の完全なウォークスルー
- [コマンド](commands.md): すべてのスラッシュコマンドの詳細
- [CLI](cli.md): すべてのターミナルコマンドの詳細
- [サポートされているツール](supported-tools.md): ツールごとの構文とファイル配置
- [FAQ](faq.md): よくある質問への短い回答
- [トラブルシューティング](troubleshooting.md): コマンドが表示されない場合の対処
