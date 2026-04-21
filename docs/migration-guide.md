# OPSX への移行

このガイドは、旧 OpenSpec ワークフローから OPSX へ移行するための手順です。移行はスムーズで、既存の作業は保持されます。新しいシステムではより柔軟に進められます。

## 何が変わるのか

OPSX は、旧来のフェーズ固定ワークフローを、柔軟なアクション単位のワークフローへ置き換えます。主な違いは次の通りです。

| 項目 | 旧ワークフロー | OPSX |
|--------|--------|------|
| **コマンド** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` | 既定: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`（拡張ワークフローコマンドは任意） |
| **進め方** | すべてのアーティファクトを一括作成 | 段階的にも一括でも選べる |
| **やり直し** | フェーズゲートがあり戻りづらい | いつでもアーティファクトを更新可能 |
| **カスタマイズ** | 固定構造 | スキーマ駆動で自由に拡張 |
| **設定** | `CLAUDE.md` のマーカー + `project.md` | `openspec/config.yaml` に整理 |

**哲学の転換:** 作業は直線的ではない。OPSX はそれを前提にします。

---

## 移行前の確認

### 既存の作業は安全

移行は「保持」を前提に設計されています。

- **`openspec/changes/` の進行中の変更** — そのまま残ります。OPSX コマンドで継続できます。
- **アーカイブ済み変更** — 変更なし。履歴は保持されます。
- **`openspec/specs/` の本仕様** — 変更なし。ソース・オブ・トゥルースです。
- **`CLAUDE.md` / `AGENTS.md` などの自分の記述** — OpenSpec マーカーだけ除去され、あなたの内容は保持されます。

### 削除されるもの

置き換え対象の OpenSpec 管理ファイルのみが削除されます。

| 対象 | 理由 |
|------|-----|
| 旧スラッシュコマンドのディレクトリ/ファイル | 新しい Skills 方式に置換 |
| `openspec/AGENTS.md` | 旧ワークフロートリガーのため不要 |
| `CLAUDE.md` / `AGENTS.md` などの OpenSpec マーカー | もはや不要 |

**ツール別の旧コマンド位置（例）:**

- Claude Code: `.claude/commands/openspec/`
- Cursor: `.cursor/commands/openspec-*.md`
- Windsurf: `.windsurf/workflows/openspec-*.md`
- Cline: `.clinerules/workflows/openspec-*.md`
- Roo: `.roo/commands/openspec-*.md`
- GitHub Copilot: `.github/prompts/openspec-*.prompt.md`（IDE 拡張機能のみ。Copilot CLI は非対応）
- ほか（Augment, Continue, Amazon Q など）

移行処理は、設定済みツールを検出して旧ファイルを整理します。

リストが長く見えますが、OpenSpec が生成したファイルのみが対象です。あなたの独自ファイルは削除されません。

### 手動対応が必要なもの

1 つだけ手動移行が必要です。

**`openspec/project.md`** — 自分で書いたプロジェクト文脈が含まれる可能性があるため、自動削除しません。次を行ってください。

1. 内容を確認
2. 必要な文脈を `openspec/config.yaml` に移す（後述）
3. 準備できたら削除

**この変更をした理由:**

旧 `project.md` は受動的で、エージェントが読んだり読まなかったり、読み忘れたりすることがありました。信頼性が一定しませんでした。

新しい `config.yaml` の `context` は **毎回の計画リクエストに注入** されるため、常に一貫した文脈が渡ります。信頼性が高い運用です。

**トレードオフ:**

毎回注入されるため、簡潔さが重要です。
- 技術スタックや主要な規約
- 非自明な制約（「ライブラリ X は使えない」など）
- 以前よく無視されたルール

完璧にする必要はありません。運用しながら調整できます。

---

## 移行の実行

`openspec init` と `openspec update` はどちらも旧ファイルを検出し、同じクリーンアップを案内します。用途に合わせて選んでください。

- 新規インストールでは、既定で `core` プロファイル（`propose`, `explore`, `apply`, `archive`）が設定されます。
- 既存環境の移行では、必要に応じて `custom` プロファイルを生成し、これまで入っていたワークフロー構成を維持します。

### `openspec init` を使う

新しいツールを追加したい、または設定を作り直したい場合:

```bash
openspec init
```

init は旧ファイルを検出し、クリーンアップを案内します:

