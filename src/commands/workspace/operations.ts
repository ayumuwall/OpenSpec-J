import * as nodeFs from 'node:fs';
import * as path from 'node:path';

import {
  WorkspacePreferredOpener,
  WorkspaceRegistryEntry,
  WorkspaceContextState,
  WorkspaceViewState,
  getWorkspaceContextInitiativeId,
  getWorkspaceContextStoreId,
  getManagedWorkspaceRoot,
  hasWorkspaceSkillProfileDrift,
  getWorkspaceChangesDir,
  getWorkspaceViewStatePath,
  isWorkspaceRoot,
  listKnownWorkspaceEntries,
  parseWorkspaceSetupLinkInput,
  readWorkspaceViewState,
  syncWorkspaceOpenSurface,
  validateWorkspaceLinkName,
  validateWorkspaceName,
  writeWorkspaceViewState,
} from '../../core/workspace/index.js';
import {
  formatContextStoreBinding,
  sameContextStoreBinding,
} from '../../core/context-store/index.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import {
  SelectedWorkspace,
  WorkspaceCliError,
  WorkspaceContextOutput,
  WorkspaceLinkMutationPayload,
  WorkspaceLinkOutput,
  WorkspaceListOutput,
  WorkspaceOutput,
  WorkspaceStatus,
  asErrorMessage,
  makeStatus,
} from './types.js';
import { collectWorkspaceContextStatuses } from './context-status.js';

const fs = nodeFs.promises;

export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

function normalizeExistingPathForStorage(existingPath: string): string {
  return FileSystemUtils.canonicalizeExistingPath(existingPath);
}

export async function resolveExistingDirectory(
  inputPath: string,
  cwd = process.cwd()
): Promise<string> {
  if (inputPath.length === 0) {
    throw new WorkspaceCliError('リポジトリまたはフォルダのパスは空にできません。', 'linked_path_empty', {
      target: 'link.path',
      fix: '存在するリポジトリまたはフォルダのパスを選択してください。',
    });
  }

  const resolvedPath = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(cwd, inputPath);

  if (!(await directoryExists(resolvedPath))) {
    throw new WorkspaceCliError(
      `パス '${inputPath}' は存在するフォルダではありません。`,
      'linked_path_missing',
      {
        target: 'link.path',
        fix: '存在するリポジトリまたはフォルダのパスを選択してください。',
      }
    );
  }

  return normalizeExistingPathForStorage(resolvedPath);
}

export function inferLinkName(absolutePath: string): string {
  return path.basename(absolutePath);
}

function normalizeLinksForOutput(
  viewState: WorkspaceViewState
): WorkspaceLinkOutput[] {
  return Object.keys(viewState.links)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      path: viewState.links[name] ?? null,
      status: [],
    }));
}

function workspaceContextToOutput(
  context: WorkspaceContextState | null
): WorkspaceContextOutput | null {
  if (!context) {
    return null;
  }

  return {
    store: getWorkspaceContextStoreId(context),
    initiative: getWorkspaceContextInitiativeId(context),
    store_selector: context.store.selector,
  };
}

function formatDuplicateLinkMessage(
  linkName: string,
  existingPath: string | null,
  replacementPath: string
): string {
  return [
    `別の link が既に同じ名前を使っているため、link 名 '${linkName}' は使えません。`,
    '既存の link:',
    `  ${linkName} -> ${existingPath ?? '(ローカルパス未記録)'}`,
    '',
    '別の link 名を選んでください:',
    `  openspec workspace link archived-${linkName} ${replacementPath}`,
    '',
    '既存 link のパスを変更したい場合:',
    `  openspec workspace relink ${linkName} ${replacementPath}`,
  ].join('\n');
}

function duplicateLinkError(
  linkName: string,
  existingPath: string | null,
  replacementPath: string
): WorkspaceCliError {
  return new WorkspaceCliError(
    formatDuplicateLinkMessage(linkName, existingPath, replacementPath),
    'duplicate_link_name',
    {
      target: `links.${linkName}`,
      fix: `別の link 名を選ぶか、'openspec workspace relink ${linkName} ${replacementPath}' を実行してください。`,
    }
  );
}

