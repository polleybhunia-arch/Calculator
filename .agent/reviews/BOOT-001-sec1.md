---
unit: BOOT-001
reviewer: security-reviewer
model_attested: claude-opus-5
reviewed_ref: 28a19873b0c03224e111afb30e44829c919c9945
verdict: APPROVED
cycle: 1
---

# Security review BOOT-001 sec1 — verdict: APPROVED

Runtime model attestation: **claude-opus-5** (Opus family, no fallback). The dispatch handoff
`BOOT-001-12` was written by the orchestrator under `FALLBACK(opus->sonnet)`; that does not apply to
this review.

Scope: independent security review of the diff `e02035ba..28a19873` under the assumption that the
DOM (button markup and every `data-*` attribute value) is attacker-controlled. Handoffs
`BOOT-001-06`, `-08`, `-10` were not opened. No file on disk was changed except this review and
`.agent/handoffs/BOOT-001-15-security-reviewer-to-orchestrator.md`; `git status` and `git rev-parse
HEAD` are identical before and after (verified).

**No exploitable weakness was found at this ref.** All five findings are Minor: they concern the
durability of the guards (test adequacy and static-scan coverage), not a defect that can be attacked
today. The change is a net security improvement over the baseline (see "Baseline comparison").

## Acceptance criteria verdicts
Only the security-relevant ACs named in the dispatch are judged here. AC-2…AC-5 and AC-8 are
behavior criteria and belong to the code review; this file deliberately says nothing about them, so
that the machine-read AC block of `review_file` stays the code reviewer's.

- AC-1: SATISFIED — I loaded `calculator-core.js` with `require()` in a plain Node process where `typeof document === 'undefined'` and `typeof window === 'undefined'`; it loaded without throwing and exported exactly `createState`, `applyInput`, `render`. `render(createState())` gave `{expression:'',current:'0'}`. Two independently created states did not interfere, and `JSON.stringify(state)` was byte-identical before and after applying inputs derived from it (no mutation of the argument, no module-level mutable state). Under CommonJS `globalThis.CalculatorCore` stayed `undefined`, i.e. the dual-export guard does not leak a global into Node.
- AC-6: SATISFIED (security aspect only) — the page really is driven through `index.html` + the two `<script src>` tags in document order, and every display update reaches the page through `textContent`. I re-ran the integration suite (20/20) and additionally clicked 19 hostile/synthetic targets through the stub: in every case `document.markupWrites` stayed empty, nothing threw, and the display kept the last valid value. Behavior equality against the matrix is the code reviewer's verdict, not mine.
- AC-7: SATISFIED as a property of the tree, with a test-coverage gap (F-1, F-2) — I ran the AC-7 pattern families over **all three** shipped files myself (the suite only runs three of the four families over the two `.js` files): zero hits for module syntax, `eval`/`new Function`/`Function(`/`document.write`, `innerHTML`/`outerHTML`/`insertAdjacentHTML`, and absolute or protocol-relative URLs. `index.html` additionally has zero inline event-handler attributes, zero `javascript:` URLs, zero inline `<script>` blocks, and its only `src`/`href` values are `style.css`, `calculator-core.js`, `script.js`. `script.js` has exactly two display-write sites, both `.textContent =`.

## What I ran myself
Gates were **not** re-run through `run-gate.mjs` on purpose: it writes `.agent/test-results/...`, and
my dispatch forbids changing any file but this review and my handoff. I ran the gate commands from
`.agent/gates.json` directly instead, at `head_ref` `28a19873`:

| Command (from `.agent/gates.json`) | Result |
|---|---|
| `node --test "tests/unit/**/*.test.js"` | 52 tests, 52 pass, 0 fail |
| `node --test "tests/integration/**/*.test.js"` | 20 tests, 20 pass, 0 fail |
| `node --test "tests/regression/**/*.test.js"` | 13 tests, 13 pass, 0 fail |
| `node --check script.js` and `node --check calculator-core.js` | both parse (the second is outside the lint gate — OQ-7) |

These match the orchestrator's evidence files `.agent/test-results/BOOT-001/latest-{unit,integration,regression}-final.json`
(52/20/13, `dirty: false`, `head` = `28a19873…`), which I read rather than trusted.

