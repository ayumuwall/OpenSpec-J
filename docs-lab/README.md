# docs-lab：OpenSpec ドキュメントの並行再構築

**ステータス：本文をページ単位で順次追加中。残りは骨組みのみです**（実際の見出しと、サイトがページ説明として取り込む 1 行の `>` 役割説明で構成されています）。公開サイトはこのツリーからビルドされます。`website/docs.sync.config.mjs` が各ファイルを公開ページへ対応付け、旧 `docs/` ツリーはサイトで使われなくなりました。

この README が、どのページを用意し、各ページで何を説明するかという構成を管理します。役割やメッセージから担当ページを逆引きするには、[message-map.md](message-map.md)を使います。文章の書き方（スタイル、語り口、書式）は、`write-openspec-docs`スキルの[writing.md](../.agents/skills/write-openspec-docs/writing.md)で定めています。

## すべてのページに求められる水準

docs-lab の各ページは、既存文を流用せず一から執筆します。旧`docs/`ツリーは事実を確認する資料としてだけ使います。

目指すのは、経験の程度にかかわらず誰もが内容をつかめる、読みやすく筋の通ったページです。何よりシンプルでなければなりません。理解に大きな認知負荷を求めるドキュメントは公開できません。その負荷は、難解な言葉、意味の通らない比喩、説明なしに現れる用語、読書を妨げる書式から生まれます。すべての文に目的を持たせ、容易に読んで理解できるようにします。この基準を満たさない文は、書き直すか削除します。

## 構造ルール

**フォルダは担当領域を表します。** 各ページは`start/`、`guides/`、`customize/`、`multi-repo/`、`reference/`、`help/`のいずれかに置きます。ルートに置くのは、この README、`message-map.md`、`sources.md`だけです。

多くのフォルダは、サイドバーの 1 グループに対応します。`guides/`は Guides グループとして公開し、Understanding OpenSpec、Using OpenSpec、Adopting OpenSpec の 3 グループを既定で展開します。現在は執筆が終わっていないため、Guides 全体を`website/docs.sync.config.mjs`でコメントアウトしています。非公開中のガイドへのリンクは、一覧へ戻すまで GitHub 上の原稿を開きます。

Reference には`reference/architecture/`、`reference/schemas/`、`reference/configuration/`の 3 グループがあります。それぞれの`index.md`がグループの入口です。spec-driven スキーマは、Schemas グループ内の`reference/schemas/spec-driven/index.md`という 1 ページで公開します。

ページラベルと URL は`website/docs.sync.config.mjs`で定義します。原稿ファイルを移動しても、ここで定義した URL は変わりません。

**説明は一度だけ。** ループ（提案、レビュー、適用、アーカイブ）を説明するページは 1 つに集約し、ほかのページでは説明を繰り返さずリンクします。

- `start/quickstart.md`では、利用者が変更をライフサイクルに沿って進める流れと、アーカイブがディスク上で行う処理を説明します。
- `start/overview.md`では、価値提案だけを示し、仕組みは説明しません。
- `guides/concepts.md`では、仕様、変更、デルタを説明します。ループは説明せず、クイックスタートへリンクします。`specs/`と`changes/`は対応する概念の説明内で示し、独立したディレクトリ構成セクションは作りません。
- `start/installation.md`ではインストールを、`start/setup.md`では init とその生成物を説明します。クイックスタートは両ページへの前提条件リンクから始め、その後 explore へ進みます。

**Guides と Reference の違い。** `reference/skills.md`では、各スキルの仕様として、引数、作成するもの、返答内容を扱います。ガイドページ（Using と Adopting のサブグループ）では、どのスキルをいつ使うか、複数のスキルをどう組み合わせるかといった、人が判断するための情報を扱い、スキルの仕組みは繰り返しません。`reference/architecture/`だけは、必要事項を引くための Reference という原則の例外です。説明中心の内容ですが、3 ページに収まる現状では便宜上ここへ置いています。コントリビューター向け内部情報を取り込むなどして拡大した場合は、専用のフォルダとタブを検討します。

**Reference は正確に引くための情報です。** `reference/schemas/`と`reference/configuration/`では、キー、値、型、既定値、保存場所を表やコードブロックで示します。スキーマとは何か、`config.yaml`へ何を書くかといった解説は Customize または Guides で扱い、Reference からはリンクするだけにします。

