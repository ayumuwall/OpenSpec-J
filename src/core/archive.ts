import { constants, createReadStream, promises as fs } from 'fs';
import { createHash, randomUUID } from 'crypto';
import path from 'path';
import { formatLocalDate } from '../utils/date.js';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import { VALIDATION_MESSAGES } from './validation/constants.js';
import chalk from 'chalk';
import {
  emitStoreRootBanner,
  isRootSelectionError,
  resolveOpenSpecRoot,
  toRootOutput,
  withStoreFlag,
  type ResolvedOpenSpecRoot,
  isStoreSelectedRoot,
} from './root-selection.js';
import {
  findSpecUpdates,
  buildUpdatedSpec,
  writeUpdatedSpec,
  retireSpec,
  finalizeRetiredSpec,
  type SpecUpdate,
} from './specs-apply.js';
import { discoverSpecFiles, hasAnyFileUnder } from '../utils/spec-discovery.js';
import { METADATA_FILENAME, readRetireCapabilitiesMarker, readSkipSpecsMarker } from '../utils/change-metadata.js';
import { confirmPrompt, isNonInteractivePromptError } from '../utils/interactive.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { folderStyleNameProblem } from './id.js';

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

/**
 * Matches the `YYYY-MM-DD-` prefix that archiving prepends to a change name.
 * A change whose name already starts with one (a common authoring convention)
 * is archived under its existing name so the prefix is never stacked (#1309).
 */
const ARCHIVE_DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}-/;

/**
 * True when the ONLY thing wrong with a rebuilt spec is that it has no
 * requirements. That is the exact failure retiring a capability replaces
 * (#1302); anything else means the spec is broken in a way the author still has
 * to fix, so archive must abort exactly as it always did instead of retiring.
 *
 * Asking the validator - rather than counting requirement blocks a second time -
 * is what makes "this spec could not have been written anyway" true by
 * construction. The two counts genuinely disagree: `MarkdownParser` accepts any
 * `###` heading under `## Requirements` as a requirement, while the delta block
 * parser only indexes canonical `### Requirement:` headers and sweeps the rest
 * into the preamble, which survives into the rebuilt spec.
 */
export async function isRetirableSpec(specName: string, rebuilt: string): Promise<boolean> {
  const report = await new Validator().validateSpecContent(specName, rebuilt);
  if (report.valid) return false;
  const errors = report.issues.filter((issue) => issue.level === 'ERROR');
  return (
    errors.length > 0 &&
    errors.every((issue) => issue.message === VALIDATION_MESSAGES.SPEC_NO_REQUIREMENTS)
  );
}

/**
 * What this run should do with a rebuilt spec: write it as usual, retire the
 * capability because the delta removed its last requirement (#1302), or do
 * nothing because there is no spec to write and none to retire.
 */
type SpecOutcome = 'write' | 'retire' | 'skip';

async function isRetirementCandidate(
  update: SpecUpdate,
  built: Pick<
    Awaited<ReturnType<typeof buildUpdatedSpec>>,
    'rebuilt' | 'noRequirementBlocks' | 'unaccountedContent'
  >,
  skipValidation: boolean
): Promise<boolean> {
  return (
    !skipValidation &&
    built.noRequirementBlocks &&
    built.unaccountedContent.length === 0 &&
    (await isRetirableSpec(update.id, built.rebuilt))
  );
}

async function decideSpecOutcome(
  update: SpecUpdate,
  built: Awaited<ReturnType<typeof buildUpdatedSpec>>,
  skipValidation: boolean,
  retirementDeclared: boolean
): Promise<SpecOutcome> {
  // The author has to have asked. Without the marker this falls through to the
  // ordinary write, which fails validation exactly as it always did - and the
  // abort names the marker, so the dead end #1302 describes now comes with its
  // own way out instead of just a rejected spec.
  if (!retirementDeclared) return 'write';

  // Retirement is decided by the validator, never by a second opinion about
  // what counts as a requirement: the block parser sweeps some shapes the
  // validator accepts into the preamble, so "no blocks left" alone would retire
  // specs that validate fine.
  //
  // Residual `###` headings veto it outright. The validator can be talked out of
  // seeing them - a stray `### Requirements` under Purpose captures its section
  // lookup - but a reader cannot, and deleting the file would take them with it.
  //
  // Under --no-validate there is no verdict to lean on, so nothing is retired:
  // the author opted out of the check that makes this safe, and the old
  // behavior (write the spec) loses nothing.
  // Nothing in the file may sit outside the parts the merge understands. Asked
  // as "did anything land outside the parts I understand" rather than "does
  // anything look like a requirement" - the second question is the one six
  // review rounds each found a new way to answer wrongly.
  const retirable = await isRetirementCandidate(update, built, skipValidation);

  if (!retirable) return 'write';
  // Nothing on disk to write or retire: the capability is already retired.
  if (!update.exists) return 'skip';
  // A spec that was already requirement-less and lost nothing this run is still
  // the author's to fix, so it takes the same abort it has always produced.
  return built.counts.removed > 0 ? 'retire' : 'write';
}

async function listActiveChangeNames(changesDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (!isMissingPathError(error)) throw error;
    return [];
  }
}

export interface ArchiveOptions {
  yes?: boolean;
  skipSpecs?: boolean;
  noValidate?: boolean;
  validate?: boolean;
  json?: boolean;
  store?: string;
  storePath?: string;
}

interface ArchiveDiagnostic {
  severity: 'error';
  code: string;
  message: string;
  fix?: string;
}

interface ArchiveResult {
  change: string;
  archivedAs: string;
  path: string;
  specsUpdated: boolean;
  totals?: { added: number; modified: number; removed: number; renamed: number };
  /** Non-blocking spec-merge warnings (e.g. a REMOVED requirement that was already gone). */
  warnings?: string[];
}

/**
 * A decision point archive cannot get past on its own. Thrown wherever the
 * flow needs an answer it has no way to obtain: in JSON mode, which never
 * prompts at all, and in human mode when a prompt failed because nothing
 * could answer it (#1479). Either way it carries a machine-readable
 * diagnostic and exits non-zero.
 */
class ArchiveBlockedError extends Error {
  readonly diagnostic: ArchiveDiagnostic;

  constructor(code: string, message: string, fix?: string) {
    super(message);
    this.name = 'ArchiveBlockedError';
    this.diagnostic = {
      severity: 'error',
      code,
      message,
      ...(fix ? { fix } : {}),
    };
  }
}

/**
 * Quotes a change name for a `Fix:` line the reader is meant to paste.
 * Archive resolves a change by stat-ing its directory, so the name is
 * whatever the directory is called - including names with spaces or shell
 * metacharacters, which pasted unquoted would run as a second command.
 *
 * Double quotes are the one form bash, zsh, PowerShell and cmd.exe all read
 * the same way, so a POSIX-only `'...'` would be wrong on Windows. Characters
 * that stay inert inside double quotes in every one of those shells are the
 * limit of what can be quoted portably; a name containing anything else has
 * no portable spelling, so the placeholder is named instead of emitting a
 * command that might expand to something the reader did not intend.
 *
 * `%` and `!` are unquotable for the same reason even though POSIX shells
 * leave them alone inside double quotes: cmd.exe expands `%NAME%` inside
 * double quotes, and `!NAME!` expands there too under `setlocal
 * enabledelayedexpansion` (as does `!` under bash's interactive history
 * expansion). A change directory really can be named `%USERNAME%`, and a
 * rerun that silently targets a different change is worse than one the reader
 * has to fill in.
 */
function quoteChangeName(name: string): string {
  return quoteForShell(name) ?? '<change-name>';
}

/**
 * Quotes an argument for a line the reader is meant to paste, or returns
 * undefined when no portable spelling exists.
 *
 * Double quotes are the one form bash, zsh, PowerShell and cmd.exe all read the
 * same way. A value holding a character that stays special INSIDE double quotes
 * in any of them has no portable spelling, so callers say something else rather
 * than emit a command that expands to something the reader did not intend.
 */
function quoteForShell(value: string): string | undefined {
  if (/^[A-Za-z0-9._\/-]+$/.test(value)) return value;
  if (!/["\\$`\r\n%!]/.test(value)) return `"${value}"`;
  return undefined;
}

/**
 * Renders a change name inside a prose message. The name is a directory name,
 * so it can hold control characters, and human mode prints the message
 * verbatim: a raw CR or LF would let a change directory forge its own `Fix:`
 * line, which is worse here than anywhere else because `quoteChangeName`
 * degrades the real fix to the `<change-name>` placeholder for exactly those
 * names - leaving the forged line as the only pasteable command on screen.
 * An ESC could redraw the terminal. Neither survives.
 */
function describeChangeName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, '?');
}

/**
 * Builds the flags a blocked archive's suggested rerun has to reproduce. The
 * caller's own flags are carried, because suggesting a bare `--yes` rerun for
 * `archive x --skip-specs` would merge deltas into the main specs - the exact
 * thing `--skip-specs` was passed to prevent.
 */
