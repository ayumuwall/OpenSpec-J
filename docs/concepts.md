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

## 調整用ワークスペース

ワークスペース対応は beta です。現在はローカルビュー方式を採用していますが、外部自動化、連携、長期運用のワークフローでは、コマンドの挙動、状態ファイル、JSON 出力がまだ変わり得るものとして扱ってください。

以下のコマンドは、リンク済みリポジトリやフォルダをまとめて扱うローカルビューを作るための、最初のセットアップフローです。

計画、実装、アーカイブの流れを 1 つのリポジトリで完結できる場合は、リポジトリ内の OpenSpec プロジェクトを使うのが標準です。一方で、複数のリポジトリやフォルダにまたがる作業もあります。その場合、OpenSpec の調整用ワークスペースは、リンク済みパス、開き方の設定、エージェント設定をまとめる、このマシン上だけのビューとして機能します。

ワークスペースの考え方は次のとおりです。

```text
workspace     = context store、initiative、リポジトリ、フォルダに対するプライベートなローカルビュー
context store = 永続的な共有コンテキストの置き場所
initiative    = context store 内の永続的な調整コンテキスト
link          = ワークスペースがこのマシン上で解決できるリポジトリまたはフォルダの安定名
change        = 計画済み作業の 1 単位。実装は担当リポジトリに属する
```

ワークスペースは、リポジトリ内の OpenSpec プロジェクトとは別の形を持ちます。

```text
getGlobalDataDir()/workspaces/<workspace-name>/
├── .openspec-workspace/
│   └── view.yaml                  # プライベートなローカルビュー記録
├── AGENTS.md                      # 生成される実行時ガイダンス
└── <workspace-name>.code-workspace # 生成されるエディタ workspace ファイル
```

リポジトリ内の OpenSpec 状態は、既存の形を維持します。

```text
repo-root/
└── openspec/
    ├── specs/
    └── changes/
```

ルートレベルの `workspace.yaml` ファイルは OpenSpec のワークスペース状態ではありません。ワークスペース状態は `.openspec-workspace/` 配下に名前空間化されるため、他ツールは同名のルートレベルファイルを引き続き所有できます。

この区別は重要です。ワークスペースフォルダは、リンク済みリポジトリやフォルダを開いて調べるためのローカルな調整場所です。各リポジトリの `openspec/` ディレクトリは、そのリポジトリが所有する specs、changes、実装計画の置き場所であり続けます。ユーザーはワークスペースフォルダ内で `openspec init` を実行する必要はありません。

安定したリンク名により、ワークスペースはリポジトリやフォルダを参照します。プライベートなワークスペース記録は `api`, `web`, `checkout` などの名前を保持し、この実行環境のローカルパスへ対応づけます。

```yaml
# .openspec-workspace/view.yaml
version: 1
name: platform
context: null
links:
  api: /repos/api
  web: /repos/web
```

ワークスペースが initiative を開くと、`context` は選択した context-store の紐付けと initiative ID を記録します。レジストリから選択した context store は ID で保存するため、別の環境でも扱いやすくなります。パスで選択した context store は、`.openspec-workspace/view.yaml` がプライベートなローカル状態であるため、意図的にその実行環境のローカルパスを保持します。

```yaml
context:
  kind: initiative
  store:
    id: platform
    selector:
      kind: registry
      id: platform
  initiative:
    id: billing-launch
```

リンク済みパスは、リポジトリ全体、大規模 monorepo 内のフォルダ、その他の既存フォルダのいずれでもかまいません。ワークスペース計画に参加する時点では、リンク先がリポジトリ内の `openspec/` 状態を持っている必要はありません。後続の実装、検証、アーカイブワークフローではリポジトリ側の準備がさらに必要になる場合がありますが、計画上の可視性はリンクから始まります。

```text
multi-repo:
  api      -> /repos/api
  web      -> /repos/web

large monorepo:
  billing  -> /repos/platform/services/billing
  checkout -> /repos/platform/apps/checkout
```

管理対象ワークスペースは標準の OpenSpec データディレクトリ配下に置かれます。

```text
getGlobalDataDir()/workspaces
```

つまり、`XDG_DATA_HOME` が設定されている場合は `$XDG_DATA_HOME/openspec/workspaces`、Unix 系フォールバックでは `~/.local/share/openspec/workspaces`、ネイティブ Windows フォールバックでは `%LOCALAPPDATA%\openspec\workspaces` です。ネイティブ Windows shell、PowerShell、WSL2 は、それぞれ OpenSpec を実行しているランタイムのパス文字列を保持します。この基盤は `D:\repo`、`/mnt/d/repo`、UNC WSL パスの間の変換は行いません。

管理対象ワークスペースは、上記の名前空間化されたプライベートビュー記録を使います。ワークスペースフォルダは、そのローカルビューの基準となる場所です。

