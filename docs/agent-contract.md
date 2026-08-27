# OpenSpec エージェント契約

`openspec` CLI の機械可読サーフェス。`src/` に対して検証済み (capstone Audit、2026 年 6 月 11 日)。以下のすべての形状は、出力コードから文書化されています。

## 1. 一般的な規則

- **呼び出しごとに 1 つの JSON ドキュメント。** `--json` モードでは、stdout は 1 つの JSON ドキュメント (2 つのスペースをきれいに出力) を保持します。人間の散文、スピナー、およびストアのバナーは標準エラー出力に送られます。
- **ストア バナー。** 人間モードでは、ストアで選択されたルートは `Using OpenSpec root: <id> (<path>)` を標準エラー出力に出力します。 JSON モードでは決して印刷されません。
- **キーのケーシングはサーフェスに依存します** (既知の不一致を参照): ストア/ドクター/コンテキストのペイロードは `snake_case` を使用します。ワークフロー ペイロード (`status`、`instructions`、`new change`、`validate`、`list`) は、常に `camelCase` を使用する埋め込み `root` オブジェクトを除き、`store_id` を使用します。
- **ほとんどのペイロードでは、オプションのキーは null ではなく省略されます** (例: `root.store_id`、`member.path`)。明示的な `null` を使用する例外は、シェイプごとに呼び出されます (ストア ドクター `git.*`、失敗ペイロード)。

## 2. 診断エンベロープ

1 つのエンベロープ形状は、すべての機械可読診断 (`StoreDiagnostic`) で共有されます。

```json
{
  "severity": "error" | "warning" | "info",
  "code": "snake_case_string",
  "message": "human sentence",
  "target": "dotted.surface (optional)",
  "fix": "one actionable sentence/command (optional)"
}
```

診断は 2 つの位置に表示されます。正常性所見の **ステータス配列** (最上位またはエントリごとの `status: StoreDiagnostic[]`)、およびコマンド失敗時に単一要素の `status` 配列に変換された **スローされたエラー**です。

## 3. ルートの選択と `RootOutput`

ルートを解決するすべてのコマンド（`list`、`show`、`validate`、`status`、`instructions`、`instructions apply`、`instructions archive`、`new change`、`archive`、`doctor`、`context`、`schemas`）は、同じ優先順位で1つの OpenSpec ルートを解決します:

1. `--store <id>` → 登録ストアのルート (`source: "store"`)。
2. それ以外の場合、`openspec/` を持つ最も近い祖先: 計画形状 → `source: "nearest"` (`store:` ポインターは無視され、stderr 警告が表示されます)。有効な `store:` ポインターを持つ構成専用ディレクトリ → そのストア、`source: "declared"`。
3. 最も近いルートがなく、グローバルな `defaultStore` が設定済み（`openspec config set defaultStore <id>`）→ そのstore、`source: "global_default"`。古いIDの場合はstore由来のエラーとなり、`fix` に `openspec config unset defaultStore` が示されます。
4. 最も近いルートもデフォルトもなく、登録storeが存在する → エラー `no_root_with_registered_stores`。
5. ルート、デフォルト、store がない場合: コマンドは cwd を `source: "implicit"` として扱うことがあります。ただし `doctor`、`context`、`list`、一括 `validate` は `no_openspec_root` で失敗します。`list` は `openspec/project.md` があるレガシープロジェクトに限り、暗黙のフォールバックを維持します。

成功した JSON ペイロードには通常ルートが含まれます。ただし、成功した `schemas --json` は
§4.13 で文書化した互換性のため、意図的に素の配列のままとします:

```json
"root": { "path": "/abs/path", "source": "store" | "declared" | "global_default" | "nearest" | "implicit", "store_id": "id (only when store-selected)" }
```

**ルート障害コントラクト**: JSON モードでは、解決障害が発生すると `{ ...commandNullShape, "status": [diagnostic] }` が標準出力に出力され、1 が終了します。

## 4. コマンド JSON 形状

### 4.1 `list --json`
`{ "changes": [ { "name", "completedTasks", "totalTasks", "lastModified", "status": "no-tasks"|"complete"|"in-progress" } ], "root": RootOutput }` — ここでは、変更ごとの `status` が文字列列挙型であることに注意してください。 `--specs`: `{ "specs": [ { "id", "requirementCount" } ], "root" }`。

### 4.2 `show <item> --json`
変更: `{ "id", "title", "deltaCount", "deltas": [...], "root" }`。仕様：`{ "id", "title", "overview", "requirementCount", "requirements": [...], "metadata": { "version", "format", "sourcePath"? }, "root" }`。

