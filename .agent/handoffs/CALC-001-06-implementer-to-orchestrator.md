---
unit: CALC-001
from: implementer
to: orchestrator
sequence: 06
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff CALC-001-06: implementer → orchestrator

model_attested: claude-sonnet-5 (Sonnet-family agent, no fallback involved).

## Context
Dispatch `.agent/handoffs/CALC-001-05-orchestrator-to-implementer.md` executed on branch `agent/CALC-001-midchain-divide-by-zero`. Strict TDD: RED unit tests first, then the minimal fix in `calculator-core.js`, then REFACTOR. Order per D-006. `script.js` needed **no** change. No existing test file or helper, `README.md`, or the integration-tester's files were touched.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1 to AC-5 are implemented and covered by tests; AC-6 (README bullet) is the documenter's step and its regression row is the one expected red row.

## Relevant files
- `calculator-core.js` — the fix (`chooseOperator`) plus the `finishCalculation` helper shared with `equals`
- `tests/unit/divide-by-zero.test.js` — new, 15 rows, titles verbatim from the matrix

## Tests created / executed
- created: `tests/unit/divide-by-zero.test.js` (15 tests; whole-pair `{ expression, current }` deep equality; precondition assertion "after `5 / 0 +` the core renders `5÷0` / `Error`" is the first assertion of every AC-4 row; own helpers defined inside the file)
- executed (all bound to the commit shown):
  - `.agent/test-results/CALC-001/latest-unit-red.json` — exit 1, 67 tests, 54 pass, 13 fail, head `41e8e4e2`
  - `.agent/test-results/CALC-001/latest-unit-green.json` — exit 0, 67/67, head `e0dd8fba`
  - `.agent/test-results/CALC-001/latest-integration-green.json` — exit 0, 22/22, head `e0dd8fba`
  - `.agent/test-results/CALC-001/latest-regression-green.json` — exit 1, 17 tests, 16 pass, 1 fail (README row only), head `e0dd8fba`
  - `.agent/test-results/CALC-001/latest-unit-refactor.json` — exit 0, 67/67, head `44b7a92b`
  - `.agent/test-results/CALC-001/latest-integration-refactor.json` — exit 0, 22/22, head `44b7a92b`
  - `.agent/test-results/CALC-001/latest-regression-refactor.json` — exit 1, 17 tests, 16 pass, 1 fail (README row only), head `44b7a92b`
  - `node --check calculator-core.js` and `node --check script.js`: both exit 0.
  - `node .agent/tools/validate.mjs state`: `state: OK`, exit 0 (run at `7e0fb8d`).

## Results

### Commits (in order, all on the unit branch, nothing pushed)
| Phase | SHA | Content |
|---|---|---|
| RED tests | `41e8e4e` | `tests/unit/divide-by-zero.test.js` |
| RED evidence | `e4137d2` | `latest-unit-red.json` |
| GREEN code | `e0dd8fb` | `calculator-core.js`, 5 lines added |
| GREEN evidence | `8d6277d` | unit, integration, regression `green` files |
| REFACTOR code | `44b7a92` | `finishCalculation` extraction, no behavior change |
| REFACTOR evidence | `7e0fb8d` | unit, integration, regression `refactor` files |
| Handoff | tip of branch | this file (`.agent/` only) |

### RED: 13 failing rows, why each fails (all assertion failures, none a TypeError or import error)
Expected 67 tests / 13 failing / 2 GUARD passing plus 52 existing passing: matches (54 pass includes the 2 GUARD rows and the 52 BOOT-001 tests). Message form: `core rendered {"expression":"","current":"<value>"}` against expected `{ expression: '5÷0', current: 'Error' }`.
1. `shows Error at once when an operator press resolves 5 divided by 0` — rendered current `5÷0+`, expression empty (AC-1).
2. `leaves the earlier state unchanged when an operator press resolves a divide-by-zero` — the returned state renders current `5÷0+`; the earlier-state assertion itself would already pass (AC-1).
3. `shows Error at once for each of the four operators pressed after 5 divided by 0` — first case `5 / 0 +` renders `5÷0+` (AC-2).
4. `shows the whole typed chain and Error when an operator resolves a divide-by-zero at the end of a chain` — `2+3÷0×` (AC-3).
5. `shows Error when an operator resolves 0 divided by 0` — `0÷0+` (AC-3).
6. `treats a divisor typed as 0.0 as zero when an operator resolves it` — `5÷0.0+` (AC-3).
7. `treats a divisor typed as 0. as zero when an operator resolves it` — first case `5 / 0 . +` renders `5÷0.+` (AC-3).
8. `shows Error when an operator resolves a divide-by-zero after continuing from a result` — the `4 + 8 =` precondition passes, then `12÷0+` (AC-3).
9. to 13. the five AC-4 rows (`starts a new calculation when a digit follows ...`, `starts from 0 when an operator follows ...`, `clears ... with AC`, `clears ... with DEL`, `ignores equals after an operator resolved a divide-by-zero`) — all fail on the precondition, rendered current `5÷0+` (AC-4). The recovery values after that are already the expected ones pre-fix, as the matrix warned.
GUARD rows `keeps chaining when an operator resolves a non-division with a zero operand` and `keeps chaining when an operator resolves a division by a non-zero number` pass before and after the fix.
Pre-fix values equal the matrix reference table for every RED row, so the defect survived the BOOT-001 extraction (RK-10 satisfied: no false RED, no behavior drift).