ワークスペースで見えることは、変更へのコミットを意味しません。OpenSpec に関連するリポジトリやフォルダを把握させたいときにワークスペースをセットアップし、機能、修正、プロジェクト、その他の作業を計画する準備ができたら変更を作成します。

便利なコマンド:

```bash
# ガイド付きセットアップ
openspec workspace setup

# 自動化向けセットアップ
openspec workspace setup --no-interactive --name platform --link /repos/api --link web=/repos/web
openspec workspace setup --no-interactive --name platform --link /repos/api --opener codex-cli

# ローカルレジストリ上の既知のワークスペースを確認
openspec workspace list
openspec workspace ls

# 選択したワークスペースのリンクを追加または修復
openspec workspace link /repos/api
openspec workspace link api-service /repos/api
openspec workspace relink api-service /new/path/to/api

# このマシンで解決できるものを確認
openspec workspace doctor
openspec workspace doctor --workspace platform

# ワークスペース内のガイダンスとエージェントスキルを更新
openspec workspace update
openspec workspace update --workspace platform --tools codex,claude

# リンク済み作業セットを開く
openspec workspace open
openspec workspace open platform --agent github-copilot
openspec workspace open --editor

# initiative をローカルワークスペースビューとして開く
openspec workspace open --initiative billing-launch --store platform
openspec workspace open --initiative billing-launch --store-path /repos/platform-context
```

`workspace setup` は常に標準のワークスペース場所にワークスペースを作成し、ローカルレジストリに記録して、作成場所を表示します。少なくとも 1 つのリポジトリまたはフォルダをリンクする必要があります。対話セットアップではデフォルトの開き方を確認し、選択したエージェント向けに OpenSpec スキルをインストールできます。非対話セットアップでは `--opener codex-cli`, `--opener claude`, `--opener github-copilot`, `--opener editor` のいずれかを指定した場合だけ保存します。

ワークスペーススキルはワークスペースルートにのみインストールされます。有効なグローバル profile が生成対象のワークフロースキルを選び、`--tools` が配布先エージェントを選びます。グローバル delivery に commands が含まれていても、workspace setup と update はスラッシュコマンドファイルを作成しません。リンク済みリポジトリやフォルダを編集せず、ワークスペース内のガイダンスを更新し、OpenSpec 管理のワークスペース内スキルディレクトリを追加・更新・削除するには `openspec workspace update` を実行します。

OpenSpec はワークスペースを開くための補助ファイルも管理します。`AGENTS.md` 内の OpenSpec 管理ガイダンスブロックと、VS Code および GitHub Copilot-in-VS-Code で開くためのマシンローカルな `<workspace-name>.code-workspace` ファイルです。管理対象ワークスペースはリポジトリではないため、OpenSpec はデフォルトのワークスペース `.gitignore` やワークスペースレベルの `changes/` ディレクトリを作成しません。

管理対象の VS Code workspace には、有効なリンク済みリポジトリまたはフォルダ、紐づく initiative のコンテキスト、OpenSpec ワークスペースファイルがこの順で入ります。VS Code はそれらをマルチルートワークスペースとして表示します。

`workspace open` は、その 1 セッションで `--agent <tool>` または `--editor` を渡さない限り、保存済みの開き方でリンク済み作業セットを開きます。両方の上書き指定を渡すとエラーです。ワークスペースを開くと、調査と文脈把握のためにリンク済みリポジトリやフォルダが見えるようになります。実装は、ユーザーが明示的に実装作業を依頼した後に始めます。

`workspace link` と `workspace relink` は既存フォルダだけを記録します。リンク済みリポジトリやフォルダを作成、コピー、移動、初期化、編集することはありません。link または relink が成功すると、OpenSpec は管理対象ガイダンスと VS Code workspace ファイルを更新します。

ワークスペースを 1 つ必要とするコマンドは、`--workspace <name>` を付ければどこからでも実行できます。ワークスペースフォルダまたはそのサブディレクトリ内で実行した場合、OpenSpec は現在のワークスペースを使います。既知のワークスペースが複数あり、`--workspace <name>` を渡していない場合、人向けコマンドは選択画面を表示します。`--json` と `--no-interactive` はプロンプトを出さず、構造化された status エラーで失敗します。

直接のワークスペースコマンドは、スクリプト向けの JSON 出力に対応します。JSON レスポンスでは主要データを `workspace`, `workspaces`, `link` オブジェクトに保持し、警告やエラーを `status` 配列で報告します。正常なオブジェクトは `status: []` を使います。

## 仕様（Specs）

仕様は、構造化された要件とシナリオでシステムの挙動を表します。

### 構成

