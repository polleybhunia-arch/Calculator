---
unit: KEY-001
reviewer: security-reviewer
model_attested: claude-opus-5
reviewed_ref: 5678cc1b70f39af6859c980a8520bb858418a140
verdict: APPROVED
cycle: 2
---

# Security review KEY-001 sec2 — verdict: APPROVED

Runtime model attestation: **claude-opus-5** (Opus family, no fallback). The dispatch handoff
`KEY-001-18` was written by the orchestrator under `FALLBACK(opus->sonnet)`; that does not apply to
this review, so no `review_fallback` and no REDUCED ASSURANCE label is warranted from my side.

Scope: a **fresh, full** security review of `f9426e28..5678cc1b` — not a delta review of the D-011
fix — under the assumption that the DOM (markup and every `data-*` attribute value), keyboard
events, and now `MouseEvent.detail` are attacker-controlled. Handoffs `KEY-001-04`, `-06`, `-08` and
`-16` were not opened. My cycle-1 file `KEY-001-sec1.md` was read only as the dispatch permitted, and
every conclusion below was re-derived by execution at this head rather than carried over on trust.

**No exploitable weakness was found at this ref.** The D-011 `event.detail` gate introduces no new
injection, data-exposure or privilege surface: `detail` is read for exactly one purpose — deciding
whether to call `element.blur()` — and never reaches `applyInput`, `render`, `textContent` or any
other sink. All five findings are the Nit-level hardening items carried from cycle 1; I re-verified
each is still accurately described, and none is Critical or Major, so none blocks `APPROVED`.

**Ref note (not a blocker):** `git rev-parse HEAD` is `6d31d7fe`, two commits ahead of `head_ref`.
`git diff 5678cc1b..HEAD -- . ':(exclude).agent'` is **empty** and `git status --porcelain` is clean,
so the tree I read and executed is byte-identical to `head_ref`. This verdict binds to
`5678cc1b70f39af6859c980a8520bb858418a140`.

## Acceptance criteria verdicts
Only the security-relevant ACs named in the dispatch are judged here. AC-2, AC-3, AC-4, AC-7 and
AC-8 are behavior/documentation criteria belonging to the code review; this file deliberately says
nothing about them, so the machine-read AC block of `review_file` stays the code reviewer's.

- AC-1: SATISFIED — key path and click path produce identical output at this head (keys
  `4 + 8 + 9 Enter` → `{"4+8+9","21"}`; clicks `4 + 8 + 9 =` → `{"4+8+9","21"}`). The input
  vocabulary is still exported once (`isInput`, `calculator-core.js:187`) and is the only validity
  source for both adapters; `KEY_MAP` (`calculator-core.js:209`) is *derived* from
  `NUMBER_CHARACTERS` and `OPERATORS`, so no third hand-maintained table exists. Dropping the
  `isInput` filter from any one of the three `data-*` branches fails a test (mutation probes 4–6).
