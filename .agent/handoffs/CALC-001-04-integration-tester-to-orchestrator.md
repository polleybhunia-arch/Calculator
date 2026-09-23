---
unit: CALC-001
from: integration-tester
to: orchestrator
sequence: 04
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff CALC-001-04: integration-tester → orchestrator

Result: DONE. RED is genuine for all six new rows and matches the matrix reference tables exactly; no `BOOT-001` behavior drift; no production or existing-test file touched.

## Context
Executed dispatch `.agent/handoffs/CALC-001-03-orchestrator-to-integration-tester.md` on branch `agent/CALC-001-midchain-divide-by-zero` under D-006 (RED before the fix) and D-007 (registry append). Unit `CALC-001` stays `IN_PROGRESS`. Baseline before my work (direct run, scratch): integration 20 pass, regression 13 pass.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1, AC-2, AC-3, AC-4, AC-6 in the integration and regression layers. AC-5 is the unchanged `BOOT-001` suites (see V-2 below).

## Relevant files
- `tests/integration/divide-by-zero-click.test.js` (new, 2 rows)
- `tests/regression/divide-by-zero.test.js` (new, 4 rows)
- `tests/regression/REGISTRY.md` (4 rows appended, nothing else changed)
- `.agent/test-results/CALC-001/latest-integration-red.json`, `.agent/test-results/CALC-001/latest-regression-red.json` (machine evidence, committed)

## Commits (nothing pushed)
| SHA | Message |
|---|---|
| `95f2685f23485744c104d2af4bf6a57775805cb0` | `CALC-001: add RED integration and regression tests for operator-resolved divide-by-zero` (2 test files + REGISTRY.md) |
| `9af1c9acde9d713bfeb0ec6e4ce58f92214c06df` | `CALC-001: record RED evidence for integration and regression gates` (the two `latest-*-red.json`) |

This handoff file itself is not committed (the orchestrator commits handoffs). Working tree was clean after `9af1c9a` and after every probe.

## Tests created, mapped to ACs and registry
| File :: test title (verbatim from matrix) | AC | Workflow it protects | Registry row |
|---|---|---|---|
| integration :: shows Error on the page for each operator button that resolves a divide-by-zero | AC-2 | operator button (`+ - * /` after `5 / 0`) -> DOM layer -> core -> two display lines, fresh page per operator | n/a (integration) |
| integration :: starts a new calculation on the page when a digit is clicked after an operator-resolved Error | AC-4 | `5 / 0 +` shows Error (asserted first), then digit `7` starts fresh | n/a (integration) |
| regression :: README division by zero shows Error also when an operator resolves it | AC-1 | `5 / 0 +` gives `5÷0` / `Error` | row 1 |
| regression :: README division by zero shows Error also in the middle of a longer chain | AC-3 | `2 + 3 / 0 *` gives `2+3÷0` / `Error` | row 2 |
| regression :: README Error recovery works after a divide-by-zero resolved by an operator | AC-4 | Error asserted first; `=` ignored (no `NaN` on either line); digit starts fresh | row 3 |
| regression :: README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain | AC-6 | static README check, four tokens, missing bullet fails | row 4 |

Every AC-4 row asserts the precondition (expression `5÷0`, current `Error` after `5 / 0 +`) before any recovery input. All assertions are whole-pair `{ expression, current }` deep equality; the failure message carries the actual and the expected pair.

## Registry diff (`git diff` on `tests/regression/REGISTRY.md`: 4 insertions, 0 deletions, the 13 `BOOT-001` rows byte-for-byte unchanged)
Four rows appended, origin `CALC-001`, one per regression test above, behavior text taken from the matrix "Registry rows to add"; the notes column records: real page through the stub (rows 1-3), the AC-4 vacuity precondition (row 3), and that row 4 is a static README read, red until the documenter edits the README, never skips.

