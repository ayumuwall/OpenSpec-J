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

**ストアの選択:** ユーザーがストア（この端末に登録された独立した OpenSpec リポジトリ）を指定した場合、または作業がストアにある場合は、`openspec store list --json` で登録済みストア ID を調べます。その後、仕様と変更を読み書きするコマンド（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）に `--store <id>` を指定します。一度選んだら、その後のワークフローでは `--store <id>` を維持します。以下にフラグなしで示すコマンド例は省略形なので、実行前にフラグを追加してください。たとえば、フラグなしの例ではなく `openspec status --change "<name>" --json --store "<id>"` を実行します。ほかのコマンドはこのフラグを受け取りません。コマンドが出力するヒントには既にフラグが含まれるため、後続コマンドでも維持してください。ストアを使わない場合、コマンドは最も近いローカルの `openspec/` ルートを対象にします。

`<capability-path>` は `specs/` からの相対仕様ディレクトリです（例: `user-auth` または `identity/user-auth`）。各 delta spec から本仕様を解決するときは、完全なパスを維持します。

**入力**: 必要に応じて、変更名を指定します。省略した場合は、会話の文脈から推測できるかどうかを確認します。曖昧またはあいまいな場合は、利用可能な変更を要求する必要があります。

**手順**

1. **変更を選択**

   名前が指定されていれば使用します。それ以外の場合:
   - ユーザーが変更に言及していれば、会話の文脈から推測します
   - アクティブな変更が1つだけなら自動選択します
   - 曖昧なら `openspec list --json` で利用可能な変更を取得し、ユーザーに選択を求めます

   選択を求める際は、`specs/` ディレクトリ配下に delta spec がある変更を表示します。

   必ず「使用する変更: <name>」と、切り替える方法（例: `/openspec-sync-specs <other>`）を通知します。

2. **変更コンテキストの解決**

走る：
   ```bash
   openspec status --change "<name>" --json
   ```

   JSON には `planningHome.root` が含まれます。本仕様は `<planningHome.root>/openspec/specs/` 配下にあります。以下の全本仕様パスには、リポジトリのパスを決め打ちせず、この store 対応ルートを使用します。store 選択時は現在のリポジトリではなくその store を指します。

3. **delta spec を検索**

   status JSON の `artifactPaths.specs.existingOutputPaths` だけを delta spec パスの情報源にします。`specs` 項目がない、または `existingOutputPaths` が空なら、同期する delta spec がないと報告します。他のアーティファクトから推測せず、アーティファクト指示の取得や本仕様への書込みを行わず終了します。

   呼出元が対象を絞っていない限り、`existingOutputPaths` の全パスを同期します。
   呼出元が絞る場合は、`existingOutputPaths` から完全なエントリの明示的な一覧を指定します。
   その絶対パスをそのままコピーします。archive はこれをインラインで行います。ユーザーも
   たとえば `/specs/billing/invoices/spec.md` で終わるエントリを選択して同じことができます。
   その後は指定されたパスだけを同期し、残りの delta spec には手を触れません。
   一括 archive では、実装が見つからない delta を除外します。これを同期すると、呼出元が
   意図的に保留した本仕様を書き込むことになるためです。
   この絞込みを手順4まで引き継ぎ、全一覧へ戻してはいけません。指定されたパスが
   `existingOutputPaths` にない場合は、黙って除外せず報告して停止します。指定一覧が空なら、
   同期対象がないことを報告し、本仕様を書き込まず停止します。

各デルタ仕様ファイルには次のようなセクションが含まれています。
- `## ADDED Requirements` - 追加する新しい要件
- `## MODIFIED Requirements` - 既存の要件の変更
- `## REMOVED Requirements` - 削除の要件
- `## RENAMED Requirements` - 名前を変更するための要件 (FROM:/TO: 形式)

デルタ仕様が見つからない場合は、ユーザーに通知して停止します。

