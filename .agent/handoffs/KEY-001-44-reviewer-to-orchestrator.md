---
unit: KEY-001
from: reviewer
to: orchestrator
sequence: 44
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-44: reviewer → orchestrator (cycle 5)

## Context
Cycle-5 independent code review of `KEY-001` at `head_ref`
`8c36740af901c680ee4305fcbb0684222201777d`, dispatched by `.agent/handoffs/KEY-001-41-orchestrator-to-reviewer.md`.
Running on **claude-opus-5** — no reviewer fallback, `review_fallback` stays empty.
Full re-review of `f9426e28..8c36740a`, not a diff spot-check.

Verdict: **APPROVED**, bound to `8c36740af901c680ee4305fcbb0684222201777d`.
Review file: `.agent/reviews/KEY-001-r5.md`.

## Acceptance criteria
All eight — AC-1 … AC-8 — **SATISFIED**, each with evidence in the review file. I drove every AC
directly against the shipped code (40 scenarios) rather than reading the suite's green output.
My cycle-4 finding **F-1 is closed**.

## Relevant files
- `tests/integration/keyboard.test.js` — the only non-`.agent` file changed since `377024ba` (+22 lines, one new `test(...)`, nothing removed or edited)
- `script.js:88-118`, `calculator-core.js:209-241` — the guarantees under review; byte-identical to the cycle-3 head
- `.agent/decisions/D-013-…md` — clause-3 table verified accurate; Consequences section stale (F-1)
- `.agent/units/KEY-001.matrix.md` — no row for any of the four review-driven tests (F-2)
- `README.md:16,18-29` — AC-8, compared key for key with `KEY_MAP`

