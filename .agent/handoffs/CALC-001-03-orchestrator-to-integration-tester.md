---
unit: CALC-001
from: orchestrator
to: integration-tester
sequence: 03
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff CALC-001-03: orchestrator → integration-tester

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). integration-tester is a Sonnet agent (no fallback); attest your own model.

## Context
`CALC-001` (show `Error` immediately when a divide-by-zero is resolved by an operator press) is `IN_PROGRESS` on branch `agent/CALC-001-midchain-divide-by-zero`, stacked on the completed `BOOT-001` branch. **Your normal precondition "implementer's TDD evidence exists" is deliberately overridden** by decision `.agent/decisions/D-006-calc001-stage-order.md`: your integration and regression tests must be written and shown RED on the unmodified core before the implementer fixes it (CLAUDE.md §14). Read D-006 and D-007 first.

Verified facts:
- `calculator-core.js`, `script.js`, `index.html`, `README.md` are unmodified since `BOOT-001` completed; the defect reproduces on this tree: `5 / 0 +` renders expression `` (empty), current `5÷0+`.
- Spec: `.agent/units/CALC-001.md` (AC-1…AC-6). Matrix: `.agent/units/CALC-001.matrix.md`. It has a pre-fix versus post-fix reference table, a "Pre-fix result and TDD phase" column, and the rules on names and file placement. **Column 2 is the literal test title**; use it verbatim.
- Existing helpers: `tests/helpers/dom-stub.js` (`loadPage()`, `press(tokens)`), read only. Existing test files and both helpers must stay byte-for-byte unmodified; only new files plus an append-only edit of `tests/regression/REGISTRY.md` are allowed (D-007).
- Gate commands (`.agent/gates.json`): `integration` = `node --test "tests/integration/**/*.test.js"`, `regression` = `node --test "tests/regression/**/*.test.js"`; the new files are picked up by those globs.
- Baseline counts before your work: integration 20 tests, regression 13 tests, all passing.
- Conventions: `node:test` + `node:assert/strict`, 2-space indent, single quotes, semicolons, `const`/`let`, no `eval`/`innerHTML`, no `.only`/`.skip`, whole-pair deep equality on `{ expression, current }` so a stray character on either line fails.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1, AC-2, AC-3, AC-4, AC-6 in your layers (AC-5 is the unchanged BOOT-001 suites).

## Relevant files
- `.agent/units/CALC-001.matrix.md` — integration table (2 rows), regression table (4 rows), RED reference table, AC-4 vacuity note, AC-6 oracle
- `.agent/decisions/D-006`, `D-007`, `.agent/decisions/D-005-layering-rule.md`
- `tests/helpers/dom-stub.js`, `tests/integration/dom-click.test.js`, `tests/regression/readme-behavior.test.js` (patterns to follow; read only)
- `README.md` (read only: the AC-6 row reads it)
- `tests/regression/REGISTRY.md` (append four rows)

## Tests created / executed
none yet

## Results
n/a

## Decisions made
- D-006 (stage order), D-007 (registry append).
- The implementer, not you, writes `tests/unit/divide-by-zero.test.js`.

## Known risks
- **AC-4 vacuity (matrix "AC notes")**: four of the five recovery inputs render the same values before and after the fix, so each AC-4 row must first assert the precondition "after `5 / 0 +` the page shows expression `5÷0` and current `Error`", **before** any recovery click. Without that assertion the row passes on the unfixed core and is not a RED.
- A RED for the wrong reason (missing file, `TypeError`, import error) is not a RED. Failures must be assertion messages showing the pre-fix values (for example actual current `5÷0+`, expected `Error`).
- The AC-6 row is a static check of `README.md` (matrix has the exact locating regex and the four required tokens). It must fail today because the README bullet lacks three of the four tokens, and it must never skip if the bullet is missing. It stays red until the documenter edits the README in a later step; that is expected.

## Outstanding issues
none

## Required next action
On this branch, commit messages `CALC-001: <imperative summary>`, never push, never touch production files (`calculator-core.js`, `script.js`, `index.html`, `README.md`, `style.css`) or existing test files/helpers. Commit code first, then run the gate on the clean commit, then commit the evidence.
1. Write `tests/integration/divide-by-zero-click.test.js` (2 rows) and `tests/regression/divide-by-zero.test.js` (4 rows), titles verbatim from the matrix.
2. Append the four `tests/regression/REGISTRY.md` rows (origin `CALC-001`, format of the existing rows, behavior preserved as listed in the matrix "Registry rows to add"); existing rows unchanged, append-only. Commit.
3. Run `node .agent/tools/run-gate.mjs integration --unit CALC-001 --phase red` and `node .agent/tools/run-gate.mjs regression --unit CALC-001 --phase red`. Read the output and confirm exactly: integration 22 tests with 2 failing (the 2 new rows) and 20 passing; regression 17 tests with 4 failing (the 3 behavior rows and the README row) and 13 passing. If any new row passes, stop and report it as `BOOT-001` behavior drift instead of claiming a RED. Commit the evidence.
4. Prove the new rows would pass once fixed, without touching production files on disk: use the stub's in-memory `CALC_STUB_TRANSFORM` (read `tests/helpers/dom-stub.js` for the contract) to apply a minimal in-memory patch to `calculator-core.js` that makes an operator press resolving a zero divisor behave like `=`, run the two new files, and report that the 2 integration rows and the 3 behavior regression rows then pass (the README row still fails). Do not commit any patch. `git status` must show no production change.

Return `.agent/handoffs/CALC-001-04-integration-tester-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHAs, run-gate evidence paths with one-line facts, per-row RED failure messages, the registry diff, the in-memory fix probe result, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. If anything blocks you, return BLOCKED naming the gap.
