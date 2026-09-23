---
unit: KEY-001
from: implementer
to: orchestrator
sequence: 24
model_attested: claude-sonnet-5
state: TESTING
---

# Handoff KEY-001-24: implementer → orchestrator

## Context
Cycle-2 review F-1 (Major, `.agent/reviews/KEY-001-r2.md`): a held `Enter` on a Tab-focused
calculator button re-fired the browser's native click activation on every auto-repeat, because
the keydown listener's early-return for `Enter`/`Space` on a calculator button never consulted
`event.repeat`. `D-012` (proposed by architecture-reviewer) was rejected by the orchestrator: its
fix (`!allowsRepeat(buttonInput)`) does not suppress the reproduced digit-button case, since
digits are deliberately repeatable under OQ-4. Applied the code reviewer's option (a) instead, per
the dispatch: unconditionally suppress a repeat native activation regardless of the focused
button's input type.

## Acceptance criteria
AC-6 (exactly once) and AC-7 (repeats after the first ignored for `Enter`/`=`/operators) — scoped,
per the dispatch, to the fact that a focused button's native activation must act once per physical
press regardless of what input the button represents (a different concern from the
document-level channel's repeat policy, which still lets digits repeat).

## Relevant files
- `script.js` — inside the existing `Enter`/`Space`-on-calculator-button branch of the `keydown`
  listener, added `if (event.repeat) { event.preventDefault(); return; }` before the existing
  `return;`. No other lines changed.
- `tests/integration/keyboard.test.js` — added one new named test (placed after the AC-7 section,
  as it bridges AC-6's focused-button channel and AC-7's repeat policy):
  `"holding Enter on a Tab focused digit button performs the action once"`.

## Tests created / executed
- created: `tests/integration/keyboard.test.js` — `"holding Enter on a Tab focused digit button
  performs the action once"` (Tab-focus the `7` button, dispatch `Enter` repeat:false then two
  repeat:true, assert display `current` stays `'7'`).
- RED: `.agent/test-results/KEY-001/latest-integration-red.json` (head `74565b78`, dirty,
  46/47 pass, the new test fails: `current: '777'`, expected `'7'` — the exact F-1 symptom,
  not an import/setup error).
- GREEN: `.agent/test-results/KEY-001/latest-integration-green.json` (47/47 pass).
- REFACTOR: `.agent/test-results/KEY-001/latest-integration-refactor.json` (47/47 pass, no
  structural change made — the fix is a 4-line, single-purpose guard; nothing to extract).
- FINAL (all four gates, on committed head `1a862e0e`, clean tree):
  `.agent/test-results/KEY-001/latest-unit-final.json` (83/83),
  `.agent/test-results/KEY-001/latest-integration-final.json` (47/47),
  `.agent/test-results/KEY-001/latest-regression-final.json` (25/25),
  `.agent/test-results/KEY-001/latest-lint-final.json` (exit 0).

## Results
- Commit `1a862e0ef1ab432670ffb87826487ee55e12f6a2` — fix + new test + RED/GREEN/REFACTOR evidence.
- Commit `045b0bfd8d62451b61de43deb4322859b34b1557` — final gate evidence for that head.
- Current HEAD: `045b0bfd8d62451b61de43deb4322859b34b1557`, tree clean (`git status --short` empty).
- `node .agent/tools/validate.mjs state` → `state: OK`, exit 0.
- Mutation probe (in-memory only, `CALC_STUB_TRANSFORM`, nothing on disk changed —
  `git status --short` confirmed clean before and after): reverted the `if (event.repeat) {...}`
  block. Re-ran `tests/integration/keyboard.test.js` directly: 24/25 pass, only the new test fails
  (`current: '777'`, same failure as the genuine RED). Every other row in the file — including
  `"a digit button reached by Tab and activated by Space types the digit exactly once"`, `"the
  equals button reached by Tab and activated by Enter evaluates exactly once"`, and `"the equals
  button reached by Tab and activated by Space evaluates exactly once"` — stayed green under the
  mutation, because each of those sends exactly one non-repeat keydown and never exercises
  `event.repeat`; they are unaffected by this fix either way, as expected. The new test is
  genuinely discriminating for the fix and does not overlap the three pre-existing Tab-activation
  rows.

## Decisions made
None. D-012 was already resolved before this dispatch; no new decision required.

## Known risks
- One incident during this session, corrected before committing: an early exploratory
  `run-gate.mjs unit --unit KEY-001 --phase red` run (no unit-level test changed by this fix)
  overwrote `.agent/test-results/KEY-001/latest-unit-red.json`'s pointer with a passing, dirty-tree
  result, clobbering the genuine historical RED (head `fa16dfa3`, 69/83, from the original
  key-map/allowsRepeat RED cycle). Restored the pointer from the still-present timestamped copy
  `unit-red-2026-09-22T04-07-22-770Z.json` (byte-identical to the prior committed
  `latest-unit-red.json`, diff-confirmed) and deleted the spurious new timestamped file before
  committing anything; `git diff` against the prior commit for that file was empty at commit time.
  No unit-level RED was needed or claimed for this fix — it is integration-layer only.
- Real-browser behavior of held `Enter` on a focused button remains `UNVERIFIED` (RK-3, carried) —
  this fix is pinned only by the DOM stub's model of native activation, same residual as before.
- Everything else in scope per the dispatch: no other files touched, no other findings addressed
  (r2 F-2, F-3 and all carried Minor/Nit items remain out of scope, unchanged).

## Outstanding issues
None from this fix. Matrix update for the new row (test-designer, per dispatch) not yet done —
dispatch explicitly said not to block on it.

## Required next action
Orchestrator: independently re-run the four final gates on `045b0bfd8d62451b61de43deb4322859b34b1557`
and `validate.mjs state`/`evidence KEY-001`, then dispatch cycle-3 reviews (code, security if
re-triggered, architecture if re-triggered) bound to this new head, since the commit invalidates
prior cycle-2 review evidence per CLAUDE.md §11.
