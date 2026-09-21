---
unit: BOOT-001
from: orchestrator
to: implementer
sequence: 07
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff BOOT-001-07: orchestrator → implementer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). implementer is a Sonnet agent (no fallback); attest your own model.

## Context
`BOOT-001` is `IN_PROGRESS` on branch `agent/BOOT-001-core-extraction`. The integration-tester has finished (handoff `.agent/handoffs/BOOT-001-06-integration-tester-to-orchestrator.md`, per decision `.agent/decisions/D-002-boot001-stage-order.md`). I re-verified with tools: tree clean, `git diff --stat e02035b -- script.js index.html style.css README.md` empty, `validate.mjs state` = OK, and re-ran the suites myself: integration 20 tests (19 pass, 1 fail: `loads calculator-core.js before script.js in index.html`), regression 13 tests (8 pass, 5 fail: the five `source-safety` rows). Those six failures are the intended RED for your extraction.

The safety net has only ever run against the **unmodified** `script.js`. Your extraction must keep all 19 + 8 phase-A rows green and turn the 6 RED rows green, with no edit to any file under `tests/integration`, `tests/regression`, `tests/helpers` (if one looks wrong: stop, write a `kind: test-change` decision per CLAUDE.md §14 and return it; do not edit first).

Spec: `.agent/units/BOOT-001.md` (AC-1…AC-8). Matrix: `.agent/units/BOOT-001.matrix.md`, unit-layer rows only are yours: `tests/unit/calculator-core.test.js`, **51 rows** (AC-1 5, AC-2 7, AC-3 12, AC-4 9, AC-5 9, AC-8 9). **Column 2 is the literal test title** — use it verbatim; `validate.mjs state` fails if any named test is missing. Read the matrix "Notation" section first (exact glyph code points: `−` U+2212, `×` U+00D7, `÷` U+00F7; negative-number sign is ASCII `-`).

## Acceptance criteria
`.agent/units/BOOT-001.md` AC-1 … AC-8 (unchanged since the matrix was accepted; AC-1 says "at least three" entry points).

## Relevant files
- `script.js`, `index.html`, `README.md` — current behavior; `script.js` and `index.html` change, README gets one Files-section line
- `calculator-core.js` — **new**
- `tests/unit/calculator-core.test.js` — **new**
- `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`, `tests/integration/dom-click.test.js`, `tests/regression/*.test.js` — read only; they are your safety net
- `.agent/decisions/` — write the core-API decision record (next free id `D-003`)
- `.claude/skills/tdd/SKILL.md`, `CLAUDE.md` §4, §5, §14

## Tests created / executed
Existing evidence: `.agent/test-results/BOOT-001/latest-integration-{green,red}.json`, `latest-regression-{green,red}.json`. No `unit` evidence exists yet.

## Results
n/a

## Decisions made
- Stage order D-002. Entry-point names and the input-descriptor shape are **yours** to choose (plan suggests `createState`, `applyInput(state, input)`, `render(state)` → `{ expression, current }`, input `{ type: 'number'|'operator'|'action', value }`); record them in the decision record so AC-1's "names recorded in this unit's core-API decision record" is satisfiable.

