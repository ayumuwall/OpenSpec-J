# コンセプト

このガイドでは、OpenSpec の中核概念と、それらがどう組み合わさるかを説明します。実践的な使い方は [Getting Started](getting-started.md) と [Workflows](workflows.md) を参照してください。

> [!NOTE]
> 例示コードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO concepts examples -->

## 哲学

OpenSpec は次の 4 つの原則に基づいています。

```
fluid not rigid       — no phase gates, work on what makes sense
iterative not waterfall — learn as you build, refine as you go
easy not complex      — lightweight setup, minimal ceremony
brownfield-first      — works with existing codebases, not just greenfield
```

### なぜこの原則が重要か

**fluid not rigid.** 従来の仕様システムは「計画→実装→完了」のフェーズに固定されがちです。OpenSpec は柔軟で、作業に合う順番でアーティファクトを作れます。

**iterative not waterfall.** 要件は変わります。理解も深まります。最初は良さそうに見えたアプローチが、コードベースを見たら通用しないこともあります。OpenSpec はそれを前提にします。

**easy not complex.** 仕様フレームワークの中には、セットアップが重く、形式が厳格で、運用が硬いものもあります。OpenSpec は邪魔をしません。数秒で初期化し、すぐ作業を始められ、必要なら後からカスタマイズできます。

**brownfield-first.** 多くの開発はゼロから作るのではなく既存システムの改修です。OpenSpec の差分方式は、既存挙動の変更を簡潔に表現できます。

## 全体像

OpenSpec は作業を 2 つの主要領域に分けて整理します。

```
┌─────────────────────────────────────────────────────────────────┐
│                        openspec/                                 │
│                                                                  │
│   ┌─────────────────────┐      ┌──────────────────────────────┐ │
│   │       specs/        │      │         changes/              │ │
│   │                     │      │                               │ │
│   │  Source of truth    │◄─────│  Proposed modifications       │ │
│   │  How your system    │ merge│  Each change = one folder     │ │
│   │  currently works    │      │  Contains artifacts + deltas  │ │
│   │                     │      │                               │ │
│   └─────────────────────┘      └──────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Specs** はソース・オブ・トゥルース（現在の挙動）を示します。

**Changes** は提案中の変更で、統合されるまでは別フォルダに置かれます。

この分離が重要です。複数の変更を並行で進められ、レビューしてから本仕様へ反映できます。アーカイブ時に差分がソース・オブ・トゥルースへ統合されます。

## 仕様（Specs）

仕様は、構造化された要件とシナリオでシステムの挙動を表します。

### 構成

```
openspec/specs/
├── auth/
│   └── spec.md           # Authentication behavior
├── payments/
│   └── spec.md           # Payment processing
├── notifications/
│   └── spec.md           # Notification system
└── ui/
    └── spec.md           # UI behavior and themes
```

仕様はドメイン単位で整理します。よくあるパターン:

- **機能単位**: `auth/`, `payments/`, `search/`
- **コンポーネント単位**: `api/`, `frontend/`, `workers/`
- **境界づけられたコンテキスト単位**: `ordering/`, `fulfillment/`, `inventory/`

### 仕様フォーマット

仕様は要件で構成され、各要件にはシナリオがあります。

```markdown
# Auth Specification

## Purpose
Authentication and session management for the application.

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT token upon successful login.

#### Scenario: Valid credentials
- GIVEN a user with valid credentials
- WHEN the user submits login form
- THEN a JWT token is returned
- AND the user is redirected to dashboard

#### Scenario: Invalid credentials
- GIVEN invalid credentials
- WHEN the user submits login form
- THEN an error message is displayed
- AND no token is issued

### Requirement: Session Expiration
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated
- AND the user must re-authenticate
```

**主要要素:**

| 要素 | 目的 |
|---------|---------|
| `## Purpose` | 仕様が扱うドメインの概要 |
| `### Requirement:` | システムが満たすべき具体的挙動 |
| `#### Scenario:` | 要件が実際に発生する具体例 |
| SHALL/MUST/SHOULD | RFC 2119 による強さの表現 |

### この構造を採用する理由

**要件は「何を」** — 実装の詳細ではなく、必要な挙動を定義します。

**シナリオは「いつ」** — 具体例として検証可能にします。良いシナリオは次の特徴があります。
- テスト可能（自動テストに落とせる）
- ハッピーパスとエッジケースの両方を含む
- Given/When/Then などの構造化形式を使う

**RFC 2119 キーワード**（SHALL, MUST, SHOULD, MAY）は意図の強さを表します。
- **MUST/SHALL** — 絶対要件
- **SHOULD** — 推奨（例外あり）
- **MAY** — 任意

## 変更（Changes）

変更は、システムへの修正をまとめたフォルダです。理解・実装に必要なものをすべて含みます。

### 変更の構造

```
openspec/changes/add-dark-mode/
├── proposal.md           # Why and what
├── design.md             # How (technical approach)
├── tasks.md              # Implementation checklist
├── .openspec.yaml        # Change metadata (optional)
└── specs/                # Delta specs
    └── ui/
        └── spec.md       # What's changing in ui/spec.md
```

