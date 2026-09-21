# BOOT-001 — Test Matrix

Every AC in the unit file must appear at least once. **Column 2 is a quoted test name (`"…"`) and becomes the literal title of a test in the test source**: `validate.mjs state` fails if a named test does not exist verbatim, or if an AC has no named row. Names must not contain double quotes. Tests are designed from behavior, not from the implementation. Categories: happy, boundary, invalid, error, edge, security, state, recovery (omit a category only with a stated reason).

Designed by: test-designer@claude-sonnet-5 · 2026-09-21 · against baseline `e02035b` (`script.js`, `index.html`, `style.css`, `README.md` unchanged since baseline, verified with `git diff --stat e02035b`).

Amended 2026-09-21 by test-designer@claude-sonnet-5 (gate 2 re-run, dispatch `.agent/handoffs/BOOT-001-03-orchestrator-to-test-designer.md`, against the amended unit that adds AC-8): **remap only**. Nine rows were moved to the end of the unit table and re-labelled `AC-8` (six from AC-5, three from AC-2). No test name in column 2 and no expectation was changed. The only other wording edits are one stale parenthetical in the AC-4 row (AC-4 now states the expression line itself) and the housekeeping sections: resolved questions, superseded OQ-B1 rows, "Not covered", AC notes, regression impact, coverage summary and totals, mutation sanity, adequacy checklist. Before amending, every AC-8 clause value was re-run against the unmodified `script.js` (see "Verification of expectations").

Second amendment 2026-09-21 by test-designer@claude-sonnet-5 (traceability fix only, dispatch `.agent/handoffs/CALC-001-01-orchestrator-to-test-designer.md`; `BOOT-001` is `COMPLETE`; closes reviewer finding F-2 in `.agent/handoffs/BOOT-001-14-reviewer-to-orchestrator.md`): one row added under AC-1 for the existing test "throws a TypeError for a malformed input descriptor" (the 52nd unit test in `tests/unit/calculator-core.test.js`, written RED-first in commit `35d3b85`); the "Not covered" bullet on the unrecognized-input policy, the AC-1 count (5 to 6) and the totals (84 to 85 named rows, unit 51 to 52) were corrected. No other row and no test name changed; no test file was touched.

## Notation (applies to every row)

- **Sequence**: space-separated tokens applied in order to a fresh state / freshly loaded page. Digits `0`–`9` and `.` are number inputs; `+ - * /` are the operator inputs (their `data-operator` values); `=` is equals; `AC` is clear; `DEL` is delete. In the integration/regression layers each token is a `click` on the button with the matching `data-*` attribute; in the unit layer each token is one call of the core's apply-input entry point (input descriptor shape is the implementer's choice, see the plan and the API decision record).
- **E** = expression line (`#display-expression` text / the core's rendered `expression`). **C** = current line (`#display-current` text / the core's rendered `current`). `E=(empty)` means the empty string.
- **Glyphs (exact code points)**: operator minus in the trail/E/C is `−` U+2212; times is `×` U+00D7; divide is `÷` U+00F7. A negative number's sign is the ASCII hyphen-minus `-` U+002D (this is how the current script prints it; the two minus characters differ and tests must not conflate them).
- "Live" means the state before any `=` (E is empty, the trail is on C). "After `=`" means the two-line view (E = the typed expression, C = the answer).
- "Fresh page / fresh state" means a new instance per test (or per listed case); no state shared between tests.

## Test files, layers and TDD phase

| File | Layer | Phase | Expected on unmodified `script.js` @ `e02035b` |
|---|---|---|---|
| `tests/unit/calculator-core.test.js` | unit | RED-first | fails (core file absent) — this is the genuine RED |
| `tests/helpers/dom-stub.js` (helper, no rows) | helper | safety net | n/a |
| `tests/integration/dom-click.test.js` | integration | safety net (green from the start) except the row "loads calculator-core.js before script.js in index.html", which is RED until `index.html` lists the core | passes, except that one row |
| `tests/regression/readme-behavior.test.js` | regression | safety net (green from the start) | passes |
| `tests/regression/source-safety.test.js` | regression | RED-first (each row reads `calculator-core.js`; a missing file must FAIL the test, never skip it) | fails (core file absent) |

The safety-net files must be written, run green against the **unmodified** `script.js`, and committed before any extraction edit. If a safety-net expectation below turns out to be wrong against the unmodified script, that is a matrix defect: return to test-designer; do not adjust the expectation to whatever passes.

## Verification of expectations (independence of oracle)

Every expected value below was first hand-computed from the README/AC arithmetic, then confirmed by executing the **unmodified** `script.js` through a throwaway in-memory DOM stub (`node` stdin script; nothing written to the repo because the write policy limits this role to the matrix and handoff): 105 sequences run, all hand-computed expectations matched. The only divergences from expectation-by-README are listed under "Resolved questions and superseded rows" (OQ-B1 to OQ-B3). OQ-B1 (mid-chain divide-by-zero) is not a row in this matrix at all (owner: `CALC-001`); OQ-B2 and OQ-B3 are frozen baseline behavior and are required rows. No throwaway artifact is committed, so reviewers should treat the reproducibility of that run as `UNVERIFIED` until the implementer's pre-extraction green run of the integration + regression suites (machine evidence) exists. **Gate 2 re-run, same method**: a second throwaway run (in-memory stub, unmodified `script.js`, nothing committed) applied every AC-8 clause sequence (a)-(f) plus the other remapped rows. Every rendered value equals the value stated both in AC-8 and in this matrix: `4 + 8 AC` then `5 =` gives expression empty and current `5`; `1 . 5 DEL DEL` gives `1.` then `1`; `4 + DEL`, `4 + 8 + 9 = DEL` and `5 / 0 = DEL` each give empty and `0`; a bare `=` gives empty and `0`, `5 =` gives empty and `5`; `5 + =` gives `5+5` and `10`; `4 + 8 + 9 = =` gives `4+8+9` and `21`; `4 + 8 DEL` gives empty and `4+0`, then `5 =` gives `4+5` and `9`. The same `UNVERIFIED` reproducibility caveat applies.

