---
unit: KEY-001
from: orchestrator
to: reviewer
sequence: 17
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff KEY-001-17: orchestrator → reviewer (cycle 2)

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given the implementer's justification and must not seek it (handoff files `KEY-001-04`, `-06`, `-08`, `-16` are off limits).

## Context
This is **cycle 2** of `KEY-001`'s review, a fix for cycle 1's `CHANGES_REQUIRED` verdict. Your cycle-1 review is `.agent/reviews/KEY-001-r1.md` (`reviewed_ref` `ab4b5d1d`, found F-1/F-2 Major: `blur()` fired on every click including native keyboard activation, and the test meant to catch it was vacuous because it dispatched on `document.body` instead of the actually-focused element). **This is a fresh, full review, not a spot-check of the diff** — re-verify everything, including what cycle 1 already approved (AC-1…AC-5, AC-7, AC-8), since CLAUDE.md §11 treats any new commit as invalidating all prior evidence.

What changed since `ab4b5d1d` (`git diff --name-status ab4b5d1d..head_ref`): `script.js` (blur now gated on `event.detail > 0`, per user-accepted `.agent/decisions/D-011-click-origin-and-focus-policy.md` Option A), `tests/helpers/dom-stub.js` (click simulation now sets `detail: 1` for real clicks, `detail: 0` for native-activation clicks), `tests/integration/keyboard.test.js` (the one named row your cycle-1 review flagged is corrected to assert `document.activeElement` directly; no test was renamed). Nothing else changed — this is a scoped fix, not new work; the Minor/Nit findings from cycle 1 (yours and the other two reviewers') were **not** fixed, by user decision, and are recorded in `.agent/units/KEY-001.md` Known Issues. Do not re-flag them as blocking; you may re-confirm they are still accurately described if you wish.

Verified by the orchestrator:
- `base_ref` = `f9426e284219f49816abad088275d219c72bdd81` (unchanged), `head_ref` = `5678cc1b70f39af6859c980a8520bb858418a140`. `git rev-parse HEAD` is `9cc1e6e...` (two more commits after the code fix, for evidence and handoff, touching only `.agent/`) — reconcile the same way cycle 1's F-8 was reconciled: confirm `git diff --stat head_ref..HEAD -- . ':!.agent'` is empty before relying on `head_ref`.
- I independently reproduced both halves of the fix via the DOM stub: a `Tab`-focused button keeps `document.activeElement` after a native `Enter` activation (typed the digit once, `7`); a real `page.click()` sets `activeElement` to `null` afterward; the original bug sequence (click `4`, then keys `+ 8 Enter`) now renders `4+8` / `12`, not `4+84`.
- Final gates on `head_ref`: unit 83/83, integration 46/46, regression 25/25, lint PASS (`.agent/test-results/KEY-001/latest-*-final.json`).
- I found and repaired a evidence-pointer issue: the fix cycle's implementer overwrote `latest-unit-red.json` with a later, passing run; I restored it from its preserved timestamped copy (the genuine cycle-1 RED, 14 of 83 failing at `fa16dfa3`). This does not affect your review of `head_ref`.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 … AC-8 (all of them — this is a full re-review). AC-6 is the one that changed; judge whether both its sentences now hold.

## Relevant files
- `git diff base_ref..head_ref -- calculator-core.js script.js README.md tests`
- `.agent/decisions/D-011-click-origin-and-focus-policy.md` (accepted, Option A)
- `.agent/units/KEY-001.md` (current AC-6 text and Known Issues), `.agent/units/KEY-001.matrix.md`
- `.agent/reviews/KEY-001-r1.md` (your own cycle-1 findings, for reference on what to re-check)

## Tests created / executed
See evidence paths above. Re-run the gates yourself.

## Results
n/a

## Decisions made
D-011 (accepted). Judge it; do not assume it.

## Known risks
Held-`Enter`-on-a-focused-button auto-repeat (new Known Issue in the unit file, flagged by the implementer, not fixed — explicitly out of this fix cycle's scope). Judge whether leaving it as a known issue is acceptable or should block.

## Outstanding issues
Real-browser rendering, `event.detail` semantics, and focus/auto-repeat behavior cannot be run in this environment.

## Required next action
Full adversarial review of `base_ref..head_ref`, with particular attention to AC-6:
1. Re-run unit, integration and regression yourself and state the counts.
2. Judge AC-1 … AC-8 as SATISFIED / NOT_SATISFIED / UNVERIFIED with evidence.
3. Specifically re-probe the corrected test: with **no file changed on disk**, confirm it is genuinely discriminating (fails if the fix is reverted, fails if `blur()` is removed entirely, passes only with the fix as committed).
4. Confirm the fix does not regress anything cycle 1 approved (AC-7 repeat policy in particular — held keys still target `document.body` in the matrix's design, unaffected by this fix; verify that's still true).
5. Decide whether the held-Enter-on-focused-button known issue needs to block or is acceptable to carry.

Write `.agent/reviews/KEY-001-r2.md` from `.agent/templates/review.md` (`cycle: 2`, `reviewed_ref` = the exact 40-hex `head_ref`; per-AC lines in the exact machine-read format `- AC-n: VERDICT — evidence`). Write your return handoff to `.agent/handoffs/KEY-001-20-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
