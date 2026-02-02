/**
 * コマンド参照ユーティリティ
 *
 * コマンド参照をツール固有の形式へ変換するためのユーティリティ。
 */

/**
 * コロン区切りのコマンド参照をハイフン形式へ変換する。
 * `/opsx:` を `/opsx-` に置き換え、ハイフン形式を採用するツールに対応する。
 *
 * @param text - コマンド参照を含むテキスト
 * @returns ハイフン形式のコマンド参照に変換したテキスト
 *
 * @example
 * transformToHyphenCommands('/opsx:new') // => '/opsx-new'
 * transformToHyphenCommands('/opsx:apply を使って実装する') // => '/opsx-apply を使って実装する'
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/opsx:/g, '/opsx-');
}
