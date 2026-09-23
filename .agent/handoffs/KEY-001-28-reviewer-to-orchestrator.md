---
unit: KEY-001
from: reviewer
to: orchestrator
sequence: 28
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-28: reviewer → orchestrator (cycle 3)

## Context
Full re-review (not a diff spot-check) of
`f9426e284219f49816abad088275d219c72bdd81..fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`, cycle 3,
after the held-Enter fix. Running on **claude-opus-5** — no reviewer fallback.

Verdict: **CHANGES_REQUIRED**. Review file: `.agent/reviews/KEY-001-r3.md`
(`reviewed_ref: fc93ff7a519f5e8ad8674068e6d9dd5a816b875f`).

No behavioral defect found. The cycle-3 fix is correct in every scenario I could construct. Both
blocking findings are **test-only**; neither requires a product change.

Scope caveat: `git rev-parse HEAD` = `be19be115dcf5b588f59b95c3a3c6e516744c32a`, not `head_ref`.
`git diff --name-status fc93ff7a..HEAD` is `.agent/`-only (3 handoffs, `state.md`, the four
`latest-*-final.json` pointers, `units/KEY-001.md`); no product or test file differs, so the gates
I ran exercise byte-identical code. Recorded as F-5 (Nit), same pattern as r1 F-8.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 … AC-8. All eight: **SATISFIED** (per-AC evidence lines in the
review file). AC-6 and AC-7 are satisfied in behavior but under-tested — see F-1/F-2.

## Relevant files
- `script.js:88-118` — the keydown listener, incl. the new 4-line `event.repeat` guard (`:98-101`)
- `script.js:67-83` — the click handler's `event.detail > 0` blur gate (D-011)
- `calculator-core.js:203-243` — `KEY_MAP`, `mapKey`, `allowsRepeat`
- `tests/integration/keyboard.test.js` — 25 rows incl. the new `holding Enter on a Tab focused digit button performs the action once` (`:407`)
- `tests/helpers/dom-stub.js:118-139` — the native-activation model (fidelity limit, F-4)
- `README.md` `## Keyboard` section — AC-8

## Tests created / executed
- created: none (reviewer is read-only on code and tests)
- executed by me through the recorder at `be19be11` (product files ≡ `fc93ff7a`):
  - `node .agent/tools/run-gate.mjs unit --unit KEY-001` → exit 0, 83/83
  - `node .agent/tools/run-gate.mjs integration --unit KEY-001` → exit 0, 47/47
  - `node .agent/tools/run-gate.mjs regression --unit KEY-001` → exit 0, 25/25
  - `node .agent/tools/run-gate.mjs lint --unit KEY-001` → exit 0, PASS
  - `node .agent/tools/validate.mjs state` → `state: OK`, exit 0
