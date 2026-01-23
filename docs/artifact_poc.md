# POC-OpenSpec-Core 分析

---

## 設計判断と用語

### 思想: ワークフローシステムではない

このシステムは **ワークフローエンジンではありません**。**依存関係を把握するアーティファクトトラッカー**です。

| これは何ではないか | これは何か |
|---------------|------------|
| 直線的なステップ進行 | 探索的で反復的な計画 |
| 官僚的なチェックポイント | 可能性を開く仕組み |
| 「まずステップ 1 を終えないといけない」 | 「今作れるものはこれです」 |
| フォーム入力 | 柔軟なドキュメント作成 |

**重要な洞察:** 依存関係は *ゲート* ではなく *エネーブラ* です。提案がなければ設計書は書けません。これは官僚主義ではなく、論理です。

### 用語

| 用語 | 定義 | 例 |
|------|------------|---------|
| **変更 (Change)** | 計画中の作業単位（機能追加、リファクタ、移行） | `openspec/changes/add-auth/` |
| **スキーマ (Schema)** | アーティファクトグラフの定義（アーティファクトと依存） | `spec-driven.yaml` |
| **アーティファクト (Artifact)** | グラフ上のノード（作成するドキュメント） | `proposal`, `design`, `specs` |
| **テンプレート (Template)** | アーティファクト作成の指示・ガイド | `templates/proposal.md` |

### 階層

```
スキーマ（定義） ──→ アーティファクト（指示に従う） ──→ テンプレート
```

- **スキーマ (Schema)** = アーティファクトグラフ（何が存在し、どう依存するか）
- **アーティファクト (Artifact)** = 作成するドキュメント
- **テンプレート (Template)** = そのドキュメントの作成ガイド

### スキーマのバリエーション

スキーマは複数の軸で変化します。

| 軸 | 例 |
|-----------|----------|
| 思想 | `spec-driven`, `tdd`, `prototype-first` |
| バージョン | `v1`, `v2`, `v3` |
| 言語 | `en`, `zh`, `es` |
| カスタム | `team-alpha`, `experimental` |

### スキーマ解決（XDG 標準）

スキーマは XDG Base Directory Specification に従い、2 段階で解決します。

```
1. ${XDG_DATA_HOME}/openspec/schemas/<name>/schema.yaml   # ユーザー上書き（グローバル）
2. <package>/schemas/<name>/schema.yaml                    # 内蔵デフォルト
```

**プラットフォーム別パス:**
- Unix/macOS: `~/.local/share/openspec/schemas/`
- Windows: `%LOCALAPPDATA%/openspec/schemas/`
- 全プラットフォーム: `$XDG_DATA_HOME/openspec/schemas/`（設定時）

**なぜ XDG か:**
- スキーマはワークフロー定義（データ）であり、ユーザー設定（config）ではない
- 内蔵はパッケージ内に焼き込み、勝手にコピーしない
- ユーザーはグローバルデータディレクトリにファイルを置いてカスタマイズする
- 現代的な CLI ツールの標準に沿う

### テンプレート継承（最大 2 段階）

テンプレートはスキーマと同じ場所の `templates/` サブディレクトリに配置します。

```
1. ${XDG_DATA_HOME}/openspec/schemas/<schema>/templates/<artifact>.md  # ユーザー上書き
2. <package>/schemas/<schema>/templates/<artifact>.md                   # 内蔵
```

**ルール:**
- ユーザー上書きがパッケージ内蔵より優先
- CLI コマンドは解決したパスを表示（推測しない）
- スキーマ間の継承はしない（必要ならコピー）
- テンプレートは常にスキーマと同じ場所に置く

**これが重要な理由:**
- 「どこから来たのか」問題を回避
- 動く時は動くが壊れる時は壊れる、という暗黙の魔法を排除
- スキーマとテンプレートを 1 つのユニットとして扱える

---

## エグゼクティブサマリー

これは **依存関係を把握するアーティファクトトラッカー**であり、構造化されたアーティファクトパイプラインを通じて反復的な開発をガイドします。コアのイノベーションは **ファイルシステムをデータベースとして使う** ことです。ファイルの存在で完了を検出するため、ステートレスでバージョン管理に向きます。

このシステムが答える問い:
- 「この変更にはどのアーティファクトがあるか？」
- 「次に作れるものは何か？」（「必ず次はこれ」ではない）
- 「X をブロックしているものは何か？」（情報提供であり強制ではない）

---

## コアコンポーネント

### 1. ArtifactGraph（スライス 1 - 完了）

