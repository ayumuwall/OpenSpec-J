# 現行ページの移行先

旧ページと新ページの対応表です。執筆中は各`docs-lab/`ページの参照元として、切り替え時は
リダイレクト一覧として使用します。移行先の構成は[README.md](README.md)のページ索引を参照してください。

| 現行（`docs/`）                         | 移行先                                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| README.md（索引）                       | `start/overview.md`。概要と案内ページとして書き直す                                                                                                                                  |
| getting-started.md                      | `start/quickstart.md`                                                                                                                                                                |
| installation.md                         | 分割：`start/installation.md`（マシン単位：対応表、更新、アンインストール）、`start/setup.md`（プロジェクト単位：init、init の書き込み内容、スキルとコマンドの配布、ストアへの案内） |
| how-commands-work.md                    | `start/quickstart.md`（インラインラベル）、`help/faq.md`、`help/troubleshooting.md`                                                                                                  |
| existing-projects.md                    | `guides/existing-codebases.md`（「既存のコードベース」）。チュートリアル部分は`start/quickstart.md`へ移す                                                                            |
| overview.md                             | `guides/concepts.md`                                                                                                                                                                 |
| concepts.md                             | `guides/concepts.md`（中核部分）。差分形式は`reference/schemas/spec-driven/index.md`（Delta specs 節）へ移し、埋め込みの用語集表は削除する                                           |
| explore.md                              | `guides/explore.md`                                                                                                                                                                  |
| workflows.md                            | `guides/apply.md`（実行パターン、continue/ff）、`reference/skills.md`                                                                                                                |
| opsx.md                                 | 4 分割：設定は`customize/project-config.md`、コマンドは`reference/skills.md`、考え方は`guides/concepts.md`、アーキテクチャは`reference/architecture/`へ移す                          |
| reviewing-changes.md + writing-specs.md | `guides/review-the-plan.md`（統合）                                                                                                                                                  |
| editing-changes.md                      | `guides/change-course.md`                                                                                                                                                            |
| team-workflow.md                        | `guides/teams.md`                                                                                                                                                                    |
| examples.md                             | 保留：実際にアーカイブされた変更提案ができるまで、`guides/examples.md`のひな形を索引と同期設定から外しておく（README の TODO を参照）                                                |
| customization.md                        | `customize/project-config.md`、`customize/schemas.md`、`customize/overview.md`（判断手順）。schema.yaml のフィールドは`reference/schemas/schema-yaml.md`へ移す                       |
| multi-language.md                       | `customize/project-config.md`の§context、「別の言語」の注意書き                                                                                                                      |
| stores-beta/user-guide.md               | `multi-repo/stores.md`。worksets 節は`multi-repo/worksets.md`へ移す                                                                                                                  |
| commands.md                             | `reference/skills.md`（旧`/openspec:*`節は削除）                                                                                                                                     |
| cli.md                                  | `reference/cli.md`（インストール部分は`start/installation.md`へ移す）                                                                                                                |
| supported-tools.md                      | `reference/supported-tools.md`                                                                                                                                                       |
| glossary.md                             | `reference/glossary.md`                                                                                                                                                              |
| faq.md                                  | `help/faq.md`（未公開モデルに関する記述は削除し、更新とアンインストールは`start/installation.md`へ移す）                                                                             |
| troubleshooting.md                      | `help/troubleshooting.md`。5 か所に重複していた内容と「ヘルプを得る」を集約する                                                                                                      |
| migration-guide.md                      | `help/legacy/migration.md`（補助ページへ変更）                                                                                                                                       |
| agent-contract.md                       | **サイト外**。リポジトリ側のコントリビューター向けドキュメントへ移す                                                                                                                 |

単一の現行ページを参照元としない新規ページは、`customize/overview.md`、`customize/profiles.md`
（現状は 12 ページに 2 行ほどの断片が点在）、`reference/schemas/`節、
`reference/configuration/`節です。後者 2 つは、当初予定していた`reference/file-formats.md`を置き換えます。

## Cutover

`website/docs.sync.config.mjs`の参照先をここへ変更し、`website/public/_redirects`へ
旧ページから新ページへのリダイレクトを追加します。`llms.txt`、`llms-full.txt`、
ページごとの Markdown ルートも確認します。`docs/`は変更せず、そのまま残します。
サイトが読み込まなくなるだけです。
