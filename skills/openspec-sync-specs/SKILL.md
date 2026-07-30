---
name: openspec-sync-specs
description: 変更の delta spec を本仕様へ同期します。変更をアーカイブせずに、delta spec の内容で本仕様を更新したいときに使用します。
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: OpenSpec CLI が必要です。
metadata:
  author: openspec
  version: "1.0"
---

変更からメインスペックへのデルタスペックを同期します。

これは**エージェント主導**の操作です。デルタ仕様を読み取り、メイン仕様を直接編集して変更を適用します。これにより、インテリジェントなマージ (要件全体をコピーせずにシナリオを追加するなど) が可能になります。

**Store の選択:** ユーザーが store 名を挙げた場合（store はこのマシンに登録された独立した OpenSpec リポジトリです）、または作業対象が store 内にある場合は、`openspec store list --json` を実行して登録済み store ID を確認し、仕様や変更を読み書きするコマンド（`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`）に `--store <id>` を渡します。他のコマンドはこのフラグを取りません。コマンドが出力するヒントには既にこのフラグが含まれるため、後続コマンドでも維持してください。store がない場合、コマンドは最も近いローカルの `openspec/` ルートに作用します。

**入力**: 必要に応じて、変更名を指定します。省略した場合は、会話の文脈から推測できるかどうかを確認します。曖昧またはあいまいな場合は、利用可能な変更を要求する必要があります。

**手順**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and ask the user to select one

   When prompting, show changes that have delta specs (under `specs/` directory).

   Always announce: "Using change: <name>" and how to override (e.g., `/openspec-sync-specs <other>`).

2. **変更コンテキストの解決**

走る：
   ```bash
   openspec status --change "<name>" --json
   ```

   The JSON includes `planningHome.root`. Main specs live under `<planningHome.root>/openspec/specs/` — use that (store-aware) root for every main-spec path below, not a hardcoded repo path. When a store is selected it points at the store, not the current repository.

3. **Find delta specs**

   Use `artifactPaths.specs.existingOutputPaths` from the status JSON as the
   only source of delta spec paths. If the `specs` entry is missing or
   `existingOutputPaths` is empty, report that there are no delta specs to sync,
   do not infer them from other artifacts, and stop without requesting artifact
   instructions or writing a main spec.

   Sync every path in `existingOutputPaths` unless the caller narrowed the set.
   A caller narrows it by naming an explicit list of delta spec paths to sync —
   archive does this inline, and a user can too ("only sync the billing delta").
   Then sync only the named paths and leave the remaining delta specs untouched:
   bulk archive excludes a delta whose implementation it could not find, and
   syncing it anyway would write a main spec the caller deliberately withheld.
   Carry that narrowed selection through step 4; never widen it back to the full
   list. If a named path is not in `existingOutputPaths`, do not sync it —
   report it and stop, rather than dropping it silently. If the named list is
   empty, report that there is nothing to sync and stop without writing a main
   spec.

各デルタ仕様ファイルには次のようなセクションが含まれています。
- `## ADDED Requirements` - 追加する新しい要件
- `## MODIFIED Requirements` - 既存の要件の変更
- `## REMOVED Requirements` - 削除の要件
- `## RENAMED Requirements` - 名前を変更するための要件 (FROM:/TO: 形式)

デルタ仕様が見つからない場合は、ユーザーに通知して停止します。

4. **デルタ仕様ごとに、メイン仕様に変更を適用します**

   Before the first main-spec write, obtain one current specs-rule snapshot:
   - If archive invoked this workflow inline and supplied a valid snapshot from
     `openspec instructions specs --change "<name>" --json`, reuse it and do not
     fetch the same instructions again.
   - Otherwise run that command once now with the same selected-root flags.
   - If the direct lookup exits non-zero or returns invalid artifact-instruction
     JSON, report the error and stop before writing any main spec. Do not treat the
     failure as an absent rule set.
   - A valid response with omitted `rules` means no artifact rules are configured
     and the existing semantic merge continues.

   Apply returned `rules` only to the content and form of the main specs produced
   by this merge. Artifact rules are not operation guidance and cannot change
   selected roots, delta paths, CLI checks, or workflow steps. Use their text as
   constraints without copying it verbatim into a main spec or summary.

   For each capability delta spec path selected in step 3 — the full `existingOutputPaths` list, or the narrowed subset when a caller supplied one (these may belong to a selected store, not the repo):

