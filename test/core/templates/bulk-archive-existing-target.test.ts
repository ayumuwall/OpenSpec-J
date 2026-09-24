import { describe, expect, it } from 'vitest';

import {
  getBulkArchiveChangeSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getBulkArchiveChangeSkillTemplate();
const command = getOpsxBulkArchiveCommandTemplate();

// Both delivery surfaces must carry the same contract; every behavioral
// assertion below runs against each body.
const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

function archiveStep(body: string, label: string): string {
  const start = body.indexOf('   c. **archiveを実行**:');
  const end = body.indexOf('   d. **変更ごとに結果を記録**:');

  expect(start, label).toBeGreaterThanOrEqual(0);
  expect(end, label).toBeGreaterThan(start);

  return body.slice(start, end);
}

describe('bulk archive existing-target handling', () => {
  // Regression for #1827: step 8c ran `mv` with no existence check. POSIX
  // `mv` moves changeRoot *inside* an existing target directory and exits 0,
  // so a same-day name collision produced
  // archive/<target>/<target>/ and was recorded as a successful archive.
  it('checks the archive target before moving changeRoot (#1827)', () => {
    for (const [label, body] of bodies) {
      const step = archiveStep(body, label);

      expect(step, label).toContain('**対象が既に存在するか確認:**');
      expect(step, label).toContain('アーカイブディレクトリが既に存在します');
      expect(step, label).toContain('`changeRoot` はそのまま残す');
      expect(step, label).toContain('残りの変更を続ける');
    }
  });

  it('orders the existence check between the target name and the move (#1827)', () => {
    for (const [label, body] of bodies) {
      const step = archiveStep(body, label);
      const targetName = step.indexOf('対象名: 手順 3d でこの変更に記録した `<target-name>`');
      const existenceCheck = step.indexOf('**対象が既に存在するか確認:**');
      const move = step.indexOf('mv "<changeRoot>"');

      expect(targetName, label).toBeGreaterThanOrEqual(0);
      expect(existenceCheck, label).toBeGreaterThan(targetName);
      expect(move, label).toBeGreaterThan(existenceCheck);
    }
  });

  // `openspec archive` settles the destination before touching any spec. A
  // collision found only at the move would leave main specs rewritten for a
  // change that stays active, so the batch must check every target first.
  it('checks every archive target before the first main-spec write (#1827)', () => {
    for (const [label, body] of bodies) {
      const preflight = body.indexOf('   d. **アーカイブ先**');
      const conflicts = body.indexOf('4. **仕様の競合を検出**');
      const firstSync = body.indexOf('   a. **対象に含めた仕様差分を同期**');

      expect(preflight, label).toBeGreaterThanOrEqual(0);
      expect(conflicts, label).toBeGreaterThan(preflight);
      expect(firstSync, label).toBeGreaterThan(preflight);

      const step = body.slice(preflight, conflicts);
      expect(step, label).toContain('選択した別の変更が同じ対象名に解決される');
      expect(step, label).toContain('ブロックされた変更は同期も移動もしない');
      expect(body, label).toContain(
        'すべてarchiveする選択肢 — 選択した変更のうち `Blocked` でないものをすべて処理する'
      );
      expect(body, label).toContain(
        '最初の本仕様書き込み前に、手順 3 ですべてのアーカイブ先を確認する'
      );
    }
  });

  // The dated name must be computed once. Recomputing it at the move lets a
  // batch that crosses midnight check yesterday's target in step 3, sync main
  // specs, then collide at today's target with the change still active.
  it('reuses the target name recorded in step 3 for the move (#1827)', () => {
    for (const [label, body] of bodies) {
      const preflight = body.slice(
        body.indexOf('   d. **アーカイブ先**'),
        body.indexOf('4. **仕様の競合を検出**')
      );
      const step = archiveStep(body, label);

      expect(preflight, label).toContain("その変更の `<target-name>` として記録");
      expect(preflight, label).toContain('現在の日付を');
      expect(step, label).toContain(
        '対象名: 手順 3d でこの変更に記録した `<target-name>` をそのまま使います'
      );
      expect(step, label).not.toContain('現在の日付を');
      expect(body, label).toContain('手順 3d で当日の日付から 1 回だけ算出し、移動時にも再利用');
    }
  });

  // The last check and the `mv` are separate steps, so a target created in
  // between still nests the change with exit 0. The workflow must detect the
  // nesting after the move and undo it instead of reporting success.
  it('detects and undoes a move that nested inside a late target (#1827)', () => {
    for (const [label, body] of bodies) {
      const step = archiveStep(body, label);
      const move = step.indexOf('mv "<changeRoot>"');
      const confirm = step.indexOf('**入れ子への移動になっていないか確認:**');

      expect(move, label).toBeGreaterThanOrEqual(0);
      expect(confirm, label).toBeGreaterThan(move);
      expect(step.slice(confirm), label).toContain(
        'そのディレクトリを `changeRoot` へ戻し、`アーカイブディレクトリが既に存在します` と失敗を記録'
      );
    }
  });

  // A collision is a failure in every confirmation path, including ready-only,
  // which otherwise records everything not Ready as Skipped.
  it('keeps blocked changes Failed under the ready-only option (#1827)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'ただし `Blocked` の変更は `アーカイブディレクトリが既に存在します` の失敗のままとする'
      );
    }
  });

  // The guardrail and both failure output templates already promised this
  // outcome while the steps never produced it; keep them in agreement.
  it('keeps the guardrail and failure output consistent with the step (#1827)', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'アーカイブ先が存在する場合は、その変更だけ失敗として他を継続する'
      );
      expect(body, label).toContain('アーカイブディレクトリが既に存在します');
    }
  });
});
