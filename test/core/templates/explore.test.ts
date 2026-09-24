import { describe, expect, it } from 'vitest';

import {
  getSkillReferenceTransformer,
  transformCommandInvocations,
  transformToCodexCompatibleSkillReferences,
  transformToSkillReferences,
} from '../../../src/utils/command-references.js';
import { CommandAdapterRegistry } from '../../../src/core/command-generation/registry.js';
import {
  formatCommandInvocation,
  getInvocationForAdapter,
} from '../../../src/core/command-generation/invocation.js';
import { AI_TOOLS } from '../../../src/core/config.js';
import {
  generateSkillContent,
  getCommandContents,
  getCommandTemplates,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { generateCommands } from '../../../src/core/command-generation/generator.js';
import { getProfileWorkflows } from '../../../src/core/profiles.js';

// Bodies as generated with every workflow installed. Profile-dependent
// handoffs are covered separately below.
const skill = getSkillTemplates().find(e => e.workflowId === 'explore')!.template;
const command = getCommandTemplates().find(e => e.id === 'explore')!.template;

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function newChangeTransition(body: string, label: string): string {
  const start = body.indexOf('### 変更がない場合');
  const end = body.indexOf('### 変更が存在する場合');

  expect(start, label).toBeGreaterThanOrEqual(0);
  expect(end, label).toBeGreaterThan(start);

  return body.slice(start, end);
}

function occurrenceCount(body: string, value: string): number {
  return body.split(value).length - 1;
}

const UNICODE_DIAGRAM_CHARACTER = /[\u2190-\u21ff\u2500-\u259f\u25a0-\u25ff]/;

function fencedBlockLines(body: string): Array<[number, string]> {
  const lines: Array<[number, string]> = [];
  let inFence = false;

  body.split('\n').forEach((line, index) => {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      lines.push([index + 1, line]);
    }
  });

  return lines;
}

