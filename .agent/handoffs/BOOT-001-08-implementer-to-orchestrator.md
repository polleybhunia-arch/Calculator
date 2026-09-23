---
unit: BOOT-001
from: implementer
to: orchestrator
sequence: 08
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff BOOT-001-08: implementer → orchestrator

## Context
Dispatch `.agent/handoffs/BOOT-001-07-orchestrator-to-implementer.md` executed on branch
`agent/BOOT-001-core-extraction`. Strict order: RED (unit suite, core absent) → GREEN (core, thin
`script.js`, `index.html`, README, decision record) → REFACTOR, each phase committed as code first,
gate run on the clean commit, evidence committed second. Nothing under `tests/integration`,
`tests/regression` or `tests/helpers` was touched (`git diff --stat a1d4f49..HEAD` on those paths and
on `style.css` is empty). Nothing was pushed. Unit status was not edited.

## Acceptance criteria
`.agent/units/BOOT-001.md` AC-1 … AC-8. Unit-layer rows (AC-1, AC-2, AC-3, AC-4, AC-5, AC-8) are in
`tests/unit/calculator-core.test.js`; AC-6 and AC-7 stay with the integration and regression suites,
which are green against the extracted code.

## Relevant files
- `calculator-core.js` — new; `createState`, `applyInput`, `render`, IIFE, dual-export guard
- `script.js` — reduced to the DOM layer (single `dispatch(input)`, `inputFromElement`, `textContent` writes)
- `index.html` — `<script src="calculator-core.js">` added before `script.js`
- `README.md` — one line added to "Files"
- `tests/unit/calculator-core.test.js` — new; 52 tests (51 matrix rows verbatim + 1 extra, see Decisions)
- `.agent/decisions/D-003-core-api.md` — new core-API decision record

## Tests created / executed
Commit SHAs per phase (code, then evidence):

| Phase | Code commit | Evidence commit |
|---|---|---|
| RED | `a08f8c6` (51 rows), `35d3b85` (+1 malformed-input row) | `14bff8c`, `5f9e184` |
| GREEN | `ee29dc4` | `8381733` |
| REFACTOR | `23cab89` | `6d7d8dc` |

Run-gate evidence (all `dirty=false`, bound to the code commit of the phase):
- `.agent/test-results/BOOT-001/latest-unit-red.json` — exit 1, 52 tests, 0 pass, 52 fail, head `35d3b858`
- `.agent/test-results/BOOT-001/latest-unit-green.json` — exit 0, 52/52, head `ee29dc4b`
- `.agent/test-results/BOOT-001/latest-integration-green.json` — exit 0, 20/20, head `ee29dc4b`
- `.agent/test-results/BOOT-001/latest-regression-green.json` — exit 0, 13/13, head `ee29dc4b`
- `.agent/test-results/BOOT-001/latest-unit-refactor.json` — exit 0, 52/52, head `23cab89a`
- `.agent/test-results/BOOT-001/latest-integration-refactor.json` — exit 0, 20/20, head `23cab89a`
- `.agent/test-results/BOOT-001/latest-regression-refactor.json` — exit 0, 13/13, head `23cab89a`

`node .agent/tools/validate.mjs state` = `state: OK` (exit 0) at the end. The phase-A safety-net names are
unchanged: the six intended RED rows (`loads calculator-core.js before script.js in index.html` and the five
`source-safety` rows) are now green together with the 19 + 8 phase-A rows.

## Results
**Why the RED failed (all 52, one signature).** Every test failed with the same assertion,
`AssertionError [ERR_ASSERTION]: AC-1: calculator-core.js must exist at the repository root`, raised by the
test file's `assertCoreFileExists()` guard before `require`. Counted from the run output: 52 of 52 carry that
message; there is no `MODULE_NOT_FOUND`, `SyntaxError`, `ReferenceError` or `TypeError` anywhere. Per AC:
- AC-1 (5 rows): the core file is absent, so "loads with no document/window", "exposes three entry points",
  "fresh render is empty/0", "two states independent" and "earlier state unchanged" cannot hold.
- AC-2 (7), AC-3 (12), AC-4 (9), AC-5 (9), AC-8 (9): each row drives the core through `createState`/`applyInput`/`render`
  and asserts the rendered `{ expression, current }` for its sequence; all fail because there is no core to
  drive. The value each asserts is the AC value (for example `4+8+9` / `21`, `0.3`, `5÷0` / `Error`, `21+5` / `26`, `4+5` / `9`).
- Extra row (`throws a TypeError for a malformed input descriptor`): same missing-core assertion.
After GREEN each of these rows passes for the AC's reason. Three quick mutation probes on `calculator-core.js`
(restored with `git checkout`, tree clean afterwards) were caught by the unit suite: rounding factor `1e9` (2 failing rows),
operator swap appends instead of replacing (4 failing rows), divide-by-zero check disabled (5 failing rows).

**Mid-chain divide-by-zero probe (DoD line), throwaway script from stdin, nothing committed.**

