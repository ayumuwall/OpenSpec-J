import { describe, it, expect } from 'vitest';
import {
  getApplyInstructions,
  getApplyChangeSkillTemplate,
  getOpsxApplyCommandTemplate,
} from '../../../src/core/templates/workflows/apply-change.js';

// #1529: agents were silently simplifying or deferring work mid-apply and
// marking tasks done anyway. The apply instructions must tell the agent to
// surface unexpected scope instead of absorbing it, on both surfaces.
describe('apply instructions surface deferred scope (#1529)', () => {
  const instructions = getApplyInstructions();

  it('tells the agent to surface added scope rather than defer or simplify', () => {
    expect(instructions).toContain('追加スコープを明示');
    expect(instructions).toContain('仕様・タスク記載を超える作業');
    expect(instructions).toMatch(/黙って縮小・延期・単純化しない/);
  });

  it('requires pausing, not just reporting and continuing', () => {
    // The agent must hand control back, not surface the scope and press on.
    expect(instructions).toContain('追加スコープを明示して一時停止');
  });

  it('forbids marking a task complete when it is only partially done', () => {
    expect(instructions).toMatch(
      /指定された振る舞いを完全に実装したときだけ、タスクを/
    );
  });

  it('carries the same guidance on both the skill and command surfaces', () => {
    const needle = '追加スコープを明示';
    expect(getApplyChangeSkillTemplate().instructions).toContain(needle);
    expect(getOpsxApplyCommandTemplate().content).toContain(needle);
  });
});
