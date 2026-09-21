# Plan — Keyboard input for the calculator

**Author**: planner@claude-opus-5 · 2026-09-21 (revised 2026-09-21T03:53Z, planner@claude-opus-5,
from `.agent/handoffs/PLAN-03-orchestrator-to-planner.md`: OQ-B1…OQ-B3 resolved, `CALC-001` added,
BOOT-001 ACs sharpened)
**Model check**: orchestrator session on claude-sonnet-5 (FALLBACK(opus->sonnet)); planner attests claude-opus-5 (no fallback).

## Goal

A user can operate the calculator entirely from a physical keyboard: typing digits, a decimal
point, `+ - * /`, Enter/`=`, Backspace and Escape produces exactly the same observable display
behavior as clicking the corresponding on-screen buttons, with no duplicated action when a
button has focus, no hijacking of browser/OS shortcuts, and every behavior documented in
[README.md](../README.md) preserved. Because `script.js` cannot be imported by Node tests
today, the work starts with the mandatory bootstrap unit (CLAUDE.md §1) so that every later
unit can follow Red → Green → Refactor. The bootstrap characterization surfaced one defect
(`CALC-001`), which is fixed before the keyboard work touches the same file.

## Tier

**T2** overall — multi-unit, introduces a new module boundary (`calculator-core.js`) and a new
input channel; `architecture-reviewer` is required for the boundary and `security-reviewer`
for the input-handling surface (CLAUDE.md §7, §8).

| Unit | Tier | Reason |
|---|---|---|
| BOOT-001 | T2 | New module boundary + refactor of all existing behavior → architecture review |
| CALC-001 | T1 | One small behavior fix confined to the zero-divisor branch of the core; no new boundary, no new input surface (security review expected `N/A`, orchestrator confirms) |
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
| R-14 | Division by zero shows `Error` as soon as it is evaluated, including when an operator press (not `=`) resolves it | README bullet + user decision on OQ-B1 | must |

Out of scope (not planned; would need a new request): percent/sign/memory keys, copy-paste of
expressions, parentheses or precedence, holding a key to accelerate beyond native auto-repeat,
on-screen focus ring redesign, touch/gesture input, any new dependency or browser test runner.
Also out of scope for `CALC-001`: number formatting for very large/small results (exponent
notation, precision loss) and any other behavior the README leaves silent.

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

### Defect handling: characterize, then fix in its own unit

`BOOT-001`'s test design found that a divide-by-zero resolved by an **operator** press never
shows `Error` (`5 / 0 +` → `5÷0+`; a following `=` → expression `5÷0+Error`, current `NaN`),
contradicting README. The user chose (OQ-B1) to keep `BOOT-001` strictly behavior-preserving —
that path is neither pinned nor fixed there — and to fix it in `CALC-001`, RED first, before any
keyboard work touches the same file. The fix rule: an operator press that triggers a
divide-by-zero leaves exactly the state pressing `=` would have left, and the pressed operator is
discarded.

### Alternatives rejected

- **Keyboard handler that synthesizes clicks on buttons** (`button.click()` for a mapped key).
  Tempting and tiny, but it routes behavior through DOM lookups, makes the mapping untestable
  in Node, and makes the focus/double-fire problem worse. Rejected.
- **Keyboard first, extraction later.** Violates CLAUDE.md §1 (BOOT-001 precedes feature work)
  and would force TDD on un-importable code. Rejected.
- **ES modules + a bundler** for a clean import story. Breaks `file://` (README Option 1) and
  D-001. Rejected.
- **Fixing the divide-by-zero defect inside `BOOT-001`** (matrix option (c)). Rejected by the
  user: it would break "behavior identical", the only property that makes the extraction
  reviewable.
- **Pinning the defect as characterization and fixing it later** (matrix option (a)). Rejected by
  the user: it would write expectations into the suite that the very next unit must delete with a
  `test-change` decision record.

### Key-map policy (OQ-1 … OQ-4 resolved: defaults accepted)

Use `event.key` (layout-normalized, gives `.` / `,` / `Enter` / `Backspace` / `Escape` and
numpad values) rather than `event.code`. Ignore any event with `ctrlKey`, `metaKey` or
`altKey`. Call `preventDefault()` only for keys the map recognizes (so `/` does not open
Firefox quick-find and `Backspace` does not navigate back), never for unmapped keys, and never
for `Tab`. Listener is registered on `document` so the calculator responds without focusing it.

