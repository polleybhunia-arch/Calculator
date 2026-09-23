---
unit: KEY-001
from: orchestrator
to: integration-tester
sequence: 03
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-03: orchestrator → integration-tester

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). integration-tester is a Sonnet agent (no fallback); attest your own model.

## Context
`KEY-001` (keyboard input) is `IN_PROGRESS` on branch `agent/KEY-001-keyboard-input`, stacked on the completed `CALC-001`. **Your normal precondition "implementer's TDD evidence exists" is deliberately overridden** by `.agent/decisions/D-010-key001-stage-order.md` — read it first, along with `D-008` and `D-009`, which this dispatch executes.

This is a large step; work through it in the four sub-steps below **in order**, committing after each so a failure in a later sub-step never re-opens an earlier, already-proven one.

Verified facts:
- `calculator-core.js`, `script.js`, `index.html`, `README.md` are unmodified since `CALC-001` completed. No key map, no repeat-policy function, no exported input vocabulary, no `keydown` listener, no `blur()` call exist yet.
- Baseline counts: unit 67, integration 22, regression 17, all passing.
- Matrix: `.agent/units/KEY-001.matrix.md`. **Column 2 is the literal test title.** Your rows: the "Why dom-stub.js must change" primitives (no named rows — infrastructure); the "carried-forward modifications" table (4 rows, 3 modified + 1 new, in `tests/regression/source-safety.test.js`); the integration table (24 rows, `tests/integration/keyboard.test.js`); the regression table (7 rows, `tests/regression/keyboard-and-click-parity.test.js`). The unit table (16 rows, `tests/unit/key-map.test.js`) and `tests/helpers/core-input.js` are the **implementer's**, not yours.
- Untouchable files (do not modify): `tests/unit/calculator-core.test.js`, `tests/unit/divide-by-zero.test.js`, `tests/integration/dom-click.test.js`, `tests/integration/divide-by-zero-click.test.js`, `tests/regression/readme-behavior.test.js`, `tests/regression/divide-by-zero.test.js`.
- Gate commands (`.agent/gates.json`): `integration` = `node --test "tests/integration/**/*.test.js"`, `regression` = `node --test "tests/regression/**/*.test.js"`.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 (partly, the carried-forward vocabulary/scan items), AC-2 … AC-8 in your layers (AC-8's two rows will fail until the documenter's step, by design).

## Relevant files
- `.agent/units/KEY-001.matrix.md` — "Why dom-stub.js must change" (12 numbered stub-fidelity requirements), the carried-forward table, the integration and regression tables, "AC notes"
- `.agent/decisions/D-008`, `D-009`, `D-010`, `D-005-layering-rule.md`
- `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js` — the three you modify
- `tests/regression/REGISTRY.md` — append and annotate (see matrix "Registry rows to add")
- `tests/integration/dom-click.test.js`, `tests/regression/readme-behavior.test.js` (read only, patterns to imitate)
- `README.md` (read only; the AC-8 rows read it)

## Tests created / executed
none yet

## Results
n/a

## Decisions made
D-008, D-009, D-010 govern this dispatch. You do not write new decisions unless you find something the matrix or these records did not anticipate — if so, stop and report it rather than deciding.

## Known risks
- **The GUARD row is the crux of this dispatch.** `tests/regression/keyboard-and-click-parity.test.js`'s GUARD row ("every README click sequence still renders correctly once the keyboard listener and click blur are installed") must be run and shown green **twice**: once in sub-step 1 below (extended stub, unmodified `script.js` — proves the stub change alone breaks nothing), and again after the implementer's `blur()` change lands (not your job — record in your handoff that this is a two-time check and the second run is the implementer's).
- A RED for the wrong reason (import/setup error) is not a RED. New-behavior rows must fail because the mapping/behavior does not exist yet; the two AC-8 rows must fail because the README lacks the required text, never because of a file error.
- `stripComments`'s existing behavior on the two shipped JS files must not regress: after your fix, re-run `tests/regression/source-safety.test.js` and confirm the three widened rows still pass against today's clean `index.html`.

## Outstanding issues
none

## Required next action
On this branch, commit messages `KEY-001: <imperative summary>`, never push, never touch production files or any untouchable test file.

**Sub-step 1 — extend the stub, prove the safety net (D-008).**
1. Add the 6 primitives from the matrix's "Why dom-stub.js must change" section to `tests/helpers/dom-stub.js` (activeElement, focus, blur, click-focuses-target, native Enter/Space default action suppressible by preventDefault). Commit.
2. Run `unit`, `integration`, `regression` gates (no `--phase` flag needed; use `--phase green` to record evidence) against the **unmodified** `script.js`/`calculator-core.js`. All must still pass at their current counts (67/22/17). This is the GUARD row's first run — write `tests/regression/keyboard-and-click-parity.test.js`'s GUARD row now and confirm it passes here. Commit evidence.

**Sub-step 2 — widen the security scan (D-009).**
3. Fix `stripComments` in `tests/helpers/source-scan.js` (regex-literal blind spot) and widen the three named tests in `tests/regression/source-safety.test.js` to scan `index.html` too, per the matrix's "carried-forward modifications" table. Before fixing, confirm each of the 4 rows fails for the stated reason on the current code (RED). Commit code, run `regression --phase red`, confirm exactly these 4 new/changed assertions fail and the rest of that file's rows still pass, commit evidence. Then apply the fix, run `regression --phase green` (all of `source-safety.test.js` passes, including against today's clean `index.html`), commit code then evidence.
4. Append/annotate `tests/regression/REGISTRY.md` per the matrix ("Registry rows to add"): a note on the three widened `source-safety.test.js` rows, plus a row for the one new row. Commit.

**Sub-step 3 — RED integration and regression tests for the keyboard feature itself.**
5. Write `tests/integration/keyboard.test.js` (24 rows) and `tests/regression/keyboard-and-click-parity.test.js` (the remaining 6 rows; the GUARD row is already written). Titles verbatim from the matrix. Commit.
6. Run `integration --phase red` and `regression --phase red`. Confirm: the 24 new integration rows fail because the key map, exported vocabulary, and `blur()` call do not exist; among the 7 regression rows, the GUARD row still passes and the other 6 fail; the two AC-8 rows fail specifically because `README.md` lacks the required text (not a file error). Commit evidence.
7. Append the 7 new `tests/regression/REGISTRY.md` rows (origin `KEY-001`).

Return `.agent/handoffs/KEY-001-04-integration-tester-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHAs per sub-step, run-gate evidence paths with one-line facts, why each RED row fails, the registry diff, confirmation that the GUARD row passed in sub-step 1, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. If anything blocks you, return BLOCKED naming the gap.
