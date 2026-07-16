# CLI リファレンス

OpenSpec CLI（`openspec`）は、プロジェクトのセットアップ、検証、ステータス確認、管理のためのターミナルコマンドを提供します。これらのコマンドは、[コマンド](commands.md) に記載された `/opsx:propose` などの AI スラッシュコマンドを補完します。

## 概要

| カテゴリ | コマンド | 目的 |
|----------|----------|---------|
| **セットアップ** | `init`, `update` | プロジェクトの OpenSpec 初期化・更新 |
| **Stores (standalone OpenSpec repos)** | `store setup`, `store register`, `store unregister`, `store remove`, `store list`, `store doctor` | Manage stores — standalone OpenSpec repos you've registered |
| **Health** | `doctor` | Report relationship health for the resolved root |
| **Working context** | `context` | Assemble the working set (root + referenced stores) |
| **Personal worksets** | `workset create`, `workset list`, `workset open`, `workset remove` | Keep and open personal, local working views in your tool |
| **閲覧** | `list`, `view`, `show` | 変更と仕様を確認 |
| **検証** | `validate` | 変更と仕様の問題をチェック |
| **ライフサイクル** | `archive` | 完了した変更を確定 |
| **Workflow** | `new change`, `status`, `instructions`, `templates`, `schemas` | Artifact-driven workflow support |
| **スキーマ** | `schema init`, `schema fork`, `schema validate`, `schema which` | カスタムワークフローの作成と管理 |
| **設定** | `config` | 設定の閲覧と変更 |
| **ユーティリティ** | `feedback`, `completion` | フィードバック送信とシェル連携 |

---

## 人向けコマンドとエージェント向けコマンド

多くの CLI コマンドは **人がターミナルで使うこと** を想定しています。一部のコマンドは **AI エージェント/スクリプト向け** に JSON 出力を提供します。

### 人向け専用コマンド

これらは対話的で、ターミナル操作向けです。

| コマンド | 目的 |
|---------|---------|
| `openspec init` | プロジェクト初期化（対話プロンプト） |
| `openspec view` | 対話型ダッシュボード |
| `openspec workset open <name>` | Open a saved workset (editor window or terminal agent session) |
| `openspec config edit` | エディタで設定を開く |
| `openspec feedback` | GitHub へフィードバック送信 |
| `openspec completion install` | シェル補完のインストール |

### エージェント対応コマンド

これらは `--json` に対応し、AI エージェントやスクリプトから利用できます。

| コマンド | 人向け用途 | エージェント用途 |
|---------|-----------|-----------|
| `openspec list` | 変更/仕様の一覧 | `--json` で構造化データ |
| `openspec show <item>` | 内容の閲覧 | `--json` で解析用データ |
| `openspec validate` | 問題の検出 | `--all --json` で一括検証 |
| `openspec status` | 進捗の確認 | `--json` で状態を取得 |
| `openspec instructions` | 次の手順 | `--json` で指示を取得 |
| `openspec templates` | テンプレート参照 | `--json` でパス解決 |
| `openspec schemas` | スキーマ一覧 | `--json` でスキーマ探索 |
| `openspec store setup <id>` | Create and register a local store | `--json` with explicit inputs for structured setup output |
| `openspec store register <path>` | Register an existing store | `--json` for structured registration output |
| `openspec store unregister <id>` | Forget a local store registration | `--json` for structured cleanup output |
| `openspec store remove <id>` | Delete a registered local store folder | `--yes --json` for non-interactive deletion |
| `openspec store list` | Browse registered stores | `--json` for structured registrations |
| `openspec store doctor` | Check local store setup | `--json` for structured diagnostics |
| `openspec new change <id>` | Create repo-local change scaffolding | `--json`, plus `--store <id>` to use a registered store as the OpenSpec root |
| `openspec workset create [name]` | Compose a personal working view | `--member <path> --json` for non-interactive composition |
| `openspec workset list` | Browse saved worksets | `--json` for structured views |
| `openspec workset remove <name>` | Delete a saved view | `--yes --json` for non-interactive removal |

