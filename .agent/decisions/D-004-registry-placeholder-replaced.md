---
kind: test-change
id: D-004
unit: BOOT-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)); the change itself was made by integration-tester@claude-sonnet-5 in commits d9bd52b and 6281af7
---

# D-004 — REGISTRY.md placeholder row replaced by the real regression rows

## Context
`validate.mjs state` diffs `base_ref..head_ref` over `test_paths` (`tests`) and requires a
`kind: test-change` decision for any pre-existing file that is modified or deleted (CLAUDE.md §14).
`tests/regression/REGISTRY.md` existed at `base_ref` (`e02035bab13f5365a110b60a86ba3a8ae42063ed`,
the workflow scaffold baseline) with a single placeholder row and was modified by this unit.

## Decision
Accept the modification of `tests/regression/REGISTRY.md`. It is a registry document, not an
executable test, and the modification is the append the file was created for.

- **Old expectation**: one placeholder row,
  `_(none yet — BOOT-001 will add characterization tests for the README-documented behavior)_`,
  meaning "no regression tests are registered yet".
- **New expectation**: the placeholder row is removed and 13 rows are added, all with origin unit
  `BOOT-001`: the 8 names in `tests/regression/readme-behavior.test.js` and the 5 names in
  `tests/regression/source-safety.test.js`, each with the README or CLAUDE.md behavior it preserves.
- **Why the old row was not kept**: it stated that nothing was registered, which became false the
  moment the first regression test was added, and its own text names this unit as the one that
  replaces it.

## Alternatives considered
- Keep the placeholder row alongside the new rows. Rejected: a registry line that says "none yet"
  next to 13 registered tests is self-contradictory.
- Set `base_ref` to a later commit to hide the diff. Rejected: it would bypass the check rather than
  satisfy it.

## Consequences / residual risk
- No executable test was modified, deleted, skipped or weakened in this unit; `git diff --name-status
  e02035b..HEAD -- tests` shows only additions plus this one file modification. The reviewer should
  confirm that from the diff, not from this record.
- No test file path other than `tests/regression/REGISTRY.md` is covered by this decision.