Hostile-input experiments (all via `node --eval`, nothing written to disk):
1. **Core, 40 malformed descriptors** — prototype-keyed values (`__proto__`, `constructor`, `prototype`, `toString`, `hasOwnProperty`, `valueOf`) for `type`, `operator` and `action`; markup payloads, multi-character and empty strings, non-ASCII digits (`٠` U+0660, `１` U+FF11), numbers, `null`, `undefined`, arrays, objects with a `toString`, and `Object.create(null)`. Every one threw a `TypeError` with a fixed, non-leaking message; `Object.prototype` gained no keys; the passed-in state rendered unchanged afterwards.
2. **DOM layer, 19 hostile click targets** through the stub — synthetic buttons carrying `data-number="<img src=x onerror=alert(1)>"`, `data-number="__proto__"`, `data-number="constructor"`, `data-number=""`, `data-number="12"`, `data-operator="__proto__"`, `data-operator="constructor"`, `data-action="__proto__"`, `data-action="constructor"`, `data-action="toString"`, `data-action=""`, an element carrying `data-number` + `data-operator` + `data-action` at once, an element with an invalid `data-number` plus a valid `data-action`, an attribute-less element, a bare `<div>`, a `<span>` nested inside a real button, and the `.buttons` container itself. Result in every case: no throw, no state change, `markupWrites` empty, display unchanged. The one valid control (`data-number="9"`) did update the display, so the probe was not vacuous.
3. **Unbounded growth / numeric extremes** — 40 consecutive `9` clicks, then `× 9`, then 40 more, then `=`: display became `1.0000000000000001e+81` as text, no throw, no markup write, no `Object.prototype` mutation.
4. **Static-scan evasion battery** — I replayed the five `source-safety.test.js` assertions against mutated copies of `index.html` and against eight script snippets held in memory (see F-1, F-2 for the two that got through).
5. **Mutation probes of the boundary filter** — using the stub's `transform` hook, with each of the three `script.js` value checks disabled in turn, to find out which of them any test actually pins (see F-3).

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | tests/regression/source-safety.test.js:32-46 (via tests/helpers/source-scan.js:71-83) | AC-7 says none of the **three** shipped files may contain `eval`, `new Function`, `document.write`, `innerHTML`/`outerHTML`/`insertAdjacentHTML` or module syntax, but the three `assertNoMatches` loops iterate `SCRIPT_FILES` only. `index.html` is scanned for exactly two things: `<script type="module">` tags and non-relative `src`/`href`. I confirmed empirically that adding `onclick="eval(atob(x))"` to a button, or an `<img src="x.png" onerror="new Function(location.hash)()">`, leaves all five regression tests green. Exploit/impact: not exploitable at this ref (index.html has zero inline handlers), but the regression net is what CLAUDE.md §4 relies on to stop a later careless or hostile edit. An inline event handler is the cheapest way to get dynamic code into this page, and it is the one variant nothing checks — an inline `<script>` block *is* caught, by `tests/integration/dom-click.test.js:32` ("every script tag must have a src"). | Run `PATTERNS.dynamicCode`, `PATTERNS.markupWrites` and `PATTERNS.moduleSyntax` over the raw `index.html` as well as the two scripts, and add one assertion that `index.html` contains no attribute matching `/\son[a-z]+\s*=/i`. Guarding test: a new regression row "index.html contains no inline event handler attribute", plus extending the two existing rows to loop over `SHIPPED_FILES`; each must fail when a probe handler is injected. |
| F-2 | Minor | tests/helpers/source-scan.js:16-50 | `stripComments` mis-parses regex literals. The limitation is documented on line 14, but it is a **false negative**, not just noise: in a literal such as `/https?:\/\//` the escaped slash pair ends with `/` followed by the terminating `/`, the stripper takes that as a line comment and discards the remainder of the line. I verified that `const re = /https?:\/\//; eval(payload);` strips to `const re = /https?:` and that `PATTERNS.dynamicCode` then reports zero matches; the same trick hides `el.innerHTML = x`. Exploit/impact: an attacker-shaped or simply careless edit can place dynamic code or a markup write on such a line and the security regression suite still reports green. Neither shipped file uses a regex literal today, so nothing is hidden at this ref. | Either handle regex literals in the tokenizer, or (cheaper and self-evidently safe) scan the raw source too and treat a raw-only hit as a failure unless the line is provably a comment; or assert that the shipped scripts contain no regex literal at all, which is true today. Guarding test: a unit test of `stripComments` with `const re = /https?:\/\//; eval(payload);` asserting the `eval` survives. |
| F-3 | Minor | script.js:41, script.js:44 | The `data-operator` and `data-action` branches of the boundary filter are pinned by **no** test. Mutation probes: replacing `OPERATOR_VALUES.includes(operator)` with `true` leaves the integration suite at 20/20; replacing `ACTION_VALUES.includes(action)` with `true` also leaves it at 20/20. (The `data-number` branch *is* pinned — the same probe makes "treats a button data attribute containing markup as inert text" fail.) Exploit/impact: no vulnerability today, because the core validates the same values through `Map` lookups. With the DOM check removed, a crafted `data-action="constructor"` makes `applyInput` throw inside the click listener: I observed an uncaught `TypeError`, the display frozen at its previous value and no user-visible `Error` — a broken-page condition on a hostile button, contrary to CLAUDE.md §4 ("user-facing failures show `Error`"). The sharper risk is compounding: D-003 records the `Map` choice as the anti-prototype-pollution measure, and a future "simplification" of `OPERATORS`/`ACTIONS` to object literals would restore prototype-chain resolution for `constructor`/`__proto__` with zero failing tests, because neither layer's rejection of those values is asserted end to end. | Add integration rows that assert the *result*, not merely "does not throw": clicking a synthetic button with `data-operator="__proto__"`, `data-action="constructor"`, `data-action=""` and `data-number=""` must leave the display byte-identical to before the click, and clicking an element carrying several `data-*` attributes must follow the documented number→operator→action precedence. Each row must fail under the corresponding mutation probe. |
| F-4 | Minor | tests/helpers/dom-stub.js:392-421, 448 | `loadPage()` silently honours the `CALC_STUB_TRANSFORM` environment variable and rewrites the shipped script source in memory before running it. `run-gate.mjs` records the command, SHA and dirty flag but **not** the environment, so a gate run performed with that variable set produces an evidence JSON that is indistinguishable from an honest one while the code under test is not the code on disk. I used this deliberately for F-3 and confirmed the suites report a normal 20/20. Existing mitigations: it throws if the occurrence count differs, and `process.emitWarning` fires once — but the warning lands in stderr, which `run-gate.mjs` folds into a 40-line `outputTail` where it is easy to lose. Impact: evidence integrity of gates 6/7, not a product vulnerability. | Make the probe explicit per call: drop the `readTransformFromEnv()` default so a transform must be passed as `loadPage({ transform })`, or have the stub expose the active transform and have every test file assert it is `null`. Guarding test: an integration assertion that `page.transform === null` in a normal run. |
| F-5 | Nit | script.js:35 | `const { number, operator, action } = element.dataset;` has no guard on `element.dataset`. Unreachable today: the listener sits on `.buttons` and every descendant in `index.html` is an `HTMLElement`. It becomes reachable the moment a button gets an `<svg>` icon child, on engines without `SVGElement.dataset`; the click handler would then throw a `TypeError` with no user-visible `Error`. Hardening, not a vulnerability. | `if (element === null \|\| element.dataset === undefined) { return null; }` at the top of `inputFromElement` — a boundary check, not a swallowed error. Guarding test: an integration row clicking a target whose `dataset` is undefined. |

