---
unit: CALC-001
from: orchestrator
to: documenter
sequence: 07
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff CALC-001-07: orchestrator → documenter

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). documenter is a Sonnet agent (no fallback); attest your own model.

## Context
`CALC-001` fixed a defect in `calculator-core.js`: a division by zero that is resolved by pressing an **operator** (instead of `=`) now shows `Error` at once. Example: `5 ÷ 0 +` shows expression `5÷0` and current `Error`; the pressed operator is discarded; a following `=` is ignored; a digit starts a new calculation; an operator starts from `0`; `AC` and `DEL` clear it. Before the fix it showed `5÷0+`, and `=` then showed `NaN`. Verified by the orchestrator: unit 67/67, integration 22/22, regression 16/17 on this branch head, the one failing regression test being the README check this step resolves.

`README.md` currently says (Features section): `- Division-by-zero shows \`Error\``. That is true for `5 ÷ 0 =` but incomplete for a division resolved mid-chain.

This is AC-6 of `.agent/units/CALC-001.md`. The regression test `README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain` (`tests/regression/divide-by-zero.test.js`) is the oracle. Read it and its matrix row (`.agent/units/CALC-001.matrix.md`, AC-6) before editing: it locates the bullet with the first line matching `/^\s*[-*]\s+.*division[\s-]*by[\s-]*zero/i` plus its immediately following non-empty lines that do not start with `- ` or `* `, and requires the bullet text to contain **all four**: the case-sensitive word `Error`; the literal `5 ÷ 0 +` (÷ is U+00F7, single spaces); a match for `/chain/i`; and a match for `/as soon as|immediately|at once/i`. If the wording you need cannot satisfy the row, return to me instead of editing the test.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-6. Documentation only; do not document anything that is not implemented (keyboard input does not exist yet).

## Relevant files
- `README.md` — the only file to edit
- `calculator-core.js` (read only, the fix), `.agent/units/CALC-001.md`, `.agent/units/CALC-001.matrix.md`, `tests/regression/divide-by-zero.test.js` (read only)
- `.claude/skills/documentation/SKILL.md`

## Tests created / executed
none (docs only)

## Results
n/a

## Decisions made
- The documenter runs after the implementer (D-006): the README must describe behavior that now exists.

## Known risks
- Keep the bullet short and in the existing style (one bullet, wrapped lines allowed). Do not restate implementation detail.
- Do not touch other bullets or sections unless a statement is verifiably wrong; list any such finding in your handoff instead.

## Outstanding issues
none

## Required next action
1. Reword the divide-by-zero bullet in `README.md` so it states that `Error` is shown as soon as the division is evaluated, including in the middle of a chain (for example `5 ÷ 0 +`). Verify the claim yourself by running the calculator core in memory (`node -e`, nothing written to disk) on `5 / 0 +` and `5 / 0 =`.
2. Run `node --test tests/regression/divide-by-zero.test.js` and confirm all four rows now pass. Run `node --test "tests/regression/**/*.test.js"` and confirm 17 of 17.
3. Commit with message `CALC-001: update README divide-by-zero bullet` on the current branch (never push), tree clean afterwards.
4. Write `.agent/handoffs/CALC-001-08-documenter-to-orchestrator.md` (template `.agent/templates/handoff.md`) with the old and new bullet text, what you verified, and the commit SHA, and reply with its path plus ≤5 lines.
