import {
  mountInitiativesCollection,
  readInitiative,
} from '../../core/collections/initiatives/index.js';
import {
  formatContextStoreBinding,
  formatContextStoreBindingSelector,
  resolveContextStoreBinding,
  type ContextStoreBindingWarning,
} from '../../core/context-store/index.js';
import {
  getWorkspaceContextInitiativeId,
  type WorkspaceContextState,
} from '../../core/workspace/index.js';
import { WorkspaceStatus, asErrorMessage, makeStatus } from './types.js';

function contextStoreBindingWarningToStatus(
  warning: ContextStoreBindingWarning
): WorkspaceStatus {
  return makeStatus('warning', warning.code, warning.message, {
    target: warning.target ? `workspace.context.store.${warning.target}` : 'workspace.context.store',
    ...(warning.fix ? { fix: warning.fix } : {}),
  });
}

export async function collectWorkspaceContextStatuses(
  context: WorkspaceContextState | null
): Promise<WorkspaceStatus[]> {
  if (!context) {
    return [];
  }

  const initiativeId = getWorkspaceContextInitiativeId(context);
  const contextStoreLabel = formatContextStoreBinding(context.store);
  const selector = formatContextStoreBindingSelector(context.store);
  let resolvedStore: Awaited<ReturnType<typeof resolveContextStoreBinding>>;
  try {
    resolvedStore = await resolveContextStoreBinding(context.store);
  } catch (error) {
    return [
      makeStatus(
        'error',
        'workspace_context_store_unavailable',
        `workspace の context store '${contextStoreLabel}' を読み取れませんでした: ${asErrorMessage(error)}`,
        {
          target: 'workspace.context.store',
          fix: context.store.selector.kind === 'registry'
            ? 'openspec context-store doctor'
            : `.openspec-workspace/view.yaml のパスを確認するか、openspec initiative show ${initiativeId} ${selector} を実行してください`,
        }
      ),
    ];
  }

  const statuses = resolvedStore.warnings.map(contextStoreBindingWarningToStatus);

  try {
    const initiative = await readInitiative({
      collection: mountInitiativesCollection(resolvedStore.root),
      id: initiativeId,
    });

    if (!initiative) {
      return [
        ...statuses,
        makeStatus(
          'error',
          'workspace_initiative_missing',
          `workspace initiative '${contextStoreLabel}/${initiativeId}' は見つかりませんでした。`,
          {
            target: 'workspace.context.initiative',
            fix: `openspec initiative show ${initiativeId} ${selector}`,
          }
        ),
      ];
    }

    return statuses;
  } catch (error) {
    return [
      ...statuses,
      makeStatus(
        'error',
        'workspace_initiative_unavailable',
        `workspace initiative '${contextStoreLabel}/${initiativeId}' を読み取れませんでした: ${asErrorMessage(error)}`,
        {
          target: 'workspace.context.initiative',
          fix: `openspec initiative show ${initiativeId} ${selector}`,
        }
      ),
    ];
  }
}
