---
unit: KEY-001
from: architecture-reviewer
to: orchestrator
sequence: 30
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-30: architecture-reviewer → orchestrator (cycle 3)

## Context
Cycle-3 structural review of `KEY-001` at `head_ref`
`fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`, per dispatch
`.agent/handoffs/KEY-001-27-orchestrator-to-architecture-reviewer.md`. Fresh full review, not a
delta: every AC verdict re-derived from evidence gathered at this ref. I am running on Opus
(`claude-opus-5`); the orchestrator's `FALLBACK(opus->sonnet)` does not extend to this review.

The dispatch told me my cycle-2 proposal `D-012` was rejected. I reproduced the rejection myself
(probe M2): with `D-012`'s own proposed gate substituted in memory, a held `Enter` on a focused digit
button still renders `777` and the integration suite goes 46 pass / 1 fail. The rejection is correct,
and `D-012` would additionally have crossed the `D-005` clause-6 layer line. I do not defend it.

Independence: handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24` were not opened. Nothing on disk was
changed except the three files listed under Decisions/Results below; no commit, stash, checkout or
reset; `git status --porcelain` empty before and after; nothing written outside the repository (the
session scratchpad is outside the repo, so all probes ran through `node -e` with no probe file).

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1..AC-8 and its Definition of Done, re-verified from scratch.
All eight `SATISFIED` (structural scope). AC-5 is satisfied with one recorded scope deviation (F-2).
Per-AC evidence is in the review file.

## Relevant files
- `script.js:88-118` — the keydown listener; the 4-line repeat guard at `:98-101` is the change under review
- `tests/integration/keyboard.test.js:407-423` — the new pinning row
- `tests/helpers/dom-stub.js:118-139` — the stub's native-activation model, now load-bearing for shipped behavior
- `.agent/decisions/D-005-layering-rule.md`, `D-011-click-origin-and-focus-policy.md`, `D-012-…md` (rejected)
- `.agent/reviews/KEY-001-arch1.md`, `-arch2.md` — my prior cycles

## Tests created / executed
- created: none (read-only review; no test or product file was modified on disk)
- executed, directly from `.agent/gates.json` rather than through `run-gate.mjs` (the dispatch forbids
  changing files and `run-gate` would rewrite the SHA-bound `latest-*.json` at `head_ref`):
  - `node --test "tests/unit/**/*.test.js"` → 83 pass / 0 fail
  - `node --test "tests/integration/**/*.test.js"` → 47 pass / 0 fail
  - `node --test "tests/regression/**/*.test.js"` → 25 pass / 0 fail
  - `node --check script.js && node --check calculator-core.js` → pass
  - `node .agent/tools/validate.mjs state` → `state: OK`, exit 0
- compared against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`:
  all four carry `head: fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`, `dirty: false`, `exitCode: 0`, and
  counts 83 / 47 / 25 — identical to my own runs.

## Results
**Verdict: APPROVED** for `reviewed_ref` `fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`.
Review file: `.agent/reviews/KEY-001-arch3.md`. No Critical, no Major finding open.

- `git diff fc93ff7a..HEAD -- . ':(exclude).agent'` is empty (HEAD `be19be11`), so the tree I read is
  byte-identical to `head_ref`; the drift is `.agent/`-only.
- The fix diff is 2 files, +28/−0: `script.js` +10 (4 lines of code) and one integration row.
- Dispatch question 1 — **does the fix follow `D-005`?** Yes on every clause. One mutable binding
  still (`let state`, the only `let`/`var` in `script.js`); one `applyInput` call; two `textContent`
  writes, both in `updateDisplay`; zero `.click(` calls in code; `event.repeat` read straight off the
  event, no adapter-held press history. It adds no path into `dispatch` — it removes one the browser
  was driving.
- Mutation probes (in memory via `CALC_STUB_TRANSFORM`, nothing written to disk): guard deleted →
  1 fail; `D-012`'s gate → 1 fail; `preventDefault()` dropped → 1 fail. The new row is discriminating
  in three independent directions and the `preventDefault()` is load-bearing.
- Behavioral probes: held `Enter` on a focused digit → `7` (was `777`); held `Enter` on a focused `=`
  → 1 display write then 0 (was 1 then 2); single `Enter` then single `Space` on a focused `7` → `77`,
  so two physical presses still give two actions; mouse-click `4` then `+ 8 Enter` → `4+8` / `12` with
  focus dropped (`D-011`/OQ-3 intact); held digit on the document → `555` (OQ-4 intact).
