# コンセプト

このガイドでは、OpenSpec の中核概念と、それらがどう組み合わさるかを説明します。実践的な使い方は [はじめに](getting-started.md) と [ワークフロー](workflows.md) を参照してください。

## 哲学

OpenSpec は次の 4 つの原則に基づいています。

```
柔軟であること      — フェーズゲートなしで、意味のある作業を進める
反復できること      — 作りながら学び、進めながら改善する
簡単であること      — 軽量セットアップ、最小限の手順
既存コード優先      — 新規だけでなく、既存コードベースで機能する
```

### なぜこの原則が重要か

**柔軟であること。** 従来の仕様システムは「計画→実装→完了」のフェーズに固定されがちです。OpenSpec は柔軟で、作業に合う順番でアーティファクトを作れます。

**反復できること。** 要件は変わります。理解も深まります。最初は良さそうに見えたアプローチが、コードベースを見たら通用しないこともあります。OpenSpec はそれを前提にします。

**簡単であること。** 仕様フレームワークの中には、セットアップが重く、形式が厳格で、運用が硬いものもあります。OpenSpec は邪魔をしません。数秒で初期化し、すぐ作業を始められ、必要なら後からカスタマイズできます。

**既存コード優先。** 多くの開発はゼロから作るのではなく既存システムの改修です。OpenSpec の差分方式は、既存挙動の変更を簡潔に表現できます。

## 全体像

OpenSpec は作業を 2 つの主要領域に分けて整理します。

```
┌────────────────────────────────────────────────────────────────────┐
│                        openspec/                                   │
│                                                                    │
│   ┌─────────────────────┐      ┌───────────────────────────────┐   │
│   │       specs/        │      │         changes/              │   │
│   │                     │      │                               │   │
│   │  ソース・オブ・     │◄─────│  変更提案                     │   │
│   │  トゥルース         │ merge│  変更ごとに 1 フォルダ        │   │
│   │  現在のシステム挙動 │      │  アーティファクト + 差分      │   │
│   │                     │      │                               │   │
│   └─────────────────────┘      └───────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Specs** は現在の挙動を示す、信頼できる基準です。

**Changes** は提案中の変更で、統合されるまでは別フォルダに置かれます。

この分離が重要です。複数の変更を並行で進められ、レビューしてから本仕様へ反映できます。アーカイブ時に差分が信頼できる基準へ統合されます。

## Specs

Specs describe your system's behavior using structured requirements and scenarios.

### Structure

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

Organize specs by domain — logical groupings that make sense for your system. Common patterns:

- **By feature area**: `auth/`, `payments/`, `search/`
- **By component**: `api/`, `frontend/`, `workers/`
- **By bounded context**: `ordering/`, `fulfillment/`, `inventory/`

### Spec Format

A spec contains requirements, and each requirement has scenarios:

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

### Requirement: セッション期限
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: アイドルタイムアウト
- GIVEN 認証済みセッション
- WHEN 30 minutes pass without activity
- THEN セッションは無効化される
- AND the user must re-authenticate
```

**Key elements:**

| Element | Purpose |
|---------|---------|
| `## Purpose` | High-level description of this spec's domain |
| `### Requirement:` | A specific behavior the system must have |
| `#### Scenario:` | A concrete example of the requirement in action |
| SHALL/MUST/SHOULD | RFC 2119 keywords indicating requirement strength |

### Why Structure Specs This Way

**Requirements are the "what"** — they state what the system should do without specifying implementation.

**Scenarios are the "when"** — they provide concrete examples that can be verified. Good scenarios:
- Are testable (you could write an automated test for them)
- Cover both happy path and edge cases
- Use Given/When/Then or similar structured format

**RFC 2119 keywords** (SHALL, MUST, SHOULD, MAY) communicate intent:
- **MUST/SHALL** — absolute requirement
- **SHOULD** — recommended, but exceptions exist
- **MAY** — optional

### What a Spec Is (and Is Not)

A spec is a **behavior contract**, not an implementation plan.

Good spec content:
- Observable behavior users or downstream systems rely on
- Inputs, outputs, and error conditions
- External constraints (security, privacy, reliability, compatibility)
- Scenarios that can be tested or explicitly validated

Avoid in specs:
- Internal class/function names
- Library or framework choices
- Step-by-step implementation details
- Detailed execution plans (those belong in `design.md` or `tasks.md`)

Quick test:
- If implementation can change without changing externally visible behavior, it likely does not belong in the spec.

### Keep It Lightweight: Progressive Rigor

OpenSpec aims to avoid bureaucracy. Use the lightest level that still makes the change verifiable.

