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
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'd60856a706416b1c90e1d685ec6ae23660ac39dba1cbef1a5926a63e9386f927',
  getNewChangeSkillTemplate: '8056048bdcc871a71633c50f97d805a11457d6dd5570f815399ea72f3f81fa82',
  getContinueChangeSkillTemplate: '98c12c4cc83b58a7f102184d523c3f69b7b26554915bcdd31b6af343c40bfe47',
  getApplyChangeSkillTemplate: 'fabb3161d4adef9b49804530e4a59bb865a3914d4809f2aca2e5e21f08659da8',
  getFfChangeSkillTemplate: 'd47d406089f4cf0e2118caef5efbb52de058357265164c7a2d76e058bf6137e9',
  getSyncSpecsSkillTemplate: 'ae5cc52cf216e5e92dea3fb406fe4f2d6edae9266c414249e13f73ca848c3e86',
  getOnboardSkillTemplate: '4f315149dbca698d02a92c460a3ddda3ec8330725e8d3862e89d6f7de7636320',
  getOpsxExploreCommandTemplate: '58d7b7c18aad4a08028db2e844b6ecec58ed94d16a80c6e2bd75dc84a6391984',
  getOpsxNewCommandTemplate: 'e2b6c7e617a93e29c2e35e2e64e558ccd1ede6ee378c1617686ab420032927e6',
  getOpsxContinueCommandTemplate: 'f515120211cf172febabadbe2e6e84f1e1a2ffef2086ec771ab8d4c36974ec42',
  getOpsxApplyCommandTemplate: '77c0a5cac1ff455707ba359cd7efb768ed8fd543657bdcd588f16ca464493391',
  getOpsxFfCommandTemplate: '832ed8c06c04cd94766d7fac047fdbd4ea2c208f08792f4615809fdca8446e8d',
  getArchiveChangeSkillTemplate: '7026c59f9bbcaab2ceff185503c1d58ef7fdd094b846187f18ddd6c7b96b63c7',
  getBulkArchiveChangeSkillTemplate: '3e1dd57885f5ef3a0b8629689633a1a72c7d99fec6ca05c8ac89d59299e03ff3',
  getOpsxSyncCommandTemplate: '97ee415c34253299927c3c71bd3d9d59eb7f4f074d59eaf4412e5ed7ab4c4840',
  getVerifyChangeSkillTemplate: 'f7255c761f4ed4c2d2650c716cca39b57f7a07fb0f537604e2b41aea725361a5',
  getOpsxArchiveCommandTemplate: 'b3f68133afeb173878367e353d9410f7d633b22ad856b7c2acf7c6fc1b8fdcc1',
  getOpsxOnboardCommandTemplate: '2219b873a5affd6ab419aa763aa8f08873fb0966c800a9245811fb5362c107c1',
  getOpsxBulkArchiveCommandTemplate: '3f86ef4612a210182e9424e1168a2e476dc8e05f6fd768bc83e9c82a0427bf34',
  getOpsxVerifyCommandTemplate: '77af562e954061117d60e9a5e3e96f1843e5ceb073fdd6c0de96bb5177811cdc',
  getOpsxProposeSkillTemplate: 'd67f937d44650e9c61d2158c865309fbab23cb3f50a3d4868a640a97776e3999',
  getOpsxProposeCommandTemplate: '41ad59b37eafd7a161bab5c6e41997a37368f9c90b194451295ede5cd42e4d46',
  getFeedbackSkillTemplate: 'c0a87da8af56464a483a3bfc55375b8f202a8c4bbc8aabcc18a2045b16f2bc9d',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'aa348826b2a0d7708541912917d9cab3d2021bc9423e285766dd9b185f0f5166',
  'openspec-new-change': '18837584d9bd724485fd641d4ddc436cd1649d7debfda0cf0e1682400da2b9bf',
  'openspec-continue-change': '424ab1e2763f1e6c0e39ad4c7da3f66be64fab9ae770614fd8b1091748ff6d5b',
  'openspec-apply-change': 'd09e87cc59b74f64d12953c04db26138b2ae89e95f14c3e1ee9bab3c8e5423b5',
  'openspec-ff-change': 'c72294ab8d1639ffc9b29a00e59fc3751d2cb6eebb62bf6db311a6d9fee7036d',
  'openspec-sync-specs': '94bd06f6ae3c42b82658810239df2feab508f48e8f0d3ddd407165041f23e7f2',
  'openspec-archive-change': '96cbe8b0f9461b632015d7590c5d91de2ef487a9893b7cb4de2983747c97ff65',
  'openspec-bulk-archive-change': 'bb96cb5583e8f3bc880694fab5b0e791ca9ce805e3a4914dcf86c1d4d4aef8e8',
  'openspec-verify-change': '33f4f76d4ea0816d4e9baeea1a23d6af15e670d4aa6e4d080a9c224801159dfa',
  'openspec-onboard': 'cd9f4879338170e5e342abce94f50a2f63739ce968a83e5656099bee599ea22f',
  'openspec-propose': '20e36dabefb90e232bad0667292bd5007ec280f8fc4fc995dbc4282bf45a22e7',
};

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
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
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
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });
});