No Critical or Major finding is open, so the verdict is `APPROVED`. F-1…F-3 are worth a follow-up
unit (they harden the guards that keep this property true); they do not justify holding BOOT-001,
because the property each of them guards is one I verified directly at this ref.

## Assessments

- **Trust boundaries and data flow.** Exactly one entry point exists in the diff. Attacker-controlled
  data: the `data-number` / `data-operator` / `data-action` attribute values of whatever element a
  `click` originates from inside `.buttons`. Flow: `click` → `event.target` → `element.dataset` →
  `inputFromElement` (`script.js:34-47`, the boundary) → `{type, value}` descriptor → `applyInput`
  (`calculator-core.js:131-157`, revalidates) → new state → `render` (returns two strings) →
  `textContent` (`script.js:22-23`). There is no other source of data: no URL parsing, no
  `location`, no `localStorage`/`sessionStorage`, no cookies, no `fetch`/`XMLHttpRequest`, no
  `postMessage`, no `JSON.parse` of external data, no timers, no keyboard handler yet. I grepped the
  product and test files for all of these and for `(https?|wss?|ftp)://` and got zero hits.
- **Injection.** There is no HTML, SQL, command or template sink in the diff. The only two sinks are
  `expressionDisplay.textContent` and `currentDisplay.textContent`; both receive `render()` output,
  which is built by `Array.prototype.join('')` and `String()` from validated single characters,
  operator symbols and numeric strings. `textContent` does not parse markup, so even a payload that
  reached the string would render inert — the integration row
  "treats a button data attribute containing markup as inert text" plus my own probes confirm the
  payload never gets that far anyway. No `eval`, `new Function`, string `setTimeout`/`setInterval`,
  or dynamic `import()` anywhere in the three shipped files.
- **Validation at the boundary.** Correct and layered, and it matches what D-003 claims. The DOM
  layer checks presence with `!== undefined` (so `data-number=""` is rejected rather than falling
  through to the operator branch — I confirmed this specific case) and checks membership against
  three literal tables. The core independently re-validates with `typeof`/length checks and `Map`
  lookups. Using `Map` rather than object literals is the reason `constructor`, `__proto__`,
  `toString` and friends are rejected instead of resolving to inherited members; I confirmed
  `Object.prototype` is untouched after the full hostile battery.
