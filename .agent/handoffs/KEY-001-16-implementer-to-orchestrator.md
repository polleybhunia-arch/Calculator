---
unit: KEY-001
from: implementer
to: orchestrator
sequence: 16
model_attested: claude-sonnet-5
state: TESTING
---

# Handoff KEY-001-16: implementer → orchestrator

## Context
Fix cycle for the two `CHANGES_REQUIRED` reviews (`.agent/reviews/KEY-001-r1.md` F-1/F-2,
`.agent/reviews/KEY-001-arch1.md` F-1), applying `.agent/decisions/D-011-click-origin-and-focus-policy.md`
Option A. Only the named Major findings were touched; every Minor/Nit finding remains a
user-approved known issue already recorded in `.agent/units/KEY-001.md` Known Issues — nothing
else was changed.

## Acceptance criteria
AC-6 (`.agent/units/KEY-001.md`, rewritten 2026-09-21) — both sentences now hold: a mouse click
blurs its button; a Tab-focused button's native `Enter`/`Space` activation does not.

## Relevant files
- `script.js:74-79` — `event.target.blur()` now gated `if (event.detail > 0)`: a real pointer
  click reports `detail >= 1`; the browser's native-activation click reports `detail === 0`.
- `tests/helpers/dom-stub.js:118-137` — the native-activation click synthesized in `Node#dispatchEvent`
  now carries `detail: 0`.
- `tests/helpers/dom-stub.js:531-539` — `page.click()` now dispatches its click with `detail: 1`.
  (Modification of a file `D-008` already covers in spirit per the dispatch; one Log line, not a
  new decision record.)
- `tests/integration/keyboard.test.js:230-259` — corrected the one row named by r1 F-1 (test name
  unchanged: "a mouse click blurs its button so a following Enter is read as a normal key not a
  repeat click"). It now asserts `document.activeElement` directly for both halves: `null` after
  `page.click()`, and still the Tab-focused button after a native `Enter` activation on it. The
  follow-up keys route through `page.document.activeElement || page.document.body` instead of
  always `document.body`, so `blur()`'s removal is actually observed.
- `calculator-core.js` — untouched; the fix is entirely in the DOM adapter and the stub, so no
  `D-003` addendum update was needed (dispatch step 4 confirmed this is conditional).

## Tests created / executed
- Modified (not created): `tests/integration/keyboard.test.js`, one test.
- RED: `.agent/test-results/KEY-001/latest-integration-red.json` — exit=1, tests=46 (45 pass / 1
  fail), head=`7a58e5bd` (dirty=true, pre-fix). Failure: `assert.equal(tabbedPage.document.activeElement, seven, …)` — actual `null`, expected the button — i.e. focus lost after native `Enter` activation, the exact AC-6 defect. All other 45 rows still passed (confirms the RED is isolated to the targeted row, not a setup/import break).
- Also ran (unaffected, confirms nothing else broke pre-fix): `.agent/test-results/KEY-001/latest-unit-red.json` — 83/83 pass (unit layer untouched by this test edit).
- GREEN: `.agent/test-results/KEY-001/latest-{unit,integration,regression}-green.json` — 83/46/25, all exit=0, head=`7a58e5bd` (dirty=true, code fix applied but not yet committed).
- REFACTOR (no behavior change, re-run only): `.agent/test-results/KEY-001/latest-{unit,integration}-refactor.json` — 83/46, exit=0.
- FINAL (post-commit, authoritative): `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json` — unit 83/83, integration 46/46, regression 25/25, lint exit=0, all `head=5678cc1b70f39af6859c980a8520bb858418a140`, `dirty=false`.

## Results
- Four gates pass at the expected counts: unit 83/83, integration 46/46, regression 25/25, lint PASS.
- Corrected test verified genuinely discriminating, not vacuous: two throwaway `CALC_STUB_TRANSFORM`
  mutation probes (nothing written to disk, `git status --short` confirmed clean of probe artifacts
  both times) — (1) reverting `script.js`'s guard back to the unconditional `event.target.blur();`
  (the exact pre-fix bug) makes the corrected row fail; (2) removing the `blur()` call entirely (the
  original r1 F-1 probe, "M8") also makes it fail. Both leave the other 23 rows in the file green.
- `node .agent/tools/validate.mjs state` → `state: OK`.

## Decisions made
None new. Implemented D-011 Option A exactly as specified (no deviation found; the stub's event
model carried `detail` cleanly, no blocker hit). Per the dispatch, the `dom-stub.js` modification is
covered by a unit-Log line rather than a new decision record — orchestrator to add.

## Known risks
- Real-browser `event.detail` semantics for native `Enter`/`Space` activation remain `UNVERIFIED`
  (RK-3, no browser here) — carried from D-011's own residual-risk note, unchanged by this fix.
- AC-7 / held-`Enter`-on-a-focused-button: per the dispatch's explicit scope boundary ("a held Enter
  on a focused button is a separate concern... do not conflate the two"), this was deliberately left
  untouched. Note for awareness: now that native activation no longer blurs, a *held* `Enter` on a
  Tab-focused button would (per the stub's model of native activation, which fires on every keydown
  whose target is still `document.activeElement`, not gated by `event.repeat`) synthesize a click per
  repeat keydown, each unconditionally dispatching — no existing test exercises this (all AC-6 rows
  send exactly one non-repeat keydown to a focused button; all AC-7 held-key rows target
  `document.body`, never a focused button), so no gate is affected, but it is a plausible real-browser
  auto-repeat risk if a user holds Enter after Tabbing to a button. Flagging for the orchestrator/user
  to decide whether this needs its own Known Issue entry — I did not add one myself since inventing
  new scope was explicitly out of bounds this cycle.
- Two commits were needed (code fix, then final-gate evidence) because evidence is SHA-bound and must
  be recorded post-commit; `HEAD` is therefore `fce89ba63b0a50d685b7b010217724fd7e30714f` while the
  final-gate evidence's recorded `head` is `5678cc1b70f39af6859c980a8520bb858418a140` (the code
  commit). `git diff 5678cc1b..HEAD` touches only `.agent/test-results/**` — the same `.agent`-only
  drift pattern r1 F-8 already accepted last cycle. Recommend pointing the unit's `head_ref` at
  `5678cc1b` (the code SHA the evidence is bound to), consistent with F-8's resolution.

## Outstanding issues
None from this cycle's required scope. All Minor/Nit findings from r1/arch1/sec1 remain open exactly
as recorded in `.agent/units/KEY-001.md` Known Issues (unchanged by me).

## Required next action
Orchestrator: add the one-line Log entry for the `dom-stub.js` modification (per dispatch, covered
in spirit by D-008, no new decision record needed); re-dispatch the three reviews
(`reviewer`, `security-reviewer` — invalidated by this fix commit per CLAUDE.md §11 —, and
`architecture-reviewer`) against `head_ref` = `5678cc1b70f39af6859c980a8520bb858418a140`; decide
whether the held-Enter-on-focused-button observation above needs its own Known Issue line.
