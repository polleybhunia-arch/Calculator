---
unit: BOOT-001
from: orchestrator
to: test-designer
sequence: 03
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff BOOT-001-03: orchestrator → test-designer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). test-designer is a Sonnet agent (no fallback); attest your own model.

## Context
Gate 2 re-run for `BOOT-001`. Your matrix `.agent/units/BOOT-001.matrix.md` was accepted. The planner then amended the unit (handoff `.agent/handoffs/PLAN-04-planner-to-orchestrator.md`) after the user answered your open questions:
- **OQ-B1 resolved: separate fix unit `CALC-001`; the mid-chain divide-by-zero path is neither pinned nor fixed in BOOT-001.** Your three "proposed rows" for OQ-B1 must stay out of the required set and be marked superseded by `CALC-001` (see `.agent/units/CALC-001.md`).
- **OQ-B2 and OQ-B3 resolved: frozen as baseline** (`5 + =` gives `5+5` / `10`; `DEL` after an operator, `=` or `Error` clears everything including the trail).
- Unit changes in `.agent/units/BOOT-001.md`: **AC-8 added** (core edit/clear/equals edge behavior, clauses (a)–(f)); AC-1 reworded (entry points bound to the API decision record; "at least three" entry points because KEY-001 will add a key map); AC-4 now states expression `5÷0` + current `Error`; AC-6 names your matrix as the expectation record and excludes the mid-chain path; AC-7 scope is the three named files only (your reading confirmed).
- `validate.mjs state` enforces AC→matrix coverage from `READY` onward; BOOT-001 currently has no row for AC-8, so it would fail at `READY`.

Baseline commit `e02035b`; `script.js`, `index.html`, `style.css`, `README.md` unchanged since. `validate.mjs state` = OK now.

## Acceptance criteria
See `.agent/units/BOOT-001.md` AC-1 … AC-8 (AC-8 is new; AC-1, AC-4, AC-6, AC-7 reworded).

## Relevant files
- `.agent/units/BOOT-001.md` — amended spec (read only for you)
- `.agent/units/BOOT-001.matrix.md` — yours to edit
- `.agent/handoffs/PLAN-04-planner-to-orchestrator.md` — planner's outstanding item 3 lists the exact rows to remap
- `.agent/units/CALC-001.md` — owner of the mid-chain defect (read only; do not design its matrix now)

## Tests created / executed
none (design only)

## Results
n/a

## Decisions made
- Remap only; expectations and test names must not change. A test name in column 2 is the literal test title the implementer will use, so renaming would break the contract.

## Known risks
- AC-8 must describe today's behavior only. If any clause (a)–(f) is not covered by an existing row, or a value in AC-8 disagrees with the matrix, return `BLOCKED` naming the row rather than choosing.

## Outstanding issues
none

## Required next action
Edit `.agent/units/BOOT-001.matrix.md` only:
1. Change the AC column to `AC-8` for the rows planner item 3 lists: "AC clears the pending operator, the trail and the result", "DEL right after an operator clears the whole calculation", "DEL after a result clears the result and the expression line", "ignores equals when no operator is pending", "ignores a second equals after a result", "uses the held value as the second operand when equals follows an operator", and the three core-level DEL rows "DEL removes the last typed character including a decimal point", "DEL on the last remaining digit or on a fresh state leaves 0", "DEL in the second operand changes only that operand" (verify each against AC-8 clauses (a)–(f); AC-8(c) also covers `5 / 0 = DEL`, which the "clears Error with DEL" row already pins under AC-4: leave that row on AC-4 unless a row is missing for the AC-8 wording).
2. Confirm every AC-8 clause (a)–(f) has at least one named row with the exact values AC-8 states; add a new named row only for an uncovered clause.
3. Mark the three OQ-B1 "proposed rows" superseded by `CALC-001`; update the totals, the per-AC row counts, the "Not covered" and "AC notes for the planner" sections (the notes for AC-1, AC-4, AC-6, AC-7 and AC-8 are now resolved), the coverage table and the adequacy checklist so they are internally consistent.
4. Run `node .agent/tools/validate.mjs state` (must exit 0). To check AC coverage the way READY will, you may compare the ACs in the unit file to the AC column by script; do not edit the unit file.
Then write `.agent/handoffs/BOOT-001-04-test-designer-to-orchestrator.md` (template `.agent/templates/handoff.md`) and reply with its path plus ≤5 lines. Completion is checkable: every AC-1…AC-8 has at least one named row and validate.mjs exits 0.
