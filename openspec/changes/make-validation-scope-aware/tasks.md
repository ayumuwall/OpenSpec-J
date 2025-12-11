## 1. Validator changes
- [ ] 1.1 Change `validateChangeDeltaSpecs` to only emit "Change must have at least one delta" when `specs/` exists and contains at least one `*/spec.md` but parsed total deltas is 0
- [ ] 1.2 Return valid (no error) when `specs/` directory is missing or has no `spec.md` files

## 2. CLI changes
- [ ] 2.1 In bulk validation, keep current behavior (call delta validator). Behavior remains correct after 1.1
- [ ] 2.2 Add a short INFO log in human-readable mode when a change has no `specs/` (optional)

## 3. Documentation
- [ ] 3.1 Update README and template: "Validation checks only existing artifacts. Proposal-only changes are valid without spec deltas."

## 4. Tests
- [ ] 4.1 Add test: proposal-only change passes validation without deltas
- [ ] 4.2 Add test: specs present but zero parsed deltas → ERROR
- [ ] 4.3 Add test: specs present with proper deltas → valid

