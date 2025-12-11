## Why
Validation currently errors on changes without spec deltas, even when the change is intentionally proposal-only or tooling-only. This creates false negatives and noisy CI.

## What Changes
- Make change validation scope-aware: validate only artifacts that exist.
- Only error on "No deltas found" if spec delta files exist but parse to zero deltas.
- Keep archive stricter: if specs exist but parse to zero deltas, fail; allow `--skip-specs` for tooling-only changes.

## Impact
- Affected specs: cli-validate
- Affected code: `src/commands/validate.ts`, `src/core/validation/validator.ts`

