---
unit: CALC-001
from: orchestrator
to: implementer
sequence: 05
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff CALC-001-05: orchestrator → implementer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). implementer is a Sonnet agent (no fallback); attest your own model.

## Context
`CALC-001` is `IN_PROGRESS` on branch `agent/CALC-001-midchain-divide-by-zero` (stacked on the completed `BOOT-001`). The integration-tester has finished under decision `.agent/decisions/D-006-calc001-stage-order.md` (read it). I re-verified with tools: tree clean, no production or existing test file changed, and on the unmodified core integration is 22 tests (20 pass, 2 fail) and regression 17 tests (13 pass, 4 fail); every failure is an assertion showing the pre-fix value (`5÷0+`, `2+3÷0×`), and the AC-4 rows fail first on their precondition.

Spec: `.agent/units/CALC-001.md` (AC-1…AC-6; OQ-C1 and OQ-C2 confirmed by the user). Matrix: `.agent/units/CALC-001.matrix.md`. **Your rows are the unit table only: `tests/unit/divide-by-zero.test.js`, 15 rows, column 2 verbatim as the test title.** Accepted design rules you must follow: `.agent/decisions/D-003-core-api.md` and `.agent/decisions/D-005-layering-rule.md` (the fix lives in `calculator-core.js` only; no DOM, no second copy of state; one dispatch seam).

The defect: `chooseOperator` calls `computeResult`, which on a zero divisor sets `currentInput` to `Error` and clears the pending operator, but `chooseOperator` then continues unconditionally: it pushes the pressed operator symbol onto `history`, sets `previousInput` to `Error` and `operator` to the pressed operator. `equals` does not have the problem because it finalizes the display (`lastExpression`, `justCalculated`, cleared `history`) right after `computeResult`. **Fix rule (user-approved):** an operator press that triggers a divide-by-zero leaves exactly the state pressing `=` would have left at that point, and the pressed operator is discarded. So `5 / 0 +` renders expression `5÷0`, current `Error`; `2 + 3 / 0 *` renders `2+3÷0` / `Error`.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1 … AC-6 (AC-6, the README bullet, is the documenter's step after you).

## Relevant files
- `calculator-core.js` — the fix; `script.js` is expected to need **no** change (tell me if it does)
- `tests/unit/divide-by-zero.test.js` — **new**, yours
- `tests/integration/divide-by-zero-click.test.js`, `tests/regression/divide-by-zero.test.js`, `tests/regression/REGISTRY.md` — the integration-tester's; read only
- `tests/unit/calculator-core.test.js`, `tests/helpers/*` — read only, byte-for-byte unmodified (do not export helpers by editing them; define what you need inside your new file or add a **new** file under `tests/helpers/`)
- `.claude/skills/tdd/SKILL.md`, `CLAUDE.md` §4, §5, §14

## Tests created / executed
Existing evidence: `.agent/test-results/CALC-001/latest-integration-red.json`, `latest-regression-red.json`. No `unit` evidence yet.

## Results
n/a

## Decisions made
- D-006, D-007. Other design choices: yours to record only if non-obvious.

## Known risks
- **AC-4 vacuity**: four of the five recovery inputs render the same before and after the fix, so every AC-4 row must first assert the precondition "after `5 / 0 +` the core renders expression `5÷0`, current `Error`" **before** any recovery input, otherwise it passes without the fix and is not a RED. Read the matrix "AC notes".
- **Two GUARD rows** (`keeps chaining when an operator resolves a non-division with a zero operand`, `keeps chaining when an operator resolves a division by a non-zero number`) must pass before and after the fix. RED for the other 13 unit rows must be an assertion failure with the pre-fix values in the matrix reference table, never a `TypeError` or import error.
- The fix sits on the shared operator transition. `BOOT-001`'s 52 unit, 20 integration and 13 regression tests must stay green and unedited. Preserve the invariant "`resetOnNextInput && !justCalculated` implies a non-empty `history`" (the operator-swap branch uses `history.slice(0, -1)`); an accepted review note from BOOT-001.
- Sharing the finalize step between the operator path and `equals` is the intended clean fix (RK-12) but must not change what `=` renders.
- **Do not edit `README.md`**: the documenter does it next. Consequently the README-bullet regression row (`README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain`) is an **expected red row** until then (D-006). It must be the only failing test in the regression gate at your GREEN and REFACTOR runs; say so in your handoff and treat any other failure as yours to fix.
- Comments only for a non-obvious *why*; no regex literals containing a quote or `//` in shipped JS (the static-scan helper cannot parse them).

## Outstanding issues
none

## Required next action
Strict TDD on this branch, commit messages `CALC-001: <imperative summary>`, never push. Commit **code first, then run the gate on the clean commit, then commit the evidence**.
1. **RED**: write `tests/unit/divide-by-zero.test.js` (15 rows, verbatim names, whole-pair `{ expression, current }` deep equality, precondition assertion first in every AC-4 row). Commit. Run `node .agent/tools/run-gate.mjs unit --unit CALC-001 --phase red`. Expected: 67 tests, 13 failing, 2 GUARD passing plus the 52 existing passing. Read the output and state why each failing row fails (the pre-fix value in the message). Commit the evidence.
2. **GREEN**: the minimal fix in `calculator-core.js`. Commit. Run `unit --phase green` (67 of 67), `integration --phase green` (22 of 22), `regression --phase green` (17 tests, exactly one failing: the README row). Commit evidence.
3. **Minimality check (throwaway, not committed)**: evaluate the pre-fix core (`git show bf27d9c:calculator-core.js`, in memory) and the fixed core side by side over exhaustive short token sequences (lengths 1 to 4 over all 18 tokens, plus a few hundred thousand seeded random longer ones). Every mismatch must be a sequence in which an operator press resolves a divide-by-zero; report the mismatch count and confirm that class is the only one. Any other difference is a defect in your fix.
4. **REFACTOR** with everything green (except the one expected README row), then `unit --phase refactor`, `integration --phase refactor`, `regression --phase refactor`. Commit, then evidence. Also run `node --check calculator-core.js` and `node --check script.js` (the lint gate now covers both).
5. If a failure is not obvious after one attempt, stop guessing and return a request for `debugger` diagnosis with the run-file path.

Return `.agent/handoffs/CALC-001-06-implementer-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHAs per phase, run-gate evidence paths with one-line facts, why each RED row failed, the minimality-check result, decisions, anything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until the unit and integration gates are green, the regression gate's only failure is the README row, and every matrix-named unit test exists and passes (`node .agent/tools/validate.mjs state` = 0).