### 4.3 `validate --json`
`{ "items": [ { "id", "type": "change"|"spec", "valid", "issues": [ { "level", "path", "message", "line"?, "column"? } ], "durationMs" } ], "summary": { "totals": {items,passed,failed}, "byType": {...} }, "version": "1.0", "root" }`。いずれかの項目が失敗した場合は 1 を終了します。

### 4.4 `status --json`
`{ "changeName", "schemaName", "planningHome"?: { "kind", "root", "changesDir", "defaultSchema" }, "changeRoot", "artifactPaths": { "<id>": {outputPath, resolvedOutputPath, existingOutputPaths} }, "nextSteps": ["..."], "actionContext": { "mode": "repo-local", "sourceOfTruth": "repo", "planningArtifacts", "linkedContext", "allowedEditRoots", "requiresAffectedAreaSelection", "constraints" }, "isPlanningComplete", "isComplete", "applyRequires", "artifacts": [ {id, outputPath, status: "done"|"skipped"|"ready"|"blocked", requires, missingDeps?} ], "root" }`。`isPlanningComplete` は、スキップされていないすべての計画アーティファクトが存在することを示します。スキップ済みアーティファクトは作成せずに充足済みとして扱います。実装タスクが完了したことを意味するものではありません。`isComplete` は同じ値を持つ互換性エイリアスとして維持されます。各アーティファクトの `requires` は直接依存する ID です（すべての status に含まれるため、アーティファクトが `done` であっても推移的な必須セットを算出できます）。`missingDeps` は `blocked` の場合だけ現れます。`artifacts` 配列は依存順です。同時に ready になったアーティファクトは、アルファベット順ではなくスキーマの `artifacts:` 宣言順で並びます。そのため最初の `ready` エントリが次に書き込むアーティファクトであり、`missingDeps` も同じ順序を使います。`"skipped"` は、`.openspec.yaml` が `skip_specs: true` を宣言した変更で、`generates` パスが `specs/` 配下のアーティファクトを示します。依存関係は充足しますが、作成してはいけません。アクティブな変更がない場合は `{ "changes": [], "message", "root" }`、終了コード0です。

`--all`はバッチ処理用で、`--change`とは同時に指定できません。併用した場合は、`{ "changes": [], "root": null, "status": [d] }`という null 形状を伴うエラーになります。出力は変更名順の`{ "changes": [ <per-change status object, no per-change root>, ... ], "root" }`です。変更提案の読み込みに失敗した場合は、その位置に`{ "changeName", "status": [d] }`を追加します。処理は続行して完全なエンベロープを維持し、テキストモードと JSON モードのどちらでも終了コード1を返します。無効な`--schema`を指定すると、変更提案が1件もない場合でも、呼び出し全体が null 形状を伴って失敗します。

### 4.5 `instructions <artifact> --json`
`{ "changeName", "artifactId", "schemaName", "changeDir", "planningHome"?, "outputPath", "resolvedOutputPath", "existingOutputPaths", "description", "instruction"?, "context"?, "rules"?, "references"?: ReferenceIndexEntry[], "skipped"?, "warning"?, "template", "dependencies": [{id,done,path,description,skipped?}], "unlocks", "root" }`。`unlocks` は、このアーティファクトによりreadyになるものをスキーマ宣言順で示します。変更が `skip_specs: true` を宣言し、このアーティファクトがスキップされる場合は `"warning"` とともに `"skipped": true` が現れます。ファイルを作成してはいけません。`skipped: true` の依存項目はファイルなしで充足済みなので、パスを読まないでください。

`ReferenceIndexEntry`: `{ "store_id", "root"?, "specs"?: [{id,summary}], "fetch"?, "status": [] }` — 解決済みのエントリには `root` / `specs` / `fetch` が含まれます。未解決のエントリは `store_id` と警告ステータスを保持します。インデックスの上限は 50KB (`reference_index_truncated`) です。

### 4.6 `instructions apply --json`
`{ "changeName", "changeDir", "schemaName", "contextFiles": { "<artifactId>": ["/abs", ...] }, "progress": {total,complete,remaining}, "tasks": [{id,description,done}], "state": "blocked"|"all_done"|"ready", "missingArtifacts"?, "instruction", "references"?, "context"?, "operationGuidance"?, "root" }`。2つの任意フィールドは呼び出しごとに選択ルートから読み取ります。`context` は関連するプロジェクト情報・規約・制約を適用する必須のプロンプト入力、`operationGuidance` は組み込みワークフローと両立し、該当する場合だけ従う助言です。どちらも状態、タスク、進捗、コンテキストファイル、組み込み指示とは分離されます。