- AC-5: SATISFIED — re-probed from scratch at this head: all **23** mapped keys call
  `preventDefault()`; all **15** unmapped keys (`a`, `F5`, `Tab`, `' '`, `ArrowLeft`, `Shift`, `c`,
  `C`, `:`, `` ` ``, `PageDown`, `Home`, `F12`, `Insert`, `ContextMenu`) leave both display lines
  unchanged **and** `defaultPrevented === false`; all **69** mapped-key × `ctrlKey`/`metaKey`/`altKey`
  combinations are likewise inert and unprevented. `preventDefault()` is reached only after `mapKey`
  returns non-null (`script.js:95-101`), so RK-5 ("over-broad `preventDefault`") stays closed —
  widening it to every key fails 5 tests (mutation probe 4). `Tab` and `Space` remain outside the map.
- AC-6: SATISFIED (security aspect) — both halves verified directly: a mouse click leaves
  `document.activeElement === null` and `click 4` then keys `+ 8 Enter` renders `4+8` / `12` (not
  `4+84`); a `Tab`-focused button activated natively by `Enter` **and** by `Space` types once and
  **keeps** focus. No double-action path exists: the keyboard listener never synthesizes a
  `button.click()`, and the `Enter`/`Space`-on-a-calculator-button early return (`script.js:89`)
  precedes any dispatch. The click-side boundary filter was not weakened — 66 hostile
  `data-number`/`data-operator`/`data-action` values produced zero state changes, zero exceptions and
  zero markup writes.

## What I ran myself
Independent re-execution at the reviewed tree (`CALC_STUB_TRANSFORM` confirmed **unset** in my shell
for all non-mutation runs; every probe ran from stdin, writing nothing anywhere).

| Command | Result |
|---|---|
| `node --test "tests/unit/*.test.js"` | 83 pass / 0 fail |
| `node --test "tests/integration/*.test.js"` | 46 pass / 0 fail |
| `node --test "tests/regression/*.test.js"` | 25 pass / 0 fail |
| `git status --porcelain` | empty (clean) |
| `git diff 5678cc1b..HEAD -- . ':(exclude).agent'` | empty (see ref note) |

Counts match the recorded evidence `.agent/test-results/KEY-001/latest-{unit,integration,regression}-final.json`
exactly (83 / 46 / 25, 0 fail, `head` `5678cc1b…`, `dirty: false`), and `latest-lint-final.json`
(`node --check` on both scripts, exit 0). No test was modified, added or skipped by me.

**Mutation probes (do the security-relevant tests bite?).** Run via the stub's in-memory
`CALC_STUB_TRANSFORM` hook — nothing on disk was modified. Every one is caught:

| # | Mutation | Result |
|---|---|---|
| 1 | remove the `detail` gate (blur on every click — the D-011 defect) | 1 test fails |
| 2 | remove `blur()` entirely (the original `4+84` bug) | 1 test fails |
| 3 | invert the gate to `event.detail === 0` | 1 test fails |
| 4 | drop `isInput` filtering for `data-operator` | 1 test fails |
| 5 | drop `isInput` filtering for `data-action` | 1 test fails |
| 6 | drop `isInput` filtering for `data-number` | 1 test fails |
| 7 | `preventDefault()` on every key (over-broad, RK-5) | 5 tests fail |
| 8 | ignore Ctrl/Meta/Alt (`modifiersOf` → `{}`) | 1 test fails |
| 9 | remove the `Enter`/`Space` early return (double action) | 1 test fails |

Probes 1–3 are the cycle-1 gap the code reviewer named (r1 F-1: the old AC-6 row dispatched on
`document.body` regardless of focus and could not fail when `blur()` was removed). The corrected row
now discriminates in **both** directions.

Hostile probes (all in-memory, stdin scripts, no file written):

- **Probe A — the new `event.detail` surface.** 28 values delivered as the click event's `detail` on
  a real, focused button: `0`, `1`, `2`, `-1`, `0.5`, `1e308`, `NaN`, `±Infinity`, the strings `"1"`,
  `"0"`, `" "`, `"abc"`, `true`, `false`, `null`, `undefined`, an absent property, `{}`, `[]`, `[1]`,
  `[[2]]`, `{valueOf:()=>1}`, `{toString:()=>'1'}`, `1n`, a `Symbol`, a throwing `valueOf` and a
  throwing getter. **In every case the dispatched calculator action was identical (`7`) and
  `markupWrites` stayed 0** — `detail` changed only whether focus was dropped. Non-numeric values
  (`NaN`, `undefined`, absent, `{}`, strings) fail toward *not* blurring, i.e. toward the browser's
  own default; a `Symbol` or a throwing `valueOf` propagates out of the listener *after* the state
  change already applied (nothing swallowed, consistent with CLAUDE.md §4) and is unreachable in a
  real browser because `UIEvent.detail` is a `long` in the IDL.
- **Probe B — click boundary.** 3 attributes × 22 hostile values (`constructor`, `__proto__`,
  `prototype`, `toString`, `valueOf`, `hasOwnProperty`, `''`, `'12'`, `'9 '`, `'1e3'`, `'CLEAR'`,
  `'equals;'`, `clear\u0000`, `<img src=x onerror=alert(1)>`, `javascript:alert(1)`, `9;alert(1)`,
  `${x}`, `0x41`, `'+ '`, `//evil.example.com`, U+202E, a lone surrogate) on synthetic buttons
  appended to `.buttons` = **66 rows, 0 anomalies**: no state change, no exception, no markup write.
- **Probe C — keydown boundary.** 18 hostile `key` values (including a 200 000-character key and the
  prototype names) → inert, `preventDefault` not called, no throw. 7 malformed `key` types
  (`undefined`, `null`, `4`, `{}`, `['4']`, `true`, `Symbol`) → inert, no throw. Prototype pollution
  (`Object.prototype.q`, `Object.prototype.detail`) is ineffective: `mapKey('q')`,
  `mapKey('constructor')`, `mapKey('__proto__')` all return `null`, `isInput` still returns `false`,
  and the polluted `detail` does not reach the gate (the event's own property wins, and in a real
  browser `detail` is an own accessor on `UIEvent.prototype`).
- **Probe D — scanner efficacy at this head.** Against an in-memory copy of `index.html` the widened
  scan flags inline `onclick="eval(x)"`, `onclick="new Function(y)()"`, `onclick="…innerHTML=z"`,
  `<script>document.write(q)</script>`, a protocol-relative `<script src="//host">`, an absolute CDN
  `<link href="https://…">`, `<script type="module">`, `href="javascript:alert(1)"`, and a bare
  `//host` in a `<meta content=…>`. It does **not** flag a string `setTimeout('…')` (F-4),
  `url(//host)` inside a `style` attribute (carried r1 F-5), or a payload inside an HTML comment
  (intended).
- **Probe E — `stripComments`.** With correctly escaped inputs (`String.raw`) the D-009 fix holds:
  `/https?:\/\//; eval(payload);` keeps `eval(`, as do a `/` inside a character class, `/a\/\*b/`,
  division after an identifier / `)` / `++`, `"http://x"`, `` `//x` ``, an unterminated regex and a
  ternary. Genuine `//` and `/* */` comments are still stripped. The documented keyword-position
  limitation is real and I reproduced it (`return /a\/\//; eval(x);` and `typeof /a\/\//; eval(x);`
  both lose the `eval(`) — it is the already-recorded known issue, and neither shipped script
  contains a regex literal at all. Running the stripper over both shipped scripts yields no pattern
  hit in `dynamicCode`, `markupWrites`, `externalHosts` or `moduleSyntax`.
- **Probe F — sinks, secrets and supply chain by direct search.** `grep -E` over `index.html`,
  `script.js`, `calculator-core.js`, `style.css` for `innerHTML|outerHTML|insertAdjacentHTML|
  document.write|eval|new Function|setTimeout|setInterval|localStorage|sessionStorage|fetch|
  XMLHttpRequest|postMessage|location|import(` → **no match**. The only DOM writes are
  `script.js:16-17` (`textContent`). No `package.json`, lockfile or `node_modules` exists. `style.css`
  contains no `url(`, `@import`, `http:` or `//`. `index.html` contains no `<input>`, `<textarea>`,
  `contenteditable`, `<form>` or inline `on*=` handler. The product/test diff contains no
  secret-like string (only the word "token" in the test-helper parser sense).

## Findings
All five are carried from cycle 1, re-verified as still accurate at this head. None is exploitable
without pre-existing script control of the page; none blocks approval. **No new finding is introduced
by the D-011 fix.**

| ID | Severity (Critical/Major/Minor/Nit) | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Nit | `script.js:51-57, 89-93` | `isCalculatorButton()` returns true for **any** element carrying a `data-number`/`-operator`/`-action` attribute, regardless of tag name or value validity. **Exploit scenario:** an attacker who can inject markup adds `<div data-action="x" tabindex="0">`; while it holds focus, `Enter`/`Space` hit the early return and the browser performs no native activation either, so those keys become inert. Re-verified at this head: with the div focused, `Enter` left the display at `5` and `preventDefault` was not called. Impact is denial-of-function only, and markup injection into a static `file://` page already implies full script control — hence Nit. | Narrow the guard to elements the browser will actually natively activate: also require `element.tagName === 'BUTTON'` (and optionally `inputFromElement(element) !== null`). Guard test: `keydown` `Enter` on an injected non-button element bearing `data-action` must still evaluate the expression. |
| F-2 | Nit | `script.js:88` (design), `.agent/decisions/D-005-layering-rule.md` | The `keydown` listener is global on `document` and `preventDefault()`s all 23 mapped keys with no check of `event.target`. Safe **today only because `index.html` contains no `<input>`, `<textarea>`, `<form>` or `contenteditable`** — re-verified by reading the whole file and by grep. **Exploit scenario (future):** the moment a text field is added, digits, `.`, `,`, operators, `Backspace`, `Escape` and `Delete` typed into it are stolen and suppressed — a functional denial, not a disclosure. | Record the constraint where the next author will see it (D-005 and/or a comment at `script.js:88`), and add the guard when a field first appears: return early when `event.target` is an `INPUT`/`TEXTAREA`/`[contenteditable]`. A regression row asserting "index.html contains no editable field" would make the assumption enforced rather than remembered. |
| F-3 | Nit | `tests/helpers/source-scan.js:10` | `SHIPPED_FILES` omits `style.css`, which is shipped and can itself reach third parties. **Exploit scenario:** a later `@import url('//cdn…')` or a remote `url(…)` font/background leaks the user's IP and User-Agent to a third host on every page load and passes every gate. `style.css` is clean today (re-verified: no `url(`, `@import`, `http:`, `//`). Out of this unit's declared D-009 scope, so not a KEY-001 defect. | Add `style.css` to the `externalHosts` scan (raw text with CSS comments stripped), plus a `url()`/`@import` relative-path assertion mirroring the `findReferences` check for `index.html`. |
| F-4 | Nit | `tests/helpers/source-scan.js:120` | `PATTERNS.dynamicCode` covers `eval`, `new Function`, `Function(` and `document.write`, but not the string forms `setTimeout('…')`/`setInterval('…')`, nor inline `on*=` handler attributes in general. Re-verified in probe D: an injected `onclick="setTimeout('alert(1)',0)"` passes the scan. **Exploit scenario:** a future commit introduces string-form dynamic code and the AC-7 regression row that exists to prevent exactly that stays green. Nothing is exploitable now — the shipped files contain no timer at all. | Add `/\bset(?:Timeout\|Interval)\s*\(\s*['"`]/` to `dynamicCode`, and consider an `index.html` assertion that no `on[a-z]+=` attribute exists at all — a stronger and simpler invariant than pattern-matching handler bodies. |
| F-5 | Nit | `tests/unit/key-map.test.js` | `isInput`'s rejection of `constructor`/`__proto__` **is** pinned (lines 46-47), but `mapKey`'s is not — the unmapped-key row uses `a`, `F5`, `Tab`, `ArrowLeft`, `Space`, `Shift`, `` ` `` only. The safety comes from `KEY_MAP` being a `Map`. **Exploit scenario:** a future refactor to an object literal makes `mapKey('constructor')` return `Object.prototype.constructor`; `applyInput` would then throw an uncaught `TypeError` in the listener — fail-closed and noisy, not a bypass, but the test that should have caught the refactor would not. | Add one unit row: `mapKey('__proto__')`, `mapKey('constructor')`, `mapKey('toString')` each return `null`. |

