import { describe, expect, it } from 'vitest';

import { serializeConfig } from '../../src/core/config-prompts.js';

describe('config prompts', () => {
  it('guides agents toward context they cannot infer from the codebase', () => {
    const config = serializeConfig({ schema: 'spec-driven' });

    expect(config).toContain('OpenSpec のアーティファクトとワークフローを導く制約');
    expect(config).toContain('エージェントがコードを読んでも分からない制約');
    expect(config).toContain('一般的なプロジェクト文書やコードから分かる事実は含めません');
    expect(config).toContain('設計とタスクは Windows、macOS、Linux を対象にする');
    expect(config).toContain('すべてのアーティファクトを日本語で書く');
    expect(config).toContain('スコープ外の内容を必ず明示する');
    expect(config).not.toContain('"Non-goals" セクションを必ず含める');
    expect(config).not.toContain('技術スタックを追加');
    expect(config).not.toContain('ドメイン: EC プラットフォーム');
  });
});
