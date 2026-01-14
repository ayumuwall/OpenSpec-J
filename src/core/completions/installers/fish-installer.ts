import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InstallationResult } from '../factory.js';

/**
 * Installer for Fish completion scripts.
 * Fish automatically loads completions from ~/.config/fish/completions/
 */
export class FishInstaller {
  private readonly homeDir: string;

  constructor(homeDir: string = os.homedir()) {
    this.homeDir = homeDir;
  }

  /**
   * Get the installation path for Fish completions
   *
   * @returns Installation path
   */
  getInstallationPath(): string {
    return path.join(this.homeDir, '.config', 'fish', 'completions', 'openspec.fish');
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
              'Fish は補完を自動で読み込むため、すぐに利用できます。',
            ],
          };
        }
        // File exists but content is different - this is an update
        isUpdate = true;
      } catch (error: any) {
        // File doesn't exist or can't be read, proceed with installation
        console.debug(`既存の補完ファイルを読み込めませんでした (${targetPath}): ${error.message}`);
      }

      // Ensure the directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Backup existing file if updating
      const backupPath = isUpdate ? await this.backupExistingFile(targetPath) : undefined;

      // Write the completion script
      await fs.writeFile(targetPath, completionScript, 'utf-8');

      // Determine appropriate message
      let message: string;
      if (isUpdate) {
        message = backupPath
          ? '補完スクリプトを更新しました（以前のバージョンはバックアップ済み）'
          : '補完スクリプトを更新しました';
      } else {
        message = 'Fish 用の補完スクリプトをインストールしました';
      }

      return {
        success: true,
        installedPath: targetPath,
        backupPath,
        message,
        instructions: [
          'Fish は ~/.config/fish/completions/ から補完を自動で読み込みます。',
          '補完はすぐに利用できます。シェル再起動は不要です。',
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: `補完スクリプトのインストールに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
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

      // Remove the completion script
      await fs.unlink(targetPath);

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
