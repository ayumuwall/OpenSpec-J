# OPSX への移行

このガイドは、旧 OpenSpec ワークフローから OPSX へ移行するための手順です。移行はスムーズで、既存の作業は保持されます。新しいシステムではより柔軟に進められます。

> [!NOTE]
> 会話例・出力例のコードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO migration examples -->

## 何が変わるのか

OPSX は、旧来のフェーズ固定ワークフローを、柔軟なアクションベースのワークフローへ置き換えます。主な違いは次の通りです。

| 項目 | 旧ワークフロー | OPSX |
|--------|--------|------|
| **コマンド** | `/openspec:proposal`, `/openspec:apply`, `/openspec:archive` | `/opsx:new`, `/opsx:continue`, `/opsx:apply` ほか |
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
| 旧スラッシュコマンドのディレクトリ/ファイル | 新しい skills システムに置換 |
| `openspec/AGENTS.md` | 旧ワークフロートリガーのため不要 |
| `CLAUDE.md` / `AGENTS.md` などの OpenSpec マーカー | もはや不要 |

**ツール別の旧コマンド位置（例）:**

- Claude Code: `.claude/commands/openspec/`
- Cursor: `.cursor/commands/openspec-*.md`
- Windsurf: `.windsurf/workflows/openspec-*.md`
- Cline: `.clinerules/workflows/openspec-*.md`
- Roo: `.roo/commands/openspec-*.md`
- GitHub Copilot: `.github/prompts/openspec-*.prompt.md`
- ほか（Augment, Continue, Amazon Q など）

移行は、設定済みツールを検出して旧ファイルをクリーンアップします。

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

### `openspec init` を使う

新しいツールを追加したい、または設定を作り直したい場合:

```bash
openspec init
```

init は旧ファイルを検出し、クリーンアップを案内します:

```
Upgrading to the new OpenSpec

OpenSpec now uses agent skills, the emerging standard across coding
agents. This simplifies your setup while keeping everything working
as before.

Files to remove
No user content to preserve:
  • .claude/commands/openspec/
  • openspec/AGENTS.md

Files to update
OpenSpec markers will be removed, your content preserved:
  • CLAUDE.md
  • AGENTS.md

Needs your attention
  • openspec/project.md
    We won't delete this file. It may contain useful project context.

    The new openspec/config.yaml has a "context:" section for planning
    context. This is included in every OpenSpec request and works more
    reliably than the old project.md approach.

    Review project.md, move any useful content to config.yaml's context
    section, then delete the file when ready.

? Upgrade and clean up legacy files? (Y/n)
```

**Yes を選んだ場合:**

1. 旧スラッシュコマンドのディレクトリが削除される
2. `CLAUDE.md` / `AGENTS.md` から OpenSpec マーカーが除去される（内容は保持）
3. `openspec/AGENTS.md` が削除される
4. `.claude/skills/` に新しい skills が生成される
5. `openspec/config.yaml` が作成され、デフォルトスキーマが設定される

### `openspec update` を使う

既存ツールを最新に更新したい場合:

```bash
openspec update
```

update も旧ファイルの検出・クリーンアップを行い、最新の skills を再生成します。

### 非対話 / CI 環境

スクリプトで移行する場合:

```bash
openspec init --force --tools claude
```

`--force` はプロンプトを省略し、クリーンアップを自動承認します。

---

## project.md から config.yaml へ移行

旧 `openspec/project.md` は自由記述の Markdown でした。新しい `openspec/config.yaml` は構造化され、**すべての計画リクエストに注入** されます。これにより AI が常に文脈を持った状態でアーティファクトを作ります。

### Before（project.md）

```markdown
# Project Context

This is a TypeScript monorepo using React and Node.js.
We use Jest for testing and follow strict ESLint rules.
Our API is RESTful and documented in docs/api.md.

## Conventions

- All public APIs must maintain backwards compatibility
- New features should include tests
- Use Given/When/Then format for specifications
```

### After（config.yaml）

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  Testing: Jest with React Testing Library
  API: RESTful, documented in docs/api.md
  We maintain backwards compatibility for all public APIs

rules:
  proposal:
    - Include rollback plan for risky changes
  specs:
    - Use Given/When/Then format for scenarios
    - Reference existing patterns before inventing new ones
  design:
    - Include sequence diagrams for complex flows
```

### 主な違い

| project.md | config.yaml |
|------------|-------------|
| 自由記述 Markdown | 構造化 YAML |
| 一つの長文 | context と rules に分離 |
| 使われるタイミングが曖昧 | context は全アーティファクトに注入、rules は該当アーティファクトのみ |
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
     Your project background goes here.
     Focus on what the AI genuinely needs to know.
   ```

3. **アーティファクト別ルールを追加**（任意）:
   ```yaml
   rules:
     proposal:
       - Your proposal-specific guidance
     specs:
       - Your spec-writing rules
   ```

4. **project.md を削除**（必要内容を移したら）

**迷ったら小さく始める。** 重要な要素だけ入れて、足りないと感じたら追加、冗長なら削る運用で十分です。

### 困ったときのプロンプト

project.md の取捨選択が難しい場合、AI に次のように依頼できます。

