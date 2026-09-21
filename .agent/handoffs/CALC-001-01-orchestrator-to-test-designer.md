---
unit: CALC-001
from: orchestrator
to: test-designer
sequence: 01
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff CALC-001-01: orchestrator → test-designer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). test-designer is a Sonnet agent (no fallback); attest your own model.

## Context
Gate 2 (TEST DESIGN) for `CALC-001` (show `Error` immediately when a divide-by-zero is resolved by an operator press). Spec: `.agent/units/CALC-001.md` (AC-1…AC-6, all user-confirmed, OQ-C1 and OQ-C2 resolved). Plan: `.agent/plan.md`.

Verified facts:
- `BOOT-001` is `COMPLETE` (commit `bf27d9c` on branch `agent/BOOT-001-core-extraction`, `head_ref` `28a19873b0c03224e111afb30e44829c919c9945`). The code you design against is the extracted pure core `calculator-core.js` (entry points `createState`, `applyInput`, `render`, D-003; input descriptor `{ type: 'number'|'operator'|'action', value }`, operators `+ - * /`, actions `clear`/`delete`/`equals`). `script.js` is the DOM layer; the DOM stub is `tests/helpers/dom-stub.js` (`loadPage()`, `press(tokens)`).
- **Pre-fix behavior**, verified by the BOOT-001 reviewers and the orchestrator against this core: `5 / 0 +` renders expression `` (empty), current `5÷0+`; then `=` renders expression `5÷0+Error`, current `NaN`. The BOOT-001 matrix records it under "Open questions", OQ-B1. This is the genuine-RED reference: every new unit row for AC-1…AC-4 must fail on today's core.
- **Oracle you can verify independently**: the fix rule is "an operator press that triggers a divide-by-zero leaves exactly the state pressing `=` would have left at that point, and the pressed operator is discarded". So the expected post-fix display after `X <op>` equals the display today's core gives after `X =`. Compute those values by running the current core in memory (no file writes) and record them in the matrix, alongside the current pre-fix values that make the RED meaningful.
- Accepted decisions that apply: `.agent/decisions/D-003-core-api.md` and `.agent/decisions/D-005-layering-rule.md` (fix stays inside the core; no DOM in the core; one dispatch seam). Reviewer note for the fix (RK-14 in the unit): must preserve the invariant `resetOnNextInput && !justCalculated` implies a non-empty `history`.
- **File placement (decided by the orchestrator; explain it in the matrix):** `validate.mjs state` treats any modification of a pre-existing file under `tests/` as a modified test that needs a `kind: test-change` decision (`checkTestChanges`, base_ref..head_ref). Appending rows to existing test files would trigger that, so design CALC-001's new tests as **new files**: `tests/unit/divide-by-zero.test.js`, `tests/integration/divide-by-zero-click.test.js`, `tests/regression/divide-by-zero.test.js`. The one unavoidable modification is `tests/regression/REGISTRY.md` (rows for the new regression tests, origin `CALC-001`); the orchestrator will write its decision record. Do not design any change to an existing test file's contents; `BOOT-001`'s suites must run unmodified (AC-5).
- Matrix format: `.agent/templates/matrix.md`; column 2 is the literal test title; `validate.mjs state` fails at `READY` if a named test is missing or an AC has no named row. Titles must avoid quotes, apostrophes, backslashes, backticks and non-ASCII (same rules as the BOOT-001 matrix). Read `.agent/units/BOOT-001.matrix.md` "Notation" for the glyph code points (`−` U+2212, `×` U+00D7, `÷` U+00F7).

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1 … AC-6.

## Relevant files
- `.agent/units/CALC-001.md`, `.agent/units/BOOT-001.matrix.md` (format, OQ-B1 pre-fix values), `.agent/templates/matrix.md`
- `calculator-core.js`, `script.js`, `README.md` (divide-by-zero bullet, AC-6), `tests/helpers/dom-stub.js`, `tests/unit/calculator-core.test.js` (style and helper reuse; read only)
- `.agent/decisions/D-003-core-api.md`, `.agent/decisions/D-005-layering-rule.md`

## Tests created / executed
none (design only)

## Results
n/a

## Decisions made
- New test files, not edits to existing ones (reason above).
- The mid-chain path is now in scope of `CALC-001` only; `BOOT-001` tests never assert it.

## Known risks
- RK-10: the RED is genuine only if the defect reproduces on the post-BOOT-001 core. Confirm it now by running the core in memory and record the exact pre-fix rendered values per row in the matrix (Input / setup or Expected column), so the implementer can confirm RED for the right reason.
- RK-11/RK-12: the fix sits on the shared operator transition; include rows that would catch a regression to operator replacement, chaining, continue-from-result, and to what `=` renders (`5 / 0 =`, `2 + 3 / 0 =`, `0 / 5 =`). The BOOT-001 suites already pin much of this; do not duplicate it, but state which existing rows guard which risk.

## Outstanding issues
none

## Required next action
Do two things, editing only the two matrix files and writing your handoff.

**A. Create `.agent/units/CALC-001.matrix.md`** from the template: every AC-1…AC-6 mapped to named rows (happy, boundary, invalid, error, edge, state, recovery as applicable) with file path, layer (unit / integration / regression), and exact expected values. Cover at least: each of the four operators in the failing position (AC-2); the chained case `2 + 3 / 0 *` (expression `2+3÷0`), `0 / 0 +`, and a `0.0` divisor such as `5 / 0 . 0 +` (AC-3); all five recovery inputs after the fixed state, `7`, `+`, `AC`, `DEL`, `=` (AC-4); the same defect through real clicks via the stub with one recovery click (integration); a regression file phrased as README behavior ("division by zero shows Error, also mid-chain") that fails without the fix (CLAUDE.md §14); the README bullet (AC-6) as a documentation check the documenter can verify (design a verifiable oracle, for example a static text check row, or state that AC-6 is verified by review and why); and a row proving the BOOT-001 suites still pass unmodified (AC-5), stating how (for example, the unit gate command runs them). State the pre-fix values so RED is checkable. List each row's TDD phase.

**B. Amend `.agent/units/BOOT-001.matrix.md`** (BOOT-001 is COMPLETE; this is a traceability fix only): add one row for the existing test named `throws a TypeError for a malformed input descriptor` in `tests/unit/calculator-core.test.js` (it is the 52nd test; read it to state its inputs and expectations exactly, and map it to the AC you judge fits, justifying the choice), and correct the "Not covered" bullet and any per-AC counts and totals that said the malformed-descriptor policy is untested or that there are 51 unit rows. Change **no other row and no test name**. `node .agent/tools/validate.mjs state` must still exit 0.

Then write `.agent/handoffs/CALC-001-02-test-designer-to-orchestrator.md` (template `.agent/templates/handoff.md`) and reply with its path plus ≤5 lines. Write nothing outside the repository. Completion is checkable: every AC-1…AC-6 has at least one named row and `validate.mjs state` exits 0.
