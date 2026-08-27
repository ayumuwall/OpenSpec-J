# 用語集

> OpenSpec の各用語を 1 行ずつ説明する。

OpenSpec には、Git、CI、エージェントツールでは別の意味を持つ言葉があります。各行では OpenSpec での意味を説明し、最後の列から詳しいページへ移動できます。

| 用語                | 定義                                                                                                                                                                          | 詳細                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Apply**           | 変更提案のタスクを実装します。スキル：`openspec-apply-change`。                                                                                                               | [変更を適用する](../guides/apply.md)                          |
| **Archive**         | 変更提案を完了します。デルタを本仕様へマージし、フォルダを`openspec/changes/archive/`へ移します。                                                                             | [クイックスタート](../start/quickstart.md)                    |
| **Artifact**        | 変更提案に含まれる計画文書です。`proposal.md`、デルタ仕様、`design.md`、`tasks.md`が該当します。ビルド成果物ではありません。                                                  | [概念](../guides/concepts.md)                                 |
| **Capability**      | システムの振る舞いを分けた 1 つの領域です。各 capability には`openspec/specs/<capability>/spec.md`に仕様が 1 つあります。                                                     | [概念](../guides/concepts.md)                                 |
| **Change proposal** | 1 つの作業単位です。`openspec/changes/<name>/`配下のフォルダに計画アーティファクトを置きます。多くの場合は「change」と略します。Git コミットではありません。                  | [概念](../guides/concepts.md)                                 |
| **Command**         | ワークフローを起動する入力項目です。表記はツールによって異なります（`/opsx:propose`、`/opsx-propose`）。ドキュメントでは代わりにスキル名でワークフローを示します。            | [対応ツール](supported-tools.md)                              |
| **Continue**        | 既存の変更提案で次の計画アーティファクトを作成します。スキル：`openspec-continue-change`。                                                                                    | [スキル](skills.md)                                           |
| **Delivery**        | ワークフローのインストール方法です。スキル、コマンド、またはその両方を選べます。                                                                                              | [プロジェクトをセットアップする](../start/setup.md)           |
| **Delta spec**      | 変更提案内で、変わる内容だけを`ADDED`、`MODIFIED`、`REMOVED`、`RENAMED`見出しの下に記載する仕様です。                                                                         | [デルタ仕様](schemas/spec-driven/index.md#delta-specs-specmd) |
| **Explore**         | 提案前にエージェントとアイデアを検討します。コードは書きません。スキル：`openspec-explore`。                                                                                  | [アイデアを探索する](../guides/explore.md)                    |
| **Fast-forward**    | すべての計画アーティファクトを 1 回で作成し、実装可能な変更提案にします。スキル：`openspec-ff-change`。Git の fast-forward ではありません。                                   | [スキル](skills.md)                                           |
| **Legacy workflow** | OPSX より前の`/openspec:*`コマンドです。                                                                                                                                      | [移行](../help/legacy/migration.md)                           |
| **Loop**            | 変更提案が進むサイクルです。explore、propose、review、apply、archive の順に進みます。                                                                                         | [クイックスタート](../start/quickstart.md)                    |
| **Main specs**      | `openspec/specs/`ツリーです。現在合意されているシステムの振る舞いを表します。archive するとデルタがここへマージされます。                                                     | [概念](../guides/concepts.md)                                 |
| **OpenSpec root**   | コマンドが解決して操作する`openspec/`ツリーです。自分のリポジトリまたはストアのツリーを使います。                                                                             | [ストア](configuration/stores.md)                             |
| **OPSX**            | 現在の OpenSpec ワークフローシステムと、インストールするコマンド接頭辞（`/opsx:`）です。                                                                                      | [アーキテクチャ](architecture/index.md)                       |
| **Profile**         | init がインストールするワークフローを決めます。`core`または`custom`です。                                                                                                     | [プロファイル](../customize/profiles.md)                      |
| **Propose**         | 変更提案を作成し、すべての計画アーティファクトを 1 手順で生成します。スキル：`openspec-propose`。                                                                             | [クイックスタート](../start/quickstart.md)                    |
| **Registry**        | `registry.yaml`に保存される、マシン単位の登録済みストア一覧です。パッケージレジストリではありません。                                                                         | [ストア](configuration/stores.md)                             |
| **Requirement**     | システムが満たす必要のある 1 つの振る舞いです。仕様内で SHALL を使い、`### Requirement:`として記述します。                                                                    | [デルタ仕様](schemas/spec-driven/index.md#delta-specs-specmd) |
| **Scenario**        | 要件の下へ WHEN/THEN 形式で記述する、テスト可能な例です。                                                                                                                     | [デルタ仕様](schemas/spec-driven/index.md#delta-specs-specmd) |
| **Schema**          | 変更提案が作成するアーティファクトと、その順序の定義です。JSON Schema ではありません。                                                                                        | [スキーマ](schemas/index.md)                                  |
| **Skill**           | AI ツールが読み取る場所（`.agents/skills/`など）へインストールする、ワークフローの指示です。                                                                                  | [スキル](skills.md)                                           |
| **Spec**            | 1 つの capability の現在の振る舞いを説明するファイルです。`openspec/specs/<capability>/spec.md`に置きます。                                                                   | [概念](../guides/concepts.md)                                 |
| **spec-driven**     | 既定のスキーマです。proposal、デルタ仕様、design、tasks の順に作成します。                                                                                                    | [spec-driven](schemas/spec-driven/index.md)                   |
| **Store**           | 複数リポジトリにまたがる計画のために、マシンへ登録する独立した OpenSpec リポジトリです。データストアではありません。                                                          | [ストア（ベータ）](../multi-repo/stores.md)                   |
| **Sync**            | archive せず、実装済みのデルタを本仕様へマージします。スキル：`openspec-sync-specs`。                                                                                         | [スキル](skills.md)                                           |
| **Template**        | スキーマが各アーティファクトへ提供する開始時の内容です。                                                                                                                      | [スキーマ](../customize/schemas.md)                           |
| **Update**          | スキル（`openspec-update-change`）では、変更提案の計画アーティファクトを修正します。CLI コマンド（`openspec update`）では、インストール済みの OpenSpec ファイルを更新します。 | [計画を変更する](../guides/change-course.md)、[CLI](cli.md)   |
| **Verify**          | archive 前に、実装が変更提案のアーティファクトと一致するか確認します。スキル：`openspec-verify-change`。                                                                      | [スキル](skills.md)                                           |
| **Workflow**        | OpenSpec の名前付き操作です（propose、apply、archive など）。AI ツールへスキルまたはコマンドとしてインストールします。                                                        | [プロジェクトをセットアップする](../start/setup.md)           |
| **Workset**         | 1 つのツールでまとめて開く、個人用かつローカルなフォルダ群です。ストアではなく、何も共有しません。                                                                            | [workset（ベータ）](../multi-repo/worksets.md)                |