---

## グローバルオプション

すべてのコマンドで有効です。

| オプション | 説明 |
|--------|-------------|
| `--version`, `-V` | バージョンを表示 |
| `--no-color` | 色付き出力を無効化 |
| `--help`, `-h` | コマンドのヘルプを表示 |

---

## セットアップコマンド

### `openspec init`

プロジェクトで OpenSpec を初期化します。フォルダ構造を作成し、AI ツール連携を設定します。

既定ではグローバル設定の初期値が使われ、`profile=core`、`delivery=both`、`workflows=propose, explore, apply, sync, archive` で動作します。

```
openspec init [path] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `path` | いいえ | 対象ディレクトリ（デフォルト: 現在のディレクトリ） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--tools <list>` | 対話なしで AI ツールを設定。`all`, `none` またはカンマ区切りの一覧 |
| `--force` | 旧ファイルを確認なしで自動クリーンアップ |
| `--profile <profile>` | 今回の `init` 実行に限ってプロファイルを上書き（`core` または `custom`） |

`--profile custom` を指定すると、グローバル設定（`openspec config profile`）で現在選ばれているワークフロー群を使います。

**Supported tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

> This list mirrors `AI_TOOLS` in `src/core/config.ts`. See [Supported Tools](supported-tools.md) for each tool's skill and command paths.

**例:**

```bash
# 対話的に初期化
openspec init

# 特定ディレクトリで初期化
openspec init ./my-project

# 非対話: Claude と Cursor を設定
openspec init --tools claude,cursor

# すべての対応ツールを設定
openspec init --tools all

# 今回だけ core プロファイルで初期化
openspec init --profile core

# プロンプトをスキップし、旧ファイルを自動クリーンアップ
openspec init --force
```

**作成されるもの:**

```
openspec/
├── specs/              # 仕様（信頼できる基準）
├── changes/            # 変更提案
└── config.yaml         # プロジェクト設定

.claude/skills/         # Claude Code のスキルファイル（claude 選択時）
.cursor/skills/         # Cursor のスキルファイル（cursor 選択時）
.cursor/commands/       # Cursor の OPSX コマンド（commands 配信時）
...                     # 他ツールの設定
```

---

### `openspec update`

CLI を更新した後に指示ファイルを更新します。現在のグローバルプロファイル、選択済みワークフロー、`delivery` 設定に基づいて AI ツールの設定ファイルを再生成します。

```
openspec update [path] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `path` | いいえ | 対象ディレクトリ（デフォルト: 現在のディレクトリ） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--force` | ファイルが最新でも強制更新 |

**例:**

```bash
# npm でアップグレード後に指示ファイルを更新
npm update @ayumuwall/openspec
openspec update
```

---

## Stores (standalone OpenSpec repos)

> **Beta.** Stores and the features built on them (references, working context, worksets) are new; command names, flags, file formats, and JSON output may change shape between releases. For the problem-first walkthrough, see the [stores guide](stores-beta/user-guide.md).

A store is a standalone OpenSpec repo you've registered on this machine — for example a planning repo or a contracts repo. Registering a store lets normal commands (`list`, `show`, `status`, `validate`, `new change`, `archive`, ...) act in it from anywhere by passing `--store <id>`.

### `openspec store setup`

Create and register a local store. With no arguments in a terminal,
OpenSpec guides the user through setup. Agents and scripts should pass explicit
inputs and use `--json`.

```bash
openspec store setup [id] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--path <path>` | Folder where the store should live (for example `~/openspec/<id>`) |
| `--remote <url>` | Record the canonical remote in the new store's `store.yaml` |
| `--init-git` | Initialize a Git repository with an initial commit (default) |
| `--no-init-git` | Skip every Git action: no init, no initial commit |
| `--json` | JSON を出力 |

Non-interactive runs (`--json`, scripts, agents) must pass both the store id and `--path`. In an interactive terminal, setup prompts for the location with an editable suggestion in a visible, user-owned place (for example `~/openspec/<id>`); it never defaults to OpenSpec's managed data directory.