```
openspec/specs/
├── auth/
│   └── spec.md           # 認証の挙動
├── payments/
│   └── spec.md           # 決済処理
├── notifications/
│   └── spec.md           # 通知システム
└── ui/
    └── spec.md           # UI の挙動とテーマ
```

仕様はドメイン単位で整理します。よくあるパターン:

- **機能単位**: `auth/`, `payments/`, `search/`
- **コンポーネント単位**: `api/`, `frontend/`, `workers/`
- **境界づけられたコンテキスト単位**: `ordering/`, `fulfillment/`, `inventory/`

### 仕様フォーマット

仕様は要件で構成され、各要件にはシナリオがあります。

````markdown
# Auth 仕様

## Purpose
アプリケーションの認証とセッション管理。

## Requirements

### Requirement: ユーザー認証
システムはログイン成功時に JWT トークンを発行しなければならない。(SHALL)

#### Scenario: 有効な認証情報
- GIVEN 有効な認証情報を持つユーザー
- WHEN ログインフォームを送信したとき
- THEN JWT トークンが返される
- AND ユーザーはダッシュボードにリダイレクトされる

#### Scenario: 無効な認証情報
- GIVEN 無効な認証情報
- WHEN ログインフォームを送信したとき
- THEN エラーメッセージが表示される
- AND トークンは発行されない

### Requirement: セッション期限
システムは 30 分間操作がない場合にセッションを期限切れにしなければならない。(MUST)

#### Scenario: アイドルタイムアウト
- GIVEN 認証済みセッション
- WHEN 30 分間操作がない
- THEN セッションは無効化される
- AND ユーザーは再認証が必要になる
```

**主要要素:**

| 要素 | 目的 |
|---------|---------|
| `## Purpose` | 仕様が扱うドメインの概要 |
| `### Requirement:` | システムが満たすべき具体的挙動 |
| `#### Scenario:` | 要件が実際に発生する具体例 |
| SHALL/MUST | RFC 2119 による強さの表現 |

### この構造を採用する理由

**要件は「何を」** — 実装の詳細ではなく、必要な挙動を定義します。

**シナリオは「いつ」** — 具体例として検証可能にします。良いシナリオは次の特徴があります。
- テスト可能（自動テストに落とせる）
- ハッピーパスとエッジケースの両方を含む
- Given/When/Then などの構造化形式を使う

**RFC 2119 キーワード**（SHALL, MUST）は意図の強さを表します。
- **MUST/SHALL** — 絶対要件

### 仕様とは何か（そして何でないか）

仕様は**挙動の契約**であり、実装計画ではありません。

仕様に含めるべき内容:
- ユーザーや下流システムが依存する観測可能な挙動
- 入力、出力、エラー条件
- 外部制約（セキュリティ、プライバシー、信頼性、互換性）
- テスト可能または明示的に検証できるシナリオ

仕様に含めないもの:
- 内部クラス名・関数名
- ライブラリやフレームワークの選択
- ステップバイステップの実装詳細
- 詳細な実行計画（それらは `design.md` または `tasks.md` に属する）

簡単な確認:
- 実装が変わっても外部から見える挙動が変わらないなら、仕様に含める必要はおそらくない。

### 軽量に保つ: 段階的な厳密さ

OpenSpec は官僚主義を避けることを目指しています。変更を検証可能にする最低限のレベルを使ってください。

**ライト仕様（デフォルト）:**
- 短い挙動優先の要件
- 明確なスコープと対象外事項
- 少数の具体的な受け入れ確認

**フル仕様（リスクが高い場合）:**
- チームまたはリポジトリをまたぐ変更
- API/契約変更、マイグレーション、セキュリティ/プライバシーへの懸念
- 曖昧さが高コストな手戻りを引き起こしやすい変更

ほとんどの変更はライトモードで十分です。

### 人とエージェントの協働

多くのチームでは、人が探索しエージェントがアーティファクトを作成します。想定されるループ:

1. 人が意図・文脈・制約を提供する。
2. エージェントがそれを挙動優先の要件とシナリオに変換する。
3. エージェントは実装詳細を `spec.md` ではなく `design.md` と `tasks.md` に置く。
4. 検証が実装前に構造と明確さを確認する。

これにより、仕様は人にとって読みやすく、エージェントにとって一貫したものになります。

## 変更（Changes）

変更は、システムへの修正をまとめたフォルダです。理解・実装に必要なものをすべて含みます。

### 変更の構造

```
openspec/changes/add-dark-mode/
├── proposal.md           # なぜ・何を
├── design.md             # どうやって（技術的アプローチ）
├── tasks.md              # 実装チェックリスト
├── .openspec.yaml        # 変更メタデータ（任意）
└── specs/                # 仕様差分
    └── ui/
        └── spec.md       # ui/spec.md への変更内容
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
