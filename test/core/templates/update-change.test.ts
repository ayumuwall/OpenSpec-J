import { describe, expect, it } from 'vitest';

import {
  getUpdateChangeSkillTemplate,
  getOpsxUpdateCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { STORE_SELECTION_GUIDANCE } from '../../../src/core/templates/workflows/store-selection.js';

const skill = getUpdateChangeSkillTemplate();
const command = getOpsxUpdateCommandTemplate();

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

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
      expect(body, label).toContain('中止し、`/opsx:apply` を案内します');
      expect(body, label).toContain('ビルドの進行地点を先に進めません');
      expect(body, label).toContain('まだ存在しないアーティファクトを作成しないでください');
    }
  });

  it('writes to existingOutputPaths, never to a glob resolvedOutputPath (3.4)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('artifactPaths.<id>.existingOutputPaths');
      expect(body, label).toContain('`resolvedOutputPath` には書き込まないでください');
      expect(body, label).toContain('依然としてグロブ パターンであり、実際のファイルではありません');
    }
  });

  it('ends with next-step guidance and never acts on it (3.5)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('ガイダンスのみ - 決して行動しないでください');
      expect(body, label).toContain('`/opsx:continue`');
      expect(body, label).toContain('`/opsx:apply`');
      expect(body, label).toContain('`/opsx:archive`');
      expect(body, label).toContain('コードは改訂された計画と一致しなくなる可能性があります');
    }
  });

  it('explains the optional continue workflow before suggesting it', () => {
    for (const [label, body] of bodies) {
      const availabilityGuidance = body.indexOf(
        '`/opsx:continue` は任意のワークフローで、インストールされていない場合があります'
      );
      const firstSuggestion = body.indexOf(
        '`/opsx:continue`',
        availabilityGuidance + '`/opsx:continue`'.length
      );

      expect(availabilityGuidance, label).toBeGreaterThanOrEqual(0);
      expect(body.indexOf('`/opsx:continue`'), label).toBe(availabilityGuidance);
      expect(firstSuggestion, label).toBeGreaterThan(availabilityGuidance);
      expect(body, label).toContain(
        '利用できない場合は、`openspec status --change "<name>" --json` で次のアーティファクトを確認'
      );
      expect(body, label).toContain(
        '`openspec instructions "<artifact-id>" --change "<name>" --json` で作成方法を確認'
      );
    }
  });

  it('confirms every edit and redirects intent changes to /opsx:new', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('ユーザーが確認した後にのみ書き込みます');
      expect(body, label).toContain('ユーザーがリビジョンを拒否した場合は、リビジョンを書き込まないでください');
      expect(body, label).toContain('`/opsx:new` で新しく始めることを提案します');
      expect(body, label).toContain('更新か新規開始か');
      expect(body, label).toContain('未使用で区別できる変更名を確認');
      expect(body, label).toContain('openspec new change "<new-change-name>"');
      expect(body, label).not.toContain('openspec new change "<name>"');

      const newAvailabilityCheck = body.indexOf(
        'まず任意の `/opsx:new` ワークフローが利用可能か確認'
      );
      const newRecommendation = body.indexOf('`/opsx:new` で新しく始めることを提案');
      expect(newAvailabilityCheck, label).toBeGreaterThanOrEqual(0);
      expect(body.slice(0, newAvailabilityCheck), label).not.toContain('`/opsx:new`');
      expect(newRecommendation, label).toBeGreaterThan(newAvailabilityCheck);
    }
  });
});
