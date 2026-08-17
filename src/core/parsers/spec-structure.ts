import { buildCodeFenceMask } from './code-fence.js';

const REQUIREMENTS_SECTION_HEADER = /^##\s+Requirements\s*$/i;
const TOP_LEVEL_SECTION_HEADER = /^##\s+/;
const DELTA_HEADER = /^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements\s*$/i;
const REQUIREMENT_HEADER = /^###\s+Requirement:\s*(.+)\s*$/i;

export interface MainSpecStructureIssue {
  kind: 'delta-header' | 'requirement-outside-requirements' | 'duplicate-requirement';
  line: number;
  header: string;
  message: string;
}

export function findMainSpecStructureIssues(content: string): MainSpecStructureIssue[] {
  const normalized = content.replace(/\r\n?/g, '\n');
  const stripped = stripFencedCodeBlocksPreservingLines(normalized);
  const lines = stripped.split('\n');
  const issues: MainSpecStructureIssue[] = [];
  const requirementLines = new Map<string, number>();

  const requirementsHeaderIndex = lines.findIndex(line => REQUIREMENTS_SECTION_HEADER.test(line));
  let requirementsEndIndex = lines.length;

  if (requirementsHeaderIndex !== -1) {
    for (let i = requirementsHeaderIndex + 1; i < lines.length; i++) {
      if (TOP_LEVEL_SECTION_HEADER.test(lines[i])) {
        requirementsEndIndex = i;
        break;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (DELTA_HEADER.test(line)) {
      issues.push({
        kind: 'delta-header',
        line: i + 1,
        header: trimmed,
        message:
          `メイン仕様に差分ヘッダー "${trimmed}" が含まれています。` +
          '差分ヘッダーは openspec/changes/<name>/specs/<capability-path>/spec.md 内でのみ有効です。' +
          'メイン仕様では ## Requirements セクションを途中で切り詰めます。',
      });
      continue;
    }

    const requirementMatch = line.match(REQUIREMENT_HEADER);
    if (!requirementMatch) {
      continue;
    }

    const insideRequirements =
      requirementsHeaderIndex !== -1 &&
      i > requirementsHeaderIndex &&
      i < requirementsEndIndex;

    if (!insideRequirements) {
      issues.push({
        kind: 'requirement-outside-requirements',
        line: i + 1,
        header: trimmed,
        message:
          `要件ヘッダー "${trimmed}" がメインの ## Requirements セクション外にあります。` +
          'メイン仕様ではそのセクション内の要件だけを解析するため、この要件は現在 validate、list、archive から見えません。',
      });
      continue;
    }

    const requirementName = requirementMatch[1].trim();
    const previousLine = requirementLines.get(requirementName);
    if (previousLine !== undefined) {
      issues.push({
        kind: 'duplicate-requirement',
        line: i + 1,
        header: trimmed,
        message:
          `要件ヘッダー "${trimmed}" は ${previousLine} 行目で宣言された要件と重複しています。` +
          '仕様の更新時に別のブロックを失わないよう、要件名は一意でなければなりません。',
      });
    } else {
      requirementLines.set(requirementName, i + 1);
    }
  }

  return issues;
}

export function stripFencedCodeBlocksPreservingLines(content: string): string {
  const lines = content.split('\n');
  const mask = buildCodeFenceMask(lines);
  return lines.map((line, i) => (mask[i] ? '' : line)).join('\n');
}
