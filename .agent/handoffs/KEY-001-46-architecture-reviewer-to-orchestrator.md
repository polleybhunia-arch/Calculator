---
unit: KEY-001
from: architecture-reviewer
to: orchestrator
sequence: 46
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-46: architecture-reviewer → orchestrator (cycle 5)

## Context
Full fresh structural review at `head_ref` `8c36740af901c680ee4305fcbb0684222201777d`, per dispatch
`KEY-001-43`. Verdict **APPROVED**, review file `.agent/reviews/KEY-001-arch5.md` (`cycle: 5`,
`reviewed_ref: 8c36740af901c680ee4305fcbb0684222201777d`).

I am running on Opus (`claude-opus-5`); the orchestrator's `FALLBACK(opus->sonnet)` does not extend
to this review, which is full assurance. I did not open handoffs `KEY-001-04`, `-06`, `-08`, `-16`,
`-24`, `-32`, `-40`. I changed no file on disk except this handoff and the review file; every gate
command was run directly (not through `run-gate.mjs`, which would rewrite the SHA-bound evidence) and
every mutation probe ran in memory via `CALC_STUB_TRANSFORM`. `git status --porcelain` was empty
before and after.

Verified deltas: `git diff --name-status 377024ba..8c36740a -- . ':(exclude).agent'` is one line,
`M tests/integration/keyboard.test.js` (+19/−0); `git diff --stat fc93ff7a..8c36740a` over
`script.js`, `calculator-core.js`, `index.html`, `style.css`, `tests/helpers/dom-stub.js` is **empty**
— no product file has changed in three cycles. `git diff 8c36740a..HEAD -- . ':(exclude).agent'` is
empty (drift is `.agent`-only, HEAD `ee66c607`).

## Acceptance criteria
AC-1..AC-8 all **SATISFIED** (structural scope; per-AC evidence in the review file). AC-6 is the one
the dispatch asked about: every row of `D-013` clause 3's table is accurate as written, each
pinning claim names a test that exists, passes and dies to a targeted mutation, and the declared gap
(operator/action buttons under `Space`) is real and correctly declared.

## Relevant files
- `.agent/reviews/KEY-001-arch5.md` — the verdict, findings, probes, proposed `D-013` clause 5
- `tests/integration/keyboard.test.js:465` — the only changed file, the new DEL row
- `script.js:88-118` — the guard under review, byte-identical to `fc93ff7a`
- `.agent/decisions/D-013-native-activation-is-the-browser-channel.md:73, 122-124` — F-1, F-3 locations
- `.agent/units/KEY-001.matrix.md:87-90, 188` — F-2 location

## Tests created / executed
- created: none (reviewers write no tests)
- executed (directly, not via `run-gate`): `node --test "tests/unit/**/*.test.js"` 83/0;
  `node --test "tests/integration/**/*.test.js"` 50/0; `node --test "tests/regression/**/*.test.js"`
  25/0; `node --check` on both shipped scripts; `node .agent/tools/validate.mjs state` → `state: OK`,
  exit 0
