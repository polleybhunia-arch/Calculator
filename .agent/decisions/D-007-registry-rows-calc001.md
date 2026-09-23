---
kind: test-change
id: D-007
unit: CALC-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)); the change is planned in the CALC-001 matrix and will be made by integration-tester
---

# D-007 — REGISTRY.md rows appended for the CALC-001 regression tests

## Context
`validate.mjs state` requires a `kind: test-change` decision for any pre-existing file under `tests/`
that is modified between `base_ref` and `head_ref` (CLAUDE.md §14). `CALC-001` adds four regression
tests and CLAUDE.md §14 requires each to be registered in `tests/regression/REGISTRY.md`, so that one
existing file must be modified.

## Decision
Accept the append-only modification of `tests/regression/REGISTRY.md`.

- **Old expectation**: the file lists the 13 `BOOT-001` regression rows and no `CALC-001` rows.
- **New expectation**: the same 13 rows, byte for byte unchanged, plus four new rows with origin unit
  `CALC-001`, one per test in `tests/regression/divide-by-zero.test.js` (names in
  `.agent/units/CALC-001.matrix.md`, "Registry rows to add").
- **Why**: registering the new regression tests is required; no existing row or test may change.

## Alternatives considered
- Put the new rows in a second registry file. Rejected: the registry is one living specification.
- Skip registering. Rejected: violates CLAUDE.md §14.

## Consequences / residual risk
- Reviewers should confirm from `git diff` that the change to `tests/regression/REGISTRY.md` only adds
  lines. No executable test file is modified by this unit.
