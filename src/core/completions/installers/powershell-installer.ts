import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { FileSystemUtils } from '../../../utils/file-system.js';
import { InstallationResult } from '../factory.js';

/**
 * Installer for PowerShell completion scripts.
 * Works with both Windows PowerShell 5.1 and PowerShell Core 7+
 */
export class PowerShellInstaller {
  private readonly homeDir: string;

  /**
   * Markers for PowerShell profile configuration management
   */
  private readonly PROFILE_MARKERS = {
    start: '# OPENSPEC:START',
    end: '# OPENSPEC:END',
  };

  constructor(homeDir: string = os.homedir()) {
    this.homeDir = homeDir;
  }

  /**
   * ファイルの BOM（Byte Order Mark）を検査してエンコーディングを検出する。
   * Node.js の BufferEncoding と書き込み時に保持する生の BOM バイト列を返す。
   */
  private detectEncoding(buffer: Buffer): { encoding: BufferEncoding; bom: Buffer } {
    // UTF-16 LE BOM: FF FE
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return { encoding: 'utf16le', bom: Buffer.from([0xff, 0xfe]) };
    }
    // UTF-16 BE BOM: FE FF — Node では非サポート
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      throw new Error(
        'ファイルが UTF-16 BE でエンコードされています。これはサポートされていません。' +
          'UTF-8 または UTF-16 LE で保存し直してから再実行してください。',
      );
    }
    // UTF-8 BOM: EF BB BF
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return { encoding: 'utf-8', bom: Buffer.from([0xef, 0xbb, 0xbf]) };
    }
    // BOM なし → デフォルト UTF-8
    return { encoding: 'utf-8', bom: Buffer.alloc(0) };
  }

  /**
   * プロファイルファイルを読み込み、ラウンドトリップ書き込みのためにエンコーディング情報を保持する。
   * UTF-16 BE（Node 非サポート）の場合はエラーをスローする。
   */
  private async readProfileFile(filePath: string): Promise<{ content: string; encoding: BufferEncoding; bom: Buffer }> {
    const raw = await fs.readFile(filePath);
    const { encoding, bom } = this.detectEncoding(raw);
    const content = raw.subarray(bom.length).toString(encoding);
    return { content, encoding, bom };
  }

  /**
   * プロファイルファイルを書き込む。元の BOM とエンコーディングを保持する。
   */
  private async writeProfileFile(filePath: string, content: string, encoding: BufferEncoding, bom: Buffer): Promise<void> {
    const body = Buffer.from(content, encoding);
    await fs.writeFile(filePath, Buffer.concat([bom, body]));
  }

  /**
   * Get PowerShell profile path
   * Prefers $PROFILE environment variable, falls back to platform defaults
   *
   * @returns Profile path
   */
  getProfilePath(): string {
    // Check $PROFILE environment variable (set when running in PowerShell)
    if (process.env.PROFILE) {
      return process.env.PROFILE;
    }

    // Fall back to platform-specific defaults
    if (process.platform === 'win32') {
      // Windows: Documents/PowerShell/Microsoft.PowerShell_profile.ps1
      return path.join(this.homeDir, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
    } else {
      // macOS/Linux: .config/powershell/Microsoft.PowerShell_profile.ps1
      return path.join(this.homeDir, '.config', 'powershell', 'Microsoft.PowerShell_profile.ps1');
    }
  }

  /**
   * Get all PowerShell profile paths to configure.
   * On Windows, returns both PowerShell Core and Windows PowerShell 5.1 paths.
   * On Unix, returns PowerShell Core path only.
   */
  private getAllProfilePaths(): string[] {
    // If PROFILE env var is set, use only that path
    if (process.env.PROFILE) {
      return [process.env.PROFILE];
    }

    if (process.platform === 'win32') {
      return [
        // PowerShell Core 6+ (cross-platform)
        path.join(this.homeDir, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
        // Windows PowerShell 5.1 (Windows-only)
        path.join(this.homeDir, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
      ];
    } else {
      // Unix systems: PowerShell Core only
      return [path.join(this.homeDir, '.config', 'powershell', 'Microsoft.PowerShell_profile.ps1')];
    }
  }

  /**
   * Get the installation path for the completion script
   *
   * @returns Installation path
   */
  getInstallationPath(): string {
    const profilePath = this.getProfilePath();
    const profileDir = path.dirname(profilePath);
    return path.join(profileDir, 'OpenSpecCompletion.ps1');
  }

  /**
   * Backup an existing completion file if it exists
   *
   * @param targetPath - Path to the file to backup
   * @returns Path to the backup file, or undefined if no backup was needed
   */
  async backupExistingFile(targetPath: string): Promise<string | undefined> {
    try {
      await fs.access(targetPath);
      // File exists, create a backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${targetPath}.backup-${timestamp}`;
      await fs.copyFile(targetPath, backupPath);
      return backupPath;
    } catch {
      // File doesn't exist, no backup needed
      return undefined;
    }
  }

  /**
   * Generate PowerShell profile configuration content
   *
   * @param scriptPath - Path to the completion script
   * @returns Configuration content
   */
  private generateProfileConfig(scriptPath: string): string {
    return [
      '# OpenSpec シェル補完の設定',
      `if (Test-Path "${scriptPath}") {`,
      `    . "${scriptPath}"`,
      '}',
    ].join('\n');
  }

  /**
   * Configure PowerShell profile to source the completion script
   *
   * @param scriptPath - Path to the completion script
   * @returns true if configured successfully, false otherwise
   */
  async configureProfile(scriptPath: string): Promise<boolean> {
    const profilePaths = this.getAllProfilePaths();
    let anyConfigured = false;

    for (const profilePath of profilePaths) {
      try {
        const profileDir = path.dirname(profilePath);
        let profileExists = false;
        try {
          await fs.access(profilePath);
          profileExists = true;
        } catch (err: any) {
          if (err?.code !== 'ENOENT') {
            throw err;
          }
        }

        if (!profileExists) {
          if (!(await FileSystemUtils.canWriteFile(profilePath))) {
            throw new Error(`Path is not writable: ${profilePath}`);
          }
          await fs.mkdir(profileDir, { recursive: true });
        }

        let profileContent = '';
        let fileEncoding: BufferEncoding = 'utf-8';
        let fileBom: Buffer = Buffer.alloc(0);
        try {
          const file = await this.readProfileFile(profilePath);
          profileContent = file.content;
          fileEncoding = file.encoding;
          fileBom = file.bom;
        } catch (err: any) {
          // ファイルが存在しない場合は問題なし — UTF-8 で新規作成する。
          // その他の読み取りエラー（権限不足・非サポートエンコーディング等）→ このプロファイルをスキップ。
          if (err?.code === 'ENOENT') {
            // デフォルトのまま維持
          } else {
            console.warn(`警告: ${profilePath} をスキップ: ${err?.message ?? String(err)}`);
            continue;
          }
        }

        // Check if already configured
        const scriptLine = `. "${scriptPath}"`;
        if (profileContent.includes(scriptLine)) {
          continue; // Already configured, skip
        }

        // Add OpenSpec completion configuration with markers
        const openspecBlock = [
          '',
          '# OPENSPEC:START - OpenSpec completion (managed block, do not edit manually)',
          scriptLine,
          '# OPENSPEC:END',
          '',
        ].join('\n');

        const newContent = profileContent + openspecBlock;
        if (!(await FileSystemUtils.canWriteFile(profilePath))) {
          throw new Error(`Path is not writable: ${profilePath}`);
        }
        await this.writeProfileFile(profilePath, newContent, fileEncoding, fileBom);
        anyConfigured = true;
      } catch (error) {
        // Continue to next profile if this one fails
        console.warn(`警告: ${profilePath} を設定できませんでした: ${error}`);
      }
    }

    return anyConfigured;
  }

  /**
   * Remove PowerShell profile configuration
   * Used during uninstallation
   *
   * @returns true if removed successfully, false otherwise
   */
  async removeProfileConfig(): Promise<boolean> {
    const profilePaths = this.getAllProfilePaths();
    let anyRemoved = false;

    for (const profilePath of profilePaths) {
      try {
        // エンコーディング検出付きでプロファイルを読み込む
        let profileContent: string;
        let fileEncoding: BufferEncoding = 'utf-8';
        let fileBom: Buffer = Buffer.alloc(0);
        try {
          const file = await this.readProfileFile(profilePath);
          profileContent = file.content;
          fileEncoding = file.encoding;
          fileBom = file.bom;
        } catch (err: any) {
          if (err?.code === 'ENOENT') {
            continue; // プロファイルが存在しないため削除不要
          }
          console.warn(`警告: ${profilePath} を読み込めませんでした: ${err?.message ?? String(err)}`);
          continue;
        }

        // Remove OPENSPEC:START -> OPENSPEC:END block
        const startMarker = '# OPENSPEC:START';
        const endMarker = '# OPENSPEC:END';
        const startIndex = profileContent.indexOf(startMarker);

        if (startIndex === -1) {
          continue; // No OpenSpec block found
        }

        const endIndex = profileContent.indexOf(endMarker, startIndex);
        if (endIndex === -1) {
          console.warn(`警告: ${profilePath} に開始マーカーはありますが終了マーカーが見つかりません`);
          continue;
        }

        // Remove the block (including markers and surrounding newlines)
        const beforeBlock = profileContent.substring(0, startIndex);
        const afterBlock = profileContent.substring(endIndex + endMarker.length);

        // Clean up extra newlines
        const newContent = (beforeBlock.trimEnd() + '\n' + afterBlock.trimStart()).trim() + '\n';

        if (!(await FileSystemUtils.canWriteFile(profilePath))) {
          throw new Error(`Path is not writable: ${profilePath}`);
        }
        await this.writeProfileFile(profilePath, newContent, fileEncoding, fileBom);
        anyRemoved = true;
      } catch (error) {
        console.warn(`警告: ${profilePath} をクリーンアップできませんでした: ${error}`);
      }
    }

    return anyRemoved;
  }

  /**
   * Install the completion script
   *
   * @param completionScript - The completion script content to install
   * @returns Installation result with status and instructions
   */
  async install(completionScript: string): Promise<InstallationResult> {
    try {
      const targetPath = this.getInstallationPath();

      // Check if already installed with same content
      let isUpdate = false;
      try {
        const existingContent = await fs.readFile(targetPath, 'utf-8');
        if (existingContent === completionScript) {
          // Already installed and up to date
          return {
            success: true,
            installedPath: targetPath,
            message: '補完スクリプトは既にインストール済みです（最新）',
            instructions: [
              '補完スクリプトは既にインストール済みです（最新）。',
              '補完が動かない場合は、PowerShell を再起動するか . $PROFILE を実行してください。',
            ],
          };
        }
        // File exists but content is different - this is an update
        isUpdate = true;
      } catch (error: any) {
        // File doesn't exist or can't be read, proceed with installation
        console.debug(`既存の補完ファイルを読み込めませんでした (${targetPath}): ${error.message}`);
      }

      if (!(await FileSystemUtils.canWriteFile(targetPath))) {
        throw new Error(`Path is not writable: ${targetPath}`);
      }

      // Ensure the directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Backup existing file if updating
      const backupPath = isUpdate ? await this.backupExistingFile(targetPath) : undefined;

      // Write the completion script
      await fs.writeFile(targetPath, completionScript, 'utf-8');

      // Auto-configure PowerShell profile
      const profileConfigured = await this.configureProfile(targetPath);

      // Generate instructions if profile wasn't auto-configured
      const instructions = profileConfigured ? undefined : this.generateInstructions(targetPath);

      // Determine appropriate message
      let message: string;
      if (isUpdate) {
        message = backupPath
          ? '補完スクリプトを更新しました（以前のバージョンはバックアップ済み）'
          : '補完スクリプトを更新しました';
      } else {
        message = profileConfigured
          ? '補完スクリプトをインストールし、PowerShell プロファイルを自動設定しました'
          : 'PowerShell 用の補完スクリプトをインストールしました';
      }

      return {
        success: true,
        installedPath: targetPath,
        backupPath,
        profileConfigured,
        message,
        instructions,
      };
    } catch (error) {
      return {
        success: false,
        message: `補完スクリプトのインストールに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate user instructions for enabling completions
   *
   * @param installedPath - Path where the script was installed
   * @returns Array of instruction strings
   */
  private generateInstructions(installedPath: string): string[] {
    const profilePath = this.getProfilePath();

    return [
      '補完スクリプトをインストールしました。',
      '',
      `補完を有効にするには、PowerShell プロファイル (${profilePath}) に次を追加してください:`,
      '',
      '  # OpenSpec の補完を読み込む',
      `  if (Test-Path "${installedPath}") {`,
      `      . "${installedPath}"`,
      '  }',
      '',
      'その後、PowerShell を再起動するか . $PROFILE を実行してください。',
    ];
  }

  /**
   * Uninstall the completion script
   *
   * @param options - Optional uninstall options
   * @param options.yes - Skip confirmation prompt (handled by command layer)
   * @returns Uninstallation result
   */
  async uninstall(options?: { yes?: boolean }): Promise<{ success: boolean; message: string }> {
    try {
      const targetPath = this.getInstallationPath();

      // Check if installed
      try {
        await fs.access(targetPath);
      } catch {
        return {
          success: false,
          message: '補完スクリプトはインストールされていません',
        };
      }

      const targetDir = path.dirname(targetPath);
      if (!(await FileSystemUtils.canWriteFile(targetDir))) {
        throw new Error(`Path is not writable: ${targetDir}`);
      }

      // Remove the completion script
      await fs.unlink(targetPath);

      // Remove profile configuration
      await this.removeProfileConfig();

      return {
        success: true,
        message: '補完スクリプトを削除しました',
      };
    } catch (error) {
      return {
        success: false,
        message: `補完スクリプトのアンインストールに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
