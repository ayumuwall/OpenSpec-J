import * as os from 'node:os';
import { asErrorMessage, emitFailure, printJson } from './shared-output.js';
import * as path from 'node:path';

import {
  StoreError,
  doctorStores,
  listStores,
  prepareStoreSetup,
  prepareStoreCleanup,
  registerExistingStore,
  removeStore,
  resolveSetupGitEnabled,
  setupPreparedStore,
  unregisterStore,
  validateStoreId,
  type StoreCleanupResult,
  type StoreDiagnostic,
  type StoreDoctorResult,
  type StoreInfo,
  type StoreInspection,
  type StoreListResult,
  type StoreMutationResult,
  type SetupStoreInput,
} from '../core/store/index.js';
import { isInteractive } from '../utils/interactive.js';

export interface StoreSetupOptions {
  path?: string;
  initGit?: boolean;
  json?: boolean;
  remote?: string;
}

export interface StoreRegisterOptions {
  id?: string;
  yes?: boolean;
  json?: boolean;
}

export interface StoreRemoveOptions {
  yes?: boolean;
  json?: boolean;
}

export interface StoreJsonOptions {
  json?: boolean;
}

interface ResolvedStoreSetupInput extends SetupStoreInput {
  id: string;
}

interface StoreOutput {
  id: string;
  root: string;
  metadata_path?: string;
}

interface StoreMutationOutput {
  store: StoreOutput | null;
  registry: {
    path: string;
    registered: boolean;
    already_registered: boolean;
  } | null;
  git: {
    is_repository: boolean;
    initialized: boolean;
    committed: boolean;
  } | null;
  created_files: string[];
  status: StoreDiagnostic[];
}

interface StoreCleanupOutput {
  store: StoreOutput | null;
  registry: {
    path: string;
    removed: boolean;
  } | null;
  files: {
    deleted: boolean;
    deleted_path: string | null;
    left_on_disk: string | null;
  } | null;
  status: StoreDiagnostic[];
}

interface StoreListOutput {
  stores: StoreOutput[];
  status: StoreDiagnostic[];
}

type OpenSpecRootOutput = Omit<StoreInspection['openspecRoot'], 'diagnostics'> & {
  status: StoreDiagnostic[];
};

interface StoreDoctorStoreOutput extends StoreOutput {
  openspec_root: OpenSpecRootOutput;
  metadata: StoreInspection['metadata'];
  git: {
    is_repository: boolean | null;
    has_commits: boolean | null;
    has_uncommitted_changes: boolean | null;
    has_remote: boolean | null;
    origin_url: string | null;
  };
  status: StoreDiagnostic[];
}

interface StoreDoctorOutput {
  stores: StoreDoctorStoreOutput[];
  status: StoreDiagnostic[];
}





function toStoreOutput(store: StoreInfo): StoreOutput {
  return {
    id: store.id,
    root: store.root,
    ...(store.metadataPath ? { metadata_path: store.metadataPath } : {}),
  };
}

function toMutationOutput(result: StoreMutationResult): StoreMutationOutput {
  return {
    store: toStoreOutput(result.store),
    registry: {
      path: result.registryCommit.path,
      registered: result.registryCommit.registered,
      already_registered: result.registryCommit.alreadyRegistered,
    },
    git: {
      is_repository: result.git.isRepository,
      initialized: result.git.initialized,
      committed: result.git.committed,
    },
    created_files: result.createdArtifacts,
    status: result.diagnostics,
  };
}

function toCleanupOutput(result: StoreCleanupResult): StoreCleanupOutput {
  return {
    store: toStoreOutput(result.store),
    registry: {
      path: result.registryCommit.path,
      removed: result.registryCommit.removed,
    },
    files: {
      deleted: result.files.deleted,
      deleted_path: result.files.deletedPath ?? null,
      left_on_disk: result.files.leftOnDisk ?? null,
    },
    status: result.diagnostics,
  };
}

function toListOutput(result: StoreListResult): StoreListOutput {
  return {
    stores: result.stores.map(toStoreOutput),
    status: [],
  };
}

function toOpenSpecRootOutput(root: StoreInspection['openspecRoot']): OpenSpecRootOutput {
  return {
    present: root.present,
    config: root.config,
    specs: root.specs,
    changes: root.changes,
    archive: root.archive,
    healthy: root.healthy,
    status: root.diagnostics,
  };
}

