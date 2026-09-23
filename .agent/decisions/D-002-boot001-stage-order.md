---
kind: decision
id: D-002
unit: BOOT-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)), applying the matrix constraint and the tdd skill; flagged to the user for confirmation in the final report
---

# D-002 — BOOT-001 stage order: characterization safety net before the implementer

## Context
The default per-unit pipeline (CLAUDE.md §11, orchestrator contract) runs `implementer` first and
`integration-tester` afterwards. `BOOT-001` is a **characterization-then-extraction** unit. Its
matrix (`.agent/units/BOOT-001.matrix.md`, "Test files, layers and TDD phase") states that the
integration and regression safety-net files "must be written, run green against the **unmodified**
`script.js`, and committed before any extraction edit", and the `tdd` skill's characterization rule
says to pin current behavior *before* changing it. If `integration-tester` ran after the
implementer, the safety net would characterize already-refactored code and could not detect
extraction drift (RK-1).

Roles are also split by write policy: `implementer` writes the unit layer and production code;
`integration-tester` owns `tests/integration/**`, `tests/regression/**` and `tests/helpers/**`.
`integration-tester`'s stated precondition ("implementer's TDD evidence exists") cannot hold at the
start of this unit.

## Decision
For `BOOT-001` only, run the stages in this order, all on branch `agent/BOOT-001-core-extraction`:

1. `integration-tester` — **phase A**: `tests/helpers/dom-stub.js`, `tests/integration/dom-click.test.js`
   (every row except the RED row) and `tests/regression/readme-behavior.test.js`, written against the
   unmodified `script.js`; integration and regression gates recorded green; committed. Mutation
   probes prove the tests bite. **Phase B**: the RED-first rows (`"loads calculator-core.js before
   script.js in index.html"` and `tests/regression/source-safety.test.js`), RED evidence recorded,
   committed; `tests/regression/REGISTRY.md` rows added.
2. `implementer` — unit suite `tests/unit/calculator-core.test.js` RED, then `calculator-core.js`,
   thin `script.js`, `index.html`, core-API decision record, README Files section: GREEN, REFACTOR;
   the phase-A safety net stays green and the phase-B RED rows go green.
3. `documenter` if needed, then the normal TESTING / REVIEW / INTEGRATION path.

The orchestrator overrides the `integration-tester` precondition for phase A and says so in the
dispatch handoff. The two agents' write-ownership boundaries are unchanged.

## Alternatives considered
- **Default order (implementer, then integration-tester).** Rejected: the safety net would be
  written against refactored code, so it could not prove the extraction preserved behavior.
- **Implementer writes the safety net too.** Rejected: it violates the write-ownership split and
  the implementer's contract ("integration-layer tests belong to integration-tester").
- **Mark the whole unit `tdd_exempt: characterization`.** Rejected: the unit suite and the
  source-safety scan have a genuine RED; only the safety-net files are green-from-start, and the
  planner's TDD note says to log that in the unit Log instead of claiming an exemption.

## Consequences / residual risk
- Phase A evidence is a GREEN on unmodified code, not a RED; the reviewer must confirm the mutation
  probes (tdd skill).
- The expectations in the safety net were confirmed by the test-designer's throwaway run, which is
  not committed; reproducibility becomes machine evidence only with the phase-A green run.
- `.agent/gates.json` still lints `script.js` only (OQ-7, human action before gate 8).
