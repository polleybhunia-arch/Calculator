---
unit: KEY-001
from: security-reviewer
to: orchestrator
sequence: 29
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-29: security-reviewer → orchestrator (cycle 3)

## Context
Fresh, full security review of `f9426e28..fc93ff7a` (not a delta), per dispatch `KEY-001-26`.
Running on **claude-opus-5** — no fallback, no `review_fallback`, no REDUCED ASSURANCE from my side.
Verdict: **APPROVED**, bound to `reviewed_ref: fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`.
Review file: `.agent/reviews/KEY-001-sec3.md`.
Handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24` were not opened. I changed no file on disk except
this handoff and the review file; no commit, stash, checkout or reset; nothing written outside the
repository.

Ref note: `git rev-parse HEAD` is `be19be11`, one commit ahead of `head_ref`;
`git diff fc93ff7a..HEAD --name-status` lists `.agent/` paths only and `git status --porcelain` is
empty, so the tree executed is byte-identical to `head_ref` for every shipped and test file.

## Acceptance criteria
Only the security-relevant ACs named in the dispatch were judged (AC-2/3/4/7/8 remain the code
reviewer's):
- AC-1: SATISFIED
- AC-5: SATISFIED
- AC-6: SATISFIED (security aspect)

## Relevant files
- `script.js:88-118` — the keydown listener; the cycle-3 change is `script.js:98-101`
- `calculator-core.js:187-243` — `isInput`, `KEY_MAP`/`mapKey`, `allowsRepeat`
- `.agent/decisions/D-012-native-activation-and-repeat-policy.md` (rejected) — read as context
- `.agent/reviews/KEY-001-sec3.md` — this verdict

## Tests created / executed
- created: none (reviewers write no tests)
- executed: `node --test "tests/unit/*.test.js"` → 83 pass / 0 fail
- executed: `node --test "tests/integration/*.test.js"` → 47 pass / 0 fail
- executed: `node --test "tests/regression/*.test.js"` → 25 pass / 0 fail
- read: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`
  (83 / 47 / 25 / `node --check` exit 0, `fail: 0`, `head: fc93ff7a…`, `dirty: false`)
- 12 mutation probes and 4 hostile-input probe families run in memory via the stub's
  `CALC_STUB_TRANSFORM` / stdin scripts; nothing on disk modified. I deliberately did **not** run
  `run-gate.mjs`: it would rebind machine evidence to a different HEAD and overwrite files a
  reviewer does not own.

## Results
No exploitable weakness at this ref. The cycle-3 change (4 code lines) reads a boolean the listener
already consumed two lines below and cancels a browser default; it creates no new data flow, no new
sink, no new dependency and no new data-exposure surface, and it strictly reduces the number of
`dispatch()` calls per physical key press (it also removes the unbounded-operand path that existed
at `5678cc1b`: 5 000 repeats on a focused digit button gave `5 000` characters there, `1` here).
`preventDefault()` scope re-measured across 23 mapped keys, 24 unmapped keys, 282 modifier
combinations, both repeat states and both target kinds: **0 anomalies**; `Tab` never prevented; a
single non-repeat `Enter`/`Space` on a focused button still left to the browser. Reverting the fix
fails exactly 1 integration test; the 9 pre-existing security mutation probes all still bite.
Input→sink trace ends at `textContent` only; zero dependencies, zero secrets, zero network/storage.

## Decisions made
- none (no decision record proposed; D-012 remains rejected and its rejection is consistent with the
  code at this head)

## Known risks
- F-7 (new, Nit, functional/a11y not security): whether a real engine's pending `Space` activation
  survives a `preventDefault()` on an intermediate repeat keydown is engine-internal and
  UNVERIFIED here. Worst case is **one action becoming zero** on a held `Space`, never two, never an
  allowlist bypass. Manual checklist item to add: `Tab` to a button, hold `Space`, release → expect
  exactly one action; then hold `Enter` on the same button → expect exactly one action.
- F-6 (new, Nit): the guard is reached through the tag-agnostic `isCalculatorButton()`, so it
  slightly widens F-1's denial-of-function surface (a held `Enter`/`Space` on an injected non-button
  element carrying `data-*` is now also suppressed). The F-1 fix closes it; same precondition
  (markup injection ⇒ script control already).
- F-1…F-5 carried from cycles 1–2, each re-verified as still accurate at this head; all Nit.
- RK-3 stands: no real browser. Also UNVERIFIED — real `detail` values for pointer vs native
  activation, real OS auto-repeat semantics, `preventDefault()` on `Escape`/`/`.
- BOOT-001-sec1 F-4 (`CALC_STUB_TRANSFORM` absent from gate evidence) remains open and is a human
  decision on `run-gate.mjs`.

## Outstanding issues
- None blocking. No Critical or Major finding is open; nothing in this review requires a code change
  before `COMPLETE`.

## Required next action
Record `security_review: APPROVED` for `reviewed_ref fc93ff7a519f5e8ad8674068e6d9dd5a816b875f` with
`review_model: claude-opus-5` (no fallback), carry F-1…F-7 as Nit known issues, and add the F-7
held-`Space`/held-`Enter` item to the user's manual browser checklist.