```
OpenSpec を新バージョンへアップグレードしています

OpenSpec は現在、コーディングエージェント間で広がりつつある
Agent Skills を使用します。従来どおり動作させつつ
セットアップが簡素化されます。

削除するファイル
ユーザー内容を保持する必要はありません:
  • .claude/commands/openspec/
  • openspec/AGENTS.md

更新するファイル
OpenSpec マーカーを除去し、内容は保持します:
  • CLAUDE.md
  • AGENTS.md

要確認
  • openspec/project.md
    このファイルは削除しません。有用なプロジェクト文脈が
    含まれている可能性があります。

    新しい openspec/config.yaml には計画用の「context:」があり、
    これはすべての OpenSpec リクエストに含まれます。
    旧 project.md の方式より安定して機能します。

    project.md を確認し、有用な内容を config.yaml の context
    セクションに移し、準備できたら削除してください。

? 旧ファイルをアップグレードしてクリーンアップしますか? (Y/n)
```

**はいを選んだ場合:**

1. 旧スラッシュコマンドのディレクトリが削除される
2. `CLAUDE.md` / `AGENTS.md` から OpenSpec マーカーが除去される（内容は保持）
3. `openspec/AGENTS.md` が削除される
4. `.claude/skills/` に新しい Skills が生成される
5. `openspec/config.yaml` が作成され、デフォルトスキーマが設定される

### `openspec update` を使う

既存ツールを最新に更新したい場合:

```bash
openspec update
```

`update` も旧ファイルの検出・整理を行い、現在のプロファイルと `delivery` 設定に合わせて生成済みの Skills / Commands を最新状態へ更新します。

### 非対話 / CI 環境

スクリプトで移行する場合:

```bash
openspec init --force --tools claude
```

`--force` はプロンプトを省略し、クリーンアップを自動承認します。

---

## project.md から config.yaml へ移行

旧 `openspec/project.md` は自由記述の Markdown でした。新しい `openspec/config.yaml` は構造化され、**すべての計画リクエストに注入** されます。これにより AI が常に文脈を持った状態でアーティファクトを作ります。

### 移行前（project.md）

```markdown
# プロジェクト文脈

これは React と Node.js を使う TypeScript モノレポです。
テストは Jest を使い、厳格な ESLint ルールに従います。
API は REST で、docs/api.md に記載しています。

## 規約

- すべての公開 API は後方互換を維持する
- 新機能にはテストを含める
- 仕様は Given/When/Then 形式を使う
```

### 移行後（config.yaml）

```yaml
schema: spec-driven

context: |
  技術スタック: TypeScript, React, Node.js
  テスト: React Testing Library と Jest
  API: REST、docs/api.md に記載
  公開 API はすべて後方互換を維持する

rules:
  proposal:
    - リスクの高い変更にはロールバック計画を含める
  specs:
    - シナリオは Given/When/Then 形式を使う
    - 既存パターンを参照してから新規に発明する
  design:
    - 複雑なフローにはシーケンス図を含める
```

### 主な違い

| project.md | config.yaml |
|------------|-------------|
| 自由記述 Markdown | 構造化 YAML |
| 一つの長文 | `context` と `rules` に分離 |
| 使われるタイミングが曖昧 | `context` は全アーティファクトに注入、`rules` は該当アーティファクトのみ |
| スキーマ指定なし | `schema:` でデフォルトを明示 |

### 何を残し、何を捨てるか

移行時は「毎回必要か」を基準に選別します。

**`context:` に入れるもの**
- 技術スタック（言語/フレームワーク/DB）
- 主要な設計パターン（モノレポ、マイクロサービス等）
- 非自明な制約（「ライブラリ X は使えない」など）
- 何度も無視された重要規約

**`rules:` に移すもの**
- アーティファクト固有の書式ルール（例: specs は Given/When/Then）
- レビュー基準（例: proposal にロールバック計画を含める）

**省くもの**
- 一般的なベストプラクティス
- 冗長な説明
- 現在の作業に影響しない履歴

### 移行手順

1. **config.yaml を作成**（init が作成済みなら不要）:
   ```yaml
   schema: spec-driven
   ```

2. **context を追加**（毎回注入されるため簡潔に）:
   ```yaml
   context: |
     プロジェクトの背景をここに記述します。
     AI が本当に必要とする情報に絞ってください。
   ```

3. **アーティファクト別ルールを追加**（任意）:
   ```yaml
   rules:
     proposal:
       - proposal 向けのガイダンスを書く
     specs:
       - 仕様作成のルールを書く
   ```

4. **project.md を削除**（必要内容を移したら）

**迷ったら小さく始める。** 重要な要素だけ入れて、足りないと感じたら追加、冗長なら削る運用で十分です。

### 困ったときのプロンプト

