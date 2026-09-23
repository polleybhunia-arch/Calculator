---
unit: KEY-001
reviewer: security-reviewer
model_attested: claude-opus-5
reviewed_ref: 377024ba68675fc48a3f0e5c07f881858d24e746
verdict: APPROVED
cycle: 4
---

# Security review KEY-001 sec4 — verdict: APPROVED

Runtime model attestation: **claude-opus-5** (Opus family, no fallback). The dispatch handoff
`KEY-001-34` was written by the orchestrator under `FALLBACK(opus->sonnet)`; that does not extend to
this review, so no `review_fallback` and no REDUCED ASSURANCE label is warranted from my side.

Scope: a **fresh, full** security review of `f9426e28..377024ba` under the assumption that the DOM
(markup and every `data-*` value), keyboard events and `MouseEvent.detail` are attacker-controlled.
Every conclusion below was re-derived by execution at this head — nothing was carried over on trust,
including my own cycle-3 conclusions. Handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24`, `-32` were
not opened. My cycle-3 file `KEY-001-sec3.md` was read (the dispatch names it) but every claim in it
was re-measured at this ref.

**No exploitable weakness was found at this ref.** The cycle-4 delta is **test-only**:
`git diff fc93ff7a..377024ba -- . ':(exclude).agent'` is `tests/integration/keyboard.test.js
+40/-0` and nothing else. No shipped file (`index.html`, `script.js`, `calculator-core.js`,
`style.css`) and no test helper changed. The two added rows are pinning tests for code that already
existed at my cycle-3 approval; they add no product surface, touch no filesystem, network, process
or environment API (`require` list is `node:test`, `node:assert/strict`, `../helpers/dom-stub.js`
only), define no new global, and their `spyOnDispatches` oracle installs an **own** property on one
per-test DOM element instance (fresh `loadPage()` per test), so no prototype patch leaks between
tests. Nothing is skipped or `.only`-ed anywhere under `tests/` (grep: no match).

**Ref note (not a blocker):** `git rev-parse HEAD` is `6f104c6b`, two commits ahead of `head_ref`.
`git diff 377024ba..HEAD --name-status` lists `.agent/` paths only (three cycle-4 dispatch handoffs,
`state.md`, the four `latest-*-final.json` pointers, `units/KEY-001.md`); `git diff 377024ba --
. ':(exclude).agent'` is empty and `git status --porcelain` is clean, so the tree I read and executed
is byte-identical to `head_ref` for every shipped and test file. This verdict binds to
`377024ba68675fc48a3f0e5c07f881858d24e746`.

## Acceptance criteria verdicts
Only the security-relevant ACs named in the dispatch are judged here. AC-2, AC-3, AC-4, AC-7 and
AC-8 are behavior/documentation criteria belonging to the code review; this file deliberately says
nothing about them, so the machine-read AC block of `review_file` stays the code reviewer's.

- AC-1: SATISFIED — re-measured at this head: keys `4 + 8 + 9 Enter` → `{"4+8+9","21"}`, clicks
  `4 + 8 + 9 =` → `{"4+8+9","21"}`; the error path matches (`5 / 0 +` by keys → `{"5÷0","Error"}`).
  The input vocabulary is still exported once (`isInput`, `calculator-core.js:187`) and is the only
  validity source for both adapters; `KEY_MAP` (`calculator-core.js:209`) is derived from
  `NUMBER_CHARACTERS` and `OPERATORS`, so there is no third hand-maintained table. Dropping the
  `isInput` filter from any one of the three `data-*` branches fails exactly one test each
  (mutation probes P4–P6, re-run at this head).
- AC-5: SATISFIED — re-probed from scratch at this head. 23 mapped keys call `preventDefault()` on
  `document.body` in both repeat states (46 rows, 0 anomalies); 24 unmapped keys (`a`, `A`, `F5`,
  `Tab`, `ArrowLeft`, `ArrowRight`, `Shift`, `Control`, `Alt`, `Meta`, `c`, `C`, `:`, `` ` ``,
  `PageDown`, `Home`, `End`, `F12`, `Insert`, `ContextMenu`, `' '`, `CapsLock`, `Dead`,
  `Unidentified`) × 4 modifier combinations × 2 repeat states (192 rows) leave both display lines
  unchanged **and** `defaultPrevented === false`; 23 mapped keys × Ctrl/Meta/Alt × 2 repeat states
  (138 rows) likewise inert and unprevented. **Total anomalies across 376 rows: 0.** On a focused
  calculator button the only `preventDefault()` is for `Enter`/`' '` with `repeat === true`; a
  single non-repeat `Enter`/`Space` stays `defaultPrevented === false` (browser keeps its default),
  and `Tab` is never prevented on any target in any repeat state. RK-5 ("over-broad
  `preventDefault`") stays closed: widening it to every key fails 4 tests (probe P7).
- AC-6: SATISFIED (security aspect) — both halves verified directly at this head: a mouse click
  leaves `document.activeElement === null`, and `click 4` then keys `+ 8 Enter` renders `4+8` / `12`
  (not `4+84`); a `Tab`-focused `7`, `=` and `+` button activated natively by `Enter` **and** by
  `Space` each act exactly once, keep focus, and are unchanged by two further `repeat: true` events.
  No double-action path exists: the keyboard listener never synthesizes `button.click()`, and the
  `Enter`/`Space`-on-a-button branch (`script.js:89`) precedes any dispatch. The "more actions than
  presses" path stays closed: 5 000 held `Enter` repeats on a focused `7` yield `current === "7"`
  and 0 markup writes. The click-side boundary filter is not weakened — 72 hostile
  `data-number`/`data-operator`/`data-action` values produced zero state changes, zero exceptions,
  zero markup writes.

## What I ran myself
Independent re-execution at the reviewed tree. `CALC_STUB_TRANSFORM` was confirmed **unset** for all
non-mutation runs (echoed empty before each); every probe ran from stdin (heredoc into `node`),
writing nothing anywhere — no file in or outside the repository was modified by me except this
review and my return handoff.

| Command | Result |
|---|---|
| `node --test "tests/unit/*.test.js"` | 83 pass / 0 fail |
| `node --test "tests/integration/*.test.js"` | 49 pass / 0 fail |
| `node --test "tests/regression/*.test.js"` | 25 pass / 0 fail |
| `node --check script.js`, `node --check calculator-core.js` | exit 0 |
| `git status --porcelain` | empty (clean) |
| `git diff 377024ba..HEAD --name-status` | `.agent/` paths only (ref note) |
| `git diff 377024ba -- . ':(exclude).agent'` | empty (worktree ≡ head_ref for shipped+test files) |
| `git diff fc93ff7a..377024ba --stat -- . ':(exclude).agent'` | `tests/integration/keyboard.test.js` +40/-0 only |
| `grep -rnE "\.(skip\|only)\(" tests/` | no match |

Counts match the recorded evidence `.agent/test-results/KEY-001/latest-{unit,integration,regression}-final.json`
exactly (83 / 49 / 25, `fail: 0`, `head: 377024ba…`, `dirty: false`) and `latest-lint-final.json`
(`exitCode: 0`, same head). No test was modified, added or skipped by me. I did not run
`run-gate.mjs`: it would rebind machine evidence to a different HEAD and overwrite files a reviewer
does not own.

**Mutation probes (do the security-relevant tests bite at *this* head?)** Run through the stub's
in-memory transform hook (`CALC_STUB_TRANSFORM`); nothing on disk was modified. Integration +
regression suites (74 tests):

| # | Mutation | Result |
|---|---|---|
| M1 | remove the `event.repeat` guard entirely | 3 tests fail (held Enter/digit, held Space/digit, held Enter/operator) |
| M2 | keep the branch, drop its `preventDefault()` | 3 tests fail |
| M10 | narrow the guard to `event.repeat && event.key === 'Enter'` | 1 test fails — **only** the new "holding Space on a Tab focused digit button" row |
| M11 | narrow it to digit buttons (`event.target.dataset.number !== undefined`, the rejected D-012 shape) | 1 test fails — **only** the new "holding Enter on a Tab focused operator button" row |
| P1 | remove the `detail` gate (blur on every click) | 1 test fails |
| P2 | remove `blur()` entirely (the original `4+84` bug) | 1 test fails |
| P4–P6 | drop `isInput` filtering for `data-number` / `-operator` / `-action` | 1 test fails each (a different row each time) |
| P7 | `preventDefault()` on every key (over-broad, RK-5) | 4 tests fail |
| P8 | ignore Ctrl/Meta/Alt (`modifiersOf` → `{}`) | 1 test fails |
| P9 | neutralize the whole `Enter`/`Space`-on-a-button early return | 4 tests fail |

M10 and M11 are the two narrowings the cycle-4 tests were added to kill, and each is killed by
exactly the new row written for it — the additions are genuine pins, not duplicates, and they close
the last unpinned dimensions ("any key of the pair" and "any button type") of the branch that
enforces one action per physical press.

**Hostile probes at this head** (all in-memory, stdin scripts, no file written):

- **Click boundary.** 3 attributes × 24 hostile values (`constructor`, `__proto__`, `prototype`,
  `toString`, `valueOf`, `hasOwnProperty`, `''`, `'12'`, `'9 '`, `'1e3'`, `'CLEAR'`, `'equals;'`,
  `clear\u0000`, `<img src=x onerror=alert(1)>`, `javascript:alert(1)`, `9;alert(1)`, `${x}`, `0x41`,
  `'+ '`, `//evil.example.com`, U+202E, a lone surrogate, `Infinity`, `NaN`) on synthetic buttons
  appended to `.buttons` = **72 rows, 0 anomalies**: no state change, no exception, no markup write.
- **Keydown boundary.** 17 hostile `key` values (prototype names, a 200 000-character key, U+202E, a
  lone surrogate, `<script>`, `javascript:alert(1)`, `4;alert(1)`, near-misses `enter`, `ENTER`,
  `'Enter '`, `' Enter'`, `=\u0000`, `''`, `'\n'`) × 2 repeat states × 2 targets (`document.body`
  and a focused button) = **68 rows, 0 anomalies**: inert, no throw, `preventDefault` not called, no
  markup write. 7 malformed `key` types (`undefined`, `null`, `4`, `{}`, `['4']`, `true`, `Symbol`)
  → inert, no throw (`Map.get` on a non-string is a plain miss).
- **Prototype pollution.** `Object.prototype.repeat = true` + `Object.prototype.Enter = {…}` +
  `Object.prototype.number = 'x'` does not change behavior (typing `5` still renders `5`). `mapKey`
  looks up a `Map`, so `__proto__`, `constructor`, `toString`, `valueOf` all return `null`
  (re-measured directly); in a real browser `repeat` is an own accessor on `KeyboardEvent.prototype`
  so a polluted value is unreachable. Worst case in the stub is a *suppressed* action, never an
  extra one.
- **Static-scan efficacy at this head.** Against in-memory hostile markup the widened scan flags
  inline `onclick="eval(x)"`, `new Function(y)()`, `…innerHTML=z`, `<script>document.write(q)</script>`,
  a protocol-relative `<script src="//host">`, an absolute CDN `<link href="https://…">`,
  `<script type="module">` and `href="javascript:alert(1)"`. It does **not** flag string
  `setTimeout('…')`, a generic inline `on*=` handler with a non-flagged body, or `url(//host)`
  inside a `style` attribute (F-4 / carried r1 F-5). Over the three shipped files as they are, every
  pattern set (`moduleSyntax`, `dynamicCode`, `markupWrites`, `externalHosts`) is clean and the only
  `src`/`href` references are `style.css`, `calculator-core.js`, `script.js` — all repo-relative.
- **`stripComments`.** The D-009 fix still holds at operand position
  (`const re = /https?:\/\//; eval(payload);` keeps `eval(`); the documented keyword-position
  residual reproduces (`return /a\/\//; eval(x);` loses it). Neither shipped script contains a regex
  literal.
- **Sinks, secrets, supply chain by direct search.** `grep -nE` over `index.html`, `script.js`,
  `calculator-core.js`, `style.css` for `innerHTML|outerHTML|insertAdjacentHTML|document.write|
  eval(|new Function|setTimeout|setInterval|localStorage|sessionStorage|document.cookie|fetch(|
  XMLHttpRequest|postMessage|location|import(|javascript:` → **no match**. The only DOM writes are
  `script.js:16-17` (`textContent`). `index.html` read in full: 2 repo-relative `<script src>`, one
  `<link href="style.css">`, 19 `<button>` elements, **no `<input>`, `<textarea>`, `<form>`,
  `contenteditable` or inline `on*` handler**. No `package.json`, lockfile or `node_modules` exists,
  so `npm audit` is N/A and nothing in this unit adds a dependency, CDN or SRI need. A secret sweep
  over the full non-`.agent` diff (`api key|secret|token|password|credential|private key|bearer`)
  matches only the test helper's parser-sense use of the word "token".

## Findings
F-1…F-7 are the Nit-level items carried from cycles 1–3, **each re-verified as still accurate at
this head** (not copied); F-8 is a new observation about the cycle-4 test addition. **None is
Critical or Major, none is exploitable without pre-existing script control of the page, and none
blocks `APPROVED`.**

| ID | Severity (Critical/Major/Minor/Nit) | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Nit | `script.js:51-57, 89-103` | `isCalculatorButton()` returns true for **any** element carrying `data-number`/`-operator`/`-action`, regardless of tag or value validity. **Exploit scenario:** an attacker who can inject markup adds `<div data-action="x" tabindex="0">`; while it holds focus, `Enter`/`Space` hit this branch and return early, and the browser performs no native activation for a `<div>` either, so those keys become inert. Re-reproduced at this head (typed `5`, focused the injected div, pressed `Enter` → display stayed `5`, no equals). Denial-of-function only; markup injection into a static `file://` page already implies full script control. | Narrow the guard to elements a browser will actually natively activate: also require `element.tagName === 'BUTTON'` (optionally `inputFromElement(element) !== null`). Guard test: `keydown` `Enter` on an injected non-button element bearing `data-action` must still evaluate the expression. |
| F-2 | Nit | `script.js:88` (design), `.agent/decisions/D-005-layering-rule.md` | The `keydown` listener is global on `document` and `preventDefault()`s all 23 mapped keys with no `event.target` check. Safe **today only because `index.html` has no `<input>`, `<textarea>`, `<form>` or `contenteditable`** — re-verified by reading the whole file at this head. **Exploit scenario (future):** the moment a text field is added, digits, `.`, `,`, operators, `Backspace`, `Escape` and `Delete` typed into it are stolen and suppressed — functional denial, not disclosure. | Record the constraint where the next author will see it (D-005 and/or a comment at `script.js:88`) and add the early return for `INPUT`/`TEXTAREA`/`[contenteditable]` targets when a field first appears. A regression row asserting "index.html contains no editable field" would make the assumption enforced rather than remembered. |
| F-3 | Nit | `tests/helpers/source-scan.js:10` | `SHIPPED_FILES` omits `style.css`, which is shipped and can itself reach third parties. **Exploit scenario:** a later `@import url('//cdn…')` or remote `url(…)` font leaks the user's IP and User-Agent to a third host on every load and passes every gate. `style.css` is clean today (re-verified: no `url(`, `@import`, `http:` or `//`). Out of this unit's declared D-009 scope. | Add `style.css` to the `externalHosts` scan (raw text, CSS comments stripped) plus a `url()`/`@import` relative-path assertion mirroring `findReferences` for `index.html`. |
| F-4 | Nit | `tests/helpers/source-scan.js:120` | `PATTERNS.dynamicCode` misses the string forms `setTimeout('…')`/`setInterval('…')` and inline `on*=` handlers whose body is not itself a flagged token (`onmouseover="alert(1)"` re-measured as MISSED at this head). **Exploit scenario:** a future commit introduces string-form dynamic code and the AC-7 regression row that exists to prevent exactly that stays green. Nothing is exploitable now (no timer, no inline handler in the shipped files). | Add `/\bset(?:Timeout\|Interval)\s*\(\s*['"`]/` to `dynamicCode`, and consider asserting that `index.html` contains no `on[a-z]+=` attribute at all — a stronger, simpler invariant. |
| F-5 | Nit | `tests/unit/key-map.test.js` | `isInput`'s rejection of `constructor`/`__proto__` is pinned (`key-map.test.js:46-47`); `mapKey`'s is not (the unmapped-key row uses `a`, `F5`, `Tab`, `ArrowLeft`, `Space`, `Shift`, `` ` `` only). Safety rests on `KEY_MAP` being a `Map` — verified true at this head (`mapKey('__proto__'\|'constructor'\|'toString'\|'valueOf')` all `null`). **Exploit scenario:** a future refactor to an object literal makes `mapKey('constructor')` return `Object.prototype.constructor`; `applyInput` would throw an uncaught `TypeError` in the listener — fail-closed and noisy, not a bypass, but the test that should have caught the refactor would not. | Add one unit row: `mapKey('__proto__')`, `mapKey('constructor')`, `mapKey('toString')` each return `null`. |
| F-6 | Nit | `script.js:89, 98-101` | The repeat guard is reached through the same tag-agnostic `isCalculatorButton()` as F-1, so it slightly **widens F-1's denial-of-function surface**: for an injected non-button element carrying a `data-*` attribute, a *held* `Enter`/`Space` is `preventDefault()`ed as well (re-measured at this head: `defaultPrevented` `false` for the first press, `true` for each repeat), suppressing whatever default that element would have had (e.g. newline insertion in an injected `contenteditable`). Same precondition as F-1 (markup injection ⇒ script control already), same impact class, so the severity does not rise. | The F-1 fix (`tagName === 'BUTTON'`) closes this too; no separate change is needed. If F-1 is fixed, extend its guard test with a repeat variant. |
| F-7 | Nit (functional/a11y — not a security defect) | `script.js:98-101` | Beyond suppressing the repeat activation click, `preventDefault()` here steals nothing: `Enter` has no other default on a `<button>` (no form, no link in `index.html` — re-read at this head); `Space`'s scroll default does not apply when the target is an activatable control; the listener does not `stopPropagation()` or move focus, so assistive tech still sees the full event stream, and no ARIA/role/state is touched. The real uncertainty is **`Space`**: browsers activate a button on `keyup`, not `keydown`, so whether a `preventDefault()` on an intermediate *repeat* keydown can cancel a pending activation is engine-internal and cannot be executed here. The failure direction if an engine disagrees is **zero actions, never two** — a usability regression, never a bypass. | No code change required. Keep manual-checklist items 3–5 (RK-3) — in particular: `Tab` to a button, hold `Space`, release → expect exactly one action; then hold `Enter` → exactly one action. Report a discrepancy as a functional defect for the code reviewer, not as a security issue. |
| F-8 | Nit (new, test fidelity) | `tests/integration/keyboard.test.js:425-440` | The new held-`Space` pinning row asserts against the stub's model of native activation, which fires on **keydown** (`tests/helpers/dom-stub.js:115-139`); real browsers activate a button on **keyup**. The row therefore genuinely pins the implementation against the documented model (it kills mutation M10 and nothing else — verified), but it cannot raise the real-browser assurance for `Space` above `UNVERIFIED`. No security impact: the modeled and the real direction of error both reduce, never increase, the number of actions. | Nothing to change in code or test. Keep the test (it is the only thing guarding the `Space` half of the guard) and keep manual-checklist item 4 (`D-013` residual risk) as the real-browser control; do not let the green row be read as evidence that the real `Space` path was verified. |

