---
unit: KEY-001
from: architecture-reviewer
to: orchestrator
sequence: 22
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-22: architecture-reviewer → orchestrator (cycle 2)

## Context
Fresh, full structural review at `head_ref` `5678cc1b70f39af6859c980a8520bb858418a140`, per dispatch
`.agent/handoffs/KEY-001-19-orchestrator-to-architecture-reviewer.md`. Verdict **`APPROVED`**;
review file `.agent/reviews/KEY-001-arch2.md`.

I am running on Opus (`claude-opus-5`), so this is a full-assurance Opus review — the orchestrator's
`FALLBACK(opus->sonnet)` does not extend to it and no `review_fallback` applies.

Ref note: `git rev-parse HEAD` is `6d31d7fe`, but `git diff 5678cc1b..HEAD -- . ':(exclude).agent'`
is empty, so the files I read are byte-identical to `head_ref`. I read no implementer handoff
(`KEY-001-04`, `-06`, `-08`, `-16` untouched). No file on disk was changed except the three I own
(review, proposed decision, this handoff); `git status --porcelain` was empty before and after every
command; mutation probes ran in memory through the stub's `CALC_STUB_TRANSFORM` hook.

## Acceptance criteria
Re-derived from scratch at this ref (full text in the review):
AC-1 SATISFIED · AC-2 SATISFIED · AC-3 SATISFIED · AC-4 SATISFIED · AC-5 SATISFIED ·
**AC-6 SATISFIED** (was NOT_SATISFIED at `ab4b5d1d`) · AC-7 SATISFIED (see F-1 caveat) ·
AC-8 SATISFIED as a structural check only (README:29 was contradicted at `ab4b5d1d`, accurate now).

## Relevant files
- `script.js:67-83` — the `event.detail > 0` blur gate (the fix under review)
- `tests/helpers/dom-stub.js:118-141, 532-554` — `detail: 0` on synthesized activation, `detail: 1` on `page.click()`
- `tests/integration/keyboard.test.js:230-257` — the corrected AC-6 row
- `.agent/reviews/KEY-001-arch2.md` — this verdict
- `.agent/decisions/D-012-native-activation-and-repeat-policy.md` — proposed, `status: proposed`, needs a user decision

## Tests created / executed
- created: none (reviewers write no tests)
- executed (gate commands from `.agent/gates.json`, run directly, **not** through `run-gate.mjs`, so
  no evidence file was rewritten; counts compared against the existing SHA-bound evidence):
  - `node --test "tests/unit/**/*.test.js"` → 83/83 (matches `.agent/test-results/KEY-001/latest-unit-final.json`, commit `5678cc1b`)
  - `node --test "tests/integration/**/*.test.js"` → 46/46 (matches `latest-integration-final.json`)
  - `node --test "tests/regression/**/*.test.js"` → 25/25 (matches `latest-regression-final.json`)
  - `node --check script.js && node --check calculator-core.js` → pass (matches `latest-lint-final.json`)
  - `node .agent/tools/validate.mjs state` → `state: OK`, exit 0 (read-only)

## Results
1. **The fix implements `D-011`'s rule literally.** Origin is read off the event (`script.js:80`),
   not inferred: `grep` for module-level mutable bindings in `script.js` returns exactly one line,
   `12: let state = createState();` — no "last pointer event" variable, so `D-005` clause 2 holds.
   Cost matched the estimate: 3 lines of shipped code + 1 line of stub behavior, no new boundary, no
   new state, no new export; `index.html` and `calculator-core.js` are not in the diff.
2. **The corrected test is discriminating, not merely passing.** Four in-memory mutation probes each
   kill exactly that row: gate removed (blur always), blur deleted, gate inverted (`=== 0`), gate
   loosened (`>= 0`). Both halves are independently asserted, and the mouse half fails twice over
   (focus assertion *and* the `4+84` display). Limitation stated in the review: no behavioral test
   can distinguish "reads `event.detail`" from an equivalent inference — that half of the rule is
   enforced by reading the code, which is why I ran the binding audit.
3. **Held-`Enter` gap: acceptable residual, recorded — not a blocker.** Measured: `5 + 5`, focus `=`,
   `Enter` ×3 (one press + two repeats) → 3 dispatches, but display/state unchanged, because every
   non-repeatable input is idempotent in the state that follows it (`equals` with `operator === null`
   returns the same state; a same-symbol operator swap is a no-op). Zero observable defect today; the
   structural cost is that AC-7 now rests on that idempotence rather than on the policy. Recorded as
   proposed `D-012` with the invariant, the trigger for revisiting (a future "repeated `=` re-applies
   the last operation"), and the ~5-line fix (`preventDefault()` the disallowed repeat inside the
   existing `keydown` guard).
4. Constraints re-verified: zero dependencies, classic scripts only, no build step, `file://` intact.

## Decisions made
- Verdict `APPROVED`: no Critical, no Major finding open; every AC `SATISFIED`.
- Proposed `.agent/decisions/D-012-native-activation-and-repeat-policy.md` (`status: proposed`) —
  accept the held-`Enter` gap as a documented residual with its invariant named. **Needs the user**;
  it does not block `COMPLETE` (it records an acceptance, not a code change).
- Cycle-1 Minor/Nits (`arch1` F-2..F-5) re-verified as unchanged and **not** re-raised: they are open
  by the user's 2026-09-22 deferral and correctly carried in the unit's Known Issues.

## Known risks
- `UNVERIFIED` (RK-3, needs the user's manual browser pass): that a native activation really reports
  `detail === 0` and a pointer click `detail >= 1`; that held `Enter` on a `Tab`-focused button
  behaves as the stub models it; that a programmatic `blur()` does not reset the browser's sequential
  focus-navigation starting point (an inherent cost of the chosen Option A — suggested manual checks:
  Tab to `=` and hold `Enter`; click a button then press `Tab`).
- F-2 (Minor, traceability): the focus-retention behavior `D-011` exists for has no row of its own in
  `.agent/units/KEY-001.matrix.md`; it is asserted inside the row named for the mouse-click half.
  One matrix row + a test split (≈4 lines) fixes it — a test-designer file, hence your call on
  whether to do it in this unit or the next one touching AC-6.
- F-3, F-4 (Nits): `page.dispatch('click', target)` sends no `detail`, so such a click reads as
  keyboard origin (no test uses it today); the AC-6 row asserts `activeElement === null`, a stub
  artifact (a real browser focuses `<body>`), while the next line hedges against exactly that.

## Outstanding issues
- None blocking. Three non-blocking findings (F-2 Minor, F-3/F-4 Nits) and proposed `D-012` await
  your disposition — as Known Issues, as a matrix amendment, or as follow-up units.

## Required next action
Record the `APPROVED` architecture verdict for `reviewed_ref` `5678cc1b70f39af6859c980a8520bb858418a140`
in `.agent/units/KEY-001.md` (Log + review fields), put `D-012` and findings F-2/F-3/F-4 to the user
for disposition, and — since no commit may occur between `APPROVED` and `COMPLETE` — fold any accepted
Known-Issue text into the same `.agent/`-only update rather than a new code commit.
