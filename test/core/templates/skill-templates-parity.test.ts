import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
import { resolveOptionalWorkflows } from '../../../src/core/templates/optional-workflow.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';
import { parseSchema } from '../../../src/core/artifact-graph/schema.js';

/**
 * Templates carry optional-workflow conditionals that the production registry
 * resolves against the installed workflow set. Pin what generation emits, not
 * the unresolved authoring form: with every workflow installed this is byte
 * for byte what `getSkillTemplates()` returns.
 */
const asDeployed = (template: SkillTemplate): SkillTemplate => ({
  ...template,
  instructions: resolveOptionalWorkflows(
    template.instructions,
    new Set<string>(ALL_WORKFLOWS)
  ),
});

/**
 * The title `spec-driven` gives each artifact, read from the packaged templates
 * so guidance and template cannot drift apart.
 */
function specDrivenTitles(): Record<string, string> {
  const schemaDir = path.join(__dirname, '..', '..', '..', 'schemas', 'spec-driven');
  const schema = parseSchema(fs.readFileSync(path.join(schemaDir, 'schema.yaml'), 'utf-8'));

  return Object.fromEntries(
    schema.artifacts.map((artifact) => [
      artifact.id,
      fs
        .readFileSync(path.join(schemaDir, 'templates', artifact.template), 'utf-8')
        .replace(/\r\n?/g, '\n')
        .split('\n')[0],
    ])
  );
}

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'ac325295a8ab73d68f4f6049949f536a043ea15e895c970b05913e4ead104398',
  getNewChangeSkillTemplate: 'f867a299c723742a16f70a614b93d9df05ebefaf539b35248689532ff4f0de80',
  getContinueChangeSkillTemplate: '6a705cd5ef5e810b4d7fcf46e6e76010160b887f36c318da885d84ea0882daef',
  getApplyChangeSkillTemplate: 'c3753e9a59d34ef1693d2083d205f73148a633b9129bbed0b972003a08175dae',
  getFfChangeSkillTemplate: '9d5e795b526088a34bbdc5e160d64ccb80c215ab23b5942cabb9ad31e23d7d2a',
  getSyncSpecsSkillTemplate: 'ac3ac7cc7d6873f548abf29707de554d873f61bde297a70e6b8985fb26169378',
  getOnboardSkillTemplate: 'c9a62581b884b0e3cbacadd0590b7654cec9600e7f2b7fa79d783383587a1901',
  getOpsxExploreCommandTemplate: 'f42241c677d017af2be893af727cd39a34a38c556815d4178d092bf2645c8490',
  getOpsxNewCommandTemplate: '9d0ebe3f3408231630508098e52ffbc3aa64b843ba907a2a2f0324c19ac9aec5',
  getOpsxContinueCommandTemplate: 'd7b63c11ba50d6db1708558d8d9b3290da50b64a25856cf9a9dfd288f0e1d2d4',
  getOpsxApplyCommandTemplate: 'a5b91debb713b3be6b61190dc78752500ce9fd5a9b971698e0d831f610b3de45',
  getOpsxFfCommandTemplate: 'bce9a22c838d2aee624b27f26535dec08111fe8c56fbc5fd52e26ac868a87f5d',
  getArchiveChangeSkillTemplate: '0d7492e2e683272c7adb3668308268b9fb6fae539ac63464d0247e14c9f5ea42',
  getBulkArchiveChangeSkillTemplate: '09ad640f98b9d301afabc9cff7f090fd0994b946f27054649eb5aaf8ec0905b7',
  getOpsxSyncCommandTemplate: '7a08d2b60651e311f5e9f42401e702adc44fb332ec57051bbe5d7b8b6fadeae5',
  getVerifyChangeSkillTemplate: 'c6674c8da7c807d7c38339f5175219bba6e441431cb4a038b0425178f1a7436c',
  getOpsxArchiveCommandTemplate: '28956ee2b3d8c9cfb4d47340a18722b03915f496fdce7e5482af1e11bc44e623',
  getOpsxOnboardCommandTemplate: '938caeb782ba5e5daf7e2d68433033dc422caf88f6d200968e5513efa4881179',
  getOpsxBulkArchiveCommandTemplate: '4e20b8839903d55a3fc821ebd564e9e32d5d1b61009f32b25842d655e0ce379d',
  getOpsxVerifyCommandTemplate: 'f619656e3c193f2de8aff31396730295a3638d4072104ff5875d80fef7ee7e93',
  getOpsxProposeSkillTemplate: 'fe47c86b28a9518382347a958c2ac4656d36669d522f294de18c906dfc5fb73c',
  getOpsxProposeCommandTemplate: '2f016cba58927e6394c855d08214e2d3ffbf585b334ee1ad87cd6bf6fe09b4ba',
  getFeedbackSkillTemplate: 'b30b6cf2cd5705c906078d3831fe7fffed8739652da757938ad84f82755a58fd',
  getUpdateChangeSkillTemplate: 'c6e44817e83257c1b75aad107b0caaec6be377ade78cb19f51ccc92602b1c3dc',
  getOpsxUpdateCommandTemplate: '6d36658fe81aa137bba1ba23046c108957dcb2d72a3cd8317037bd1b0a57e782',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '843aa6200151f2f8d913ee5f974420b081c1ce031f6b242ee296d5a66bd0431f',
  'openspec-new-change': '2c92d2388f9003a6e886bd9c1c8af11ba579da95e836e3dc6bb0b65b55d22d94',
  'openspec-continue-change': '575a26846c09c1cc5e414f1d6b4e319671e859fac5a552d00623d1dde0891a82',
  'openspec-apply-change': 'ddc9e753f0b4313f989090cf024910dec2cfc260ada659cd9fbfed68dc492065',
  'openspec-ff-change': '968c06d265e6c7ead29ca0cfd4074e837d625e8a1eb55a3c8e7bf7bfdfd5107b',
  'openspec-sync-specs': '88505cf01f65e2c5676ced5be2dc891efc11decec83cb3d46b009eab1d78ca81',
  'openspec-archive-change': '43f6176311b08fd82d7ba07cb119b95edda797a551467fecf0677ea74d0a0da6',
  'openspec-bulk-archive-change': '0d1caeb9f17c3a3cda6dd1464b407d003aa7e3280b08f510423ac8bfbb94d80f',
  'openspec-verify-change': '810e17e1b841a10ed2c14da3e51cde7d404cdd8dd01b5a6fff036aa6eaac113d',
  'openspec-onboard': 'd98b8d44105ae40c367a257c87af1a2f3c310694a2dbabcd7ffae3a98f3b5b69',
  'openspec-propose': '8266268a09516d96b19e8d35f1973ed5e1959a0410bf0d36de4f12e510b6fb94',
  'openspec-update-change': 'caeefd866849be16f66c62401bf78c4bfeb77f1104c48729a0c92019ed68a073',
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
      expect(content).toContain('適用対象のチェックで使える証拠がタスクだけなら、タスクの完了だけを検証します。');
      expect(content).toContain('### Requirement:');
      expect(content).toContain('#### Scenario:');
      expect(content).not.toMatch(/[\u200b\ufffd]/);
    }
  });

  it('uses one clarification threshold in fast-forward guidance (#1837)', () => {
    const variants: Array<[string, string]> = [
      ['ff skill', getFfChangeSkillTemplate().instructions],
      ['ff command', getOpsxFfCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain(
        '**アーティファクトにユーザー入力が必要な場合**（判断に必要な重要なコンテキストが不明瞭）'
      );
      expect(content, variant).not.toContain(
        '**アーティファクトにユーザー入力が必要な場合**（コンテキストが不明瞭）'
      );
    }
  });

  it('approves onboarding tasks before saving or offering implementation (#1837)', () => {
    const variants: Array<[string, string]> = [
      ['onboard skill', getOnboardSkillTemplate().instructions],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [variant, content] of variants) {
      expect(content, variant).toContain('このタスク分割でよいですか？');
      expect(content, variant).not.toContain(
        'Each checkbox becomes a unit of work in the apply phase. Ready to implement?'
      );
      expect(content, variant).toContain(
        '**一時停止** - ユーザーの承認やフィードバックを待つ。\n\n' +
        '承認後、`openspec instructions tasks --change "<name>" --json` の `resolvedOutputPath` に保存する。'
      );
      expect(content, variant).toContain('> 「タスクを保存しました。実装に進めますか？」');
      expect(content, variant).toContain(
        '**一時停止** - 実装を始める前にユーザーの確認を待つ。'
      );

      const saveAt = content.indexOf('承認後、`openspec instructions tasks --change "<name>" --json` の `resolvedOutputPath`');
      const implementationChoiceAt = content.indexOf('> 「タスクを保存しました。実装に進めますか？」');
      const implementationAt = content.indexOf('## フェーズ 9: Apply（実装）');
      expect(saveAt, variant).toBeGreaterThanOrEqual(0);
      expect(implementationChoiceAt, variant).toBeGreaterThan(saveAt);
      expect(implementationAt, variant).toBeGreaterThan(implementationChoiceAt);
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
        hash(generateSkillContent(asDeployed(createTemplate()), 'PARITY-BASELINE')),
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
        generateSkillContent(asDeployed(getOpsxProposeSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getExploreSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getSyncSpecsSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE'),
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
        generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
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
      ['onboard skill', generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE')],
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

  // #1952: the onboarding walkthrough is where a user first meets task groups,
  // so it has to say the same thing the tasks instruction does - tests and docs
  // belong to the group that did the work, not to a trailing catch-up group.
  it('teaches per-group tests and docs in the onboarding walkthrough (#1952)', () => {
    const variants: Array<[string, string]> = [
      ['onboard skill', generateSkillContent(asDeployed(getOnboardSkillTemplate()), 'PARITY-BASELINE')],
      ['onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [label, content] of variants) {
      expect(content, label).toContain(
        '各グループに、その作業に対応するテストとドキュメントを含めます。最後のグループは統合確認だけに使います。'
      );
      // The trailing group stays integration-only; it must not be renamed back
      // into a general testing/documentation bucket.
      expect(content, label).toContain('## 2. 統合検証');
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
      const content = generateSkillContent(asDeployed(createTemplate()), 'PARITY-BASELINE');
      expect(content, dirName).not.toContain('workspace-planning');
      expect(content, dirName).not.toContain('Workspace guard');
    }
  });

  it('does not suggest archiving when only planning is complete', () => {
    const variants: Array<[string, string]> = [
      [
        'skill',
        generateSkillContent(asDeployed(getContinueChangeSkillTemplate()), 'PARITY-BASELINE'),
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
    const generatedSkill = generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE');
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

  it('requires sync to create a missing main spec from ADDED requirements (#1222, #1264)', () => {
    // `openspec archive` creates the main spec from the delta's ADDED requirements
    // when it does not exist yet (`buildUpdatedSpec`, specs-apply.ts). The agent
    // workflow only told the agent to "compare each delta spec with its
    // corresponding main spec", so a capability with no main spec compared against
    // nothing, read as "already synced", and the change archived with the spec
    // never written. Assertions are scoped to the sync-assessment step so they
    // cannot pass on unrelated text elsewhere in the body.
    const archiveVariants: Array<[string, string]> = [
      ['archive skill', generateSkillContent(getArchiveChangeSkillTemplate(), 'PARITY-BASELINE')],
      ['archive opsx command', getOpsxArchiveCommandTemplate().content],
    ];

    for (const [variant, content] of archiveVariants) {
      const start = content.indexOf('**仕様差分の同期状態を評価します**');
      const end = content.indexOf('**アーカイブを実行します**');
      expect(start, variant).toBeGreaterThan(-1);
      expect(end, variant).toBeGreaterThan(start);
      const assessStep = content.slice(start, end);

      expect(assessStep, variant).toContain(
        '本仕様がないだけで**自動的に「同期済み」とは判断しません**'
      );
      expect(assessStep, variant).toContain('同期の入力ではなく出力');
      expect(assessStep, variant).toContain('差分に MODIFIED または RENAMED 要件がある場合');
      expect(assessStep, variant).toContain('新しい本仕様を作成できるのは ADDED 要件だけ');
      expect(assessStep, variant).toContain('要件を作り上げない');
      expect(assessStep, variant).toContain('それ以外で、差分に ADDED 要件がない場合');
      expect(assessStep, variant).toContain('同期できないと報告');
      expect(assessStep, variant).toContain('REMOVED だけの差分では');
      expect(assessStep, variant).toContain('本仕様ツリーは変更しません');
      expect(assessStep, variant).toContain('その機能を同期ブロック状態にします');
      expect(assessStep, variant).toContain('仕様には少なくとも 1 つの要件が必要です');
      expect(assessStep, variant).toContain('それ以外は同期が必要な機能として数え');
      expect(assessStep, variant).toContain('差分に REMOVED 要件もある場合');
      expect(assessStep, variant).toContain('無視されることを警告');
      expect(assessStep, variant).toContain(
        "差分の ADDED 要件だけから本仕様を作成"
      );
    }

    // The sync itself must not invent a requirement that has no base to modify:
    // the CLI throws "only ADDED requirements are allowed for new specs".
    const syncVariants: Array<[string, string]> = [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['sync command', getOpsxSyncCommandTemplate().content],
    ];

    for (const [variant, content] of syncVariants) {
      const start = content.indexOf('b. **本仕様を読む**');
      const end = content.indexOf('c. **変更をインテリジェントに適用**');
      expect(start, variant).toBeGreaterThan(-1);
      expect(end, variant).toBeGreaterThan(start);
      const readStep = content.slice(start, end);

      expect(readStep, variant).toContain('**本仕様がまだ存在しない場合**（新しい機能）');
      expect(readStep, variant).toContain('適用できるのは ADDED 要件だけ');
      expect(readStep, variant).toContain('MODIFIED と RENAMED は対象の要件がない');
      expect(readStep, variant).toContain('存在しない要件を補ってはいけません');
      expect(readStep, variant).toContain('REMOVED は削除対象がない');

      // ...and the creation step must not then write the empty spec the CLI refuses:
      // an unmarked REMOVED-only delta against a capability with no main spec aborts with
      // "仕様には少なくとも 1 つの要件が必要です" and leaves the tree untouched.
      const createStart = content.indexOf("d. **機能がまだ存在しない場合は本仕様を作成**");
      const createEnd = content.indexOf('**更新した本仕様を検証する**');
      expect(createStart, variant).toBeGreaterThan(-1);
      expect(createEnd, variant).toBeGreaterThan(createStart);
      const createStep = content.slice(createStart, createEnd);

      expect(createStep, variant).toContain(
        '仕様差分に追加する ADDED 要件があり'
      );
      expect(createStep, variant).toContain('手順 b で MODIFIED または RENAMED によって');
      expect(createStep, variant).toContain('何も作成せず');
      expect(createStep, variant).toContain('仕様には少なくとも 1 つの要件が必要です');
      expect(createStep, variant).toContain('空の');
    }
  });

  it('preserves explicit archive-without-sync when a missing target blocks sync', () => {
    for (const content of [
      getArchiveChangeSkillTemplate().instructions,
      getOpsxArchiveCommandTemplate().content,
    ]) {
      const assessment = content.slice(
        content.indexOf('**仕様差分がある場合:**'),
        content.indexOf('選択された同期で本仕様へ書き込む前に')
      );
      expect(assessment).not.toContain('stop instead of prompting to sync');
      expect(assessment).toContain('その機能を同期ブロック状態にします');
      expect(assessment).toContain('残りの機能の評価を続けます');
      expect(assessment).toContain(
        '同期がブロックされる機能がある場合: 理由を説明し、「同期せずにアーカイブ」と「キャンセル」だけを提示'
      );
      expect(assessment).toContain('同期がブロックされる機能がある間は、どの同期も開始せず');
      expect(assessment).toContain('「同期せずにarchive」または「今すぐarchive」— archiveへ進む');
      expect(assessment).toContain('「キャンセル」— 停止し、archiveしない');
      expect(content).toContain('同期に失敗した場合や、いずれかの機能が');
      expect(content).toContain('停止し、archiveしません');
    }
  });

  it('recognizes explicitly retired missing specs without blocking archive verification', () => {
    for (const content of [
      getArchiveChangeSkillTemplate().instructions,
      getOpsxArchiveCommandTemplate().content,
    ]) {
      const assessment = content.slice(
        content.indexOf('**仕様差分がある場合:**'),
        content.indexOf('**プロンプトオプション:**')
      );
      const retirement = assessment.indexOf('それ以外で、差分が REMOVED 要件だけで');
      expect(retirement).toBeGreaterThan(-1);
      expect(retirement).toBeLessThan(assessment.indexOf('それ以外で、差分に ADDED 要件がない場合'));
      expect(assessment).toContain('`retire_capabilities: true`');
      expect(assessment).toContain('同期済みとして数え');
      expect(assessment).toContain('本仕様を再作成しません');
      expect(content).toContain('明示的に廃止され本仕様がないケースも含め');
    }

    for (const content of [
      getSyncSpecsSkillTemplate().instructions,
      getOpsxSyncCommandTemplate().content,
    ]) {
      const createStep = content.slice(
        content.indexOf('d. **機能がまだ存在しない場合は本仕様を作成**'),
        content.indexOf('**更新した本仕様を検証する**')
      );
      expect(createStep).toContain('`retire_capabilities: true`');
      expect(createStep).toContain('廃止済みと報告');
      expect(createStep).toContain('この指定がなければ、同期が妨げられていると報告');
      expect(createStep).toContain('何も作成せず');
    }
  });

  it('gates bulk archive on inline synchronous spec sync and verification before moving change root', () => {
    const generatedSkill = generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE');
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
        generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE'),
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
      ['bulk skill', generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['bulk opsx command', getOpsxBulkArchiveCommandTemplate().content],
      ['single skill', generateSkillContent(asDeployed(getArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
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
      ['bulk skill', generateSkillContent(asDeployed(getBulkArchiveChangeSkillTemplate()), 'PARITY-BASELINE')],
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
      ['propose skill', generateSkillContent(asDeployed(getOpsxProposeSkillTemplate()), 'PARITY-BASELINE')],
      ['propose command', getOpsxProposeCommandTemplate().content],
      ['continue skill', generateSkillContent(asDeployed(getContinueChangeSkillTemplate()), 'PARITY-BASELINE')],
      ['continue command', getOpsxContinueCommandTemplate().content],
      ['ff skill', generateSkillContent(asDeployed(getFfChangeSkillTemplate()), 'PARITY-BASELINE')],
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

describe('workflow guidance matches the packaged templates (#1138)', () => {
  // Onboard drafts each artifact in the conversation and then saves what it
  // drafted, so a preview missing the template's title writes an untitled file
  // no matter what the template says.
  it('shows every artifact title in the onboarding walkthrough', () => {
    const titles = specDrivenTitles();
    const surfaces: Array<[string, string]> = [
      ['onboard skill', getOnboardSkillTemplate().instructions],
      ['opsx onboard command', getOpsxOnboardCommandTemplate().content],
    ];

    for (const [surface, text] of surfaces) {
      for (const artifactId of ['proposal', 'specs', 'design', 'tasks']) {
        expect(text, `${surface} / ${artifactId}`).toContain(`\n${titles[artifactId]}\n`);
      }
    }
  });

  // The sync workflow prints a delta reference right beside the main-spec one.
  // The two are only telling them apart if the delta carries its own title.
  it('titles the delta spec in the sync format reference', () => {
    const titles = specDrivenTitles();

    for (const [surface, text] of [
      ['sync skill', getSyncSpecsSkillTemplate().instructions],
      ['opsx sync command', getOpsxSyncCommandTemplate().content],
    ] as Array<[string, string]>) {
      expect(text, surface).toContain(`\n${titles.specs}\n\n## Purpose\n`);
      expect(text, surface).toContain('\n# <capability> Specification\n');
    }
  });
});
