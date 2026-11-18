import { describe, expect, it } from 'vitest';

import {
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getUpdateChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { getCommandTemplates, getSkillTemplates } from '../../../src/core/shared/skill-generation.js';

describe('workflow list --json field usage', () => {
  it('does not invent schema labels in update and continue pickers', () => {
    const bodies = [
      getUpdateChangeSkillTemplate().instructions,
      getOpsxUpdateCommandTemplate().content,
      getContinueChangeSkillTemplate().instructions,
      getOpsxContinueCommandTemplate().content,
    ];

    for (const body of bodies) {
      const picker = body.slice(body.indexOf('1. **変更を選択する**'), body.indexOf('2. **'));
      expect(picker).toContain('openspec list --json');
      expect(picker).toContain('- 変更名');
      expect(picker).toContain('- 状態');
      expect(picker).toContain('`lastModified`');
      expect(picker).not.toMatch(/schema/i);
      expect(picker).not.toContain('openspec status');

      const status = body.slice(body.indexOf('2. **'), body.indexOf('3. **'));
      expect(status).toContain('openspec status --change "<name>" --json');
      expect(status).toContain('`schemaName`');
    }
  });

  it('limits bulk archive selection to list fields', () => {
    const bodies = [
      getBulkArchiveChangeSkillTemplate().instructions,
      getOpsxBulkArchiveCommandTemplate().content,
    ];

    for (const body of bodies) {
      const picker = body.slice(body.indexOf('2. **'), body.indexOf('3. **'));
      expect(picker).toContain('list の出力から各変更の名前とタスク状態を表示');
      expect(picker).not.toMatch(/schema/i);
      expect(picker).not.toContain('openspec status');

      const status = body.slice(body.indexOf('3. **'), body.indexOf('4. **'));
      expect(status).toContain('openspec status --change "<name>" --json');
      expect(status).toContain('`schemaName`');
    }
  });

  it('does not claim explore receives schemas from list output', () => {
    const bodies = [
      getExploreSkillTemplate().instructions,
      getOpsxExploreCommandTemplate().content,
    ];

    for (const body of bodies) {
      expect(body).toContain('変更の名前とタスク状態');
      expect(body).not.toContain('Their names, schemas, and status');
    }
  });

  // One text for every profile: it names the sync workflow "if installed"
  // and the inline merge otherwise, whether or not sync sits beside it.
  it('keeps bulk archive sync available with and without the sync workflow', () => {
    const variants = [
      [
        getSkillTemplates(['bulk-archive', 'sync']).find((entry) => entry.workflowId === 'bulk-archive')!.template.instructions,
        getSkillTemplates(['bulk-archive'])[0].template.instructions,
        'openspec-sync-specs',
      ],
      [
        getCommandTemplates(['bulk-archive', 'sync']).find((entry) => entry.id === 'bulk-archive')!.template.content,
        getCommandTemplates(['bulk-archive'])[0].template.content,
        '/opsx:sync',
      ],
    ] as const;

    for (const [withSync, withoutSync, workflow] of variants) {
      const syncStep = (text: string) => text.slice(
        text.indexOf('a. **対象に含めた仕様差分を同期**'),
        text.indexOf('b. **`changeRoot` を移動する前に、含めた仕様差分を検証')
      );

      expect(withoutSync).toBe(withSync);
      expect(syncStep(withSync)).toContain('なければ自身で仕様差分を本仕様へ統合');
      expect(syncStep(withSync)).toContain(
        `\`${workflow}\` が導入済みならそのワークフローをインラインで実行`
      );
      expect(syncStep(withSync)).toContain('`includedDeltas`');
      expect(syncStep(withSync)).toContain('`excludedDeltas`');
      expect(withSync).toContain(
        `\`${workflow}\` が導入済みならそのワークフローをインラインで実行`
      );
    }
  });

  it('keeps archive sync available with and without the sync workflow', () => {
    const variants = [
      [
        getSkillTemplates(['archive', 'sync']).find((entry) => entry.workflowId === 'archive')!.template.instructions,
        getSkillTemplates(['archive'])[0].template.instructions,
        'openspec-sync-specs',
      ],
      [
        getCommandTemplates(['archive', 'sync']).find((entry) => entry.id === 'archive')!.template.content,
        getCommandTemplates(['archive'])[0].template.content,
        '/opsx:sync',
      ],
    ] as const;

    for (const [withSync, withoutSync, workflow] of variants) {
      const syncStep = (text: string) => text.slice(
        text.indexOf('4. **仕様差分の同期状態を評価します**'),
        text.indexOf('5. **アーカイブを実行します**')
      );

      expect(withoutSync).toBe(withSync);
      expect(syncStep(withSync)).toContain('なければ自身で仕様差分を本仕様へ統合');
      expect(syncStep(withSync)).toContain(
        `\`${workflow}\` が導入済みならそのワークフローをインラインで実行`
      );
      expect(withSync).toContain(
        `\`${workflow}\` が導入済みならそのワークフローをインラインで実行`
      );
    }
  });
});
