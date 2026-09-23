---
unit: KEY-001
from: security-reviewer
to: orchestrator
sequence: 13
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-13: security-reviewer → orchestrator

## Context
Security review of `KEY-001` (new keyboard input channel) at `reviewed_ref`
`ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`, under the assumption that DOM markup and `KeyboardEvent`s
are attacker-controlled. Handoffs `KEY-001-04`, `-06`, `-08` were not opened. I am running on
**claude-opus-5** (Opus family, no fallback), so no `review_fallback` applies to this review.

**Verdict: APPROVED.** Review file: `.agent/reviews/KEY-001-sec1.md`.

Ref discrepancy to record (not a blocker, already handled): the dispatch stated `git rev-parse HEAD`
equals `head_ref`, but HEAD is `ffa4aed6`. I verified `git diff ab4b5d1d..ffa4aed6` touches only
`.agent/` (handoffs, evidence, unit file) — product and test files are byte-identical — so the review
is validly bound to `ab4b5d1d`. If `ffa4aed6` is intended as the approved SHA, note that gate 5
binding is a SHA question for you, not a security one.

## Acceptance criteria
Judged only the ACs named in the dispatch; AC-2/3/4/7/8 are left to the code reviewer so the
machine-read AC block of `review_file` stays theirs.
- AC-1: SATISFIED — single exported vocabulary (`isInput`), `KEY_MAP` derived from the core's own
  constants, no third table.
- AC-5: SATISFIED — `preventDefault()` only for the 14 allowlisted keys with no Ctrl/Meta/Alt; 9
  unmapped keys and 4 modifier combos verified inert and not prevented. RK-5 closed.
- AC-6: SATISFIED (security aspect) — click-side boundary filter not weakened by the `isInput`
  refactor; no double-action path; the keyboard listener never synthesizes a click.

## Relevant files
- `.agent/reviews/KEY-001-sec1.md` — the verdict, findings and full input→sink trace
- `script.js`, `calculator-core.js`, `index.html`, `style.css` — read end to end
- `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js`, `tests/helpers/dom-stub.js`,
  `tests/integration/keyboard.test.js`, `tests/unit/key-map.test.js` — read and re-executed

## Tests created
None. I am read-only on code and tests; no file on disk was changed except this handoff and the
review file. All probing ran through `node` reading scripts from stdin — nothing written anywhere,
inside or outside the repository. `git status` and `git rev-parse HEAD` are unchanged.

## Tests run
Re-executed independently (`CALC_STUB_TRANSFORM` confirmed unset):
- `node --test "tests/unit/*.test.js"` → 83 pass / 0 fail
- `node --test "tests/integration/*.test.js"` → 46 pass / 0 fail
- `node --test "tests/regression/*.test.js"` → 25 pass / 0 fail

Counts match `.agent/test-results/KEY-001/latest-{unit,integration,regression}-final.json` exactly.

## Results
No exploitable weakness at this ref. Verified by execution, not by reading comments:
- Input→sink: `keydown` → `mapKey` (closed `Map` allowlist) → `dispatch` → `applyInput` (re-validates)
  → `render` → **`textContent` only**. No `innerHTML`/`eval`/`new Function`/string timer/`document.write`
  /`import()`/`location` write/storage/network anywhere in the diff.
- ~60 hostile probes all failed closed: `constructor`/`__proto__`/`toString`/`''`/`Unidentified`,
  non-string keys, a 200 000-char key, a 1 000 000-char `mapKey` argument, malformed events, deliberate
  `Object.prototype` pollution, inherited modifier flags, and 36 hostile `data-*` values at the click
  boundary (no state change, no throw, no markup write).
- The widened D-009 scan genuinely bites: an injected inline `onclick="eval(x)"`, `new Function`,
  `innerHTML=`, `document.write`, a bare `//host` in a `<meta>`, a protocol-relative `src`, an absolute
  CDN `href`, `type="module"` and a `javascript:` href are all caught in an in-memory `index.html`.
- The `stripComments` fix holds across 14 regex/division/string cases with no false negative; its
  append-verbatim design makes the failure mode false-positive-only.
- Carried-forward BOOT-001 items 1–4 are **confirmed closed** by execution, not by claim. Item 5
  (`CALC_STUB_TRANSFORM` not recorded in evidence) is still open and correctly so — it is a human
  decision about `run-gate.mjs`.
- Zero dependencies, zero network references, zero secrets, nothing persisted; user-facing error text
  is still the constant `Error`.

Five **Nit** findings (hardening only, none blocking, none reachable without full control of the page):
F-1 `isCalculatorButton` accepts any element with a `data-*` attribute, so an injected non-button can
swallow `Enter`/`Space`; F-2 the global `keydown` listener assumes the page has no editable field
(true today — verified — but unrecorded); F-3 `style.css` is outside the source-safety scan; F-4 the
scan misses string-form `setTimeout`/`setInterval` and inline `on*=` attributes; F-5 no test pins
`mapKey('__proto__'/'constructor') === null`.

## Decisions made
- `APPROVED` despite five open Nits: none is exploitable, and gate 5 requires no *critical* finding to
  be open. F-1…F-5 are hardening suggestions for a future unit, not `CHANGES_REQUIRED` items.
- The implementer's flagged `blur()` residual risk is **not** a security issue (it removes focus, cannot
  redirect it, causes no double action) — but I say explicitly that it *is* an accessibility/UX
  regression (a keyboard-only user loses their tab position after every activation), which belongs to
  the code and architecture reviewers. I did not silently agree with the framing.

## Risks
- No real browser (RK-3): real `preventDefault` semantics for `Escape` and `/`, and real OS auto-repeat,
  are UNVERIFIED — a manual pass by the user is still needed. Residual risk low: the allowlist itself is
  enforced in pure code that I did execute.
- `CALC_STUB_TRANSFORM`: gate evidence records no environment, so I cannot retroactively verify the
  environment of the recorded runs (mine was clean and the counts match). Test-integrity risk, human
  decision, unchanged by this unit.
- Uncapped operand growth under auto-repeat (5 000 keydowns → 5 000-char operand → `Infinity`): local,
  self-inflicted, pre-existing on the click path; recorded as robustness information, not a finding.

## Outstanding issues
None blocking. F-1…F-5 should be recorded as carry-forward hardening candidates for a future unit if
the user does not want them addressed now.

## Required next action
Record `security_review: APPROVED` (model `claude-opus-5`, `reviewed_ref`
`ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`, file `.agent/reviews/KEY-001-sec1.md`) and decide, with the
user, whether F-1…F-5 are carried forward or closed now. Also reconcile the HEAD-vs-`head_ref`
discrepancy noted above before gate 8, since review and gate evidence are SHA-bound.
