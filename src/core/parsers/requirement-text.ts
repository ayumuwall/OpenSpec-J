/**
 * Shared, fence-aware requirement-reading helpers.
 *
 * The requirement reader used to be implemented twice — once for main specs
 * (`MarkdownParser.parseRequirements`) and once for change deltas
 * (`Validator.extractRequirementText` / `countScenarios`) — and the two drifted
 * apart. These helpers are the single source of truth for requirement-body
 * extraction, scenario counting, and `SHALL`/`MUST` detection in
 * `validate <change>`, `validate <spec>`, and `archive`.
 */

// Re-exported so existing importers keep working; the single implementation
// lives in code-fence.ts.
export { buildCodeFenceMask } from './code-fence.js';
import { buildCodeFenceMask } from './code-fence.js';

/** Lines that look like `**ID**: ...` / `**Priority**: ...` metadata. */
const METADATA_LINE = /^\*\*[^*]+\*\*:/;

/** Any markdown header line — the boundary where a requirement body ends. */
const HEADER_LINE = /^#{1,6}\s/;

/**
 * A level-4 header. Deliberately matches ANY `####` header, not only
 * `#### Scenario:` — the spec path treats every level-4 child of a requirement
 * as a scenario, so the delta counter must too (parity). The delta/loss path
 * reuses this exact constant via `scenarioHeaderAt` in requirement-blocks.ts;
 * keep both paths on it rather than reintroducing a separate `Scenario:` regex.
 * A header alone is not yet a scenario on either path: see hasScenarioBody.
 */
export const SCENARIO_HEADER = /^####\s+/;

/** A header at scenario level or above (`#` to `####`): where a scenario body ends. */
const SCENARIO_BODY_END = /^#{1,4}\s/;

/**
 * Whether a scenario's body has content. The spec path
 * (`MarkdownParser.parseScenarios`) drops a scenario whose body is empty, so
 * the delta counter must too (parity): otherwise `validate` accepts a
 * requirement whose only scenario is a bare header, and archive rejects it when
 * it validates the rebuilt spec.
 */
export function hasScenarioBody(body: string): boolean {
  return body.trim().length > 0;
}

/**
 * The one predicate for normative-keyword detection. Matches `SHALL` or `MUST`
 * as whole words so the change-delta reader and the schema-based reader accept
 * and reject identical text.
 */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

/**
 * Extract the full requirement body from the lines that follow a
 * `### Requirement:` header (the lines may include scenarios and fenced code).
 *
 * Captures every body line from the start up to the first header found on a
 * non-fenced line — usually the first `#### Scenario:`, but also a stray `###`
 * divider the delta reader absorbed into the block — skipping blank lines and
 * any line inside a fenced code block. `**metadata**:` lines are skipped only
 * when other body text remains: a requirement written entirely as
 * `**Constraint**: The system MUST ...` keeps that line as its body. Captured
 * lines are trimmed and joined with newlines so a requirement whose text wraps
 * across lines — or whose `SHALL`/`MUST` lands on a later line — is read in
 * full.
 */
export function extractRequirementBody(bodyLines: string[]): string {
  const mask = buildCodeFenceMask(bodyLines);
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < bodyLines.length; i++) {
    if (mask[i]) continue; // inside a fenced code block
    const line = bodyLines[i];
    if (HEADER_LINE.test(line)) break; // first scenario or stray divider
    const trimmed = line.trim();
    if (trimmed.length === 0) continue; // blank
    if (METADATA_LINE.test(trimmed)) {
      metadata.push(trimmed); // **ID**: / **Priority**: ...
      continue;
    }
    captured.push(trimmed);
  }

  if (captured.length > 0) return captured.join('\n');
  return metadata.join('\n'); // metadata-only body: the metadata IS the body
}