## Tests run (machine evidence, run on clean commit `95f2685`, `dirty=false`)
| Evidence file | Fact |
|---|---|
| `.agent/test-results/CALC-001/latest-integration-red.json` | exit 1, head `95f2685f...`, tests 22, pass 20, fail 2 (exactly the 2 new rows) |
| `.agent/test-results/CALC-001/latest-regression-red.json` | exit 1, head `95f2685f...`, tests 17, pass 13, fail 4 (exactly the 4 new rows) |

Counts equal the dispatch expectation (22/2 and 17/4). The evidence `outputTail` keeps only the last 40 lines, so it holds counts and the last assertion text, not every row's message. The per-row messages below come from a direct run of the same files on the same commit (scratch output, not committed) and are reproducible by re-running the gate.

## Per-row RED failure messages (all `AssertionError`, none a TypeError, import or missing-file error)
- integration "shows Error on the page for each operator button...": `boundary: operator button in "5 / 0 +": page shows {"expression":"","current":"5÷0+"}, expected {"expression":"5÷0","current":"Error"}` (the loop stops at the first failing operator; see Risks)
- integration "starts a new calculation on the page when a digit...": `precondition: after "5 / 0 +" and before any recovery click: page shows {"expression":"","current":"5÷0+"}, expected {"expression":"5÷0","current":"Error"}`
- regression "...shows Error also when an operator resolves it": `README: 5 / 0 + resolves the division: page shows {"expression":"","current":"5÷0+"}, expected {"expression":"5÷0","current":"Error"}`
- regression "...also in the middle of a longer chain": `README: 2 + 3 / 0 * resolves the division: page shows {"expression":"","current":"2+3÷0×"}, expected {"expression":"2+3÷0","current":"Error"}`
- regression "README Error recovery works after...": `precondition: after 5 / 0 + and before any recovery input: page shows {"expression":"","current":"5÷0+"}, expected {"expression":"5÷0","current":"Error"}`
- regression README bullet row: `README: the divide-by-zero bullet is missing the example 5 ÷ 0 +; a mention of chain; as soon as / immediately / at once. Bullet text: "- Division-by-zero shows `Error`"` (has the word Error, lacks the other three tokens, as the matrix predicted)

## Drift check (V-3)
Before writing tests, a scratch script drove the real page (`loadPage().press`) for `5 / 0 +`, `-`, `*`, `/`, `2 + 3 / 0 *` and `5 / 0 + =`, and read the equals reference for `5 / 0 =` and `2 + 3 / 0 =`. Every value matched the matrix RED reference table (including `5÷0+Error` / `NaN` for `5 / 0 + =`). No `BOOT-001` behavior drift; no RED row passed.

## In-memory fix probe (nothing written to disk, nothing committed; `git status` empty afterwards)
Method: `CALC_STUB_TRANSFORM` `{ file: 'calculator-core.js', find: 'const resolved = computeResult(committed);', count: 1, replace: <same line> + ' if (resolved.currentInput === ERROR_TEXT) { return { ...resolved, lastExpression: committed.history.join(\'\'), history: [], justCalculated: true }; }' }`. This is the "operator press resolving a zero divisor behaves like `=`" rule: the same fields `equals` sets, the pressed operator discarded. The stub's occurrence-count guard passed (exactly 1 occurrence). The scratch driver is `probe.js` in the session scratchpad, outside the repo.

| Probe | New files (6 rows) | Existing BOOT-001 `dom-click` + `readme-behavior` + `source-safety` (33 tests) |
|---|---|---|
| Minimal fix | 5 pass, 1 fail: only the README bullet row (expected until the documenter) | 33 pass, 0 fail |
| Extra, partial fix A: only `+` handled | 3 fail: four-button row, mid-chain row (`*`), README row | 33 pass |
| Extra, partial fix B: Error shown but operator left pending | 2 fail: the recovery row (`README: = is ignored while Error is shown: page shows {"expression":"Error","current":"NaN"}, expected {"expression":"5÷0","current":"Error"}`) and the README row | 33 pass |

