---
unit: KEY-001
from: orchestrator
to: implementer
sequence: 15
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-15: orchestrator → implementer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). implementer is a Sonnet agent (no fallback); attest your own model.

## Context
`KEY-001`'s cycle-1 review returned `CHANGES_REQUIRED` at `reviewed_ref` `ab4b5d1d21dcdf8db587cab203f0d9d764ef0043` (`.agent/reviews/KEY-001-r1.md`, `-arch1.md`; security review `-sec1.md` was `APPROVED` but is now invalidated by this fix commit, CLAUDE.md §11). Read both `CHANGES_REQUIRED` reviews and `.agent/decisions/D-011-click-origin-and-focus-policy.md` (now `accepted`, Option A, user decision 2026-09-22) in full before writing anything.

**The defect** (`script.js:76`): the click handler calls `event.target.blur()` unconditionally for every `click`, including the `click` a browser synthesizes when a `Tab`-focused button is activated with `Enter`/`Space`. This contradicts your own unit's AC-6 and the user's OQ-3 resolution ("mouse-initiated clicks only"): a keyboard-only user who tabs to a button and presses `Enter` loses focus on that button immediately afterward. The orchestrator independently reproduced this via the DOM stub.

**A second, related defect** (`.agent/reviews/KEY-001-r1.md` F-1): the integration test meant to catch this ("a mouse click blurs its button so a following Enter is read as a normal key not a repeat click") cannot fail for its stated reason — its helper `typeKeys` dispatches keys on `document.body`, never on the clicked button, so `blur()`'s effect on that button is never exercised. Deleting `event.target.blur()` from `script.js` leaves the full suite green. This test must be corrected as part of your fix, not left as is.

**Fix (D-011 Option A, user-approved)**: a real mouse click reports `event.detail >= 1`; a keyboard-synthesized activation (and a programmatic `.click()`) reports `event.detail === 0`. Blur only when `event.detail > 0`.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-6 (rewritten 2026-09-21; re-read it — this fix must satisfy it exactly, including the Tab-then-native-activation half, which must now **keep** focus after the press).

## Relevant files
- `script.js` — change `event.target.blur();` in the click handler to `if (event.detail > 0) { event.target.blur(); }` (or equivalent; D-011 states the intent, not the exact syntax)
- `tests/helpers/dom-stub.js` — `page.click(target)` must dispatch its `click` event with `detail: 1` (a real mouse click); the native-activation click your listener already simulates for a focused button's `Enter`/`Space` must dispatch with `detail: 0`. This is a **modification of an existing file that D-008 already covers in spirit** (it extended this exact click-simulation code); record one line in this unit's Log (the orchestrator will do this from your handoff) rather than a new decision — D-011 itself states "any of the three requires a new commit, so gate and review evidence must be re-run", which already covers this file.
- `tests/integration/keyboard.test.js` — fix the vacuous blur test per D-011 ("one integration row: after a Tab-focused native activation `document.activeElement` is still the button; after a mouse click it is `null`"). The existing test name stays (do not rename a matrix-named row); route its keys through the actually-clicked button (or add the `activeElement` assertions D-011 describes) so deleting the `blur()` fix makes it fail again. This file is otherwise the integration-tester's; you are only touching the one test D-011 requires.
- `.agent/decisions/D-011-click-origin-and-focus-policy.md` — read only, already accepted

## Tests created / executed
Existing evidence at `ab4b5d1d`: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json` (now stale — this fix invalidates them).

## Results
n/a

## Decisions made
D-011 (accepted, Option A). You are not choosing the fix, only implementing it; if you find the exact mechanics do not work as D-011 assumed (e.g. the stub's event model cannot carry `detail` cleanly), stop and report rather than silently choosing a different approach.

## Known risks
- This is a **fix**, not new scope: do not touch anything the two `CHANGES_REQUIRED` reviews did not name. The Minor/Nit findings (r1 F-3…F-7, arch1 F-2/F-3/F-5, all of sec1) are user-approved known issues for this cycle — already recorded in `.agent/units/KEY-001.md` Known Issues — and are explicitly **not** in scope here.
- Every existing suite must stay green: this touches the shared click handler every `BOOT-001`/`CALC-001`/`KEY-001` click-path test runs through. Re-run everything, not just the new/changed rows.
- The GUARD row (`tests/regression/keyboard-and-click-parity.test.js`, "every README click sequence still renders correctly…") must still pass — mouse-only clicks must still report `detail >= 1` and still blur as before.
- Do not regress AC-7 (auto-repeat): a held `Enter` on a focused button is a separate concern (`event.repeat`, not `event.detail`) — do not conflate the two.

## Outstanding issues
none

## Required next action
This is a fix cycle, not fresh TDD from scratch — but the corrected test must still prove itself. Work on branch `agent/KEY-001-keyboard-input`, commit messages `KEY-001: <imperative summary>`, never push.
1. Fix the vacuous test first and confirm it now fails on the current (buggy) code for the right reason — actual behavior: focus lost after native activation. This is your RED.
2. Apply the `D-011` Option A fix to `script.js` and `tests/helpers/dom-stub.js`. Commit.
3. Run `node .agent/tools/run-gate.mjs unit --unit KEY-001 --phase final`, `integration --phase final`, `regression --phase final`, `lint --unit KEY-001`. Confirm all four gates pass at their expected counts (unit 83, integration 46, regression 25) and that the corrected blur test and the two Tab-activation tests all pass meaningfully (re-verify by temporarily reverting the fix in a throwaway, uncommitted check that the corrected test then fails — do not commit that revert). Commit evidence.
4. Update `.agent/decisions/D-003-core-api.md`'s addendum or a short note only if the event shape assumptions changed anything about the core (they should not — this fix is entirely in the DOM adapter and the stub).

Return `.agent/handoffs/KEY-001-16-implementer-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHA(s), run-gate evidence paths with one-line facts, confirmation the corrected test is genuinely discriminating (not vacuous again), the new head SHA, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until all four gates pass and `node .agent/tools/validate.mjs state` exits 0.
