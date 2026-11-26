# ローカライズ特有の修正メモ

## 対象

v2.2.0 のコードに残る、日本語版固有の判定・変換・互換処理と、その依存関係を記録する。本家と共通の仕様、翻訳方針、単なる文言修正、作業・検証履歴は含めない。

## 同梱スキルとロックファイルの取得元

- `src/core/skill-installer.ts` は、CLI が同梱する日本語テンプレートからスキルをインストールする。グローバルインストール時は `skills` パッケージのロックファイルに `ayumuwall/OpenSpec-J` の GitHub URL、版タグ、スキルフォルダのハッシュを記録する。`npx skills update -g` が日本語版を参照できるよう、タグ上の `skills/` も同じ内容から生成する。
- `src/core/shared-skill-target.ts` は、`skills-lock.json` が OpenSpec-J または本家の取得元を記録している場合に共有スキルを検出する。`npx skills add ayumuwall/OpenSpec-J` で導入したスキルを更新できるよう、日本語版のリポジトリ名も認識する。

## 旧日本語版の生成内容の識別

- `src/core/shared/released-generated-fingerprints.ts` の `OpenSpec-J Releases` に対応するハッシュを保持する。本家の英語出力のハッシュだけでは、未編集の旧日本語スキル・コマンドを利用者の編集と誤判定し、旧出力の整理が行われない。
- `scripts/capture-released-fingerprints.mjs` の取得対象は `@ayumuwall/openspec` とし、既存の本家・日本語版の識別データへ追加する。本家のハッシュを日本語版のハッシュで置き換えない。

## 単体実行版の導入先判定と日本語インストーラー

- `src/core/version-check.ts` は `Cellar/openspec-j/` を Homebrew と判定し、`brew upgrade ayumuwall/tap/openspec-j` を案内する。`src/commands/install-standalone.ts` は同じ判定結果を使い、`brew uninstall openspec-j` を案内する。別の判定を持つと導入方法によって npm と誤認する。
- インストーラーは `ayumuwall/OpenSpec-J` の `ja-docs`、バイナリーは同リポジトリの Releases から取得する。`main` は本家のリリースコミットを保持するブランチなので、日本語インストーラーの取得元にしない。
- `scripts/binary/install.ps1` の UTF-8 BOM を保持する。Windows PowerShell 5.1 が日本語を読み込むために必要。
- `src/commands/install-standalone.ts` の `WINDOWS_RUNNER` は `Invoke-WebRequest -OutFile` で取得したバイト列を一時 `.ps1` ファイルとして実行し、出力を UTF-8 にする。本家の `irm | iex` に戻すと、charset のない HTTP 応答で BOM と日本語を誤読する。対応する回帰検査は `test/commands/install-standalone.test.ts`。

## 日本語診断を使う判定

- `src/core/validation/validator.ts` の `enrichTopLevelError` は、英語の診断に加え、日本語の `VALIDATION_MESSAGES`、`Requirements セクションは必須です`、`Why セクション` を認識する。英語の `includes` 判定だけに戻すと、日本語診断に補足ガイドが付かなくなる。
- 同関数の日本語・英語判定は補足との区切り（`。` / `. `）にも使う。補足を付ける条件と表示用の言語判定を分けて保持する。
- `src/core/templates/workflows/project-root.ts` のストアエラー判定は、`src/core/root-selection.ts` の日本語診断 `での宣言:` / `のストア宣言が不正です:` と対応させる。英語の判定文へ戻すと、ストアの解決失敗を未初期化と混同する。
- `src/utils/nested-change.ts` の日本語 `NESTED_CHANGE_ISSUE_MARKER` は、診断の生成と `src/commands/validate.ts` の案内選択で共有する。表示文だけを別の文字列にすると案内を選べなくなる。

## 旧 Codex スキルの日本語参照との互換性

- `src/utils/command-references.ts` の旧形式 `$スキル名（Codex）、/スキル名（その他の対応エージェント）` は、`src/core/shared/skill-content-equivalence.ts` の日本語参照の正規表現と対応させる。
- 同等性判定は旧本文と現行本文の両方の参照を正規化する。本家の英語参照だけを認識する処理や、片側だけを正規化する処理へ戻すと、旧日本語版の未編集スキルを同等と判定できない。

## 旧コマンドの日本語入力見出しの検出

- `src/core/command-generation/adapters/` の `atomcode.ts`、`command-code.ts`、`oh-my-pi.ts`、`opencode.ts`、`pi.ts` は、`Input` / `入力` と半角・全角コロンを認識する。v2.2.0 でも `src/core/shared/command-reconcile.ts` が生成内容を再現して旧コマンドを判別するため、この対応が必要。
- Command Code の重複挿入防止は `Provided arguments` / `入力された引数` の両方を認識する。OpenCode の引数不要判定は `None required` に加え、日本語の `不要` / `指定不要` と後続の句読点などを認識する。日本語の語境界を英語用の `\b` へ置き換えない。

## 日本語の Purpose プレースホルダーの検出

- `src/core/validation/constants.ts` の日本語 `PURPOSE_PLACEHOLDER_PREFIX` / `PURPOSE_PLACEHOLDER_SUFFIX` は、`src/core/specs-apply.ts` の生成と `src/core/validation/purpose-placeholder.ts` の検出で共有する。生成文だけを日本語化し、検出を英語文のままにすると未記入の Purpose を見逃す。

## 日本語テンプレートを検査する正規表現

- `test/core/templates/explore.test.ts` / `update-change.test.ts` の語句検出は、日本語の確認・書き込み表現も対象にする。英語の `confirm` / `write` だけでは、日本語で追加された不適切な指示を検出できない。explore の文分割では日本語の句点 `。` も区切りにする。
- explore の図の検査は `UNICODE_DIAGRAM_CHARACTER` で矢印・罫線などを検出する。本家の非 ASCII 文字全般を対象にする検査へ戻すと、日本語の説明文も図として扱ってしまう。

## 日本語 FAQ のアンカー生成

- `website/lib/remark-faq.ts` の `slugify` は Unicode プロパティエスケープ `\p{L}` / `\p{N}` で文字と数字を保持する。本家の ASCII 英数字だけを残す処理へ戻すと、日本語だけの FAQ 見出しから空のアンカーが生成される。

## Commander の標準ヘルプの日本語化

- 本家にはない `src/cli/help.ts` の `configureJapaneseHelp` を、`src/cli/index.ts` で子コマンド登録前に適用する。これにより、組み込みヘルプの見出しと選択肢・既定値などの表示ラベルを子・孫コマンドにも継承させる。
- `optionDescription` / `argumentDescription` はラベルを日本語化しつつ、付加情報を表示する条件を Commander に合わせる。Commander 更新時にこの条件を取り落とすと、日本語版だけ既定値などの表示が変わる。対応する回帰検査は `test/cli-help.test.ts`。