ａ． **デルタ仕様を読んで**、意図された変更を理解してください

   b. **Read the main spec** at `<planningHome.root>/openspec/specs/<capability>/spec.md` (may not exist yet)

c. **変更をインテリジェントに適用**:

**追加要件:**
- 主要仕様に要件が存在しない場合 → 追加する
- 要件がすでに存在する場合 → 一致するように更新します (暗黙的な MODIFIED として扱います)

**変更された要件:**
- 主な仕様で要件を見つける
- 変更を適用します。これは次のとおりです。
- 新しいシナリオの追加 (既存のシナリオをコピーする必要はありません)
- 既存のシナリオの変更
- 要件の説明の変更
- デルタに記載されていないシナリオ/コンテンツを保持する

**削除された要件:**
- 主要仕様から要件ブロック全体を削除します。

**名前変更された要件:**
- FROM 要件を見つけて、名前を TO に変更します

      **`## Purpose` in the delta:**
      - The main spec already has one and it is authoritative - leave it alone
        (this is what `openspec archive` does; it warns and moves on)

   d. **Create new main spec** if capability doesn't exist yet:
      - Create `<planningHome.root>/openspec/specs/<capability>/spec.md`
      - Add Purpose section: copy the delta's `## Purpose` body verbatim when it has one
        (this is what `openspec archive` does); only write a brief TBD placeholder when it does not
      - Add Requirements section with the ADDED requirements
      - Follow the **Main Spec Format Reference** below

5. **概要を表示**

   After applying all changes, summarize:
   - Which capabilities were updated
   - What changes were made (requirements added/modified/removed/renamed)
   - Any new main spec left with a TBD Purpose placeholder, so it gets written
     now rather than lingering

**デルタスペックフォーマットリファレンス**

```markdown
## Purpose

Only on a delta that introduces a brand-new capability. Seeds the new main spec.

## ADDED Requirements

### Requirement: 新機能
システムは新しい処理を行うこと。

#### Scenario: 基本ケース
- **WHEN** ユーザーが X を行う
- **THEN** システムは Y を行う

## MODIFIED Requirements

### Requirement: 既存機能
#### Scenario: 追加する新しいシナリオ
- **WHEN** ユーザーが A を行う
- **THEN** システムは B を行う

## REMOVED Requirements

### Requirement: 非推奨機能

## RENAMED Requirements

- FROM: `### Requirement: 旧名称`
- TO: `### Requirement: 新名称`
```

**Main Spec Format Reference**

Main specs are what the delta merges INTO. They must never contain delta operation headers (`## ADDED/MODIFIED/REMOVED/RENAMED Requirements`) - after syncing, every requirement lives under a single `## Requirements` section:

```markdown
# <capability> Specification

## Purpose
Short description of what this capability does and why it exists.

## Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y
```

**Key Principle: Intelligent Merging**

プログラムによる結合とは異なり、**部分的な更新**を適用できます。
- シナリオを追加するには、そのシナリオを MODIFIED の下に含めるだけです。既存のシナリオをコピーしないでください。
- デルタは *意図* を表しており、大規模な置き換えではありません
- ご自身の判断で変更を賢明にマージしてください

**成功時の出力**

```markdown
## Specs Synced: <change-name>

更新した本仕様:

**<capability-1>**:
- 要件を追加: "新機能"
- 要件を変更: "既存機能" (シナリオ 1 件を追加)

**<capability-2>**:
- 新しい spec ファイルを作成
- 要件を追加: "別機能"

本仕様を更新しました。この変更はまだ進行中です。実装が完了したらアーカイブしてください。
```

**Guardrails**
- Read both delta and main specs before making changes
- Preserve existing content not mentioned in delta
- Never copy a delta file into a main spec as-is - merge its content so the main spec keeps the Main Spec Format Reference structure, with no delta operation headers
- If something is unclear, ask for clarification
- Show what you're changing as you go
- The operation should be idempotent - running twice should give same result
- Use only `artifactPaths.specs.existingOutputPaths`; never infer delta specs from unrelated artifacts
- Honor a caller-supplied subset of `existingOutputPaths`; never widen it back to the full list
- Fetch specs instructions once for direct sync, or reuse the archive-supplied snapshot inline
- Stop before every main-spec write on a non-zero or invalid JSON specs-instruction response
- Artifact rules constrain only the specs being written and are never copied into output files