## Unit graph

```
BOOT-001  (no deps)
   └── CALC-001  depends_on: BOOT-001
          └── KEY-001  depends_on: BOOT-001, CALC-001
                 └── KEY-002  depends_on: KEY-001
```

| Unit | Title | depends_on | Delivers |
|---|---|---|---|
| BOOT-001 | Characterize current behavior and extract a testable calculator core | — | Importable pure core + characterization/regression safety net; zero behavior change |
| CALC-001 | Show Error immediately when a divide-by-zero is resolved by an operator press | BOOT-001 | R-14 |
| KEY-001 | Keyboard input drives the calculator | BOOT-001, CALC-001 | R-01…R-08, R-13 |
| KEY-002 | On-screen press feedback for keyboard input | KEY-001 | R-12 |

Execution order: **BOOT-001 → CALC-001 → KEY-001 → KEY-002**. The graph is acyclic.
`CALC-001` is serialized between the extraction and the keyboard work so that only one unit at a
time edits `calculator-core.js` and so KEY-001's parity tests assert the corrected divide-by-zero
behavior. KEY-002 is optional and drops out entirely if the user answers "no" to OQ-5.

## Regression plan

| Unit | Existing behavior at risk | Coverage |
|---|---|---|
| BOOT-001 | Everything in README — the extraction rewrites every code path | Characterization integration tests written against the **unmodified** `script.js` first, kept green through the extraction; promoted into `tests/regression` and listed in `tests/regression/REGISTRY.md` |
| CALC-001 | The `=` divide-by-zero path, operator replacement, chaining, continue-from-result, `AC`/`DEL` — all share the operator transition being changed | BOOT-001's unit/integration/regression suites re-run **unmodified** on the fix head (CALC-001 AC-5); a new `tests/regression/divide-by-zero.test.js` that fails without the fix (CLAUDE.md §14); README bullet updated in the same unit |
| KEY-001 | Mouse click path, expression trail, `=` split, Error recovery; browser shortcuts and button focus activation | Regression tests: every README sequence still passes via clicks after the keyboard listener exists; new regression tests for key/click equivalence (including the fixed mid-chain `Error`) and for "modifier combo does nothing" |
| KEY-002 | Button styling, responsive layout, keyboard behavior from KEY-001 | Regression test that feedback never alters calculator state; CSS/visual aspects recorded `UNVERIFIED` (no browser, D-001) |

## Risk register

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| RK-1 | Extraction silently changes behavior | High | Characterization suite green **before** extraction on unmodified `script.js`, rerun after; architecture review (BOOT-001 is T2). **Residual**: the mid-chain divide-by-zero path is deliberately unpinned in BOOT-001 (OQ-B1) and is owned by CALC-001, whose RED run is the only detector of drift on that one path |
| RK-2 | DOM stub fidelity: `activeElement`, native Enter/Space activation of a focused `<button>`, `event.repeat`, `defaultPrevented` must be modeled or the double-fire ACs prove nothing | High | Stub capabilities are explicit ACs/test requirements in KEY-001; anything the stub cannot model is recorded `UNVERIFIED` with residual risk (CLAUDE.md §16) |
| RK-3 | No real browser available (D-001 residual) | Medium | Manual verification checklist handed to the user; never claimed as PASS |
| RK-4 | `file://` breakage from script order or module syntax | High | AC + integration test that loads both scripts in `index.html` order with no module syntax |
| RK-5 | Over-broad `preventDefault()` breaks browser shortcuts / accessibility | Medium | R-06/R-07 ACs; security review of the input surface |
| RK-6 | New JS file `calculator-core.js` is not covered by the lint gate (`node --check script.js`), and only the human may edit `.agent/gates.json` | Medium | OQ-7: user updates the lint command before BOOT-001 can reach gate 8 honestly; CALC-001 and KEY-001 inherit the same gate |
| RK-7 | Workflow scaffold is untracked, so `run-gate` marks every run dirty and no evidence is valid | High | RESOLVED: committed as baseline `e02035b` |
| RK-8 | Held-key auto-repeat could spam `=` or digits | Low | OQ-4 resolved (repeat for digits/`.`/`,`/Backspace only); tested either way |
| RK-9 | Scope creep into precedence/percent/memory while touching the core | Medium | Out-of-scope list above; reviewer checks the diff against it |
| RK-10 | CALC-001's RED is only genuine if the defect survives the BOOT-001 extraction | Medium | CALC-001 runs its new tests on the unmodified post-BOOT-001 head first and records the observed values; if the defect is gone, that is BOOT-001 drift (RK-1) and is reported with a decision record — never a claimed RED |
| RK-11 | The CALC-001 fix sits on the shared operator transition and can alter chaining, operator replacement or continue-from-result | High | BOOT-001's suites re-run unmodified (CALC-001 AC-5); the fix stays confined to the zero-divisor branch; reviewer checks the diff |
| RK-12 | BOOT-001 cannot reach `READY` until the matrix has rows attached to the new AC-8 (`validate.mjs state` enforces AC coverage at READY) | Low | test-designer remaps the existing DEL/`AC`/equals rows from AC-2/AC-5 to AC-8 — a re-run of gate 2, no new expectations |
| RK-13 | KEY-001's divide-by-zero parity expectations depend on CALC-001 landing first and on the OQ-C1 answer | Low | KEY-001 `depends_on: CALC-001`; re-read KEY-001's expectations when OQ-C1 is answered |