function toDoctorStoreOutput(store: StoreInspection): StoreDoctorStoreOutput {
  return {
    ...toStoreOutput(store),
    openspec_root: toOpenSpecRootOutput(store.openspecRoot),
    metadata: store.metadata,
    git: {
      is_repository: store.git.isRepository,
      has_commits: store.git.hasCommits,
      has_uncommitted_changes: store.git.hasUncommittedChanges,
      has_remote: store.git.hasRemote,
      origin_url: store.git.originUrl,
    },
    status: store.diagnostics,
  };
}

function toDoctorOutput(result: StoreDoctorResult): StoreDoctorOutput {
  return {
    stores: result.stores.map(toDoctorStoreOutput),
    status: result.diagnostics,
  };
}





function formatPathForHuman(targetPath: string): string {
  const home = os.homedir();
  const normalizedHome = path.resolve(home);
  const normalizedTarget = path.resolve(targetPath);

  if (normalizedTarget === normalizedHome) return '~';
  if (normalizedTarget.startsWith(`${normalizedHome}${path.sep}`)) {
    return `~${path.sep}${path.relative(normalizedHome, normalizedTarget)}`;
  }

  return targetPath;
}

async function promptStoreId(): Promise<string> {
  const { input } = await import('@inquirer/prompts');

  return input({
    message: 'ストア名',
    required: true,
    validate(value: string) {
      try {
        validateStoreId(value);
        return true;
      } catch (error) {
        return asErrorMessage(error);
      }
    },
  });
}

async function promptStorePath(id: string): Promise<string> {
  const { input } = await import('@inquirer/prompts');
  // Suggest a visible, user-owned location — never the managed XDG data dir.
  const defaultPath = ['~', 'openspec', id].join('/');

  return input({
    message: 'ストアの保存先を指定してください。',
    default: defaultPath,
    prefill: 'editable',
    required: true,
  });
}

async function resolveSetupInput(
  id: string | undefined,
  options: StoreSetupOptions
): Promise<ResolvedStoreSetupInput> {
  const interactive = !options.json && isInteractive();

  if (!id && !interactive) {
    throw new StoreError(
      'ストア名を指定してください。',
      'store_setup_id_required',
      {
        target: 'store.id',
        fix: 'openspec store setup <id> --path ~/openspec/<id> --json',
      }
    );
  }

  if (options.path === undefined && !interactive) {
    throw new StoreError(
      'このストアを配置するフォルダーを --path で指定してください。',
      'store_setup_path_required',
      {
        target: 'store.root',
        fix: `openspec store setup ${id ?? '<id>'} --path ~/openspec/${id ?? '<id>'}`,
      }
    );
  }

  const resolvedId = id ? validateStoreId(id) : await promptStoreId();
  const promptedPath = options.path === undefined
    ? await promptStorePath(resolvedId)
    : undefined;

  return {
    id: resolvedId,
    path: options.path ?? promptedPath,
    ...(options.remote !== undefined ? { remote: options.remote } : {}),
  };
}

async function prepareSetupInput(
  input: ResolvedStoreSetupInput,
  options: StoreSetupOptions
) {
  return prepareStoreSetup({
    ...input,
    ...(options.initGit !== undefined ? { initGit: options.initGit } : {}),
  });
}

async function confirmSetup(
  prepared: Awaited<ReturnType<typeof prepareStoreSetup>>,
  initGit: boolean
): Promise<void> {
  const { confirm } = await import('@inquirer/prompts');

  console.log('');
  console.log('OpenSpec は次の内容を作成します:');
  console.log('');
  console.log(`  ストア: ${prepared.id}`);
  console.log(`  場所: ${formatPathForHuman(prepared.root)}`);
  console.log(`  Git: ${initGit ? '初期化する' : '初期化しない'}`);
  console.log('');

  const confirmed = await confirm({
    message: 'このストアを作成しますか？',
    default: true,
  });

  if (!confirmed) {
    throw new StoreError(
      'ストア作成をキャンセルしました。',
      'store_setup_cancelled',
      {
        target: 'store.root',
        fix: '準備ができたら setup を再実行してください。',
      }
    );
  }
}

async function confirmRemove(id: string, root: string, options: StoreRemoveOptions): Promise<void> {
  if (options.yes) return;

  if (options.json || !isInteractive()) {
    throw new StoreError(
      '非対話でストアファイルを削除するには --yes を指定してください。',
      'store_remove_confirmation_required',
      {
        target: 'store.root',
        fix: `openspec store remove ${id} --yes`,
      }
    );
  }

  const { confirm } = await import('@inquirer/prompts');
  const confirmed = await confirm({
    message: `ローカルストアフォルダー ${formatPathForHuman(root)} を削除しますか？`,
    default: false,
  });

  if (!confirmed) {
    throw new StoreError(
      'ストア削除をキャンセルしました。',
      'store_remove_cancelled',
      {
        target: 'store.root',
        fix: 'ローカル登録だけを解除したい場合は "openspec store unregister <id>" を実行してください。',
      }
    );
  }
}