function rerunFlags(options: ArchiveOptions): string[] {
  return [
    ...(options.skipSpecs ? ['--skip-specs'] : []),
    ...(options.validate === false || options.noValidate === true ? ['--no-validate'] : []),
    '--yes',
  ];
}

function rerunCommand(
  root: ResolvedOpenSpecRoot,
  changeName: string,
  options: ArchiveOptions
): string {
  const flags = rerunFlags(options).join(' ');
  // A name starting with a dash is read as an option wherever it sits, so it
  // goes last, behind the `--` that ends option parsing. The store flag has
  // to stay in front of that `--` to still be read as an option.
  if (changeName.startsWith('-')) {
    return `${withStoreFlag(root, `openspec archive ${flags}`)} -- ${quoteChangeName(changeName)}`;
  }
  return withStoreFlag(root, `openspec archive ${quoteChangeName(changeName)} ${flags}`);
}

/**
 * Asks a yes/no question in human mode. When no answer can be read — the
 * usual case for an AI agent or a script that runs the command with stdin
 * closed — the raw @inquirer failure is replaced with guidance for this
 * decision point, so the caller learns which flag to pass instead of reading
 * `User force closed the prompt` (#1479).
 */
async function confirmOrBlock(
  prompt: { message: string; default: boolean },
  blocked: () => ArchiveBlockedError
): Promise<boolean> {
  try {
    return await confirmPrompt(prompt);
  } catch (error) {
    if (isNonInteractivePromptError(error)) {
      throw blocked();
    }
    throw error;
  }
}

function toArchiveDiagnostic(error: unknown): ArchiveDiagnostic {
  if (error instanceof ArchiveBlockedError) {
    return error.diagnostic;
  }
  if (isRootSelectionError(error)) {
    return error.diagnostic;
  }
  return {
    severity: 'error',
    code: 'archive_error',
    message: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Recursively copy a directory. Used when fs.rename fails (e.g. EPERM on Windows).
 */
async function copySymbolicLink(src: string, dest: string): Promise<void> {
  const target = await fs.readlink(src);
  const isWindowsDirectoryLink =
    process.platform === 'win32' && (await fs.stat(src)).isDirectory();
  const destinationTarget =
    isWindowsDirectoryLink && !path.isAbsolute(target)
      ? path.resolve(path.dirname(src), target)
      : target;
  await fs.symlink(destinationTarget, dest, isWindowsDirectoryLink ? 'junction' : undefined);
}

async function copyDirContents(src: string, dest: string): Promise<void> {
  const sourceStat = await fs.lstat(src);
  // Keep group/other access no broader than the source while ensuring this
  // process can populate even a read-only source directory.
  await fs.chmod(dest, (sourceStat.mode & 0o7777) | 0o700);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { mode: 0o700 });
      await copyDirContents(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      await copySymbolicLink(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath, constants.COPYFILE_EXCL);
    } else {
      throw new Error(`サポートされないファイルシステムエントリはアーカイブできません: ${srcPath}`);
    }
  }
  await fs.chmod(dest, sourceStat.mode & 0o7777);
}

async function fingerprintDirectoryContents(root: string): Promise<string> {
  const hash = createHash('sha256');
  const updateHashField = (label: string, value: string | Buffer): void => {
    const labelBuffer = Buffer.from(label);
    const valueBuffer = typeof value === 'string' ? Buffer.from(value) : value;
    const lengths = Buffer.allocUnsafe(16);
    lengths.writeBigUInt64BE(BigInt(labelBuffer.length), 0);
    lengths.writeBigUInt64BE(BigInt(valueBuffer.length), 8);
    hash.update(lengths);
    hash.update(labelBuffer);
    hash.update(valueBuffer);
  };
  const fingerprintFile = async (filePath: string): Promise<Buffer> => {
    const fileHash = createHash('sha256');
    for await (const chunk of createReadStream(filePath)) {
      fileHash.update(chunk);
    }
    return fileHash.digest();
  };

  const visit = async (dir: string, relativeDir: string): Promise<void> => {
    const before = await fs.lstat(dir, { bigint: true });
    if (!before.isDirectory()) {
      throw new Error(`${dir} の検証中にディレクトリであることを期待しました。`);
    }
    updateHashField('directory-mode', (before.mode & 0o7777n).toString());
    const entries = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      const relativePath = path.join(relativeDir, entry.name);
      const stat = await fs.lstat(entryPath, { bigint: true });
      updateHashField('path', relativePath);

      if (stat.isDirectory()) {
        updateHashField('type', 'directory');
        await visit(entryPath, relativePath);
      } else if (stat.isSymbolicLink()) {
        const target = await fs.readlink(entryPath);
        const after = await fs.lstat(entryPath, { bigint: true });
        if (statIdentity(stat) !== statIdentity(after)) {
          throw new Error(`アーカイブが ${entryPath} を読み取っている間にパスが変更されました。`);
        }
        updateHashField('type', 'symlink');
        updateHashField('target', target);
      } else if (stat.isFile()) {
        const contentFingerprint = await fingerprintFile(entryPath);
        const after = await fs.lstat(entryPath, { bigint: true });
        if (statIdentity(stat) !== statIdentity(after)) {
          throw new Error(`アーカイブが ${entryPath} を読み取っている間にパスが変更されました。`);
        }
        updateHashField('type', 'file');
        updateHashField('mode', (stat.mode & 0o7777n).toString());
        updateHashField('content-sha256', contentFingerprint);
      } else {
        updateHashField('type', 'other');
        updateHashField('mode', stat.mode.toString());
        updateHashField('size', stat.size.toString());
      }
    }

    const after = await fs.lstat(dir, { bigint: true });
    if (statIdentity(before) !== statIdentity(after)) {
      throw new Error(`アーカイブが ${dir} を読み取っている間にディレクトリが変更されました。`);
    }
  };

  await visit(root, '');
  return hash.digest('hex');
}

async function assertCopiedDirectoryUnchanged(
  stagedSource: string,
  destination: string,
  expectedFingerprint: string
): Promise<void> {
  const sourceFingerprint = await fingerprintDirectoryContents(stagedSource);
  const destinationFingerprint = await fingerprintDirectoryContents(destination);
  if (
    sourceFingerprint !== expectedFingerprint ||
    destinationFingerprint !== expectedFingerprint
  ) {
    throw new Error(
      `${stagedSource} から ${destination} へのフォールバックコピー中に、変更ディレクトリの内容が変わりました。`
    );
  }
}

/**
 * Move a directory from src to dest. On Windows, fs.rename() can fail with
 * EPERM, and cross-device moves fail with EXDEV. When the source can first be
 * renamed to a private sibling, fall back to a verified copy-then-remove. A
 * source that cannot be staged is left untouched rather than copied and deleted
 * through a path another process may still be editing.
 */
class MoveDestinationRetainedError extends Error {}
class RetirementBackupsRetainedError extends Error {}

async function moveDirectory(
  src: string,
  dest: string,
  options: {
    verifyCopiedDestination?: (stagedSource: string) => Promise<void>;
  } = {}
): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch (err: any) {
    const code = err?.code;
    // rename onto a non-empty directory: the destination was taken while the
    // archive was running. Same condition the pre-flight check reports.
    if (code === 'ENOTEMPTY' || code === 'EEXIST') {
      throw new ArchiveBlockedError(
        'archive_target_exists',
        `アーカイブ '${path.basename(dest)}' は既に存在します。`
      );
    }
    if (code === 'EPERM' || code === 'EXDEV') {
      const stagedSource = path.join(path.dirname(src), `.openspec-move-${randomUUID()}`);
      try {
        await fs.rename(src, stagedSource);
      } catch (stageError) {
        throw new Error(
          `フォールバックでアーカイブをコピーする前に ${src} を安全に退避できませんでした` +
            `（${stageError instanceof Error ? stageError.message : String(stageError)}）。` +
            'フォールバックコピーは実行していません。'
        );
      }
      let destIsOurs = false;
      let stagedFingerprint: string;
      try {
        stagedFingerprint = await fingerprintDirectoryContents(stagedSource);
        await fs.mkdir(dest, { mode: 0o700 });
        destIsOurs = true;
        await copyDirContents(stagedSource, dest);
        await options.verifyCopiedDestination?.(stagedSource);
        await assertCopiedDirectoryUnchanged(stagedSource, dest, stagedFingerprint);
      } catch (copyError) {
        if (destIsOurs) {
          await fs.rm(dest, { recursive: true, force: true }).catch(() => undefined);
        }
        try {
          await fs.rename(stagedSource, src);
        } catch (restoreError) {
          throw new Error(
            `${copyError instanceof Error ? copyError.message : String(copyError)} ` +
              `退避したソース ${stagedSource} を復元できませんでした` +
              `（${restoreError instanceof Error ? restoreError.message : String(restoreError)}）。`
          );
        }
        if ((copyError as NodeJS.ErrnoException).code === 'EEXIST') {
          throw new ArchiveBlockedError(
            'archive_target_exists',
            `アーカイブ '${path.basename(dest)}' は既に存在します。`
          );
        }
        throw copyError;
      }
      try {
        await options.verifyCopiedDestination?.(stagedSource);
        await assertCopiedDirectoryUnchanged(stagedSource, dest, stagedFingerprint);
      } catch (verificationError) {
        await fs.rm(dest, { recursive: true, force: true }).catch(() => undefined);
        try {
          await fs.rename(stagedSource, src);
        } catch (restoreError) {
          throw new Error(
            `${verificationError instanceof Error ? verificationError.message : String(verificationError)} ` +
              `退避したソース ${stagedSource} を復元できませんでした` +
              `（${restoreError instanceof Error ? restoreError.message : String(restoreError)}）。`
          );
        }
        throw verificationError;
      }
      try {
        await fs.rm(stagedSource, { recursive: true, force: true });
      } catch (cleanupError) {
        // Recursive removal may already have deleted part of the source. The
        // destination is now the only complete copy, so never erase it while
        // trying to make this failed move look atomic.
        throw new MoveDestinationRetainedError(
          `${src} を ${dest} へコピーしましたが、退避したソース ${stagedSource} を完全に削除できませんでした` +
            `（${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}）。` +
            '完全なコピー先は復旧用に保持されています。'
        );
      }
    } else {
      throw err;
    }
  }
}

