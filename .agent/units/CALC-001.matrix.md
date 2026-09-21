# CALC-001 — Test Matrix

Every AC in the unit file must appear at least once. **Column 2 is a quoted test name (`"…"`) and becomes the literal title of a test in the test source**: `validate.mjs state` fails if a named test does not exist verbatim, or if an AC has no named row. Names must not contain double quotes (they also avoid apostrophes, backslashes, backticks and non-ASCII). Tests are designed from behavior, not from the implementation. Categories: happy, boundary, invalid, error, edge, security, state, recovery (omit a category only with a stated reason). This matrix adds a seventh column, "Pre-fix result and TDD phase", to the template's six: the validator reads only the first two columns, and the extra column carries the checkable RED evidence the dispatch asked for.

Designed by: test-designer@claude-sonnet-5 · 2026-09-21 · against the post-`BOOT-001` tree (branch `agent/BOOT-001-core-extraction`, HEAD `bf27d9c`; `calculator-core.js`, `script.js`, `index.html`, `README.md` unmodified since `BOOT-001` completed, verified with `git status`). Dispatch: `.agent/handoffs/CALC-001-01-orchestrator-to-test-designer.md`.

## Notation (same as `.agent/units/BOOT-001.matrix.md` "Notation")

- **Sequence**: space-separated tokens applied in order to a fresh state / freshly loaded page. Digits `0`–`9` and `.` are number inputs; `+ - * /` are operator inputs; `=` is equals; `AC` is clear; `DEL` is delete. Unit layer: one `applyInput` call per token with the descriptor of `.agent/decisions/D-003-core-api.md` (`{ type: 'number' | 'operator' | 'action', value }`; `=` is action `equals`, `AC` is `clear`, `DEL` is `delete`). Integration and regression layers: one `click` per token on the real button, through `loadPage().press(...)`.
- **E** = expression line (core `render(...).expression` / `#display-expression`). **C** = current line (`render(...).current` / `#display-current`). `E=(empty)` is the empty string. Every display assertion compares the whole `{ expression, current }` pair (deep equality), so a stray character on either line fails.
- **Glyphs (exact code points)**: divide `÷` U+00F7, times `×` U+00D7, operator minus `−` U+2212. Test titles use words instead of glyphs.
- "Fresh state / fresh page" means a new instance per test or per listed case; no state is shared between tests.
- **Pre-fix** = the post-`BOOT-001` `calculator-core.js` as committed today. **Post-fix** = the expectation in column 6. "Equals reference" = what the same prefix followed by `=` renders on today's core (the oracle of the fix rule "an operator press leaves exactly the state `=` would have left, and the pressed operator is discarded").

## Why new files (decided by the orchestrator, recorded here)

`validate.mjs state` (`checkTestChanges`, `base_ref..head_ref`) treats any modification or deletion of a pre-existing file under `tests/` as a changed test that needs a `kind: test-change` decision. Appending rows to `tests/unit/calculator-core.test.js` or `tests/integration/dom-click.test.js` would trigger that. Every new row below therefore lives in a **new file**, and the four `BOOT-001` test files plus `tests/helpers/dom-stub.js` and `tests/helpers/source-scan.js` must stay byte-for-byte unmodified (AC-5). The one unavoidable modification is `tests/regression/REGISTRY.md` (four new rows, origin `CALC-001`; the orchestrator writes its decision record). New test files may define their own small helpers or add a **new** file under `tests/helpers/`; they must not export helpers by editing the existing unit file. The unit file's "Required Tests" section still says "extended" for the two existing files; that text is superseded by this placement (flagged in the handoff).

## Test files, layers, owners and TDD phase

