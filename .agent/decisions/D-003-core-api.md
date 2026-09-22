---
kind: decision
id: D-003
unit: BOOT-001
status: accepted
decided_by: implementer@claude-sonnet-5 (names and shapes were delegated to the implementer by dispatch BOOT-001-07 and matrix "Not covered"); architecture review of this boundary is still required by the unit Definition of Done
---

# D-003 — Core API shape, input descriptor, dual export and unrecognized-input policy

## Context
`BOOT-001` moves the calculator state machine and display-string derivation out of `script.js`
into `calculator-core.js` (AC-1). AC-1 requires "at least three function entry points" under names
recorded in this unit's core-API decision record; the matrix leaves the input-descriptor shape and
the unrecognized-input policy to the implementer. Constraints: classic `<script>` only, no ES
modules, works from `file://` (D-001, CLAUDE.md section 1); zero dependencies; `textContent` only.

## Decision

### Entry points (the names AC-1 refers to)
`calculator-core.js` exposes exactly these three functions today. AC-1 says "at least three", so
later units may add entry points (for example a key map for `KEY-001`) without a new record for the
existing three.

| Role in AC-1 | Name | Signature |
|---|---|---|
| fresh-state constructor | `createState` | `() -> state` |
| input transition | `applyInput` | `(state, input) -> state` |
| display renderer | `render` | `(state) -> { expression, current }` |

- `state` is an opaque plain object. Callers must not read or edit its fields; only `render` reads it
  for display. It is never mutated: `applyInput` returns a new object and never edits its argument
  or the history array shared with it. There is no module-level mutable state.
- `render` returns exactly `{ expression, current }`, both strings. Before `=` the expression line
  is empty and `current` holds the live trail (`4+8+`, `0` for a fresh state). After `=` the
  expression line holds the typed expression and `current` holds the answer.

### Input descriptor
`{ type, value }`, both required:

| `type` | `value` |
|---|---|
| `'number'` | a single character, one of `0`-`9` or `.` |
| `'operator'` | one of `+`, `-`, `*`, `/` (the `data-operator` values; the core maps them to the display symbols U+2212, U+00D7, U+00F7) |
| `'action'` | `'clear'`, `'delete'` or `'equals'` (the `data-action` values) |

### Dual export
The whole file is one IIFE (`'use strict'` inside, so its names never enter the global lexical scope
that classic scripts share with `script.js`). The last statement is:

```
if (typeof module !== 'undefined' && module.exports) { module.exports = CalculatorCore; }
else { globalThis.CalculatorCore = CalculatorCore; }
```

Under Node (`require`) the export is the API object; under a plain `<script src>` tag, and in the
DOM stub's vm context (which defines no `module`), it becomes `globalThis.CalculatorCore`, which
`script.js` reads. `index.html` loads `calculator-core.js` before `script.js`.

### Unrecognized-input policy
Two layers, two jobs (CLAUDE.md section 4: validate at the boundary, throw on internal invariant violations):

- **DOM layer (`script.js`) is the boundary.** `inputFromElement` reads the `data-*` attributes of
  the clicked element. A click on an element with no recognized `data-number` / `data-operator` /
  `data-action` (the gap between buttons) or whose value is outside the sets above (for example a
  `data-number` holding markup) is **ignored**: no state change, no display write, no exception.
  Attribute precedence is unchanged from the original script: number, then operator, then action.
- **Core throws.** `applyInput` throws a `TypeError` for a malformed descriptor (not an object, unknown
  `type`, or a `value` outside the table). It validates with `Map` lookups, so keys such as
  `constructor` or `__proto__` are rejected instead of resolving to inherited members. The state passed
  in is untouched. Pinned by the unit test `throws a TypeError for a malformed input descriptor`, which
  is **not** a matrix row (the matrix leaves this policy open); it was written RED-first.

`script.js` keeps its own three small value tables (digits and `.`, four operators, three actions).
That is a deliberate duplication of what the core also validates: the DOM layer must filter before
calling because the core's answer to bad input is an exception, and the click handler must never
throw. The 19 integration rows exercise every real button, so drift between the two would fail there.

### Other choices recorded here
- `script.js` is an IIFE with one entry point, `dispatch(input)`: it applies the input to its single
  `state` variable and re-renders. Keyboard input (`KEY-001`) should call `dispatch`.
- The original `deleteLastDigit` had a branch turning a lone `-` into `0`. It is unreachable: a
  negative `currentInput` only exists while `resetOnNextInput` is true, and then `DEL` clears the
  whole calculation. The branch was not ported (matrix "Not covered" allows either).
