# @ayumuwall/openspec 変更履歴

OpenSpec-J（Fission-AI/OpenSpec の日本語フォーク）の公式変更履歴です。本プロジェクトで行った変更は **[OpenSpec-J]** タグで記載しています。

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