4. **デルタ仕様ごとに、メイン仕様に変更を適用します**

   最初に本仕様へ書き込む前に、現在の specs ルールのスナップショットを1つ取得します:
   - archive がこのワークフローをインラインで呼び出し、`openspec instructions specs --change "<name>" --json` の有効なスナップショットを渡した場合は再利用し、同じ指示を再取得しません
   - それ以外の場合は、同じ選択済みルートのフラグを付けてこのコマンドを1回実行します
   - 直接取得がゼロ以外で終了するか、不正なアーティファクト指示 JSON を返した場合は、エラーを報告し、本仕様へ書き込む前に終了します。失敗をルールセットなしとして扱わないでください
   - `rules` が省略された有効な応答は、アーティファクトルールが未設定であることを意味し、既存の意味的マージを続行します

   返された `rules` は、このマージで生成する本仕様の内容と形式だけに適用します。アーティファクトルールは操作手順ではなく、選択ルート、delta パス、CLI チェック、ワークフロー手順を変更できません。本文を本仕様や要約へそのままコピーせず、制約として使用します。

   手順3で選択した各 capability の delta spec パス（`existingOutputPaths` の全一覧、または呼出元が指定した絞込み済みサブセット。リポジトリではなく選択済み store に属する場合があります）について:

ａ． **デルタ仕様を読んで**、意図された変更を理解してください

   b. **本仕様を読む**: `<planningHome.root>/openspec/specs/<capability-path>/spec.md`（まだ存在しない場合があります）

c. **変更をインテリジェントに適用**:

**追加要件:**
- 主要仕様に要件が存在しない場合 → 追加する
- 要件がすでに存在する場合 → 一致するように更新します (暗黙的な MODIFIED として扱います)

      **MODIFIED Requirements:**
      - Find the requirement in main spec
      - Apply the changes - this can be:
        - 本仕様にまだない新しいシナリオを追加する
        - 既存のシナリオを変更する
        - 要件の説明を変更する
      - delta で言及されていないシナリオや内容を維持する

      **REMOVED Requirements:**
      - 本仕様から要件ブロック全体を削除します
      - capability を廃止する場合は、次のすべてを満たすときに限り、`spec.md` 全体を削除します。ディレクトリ内に他のものが残らなければ、そのディレクトリも削除します:
        1. *今回の実行で* 要件を削除した結果、要件ブロックが1つも残らない。
        2. 仕様の残りが正しい形式である（`## Purpose` が残っている）。
        3. 同期前から本仕様が空だったわけではない。何も削除しなければ何も変更しない。
        4. ファイル全体の他の空でない行は、タイトル、Purpose、Requirements ヘッダー、または正規の要件の本文・シナリオ・fenced example としてすべて説明できる。
        5. 変更の `.openspec.yaml` が `retire_capabilities: true` を宣言している。
        6. `spec.md` が実際の specs ルート内へ解決される（外部ファイルを削除する capability ディレクトリのシンボリックリンクはたどらない）。
        選択した要件を削除すると要件ブロックが残らず、いずれかの廃止条件を満たさない場合は、本仕様を変更してはいけません。その capability の同期を停止し、ブロックしている条件と解決方法をユーザーへ伝えます。空の `## Requirements` セクションを作成または残してはいけません。足りないものがマーカーだけなら、それも伝えます。ユーザーが廃止を実行するために追加できるものだからです。
      - ファイルを削除すると `## Purpose` も削除されます。ほかのセクションがある場合は廃止できません。廃止を報告するときは Purpose を示します。仕様が呼出元のチェックアウトにあった場合だけ、貼り付け可能な `git checkout` を示します。それ以外はチェックアウトの範囲に即した復旧方法を案内します。

**名前変更された要件:**
- FROM 要件を見つけて、名前を TO に変更します

      **delta 内の `## Purpose`:**
      - 本仕様にすでに存在する場合はそれが正式な内容なので変更しません（`openspec archive` も警告して処理を続けます）

   d. **capability がまだ存在しない場合は本仕様を作成**:
      - `<planningHome.root>/openspec/specs/<capability-path>/spec.md` を作成します
      - Purpose セクションを追加します。delta に `## Purpose` の本文があればそのままコピーします（`openspec archive` と同じ動作）。ない場合だけ短い TBD プレースホルダーを書きます
      - ADDED 要件を含む Requirements セクションを追加します
      - 以下の **本仕様フォーマットリファレンス** に従います

