import type { PlanningHome } from './planning-home.js';

export interface PlanningHomeSummary {
  kind: 'repo';
  root: string;
  changesDir: string;
  defaultSchema: string;
}

export interface ActionContext {
  mode: 'repo-local';
  sourceOfTruth: 'repo';
  planningArtifacts: string[];
  linkedContext: Array<{ name: string }>;
  allowedEditRoots: string[];
  requiresAffectedAreaSelection: boolean;
  constraints: string[];
}

export interface ChangeStatusPolicyArtifact {
  id: string;
  status: 'done' | 'skipped' | 'ready' | 'blocked';
}

export interface ChangeNextStepsInput {
  changeName: string;
  artifactStatuses: ChangeStatusPolicyArtifact[];
  allArtifactsComplete: boolean;
  /** Selected store id; next-step commands must carry it. */
  storeId?: string;
}

export interface ActionContextInput {
  projectRoot: string;
  artifactIds: string[];
  /**
   * Set when the root is a store: the store holds the planning artifacts,
   * and `implementationRoot` is the project that declares it, if any.
   */
  store?: { id: string; implementationRoot?: string };
}

export function summarizePlanningHome(
  planningHome: PlanningHome | undefined
): PlanningHomeSummary | undefined {
  if (!planningHome) {
    return undefined;
  }

  return {
    kind: planningHome.kind,
    root: planningHome.root,
    changesDir: planningHome.changesDir,
    defaultSchema: planningHome.defaultSchema,
  };
}

export function buildActionContext(input: ActionContextInput): ActionContext {
  const scope = editScope(input);
  // Keys stay in the published contract order.
  return {
    mode: 'repo-local',
    sourceOfTruth: 'repo',
    planningArtifacts: input.artifactIds,
    linkedContext: [],
    allowedEditRoots: scope.allowedEditRoots,
    requiresAffectedAreaSelection: false,
    constraints: scope.constraints,
  };
}

/**
 * A store holds planning artifacts only. The CLI does not route tasks to
 * repos, so it names the declaring project on the current path as the edit
 * root and has the agent ask before going anywhere else (#2013).
 */
function editScope(input: ActionContextInput): Pick<ActionContext, 'allowedEditRoots' | 'constraints'> {
  if (!input.store) {
    return {
      allowedEditRoots: [input.projectRoot],
      constraints: ['リポジトリ内の変更アーティファクトと実装編集は、このプロジェクト内に限定されます。'],
    };
  }

  const planning = `変更アーティファクトはストア '${input.store.id}' (${input.projectRoot}) にあります。`;
  const { implementationRoot } = input.store;
  if (implementationRoot) {
    return {
      allowedEditRoots: [implementationRoot, input.projectRoot],
      constraints: [
        `${planning} 実装の編集は、このストアを宣言する現在のパス上のプロジェクト ${implementationRoot} で行います。他のリポジトリを編集する前に、ユーザーへ確認してください。`,
      ],
    };
  }

  return {
    allowedEditRoots: [input.projectRoot],
    constraints: [
      `${planning} OpenSpec は、この変更を実装するリポジトリを特定できませんでした。編集するリポジトリをユーザーに確認し、そこで実装を編集してください。`,
    ],
  };
}

/**
 * The one next action for a change, in both the forms the CLI needs.
 *
 * `sentence` is what the JSON `nextSteps` contract publishes; `command` is the
 * bare command the text surface prints. Both are built here so the two
 * surfaces can never name a different next step.
 */
export interface ChangeNextStep {
  /** Ready-to-run command, including any `--store` flag. */
  command: string;
  /** Sentence form carried by the JSON `nextSteps` array. */
  sentence: string;
}

export function resolveNextStep(input: ChangeNextStepsInput): ChangeNextStep | undefined {
  const readyArtifact = input.artifactStatuses.find((artifact) => artifact.status === 'ready');
  const storeFlag = input.storeId ? ` --store ${input.storeId}` : '';

  if (readyArtifact) {
    const command = `openspec instructions ${readyArtifact.id} --change "${input.changeName}"${storeFlag} --json`;
    return { command, sentence: `そのアーティファクトを書き始める前に、${command} を実行してください。` };
  }

  if (input.allArtifactsComplete) {
    const command = `openspec instructions apply --change "${input.changeName}"${storeFlag} --json`;
    return {
      command,
      sentence: `すべての計画アーティファクトが完了しました。実装の進捗を確認するには、${command} を実行してください。`,
    };
  }

  return undefined;
}

export function buildNextSteps(input: ChangeNextStepsInput): string[] {
  const step = resolveNextStep(input);
  return step ? [step.sentence] : [];
}
