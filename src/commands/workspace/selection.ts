import {
  findWorkspaceRoot,
  listKnownWorkspaceEntries,
  readWorkspaceViewState,
  type WorkspaceRegistryEntry,
} from '../../core/workspace/index.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { isInteractive, resolveNoInteractive } from '../../utils/interactive.js';
import { validateWorkspaceNameForSetup } from './operations.js';
import {
  SelectedWorkspace,
  WorkspaceCliError,
  WorkspaceSelectionOptions,
  WorkspaceStatus,
  makeStatus,
} from './types.js';

function normalizeRegistryRootForComparison(workspaceRoot: string): string {
  try {
    return FileSystemUtils.canonicalizeExistingPath(workspaceRoot);
  } catch {
    return workspaceRoot;
  }
}

function workspaceNotInKnownViewsWarning(): WorkspaceStatus {
  return makeStatus(
    'warning',
    'workspace_not_in_known_views',
    'この workspace は管理対象のローカル workspace view 一覧に含まれていません。',
    {
      target: 'workspace.root',
      fix: 'openspec workspace list で管理対象の workspace view を確認してください。',
    }
  );
}

function sameWorkspaceRoot(
  knownRoot: string | undefined,
  currentWorkspaceRoot: string
): boolean {
  return (
    knownRoot !== undefined &&
    normalizeRegistryRootForComparison(knownRoot) ===
      normalizeRegistryRootForComparison(currentWorkspaceRoot)
  );
}

function findKnownWorkspaceByName(
  entries: WorkspaceRegistryEntry[],
  workspaceName: string
): WorkspaceRegistryEntry | undefined {
  return entries.find((entry) => entry.name === workspaceName);
}

export function selectedWorkspaceFromEntry(entry: WorkspaceRegistryEntry): SelectedWorkspace {
  return {
    name: entry.name,
    root: entry.workspaceRoot,
    status: [],
    unregisteredCurrentWorkspace: false,
  };
}

export async function selectedWorkspaceFromRoot(
  currentWorkspaceRoot: string,
  entries: WorkspaceRegistryEntry[]
): Promise<SelectedWorkspace> {
  const viewState = await readWorkspaceViewState(currentWorkspaceRoot);
  const knownRoot = findKnownWorkspaceByName(entries, viewState.name)?.workspaceRoot;
  const isKnown = sameWorkspaceRoot(knownRoot, currentWorkspaceRoot);

  return {
    name: viewState.name,
    root: currentWorkspaceRoot,
    status: isKnown ? [] : [workspaceNotInKnownViewsWarning()],
    unregisteredCurrentWorkspace: !isKnown,
  };
}

export async function selectWorkspaceForCommand(
  options: WorkspaceSelectionOptions,
  commandName: string,
  selectionOptions: { preferPositionalName?: boolean } = {}
): Promise<SelectedWorkspace> {
  const entries = await listKnownWorkspaceEntries();

  if (options.workspace) {
    const workspaceName = validateWorkspaceNameForSetup(options.workspace);
    const entry = findKnownWorkspaceByName(entries, workspaceName);

    if (!entry) {
      throw new WorkspaceCliError(
        `不明な OpenSpec workspace '${workspaceName}' です。`,
        'workspace_not_found',
        {
          target: 'workspace.name',
          fix: 'openspec workspace list で既知の workspace を確認してください。',
        }
      );
    }

    return selectedWorkspaceFromEntry(entry);
  }

  const currentWorkspaceRoot = await findWorkspaceRoot(process.cwd());

  if (currentWorkspaceRoot) {
    return selectedWorkspaceFromRoot(currentWorkspaceRoot, entries);
  }

  if (entries.length === 0) {
    throw new WorkspaceCliError(
      "既知の OpenSpec workspace はありません。先に 'openspec workspace setup' を実行してください。\nローカルで workspace が 1 件以上登録された後は、--workspace <name> も指定できます。",
      'no_known_workspaces',
      {
        target: 'workspace.name',
        fix: 'openspec workspace setup',
      }
    );
  }

  if (entries.length === 1) {
    const [entry] = entries;

    return selectedWorkspaceFromEntry(entry);
  }

  if (options.json || resolveNoInteractive(options) || !isInteractive(options)) {
    const knownNames = entries.map((entry) => entry.name).join(', ');
    const usesPositionalName = selectionOptions.preferPositionalName;
    const fix = usesPositionalName
      ? `openspec workspace ${commandName} <name>`
      : `openspec workspace ${commandName} --workspace <name>`;

    throw new WorkspaceCliError(
      usesPositionalName
        ? `複数の OpenSpec workspace が登録されています。既知の workspace: ${knownNames}。workspace 名を渡してください。`
        : `複数の OpenSpec workspace が登録されています。既知の workspace: ${knownNames}。--workspace <name> を渡してください。`,
      'workspace_selection_ambiguous',
      {
        target: 'workspace.name',
        fix,
      }
    );
  }

  const { select } = await import('@inquirer/prompts');
  const selectedName = await select({
    message: 'Workspace を選択:',
    choices: entries.map((entry) => ({
      name: `${entry.name} (${entry.workspaceRoot})`,
      value: entry.name,
    })),
  });
  const selectedEntry = findKnownWorkspaceByName(entries, selectedName);

  if (!selectedEntry) {
    throw new WorkspaceCliError(
      `不明な OpenSpec workspace '${selectedName}' です。`,
      'workspace_not_found',
      {
        target: 'workspace.name',
        fix: '既知の workspace を確認するには openspec workspace list を実行してください。',
      }
    );
  }

  return selectedWorkspaceFromEntry(selectedEntry);
}
