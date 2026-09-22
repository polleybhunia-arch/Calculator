---
unit: KEY-001
reviewer: architecture-reviewer
model_attested: claude-opus-5
reviewed_ref: ab4b5d1d21dcdf8db587cab203f0d9d764ef0043
verdict: CHANGES_REQUIRED
cycle: 1
---

# Review KEY-001 arch1 — verdict: CHANGES_REQUIRED

Structural review only (CLAUDE.md §8: T2 requires it). Scope: the layering rule `D-005` clauses
1–7 as applied by this unit, the `D-003` addendum, boundaries, coupling, hidden state, testability
seams, extensibility for `KEY-002`, and the `blur()` question the dispatch asked me to judge.
Code correctness per AC and security are the other two reviewers' scope; I state AC verdicts only
from the structural evidence I gathered myself.

**Model attestation**: I am running on Opus (`claude-opus-5`). The orchestrator's session is on
Sonnet (`FALLBACK(opus->sonnet)` on the dispatch); that fallback does not extend to this review.

**Ref note (verified, not a blocker)**: the dispatch states `git rev-parse HEAD` equals
`head_ref`. At the time of this review `HEAD` is `ffa4aed6d391adb210b9d0a98c6150864d5ccfbc`.
`git diff ab4b5d1..HEAD` touches only `.agent/` (3 handoffs, 4 evidence files, the unit file);
**no product or test file differs**, so the working tree I read is byte-identical to `head_ref`
for every file in scope. `reviewed_ref` above is the `head_ref` the dispatch names.

One open **Major** finding (F-1) ⇒ `APPROVED` is not available (review template rule). F-1 is
closable either by a small code change **or** by an explicit user decision accepting the
simplification; see the proposed record `.agent/decisions/D-011-click-origin-and-focus-policy.md`.

## Acceptance criteria verdicts
- AC-1: SATISFIED — `mapKey` is a pure core entry point; `tests/unit/key-map.test.js` requires
  `calculator-core.js` directly (no DOM stub) and passes in a Node process where `document` and
  `window` are `undefined` (probe below). Integration row "typing four plus eight plus nine then
  Enter…" renders `4+8+9` / `21` through the same `dispatch` the click path uses.
- AC-2: SATISFIED — structurally: `.`/`,` both map to `{type:'number',value:'.'}`; the
  one-decimal-point rule stays in the core's `appendNumber`, not duplicated in the key path.
- AC-3: SATISFIED — operator entries are *derived* from the core's `OPERATORS` map
  (`calculator-core.js:212`), so the key channel cannot list an operator the core rejects; `x`/`X`
  are the only hand-written aliases.
- AC-4: SATISFIED — `Backspace`/`Escape`/`Delete` map to the existing `delete`/`clear` actions; no
  new transition was added to the core for the keyboard.
- AC-5: SATISFIED — modifier filtering lives in the pure `mapKey`; `script.js` passes only
  `{ctrlKey, metaKey, altKey}` (`modifiersOf`), and `preventDefault()` is reached only after a
  non-`null` map result, so the allowlist is the single gate for both effects.
- AC-6: **NOT_SATISFIED** — first half (mouse click blurs its button; `4`, `+ 8 Enter` → `4+8`/`12`)
  holds. Second half does not: AC-6 and the user's OQ-3 resolution require a `Tab`-reached button's
  native `Enter`/`Space` activation to be *unaffected* and to "keep standard button activation";
  `script.js:76` blurs on **every** click, including the click a browser synthesizes for native
  activation, so the focused button loses focus after one keypress. Exactly one action still
  occurs, so the AC's count assertion passes — the focus half is neither satisfied nor tested. See
  F-1.
- AC-7: SATISFIED — `allowsRepeat` is a pure core predicate (`D-005` clause 6) and the adapter's
  only repeat logic is `if (event.repeat && !allowsRepeat(input)) return;`.
- AC-8: N/A to this review (docs; README was read for F-1 evidence only).

## What I ran myself
No file on disk was changed, no git state touched (`git status --porcelain` empty before and
after). I ran the gate commands from `.agent/gates.json` **directly** rather than through
`run-gate.mjs`, because the dispatch forbade changing any file and `run-gate` rewrites
`.agent/test-results/KEY-001/latest-*.json`; the orchestrator's SHA-bound evidence at `head_ref`
already exists and my counts match it exactly.

