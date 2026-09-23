---
unit: KEY-001
from: orchestrator
to: reviewer
sequence: 09
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff KEY-001-09: orchestrator → reviewer

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given, and must not seek, the implementer's or integration-tester's justification (handoff files `KEY-001-04`, `-06`, `-08` are off limits). Everything you need is in the repo and the paths below.

## Context
Independent code review of unit `KEY-001` (tier T2): the calculator can be operated entirely from a physical keyboard, sharing the click path's `dispatch(input)` seam and the pure `calculator-core.js` state machine.

Verified by the orchestrator:
- `base_ref` = `f9426e284219f49816abad088275d219c72bdd81` (completed `CALC-001`), `head_ref` = `ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`. `git rev-parse HEAD` equals `head_ref`. Branch `agent/KEY-001-keyboard-input`.
- Product and test files are committed and clean. **`.agent/` has uncommitted working-tree changes on purpose** (unit file, review files, evidence, dashboard). Do not treat that as BLOCKED. Do **not** commit, stash, checkout, reset or otherwise change git state.
- Changed outside `.agent/` (`git diff --name-status --no-renames base_ref..head_ref -- . ':!.agent'`): `calculator-core.js` (M), `script.js` (M), `README.md` (M), `tests/helpers/dom-stub.js` (M), `tests/helpers/source-scan.js` (M), `tests/regression/source-safety.test.js` (M), `tests/regression/REGISTRY.md` (M), and new files `tests/helpers/core-input.js`, `tests/unit/key-map.test.js`, `tests/integration/keyboard.test.js`, `tests/regression/keyboard-and-click-parity.test.js`.
- Final gates on `head_ref`, machine evidence `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`: unit 83/83, integration 46/46, regression 25/25, lint PASS.
- Governing decisions: `.agent/decisions/D-003-core-api.md` (with a `KEY-001` addendum for `mapKey`/`allowsRepeat`/`isInput`), `D-005-layering-rule.md` (accepted; check compliance), `D-008` (dom-stub.js focus/blur primitives), `D-009` (widened security scan, `stripComments` fix), `D-010` (stage order).
- **Flagged residual risk from the implementer, for you to judge, not to accept on faith**: `script.js`'s click handler calls `element.blur()` unconditionally after every click, whether the click was mouse-initiated or a native-keyboard `Enter`/`Space` activation of a focused button (the stub gives no signal to distinguish the two). AC-6's first sentence says "a mouse click blurs its button". Judge whether this reading is acceptable, and whether it can even be distinguished in a real browser (a real `click` event does carry `event.detail`/pointer info that the stub does not model — say if that changes your judgment).
- The two AC-8 (README) rows and the GUARD row are of particular interest: confirm the GUARD row's "before" (stub extended, `script.js` unmodified) and "after" (post-implementation) claims by re-deriving rather than trusting the handoffs.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 … AC-8 (AC-6 rewritten 2026-09-21 — read the current text) and its Definition of Done. Matrix: `.agent/units/KEY-001.matrix.md` (51 named rows plus the carried-forward cross-reference table).

## Relevant files
- `git diff base_ref..head_ref -- calculator-core.js script.js README.md tests`
- `.agent/units/KEY-001.md`, `.agent/units/KEY-001.matrix.md`, `CLAUDE.md` (§4, §5, §14)
- `git show base_ref:calculator-core.js`, `git show base_ref:script.js` — the pre-unit code
- `.agent/decisions/D-003`, `D-005`, `D-008`, `D-009`, `D-010`

## Tests created / executed
See evidence paths. Re-run the gates yourself.

## Results
n/a

## Decisions made
D-003 addendum, D-005, D-008, D-009, D-010. Judge them; do not assume them.

## Known risks
From the unit: RK-2 (stub fidelity for AC-5/AC-6/AC-7), RK-5 (over-broad `preventDefault()`), RK-3 (no real browser). Carried-forward items from `BOOT-001`'s reviews were supposed to be closed here (items 1, 2, 3, 4, 7 — check each actually was, using the matrix's cross-reference table as your checklist, not as proof).

## Outstanding issues
Real-browser rendering, real focus rings, real OS auto-repeat timing, and `file://` loading cannot be run in this environment.

## Required next action
Adversarial review of `base_ref..head_ref`:
1. Re-run unit, integration and regression yourself and state the counts.
2. Judge AC-1 … AC-8 as SATISFIED / NOT_SATISFIED / UNVERIFIED with evidence. Confirm each named matrix row exists verbatim and would fail without the behavior, and that `D-005`'s layering rule actually holds in the diff (one dispatch seam, no `button.click()` simulation, repeat policy is a pure core function, vocabulary exported once and used by both adapters — check `script.js`'s `inputFromElement` no longer hand-lists the digit/operator/action values).
3. Independent behavior check with **no file changed on disk** (`git status` identical before and after; write nothing outside the repo): drive the fixed core and page through sequences you choose (key-only, mixed mouse-and-keyboard, the mid-chain divide-by-zero case, continue-from-result) and compare against clicks. Specifically probe the AC-6 blur/focus interaction and the AC-7 repeat policy for edge cases the matrix's spy technique might miss.
4. Mutation probes with no change to disk: show which named tests fail for a mutation of the key map, the repeat policy, the vocabulary check, and the `blur()`/listener wiring.
5. Judge the flagged `blur()`-on-every-click reading of AC-6, whether the widened security scan (`D-009`) is real (not vacuous — probe it yourself with an injected pattern), whether the `CALC_STUB_TRANSFORM` gate-evidence gap (carried-forward item 5, still open) is acceptable to leave as a known issue, and conventions (CLAUDE.md §4).

Write `.agent/reviews/KEY-001-r1.md` from `.agent/templates/review.md` (`reviewed_ref` = the exact 40-hex `head_ref`; per-AC lines in the exact machine-read format `- AC-n: VERDICT — evidence`). Write your return handoff to `.agent/handoffs/KEY-001-12-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