function hasWorkspaceLink(
  links: Record<string, string | null>,
  linkName: string
): boolean {
  return Object.prototype.hasOwnProperty.call(links, linkName);
}

function duplicateSetupLinkError(
  linkName: string,
  existingPath: string,
  replacementPath: string
): WorkspaceCliError {
  return new WorkspaceCliError(
    [
      `別の setup link が既に同じ名前を使っているため、link 名 '${linkName}' は使えません。`,
      '既存の link:',
      `  ${linkName} -> ${existingPath}`,
      '',
      '異なる名前で明示的な --link <name>=<path> 値を使ってください。',
    ].join('\n'),
    'duplicate_link_name',
    {
      target: `links.${linkName}`,
      fix: `別の link 名として --link ${linkName}-alt=${replacementPath} を明示的に指定してください。`,
    }
  );
}

export function validateWorkspaceNameForSetup(name: string): string {
  try {
    return validateWorkspaceName(name);
  } catch {
    throw new WorkspaceCliError(
      'Workspace 名は小文字・数字・単一ハイフン区切りの kebab-case でなければなりません。',
      'invalid_workspace_name',
      {
        target: 'workspace.name',
      }
    );
  }
}

export function validateLinkNameForCommand(name: string): string {
  try {
    return validateWorkspaceLinkName(name);
  } catch (error) {
    throw new WorkspaceCliError(asErrorMessage(error), 'invalid_link_name', {
      target: 'link.name',
    });
  }
}

function localStateInvalidStatus(error: unknown): WorkspaceStatus {
  return makeStatus(
    'error',
    'workspace_local_state_invalid',
    `マシンローカルのパスを読み取れませんでした: ${asErrorMessage(error)}`,
    {
      target: 'workspace.local_state',
      fix: '.openspec-workspace/view.yaml を修復してから、影響を受けた link に openspec workspace relink <name> <path> を実行してください。',
    }
  );
}

function workspaceSkillDriftStatus(workspaceName: string): WorkspaceStatus {
  return makeStatus(
    'warning',
    'workspace_skills_out_of_sync',
    'workspace ローカルのエージェントスキルが、現在のグローバルプロファイルと同期していません。',
    {
      target: 'workspace.skills',
      fix: `openspec workspace update --workspace ${workspaceName}`,
    }
  );
}

function appendWorkspaceSkillDriftStatus(
  statuses: WorkspaceStatus[],
  workspaceName: string,
  viewState: WorkspaceViewState | null
): void {
  if (hasWorkspaceSkillProfileDrift(viewState)) {
    statuses.push(workspaceSkillDriftStatus(workspaceName));
  }
}

export async function createManagedWorkspace(
  name: string,
  links: Record<string, string>,
  preferredOpener?: WorkspacePreferredOpener,
  context: WorkspaceContextState | null = null,
  tools?: string[]
): Promise<WorkspaceOutput> {
  const workspaceName = validateWorkspaceNameForSetup(name);
  const targetWorkspaceRoot = getManagedWorkspaceRoot(workspaceName);
  let workspaceRoot = targetWorkspaceRoot;

  if (await directoryExists(targetWorkspaceRoot)) {
    throw new WorkspaceCliError(
      `Workspace '${workspaceName}' は既に ${targetWorkspaceRoot} に存在します。`,
      'workspace_already_exists',
      {
        target: 'workspace.name',
      }
    );
  }

  let createdWorkspaceRoot = false;

  try {
    await FileSystemUtils.createDirectory(path.dirname(targetWorkspaceRoot));
    await fs.mkdir(targetWorkspaceRoot);
    createdWorkspaceRoot = true;
    workspaceRoot = FileSystemUtils.canonicalizeExistingPath(targetWorkspaceRoot);
    const viewState: WorkspaceViewState = {
      version: 1,
      name: workspaceName,
      context,
      links,
      ...(preferredOpener ? { preferred_opener: preferredOpener } : {}),
      ...(tools ? { tools } : {}),
    };
    await writeWorkspaceViewState(workspaceRoot, viewState);
    await syncWorkspaceOpenSurface(workspaceRoot, viewState);
  } catch (error) {
    if (createdWorkspaceRoot) {
      try {
        await fs.rm(targetWorkspaceRoot, { recursive: true, force: true });
      } catch {
        // Preserve the original creation failure; callers can retry or inspect the path.
      }
    }

    throw new WorkspaceCliError(
      `workspace '${workspaceName}' を作成できませんでした: ${asErrorMessage(error)}`,
      'workspace_create_failed',
      {
        target: 'workspace.root',
      }
    );
  }

  return {
    name: workspaceName,
    root: workspaceRoot,
    planning_path: getWorkspaceChangesDir(workspaceRoot),
    state_path: getWorkspaceViewStatePath(workspaceRoot),
    context: workspaceContextToOutput(context),
    links: Object.entries(links)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([linkName, linkPath]) => ({
        name: linkName,
        path: linkPath,
        status: [],
      })),
    status: [],
  };
}

