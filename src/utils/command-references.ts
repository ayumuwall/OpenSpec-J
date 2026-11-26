/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

// Type-only imports: a value import would close a module cycle
// (command-generation imports this file). Callers resolve the concrete
// capability and invocation style and pass them in.
import type { CommandSurfaceCapability } from '../core/command-surface.js';
import type { CommandInvocation } from '../core/command-generation/invocation.js';
// Value import of a pure, dependency-free helper: invocation.ts imports only
// `path` and a type, so this does not close the cycle the note above guards.
import { formatCommandInvocation } from '../core/command-generation/invocation.js';

/**
 * Rewrites the canonical `/opsx:<command>` references that command bodies and
 * skill templates are authored with into the form one tool actually registers
 * — `/opsx-<command>` for tools that name the command by filename,
 * `@opsx-<command>` for Amazon Q's prompt library.
 *
 * Only known command ids are rewritten, matching how
 * `transformToSkillReferences` leaves unrecognized references alone, so a
 * mistyped or invented `/opsx:<something>` is left as written rather than
 * silently reshaped into a command that does not exist either.
 *
 * @param text - The text containing command references
 * @param invocation - The tool's invocation, from resolveCommandInvocation()
 * @returns Text with command references spelled the tool's way
 *
 * @example
 * transformCommandInvocations('/opsx:new', { style: 'flat', prefix: '/' }) // '/opsx-new'
 * transformCommandInvocations('/opsx:new', { style: 'flat', prefix: '@' }) // '@opsx-new'
 */
export function transformCommandInvocations(
  text: string,
  invocation: CommandInvocation
): string {
  return text.replace(/\/opsx:([a-z-]+)/g, (match, commandId: string) =>
    commandId in COMMAND_TO_SKILL_NAME
      ? formatCommandInvocation(invocation, commandId)
      : match
  );
}

/**
 * Maps command short names to their skill names.
 * Keep in sync with WORKFLOW_TO_SKILL_DIR, which exists in both
 * src/core/profile-sync-drift.ts (exported) and src/core/init.ts (local copy).
 */
const COMMAND_TO_SKILL_NAME: Record<string, string> = {
  'explore': 'openspec-explore',
  'new': 'openspec-new-change',
  'continue': 'openspec-continue-change',
  'apply': 'openspec-apply-change',
  'update': 'openspec-update-change',
  'ff': 'openspec-ff-change',
  'sync': 'openspec-sync-specs',
  'archive': 'openspec-archive-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  'verify': 'openspec-verify-change',
  'onboard': 'openspec-onboard',
  'propose': 'openspec-propose',
  'router': 'openspec',
};

/**
 * Tools whose skill invocation uses a non-default prefix. The default is `/`
 * (e.g. `/openspec-propose`); Kimi Code invokes skills as `/skill:<name>` and
 * Codex CLI as `$<name>` — a `/<name>` form Codex does not recognize
 * (see docs/supported-tools.md).
 */
const SKILL_INVOCATION_PREFIX: Record<string, string> = {
  kimi: '/skill:',
  codex: '$',
};

/**
 * スキルを呼び出すスラッシュ構文が文書化されていないツールでは、自動マッチングまたは
 * 自然言語プロンプトを使う。SourceCraft Code Assistant は独立したコマンドファイルに
 * 対応するが、スキルには説明文によるマッチングを使う。Rovo Dev の `/skills` は
 * スキルの管理専用（docs/supported-tools.md を参照）。skills-only delivery で未登録の
 * コマンドを案内しないよう、これらのツールへのスキル参照は文章で表現する。
 */
const NATURAL_LANGUAGE_SKILL_TOOLS = new Set<string>(['gsd', 'rovodev', 'codeassistant']);

/**
 * Whether a tool references skills by natural language rather than a slash
 * command (see NATURAL_LANGUAGE_SKILL_TOOLS).
 */
export function usesNaturalLanguageSkillReferences(toolId: string): boolean {
  return NATURAL_LANGUAGE_SKILL_TOOLS.has(toolId);
}

