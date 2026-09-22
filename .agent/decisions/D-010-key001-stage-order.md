---
kind: decision
id: D-010
unit: KEY-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)), applying the same reasoning as D-002 and D-006; flagged to the user in the final report
---

# D-010 — KEY-001 stage order: stub extension and safety-net proof before the keyboard implementation

## Context
Same shape of problem as `D-002` (`BOOT-001`) and `D-006` (`CALC-001`): the matrix
(`.agent/units/KEY-001.matrix.md`, row for `tests/helpers/dom-stub.js`) requires the new stub
primitives to be "written and proved against the **unmodified** `script.js` before any product edit,
the same discipline `BOOT-001`'s safety net used." Concretely: `script.js`'s click handler is about to
gain an `element.blur()` call (AC-6), which every existing click-path test (52 + 15 + 20 + 2 unit and
integration rows, 13 + 4 regression rows) runs through. If the stub's `blur()`/`focus()`/
`activeElement` support and the fixed `script.js` landed in the same commit, a regression in either
would be indistinguishable from the other, and the safety-net rows required by `D-008`'s GUARD row
("every README click sequence still renders correctly…") would not be proving anything against a
known-good baseline.

The AC-8 README rows are a documentation check (`.agent/units/KEY-001.matrix.md`, regression table)
and, as with `CALC-001`'s AC-6, cannot pass before the README is written.

## Decision
For `KEY-001` only, in this order, all on the unit's branch:
1. `integration-tester` extends `tests/helpers/dom-stub.js` with the new primitives (`D-008`) and
   proves the existing suites still pass against the **unmodified** `script.js`/`calculator-core.js`
   (this is the GUARD row's "before" run). It then writes the widened security scan (`D-009`) and
   proves the three modified rows plus the new row RED-for-the-right-reason against the current
   `index.html`/`stripComments`. It then writes `tests/integration/keyboard.test.js` and
   `tests/regression/keyboard-and-click-parity.test.js` (RED: the key map, repeat policy, exported
   vocabulary, and `blur()` call do not exist yet), and appends the `REGISTRY.md` rows. Commits at
   each sub-step.
2. `implementer` writes `tests/unit/key-map.test.js` and `tests/helpers/core-input.js` (RED), then
   implements the key map, the repeat-policy function, the exported input vocabulary
   (`D-005` clause 5) and the `mapKey`/repeat-policy wiring in `calculator-core.js`; adds the
   `keydown` listener and the click handler's `blur()` call in `script.js`, both routed through the
   existing `dispatch(input)` seam (`D-005` clause 3); fixes `stripComments` (GREEN for `D-009`'s new
   row). GREEN then REFACTOR, re-running the widened security scan and the full existing suites at
   each phase. **The two README rows (AC-8) are expected red rows until step 3.**
3. `documenter` writes the README keyboard section and Features bullet using the tokens the matrix
   states; those two rows go green.
4. Orchestrator runs the final gates on the resulting clean head, then review: code, security (new
   input channel, CLAUDE.md §8) and architecture (CLAUDE.md §8 requires it for any T2 unit, and
   `KEY-001` is T2 per `.agent/plan.md`'s tier table, regardless of whether it creates a new module
   boundary).

## Alternatives considered
- Default order (implementer first). Rejected: same reasoning as `D-002`/`D-006` — weaker RED
  evidence, and the stub/`blur()` coupling means the existing suites could not be shown to survive the
  change independently of the new feature.
- Skip the GUARD row's "before" run. Rejected: it is the only proof that extending the stub alone (no
  product change yet) does not itself break anything.

## Consequences / residual risk
- Roles and write ownership are unchanged from `D-002`/`D-006`.
- Both security review and architecture review are required for this unit: security because it is a
  new input channel, architecture because CLAUDE.md §8 requires it for every T2 unit outright.
