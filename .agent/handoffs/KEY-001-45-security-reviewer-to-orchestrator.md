---
unit: KEY-001
from: security-reviewer
to: orchestrator
sequence: 45
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-45: security-reviewer → orchestrator (cycle 5)

## Context
Fresh, full security review of KEY-001 at `head_ref` `8c36740af901c680ee4305fcbb0684222201777d`,
per dispatch `KEY-001-42`. My runtime model is **claude-opus-5** (Opus family) — no
`review_fallback`, no REDUCED ASSURANCE from this review. Handoffs `KEY-001-04`, `-06`, `-08`,
`-16`, `-24`, `-32`, `-40` were not opened.

Confirmed no product file changed since the cycle-4 approval:
`git diff 377024ba..8c36740 -- . ':(exclude).agent'` = `tests/integration/keyboard.test.js` +19/-0
(one added test row) and nothing else. `git status --porcelain` is clean and
`git diff 8c36740 -- . ':(exclude).agent'` is empty, so the executed tree is byte-identical to
`head_ref` for all shipped and test files. Actual `HEAD` is `ee66c607`, two `.agent`-only commits
ahead; the verdict binds to `8c36740a`.

## Acceptance criteria
Security-relevant subset named in the dispatch (AC-2/3/4/7/8 are the code reviewer's):
- AC-1: SATISFIED
- AC-5: SATISFIED
- AC-6: SATISFIED (security aspect)

## Relevant files
- `.agent/reviews/KEY-001-sec5.md` — this cycle's security verdict, findings and evidence
- `script.js`, `calculator-core.js` — unchanged since `377024ba`; input→sink trace re-derived here
- `tests/integration/keyboard.test.js` — the only changed file (new DEL pinning row, line 465)
- `index.html`, `style.css`, `tests/helpers/source-scan.js`, `tests/helpers/dom-stub.js` — examined

## Tests created / executed
- created: none (reviewers write no tests; I changed no file except my review and this handoff)
- executed (my own re-runs, `CALC_STUB_TRANSFORM` confirmed unset):
  - `node --test "tests/unit/*.test.js"` → 83 pass / 0 fail
  - `node --test "tests/integration/*.test.js"` → 50 pass / 0 fail
  - `node --test "tests/regression/*.test.js"` → 25 pass / 0 fail
  - `node --check script.js && node --check calculator-core.js` → exit 0
- recorded evidence cross-checked and matching exactly:
  `.agent/test-results/KEY-001/latest-unit-final.json` (83/0), `latest-integration-final.json`
  (50/0), `latest-regression-final.json` (25/0), `latest-lint-final.json` (`exitCode: 0`) — all
  `head: 8c36740af901c680ee4305fcbb0684222201777d`, `dirty: false`.
- I did not run `run-gate.mjs` (it would rebind evidence to a different HEAD and overwrite files a
  reviewer does not own).

## Results
**Verdict: APPROVED** for `8c36740af901c680ee4305fcbb0684222201777d`. No exploitable weakness found.

Verification highlights (all re-derived at this head, nothing carried on trust):
- 376-row `preventDefault` sweep (23 mapped × repeat; 24 unmapped × 4 modifier sets × repeat;
  23 mapped × Ctrl/Meta/Alt × repeat) → **0 anomalies**.
- 72-row hostile `data-*` click-boundary probe and 79-row hostile `keydown` probe → **0 anomalies**
  (no state change, no throw, no `preventDefault`, no markup write).
- Prototype-pollution probe, 5 000-repeat probe (0 markup writes), key/click parity and
  divide-by-zero paths → all as specified.
- 11 mutation probes; the **new DEL row is the unique killer** of the "repeat guard skips action
  buttons" narrowing (49-test suite at `377024ba` stayed green under it). `script.js:89-103` is now
  pinned in five independent directions.
- Zero dependencies / no manifest / no CDN / no secrets in the diff; the only DOM writes remain
  `textContent` (`script.js:16-17`).

Findings: **0 Critical, 0 Major, 0 Minor; 9 Nit** — F-1…F-7 carried from cycles 1–4 and each
re-verified as still accurate at this head, F-8 restated for the new row, F-9 new. None blocks
approval. Details, exploit scenarios and concrete fixes are in `.agent/reviews/KEY-001-sec5.md`.

## Decisions made
- Verdict bound to `8c36740a` even though `HEAD` is `ee66c607`: the two intervening commits touch
  `.agent/` only, and the worktree is byte-identical to `head_ref` for every shipped and test file.
- No finding raised above Nit: every impact identified requires pre-existing script control of a
  static `file://` page, and every failure direction is fewer actions, never a bypass.

## Known risks
- RK-3 (no real browser) remains the dominant residual risk: `Space` native activation timing,
  `event.detail` semantics, real OS auto-repeat and `preventDefault` on `Escape`//` are
  **UNVERIFIED** and need the user's manual checklist. Security impact assessed as low (failure
  direction is zero actions, never two).
- F-2: the document-level `preventDefault` becomes a real input-stealing defect the moment an
  `<input>`/`<textarea>`/`contenteditable` is added to `index.html`. Unenforced today.
- F-3/F-4: the AC-7 static scan omits `style.css` and misses string-form `setTimeout`/`setInterval`
  and generic inline `on*=` handlers — future commits could introduce those and stay green.

## Outstanding issues
- `CALC_STUB_TRANSFORM` is still unrecorded in gate evidence (BOOT-001-sec1 F-4): a gate run made
  with it set would be indistinguishable from an honest one. Needs a human change to
  `run-gate.mjs`; test-integrity, not product security.
- F-9 (new, Nit): the added test's rationale comment attributes the wrong failure mode to the
  repeat guard (`123` is the outer-branch mutation's result; the guard's own mutation yields `0`).
  Assertion and pinning value are correct; a one-line comment fix is the whole remedy.
- F-1/F-5 optional hardening (tag check in `isCalculatorButton`, `mapKey` prototype-name unit row)
  remain unfiled work for a future unit.

## Required next action
Record `security_review: APPROVED` (model `claude-opus-5`, commit
`8c36740af901c680ee4305fcbb0684222201777d`, review file `.agent/reviews/KEY-001-sec5.md`) in the
KEY-001 unit Log, and note that this verdict is invalidated by any new commit.