### 4.7 `instructions archive --json`
`{ "changeName", "context"?, "operationGuidance"?, "root" }`。解決済みのリポジトリ/storeルートに有効な `--change` が必要で、applyと同じ必須コンテキスト・助言ガイダンスの意味を持ちます。読み取り専用の実行時入力であり、静的archiveワークフローの返却、仕様差分の検査・マージ、本仕様への書き込み、変更の移動は行いません。

### 4.8 `new change <name> --json`
成功: `{ "change": { "id", "path", "metadataPath", "schema" }, "root" }`。失敗: `{ "change": null, "status": [d] }`、終了1。

### 4.9 `archive <name> --json`
成功時: `{ "archive": { "change", "archivedAs": "YYYY-MM-DD-name", "path", "specsUpdated", "totals"?, "warnings"? }, "root" }`。失敗時: `{ "archive": null, "root"?, "status": [d] }`、終了コード1。`specsUpdated` が true になるのは、少なくとも1つの仕様ファイルを書き込むか廃止した場合だけです（変更が最後の要件を削除した capability は仕様を削除します。変更の `.openspec.yaml` に `retire_capabilities: true` が必要です。廃止はすべて `warnings` に示され、仕様が呼出元のチェックアウト内にあった場合だけ、貼り付け可能な Git 復旧コマンドを示します）。すでに同期済みの変更は、全て0の totals と `warnings` に一覧化したスキップ情報を持ってアーカイブします。JSON モードは完全に非対話式であり、確認箇所はすべて `archive_*` コードになります。

### 4.10 `doctor --json`
`{ "root": { "path", "source", "store_id"?, "healthy", "status": [] }, "store": { "id", "metadata": {present,valid,remote?}, "origin_url"?, "drift"?: {ahead,behind}, "status": [] } | null, "references": [...], "status": [] }`. `drift` (present only for a git-backed store checkout that has an upstream tracking ref) is ahead/behind counts against the last-fetched upstream, not the live remote. Health findings of any severity exit 0. Failure payload: `{ "root": null, "store": null, "references": [], "status": [d] }`, exit 1.

### 4.11 `context --json`
`{ "root": { "path", "source", "store_id"?, "role": "openspec_root" }, "members": [ { "role": "referenced_store", "id", "path"?, "remote"?, "fetch"?, "status": [] } ], "status": [] }`。AVAILABLEはパスが存在しstatusが空の状態です。`--code-workspace <path>` は利用可能な参照storeだけを使い、`ref:` 接頭辞付きで `{folders:[{name,path}]}` を書き込みます。JSONモードでは表示前に書き込むため、失敗時もstdoutには文書が1つだけ出力されます。失敗: `{ "root": null, "members": [], "status": [d] }`、終了1。

### 4.12 `store ... --json`
setup/register: `{ "store": {id, root, metadata_path?}, "registry": {path, registered, already_registered}, "git": {is_repository, initialized, committed}, "created_files": [], "status": [] }`。unregister/remove: `{ "store", "registry": {path, removed}, "files": {deleted, deleted_path, left_on_disk}, "status": [] }`。list: `{ "stores": [{id, root}], "status": [] }`。doctor: `{ "stores": [ { id, root, metadata_path?, openspec_root: {...healthy, status}, metadata: {present, valid, id?, remote}, git: {is_repository, has_commits, has_uncommitted_changes, has_remote, origin_url}, status } ], "status": [] }`（`null`は不明・未検査）。正常性の所見は終了0、失敗は対応するnull形状で終了1、プロンプトのキャンセルは130です。

### 4.13 `schemas --json` / `templates --json`
`schemas`: 成功時は素の配列 `[ {name, description, artifacts, source} ]` のままです。正規のルート選択優先順位で解決し、`--store <id>` を受け付けます。ルート選択に失敗した場合: `{ "schemas": [], "root": null, "status": [d] }`、終了コード1。`templates`: キー付きオブジェクト `{ "<artifactId>": {path, source} }`。引き続き cwd ベースであり、root/status キーはありません。

## 5. 終了コードコントラクト

| 状況 | 終了 | 標準出力 |
|---|---|---|
| 成功（doctor / context / store doctor の健全性所見を含む） | 0 | ペイロード |
| `--json` モードでのコマンドの失敗 | 1 | `status: [d]` とコマンドの null 形状を持つ 1 つの JSON ドキュメント |
| 失敗した項目のある `validate` | 1 | 完全なレポート |
| 即時キャンセル（`store` グループ、ヒューマンモード） | 130 | 標準エラー出力のみ |

## 6. 診断コードカタログ

### 解決
`no_openspec_root`、`no_root_with_registered_stores`、`no_registered_stores`、`unknown_store`、`store_identity_mismatch`、`unhealthy_store_root`、`store_path_not_supported`、`invalid_store_pointer`、`initiative_option_removed`、`areas_option_removed`;パススルー: `invalid_store_id`、`invalid_store_registry`、`invalid_store_metadata`。

