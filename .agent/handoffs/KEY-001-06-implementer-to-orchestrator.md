---
unit: KEY-001
from: implementer
to: orchestrator
sequence: 06
model_attested: claude-sonnet-5
state: TESTING
---

# Handoff KEY-001-06: implementer → orchestrator

## Context
Executed dispatch `KEY-001-05` on branch `agent/KEY-001-keyboard-input`: strict RED→GREEN→REFACTOR
for the pure key map, the auto-repeat policy and the core's single exported input vocabulary
(D-005 clause 5), plus the `keydown` listener and click-handler `blur()` wiring in `script.js`.
Read `.agent/units/KEY-001.md` (current AC-6 text, rewritten 2026-09-21), `.agent/units/KEY-001.matrix.md`,
`D-003`, `D-005`, `D-008`, `D-009`, `D-010` before writing anything.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1…AC-8. AC-1…AC-7 fully implemented and tested at this handoff.
AC-8 (README) is the documenter's step next (D-010 sub-step 3); the two AC-8 regression rows are
still red, on purpose, and only because the README text is missing (confirmed below).

## Relevant files
- `calculator-core.js` — added `isInput(input)` (the D-005 clause 5 vocabulary export, reusing the
  same `isNumberValue`/`OPERATORS`/`ACTIONS` tables `applyInput` already validates against),
  `mapKey(key, modifiers)` (pure allowlist, `KEY_MAP` derived from `NUMBER_CHARACTERS` and
  `OPERATORS.keys()` after refactor), `allowsRepeat(input)` (pure repeat policy). All three added
  to the `CalculatorCore` export.
