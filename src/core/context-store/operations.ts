import { execFile } from 'node:child_process';
import * as nodeFs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';

import { FileSystemUtils } from '../../utils/file-system.js';
import {
  getDefaultContextStoreRoot,
  getContextStoreMetadataPath,
  getContextStoreRegistryPath,
  listContextStoreRegistryEntries,
  readContextStoreRegistryState,
  readOptionalContextStoreMetadataState,
  resolveGitContextStoreBackendConfig,
  validateContextStoreId,
  type ContextStoreGitBackendConfig,
  type ContextStorePathOptions,
  type ContextStoreRegistryState,
} from './foundation.js';
import { ContextStoreError, type ContextStoreDiagnostic, makeContextStoreDiagnostic } from './errors.js';
import {
  getStoreRootForBackend,
  assertNoRegisteredStoreConflict,
  commitContextStoreRegistration,
  getRegisteredContextStore,
  listRegisteredContextStores,
  unregisterContextStoreRegistration,
} from './registry.js';

const fs = nodeFs.promises;
const execFileAsync = promisify(execFile);

type PathKind = 'missing' | 'directory' | 'file' | 'other';

export interface ContextStoreInfo {
  id: string;
  root: string;
  metadataPath?: string;
}

export interface ContextStoreMutationResult {
  store: ContextStoreInfo;
  registryCommit: {
    path: string;
  };
  git: {
    isRepository: boolean;
    initialized: boolean;
  };
  createdArtifacts: string[];
}

export interface ContextStoreCleanupResult {
  store: ContextStoreInfo;
  registryCommit: {
    path: string;
    removed: boolean;
  };
  files: {
    deleted: boolean;
    deletedPath?: string;
    leftOnDisk?: string;
  };
  diagnostics: ContextStoreDiagnostic[];
}

export interface ContextStoreListResult {
  stores: ContextStoreInfo[];
}

export interface ContextStoreDoctorResult {
  stores: ContextStoreInspection[];
  diagnostics: ContextStoreDiagnostic[];
}

export interface ContextStoreInspection extends ContextStoreInfo {
  metadata: {
    present: boolean | null;
    valid: boolean | null;
    id?: string;
  };
  git: {
    isRepository: boolean | null;
  };
  diagnostics: ContextStoreDiagnostic[];
}

export interface SetupContextStoreInput {
  id?: string;
  path?: string;
  initGit?: boolean;
  allowInsideGitRepository?: boolean;
}

export interface RegisterExistingContextStoreInput {
  path?: string;
  id?: string;
}

export interface CleanupContextStoreInput extends ContextStorePathOptions {
  id: string;
}

export interface PreparedContextStoreCleanup extends ContextStoreInfo, ContextStorePathOptions {
  backend: ContextStoreGitBackendConfig;
}

export interface PreparedContextStoreSetup {
  id: string;
  root: string;
  rootKind: Extract<PathKind, 'missing' | 'directory'>;
  backend?: ContextStoreGitBackendConfig;
  registry: ContextStoreRegistryState | null;
}

interface ContextStoreSetupPlan {
  id: string;
  storeRoot: string;
  kind: Extract<PathKind, 'missing' | 'directory'>;
  backend?: ContextStoreGitBackendConfig;
  registry: ContextStoreRegistryState | null;
}

async function pathKind(targetPath: string): Promise<PathKind> {
  try {
    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) return 'directory';
    if (stat.isFile()) return 'file';
    return 'other';
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return 'missing';
    }
    throw error;
  }
}

async function isDirectoryEmpty(directory: string): Promise<boolean> {
  return (await fs.readdir(directory)).length === 0;
}

async function readStoreMetadataForOperation(storeRoot: string) {
  try {
    return await readOptionalContextStoreMetadataState(storeRoot);
  } catch (error) {
    throw new ContextStoreError(
      error instanceof Error ? error.message : String(error),
      'invalid_context_store_metadata',
      {
        target: 'context_store.metadata',
        fix: `Repair ${getContextStoreMetadataPath(storeRoot)}.`,
      }
    );
  }
}