So the two integration rows and the three behavior regression rows go green with a correct fix, the README row stays red, and the rows do catch a one-operator-only fix and a fix that leaves the operation pending. The minimal patch is an existence proof for the tests, not the implementer's design; the implementer writes the real fix in the core.

## Regression risks found (impact analysis)
- Shared code at risk: `chooseOperator` (operator-swap and continue-from-result branches), `computeResult` (used by operator press and `=`), the `equals` finalize step. The probe shows a fix that only adds a post-`computeResult` branch in `chooseOperator` leaves all 33 existing integration and regression tests green (RK-11, RK-12). The operator-swap guard `resetOnNextInput && !justCalculated` is not reached by the fixed state (it has `justCalculated: true`, and Error resets the base anyway), which is why the swap tests stay green.
- Historical behavior pinned but unchanged: `5 / 0 =`, baseline digit-after-Error, `5 / 0 = +` (existing rows, byte-for-byte unmodified).
- V-2 (AC-5 tree check): `git diff --name-status --no-renames 7626fd9..HEAD -- tests` shows exactly `A` for the two new test files and `M` for `tests/regression/REGISTRY.md` (the D-007 record covers it). No `M` or `D` for any `BOOT-001` test file or either helper.
- `KEY-001` will re-run these files unmodified; they use only `loadPage()`, `press()` and `REPO_ROOT`.

## Decisions made
None new. D-006 and D-007 applied as written.

## Known risks and judgment calls (all visible in the files)
- **Integration row 1 loops over four operators and stops at the first failure**, so its RED shows only the `+` case. The other three pre-fix values were verified separately by the drift check; partial fix A shows the row bites when only some operators are fixed.
- **README row, two implementation choices the matrix left open**: (1) bullet lines are trimmed and re-joined with one space, so a hard wrap inside `5 ÷ 0 +` does not hide the example (markdown reflows lines; this is the reader's view); (2) the next-bullet stop rule is the matrix's literal one (`/^[-*] /` on the raw line, blank line also ends the bullet). If the documenter or reviewer wants a stricter rule, that is a matrix change, not a test loosening.
- **Four RED rows fail only through the precondition or the first assertion**, as designed. The AC-4 rows are the ones that would be vacuous without it; partial fix B shows the `=` assertion is the one that catches an operator left pending.
- The `run-gate` `outputTail` is the last 40 lines only (see Tests run).
- Git prints "LF will be replaced by CRLF" warnings on this Windows checkout (autocrlf). The registry diff is still 4 insertions and 0 deletions; no content effect observed.

## Outstanding issues
- The README row is red by design until the documenter edits the README bullet (D-006 step 3). Documenter needs the four tokens: the word `Error`, the literal `5 ÷ 0 +` (÷ U+00F7, single spaces), a `chain` mention, and one of "as soon as" / "immediately" / "at once". The regression gate cannot be green until then; the implementer's GREEN handoff must record that this row is the only failing regression test.
- The matrix "Required Tests" text in the unit file that says the existing files are "extended" is superseded by the new-file placement (already flagged by the test-designer).

## UNVERIFIED
- Real browser: real click and touch events, CSS/visual `Error` styling, layout, real `file://` loading. The stub proves the click path, the markup contract and `textContent` rendering only.
- Post-fix values were observed only under the in-memory probe, not on a committed fix; the implementer's GREEN run is the machine evidence.
- Per-row RED messages are from a scratch run (same commit, same files), not stored in the evidence JSON beyond the last-40-line tail.

## Required next action
Dispatch `implementer` to write `tests/unit/divide-by-zero.test.js` (RED, 13 failing plus 2 GUARD), then the fix in `calculator-core.js` (GREEN), then REFACTOR, starting from commit `9af1c9a` on this branch; after the fix, `node .agent/tools/run-gate.mjs integration --unit CALC-001 --phase green` must show 22 passing and the regression gate exactly one failing test (the README bullet row) until the documenter edits `README.md`.