| Command | Result |
|---|---|
| `node --test "tests/unit/**/*.test.js"` | 83 pass / 0 fail (matches `latest-unit-final.json`) |
| `node --test "tests/integration/**/*.test.js"` | 46 pass / 0 fail (matches `latest-integration-final.json`) |
| `node --test "tests/regression/**/*.test.js"` | 25 pass / 0 fail (matches `latest-regression-final.json`) |
| `node --check script.js && node --check calculator-core.js` | pass |
| `git diff base..head -- . ':(exclude).agent'` | 11 files; `index.html` unchanged; no new dependency, no `package.json` change, no `type="module"` |

Probes (all via `node -e`, nothing written):
1. **Core purity (D-005 clause 1)**: `require('./calculator-core.js')` in bare Node →
   `typeof document === 'undefined'`, `typeof window === 'undefined'`, exports exactly
   `createState, applyInput, render, mapKey, allowsRepeat, isInput`. `mapKey('4')` returns a fresh
   copy: mutating the result leaves the next call's value intact.
2. **Focus after native activation**: load the page, `buttonFor('7').focus()`, dispatch
   `keydown {key:'Enter'}` on it → display `7` (one action, correct) **and**
   `document.activeElement === null` (focus lost). A second identical `Enter` on that button then
   does nothing in the stub; in a real browser focus has moved to `<body>`, so the second `Enter`
   is read as *equals*, i.e. the same physical keypress changes meaning after the first press.
   This is the concrete cost of F-1 and it is observable with the stub as it stands today.
3. **Click on a gap**: dispatching a click on the `.buttons` container (no `data-*`) runs
   `event.target.blur()` on a non-button element — no throw, display unchanged. Safe.
4. **Vocabulary single-source (D-005 clause 5, BOOT-001-arch1 F-2)**: `git diff` confirms
   `NUMBER_CHARACTERS` / `OPERATOR_VALUES` / `ACTION_VALUES` were **deleted** from `script.js`
   (lines 6–12 of the base file) and replaced by `isInput`. Grepped the shipped files: no remaining
   hand-maintained digit/operator/action value list outside `calculator-core.js`. `KEY_MAP` is
   built from `NUMBER_CHARACTERS` and `OPERATORS.keys()`, so the third consumer *derives* rather
   than copies. Condition met, not merely claimed.
5. **BOOT-001-arch1 F-1 (scan must cover `index.html`)**: `findMatches(stripHtmlComments('<button
   onclick="eval(x)">'), PATTERNS.dynamicCode)` now matches, and a bare `//evil.example.com` in
   markup matches `PATTERNS.externalHosts`. Closed. (Residual, F-5 below: an inline
   `<script>import …</script>` in `index.html` is still not caught by the static scan.)