## Tests created / executed
- created: none (reviewers write no tests)
- executed, in a **scratch git worktree checked out at `8c36740a`** (removed afterwards; `git worktree list` shows only the repo; the repo's `latest-*-final.json` pointers were never rewritten by my runs):
  - `node .agent/tools/run-gate.mjs unit --unit KEY-001` → exit 0, tests 83, pass 83, fail 0, `dirty=false`, `head=8c36740a`
  - `node .agent/tools/run-gate.mjs integration --unit KEY-001` → exit 0, 50/50
  - `node .agent/tools/run-gate.mjs regression --unit KEY-001` → exit 0, 25/25
  - `node .agent/tools/run-gate.mjs lint --unit KEY-001` → exit 0, PASS
  - `node .agent/tools/validate.mjs state` → `state: OK`, exit 0
- compared against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json` (83/83, 50/50, 25/25, PASS, all bound to `8c36740a`): **no discrepancy**.

## Results
- **r4 F-1 closed and independently reproduced.** All three named mutations killed by **exactly one**
  test each — the new `the DEL button reached by Tab and activated by a held Enter deletes exactly once`
  — with the failure signatures I predicted at r4: M29 (`isCalculatorButton` forgets `data-action`)
  actual `'123'`; M27 (branch skips action buttons) actual `'123'`; M31 (repeat guard skips action
  buttons) actual `'0'`; all against expected `'12'`.
- **Mutation probe**: 39 mutations over integration+regression (75 tests), plus one core mutation as a
  reverted file edit in the worktree. 32 of 36 non-equivalent mutants killed. M1/M2/M5/M11 all kill
  strictly more rows than at r4 (4/4/5/2 vs 3/3/4/1). Survivors: M35 and M37 (equals-button carve-outs)
  measured **behaviorally equivalent**; M40 and M36 distinguishable → Nits F-3/F-4; C5 carried Nit F-5.
- **Reproduction warning, confirmed independently**: `script.js` and `calculator-core.js` use **CRLF**
  line endings, so any multi-line `CALC_STUB_TRANSFORM` `find` written with `\n` throws the stub's
  occurrence-count error and cascades into ~65 unrelated failures that look like a code defect. I hit
  this on four probes and corrected them. This matches the tooling error the dispatch reported and is
  worth recording once so the next agent does not rediscover it.
- Scope facts: `git rev-parse HEAD` = `ee66c607` ≠ `head_ref` `8c36740a`; delta is `.agent/`-only.
  `git diff --name-status ae9d7c8..8c36740a -- . ':!.agent'` is **empty**, so `head_ref` (a handoff
  commit) carries the same product and test content as `ae9d7c8` (the commit that added the test).
  No `.only`/`.skip`/`todo:` under `tests/`; no pre-existing test edited or deleted this cycle.

## Decisions made
None (reviewers record no decisions). F-1 asks the `architecture-reviewer`/human to amend `D-013`.

## Known risks
- All real-browser semantics remain `UNVERIFIED` (RK-3): `event.detail` values for pointer vs
  keyboard-synthesized clicks, `preventDefault()` on a repeat `Enter` suppressing browser repeat
  activation, and the `Space` keyup-activation question. The manual checklist in
  `.agent/units/KEY-001.md` (RK-3 items 1-5) is where these close; none can close here.
- **Any new commit invalidates this approval** (CLAUDE.md §11).

## Outstanding issues
Five findings, **none Critical or Major** — `APPROVED` is consistent with them:
- **F-1 Minor** — `.agent/decisions/D-013-…md:122-126`: the clause-3 case-set table (`:69-75`) **is**
  now accurate (I checked all seven rows against code and tests), but Consequences still lists two
  follow-ups that are closed — the held-`Space` cell (closed cycle 3, named in the table two lines
  above) and the `Space` manual-checklist line (now `KEY-001.md:151-153`). Third sub-item of my r4
  F-2, the only one not carried out. Fix: strike those two items.
- **F-2 Minor** — `.agent/units/KEY-001.matrix.md`: none of the **four** review-driven integration
  tests (r2, r3 ×2, r4) has a matrix row; `validate.mjs` cannot catch it (it checks matrix→test only).
  Carried from r4 F-3, now one row worse. Fix: `test-designer` adds four rows.
- **F-3 Nit** — `Tab`→`AC`→`Enter` unpinned: mutant M40 survives 75/75 while rendering `4+8`/`12`
  instead of `0`. This is the "optional second row" my r4 F-1 named. Nit, not Major, because every
  *naturally reachable* mutation in this family is now dead and M40 needs a hand-written single-value
  carve-out.
- **F-4 Nit** — held `Space` on operator/action buttons unpinned (M36 survives; `Tab`→`DEL`→held
  `Space` renders `0` instead of `12`). Already a recorded Known Issue; re-confirmed by measurement.
- **F-5 Nit** (carried r4 F-4) — `mapKey`'s defensive-copy promise unpinned (C5 survives).
- **F-6 Nit** (carried r4 F-5 / r3 F-5 / r1 F-8) — `HEAD` ≠ `head_ref` for the fifth cycle, and
  `head_ref` names a handoff commit rather than the code commit. `.agent/`-only, inert here.

**Answer to the dispatch's question about a sixth cycle**: the `button-type × key × repeat` space is
now covered for every mutation a plausible refactor produces, and I recommend **no sixth test-only
cycle**. If closure by construction is wanted rather than by enumeration, the proportionate structural
change is test-side and is written out in F-3 option (b): replace the four hand-written per-family
rows with one table-driven row over every `button[data-number|data-operator|data-action]` in
`index.html` × `{Enter, Space}` × `{repeat, non-repeat}`, using the existing `spyOnDispatches` count
oracle. That subsumes F-3 and F-4 and ends the per-cycle enumeration. I do **not** recommend `D-013`'s
rejected "take activation over entirely" alternative: it trades a stub-verifiable guarantee for an
unverifiable real-browser one.

## Required next action
Record `review_status: APPROVED`, `review_file: .agent/reviews/KEY-001-r5.md`,
`reviewed_ref: 8c36740af901c680ee4305fcbb0684222201777d`, `review_model: claude-opus-5`,
`review_fallback:` (empty) in `.agent/units/KEY-001.md`, then — once the `security-reviewer` and
`architecture-reviewer` cycle-5 verdicts are in — advance `REVIEW -> INTEGRATION` and run the
authoritative gates on this same SHA. Make no commit before `COMPLETE`; any new commit invalidates
this approval. F-1 and F-2 are Minor and may be carried as Known Issues under the unit's standing
fix-only-Majors policy, or closed without a code change (a `D-013` edit and four matrix rows) if the
orchestrator prefers to clear them before `COMPLETE` — neither requires a new review cycle.
