/**
 * Artifact Workflow CLI Commands (Experimental)
 *
 * This file contains all artifact workflow commands in isolation for easy removal.
 * Commands expose the ArtifactGraph and InstructionLoader APIs to users and agents.
 *
 * To remove this feature:
 * 1. Delete this file
 * 2. Remove the registerArtifactWorkflowCommands() call from src/cli/index.ts
 */

import type { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import * as fs from 'fs';
import {
  loadChangeContext,
  formatChangeStatus,
  generateInstructions,
  listSchemas,
  listSchemasWithInfo,
  getSchemaDir,
  resolveSchema,
  ArtifactGraph,
  type ChangeStatus,
  type ArtifactInstructions,
  type SchemaInfo,
} from '../core/artifact-graph/index.js';
import { createChange, validateChangeName } from '../utils/change-utils.js';
import { getExploreSkillTemplate, getNewChangeSkillTemplate, getContinueChangeSkillTemplate, getApplyChangeSkillTemplate, getFfChangeSkillTemplate, getSyncSpecsSkillTemplate, getArchiveChangeSkillTemplate, getVerifyChangeSkillTemplate, getOpsxExploreCommandTemplate, getOpsxNewCommandTemplate, getOpsxContinueCommandTemplate, getOpsxApplyCommandTemplate, getOpsxFfCommandTemplate, getOpsxSyncCommandTemplate, getOpsxArchiveCommandTemplate, getOpsxVerifyCommandTemplate } from '../core/templates/skill-templates.js';
import { FileSystemUtils } from '../utils/file-system.js';

// -----------------------------------------------------------------------------
// Types for Apply Instructions
// -----------------------------------------------------------------------------

interface TaskItem {
  id: string;
  description: string;
  done: boolean;
}

interface ApplyInstructions {
  changeName: string;
  changeDir: string;
  schemaName: string;
  contextFiles: Record<string, string>;
  progress: {
    total: number;
    complete: number;
    remaining: number;
  };
  tasks: TaskItem[];
  state: 'blocked' | 'all_done' | 'ready';
  missingArtifacts?: string[];
  instruction: string;
}

const DEFAULT_SCHEMA = 'spec-driven';

/**
 * Checks if color output is disabled via NO_COLOR env or --no-color flag.
 */
function isColorDisabled(): boolean {
  return process.env.NO_COLOR === '1' || process.env.NO_COLOR === 'true';
}

/**
 * Gets the color function based on status.
 */
function getStatusColor(status: 'done' | 'ready' | 'blocked'): (text: string) => string {
  if (isColorDisabled()) {
    return (text: string) => text;
  }
  switch (status) {
    case 'done':
      return chalk.green;
    case 'ready':
      return chalk.yellow;
    case 'blocked':
      return chalk.red;
  }
}

/**
 * Gets the status indicator for an artifact.
 */
function getStatusIndicator(status: 'done' | 'ready' | 'blocked'): string {
  const color = getStatusColor(status);
  switch (status) {
    case 'done':
      return color('[x]');
    case 'ready':
      return color('[ ]');
    case 'blocked':
      return color('[-]');
  }
}

/**
 * Validates that a change exists and returns available changes if not.
 * Checks directory existence directly to support scaffolded changes (without proposal.md).
 */
async function validateChangeExists(
  changeName: string | undefined,
  projectRoot: string
): Promise<string> {
  const changesPath = path.join(projectRoot, 'openspec', 'changes');

  // Get all change directories (not just those with proposal.md)
  const getAvailableChanges = async (): Promise<string[]> => {
    try {
      const entries = await fs.promises.readdir(changesPath, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory() && e.name !== 'archive' && !e.name.startsWith('.'))
        .map((e) => e.name);
    } catch {
      return [];
    }
  };

  if (!changeName) {
    const available = await getAvailableChanges();
    if (available.length === 0) {
      throw new Error('変更が見つかりません。次で作成してください: openspec new change <name>');
    }
    throw new Error(
      `必須オプション --change が不足しています。利用可能な変更:\n  ${available.join('\n  ')}`
    );
  }

  // Validate change name format to prevent path traversal
  const nameValidation = validateChangeName(changeName);
  if (!nameValidation.valid) {
    throw new Error(`変更名 '${changeName}' は不正です: ${nameValidation.error}`);
  }

  // Check directory existence directly
  const changePath = path.join(changesPath, changeName);
  const exists = fs.existsSync(changePath) && fs.statSync(changePath).isDirectory();

  if (!exists) {
    const available = await getAvailableChanges();
    if (available.length === 0) {
      throw new Error(
        `変更 '${changeName}' が見つかりません。変更が存在しません。次で作成してください: openspec new change <name>`
      );
    }
    throw new Error(
      `変更 '${changeName}' が見つかりません。利用可能な変更:\n  ${available.join('\n  ')}`
    );
  }

  return changeName;
}

/**
 * Validates that a schema exists and returns available schemas if not.
 */
function validateSchemaExists(schemaName: string): string {
  const schemaDir = getSchemaDir(schemaName);
  if (!schemaDir) {
    const availableSchemas = listSchemas();
    throw new Error(
      `スキーマ '${schemaName}' が見つかりません。利用可能なスキーマ:\n  ${availableSchemas.join('\n  ')}`
    );
  }
  return schemaName;
}

// -----------------------------------------------------------------------------
// Status Command
// -----------------------------------------------------------------------------

interface StatusOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

async function statusCommand(options: StatusOptions): Promise<void> {
  const spinner = ora('変更ステータスを読み込み中...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);
    const status = formatChangeStatus(context);

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function printStatusText(status: ChangeStatus): void {
  const doneCount = status.artifacts.filter((a) => a.status === 'done').length;
  const total = status.artifacts.length;

  console.log(`変更: ${status.changeName}`);
  console.log(`スキーマ: ${status.schemaName}`);
  console.log(`進捗: ${doneCount}/${total} アーティファクト完了`);
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(`（ブロック元: ${artifact.missingDeps.join(', ')}）`);
    }

    console.log(line);
  }

  if (status.isComplete) {
    console.log();
    console.log(chalk.green('すべてのアーティファクトが完了しました！'));
  }
}

// -----------------------------------------------------------------------------
// Instructions Command
// -----------------------------------------------------------------------------

interface InstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  const spinner = ora('指示を生成中...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);

    if (!artifactId) {
      spinner.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `必須引数 <artifact> が不足しています。利用可能なアーティファクト:\n  ${validIds.join('\n  ')}`
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `アーティファクト '${artifactId}' がスキーマ '${context.schemaName}' に存在しません。利用可能なアーティファクト:\n  ${validIds.join('\n  ')}`
      );
    }

    const instructions = generateInstructions(context, artifactId);
    const isBlocked = instructions.dependencies.some((d) => !d.done);

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printInstructionsText(instructions, isBlocked);
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    outputPath,
    description,
    instruction,
    template,
    dependencies,
    unlocks,
  } = instructions;

  // Opening tag
  console.log(`<artifact id="${artifactId}" change="${changeName}" schema="${schemaName}">`);
  console.log();

  // Warning for blocked artifacts
  if (isBlocked) {
    const missing = dependencies.filter((d) => !d.done).map((d) => d.id);
    console.log('<warning>');
    console.log('このアーティファクトには未完了の依存関係があります。先に完了するか、注意して進めてください。');
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

  // Context (dependencies)
  if (dependencies.length > 0) {
    console.log('<context>');
    console.log('このアーティファクトを作成する前に、次のファイルを読んで文脈を把握してください:');
    console.log();
    for (const dep of dependencies) {
      const status = dep.done ? 'done' : 'missing';
      const fullPath = path.join(changeDir, dep.path);
      console.log(`<dependency id="${dep.id}" status="${status}">`);
      console.log(`  <path>${fullPath}</path>`);
      console.log(`  <description>${dep.description}</description>`);
      console.log('</dependency>');
    }
    console.log('</context>');
    console.log();
  }

  // Output location
  console.log('<output>');
  console.log(`出力先: ${path.join(changeDir, outputPath)}`);
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
  console.log(template.trim());
  console.log('</template>');
  console.log();

  // Success criteria placeholder
  console.log('<success_criteria>');
  console.log('<!-- スキーマの検証ルールで定義予定 -->');
  console.log('</success_criteria>');
  console.log();

  // Unlocks
  if (unlocks.length > 0) {
    console.log('<unlocks>');
    console.log(`このアーティファクトを完了すると次が可能になります: ${unlocks.join(', ')}`);
    console.log('</unlocks>');
    console.log();
  }

  // Closing tag
  console.log('</artifact>');
}

