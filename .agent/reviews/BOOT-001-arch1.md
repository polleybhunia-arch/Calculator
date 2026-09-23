---
unit: BOOT-001
reviewer: architecture-reviewer
model_attested: claude-opus-5
reviewed_ref: 28a19873b0c03224e111afb30e44829c919c9945
verdict: APPROVED
cycle: 1
---

# Review BOOT-001 arch1 — verdict: APPROVED

Structural/boundary review only (CLAUDE.md §8 trigger: T2, new module boundary). Code-quality and
test-adequacy verdicts belong to `reviewer`; the input-surface verdict belongs to
`security-reviewer`. I did not read handoffs `BOOT-001-06`, `-08`, `-10` (implementer/tester
justification is out of bounds) and formed every conclusion from the code, the specs and my own
runs.

**Model attestation**: I am running on Opus (`claude-opus-5`). No fallback applies to this review.
The dispatching orchestrator session is on Sonnet (`FALLBACK(opus->sonnet)`), which does not reduce
the assurance of this architecture verdict.

## Acceptance criteria verdicts
Format is machine-read — keep exactly `- AC-n: VERDICT — evidence`. VERDICT ∈ SATISFIED | NOT_SATISFIED | UNVERIFIED.
- AC-1: SATISFIED — `calculator-core.js` loads in a Node process where `document`/`window` are `undefined` and exposes the three entry points named in D-003 (`createState`, `applyInput`, `render`); `render(createState())` is `{ expression: '', current: '0' }`; two states interleaved through independent input sequences produced `{"expression":"4+8","current":"12"}` and `{"expression":"9×2","current":"18"}` with no cross-talk; a deep-freeze probe applied **90,082** transitions to frozen states over 20,000 random sequences with **0** strict-mode mutation errors, so no transition edits its argument or the shared `history` array; `globalThis.CalculatorCore` is `undefined` after `require()` under Node, so the browser branch of the dual export leaks nothing into the test process.
- AC-6: SATISFIED — the 20 integration rows load the real `index.html` through `tests/helpers/dom-stub.js`, assert `executedScripts` equals the document-order `<script src>` list, reject any `type="module"`/non-relative `src`, and drive the README sequences (chaining, decimals, divide-by-zero, `AC`, `DEL` after an operator and on `Error`, the `=` two-line split, operator replacement, `5 + =`, digit-after-result, container-gap click) as bubbling `click` events on the real buttons; re-run green by me at `head_ref` (20/20). Independently, my differential run (below) reproduces the matrix expectations from the baseline itself. No test asserts the excluded mid-chain divide-by-zero path: a search of `tests/` for `NaN` / `5÷0+` returns only the two REGISTRY notes that record the exclusion.
- AC-7: SATISFIED (with Minor F-1 on the guard, not on the property) — I scanned `index.html`, `script.js` and `calculator-core.js` myself: no `import`/`export`/`import(`/`type="module"`, no `eval`/`new Function`/`document.write`, no `innerHTML`/`outerHTML`/`insertAdjacentHTML`, no absolute or protocol-relative URL, no inline event-handler attribute, and both display writes go through `textContent`; the integration suite additionally asserts `document.markupWrites` stays empty, including when a `data-number` carries `<img src=x onerror=alert(1)>`.

AC-2…AC-5 and AC-8 are outside my scope; I observed the unit suite green (52/52) at `head_ref`
and my differential run reproduces their expectations from the baseline implementation.

## What I ran myself
Independent re-execution at `28a19873b0c03224e111afb30e44829c919c9945` (`git rev-parse HEAD`
confirmed; working tree clean outside `.agent/`; `git status` identical before and after this
review — I wrote only this file, `.agent/decisions/D-005-layering-rule.md` and my handoff):

1. **All three suites, re-run by me** — unit 52/52, integration 20/20, regression 13/13, all
   `fail 0`. Matches the recorded evidence
   `.agent/test-results/BOOT-001/latest-{unit,integration,regression,lint}-final.json`
   (exitCode 0, `dirty: false`, head `28a19873…`).
