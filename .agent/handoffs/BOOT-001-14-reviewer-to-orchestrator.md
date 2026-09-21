---
unit: BOOT-001
from: reviewer
to: orchestrator
sequence: 14
model_attested: claude-opus-5
state: REVIEW
---

# Handoff BOOT-001-14: reviewer → orchestrator

## Context
Independent code review (cycle 1) of unit `BOOT-001` at `head_ref`
`28a19873b0c03224e111afb30e44829c919c9945`, base `e02035bab13f5365a110b60a86ba3a8ae42063ed`,
branch `agent/BOOT-001-core-extraction`. Dispatch: `.agent/handoffs/BOOT-001-11-orchestrator-to-reviewer.md`.
I did not read handoffs `BOOT-001-06`, `-08` or `-10`.

`git rev-parse HEAD` equals `head_ref`. Product and test files are committed and clean; only `.agent/`
has working-tree changes, as the dispatch states. I ran **no** git state-changing command, created no
worktree, and wrote only `.agent/reviews/BOOT-001-r1.md` and this file. `git status` for everything
outside `.agent/` is unchanged from when I started.

I am running on **claude-opus-5**. No review fallback applies (`review_fallback` stays empty).

## Acceptance criteria
`.agent/units/BOOT-001.md` AC-1 … AC-8 plus the unit's extra Definition of Done lines. Per-AC
verdicts with evidence are in `.agent/reviews/BOOT-001-r1.md` under "Acceptance criteria verdicts",
in the machine-read format `- AC-n: VERDICT — evidence`.

**All eight are SATISFIED. 8/8.**

## Relevant files
- `.agent/reviews/BOOT-001-r1.md` — the review, `reviewed_ref: 28a19873b0c03224e111afb30e44829c919c9945`
- `calculator-core.js`, `script.js`, `index.html`, `README.md` — the product diff I reviewed
- `tests/unit/calculator-core.test.js`, `tests/integration/dom-click.test.js`,
  `tests/regression/readme-behavior.test.js`, `tests/regression/source-safety.test.js`,
  `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`, `tests/regression/REGISTRY.md`
- `.agent/units/BOOT-001.matrix.md`, `.agent/decisions/D-001..D-004`

## Tests created / executed
- created: none (reviewers write no tests)
- executed by me, verbatim from `.agent/gates.json`, on `28a19873`:
  - `node --test "tests/unit/**/*.test.js"` → 52 tests, 52 pass, 0 fail
  - `node --test "tests/integration/**/*.test.js"` → 20 tests, 20 pass, 0 fail
  - `node --test "tests/regression/**/*.test.js"` → 13 tests, 13 pass, 0 fail
  - `node --check script.js` → exit 0; additionally `node --check calculator-core.js` → exit 0 (not a gate)
  - `node .agent/tools/validate.mjs state` → `state: OK`
- I deliberately did **not** invoke `run-gate.mjs`: it rewrites `.agent/test-results/`, and the
  dispatch forbids me any on-disk change outside my review and handoff. I ran the gate commands
  directly instead, and the counts reproduce the recorded evidence exactly.

## Results
Facts read from evidence files and my own runs, all bound to `28a19873b0c03224e111afb30e44829c919c9945`:

| Gate | Recorded | My re-run | Match |
|---|---|---|---|
| unit | `.agent/test-results/BOOT-001/latest-unit-final.json` — exit 0, 52/52, dirty false | 52/52 | yes |
| integration | `.agent/test-results/BOOT-001/latest-integration-final.json` — exit 0, 20/20, dirty false | 20/20 | yes |
| regression | `.agent/test-results/BOOT-001/latest-regression-final.json` — exit 0, 13/13, dirty false | 13/13 | yes |
| lint | `.agent/test-results/BOOT-001/latest-lint-final.json` — exit 0 | exit 0 | yes |

TDD chain verified as SHA-bound and coherent: `latest-unit-red.json` (`35d3b85`, 52 tests / 52 fail,
exit 1, clean) fails for the expected reason (`AC-1: calculator-core.js must exist at the repository
root`) → `latest-unit-green.json` (`ee29dc4`, 52/52) → `latest-unit-refactor.json` (`23cab89`, 52/52).
Integration/regression RED at `6281af7` (1 and 5 failures, the load-order and source-safety rows),
then GREEN and REFACTOR green.

Two independent verifications I ran beyond the gates:
1. **Behavior-drift check against the baseline.** I loaded `git show e02035ba:index.html` +
   `git show e02035ba:script.js` and the head tree into the same DOM stub and compared them token by
   token: **64,046 sequences / 401,502 token steps, 0 differences**, including the initial load and
   the mid-chain divide-by-zero path (`5 / 0 +` → `5÷0+`; `5 / 0 + =` → `5÷0+Error` / `NaN`;
   `5 / 0 + 3` → `3`). The unit's DoD line about that path — which the matrix flags as not automatable
   here (RK-1 residual) — therefore holds by measurement, and `CALC-001`'s RED reference is intact.
   No test in `tests/` asserts the mid-chain path (every `/ 0` sequence is followed immediately by
   `=`), so AC-6's prohibition holds.
