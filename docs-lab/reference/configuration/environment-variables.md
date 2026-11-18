# 環境変数

> OpenSpec が読み取るすべての環境変数。

<!-- 骨組み：見出しのみ。このページでは、テレメトリのオプトアウト
（README TODO）として OPENSPEC_TELEMETRY=0、DO_NOT_TRACK=1、CI での自動無効化、
収集内容を扱う。start/installation.md の Deno セクションからリンクし、
ネットワーク権限フラグを説明する。XDG 変数は設定/データディレクトリを移動する。 -->

## OPENSPEC_TELEMETRY

## DO_NOT_TRACK

## XDG_CONFIG_HOME と XDG_DATA_HOME

## OPENSPEC_SKILLS_SCOPE

`global` または `project` を設定し、新しいリポジトリで `openspec init` がスキルをインストールする場所を選びます。明示的な `--scope` を優先します。既存のリポジトリ内のスキルは、その保存先を保持します。

チェックアウト内にエージェント用スキルが必要な CI ジョブでは、次のように指定します。

```bash
OPENSPEC_SKILLS_SCOPE=project openspec init --tools claude
```

検証だけのジョブでは、直接 `openspec validate --all` を実行できます。
