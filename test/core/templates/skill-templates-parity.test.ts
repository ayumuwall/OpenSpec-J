import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyInstructions,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getUpdateChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  generateSkillContent,
  getCommandContents,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { STORE_SELECTION_GUIDANCE } from '../../../src/core/templates/workflows/store-selection.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '8457ebbbb7a31f6974c4b9b264be3aa6d75f751704b6ffba994515d9755f404d',
  getNewChangeSkillTemplate: 'db40ed5920852d210cb42122298ec0baca3f11a8b968ab1b5565ab1d3d62f38b',
  getContinueChangeSkillTemplate: '01977bc5c7c2f6a2bccc0f5666fc03fc148f89c28d15bd26694c82c46a798d24',
  getApplyChangeSkillTemplate: '7ce33a37119c459dae38cc3e6533b8c988477f9e8bd35c8da745a3ea9a57316d',
  getFfChangeSkillTemplate: '0d7e2cebef14c8bdd5deb7608f7d148c92659e3716ad04ce0fba1837db20c32f',
  getSyncSpecsSkillTemplate: '79e569416749724a0d404782f10c4adc4e89d8ea2e772e35b1980230ec500020',
  getOnboardSkillTemplate: 'a2ce411ab84f0e12d915a47f66b0d2a15d56e003111e9d6ac7382a224a0f9ffd',
  getOpsxExploreCommandTemplate: 'a5ef467e4ca42262cc442fc57e785098e5b63ed34b415c9424c3341dbd16ed03',
  getOpsxNewCommandTemplate: 'f5e553c5052635f6263b78fdcdd31fb9cbe9a6c44ffba3104ee5cd7c7561e025',
  getOpsxContinueCommandTemplate: 'a1c0c43f5daf566e485b21dc5e09607f66000c9d0cba4865f1e5a1284008074a',
  getOpsxApplyCommandTemplate: '27b678fc6272f3f0d30073933de0b689518acb134e60771f829d44e0bb36d7ec',
  getOpsxFfCommandTemplate: '083eafd1f758cec561a00b8cb4eb1d6e2fd276da8843bb33f668e601329336d4',
  getArchiveChangeSkillTemplate: '0abef2960417704ccf88b96e65509749697450d0b385b5cda4d9fb943ca5e55c',
  getBulkArchiveChangeSkillTemplate: 'e1ba5fb9b983ec1cab90cf49fd6a86a5849a3bdca058c2598f87ec1ffa4cb081',
  getOpsxSyncCommandTemplate: '9a22c1df5869e26157897d2fc301bb608b3d10695c335d1c49014c10ff610a96',
  getVerifyChangeSkillTemplate: '511a4714c4e65d9d5d6c9258f7100c57fa115e869b6c630e36bf244f0031f43d',
  getOpsxArchiveCommandTemplate: 'cacf0d8de1f56b6adce9d46815d4e6fc7d6f875f908842a70e18f8d46e1677ee',
  getOpsxOnboardCommandTemplate: '5bc27cfad7fec18f352f6b5dec8fae76146d5229303157ad8305ff6523c88e26',
  getOpsxBulkArchiveCommandTemplate: '364c23d82b21b2e442e229af3d0e839228aa2cf9b6e54deda8b8f33d145ffd8a',
  getOpsxVerifyCommandTemplate: '5a7ad1e38ea469821125fe74c2a68efcf78f35e8cef1e5c42a850fcce75a0f7a',
  getOpsxProposeSkillTemplate: '649e52baffcf3911223a3da4f4422a5d879da5b699d0e9a7e239896d192dee81',
  getOpsxProposeCommandTemplate: '0e9b45508f65f06e6127e875b9908c2bc55543acbc1db89c6a2d1bfceae8957a',
  getFeedbackSkillTemplate: 'b30b6cf2cd5705c906078d3831fe7fffed8739652da757938ad84f82755a58fd',
  getUpdateChangeSkillTemplate: '1b18321b73f33c917153972210423c5f9f38445395160c58ff798aeb1518ddfd',
  getOpsxUpdateCommandTemplate: '102fa83152ff51fc7d2467a837cec3f374d1e5b694643da269a5321f406c6f33',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'f68227e77244475266fe49541fd3cdbf62001dee22df02ae2d46e7efa2472d29',
  'openspec-new-change': '859af1966a7daf004bc83ef62611c8798df6b070d2f10e90849eccc239a4e9e6',
  'openspec-continue-change': 'cb105a8efdba7b68e7c09c14950e933fc564ed5ddb5fb4b82f6cf647b3ca4077',
  'openspec-apply-change': '2e3e4b6df1d069f6041fdfbc01d22ecc1821e5d40c82e39b6c32457efc5da9d3',
  'openspec-ff-change': '58359f2ce68c72cb09235305a85f120f10f712aac65213861ea3348637a5b8e5',
  'openspec-sync-specs': 'a9342cf9839a394f9f9cded07a85f526d28b6fc90e3caac92a82119f398c21d7',
  'openspec-archive-change': '97210818a56091df90a1f7f78d548b21a2d048bf121f3a9e4f33c5da42b5407b',
  'openspec-bulk-archive-change': '8bd6cefe938ed6bb0bab43cebdcc226693af325bedcebaa41d19b4d90368ee26',
  'openspec-verify-change': 'dbbc14ebab95aafdb91b030264b5b29201e7a7ef8b9f2b55423c1456a09a94c7',
  'openspec-onboard': 'dcffc2033b4c4550d777739f4503c0c34151df137557d2801a5efa58a1469bc5',
  'openspec-propose': '9f950bd11e13e11653891c999aef8745a4e8d646c3b13f7018c157c0d866b868',
  'openspec-update-change': '24238e35ab5c72c9af1d7c2055ebecb4bde1f9087d8003f00486d4ab071cd325',
};

