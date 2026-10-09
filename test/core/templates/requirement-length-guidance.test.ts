import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseSchema } from '../../../src/core/artifact-graph/schema.js';
import { MAX_REQUIREMENT_TEXT_LENGTH } from '../../../src/core/validation/constants.js';

// `openspec validate` flags requirement text over MAX_REQUIREMENT_TEXT_LENGTH,
// but the specs instruction never told agents the limit, so they kept writing
// requirements that tripped it (#1976). Keep the stated limit tied to the
// validator's constant so the two cannot drift.
describe('specs instruction requirement length (#1976)', () => {
  it('states the validator limit and how to stay under it', () => {
    const schema = parseSchema(
      fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'schemas', 'spec-driven', 'schema.yaml'),
        'utf-8'
      )
    );
    const instruction = schema.artifacts.find(a => a.id === 'specs')?.instruction ?? '';

    expect(instruction).toContain(`${MAX_REQUIREMENT_TEXT_LENGTH}文字以内`);
    expect(instruction).toContain('複数の振る舞いを含む要件は');
    // Existing requirements under MODIFIED must be copied whole (scenario-loss
    // validation rejects a split), and the limit is a warning that fails --strict.
    expect(instruction).toContain('`openspec validate --strict` は失敗する。');
    expect(instruction).toContain('MODIFIED では既存の要件ブロック全体を維持');
    // Strict CI catches new requirements before archive, and an existing long
    // requirement has a split path that keeps every scenario (#1976).
    expect(instruction).toContain('ADDED 要件と本仕様の長すぎる説明を警告');
    expect(instruction).toContain('見出しとすべてのシナリオを残し');
  });
});
