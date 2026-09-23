---
unit: KEY-001
from: reviewer
to: orchestrator
sequence: 12
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-12: reviewer → orchestrator

## Context
Independent code review (gate 5, cycle 1) of `KEY-001` at `head_ref`
`ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`, base `f9426e284219f49816abad088275d219c72bdd81`.
Review file: `.agent/reviews/KEY-001-r1.md`. Verdict **CHANGES_REQUIRED**.
I am running on Opus (`claude-opus-5`) — no review fallback, full assurance.
I did not read handoffs `-04`, `-06`, `-08`, nor the peer security/architecture reviews or the
untracked `D-011` that appeared mid-review.

**Repo-state fact**: `git rev-parse HEAD` is `ffa4aed6d391adb210b9d0a98c6150864d5ccfbc`, not
`head_ref`. `git diff --name-status ab4b5d1d..HEAD -- . ':!.agent'` is empty, so the reviewed
content is byte-identical to `head_ref` and the review is bound to `ab4b5d1d`. Recorded as F-8.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1…AC-8. Verdicts (full evidence in the review file):
AC-1 SATISFIED · AC-2 SATISFIED · AC-3 SATISFIED · AC-4 SATISFIED · AC-5 SATISFIED ·
**AC-6 NOT_SATISFIED** · AC-7 SATISFIED · AC-8 SATISFIED.

## Relevant files
- `.agent/reviews/KEY-001-r1.md` — the review, per-AC lines, 8 findings
- `script.js:76` — F-2 (blur on every click, incl. native keyboard activation)
- `tests/integration/keyboard.test.js:230-236` — F-1 (the AC-6 blur row is vacuous)
- `tests/helpers/source-scan.js:22,53,123` — F-4/F-5 (scan blind spots)

## Tests created / executed
- created: none (reviewer writes no code or tests)
- executed (commands verbatim from `.agent/gates.json`, on the reviewed content):
  `node --test "tests/unit/**/*.test.js"` → 83/83; `node --test "tests/integration/**/*.test.js"`
  → 46/46; `node --test "tests/regression/**/*.test.js"` → 25/25;
  `node --check script.js && node --check calculator-core.js` → exit 0;
  `node .agent/tools/validate.mjs state` → `state: OK`.
- cross-checked against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`
  (`head=ab4b5d1d21…`, `dirty=false`, `exitCode=0`, counts 83/46/25, no `CALC_STUB_TRANSFORM`
  trace in any `outputTail`) — they agree field by field.
- **`run-gate.mjs` was deliberately not re-run**: with HEAD ≠ `head_ref` it would overwrite the
  SHA-bound `latest-*-final.json` with `ffa4aed6`-bound files, and the dispatch forbade disk
  changes. Recorder-bound authoritative runs remain the orchestrator's step.

## Results
- 51/51 matrix-named rows exist verbatim in the four touched test files; no `.only`/`.skip`/`.todo`.
- 8 mutation probes, all in memory (`CALC_STUB_TRANSFORM` / `loadPage({transform})`), nothing
  written to disk: 7 killed (key map `x` alias, repeat policy, `isInput` operator half, `isInput`
  action half, `Enter`/`Space` guard, `preventDefault`, modifier guard);
  **1 survived — removing `event.target.blur();` leaves integration 46/46 and regression 25/25 green.**
- GUARD "before"/"after" re-derived independently: base `script.js` (no keydown, no blur) under the
  extended stub replays 9/9 README click sequences correctly; "after" is the green regression run.
- D-009 widened scan probed for real bite: injected `onclick="eval(x)"`, `innerHTML=`,
  `document.write`, `<meta content="//host">` are all caught; `style="…url(//host)"` is not (F-5).
  `stripComments` keeps a same-line `eval(` after an assignment-position regex but still loses it
  after `return`/`typeof` (F-4).
- Working tree unchanged by this review apart from my two files (`git status --short` shows no
  tracked modification).

## Decisions made
None (reviewer decides nothing). Judgments requested by the dispatch:
- The `blur()`-on-every-click reading of AC-6 is **not** acceptable as-is: it contradicts OQ-3's
  "mouse-initiated clicks only", and a real browser *can* distinguish the two (`event.detail === 0`
  for keyboard activation). Probed on the shipped code: focus is `null` after a native `Enter`
  activation, so keyboard users lose their `Tab` position (F-2).
- Carried-forward items 1, 2, 3, 4, 7 re-checked by re-derivation: 1 and 4 are genuinely closed
  (mutation-killed); 7 is closed (`tests/helpers/core-input.js` used, the two old unit files
  untouched); 2 and 3 are only partly closed (F-5, F-4).
- Carried-forward item 5 (`CALC_STUB_TRANSFORM` not in gate evidence) is acceptable to leave open
  as a known issue, with the note that a mutated run does leave a `CALC_STUB_TRANSFORM active`
  warning in the recorded `outputTail` (stderr is appended last by `run-gate.mjs`).

## Known risks
- F-2's fix interacts with AC-7: if the button keeps focus after a native activation, a held
  `Enter` repeats through the browser's own activation and bypasses `allowsRepeat` (today the
  unconditional blur hides this). The fix must add a row for it.
- Real-browser behavior (focus rings, `Tab` order, OS auto-repeat, `Space` activating on keyup,
  `file://`) stays UNVERIFIED — manual pass by the user.

## Outstanding issues
Open findings blocking approval: **F-1 (Major)** AC-6 blur row is vacuous — mutant survives;
**F-2 (Major)** blur fires for keyboard-initiated clicks, contrary to OQ-3/AC-6.
Non-blocking: F-3, F-4, F-5, F-8 (Minor), F-6, F-7 (Nit).

## Required next action
Return `KEY-001` to `IN_PROGRESS` (`CHANGES_REQUIRED`) and dispatch the implementer to address F-1
and F-2 (and, at your discretion, F-3…F-7), with a test-designer pass for the new/changed matrix
rows F-1/F-2/F-3 require; if the user prefers to keep always-blur, that needs a recorded decision
plus an AC-6/OQ-3 and README update instead. Then re-run gates 4/6/7 through `run-gate.mjs` on the
new committed head and open review cycle 2 against that head.
