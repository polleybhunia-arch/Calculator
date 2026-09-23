---
unit: BOOT-001
from: test-designer
to: orchestrator
sequence: 02
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff BOOT-001-02: test-designer → orchestrator

## Context
Gate 2 (TEST DESIGN) content for `BOOT-001`, produced from dispatch `.agent/handoffs/BOOT-001-01-orchestrator-to-test-designer.md`. Baseline `e02035b`; `script.js`, `index.html`, `style.css`, `README.md` verified unchanged since baseline (`git diff --stat e02035b` empty). test-designer is a Sonnet agent, spawned without a `model` parameter (no fallback applies to it).

Characterization expectations were hand-computed first, then confirmed by running the **unmodified** `script.js` through a throwaway in-memory DOM stub (node stdin script; 105 sequences, all hand-computed values matched). Nothing from that run was saved to the repo (the write policy limits this role to the matrix and handoffs), so its reproducibility is `UNVERIFIED` until the implementer's pre-extraction green run of the integration and regression suites exists.

## Acceptance criteria
See `.agent/units/BOOT-001.md` AC-1 … AC-7 (unchanged; no unit file edited).

## Relevant files
- `.agent/units/BOOT-001.matrix.md` — the matrix (84 named rows, notation legend, TDD phase map, stub fidelity requirements, open questions, not-covered list, regression impact, mutation sanity)
- `.agent/units/BOOT-001.md` — spec
- `script.js`, `index.html`, `README.md` — behavior characterized

## Tests created / executed
- created: none (design only)
- executed: `node .agent/tools/validate.mjs state` -> `state: OK`, exit 0 (also checked by script: 84 quoted names, all unique, ASCII, no apostrophes/backslashes/backticks, every AC row has exactly 6 columns)

## Results
Rows per AC: AC-1 5, AC-2 10, AC-3 12, AC-4 9, AC-5 15 (unit, `tests/unit/calculator-core.test.js`, RED-first); AC-6 26 (integration 18 in `tests/integration/dom-click.test.js` + regression 8 in `tests/regression/readme-behavior.test.js`); AC-7 7 (integration 2 + regression 5 in `tests/regression/source-safety.test.js`, static scan).

Coverage by category: happy, boundary, invalid, error, edge, security, state and recovery are all represented (see the "Coverage summary by category" section of the matrix).

TDD map: RED-first = the unit file, the source-safety file, and one integration row ("loads calculator-core.js before script.js in index.html"). Safety net, green from the start against the unmodified script = every other integration row and all `readme-behavior` rows; they must be committed green before the first extraction edit.

## Decisions made
- Unit-layer rows are stated in terms of "fresh-state / apply-input / render" entry points and rendered E/C strings (dispatch decision); the API names come from the implementer's decision record.
- Contested behaviors were **not** turned into required rows (OQ-B1). Behaviors that only the README leaves silent (OQ-B2, OQ-B3) are pinned as the dispatch listed them.
- Number formatting beyond the safe range (`1e+22`, `5e-10`, precision loss) is deliberately not pinned (reason in the matrix "Not covered").
- The unreachable `DEL`-to-`-` branch is recorded as untestable dead code.
- Matrix text avoids apostrophes, backslashes and non-ASCII in test names so any quoting style in the test source reproduces them verbatim.

## Known risks
- RK-1 residual: mid-chain divide-by-zero path (`5 / 0 +` …) is unpinned until OQ-B1 is decided.
- RK-2: the matrix lists six explicit stub fidelity requirements (parse real `index.html`, browser-like vm context with no `module`, event bubbling to the `.buttons` container, markup-write traps, fresh page per test). Anything beyond that is `UNVERIFIED`.
- RK-3/RK-4: `file://` loading and CSS (dimmed small line, responsive layout) stay `UNVERIFIED`.

## Outstanding issues
Open questions surfaced from actual behavior (need a decision, none blocks gate 2):
- **OQ-B1** (contradicts README "Division-by-zero shows Error"): `5 / 0 +` shows `5÷0+` instead of `Error`; then `=` shows expression `5÷0+Error` with current `NaN`. Options in the matrix: (a) pin as characterization and open a defect unit (recommended), (b) leave unpinned + defect unit, (c) fix inside BOOT-001 (breaks "behavior identical"). User or planner decides.
- **OQ-B2**: `5 + =` gives `5+5` = `10` (held value reused). README silent; pinned.
- **OQ-B3**: `DEL` after an operator, `=` or `Error` clears everything including the trail. README silent; pinned.

AC ambiguities for the planner (non-blocking): AC-1 does not name the entry points; AC-4 omits the expression line after `Error` (script shows `5÷0`); DEL/AC/no-op-equals/equals-after-operator appear in "Required Tests" but in no AC (mapped to AC-2/AC-5; suggest an AC-8); AC-6 "recorded expectations" has no committed recording; AC-7 "whole repo searched" scoped to the three named files (please confirm).

Existing tests at risk: none exist (`tests/` holds only `tests/regression/REGISTRY.md`). 13 regression rows must be added to the registry (8 readme-behavior + 5 source-safety), origin `BOOT-001`.

## Required next action
Orchestrator: review `.agent/units/BOOT-001.matrix.md`, obtain the user's decision on OQ-B1 (and optionally OQ-B2/OQ-B3, AC-8), then record gate 2 and move `BOOT-001` PLANNED -> READY; if OQ-B1 resolves to option (a), have the test-designer add the three proposed rows as named AC-6 rows first.