## Stub fidelity requirements (for `tests/helpers/dom-stub.js`, RK-2)

The integration and regression rows are only meaningful if the stub:
1. Parses the **real** `index.html` (ordered `<script src>` list, the two display ids, the `.buttons` container, every `<button>` with all its `data-*` attributes and label). No hard-coded button table.
2. Runs each script with `node:vm` in one shared context that has `document` but **no** `module`, `exports` or `require`, so the dual-export guard takes the browser branch.
3. Implements `getElementById`, `querySelector('.buttons')`, `addEventListener`, event `target`, `dataset` (all `data-*`), and `textContent` read/write.
4. Delivers `click` with **bubbling** from the target through its ancestors to `document` (today's `script.js` listens on the `.buttons` container, not on each button).
5. Traps markup writes: `innerHTML`, `outerHTML`, `insertAdjacentHTML` record every write so tests can assert none happened.
6. Creates a fresh vm context per page; provide a `press(tokens)`-style helper returning `{ expression, current }`. Exposing `document.addEventListener` now avoids rewriting the stub in KEY-001.

Anything the stub cannot model (CSS, layout, real focus, real `file://` loading) is `UNVERIFIED` (see "Not covered").

## Matrix — unit (`tests/unit/calculator-core.test.js`)

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result |
|---|---|---|---|---|---|
| AC-1 | "loads in a Node process that defines no document or window" | unit | happy | In the test process assert `typeof document` and `typeof window` are `'undefined'`; then load a fresh copy of `calculator-core.js` (bypass the require cache, or run its source in a `node:vm` context whose only global is `module = { exports: {} }`) | No exception is thrown; the export object is defined and non-null. Fails if the core touches `document`/`window` at load or the file is missing |
| AC-1 | "exposes fresh-state, apply-input and render entry points as functions" | unit | happy | Load the core; look up the three entry points named in the API decision record | `typeof` of each of the three is `'function'` |
| AC-1 | "renders a fresh state as an empty expression line and 0" | unit | boundary | Create a fresh state; render it | E=(empty), C=`0` |
| AC-1 | "keeps two fresh states independent of each other" | unit | state | A = fresh, B = fresh; apply `5` to A; apply `9` to B; render both; then apply `+` to A; render both again | render(A).C=`5` then `5+`; render(B).C=`9` both times. Fails if state lives at module level |
| AC-1 | "leaves an earlier state unchanged when a later input is applied" | unit | state | s0 = fresh; s1 = apply(s0, `7`); s2 = apply(s1, `+`); afterwards re-render s0, s1, s2 | s0: E=(empty), C=`0`; s1: E=(empty), C=`7`; s2: E=(empty), C=`7+`. Fails if apply-input mutates its argument |
| AC-1 | "throws a TypeError for a malformed input descriptor" | unit | invalid | state = the state after `4 +` (renders E=(empty), C=`4+`). Apply each of these 14 malformed descriptors to that same state through the apply-input entry point: `null`; `undefined`; the string `'number'`; the number `42`; `{}`; `{ type: 'bogus', value: '1' }`; `{ type: 'number' }` (no value); `{ type: 'number', value: '12' }` (two characters); `{ type: 'number', value: 7 }` (a number, not a string); `{ type: 'number', value: 'a' }`; `{ type: 'operator', value: '^' }`; `{ type: 'operator', value: 'constructor' }` (an inherited object key, not an operator); `{ type: 'action', value: 'square' }`; `{ type: 'action', value: '__proto__' }` | Every call throws a `TypeError` (asserted with the error class, not just "throws"). Afterwards the state that was passed in still renders E=(empty), C=`4+`. Fails if a malformed descriptor is silently ignored, throws a different error class, resolves an inherited key such as `constructor` or `__proto__` to a real operator or action, or mutates the state. Traceability row added after the fact (see the second amendment note at the top): the test was written RED-first by the implementer (commit `35d3b85`, policy in `.agent/decisions/D-003-core-api.md`, "Unrecognized-input policy") and was missing from this matrix. Mapped to AC-1 because AC-1 names the input-transition entry point `(state, input) -> state` and its guarantee that the state passed in renders exactly as before; no AC states the throw policy itself, that is the D-003 choice |
| AC-2 | "chains 4+8+9 left to right and splits the display after equals" | unit | happy | `4 + 8 + 9 =` | E=`4+8+9`, C=`21` |
| AC-2 | "shows the growing trail on the main line before equals" | unit | state | Render after each token of `4 + 8 + 9` (no `=`) | After `4`: C=`4`; `+`: `4+`; `8`: `4+8`; `+`: `4+8+`; `9`: `4+8+9`. E=(empty) after every step |
| AC-2 | "evaluates 2+3*4 left to right without operator precedence" | unit | boundary | `2 + 3 * 4 =` | E=`2+3×4`, C=`20` (precedence would give 14) |
| AC-2 | "evaluates subtraction and division chains left to right" | unit | boundary | (a) `8 - 4 - 2 =`; (b) `1 0 0 / 5 / 2 =` (fresh state per case) | (a) E=`8−4−2`, C=`2` (right-grouping would give 6); (b) E=`100÷5÷2`, C=`10` (right-grouping would give 40) |
| AC-2 | "applies each of the four operators and renders its display symbol" | unit | happy | Fresh state per case: `9 + 3 =`, `9 - 3 =`, `6 * 7 =`, `8 / 2 =` | E=`9+3` C=`12`; E=`9−3` C=`6`; E=`6×7` C=`42`; E=`8÷2` C=`4` |
| AC-2 | "accepts a long run of typed digits without truncating" | unit | boundary | (a) `1 2 3 4 5 6 7 8 9 0`; (b) `1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0` | (a) C=`1234567890`; (b) C=`12345678901234567890`; E=(empty). No digit cap |
| AC-2 | "replaces a lone leading zero with the next digit" | unit | boundary | Fresh state per case: `0 0 5`; `0 5`; `0 0` | C=`5`; C=`5`; C=`0`; E=(empty) in all |
| AC-3 | "trims floating-point noise so 0.1+0.2 renders 0.3" | unit | happy | `0 . 1 + 0 . 2 =` | E=`0.1+0.2`, C=`0.3` (raw sum 0.30000000000000004 must not appear) |
| AC-3 | "rounds a result to ten decimal places" | unit | boundary | Fresh state per case: `1 / 3 =`; `2 / 3 =` | E=`1÷3` C=`0.3333333333`; E=`2÷3` C=`0.6666666667` (rounded up, not truncated to `...666`) |
| AC-3 | "rounds an intermediate chain result before applying the next operator" | unit | state | `1 / 3 * 3 =` | E=`1÷3×3`, C=`0.9999999999` (an unrounded intermediate would give `1`) |
| AC-3 | "rounds a result below the tenth decimal place to 0" | unit | boundary | `0 . 0 0 0 0 0 0 0 0 0 0 1 + 0 =` (ten zeros after the point, then `1`, i.e. 0.00000000001) | E=`0.00000000001+0`, C=`0` |
| AC-3 | "renders negative zero as 0" | unit | edge | `0 - 5 * 0 =` (−5 × 0 is −0 in floating point) | E=`0−5×0`, C=`0` (not `-0`) |
| AC-3 | "renders a negative result with a leading hyphen-minus" | unit | edge | `3 - 5 =` | E=`3−5`, C=`-2` where the sign is ASCII U+002D |
| AC-3 | "continues a calculation from a negative result" | unit | state | `3 - 5 = + 1 =` | E=`-2+1`, C=`-1` |
| AC-3 | "keeps a large whole-number result exact" | unit | boundary | `1 2 3 4 5 6 7 8 9 * 1 0 0 0 =` | E=`123456789×1000`, C=`123456789000` (no noise, no exponent) |
| AC-3 | "ignores a second decimal point in the same operand" | unit | invalid | `1 . 2 . 3` | C=`1.23`; E=(empty) |
| AC-3 | "builds decimal operands with a leading zero" | unit | happy | Fresh state per case: `.`; `. 5`; `0 . 0 5` | C=`0.`; C=`0.5`; C=`0.05`; E=(empty) in all |
| AC-3 | "starts the next operand with 0. after an operator even when the held value has a decimal point" | unit | edge | (a) `4 + .` then `4 + . 5 =`; (b) `1 / 4 + .` then `1 / 4 + . 5 =` | (a) C=`4+0.`; after `=` E=`4+0.5`, C=`4.5`. (b) C=`1÷4+0.`; after `=` E=`1÷4+0.5`, C=`0.75`. The point must not be rejected because the held `0.25` contains one |
| AC-3 | "keeps a trailing decimal point in the trail" | unit | edge | `5 . + 3 =` (also render after `5 . +`) | After `5 . +`: C=`5.+`. After `=`: E=`5.+3`, C=`8` |
| AC-4 | "renders Error when dividing by zero" | unit | error | `5 / 0 =` | E=`5÷0`, C=`Error` (AC-4 states this expression line; it is also what the script does) |
| AC-4 | "starts a brand-new calculation when a digit follows Error" | unit | recovery | `5 / 0 = 7`, then `+ 1 =` | After `7`: E=(empty), C=`7`. After `+ 1 =`: E=`7+1`, C=`8` (no residue of the error) |
| AC-4 | "treats every zero-valued divisor as zero" | unit | boundary | (a) `0 / 0 =`; (b) `5 / 0 . 0 =` | (a) E=`0÷0`, C=`Error`; (b) E=`5÷0.0`, C=`Error` |
| AC-4 | "divides zero by a non-zero number without Error" | unit | boundary | `0 / 5 =` | E=`0÷5`, C=`0` |
| AC-4 | "renders Error when the last step of a chain divides by zero" | unit | error | `2 + 3 / 0 =` | E=`2+3÷0`, C=`Error` |
| AC-4 | "clears Error and starts from 0 when an operator follows Error" | unit | recovery | `5 / 0 = +`, then `3 =` | After `+`: E=(empty), C=`0+`. After `3 =`: E=`0+3`, C=`3` |
| AC-4 | "ignores a repeated equals while Error is shown" | unit | state | `5 / 0 = =` | E=`5÷0`, C=`Error` (unchanged by the second `=`) |
| AC-4 | "clears Error with AC" | unit | recovery | `5 / 0 = AC`, then `4 + 4 =` | After `AC`: E=(empty), C=`0`. After `4 + 4 =`: E=`4+4`, C=`8` |
| AC-4 | "clears Error with DEL" | unit | recovery | `5 / 0 = DEL`, then `7` | After `DEL`: E=(empty), C=`0`. After `7`: C=`7` |
| AC-5 | "continues from a result so 21 then +5= renders 21+5 and 26" | unit | state | `4 + 8 + 9 =` (C=`21`), then `+`, `5`, `=` | After `+`: E=(empty), C=`21+`. After `5`: C=`21+5`. After `=`: E=`21+5`, C=`26` |
| AC-5 | "continues again from a second result" | unit | state | `4 + 8 + 9 = + 5 = * 2 =` | After the last `=`: E=`26×2`, C=`52` |
| AC-5 | "replaces the pending operator instead of appending" | unit | state | `4 +`, then `*`, then `/` (render after each) | C=`4+`, then `4×`, then `4÷`; E=(empty); exactly one operator in the trail each time |
| AC-5 | "uses the last chosen operator after a replacement" | unit | state | `4 + * 2 =` | E=`4×2`, C=`8` (not 6) |
| AC-5 | "applies a replaced operator to the running result of a chain" | unit | state | `4 + 8 + * 9 =` | E=`4+8×9`, C=`108` (the resolved 12 is multiplied by 9) |
| AC-5 | "replaces the operator chosen right after a result" | unit | state | `4 + 8 + 9 = + * 5 =` | E=`21×5`, C=`105` |
| AC-5 | "uses 0 as the left operand when an operator is the first input" | unit | edge | `+`, then `+ 5 =` on a fresh state | After `+`: C=`0+`. After `+ 5 =`: E=`0+5`, C=`5` |
| AC-5 | "starts a new calculation when a digit follows a result" | unit | state | `4 + 8 + 9 = 3` | E=(empty), C=`3` |
| AC-5 | "starts 0. when a decimal point follows a decimal result" | unit | edge | `1 / 4 =` (C=`0.25`), then `.`, then `5` | After `.`: E=(empty), C=`0.` (not ignored although the result held a point). After `5`: C=`0.5` |
| AC-8 | "AC clears the pending operator, the trail and the result" | unit | recovery | (a) `4 + 8 AC 5 =`; (b) `4 + 8 + 9 = AC` | (a) after `AC`: E=(empty), C=`0`; after `5 =`: E=(empty), C=`5` (no operator survived). (b) E=(empty), C=`0` |
| AC-8 | "DEL removes the last typed character including a decimal point" | unit | happy | (a) `1 2 3 DEL`; (b) `1 . 5 DEL` then `DEL` | (a) C=`12`; (b) C=`1.` after the first `DEL`, C=`1` after the second; E=(empty) |
| AC-8 | "DEL on the last remaining digit or on a fresh state leaves 0" | unit | boundary | (a) `5 DEL`; (b) fresh state then `DEL` | (a) E=(empty), C=`0`; (b) E=(empty), C=`0` |
| AC-8 | "DEL in the second operand changes only that operand" | unit | state | `4 + 8 DEL`, then `5 =` | After `DEL`: E=(empty), C=`4+0`. After `5 =`: E=`4+5`, C=`9` |
| AC-8 | "DEL right after an operator clears the whole calculation" | unit | edge | `4 + DEL`, then `5 =` (characterized behavior, see OQ-B3) | After `DEL`: E=(empty), C=`0` (the `4` and the operator are gone). After `5 =`: E=(empty), C=`5` |
| AC-8 | "DEL after a result clears the result and the expression line" | unit | edge | `4 + 8 + 9 = DEL` (characterized behavior, see OQ-B3) | E=(empty), C=`0` |
| AC-8 | "ignores equals when no operator is pending" | unit | edge | (a) fresh state `=`; (b) `5 =` then `+ 1 =` | (a) E=(empty), C=`0`. (b) after `5 =`: E=(empty), C=`5`; after `+ 1 =`: E=`5+1`, C=`6` (state intact) |
| AC-8 | "uses the held value as the second operand when equals follows an operator" | unit | edge | (a) `5 + =`; (b) `5 * =` (characterized behavior, README is silent, see OQ-B2) | (a) E=`5+5`, C=`10`. (b) E=`5×5`, C=`25` |
| AC-8 | "ignores a second equals after a result" | unit | state | `4 + 8 + 9 = =` | E=`4+8+9`, C=`21` |

### AC-8 clause map (traceability aid, not test rows)

Every clause of AC-8 is pinned by at least one named row that states the exact values AC-8 states (each value re-verified against the unmodified `script.js`). Column 1 below is a clause label, not an AC id, and this table is not part of the test set.

| Clause | Values stated by AC-8 | Named row(s) that pin it | Note |
|---|---|---|---|
| (a) AC | `4 + 8 AC` gives expression empty, current `0`; a following `5 =` gives empty and `5` | "AC clears the pending operator, the trail and the result" (case a) | Case (b) `4 + 8 + 9 = AC` is an extra |
| (b) DEL on typed digits | `1 2 3 DEL` gives `12`; `1 . 5 DEL DEL` gives `1.` then `1`; `5 DEL` and a bare `DEL` on a fresh state give `0` | "DEL removes the last typed character including a decimal point" (cases a, b); "DEL on the last remaining digit or on a fresh state leaves 0" (cases a, b) | |
| (c) DEL clears everything | `4 + DEL`, `4 + 8 + 9 = DEL` and `5 / 0 = DEL` each give expression empty, current `0` | "DEL right after an operator clears the whole calculation"; "DEL after a result clears the result and the expression line"; for `5 / 0 = DEL` the row "clears Error with DEL" | The `Error` case stays on AC-4 by dispatch decision; it pins expression empty, current `0`, then `7` gives `7`. The page rows under AC-6 repeat the operator and `Error` cases |
| (d) no-op equals | a bare `=` on a fresh state gives empty and `0`; `5 =` gives empty and `5` | "ignores equals when no operator is pending" (cases a, b) | Case (b) also continues with `+ 1 =` to prove the state is intact |
| (e) equals after operator | `5 + =` gives expression `5+5`, current `10` | "uses the held value as the second operand when equals follows an operator" (case a) | Case (b) `5 * =` is an extra |
| (f) second equals | `4 + 8 + 9 = =` gives `4+8+9` and `21` | "ignores a second equals after a result" | |

## Matrix — integration (`tests/integration/dom-click.test.js`, real `index.html` scripts through the stub)

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result |
|---|---|---|---|---|---|
| AC-6 | "shows an empty expression line and 0 when the page loads" | integration | happy | Load `index.html` into a fresh stub page; no clicks | E=(empty), C=`0` |
| AC-6 | "runs every script tag of index.html in document order without module syntax" | integration | happy | Read the `<script>` tags of `index.html`; run them in order; then click `7` | Every script has a `src` and no `type="module"`; each `src` is a relative path to an existing repo file (no scheme, no leading `/`); loading throws nothing; after the click E=(empty), C=`7`. Green before and after extraction |
| AC-6 | "loads calculator-core.js before script.js in index.html" | integration | state | Read the ordered `src` list of `index.html` | Both `calculator-core.js` and `script.js` are listed and the index of `calculator-core.js` is smaller. **RED before extraction** (proxy for the `file://` promise, RK-4) |
| AC-6 | "wires every digit button 0 to 9 to the main line" | integration | happy | Click `1 2 3 4 5 6 7 8 9 0` in order (the `0` button has `data-number="0"`, the string `0`) | C=`1234567890`; E=(empty) |
| AC-6 | "ignores a second decimal point typed through the buttons" | integration | invalid | Click `1 . 2 . 3` | C=`1.23`; E=(empty) |
| AC-6 | "shows the display symbol for each operator button" | integration | happy | Fresh page per case: `9 +`, `9 -`, `9 *`, `9 /` | C=`9+`; C=`9−`; C=`9×`; C=`9÷`; E=(empty) |
| AC-6 | "AC clears an unfinished chain, a result and an Error" | integration | recovery | Fresh page per case: (a) `4 + 8 + 9 AC`; (b) `4 + 8 + 9 = AC`; (c) `5 / 0 = AC` | In all three: E=(empty), C=`0` |
| AC-6 | "DEL removes the last typed digit" | integration | happy | Click `1 2 3 DEL` | E=(empty), C=`12` |
| AC-6 | "DEL right after an operator clears the whole calculation on the page" | integration | edge | Click `4 + DEL`, then `5 =` | After `DEL`: E=(empty), C=`0`. After `5 =`: E=(empty), C=`5` |
| AC-6 | "DEL on Error clears it on the page" | integration | recovery | Click `5 / 0 = DEL`, then `7` | After `DEL`: E=(empty), C=`0`. After `7`: E=(empty), C=`7` |
| AC-6 | "a second operator press replaces the first on the page" | integration | state | Click `4 + *`, then `2 =` | After `*`: E=(empty), C=`4×`. After `2 =`: E=`4×2`, C=`8` |
| AC-6 | "equals with no pending operator changes nothing on the page" | integration | edge | (a) fresh page, click `=`; (b) fresh page, click `5 =` | (a) E=(empty), C=`0`. (b) E=(empty), C=`5` |
| AC-6 | "equals right after an operator uses the held value as the second operand on the page" | integration | edge | Click `5 + =` (characterized behavior, see OQ-B2) | E=`5+5`, C=`10` |
| AC-6 | "a digit after a result starts a new calculation on the page" | integration | state | Click `4 + 8 + 9 = 3` | E=(empty), C=`3` |
| AC-6 | "an operator after Error clears first and starts from 0 on the page" | integration | recovery | Click `5 / 0 = +` | E=(empty), C=`0+` |
| AC-6 | "leading zeros are replaced and a zero before a point is kept on the page" | integration | boundary | Fresh page per case: `0 0 5`; `0 . 0 5` | C=`5`; C=`0.05`; E=(empty) in both |
| AC-6 | "a decimal point after an operator starts 0. in the next operand on the page" | integration | edge | Click `1 / 4 + . 5 =` (observe after `.` and after `=`) | After `.`: E=(empty), C=`1÷4+0.`. After `=`: E=`1÷4+0.5`, C=`0.75` |
| AC-6 | "clicking the button container outside any button changes nothing" | integration | invalid | Click `4 + 8`, then dispatch a `click` whose target is the `.buttons` container element itself (as clicking a gap between buttons does) | E=(empty), C=`4+8` before and after; nothing thrown. Pins that the DOM layer ignores non-button targets |
| AC-7 | "updates the display through textContent without writing markup" | integration | security | Click `4 + 8 + 9 =` with the stub's markup-write traps armed | E=`4+8+9`, C=`21` read back via `textContent`; the trap log for `innerHTML`, `outerHTML` and `insertAdjacentHTML` is empty on every element |
| AC-7 | "treats a button data attribute containing markup as inert text" | integration | security | Append a synthetic button under `.buttons` whose `data-number` is `<img src=x onerror=alert(1)>` and dispatch a click on it | No exception; the markup-write trap log is empty; each display `textContent` is a string (any `<` shown is literal text). The exact text is **not** asserted: the unmodified script displays the payload literally and the extraction may instead reject it at the boundary |

## Matrix — regression (`tests/regression/readme-behavior.test.js`, one row per README behavior; each registered in `tests/regression/REGISTRY.md`, origin `BOOT-001`)

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result |
|---|---|---|---|---|---|
| AC-6 | "README live trail shows the whole expression 4+8+9 while typing" | regression | happy | Click `4`, `+`, `8`, `+`, `9`; read both lines after each click | C=`4`, `4+`, `4+8`, `4+8+`, `4+8+9`; E=(empty) after every click |
| AC-6 | "README equals shows the expression on the small line and the result below" | regression | happy | Click `4 + 8 + 9 =` | E=`4+8+9`, C=`21` |
| AC-6 | "README chained calculations evaluate left to right" | regression | boundary | Fresh page per case: `2 + 3 * 4 =`; `8 - 4 - 2 =` | E=`2+3×4` C=`20` (not 14); E=`8−4−2` C=`2` (not 6) |
| AC-6 | "README operator right after equals continues from the result" | regression | state | Click `4 + 8 + 9 = + 5 =` | E=`21+5`, C=`26` |
| AC-6 | "README decimal point support adds decimal operands" | regression | happy | Click `1 . 5 + 2 . 2 5 =` | E=`1.5+2.25`, C=`3.75` |
| AC-6 | "README floating-point rounding trims noise and limits decimals" | regression | boundary | Fresh page per case: `0 . 1 + 0 . 2 =`; `1 / 3 =` | E=`0.1+0.2` C=`0.3`; E=`1÷3` C=`0.3333333333` |
| AC-6 | "README division by zero shows Error" | regression | error | Click `5 / 0 =` | E=`5÷0`, C=`Error` |
| AC-6 | "baseline Error recovery starts a fresh calculation on the next digit" | regression | recovery | Click `5 / 0 = 7` | E=(empty), C=`7` (historical behavior; the README does not state it) |

## Matrix — regression (`tests/regression/source-safety.test.js`, static scan of the three shipped files: `index.html`, `script.js`, `calculator-core.js`)

Rule for every row: read all three files as text; a **missing file fails the test (never skips)**; for the two JS files strip `//` and `/* */` comments before matching so prose in comments is not flagged.

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result |
|---|---|---|---|---|---|
| AC-7 | "shipped scripts contain no import or export statement" | regression | security | Scan `script.js` and `calculator-core.js` for a statement-form `import` or `export` (a line whose first token is `import` or `export`, plus dynamic `import(`). `module.exports` and the `globalThis` guard are allowed and must not be flagged | Zero matches in both files |
| AC-7 | "index.html contains no script of type module" | regression | security | Scan `index.html` for any `<script` tag whose attributes include `type="module"` (either quote style, case-insensitive) | Zero matches |
| AC-7 | "shipped scripts contain no eval, new Function or document.write" | regression | security | Scan the two JS files for `eval(`, `new Function`, `Function(` and `document.write` | Zero matches in both files |
| AC-7 | "shipped scripts contain no innerHTML, outerHTML or insertAdjacentHTML" | regression | security | Scan the two JS files for those three identifiers | Zero matches in both files |
| AC-7 | "index.html and scripts reference no third-party or CDN host" | regression | security | Scan `src`/`href` values in `index.html` and any `http://` / `https://` / protocol-relative `//host` string in the three files | Zero absolute or protocol-relative URLs; every `src`/`href` is a relative path |

## Resolved questions and superseded rows

All three questions raised at the first gate 2 pass were answered by the user on 2026-09-21 and folded into the unit by the planner (`.agent/handoffs/PLAN-04-planner-to-orchestrator.md`). The observation column is kept unchanged as the record of what the unmodified `script.js` at `e02035b` does (`CALC-001` cites it as the pre-fix reference). No row in this section has a quoted test name in column 2, so `validate.mjs state` does not treat any of them as tests.

| ID | Observation (verified by running unmodified `script.js`) | Conflict | Resolution (user, 2026-09-21) | Where it lives now |
|---|---|---|---|---|
| OQ-B1 | Division by zero in the **middle** of a chain never shows `Error`: `5 / 0 +` shows C=`5÷0+` (E empty). Following that: `=` gives E=`5÷0+Error`, C=`NaN`; `+`/`*` (any operator) give C=`0+`/`0×`; a digit gives a fresh calculation (C=that digit); `DEL`/`AC` give C=`0`. `5 / 0 =` (division by zero as the last step) does show `Error`. | README "Division-by-zero shows `Error`" and AC-4's intent | Separate fix unit `CALC-001`. The path is neither pinned nor fixed in BOOT-001 (option (b) of the earlier list) | `.agent/units/CALC-001.md`. Excluded from this matrix: AC-6 forbids any test here asserting an expectation for it. The values in this row are the RED reference for `CALC-001`. RK-1 residual risk stays (see "Not covered") |
| OQ-B2 | `=` pressed right after an operator reuses the still-held number as the second operand: `5 + =` gives E=`5+5`, C=`10`; `5 * =` gives `5×5` = `25`. | README silent | Frozen as baseline | AC-8(e). Required rows: "uses the held value as the second operand when equals follows an operator" (unit) and "equals right after an operator uses the held value as the second operand on the page" (integration). If the user later calls it a defect it needs a `test-change` decision |
| OQ-B3 | `DEL` right after an operator, after `=`, or on `Error` clears the whole calculation (trail included) instead of removing just the last token. | README silent; AC-6 names the case but not its outcome | Frozen as baseline | AC-8(c). Required rows: "DEL right after an operator clears the whole calculation", "DEL after a result clears the result and the expression line", "clears Error with DEL" (unit); "DEL right after an operator clears the whole calculation on the page", "DEL on Error clears it on the page" (integration) |

**Superseded rows for OQ-B1: SUPERSEDED by `CALC-001`, not part of the BOOT-001 required set.** The user chose a separate fix unit (2026-09-21). The three rows below were proposals for pinning the defective behavior; they must **not** become tests in this unit (AC-6: no test here may assert an expectation for the mid-chain path). Their last column is the *pre-fix* behavior of `script.js` at `e02035b`, kept only as the RED reference for `CALC-001`, which replaces it with the fixed behavior (`5 / 0 +` renders expression `5÷0` and current `Error`). Column 2 deliberately carries no quoted test name:

| ID | Status and sequence | Layer (had it been activated) | Input | Pre-fix value at `e02035b` (reference only, never asserted here) |
|---|---|---|---|---|
| OQ-B1 | SUPERSEDED by `CALC-001`: `5 / 0 +` (live) | integration + unit | click/apply `5 / 0 +` | E=(empty), C=`5÷0+` |
| OQ-B1 | SUPERSEDED by `CALC-001`: `5 / 0 + =` | integration + unit | click/apply `5 / 0 + =` | E=`5÷0+Error`, C=`NaN` |
| OQ-B1 | SUPERSEDED by `CALC-001`: `5 / 0 + 3` | integration + unit | click/apply `5 / 0 + 3` | E=(empty), C=`3` |

## Not covered (with reason)

- **Mid-chain divide-by-zero** (`5 / 0 +` and its follow-ups): excluded by decision (OQ-B1 resolved: separate fix unit `CALC-001`; neither pinned nor fixed here). No required row asserts any expectation for it, and no sequence in this matrix applies an operator after a zero divisor: every zero-divisor sequence ends in `=` (checked by a scan of the input column). Residual risk (RK-1): the extraction could change that path and nothing in the suites of this unit would notice; drift is detectable only by the RED run of `CALC-001` or by a manual probe comparing `git show e02035b:script.js` with the extracted code. The DoD line of the unit ("the mid-chain path still behaves as at `e02035b`") is therefore **not automatable here** and stays `UNVERIFIED` by test (flagged to the orchestrator).
- **Unreachable branch**: `DEL` reducing the current value to `-` (turning it into `0`) cannot be reached by any button sequence, because a negative value only ever exists as a result and every later `DEL`/digit either clears or replaces it first. No test is possible through the public inputs; the implementer may drop or keep the dead branch. Residual risk: none observable.
- **Core behavior for an unrecognized input descriptor** (corrected 2026-09-21, traceability fix; this bullet earlier said the policy was untested in the unit layer): no AC states it (ignore versus throw an invariant error per CLAUDE.md §4). The implementer chose "throw a `TypeError`" and recorded it in `.agent/decisions/D-003-core-api.md`; it is now pinned by the unit row "throws a TypeError for a malformed input descriptor" (mapped to AC-1, see that row). The observable DOM behavior (clicking a non-button target is ignored) is pinned by the integration row "clicking the button container outside any button changes nothing" and, for a button whose `data-number` value is markup, by "treats a button data attribute containing markup as inert text". Residual risk: the throw policy is a design decision rather than a stated requirement, so a later unit that changes it needs a `kind: test-change` decision for that one row; the DOM layer's own filtering of an out-of-range `data-operator` or `data-action` value is not pinned by an integration row (reviewer finding F-1 in `.agent/handoffs/BOOT-001-14-reviewer-to-orchestrator.md`, non-blocking, outside this traceability fix).
- **Number formatting beyond the safe range**: observed and deliberately not pinned. Very large or very small results print with JavaScript exponent notation (`10000000000 * 1000000000000 =` gives C=`1e+22`; `0.0000000005 + 0 =` gives `5e-10`) and precision is lost (`9999999999 * 9999999999 =` gives C=`99999999980000000000`, the exact value ends in `...01`). README is silent; freezing accidental formatting would only force test-change decisions later. Residual risk: the rounding expression could change for extreme values; the ten-decimal, tiny-value and large-integer rows cover the realistic range.
- **Smaller/dimmed styling of the expression line, dark theme, responsive layout**: CSS-only, no real browser (D-001). `UNVERIFIED`; manual checklist stays with the user (RK-3).
- **Real `file://` loading**: proven only by proxy (rows "runs every script tag of index.html in document order without module syntax", "loads calculator-core.js before script.js in index.html", the `type="module"` scan). A manual open-the-file check remains `UNVERIFIED` (RK-3, RK-4).
- **Real-browser click mechanics** (focus ring, touch, double-click text selection): outside the stub; `UNVERIFIED`.
- **Keyboard input, focus handling, `preventDefault`**: out of scope here (KEY-001).
- **Stored/networked/persisted data, authentication**: the calculator has none; the only security surface is DOM output and script loading, covered by the AC-7 rows.
- **Concurrency / timing / randomness**: none in the product; rapid clicking equals sequential input.
- **Stub self-tests**: not separate rows. Vacuity is guarded because every integration expectation differs from the initial `0` and the initial-display row would fail if scripts did not run.

## AC notes (the planner amendment of 2026-09-21 resolved the earlier notes; new remarks are non-blocking)

Resolved by the amendment (checked against the amended unit file):

- **AC-1: resolved.** The entry points are bound to the core-API decision record ("at least three" functions); the fresh render, state independence and non-mutation are stated in the AC and pinned by rows. "No `document`/`window` access at call time" has no row of its own: the row "loads in a Node process that defines no document or window" asserts both globals are undefined in the test process and every unit row runs in that same process, so any call-time access would throw a ReferenceError. Constraint for the implementer: the unit test file must not define `document`, `window` or a stand-in for either anywhere.
- **AC-4: resolved.** AC-4 states expression `5÷0` with current `Error`; the stale parenthetical in the row was updated to say so (values unchanged).
- **DEL / AC / no-op `=` / `=`-after-operator: resolved.** AC-8 was added and nine rows re-labelled (see the clause map after the unit matrix).
- **AC-6: resolved.** AC-6 names this matrix as the expectation record and excludes the mid-chain divide-by-zero path. The record is this document plus the implementer pre-extraction green run (machine evidence); the throwaway probe runs are not committed, so their reproducibility stays `UNVERIFIED` until that green run exists.
- **AC-7: resolved.** The scan is scoped to the three named files, which is how the rows are already written.

New remarks (no matrix change needed, none blocks READY):

- **AC-8 has no clause for `DEL` inside a second operand.** The row "DEL in the second operand changes only that operand" (`4 + 8 DEL` gives expression empty and current `4+0`; then `5 =` gives `4+5` and `9`) was re-labelled AC-8 by the dispatch, but none of clauses (a)-(f) states it. Its expectation is unchanged and was re-verified against the script. Suggest the planner add a clause (g) at the next replan, or accept that it sits under the general "edit inputs" wording of AC-8.
- **AC-8(c) `5 / 0 = DEL` has no AC-8-labelled row.** By dispatch decision the row "clears Error with DEL" stays on AC-4; it pins exactly the values AC-8(c) states (expression empty, current `0`), so the clause is covered and traceable through the clause map. If a reviewer insists on a literal AC-8 row, the remedy is a new named row, not a rename; none was added because the clause is already covered.
- **The DoD line about the mid-chain path is not testable in this unit** (AC-6 forbids asserting the path). See "Not covered". The only detection is an independent probe by the reviewer or the RED run of `CALC-001`.
- **AC-7 scan wording.** AC-7 says `eval`; the row scans for `eval(`, so an indirect form such as `const f = eval;` would slip through. The implementer may match the word `eval` with word boundaries instead: that is a superset and satisfies the same row.

## Regression impact

- **Existing tests at risk / to expand**: none. `tests/` holds only `tests/regression/REGISTRY.md`; there are zero calculator tests today, so nothing can be broken and no `test-change` decision is needed. Every row here is new.
- **Existing behavior at risk (no test protects it today)**: everything in README — live trail, `=` split, chaining, continue-from-result, decimals and rounding, `Error`, plus AC/DEL button behavior. The extraction rewrites every code path in `script.js`; the safety-net files (integration + `readme-behavior` regression) are the protection and must be green on the unmodified script before the first extraction edit.
- **Files that change later in this unit**: `script.js` (becomes a thin DOM layer), `index.html` (adds `<script src="calculator-core.js">` before `script.js`), `README.md` Files section. `style.css` is untouched.
- **Downstream**: `CALC-001` (depends on BOOT-001) re-runs the three BOOT-001 suites unmodified on its own `head_ref` (its AC-5) and only appends new rows for the mid-chain path (`tests/regression/divide-by-zero.test.js` plus additions to the unit and integration files), so no row here changes; its RED run is also the only automated detector of extraction drift on that path. KEY-001 (depends on BOOT-001 and CALC-001) extends `tests/helpers/dom-stub.js` and re-runs `readme-behavior.test.js` unmodified; any expectation changed there needs a `kind: test-change` decision.
- **Registry rows to add to `tests/regression/REGISTRY.md`** (origin `BOOT-001`), 13 rows:
  - `tests/regression/readme-behavior.test.js` :: the 8 test names in the "readme-behavior" table above (README bullets: live trail, `=` split, chaining, continue-from-result, decimals, rounding, `Error`; plus baseline Error recovery).
  - `tests/regression/source-safety.test.js` :: the 5 test names in the "source-safety" table above (behavior preserved: classic scripts only / no module syntax, no `eval`/`new Function`, no HTML injection, no third-party hosts).

## Coverage summary by category

| Category | Rows (representative) |
|---|---|
| happy | core loading, `4+8+9=`, each operator, digit wiring, README bullets |
| boundary | leading zeros, 20-digit operand, ten-decimal rounding, tiny result to `0`, large whole-number result, zero divisors, left-to-right grouping |
| invalid | second decimal point (unit + page), click outside any button |
| error | divide by zero as the final step (`5 / 0 =`, `2 + 3 / 0 =`), README `Error` |
| edge | negative zero, trailing decimal, decimal after held decimal result, `=`-after-operator, no-op `=`, operator as first input, DEL after operator/result (the AC-8 rows) |
| security | markup-write traps (2 integration rows), five static-scan rows |
| state | growing trail, continue-from-result (twice), operator replacement (four variants), independent states, immutable earlier states |
| recovery | Error left by digit / operator / AC / DEL (unit and page), AC after result |

Totals (corrected 2026-09-21, traceability fix; they previously read 84 named rows with 51 unit rows): 85 named rows: unit 52, integration 20, regression 13. Every AC-1 to AC-8 has at least one named row (checked by script against the AC list in the unit file). Rows per AC:

| AC | Unit | Integration | Regression | Total |
|---|---|---|---|---|
| AC-1 | 6 | 0 | 0 | 6 |
| AC-2 | 7 | 0 | 0 | 7 |
| AC-3 | 12 | 0 | 0 | 12 |
| AC-4 | 9 | 0 | 0 | 9 |
| AC-5 | 9 | 0 | 0 | 9 |
| AC-6 | 0 | 18 | 8 | 26 |
| AC-7 | 0 | 2 | 5 | 7 |
| AC-8 | 9 | 0 | 0 | 9 |
| Total | 52 | 20 | 13 | 85 |

## Mutation sanity (what each key behavior would miss without its row)

- Drop `Math.round(x * 1e10) / 1e10`: caught by the rounding rows (0.1+0.2, ten decimals, tiny value, README rounding).
- Test `dataset.number` by truthiness (breaks the `0` button): "wires every digit button 0 to 9 to the main line".
- Check the decimal point before resetting the operand after an operator: the "starts the next operand with 0. after an operator…" rows and the page row.
- Check the decimal point before clearing after a result: "starts 0. when a decimal point follows a decimal result".
- Append instead of replacing on operator repeat: the four operator-replacement rows.
- Make `=` with no operator compute or clear: "ignores equals when no operator is pending" (unit and page).
- Keep module-level state in the core / mutate in place: "keeps two fresh states independent of each other", "leaves an earlier state unchanged…".
- Use `innerHTML` for the display: "updates the display through textContent without writing markup".
- Drop the Error-first clearing on operator: "clears Error and starts from 0 when an operator follows Error" (unit and page).
- Let `DEL` after an operator, a result or `Error` remove only the last character instead of clearing the whole calculation: the AC-8(c) rows and the page rows for `DEL` after an operator / on `Error`.
- Let a second `=` repeat or recompute the last operation: "ignores a second equals after a result".
- Let `AC` leave the pending operator or the trail behind: "AC clears the pending operator, the trail and the result" (`4 + 8 AC 5 =` must show current `5` with an empty expression line).
- Make `=` right after an operator do nothing instead of reusing the held value: "uses the held value as the second operand when equals follows an operator".

## Adequacy self-check
- [x] Each AC has at least one test that would FAIL if the behavior were absent (AC-1 to AC-8; per-AC counts in "Coverage summary by category")
- [x] Every AC-8 clause (a)-(f) maps to a named row with the exact values AC-8 states (clause map after the unit matrix); values re-verified against the unmodified `script.js`
- [x] Invalid input and error paths covered
- [x] State transitions covered (sequence tests, not just single actions)
- [x] No test asserts implementation details (assertions are on rendered E/C strings and on the observable "no markup write" trap; the two purity rows assert observable independence, which AC-1 requires)
- [x] The mid-chain divide-by-zero path is deliberately not pinned (OQ-B1 moved to `CALC-001`); no required row applies an operator after a zero divisor
- [ ] Automated detection of extraction drift on the mid-chain divide-by-zero path: not possible in this unit by decision (RK-1 residual; see "Not covered" and "AC notes")