各変更は自己完結します。
- **アーティファクト** — 目的・設計・タスクを記録する文書
- **仕様差分** — 追加/変更/削除される内容
- **メタデータ** — 変更固有の設定（任意）

### 変更をフォルダにする理由

変更をフォルダで管理する利点:

1. **一箇所にまとまる。** proposal/design/tasks/specs が同じ場所で見える。
2. **並行作業。** `add-dark-mode` と `fix-auth-bug` を同時に進めても衝突しない。
3. **履歴が明瞭。** アーカイブで `changes/archive/` に移動し、背景を含めて保存される。
4. **レビューしやすい。** フォルダを開けば内容がまとまっている。

## アーティファクト

アーティファクトは変更内の文書で、作業の道筋を示します。

### アーティファクトの流れ

```
proposal ──────► specs ──────► design ──────► tasks ──────► implement
    │               │             │              │
   why            what           how          steps
 + scope        changes       approach      to take
```

アーティファクトは順に積み上がります。前の内容が次の文脈になります。

### アーティファクトの種類

#### Proposal（`proposal.md`）

Proposal は **意図**・**スコープ**・**アプローチ** を高レベルで記録します。

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage and match system preferences.

## Scope
In scope:
- Theme toggle in settings
- System preference detection
- Persist preference in localStorage

Out of scope:
- Custom color themes (future work)
- Per-page theme overrides

## Approach
Use CSS custom properties for theming with a React context
for state management. Detect system preference on first load,
allow manual override.
```

**Proposal を更新するタイミング:**
- スコープが変わった（拡大/縮小）
- 意図が明確化した（問題理解が深まった）
- アプローチが根本的に変わった

#### Specs（`specs/` 内の差分仕様）

差分仕様は **現在の仕様に対して何が変わるか** を表します。詳しくは [Delta Specs](#delta-specs) を参照してください。

#### Design（`design.md`）

Design は **技術的アプローチ** と **設計判断** を記録します。

```markdown
# Design: Add Dark Mode

## Technical Approach
Theme state managed via React Context to avoid prop drilling.
CSS custom properties enable runtime switching without class toggling.

## Architecture Decisions

### Decision: Context over Redux
Using React Context for theme state because:
- Simple binary state (light/dark)
- No complex state transitions
- Avoids adding Redux dependency

### Decision: CSS Custom Properties
Using CSS variables instead of CSS-in-JS because:
- Works with existing stylesheet
- No runtime overhead
- Browser-native solution

## Data Flow
```
ThemeProvider (context)
       │
       ▼
ThemeToggle ◄──► localStorage
       │
       ▼
CSS Variables (applied to :root)
```

## File Changes
- `src/contexts/ThemeContext.tsx` (new)
- `src/components/ThemeToggle.tsx` (new)
- `src/styles/globals.css` (modified)
```

**Design を更新するタイミング:**
- 実装してみたらアプローチが成り立たない
- より良い解が見つかった
- 依存関係や制約が変わった

#### Tasks（`tasks.md`）

Tasks は **実装チェックリスト** です。具体的な手順をチェックボックスで管理します。

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence
- [ ] 1.4 Add system preference detection

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
- [ ] 3.3 Test contrast ratios for accessibility
```

**Tasks のベストプラクティス:**
- まとまりごとに見出しで分ける
- 階層番号（1.1, 1.2 など）を使う
- 1 セッションで終わる粒度にする
- 完了したらチェックを付ける

## Delta Specs

差分仕様は、OpenSpec がブラウンフィールド開発で機能するための中核概念です。**何が変わるか** を表し、全文の再掲を避けます。

### 形式

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.

#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed for authenticator app setup
- AND the user must verify with a code before activation

#### Scenario: 2FA login
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented
- AND login completes only after valid OTP

## MODIFIED Requirements

### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 15 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA. Users should re-authenticate each session.)
```

### Delta セクション

| セクション | 意味 | アーカイブ時の挙動 |
|---------|---------|------------------------|
| `## ADDED Requirements` | 新しい挙動 | 本仕様に追加 |
| `## MODIFIED Requirements` | 既存挙動の変更 | 既存要件を置換 |
| `## REMOVED Requirements` | 廃止された挙動 | 本仕様から削除 |

### なぜ全文ではなく差分なのか

**明確さ。** 差分なら「何が変わるか」が一目で分かります。

**衝突回避。** 2 つの変更が同じ spec ファイルに触れても、別要件を変更する限り競合しにくい。

**レビュー効率。** 変更点だけが表示されるため、本質に集中できる。

**ブラウンフィールド適性。** 既存挙動の変更が中心なので、差分が第一級の扱いになる。

## スキーマ

スキーマは、ワークフローに含まれるアーティファクトと依存関係を定義します。

### スキーマの仕組み

```yaml
# openspec/schemas/spec-driven/schema.yaml
name: spec-driven
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []              # No dependencies, can create first

  - id: specs
    generates: specs/**/*.md
    requires: [proposal]      # Needs proposal before creating

  - id: design
    generates: design.md
    requires: [proposal]      # Can create in parallel with specs

  - id: tasks
    generates: tasks.md
    requires: [specs, design] # Needs both specs and design first
```