2. **Mutation probes, 23 realistic mutations, no file on disk changed** (core-level: in-memory patch
   of `Module._extensions['.js']`/`fs.readFileSync` in a child `node -e` driving the real unit test
   file; page-level: the stub's `CALC_STUB_TRANSFORM` hook against integration + regression).
   **20 of 23 killed.** Survivors: one invalid probe (`if (number)` is a no-op because `dataset` values
   are strings and `'0'` is truthy — the real variant, rejecting `0` at the boundary, was killed), two
   equivalent mutants (listener on `document` instead of `.buttons`; the initial `updateDisplay()` call,
   which `index.html` already renders identically), and one genuine gap → finding F-1.

## Decisions made
- **Verdict: APPROVED**, bound to `reviewed_ref = 28a19873b0c03224e111afb30e44829c919c9945`.
  Every AC `SATISFIED` with evidence, no Critical and no Major finding, all four gates re-run green
  by me on this SHA, mutation probes killed apart from the equivalent/invalid ones noted above.
- Any new commit on this branch invalidates this approval (CLAUDE.md §11): re-review from a new head.
- I judged D-001…D-004 rather than assuming them. D-002 (safety net before extraction) and D-003
  (core API, input descriptor, dual export, throw-on-malformed) are sound; D-003 contains one
  inaccurate claim, see F-1. D-004 correctly covers the only modified pre-existing test path
  (`tests/regression/REGISTRY.md`); `git diff --name-status e02035ba..28a19873 -- tests` shows only
  additions besides it, and the 13 REGISTRY rows match the 13 regression test names one-to-one.

## Known risks
- **F-1 · Minor · `script.js:41` and `script.js:44`** (plus the claim in `.agent/decisions/D-003-core-api.md`,
  "Unrecognized-input policy"). Removing the `OPERATOR_VALUES` / `ACTION_VALUES` whitelists at the DOM
  boundary leaves **all 33** integration + regression tests green; only the `data-number` whitelist is
  pinned. D-003's sentence "The 19 integration rows exercise every real button, so drift between the
  two would fail there" is false in the permissive direction. Without the whitelist a button carrying
  `data-operator="^"` or `data-action="__proto__"` reaches `applyInput`, which throws a `TypeError`
  inside the click listener. **Required change**: one new matrix row + integration test that appends
  synthetic buttons with an out-of-range `data-operator` and `data-action`, clicks them, and asserts
  `doesNotThrow`, an unchanged display and an empty `markupWrites` log; and correct the D-003 sentence.
  Not blocking: no AC requires this validation and no shipped button can reach it.
- **F-2 · Minor · `.agent/units/BOOT-001.matrix.md:186` vs `tests/unit/calculator-core.test.js:127`.**
  The matrix's "Not covered" section states the unrecognized-descriptor policy is "not tested in the
  unit layer", but the suite contains "throws a TypeError for a malformed input descriptor" — this is
  the 52nd test against 51 matrix rows. The test is good and was written RED-first (`35d3b85`); the
  matrix is simply now wrong, and `CALC-001` / `KEY-001` will be designed from it. **Required change**:
  `test-designer` adds the named row under AC-1 and deletes the contradicting bullet; no test change.
- **F-3 · Nit · `tests/integration/dom-click.test.js:19`** — the page-load row cannot distinguish
  "scripts rendered `''`/`0`" from "scripts wrote nothing", because `index.html:12-13` ships those
  values; only partly saved by the `executedScripts` assertions.
- **F-4 · Nit · `tests/regression/source-safety.test.js:54`** — the `index.html` scan uses
  `PATTERNS.externalHosts.slice(0, 1)`, so a protocol-relative `//host` outside a `src`/`href`
  attribute is not flagged although AC-7 forbids it.
- **F-5 · Nit · `script.js:6`** — if `calculator-core.js` fails to load, the destructuring throws and
  the page silently keeps `index.html`'s static `0`, which looks like a working fresh calculator.
- Carried, not caused by this unit: RK-2 (stub fidelity), RK-3/RK-4 (no browser, `file://` by proxy).

## Outstanding issues
- **Gate 8 is not yet satisfiable** (not a defect in this implementation): `.agent/gates.json` lints
  only `script.js`, so `calculator-core.js` — 178 of the unit's 236 new product lines — is outside the
  lint gate (OQ-7). Only the human may change that file. `node --check calculator-core.js` passes by
  hand, but that is not gate evidence. `COMPLETE` is blocked until the user extends the lint command or
  records an `na` with a reason in a decision record.
- `security-reviewer` and `architecture-reviewer` verdicts are required by CLAUDE.md §11 and this
  unit's DoD; both were outstanding when I reviewed and are outside my mandate.
- Could not verify, recorded as `UNVERIFIED` with reasons in the review: real-browser rendering, CSS /
  dark theme / responsiveness, focus and real click mechanics, and actual `file://` loading.

## Required next action
Record `review_status: APPROVED`, `review_file: .agent/reviews/BOOT-001-r1.md`,
`reviewed_ref: 28a19873b0c03224e111afb30e44829c919c9945`, `review_model: claude-opus-5` in
`.agent/units/BOOT-001.md`, log the transition, and move the unit to `INTEGRATION` — **without any new
commit to product or test files**, since a new head invalidates this approval and the SHA-bound gate
evidence. F-1 and F-2 are Minor and do not block gate 5; schedule them as follow-up work (F-1 as an
integration row, F-2 as a `test-designer` matrix amendment) before `CALC-001` is designed against this
matrix, and keep gate 8 blocked on OQ-7 until the user acts.