| Sequence | Before (unmodified `script.js`, baseline `e02035b`) | After (extracted, HEAD `23cab89`) |
|---|---|---|
| `5 / 0 +` | E=`` C=`5÷0+` | E=`` C=`5÷0+` |
| `5 / 0 + =` | E=`5÷0+Error` C=`NaN` | E=`5÷0+Error` C=`NaN` |
| `5 / 0 + 3` | E=`` C=`3` | E=`` C=`3` |
| `5 / 0 + *` | E=`` C=`0×` | E=`` C=`0×` |
| `5 / 0 + DEL` / `+ AC` | C=`0` / C=`0` | C=`0` / C=`0` |

Identical: no drift. The defect is preserved bit-for-bit and no test asserts it (CALC-001's RED assumption holds).

**Extra drift check (not committed, method reproducible).** A baseline-versus-extracted differential run: baseline page =
`git show e02035b:index.html` + `git show e02035b:script.js` parsed with `parseHtml` from `tests/helpers/dom-stub.js`
and run in `node:vm`; extracted page = `loadPage()` (real `index.html`, scripts `calculator-core.js`, `script.js`). Same
clicks to both, display compared after every click: exhaustive sequences of length 1 to 3 over all 18 tokens, length 4 to 5
over 10 tokens, plus 150,000 seeded random sequences (4 to 17 clicks). Total 266,174 sequences, 2,132,358 clicks,
**0 mismatches**, repeated after the refactor with 0 mismatches. To prove the harness bites, one run with the core mutated in
memory (`CALC_STUB_TRANSFORM`, rounding `1e10` to `1e9`) showed mismatches on `1 / 3 =`, `2 / 3 =`, `1 / 7 =`.
This covers the mid-chain path too (the sequences include an operator after a zero divisor).

**Manual `node --check calculator-core.js`**: OK (also `node --check script.js`: OK). The `lint` gate in `gates.json`
covers `script.js` only (OQ-7, human edit before gate 8), so `calculator-core.js` is not machine-linted yet.

**Static scan constraints.** The three shipped files have no regex literal, `import`/`export` statement, `eval`,
`new Function`, `document.write`, `innerHTML`/`outerHTML`/`insertAdjacentHTML` or absolute URL; the source-safety
regression rows pass on them. Display writes use `textContent` only.

## Decisions made
- **D-003** (`.agent/decisions/D-003-core-api.md`, status accepted, decided by implementer as delegated): entry points
  `createState`, `applyInput`, `render`; input descriptor `{ type: 'number' | 'operator' | 'action', value }`; dual-export
  guard inside an IIFE (browser global `CalculatorCore`); unrecognized-input policy (DOM layer ignores unrecognized
  clicks and out-of-set values; core throws `TypeError` on a malformed descriptor).
- **One unit test beyond the matrix**: `throws a TypeError for a malformed input descriptor` (52 tests instead of 51).
  Reason: the core's throw policy is behavior, and TDD requires a failing test first; the matrix explicitly left it to me.
  It was written RED-first (commit `35d3b85`) and RED was re-recorded. Request: the test-designer/orchestrator may add a
  matrix row for it (I may not edit the matrix); the validator does not object to an extra test.
- `deleteLastDigit`'s unreachable `-`-to-`0` branch was not ported (matrix "Not covered" allowed either); reasoning in D-003
  and confirmed by the differential run.
- REFACTOR performed (no `tdd_refactor_skip`): one `OPERATORS` table replaces the symbol map and the arithmetic `switch`
  whose `default` meant division; `chooseOperator` flattened. No test edited.
- No test-change decision needed: no pre-existing test was modified or deleted.

## Known risks
- **Duplicated value tables**: digits/operators/actions are validated in `script.js` (boundary) and in the core (throw).
  A new operator/action must be added to both; the integration suite is the guard (D-003).
- The reviewers should confirm the RED-for-the-right-reason claim from `latest-unit-red.json` (`outputTail`) and the
  mutation probes; the differential run is a throwaway and stays `UNVERIFIED` as committed evidence.
- The write tooling converted my `\uXXXX` source escapes into literal UTF-8 glyphs, so `calculator-core.js` and the test
  file contain literal `−` (U+2212), `×` (U+00D7), `÷` (U+00F7), like the original `script.js`. Code points were verified
  programmatically; behavior is unaffected, and the misleading "escapes keep this file ASCII" comment was corrected.
  With `<meta charset="UTF-8">` in `index.html` the browser reads the script as UTF-8 as before.
- The write guard refused a scratchpad file outside the repo, so all probes ran from stdin; nothing was written outside the repo.

## Outstanding issues
- **UNVERIFIED**: real-browser `file://` load, CSS/layout (RK-3, RK-4); proven only by the load-order and no-module-syntax proxies.
- The existing README "Files" line for `script.js` still says "calculator logic and display state", which is now stale
  (it is only the DOM layer). I added only the one `calculator-core.js` line as instructed; a `documenter` pass could reword it.
- `.agent/gates.json` lint still covers `script.js` only (OQ-7, human).
- Unit status/Log, `base_ref`/`head_ref`, dashboard and the architecture review remain the orchestrator's.

## Required next action
Re-run `node .agent/tools/run-gate.mjs unit|integration|regression --unit BOOT-001` yourself on HEAD and
`node .agent/tools/validate.mjs state`, then advance `BOOT-001` per CLAUDE.md §9/§11 (documenter for the stale `script.js`
README line if wanted, then reviewer and architecture-reviewer on the resulting `head_ref`).