export async function parseSetupLinks(
  linkInputs: string[] | undefined
): Promise<Record<string, string>> {
  const links: Record<string, string> = {};

  for (const rawLink of linkInputs ?? []) {
    const parsed = await parseWorkspaceSetupLinkInput(rawLink);
    const resolvedPath = await resolveExistingDirectory(parsed.pathInput);
    const linkName = validateLinkNameForCommand(parsed.name ?? inferLinkName(resolvedPath));

    if (links[linkName]) {
      throw duplicateSetupLinkError(linkName, links[linkName], resolvedPath);
    }

    links[linkName] = resolvedPath;
  }

  return links;
}

export async function loadWorkspaceForList(
  entry: WorkspaceRegistryEntry
): Promise<WorkspaceListOutput> {
  const workspaceStatus: WorkspaceStatus[] = [];

  if (!(await directoryExists(entry.workspaceRoot)) || !(await isWorkspaceRoot(entry.workspaceRoot))) {
    return {
      name: entry.name,
      root: entry.workspaceRoot,
      context: null,
      links: [],
      status: [
        makeStatus('error', 'workspace_root_missing', 'workspace の場所が存在しません。', {
          target: 'workspace.root',
          fix: 'ローカル workspace view を削除または修復してください。',
        }),
      ],
    };
  }

  let viewState: WorkspaceViewState;

  try {
    viewState = await readWorkspaceViewState(entry.workspaceRoot);
  } catch (error) {
    return {
      name: entry.name,
      root: entry.workspaceRoot,
      context: null,
      links: [],
      status: [
        makeStatus(
          'error',
          'workspace_state_invalid',
          `workspace の状態を読み取れませんでした: ${asErrorMessage(error)}`,
          {
            target: 'workspace.root',
            fix: 'この workspace を使う前に workspace 状態ファイルを修復してください。',
          }
        ),
      ],
    };
  }

  appendWorkspaceSkillDriftStatus(workspaceStatus, viewState.name, viewState);
  workspaceStatus.push(...(await collectWorkspaceContextStatuses(viewState.context)));

  return {
    name: viewState.name,
    root: entry.workspaceRoot,
    context: workspaceContextToOutput(viewState.context),
    links: normalizeLinksForOutput(viewState),
    status: workspaceStatus,
  };
}

