import { describe, expect, it } from 'vitest';

import {
  getExploreSkillTemplate,
  getOpsxExploreCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getExploreSkillTemplate();
const command = getOpsxExploreCommandTemplate();

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
