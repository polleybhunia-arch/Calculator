---
unit: KEY-001
from: orchestrator
to: reviewer
sequence: 25
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff KEY-001-25: orchestrator → reviewer (cycle 3)

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given any implementer/integration-tester justification and must not seek it (handoff files `KEY-001-04`, `-06`, `-08`, `-16`, `-24` are off limits).

## Context
This is **cycle 3**. Two prior cycles both found real, reproducible defects in the same area — a Tab-focused calculator button's interaction with native `Enter`/`Space` activation:
- Cycle 1 (your own `.agent/reviews/KEY-001-r1.md`, `ab4b5d1d`): `blur()` fired on every click including native activation, breaking focus retention. Fixed by `D-011` (`event.detail` gates blur).
- Cycle 2 (`.agent/reviews/KEY-001-r2.md`, `5678cc1b`): the D-011 fix restored focus but exposed a second bug — a *held* `Enter` on a focused button re-fired native activation on every repeat (`7`, `77`, `777`). The architecture review's proposed fix for this (`D-012`) was rejected by the orchestrator on a factual gap (its own examples were idempotent; the reproduced case was not). Fixed instead by the code reviewer's own proposed option: unconditionally suppress a repeat native activation, read `.agent/decisions/D-012-native-activation-and-repeat-policy.md` for the full reasoning.

Given this pattern (two real defects in the same narrow area across two cycles), **do not treat this as a routine confirmation pass**. Specifically stress-test the focus/native-activation interaction beyond what the existing 52 named rows cover, even though that may go beyond a literal AC. If you find nothing more, say what you tried.

What changed since `5678cc1b`: only `script.js` (one `event.repeat` guard, 4 lines, inside the existing branch) and `tests/integration/keyboard.test.js` (one new named test). Nothing else.

Verified by the orchestrator:
- `base_ref` = `f9426e284219f49816abad088275d219c72bdd81` (unchanged), `head_ref` = `fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`.
- I independently reproduced: held `Enter` on a focused digit button now renders the digit once (not `777`); a single `Enter` on a focused button still activates it exactly once; the original OQ-3 scenario (click a digit, then type more keys) still works.
- Final gates on `head_ref`: unit 83/83, integration 47/47, regression 25/25, lint PASS.
- Minor/Nit findings from every prior cycle remain carried as Known Issues by standing user decision — do not re-flag them as blocking; you may note if any is now stale.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 … AC-8 — full re-review, not a diff spot-check.

## Relevant files
- `git diff base_ref..head_ref -- calculator-core.js script.js README.md tests`
- `.agent/decisions/D-011-click-origin-and-focus-policy.md`, `D-012-native-activation-and-repeat-policy.md` (rejected, with reasoning)
- `.agent/reviews/KEY-001-r1.md`, `-r2.md` (your own prior findings, for reference)

## Tests created / executed
`.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`. Re-run yourself.

## Results
n/a

## Decisions made
n/a — judge what stands.

## Known risks
Real-browser semantics for `event.detail` and `event.repeat` during native button activation remain `UNVERIFIED` (RK-3). If you find a third scenario in this area, prefer identifying it now over another cycle later.

## Outstanding issues
none

## Required next action
Full adversarial review of `base_ref..head_ref`, with extra scrutiny on the focus/native-activation interaction:
1. Re-run all three suites yourself and state counts.
2. Judge AC-1 … AC-8 as SATISFIED / NOT_SATISFIED / UNVERIFIED.
3. With **no file changed on disk**, probe combinations the existing 52 rows do not: `Space` instead of `Enter` held on a focused button; a focused *operator* or *action* button (not just digit/equals) with a held key; rapid Tab-to-different-button-then-Enter sequences; a held key that transitions from `repeat:false` to `repeat:true` mid-sequence on two different buttons in a row.
4. Confirm the new test is genuinely discriminating (mutation probe, in memory only).

Write `.agent/reviews/KEY-001-r3.md` from `.agent/templates/review.md` (`cycle: 3`, `reviewed_ref` = the exact 40-hex `head_ref`). Write your return handoff to `.agent/handoffs/KEY-001-28-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