## Assessments
- **Requirement satisfaction**: the two security clauses of the Definition of Done hold at this head
  — no input-derived string reaches `innerHTML`/`eval`/`new Function` (scan, stripper, grep and
  hostile-value probes), and `preventDefault()` is not unbounded (AC-5 sweep: 23 mapped in; 24
  unmapped, 376 key×modifier×repeat rows, every `Tab` case and every non-repeat focused-button
  `Enter`/`Space` out). The map is a closed allowlist derived from the core's own constants.
- **Test adequacy / false confidence**: adequate and it bites. 14 mutation probes covering the
  repeat guard (removal, no-preventDefault, key-narrowing, button-type-narrowing), the focus/
  `detail` gate, all three `data-*` filters, `preventDefault` scope, the modifier check and the
  double-action early return are each caught by at least one test. The cycle-4 additions remove the
  two "a narrower, wrong fix still passes" gaps (M10, M11) that existed at `fc93ff7a`, so the
  security-relevant region `script.js:89-103` is now pinned in four independent directions
  (present, effective, key-agnostic, button-type-agnostic). Remaining gaps are F-3/F-4/F-5, all Nit.
- **Input → sink trace (re-derived at this head).** `KeyboardEvent` → `script.js:88` listener →
  `isCalculatorButton(event.target)` (`script.js:89`, reads three `data-*` presence flags only,
  never their values) → `event.repeat` boolean → `preventDefault()` and `return`
  (`script.js:98-101`; no value derived from the event continues past this point) → otherwise
  `modifiersOf(event)` (`script.js:61-63`, copies three booleans into a fresh object) →
  `mapKey(event.key, …)` (`calculator-core.js:226`, closed `Map` allowlist, returns a **fresh copy**
  of the descriptor) → `dispatch(input)` (`script.js:21`) → `applyInput` (`calculator-core.js:142`,
  re-validates type *and* value, throws on anything malformed) → `render` → **`textContent` only**
  (`script.js:16-17`). The parallel click path is `click` → `inputFromElement(event.target)`
  (`script.js:30-46`, every branch filtered by `isInput`) → the same `dispatch`. Strings reaching
  the DOM are built from `state.history.join('')` and `state.currentInput`, which can hold only
  allowlisted single characters, operator display symbols, `Error`, or `String(number)`. No
  `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`, no `eval`/`new Function`/string
  timer, no `import()`, no `location`/`href` write, no `postMessage`, no storage, no network call
  anywhere in the diff. An attacker-supplied `event.key` can at most cause one legitimate calculator
  action; an attacker-supplied `event.repeat` can at most cause **one fewer**.