## Assessments
- **Requirement satisfaction**: the two security clauses of the Definition of Done hold at this head —
  no input-derived string reaches `innerHTML`/`eval`/`new Function` (probes D, E, F), and
  `preventDefault()` is not unbounded (AC-5 probe: 23 in, 15 + 69 out). The map is a closed allowlist
  derived from the core's own constants.
- **Input → sink trace (the required map, re-derived at this head).** `KeyboardEvent` →
  `script.js:88` listener → `isCalculatorButton(event.target)` early return for `Enter`/`Space`
  (`script.js:89-93`, before any dispatch) → `modifiersOf(event)` (`script.js:61-63`, copies three
  booleans into a fresh plain object) → `mapKey(event.key, …)` (`calculator-core.js:226`, closed
  `Map` allowlist, returns a **fresh copy** of the descriptor) → `dispatch(input)` (`script.js:21`) →
  `applyInput(state, input)` (`calculator-core.js:142`, re-validates type *and* value and throws on
  anything malformed) → `render(state)` (`calculator-core.js:170`) → **`textContent` only**
  (`script.js:16-17`). The parallel click path is `click` → `inputFromElement(event.target)`
  (`script.js:30-46`, every branch filtered by `isInput`) → the same `dispatch`. The strings that
  reach the DOM are built from `state.history.join('')` and `state.currentInput`, which can only hold
  allowlisted single characters, operator display symbols, `Error`, or `String(number)`. There is no
  `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`, no `eval`/`new Function`/string
  timer, no `import()`, no `location`/`href` write, no `postMessage`, no storage and no network call
  anywhere in the diff. An attacker-supplied `event.key` can at most cause one of the legitimate
  calculator actions.
