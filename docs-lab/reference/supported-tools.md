# 対応ツール

> OpenSpec が対応する AI コーディングツールと、各ツールのスキル呼び出し方法。

一覧にあるすべてのツールは、スキルとしてインストールされた同じ OpenSpec ワークフローを実行します。旧版はコマンドファイルも生成していました。その扱いは[2.0 へのアップグレード](../help/upgrade-to-2.md)を参照してください。

<a id="where-skills-go"></a>

## スキルの配置先

どのツールのスキルも `.agents/skills/` に一度だけ書き込みます。このフォルダを読み込まないツールには、固有の `skills/` フォルダ内にスキルごとのリンクを作成し、共有コピーを参照させます。

Claude Code、Cursor、Codex を設定したプロジェクトの例：

```
my-project/
├── .agents/skills/
│   ├── .openspec-target           設定済みツールを1行に1つ記録
│   └── openspec-propose/SKILL.md  全ツールが読む唯一のコピー
└── .claude/
    └── skills/openspec-propose    ../../.agents/skills/openspec-propose へのリンク
```

Cursor と Codex は `.agents/skills/` を直接読み込むため、ほかのファイルは不要です。

`openspec update` は `.openspec-target` で管理対象を判別します。各行は次のいずれかです。

| 行 | 意味 |
|---|---|
| `<tool>` | `cursor` など、このプロジェクトに設定済みのツール。 |
| `<tool> own-files` | `claude own-files` など、ツール固有のフォルダへリンクを作成したツール。そのフォルダを削除すると、`update` がツールを削除します。 |
| `keep <skill>` | `keep openspec-mine` などの独自スキル。OpenSpec がフォルダを使う前から存在したため、OpenSpec は変更しません。 |

- **リンクを作成するツール**：Claude Code、Continue、ForgeCode、Kiro、CodeBuddy、EasyCode、iFlow、CodeArts、Lingma、GigaCode、Veai、Rovo Dev、Code Studio、Hermes Agent。
- **リンク不要**：それ以外のツールは `.agents/skills/` を直接読み込み、同じスキルを二重に読み込みません。
- **リンクを作成できない場合**：通常のコピーを書き込み、`openspec update` で更新します。