6. **Display-write spy invariant**: two consecutive `Escape` presses (a no-op re-clear that renders
   an identical pair) increment the `textContent` write count by 2 — i.e. `updateDisplay()` writes
   unconditionally today, which is what makes the integration spy a valid dispatch oracle. Nothing
   pins that invariant; see F-4.

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Major | `script.js:74-76` (and `tests/helpers/dom-stub.js:118-134, 531-534`) | `event.target.blur()` runs on **every** click event, but the click a browser synthesizes for native `Enter`/`Space` activation of a focused `<button>` is indistinguishable here only because the *stub* models no click-origin signal. Result: production behavior contradicts the user's OQ-3 resolution ("`element.blur()` … **mouse-initiated clicks only** — a `Tab`-then-`Enter`/`Space` activation is unaffected and keeps native behavior") and AC-6's "keyboard-only users keep standard button activation". Probe 2 shows focus is destroyed after one native activation, so a `Tab` user restarts the focus order from the top of the document after every button press, and the next identical `Enter` means *equals* instead of *press this button again*. It is untested (no row asserts `activeElement` after activation), undocumented (README §Keyboard says only that `Tab` "behaves as normal"), and unrecorded (the unit's Known Issues list it nowhere, although the unit's own DoD requires stub-unmodelable behavior to be listed `UNVERIFIED` with residual risk). The direction of the dependency is the structural problem: a test double's fidelity gap is being paid for in shipped behavior. | Close it **either** by (a) modelling click origin — `detail: 1` on `page.click()`, `detail: 0` on the stub's native activation, and `if (event.detail > 0) event.target.blur();` in `script.js`, plus one integration row asserting `document.activeElement` is preserved after native activation and cleared after a mouse click (≈8 lines total, no new boundary), **or** (b) an explicit user decision accepting the simplification, recorded in `D-011` with the README and the unit's Known Issues stating the focus loss and the manual-browser check. (a) is the smaller change and restores the recorded decision; (b) is legitimate but is the user's call, not an agent's, because it overrides a user resolution. See `.agent/decisions/D-011-click-origin-and-focus-policy.md` (`status: proposed`). |
| F-2 | Minor | `script.js:30-46` vs `script.js:51-57` | `inputFromElement` and `isCalculatorButton` each destructure the same `{ number, operator, action }` dataset triple. The two semantics genuinely differ (*recognized* vs *valid*), but the knowledge "these three `data-*` attributes are calculator input" is now duplicated inside one file; renaming an attribute or adding a fourth means editing two functions, and the failure mode is a silently inert or silently double-handled button. | Extract one `rawInputFromElement(element) -> {type, value} \| null` (attribute → descriptor, no validation); then `inputFromElement = el => { const raw = rawInputFromElement(el); return raw && isInput(raw) ? raw : null; }` and `isCalculatorButton = el => rawInputFromElement(el) !== null`. ≈6 lines, behavior-preserving, no test change. Not blocking. |
| F-3 | Minor | `calculator-core.js:238-243` | `allowsRepeat` is the only public core entry point with no descriptor contract: `allowsRepeat(null)` throws a raw engine `TypeError: Cannot read properties of null (reading 'type')`, and `allowsRepeat({})` returns `false` (a malformed descriptor silently answers a policy question). `applyInput` and `isInput` both have explicit, named contracts (`D-003`), so a third convention at the same boundary invites a future channel to trust a meaningless `false`. | Either guard with the core's own style (`if (!isInput(input)) throw new TypeError('allowsRepeat: …')` — the tables are already in scope) or document in the `D-003` addendum that `allowsRepeat` is only defined for descriptors that `isInput` accepts. ≈3 lines. Not blocking. |
| F-4 | Minor | `tests/integration/keyboard.test.js:46-78` (used at :263, :277, :353, :371) | The `spyOnDispatches` write-counter is a reasonable adaptation — it observes the rendered output, the same surface `D-005` clause 7 tells presentation to use, instead of adding a test-only seam to production code — so I do **not** ask for a production hook. But its validity rests on an unstated invariant: `updateDisplay()` writes both lines *unconditionally* on every dispatch (probe 6 shows it does today). A future "skip the write when the rendered pair is unchanged" optimization would turn the four AC-6/AC-7 rows into false passes: a repeat that *was* wrongly re-dispatched would render identical text and increment nothing. | Pin the invariant with one cheap row: two consecutive `Escape` presses (a no-op re-clear) must increment the counter by 2. That makes the oracle self-checking and fails loudly if `updateDisplay` ever becomes conditional. Not blocking. |
| F-5 | Nit | `tests/regression/source-safety.test.js:18-30`, `tests/helpers/source-scan.js:112-124` | `BOOT-001-arch1` F-1 is closed for `dynamicCode`, `markupWrites` and `externalHosts`, but `PATTERNS.moduleSyntax` is still applied to `SCRIPT_FILES` only. Probe: an inline `<script>import a from "b"</script>` in `index.html` is not flagged by the static scan (the `type="module"` test does not cover it; only the DOM stub would fail at load). The `file://` promise is the invariant this guard exists for. | One line: `assertNoMatches('index.html', htmlCode, PATTERNS.moduleSyntax, …)` in the existing test. Fold into whichever unit next touches these files; not this unit's obligation. |

No Critical finding. F-1 is the only finding that blocks `APPROVED`.

