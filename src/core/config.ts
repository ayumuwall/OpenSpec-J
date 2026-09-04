export const OPENSPEC_DIR_NAME = 'openspec';

export const OPENSPEC_SKILL_NAMES = [
  'openspec-explore',
  'openspec-new-change',
  'openspec-continue-change',
  'openspec-apply-change',
  'openspec-update-change',
  'openspec-ff-change',
  'openspec-sync-specs',
  'openspec-archive-change',
  'openspec-bulk-archive-change',
  'openspec-verify-change',
  'openspec-onboard',
  'openspec-propose',
] as const;

export const OPENSPEC_MARKERS = {
  start: '<!-- OPENSPEC:START -->',
  end: '<!-- OPENSPEC:END -->'
};

export interface OpenSpecConfig {
  aiTools: string[];
}

export interface AIToolOption {
  name: string;
  value: string;
  available: boolean;
  successLabel?: string;
  skillsDir?: string; // 例: '.claude' - Agent Skills 仕様の /skills サフィックスを付与する
  legacySkillsDirs?: string[]; // 検出時に参照し、置換後に移行する旧ルート
  globalSkillsDir?: string; // 例: '.minimax' - /skills サフィックスを付け、ユーザーのホームディレクトリを基準に解決する
  detectionPaths?: string[]; // 自動検出用に skillsDir を上書きするパス群。どれかが存在すれば検出対象とみなす
  setupNote?: string; // 生成ファイルをツールが認識する前に必要な手動設定。init/update後に表示する
  requiresIdeRestart?: boolean; // IDE やエディターのプロセスがスラッシュコマンドを読み込む場合は true。CLI は即座に認識するため再起動案内は不要（#1067 を参照）
}

