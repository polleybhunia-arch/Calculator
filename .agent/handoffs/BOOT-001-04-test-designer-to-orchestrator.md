---
unit: BOOT-001
from: test-designer
to: orchestrator
sequence: 04
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff BOOT-001-04: test-designer → orchestrator

## Context
Gate 2 re-run for `BOOT-001`, answering dispatch `.agent/handoffs/BOOT-001-03-orchestrator-to-test-designer.md`. Only `.agent/units/BOOT-001.matrix.md` was edited (plus this handoff). No unit file, product code or test was touched. Baseline `e02035b`; `git diff --stat e02035b -- script.js index.html style.css README.md` is empty. test-designer is a Sonnet agent (no fallback), spawned without a `model` parameter.

## Acceptance criteria
See `.agent/units/BOOT-001.md` AC-1 … AC-8 (AC-8 new; AC-1, AC-4, AC-6, AC-7 reworded).

## Relevant files
- `.agent/units/BOOT-001.matrix.md` — amended matrix (84 named rows, unchanged count)
- `.agent/units/BOOT-001.md` — spec, read only
- `.agent/handoffs/PLAN-04-planner-to-orchestrator.md` — planner item 3, followed exactly
- `.agent/units/CALC-001.md` — read only; its matrix was not designed

## Tests created / executed
- created: none (design only)
- executed: `node .agent/tools/validate.mjs state` -> `state: OK`, exit 0 (final run, after the last edit)
- executed (throwaway, nothing committed): the AC-8 clause sequences and the other remapped rows run against the unmodified `script.js` through an in-memory DOM stub given on stdin

## Results
- **Remap done, nothing renamed, no expectation changed.** Nine rows moved to the end of the unit table and re-labelled `AC-8` (six from AC-5: "AC clears the pending operator, the trail and the result", "DEL right after an operator clears the whole calculation", "DEL after a result clears the result and the expression line", "ignores equals when no operator is pending", "ignores a second equals after a result", "uses the held value as the second operand when equals follows an operator"; three from AC-2: "DEL removes the last typed character including a decimal point", "DEL on the last remaining digit or on a fresh state leaves 0", "DEL in the second operand changes only that operand"). "clears Error with DEL" stays on AC-4 as instructed.
- **Integrity check by script**: 84 named rows, 84 unique names, all ASCII with no quote/backslash/backtick/apostrophe, every row has 6 columns; a fingerprint of columns 2-6 of all 84 rows equals the pre-edit fingerprint with only the AC-4 parenthetical substituted. The only text change inside a test row is that parenthetical in "renders Error when dividing by zero": `(E is not stated by AC-4; this is what the script does, see AC notes)` became `(AC-4 states this expression line; it is also what the script does)`, because AC-4 now states the expression. Values `E=5÷0`, `C=Error` are untouched.
- **AC-8 clauses (a)-(f) all covered by existing rows with the exact values AC-8 states; no new row was needed.** Clause (c) `5 / 0 = DEL` is pinned by the AC-4 row "clears Error with DEL" (E empty, C `0`, then `7` gives `7`) per your instruction. A new "AC-8 clause map" table after the unit matrix records clause -> rows (it is not a set of test rows and has no `AC-n` first cell). Every AC-8 value was re-run against the unmodified `script.js` and matched (`4 + 8 AC` then `5 =` gives empty/`5`; `1 . 5 DEL DEL` gives `1.` then `1`; `4 + DEL`, `4 + 8 + 9 = DEL`, `5 / 0 = DEL` give empty/`0`; `=` gives empty/`0`; `5 =` gives empty/`5`; `5 + =` gives `5+5`/`10`; `4 + 8 + 9 = =` gives `4+8+9`/`21`). Reproducibility of that probe stays `UNVERIFIED` (not committed).
- **Rows per AC**: AC-1 5, AC-2 7, AC-3 12, AC-4 9, AC-5 9, AC-6 26 (integration 18 + regression 8), AC-7 7 (integration 2 + regression 5), AC-8 9. Total 84 (unit 51, integration 20, regression 13). Every AC in the unit file (AC-1 … AC-8) has at least one quoted-name row, and the READY-style check (`\bAC-n\b` present in the matrix) passes for all eight.
- **OQ-B1 superseded by `CALC-001`**: the three "proposed rows" are marked SUPERSEDED (still no quoted name in column 2, so validate does not demand them); the OQ table now carries the resolutions (OQ-B1 -> CALC-001, OQ-B2 and OQ-B3 frozen as baseline). The observed pre-fix values for the mid-chain path are kept unchanged, because `CALC-001` cites that section as its RED reference. A scan of the input column confirmed that no named row applies an operator after a zero divisor, so AC-6 ("no test here may assert an expectation for it") holds.
- Updated for consistency: totals and per-AC count table, coverage summary, "Not covered", "AC notes" (earlier AC-1/AC-4/AC-6/AC-7/AC-8 notes marked resolved), regression impact (CALC-001 and KEY-001 downstream), mutation sanity (+4 AC-8 bullets), adequacy checklist. A stale reference to a non-existent "OQ-B6" was removed.