// Intentionally excludes getFeedbackSkillTemplate: this list only models templates
// deployed via generateSkillContent, while feedback is covered in function payload parity.
const GENERATED_SKILL_FACTORIES: Array<[string, () => SkillTemplate]> = [
  ['openspec-explore', getExploreSkillTemplate],
  ['openspec-new-change', getNewChangeSkillTemplate],
  ['openspec-continue-change', getContinueChangeSkillTemplate],
  ['openspec-apply-change', getApplyChangeSkillTemplate],
  ['openspec-ff-change', getFfChangeSkillTemplate],
  ['openspec-sync-specs', getSyncSpecsSkillTemplate],
  ['openspec-archive-change', getArchiveChangeSkillTemplate],
  ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
  ['openspec-verify-change', getVerifyChangeSkillTemplate],
  ['openspec-onboard', getOnboardSkillTemplate],
  ['openspec-propose', getOpsxProposeSkillTemplate],
  ['openspec-update-change', getUpdateChangeSkillTemplate],
];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('日本語の検証指示で未対応シナリオへの警告と部分検証を維持する', () => {
    for (const content of [
      getVerifyChangeSkillTemplate().instructions,
      getOpsxVerifyCommandTemplate().content,
    ]) {
      expect(content).toContain('シナリオが実装・テストでカバーされていない場合:');
      expect(content).toContain('警告を追加: 「シナリオはカバーされていません:');
      expect(content).toContain('tasks.md のみが存在する場合: タスクの完了のみを検証し、仕様/設計チェックをスキップ');
      expect(content).toContain('### Requirement:');
      expect(content).toContain('#### Scenario:');
      expect(content).not.toMatch(/[\u200b\ufffd]/);
    }
  });

  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOpsxSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxVerifyCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
      getUpdateChangeSkillTemplate,
      getOpsxUpdateCommandTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    const actualHashes = Object.fromEntries(
      GENERATED_SKILL_FACTORIES.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  // The assertion above only compares the skills this file already lists, so a
  // workflow added to getSkillTemplates() but never pinned here would ship with
  // no golden hash and nothing would fail. Pin the registry itself.
  it('pins every skill the production registry deploys', () => {
    const pinned = GENERATED_SKILL_FACTORIES.map(([dirName]) => dirName).sort();
    const deployed = getSkillTemplates().map(({ dirName }) => dirName).sort();

    expect(pinned, 'add the new skill to GENERATED_SKILL_FACTORIES and EXPECTED_GENERATED_SKILL_CONTENT_HASHES').toEqual(deployed);
  });

  // Iterating the production registries (not a local list) means a newly
  // added workflow is covered automatically; the full-constant containment
  // check fails if any template's interpolation drifts.
  it('teaches store selection in every deployed skill template', () => {
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain(STORE_SELECTION_GUIDANCE);
    }
  });

  // Auto-approve the OpenSpec CLI: every generated skill carries
  // `allowed-tools: Bash(openspec:*)` so agents that honor it stop prompting
  // on each `openspec` call. Iterating the registry covers new skills too.
  it('pre-approves the openspec CLI via allowed-tools in every deployed skill', () => {
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain('allowed-tools: Bash(openspec:*)');
    }
  });

  it('teaches store selection in every deployed opsx command template', () => {
    for (const entry of getCommandContents()) {
      expect(entry.body, entry.id).toContain(STORE_SELECTION_GUIDANCE);
    }

    // Feedback has no store-capable command and intentionally carries no
    // store teaching; it ships outside both registries.
    expect(getFeedbackSkillTemplate().instructions).not.toContain('**Store selection:**');
  });

  it('keeps a selected store on every applicable workflow command', () => {
    expect(STORE_SELECTION_GUIDANCE).toContain(
      '一度選んだら、その後のワークフローでは `--store <id>` を維持します'
    );
    expect(STORE_SELECTION_GUIDANCE).toContain(
      '以下にフラグなしで示すコマンド例は省略形なので、実行前にフラグを追加してください'
    );
    expect(STORE_SELECTION_GUIDANCE).toContain(
      'openspec status --change "<name>" --json --store "<id>"'
    );
    expect(STORE_SELECTION_GUIDANCE).toContain('`context`、`schemas`、`view`');
  });

  it('validates synced main specs before reporting success', () => {
    const variants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      const mutationsComplete = content.indexOf(
        '以下の **本仕様フォーマットリファレンス** に従います'
      );
      const validation = content.indexOf('openspec validate --specs');
      const summary = content.indexOf('**概要を表示する**');

      expect(mutationsComplete, variant).toBeGreaterThanOrEqual(0);
      expect(validation, variant).toBeGreaterThan(mutationsComplete);
      expect(summary, variant).toBeGreaterThan(validation);
      expect(content, variant).toContain('同じ選択済みルート用フラグ');
      expect(content, variant).toContain(
        '検証に失敗した場合は問題を報告し、同期が成功したとは伝えてはいけません'
      );
    }
  });

  it('preserves nested capability paths in spec-aware workflow guidance (#1459)', () => {
    const capabilityPathDefinition =
      '`<capability-path>` は `specs/` からの相対仕様ディレクトリ';
    const pathAwareTemplates: Array<[string, string, string, string]> = [
      [
        'propose skill',
        generateSkillContent(getOpsxProposeSkillTemplate(), 'PARITY-BASELINE'),
        'specs/<capability-path>/spec.md',
        '既存の機能では完全なパスを維持',
      ],
      [
        'propose command',
        getOpsxProposeCommandTemplate().content,
        'specs/<capability-path>/spec.md',
        '既存の機能では完全なパスを維持',
      ],
      [
        'explore skill',
        generateSkillContent(getExploreSkillTemplate(), 'PARITY-BASELINE'),
        'specs/<capability-path>/spec.md',
        '既存の機能では完全なパスを維持',
      ],
      [
        'explore command',
        getOpsxExploreCommandTemplate().content,
        'specs/<capability-path>/spec.md',
        '既存の機能では完全なパスを維持',
      ],
      [
        'onboard skill',
        generateSkillContent(getOnboardSkillTemplate(), 'PARITY-BASELINE'),
        '<existing-capability-path>',
        '変更する機能には既存の完全なパスを使用',
      ],
      [
        'onboard command',
        getOpsxOnboardCommandTemplate().content,
        '<existing-capability-path>',
        '変更する機能には既存の完全なパスを使用',
      ],
      [
        'sync skill',
        generateSkillContent(getSyncSpecsSkillTemplate(), 'PARITY-BASELINE'),
        '<planningHome.root>/openspec/specs/<capability-path>/spec.md',
        '各仕様差分から本仕様を解決するときは、完全なパスを維持',
      ],
      [
        'sync command',
        getOpsxSyncCommandTemplate().content,
        '<planningHome.root>/openspec/specs/<capability-path>/spec.md',
        '各仕様差分から本仕様を解決するときは、完全なパスを維持',
      ],
      [
        'archive skill',
        generateSkillContent(getArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
        '<planningHome.root>/openspec/specs/<capability-path>/spec.md',
        '各仕様差分から本仕様を解決するときは、完全なパスを維持',
      ],
      [
        'archive command',
        getOpsxArchiveCommandTemplate().content,
        '<planningHome.root>/openspec/specs/<capability-path>/spec.md',
        '各仕様差分から本仕様を解決するときは、完全なパスを維持',
      ],
      [
        'bulk archive skill',
        generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
        '<planningHome.root>/openspec/specs/<capability-path>/spec.md',
        '各仕様差分から本仕様を解決するときは、完全なパスを維持',
      ],
      [
        'bulk archive command',
        getOpsxBulkArchiveCommandTemplate().content,
        '<planningHome.root>/openspec/specs/<capability-path>/spec.md',
        '各仕様差分から本仕様を解決するときは、完全なパスを維持',
      ],
    ];

    for (const [label, content, destination, preservationGuidance] of pathAwareTemplates) {
      expect(content, label).toContain(capabilityPathDefinition);
      expect(content, label).toContain(destination);
      expect(content, label).toContain(preservationGuidance);
      expect(content, label).not.toContain('specs/<capability>/spec.md');
    }

    const onboardVariants: Array<[string, string]> = [
      [
        'onboard skill',
        generateSkillContent(getOnboardSkillTemplate(), 'PARITY-BASELINE'),
      ],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [label, content] of onboardVariants) {
      expect(content, label).toContain(
        '- `<capability-path>`: [内容の簡潔な説明]'
      );
      expect(content, label).not.toContain('<capability-name>');
    }

    const bulkArchiveVariants: Array<[string, string]> = [
      [
        'bulk archive skill',
        generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
      ],
      ['bulk archive command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [label, content] of bulkArchiveVariants) {
      expect(content, label).toContain(
        '`specs/` からの正確な相対パスである `<capability-path>` をキーにしたマップを作成'
      );
      expect(content, label).toContain(
        'billing/user-auth  -> [change-c]            <- 問題なし（完全パスが異なる）'
      );
      expect(content, label).toContain(
        'identity/user-auth -> [change-a, change-b]  <- 競合（2件以上の変更）'
      );
      expect(content, label).toContain('identity/user-auth (!)');
      expect(content, label).toContain(
        'まったく同じ `<capability-path>`'
      );
      expect(content, label).toContain(
        '変更と `<capability-path>` をキーに'
      );
      expect(content, label).toContain(
        'identity/user-auth 仕様: add-oauth、次に add-jwt を適用します'
      );
      expect(content, label).toContain(
        'add-jwt、identity/user-auth: 実装が見つからない'
      );
      expect(content, label).toContain(
        '1 件の競合を解決（identity/user-auth: add-oauth を同期、add-jwt をスキップ）'
      );
      expect(content, label).not.toContain('\n   auth -> [change-a');
      expect(content, label).not.toContain('| auth (!)');
      expect(content, label).not.toContain('(auth: synced');
      expect(content, label).not.toContain('add-jwt/auth:');
    }
  });

  it('keeps onboarding task examples aligned with concrete verification guidance (#345)', () => {
    const variants: Array<[string, string]> = [
      ['onboard skill', generateSkillContent(getOnboardSkillTemplate(), 'PARITY-BASELINE')],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [label, content] of variants) {
      const taskBlock = content.match(
        /実装タスクは次の通りです:([\s\S]*?)各チェックボックスが apply フェーズの単位作業/
      )?.[1];
      expect(taskBlock, label).toBeDefined();
      const checkboxes = taskBlock!
        .split('\n')
        .filter(line => /^- \[ \] \d+\.\d+ /.test(line));
      expect(checkboxes, label).toHaveLength(3);
      expect(
        checkboxes.every(
          line =>
            line.endsWith(
              '[具体的なタスク] — 検証: [テスト、コマンド、観察可能な振る舞い、または納品物]'
            ) || /を\[エンドツーエンドテストまたは観察可能な結果\]で検証$/.test(line)
        ),
        label
      ).toBe(true);
      expect(content, label).toContain(
        '[具体的なタスク] — 検証: [テスト、コマンド、観察可能な振る舞い、または納品物]'
      );
      expect(content, label).toContain(
        '[より広範な統合またはシステム動作]を[エンドツーエンドテストまたは観察可能な結果]で検証'
      );
      expect(content, label).not.toContain('[検証手順]');
    }
  });

  it('keeps OpenSpec structural tokens intact in verify guidance', () => {
    const variants: Array<[string, string]> = [
      ['verify skill', generateSkillContent(getVerifyChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['verify command', getOpsxVerifyCommandTemplate().content],
    ];

    for (const [label, content] of variants) {
      expect(content, label).toContain('`### Requirement:`');
      expect(content, label).toContain('`#### Scenario:`');
      expect(content, label).not.toContain('### 要件:');
      expect(content, label).not.toContain('#### シナリオ:');
    }
  });

  it('generates no workspace-planning residue in any workflow template (4.1)', () => {
    const allSkills: Array<[string, () => SkillTemplate]> = [
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
    ];

    for (const [dirName, createTemplate] of allSkills) {
      const content = generateSkillContent(createTemplate(), 'PARITY-BASELINE');
      expect(content, dirName).not.toContain('workspace-planning');
      expect(content, dirName).not.toContain('Workspace guard');
    }
  });

  it('does not suggest archiving when only planning is complete', () => {
    const variants: Array<[string, string]> = [
      [
        'skill',
        generateSkillContent(getContinueChangeSkillTemplate(), 'PARITY-BASELINE'),
      ],
      ['opsx command', getOpsxContinueCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('計画が完了しました');
      expect(content, variant).toContain(
        '実装と追跡対象の作業がすべて完了したら'
      );
      expect(content, variant).not.toContain('All artifacts created!');
      expect(content, variant).not.toContain('or archive it');
    }
  });

  it('gates the archive on a completed spec sync (#1393)', () => {
    const generatedSkill = generateSkillContent(getArchiveChangeSkillTemplate(), 'PARITY-BASELINE');
    const commandContent = getOpsxArchiveCommandTemplate().content;

    // The single archive skill references openspec-sync-specs; opsx command references /opsx:sync.
    expect(generatedSkill, 'skill').toContain('`openspec-sync-specs` ワークフローをインライン');
    expect(commandContent, 'opsx command').toContain('`/opsx:sync` ワークフローをインライン');

    const variants: Array<[string, string]> = [
      ['skill', generatedSkill],
      ['opsx command', commandContent],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('バックグラウンドタスクへ委任しないでください');
      expect(content, variant).toContain('仕様同期の実行中にarchiveしない');

      // Verification must follow delta semantics.
      expect(content, variant).toContain('MODIFIED 要件には delta で示したシナリオおよび説明の変更が反映');
      expect(content, variant).toContain('REMOVED 要件が存在しない');
      expect(content, variant).toContain('RENAMED 要件は新しい名前で存在し、古い名前では存在しない');

      // Verification is bound to the delta specs on disk, not to whatever the sync reports it touched.
      expect(content, variant).toContain('同期で更新したと報告されたものだけには限定しません');

      // Main spec paths are store-root aware
      expect(content, variant).toContain('<planningHome.root>/openspec/specs/<capability-path>/spec.md');
    }
  });

  it('gates bulk archive on inline synchronous spec sync and verification before moving change root', () => {
    const generatedSkill = generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE');
    const commandContent = getOpsxBulkArchiveCommandTemplate().content;

    // The bulk archive skill references openspec-sync-specs; opsx command references /opsx:sync.
    expect(generatedSkill, 'bulk skill').toContain('`openspec-sync-specs` ワークフローをインライン');
    expect(commandContent, 'bulk opsx command').toContain('`/opsx:sync` ワークフローをインライン');

    const variants: Array<[string, string]> = [
      ['bulk skill', generatedSkill],
      ['bulk opsx command', commandContent],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('バックグラウンドタスクへ委任しない');
      expect(content, variant).toContain('仕様同期の実行中にアーカイブしない');
      expect(content, variant).toContain('含めた delta だけを同期・検証する');

      // Verification must follow delta semantics.
      expect(content, variant).toContain('MODIFIED 要件には delta で示したシナリオおよび説明の変更が反映');
      expect(content, variant).toContain('REMOVED 要件が存在しない');
      expect(content, variant).toContain('RENAMED 要件は新しい名前で存在し、古い名前では存在しない');

      // Main spec paths are store-root aware
      expect(content, variant).toContain('<planningHome.root>/openspec/specs/<capability-path>/spec.md');
    }
  });

  it('carries mixed included and excluded bulk-archive deltas through both generated variants', () => {
    const variants: Array<[string, string]> = [
      [
        'bulk skill',
        generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE'),
      ],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain(
        '各仕様差分を含めるか除外するかの判断'
      );
      expect(content, variant).toContain(
        '`includedDeltas`'
      );
      expect(content, variant).toContain(
        '`includedDeltas` に項目がある変更だけで'
      );
      expect(content, variant).not.toContain(
        'for each change, passing the delta spec analysis'
      );
      expect(content, variant).toContain(
        '`includedDeltas` の仕様差分だけを'
      );
      expect(content, variant).toContain(
        '`excludedDeltas` の仕様差分は意図的に未同期のため、検証しません'
      );
      expect(content, variant).toContain('`同期をスキップ` と報告します');
      expect(content, variant).toContain(
        'アーカイブ自体のスキップとは区別します'
      );

      // These three carried no assertion, so deleting any of them from a
      // single variant was caught only by the golden hash — and this repo
      // regenerates hashes as a matter of routine, which makes that no
      // protection at all.
      expect(content, variant).toContain(
        '`includedDeltas`: 確認済み変更の競合しない全仕様差分と、同期対象として選択した競合デルタ'
      );
      expect(content, variant).toContain(
        '`excludedDeltas`: 実装がないため、確認済み変更から同期対象外とした競合デルタ'
      );
      expect(content, variant).toContain(
        'delta ごとの `includedDeltas` と `excludedDeltas` の判断を実行へ引き継ぎ'
      );
      // The worked example must show the skip, or the agent has no model of
      // what a partially-synced batch report looks like.
      expect(content, variant).toContain(
        '1 件の仕様差分同期をスキップ（add-jwt、identity/user-auth: 実装が見つからない）'
      );
    }
  });

  it('lets the sync workflow honor the delta subset bulk archive hands it', () => {
    // Bulk archive tells sync to ignore excludedDeltas, but sync treats
    // existingOutputPaths as its own source of truth. Without an explicit
    // carve-out the callee re-syncs the delta the caller withheld, step 8b
    // never checks it (it verifies only includedDeltas), and the run still
    // reports `sync skipped` for a spec that was in fact written.
    const variants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain(
        '呼出元が絞る場合は、`existingOutputPaths` から完全なエントリの明示的な一覧を指定します'
      );
      expect(content, variant).toContain('指定されたパスだけを同期し、残りの仕様差分には手を触れません');
      expect(content, variant).toContain('全一覧へ戻してはいけません');
      expect(content, variant).toContain(
        '呼出元が対象を絞っていない限り、`existingOutputPaths` の全パスを同期します'
      );
      expect(content, variant).toContain('その絶対パスをそのままコピーします');
      expect(content, variant).toContain('で終わるエントリを選択');
      expect(content, variant).toContain('/specs/billing/invoices/spec.md');
      expect(content, variant).not.toContain('only sync the billing delta');
      expect(content, variant).not.toContain('only sync `specs/billing/invoices/spec.md`');

      // Step 4 is the operative loop. Narrowing step 3 alone left the loop
      // still iterating "each path returned by the CLI", which re-widens the
      // set and re-syncs the delta the caller withheld — the original bug,
      // one step further down the template.
      expect(content, variant).toContain(
        '手順3で選択した各機能の仕様差分パス'
      );
      expect(content, variant).not.toContain(
        'For each capability delta spec path returned by the CLI'
      );

      // The undefined edges: a named path outside existingOutputPaths, and an
      // empty named list. Both must stop rather than proceed on a guess.
      expect(content, variant).toContain('指定されたパスが');
      expect(content, variant).toContain('`existingOutputPaths` にない場合');
      expect(content, variant).toContain('指定一覧が空なら');
      expect(content, variant).toContain('同期対象がないことを報告し');
    }
  });

  it('requires apply context while keeping guidance advisory and state separate', () => {
    const variants: Array<[string, string]> = [
      ['apply skill', getApplyChangeSkillTemplate().instructions],
      ['apply command', getOpsxApplyCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('任意の `context`');
      expect(content, variant).toContain('任意の `operationGuidance`');
      expect(content, variant).toContain('`context` はプロンプトレベルの必須入力として扱います');
      expect(content, variant).toContain('関連するプロジェクトの事実、規約、制約を適用');
      expect(content, variant).toContain(
        '`operationGuidance` は任意の追加助言として扱います'
      );
      expect(content, variant).toContain('すべての項目を読み取って');
      expect(content, variant).toContain('適用可能で互換性のある');
      expect(content, variant).toContain(
        'CLI が返す状態、不足アーティファクト、タスク'
      );
      expect(content, variant).toContain(
        'context や operation guidance をタスク完了の根拠にしない'
      );
      expect(content, variant).toContain('競合を報告して制御側の値を維持');
      expect(content, variant).toContain('従わず、理由を説明');
      expect(content, variant).toContain(
        '実装ファイルや計画アーティファクトへそのままコピーしないでください'
      );
      expect(content, variant).toContain(
        'CLI が制御する blocked/ready/all-done の振る舞い'
      );
      expect(content, variant).toContain(
        'プロンプトレベルの振る舞いの契約であり、'
      );
    }
  });

  it('makes the archive-inputs lookup fail open and sync instruction consumption fail closed', () => {
    const archiveVariants: Array<[string, string]> = [
      ['archive skill', getArchiveChangeSkillTemplate().instructions],
      ['archive command', getOpsxArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of archiveVariants) {
      expect(content, variant).toContain(
        'openspec instructions archive --change "<name>" --json'
      );
      expect(content, variant).toContain('同じ選択済みルートのフラグ');
      // The archive-inputs lookup is a new CLI command, so a skill installed
      // ahead of the CLI (skills.sh) must degrade instead of blocking archiving.
      expect(content, variant).toContain('参考情報を得る任意の処理');
      expect(content, variant).toContain('archiveをブロックしてはいけません');
      expect(content, variant).toContain('このコマンドに未対応の古いCLI');
      expect(content, variant).toContain(
        'contextとoperation guidanceなしでarchiveワークフローを続行します'
      );
      expect(content, variant).toContain('エラーを報告せず、停止もしません');
      expect(content, variant).not.toContain(
        'stop before inspecting or\n   writing specs or moving the change'
      );
      expect(content, variant).toContain('成功したレスポンスでも、2つの任意フィールドが省略される場合があります');
      expect(content, variant).toContain(
        '`context` は\n   プロンプトレベルの必須入力'
      );
      expect(content, variant).toContain(
        '`operationGuidance` は任意の追加助言'
      );
      expect(content, variant).toContain('すべての項目を読み取って検討');
      expect(content, variant).toContain('競合を報告して制御側の値を維持');
      expect(content, variant).toContain('従わず、理由を説明します');
      expect(content, variant).toContain(
        'status JSONの `artifactPaths.specs.existingOutputPaths` だけを'
      );
      expect(content, variant).toContain('`specs` 項目がない');
      expect(content, variant).toContain('他のアーティファクトから仕様差分を推測しません');
      expect(content, variant).toContain(
        'openspec instructions specs --change "<name>" --json'
      );
      expect(content, variant).toContain('本仕様の書き込みや変更の移動前に停止');
      expect(content, variant).toContain('有効なレスポンスで `rules` が省略されていれば');
      expect(content, variant).toContain('インライン同期はこのスナップショットを再利用');
      expect(content, variant).toContain('archiveのガイダンスとして使ったり');
      expect(content, variant).toContain(
        '既存のCLI検査、解決済みパス、プロンプト、コマンドの契約を変更しない'
      );
      expect(content, variant).toContain(
        '実行時context、operation guidance、アーティファクトルールの本文を出力ファイルへそのままコピーしない'
      );
      expect(content, variant).toContain(
        'アーティファクトルールは書き込む仕様だけを制約し、operation guidanceとして扱わない'
      );
    }

    const syncVariants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of syncVariants) {
      expect(content, variant).toContain(
        'status JSON の `artifactPaths.specs.existingOutputPaths` だけを'
      );
      expect(content, variant).toContain('`specs` 項目がない');
      expect(content, variant).toContain('他のアーティファクトから推測せず');
      expect(content, variant).toContain('再利用し、同じ指示を再取得しません');
      expect(content, variant).toContain('それ以外の場合は、同じ選択済みルートのフラグを付けてこのコマンドを1回実行します');
      expect(content, variant).toContain('本仕様へ書き込む前に終了します');
      expect(content, variant).toContain('失敗をルールセットなしとして扱わない');
      expect(content, variant).toContain('`rules` が省略された有効な応答');
      expect(content, variant).toContain('アーティファクトルールは操作手順ではなく');
      expect(content, variant).toContain('そのままコピーせず');
    }
  });

  it('keeps bulk archive instruction lookups atomic across mixed-schema batches', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', getBulkArchiveChangeSkillTemplate().instructions],
      ['bulk command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('選択したルートの現在のarchive入力を1回読み込む');
      expect(content, variant).toContain(
        'openspec instructions archive --change "<selected-change>" --json'
      );
      // Same rule as the single-change skill: a missing archive-inputs command
      // must not take down a whole batch.
      expect(content, variant).toContain('参考情報を得る任意の処理');
      expect(content, variant).toContain('一括処理をブロックしてはいけません');
      expect(content, variant).toContain(
        'contextとoperation guidanceなしで一括処理を続行します'
      );
      expect(content, variant).not.toContain(
        'stop the whole batch before inspecting specs, writing main specs'
      );
      expect(content, variant).toContain(
        'この一覧だけを仕様差分の情報源として扱う'
      );
      expect(content, variant).toContain('`specs` 項目がない、または一覧が空');
      expect(content, variant).toContain('混在スキーマの一括処理');
      expect(content, variant).toContain('必要な specs ルールのスナップショットをすべて取得');
      expect(content, variant).toContain(
        '最初の書き込みや移動前に、すべてのスナップショットを取得します'
      );
      expect(content, variant).toContain(
        '本仕様の書き込みや変更の移動前に一括処理全体を停止します'
      );
      expect(content, variant).toContain(
        '再取得せず再利用'
      );
      expect(content, variant).toContain(
        '`context` は一括処理全体でプロンプトレベルの必須入力'
      );
      expect(content, variant).toContain(
        '`operationGuidance` は任意の追加助言'
      );
      expect(content, variant).toContain('すべての項目を読み取って検討');
      expect(content, variant).toContain('競合を報告して制御側の値を維持');
      expect(content, variant).toContain('従わず、理由を説明');
      expect(content, variant).toContain(
        '実行時入力、競合分析、CLI 由来の値、アーティファクトルールを分離して扱う'
      );
      expect(content, variant).toContain(
        'アーティファクトルールは書き込む仕様だけを制約する'
      );
      expect(content, variant).toContain(
        '実行時入力やアーティファクトルールの本文を出力ファイルへそのままコピーしない'
      );
    }
  });

  // The archive instructions must mirror `openspec archive`'s date-prefix
  // rule (#1316): a change already named with a `YYYY-MM-DD-` prefix keeps
  // its name, so archived names never stack dates. Guard the caveat, the
  // literal `mv` target, and the success-summary examples an agent would
  // copy verbatim (#1317).
  it('never instructs stacking a date prefix on an already-dated change (#1317)', () => {
    const archiveInstructions: Array<[string, string]> = [
      ['openspec-archive-change', getArchiveChangeSkillTemplate().instructions],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate().instructions],
      ['openspec-onboard', getOnboardSkillTemplate().instructions],
      ['opsx-archive', getOpsxArchiveCommandTemplate().content],
      ['opsx-bulk-archive', getOpsxBulkArchiveCommandTemplate().content],
      ['opsx-onboard', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [id, text] of archiveInstructions) {
      expect(text, id).toContain('すでに `YYYY-MM-DD-` で始まる');

      // Every archive path an agent reproduces must name the derived target,
      // never a hardcoded date.
      expect(text, id).toContain('<target-name>');

      // Discriminator: a `YYYY-MM-DD-` after a path separator belongs to a
      // literal archive path the agent copies verbatim. The rule statements
      // only name the prefix, never place it in a path, so they stay legal.
      expect(text, id).not.toMatch(/\/YYYY-MM-DD-/);
    }
  });

  // Guidance that tells an agent to run `openspec archive` has to pass
  // --yes: the agent cannot answer the confirmation prompts from a tool
  // call, so the bare command aborts (#1479). A golden hash proves the
  // generated file matches its source, never that the source is right, so
  // pin the flag itself.
  it('passes --yes wherever it tells an agent to run openspec archive (#1479)', () => {
    // Sweep the whole corpus, not just the one template that has such an
    // invocation today: the point is to catch the next one.
    const corpus: Array<[string, string]> = [
      ...getSkillTemplates().map(
        ({ dirName, template }) => [dirName, template.instructions] as [string, string]
      ),
      ...getCommandContents().map((entry) => [entry.id, entry.body] as [string, string]),
    ];

    // Only runnable invocations count: prose that merely names the command
    // ("same rule as `openspec archive`") has nothing to confirm, and it is
    // always mid-sentence, so requiring the command to open the line
    // separates the two. Everything a runnable line may legitimately carry in
    // front of the command is allowed, because each of these hid an
    // invocation from an earlier, stricter version of this check: indentation,
    // a list marker, a shell prompt, and a global flag between `openspec` and
    // `archive`. Tokenised rather than pattern-matched - the regex this
    // replaces needed nested quantifiers to accept the flags, which is a ReDoS
    // shape even in a test.
    function archiveInvocations(text: string): string[] {
      return text.split('\n').filter((line) => {
        const bare = line
          .trimStart()
          .replace(/^(?:[-*+]|\d+\.)[ \t]+/, '')
          .replace(/^\$[ \t]+/, '');
        const tokens = bare.split(/\s+/).filter(Boolean);
        if (tokens[0] !== 'openspec') return false;
        const archiveAt = tokens.indexOf('archive');
        if (archiveAt < 1) return false;
        // Anything between `openspec` and `archive` has to be a global flag or
        // one's value, or this is a different subcommand that merely mentions
        // the word (`openspec list archive`).
        return tokens
          .slice(1, archiveAt)
          .every((token, i, before) => token.startsWith('-') || !!before[i - 1]?.startsWith('-'));
      });
    }

    let total = 0;
    for (const [id, text] of corpus) {
      const invocations = archiveInvocations(text);
      total += invocations.length;
      for (const invocation of invocations) {
        expect(invocation.trim(), id).toContain('--yes');
      }
    }

    // Guards the guard, and names the floor rather than trusting `> 0`: the
    // onboarding walkthrough is the one template that is supposed to contain
    // a runnable archive invocation, so a corpus that stops containing it
    // fails here instead of passing vacuously.
    expect(total).toBeGreaterThan(0);
    const onboard = corpus.filter(([id]) => id.includes('onboard'));
    expect(onboard.length).toBeGreaterThan(0);
    for (const [id, text] of onboard) {
      expect(archiveInvocations(text), id).not.toHaveLength(0);
    }
  });

  // Covers both archive paths, not just the bulk one the fix targeted: the
  // single-change routing has been correct since #1357 (current wording from
  // #1394) but was never pinned, so a stale branch could silently reopen the
  // bug #1381 actually reported.
  it('honors Cancel at every archive confirmation (#1381)', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
      ['single skill', generateSkillContent(getArchiveChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['single opsx command', getOpsxArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      // Offering "Cancel" without routing it let an agent fall straight through
      // to the archive step and move the changes anyway.
      expect(content, variant).toMatch(/[「"]キャンセル[」"].*停止.*archiveしない/s);

      // An unrecognized answer must re-prompt; archiving is never the default.
      expect(content, variant).toContain('その他 — archiveせず、もう一度質問する');
    }
  });

  // The bulk confirmation labels are written by the agent and carry an `N`
  // placeholder, so routing must match intent — matching the literal labels
  // would send every legitimate answer down the "ask again" path forever.
  it('routes the bulk archive confirmation by intent, not by literal label (#1381)', () => {
    const variants: Array<[string, string]> = [
      ['bulk skill', generateSkillContent(getBulkArchiveChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('表示ラベルの完全一致ではなく、回答の意図に応じて分岐');

      // The ready-only route has to name where "ready" is decided, or the agent
      // cannot tell which subset to archive.
      expect(content, variant).toContain('手順6の表で `Ready` または `Ready*` と示した変更');

      // A cancelled batch must archive nothing, reinforced where agents skim.
      expect(content, variant).toContain(
        'ユーザーが確認をキャンセルした後は決してアーカイブしない'
      );
    }
  });

  it('makes the schema instruction field authoritative for artifact creation (#777)', () => {
    const variants: Array<[string, string]> = [
      ['propose skill', generateSkillContent(getOpsxProposeSkillTemplate(), 'PARITY-BASELINE')],
      ['propose command', getOpsxProposeCommandTemplate().content],
      ['continue skill', generateSkillContent(getContinueChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['continue command', getOpsxContinueCommandTemplate().content],
      ['ff skill', generateSkillContent(getFfChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['ff command', getOpsxFfCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      // The instruction field wins even for familiar artifact names: the old
      // hard-coded "Common artifact patterns" shortcut is what let agents
      // ignore custom schemas that reuse proposal.md/tasks.md file names.
      expect(content, variant).toContain('正式なガイダンス');
      expect(content, variant).not.toContain('Common artifact patterns');

      // Delegated creation is honored at the creation step itself, and the
      // delegated skill's output is verified rather than assumed.
      expect(content, variant).toContain(
        '`instruction` フィールドが特定の'
      );

      // ...and restated in the artifact-creation guidelines.
      expect(content, variant).toContain(
        '`instruction` フィールドが特定の'
      );
    }
  });

  // A golden hash proves the generated file matches its source, never that the
  // source is right - so a careless `regen:parity-hashes` over a dropped
  // paragraph passes CI silently. The sync skill is the one place an agent
  // learns that retiring a capability needs the marker; pin the fact, not the
  // hash, so losing the guidance fails here instead of shipping.
  it('tells the sync skill that retirement needs the retire_capabilities marker', () => {
    const sync = getSkillTemplates().find(
      ({ dirName }) => dirName === 'openspec-sync-specs'
    );
    expect(sync, 'openspec-sync-specs template').toBeTruthy();
    const variants = [
      ['sync skill', sync!.template.instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ] as const;
    for (const [variant, text] of variants) {
      expect(text, variant).toContain('retire_capabilities: true');
      expect(text, variant).toContain('ファイル全体の他の空でない行は');
      expect(text, variant).toContain('実際の specs ルート内へ解決される');
      expect(text, variant).toContain('チェックアウトの範囲に即した復旧方法');
      expect(text, variant).toContain('本仕様を変更してはいけません');
      expect(text, variant).toContain('その機能の同期を停止');
      expect(text, variant).toContain(
        '空の `## Requirements` セクションを作成または残してはいけません'
      );
      expect(text, variant).not.toContain('any other sections');
      expect(text, variant).not.toContain('Loose prose left under `## Requirements` does NOT block');
    }
  });
});

describe('apply skill/command shared instruction core', () => {
  // The apply skill and command are intentionally distinct surfaces, but they
  // differ only in how they are invoked — the generation transformers rewrite
  // the canonical `/opsx:<id>` tokens per surface downstream (asserted in
  // test/utils/command-references.test.ts). The instruction text itself is
  // shared, so this pins the contract: both surfaces render the one canonical
  // core and cannot silently drift apart at the template level.
  it('renders both apply surfaces from the shared instruction core', () => {
    const core = getApplyInstructions();
    expect(getApplyChangeSkillTemplate().instructions).toBe(core);
    expect(getOpsxApplyCommandTemplate().content).toBe(core);
  });
});
