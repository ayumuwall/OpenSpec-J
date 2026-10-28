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

    expect(removed, label).toContain('元の要件の振る舞いを検索した後に限り、実装が見つからないことが期待する結果です。');
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
    expect(body, label).toContain('有効な元の要件を持つ REMOVED と RENAMED の各項目は、その振る舞いに照らして確認');
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

  // #2067: the REMOVED branch said only "search codebase for the removed
  // behavior". A REMOVED block carries just the requirement name plus Reason
  // and Migration notes, so the search started from the heading alone - and
  // because an absent match is the passing result here, an implementation
  // written in different vocabulary read as a clean removal. The RENAMED
  // branch beside it already loaded the baseline from the main spec first.
  it.each(bodies)('%s: reads the removed requirement baseline before searching', (label, body) => {
    const removed = section(body, '- REMOVED 要件は', '- RENAMED の各項目', label);

    expect(removed, label).toContain('REMOVED ブロックには要件名と `**Reason**`・`**Migration**` の注記だけがあり');
    expect(removed, label).toContain('`<planningHome.root>/openspec/specs/<capability-path>/spec.md`');
    expect(removed, label).toContain('削除対象の振る舞いの証拠は本文とシナリオ');
    expect(removed, label).toContain('要件名だけで検索してはいけません');
    // Exact normalized name only (#2098): after a sync, a near-named ADDED
    // replacement must not be read as the removed requirement's baseline.
    expect(removed, label).toContain('正規化した要件名を完全一致で照合');
    expect(removed, label).toContain('大文字・小文字を区別');
    expect(removed, label).toContain('似た名前は一致としません');
    expect(removed, label).not.toContain('near-equivalent');
  });

  // The baseline read, the history fallback and the search have to stay in
  // that order. Each index is checked present first: an unguarded indexOf
  // returns -1, and -1 is less than everything, so a reworded sentence would
  // satisfy a bare ordering comparison and silently retire this guard.
  it.each(bodies)('%s: orders the baseline read, then the fallback, then the search', (label, body) => {
    const removed = section(body, '- REMOVED 要件は', '- RENAMED の各項目', label);

    const baselineAt = removed.indexOf('検索前に、差分と同じ機能パス');
    const fallbackAt = removed.indexOf("そのファイルの履歴から復元");
    const bailOutAt = removed.indexOf('その項目の **仕様範囲** を理由付きの未検証');
    const searchAt = removed.indexOf('削除対象の振る舞いをコードベースで探します。');

    expect(baselineAt, `${label}: baseline-read sentence missing`).toBeGreaterThanOrEqual(0);
    expect(fallbackAt, `${label}: history fallback missing`).toBeGreaterThanOrEqual(0);
    expect(bailOutAt, `${label}: not-verified bail-out missing`).toBeGreaterThanOrEqual(0);
    expect(searchAt, `${label}: search step missing`).toBeGreaterThanOrEqual(0);

    // The main spec is the primary source; history is only its fallback.
    expect(baselineAt, `${label}: fallback must follow the primary read`).toBeLessThan(fallbackAt);
    // Bailing out must be reachable before the search, not two bullets after
    // the rule that says finding nothing is expected.
    expect(bailOutAt, `${label}: bail-out must precede the search`).toBeLessThan(searchAt);
  });

  // The git example is the one piece of the fallback an agent runs verbatim.
  // `git log` treats an unmatched pathspec as success and prints nothing, so a
  // path missing the `openspec/specs/` prefix reads as "no baseline in
  // history" and sends every post-sync removal to the not-verified branch.
  it.each(bodies)('%s: gives a runnable, store-aware history command', (label, body) => {
    const removed = section(body, '- REMOVED 要件は', '- RENAMED の各項目', label);

    expect(removed, label).toContain('git -C "<planningHome.root>" log -p -- openspec/specs/<capability-path>/spec.md');
    // `rev:path` resolves from the repository root, not from `-C`; the `./`
    // keeps it relative to a planning root that is a subdirectory (monorepo).
    expect(removed, label).toContain('git -C "<planningHome.root>" show <commit>^:./openspec/specs/<capability-path>/spec.md');
    expect(removed, label).not.toMatch(/show <commit>\^:openspec\//);
    // An unquoted planning root splits on spaces and runs git in the wrong place.
    expect(removed, label).not.toMatch(/git -C <planningHome\.root>/);
    expect(removed, label).toContain('空の出力はパス指定に一致しなかった可能性');
    // A bare `<capability-path>/spec.md` pathspec matches nothing: the
    // placeholder is defined relative to `specs/`.
    expect(removed, label).not.toMatch(/git[^`\n]*log[^`\n]*--\s+<capability-path>/);
    // History must be read from the planning home, which may be a store repo
    // rather than the current checkout (#1702).
    expect(removed, label).not.toMatch(/\bgit log -p -- openspec/);
  });

  it.each(bodies)('%s: never counts an unsearched removal as passing', (label, body) => {
    const removed = section(body, '- REMOVED 要件は', '- RENAMED の各項目', label);

    expect(removed, label).toContain('その項目の **仕様範囲** を理由付きの未検証とし、そこで停止');
    expect(removed, label).toContain('検索せず、未検索の削除を合格扱いにしてはいけません');
    // A baseline that only restates its title gives no more vocabulary than
    // the heading did, which is the #2067 failure mode in miniature.
    expect(removed, label).toContain('本文が見出しの言い換えだけでシナリオもない元の要件');
    expect(removed, label).toContain('欠落と同じく証拠として使えません');
    // Reworded re-introductions must fail too, not just the exact old
    // sentence: the bug was searching from the name, however it is phrased.
    expect(removed, label).not.toMatch(/Search\b[^.\n]*\bfor the removed behavior/i);
    expect(removed, label).not.toMatch(/Finding no implementation is the expected result[.;]/);
  });

  // Step 6 asserts that Spec Coverage carries the evidence for a removal-only
  // change. That claim has to leave room for the entry the branch above marks
  // not verified, or it reads as licence to drop the mark.
  it.each(bodies)('%s: does not claim a baseline check that may not have happened', (label, body) => {
    expect(body, label).toContain('有効な元の要件を持つ REMOVED と RENAMED の各項目は、その振る舞いに照らして確認');
    expect(body, label).toContain('すでに未検証とした項目は未検証のまま保持');
    // The scorecard must model the not-verified wording, not only the
    // confirming kind.
    expect(body, label).toContain('「削除 1 件は未検証（元の要件を取得できない）」');
  });

  it.each(bodies)('%s: counts removals separately from covered requirements', (label, body) => {
    expect(body, label).toContain('N に数えるのは ADDED と MODIFIED 要件だけです。REMOVED と RENAMED 要件は別に報告');
    expect(body, label).toContain('正確性のセルに `対象外（ADDED または MODIFIED 要件なし）`');
  });
});