| File (all new) | Layer | Suggested owner | Rows | Expected on the unmodified post-`BOOT-001` core |
|---|---|---|---|---|
| `tests/unit/divide-by-zero.test.js` | unit | implementer | 15 | 13 rows RED (fail for the reason in column 7), 2 rows GUARD (pass before and after the fix) |
| `tests/integration/divide-by-zero-click.test.js` | integration | integration-tester | 2 | 2 rows RED |
| `tests/regression/divide-by-zero.test.js` | regression | integration-tester | 4 | 3 rows RED (README behavior through clicks), 1 row DOC-RED (README text; fails until the documenter's edit) |

Phase codes used in column 7: **RED** = must fail on the pre-fix core for the stated reason, pass after the fix; **GUARD** = must pass on the pre-fix core and keep passing (a safety net against an over-broad fix, written and confirmed green before the fix so it is not vacuous); **DOC-RED** = fails until `README.md` is updated, independent of the core.

## Verification of expectations (independence of oracle)

Every value below was obtained two ways. (1) Hand-derived from the AC text and the README arithmetic: an expression line is the typed tokens concatenated with display glyphs (`2 + 3 / 0` types `2+3÷0`), the AC states most values literally (AC-1 to AC-4), and `2+3÷0` for the chained case is the user-confirmed resolution of OQ-C1. (2) Confirmed by executing today's `calculator-core.js` in memory (`node -e`, `require('./calculator-core.js')`, nothing written to the repository): the **pre-fix** values by running each sequence as listed, and the **post-fix** values by running the same prefix followed by `=` (the equals reference) and, for recovery, `5 / 0 =` followed by the same follow-up input. All hand-derived values matched. No fixed core exists yet, so no post-fix value was observed from fixed code; they are derived from the fix rule and the `=` oracle, which `BOOT-001`'s rows pin literally. The run is not committed, so its reproducibility is `UNVERIFIED` until the implementer's RED run (machine evidence) exists, the same caveat `BOOT-001` carried.

### RED reference: pre-fix versus post-fix values

| Sequence | Pre-fix E | Pre-fix C | Post-fix E | Post-fix C | Equals reference on today's core |
|---|---|---|---|---|---|
| `5 / 0 +` | (empty) | `5÷0+` | `5÷0` | `Error` | `5 / 0 =` gives `5÷0` / `Error` |
| `5 / 0 -` | (empty) | `5÷0−` | `5÷0` | `Error` | same |
| `5 / 0 *` | (empty) | `5÷0×` | `5÷0` | `Error` | same |
| `5 / 0 /` | (empty) | `5÷0÷` | `5÷0` | `Error` | same |
| `2 + 3 / 0 *` | (empty) | `2+3÷0×` | `2+3÷0` | `Error` | `2 + 3 / 0 =` gives `2+3÷0` / `Error` |
| `0 / 0 +` | (empty) | `0÷0+` | `0÷0` | `Error` | `0 / 0 =` gives `0÷0` / `Error` |
| `5 / 0 . 0 +` | (empty) | `5÷0.0+` | `5÷0.0` | `Error` | `5 / 0 . 0 =` gives `5÷0.0` / `Error` |
| `5 / 0 . +` and `5 / . +` | (empty) | `5÷0.+` (both) | `5÷0.` | `Error` | `5 / 0 . =` and `5 / . =` give `5÷0.` / `Error` |
| `4 + 8 = / 0 +` | (empty) | `12÷0+` | `12÷0` | `Error` | `4 + 8 = / 0 =` gives `12÷0` / `Error` |

Recovery after `5 / 0 +` (the AC-4 sequence). Pre-fix, only `=` differs: **the first four inputs render the same values before and after the fix, so those rows can only go RED through the precondition assertion "the state after `5 / 0 +` renders E=`5÷0`, C=`Error`"**. That assertion is therefore part of every AC-4 row, and the implementer must confirm RED on it (expected message: actual C `5÷0+`, expected `Error`).

| Next input after `5 / 0 +` | Pre-fix E | Pre-fix C | Post-fix E | Post-fix C | Equals reference (`5 / 0 =` then the same input) |
|---|---|---|---|---|---|
| `7` | (empty) | `7` | (empty) | `7` | same |
| `+` | (empty) | `0+` | (empty) | `0+` | same (`-` gives `0−`, `*` gives `0×`, `/` gives `0÷`) |
| `AC` | (empty) | `0` | (empty) | `0` | same |
| `DEL` | (empty) | `0` | (empty) | `0` | same |
| `=` | `5÷0+Error` | `NaN` | `5÷0` | `Error` | `5 / 0 = =` gives `5÷0` / `Error` |

## Matrix — unit (`tests/unit/divide-by-zero.test.js`, pure core, no DOM)

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result (post-fix) | Pre-fix result and TDD phase |
|---|---|---|---|---|---|---|
| AC-1 | "shows Error at once when an operator press resolves 5 divided by 0" | unit | error | Fresh state; `5 / 0 +` | E=`5÷0`, C=`Error` (whole-pair equality, so the pressed `+` appears in neither line) | RED. Pre-fix E=(empty), C=`5÷0+`; fails on C |
| AC-1 | "leaves the earlier state unchanged when an operator press resolves a divide-by-zero" | unit | state | s1 = the state after `5 / 0`; s2 = apply(s1, operator `+`); render s2, then render s1 again | render(s2): E=`5÷0`, C=`Error`. render(s1) still E=(empty), C=`5÷0`. Fails if the new zero-divisor branch edits the argument or its shared `history` array in place (RK-14; the same non-mutation guarantee as `BOOT-001` AC-1, now exercised on the changed branch) | RED. Pre-fix render(s2) is E=(empty), C=`5÷0+`; the s1 assertion already passes, the s2 assertion fails |
| AC-2 | "shows Error at once for each of the four operators pressed after 5 divided by 0" | unit | happy | Fresh state per case: `5 / 0 +`, `5 / 0 -`, `5 / 0 *`, `5 / 0 /` | Each case E=`5÷0`, C=`Error` (the rule is the operator position, not one operator; the pressed operator is discarded even when it is `/`) | RED. Pre-fix each E=(empty) and C=`5÷0+`, `5÷0−`, `5÷0×`, `5÷0÷` respectively |
| AC-3 | "shows the whole typed chain and Error when an operator resolves a divide-by-zero at the end of a chain" | unit | state | Fresh state; `2 + 3 / 0 *` (the pending `2+3` resolves to 5 on the way, then `5 / 0` fails) | E=`2+3÷0`, C=`Error`. The full typed expression, not the resolved intermediate: `5÷0` would be wrong (OQ-C1, user-confirmed) | RED. Pre-fix E=(empty), C=`2+3÷0×` |
| AC-3 | "shows Error when an operator resolves 0 divided by 0" | unit | boundary | Fresh state; `0 / 0 +` | E=`0÷0`, C=`Error` (a zero dividend must not exempt a zero divisor) | RED. Pre-fix E=(empty), C=`0÷0+` |
| AC-3 | "treats a divisor typed as 0.0 as zero when an operator resolves it" | unit | boundary | Fresh state; `5 / 0 . 0 +` | E=`5÷0.0`, C=`Error` (the divisor is kept as typed in the expression line) | RED. Pre-fix E=(empty), C=`5÷0.0+` |
| AC-3 | "treats a divisor typed as 0. as zero when an operator resolves it" | unit | boundary | Fresh state per case: (a) `5 / 0 . +`; (b) `5 / . +` (a bare point after the operator starts the operand `0.`) | Both cases E=`5÷0.`, C=`Error` (`0.` parses to zero, exactly as it does for `=` today) | RED. Pre-fix both E=(empty), C=`5÷0.+` |
| AC-3 | "shows Error when an operator resolves a divide-by-zero after continuing from a result" | unit | state | Fresh state; `4 + 8 =` (assert E=`4+8`, C=`12` first), then `/ 0 +` | After `/ 0 +`: E=`12÷0`, C=`Error` (the continue-from-result path, not the plain chain path) | RED. The `4 + 8 =` assertion passes pre-fix; after `/ 0 +` pre-fix E=(empty), C=`12÷0+` |
| AC-4 | "starts a new calculation when a digit follows a divide-by-zero resolved by an operator" | unit | recovery | Fresh state; `5 / 0 +` (assert E=`5÷0`, C=`Error` first); then `7`; then `+ 1 =` | After `7`: E=(empty), C=`7`. After `+ 1 =`: E=`7+1`, C=`8` (no residue of the error) | RED through the precondition only. Pre-fix precondition fails (C=`5÷0+`); the values after `7` and after `+ 1 =` are already the expected ones pre-fix |
| AC-4 | "starts from 0 when an operator follows a divide-by-zero resolved by an operator" | unit | recovery | Fresh state per case: `5 / 0 +` (assert precondition first), then (a) `+` then `3 =`; (b) `-`; (c) `*`; (d) `/` | (a) after `+`: E=(empty), C=`0+`; after `3 =`: E=`0+3`, C=`3`. (b) E=(empty), C=`0−`. (c) E=(empty), C=`0×`. (d) E=(empty), C=`0÷`. The Error is cleared first and the new operator starts from 0 (RK-14: no operator swap against a stale trail) | RED through the precondition only; the post-input values equal the pre-fix ones |
| AC-4 | "clears a divide-by-zero resolved by an operator with AC" | unit | recovery | Fresh state; `5 / 0 +` (assert precondition first); `AC`; then `4 + 4 =` | After `AC`: E=(empty), C=`0`. After `4 + 4 =`: E=`4+4`, C=`8` | RED through the precondition only |
| AC-4 | "clears a divide-by-zero resolved by an operator with DEL" | unit | recovery | Fresh state; `5 / 0 +` (assert precondition first); `DEL`; then `7` | After `DEL`: E=(empty), C=`0`. After `7`: E=(empty), C=`7` | RED through the precondition only |
| AC-4 | "ignores equals after an operator resolved a divide-by-zero" | unit | state | Fresh state; `5 / 0 +`; `=`; then a second `=` | After the first `=`: E=`5÷0`, C=`Error`. After the second `=`: unchanged, E=`5÷0`, C=`Error`. This is the only observable of "leaves no pending operator" (AC-1 parenthetical): a leftover pending operator would make `=` recompute against `Error` | RED directly. Pre-fix after the first `=`: E=`5÷0+Error`, C=`NaN` |
| AC-5 | "keeps chaining when an operator resolves a non-division with a zero operand" | unit | boundary | Fresh state per case: (a) `5 + 0 +`, then `1 =`; (b) `5 * 0 +`, then `1 =` | (a) after `5 + 0 +`: E=(empty), C=`5+0+`; after `1 =`: E=`5+0+1`, C=`6`. (b) after `5 * 0 +`: E=(empty), C=`5×0+`; after `1 =`: E=`5×0+1`, C=`1`. Catches a fix that flags any zero operand or any zero result instead of only a zero divisor | GUARD. Pre-fix values are identical (verified) |
| AC-5 | "keeps chaining when an operator resolves a division by a non-zero number" | unit | boundary | Fresh state per case: (a) `0 / 5 +`, then `3 =`; (b) `5 / 0 . 5 +`, then `1 =` | (a) after `0 / 5 +`: E=(empty), C=`0÷5+`; after `3 =`: E=`0÷5+3`, C=`3` (zero dividend, result 0, no Error). (b) after `5 / 0 . 5 +`: E=(empty), C=`5÷0.5+`; after `1 =`: E=`5÷0.5+1`, C=`11` (divisor below 1 is not zero) | GUARD. Pre-fix values are identical (verified) |

## Matrix — integration (`tests/integration/divide-by-zero-click.test.js`, real `index.html` scripts through `tests/helpers/dom-stub.js`)

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result (post-fix) | Pre-fix result and TDD phase |
|---|---|---|---|---|---|---|
| AC-2 | "shows Error on the page for each operator button that resolves a divide-by-zero" | integration | happy | Fresh page per case: click `5 / 0 +`, `5 / 0 -`, `5 / 0 *`, `5 / 0 /` (each operator button by its `data-operator`) | Each case E=`5÷0`, C=`Error` read back from `#display-expression` and `#display-current`. Proves the fix reaches the user through the DOM layer for every operator button | RED. Pre-fix each E=(empty) and C=`5÷0+`, `5÷0−`, `5÷0×`, `5÷0÷` |
| AC-4 | "starts a new calculation on the page when a digit is clicked after an operator-resolved Error" | integration | recovery | Fresh page; click `5 / 0 +` (assert E=`5÷0`, C=`Error` first); then click `7` | After `7`: E=(empty), C=`7` | RED through the precondition only (pre-fix C=`5÷0+`; the value after `7` is already `7`) |

## Matrix — regression (`tests/regression/divide-by-zero.test.js`, phrased as README behavior "division by zero shows Error, also mid-chain"; each row registered in `tests/regression/REGISTRY.md`, origin `CALC-001`)

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result (post-fix) | Pre-fix result and TDD phase |
|---|---|---|---|---|---|---|
| AC-1 | "README division by zero shows Error also when an operator resolves it" | regression | error | Fresh page; click `5 / 0 +` | E=`5÷0`, C=`Error` | RED. Pre-fix E=(empty), C=`5÷0+` |
| AC-3 | "README division by zero shows Error also in the middle of a longer chain" | regression | state | Fresh page; click `2 + 3 / 0 *` | E=`2+3÷0`, C=`Error` | RED. Pre-fix E=(empty), C=`2+3÷0×` |
| AC-4 | "README Error recovery works after a divide-by-zero resolved by an operator" | regression | recovery | Fresh page; click `5 / 0 +` (assert E=`5÷0`, C=`Error`); click `=`; click `7` | After `5 / 0 +`: E=`5÷0`, C=`Error`. After `=`: unchanged (E=`5÷0`, C=`Error`, and neither line ever shows `NaN`). After `7`: E=(empty), C=`7` | RED. Pre-fix the first assertion fails (C=`5÷0+`); pre-fix `=` would show E=`5÷0+Error`, C=`NaN` |
| AC-6 | "README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain" | regression | happy | Static check of `README.md` (read as UTF-8; no page). Locate the divide-by-zero bullet: the first line matching `/^\s*[-*]\s+.*division[\s-]*by[\s-]*zero/i`; the bullet text is that line plus every immediately following non-empty line that does not itself start with `- ` or `* ` (the README wraps bullets, e.g. lines 9-10). A missing bullet fails the test (never skips) | The bullet text contains all four: the word `Error` (case-sensitive); the literal `5 ÷ 0 +` (÷ is U+00F7, single spaces, inside backticks or not); a match for `/chain/i`; a match for `/as soon as\|immediately\|at once/i`. The failure message prints the bullet text. Oracle is the AC-6 wording, not the implementation | DOC-RED. Today the bullet reads "Division-by-zero shows Error" (with Error in code font): it has the word Error but none of the other three tokens, so the row fails until the documenter edits the README |

The AC-6 row is a documentation check the documenter can verify by running one test. **Sequencing consequence for the orchestrator**: the regression gate is red on exactly this row from the implementer's GREEN commit until the documenter's README commit, so dispatch the documenter before the integration-tester's full-suite run, or record that single expected-red row explicitly. The documenter should be given the four tokens above (`Error`, `5 ÷ 0 +`, a `chain` mention, "as soon as"); if the documenter needs different wording, return to test-designer rather than loosening the row.

## Matrix — AC-5 guard map: existing `BOOT-001` tests that must stay green and unmodified

These rows name **existing** tests (nothing to write; the files must not be edited). They are listed, instead of duplicated, because the `BOOT-001` suites already pin these expectations; the column states which `CALC-001` risk each one guards. Values are the ones in `.agent/units/BOOT-001.matrix.md`, all currently green.

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result (unchanged) | Guards |
|---|---|---|---|---|---|---|
| AC-5 | "renders Error when dividing by zero" | unit (`tests/unit/calculator-core.test.js`) | error | `5 / 0 =` | E=`5÷0`, C=`Error` | RK-12: what `=` renders |
| AC-5 | "renders Error when the last step of a chain divides by zero" | unit | error | `2 + 3 / 0 =` | E=`2+3÷0`, C=`Error` | RK-12: what `=` renders mid-chain (also the oracle for the chained fix) |
| AC-5 | "divides zero by a non-zero number without Error" | unit | boundary | `0 / 5 =` | E=`0÷5`, C=`0` | RK-12 |
| AC-5 | "treats every zero-valued divisor as zero" | unit | boundary | `0 / 0 =`; `5 / 0 . 0 =` | E=`0÷0` C=`Error`; E=`5÷0.0` C=`Error` | RK-12 (oracle for the `0 / 0 +` and `0.0` rows) |
| AC-5 | "evaluates subtraction and division chains left to right" | unit | boundary | `8 - 4 - 2 =`; `1 0 0 / 5 / 2 =` | E=`8−4−2` C=`2`; E=`100÷5÷2` C=`10` | RK-11: an operator press that resolves a division by a non-zero number still chains |
| AC-5 | "rounds an intermediate chain result before applying the next operator" | unit | state | `1 / 3 * 3 =` | E=`1÷3×3`, C=`0.9999999999` | RK-11: the operator-press resolution still rounds |
| AC-5 | "replaces the pending operator instead of appending" | unit | state | `4 +`, then `*`, then `/` | C=`4+`, `4×`, `4÷`; E=(empty) | RK-11, RK-14: operator replacement (the swap branch the fix sits next to) |
| AC-5 | "applies a replaced operator to the running result of a chain" | unit | state | `4 + 8 + * 9 =` | E=`4+8×9`, C=`108` | RK-11, RK-14 |
| AC-5 | "continues from a result so 21 then +5= renders 21+5 and 26" | unit | state | `4 + 8 + 9 =`, then `+ 5 =` | E=`21+5`, C=`26` | RK-11: continue-from-result |
| AC-5 | "clears Error and starts from 0 when an operator follows Error" | unit | recovery | `5 / 0 = +`, then `3 =` | after `+`: E=(empty), C=`0+`; after `3 =`: E=`0+3`, C=`3` | oracle for the AC-4 operator recovery |
| AC-5 | "ignores a repeated equals while Error is shown" | unit | state | `5 / 0 = =` | E=`5÷0`, C=`Error` | oracle for the AC-4 `=` row |
| AC-5 | "clears Error with AC" | unit | recovery | `5 / 0 = AC`, then `4 + 4 =` | E=(empty), C=`0`; then E=`4+4`, C=`8` | oracle for the AC-4 `AC` row |
| AC-5 | "clears Error with DEL" | unit | recovery | `5 / 0 = DEL`, then `7` | E=(empty), C=`0`; then C=`7` | oracle for the AC-4 `DEL` row |
| AC-5 | "AC clears the pending operator, the trail and the result" | unit | recovery | `4 + 8 AC 5 =`; `4 + 8 + 9 = AC` | E=(empty), C=`5` after `5 =`; E=(empty), C=`0` | `AC`/`DEL` expectations unchanged |
| AC-5 | "DEL right after an operator clears the whole calculation" | unit | edge | `4 + DEL`, then `5 =` | E=(empty), C=`0`; then E=(empty), C=`5` | `AC`/`DEL` expectations unchanged |
| AC-5 | "a second operator press replaces the first on the page" | integration (`tests/integration/dom-click.test.js`) | state | click `4 + *`, then `2 =` | E=(empty), C=`4×`; then E=`4×2`, C=`8` | RK-11 through the DOM layer |
| AC-5 | "an operator after Error clears first and starts from 0 on the page" | integration | recovery | click `5 / 0 = +` | E=(empty), C=`0+` | oracle for the page-level AC-4 recovery |
| AC-5 | "README division by zero shows Error" | regression (`tests/regression/readme-behavior.test.js`) | error | click `5 / 0 =` | E=`5÷0`, C=`Error` | RK-12 through the DOM layer; the README row the new rows sit beside |
| AC-5 | "README chained calculations evaluate left to right" | regression | boundary | click `2 + 3 * 4 =`; `8 - 4 - 2 =` | E=`2+3×4` C=`20`; E=`8−4−2` C=`2` | RK-11 through the DOM layer |
| AC-5 | "README operator right after equals continues from the result" | regression | state | click `4 + 8 + 9 = + 5 =` | E=`21+5`, C=`26` | RK-11 through the DOM layer |
| AC-5 | "baseline Error recovery starts a fresh calculation on the next digit" | regression | recovery | click `5 / 0 = 7` | E=(empty), C=`7` | oracle for the AC-4 digit row |

## Verification checks (not named tests; gate- and tree-level, so the column-2 cell carries no quoted name)

| ID | AC | Check | How it is verified | Expected |
|---|---|---|---|---|
| V-1 | AC-5 | Every `BOOT-001` test still passes on this unit's `head_ref` | The gate commands in `.agent/gates.json` run whole directories: `node --test "tests/unit/**/*.test.js"` picks up `calculator-core.test.js` (52 tests) plus the new file; the integration glob picks up `dom-click.test.js` (20) plus the new file; the regression glob picks up `readme-behavior.test.js` (8) and `source-safety.test.js` (5) plus the new file. Run through `run-gate.mjs` on the committed `head_ref`; read the test counts from `latest-<gate>-final.json` | All three gates PASS. Test counts at least unit 67 (52 + 15), integration 22 (20 + 2), regression 17 (13 + 4). A lower count means a `BOOT-001` test was deleted or skipped, which is a failure even if the gate is green |
| V-2 | AC-5 | No `BOOT-001` test file was edited | `git diff --name-status --no-renames <base_ref>..<head_ref> -- tests` (the exact query `validate.mjs state` runs as `checkTestChanges` when the unit reaches `REVIEW`) | Only `A` lines for the three new test files (and for any new `tests/helpers/*` file), plus one `M` for `tests/regression/REGISTRY.md`. No `M` or `D` for `tests/unit/calculator-core.test.js`, `tests/integration/dom-click.test.js`, `tests/regression/readme-behavior.test.js`, `tests/regression/source-safety.test.js`, `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`. The REGISTRY.md `M` needs the orchestrator's `kind: test-change` record naming the path; keep that edit append-only |
| V-3 | AC-1 to AC-4, AC-6 | RED is genuine and fails for the right reason (RK-10) | Before any edit to `calculator-core.js`, run the three new files on the unmodified post-`BOOT-001` core and record the actual values in the RED evidence and the unit Log. Integration and regression files can be proven RED without a second tree by writing them before the fix, or afterwards with a scratch worktree at the pre-fix commit, or with the stub's in-memory `CALC_STUB_TRANSFORM` hook applied to `calculator-core.js` to undo the fix | Unit file: 13 failing, 2 passing (the two GUARD rows). Integration file: 2 failing. Regression file: 4 failing (three on `Error` versus `5÷0+`-style values, one on the README text). Failure reasons are assertion messages showing the pre-fix values in the RED reference tables (for example actual C `5÷0+`, expected `Error`), never a `TypeError`, `ReferenceError` or missing-file error. If the pre-fix values differ from the reference tables, or a RED row passes, stop: do not claim a RED, report `BOOT-001` behavior drift to the orchestrator (the unit's TDD note) |
| V-4 | AC-6 | The README bullet matches the implemented behavior | The DOC-RED row above, run after the documenter's edit; the reviewer also reads the bullet against the fixed behavior (`5 ÷ 0 +` shows `Error` at once) | Row passes; the bullet says `Error` appears as soon as the division is evaluated, including in the middle of a chain, with `5 ÷ 0 +` as the example |

