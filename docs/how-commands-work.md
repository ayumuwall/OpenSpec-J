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
openspec init        # このプロジェクトに OpenSpec をセットアップ
openspec list        # アクティブな変更を表示
openspec view        # 対話型ダッシュボードを開く
```

**スラッシュコマンド（チャット側）。** `/opsx:propose` や `/opsx:apply` のような短いコマンドです。AIにOpenSpecのワークフローに従うよう指示します。提案を作り、仕様を書き、タスクリストから実装し、完了したらアーカイブします。Claude Code、Cursor、Devin Desktop、Copilotなど、使用するAIアシスタントのチャットに入力します。

```text
/opsx:propose add-dark-mode    (AI チャットに入力)
/opsx:apply                    (AI チャットに入力)
/opsx:archive                  (AI チャットに入力)
```

図にするとこうです。

```text
        あなたのターミナル                     AI アシスタントのチャット
   ┌──────────────────────┐               ┌──────────────────────────────┐
   │  $ openspec init     │  インストール │  /opsx:propose add-dark-mode  │
   │  $ openspec list     │  ──────────►  │  /opsx:apply                  │
   │  $ openspec view     │ コマンドと    │  /opsx:archive                │
   └──────────────────────┘  スキル       └──────────────────────────────┘
        openspec はここで実行                  /opsx:* はここで実行