- `script.js` — destructures `mapKey`, `allowsRepeat`, `isInput` alongside the existing three at
  load time (same pattern as `applyInput`, per the dispatch's Known risks note); `inputFromElement`
  now validates through `isInput` instead of its own `NUMBER_CHARACTERS`/`OPERATOR_VALUES`/
  `ACTION_VALUES` tables; added `isCalculatorButton(element)` and `modifiersOf(event)` helpers;
  added `element.blur()` at the end of the shared click handler (AC-6); added one `document`
  `keydown` listener that skips Enter/Space when the target is a calculator button (native
  activation path), otherwise maps the key, calls `preventDefault()` when mapped, and dispatches
  through the existing `dispatch(input)` unless `event.repeat` and `!allowsRepeat(input)`.
- `tests/unit/key-map.test.js` — new, 16 rows, verbatim matrix names.
- `tests/helpers/core-input.js` — new, exports `toInput`, `press`, `expectDisplay`, `createState`.
- `.agent/decisions/D-003-core-api.md` — addendum recording `mapKey`/`allowsRepeat`/`isInput`
  (names, signatures, roles); implementer's choice per dispatch, recorded as an addendum to the
  existing core-API decision rather than a new file since it extends the same boundary.
- Read-only, byte-for-byte unmodified (verified with `git diff --name-status`, see below):
  `tests/integration/keyboard.test.js`, `tests/regression/keyboard-and-click-parity.test.js`,
  `tests/regression/source-safety.test.js`, `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`,
  every `BOOT-001`/`CALC-001` test file.

## Tests created / executed
- created: `tests/helpers/core-input.js`, `tests/unit/key-map.test.js` (16 named rows)
- executed:
  - `.agent/test-results/KEY-001/latest-unit-red.json` — exit 1, 83 tests, 69 pass / 14 fail, head `fa16dfa3`
  - `.agent/test-results/KEY-001/latest-unit-green.json` — exit 0, 83/83 pass, head `d2639bb2`
  - `.agent/test-results/KEY-001/latest-integration-green.json` — exit 0, 46/46 pass, head `d2639bb2`
  - `.agent/test-results/KEY-001/latest-regression-green.json` — exit 1, 25 tests, 23 pass / 2 fail (both AC-8 rows), head `d2639bb2`
  - `.agent/test-results/KEY-001/latest-unit-refactor.json` — exit 0, 83/83 pass, head `b987cf96`
  - `.agent/test-results/KEY-001/latest-integration-refactor.json` — exit 0, 46/46 pass, head `b987cf96`
  - `.agent/test-results/KEY-001/latest-regression-refactor.json` — exit 1, 25 tests, 23 pass / 2 fail (same two AC-8 rows), head `b987cf96`

## Results
**RED** (commit `fa16dfa3`): 14 of 16 new rows failed with `TypeError: mapKey is not a function` /
`TypeError: allowsRepeat is not a function` — the correct reason (the entry points did not exist
yet), each proving its AC (AC-1 mapping/vocabulary rows, AC-2 decimal/comma, AC-3 operators, AC-4
Backspace/Escape/Delete, AC-5 modifiers/Shift/unknown-key, AC-7 repeat policy). **2 of 16 passed
immediately** ("the shared press helper applies a token sequence to a fresh state left to right",
"the shared expectDisplay helper fails when either line of the rendered pair differs from
expected") — this is correct, not a RED violation: both rows exercise `core-input.js`'s
`press`/`expectDisplay` against `createState`/`applyInput`/`render`, which already existed and
were already correct before this unit (BOOT-001/CALC-001); they prove the newly-extracted shared
helper is a faithful drop-in for the two inline copies it replaces for new suites (carried-forward
item 7), not new key-map behavior. Flagging explicitly since the dispatch's arithmetic said "16
new fail" — 14 did, for the stated reason; the other 2 are meta-rows about the helper itself and
were never expected to be red.

**GREEN** (commit `d2639bb2`): unit 83/83, integration 46/46. Regression 25 total, 23/25 pass — the
2 failures are exactly the two AC-8 rows ("README documents every mapped key with its calculator
action", "README Features lists keyboard support"), both failing with `README: no heading or
bullet mentions keyboard` / `no Features bullet mentions keyboard` — confirmed the failure is
solely the missing README text, not a code defect (the underlying feature is fully implemented and
covered by the other 23 rows plus all 46 integration rows). **GUARD row** ("every README click
sequence still renders correctly once the keyboard listener and click blur are installed") is
green.

**REFACTOR** (commit `b987cf96`): re-derived `KEY_MAP`'s digit/`.`/operator entries from
`NUMBER_CHARACTERS` and `OPERATORS.keys()` (the same single sources `isInput`/`applyInput` already
use) instead of hand-listing them a second time; extracted `modifiersOf(event)` in `script.js` for
readability. No behavior change: unit 83/83, integration 46/46, regression 23/25 (same two AC-8
rows), **GUARD row still green**. `node --check calculator-core.js` and `node --check script.js`
both pass.

`node .agent/tools/validate.mjs state` → `state: OK` (every matrix-named unit test exists and
passes; `git status --porcelain` is clean).

## Decisions made
- API addendum recorded in `.agent/decisions/D-003-core-api.md` (new section "Addendum (KEY-001):
  mapKey, allowsRepeat, isInput"): names, signatures, roles, and why `isInput` takes a full
  descriptor rather than a bare value (so a value valid for one type is not wrongly accepted for
  another, e.g. `{ type: 'number', value: 'clear' }` is rejected even though `'clear'` is a valid
  action value).
- `isCalculatorButton` checks `event.target` (never `document.activeElement`) for the Enter/Space
  skip, per the literal AC-6 text ("the key handler ignores Enter/Space events whose target is a
  calculator button") — this is what makes the Tab-focused-button tests pass without double
  actions while leaving keys dispatched at `document.body` (the matrix's default target)
  unaffected.
- `element.blur()` in the click handler runs unconditionally for every click (mouse-simulated or
  native-keyboard-activated), not conditionally on trigger source: the stub's click event carries
  no signal (no `detail`, no pointer type) to distinguish a mouse click from a native Enter/Space
  activation, so no implementation in this environment could branch on it; this is documented as a
  residual risk below rather than silently assumed.
- `allowsRepeat` returns `false` for the `'clear'` action (untested either way per the matrix's
  "Not covered" note: clear is idempotent, so no test can discriminate the choice) — a safe
  default, not a gap I introduced.

## Known risks
- **Residual, `UNVERIFIED`**: whether a held mouse-click-then-native-keyboard-activation should
  preserve focus (only "mouse-initiated" clicks blur, per AC-6's first sentence) cannot be tested
  in this stub (no click-origin signal exists on the event object) and is not distinguished by this
  implementation — `blur()` runs after every click. No test requires the distinction and none
  regressed; flagging for the security/architecture reviewer to judge whether this reading of AC-6
  is acceptable or needs a follow-up.
- RK-2/RK-3 (stub fidelity, real focus rings, real OS auto-repeat) remain `UNVERIFIED` as recorded
  in the unit file; nothing in this implementation changes that residual risk.
- `.agent/decisions/D-003-core-api.md`'s pre-existing "Alternatives considered" entry ("Core
  exports `isInput`... Revisit if `KEY-001` needs the same validation") is now superseded by the
  addendum; not deleted, left as history per normal decision-record practice.

## Outstanding issues
- AC-8's two README rows are still red — expected, documenter's step next (D-010 sub-step 3).
- Everything else: none known.

## Required next action
Dispatch `documenter` to write the README keyboard section and Features bullet (D-010 sub-step 3),
using the exact tokens `tests/regression/keyboard-and-click-parity.test.js`'s two AC-8 rows check
(`Enter`, `Backspace`, `Escape`, `Delete`, `x`/`X` next to "multiply", `,` next to "decimal", each
of `+ - * /`, and a digit-range or "digit" mention), matching the implemented `KEY_MAP` key for
key. Then orchestrator runs final gates on the resulting clean head, then review (code, security,
architecture — all required per D-010 step 4).
