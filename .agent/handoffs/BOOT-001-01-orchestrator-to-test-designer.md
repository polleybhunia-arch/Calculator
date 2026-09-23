---
unit: BOOT-001
from: orchestrator
to: test-designer
sequence: 01
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff BOOT-001-01: orchestrator → test-designer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). test-designer is a Sonnet agent and is spawned without a `model` parameter; attest your own model in your return handoff.

## Context
Gate 2 (TEST DESIGN) for `BOOT-001` (characterize current behavior, then extract a testable `calculator-core.js`). Unit spec: `.agent/units/BOOT-001.md`. Plan: `.agent/plan.md` (approach, RK-1, RK-2, RK-4).

Verified facts:
- Branch `main`, baseline commit `e02035b`, working tree clean outside `.agent/`. `validate.mjs state` = OK before this dispatch.
- Zero calculator tests exist today; `tests/` holds only `tests/regression/REGISTRY.md`.
- Open questions are resolved (user, 2026-09-21): OQ-6 = display-string derivation moves into the core (AC-1…AC-5 stand as written against rendered strings). OQ-7 = lint gate extension is deferred to before gate 8 and is the human's action; it is not test-design scope.
- Runner: `node:test` + `node:assert/strict`; files `tests/<layer>/<subject>.test.js`; gate commands in `.agent/gates.json` (`tests/unit`, `tests/integration`, `tests/regression`). D-001: no dependencies, DOM stub in `tests/helpers/` driving the page scripts via `node:vm`, dual export guard, classic scripts only.
- This unit is a **characterization** unit: expectations for AC-6 and the regression suite must be derived from what the **unmodified `script.js` at `e02035b` actually does**, and must still hold after extraction. If the actual behavior contradicts an AC or the README, do not choose silently: record it as an open question in the matrix.
- Behaviors visible in `script.js` that characterization should pin down (verify, do not assume): `=` with no pending operator is a no-op; `=` pressed immediately after an operator reuses the still-held current value as the second operand; a second `=` after a result is a no-op; `DEL` while `resetOnNextInput` or on `Error` acts as AC; `DEL` reducing a number to empty or `-` becomes `0`; a leading `0` is replaced by the next digit except before `.`; `.` after an operator starts `0.`; a result is rounded via `Math.round(x*1e10)/1e10`; operator pressed on `Error` clears first; typing a digit after a result or `Error` starts a new calculation.

## Acceptance criteria
See `.agent/units/BOOT-001.md` AC-1 … AC-7 (unchanged).

## Relevant files
- `.agent/units/BOOT-001.md` — spec and ACs
- `.agent/templates/matrix.md` — required matrix format
- `.agent/plan.md` — approach and risks
- `.agent/decisions/D-001-toolchain.md` — toolchain constraints
- `script.js`, `index.html`, `style.css`, `README.md` — behavior to characterize
- `tests/regression/REGISTRY.md` — registry format the regression rows must follow
- `CLAUDE.md` §11 (gate 2), §14 (test rules)

## Tests created / executed
none (design only; you write no test code)

## Results
n/a

## Decisions made
- The core's exact API names are the implementer's choice (plan suggests `createState`, `applyInput`, `render`); the matrix must therefore express unit-level expectations in terms of behavior (input sequence → rendered `expression` / `current`), and name the API only as "the core's fresh-state / apply-input / render entry points".

## Known risks
- RK-1 silent behavior drift during extraction; RK-2 DOM-stub fidelity (stub must model `getElementById`, `querySelector`, `addEventListener`, event `target`/`dataset`, `textContent`); RK-4 `file://` loading is proven only by proxy (script tags in order, no module syntax).

## Outstanding issues
none

## Required next action
Write `.agent/units/BOOT-001.matrix.md` from `.agent/templates/matrix.md`: every AC-1…AC-7 mapped to concrete test cases (happy, boundary, invalid, error, edge, security, state, recovery as applicable) with test file path, layer (unit / integration / regression) and an exact expected result (input sequence → expected `#display-expression` / `#display-current` strings). Include the `Required Tests` corner cases from the unit spec and the characterization behaviors listed above. Then write your return handoff `.agent/handoffs/BOOT-001-02-test-designer-to-orchestrator.md` (template `.agent/templates/handoff.md`) and reply with its path plus ≤5 lines. Completion is checkable by `node .agent/tools/validate.mjs state` exiting 0 with every AC covered.