- **Test adequacy for security behavior.** Mixed, and the main content of this review. Pinned: the
  `data-number` boundary (mutation probe bites), the absence of markup writes
  (`page.markupWrites` traps in the stub cover `innerHTML`/`outerHTML`/`insertAdjacentHTML`/
  `document.write`), the core's rejection of 14 malformed descriptors including prototype-keyed
  operator and action values (`tests/unit/calculator-core.test.js:127`), the no-inline-script and
  script-order contract, and the relative-URL contract. Unpinned: F-1, F-2, F-3. Note also that the
  one hostile-markup integration row asserts only `doesNotThrow`, `markupWrites === []` and
  `typeof … === 'string'`; it never asserts the resulting display, which is why it catches a deleted
  filter only through the exception path.
- **Baseline comparison.** At `e02035b`, `script.js` passed `button.dataset.number` straight into
  `appendNumber` with no validation of any kind, and `dataset.operator` straight into an object
  lookup `operatorSymbols[nextOperator]` — a plain object literal, i.e. `data-operator="constructor"`
  resolved to `Object.prototype.constructor` and was assigned into the history trail. The diff
  removes both of those, so BOOT-001 measurably reduces attack surface. Display writes were already
  `textContent` at baseline and still are.
- **Error handling and information leakage.** The core's `TypeError` messages are fixed strings that
  state the allowed input shape; they contain no state, no paths and no user data. They are thrown,
  never rendered, and are unreachable from the DOM path. No empty `catch` and no swallowed error
  exists in the shipped files. The one behavioral wrinkle is F-3's: if the boundary were bypassed,
  the failure surfaces as an uncaught exception rather than the `Error` display CLAUDE.md §4
  mandates.
- **Robustness.** `NaN`/`Infinity`/huge input: 80 digits multiplied out render as
  `1.0000000000000001e+81` text — ugly, unchanged from baseline, not a security issue. Unbounded
  growth: `currentInput` grows one character per click with no cap; reaching a harmful size requires
  scripted event dispatch, which already implies code execution. No regex in the shipped files, so no
  catastrophic-backtracking surface there. (`tests/helpers/dom-stub.js:328` does use a regex with a
  nested quantifier over HTML, but its only input is the repo's own `index.html`; out of scope for
  the shipped product, worth remembering if a later unit feeds it arbitrary markup.)
- **Supply chain / secrets / filesystem.** No `package.json`, no lockfile, no `node_modules`, no new
  runtime or dev dependency, no third-party script, no CDN, no SRI question — zero absolute or
  protocol-relative URLs in the whole diff. I grepped the full diff for API keys, tokens, passwords,
  bearer values, private-key headers and common credential prefixes: no hits (the matches on
  "token" are the HTML/selector parsers' local variables). The test harness only reads inside the
  repository: `dom-stub.js:423-432` (`assertLocalScriptPath`) refuses a script `src` with a scheme or
  a leading `/` and refuses any path resolving outside `REPO_ROOT`, and `source-scan.js:9` resolves
  everything from `REPO_ROOT`. Nothing writes outside the repo.
- **Global exposure.** In the browser branch the core publishes one writable global,
  `globalThis.CalculatorCore`, and `script.js` destructures it once at load. A script that ran before
  `calculator-core.js` could shadow it — but that presupposes script execution on the page, at which
  point the calculator is not the asset worth protecting. It is not fixable without ES modules, which
  the `file://` promise forbids (D-001). `script.js` keeps its own `state` inside an IIFE closure, so
  no calculator state is reachable from the global scope; I verified `render(null)` and a
  hand-poisoned state object only misbehave if the caller is already compromised.

## Unverifiable
- **Real-browser behavior.** No browser is available in this environment. Everything DOM-related was
  exercised through `tests/helpers/dom-stub.js`, which explicitly does not model CSS, layout, focus,
  real pointer/touch events, capture-phase listeners, real markup parsing or `file://` loading.
  Residual risk: a divergence between the stub's `dataset` Proxy (`dom-stub.js:168-184`) and a real
  `DOMStringMap` — for example real-browser `data-*` name normalisation, or an element type whose
  `dataset` is absent (F-5) — would not be caught here. The DOM-safety conclusions are as good as the
  stub, and no better.
- **Effect of a trusted-types or CSP policy.** The page ships no CSP and none is required by any AC;
  I did not assess what a deployed CSP would add, since the README distribution model is a local
  file.
- **The code reviewer's and architecture reviewer's remits.** Behavior equivalence with the baseline
  (RK-1 drift), the mid-chain divide-by-zero carve-out, and the module boundary are outside this
  review. I noticed but did not judge that `deleteLastDigit`'s baseline `currentInput === '-'` branch
  was not ported (D-003 argues it is unreachable; my reading agrees, but that call belongs to the
  code review).
- **Lint coverage.** The lint gate is `node --check script.js` and does not cover
  `calculator-core.js`. That is OQ-7, already owned by the user and blocking gate 8; I ran
  `node --check calculator-core.js` by hand (it parses) but that is not gate evidence.
