# プロジェクトをセットアップする

> プロジェクトへ OpenSpec を追加し、init の作成内容を確認して調整する。

## OpenSpec の保存場所を選ぶ

- **リポジトリ内（既定）**：仕様と変更提案を、その対象コードと同じ場所に置き、コードと一緒にバージョン管理します。このページの残りでは、この構成を使用します。
- **ストア内**：複数リポジトリで使用する場合や、計画をコードのリポジトリから完全に分離する場合に使う、独立した計画リポジトリです。利用するリポジトリ間で共有します。[ストア（ベータ）](../multi-repo/stores.md)で、適した状況とセットアップ方法を説明します。

## プロジェクトを初期化する

CLI を[インストール](installation.md)したら、プロジェクトのルートで init を実行します。
ターミナルで次を実行します。

```bash
cd <your-project>
openspec init
```

使用するツールを選んでください。新しいプロジェクトではスキルをグローバルにインストールします。プロジェクトのリポジトリ内に保持する場合は `openspec init --scope project` を実行してください。

**セットアップスクリプトの互換性に関する変更。** 2.0 では `openspec init --tools claude` が新しいリポジトリ内にスキルを書き込んでいました。今後は既定でマシンにインストールします。チームや CI のためにスキルをコミットするスクリプトでは、`openspec init --scope project --tools claude` を使ってください。

既定のマシン全体へのインストールでは、次のように表示します。

```
OpenSpec のセットアップが完了しました

新規作成: Claude Code
~/.agents/skills/ にスキル6個を作成しました（このマシンの全プロジェクトで利用可能）
設定: openspec/config.yaml（スキーマ: spec-driven）
```

プロジェクト内にスキルを置く場合：

```
OpenSpec のセットアップが完了しました

新規作成: Claude Code
.agents/skills/ にスキル6個を作成しました（.claude/skills/ にも配置）
設定: openspec/config.yaml（スキーマ: spec-driven）
```

IDE で動くツールを使う場合は、新しいスキルを読み込むために再起動してください。

init は安全に再実行できます。

- スキルをプロジェクト内に置く場合、セットアップ済みのツールには `新規作成` ではなく `更新` と表示されます。
- init を再実行して新しいツールを選択すると、そのツールが追加されます。
- `--tools`フラグを指定すると選択画面を省略できます（[CLI リファレンス](../reference/cli.md)）。

### 既存の `project.md` を移行する

init は旧形式の `openspec/project.md` を `config.yaml` へコピーしません。ファイルを保持し、AI に移行を依頼するための文章を表示します。

AI チャットで：

```
openspec/project.md を確認し、有用な内容を openspec/config.yaml へ移してください。
context は簡潔にし、アーティファクトの作成、apply、archive に必要なプロジェクト全体の事実だけを含めてください。
アーティファクト固有の指示は、該当するアーティファクトの rules へ移してください。
apply または archive の進め方は、該当する operations の項目へ移してください。
一般論、古い情報、冗長な内容は除外してください。project.md は削除しないでください。
```

`config.yaml` をレビューし、準備ができたら `project.md` を削除してください。

## init がインストールするもの

どのプロジェクトにも、リポジトリルートに `openspec/` フォルダを作成します。スキルの保存先は選択によって異なります。

| | マシン全体 | プロジェクト内 |
|---|---|---|
| スキル | ホームフォルダの `~/.agents/skills/` | プロジェクトの `.agents/skills/` |
| 固有フォルダを読むツール用のリンク | 例：`~/.claude/skills/` | 例：`.claude/skills/` |
| コミットするもの | `openspec/` | `openspec/`、スキル、ツール用の項目 |

