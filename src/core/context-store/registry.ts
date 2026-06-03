import * as fs from 'node:fs/promises';

import {
  getContextStoreMetadataPath,
  getContextStoreMetadataDir,
  listContextStoreRegistryEntries,
  readContextStoreRegistryState,
  readOptionalContextStoreMetadataState,
  resolveGitContextStoreBackendConfig,
  updateContextStoreRegistryState,
  validateContextStoreId,
  writeContextStoreMetadataState,
  type ContextStoreBackendConfig,
  type ContextStoreGitBackendConfig,
  type ContextStorePathOptions,
  type ContextStoreRegistryEntry,
  type ContextStoreRegistryState,
} from './foundation.js';
import { ContextStoreError } from './errors.js';
import { FileSystemUtils } from '../../utils/file-system.js';

export interface RegisterContextStoreInput extends ContextStorePathOptions {
  id: string;
  localPath: string;
  remote?: string;
  branch?: string;
  cwd?: string;
}

export interface ResolveRegisteredContextStoreInput extends ContextStorePathOptions {
  id: string;
}

export interface GetRegisteredContextStoreInput extends ResolveRegisteredContextStoreInput {
  expectedBackend?: ContextStoreGitBackendConfig;
}

export interface UnregisterContextStoreInput extends ContextStorePathOptions {
  id: string;
  expectedBackend?: ContextStoreGitBackendConfig;
  beforeCommit?: (entry: RegisteredContextStoreEntry) => Promise<void>;
}

export type ListRegisteredContextStoresOptions = ContextStorePathOptions;

export interface RegisteredContextStoreEntry extends ContextStoreRegistryEntry {
  storeRoot: string;
}

export interface ResolvedContextStore {
  id: string;
  storeRoot: string;
  backend: ContextStoreGitBackendConfig;
}

export interface ContextStoreRegistrationCommit extends ResolvedContextStore {
  metadataCreated: boolean;
}

export interface CommitContextStoreRegistrationInput extends ContextStorePathOptions {
  id: string;
  backend: ContextStoreGitBackendConfig;
  writeMetadataIfMissing: boolean;
}

export function getStoreRootForBackend(backend: ContextStoreBackendConfig): string {
  switch (backend.type) {
    case 'git':
      return backend.local_path;
  }
}

function normalizePathForComparison(targetPath: string): string {
  try {
    return FileSystemUtils.canonicalizeExistingPath(targetPath);
  } catch {
    return targetPath;
  }
}

export function assertNoRegisteredStoreConflict(
  registry: ContextStoreRegistryState | null,
  id: string,
  backend: ContextStoreGitBackendConfig
): void {
  const nextPath = normalizePathForComparison(getStoreRootForBackend(backend));

  for (const entry of listContextStoreRegistryEntries(registry ?? { version: 1, stores: {} })) {
    const entryPath = normalizePathForComparison(getStoreRootForBackend(entry.backend));

    if (entry.id === id && entryPath === nextPath) {
      continue;
    }

    if (entry.id === id) {
      throw new ContextStoreError(
        `Context store '${id}' は既に ${getStoreRootForBackend(entry.backend)} に登録されています。`,
        'context_store_id_conflict',
        {
          target: 'context_store.id',
          fix: '既存の登録を使うか、別の context store id を選んでください。',
        }
      );
    }

    if (entryPath === nextPath) {
      throw new ContextStoreError(
        `Context store path は既に '${entry.id}' として登録されています。`,
        'context_store_path_conflict',
        {
          target: 'context_store.root',
          fix: `既存の '${entry.id}' 登録を使うか、別の path を選んでください。`,
        }
      );
    }
  }
}

function withRegisteredStore(
  registry: ContextStoreRegistryState | null,
  id: string,
  backend: ContextStoreGitBackendConfig
): ContextStoreRegistryState {
  assertNoRegisteredStoreConflict(registry, id, backend);

  const stores = {
    ...(registry?.stores ?? {}),
    [id]: {
      backend,
    },
  };

  return {
    version: 1,
    stores: Object.fromEntries(
      Object.entries(stores).sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    ),
  };
}