function replaceCommandsWithNaturalLanguageSkillReferences(text: string): string {
  return text.replace(/\/opsx:([a-z-]+)/g, (match, commandId: string) => {
    const skillName = COMMAND_TO_SKILL_NAME[commandId];
    return skillName === undefined ? match : `${skillName} スキル`;
  });
}

function replaceCommandsWithSkillReferences(text: string, prefix: string): string {
  return text.replace(/\/opsx:([a-z-]+)/g, (match, commandId: string) => {
    const skillName = COMMAND_TO_SKILL_NAME[commandId];
    return skillName === undefined ? match : `${prefix}${skillName}`;
  });
}

/**
 * Keeps Codex's `$<name>` spelling first while making its canonical shared
 * `.agents` tree usable by agents that invoke the same skills with `/<name>`.
 */
export function transformToCodexCompatibleSkillReferences(text: string): string {
  return text.replace(/\/opsx:([a-z-]+)/g, (match, commandId: string) => {
    const skillName = COMMAND_TO_SKILL_NAME[commandId];
    return skillName === undefined
      ? match
      : `$${skillName}（Codex）、/${skillName}（その他の対応エージェント）`;
  });
}

/**
 * 全ツールが読む共有 .agents/skills/ では、/opsx:<command> を
 * 接頭辞のないスキル名（openspec-propose）へ変換する。
 * 呼び出し方は /、$、/skill: や自然文などツールごとに異なるため、
 * スキル名だけがすべてのツールで共通に使える表記となる。
 */
export function transformToSharedSkillReferences(text: string): string {
  return replaceCommandsWithSkillReferences(text, '');
}

/**
 * Transforms command references to skill references using the default `/`
 * invocation prefix. Converts `/opsx:<command>` patterns to
 * `/openspec-<skill>` so that generated skills do not reference commands
 * that were never generated. Used for channels that are not tied to one
 * tool (e.g. the skills.sh distribution); tool-targeted generation should
 * go through getSkillReferenceTransformer instead.
 *
 * Unknown command references are left unchanged.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to skill references
 *
 * @example
 * transformToSkillReferences('/opsx:apply') // returns '/openspec-apply-change'
 * transformToSkillReferences('Use /opsx:archive next') // returns 'Use /openspec-archive-change next'
 */
export function transformToSkillReferences(text: string): string {
  return replaceCommandsWithSkillReferences(text, '/');
}

/**
 * Returns the skill-reference transformer for a specific tool, honoring the
 * tool's documented skill invocation syntax (e.g. Kimi Code's
 * `/skill:openspec-propose`). Tools with no slash surface (e.g. Rovo Dev) get
 * natural-language references ("the openspec-propose skill"); everything else
 * falls back to the default `/openspec-*` form.
 *
 * @param toolId - The AI tool identifier (e.g. 'kimi', 'vibe', 'rovodev')
 * @returns A transformer converting `/opsx:*` references to skill invocations
 */
export function getSkillReferenceTransformer(toolId: string): (text: string) => string {
  if (usesNaturalLanguageSkillReferences(toolId)) {
    return replaceCommandsWithNaturalLanguageSkillReferences;
  }
  const prefix = SKILL_INVOCATION_PREFIX[toolId];
  if (prefix === undefined) {
    return transformToSkillReferences;
  }
  return (text: string) => replaceCommandsWithSkillReferences(text, prefix);
}

/**
 * 生成先に合うスキル参照の変換関数を選ぶ。2.0 はコマンドを生成しないため、
 * 他のワークフローも各ツールのスキル呼び出し形式で参照する。
 * 存在しない /opsx:* コマンドは案内しない。
 * @param toolId - AI ツールの識別子
 * @param _delivery - 互換用の設定値。現在は動作に影響しない
 * @param _capability - 互換用のコマンド対応情報。同じく使用しない
 * @param _invocation - 互換用の旧コマンド呼び出し形式。同じく使用しない
 * @returns generateSkillContent に渡す変換関数
 */
export function getTransformerForTool(
  toolId: string,
  _delivery: 'both' | 'skills' | 'commands',
  _capability: CommandSurfaceCapability,
  _invocation: CommandInvocation | undefined
): ((text: string) => string) | undefined {
  return toolId === 'codex'
    ? transformToCodexCompatibleSkillReferences
    : getSkillReferenceTransformer(toolId);
}
