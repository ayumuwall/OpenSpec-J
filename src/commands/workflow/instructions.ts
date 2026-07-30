/**
 * Instructions Command
 *
 * Generates enriched instructions for creating artifacts or applying tasks.
 * Includes both artifact instructions and apply instructions.
 */

import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import {
  loadChangeContext,
  generateInstructions,
  resolveSchema,
  resolveArtifactOutputs,
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  getChangeDir,
  resolveCurrentPlanningHomeSync,
  type PlanningHome,
} from '../../core/planning-home.js';
import {
  resolveRootForCommand,
  withStoreFlag,
  toPlanningHome,
  toRootOutput,
  type ResolvedOpenSpecRoot,
} from '../../core/root-selection.js';
import {
  assembleReferenceIndex,
  renderReferencedStoresBlock,
  renderReferencedStoresSection,
  type ReferenceIndexEntry,
} from '../../core/references.js';
import { readRegistrySnapshot } from '../../core/store/registry.js';
import {
  loadOperationInputs,
  readProjectConfig,
  type ProjectConfig,
} from '../../core/project-config.js';
import {
  validateChangeExists,
  validateSchemaExists,
  type TaskItem,
  type ApplyInstructions,
  type ArchiveInstructions,
} from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstructionsOptions {
  change?: string;
  schema?: string;
  store?: string;
  storePath?: string;
  json?: boolean;
}

export interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  store?: string;
  storePath?: string;
  json?: boolean;
}

export type ArchiveInstructionsOptions = ApplyInstructionsOptions;

// -----------------------------------------------------------------------------
// Artifact Instructions Command
// -----------------------------------------------------------------------------

/**
 * Reads the resolved root's config once, assembles the referenced-store
 * index when references are declared, and resolves the config path for
 * fix text. Shared by both instruction surfaces.
 */
async function loadRootConfigContext(root: ResolvedOpenSpecRoot): Promise<{
  projectConfig: ProjectConfig | null;
  references: ReferenceIndexEntry[] | undefined;
}> {
  // readProjectConfig never throws: missing/unparseable configs are null.
  const projectConfig = readProjectConfig(root.path);

  // One registry read serves every relationship consumer in this
  // output so it never carries a torn snapshot.
  const snapshot = await readRegistrySnapshot();
  const registryEntries = snapshot.entries;

  const declared = projectConfig?.references ?? [];
  const index =
    declared.length > 0
      ? await assembleReferenceIndex({ references: declared, resolvedRoot: root, registryEntries })
      : [];

  // Omitted, not empty: an index emptied by self-reference omission must
  // look identical to an undeclared one in JSON.
  return {
    projectConfig,
    references: index.length > 0 ? index : undefined,
  };
}

