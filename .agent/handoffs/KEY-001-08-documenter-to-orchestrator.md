---
unit: KEY-001
from: documenter
to: orchestrator
sequence: 08
model_attested: claude-sonnet-5
state: TESTING
---

# Handoff KEY-001-08: documenter → orchestrator

## Context
Documented KEY-001's keyboard input in `README.md` only, per AC-8. Wording was checked against
`calculator-core.js`'s `KEY_MAP` (lines 209-220) and against the two previously-red regression
tests in `tests/regression/keyboard-and-click-parity.test.js` (lines 169-209) before writing, so
both passed on the first run. `KEY-002` (on-screen press feedback) is not mentioned anywhere —
it was not built.

## Acceptance criteria
AC-8 (`.agent/units/KEY-001.md`): README documents the complete key map and lists keyboard
support under Features. Both satisfied — see evidence below.

## Relevant files
- `README.md` — added one `## Keyboard` section (after Features, before "Running it") and one
  Features bullet; no other file touched.

## Tests created / executed
- created: none (docs only, per dispatch)
- executed:
  - `node --test tests/regression/keyboard-and-click-parity.test.js` → 7/7 pass, including
    `README documents every mapped key with its calculator action` and
    `README Features lists keyboard support`.
  - `node --test "tests/regression/**/*.test.js"` → 25/25 pass.
  - `node --test "tests/unit/**/*.test.js"` → 83/83 pass (sanity check, unchanged).
  - `node --test "tests/integration/**/*.test.js"` → 46/46 pass (sanity check, unchanged).
  - (No `run-gate.mjs` invocation — dispatch step 3 specified raw `node --test` commands for
    this docs-only step; the orchestrator's own gate run remains the authoritative evidence.)

## Results
Claim → evidence:
- "Digits `0` to `9` type the matching digit" → `KEY_MAP` spreads `NUMBER_CHARACTERS`
  (`'0123456789.'`) at `calculator-core.js:210`; proven by
  `tests/unit/key-map.test.js:16-21` ("maps each digit key zero through nine...").
- "`.` or `,` types the decimal point (`,` is an alternate decimal separator)" →
  `calculator-core.js:211`; proven by `tests/unit/key-map.test.js` comma mapping assertions.
- "`+ - * /` ...; `x` and `X` are alternates for multiply" → `calculator-core.js:212-214`;
  proven by `tests/unit/key-map.test.js` operator mapping tests.
- "`Enter` or `=` evaluates" / "`Backspace` deletes" / "`Escape` or `Delete` clears" →
  `calculator-core.js:215-219`; proven by `tests/unit/key-map.test.js` action mapping tests
  (`maps Enter and the equals key...`, `maps Escape and Delete to the clear action`).
- "Holding down a digit, `.`, `,` or `Backspace` repeats... `Enter`, `=` and operators act
  once" → `allowsRepeat` (`calculator-core.js:238-243`); proven by
  `tests/integration/keyboard.test.js` repeat tests (`holding a digit key so it repeats...`,
  `holding an operator key so it repeats does not dispatch again...`).
- "`Ctrl`, `Cmd`/`Meta` and `Alt` combinations are left alone... `Shift` alone never blocks" →
  `mapKey` (`calculator-core.js:226-233`); proven by `tests/unit/key-map.test.js`
  (`returns null for a mapped key held with Ctrl Meta or Alt...`, `Shift alone does not block a
  mapped key`) and regression `Ctrl+R is inert and never calls preventDefault...`.
- "unmapped keys such as `Tab` behave as normal" → `mapKey` returns `null` for any key absent
  from `KEY_MAP` (verified by reading `script.js:82-102`: `preventDefault` is only called after
  a non-null `mapKey` result, so an unmapped key like `Tab` is never intercepted). Not covered
  by a dedicated `Tab` test; this specific clause is inference from code reading, not a named
  test — flagging per §16 rather than treating it as fully proven.
- Features bullet "Full keyboard support..." → proven directly by regression test
  `README Features lists keyboard support`.

Commit: `dc61354f189c87a511a91cf4d8934444cf812671` — "KEY-001: document keyboard input in the
README" on branch `agent/KEY-001-keyboard-input`. Working tree clean after commit (`git status
--porcelain` empty). Not pushed.

## Decisions made
None. No wording required deviating from the dispatch's exact-token guidance, so no test-change
or decision record was needed.

## Known risks
- The "unmapped keys such as `Tab` behave as normal" clause (see Results above) is verified by
  code reading, not a dedicated automated test — residual risk is low (it follows directly from
  `mapKey` returning `null` for `Tab` and `script.js` only calling `preventDefault` on non-null
  results) but noted per verification-discipline (§16).

## Outstanding issues
None.

## Required next action
Orchestrator: re-run gates on this head (`node .agent/tools/run-gate.mjs regression --unit
KEY-001 --phase final` or equivalent per `.agent/gates.json`), confirm docs claim, and proceed
per §11 gate 8 / §12.
