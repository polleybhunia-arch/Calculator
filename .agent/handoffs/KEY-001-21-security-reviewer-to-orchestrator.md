---
unit: KEY-001
from: security-reviewer
to: orchestrator
sequence: 21
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-21: security-reviewer → orchestrator (cycle 2)

## Context
Fresh, full security review of `KEY-001` at `head_ref`
`5678cc1b70f39af6859c980a8520bb858418a140` (diff `f9426e28..5678cc1b`), per dispatch
`KEY-001-18`. Not a delta review: every cycle-1 conclusion was re-derived by execution at this head.
Handoffs `KEY-001-04`, `-06`, `-08`, `-16` were not opened. I ran on **claude-opus-5** (Opus family,
no fallback), so no `review_fallback` and no REDUCED ASSURANCE label is warranted from the security
side; the orchestrator's own `FALLBACK(opus->sonnet)` is unaffected by this.

Ref reconciliation: `git rev-parse HEAD` is `6d31d7fe` (two commits ahead), but
`git diff 5678cc1b..HEAD -- . ':(exclude).agent'` is **empty** and `git status --porcelain` is clean,
so the tree I executed is byte-identical to `head_ref`. The verdict binds to `5678cc1b…`.

No file on disk was changed except `.agent/reviews/KEY-001-sec2.md` and this handoff. All probing ran
from stdin, in memory, writing nothing anywhere; nothing outside the repository was read or written.
No commit, stash, checkout or reset was performed.

## Acceptance criteria
Only the security-relevant ACs named in the dispatch (AC-1, AC-5, AC-6) are judged; AC-2, AC-3, AC-4,
AC-7 and AC-8 are deliberately left to the code reviewer so the machine-read AC block of
`review_file` stays theirs.

- AC-1: SATISFIED
- AC-5: SATISFIED
- AC-6: SATISFIED (security aspect)

## Relevant files
- `.agent/reviews/KEY-001-sec2.md` — this verdict, `reviewed_ref` `5678cc1b70f39af6859c980a8520bb858418a140`
- `script.js`, `calculator-core.js`, `index.html`, `style.css` — read end to end
- `tests/helpers/{dom-stub.js,source-scan.js}`, `tests/unit/key-map.test.js`,
  `tests/integration/keyboard.test.js`, `tests/regression/*` — read and executed
- `.agent/decisions/D-011-click-origin-and-focus-policy.md` — the change under review

## Tests created / executed
- created: none (reviewers do not author tests)
- executed: `node --test "tests/unit/*.test.js"` → 83/83
- executed: `node --test "tests/integration/*.test.js"` → 46/46
- executed: `node --test "tests/regression/*.test.js"` → 25/25
- compared against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`

## Results
- **Verdict: APPROVED.** No exploitable weakness at `5678cc1b…`.
- My counts match the recorded evidence exactly: unit 83 pass / 0 fail, integration 46 / 0,
  regression 25 / 0, each recorded with `head` `5678cc1b70f39af6859c980a8520bb858418a140` and
  `dirty: false`; `latest-lint-final.json` exit 0.
- **`event.detail` question answered on evidence, not agreement:** `detail` is a pure control signal
  for `blur()`. Across 28 hostile/exotic `detail` values the dispatched calculator action was
  identical and `markupWrites` stayed 0 — it never reaches `applyInput`, `render` or `textContent`.
  `blur()` only *removes* focus (it cannot move focus to an attacker-chosen element); the converse
  (spoofing `detail: 0` so a button keeps focus) requires script control the attacker would already
  have, and such an attacker can call `button.focus()` directly. Non-numeric/absent `detail` fails
  toward not blurring — the safe direction. **No new injection or data-exposure surface.**
- Boundary probes re-run at this head: 66 hostile `data-number`/`data-operator`/`data-action` click
  rows → 0 state changes, 0 exceptions, 0 markup writes; 18 hostile `key` values + 7 malformed `key`
  types → inert, no throw, `preventDefault` not called; `Object.prototype` pollution ineffective.
- AC-5 re-probed from scratch: 23 mapped keys all `preventDefault`ed; 15 unmapped keys and 69
  mapped×modifier combinations all inert **and** unprevented. RK-5 stays closed.
- **9 mutation probes** (via the stub's in-memory `CALC_STUB_TRANSFORM`, nothing written to disk) are
  each caught by at least one test: removing the `detail` gate, removing `blur()`, inverting the gate,
  dropping `isInput` on each of the three `data-*` branches, over-broad `preventDefault` (5 failures),
  ignoring modifiers, and removing the `Enter`/`Space` double-action guard.
- Zero dependencies confirmed (no manifest/lockfile/`node_modules`); no network reference, no secret,
  no storage, no `eval`/`innerHTML`/string timer anywhere in the shipped files.

## Decisions made
- none (reviewers record no decision records)

## Known risks
- Five **Nit** findings, all carried from cycle 1 and re-verified as still accurately described in
  `.agent/units/KEY-001.md` Known Issues; none Critical or Major, none blocking:
  F-1 `isCalculatorButton` accepts any tag with a `data-*` input attribute (denial-of-function only,
  needs markup injection); F-2 global `keydown` assumes `index.html` has no editable field (verified
  true today); F-3 `style.css` outside the static scan; F-4 the scan misses string
  `setTimeout`/`setInterval` and generic inline `on*=`; F-5 `mapKey`'s prototype-name rejection is not
  pinned by a test (only `isInput`'s is).
- **No new finding** is introduced by the D-011 fix.
- Robustness, not security findings, offered to the code/architecture reviewers: uncapped operand
  growth on a held digit (5 000 repeats → 5 000-char operand, still `textContent`), and the recorded
  held-`Enter`-on-a-Tab-focused-button issue, which I reproduced (5 presses → `77777`) — the
  `isCalculatorButton` early return precedes the `event.repeat` check, so the auto-repeat policy does
  not govern the native-activation path.

## Outstanding issues
- **UNVERIFIED (RK-3, no real browser):** that a real browser reports `detail === 0` for a native
  `Enter`/`Space` activation and `detail >= 1` for a pointer click — the whole D-011 mechanism rests
  on this. Security residual is **low**: if a browser disagreed, the failure mode is the previous
  focus behavior, not an allowlist bypass, since the allowlist is enforced in pure code I executed.
  Also unverified: real `preventDefault()` suppression of `Escape`/`/`, and real OS auto-repeat. A
  manual browser pass by the user remains the right control.
- **UNVERIFIED:** `CALC_STUB_TRANSFORM` is still not recorded in gate evidence (BOOT-001-sec1 F-4,
  correctly still open — a `run-gate.mjs` change is a human decision). I confirmed it was unset for my
  verification runs and set only for the nine mutation probes, but I cannot retroactively verify the
  environment of the recorded runs. Test-integrity risk, not product security.
- I did not audit the `latest-unit-red.json` restore recorded in the unit Log; it concerns gate-3
  evidence, not this head's security posture.

## Required next action
Record `security_review: APPROVED` for `KEY-001` bound to `reviewed_ref`
`5678cc1b70f39af6859c980a8520bb858418a140` with `review_model: claude-opus-5` (no fallback), citing
`.agent/reviews/KEY-001-sec2.md`, then proceed with the remaining cycle-2 review verdicts before
gate 5 is closed.