## Not covered (with reason)

- **Invalid input as a category**: the fix adds no input kind and no new validation. The core's rejection of malformed descriptors is pinned in `BOOT-001` (row "throws a TypeError for a malformed input descriptor", added to that matrix by the traceability fix); the DOM layer's filtering by the integration rows there.
- **Security-sensitive**: no new input surface, DOM write, storage, network or dependency. `Error` is an existing constant string already written through `textContent`. The `BOOT-001` AC-7 rows (markup-write traps, static source scans) run unmodified (V-1) and would catch a regression. The orchestrator confirms the trigger list of CLAUDE.md §8 before relying on `security_review: N/A`.
- **A divisor that is not a typed operand** (held value, `-0`, `NaN`, `Infinity`): unreachable through an operator press. The pending operation is computed only when a number was typed after the pending operator (right after an operator the swap branch runs instead, and after `=` no operator is pending), and a computed result never renders `-0` (it prints `0`). `=` right after an operator with a held zero (`0 / =`) is the `=` path, unchanged and out of scope. Residual risk: none observable.
- **Number formatting for very large or small results**: out of scope by the plan; unchanged.
- **Keyboard input** (`KEY-001`): out of scope here; the keyboard unit will re-run these files unmodified.
- **Visual styling of `Error`, dark theme, responsive layout, real `file://` loading, real-browser click mechanics**: no real browser is available (RK-3, D-001). The stub proves the click path only. `UNVERIFIED`; the manual checklist stays with the user.
- **Timing, concurrency, randomness**: none in the product; rapid clicking equals sequential input.
- **Repeated operator presses after the fixed state beyond one** (`5 / 0 + + +`): not a separate row. The first operator after the fixed state clears the Error and starts from 0 (rows in AC-4), and any further operator is the operator-replacement transition already pinned by the AC-5 guard rows.

