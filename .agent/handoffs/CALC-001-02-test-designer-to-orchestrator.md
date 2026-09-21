---
unit: CALC-001
from: test-designer
to: orchestrator
sequence: 02
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff CALC-001-02: test-designer → orchestrator

Reply to `.agent/handoffs/CALC-001-01-orchestrator-to-test-designer.md`. Gate 2 (TEST DESIGN) content for `CALC-001`, plus the `BOOT-001` traceability fix. Design only: no test code, no product code, no unit file edited, nothing written outside the repository. This agent runs on claude-sonnet-5 (Sonnet-family agent, no fallback involved).

## Context
- Matrix: `.agent/units/CALC-001.matrix.md` (new). Every AC-1 to AC-6 has at least one named row; 42 named rows: 21 new tests (unit 15, integration 2, regression 4) plus 21 existing `BOOT-001` tests mapped to AC-5 as guards (unit 15, integration 2, regression 4). Rows per AC: AC-1 3, AC-2 2, AC-3 6, AC-4 7, AC-5 23 (2 new + 21 existing), AC-6 1.
- New test files (all new, so no `kind: test-change` record is needed for them): `tests/unit/divide-by-zero.test.js`, `tests/integration/divide-by-zero-click.test.js`, `tests/regression/divide-by-zero.test.js`. The only modified test-path file is `tests/regression/REGISTRY.md` (four new rows, origin `CALC-001`, listed in the matrix "Regression impact"; keep the edit append-only; the orchestrator writes the decision record naming that path).
- Pre-fix values were confirmed by running the current core in memory (`node -e`, nothing written): `5 / 0 +` renders E=(empty), C=`5÷0+`; `5 / 0 + =` renders E=`5÷0+Error`, C=`NaN`. Post-fix expectations are derived from the fix rule and equal what the same prefix followed by `=` renders today (for example `2 + 3 / 0 =` gives `2+3÷0` / `Error`). The defect reproduces on the post-`BOOT-001` core, so RK-10 is cleared for design purposes. Reproducibility of the probe run is `UNVERIFIED` until the implementer's RED run exists (not committed).
- Part B done: `.agent/units/BOOT-001.matrix.md` now has the row for `throws a TypeError for a malformed input descriptor` under AC-1 (category invalid, inputs: state after `4 +` and 14 malformed descriptors, expectation: each call throws `TypeError` and the state still renders E=(empty), C=`4+`). Chosen AC-1 because it names the input-transition entry point and its "state passed in renders exactly as before" guarantee; no AC states the throw policy (it is D-003). Counts corrected: AC-1 5 to 6, unit 51 to 52, total 84 to 85; the "Not covered" bullet on the unrecognized-input policy rewritten; one amendment note added at the top. `git diff` shows only those lines changed (7 insertions, 4 deletions), no other row and no test name touched. Script check: 85 rows (unit 52, integration 20, regression 13), all names found in the test source, unit test count in the file is 52.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1 to AC-6 (unchanged).

## Relevant files
- `.agent/units/CALC-001.matrix.md` — the deliverable (RED reference tables with exact pre-fix and post-fix values; per-row TDD phase in column 7)
- `.agent/units/BOOT-001.matrix.md` — amended (traceability only)
- `calculator-core.js`, `tests/helpers/dom-stub.js`, `tests/unit/calculator-core.test.js`, `README.md` — read only

## Tests created / executed
- created: none (design only). executed: none as gates; only in-memory probes and read-only script checks of the matrices against the test source.
- `node .agent/tools/validate.mjs state` exits 0 (`state: OK`), run after both matrix edits.

## Results
Coverage summary by category (new rows): happy 3 (four-operator unit row, four-button page row, README-bullet row); boundary 5 (`0 / 0`, `0.0` divisor, `0.` divisor, two GUARD rows); error 2 (`5 / 0 +` unit and regression); state 5 (chained `2 + 3 / 0 *` unit and regression, continue-from-result, earlier-state immutability, `=` ignored after the fixed state); recovery 6 (digit, four operators, `AC`, `DEL`, page digit click, regression `=` then digit); invalid and security: none new, with stated reasons in "Not covered" (no new input surface, DOM write, storage or network; `BOOT-001` AC-7 rows run unmodified).

