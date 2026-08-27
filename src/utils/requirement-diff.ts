import { formatPatch, OMIT_HEADERS, structuredPatch } from 'diff';
import {
  extractRequirementsSection,
  foldRequirementName,
  normalizeRequirementName,
} from '../core/parsers/requirement-blocks.js';

/** メイン仕様の要件ブロックと、見出しがデルタへ一致した方法。 */
export interface MatchedRequirementBlock {
  raw: string;
  /** メイン仕様に記載された見出し名。 */
  name: string;
  /**
   * 2つの見出しが大文字・小文字または内部の空白だけ異なる場合はfalse。
   * archiveは名前を完全一致で比較するため、意図した差分を表示できる場合でも、
   * 不完全な一致は問題として報告する。
   */
  exact: boolean;
}

/**
 * 仕様ファイルから、名前を指定して要件のMarkdownブロックを取得する。
 *
 * コードフェンス、セクション境界、要件見出しの解析は
 * extractRequirementsSection()へ委譲する。最初に名前の完全一致を探し、
 * 見つからなければ大文字・小文字と空白を正規化して検索する。表記だけが異なる
 * 見出しにも差分を表示し、不完全な一致として記録する。
 *
 * どちらの方法でも一致する要件見出しがなければnullを返す。
 */
export function extractRequirementBlock(
  specContent: string,
  requirementName: string
): MatchedRequirementBlock | null {
  const parts = extractRequirementsSection(specContent);
  const targetName = normalizeRequirementName(requirementName);
  const foldedTarget = foldRequirementName(targetName);
  let folded: MatchedRequirementBlock | null = null;

  for (const block of parts.bodyBlocks) {
    const name = normalizeRequirementName(block.name);
    if (name === targetName) {
      return { raw: block.raw, name, exact: true };
    }
    if (!folded && foldRequirementName(name) === foldedTarget) {
      folded = { raw: block.raw, name, exact: false };
    }
  }

  return folded;
}

/**
 * メイン仕様の要件ブロックと、それを置き換えるデルタブロックのunified diffを生成する。
 * メインブロックがnullの新規機能では空文字列と比較し、すべての行を追加として扱う。
 *
 * 呼び出し元がラベルを付けるため、生成したファイル見出しは省略する。
 * unified diffのハンク範囲はstructuredPatchで保持する。
 */
export function diffRequirementBlock(baseBlock: string | null, deltaBlock: string, label: string): string {
  const base = ensureTrailingNewline(baseBlock ?? '');
  const delta = ensureTrailingNewline(deltaBlock);
  const patch = structuredPatch(label, label, base, delta);

  return formatPatch(patch, OMIT_HEADERS).trimEnd();
}

function ensureTrailingNewline(s: string): string {
  return s.endsWith('\n') ? s : s + '\n';
}

/**
 * 正規化したRENAMEDの変更先名から、メイン仕様の元の名前へのMapを作成する。
 * 名前変更は記載順に適用するため、A -> B -> Cの連鎖ではCをAへ対応付ける。
 * 後続のMODIFIED Cは、このAのブロックを置き換える。
 */
export function buildRenameMap(renames: Array<{ from: string; to: string }>): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of renames) {
    const from = foldRequirementName(r.from);
    const original = map.get(from) ?? normalizeRequirementName(r.from);
    map.delete(from);
    map.set(foldRequirementName(r.to), original);
  }
  return map;
}
