import * as fs from 'fs';
import path from 'path';

/**
 * How a check reads the files it inspects. Normally the disk. `update
 * --dry-run` passes the tree as it has planned it, so a step that reads what
 * an earlier step wrote sees the same thing it would in a real update.
 */
export interface FileView {
  exists(filePath: string): boolean;
  /** Throws, like `fs.readFileSync`, when the file is absent. */
  read(filePath: string): string;
  isDirectory(filePath: string): boolean;
  /**
   * このパスのリンクが指すフォルダの絶対パス。リンクでなければ undefined。
   * リンクを持たない view では省略できる。
   */
  linkTarget?(filePath: string): string | undefined;
  /** フォルダ直下の項目名。linkTarget と同様に省略可能。 */
  listDirectory?(dirPath: string): string[];
}

export const DISK_VIEW: FileView = {
  exists: (filePath) => fs.existsSync(filePath),
  read: (filePath) => fs.readFileSync(filePath, 'utf-8'),
  isDirectory: (filePath) => {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  },
  listDirectory: (dirPath) => fs.readdirSync(dirPath),
  linkTarget: (filePath) => {
    try {
      if (!fs.lstatSync(filePath).isSymbolicLink()) return undefined;
      return path.resolve(path.dirname(filePath), fs.readlinkSync(filePath));
    } catch {
      return undefined;
    }
  },
};