- **The `event.detail` gate — the question the dispatch asked me to answer explicitly, not to agree
  with.** `event.detail` is now read by production code (`script.js:80`), but it is a **pure control
  signal for `blur()`**: it is never compared against, concatenated with, or propagated into any
  value that reaches `applyInput`, `render` or `textContent` (probe A: the dispatched action was
  identical for all 28 values, `markupWrites` stayed 0). Spoofing it therefore cannot cause injection
  or data exposure. The only reachable effect of a spoofed `detail` is *whether a calculator button
  keeps DOM focus*, and:
  - `blur()` **removes** focus; it can never move focus to an attacker-chosen element (focus falls to
    the document body), so it is not a focus-stealing primitive.
  - the converse — `detail: 0` on a synthetic click so the button *keeps* focus, which could make a
    later real `Enter` re-activate that button instead of evaluating — requires the attacker to be
    running script in the page already, and such an attacker can simply call `button.focus()` (or
    `dispatch` any input directly). **Zero privilege gain**; this is not a new capability.
  - non-numeric or absent `detail` compares `false` and fails toward *not* blurring, i.e. toward the
    browser's own default behavior — the safe direction.
  - in a real browser `UIEvent.detail` is a `long`, so the exotic types in probe A are unreachable
    there; the throwing-`valueOf` and `Symbol` cases exist only in the stub and still leave state
    consistent (the throw escapes *after* the dispatch, nothing is swallowed).
  I therefore concur with the dispatch's expectation, on evidence rather than assumption: **no
  exploitable consequence.**
