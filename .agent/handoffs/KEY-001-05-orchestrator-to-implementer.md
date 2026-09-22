---
unit: KEY-001
from: orchestrator
to: implementer
sequence: 05
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-05: orchestrator → implementer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). implementer is a Sonnet agent (no fallback); attest your own model.

## Context
`KEY-001` is `IN_PROGRESS` on branch `agent/KEY-001-keyboard-input` (stacked on completed `BOOT-001`/`CALC-001`). The integration-tester finished its phase under `.agent/decisions/D-010-key001-stage-order.md` step 1 (read it, and `D-005-layering-rule.md`, `D-008`, `D-009`). I re-verified with tools: tree clean, only the three D-008/D-009-authorized files modified plus two new test files, no untouchable file touched. Current suite state on this branch: unit 67/67, integration 27/46 (19 fail), regression 19/25 (6 fail) — every failure is a genuine assertion mismatch (verified by me directly, e.g. `current: '0'` instead of `21` for a key sequence that should have computed something), never an import or setup error.

Spec: `.agent/units/KEY-001.md` (AC-1…AC-8; AC-6 was rewritten 2026-09-21, read the current text, not an earlier version). Matrix: `.agent/units/KEY-001.matrix.md`. **Your rows are the unit table only**: `tests/unit/key-map.test.js`, 16 rows (column 2 verbatim). You also write `tests/helpers/core-input.js` (a **new** helper file: shared `toInput`/`press`/`expectDisplay`, carried-forward item 7 — do not edit the existing per-file copies in `tests/unit/calculator-core.test.js` or `tests/unit/divide-by-zero.test.js`).

**Design rule (binding): `.agent/decisions/D-005-layering-rule.md`.** In particular: clause 3, the keyboard channel converts a `keydown` into an input descriptor and calls the same `dispatch(input)` clicks already use — never a second display-write path, never `button.click()` simulation; clause 5, this is the third consumer of the input vocabulary, so `calculator-core.js` must **export it once** (an allowlist function or constant) and `script.js`'s existing `inputFromElement()` should be updated to use that export rather than keeping its own separate table (do not remove the boundary-filtering behavior itself — only stop hand-duplicating the value list); clause 6, the repeat policy (which input types act on `event.repeat === true`) is a **pure function in the core**, not a DOM-layer `if`; clause 4, the key map is an allowlist returning `null` for anything unrecognized — the DOM layer ignores `null`, never throws for an unmapped key.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 … AC-8. AC-8 (README) is the documenter's step after you; your job is to make the two AC-8 regression rows fail only because the README text is missing, not because the underlying feature is broken.

## Relevant files
- `calculator-core.js` — add: a pure key-mapping function (`event.key` + modifier booleans → input descriptor or `null`), a pure repeat-policy function (input descriptor + `repeat: boolean` → whether to act), and the exported input vocabulary (D-005 clause 5)
- `script.js` — add one `document` `keydown` listener that maps the key, checks the repeat policy, and calls the existing `dispatch(input)`; add `element.blur()` to the existing click handler (AC-6); update `inputFromElement()`'s validation to use the core's exported vocabulary instead of its own separate tables (keep the boundary-filtering behavior: unrecognized values are still ignored, not thrown)
- `tests/unit/key-map.test.js` — **new**, yours, 16 rows
- `tests/helpers/core-input.js` — **new**, yours
- `tests/integration/keyboard.test.js`, `tests/regression/keyboard-and-click-parity.test.js`, `tests/regression/source-safety.test.js`, `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js` — the integration-tester's; read only, byte-for-byte unmodified
- `.claude/skills/tdd/SKILL.md`, `CLAUDE.md` §4, §5, §14

## Tests created / executed
Existing evidence: `.agent/test-results/KEY-001/latest-{unit,integration,regression}-{green,red}.json` from the integration-tester's phase. No new `unit` RED/GREEN for the key map yet.

## Results
n/a

