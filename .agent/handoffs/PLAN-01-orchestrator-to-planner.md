---
unit: PLAN
from: orchestrator
to: planner
sequence: 01
model_attested: claude-sonnet-5
state: NEW
---

# Handoff PLAN-01: orchestrator → planner

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (user selected via /model); announced to the user. The planner is spawned without a `model` parameter and must attest its own model.

## Context
User request (verbatim intent): "add keyboard input to the calculator", with the test-driven approach from CLAUDE.md followed.

Facts verified this session:
- Repo: branch `main`, HEAD `6613b3c`. Workflow scaffold (`CLAUDE.md`, `.claude/`, `.agent/`, `docs/`, `tests/`, `.gitignore`) is UNTRACKED. `run-gate.mjs:36` treats untracked files outside `.agent/` as dirty, so no gate evidence is valid until it is committed (orchestrator is raising this with the user; not planner scope).
- `.agent/units/` is empty; `.agent/plan.md` is the placeholder. `validate.mjs agents` = OK, `validate.mjs state` = OK.
- `tests/` contains only `tests/regression/REGISTRY.md`. There are no tests of any kind for the calculator.
- `script.js` touches the DOM at load (`document.getElementById`, `addEventListener` at top level) and keeps global mutable state, so Node tests cannot import it. CLAUDE.md §1 makes `BOOT-001` (characterization tests of current behavior, then extraction of a pure calculator core with dual browser/Node export) the mandatory first unit before any feature work; `.agent/plan.md` also recommends it.
- Constraint: must keep working via `file://` (classic `<script>` only, no ES modules, no build step); zero dependencies (D-001).
- Current click wiring: one delegated `click` listener on `.buttons` reading `data-number`, `data-operator`, `data-action` (`clear`, `delete`, `equals`); then `updateDisplay()`. Operators are stored as `+ - * /`; display symbols are `+ − × ÷`.
- README-documented behavior is the regression baseline (live expression trail, `=` splits into dimmed expression + bold answer, left-to-right chaining, continue from result, decimals, `Error` on divide-by-zero, responsive).
- Earlier the user wrote "pressing enter" meaning the `=` action; that is now the Enter key.

## Acceptance criteria
None yet; you are producing them. Every AC must be testable and observable.

## Relevant files
- CLAUDE.md — constitution (§1, §4, §7, §11, §14)
- .agent/plan.md — placeholder to replace
- .agent/templates/unit.md — unit format
- .agent/decisions/D-001-toolchain.md — toolchain constraint
- script.js, index.html, style.css, README.md — current behavior
- tests/regression/REGISTRY.md — regression registry format

## Tests created / executed
none

## Results
n/a

## Decisions made
- Orchestrator will not skip BOOT-001: keyboard work depends on it (CLAUDE.md §1).

## Known risks
Ideas to evaluate, not conclusions:
- After a mouse click a `<button>` keeps focus, so pressing Enter or Space can fire a native click on that button in addition to a key handler (double action). Decide and test how to avoid it.
- Do not hijack browser/OS shortcuts (Ctrl/Cmd/Alt combos, Tab, F-keys); `event.key` vs `event.code`; held-key repeat; numpad keys.
- Keyboard input reaches the same state machine as clicks; a single shared dispatch path is preferred over duplicated logic.
- Input handling is a security-review trigger (CLAUDE.md §8): only known keys map to actions; nothing input-derived reaches `innerHTML`/`eval`.

## Outstanding issues
Please list as open questions rather than guessing (CLAUDE.md §6 ASK): the exact key map (Enter and `=` → equals; Backspace → DEL; Escape / Delete → AC; `x`/`X`/`*` → ×; `/` → ÷; `,` as decimal or not; Space/Enter on a focused button), visual press feedback on the on-screen key, and whether the BOOT-001 extraction should also move `updateDisplay` state derivation into the core.

## Required next action
Write `.agent/plan.md` (goal, tier + reason per unit, approach, unit graph, risks, open questions; keep a line `Model check: orchestrator session on claude-sonnet-5 (FALLBACK(opus->sonnet))`) and one `.agent/units/<ID>.md` per unit at status `PLANNED` (at minimum `BOOT-001` then a keyboard unit that `depends_on` it; split further if a unit cannot be verified independently). Return the plan path, unit IDs in dependency order, and the open questions that need the user, in ≤5 lines plus your handoff path `.agent/handoffs/PLAN-02-planner-to-orchestrator.md`.