project.md の取捨選択が難しい場合、AI に次のように依頼できます。

```
OpenSpec の古い project.md から、新しい config.yaml 形式へ移行中です。

現在の project.md:
[project.md の内容を貼り付け]

次の条件を満たす config.yaml を作成してください:
1. 簡潔な `context:` セクション（全計画リクエストに注入されるので短く。技術スタック、主要制約、よく無視される規約に集中）
2. アーティファクト固有の内容があれば `rules:` に分離（例: "Given/When/Then を使う" は specs の rules に入れる）

AI が既に知っている一般論は除外してください。簡潔さを最優先してください。
```

AI が「必須 vs 削減」の判断を手伝います。

---

## 新しいコマンド

利用できるコマンドは、選んでいるプロファイルによって変わります。

| コマンド | 目的 |
|---------|---------|
| `/opsx:propose` | 変更を作成し、計画用アーティファクトを一度に生成する |
| `/opsx:explore` | 形式なしでアイデアを整理 |
| `/opsx:apply` | `tasks.md` のタスクを実装 |
| `/opsx:archive` | 変更を確定・アーカイブ |

**拡張ワークフロー（追加選択時）:**

| コマンド | 目的 |
|---------|---------|
| `/opsx:new` | 変更のひな形だけを作る |
| `/opsx:continue` | 次のアーティファクトを 1 つずつ作る |
| `/opsx:ff` | 計画アーティファクトを一括生成 |
| `/opsx:verify` | 実装が仕様に合うか検証 |
| `/opsx:sync` | アーカイブ前に仕様マージ結果を確認する |
| `/opsx:bulk-archive` | 複数変更を一括アーカイブ |
| `/opsx:onboard` | 変更の開始から完了までをガイド付きで体験する |

拡張コマンドを使いたい場合は `openspec config profile` を実行し、その後 `openspec update` で反映します。

### 旧コマンドとの対応

| 旧コマンド | OPSX での対応 |
|--------|-----------------|
| `/openspec:proposal` | `/opsx:propose`（既定）または `/opsx:new` → `/opsx:ff`（拡張） |
| `/openspec:apply` | `/opsx:apply` |
| `/openspec:archive` | `/opsx:archive` |

### 新しい能力

これらは拡張ワークフローコマンド群に含まれる機能です。

**段階的なアーティファクト作成:**
```
/opsx:continue
```
依存関係に基づいて 1 つずつ作成します。各段階をレビューしたいときに有効です。

**探索モード:**
```
/opsx:explore
```
変更を始める前に相談・調査できます。

---

## 新アーキテクチャの理解

### フェーズ固定から柔軟な進行へ

旧ワークフローは線形でした:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    計画      │ ───► │    実装      │ ───► │  アーカイブ  │
│   フェーズ   │      │   フェーズ   │      │   フェーズ   │
└──────────────┘      └──────────────┘      └──────────────┘

実装中に設計が間違っていると気づいたら？
残念ながらフェーズゲートが戻るのを許しません。
```

OPSX はアクション単位で進めます:

```
         ┌───────────────────────────────────────────────┐
         │        アクション（フェーズではない）          │
         │                                               │
         │     new ◄──► continue ◄──► apply ◄──► archive │
         │      │          │           │             │   │
         │      └──────────┴───────────┴─────────────┘   │
         │                    順不同                     │
         └───────────────────────────────────────────────┘
```

### 依存関係グラフ

アーティファクトは有向グラフを形成します。依存関係はゲートではなく進行可能性です。

```
                        proposal
                       (ルートノード)
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
           specs                       design
        (依存:                       (依存:
         proposal)                   proposal)
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                         tasks
                     (依存:
                     specs, design)
```

`/opsx:continue` は作成可能なアーティファクトを提示します。複数ある場合は任意の順序で作成できます。

### Skills と Commands

旧システムではツール別のコマンドファイルを使っていました:

```
.claude/commands/openspec/
├── proposal.md
├── apply.md
└── archive.md
```

OPSX は新しい **Skills** 標準を使います:

```
.claude/skills/
├── openspec-explore/SKILL.md
├── openspec-new-change/SKILL.md
├── openspec-continue-change/SKILL.md
├── openspec-apply-change/SKILL.md
└── ...
```

Skills は複数の AI ツールで認識され、より豊富なメタデータを提供します。

---

## 既存変更の継続

進行中の変更は OPSX コマンドでそのまま続けられます。

**旧ワークフローの変更がある場合:**

```
/opsx:apply add-my-feature
```

既存アーティファクトを読み込み、続きから進めます。

**既存変更にアーティファクトを追加したい場合:**

```
/opsx:continue add-my-feature
```

既存状況に基づき、次に作成できるものを表示します。

**ステータス確認:**

```bash
openspec status --change add-my-feature
```

---

## 新しい設定システム

### config.yaml の構造

```yaml
# 必須: 新規変更のデフォルトスキーマ
schema: spec-driven

