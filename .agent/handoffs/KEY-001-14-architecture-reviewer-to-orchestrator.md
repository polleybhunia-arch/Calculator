---
unit: KEY-001
from: architecture-reviewer
to: orchestrator
sequence: 14
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-14: architecture-reviewer → orchestrator

## Context
Structural review of `KEY-001` (T2, CLAUDE.md §8) against `D-005`'s layering rule, the `D-003`
addendum, and the zero-dependency / classic-script / `file://` constraints. Verdict
**CHANGES_REQUIRED**, one Major finding.

`reviewed_ref` = `ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`. Current `HEAD` is
`ffa4aed6d391adb210b9d0a98c6150864d5ccfbc`; `git diff ab4b5d1..HEAD` touches `.agent/` only, so the
working tree I read is byte-identical to `head_ref` for every product and test file. I changed no
file outside the three named below and touched no git state (`git status --porcelain` empty before
and after).

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1…AC-8; structural verdicts per AC are in the review file. AC-6 is
`NOT_SATISFIED` (its focus half); AC-1…AC-5 and AC-7 `SATISFIED` on structural evidence; AC-8 out of
scope for this review.

## Relevant files
- `.agent/reviews/KEY-001-arch1.md` — the review (verdict, per-AC lines, findings F-1…F-5)
- `.agent/decisions/D-011-click-origin-and-focus-policy.md` — proposed, `status: proposed`, needs a
  user decision between options A/B/C
- `calculator-core.js`, `script.js` — reviewed; `index.html` unchanged by the unit
- `tests/unit/key-map.test.js`, `tests/integration/keyboard.test.js`, `tests/helpers/dom-stub.js`,
  `tests/helpers/source-scan.js` — reviewed for seams and for the carried-forward conditions

## Tests created / executed
- created: none (read-only review)
- executed (gate commands from `.agent/gates.json`, run directly, **not** via `run-gate.mjs`,
  because the dispatch forbade changing any file and `run-gate` rewrites the `latest-*.json`
  evidence): `node --test "tests/unit/**/*.test.js"` 83/83; `node --test
  "tests/integration/**/*.test.js"` 46/46; `node --test "tests/regression/**/*.test.js"` 25/25;
  `node --check script.js && node --check calculator-core.js` pass. Counts match
  `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`.

## Results
- `D-005` clauses 1, 2, 3, 4, 6 **held**; clause 5 held **and verified by diff** (the three value
  tables were deleted from `script.js`; `KEY_MAP` is derived from the core's own
  `NUMBER_CHARACTERS`/`OPERATORS`, so the third consumer cannot drift) — `BOOT-001-arch1` F-2
  closed. Clause 7 not exercised, and the structure supports `KEY-002` without rework.
- `BOOT-001-arch1` F-1 closed: probes confirm an inline `onclick="eval(x)"` and a protocol-relative
  `//host` in `index.html` now fail the scan. Residual nit F-5: inline `<script>import …</script>`
  in the markup is still unscanned.
- **F-1 (Major, blocking)** `script.js:74-76`: `blur()` runs on every click, including the click a
  browser synthesizes for native `Enter`/`Space` activation. Probe: after
  `buttonFor('7').focus()` + `keydown{key:'Enter'}` the display is right (one action) but
  `document.activeElement` is `null`. This contradicts the user's OQ-3 resolution ("mouse-initiated
  clicks only … a `Tab`-then-`Enter`/`Space` activation is unaffected") and AC-6's "keyboard-only
  users keep standard button activation"; it is untested, undocumented and unrecorded. The stub
  *does* expose the consequence (`activeElement`); it only lacks a click-origin signal, which is
  ~4 lines to add.
- F-2…F-4 Minor, F-5 Nit, none blocking: dataset-triple duplication in `script.js`;
  `allowsRepeat` has no stated descriptor domain (`allowsRepeat(null)` throws a raw engine
  `TypeError`, `allowsRepeat({})` answers `false`); the integration write-count spy rests on an
  unpinned invariant ("`updateDisplay` writes unconditionally", true today — probe) that a future
  conditional-write optimization would turn into false passes.
- The write-count spy itself is a **reasonable** adaptation, not a missing production seam: it
  observes the rendered output, the surface `D-005` clause 7 already designates. No production hook
  is requested.

## Decisions made
- `D-011` proposed (`status: proposed`): focus/blur policy must key off the activating channel as
  reported by the event. Option A (`event.detail > 0`, ≈8 lines) recommended; option B (prevent
  focus on `mousedown`) cleaner in production but touches the stub's `click()` primitive that every
  existing integration row uses; option C (accept the simplification) is available **only as a user
  decision**, since it overrides OQ-3, and then requires README + Known Issues + `UNVERIFIED`
  entries. Rejected: an adapter-held "last pointer event" flag (second mutable binding, against
  `D-005` clause 2), `pointerType`/`pointerdown` (more stub surface for the same fact), moving focus
  policy into the core (`D-005` already rejected DOM concerns in the core), and pinning the current
  behavior with a test (freezes a contradicted decision).
- I agree with the `D-003` addendum as written, including `isInput(descriptor)` over an exported
  value set (it blocks cross-type confusion and reuses `applyInput`'s own tables); one amendment
  requested, F-3.

## Known risks
- Real-browser semantics stay `UNVERIFIED` (RK-3): that native activation yields `detail === 0`,
  real auto-repeat sets `event.repeat`, and `preventDefault()` on the mapped keys is safe for IMEs
  and assistive tech. A manual pass is still required whichever option is chosen.
- Any remedy needs a new commit, so gate and review evidence must be re-run from gate 4 on the new
  head (CLAUDE.md §11), including the two reviews already dispatched.

## Outstanding issues
- F-1 open (blocking). F-2, F-3, F-4 open (non-blocking, this unit or a follow-up). F-5 for
  whichever unit next touches the scan.

## Required next action
Put `D-011`'s option A/B/C choice to the user (option C is a requirement change only they can make),
then dispatch the chosen remedy for F-1 to `implementer` (option A or B) or to `documenter` +
orchestrator state updates (option C), and re-run the SHA-bound gates and all three reviews on the
new head.
