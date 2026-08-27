import { buildCodeFenceMask } from '../parsers/code-fence.js';
import { PURPOSE_PLACEHOLDER_PREFIX, PURPOSE_PLACEHOLDER_SUFFIX } from './constants.js';

/**
 * 誰かが記述した内容ではなく、プレースホルダーのまま残っている
 * `## Purpose` を検出する。
 *
 * デルタに利用可能な `## Purpose` がない場合、archiveは新規のメイン仕様へ
 * プレースホルダーを書き込む。この文は `MIN_PURPOSE_LENGTH` を超えるため、
 * 文字数の検査だけでは未記入のPurposeを検出できない。
 *
 * 次の2種類だけをプレースホルダーとして扱う。
 *
 * - このツールが生成した文。生成側と同じ定数を使い、Purpose内の位置を問わず検出する。
 * - Purposeの先頭にある `TBD` または `TODO`。どちらも未記入を示すマーカーとして扱う。
 *
 * 文中にあるマーカーは検出しない。たとえば、未決事項を含む記述済みのPurposeまで
 * 警告すると、利用者が警告を無視する原因になる。
 *
 * Purpose内のコードフェンスは引用として除外する。これにより、archiveが生成する文を
 * 説明しただけのPurposeをプレースホルダーと誤判定しない。
 */

export interface PurposePlaceholderIssue {
  /** プレースホルダーを特定できた場合の1始まりの行番号。 */
  line?: number;
}

/**
 * Purposeの先頭にある `TBD` または `TODO`。先読みで `TBDs` や `TODOs` のような
 * 長い単語を除外し、`TODO:` や `TBD -` の句読点は許可する。Purposeはラテン文字以外も
 * 含むため、ASCIIの `\b` だけでなく文字、数字、結合文字をすべて除外対象にする。
 */
const LEADING_MARKER = /^(?:TBD|TODO)(?![\p{L}\p{N}\p{M}_])/iu;

const PURPOSE_HEADER = /^ {0,3}##(?!#)[ \t]+Purpose[ \t]*$/i;
const TOP_LEVEL_HEADER = /^ {0,3}#{1,2}(?!#)[ \t]+/;

/**
 * 改行を正規化し、`text` からコードフェンス外の行だけを返す。
 * 要件・構造パーサーと同じ `buildCodeFenceMask` を使い、フェンスの解釈を統一する。
 */
function unfencedLines(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const fenced = buildCodeFenceMask(lines);
  return lines.filter((_, index) => !fenced[index]);
}

/**
 * archiveが生成する文の開始位置を返す。間に変更名が入るため、生成側と共有する
 * 前半・後半の定数を順番に照合する。
 */
function generatedPlaceholderPrefixIndex(text: string): number | undefined {
  let suffixAt = text.indexOf(PURPOSE_PLACEHOLDER_SUFFIX);
  while (suffixAt !== -1) {
    // この後半に最も近い前半を使う。記述済みの説明が先に前半部分へ言及していても、
    // 診断位置を説明文ではなく、実際に置き換えるプレースホルダーへ合わせる。
    const prefixAt = text.lastIndexOf(PURPOSE_PLACEHOLDER_PREFIX, suffixAt);
    if (prefixAt !== -1) return prefixAt;
    suffixAt = text.indexOf(PURPOSE_PLACEHOLDER_SUFFIX, suffixAt + 1);
  }
  return undefined;
}

/**
 * メイン仕様のPurposeが未記入のプレースホルダーなら問題を返し、
 * 記述済みならnullを返す。空のPurposeは `SPEC_PURPOSE_EMPTY` が扱うため、ここでは報告しない。
 */
export function findPurposePlaceholderIssue(
  overview: string,
  content?: string
): PurposePlaceholderIssue | null {
  // 空のPurposeはどちらの規則にも一致せず、nullになる。コードフェンスだけの
  // Purposeも同様に、文字数または空Purposeの規則へ任せる。
  const prose = unfencedLines(overview).join('\n').trim();
  const leading = LEADING_MARKER.test(prose);
  if (!leading && generatedPlaceholderPrefixIndex(prose) === undefined) return null;
  // どの規則に一致したかで位置が変わる。両方に一致した場合は、読者が先に目にする
  // 先頭マーカーの位置を優先する。
  return { line: content === undefined ? undefined : findPlaceholderLine(content, leading) };
}

/**
 * 警告がファイル全体ではなく置換対象の文を指すよう、`## Purpose` 内の
 * プレースホルダー行を返す。
 *
 * 先頭マーカーなら、セクション内の最初の空でない行を返す。生成文は記述済みの文に
 * 続く場合があるため、定数の一致位置から行を求める。コードフェンス内の行は除外し、
 * フェンス内の `## Requirements` でPurposeセクションを終了しない。
 *
 * セクション見出しがない場合や生成文が複数行にまたがる場合は、推測せずundefinedを返す。
 * 改行を先に正規化し、WindowsとmacOS/Linuxで同じ行番号を報告する。
 */
function findPlaceholderLine(content: string, leading: boolean): number | undefined {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const fenced = buildCodeFenceMask(lines);
  const headerIndex = lines.findIndex((line, index) => !fenced[index] && PURPOSE_HEADER.test(line));
  if (headerIndex === -1) return undefined;

  const purposeLines: Array<{ line: number; text: string }> = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (fenced[i]) continue;
    if (TOP_LEVEL_HEADER.test(lines[i])) break;
    if (leading && lines[i].trim()) return i + 1;
    purposeLines.push({ line: i + 1, text: lines[i] });
  }

  if (leading) return undefined;

  const purpose = purposeLines.map(({ text }) => text).join('\n');
  const prefixAt = generatedPlaceholderPrefixIndex(purpose);
  if (prefixAt === undefined) return undefined;
  const lineOffset = purpose.slice(0, prefixAt).split('\n').length - 1;
  return purposeLines[lineOffset]?.line;
}