## Decisions made
- D-005, D-008, D-009, D-010 govern this dispatch. Entry-point names for the key map and repeat-policy function are yours to choose (matrix calls them "the key map" / "the repeat policy" by role, not by name) — record the names and the vocabulary-export shape in a short addendum to `.agent/decisions/D-003-core-api.md`, or a new decision record if you judge the change large enough; your call, but record it somewhere and say where in your handoff.

## Known risks
- **The GUARD row must be re-run and stay green after your change** (`tests/regression/keyboard-and-click-parity.test.js`, "every README click sequence still renders correctly once the keyboard listener and click blur are installed"). This is its "after" proof (the integration-tester already proved "before"). If it goes red, your `blur()` call or listener has broken a mouse-only path — diagnose before proceeding, do not weaken the row.
- **The call-count spy technique**: the integration tests wrap the `textContent` setter on `#display-current` to count dispatches, because `script.js` destructures `applyInput` into a local `const` at load time (confirmed: `script.js:6`), so patching `CalculatorCore.applyInput` after the page loads would not affect the running listeners. Do not "fix" this by changing `script.js` to read `CalculatorCore.applyInput` freshly on every call — that would be an unrequested architecture change with no AC behind it. Your `dispatch(input)` must keep writing both display lines exactly once per call (unchanged from today), which is what makes the spy valid.
- **Two rows use a precondition assertion** (`Escape`/`Delete` clearing an unfinished chain) that must genuinely fail on the current code — do not special-case them.
- **5 integration rows already pass** without your code (documented in the integration-tester's handoff: `Tab never has preventDefault called`, two Tab-then-native-activation digit rows, two `data-operator`/`data-action` security rows). They must **stay** passing; do not let your keydown listener change their outcome.
- Comments only for a non-obvious *why*; no regex literal containing a quote or `//` in shipped JS (the static-scan helper's fixed blind spot notwithstanding — keep code clean regardless). `event.key` is layout/numpad-normalized; do not add a separate `event.code` branch or a `Numpad5`-style literal (the matrix explains why none is needed).
- `x`/`X` maps to `*` (the multiply operator value), including when `Shift` produces the capital `X` — `Shift` alone must never block a mapped key (`Shift+=` still equals, a `Shift+8` keydown arrives as `key: '*'` already, per the browser).

## Outstanding issues
none

## Required next action
Strict TDD on this branch, commit messages `KEY-001: <imperative summary>`, never push. Commit **code first, then run the gate on the clean commit, then commit the evidence**.
1. **RED**: write `tests/helpers/core-input.js` and `tests/unit/key-map.test.js` (16 rows, verbatim names). Commit. Run `node .agent/tools/run-gate.mjs unit --unit KEY-001 --phase red`. Confirm all 16 new rows fail because the key map / repeat policy / vocabulary export do not exist (67 existing pass, 16 new fail = 83 total, 16 failing). Commit evidence.
2. **GREEN**: implement the key map, repeat policy and vocabulary export in `calculator-core.js`; wire the `keydown` listener and click-handler `blur()` in `script.js`; update `inputFromElement()` to use the exported vocabulary. Commit. Run `unit --phase green` (83/83), `integration --phase green` (expect 46/46), `regression --phase green` (expect 25/25 **minus the two AC-8 rows**, which must still fail only on missing README text — confirm this explicitly and state it in your handoff; if anything else in integration or regression fails, fix your implementation, not the tests). Commit evidence.
3. **REFACTOR** with everything else green, then `unit --phase refactor`, `integration --phase refactor`, `regression --phase refactor`. Commit, then evidence. Run `node --check calculator-core.js` and `node --check script.js`.
4. Confirm the GUARD row specifically (name it in your handoff) is green at both GREEN and REFACTOR.
5. If a failure is not obvious after one attempt, stop guessing and request `debugger` diagnosis with the run-file path.

Return `.agent/handoffs/KEY-001-06-implementer-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHAs per phase, run-gate evidence paths with one-line facts, why each RED row failed, confirmation of the two still-red AC-8 rows and the GUARD row, where you recorded the API/decision addendum, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until unit and integration are fully green, regression is green except the two named AC-8 rows, and every matrix-named unit test exists and passes (`node .agent/tools/validate.mjs state` = 0).