### OpenSpec ルートの健全性 (エラー、修正なし)
`openspec_store_root_missing`、`openspec_store_root_not_directory`、`openspec_root_missing`、`openspec_root_not_directory`、`openspec_config_missing`、`openspec_config_not_file`、`openspec_specs_not_directory`、`openspec_changes_not_directory`、`openspec_archive_not_directory`。ストアのベータ版では、`openspec/specs/`、`openspec/changes/`、および `openspec/changes/archive/` が健全なルートに存在しない可能性があります。これらは存在する場合はヘルスエラーのみであり、ディレクトリには存在しません。

### レジストリ/アイデンティティ/状態を保存する
`invalid_store_id`、`invalid_store_registry`、`invalid_store_metadata`、`store_registry_busy`、`store_not_found`、`no_store_registry`、`store_registry_changed`、`store_metadata_missing`、`store_metadata_id_mismatch`、`store_metadata_invalid`、`store_id_conflict`、`store_path_conflict`、`store_already_registered` (情報)。

### ストアの設定・登録・削除
`store_setup_id_required`、`store_setup_path_required`、`store_setup_path_not_directory`、`store_setup_inside_git_repo`、`store_setup_non_empty_directory`、`store_setup_cancelled`、`store_path_required`、`store_path_missing`、`store_path_not_directory`、`store_root_pointer_declared`、`store_register_root_unhealthy`、`store_register_identity_confirmation_required`、`store_register_cancelled`、`store_remote_empty`、 `store_remote_requires_hand_edit`、`store_remove_confirmation_required`、`store_remove_cancelled`、`store_remove_path_not_directory`、`store_remove_metadata_missing`、`store_root_missing` (削除時の警告、ドクターのエラー)、`store_root_not_directory`。

### Storeのgit
`store_git_init_failed`、`store_git_identity_missing`、`store_git_commit_failed`、`store_git_no_commits`（警告）、`store_clone_fragile_directories`（警告）、`store_remote_divergence`（情報、doctor）、`store_checkout_drift`（情報、doctor）。

### 参考文献 (警告)
`reference_invalid_id`、`reference_registry_unreadable`、`reference_unresolved`、`reference_root_unhealthy`、`reference_index_truncated`。

### 関係 (警告; 医師; コンテキストはレジストリの 1 つだけを保持します)
`relationship_registry_unreadable`、`root_pointer_ignored`、`root_pointer_invalid`、`pointer_declarations_inert`。

### アーカイブ (JSON モード)
`archive_change_name_required`、`archive_change_not_found`、`archive_change_symlink`、`archive_validation_failed`、`archive_confirmation_required`、`archive_tasks_incomplete`、`archive_spec_update_failed`、`archive_spec_validation_failed`、`archive_target_exists`、`archive_error`。

### コンテキストの書き込み
`context_file_exists`、`context_output_dir_missing`。

### フォールバック
`doctor_failed`、`context_failed`、`store_error`、`change_error`、`archive_error`。

## 既知の不一致

キャップストーン監査によって記録されます。公開キーの名前変更は、このリリース以降の製品決定が延期されます。

1. ~~`--json` モードでは、一部の失敗パスが JSON ドキュメントを出さず、標準エラー出力だけを返していました。~~ キャップストーンのガントレットで修正済みです。`show` / `validate` の不明・曖昧な項目は `{status:[{code: unknown_item | ambiguous_item, ...}]}` を出力します。`instructions` / `list` / `show` / `validate` / `status` ルートのエラーは、JSON 対応の失敗ヘルパー（コマンドごとの null 形状 + `status`）を経由します。`store <unknown subcommand> --json` は `{status:[{code: unknown_store_subcommand}]}` を出力します。`list` は、解決失敗時も `{changes|specs: [], root: null}` の null 形状を維持します。
2. `store_root_missing` は 2 つの重大度 (削除時の警告、ストア ドクターのエラー) で出力されます。これはコンテキストに依存しており、上記で説明しています。
3.snake_case (ストア ファミリー) と CamelCase (ワークフロー ファミリー) のキー ケーシング。 `root.store_id` はどこでもスネークケースです。
4. src には 4 つの並列エンベロープ型宣言が存在します。アーカイブ診断には `target` が含まれることはありません。
5. `list --json` は、変更ごとに `status` キーを文字列列挙として再利用します。
6. `validate` 出力だけが `version` フィールドを含みます。
7. `templates` はルート選択を無視します（cwd ベース、`--store` なし）。
8. 非推奨の名詞形式 (`change`/`spec` サブコマンド) は、`root`/`status` なしでエンベロープされていないペイロードを出力します。
