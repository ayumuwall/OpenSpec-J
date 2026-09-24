import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  getVerifyChangeSkillTemplate,
  getOpsxVerifyCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

// #1959: verify treated every "### Requirement:" in a change's delta specs as
// behavior that must exist, whichever section it sat under. A REMOVED
// requirement that was removed correctly came back as CRITICAL "Requirement not
// found" with the recommendation to implement it, so an agent following the
// report restored what the change had just deleted.
const bodies: Array<[string, string]> = [
  ['skill', getVerifyChangeSkillTemplate().instructions],
  ['command', getOpsxVerifyCommandTemplate().content],
  // The committed skills.sh mirror is what `npx skills add` installs.
  [
    'committed skill file',
    readFileSync(new URL('../../../skills/openspec-verify-change/SKILL.md', import.meta.url), 'utf8'),
  ],
];

function section(body: string, start: string, end: string, label: string): string {
  const from = body.indexOf(start);
  const to = body.indexOf(end, from + start.length);
  expect(from, `${label}: "${start}" not found`).toBeGreaterThanOrEqual(0);
  expect(to, `${label}: "${end}" not found after "${start}"`).toBeGreaterThan(from);
  return body.slice(from, to);
}

describe('verify checks each requirement by its delta operation', () => {
  it.each(bodies)('%s: classifies requirements by delta section before checking them', (label, body) => {
    const coverage = section(body, '**仕様範囲**', '6. **正確性を検証**', label);

    // RENAMED entries carry no "### Requirement:" heading, so a rename-only
    // delta must not read as empty.
    expect(coverage, label).toContain('または `## RENAMED Requirements` 配下の `FROM:` / `TO:` の組');
    for (const header of ['## ADDED', '## MODIFIED', '## REMOVED', '## RENAMED Requirements']) {
      expect(coverage, label).toContain(header);
    }
    // The unscoped loop is what produced the bug.
    expect(coverage, label).not.toMatch(/^\s*- For each requirement:$/m);
  });

  it.each(bodies)('%s: reports a missing requirement only for ADDED or MODIFIED', (label, body) => {
    const coverage = section(body, '**仕様範囲**', '6. **正確性を検証**', label);
    const addedOrModified = section(coverage, '- ADDED または MODIFIED の各要件について', '- REMOVED 要件', label);

    expect(addedOrModified, label).toContain('重大な問題を追加:「要件が見つかりません: <要件名>」');
  });

  it.each(bodies)('%s: inverts the check for a REMOVED requirement', (label, body) => {
    const coverage = section(body, '**仕様範囲**', '6. **正確性を検証**', label);
    const removed = section(coverage, '- REMOVED 要件', '- RENAMED の各項目', label);

    expect(removed, label).toContain('実装が見つからないことが期待する結果です。');
    expect(removed, label).toContain('REMOVED 要件を「要件が見つかりません」と報告');
    expect(removed, label).toContain('重大な問題を追加:「削除された要件の実装が残っています: <要件名>」');
    expect(removed, label).not.toContain('Recommendation: "Implement');
  });

  it.each(bodies)('%s: does not report the old name of a RENAMED requirement as missing', (label, body) => {
    const renamed = section(body, '- RENAMED の各項目', '6. **正確性を検証**', label);

    expect(renamed, label).toContain('FROM 名を欠落として報告せず');
    expect(renamed, label).toContain('コードのシンボル、識別子、ファイル名の改名も要求しません');
  });

  // A rename keeps behavior, so a rename-only change must still prove the
  // behavior exists before verify can call it ready. Its evidence is the
  // baseline requirement in the main spec, not the RENAMED entry itself.
  it.each(bodies)('%s: verifies the unchanged behavior of a RENAMED requirement against its baseline', (label, body) => {
    const renamed = section(body, '- RENAMED の各項目', '6. **正確性を検証**', label);

    expect(renamed, label).toContain('TO 要件が元の振る舞いを保っているか確認');
    expect(renamed, label).toContain('`<planningHome.root>/openspec/specs/<capability-path>/spec.md`');
    expect(renamed, label).toContain('FROM 名の要件を使い、本仕様が同期済みで FROM 名がない場合だけ TO 名の要件を使います。');
    expect(renamed, label).toContain('その本文とシナリオが、TO 要件に維持される振る舞いの証拠です。');
    expect(renamed, label).toContain('その振る舞いをコードベースで探し、実装が維持されているか評価します。');
    expect(renamed, label).toContain('重大な問題を追加:「改名された要件が見つかりません: <TO 名>」');
    expect(body, label).toContain('- 改名された要件の振る舞いが実装されていない');
    expect(renamed, label).toContain('TO 名が MODIFIED にもある場合は、そちらで MODIFIED の本文に照らして確認');
  });

  it.each(bodies)('%s: never counts an unchecked rename as passing', (label, body) => {
    const renamed = section(body, '- RENAMED の各項目', '6. **正確性を検証**', label);

    expect(renamed, label).toContain('基準となる要件が見つからない、または読み取れない場合は、その項目の **仕様範囲** を理由付きで未検証');
    expect(renamed, label).toContain('確認していない改名を合格として数えません。');
    expect(body, label).toContain('（RENAMED の各項目は基準となる振る舞いに照らして確認済み）');
  });

  it.each(bodies)('%s: maps implementation and scenarios only for ADDED or MODIFIED requirements', (label, body) => {
    const correctness = section(body, '6. **正確性を検証**', '7. **一貫性を検証**', label);

    expect(correctness, label).toContain('- 仕様差分の ADDED または MODIFIED の各要件について');
    expect(correctness, label).toContain('- 仕様差分の ADDED または MODIFIED 要件に含まれる各シナリオ');
    expect(correctness, label).toContain('REMOVED 要件のシナリオは、振る舞いの削除が目的なのでスキップ');
    expect(correctness, label).not.toContain('- For each requirement from delta specs:');
    expect(correctness, label).not.toContain('- For each scenario in delta specs');
  });
  // With #1732's "Not verified" rule, a change with nothing to add or modify
  // left both correctness checks empty, which read as unverified and withheld
  // readiness. That is the exact case #1959 reports.
  it.each(bodies)('%s: treats the correctness checks of a removal-only change as not applicable', (label, body) => {
    const correctness = section(body, '6. **正確性を検証**', '**要件実装マッピング**:', label);

    expect(correctness, label).toContain('仕様差分が読み取り可能で、REMOVED または RENAMED 要件が 1 つ以上あり、ADDED と MODIFIED 要件がない場合');
    // An empty or unparseable delta must not pass as a removal-only change.
    expect(correctness, label).toContain('解析できる要件がまったくない仕様差分は、削除だけの変更ではなく利用不能な証拠なので、これらを未検証とします。');
    expect(correctness, label).toContain('**要件実装マッピング** と **シナリオの対象範囲** を **対象外**');
    expect(correctness, label).toContain('この 2 つのチェックを未検証にしません');
    expect(body, label).toContain('読み取れる仕様差分に REMOVED または RENAMED 要件があり、ADDED と MODIFIED 要件がない変更の正確性チェックも **対象外** です（手順 6 を参照）。');
  });

  it.each(bodies)('%s: does not treat artifacts or replacement code as the removed behavior', (label, body) => {
    const removed = section(body, '- REMOVED 要件', '- RENAMED の各項目', label);

    expect(removed, label).toContain('`openspec/` のアーティファクトや文書、Migration 注記や ADDED 要件だけに対応するコードに一致しても、それだけでは証拠になりません。');
    expect(removed, label).toContain('ADDED 要件と共有しているものも含め、削除対象の振る舞いをまだ提供するコード経路があれば報告します。');
  });

  it.each(bodies)('%s: counts removals separately from covered requirements', (label, body) => {
    expect(body, label).toContain('N に数えるのは ADDED と MODIFIED 要件だけです。REMOVED と RENAMED 要件は別に報告');
    expect(body, label).toContain('正確性のセルに `対象外（ADDED または MODIFIED 要件なし）`');
  });
});
