import type { ChangeMetadata } from './change-metadata/index.js';
import type { PlanningHome } from './planning-home.js';

export interface PlanningHomeSummary {
  kind: 'repo' | 'workspace';
  root: string;
  changesDir: string;
  defaultSchema: string;
  workspaceName?: string;
}

export interface AffectedAreasSummary {
  known: string[];
  unresolved: boolean;
  invalid: string[];
}

export interface ActionContext {
  mode: 'repo-local' | 'workspace-planning';
  sourceOfTruth: 'repo' | 'workspace-local';
  planningArtifacts: string[];
  linkedContext: Array<{ name: string }>;
  allowedEditRoots: string[];
  requiresAffectedAreaSelection: boolean;
  constraints: string[];
}

export interface ChangeStatusPolicyArtifact {
  id: string;
  status: 'done' | 'ready' | 'blocked';
}

export interface AffectedAreasInput {
  planningHome?: PlanningHome;
  metadata?: ChangeMetadata;
}

export interface ChangeNextStepsInput {
  changeName: string;
  planningHome?: PlanningHome;
  artifactStatuses: ChangeStatusPolicyArtifact[];
  affectedAreas?: AffectedAreasSummary;
  allArtifactsComplete: boolean;
}

export interface ActionContextInput {
  planningHome?: PlanningHome;
  projectRoot: string;
  artifactIds: string[];
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
    ...(planningHome.workspace ? { workspaceName: planningHome.workspace.name } : {}),
  };
}

export function summarizeAffectedAreas(input: AffectedAreasInput): AffectedAreasSummary | undefined {
  if (input.planningHome?.kind !== 'workspace') {
    return undefined;
  }

  const known = Array.from(
    new Set(input.metadata?.affected_areas ?? [])
  ).sort((a, b) => a.localeCompare(b));
  const validAreas = new Set(input.planningHome.workspace?.links ?? []);
  const invalid = known.filter((areaName) => validAreas.size > 0 && !validAreas.has(areaName));

  return {
    known,
    unresolved: known.length === 0,
    invalid,
  };
}

export function buildActionContext(input: ActionContextInput): ActionContext {
  if (input.planningHome?.kind === 'workspace') {
    return {
      mode: 'workspace-planning',
      sourceOfTruth: 'workspace-local',
      planningArtifacts: input.artifactIds,
      linkedContext: (input.planningHome.workspace?.links ?? []).map((name) => ({ name })),
      allowedEditRoots: [],
      requiresAffectedAreaSelection: true,
      constraints: [
        'workspace-local な計画アーティファクトは、このローカル view の互換コンテキストとして扱ってください。',
        'initiative context がある場合は、永続的な調整には initiative を使ってください。',
        '明示的な編集ルートが選択されるまでは、リンク済み repo と folder をコンテキストとして扱ってください。',
        '許可された編集ルートが明示されるまでは、実装編集を行わないでください。',
      ],
    };
  }

  return {
    mode: 'repo-local',
    sourceOfTruth: 'repo',
    planningArtifacts: input.artifactIds,
    linkedContext: [],
    allowedEditRoots: [input.projectRoot],
    requiresAffectedAreaSelection: false,
    constraints: ['repo-local な変更アーティファクトと実装編集は、このプロジェクト内に限定されます。'],
  };
}

export function buildNextSteps(input: ChangeNextStepsInput): string[] {
  const readyArtifact = input.artifactStatuses.find((artifact) => artifact.status === 'ready');
  const steps: string[] = [];

  if (readyArtifact) {
    steps.push(
      `そのアーティファクトを書く前に openspec instructions ${readyArtifact.id} --change "${input.changeName}" --json を実行してください。`
    );
  } else if (input.allArtifactsComplete) {
    steps.push('すべての計画アーティファクトが完了しています。実装前に tasks をレビューしてください。');
  }

  if (input.planningHome?.kind === 'workspace') {
    if (input.affectedAreas?.unresolved) {
      steps.push('計画を進めながら、change metadata または調整タスクで影響領域を特定してください。');
    }
    steps.push('実装編集の前に、影響領域と許可された編集ルートを選択してください。');
  }

  return steps;
}