例:

```bash
openspec store setup
openspec store setup team-context
openspec store setup team-context --path ~/openspec/team-context --no-init-git
openspec store setup team-context --path ~/openspec/team-context --no-init-git --json
```

### `openspec store register`

Register an existing local store folder. During the stores beta, a root may be
registered before any changes exist, specs have been applied, or changes have
been archived; in that case `openspec/changes/`, `openspec/specs/`, and
`openspec/changes/archive/` may be absent until normal commands create them.
A config-only repo that declares `store: <id>` remains a pointer to another
store and is not registered as a store root unless that pointer is removed.

```bash
openspec store register [path] [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--id <id>` | Store id; defaults to store metadata or folder name |
| `--yes` | Confirm creating store identity metadata for a healthy OpenSpec root |
| `--json` | JSON を出力 |

### `openspec store unregister`

Forget a local store registration without deleting files.

```bash
openspec store unregister <id> [--json]
```

Use this when a store was moved, cloned somewhere else, or should no longer be
shown by OpenSpec on this machine.

### `openspec store remove`

Forget a local store registration and delete its local folder.

```bash
openspec store remove <id> [--yes] [--json]
```

`remove` shows the exact folder before deleting in an interactive terminal.
Agents, scripts, and JSON callers must pass `--yes` to confirm deletion.
OpenSpec refuses to delete a folder that does not contain matching
store metadata.

### `openspec store list`

List locally registered stores.

```bash
openspec store list [--json]
openspec store ls [--json]
```

### `openspec store doctor`

Check local store registration, metadata, and Git presence.

```bash
openspec store doctor [id] [--json]
```

doctor は診断専用です。context store を変更せず、欠落したルート、メタデータ不一致、不正なローカルレジストリ状態を報告します。

### Referencing stores from a project

A project repo can declare which stores its work draws on in `openspec/config.yaml`:

```yaml
schema: spec-driven
references:
  - team-context
```

From then on, `openspec instructions` output in that repo (both the per-artifact and `apply` surfaces, JSON and human modes) carries an index of each referenced store's specs — spec ids, a one-line summary from each spec's Purpose section, and the fetch command (`openspec show <spec-id> --type spec --store <id>`). The index is built live from the registered checkout on every run; spec content is never copied into the output.

References are read-only context. They never change where commands act: work stays in the repo's own root, and writing to a referenced store remains an explicit `--store` action. A reference that cannot be resolved (for example, a store not registered on this machine) degrades to a warning in the index with the exact fix, and instructions still generate. `openspec doctor` reports reference health in one place.

### Recording where a store is cloned from

A store can record its canonical clone source in its committed identity file, so onboarding never dead-ends at "register the store":

```bash
openspec store setup team-context --path ~/openspec/team-context \
  --remote git@github.com:acme/team-context.git
```