async function assertArchiveDestinationAvailable(
  archivePath: string,
  archiveName: string
): Promise<void> {
  try {
    await fs.lstat(archivePath);
    throw new ArchiveBlockedError(
      'archive_target_exists',
      `アーカイブ '${archiveName}' は既に存在します。`
    );
  } catch (error: any) {
    if (error instanceof ArchiveBlockedError) throw error;
    if (error.code !== 'ENOENT') throw error;
  }
}

function archiveClaimPath(archivePath: string, _archiveName: string): string {
  return path.join(path.dirname(archivePath), '.openspec-archive.lock');
}

interface ArchiveClaim {
  handle: Awaited<ReturnType<typeof fs.open>>;
  contents: string;
}

async function releaseArchiveClaim(
  claim: ArchiveClaim,
  claimPath: string
): Promise<void> {
  const owned = await claim.handle.stat({ bigint: true }).catch(() => undefined);
  await claim.handle.close().catch(() => undefined);
  if (owned === undefined) return;
  try {
    // Read between two lstats by design: the identity + content match below
    // proves we still own this claim before unlinking it. This is a concurrent-
    // change detector, not an fd-less race to "fix" (CodeQL js/file-system-race).
    const current = await fs.lstat(claimPath, { bigint: true });
    const contents = await fs.readFile(claimPath, 'utf8');
    const currentAfterRead = await fs.lstat(claimPath, { bigint: true });
    if (
      current.dev === owned.dev &&
      current.ino === owned.ino &&
      current.dev === currentAfterRead.dev &&
      current.ino === currentAfterRead.ino &&
      contents === claim.contents
    ) {
      await fs.unlink(claimPath);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function claimArchiveDestination(
  archivePath: string,
  archiveName: string
): Promise<ArchiveClaim> {
  const claimPath = archiveClaimPath(archivePath, archiveName);
  try {
    const handle = await fs.open(claimPath, 'wx');
    const claim = {
      handle,
      contents: JSON.stringify({ pid: process.pid, nonce: randomUUID() }),
    };
    try {
      await handle.writeFile(claim.contents);
      await handle.sync();
      return claim;
    } catch (error) {
      await releaseArchiveClaim(claim, claimPath).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new ArchiveBlockedError(
        'archive_target_exists',
        `アーカイブ '${archiveName}' は既に作成中です。アーカイブ処理が動いていない場合は、` +
          `${claimPath} にある古いロックを削除して再実行してください。`
      );
    }
    throw error;
  }
}

interface SpecSnapshot {
  target: string;
  existed: boolean;
  outcome: 'write' | 'retire';
  expectedContent?: Buffer;
  content?: Buffer;
  contentExisted?: boolean;
  mode?: number;
  symlink?: string;
  displacedPath?: string;
  displacedFingerprint?: string;
}

interface SpecMutation {
  update: SpecUpdate;
  outcome: 'write' | 'retire';
  rebuilt: string;
}

function statIdentity(value: {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
}): string {
  return `${value.dev}:${value.ino}:${value.mode}:${value.size}:${value.mtimeNs}:${value.ctimeNs}`;
}

function movableStatIdentity(value: {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
}): string {
  return `${value.dev}:${value.ino}:${value.mode}:${value.size}`;
}

async function fingerprintPath(filePath: string): Promise<string> {
  try {
    const stat = await fs.lstat(filePath, { bigint: true });
    const digest = async (): Promise<string> =>
      createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
    if (stat.isSymbolicLink()) {
      const link = await fs.readlink(filePath);
      try {
        const referentBefore = await fs.stat(filePath, { bigint: true });
        const hash = await digest();
        const referentAfter = await fs.stat(filePath, { bigint: true });
        const entryAfter = await fs.lstat(filePath, { bigint: true });
        if (
          statIdentity(stat) !== statIdentity(entryAfter) ||
          statIdentity(referentBefore) !== statIdentity(referentAfter) ||
          link !== (await fs.readlink(filePath))
        ) {
          throw new Error(`アーカイブが ${filePath} を読み取っている間にパスが変更されました。`);
        }
        return `symlink:${statIdentity(stat)}:${link}:${statIdentity(referentAfter)}:${hash}`;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return `symlink:${statIdentity(stat)}:${link}:missing`;
        }
        throw error;
      }
    }
    if (stat.isFile()) {
      const hash = await digest();
      const after = await fs.lstat(filePath, { bigint: true });
      if (statIdentity(stat) !== statIdentity(after)) {
        throw new Error(`アーカイブが ${filePath} を読み取っている間にパスが変更されました。`);
      }
      return `file:${statIdentity(after)}:${hash}`;
    }
    return `other:${statIdentity(stat)}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

async function fingerprintMovablePath(filePath: string): Promise<string> {
  try {
    const entry = await fs.lstat(filePath, { bigint: true });
    // Deliberate stat -> read -> re-stat: a concurrent change is DETECTED by the
    // statIdentity comparison below and throws. Do not collapse to fd I/O, which
    // would pin one inode and blind the detector (CodeQL js/file-system-race).
    const hash = createHash('sha256')
      .update(await fs.readFile(filePath))
      .digest('hex');
    if (entry.isSymbolicLink()) {
      const link = await fs.readlink(filePath);
      const referent = await fs.stat(filePath, { bigint: true });
      const entryAfter = await fs.lstat(filePath, { bigint: true });
      const referentAfter = await fs.stat(filePath, { bigint: true });
      const linkAfter = await fs.readlink(filePath);
      if (
        statIdentity(entry) !== statIdentity(entryAfter) ||
        statIdentity(referent) !== statIdentity(referentAfter) ||
        link !== linkAfter
      ) {
        throw new Error(`アーカイブが ${filePath} を読み取っている間にパスが変更されました。`);
      }
      return (
        `symlink:${movableStatIdentity(entry)}:${link}:` +
        `${movableStatIdentity(referentAfter)}:${hash}`
      );
    }
    const entryAfter = await fs.lstat(filePath, { bigint: true });
    if (statIdentity(entry) !== statIdentity(entryAfter)) {
      throw new Error(`アーカイブが ${filePath} を読み取っている間にパスが変更されました。`);
    }
    return `file:${movableStatIdentity(entry)}:${hash}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

async function fingerprintPortableContent(filePath: string): Promise<string> {
  try {
    const entry = await fs.lstat(filePath);
    // Point-in-time content hash by design (no re-stat): callers compare it
    // against a prior fingerprint of the same bytes, so any concurrent change
    // surfaces as a hash mismatch (CodeQL js/file-system-race is a false positive here).
    const hash = createHash('sha256')
      .update(await fs.readFile(filePath))
      .digest('hex');
    return entry.isSymbolicLink()
      ? `symlink:${await fs.readlink(filePath)}:${hash}`
      : `file:${hash}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }
}

/** Fail closed if the metadata authorizing a retirement leaves its snapshot. */
async function assertRetirementAuthorization(
  changeDir: string,
  expectedFingerprint: string,
  options: { verifyMarker?: boolean } = {}
): Promise<void> {
  const metadataPath = path.join(changeDir, METADATA_FILENAME);
  const before = await fingerprintPortableContent(metadataPath);
  const markerStillDeclared =
    options.verifyMarker === false || readRetireCapabilitiesMarker(changeDir).declared;
  const after = await fingerprintPortableContent(metadataPath);
  if (
    before !== expectedFingerprint ||
    after !== expectedFingerprint ||
    !markerStillDeclared
  ) {
    throw new Error(
      `アーカイブの完了前に ${METADATA_FILENAME} の機能廃止許可が変更されました。`
    );
  }
}

async function fingerprintSpecInputs(update: SpecUpdate): Promise<string> {
  return `${await fingerprintPath(update.source)}\n${await fingerprintPath(update.target)}`;
}

async function mutationTargetIdentity(mutation: SpecMutation): Promise<string> {
  try {
    const stat = await fs.stat(mutation.update.target, { bigint: true });
    return `${stat.dev}:${stat.ino}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const parent = path.dirname(mutation.update.target);
      const realParent = await fs.realpath(parent).catch(() => path.resolve(parent));
      return `missing:${path.join(realParent, path.basename(mutation.update.target))}`;
    }
    throw error;
  }
}

async function assertDistinctMutationTargets(mutations: SpecMutation[]): Promise<void> {
  const owners = new Map<string, string>();
  for (const mutation of mutations) {
    const identity = await mutationTargetIdentity(mutation);
    const existing = owners.get(identity);
    if (existing !== undefined) {
      throw new Error(
        `仕様更新 '${existing}' と '${mutation.update.id}' が同じ出力先 ${identity} に解決されます。` +
          `アーカイブ前に機能エイリアスを置き換えるか、差分を統合してください。`
      );
    }
    owners.set(identity, mutation.update.id);
  }
}

async function captureSpecSnapshots(mutations: SpecMutation[]): Promise<SpecSnapshot[]> {
  return Promise.all(
    mutations.map(async ({ update, outcome, rebuilt }) => {
      try {
        const stat = await fs.lstat(update.target);
        if (stat.isSymbolicLink()) {
          let content: Buffer | undefined;
          let contentExisted = false;
          if (outcome === 'write') {
            try {
              // Best-effort rollback snapshot; a concurrent edit is caught later
              // by restoreSpecSnapshots refusing to overwrite non-matching content,
              // not here (CodeQL js/file-system-race).
              content = await fs.readFile(update.target);
              contentExisted = true;
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
            }
          }
          return {
            target: update.target,
            existed: true,
            outcome,
            ...(outcome === 'write' ? { expectedContent: Buffer.from(rebuilt) } : {}),
            content,
            contentExisted,
            symlink: await fs.readlink(update.target),
          };
        }
        return {
          target: update.target,
          existed: true,
          outcome,
          ...(outcome === 'write' ? { expectedContent: Buffer.from(rebuilt) } : {}),
          // Snapshot read for rollback; restoreSpecSnapshots re-checks this
          // content before restoring, so a mid-run change aborts instead of
          // clobbering (CodeQL js/file-system-race).
          ...(stat.isFile() ? { content: await fs.readFile(update.target) } : {}),
          ...(stat.isFile() ? { mode: stat.mode } : {}),
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return {
            target: update.target,
            existed: false,
            outcome,
            ...(outcome === 'write' ? { expectedContent: Buffer.from(rebuilt) } : {}),
          };
        }
        throw error;
      }
    })
  );
}

async function restoreSpecSnapshots(snapshots: SpecSnapshot[]): Promise<void> {
  const errors: Error[] = [];
  for (const snapshot of [...snapshots].reverse()) {
    try {
      if (snapshot.outcome === 'retire') {
        if (snapshot.displacedPath !== undefined) {
          try {
            await fs.lstat(snapshot.target);
            throw new Error(
              `アーカイブのロールバックにより ${snapshot.target} の同時変更を上書きしてしまいます。` +
                `退避した仕様は ${snapshot.displacedPath} に保持されています。`
            );
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
          await fs.rename(snapshot.displacedPath, snapshot.target);
          snapshot.displacedPath = undefined;
          continue;
        }
        try {
          const current = await fs.lstat(snapshot.target);
          const unchangedSymlink =
            snapshot.symlink !== undefined &&
            current.isSymbolicLink() &&
            (await fs.readlink(snapshot.target)) === snapshot.symlink;
          // Re-read to confirm the target still holds the snapshot content; a
          // mismatch means a concurrent edit, and rollback throws below rather
          // than overwrite it (CodeQL js/file-system-race is intentional here).
          const unchangedFile =
            snapshot.symlink === undefined &&
            snapshot.content !== undefined &&
            current.isFile() &&
            (await fs.readFile(snapshot.target)).equals(snapshot.content);
          if (unchangedSymlink || unchangedFile) continue;
          throw new Error(
            `アーカイブのロールバックにより ${snapshot.target} の同時変更を上書きしてしまいます。`
          );
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      } else {
        let current;
        try {
          current = await fs.lstat(snapshot.target);
        } catch (error) {
          if (
            (error as NodeJS.ErrnoException).code === 'ENOENT' &&
            !snapshot.existed
          ) {
            continue;
          }
          throw error;
        }
        if (
          (snapshot.symlink !== undefined &&
            (!current.isSymbolicLink() ||
              (await fs.readlink(snapshot.target)) !== snapshot.symlink)) ||
          (snapshot.symlink === undefined &&
            (!current.isFile() ||
              (snapshot.mode !== undefined && current.mode !== snapshot.mode)))
        ) {
          throw new Error(
            `アーカイブのロールバックにより ${snapshot.target} の同時変更を上書きしてしまいます。`
          );
        }
        // Re-read at rollback: only restore when current content matches what
        // archive wrote or snapshotted; otherwise abort to preserve a concurrent
        // change (CodeQL js/file-system-race is intentional here).
        const currentContent = await fs.readFile(snapshot.target);
        const originalContent =
          snapshot.symlink !== undefined && !snapshot.contentExisted
            ? undefined
            : snapshot.content;
        if (
          originalContent !== undefined &&
          currentContent.equals(originalContent)
        ) {
          continue;
        }
        if (
          snapshot.expectedContent === undefined ||
          !currentContent.equals(snapshot.expectedContent)
        ) {
          throw new Error(
            `アーカイブのロールバックにより ${snapshot.target} の同時変更を上書きしてしまいます。`
          );
        }
      }

      if (!snapshot.existed) {
        await fs.rm(snapshot.target, { force: true });
        continue;
      }
      if (snapshot.symlink !== undefined) {
        if (snapshot.outcome === 'retire') {
          await fs.mkdir(path.dirname(snapshot.target), { recursive: true });
          await fs.symlink(snapshot.symlink, snapshot.target);
        } else if (snapshot.contentExisted) {
          await fs.writeFile(snapshot.target, snapshot.content!);
        } else {
          const referent = path.resolve(path.dirname(snapshot.target), snapshot.symlink);
          await fs.rm(referent, { force: true });
        }
        continue;
      }
      if (snapshot.content !== undefined) {
        await fs.mkdir(path.dirname(snapshot.target), { recursive: true });
        await fs.writeFile(snapshot.target, snapshot.content);
        if (snapshot.mode !== undefined) await fs.chmod(snapshot.target, snapshot.mode);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.map(({ message }) => message).join(' '));
  }
}

async function finalizeRetirementBackups(
  snapshots: SpecSnapshot[],
  mainSpecsDir: string
): Promise<void> {
  const errors: string[] = [];
  for (const snapshot of snapshots) {
    if (snapshot.outcome !== 'retire' || snapshot.displacedPath === undefined) continue;
    const displacedPath = snapshot.displacedPath;
    try {
      if (
        snapshot.displacedFingerprint === undefined ||
        (await fingerprintMovablePath(displacedPath)) !== snapshot.displacedFingerprint
      ) {
        throw new Error('機能廃止の検証後に退避した仕様が変更されました');
      }
      await finalizeRetiredSpec(snapshot.target, displacedPath, mainSpecsDir);
      snapshot.displacedPath = undefined;
    } catch (error) {
      errors.push(
        `確定済みの機能廃止バックアップ ${displacedPath} を削除できませんでした` +
          `（${error instanceof Error ? error.message : String(error)}）。`
      );
    }
  }
  if (errors.length > 0) {
    throw new RetirementBackupsRetainedError(
      `${errors.join(' ')} 変更はアーカイブ済みのままですが、列挙したバックアップは復旧用に保持されています。`
    );
  }
}

export class ArchiveCommand {
  async execute(changeName?: string, options: ArchiveOptions = {}): Promise<void> {
    const json = !!options.json;

    let root: ResolvedOpenSpecRoot;
    try {
      root = await resolveOpenSpecRoot({
        ...(options.store !== undefined ? { store: options.store } : {}),
        ...(options.storePath !== undefined ? { storePath: options.storePath } : {}),
      });
    } catch (error) {
      if (json && isRootSelectionError(error)) {
        this.printJsonFailure(undefined, toArchiveDiagnostic(error));
        return;
      }
      throw error;
    }

    if (json) {
      try {
        const result = await this.run(changeName, options, root, true);
        if (!result) {
          return;
        }
        console.log(JSON.stringify({ archive: result, root: toRootOutput(root) }, null, 2));
      } catch (error) {
        this.printJsonFailure(root, toArchiveDiagnostic(error));
      }
      return;
    }

    emitStoreRootBanner(root);
    await this.run(changeName, options, root, false);
  }

  private printJsonFailure(root: ResolvedOpenSpecRoot | undefined, diagnostic: ArchiveDiagnostic): void {
    console.log(
      JSON.stringify(
        {
          archive: null,
          ...(root ? { root: toRootOutput(root) } : {}),
          status: [diagnostic],
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }

  /**
   * Shared archive flow. In human mode (json=false) prompts and prose match
   * the historical behavior and cancellations return null. In JSON mode no
   * prose reaches stdout and every blocked path throws.
   */
  private async run(
    changeName: string | undefined,
    options: ArchiveOptions,
    root: ResolvedOpenSpecRoot,
    json: boolean
  ): Promise<ArchiveResult | null> {
    const changesDir = root.changesDir;
    const archiveDir = root.archiveDir;
    const mainSpecsDir = root.specsDir;

    for (const [allowedDirectory, managedDir] of [
      [root.path, changesDir],
      [changesDir, archiveDir],
      [root.path, mainSpecsDir],
    ] as const) {
      try {
        FileSystemUtils.assertPathWithin(allowedDirectory, managedDir);
      } catch {
        throw new ArchiveBlockedError(
          'archive_path_outside_root',
          `OpenSpec ルート外のパスを経由してアーカイブすることはできません: ${managedDir}`
        );
      }
    }

    // Get change name interactively if not provided
    if (!changeName) {
      if (json) {
        throw new ArchiveBlockedError(
          'archive_change_name_required',
          '変更名が必要です。archive --json は対話操作を行いません。',
          withStoreFlag(root, 'openspec archive <change-name> --json')
        );
      }
      const selectedChange = await this.selectChange(changesDir, root, options);
      if (!selectedChange) {
        console.log('変更が選択されなかったため中止します。');
        return null;
      }
      changeName = selectedChange;
    }

    const changeNameProblem = folderStyleNameProblem(changeName, 'Change name');
    if (changeNameProblem) {
      throw new ArchiveBlockedError('archive_change_name_invalid', changeNameProblem);
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists
    try {
      const stat = await fs.lstat(changeDir);
      if (stat.isSymbolicLink()) {
        throw new ArchiveBlockedError(
          'archive_change_symlink',
          `変更 '${changeName}' はシンボリックリンクです。アーカイブ前に実ディレクトリへ置き換えてください。`
        );
      }
      if (!stat.isDirectory()) {
        throw new Error(`変更 '${changeName}' が見つかりません。`);
      }
    } catch (error) {
      if (error instanceof ArchiveBlockedError) throw error;
      const available = await listActiveChangeNames(changesDir);
      throw new ArchiveBlockedError(
        'archive_change_not_found',
        available.length > 0
          ? `変更 '${changeName}' が見つかりません。利用可能な変更: ${available.join(', ')}`
          : `変更 '${changeName}' が見つかりません。このルートにはアクティブな変更がありません。`
      );
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (informative only; human mode prints warnings)
      if (!json) {
        const changeFile = path.join(changeDir, 'proposal.md');
        try {
          await fs.access(changeFile);
          const changeReport = await validator.validateChange(changeFile);
          // proposalの検証結果は情報提供のみ（archiveをブロックしない）
          const proposalIssues = changeReport.issues.filter(
            (issue) => !/^deltas\.\d+\.requirements?\./.test(issue.path)
          );
          if (!changeReport.valid && proposalIssues.length > 0) {
            console.log(chalk.yellow('\nproposal.md の警告（ブロックしません）:'));
            for (const issue of proposalIssues) {
              const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
              console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
            }
          }
        } catch {
          // Change file doesn't exist, skip validation
        }
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      // A spec.md at the specs/ root is never merged, so archiving a change
      // that has one drops its content whether or not it carries delta headers
      // (#1385). Its existence alone must run validation, which reports it and
      // blocks the archive. A directory named spec.md is a normal capability
      // folder, so only a regular file counts.
      const rootSpecStat = await fs.stat(path.join(changeSpecsDir, 'spec.md')).catch(() => null);
      let hasDeltaSpecs = rootSpecStat?.isFile() === true;
      // A change that declares skip_specs must not carry any file under
      // specs/ — validate reports that as a conflict, so archive has to run
      // the same check instead of skipping validation because the files
      // happen to have no delta headers. A marker that cannot be honored
      // (skip_specs mentioned but the metadata fails the shared shape, or
      // names a schema that does not resolve) also
      // forces validation, so archive and validate always agree about the
      // marker. Unreadable specs/ fails closed into validation too. (An
      // UNMARKED zero-delta change still archives with only non-blocking
      // proposal warnings — a gap that predates the marker and is left
      // unchanged here.)
      if (!hasDeltaSpecs) {
        const marker = readSkipSpecsMarker(changeDir);
        if (marker.invalidReason) {
          hasDeltaSpecs = true;
        } else if (marker.declared) {
          let specsDirHasFiles = true;
          try {
            specsDirHasFiles = await hasAnyFileUnder(changeSpecsDir);
          } catch {
            // fall through with true: let validation surface the conflict
          }
          hasDeltaSpecs = specsDirHasFiles;
        }
      }
      for (const { specFile } of hasDeltaSpecs ? [] : await discoverSpecFiles(changeSpecsDir)) {
        try {
          const content = await fs.readFile(specFile, 'utf-8');
          // Case-insensitive to match the delta parser, so a lowercase header
          // routes through the same delta validation that validate runs.
          if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/im.test(content)) {
            hasDeltaSpecs = true;
            break;
          }
        } catch {}
      }
      if (hasDeltaSpecs) {
        // No mainSpecsDir here on purpose: the scenario-loss check standalone
        // validate runs (#1477) is the same one buildUpdatedSpec enforces a few
        // steps later, and reporting it here would relabel that failure.
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          if (!json) {
            console.log(chalk.red('\n変更の差分仕様で検証エラーがありました:'));
            for (const issue of deltaReport.issues) {
              if (issue.level === 'ERROR') {
                console.log(chalk.red(`  ✗ ${issue.message}`));
              } else if (issue.level === 'WARNING') {
                console.log(chalk.yellow(`  ⚠ ${issue.message}`));
              }
            }
          }
        }
      }

      if (hasValidationErrors) {
        if (json) {
          throw new ArchiveBlockedError(
            'archive_validation_failed',
            `Validation failed for change '${changeName}'.`,
            `Run ${withStoreFlag(root, `openspec validate ${changeName}`)} for details, fix the errors, or rerun with --no-validate.`
          );
        }
        console.log(chalk.red('\n検証に失敗しました。アーカイブ前にエラーを修正してください。'));
        console.log(chalk.yellow('検証をスキップする場合（非推奨）は --no-validate を使用してください。'));
        process.exitCode = 1;
        return null;
      }
    } else if (json) {
      if (!options.yes) {
        throw new ArchiveBlockedError(
          'archive_confirmation_required',
          '検証をスキップするには確認が必要です。--yes を付けて再実行してください。',
          withStoreFlag(root, 'openspec archive <change-name> --json --no-validate --yes')
        );
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();

      if (!options.yes) {
        const proceed = await confirmOrBlock(
          {
            message: chalk.yellow('⚠️  警告: 検証を省略すると無効な仕様をアーカイブする可能性があります。続行しますか？ (y/N)'),
            default: false
          },
          () =>
            new ArchiveBlockedError(
              'archive_confirmation_required',
              '検証を省略するには確認が必要ですが、標準入力から回答を読み取れませんでした。',
              rerunCommand(root, changeName!, options)
            )
        );
        if (!proceed) {
          console.log('アーカイブをキャンセルしました。');
          return null;
        }
      } else {
        console.log(chalk.yellow('\n⚠️  警告: 検証をスキップすると不正な仕様をアーカイブする可能性があります。'));
      }

      console.log(chalk.yellow(`[${timestamp}] 検証をスキップ: change=${changeName}`));
      console.log(chalk.yellow(`対象ファイル: ${changeDir}`));
    }

    // Show progress and check for incomplete tasks
    const progress = await getTaskProgressForChange(changesDir, changeName, path.resolve(changesDir, '..', '..'));
    if (!json) {
      const status = formatTaskStatus(progress);
      console.log(`タスクの進捗: ${status}`);
    }

    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (json) {
        if (!options.yes) {
          throw new ArchiveBlockedError(
            'archive_tasks_incomplete',
            `変更 '${changeName}' に${incompleteTasks}件の未完了タスクがあります。`,
            'タスクを完了するか、--yes を付けて再実行してください。'
          );
        }
      } else if (!options.yes) {
        const proceed = await confirmOrBlock(
          {
            message: `警告: ${incompleteTasks}件の未完了タスクがあります。続行しますか？`,
            default: false
          },
          () =>
            new ArchiveBlockedError(
              'archive_tasks_incomplete',
              `変更 '${describeChangeName(changeName!)}' に${incompleteTasks}件の未完了タスクがありますが、標準入力から回答を読み取れませんでした。`,
              `タスクを完了するか、${rerunCommand(root, changeName!, options)} を付けて再実行してください。`
            )
        );
        if (!proceed) {
          console.log('アーカイブをキャンセルしました。');
          return null;
        }
      } else {
        console.log(`警告: 未完了タスクが ${incompleteTasks} 件ありますが --yes により続行します。`);
      }
    }

    // Settle the archive destination BEFORE touching any spec. The name depends
    // only on the change, and a collision is routine (archiving twice in a day,
    // a restored change), so discovering it after the merge would leave specs
    // rewritten - or a capability retired - for an archive that never happened.
    //
    // Names that already carry a date prefix keep it: re-prefixing would stutter
    // the name, and when the archive runs on a later day the folder would sort
    // under a day on which the change did not happen (#1309).
    const archiveName = ARCHIVE_DATE_PREFIX_PATTERN.test(changeName)
      ? changeName
      : `${formatLocalDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);

    // Read once, before any spec is touched: whether this change is allowed to
    // retire a capability at all. An unhonorable marker counts as undeclared,
    // exactly as skip_specs treats one, so metadata the rest of the CLI rejects
    // can never authorise a deletion.
    const retirementMarker = readRetireCapabilitiesMarker(changeDir);
    const retirementDeclared = retirementMarker.declared;
    const retirementAuthorizationFingerprint = retirementDeclared
      ? await fingerprintPortableContent(path.join(changeDir, METADATA_FILENAME))
      : undefined;

    await assertArchiveDestinationAvailable(archivePath, archiveName);
    await fs.mkdir(archiveDir, { recursive: true });
    const claimPath = archiveClaimPath(archivePath, archiveName);
    let archiveClaim: ArchiveClaim | undefined;

    try {
      // Handle spec updates unless skipSpecs flag is set
      let specsUpdated = false;
      let totals: ArchiveResult['totals'];
      const specWarnings: string[] = [];
      let changeArchived = false;
      if (options.skipSpecs) {
      if (!json) {
        console.log('仕様更新をスキップします (--skip-specs 指定)。');
      }
    } else {
      // Find specs to update
      const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);

      if (specUpdates.length > 0) {
        if (!json) {
          console.log('\n更新する仕様:');
          for (const update of specUpdates) {
            const status = update.exists ? 'update' : 'create';
            const capability = update.id;
            console.log(`  ${capability}: ${status}`);
          }
        }

        // Build the proposed updates before asking permission to apply them.
        // buildUpdatedSpec also reports content that the merge would drop, so
        // the confirmation must come after this preview.
        const prepared: Array<{
          update: SpecUpdate;
          rebuilt: string;
          counts: { added: number; modified: number; removed: number; renamed: number };
          outcome: SpecOutcome;
          noRequirementBlocks: boolean;
          unaccountedContent: string[];
          sourceFingerprint: string;
          sourceContentFingerprint: string;
          targetFingerprint: string;
          targetMovableFingerprint: string;
        }> = [];
        let prepareError: unknown;
        try {
          for (const update of specUpdates) {
            const sourceBeforeBuild = await fingerprintPath(update.source);
            const targetBeforeBuild = await fingerprintPath(update.target);
            const built = await buildUpdatedSpec(update, changeName!, { silent: true });
            const sourceAfterBuild = await fingerprintPath(update.source);
            const targetAfterBuild = await fingerprintPath(update.target);
            if (
              sourceBeforeBuild !== sourceAfterBuild ||
              targetBeforeBuild !== targetAfterBuild
            ) {
              throw new Error(
                `アーカイブがプレビューを準備している間に '${update.id}' の仕様入力が変更されました。`
              );
            }
            prepared.push({
              update,
              rebuilt: built.rebuilt,
              counts: built.counts,
              outcome: await decideSpecOutcome(
                update,
                built,
                skipValidation,
                retirementDeclared
              ),
              noRequirementBlocks: built.noRequirementBlocks,
              unaccountedContent: built.unaccountedContent,
              sourceFingerprint: sourceAfterBuild,
              sourceContentFingerprint: await fingerprintPortableContent(update.source),
              targetFingerprint: targetAfterBuild,
              targetMovableFingerprint: await fingerprintMovablePath(update.target),
            });
            specWarnings.push(...built.warnings);
          }
        } catch (err: unknown) {
          // A user may still decline spec updates and archive the change, as
          // before this preview existed. Defer the error until they accept.
          prepareError = err;
        }
        if (prepareError === undefined && !json) {
          for (const warning of specWarnings) {
            console.log(chalk.yellow(`⚠️  警告: ${warning}`));
          }
        }

        let shouldUpdateSpecs = true;
        if (!options.yes) {
          if (json) {
            throw new ArchiveBlockedError(
              'archive_confirmation_required',
              `Updating ${specUpdates.length} spec(s) requires confirmation: rerun with --yes.`,
              withStoreFlag(root, 'openspec archive <change-name> --json --yes')
            );
          }
          shouldUpdateSpecs = await confirmOrBlock(
            {
              message: '仕様の更新を続行しますか？',
              default: true
            },
            () =>
              new ArchiveBlockedError(
                'archive_confirmation_required',
                `${specUpdates.length}件の仕様を更新するには確認が必要ですが、標準入力から回答を読み取れませんでした。`,
                rerunCommand(root, changeName!, options)
              )
          );
          if (!shouldUpdateSpecs) {
            console.log('仕様更新をスキップしてアーカイブを続行します。');
          }
        }

        if (shouldUpdateSpecs) {
          // The confirmation may stay open while another editor changes a main
          // spec. Never apply the proposal built before the prompt to a newer
          // baseline: in particular, a stale retirement decision must not
          // delete a requirement added while the prompt was waiting.
          if (prepareError === undefined) {
            try {
              const currentRetirementMarker = readRetireCapabilitiesMarker(changeDir);
              if (
                currentRetirementMarker.declared !== retirementMarker.declared ||
                currentRetirementMarker.invalidReason !== retirementMarker.invalidReason
              ) {
                throw new Error(
                  `アーカイブが確認を待っている間に ${METADATA_FILENAME} の機能廃止許可が変更されました。`
                );
              }
              const currentUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
              const currentById = new Map(currentUpdates.map((update) => [update.id, update]));
              if (currentUpdates.length !== prepared.length) {
                throw new Error('アーカイブが確認を待っている間に変更の仕様が変わりました。');
              }
              for (const proposed of prepared) {
                const current = currentById.get(proposed.update.id);
                if (!current) {
                  throw new Error(
                    `アーカイブが確認を待っている間に '${proposed.update.id}' の仕様差分が変更されました。`
                  );
                }
                if (
                  (await fingerprintPath(current.source)) !== proposed.sourceFingerprint ||
                  (await fingerprintPath(current.target)) !== proposed.targetFingerprint
                ) {
                  throw new Error(
                    `アーカイブが確認を待っている間に '${proposed.update.id}' の仕様入力が変更されました。` +
                      'ファイルは変更していません。新しい内容を確認して再実行してください。'
                  );
                }
                const rebuilt = await buildUpdatedSpec(current, changeName!, { silent: true });
                const outcome = await decideSpecOutcome(
                  current,
                  rebuilt,
                  skipValidation,
                  retirementDeclared
                );
                if (
                  current.exists !== proposed.update.exists ||
                  rebuilt.rebuilt !== proposed.rebuilt ||
                  JSON.stringify(rebuilt.counts) !== JSON.stringify(proposed.counts) ||
                  outcome !== proposed.outcome
                ) {
                  throw new Error(
                    `アーカイブが確認を待っている間に本仕様 '${proposed.update.id}' が変更されました。` +
                      'ファイルは変更していません。新しい内容を確認して再実行してください。'
                  );
                }
              }
            } catch (error) {
              prepareError = error;
            }
          }

          if (prepareError !== undefined) {
            const message =
              prepareError instanceof Error ? prepareError.message : String(prepareError);
            if (json) {
              throw new ArchiveBlockedError(
                'archive_spec_update_failed',
                message,
                '変更の delta spec を修正して再実行してください。ファイルは変更されていません。'
              );
            }
            console.log(message);
            console.log('中止しました。ファイルは変更されませんでした。');
            process.exitCode = 1;
            return null;
          }

          // Validate every rebuilt spec before writing any of them, so a
          // late validation failure really does leave all targets unchanged.
          if (!skipValidation) {
            for (const p of prepared) {
              // A retirement was already put to the validator, and failed on
              // nothing but "no requirements" - there is no spec left to write,
              // so re-reporting that one error would just abort the fix (#1302).
              if (p.outcome !== 'write') continue;
              const specName = p.update.id;
              const report = await new Validator().validateSpecContent(specName, p.rebuilt);
              if (!report.valid) {
                // The dead end #1302 describes: the rebuilt spec is unwritable
                // for exactly one reason, and retiring the capability is the
                // fix - but only the author can authorise deleting the spec, so
                // the abort names the marker instead of just rejecting. Says so
                // only when the marker is the ONLY thing missing, so it never
                // sends someone after a marker that would not have helped.
                const retirementWouldFix =
                  !retirementDeclared &&
                  p.update.exists &&
                  p.counts.removed > 0 &&
                  (await isRetirementCandidate(p.update, p, false));
                const retirementHint = retirementWouldFix
                  ? `この変更により '${specName}' の最後の要件が削除されます。機能を廃止して仕様を削除するには、` +
                    `変更の ${METADATA_FILENAME} に \`retire_capabilities: true\` を追加し（そのファイルで必須の \`schema:\` と併記）、` +
                    `再実行してください。` +
                    (retirementMarker.invalidReason
                      ? ` 現在のマーカーは適用できません（${retirementMarker.invalidReason}）。`
                      : '')
                  : undefined;
                // The marker was set and retirement was still refused. Saying
                // nothing left the author who did exactly what the docs asked
                // back in the original dead end with no signal that their
                // marker had been read at all.
                // The author asked for a retirement and got the bare
                // validation abort. Name the lines that stood in the way.
                const refusalReason =
                  retirementDeclared &&
                  p.unaccountedContent.length > 0 &&
                  (await isRetirableSpec(specName, p.rebuilt))
                    ? `'${specName}' は retire_capabilities を宣言していますが、仕様にはマージが安全に扱えない内容があり、ファイルを削除すると次の内容も失われます: ` +
                      `${p.unaccountedContent.slice(0, 3).map((line) => `"${line}"`).join(', ')}` +
                      `${p.unaccountedContent.length > 3 ? `、ほか${p.unaccountedContent.length - 3}行` : ''}。` +
                      '`## Purpose` または正規の要件へ移動するか、仕様を手動で削除してください。'
                    : undefined;
                if (json) {
                  throw new ArchiveBlockedError(
                    'archive_spec_validation_failed',
                    `Rebuilt spec for '${specName}' failed validation. No files were changed.`,
                    refusalReason ??
                      retirementHint ??
                      `Run ${withStoreFlag(root, `openspec validate ${specName}`)} after fixing the change deltas.`
                  );
                }
                console.log(chalk.red(`\n再構築した仕様 ${specName} の検証エラー（変更は書き込みません）:`));
                for (const issue of report.issues) {
                  if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
                  else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
                }
                if (retirementHint) console.log(chalk.yellow(`  → ${retirementHint}`));
                if (refusalReason) console.log(chalk.yellow(`  → ${refusalReason}`));
                console.log('中止しました。ファイルは変更されませんでした。');
                process.exitCode = 1;
                return null;
              }
            }
          }

          // A legitimate concurrent archive cannot pass the exclusive claim,
          // while this catches an external process that created the final
          // destination during a confirmation prompt. Check before the first
          // spec mutation so a collision never strands a write or retirement.
          await assertArchiveDestinationAvailable(archivePath, archiveName);
          archiveClaim = await claimArchiveDestination(archivePath, archiveName);
          await assertArchiveDestinationAvailable(archivePath, archiveName);
          const mutations = prepared
            .filter(
              ({ outcome, counts }) =>
                outcome === 'retire' ||
                (outcome === 'write' &&
                  counts.added + counts.modified + counts.removed + counts.renamed > 0)
            )
            .map(({ update, outcome, rebuilt }) => ({
              update,
              outcome: outcome as 'write' | 'retire',
              rebuilt,
            }));
          const hasRetirements = mutations.some(({ outcome }) => outcome === 'retire');
          await assertDistinctMutationTargets(mutations);
          for (const proposed of prepared) {
            if (
              (await fingerprintPath(proposed.update.source)) !== proposed.sourceFingerprint ||
              (await fingerprintPath(proposed.update.target)) !== proposed.targetFingerprint
            ) {
              throw new Error(
                `アーカイブが適用する前に '${proposed.update.id}' の仕様入力が変更されました。` +
                  'ファイルは変更していません。新しい内容を確認して再実行してください。'
              );
            }
          }
          const specSnapshots = await captureSpecSnapshots(mutations);
          const specSnapshotsByTarget = new Map(
            specSnapshots.map((snapshot) => [snapshot.target, snapshot])
          );

          const mutationAttempts = new Set<string>();
          try {
            // All validations passed; write files and display counts
            const writeTotals = { added: 0, modified: 0, removed: 0, renamed: 0 };
            let wroteAny = false;
          for (const p of prepared) {
            // Deletions are deferred to the loop below.
            if (p.outcome !== 'write') continue;
            const { added, modified, removed, renamed } = p.counts;
            if (added + modified + removed + renamed === 0) {
              // Every operation was already synced: rewriting the file would
              // only churn normalization differences into it.
              continue;
            }
            await writeUpdatedSpec(p.update, p.rebuilt, p.counts, {
              silent: json,
              beforeMutate: async () => {
                if (
                  (await fingerprintSpecInputs(p.update)) !==
                  `${p.sourceFingerprint}\n${p.targetFingerprint}`
                ) {
                  throw new Error(
                    `アーカイブが書き込む前に '${p.update.id}' の仕様入力が変更されました。`
                  );
                }
                mutationAttempts.add(p.update.target);
              },
              // Cross-root paths must be absolute when a store is selected.
              ...(isStoreSelectedRoot(root) ? { displayPath: p.update.target } : {}),
            });
            wroteAny = true;
            writeTotals.added += added;
            writeTotals.modified += modified;
            writeTotals.removed += removed;
            writeTotals.renamed += renamed;
          }

          // Retirements run only after every write has succeeded. If any
          // later mutation fails, the snapshots below restore every target.
          for (const p of prepared) {
            if (p.outcome !== 'retire') continue;
            const { retired, resolvedPath, displacedPath } = await retireSpec(
              p.update,
              mainSpecsDir,
              {
                silent: json,
                deferDelete: true,
                beforeMutate: async () => {
                  if (retirementAuthorizationFingerprint === undefined) {
                    throw new Error(
              `${METADATA_FILENAME} の機能廃止許可を利用できません。`
                    );
                  }
                  await assertRetirementAuthorization(
                    changeDir,
                    retirementAuthorizationFingerprint
                  );
                  if (
                    (await fingerprintSpecInputs(p.update)) !==
                    `${p.sourceFingerprint}\n${p.targetFingerprint}`
                  ) {
                    throw new Error(
                      `'${p.update.id}' の仕様入力が、アーカイブで廃止する前に変更されました。`
                    );
                  }
                  mutationAttempts.add(p.update.target);
                },
                verifyDisplaced: async (displacedPath) => {
                  await assertRetirementAuthorization(
                    changeDir,
                    retirementAuthorizationFingerprint!
                  );
                  if (
                    (await fingerprintMovablePath(displacedPath)) !==
                    p.targetMovableFingerprint
                  ) {
                    throw new Error(
                      `アーカイブが機能廃止のために保護している間に、本仕様 '${p.update.id}' が変更されました。`
                    );
                  }
                },
                ...(isStoreSelectedRoot(root) ? { displayPath: p.update.target } : {}),
              }
            );
            if (!retired) continue;
            const retirementSnapshot = specSnapshotsByTarget.get(p.update.target);
            if (retirementSnapshot === undefined || displacedPath === undefined) {
              throw new Error(
                `機能廃止中に '${p.update.id}' の退避した本仕様を追跡できませんでした。`
              );
            }
            retirementSnapshot.displacedPath = displacedPath;
            retirementSnapshot.displacedFingerprint = p.targetMovableFingerprint;
            wroteAny = true;
            // A rename applied on the way to the retirement still happened;
            // folding every count in keeps the totals honest about the whole
            // delta.
            writeTotals.added += p.counts.added;
            writeTotals.modified += p.counts.modified;
            writeTotals.removed += p.counts.removed;
            writeTotals.renamed += p.counts.renamed;
            // Deleting a file is the one archive outcome a JSON consumer cannot
            // infer from the totals, so it is recorded the way every other
            // spec-merge divergence is. Purpose always goes with the file, so it
            // is named too rather than left to the reader to work out, and the
            // note carries the command that brings the file back.
            const lost = ['Purpose'];
            // Derived from the path that was unlinked, never rebuilt from the
            // capability id: on a case-insensitive filesystem the id and the
            // real directory can differ in case, and git is case-sensitive, so
            // an id-derived path is one git rejects.
            // `update.target` is built from the capability id, so on a
            // case-insensitive filesystem it can differ in case from the file
            // that was actually unlinked - and git is case-sensitive, so the
            // printed command is one git rejects. A capability directory
            // symlinked to a sibling has the same problem without leaving the
            // tree. `retiredPath` carries the resolved path, so it wins
            // whenever it disagrees, not only when it escapes.
            const unlinkedPath = resolvedPath ?? p.update.target;
            // Measured against the REAL root, so the platform's own
            // `/var` -> `/private/var` link does not read as an escape. A path
            // that genuinely sits outside stays absolute, which is what routes
            // it to prose guidance instead of a command git would reject.
            const realRoot = await fs.realpath(root.path).catch(() => root.path);
            const relativeToRoot = path.relative(realRoot, unlinkedPath);
            const insideRoot =
              relativeToRoot !== '' &&
              !relativeToRoot.startsWith('..') &&
              !path.isAbsolute(relativeToRoot);
            const deletedPath =
              isStoreSelectedRoot(root) || !insideRoot
                ? unlinkedPath
                : relativeToRoot.split(path.sep).join('/');
            // A command is offered only when pasting it where archive was run
            // would actually work. An absolute path here means the file did not
            // live under that directory - a selected store, or a symlinked
            // capability directory - and `git checkout HEAD -- <abs>` is rejected
            // from a different worktree however it is quoted, so that case gets
            // guidance instead of a command that cannot run. A path with no
            // portable shell spelling is handled the same way.
            //
            // Conditional on purpose, too: whether the file is in `HEAD` is not
            // something archive knows - a spec an earlier archive CREATED and
            // nobody has committed yet is not - and promising recovery is the one
            // claim this feature must not get wrong.
            const pasteablePath = path.isAbsolute(deletedPath)
              ? undefined
              : quoteForShell(`:(top)${deletedPath}`);
            const recovery = pasteablePath
              ? `コミット済みなら、次のコマンドで復元できます: git checkout HEAD -- ${pasteablePath}`
              : `${deletedPath} から削除されました。コミット済みなら、そのチェックアウトの履歴から復元してください。`;
            const retirementNote =
              `${p.update.id} - 機能を廃止し（すべての要件を削除、retire_capabilities を宣言）、${deletedPath} の本仕様を削除しました` +
              `。次のセクションも削除されています: ${lost.join(', ')}。` +
              recovery;
            specWarnings.push(retirementNote);
            // The "Retiring ..." line already told a human the file is gone; the
            // sections it took along, and how to get them back, are the parts
            // they cannot see from the path.
            if (!json) {
              console.log(`   ${recovery}`);
            }
            }

            specsUpdated = wroteAny;
            totals = writeTotals;
            if (!json) {
            console.log(
              `合計: + ${writeTotals.added}, ~ ${writeTotals.modified}, - ${writeTotals.removed}, → ${writeTotals.renamed}`
            );
            console.log(
              wroteAny
                ? '仕様の更新が完了しました。'
                : '仕様はすでに同期済みです。変更されたファイルはありません。'
            );
            }

            for (const proposed of prepared) {
              if (
                (await fingerprintPath(proposed.update.source)) !==
                proposed.sourceFingerprint
              ) {
                throw new Error(
                    `変更をアーカイブする前に '${proposed.update.id}' の仕様差分が変更されました。`
                );
              }
            }
            if (hasRetirements) {
              await assertRetirementAuthorization(
                changeDir,
                retirementAuthorizationFingerprint!
              );
            }
            const verifyArchivedDeltas = async (
              stagedSource?: string
            ): Promise<void> => {
              if (hasRetirements) {
                await assertRetirementAuthorization(
                  archivePath,
                  retirementAuthorizationFingerprint!,
                  // Archived changes are nested one level deeper than active
                  // changes, so the marker reader cannot resolve their schema.
                  // Exact content equality proves this is the authorization
                  // already validated at the active path.
                  { verifyMarker: false }
                );
                if (stagedSource) {
                  await assertRetirementAuthorization(
                    stagedSource,
                    retirementAuthorizationFingerprint!
                  );
                }
              }
              for (const proposed of prepared) {
                const archivedSource = path.join(
                  archivePath,
                  path.relative(changeDir, proposed.update.source)
                );
                if (
                  (await fingerprintPortableContent(archivedSource)) !==
                  proposed.sourceContentFingerprint
                ) {
                  throw new Error(
                    `最終的な移動中に、アーカイブ済みの '${proposed.update.id}' の仕様差分が変更されました。`
                  );
                }
                if (stagedSource) {
                  const stagedDelta = path.join(
                    stagedSource,
                    path.relative(changeDir, proposed.update.source)
                  );
                  if (
                    (await fingerprintPortableContent(stagedDelta)) !==
                    proposed.sourceContentFingerprint
                  ) {
                    throw new Error(
                      `フォールバックコピー中に、アクティブな '${proposed.update.id}' の仕様差分が変更されました。`
                    );
                  }
                }
              }
            };
            await moveDirectory(changeDir, archivePath, {
              verifyCopiedDestination: verifyArchivedDeltas,
            });
            changeArchived = true;
            await verifyArchivedDeltas();
            await finalizeRetirementBackups(specSnapshots, mainSpecsDir);
          } catch (error) {
            if (error instanceof MoveDestinationRetainedError) {
              changeArchived = true;
              try {
                await finalizeRetirementBackups(specSnapshots, mainSpecsDir);
              } catch (cleanupError) {
                throw new RetirementBackupsRetainedError(
                  `${error.message} ${
                    cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
                  }`
                );
              }
              throw error;
            }
            if (error instanceof RetirementBackupsRetainedError) throw error;
            const rollbackErrors: Error[] = [];
            try {
              await restoreSpecSnapshots(
                specSnapshots.filter(({ target }) => mutationAttempts.has(target))
              );
            } catch (rollbackError) {
              rollbackErrors.push(
                rollbackError instanceof Error
                  ? rollbackError
                  : new Error(String(rollbackError))
              );
            }
            if (changeArchived) {
              try {
                await moveDirectory(archivePath, changeDir);
                changeArchived = false;
              } catch (rollbackError) {
                rollbackErrors.push(
                  rollbackError instanceof Error
                    ? rollbackError
                    : new Error(String(rollbackError))
                );
              }
            }
            if (rollbackErrors.length > 0) {
              const original = error instanceof Error ? error.message : String(error);
              throw new Error(
                `${original} ロールバックにも失敗しました: ${rollbackErrors.map(({ message }) => message).join(' ')}`
              );
            }
            throw error;
          }
        }
      }
    }

      // The destination was checked before the merge, so anything claiming it now
    // appeared while we were working. Report that as the collision it is: a raw
    // ENOTEMPTY from rename would otherwise degrade to a bare `archive_error`.
      if (!changeArchived) {
        await assertArchiveDestinationAvailable(archivePath, archiveName);
        archiveClaim = await claimArchiveDestination(archivePath, archiveName);
        await assertArchiveDestinationAvailable(archivePath, archiveName);

        // Create archive directory if needed
        await fs.mkdir(archiveDir, { recursive: true });

        // Move change to archive (uses copy+remove on EPERM/EXDEV, e.g. Windows)
        await moveDirectory(changeDir, archivePath);
        changeArchived = true;
      }

      if (!json) {
        console.log(`変更 '${changeName}' を '${archiveName}' としてアーカイブしました。`);
      }

      return {
        change: changeName,
        archivedAs: archiveName,
        path: archivePath,
        specsUpdated,
        ...(totals ? { totals } : {}),
        ...(specWarnings.length > 0 ? { warnings: specWarnings } : {}),
      };
    } finally {
      if (archiveClaim) await releaseArchiveClaim(archiveClaim, claimPath).catch(() => undefined);
    }
  }

  private async selectChange(
    changesDir: string,
    root: ResolvedOpenSpecRoot,
    options: ArchiveOptions
  ): Promise<string | null> {
    const { select } = await import('@inquirer/prompts');
    const changeDirs = await listActiveChangeNames(changesDir);

    if (changeDirs.length === 0) {
      console.log('アクティブな変更が見つかりません。');
      return null;
    }

    // A picker needs a real terminal, and @inquirer's `select` writes ANSI
    // cursor escapes to stdout even when it is redirected — the same #1526
    // mechanism the confirm prompts were fixed for. When either stream is not a
    // TTY, refuse up front with the guidance the caught ExitPromptError would
    // give, rather than render an escape-spewing menu into a pipe or file.
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new ArchiveBlockedError(
        'archive_change_name_required',
        '変更名が必要です。一覧から選択できる端末がありません。',
        withStoreFlag(root, `openspec archive <change-name> ${rerunFlags(options).join(' ')}`)
      );
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id, path.resolve(changesDir, '..', '..'));
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: 'アーカイブする変更を選択してください',
        choices
      });
      return answer;
    } catch (error) {
      // Nobody to pick from the list: reporting "No change selected" and
      // exiting 0 told an agent the archive had succeeded when nothing
      // happened (#1479). The suggested rerun carries --yes because the same
      // caller cannot answer the confirmations further down either, and the
      // caller's own flags because dropping --skip-specs here would suggest a
      // rerun that merges the specs it was passed to leave alone.
      if (isNonInteractivePromptError(error)) {
        throw new ArchiveBlockedError(
          'archive_change_name_required',
          '変更名が必要ですが、標準入力から回答を読み取れませんでした。',
          withStoreFlag(root, `openspec archive <change-name> ${rerunFlags(options).join(' ')}`)
        );
      }
      // User cancelled (Ctrl+C)
      return null;
    }
  }
}
