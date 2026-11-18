# 2.0 へのアップグレード

> OpenSpec 2.0 の変更点と、プロジェクトの移行手順を説明します。

2.0 をお使いの場合は、[2.1 へのアップグレード](upgrade-to-2-1.md)を参照してください。

1.x から移行する場合は、CLI を更新し、各プロジェクトで `openspec update` を実行してください。組み込みスキルを更新し、旧生成コマンドを削除します。編集済みのコマンドファイルは保持します。

> [!WARNING]
> `update` は `.agents/skills/` 内の組み込みスキルのフォルダ全体を置き換え、コピーは残しません。内部の編集内容や追加ファイルも、メッセージを表示せずに削除します。先に保存してください：[カスタマイズしたスキル](#skills-you-customized)。`openspec update --dry-run` で変更予定を確認できます。

## 変更点

| | 1.x | 2.0 |
|---|---|---|
| スキルの配置先 | ツール固有のフォルダごとにコピー | `.agents/skills/` に1つ配置し、必要なツール用にリンクを作成 |
| コマンドファイル（`/opsx:propose`） | スキルとともにインストール | 廃止。同じ処理を行うスキルを使用 |
| `delivery` 設定 | スキル、コマンド、または両方 | 廃止。すべてスキルに統一 |
| Amazon Q Developer | プロンプトファイルとスキル | スキルを読み込めないため対応終了。`update` で OpenSpec のファイルを削除し、Kiro への移行を案内 |

新しい配置とリンクを作成するツールは、[対応ツール](../reference/supported-tools.md#where-skills-go)を参照してください。

## プロジェクトを移行する

元に戻せるよう、先に作業内容をコミットしてください。`.agents/skills/` 内のスキルを編集していた場合、このコミットが編集内容の唯一の控えになります。Git はリンクに変わったフォルダを stash に保存できないため、移行そのものを `git stash` に退避することはできません。

**1. CLI を更新する。** 導入方法に応じた手順で[更新](../start/installation.md#updating)します。

**2. 各プロジェクトで update を実行する。** ターミナルで：

```bash
openspec update
```

ターミナルではスキルの保存先を確認します。どちらの選択肢についても、[2.1 へのアップグレード](upgrade-to-2-1.md)で説明しています。

**3. 結果をコミットする。**

`update` を再実行しても変更は生じません。

## update が行う処理

- **プロジェクト内のスキル**：インストーラーが `.agents/skills/` に書き込み、選択したツールから読める場所に配置します。Windows ではコピーを使います。
- **旧スキルのコピー**：旧版がツール固有のフォルダへ書き込んだコピーを削除します。
- **コマンドファイル**：旧版が生成したコマンドファイルを削除します。
- **編集済みの旧コマンド**：保持し、確認できるよう一覧に表示します。
- **OpenSpec がインストールするスキル**：1.x の更新と同様に、その場で更新します。スキル内の編集は上書きされます。
- **リンク**：プロジェクト外へのリンクはたどりません。
- **プロジェクト外**：変更するのはグローバル設定、マシン上で管理するプロジェクト一覧、`~/.codex/prompts/` 内の旧 OpenSpec プロンプトです。2.1 以降は、グローバルスキルをインストール済みなら、それも更新します。旧プロンプトの削除には、`--force` または利用者の確認が必要です。

## 旧コマンドに対応するスキル

1.x の各コマンドには、同じ指示を持つスキルがあります。

| 1.x のコマンド | 2.0 のスキル |
|---|---|
| `/opsx:propose` | `openspec-propose` |
| `/opsx:explore` | `openspec-explore` |
| `/opsx:apply` | `openspec-apply-change` |
| `/opsx:update` | `openspec-update-change` |
| `/opsx:sync` | `openspec-sync-specs` |
| `/opsx:archive` | `openspec-archive-change` |
| `/opsx:new` | `openspec-new-change` |
| `/opsx:continue` | `openspec-continue-change` |
| `/opsx:ff` | `openspec-ff-change` |
| `/opsx:verify` | `openspec-verify-change` |
| `/opsx:bulk-archive` | `openspec-bulk-archive-change` |
| `/opsx:onboard` | `openspec-onboard` |

「ダークモードを追加する変更を提案して」のように、通常の言葉でも依頼できます。名前で呼び出す場合は、Claude Code など多くのツールで `/openspec-propose`、Codex で `$openspec-propose` と入力します。ツールごとの表記は[対応ツール](../reference/supported-tools.md#support-matrix)を参照してください。

## 編集済みのコマンドファイル

`update` は OpenSpec の生成内容と一致するコマンドファイルだけを削除します。編集済みのものは保持し、一覧に表示します。

```
OpenSpec の生成内容と一致しないコマンドファイル1件を保持しました（編集済みの可能性があります）:
  .claude/commands/opsx/apply.md
必要な内容をスキルへ移してから、手動で削除してください。
```

保持されたファイルは、ツールにコマンドとして表示される場合があります。必要な内容を移したら削除してください。

1.0 より前に初期化したプロジェクトには、`.claude/commands/openspec/` などのさらに古いファイルがあります。過去のリリースから未変更なら、`update` は確認せずに削除します。変更されている場合は確認し、非対話実行では保持します。`--force` を付けると編集の有無にかかわらず確認なしで削除するため、先にバックアップしてください。

<a id="skills-you-customized"></a>

## カスタマイズしたスキル

更新前に、組み込みスキルの編集内容と、そのフォルダ内に追加したファイルを保存してください。OpenSpec は各フォルダを、CLI のバージョンに対応する GitHub リリースタグの指示で置き換えます。

更新後もカスタマイズを維持するには、`update` が書き込まない場所へ置きます。

- **プロジェクトの指示**：`openspec/config.yaml` の `context` と `rules` を使うと、スキルを編集せずにエージェントへ指示できます（[プロジェクト設定](../customize/project-config.md)）。
- **独自スキル**：`.agents/skills/team-propose/` など、組み込みスキルと異なる名前にします。`update` は変更しません。

## Windows でコミット済みリンクを使う

リンクも通常のファイルと同様にコミットされます。Windows のチームメンバーがリンクとしてチェックアウトするには、2つの設定が必要です。

**1. Git のリンクを有効にする。** ターミナルで：

```bash
git config --global core.symlinks true
```

または、`git clone -c core.symlinks=true <url>` でクローンします。

**2. Windows の設定で開発者モードを有効にする。** リンクを作成できるようになります。

設定しない場合、リンクは小さなテキストファイルとしてチェックアウトされます。`openspec update` はこれをスキルの通常のコピーへ置き換えます。

## OpenSpec がリンクを作成しないツールを接続する

多くのツールは `.agents/skills/` を直接読み込みます。ツール固有のフォルダだけを読む場合は、[別のツールをリンクする](../reference/supported-tools.md#link-another-tool)のコマンドで共有コピーへ接続してください。

## バージョンが混在するチーム

リポジトリをグローバルスキルへ切り替える前に、全員の CLI をアップグレードしてください。旧版の CLI はプロジェクト内のスキルにしか対応していません。異なるリリースの CLI で同じインストール済みスキルを更新すると、それぞれの CLI のバージョンに対応する指示へ戻ります。

## グローバルに導入済みのスキル

**`npx skills add` で公式スキルを導入済みの場合：** そのインストールを保持したまま `openspec update` を実行してください。プロファイルに応じて組み込みワークフローを更新します。

**手動でグローバルスキルを設定した場合：** 編集内容を保存し、独自スキルを別名へ移してください。切り替える前に、リポジトリからホームフォルダへ作成したリンクを削除します。`openspec init --scope global --tools <id>` で、そのツールが対応する保存先へ設定してください。

## 1.x を使い続ける

すぐにアップグレードする必要はありません。1.x はそのまま動作します。導入方法に応じてバージョンを固定してください。

npm の場合、ターミナルで：

```npm
npm install -g @ayumuwall/openspec@1
```

単体実行版では、リリースを指定します（[インストールオプション](../start/installation.md#install-options)）。日本語版の1.x公開版は v1.15.0 です。

```bash
curl -fsSL https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/scripts/binary/install.sh | OPENSPEC_VERSION=v1.15.0 sh
```

Windows（PowerShell）の場合：

```powershell
$env:OPENSPEC_VERSION = 'v1.15.0'
$installer = Join-Path $env:TEMP ([Guid]::NewGuid().ToString('N') + '.ps1')
try {
    Invoke-WebRequest -UseBasicParsing https://raw.githubusercontent.com/ayumuwall/OpenSpec-J/ja-docs/scripts/binary/install.ps1 -OutFile $installer
    powershell -NoProfile -ExecutionPolicy Bypass -File $installer
} finally {
    Remove-Item -LiteralPath $installer -Force -ErrorAction SilentlyContinue
}
```

`openspec update` が CLI のアップグレードを提案した場合は断ってください。案内を止めるには、`OPENSPEC_NO_UPDATE_CHECK=1` を設定します。
