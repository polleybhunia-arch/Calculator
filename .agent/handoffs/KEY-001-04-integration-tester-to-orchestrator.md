---
unit: KEY-001
from: integration-tester
to: orchestrator
sequence: 04
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-04: integration-tester → orchestrator

## Context
Executed dispatch `.agent/handoffs/KEY-001-03-orchestrator-to-integration-tester.md` in full, on
branch `agent/KEY-001-keyboard-input`, through all four sub-steps in order, committing after each.
D-008/D-009/D-010 followed as written; no new decision was needed (two places where reality
diverged from the dispatch's stated expectation are reported honestly below, not force-fit — see
"Results" sub-steps 2 and 3). Tree is clean; `node .agent/tools/validate.mjs state` → `OK`.

## Acceptance criteria
Covered (my layers only): AC-1 (carried-forward vocabulary/scan items), AC-2 … AC-7 (integration +
regression rows), AC-8 (two regression rows, intentionally red — documenter's job next). Unit-layer
AC-1/AC-7 rows and `tests/helpers/core-input.js` are the implementer's, not written here.

## Relevant files
- `tests/helpers/dom-stub.js` — extended (D-008): `document.activeElement`, `element.focus()`/`blur()`,
  `page.click()` now focuses its target first, native Enter/Space default-action simulation for a
  focused `<button>` (suppressible by `preventDefault()`)
- `tests/helpers/source-scan.js` — modified (D-009): `stripComments` now tracks the last significant
  character to distinguish a regex literal from division, so an embedded `//`/`/*` inside a regex
  literal is never mistaken for a comment marker; new `stripHtmlComments()`; `readAllShipped()` now
  also returns `htmlCode` (index.html with HTML comments stripped)
- `tests/regression/source-safety.test.js` — modified (D-009): 3 existing tests widened to also scan
  `index.html`'s `htmlCode` with the full pattern sets; 1 new test pins the `stripComments` fix
- `tests/integration/keyboard.test.js` — new, 24 rows (titles verbatim from the matrix)
- `tests/regression/keyboard-and-click-parity.test.js` — new, 7 rows (GUARD + 6, titles verbatim)
- `tests/regression/REGISTRY.md` — annotated (3 widened `source-safety` rows) + 8 new rows
  (1 `source-safety` stripComments row, origin `KEY-001`; 7 `keyboard-and-click-parity` rows)

## Tests created / executed
- created: `tests/integration/keyboard.test.js` (24 tests), `tests/regression/keyboard-and-click-parity.test.js`
  (7 tests, 1 written in sub-step 1 + 6 in sub-step 3)
- modified: `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`,
  `tests/regression/source-safety.test.js` (all covered by D-008/D-009, confirmed by `git diff`)
- executed (run-gate evidence, chronological):
  - `.agent/test-results/KEY-001/latest-unit-green.json` (unit, green, head `7bb4380c` then re-run
    at `c210e109` — see below; currently shows `c210e109`, 67/67)
  - `.agent/test-results/KEY-001/latest-integration-green.json` (integration, green, head `c210e109`
    — sub-step 1/2 snapshot, 22/22; sub-step 3 only ran `--phase red`, see below)
  - `.agent/test-results/KEY-001/latest-regression-green.json` (regression, green, head `c210e109`,
    19/19 — after the `stripComments` fix, before the 6 new keyboard rows were added)
  - `.agent/test-results/KEY-001/latest-regression-red.json` (regression, red, head `2e1f3558`,
    19 pass / 6 fail — the sub-step 3 confirmation; also holds an earlier red run at `f943a3f0`
    in its git history, 18 pass / 1 fail, superseded)
  - `.agent/test-results/KEY-001/latest-integration-red.json` (integration, red, head `2e1f3558`,
    27 pass / 19 fail)
  - `.agent/test-results/KEY-001/latest-unit-red.json` (unit, red, head `2e1f3558`, 67/67 pass —
    unaffected by this dispatch, run only for completeness)

## Results

### Sub-step 1 — dom-stub.js extension + GUARD row (commits `7bb4380c`, `32728d2`)
Added the 6 primitives (D-008). Smoke-tested them directly (fresh page → `activeElement===null`;
click focuses target; `blur()` clears it; `focus()` alone models Tab; native Enter/Space clicks a
focused button; `preventDefault()` suppresses it) before writing the GUARD row. Ran all three gates
against the **unmodified** `script.js`/`calculator-core.js`: unit 67/67, integration 22/22,
regression 18/18 (17 baseline + the new GUARD row), all bound to `7bb4380c`, clean tree. GUARD row
confirmed green here, as required — this is the "before" run; the "after" run (same row, unchanged)
is the implementer's, once `blur()` lands in `script.js`.

### Sub-step 2 — widen the security scan (commits `f943a3f0` RED code, `bec15a2` RED evidence,
`c210e10` GREEN code, `4020268` GREEN evidence, `79f3589` REGISTRY)
Widened the 3 named tests to scan `index.html`'s `htmlCode` (comment-stripped) and added the new
`stripComments` row, **before** fixing `stripComments`. Confirmed RED: **only 1 of the 4 rows
failed** (the new `stripComments` row) — the 3 widened rows passed even pre-fix, because
`index.html` currently contains none of the scanned patterns. This differs from the dispatch's
literal wording ("confirm each of the 4 rows fails") but matches the matrix's own footnote on this
exact point (`.agent/units/KEY-001.matrix.md` line 24, "unaffected today only because it happens to
contain none of the forbidden patterns"). To prove the widening is not vacuous I ran an out-of-band
probe (not part of the committed suite, documented in commit `f943a3f0`'s message): an injected
inline `onclick="eval(x)"` attribute and a bare protocol-relative host outside any `src`/`href` are
both caught by the new scan and were **not** caught by the old one; prose mentioning `eval`/`innerHTML`
inside an HTML comment does not false-positive. Also found the matrix's literal "two-line snippet"
setup text for the new `stripComments` row does not reproduce the defect (the buggy stripper only
eats through end-of-line, and a statement on the *next* line is unaffected regardless) — the matrix's
own **expected-result** text ("the rest of the line, including `eval(payload);`, is discarded") is
unambiguous that both statements must be on one line, so I built the row that way; this is not a
requirement change, just resolving an internal inconsistency in the row's own setup vs. expected-result
wording in the same direction the expected-result already pointed, so no `test-change` decision applies.
Applied the fix; reran all rows and the probe: `stripComments` row now green, probe still catches
both injected violations, still ignores the HTML-comment case. Full regression suite 19/19,
unit 67/67, integration 22/22 at `c210e109`, clean tree. REGISTRY.md annotated + 1 new row.

### Sub-step 3 — RED integration/regression tests (commits `2e1f355` RED code, `fc8ce65` RED
evidence, `cd90902` REGISTRY)
Wrote all 24 integration rows and the remaining 6 regression rows (GUARD already existed). Ran
`integration --phase red` and `regression --phase red`: **19 of 24 integration rows fail** because
the key map/exported vocabulary/keydown listener/repeat policy do not exist yet — verified each
failure message is a genuine assertion mismatch (e.g. `0 !== 1` for the preventDefault-count row,
wrong display pairs elsewhere), never an import/setup crash. **5 integration rows pass without any
new code**, each for a documented, legitimate reason (not vacuous):
- "Tab never has preventDefault called" — a negative property true both before and after any listener
  exists; remains meaningful post-implementation as a regression guard.
- The two Tab-then-native-Enter/Space digit-activation rows — the stub's native-activation (D-008)
  fires a real click regardless of whether an app keydown listener exists; with no listener yet to
  double-fire, exactly one action already occurs. These rows still matter after implementation: they
  fail if a future keydown listener wrongly intercepts a button-targeted Enter/Space.
- The two data-operator/data-action security rows (carried-forward item 1) — `script.js`'s existing
  `inputFromElement()` filter already handles these correctly; these rows close a pre-existing test
  *coverage* gap, not a missing feature.
I found and fixed two rows that would have passed **vacuously** for the wrong reason during drafting
(the Escape-and-Delete-on-unfinished-chain assertions): the fresh-page default display (`''`, `'0'`)
coincidentally equals the expected post-clear display, so without an explicit precondition assertion
proving the chain actually got typed first, a completely broken key map would still pass. Added
precondition assertions before committing; both rows now fail for the right reason (the precondition
itself fails, since typing does nothing yet).
All 6 new regression rows fail: the 3 key-vs-click-parity rows and Ctrl+R fail because typing keys
does nothing yet; the 2 README rows fail because `README.md` has no keyboard section/bullet —
confirmed each failure is a missing-text assertion (`assert.notEqual(section, null, ...)` /
`assert.ok(bullets.some(...))`), never a file-read error. Full suite: integration 27/46 (22 baseline
+ 5 legitimate passes above), regression 19/25 (19 baseline/GUARD/stripComments unaffected, all 6
new red), unit 67/67 unaffected, at `2e1f3558`, clean tree. REGISTRY.md: 7 new rows appended.

## Decisions made
None new. D-008, D-009, D-010 applied exactly as written; the two findings above (vacuity of 3
widened scan rows; the "two-line" vs. same-line snippet wording) are resolutions of ambiguity
already flagged/present in the matrix itself, not requirement changes, so no `kind: test-change` or
other decision record was needed.

## Known risks
- **GUARD row must be re-run after the implementer's `blur()` change lands** (its "after" proof);
  this handoff only supplies the "before" proof from sub-step 1.
- **`CALC_STUB_TRANSFORM` gate-evidence gap** (matrix carried-forward item 5) — forwarded, unresolved,
  human/`run-gate.mjs` decision, not touched here.
- Native-activation simulation, real focus rings, real OS auto-repeat timing remain `UNVERIFIED`
  (RK-2/RK-3) — no real browser available.
- The call-count spy technique (wrapping the `textContent` setter descriptor on `#display-current`
  for AC-6/AC-7's Tab+`=`/repeat-operator/repeat-Enter rows) is a deliberate substitute for the
  matrix's literal "wrap `CalculatorCore.applyInput`" setup text: `script.js` destructures
  `applyInput` into a local `const` at load time, so patching `CalculatorCore.applyInput` after
  `loadPage()` has no effect on the already-running click/key handlers. Since `dispatch()` always
  writes both display lines exactly once per call regardless of whether values changed, counting
  writes to one line is an exact, non-invasive proxy for the same call count the matrix asks for.
  Documented inline in `tests/integration/keyboard.test.js`'s `spyOnDispatches` helper.

## Outstanding issues
None from this dispatch. Everything expected to remain red (19 integration + 6 regression rows) is
red for the stated reason; nothing expected to be green is red; nothing unexpectedly green is
unexplained.

## Required next action
Implementer's turn (D-010 step 2): write `tests/unit/key-map.test.js` + `tests/helpers/core-input.js`
(RED), then implement `mapKey`, the repeat-policy function, the exported input vocabulary
(D-005 clause 5) in `calculator-core.js`, and the `keydown` listener + click-handler `blur()` in
`script.js`. After GREEN/REFACTOR, re-run the GUARD row (must stay green — the "after" proof) and
all suites here (expect integration 46/46, regression 25/25 minus the two AC-8 rows, which stay red
until the documenter's README edit per D-010 step 3).
