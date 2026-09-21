# Plan — Keyboard input for the calculator

**Author**: planner@claude-opus-5 · 2026-09-21
**Model check**: orchestrator session on claude-sonnet-5 (FALLBACK(opus->sonnet)); planner attests claude-opus-5 (no fallback).

## Goal

A user can operate the calculator entirely from a physical keyboard: typing digits, a decimal
point, `+ - * /`, Enter/`=`, Backspace and Escape produces exactly the same observable display
behavior as clicking the corresponding on-screen buttons, with no duplicated action when a
button has focus, no hijacking of browser/OS shortcuts, and every behavior documented in
[README.md](../README.md) preserved. Because `script.js` cannot be imported by Node tests
today, the work starts with the mandatory bootstrap unit (CLAUDE.md §1) so that every later
unit can follow Red → Green → Refactor.

## Tier

**T2** overall — multi-unit, introduces a new module boundary (`calculator-core.js`) and a new
input channel; `architecture-reviewer` is required for the boundary and `security-reviewer`
for the input-handling surface (CLAUDE.md §7, §8).

| Unit | Tier | Reason |
|---|---|---|
| BOOT-001 | T2 | New module boundary + refactor of all existing behavior → architecture review |
| KEY-001 | T2 | New input channel crossing core + DOM layer, changes user-visible behavior → security review |
| KEY-002 | T1 | Small, isolated presentation change (press feedback), no state-machine change |

## Requirements

| ID | Statement | Source | Priority |
|---|---|---|---|
| R-01 | Digits `0`–`9` (main row and numpad) enter digits | user | must |
| R-02 | `.` (and numpad `.`) enters a decimal point | user | must |
| R-03 | `+ - * /` choose the corresponding operator (display symbols stay `+ − × ÷`) | user | must |
| R-04 | `Enter` and `=` perform equals | user / handoff PLAN-01 | must |
| R-05 | `Backspace` performs DEL, `Escape` performs AC | user (proposed) | must — see OQ-1 |
| R-06 | Unmapped keys and modifier combos (Ctrl/Cmd/Alt) change nothing and keep their browser meaning | implicit (non-functional) | must |
| R-07 | A key press performs the action exactly once, including when an on-screen button has focus | implicit (defect class) | must |
| R-08 | Keyboard and mouse share one dispatch path and one state machine | CLAUDE.md §4 (small pure functions, one DOM layer) | must |
| R-09 | All README-documented behavior is unchanged (trail, `=` split, chaining, continue-from-result, decimals, `Error`, responsive) | README (baseline) | must |
| R-10 | Works from `file://` — classic `<script>` only, no ES modules, no build step, zero dependencies | README / D-001 | must |
| R-11 | Logic is importable and unit-testable in Node without a DOM | CLAUDE.md §1 | must |
| R-12 | The on-screen button corresponding to a pressed key shows press feedback | user (proposed) | should — see OQ-5 |
| R-13 | README documents the key map | CLAUDE.md §4 (docs) | must |

Out of scope (not planned; would need a new request): percent/sign/memory keys, copy-paste of
expressions, parentheses or precedence, holding a key to accelerate beyond native auto-repeat,
on-screen focus ring redesign, touch/gesture input, any new dependency or browser test runner.

## Approach

### Chosen: extract a pure core, then feed it from two thin input adapters

1. `calculator-core.js` — a new classic script holding the whole state machine as pure
   functions plus display derivation, with a dual export guard
   (`typeof module !== 'undefined' ? module.exports = API : globalThis.CalculatorCore = API`),
   exactly as D-001 prescribes. Recommended shape (the implementer may rename, provided the
   ACs stay provable):
   - `createState()` → fresh state object
   - `applyInput(state, input)` → new state, where `input` is `{ type: 'number'|'operator'|'action', value }`
   - `render(state)` → `{ expression, current }` — the two display strings
   - `mapKey(key, modifiers)` → the same `input` descriptor, or `null` for unmapped keys (added in KEY-001)
2. `script.js` keeps only DOM work: read `data-*` from a clicked button **or** ask
   `mapKey()` for a pressed key, call `applyInput`, write `render()` output with
   `textContent`. One `dispatch(input)` function is the single entry point for both channels
   (R-08).
