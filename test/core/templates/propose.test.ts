import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import {
  getOpsxProposeSkillTemplate,
  getOpsxProposeCommandTemplate,
  getFfChangeSkillTemplate,
  getOpsxFfCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { loadSchema } from '../../../src/core/artifact-graph/schema.js';
import { CommandAdapterRegistry } from '../../../src/core/command-generation/registry.js';
import { generateCommand } from '../../../src/core/command-generation/generator.js';
import {
  formatCommandInvocation,
  getInvocationForAdapter,
} from '../../../src/core/command-generation/invocation.js';
import { getCommandContents } from '../../../src/core/shared/skill-generation.js';

const proposeSkillBody = getOpsxProposeSkillTemplate().instructions;
const proposeCommandBody = getOpsxProposeCommandTemplate().content;
const proposeBodies: Array<[string, string]> = [
  ['propose skill', generateSkillContent(getOpsxProposeSkillTemplate(), 'TEST')],
  ['propose command', getOpsxProposeCommandTemplate().content],
];

// ff runs the byte-identical artifact loop, so it carries the identical guards.
const loopBodies: Array<[string, string]> = [
  ...proposeBodies,
  ['ff skill', getFfChangeSkillTemplate().instructions],
  ['ff command', getOpsxFfCommandTemplate().content],
];

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const defaultSchema = loadSchema(path.join(repoRoot, 'schemas', 'spec-driven', 'schema.yaml'));

/** The opening list that tells the agent which artifacts propose will produce. */
function artifactPreamble(body: string): string {
  const start = body.indexOf('スキーマで定義されたアーティファクトを含む変更を作成します');
  const end = body.indexOf('ユーザーが実装する準備ができたら');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return body.slice(start, end);
}

describe('propose preamble', () => {
  // #788/#1260: the preamble advertised proposal/design/tasks only, so agents
  // treated specs as optional and produced changes with no spec at all.
  // Derived from the schema so a new artifact cannot go unadvertised.
  it('advertises every artifact the default schema defines (#788, #1260)', () => {
    const ids = defaultSchema.artifacts.map(artifact => artifact.id);
    expect(ids).toContain('specs');

    for (const [label, body] of proposeBodies) {
      const preamble = artifactPreamble(body);
      for (const id of ids) {
        expect(preamble, `${label} preamble is missing the "${id}" artifact`).toContain(id);
      }
    }
  });
});

describe('default task guidance', () => {
  it('requires a concrete verification method in each task (#345)', () => {
    const tasks = defaultSchema.artifacts.find(artifact => artifact.id === 'tasks');
    expect(tasks).toBeDefined();
    expect(tasks!.instruction).toContain('各タスクのチェックボックス説明には、完了を確認する方法');
    expect(tasks!.instruction).toMatch(
      /テスト、コマンド、観察可能な振る舞い、納品物/
    );
    expect(tasks!.instruction).toMatch(
      /チェックボックス説明には、完了を確認する方法/
    );
    expect(tasks!.instruction).toMatch(
      /複数の実装タスクにまたがる統合・システム動作を確認する場合だけ、独立した検証タスクを使う/
    );

    const example = tasks!.instruction.match(/```\s*([\s\S]*?)```/)?.[1];
    expect(example).toBeDefined();
    const numberedTasks = example!.split('\n').filter(line => /^- \[ \] \d+\.\d+ /.test(line));
    expect(numberedTasks).toHaveLength(4);
    expect(numberedTasks.every(line => /確認/.test(line))).toBe(true);
    expect(numberedTasks[0]).toContain('期待するファイルが存在');
    expect(numberedTasks[1]).toContain('パッケージのインストールが成功');
    expect(numberedTasks[2]).toContain('エクスポートテストの成功');
    expect(numberedTasks[3]).toContain('引用符と区切り文字');
    expect(example).not.toMatch(/^- \[ \] \d+\.\d+ 検証\b/im);
  });
});

describe('propose implementation boundary', () => {
  it('makes the planning-only boundary prominent (#232, #258, #262)', () => {
    for (const [label, body] of proposeBodies) {
      const boundary = body.indexOf('**計画の境界**');
      const steps = body.indexOf('**手順**');
      expect(boundary, `${label} is missing its planning boundary`).toBeGreaterThanOrEqual(0);
      expect(boundary, `${label} boundary should appear before its steps`).toBeLessThan(steps);
      expect(body, label).toContain(
        'このワークフローを選択または起動したユーザー要求は、何かの作成や修正も求めていても、計画だけを許可します'
      );
      expect(body, label).toContain('プロジェクトコードを編集してはいけません');
    }
  });

  it('ends by requiring a separate apply workflow (#258, #262)', () => {
    for (const [label, body] of proposeBodies) {
      expect(body, label).toContain(
        'このワークフローを起動した要求は計画だけを許可します'
      );
      expect(body, label).toContain('変更を実装したり');
      expect(body, label).toContain('プロジェクトコードを編集したりしてはいけません');
      expect(body, label).toContain(
        '同じ応答で実装を始めてはいけません'
      );
      expect(body, label).toContain(
        'その要求に含まれた実装または apply 指示を持ち越してはいけません'
      );
      expect(body, label).toContain(
        'apply ワークフローを開始する新しいユーザー要求を待ちます'
      );
      expect(
        body.lastIndexOf('アーティファクトを提示したら停止'),
        `${label} should end with its stop guard`
      ).toBeGreaterThan(body.indexOf('**出力**'));
    }
  });

  it('asks before resolving ambiguity that could change user-visible outcomes (#258)', () => {
    for (const [label, body] of proposeBodies) {
      expect(body, label).toContain(
        'スコープ、外部から観測可能な振る舞い、互換性、受け入れ基準'
      );
      expect(body, label).toContain('変更を作成する前にユーザーへ確認します');
      expect(body, label).toContain(
        '細部については妥当な仮定を置き、計画アーティファクトに記録します'
      );
      expect(body.indexOf('変更を作成する前にユーザーへ確認します'), label)
        .toBeLessThan(body.indexOf('**変更ディレクトリを作成します**'));
    }
  });

  it('hands command-only tools to apply instead of advertising direct coding (#258)', () => {
    expect(proposeCommandBody).toContain('準備ができたら `/opsx:apply` を実行');
    expect(proposeCommandBody).not.toContain('実装するよう依頼');
    expect(proposeCommandBody).not.toContain('この変更の適用を依頼');

    expect(proposeSkillBody).toContain(
      '`/opsx:apply` を実行するか、この変更の適用を依頼してください'
    );
    expect(proposeSkillBody).not.toContain('実装するよう依頼');
  });

  it('preserves both boundaries through every command adapter', () => {
    const propose = getCommandContents(['propose'])[0];
    expect(propose?.id).toBe('propose');

    for (const adapter of CommandAdapterRegistry.getAll()) {
      const generated = generateCommand(propose, adapter).fileContent;
      const applyInvocation = formatCommandInvocation(
        getInvocationForAdapter(adapter),
        'apply'
      );
      expect(generated, adapter.toolId).toContain(
        'このワークフローを選択または起動したユーザー要求は、何かの作成や修正も求めていても、計画だけを許可します'
      );
      expect(generated, adapter.toolId).toContain('変更を実装したり');
      expect(generated, adapter.toolId).toContain(
        '同じ応答で実装を始めてはいけません'
      );
      expect(generated, adapter.toolId).toContain(
        'その要求に含まれた実装または apply 指示を持ち越してはいけません'
      );
      expect(generated, adapter.toolId).toContain(
        'apply ワークフローを開始する新しいユーザー要求を待ちます'
      );
      expect(generated, adapter.toolId).toContain(
        `準備ができたら \`${applyInvocation}\` を実行`
      );
      expect(generated, adapter.toolId).not.toContain('実装するよう依頼');
    }
  });
});

describe('propose schema selection', () => {
  // #770: the CLI and new workflow already accept an explicit schema, but
  // propose used to discard that request and always create with the default.
  it('shows both concrete creation forms after an explicit schema choice (#770)', () => {
    for (const [label, body] of proposeBodies) {
      const schemaStep = body.indexOf('**ワークフロー スキーマを決定する**');
      const createStep = body.indexOf('**変更ディレクトリを作成します**');
      const statusStep = body.indexOf('**アーティファクトの作成順序を取得する**');

      expect(schemaStep, `${label} is missing schema selection`).toBeGreaterThanOrEqual(0);
      expect(createStep, `${label} is missing change creation`).toBeGreaterThan(schemaStep);
      expect(statusStep, `${label} is missing status lookup`).toBeGreaterThan(createStep);

      const createSection = body.slice(createStep, statusStep);
      expect(createSection, label).toMatch(/^\s*openspec new change "<name>"\s*$/m);
      expect(createSection, label).toMatch(
        /^\s*openspec new change "<name>" --schema "<schema-name>"\s*$/m
      );
      expect(createSection, label).toContain(
        '登録済み store を選んだ場合は、そのコマンドと、以下で `--store` を受け付けるすべての後続 OpenSpec コマンドに `--store "<store-id>"` を付けます'
      );
      expect(createSection, label).not.toContain('every follow-up command');
    }
  });

  it('discovers schemas from the authoritative project or store root', () => {
    for (const [label, body] of proposeBodies) {
      const schemaStep = body.indexOf('**ワークフロー スキーマを決定する**');
      const createStep = body.indexOf('**変更ディレクトリを作成します**');
      const schemaSection = body.slice(schemaStep, createStep);

      expect(schemaSection, label).toContain('設定済みのデフォルトスキーマを使用します');
      expect(schemaSection, label).toContain('名前を指定して特定のスキーマを明示的に求めた');
      const contextCommand = schemaSection.indexOf('`openspec context --json`');
      const schemasCommand = schemaSection.indexOf('`openspec schemas --json`');
      expect(contextCommand, `${label} is missing root resolution`).toBeGreaterThanOrEqual(0);
      expect(schemasCommand, `${label} lists schemas before resolving the root`).toBeGreaterThan(
        contextCommand
      );
      expect(schemaSection, label).toContain('現在の作業ディレクトリから');
      expect(schemaSection, label).toContain(
        '`openspec context --json --store "<store-id>"`'
      );
      expect(schemaSection, label).toContain(
        '返された `root.path` を作業ディレクトリとして `openspec schemas --json` を実行'
      );
      expect(schemaSection, label).toContain('返された `root.path`');
      expect(schemaSection, label).toContain('ローカルの `store:` ポインタ');
      expect(schemaSection, label).toContain('グローバル `defaultStore`');
      expect(schemaSection, label).toContain(
        '`openspec schemas --json` にも `--store "<store-id>"` を付けます'
      );
      expect(schemaSection, label).not.toContain('`schemas` does not accept `--store`');
      expect(schemaSection, label).toContain('context が `no_openspec_root` だけを報告');
      expect(schemaSection, label).toContain(
        '代わりに現在の作業ディレクトリから `openspec schemas --json` を実行'
      );
      expect(schemaSection, label).toContain(
        '無効または利用不可の store にはこのフォールバックを使用しません'
      );
      expect(schemaSection, label).toContain(
        'それ以外では、設定済みのデフォルトを維持するため `--schema` を省略します'
      );
    }
  });
});

describe('artifact loop guards (propose and ff)', () => {
  // `status` is file-existence based (detectCompleted), so writing tasks.md before
  // specs flips tasks to done and satisfies a bare applyRequires stop condition
  // with specs never created. That is the #1260 failure chain.
  it('warns that a done applyRequires artifact does not imply its deps exist (#788, #1260)', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('ファイルの存在だけを示す');
      expect(body, label).toContain('依存先が存在するとは限りません');
    }
  });

  // Scoped to the applyRequires closure, not to every `ready` artifact: a custom
  // schema may define artifacts outside it (e.g. a post-implementation retro)
  // that propose has no business creating.
  it('scopes the required set to the applyRequires dependency closure', () => {
    for (const [label, body] of loopBodies) {
      // Names the seed the walk starts from (`from those`) so an agent cannot
      // read it as "every artifact that has requires edges" = the whole list.
      expect(body, label).toContain('`requires` エッジをたどって到達できる全アーティファクト');
      // Points at status --json specifically (instructions calls the edges `dependencies`).
      expect(body, label).toContain('`status --json` の `requires` エッジ');
      expect(body, label).toContain('推移的にたどってください');
      expect(body, label).toContain('セット外のアーティファクトには手を加えません');
    }
  });

  // alfred's PR #1412 blocker: `status --json` must carry the `requires` edges,
  // and the loop must derive the set from those edges rather than from `status`.
  // A `done` artifact hides nothing about its deps if the agent reads its edges.
  it('builds the required set from requires edges, not from status (#1412 review)', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        '必須セットの構築には `status` ではなく各アーティファクトの `requires` エッジを使用'
      );
      expect(body, label).toContain('done のアーティファクトにも依存先は列挙');
    }
  });

  // The status-JSON parse list must document the `requires` field the loop relies on.
  it('documents the requires edges in the status JSON it tells the agent to parse', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        '各項目には `status` と `requires` エッジ'
      );
    }
  });

  it('creates every missing artifact in the set and re-checks for cascades', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('必須セット内で不足する全アーティファクトを作成');
      expect(body, label).toContain('1つの作成によって別のものが作成可能');
    }
  });

  // specs must not be skippable on the agent's own judgment. "Required" is not
  // machine-readable (the graph has tasks requiring both specs and design), but
  // the artifact's own instruction is: spec-driven's design says "create only if
  // any apply", specs says nothing of the kind. The one legitimate way to skip
  // specs is the `skipped` status the CLI reports for a change declaring
  // `skip_specs` (#1399) — a decision the tool makes, never the agent.
  it('permits skipping only artifacts their own instruction marks conditional', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        '自身の `instruction` が条件付きと示す場合'
      );
      expect(body, label).toContain('判断を後で覆さない');
    }
  });

  // The skip_specs carve-out must stay explicit in the loop: an artifact the CLI
  // already reports as `skipped` is satisfied and must never be written, or the
  // agent creates spec files that `openspec validate` then rejects as
  // conflicting with the marker (#1399).
  it('treats a `skipped` status as satisfied and never creates it (#1399)', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('status: "skipped"');
      expect(body, label).toContain('そのファイルは存在してはなりません');
    }
  });

  // The skip decision hinges on reading the artifact's `instruction` field, so
  // the loop must explicitly tell the agent to fetch it before skipping -
  // otherwise a momentum-driven agent can skip specs without ever checking.
  it('makes the agent fetch and read the instruction field before skipping', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        '`openspec instructions <artifact-id> --change "<name>" --json` を実行し、`instruction` が任意'
      );
      expect(body, label).toContain('自己判断ではスキップできません');
    }
  });

  // The 4b heading must not re-state the buggy stop condition (apply.requires
  // alone); it has to point the agent at the whole required set.
  it('frames the loop around the required set, not apply.requires alone', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        '必須セット内の全アーティファクトが存在するまで続行（`apply.requires` だけではない）'
      );
      expect(body, label).not.toContain(
        'Continue until every artifact the apply phase depends on exists'
      );
    }
  });

  // The artifact-creation TITLE must not use "apply-ready" either: in the
  // prewritten-tasks case the change is already apply-ready when this step
  // begins, so a title of
  // "create ... until apply-ready" invites the exact early-stop this PR kills.
  it('titles the create step around the required set, not "apply-ready"', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toMatch(/\*\*必須セット内の全アーティファクトを作成(?:する)?\*\*/);
      expect(body, label).not.toContain('Create artifacts in sequence until apply-ready');
      expect(body, label).not.toMatch(/^\s*4\.\s.*apply-ready/m);
    }
  });

  // Without this the loop deadlocks: skipping design leaves tasks blocked
  // forever, no artifact is ready, and the stop condition can never be met.
  // docs/concepts.md: "Dependencies are enablers, not gates."
  it('authorizes writing a blocked artifact whose only blocker was skipped', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain('依存関係は作業を可能にするもので、ゲートではありません');
      expect(body, label).toMatch(
        /条件付き依存先をスキップしたことだけが原因で必須アーティファクトが `blocked` のままなら、それでも作成/
      );
    }
  });

  // The stop condition must cover the whole required set. A bare "stop when
  // applyRequires is done" is the lenient rule #1260 blames.
  it('stops on the whole required set, not on applyRequires alone', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        '必須セットの全アーティファクトが `done`、`skipped`、または意図的にスキップ済みになったら終了'
      );
      expect(body, label).not.toContain('Stop when all `applyRequires` artifacts are done');
    }
  });

  // The Guardrails section used to define completeness as `apply.requires`,
  // which is exactly the premise this fix refutes.
  it('does not define completeness as apply.requires in the guardrails', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).not.toMatch(
        /Create ALL artifacts needed for implementation \(as defined by schema's `apply\.requires`\)/
      );
      expect(body, label).toContain(
        'apply フェーズが推移的に依存する全アーティファクトを作成'
      );
    }
  });

  // specs `generates` a glob (specs/**/*.md), so an agent told only to "write it
  // to resolvedOutputPath" would create a directory literally named `**`.
  it('tells the agent how to resolve a glob output path', () => {
    for (const [label, body] of loopBodies) {
      expect(body, label).toContain(
        'が glob の場合は、`instruction` に従って具体的なファイルパスを選びます'
      );
    }
  });
});