## Open questions

Blocking questions must be answered by the **user** before the named unit can leave `PLANNED`.
Each carries a proposed default so the answer can be one line.

### Resolutions — 2026-09-21 (user answers, collected by the orchestrator)

FALLBACK(opus->sonnet): recorded by the orchestrator running on claude-sonnet-5.

- **OQ-1, OQ-2, OQ-3, OQ-4: accepted all proposed defaults.** KEY-001's ACs stand as written
  (map includes `x`/`X`, `,`, `Delete`; excludes `:` and `c`/`C`).
- **OQ-6: yes.** Display-string derivation moves into `calculator-core.js`; BOOT-001 AC-1…AC-5
  stand as written.
- **OQ-7: accepted, deferred.** The user will extend the `lint` command in `.agent/gates.json`
  to cover `calculator-core.js` **before BOOT-001's final gate (gate 8)**. Only the human may edit
  that file; BOOT-001 is held at gate 8 until it is done.
- **OQ-B1: separate fix unit; do NOT pin the defect.** The mid-chain divide-by-zero
  (`5 / 0 +` → `5÷0+`, then `=` → expression `5÷0+Error`, current `NaN`) contradicts README.
  BOOT-001 stays behavior-preserving and excludes that path from its tests (BOOT-001 AC-6);
  **CALC-001** fixes it RED-first, after BOOT-001 and before KEY-001. Target behavior: the
  operator press leaves exactly the state that pressing `=` would have left (`5 / 0 +` →
  expression `5÷0`, current `Error`), the pressed operator is discarded, and existing `Error`
  recovery applies unchanged.
- **OQ-B2: frozen as baseline.** `5 + =` → expression `5+5`, current `10` (the held value is
  reused as the second operand). Pinned by BOOT-001 AC-8(e).
- **OQ-B3: frozen as baseline.** `DEL` right after an operator, after `=`, or on `Error` clears
  the whole calculation including the trail. Pinned by BOOT-001 AC-8(c).
- **RK-7: resolved.** The scaffold was committed as baseline `e02035b` on `main`, a user-authorized
  one-time exception to CLAUDE.md §4 (no push). `.claude/settings.local.json` is ignored by the
  user's global git ignore and was not committed.
- **Still open**: OQ-C1 (blocks CALC-001 `READY`), plus the non-blocking OQ-C2, OQ-5 (decides
  whether KEY-002 exists) and OQ-8. OQ-5/OQ-8 are asked before KEY-002 would start.

