---
unit: KEY-001
from: reviewer
to: orchestrator
sequence: 20
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-20: reviewer → orchestrator (cycle 2)

## Context
Full independent re-review of `f9426e28..5678cc1b` (not a spot-check of the fix diff), cycle 2, on
**claude-opus-5** — no fallback. Review file: `.agent/reviews/KEY-001-r2.md`,
`reviewed_ref: 5678cc1b70f39af6859c980a8520bb858418a140`, **verdict: CHANGES_REQUIRED**.
`git rev-parse HEAD` = `6d31d7fe`; `git diff --stat 5678cc1b..HEAD -- . ':!.agent'` is empty, so the
tree I ran is byte-identical to `head_ref` outside `.agent/` and the verdict binds to `5678cc1b`.
I did not read handoffs `KEY-001-04`, `-06`, `-08`, `-16`, nor the cycle-2 peer reviews.

## Acceptance criteria
AC-1 SATISFIED · AC-2 SATISFIED · AC-3 SATISFIED · AC-4 SATISFIED · AC-5 SATISFIED ·
**AC-6 SATISFIED** (both sentences; cycle-1 F-1 and F-2 are closed) · **AC-7 NOT_SATISFIED** ·
AC-8 SATISFIED. Per-AC evidence lines are in the review file in the machine-read format.

## Tests created / executed
- created: none (reviewer; no product or test file changed on disk, no worktree created)
- executed (verbatim from `.agent/gates.json`, not via `run-gate.mjs` — it would overwrite
  `head_ref`-bound evidence at a different HEAD and the dispatch forbade disk changes):
  - `node --test "tests/unit/**/*.test.js"` → tests 83, pass 83, fail 0
  - `node --test "tests/integration/**/*.test.js"` → tests 46, pass 46, fail 0
  - `node --test "tests/regression/**/*.test.js"` → tests 25, pass 25, fail 0
  - `node --check script.js && node --check calculator-core.js` → exit 0
  - `node .agent/tools/validate.mjs state` → `state: OK`
- cross-checked: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`
  (`head=5678cc1b70…`, `dirty=false`, `exitCode=0`, 83/46/25, no `CALC_STUB_TRANSFORM` warning in any
  `outputTail`) and the fix cycle's genuine RED
  `.agent/test-results/KEY-001/integration-red-2026-09-22T06-48-11-908Z.json` (exit 1, 45/46, failure
  at `keyboard.test.js:252`, `actual: null, expected: [Element]`).

## Results
- Gates reproduce exactly as recorded; 51/51 matrix row names present verbatim; no `.only`/`.skip`/
  `.todo`/`TODO`/`FIXME`; the six untouchable BOOT-001/CALC-001 test files are byte-identical;
  `index.html` unchanged.
- The corrected AC-6 row is genuinely discriminating in three directions (in-memory
  `CALC_STUB_TRANSFORM` probes, nothing written to disk): delete `blur()` → RED; restore the
  unconditional `blur()` (cycle-1 code) → RED; invert the gate to `detail === 0` → RED.
  Probes also killed: `allowsRepeat → true` (both spy rows), modifier guard narrowed to `ctrlKey`,
  `preventDefault` removed. The `Enter`/`Space`-guard mutation still kills only 1 of 4 Tab rows
  (carried r1 F-3, accurately described in Known Issues).
- Behavioral probes: mouse click `4` then keys routed to the focused element → `4+8`/`12`;
  Tab-focus `7` + `Enter` → `7` with focus retained; `=` focused + `Enter` → one dispatch;
  Tab-focus `7` then key `5` → one action, focus kept; click on a grid gap → no throw.

## Decisions made
- `D-011` Option A is implemented as decided and is the cheapest correct shape of it; I judge it
  sound (four production lines, no new state, origin read from the event).
- The held-`Enter`-on-a-focused-button known issue **must not be carried**: see below.

## Known risks
- The whole AC-6 sentence-1 guarantee rests on real browsers reporting `detail >= 1` for a
  pointer-originated click; if one does not (e.g. a touch tap), the *original* user-reported defect
  (`4+84`) returns silently and no test can see it. Manual browser + touch check required (F-3).
- The stub's native-activation model fires on every non-prevented `Enter`/`Space` keydown and is not
  gated on `event.repeat`; real `Space` activates on keyup, so the stub overstates the `Space` half
  of F-1 while the `Enter` half is realistic.

## Outstanding issues
Three findings (full location/problem/required-change text in the review file):
- **F-1 Major** — `script.js:88-93` + README keyboard bullet + AC-7: a **held** `Enter` on a
  Tab-focused button performs the action on every repeat (probe: `777` on the focused `7` button),
  contradicting AC-7's second clause and the README's "act once per press even if held down". It is a
  behavior change introduced by this commit (restoring the pre-fix unconditional `blur()` yields `7`)
  and **no test observes it**. Fix either by suppressing repeat activations
  (`if (event.repeat) { event.preventDefault(); return; }` in the guard) plus a row asserting `7`, or —
  if native repeat semantics are wanted — by a recorded decision that rescopes AC-7's second clause and
  the README sentence, plus a row pinning `777`. Either way a named matrix row must exist first.
- **F-2 Minor** — `tests/integration/keyboard.test.js:230-257`: one row asserts two behaviors while its
  name covers only the first (sanctioned by D-011's "one integration row", still §4 "one behavior per
  test"). Split into a second named matrix row.
- **F-3 Minor** — add explicit mouse-click and touch-tap items naming `event.detail` to the unit's
  manual-browser checklist.
Cycle-1 Minor/Nits (r1 F-3…F-7) and the peer reviewers' Minor/Nits are carried by user decision and
were not re-flagged as blocking; I re-confirmed r1 F-3 is still exactly as described.
Not verified: real-browser `detail`/focus/auto-repeat semantics, recorder-bound gate re-execution
(deliberately left to you), the cycle-2 security and architecture verdicts at this SHA.

## Required next action
Treat this as a review failure (CLAUDE.md §10): set `KEY-001` to `CHANGES_REQUIRED`, put F-1's
open question (suppress the repeat activation, or rescope AC-7/README and pin the current behavior)
to the user since it changes either shipped behavior or a recorded AC, then dispatch test-designer
(matrix row) and implementer for the fix; gates 4/6/7 and a full cycle-3 review are required on the
new head. F-2 and F-3 should be folded into the same commit.