// -----------------------------------------------------------------------------
// Apply Instructions Command
// -----------------------------------------------------------------------------

interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

/**
 * Parses tasks.md content and extracts task items with their completion status.
 */
function parseTasksFile(content: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = content.split('\n');
  let taskIndex = 0;

  for (const line of lines) {
    // Match checkbox patterns: - [ ] or - [x] or - [X]
    const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)$/);
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

/**
 * Checks if an artifact output exists in the change directory.
 * Supports glob patterns (e.g., "specs/*.md") by verifying at least one matching file exists.
 */
function artifactOutputExists(changeDir: string, generates: string): boolean {
  // Normalize the generates path to use platform-specific separators
  const normalizedGenerates = generates.split('/').join(path.sep);
  const fullPath = path.join(changeDir, normalizedGenerates);

  // If it's a glob pattern (contains ** or *), check for matching files
  if (generates.includes('*')) {
    // Extract the directory part before the glob pattern
    const parts = normalizedGenerates.split(path.sep);
    const dirParts: string[] = [];
    let patternPart = '';
    for (const part of parts) {
      if (part.includes('*')) {
        patternPart = part;
        break;
      }
      dirParts.push(part);
    }
    const dirPath = path.join(changeDir, ...dirParts);

    // Check if directory exists
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return false;
    }

    // Extract expected extension from pattern (e.g., "*.md" -> ".md")
    const extMatch = patternPart.match(/\*(\.[a-zA-Z0-9]+)$/);
    const expectedExt = extMatch ? extMatch[1] : null;

    // Recursively check for matching files
    const hasMatchingFiles = (dir: string): boolean => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            // For ** patterns, recurse into subdirectories
            if (generates.includes('**') && hasMatchingFiles(path.join(dir, entry.name))) {
              return true;
            }
          } else if (entry.isFile()) {
            // Check if file matches expected extension (or any file if no extension specified)
            if (!expectedExt || entry.name.endsWith(expectedExt)) {
              return true;
            }
          }
        }
      } catch {
        return false;
      }
      return false;
    };

    return hasMatchingFiles(dirPath);
  }

  return fs.existsSync(fullPath);
}