5. **更新した本仕様を検証する**

   Run `openspec validate --specs` with the same selected-root flags used earlier.
   検証に失敗した場合は問題を報告し、同期が成功したとは伝えてはいけません。

6. **概要を表示する**

   すべての変更を適用した後、次を要約します:
   - 更新した capability
   - 行った変更（要件の追加／変更／削除／名称変更）
   - TBD の Purpose プレースホルダーが残っている新しい本仕様。後回しにせず今書けるようにします
   - 廃止した capability。削除した `spec.md`、Purpose、貼り付け可能な `git checkout` またはチェックアウトの範囲に即した復旧方法を示します

**デルタスペックフォーマットリファレンス**

```markdown
## Purpose

新しい capability を導入する delta にだけ記載します。新しい本仕様の初期内容になります。

## ADDED Requirements

### Requirement: 新機能
システムは新しい処理を行うこと。

#### Scenario: 基本ケース
- **WHEN** ユーザーが X を行う
- **THEN** システムは Y を行う

## MODIFIED Requirements

### Requirement: 既存機能
システムは既存の動作を維持した上で、A も処理しなければならない。(SHALL)

#### Scenario: 本仕様にすでにあるシナリオ
- **WHEN** ユーザーが X を行う
- **THEN** システムが Y を行う

#### Scenario: 追加する新しいシナリオ
- **WHEN** ユーザーが A を行う
- **THEN** システムが B を行う

## REMOVED Requirements

### Requirement: 非推奨機能

## RENAMED Requirements

- FROM: `### Requirement: 旧名称`
- TO: `### Requirement: 新名称`
```

**本仕様フォーマットリファレンス**

本仕様は delta のマージ先です。delta 操作ヘッダー（`## ADDED/MODIFIED/REMOVED/RENAMED Requirements`）を含めてはなりません。同期後、全要件は単一の `## Requirements` セクション配下に置かれます:

```markdown
# <capability> Specification

## Purpose
この capability の機能と存在理由の短い説明。

## Requirements

### Requirement: 新機能
システムは新しい処理を行うこと。

#### Scenario: 基本ケース
- **WHEN** ユーザーが X を行う
- **THEN** システムは Y を行う
```

**重要原則: インテリジェントなマージ**

プログラムによるマージと異なり、上書きではなくマージします:
- MODIFIED ブロックには、変更後も残るすべてのシナリオを含む要件全体（本文とシナリオ）を記載します。本仕様にまだあるシナリオを落としたブロックは、`openspec validate` と `openspec archive` のどちらも拒否します。
- delta で言及されていないものは、本仕様の既存順序のまま維持します
- 適切に変更をマージするため、判断を用います

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

**ガードレール**
- 変更前に delta と本仕様の両方を読みます
- delta で言及されていない既存内容を維持します
- delta ファイルを本仕様へそのままコピーしません。本仕様が delta 操作ヘッダーを含まず、本仕様フォーマットリファレンスの構造を維持するよう内容をマージします
- 不明点があれば確認を求めます
- 作業中に変更内容を示します
- 操作は冪等にし、2回実行しても同じ結果になるようにします
- `artifactPaths.specs.existingOutputPaths` だけを使用し、無関係なアーティファクトから delta spec を推測しません
- 呼出元が指定した `existingOutputPaths` のサブセットを尊重し、全一覧へ戻しません
- 直接同期では specs 指示を1回取得し、archive からスナップショットが渡された場合はインラインで再利用します
- specs 指示の応答がゼロ以外または不正な JSON の場合、本仕様へ書き込む前に終了します
- アーティファクトルールは書き込む仕様だけを制約し、出力ファイルへコピーしません