/**
 * Parser/display fallback for a requirement block with no body text. This is
 * what lets a bare `### The system SHALL ...` header remain readable on the
 * spec path (the title is the requirement). Validator body-keyword checks for
 * canonical `### Requirement:` blocks use `extractRequirementBody` directly so
 * a keyword that appears only in the header still receives the #1156/#1280
 * body-keyword hint.
 */
export function extractRequirementText(headerTitle: string, bodyLines: string[]): string {
  return extractRequirementBody(bodyLines) || headerTitle.trim();
}

/**
 * Count the real scenarios in a requirement block: `#### ` headers on non-fenced
 * lines whose body has content. A `#### Scenario:` that lives inside a fenced
 * example is not a real scenario and is not counted.
 */
export function countScenarios(bodyLines: string[]): number {
  return readScenarioBodies(bodyLines).filter(hasScenarioBody).length;
}

/**
 * 手順キーワードは大文字小文字を問わない太字（**WHEN**、**Given:**）か、
 * 装飾のない大文字（WHEN）を認める。太字は手順を明示するが、
 * 通常の when/then は説明文なので数えない。SHALL/MUST 検査も同じ理由で大文字のみ。
 * 太字は ** と __ に対応する。_ は単語文字なので、\b を使う通常語の式では
 * __WHEN__ を検出できない。
 */
const BOLD_TRIGGER_STEP = /(?:\*\*|__)(?:WHEN|GIVEN):?(?:\*\*|__)/i;
const BARE_TRIGGER_STEP = /\b(?:WHEN|GIVEN)\b/;
const BOLD_OUTCOME_STEP = /(?:\*\*|__)THEN:?(?:\*\*|__)/i;
const BARE_OUTCOME_STEP = /\bTHEN\b/;

/** フェンス外の本文から判定する、シナリオの条件と結果。 */
export interface ScenarioStepCoverage {
  hasTrigger: boolean;
  hasOutcome: boolean;
}

/**
 * parseScenarioBlocks が返す見出し付きブロックに、フェンス外の
 * 条件（WHEN/GIVEN）と結果（THEN）があるか判定する。
 * AND は既存の手順を続けるだけなので、どちらの代わりにもならない。
 * フェンス内は例として除外し、要件本文の抽出と同じマスクを使う。
 */
export function scenarioStepCoverage(scenarioRaw: string): ScenarioStepCoverage {
  const lines = scenarioRaw.replace(/\r\n?/g, '\n').split('\n');
  const mask = buildCodeFenceMask(lines);
  let hasTrigger = false;
  let hasOutcome = false;
  // 0行目はシナリオ名なので、見出し内の THEN などを手順として数えない。
  for (let i = 1; i < lines.length; i++) {
    if (mask[i]) continue;
    const line = lines[i];
    if (BOLD_TRIGGER_STEP.test(line) || BARE_TRIGGER_STEP.test(line)) hasTrigger = true;
    if (BOLD_OUTCOME_STEP.test(line) || BARE_OUTCOME_STEP.test(line)) hasOutcome = true;
  }
  return { hasTrigger, hasOutcome };
}

/** Count the `#### ` headers in a requirement block that have no body under them. */
export function countEmptyScenarios(bodyLines: string[]): number {
  return readScenarioBodies(bodyLines).filter((body) => !hasScenarioBody(body)).length;
}

/**
 * The body of each scenario in a requirement block. A body runs to the next
 * non-fenced header of level 4 or above, the boundary the spec path uses, so a
 * fenced block or a deeper `#####` header is part of it.
 */
function readScenarioBodies(bodyLines: string[]): string[] {
  const mask = buildCodeFenceMask(bodyLines);
  const bodies: string[] = [];
  for (let i = 0; i < bodyLines.length; i++) {
    if (mask[i] || !SCENARIO_HEADER.test(bodyLines[i])) continue;
    let end = i + 1;
    while (end < bodyLines.length && (mask[end] || !SCENARIO_BODY_END.test(bodyLines[end]))) end++;
    bodies.push(bodyLines.slice(i + 1, end).join('\n'));
  }
  return bodies;
}