### The fix
In `chooseOperator`, after `computeResult(committed)`: if the result is `Error`, return the same finished state `equals` produces (`lastExpression` = the typed chain `committed.history.join('')`, `history` cleared, `justCalculated: true`, no pending operator) and never append the pressed operator. `committed.history.join('')` equals what `equals` computes as `history.join('') + currentInput`. Refactor extracted `finishCalculation(resolved, expression)`, now used by both `equals` and this branch (RK-12: what `=` renders is unchanged, pinned by the BOOT-001 rows which stay green).
- `resolved.currentInput === ERROR_TEXT` here can only come from `computeResult` (a state whose current input is `Error` is replaced by `createState()` at the top of `chooseOperator`), so no unrelated path is caught.
- RK-14 invariant "`resetOnNextInput && !justCalculated` implies a non-empty `history`" is untouched: the new state has `justCalculated: true` and an empty history, so it never meets the operator-swap branch.

### Minimality check (throwaway, in memory from stdin, nothing committed)
Pre-fix core = `git show bf27d9c:calculator-core.js` evaluated in a vm; compared with the working-tree core step by step over full internal state (JSON), first on the GREEN core and again on the REFACTORED core with identical results:
- 1,101,640 sequences: exhaustive lengths 1 to 4 over all 18 tokens (111,150), exhaustive lengths 5 to 6 over a 9-token alphabet `0 5 . + / * = DEL AC` (590,490), and 400,000 seeded random sequences (mulberry32 seed 20260921, lengths 5 to 16, half over all 18 tokens, half over the 9-token alphabet).
- **49,252 mismatching sequences, every one a sequence in which an operator press resolves a divide-by-zero**, identified independently of the fix (pending `/`, a divisor typed after it, divisor parses to zero) and cross-checked against the pre-fix outcome (`previousInput === 'Error'`). Zero violations of any kind: every step before the first such press was identical in the full state; every such press diverged; the state after that press deep-equalled the fixed core's `=` on the same prefix state and left no pending operator; and the rest of each sequence ended in the same state as the same sequence with that operator replaced by `=`.

### Mutation probes (throwaway edits, reverted with `git checkout`, tree clean afterwards)
Probes against `tests/unit/divide-by-zero.test.js`: keep the pressed operator in the trail (13 fail), over-broad `|| currentInput === '0'` (4 fail, includes the GUARD rows), only the resolved intermediate expression (1 fail), mutate the shared history in place (1 fail, the earlier-state row), leave operator plus previousInput pending (1 fail, the `=` row). One mutant survived: leaving only `operator: nextOperator` on the finished state. It is unobservable through any input (`equals` returns early when `previousInput` is `null` and an operator press on an `Error` state starts from a fresh state), so it is an equivalent mutant, not a test gap.

## Decisions made
- No new decision record needed: no test was changed, no design choice beyond D-003/D-005/D-006. Choice worth noting for the reviewer: GREEN was the inline 5-line branch, and the shared `finishCalculation` helper was introduced in REFACTOR (RK-12's intended clean fix).
- `tdd_refactor_skip`: none, refactor was done.

## Known risks
- The one row that deviates from the matrix wording: `ignores equals after an operator resolved a divide-by-zero`. The matrix says "RED directly (pre-fix after the first `=`: `5÷0+Error` / `NaN`)", but the dispatch requires the precondition first in every AC-4 row, so pre-fix it fails on the precondition (`5÷0+`) before reaching `=`. It is still a genuine RED for the right reason and the mutant that leaves a pending operator is caught by it, but the `NaN` value itself was not the asserted failure.
- The regression gate is **red on exactly one row until the documenter runs**: `README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain` (message: README bullet is missing the example `5 ÷ 0 +`, a mention of chain, and "as soon as / immediately / at once"; bullet text today is "Division-by-zero shows `Error`"). Every other regression test passes (16 of 17). This is the D-006 expected red row and the only failing test in the regression gate at GREEN and REFACTOR.
- Evidence is bound to earlier SHAs (`e0dd8fba`, `44b7a92b`), not to the branch tip, because evidence and handoff commits followed. Final gates must be re-run by the orchestrator on the final clean head after the documenter (as D-006 already states).
- Git prints LF-to-CRLF working-copy warnings on this Windows checkout (`core.autocrlf=true`); `calculator-core.js` is consistently CRLF before and after my edits.
- `UNVERIFIED`: real-browser behavior (RK-3); the minimality run is not reproducible from the repository (throwaway stdin script), only from the numbers above.

## Outstanding issues
none

## Required next action
Run the documenter to edit the README divide-by-zero bullet (tokens: `Error`, `5 ÷ 0 +`, a `chain` mention, "as soon as"), then run the final unit, integration and regression gates and `validate.mjs state`/`all` on the resulting clean head. Not yet true and expected: `regression` final is red until the README is updated.

<!-- implementer handoff: facts from run-gate files under .agent/test-results/CALC-001/ -->