export async function loadWorkspaceForDoctor(
  selected: SelectedWorkspace
): Promise<{ workspace: WorkspaceOutput; status: WorkspaceStatus[] }> {
  const commandStatus = [...selected.status];
  const workspaceStatus: WorkspaceStatus[] = [];
  const planningPath = getWorkspaceChangesDir(selected.root);

  if (!(await directoryExists(selected.root)) || !(await isWorkspaceRoot(selected.root))) {
    return {
      workspace: {
        name: selected.name,
        root: selected.root,
        planning_path: planningPath,
        state_path: getWorkspaceViewStatePath(selected.root),
        context: null,
        links: [],
        status: [
          makeStatus(
            'error',
            'selected_workspace_root_missing',
            '選択した workspace の場所が存在しないか、有効な workspace ではありません。',
            {
              target: 'workspace.root',
              fix: 'ローカル workspace view を修復するか、別の workspace を選択してください。',
            }
          ),
        ],
      },
      status: commandStatus,
    };
  }

  let viewState: WorkspaceViewState;

  try {
    viewState = await readWorkspaceViewState(selected.root);
  } catch (error) {
    return {
      workspace: {
        name: selected.name,
        root: selected.root,
        planning_path: planningPath,
        state_path: getWorkspaceViewStatePath(selected.root),
        context: null,
        links: [],
        status: [
          makeStatus(
            'error',
            'workspace_state_invalid',
            `workspace の状態を読み取れませんでした: ${asErrorMessage(error)}`,
            {
              target: 'workspace.root',
              fix: 'この workspace を使う前に .openspec-workspace/view.yaml を修復してください。',
            }
          ),
        ],
      },
      status: commandStatus,
    };
  }

  appendWorkspaceSkillDriftStatus(workspaceStatus, viewState.name, viewState);
  workspaceStatus.push(...(await collectWorkspaceContextStatuses(viewState.context)));

  const linkNames = Object.keys(viewState.links).sort((a, b) => a.localeCompare(b));
  const links: WorkspaceLinkOutput[] = [];

  for (const linkName of linkNames) {
    const linkStatus: WorkspaceStatus[] = [];
    const localPath = viewState.links[linkName] ?? null;
    let repoSpecsPath: string | null = null;

    if (!localPath) {
      linkStatus.push(
        makeStatus(
          'error',
          'linked_path_missing_from_local_state',
          '共有 link に、このマシン上のローカルパスがありません。',
          {
            target: `links.${linkName}.path`,
            fix: `openspec workspace relink ${linkName} /path/to/${linkName}`,
          }
        )
      );
    }

    if (localPath) {
      if (await directoryExists(localPath)) {
        const candidateSpecsPath = path.join(localPath, 'openspec', 'specs');
        repoSpecsPath = (await directoryExists(candidateSpecsPath)) ? candidateSpecsPath : null;
      } else {
        linkStatus.push(
          makeStatus('error', 'linked_path_missing', 'リンク済みパスが存在しません。', {
            target: `links.${linkName}.path`,
            fix: `openspec workspace relink ${linkName} /path/to/${linkName}`,
          })
        );
      }
    }

    links.push({
      name: linkName,
      path: localPath,
      repo_specs_path: repoSpecsPath,
      status: linkStatus,
    });
  }

  return {
    workspace: {
      name: viewState.name,
      root: selected.root,
      planning_path: planningPath,
      state_path: getWorkspaceViewStatePath(selected.root),
      context: workspaceContextToOutput(viewState.context),
      links,
      status: workspaceStatus,
    },
    status: commandStatus,
  };
}

async function readWorkspaceViewForMutation(selected: SelectedWorkspace): Promise<WorkspaceViewState> {
  if (!(await directoryExists(selected.root)) || !(await isWorkspaceRoot(selected.root))) {
    throw new WorkspaceCliError(
      `'${selected.name}' の workspace の場所が存在しません: ${selected.root}`,
      'selected_workspace_root_missing',
      {
        target: 'workspace.root',
        fix: '既知の workspace を確認するには openspec workspace list を実行してください。',
      }
    );
  }

  try {
    return await readWorkspaceViewState(selected.root);
  } catch (error) {
    throw new WorkspaceCliError(
      `workspace の状態を読み取れませんでした: ${asErrorMessage(error)}`,
      'workspace_state_invalid',
      {
        target: 'workspace.state',
        fix: 'この workspace を使う前に .openspec-workspace/view.yaml を修復してください。',
      }
    );
  }
}

export async function readWorkspaceForMutation(
  selected: SelectedWorkspace
): Promise<WorkspaceViewState> {
  return readWorkspaceViewForMutation(selected);
}

function buildLinkMutationPayload(
  selected: SelectedWorkspace,
  viewState: WorkspaceViewState,
  linkName: string,
  linkPath: string
): WorkspaceLinkMutationPayload {
  return {
    workspace: {
      name: viewState.name,
      root: selected.root,
      planning_path: getWorkspaceChangesDir(selected.root),
      state_path: getWorkspaceViewStatePath(selected.root),
      context: workspaceContextToOutput(viewState.context),
      links: normalizeLinksForOutput(viewState),
      status: [],
    },
    link: {
      name: linkName,
      path: linkPath,
      status: [],
    },
    status: selected.status,
  };
}

