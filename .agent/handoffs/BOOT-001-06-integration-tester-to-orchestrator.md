---
unit: BOOT-001
from: integration-tester
to: orchestrator
sequence: 06
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff BOOT-001-06: integration-tester → orchestrator

## Context
Phases A and B of dispatch `.agent/handoffs/BOOT-001-05-orchestrator-to-integration-tester.md` are done on branch `agent/BOOT-001-core-extraction`, per decision D-002 (safety net first, implementer next). No production file was touched: `git diff --stat e02035b -- script.js index.html style.css README.md` is empty. Nothing was pushed. Tree is clean after the last commit.

Commits (code and evidence are separate so evidence stays bound to a clean code SHA):

| Phase | Commit | Content |
|---|---|---|
| A code | `d9bd52bc4fbc958913f174b1bcd1da912ded9c87` | `tests/helpers/dom-stub.js`, `tests/integration/dom-click.test.js` (19 rows), `tests/regression/readme-behavior.test.js` (8 rows), 8 registry rows |
| A evidence | `d709a21` | `latest-integration-green.json`, `latest-regression-green.json` |
| B code | `6281af765ae9d0c4519d54257f9ae5e7ceb82505` | RED row added to `dom-click.test.js`, `tests/regression/source-safety.test.js` (5 rows), `tests/helpers/source-scan.js`, 5 registry rows |
| B evidence | `4d54c36` | `latest-integration-red.json`, `latest-regression-red.json` |

## Acceptance criteria
AC-6 and AC-7 (integration and regression layers). AC-1 to AC-5 and AC-8 belong to the implementer's unit suite.

## Relevant files
- `tests/helpers/dom-stub.js`: parses real `index.html`, runs every `<script src>` in document order in one `node:vm` context (has `document` and `window`, no `module`/`exports`/`require`), bubbling clicks, markup-write traps, `press(tokens)` returning `{ expression, current }`, `document.addEventListener` exposed for KEY-001.
- `tests/helpers/source-scan.js`: comment stripper (string-aware), whitespace-tolerant AC-7 patterns, `readAllShipped()` (a missing file fails via `assert.ok`, never skips).
- `tests/integration/dom-click.test.js`, `tests/regression/readme-behavior.test.js`, `tests/regression/source-safety.test.js`
- `tests/regression/REGISTRY.md`

## Tests created / executed

Created: 33 named rows, every title verbatim from the matrix (scripted check: 33 of 33 integration and regression matrix names found in the test sources; 33 `test()` calls).

Evidence (all read back from the JSON files):

| File | Facts |
|---|---|
| `.agent/test-results/BOOT-001/latest-integration-green.json` | exit 0, 19 tests, 19 pass, head `d9bd52bc`, dirty=false |
| `.agent/test-results/BOOT-001/latest-regression-green.json` | exit 0, 8 tests, 8 pass, head `d9bd52bc`, dirty=false |
| `.agent/test-results/BOOT-001/latest-integration-red.json` | exit 1, 20 tests, 19 pass, 1 fail, head `6281af76`, dirty=false |
| `.agent/test-results/BOOT-001/latest-regression-red.json` | exit 1, 13 tests, 8 pass, 5 fail, head `6281af76`, dirty=false |

`node .agent/tools/validate.mjs state` printed `state: OK` after phase B.

## Results

**Phase A: green on the unmodified script.** No matrix expectation was wrong against `script.js`; no BLOCKED condition arose. Ordering note: I first recorded the two green runs on the uncommitted tree (dirty=true), then committed, then re-recorded them on the clean commit. The `latest-*-green.json` files are the clean re-run; the dirty run's timestamped copies are gitignored.

**Mutation probes** (in-memory only, via `CALC_STUB_TRANSFORM`, nothing on disk changed, nothing committed; probes ran the 27 phase A tests):

| Probe (JSON `find` to `replace`, in `script.js`) | Result | Named tests that failed |
|---|---|---|
| P1 `1e10` to `1e9` (2 occurrences) | 26 pass, 1 fail | README floating-point rounding trims noise and limits decimals |
| P2 `else if (resetOnNextInput)` to `else if (false)` | 26 pass, 1 fail | a second operator press replaces the first on the page |
| P3 decimal guard `number === '.' && currentInput.includes('.')` to `false` | 26 pass, 1 fail | ignores a second decimal point typed through the buttons |
| P4 `if (operator !== null) {` to `if (false) {` (chain resolve removed) | 22 pass, 5 fail | a decimal point after an operator starts 0. in the next operand on the page; updates the display through textContent without writing markup; README equals shows the expression on the small line and the result below; README chained calculations evaluate left to right; README operator right after equals continues from the result |
| P5 `if (currentInput === 'Error') {` to `if (false) {` (Error-first clearing) | 26 pass, 1 fail | an operator after Error clears first and starts from 0 on the page |
| P6 `if (resetOnNextInput \|\| currentInput === 'Error') {` to `if (currentInput === 'Error') {` (DEL) | 26 pass, 1 fail | DEL right after an operator clears the whole calculation on the page |
| P7 `currentDisplay.textContent = liveExpression` to `currentDisplay.innerHTML = liveExpression` | 25 pass, 2 fail | updates the display through textContent without writing markup; treats a button data attribute containing markup as inert text |
| P8 `if (currentInput === 'Error' \|\| justCalculated) {` to `if (currentInput === 'Error') {` | 26 pass, 1 fail | a digit after a result starts a new calculation on the page |
| P9 control, no transform | 27 pass, 0 fail | none |