function isRegisterIdentityConfirmationError(error: unknown): boolean {
  return (
    error instanceof StoreError &&
    error.diagnostic.code === 'store_register_identity_confirmation_required'
  );
}

async function confirmRegisterConversion(error: unknown): Promise<void> {
  const { confirm } = await import('@inquirer/prompts');
  const confirmed = await confirm({
    message: asErrorMessage(error),
    default: false,
  });

  if (!confirmed) {
    throw new StoreError(
      'ストア登録をキャンセルしました。',
      'store_register_cancelled',
      {
        target: 'store.metadata',
        fix: 'ストア識別メタデータを作成する準備ができたら register を再実行してください。',
      }
    );
  }
}

function printMutationHuman(
  title: string,
  payload: StoreMutationOutput,
  remotes?: { canonical?: string; observed?: string }
): void {
  if (!payload.store || !payload.registry || !payload.git) {
    return;
  }

  console.log(`${title}: ${payload.store.id}`);
  console.log(`場所: ${formatPathForHuman(payload.store.root)}`);
  console.log('OpenSpec ルート: 準備完了');
  console.log(`登録状態: ${payload.registry.already_registered ? '登録済み' : '登録しました'}`);
  for (const status of payload.status) {
    console.log(`${status.severity === 'error' ? '問題' : 'メモ'}: ${status.message}`);
  }
  console.log('');
  console.log('次に、通常の OpenSpec コマンドをこのストアに対して実行します。例:');
  console.log(`  openspec new change <change-id> --store ${payload.store.id}`);
  if (payload.git.is_repository) {
    const shareRemote = remotes?.canonical ?? remotes?.observed;
    console.log(
      shareRemote
        ? `共有方法: チームメイトは ${shareRemote} を clone し、openspec store register <path> を実行します。`
        : '共有方法: 通常の Git リポジトリと同じように commit / push してください。'
    );
  }
}

function printCleanupHuman(title: string, payload: StoreCleanupOutput): void {
  if (!payload.store || !payload.registry || !payload.files) {
    return;
  }

  console.log(`${title}: ${payload.store.id}`);

  if (payload.files.deleted_path) {
    console.log(`削除しました: ${formatPathForHuman(payload.files.deleted_path)}`);
  } else if (payload.files.left_on_disk) {
    console.log(`ファイルは保持しました: ${formatPathForHuman(payload.files.left_on_disk)}`);
  } else if (!payload.files.deleted) {
    console.log(`ファイルは既にありませんでした: ${formatPathForHuman(payload.store.root)}`);
  }

  for (const status of payload.status) {
    console.log(`${status.severity === 'error' ? '問題' : 'メモ'}: ${status.message}`);
  }
}

function printListHuman(payload: StoreListOutput): void {
  if (payload.stores.length === 0) {
    console.log('登録済みのストアはありません。');
    console.log('');
    console.log('次の手順:');
    console.log('  openspec store setup team-context --path ~/openspec/team-context');
    console.log('  openspec store register /path/to/store');
    return;
  }

  console.log(`OpenSpec ストア (${payload.stores.length})`);
  console.log('');
  console.log(`${'ID'.padEnd(16)}場所`);
  for (const store of payload.stores) {
    console.log(`${store.id.padEnd(16)}${store.root}`);
  }
}

function formatMetadataHuman(store: StoreDoctorOutput['stores'][number]): string {
  if (store.metadata.valid) return 'ok';
  if (store.metadata.present === false) return 'なし';
  if (store.metadata.present === null) return '不明';
  return '無効';
}

function formatDoctorGitHuman(store: StoreDoctorOutput['stores'][number]): string {
  if (store.git.is_repository === null) return '不明';
  if (!store.git.is_repository) return '未検出';

  const fact = (value: boolean | null, yes: string, no: string): string =>
    value === null ? '不明' : value ? yes : no;

  return `リポジトリ検出済み (コミット: ${fact(store.git.has_commits, 'あり', 'なし')}, 未コミット変更: ${fact(store.git.has_uncommitted_changes, 'あり', 'なし')}, remote: ${fact(store.git.has_remote, 'あり', 'なし')})`;
}

function formatOpenSpecRootHuman(store: StoreDoctorOutput['stores'][number]): string {
  if (store.openspec_root.healthy) return 'ok';
  if (store.openspec_root.present === false) return 'なし';
  if (store.openspec_root.present === null) return '不明';
  return '未完了';
}