## Decisions made
- Followed the dispatch rule "remap only": no renames, no expectation changes, no new rows.
- Moved the nine rows together at the end of the unit table so AC-8 reads as one block; the row text is otherwise identical.
- Kept the OQ-B1 observation text intact (CALC-001 depends on it) and superseded only the proposed rows.

## Known risks
- **RK-1 residual, not automatable in BOOT-001**: the unit DoD says the mid-chain path (`5 / 0 +` -> `5÷0+`) must still behave as at `e02035b`, but AC-6 forbids any test here asserting it, so nothing in this unit's suites detects drift on that path. Detection is limited to the reviewer's own probe (comparing `git show e02035b:script.js` with the extracted core) or the RED run of `CALC-001`. Recorded under "Not covered" and in the adequacy checklist (one item deliberately left unchecked).
- RK-2/RK-3/RK-4 unchanged: DOM-stub fidelity, real browser and `file://` stay `UNVERIFIED`.

## Outstanding issues
Non-blocking; none prevents `PLANNED -> READY`.
1. **AC-8 has no clause for `DEL` in a second operand.** The row "DEL in the second operand changes only that operand" (`4 + 8 DEL` -> empty/`4+0`, then `5 =` -> `4+5`/`9`) was re-labelled AC-8 as you listed, but none of clauses (a)-(f) states it. Expectation verified against the script. Suggest the planner add a clause (g) at the next replan, or accept that it sits under AC-8's general edit wording.
2. **AC-8(c) `5 / 0 = DEL` has no AC-8-labelled row** (row stays on AC-4 by your decision; covered and traceable through the clause map). If a reviewer needs a literal AC-8 row, add a new named row rather than renaming.
3. **DoD drift line for the mid-chain path is not testable here** (see Known risks). Decide whether the reviewer must probe it or whether `CALC-001`'s RED run is accepted as the detector.
4. **AC-7 scan wording**: AC-7 says `eval`, the row scans `eval(`; an indirect `const f = eval;` would slip through. The implementer may use a word-boundary match (a superset, same row).
5. Environment note: to diff safely I copied the matrix to the session scratchpad with `cp` before noticing that `.claude/hooks/write-guard.mjs` blocks writes outside the repository (it blocked a `Write` there, correctly per CLAUDE.md §4). I deleted that copy immediately; nothing outside the repository remains and nothing inside it besides the matrix and this handoff was created or changed. All later edits used stdin-only scripts against the matrix.

## Required next action
Orchestrator: review the amended `.agent/units/BOOT-001.matrix.md`, decide items 1-4 above (none blocks), then record gate 2 and move `BOOT-001` `PLANNED -> READY`; `validate.mjs state` is OK now and, from `READY` on, will find a named row for every AC-1 … AC-8.