export async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  // Resolve (and banner) before the spinner starts so stderr stays readable.
  const root = await resolveRootForCommand(options, { json: options.json });
  if (!root) {
    return;
  }

  const spinner = options.json ? undefined : ora('指示を生成中...').start();

  try {
    const planningHome = toPlanningHome(root);
    const projectRoot = root.path;
    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      root.changesDir,
      { newChangeHint: withStoreFlag(root, 'openspec new change <name>') }
    );

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    const { projectConfig, references } = await loadRootConfigContext(root);

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema, {
      changeDir: getChangeDir(planningHome, changeName),
      planningHome,
      projectConfig,
    });

    if (!artifactId) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `必須引数 <artifact> が指定されていません。有効なアーティファクト:\n  ${validIds.join('\n  ')}`
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `スキーマ '${context.schemaName}' にアーティファクト '${artifactId}' が見つかりません。有効なアーティファクト:\n  ${validIds.join('\n  ')}`
      );
    }

    const instructions = generateInstructions(context, artifactId, projectRoot, {
      projectConfig,
      references,
    });
    const isBlocked = instructions.dependencies.some((d) => !d.done);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({ ...instructions, root: toRootOutput(root) }, null, 2));
      return;
    }

    printInstructionsText(instructions, isBlocked);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    resolvedOutputPath,
    description,
    instruction,
    context,
    rules,
    template,
    dependencies,
    unlocks,
  } = instructions;

  // Opening tag
  console.log(`<artifact id="${artifactId}" change="${changeName}" schema="${schemaName}">`);
  console.log();

  // Artifacts skipped via skip_specs get no creation directive: emitting the
  // task/template anyway would prompt an agent to write spec files that
  // validate then rejects as conflicting with the marker.
  if (instructions.skipped) {
    console.log('<warning>');
    console.log(instructions.warning ?? 'このアーティファクトはスキップされます（.openspec.yaml で skip_specs が設定されています）。');
    console.log('</warning>');
    console.log();
    console.log('</artifact>');
    return;
  }

  // Warning for blocked artifacts
  if (isBlocked) {
    const missing = dependencies.filter((d) => !d.done).map((d) => d.id);
    console.log('<warning>');
    console.log('このアーティファクトには未完了の依存関係があります。先に完了するか、慎重に進めてください。');
    console.log(`不足: ${missing.join(', ')}`);
    console.log('</warning>');
    console.log();
  }

  // Task directive
  console.log('<task>');
  console.log(`変更 "${changeName}" の ${artifactId} アーティファクトを作成してください。`);
  console.log(description);
  console.log('</task>');
  console.log();

  // Project context (AI constraint - do not include in output)
  if (context) {
    console.log('<project_context>');
    console.log('<!-- これは背景情報です。出力には含めないでください。 -->');
    console.log(context);
    console.log('</project_context>');
    console.log();
  }

  // Referenced-store index (read-only upstream context)
  if (instructions.references && instructions.references.length > 0) {
    console.log(renderReferencedStoresBlock(instructions.references));
    console.log();
  }

  // Rules (AI constraint - do not include in output)
  if (rules && rules.length > 0) {
    console.log('<rules>');
    console.log('<!-- これは従うべき制約です。出力には含めないでください。 -->');
    for (const rule of rules) {
      console.log(`- ${rule}`);
    }
    console.log('</rules>');
    console.log();
  }

  // Dependencies (files to read for context)
  if (dependencies.length > 0) {
    console.log('<dependencies>');
    console.log('このアーティファクトを作成する前に、以下のファイルの現在の内容を読んでください（以前に確認済みでも、編集されている可能性があるためディスクから再読み込みしてください）:');
    console.log();
    for (const dep of dependencies) {
      // A dependency satisfied via skip_specs has no files by design: telling
      // the agent to read them (or calling them "done") would send it hunting
      // for spec files that must not exist.
      if (dep.skipped) {
        console.log(`<dependency id="${dep.id}" status="skipped">`);
        console.log(`  <description>Skipped: the change declares skip_specs, so this artifact has no files to read.</description>`);
        console.log('</dependency>');
        continue;
      }
      const status = dep.done ? 'done' : 'missing';
      const fullPath = path.join(changeDir, dep.path);
      console.log(`<dependency id="${dep.id}" status="${status}">`);
      console.log(`  <path>${fullPath}</path>`);
      console.log(`  <description>${dep.description}</description>`);
      console.log('</dependency>');
    }
    console.log('</dependencies>');
    console.log();
  }

  // Output location
  console.log('<output>');
  console.log(`書き込み先: ${resolvedOutputPath}`);
  console.log('</output>');
  console.log();

  // Instruction (guidance)
  if (instruction) {
    console.log('<instruction>');
    console.log(instruction.trim());
    console.log('</instruction>');
    console.log();
  }

  // Template
  console.log('<template>');
  console.log('<!-- 出力ファイルの構成として使い、各セクションを埋めてください。 -->');
  console.log(template.trim());
  console.log('</template>');
  console.log();

  // Success criteria placeholder
  console.log('<success_criteria>');
  console.log('<!-- スキーマ検証ルールで定義予定 -->');
  console.log('</success_criteria>');
  console.log();

  // Unlocks
  if (unlocks.length > 0) {
    console.log('<unlocks>');
    console.log(`このアーティファクトを完了すると有効になります: ${unlocks.join(', ')}`);
    console.log('</unlocks>');
    console.log();
  }

  // Closing tag
  console.log('</artifact>');
}

// -----------------------------------------------------------------------------
// Apply Instructions Command
// -----------------------------------------------------------------------------

/**
 * Parses tasks.md content and extracts task items with their completion status.
 */