3. `index.html` loads `calculator-core.js` before `script.js` with plain `<script src>` tags
   (R-10).
4. Node tests: `tests/unit` requires the core directly; `tests/integration` and
   `tests/regression` drive `index.html`'s scripts through the in-repo DOM stub in
   `tests/helpers/` via `node:vm` (D-001), dispatching synthetic `click` and `keydown` events.

Why: it removes the testability debt once, keeps mouse and keyboard on one verified state
machine, and adds no dependency or build step.

### Alternatives rejected

- **Keyboard handler that synthesizes clicks on buttons** (`button.click()` for a mapped key).
  Tempting and tiny, but it routes behavior through DOM lookups, makes the mapping untestable
  in Node, and makes the focus/double-fire problem worse. Rejected.
- **Keyboard first, extraction later.** Violates CLAUDE.md §1 (BOOT-001 precedes feature work)
  and would force TDD on un-importable code. Rejected.
- **ES modules + a bundler** for a clean import story. Breaks `file://` (README Option 1) and
  D-001. Rejected.

### Key-map policy (subject to OQ-1 … OQ-4)

Use `event.key` (layout-normalized, gives `.` / `,` / `Enter` / `Backspace` / `Escape` and
numpad values) rather than `event.code`. Ignore any event with `ctrlKey`, `metaKey` or
`altKey`. Call `preventDefault()` only for keys the map recognizes (so `/` does not open
Firefox quick-find and `Backspace` does not navigate back), never for unmapped keys, and never
for `Tab`. Listener is registered on `document` so the calculator responds without focusing it.

## Unit graph

```
BOOT-001  (no deps)
   └── KEY-001  depends_on: BOOT-001
          └── KEY-002  depends_on: KEY-001
```

| Unit | Title | depends_on | Delivers |
|---|---|---|---|
| BOOT-001 | Characterize current behavior and extract a testable calculator core | — | Importable pure core + characterization/regression safety net; zero behavior change |
| KEY-001 | Keyboard input drives the calculator | BOOT-001 | R-01…R-08, R-13 |
| KEY-002 | On-screen press feedback for keyboard input | KEY-001 | R-12 |

Execution order: **BOOT-001 → KEY-001 → KEY-002**. KEY-002 is optional and drops out entirely
if the user answers "no" to OQ-5.

## Regression plan

| Unit | Existing behavior at risk | Coverage |
|---|---|---|
| BOOT-001 | Everything in README — the extraction rewrites every code path | Characterization integration tests written against the **unmodified** `script.js` first, kept green through the extraction; promoted into `tests/regression` and listed in `tests/regression/REGISTRY.md` |
| KEY-001 | Mouse click path, expression trail, `=` split, Error recovery; browser shortcuts and button focus activation | Regression tests: every README sequence still passes via clicks after the keyboard listener exists; new regression tests for key/click equivalence and for "modifier combo does nothing" |
| KEY-002 | Button styling, responsive layout, keyboard behavior from KEY-001 | Regression test that feedback never alters calculator state; CSS/visual aspects recorded `UNVERIFIED` (no browser, D-001) |

## Risk register

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| RK-1 | Extraction silently changes behavior | High | Characterization suite green **before** extraction on unmodified `script.js`, rerun after; architecture review (BOOT-001 is T2) |
| RK-2 | DOM stub fidelity: `activeElement`, native Enter/Space activation of a focused `<button>`, `event.repeat`, `defaultPrevented` must be modeled or the double-fire ACs prove nothing | High | Stub capabilities are explicit ACs/test requirements in KEY-001; anything the stub cannot model is recorded `UNVERIFIED` with residual risk (CLAUDE.md §16) |
| RK-3 | No real browser available (D-001 residual) | Medium | Manual verification checklist handed to the user; never claimed as PASS |
| RK-4 | `file://` breakage from script order or module syntax | High | AC + integration test that loads both scripts in `index.html` order with no module syntax |
| RK-5 | Over-broad `preventDefault()` breaks browser shortcuts / accessibility | Medium | R-06/R-07 ACs; security review of the input surface |
| RK-6 | New JS file `calculator-core.js` is not covered by the lint gate (`node --check script.js`), and only the human may edit `.agent/gates.json` | Medium | OQ-7: user updates the lint command before BOOT-001 can reach gate 8 honestly |
| RK-7 | Workflow scaffold is untracked, so `run-gate` marks every run dirty and no evidence is valid | High | Orchestrator's item (raised in PLAN-01); must be resolved before BOOT-001 starts |
| RK-8 | Held-key auto-repeat could spam `=` or digits | Low | OQ-4 decides; test either way |
| RK-9 | Scope creep into precedence/percent/memory while touching the core | Medium | Out-of-scope list above; reviewer checks the diff against it |

