# 対応ツール

> OpenSpec が対応する AI コーディングツールと、各ツールのコマンド構文。

一覧にあるすべてのツールは、同じ OpenSpec ワークフローを実行します。スキルとそのコマンドは
同じワークフロー手順であり、違いは入力方法だけです。init がどちらの形式をインストールするかは
配布設定で決まります。詳しくは[プロジェクトをセットアップする](../start/setup.md#the-workflow-files-skills-and-commands)を参照してください。

## 対応一覧

呼び出し例には apply ワークフローを使用しています。どのワークフローも同じ形式です。
選択画面を省略するには、ID を`openspec init --tools <id>`へ渡します（[CLI](cli.md)）。

| ツール                            | `--tools` ID     | スキル                             | スキルの呼び出し               | コマンド                     | コマンドの呼び出し |
| --------------------------------- | ---------------- | ---------------------------------- | ------------------------------ | ---------------------------- | ------------------ |
| Amazon Q Developer                | `amazon-q`       | `.amazonq/skills/`                 | `/openspec-apply-change`       | `.amazonq/prompts/`          | `@opsx-apply`      |
| Antigravity                       | `antigravity`    | `.agents/skills/`                  | `/openspec-apply-change`       | `.agents/workflows/`         | `/opsx-apply`      |
| Auggie (Augment CLI)              | `auggie`         | `.augment/skills/`                 | `/openspec-apply-change`       | `.augment/commands/`         | `/opsx-apply`      |
| Bob Shell                         | `bob`            | `.bob/skills/`                     | `/openspec-apply-change`       | `.bob/commands/`             | `/opsx-apply`      |
| Claude Code                       | `claude`         | `.claude/skills/`                  | `/openspec-apply-change`       | `.claude/commands/opsx/`     | `/opsx:apply`      |
| Cline                             | `cline`          | `.cline/skills/`                   | `/openspec-apply-change`       | `.clinerules/workflows/`     | `/opsx-apply`      |
| CodeArts                          | `codeartsagent`  | `.codeartsdoer/skills/`            | `/openspec-apply-change`       | なし                         | なし               |
| CodeBuddy Code (CLI)              | `codebuddy`      | `.codebuddy/skills/`               | `/openspec-apply-change`       | `.codebuddy/commands/opsx/`  | `/opsx:apply`      |
| Codex                             | `codex`          | `.agents/skills/`                  | `$openspec-apply-change`       | なし                         | なし               |
| Continue                          | `continue`       | `.continue/skills/`                | `/openspec-apply-change`       | `.continue/prompts/`         | `/opsx-apply`      |
| CoStrict                          | `costrict`       | `.cospec/skills/`                  | `/openspec-apply-change`       | `.cospec/openspec/commands/` | `/opsx-apply`      |
| Crush                             | `crush`          | `.crush/skills/`                   | `/openspec-apply-change`       | `.crush/commands/opsx/`      | `/opsx:apply`      |
| Cursor                            | `cursor`         | `.cursor/skills/`                  | `/openspec-apply-change`       | `.cursor/commands/`          | `/opsx-apply`      |
| Devin Desktop (formerly Windsurf) | `devin`          | `.devin/skills/`                   | `/openspec-apply-change`       | `.devin/workflows/`          | `/opsx-apply`      |
| Factory Droid                     | `factory`        | `.factory/skills/`                 | `/openspec-apply-change`       | `.factory/commands/`         | `/opsx-apply`      |
| ForgeCode                         | `forgecode`      | `.forge/skills/`                   | `/openspec-apply-change`       | なし                         | なし               |
| Gemini CLI                        | `gemini`         | `.gemini/skills/`                  | `/openspec-apply-change`       | `.gemini/commands/opsx/`     | `/opsx:apply`      |
| GitHub Copilot                    | `github-copilot` | `.github/skills/`                  | `/openspec-apply-change`       | `.github/prompts/`           | `/opsx-apply`      |
| Hermes Agent                      | `hermes`         | `.hermes/skills/`                  | `/openspec-apply-change`       | なし                         | なし               |
| iFlow                             | `iflow`          | `.iflow/skills/`                   | `/openspec-apply-change`       | `.iflow/commands/`           | `/opsx-apply`      |
| Junie                             | `junie`          | `.junie/skills/`                   | `/openspec-apply-change`       | `.junie/commands/`           | `/opsx-apply`      |
| Kilo Code                         | `kilocode`       | `.kilocode/skills/`                | `/openspec-apply-change`       | `.kilocode/workflows/`       | `/opsx-apply`      |
| Kimi Code                         | `kimi`           | `.kimi-code/skills/`               | `/skill:openspec-apply-change` | なし                         | なし               |
| Kiro                              | `kiro`           | `.kiro/skills/`                    | `/openspec-apply-change`       | `.kiro/prompts/`             | `/opsx-apply`      |
| Lingma                            | `lingma`         | `.lingma/skills/`                  | `/openspec-apply-change`       | `.lingma/commands/opsx/`     | `/opsx:apply`      |
| MiniMax Code                      | `minimax-code`   | `~/.minimax/skills/`（グローバル） | `/openspec-apply-change`       | なし                         | なし               |
| Mistral Vibe                      | `vibe`           | `.vibe/skills/`                    | `/openspec-apply-change`       | なし                         | なし               |
| Oh My Pi                          | `oh-my-pi`       | `.omp/skills/`                     | `/openspec-apply-change`       | `.omp/commands/`             | `/opsx-apply`      |
| OpenCode                          | `opencode`       | `.opencode/skills/`                | `/openspec-apply-change`       | `.opencode/commands/`        | `/opsx-apply`      |
| Pi                                | `pi`             | `.pi/skills/`                      | `/openspec-apply-change`       | `.pi/prompts/`               | `/opsx-apply`      |
| Qoder                             | `qoder`          | `.qoder/skills/`                   | `/openspec-apply-change`       | `.qoder/commands/opsx/`      | `/opsx:apply`      |
| Qwen Code                         | `qwen`           | `.qwen/skills/`                    | `/openspec-apply-change`       | `.qwen/commands/`            | `/opsx-apply`      |
| Trae                              | `trae`           | `.trae/skills/`                    | `/openspec-apply-change`       | `.trae/commands/`            | `/opsx-apply`      |
| ZCode                             | `zcode`          | `.zcode/skills/`                   | `/openspec-apply-change`       | `.zcode/commands/opsx/`      | `/opsx:apply`      |
| Zoo Code                          | `roocode`        | `.roo/skills/`                     | `/openspec-apply-change`       | `.roo/commands/`             | `/opsx-apply`      |
| 共有 `.agents` スキル             | `agents`         | `.agents/skills/`                  | `/openspec-apply-change`       | なし                         | なし               |

- **スキルの呼び出し**：ツールがスキルを入力可能な項目として登録するかどうかは、各ツール側の動作です。
  この列は、生成ファイルと init が表示するヒントで OpenSpec が使用する表記を示します。
  入力しても動作しない場合は、使用するツールのドキュメントを確認してください。
- **コマンドファイルの形式**：ほとんどのツールは`.md`コマンドファイルを使用します。
  Gemini CLI は`.toml`、Continue は`.prompt`、Kiro と GitHub Copilot は`.prompt.md`を使用します。
  どの形式でも、入力する表記は同じです。

## ツール別の注意事項

以下に個別の説明がないツールは、一覧の記載どおりに動作します。

### Antigravity

- **現在のフォルダ**：Antigravity v1.20.5 以降は、ワークスペースのスキルと
  ワークフローを`.agents/`から読み込みます。
- **旧フォルダ**：OpenSpec は置き換え用ファイルを書き込んだ後、対応する生成ファイルを
  `.agent/`から削除します。カスタムファイルと変更済みの生成ファイルは、確認できるよう
  `.agent/`に残します。
- **共有スキル**：Antigravity は`.agents/skills/`を Codex、Zed Agent、`agents`ターゲットと
  共有します。OpenSpec はこのスキルツリーを一度だけ書き込み、Antigravity のコマンドは
  引き続き`.agents/workflows/`へ書き込みます。

### Cline

Cline は`.cline/`フォルダではなく、`.clinerules/workflows/`からコマンドを読み込みます。
スキルは`.cline/skills/`に配置されます。

### Codex

- **呼び出し**：`$openspec-<skill>`と入力します。Codex は
  `/openspec-<skill>`形式を認識しません（[上流の Issue](https://github.com/openai/codex/issues/11817)）。
- **コマンドファイルなし**：Codex はスキルを直接実行します。そのため、配布設定にコマンドが含まれていても
  init はコマンドを省略し、`Commands skipped for: codex (uses skills)`と表示します。
- **共有フォルダ**：Codex のスキルは、Antigravity、Zed Agent、`agents`ターゲットと同じ
  `.agents/skills/`ツリーに配置されます。複数を選択しても互換性のあるツリーは 1 つだけ維持され、
  Codex が所有する場合、その引き継ぎには`$openspec-*`と`/openspec-*`の両方が記載されます。
- **旧パス**：旧バージョンによって`.codex/skills/`へインストールされたスキルは、次回の
  `openspec update`で移行されます。

### Devin Desktop (formerly Windsurf)

- **2 つのエージェント**：`.devin/workflows/`のコマンドファイルは Devin Desktop でのみ動作します。
  Devin Local はスキルだけを実行するため、生成されるスキルは、どちらでも動作する
  `/openspec-<skill>`を参照します。
- **名称変更**：`--tools windsurf`は引き続き`devin`として解決されます。旧`.windsurf/`
  フォルダに OpenSpec ファイルがあるプロジェクトでは、次回の`openspec update`時に移動を提案します。

### GitHub Copilot

プロンプトファイルは、Copilot の IDE 拡張機能（VS Code、JetBrains、Visual Studio）で
スラッシュコマンドとして登録されます。Copilot CLI は`.github/prompts/`を読み込みません。

### Hermes Agent

Hermes は既定では`~/.hermes/skills/`からのみスキルを読み込みます。プロジェクトの
`.hermes/skills/`フォルダを`~/.hermes/config.yaml`の`skills.external_dirs`へ追加してください。
インストール後、init がこの注意事項を表示します。

### MiniMax Code

- **グローバルのみ**：スキルは`~/.minimax/skills/`へ配置され、リポジトリ内には
  何も書き込まれません。
- **プロジェクト間で安全**：コマンドのみを配布する設定でもグローバルスキルは残ります。
  そのため、あるプロジェクトの設定によって、別のプロジェクトが使用するスキルが削除されることはありません。

### 共有 `.agents` スキル

- **適しているツール**：共有`.agents/skills/`フォルダを読み込むすべてのツールが対象です。
  対応一覧に行がないツールも含みます。
- **他のターゲットとの併用**：Antigravity、Codex、Zed Agent、このターゲットは、1 つの物理的な
  スキルツリーを共有します。OpenSpec は`.openspec-target`へ書き込み元を 1 つ記録し、実行ごとに
  ツリーを一度だけ書き込みます。各ツール固有のコマンドファイルは引き続き生成されます。
- **OpenSpec が管理する範囲**：`openspec-*`フォルダと`.openspec-target`マーカーだけです。
  `.agents/`配下のそれ以外の内容には手を加えません。
- **`AGENTS.md`**：作成も編集もしません。ターゲットはファイルではなく`.agents/`フォルダです。