/**
 * Generates apply instructions for implementing tasks from a change.
 * Schema-aware: reads apply phase configuration from schema to determine
 * required artifacts, tracking file, and instruction.
 */
async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string
): Promise<ApplyInstructions> {
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName);
  const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName);
  const applyConfig = schema.apply;

  // Determine required artifacts and tracking file from schema
  // Fallback: if no apply block, require all artifacts
  const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
  const tracksFile = applyConfig?.tracks ?? null;
  const schemaInstruction = applyConfig?.instruction ?? null;

  // Check which required artifacts are missing
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && !artifactOutputExists(changeDir, artifact.generates)) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from all existing artifacts in schema
  const contextFiles: Record<string, string> = {};
  for (const artifact of schema.artifacts) {
    if (artifactOutputExists(changeDir, artifact.generates)) {
      contextFiles[artifact.id] = path.join(changeDir, artifact.generates);
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
    instruction = `まだこの変更を適用できません。不足アーティファクト: ${missingArtifacts.join(', ')}。\n不足分は openspec-continue-change スキルで作成してください。`;
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `${tracksFilename} が見つからないため作成が必要です。\nopenspec-continue-change で追跡ファイルを生成してください。`;
  } else if (tracksFile && tracksFileExists && total === 0) {
    // Tracking file exists but contains no tasks
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `${tracksFilename} は存在しますがタスクがありません。\n${tracksFilename} にタスクを追加するか、openspec-continue-change で再生成してください。`;
  } else if (tracksFile && remaining === 0 && total > 0) {
    state = 'all_done';
    instruction = 'すべてのタスクが完了しました！この変更はアーカイブ可能です。\nアーカイブ前にテスト実行と変更内容の確認を推奨します。';
  } else if (!tracksFile) {
    // No tracking file (e.g., TDD schema) - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? '必要なアーティファクトが完了しました。実装を進めてください。';
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'コンテキストファイルを読み、未完了タスクを進めながら完了にチェックしてください。\n詰まったり不明点が出たら一旦止めて確認します。';
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
  };
}

