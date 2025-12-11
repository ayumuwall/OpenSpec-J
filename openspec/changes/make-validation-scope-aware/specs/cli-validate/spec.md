## ADDED Requirements
### Requirement: Scope-Aware Change Validation
The validator SHALL validate only artifacts that exist for a change, avoiding errors for proposal-only or tooling-only changes.

#### Scenario: Proposal-only change
- **WHEN** a change contains `proposal.md` but has no `specs/` directory or contains no `*/spec.md` files
- **THEN** validate the proposal (Why/What sections)
- **AND** do not require or validate spec deltas

#### Scenario: Delta validation when specs exist
- **WHEN** a change contains one or more `specs/<capability>/spec.md` files
- **THEN** validate delta-formatted specs with existing rules (SHALL/MUST, scenarios, duplicates, conflicts)

## MODIFIED Requirements
### Requirement: Validation SHALL provide actionable remediation steps
Validation output SHALL include specific guidance to fix each error, including expected structure, example headers, and suggested commands to verify fixes.

#### Scenario: No deltas found in change
- **WHEN** validating a change that contains `specs/` with one or more `*/spec.md` files but the parser finds zero deltas
- **THEN** show error "No deltas found" with guidance:
  - Ensure `openspec/changes/{id}/specs/` has `.md` files that include delta headers
  - Use delta headers: `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements`
  - Each requirement must include at least one `#### Scenario:` block
  - Try: `openspec change show {id} --json --deltas-only` to inspect parsed deltas