- cross-checked against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`:
  all carry `head: 8c36740af901c680ee4305fcbb0684222201777d`, `dirty: false`, counts 83 / 50 / 25 /
  lint-pass — matching my independent runs exactly

## Results
Nine in-memory mutation probes (full table in the review). The two mutants `r4` F-1 named as
surviving the cycle-4 suite now die, each killing **exactly** the new DEL row: M6 (`isCalculatorButton`
drops `data-action`) 49/1, M7 (repeat guard exempts action buttons) 49/1 — both were 49/49 green at
`377024ba`. M1 and M3 now fail 4 rows each (was 3). M5 (the `D-012`-shaped digit-only narrowing) fails
2. M4 (Enter-only narrowing) fails exactly the held-`Space` digit row. M9 (over-suppression: first
press suppressed too) fails 8 rows, so "acts once" is pinned against zero-action as well as
many-action. M8 — `Space` repeats suppressed only for digit buttons — **survives 50/50**, reproducing
the gap `D-013` declares.

Structural audits re-run: core purity holds (`calculator-core.js` loads in bare Node with
`document`/`window` `undefined`, exports unchanged); one mutable binding in `script.js`
(`let state`), no repeat/last-key bookkeeping smuggled in; one `applyInput` call, two `textContent`
writes both inside `updateDisplay`, zero `.click(` in code; zero dependencies, zero `type="module"`,
no build step, `file://` unaffected.

## Decisions made
No new decision record. The lasting choice (where this case set stops being tested) belongs in
`D-013`, which owns the case set; a `D-014` would recreate the indirection `arch4` F-1 objected to.
I propose instead an amendment to `D-013` as **clause 5, "Coverage basis: axis-complete, not
cell-complete"** — full proposed text in the review file's "Proposed decision" section, with the three
rejected alternatives and their cost/benefit. Documentation only: no code, no product commit, no gate
impact.

## Known risks
- All real-browser statements remain `UNVERIFIED` (RK-3): repeat native activation, `Space`-on-keyup
  activation and how a browser treats a cancelled repeat keydown, and `event.detail` origin
  discrimination. The manual checklist `KEY-001.md:146-154` is the only instrument that closes these;
  item 4 already states the "not zero times" expectation correctly.
- OS auto-repeat timing, focus-ring/screen-reader effects of a suppressed repeat, and post-`blur()`
  sequential focus navigation are not observable in the stub.

## Outstanding issues
No Critical, no Major, nothing blocking. Four findings, all documentation-only:
- **F-1 (Minor)** `D-013:122-124` — the cycle-4 correction reached clause 3's table but not the
  Consequences section, which still lists the held-`Space` cell (closed at `c0e1281e`, refuted by
  probe M4) as an open follow-up and says "two" missing matrix rows where there are now four. Fix:
  ≈2 lines of prose, in place.
- **F-2 (Minor)** `KEY-001.matrix.md` — `arch3` F-3 / `arch4` F-2 widened again, 3 → 4: none of the
  four native-activation-repeat tests from cycles 2–4 has a matrix row, and line 188's note is now
  false of four shipped rows. `validate.mjs state` cannot catch this (it checks row → test, not the
  converse). Fix: ≈6 lines in the test-designer's file, this unit or the next touching AC-6/AC-7.
- **F-3 (Nit)** `D-013:73` and front matter — row 5's target reads "digit button" while citing the
  equals-`Space` test (row 1 says "digit / equals"); and the record carries no amendment trail though
  it has been corrected in place twice since acceptance.
- **F-4 (Nit, carried from `arch4` F-3, unchanged)** `script.js:95` — the guard's comment still cites
  only the rejected `D-012`. **Do not fix now**: a product commit would invalidate the SHA-bound
  evidence at `8c36740a` and restart gates 4–8 for a comment. Fold into `KEY-002`.

On the dispatch's second question: **the known-issue framing is sound and this should be the last
structural cycle for this area.** The guard has two independent axes (key; target button family) and
the suite now discriminates each independently; the only mutant that survives is one no plausible
simplification would produce (M8 special-cases key *and* family at once); and extra `Space` rows would
strengthen confidence in the stub's keydown-activation fiction rather than in the browser, where the
real question stays open regardless. Recommendation: apply the F-1/F-2/F-3 documentation pass plus
the proposed `D-013` clause 5, then proceed — clause 5 is what converts "stopped finding cells" into a
stated stopping rule so a sixth cycle is not invited.

## Required next action
Record verdict `APPROVED` for `reviewed_ref` `8c36740af901c680ee4305fcbb0684222201777d` from
`.agent/reviews/KEY-001-arch5.md`, and — without any product commit — apply the documentation pass
(F-1, F-3 in `D-013`, F-2 in `KEY-001.matrix.md`, plus `D-013` clause 5 as proposed in the review) or
record each as a carried Known Issue in `.agent/units/KEY-001.md`, so that the next gate step runs
against a decision trail that matches the shipped suite.