```

`openspec init` をターミナルで実行すると、AI ツール側にスラッシュコマンドやスキルがインストールされます。ターミナル側がチャット側をセットアップします。その後の日常的な作業は、主にチャットで進みます。

## 「対話モード」はありません

**開始用の特別な対話モードはありません。** よくある質問なので、はっきり書いておきます。

OpenSpec 専用モードに入る必要はありません。普段どおり AI コーディングアシスタントを開き、チャットにスラッシュコマンドを入力します。アシスタントがそれを認識し、対応する OpenSpec スキルを読み込み、ワークフローに従います。

手順は次のとおりです。

1. プロジェクトでAIコーディングアシスタント（Claude Code、Cursor、Devin Desktopなど）を開く。
2. 普段リクエストを書くチャット欄に `/opsx:propose` と入力する。
3. オートコンプリートを確認する。OpenSpec がインストールされていれば、`/opsx:propose`、`/opsx:apply` などが候補に出ます。

モード切り替えも、デーモン起動も、別ウィンドウも不要です。

例外として、`openspec view` は対話型のターミナル機能です。仕様と変更を閲覧するダッシュボードを開きます。ただし、これはビューアであり、提案作成や実装の入口ではありません。提案や実装はチャット側のスラッシュコマンドで進めます。

## なぜ分かれているのか

この分割を理解すると、OpenSpecが30以上のAIツールで動く理由が分かります。

CLI は **エンジン** です。変更フォルダーの構造、アーティファクト同士の依存関係、仕様差分をソース・オブ・トゥルースへマージする方法などのルールを持っています。この挙動はどの環境でも同じです。

スラッシュコマンドは**ハンドル**です。AIツールごとに形式が少し違います。Claude Codeではコマンド、CursorやDevin Desktopではそれぞれの形式、ツールによってはスキルとして扱われます。`openspec init` を実行すると、OpenSpecは選択したツールに合うファイルを生成するため、どのアシスタントでも同じ `/opsx:propose` の意図で作業できます。

一度ワークフローを覚えれば、多くのツールで同じ考え方を使えます。トレードオフとして、正確な入力形式はツールごとに少し違う場合があります。

<a id="slash-command-syntax-by-tool"></a>

## ツール別のスラッシュコマンド構文

意図はどこでも同じで、表記はツールが読み込むファイル形式に従います。

| ツールのコマンドファイル | 入力方法 | ツール例 |
|--------------------------|----------|----------|
| `.../commands/opsx/<id>.*` | `/opsx:propose` | Claude Code、Gemini CLI、Crush |
| `.../opsx-<id>.*` | `/opsx-propose` | Cursor、GitHub Copilot (IDE)、Devin Desktop、Trae、Oh My Pi |
| `.amazonq/prompts/opsx-<id>.md` | `@opsx-propose` | Amazon Q Developer |
| なし（スキルのみ） | `/openspec-propose` | CodeArts、ForgeCode、Hermes、Mistral Vibe |
| なし（Kimi Code） | `/skill:openspec-propose` | Kimi Code |
| なし（Codex CLI） | `$openspec-propose` | Codex |

Devinは2行にまたがる唯一のツールです。Devin Desktopは `.devin/workflows/` を読むため `/opsx-propose` を使えますが、[Devin Localは対応しません](https://docs.devin.ai/desktop/devin-local)。Devin Localでは `/openspec-propose` スキルを使ってください。OpenSpecが `.devin/skills/` に書くスキルは両方で動作するため、スキル同士はスキル名で参照します。

全ツールの正式な一覧は[呼び出し方法](supported-tools.md#how-to-invoke)にあります。Amazon Qはファイルを `@` で呼び出すプロンプトライブラリへ読み込み、最後の3行はコマンドIDではなく*スキル*名を使います（`/opsx:apply` に対応するスキルは `openspec-apply-change`）。

迷った場合は `openspec init` が表示した「Getting started」を確認してください。選択したツールが登録した形式を使っています。スラッシュコマンドを表示するツールでは、`/` を入力して補完を確認する方法も使えます。

迷ったら、AI チャットで `/` を入力してオートコンプリートを見てください。ツールが期待する形式が表示されます。

## スキルとコマンドファイル

`openspec init` または `openspec update` を実行すると、AI ツールがワークフローを見つけられるように、OpenSpec は小さなファイルをプロジェクトに書き込みます。ツールと設定に応じて、それらは **スキル**、**コマンドファイル**、またはその両方です。

- **スキル**は `.claude/skills/openspec-*/SKILL.md` などに配置されます。アシスタントが自動検出する指示フォルダーで、ツール横断の新しい標準です。
- **コマンド**は `.cursor/commands/opsx-<id>.md` や `.claude/commands/opsx/<id>.md` などに配置されます。ツール固有の配置方法によって入力形式が決まる、従来のツール別スラッシュコマンドファイルです。Codexではコマンドファイルを生成せず、`.codex/skills/openspec-*` を使います。

- **スキル**は、`.claude/skills/openspec-*/SKILL.md` のような場所にあります。アシスタントが自動検出する、クロスツール向けの命令フォルダーです。
- **コマンドファイル**は、`.claude/commands/opsx/<id>.md` のような場所にあります。従来のツール別スラッシュコマンドファイルです。

通常、どちらが使われているかを意識する必要はありません。スラッシュコマンドを入力すれば動きます。ただし、コマンドが表示されないときは、これらのファイルがない、または古い可能性があります。その場合は `openspec update` で再生成できます。

ツールごとの正確なパスは [サポートされているツール](supported-tools.md) を参照してください。コマンドファイル中心の方式からスキル中心の方式へ移る背景は、[移行ガイド](migration-guide.md) にあります。

## インストール確認

短い確認手順です。

1. **AIチャットでスラッシュを入力します。** `/opsx` と入力し、補完候補を確認します。表示されれば準備完了です。スキル専用ツール（Codex、Kimi Code、CodeArts、ForgeCode、Hermes、Mistral Vibe）では正常に導入されていても `/opsx` は補完されないため、上表のスキル名を使ってください。
2. **ファイルを確認します。** Claude Codeでは `.claude/skills/` に `openspec-*` フォルダーがあるか確認します。他ツールは固有のディレクトリを使います（[対応ツール](supported-tools.md)を参照）。
3. **セットアップを再実行します。** プロジェクトルートで `openspec update` を実行し、設定済みツールのスキルとコマンドファイルを再生成します。
4. **アシスタントを再起動します。** 多くのツールは起動時にスキルとコマンドを読み込むため、新しいウィンドウで解決することがあります。

1. **AI チャットに `/` を入力する。** `/opsx` と入力し始め、候補が表示されるか確認します。表示されればセットアップ済みです。
2. **ファイルを確認する。** Claude Code なら `.claude/skills/` に `openspec-*` フォルダーがあるか確認します。他のツールは [サポートされているツール](supported-tools.md) に記載のディレクトリを使います。
3. **セットアップを再実行する。** プロジェクトルートで `openspec update` を実行します。設定済みツールのスキルファイルとコマンドファイルが再生成されます。
4. **アシスタントを再起動する。** 多くのツールは起動時にスキルやコマンドを読み込むため、再起動しないと新しいファイルが見えない場合があります。

## 利用できるコマンド

デフォルトでは、OpenSpec は **core** のスラッシュコマンドをインストールします。

- `/opsx:explore`: 変更へ進む前にAIとアイデアを検討する（迷っている場合の最初の一手）
- `/opsx:propose`: 変更を作成し、計画アーティファクトをまとめて下書きする
- `/opsx:apply`: タスクリストを順に処理して変更を実装する
- `/opsx:update`: 変更の計画アーティファクトを更新し、整合性を保つ
- `/opsx:sync`: 変更の仕様更新を本仕様へマージする（通常は自動）
- `/opsx:archive`: 変更を完了してアーカイブする

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
              (AI ツールにスラッシュコマンドをインストール)

AI CHAT      /opsx:explore
              (任意: 先に AI と一緒にアイデアを整理)

AI CHAT      /opsx:propose add-dark-mode
              (AI が proposal、specs、design、tasks を下書き)

AI CHAT      /opsx:apply
              (AI がタスクをチェックしながら実装)

AI CHAT      /opsx:archive
              (変更を仕様へマージし、アーカイブ)
```

セットアップはターミナルで行います。その後の作業は主にチャットで進みます。これが基本のリズムです。

## 関連

- [はじめに](getting-started.md): 最初の変更の完全なウォークスルー
- [コマンド](commands.md): すべてのスラッシュコマンドの詳細
- [CLI](cli.md): すべてのターミナルコマンドの詳細
- [サポートされているツール](supported-tools.md): ツールごとの構文とファイル配置
- [FAQ](faq.md): よくある質問への短い回答
- [トラブルシューティング](troubleshooting.md): コマンドが表示されない場合の対処
