# コミュニティショーケース

OpenSpec のために、または OpenSpec を使って作られたプロジェクトやリソースを、コミュニティが管理する一覧です。ツール、連携機能、ワークフロー、学習リソースを歓迎します。コミュニティメンバーが Issue で追加を提案し、メンテナーが項目を追加します。

掲載プロジェクトはそれぞれ独立して管理されています。一覧への掲載は、OpenSpec による公式サポートや推奨を意味しません。セットアップやサポートについては、各プロジェクトのドキュメントと Issue トラッカーを参照してください。

## プロジェクトとリソース

- **[OpenSpec Workbench](https://github.com/VeryComplexAndLongName/OpenSpec-UI)**：OpenSpec の変更に取り組むエージェントを実行・監督します。
- **[openspec-guard](https://github.com/guillaume-flambard/spec-guard)**：テストを実行せずに、OpenSpec のどのシナリオが Vitest や Jest のテストでカバーされているかを報告する CLI と GitHub Action です。

## ホスト型サービス

CLI が提供していない OpenSpec の機能を追加するサービスです。各項目にアカウント・支払い・データの扱いを記載します。

- **[MySpec](https://myspec.dev)**：仕様について質問しながら要件を整理し、4ファイルの一式または OpenSpec 互換の変更を出力するクラウドのベータサービスです。アカウントが必要で、無料枠はクレジットカード不要です。MCP サーバー（`@myspec/mcp-server`）と [Claude Code プラグイン](https://github.com/myspecs/claude-plugins)を使うと、エージェントが仕様を読み、OpenSpec の変更を書き、タスクごとに実装できます。送信した内容を第三者の AI プロバイダーへ送るため、機密データの利用は想定していません。
- **[Entalpa](https://entalpa.com/en/openspec)**：公開 GitHub リポジトリの `openspec/specs/` を最大300要件まで取り込み、閲覧可能なプロジェクトにします。推測であることを示した関係者・ストーリー・未解決の質問を追加し、結果を `openspec/specs/` のツリーとして出力します。リポジトリへは書き込みません。取り込みと閲覧はアカウント不要で、保存・編集にはアカウント、AI 機能には有料クレジットが必要です。取り込んだ内容は第三者の AI プロバイダーへ送信します。
- **[OpenSpec Review](https://skillgild.dev/skills/openspec-review)** と **[OpenSpec Compact](https://skillgild.dev/skills/openspec-compact)**：Claude Code、Codex、Cursor、Gemini CLI、その他の MCP クライアント向けに SkillGild が提供するホスト型スキルです。Review は変更をリンクとして公開し、リンクを持つ人がアカウントなしで承認・変更要求・要件ごとのコメントを行えます。`openspec archive` が書き込む形で本仕様を表示し、他の未完了の変更も触れる要件を示します。Compact は本仕様間で語句が似た要件や重複シナリオを検出し、整理内容を OpenSpec の変更として記録します。SkillGild CLI と無料アカウントが必要で、各スキルは月25回まで使えます。両方とも仕様を SkillGild のサーバーへ送信します。サーバーは非公開コードで処理し、AI モデルは呼び出しません。Review は提案・設計・タスクも送信し、変更を30日間保持します。

## プロジェクトを追加する

追加したい1行（プロジェクト名、直接リンク、OpenSpec との関係を示す短い説明）を Issue で提案してください。メンテナーがこのファイルへ追加します。

- 一般的な製品広告ではなく、OpenSpec を使って作られたもの、または OpenSpec の利用を支援するものに内容を絞ってください。
- 利用できる機能を具体的に説明してください。宣伝文句、紹介リンク、トラッキングリンクは避けてください。
- 有料機能や必須アカウントがある場合は、項目内に明記してください。
- ホスト型・有料サービスは、CLI が提供していない OpenSpec の機能を追加し、無料で試せる場合だけホスト型サービスへ掲載します。既存スキルやコマンドを再配布するだけのサービスは掲載しません。

既存項目の訂正や更新も歓迎します。
