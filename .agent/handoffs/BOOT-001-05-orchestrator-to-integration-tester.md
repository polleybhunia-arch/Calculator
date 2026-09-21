---
unit: BOOT-001
from: orchestrator
to: integration-tester
sequence: 05
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff BOOT-001-05: orchestrator → integration-tester

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). integration-tester is a Sonnet agent (no fallback); attest your own model.

## Context
`BOOT-001` (characterize current behavior, then extract `calculator-core.js`) is `IN_PROGRESS` on branch `agent/BOOT-001-core-extraction`. **Your normal precondition "implementer's TDD evidence exists" is deliberately overridden for this unit** by decision `.agent/decisions/D-002-boot001-stage-order.md`: the matrix requires the safety net to be written, green and committed against the **unmodified** `script.js` before any extraction edit, so you run first and the implementer runs after you. Read D-002 first.

Verified facts:
- Baseline for product files: `e02035b` (`script.js`, `index.html`, `style.css`, `README.md` unchanged since). Branch head at dispatch is the commit that adds D-002 and this handoff. Do not modify any production file.
- `tests/` holds only `tests/regression/REGISTRY.md`. Zero calculator tests exist.
- Runner and conventions: `node:test` + `node:assert/strict`, files `tests/<layer>/<subject>.test.js`, 2-space indent, single quotes, semicolons, `const`/`let`, no `eval`/`innerHTML`, classic scripts only. D-001: no dependencies; DOM stub in `tests/helpers/` driving the page scripts via `node:vm`.
- `.agent/gates.json`: `integration` = `node --test "tests/integration/**/*.test.js"`, `regression` = `node --test "tests/regression/**/*.test.js"`, each with `min_tests: 1`.
- Matrix: `.agent/units/BOOT-001.matrix.md` (84+ named rows, AC-1…AC-8). **Column 2 of each row is the literal test title**; `validate.mjs state` fails if a named test is missing verbatim. Read the "Notation", "Stub fidelity requirements" (six items) and "Test files, layers and TDD phase" sections before writing anything.
- The mid-chain divide-by-zero path (`5 / 0 +` and follow-ups) is deliberately NOT tested here (OQ-B1, owned by CALC-001). Do not assert any expectation for it.

## Acceptance criteria
`.agent/units/BOOT-001.md` AC-6 and AC-7 (your layers). AC-1…AC-5 and AC-8 are the implementer's unit suite.

## Relevant files
- `.agent/units/BOOT-001.matrix.md` — rows for `tests/integration/dom-click.test.js`, `tests/regression/readme-behavior.test.js`, `tests/regression/source-safety.test.js`
- `.agent/decisions/D-002-boot001-stage-order.md`, `.agent/decisions/D-001-toolchain.md`
- `script.js`, `index.html`, `README.md` — behavior to characterize (read only)
- `tests/regression/REGISTRY.md` — add rows
- `.claude/skills/integration-testing/SKILL.md`, `.claude/skills/regression-testing/SKILL.md`

## Tests created / executed
none yet

## Results
n/a

## Decisions made
- D-002 (stage order). The RED integration row and `source-safety.test.js` are committed only in phase B, so the safety net gets a clean GREEN evidence run first.

## Known risks
- RK-2 stub fidelity: implement the six stub requirements in the matrix; anything the stub cannot model is reported `UNVERIFIED`, never weakened.
- The stub must not depend on the new core's API: it parses the real `index.html`, runs every `<script src>` in document order in one `node:vm` context that defines `document` but no `module`/`exports`/`require`, and works both before extraction (only `script.js`) and after (core + `script.js`). Provide a `press(tokens)`-style helper returning `{ expression, current }`, and expose `document.addEventListener` now (KEY-001 will extend the stub).
- AC-7 static scans: strip `//` and `/* */` comments from the two JS files first; a missing `calculator-core.js` must FAIL the test, never skip it. Use whitespace-tolerant patterns, for example `\beval\s*\(`, `\bnew\s+Function\b`, `\bFunction\s*\(`, `document\s*\.\s*write`, so `eval (x)` is not missed.
- Mutation probes must not modify production files on disk (write policy, and you never modify production code). Give the stub an optional, default-off in-memory source transform (for example an environment variable read only inside `tests/helpers/`) so a probe can change `script.js` source text in memory, then run the suite and confirm it fails.

## Outstanding issues
none

## Required next action
Work in this exact order and commit each step on the current branch, commit messages `BOOT-001: <imperative summary>`, never push:

**Phase A — safety net, green against the unmodified `script.js`.**
1. Write `tests/helpers/dom-stub.js`; `tests/integration/dom-click.test.js` with every integration row of the matrix **except** `"loads calculator-core.js before script.js in index.html"`; `tests/regression/readme-behavior.test.js` (8 rows). Use each matrix name verbatim.
2. Run `node .agent/tools/run-gate.mjs integration --unit BOOT-001 --phase green` and `node .agent/tools/run-gate.mjs regression --unit BOOT-001 --phase green`. Both must pass on the unmodified scripts. If an expectation in the matrix turns out wrong against the unmodified script, that is a matrix defect: stop and return `BLOCKED` naming the row; do not adjust the expectation to whatever passes.
3. Run at least three mutation probes on the unmodified logic through the in-memory transform (suggested: change the rounding constant `1e10`, remove the operator-replacement branch in `chooseOperator`, remove the single-decimal-point guard in `appendNumber`). For each, record which named tests failed and confirm the unmutated run is green again. Do not commit any mutation.
4. Add the 8 `readme-behavior` rows to `tests/regression/REGISTRY.md` (origin `BOOT-001`, following the file's format). Commit phase A (tree clean).

**Phase B — RED-first rows.**
5. Add `"loads calculator-core.js before script.js in index.html"` to `dom-click.test.js` and write `tests/regression/source-safety.test.js` (5 rows). Run `integration --phase red` and `regression --phase red` and read the output: each new test must fail for the AC-stated reason (core file absent / not listed in `index.html`), not for an import or syntax error in your own test. Add the 5 `source-safety` rows to `REGISTRY.md`. Commit phase B (tree clean).

Return `.agent/handoffs/BOOT-001-06-integration-tester-to-orchestrator.md` (template `.agent/templates/handoff.md`) with: commit SHAs per phase, run-gate evidence file paths with one-line facts, the mutation probe table, why each RED test fails, registry diff, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. If anything blocks you, return `BLOCKED` naming the gap instead of proceeding on assumption.