一覧にないツールを追加する方法は、[別のツールをリンクする](#link-another-tool)を参照してください。

<a id="support-matrix"></a>

## 対応一覧

呼び出し例には apply ワークフローを使用しています。どのワークフローも同じ形式です。
選択画面を省略するには、ID を`openspec init --tools <id>`へ渡します（[CLI](cli.md)）。

| ツール | `--tools` ID | スキル | スキルの呼び出し |
|---|---|---|---|
| Amp | `amp` | `.agents/skills/` | `/openspec-apply-change` |
| Antigravity | `antigravity` | `.agents/skills/` | `/openspec-apply-change` |
| AtomCode | `atomcode` | `.agents/skills/` | `/openspec-apply-change` |
| Auggie (Augment CLI) | `auggie` | `.agents/skills/` | `/openspec-apply-change` |
| IBM Bob | `bob` | `.agents/skills/` | `/openspec-apply-change` |
| Claude Code | `claude` | `.agents/skills/` （`.claude/skills/` 内にリンク） | `/openspec-apply-change` |
| Cline | `cline` | `.agents/skills/` | `/openspec-apply-change` |
| CodeArts | `codeartsagent` | `.agents/skills/` （`.codeartsdoer/skills/` 内にリンク） | `/openspec-apply-change` |
| CodeBuddy Code (CLI) | `codebuddy` | `.agents/skills/` （`.codebuddy/skills/` 内にリンク） | `/openspec-apply-change` |
| Code Studio | `codestudio` | `.agents/skills/` （`.codestudio/skills/` 内にリンク） | `/openspec-apply-change` |
| Codex | `codex` | `.agents/skills/` | `$openspec-apply-change` |
| Continue | `continue` | `.agents/skills/` （`.continue/skills/` 内にリンク） | `/openspec-apply-change` |
| CoStrict | `costrict` | `.agents/skills/` | `/openspec-apply-change` |
| Crush | `crush` | `.agents/skills/` | `/openspec-apply-change` |
| Cursor | `cursor` | `.agents/skills/` | `/openspec-apply-change` |
| DeepSeek Harness | `dsh` | `.agents/skills/` | `/openspec-apply-change` |
| Devin Desktop (formerly Windsurf) | `devin` | `.agents/skills/` | `/openspec-apply-change` |
| EasyCode | `easycode` | `.agents/skills/` （`.easycode/skills/` 内にリンク） | `/openspec-apply-change` |
| Factory Droid | `factory` | `.agents/skills/` | `/openspec-apply-change` |
| ForgeCode | `forgecode` | `.agents/skills/` （`.forge/skills/` 内にリンク） | `/openspec-apply-change` |
| Gemini CLI | `gemini` | `.agents/skills/` | `/openspec-apply-change` |
| GigaCode | `gigacode` | `.agents/skills/` （`.gigacode/skills/` 内にリンク） | `/openspec-apply-change` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `/openspec-apply-change` |
| Grok Build | `grok` | `.agents/skills/` | `/openspec-apply-change` |
| GSD | `gsd` | `.agents/skills/` | `openspec-apply-change` を依頼 |
| Hermes Agent | `hermes` | `.agents/skills/` （`.hermes/skills/` 内にリンク） | `/openspec-apply-change` |
| iFlow | `iflow` | `.agents/skills/` （`.iflow/skills/` 内にリンク） | `/openspec-apply-change` |
| Junie | `junie` | `.agents/skills/` | `/openspec-apply-change` |
| Kilo Code | `kilocode` | `.agents/skills/` | `/openspec-apply-change` |
| Kimi Code | `kimi` | `.agents/skills/` | `/skill:openspec-apply-change` |
| Kiro | `kiro` | `.agents/skills/` （`.kiro/skills/` 内にリンク） | `/openspec-apply-change` |
| Lingma | `lingma` | `.agents/skills/` （`.lingma/skills/` 内にリンク） | `/openspec-apply-change` |
| MiniMax Code | `minimax-code` | `~/.minimax/skills/` （グローバル） | `/openspec-apply-change` |
| Mistral Vibe | `vibe` | `.agents/skills/` | `/openspec-apply-change` |
| Oh My Pi | `oh-my-pi` | `.agents/skills/` | `/openspec-apply-change` |
| OpenCode | `opencode` | `.agents/skills/` | `/openspec-apply-change` |
| Pi | `pi` | `.agents/skills/` | `/openspec-apply-change` |
| Qoder | `qoder` | `.agents/skills/` | `/openspec-apply-change` |
| Qwen Code | `qwen` | `.agents/skills/` | `/openspec-apply-change` |
| Rovo Dev CLI | `rovodev` | `.agents/skills/` （`.rovodev/skills/` 内にリンク） | `openspec-apply-change` を依頼 |
| Trae | `trae` | `.agents/skills/` | `/openspec-apply-change` |
| [Veai](https://veai.ru/docs/veai/download) | `veai` | `.agents/skills/` （`.veai/skills/` 内にリンク） | `/openspec-apply-change` |
| Warp | `warp` | `.agents/skills/` | `/openspec-apply-change` |
| ZCode | `zcode` | `.agents/skills/` | `/openspec-apply-change` |
| Zoo Code | `roocode` | `.agents/skills/` | `/openspec-apply-change` |
| Other / Universal | `agents` | `.agents/skills/` | `/openspec-apply-change` |

- **スキルの呼び出し**：ツールがスキルを入力可能な項目として登録するかどうかは、各ツール側の動作です。
  この列は、生成ファイルと init が表示するヒントで OpenSpec が使用する表記を示します。
  入力しても動作しない場合は、使用するツールのドキュメントを確認してください。

<a id="link-another-tool"></a>

## 別のツールをリンクする

`.agents/skills/` を読み込むツールでは、init で `agents` を選ぶだけです（[Other / Universal](#other--universal-shared-agents-skills)）。固有フォルダだけを読むツールは、1つのリンクで共有コピーへ接続できます。プロジェクトルートのターミナルで：

```bash
mkdir -p .mytool
ln -s ../.agents/skills .mytool/skills
```

Windows のコマンドプロンプトで：

```
mkdir .mytool
mklink /J .mytool\skills .agents\skills
```

`.mytool` は使用するツールのフォルダ名へ置き換えてください。すでに固有の `skills/` フォルダがある場合は、`ln -s ../../.agents/skills/openspec-propose .mytool/skills/openspec-propose` のようにスキルごとにリンクします。

**リンクのコミット**：Git はリンクをリンクとして保存します。Windows のメンバーは `git config --global core.symlinks true` を実行するか、`git clone -c core.symlinks=true <url>` でクローンし、リンクを作成できるよう開発者モードを有効にしてください。設定しない場合は小さなテキストファイルとしてチェックアウトされ、`openspec update` がスキルの通常のコピーに置き換えます。`mklink /J` によるジャンクションはリンクとしてコミットされないため、各マシンで再作成してください。

## ツール別の注意事項

以下に個別の説明がないツールは、一覧の記載どおりに動作します。

### Amazon Q Developer（対応終了）

OpenSpec 2.0 は Amazon Q Developer に対応しません。スキルを読み込めず、AWS も Kiro への移行を進めているためです。`openspec init --tools amazon-q` はこの旨を表示して停止します。設定済みのプロジェクトで `openspec update` を実行すると、`.amazonq/` に OpenSpec が生成したプロンプトとスキルを削除します。編集済みのものは保持して一覧に表示します。代わりに `openspec init --tools kiro` で Kiro を設定してください。

### Antigravity

- **現在のフォルダ**：Antigravity v1.20.5 以降は、ワークスペースのスキルと
  ワークフローを`.agents/`から読み込みます。
- **旧フォルダ**：OpenSpec は置き換え用ファイルを書き込んだ後、対応する生成ファイルを
  `.agent/`から削除します。カスタムファイルと変更済みの生成ファイルは、確認できるよう
  `.agent/`に残します。
- **共有スキル**：ほかのツールと同じ `.agents/skills/` のコピーを読み込みます。2.0 より前に OpenSpec が `.agents/workflows/` へ生成したワークフローは、更新時に削除します。

### Cline

共有の `.agents/skills/` 内のスキルを使います。2.0 より前に OpenSpec が `.clinerules/workflows/` へ生成したワークフローは更新時に削除します。独自のルールは保持します。

### Codex

- **CLI と IDE 拡張機能**：アイデアとともに`$openspec-propose`を指定するか、
  `/skills`でスキルを選択します。Codex は`/openspec-propose`を認識しません
  （[上流の Issue](https://github.com/openai/codex/issues/11817)）。
- **デスクトップアプリ**：サイドバーの Skills を開き、`openspec-propose`を選択します。
  両方の操作方法は[OpenAI のスキルドキュメント](https://learn.chatgpt.com/docs/build-skills)を参照してください。
- **共有フォルダ**：ほかのツールと同じ `.agents/skills/` のコピーを読み込みます。スキル同士は `openspec-apply-change` などのスキル名で参照し、Codex では `$openspec-apply-change` として呼び出します。
- **旧パス**：旧バージョンが `.codex/skills/` へインストールしたスキルは、次回の `openspec update` で移行します。

### DeepSeek Harness

- **プロジェクトルート**：DSH は最も近い祖先の `.git`、Git の外ではカレントディレクトリを使います。その場所で `openspec init --tools dsh` を実行してください。入れ子の OpenSpec プロジェクトでは、`.agents/skills/` の絶対パスを DSH の `customSkillDirs` に追加します。名前が重なる場合は、Git ルートのスキルが優先されます（[本家の検出ルール](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/skill/skill-filesystem)）。
- **旧コピー**：2.0 より前の `.dsh/skills/` 内のコピーは `.agents/skills/` より優先されます。`openspec update` は未編集のコピーを削除し、編集済みのものを報告します。

### Devin Desktop (formerly Windsurf)

- **両方のエージェント**：Devin Desktop と Devin Local は、ともに共有スキルを実行します。2.0 より前に OpenSpec が `.devin/workflows/` へ生成したワークフローは更新時に削除します。
- **名称変更**：`--tools windsurf` は引き続き `devin` として解決されます。旧 `.windsurf/` フォルダに OpenSpec ファイルがあるプロジェクトでは、次回の `openspec update` 時に移動を提案します。

### GitHub Copilot

- **スキル**：`.agents/skills/openspec-*/SKILL.md` を読み込み、`/openspec-<skill>` で呼び出します。CLI でファイルがあるのにスキルが消えた場合は、`/skills reload` を実行し、`/skills info openspec-propose` で認識されたことを確認してください。IDE では再起動してください。
- **旧プロンプトファイル**：2.0 より前に OpenSpec が生成した `.github/prompts/opsx-*.prompt.md` は更新時に削除します。

### GSD

- **プロジェクトのスキル**：GSD は [`.agents/skills/`](https://github.com/open-gsd/gsd-pi/blob/main/docs/user-docs/skills.md) から OpenSpec のワークフローを読み込みます。
- **呼び出し**：`openspec-<workflow>` スキルを使うよう GSD に依頼します。GSD のスキル検出設定によって、一致するスキルを選ぶこともできます。
- **サブエージェントファイルなし**：[`.gsd/agents/`](https://github.com/open-gsd/gsd-pi/blob/main/docs/user-docs/subagents.md) は GSD のサブエージェント定義の保存先です。OpenSpec はそこにワークフロースキルを生成しません。

### Hermes Agent

OpenSpec は各スキルを、プロジェクトの `.hermes/skills/` フォルダへリンクします。Hermes v2026.6.5 以降は、プロジェクト内で `hermes skills trust` を実行してリポジトリを信頼すると、このフォルダを読み込みます。それまでは、プロジェクトのスキルを検出したものの読み込まなかった旨を表示します。旧版では、プロジェクトの `.hermes/skills/` を `~/.hermes/config.yaml` の `skills.external_dirs` へ追加してください。インストール後に init がこの案内を表示します。

### MiniMax Code

- **グローバルのみ**：スキルは `~/.minimax/skills/` へ配置され、リポジトリ内には何も書き込みません。

### Warp

- **OpenSpec が管理する範囲**：`.warp/` 内には何も作成・編集しません。Warp の設定と `WARP.md` も変更しません。

<a id="other--universal-shared-agents-skills"></a>

### Other / Universal（共有 `.agents` スキル）

- **適しているツール**：共有`.agents/skills/`フォルダを読み込むすべてのツールが対象です。
  対応一覧に行がないツールも含みます。一覧にないアシスタントでは、この項目を選びます。
  init の検索欄では`universal`、`other`、`generic`、`custom`、`proprietary`、
  `unlisted`、`unsupported`、`vendor-neutral`、`agents.md`で見つかります。
- **他のツールとの併用**：すべてのツールが1つのスキルツリーを読み込みます。`.openspec-target` は設定済みツールを列挙します。削除するには、ツールのフォルダを削除します。固有フォルダがないツールでは、`.openspec-target` の該当行を削除します。
- **独自の `openspec-*` スキル**：OpenSpec が `.agents/skills/` を使う前から存在したスキルは上書きせず保持し、`.openspec-target` に `keep <skill>` として記録します。そのスキルを削除すると OpenSpec が自身のスキルを書き込めるようになります。
- **OpenSpec が管理する範囲**：`openspec-*`フォルダと`.openspec-target`一覧だけです。
  `.agents/`配下のそれ以外の内容には手を加えません。
- **`AGENTS.md`**：作成も編集もしません。ターゲットはファイルではなく`.agents/`フォルダです。
