# 概要

> OpenSpec の動作を変えるすべてのファイルと設定、およびその保存場所。

| ファイル                                               | 保存場所                                                    | 設定内容                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| [プロジェクト設定（config.yaml）](config-yaml.md)      | `openspec/config.yaml`                                      | このプロジェクトの計画で使うスキーマ、コンテキスト、ルール         |
| [変更メタデータ（.openspec.yaml）](change-metadata.md) | `openspec/changes/<name>/.openspec.yaml`                    | 1 つの変更で使うワークフロースキーマ、ゴール、スコープ、仕様の例外 |
| [CLI 設定（config.json）](config-json.md)              | `~/.config/openspec/config.json`（Windows では異なります）  | 自分のマシンでの openspec CLI の動作                               |
| [環境変数](environment-variables.md)                   | シェルまたは CI 環境                                        | テレメトリのオプトアウトと、設定/データディレクトリの場所          |
| [ストア](stores.md)                                    | `~/.local/share/openspec/stores/`（Windows では異なります） | マルチリポジトリ用ストアのレジストリとメタデータ                   |