async function isGitRepositoryAtRoot(storeRoot: string): Promise<boolean> {
  const gitPath = path.join(storeRoot, '.git');
  const kind = await pathKind(gitPath);
  return kind === 'directory' || kind === 'file';
}

async function nearestExistingDirectory(targetPath: string): Promise<string | null> {
  let current = path.resolve(targetPath);

  while (true) {
    const kind = await pathKind(current);
    if (kind === 'directory') return current;
    if (kind !== 'missing') return null;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function findContainingGitRepositoryRoot(storeRoot: string): Promise<string | null> {
  const resolvedStoreRoot = path.resolve(storeRoot);
  const nearestParent = await nearestExistingDirectory(path.dirname(resolvedStoreRoot));
  if (!nearestParent) return null;
  const comparableStoreRoot = path.resolve(
    FileSystemUtils.canonicalizeExistingPath(nearestParent),
    path.relative(nearestParent, resolvedStoreRoot)
  );

  const gitRootContainsStore = (gitRoot: string): string | null => {
    const normalizedGitRoot = FileSystemUtils.canonicalizeExistingPath(gitRoot);
    const relative = path.relative(normalizedGitRoot, comparableStoreRoot);
    return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative)
      ? normalizedGitRoot
      : null;
  };

  try {
    const { stdout } = await execFileAsync('git', [
      '-C',
      nearestParent,
      'rev-parse',
      '--show-toplevel',
    ]);
    return gitRootContainsStore(stdout.trim());
  } catch {
    let current = nearestParent;
    while (true) {
      if (await isGitRepositoryAtRoot(current)) {
        return gitRootContainsStore(current);
      }

      const parent = path.dirname(current);
      if (parent === current) return null;
      current = parent;
    }
  }
}

async function assertSetupPathIsNotNestedInGitRepo(
  storeRoot: string,
  options: { allowInsideGitRepository?: boolean }
): Promise<void> {
  if (options.allowInsideGitRepository) return;

  const containingGitRoot = await findContainingGitRepositoryRoot(storeRoot);
  if (!containingGitRoot) return;

  throw new ContextStoreError(
    `context store setup のパスは別の Git リポジトリ内にあります: ${containingGitRoot}`,
    'context_store_setup_inside_git_repo',
    {
      target: 'context_store.root',
      fix: 'OpenSpec 管理下の場所を選ぶか、その Git リポジトリ外のパスを選んでください。この場所を使う場合は対話モードで setup を再実行して確認してください。',
    }
  );
}

async function initGitRepository(storeRoot: string): Promise<boolean> {
  if (await isGitRepositoryAtRoot(storeRoot)) {
    return false;
  }

  try {
    await execFileAsync('git', ['init'], { cwd: storeRoot });
  } catch (error) {
    throw new ContextStoreError(
      `Git リポジトリの初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      'context_store_git_init_failed',
      {
        target: 'context_store.git',
        fix: 'Git をインストールするか、--no-init-git を付けて setup を再実行してください。',
      }
    );
  }

  return true;
}

function expandUserPath(inputPath: string): string {
  const trimmed = inputPath.trim();
  if (trimmed === '~') return os.homedir();
  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    return path.join(os.homedir(), trimmed.slice(2));
  }

  return trimmed;
}

function resolveSetupRoot(id: string, inputPath: string | undefined): string {
  if (inputPath !== undefined && inputPath.trim().length === 0) {
    throw new ContextStoreError('空ではない --path の値を指定してください。', 'context_store_path_required', {
      target: 'context_store.root',
      fix: `openspec context-store setup ${id} --path /path/to/context-store`,
    });
  }

  if (inputPath !== undefined) {
    return path.resolve(expandUserPath(inputPath));
  }

  return getDefaultContextStoreRoot(id);
}

function resolveRegisterRoot(inputPath: string | undefined): string {
  if (inputPath === undefined || inputPath.trim().length === 0) {
    throw new ContextStoreError('context store のパスを指定してください。', 'context_store_path_required', {
      target: 'context_store.root',
      fix: 'openspec context-store register /path/to/context-store',
    });
  }

  return path.resolve(expandUserPath(inputPath));
}

function inferStoreIdFromPath(storeRoot: string): string {
  return validateContextStoreId(path.basename(storeRoot));
}

function mutationPayload(
  id: string,
  storeRoot: string,
  git: { isRepository: boolean; initialized: boolean },
  createdFiles: string[]
): ContextStoreMutationResult {
  return {
    store: {
      id,
      root: storeRoot,
      metadataPath: getContextStoreMetadataPath(storeRoot),
    },
    registryCommit: {
      path: getContextStoreRegistryPath(),
    },
    git: {
      isRepository: git.isRepository,
      initialized: git.initialized,
    },
    createdArtifacts: createdFiles,
  };
}

async function prepareSetupPlan(
  input: Pick<SetupContextStoreInput, 'id' | 'path' | 'allowInsideGitRepository'>
): Promise<ContextStoreSetupPlan> {
  const id = validateContextStoreId(input.id ?? '');
  const storeRoot = resolveSetupRoot(id, input.path);
  const kind = await pathKind(storeRoot);

  if (kind === 'file' || kind === 'other') {
    throw new ContextStoreError(
      `context store setup のパスはディレクトリではありません: ${storeRoot}`,
      'context_store_setup_path_not_directory',
      {
        target: 'context_store.root',
        fix: '空のディレクトリを選ぶか、--path を省略して OpenSpec 管理下の context-store 位置を使ってください。',
      }
    );
  }

  // Context stores may be Git-backed, but creating one inside an implementation
  // repo is almost always an accidental nested-repo setup.
  await assertSetupPathIsNotNestedInGitRepo(storeRoot, {
    allowInsideGitRepository: input.allowInsideGitRepository,
  });

  let metadata: Awaited<ReturnType<typeof readStoreMetadataForOperation>> = null;
  let backend: ContextStoreGitBackendConfig | undefined;

  if (kind === 'directory') {
    metadata = await readStoreMetadataForOperation(storeRoot);

    if (metadata) {
      if (metadata.id !== id) {
        throw new ContextStoreError(
          `context store metadata id '${metadata.id}' は要求された id '${id}' と一致しません。`,
          'context_store_metadata_id_mismatch',
          {
            target: 'context_store.metadata',
            fix: `id '${metadata.id}' を使うか、別の setup パスを選んでください。`,
          }
        );
      }
    } else if (!(await isDirectoryEmpty(storeRoot))) {
      throw new ContextStoreError(
        'context store setup は、空ではないフォルダの初期化にはまだ対応していません。',
        'context_store_setup_non_empty_directory',
        {
          target: 'context_store.root',
          fix: '空のフォルダを作成するか、既存の context store には context-store register を使ってください。',
        }
      );
    }

    backend = await resolveGitContextStoreBackendConfig({ localPath: storeRoot });
  }

  const registry = await readContextStoreRegistryState();
  const conflictBackend = backend ?? {
    type: 'git' as const,
    local_path: FileSystemUtils.canonicalizeExistingPath(storeRoot),
  };

  assertNoRegisteredStoreConflict(registry, id, conflictBackend);

  return {
    id,
    storeRoot,
    kind,
    registry,
    ...(backend ? { backend } : {}),
  };
}

export async function prepareContextStoreSetup(
  input: Pick<SetupContextStoreInput, 'id' | 'path' | 'allowInsideGitRepository'>
): Promise<PreparedContextStoreSetup> {
  const plan = await prepareSetupPlan(input);

  return {
    id: plan.id,
    root: plan.storeRoot,
    rootKind: plan.kind,
    registry: plan.registry,
    ...(plan.backend ? { backend: plan.backend } : {}),
  };
}

export async function setupPreparedContextStore(
  prepared: PreparedContextStoreSetup,
  input: Pick<SetupContextStoreInput, 'initGit'> = {}
): Promise<ContextStoreMutationResult> {
  const plan: ContextStoreSetupPlan = {
    id: prepared.id,
    storeRoot: prepared.root,
    kind: prepared.rootKind,
    registry: prepared.registry,
    ...(prepared.backend ? { backend: prepared.backend } : {}),
  };
  const { id, storeRoot, kind, registry } = plan;
  let { backend } = plan;
  const createdFiles: string[] = [];

  const initGit = input.initGit ?? false;

  if (kind === 'missing') {
    await fs.mkdir(storeRoot, { recursive: true });
  }

  try {
    backend ??= await resolveGitContextStoreBackendConfig({ localPath: storeRoot });
    assertNoRegisteredStoreConflict(registry, id, backend);

    const gitInitialized = initGit ? await initGitRepository(storeRoot) : false;
    const registered = await commitContextStoreRegistration({
      id,
      backend,
      writeMetadataIfMissing: true,
    });
    if (registered.metadataCreated) {
      createdFiles.push('.openspec-store/store.yaml');
    }
    const isRepository = await isGitRepositoryAtRoot(registered.storeRoot);

    return mutationPayload(id, registered.storeRoot, {
      isRepository,
      initialized: gitInitialized,
    }, createdFiles);
  } catch (error) {
    if (kind === 'missing') {
      await fs.rm(storeRoot, { recursive: true, force: true });
    }

    throw error;
  }
}

export async function setupContextStore(
  input: SetupContextStoreInput
): Promise<ContextStoreMutationResult> {
  return setupPreparedContextStore(await prepareContextStoreSetup(input), {
    initGit: input.initGit,
  });
}

export async function registerExistingContextStore(
  input: RegisterExistingContextStoreInput
): Promise<ContextStoreMutationResult> {
  const storeRoot = resolveRegisterRoot(input.path);
  const kind = await pathKind(storeRoot);

  if (kind === 'missing') {
    throw new ContextStoreError(
      `context store のパスが存在しません: ${storeRoot}`,
      'context_store_path_missing',
      {
        target: 'context_store.root',
        fix: '登録前に context store フォルダを clone または作成してください。',
      }
    );
  }

  if (kind !== 'directory') {
    throw new ContextStoreError(
      `context store のパスはディレクトリではありません: ${storeRoot}`,
      'context_store_path_not_directory',
      {
        target: 'context_store.root',
        fix: '既存の context store ディレクトリを指定してください。',
      }
    );
  }

  const metadata = await readStoreMetadataForOperation(storeRoot);
  const explicitId = input.id !== undefined ? validateContextStoreId(input.id) : undefined;

  if (metadata && explicitId !== undefined && metadata.id !== explicitId) {
    throw new ContextStoreError(
      `context store metadata id '${metadata.id}' は --id '${explicitId}' と一致しません。`,
      'context_store_metadata_id_mismatch',
      {
        target: 'context_store.id',
        fix: `--id ${metadata.id} を使うか、別のフォルダを登録してください。`,
      }
    );
  }

  const id = metadata?.id ?? explicitId ?? inferStoreIdFromPath(storeRoot);
  const backend = await resolveGitContextStoreBackendConfig({ localPath: storeRoot });
  const registry = await readContextStoreRegistryState();
  assertNoRegisteredStoreConflict(registry, id, backend);
  const createdFiles: string[] = [];

  const registered = await commitContextStoreRegistration({
    id,
    backend,
    writeMetadataIfMissing: true,
  });
  if (registered.metadataCreated) {
    createdFiles.push('.openspec-store/store.yaml');
  }

  return mutationPayload(id, registered.storeRoot, {
    isRepository: await isGitRepositoryAtRoot(registered.storeRoot),
    initialized: false,
  }, createdFiles);
}

function cleanupStoreOutput(id: string, storeRoot: string): ContextStoreInfo {
  return {
    id,
    root: storeRoot,
    metadataPath: getContextStoreMetadataPath(storeRoot),
  };
}

export async function prepareContextStoreCleanup(
  input: CleanupContextStoreInput
): Promise<PreparedContextStoreCleanup> {
  const id = validateContextStoreId(input.id);
  const entry = await getRegisteredContextStore({
    id,
    globalDataDir: input.globalDataDir,
  });

  return {
    ...cleanupStoreOutput(entry.id, entry.storeRoot),
    backend: entry.backend,
    ...(input.globalDataDir ? { globalDataDir: input.globalDataDir } : {}),
  };
}

export async function unregisterContextStore(
  input: CleanupContextStoreInput
): Promise<ContextStoreCleanupResult> {
  const target = await prepareContextStoreCleanup(input);
  const removed = await unregisterContextStoreRegistration({
    id: target.id,
    expectedBackend: target.backend,
    globalDataDir: target.globalDataDir,
  });

  return {
    store: cleanupStoreOutput(removed.id, removed.storeRoot),
    registryCommit: {
      path: getContextStoreRegistryPath({ globalDataDir: target.globalDataDir }),
      removed: true,
    },
    files: {
      deleted: false,
      leftOnDisk: removed.storeRoot,
    },
    diagnostics: [],
  };
}

async function assertSafeToDeleteContextStoreRoot(storeRoot: string, id: string): Promise<{
  exists: boolean;
}> {
  const kind = await pathKind(storeRoot);

  if (kind === 'missing') {
    return { exists: false };
  }

  if (kind !== 'directory') {
    throw new ContextStoreError(
      `context store のパスはディレクトリではありません: ${storeRoot}`,
      'context_store_remove_path_not_directory',
      {
        target: 'context_store.root',
        fix: 'このローカル登録だけを解除するなら context-store unregister を実行してください。',
      }
    );
  }

  const metadata = await readStoreMetadataForOperation(storeRoot);
  if (!metadata) {
    throw new ContextStoreError(
      'context-store metadata がないフォルダは context store remove では削除できません。',
      'context_store_remove_metadata_missing',
      {
        target: 'context_store.metadata',
        fix: 'このローカル登録だけを解除するなら context-store unregister を実行してください。',
      }
    );
  }

  if (metadata.id !== id) {
    throw new ContextStoreError(
      `context store metadata id '${metadata.id}' は要求された id '${id}' と一致しません。`,
      'context_store_metadata_id_mismatch',
      {
        target: 'context_store.metadata',
        fix: 'レジストリを修復するか、このフォルダを削除せず context-store unregister を実行してください。',
      }
    );
  }

  return { exists: true };
}

export async function removeContextStore(
  target: PreparedContextStoreCleanup
): Promise<ContextStoreCleanupResult> {
  const id = validateContextStoreId(target.id);
  const diagnostics: ContextStoreDiagnostic[] = [];
  let deleted = false;

  const removed = await unregisterContextStoreRegistration({
    id,
    expectedBackend: target.backend,
    globalDataDir: target.globalDataDir,
    beforeCommit: async (entry) => {
      const safeTarget = await assertSafeToDeleteContextStoreRoot(entry.storeRoot, id);
      if (!safeTarget.exists) {
        diagnostics.push(makeContextStoreDiagnostic(
          'warning',
          'context_store_root_missing',
          'context store のファイルは既に存在しません。',
          {
            target: 'context_store.root',
          }
        ));
        return;
      }

      await fs.rm(entry.storeRoot, { recursive: true, force: true });
      deleted = true;
    },
  });

  return {
    store: cleanupStoreOutput(removed.id, removed.storeRoot),
    registryCommit: {
      path: getContextStoreRegistryPath({ globalDataDir: target.globalDataDir }),
      removed: true,
    },
    files: {
      deleted,
      ...(deleted ? { deletedPath: removed.storeRoot } : {}),
    },
    diagnostics,
  };
}

export async function listContextStores(): Promise<ContextStoreListResult> {
  const entries = await listRegisteredContextStores();

  return {
    stores: entries.map((entry) => ({
      id: entry.id,
      root: entry.storeRoot,
    })),
  };
}

function doctorStatusForError(
  error: unknown,
  code: string,
  target: string,
  fix?: string
): ContextStoreDiagnostic {
  if (error instanceof ContextStoreError) {
    return error.diagnostic;
  }

  return makeContextStoreDiagnostic(
    'error',
    code,
    error instanceof Error ? error.message : String(error),
    {
      target,
      ...(fix ? { fix } : {}),
    }
  );
}

async function inspectContextStore(entry: {
  id: string;
  backend: ContextStoreGitBackendConfig;
}): Promise<ContextStoreInspection> {
  const root = getStoreRootForBackend(entry.backend);
  const metadataPath = getContextStoreMetadataPath(root);
  const diagnostics: ContextStoreDiagnostic[] = [];
  const kind = await pathKind(root);
  let metadata: ContextStoreInspection['metadata'] = {
    present: null,
    valid: null,
  };
  let git: ContextStoreInspection['git'] = {
    isRepository: null,
  };

  if (kind === 'missing') {
    diagnostics.push(makeContextStoreDiagnostic(
      'error',
      'context_store_root_missing',
      'context store の場所が存在しません。',
      {
        target: 'context_store.root',
        fix: `openspec context-store register /path/to/${entry.id} --id ${entry.id} を実行してください。`,
      }
    ));
  } else if (kind !== 'directory') {
    diagnostics.push(makeContextStoreDiagnostic(
      'error',
      'context_store_root_not_directory',
      'context store の場所はディレクトリではありません。',
      {
        target: 'context_store.root',
        fix: 'この context store にはディレクトリパスを登録してください。',
      }
    ));
  } else {
    try {
      const parsed = await readOptionalContextStoreMetadataState(root);
      if (!parsed) {
        metadata = { present: false, valid: false };
        diagnostics.push(makeContextStoreDiagnostic(
          'error',
          'context_store_metadata_missing',
          'context store metadata が見つかりません。',
          {
            target: 'context_store.metadata',
            fix: `${metadataPath} を作成するか、context-store register を再実行してください。`,
          }
        ));
      } else if (parsed.id !== entry.id) {
        metadata = { present: true, valid: false, id: parsed.id };
        diagnostics.push(makeContextStoreDiagnostic(
          'error',
          'context_store_metadata_id_mismatch',
          `context store metadata id '${parsed.id}' はレジストリ上の ID '${entry.id}' と一致しません。`,
          {
            target: 'context_store.metadata',
            fix: 'ID が一致するように、ローカルレジストリまたは store metadata を修復してください。',
          }
        ));
      } else {
        metadata = { present: true, valid: true, id: parsed.id };
      }
    } catch (error) {
      metadata = { present: true, valid: false };
      diagnostics.push(doctorStatusForError(
        error,
        'context_store_metadata_invalid',
        'context_store.metadata',
        `${metadataPath} を修復してください。`
      ));
    }

    git = {
      isRepository: await isGitRepositoryAtRoot(root),
    };
  }

  return {
    id: entry.id,
    root,
    metadataPath,
    metadata,
    git,
    diagnostics,
  };
}

export async function doctorContextStores(id?: string): Promise<ContextStoreDoctorResult> {
  const selectedId = id !== undefined ? validateContextStoreId(id) : undefined;
  const registry = await readContextStoreRegistryState();

  if (!registry) {
    if (selectedId !== undefined) {
      throw new ContextStoreError(`不明な context store '${selectedId}' です。`, 'context_store_not_found', {
        target: 'context_store.id',
        fix: 'openspec context-store list で登録済み store を確認してください。',
      });
    }

    return { stores: [], diagnostics: [] };
  }

  const entries = listContextStoreRegistryEntries(registry);
  const selected = selectedId
    ? entries.filter((entry) => entry.id === selectedId)
    : entries;

  if (selectedId && selected.length === 0) {
    throw new ContextStoreError(`不明な context store '${selectedId}' です。`, 'context_store_not_found', {
      target: 'context_store.id',
      fix: 'openspec context-store list で登録済み store を確認してください。',
    });
  }

  return {
    stores: await Promise.all(selected.map(inspectContextStore)),
    diagnostics: [],
  };
}

export function normalizeContextStorePathForComparison(targetPath: string): string {
  return FileSystemUtils.canonicalizeExistingPath(targetPath);
}