Reference 内のページ名には 3 つの規則があります。グループの入口は Overview とし、サイドバーでグループ名を重ねません。1 ファイルを説明するページは、用途を表す概念名の後にファイル名を置きます（Project configuration (config.yaml)、CLI settings (config.json)）。ファイル名自体が一般的な呼称なら`schema.yaml`、製品用語を説明するなら`spec-driven`をそのままタイトルにします。複数ファイルを扱うページは Stores のように概念名だけをタイトルとし、対象ファイルは役割説明で示します。

**FAQ は短く答えます。** 各項目は数行以内の回答か、その内容を扱うページへのリンクにします。手順は FAQ に置きません。回答が長くなったらガイドまたは Reference へ移し、FAQ にはリンクだけを残します。

## ページインデックス：各ページの役割

各表の「役割」は、対象ページ先頭の`>`引用文と一致させます。内容が役割を超えた場合はページを分割するか、両方の役割説明を同時に更新します。

### 開始：「これは何？」から最初のアーカイブされた変更へ

| ページ                                | 役割                                                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Overview](start/overview.md)         | _TODO：2026-08-21 に内容を削除し、一から書き直すまでサイトでも非公開。`/docs`は一時的に Installation へリダイレクトする。以前の役割説明は価値提案として弱いため削除した。詳細は`Notes.md`を参照。_ |
| [Installation](start/installation.md) | `openspec` CLI のインストール、更新、アンインストール。                                                                                                                                            |
| [Set up your project](start/setup.md) | プロジェクトで init を実行し、生成物を確認して設定を調整する。                                                                                                                                     |
| [Quickstart](start/quickstart.md)     | 既存リポジトリで、アイデアを最初のアーカイブ済み変更にするまで。                                                                                                                                   |

### ガイド：システムを理解し、うまく使いこなし、コードベースとチームに導入する

| ページ                                                        | 役割                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Understanding › Concepts](guides/concepts.md)                | 2 種類のアーティファクトと、現在の仕様に対する差分を変更で表す仕組み。                                       |
| [Using › Explore an idea](guides/explore.md)                  | 提案を確定する前に、エージェントとアイデアを練り上げます。                                                   |
| [Using › Review the plan](guides/review-the-plan.md)          | 実装前の 2 分間で、計画の方向違いを見つける。                                                                |
| [Using › Apply a change](guides/apply.md)                     | 計画の実行ペース、コンテキストウィンドウ、中断後の再開方法。                                                 |
| [Using › Change course](guides/change-course.md)              | 進行中の変更を修正するか、一から作り直すかを判断する。                                                       |
| [Adopting › Existing codebases](guides/existing-codebases.md) | 仕様がない既存コードベースへ OpenSpec を導入し、必要な仕様を段階的に追加する。                               |
| [Adopting › Teams](guides/teams.md)                           | チームで OpenSpec を運用する方法として、コミットするもの、変更と PR の関係、アーカイブする時期を説明します。 |

### カスタマイズ：ワークフローをプロジェクトに合わせる

| ページ                                               | 役割                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Overview](customize/overview.md)                    | OpenSpec をカスタマイズする方法。                                                                |
| [Profiles](customize/profiles.md)                    | インストールするワークフローと、スキル・コマンド・その両方のどの形式でインストールするかを選ぶ。 |
| [Project configuration](customize/project-config.md) | `config.yaml`へ数行追加し、プロジェクトに合った方法で変更を計画させる。                          |
| [Schemas](customize/schemas.md)                      | OpenSpec が生成するアーティファクト、その順序、テンプレートを変更する。                          |

### マルチリポジトリ (ベータ)：リポジトリ境界をまたいだ計画

| ページ                                    | 役割                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Stores (beta)](multi-repo/stores.md)     | 1 つのストアを使い、複数リポジトリにまたがる変更を計画する。                                            |
| [Worksets (beta)](multi-repo/worksets.md) | ストアと利用側リポジトリを 1 つのエディタウィンドウで開き、エージェントから両方を参照できるようにする。 |

### リファレンス：参照する、正確かつ完全に

