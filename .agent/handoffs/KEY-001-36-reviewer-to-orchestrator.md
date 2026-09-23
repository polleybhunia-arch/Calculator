---
unit: KEY-001
from: reviewer
to: orchestrator
sequence: 36
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-36: reviewer → orchestrator (cycle 4)

## Context
Full fresh code review of `KEY-001` at `head_ref` `377024ba68675fc48a3f0e5c07f881858d24e746`
(`base_ref` `f9426e284219f49816abad088275d219c72bdd81`), on **claude-opus-5** (no reviewer
fallback). Verdict: **CHANGES_REQUIRED**. Review file: `.agent/reviews/KEY-001-r4.md`
(`reviewed_ref` = `377024ba…`, `cycle: 4`).

My cycle-3 findings **F-1 and F-2 are closed**: two named integration rows added, nothing else
changed (`git diff --name-status fc93ff7a..377024ba` outside `.agent/` = `tests/integration/
keyboard.test.js` only, added lines only), and I reproduced both mutations myself — M10 is killed by
exactly `holding Space on a Tab focused digit button performs the action once`, M11 by exactly
`holding Enter on a Tab focused operator button performs the action once`.

The verdict is driven by one **new Major** test-adequacy finding in the same branch, not by a
behavior defect: no test anywhere focuses an action button, and three realistic mutants survive the
full 74-test suite.

## Acceptance criteria
AC-1 … AC-8 all **SATISFIED** in behavior (per-AC evidence lines in the review file). AC-6 and AC-7
are satisfied behaviorally but carry the open Major test gap (F-1).

## Relevant files
- `.agent/reviews/KEY-001-r4.md` — the verdict, per-AC lines, gate table, 28-mutant table
- `tests/integration/keyboard.test.js` — the two new rows (the only non-`.agent` change this cycle)
- `script.js:51-57`, `:89-103` — `isCalculatorButton` and the `Enter`/`Space`-on-button branch
- `.agent/decisions/D-013-…md:72`, `:115-116` — stale "unpinned" cell (F-2)
- `.agent/units/KEY-001.matrix.md` — missing rows for the three review-driven tests (F-3)

## Tests created / executed
- created: none (reviewers write no code)
- executed by me at `377024ba` inside a **scratch git worktree** (removed afterwards; `git worktree
  list` shows only the repo, `git status` shows no modified tracked file — the repo's SHA-bound
  `latest-*-final.json` pointers were never rewritten):
  - `node .agent/tools/run-gate.mjs unit --unit KEY-001` → exit 0, tests 83 / pass 83 / fail 0
  - `node .agent/tools/run-gate.mjs integration --unit KEY-001` → exit 0, 49 / 49 / 0
  - `node .agent/tools/run-gate.mjs regression --unit KEY-001` → exit 0, 25 / 25 / 0
  - `node .agent/tools/run-gate.mjs lint --unit KEY-001` → exit 0, PASS
  - `node .agent/tools/validate.mjs state` → `state: OK`, exit 0
  - 28 mutation probes (in-memory `CALC_STUB_TRANSFORM` + reverted core edits in the worktree)

## Results
All four recorded `latest-*-final.json` at `head_ref` match my independent runs exactly (83 / 49 /
25 / PASS, `dirty=false`, `head=377024ba`). No discrepancy. 25 of 28 non-equivalent mutants killed;
M21 is an equivalent mutant; the three survivors (M29, M27, M31) are one finding. All 51 test names
quoted in the matrix exist in `tests/**`; no `.only`/`.skip`/`todo:` anywhere under `tests/`.

## Findings (full text and required changes in the review file)
- **F-1 · Major · `tests/integration/keyboard.test.js` (AC-6/AC-7 block)** — no row focuses an `AC`
  or `DEL` button, where the branch is *not* degenerate (`Enter` maps to `equals`, not
  `clear`/`delete`). Survivors, all 74/74 green: M29 (`isCalculatorButton` forgets `data-action`),
  M27 (branch skips action buttons), M31 (repeat guard skips action buttons). Measured wrong
  behavior under them: `Tab`→`DEL`→`Enter` evaluates instead of deleting; `Tab`→`AC`→`Enter` renders
  `4+8`/`12` instead of `0`; held `Enter` on `DEL` renders `0` instead of `12`. Fix: one integration
  row (`the DEL button reached by Tab and activated by a held Enter deletes exactly once`: keys
  `1 2 3`, focus `DEL`, `Enter` repeat:false + two repeats, expect `('', '12')`), which kills all
  three; optionally a second `AC` row. Test-only, no product change.
- **F-2 · Minor · `.agent/decisions/D-013-…md:72`, `:115-116`** — the accepted case-set table still
  marks the `Space`/repeat cell "unpinned"; it is now pinned. Update the table and Consequences.
- **F-3 · Minor · `.agent/units/KEY-001.matrix.md`** — the three review-driven integration tests have
  no matrix row (already named as open in `D-013`'s Consequences / `arch3` F-3).
- **F-4 · Nit · `calculator-core.js:225`/`:232`** — the documented defensive copy in the key map is
  unpinned (probe C5 survives).
- **F-5 · Nit · repository state** — 4th cycle with `HEAD` (`6f104c6b`) ≠ `head_ref` (`377024ba`);
  `.agent/`-only drift, gates unaffected. The scratch-worktree approach avoids the evidence-pointer
  clobber entirely and cost nothing.

## Decisions made
None (reviewers record no decisions). Note for routing: F-2 touches a decision record, which is
`architecture-reviewer`/human territory, not `implementer` or mine.

## Known risks
- The `Enter`/`Space`-on-button branch has now produced a finding in four consecutive cycles; F-1 is
  its last unguarded quadrant (`D-013` clause 3's table, action-button row).
- Everything about real-browser activation semantics remains `UNVERIFIED` (RK-3); the unit's manual
  checklist is where it closes. F-1's row would benefit from a matching manual item ("Tab to `DEL`,
  hold `Enter` — expect one character deleted, not the whole number").

## Outstanding issues
F-1 (Major) is open and blocks `APPROVED`. F-2/F-3 (Minor) and F-4/F-5 (Nit) do not block; the
standing user decision to carry Minors/Nits as known issues can be applied to them.

## Required next action
Route F-1 to `integration-tester` as a test-only addition (one integration row, no product code
change), then re-run gates 4/6/7 and open a **new** review cycle (r5) against the new `head_ref`, per
CLAUDE.md §10/§11. If the user instead chooses to accept F-1 as a known issue, that must be an
explicit recorded decision — I cannot approve while it is open.
