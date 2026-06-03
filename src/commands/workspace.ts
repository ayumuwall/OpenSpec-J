import { Command } from 'commander';
import chalk from 'chalk';

import {
  WorkspacePreferredOpener,
  WorkspaceSkillInstallationReport,
  createWorkspaceSkillSkippedReport,
  generateWorkspaceAgentSkills,
  getWorkspaceSkillCapableTools,
  getWorkspaceSkillToolIds,
  getWorkspaceOpenerLabel,
  parseWorkspaceSkillToolsValue,
  updateWorkspaceAgentSkills,
  listKnownWorkspaceEntries,
  readWorkspaceViewState,
  syncWorkspaceOpenSurface,
  writeWorkspaceViewState,
} from '../core/workspace/index.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import {
  addWorkspaceLink,
  createManagedWorkspace,
  loadWorkspaceForDoctor,
  loadWorkspaceForList,
  parseSetupLinks,
  readWorkspaceForMutation,
  updateWorkspaceLink,
  validateWorkspaceNameForSetup,
} from './workspace/operations.js';
import { selectWorkspaceForCommand } from './workspace/selection.js';
import {
  launchWorkspaceOpenCommand,
} from './workspace/open.js';
import {
  buildWorkspaceOpenJsonPayload,
  prepareWorkspaceOpen,
  type PreparedWorkspaceOpen,
} from './workspace/open-view.js';
import {
  getPreferredWorkspaceSkillAgentId,
  parseSetupOpenerOption,
  promptPreferredOpener,
} from './workspace/opener-selection.js';
import { workspacePromptTheme } from './workspace/prompt-theme.js';
import { registerWorkspaceCommandWith } from './workspace/registration.js';
import { promptSetupLinks } from './workspace/setup-prompts.js';
import {
  WorkspaceCliError,
  WorkspaceLinkMutationPayload,
  WorkspaceListOutput,
  WorkspaceLinkOptions,
  WorkspaceListOptions,
  WorkspaceOpenOptions,
  WorkspaceOutput,
  SelectedWorkspace,
  WorkspaceSetupOptions,
  WorkspaceStatus,
  WorkspaceUpdateOptions,
  appendStatus,
  asErrorMessage,
  asStatus,
} from './workspace/types.js';

function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

function printWorkspaceSetupIntro(): void {
  console.log(chalk.bold('Workspace setup'));
  console.log('');
}

function isPromptCancellationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.message.includes('force closed the prompt with SIGINT'))
  );
}

async function promptWorkspaceName(initialName?: string): Promise<string> {
  if (initialName) {
    return validateWorkspaceNameForSetup(initialName);
  }

  const { input } = await import('@inquirer/prompts');

  console.log(chalk.bold('[1/5] workspace に名前を付ける'));
  console.log(chalk.dim('repo グループ用の安定した名前を使ってください（例: platform）。'));
  console.log('');

  return input({
    message: 'Workspace 名:',
    required: true,
    theme: workspacePromptTheme,
    validate(value: string) {
      try {
        validateWorkspaceNameForSetup(value);
        return true;
      } catch {
        return 'Workspace name は小文字・数字・単一ハイフン区切りの kebab-case でなければなりません';
      }
    },
  });
}

function parseSetupToolsOption(tools: string): string[] {
  try {
    return parseWorkspaceSkillToolsValue(tools);
  } catch (error) {
    throw new WorkspaceCliError(asErrorMessage(error), 'invalid_workspace_setup_tools', {
      target: 'workspace.skills',
      fix: `Use --tools all, --tools none, or one of: ${getWorkspaceSkillToolIds().join(', ')}`,
    });
  }
}

function parseUpdateToolsOption(tools: string): string[] {
  try {
    return parseWorkspaceSkillToolsValue(tools);
  } catch (error) {
    throw new WorkspaceCliError(asErrorMessage(error), 'invalid_workspace_update_tools', {
      target: 'workspace.skills',
      fix: `Use --tools all, --tools none, or one of: ${getWorkspaceSkillToolIds().join(', ')}`,
    });
  }
}

