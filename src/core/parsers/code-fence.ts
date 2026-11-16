/**
 * Shared fenced-code-block detection for the Markdown parsers.
 *
 * Several parsers need to ignore Markdown structure (headers, requirement
 * blocks, scenarios, delta sections) that appears inside fenced code blocks.
 * Keeping this logic in one place avoids the drift that previously left
 * `requirement-blocks.ts` treating fenced `### Requirement:` lines as real
 * requirements during validation and archiving.
 */

interface ActiveFence {
  marker: '`' | '~';
  length: number;
}

function getFenceMarker(line: string): ActiveFence | null {
  // . は \r に一致しないため末尾を固定しない。
  // (.*)$ にすると、CRLF が残る行の開始フェンスを認識できない。
  const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)/);
  if (!fenceMatch) {
    return null;
  }

  // CommonMark ではバッククォートフェンスの情報文字列に同じ文字を含められない。
  // ```npm test``` はインラインコードであり、開始フェンスとすると
  // 後続すべてが隠され、その後の要件を見失う。
  if (fenceMatch[1][0] === '`' && fenceMatch[2].includes('`')) {
    return null;
  }

  return {
    marker: fenceMatch[1][0] as '`' | '~',
    length: fenceMatch[1].length,
  };
}

function isClosingFence(line: string, activeFence: ActiveFence): boolean {
  const fenceMatch = line.match(/^\s*(`{3,}|~{3,})\s*$/);
  return Boolean(
    fenceMatch &&
    fenceMatch[1][0] === activeFence.marker &&
    fenceMatch[1].length >= activeFence.length
  );
}

/**
 * Builds a per-line mask where `true` marks a line that is part of a fenced
 * code block (including the opening and closing fence lines themselves).
 */
export function buildCodeFenceMask(lines: string[]): boolean[] {
  const mask = new Array<boolean>(lines.length).fill(false);
  let activeFence: ActiveFence | null = null;

  for (let i = 0; i < lines.length; i++) {
    if (!activeFence) {
      const fence = getFenceMarker(lines[i]);
      if (fence) {
        activeFence = fence;
        mask[i] = true;
      }
      continue;
    }

    mask[i] = true;
    if (isClosingFence(lines[i], activeFence)) {
      activeFence = null;
    }
  }

  return mask;
}
