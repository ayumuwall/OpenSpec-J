# はじめに

このガイドでは、OpenSpec をインストール・初期化した後の使い方を説明します。インストール手順は [README](../README.md#quick-start) を参照してください。

> [!NOTE]
> 会話例・出力例のコードブロックは、CLI/プロンプトの日本語文言が確定するまで英語のまま維持します。日本語化が完了した時点で一括更新してください。
> <!-- OPENSPEC-J:TODO getting-started examples -->

## 仕組み

OpenSpec は、コードを書く前に「何を作るか」を人と AI コーディングアシスタントで合意できるようにします。ワークフローは次の流れです。

```
┌────────────────────┐
│ Start a Change     │  /opsx:new
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Create Artifacts   │  /opsx:ff or /opsx:continue
│ (proposal, specs,  │
│  design, tasks)    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Implement Tasks    │  /opsx:apply
│ (AI writes code)   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Archive & Merge    │  /opsx:archive
│ Specs              │
└────────────────────┘
```

## OpenSpec が作るもの

`openspec init` を実行すると、プロジェクトは次の構造になります。

```
openspec/
├── specs/              # Source of truth (your system's behavior)
│   └── <domain>/
│       └── spec.md
├── changes/            # Proposed updates (one folder per change)
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/      # Delta specs (what's changing)
│           └── <domain>/
│               └── spec.md
└── config.yaml         # Project configuration (optional)
```

**重要な 2 つのディレクトリ:**

- **`specs/`** - ソース・オブ・トゥルース。現在のシステム挙動を示す仕様が入ります。ドメイン単位で整理します（例: `specs/auth/`, `specs/payments/`）。

- **`changes/`** - 変更提案。変更ごとに 1 つのフォルダを持ち、すべてのアーティファクトをまとめます。完了した変更は `specs/` に統合されます。

## アーティファクトの理解

各変更フォルダには、作業を導くアーティファクトが含まれます。

| アーティファクト | 目的 |
|----------|---------|
| `proposal.md` | 「なぜ / 何を」— 目的、スコープ、アプローチを記録 |
| `specs/` | ADDED/MODIFIED/REMOVED の仕様差分 |
| `design.md` | 「どうやって」— 技術的アプローチと設計判断 |
| `tasks.md` | 実装チェックリスト（チェックボックス） |

**アーティファクトは連鎖する:**

```
proposal ──► specs ──► design ──► tasks ──► implement
   ▲           ▲          ▲                    │
   └───────────┴──────────┴────────────────────┘
            update as you learn
```

実装しながら学んだことに応じて、前のアーティファクトを更新して構いません。

## 仕様差分（Delta Specs）の仕組み

仕様差分は OpenSpec の核となる考え方です。現在の仕様に対して「何が変わるか」を明示します。

### 形式

仕様差分はセクションで変更タイプを示します。

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements

### Requirement: Session Timeout
The system SHALL expire sessions after 30 minutes of inactivity.
(Previously: 60 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

### アーカイブ時に起きること

変更をアーカイブすると:

1. **ADDED** の要件は本仕様に追加
2. **MODIFIED** の要件は既存版を置換
3. **REMOVED** の要件は本仕様から削除

変更フォルダは監査用に `openspec/changes/archive/` へ移動します。

## 例: 最初の変更

例として、アプリにダークモードを追加する流れを見てみましょう。

### 1. 変更を開始

```
You: /opsx:new add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     Ready to create: proposal
```

### 2. アーティファクトを作成

`/opsx:ff`（fast-forward）で計画アーティファクトを一括作成します。

```
You: /opsx:ff

AI:  Creating artifacts for add-dark-mode...
     ✓ proposal.md — why we're doing this, what's changing
     ✓ specs/       — requirements and scenarios
     ✓ design.md    — technical approach
     ✓ tasks.md     — implementation checklist
     Ready for implementation!
```

### 3. 何が作られるか

**proposal.md** - 目的を記録:

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage.

## Scope
- Add theme toggle in settings
- Support system preference detection
- Persist preference in localStorage

## Approach
Use CSS custom properties for theming with a React context
for state management.
```

**specs/ui/spec.md** - 新しい要件の差分:

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Theme Selection
The system SHALL allow users to choose between light and dark themes.

#### Scenario: Manual toggle
- GIVEN a user on any page
- WHEN the user clicks the theme toggle
- THEN the theme switches immediately
- AND the preference persists across sessions

#### Scenario: System preference
- GIVEN a user with no saved preference
- WHEN the application loads
- THEN the system's preferred color scheme is used
```

**tasks.md** - 実装チェックリスト:

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
```

### 4. 実装

```
You: /opsx:apply

AI:  Working through tasks...
     ✓ 1.1 Created ThemeContext with light/dark state
     ✓ 1.2 Added CSS custom properties to globals.css
     ✓ 1.3 Implemented localStorage persistence
     ✓ 2.1 Created ThemeToggle component
     ...
     All tasks complete!
```

実装中に設計の調整が必要になった場合は、アーティファクトを更新して続ければ OK です。

### 5. アーカイブ

```
You: /opsx:archive

AI:  Archiving add-dark-mode...
     ✓ Merged specs into openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/
     Done! Ready for the next feature.
```

これで仕様差分が本仕様に統合され、システムの挙動が記録されます。

## 検証とレビュー

CLI で変更状況を確認できます。

```bash
# List active changes
openspec list

# View change details
openspec show add-dark-mode

# Validate spec formatting
openspec validate add-dark-mode

# Interactive dashboard
openspec view
```

## 次に読むもの

- [Workflows](workflows.md) - 代表的なフローと使い分け
- [Commands](commands.md) - スラッシュコマンドの全リファレンス
- [Concepts](concepts.md) - 仕様・変更・スキーマの理解
- [Customization](customization.md) - 自分のワークフローに合わせる
