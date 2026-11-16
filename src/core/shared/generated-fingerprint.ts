import { createHash } from 'crypto';
import { RELEASED_GENERATED_FINGERPRINTS } from './released-generated-fingerprints.js';
import { findMarkerBlock } from '../../utils/file-system.js';

const GENERATED_VERSION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/**
 * 改行、BOM、YAML frontmatter 内の有効な生成バージョンを正規化する。
 * 利用者が編集しなくてもリリースやチェックアウトで変わる部分だけを扱い、
 * 自由記述の generatedBy は内容の一部として保持する。
 */
export function normalizeGeneratedContent(content: string): string {
  const normalized = content.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const frontmatter = normalized.match(/^---\n[\s\S]*?\n---(?:\n|$)/)?.[0];
  if (!frontmatter) return normalized;

  // 改行を越えないよう、\s ではなく [ \t] を使う。
  // m フラグ付きの \s* は各行頭から再走査し、空白の多い frontmatter で二乗時間になる。
  // YAML の字下げは空白とタブだけなので、一致する内容は変わらない。
  const versionLine =
    /^([ \t]*generatedBy:[ \t]*)(?:"([^"\n]+)"|'([^'\n]+)'|([^\s"'#]+))[ \t]*$/m;
  const normalizedFrontmatter = frontmatter.replace(
    versionLine,
    (
      line: string,
      prefix: string,
      doubleQuoted: string | undefined,
      singleQuoted: string | undefined,
      bare: string | undefined
    ) => {
      const version = doubleQuoted ?? singleQuoted ?? bare;
      return version && GENERATED_VERSION.test(version)
        ? `${prefix}"<generated-version>"`
        : line;
    }
  );
  return normalizedFrontmatter + normalized.slice(frontmatter.length);
}

/** 正規化した生成ファイル内容の短いハッシュ。 */
export function fingerprintGeneratedContent(content: string): string {
  return createHash('sha256')
    .update(normalizeGeneratedContent(content), 'utf8')
    .digest('hex')
    .slice(0, 16);
}

const BLOCK_START = '<!-- OPENSPEC:START -->';
const BLOCK_END = '<!-- OPENSPEC:END -->';

/**
 * 旧版が利用者の CLAUDE.md や AGENTS.md に追加した管理ブロックを、
 * マーカーごと取得する。なければ undefined。
 * 旧構成の整理と同じ、独立行のマーカー規則で検索する。
 */
export function extractOpenSpecBlock(content: string): string | undefined {
  return findMarkerBlock(content.replace(/\r\n/g, '\n'), BLOCK_START, BLOCK_END);
}

const RELEASED = new Set<string>(RELEASED_GENERATED_FINGERPRINTS);

/**
 * 正規化した内容が、公開済み OpenSpec の生成ファイルと一致するか判定する。
 * 一致すれば利用者の編集がないため、更新時に内容を失わず削除・置換できる。
 */
export function isReleasedGeneratedContent(content: string): boolean {
  return RELEASED.has(fingerprintGeneratedContent(content));
}

/**
 * 管理ブロックが公開済み版の生成内容と完全一致するか判定する。
 * 一致すれば、ブロックの削除で利用者の記述を失わない。
 */
export function hasReleasedOpenSpecBlock(content: string): boolean {
  const block = extractOpenSpecBlock(content);
  return block !== undefined && isReleasedGeneratedContent(block);
}