| ID | Question | Proposed default | Owner | Blocks |
|---|---|---|---|---|
| OQ-1 | Exact key map. Confirm: digits `0`–`9` + numpad → digits; `.` and numpad `.` → decimal; `+ - * /` → operators; `Enter` and `=` → equals; `Backspace` → DEL; `Escape` → AC. Also wanted? (a) `x`/`X` → ×, (b) `:` → ÷, (c) `,` → decimal point (comma-decimal keyboards), (d) `Delete` → AC, (e) `c`/`C` → AC | Yes to the confirmed list; yes to (a) `x`/`X`, (c) `,`, (d) `Delete`; no to (b) `:` and (e) `c`/`C` | user | RESOLVED (default accepted) |
| OQ-2 | Should mapped keys call `preventDefault()` (so `/` does not open Firefox quick-find and `Backspace` does not navigate back)? | Yes, for mapped keys only, never with a modifier held, never for `Tab` | user | RESOLVED (default accepted) |
| OQ-3 | When an on-screen button has focus (after a click or Tab), `Enter`/`Space` natively activates it. Keep native activation for accessibility and have the key handler ignore `Enter`/`Space` when the event target is a calculator button (so the action happens exactly once)? Or blur the button after a click and let the handler own `Enter`? | Keep native activation; handler ignores `Enter`/`Space` originating on a calculator button; `Space` is otherwise unmapped | user | RESOLVED (default accepted) |
| OQ-4 | Held-key auto-repeat (`event.repeat`): allow it (holding `7` types `7777`, holding `Backspace` deletes repeatedly) — and does it also apply to `Enter`/`=`? | Allow repeat for digits, `.` and `Backspace`; ignore repeated `Enter`/`=` and repeated operators | user | RESOLVED (default accepted) |
| OQ-5 | Visual press feedback: should the matching on-screen button flash when its key is pressed? If yes, is a ~120 ms highlight (CSS class toggled on keydown/keyup) acceptable, knowing it cannot be verified without a browser? | Yes, ~120 ms highlight via a `data-`/class toggle | user | KEY-002 (unit is dropped if "no") |
| OQ-6 | Should BOOT-001 also move display-string derivation into the pure core? | Yes | user | RESOLVED (yes) |
| OQ-7 | `.agent/gates.json` lint command is `node --check script.js` and only the human may edit it. Will you extend it to cover `calculator-core.js` (e.g. `node --check script.js && node --check calculator-core.js`)? | Yes, before BOOT-001 reaches gate 8 | user | BOOT-001 gate 8 (not READY) |
| OQ-8 | Non-blocking: does anything else on the page ever need keyboard focus (future input field)? A `document`-level listener assumes no. | No; `document`-level listener is fine | user | — |
| OQ-C1 | **Blocking CALC-001.** When the divide-by-zero happens later in a chain, what does the expression line show? For `2 + 3 / 0 *`: the full typed expression `2+3÷0` (which is exactly what `2 + 3 / 0 =` renders today), or only the failing operation `5÷0` (using the resolved intermediate `5`)? | `2+3÷0` — "the operator press renders what `=` would have rendered" is one rule for every case | user | CALC-001 `READY` (AC-3) |
| OQ-C2 | Non-blocking confirmation: after the fix, is the state fully equivalent to having pressed `=` — i.e. a following `=` is ignored and the expression line keeps showing `5÷0`? | Yes (follows from "exactly as `5 / 0 =` does today" + "existing Error recovery applies unchanged") | user | — (CALC-001 AC-4 assumes yes) |

## Notes for the orchestrator

- Security review is **required** for KEY-001 (input handling, CLAUDE.md §8); architecture
  review is required for BOOT-001 (new module boundary, T2). CALC-001 is expected to need
  neither (`security_review: N/A: <reason>`) — confirm against the §8 trigger list.
- **Gate 2 re-run for BOOT-001**: the new AC-8 has no matrix row yet. `validate.mjs state`
  enforces AC→matrix coverage from `READY` onwards, so the test-designer must remap the existing
  DEL/`AC`/no-op-`=`/`=`-after-operator rows from AC-2/AC-5 to AC-8 (no new expectations, no
  renamed tests) before BOOT-001 leaves `PLANNED`. The OQ-B1 "proposed rows" in the matrix stay
  deactivated and should be marked as superseded by CALC-001.
- **OQ-C1 must be asked before CALC-001 can go `READY`** (gate 1). Everything else for CALC-001 is
  decided.
- BOOT-001's TDD framing: the RED run comes from `tests/unit` requiring `calculator-core.js`
  before it exists; the characterization integration tests are a safety net written against
  the unmodified `script.js` and are expected to be green from the start — that is not a TDD
  violation and should be logged as such. CALC-001's RED, by contrast, must be a genuine failing
  run on the post-BOOT-001 core (see RK-10).
- No commit may occur between `APPROVED` and `COMPLETE` (CLAUDE.md §11).