export const AI_TOOLS: AIToolOption[] = [
  { name: 'Amazon Q Developer', value: 'amazon-q', available: true, successLabel: 'Amazon Q Developer', skillsDir: '.amazonq', requiresIdeRestart: true },
  // Antigravity は v1.20.5 で、ワークスペースのスキルとワークフローを `.agent` から
  // 共有の `.agents` ルートへ移した。`.agents` ルート自体は Codex、Zed、ベンダー非依存の
  // 対象と共有されるため、その存在だけでは Antigravity の利用を判断できない。
  // 検出には `.agent` と `.agents/workflows` を使う。
  { name: 'Antigravity', value: 'antigravity', available: true, successLabel: 'Antigravity', skillsDir: '.agents', legacySkillsDirs: ['.agent'], detectionPaths: ['.agent', '.agents/workflows'], requiresIdeRestart: true },
  { name: 'Auggie (Augment CLI)', value: 'auggie', available: true, successLabel: 'Auggie', skillsDir: '.augment' },
  { name: 'Bob Shell', value: 'bob', available: true, successLabel: 'Bob Shell', skillsDir: '.bob' },
  { name: 'Claude Code', value: 'claude', available: true, successLabel: 'Claude Code', skillsDir: '.claude' },
  { name: 'Cline', value: 'cline', available: true, successLabel: 'Cline', skillsDir: '.cline', requiresIdeRestart: true },
  { name: 'Command Code', value: 'command-code', available: true, successLabel: 'Command Code', skillsDir: '.commandcode' },
  { name: 'CodeArts', value: 'codeartsagent', available: true, successLabel: 'CodeArts', skillsDir: '.codeartsdoer' },
  { name: 'Codex', value: 'codex', available: true, successLabel: 'Codex', skillsDir: '.agents', legacySkillsDirs: ['.codex'], detectionPaths: ['.agents/skills', '.codex/skills'] },
  { name: 'Devin Desktop (formerly Windsurf)', value: 'devin', available: true, successLabel: 'Devin Desktop', skillsDir: '.devin', detectionPaths: ['.devin', '.windsurf'], requiresIdeRestart: true },
  { name: 'ForgeCode', value: 'forgecode', available: true, successLabel: 'ForgeCode', skillsDir: '.forge' },
  { name: 'CodeBuddy Code (CLI)', value: 'codebuddy', available: true, successLabel: 'CodeBuddy Code', skillsDir: '.codebuddy' },
  { name: 'Continue', value: 'continue', available: true, successLabel: 'Continue (VS Code / JetBrains / Cli)', skillsDir: '.continue', requiresIdeRestart: true },
  { name: 'CoStrict', value: 'costrict', available: true, successLabel: 'CoStrict', skillsDir: '.cospec', requiresIdeRestart: true },
  { name: 'Crush', value: 'crush', available: true, successLabel: 'Crush', skillsDir: '.crush' },
  { name: 'Cursor', value: 'cursor', available: true, successLabel: 'Cursor', skillsDir: '.cursor', requiresIdeRestart: true },
  { name: 'Factory Droid', value: 'factory', available: true, successLabel: 'Factory Droid', skillsDir: '.factory' },
  { name: 'Gemini CLI', value: 'gemini', available: true, successLabel: 'Gemini CLI', skillsDir: '.gemini' },
  { name: 'GitHub Copilot', value: 'github-copilot', available: true, successLabel: 'GitHub Copilot', skillsDir: '.github', detectionPaths: ['.github/copilot-instructions.md', '.github/instructions', '.github/workflows/copilot-setup-steps.yml', '.github/prompts', '.github/agents', '.github/skills', '.github/.mcp.json'], requiresIdeRestart: true },
  { name: 'Hermes Agent', value: 'hermes', available: true, successLabel: 'Hermes Agent', skillsDir: '.hermes', detectionPaths: ['.hermes', 'HERMES.md', '.hermes.md'], setupNote: 'Hermes は既定で ~/.hermes/skills/ からのみスキルを読み込みます。生成した OpenSpec スキルを Hermes が利用できるよう、このプロジェクトの .hermes/skills ディレクトリを ~/.hermes/config.yaml の skills.external_dirs に追加してください。' },
  { name: 'iFlow', value: 'iflow', available: true, successLabel: 'iFlow', skillsDir: '.iflow' },
  { name: 'Junie', value: 'junie', available: true, successLabel: 'Junie', skillsDir: '.junie', requiresIdeRestart: true },
  { name: 'Kilo Code', value: 'kilocode', available: true, successLabel: 'Kilo Code', skillsDir: '.kilocode', requiresIdeRestart: true },
  { name: 'Kimi Code', value: 'kimi', available: true, successLabel: 'Kimi Code', skillsDir: '.kimi-code', detectionPaths: ['.kimi-code', '.kimi'] },
  { name: 'Kiro', value: 'kiro', available: true, successLabel: 'Kiro', skillsDir: '.kiro', requiresIdeRestart: true },
  { name: 'Lingma', value: 'lingma', available: true, successLabel: 'Lingma', skillsDir: '.lingma', requiresIdeRestart: true },
  { name: 'MiniMax Code', value: 'minimax-code', available: true, successLabel: 'MiniMax Code', globalSkillsDir: '.minimax' },
  { name: 'Mistral Vibe', value: 'vibe', available: true, successLabel: 'Mistral Vibe', skillsDir: '.vibe' },
  { name: 'Oh My Pi', value: 'oh-my-pi', available: true, successLabel: 'Oh My Pi', skillsDir: '.omp' },
  { name: 'OpenCode', value: 'opencode', available: true, successLabel: 'OpenCode', skillsDir: '.opencode' },
  { name: 'Pi', value: 'pi', available: true, successLabel: 'Pi', skillsDir: '.pi' },
  { name: 'SourceCraft Code Assistant', value: 'codeassistant', available: true, successLabel: 'SourceCraft Code Assistant', skillsDir: '.codeassistant' },
  { name: 'Qoder', value: 'qoder', available: true, successLabel: 'Qoder', skillsDir: '.qoder', requiresIdeRestart: true },
  { name: 'Qwen Code', value: 'qwen', available: true, successLabel: 'Qwen Code', skillsDir: '.qwen' },
  { name: 'Rovo Dev CLI', value: 'rovodev', available: true, successLabel: 'Rovo Dev CLI', skillsDir: '.rovodev', detectionPaths: ['.rovodev/skills', '.rovodev'] },
  { name: 'Zoo Code', value: 'roocode', available: true, successLabel: 'Zoo Code', skillsDir: '.roo', requiresIdeRestart: true },
  { name: 'Trae', value: 'trae', available: true, successLabel: 'Trae', skillsDir: '.trae', requiresIdeRestart: true },
  { name: 'Zed Agent', value: 'zed', available: true, successLabel: 'Zed Agent', skillsDir: '.agents', detectionPaths: ['.zed', '.agents/skills'] },
  { name: 'ZCode', value: 'zcode', available: true, successLabel: 'ZCode', skillsDir: '.zcode' },
  // 共有の `.agents` ルートを読むアシスタント向けの、ベンダー非依存の対象。
  // フレームワークはスキル以外にも `.agents/` を使うため、ルートの存在だけでは
  // スキルの利用を判断できない。検出には `.agents/skills` を使う。
  // `.claude/` が Claude Code を示すのと同様に、そこへスキルを置くプロジェクトが
  // この対象に該当する。判断材料は OpenSpec 自身のファイルではなく、ユーザーの設定である。
  { name: 'Shared .agents skills', value: 'agents', available: true, successLabel: 'shared .agents skills', skillsDir: '.agents', detectionPaths: ['.agents/skills'] }
];

/**
 * ブランド変更後もスクリプトによる `--tools` 呼び出しが壊れないよう、廃止済みでも
 * 解決できるツール ID。Windsurf は 2026-06-02 に Devin Desktop へ改称され、設定
 * ディレクトリも `.windsurf/` から `.devin/` へ移った。そのため、
 * `--tools windsurf` は `devin` を設定する。
 */
export const TOOL_ID_ALIASES: Record<string, string> = {
  windsurf: 'devin',
};

/**
 * 現行の ID は変更せず、TOOL_ID_ALIASES を使ってツール ID を解決する。
 */
export function resolveToolIdAlias(toolId: string): string {
  return TOOL_ID_ALIASES[toolId] ?? toolId;
}