describe('explore templates', () => {
  it('guides planning without forcing an interview on open-ended exploration (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('ユーザーが変更を計画している場合');
      expect(body, label).toContain('自由形式の議論では、面接のような進め方や必須の出力を押し付けず、会話の流れに従ってください');
      expect(body, label).toContain('ユーザーが十分に整理できたら質問を止めます');
      expect(body, label).toContain('休止、方向転換、判断の先送りを認め');
      expect(body, label).not.toContain('Relentless Interview Mode');
    }
  });

  it('investigates repository facts before asking while acknowledging missing evidence (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('事実について質問する前に、後述のコンテキスト確認を行い');
      expect(body, label).toContain('関連する OpenSpec アーティファクト、ソース、テスト、ドキュメント、設定');
      expect(body, label).toContain('確認できる事実をユーザーに繰り返し尋ねないでください');
      expect(body, label).toContain('根拠がない、矛盾している、またはアクセスできない場合');
      expect(body, label).toContain('先へ進むために必要な点だけを確認してください');
    }
  });

  it('resolves blocking decisions first and revisits dependent assumptions (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('依存する詳細より先に、次の判断を妨げている事項を解決します');
      expect(body, label).toContain('前段の回答が変わった場合は、後続の前提を見直してください');
      expect(body, label).toContain('今回のゴールに関係しない分岐は扱いません');
    }
  });

  it('asks one focused question and recommends only when evidence supports a choice (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('一度に 1 つの明確な質問を行い');
      expect(body, label).toContain('ユーザーがまとめて質問するよう求めた場合に限り');
      expect(body, label).toContain('その重要性と、回答によって決められることを簡潔に説明します');
      expect(body, label).toContain('根拠に基づいて推奨できる場合');
      expect(body, label).toContain('意図、優先順位、外部制約を作り上げてはいけません');
    }
  });

  it('keeps decisions in the conversation without accepting defaults or authorizing writes (#1017)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('判断はファイルではなく会話内で追跡します');
      expect(body, label).toContain('確定した判断、既定値としての提案、未解決の質問を区別してください');
      expect(body, label).toContain('沈黙は同意ではありません');
      expect(body, label).toContain('回答や一連の推奨を受け入れたことも、書き込みの許可にはなりません');
      expect(body, label).toContain('ファイル書き込みの確認は調査質問と分け');
    }
  });

  it('delivers the same planning guidance exactly once in both templates (#1017)', () => {
    const sections = bodies.map(([label, body]) => {
      const heading = '## 変更を計画する';
      expect(occurrenceCount(body, heading), label).toBe(1);
      const start = body.indexOf(heading);
      const end = body.indexOf('\n---', start);
      expect(end, label).toBeGreaterThan(start);
      return body.slice(start, end);
    });

    expect(sections[0]).toBe(sections[1]);
  });

  // Regression for #696: explore never loaded the project's declared
  // context, so it reasoned without the tech stack, conventions, and
  // rules every artifact-creating workflow already receives.
  it('loads project context from the OpenSpec config at startup (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec/config.yaml');
      expect(body, label).toContain('`context`: 技術スタック、規約、制約などのプロジェクト背景');
      expect(body, label).toContain('`rules`: アーティファクト ID ごとのルール');
    }
  });

  it('resolves the config through the reported root rather than assuming a repo-local path (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec list --json');
      expect(body, label).toContain('<root.path>/openspec/config.yaml');
      expect(body, label).toContain('root.path');
    }
  });

  // resolveConfigFilePath() probes config.yaml then config.yml, and
  // `openspec init` leaves a .yml project on .yml forever - naming only
  // .yaml would silently skip context for those projects.
  it('accepts config.yml as well as config.yaml (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('config.yml');
      expect(body, label).toContain('どちらのファイルもなければスキップ');
    }
  });

  // `rules` is Record<artifactId, string[]>; explore holds no artifact at
  // startup, so the guidance must not invite blanket application.
  it('scopes rules to the artifact they are keyed to (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '該当するアーティファクトを作成するときだけ適用'
      );
    }
  });

  // House style across instructions.ts and the sibling workflow templates
  // forbids leaking context/rules into the artifact, not just the chat.
  it('treats project context as constraints that must not leak into output (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('従うべき制約');
      expect(body, label).toContain(
        '会話や作成するアーティファクトへコピーしない'
      );
    }
  });

  it('requires separate confirmation before any file-writing action (#1715)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '書き込み可能な操作を初めて行う前に'
      );
      expect(body, label).toContain('変更するアーティファクトまたはファイルと、行う内容を示し');
      expect(body, label).toContain('はいまたはいいえで答えられる質問で確認');
      expect(body, label).toContain('ユーザーから別のメッセージで確認を得るまで待ちます');
      expect(body, label).toContain(
        '設計や確認に関する質問への回答は、書き込みへの同意にはなりません'
      );
      expect(body, label).toContain('読み取り専用のコマンドやツールの実行は、確認なしで行えます');
      expect(body, label).toContain(
        '確認は説明した範囲だけを対象とします。範囲を広げる前に、もう一度確認してください'
      );
    }
  });

  it('treats workflow configuration and write-capable commands as changes (#1715)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'スキーマ、テンプレート、`openspec/config.yaml` の作成や編集は思考ではなく変更です'
      );
      expect(body, label).toContain(
        '`openspec new change` など、ファイルへ書き込むコマンド'
      );
      expect(body, label).toContain(
        '確認済みの範囲内で OpenSpec の変更アーティファクトを作成または更新することはできますが、それ以外には書き込まないでください'
      );
    }
  });

  // Regression for #1828: the #1715 write-confirmation rule named
  // `openspec new change` as something that needs a separate yes/no, while
  // the capture branch told the agent to transition "seamlessly" into
  // running it. Both readings were defensible, so the same request either
  // wrote files immediately or stopped and asked. The rule now resolves the
  // conflict in one direction: an explicit capture request IS the
  // confirmation, for the scope that request names.
  it('treats an explicit capture request as the write confirmation (#1828)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'ユーザーが探索内容を新しい変更として記録するよう明示的に依頼した場合、その依頼自体を確認とみなします'
      );
      // Scoped to change artifacts, so the carve-out cannot reach the
      // workflow configuration #1715 reported an agent editing.
      expect(body, label).toContain(
        '対象は、その変更と依頼で指定された変更アーティファクトです'
      );
    }
  });

  it('keeps the strict rule for a capture the agent proposed itself (#1828)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'こちらから記録を提案する場合は、`openspec new change` にもこの規則を適用します'
      );
      // The guardrail points at the capture transition rather than restating
      // the contract a third time, so the three sites cannot drift apart.
      expect(body, label).toContain(
        "ユーザー自身の記録依頼は例外であり、上記の記録への移行手順に従います"
      );
    }
  });

  it('states the carve-out at the head of the capture branch, before the scaffold step (#1828)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const carveOut = transition.indexOf(
        'その依頼を上記の確認とみなします'
      );
      const scaffold = transition.indexOf('1. アーティファクトを作成する前に `openspec new change "<name>"`');

      expect(carveOut, label).toBeGreaterThanOrEqual(0);
      expect(scaffold, label).toBeGreaterThan(carveOut);
      expect(transition, label).toContain(
        '依頼で指定された変更アーティファクトの作成だけです'
      );
    }
  });

  // A yes to an offer the agent made looks identical to a user-initiated
  // capture request at the point the decision is made, so the discriminator
  // has to live in the branch, not only in the guardrail 190 lines below it.
  it('carries the agent-proposed discriminator in the branch itself (#1828)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        'これはユーザー自身が依頼した場合に限ります'
      );
      expect(transition, label).toContain(
        'こちらの提案に「はい」と答えた場合は、提案に明示した範囲だけへの同意'
      );
    }
  });

  // "Do not ask for a second confirmation" would have contradicted step 2,
  // nine lines below it, which requires asking before expanding the capture.
  // Narrow the licence to re-asking for what was already asked for.
  it('does not license skipping the asks the capture steps still require (#1828)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        "依頼済みの内容を再確認する必要はありませんが、それを超える作業は先に確認します"
      );
      expect(transition, label).not.toContain('Do not ask for a second confirmation');
      expect(transition, label).toContain('記録範囲を広げる前に確認');
      expect(transition, label).toContain(
        'ユーザーの承認なしに、要求されていない前提条件を作成してはいけません'
      );
    }
  });

  // The carve-out must not become a blanket write permit: #1715's guarantee
  // survives only if everything outside the requested scope still stops.
  it('keeps the carve-out scoped to what the request named (#1828, #1715)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '確認は説明した範囲だけを対象とします。範囲を広げる前に、もう一度確認してください'
      );
      expect(body, label).toContain(
        '設計や確認に関する質問への回答は、書き込みへの同意にはなりません'
      );
      expect(body, label).toContain(
        '回答や一連の推奨を受け入れたことも、書き込みの許可にはなりません'
      );
      expect(body, label).toContain(
        'スキーマ、テンプレート、`openspec/config.yaml` の作成や編集は思考ではなく変更です'
      );
    }
  });

  // #1828 was not a missing sentence. It was a second, contradictory sentence
  // elsewhere in the same body, and no `toContain` assertion can see one of
  // those: every pinned string stays present while the new sentence reverses
  // it. So invert the check. Collect EVERY sentence that couples consent
  // language to the capture topic and require each to be one the resolution
  // sanctions, which surfaces a gate added anywhere in the body - Guardrails,
  // "Planning a Change", either capture branch.
  //
  // Limits worth knowing: this is lexical. A sentence that reverses the
  // resolution without using any consent word - redefining what counts as
  // "requested", or suspending the carve-out on a condition - is invisible
  // here and stays a review responsibility.
  const CONSENT_WORDS =
    /\b(confirm(?:ation|s|ed)?|yes\/no|approv(?:al|es|ed)|permission|consent)\b|確認|承認|同意|許可/i;
  const CAPTURE_WORDS = /(openspec new change|scaffold|captur|write-capable|first write|記録|書き込み可能|スキャフォールド)/i;

  const SANCTIONED_CONSENT = [
    // The stance paragraph: the rule, then the carve-out.
    /確認済みの範囲内で.*OpenSpec の変更アーティファクト/,
    /書き込み可能な操作を初めて行う前に、変更するアーティファクトまたはファイルと/,
    /ユーザーが探索内容を新しい変更として記録するよう明示的に依頼した場合、その依頼自体を確認とみなします/,
    // The capture branch: the carve-out and both of its fences.
    /その依頼を上記の確認とみなします/,
    /これはユーザー自身が依頼した場合に限ります/,
    /こちらの提案に「はい」と答えた場合は、提案に明示した範囲だけへの同意/,
    /依頼済みの内容を再確認する必要はありません/,
    /ユーザーの承認なしに、要求されていない前提条件を作成してはいけません/,
    /通常の前提条件として扱い、記録範囲を広げる前に確認します/,
    /選択した出力が存在することを確認します/,
    /その依存関係を説明してから範囲を広げるか確認します/,
    // The guardrail: the rule, and a pointer back to the branch.
    /`openspec new change` など、ファイルへ書き込むコマンドを含む最初の書き込み可能な操作の前に/,
    /こちらから記録を提案する場合は、`openspec new change` にもこの規則を適用します/,
  ];

  // The `--store` reminder repeats on five steps and says "confirmed" only to
  // mean "the store id you already resolved", which is not a consent rule.
  const STORE_REMINDER =
    /（登録された独立ストアの場合だけ確認済みの `--store "<id>"` を付けます）|（確認済みの `--store "<id>"` は、登録された独立ストアの場合だけ付けます）/g;

  function consentSentences(body: string, requireCaptureTopic: boolean): string[] {
    return body
      .replace(STORE_REMINDER, '')
      .split(/(?<=[.:;])\s+|(?<=。)/)
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter(
        (sentence) =>
          CONSENT_WORDS.test(sentence) &&
          (!requireCaptureTopic || CAPTURE_WORDS.test(sentence))
      );
  }

  it('couples consent to capture only where the resolution sanctions it (#1828)', () => {
    for (const [label, body] of bodies) {
      const unsanctioned = consentSentences(body, true).filter(
        (sentence) => !SANCTIONED_CONSENT.some((allowed) => allowed.test(sentence))
      );

      expect(unsanctioned, `${label} must add no unsanctioned consent rule`).toEqual([]);
    }
  });

  // Inside the capture branch, drop the topic filter entirely: a gate written
  // there is about the capture whether or not it says so. Without this, a bare
  // "get a fresh yes/no before running anything" inserted above step 1 reads as
  // off-topic and reinstates #1828 with the suite green.
  it('adds no confirmation gate of its own inside the capture branch (#1828)', () => {
    for (const [label, body] of bodies) {
      const unsanctioned = consentSentences(
        newChangeTransition(body, label),
        false
      ).filter((sentence) => !SANCTIONED_CONSENT.some((allowed) => allowed.test(sentence)));

      expect(unsanctioned, `${label} capture branch must carry no gate`).toEqual([]);
    }
  });

  it.each([
    '記録する前に、改めてユーザーの許可を得てください。',
    '新しい変更の作成には追加の承認が必要です。',
  ])('detects an extra Japanese capture gate: %s', (injected) => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label) + '\n' + injected;
      const unsanctioned = consentSentences(transition, false).filter(
        (sentence) => !SANCTIONED_CONSENT.some((allowed) => allowed.test(sentence))
      );
      expect(unsanctioned, label).toContain(injected);
    }
  });

  it('scaffolds a new change before capturing exploration artifacts (#668, #720)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain('openspec new change "<name>"');
      expect(transition, label).toContain(
        '`openspec/changes/` 配下に新しい変更ディレクトリを手作業で作成してはいけません'
      );
      expect(transition, label).toContain('`.openspec.yaml`');
      expect(transition, label).not.toContain(
        '`openspec/changes/` 配下にファイルやディレクトリを直接作成してはいけません'
      );
    }
  });

  it('retains the selected store throughout the capture transition (#668, #720)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const scaffold = transition.indexOf('1. アーティファクトを作成する前に `openspec new change "<name>"` を実行します');
      const retainStore = transition.indexOf(
        '該当する後続の `status` および `instructions` コマンドすべてに、選択した `--store <id>` を引き継ぎます'
      );
      const initialStatus = transition.indexOf(
        '2. `openspec status --change "<name>" --json` を実行します'
      );

      expect(retainStore, label).toBeGreaterThan(scaffold);
      expect(initialStatus, label).toBeGreaterThan(retainStore);
      expect(
        occurrenceCount(
          transition,
          '（登録された独立ストアの場合だけ確認済みの `--store "<id>"` を付けます）'
        ),
        label
      ).toBe(4);
    }
  });

  it('continues an accepted transition through the requested artifact (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain('openspec status --change "<name>" --json');
      expect(transition, label).toContain(
        'openspec instructions "<artifact-id>" --change "<name>" --json'
      );
      expect(transition, label).toContain('ユーザーが求めたアーティファクトを記録します');
      expect(transition, label).toContain(
        '別のワークフローコマンドを実行するようユーザーへ求めず'
      );
      expect(transition, label).toContain(
        '求められたアーティファクトを依存順に処理します'
      );
      expect(transition, label).toContain(
        'アーティファクトを作成するたびに `openspec status --change "<name>" --json` を再実行'
      );
      expect(transition, label).toContain(
        '指示が特定のスキルまたはコマンドへ作成を委譲している場合'
      );
      expect(transition, label).toContain(
        '選択した出力が存在することを確認します'
      );
    }
  });

  it('keeps the seamless capture steps ordered (#668, #720)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const scaffold = transition.indexOf('1. アーティファクトを作成する前に `openspec new change "<name>"` を実行します');
      const initialStatus = transition.indexOf(
        '2. `openspec status --change "<name>" --json` を実行します'
      );
      const readyInstructions = transition.indexOf(
        '`ready` の各アーティファクトでは `openspec instructions'
      );
      const verifyOutput = transition.indexOf(
        '選択した出力が存在することを確認します'
      );
      const refreshStatus = transition.indexOf(
        'アーティファクトを作成するたびに `openspec status'
      );

      expect(scaffold, label).toBeGreaterThanOrEqual(0);
      expect(initialStatus, label).toBeGreaterThan(scaffold);
      expect(readyInstructions, label).toBeGreaterThan(initialStatus);
      expect(verifyOutput, label).toBeGreaterThan(readyInstructions);
      expect(refreshStatus, label).toBeGreaterThan(verifyOutput);
      expect(occurrenceCount(transition, 'openspec new change "<name>"'), label).toBe(1);
      expect(
        occurrenceCount(transition, 'openspec status --change "<name>" --json'),
        label
      ).toBe(2);
      expect(
        occurrenceCount(transition, 'openspec instructions "<artifact-id>"'),
        label
      ).toBe(2);
      expect(
        occurrenceCount(transition, 'openspec instructions "<prerequisite-id>"'),
        label
      ).toBe(1);
      expect(
        occurrenceCount(transition, '選択した出力が存在することを確認します'),
        label
      ).toBe(1);
      expect(
        occurrenceCount(transition, 'アーティファクトを作成するたびに `openspec status'),
        label
      ).toBe(1);
    }
  });

  // Regression for #983: the worked examples drew boxes and tables with
  // Unicode box-drawing, arrow, and marker glyphs. Agents copy those
  // examples verbatim, and on terminals that render the glyphs
  // double-width the right border of every padded box drifted loose.
  it('uses no Unicode diagram characters in fenced examples (#983)', () => {
    for (const [label, body] of bodies) {
      const offenders = fencedBlockLines(body)
        .filter(([, line]) => UNICODE_DIAGRAM_CHARACTER.test(line))
        .map(([lineNumber, line]) => `${lineNumber}: ${line}`);

      expect(offenders, `${label} のコードフェンス内に Unicode 図形文字を含めない`).toEqual([]);
    }
  });

  it('tells the agent to draw with ASCII and says why (#983)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('**図にはプレーン ASCII だけを使う**');
      expect(body, label).toContain('異なる幅で表示される');
      expect(body, label).toContain('図に使う文字はすべて ASCII にしてください');
    }
  });

  it('stops after scaffolding when the user requests only a new change (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      expect(transition, label).toContain(
        '変更の開始だけを求められた場合は、スキャフォールドの後に停止して状態を表示します'
      );
    }
  });

  it('uses dependency context and artifact constraints during capture (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        '`dependencies` に列挙された完了済み依存ファイルを読み'
      );
      expect(transition, label).toContain('`context` と `rules` はアーティファクトへコピーせず制約として適用');
    }
  });

  it('handles conditional prerequisites without deadlocking capture (#668)', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      const requestedInstructions = transition.indexOf(
        '`ready` の各アーティファクトでは `openspec instructions'
      );
      const evaluateRequestedCondition = transition.indexOf(
        '要求されたアーティファクトを作成する前に、その `instruction` 内の条件を探索した変更に照らして評価'
      );
      const inspectPrerequisite = transition.indexOf(
        '`openspec instructions "<prerequisite-id>" --change "<name>" --json` を実行します'
      );
      const evaluateCondition = transition.indexOf(
        'その `instruction` が条件を定める場合は、探索した変更に照らして評価'
      );
      const recordSkip = transition.indexOf(
        '該当しない場合だけ意図的なスキップを記録'
      );
      const requireExpansion = transition.indexOf(
        '条件が該当する場合、または前提条件が条件付きでない場合'
      );
      const approvalGuard = transition.indexOf(
        'ユーザーの承認なしに、要求されていない前提条件を作成してはいけません'
      );

      expect(transition, label).toContain(
        'その前提条件が `ready` でも `blocked` でも `openspec instructions "<prerequisite-id>" --change "<name>" --json` を実行します'
      );
      expect(transition, label).toContain(
        '該当しない場合だけ意図的なスキップを記録します'
      );
      expect(transition, label).toContain(
        '該当しない場合だけ意図的なスキップを記録します'
      );
      expect(transition, label).toContain(
        '条件が該当する場合、または前提条件が条件付きでない場合は、通常の前提条件として扱い'
      );
      expect(transition, label).toContain('要求されていない前提条件を作成してはいけません');
      expect(transition, label).toContain(
        'その `instruction` の条件が該当しなかったために意図的にスキップ'
      );
      expect(transition, label).toContain('記録し、再検討しません');
      expect(transition, label).toContain('依存関係は作成を可能にするためのものであり、進行を拒む関門ではありません');
      expect(transition, label).toContain(
        'ブロック状態でも `openspec instructions "<artifact-id>" --change "<name>" --json` を実行します'
      );
      expect(transition, label).toContain(
        '記録した条件付きスキップだけが不足依存関係であるときに限り'
      );
      expect(transition, label).toContain('条件付きでスキップもできない前提条件');
      expect(requestedInstructions, label).toBeGreaterThanOrEqual(0);
      expect(evaluateRequestedCondition, label).toBeGreaterThan(requestedInstructions);
      expect(inspectPrerequisite, label).toBeGreaterThan(evaluateRequestedCondition);
      expect(evaluateCondition, label).toBeGreaterThan(inspectPrerequisite);
      expect(recordSkip, label).toBeGreaterThan(evaluateCondition);
      expect(requireExpansion, label).toBeGreaterThan(recordSkip);
      expect(approvalGuard, label).toBeGreaterThan(requireExpansion);
    }
  });
});

