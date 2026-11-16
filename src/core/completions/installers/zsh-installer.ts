import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { FileSystemUtils } from '../../../utils/file-system.js';
import { InstallationResult } from '../factory.js';
import { shellSingleQuote } from './shell-quote.js';

/**
 * zsh は ZDOTDIR があればそこから、なければ HOME から起動ファイルを読む。
 * XDG 形式の ZDOTDIR を使う環境では ~/.zshrc に書いても読まれない（#2138）。
 */
function zshrcDir(homeDir: string): string {
  const zdotdir = process.env.ZDOTDIR;
  // zsh は ZDOTDIR 内の ~ を展開しない。相対値を path.join で解決すると
  // プロジェクト内に誤って .zshrc を作るため、絶対パスのときだけ変更する。
  return zdotdir && path.isAbsolute(zdotdir) ? zdotdir : homeDir;
}

/** zsh が読む .zshrc の表示パス。ZDOTDIR で変わらなければ ~/.zshrc。 */
export function zshrcDisplayPath(homeDir: string = os.homedir()): string {
  const zshrcPath = path.join(zshrcDir(homeDir), '.zshrc');
  return zshrcPath === path.join(homeDir, '.zshrc') ? '~/.zshrc' : zshrcPath;
}

/**
 * Installer for Zsh completion scripts.
 * Supports both Oh My Zsh and standard Zsh configurations.
 */
export class ZshInstaller {
  private readonly homeDir: string;

  /**
   * Markers for .zshrc configuration management
   */
  private readonly ZSHRC_MARKERS = {
    start: '# OPENSPEC:START',
    end: '# OPENSPEC:END',
  };

  constructor(homeDir: string = os.homedir()) {
    this.homeDir = homeDir;
  }