- **Boundary validation.** The DOM layer remains the only place that filters user-derived data, and
  does so through the single exported `isInput`. The two validators (`isInput`, `applyInput`) read the
  same three tables so they cannot drift; `isInput` returns `false` where `applyInput` throws, which
  is the correct split (a check must not throw; an invariant violation must). `Map`-based lookups make
  prototype-name inputs structurally impossible to match, and this survives deliberate
  `Object.prototype` pollution (probe C).
- **Test adequacy for security-sensitive behavior.** Adequate and it *bites*: 9 mutation probes
  covering the focus gate, all three `data-*` filters, `preventDefault` scope, the modifier check and
  the double-action guard are each caught by at least one test. Cycle 1's one real coverage complaint
  about this area (the vacuous AC-6 row) is closed. Remaining gaps are F-3/F-4/F-5, all Nit.
- **Carried-forward BOOT-001 items — re-confirmed at this head, not assumed.** (1) *Untested boundary
  filters* — **closed**, and now proven by mutation probes 4–6, not merely by the presence of rows.
  (2) *AC-7 scan skipped `index.html`* — **closed** (probe D). (3) *`stripComments` false negative* —
  **closed at operand position** (probe E); the keyword-position residual is the recorded known issue.
  (4) *Input vocabulary copied twice* — **closed**: `script.js` holds no value list. (5)
  *`CALC_STUB_TRANSFORM` not recorded in gate evidence* — **still open, correctly so** (a
  `run-gate.mjs` change is a human decision); see Unverifiable. (6) Optional hardening: `element
  .dataset` in `inputFromElement` (`script.js:31`) is still unguarded while `isCalculatorButton`
  guards it — unreachable in practice, explicitly optional, noted not filed.