- AC-7 is now satisfied **by policy, not by coincidence**: the idempotence invariant my cycle-2 review
  leaned on is no longer load-bearing, which removes the trap `D-012` predicted for a future
  "repeated `=` re-applies the last operation".

## Decisions made
- Proposed decision record written: `.agent/decisions/D-013-native-activation-is-the-browser-channel.md`,
  `status: proposed` (needs your or the user's acceptance; supersedes the rejected `D-012`).
  It documents shipped behavior — **no code change, no new commit, no effect on the SHA-bound
  evidence**. What it protects against that the fix does not: the rule currently lives only in a code
  comment whose sole referent is a *rejected* record, and the two natural "simplifications" of this
  branch are both wrong — one of them (narrowing the guard to `Enter`) the suite does not catch at
  all. The record states the positive rule, the closed 5-row case table with pinning status, the
  AC-5/OQ-2 scope qualification, and both refuted alternatives with the probes that refute them.

## Known risks
- **F-1 (Minor)** — the `Space` half of the guard is unpinned: narrowing it to `event.key === 'Enter'`
  leaves the suite **47/47 green** while held `Space` on a focused digit button regresses to `777`.
  Compounding this, the stub models native activation on *keydown* for both keys, whereas a real
  browser activates a button on `Space` **keyup** — so in a browser the guard is probably a no-op for
  `Space`, but in the unlucky case (a browser that treats a cancelled repeat keydown as disarming the
  pending activation) a held `Space` on a focused button could produce **zero** actions instead of
  one. `UNVERIFIED` (RK-3). Fix: one integration row (~16 lines) + one manual-checklist line. Do
  **not** narrow the guard to `Enter` on the stub's word alone.
- **F-2 (Minor)** — AC-5/OQ-2 ("`preventDefault()` only for mapped keys…") now has an unstated
  exception: a repeat `Space` on a focused calculator button *is* `preventDefault()`ed. Defensible and
  harmless (no browser shortcut is bound there; `Tab` and the modifier rows are unchanged and green),
  but stated only in a code comment. `README.md:29` is marginally over-broad for the same reason.
  Resolution is prose (`D-013` §4), not code.
- **F-3 (Minor)** — traceability: neither of this unit's two defect-fix pinning tests has a matrix row
  (extends the still-open `arch2` F-2), and `.agent/units/KEY-001.matrix.md:188` is now stale — it
  says no scenario calls `preventDefault()` on a focused-button `Enter`/`Space`, which production now
  does. ≈4 lines in the test-designer's file.
- **F-4 (Nit)** — `if (event.repeat)` fails open on a missing `repeat` and `page.dispatch` does not
  default it, so a future held-key row that forgets `repeat: true` passes vacuously. Same fix site as
  the still-open `arch2` F-3 (`detail`). Test-double hardening only; production is safe.
- Structural judgement the dispatch asked for: two defects in one branch across two cycles is a
  **real but localized** weakness, not a decomposition error. The adapter has one dispatch seam but
  three entrants, and for the browser-driven entrant its only levers are negative (early `return`,
  `preventDefault`), so cross-channel policies must be re-expressed in negative form in one branch
  that states no case set. Both defects have the identical shape "we forgot to say no to the browser
  in case X". Proportionate response: write the closed case set down (`D-013` §3) and pin the two open
  cells — **not** a restructure. I explicitly considered and rejected taking activation over entirely
  (cleanest structurally, but it discards the browser's real activation semantics AC-6 exists to
  preserve, and its failure mode is silent divergence we cannot test here); reasoning and cost/benefit
  are in the review.

## Outstanding issues
- `D-013` needs acceptance or rejection by you or the user. If accepted as written it changes no code
  and no gate evidence.
- F-1..F-4 are all Minor/Nit and none blocks `APPROVED`. Consistent with the fix-only-Majors policy
  already applied twice in this unit, they can be carried as Known Issues; if the user prefers, F-1's
  single integration row is the only one with any behavioral value and would cost a new commit plus a
  gate 4–8 re-run.
- Unverifiable and needing the user's manual browser pass (RK-3): that held `Enter` really
  repeat-activates a focused button as the stub models; **new** — that held `Space` on a
  `Tab`-focused button still acts **once, not zero times**; the `detail === 0` / `detail >= 1`
  premise of `D-011`; that `preventDefault()` on repeats does not disturb an IME or assistive
  technology.

## Required next action
Record the architecture verdict `APPROVED` at `reviewed_ref` `fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`
in `.agent/units/KEY-001.md`, and accept or reject `.agent/decisions/D-013-native-activation-is-the-browser-channel.md`
(`status: proposed`), logging the choice — then continue gate 5 with the other cycle-3 verdicts.
