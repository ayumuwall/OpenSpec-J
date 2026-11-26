import { describe, expect, it } from 'vitest';

import {
  getArchiveChangeSkillTemplate,
  getOpsxArchiveCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const bodies: Array<[string, string]> = [
  ['skill', getArchiveChangeSkillTemplate().instructions],
  ['command', getOpsxArchiveCommandTemplate().content],
];

function section(body: string, start: string, end: string): string {
  return body.slice(body.indexOf(start), body.indexOf(end));
}

describe('archive target check (#2276)', () => {
  it('finds an existing archive before any main spec is written', () => {
    for (const [label, body] of bodies) {
      const step = section(body, '4. **仕様差分の同期状態を評価します**', '5. **アーカイブを実行します**');
      const check = step.indexOf('**最初にアーカイブ先を確認します。**');
      const stop = step.indexOf('が既に存在する場合は、本仕様に書き込む前に停止します。');
      const firstSync = step.indexOf('「今すぐ同期」');
      const recheck = step.indexOf('ここでアーカイブ先を再確認します。');
      const syncWrites = step.indexOf('選択された同期で本仕様へ書き込む前に');

      expect(check, label).toBeGreaterThanOrEqual(0);
      expect(stop, label).toBeGreaterThan(check);
      expect(stop, label).toBeLessThan(firstSync);
      expect(recheck, label).toBeGreaterThan(firstSync);
      expect(recheck, label).toBeLessThan(syncWrites);
      expect(step, label).toContain('今回すでに同期した本仕様があれば名前を示します');
    }
  });

  it('checks the same target again immediately before the move', () => {
    for (const [label, body] of bodies) {
      const step = section(body, '5. **アーカイブを実行します**', '6. **概要を表示**');

      expect(step, label).toContain('手順 4 で記録した `<target-name>` をそのまま使います。');
      expect(step, label).toContain('**移動の直前に、アーカイブ先を再確認します。**');
      expect(step, label).toContain('手順 4 で同期した本仕様があれば報告し');
      expect(step.indexOf('手順 4 で記録した `<target-name>` をそのまま使います。'), label).toBeLessThan(
        step.indexOf('**移動の直前に、アーカイブ先を再確認します。**')
      );
      expect(step.indexOf('**移動の直前に、アーカイブ先を再確認します。**'), label).toBeLessThan(
        step.indexOf('mv "<changeRoot>"')
      );
    }
  });

  it('does not offer a different date as a way out', () => {
    for (const [label, body] of bodies) {
      expect(body, label).not.toContain('別の日付を使用');
      expect(body, label).not.toContain('別の日付になるまで待って');
    }
  });
});