// Regression for #869: explore refused to implement and told the agent to
// "create a change proposal" without ever naming the workflow that does it.
// With no named exit, agents answered the discovery questions and then went
// straight to writing code - the failure two reporters hit through Copilot.
describe('explore handoff to the propose workflow (#869)', () => {
  it('names the propose workflow when the user asks for implementation', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '議論を変更にまとめる `/opsx:propose` を案内します'
      );
      expect(body, label).toContain('作業はその変更から進め、explore モードでは実装しません');
      expect(body, label).not.toContain(
        'remind them to exit explore mode first and create a change proposal'
      );
    }
  });

  it('names the propose workflow where discovery ends', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '**提案へ移る**：「始めますか？ `/opsx:propose` を実行すると、これを変更にまとめられます。」'
      );
      expect(body, label).not.toContain('I can create a change proposal');
    }
  });

  it('pairs the do-not-implement guardrail with the handoff', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'ユーザーが実装に進む場合も、開始せずに引き継ぎ先を示します。`/opsx:propose` で議論を変更にまとめ、その変更で作業を進めます'
      );
    }
  });

  it('offers the handoff as a next step in the closing summary', () => {
    expect(skill.instructions).toContain('- 変更にまとめる: `/opsx:propose`');
    expect(skill.instructions).not.toContain('- Create a change proposal');
  });

  // The reference has to be the canonical `/opsx:<id>` form of a known
  // command id, or the per-tool transformers leave it as written and the
  // skill advertises an invocation no tool registers (#727, #1307).
  it('writes the reference so per-tool rendering rewrites it', () => {
    for (const [label, body] of bodies) {
      const rendered = transformToSkillReferences(body);
      expect(rendered, label).toContain('/openspec-propose');
      expect(rendered, label).not.toContain('/opsx:propose');
    }
  });
});