The probe driver lived in the session scratchpad and is not committed; the table above gives the exact specs, so a reviewer can reproduce each with `CALC_STUB_TRANSFORM='{"file":"script.js","find":"...","replace":"...","count":N}'`. The driver's first attempt failed on a spawn error (explicit `cwd` gave ENOENT); results above are from the corrected run using `process.cwd()`, and the control passed.

**Phase B: RED, and why each test fails** (identical messages confirmed in a fresh run and in the evidence files):
- `loads calculator-core.js before script.js in index.html` fails on `boundary: index.html must list calculator-core.js (found ["script.js"])`. Cause: `index.html` does not list the core yet. AC-6 reason.
- All five `source-safety` rows fail on `AC-7 scan: shipped file calculator-core.js does not exist (...)`. Cause: the core file is absent and every row reads all three shipped files first. AC-7 reason.
- All six are `AssertionError`s from my intended assertions, not import, syntax or ENOENT errors in the test code.

**Scan pattern check.** Because the RED rows stop at the missing file, the patterns themselves never ran against JS during RED. I checked them separately with a scratchpad script (not committed): 35 of 35 checks passed, covering flagged forms (statement `import`/`export`, `export default`, dynamic `import(`, `import.meta`, `eval (x)`, `const f = eval;`, `new   Function`, `Function (`, `document . write`, `document.writeln`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, an `https://` string, a `'//host'` string, `type="module"` in either quote style and any case), non-flagged forms (`module.exports`, `globalThis` guard, the same words inside `//` and `/* */` comments), and `script.js` and `index.html` clean today.

## Registry diff (`tests/regression/REGISTRY.md`)
Removed the `_(none yet)_` placeholder row. Added 13 rows, origin `BOOT-001`: the 8 `readme-behavior.test.js` names (phase A commit) and the 5 `source-safety.test.js` names (phase B commit). Each row states the README or CLAUDE.md behavior preserved.

## Decisions made
- No new decision record; no pre-existing test was changed (there were none). D-002 governed the order.
- Added `tests/helpers/source-scan.js`, which the dispatch did not name, so the scan patterns could be checked independently of the RED run. It is inside `tests/helpers/**` ownership.
- The stub defines `window` as a self-reference of the vm global (a real page has it). The matrix required `document` and no `module`/`exports`/`require`; `window` is additive. If the implementer wants the core loaded with no `window` in the integration layer, say so and I will remove it.
- `\beval\b` is used instead of `eval(` (superset, as the matrix AC-7 note suggests).

## Known risks
- Matrix observation (non-blocking): the "Stub self-tests" paragraph says the initial-display row would fail if the scripts did not run. It would not, because `index.html` already contains `0` and an empty expression line. I mitigated this in the row by also asserting `page.executedScripts` equals the script list, and the click rows all differ from the initial `0`. The matrix text could be corrected at the next replan.
- RK-1 residual unchanged: the mid-chain divide-by-zero path (`5 / 0 +` and follow-ups) is not tested and no sequence applies an operator after a zero divisor. The only `/ 0` sequences end in `=` (`5 / 0 =`, `5 / 0 = AC`, `5 / 0 = DEL`, `5 / 0 = 7`); `5 / 0 = +` applies an operator to the `Error` state after `=`, which is the matrix row for the Error-then-operator case, not a pending zero divisor.
- Behavior differences between the stub and a browser: listener exceptions propagate to the caller (a browser only reports them); `innerHTML`/`outerHTML` reads throw; capture-phase listeners throw; markup writes are trapped and kept as literal text, never parsed; only compound simple selectors are supported.
- The comment stripper mishandles a regex literal containing a quote or `//`; neither shipped script has one today. The implementer's core must not introduce one, or the scan needs revisiting.

## UNVERIFIED
- Real browser rendering, CSS, dark theme and responsive layout, focus ring, touch and double-click selection.
- Real `file://` loading (proven only by proxy: classic scripts only, listed relative paths that exist, no `type="module"`, the load-order row).
- The matrix's own oracle runs (the test-designer's throwaway probes) are now reproduced by machine evidence on the unmodified script: 19 integration and 8 regression rows green at `d9bd52bc`.
- Post-extraction behavior: nothing yet. The safety net has only run against the unmodified script.
- Static scans against `calculator-core.js`: pattern behavior is checked on synthetic samples only until the core exists.

## Outstanding issues
none blocking.

## Required next action
Dispatch the `implementer` for `BOOT-001` on this branch (head `4d54c36` plus this handoff): write `tests/unit/calculator-core.test.js` RED, then `calculator-core.js`, thin `script.js`, `index.html` listing `calculator-core.js` before `script.js`, the core-API decision record and the README Files section. The exit check is that `node .agent/tools/run-gate.mjs integration --unit BOOT-001` and `... regression ...` are green with the 19 and 8 phase A rows unchanged and the six phase B RED rows now passing (20 integration, 13 regression).