XDG 準拠のスキーマ解決を備えた依存グラフエンジンです。

| 責務 | 方針 |
|----------------|----------|
| アーティファクトを DAG としてモデル化 | `requires: string[]` を持つアーティファクト |
| 完了状態の追跡 | 完了済みを `Set<string>` で保持 |
| ビルド順序の算出 | Kahn のアルゴリズム（トポロジカルソート） |
| 準備できたアーティファクトの検出 | 依存がすべて `completed` にあるか確認 |
| スキーマ解決 | XDG グローバル → パッケージ内蔵 |

**主要データ構造（Zod 検証）:**

```typescript
// Zod スキーマで型とバリデーションを定義
const ArtifactSchema = z.object({
  id: z.string().min(1),
  generates: z.string().min(1),      // 例: "proposal.md" または "specs/*.md"
  description: z.string(),
  template: z.string(),              // テンプレートファイルへのパス
  requires: z.array(z.string()).default([]),
});

const SchemaYamlSchema = z.object({
  name: z.string().min(1),
  version: z.number().int().positive(),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1),
});

// 派生型
type Artifact = z.infer<typeof ArtifactSchema>;
type SchemaYaml = z.infer<typeof SchemaYamlSchema>;
```

**主要メソッド:**
- `resolveSchema(name)` - XDG フォールバックを使ってスキーマを読み込む
- `ArtifactGraph.fromSchema(schema)` - スキーマからグラフを構築
- `detectState(graph, changeDir)` - ファイルシステムを走査して完了を検出
- `getNextArtifacts(graph, completed)` - 作成準備ができたアーティファクトを取得
- `getBuildOrder(graph)` - 全アーティファクトのトポロジカルソート
- `getBlocked(graph, completed)` - 依存が満たされていないアーティファクトを取得

---

### 2. 変更ユーティリティ（スライス 2）

プログラムから変更を作成するためのシンプルなユーティリティ関数群です。クラスや抽象化は持ちません。

| 責務 | 方針 |
|----------------|----------|
| 変更の作成 | `openspec/changes/<name>/` を作成し README を生成 |
| 名前の検証 | kebab-case を強制 |

**主要パス:**

```
openspec/changes/<name>/   → アーティファクトを含む変更インスタンス（プロジェクト単位）
```

**主要関数**（`src/utils/change-utils.ts`）:
- `createChange(projectRoot, name, description?)` - 変更ディレクトリ + README を作成
- `validateChangeName(name)` - kebab-case 検証。`{ valid, error? }` を返す

**注記:** 既存の CLI コマンド（`ListCommand`, `ChangeCommand`）は、一覧表示、パス解決、存在確認をすでに扱っています。ロジックの抽出は不要で、現状のままで十分です。

---

### 3. InstructionLoader（スライス 3）

テンプレート解決と指示の拡張を担当します。

| 責務 | 方針 |
|----------------|----------|
| テンプレート解決 | XDG の 2 段階フォールバック（スキーマ固有 → 共有 → 内蔵） |
| 動的コンテキスト構築 | 依存関係の状態、変更情報を収集 |
| テンプレート拡張 | ベーステンプレートにコンテキストを注入 |
| ステータスレポート生成 | 進捗付き Markdown を生成 |

**主要クラス - ChangeState:**

```
ChangeState {
  changeName: string
  changeDir: string
  graph: ArtifactGraph
  completed: Set<string>

  // メソッド
  getNextSteps(): string[]
  getStatus(artifactId): ArtifactStatus
  isComplete(): boolean
}
```

**主要関数:**
- `getTemplatePath(artifactId, schemaName?)` - 2 段階フォールバックで解決
- `getEnrichedInstructions(artifactId, projectRoot, changeName?)` - メインのエントリポイント
- `getChangeStatus(projectRoot, changeName?)` - 整形されたステータスレポート

---

### 4. CLI（スライス 4）

ユーザー向けインターフェース層です。**すべてのコマンドは決定的**で、明示的な `--change` パラメータが必要です。

| コマンド | 機能 | 状態 |
|---------|----------|--------|
| `status --change <id>` | 変更の進捗表示（アーティファクトグラフ） | **新規** |
| `next --change <id>` | 作成準備が整ったアーティファクトを表示 | **新規** |
| `instructions <artifact> --change <id>` | アーティファクトの指示を取得 | **新規** |
| `list` | 変更一覧 | 既存（`openspec change list`） |
| `new <name>` | 変更作成 | **新規**（`createChange()` を使用） |
| `init` | 初期化 | 既存（`openspec init`） |
| `templates --change <id>` | 解決されたテンプレートパスを表示 | **新規** |

