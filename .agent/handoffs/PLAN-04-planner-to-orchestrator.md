---
unit: PLAN
from: planner
to: orchestrator
sequence: 04
model_attested: claude-opus-5
state: PLANNED
---

# Handoff PLAN-04: planner → orchestrator

## Context
Answers dispatch `.agent/handoffs/PLAN-03-orchestrator-to-planner.md`. Planning only — no product
code or test was written, and `.agent/units/BOOT-001.matrix.md` was read but not edited
(test-designer owns it). Sources read before writing: `CLAUDE.md`, `.agent/plan.md`, the three
unit files, the matrix, `.agent/handoffs/BOOT-001-02-test-designer-to-orchestrator.md`,
`script.js`, `README.md`, `.agent/gates.json`, `.agent/templates/unit.md`,
`.agent/templates/handoff.md`, and `.agent/tools/validate.mjs` (for `depends_on` syntax — a
comma-separated list, and the AC→matrix coverage check that fires from `READY` onwards).

The `Edit` tool was unavailable in this session, so each amended file was rewritten in full with
`Write`; no unit `Log` line was added to BOOT-001 or KEY-001 because their status did not change
(only the orchestrator appends transitions, and `Log` accepts transition lines only). The
amendments are marked in the files themselves and in `.agent/plan.md`.

## Acceptance criteria
Written, not evaluated here.
- `BOOT-001`: AC-1, AC-4, AC-6, AC-7 reworded; **AC-8 added**; AC-2, AC-3, AC-5 untouched; nothing
  renumbered.
- `CALC-001`: AC-1 … AC-6 (new unit).
- `KEY-001`: AC list unchanged.

## Relevant files
- `.agent/units/BOOT-001.md` — AC-1 now names the three entry points functionally (fresh-state
  constructor, `(state, input) -> state`, `(state) -> { expression, current }`) and binds their
  names to the core-API decision record, plus fresh-state render `0`, state independence and
  non-mutation (all already matrix rows); AC-4 now states expression `5÷0` with current `Error`;
  AC-6 now names `.agent/units/BOOT-001.matrix.md` as *the* record confirmed against the
  unmodified `script.js` at `e02035b` and excludes the mid-chain divide-by-zero path (owned by
  `CALC-001`); AC-7 now scopes the scan to `index.html`, `script.js`, `calculator-core.js` only;
  AC-8 states today's `AC` / `DEL` / no-op-`=` / `=`-after-operator / second-`=` behavior with
  concrete values (clauses a–f), describing current behavior only. Risks record OQ-B1/B2/B3 as
  resolved; DoD and Known Issues state that the mid-chain path must neither be fixed nor pinned
  here, and that drift on it is a reportable defect.
- `.agent/units/CALC-001.md` — **new**, status `PLANNED`, tier `T1`, `depends_on: BOOT-001`,
  security review expected `N/A` (pure arithmetic guard: no new input surface, no markup write,
  no storage/network/dependency change) — orchestrator confirms against CLAUDE.md §8. Required
  Tests: RED-first unit rows on the post-BOOT-001 core, an integration row through the DOM stub
  click path, a new `tests/regression/divide-by-zero.test.js` that fails without the fix
  (CLAUDE.md §14) with `REGISTRY.md` rows, and an explicit rule for a non-reproducing defect
  (record observed values, report BOOT-001 drift, decision record — never a claimed RED).
- `.agent/units/KEY-001.md` — `depends_on: BOOT-001, CALC-001`; Dependencies and Context explain
  the serialization; the regression test list now expects the *fixed* mid-chain `Error`; RK-13
  added.
- `.agent/plan.md` — revision note; R-14 added; CALC-001 rows in the tier table, unit graph and
  regression plan; execution order BOOT-001 → CALC-001 → KEY-001 → KEY-002; approach section on
  defect handling with the two rejected alternatives (fix inside BOOT-001 / pin then delete);
  RK-1 residual reassigned; RK-10…RK-13 added; RK-7 marked resolved; OQ-B1/B2/B3 resolutions and
  the new OQ-C1/OQ-C2 rows; orchestrator notes.
- `.agent/units/BOOT-001.matrix.md` — read only, unchanged.

## Tests created / executed
- created: none (planning only)
- executed: `node .agent/tools/validate.mjs state` → `state: OK`, exit code `0` (run after all
  four files were written; no evidence file is produced by this gate-less command)