```
I'm migrating from OpenSpec's old project.md to the new config.yaml format.

Here's my current project.md:
[paste your project.md content]

Please help me create a config.yaml with:
1. A concise `context:` section (this gets injected into every planning request, so keep it tight—focus on tech stack, key constraints, and conventions that often get ignored)
2. `rules:` for specific artifacts if any content is artifact-specific (e.g., "use Given/When/Then" belongs in specs rules, not global context)

Leave out anything generic that AI models already know. Be ruthless about brevity.
```

AI が「必須 vs 削減」の判断を手伝います。

---

## 新しいコマンド

移行後は 3 つのコマンドではなく 9 つの OPSX コマンドになります。

| コマンド | 目的 |
|---------|---------|
| `/opsx:explore` | 形式なしでアイデアを整理 |
| `/opsx:new` | 新しい変更を開始 |
| `/opsx:continue` | 次のアーティファクトを作成（1 つずつ） |
| `/opsx:ff` | 計画アーティファクトを一括生成 |
| `/opsx:apply` | tasks.md のタスクを実装 |
| `/opsx:verify` | 実装が仕様に合うか検証 |
| `/opsx:sync` | 仕様マージのプレビュー（任意） |
| `/opsx:archive` | 変更を確定・アーカイブ |
| `/opsx:bulk-archive` | 複数変更を一括アーカイブ |

### 旧コマンドとの対応

| 旧コマンド | OPSX での対応 |
|--------|-----------------|
| `/openspec:proposal` | `/opsx:new` → `/opsx:ff` |
| `/openspec:apply` | `/opsx:apply` |
| `/openspec:archive` | `/opsx:archive` |

### 新しい能力

**粒度の細かいアーティファクト作成:**
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

### フェーズ固定から流動へ

旧ワークフローは線形でした:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   PLANNING   │ ───► │ IMPLEMENTING │ ───► │   ARCHIVING  │
│    PHASE     │      │    PHASE     │      │    PHASE     │
└──────────────┘      └──────────────┘      └──────────────┘

If you're in implementation and realize the design is wrong?
Too bad. Phase gates don't let you go back easily.
```

OPSX はアクションベースです:

```
         ┌────────────────────────────────────────┐
         │           ACTIONS (not phases)         │
         │                                        │
         │     new ◄──► continue ◄──► apply ◄──► archive │
         │      │          │           │           │   │
         │      └──────────┴───────────┴───────────┘   │
         │              any order                     │
         └────────────────────────────────────────┘
```

### 依存関係グラフ

アーティファクトは有向グラフを形成します。依存関係はゲートではなく進行可能性です。

```
                        proposal
                       (root node)
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
           specs                       design
        (requires:                  (requires:
         proposal)                   proposal)
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                         tasks
                     (requires:
                     specs, design)
```

`/opsx:continue` は ready なアーティファクトを提示します。複数が ready なら任意の順序で作成できます。

### Skills と Commands

旧システムではツール別のコマンドファイルを使っていました:

```
.claude/commands/openspec/
├── proposal.md
├── apply.md
└── archive.md
```

OPSX は新しい **skills** 標準を使います:

```
.claude/skills/
├── openspec-explore/SKILL.md
├── openspec-new-change/SKILL.md
├── openspec-continue-change/SKILL.md
├── openspec-apply-change/SKILL.md
└── ...
```

skills は複数の AI ツールで認識され、より豊富なメタデータを提供します。

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
# Required: Default schema for new changes
schema: spec-driven

# Optional: Project context (max 50KB)
# Injected into ALL artifact instructions
context: |
  Your project background, tech stack,
  conventions, and constraints.

# Optional: Per-artifact rules
# Only injected into matching artifacts
rules:
  proposal:
    - Include rollback plan
  specs:
    - Use Given/When/Then format
  design:
    - Document fallback strategies
  tasks:
    - Break into 2-hour maximum chunks
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
openspec workflow schemas
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

詳細は [Customization](customization.md) を参照してください。

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
openspec workflow schemas --json
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
│   ├── specs/                    # Unchanged
│   ├── changes/                  # Unchanged
│   │   └── archive/              # Unchanged
│   └── config.yaml               # NEW: Project configuration
├── .claude/
│   └── skills/                   # NEW: OPSX skills
│       ├── openspec-explore/
│       ├── openspec-new-change/
│       └── ...
├── CLAUDE.md                     # OpenSpec markers removed, your content preserved
└── AGENTS.md                     # OpenSpec markers removed, your content preserved
```

### なくなるもの

- `.claude/commands/openspec/` — `.claude/skills/` に置換
- `openspec/AGENTS.md` — 廃止
- `openspec/project.md` — `config.yaml` に移行して削除
- `CLAUDE.md` / `AGENTS.md` などの OpenSpec マーカー

### コマンド早見表

```
/opsx:new          Start a change
/opsx:continue     Create next artifact
/opsx:ff           Create all planning artifacts
/opsx:apply        Implement tasks
/opsx:archive      Finish and archive
```

---

## サポート

- **Discord**: [discord.gg/YctCnvvshC](https://discord.gg/YctCnvvshC)
- **GitHub Issues**: [github.com/Fission-AI/OpenSpec/issues](https://github.com/Fission-AI/OpenSpec/issues)
- **ドキュメント**: [docs/opsx.md](opsx.md) — OPSX の詳細