// The handoff is only useful if every tool renders it as an invocation that
// tool actually registers. These assertions walk the real registries rather
// than a hand-picked few, so a new adapter or a changed invocation shape
// cannot quietly leave explore advertising a command nobody answers to
// (the #727 / #1307 failure mode).
describe('explore handoff renders for every delivery surface (#869)', () => {
  // Both workflows explore hands off to. Each is a `CORE_WORKFLOWS` member,
  // so naming them does not advertise anything the default profile omits.
  const HANDOFF_IDS = ['propose', 'apply'] as const;

  function canonicalCount(body: string, commandId: string): number {
    return occurrenceCount(body, `/opsx:${commandId}`);
  }

  it('names both handoff workflows in both bodies before any rendering', () => {
    for (const [label, body] of bodies) {
      for (const commandId of HANDOFF_IDS) {
        expect(canonicalCount(body, commandId), `${label} ${commandId}`).toBeGreaterThan(0);
      }
    }
  });

  it('rewrites every reference for each registered command adapter', () => {
    const adapters = CommandAdapterRegistry.getAll();
    expect(adapters.length).toBeGreaterThan(0);

    for (const adapter of adapters) {
      const invocation = getInvocationForAdapter(adapter);

      for (const [label, body] of bodies) {
        const rendered = transformCommandInvocations(body, invocation);

        for (const commandId of HANDOFF_IDS) {
          const expected = formatCommandInvocation(invocation, commandId);
          const where = `${adapter.toolId} ${label} ${commandId}`;

          // Every canonical reference became this tool's spelling. Counting
          // rather than substring-matching catches a partial rewrite, and it
          // holds for the namespaced tools whose spelling is the canonical one.
          expect(occurrenceCount(rendered, expected), where).toBe(
            canonicalCount(body, commandId)
          );
        }
      }
    }
  });

  it('rewrites every reference for each skills-only tool', () => {
    for (const tool of AI_TOOLS) {
      const transform = getSkillReferenceTransformer(tool.value);

      for (const [label, body] of bodies) {
        const rendered = transform(body);

        expect(rendered, `${tool.value} ${label}`).not.toContain('/opsx:');
        expect(occurrenceCount(rendered, 'openspec-propose'), `${tool.value} ${label}`).toBe(
          canonicalCount(body, 'propose')
        );
        expect(
          occurrenceCount(rendered, 'openspec-apply-change'),
          `${tool.value} ${label}`
        ).toBe(canonicalCount(body, 'apply'));
      }
    }
  });

  it('keeps the handoff readable on the shared .agents tree Codex writes', () => {
    for (const [label, body] of bodies) {
      const rendered = transformToCodexCompatibleSkillReferences(body);

      expect(rendered, label).not.toContain('/opsx:');
      expect(
        occurrenceCount(rendered, '$openspec-propose（Codex）、/openspec-propose（その他の対応エージェント）'),
        label
      ).toBe(canonicalCount(body, 'propose'));
      expect(
        occurrenceCount(
          rendered,
          '$openspec-apply-change（Codex）、/openspec-apply-change（その他の対応エージェント）'
        ),
        label
      ).toBe(canonicalCount(body, 'apply'));
    }
  });
});