**Lite spec (default):**
- Short behavior-first requirements
- Clear scope and non-goals
- A few concrete acceptance checks

**Full spec (for higher risk):**
- Cross-team or cross-repo changes
- API/contract changes, migrations, security/privacy concerns
- Changes where ambiguity is likely to cause expensive rework

Most changes should stay in Lite mode.

### Human + Agent Collaboration

In many teams, humans explore and agents draft artifacts. The intended loop is:

1. Human provides intent, context, and constraints.
2. Agent converts this into behavior-first requirements and scenarios.
3. Agent keeps implementation detail in `design.md` and `tasks.md`, not `spec.md`.
4. Validation confirms structure and clarity before implementation.

This keeps specs readable for humans and consistent for agents.

## Changes

A change is a proposed modification to your system, packaged as a folder with everything needed to understand and implement it.

### Change Structure

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

Each change is self-contained. It has:
- **Artifacts** — documents that capture intent, design, and tasks
- **Delta specs** — specifications for what's being added, modified, or removed
- **Metadata** — optional configuration for this specific change

### Why Changes Are Folders

Packaging a change as a folder has several benefits:

1. **Everything together.** Proposal, design, tasks, and specs live in one place. No hunting through different locations.

2. **Parallel work.** Multiple changes can exist simultaneously without conflicting. Work on `add-dark-mode` while `fix-auth-bug` is also in progress.

3. **Clean history.** When archived, changes move to `changes/archive/` with their full context preserved. You can look back and understand not just what changed, but why.

4. **Review-friendly.** A change folder is easy to review — open it, read the proposal, check the design, see the spec deltas.

## Artifacts

Artifacts are the documents within a change that guide the work.

### The Artifact Flow

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
# 提案: ダークモードの追加

## 目的
夜間使用時の目の疲れを軽減し、システム設定に合わせるため、
ダークモードオプションが求められています。

## スコープ
対象:
- 設定にテーマ切り替えを追加
- システム設定の検出
- localStorage に設定を保存

対象外:
- カスタムカラーテーマ（将来対応）
- ページ単位のテーマ上書き

## アプローチ
CSS カスタムプロパティでテーマを管理し、React Context で
状態を管理します。初回読み込み時にシステム設定を検出し、
手動での上書きを可能にします。
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
# 設計: ダークモードの追加

## 技術的アプローチ
props のバケツリレーを避けるため、React Context でテーマ状態を管理します。
CSS カスタムプロパティにより、クラス切り替えなしで実行時に切り替え可能です。

## アーキテクチャ判断

### 判断: Redux より Context
テーマ状態に React Context を使う理由:
- シンプルな二値状態（ライト/ダーク）
- 複雑な状態遷移がない
- Redux 依存を追加しなくて済む

### 判断: CSS カスタムプロパティ
CSS-in-JS より CSS 変数を使う理由:
- 既存スタイルシートと共存できる
- ランタイムオーバーヘッドなし
- ブラウザネイティブのソリューション

## データフロー
```
ThemeProvider (context)
       │
       ▼
ThemeToggle ◄──► localStorage
       │
       ▼
CSS Variables (:root に適用)
```

## ファイル変更
- `src/contexts/ThemeContext.tsx`（新規）
- `src/components/ThemeToggle.tsx`（新規）
- `src/styles/globals.css`（変更）
````

**Design を更新するタイミング:**
- 実装してみたらアプローチが成り立たない
- より良い解が見つかった
- 依存関係や制約が変わった

#### Tasks（`tasks.md`）

Tasks は **実装チェックリスト** です。具体的な手順をチェックボックスで管理します。