# 任意: プロジェクト文脈（最大 50KB）
# すべてのアーティファクト指示に注入される
context: |
  プロジェクトの背景、技術スタック、
  規約や制約を記載します。

# 任意: アーティファクト別ルール
# 該当アーティファクトにのみ注入される
rules:
  proposal:
    - ロールバック計画を含める
  specs:
    - Given/When/Then 形式を使う
  design:
    - フォールバック戦略を記述する
  tasks:
    - 2 時間以内の粒度に分割する
```

### スキーマ解決順

使用するスキーマは次の順で決まります。

1. **CLI フラグ**: `--schema <name>`（最優先）
2. **変更メタデータ**: 変更フォルダの `.openspec.yaml`
3. **プロジェクト設定**: `openspec/config.yaml`
4. **デフォルト**: `spec-driven`

### 利用可能なスキーマ

| スキーマ | アーティファクト | 向いている用途 |
|--------|-----------|----------|
| `spec-driven` | proposal → specs → design → tasks | ほとんどのプロジェクト |

利用可能なスキーマ一覧:

```bash
openspec schemas
```

### カスタムスキーマ

独自スキーマを作成:

```bash
openspec schema init my-workflow
```

既存スキーマをフォーク:

```bash
openspec schema fork spec-driven my-workflow
```

詳細は [カスタマイズ](customization.md) を参照してください。

---

## トラブルシューティング

### "Legacy files detected in non-interactive mode"

CI など非対話環境で実行しています。次を使ってください。

```bash
openspec init --force
```

### 移行後にコマンドが表示されない

IDE を再起動してください。skills は起動時に検出されます。

### "Unknown artifact ID in rules"

`rules:` のキーがスキーマのアーティファクト ID と一致しているか確認してください。

- **spec-driven**: `proposal`, `specs`, `design`, `tasks`

有効な ID を確認するには:

```bash
openspec schemas --json
```

### 設定が反映されない

1. `openspec/config.yaml` に置いているか（`.yml` ではない）
2. YAML 構文が正しいか
3. 設定変更は即時反映される（再起動不要）

### project.md が移行されていない

`project.md` は内容が残る可能性があるため自動削除されません。手動で確認し、必要な部分を `config.yaml` に移してから削除してください。

### 何が削除されるか確認したい

init を実行してクリーンアップを拒否すると、変更を加えずに検出結果を確認できます。

---

## クイックリファレンス

### 移行後のファイル構成

```
project/
├── openspec/
│   ├── specs/                    # 変更なし
│   ├── changes/                  # 変更なし
│   │   └── archive/              # 変更なし
│   └── config.yaml               # 新規: プロジェクト設定
├── .claude/
│   └── skills/                   # 新規: OPSX Skills
│       ├── openspec-propose/     # 既定の core プロファイル
│       ├── openspec-explore/
│       ├── openspec-apply-change/
│       └── ...                   # 拡張プロファイルでは new/continue/ff 等も追加
├── CLAUDE.md                     # OpenSpec マーカーを削除、内容は保持
└── AGENTS.md                     # OpenSpec マーカーを削除、内容は保持
```

### なくなるもの

- `.claude/commands/openspec/` — `.claude/skills/` に置換
- `openspec/AGENTS.md` — 廃止
- `openspec/project.md` — `config.yaml` に移行して削除
- `CLAUDE.md` / `AGENTS.md` などの OpenSpec マーカー

### コマンド早見表

```text
/opsx:propose      すばやく開始（既定の core プロファイル）
/opsx:apply        タスクを実装
/opsx:archive      完了してアーカイブ

# 拡張ワークフロー（有効時）
/opsx:new          変更の土台を作る
/opsx:continue     次のアーティファクトを作成
/opsx:ff           計画アーティファクトを一括生成
```

---

## サポート

- **Discord**: [discord.gg/YctCnvvshC](https://discord.gg/YctCnvvshC)
- **GitHub Issues**: [github.com/ayumuwall/OpenSpec-J/issues](https://github.com/ayumuwall/OpenSpec-J/issues)
- **ドキュメント**: [docs/opsx.md](opsx.md) — OPSX の詳細
