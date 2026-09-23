---
unit: KEY-001
from: orchestrator
to: implementer
sequence: 23
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-23: orchestrator → implementer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). implementer is a Sonnet agent (no fallback); attest your own model.

## Context
Cycle-2 code review (`.agent/reviews/KEY-001-r2.md`, F-1, Major, `reviewed_ref` `5678cc1b`) found: with a calculator button Tab-focused, holding `Enter` performs that button's action on every auto-repeat, not just once. Reproduced by the review as `Enter`(repeat:false) then two `Enter`(repeat:true) on the focused `7` digit button rendering `7`, `77`, `777` — a real, user-visible violation of AC-6 ("exactly once") and AC-7 ("repeats after the first are ignored"), and of the README's explicit claim. The orchestrator independently reproduced this via the DOM stub before accepting the finding.

The architecture review's cycle-2 verdict (`.agent/reviews/KEY-001-arch2.md`) proposed `.agent/decisions/D-012-native-activation-and-repeat-policy.md` arguing this was an inert residual and suggesting a fix gated by `allowsRepeat`. **The orchestrator rejected D-012 as written** (now `status: rejected`, read it for the full reasoning): its examples (`=`, an operator swap) are idempotent, but a digit input is deliberately repeatable under OQ-4, so gating by `allowsRepeat` would **not** suppress the digit case that was actually reproduced. Use the code reviewer's option (a) instead — it is simpler and correct for every button type.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-6 (exactly once, including under a held key) and AC-7 (repeats after the first are ignored for non-repeatable inputs — but read the fix below: the correct fix suppresses *any* repeat of a native button activation, not only for non-repeatable input types, because a held-Enter repeat of a native click is a different concern from a held physical key).

## Relevant files
- `script.js` — the `keydown` listener's existing early-return branch for `Enter`/`Space` on a calculator button (around the `isCalculatorButton` check). Add, before the existing `return;`:
  ```js
  if (event.repeat) {
    event.preventDefault();
    return;
  }
  ```
  (exact placement and variable names are yours; the effect must be: a repeat `keydown` for `Enter`/`Space` whose target is a calculator button never reaches native activation, regardless of what input that button represents). `preventDefault()` is what suppresses the browser's default activation for that keydown — the stub already honors `defaultPrevented` when deciding whether to synthesize the click (`tests/helpers/dom-stub.js`, confirmed in `D-012`'s text).
- `tests/integration/keyboard.test.js` — add one new named test (not editing the corrected AC-6 row from the previous fix): something like `"holding Enter on a Tab focused digit button performs the action once"` — Tab-focus a digit button, dispatch `Enter` with `repeat:false` then two with `repeat:true`, assert the display shows the digit exactly once (not repeated). This is a genuine addition beyond the current 51 matrix rows (like `BOOT-001`'s extra malformed-input test) — the matrix will be updated to include it in a later small test-designer pass; do not block on that.
- `.agent/decisions/D-012-native-activation-and-repeat-policy.md` — read only, already rejected with reasoning

## Tests created / executed
Existing evidence at `5678cc1b`: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json` (now stale — this fix invalidates them).

## Results
n/a

## Decisions made
None yours to make; D-012 already resolved the design question. If you find the exact mechanics do not work as expected (e.g. the stub's repeat/defaultPrevented model behaves differently than described), stop and report rather than improvising a different fix.

## Known risks
- This is a **fix**, not new scope: do not touch anything beyond what F-1 requires plus the one pinning test. The Minor findings (r2 F-2, F-3, and everything carried from cycle 1) are user-approved known issues, already recorded — not in scope here.
- Verify the fix does not break the already-passing AC-6 rows: a single, non-repeat `Enter`/`Space` on a focused button must still activate exactly once (this fix only adds a check for `event.repeat`, so it should not).
- Verify AC-7's existing document-level repeat rows are unaffected (digits/`.`/`,`/`Backspace` still repeat when typed as keys targeting `document.body`; `Enter`/`=`/operators typed as keys still ignore repeats) — this fix only touches the calculator-button-focused native-activation path, a different branch.
- Every existing suite must stay green.

## Outstanding issues
none

## Required next action
Work on branch `agent/KEY-001-keyboard-input`, commit messages `KEY-001: <imperative summary>`, never push.
1. Write the new integration test first and confirm it fails on the current code for the right reason (the button's value repeats instead of appearing once). This is your RED.
2. Apply the fix to `script.js`. Commit.
3. Run `node .agent/tools/run-gate.mjs unit --unit KEY-001 --phase final`, `integration --phase final`, `regression --phase final`, `lint --unit KEY-001`. Confirm all pass (unit 83, integration 47, regression 25). Commit evidence.
4. Prove the fix is genuinely discriminating with an in-memory-only mutation (nothing on disk changed after): revert the fix and confirm the new test fails again; confirm the two Space-activation and the equals-Tab-activation rows are unaffected either way, noting why.

Return `.agent/handoffs/KEY-001-24-implementer-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHA(s), run-gate evidence paths with one-line facts, confirmation the new test is genuinely discriminating, the new head SHA, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until all four gates pass and `node .agent/tools/validate.mjs state` exits 0.