2. **Differential behavior test, baseline vs extracted core (RK-1)** — I loaded the baseline
   `script.js` from `e02035ba` into a fake DOM in a fresh `node:vm` context per sequence and
   compared its two display strings against `render(applyInput(...))` of the new core, over an
   11-token alphabet (`0 1 5 . + - * / = AC DEL`): **exhaustive for every sequence of length 1–4**
   (16,104 sequences) plus 30,000 seeded random sequences of length 5–9. Result: **46,104 sequences
   compared, 0 divergences.** This covers the mid-chain divide-by-zero path, so it still behaves as
   at baseline (`5÷0+`, then `5÷0+` / `NaN`) — `CALC-001`'s RED assumption (RK-10) is intact.
3. **Purity / impossible-state probes** — deep-frozen transitions (above); 40,000 random sequences
   searching for `justCalculated` together with a pending `operator`/`previousInput`: **0 found**;
   40,000 sequences searching for a negative `currentInput` while `resetOnNextInput === false`:
   **0 found**, which is the reachability evidence for dropping the baseline's `'-' → '0'` branch
   in `deleteLastDigit`.
4. **Constraint checks** — `node --check calculator-core.js` passes (the `lint` gate command in
   `.agent/gates.json` is still `node --check script.js` only, OQ-7, human action, gate 8);
   `grep` over the shipped files for `process`, `require`, `CALC_STUB` finds nothing, so the
   stub's `CALC_STUB_TRANSFORM` mutation hook is confined to `tests/helpers/dom-stub.js`.