## AC notes and open points (none blocks READY)

- **AC-1, "leaves no pending operator"**: observable only through the next input. It is pinned by the AC-4 `=` row and the four recovery rows, not by a row of its own.
- **AC-4, vacuity risk (important)**: four of the five recovery inputs render the same values before and after the fix (see the recovery table). A row that asserts only the post-input display would pass on the unfixed core and would not be a RED. Every AC-4 row therefore carries the precondition assertion on the state after `5 / 0 +`; the implementer and integration-tester must write it first in the test body.
- **AC-5, "suites pass unmodified"** is a gate- and tree-level fact, not a behavior a named test can assert without reading git. It is mapped to the existing tests by name (guard map) plus V-1 and V-2, which the machine-written evidence and `validate.mjs state` check. Two new GUARD rows cover the two false-positive shapes the `BOOT-001` suites do not pin (a zero operand that is not a divisor; a zero dividend or sub-1 divisor).
- **AC-6** depends on the documenter's wording. The oracle checks four tokens taken from the AC text; the orchestrator should hand the documenter those tokens so the wording and the row agree (sequencing note under the regression table).
- **Row "leaves the earlier state unchanged when an operator press resolves a divide-by-zero"** is a design addition for the changed branch (RK-14, `BOOT-001` AC-1 non-mutation). No AC states it in words; it is mapped to AC-1 because AC-1 is the divide-by-zero-on-operator scenario the row exercises. If a reviewer prefers a different home, the remedy is to re-label the row, not to drop the coverage.
- **Unit file text is stale** where "Required Tests" and "Relevant Files" say the existing unit and integration files are "extended": the orchestrator's placement decision (new files) supersedes it. The orchestrator owns the unit file; this designer did not edit it.