**注記:** 変更を操作するコマンドは `--change` が必須です。省略すると、利用可能な変更一覧を含むエラーを返します。エージェントは会話から変更を推測し、必ず明示的に渡します。

**既存の CLI コマンド**（このスライスの対象外）:
- `openspec change list` / `openspec change show <id>` / `openspec change validate <id>`
- `openspec list --changes` / `openspec list --specs`
- `openspec view`（ダッシュボード）
- `openspec init` / `openspec archive <change>`

---

### 5. Claude コマンド

Claude Code 連携レイヤーです。**運用コマンドのみ**を提供し、アーティファクト作成は自然言語で行います。

| コマンド | 目的 |
|---------|---------|
| `/status` | 変更の進捗を表示 |
| `/next` | 作成準備が整ったものを表示 |
| `/run [artifact]` | 特定のステップを実行（上級者向け） |
| `/list` | 変更一覧 |
| `/new <name>` | 新しい変更を作成 |
| `/init` | 初期化 |

**アーティファクト作成:** ユーザーが「提案を作って」「テストを書いて」のように自然言語で依頼します。エージェントは次を実行します。
1. 会話から変更を推測（不確実なら確認）
2. 依頼からアーティファクトを推測
3. 明示的な `--change` パラメータで CLI を呼ぶ
4. 指示に従ってアーティファクトを作成

この仕組みは、どのスキーマでも、どのアーティファクトでも機能します。スキーマが変わっても新しいスラッシュコマンドは不要です。

**注記:** 後方互換のために、既存の `/openspec-proposal`, `/openspec-apply`, `/openspec-archive` は残りますが、このアーキテクチャとは別物です。

---

## コンポーネント依存関係図

```
┌─────────────────────────────────────────────────────────────┐
│                   プレゼンテーション層                       │
│  ┌──────────────┐                    ┌────────────────────┐ │
│  │     CLI      │ ←─シェル実行───────│ Claude コマンド     │ │
│  └──────┬───────┘                    └────────────────────┘ │
└─────────┼───────────────────────────────────────────────────┘
          │ インポート
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   オーケストレーション層                     │
│  ┌────────────────────┐        ┌──────────────────────────┐ │
│  │ InstructionLoader  │        │ change-utils（スライス 2）│ │
│  │   （スライス 3）    │        │  createChange()          │ │
│  └─────────┬──────────┘        │  validateChangeName()    │ │
│            │                   └──────────────────────────┘ │
└────────────┼────────────────────────────────────────────────┘
             │ 使用
             ▼
┌─────────────────────────────────────────────────────────────┐
│                         コア層                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            ArtifactGraph（スライス 1）               │   │
│  │                                                      │   │
│  │  スキーマ解決（XDG）──→ グラフ ──→ 状態検出          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
             ▲
             │ 参照
             ▼
┌─────────────────────────────────────────────────────────────┐
│                       永続化層                               │
│  ┌──────────────────┐   ┌────────────────────────────────┐  │
│  │  XDG スキーマ     │   │  プロジェクトのアーティファクト │  │
│  │  ~/.local/share/ │   │  openspec/changes/<name>/      │  │
│  │  openspec/       │   │  - proposal.md, design.md      │  │
│  │  schemas/        │   │  - specs/*.md, tasks.md        │  │
│  └──────────────────┘   └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 主要な設計パターン

### 1. ファイルシステムをデータベースとして使う

SQLite も JSON の状態ファイルも使いません。`proposal.md` が存在すれば、提案は完了しています。

```
// 状態検出はファイルの存在確認だけ
if (exists(artifactPath)) {
  completed.add(artifactId)
}
```

### 2. 決定的な CLI と、推論するエージェント

**CLI 層:** 常に決定的で、明示的な `--change` が必要です。

```
openspec status --change add-auth     # 明示指定なら動作する
openspec status                        # エラー: "変更が指定されていません"
```

**エージェント層:** 会話から推測し、不確実なら確認し、明示的な `--change` を渡します。

この分離により:
- CLI は純粋でテスト可能。壊れうる状態を持たない
- エージェントが「賢さ」を担当する
- 「アクティブな変更」を追跡する config.yaml は不要

### 3. XDG 準拠のスキーマ解決

```
${XDG_DATA_HOME}/openspec/schemas/<name>/schema.yaml   # ユーザー上書き
    ↓ (not found)
