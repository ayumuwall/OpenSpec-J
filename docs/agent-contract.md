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

すべてのルート解決コマンド (`list`、`show`、`validate`、`status`、`instructions`、`instructions apply`、`new change`、`archive`、`doctor`、`context`) は、1 つの OpenSpec ルートを 1 つの優先順位で解決します。

1. `--store <id>` → 登録ストアのルート (`source: "store"`)。
2. それ以外の場合、`openspec/` を持つ最も近い祖先: 計画形状 → `source: "nearest"` (`store:` ポインターは無視され、stderr 警告が表示されます)。有効な `store:` ポインターを持つ構成専用ディレクトリ → そのストア、`source: "declared"`。
3. 最も近いルート + 登録ストアが存在しない → エラー `no_root_with_registered_stores`。
4. ルートもストアもありません: スキャフォールディング コマンドは cwd を `source: "implicit"` として扱います。診断コマンド (`doctor`、`context`) は代わりに `no_openspec_root` で失敗します。これらは検査を行いますが、スキャフォールディングは行いません。

成功した JSON ペイロードにはルートが埋め込まれます。

```json
"root": { "path": "/abs/path", "source": "store" | "declared" | "nearest" | "implicit", "store_id": "id (only when store-selected)" }
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
`{ "changeName", "schemaName", "planningHome"?: { "kind", "root", "changesDir", "defaultSchema" }, "changeRoot", "artifactPaths": { "<id>": {outputPath, resolvedOutputPath, existingOutputPaths} }, "nextSteps": ["..."], "actionContext": { "mode": "repo-local", "sourceOfTruth": "repo", "planningArtifacts", "linkedContext", "allowedEditRoots", "requiresAffectedAreaSelection", "constraints" }, "isComplete", "applyRequires", "artifacts": [ {id, outputPath, status: "done"|"ready"|"blocked", missingDeps?} ], "root" }`。アクティブな変更はありません: `{ "changes": [], "message", "root" }`、出口 0。

### 4.5 `instructions <artifact> --json`
`{ "changeName", "artifactId", "schemaName", "changeDir", "planningHome"?, "outputPath", "resolvedOutputPath", "existingOutputPaths", "description", "instruction"?, "context"?, "rules"?, "references"?: ReferenceIndexEntry[], "template", "dependencies": [{id,done,path,description}], "unlocks", "root" }`。

`ReferenceIndexEntry`: `{ "store_id", "root"?, "specs"?: [{id,summary}], "fetch"?, "status": [] }` — 解決されたエントリには root/specs/fetch が含まれます。未解決のキャリー store_id + 警告ステータス。インデックスの上限は 50KB (`reference_index_truncated`) です。

### 4.6 `instructions apply --json`
`{ "changeName", "changeDir", "schemaName", "contextFiles": { "<artifactId>": ["/abs", ...] }, "progress": {total,complete,remaining}, "tasks": [{id,description,done}], "state": "blocked"|"all_done"|"ready", "missingArtifacts"?, "instruction", "references"?, "root" }`。

### 4.7 `new change <name> --json`
成功: `{ "change": { "id", "path", "metadataPath", "schema" }, "root" }`。失敗: `{ "change": null, "status": [d] }`、出口 1。

### 4.8 `archive <name> --json`
成功: `{ "archive": { "change", "archivedAs": "YYYY-MM-DD-name", "path", "specsUpdated", "totals"? }, "root" }`。失敗: `{ "archive": null, "root"?, "status": [d] }`、終了 1。JSON モードは厳密に非対話型です。すべてのプロンプト ポイントは `archive_*` コードになります。

### 4.9 `doctor --json`
`{ "root": { "path", "source", "store_id"?, "healthy", "status": [] }, "store": { "id", "metadata": {present,valid,remote?}, "origin_url"?, "status": [] } | null, "references": [...], "status": [] }`。任意の重大度の正常性所見は出口 0。障害ペイロード: `{ "root": null, "store": null, "references": [], "status": [d] }`、出口 1。

### 4.10 `context --json`
`{ "root": { "path", "source", "store_id"?, "role": "openspec_root" }, "members": [ { "role": "referenced_store", "id", "path"?, "remote"?, "fetch"?, "status": [] } ], "status": [] }`。 AVAILABLE = パスが存在し、ステータスが空です。 `--code-workspace <path>` は `{folders:[{name,path}]}` を書き込みます (参照ストアのみが使用可能、接頭辞は `ref:`)。 JSON モードでは、印刷前に書き込みが実行されるため、書き込みが失敗しても stdout には 1 つのドキュメントが保持されます。失敗: `{ "root": null, "members": [], "status": [d] }`、出口 1。

### 4.11 `store ... --json`
セットアップ/登録: `{ "store": {id, root, metadata_path?}, "registry": {path, registered, already_registered}, "git": {is_repository, initialized, committed}, "created_files": [], "status": [] }`。登録解除/削除: `{ "store", "registry": {path, removed}, "files": {deleted, deleted_path, left_on_disk}, "status": [] }`。リスト: `{ "stores": [{id, root}], "status": [] }`。医師: `{ "stores": [ { id, root, metadata_path?, openspec_root: {...healthy, status}, metadata: {present, valid, id?, remote}, git: {is_repository, has_commits, has_uncommitted_changes, has_remote, origin_url}, status } ], "status": [] }` (`null` = 不明/未調査)。健康診断結果出口 0;失敗した場合は、一致する null 形状を持つ exit 1 が発生します。即時キャンセルは 130 で終了します。

### 4.12 `schemas --json` / `templates --json`
`schemas`: ベアアレイ `[ {name, description, artifacts, source} ]`。 `templates`: キー付きオブジェクト `{ "<artifactId>": {path, source} }`。どちらも cwd ベースで、ルート/ステータス キーはありません。

## 5. 終了コードコントラクト

|状況 |終了 |標準出力 |
|---|---|---|
|成功（含む）健康に関する所見 (医師/コンテキスト/ストア医師) | 0 |ペイロード |
| `--json` モードでのコマンドの失敗 | 1 | `status: [d]` とコマンドの null 形状を持つ 1 つの JSON ドキュメント |
|失敗した項目のある `validate` | 1 |完全なレポート |
|即時キャンセル（`store`グループ、ヒューマンモード） | 130 |標準エラー出力のみ |

## 6. 診断コードカタログ

### 解決
`no_openspec_root`、`no_root_with_registered_stores`、`no_registered_stores`、`unknown_store`、`store_identity_mismatch`、`unhealthy_store_root`、`store_path_not_supported`、`invalid_store_pointer`、`initiative_option_removed`、`areas_option_removed`;パススルー: `invalid_store_id`、`invalid_store_registry`、`invalid_store_metadata`。

### OpenSpec ルートの健全性 (エラー、修正なし)
`openspec_store_root_missing`、`openspec_store_root_not_directory`、`openspec_root_missing`、`openspec_root_not_directory`、`openspec_config_missing`、`openspec_config_not_file`、`openspec_specs_not_directory`、`openspec_changes_not_directory`、`openspec_archive_not_directory`。ストアのベータ版では、`openspec/specs/`、`openspec/changes/`、および `openspec/changes/archive/` が健全なルートに存在しない可能性があります。これらは存在する場合はヘルスエラーのみであり、ディレクトリには存在しません。

### レジストリ/アイデンティティ/状態を保存する
`invalid_store_id`、`invalid_store_registry`、`invalid_store_metadata`、`store_registry_busy`、`store_not_found`、`no_store_registry`、`store_registry_changed`、`store_metadata_missing`、`store_metadata_id_mismatch`、`store_metadata_invalid`、`store_id_conflict`、`store_path_conflict`、`store_already_registered` (情報)。

### ストアの設定・登録・削除
`store_setup_id_required`、`store_setup_path_required`、`store_setup_path_not_directory`、`store_setup_inside_git_repo`、`store_setup_non_empty_directory`、`store_setup_cancelled`、`store_path_required`、`store_path_missing`、`store_path_not_directory`、`store_root_pointer_declared`、`store_register_root_unhealthy`、`store_register_identity_confirmation_required`、`store_register_cancelled`、`store_remote_empty`、 `store_remote_requires_hand_edit`、`store_remove_confirmation_required`、`store_remove_cancelled`、`store_remove_path_not_directory`、`store_remove_metadata_missing`、`store_root_missing` (削除時の警告、ドクターのエラー)、`store_root_not_directory`。

### git を保存する
`store_git_init_failed`、`store_git_identity_missing`、`store_git_commit_failed`、`store_git_no_commits` (警告)、`store_clone_fragile_directories` (警告)、`store_remote_divergence` (情報、医師)。

### 参考文献 (警告)
`reference_invalid_id`、`reference_registry_unreadable`、`reference_unresolved`、`reference_root_unhealthy`、`reference_index_truncated`。

### 関係 (警告; 医師; コンテキストはレジストリの 1 つだけを保持します)
`relationship_registry_unreadable`、`root_pointer_ignored`、`root_pointer_invalid`、`pointer_declarations_inert`。

### アーカイブ (JSON モード)
`archive_change_name_required`、`archive_change_not_found`、`archive_validation_failed`、`archive_confirmation_required`、`archive_tasks_incomplete`、`archive_spec_update_failed`、`archive_spec_validation_failed`、`archive_target_exists`、`archive_error`。

### コンテキストの書き込み
`context_file_exists`、`context_output_dir_missing`。

### フォールバック
`doctor_failed`、`context_failed`、`store_error`、`change_error`、`archive_error`。

## 既知の不一致

キャップストーン監査によって記録されます。公開キーの名前変更は、このリリース以降の製品決定が延期されます。

1. ~~`--json` モードでは、いくつかの障害パスが JSON ドキュメントなしで標準エラー出力のみを出力しました。~~ キャップストーン ガントレット ラウンドで修正されました: `show`/`validate` の不明で曖昧なアイテムは `{status:[{code: unknown_item | ambiguous_item, ...}]}` を出力します。 JSON 対応の失敗ヘルパー (コマンドの null 形状 + `status`) を介した `instructions`/`list`/`show`/`validate`/`status` ルートでエラーがスローされました。 `store <unknown subcommand> --json` は `{status:[{code: unknown_store_subcommand}]}` を発行します。 `list` は、解決失敗時に `{changes|specs: [], root: null}` のヌル形状を保持します。
2. `store_root_missing` は 2 つの重大度 (削除時の警告、ストア ドクターのエラー) で出力されます。これはコンテキストに依存しており、上記で説明しています。
3.snake_case (ストア ファミリー) と CamelCase (ワークフロー ファミリー) のキー ケーシング。 `root.store_id` はどこでもスネークケースです。
4. src には 4 つの並列エンベロープ型宣言が存在します。アーカイブ診断には `target` が含まれることはありません。
5. `list --json` は、変更ごとに `status` キーを文字列列挙として再利用します。
6. `validate` 出力のみが `version` フィールドを伝送します。
7. `schemas`/`templates` はルート選択を無視します (CWD ベース、`--store` なし)。
8. 非推奨の名詞形式 (`change`/`spec` サブコマンド) は、`root`/`status` なしでエンベロープされていないペイロードを出力します。
