---
unit: KEY-001
from: orchestrator
to: security-reviewer
sequence: 10
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff KEY-001-10: orchestrator → security-reviewer

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given the implementer's or integration-tester's justification and must not seek it (handoff files `KEY-001-04`, `-06`, `-08` are off limits).

## Context
Security review of unit `KEY-001`: this is a **new input channel** (CLAUDE.md §8 trigger — required). A global `document` `keydown` listener now feeds the same `dispatch(input)` clicks use; `script.js`'s existing click-side input validation was refactored to call a newly exported core function instead of duplicating its own value lists.

Assume attacker-controlled DOM content (as `BOOT-001`'s security review did) plus, now, attacker-influenced keyboard events (a compromised or malicious page/extension dispatching synthetic `KeyboardEvent`s) and any HTML injected into `index.html`.

Verified by the orchestrator:
- `base_ref` = `f9426e284219f49816abad088275d219c72bdd81`, `head_ref` = `ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`; `git rev-parse HEAD` equals `head_ref`. Product and test files committed and clean. **`.agent/` has uncommitted working-tree changes on purpose.** Do not treat that as BLOCKED. Do **not** commit, stash, checkout, reset or otherwise change git state.
- Shipped files: `index.html`, `script.js`, `calculator-core.js`. Baseline for comparison: `git show base_ref:script.js`, `git show base_ref:calculator-core.js`.
- New/changed test files relevant to your review: `tests/helpers/source-scan.js` (D-009: `stripComments` fix for a regex-literal blind spot), `tests/regression/source-safety.test.js` (D-009: the 3 named security scans widened to also cover `index.html`, plus 1 new row), `tests/helpers/dom-stub.js` (D-008: focus/blur/native-activation primitives — page-model changes, not production code).
- Machine evidence at `head_ref`: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`.
- Project security rules: `CLAUDE.md` §4 "Security" and `.agent/decisions/D-001-toolchain.md`.
- **A residual risk flagged by the implementer, for you to judge independently**: the click handler's `element.blur()` runs after every click regardless of whether the click was mouse-initiated or a simulated native activation from a keyboard `Enter`/`Space` on a focused button. Consider whether this has any security implication (it is a UI/focus concern, not obviously a security one, but say so explicitly rather than silently agreeing).
- **`D-005` clause 5 (the input vocabulary is now exported once from the core and used by both the click adapter and the key map)**: verify this did not weaken the click-side boundary filtering — `inputFromElement` in `script.js` should still reject an out-of-range `data-*` value with no state change and no exception, now via the exported `isInput` check rather than its own tables.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 (vocabulary export), AC-5 (unmapped keys and modifier combos are inert and `preventDefault()`-free), AC-6 (no double-action, boundary filters), AC-8 is not security-relevant.

## Relevant files
- `script.js`, `calculator-core.js`, `index.html`
- `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js`, `tests/helpers/dom-stub.js`, `tests/integration/keyboard.test.js` (the two carried-forward `data-operator`/`data-action` security rows)
- `.agent/decisions/D-005-layering-rule.md`, `D-008`, `D-009`
- `.claude/skills/review-security/SKILL.md`

## Tests created / executed
Evidence paths above. Re-run yourself.

## Results
n/a

## Decisions made
n/a

## Known risks
`BOOT-001`'s security review (`.agent/reviews/BOOT-001-sec1.md`) found 5 Minor/Nit findings, of which items 1–4 were carried forward here to fix (the unit file's "Carried forward" section lists them). Confirm each is actually closed, not merely claimed closed.

## Outstanding issues
none

## Required next action
1. Map the new input-to-sink path: `KeyboardEvent` → `mapKey()` → input descriptor → `dispatch()` → `applyInput()` → `render()` → `textContent`. Verify by reading the code, not the comments. Confirm no keyboard-derived value ever reaches `innerHTML`/`eval`/`new Function`.
2. Try to break the boundary, with **no file changed on disk** (`git status` identical before and after; use `node -e`/stdin scripts or the stub, write nothing outside the repo): unusual `event.key` values (very long strings, non-string, `constructor`, `__proto__`, empty, `Unidentified`), a `keydown` with conflicting modifier combinations, a synthetic keydown whose `target` is spoofed to look like a calculator button, and the two carried-forward `data-operator`/`data-action` boundary probes at the click side (confirm they still hold with the refactored `isInput`-based check).
3. Probe whether the widened security scan (`D-009`) actually catches what it claims: inject (in memory only, not committed) an inline `onclick="eval(x)"` or a bare `//host` string into a copy of `index.html`'s content and confirm the scan would flag it; also probe the `stripComments` fix directly with a regex-literal-containing line.
4. Check `document.addEventListener('keydown', ...)` for any risk from being global (does it ever act when the calculator isn't the intended target — for example inside a text field, if the page ever had one) — the page currently has no other focusable input, but say so explicitly as a documented assumption, not an oversight.
5. Re-run the regression and integration suites yourself and state the counts. Check for any new dependency, network reference or secret (there should be none).

Write `.agent/reviews/KEY-001-sec1.md` from `.agent/templates/review.md` (verdict `APPROVED` / `CHANGES_REQUIRED` / `BLOCKED`, `reviewed_ref` = the exact 40-hex `head_ref`; each finding needs severity, exploit or impact reasoning and a concrete fix; justify any "no surface" conclusion with what you examined). Write your return handoff to `.agent/handoffs/KEY-001-13-security-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