The remote lands in `.openspec-store/store.yaml` inside the initial commit, so every clone is born knowing it. For an existing store, edit `store.yaml` by hand and commit. `store doctor` shows the recorded remote (and the checkout's observed Git origin); setup/register sharing guidance names it; and register records the checkout's origin in the machine-local registry.

A reference declaration can carry the clone source too, so a teammate who doesn't have the store yet gets a complete, pasteable fix (`git clone <remote> <path> && openspec store register <path> --id <id>`):

```yaml
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

Recording a remote is not sync: OpenSpec never clones, pulls, or pushes on its own.

### Declaring a default store

A repo whose planning is fully externalized — no local `openspec/specs/` or `openspec/changes/` — can declare its store once instead of passing `--store` on every command:

```yaml
# openspec/config.yaml (the only file under openspec/)
store: team-context
```

Normal commands then resolve to the declared store automatically; the root banner and JSON `root` block report `source: "declared"` with the store id, and printed hints still carry `--store <id>`. The declaration is a fallback, never an override: explicit `--store` always wins, and a directory with real planning folders ignores the pointer (with a warning). To convert a pointer repo into a local OpenSpec root, remove the `store:` line and run `openspec init` — init refuses to scaffold while the declaration is present.

## Doctor (relationship health)

One read-only question, one place: is the OpenSpec root healthy, and are the stores it references available on this machine?

```bash
openspec doctor [--store <id>] [--json]
```

The report separates root health, store metadata health (including a note when the recorded remote and the checkout's origin diverge), and reference health (the same diagnostics instructions show, with clone fixes for unresolved references). Health findings of any severity exit 0 — agents read the `status` arrays; only command failures (no root, unknown store) exit 1. Doctor never clones, syncs, or repairs. To get the assembled set itself rather than its health, use `openspec context`.

## Working context (the assembled set)

Everything this work relates to through OpenSpec declarations, in one working set: the OpenSpec root and the stores it references.

```bash
openspec context [--store <id>] [--json] [--code-workspace <path> [--force]]
```

The JSON brief is agent-consumable (each available referenced store carries its fetch recipe; unresolved members carry the same fixes instructions and doctor show). `--code-workspace` additionally writes a VS Code workspace file containing the root plus the available referenced stores (`ref:<id>` folders) — the one write this command performs, refused without `--force` if the file exists. Unavailable members are reported, never guessed at.

"Working context" is the assembled set; the `context:` field in `openspec/config.yaml` is project background injected into instructions — two different things. `openspec doctor` answers whether the set is healthy; `openspec context` answers what the set is.

## Personal worksets

> **Beta.** Worksets are part of the new beta surface; commands, flags, and file formats may change shape between releases. For the walkthrough, see the [stores guide](stores-beta/user-guide.md#worksets-reopen-the-folders-you-work-on-together).

A workset is a personal, named view of the folders you work on together — a planning root plus whatever else you choose — kept on your machine and reopened by name in your tool. It is purely local: never committed, never shared, never derived from declarations, and removing one never touches a member folder.

```bash
openspec workset create [name] [--member <path> | --member <name>=<path>]... [--tool <id>] [--json]
openspec workset list [--json]
openspec workset open <name> [--tool <id>]
openspec workset remove <name> [--yes] [--json]
```

`create` runs a short guided flow (or takes `--member` flags non-interactively; the first member is the primary — sessions start there). `open` launches the chosen tool: editors (VS Code, Cursor) open a window with every member and return; CLI agents (Claude Code, codex) take over this terminal as a session with every member attached and no prompt pre-filled, ending when you exit. A member folder missing at open time is skipped with a note; the rest opens. The saved tool preference is overridable per open with `--tool`.

Supporting a new tool is configuration, not code. Every tool is one of two launch styles — `workspace-file` (launched with the generated `.code-workspace`) or `attach-dirs` (one attach flag per member) — and the `openers` key in the global `config.json` (open it with `openspec config edit`) adds tools or adjusts built-ins per field:

```json
{
  "openers": {
    "zed": { "style": "workspace-file" },
    "claude": { "attach_flag": "--dir" }
  }
}
```

All workset state lives under the global data dir's `worksets/` folder (the saved views plus the generated `<name>.code-workspace` files, regenerated on every open); deleting that folder removes every trace.

---

## 閲覧コマンド

### `openspec list`

プロジェクト内の変更または仕様を一覧表示します。

```
openspec list [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--specs` | 変更ではなく仕様を一覧表示 |
| `--changes` | 変更を一覧表示（デフォルト） |
| `--sort <order>` | `recent`（デフォルト）または `name` で並び替え |
| `--json` | JSON で出力 |

**例:**

```bash
# 進行中の変更を一覧表示
openspec list

# すべての仕様を一覧表示
openspec list --specs

# スクリプト向け JSON 出力
openspec list --json
```

**出力（テキスト）:**

```
Changes:
  add-dark-mode     No tasks      just now
```

---

### `openspec view`

仕様と変更を探索する対話型ダッシュボードを表示します。

```
openspec view
```

ターミナル上の UI を開き、プロジェクトの仕様や変更をナビゲートします。

---

### `openspec show`

変更または仕様の詳細を表示します。

```
openspec show [item-name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `item-name` | いいえ | 変更名または仕様名（省略時はプロンプト） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--type <type>` | `change` または `spec` を指定（曖昧でなければ自動判別） |
| `--json` | JSON で出力 |
| `--no-interactive` | プロンプトを無効化 |

**変更向けオプション:**

| オプション | 説明 |
|--------|-------------|
| `--deltas-only` | 仕様差分のみを表示（JSON モード） |

**仕様向けオプション:**

| オプション | 説明 |
|--------|-------------|
| `--requirements` | 要件のみを表示し、シナリオを除外（JSON モード） |
| `--no-scenarios` | シナリオを除外（JSON モード） |
| `-r, --requirement <id>` | 1 始まりのインデックスで特定要件を表示（JSON モード） |

**例:**

```bash
# 対話的に選択
openspec show

# 特定の変更を表示
openspec show add-dark-mode

# 特定の仕様を表示
openspec show auth --type spec

# 解析向け JSON 出力
openspec show add-dark-mode --json
```

---

## 検証コマンド

### `openspec validate`

変更と仕様を検証し、構造上の問題を検出します。

```
openspec validate [item-name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `item-name` | いいえ | 検証対象（省略時はプロンプト） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--all` | すべての変更と仕様を検証 |
| `--changes` | すべての変更を検証 |
| `--specs` | すべての仕様を検証 |
| `--type <type>` | 名称が曖昧な場合に `change` / `spec` を指定 |
| `--strict` | 厳密検証モードを有効化 |
| `--json` | JSON で出力 |
| `--concurrency <n>` | 並列検証の上限（デフォルト: 6、`OPENSPEC_CONCURRENCY` 環境変数でも指定可） |
| `--no-interactive` | プロンプトを無効化 |

**例:**

```bash
# 対話的に検証
openspec validate

# 特定の変更を検証
openspec validate add-dark-mode

# すべての変更を検証
openspec validate --changes

# CI/スクリプト向けに JSON で一括検証
openspec validate --all --json

# 厳密検証 + 並列数を増やす
openspec validate --all --strict --concurrency 12
```

**出力（テキスト）:**

```
add-dark-mode を検証中...
  ✓ proposal.md 有効
  ✓ specs/ui/spec.md 有効
  ⚠ design.md: 「Technical Approach」セクションがありません

警告 1 件
```

**出力（JSON）:**

```json
{
  "version": "1.0.0",
  "results": {
    "changes": [
      {
        "name": "add-dark-mode",
        "valid": true,
        "warnings": ["design.md: 「Technical Approach」セクションがありません"]
      }
    ]
  },
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  }
}
```

---

## ライフサイクルコマンド

### `openspec archive`

完了した変更をアーカイブし、仕様差分を本仕様に統合します。

```
openspec archive [change-name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `change-name` | いいえ | アーカイブ対象の変更（省略時はプロンプト） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `-y, --yes` | 確認プロンプトをスキップ |
| `--skip-specs` | 仕様更新をスキップ（インフラ/ツール/ドキュメントのみの変更向け） |
| `--no-validate` | 検証をスキップ（要確認） |

**例:**

```bash
# 対話的にアーカイブ
openspec archive

# 特定の変更をアーカイブ
openspec archive add-dark-mode

# プロンプトを省略（CI/スクリプト向け）
openspec archive add-dark-mode --yes

# 仕様に影響しないツール更新をアーカイブ
openspec archive update-ci-config --skip-specs
```

**動作内容:**

1. 変更を検証（`--no-validate` を指定しない限り）
2. 確認プロンプト（`--yes` を指定しない限り）
3. 仕様差分を `openspec/specs/` に統合
4. 変更フォルダを `openspec/changes/archive/YYYY-MM-DD-<name>/` に移動

---

## ワークフローコマンド

これらは OPSX のアーティファクト主導ワークフローを支援します。人が進捗を確認するときにも、エージェントが次の手順を判断するときにも有用です。

### `openspec new change`

Create a change directory and optional checked-in metadata in the resolved OpenSpec root.

```bash
openspec new change <name> [options]
```

Change names must use lowercase kebab-case. They start with a lowercase letter,
then contain lowercase letters, numbers, and single hyphens. They cannot start
with a number, contain spaces, underscores, uppercase letters, consecutive
hyphens, or leading/trailing hyphens. When including an external ticket ID,
prefix it with a word, for example `ticket-123-add-notifications` instead of
`123-add-notifications`.

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--description <text>` | `README.md` に追加する説明 |
| `--goal <text>` | Optional goal metadata to store with the change |
| `--schema <name>` | 使用する workflow schema |
| `--store <id>` | Store id to use as the OpenSpec root (a store is a standalone OpenSpec repo you've registered) |
| `--json` | JSON を出力 |

例:

```bash
openspec new change add-billing-api
openspec new change add-billing-api --store team-context --json
```

### `openspec status`

変更に対するアーティファクトの完了状況を表示します。

```
openspec status [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--change <id>` | 変更名（省略時はプロンプト） |
| `--schema <name>` | スキーマを上書き指定（変更の設定から自動判定） |
| `--json` | JSON で出力 |

**例:**

```bash
# 対話的にステータス確認
openspec status

# 特定変更のステータス
openspec status --change add-dark-mode

# エージェント向け JSON
openspec status --change add-dark-mode --json
```

**出力（テキスト）:**

```
変更: add-dark-mode
スキーマ: spec-driven
進捗: 2/4 アーティファクト完了

[x] proposal
[ ] design
[x] specs
[-] tasks (blocked by: design)
```

**出力（JSON）:**

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "spec-driven",
  "isComplete": false,
  "applyRequires": ["tasks"],
  "artifacts": [
    {"id": "proposal", "outputPath": "proposal.md", "status": "done"},
    {"id": "design", "outputPath": "design.md", "status": "ready"},
    {"id": "specs", "outputPath": "specs/**/*.md", "status": "done"},
    {"id": "tasks", "outputPath": "tasks.md", "status": "blocked", "missingDeps": ["design"]}
  ]
}
```

---

### `openspec instructions`

アーティファクト作成やタスク実装のための拡張指示を取得します。AI エージェントが次に作るべきものを理解するために使用します。

```
openspec instructions [artifact] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `artifact` | いいえ | アーティファクト ID: `proposal`, `specs`, `design`, `tasks`, `apply` |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--change <id>` | 変更名（非対話モードでは必須） |
| `--schema <name>` | スキーマを上書き指定 |
| `--json` | JSON で出力 |

**特記事項:** `apply` を指定すると、タスク実装向けの指示を返します。

**例:**

```bash
# 次に作るべきアーティファクトの指示を取得
openspec instructions --change add-dark-mode

# 特定アーティファクトの指示を取得
openspec instructions design --change add-dark-mode

# 実装（apply）向けの指示を取得
openspec instructions apply --change add-dark-mode

# エージェント向け JSON
openspec instructions design --change add-dark-mode --json
```

**出力内容:**

- アーティファクト用テンプレートの内容
- 設定から読み込んだプロジェクトコンテキスト
- 依存アーティファクトの内容
- 設定のアーティファクト別ルール

---

### `openspec templates`

スキーマ内のアーティファクトに対するテンプレートパスを表示します。

```
openspec templates [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--schema <name>` | 対象スキーマ（デフォルト: `spec-driven`） |
| `--json` | JSON で出力 |

**例:**

```bash
# デフォルトスキーマのテンプレートを表示
openspec templates

# カスタムスキーマのテンプレートを表示
openspec templates --schema my-workflow

# プログラム向け JSON
openspec templates --json
```

**出力（テキスト）:**

```
スキーマ: spec-driven

テンプレート:
  proposal  → ~/.openspec/schemas/spec-driven/templates/proposal.md
  specs     → ~/.openspec/schemas/spec-driven/templates/specs.md
  design    → ~/.openspec/schemas/spec-driven/templates/design.md
  tasks     → ~/.openspec/schemas/spec-driven/templates/tasks.md
```

---

### `openspec schemas`

利用可能なワークフロースキーマと、その説明・フローを一覧表示します。

```
openspec schemas [options]
```

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--json` | JSON で出力 |

**例:**

```bash
openspec schemas
```

**出力:**

```
利用可能なスキーマ:

  spec-driven (package)
    デフォルトの仕様駆動開発ワークフロー
    フロー: proposal → specs → design → tasks

  my-custom (project)
    このプロジェクト用のカスタムワークフロー
    フロー: research → proposal → tasks
```

---

## スキーマコマンド

カスタムワークフロースキーマの作成・管理に使用します。

### `openspec schema init`

プロジェクトローカルのスキーマを新規作成します。

```
openspec schema init <name> [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | はい | スキーマ名（kebab-case） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--description <text>` | スキーマの説明 |
| `--artifacts <list>` | アーティファクト ID のカンマ区切り（デフォルト: `proposal,specs,design,tasks`） |
| `--default` | プロジェクトのデフォルトスキーマに設定 |
| `--no-default` | デフォルト設定のプロンプトを無効化 |
| `--force` | 既存スキーマを上書き |
| `--json` | JSON で出力 |

**例:**

```bash
# 対話的にスキーマを作成
openspec schema init research-first

# 非対話 + アーティファクト指定
openspec schema init rapid \
  --description "高速に反復するワークフロー" \
  --artifacts "proposal,tasks" \
  --default
```

**作成されるもの:**

```
openspec/schemas/<name>/
├── schema.yaml           # スキーマ定義
└── templates/
    ├── proposal.md       # 各アーティファクトの
    ├── specs.md          # テンプレート
    ├── design.md
    └── tasks.md
```

---

### `openspec schema fork`

既存スキーマをプロジェクトにコピーしてカスタマイズします。

```
openspec schema fork <source> [name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `source` | はい | コピー元スキーマ |
| `name` | いいえ | 新しいスキーマ名（デフォルト: `<source>-custom`） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--force` | 既存のコピー先を上書き |
| `--json` | JSON で出力 |

**例:**

```bash
# ビルトインの spec-driven をフォーク
openspec schema fork spec-driven my-workflow
```

---

### `openspec schema validate`

スキーマ構造とテンプレートを検証します。

```
openspec schema validate [name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | いいえ | 検証対象スキーマ（省略時は全件） |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--verbose` | 詳細な検証ステップを表示 |
| `--json` | JSON で出力 |

**例:**

```bash
# 特定スキーマを検証
openspec schema validate my-workflow

# すべてのスキーマを検証
openspec schema validate
```

---

### `openspec schema which`

スキーマがどこから解決されるかを表示します（優先順位のデバッグ用）。

```
openspec schema which [name] [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | いいえ | スキーマ名 |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--all` | すべてのスキーマとソースを一覧表示 |
| `--json` | JSON で出力 |

**例:**

```bash
# スキーマの解決元を確認
openspec schema which spec-driven
```

**出力:**

```
spec-driven の解決元: package
  Source: /usr/local/lib/node_modules/@ayumuwall/openspec/schemas/spec-driven
```

**スキーマの優先順位:**

1. プロジェクト: `openspec/schemas/<name>/`
2. ユーザー: `~/.local/share/openspec/schemas/<name>/`
3. パッケージ: 組み込みスキーマ

---

## 設定コマンド

### `openspec config`

グローバルな OpenSpec 設定を閲覧・変更します。

```
openspec config <subcommand> [options]
```

**サブコマンド:**

| サブコマンド | 説明 |
|------------|-------------|
| `path` | 設定ファイルの場所を表示 |
| `list` | 現在の設定一覧を表示 |
| `get <key>` | 指定キーの値を取得 |
| `set <key> <value>` | 値を設定 |
| `unset <key>` | キーを削除 |
| `reset` | デフォルトに戻す |
| `edit` | `$EDITOR` で開く |
| `profile [preset]` | ワークフロープロファイルを対話的またはプリセットで設定 |

**例:**

```bash
# 設定ファイルのパスを表示
openspec config path

# 設定一覧を表示
openspec config list

# 特定キーの値を取得
openspec config get telemetry.enabled

# 値を設定
openspec config set telemetry.enabled false

# 文字列として明示的に設定
openspec config set user.name "自分の名前" --string

# カスタム設定を削除
openspec config unset user.name

# すべての設定をリセット
openspec config reset --all --yes

# エディタで設定を開く
openspec config edit

# ウィザードでプロファイルを設定
openspec config profile

# すばやく core へ切り替え（`delivery` は維持）
openspec config profile core
```

`openspec config profile` は現在の状態サマリーから始まり、以下を選択できます。
- デリバリー + ワークフローを変更
- デリバリーのみ変更
- ワークフローのみ変更
- 現在の設定を維持（終了）

現在の設定を維持した場合、変更は書き込まれず更新プロンプトも表示されません。
If there are no config changes but the current project files are out of sync with your global profile/delivery, OpenSpec will show a warning and suggest `openspec update`.
`Ctrl+C` を押しても処理をきれいにキャンセルでき（スタックトレースなし）、コード `130` で終了します。
In the workflow checklist, `[x]` means the workflow is selected in global config. To apply those selections to project files, run `openspec update` (or choose `Apply changes to this project now?` when prompted inside a project).

**対話例:**

```bash
# デリバリーのみ更新
openspec config profile
# 選択: デリバリーのみ変更
# デリバリーを選択: Skills のみ

# ワークフローのみ更新
openspec config profile
# 選択: ワークフローのみ変更
# チェックリストでワークフローを切り替えて確認
```

---

## ユーティリティコマンド

### `openspec feedback`

OpenSpec へのフィードバックを送信します。GitHub Issue を作成します。

```
openspec feedback <message> [options]
```

**引数:**

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `message` | はい | フィードバック内容 |

**オプション:**

| オプション | 説明 |
|--------|-------------|
| `--body <text>` | 詳細説明 |

**要件:** GitHub CLI（`gh`）がインストールされ、認証済みである必要があります。

**例:**

```bash
openspec feedback "独自アーティファクト型のサポートを追加してほしい" \
  --body "組み込み以外の独自アーティファクト型を定義できるようにしたいです。"
```

---

### `openspec completion`

OpenSpec CLI のシェル補完を管理します。

```
openspec completion <subcommand> [shell]
```

**サブコマンド:**

| サブコマンド | 説明 |
|------------|-------------|
| `generate [shell]` | 補完スクリプトを標準出力に出力 |
| `install [shell]` | シェル補完をインストール |
| `uninstall [shell]` | インストール済み補完を削除 |

**対応シェル:** `bash`, `zsh`, `fish`, `powershell`

**例:**

```bash
# 補完をインストール（シェルを自動検出）
openspec completion install

# 特定シェル向けにインストール
openspec completion install zsh

# 手動インストール用にスクリプトを生成
openspec completion generate bash > ~/.bash_completion.d/openspec

# アンインストール
openspec completion uninstall
```

---

## 終了コード

| コード | 意味 |
|------|---------|
| `0` | 成功 |
| `1` | エラー（検証失敗、ファイル欠落など） |

---

## 環境変数

| 変数 | 説明 |
|----------|-------------|
| `OPENSPEC_TELEMETRY` | `0` に設定するとテレメトリを無効化 |
| `DO_NOT_TRACK` | `1` に設定するとテレメトリを無効化（標準 DNT シグナル） |
| `OPENSPEC_CONCURRENCY` | 一括検証のデフォルト並列数（デフォルト: 6） |
| `EDITOR` または `VISUAL` | `openspec config edit` のエディタ指定 |
| `NO_COLOR` | 設定時に色付き出力を無効化 |

---

## 関連ドキュメント

- [コマンド](commands.md) - AI スラッシュコマンド（`/opsx:propose`, `/opsx:apply` など）
- [ワークフロー](workflows.md) - 代表的なフローと使い分け
- [カスタマイズ](customization.md) - カスタムスキーマとテンプレート
- [はじめに](getting-started.md) - 初回セットアップガイド
