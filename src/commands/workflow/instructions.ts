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
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  type TaskItem,
  type ApplyInstructions,
} from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

export interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Artifact Instructions Command
// -----------------------------------------------------------------------------

export async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  const spinner = ora('指示を生成中...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);

    if (!artifactId) {
      spinner.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `必須引数 <artifact> が指定されていません。有効なアーティファクト:\n  ${validIds.join('\n  ')}`
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `スキーマ '${context.schemaName}' にアーティファクト '${artifactId}' が見つかりません。有効なアーティファクト:\n  ${validIds.join('\n  ')}`
      );
    }

    const instructions = generateInstructions(context, artifactId, projectRoot);
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

export function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    outputPath,
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

  // Project context (AI constraint - do not include in output)
  if (context) {
    console.log('<project_context>');
    console.log('<!-- これは背景情報です。出力に含めないでください。 -->');
    console.log(context);
    console.log('</project_context>');
    console.log();
  }

  // Rules (AI constraint - do not include in output)
  if (rules && rules.length > 0) {
    console.log('<rules>');
    console.log('<!-- これは守るべき制約です。出力に含めないでください。 -->');
    for (const rule of rules) {
      console.log(`- ${rule}`);
    }
    console.log('</rules>');
    console.log();
  }

  // Dependencies (files to read for context)
  if (dependencies.length > 0) {
    console.log('<dependencies>');
    console.log('このアーティファクトを作成する前に、以下のファイルを文脈として読んでください:');
    console.log();
    for (const dep of dependencies) {
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
  console.log('<!-- これを出力ファイルの構成として使用し、各セクションを埋めてください。 -->');
  console.log(template.trim());
  console.log('</template>');
  console.log();

  // Success criteria placeholder
  console.log('<success_criteria>');
  console.log('<!-- スキーマの検証ルールで定義されます -->');
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
export async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string
): Promise<ApplyInstructions> {
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName);
  const changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName, projectRoot);
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
    instruction = `この変更はまだ適用できません。不足アーティファクト: ${missingArtifacts.join(', ')}。\n先に openspec-continue-change スキルで不足アーティファクトを作成してください。`;
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `${tracksFilename} ファイルが見つからないため、作成が必要です。\nopenspec-continue-change を使って追跡ファイルを生成してください。`;
  } else if (tracksFile && tracksFileExists && total === 0) {
    // Tracking file exists but contains no tasks
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `${tracksFilename} ファイルは存在しますが、タスクがありません。\n${tracksFilename} にタスクを追加するか、openspec-continue-change で再生成してください。`;
  } else if (tracksFile && remaining === 0 && total > 0) {
    state = 'all_done';
    instruction = 'すべてのタスクが完了しました！この変更はアーカイブ可能です。\nアーカイブ前にテストの実行と変更内容のレビューを検討してください。';
  } else if (!tracksFile) {
    // No tracking file configured in schema - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? '必要なアーティファクトがすべて完了しました。実装を進めてください。';
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim()
      ?? 'コンテキストファイルを読み、未完了タスクを進めながら完了にしてください。\nブロッカーや不明点があればいったん停止してください。';
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

export async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  const spinner = ora('適用指示を生成中...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
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

export function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, contextFiles, progress, tasks, state, missingArtifacts, instruction } = instructions;

  console.log(`## 適用: ${changeName}`);
  console.log(`スキーマ: ${schemaName}`);
  console.log();

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    console.log('### ⚠️ ブロック中');
    console.log();
    console.log(`不足アーティファクト: ${missingArtifacts.join(', ')}`);
    console.log('先に openspec-continue-change スキルで作成してください。');
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
