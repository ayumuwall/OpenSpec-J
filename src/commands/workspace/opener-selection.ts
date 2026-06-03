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
      description: choice.unavailableNote ?? `${choice.label} を使う`,
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
      fix: '--opener codex-cli、--opener claude、--opener github-copilot、または --opener editor を使ってください。',
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
      `未対応の workspace agent '${agent}' です。対応している agent: codex-cli, claude, github-copilot。`,
      'unsupported_workspace_agent',
      {
        target: 'workspace.opener',
        fix: '--agent codex-cli、--agent claude、または --agent github-copilot を使ってください。',
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
        fix: '開き方の上書き指定を 1 つだけ選んでください。',
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
        'PATH 上に workspace を開ける対応ツールがありません。',
        'workspace_no_available_openers',
        {
          target: 'workspace.opener',
          fix: "VS Code ('code')、codex-cli ('codex')、または Claude ('claude') をインストールしてから再試行してください。",
        }
      );
    }

    return promptPreferredOpener('開く方法:', openerChoices);
  }

  throw new WorkspaceCliError(
    'この workspace にはデフォルトの開き方がまだ設定されていません。',
    'workspace_opener_unset',
    {
      target: 'workspace.opener',
      fix: '--agent <tool> または --editor を指定するか、workspace setup を対話モードで実行してデフォルトの開き方を選んでください。',
    }
  );
}