function parseTasksFile(content: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = content.split('\n');
  let taskIndex = 0;

  for (const line of lines) {
    // Match checkbox patterns: - [ ] or - [x] or - [X]
    const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)\s*$/);
    if (checkboxMatch) {
      taskIndex++;
      const done = checkboxMatch[1].toLowerCase() === 'x';
      const description = checkboxMatch[2].trim();
      tasks.push({
        id: `${taskIndex}`,
        description,
        done,
      });
    }
  }

  return tasks;
}

export interface GenerateApplyInstructionsOptions {
  planningHome?: PlanningHome;
  references?: ReferenceIndexEntry[];
  projectConfig?: ProjectConfig | null;
}

/**
 * Generates apply instructions for implementing tasks from a change.
 * Schema-aware: reads apply phase configuration from schema to determine
 * required artifacts, tracking file, and instruction.
 */
export async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string,
  options: GenerateApplyInstructionsOptions = {}
): Promise<ApplyInstructions> {
  const planningHome =
    options.planningHome ?? resolveCurrentPlanningHomeSync({ startPath: projectRoot });
  const references = options.references;
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName, {
    changeDir: getChangeDir(planningHome, changeName),
    planningHome,
    projectConfig: options.projectConfig,
  });
  const changeDir = context.changeDir;

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName, projectRoot);
  const applyConfig = schema.apply;

  // Determine required artifacts and tracking file from schema
  // Fallback: if no apply block, require all artifacts
  const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
  const tracksFile = applyConfig?.tracks ?? null;
  const schemaInstruction = applyConfig?.instruction ?? null;
  const operationInputs = loadOperationInputs(options.projectConfig ?? null, 'apply');

  // Check which required artifacts are missing. Artifacts the change skips
  // via skip_specs count as present - their files must not exist, and
  // status already reports them complete, so apply cannot block on them.
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    if (context.skippedArtifacts?.has(artifactId)) {
      continue;
    }
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && resolveArtifactOutputs(changeDir, artifact.generates).length === 0) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from all existing artifacts in schema
  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schema.artifacts) {
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    if (outputs.length > 0) {
      contextFiles[artifact.id] = outputs;
    }
  }

  // Parse tasks if tracking file exists
  let tasks: TaskItem[] = [];
  let tracksFileExists = false;
  if (tracksFile) {
    const tracksPath = path.join(changeDir, tracksFile);
    tracksFileExists = fs.existsSync(tracksPath);
    if (tracksFileExists) {
      const tasksContent = await fs.promises.readFile(tracksPath, 'utf-8');
      tasks = parseTasksFile(tasksContent);
    }
  }

  // Calculate progress
  const total = tasks.length;
  const complete = tasks.filter((t) => t.done).length;
  const remaining = total - complete;

  // Determine state and instruction
  let state: ApplyInstructions['state'];
  let instruction: string;

  if (missingArtifacts.length > 0) {
    state = 'blocked';
    instruction = `この変更はまだ適用できません。不足アーティファクト: ${missingArtifacts.join(', ')}。\n先に openspec-continue-change スキルで不足アーティファクトを作成してください。`;
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `${tracksFilename} ファイルが見つからないため、作成が必要です。\nopenspec-continue-change で追跡ファイルを生成してください。`;
  } else if (tracksFile && tracksFileExists && total === 0) {
    // Tracking file exists but contains no tasks
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `${tracksFilename} ファイルは存在しますが、タスクがありません。\n${tracksFilename} にタスクを追加するか、openspec-continue-change で再生成してください。`;
  } else if (tracksFile && remaining === 0 && total > 0) {
    state = 'all_done';
    instruction = 'すべてのタスクが完了しました！この変更はアーカイブ可能です。\nアーカイブ前にテスト実行と変更レビューを検討してください。';
  } else if (!tracksFile) {
    // No tracking file configured in schema - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? '必要なアーティファクトがすべて完了しました。実装に進んでください。';
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'コンテキストファイルを読み、未完了タスクを進め、進捗に合わせて完了マークする。\nブロッカーや不明点があれば一旦止めて確認する。';
  }

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    contextFiles,
    progress: { total, complete, remaining },
    tasks,
    state,
    missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    instruction,
    ...(references !== undefined ? { references } : {}),
    ...operationInputs,
  };
}

