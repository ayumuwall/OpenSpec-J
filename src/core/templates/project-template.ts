export interface ProjectContext {
  projectName?: string;
  description?: string;
  techStack?: string[];
  conventions?: string;
}

export const projectTemplate = (context: ProjectContext = {}) => `# ${context.projectName || 'Project'} Context

## Purpose
${context.description || '[プロジェクトの目的とゴールを記述してください]'}

## Tech Stack
${context.techStack?.length ? context.techStack.map(tech => `- ${tech}`).join('\n') : '- [主要な技術スタックを箇条書きで記載]\n- [例: TypeScript, React, Node.js]'}

## Project Conventions

### Code Style
[利用するコードスタイルやフォーマッタ、命名規則を記述]

### Architecture Patterns
[採用しているアーキテクチャや設計パターンを記録]

### Testing Strategy
[求められるテスト戦略やカバレッジ方針を説明]

### Git Workflow
[ブランチ戦略やコミット規約を記述]

## Domain Context
[AI アシスタントが理解しておくべきドメイン知識を共有]

## Important Constraints
[技術的・ビジネス的・規制上の制約を列挙]

## External Dependencies
[主要な外部サービスや API、システムを列挙]
`;