この節の以降の説明は、プロジェクト内へのインストールを扱います。マシン全体への導入は[全プロジェクト用のスキルを一度だけインストールする](#install-the-skills-once-for-every-project)を参照してください。

Vercel のインストーラーは、CLI のバージョンに対応する OpenSpec の GitHub タグからスキルを取得します。スキルのインストールと更新には Git と GitHub へのアクセスが必要です。プロジェクト内へのインストールでは `skills-lock.json` を変更しません。

init は旧版が生成したコマンドファイルも削除しますが、編集済みのものは保持します。1.0 より前に初期化したプロジェクトには、`.claude/commands/openspec/` などのフォルダや、`CLAUDE.md`・`AGENTS.md` 内の OpenSpec マーカーブロックも残っています。対話実行の init は削除前に確認します。`--force` や `--tools` を指定した場合、または非対話実行では、ブロック内の編集も含めて確認なしで削除するため、先にバックアップしてください。

### `openspec/`フォルダ

OpenSpec のすべてのアーティファクトは、プロジェクトルートのこのフォルダに配置されます。

```
openspec/
├── config.yaml     プロジェクト設定と AI 用のコンテキスト
├── specs/          仕様（現時点では空）
└── changes/        進行中の変更提案（現時点では空）
    └── archive/    完了した変更提案の移動先
```

[プロジェクト設定](../customize/project-config.md)で`config.yaml`を説明しています。

<a id="the-workflow-files-skills"></a>

### ワークフローファイル（スキル）

これらは、作業中に使う操作を定義した OpenSpec ワークフローです。次は、共有の `.agents/skills/` フォルダへスキルとしてインストールした場合の構成です。

```
.agents/skills/
├── openspec-explore/              先にアイデアを検討する
├── openspec-propose/              変更提案を作成する
├── openspec-apply-change/         変更提案のタスクを実装する
├── openspec-update-change/        変更提案の計画を修正する
├── openspec-sync-specs/           変更提案の仕様更新を specs/ へ同期する
├── openspec-archive-change/       完了した変更提案をアーカイブへ移す
├── openspec-verify-change/        実装が計画と一致するか確認する（既定では含まれない）
└── openspec-bulk-archive-change/  複数の変更提案を一度にアーカイブする（既定では含まれない）
```

これは既定のセットに、任意のワークフローを 2 つ加えたものです。
[プロファイル](../customize/profiles.md)に全 12 ワークフローを掲載しています。

設定したツールの数にかかわらず、各スキルはここに一度だけ書き込みます。Claude Code や Kiro など `.agents/skills/` を読まないツールには、`.claude/skills/openspec-propose` など固有フォルダ内にスキルごとのリンクを作成します。Windows のプロジェクト内インストールでは、Git で別のチェックアウトへ渡せるコピーを使います。配置とリンクを作成するツールは[対応ツール](../reference/supported-tools.md#where-skills-go)を参照してください。

各ワークフローは**スキル**です。作業を依頼するとエージェントが読み取る指示であり、名前でも呼び出せます（Claude Code は `/openspec-apply-change`、Codex は `$openspec-apply-change`）。ツールごとの表記は[対応ツール](../reference/supported-tools.md#support-matrix)を参照してください。

OpenSpec 1.x はワークフローごとのコマンドファイル（`/opsx:apply`）も生成していました。OpenSpec 2.0 はスキルだけをインストールします。変更点は[2.0 へのアップグレード](../help/upgrade-to-2.md)を参照してください。

#### インストール内容を変更する

対話式の選択画面で、ワークフローセットを変更できます
（[プロファイル](../customize/profiles.md)）。ターミナルで次を実行します。

```bash
openspec config profile
```

「このプロジェクトに今すぐ変更を適用しますか？」に「はい」と答えると、その場で適用します。ほかのプロジェクトでは、次回の `openspec update` 時に適用されます。この設定はマシンごとのグローバル設定です。

#### Claude Code にワークフローが表示されない

Claude Code は `.agents/skills/openspec-*` へのリンクである `.claude/skills/openspec-*` からスキルを読み込みます。ファイルがなければ、ターミナルでプロジェクトを更新します。

```bash
openspec update
```

Claude Code を再起動し、チャットで`/openspec-propose`を実行してください。一部のワークフローだけがない場合は、[プロファイルを変更](../customize/profiles.md#セットの拡張オプションのワークフロー)してください。

<a id="install-the-skills-once-for-every-project"></a>

### 全プロジェクト用のスキルを一度だけインストールする

新しいプロジェクトは、マシン上のスキルを使います。後からツールを追加するには、次を実行します。

```bash
openspec init --scope global --tools claude
```

`openspec update` を実行すると、[ワークフロープロファイル](../customize/profiles.md)に応じてスキルを更新します。CLI をダウングレードした場合は、そのバージョンの指示をインストールします。

<a id="move-an-existing-project-to-the-global-skills"></a>

#### 既存プロジェクトをグローバルスキルへ移行する

1. 組み込みスキルの編集内容を保存し、そのフォルダ内に追加したファイルを外へ移してください。update はフォルダ全体を置き換えます。チーム向けの指示は `openspec/config.yaml` の `rules` や `context` に置くか、独自スキルを別名で作成します。
2. ターミナルで `openspec update` を実行します。**グローバルに切り替え**を選ぶと、マシンへスキルをインストールし、リポジトリ内のコピーを削除します。リポジトリ内に保持する場合は、**このプロジェクトに保持**で Enter を押し、更新された `openspec/config.yaml` をコミットします。選択内容は `skillsScope: project` として保存され、他のチェックアウトでも保持されます。後から `openspec init --scope global` で切り替えられます。
3. グローバルへ切り替えた場合は、ファイルの削除をコミットします。他のメンバーはそのコミットを pull 後、ターミナルで `openspec update` を実行します。マシンへのスキル導入に**はい**と答え、ツールを選択します。スクリプトやエージェントからは、代わりに `openspec init --tools <ids>` を実行します。

GitHub 上の Copilot エージェントには、プロジェクト内のスキルを保持してください。コミット済みのファイルは読めますが、個人のホームフォルダは読めません。`openspec validate` だけを実行する CI ジョブにスキルは不要です。スキルを導入するジョブは [OPENSPEC_SKILLS_SCOPE](../reference/configuration/environment-variables.md#openspec_skills_scope)を参照してください。

セットアップは完了です。[クイックスタート](quickstart.md)で、最初の変更提案をここから進めます。