- **Edge cases missing**: none security-relevant found. Robustness edges re-exercised: 200 000-char
  `key`, lone surrogate, U+202E, non-string `key` types, `Infinity`/`NaN` as `data-*` values, 5 000
  auto-repeats on both channels. The document-level digit auto-repeat (OQ-4, deliberate) remains
  uncapped — 5 000 held digits give a 5 001-character operand with 0 markup writes; `textContent`
  only, self-inflicted and local to one page, a UX matter rather than a security one.
- **Regression risk**: nil from this commit by construction (no product file changed;
  `git diff fc93ff7a..377024ba -- . ':(exclude).agent'` is one test file). All three suites re-run
  green at this head and match the recorded evidence exactly.
- **Boundary validation**: unchanged and intact. The DOM layer is the only place that filters
  user-derived data, through the single exported `isInput`; `isInput` and `applyInput` read the same
  three tables so they cannot drift; `isInput` returns `false` where `applyInput` throws (a check
  must not throw, an invariant violation must). `Map`-based lookups make prototype-name inputs
  structurally impossible to match, and this survives deliberate `Object.prototype` pollution.
- **Carried-forward BOOT-001 items — re-confirmed at this head.** (1) *Untested boundary filters* —
  **closed**, proven by probes P4–P6 (each kills a different, named row). (2) *AC-7 scan skipped
  `index.html`* — **closed** (scan-efficacy probe: 8 of 11 hostile fragments flagged, the 3 misses
  are F-3/F-4). (3) *`stripComments` false negative* — **closed at operand position**; the
  keyword-position residual is the recorded known issue and neither shipped script contains a regex
  literal. (4) *Input vocabulary copied twice* — **closed**: `script.js` holds no value list. (5)
  *`CALC_STUB_TRANSFORM` not recorded in gate evidence* — **still open, correctly so** (a
  `run-gate.mjs` change is a human decision); see Unverifiable. (6) Optional hardening:
  `element.dataset` in `inputFromElement` (`script.js:31`) is still unguarded while
  `isCalculatorButton` guards it — unreachable in practice (the listener is bound to `.buttons`,
  whose descendants are elements), explicitly optional, noted not filed.