Expected RED on the unmodified post-`BOOT-001` core (matrix check V-3): unit file 13 failing and 2 passing (the two GUARD rows, which must also be green before the fix so they are not vacuous); integration file 2 failing; regression file 4 failing (three on Error versus `5÷0+`-style values, one on README text). Post-implementation minimum counts (V-1): unit 67, integration 22, regression 17.

## Decisions made
- Seventh column "Pre-fix result and TDD phase" added to the template's six (validator reads only columns 1 and 2). Phase codes: RED, GUARD, DOC-RED.
- AC-5 is mapped to existing test names (guard map, "which existing row guards which risk") plus two new GUARD rows, and to two tree/gate-level checks that are not named tests: V-1 (all three gates green with counts not lower than BOOT-001 plus the new rows) and V-2 (`git diff --name-status` over `tests` shows only additions plus the REGISTRY.md change; the same query `validate.mjs state` runs). A named test cannot prove "unmodified" without reading git.
- AC-6 is checked by a static README test (DOC-RED row) rather than left to review alone: the bullet must contain `Error`, the literal `5 ÷ 0 +` (U+00F7), a `chain` mention, and one of "as soon as", "immediately", "at once".

## Known risks
- AC-4 vacuity (important for the implementer and integration-tester): pre-fix, the recovery inputs `7`, `+`, `AC` and `DEL` after `5 / 0 +` already render the expected post-fix values (only `=` differs). Every AC-4 row therefore carries a precondition assertion that the state after `5 / 0 +` renders E=`5÷0`, C=`Error`, written before the recovery input; without it those rows would pass on the unfixed core and not be a RED.
- README row sequencing: the DOC-RED row keeps the regression gate red from the implementer's GREEN until the documenter's README edit. Dispatch the documenter (with the four tokens above) before the integration-tester's full-suite run, or record that single row as an expected red.
- RED for the integration and regression files: if they are written after the fix, prove RED with a scratch worktree at the pre-fix commit or the stub's in-memory `CALC_STUB_TRANSFORM` hook applied to `calculator-core.js`; do not claim a RED that was not run.
- The row "leaves the earlier state unchanged when an operator press resolves a divide-by-zero" is a design addition for the changed branch (RK-14 non-mutation); it has no AC sentence of its own and is mapped to AC-1. Re-label it if a reviewer prefers another home.

## Outstanding issues
- Flag to the planner/orchestrator (unit file owner): `.agent/units/CALC-001.md` "Required Tests" and "Relevant Files" still say the existing `tests/unit/calculator-core.test.js` and `tests/integration/dom-click.test.js` are "extended"; the orchestrator's new-files placement supersedes that text. I did not edit the unit file.
- Ambiguity notes (none blocks READY): AC-1 "leaves no pending operator" is observable only through the next input (pinned by the AC-4 `=` row, not a row of its own); AC-5 is gate/tree-level by nature (see decisions); AC-6 wording depends on the documenter (tokens above).
- Existing tests at risk: none expected to change. Guarded shared behavior is listed row by row in the matrix guard map (`=` rendering, chaining, operator replacement, continue-from-result, `AC`/`DEL`, Error recovery); if any `BOOT-001` expectation has to change, stop and raise it.
- Security review: expected `N/A` per the unit; the orchestrator confirms the CLAUDE.md §8 trigger list.

## Required next action
Orchestrator: verify Gate 2 by running `node .agent/tools/validate.mjs state`, then move `CALC-001` to `READY` and dispatch the implementer with `.agent/units/CALC-001.matrix.md`, telling it to write `tests/unit/divide-by-zero.test.js` first, run it on the unmodified core and record the pre-fix values from the matrix RED reference tables (13 failing, 2 passing) before touching `calculator-core.js`.