## Assessments
- **D-005 clause-by-clause**:
  - **(1) Core is pure — HELD.** `calculator-core.js` references no `document`/`window`/timer/storage;
    probe 1 loads and exercises it in bare Node. `mapKey` takes a `key` string and a plain
    `{ctrlKey, metaKey, altKey}` object, never a `KeyboardEvent`, so no DOM type leaked in to make
    the map testable. This is the right line: `event.target`, `preventDefault`, focus and the
    `repeat` flag all stayed in the adapter, exactly as clause 1's rejected stricter alternative
    predicted.
  - **(2) One mutable binding — HELD.** `let state` in `script.js:12` is still the only mutable
    calculator state. The keyboard path added no module-level flag (notably *no* "last pointer
    event" variable — see D-011's rejected alternatives), and `KEY_MAP` is a closure-private
    `const Map` whose entries cannot be mutated by callers (probe 1).
  - **(3) One dispatch seam — HELD.** Grep of `script.js`: exactly one `applyInput` call, inside
    `dispatch`; exactly two `textContent` writes, both inside `updateDisplay`; no `.click(`
    anywhere, so no synthesized-click shortcut. The keydown listener converts → filters → calls
    `dispatch(input)`. There is no second display-write path.
  - **(4) Validation split — HELD.** The adapter drops unmapped keys and out-of-range `data-*`
    values silently (integration rows for `constructor`/`__proto__`/`''` pass and write no markup);
    the core still throws on a malformed descriptor. `isInput` correctly returns `false` rather
    than throwing, which keeps the boundary non-throwing while leaving `applyInput`'s throw intact.
  - **(5) Vocabulary exported once — HELD, and genuinely so** (probe 4). This is the clause most
    likely to have been satisfied on paper only; it was not. The `KEY_MAP` derivation from
    `NUMBER_CHARACTERS`/`OPERATORS` goes one step further than the clause required: the keyboard
    channel cannot even *list* a value the core disagrees with, so `x`/`X` are the only entries
    that could drift, and they are alias keys, not values.
  - **(6) Channel-agnostic policy is pure — HELD.** The repeat policy is a core predicate with unit
    rows; the adapter contributes only the DOM-level `event.repeat` flag. Ordering
    (`preventDefault()` *before* the repeat check) is the right call and is adapter policy: a
    suppressed repeat must still not scroll or re-submit.
  - **(7) Presentation may not read core state — NOT EXERCISED, and supported.** `dispatch(input)`
    has the descriptor in hand at the one place feedback would attach, and the rendered pair is
    readable from the DOM, so `KEY-002` can key off either without opening the state record. No
    rework needed; `state` never leaves the adapter closure.
- **`D-003` addendum**: I agree with all three entries. `isInput(descriptor)` over a bare
  `INPUT_VALUES` table is the better of the two forms `D-005` offered — it prevents the cross-type
  confusion (`{type:'number', value:'clear'}`) that an exported value-set invites, and it reuses the
  very `Map`s `applyInput` validates against, so "cannot drift" is a property of the code, not a
  promise. The `Map` lookups also keep `constructor`/`__proto__` out for free. Cost: one extra
  public function, which `D-003` had earlier deferred on YAGNI grounds — the third consumer is
  exactly the trigger it named, so the reversal is principled. My only amendment is F-3
  (`allowsRepeat` has no stated domain).
- **Boundaries and coupling**: the unit adds a channel, not a boundary — the right shape for T2
  work on an existing seam. Direction of dependency is still one-way (adapter → core); the core
  gained no knowledge of keys-as-events, only of key *strings*, which are data. Cohesion in
  `script.js` is good: three small helpers (`inputFromElement`, `isCalculatorButton`,
  `modifiersOf`), no God function, the two listeners each ~10 lines. Duplication between the click
  and key paths is limited to F-2.
- **Hidden state / impossible combinations**: none added. The only new implicit state the design
  leans on is the browser's focus, which is precisely where F-1 bites: focus is read
  (`isCalculatorButton(event.target)`) and written (`blur()`) by two different handlers with no
  stated invariant tying them together. F-1's remedy (a) states it: the adapter blurs what a
  pointer focused, and nothing else.
- **Testability seams**: good. The pure map/policy are unit-testable with no DOM; the channel is
  driveable end-to-end through the stub; the write-count oracle needs no production hook (F-4 asks
  only that its hidden premise be pinned). `tests/helpers/core-input.js` closes the
  `CALC-001-r1` F-3 duplication without editing the two existing unit files, which was the right
  call under CLAUDE.md §14.
- **Extensibility vs YAGNI**: cost of the next likely features is low — another channel (touch,
  paste) adds one listener plus one mapping function and reuses `isInput`/`dispatch`; `KEY-002`
  attaches at `dispatch`. Nothing speculative was built: no event bus, no registry, no
  channel-plugin abstraction. That is the correct trade at two channels.
- **Constraints**: zero dependencies (no `package.json` change), classic scripts only (`index.html`
  untouched; the regression scan now also guards the markup for dynamic code and external hosts),
  no build step, `file://` intact — the `keydown` listener on `document` needs nothing a `file://`
  page lacks.
- **Migration / rollback cost**: low. The unit is additive; reverting it removes one listener, one
  `blur()` and three core functions, but `inputFromElement` now depends on `isInput`, so a revert
  of `calculator-core.js` alone would break the click path — revert both shipped files together.
  Worth one line in the unit Log rather than a change.

## Unverifiable
- **Real browser behavior** (no browser available, RK-3): that a native `Enter`/`Space` activation
  really produces a click with `detail === 0` while a mouse click produces `detail >= 1` (the UI
  Events definition, and the basis of F-1 remedy (a)); that real OS auto-repeat sets
  `event.repeat` as the stub assumes; that `preventDefault()` on the mapped keys does not break a
  real IME or an accessibility tool. A manual pass by the user remains required either way.
- **Focus-ring and screen-reader consequences** of the blur (F-1): I verified the focus *state*
  in the stub only; how a screen reader announces the loss is untested and untestable here.
- I did not read handoffs `KEY-001-04`, `-06`, `-08` (off limits by dispatch), so no implementer or
  integration-tester rationale informs any statement above.