<package>/schemas/<name>/schema.yaml                    # 内蔵
    ↓ (not found)
Error (schema not found)
```

### 4. 2 段階テンプレートフォールバック

```
${XDG_DATA_HOME}/openspec/schemas/<schema>/templates/<artifact>.md  # ユーザー上書き
    ↓ (not found)
<package>/schemas/<schema>/templates/<artifact>.md                   # 内蔵
    ↓ (not found)
Error (no silent fallback to avoid confusion)
```

### 5. グロブパターンサポート

`specs/*.md` は 1 つのアーティファクトを複数ファイルで満たせます。

```
if (artifact.generates.includes("*")) {
  const parentDir = changeDir / patternParts[0]
  if (exists(parentDir) && hasFiles(parentDir)) {
    completed.add(artifactId)
  }
}
```

### 6. ステートレスな状態検出

すべてのコマンドが毎回ファイルシステムを再スキャンします。壊れうるキャッシュ状態はありません。

---

## アーティファクトパイプライン（デフォルトスキーマ）

デフォルトの `spec-driven` スキーマ:

```
┌──────────┐
│ proposal │  （依存なし）
└────┬─────┘
     │
     ▼
┌──────────┐
│  specs   │  （依存: proposal）
└────┬─────┘
     │
     ├──────────────┐
     ▼              ▼
┌──────────┐   ┌──────────┐
│  design  │   │          │
│          │◄──┤ proposal │
└────┬─────┘   └──────────┘
     │         （依存: proposal, specs）
     ▼
┌──────────┐
│  tasks   │  （依存: design）
└──────────┘
```

TDD や prototype-first などの他スキーマでは、別のグラフになります。

---

## 実装順序

**縦割りスライス**として構成し、それぞれ独立してテスト可能にします。

---

### スライス 1: 「今何ができる？」（コアクエリ）✅ 完了

**提供内容:** 型 + グラフ + 状態検出 + スキーマ解決

**実装:** `src/core/artifact-graph/`
- `types.ts` - Zod スキーマと TypeScript 型
- `schema.ts` - Zod 検証付きの YAML パース
- `graph.ts` - ArtifactGraph クラス（トポロジカルソート）
- `state.ts` - ファイルシステムベースの状態検出
- `resolver.ts` - XDG 準拠のスキーマ解決
- `builtin-schemas.ts` - パッケージ同梱のデフォルトスキーマ

**主要判断:**
- スキーマ検証に Zod を使用（プロジェクトと整合）
- グローバル上書きに XDG を採用
- 完了状態は `Set<string>`（イミュータブルで関数的）
- `inProgress` / `failed` 状態は後回し（外部追跡が必要）

---

### スライス 2: 「変更作成ユーティリティ」

**提供内容:** 変更をプログラムから作成するユーティリティ

**スコープ:**
- `createChange(projectRoot, name, description?)` → ディレクトリ + README を作成
- `validateChangeName(name)` → kebab-case のパターンを強制

**対象外（既存 CLI に存在）:**
- `listChanges()` → `ListCommand` と `ChangeCommand.getActiveChanges()` に存在
- `getChangePath()` → `path.join()` をそのまま使用
- `changeExists()` → `fs.access()` をそのまま使用
- `isInitialized()` → ディレクトリ有無の簡易チェック

**簡素化した理由:** 既存 CLI ロジックをクラス化すると `SpecCommand` も同様のリファクタが必要になります。既存コードは十分に短く動作しているため、真に新しい機能である `createChange()` と名前検証だけを追加します。

---

### スライス 3: 「指示を取得」（拡張）

**提供内容:** テンプレート解決 + コンテキスト注入

**テスト可能な挙動:**
- テンプレートフォールバック: スキーマ固有 → 共有 → 内蔵 → エラー
- コンテキスト注入: 完了依存は ✓、未完了は ✗
- 出力パスが変更ディレクトリに応じて正しく表示される

---

### スライス 4: 「CLI + 統合」

**提供内容:** 新しいアーティファクトグラフコマンド（既存 CLI を拡張）

**新規コマンド:**
- `status --change <id>` - アーティファクト完了状態を表示
- `next --change <id>` - 作成準備が整ったアーティファクトを表示
- `instructions <artifact> --change <id>` - 拡張テンプレートを取得
- `templates --change <id>` - 解決済みパスを表示
- `new <name>` - 変更作成（`createChange()` のラッパ）

**既存（対象外）:**
- `openspec change list/show/validate` - 変更管理
- `openspec list --changes/--specs` - 一覧
- `openspec view` - ダッシュボード
- `openspec init` - 初期化

**テスト可能な挙動:**
- 新規コマンドが期待通りの出力を返す
- コマンドが連携して動く（status → next → instructions の流れ）
- 変更がない、アーティファクトが不正などのエラーハンドリング

---

## ディレクトリ構成

```
# グローバル（XDG パス - ユーザー上書き）
~/.local/share/openspec/           # Unix/macOS（$XDG_DATA_HOME/openspec/）
%LOCALAPPDATA%/openspec/           # Windows
└── schemas/                       # スキーマ上書き
    └── custom-workflow/           # ユーザー定義のスキーマディレクトリ
        ├── schema.yaml            # スキーマ定義
        └── templates/             # 同梱テンプレート
            └── proposal.md

# パッケージ（内蔵デフォルト）
<package>/
└── schemas/                       # 内蔵スキーマ定義
    ├── spec-driven/               # デフォルト: proposal → specs → design → tasks
    │   ├── schema.yaml
    │   └── templates/
    │       ├── proposal.md
    │       ├── design.md
    │       ├── spec.md
    │       └── tasks.md
    └── tdd/                       # TDD: tests → implementation → docs
        ├── schema.yaml
        └── templates/
            ├── test.md
            ├── implementation.md
            ├── spec.md
            └── docs.md

# プロジェクト（変更インスタンス）
openspec/
└── changes/                       # 変更インスタンス
    ├── add-auth/
    │   ├── README.md              # 作成時に自動生成
    │   ├── proposal.md            # 作成されたアーティファクト
    │   ├── design.md
    │   └── specs/
    │       └── *.md
    ├── refactor-db/
    │   └── ...
    └── archive/                   # 完了した変更
        └── 2025-01-01-add-auth/

.claude/
├── settings.local.json            # 権限
└── commands/                      # スラッシュコマンド
    └── *.md
```

---

## スキーマ YAML 形式

```yaml
# 内蔵: <package>/schemas/spec-driven/schema.yaml
# またはユーザー上書き: ~/.local/share/openspec/schemas/spec-driven/schema.yaml
name: spec-driven
version: 1
description: 仕様駆動開発

artifacts:
  - id: proposal
    generates: "proposal.md"
    description: "プロジェクト変更提案ドキュメントを作成"
    template: "proposal.md"          # 同梱テンプレートディレクトリから解決
    requires: []

  - id: specs
    generates: "specs/*.md"          # グロブパターン
    description: "技術仕様ドキュメントを作成"
    template: "specs.md"
    requires:
      - proposal

  - id: design
    generates: "design.md"
    description: "設計ドキュメントを作成"
    template: "design.md"
    requires:
      - proposal
      - specs

  - id: tasks
    generates: "tasks.md"
    description: "タスク分解ドキュメントを作成"
    template: "tasks.md"
    requires:
      - design
```

---

## まとめ

| レイヤー | コンポーネント | 役割 | 状態 |
|-------|-----------|----------------|--------|
| Core | ArtifactGraph | 依存ロジック + XDG スキーマ解決 | ✅ スライス 1 完了 |
| Utils | change-utils | 変更作成 + 名前検証のみ | スライス 2（新機能のみ） |
| Core | InstructionLoader | テンプレート解決 + 拡張 | スライス 3（すべて新規） |
| Presentation | CLI | 新しいアーティファクトグラフコマンド | スライス 4（新規コマンドのみ） |
| Integration | Claude Commands | AI アシスタント連携 | スライス 4 |

**すでに存在するもの（この提案の対象外）:**
- `getActiveChangeIds()` in `src/utils/item-discovery.ts` - 変更一覧
- `ChangeCommand.list/show/validate()` in `src/commands/change.ts`
- `ListCommand.execute()` in `src/core/list.ts`
- `ViewCommand.execute()` in `src/core/view.ts` - ダッシュボード
- `src/core/init.ts` - 初期化
- `src/core/archive.ts` - アーカイブ

**重要な原則:**
- **ファイルシステムがデータベース** — ステートレスでバージョン管理向き
- **依存関係はエネーブラ** — 順序を強制せず、可能性を示す
- **決定的な CLI と推論するエージェント** — CLI は `--change` 必須、エージェントが文脈から推測
- **XDG 準拠のパス** — スキーマとテンプレートは標準のユーザーデータディレクトリに置く
- **2 段階継承** — ユーザー上書き → パッケージ内蔵（それ以上はしない）
- **スキーマはバージョン化** — 思想・バージョン・言語によるバリエーションをサポート