- **Secrets / data exposure**: no credentials, tokens, out-of-repo paths or personal data in the
  diff. Nothing is persisted (no `localStorage`/`sessionStorage`/cookies). The user-facing failure
  text is the constant `Error` — no internal detail, no stack, no state. Internal invariant
  violations throw `TypeError`s whose messages describe the contract, never echo attacker input
  (re-read all four `applyInput` messages).
- **Dependencies / supply chain**: unchanged and still zero — no manifest, no lockfile, no
  `node_modules`, no `<script src>` other than the two repo-relative files, no CDN, no SRI need. The
  stub's `assertLocalScriptPath` (`tests/helpers/dom-stub.js:475-484`) additionally refuses any
  non-relative or out-of-repo script `src`. The new test file imports only `node:test`,
  `node:assert/strict` and the repo's own stub.
- **Conventions & complexity** (security-relevant subset): the added tests follow the file's
  existing shape, carry *why* comments naming the mutation each one kills, and introduce no new
  helper, global or shared mutable state. The "one thin DOM layer" boundary is untouched.
- **Performance implications**: none security-relevant; no product code changed. The two new tests
  add ~90 ms to the integration gate. No regex added to shipped code (the only regexes in the repo
  are in test helpers and are linear — no catastrophic-backtracking surface).