| ページ                                                                                         | 役割                                                                                          |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Skills](reference/skills.md)                                                                  | 全 OpenSpec スキルの引数、生成物、応答内容。                                                  |
| [CLI](reference/cli.md)                                                                        | `openspec` のターミナルコマンド。                                                             |
| [Schemas](reference/schemas/index.md)                                                          | 利用可能なすべてのワークフロースキーマと、それらが定義するアーティファクト。                  |
| [Schemas › schema.yaml](reference/schemas/schema-yaml.md)                                      | スキーマ定義を読み書きするための全フィールド。                                                |
| [Schemas › spec-driven](reference/schemas/spec-driven/index.md)                                | 既定ワークフローのアーティファクト、作成順、形式、生成される変更フォルダ。                    |
| [Configuration](reference/configuration/index.md)                                              | OpenSpec の動作を変更するすべてのファイルと設定、およびそれぞれの場所。                       |
| [Configuration › Project configuration (config.yaml)](reference/configuration/config-yaml.md)  | `openspec/config.yaml`の全フィールド：計画に使うスキーマ、コンテキスト、ルール。              |
| [Configuration › Change metadata (.openspec.yaml)](reference/configuration/change-metadata.md) | 変更とともに保存するメタデータの対応フィールドと検証規則。                                    |
| [Configuration › CLI settings (config.json)](reference/configuration/config-json.md)           | `config.json`の全フィールドと、マシン上での`openspec` CLI の動作。                            |
| [Configuration › Environment variables](reference/configuration/environment-variables.md)      | OpenSpec が読み取るすべての環境変数。                                                         |
| [Configuration › Stores](reference/configuration/stores.md)                                    | マルチリポジトリストアを構成する`registry.yaml`と`store.yaml`、および各コマンドが使うルート。 |
| [Supported tools](reference/supported-tools.md)                                                | OpenSpec がサポートする AI コーディングツール、およびそれぞれのコマンド構文。                 |
| [Glossary](reference/glossary.md)                                                              | OpenSpec の全用語を 1 行ずつ説明する。                                                        |
| [Architecture](reference/architecture/index.md) (ドラフト完了までサイトから非公開)             | OPSX の内部構造。                                                                             |
| [Architecture › Workflow runs](reference/architecture/workflow-runs.md)                        | ワークフローが呼び出されてからアーティファクトを書き出すまでの実行過程。                      |
| [Architecture › Design decisions](reference/architecture/design-decisions.md)                  | OPSX がそのように動作する理由。                                                               |

### ヘルプ：行き詰まったとき (ドラフト完了までサイトから非公開、Open TODOs を参照)

| ページ                                     | 役割                                                |
| ------------------------------------------ | --------------------------------------------------- |
| [FAQ](help/faq.md)                         | 独立したページを必要としない質問への短い回答。      |
| [Troubleshooting](help/troubleshooting.md) | OpenSpec が期待どおりに動かない場合の症状と解決策。 |

### レガシー：古いワークフローを安全に移行する (ドラフト完了までサイトから非公開、Open TODOs を参照)

| ページ                                                         | 役割                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| [Migrating from the legacy workflow](help/legacy/migration.md) | レガシーな `/openspec:*` コマンドから OPSX への移行。 |

## 古いドキュメント

`docs/`は旧ドキュメントです。docs-lab がその範囲をすべてカバーした時点で削除します。文章は AI 生成文の寄せ集めになっているため流用せず、事実確認の資料としてだけ使います。

削除までは`docs/`を変更しません。修正は docs-lab へ反映します。