## Regression impact

- **Behavior at risk (shared code)**: the operator transition (`chooseOperator`, including the operator-swap and continue-from-result branches), `computeResult` (used by both operator press and `=`), and the `equals` finalize step, all in `calculator-core.js`. The fix is expected to touch only the zero-divisor outcome of `computeResult` inside `chooseOperator` (RK-11) and must not change what `=` renders (RK-12). Guard rows: see the guard map, columns "Guards".
- **Existing tests at risk**: none expected to change. Every `BOOT-001` expectation stays; if one has to change, stop and raise it (it would need a `kind: test-change` record and would mean `BOOT-001` pinned something this fix contradicts; the mid-chain path was deliberately left unpinned). `tests/regression/REGISTRY.md` is modified append-only.
- **Existing tests to expand**: none (by placement decision, all new rows are new files). Layer coverage: unit (15), integration (2), regression (4).
- **Registry rows to add to `tests/regression/REGISTRY.md`** (origin `CALC-001`), four rows, one per regression test above:
  - `tests/regression/divide-by-zero.test.js` :: README division by zero shows Error also when an operator resolves it (behavior preserved: `5 ÷ 0 +` shows expression `5÷0` and `Error`, pressed operator discarded)
  - `tests/regression/divide-by-zero.test.js` :: README division by zero shows Error also in the middle of a longer chain (`2 + 3 ÷ 0 ×` shows `2+3÷0` and `Error`)
  - `tests/regression/divide-by-zero.test.js` :: README Error recovery works after a divide-by-zero resolved by an operator (`=` is ignored, a digit starts fresh)
  - `tests/regression/divide-by-zero.test.js` :: README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain (the README states the immediate-`Error` behavior)
  The existing `BOOT-001` registry rows (for example the note that the mid-chain path is owned by `CALC-001`) stay verbatim.