**アーティファクトは依存グラフを形成します:**

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

**依存関係はゲートではなく進行可能性です。** 何が作れるかを示すだけで、順番を強制しません。設計が不要なら design をスキップできます。specs と design は proposal のみ依存なので、どちらからでも作れます。

### 組み込みスキーマ

**spec-driven**（デフォルト）

仕様駆動開発の標準ワークフロー:

```
proposal → specs → design → tasks → implement
```

向いている場面: 実装前に仕様合意が必要な多くの機能開発。

### カスタムスキーマ

チームに合わせて独自スキーマを作れます。

```bash
# Create from scratch
openspec schema init research-first

# Or fork an existing one
openspec schema fork spec-driven research-first
```

**カスタムスキーマ例:**

```yaml
# openspec/schemas/research-first/schema.yaml
name: research-first
artifacts:
  - id: research
    generates: research.md
    requires: []           # Do research first

  - id: proposal
    generates: proposal.md
    requires: [research]   # Proposal informed by research

  - id: tasks
    generates: tasks.md
    requires: [proposal]   # Skip specs/design, go straight to tasks
```

カスタムスキーマの詳細は [Customization](customization.md) を参照してください。

## アーカイブ

アーカイブは、差分仕様を本仕様に統合し、変更を履歴として保存する工程です。

### アーカイブ時に起きること

```
Before archive:

openspec/
├── specs/
│   └── auth/
│       └── spec.md ◄────────────────┐
└── changes/                         │
    └── add-2fa/                     │
        ├── proposal.md              │
        ├── design.md                │ merge
        ├── tasks.md                 │
        └── specs/                   │
            └── auth/                │
                └── spec.md ─────────┘


After archive:

openspec/
├── specs/
│   └── auth/
│       └── spec.md        # Now includes 2FA requirements
└── changes/
    └── archive/
        └── 2025-01-24-add-2fa/    # Preserved for history
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── specs/
                └── auth/
                    └── spec.md
```

### アーカイブの流れ

1. **差分を統合。** ADDED/MODIFIED/REMOVED の各セクションを対応する本仕様に適用します。

2. **アーカイブへ移動。** 変更フォルダを `changes/archive/` に日付プレフィックス付きで移動します。

3. **文脈を保存。** すべてのアーティファクトがアーカイブに残るため、後から理由や設計を参照できます。

### アーカイブの意義

**クリーンな状態。** `changes/` には進行中のみが残り、完了した変更は移動します。

**監査証跡。** 何が変わったかだけでなく、なぜ・どうやって・どんなタスクだったかまで保存されます。

**仕様の進化。** 変更のアーカイブごとに仕様が成長し、時間とともに包括的な仕様が蓄積されます。

## 全体のつながり

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OPENSPEC FLOW                                   │
│                                                                              │
│   ┌────────────────┐                                                         │
│   │  1. START      │  /opsx:new creates a change folder                      │
│   │     CHANGE     │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  2. CREATE     │  /opsx:ff or /opsx:continue                             │
│   │     ARTIFACTS  │  Creates proposal → specs → design → tasks              │
│   │                │  (based on schema dependencies)                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  3. IMPLEMENT  │  /opsx:apply                                            │
│   │     TASKS      │  Work through tasks, checking them off                  │
│   │                │◄──── Update artifacts as you learn                      │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  4. VERIFY     │  /opsx:verify (optional)                                │
│   │     WORK       │  Check implementation matches specs                     │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐     ┌──────────────────────────────────────────────┐   │
│   │  5. ARCHIVE    │────►│  Delta specs merge into main specs           │   │
│   │     CHANGE     │     │  Change folder moves to archive/             │   │
│   └────────────────┘     │  Specs are now the updated source of truth   │   │
│                          └──────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**良循環:**

1. 仕様が現在の挙動を記述
2. 変更が差分として修正案を提示
3. 実装が変更を現実にする
4. アーカイブが差分を仕様に統合
5. 更新後の仕様が新しい挙動を記述
6. 次の変更は新しい仕様を基点に進む

## 用語集

| 用語 | 定義 |
|------|------------|
| **Artifact** | 変更内の文書（proposal/design/tasks/delta specs） |
| **Archive** | 変更を完了し差分を本仕様に統合する工程 |
| **Change** | アーティファクト一式を含む変更フォルダ |
| **Delta spec** | 現行仕様に対する差分仕様（ADDED/MODIFIED/REMOVED） |
| **Domain** | 仕様を分ける論理単位（例: `auth/`, `payments/`） |
| **Requirement** | システムが満たすべき具体的挙動 |
| **Scenario** | 要件の具体例（Given/When/Then 形式など） |
| **Schema** | アーティファクト種類と依存関係の定義 |
| **Spec** | 要件とシナリオを含む仕様 |
| **Source of truth** | 現行の合意済み挙動を表す `openspec/specs/` |

## 次に読むもの

- [Getting Started](getting-started.md) - 最初の流れ
- [Workflows](workflows.md) - 代表的なパターン
- [Commands](commands.md) - コマンド一覧
- [Customization](customization.md) - カスタムスキーマと設定
