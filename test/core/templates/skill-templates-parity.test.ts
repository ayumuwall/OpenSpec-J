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
  getExploreSkillTemplate: '0fef253c2dcecc92cc6291023a9b4b1b5e9d571b0bed5619c94079d55d5cf88e',
  getNewChangeSkillTemplate: 'ad815f8530580dd39fd56a7eab0ec99f57a3f7a2e7967f5f898afd2b205c42c6',
  getContinueChangeSkillTemplate: '510dd971ea470ecec58d1cff959541e7ddb6ec2ceeecdd0a1a67cfcf7304b65e',
  getApplyChangeSkillTemplate: '883493dda08bd9ebd862c9ca6dd4a6542ed916d51ea0c2a53b1ee52fc0b656c4',
  getFfChangeSkillTemplate: '5a7df46d180d571db62d1a204fb6c761f45229f9cf01e102f3f17edee90feb14',
  getSyncSpecsSkillTemplate: 'b4a36833ee23b89013d961dce0ed731b19d39f2e3aad3e2194d40ea0ac5d0fb7',
  getOnboardSkillTemplate: 'b6f8b3967e1c9d6b25fca8db013b2b5bf613edfd9afcfc03752352f9f49a36ac',
  getOpsxExploreCommandTemplate: '0cfe5108a4dc2f6ac23520d298f8a2f5557bb25aaf9243357b2110afcf95a80e',
  getOpsxNewCommandTemplate: '23cdd3a804e70d75a7f6157160d1b6a51415d7d36f190ebe1379a129e560ec03',
  getOpsxContinueCommandTemplate: 'cb384931206db3cbc45dfd63711df34a8149e38c8230d9f38ad8c00f54c343be',
  getOpsxApplyCommandTemplate: '4fc88109a02690e3afb0bf158b42d0717c8f3e39c51b82dfd5c2483a2b8f5f0c',
  getOpsxFfCommandTemplate: 'd2130b337529e32c82e26a419f0d39b351e9734c3ad1f171099b0fcb3cc21763',
  getArchiveChangeSkillTemplate: 'dfa5fc7ffab337cc4ef76e38483d8322acf465384749ebabfd4f30a60b48337e',
  getBulkArchiveChangeSkillTemplate: '0f635913757ae3d1609e111f4a8f699443ca47cbaaf8a1b21eb652f7b96a1d13',
  getOpsxSyncCommandTemplate: '63548eb67cb38ce685960ff7a3184a2a104846ccea75a429e9ee36fd6dbebe26',
  getVerifyChangeSkillTemplate: 'bf08a744c9e32023228b6fcabdf81749baa6afb128fedbae9bc01ce5f5841ac6',
  getOpsxArchiveCommandTemplate: '4e31e466742c94840d493a2dbdfedfed3bdc027f34ab18688eea5b7c91fa5efa',
  getOpsxOnboardCommandTemplate: 'f76996df1e3eafd68798fd306ac1bbbd9713fd99c32073efe3e85a180347c096',
  getOpsxBulkArchiveCommandTemplate: 'b317316a075f34fa3c1ba5dd9772aada4c022137b3a97077c4688c9920424e4e',
  getOpsxVerifyCommandTemplate: '5e4f47df28b7dca895b72f8abd4f2e8ac603ba095d2726c459d1161c9f5a998c',
  getOpsxProposeSkillTemplate: 'cc73af025e89cae8466913af51d6e2396e583553b8fe790b2232c0cad6d13043',
  getOpsxProposeCommandTemplate: '8334d80507863b7469012e8dc66786085929519c685e05bd9f7ed20a8f2c3eaa',
  getFeedbackSkillTemplate: 'c0a87da8af56464a483a3bfc55375b8f202a8c4bbc8aabcc18a2045b16f2bc9d',
  getUpdateChangeSkillTemplate: '0d644ec4651bad5395e1a1636516b615dfad4fb7e2753d85ae0f491395a5c311',
  getOpsxUpdateCommandTemplate: 'b653a7ec479e483a055b2637ef243b38ba3c24d4afe85356b93c70e1737f259d',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '686ebf994fdb0944fe9be4b858d58e2f1c459de6106db5699688b0903db36ed6',
  'openspec-new-change': '66953ae6f08490f298db0c4f65416f86de44346141dddff6717a06d85a42f775',
  'openspec-continue-change': '7c80d571bf493c3ead032225c2c19a339aa78ea5a19d47125d48134f71594ffb',
  'openspec-apply-change': '22c0299576f6a646a726aaa8824e81bb1ec54c67631849a6b650524f47e5a730',
  'openspec-ff-change': '2b7a5a1ce187604eac0e519195b6ee4a79e575a1176794acf50ae08726349986',
  'openspec-sync-specs': '60b760c54eefce86abf810e82764b8905493b491c7992663b6eec773eaf98ec0',
  'openspec-archive-change': 'af989cc7839e807a207ff5b7de2c0ff94a1e5576f89a4cc853a1324ce77bfa93',
  'openspec-bulk-archive-change': '7b09b04a440809dd7dbf0b1d7b695cbb8c41184d8d104eb32e82d7cdfb476d18',
  'openspec-verify-change': '417fccf1e1ca0230806aa297969737bf0c348e48c5c527c90f0b927d84da9365',
  'openspec-onboard': 'd4cef9f24241af49167f9cf9865744317281b954bc94f5c9f4b91c13b629aa9a',
  'openspec-propose': 'a5e99b97f659d60c9dbcbcc5e16a8ad2eca6a8d7055f2424479feb438671cfe7',
  'openspec-update-change': 'a6101064fef0963665307787f519f67d8a8ea020303bbb5f6b50672f4ebb32c6',
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