- **Architecture fit**: unchanged from cycle 3 — enforcing "once per physical press" by cancelling a
  browser default rather than simulating one keeps native activation in the browser's hands. Full
  structural judgement belongs to the architecture reviewer.

## Unverifiable
- **No real browser (RK-3).** Everything above was executed against `tests/helpers/dom-stub.js`.
  Specifically **UNVERIFIED**: (a) whether a real engine's pending `Space` activation survives a
  `preventDefault()` on an intermediate repeat keydown, and more basically whether a real engine
  re-fires native activation per repeat at all — the stub models activation on *keydown* while real
  browsers use *keyup* for `Space` (F-8; worst case one action becomes zero, never two); (b) that a
  real browser reports `detail === 0` for a `Tab`-focused button's native `Enter`/`Space` activation
  and `detail >= 1` for a pointer click (the D-011 mechanism rests on this); (c) whether real OS
  auto-repeat matches the modeled `repeat: true` flag; (d) whether a real browser lets
  `preventDefault()` suppress `Escape` or `/`. Residual risk: **low for security** — every failure
  direction is fewer actions or the browser's own default, never a bypass of the allowlist, which is
  enforced in pure code I did execute. The user's manual browser pass (unit file RK-3, items 1–5)
  remains the right control.
- **`CALC_STUB_TRANSFORM` (BOOT-001-sec1 F-4, still open).** `run-gate.mjs` records no environment,
  so a gate run performed with that variable set would produce evidence indistinguishable from an
  honest one. I confirmed the variable was unset for my verification runs (set deliberately, and
  only, for the mutation probes, and unset again after each) and that my counts match the recorded
  evidence exactly, but I cannot retroactively verify the environment of the recorded runs.
  Residual risk: test integrity, not product security; the fix needs a human change to
  `run-gate.mjs` or a stub refusal.
- **Real-world markup injection.** I assumed attacker-controlled DOM as instructed, but for a static
  `file://` page there is no channel by which an attacker supplies markup without already
  controlling the file. The impact statements for F-1, F-2 and F-6 are written under that caveat.
- **Evidence provenance.** The unit Log records two `latest-unit-red.json` overwrite-and-restore
  repairs. I did not audit them; they concern TDD evidence (gate 3), not the security posture of
  this head, and my own re-runs of the three final gates match the recorded files exactly.