- **Robustness (not findings).** Auto-repeat on digits is uncapped: 5 000 repeated `9` keydowns
  produce a 5 000-character operand, rendered via `textContent` (0 markup writes). Separately, the
  held-`Enter`-on-a-Tab-focused-button case recorded in the unit's Known Issues is real in the stub —
  I reproduced it (5 `Enter` presses with `repeat: true` on a focused `7` yield `77777`), because the
  `isCalculatorButton` early return precedes the `event.repeat && !allowsRepeat` check, so the
  auto-repeat policy does not govern the native-activation path. Both are **functional/UX** matters:
  self-inflicted, local to one page, no confidentiality or integrity impact, no cross-user effect, no
  injection. I record them as robustness information for the code/architecture reviewers rather than
  as security findings. A 200 000-character `event.key` and a 1 000 000-character `mapKey` argument
  are O(1) `Map` misses; no catastrophic backtracking exists (the only regexes in the diff are in test
  helpers and are linear).
- **Dependencies / supply chain.** Unchanged and still zero: no `package.json`, no lockfile, no
  `node_modules`, no `<script src>` other than the two repo-relative files, no CDN, no SRI needed.
  Nothing in the diff adds a network reference; `npm audit` is not applicable (no manifest). The
  stub's `assertLocalScriptPath` (`tests/helpers/dom-stub.js:475-484`) additionally refuses any
  non-relative or out-of-repo script `src`.
- **Secrets / data exposure.** No credentials, tokens, out-of-repo paths or personal data in the diff.
  Nothing is persisted (no `localStorage`/`sessionStorage`/cookies). The user-facing failure text is
  the constant `Error` — no internal detail, no stack, no state leakage. Internal invariant violations
  throw `TypeError`s whose messages describe the contract, not user data.
- **Error-message leakage.** Re-checked every `throw` reachable from input: all four `applyInput`
  messages and the stub/helper messages name the contract only. Nothing echoes the attacker-supplied
  value into the DOM.
- **Conventions & complexity** (security-relevant subset only): the new branch is a single
  three-line `if` with a *why* comment citing D-011; no new mutable adapter state was introduced,
  which keeps the "one thin DOM layer" boundary intact.
- **Performance implications**: none security-relevant; the added branch is one numeric comparison per
  click.
- **Architecture fit**: reading the activating channel from the event (rather than from adapter-held
  state) is the D-011 rule and is the safer of the options considered — it adds no new trust-bearing
  state that could desynchronize. Full structural judgement belongs to the architecture reviewer.

## Unverifiable
- **No real browser (RK-3).** Everything above was executed against `tests/helpers/dom-stub.js`.
  Specifically **UNVERIFIED**: (a) that a real browser reports `detail === 0` for a `Tab`-focused
  button's native `Enter`/`Space` activation and `detail >= 1` for a pointer click — the entire D-011
  mechanism rests on this, and while it matches the UI Events spec and the `.click()` convention, I
  could not execute it; (b) whether a real browser lets `preventDefault()` suppress `Escape` or `/`;
  (c) whether real OS auto-repeat matches the modeled `repeat: true` flag, including the held-`Enter`
  case above. Residual risk: **low for security** — if a browser disagreed about `detail`, the failure
  mode is the *previous* focus behavior (per D-011), not a bypass of the allowlist, because the
  allowlist itself is enforced in pure code I did execute. A manual browser pass by the user remains
  the right control.
- **`CALC_STUB_TRANSFORM` (BOOT-001-sec1 F-4, still open).** `run-gate.mjs` records no environment, so
  a gate run performed with that variable set would produce evidence indistinguishable from an honest
  one. I confirmed the variable was unset for my own verification runs (and set it deliberately, and
  only, for the nine mutation probes) and that my counts match the recorded evidence exactly, but I
  cannot retroactively verify the environment of the recorded runs. Residual risk: test-integrity, not
  product security; the fix requires a human change to `run-gate.mjs` or a stub refusal.
- **Real-world markup injection.** I assumed attacker-controlled DOM as instructed, but for a static
  `file://` page there is no channel by which an attacker supplies markup without already controlling
  the file. F-1's and F-2's impact statements are written under that caveat.
- **Evidence provenance.** The unit Log records that `latest-unit-red.json` was overwritten and then
  restored from a preserved timestamped copy. I did not audit that repair; it concerns TDD evidence
  (gate 3), not the security posture of this head, and my own re-runs of the three final gates match
  the recorded files.