[`sources.md`](sources.md)には、旧`docs/`の各ページと docs-lab での移行先を記録します。執筆時は参照資料の一覧として、切り替え時はリダイレクト一覧として使います。切り替え手順は[Cutover](sources.md#cutover)を参照してください。

## 未完了の TODO

- 未着手：アーキテクチャの 3 ページ（`reference/architecture/index.md`、`workflow-runs.md`、`design-decisions.md`）。見出ししかないため、2026-08-21 に`website/docs.sync.config.mjs`のフォルダ項目をコメントアウトしてサイトから隠した。ファイルは WIP コメント付きで残す。`reference/glossary.md`と`customize/project-config.md`からのリンクは、再公開まで GitHub 上の原稿を開く。
- 未着手：Help と Legacy（`help/faq.md`、`help/troubleshooting.md`、`help/legacy/migration.md`）。FAQ には回答が 1 件しかなく、ほかの 2 ページは見出しだけなので、2026-08-21 に`website/docs.sync.config.mjs`で両セクションを隠した。ファイルは WIP コメント付きで残す。`start/setup.md`と`reference/glossary.md`からのリンクは、再公開まで GitHub 上の原稿を開く。
- 未着手：`start/overview.md`は意図的に空です。2026-08-21 にランディングページをゼロから書き直すため、骨組み（見出し、説明の流れ、図のギャラリー）を削除しました。以前の価値提案（「コードを書く前の、共有できレビュー可能な計画」）では、プランモードが一般化した現在の OpenSpec の価値を十分に伝えられません。書き直しでは、より大きな機能開発を軌道に乗せて認識を揃えること（チーム、Git ネイティブ、意図した振る舞いと実装の一致、制御ループという考え方）を訴求します。詳細は`Notes.md`の「Start > Overview」にあります。図の候補は削除したギャラリーとともに Git 履歴に残っています。書き直しが完了するまで、このページはサイトから外します。`website/docs.sync.config.mjs`ではエントリをコメントアウトし、`/docs`は Installation へリダイレクトしています（`website/public/_redirects`とドキュメントページルートのフォールバック）。復元時はエントリのコメントを外し、2 つのリダイレクトを削除します。「説明は一度だけ」の規則は維持し、このページではループを価値提案として示すだけにします。
- 製品フィードバック（ドキュメント作業ではない）：spec-driven の design 用`instruction`は、Migration Plan と Open Questions を含む 6 セクションを指定する。一方、`schemas/spec-driven/templates/design.md`には見出しが 4 つしかない。ドキュメントでは両方を原文どおり示す。この不一致は upstream で直す。spec-driven ページをまとめた 2026-08-14 に記録。
- 製品フィードバック（ドキュメント作業ではない）：`openspec store setup --remote`は URL を`store.yaml`へ書くが、Git の`origin`は設定しない。このため、setup 後にそのまま`git push -u origin main`を実行すると失敗する。Stores ページでは`git remote add`を案内する。`openspec doctor`が提示する missing-store 用コマンドは、`store.yaml`ではなく`references:`の remote を使う。Stores ページを移植した 2026-08-21 に記録。
- スタイルガイド（`.agents/skills/write-openspec-docs/writing.md`）への追記候補（2026-08-21、Stores ページのレビュー）：ページでまだ示していない用語を使わない。「ポインター」ではなく「`store:`行」と書き、先に実物を示して定義する。開始状態によって結果が変わる場合は、状態ごとの結果を列挙する。文の主語は「読者」「OpenSpec」「エージェント」のいずれかにし、「resolver」などの実装単位や「store 専用プロジェクト」のような分類を主語にしない。定義済みの用語を後のセクションで再利用するときは、その場で短く意味を補う。
- コードフェンス規則への追記候補（2026-08-21）：Stores ページではコマンドを`bash`フェンスへ置き、1 行の`#`コメントを付ける。OpenSpec の出力は別の`yaml`フェンスへ置く。`customize/schemas.md`には`$`プロンプト付きの`console`フェンスが残っている（24、78、114、115、137、145 行目など）。規則に名前を付け、同ページも統一する。
- モノレポ：message-map の 37 行目は未解決。「パッケージを個別リポジトリとして扱う」という説明は将来 Stores ページへ入る可能性があるが、現状はどのページにもない。

- `reference/cli.md`は執筆済み。実装中のコマンドツリーを基に、コマンド一覧と各コマンドのセクションを作成した（2026-08-11）。`start/setup.md`の「Skills, commands, or both」で設定する`delivery`はコマンド出力としてだけ示し、フィールド仕様は`reference/configuration/config-json.md`で扱う。同ページも執筆済み（2026-08-14）。
- テレメトリは未文書化。`OPENSPEC_TELEMETRY=0`は docs-lab 内に現れず、Deno のインストールコマンドも説明なしで`--allow-net=edge.openspec.dev`を許可している。`reference/configuration/environment-variables.md`へ環境変数、収集内容、オプトアウト、CI での自動無効化を書き、Deno セクションからリンクする。2026-08-07 に記録し、2026-08-10 に移行先を決定。
- 製品フィードバック（ドキュメント作業ではない）：init は、グローバルプロファイルによって生成内容が変わったことを示さない。`profile: custom`の環境では標準環境と異なるワークフローセットを暗黙にインストールするが、init 出力に適用プロファイルは現れない。`installation.md`を確認した 2026-08-05 に記録。upstream の変更を追跡し、ドキュメントで問題を覆い隠さない。
- 製品フィードバック（ドキュメント作業ではない）：既定セットから sync-specs スキルを外す。その役割はワークフローより参照情報に近く、スキル一覧を不必要に長くしている。`start/setup.md`のワークフローツリーを執筆した 2026-08-08 に記録。
- 製品フィードバック（ドキュメント作業ではない）：全ツールの既定インストール先を共有`.agents/`フォルダとし、`.claude/`などのツール固有フォルダを例外にする。ドキュメントの例ではすでに`.agents/`を優先しているため、製品側も合わせる。2026-08-08 に記録。
- `help/troubleshooting.md`の骨組みには、インストール時の失敗（`command not found`、誤った Node.js バージョン、PATH）を扱うセクションがない。旧`docs/troubleshooting.md`では扱っており、`start/installation.md`にも注意書きはあるが、症状から解決策を引ける場所がない。セクションを追加するか、`installation.md`へアンカーを追加する。旧ドキュメントのメッセージ監査時（2026-08-10）に記録。
- 不足しているガイド：反復型フロー。`new`、`continue`、`ff`について、フローの概要、`propose`より適する場面、`ff`と`continue`の使い分けを説明するページがない。旧`docs/workflows.md`には説明があったが、`sources.md`では操作を`guides/apply.md`へ、スキル仕様を`reference/skills.md`へ移しており、選び方だけが移行先を失った。Explore と Review the plan の間に Using ガイドを追加し、`customize/profiles.md`へリンクする案がある。旧ページから再利用できるのは`ff`と`continue`の選択基準だけで、残りは未検証。2026-08-11 に記録。message-map の 29 行目も、apply 時のペースではなく作成段階の選択として修正が必要（2026-08-14）。
- 不足しているガイド：Git との連携。OpenSpec は Git を操作しないため、ブランチを作る時期、タスクごとにコミットするか、PR へ何を含めるか、アーカイブコミットをどこへ置くかを説明するページが必要。`guides/teams.md`はアーカイブと PR の順序だけを扱う。残りは Adopting グループの新しい`guides/`ページで扱う案がある。2026-08-08 に記録。
- `customize/skills.md`は保留中。骨組みは残すが、ページ索引、サイドバー、同期設定には含めない。インストール済みスキルを編集しても`openspec update`で上書きされるため、現時点では有効な案内がない。メッセージマップでも未解決。更新後も編集を維持できる仕組みが加わったら再開する。2026-08-14 に保留。
- `guides/examples.md`は保留中。骨組みは残すが、ページ索引、サイドバー、同期設定には含めない。作り込んだ架空例は、実際の使い方と異なる印象を与える。実利用から得たアーカイブ済み変更を掲載できるようになったら再開する。弱い例とレビュー済み例の比較、アーカイブ済み変更のギャラリーという案はファイル内コメントに残している。2026-08-11 に保留。
- 製品フィードバック（ドキュメント作業ではない）：製品内に`expanded`という用語が残り、update ワークフローにはピッカー用ラベルがない。保存するプロファイル値は`core`と`custom`だけだが、`src/core/templates/workflows/update-change.ts`には`expanded-profile workflow`が残る。`WORKFLOW_PROMPT_META`（`src/commands/config.ts`）にも`update`がなく、`openspec config`は`update` / `Workflow: update`と表示する。ドキュメントでは`core`と`custom`へ統一し、動作は「セットを拡張する」と表現した。2026-08-12 に記録。
- 製品フィードバック（ドキュメント作業ではない）：ワークフローの提供形式をスキルへ一本化する。スキルとコマンドは同じ指示を持ち、Claude Code も upstream でコマンドをスキルへ統合済み。`start/setup.md`では 2 形式の理由を説明するために 1 セクションを使っている。コマンドを廃止すれば各ページを短くできる。2026-08-08 に記録。
- Web サイトの改善候補（文章作業ではない）：i18n。通常検索に加えて、ドキュメントへ質問できる AI 検索。Survey パレット（`DESIGN.md`のトークン）を使ったライト・ダークテーマ。同じ作業で追加できる候補は`llms.txt`、ページ単位の「Markdown としてコピー」、コードブロックのコピー、「GitHub でこのページを編集」。2026-08-11 に記録。