- **Downstream**: `KEY-001` extends `tests/helpers/dom-stub.js` and re-runs the regression suites unmodified; the new files use only `loadPage()` and `press()`, so a compatible stub extension does not affect them.

## Coverage summary by category

| Category | Rows |
|---|---|
| happy | "shows Error at once for each of the four operators pressed after 5 divided by 0"; the four-button page row; the README-bullet row |
| boundary | `0 / 0`, `0.0` divisor, `0.` divisor (unit, three rows); two GUARD rows (zero operand, non-zero divisor) |
| invalid | none new, reason in "Not covered" |
| error | `5 / 0 +` (unit and regression), existing `=` guard rows |
| edge | the `0.` divisor typed as a bare point (`5 / . +`), the zero dividend GUARD case |
| security | none new, reason in "Not covered" |
| state | chained `2 + 3 / 0 *` (unit and regression), continue-from-result, earlier-state immutability, `=` ignored |
| recovery | digit, operator (four operators), `AC`, `DEL` after the fixed state (unit); digit click (integration); `=` then digit (regression) |

Totals: 21 new named rows (unit 15, integration 2, regression 4) plus 21 existing named tests mapped to AC-5 as guards (unit 15, integration 2, regression 4) = 42 named rows. Every AC-1 to AC-6 has at least one named row. Rows per AC:

| AC | New unit | New integration | New regression | Existing guards | Total named rows |
|---|---|---|---|---|---|
| AC-1 | 2 | 0 | 1 | 0 | 3 |
| AC-2 | 1 | 1 | 0 | 0 | 2 |
| AC-3 | 5 | 0 | 1 | 0 | 6 |
| AC-4 | 5 | 1 | 1 | 0 | 7 |
| AC-5 | 2 | 0 | 0 | 21 | 23 |
| AC-6 | 0 | 0 | 1 | 0 | 1 |
| Total | 15 | 2 | 4 | 21 | 42 |

The 21 existing guards are 15 unit, 2 integration and 4 regression tests, so AC-5 has 2 new unit rows plus 21 existing tests = 23 named rows.

## Mutation sanity (what each key behavior would miss without its row)

- Fix leaves the pressed operator in the trail (`5÷0+` with `Error`): the whole-pair equality in every row.
- Fix sets `Error` but leaves the operation pending: "ignores equals after an operator resolved a divide-by-zero" (`=` recomputes, pre-fix shows `5÷0+Error` / `NaN`).
- Fix forgets to store the finished expression, so E stays empty or stale: the first unit row and the README rows.
- Fix shows only the resolved intermediate (`5÷0` for `2 + 3 / 0 *`): the chained row.
- Fix handles only `+` (or only one operator): the four-operator unit row and the four-button page row.
- Fix recognises only a divisor typed exactly `0`: the `0.0` row and the `0.` row.
- Fix skips a zero dividend (`0 / 0 +`): the `0 / 0` row.
- Fix covers the plain chain but not continue-from-result: "shows Error when an operator resolves a divide-by-zero after continuing from a result".
- Fix flags any zero operand, any zero result, or any zero dividend: the two GUARD rows.
- Fix edits shared history or the argument state in place: "leaves the earlier state unchanged when an operator press resolves a divide-by-zero".
- Fix changes what `=` renders, or breaks operator replacement, chaining or continue-from-result: the guard-map rows (all `BOOT-001` tests, unmodified).
- Fix is placed in `script.js` instead of the core (violates D-005): the unit rows stay RED because they run on the pure core with no DOM.
- Fix works in the core but the DOM path is broken: the integration rows.
- README left unchanged: the DOC-RED row.

## Adequacy self-check

- [x] Each AC has at least one test that would FAIL if the behavior were absent: AC-1 to AC-4 fail on the pre-fix core (values in the RED reference tables); AC-5 is guarded by the existing suites plus two GUARD rows and the tree-level checks V-1/V-2; AC-6 by the DOC-RED row
- [x] Invalid input and error paths: the error path is the whole unit (operator press, `=` afterwards, all recovery inputs); no new invalid-input surface (reason in "Not covered")
- [x] State transitions covered as sequences (chain, continue-from-result, `=` after the fixed state, recovery inputs, earlier-state immutability)
- [x] No test asserts implementation details: assertions are on rendered `{ expression, current }` and README text; no internal field is read
- [x] Expected values are independent of the implementation: hand-derived from the AC text and typed tokens, cross-checked against today's `=` behavior, which `BOOT-001` pins literally
- [x] AC-4 RED is checkable: the precondition assertion is required in every recovery row and the four inputs that render identically pre-fix are called out
- [ ] Not verified by execution: post-fix values were not observed on fixed code (none exists yet) and the in-memory probe run is not committed; both are `UNVERIFIED` until the implementer's RED and GREEN runs exist
