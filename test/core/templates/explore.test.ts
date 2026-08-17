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
  const end = body.indexOf('### 変更があった場合');

  expect(start, label).toBeGreaterThanOrEqual(0);
  expect(end, label).toBeGreaterThan(start);

  return body.slice(start, end);
}

function occurrenceCount(body: string, value: string): number {
  return body.split(value).length - 1;
}

describe('explore templates', () => {
  // Regression for #696: explore never loaded the project's declared
  // context, so it reasoned without the tech stack, conventions, and
  // rules every artifact-creating workflow already receives.
  it('loads project context from the OpenSpec config at startup (#696)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('openspec/config.yaml');
      expect(body, label).toContain('`context`: 技術スタック、規約、制約などのプロジェクト背景');
      expect(body, label).toContain('`rules`: アーティファクトIDごとのルール');
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
          '（登録されたスタンドアロン store の場合だけ確認済みの `--store "<id>"` を付けます）'
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
        '条件が該当する、または前提条件が条件付きではない場合'
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
        '条件が該当する、または前提条件が条件付きではない場合は、通常の前提条件として扱い'
      );
      expect(transition, label).toContain('要求されていない前提条件を作成してはいけません');
      expect(transition, label).toContain(
        'その `instruction` の条件が該当しなかったために意図的にスキップ'
      );
      expect(transition, label).toContain('記録し、再検討しません');
      expect(transition, label).toContain('依存関係は有効化条件であり、障害ではありません');
      expect(transition, label).toContain(
        '`blocked` 状態でも `openspec instructions "<artifact-id>" --change "<name>" --json` を実行します'
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
