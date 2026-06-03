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
  getExploreSkillTemplate: '0b5febca582b6d8ffe2ef4cb8614f258141b9656d98de5db5be5ac9ecc8ca274',
  getNewChangeSkillTemplate: '8056048bdcc871a71633c50f97d805a11457d6dd5570f815399ea72f3f81fa82',
  getContinueChangeSkillTemplate: '98c12c4cc83b58a7f102184d523c3f69b7b26554915bcdd31b6af343c40bfe47',
  getApplyChangeSkillTemplate: '8d1074a74a534a7bb19849ae4050ea79546f1a6531013c513d2e1c0d0fc2f294',
  getFfChangeSkillTemplate: 'd47d406089f4cf0e2118caef5efbb52de058357265164c7a2d76e058bf6137e9',
  getSyncSpecsSkillTemplate: 'ae5cc52cf216e5e92dea3fb406fe4f2d6edae9266c414249e13f73ca848c3e86',
  getOnboardSkillTemplate: '2b578f814c2fb01f6dccbf2d619f0525ea0366fee0d6d0b78b7060959f836f4c',
  getOpsxExploreCommandTemplate: '606cf482f319e68c37af34e96be0249f7ae28ca3ec70df21d56c33f01c75412e',
  getOpsxNewCommandTemplate: 'e2b6c7e617a93e29c2e35e2e64e558ccd1ede6ee378c1617686ab420032927e6',
  getOpsxContinueCommandTemplate: 'f515120211cf172febabadbe2e6e84f1e1a2ffef2086ec771ab8d4c36974ec42',
  getOpsxApplyCommandTemplate: '704ab1d39cc7457f33bb9bfa9b4a1fe205024001ef1e4b3bda943ebcb4a23c07',
  getOpsxFfCommandTemplate: '832ed8c06c04cd94766d7fac047fdbd4ea2c208f08792f4615809fdca8446e8d',
  getArchiveChangeSkillTemplate: '1b36a7e6db04b0d2e94f74ad4397cc261188b0efe77b3e29c5be0a6ee2babc5c',
  getBulkArchiveChangeSkillTemplate: '5478d67f0d3c3f04af1a2f652ce5d935e67df4b14798f537b29e5ac6832ea817',
  getOpsxSyncCommandTemplate: '97ee415c34253299927c3c71bd3d9d59eb7f4f074d59eaf4412e5ed7ab4c4840',
  getVerifyChangeSkillTemplate: 'ed907f71618f5c44987748a88eccafea1c403b2a2575aaca505ae4f41d3cc4f9',
  getOpsxArchiveCommandTemplate: 'f460ecf06d97e9485b6bf0f11fe57512958c2ca98b8d01208f6fbf4e0259cb35',
  getOpsxOnboardCommandTemplate: '9864293c1d6a83c25b25aa00146b37840e0c418a5e3951908735b7ec7828b4f3',
  getOpsxBulkArchiveCommandTemplate: '957a7f5d9e52f83550f70e6ce38cd395840719b89c9333b7da4f67e1b1a09181',
  getOpsxVerifyCommandTemplate: '10e30cd7e43bd64b45c85dcde6df2e20fbb40d3c3402c9cf823de26d5b1e67f0',
  getOpsxProposeSkillTemplate: '7281878bfae4b8545a940575d1b6a831ec9bb8fe913fb1052c39890efecad403',
  getOpsxProposeCommandTemplate: '96d02d6a27176734da419c735f30e061b9780d0895e315cce7a2015649e812ac',
  getFeedbackSkillTemplate: 'c0a87da8af56464a483a3bfc55375b8f202a8c4bbc8aabcc18a2045b16f2bc9d',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '7d9e95b44d13cf54d11483ace18aa067052ee4c100a51edd844fd7ccfe42c184',
  'openspec-new-change': '18837584d9bd724485fd641d4ddc436cd1649d7debfda0cf0e1682400da2b9bf',
  'openspec-continue-change': '424ab1e2763f1e6c0e39ad4c7da3f66be64fab9ae770614fd8b1091748ff6d5b',
  'openspec-apply-change': '403f8028df7740afee397f9f79fb6e47b6c6e90f2c1fb60818e23630ec60e716',
  'openspec-ff-change': 'c72294ab8d1639ffc9b29a00e59fc3751d2cb6eebb62bf6db311a6d9fee7036d',
  'openspec-sync-specs': '94bd06f6ae3c42b82658810239df2feab508f48e8f0d3ddd407165041f23e7f2',
  'openspec-archive-change': '7a4415b5cbb8b8ba3de30066767dda2d091ccd18e43827384ef24ef1b6238ffa',
  'openspec-bulk-archive-change': 'bc1f957a1cf9ef0a716a19e96d541e6c2f0d37187dfd1168ee06d54a1addfe61',
  'openspec-verify-change': '9c967cb09a2f667c4a455318f181d79987ce772a450c0d90047a36b4c0222b0c',
  'openspec-onboard': '2eb3ad75f2d0be5c25dcb0d988b2016f2c8271d825648f3bdf627f2ff7c9eef9',
  'openspec-propose': '15a77a8b2915b7e80af3ed394b095d571f89a6c6bc2a29c2beda3aba849bd543',
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
