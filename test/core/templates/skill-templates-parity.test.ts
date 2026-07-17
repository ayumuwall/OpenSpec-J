import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
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
  getExploreSkillTemplate: 'd103fab8c250e8b15d736807e1bf4cdf615427eba6240b6d5c502d8f530e10b9',
  getNewChangeSkillTemplate: '18635a8954f7367077e21edcee55308068c2c7fe19f0b39ed07f14bf69143797',
  getContinueChangeSkillTemplate: '36dd6f7b161e35db81e676ba5157d837bba8187fb738d6a6d2a4ca2afffd0242',
  getApplyChangeSkillTemplate: '3068b7b8d8068bcf0af46d3f2df8b94e67114173999165a645ae1e2cd7403a95',
  getFfChangeSkillTemplate: '2985be1e26be07c24e71e2db27c89406f4e9838c2808ef5e501efac84dce1984',
  getSyncSpecsSkillTemplate: '5ec224a656501e853d5ec9fb4ac3dc6fe11791c248834a8062bee5a11ed12e6e',
  getOnboardSkillTemplate: 'ec5c35c67cda2f10bf5a7f050b51e2fbc8edf85e24ebcc8ec240d641e93307c7',
  getOpsxExploreCommandTemplate: '8901ce736d15c16f25e25d6251926f61911706ac2313c7799821e580eba25bd4',
  getOpsxNewCommandTemplate: '5e07b9be9194b179b5793fcac5835209a2329670eecf6627c95638185aa3cfc4',
  getOpsxContinueCommandTemplate: '2fabf9563ee1dfabb06d98d8a56e4da810638d9cf0af296ac7bf801fcd2755e3',
  getOpsxApplyCommandTemplate: '3b1300652e416c2313149a07e80989e2206035ad3a2dd2dc5dbe315789789746',
  getOpsxFfCommandTemplate: '56eb3c525a8a0f5c2604794baab340927f35f7a09eff658bb76ba704a40e7a71',
  getArchiveChangeSkillTemplate: '5577be1e0e1e3cf2fd24eceda11ecaec1fa5ad7ce647033ef7d539cb260ebc03',
  getBulkArchiveChangeSkillTemplate: '1320d3b37a10ac6bd2c89eec7c3acff76fc14b07f22d5301fc5b8959aff49c2e',
  getOpsxSyncCommandTemplate: 'a22a5ef13574c15c95d55fb5f644d46cf8a70e326dbe6eb3ad164dd6fea9382a',
  getVerifyChangeSkillTemplate: 'be17fe20f1e8274696a7a1440dff20417875f5d4933d97e10a976559a636ecce',
  getOpsxArchiveCommandTemplate: '2ded869337200cd0eedf4e9c937637bc65d662a7a3c8b97863060c743696b8e1',
  getOpsxOnboardCommandTemplate: '0536a50c5a4e6b9fb9a1f88ded088501233748c2622c08201c43d46a6821a332',
  getOpsxBulkArchiveCommandTemplate: '715594d1a950a694d443ad4a764fe840ceb6039e061a44d1aab6235df450f914',
  getOpsxVerifyCommandTemplate: '955b2dc54ea82199256c204d43328cf1a561acd6aa86644919df4734304f80d1',
  getOpsxProposeSkillTemplate: '1e179a30e9d565dcf0393087d373c462308626b58ca71d3d73985b329a09421d',
  getOpsxProposeCommandTemplate: 'f3e789089357c8592a08fa06ecd18d9effbbf6ee0b2b3337c4c45abf05dfe4c6',
  getFeedbackSkillTemplate: '959174a5dc6624eef3351ec7909e4523ceb3a9ffaf0c2177ba70c322a36df550',
  getUpdateChangeSkillTemplate: 'ab54204a5f59512c239bd2750530843cba46d4873dce791aa770070f58169c16',
  getOpsxUpdateCommandTemplate: 'ea547a1c38506fcc308b644a6f899676f03348702b506c3f2093a09c3218f622',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'ccc682f2fdf9dc9a9ab2cdcb00df454f2444d15960b2dfd85465f429a5dfe140',
  'openspec-new-change': 'b2df114c9c86f1f22887a9792f3d5e51c71da605dd092ef4e2d6cc0db1d8f926',
  'openspec-continue-change': '0d28bf7113113944fc990f2cc8dadd161838f1e3f5272c81c5884a09ad625e34',
  'openspec-apply-change': '0f552ce3f4192281f573bac8fd1f729eec0a831f6d51d24a0887d4817a6f10cb',
  'openspec-ff-change': 'edff09c32e683032517cf79214f4e2cdcc804d567445be7f8caf9cab69414e3e',
  'openspec-sync-specs': 'e02804be90a28f8e9826338cc6b501d9958cd4b28492288b9aab81d87925b540',
  'openspec-archive-change': 'fd353f7252aa832904b2af61e0f19a066fdd7fd46111fd6503b4575f66f41b5b',
  'openspec-bulk-archive-change': '3334da86b457ed95598921e2fba5f2eb246cb21e4f56e5820f601b613be30985',
  'openspec-verify-change': '3b106db532fa2ed3118ba97258a7d6710116860121dc5ff86fc5ee8ea2a50d29',
  'openspec-onboard': '0354734a80b4f0832e333554abf4a15613ba326af5d0b6aa584dceba7adf1583',
  'openspec-propose': '541cfc4e2f0af4346a0e3c878a5f024209628f81d15c3662e0bd6f4beda6ec03',
  'openspec-update-change': '78f2e946eb5a7262bf8495c7e6ff08afe16e0263cc2e926336a25e061e7658a2',
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
});