- compared against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`
  (`"head": "fc93ff7a…"`, 83/47/25/PASS): **no discrepancy**.

**Evidence-pointer note (action may be needed):** `run-gate.mjs` rewrites the tracked
`latest-<gate>-final.json` files in place, so my four runs re-bound them to `be19be11`. I restored
all four immediately with `git show HEAD:<path> > <path>`; `git status --short` is now empty and the
pointers again read `"head": "fc93ff7a…"`. Please confirm independently before trusting them. The
only other on-disk artefacts are four new **gitignored** timestamped run files. Per the dispatch I
created no scratch worktree, wrote nothing outside the repository, and made no commit/stash/
checkout/reset.

## Results
13 in-memory mutation probes via the stub's default-off `CALC_STUB_TRANSFORM` hook, run against
`tests/integration/**` + `tests/regression/**` (72 tests). 11 killed, **2 survived**:

- **M10** `if (event.repeat)` → `if (event.repeat && event.key === 'Enter')` → **72/72 green**, yet a
  held `Space` on the Tab-focused `7` button renders `777` instead of `7`.
- **M11** `if (event.repeat)` → `if (event.repeat && event.target.dataset.number !== undefined)`
  (the D-012-shaped narrowing) → **72/72 green**, yet a held `Enter` on a focused `+` or `=` button
  fires 3 dispatches instead of 1 (display-identical, hence invisible without the spy oracle).

Killed: delete the guard; guard without `preventDefault()`; always-blur; never-blur; remove the whole
Enter/Space branch (2 fails — confirms r1 F-3 is still exact); drop `!allowsRepeat(input)`;
`allowsRepeat` always true; `mapKey` ignores `metaKey`; drop the `,` entry; `Backspace`→`clear`;
remove `preventDefault()` for mapped keys; guard restricted to non-digit buttons.

Extra scenario probes beyond the 52 named rows, all **correct on the shipped code**: held `Space` on a
focused digit button; held `Enter` on a focused operator / action(`AC`) / equals button; Tab→`7`+Enter
then Tab→`8`+Enter; a hold spanning two buttons; a first event already `repeat: true`; mouse-click
then keys routed to `activeElement`; held digit and held `Backspace` while a button is focused; held
`Escape`; a focused synthetic `data-operator="constructor"` button with held `Enter` (no throw, no
state change); `Enter` targeted at the `.buttons` container.

## Findings
| ID | Severity | Location | Problem | Required change |
|---|---|---|---|---|
| F-1 | **Major** | `tests/integration/keyboard.test.js:407` (covers `script.js:98`) | Only the `Enter` half of the fix is pinned; M10 survives the full suite while a held `Space` on a focused digit button renders `777`. AC-6 names `Space` explicitly and a non-repeat Space row already exists, so the gap is asymmetric. | Add integration row `holding Space on a Tab focused digit button performs the action once`: focus `buttonFor('7')`, dispatch `{key:' ',repeat:false}` then two `{key:' ',repeat:true}`, assert `display('', '7')`. Must fail under M10. No product change. |
| F-2 | **Major** | `tests/integration/keyboard.test.js` AC-6/AC-7 block (guarantee at `script.js:92-101` and in the unit's Known Issues) | The "regardless of input type" guarantee — the exact reason D-012 was rejected — is unpinned; M11 survives while a held `Enter` on a focused `+`/`=` fires 3 dispatches. Every held-key row targets `document.body`; the one focused-button repeat row uses a digit. | Add integration row `holding Enter on a Tab focused operator button performs the action once` using the existing `spyOnDispatches` oracle: type `9`, focus `buttonFor('+')`, `{key:'Enter',repeat:false}` then two `{key:'Enter',repeat:true}`, assert dispatch count rose by exactly 1 and display stays `9+`. Must fail under M11. No product change. |
| F-3 | Minor | `script.js:98-101` vs AC-5 | A held `Space` (an unmapped key) on a focused calculator button now has `preventDefault()` called (`defaultPrevented = false,true,true` measured), contradicting AC-5's literal wording. Behavior is right; the carve-out is nowhere recorded. | Amend AC-5 (or extend D-011 / add a decision record) to state the carve-out; ideally assert `defaultPrevented === true` on the repeats in F-1's new row. |
| F-4 | Minor | `tests/helpers/dom-stub.js:118-139`, RK-3 | The stub activates a focused button on `Space` **keydown**; real browsers activate on `Space` **keyup** and do not repeat-activate held `Space`. The stub therefore can prove neither that the `Space` guard is needed nor that it is harmless. | Add to the manual browser checklist (with the r2 F-3 items): Chrome + Firefox, Tab to a digit button, hold `Enter` (expect exactly one digit), hold `Space` (expect exactly one, **not zero**), repeat on `=`. Record the keydown/keyup divergence as `UNVERIFIED` in the unit file. |
| F-5 | Nit | repository state | Third cycle where `HEAD` ≠ `head_ref` (`.agent`-only drift); and `run-gate.mjs` re-binding tracked `latest-*-final.json` means an independent re-run mechanically damages the evidence it checks (two clobber incidents already). | Human decision (`run-gate.mjs` is human-owned): point `head_ref` at the branch tip, and/or make `run-gate.mjs` refuse to overwrite a pointer bound to a different SHA without an explicit `--rebind`. |

Carried Minor/Nit findings from r1/sec1/arch1/r2 re-checked, not re-flagged as blocking per the
standing user decision. None stale — r1 F-3 is confirmed still exact (M5 kills only 2 of 4 Tab rows).

## Decisions made
None. I edited no file except `.agent/reviews/KEY-001-r3.md` and this handoff.

## Known risks
- The two unpinned guarantees sit in the exact four lines that have produced an escaped, user-visible
  defect in each of the last two cycles. A future "simplification" (re-gating on `allowsRepeat`, or
  "digits repeat anyway") would reintroduce a real bug with a fully green suite.
- Real-browser `event.detail` and `event.repeat` semantics during native activation remain
  `UNVERIFIED` (RK-3); the `Space` keyup divergence (F-4) is a newly-named instance of that risk.

## Outstanding issues
F-1 and F-2 are open Major findings, so `APPROVED` is not available at this head (CLAUDE.md §11,
review template rule). Both are additive test rows in one existing file.

## Required next action
Dispatch `implementer` to add exactly the two integration rows described in F-1 and F-2 to
`tests/integration/keyboard.test.js` (RED against the corresponding mutation, GREEN on the shipped
`script.js`, no product-code change), have `test-designer` add the two rows to
`.agent/units/KEY-001.matrix.md` so `validate.mjs state` keeps matching named rows to tests, then
re-run gates 4/6/7 on the new head and open a **new** review cycle (r4) against that head. F-3/F-4
are unit-file/decision-record and manual-checklist edits, and F-5 is a human `run-gate.mjs` question;
none of the three requires a code change.