- The mid-chain divide-by-zero path (`5 / 0 +`, then `=`) is ported **bit-for-bit** as it behaves at
  baseline `e02035b` (`5÷0+`; then expression `5÷0+Error`, current `NaN`). It is a known defect owned
  by `CALC-001`, deliberately not fixed and not tested here.

## Alternatives considered
- **ES module (`export`/`import`) core.** Rejected: `<script type="module">` fails on `file://`
  (D-001, README Option 1).
- **Global functions with no wrapper.** Rejected: top-level `let`/`const`/`function` names in two
  classic scripts share one scope, so a later name clash would be a load-time `SyntaxError`.
- **Core ignores unrecognized input silently.** Rejected: a silent no-op hides caller bugs
  (CLAUDE.md section 4 says invariant violations throw).
- **Core exports `isInput` and the DOM layer stays free of value tables.** Rejected for now: it adds
  a fourth public function and its own tests for no behavior an AC demands. Revisit if `KEY-001`
  needs the same validation.
- **Freezing state objects.** Not done: no AC demands enforced immutability beyond "`applyInput` does
  not mutate its argument", which the unit rows pin.

## Consequences / residual risk
- `KEY-001` and `CALC-001` build on the three entry points; `CALC-001` changes only the internals of
  the operator/equals transitions.
- The input-descriptor value tables exist twice (core and `script.js`); a new operator or action must
  be added to both, and the integration suite is the guard.
- The lint gate in `.agent/gates.json` (`node --check script.js`) does not cover `calculator-core.js`
  (OQ-7, human action before gate 8). Until then the implementer ran `node --check calculator-core.js` by hand.
- Behavior of malformed descriptors is pinned only by one unit test; the DOM-level effect (ignored click)
  is pinned by the integration rows for the `.buttons` container and the markup-bearing `data-number`.

## Addendum (`KEY-001`): `mapKey`, `allowsRepeat`, `isInput`

`KEY-001` adds three entry points to `calculator-core.js`, exercising AC-1's "at least three" allowance
and closing `D-005` clause 5 (the third consumer of the input vocabulary must read it from a single
export, never a third hand-maintained table). Names and shapes were the implementer's choice per the
`KEY-001-05` dispatch; recorded here rather than in a new file because they extend this same API, not a
new boundary.

| Name | Signature | Role |
|---|---|---|
| `isInput` | `(input) -> boolean` | The single exported input vocabulary (`D-005` clause 5, "e.g. `INPUT_VALUES`/`isInput(descriptor)`" — this implementation chose the descriptor-checking function form). Accepts a full `{ type, value }` descriptor, not a bare value, so a value valid for one type (`'clear'`) is not wrongly accepted for another (`{ type: 'number', value: 'clear' }` is rejected). Reuses `isNumberValue`/`OPERATORS`/`ACTIONS` — the exact tables `applyInput` already validates against — so the two can never drift apart. Never throws; a malformed descriptor returns `false`. `script.js`'s `inputFromElement` now calls this instead of keeping its own `NUMBER_CHARACTERS`/`OPERATOR_VALUES`/`ACTION_VALUES` copies. |
| `mapKey` | `(key, modifiers) -> descriptor \| null` | The keyboard channel's key map (`D-005` clauses 1, 3, 4; unit Context). `key` is a `KeyboardEvent.key` string. `modifiers` is `{ ctrlKey, metaKey, altKey }` (all optional, default `false`); any of the three held makes even a mapped key return `null`. `shiftKey` is deliberately not a parameter — Shift never blocks (the browser itself turns a physical `Shift+8` into `key: '*'`). A closed allowlist (`KEY_MAP`, a `Map`): unmapped keys, `undefined`, and `''` all return `null`, never throw. Returns a fresh copy of the matched descriptor so a caller cannot mutate the shared map entry. |
| `allowsRepeat` | `(input) -> boolean` | The auto-repeat policy (`D-005` clause 6, OQ-4). Pure and channel-agnostic: `true` for `type: 'number'` and for the `'delete'` action; `false` for every operator and for `'equals'`. The `'clear'` action is untested either way (matrix "Not covered": clear is idempotent, so no test can discriminate a choice) — this implementation returns `false` for it, a safe default. The DOM layer calls this only when `event.repeat` is `true`; a non-repeat keydown always dispatches regardless of this function's answer. |

### Consequences / residual risk (addendum)
- `isInput` and `applyInput`'s own per-type checks are two call sites over the same three tables, not a
  fourth copy — verified by two dedicated unit rows (`tests/unit/key-map.test.js`: the vocabulary-export
  row and the key-map-output-consistency row).
- `script.js` keeps exactly one value-vocabulary source now (`CalculatorCore.isInput`); the DOM layer's
  only remaining local knowledge is *which* `data-*` attribute maps to which `type`, which is inherent to
  reading markup, not a duplicated value list.
