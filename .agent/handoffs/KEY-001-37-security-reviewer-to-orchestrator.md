---
unit: KEY-001
from: security-reviewer
to: orchestrator
sequence: 37
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-37: security-reviewer → orchestrator (cycle 4)

## Context
Cycle-4 security review of KEY-001 at `head_ref` `377024ba68675fc48a3f0e5c07f881858d24e746`,
requested by `.agent/handoffs/KEY-001-34-orchestrator-to-security-reviewer.md`. Fresh full review
under attacker-controlled-DOM/keyboard/`MouseEvent.detail` assumptions; every cycle-3 conclusion was
re-measured, not copied. Handoffs `-04`, `-06`, `-08`, `-16`, `-24`, `-32` were not opened. I run on
**claude-opus-5** (Opus, no fallback), so no `review_fallback` and no REDUCED ASSURANCE from the
security side.

Confirmed the dispatch's premise independently: `git diff fc93ff7a..377024ba --stat -- .
':(exclude).agent'` = `tests/integration/keyboard.test.js` +40/-0 and nothing else; no shipped file
and no test helper changed. `git diff 377024ba -- . ':(exclude).agent'` is empty and
`git status --porcelain` is clean, so the tree I executed is byte-identical to `head_ref` for every
shipped and test file (git HEAD is `6f104c6b`, `.agent/`-only drift).

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1, AC-5, AC-6 (security-relevant subset; AC-2/3/4/7/8 deliberately not
judged here). Verdicts: **AC-1 SATISFIED, AC-5 SATISFIED, AC-6 SATISFIED**.

## Relevant files
- `.agent/reviews/KEY-001-sec4.md` — the review (verdict, findings, probes)
- `script.js`, `calculator-core.js`, `index.html`, `style.css` — read in full, unchanged since sec3
- `tests/integration/keyboard.test.js` — the only changed file (two pinning rows)
- `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js` — probe/scan fidelity re-checked

## Tests created / executed
- created: none (reviewers write no tests; no file on disk changed except this handoff and the review)
- executed: `node --test "tests/unit/*.test.js"` 83/0, `node --test "tests/integration/*.test.js"`
  49/0, `node --test "tests/regression/*.test.js"` 25/0, `node --check` on both scripts exit 0
- read (not re-recorded): `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`
  — 83 / 49 / 25 pass, `fail: 0`, `exitCode: 0`, `head: 377024ba…`, `dirty: false`; my counts match
  exactly. I did not run `run-gate.mjs` (it would rebind evidence to a different HEAD).

## Results
**Verdict: APPROVED** for `377024ba68675fc48a3f0e5c07f881858d24e746`. No exploitable weakness.
- 14 mutation probes all bite. M10 (guard narrowed to `event.key === 'Enter'`) kills **only** the new
  held-`Space` row; M11 (narrowed to digit buttons, the rejected D-012 shape) kills **only** the new
  held-`Enter`-on-operator row — the two additions are genuine, non-redundant pins.
- AC-5 sweep: 376 key × modifier × repeat rows, **0 anomalies**; `Tab` never prevented; a non-repeat
  `Enter`/`Space` on a focused button still left to the browser.
- Hostile probes: 72 click-boundary rows + 68 keydown rows + 7 malformed `key` types + prototype
  pollution → 0 anomalies, 0 exceptions, 0 markup writes. 5 000 held repeats on a focused digit
  button → `current === "7"`.
- Sinks/secrets/supply chain: only `textContent` writes; no `eval`/`new Function`/`innerHTML`/
  storage/network/`location`; no dependency, CDN or lockfile; no secrets in the diff.

## Decisions made
- None. No decision record is needed from this review.

## Known risks
- 8 findings, **all Nit**, none blocking: F-1 `isCalculatorButton` is tag-agnostic (denial-of-function
  only, needs prior script control); F-2 global `keydown` + `preventDefault` is safe only while
  `index.html` has no editable field; F-3 `style.css` outside the static scan; F-4 scan misses string
  `setTimeout`/`setInterval` and generic inline `on*=`; F-5 `mapKey`'s prototype-name rejection is
  unpinned by a test; F-6 the repeat guard slightly widens F-1's surface; F-7 `Space` activation
  semantics are engine-internal (failure direction = fewer actions); **F-8 (new)** the added
  held-`Space` row asserts against the stub's keydown-activation model, so it pins the code but
  cannot raise real-browser assurance for `Space` above UNVERIFIED.
- RK-5 (over-broad `preventDefault`) stays closed; RK-3 (no real browser) stays open.

## Outstanding issues
- Manual browser checklist items 1–5 in the unit file remain the control for the UNVERIFIED items
  (real focus, real auto-repeat, `detail` semantics, `Space` on keyup).
- `CALC_STUB_TRANSFORM` is still not recorded in gate evidence (BOOT-001-sec1 F-4) — a human
  `run-gate.mjs` decision, not fixable by this unit.

## Required next action
Record `security_review: APPROVED` for KEY-001 at `reviewed_ref`
`377024ba68675fc48a3f0e5c07f881858d24e746` with `review_model: claude-opus-5`, citing
`.agent/reviews/KEY-001-sec4.md`; any further commit invalidates this verdict (CLAUDE.md §11).
