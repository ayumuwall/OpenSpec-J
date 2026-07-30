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
  getExploreSkillTemplate: '23885eee5f6282b478bbf536e8a59605abfdb96ed6e2f194f866d72822aa906b',
  getNewChangeSkillTemplate: '99cfbf80b2df149d2913f4e8525faf047fcd28618644ac9910fe983a3b8ce3a0',
  getContinueChangeSkillTemplate: '78dd861d2aab047c259ecbd40c40391dc907e2f6023352b63d95bdce422dbd45',
  getApplyChangeSkillTemplate: '34c8d8c3f1f56f0568eafe38d5eca9981d34b281a9fdbe1feb4a19bcf9546ec6',
  getFfChangeSkillTemplate: 'd76d67c1137cdea18641f00d96cfa95f270712bd8c9fde58ef8e7a4f91d58413',
  getSyncSpecsSkillTemplate: 'd820708983cf3dd07f7878b9a788a5287e722e0560a0bd0e921c181bb8218848',
  getOnboardSkillTemplate: 'a865f384ccefa92d316f5794005ccce5bb0dffaa81a18d6852ffb52a470a8b4b',
  getOpsxExploreCommandTemplate: '81cff917d1dbe465d0aa82023588e8ff332c3412e50b675496994dfd2f84c8a6',
  getOpsxNewCommandTemplate: '50dec66afba0e465cddb8997c0786de3d04aa5632f3fa85ca36507dfca46f938',
  getOpsxContinueCommandTemplate: '14634cd70ff7b576c63dd6c1e6f6a86d112b87f6df912df11be144ee98575a6a',
  getOpsxApplyCommandTemplate: 'cc7fb90b073bd024026c120a3dd76dff5de3d3e1526827480773dd7db431e85d',
  getOpsxFfCommandTemplate: '9c91e2f5558f4d8598888317504d340a6acdd6c96975ce926589e43fb89e510f',
  getArchiveChangeSkillTemplate: 'dbfd466371e04279be3caf78b8051d7db1b8e677794f800042f43c01665f0642',
  getBulkArchiveChangeSkillTemplate: 'c06fe47ac0e7d553565409a759723731c82c8f43bf4c313af33ddbd507c503cd',
  getOpsxSyncCommandTemplate: 'c0b731caa0fee097c55a7e0d46261d7d3b04a4422e3c75ba57009e44cab23b6c',
  getVerifyChangeSkillTemplate: 'a4b42b9099b73c74a725c22b85e7673ea2642d41985c5d3aae34d2bdac043255',
  getOpsxArchiveCommandTemplate: '228a9af292147cedfc1b8300b642c6de63cfb55d5ab5faae8f86069544b8d12c',
  getOpsxOnboardCommandTemplate: 'fbf89ab6c9e56bb4b4879865320f2a8d00b7c35a94ef1a7df04849254611f625',
  getOpsxBulkArchiveCommandTemplate: '489a1a514ff654d5f94dde713d4c14b654fffaa8e1f5588eecaa52bb81fde3b0',
  getOpsxVerifyCommandTemplate: 'b507179a714beae14f78372fe5cbf387da70983b7ecb37bbd31955bff780e68a',
  getOpsxProposeSkillTemplate: '70001af7c9f8d5fb8ba3c7547b3e40fdcb804a61e5c507958600fe677dc8975c',
  getOpsxProposeCommandTemplate: '514f2717e373cdfc6ab2d21bf2122dfcfd72a0b3c9fa80095328c6493c389760',
  getFeedbackSkillTemplate: '959174a5dc6624eef3351ec7909e4523ceb3a9ffaf0c2177ba70c322a36df550',
  getUpdateChangeSkillTemplate: '4d48fa0a86aa1b2cc42e72d530476a4a2c9ccdaf278b00387ce882eb230a73d8',
  getOpsxUpdateCommandTemplate: 'e9747ea631eb730ffff7f1f200b583cb57f09358a2430c87db5e0b32adaa76b0',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'f6c1c23c6ceb5d69926bf11c843ecb2d102672af16234395144321b170f40a08',
  'openspec-new-change': 'd9faaaf612156d9418dd7f8d330dd0a2060bef44c8ffb31efe7f08a5e7be295f',
  'openspec-continue-change': 'a920b6873eff0cc61eb95e762d29916355a514dfa62256fbfdf2430463b706a2',
  'openspec-apply-change': '8e90077de061fe00c55949381fcfefe3b3f5dcdbe6787618cb1726af5af5bb96',
  'openspec-ff-change': '3859e466a9d729cf4a4645a6ada755f0aab78348f0e4791f776e792b23f806c2',
  'openspec-sync-specs': 'b911cdbe89008407d7271f64dc9cf46fa346ecdfe728a8248b088411f20d7913',
  'openspec-archive-change': 'ec6894ca3a0bc0d343ffc157a2ad71903cd94602d63d6bedfae46038f214e1df',
  'openspec-bulk-archive-change': 'd95678dc2659c941148fd42fc56c44cabccdf6c70a9ad2a41465382d0af61b47',
  'openspec-verify-change': '4e11436246a85c565952d8a54a16aa419084d9c1e94b465c3b6b6c368f84e196',
  'openspec-onboard': 'cc04ada35e1bf7e4f265868e2b65d475820c1dbaaf23d89c9ae0e65e9dc38662',
  'openspec-propose': 'f1732e4b26abb35c97dc1ac482ab848f6a8164c0cc4ec3a8ed70dc0bf034cf0e',
  'openspec-update-change': '4adca3321bf519d58bcb3d567c61493a84d892d65daaac48c6763cf2336c6935',
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
      expect(content, variant).toContain('MODIFIED要件にデルタで指定されたシナリオと説明の変更が反映');
      expect(content, variant).toContain('REMOVED要件が存在しない');
      expect(content, variant).toContain('RENAMED要件が新しい名前で存在し、古い名前では存在しない');

      // Verification is bound to the delta specs on disk, not to whatever the sync reports it touched.
      expect(content, variant).toContain('同期が触れたと報告したものだけでなく');

      // Main spec paths are store-root aware
      expect(content, variant).toContain('<planningHome.root>/openspec/specs/<capability>/spec.md');
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
      expect(content, variant).toContain('仕様同期の実行中に変更をarchiveしない');
      expect(content, variant).toContain('対象に含めたデルタだけを同期・検証する');

      // Verification must follow delta semantics.
      expect(content, variant).toContain('MODIFIED要件にデルタで指定されたシナリオと説明の変更が反映');
      expect(content, variant).toContain('REMOVED要件が存在しない');
      expect(content, variant).toContain('RENAMED要件が新しい名前で存在し、古い名前では存在しない');

      // Main spec paths are store-root aware
      expect(content, variant).toContain('<planningHome.root>/openspec/specs/<capability>/spec.md');
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
        'すべてのデルタ仕様を対象に含めるか除外するかの判断'
      );
      expect(content, variant).toContain(
        '対象に含めるデルタ仕様'
      );
      expect(content, variant).toContain(
        '`includedDeltas` に項目がある変更だけで'
      );
      expect(content, variant).not.toContain(
        'for each change, passing the delta spec analysis'
      );
      expect(content, variant).toContain(
        '`includedDeltas` のデルタ仕様だけを'
      );
      expect(content, variant).toContain(
        '`excludedDeltas` のデルタ仕様は意図的に未同期のため、検証しない'
      );
      expect(content, variant).toContain('`sync skipped` と報告する');
      expect(content, variant).toContain(
        'archive自体のスキップとは区別する'
      );

      // These three carried no assertion, so deleting any of them from a
      // single variant was caught only by the golden hash — and this repo
      // regenerates hashes as a matter of routine, which makes that no
      // protection at all.
      expect(content, variant).toContain(
        '`includedDeltas`: 確認済み変更の競合しない全デルタ仕様と、同期対象として選択した競合デルタ'
      );
      expect(content, variant).toContain(
        '`excludedDeltas`: 実装がないため、確認済み変更から同期対象外とした競合デルタ'
      );
      expect(content, variant).toContain(
        'デルタごとの `includedDeltas` と `excludedDeltas` の判断を実行時まで引き継ぎ'
      );
      // The worked example must show the skip, or the agent has no model of
      // what a partially-synced batch report looks like.
      expect(content, variant).toContain(
        'デルタ仕様1件の同期をスキップ（add-jwt/auth: 実装が見つからない）'
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
        '呼出元は同期対象の delta spec パスを明示的に列挙することで絞り込めます'
      );
      expect(content, variant).toContain(
        '指定パスだけを同期し、残りには手を加えません'
      );
      expect(content, variant).toContain(
        '全一覧へ戻さないでください'
      );
      expect(content, variant).toContain(
        '呼出元が対象を絞っていない限り、`existingOutputPaths` の全パスを同期します'
      );

      // Step 4 is the operative loop. Narrowing step 3 alone left the loop
      // still iterating "each path returned by the CLI", which re-widens the
      // set and re-syncs the delta the caller withheld — the original bug,
      // one step further down the template.
      expect(content, variant).toContain(
        '手順3で選択した各 capability の delta spec パス'
      );
      expect(content, variant).not.toContain(
        'For each capability delta spec path returned by the CLI'
      );

      // The undefined edges: a named path outside existingOutputPaths, and an
      // empty named list. Both must stop rather than proceed on a guess.
      expect(content, variant).toContain(
        '指定パスが `existingOutputPaths` にない場合'
      );
      expect(content, variant).toContain(
        '指定一覧が空なら同期対象がないと報告し'
      );
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
      expect(content, variant).toContain('他のアーティファクトからデルタ仕様を推測しません');
      expect(content, variant).toContain(
        'openspec instructions specs --change "<name>" --json'
      );
      expect(content, variant).toContain('メイン仕様の書き込みや変更の移動前に停止');
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
        'この一覧だけをデルタ仕様の情報源として扱う'
      );
      expect(content, variant).toContain('`specs` 項目がない、または一覧が空');
      expect(content, variant).toContain('混在スキーマの一括処理');
      expect(content, variant).toContain('必要なspecsルールのスナップショットをすべて取得');
      expect(content, variant).toContain(
        '最初の書き込みや移動前に、すべてのスナップショットを取得します'
      );
      expect(content, variant).toContain(
        'メイン仕様の書き込みや変更の移動前に一括処理全体を停止します'
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
        '実行時入力、競合分析、CLI由来の値、アーティファクトルールを分けて扱う'
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
        'ユーザーが確認をキャンセルした後は決してarchiveしない'
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
});
