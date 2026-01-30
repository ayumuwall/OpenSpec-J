/**
 * コマンド生成の型
 *
 * ツール非依存のコマンド生成インターフェース。
 * 「何を生成するか」と「どう整形するか」を分離する。
 */

/**
 * ツール非依存のコマンドデータ。
 * ツール固有の整形なしでコマンド内容を表す。
 */
export interface CommandContent {
  /** コマンド識別子（例: 'explore', 'apply', 'new'） */
  id: string;
  /** 人間向けの表示名（例: 'OpenSpec Explore'） */
  name: string;
  /** コマンドの概要説明 */
  description: string;
  /** 分類カテゴリ（例: 'Workflow'） */
  category: string;
  /** タグ文字列の配列 */
  tags: string[];
  /** コマンドの指示内容（本文） */
  body: string;
}

/**
 * ツールごとの整形戦略。
 * 各 AI ツールが、このインターフェースでファイルパスと
 * フロントマター形式の要件を処理する。
 */
export interface ToolCommandAdapter {
  /** AIToolOption.value と一致するツール識別子（例: 'claude', 'cursor'） */
  toolId: string;
  /**
   * コマンドの相対ファイルパスを返す。
   * @param commandId - コマンド識別子（例: 'explore'）
   * @returns プロジェクトルートからの相対パス（例: '.claude/commands/opsx/explore.md'）
   */
  getFilePath(commandId: string): string;
  /**
   * フロントマターを含むファイル全体を整形する。
   * @param content - ツール非依存のコマンド内容
   * @returns 書き込み可能な完全なファイル内容
   */
  formatFile(content: CommandContent): string;
}

/**
 * コマンドファイル生成結果。
 */
export interface GeneratedCommand {
  /** プロジェクトルートからの相対パス */
  path: string;
  /** 完全なファイル内容（フロントマター + 本文） */
  fileContent: string;
}
