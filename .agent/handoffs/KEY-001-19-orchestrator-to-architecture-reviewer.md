---
unit: KEY-001
from: orchestrator
to: architecture-reviewer
sequence: 19
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff KEY-001-19: orchestrator → architecture-reviewer (cycle 2)

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given the implementer's justification and must not seek it (handoff files `KEY-001-04`, `-06`, `-08`, `-16` are off limits). `.agent/decisions/D-011` is a design artifact you are asked to judge as applied, not proof of soundness.

## Context
Your cycle-1 review `.agent/reviews/KEY-001-arch1.md` (`reviewed_ref` `ab4b5d1d`) returned `CHANGES_REQUIRED`: F-1 (Major) — `blur()` ran on every click including native keyboard activation, contradicting the user's OQ-3 resolution, and you proposed `.agent/decisions/D-011-click-origin-and-focus-policy.md` with three options. **The user chose Option A** (read `event.detail`). This is a **fresh, full review at the new head**, not a delta review.

What changed since `ab4b5d1d`: `script.js` (blur gated on `event.detail > 0`), `tests/helpers/dom-stub.js` (click simulation now sets `detail`), `tests/integration/keyboard.test.js` (the vacuous test you and the other reviewer both flagged is corrected). Nothing else changed. Your cycle-1 Minor findings (F-2 `data-*` duplication, F-3 `allowsRepeat`'s missing contract, F-4 spy-technique invariant, F-5 module-syntax scan gap) were **not** fixed this cycle, by user decision, and are recorded in `.agent/units/KEY-001.md` Known Issues.

Verified by the orchestrator:
- `base_ref` = `f9426e284219f49816abad088275d219c72bdd81`, `head_ref` = `5678cc1b70f39af6859c980a8520bb858418a140`. `git rev-parse HEAD` is two commits later (`.agent`-only drift).
- Final gates on `head_ref`: unit 83/83, integration 46/46, regression 25/25, lint PASS.
- I independently reproduced the fix via the stub (Tab+Enter keeps focus; mouse click still blurs).
- A new item surfaced by the implementer, not fixed, recorded as a Known Issue in the unit file: now that native activation no longer blurs, a *held* `Enter` on a Tab-focused button could (per the stub's model, and plausibly in a real browser) synthesize repeated activations, since nothing in the app layer gates native browser activation by `event.repeat`. No test exercises this.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1, AC-6, and its Definition of Done — re-verify from scratch, with particular attention to whether the chosen fix actually satisfies `D-011`'s stated rule ("focus/blur decisions key off the activating channel as reported by the event, never inferred from adapter-held state").

## Relevant files
- `script.js`, `calculator-core.js`, `tests/helpers/dom-stub.js`, `tests/integration/keyboard.test.js`
- `.agent/decisions/D-011-click-origin-and-focus-policy.md`, `D-005-layering-rule.md`
- `.agent/reviews/KEY-001-arch1.md` (your own cycle-1 review, for reference)

## Tests created / executed
Evidence at `head_ref`: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`. Re-run yourself.

## Results
n/a

## Decisions made
`D-011` Option A, as implemented. Judge whether the implementation matches the decision's stated rule and cost estimate (~8 lines across three files).

## Known risks
The new held-Enter-on-focused-button observation (above) — judge whether it is a structural gap worth its own decision record (e.g., should the DOM adapter's native-activation handling be gated by `event.repeat` the way the app's own `keydown` branch already is for AC-7?) or an acceptable, documented residual for a follow-up.

## Outstanding issues
none

## Required next action
1. Confirm the fix actually implements `D-011`'s rule: focus/blur now keys off `event.detail`, read from the event, not inferred from any adapter-held state (check no new mutable binding was added to `script.js`, per `D-005` clause 2).
2. Confirm the corrected test in `tests/integration/keyboard.test.js` is structurally sound (not just passing) — does it test the real mechanism, or could it still be fooled by a different kind of broken fix?
3. Judge the held-Enter-on-focused-button gap: structural risk or acceptable residual? If you think it needs a decision record, propose one; if you think it is fine as a Known Issue, say so explicitly with reasoning.
4. Re-run the suites yourself and state the counts.

Write `.agent/reviews/KEY-001-arch2.md` from `.agent/templates/review.md` (`cycle: 2`, verdict `APPROVED` / `CHANGES_REQUIRED` / `BLOCKED`, `reviewed_ref` = the exact 40-hex `head_ref`). Write your return handoff to `.agent/handoffs/KEY-001-22-architecture-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