async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  const spinner = ora('適用手順を生成中...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema);
    }

    // generateApplyInstructions uses loadChangeContext which auto-detects schema
    const instructions = await generateApplyInstructions(projectRoot, changeName, options.schema);

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printApplyInstructionsText(instructions);
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, contextFiles, progress, tasks, state, missingArtifacts, instruction } = instructions;

  console.log(`## 適用: ${changeName}`);
  console.log(`スキーマ: ${schemaName}`);
  console.log();

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    console.log('### ⚠️ ブロック中');
    console.log();
    console.log(`不足アーティファクト: ${missingArtifacts.join(', ')}`);
    console.log('まず openspec-continue-change スキルで作成してください。');
    console.log();
  }

  // Context files (dynamically from schema)
  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    console.log('### コンテキストファイル');
    for (const [artifactId, filePath] of contextFileEntries) {
      console.log(`- ${artifactId}: ${filePath}`);
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
}

// -----------------------------------------------------------------------------
// Templates Command
// -----------------------------------------------------------------------------

interface TemplatesOptions {
  schema?: string;
  json?: boolean;
}

interface TemplateInfo {
  artifactId: string;
  templatePath: string;
  source: 'user' | 'package';
}

async function templatesCommand(options: TemplatesOptions): Promise<void> {
  const spinner = ora('テンプレートを読み込み中...').start();

  try {
    const schemaName = validateSchemaExists(options.schema ?? DEFAULT_SCHEMA);
    const schema = resolveSchema(schemaName);
    const graph = ArtifactGraph.fromSchema(schema);
    const schemaDir = getSchemaDir(schemaName)!;

    // Determine if this is a user override or package built-in
    const { getUserSchemasDir } = await import('../core/artifact-graph/resolver.js');
    const userSchemasDir = getUserSchemasDir();
    const isUserOverride = schemaDir.startsWith(userSchemasDir);

    const templates: TemplateInfo[] = graph.getAllArtifacts().map((artifact) => ({
      artifactId: artifact.id,
      templatePath: path.join(schemaDir, 'templates', artifact.template),
      source: isUserOverride ? 'user' : 'package',
    }));

    spinner.stop();

    if (options.json) {
      const output: Record<string, { path: string; source: string }> = {};
      for (const t of templates) {
        output[t.artifactId] = { path: t.templatePath, source: t.source };
      }
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    console.log(`スキーマ: ${schemaName}`);
    console.log(`ソース: ${isUserOverride ? 'ユーザー上書き' : 'パッケージ内蔵'}`);
    console.log();

    for (const t of templates) {
      console.log(`${t.artifactId}:`);
      console.log(`  ${t.templatePath}`);
    }
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

// -----------------------------------------------------------------------------
// New Change Command
// -----------------------------------------------------------------------------

interface NewChangeOptions {
  description?: string;
  schema?: string;
}

async function newChangeCommand(name: string | undefined, options: NewChangeOptions): Promise<void> {
  if (!name) {
    throw new Error('必須引数 <name> が不足しています');
  }

  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Validate schema if provided
  if (options.schema) {
    validateSchemaExists(options.schema);
  }

  const schemaDisplay = options.schema ? `（スキーマ: '${options.schema}'）` : '';
  const spinner = ora(`変更 '${name}'${schemaDisplay} を作成中...`).start();

  try {
    const projectRoot = process.cwd();
    await createChange(projectRoot, name, { schema: options.schema });

    // If description provided, create README.md with description
    if (options.description) {
      const { promises: fs } = await import('fs');
      const changeDir = path.join(projectRoot, 'openspec', 'changes', name);
      const readmePath = path.join(changeDir, 'README.md');
      await fs.writeFile(readmePath, `# ${name}\n\n${options.description}\n`, 'utf-8');
    }

    const schemaUsed = options.schema ?? DEFAULT_SCHEMA;
    spinner.succeed(`変更 '${name}' を openspec/changes/${name}/ に作成しました（スキーマ: ${schemaUsed}）`);
  } catch (error) {
    spinner.fail(`変更 '${name}' の作成に失敗しました`);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Artifact Experimental Setup Command
// -----------------------------------------------------------------------------

/**
 * Generates Agent Skills and slash commands for the experimental artifact workflow.
 * Creates .claude/skills/ directory with SKILL.md files following Agent Skills spec.
 * Creates .claude/commands/opsx/ directory with slash command files.
 */
async function artifactExperimentalSetupCommand(): Promise<void> {
  const spinner = ora('実験的アーティファクトワークフローをセットアップ中...').start();

  try {
    const projectRoot = process.cwd();
    const skillsDir = path.join(projectRoot, '.claude', 'skills');
    const commandsDir = path.join(projectRoot, '.claude', 'commands', 'opsx');

    // Get skill templates
    const exploreSkill = getExploreSkillTemplate();
    const newChangeSkill = getNewChangeSkillTemplate();
    const continueChangeSkill = getContinueChangeSkillTemplate();
    const applyChangeSkill = getApplyChangeSkillTemplate();
    const ffChangeSkill = getFfChangeSkillTemplate();
    const syncSpecsSkill = getSyncSpecsSkillTemplate();
    const archiveChangeSkill = getArchiveChangeSkillTemplate();
    const verifyChangeSkill = getVerifyChangeSkillTemplate();

    // Get command templates
    const exploreCommand = getOpsxExploreCommandTemplate();
    const newCommand = getOpsxNewCommandTemplate();
    const continueCommand = getOpsxContinueCommandTemplate();
    const applyCommand = getOpsxApplyCommandTemplate();
    const ffCommand = getOpsxFfCommandTemplate();
    const syncCommand = getOpsxSyncCommandTemplate();
    const archiveCommand = getOpsxArchiveCommandTemplate();
    const verifyCommand = getOpsxVerifyCommandTemplate();

    // Create skill directories and SKILL.md files
    const skills = [
      { template: exploreSkill, dirName: 'openspec-explore' },
      { template: newChangeSkill, dirName: 'openspec-new-change' },
      { template: continueChangeSkill, dirName: 'openspec-continue-change' },
      { template: applyChangeSkill, dirName: 'openspec-apply-change' },
      { template: ffChangeSkill, dirName: 'openspec-ff-change' },
      { template: syncSpecsSkill, dirName: 'openspec-sync-specs' },
      { template: archiveChangeSkill, dirName: 'openspec-archive-change' },
      { template: verifyChangeSkill, dirName: 'openspec-verify-change' },
    ];

    const createdSkillFiles: string[] = [];

    for (const { template, dirName } of skills) {
      const skillDir = path.join(skillsDir, dirName);
      const skillFile = path.join(skillDir, 'SKILL.md');

      // Generate SKILL.md content with YAML frontmatter
      const skillContent = `---
name: ${template.name}
description: ${template.description}
---

${template.instructions}
`;

      // Write the skill file
      await FileSystemUtils.writeFile(skillFile, skillContent);
      createdSkillFiles.push(path.relative(projectRoot, skillFile));
    }

    // Create slash command files
    const commands = [
      { template: exploreCommand, fileName: 'explore.md' },
      { template: newCommand, fileName: 'new.md' },
      { template: continueCommand, fileName: 'continue.md' },
      { template: applyCommand, fileName: 'apply.md' },
      { template: ffCommand, fileName: 'ff.md' },
      { template: syncCommand, fileName: 'sync.md' },
      { template: archiveCommand, fileName: 'archive.md' },
      { template: verifyCommand, fileName: 'verify.md' },
    ];

    const createdCommandFiles: string[] = [];

    for (const { template, fileName } of commands) {
      const commandFile = path.join(commandsDir, fileName);

      // Generate command content with YAML frontmatter
      const commandContent = `---
name: ${template.name}
description: ${template.description}
category: ${template.category}
tags: [${template.tags.join(', ')}]
---

${template.content}
`;

      // Write the command file
      await FileSystemUtils.writeFile(commandFile, commandContent);
      createdCommandFiles.push(path.relative(projectRoot, commandFile));
    }

    spinner.succeed('実験的アーティファクトワークフローのセットアップが完了しました！');

    // Print success message
    console.log();
    console.log(chalk.bold('🧪 実験的アーティファクトワークフローのセットアップが完了しました'));
    console.log();
    console.log(chalk.bold('作成したスキル:'));
    for (const file of createdSkillFiles) {
      console.log(chalk.green('  ✓ ' + file));
    }
    console.log();
    console.log(chalk.bold('作成したスラッシュコマンド:'));
    for (const file of createdCommandFiles) {
      console.log(chalk.green('  ✓ ' + file));
    }
    console.log();
    console.log(chalk.bold('📖 使い方:'));
    console.log();
    console.log('  ' + chalk.cyan('スキル') + ' は対応エディタで自動的に有効です:');
    console.log('  • Claude Code - 自動検出で利用可能');
    console.log('  • Cursor - Settings → Rules → Import Settings で有効化');
    console.log('  • Windsurf - .claude ディレクトリから自動インポート');
    console.log();
    console.log('  自然な指示例:');
    console.log('  • "新しい OpenSpec の変更を始めたい: <feature>"');
    console.log('  • "この変更を続けて進めて"');
    console.log('  • "この変更のタスクを実装して"');
    console.log();
    console.log('  ' + chalk.cyan('スラッシュコマンド') + ' で明示的に呼び出す場合:');
    console.log('  • /opsx:explore - アイデアを整理し、問題を調査');
    console.log('  • /opsx:new - 新しい変更を開始');
    console.log('  • /opsx:continue - 次のアーティファクトを作成');
    console.log('  • /opsx:apply - タスクを実装');
    console.log('  • /opsx:ff - 早送り: すべてのアーティファクトを一括作成');
    console.log('  • /opsx:sync - 仕様差分をメイン仕様へ同期');
    console.log('  • /opsx:verify - 実装とアーティファクトの整合を検証');
    console.log('  • /opsx:archive - 完了した変更をアーカイブ');
    console.log();
    console.log(chalk.yellow('💡 この機能は実験的です。'));
    console.log('   フィードバックはこちら: https://github.com/Fission-AI/OpenSpec/issues');
    console.log();
  } catch (error) {
    spinner.fail('実験的アーティファクトワークフローのセットアップに失敗しました');
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Schemas Command
// -----------------------------------------------------------------------------

interface SchemasOptions {
  json?: boolean;
}

async function schemasCommand(options: SchemasOptions): Promise<void> {
  const schemas = listSchemasWithInfo();

  if (options.json) {
    console.log(JSON.stringify(schemas, null, 2));
    return;
  }

  console.log('利用可能なスキーマ:');
  console.log();

  for (const schema of schemas) {
    const sourceLabel = schema.source === 'user' ? chalk.dim('（ユーザー上書き）') : '';
    console.log(`  ${chalk.bold(schema.name)}${sourceLabel}`);
    console.log(`    ${schema.description}`);
    console.log(`    アーティファクト: ${schema.artifacts.join(' → ')}`);
    console.log();
  }
}

// -----------------------------------------------------------------------------
// Command Registration
// -----------------------------------------------------------------------------

/**
 * Registers all artifact workflow commands on the given program.
 * All commands are marked as experimental in their help text.
 */
export function registerArtifactWorkflowCommands(program: Command): void {
  // Status command
  program
    .command('status')
    .description('[Experimental] 変更のアーティファクト完了状況を表示')
    .option('--change <id>', 'ステータスを表示する変更名')
    .option('--schema <name>', 'スキーマを上書き（.openspec.yaml から自動検出）')
    .option('--json', 'JSON で出力')
    .action(async (options: StatusOptions) => {
      try {
        await statusCommand(options);
      } catch (error) {
        console.log();
        ora().fail(`エラー: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // Instructions command
  program
    .command('instructions [artifact]')
    .description('[Experimental] アーティファクト作成またはタスク適用の詳細指示を出力')
    .option('--change <id>', '変更名')
    .option('--schema <name>', 'スキーマを上書き（.openspec.yaml から自動検出）')
    .option('--json', 'JSON で出力')
    .action(async (artifactId: string | undefined, options: InstructionsOptions) => {
      try {
        // Special case: "apply" is not an artifact, but a command to get apply instructions
        if (artifactId === 'apply') {
          await applyInstructionsCommand(options);
        } else {
          await instructionsCommand(artifactId, options);
        }
      } catch (error) {
        console.log();
        ora().fail(`エラー: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // Templates command
  program
    .command('templates')
    .description('[Experimental] スキーマ内のテンプレート解決パスを表示')
    .option('--schema <name>', `使用するスキーマ（デフォルト: ${DEFAULT_SCHEMA}）`)
    .option('--json', 'アーティファクトID→テンプレートパスの JSON を出力')
    .action(async (options: TemplatesOptions) => {
      try {
        await templatesCommand(options);
      } catch (error) {
        console.log();
        ora().fail(`エラー: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // Schemas command
  program
    .command('schemas')
    .description('[Experimental] 利用可能なワークフロースキーマを説明付きで一覧表示')
    .option('--json', 'JSON で出力（エージェント用）')
    .action(async (options: SchemasOptions) => {
      try {
        await schemasCommand(options);
      } catch (error) {
        console.log();
        ora().fail(`エラー: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // New command group with change subcommand
  const newCmd = program.command('new').description('[Experimental] 新規項目を作成');

  newCmd
    .command('change <name>')
    .description('[Experimental] 新しい変更ディレクトリを作成')
    .option('--description <text>', 'README.md に追記する説明')
    .option('--schema <name>', `使用するワークフロースキーマ（デフォルト: ${DEFAULT_SCHEMA}）`)
    .action(async (name: string, options: NewChangeOptions) => {
      try {
        await newChangeCommand(name, options);
      } catch (error) {
        console.log();
        ora().fail(`エラー: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  // Artifact experimental setup command
  program
    .command('artifact-experimental-setup')
    .description('[Experimental] 実験的アーティファクトワークフロー向けに Agent Skills をセットアップ')
    .action(async () => {
      try {
        await artifactExperimentalSetupCommand();
      } catch (error) {
        console.log();
        ora().fail(`エラー: ${(error as Error).message}`);
        process.exit(1);
      }
    });
}
