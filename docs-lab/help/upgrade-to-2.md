# 2.0 へのアップグレード

> OpenSpec 2.0 の変更点と、プロジェクトの移行手順を説明します。

CLI を更新し、各プロジェクトで `openspec update` を実行してください。スキルは1つの共有フォルダへ移動し、旧コマンドファイルは削除されます。編集済みの旧コマンドファイルや旧スキルのコピーは保持されます。

> [!WARNING]
> `.agents/skills/` に OpenSpec がインストールしたスキル内の編集は、`update` で上書きされ、コピーも残りません。先に保存してください：[カスタマイズしたスキル](#skills-you-customized)。

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

**3. 結果をコミットする。** リンクも通常のファイルと同様にコミットされます。

`update` を再実行しても変更は生じません。

## update が行う処理

- **スキル**：`.agents/skills/` に一度だけ書き込み、必要なツールの固有フォルダ（例：`.claude/skills/`）からリンクします。
- **旧スキルのコピー**：旧版がツール固有のフォルダへ書き込んだコピーを削除します。
- **コマンドファイル**：旧版が生成したコマンドファイルを削除します。
- **編集済みの旧ファイル**：編集済みのコマンドファイルや、ツール固有フォルダ内のスキルのコピーは保持し、一覧に表示します。対処方法は後述します。
- **OpenSpec がインストールするスキル**：1.x の更新と同様に、その場で更新します。スキル内の編集は上書きされ、該当するスキル名を表示します。
- **リンク**：プロジェクト外へのリンクはたどりません。
- **プロジェクト外**：変更するのはグローバル設定、MiniMax Code 用の `~/.minimax/skills/`、`~/.codex/prompts/` 内の旧 OpenSpec プロンプトだけです。旧プロンプトの削除には、`--force` または利用者の確認が必要です。

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

## 編集済みのスキルフォルダ

ツール固有のフォルダにある旧スキルのコピーを編集していた場合も、`update` は保持します。固有フォルダと `.agents/skills/` の両方を読むツールでは、同じスキルを2回読み込むことがあります。必要な内容を移したら、保持されたフォルダを削除してください。

MiniMax Code は `~/.minimax/skills/` にスキルを配置します。そこで編集したスキルを更新するときは、先に同じフォルダの `SKILL.md.bak` へ保存します。

<a id="skills-you-customized"></a>

## カスタマイズしたスキル

`update` は `.agents/skills/openspec-propose/SKILL.md` など、`.agents/skills/` に OpenSpec がインストールするスキルをすべて書き直します。1.x でも同じ動作でした。編集内容は上書きされ、バックアップは作成されません。該当するスキルを `update` が表示します。

```
OpenSpec がインストールするスキル1件の編集内容を上書きしました: .agents/skills/openspec-propose/SKILL.md。OpenSpec は更新のたびにこのスキルを再生成し、コピーは残しません。Git から編集内容を復元し、継続して使う変更は別名の独自スキルへ保存してください。
```

変更前に対象を確認するには、`openspec update --dry-run` を実行します。該当するスキル名が表示されます。

更新後もカスタマイズを維持するには、`update` が書き込まない場所へ置きます。

- **プロジェクトの指示**：`openspec/config.yaml` の `context` と `rules` を使うと、スキルを編集せずにエージェントへ指示できます（[プロジェクト設定](../customize/project-config.md)）。
- **独自スキル**：`.agents/skills/team-propose/` など、`openspec-` で始まらない名前にします。`update` は変更しません。

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