function printDoctorHuman(payload: StoreDoctorOutput): void {
  if (payload.stores.length === 0) {
    console.log('登録済みのストアはありません。');
    return;
  }

  console.log('ストア診断');
  for (const store of payload.stores) {
    console.log('');
    console.log(store.id);
    console.log(`  場所: ${store.root}`);
    console.log(`  OpenSpec ルート: ${formatOpenSpecRootHuman(store)}`);
    console.log(`  メタデータ: ${formatMetadataHuman(store)}`);
    const remoteLine = store.metadata.remote ?? store.git.origin_url;
    if (remoteLine) {
      console.log(`  リモート: ${remoteLine}`);
    }
    console.log(`  Git: ${formatDoctorGitHuman(store)}`);

    if (store.status.length === 0) {
      console.log('  問題: なし');
      continue;
    }

    console.log('  問題:');
    for (const status of store.status) {
      console.log(`    - ${status.message}`);
      if (status.fix) {
        console.log(`      修正: ${status.fix}`);
      }
    }
  }
}

export class StoreCommand {
  async setup(id: string | undefined, options: StoreSetupOptions = {}): Promise<void> {
    try {
      const setupInput = await resolveSetupInput(id, options);
      const prepared = await prepareSetupInput(setupInput, options);
      const initGit = resolveSetupGitEnabled(prepared, options.initGit);
      if (!options.json && isInteractive()) {
        await confirmSetup(prepared, initGit);
      }
      const result = await setupPreparedStore(prepared, { initGit });
      const payload = toMutationOutput(result);

      if (options.json) {
        printJson(payload);
        return;
      }

      printMutationHuman('ストア準備完了', payload, result.remotes);
    } catch (error) {
      this.handleFailure(
        options.json,
        { store: null, registry: null, git: null, created_files: [], status: [] },
        error
      );
    }
  }

  async register(inputPath: string | undefined, options: StoreRegisterOptions = {}): Promise<void> {
    try {
      let result: StoreMutationResult;
      try {
        result = await registerExistingStore({
          path: inputPath,
          id: options.id,
          allowCreateIdentity: options.yes,
        });
      } catch (error) {
        if (!isRegisterIdentityConfirmationError(error) || options.json || !isInteractive()) {
          throw error;
        }

        await confirmRegisterConversion(error);
        result = await registerExistingStore({
          path: inputPath,
          id: options.id,
          allowCreateIdentity: true,
        });
      }

      const payload = toMutationOutput(result);

      if (options.json) {
        printJson(payload);
        return;
      }

      printMutationHuman('ストアを登録しました', payload, result.remotes);
    } catch (error) {
      this.handleFailure(
        options.json,
        { store: null, registry: null, git: null, created_files: [], status: [] },
        error
      );
    }
  }

  async unregister(id: string, options: StoreJsonOptions = {}): Promise<void> {
    try {
      const payload = toCleanupOutput(await unregisterStore({ id }));

      if (options.json) {
        printJson(payload);
        return;
      }

      printCleanupHuman('ストアの登録を解除しました', payload);
    } catch (error) {
      this.handleFailure(
        options.json,
        { store: null, registry: null, files: null, status: [] },
        error
      );
    }
  }

  async remove(id: string, options: StoreRemoveOptions = {}): Promise<void> {
    try {
      const target = await prepareStoreCleanup({ id });
      await confirmRemove(target.id, target.root, options);
      const payload = toCleanupOutput(await removeStore(target));

      if (options.json) {
        printJson(payload);
        return;
      }

      printCleanupHuman('ストアを削除しました', payload);
    } catch (error) {
      this.handleFailure(
        options.json,
        { store: null, registry: null, files: null, status: [] },
        error
      );
    }
  }

  async list(options: StoreJsonOptions = {}): Promise<void> {
    try {
      const payload = toListOutput(await listStores());

      if (options.json) {
        printJson(payload);
        return;
      }

      printListHuman(payload);
    } catch (error) {
      this.handleFailure(options.json, { stores: [], status: [] }, error);
    }
  }

  async doctor(id: string | undefined, options: StoreJsonOptions = {}): Promise<void> {
    try {
      const payload = toDoctorOutput(await doctorStores(id));

      if (options.json) {
        printJson(payload);
        return;
      }

      printDoctorHuman(payload);
    } catch (error) {
      this.handleFailure(options.json, { stores: [], status: [] }, error);
    }
  }

  private handleFailure<T extends { status: StoreDiagnostic[] }>(
    json: boolean | undefined,
    payload: T,
    error: unknown
  ): void {
    emitFailure(json, payload, error, 'store_error');
  }
}