export async function addWorkspaceLink(
  selected: SelectedWorkspace,
  nameOrPath: string,
  linkPath?: string
): Promise<WorkspaceLinkMutationPayload> {
  const explicitName = linkPath ? nameOrPath : undefined;
  const pathInput = linkPath ?? nameOrPath;
  const resolvedPath = await resolveExistingDirectory(pathInput);
  const linkName = validateLinkNameForCommand(explicitName ?? inferLinkName(resolvedPath));
  const viewState = await readWorkspaceViewForMutation(selected);

  if (hasWorkspaceLink(viewState.links, linkName)) {
    throw duplicateLinkError(linkName, viewState.links[linkName] ?? null, resolvedPath);
  }

  const updatedViewState: WorkspaceViewState = {
    ...viewState,
    links: {
      ...viewState.links,
      [linkName]: resolvedPath,
    },
  };
  await writeWorkspaceViewState(selected.root, updatedViewState);
  await syncWorkspaceOpenSurface(selected.root, updatedViewState);

  return buildLinkMutationPayload(
    selected,
    updatedViewState,
    linkName,
    resolvedPath
  );
}

export async function updateWorkspaceLink(
  selected: SelectedWorkspace,
  linkNameInput: string,
  linkPath: string
): Promise<WorkspaceLinkMutationPayload> {
  const linkName = validateLinkNameForCommand(linkNameInput);
  const resolvedPath = await resolveExistingDirectory(linkPath);
  const viewState = await readWorkspaceViewForMutation(selected);

  if (!hasWorkspaceLink(viewState.links, linkName)) {
    throw new WorkspaceCliError(`不明な workspace link '${linkName}' です。`, 'unknown_link_name', {
      target: `links.${linkName}`,
      fix: 'openspec workspace doctor でリンク済みリポジトリまたはフォルダを確認してください。',
    });
  }

  const updatedViewState: WorkspaceViewState = {
    ...viewState,
    links: {
      ...viewState.links,
      [linkName]: resolvedPath,
    },
  };
  await writeWorkspaceViewState(selected.root, updatedViewState);
  await syncWorkspaceOpenSurface(selected.root, updatedViewState);

  return buildLinkMutationPayload(selected, updatedViewState, linkName, resolvedPath);
}

function sameWorkspaceContext(
  left: WorkspaceContextState | null,
  right: WorkspaceContextState
): boolean {
  return (
    left !== null &&
    sameContextStoreBinding(left.store, right.store) &&
    getWorkspaceContextInitiativeId(left) === getWorkspaceContextInitiativeId(right)
  );
}

function formatWorkspaceContext(context: WorkspaceContextState | null): string {
  return context
    ? `${formatContextStoreBinding(context.store)}/${getWorkspaceContextInitiativeId(context)}`
    : 'initiative context なし';
}

export function deriveWorkspaceNameForInitiative(initiativeId: string): string {
  return validateWorkspaceNameForSetup(initiativeId);
}

async function readExistingManagedWorkspaceView(
  workspaceName: string
): Promise<{ root: string; state: WorkspaceViewState } | null> {
  const workspaceRoot = getManagedWorkspaceRoot(workspaceName);

  if (!(await directoryExists(workspaceRoot))) {
    return null;
  }

  if (!(await isWorkspaceRoot(workspaceRoot))) {
    throw new WorkspaceCliError(
      `Workspace name '${workspaceName}' は ${workspaceRoot} にある workspace ではないディレクトリと衝突しています。`,
      'workspace_name_collision',
      {
        target: 'workspace.name',
        fix: '未使用の workspace 名を明示的に選んでください。',
      }
    );
  }

  return {
    root: workspaceRoot,
    state: await readWorkspaceViewState(workspaceRoot),
  };
}

function selectedWorkspaceFromManagedView(
  root: string,
  state: WorkspaceViewState
): SelectedWorkspace {
  return {
    name: state.name,
    root,
    status: [],
    unregisteredCurrentWorkspace: false,
  };
}