## Findings
| ID | Severity (Critical/Major/Minor/Nit) | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | tests/regression/source-safety.test.js:32-46, tests/helpers/source-scan.js:115-118 | AC-7 names all three shipped files, but the `dynamicCode` and `markupWrites` pattern sets are applied to `SCRIPT_FILES` only; `index.html` is scanned for module syntax and external hosts only. The property holds today (I checked the markup by hand), but an inline `onclick="…"` or an inline `<script>` added by a later unit would not be flagged by the guard that exists to protect the `file://`/no-injection invariant. | Apply `PATTERNS.dynamicCode` and `PATTERNS.markupWrites` to `html` as well (two lines in the existing loop). Owner: `integration-tester`. Cost ≈ 5 minutes. **Not a condition of this approval**: doing it now would need a new commit and invalidate the SHA-bound gate/review evidence (CLAUDE.md §11), so fold it into the next unit that touches `index.html` (`KEY-001`/`KEY-002`) unless the orchestrator prefers to re-run the gates. |
| F-2 | Minor | script.js:10-12 vs calculator-core.js:8,14-19,119-123 | The input vocabulary (digits + `.`, four operators, three actions) exists twice. The *layering* reason is sound — the adapter must filter user-controllable `data-*` before calling a core that answers bad input with a `TypeError` — but the two lists are kept in sync by hand, and the failure mode of drift is a silently inert button. | Keep as is for two adapters (D-003's rejection of a fourth export stands: YAGNI). **Condition for `KEY-001`**: when the key map lands, export the vocabulary once from the core (e.g. `INPUT_VALUES` or `isInput(descriptor)`) and have both adapters use it, instead of adding a third copy. Recorded in proposed D-005. |
| F-3 | Nit | calculator-core.js:57-60 | The operator-swap branch uses `history.slice(0, -1)` where the baseline used `history[history.length - 1] = symbol`. The two differ only when `history` is empty while `resetOnNextInput && !justCalculated` — unreachable today (probe 3 above, and every producer of `resetOnNextInput: true` appends a token or sets `justCalculated`). | None. Noted because `CALC-001` edits exactly this transition and must preserve the invariant "`resetOnNextInput && !justCalculated` ⟹ `history` is non-empty". |
| F-4 | Nit | script.js:6 | `const { createState, applyInput, render } = globalThis.CalculatorCore;` fails at load with a generic destructuring `TypeError` if the script order in `index.html` is ever wrong; the page then renders nothing with only a console error. It does throw (no silent swallow), and the order is pinned by an integration row. | Optional: an explicit one-line invariant throw naming `calculator-core.js`. Cost 1 line; benefit is diagnosability only. Not required. |
| F-5 | Nit | calculator-core.js:23-33, 110-117 | Immutability is a convention plus tests, not enforced; consecutive states share the `history` array by reference (safe only because nothing mutates in place). | None now — D-003's rejection of `Object.freeze` is reasonable. Evidence for a later revisit: my deep-freeze probe ran 90,082 transitions against fully frozen states with zero failures, so freezing in `createState`/`applyInput` is already compatible if `CALC-001`/`KEY-001` make enforcement worth the noise. |

No Critical or Major finding. No open finding blocks `APPROVED`.

## Assessments
- **Requirement satisfaction**: the boundary is exactly the one `plan.md` §Approach and CLAUDE.md §1
  ask for: a pure core, a thin DOM layer, one `dispatch(input)` seam, classic scripts in
  `index.html`. R-11 (logic unit-testable in Node without a DOM) is now true and machine-proved;
  R-10 (`file://`, zero dependencies, no build) is preserved.
- **Boundary placement and cohesion**: the cut is at the right line. The core holds the state
  machine *and* display-string derivation (OQ-6, user-decided), so the DOM layer contains no
  calculator rule at all — it maps `data-*` to a descriptor, calls `applyInput`, writes two
  `textContent`s. Dependency direction is one-way (`script.js` → core), there is no cycle, and the
  core has no I/O of any kind. `render` returning `{ expression, current }` rather than writing
  elements is what makes the two-line display testable without a DOM; it is the single most
  valuable part of this change.
- **State and ownership**: the baseline's seven module-level `let`s are gone. The whole system now
  has exactly one mutable binding — `let state` inside `script.js`'s IIFE, closure-private, not
  reachable from any global. The core is stateless, and `globalThis.CalculatorCore` is the only
  global name introduced, holding three pure functions. This is the central testability debt from
  CLAUDE.md §1 actually paid, not deferred.
  The state record still *admits* impossible combinations by construction (seven independent
  fields); a tagged union (`typing` / `awaiting-operand` / `result` / `error`) would exclude them
  structurally. I probed for the two that matter and found none reachable (see "What I ran"). At
  this size the union would cost a rewrite of every transition and its tests for no behavior an AC
  demands — **rejected for now, accepted as a documented trade-off**; revisit only if a future unit
  adds a fourth mode.
- **Duplication**: two deliberate duplications exist — the input vocabulary (F-2) and the operator
  glyphs (`−`, `×`, `÷` appear both as core symbols and as button labels in `index.html`, which is
  unavoidable for static markup). Both are guarded by the integration rows that click every real
  button. Acceptable at two adapters, not at three (F-2).
- **Testability seams**: three clean seams — `require('./calculator-core.js')` for pure logic;
  `loadPage()` + synthetic events for the wiring; static text scans for the shipped-file
  constraints. The DOM layer is deliberately not exported, so it is exercised only through real
  events, which is the right choice (tests cannot bypass the adapter they are meant to verify).
- **Extensibility vs YAGNI (the next likely features)**:
  - `CALC-001` is a change inside `chooseOperator`/`computeResult` only — no signature, no
    boundary, no adapter change. The one asymmetry to watch is that `equals()` derives
    `lastExpression` *before* committing, while `chooseOperator` has already pushed the operand
    into `history`; the fix must build the same string from `committed.history`. Structural cost:
    a few lines. No rework of this boundary.
  - `KEY-001` fits without rework: `mapKey` becomes a fourth core entry point (AC-1 says "at least
    three", so no amendment is needed), and the keyboard listener lives inside the same
    `script.js` IIFE calling the existing private `dispatch`. **Recommendation**: put the
    `event.repeat` policy (AC-7 of KEY-001: repeats allowed for digits/`.`/Backspace, ignored for
    operators/`Enter`) inside the pure `mapKey(key, modifiers)` so it is unit-testable without a
    DOM; deciding it in `script.js` would re-derive the input vocabulary there and create the
    third copy warned about in F-2. The focus/`defaultPrevented` rules (KEY-001 AC-5, AC-6) are
    genuinely DOM concerns and belong in the adapter.
  - `KEY-002` is presentation only and must not read core state; it can key off the descriptor.
  - Parentheses/precedence would not fit the flat `previousInput`/`operator` model, but they are
    explicitly out of scope in `plan.md`; the cost is contained because the core's contract is
    three functions and two strings, so a different engine behind `applyInput` would not touch the
    adapter. No speculative abstraction was added for it — correct.
- **Constraints (D-001, zero dependency, `file://`)**: honored, not accidentally. Two classic
  `<script src>` tags in order, dual-export guard taking the `globalThis` branch when `module` is
  absent, no module syntax anywhere, no build, no dependency, no external URL, `textContent` only.
  The only modern-baseline requirement introduced is `globalThis` (ES2020), which is required by
  the D-001-prescribed export guard itself and is fine for the README's browser target.
- **Test-only concerns stay out of production**: confirmed. The `CALC_STUB_TRANSFORM` in-memory
  mutation hook, the `node:vm` loading and the markup-write traps live entirely in
  `tests/helpers/`; the shipped files contain no `process`, `require`, env read or test hook. The
  stub also refuses non-relative script `src` and capture-phase listeners rather than pretending to
  model them — honest about its limits (RK-2).
- **Decision records**: **D-002 (stage order) — agree.** Writing the characterization net against
  the unmodified `script.js` before any extraction edit is precisely what makes this diff
  reviewable; the default order would have characterized already-refactored code and could not have
  detected RK-1. Its residual (phase-A evidence is a green, not a red) is correctly pushed onto
  mutation probes, which are `reviewer`'s to confirm.
  **D-003 (core API) — agree, with one amendment.** Names, the `{ type, value }` descriptor, the
  two-layer validation policy (adapter filters silently, core throws) and the dual-export guard are
  the right calls and match CLAUDE.md §4. Amendment: its "Revisit if `KEY-001` needs the same
  validation" should be a *condition*, not an option — see F-2 and proposed D-005. Its claim that
  the `'-' → '0'` branch is unreachable is correct and I verified it independently rather than
  accepting it.
- **Conventions & complexity**: consistent with CLAUDE.md §4 — 2-space indent, single quotes,
  `const`/`let`, `camelCase`, `UPPER_SNAKE` constants, `kebab-case` file, comments that explain
  *why*. No God function; the longest transition is 25 lines. `ACTIONS` mapping `'clear'` to
  `createState` (a `() -> state` used where `(state) -> state` is expected) is a harmless
  arity-widening idiom, not a defect.
- **Migration / rollback cost**: one commit touching three shipped files (+178 core, −215 script,
  +1 html). Rollback is a single revert, and the characterization suite would fail loudly if the
  revert were partial. Low.

## Proposed decision record
`.agent/decisions/D-005-layering-rule.md` (`status: proposed`) — codifies the layering rule this
unit establishes (pure core, one mutable state binding in the adapter, one `dispatch` seam per
input channel, adapter-filters/core-throws validation, and the "export the vocabulary once at the
third adapter" condition from F-2) so `CALC-001`, `KEY-001` and `KEY-002` inherit it as a constraint
rather than as a convention discovered by reading code. Acceptance is the user's/orchestrator's.

## Unverifiable
- **Real `file://` loading in a real browser** (RK-3/RK-4): no browser is available. Verified only
  by proxy — classic `<script src>` tags in document order, relative paths, no module syntax, no
  build artifact. Residual risk: a browser-specific load failure would not be caught here. Record
  as `UNVERIFIED`, per CLAUDE.md §16.
- **CSS, layout, focus, real pointer events, capture-phase listeners**: not modeled by the stub by
  design; unchanged by this unit (no CSS or markup behavior change beyond one `<script>` line).
- **Lint coverage of `calculator-core.js`**: the gate command still covers `script.js` only (OQ-7).
  I ran `node --check calculator-core.js` myself and it passes, but that is not gate evidence; only
  the human may edit `.agent/gates.json`, and gate 8 cannot be honest until they do.
