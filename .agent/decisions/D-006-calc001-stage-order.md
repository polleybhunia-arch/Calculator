---
kind: decision
id: D-006
unit: CALC-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)), applying CLAUDE.md section 14 and the CALC-001 matrix (V-3); flagged to the user in the final report
---

# D-006 — CALC-001 stage order: RED integration and regression tests before the fix, documenter after

## Context
The default pipeline runs `implementer` first and `integration-tester` afterwards. `CALC-001` is a
defect fix, and CLAUDE.md §14 requires a regression test "that fails without the fix". The unit's TDD
note and matrix (`.agent/units/CALC-001.matrix.md`, V-3) require every layer to be RED on the
unmodified post-`BOOT-001` core before `calculator-core.js` is edited. `integration-tester`'s own
contract says to write integration tests "RED first, then green with the implementation". If it ran
after the fix, the integration and regression files could only be shown to fail by mutating the fix
away, which is weaker evidence than a genuine RED.

The matrix also has one documentation row (AC-6, the README bullet) that stays red until the README is
edited. The `documenter` documents behavior that exists, verified against code and tests, so it cannot
run before the fix.

## Decision
For `CALC-001` only:
1. `integration-tester` writes `tests/integration/divide-by-zero-click.test.js` and
   `tests/regression/divide-by-zero.test.js` (RED), records RED evidence, adds the four
   `tests/regression/REGISTRY.md` rows, and commits. Its usual precondition "implementer's TDD
   evidence exists" is overridden here.
2. `implementer` writes `tests/unit/divide-by-zero.test.js` (RED, 13 failing plus 2 GUARD passing),
   then the fix in `calculator-core.js` (GREEN) and REFACTOR. The integration rows and the three
   behavior rows of the regression file go green with it. **The README-bullet regression row is an
   explicitly expected red row until step 3**; the implementer records that this is the only failing
   test in the regression gate.
3. `documenter` edits the README bullet using the four tokens in the matrix; that row goes green.
4. Orchestrator runs the final gates on the resulting clean head, then review.

## Alternatives considered
- Default order (implementer, then integration-tester). Rejected: weaker RED evidence for two layers.
- Documenter before the implementer. Rejected: it would document behavior that does not exist yet.
- Drop the README row and rely on review. Rejected: the AC is testable with one static check.

## Consequences / residual risk
- The regression gate cannot be green at the implementer's GREEN commit; final evidence is recorded
  only after step 3 on one clean `head_ref`.
- Roles and write ownership are unchanged.