## Results
- `validate.mjs state` exits 0 with the new unit present, the new `depends_on` list parsed, and
  the graph still acyclic (BOOT-001 → CALC-001 → KEY-001 → KEY-002).
- AC→matrix coverage is **not** yet checked by the validator because every unit is `PLANNED`; it
  fires at `READY`. BOOT-001 therefore validates now but will fail at `READY` until AC-8 has a
  matrix row (see Outstanding issues).

## Decisions made
- `CALC-001` is tiered **T1**: one behavior slice confined to the zero-divisor branch of the core,
  few files, reviewable in one sitting; no new module boundary, so no architecture review unless
  a failure signature repeats three times (CLAUDE.md §6).
- `CALC-001`'s fix rule is stated as a single invariant — *an operator press that triggers a
  divide-by-zero leaves exactly the state that pressing `=` would have left, and the pressed
  operator is discarded* — so every case (`5 / 0 +`, all four operators, `0 / 0 +`, `5 / 0 . 0 +`,
  and the five recovery inputs) follows from one rule instead of a list of special cases.
- `docs` for `CALC-001` is `UPDATED`, not `N/A`: the behavior change is user-visible, so
  README's divide-by-zero bullet is sharpened in the same unit (CLAUDE.md §4). That is AC-6.
- AC-8 was written strictly from matrix rows that already exist (verified value by value against
  the matrix and by hand-trace of `script.js`), so it adds no new behavior and needs no new test
  design — only a remap.
- BOOT-001's DoD gained one line making the *preservation* of the defect explicit, so "behavior
  identical" is falsifiable on that path too.

## Known risks
- **RK-10**: `CALC-001`'s RED is genuine only if the defect survives the BOOT-001 extraction. The
  unit forbids a retro-fitted RED and routes the alternative through a decision record.
- **RK-11**: the fix touches the shared operator transition (chaining, operator replacement,
  continue-from-result run through it). Mitigated by re-running BOOT-001's suites unmodified
  (CALC-001 AC-5) and by confining the change to the zero-divisor branch.
- **RK-12**: BOOT-001 cannot reach `READY` until the matrix covers AC-8.
- **RK-13**: KEY-001's divide-by-zero parity expectations now assume the CALC-001 fix and the
  OQ-C1 answer.
- **RK-6**: the `lint` gate (`node --check script.js`) still does not cover `calculator-core.js`;
  CALC-001 and KEY-001 inherit BOOT-001's OQ-7 block at gate 8. Only the human may edit
  `.agent/gates.json`.

## Outstanding issues
1. **OQ-C1 — blocking `CALC-001` gate 1 (needs the user).** For a divide-by-zero later in a
   chain, what does the expression line show? `2 + 3 / 0 *` → `2+3÷0` (the full typed expression —
   exactly what `2 + 3 / 0 =` renders today, verified by hand-trace of `equals()` at `e02035b`)
   or `5÷0` (only the failing operation, using the resolved intermediate `5`)? Proposed default:
   `2+3÷0`. I did not choose, per the dispatch. `CALC-001` AC-3 carries the default and is the
   only AC affected.
2. **OQ-C2 — non-blocking, one-line confirmation.** After the fix, is the state fully equivalent
   to having pressed `=`, so a following `=` is ignored and the expression line keeps showing
   `5÷0`? `CALC-001` AC-4 assumes yes; it is derived from the user's own wording, not guessed at
   the level of behavior.
3. **Gate 2 re-run for BOOT-001 (no user needed).** The matrix must attach rows to AC-8 before
   BOOT-001 goes `READY`: remap the existing rows "AC clears the pending operator, the trail and
   the result", "DEL right after an operator clears the whole calculation", "DEL after a result
   clears the result and the expression line", "ignores equals when no operator is pending",
   "ignores a second equals after a result", "uses the held value as the second operand when
   equals follows an operator" (currently AC-5) and the three core-level `DEL` rows (currently
   AC-2) from AC-2/AC-5 to AC-8. No expectation and no test name changes. While remapping, the
   test-designer should also mark the matrix's three "proposed rows" for OQ-B1 as superseded by
   `CALC-001`, and may answer its own AC-7 scoping question as confirmed (AC-7 now names the three
   files).
4. OQ-5 and OQ-8 remain open but are only needed before KEY-002.

## Required next action
Ask the user OQ-C1 (and, in the same message, OQ-C2 for confirmation); then dispatch the
test-designer to remap the BOOT-001 matrix rows onto AC-8 (gate 2 re-run) so BOOT-001 can move
`PLANNED -> READY`.