function getRegisteredStoreOrThrow(
  registry: ContextStoreRegistryState | null,
  id: string
): ContextStoreRegistryEntry {
  const entry = registry?.stores[id];
  if (!entry) {
    throw new ContextStoreError(`不明な context store '${id}' です`, 'context_store_not_found', {
      target: 'context_store.id',
      fix: 'openspec context-store list で登録済み store を確認してください。',
    });
  }

  return {
    id,
    backend: entry.backend,
  };
}

function contextStoreBackendsMatch(
  actual: ContextStoreGitBackendConfig,
  expected: ContextStoreGitBackendConfig
): boolean {
  return (
    actual.type === expected.type &&
    normalizePathForComparison(actual.local_path) ===
      normalizePathForComparison(expected.local_path) &&
    actual.remote === expected.remote &&
    actual.branch === expected.branch
  );
}

function assertExpectedRegisteredBackend(
  id: string,
  actual: ContextStoreGitBackendConfig,
  expected: ContextStoreGitBackendConfig | undefined
): void {
  if (!expected || contextStoreBackendsMatch(actual, expected)) return;

  throw new ContextStoreError(
    `cleanup が完了する前に context store '${id}' が変更されました。`,
    'context_store_registry_changed',
    {
      target: 'context_store.registry',
      fix: '現在の context-store registration を確認してから cleanup コマンドを再試行してください。',
    }
  );
}

function withoutRegisteredStore(
  registry: ContextStoreRegistryState | null,
  id: string,
  expectedBackend?: ContextStoreGitBackendConfig
): { next: ContextStoreRegistryState; removed: ContextStoreRegistryEntry } {
  const removed = getRegisteredStoreOrThrow(registry, id);
  assertExpectedRegisteredBackend(id, removed.backend, expectedBackend);
  const stores = { ...(registry?.stores ?? {}) };
  delete stores[id];

  return {
    removed,
    next: {
      version: 1,
      stores: Object.fromEntries(
        Object.entries(stores).sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      ),
    },
  };
}

async function ensureStoreMetadata(
  storeRoot: string,
  id: string,
  options: { writeIfMissing: boolean }
): Promise<boolean> {
  const metadata = await readOptionalContextStoreMetadataState(storeRoot);

  if (!metadata) {
    if (!options.writeIfMissing) {
      throw new ContextStoreError(
        `登録済み context store '${id}' の metadata が ${getContextStoreMetadataPath(storeRoot)} にありません`,
        'context_store_metadata_missing',
        {
          target: 'context_store.metadata',
          fix: `${getContextStoreMetadataPath(storeRoot)} を作成するか、context-store register を再実行してください。`,
        }
      );
    }

    await writeContextStoreMetadataState(storeRoot, {
      version: 1,
      id,
    });
    return true;
  }

  if (metadata.id !== id) {
    throw new ContextStoreError(
      `context store metadata id '${metadata.id}' は登録済み id '${id}' と一致しません`,
      'context_store_metadata_id_mismatch',
      {
        target: 'context_store.metadata',
        fix: 'id が一致するように、ローカル registry または store metadata を修復してください。',
      }
    );
  }

  return false;
}

export async function commitContextStoreRegistration(
  input: CommitContextStoreRegistrationInput
): Promise<ContextStoreRegistrationCommit> {
  const id = validateContextStoreId(input.id);
  const backend = input.backend;
  const storeRoot = getStoreRootForBackend(backend);

  let metadataCreated = false;

  try {
    metadataCreated = await ensureStoreMetadata(storeRoot, id, {
      writeIfMissing: input.writeMetadataIfMissing,
    });
    await updateContextStoreRegistryState(
      (registry) => withRegisteredStore(registry, id, backend),
      { globalDataDir: input.globalDataDir }
    );
  } catch (error) {
    if (metadataCreated) {
      await fs.rm(getContextStoreMetadataPath(storeRoot), { force: true });
      await fs.rmdir(getContextStoreMetadataDir(storeRoot)).catch(() => undefined);
    }

    throw error;
  }

  return {
    id,
    storeRoot,
    backend,
    metadataCreated,
  };
}