export async function selectOrCreateWorkspaceForInitiativeOpen(input: {
  workspaceName?: string;
  context: WorkspaceContextState;
  preferredOpener?: WorkspacePreferredOpener;
  linksForNewWorkspace?: () => Promise<Record<string, string>>;
}): Promise<{ selected: SelectedWorkspace; created: boolean; state: WorkspaceViewState }> {
  if (input.workspaceName) {
    const workspaceName = validateWorkspaceNameForSetup(input.workspaceName);
    const existing = await readExistingManagedWorkspaceView(workspaceName);

    if (!existing) {
      const links = input.linksForNewWorkspace ? await input.linksForNewWorkspace() : {};
      const workspace = await createManagedWorkspace(
        workspaceName,
        links,
        input.preferredOpener,
        input.context
      );
      return {
        selected: {
          name: workspace.name,
          root: workspace.root,
          status: [],
          unregisteredCurrentWorkspace: false,
        },
        created: true,
        state: await readWorkspaceViewState(workspace.root),
      };
    }

    if (sameWorkspaceContext(existing.state.context, input.context)) {
      return {
        selected: selectedWorkspaceFromManagedView(existing.root, existing.state),
        created: false,
        state: existing.state,
      };
    }

    if (!existing.state.context) {
      throw new WorkspaceCliError(
        `workspace '${workspaceName}' は initiative に紐付いていません。`,
        'workspace_context_bind_required',
        {
          target: 'workspace.context',
          fix: 'この initiative 用に新しい workspace 名を選ぶか、将来の workspace rebind/update 機能を使ってください。',
        }
      );
    }

    throw new WorkspaceCliError(
      `workspace '${workspaceName}' は既に ${formatWorkspaceContext(existing.state.context)} に紐付いています。`,
      'workspace_context_conflict',
      {
        target: 'workspace.context',
        fix: '別の workspace 名を選ぶか、この workspace に既に紐付いている initiative を開いてください。',
      }
    );
  }

  const matches: Array<{ root: string; state: WorkspaceViewState }> = [];

  for (const entry of await listKnownWorkspaceEntries()) {
    try {
      const state = await readWorkspaceViewState(entry.workspaceRoot);
      if (sameWorkspaceContext(state.context, input.context)) {
        matches.push({ root: entry.workspaceRoot, state });
      }
    } catch {
      // Broken workspaces are surfaced by list/doctor; initiative open should not
      // guess through unreadable local view records.
    }
  }

  if (matches.length === 1) {
    const [match] = matches;
    return {
      selected: selectedWorkspaceFromManagedView(match.root, match.state),
      created: false,
      state: match.state,
    };
  }

  if (matches.length > 1) {
    const names = matches.map((match) => match.state.name).sort((a, b) => a.localeCompare(b));
    throw new WorkspaceCliError(
      `複数の workspace が既に ${formatWorkspaceContext(input.context)} に紐付いています: ${names.join(', ')}。`,
      'workspace_initiative_selection_ambiguous',
      {
        target: 'workspace.name',
        fix: 'workspace 名を明示して再試行してください。',
      }
    );
  }

  const derivedName = deriveWorkspaceNameForInitiative(getWorkspaceContextInitiativeId(input.context));
  const existingDerived = await readExistingManagedWorkspaceView(derivedName);

  if (existingDerived) {
    if (sameWorkspaceContext(existingDerived.state.context, input.context)) {
      return {
        selected: selectedWorkspaceFromManagedView(existingDerived.root, existingDerived.state),
        created: false,
        state: existingDerived.state,
      };
    }

    throw new WorkspaceCliError(
      `デフォルト workspace name '${derivedName}' は、${formatWorkspaceContext(existingDerived.state.context)} を持つ workspace で既に使われています。`,
      'workspace_name_collision',
      {
        target: 'workspace.name',
        fix: `workspace 名を明示して再試行してください: openspec workspace open <name> --initiative ${getWorkspaceContextStoreId(input.context)}/${getWorkspaceContextInitiativeId(input.context)}`,
      }
    );
  }

  const workspace = await createManagedWorkspace(
    derivedName,
    input.linksForNewWorkspace ? await input.linksForNewWorkspace() : {},
    input.preferredOpener,
    input.context
  );

  return {
    selected: {
      name: workspace.name,
      root: workspace.root,
      status: [],
      unregisteredCurrentWorkspace: false,
    },
    created: true,
    state: await readWorkspaceViewState(workspace.root),
  };
}
