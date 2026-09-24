import { describe, expect, it } from 'vitest';

import {
  getUpdateChangeSkillTemplate,
  getOpsxUpdateCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { STORE_SELECTION_GUIDANCE } from '../../../src/core/templates/workflows/store-selection.js';
import { PROJECT_ROOT_GUARD } from '../../../src/core/templates/workflows/project-root.js';
import { resolveOptionalWorkflows } from '../../../src/core/templates/optional-workflow.js';
import { ALL_WORKFLOWS, CORE_WORKFLOWS } from '../../../src/core/profiles.js';

const skill = getUpdateChangeSkillTemplate();
const command = getOpsxUpdateCommandTemplate();

const render = (workflows: readonly string[]): Array<[string, string]> => {
  const installed = new Set<string>(workflows);
  return [
    ['skill', resolveOptionalWorkflows(skill.instructions, installed)],
    ['command', resolveOptionalWorkflows(command.content, installed)],
  ];
};

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body. Templates carry optional-workflow
// conditionals, so a body is only meaningful once resolved against a workflow
// set — these are the bodies a profile with every workflow installed receives.
const bodies = render(ALL_WORKFLOWS);
const coreBodies = render(CORE_WORKFLOWS);

// The load-bearing sentence of step 4 and the whole of step 5 are pinned
// verbatim. #1836 happened because a single verb ("Apply") in step 4 silently
// re-answered a question step 5 had already answered, so any reword of either
// passage has to come back through this test and re-argue the contract rather
// than just regenerate a parity hash.
const STEP_FOUR_DRAFT_RULE =
  '   - 要求された編集案をファイルではなく会話内で作成し、何が変わるかを明確にします。書き込みはすべて手順 5 で行います。';

const STEP_FIVE = `5. **一度に 1 つのアーティファクトを確認して適用します**
   - このワークフローのアーティファクトへの書き込みは、すべてこの手順で行います。これより前の手順では編集しません。
   - 手順 4 で作成した要求への編集案も含め、各修正案と理由を示します。ユーザーの確認後にだけ書き込みます。
   - ユーザーがリビジョンを拒否した場合は、リビジョンを書き込まないでください。そのアーティファクトは変更しないでください。
   - 大幅な書き換えが必要な場合は、まずそのアーティファクトのルールとテンプレートを取得します。
     \`\`\`bash
     openspec instructions "<artifact-id>" --change "<name>" --json
     \`\`\`

`;

// Every mention of writing or applying allowed to live OUTSIDE step 5. Each is
// a scope rule, a hand-off to another workflow, or the gate itself - none
// authorizes a write here. Each is spelled in full context: a bare fragment
// such as "already applied" would also erase "treat the requested edit as
// already applied" before any check could see it.
const SANCTIONED_OUTSIDE_STEP_FIVE = [
  STEP_FOUR_DRAFT_RULE,
  'ユーザーが特定のリビジョン (「デザインは現在 X を使用しています」) を要求した場合、それが編集の開始点となります。',
  '`resolvedOutputPath` には書き込まないでください。',
  '- `existingOutputPaths` にある具体的なファイルだけを編集し、グロブの `resolvedOutputPath` には決して書き込みません。',
  'グロブの `resolvedOutputPath` は書き込み先にできません。',
  '書き込み先がすでに存在すれば失敗する作成操作を使います。',
  '書き込む前に、すべての編集についてユーザーの確認を得ます。',
  '`/opsx:apply`',
  '(tasks checked off / already applied)',
];

// Authorizations need not share any vocabulary with writing ("land the
// requested edit", "it goes straight into the file"), but they must name what
// they authorize. Outside the pinned draft rule and step 3's framing, nothing
// may talk about the requested edit at all.
const REQUESTED_EDIT =
  /\brequested (?:edit|revision|change)|\buser's (?:edit|revision|change)|\bstarting edit\b|要求された編集|要求された変更|要求された修正|ユーザーの編集|ユーザーの修正|編集の開始点/i;

// Synonyms matter as much as the original verb: "commit the edit", "overwrite
// the artifact", "reapply it" all reintroduce #1836 while dodging a naive
// /\bwrite\b/. No leading \b, so over-/re- prefixed forms are caught too.
const WRITE_VERB =
  /(?:over|re)?writ(?:e|es|ing|ten)\b|(?:re)?appl(?:y|ies|ied|ying)\b|\b(?:commit|commits|committing|save|saves|saving|persist|persists|persisting|flush|flushes|flushing|emit|emits|emitting)\b|書き込(?:む|み|ま)|上書き|適用(?:する|します|しなさい)|保存(?:する|します|しなさい)/i;

// Verb-free ways to say the same thing: "perform the edit", "put it in place",
// "carry it out", anything "to disk". Step 5 is the only passage entitled to
// this vocabulary, and it is excluded before these run.
const WRITE_PHRASE =
  /\bperform(?:s|ed|ing)?\b|\bcarr(?:y|ies|ied|ying) out\b|\bin place\b|\bto disk\b/i;

// An authorization needs no write verb at all - "do it now, without asking" is
// enough. There is no legitimate use of this phrasing in this workflow.
const CONSENT_BYPASS =
  /without (?:asking|confirming|confirmation)|do not wait for confirmation|no confirmation (?:is )?(?:needed|required)|needs? no confirm|exempt from (?:the )?confirm|skip(?:s|ping)? (?:the )?confirm|確認(?:せず|なし|不要|は不要|を省略|を待たず)/i;

// Slice one region out of a workflow body so an assertion about where a rule
// lives cannot be satisfied by the same words appearing somewhere else. The
// label names the marker, so a renamed heading reports which one went missing.
function section(
  body: string,
  startMarker: string,
  endMarker: string,
  label: string
): string {
  const start = body.indexOf(startMarker);
  const end = body.indexOf(endMarker, start + startMarker.length);
  expect(start, `${label}: missing marker ${startMarker}`).toBeGreaterThanOrEqual(0);
  expect(end, `${label}: missing marker ${endMarker}`).toBeGreaterThan(start);
  return body.slice(start, end);
}

function stepFive(body: string, label: string): string {
  return section(body, '5. **一度に 1 つのアーティファクトを確認して適用します', '6. **次のステップを指示します', `${label} step 5`);
}

// Everything the agent reads except step 5 and the shared store and project-root
// preambles (the root guard says to stop before writing; it authorizes none).
// #1836 lived in step 4, but a sentence in the intro, in step 3, in the
// Guardrails or in the Output section would govern the agent just as well
// while sitting outside any single-step slice. Returns the checks that tripped.
function writeAuthorizationsOutsideStepFive(body: string, label: string): string[] {
  let rest = body
    .split(stepFive(body, label))
    .join('\n')
    .split(STORE_SELECTION_GUIDANCE)
    .join('')
    .split(PROJECT_ROOT_GUARD)
    .join('');
  for (const sanctioned of SANCTIONED_OUTSIDE_STEP_FIVE) {
    rest = rest.split(sanctioned).join('');
  }

  const checks: Array<[string, RegExp]> = [
    ['write verb', WRITE_VERB],
    ['write phrase', WRITE_PHRASE],
    ['consent bypass', CONSENT_BYPASS],
    ['names the requested edit', REQUESTED_EDIT],
    // A leading adverb ("Immediately revise the files ...") must not disarm
    // this - the verb does not have to be the bullet's first token.
    [
      'imperative edit bullet',
      /^\s*-\s*(?:\w+ly,?\s+)?(?:Revise|Edit|Update|Rewrite|Modify|Amend|Patch|Replace)\b/im,
    ],
  ];
  return checks.filter(([, pattern]) => pattern.test(rest)).map(([name]) => name);
}

// Regression for #1836: step 4 said "Apply the requested edit" while step 5 and
// the guardrails said to write only after the user confirms. "Apply" is a write
// verb in this very document - step 5 is titled "Confirm and apply" - so the
// same `/opsx:update "the design now uses X"` either wrote immediately or
// stopped and showed the revision first, depending on which passage the agent
// weighed. Step 5 is the workflow's only gated write path, so its confirmation
// guarantee was unenforceable whenever step 4 governed.
describe('update-change write gate (#1836)', () => {
  it('pins the step 4 draft rule and the whole of step 5', () => {
    for (const [label, body] of bodies) {
      const stepFour = section(
        body,
        '4. **読んで調整**',
        '5. **一度に 1 つのアーティファクトを確認して適用します',
        `${label} step 4`
      );

      expect(stepFour, `${label} step 4`).toContain(STEP_FOUR_DRAFT_RULE);
      // Verbatim, because an exemption bolted onto the gate ("this does not
      // apply to the requested edit") is invisible to any toContain check.
      expect(stepFive(body, label), `${label} step 5`).toBe(STEP_FIVE);
    }
  });

  it('keeps the whole-body confirmation guardrail', () => {
    for (const [label, body] of bodies) {
      // Deleting this one line used to break nothing.
      expect(body, label).toContain('書き込む前に、すべての編集についてユーザーの確認を得ます。');
    }
  });

  it('lets no passage outside step 5 authorize a write', () => {
    for (const [label, body] of bodies) {
      expect(writeAuthorizationsOutsideStepFive(body, label), label).toEqual([]);
    }
  });

  // The guard above only proves something if it trips. Each line goes into a
  // different section of each body (intro, Input, steps 1-4 and 6, Output,
  // Guardrails); every one reintroduces #1836 and must be flagged.
  const MUTATIONS: Array<[anchor: string, injected: string]> = [
    ['3. **リクエストを理解する**', '   - 要求された編集を直ちに反映してください。'],
    ['4. **読んで調整**', '   - アーティファクトへすぐに書き込みます。'],
    ['**ガードレール**', '- ユーザーの修正は確認を待たずに実行してください。'],
    ["一貫性を保ちます。コードは決して編集しないでください。", 'Land the requested edit right away.'],
    ['**入力**:', 'Treat the requested edit as already applied to the artifact.'],
    ['1. **変更を選択する**', '   - Put the requested edit into the artifact now.'],
    ["2. **変更の成果物を取得します**", '   The requested edit goes straight into the file.'],
    ['3. **リクエストを理解する**', '   - Apply the requested edit immediately.'],
    ['4. **読んで調整**', '   - Update the artifact with the requested edit now.'],
    ['6. **次のステップを指示します', '   - Save the revisions first.'],
    ['**出力**', '- The requested edit, already applied during step 4'],
    ['**ガードレール**', '- The requested edit is exempt from confirmation.'],
    ['- 書き込む前に、すべての編集についてユーザーの確認を得ます。', '- The user\'s revision needs no confirmation.'],
  ];

  it.each(MUTATIONS)('flags a write authorization injected after %s', (anchor, injected) => {
    for (const [label, body] of bodies) {
      const at = body.indexOf('\n', body.indexOf(anchor));
      expect(body.indexOf(anchor), `${label}: missing anchor`).toBeGreaterThanOrEqual(0);
      const mutated = `${body.slice(0, at + 1)}${injected}\n${body.slice(at + 1)}`;
      // Still passes the step 5 pin, so only the outside-step-5 scan can catch it.
      expect(stepFive(mutated, label), label).toBe(STEP_FIVE);
      expect(writeAuthorizationsOutsideStepFive(mutated, label), label).not.toEqual([]);
    }
  });
});

describe('update-change templates', () => {
  it('generates the expected skill and command shape (3.1)', () => {
    expect(skill.name).toBe('openspec-update-change');
    expect(skill.description).toContain('コードは編集しません');
    expect(skill.license).toBe('MIT');
    expect(skill.compatibility).toBe('OpenSpec CLI が必要です。');
    expect(skill.metadata).toEqual({ author: 'openspec', version: '1.0' });

    expect(command.name).toBe('OPSX: Update');
    expect(command.category).toBe('Workflow');
    expect(command.tags).toEqual(['workflow', 'artifacts', 'experimental']);
    expect(command.content).toContain('/opsx:update add-auth');

    for (const [label, body] of bodies) {
      expect(body, label).toContain(STORE_SELECTION_GUIDANCE);
      expect(body, label).toContain('openspec list --json');
      expect(body, label).toContain('openspec status --change "<name>" --json');
      expect(body, label).toContain('openspec instructions "<artifact-id>" --change "<name>" --json');
    }
  });

  it('reads artifact ids from status JSON and never branches on hardcoded artifact names (3.2)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('これらを仮定したり、ハードコードされたアーティファクト名に基づいて分岐したりしないでください');
      expect(body, label).toContain('ハードコードされたアーティファクト名で分岐しません');
      expect(body, label).toContain('カスタム スキーマは変更せずに機能する必要があります');
      // No literal artifact filenames anywhere: no proposal.md/design.md/tasks.md
      // branching, and no worked example that names them. The only .md literal
      // allowed is the specs/**/*.md glob illustration.
      expect(body.replace(/specs\/\*\*\/\*\.md/g, ''), label).not.toMatch(/\b[\w-]+\.md\b/);
    }
  });

  it('edits planning artifacts only, hands code off to /opsx:apply, never advances the frontier (3.3)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('コードは決して編集しないでください');
      expect(body, label).toContain('実装コードは決して編集しません');
      expect(body, label).toContain('停止し、`/opsx:apply` を案内します');
      expect(body, label).toContain('ビルドの進行地点を先に進めません');
      expect(body, label).toContain(
        '既存の出力ファイルがなく、状態が `ready` または `blocked` のアーティファクトは、その旨を記録し、作成用の `/opsx:continue` をユーザーに案内します'
      );
      expect(body, label).toContain(
        '`existingOutputPaths` が空で、状態が `ready` または `blocked` のアーティファクトの作成は、`/opsx:continue` の役目です'
      );
      expect(body, label).toContain('`skipped` のアーティファクトは変更せず');
      expect(body, label).toContain('不足として扱ったり continue ワークフローに回したりしません');
    }
  });

  it('fills a gap under an already-satisfied glob artifact instead of deferring it (3.3a)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('1 つ以上のファイルが一致すると `done` になります');
      expect(body, label).toContain('continue ワークフローが扱うのは `ready` のアーティファクトだけです');
      expect(body, label).toContain('`existingOutputPaths` が空でないグロブ アーティファクト');
      expect(body, label).toContain(
        '`instruction` と `template` を使います'
      );
      expect(body, label).toContain('`context` と `rules` は制約として扱い、ファイルにコピーしません');
      expect(body, label).toContain('`skipped: true` が返された場合は作成しません');
      expect(body, label).toContain('依存ファイルをディスクから読み');
      expect(body, label).toContain('スキップされていない必須の依存ファイルがなければ停止し、先に復元するようユーザーに求めます');
      expect(body, label).toContain('`instruction` が別のスキルやコマンドに作成を委ねる場合');
      expect(body, label).toContain('確認済みのパスとこれらのガードレールを守れる場合だけ呼び出し、守れなければ停止します');
      expect(body, label).toContain(
        '`changeRoot` 内で `artifactPaths.<id>.outputPath` に一致する'
      );
      expect(body, label).toContain('ユーザーの確認後にだけ作成します');
      expect(body, label).toContain('まだ存在しない');
      expect(body, label).toContain('親ディレクトリのシンボリックリンクを解決しても');
    }
  });

  it('rechecks new-file scope after confirmation and refuses concurrent overwrites', () => {
    for (const [label, body] of bodies) {
      const confirmation = body.indexOf('ユーザーの確認後にだけ作成します');
      const recheck = body.indexOf('確認後、作成の直前に');
      const create = body.indexOf('書き込み先がすでに存在すれば失敗する作成操作を使います');

      expect(confirmation, label).toBeGreaterThanOrEqual(0);
      expect(recheck, label).toBeGreaterThan(confirmation);
      expect(create, label).toBeGreaterThan(recheck);
      const writeGuard = body.slice(recheck, create);
      expect(writeGuard, label).toContain('status と instructions を再取得します');
      expect(writeGuard, label).toContain('引き続き対象範囲内で、スキップされておらず、一部のファイルがすでに存在する');
      expect(writeGuard, label).toContain('上記の具体的なパスの確認も繰り返します');
      expect(body, label).toContain('既存内容の置き換えや別パスの選択をせずに停止し、ユーザーと調整します');
    }
  });

  it('writes to existingOutputPaths, never to a glob resolvedOutputPath (3.4)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('artifactPaths.<id>.existingOutputPaths');
      expect(body, label).toContain('依然としてグロブ パターン');
      expect(body, label).toContain('グロブの `resolvedOutputPath` は書き込み先にできません');
      expect(body, label).toContain('新規ファイルを作成できるのは');
    }
  });

  it('ends with next-step guidance and never acts on it (3.5)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('ガイダンスのみ - 決して行動しないでください');
      expect(body, label).toContain(
        '`existingOutputPaths` が空で、状態が `ready` または `blocked` のアーティファクト -> `/opsx:continue` で作成することを提案します'
      );
      expect(body, label).toContain('`/opsx:continue` で作成することを提案します');
      expect(body, label).toContain('`/opsx:apply` を提案します');
      expect(body, label).toContain('`/opsx:archive` を提案します');
      expect(body, label).toContain('コードが修正後の計画と一致しなくなる可能性があります');
    }
  });

  it('hands off to /opsx:continue when that workflow is installed', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'まだ存在しないアーティファクトの作成は `/opsx:continue` で行います'
      );
      expect(body, label).toContain('`/opsx:continue` で作成することを提案します');
      expect(body, label).toContain("`/opsx:continue` の役目です");
      // The handoff is stated outright, not deferred to a runtime availability
      // check the model has to perform (#1734).
      expect(body, label).not.toContain('may not be installed');
      expect(body, label).not.toContain('verify that it is available');
    }
  });

  it('never names /opsx:continue on a profile that does not install it', () => {
    for (const [label, body] of coreBodies) {
      expect(body, label).not.toContain('/opsx:continue');
      expect(body, label).toContain('未作成のアーティファクトは作成しません');
      expect(body, label).toContain(
        '`openspec status --change "<name>" --json` で次のアーティファクトを'
      );
      expect(body, label).toContain(
        '`openspec instructions "<artifact-id>" --change "<name>" --json` で作成方法を'
      );
      expect(body, label).toContain(
        '未作成のため見送ったもの'
      );
      expect(body, label).toContain('このワークフローの外で別の手順として行います');
    }
  });

  it('confirms every edit and redirects intent changes to /opsx:new when installed', () => {
    for (const [label, body] of bodies) {
      const reconciliation = body.slice(body.indexOf('4. **読んで調整**'), body.indexOf('5. **一度に 1 つのアーティファクトを確認して適用します'));
      expect(reconciliation, label).toContain('要求された編集案をファイルではなく会話内で作成');
      expect(reconciliation, label).not.toContain('Apply the requested edit');
      expect(body, label).toContain('ユーザーの確認後にだけ書き込みます');
      expect(body, label).toContain('ユーザーがリビジョンを拒否した場合は、リビジョンを書き込まないでください');
      expect(body, label).toContain('`/opsx:new` で新しく始めることを提案します');
      expect(body, label).toContain('更新か新規開始か');
      expect(body, label).not.toContain('first verify whether the optional');
    }
  });

  it('routes intent changes to the CLI when /opsx:new is not installed', () => {
    for (const [label, body] of coreBodies) {
      expect(body, label).not.toContain('/opsx:new');
      expect(body, label).toContain('未使用で区別できる変更名を確認');
      expect(body, label).toContain('openspec new change "<new-change-name>"');
      expect(body, label).not.toContain('openspec new change "<name>"');
      expect(body, label).toContain('更新か新規開始か');
    }
  });
});