export async function registerContextStore(
  input: RegisterContextStoreInput
): Promise<ResolvedContextStore> {
  const id = validateContextStoreId(input.id);
  const backend = await resolveGitContextStoreBackendConfig(
    {
      localPath: input.localPath,
      ...(input.remote !== undefined ? { remote: input.remote } : {}),
      ...(input.branch !== undefined ? { branch: input.branch } : {}),
    },
    input.cwd
  );
  const storeRoot = getStoreRootForBackend(backend);

  const committed = await commitContextStoreRegistration({
    id,
    backend,
    writeMetadataIfMissing: true,
    ...(input.globalDataDir ? { globalDataDir: input.globalDataDir } : {}),
  });
  return {
    id: committed.id,
    storeRoot: committed.storeRoot,
    backend: committed.backend,
  };
}

export async function listRegisteredContextStores(
  options: ListRegisteredContextStoresOptions = {}
): Promise<RegisteredContextStoreEntry[]> {
  const registry = await readContextStoreRegistryState(options);

  if (!registry) {
    return [];
  }

  return listContextStoreRegistryEntries(registry).map((entry) => ({
    ...entry,
    storeRoot: getStoreRootForBackend(entry.backend),
  }));
}

export async function getRegisteredContextStore(
  input: GetRegisteredContextStoreInput
): Promise<RegisteredContextStoreEntry> {
  const id = validateContextStoreId(input.id);
  const registry = await readContextStoreRegistryState({
    globalDataDir: input.globalDataDir,
  });
  const entry = getRegisteredStoreOrThrow(registry, id);
  assertExpectedRegisteredBackend(id, entry.backend, input.expectedBackend);

  return {
    ...entry,
    storeRoot: getStoreRootForBackend(entry.backend),
  };
}

export async function unregisterContextStoreRegistration(
  input: UnregisterContextStoreInput
): Promise<RegisteredContextStoreEntry> {
  const id = validateContextStoreId(input.id);
  let removed: ContextStoreRegistryEntry | undefined;

  await updateContextStoreRegistryState(
    async (registry) => {
      const result = withoutRegisteredStore(registry, id, input.expectedBackend);
      const removedEntry = {
        ...result.removed,
        storeRoot: getStoreRootForBackend(result.removed.backend),
      };
      await input.beforeCommit?.(removedEntry);
      removed = result.removed;
      return result.next;
    },
    { globalDataDir: input.globalDataDir }
  );

  if (!removed) {
    throw new ContextStoreError(`不明な context store '${id}' です`, 'context_store_not_found', {
      target: 'context_store.id',
      fix: 'openspec context-store list で登録済み store を確認してください。',
    });
  }

  return {
    ...removed,
    storeRoot: getStoreRootForBackend(removed.backend),
  };
}

export async function resolveRegisteredContextStore(
  input: ResolveRegisteredContextStoreInput
): Promise<ResolvedContextStore> {
  const id = validateContextStoreId(input.id);
  const registry = await readContextStoreRegistryState({
    globalDataDir: input.globalDataDir,
  });

  if (!registry) {
    throw new ContextStoreError('context store registry が見つかりません', 'no_context_store_registry', {
      target: 'context_store.id',
      fix: '--store を使う前に context store を登録するか、--store-path <path> を指定してください。',
    });
  }

  const entry = getRegisteredStoreOrThrow(registry, id);
  const backend = entry.backend;
  const storeRoot = getStoreRootForBackend(backend);
  await ensureStoreMetadata(storeRoot, id, { writeIfMissing: false });

  return {
    id,
    storeRoot,
    backend,
  };
}