async function promptWorkspaceSkillAgents(
  preferredOpener: WorkspacePreferredOpener | undefined
): Promise<string[]> {
  const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');
  const preferredAgentId = getPreferredWorkspaceSkillAgentId(preferredOpener);
  const tools = getWorkspaceSkillCapableTools();
  const sortedChoices = tools
    .map((tool) => ({
      name: tool.name,
      value: tool.value,
      preSelected: tool.value === preferredAgentId,
    }))
    .sort((a, b) => {
      if (a.preSelected !== b.preSelected) {
        return a.preSelected ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

  if (preferredAgentId) {
    const preferredTool = tools.find((tool) => tool.value === preferredAgentId);
    if (preferredTool) {
      console.log(`${preferredTool.name} は優先 opener と一致するため、あらかじめ選択されています。`);
    }
  }

  return searchableMultiSelect({
    message: 'この workspace で OpenSpec スキルを配布するエージェントを選択してください:',
    pageSize: 15,
    choices: sortedChoices,
  });
}

function printStatusLines(statuses: WorkspaceStatus[]): void {
  for (const status of statuses) {
    const label = status.severity === 'warning' ? '警告' : '問題';
    console.log(`${label}: ${status.message}`);
    if (status.fix) {
      console.log(`修正: ${status.fix}`);
    }
  }
}

function printLinksHuman(links: WorkspaceOutput['links']): void {
  if (links.length === 0) {
    console.log('  (リンク済みリポジトリまたはフォルダはありません)');
    return;
  }

  for (const link of links) {
    const suffix = link.status.some((status) => status.severity === 'error') ? ' [問題]' : '';
    console.log(`  ${link.name} -> ${link.path ?? '(ローカルパス未記録)'}${suffix}`);
    if (link.repo_specs_path) {
      console.log(`    リポジトリ仕様: ${link.repo_specs_path}`);
    }
  }
}

function collectWorkspaceIssues(workspace: WorkspaceListOutput): WorkspaceStatus[] {
  return [
    ...workspace.status,
    ...workspace.links.flatMap((link) => link.status),
  ];
}

function printDoctorHuman(result: { workspace: WorkspaceOutput; status: WorkspaceStatus[] }): void {
  console.log(`Workspace: ${result.workspace.name}`);
  console.log(`場所: ${result.workspace.root}`);
  if (result.workspace.context) {
    const selector = result.workspace.context.store_selector;
    const suffix = selector.kind === 'path' ? ` via ${selector.path}` : '';
    console.log(
      `Context: ${result.workspace.context.store}/${result.workspace.context.initiative}${suffix}`
    );
  } else {
    console.log('Context: (なし)');
  }
  console.log('');
  printStatusLines(result.status);
  if (result.status.length > 0) {
    console.log('');
  }
  console.log('リンク済みリポジトリまたはフォルダ:');
  printLinksHuman(result.workspace.links);

  const issues = collectWorkspaceIssues(result.workspace);

  console.log('');
  console.log('編集境界の目安:');
  if (result.workspace.context) {
    console.log('  Initiative/context-store ファイルは共有の調整コンテキストです。');
  } else {
    console.log('  initiative の調整コンテキストは関連付けられていません。');
  }
  console.log('  リンク済みリポジトリとフォルダは、選択時のローカル実装コンテキストです。');

  if (issues.length === 0) {
    console.log('');
    console.log('workspace の問題は見つかりませんでした。');
    return;
  }

  console.log('');
  console.log('問題:');
  for (const issue of issues) {
    console.log(`  - ${issue.message}`);
    if (issue.target) {
      console.log(`    対象: ${issue.target}`);
    }
    if (issue.fix) {
      console.log(`    修正: ${issue.fix}`);
    }
  }
}

function printWorkspaceListHuman(workspaces: WorkspaceListOutput[]): void {
  console.log(chalk.bold(`OpenSpec workspaces (${workspaces.length})`));

  for (const workspace of workspaces) {
    console.log('');
    console.log(chalk.bold(workspace.name));
    console.log(`  場所: ${workspace.root}`);

    if (workspace.status.length > 0) {
      console.log('  状態:');
      for (const status of workspace.status) {
        const statusLabel = status.severity === 'warning' ? chalk.yellow('警告') : chalk.red('問題');
        console.log(`    ${statusLabel}: ${status.message}`);
        if (status.fix) {
          console.log(`    修正: ${status.fix}`);
        }
      }
    }

    console.log(`  リンク済みリポジトリまたはフォルダ (${workspace.links.length}):`);
    if (workspace.links.length === 0) {
      console.log(chalk.dim('    (none)'));
      continue;
    }

    for (const link of workspace.links) {
      const suffix = link.status.some((status) => status.severity === 'error') ? chalk.red(' [問題]') : '';
      console.log(`    ${link.name} -> ${link.path ?? '(ローカルパス未記録)'}${suffix}`);
      if (link.repo_specs_path) {
        console.log(chalk.dim(`      リポジトリ仕様: ${link.repo_specs_path}`));
      }
    }
  }
}

function printWorkspaceCheckSummaryHuman(result: { workspace: WorkspaceOutput; status: WorkspaceStatus[] }): void {
  printStatusLines(result.status);
  const issues = collectWorkspaceIssues(result.workspace);

  if (issues.length === 0) {
    console.log('  workspace の問題は見つかりませんでした。');
    return;
  }

  console.log('  問題:');
  for (const issue of issues) {
    console.log(`    - ${issue.message}`);
    if (issue.target) {
      console.log(`      対象: ${issue.target}`);
    }
    if (issue.fix) {
      console.log(`      修正: ${issue.fix}`);
    }
  }
}

function printLinkMutationHuman(
  heading: string,
  payload: WorkspaceLinkMutationPayload
): void {
  printStatusLines(payload.status);
  console.log(heading);
  console.log(`  ${payload.link.name} -> ${payload.link.path}`);
  console.log(`Workspace: ${payload.workspace.name}`);
}

function formatWorkspaceSkillAgentResult(result: { name: string; workflow_ids?: string[] }): string {
  const workflowCount = result.workflow_ids?.length ?? 0;
  const workflowLabel = `${workflowCount} workflow`;
  return `${result.name} (${workflowLabel})`;
}

function formatWorkspaceSkillRemovedResult(result: { name: string; workflow_ids?: string[] }): string {
  const workflowCount = result.workflow_ids?.length ?? 0;
  const workflowLabel = `${workflowCount} workflow`;
  return `${result.name} (${workflowLabel} 削除)`;
}

function printWorkspaceSkillReportHuman(report: WorkspaceSkillInstallationReport): void {
  console.log('エージェントスキル:');
  console.log(`  プロファイル: ${report.profile}`);
  console.log(
    `  ワークフロー: ${report.workflow_ids.length > 0 ? report.workflow_ids.join(', ') : '(未選択)'}`
  );

  if (report.generated.length > 0) {
    console.log(`  生成: ${report.generated.map(formatWorkspaceSkillAgentResult).join(', ')}`);
  }

  if (report.added.length > 0) {
    console.log(`  追加: ${report.added.map(formatWorkspaceSkillAgentResult).join(', ')}`);
  }

  if (report.refreshed.length > 0) {
    console.log(`  更新: ${report.refreshed.map(formatWorkspaceSkillAgentResult).join(', ')}`);
  }

  if (report.removed.length > 0) {
    console.log(`  削除: ${report.removed.map(formatWorkspaceSkillRemovedResult).join(', ')}`);
  }

  if (report.skipped.length > 0) {
    for (const skipped of report.skipped) {
      const prefix = skipped.name ? `${skipped.name}: ` : '';
      console.log(`  省略: ${prefix}${skipped.message}`);
    }
  }

  if (report.failed.length > 0) {
    console.log(
      chalk.red(
        `  失敗: ${report.failed.map((failure) => `${failure.name} (${failure.error})`).join(', ')}`
      )
    );
  }

  if (report.delivery_notice) {
    console.log(chalk.dim(`  ${report.delivery_notice}`));
  }
}

function hasWorkspaceSkillFailures(report: WorkspaceSkillInstallationReport): boolean {
  return report.failed.length > 0;
}

function setWorkspaceSkillFailureExitCode(report: WorkspaceSkillInstallationReport): void {
  if (hasWorkspaceSkillFailures(report)) {
    process.exitCode = 1;
  }
}

async function writeWorkspaceSkillState(
  workspaceRoot: string,
  selectedAgentIds: string[],
  report: WorkspaceSkillInstallationReport
): Promise<void> {
  const viewState = await readWorkspaceViewState(workspaceRoot);

  await writeWorkspaceViewState(workspaceRoot, {
    ...viewState,
    workspace_skills: {
      selected_agents: selectedAgentIds,
      last_applied_profile: report.profile,
      last_applied_delivery: report.delivery,
      last_applied_workflow_ids: report.workflow_ids,
      last_applied_at: new Date().toISOString(),
    },
  });
}

function resolveUpdateWorkspaceName(
  positionalName: string | undefined,
  options: WorkspaceUpdateOptions
): string | undefined {
  if (positionalName && options.workspace && positionalName !== options.workspace) {
    throw new WorkspaceCliError(
      `workspace の指定が競合しています: 位置引数 '${positionalName}' と --workspace '${options.workspace}'。`,
      'workspace_selection_conflict',
      {
        target: 'workspace.name',
        fix: '位置引数の workspace 名だけを使うか、--workspace に同じ値を指定してください。',
      }
    );
  }

  return positionalName ?? options.workspace;
}

function printWorkspaceOpenHuman(prepared: PreparedWorkspaceOpen): void {
  console.log(`Workspace を開きます: ${prepared.selected.name}`);
  console.log(`場所: ${prepared.selected.root}`);
  if (prepared.initiative) {
    console.log(`Initiative: ${prepared.initiative.store}/${prepared.initiative.id}`);
    console.log(`Initiative パス: ${prepared.initiative.root}`);
  }
  console.log(`Opener: ${getWorkspaceOpenerLabel(prepared.opener)}`);

  if (prepared.skipped.length === 0) {
    return;
  }

  console.log('');
  console.log('省略したリンク済みリポジトリまたはフォルダ:');
  for (const link of prepared.skipped) {
    const location = link.path ?? '(ローカルパス未記録)';
    console.log(`  ${link.name} -> ${location}`);
  }
  console.log('省略されたリンクは openspec workspace doctor で修正してください。');
}

class WorkspaceCommand {
  async setup(options: WorkspaceSetupOptions = {}): Promise<void> {
    try {
      const noInteractive = resolveNoInteractive(options);

      if (options.json && !noInteractive) {
        throw new WorkspaceCliError(
          'workspace setup --json には --no-interactive が必要です。',
          'setup_json_requires_no_interactive',
          {
            fix: 'openspec workspace setup --no-interactive --json --name <name> --link <path>',
          }
        );
      }

      const interactive = !noInteractive && isInteractive(options);
      if (interactive) {
        printWorkspaceSetupIntro();
      }

      if (!interactive && (!options.name || (options.link ?? []).length === 0)) {
        throw new WorkspaceCliError(
          'workspace setup --no-interactive には --name <name> と少なくとも 1 つの --link <path> が必要です。',
          'missing_setup_inputs',
          {
            fix: 'openspec workspace setup --no-interactive --name platform --link /path/to/repo',
          }
        );
      }

      const workspaceName = interactive
        ? await promptWorkspaceName(options.name)
        : validateWorkspaceNameForSetup(options.name ?? '');
      const links = interactive ? await promptSetupLinks() : await parseSetupLinks(options.link);
      if (interactive) {
        console.log('');
        console.log(chalk.bold('[3/5] 優先 opener を選択'));
      }
      const preferredOpener = interactive
        ? await promptPreferredOpener('優先 opener:')
        : parseSetupOpenerOption(options.opener);

      let selectedWorkspaceSkillAgents: string[] | undefined;
      if (options.tools !== undefined) {
        selectedWorkspaceSkillAgents = parseSetupToolsOption(options.tools);
      } else if (interactive) {
        console.log('');
        console.log(chalk.bold('[4/5] エージェントスキルをインストール'));
        console.log(chalk.dim('この workspace で OpenSpec スキルを配布するコーディングエージェントを選択してください。'));
        console.log(chalk.dim('今はスキルをインストールしない場合は、何も選ばず Enter を押してください。'));
        console.log('');
        selectedWorkspaceSkillAgents = await promptWorkspaceSkillAgents(preferredOpener);
      }

      if (Object.keys(links).length === 0) {
        throw new WorkspaceCliError(
          'workspace setup --no-interactive には --name <name> と少なくとも 1 つの --link <path> が必要です。',
          'missing_setup_inputs',
          {
            fix: 'openspec workspace setup --no-interactive --name platform --link /path/to/repo',
          }
        );
      }

      if (interactive) {
        console.log('');
        console.log(chalk.bold('[5/5] workspace ファイルを作成'));
      }

      const workspace = await createManagedWorkspace(workspaceName, links, preferredOpener);
      const skillReport =
        selectedWorkspaceSkillAgents === undefined
          ? createWorkspaceSkillSkippedReport(
              'tools_omitted',
              'workspace スキルはインストールされませんでした。後でインストールするには openspec workspace update --tools <ids> を実行してください。'
            )
          : await generateWorkspaceAgentSkills(workspace.root, selectedWorkspaceSkillAgents);

      if (selectedWorkspaceSkillAgents !== undefined && !hasWorkspaceSkillFailures(skillReport)) {
        await writeWorkspaceSkillState(workspace.root, selectedWorkspaceSkillAgents, skillReport);
      }

      const doctorResult = await loadWorkspaceForDoctor({
        name: workspace.name,
        root: workspace.root,
        status: [],
        unregisteredCurrentWorkspace: false,
      });

      if (options.json) {
        printJson({
          workspace: doctorResult.workspace,
          workspace_skills: skillReport,
          status: doctorResult.status,
        });
        setWorkspaceSkillFailureExitCode(skillReport);
        return;
      }

      console.log(chalk.green('Workspace setup が完了しました'));
      console.log('');
      printWorkspaceListHuman([doctorResult.workspace]);
      console.log('');
      console.log('Workspace 確認:');
      printWorkspaceCheckSummaryHuman(doctorResult);
      console.log('');
      printWorkspaceSkillReportHuman(skillReport);
      console.log('');
      console.log('次に使えるコマンド:');
      console.log(`  openspec workspace doctor --workspace ${workspace.name}`);
      console.log(`  openspec workspace update --workspace ${workspace.name} --tools <ids>`);
      console.log('  openspec workspace list');

      setWorkspaceSkillFailureExitCode(skillReport);
    } catch (error) {
      this.handleFailure(options.json, { workspace: null, status: [] }, error);
    }
  }

  async list(options: WorkspaceListOptions = {}): Promise<void> {
    try {
      const entries = await listKnownWorkspaceEntries();
      const workspaces = await Promise.all(entries.map((entry) => loadWorkspaceForList(entry)));
      const payload = { workspaces, status: [] as WorkspaceStatus[] };

      if (options.json) {
        printJson(payload);
        return;
      }

      if (workspaces.length === 0) {
        console.log("OpenSpec workspace は見つかりませんでした。まず 'openspec workspace setup' を実行してください。");
        return;
      }

      printWorkspaceListHuman(workspaces);
    } catch (error) {
      this.handleFailure(options.json, { workspaces: [], status: [] }, error);
    }
  }

  async link(
    nameOrPath: string | undefined,
    linkPath: string | undefined,
    options: WorkspaceLinkOptions = {}
  ): Promise<void> {
    try {
      if (!nameOrPath) {
        throw new WorkspaceCliError(
          'workspace link にはリポジトリまたはフォルダのパスが必要です。',
          'missing_link_path',
          {
            fix: 'openspec workspace link /path/to/repo',
          }
        );
      }

      const selected = await selectWorkspaceForCommand(options, 'link');
      const payload = await addWorkspaceLink(selected, nameOrPath, linkPath);

      if (options.json) {
        printJson(payload);
        return;
      }

      printLinkMutationHuman('リポジトリまたはフォルダをリンクしました:', payload);
    } catch (error) {
      this.handleFailure(options.json, { workspace: null, link: null, status: [] }, error);
    }
  }

  async relink(
    linkNameInput: string | undefined,
    linkPath: string | undefined,
    options: WorkspaceLinkOptions = {}
  ): Promise<void> {
    try {
      if (!linkNameInput || !linkPath) {
        throw new WorkspaceCliError(
          'workspace relink には link 名とリポジトリまたはフォルダのパスが必要です。',
          'missing_relink_arguments',
          {
            fix: 'openspec workspace relink <name> /path/to/repo',
          }
        );
      }

      const selected = await selectWorkspaceForCommand(options, 'relink');
      const payload = await updateWorkspaceLink(selected, linkNameInput, linkPath);

      if (options.json) {
        printJson(payload);
        return;
      }

      printLinkMutationHuman('リポジトリまたはフォルダを再リンクしました:', payload);
    } catch (error) {
      this.handleFailure(options.json, { workspace: null, link: null, status: [] }, error);
    }
  }

  async doctor(options: WorkspaceLinkOptions = {}): Promise<void> {
    try {
      const selected = await selectWorkspaceForCommand(options, 'doctor');
      const result = await loadWorkspaceForDoctor(selected);

      if (options.json) {
        printJson(result);
        return;
      }

      printDoctorHuman(result);
    } catch (error) {
      this.handleFailure(options.json, { workspace: null, status: [] }, error);
    }
  }

  async update(
    positionalName: string | undefined,
    options: WorkspaceUpdateOptions = {}
  ): Promise<void> {
    try {
      const workspaceName = resolveUpdateWorkspaceName(positionalName, options);
      const selected = await selectWorkspaceForCommand(
        {
          ...options,
          workspace: workspaceName,
        },
        'update',
        { preferPositionalName: Boolean(positionalName) }
      );
      await this.updateSelected(selected, options);
    } catch (error) {
      this.handleFailure(options.json, { workspace: null, workspace_skills: null, status: [] }, error);
    }
  }

  private async updateSelected(
    selected: SelectedWorkspace,
    options: WorkspaceUpdateOptions
  ): Promise<void> {
    const viewState = await readWorkspaceForMutation(selected);
    await syncWorkspaceOpenSurface(selected.root, viewState);

    const hasExplicitToolSelection = options.tools !== undefined;
    const selectedAgentIds = hasExplicitToolSelection
      ? parseUpdateToolsOption(options.tools ?? '')
      : viewState.workspace_skills?.selected_agents ?? [];
    const previousSkillState =
      hasExplicitToolSelection
        ? viewState.workspace_skills ?? { selected_agents: [] }
        : viewState.workspace_skills;
    const skillReport = await updateWorkspaceAgentSkills(
      selected.root,
      selectedAgentIds,
      previousSkillState
    );
    const shouldStoreSelection = hasExplicitToolSelection || Boolean(viewState.workspace_skills);

    if (shouldStoreSelection && !hasWorkspaceSkillFailures(skillReport)) {
      await writeWorkspaceSkillState(selected.root, selectedAgentIds, skillReport);
    }

    const doctorResult = await loadWorkspaceForDoctor(selected);

    if (options.json) {
      printJson({
        workspace: doctorResult.workspace,
        workspace_skills: skillReport,
        status: doctorResult.status,
      });
      setWorkspaceSkillFailureExitCode(skillReport);
      return;
    }

    console.log(chalk.green('Workspace update が完了しました'));
    console.log(`Workspace: ${doctorResult.workspace.name}`);
    console.log(`場所: ${doctorResult.workspace.root}`);
    console.log('');
    printStatusLines(doctorResult.status);
    if (doctorResult.status.length > 0) {
      console.log('');
    }
    printWorkspaceSkillReportHuman(skillReport);
    console.log('');
    console.log('次に使えるコマンド:');
    console.log(`  openspec workspace doctor --workspace ${doctorResult.workspace.name}`);
    console.log(`  openspec workspace update --workspace ${doctorResult.workspace.name} --tools <ids>`);

    setWorkspaceSkillFailureExitCode(skillReport);
  }

  async open(
    positionalName: string | undefined,
    options: WorkspaceOpenOptions = {}
  ): Promise<void> {
    try {
      const prepared = await prepareWorkspaceOpen(positionalName, options);

      if (!options.json) {
        printStatusLines(prepared.selected.status);
        if (prepared.selected.status.length > 0) {
          console.log('');
        }
        printWorkspaceOpenHuman(prepared);
      }

      await launchWorkspaceOpenCommand(prepared.command, {
        stdio: options.json ? 'ignore' : 'inherit',
      });

      if (options.json) {
        printJson(buildWorkspaceOpenJsonPayload(prepared));
      }
    } catch (error) {
      this.handleFailure(options.json, { workspace: null, status: [] }, error);
    }
  }

  private handleFailure<T extends { status: WorkspaceStatus[] }>(
    json: boolean | undefined,
    payload: T,
    error: unknown
  ): void {
    if (!json && isPromptCancellationError(error)) {
      console.error('キャンセルしました。');
      process.exitCode = 130;
      return;
    }

    if (json) {
      printJson(appendStatus(payload, asStatus(error)));
      process.exitCode = 1;
      return;
    }

    const status = asStatus(error);
    console.error(`エラー: ${status.message}`);
    if (status.fix) {
      console.error(`修正: ${status.fix}`);
    }
    process.exitCode = 1;
  }
}

export async function runWorkspaceUpdate(
  positionalName: string | undefined,
  options: WorkspaceUpdateOptions = {}
): Promise<void> {
  const workspaceCommand = new WorkspaceCommand();
  await workspaceCommand.update(positionalName, options);
}

export function registerWorkspaceCommand(program: Command): void {
  registerWorkspaceCommandWith(program, new WorkspaceCommand());
}