// Regression for #869: the seamless capture path let explore scaffold a
// change and write artifacts, then said nothing about what came next. An
// agent holding a fresh proposal inside explore mode has an obvious wrong
// next move, which is the one the issue reported.
describe('explore capture path names where the work continues (#869)', () => {
  it('ends the capture by naming propose and apply', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);

      expect(transition, label).toContain(
        '依頼された記録が終わったらそこで停止し、その後の進め方を示します'
      );
      expect(transition, label).toContain('`/opsx:propose` で残りの計画アーティファクトを作成します');
      expect(transition, label).toContain('タスクができたら `/opsx:apply` で変更を実装します');
    }
  });

  it('says that capturing artifacts is not permission to implement them', () => {
    for (const [label, body] of bodies) {
      const transition = newChangeTransition(body, label);
      expect(transition, label).toContain(
        'アーティファクトの記録から実装を始めてはいけません'
      );
    }
  });
});

// A custom profile can install explore without propose or apply. Explore must
// then not name a handoff to a workflow that was never generated; the agent
// would be sent to a command nobody answers to. Checked through the same
// registries init and update call, on both delivery surfaces.
describe('explore handoffs follow the installed workflow set (#869)', () => {
  const PROFILES: Array<[string, string[], Array<'propose' | 'apply'>]> = [
    ['explore only', ['explore'], ['propose', 'apply']],
    ['explore + propose without apply', ['explore', 'propose'], ['apply']],
  ];

  function exploreSkillBody(workflows: string[]): string {
    const entry = getSkillTemplates(workflows).find(e => e.workflowId === 'explore');
    expect(entry).toBeDefined();
    return entry!.template.instructions;
  }

  function exploreCommandBody(workflows: string[]): string {
    const entry = getCommandContents(workflows).find(e => e.id === 'explore');
    expect(entry).toBeDefined();
    return entry!.body;
  }

  it.each(PROFILES)('%s: generated skills never name a missing workflow', (_name, workflows, missing) => {
    const body = exploreSkillBody(workflows);
    for (const tool of AI_TOOLS) {
      const content = generateSkillContent(
        getSkillTemplates(workflows).find(e => e.workflowId === 'explore')!.template,
        'TEST',
        getSkillReferenceTransformer(tool.value)
      );
      for (const id of missing) {
        const skillName = id === 'propose' ? 'openspec-propose' : 'openspec-apply-change';
        expect(content, `${tool.value} ${id}`).not.toContain(skillName);
      }
    }
    for (const id of missing) {
      expect(body).not.toContain(`/opsx:${id}`);
      expect(transformToCodexCompatibleSkillReferences(body)).not.toMatch(
        new RegExp(`openspec-${id}`)
      );
    }
    expect(body).not.toContain('[[opsx:');
  });

  it.each(PROFILES)('%s: generated commands never name a missing workflow', (_name, workflows, missing) => {
    const contents = getCommandContents(workflows);
    for (const adapter of CommandAdapterRegistry.getAll()) {
      const invocation = getInvocationForAdapter(adapter);
      const explore = generateCommands(contents, adapter).find(c =>
        c.fileContent.includes('探索モードに入ります')
      );
      expect(explore, adapter.toolId).toBeDefined();
      for (const id of missing) {
        expect(explore!.fileContent, `${adapter.toolId} ${id}`).not.toContain(
          formatCommandInvocation(invocation, id)
        );
        expect(explore!.fileContent, `${adapter.toolId} ${id}`).not.toContain(`/opsx:${id}`);
      }
      expect(explore!.fileContent, adapter.toolId).not.toContain('[[opsx:');
    }
    expect(exploreCommandBody(workflows)).not.toContain('[[opsx:');
  });

  it.each(PROFILES)('%s: explore still names a way forward', (_name, workflows) => {
    for (const body of [exploreSkillBody(workflows), exploreCommandBody(workflows)]) {
      expect(body).toContain('アーティファクトの記録から実装を始めてはいけません');
      expect(body).toContain('作業はその変更から進め、explore モードでは実装しません');
    }
  });

  it('keeps both named handoffs when propose and apply are installed (core profile)', () => {
    const core = getProfileWorkflows('core');
    for (const body of [exploreSkillBody([...core]), exploreCommandBody([...core])]) {
      expect(body).toContain('`/opsx:propose` を案内します');
      expect(body).toContain('タスクができたら `/opsx:apply` で変更を実装します');
    }
  });
});