## Known risks
- **A missing core must be an assertion failure, not an import error.** For RED to be valid (tdd skill), load the core inside each test through one small helper that first asserts the file exists with a clear message (`assert.ok(existsSync(...), 'calculator-core.js must exist ...')`) and only then loads it. Do not let `require` throw `MODULE_NOT_FOUND` at file top level. For the AC-1 row "loads in a Node process that defines no document or window", load a fresh copy bypassing the require cache (or run the source in a `node:vm` context whose only global is `module = { exports: {} }`).
- **Preserve the mid-chain divide-by-zero defect exactly.** `5 / 0 +` must still show current `5÷0+`, then `=` → expression `5÷0+Error`, current `NaN` (matches the unmodified `script.js`). Do not fix it and do not add a test for it: CALC-001 owns it and needs a genuine RED. Before and after the extraction, check the path by hand with a throwaway script (not committed) and report both observed values in your handoff. If they differ, that is behavior drift: report it, do not accept it.
- Do not put a regex literal containing a quote character or `//` in either shipped JS file: `tests/helpers/source-scan.js` strips comments with a string-aware scanner that mishandles those (integration-tester's note). Prefer string methods or simple patterns.
- Comments only where the *why* is non-obvious; no docstring blocks (CLAUDE.md §4). No `eval`, `new Function`, `innerHTML`/`outerHTML`/`insertAdjacentHTML`, `document.write`, ES `import`/`export`, `type="module"`, or any absolute URL in `index.html`, `script.js`, `calculator-core.js`. Display updates go through `textContent`.
- Unrecognized-input policy is unspecified by any AC (matrix "Not covered"). CLAUDE.md §4 says validate at the boundary and throw on internal invariant violations. Suggested: the DOM layer ignores clicks whose target has no recognized `data-*` attribute and validates values there (digits and `.`, operators `+ - * /`, actions `clear`/`delete`/`equals`); the core throws `TypeError` on a malformed descriptor. Record your choice. The integration rows only require that a click on the `.buttons` container itself changes nothing, and that a button whose `data-number` holds markup produces no markup write and no exception (either literal text or ignored is acceptable).
- `calculator-core.js` must also be checked with `node --check calculator-core.js` by hand: the `lint` gate in `.agent/gates.json` covers `script.js` only and only the human may edit it (OQ-7, deferred to gate 8). Record the manual check in your handoff.

## Outstanding issues
none

## Required next action
Work strictly in TDD order on this branch, commit messages `BOOT-001: <imperative summary>`, never push. Commit **code first, then run the gate on the clean commit, then commit the evidence** (run-gate binds evidence to HEAD and requires a clean tree outside `.agent/`; the integration-tester used the same pattern).
1. **RED**: write `tests/unit/calculator-core.test.js` (51 rows, verbatim names). Commit. Run `node .agent/tools/run-gate.mjs unit --unit BOOT-001 --phase red`. Read the output and state in your handoff why each row fails; every failure must be an assertion about the missing core, not an import or syntax error in your test code. Commit evidence.
2. **GREEN**: write `calculator-core.js` (classic script; dual export guard `typeof module !== 'undefined' && module.exports ? module.exports = API : globalThis.CalculatorCore = API`, D-001; pure functions, no `document`/`window` access, no module-level mutable state, `applyInput` returns a new state and never mutates its argument; `render` derives `{ expression, current }` including the two-line post-`=` view). Reduce `script.js` to DOM work with a single `dispatch(input)` entry point (read elements, validate/translate `data-*`, call the core, write `textContent`). Add `<script src="calculator-core.js"></script>` before `script.js` in `index.html`. Add the core-API decision record. Add `calculator-core.js` to the README "Files" section (one line; no behavior claim changes). Commit. Run `unit --phase green`, then `integration --phase green` and `regression --phase green` (20 and 13 tests, all pass, phase-A names unchanged). Commit evidence.
3. **REFACTOR**: with everything green, remove duplication and clarify names in small steps, re-running the three gates; finish with `unit --phase refactor`. No new behavior, no test edits. Commit, then commit evidence. (Skip only with `tdd_refactor_skip: <reason>` stated in the handoff.)
4. If a failure's cause is not obvious after one attempt, stop guessing and return a request for `debugger` diagnosis with the failing run-file path.

Return `.agent/handoffs/BOOT-001-08-implementer-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHAs per phase, run-gate evidence paths with one-line facts, why each RED row failed, the before/after mid-chain probe values, the manual `node --check calculator-core.js` result, decisions, anything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until the unit, integration and regression gates are green and every matrix-named unit test exists and passes (`node .agent/tools/validate.mjs state` = 0).