  /**
   * Check if Oh My Zsh is installed
   *
   * @returns true if Oh My Zsh is detected via $ZSH env var or directory exists
   */
  async isOhMyZshInstalled(): Promise<boolean> {
    // First check for $ZSH environment variable (standard OMZ setup)
    if (process.env.ZSH) {
      return true;
    }

    // Fall back to checking for ~/.oh-my-zsh directory
    try {
      const stat = await fs.stat(this.ohMyZshRoot());
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Oh My Zsh exports its root as $ZSH; honor a custom location, or the
   * completion lands in a ~/.oh-my-zsh tree that nothing ever loads.
   */
  private ohMyZshRoot(): string {
    return process.env.ZSH || path.join(this.homeDir, '.oh-my-zsh');
  }

  /**
   * The custom dir is separately relocatable via $ZSH_CUSTOM.
   */
  private ohMyZshCustomDir(): string {
    return process.env.ZSH_CUSTOM || path.join(this.ohMyZshRoot(), 'custom');
  }

  /**
   * Get the appropriate installation path for the completion script
   *
   * @returns Object with installation path and whether it's Oh My Zsh
   */
  async getInstallationPath(): Promise<{ path: string; isOhMyZsh: boolean }> {
    const isOhMyZsh = await this.isOhMyZshInstalled();

    if (isOhMyZsh) {
      // Oh My Zsh custom completions directory
      return {
        path: path.join(this.ohMyZshCustomDir(), 'completions', '_openspec'),
        isOhMyZsh: true,
      };
    } else {
      // Standard Zsh completions directory
      return {
        path: path.join(this.homeDir, '.zsh', 'completions', '_openspec'),
        isOhMyZsh: false,
      };
    }
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
   * Get the path to .zshrc file
   *
   * @returns Path to .zshrc
   */
  private getZshrcPath(): string {
    return path.join(zshrcDir(this.homeDir), '.zshrc');
  }

  /**
   * 管理ブロックがあり得る .zshrc。現在の読み込み先と、
   * #2138 以前に ZDOTDIR があっても書き込んでいた ~/.zshrc を含む。
   */
  private getZshrcCandidates(): string[] {
    return [...new Set([this.getZshrcPath(), path.join(this.homeDir, '.zshrc')])];
  }

  /**
   * Generate .zshrc configuration content
   *
   * @param completionsDir - Directory containing completion scripts
   * @returns Configuration content
   */
  private generateZshrcConfig(completionsDir: string): string {
    return [
      '# OpenSpec シェル補完の設定',
      `fpath=(${shellSingleQuote(completionsDir)} $fpath)`,
      'autoload -Uz compinit',
      'compinit',
    ].join('\n');
  }

  /**
   * Configure .zshrc to enable completions
   * Only applies to standard Zsh (not Oh My Zsh)
   *
   * @param completionsDir - Directory containing completion scripts
   * @returns true if configured successfully, false otherwise
   */
  async configureZshrc(completionsDir: string): Promise<boolean> {
    // Check if auto-configuration is disabled
    if (process.env.OPENSPEC_NO_AUTO_CONFIG === '1') {
      return false;
    }

    try {
      const zshrcPath = this.getZshrcPath();
      const config = this.generateZshrcConfig(completionsDir);

      // Check write permissions
      const canWrite = await FileSystemUtils.canWriteFile(zshrcPath);
      if (!canWrite) {
        return false;
      }

      // Use marker-based update
      await FileSystemUtils.updateFileWithMarkers(
        zshrcPath,
        config,
        this.ZSHRC_MARKERS.start,
        this.ZSHRC_MARKERS.end
      );

      return true;
    } catch (error: any) {
      // Fail gracefully - don't break installation
      console.debug(`Unable to configure .zshrc for completions: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if .zshrc has OpenSpec configuration markers
   *
   * @returns true if .zshrc exists and has markers
   */
  private async hasZshrcConfig(zshrcPath: string = this.getZshrcPath()): Promise<boolean> {
    try {
      const content = await fs.readFile(zshrcPath, 'utf-8');
      return content.includes(this.ZSHRC_MARKERS.start) && content.includes(this.ZSHRC_MARKERS.end);
    } catch {
      return false;
    }
  }

  /**
   * Remove .zshrc configuration
   * Used during uninstallation
   *
   * @param zshrcPath - 整理する .zshrc。既定は zsh の読み込み先
   * @returns true if removed successfully, false otherwise
   */
  async removeZshrcConfig(zshrcPath: string = this.getZshrcPath()): Promise<boolean> {
    try {
      // Check if file exists
      try {
        await fs.access(zshrcPath);
      } catch {
        // File doesn't exist, nothing to remove
        return true;
      }

      // Read file content
      const content = await fs.readFile(zshrcPath, 'utf-8');

      // Check if markers exist
      if (!content.includes(this.ZSHRC_MARKERS.start) || !content.includes(this.ZSHRC_MARKERS.end)) {
        // Markers don't exist, nothing to remove
        return true;
      }

      // Remove content between markers (including markers)
      const lines = content.split('\n');
      const startIndex = lines.findIndex((line) => line.trim() === this.ZSHRC_MARKERS.start);
      const endIndex = lines.findIndex((line) => line.trim() === this.ZSHRC_MARKERS.end);

      if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        // Invalid marker placement
        return false;
      }

      // Remove lines between markers (inclusive)
      lines.splice(startIndex, endIndex - startIndex + 1);

      // Install puts the block at the top of the file followed by one blank
      // separator line; drop that line too so the file reads as it did before.
      // Everything else, including blank lines the user had at the top, is left as is.
      if (startIndex === 0 && lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
      }

      // Write back
      await fs.writeFile(zshrcPath, lines.join('\n'), 'utf-8');

      return true;
    } catch (error: any) {
      // Fail gracefully
      console.debug(`Unable to remove .zshrc configuration: ${error.message}`);
      return false;
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
      const { path: targetPath, isOhMyZsh } = await this.getInstallationPath();

      // Check if already installed with same content
      let isUpdate = false;
      try {
        const existingContent = await fs.readFile(targetPath, 'utf-8');
        if (existingContent === completionScript) {
          // 最新でも現在の .zshrc にブロックがあることを確認する。
          // #2138 以前に ZDOTDIR 環境で ~/.zshrc へ書いた構成を、再導入で修復する。
          const zshrcConfigured = isOhMyZsh
            ? false
            : await this.configureZshrc(path.dirname(targetPath));
          return {
            success: true,
            installedPath: targetPath,
            isOhMyZsh,
            zshrcConfigured,
            message: '補完スクリプトは既にインストール済みです（最新）',
            instructions:
              isOhMyZsh || zshrcConfigured
                ? [
                    '補完スクリプトは既にインストール済みで最新です。',
                    '補完が動かない場合は exec zsh を試してください。',
                  ]
                : this.generateInstructions(false, targetPath),
          };
        }
        // File exists but content is different - this is an update
        isUpdate = true;
      } catch (error: any) {
        // File doesn't exist or can't be read, proceed with installation
        console.debug(`Unable to read existing completion file at ${targetPath}: ${error.message}`);
      }

      if (!(await FileSystemUtils.canWriteFile(targetPath))) {
        throw new Error(`パスへ書き込めません: ${targetPath}`);
      }

      // Ensure the directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Backup existing file if updating
      const backupPath = isUpdate ? await this.backupExistingFile(targetPath) : undefined;

      // Write the completion script
      await fs.writeFile(targetPath, completionScript, 'utf-8');

      // Auto-configure .zshrc for standard Zsh only.
      // Oh My Zsh loads custom/completions and runs compinit itself.
      let zshrcConfigured = false;
      if (!isOhMyZsh) {
        zshrcConfigured = await this.configureZshrc(targetDir);
      }

      // Generate instructions (only if .zshrc wasn't auto-configured)
      let instructions = zshrcConfigured ? undefined : this.generateInstructions(isOhMyZsh, targetPath);

      // Add fpath guidance for Oh My Zsh installations
      if (isOhMyZsh) {
        const fpathGuidance = this.generateOhMyZshFpathGuidance(targetDir);
        if (fpathGuidance) {
          instructions = instructions ? [...instructions, '', ...fpathGuidance] : fpathGuidance;
        }
      }

      // Determine appropriate message based on update status
      let message: string;
      if (isUpdate) {
        message = backupPath
          ? '補完スクリプトを更新しました（以前のバージョンをバックアップしました）'
          : '補完スクリプトを更新しました';
      } else {
        message = isOhMyZsh
          ? 'Oh My Zsh 用の補完スクリプトをインストールしました'
          : zshrcConfigured
            ? '補完スクリプトをインストールし、.zshrc の設定が完了しました'
            : 'Zsh 用の補完スクリプトをインストールしました';
      }

      return {
        success: true,
        installedPath: targetPath,
        backupPath,
        isOhMyZsh,
        zshrcConfigured,
        message,
        instructions,
      };
    } catch (error) {
      return {
        success: false,
        isOhMyZsh: false,
        message: `補完スクリプトのインストールに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate Oh My Zsh fpath verification guidance
   *
   * @param completionsDir - Custom completions directory path
   * @returns Array of guidance strings, or undefined if not needed
   */
  private generateOhMyZshFpathGuidance(completionsDir: string): string[] | undefined {
    // One fpath entry per line, matched as a literal: a relocated $ZSH_CUSTOM
    // need not contain "custom/completions", and the path may hold characters
    // grep would otherwise read as a pattern. Single-quoted for the shell.
    const quotedDir = `'${completionsDir.replace(/'/g, `'\\''`)}'`;
    return [
      '注: Oh My Zsh は通常 custom/completions から補完を自動読み込みします。',
      `次を実行して ${completionsDir} が fpath に含まれることを確認してください:`,
      `  printf '%s\\n' $fpath | grep -F ${quotedDir}`,
      '',
      '見つからない場合、補完が動作しないことがあります。変更を確実に反映するため shell を再起動してください。',
    ];
  }

  /**
   * Generate user instructions for enabling completions
   *
   * @param isOhMyZsh - Whether Oh My Zsh is being used
   * @param installedPath - Path where the script was installed
   * @returns Array of instruction strings
   */
  private generateInstructions(isOhMyZsh: boolean, installedPath: string): string[] {
    if (isOhMyZsh) {
      return [
        '補完スクリプトを Oh My Zsh の補完ディレクトリにインストールしました。',
        'シェルを再起動するか exec zsh を実行してください。',
        '補完は自動的に有効になるはずです。',
      ];
    } else {
      const completionsDir = path.dirname(installedPath);
      const zshrcPath = this.getZshrcPath();

      return [
        '補完スクリプトを ~/.zsh/completions/ にインストールしました。',
        '',
        `補完を有効にするには、次を ${zshrcDisplayPath(this.homeDir)} に追加してください:`,
        '',
        `  # 補完ディレクトリを fpath に追加`,
        `  fpath=(${shellSingleQuote(completionsDir)} $fpath)`,
        '',
        '  # 補完システムを初期化',
        '  autoload -Uz compinit',
        '  compinit',
        '',
        'その後、シェルを再起動するか exec zsh を実行してください。',
        '',
        `追加前に、これらの行が ${zshrcPath} に既に存在しないか確認してください。`,
      ];
    }
  }

  /**
   * Uninstall the completion script
   *
   * @returns true if uninstalled successfully, false otherwise
   */
  async uninstall(): Promise<{ success: boolean; message: string }> {
    try {
      const { path: targetPath, isOhMyZsh } = await this.getInstallationPath();

      // Try to remove completion script
      let scriptRemoved = false;
      try {
        await fs.access(targetPath);
        await fs.unlink(targetPath);
        scriptRemoved = true;
      } catch {
        // Script not installed
      }

      // Try to remove .zshrc configuration (only for standard Zsh)
      let zshrcWasPresent = false;
      const cleanedZshrcs: string[] = [];
      const failedZshrcs: string[] = [];
      if (!isOhMyZsh) {
        for (const zshrcPath of this.getZshrcCandidates()) {
          if (await this.hasZshrcConfig(zshrcPath)) {
            zshrcWasPresent = true;
            if (await this.removeZshrcConfig(zshrcPath)) {
              cleanedZshrcs.push(zshrcPath);
            } else {
              failedZshrcs.push(zshrcPath);
            }
          }
        }
      }

      if (!scriptRemoved && !zshrcWasPresent) {
        return {
          success: false,
          message: '補完スクリプトはインストールされていません',
        };
      }

      const messages: string[] = [];
      if (scriptRemoved) {
        messages.push(`補完スクリプトを削除しました: ${targetPath}`);
      }
      const label = (zshrcPath: string) =>
        zshrcPath === path.join(this.homeDir, '.zshrc') ? '~/.zshrc' : zshrcPath;
      for (const zshrcPath of cleanedZshrcs) {
        messages.push(`${label(zshrcPath)} から OpenSpec の設定を削除しました`);
      }
      // ブロックが残ると補完も読み込まれるため、完全に削除できなかったことを伝える。
      for (const zshrcPath of failedZshrcs) {
        messages.push(
          `${label(zshrcPath)} の OpenSpec ブロックを削除できませんでした。# OPENSPEC:START から # OPENSPEC:END までの行を手動で削除してください`
        );
      }

      return {
        success: failedZshrcs.length === 0,
        message: messages.join('. '),
      };
    } catch (error) {
      return {
        success: false,
        message: `補完スクリプトのアンインストールに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if completion script is currently installed
   *
   * @returns true if the completion script exists
   */
  async isInstalled(): Promise<boolean> {
    try {
      const { path: targetPath } = await this.getInstallationPath();
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get information about the current installation
   *
   * @returns Installation status information
   */
  async getInstallationInfo(): Promise<{
    installed: boolean;
    path?: string;
    isOhMyZsh?: boolean;
  }> {
    const installed = await this.isInstalled();

    if (!installed) {
      return { installed: false };
    }

    const { path: targetPath, isOhMyZsh } = await this.getInstallationPath();

    return {
      installed: true,
      path: targetPath,
      isOhMyZsh,
    };
  }
}