```markdown
# タスク

## 1. テーマ基盤
- [ ] 1.1 light/dark 状態を持つ ThemeContext を作成
- [ ] 1.2 色用の CSS カスタムプロパティを追加
- [ ] 1.3 localStorage への保存を実装
- [ ] 1.4 システム設定の検出を追加

## 2. UI コンポーネント
- [ ] 2.1 ThemeToggle コンポーネントを作成
- [ ] 2.2 設定ページに切り替えを追加
- [ ] 2.3 ヘッダーにクイック切り替えを追加

## 3. スタイリング
- [ ] 3.1 ダークテーマのカラーパレットを定義
- [ ] 3.2 コンポーネントを CSS 変数に対応させる
- [ ] 3.3 アクセシビリティのコントラスト比をテスト
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
# Auth の仕様差分

## ADDED Requirements

### Requirement: 二要素認証
システムは TOTP ベースの二要素認証をサポートしなければならない。(MUST)

#### Scenario: 2FA 登録
- GIVEN 2FA が未有効のユーザー
- WHEN 設定で 2FA を有効にしたとき
- THEN 認証アプリ設定用の QR コードが表示される
- AND 有効化前にコードで確認が必要になる

#### Scenario: 2FA ログイン
- GIVEN 2FA が有効のユーザー
- WHEN 有効な認証情報を送信したとき
- THEN OTP チャレンジが表示される
- AND 有効な OTP の後にログインが完了する

## MODIFIED Requirements

### Requirement: セッション期限
システムは 15 分間操作がない場合にセッションを期限切れにしなければならない。(MUST)
（以前: 30 分）

#### Scenario: アイドルタイムアウト
- GIVEN 認証済みセッション
- WHEN 15 分間操作がない
- THEN セッションは無効化される

## REMOVED Requirements

### Requirement: ログイン状態を保持
（2FA 導入に伴い廃止。ユーザーは毎セッション再認証が必要。）
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
    requires: []              # 依存なし、最初に作成可能

  - id: specs
    generates: specs/**/*.md
    requires: [proposal]      # proposal が先に必要

  - id: design
    generates: design.md
    requires: [proposal]      # specs と並行で作成可能

  - id: tasks
    generates: tasks.md
    requires: [specs, design] # specs と design の両方が先に必要
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
# ゼロから作成
openspec schema init research-first

# 既存をフォーク
openspec schema fork spec-driven research-first
```

**カスタムスキーマ例:**

```yaml
# openspec/schemas/research-first/schema.yaml
name: research-first
artifacts:
  - id: research
    generates: research.md
    requires: []           # まず調査

  - id: proposal
    generates: proposal.md
    requires: [research]   # 調査結果を踏まえた提案

  - id: tasks
    generates: tasks.md
    requires: [proposal]   # specs/design をスキップしてタスクへ
```

カスタムスキーマの詳細は [カスタマイズ](customization.md) を参照してください。

## アーカイブ

アーカイブは、差分仕様を本仕様に統合し、変更を履歴として保存する工程です。

### アーカイブ時に起きること

```
アーカイブ前:

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


アーカイブ後:

openspec/
├── specs/
│   └── auth/
│       └── spec.md        # 2FA 要件が含まれる
└── changes/
    └── archive/
        └── 2025-01-24-add-2fa/    # 履歴として保存
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
┌──────────────────────────────────────────────────────────────────────────────┐
│                              OPENSPEC フロー                                 │
│                                                                              │
│   ┌────────────────┐                                                         │
│   │  1. 変更を     │  /opsx:propose（core）または /opsx:new（expanded）     │
│   │     開始       │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  2. アーティ   │  /opsx:ff または /opsx:continue（拡張ワークフロー）    │
│   │     ファクトを │  proposal → specs → design → tasks を作成              │
│   │     作成       │  （スキーマの依存関係に基づく）                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  3. タスクを   │  /opsx:apply                                            │
│   │     実装       │  タスクを進め、完了したらチェック                       │
│   │                │◄──── 学びに応じてアーティファクトを更新                 │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  4. 検証       │  /opsx:verify（任意）                                   │
│   │                │  実装が仕様と一致するか確認                             │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐     ┌──────────────────────────────────────────────┐    │
│   │  5. 変更を     │────►│  差分仕様が本仕様にマージされる               │    │
│   │     アーカイブ │     │  変更フォルダは archive/ に移動               │    │
│   └────────────────┘     │  更新後の仕様が信頼できる基準になる         │    │
│                          └──────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
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
| **アーティファクト** | 変更内の文書（proposal / design / tasks / 仕様差分） |
| **アーカイブ** | 変更を完了し差分を本仕様に統合する工程 |
| **変更** | アーティファクト一式を含む変更フォルダ |
| **仕様差分** | 現行仕様に対する差分仕様（ADDED / MODIFIED / REMOVED） |
| **ドメイン** | 仕様を分ける論理単位（例: `auth/`, `payments/`） |
| **要件** | システムが満たすべき具体的挙動 |
| **シナリオ** | 要件の具体例（Given / When / Then 形式など） |
| **スキーマ** | アーティファクト種類と依存関係の定義 |
| **仕様** | 要件とシナリオを含む仕様 |
| **信頼できる基準** | 現行の合意済み挙動を表す `openspec/specs/` |

## 次に読むもの

- [はじめに](getting-started.md) - 最初の流れ
- [ワークフロー](workflows.md) - 代表的なパターン
- [コマンド](commands.md) - コマンド一覧
- [カスタマイズ](customization.md) - カスタムスキーマと設定
