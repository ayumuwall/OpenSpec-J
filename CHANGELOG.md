# @ayumuwall/openspec 変更履歴

OpenSpec-J（Fission-AI/OpenSpec の日本語フォーク）の公式変更履歴です。本プロジェクトで行った変更は **[OpenSpec-J]** タグで記載しています。

## 1.12.0

- **[OpenSpec-J]** OpenSpec v1.12.0 の upstream 変更を取り込み、CLI、初期化・更新フロー、OPSX ワークフロー、ドキュメントの追加・変更された人間向け文言を日本語化
- **[OpenSpec-J]** SourceCraft Code Assistant、`openspec validate --report findings`、空ディレクトリ保持、共通 IDE 再起動案内に対応し、静的配布スキルと parity ハッシュを再生成
- **[OpenSpec-J] 翻訳棚卸し:** シェル補完、設定表示、OpenSpec ルート検出エラー、テレメトリー通知に残っていた英語文言を日本語化

### マイナー変更

- [#1171](https://github.com/Fission-AI/OpenSpec/pull/1171) [`44a39eb`](https://github.com/Fission-AI/OpenSpec/commit/44a39eb24b7ca0f2cf08df697888c3b1e9818a5a) [@aleksandr4842](https://github.com/aleksandr4842) に感謝します！ - SourceCraft Code Assistant の VS Code 拡張機能で、プロジェクトスキルとコマンドを利用できるようになりました。

- [#1713](https://github.com/Fission-AI/OpenSpec/pull/1713) [`db03c6c`](https://github.com/Fission-AI/OpenSpec/commit/db03c6c4b0ef8a05308497482bdc5fc4dd151569) [@Marzx13](https://github.com/Marzx13) に感謝します！ - ### 新機能

  - 明示的に指定した一括検証の範囲で利用できる `openspec validate --report findings` を追加しました。全件実行時の集計と終了コードは維持しながら、エラー・警告・情報がある項目だけを返します。JSON 出力にはレポート種別と検証範囲が含まれ、人間向け出力には各検出事項のパスとメッセージが表示されます。既定の完全レポートに変更はありません。

### パッチ変更

- [#1710](https://github.com/Fission-AI/OpenSpec/pull/1710) [`a4fcdbe`](https://github.com/Fission-AI/OpenSpec/commit/a4fcdbece6f4f7ce86fbd57230be2753945020ba) [@ryandemelo](https://github.com/ryandemelo) に感謝します！ - 検証中に見つかった仕様差分のマージ競合を、終了コードを変えずに情報レベルの検出事項として報告するようにしました。成功したテキストレポートにも表示されます。また、読み取れない本仕様を存在しない仕様と誤認しないよう、ファイルシステムの読み取りエラーを維持します。

  助言目的のマージ事前検査で入力を解決できない場合も、検証レポートの内容を失わないようにしました。

- [#1017](https://github.com/Fission-AI/OpenSpec/pull/1017) [`b976106`](https://github.com/Fission-AI/OpenSpec/commit/b976106d954a0eebbf94ec26b056208968313a4d) [@DanRioDev](https://github.com/DanRioDev) に感謝します！ - explore モードのガイダンスを改善しました。依存関係を踏まえた有用な質問を行い、既定の選択肢を提案し、リポジトリを調べれば分かる事実をユーザーへ尋ねる前にコードベースを確認します。

- [#1737](https://github.com/Fission-AI/OpenSpec/pull/1737) [`98bf53e`](https://github.com/Fission-AI/OpenSpec/commit/98bf53e59ec91eb71de4ed0e8036459de7352585) [@clay-good](https://github.com/clay-good) に感謝します！ - propose と fast-forward の各ワークフローで、アーティファクトを作成する前に関連するプロジェクトコード、テスト、ドキュメントを調べるよう案内します。基本的な調査を実装タスクへ先送りせず、既存の実装を計画へ反映できるようになりました。

- [#786](https://github.com/Fission-AI/OpenSpec/pull/786) [`0296401`](https://github.com/Fission-AI/OpenSpec/commit/0296401b823726ae6a8d8505104e95c7899b3056) [@Br1an67](https://github.com/Br1an67) に感謝します！ - 初期化後も空の OpenSpec ディレクトリを Git で保持するようにしました。init を再実行すると、不足しているディレクトリマーカーが復元されます。既存ファイルを上書きしたり、マーカーのシンボリックリンクをたどったりすることはありません。

- [#1725](https://github.com/Fission-AI/OpenSpec/pull/1725) [`cd72444`](https://github.com/Fission-AI/OpenSpec/commit/cd724449aced1655eb513f3207600bec074c7588) [@aron-intframe](https://github.com/aron-intframe) に感謝します！ - `openspec init` と `openspec update` で、IDE の再起動案内を共通化しました。コマンドの場合は「コマンドを更新するため IDE を再起動してください。」、スキルの場合は「スキルを更新するため IDE を再起動してください。」と表示します。ワークフローを削除した場合にも対応し、新しいファイルを生成したとは案内しません。

## 1.11.0

- **[OpenSpec-J]** OpenSpec v1.11.0 の upstream 変更を取り込み、CLI、スキーマ、OPSXワークフロー、Webサイトの追加・変更された人間向け文言を日本語化
- **[OpenSpec-J]** `openspec status --all`、`openspec show --diff`、安全な `schema init --default`、Purposeプレースホルダー検証に対応
- **[OpenSpec-J]** 日本語の `入力` 見出しで OpenCode と Command Code に引数を渡す互換処理を全角コロンにも対応させ、静的配布スキルとparityハッシュを再生成

### マイナー変更

- [#1301](https://github.com/Fission-AI/OpenSpec/pull/1301) [`a7353ae`](https://github.com/Fission-AI/OpenSpec/commit/a7353aea9a0b23762602badf5055a157a76f62b1) [@m-tanner](https://github.com/m-tanner) に感謝します！ - すべてのアクティブな変更を、変更ごとにCLIを起動せず1つのプロセスで報告する `openspec status --all` を追加しました。`--all --json` は変更名順の単一エンベロープ `{ "changes": [ <status>, ... ], "root" }` を出力します。読み込みに失敗した変更は全体を中断せず、その位置に `{ "changeName", "status": [diagnostic] }` として格納されます。一部に失敗がある場合、テキスト・JSONの両モードで完全なJSONエンベロープを維持したまま終了コード1を返します。`--change` とは同時に指定できません。

- [#980](https://github.com/Fission-AI/OpenSpec/pull/980) [`dd7cea3`](https://github.com/Fission-AI/OpenSpec/commit/dd7cea3ffed4a22421dce02f54c37c4f076b44f0) [@bsmedberg-xometry](https://github.com/bsmedberg-xometry) に感謝します！ - `show` に `--diff` を追加しました。デルタ要件のブロック全体を再表示する代わりに、本仕様で置き換える要件との差分を表示します。MODIFIED要件には維持する全シナリオを含める必要があるため、従来はファイルを手作業で比較しなければ実際の変更点を把握できませんでした。`openspec show <change> --diff` は、要件ごとに色付きのunified diff（追加は緑、削除は赤）、ADDED要件の全文、REMOVED要件に記述されたReason/Migration、RENAMED要件のFROM/TOを表示します。同じデルタ内で名前変更と内容変更を行う要件は、旧名称の要件と比較します。`--json --diff` は既存のペイロード形式を維持し、該当するMODIFIEDデルタだけに `diff` と `warning` フィールドを追加します。本仕様は変更と同じルートから解決されるため、`--store <id>` を指定するとそのストアの仕様と比較します。`--diff` を付けない `openspec show <change>` の出力は従来どおりです。

### パッチ変更

- [#830](https://github.com/Fission-AI/OpenSpec/pull/830) [`109f81f`](https://github.com/Fission-AI/OpenSpec/commit/109f81f17d3bb99eb6fb2c9a33ec9e8ab0680bb2) [@alfred-openspec](https://github.com/alfred-openspec) に感謝します！ - Antigravityのスキルとワークフローを `.agents/` に出力し、他ツールと共有するスキルツリーの所有権を調整するとともに、既存の `.agent/` インストールを安全に移行するようにしました。

- [#1712](https://github.com/Fission-AI/OpenSpec/pull/1712) [`04b37ac`](https://github.com/Fission-AI/OpenSpec/commit/04b37ac1d5c852385d2effbff196ddb4fdd1700c) [@Marzx13](https://github.com/Marzx13) に感謝します！ - archiveで要件名を変更した際、名前を変えたブロックを仕様末尾へ移動せず、元の位置を維持するようにしました。

- [#1716](https://github.com/Fission-AI/OpenSpec/pull/1716) [`7010e26`](https://github.com/Fission-AI/OpenSpec/commit/7010e268907598c385eb6686699928fbd5a3a733) [@aymanxdev](https://github.com/aymanxdev) に感謝します！ - exploreスキルがファイルを作成・編集・移動・削除できるコマンドやツールを使う前に、対象範囲を明示した確認を必須にしました。従来のガードレールでは「ユーザーが依頼した場合」にスキル自身の確認質問への回答も含まれ得たため、エージェントが設計の相談を作業開始の承認と解釈し、依頼されていないスキーマ作成や `openspec/config.yaml` の編集を始める可能性がありました。スキルと `/opsx:explore` コマンドは、作成・変更を提案するアーティファクトやファイルを具体的に示し、明確なyes/no質問を行い、別メッセージで確認を得るまで書き込まないようエージェントへ指示します。読み取り専用のコマンドやツールは確認なしで引き続き利用でき、承認済みの範囲を広げる場合は改めて確認が必要です。

- [#1199](https://github.com/Fission-AI/OpenSpec/pull/1199) [`ab81a4b`](https://github.com/Fission-AI/OpenSpec/commit/ab81a4b43a7bd769b1d2a33457b7b708b8c52516) [@leo-ar](https://github.com/leo-ar) に感謝します！ - Fish補完を改善し、対象が実際のパスである場合を除いて、コマンド、サブコマンド、フラグ、位置番号付き引数の補完がファイルシステム候補へフォールバックしないようにしました。

- [#1010](https://github.com/Fission-AI/OpenSpec/pull/1010) [`e5e350d`](https://github.com/Fission-AI/OpenSpec/commit/e5e350d04b5d635b56846f46a212b097cd00eeb6) [@Dansyuqri](https://github.com/Dansyuqri) に感謝します！ - exploreモードの図をプレーンASCIIで描くようにしました。exploreスキルと `/opsx:explore` コマンドの作例では、端末・フォント・ロケールによって表示幅が変わるUnicodeの罫線・矢印・マーカー文字を使用していました。エージェントがこの形式を模倣すると、余白付きボックスや整列した表がずれることがありました。

- [`2fa679f`](https://github.com/Fission-AI/OpenSpec/commit/2fa679f180424d46ce7d8789eb85138397844a89) [@ryandemelo](https://github.com/ryandemelo) に感謝します！ - `schema init --default` がスキーマをインストールする前に設定変更を検証してステージングし、いずれかのインストールに失敗した場合は両方のファイルをロールバックするようにしました。作成されるステージング・バックアップディレクトリはスキーマ検出から除外されるため、実際のスキーマ候補として表示されません。

- [#1671](https://github.com/Fission-AI/OpenSpec/pull/1671) [`126c5d6`](https://github.com/Fission-AI/OpenSpec/commit/126c5d6c59d63b7e70314bcc776104c7cc548819) [@kitimark](https://github.com/kitimark) に感謝します！ - `openspec validate` が、新規機能のarchive時に書かれるプレースホルダーのままの `## Purpose` を成功扱いせず報告するようにしました。プレースホルダーは簡潔すぎる記述を検出する50文字の下限より長いため、Purposeが未記述であることを示す文そのものが、未記述を見つけるための検査を通過していました。つまり、Purposeが `Does stuff.` の仕様は `--strict` で失敗する一方、実質的に何も書かれていない仕様は成功し、どのコマンドも成功を報告したままプレースホルダーを残し続けることができました。

  警告として報告するため、すでにディスク上にプレースホルダーがあるプロジェクトも既定の検証には引き続き成功し、`--strict` の場合だけ失敗します。デルタ内の `## Purpose` は機能作成時にしか読み込まれず既存のPurposeを置き換えられないため、メッセージでは本仕様を直接編集するよう案内します。

  誤検出を避けるため、検出範囲は限定しています。archiveが生成するプレースホルダーは、書き込み側と同じ定義を使い、Purpose内のどこに現れても認識します。それ以外はPurposeの冒頭が `TBD` または `TODO` の場合だけ対象となるため、`The retry budget is TBD pending benchmarks` は有効なPurposeとして扱われ、`TBDs` のような単語もマーカーにはなりません。Purpose内のフェンス付きコードはPurpose自身の記述ではなく引用内容とみなすため、プレースホルダーについて説明する仕様は検証に成功します。空のPurposeの扱いは変わりません。また、プレースホルダーとして報告したPurposeを「短すぎる」と重ねて報告しないため、`TBD` だけの場合も指摘は2件ではなく1件です。

  `openspec archive` への影響はありません。再構築した仕様を `--strict` なしで検証するため、archiveが出力した仕様は従来どおり検証に成功し、archiveが書き込む文言も変更されません。

## 1.10.0

- **[OpenSpec-J]** OpenSpec v1.10.0 の upstream 変更を取り込み、ドキュメント、スキーマ、CLI、OPSXワークフローの追加・変更された人間向け文言を日本語化
- **[OpenSpec-J]** `openspec init --language`、Zed Agent、初回シェル補完案内、仕様廃止時の安全な診断、条件付きIDE再起動に対応
- **[OpenSpec-J]** OpenCodeの引数挿入を英語・日本語の入力見出しに対応させ、日本語テンプレートでも `$ARGUMENTS` を確実に渡す互換処理を追加
- **[OpenSpec-J]** 静的配布スキルを再生成し、テンプレートparityハッシュと日本語版テスト期待値を更新

### マイナー変更

- [#1685](https://github.com/Fission-AI/OpenSpec/pull/1685) [`c747ed1`](https://github.com/Fission-AI/OpenSpec/commit/c747ed1f34459ca6bc15d43ad9f68dfdf7750875) [@clay-good](https://github.com/clay-good) に感謝します！ - 新規プロジェクトのアーティファクト記述言語を設定する `openspec init --language <language>` を追加しました。

### パッチ変更

- [#1704](https://github.com/Fission-AI/OpenSpec/pull/1704) [`7276c6c`](https://github.com/Fission-AI/OpenSpec/commit/7276c6c26832f699a63544302d38b1af8ddb9844) [@clay-good](https://github.com/clay-good) に感謝します！ - npm の `postinstall` スクリプトを廃止しました。シェル補完の案内は、対話端末でのCLI初回実行時に標準エラーへ一度だけ表示し、補完が導入済みなら表示しません。公開パッケージは `preinstall` / `install` / `postinstall` を宣言しないため、レジストリからのインストール時にOpenSpecのコードは実行されません。案内は `OPENSPEC_NO_COMPLETIONS=1` で抑止できます。

- [#1656](https://github.com/Fission-AI/OpenSpec/pull/1656) [`a72a74d`](https://github.com/Fission-AI/OpenSpec/commit/a72a74de6571c26fd79a193bb33fa3b8e1a767fb) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - `openspec update` はIDE内で動作するツールを更新した場合だけ、IDEの再起動を案内します。Claude Code、Codex、Gemini CLIなどのCLIツールでは不要な再起動案内を表示しません。

- [#1703](https://github.com/Fission-AI/OpenSpec/pull/1703) [`9643888`](https://github.com/Fission-AI/OpenSpec/commit/9643888a7525467c7a076bfec9bb075910e78bb8) [@clay-good](https://github.com/clay-good) に感謝します！ - spec-driven の `specs` 指示で、本仕様の読み取りと編集にストア対応ルートを使うよう修正しました。MODIFIED手順と残った `TBD` Purposeの修正先に `<planningHome.root>/openspec/specs/...` を使うため、`--store`、プロジェクトの `store:` ポインター、グローバル既定ストアのいずれでも正しい仕様を参照します。[#1702](https://github.com/Fission-AI/OpenSpec/issues/1702) を修正しました。

- [#1699](https://github.com/Fission-AI/OpenSpec/pull/1699) [`18688c8`](https://github.com/Fission-AI/OpenSpec/commit/18688c8b27820da3435a47a7f11e90073724b728) [@clay-good](https://github.com/clay-good) に感謝します！ - archiveで最後の要件を削除した仕様に、マージで安全に扱えない内容が残る場合の案内を追加しました。中止時に妨げとなる行と、適用できない `retire_capabilities` マーカーを報告します。端末へ表示するユーザー記述内容から制御文字を除去し、長さも制限します。

- [#1660](https://github.com/Fission-AI/OpenSpec/pull/1660) [`7da3f34`](https://github.com/Fission-AI/OpenSpec/commit/7da3f34fb66d602bd987caa7dddcf3d6621e7d44) [@clay-good](https://github.com/clay-good) に感謝します！ - 生成する各タスクに、完了を検証する方法の記載を必須としました。

## 1.9.0

- **[OpenSpec-J]** OpenSpec v1.8.0〜v1.9.0 の upstream 変更を取り込み、README・ドキュメント・スキーマ・CLI・OPSX ワークフローの追加／変更された人間向け文言を日本語化
- **[OpenSpec-J]** `agents`／Command Code のツール対応、GitHub Copilot クラウドエージェント、ストア選択、`validate --archived` などの新機能に伴う案内・エラー・進捗表示を日本語化
- **[OpenSpec-J]** Command Code／Oh My Pi／Pi の入力見出し検出を `Input`／`入力` の両方に対応させ、日本語テンプレートでも引数プレースホルダーの挿入と再生成時の重複防止を維持
- **[OpenSpec-J]** 日本語テンプレートから静的配布用 `skills/` を再生成し、v1.9.0 の生成内容と parity ハッシュを更新
- **[OpenSpec-J]** README の同期元バージョンと npm パッケージバージョンを OpenSpec v1.9.0 に更新

### マイナー変更

- [#1622](https://github.com/ayumuwall/OpenSpec-J/pull/1622) [`59c16a4`](https://github.com/ayumuwall/OpenSpec-J/commit/59c16a4461254ed984d1d5e29d00af1a5610035a) [@clay-good](https://github.com/clay-good) に感謝します！ - ### 新機能

  - **Command Code のコマンドアダプター** — Command Code をアダプター対応の正式なツールとして追加しました。`openspec init` は `.commandcode/skills/` のスキルとともに `.commandcode/commands/opsx-<id>.md`（`/opsx-<id>` として実行）へ OpenSpec コマンドを生成し、Command Code が文書化しているカスタムスラッシュコマンドの形式に合わせます。

- [#1613](https://github.com/ayumuwall/OpenSpec-J/pull/1613) [`42d7f67`](https://github.com/ayumuwall/OpenSpec-J/commit/42d7f673bc5f13378451267c8a9d0c23f63a2d1a) [@Angelthebestone](https://github.com/Angelthebestone) に感謝します！ - ### 新機能

  - **Command Code 対応** — `openspec init` が、アダプターを使わないスキル専用ツールとして Command Code をサポートします。OpenSpec スキルは `.commandcode/skills/` にインストールされ、Command Code 本来のスキル形式に合わせて `/openspec-*` コマンドとして呼び出せます。

- [#1604](https://github.com/ayumuwall/OpenSpec-J/pull/1604) [`83be9d1`](https://github.com/ayumuwall/OpenSpec-J/commit/83be9d113e8310789c281f7c8a00ed4fad191dd5) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec validate --archived` を追加しました。`changes/archive/` 配下のすべての変更で `tasks.md` のチェックボックスが完了しているかを任意で検査し、未完了があれば非ゼロ終了します。通常の validate はアクティブな変更だけを見るため、この検査では未完了のままアーカイブされた変更を検出でき、pre-commit または CI フック向けです（[#205](https://github.com/ayumuwall/OpenSpec-J/issues/205)）。これは独立したスコープであり、既存の `validate` の呼び出しを変更せず、適用済み仕様デルタの再検証も行いません。

### パッチ変更

- [#1530](https://github.com/ayumuwall/OpenSpec-J/pull/1530) [`bf5099e`](https://github.com/ayumuwall/OpenSpec-J/commit/bf5099e39fdb5d7bde2adc84f49ea93afd7463e9) [@clay-good](https://github.com/clay-good) に感謝します！ - apply ワークフローが、想定外のスコープを隠さず報告するようエージェントへ案内します。タスクに仕様を超える作業が必要なとき、`/opsx:apply` のスキルとコマンドのガイダンスは、指定された振る舞いを暗黙に狭めたり、延期したり、単純化したりせず、追加スコープを報告するために停止するよう指示します。また、指定された振る舞いを完全に実装した場合にのみタスクを完了にします。 [#1529](https://github.com/ayumuwall/OpenSpec-J/issues/1529) を修正しました。

- [#1603](https://github.com/ayumuwall/OpenSpec-J/pull/1603) [`9ae75c8`](https://github.com/ayumuwall/OpenSpec-J/commit/9ae75c86efe5d326ffa7ca5a3fd64b1f1e7728c2) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec archive` が、リダイレクトまたはキャプチャされた stdout へ端末エスケープコードを書き込まなくなりました。stdout が端末でない場合にも確認プロンプトと引数なし時の変更選択画面が ANSI カーソル移動シーケンスでライブ UI を描画していたため、リダイレクト先のログを汚し、一部の非対話ホストでは出力をディスクが埋まるまで増やし得る無限レンダリングループを起こしていました。stdout または stdin が端末でない場合、archive は確認をプレーンテキストで読み取り、引数なしの場合はメニューを描画せず先に変更名を渡すよう求めます。パイプ入力（`printf 'y\n' | openspec archive …`）と `--yes` の動作、および対話端末の動作は変わりません。 [#1526](https://github.com/ayumuwall/OpenSpec-J/issues/1526) を修正しました。

- [#1528](https://github.com/ayumuwall/OpenSpec-J/pull/1528) [`9425897`](https://github.com/ayumuwall/OpenSpec-J/commit/942589741de35f1b8896b410d7ea70295bb137c0) [@Marzx13](https://github.com/Marzx13) に感謝します！ - 再構築する仕様を、末尾の改行が正確に 1 つとなるよう正規化しました。以前は `## Requirements` セクションが末尾の仕様を再構築すると、末尾に空行（`\n\n`）が残り、sync または archive の後に Markdown の空白検査が失敗していました。Requirements セクション後の内部の間隔と内容は変わりません。

- [#1640](https://github.com/ayumuwall/OpenSpec-J/pull/1640) [`610b78f`](https://github.com/ayumuwall/OpenSpec-J/commit/610b78f6554e8aabfa294df53962428ff85c8b76) [@clay-good](https://github.com/clay-good) に感謝します！ - デルタ同期時に仕様の `## Requirements` 見出しの前後にある空行を保つようにしました。`openspec archive` は `openspec/specs/<capability>/spec.md` を各部分の間に改行だけを入れて再構築していたため、見出しの前後の空行が失われ、生成後のファイルで Markdown の空白検査が失敗していました。再構築後もこの間隔を保持します。 [#1625](https://github.com/ayumuwall/OpenSpec-J/issues/1625) を修正しました。[@jwang513](https://github.com/jwang513) にも感謝します！ （[#1637](https://github.com/ayumuwall/OpenSpec-J/pull/1637)）

- [#1640](https://github.com/ayumuwall/OpenSpec-J/pull/1640) [`610b78f`](https://github.com/ayumuwall/OpenSpec-J/commit/610b78f6554e8aabfa294df53962428ff85c8b76) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec validate --all` と `openspec list --json` が、OpenSpec プロジェクト外で暗黙に成功しなくなりました。ルートがないディレクトリでは、以前は現在のディレクトリを暗黙のルートとして解決し、終了コード 0 と空の結果を返していたため、CI やエージェントでは誤った成功になっていました。一括検証（`--all`、`--changes`、`--specs`）と `list` は既存ルートを必要とします（旧式プロジェクト向けの `openspec/project.md` フォールバックは維持）。直接検証と、意図的に暗黙ルートを使う他のワークフローは変わりません。 （[#1612](https://github.com/ayumuwall/OpenSpec-J/pull/1612)）

- [#1640](https://github.com/ayumuwall/OpenSpec-J/pull/1640) [`610b78f`](https://github.com/ayumuwall/OpenSpec-J/commit/610b78f6554e8aabfa294df53962428ff85c8b76) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec config` のワークフロー選択画面で `update` ワークフローを表示名付きにしました。12 個のワークフローのうち 11 個には分かりやすいラベルがありましたが、ユーザーが必ず使う 6 つの基本ワークフローの一つである `update` にはなく、生の ID と仮の説明が表示されていました。update-change テンプレートの古い「expanded-profile」という表現も「optional」へ改めました。 [#1627](https://github.com/ayumuwall/OpenSpec-J/issues/1627) を修正しました。 （[#1632](https://github.com/ayumuwall/OpenSpec-J/pull/1632)）

- [#1640](https://github.com/ayumuwall/OpenSpec-J/pull/1640) [`610b78f`](https://github.com/ayumuwall/OpenSpec-J/commit/610b78f6554e8aabfa294df53962428ff85c8b76) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec schema fork` が、元スキーマの YAML 整形を保持するようになりました。fork した `schema.yaml` の名前変更では、解析・再シリアライズによりコメントの削除、ブロックスカラー形式の変更（リテラルの `|` が `>` に変わるなど）、キー順序の変更が起こり、fork が元と一致しなくなっていました。YAML Document API を使って文書をその場で編集するため、コメント、スカラー形式、キー順序を維持します。 （[#1607](https://github.com/ayumuwall/OpenSpec-J/pull/1607)）

- [#1640](https://github.com/ayumuwall/OpenSpec-J/pull/1640) [`610b78f`](https://github.com/ayumuwall/OpenSpec-J/commit/610b78f6554e8aabfa294df53962428ff85c8b76) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec schemas` が、常に現在のディレクトリから読む代わりに、正規の OpenSpec ルート選択優先順位で解決するようになりました。`--store <id>` を受け付け、他のストア対応コマンドと同様に `--store-path` を拒否します。JSON 失敗時は共通の機械可読な診断を返し、成功時の既存の人間向け出力と素の JSON 配列は維持します。[@Patodo](https://github.com/Patodo) にも感謝します！ （[#1616](https://github.com/ayumuwall/OpenSpec-J/pull/1616)）

- [#1640](https://github.com/ayumuwall/OpenSpec-J/pull/1640) [`610b78f`](https://github.com/ayumuwall/OpenSpec-J/commit/610b78f6554e8aabfa294df53962428ff85c8b76) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec validate` が、`spec-driven` 変更における曖昧なタスク番号を警告します。解決済みタスクファイル間も含め、完全な深さでタスク ID が重複する場合、またはタスクの先頭番号が所属する `## N.` グループと一致しない場合が対象です。番号付きグループ外の数字らしい文字列は無視し、カスタムスキーマは明示的に有効化するまで変わりません。検査は直接・一括・非推奨の変更検証で実行されます。 [#1520](https://github.com/ayumuwall/OpenSpec-J/issues/1520) を完了しました。[@alectimison-maker](https://github.com/alectimison-maker) にも感謝します！ （[#1523](https://github.com/ayumuwall/OpenSpec-J/pull/1523)）

- [#1522](https://github.com/ayumuwall/OpenSpec-J/pull/1522) [`07dea6e`](https://github.com/ayumuwall/OpenSpec-J/commit/07dea6ed2faf71c8b9f4944d64246f2ff39eeffc) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **旧式 Codex のアップグレードがベンダー中立の `agents` ターゲットを乗っ取らないよう修正** — `openspec update` が、残存するグローバル `~/.codex/prompts` だけから Codex を検出した場合に、既存の `.agents` スキルツリーと所有者マーカーを上書きしなくなりました。Codex とベンダー中立の `agents` ターゲットは `.agents/skills` を共有していたため、`agents` ターゲットを使うプロジェクトでは、次の `update --force` で汎用スキルが Codex 固有の構文に静かに書き換えられ、ターゲットが Codex に切り替わる可能性がありました。旧式アップグレード経路は、`openspec init` がすでに適用している共有スキルディレクトリの単一書き込み元規則に合わせ、既存の所有者を尊重します。この理由でアップグレードを省略する場合、置き換えファイルが書かれていないため、ツール固有のリポジトリ内旧式ファイル（例: `.codex/prompts/openspec-*.md`）も削除せず保持します。初回の本来の Codex アップグレード（まだ `.agents` ツリーがない場合）は影響を受けません。

- [#1521](https://github.com/ayumuwall/OpenSpec-J/pull/1521) [`c751b3d`](https://github.com/ayumuwall/OpenSpec-J/commit/c751b3da52a7f06d6662a8673feff4685566cdd4) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **archive 時に名前のないシナリオを黙って削除しないよう修正** — `openspec validate` と `openspec archive` が、要件のすべてのレベル 4（空白に続く `####`）の子を、他で仕様を数える方法と同じくシナリオとして認識します。以前のシナリオ消失ガードは `#### Scenario:` と正確に書かれた見出しだけを認識していたため、別名の子（例: `#### Edge case`）を削除した `MODIFIED` 要件でも検証に通り、archive 時に警告なく永続的に削除されていました。両経路が一致したため、消失は作成時に検出されます。比較時にはシナリオ名を正規化し（任意の `Scenario:` 接頭辞と CommonMark の末尾 `#` を無視）、単なる再ラベル付けを削除と誤認しません。

- [#1610](https://github.com/ayumuwall/OpenSpec-J/pull/1610) [`17581c1`](https://github.com/ayumuwall/OpenSpec-J/commit/17581c11edf6b27ef18be7be1e4dcc06c81a3fff) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - `openspec init` が、Cursor、GitHub Copilot、Continue、Cline など IDE 常駐ツールを設定した場合だけ IDE の再起動を提案するようになりました。Claude Code、Codex、Gemini CLI などの CLI ツールは、ファイル作成直後からコマンドを使えるため、この案内を表示しません。

- [#1609](https://github.com/ayumuwall/OpenSpec-J/pull/1609) [`804427b`](https://github.com/ayumuwall/OpenSpec-J/commit/804427b6ff3f3b35b542365ba8b32e183fce3287) [@clay-good](https://github.com/clay-good) に感謝します！ - `--json` 使用時に初回実行のテレメトリー開示通知を表示しないようにしました。初回実行時にはこの通知が stdout に書き込まれ、`--json` の利用者を壊す可能性がありました。現在は最初の後続する非 JSON 実行まで遅延するため、`--json` 出力を有効に保ちながら開示も保証します。

## 1.8.0

### マイナー変更

- [#1303](https://github.com/ayumuwall/OpenSpec-J/pull/1303) [`1aa0f2a`](https://github.com/ayumuwall/OpenSpec-J/commit/1aa0f2abfc19f2487f5b8566e6eb3bf15f41c20a) [@solanab](https://github.com/solanab) に感謝します！ - ベンダー中立の `agents` ターゲットを追加しました。`openspec init --tools agents` は、AGENTS.md 対応アシスタントが読む共有の配置先 `.agents/skills/openspec-*/SKILL.md` へワークフロースキルをインストールします。スキル専用のためスラッシュコマンドは生成しません。`agents` が正式なターゲットとなったため、`--tools all` にも含まれ、これまで作られなかった `.agents/skills/` も作成されます。

- [#1274](https://github.com/ayumuwall/OpenSpec-J/pull/1274) [`7a4a745`](https://github.com/ayumuwall/OpenSpec-J/commit/7a4a745d803b698c34947eda6d73b5a24aebb58c) [@NicoAvanzDev](https://github.com/NicoAvanzDev) に感謝します！ - `openspec init` 実行時に GitHub Copilot coding agent のセットアップおよびカスタムエージェントファイルを生成し、`openspec update` で同期を維持します。

- [#1214](https://github.com/ayumuwall/OpenSpec-J/pull/1214) [`161f945`](https://github.com/ayumuwall/OpenSpec-J/commit/161f9454a372aab67c495d780928bba89c829f3e) [@showms](https://github.com/showms) に感謝します！ - MiniMax Code をグローバルなスキル専用ツールターゲットとして追加しました。

- [#1518](https://github.com/ayumuwall/OpenSpec-J/pull/1518) [`568e56c`](https://github.com/ayumuwall/OpenSpec-J/commit/568e56c67231dbe2447aca4f0e7995c05ada95a3) [@clay-good](https://github.com/clay-good) に感謝します！ - ### 新機能

  - **Atlassian Rovo Dev CLI** — `openspec init --tools rovodev` が Atlassian Rovo Dev CLI 向けの OpenSpec ワークフロースキルを `.rovodev` にインストールします。スキル専用のため、スラッシュコマンドは生成しません。

  ### バグ修正

  - **Codex スキルを共有の `.agents` ディレクトリへ配置** — `openspec init` と `openspec update` が、アシスタントが読む正規の場所 `.agents/skills/` に Codex スキルをインストールし、既存の `.codex` スキルディレクトリをその場で移行します。カスタマイズしたファイルは上書きせず保持します。
  - **`openspec status` で計画と実装を分離** — status が `isPlanningComplete`（スキップしていない計画成果物がすべて存在すること。スキップ済みは書かなくても充足扱い）を全体進捗と分けて報告するようになり、実装前の変更を完了と示唆しなくなりました。既存スクリプトとの互換性のため `isComplete` は別名として維持します。

- [#1517](https://github.com/ayumuwall/OpenSpec-J/pull/1517) [`73207a6`](https://github.com/ayumuwall/OpenSpec-J/commit/73207a6f2cd235729ac3fe3cb1e44152b8f63f12) [@clay-good](https://github.com/clay-good) に感謝します！ - GitHub Copilot のクラウド coding-agent ファイルをオプトインにしました。`github-copilot` ツールを選択しても GitHub Actions ワークフローを `.github/` に暗黙で書き込まなくなり、`openspec init` は最初に確認し（既定は No）、選択を `openspec/config.yaml`（`githubCopilot.cloudAgent`）へ記録します。非対話では `--copilot-cloud` / `--no-copilot-cloud` を使います。

  - `openspec update` は確認を行わず、オプトイン済みのプロジェクト（または生成済みクラウドファイルがある既存セットアップ）に対してのみクラウドファイルを更新します。
  - オプトアウト（`--no-copilot-cloud` または `cloudAgent: false`）では OpenSpec 管理のクラウドファイルを削除します。ユーザーがカスタマイズしたファイルは常に保持し、上書きも削除もしません。
  - `init` と `update` は、クラウドファイルを作成・スキップ・未変更のどれにしたかを報告します。独自の `copilot-setup-steps.yml` がある場合は、保持したことと OpenSpec のインストール手順を手動追加する必要があることを示します。

- [#1484](https://github.com/ayumuwall/OpenSpec-J/pull/1484) [`521ee33`](https://github.com/ayumuwall/OpenSpec-J/commit/521ee33e6ece269241b45e08017ee60f13fdef08) [@clay-good](https://github.com/clay-good) に感謝します！ - 変更がケイパビリティの最後の要件を削除する場合に、そのケイパビリティを廃止できます。`.openspec.yaml` に `retire_capabilities: true`（必須の `schema:` と併記）を宣言した変更は、REMOVED 項目が最後の要件を取り除く場合でもアーカイブできます。`openspec archive` は「仕様には少なくとも 1 つの要件が必要です」と中止せず、そのケイパビリティのメイン仕様を削除します。マーカーがない場合の動作は従来どおりで、メッセージが回避方法としてマーカーを示す点だけが異なります。実際に空の仕様を書けない場合だけ廃止し、すべてを archive 出力に表示し、呼び出し元のチェックアウトに仕様があれば貼り付け可能な `git checkout` を示します。`--no-validate` では廃止しません。archive は正規要件名が重複するメイン仕様も拒否します。廃止したケイパビリティを変更する進行中の変更は検証には通っても archive 時に拒否されるため、廃止と合わせて完了または作り直してください。

### パッチ変更

- [#1502](https://github.com/ayumuwall/OpenSpec-J/pull/1502) [`ece8660`](https://github.com/ayumuwall/OpenSpec-J/commit/ece8660d44bd19b86440376327752cda3d7b0717) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec validate` が通常モードでは英語の `SHALL`/`MUST` 規約をガイダンスとして扱うため、他言語で書かれた要件も検証できます。strict モードでは引き続きこの規約を強制します。

- [#1483](https://github.com/ayumuwall/OpenSpec-J/pull/1483) [`2b3d368`](https://github.com/ayumuwall/OpenSpec-J/commit/2b3d368539132be6311e55db58899abbf5306b81) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec archive` が確認できない場合に、必要なフラグを呼び出し元へ示すようにしました。stdin を閉じた AI エージェントやスクリプトでは、プロンプトが `@inquirer` のエラーで拒否され、以前は質問内容も必要なフラグも分からないまま archive が中止されていました（[#1479](https://github.com/ayumuwall/OpenSpec-J/issues/1479)）。各確認は必要な内容と、指定済みフラグを引き継ぐ貼り付け可能な再実行コマンドを示します。変更名なしの `openspec archive` も、何もアーカイブせず終了コード 0 になる代わりに、変更名を求めて終了コード 1 になります。パイプ入力、`--yes`、`--json`、Ctrl-C の動作は変わらず、CI・`OPEN_SPEC_INTERACTIVE=0`・`--no-interactive` でも案内を表示します。オンボーディングの archive 例には `--yes` を使用します。
- [#1486](https://github.com/ayumuwall/OpenSpec-J/pull/1486) [`427abf4`](https://github.com/ayumuwall/OpenSpec-J/commit/427abf40ac45a9a44f78eb74c81f53f9f4197ccf) [@clay-good](https://github.com/clay-good) に感謝します！ - タスク進捗でインデントしたサブタスクも数えるようにしました。以前は、両方のチェックボックスパーサーが列 0 のチェックボックスだけを扱っていたため、未完了のサブタスクを含む `tasks.md` でも `openspec list` と `openspec view` が `✓ Complete` と表示し、`openspec instructions apply` の一覧からも漏れ、未完了タスク警告なしでアーカイブされていました。

  進捗集計と apply のタスクリストは同じパーサーを共有し、`list`、`view`、`archive`、`apply` がどの行をタスクと扱うか一致します。テキストのないチェックボックスは apply リストに載りませんが進捗には数えます。共有パターンは置き換えた二つのパターンが一致した行をすべて含むため、タスク数は増えることはあっても減りません。チェックボックスはコードフェンス、HTML コメント、インデントブロック内も含め、現れる場所すべてで数えます。形式例のチェックリストも作業として数えられる場合は削除するか、archive に `--yes` を渡してください。
- [#1500](https://github.com/ayumuwall/OpenSpec-J/pull/1500) [`26bd1d4`](https://github.com/ayumuwall/OpenSpec-J/commit/26bd1d4e5c6c6ba75bd7d6136424019b2bf89ced) [@clay-good](https://github.com/clay-good) に感謝します！ - 生成済みワークフローを選択したストアに保ち、任意ワークフローのフォールバックを安全に処理し、同期した仕様を成功報告前に検証します。

- [#1490](https://github.com/ayumuwall/OpenSpec-J/pull/1490) [`45cca5d`](https://github.com/ayumuwall/OpenSpec-J/commit/45cca5db6137ed209117cc70510eb3e057fb981b) [@clay-good](https://github.com/clay-good) に感謝します！ - 変更をアーカイブすると要件の横に書かれた注記が消える場合、確認前に表示するようにしました。OpenSpec が新しい見出しと認識しない要件配下の内容（例: Markdown で許される 1〜3 個の空白でインデントした注記）は、要件を削除・変更すると静かに一緒に消えていました。`openspec archive` は再構築する仕様から実際に削除される内容と、保持するための移動先を示します。シナリオ内の `#` 行は注記と区別できないため、マージ自体は移動を行わず従来どおりです。

- [#1492](https://github.com/ayumuwall/OpenSpec-J/pull/1492) [`690a27e`](https://github.com/ayumuwall/OpenSpec-J/commit/690a27e649c4a3325daeb0f6667ebe0f82792179) [@mc856](https://github.com/mc856) に感謝します！ - `openspec init` と `openspec update` が、生成直後の CoStrict と Junie のコマンドファイルを削除しなくなりました。旧式クリーンアップの二つのパターンが現行アダプターの出力先も指していたためです。CoStrict では `.cospec/openspec/commands/` ディレクトリ全体を削除しており、ユーザーが残したファイルも含めて毎回消えていました。Junie では `.junie/commands/opsx-*.md` が現行出力まで列挙していました。設定移行の前にクリーンアップが実行されるため、`profile` がない設定では欠落したコマンドファイルをスキル専用として検出し、グローバル設定に永続化する問題もありました。

  CoStrict の対象は、旧 `opsx` 統合が作った 3 コマンド（`openspec-proposal.md`、`openspec-apply.md`、`openspec-archive.md`）に一致するファイルパターン `.cospec/openspec/commands/openspec-*.md` に変更しました。Junie のエントリーは削除しました。既存の OpenSpec バージョンはこの場所に旧式ファイルを作っていないためです。本当に旧式のファイルは引き続き検出・削除し、他ツールのパターンは現行出力と重複しないため変わりません。

- [#1501](https://github.com/ayumuwall/OpenSpec-J/pull/1501) [`0b20ae3`](https://github.com/ayumuwall/OpenSpec-J/commit/0b20ae3964283bdcb4e34ea7380770857f6a339c) [@clay-good](https://github.com/clay-good) に感謝します！ - propose ワークフローを計画に集中させ、変更を作る前に重要な曖昧さを解消し、実装を apply ワークフローへ引き渡します。

- [#1503](https://github.com/ayumuwall/OpenSpec-J/pull/1503) [`8a3850d`](https://github.com/ayumuwall/OpenSpec-J/commit/8a3850da735e241c14ad94935463f879b33f21a9) [@clay-good](https://github.com/clay-good) に感謝します！ - 探索から新しい変更を作る場合、生成される explore ガイダンスが、要求された成果物を書く前に `openspec new change` を実行するようエージェントへ指示します。これにより、手作業で不完全な変更ディレクトリを作るのではなく、必須の `.openspec.yaml` メタデータを保持します。ユーザーがキャプチャを承認した後は、別のワークフローコマンドを要求せず、explore が求められた成果物も作成します。

- [#1513](https://github.com/ayumuwall/OpenSpec-J/pull/1513) [`622c509`](https://github.com/ayumuwall/OpenSpec-J/commit/622c509a1349c3ad9c52cd1a4ee007bd47549204) [@FasterPHP](https://github.com/FasterPHP) に感謝します！ - グローバル設定の `telemetry.enabled` を反映します。`false` で匿名テレメトリーと `openspec update` のバージョン確認を無効にし、未設定ならテレメトリーを有効に保ちます。環境変数または CI によるオプトアウトが引き続き優先されます。

- [#1499](https://github.com/ayumuwall/OpenSpec-J/pull/1499) [`9cd845f`](https://github.com/ayumuwall/OpenSpec-J/commit/9cd845fc459b71486d9f2424c2e1f38e2ca8766e) [@clay-good](https://github.com/clay-good) に感謝します！ - リンクされたモノレポのワークフローを壊さず、生成ファイル、仕様、archive の移動、ローカル状態を意図したセキュリティ境界内に保ちます。

- [#1482](https://github.com/ayumuwall/OpenSpec-J/pull/1482) [`84ebc57`](https://github.com/ayumuwall/OpenSpec-J/commit/84ebc57cb3f0e91b93484484092fdc2f9fcf39e6) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec validate <change>` が、メイン仕様にまだあるシナリオを省いた MODIFIED 要件を報告するようになりました。archive ではすでに適用を拒否していた消失のため、archive 時ではなく作成時に変更を失敗させます。古い MODIFIED ブロックを含む変更は検証に失敗し、メッセージが戻すべきシナリオを示します。

## 1.7.0

- **[OpenSpec-J]** OpenSpec v1.7.0 の upstream 変更を取り込み、README・ドキュメント・スキーマ・OPSX ワークフロー・CLI の追加／変更された人間向け文言を日本語化
- **[OpenSpec-J]** 静的配布される `skills/` を日本語テンプレートから再生成し、scope の全対象ファイルを一件ずつ照合
- **[OpenSpec-J]** `skip_specs`、archive／sync のルール取得、CLI 自動アップグレード、Devin Desktop・ZCode など v1.7.0 の新しい案内・エラー・進捗表示を日本語化
- **[OpenSpec-J]** README の同期元バージョンを OpenSpec v1.7.0 に更新
### マイナー変更

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - CodeArts Agent のスキルをサポートしました。`openspec init --tools codeartsagent` でワークフロースキルをインストールできます。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - Hermes Agent を対応AIツールに追加しました。`openspec init --tools hermes` でワークフロースキルをインストールできます（Hermes はスキル専用で、スキルを直接呼び出します）。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - ZCode を対応AIツールに追加しました。`openspec init --tools zcode` でスキルと `/opsx:*` コマンドを生成できます。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - Codex はスキル専用になりました。ワークフローは `$openspec-*` スキルとしてインストールされ、従来管理していたカスタムプロンプトは廃止されます（既存のものは更新時に削除されます）。

- [#1062](https://github.com/Fission-AI/OpenSpec/pull/1062) [`eac2973`](https://github.com/Fission-AI/OpenSpec/commit/eac2973819037727b10214f70db2f54d82f2d891) [@showms](https://github.com/showms) に感謝します！ - apply と archive のワークフローに、現在のプロジェクトコンテキストと操作別ガイダンスを追加しました。プロジェクトでは `operations.apply.guidance` と `operations.archive.guidance` を設定できます。`openspec instructions apply` は apply の入力を返し、新しい読み取り専用の `openspec instructions archive` は選択したルートの archive 入力を返します。

  archive、bulk archive、sync の各スキルは、実行時に現在の archive 入力と `specs` アーティファクトルールを読み込むようになりました。必要な指示の取得に失敗した場合は書き込みや移動の前に停止し、インライン同期では specs ルールのスナップショットを再利用します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - `npx skills add Fission-AI/OpenSpec` を利用できるよう、ワークフロースキルを静的な `skills/<name>/SKILL.md` ファイルとして公開しました。

- [#1399](https://github.com/Fission-AI/OpenSpec/pull/1399) [`27b22ab`](https://github.com/Fission-AI/OpenSpec/commit/27b22ab4cbf530fa00e17f0f6b75a44d56777542) [@clay-good](https://github.com/clay-good) に感謝します！ - 仕様レベルの振る舞いを変更しない作業（純粋なリファクタリング、ツール、文書）向けに、`skip_specs: true` 変更メタデータを追加しました。`openspec validate` はこのマーカーを宣言したデルタなしの変更を受け入れます（メタデータが共有変更メタデータスキーマで解析でき、読み込み可能なスキーマを指定している場合のみ有効）。マーカーとデルタ仕様が両方存在する場合はエラーになります。このような変更では、アーティファクトグラフが仕様ファイルを理由に `tasks` をブロックせず、`openspec status` は specs 段階を明示的にスキップ済みとして表示し、propose/specs のガイダンスはバリデーターと矛盾せずこのマーカーを案内します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - シンボリックリンクされたスキーマディレクトリを解決し、シンボリックリンク経由で共有されたスキーマ（dotfilesリポジトリ由来など）も検出できるようにしました。

- [#1470](https://github.com/Fission-AI/OpenSpec/pull/1470) [`6295515`](https://github.com/Fission-AI/OpenSpec/commit/6295515d4da4f7c76eaed00b7f1926771eae92de) [@clay-good](https://github.com/clay-good) に感謝します！ - インストール済みCLIが公開版より古い場合、`openspec update` がCLIのアップグレードを提案するようになりました。指示ファイルはインストール済みCLIで生成されるため、古い環境では `✓ All 1 tool(s) up to date (v1.6.0)` と表示されても、新しいリリースで追加されたワークフローが書き込まれていませんでした。

  ```text
  新しい OpenSpec CLI を利用できます（v1.6.0 → v1.7.0）。
    実行元: /usr/local/lib/node_modules/@ayumuwall/openspec
  ? 今すぐ v1.7.0 にアップグレードしますか？ (Y/n)
  ```

  「はい」を選ぶとアップグレードし、新しいバージョンが応答することを確認してから update を再実行するため、同じコマンド内で新しいワークフローが導入されます。「いいえ」を選ぶと、OpenSpec のインストール方法に対応したコマンドを表示し、現在のバージョンで更新します。同意なしに環境が変更されることはありません。この提案は対話型ターミナルかつ `npm install -g` が有効な場合にのみ表示され、CI環境、または `OPENSPEC_NO_UPDATE_CHECK`、`DO_NOT_TRACK=1`、`OPENSPEC_TELEMETRY=0` が設定されている場合は確認を省略します。

  インストール方法ごとの動作とすべてのオプトアウトについては、[CLIリファレンス → `openspec update`](https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-update) を参照してください。

### パッチ変更

- [#1404](https://github.com/Fission-AI/OpenSpec/pull/1404) [`a84ae70`](https://github.com/Fission-AI/OpenSpec/commit/a84ae70e8c6ef6ffaab56599d6f91fa39873e63d) [@clay-good](https://github.com/clay-good) に感謝します！ - コマンドアダプターを持たないツール（Kimi Code、Mistral Vibe、Hermes、ForgeCode、CodeArts）向けに生成されるスキルが、生成されない `/opsx:*` コマンドを参照しないようになりました。スキル間参照、init の開始案内、プロファイル移行メッセージでは、各ツールの文書化されたスキル呼び出し（Kimi Codeは `/skill:openspec-*`、その他は `/openspec-*`）を使用します。スラッシュ形式を持たずスキルを呼び出せるCodexには、スキル名を示す構文非依存の案内を表示します。複数の呼び出し構文が混在する選択では、形式ごとにラベル付きの案内を表示するため、案内されたすべての指示を該当ツールで利用できます。選択したツールに `delivery: commands` で何も生成できない場合、他のツールにはコマンドやスキルが生成されていても、init はそのツール名を含む設定修正案を表示します。コミット済みの skills.sh 配布物も、スキル参照（この経路はスキルのみをインストールするため、既定では `/openspec-*` 形式）で再生成しました。

- [#1363](https://github.com/Fission-AI/OpenSpec/pull/1363) [`5199f41`](https://github.com/Fission-AI/OpenSpec/commit/5199f41a5d523b9212dd2854ec5e505d2f80e2e7) [@clay-good](https://github.com/clay-good) に感謝します！ - ### 機能

  - **マシン上のすべてのリポジトリに1つの既定ストア** — `openspec config set defaultStore <id>` で、マシン単位のフォールバックルートを設定できます。planning root の外で、`--store` フラグもプロジェクトの `store:` ポインターも指定せずに実行したコマンドは、そのストアへ解決されます。優先順位は最下位なので、`--store`、ローカルルート、プロジェクトポインターが引き続き優先されます。ルートバナーとJSONの `root` ブロックには固有の由来 `source: "global_default"` が表示され、マシン全体の既定値とリポジトリ固有のポインターを区別できます。古いIDを指定した場合は、`openspec config unset defaultStore` という修正案を含む基盤ストアのエラーとして扱われます。

- [#1435](https://github.com/Fission-AI/OpenSpec/pull/1435) [`6a5171e`](https://github.com/Fission-AI/OpenSpec/commit/6a5171e18630db4ed8e78c9edfaae4be532e2af6) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec new change` が `100-add-feature` や `00001-add-auth` のように数字で始まる名前を受け入れるようになりました。変更の並べ替えや階層化に利用できます。変更名にはストアIDや変更メタデータと同じkebab-case文法を使用し、先頭の数字を許可します。`archive` では、すでに日付で始まる名前を対応済みの慣例として扱っていました。大文字、空白、アンダースコア、先頭・末尾または連続するハイフンは引き続き拒否され、従来有効だった名前はすべて有効なままです。

- [#1425](https://github.com/Fission-AI/OpenSpec/pull/1425) [`040a869`](https://github.com/Fission-AI/OpenSpec/commit/040a86931f5398167137a483b2e8081aec13016e) [@clay-good](https://github.com/clay-good) に感謝します！ - 設定キーのガードを、ヘルパー経由ではなくリテラルで比較するようにしました。

  `setNestedValue` と `deleteNestedValue` は、`Set` 検索を行うヘルパーを介してプロトタイプへ到達するキー区間を拒否していました。この動作は正しいものの、静的解析が追跡できず、CodeQLはガードで保護された代入をプロトタイプ汚染として報告し続けていました。現在は同じ関数内で区間をリテラル比較し、書き込み前にパス全体を検査します。生成した40万件の入力を以前の実装と比較して確認しており、すべての入力で動作は変わりません。

- [#1431](https://github.com/Fission-AI/OpenSpec/pull/1431) [`6a4f0d7`](https://github.com/Fission-AI/OpenSpec/commit/6a4f0d7f3384486132cb9c516b635c23cadc1fa2) [@clay-good](https://github.com/clay-good) に感謝します！ - 新しい機能を導入するデルタ仕様を `## Purpose` から始められるようになり、`openspec archive` は `TBD - created by archiving change <name>. Update Purpose after archive.` というプレースホルダーではなく、その内容を作成するメイン仕様のPurposeとして使用します。`specs` アーティファクトの指示、例、デルタテンプレート、`openspec-sync-specs` スキルのすべてがPurposeの記述を作成者とエージェントに案内するため、CLIとエージェントによる同期で同じメイン仕様が生成されます。

  デルタに使用可能な `## Purpose` がない場合、archive はプレースホルダーを維持します。

  - コードフェンスやHTMLコメントの外側に `## Purpose` 見出しがない、または本文がコードフェンスかコメントだけの場合
  - 仕様自身のパーサーが読めない本文になる場合（セクションを切断する見出しや要件見出し、閉じられていないフェンス、HTMLコメントを含む場合）
  - 2つ目の場合、archive は理由も表示し、中止せずに完了します

  引き継いだPurposeが50文字未満の場合、`openspec validate --strict` では短すぎると報告されるため、内容を維持したまま警告します。既存のメイン仕様のPurposeは変更せず、デルタのPurposeを無視する場合はarchiveが警告します。

- [#1437](https://github.com/Fission-AI/OpenSpec/pull/1437) [`19d4171`](https://github.com/Fission-AI/OpenSpec/commit/19d41714c8b790488732687443713e406ef5aeef) [@clay-good](https://github.com/clay-good) に感謝します！ - REMOVEDデルタの要件がメイン仕様からすでに削除されている場合（syncスキルが案内する事前同期パターン）でも、`openspec archive` が中止しないようになりました。警告を表示し、削除を適用済みとして扱い、実際に適用した件数のみを報告します。`--json` モードでは、archive結果の新しい任意の `warnings` 配列に警告を含めます。ある仕様のすべての操作が同期済みなら、正規化差分でファイルを書き換えず、そのファイルをスキップします。同じ要件をRENAMEとREMOVEの両方で指定したデルタは、`validate` と `archive` の双方で明示的に拒否されます。2つの表記は大文字小文字と空白を無視して比較します。既存要件と大文字小文字や空白だけが異なるREMOVED見出しは、事前同期ではなく入力ミスとして引き続き中止します。さらに、archiveのデルタゲートがパーサーと同様にセクション見出しを大文字小文字を区別せず照合するよう修正しました。シンボリックリンクされた `specs/<capability>/spec.md` を検出し、`openspec show <change>` の不要な「scenarios」フラグ警告を削除しました。qwenとbob向け生成ファイルおよびinitの開始案内では、実際のハイフン区切りコマンド名（`/opsx-<id>`）を参照します。apply/update/onboardのガイダンスは、`/opsx:continue` や `/opsx:new` をインストールしないプロファイル向けにCLIの代替手段を案内します。

- [#1411](https://github.com/Fission-AI/OpenSpec/pull/1411) [`c439a4e`](https://github.com/Fission-AI/OpenSpec/commit/c439a4ee48ef02dcdae6ac8101b7d12924695e7e) [@clay-good](https://github.com/clay-good) に感謝します！ - デルタ仕様から実在しない要件が解析され、`openspec validate` が報告しない問題を `openspec archive` が警告していた不具合を修正しました。

  デルタセクション内にある `### Requirement:` ではない見出し（`### Documentation Requirements` のような区切り）が、シナリオのない要件として読み取られていました。`openspec archive` はシナリオ不足を警告し、`openspec show <change> --json` と `openspec change list` は余分なデルタとして数えていました。変更パーサーはデルタリーダーと同様にこれらの見出しを無視するようになり、不要な警告とJSON項目がなくなりました。メイン仕様の解析は変わりません。

  また、`openspec archive` は非ブロッキングの「Proposal warnings in proposal.md」ブロックで、デルタ仕様の要件レベルの問題を重複表示しなくなりました。以前は各問題が2回表示され、設計上名前だけを記述する `## REMOVED Requirements` の項目まで、正しい削除のたびにシナリオ不足と報告されていました。デルタ仕様の検証は実際の問題を引き続き報告してブロックし、proposalレベルの警告も変わりません。

- [#1394](https://github.com/Fission-AI/OpenSpec/pull/1394) [`b474f81`](https://github.com/Fission-AI/OpenSpec/commit/b474f81cb4bebbeff0e447fd78c34a613ebd02fa) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **Archiveと仕様同期の競合、および未反映同期の誤報を解消** — 生成された `openspec-archive-change` スキル（および対応する `opsx:archive` コマンド）は、仕様同期をバックグラウンドタスクへ渡した直後に変更フォルダーを移動していました。そのため実行中の同期からデルタ仕様が移動され、変更はアーカイブ済みでも `openspec/specs/` が更新されず、概要には `Specs: ✓ Synced` と表示される場合がありました。同期をインラインで実行し、デルタ仕様を持つすべての機能について、ADDEDが存在する、MODIFIEDが適用されている、REMOVEDが消えている、RENAMEDが新しい名前にあり古い名前にはない、という確認を終えてからarchiveを続行します。同期に失敗した場合や機能が一致しない場合は、成功と報告せずarchiveを停止して差分を示します。何も移動されないため、修正して再試行できます。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 別のバージョンを実行する可能性がある `npx` の呼び出しではなく、インストール済みCLIでプロファイル変更を適用するようにしました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - デルタ仕様とメイン仕様のパーサーがUTF-8 BOMを除去するようになり、WindowsのエディターやPowerShellのリダイレクトで保存したファイルが「No delta sections found」で失敗しなくなりました。

- [#1398](https://github.com/Fission-AI/OpenSpec/pull/1398) [`97d441a`](https://github.com/Fission-AI/OpenSpec/commit/97d441a8ee2738d3008709e61acfc91925c7ae3a) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **「Cancel」を選ぶと一括アーカイブが停止** — 生成された `openspec-bulk-archive-change` スキル（および対応する `opsx:bulk-archive` コマンド）は確認プロンプトに「Cancel」を表示していましたが、その場合の動作をエージェントへ指示していなかったため、次の手順ですべての選択済み変更をアーカイブしていました。現在は回答の意図に応じて分岐します。「Cancel」は何もアーカイブせず停止し、アーカイブの選択肢は処理を続行します（準備済みのみの選択肢では、状態表が `Ready` または `Ready*` と示す変更だけをアーカイブ）。その他の回答ではアーカイブせず再質問します。単一変更のarchiveスキルではすでに同様にCancelを処理しており、一括版も動作を揃えました。

- [#1375](https://github.com/Fission-AI/OpenSpec/pull/1375) [`52a8bce`](https://github.com/Fission-AI/OpenSpec/commit/52a8bce1fd2bc98c51fa35cf0cfa05e799eb4404) [@clay-good](https://github.com/clay-good) に感謝します！ - `--change` が、ディスク上に存在する任意の変更名（`2026-07-04-voice-copilot-v1` のように日付で始まる名前など）を受け入れるようになり、`list`、`validate`、`archive` の解決方法と一致しました。検索時はパス区切り、`..`、隠し項目などの安全でない名前を引き続き拒否し、新しい変更の作成時にはkebab-caseの命名規則を適用します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec new change` は200文字を超える名前に対して、生のENAMETOOLONGファイルシステムエラーではなく検証メッセージを表示して拒否するようになりました。

- [#1447](https://github.com/Fission-AI/OpenSpec/pull/1447) [`fb19699`](https://github.com/Fission-AI/OpenSpec/commit/fb196995dad017074415a638824eb546f3321cbc) [@hsusul](https://github.com/hsusul) に感謝します！ - 生成されるツールコマンドファイルが、すべての対応ツールで有効なYAML frontmatterを持つようになりました。コマンド名は `OPSX: Explore` の形式ですが、アダプターが出力していた引用符なしの `name: OPSX: Explore` は有効なYAMLとして解析できません。厳密なパーサーはファイル全体を拒否し、コマンドを読み込めませんでした。また、複数のアダプターが独自にエスケープ処理を再実装し、一部は説明を未加工のまま埋め込んでいました。

  エスケープ処理を1か所（`escapeYamlValue` / `formatTagsArray`）に集約し、すべてのアダプターが使用するようにしました。frontmatterの文字列値は常に二重引用符で囲まれるため、`true`、`null`、`123` などが真偽値、null、数値として読み戻されることも防ぎます。`allowed-tools` や `invokable` など文字列以外のフィールドは変わりません。アップグレード後の最初の `openspec update` では、生成済みコマンドファイルのfrontmatter行が書き換えられます。

  archiveワークフローのガイダンスにも2点の修正を加えました。一括archiveはデルタごとの対象・対象外という判断を実行時まで引き継ぎ、実装が見つからないデルタを同期せず `sync skipped` と報告します。また、両方のarchiveワークフローが変更ディレクトリを移動する前にメイン仕様を検証します。

- [#1471](https://github.com/Fission-AI/OpenSpec/pull/1471) [`9a937cb`](https://github.com/Fission-AI/OpenSpec/commit/9a937cb9b36fb1040bdbde3bab3fa3903944ef10) [@clay-good](https://github.com/clay-good) に感謝します！ - 各ツールが実際に登録する名前でスラッシュコマンドを参照するようにしました。コマンド本文、生成された `SKILL.md` の相互参照、`init` / `update` / 移行の案内はすべて `/opsx:<id>` を案内していましたが、コマンドアダプターを持つ28ツールのうち、この名前を登録するのはファイルを `opsx/` ディレクトリに置く7ツールだけです。残りの21ツールは `.../opsx-<id>.md` を書き出し、ファイル名がコマンド名になります。そのためCursor、GitHub Copilot、Windsurf、Kilo Codeなどでは、コマンドパレットに存在しないコマンドの入力を案内されていました。生成された単一のCursorファイルでも、frontmatterでは自身を `/opsx-apply` と名乗りながら、本文では `/opsx:apply` の実行を案内していました。現在は手動管理のツール一覧ではなく、各アダプターが書き込むコマンドファイルからコマンドの_名前_を導出するため、新しいアダプターでも不整合が生じません。コマンドを囲む_形式_はアダプターのメタデータです。Amazon Qは `@` で呼び出すプロンプトライブラリへファイルを読み込むため、登録されないスラッシュコマンドではなく、コマンド本文、スキル、オンボーディング案内で `@opsx-<id>` を使用します。コマンドファイルを生成しないCodexでは、従来 `/opsx:*` を案内していたすべての箇所で、CLIが実際に受け付ける `$openspec-<skill>` を使用します。これは保留中の `adapterless-skill-references` ノートに記載された構文非依存の案内を置き換えます。コマンドのファイル名とパスは変わらず、Claude Codeの出力はバイト単位で同一です。

- [#1364](https://github.com/Fission-AI/OpenSpec/pull/1364) [`f58b445`](https://github.com/Fission-AI/OpenSpec/commit/f58b4456925b6331f3e5902a1c57905afe7edbf5) [@clay-good](https://github.com/clay-good) に感謝します！ - 対話シェルとログインシェルが異なるfish（およびその他のユーザー）で、`openspec completion install` が誤ったシェルを検出する問題を修正しました。現在は `$SHELL` へフォールバックする前に親プロセスを参照するため、fishからコマンドを実行するとbashではなくfishの補完をインストールします。

- [#1377](https://github.com/Fission-AI/OpenSpec/pull/1377) [`285dfd7`](https://github.com/Fission-AI/OpenSpec/commit/285dfd7d764752b2a1e7e8cc843d613421e62652) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - 別のスキーマに属する設定の `rules:` キーが `Unknown artifact ID` と報告されなくなりました。グローバルルールマップは、利用可能なすべてのスキーマに含まれるアーティファクトIDの和集合で検証されるため、複数スキーマを使うプロジェクトでコマンド実行のたびに不要な警告が表示されなくなります（[#1322](https://github.com/Fission-AI/OpenSpec/issues/1322)）。

- [#1401](https://github.com/Fission-AI/OpenSpec/pull/1401) [`b33b15d`](https://github.com/Fission-AI/OpenSpec/commit/b33b15d98ae929624c991632c7382ebc234d4ca7) [@clay-good](https://github.com/clay-good) に感謝します！ - `design.md` がproposalを繰り返さないようにしました。既定の `spec-driven` スキーマでは、動機と範囲がすでに `proposal.md` にあることを示さずに、designの指示で「背景、現状、制約、関係者」と「この設計が実現すること、対象外とすること」を求めていました。そのためエージェントは、設計固有の価値であるアプローチ、代替案、トレードオフを追加せず、proposalのWhyとWhat Changesを繰り返していました。指示とdesignテンプレートで境界（proposalは理由と変更内容、designは実現方法）を明示し、内容を繰り返さず該当文書を参照するよう案内します（[#1382](https://github.com/Fission-AI/OpenSpec/issues/1382)）。

- [#1167](https://github.com/Fission-AI/OpenSpec/pull/1167) [`1637856`](https://github.com/Fission-AI/OpenSpec/commit/1637856c423f2e84457652d1ab58885fe9744fb2) [@mehdishahdoost](https://github.com/mehdishahdoost) に感謝します！ - **WindsurfはDevin Desktopになりました。** Windsurfは2026年6月2日にブランド名を変更し、設定ディレクトリも移動しました。`.devin/` が読み書き用の推奨場所で、`.windsurf/` はDevin Localエージェントがまったく読み取らない、従来互換の読み取り専用フォールバックです。OpenSpecは1つの製品に2つのIDを持たせず、この名称変更へ追従します。ツールIDは `devin` で、`.devin/workflows/opsx-<id>.md` と `.devin/skills/openspec-*/SKILL.md` へ書き込み、どちらのディレクトリからも検出します。

  - `--tools windsurf` は引き続き解決されるため、既存のセットアップスクリプトも動作し、現在は `.devin/` を設定します。
  - OpenSpecファイルがまだ `.windsurf/` にある場合、`openspec update` が名称変更を説明し、移動を提案します。`--force` と非対話実行では移動し、拒否した場合はすべてのファイルを元の場所に残します。移動するのはOpenSpecが生成したファイル（各スキルの `SKILL.md` と `opsx-*` という名前のコマンド）だけです。手書きのCascadeワークフロー、`SKILL.md` と同じ場所に置いた参照ファイル、編集済みコマンドファイル、`.devin/rules/` はすべて元の場所に残ります。
  - Devinスキルと開始案内は `/opsx-*` ワークフローではなく `/openspec-*` スキルを参照します。ワークフローを読むのはDevin Desktopだけですが、`/openspec-*` 形式は両方のエージェントで利用できるためです。ワークフロー本文では、Devinがワークフローファイルに登録する名前 `/opsx-<id>` を引き続き使用します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - ストアのチェックアウトがupstreamの参照より遅れている場合、`openspec doctor` が通知するようになりました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - archiveのシナリオ差異検査で同名項目の個数を考慮するようにしました。同じ名前のシナリオが2つあるうち1つだけを維持するMODIFIEDブロックでも、もう一方を暗黙に削除しなくなります。

- [#1408](https://github.com/Fission-AI/OpenSpec/pull/1408) [`378d468`](https://github.com/Fission-AI/OpenSpec/commit/378d468ad348dc1e973ed30c5cfa458fb77c9de3) [@clay-good](https://github.com/clay-good) に感謝します！ - Exploreがセッション開始時に `openspec/config.yaml`（または `config.yml`）からプロジェクトのコンテキストとルールを読み取るようになり、アーティファクト作成ワークフローが受け取るものと同じ技術スタックや規約を考慮して推論します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec feedback` は、ghが存在しない場合や未認証の場合だけでなく、Issue無効、ネットワーク、レート制限などghのあらゆる失敗時に、整形済みテキストと入力済みの投稿URLを表示します。

- [#1396](https://github.com/Fission-AI/OpenSpec/pull/1396) [`60f720c`](https://github.com/Fission-AI/OpenSpec/commit/60f720c43acd94de7645ac8629c614ede4682b6a) [@clay-good](https://github.com/clay-good) に感謝します！ - リポジトリに `feedback` ラベルが定義されていない場合に `openspec feedback` が失敗する問題を修正しました。エラー終了してフィードバックを破棄せず、ラベルなしで再試行し、ラベルが適用されなかったことを通知します。

- [#1151](https://github.com/Fission-AI/OpenSpec/pull/1151) [`18cbf5d`](https://github.com/Fission-AI/OpenSpec/commit/18cbf5d32ffe1bff4fff692e24568c605cf1e0fa) [@javigomez](https://github.com/javigomez) に感謝します！ - ### 修正

  - デルタ仕様の解析時に、コードフェンス内にあるMarkdown構造（要件見出し、デルタセクション、シナリオ、REMOVED/RENAMED項目）を無視するようにしました。以前はフェンス内の `### Requirement:` の例が実在する要件として解析され、不要な `validate` エラーや誤った `archive` 出力につながる可能性がありました。コードフェンスの検出をMarkdownパーサー間で共有し、`validate` と `archive` の動作を統一しました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - archiveのシナリオ差異検査が、validateと同様にコードフェンス内の `#### Scenario:` 行を無視するようになりました。フェンス内の例を理由にarchiveを誤って中止せず、フェンス内の名前が実際に削除されたシナリオを隠すこともありません。

- [#1316](https://github.com/Fission-AI/OpenSpec/pull/1316) [`9b70481`](https://github.com/Fission-AI/OpenSpec/commit/9b70481df727ab9f7a00dd0118e4e09373a36fb9) [@mc856](https://github.com/mc856) に感謝します！ - ### バグ修正

  - **`archive` が2つ目の日付接頭辞を重ねないよう修正** — 一般的な命名規則である `YYYY-MM-DD-` で始まる変更をarchiveする場合、今日の日付を追加せず名前を維持します。以前は `openspec archive 2026-07-04-voice-copilot-v1 --yes` により `2026-07-06-2026-07-04-voice-copilot-v1` が生成され、後日実行すると変更が行われていない日付の下にフォルダーが並んでいました。`2026-07-feature` のような部分的な日付を含め、完全な日付接頭辞がない名前には従来どおり日付を付けます。命名処理は冪等になりました。

- [#1374](https://github.com/Fission-AI/OpenSpec/pull/1374) [`da3907b`](https://github.com/Fission-AI/OpenSpec/commit/da3907b8a9170711c8b7f63e18352e8577cf7df5) [@clay-good](https://github.com/clay-good) に感謝します！ - fix(completion): PowerShell補完スクリプトを再び解析・読込可能に修正

  生成された `OpenSpecCompletion.ps1` には、空の `switch ($positionalIndex) { }` ブロックが18個含まれていました。これは、すべての位置引数が `path` 型のコマンドで出力されていました（PowerShellはパスを標準で補完するため、case句は生成されません）。case句のないswitchはPowerShellの解析エラー（「Missing condition in switch statement clause」）になり、PowerShellは実行前にファイル全体を解析するため、スクリプトが読み込まれず補完も登録されませんでした。位置引数の補完が1つも生成されない場合、ジェネレーターは位置インデックスのブロック全体を省略するようになり、解析エラーが18件から0件になってタブ補完が機能します。

- [#1388](https://github.com/Fission-AI/OpenSpec/pull/1388) [`9b5d2cd`](https://github.com/Fission-AI/OpenSpec/commit/9b5d2cdd0c1aa4b1b49da4f95c6cec8d7d38b155) [@mc856](https://github.com/mc856) に感謝します！ - ### バグ修正

  - **archiveワークフローテンプレートが2つ目の日付接頭辞を付けるよう案内しないよう修正** — `openspec-archive-change` と `openspec-bulk-archive-change` のスキル／コマンドテンプレート（およびオンボーディング手順のarchive済みパス例）が、`openspec archive` の規則と一致しました。名前がすでに `YYYY-MM-DD-` で始まる変更は元の名前でarchiveし、その他の名前には従来どおり現在の日付を付けます。以前はCLIの動作にかかわらず、`2026-07-04-voice-copilot-v1` という変更にワークフロー指示を適用したエージェントが `archive/2026-07-07-2026-07-04-voice-copilot-v1` を生成していました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - Geminiのコマンドファイルが説明とプロンプト内のTOMLで特殊な意味を持つ文字（引用符、バックスラッシュ、制御文字）をエスケープするようになり、それらを含むテンプレート値から無効な `.toml` ファイルが生成されなくなりました。

- [#1464](https://github.com/Fission-AI/OpenSpec/pull/1464) [`5bcf057`](https://github.com/Fission-AI/OpenSpec/commit/5bcf05766a70ec0163c3e700a3029b1c1da895d8) [@clay-good](https://github.com/clay-good) に感謝します！ - ワークフローのスキルとコマンドが、Claude Code専用のAskUserQuestionツールを使用するようエージェントへ指示しなくなりました。同じテンプレートはすべての対応ツール向けに生成されるため、このツールを持たないOpenCode、Factory Droid、Codexなどのエージェントはエラーになるか、指示で停止していました。ガイダンスは実行環境に依存せず、単にユーザーへ質問するよう案内します。

- [#1403](https://github.com/Fission-AI/OpenSpec/pull/1403) [`2d6c447`](https://github.com/Fission-AI/OpenSpec/commit/2d6c447100c51fb1e5f65c6f6a35ce02a3196a10) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **proposeとfast-forwardスキルからClaude専用のTodoWriteツール名を削除** — 生成された `openspec-propose` と `openspec-ff-change` スキル（および `/opsx:propose` / `/opsx:ff` コマンド）は、Claude Codeにしかない「**TodoWriteツールを使用する**」という指示をすべてのエージェントへ表示していました。Codex、Cursor、Gemini、Copilotなどの対応ツールにはこのツールがなく、エージェントがエラーになるか、ツールを探して停止していました。現在は「進捗管理にTODOリストを使用する」という実行環境に依存しない指示になり、Claude Codeを含むすべての環境で利用できます。

- [#1415](https://github.com/Fission-AI/OpenSpec/pull/1415) [`e2f748c`](https://github.com/Fission-AI/OpenSpec/commit/e2f748c64f05efaeac720f83c71fb6f1b6f6e18d) [@clay-good](https://github.com/clay-good) に感謝します！ - プロトタイプチェーンへ到達する設定キーパスを拒否し、同梱する `yaml` 依存関係を更新しました。

  `openspec config set --allow-unknown __proto__.polluted <value>` は成功と報告し、その後のプロセスで `Object.prototype` へ値を代入していました。`--allow-unknown` は既知キーの検査だけを緩和するためのものですが、すべてのキー検査を省略していたため、`__proto__`、`constructor`、`prototype` の区間がネスト書き込みヘルパーへ到達していました。現在は `--allow-unknown` の有無にかかわらず `config set` がこれらの区間を拒否し、`setNestedValue` / `deleteNestedValue` も呼び出し元にかかわらず拒否します。`featureFlags.myFlag` のような通常のキーは従来どおり動作します。

  `yaml` ランタイム依存関係を2.8.2から2.9.0へ更新し、深くネストされた入力で発生するスタックオーバーフローの修正（2.8.3で修正されたGHSA／アドバイザリ）を取り込みました。

- [#1376](https://github.com/Fission-AI/OpenSpec/pull/1376) [`7958924`](https://github.com/Fission-AI/OpenSpec/commit/7958924e95654af981437951e967983385da8001) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **事前同期後のarchive** — 変更の仕様がarchive前にメイン仕様へ同期済みの場合（`sync` ワークフローの事前同期パターン）でも、`openspec archive` が `ADDED failed … already exists` で失敗しなくなりました。ADDED要件と同じ内容の要件が対象仕様にすでに存在する場合は、適用を何もしない操作として扱います。同名でも内容が異なる要件は実際の競合として引き続きarchiveを中止します（[#1332](https://github.com/Fission-AI/OpenSpec/issues/1332)）。

- [#1386](https://github.com/Fission-AI/OpenSpec/pull/1386) [`b419e96`](https://github.com/Fission-AI/OpenSpec/commit/b419e965bbf413cc658bbac37325ebc147b1c869) [@mc856](https://github.com/mc856) に感謝します！ - ### バグ修正

  - **事前同期後のarchive（RENAMED）** — 変更の名前変更がarchive前にメイン仕様へ同期済みの場合（`sync` ワークフローの事前同期パターン）でも、`openspec archive` が `RENAMED failed … source not found` で失敗しなくなりました。RENAMED要件の元見出しがなく、変更先の見出しが仕様に存在する場合は、名前変更を何もしない操作として扱います。元と変更先が両方ない場合は実際のエラーとして引き続きarchiveを中止し、報告件数には実際に適用した名前変更だけを含めます。

- [#1462](https://github.com/Fission-AI/OpenSpec/pull/1462) [`ebf66c7`](https://github.com/Fission-AI/OpenSpec/commit/ebf66c7ee1df3f7465d7f480753f952483133a73) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec init` が視覚効果を減らす設定を尊重するようになりました。OSで視覚効果の削減が有効な場合（macOSの「視差効果を減らす」、GNOMEのアニメーション無効）、`OPENSPEC_NO_ANIMATION` が設定されている場合、または新しい `--no-animation` フラグを指定した場合は、ウェルカムアニメーションを省略して静的なウェルカム画面を表示します。

- [#1405](https://github.com/Fission-AI/OpenSpec/pull/1405) [`5dfef4b`](https://github.com/Fission-AI/OpenSpec/commit/5dfef4b00c233fbe78f40488bd4ff98f4204684c) [@clay-good](https://github.com/clay-good) に感謝します！ - ### バグ修正

  - **カスタムスキーマの指示がハードコードされたspec-drivenパターンで上書きされないよう修正** — `openspec-continue-change` のスキル／コマンドにはproposal.md、specs、design.md、tasks.md向けの1行の「一般的なアーティファクトパターン」が埋め込まれていたため、カスタムスキーマが馴染みのあるアーティファクト名を再利用すると、エージェントはスキーマの `instruction` フィールドではなく近道の説明に従っていました。現在のテンプレートでは `instruction` フィールドが正式なガイダンスであることを明示し、`propose`、`continue`、`ff` ワークフローのアーティファクト作成手順とガイドラインの両方で、指示が特定のスキルへ作成を委任している場合はそのスキルを呼び出し、その後アーティファクトの存在を確認するよう案内します（[#777](https://github.com/Fission-AI/OpenSpec/issues/777)を修正）。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - Kimi CLIからKimi Codeへの名称変更へ追従し、新しいインストールパスと既存 `.kimi` 設定の自動移行に対応しました。

- [#1415](https://github.com/Fission-AI/OpenSpec/pull/1415) [`e2f748c`](https://github.com/Fission-AI/OpenSpec/commit/e2f748c64f05efaeac720f83c71fb6f1b6f6e18d) [@clay-good](https://github.com/clay-good) に感謝します！ - タイトルが空白で埋められている場合でも、仕様見出しを線形時間で解析するようにしました。

  参照インデックスの構築では、最初のPurpose行を正規表現で読み取っていましたが、空白が大量にある見出しでは二次関数的なバックトラックが発生していました。1万文字のpaddingに60ミリ秒を要し、10万文字では約6秒かかる見込みでした。見出しの走査を手動実装の線形処理へ変更しました。CommonMarkの終了シーケンス（`## Purpose ##`）、7個のハッシュがある行、ハッシュ後に空白がない見出しを含む、生成した30万3千件の入力を以前の実装と比較しており、動作は変わりません。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - archive名やタイムスタンプなどCLIの日付のみの値に、UTCではなくローカル日付を使用するようにしました。夜遅くにarchiveしても翌日の日付になりません。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - カスタムプロファイルに中核ワークフローが不足している場合、`openspec update` が不完全なインストールを暗黙に生成せず警告するようになりました。

- [#1428](https://github.com/Fission-AI/OpenSpec/pull/1428) [`81d5109`](https://github.com/Fission-AI/OpenSpec/commit/81d5109b86f16537deb99f84a772a83235dc9e09) [@taltas](https://github.com/taltas) に感謝します！ - 現在のRoo Code製品への参照を、コミュニティ後継のZoo Codeへ更新しました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 内容がメイン仕様とすでに一致するMODIFIEDデルタを、archiveが何もしない操作として扱うようになりました。完全に事前同期済みの変更では、ファイルを書き換えて変更したと報告せず、「Specs already in sync」と表示します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 複数選択プロンプトをラジオボタンのアイコンではなく、`[x]` / `[ ]` のチェックボックス記号で表示するようにしました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - `specs/<area>/<capability>/spec.md` のようにネストされた仕様パスを再帰的に検出し、parse、apply、archiveで一貫して扱うようにしました。

- [#1410](https://github.com/Fission-AI/OpenSpec/pull/1410) [`b3b05e1`](https://github.com/Fission-AI/OpenSpec/commit/b3b05e1abeb312caefd57e60be799aeb466c1d0e) [@clay-good](https://github.com/clay-good) に感謝します！ - 実際に利用可能になるオンボーディングコマンドだけを案内するようにしました。`openspec init` のウェルカム画面と `openspec update` の「Getting started」概要では、既定の `core` プロファイルが生成しない `/opsx:new` と `/opsx:continue` を掲載し、存在しないコマンドをユーザーへ案内していました。現在は両方とも、インストール済みワークフローのコマンドを表示します。Codexやスキル専用配布のツールなど、コマンドファイルを受け取らないツールでは、`init` と `update` の完了案内もコマンドではなくスキル名（`/openspec-propose`）を示します。

- [#1412](https://github.com/Fission-AI/OpenSpec/pull/1412) [`1dc670d`](https://github.com/Fission-AI/OpenSpec/commit/1dc670deea741b8313b8a22fb975741f84677b3f) [@clay-good](https://github.com/clay-good) に感謝します！ - ### 修正

  - **`/opsx:propose` と `/opsx:ff` が仕様未作成のまま変更を完了しないよう修正。** ワークフローは `proposal` / `design` / `tasks` だけを列挙し、apply段階の `tasks` アーティファクトを停止条件としていました。しかし `status` は対応ファイルが存在すると即座にアーティファクトを `done` とするため、早い段階で `tasks.md` を書くと、`specs/<capability>/spec.md` が未作成でもループが完了していました（仕様駆動ツールで仕様のない変更ができる状態）。現在のループは、1回の `status` 呼び出しから、すべてのapply依存関係と、それらが推移的に `requires` するものを含む完全な必須集合を導出します。不足する各アーティファクトを作成し、そのアーティファクト自身の `instruction` フィールドが条件付きと示す場合にだけスキップします（[#1260](https://github.com/Fission-AI/OpenSpec/issues/1260)、[#788](https://github.com/Fission-AI/OpenSpec/issues/788)）。

  ### 変更

  - **`openspec status --json` が各アーティファクトの `requires` エッジを報告。** `artifacts` 配列の各項目には、直接依存するIDの `requires` 配列が含まれます。`done` を含むすべての状態で存在するため、エージェントは `status` だけから推移的な必須集合を計算できます。追加のみの後方互換な変更で、既存フィールドは変わりません。

- [#1191](https://github.com/Fission-AI/OpenSpec/pull/1191) [`7704702`](https://github.com/Fission-AI/OpenSpec/commit/7704702d61fa71e4f553c21a06bdf8e4ee803b4a) [@mc856](https://github.com/mc856) に感謝します！ - Qwen Code向けに、廃止されたTOML形式ではなくMarkdownコマンドを生成するようにしました。Qwen CodeはYAML frontmatter付きのMarkdownカスタムコマンドを推奨しています。古い `.qwen/commands/opsx-*.toml` ファイルは、更新時に従来のアーティファクトとして削除されます。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 同期済みのRENAMEDデルタでも、元要件の大文字小文字または空白だけが異なる表記が残っている場合は中止するようになりました。REMOVEDデルタと同じ入力ミス防止処理です。

- [#1368](https://github.com/Fission-AI/OpenSpec/pull/1368) [`de78c31`](https://github.com/Fission-AI/OpenSpec/commit/de78c31ffd885a0558ae55d332f74d5485dc01c0) [@clay-good](https://github.com/clay-good) に感謝します！ - ### 修正

  - **再生成したアーティファクトへ手動編集を反映** — continue、propose、fast-forwardワークフロー（および `openspec instructions` の依存関係ブロック）は、会話中に以前確認した版を信用せず、次のアーティファクトを作成する前に依存アーティファクトをディスクから読み直すようエージェントへ案内します。以前は `spec.md` を編集して `design.md` / `tasks.md` を削除し再生成すると、編集前の古い内容に基づくアーティファクトが暗黙に生成される場合がありました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - proposalのガイダンスは、作業を妨げる未解決の質問をdesign.mdへ先送りせず、ユーザーと解決するようになりました。

- [#1392](https://github.com/Fission-AI/OpenSpec/pull/1392) [`a13abea`](https://github.com/Fission-AI/OpenSpec/commit/a13abeac47d419462b0193dbf9423dd466ffe6c7) [@clay-good](https://github.com/clay-good) に感謝します！ - ### 修正

  - 変更の `specs/` 直下に書かれたデルタ仕様が暗黙に無視されないようにしました。`validate` は `specs/spec.md` を受け入れてデルタを数えていましたが、apply/archiveのマージは機能フォルダー（`specs/<capability>/spec.md`）だけを読み取るため、要件が `openspec/specs/` へ反映されないまま検証を通過し、archiveされる可能性がありました。現在の `validate` はマージ経路と同じ検出規則を使用し、誤った場所にあるファイルを修正案付きで報告します。`archive` も完了せずブロックします。

- [#1465](https://github.com/Fission-AI/OpenSpec/pull/1465) [`f917b8b`](https://github.com/Fission-AI/OpenSpec/commit/f917b8be5e1100189ef62320ba9322763053640e) [@clay-good](https://github.com/clay-good) に感謝します！ - アーティファクトをアルファベット順ではなく、スキーマの宣言順に並べるようにしました。

  `specs` と `design` はどちらも `proposal` だけを必要とするため、同時に準備完了になります。以前は同順位をアルファベット順で決め、`design` が先になっていました。`openspec status` はdesignをspecsより上に表示し、`nextSteps` は仕様が存在しない段階で `design.md` の作成を推奨しており、spec-drivenスキーマに記載された `proposal → specs → design → tasks` の順序と矛盾していました。

  同順位ではスキーマのアーティファクト宣言順に従うため、`openspec status`、`status --json`、`nextSteps`、`blocked by:` の一覧、アーティファクトの `unlocks` が一致します。依存関係のエッジは変わらず、新たにブロックされるものもなく、`design.md` は任意のままです。変更されたのは、同時に準備完了となるアーティファクトの順序だけです。カスタムスキーマでも同じことを保証します。依存順序が最優先ですが、2つのアーティファクトが同時に準備完了になる場合は `artifacts:` リストの順序でCLIの推奨を決めるため、意図した順序でなければリストを並べ替えてください。

- [#1446](https://github.com/Fission-AI/OpenSpec/pull/1446) [`5348da9`](https://github.com/Fission-AI/OpenSpec/commit/5348da930c4038ffd5b5a521702b71315dcd0019) [@showms](https://github.com/showms) に感謝します！ - ### バグ修正

  - `openspec schema init --force` が未知のアーティファクトIDを拒否した場合、既存のプロジェクトローカルスキーマを維持します。強制置換は、アーティファクト検証に成功してから開始するようになりました。

- [#1433](https://github.com/Fission-AI/OpenSpec/pull/1433) [`26f009d`](https://github.com/Fission-AI/OpenSpec/commit/26f009d940f311b99db7f310816bb166a99fb3ef) [@clay-good](https://github.com/clay-good) に感謝します！ - 変更の検索に `proposal.md` が不要になりました。`openspec show`、`openspec change list/show/validate`、シェル補完は、`openspec list`、`status`、`instructions`、`validate` と同様にディレクトリから変更を解決します。

  以前は `.openspec.yaml` だけを作成する `openspec new change` の変更が、proposalを書くまで `openspec show` で `Unknown item` と報告され、補完や `openspec change list` にも表示されませんでした。proposalアーティファクトを持たないスキーマの変更は常に解決不能でした。現在の `openspec change list` は `openspec list` と同じ集合を報告し、proposalが未作成でもタスク数を維持し、`(unable to read)` ではなく `(no proposal.md yet)` と表示します。そのような変更を表示すると、proposalが未作成であることと `openspec status --change <name>` の利用を案内します。

- [#1468](https://github.com/Fission-AI/OpenSpec/pull/1468) [`fc886af`](https://github.com/Fission-AI/OpenSpec/commit/fc886af7f93068482bbf2c66fd1eb76b40c6a22f) [@clay-good](https://github.com/clay-good) に感謝します！ - continue、update、verify、sync、archiveの各ワークフロースキルが、applyと同じ方法で変更を選択するようになりました。指定された名前を使用し、会話のコンテキストから推測し、アクティブな変更が1つだけなら自動選択し、実際に曖昧な場合だけ選択を求めます。以前は常に質問する（「推測または自動選択しない」）よう指示されていたため、アクティブな変更が1つだけでも、回答が1つしかない質問で停止していました。選択時には常に「Using change: <name>」と変更方法を案内します。一括archiveは引き続き必ず選択を求めます。

- [#1194](https://github.com/Fission-AI/OpenSpec/pull/1194) [`b7c85c7`](https://github.com/Fission-AI/OpenSpec/commit/b7c85c741ca56748a4ae095b573fe4550c5c977f) [@mc856](https://github.com/mc856) に感謝します！ - スキル専用配布で `/opsx:*` コマンド参照が出力される問題を修正しました。`delivery: 'skills'` を設定した場合、init、update、ワークスペースのスキル設定で生成されるSKILL.mdは、生成されないコマンドではなく、対応するスキル（例: `/openspec-apply-change`）を参照します。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - specsの指示にconcepts文書の仕様内容ガイダンスを含め、生成される仕様が要件／シナリオ形式に従うようにしました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 静的なウェルカム画面（視覚効果の削減、`--no-animation`、幅の狭いターミナル）が、Enterキーを見えないツール選択へ送信せず、案内どおりEnter入力を待つようになりました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - syncとarchiveワークフローが、リポジトリ内の `openspec/specs` を仮定せず、ストアを考慮したルートからメイン仕様を解決するようになりました。

- [#1402](https://github.com/Fission-AI/OpenSpec/pull/1402) [`0da5f98`](https://github.com/Fission-AI/OpenSpec/commit/0da5f98e147543a44379e32295e2e9798d775d83) [@clay-good](https://github.com/clay-good) に感謝します！ - エージェントが `openspec/specs/` にデルタ操作見出し（`## ADDED/MODIFIED Requirements`）を残さないよう、sync-specsスキルにメイン仕様の形式を示しました。この見出しを含むマージ済みメイン仕様は、`openspec view` で要件数0として解析されます（[#1120](https://github.com/Fission-AI/OpenSpec/issues/1120)）。

- [#1476](https://github.com/Fission-AI/OpenSpec/pull/1476) [`8731290`](https://github.com/Fission-AI/OpenSpec/commit/87312900f532c6c13ea556d4badaff2efdfa9602) [@clay-good](https://github.com/clay-good) に感謝します！ - テレメトリが `posthog-node` に依存しなくなりました。単一の利用イベントは、同じエンドポイントへ標準のfetchで送信します。OpenSpecのインストール時に、公開頻度の高い `posthog-node` / `@posthog/core` / `@posthog/types` の依存ツリーを取得しなくなりました。このツリーはpnpmの `minimumReleaseAge` のようなサプライチェーンの公開後経過期間ポリシーで、下流のインストールを失敗させていました（[#1390](https://github.com/Fission-AI/OpenSpec/issues/1390)）。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 古いCLIの検査でインストール方法の判定を強化しました。単に `volta` という名前のディレクトリがあるだけではアップグレード案内を変更せず、Windowsのnpm所有権検査ではnpmが実際に書き込む `openspec.cmd` shimとも照合します。また、レジストリがhttpsから暗号化されていないhttpへリダイレクトした場合は追従しません。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - 古いCLIの検査で制限時間を超えた場合、リダイレクトされたレジストリ接続のソケットを開いたままにせず切断するようになりました。

- [#1442](https://github.com/Fission-AI/OpenSpec/pull/1442) [`10fa39b`](https://github.com/Fission-AI/OpenSpec/commit/10fa39b1c3a3e88c02ae7d3053864c03a793ff47) [@hsusul](https://github.com/hsusul) に感謝します！ - `openspec update` が、スキルなしでコマンドファイルだけを設定したツール（配布方法 `commands`）も更新するようになりました。以前は生成バージョンをスキルファイルからしか読み取らなかったため、このようなツールは永久に「up to date」と報告され、CLIをアップグレードしてもコマンドファイルが再生成されませんでした。コマンドファイルにはバージョン情報がないため、OpenSpecは現在生成する内容と比較します。選択を解除したワークフローが残したコマンドファイルの削除も含みます。CRLF改行とUTF-8 BOMは差異ではなくチェックアウト時の差とみなすため、Windowsのcloneで不要な更新を報告しません。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - `delivery: commands` を指定した `openspec update` が、スキル専用ツールのスキルを暗黙に削除せず、initと同じ設定修正案を表示するようになりました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - `openspec validate` は、読み取れないspecs/ディレクトリを「no deltas found」と誤診せず、本来の読み取りエラーとして報告します。

- [#1455](https://github.com/Fission-AI/OpenSpec/pull/1455) [`6b3623a`](https://github.com/Fission-AI/OpenSpec/commit/6b3623a39e96f49995d38d642738b31f68e92039) [@c4patino](https://github.com/c4patino) に感謝します！ - `openspec view` が常に現在のディレクトリを読むのではなく、設定されたOpenSpecルートを解決し、関連コマンドと同様に `--store <id>` を受け付けるようになりました。`openspec/config.yaml` が外部ストアを指すプロジェクトでは、`openspec list` が同じストアを正しく読む一方、ダッシュボードには仕様0件、要件0件と表示されていました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - Windowsでウェルカム画面の後に最初のキー入力を破棄せず、維持するようになりました。

- [#1475](https://github.com/Fission-AI/OpenSpec/pull/1475) [`17af60c`](https://github.com/Fission-AI/OpenSpec/commit/17af60c66e4c049e3986fdbafcdc16b202cda59f) [@clay-good](https://github.com/clay-good) に感謝します！ - zsh補完のインストールが `$ZSH` と `$ZSH_CUSTOM` を尊重するようになり、独自の場所にあるOh My Zsh環境でも、シェルが実際に読み込む場所へ補完を配置します。

## 1.6.0

- **[OpenSpec-J]** OpenSpec v1.5.0 / v1.6.0 の upstream 変更を取り込み
- **[OpenSpec-J]** Stores・worksets・`/opsx:update`・Oh My Pi / Trae 対応を含む新規ドキュメント、CLI 文言、OPSX テンプレートを日本語化
- **[OpenSpec-J]** 翻訳棚卸し: v1.0.0 以降に変更された `src/**/*.ts` のユーザー向け文言を再点検
- **[OpenSpec-J]** 翻訳棚卸し: README と docs の対話例・AI 出力例・コードコメントに残っていた英語文言を日本語化
- **[OpenSpec-J]** README の同期元バージョンを OpenSpec v1.6.0 に更新

### マイナーな変更

- [#1090](https://github.com/Fission-AI/OpenSpec/pull/1090) [`3f0ca3f`](https://github.com/Fission-AI/OpenSpec/commit/3f0ca3f6ce6f2ec41260c5cbe7954b7e46adcf43) ありがとうございます [@jjxyxsjr](https://github.com/jjxyxsjr)!] - ### 新機能

- **TRAE コマンド アダプター** - Trae IDE 用のコマンド アダプターを追加し、カスタム スラッシュ コマンド用の `.trae/commands/opsx-<id>.md` ファイルの生成を可能にします。

- [#1340](https://github.com/Fission-AI/OpenSpec/pull/1340) [`1552731`](https://github.com/Fission-AI/OpenSpec/commit/15527310f9be13cc9a4035ea01b93ba85873d956) ありがとうございます [@TabishB](https://github.com/TabishB)! - ### 新機能

- **Oh My Pi サポート** — ツール検出や予想される `.omp` ディレクトリ レイアウトなど、Oh My Pi プロジェクト用のネイティブ OPSX コマンドとスキルを生成します。
- **計画成果物を適切に更新** — `/opsx:update` を使用して、既存の変更の計画成果物を修正し、関連する成果物を調整し、実装作業を `/opsx:apply` に委任し続けます。

### バグ修正

- **ストアの新規登録** — 空の変更、仕様、またはアーカイブ ディレクトリがコミットされる前に、新しく作成したストアを登録して使用します。
- **より安全な要件のアーカイブ** - 古い `MODIFIED` 要件が、以前のアーカイブによって追加されたシナリオをサイレントに削除するのを防ぎます。

### パッチの変更

- [#1300](https://github.com/Fission-AI/OpenSpec/pull/1300) [`a5bfeda`](https://github.com/Fission-AI/OpenSpec/commit/a5bfedafc8b3d914fe01d05eb36ad9ad3fbe35a2) ありがとうございます] [@clay-good](https://github.com/clay-good)! - ＃＃＃ 特徴

- **生成されたスキルとコマンドでの OpenSpec CLI の自動承認** - 生成されたすべての `SKILL.md` (すべてのツール) とすべての Claude Code `/opsx:*` スラッシュ コマンドには、前面に `allowed-tools: Bash(openspec:*)` が含まれるようになりました。そのため、エージェント スキル標準を尊重するエージェントは、呼び出しごとに承認を求めるプロンプトを表示せずに `openspec` コマンドを実行します。このフィールドを認識しないツールはそれを無視します。範囲は `openspec` CLI に限定されます。 `allowed-tools` は制限ではなく事前承認を行うため、スキルまたはコマンドが使用する他のすべてのツールは通常の権限設定で使用可能なままになります。

- [#1311](https://github.com/Fission-AI/OpenSpec/pull/1311) [`5956a8e`](https://github.com/Fission-AI/OpenSpec/commit/5956a8e872f41a8f690922b5c9b6927970252b2a) ありがとうございます] [@danilopopeye](https://github.com/danilopopeye)! - ### バグ修正

- **ヒューマン モードでブロックされたときに `archive` がゼロ以外で終了する** — `openspec archive <change> -y` (および `--json` 以外の呼び出し) は、検証が失敗して何もアーカイブされなかった場合に終了コード 0 を返さなくなりました。人間モードの 3 つのブロック パス (デルタ仕様検証の失敗、仕様の再構築の失敗、および再構築された仕様の検証の失敗) は、既存の `--json` の動作と一致する `process.exitCode = 1` を設定するようになりました。以前は、コマンドは「検証に失敗しました」（または「中止されました。ファイルは変更されませんでした。」）を出力して 0 で終了し、スクリプトと CI にアーカイブが成功したと信じさせていました。 `archive` を、`apply` 命令に対してすでに承認されているのと同じ終了コード保証に合わせます (#1250)。

- [#1280](https://github.com/Fission-AI/OpenSpec/pull/1280) [`a325305`](https://github.com/Fission-AI/OpenSpec/commit/a3253051ea1934fd0d76620addb855dfce801742) ありがとうございます] [@clay-good](https://github.com/clay-good)! - ### バグ修正

- **`validate` は `status` のような変更を解決します** — `openspec validate <change>` (および `--all`/`--changes` および対話型セレクター) は、`proposal.md` を必要とするのではなく、`status`/`instructions` と一致するディレクトリの存在によって変更を解決するようになりました。スキャフォールドまたはまだオーサリング中の変更は、`Unknown item` として報告されるのではなく検証され、解決されたが無効な変更はゼロ以外で終了するようになりました。デルタ検出では、ネストされた `specs/<area>/<capability>/spec.md` レイアウトも再帰されます。 (#1182)
- **タスクの進行状況はネストされた/グロブ `tasks.md` を読み取ります** — `openspec view`、`list`、および `archive` 不完全タスク ゲートは、追跡されたタスク アーティファクトの `generates` グロブ (`status` が使用するのと同じファイル解像度) を通じてタスクの進行状況を解決するようになり、ネストされた `tasks.md` ファイルにタスクが存在する変更は正しく分類されます。未完成のままアーカイブすることはできなくなります。 (#1202)
- **本体キーワードのヒントはメイン仕様に適用する必要があります** — 規範的なキーワードが `### Requirement:` ヘッダー内にのみ存在するメイン仕様要件は、変更デルタとして同じ対象を絞った「本体行に移動する」修正を 1 回だけ発行されるようになりました。 (#1156)

- [#1281](https://github.com/Fission-AI/OpenSpec/pull/1281) [`9a0dfb5`](https://github.com/Fission-AI/OpenSpec/commit/9a0dfb5cd136b423c9f13c0b29ec3ea69761b4e6) ありがとうございます] [@clay-good](https://github.com/clay-good)! - ### バグ修正

- **要件読み取りの忠実度** — `validate <change>`、`validate <spec>`、および `archive` で使用される要件リーダーは、1 つのフェンス、メタデータ、および複数行を認識した抽出に統合され、変更デルタ パスとメイン仕様パスの間の既知の相違点が解消されました (残りの相違点は変更の設計ドキュメントに文書化されています)。

- 後の本文行に折り返される `SHALL`/`MUST` キーワードは、削除されずに検出されます (#361)。
- 説明の前のメタデータ行 (`**ID**:`、`**Priority**:`) は仕様パス上でスキップされ、変更パス (#418) と一致します。完全にメタデータとして記述された要件 (`**Constraint**: The system MUST ...` など) は、その行を空にするのではなくテキストとして保持します。
- 散文行の前にある囲われたコード ブロックは要件テキストになりません (#312)。
- フェンスで囲まれた例内の `#### Scenario:` は、`validate <spec>` と一致する `validate <change>` の実際のシナリオとしてカウントされなくなりました。
- `SHALL`/`MUST` 検出では、すべてのリーダーにわたって 1 つの単語全体の述語が使用され、本文のない要件は両方のパスのヘッダー タイトルにフォールバックします。

表示される要件テキスト (JSON 出力やデルタの説明など) に、最初の行だけではなく完全な要件本文が反映されるようになりました。アーカイブされた仕様の内容は変更されません。アーカイブの再構築では、解析されたテキストではなく、生の `### Requirement:` ブロックが読み取られます。

- **表面の非正規デルタ ヘッダー** — `## ADDED`/`## MODIFIED Requirements` セクションに正規の `### Requirement:` ヘッダーではないレベル 3 ヘッダー (デルタ リーダーが暗黙的にスキップするヘッダー (浮遊 `### Documentation Requirements` ディバイダーなど) が含まれている場合)、`validate <change>` は INFO ノートを発行するようになりました。このメモは、`--strict` (#498) を含め、`valid` の結果を変更することはありません。

## 1.5.0

### マイナーな変更

- [#1267](https://github.com/Fission-AI/OpenSpec/pull/1267) [`96f6cac`](https://github.com/Fission-AI/OpenSpec/commit/96f6cacb206c65bee30066f6a1f4e9b855a0d783) ありがとうございます] [@TabishB](https://github.com/TabishB)! - ### 新機能

- **ストア (非常に初期のベータ)** — 仕様と変更を整理する簡単な方法としてストアを導入し、ワークスペースとイニシアチブ モデルを置き換えます。この機能は非常に初期のベータ版です。今後のリリースでは荒削りな点や重大な変更が含まれることが予想されます。

### バグ修正

- **構成解析** — JSON コンテナーにラップされた構成値が正しく解析されるようになりました。

### パッチの変更

- [#1240](https://github.com/Fission-AI/OpenSpec/pull/1240) [`cbf386b`](https://github.com/Fission-AI/OpenSpec/commit/cbf386bd6888f103f8ff7d59b3eab98ce5b57998) ありがとうございます] [@zied-jlassi](https://github.com/zied-jlassi)! - 修正(アダプター): 生成された YAML フロントマターでのエスケープ改行

`escapeYamlValue` は、引用符が必要な文字として `\r` にフラグを立てましたが、それをエスケープしなかったので、二重引用符で囲まれたスカラー内にリテラルのキャリッジ リターンが残され、YAML 行の折りたたみ/正規化によって暗黙的に値が破損する可能性がありました (CRLF で作成されたコマンドの説明では現実的です)。復帰は `\r` としてエスケープされるようになりました。ヘルパー (以前は 5 つのアダプター (bob、claude、cursor、pi、windsurf) にわたって逐語的に複製されていました) は、共有 `command-generation/yaml.ts` モジュールに抽出されるため、動作の一貫性が保たれ、1 か所で修正されます。

## 1.4.1

- **[OpenSpec-J]** v1.4.1 追従のため、beta workspace のローカル表示状態を `.openspec-workspace/view.yaml` に移す upstream 変更を取り込み
- **[OpenSpec-J]** README / CLI リファレンス / workspace beta ガイド / context store・initiative 関連コマンド / workspace planning スキーマの v1.4.1 追加文言を日本語化
- **[OpenSpec-J]** README の同期元バージョンを OpenSpec v1.4.1 に更新

### パッチ変更

- [#1165](https://github.com/Fission-AI/OpenSpec/pull/1165) [`0a01146`](https://github.com/Fission-AI/OpenSpec/commit/0a01146c181a3af8dbf645547bcbe20c0d48d615) [@TabishB](https://github.com/TabishB) ありがとう！ - beta workspace の表示状態を `.openspec-workspace/view.yaml` へ移動しました。トップレベルの `openspec update` が workspace update に振り分けられないようにし、外部ルートの `workspace.yaml` を無視することで Dagster プロジェクトも通常どおり更新できるようにしました。

## 1.4.0

### マイナー変更

- [#1003](https://github.com/Fission-AI/OpenSpec/pull/1003) [`342ed43`](https://github.com/Fission-AI/OpenSpec/commit/342ed43e694abba65a3ea275f94ba3b77df85da3) [@Miss-you](https://github.com/Miss-you) ありがとう！ - ### 新機能

  - **Kimi CLI サポート** — OpenSpec は `.kimi/skills/` を使い、Kimi CLI を skills-only の対応ツールとして初期化できるようになりました。

  ### その他

  - Kimi 専用ドキュメントと init のテスト範囲を追加し、スキルベースの `/skill:openspec-*` 利用に合わせました。

- [#1154](https://github.com/Fission-AI/OpenSpec/pull/1154) [`aa16080`](https://github.com/Fission-AI/OpenSpec/commit/aa16080d16b70f7b26cebd465334b2e16c0e7a43) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 新機能

  - **Mistral Vibe サポート** — OpenSpec は `.vibe/skills/` を使い、Mistral Vibe を skills-only の対応ツールとして初期化できるようになりました。

  ### バグ修正

  - **大文字小文字を区別しない requirement 見出し** — Requirement 見出しを大文字小文字に関係なく解析するようになり、見出しの表記ゆれで仕様の解析に失敗しなくなりました。
  - **oh-my-zsh での zsh 補完** — shell 補完のセットアップを修正し、oh-my-zsh の `compinit` 環境でもタブ補完が正しくインストールされるようになりました。

  ### その他

  - **わかりやすい検証ヒント** — requirement の見出しだけに SHALL/MUST が含まれる場合、`openspec validate` は汎用エラーではなく、キーワードを requirement 本文行へ移すよう案内するようになりました。

- [#1030](https://github.com/Fission-AI/OpenSpec/pull/1030) [`485c97e`](https://github.com/Fission-AI/OpenSpec/commit/485c97e97d766e35dd16c02370baee2044abc4f4) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 新機能

  - sync ワークフローをデフォルトの core profile に含めました。新規インストールでは `/opsx:sync` のスキルとコマンドがデフォルトで生成されます。

### パッチ変更

- [#1111](https://github.com/Fission-AI/OpenSpec/pull/1111) [`7fdb177`](https://github.com/Fission-AI/OpenSpec/commit/7fdb1771585b1688597d73dde5a8bc906084d0de) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 修正

  - Windows の短いパスやシンボリックリンクの別名が正規の workspace ルートへ解決される場合でも、workspace planning の検出を維持するようにしました。

## 1.3.1

- **[OpenSpec-J]** v1.3.1 追従のため、アーティファクトパスの正規化、glob を使った生成先の解決、メイン仕様内で見落とされる要件の検出、`--json` 指定時の進捗表示抑止、テレメトリ送信失敗時のエラー抑止に関する変更を取り込み
- **[OpenSpec-J]** README / CLI リファレンス / ワークフローテンプレート / パーサー・検証メッセージの v1.3.1 追加文言を日本語化
- **[OpenSpec-J]** 翻訳棚卸しとして、`archive` / `bulk-archive` / `onboard` / `verify` ワークフローテンプレートに残っていた英語の出力例を日本語化
- **[OpenSpec-J]** `skill-templates-parity` のハッシュを再計算し、テンプレート更新後の期待値へ更新
- **[OpenSpec-J]** `pnpm build` と `pnpm test` を実施し、`69 files / 1402 tests` の全テスト成功を確認

### パッチ変更

- [#995](https://github.com/Fission-AI/OpenSpec/pull/995) [`d1f3861`](https://github.com/Fission-AI/OpenSpec/commit/d1f3861d9ec694cc924b042b5da01963dcf93137) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - **アーティファクトパスの正規化** — ワークフローで扱うアーティファクトのパスを `realpath` で実体解決するようになりました。シンボリックリンクや、大文字小文字を区別しないファイルシステムでも、apply / archive 時にパス不一致が起きにくくなります。
  - **glob を使った生成先の解決** — glob パターンを含むアーティファクト生成先を、適用指示の中で実在するファイルパスの一覧として解決できるようになりました。glob を使わない生成先は、ファイルパスとして存在することを確認します。
  - **メイン仕様内で見落とされる要件の検出** — コードブロック内の例や、`## Requirements` セクション外に置かれた要件など、検証・一覧表示・アーカイブ処理から見えなくなる要件を検出できるようになりました。
  - **`--json` 出力の安定化** — `--json` 指定時は進捗表示を出さないようになりました。標準出力と標準エラーをまとめて読む AI エージェントでも、JSON を安定して解析できます。
  - **制限されたネットワーク環境でのテレメトリ抑止** — PostHog への送信が失敗しても CLI の実行を妨げないよう、1 秒でタイムアウトし、再試行とリモート設定取得を無効化しました。`PostHogFetchNetworkError` が利用者に表示されにくくなります。テレメトリのオプトアウト方法は README、インストールガイド、CLI リファレンスの目立つ位置に記載されます。

## 1.3.0-2

- **[OpenSpec-J]** v1.3.0 追従時に反映漏れがあった本家側の書式変更を取り込み（`explore.ts` の ASCII 図と表の余白調整、`onboard.ts` のコマンド表の列幅調整、`docs/workflows.md` の「（拡張モード）」見出しと `/opsx:propose` 行の追加）
- **[OpenSpec-J]** v1.2.0 以前から残っていた英語メッセージを日本語化（`init.ts` の `Invalid profile` / `OpenSpec configured` / `Detected tool directories` / `Removed: ...`、`migration.ts` の移行完了ログ、`config.ts` のグローバル設定警告、`powershell-installer.ts` の各種警告文）
- **[OpenSpec-J]** `skill-templates-parity` のハッシュを再計算し、`config profile` と `init` のテスト期待値を日本語文言に更新
- **[OpenSpec-J]** `OPENSPEC_TELEMETRY=0 pnpm test` を実施し、`68 files / 1365 tests` の全テスト成功を確認


## 1.3.0-1

- **[OpenSpec-J]** v1.3.0 に `config` / `onboard` 関連の日本語化漏れがありました。ご不便をおかけして申し訳ありません。
- **[OpenSpec-J]** `openspec config` の一覧表示と `config profile` の対話画面に残っていた英語文言を日本語化
- **[OpenSpec-J]** `onboard` テンプレートのコマンド表と完了時の案内に残っていた英語文言を日本語化
- **[OpenSpec-J]** テスト並列実行時の衝突を避けるため、一部テストの一時ディレクトリをユニーク化
- **[OpenSpec-J]** `OPENSPEC_TELEMETRY=0 pnpm test` を実施し、`68 files / 1365 tests` の全テスト成功を確認

## 1.3.0

- **[OpenSpec-J]** v1.3.0 追従のため、README / CLI / OPSX ドキュメントで案内する基本的な進め方を `/opsx:propose` 中心に更新
- **[OpenSpec-J]** Bob / Junie / Lingma / ForgeCode の追加に合わせて、ツール一覧・初期化ヘルプ・コマンド生成関連の文言を日本語化
- **[OpenSpec-J]** `OpenCode` のコマンド出力先変更（`.opencode/command/` → `.opencode/commands/`）に追従し、説明文と生成先を更新
- **[OpenSpec-J]** `pi` 向けのコマンド参照変換、GitHub Copilot の自動検出改善、シェル補完を明示的に実行した場合だけインストールする方式への変更に追従
- **[OpenSpec-J]** `bulk-archive` / `onboard` テンプレートの更新に合わせて `skill-templates-parity` のハッシュを再計算

### マイナー変更

- [#952](https://github.com/Fission-AI/OpenSpec/pull/952) [`cce787e`](https://github.com/Fission-AI/OpenSpec/commit/cce787ec4083da2b27781f6786f5ce0002909a7b) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 新機能

  - **Junie 対応** — JetBrains Junie 向けの設定ファイルとコマンド生成を追加
  - **Lingma IDE 対応** — Lingma IDE 向けの設定を追加
  - **ForgeCode 対応** — ForgeCode をサポート対象ツールに追加
  - **IBM Bob 対応** — IBM Bob コーディングアシスタントをサポート対象に追加

  ### バグ修正

  - **シェル補完のインストール方式変更** — 補完は明示的に実行した場合だけインストールするよう変更し、PowerShell で文字化けする問題を修正
  - **GitHub Copilot の自動検出** — 空の `.github/` ディレクトリだけで GitHub Copilot を誤検出しないよう修正
  - **pi.dev 向けコマンド生成** — コマンド参照の変換とテンプレート引数の受け渡しを修正

### パッチ変更

- [#760](https://github.com/Fission-AI/OpenSpec/pull/760) [`61eb999`](https://github.com/Fission-AI/OpenSpec/commit/61eb999f7c6c0fc98d2e7f3678756fce6a3f4378) [@fsilvaortiz](https://github.com/fsilvaortiz) ありがとう！ - **OpenCode 連携** が公式ディレクトリ規約に合わせて `.opencode/commands/`（複数形）を使うよう修正 (#748)

- [#759](https://github.com/Fission-AI/OpenSpec/pull/759) [`afdca0d`](https://github.com/Fission-AI/OpenSpec/commit/afdca0d5dab1aa109cfd8848b2512333ccad60c3) [@fsilvaortiz](https://github.com/fsilvaortiz) ありがとう！ - `openspec status` が変更ゼロ件のとき、エラー終了せず正常に終了するよう修正 (#714)

## 1.2.0

- **[OpenSpec-J]** v1.2.0 追従のため、全スキルテンプレート（`propose` を含む）・ドキュメント・CLI メッセージを日本語化
- **[OpenSpec-J]** README の同期元バージョンを更新
- **[OpenSpec-J]** `skill-templates.ts` が `workflows/` 配下へ分割されたため、日本語訳を各ファイルへ移植（`propose` は新規翻訳）
- **[OpenSpec-J]** `SKILL_NAMES` / `COMMAND_IDS` に `openspec-propose` を追加（文字列置換ではなくコード変更）
- **[OpenSpec-J]** `searchable-multi-select` のキー操作変更（Tab → Enter / Space）に合わせて、ヒント文とテスト期待値を更新
- **[OpenSpec-J]** `skill-templates-parity` テストでハッシュを検証するようになったため、日本語化後のハッシュ値を再計算して更新

### マイナー変更

- [#747](https://github.com/Fission-AI/OpenSpec/pull/747) [`1e94443`](https://github.com/Fission-AI/OpenSpec/commit/1e94443a3551b228eecbc89e95d96d3b9600a192) [@TabishB](https://github.com/TabishB) ありがとう！ - ### 新機能

  - **プロファイル機能** — `core`（4つの基本ワークフロー）または `custom`（任意の組み合わせを選択）プロファイルで、インストールするスキルを制御できます。新しい `openspec config profile` コマンドでプロファイルを管理します。
  - **`propose` ワークフロー** — 設計・仕様・タスクを含む変更提案を、1回のリクエストでまとめて作成できるようになりました。`new` と `ff` を別々に実行する必要がなくなります。
  - **AI ツール自動検出** — `openspec init` がプロジェクト内の既存ツールディレクトリ（`.claude/`、`.cursor/` など）をスキャンし、検出したツールをあらかじめ選択します。
  - **Pi (pi.dev) 対応** — Pi コーディングエージェントを、プロンプトとスキル生成に対応したサポート対象ツールへ追加
  - **Kiro 対応** — AWS Kiro IDE を、プロンプトとスキル生成に対応したサポート対象ツールへ追加
  - **同期時に非選択ワークフローを削除** — `openspec update` が選択されていないワークフローのコマンドファイルとスキルディレクトリを削除し、プロジェクト内に不要な生成物が残りにくくなりました
  - **設定のずれを警告** — `openspec config list` が、グローバル設定と現在のプロジェクト設定にずれがある場合に警告を表示

  ### バグ修正

  - 新しく初期化したプロジェクトで `onboard` の事前確認が「初期化されていません」という誤ったエラーを表示する問題を修正
  - `archive` ワークフローが同期中に途中で停止する問題を修正（同期完了後に正しく再開するよう改善）
  - `onboard` のシェルコマンドに Windows PowerShell 向けの代替手順を追加

## 1.1.1

- **[OpenSpec-J]** v1.1.1 追従のため、OpenCode 向けコマンド参照の変換と、`update` / `init` の日本語コメント・リンクを反映
- **[OpenSpec-J]** README の同期元バージョンを更新
- **[OpenSpec-J]** 過去の取り消しにより、本家に含まれる Nix flake の改善（`package.json` を参照した動的バージョン指定、fileset に基づく `src` 対象範囲、`update-flake.sh` の運用改善）が未反映だったため修正しました。ご迷惑をおかけし申し訳ありません。

### パッチ変更

- [#627](https://github.com/Fission-AI/OpenSpec/pull/627) [`afb73cf`](https://github.com/Fission-AI/OpenSpec/commit/afb73cf9ec59c6f8b26d0c538c0218c203ba3c56) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - **OpenCode のコマンド参照** — 生成ファイル内のコマンド参照が `/opsx:` ではなく `/opsx-` のハイフン形式を使うようになり、OpenCode で正しく動作するように修正

## 1.1.0

- **[OpenSpec-J]** v1.1.0 追従のため、OPSX ドキュメント・ツール一覧・テンプレート・コマンド生成の文言を日本語化し、Codex / Windsurf の新しいパス仕様に合わせて説明を更新
- **[OpenSpec-J]** README の同期元バージョンを更新

### マイナー変更

- [#625](https://github.com/Fission-AI/OpenSpec/pull/625) [`53081fb`](https://github.com/Fission-AI/OpenSpec/commit/53081fb2a26ec66d2950ae0474b9a56cbc5b5a76) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - **Codex のグローバルパス対応** — Codex 連携がグローバルパスを正しく解決し、プロジェクト外から実行した際にワークフローファイル生成が失敗する問題を修正 (#622)
  - **別デバイス間または制限付きパスでのアーカイブ** — `rename` が `EPERM` / `EXDEV` で失敗した場合は `copy` + `remove` にフォールバックし、ネットワークドライブや外部ドライブでの失敗を修正 (#605)
  - **ワークフロー完了メッセージの改善** — 次に実行できるスラッシュコマンドのヒントを表示 (#603)
  - **Windsurf のワークフローファイルパス** — `commands` ではなく `workflows` を使うよう修正 (#610)

### パッチ変更

- [#550](https://github.com/Fission-AI/OpenSpec/pull/550) [`86d2e04`](https://github.com/Fission-AI/OpenSpec/commit/86d2e04cae76a999dbd1b4571f52fa720036be0c) [@jerome-benoit](https://github.com/jerome-benoit) ありがとう！ - ### 改善

  - **Nix flake の保守性向上** — `package.json` から動的にバージョンを読み取り、同期作業を軽減
  - **Nix ビルドの最適化** — `node_modules` とアーティファクトを除外し、ビルド時間を短縮
  - **`update-flake.sh` の改善** — ハッシュが既に正しい場合は再ビルドをスキップ

  ### その他

  - Nix CI 用アクションを最新版へ更新（nix-installer v21、magic-nix-cache v13）

## 1.0.2

- **[OpenSpec-J]** v1.0.2 の OPSX 体験を日本語で追えるようにするため、ドキュメント・CLI メッセージとテンプレートを日本語化（会話例・コードブロック含む）
- **[OpenSpec-J]** README に Codex 利用時の注釈（`openspec init` が生成するプロンプトファイルの扱い）を追記
- **[OpenSpec-J]** 新規オンボーディングスキルの追加に伴い構造を更新（**文字列翻訳だけでは新規スキルが検出・生成されず機能差が出るため**、`skill-templates` と `tool-detection` を整合し、`openspec-onboard` の生成数を本家と一致させた）

### パッチ変更

- [#596](https://github.com/Fission-AI/OpenSpec/pull/596) [`e91568d`](https://github.com/Fission-AI/OpenSpec/commit/e91568deb948073f3e9d9bb2d2ab5bf8080d6cf4) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - 仕様命名規則を明確化 — 仕様は変更名ではなく機能名（`specs/<capability>/spec.md`）で命名する
  - タスクのチェックボックス形式の案内を修正 — apply フェーズの進捗管理には `- [ ]` 形式が必須であることを明確化

## 1.0.1

### パッチ変更

- [#587](https://github.com/Fission-AI/OpenSpec/pull/587) [`943e0d4`](https://github.com/Fission-AI/OpenSpec/commit/943e0d41026d034de66b9442d1276c01b293eb2b) [@TabishB](https://github.com/TabishB) ありがとう！ - ### バグ修正

  - オンボーディングドキュメントのアーカイブパス誤りを修正 — テンプレートを正しい `openspec/changes/archive/YYYY-MM-DD-<name>/` に変更（誤り: `openspec/archive/YYYY-MM-DD--<name>/`）

## 1.0.0

### 重大な変更

- [#578](https://github.com/Fission-AI/OpenSpec/pull/578) [`0cc9d90`](https://github.com/Fission-AI/OpenSpec/commit/0cc9d9025af367faa1688a7b2606a2549053cd3f) [@TabishB](https://github.com/TabishB) ありがとう！ - ## OpenSpec 1.0 — OPSX リリース

  ワークフローをゼロから再構築しました。OPSX では、旧来のフェーズ固定型 `/openspec:*` コマンドを、AI がアーティファクトの有無・作成できる状態かどうか・各アクションで次に何が可能になるかを理解できる、アクション単位の仕組みに置き換えました。

  ### 破壊的変更

  - **旧コマンドの削除** — `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` は廃止
  - **設定ファイルの削除** — ツール固有の指示ファイル（`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `project.md`）は生成されなくなりました
  - **移行** — `openspec init` を実行して移行します。旧アーティファクトは検出され、確認のうえで整理されます

  ### 静的プロンプトから動的指示へ

  **以前:** プロジェクト状態に関係なく、AI は毎回同じ静的指示を受け取っていました。

  **現在:** 指示は 3 層から動的に組み立てられます。

  1. **コンテキスト** — `config.yaml` から読み取るプロジェクト背景（技術スタック、規約）
  2. **ルール** — アーティファクト固有の制約（例:「未知の部分には調査タスクを提案する」）
  3. **テンプレート** — 出力ファイルの実際の構造

  AI は CLI に現在の状態を問い合わせ、存在するアーティファクト、作成可能なアーティファクト、満たされた依存関係、各アクションによって次に可能になる作業を把握します。

  ### フェーズ固定からアクション単位へ

  **以前:** proposal → apply → archive の直線的なワークフローで、前の工程へ戻ったり反復したりするのが難しい構造でした。

  **現在:** 変更に対して柔軟にアクションできます。どのアーティファクトもいつでも編集でき、状態はアーティファクトグラフが自動で追跡します。

  | コマンド             | 内容                                                 |
  | -------------------- | ---------------------------------------------------- |
  | `/opsx:explore`      | 変更に着手する前にアイデアを検討する                 |
  | `/opsx:new`          | 新しい変更を開始する                                 |
  | `/opsx:continue`     | 1 つずつアーティファクトを作成する（ステップ実行）    |
  | `/opsx:ff`           | 計画系アーティファクトをまとめて作成する（高速化）    |
  | `/opsx:apply`        | タスクを実装する                                     |
  | `/opsx:verify`       | 実装がアーティファクトと一致するか検証する           |
  | `/opsx:sync`         | 差分仕様をメイン仕様へ同期する                       |
  | `/opsx:archive`      | 完了した変更をアーカイブする                         |
  | `/opsx:bulk-archive` | 複数の変更を競合検出付きで一括アーカイブする         |
  | `/opsx:onboard`      | 15 分で完走するワークフローのガイド付き体験           |

  ### 文字列マージから意味的な仕様同期へ

  **以前:** 仕様更新には、手動マージまたはファイル全体の置き換えが必要でした。

  **現在:** 差分仕様は、AI が理解できる意味的なマーカーを使います。

  - `## ADDED Requirements` — 追加する要件
  - `## MODIFIED Requirements` — 既存要件の部分更新（既存内容を残したままシナリオ追加など）
  - `## REMOVED Requirements` — 理由と移行メモ付きで削除
  - `## RENAMED Requirements` — 内容を保持したまま名称変更

  アーカイブ時は要件単位で解析するため、壊れやすい見出し一致に依存しません。

  ### 散在ファイルから Agent Skills 形式へ

  **以前:** プロジェクトルートに 8 個以上の設定ファイルがあり、スラッシュコマンドも 21 種類のツール固有の場所に異なる形式で散在していました。

  **現在:** YAML フロントマター付き Markdown を `.claude/skills/` に集約します。Claude Code / Cursor / Windsurf が自動検出でき、エディタをまたいで互換性を保てます。

  ### 新機能

  - **オンボーディングスキル** — `/opsx:onboard` がコードベースを踏まえたタスク提案と手順解説で初回の変更完走を案内（11 フェーズ、約 15 分）

  - **21 の AI ツールに対応** — Claude Code, Cursor, Windsurf, Continue, Gemini CLI, GitHub Copilot, Amazon Q, Cline, RooCode, Kilo Code, Auggie, CodeBuddy, Qoder, Qwen, CoStrict, Crush, Factory, OpenCode, Antigravity, iFlow, Codex

  - **対話式セットアップ** — `openspec init` でアニメーション付きウェルカム画面と検索可能な複数選択を表示。既に設定済みのツールはあらかじめ選択されるため、再生成しやすくなります。

  - **カスタマイズ可能なスキーマ** — `openspec/schemas/` に独自ワークフローを定義でき、パッケージコードに触れずに運用できます。チーム内でバージョン管理しながら共有できます。

  ### バグ修正

  - コマンド名にコロンが含まれる場合の Claude Code の YAML 解析失敗を修正
  - タスクファイル解析でチェックボックス行の末尾空白を許容するよう修正
  - JSON 指示出力でコンテキスト・ルールとテンプレートを分離するよう修正 — AI が制約ブロックをアーティファクトに写してしまう問題を解消

  ### ドキュメント

  - はじめに読むガイド、CLI リファレンス、概念解説を追加
  - 未実装だった「途中で編集して続行できる」といった誤解を招く記述を削除
  - OPSX 以前のバージョンからの移行ガイドを追加

## 0.23.0-1

- **[OpenSpec-J]** README の OpenSpec-J 独自文（ローカライズ版の位置づけ/同期元表記）を整理し、補足注釈を追記。
- **[OpenSpec-J]** README の「仕組み」補足（ソース・オブ・トゥルース解説）を復元し、維持用マーカーを追加。
- **[OpenSpec-J]** README と docs のコード例内に残っていた英文を日本語化し、対話例ラベルを日本語表記に統一。
- **[OpenSpec-J]** schema/OPSX 関連 docs の英語例・注記を日本語化。
- **[OpenSpec-J]** upstream 追従手順に README の同期元表記と補足マーカー維持のチェック項目を追記。

## 0.23.0

- **[OpenSpec-J]** schema/feedback コマンドの CLI 文言と補完、関連スキル手順を日本語化。
- **[OpenSpec-J]** プロジェクト設定の警告/コメント/デモガイドを日本語化し、関連テスト期待値を更新。
- **[OpenSpec-J]** 仕様テンプレート/AGENTS/スキーマの規範文ルールを日本語向けに統一（文末括弧と語尾を固定）。
- **[OpenSpec-J]** 日本語要件の規範文を「〜しなければならない。(SHALL/MUST)」形式に統一し、SHOULD/MAY は補足に限定する指示を追加。

### マイナー変更

- [#540](https://github.com/Fission-AI/OpenSpec/pull/540) [`c4cfdc7`](https://github.com/Fission-AI/OpenSpec/commit/c4cfdc7c499daef30d8a218f5f59b8d9e5adb754) Thanks [@TabishB](https://github.com/TabishB)! - ### 新機能

  - **bulk-archive スキル** — `/opsx:bulk-archive` で複数の変更を一括アーカイブ。バッチ検証、仕様衝突検出、統合確認を含む

  ### その他

  - **セットアップ簡略化** — config 作成が対話式ではなく、合理的なデフォルトとコメント付きで生成される

## 0.22.0

### マイナー変更

- [#530](https://github.com/Fission-AI/OpenSpec/pull/530) [`33466b1`](https://github.com/Fission-AI/OpenSpec/commit/33466b1e2a6798bdd6d0e19149173585b0612e6f) Thanks [@TabishB](https://github.com/TabishB)! - プロジェクト設定/プロジェクト内スキーマ/スキーマ管理コマンドを追加

  **新機能**

  - **プロジェクト設定** — `openspec/config.yaml` でプロジェクト単位の挙動を設定（ルール注入、コンテキスト、スキーマ解決設定）
  - **プロジェクト内スキーマ** — `openspec/schemas/` にカスタムアーティファクトスキーマを定義
  - **スキーマ管理コマンド** — `openspec schema` コマンド（`list`, `show`, `export`, `validate`）でスキーマの確認と管理（実験的）

  **修正**

  - プロジェクト設定の `rules` が null の場合でも読み込み可能に修正

## 0.21.0

### マイナー変更

- [#516](https://github.com/Fission-AI/OpenSpec/pull/516) [`b5a8847`](https://github.com/Fission-AI/OpenSpec/commit/b5a884748be6156a7bb140b4941cfec4f20a9fc8) Thanks [@TabishB](https://github.com/TabishB)! - フィードバックコマンドと Nix flake サポートを追加

  **新機能**

  - **フィードバックコマンド** — `openspec feedback` で CLI から直接フィードバックを送信し、GitHub Issue を自動作成（メタデータ付与、手動送信へのフォールバック付き）
  - **Nix flake サポート** — `flake.nix` を追加し、Nix での導入/開発と CI 検証を提供

  **修正**

  - **Explore モードのガードレール** — 実装を明示的に禁止し、思考・探索に集中できるよう改善（アーティファクト作成は許可）

  **その他**

  - `opsx apply` の変更推論を改善 — 会話文脈から変更対象を自動推論し、曖昧なら選択を促す
  - アーカイブ時の同期判定を改善し、差分仕様の場所案内を明確化

## 0.20.0

- **[OpenSpec-J]** v0.20.0 追従のため、README/AGENTS テンプレート/スラッシュコマンドの説明文を更新。
- **[OpenSpec-J]** `openspec/AGENTS.md` と `openspec/project.md` の日本語テンプレートを更新。
- **[OpenSpec-J]** PowerShell 補完のヘッダーと表示文言を日本語化。
- **[OpenSpec-J]** `/opsx:verify` と関連するテンプレートの日本語化を反映。
- **[OpenSpec-J]** 追加/更新されたテンプレート・CLI 文言の翻訳に合わせてテスト期待値を更新。

### マイナー変更

- [#502](https://github.com/Fission-AI/OpenSpec/pull/502) [`9db74aa`](https://github.com/Fission-AI/OpenSpec/commit/9db74aa5ac6547efadaed795217cfa17444f2004) Thanks [@TabishB](https://github.com/TabishB)! - ### 新機能

  - **`/opsx:verify` コマンド** — 変更実装が仕様と一致しているか検証する

  ### 修正

  - vitest のワーカ並列数を制限し、プロセスが暴走する問題を修正
  - 検証コマンドが非対話モードで実行されるように修正
  - PowerShell 補完生成で末尾カンマが残る問題を修正

## 0.19.0

- **[OpenSpec-J]** Bash/Fish/PowerShell 補完の案内・警告・自動設定メッセージを日本語化し、関連テストを更新。
- **[OpenSpec-J]** Continue/CodeBuddy/`/opsx:explore` など v0.19.0 追加スラッシュコマンド/テンプレートの説明文を日本語化。
- **[OpenSpec-J]** テレメトリの初回通知・ヘルプ文言と README/CHANGELOG の案内を日本語化。

### マイナー変更

- eb152eb: ### 新機能

  - **Continue IDE 対応** – OpenSpec が [Continue](https://continue.dev/) 向けのスラッシュコマンドを生成し、Cursor/Windsurf/Claude Code などと並ぶ統合先を拡充
  - **Bash/Fish/PowerShell のシェル補完** – `openspec completion install` で好みのシェルにタブ補完を設定
  - **`/opsx:explore` コマンド** – 変更に着手する前にアイデアを探索・検討するための思考パートナー
  - **CodeBuddy スラッシュコマンド改善** – 互換性向上のため frontmatter 形式を更新

  ### 修正

  - サブコマンドがある場合でも、親階層のフラグ（`--help` など）を補完するよう修正
  - Windows のテスト互換性問題を修正

  ### その他

  - OpenSpec の利用状況を把握するための匿名利用統計を任意で追加。デフォルトは **オプトアウト** 方式で、`OPENSPEC_TELEMETRY=0` または `DO_NOT_TRACK=1` で無効化できます。収集対象はコマンド名とバージョンのみで、引数・パス・内容は収集しません。CI 環境では自動的に無効化されます。

## 0.18.0

- **[OpenSpec-J]** 実験的アーティファクトワークフロー（`/opsx:ff`/`/opsx:sync`/`/opsx:archive` など）の CLI 表示を日本語化し、関連テストを更新。
- **[OpenSpec-J]** `docs/experimental-workflow.md` を日本語化。
- **[OpenSpec-J]** spec-driven スキーマの apply 指示を日本語化。

### マイナー変更

- 8dfd824: OPSX 実験的ワークフローコマンドとアーティファクトシステムの拡張を追加

  **新しいコマンド:**

  - `/opsx:ff` - アーティファクト作成を早送りし、必要なアーティファクトを一括生成
  - `/opsx:sync` - 変更の仕様差分をメイン仕様に同期
  - `/opsx:archive` - 完了した変更をスマートな同期チェック付きでアーカイブ

  **アーティファクトワークフローの強化:**

  - スキーマ認識の apply 指示（インラインガイド付き、XML 出力）
  - 実験的アーティファクトワークフロー向けのスキーマ選択（エージェント）
  - `.openspec.yaml` による変更ごとのスキーマメタデータ
  - 実験的アーティファクトワークフロー向け Agent Skills
  - テンプレート読み込みと変更コンテキストのための instruction loader
  - スキーマをテンプレート同梱のディレクトリ構成に再編

  **改善:**

  - list コマンドに最終更新日時とソートを追加
  - ワークフロー支援のための変更作成ユーティリティを追加

  **修正:**

  - クロスプラットフォームの glob 互換性のためパスを正規化
  - 新規仕様ファイル作成時に REMOVED 要件を許可

## 0.17.2

- **[OpenSpec-J]** CLI 出力/エラー/ヘルプ/スピナー文言の日本語化と関連テストの期待値更新。
- **[OpenSpec-J]** テンプレート（`openspec/AGENTS.md`/`openspec/project.md`/`src/core/templates/*`）とスラッシュコマンド文面の日本語化・表記統一。
- **[OpenSpec-J]** README/運用ドキュメントの日本語化、図表の ASCII/レイアウト調整、プロジェクト案内文の整備。
- **[OpenSpec-J]** 用語統一（capability→機能）と表記ゆれの整理。
- **[OpenSpec-J]** バリデーション/デプリケーション周りの日本語ガイド強化（英日両対応のトリガー追加、集中管理）。
- **[OpenSpec-J]** ローカライズ運用ルールの整理（差分分類、changelog 方針、セッションメモ運用、参照指針）。
- `validate` コマンドの `--no-interactive` がスピナー無効化に正しく効くよう修正し、pre-commit フックや CI のハングを防止。

## 0.17.1

- `config` コマンドで pre-commit フックがハングする問題を修正（`@inquirer/prompts` を動的 import に変更）。
- 静的 import の回帰を防ぐため ESLint を追加。

## 0.17.0

### マイナー変更

- 2e71835: ### 新機能

  - `openspec config` コマンドを追加
  - XDG Base Directory 仕様に従うグローバル設定ディレクトリを追加
  - Oh My Zsh 対応のシェル補完を追加

  ### 修正

  - pre-commit フックのハングを回避するため動的 import に切り替え
  - `XDG_CONFIG_HOME` の尊重を全プラットフォームで徹底
  - zsh-installer テストの Windows 互換性を改善
  - `cli-completion` 仕様を実装に合わせて更新
  - スラッシュコマンドのハードコードされた agent フィールドを削除

  ### ドキュメント

  - README の AI ツール一覧をアルファベット順に整理し、折りたたみ表示に対応

## 0.16.0

- **[OpenSpec-J]** CHANGELOG を OpenSpec-J 用に統一し、日本語 changelog を単一化。
- **[OpenSpec-J]** 初版。upstream v0.16.0 をベースに、CLI 出力・テンプレート・AGENTS・スラッシュコマンド文面・デプリケーション警告などを日本語化。
- iFlow CLI・Antigravity など新規 AI ツール連携を追加し、スラッシュコマンド生成を強化。
- `init` 後に IDE 再起動が必要な場合の案内を追記。
- Qwen Code の TOML コマンド生成を修正し、変更提案のガイドラインを改善（設計先行の方針を明確化）。

## 未リリース

### マイナー変更

- Continue のスラッシュコマンド対応。`openspec init` が `.continue/prompts/openspec-*.prompt` を MARKDOWN frontmatter と `$ARGUMENTS` プレースホルダー付きで生成し、`openspec update` で更新します。
- Antigravity のスラッシュコマンド対応。`openspec init` が `.agent/workflows/openspec-*.md` を description-only frontmatter 付きで生成し、`openspec update` が Windsurf と同様に既存ワークフローを更新します。

## 0.15.0

- Gemini CLI、RooCode、Cline のワークフロー修正など多数の AI アシスタント連携を追加。
- Qwen Code, Qoder, CoStrict など新ツール対応。`apply` コマンドに `$ARGUMENTS` 変数を導入。
- テンプレート再生成の不具合を修正し、タイトル欠落時は change-id をデフォルト使用。

## 0.14.0

- CodeBuddy, CodeRabbit, Cline, Crush, Auggie など複数アシスタントのサポートを追加。
- アーカイブとデルタ検証を改良（ヘッダーの大文字小文字対応、`--no-validate` の尊重など）。
- VS Code devcontainer 追加、スラッシュコマンド文書を拡充。

## 0.13.0

- Amazon Q Developer CLI 連携を追加（`.amazonq/prompts/` にプロンプト生成）。

## 0.12.0

- スラッシュコマンドを関数として定義できる「ファクトリ関数」対応を追加。
- `openspec init` に非対話フラグ `--tools`, `--all-tools`, `--skip-tools` を追加。

## 0.11.0

- Codex / GitHub Copilot で YAML frontmatter + `$ARGUMENTS` を用いたスラッシュコマンドをサポート。

## 0.10.0

- `init` ウィザードの Enter キー動作を改善。

## 0.9.2

- パス解決のクロスプラットフォーム問題を修正。

## 0.9.1

- Windows 環境で Codex 連携が動作しない問題を修正。
