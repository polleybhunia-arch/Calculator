---
unit: KEY-001
from: test-designer
to: orchestrator
sequence: 02
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff KEY-001-02: test-designer → orchestrator

## Context
Gate 2 (TEST DESIGN) for `KEY-001`, per dispatch `.agent/handoffs/KEY-001-01-orchestrator-to-test-designer.md`. Read the unit file in full (rewritten AC-6, OQ-3 resolution, "Carried forward from the BOOT-001 reviews" section), `D-003`, `D-005`, `BOOT-001.matrix.md`, `CALC-001.matrix.md`, all three `BOOT-001` reviews, `CALC-001-r1.md`, current `calculator-core.js`/`script.js`/`index.html`/`README.md`/`tests/helpers/dom-stub.js`/`tests/helpers/source-scan.js`/`tests/regression/source-safety.test.js`. Wrote `.agent/units/KEY-001.matrix.md` (design only — no test code, no product code, no edit to the unit file). Confirmed `node .agent/tools/validate.mjs state` exits 0 both before and after writing the matrix.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1…AC-8, as rewritten 2026-09-21 (AC-6 per OQ-3's override). All eight covered; see the matrix's "Rows per AC" table (51 named rows: unit 16, integration 24, regression 7 new-file + 4 modified-existing-file).

## Relevant files
- `.agent/units/KEY-001.matrix.md` — the deliverable
- `.agent/units/KEY-001.md`, `.agent/decisions/D-003-core-api.md`, `.agent/decisions/D-005-layering-rule.md` — read for design constraints
- `.agent/units/BOOT-001.matrix.md`, `.agent/units/CALC-001.matrix.md` — format/glyph precedent, and the source of every reused oracle value (`4+8+9=21`, `0.1+0.2=0.3`, `5÷0+` → `Error`, etc.)
- `.agent/reviews/BOOT-001-r1.md`, `-sec1.md`, `-arch1.md`, `.agent/reviews/CALC-001-r1.md` — carried-forward finding text
- `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js` — read; the matrix specifies required extensions/modifications, no test code written

## Tests created / executed
None — design only, per role contract.

## Results
n/a (no tests run). `node .agent/tools/validate.mjs state` → `state: OK`, both before writing the matrix and after (confirmed by re-running it).

## Decisions made
None (test-designer does not write decision records). Flagged for the orchestrator instead:
- File placement as the dispatch specified: three brand-new files (`tests/unit/key-map.test.js`, `tests/integration/keyboard.test.js`, `tests/regression/keyboard-and-click-parity.test.js`) plus a new helper (`tests/helpers/core-input.js`, item 7); `tests/helpers/source-scan.js` and `tests/regression/source-safety.test.js` modified in place (items 2/3, decision record pre-authorized by the dispatch).

## Known risks
- **New finding, not pre-authorized by the dispatch**: `tests/helpers/dom-stub.js` also needs a `kind: test-change` decision record — a **third** file beyond the two the dispatch named. AC-6's fix adds `element.blur()` to the shared mouse-click handler in `script.js`, which every existing click-path test (BOOT-001's 20 integration + 8 regression rows, CALC-001's own suites) runs through — if the stub's `Element` has no `blur` method, those tests throw once the fixed `script.js` loads, not just the new KEY-001 rows. AC-6/AC-7 are also otherwise untestable without `document.activeElement`, `focus()`/`blur()`, and a simulated native `Enter`/`Space` activation — exactly the primitives the dispatch's own stub-fidelity paragraph names. `git diff --name-status` will show `M tests/helpers/dom-stub.js`, which `validate.mjs`'s `checkTestChanges` treats identically to the other two files (any `M`/`D` under `tests/`, not only `*.test.js`). See the matrix's "Why `dom-stub.js` must change" section for the exact required primitives (7 items) and its "Carried-forward items — cross-reference" / "AC notes" for how this was surfaced.
- RK-2 (stub fidelity): itemized precisely in the matrix (`document.activeElement`, `focus`/`blur`, native-activation simulation with `preventDefault()` suppression). Two integration rows (Tab-to-equals + Enter/Space) rely on a call-count spy on `CalculatorCore.applyInput` rather than a display-only assertion, because a repeated `=` with no pending operator is already a no-op (`BOOT-001` AC-8(f)) — documented as an oracle-limitation note in the matrix so it is not mistaken for a shortcut.
- RK-5 (over-broad `preventDefault()`): covered by dedicated rows ("a mapped modifier free key calls preventDefault exactly once", "Tab never has preventDefault called").
- Mouse-click parity: one GUARD row added (must pass before **and** after implementation) re-deriving all eight `readme-behavior.test.js` values through clicks only, on a page with the new stub primitives and (later) the new `script.js`.
- AC-7/OQ-4 leave the repeat policy for `Escape`/`Delete` (clear) unstated; not blocking since `clear` is idempotent either way (no test can discriminate), but flagged in the matrix's "Not covered" for planner awareness.

## Outstanding issues
- The `dom-stub.js` decision-record gap above is the one item that needs the orchestrator's action before/at the next stage (writing that third `kind: test-change` decision, alongside the two already pre-authorized for `source-scan.js`/`source-safety.test.js`).
- Item 5 (`CALC_STUB_TRANSFORM` not recorded in gate evidence) is intentionally **not** a matrix row, per the dispatch's own instruction — forwarded here as a human (`run-gate.mjs`) decision, nothing further needed from test-design.
- `tests/regression/REGISTRY.md`: the matrix recommends the 3 modified + 1 new `source-safety.test.js` rows get a **note appended** to their existing `BOOT-001`-origin entries (widened scope) rather than a new duplicate row, since they are the same test names; left for the orchestrator to phrase (see matrix "Regression impact").

## Required next action
Review `.agent/units/KEY-001.matrix.md`; write the (now three) `kind: test-change` decision records for `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js`, and `tests/helpers/dom-stub.js`; then move `KEY-001` to `READY` and dispatch the implementer for RED.