## Open questions

Blocking questions must be answered by the **user** before the named unit can leave `PLANNED`.
Each carries a proposed default so the answer can be one line.

| ID | Question | Proposed default | Owner | Blocks |
|---|---|---|---|---|
| OQ-1 | Exact key map. Confirm: digits `0`–`9` + numpad → digits; `.` and numpad `.` → decimal; `+ - * /` → operators; `Enter` and `=` → equals; `Backspace` → DEL; `Escape` → AC. Also wanted? (a) `x`/`X` → ×, (b) `:` → ÷, (c) `,` → decimal point (comma-decimal keyboards), (d) `Delete` → AC, (e) `c`/`C` → AC | Yes to the confirmed list; yes to (a) `x`/`X`, (c) `,`, (d) `Delete`; no to (b) `:` and (e) `c`/`C` | user | KEY-001 |
| OQ-2 | Should mapped keys call `preventDefault()` (so `/` does not open Firefox quick-find and `Backspace` does not navigate back)? | Yes, for mapped keys only, never with a modifier held, never for `Tab` | user | KEY-001 |
| OQ-3 | When an on-screen button has focus (after a click or Tab), `Enter`/`Space` natively activates it. Keep native activation for accessibility and have the key handler ignore `Enter`/`Space` when the event target is a calculator button (so the action happens exactly once)? Or blur the button after a click and let the handler own `Enter`? | Keep native activation; handler ignores `Enter`/`Space` originating on a calculator button; `Space` is otherwise unmapped | user | KEY-001 |
| OQ-4 | Held-key auto-repeat (`event.repeat`): allow it (holding `7` types `7777`, holding `Backspace` deletes repeatedly) — and does it also apply to `Enter`/`=`? | Allow repeat for digits, `.` and `Backspace`; ignore repeated `Enter`/`=` and repeated operators | user | KEY-001 |
| OQ-5 | Visual press feedback: should the matching on-screen button flash when its key is pressed? If yes, is a ~120 ms highlight (CSS class toggled on keydown/keyup) acceptable, knowing it cannot be verified without a browser? | Yes, ~120 ms highlight via a `data-`/class toggle | user | KEY-002 (unit is dropped if "no") |
| OQ-6 | Should BOOT-001 also move display-string derivation (`updateDisplay`'s expression/current strings) into the pure core, leaving `script.js` to assign `textContent` only? | Yes — it is what makes keyboard behavior unit-testable without a DOM | user | BOOT-001 |
| OQ-7 | `.agent/gates.json` lint command is `node --check script.js` and only the human may edit it. Will you extend it to cover `calculator-core.js` (e.g. `node --check script.js && node --check calculator-core.js`)? | Yes, before BOOT-001 reaches gate 8 | user | BOOT-001 gate 8 (not READY) |
| OQ-8 | Non-blocking: does anything else on the page ever need keyboard focus (future input field)? A `document`-level listener assumes no. | No; `document`-level listener is fine | user | — |

## Notes for the orchestrator

- Security review is **required** for KEY-001 (input handling, CLAUDE.md §8); architecture
  review is required for BOOT-001 (new module boundary, T2).
- BOOT-001's TDD framing: the RED run comes from `tests/unit` requiring `calculator-core.js`
  before it exists; the characterization integration tests are a safety net written against
  the unmodified `script.js` and are expected to be green from the start — that is not a TDD
  violation and should be logged as such.
- No commit may occur between `APPROVED` and `COMPLETE` (CLAUDE.md §11).
