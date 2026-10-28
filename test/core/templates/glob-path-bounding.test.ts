// Every workflow that turns a glob output into a concrete write path must keep
// that path inside `changeRoot` (#2099). update-change always did; propose,
// ff-change and continue-change chose a path with no containment rule, so a
// capability path such as `../../x`, or a symlinked directory under `specs/`,
// would be written outside the change.

import { describe, expect, it } from 'vitest';

import {
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFfChangeSkillTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxUpdateCommandTemplate,
  getUpdateChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { resolveOptionalWorkflows } from '../../../src/core/templates/optional-workflow.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';

const withAllWorkflows = (body: string) =>
  resolveOptionalWorkflows(body, new Set<string>(ALL_WORKFLOWS));

/** Lines that tell the agent to pick a concrete path for a glob output. */
const PATH_CHOICE = /具体的なパスを選び/u;

/**
 * The containment rule for a write that may land on an existing file. A
 * destination that is itself a symlink to a file outside `changeRoot` passes a
 * parent-only check, so the file is resolved too.
 */
const BOUND =
  /親ディレクトリと、?(?:既存ファイルの場合はファイル自体|既存ファイル自体)のシンボリックリンクを解決しても `changeRoot` 内に収まる/u;

/**
 * update-change creates its file with an operation that fails if the target
 * exists - a symlink included - so resolving the parents is enough there.
 */
const CREATE_ONLY_BOUND =
  /親ディレクトリのシンボリックリンクを解決しても `changeRoot` 内に収まる/u;

const boundFor = (label: string) => (label.startsWith('update-change') ? CREATE_ONLY_BOUND : BOUND);

/** Every surface that writes glob artifacts, skill and slash-command alike. */
const SURFACES: Array<[label: string, body: string]> = [
  ['propose skill', withAllWorkflows(getOpsxProposeSkillTemplate().instructions)],
  ['propose command', withAllWorkflows(getOpsxProposeCommandTemplate().content)],
  ['ff-change skill', withAllWorkflows(getFfChangeSkillTemplate().instructions)],
  ['ff-change command', withAllWorkflows(getOpsxFfCommandTemplate().content)],
  ['continue-change skill', withAllWorkflows(getContinueChangeSkillTemplate().instructions)],
  ['continue-change command', withAllWorkflows(getOpsxContinueCommandTemplate().content)],
  ['update-change skill', withAllWorkflows(getUpdateChangeSkillTemplate().instructions)],
  ['update-change command', withAllWorkflows(getOpsxUpdateCommandTemplate().content)],
  ['explore skill', withAllWorkflows(getExploreSkillTemplate().instructions)],
  ['explore command', withAllWorkflows(getOpsxExploreCommandTemplate().content)],
];

/** Where a line tells the agent to write. The bound must come before it. */
const WRITE = /書き込みます/u;

/**
 * The bound has to be checked before the write, or an escaping path is already
 * written by the time it is verified. A line with no write (update-change
 * writes in a later step) only needs the bound.
 */
function expectBoundBeforeWrite(label: string, line: string): void {
  const boundAt = line.search(boundFor(label));
  expect(boundAt, label).toBeGreaterThanOrEqual(0);
  const writeAt = line.search(WRITE);
  if (writeAt !== -1) {
    expect(writeAt, `${label}: writes before checking the bound`).toBeGreaterThan(boundAt);
    expect(line, `${label}: no instruction to refuse an escaping path`).toContain(
      '停止してユーザーへ伝え'
    );
  }
}

/** Every place a body hands artifact creation to another skill or command. */
const DELEGATION = /作成を(?:委任している場合|委任する指示|委ねる場合)/g;

/**
 * A delegated writer is a write too. It may run only after the path it writes
 * to has been chosen and checked, and only if it can write exactly there.
 * Returns each delegation as [offset, the sentence that states it].
 */
function delegations(body: string): Array<[number, string]> {
  return [...body.matchAll(DELEGATION)].map((match) => {
    const start = match.index ?? 0;
    const end = body.slice(start).search(/\n/);
    return [start, body.slice(start, end === -1 ? undefined : start + end)];
  });
}

describe('glob output paths stay inside changeRoot (#2099)', () => {
  it.each(SURFACES)('%s bounds every concrete-path choice', (label, body) => {
    const choices = body.split('\n').filter((line) => PATH_CHOICE.test(line));

    expect(choices, `${label}: no concrete-path line found`).toHaveLength(1);
    expectBoundBeforeWrite(label, choices[0]);
  });

  it.each(SURFACES)('%s chooses and checks the path before any delegated writer runs', (label, body) => {
    const choiceAt = body.search(PATH_CHOICE);
    const found = delegations(body);
    expect(found.length, `${label}: no delegated-creation rule found`).toBeGreaterThan(0);

    for (const [at, sentence] of found) {
      // Bound to one path, and refuses rather than letting it write elsewhere.
      expect(sentence, label).toMatch(/(?:書き込める|守れる)(?:とき|場合)だけ/u);
      expect(sentence, label).toMatch(/停止/u);
      // The creation step's delegation comes after the choice it depends on.
      // The only one allowed earlier is continue-change's backfill, which
      // names the path its own preceding bullet checked.
      if (at < choiceAt) {
        expect(sentence, `${label}: delegates before choosing the path`).toContain(
          '確認済みのパス'
        );
      }
    }
    expect(
      found.some(([at]) => at > choiceAt),
      `${label}: the creation step does not bound its delegated writer`
    ).toBe(true);
  });

  // A delegated writer has already created the artifact; writing the template
  // over it afterwards would replace what it made.
  it.each(SURFACES.filter(([label]) => !label.startsWith('update-change')))(
    '%s writes the template only when creation was not delegated',
    (label, body) => {
      const templateWrite = /(?:その(?:出力)?|決めた出力)パスへ書き込みます/u;
      const lines = body.split('\n');
      let writes = 0;

      lines.forEach((line, index) => {
        // Judged sentence by sentence: explore states both branches in one
        // paragraph, and the delegation sentence names the same path for the
        // delegated writer.
        for (const sentence of line.split(/(?<=。)/u)) {
          if (!templateWrite.test(sentence) || /作成を(?:委任|委ね)/u.test(sentence)) continue;
          writes++;
          if (/それ以外/u.test(sentence.slice(0, sentence.search(templateWrite)))) continue;
          // Otherwise nested under a bullet that opens the Otherwise branch.
          const indent = line.search(/\S/u);
          const parent = lines
            .slice(0, index)
            .reverse()
            .find((candidate) => candidate.trim() !== '' && candidate.search(/\S/u) < indent);
          expect(parent, `${label}: template write outside the Otherwise branch`).toMatch(
            /^\s*- それ以外/u
          );
        }
      });
      expect(writes, `${label}: no template write found`).toBeGreaterThan(0);
    }
  );

  it.each([
    ['continue-change skill', withAllWorkflows(getContinueChangeSkillTemplate().instructions)],
    ['continue-change command', withAllWorkflows(getOpsxContinueCommandTemplate().content)],
  ])('%s verifies the output after either creation branch', (label, body) => {
    const lines = body.split('\n');
    const delegation = lines.findIndex((line) => line.includes('`instruction` がスキルやコマンドへ作成を委任している場合は、その出力パス'));
    const verify = lines.findIndex((line) =>
      line.includes('どちらの場合も、その出力パスにアーティファクトが存在することを確認します')
    );
    expect(verify, label).toBeGreaterThan(delegation);
    // Same depth as the two branches, so it runs after whichever was taken.
    expect(lines[verify].search(/\S/u), label).toBe(lines[delegation].search(/\S/u));
  });

  it.each(SURFACES)('%s never targets the glob itself', (label, body) => {
    // A glob is a pattern, not a file: nothing may be written to, or verified
    // at, `resolvedOutputPath` unless it is a concrete path.
    expect(body, label).not.toContain('exists at `resolvedOutputPath`');
    expect(body, label).not.toContain('write it to `resolvedOutputPath`');
    expect(body, label).not.toMatch(/`resolvedOutputPath` に(?:ファイルが存在する|書き込みます)/u);
  });

  it.each(SURFACES)('%s restates delegation only with the same bound', (label, body) => {
    // The artifact-creation guidelines repeat the delegation rule where agents
    // skim; a bare "invoke it instead" there would undo the ordering above.
    for (const line of body
      .split('\n')
      .filter((candidate) => candidate.includes('作成を指示'))) {
      expect(line, label).toContain('出力パスを選択・確認し');
    }
  });

  // continue-change alone backfills a half-written glob artifact: it compares
  // expected paths against what exists instead of choosing a new one, so the
  // bound has to sit on that bullet too.
  it.each([
    ['continue-change skill', withAllWorkflows(getContinueChangeSkillTemplate().instructions)],
    ['continue-change command', withAllWorkflows(getOpsxContinueCommandTemplate().content)],
  ])('%s bounds the partly-written-artifact check', (label, body) => {
    const bullets = body
      .split('\n')
      .filter((line) => line.includes('各想定パスを `changeRoot` を基準に解決'));

    expect(bullets, `${label}: partial-artifact bullet missing`).toHaveLength(1);
    expect(bullets[0], label).toMatch(BOUND);
    // The write is the next bullet, so the refusal has to sit there.
    const lines = body.split('\n');
    const next = lines[lines.indexOf(bullets[0]) + 1];
    expect(next, label).toContain('確認に失敗したパスへは書き込まず');
    expect(next.indexOf('書き込まず'), label).toBeLessThan(next.indexOf('不足するファイルだけを作成'));
    // A delegated writer filling the gap is held to the same checked paths.
    expect(next, label).toContain('確認済みのパスへ各ファイルを書き込めるときだけ呼び出す');
  });
});
