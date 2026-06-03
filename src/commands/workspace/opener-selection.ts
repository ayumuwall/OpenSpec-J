import {
  WorkspacePreferredOpener,
  getDefaultWorkspaceOpenerChoiceValue,
  getWorkspaceSkillToolIds,
  listWorkspaceOpenerChoices,
  parseWorkspacePreferredOpenerValue,
} from '../../core/workspace/index.js';
import { isInteractive, resolveNoInteractive } from '../../utils/interactive.js';
import { WorkspaceCliError, WorkspaceOpenOptions, asErrorMessage } from './types.js';
import { workspaceSelectTheme } from './prompt-theme.js';

function formatOpenerChoiceName(choice: ReturnType<typeof listWorkspaceOpenerChoices>[number]): string {
  return choice.unavailableNote ? `${choice.label} (${choice.unavailableNote})` : choice.label;
}

export async function promptPreferredOpener(
  message: string,
  openerChoices = listWorkspaceOpenerChoices()
): Promise<WorkspacePreferredOpener> {
  const { select } = await import('@inquirer/prompts');
  const selectedValue = await select({
    message,
    default: getDefaultWorkspaceOpenerChoiceValue(openerChoices),
    choices: openerChoices.map((choice) => ({
      name: formatOpenerChoiceName(choice),
      short: choice.label,
      value: choice.value,
      description: choice.unavailableNote ?? `Use ${choice.label}`,
    })),
    theme: workspaceSelectTheme,
  });

  return parseWorkspacePreferredOpenerValue(selectedValue);
}

export function parseSetupOpenerOption(
  opener: string | undefined
): WorkspacePreferredOpener | undefined {
  if (!opener) {
    return undefined;
  }

  try {
    return parseWorkspacePreferredOpenerValue(opener);
  } catch (error) {
    throw new WorkspaceCliError(asErrorMessage(error), 'unsupported_workspace_opener', {
      target: 'workspace.opener',
      fix: 'Use --opener codex-cli, --opener claude, --opener github-copilot, or --opener editor.',
    });
  }
}

export function parseWorkspaceAgentOverride(agent: string): WorkspacePreferredOpener {
  let opener: WorkspacePreferredOpener | null = null;
  try {
    opener = parseWorkspacePreferredOpenerValue(agent);
  } catch {
    opener = null;
  }

  if (!opener || opener.kind !== 'agent') {
    throw new WorkspaceCliError(
      `Unsupported workspace agent '${agent}'. Supported agents: codex-cli, claude, github-copilot.`,
      'unsupported_workspace_agent',
      {
        target: 'workspace.opener',
        fix: 'Use --agent codex-cli, --agent claude, or --agent github-copilot.',
      }
    );
  }

  return opener;
}

export function getPreferredWorkspaceSkillAgentId(
  preferredOpener: WorkspacePreferredOpener | undefined
): string | null {
  if (!preferredOpener || preferredOpener.kind !== 'agent') {
    return null;
  }

  const toolId = preferredOpener.id === 'codex-cli' ? 'codex' : preferredOpener.id;
  return getWorkspaceSkillToolIds().includes(toolId) ? toolId : null;
}

export function resolveWorkspaceOpenOpenerOverride(
  options: WorkspaceOpenOptions
): WorkspacePreferredOpener | undefined {
  if (options.agent && options.editor) {
    throw new WorkspaceCliError(
      'workspace open には --agent <tool> または --editor のどちらか一方だけを指定してください。',
      'workspace_opener_conflict',
      {
        target: 'workspace.opener',
        fix: 'opener の上書き指定を 1 つだけ選んでください。',
      }
    );
  }

  if (options.agent) {
    return parseWorkspaceAgentOverride(options.agent);
  }

  if (options.editor) {
    return parseWorkspacePreferredOpenerValue('editor');
  }

  return undefined;
}

export async function resolveWorkspaceOpenOpener(
  localState: { preferred_opener?: WorkspacePreferredOpener },
  options: WorkspaceOpenOptions
): Promise<WorkspacePreferredOpener> {
  const override = resolveWorkspaceOpenOpenerOverride(options);
  if (override) {
    return override;
  }

  if (localState.preferred_opener) {
    return localState.preferred_opener;
  }

  if (!resolveNoInteractive(options) && isInteractive(options)) {
    const openerChoices = listWorkspaceOpenerChoices().filter((choice) => choice.available);
    if (openerChoices.length === 0) {
      throw new WorkspaceCliError(
        'No supported workspace opener is available on PATH.',
        'workspace_no_available_openers',
        {
          target: 'workspace.opener',
          fix: "Install VS Code ('code'), codex-cli ('codex'), or Claude ('claude'), then retry.",
        }
      );
    }

    return promptPreferredOpener('Open with:', openerChoices);
  }

  throw new WorkspaceCliError(
    'この workspace には preferred opener がまだ設定されていません。',
    'workspace_opener_unset',
    {
      target: 'workspace.opener',
      fix: '--agent <tool> または --editor を指定するか、workspace setup を対話モードで実行してデフォルト opener を選んでください。',
    }
  );
}
