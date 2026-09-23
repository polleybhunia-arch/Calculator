---
kind: test-change
id: D-008
unit: KEY-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)); the change is planned in the KEY-001 matrix and will be made by integration-tester
---

# D-008 — dom-stub.js extended with focus, blur and native-activation primitives

## Context
`validate.mjs state` requires a `kind: test-change` decision for any modification of a pre-existing
file under `tests/` (CLAUDE.md §14). `tests/helpers/dom-stub.js` was written for `BOOT-001` and is
otherwise untouchable, but `KEY-001`'s AC-6 (a mouse click blurs its button; a `Tab`-reached button
keeps native `Enter`/`Space` activation) and AC-7 (auto-repeat) cannot be tested without
`document.activeElement`, `focus()`/`blur()`, and a simulated native default action for `Enter`/
`Space` on a focused `<button>` — none of which the stub has today. The matrix
(`.agent/units/KEY-001.matrix.md`, "Why dom-stub.js must change") also notes that AC-6's fix adds
`element.blur()` to the shared click handler in `script.js`, which every existing click-path test
already runs through, so the stub must support `blur()` before that fix lands or those tests would
throw.

## Decision
Accept the extension of `tests/helpers/dom-stub.js`.

- **Old behavior**: no focus tracking; no `focus()`/`blur()`; no native default action for `Enter`/
  `Space` keydowns. Parsing, click dispatch, click bubbling, markup-write traps, and `press()`/
  `loadPage()` are unchanged.
- **New behavior**, additive only (per the matrix, items 7–12): `document.activeElement` (`null` on a
  fresh page); `element.focus()` (sets `activeElement`, at most one focused element); `element.blur()`
  (clears `activeElement` back to `null`); `page.click(target)` now focuses the target before
  dispatching `click`, matching a real browser; a `keydown` for `key === 'Enter'` or `key === ' '`
  that bubbles from `document.activeElement` (a `<button>`) and is not `defaultPrevented` triggers a
  `click()` on that button once the bubble phase completes, suppressible by `preventDefault()`.
- **Why**: this is the only way to give AC-6 and AC-7 a real oracle instead of `UNVERIFIED`, and to
  keep the existing suites passing once `blur()` is added to the click handler.

## Alternatives considered
- A second, parallel stub file for `KEY-001` only. Rejected: `BOOT-001`'s and `CALC-001`'s tests
  would then run against a different DOM model than `KEY-001`'s, undermining the shared safety net.
- Skip focus/blur modeling and mark AC-6 `UNVERIFIED`. Rejected: the behavior is central to the unit
  and the primitives are small and mechanical to add.

## Consequences / residual risk
- Reviewers should confirm from `git diff` that `tests/helpers/dom-stub.js`'s existing parsing, click
  dispatch, click bubbling and markup-write-trap code is unchanged, and that only the primitives above
  are added.
- Per `.agent/decisions/D-010-key001-stage-order.md`, these primitives are written and proved against
  the **unmodified** `script.js` (which has no `blur()` call yet) before any product edit, so the
  existing `BOOT-001`/`CALC-001` suites are shown to stay green with the extended stub before the
  `KEY-001` implementation begins.
- The native-activation simulation approximates real browser default-action semantics for `<button>`
  only; real-browser fidelity stays `UNVERIFIED` (RK-2, RK-3).