export async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  // Resolve (and banner) before the spinner starts so stderr stays readable.
  const root = await resolveRootForCommand(options, { json: options.json });
  if (!root) {
    return;
  }

  const spinner = options.json ? undefined : ora('適用指示を生成中...').start();

  try {
    const planningHome = toPlanningHome(root);
    const projectRoot = root.path;
    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      root.changesDir,
      { newChangeHint: withStoreFlag(root, 'openspec new change <name>') }
    );

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // One parsed config snapshot supplies schema fallback, references, context,
    // and operation guidance for this command.
    const { projectConfig, references } = await loadRootConfigContext(root);
    const instructions = await generateApplyInstructions(projectRoot, changeName, options.schema, {
      planningHome,
      references,
      projectConfig,
    });

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({ ...instructions, root: toRootOutput(root) }, null, 2));
      return;
    }

    printApplyInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, contextFiles, progress, tasks, state, missingArtifacts, instruction } = instructions;

  console.log(`## 適用: ${changeName}`);
  console.log(`スキーマ: ${schemaName}`);
  console.log();

  if (instructions.references && instructions.references.length > 0) {
    console.log(renderReferencedStoresSection(instructions.references));
    console.log();
  }

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    console.log('### ⚠️ ブロック中');
    console.log();
    console.log(`不足アーティファクト: ${missingArtifacts.join(', ')}`);
    console.log('先に openspec-continue-change スキルでこれらを作成してください。');
    console.log();
  }

  // Context files (dynamically from schema)
  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    console.log('### コンテキストファイル');
    for (const [artifactId, filePaths] of contextFileEntries) {
      for (const filePath of filePaths) {
        console.log(`- ${artifactId}: ${filePath}`);
      }
    }
    console.log();
  }

  // Progress (only show if we have tracking)
  if (progress.total > 0 || tasks.length > 0) {
    console.log('### 進捗');
    if (state === 'all_done') {
      console.log(`${progress.complete}/${progress.total} 完了 ✓`);
    } else {
      console.log(`${progress.complete}/${progress.total} 完了`);
    }
    console.log();
  }

  // Tasks
  if (tasks.length > 0) {
    console.log('### タスク');
    for (const task of tasks) {
      const checkbox = task.done ? '[x]' : '[ ]';
      console.log(`- ${checkbox} ${task.description}`);
    }
    console.log();
  }

  // Instruction
  console.log('### 指示');
  console.log(instruction);
  console.log();

  printOperationInputsText(instructions);
}

export function generateArchiveInstructions(
  changeName: string,
  projectConfig: ProjectConfig | null
): ArchiveInstructions {
  return {
    changeName,
    ...loadOperationInputs(projectConfig, 'archive'),
  };
}

export async function archiveInstructionsCommand(
  options: ArchiveInstructionsOptions
): Promise<void> {
  const root = await resolveRootForCommand(options, { json: options.json });
  if (!root) {
    return;
  }

  const spinner = options.json ? undefined : ora('アーカイブ入力を読み込んでいます...').start();

  try {
    const changeName = await validateChangeExists(
      options.change,
      root.path,
      root.changesDir,
      { newChangeHint: withStoreFlag(root, 'openspec new change <name>') }
    );
    const projectConfig = readProjectConfig(root.path);
    const instructions = generateArchiveInstructions(changeName, projectConfig);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({ ...instructions, root: toRootOutput(root) }, null, 2));
      return;
    }

    printArchiveInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printArchiveInstructionsText(instructions: ArchiveInstructions): void {
  console.log(`## Archive Inputs: ${instructions.changeName}`);
  console.log();
  printOperationInputsText(instructions);
}

function printOperationInputsText(inputs: {
  context?: string;
  operationGuidance?: string[];
}): void {
  if (inputs.context) {
    console.log('### Project Context (required instruction input)');
    console.log(inputs.context);
    console.log();
  }

  if (inputs.operationGuidance && inputs.operationGuidance.length > 0) {
    console.log('### Operation Guidance (advisory)');
    for (const guidance of inputs.operationGuidance) {
      console.log(`- ${guidance}`);
    }
    console.log();
  }

  if (!inputs.context && !inputs.operationGuidance) {
    console.log('プロジェクトコンテキストまたは操作ガイダンスは設定されていません。');
  }
}
