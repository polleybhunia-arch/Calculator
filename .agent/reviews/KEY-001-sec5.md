---
unit: KEY-001
reviewer: security-reviewer
model_attested: claude-opus-5
reviewed_ref: 8c36740af901c680ee4305fcbb0684222201777d
verdict: APPROVED
cycle: 5
---

# Security review KEY-001 sec5 — verdict: APPROVED

Runtime model attestation: **claude-opus-5** (Opus family). The dispatch handoff `KEY-001-42` was
written by the orchestrator under `FALLBACK(opus->sonnet)`; that fallback does not extend to this
review, so no `review_fallback` and no REDUCED ASSURANCE label is warranted from my side.

Scope: a **fresh, full** security review at `head_ref` `8c36740a`, under the assumption that the DOM
(markup and every `data-*` value), keyboard events and `MouseEvent.detail` are attacker-controlled.
Every conclusion below was re-derived by execution at this head — nothing was carried on trust,
including my own cycle-4 conclusions. Handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24`, `-32`,
`-40` were **not** opened. My cycle-4 file `KEY-001-sec4.md` was read (the dispatch names the
invalidated approval) but every claim reused from it was re-measured here.

**No exploitable weakness was found at this ref.**

**Delta since my cycle-4 approval is test-only.**
`git diff 377024ba..8c36740 -- . ':(exclude).agent'` = `tests/integration/keyboard.test.js`
**+19/-0, one file, one new test row** ("the DEL button reached by Tab and activated by a held Enter
deletes exactly once"). No shipped file (`index.html`, `script.js`, `calculator-core.js`,
`style.css`) and no test helper changed. The added row adds no product surface, imports nothing new
(the file's whole `require` list is `node:test`, `node:assert/strict`, `../helpers/dom-stub.js`),
touches no filesystem/network/process/environment API, defines no global, installs no prototype
patch, and uses only pre-existing stub helpers (`loadPage`, `typeKeys`, `buttonFor`, `focus`,
`dispatch`, `assertDisplay`) on a fresh per-test page. Nothing under `tests/` is `.skip`/`.only`/
`todo` (grep: no match).

**Ref note (not a blocker).** `git rev-parse HEAD` is `ee66c607`, two commits ahead of `head_ref`.
`git diff 8c36740..HEAD --name-status` lists `.agent/` paths only (three cycle-5 dispatch handoffs,
`state.md`, the four `latest-*-final.json`, `units/KEY-001.md`); `git diff 8c36740 -- .
':(exclude).agent'` is empty and `git status --porcelain` is clean, so the tree I read and executed
is byte-identical to `head_ref` for every shipped and test file. This verdict binds to
`8c36740af901c680ee4305fcbb0684222201777d`.

## Acceptance criteria verdicts
Only the security-relevant ACs named in the dispatch are judged here. AC-2, AC-3, AC-4, AC-7 and
AC-8 are behavior/documentation criteria belonging to the code review; this file deliberately says
nothing about them, so the machine-read AC block of `review_file` stays the code reviewer's.

- AC-1: SATISFIED — re-measured at this head: keys `4 + 8 + 9 Enter` → `{"4+8+9","21"}`; clicks
  `4 + 8 + 9 =` → `{"4+8+9","21"}` (identical); the error path matches (`5 / 0 +` by keys →
  `{"5÷0","Error"}`). The input vocabulary is still exported once (`isInput`,
  `calculator-core.js`) and is the only validity source for both adapters; `KEY_MAP` is derived
  from the core's own `NUMBER_CHARACTERS`/`OPERATORS`, so there is no third hand-maintained table.
  Dropping the `isInput` filter from any one of the three `data-*` branches fails exactly one test
  each (probes P4–P6, re-run at this head).
- AC-5: SATISFIED — re-probed from scratch at this head, not carried over. 23 mapped keys ×
  2 repeat states on `document.body` → `preventDefault()` in **all 46** rows; 24 unmapped keys
  (`a`, `A`, `F5`, `Tab`, `ArrowLeft`, `ArrowRight`, `Shift`, `Control`, `Alt`, `Meta`, `c`, `C`,
  `:`, `` ` ``, `PageDown`, `Home`, `End`, `F12`, `Insert`, `ContextMenu`, `' '`, `CapsLock`,
  `Dead`, `Unidentified`) × 4 modifier combinations × 2 repeat states (192 rows) leave both display
  lines unchanged **and** `defaultPrevented === false`; 23 mapped keys × Ctrl/Meta/Alt × 2 repeat
  states (138 rows) likewise inert and unprevented. **376 rows, 0 anomalies.** On a focused
  calculator button of every family (`7`, `+`, `=`, `AC`, `DEL`) the only `preventDefault()` is for
  `Enter`/`' '` with `repeat === true`; the first, non-repeat press stays
  `defaultPrevented === false` (the browser keeps its default) and `Tab` is never prevented on any
  target in any repeat state. RK-5 ("over-broad `preventDefault`") stays closed.
- AC-6: SATISFIED (security aspect) — both halves verified directly at this head. Mouse side: a
  click leaves `document.activeElement === null`, and `click 4` then keys `+ 8 Enter` renders
  `4+8` / `12` (not `4+84`); removing the `detail` gate or the `blur()` each fails exactly one test
  (P1, P2). Keyboard side: a `Tab`-focused button of **all three families** (`7`/`+` digit and
  operator, `=`/`AC`/`DEL` action) activated natively by `Enter` **and** by `Space` acts exactly
  once, keeps focus, and is unchanged by two further `repeat: true` events (10 scenarios, 0
  anomalies). No double-action path exists: the keyboard listener never synthesizes
  `button.click()`, and the `Enter`/`Space`-on-a-button branch (`script.js:89`) precedes any
  dispatch. "More actions than presses" stays closed: 5 000 held `Enter` repeats on a focused `7`
  yield `current === "7"` with 0 markup writes. The click-side boundary filter is not weakened —
  72 hostile `data-number`/`-operator`/`-action` values produced zero state changes, zero
  exceptions, zero markup writes.

## What I ran myself
Independent re-execution at the reviewed tree. `CALC_STUB_TRANSFORM` was confirmed **unset** for
every non-mutation run (echoed empty: `CALC_STUB_TRANSFORM=[]`); each mutation/hostile probe ran in
its own shell from stdin (heredoc into `node`), writing nothing anywhere. No file in or outside the
repository was modified by me except this review and my return handoff.

| Command | Result |
|---|---|
| `node --test "tests/unit/*.test.js"` | 83 pass / 0 fail |
| `node --test "tests/integration/*.test.js"` | **50** pass / 0 fail |
| `node --test "tests/regression/*.test.js"` | 25 pass / 0 fail |
| `node --check script.js && node --check calculator-core.js` | exit 0 (the `lint` gate command) |
| `git status --porcelain` | empty (clean) |
| `git diff 377024ba..8c36740 --stat -- . ':(exclude).agent'` | `tests/integration/keyboard.test.js` +19/-0 only |
| `git diff 8c36740..HEAD --name-status` | `.agent/` paths only (ref note) |
| `git diff 8c36740 -- . ':(exclude).agent'` | empty (worktree ≡ head_ref for shipped + test files) |
| `grep -rnE "\.(skip\|only)\(\|todo:" tests/` | no match |
| secret sweep over the non-`.agent` diff | no match |

Counts match the recorded evidence `.agent/test-results/KEY-001/latest-{unit,integration,regression}-final.json`
exactly — 83 / 50 / 25, `fail: 0`, `dirty: false`, `head: 8c36740af901c680ee4305fcbb0684222201777d`
— and `latest-lint-final.json` (`exitCode: 0`, same head). The integration count moved 49 → 50,
exactly the one added row. I did not run `run-gate.mjs`: it would rebind machine evidence to a
different HEAD and overwrite files a reviewer does not own.

**Mutation probes (does the security-relevant behavior actually bite at *this* head?)** Run through
the stub's in-memory transform hook; nothing on disk was modified. Integration (+ regression where
noted) suites:

| # | Mutation | Result |
|---|---|---|
| M1 | remove the `event.repeat` guard block entirely | **4** tests fail (held Enter/digit, held Space/digit, held Enter/operator, **held Enter/DEL — the new row**) |
| M11b | narrow the guard to non-action buttons (`event.repeat && event.target.dataset.action === undefined`) | **1** test fails — **only** the new DEL row (`current` becomes `0` instead of `12`) |
| P9 | neutralize the whole `Enter`/`Space`-on-a-button early return (`if (false)`) | 5 tests fail, DEL row included (`current` becomes `123`: `Enter` falls through to `mapKey` → `equals`) |
| P1 | remove the `detail` gate (blur on every click) | 1 test fails |
| P2 | remove `blur()` entirely (the original `4+84` bug) | 1 test fails |
| P3 | drop `preventDefault()` for mapped keys | 1 test fails |
| P4–P6 | drop `isInput` filtering for `data-number` / `-operator` / `-action` | 1 test fails each (a different row each time) |

The new row is a **genuine pin, not a duplicate**: it is the unique killer of the "guard skips
action buttons" narrowing (M11b), which the 49-test suite at `377024ba` did not catch. The
security-relevant region `script.js:89-103` is now pinned in five independent directions (guard
present, guard effective, key-agnostic across `Enter`/`Space`, button-type-agnostic across digit /
operator / action, outer early-return present).

**Hostile probes at this head** (all in-memory, stdin scripts, no file written):

- **Click boundary.** 3 attributes × 24 hostile values (`constructor`, `__proto__`, `prototype`,
  `toString`, `valueOf`, `hasOwnProperty`, `''`, `'12'`, `'9 '`, `'1e3'`, `'CLEAR'`, `'equals;'`,
  `clear\u0000`, `<img src=x onerror=alert(1)>`, `javascript:alert(1)`, `9;alert(1)`, `${x}`,
  `0x41`, `'+ '`, `//evil.example.com`, U+202E, a lone surrogate, `Infinity`, `NaN`) on synthetic
  buttons appended to `.buttons` = **72 rows, 0 anomalies**: no state change, no exception, no
  markup write.
- **Keydown boundary.** 18 hostile `key` values (prototype names, a 200 000-character key, U+202E,
  a lone surrogate, `<script>`, `javascript:alert(1)`, `4;alert(1)`, near-misses `enter`, `ENTER`,
  `'Enter '`, `' Enter'`, `=\u0000`, `''`, `'\n'`) × 2 repeat states × 2 targets (`document.body`,
  a focused button) plus 7 malformed `key` types (`undefined`, `null`, `4`, `{}`, `['4']`, `true`,
  `Symbol`) = **79 rows, 0 anomalies**: inert, no throw, `preventDefault` not called, no markup
  write.
- **Prototype pollution.** `Object.prototype.repeat = true` + `Object.prototype.Enter = {…}` +
  `Object.prototype.number = 'x'` does not change behavior (typing `5` still renders `5`).
  `mapKey('__proto__'|'constructor'|'toString'|'valueOf'|'hasOwnProperty')` all return `null`
  (`Map` lookup), and `isInput` rejects those values for all three types. Worst case is a
  *suppressed* action, never an extra one.
- **Unbounded repeat.** 5 000 held digit repeats → 5 000-character operand, **0 markup writes**
  (`textContent` only). Self-inflicted, local, UX not security (OQ-4, deliberate).
- **Sinks, secrets, supply chain by direct search.** `grep -nE` over `index.html`, `script.js`,
  `calculator-core.js`, `style.css` for `innerHTML|outerHTML|insertAdjacentHTML|document.write|
  eval(|new Function|setTimeout|setInterval|localStorage|sessionStorage|document.cookie|fetch(|
  XMLHttpRequest|postMessage|location|import(|javascript:` → **no match**. The only DOM writes are
  `script.js:16-17` (`textContent`). `index.html`: 2 repo-relative `<script src>`, one
  `<link href="style.css">`, **no `<input>`, `<form>`, `contenteditable` or inline `on*=`
  handler**. `style.css` re-scanned: no `url(`, `@import`, `http:` or `//`. No `package.json`,
  lockfile or `node_modules` exists, so `npm audit` is N/A and this unit adds no dependency, CDN or
  SRI need. The stub's `assertLocalScriptPath` still refuses any non-relative or out-of-repo script
  `src`.

## Findings
F-1…F-7 are the Nit-level items carried from cycles 1–4, **each re-verified as still accurate at
this head** (re-executed, not copied). F-8 is restated because the same modelling caveat applies to
the new row, and F-9 is a new, non-security observation about the added test's comment. **None is
Critical or Major, none is exploitable without pre-existing script control of the page, and none
blocks `APPROVED`.**

| ID | Severity (Critical/Major/Minor/Nit) | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Nit | `script.js:51-57, 89-103` | `isCalculatorButton()` returns true for **any** element carrying `data-number`/`-operator`/`-action`, regardless of tag or value validity. **Exploit scenario:** an attacker who can inject markup adds `<div data-action="x" tabindex="0">`; while it holds focus, `Enter`/`Space` hit this branch and return early, and the browser performs no native activation for a `<div>` either, so those keys become inert. Re-reproduced at this head (typed `5`, focused the injected div, pressed `Enter` → display stayed `5`, no equals). Denial-of-function only; markup injection into a static `file://` page already implies full script control. | Narrow the guard to elements a browser will natively activate: also require `element.tagName === 'BUTTON'` (optionally `inputFromElement(element) !== null`). Guard test: `keydown` `Enter` on an injected non-button element bearing `data-action` must still evaluate the expression. |
| F-2 | Nit | `script.js:88` (design), `.agent/decisions/D-005-layering-rule.md` | The `keydown` listener is global on `document` and `preventDefault()`s all 23 mapped keys with no `event.target` check. Safe **today only because `index.html` has no `<input>`, `<textarea>`, `<form>` or `contenteditable`** — re-verified by grepping the whole file at this head. **Exploit scenario (future):** the moment a text field is added, digits, `.`, `,`, operators, `Backspace`, `Escape` and `Delete` typed into it are stolen and suppressed — functional denial, not disclosure. | Record the constraint where the next author will see it (D-005 and/or a comment at `script.js:88`) and add the early return for `INPUT`/`TEXTAREA`/`[contenteditable]` targets when a field first appears. A regression row asserting "index.html contains no editable field" would make the assumption enforced rather than remembered. |
| F-3 | Nit | `tests/helpers/source-scan.js:10` | `SHIPPED_FILES = ['index.html','script.js','calculator-core.js']` still omits `style.css`, which is shipped and can itself reach third parties. **Exploit scenario:** a later `@import url('//cdn…')` or remote `url(…)` font leaks the user's IP and User-Agent to a third host on every load and passes every gate. `style.css` is clean today (re-verified at this head). Out of this unit's declared D-009 scope. | Add `style.css` to the `externalHosts` scan (raw text, CSS comments stripped) plus a `url()`/`@import` relative-path assertion mirroring `findReferences` for `index.html`. |
| F-4 | Nit | `tests/helpers/source-scan.js:120` | `PATTERNS.dynamicCode` is `[/\beval\b/, /\bnew\s+Function\b/, /\bFunction\s*\(/, /\bdocument\s*\.\s*write/]` — re-read at this head; it still misses the string forms `setTimeout('…')`/`setInterval('…')` and inline `on*=` handlers whose body is not itself a flagged token. **Exploit scenario:** a future commit introduces string-form dynamic code and the AC-7 regression row that exists to prevent exactly that stays green. Nothing is exploitable now (no timer, no inline handler in the shipped files). | Add `/\bset(?:Timeout\|Interval)\s*\(\s*['"`]/` to `dynamicCode`, and consider asserting that `index.html` contains no `on[a-z]+=` attribute at all — a stronger, simpler invariant. |
| F-5 | Nit | `tests/unit/key-map.test.js:113` | `isInput`'s rejection of `constructor`/`__proto__` is pinned (`key-map.test.js:46-47`); `mapKey`'s is not — the unmapped-key row's list is `['a','F5','Tab','ArrowLeft',' ','Shift','`',':','c','C']`, no prototype name. Safety rests on `KEY_MAP` being a `Map`, verified true at this head. **Exploit scenario:** a future refactor to an object literal makes `mapKey('constructor')` return `Object.prototype.constructor`; `applyInput` would throw an uncaught `TypeError` in the listener — fail-closed and noisy, not a bypass, but the test that should have caught the refactor would not. | Add one unit row: `mapKey('__proto__')`, `mapKey('constructor')`, `mapKey('toString')` each return `null`. |
| F-6 | Nit | `script.js:89, 98-101` | The repeat guard is reached through the same tag-agnostic `isCalculatorButton()` as F-1, so it slightly **widens F-1's denial-of-function surface**: for an injected non-button element carrying a `data-*` attribute, a *held* `Enter`/`Space` is `preventDefault()`ed too (re-measured at this head: `defaultPrevented` `false` for the first press, `true` for each repeat), suppressing whatever default that element would have had. Same precondition as F-1 (markup injection ⇒ script control already), same impact class, so the severity does not rise. | The F-1 fix (`tagName === 'BUTTON'`) closes this too; no separate change needed. If F-1 is fixed, extend its guard test with a repeat variant. |
| F-7 | Nit (functional/a11y — not a security defect) | `script.js:98-101` | Beyond suppressing the repeat activation click, `preventDefault()` here steals nothing: `Enter` has no other default on a `<button>` (no form, no link in `index.html` — re-grepped at this head); `Space`'s scroll default does not apply when the target is an activatable control; the listener does not `stopPropagation()` or move focus, so assistive tech still sees the full event stream. The real uncertainty is **`Space`**: browsers activate a button on `keyup`, not `keydown`, so whether `preventDefault()` on an intermediate *repeat* keydown can cancel a pending activation is engine-internal and cannot be executed here. The failure direction if an engine disagrees is **zero actions, never two**. | No code change required. Keep manual-checklist items 3–5 (RK-3): `Tab` to a button, hold `Space`, release → exactly one action; then hold `Enter` → exactly one action. Report a discrepancy as a functional defect for the code reviewer, not as a security issue. |
| F-8 | Nit (test fidelity, restated for the new row) | `tests/integration/keyboard.test.js:425-482` | The held-`Space` row and the new held-`Enter`-on-DEL row both assert against the stub's model of native activation, which fires on **keydown** (`tests/helpers/dom-stub.js:115-139`). For `Enter` that matches real browsers; for `Space` it does not (real activation is on `keyup`). The rows genuinely pin the implementation against the documented model (each kills a distinct narrowing — verified), but cannot raise real-browser assurance for `Space` above `UNVERIFIED`. No security impact: both the modeled and the real direction of error reduce, never increase, the number of actions. | Nothing to change in code or test. Keep the rows and keep manual-checklist item 4 (D-013 residual risk) as the real-browser control; do not let the green rows be read as evidence that the real `Space` path was verified. |
| F-9 | Nit (new — test comment accuracy, no security impact) | `tests/integration/keyboard.test.js:465-472` | The new row's rationale comment says "without it, a held Enter on a Tab-focused DEL evaluates `123` via `=` instead of deleting". Measured at this head, `123` is the result of removing the **outer** `Enter`/`Space`-on-a-button early return (probe P9); removing or narrowing the **`event.repeat` guard** the row actually pins yields `0` (three deletes), not `123`. The row's assertion and its pinning value are correct and unaffected — only the stated failure mode is attributed to the wrong mutation, which could mislead a future reader into thinking the repeat guard is what routes `Enter` away from `mapKey`. | One-line comment correction, e.g. "without the repeat guard a held Enter on a Tab-focused DEL deletes on every repeat (`123` → `0`); without the surrounding early return it would instead evaluate via `=`". No code or assertion change. |

## Assessments
- **Requirement satisfaction**: the two security clauses of the Definition of Done hold at this
  head — no input-derived string reaches `innerHTML`/`eval`/`new Function` (grep, static scan,
  hostile-value probes), and `preventDefault()` is not unbounded (376-row sweep: 23 mapped in;
  24 unmapped × 4 modifier sets × 2 repeat states out, every `Tab` case out, every non-repeat
  focused-button `Enter`/`Space` out). The key map is a closed allowlist derived from the core's
  own constants.
- **Input → sink trace (re-derived at this head).** `KeyboardEvent` → `script.js:88` listener →
  `isCalculatorButton(event.target)` (`script.js:89`, reads three `data-*` presence flags only,
  never their values) → `event.repeat` boolean → `preventDefault()` and `return`
  (`script.js:98-101`; no event-derived value continues past this point) → otherwise
  `modifiersOf(event)` (`script.js:61-63`, copies three booleans into a fresh object) →
  `mapKey(event.key, …)` (closed `Map` allowlist, returns a fresh descriptor copy) →
  `dispatch(input)` (`script.js:21`) → `applyInput` (re-validates type *and* value, throws on
  anything malformed) → `render` → **`textContent` only** (`script.js:16-17`). The parallel click
  path is `click` → `inputFromElement(event.target)` (`script.js:30-46`, every branch filtered by
  `isInput`) → the same `dispatch`. Strings reaching the DOM are built from
  `state.history.join('')` and `state.currentInput`, which hold only allowlisted single characters,
  operator display symbols, `Error`, or `String(number)`. No `innerHTML`/`outerHTML`/
  `insertAdjacentHTML`/`document.write`, no `eval`/`new Function`/string timer, no `import()`, no
  `location`/`href` write, no `postMessage`, no storage, no network call anywhere. An
  attacker-supplied `event.key` can at most cause one legitimate calculator action; an
  attacker-supplied `event.repeat` can at most cause **one fewer**.
- **Test adequacy / false confidence**: adequate and it bites. 11 mutation probes covering the
  repeat guard (removal, action-button narrowing), the outer early return, the focus/`detail` gate,
  `blur()`, `preventDefault` for mapped keys, and all three `data-*` boundary filters are each
  caught by at least one test. The cycle-5 addition closes the last unpinned button family
  (action), the gap that made the "skips action buttons" narrowing survivable at `377024ba`.
  Remaining gaps are F-3/F-4/F-5, all Nit and all outside this unit's declared scope.
- **Edge cases missing**: none security-relevant found. Robustness edges re-exercised at this head:
  200 000-character `key`, lone surrogate, U+202E, non-string `key` types, `Infinity`/`NaN` as
  `data-*` values, 5 000 auto-repeats. The document-level digit auto-repeat (OQ-4, deliberate)
  remains uncapped — 5 000 held digits give a 5 000-character operand with 0 markup writes;
  `textContent` only, self-inflicted and local to one page, a UX matter not a security one.
- **Regression risk**: nil from this commit by construction — no product file changed; the diff is
  one added test. All three suites re-run green at this head and match the recorded evidence
  exactly (83/50/25).
- **Boundary validation**: unchanged and intact. The DOM layer is the only place that filters
  user-derived data, through the single exported `isInput`; `isInput` and `applyInput` read the
  same tables so they cannot drift; `isInput` returns `false` where `applyInput` throws (a check
  must not throw, an invariant violation must). `Map`-based lookups make prototype-name inputs
  structurally impossible to match, and this survives deliberate `Object.prototype` pollution.
- **Carried-forward BOOT-001 items — re-confirmed at this head.** (1) *Untested boundary filters* —
  **closed**, proven by P4–P6 (each kills a different, named row). (2) *AC-7 scan skipped
  `index.html`* — **closed** (the scan now runs over `index.html` too; its residual misses are F-3/
  F-4). (3) *`stripComments` false negative* — **closed at operand position**, the keyword-position
  residual is the recorded known issue and neither shipped script contains a regex literal.
  (4) *Input vocabulary copied twice* — **closed**: `script.js` holds no value list. (5)
  *`CALC_STUB_TRANSFORM` not recorded in gate evidence* — **still open, correctly so** (a
  `run-gate.mjs` change is a human decision); see Unverifiable. (6) Optional hardening:
  `element.dataset` in `inputFromElement` (`script.js:31`) is still unguarded while
  `isCalculatorButton` guards it — unreachable in practice (the listener is bound to `.buttons`,
  whose descendants are elements), explicitly optional, noted not filed.
- **Secrets / data exposure**: no credentials, tokens, out-of-repo paths or personal data in the
  diff (sweep for `api key|secret|token|password|credential|private key|bearer` over the full
  non-`.agent` diff: no match). Nothing is persisted (no `localStorage`/`sessionStorage`/cookies).
  The user-facing failure text is the constant `Error` — no internal detail, no stack, no state.
  Internal invariant violations throw `TypeError`s whose messages describe the contract and never
  echo attacker input.
- **Dependencies / supply chain**: unchanged and still zero — no manifest, no lockfile, no
  `node_modules`, no `<script src>` other than the two repo-relative files, no CDN, no SRI need,
  no new `require` in the added test. D-001 (zero dependencies) holds.
- **Conventions & complexity** (security-relevant subset): the added test follows the file's
  existing shape, carries a *why* comment naming the mutation it kills (see F-9 on that comment's
  accuracy), and introduces no new helper, global or shared mutable state. The "one thin DOM layer"
  boundary is untouched.
- **Performance implications**: none security-relevant; no product code changed. The added test
  costs ~2 ms. No regex added to shipped code; the only regexes in the repo are in test helpers and
  are linear (no catastrophic-backtracking surface).
- **Architecture fit**: unchanged — enforcing "once per physical press" by cancelling a browser
  default rather than simulating one keeps native activation in the browser's hands. Full
  structural judgement belongs to the architecture reviewer.

## Unverifiable
- **No real browser (RK-3).** Everything above was executed against `tests/helpers/dom-stub.js`.
  Specifically **UNVERIFIED**: (a) whether a real engine's pending `Space` activation survives a
  `preventDefault()` on an intermediate repeat keydown, and whether a real engine re-fires native
  activation per repeat at all — the stub models activation on *keydown* while real browsers use
  *keyup* for `Space` (F-8; worst case one action becomes zero, never two); (b) that a real browser
  reports `detail === 0` for a `Tab`-focused button's native `Enter`/`Space` activation and
  `detail >= 1` for a pointer click (the D-011 mechanism rests on this); (c) whether real OS
  auto-repeat matches the modeled `repeat: true` flag; (d) whether a real browser lets
  `preventDefault()` suppress `Escape` or `/`. Residual risk: **low for security** — every failure
  direction is fewer actions or the browser's own default, never a bypass of the allowlist, which
  is enforced in pure code I did execute. The user's manual browser pass (unit file RK-3,
  items 1–5) remains the right control.
- **`CALC_STUB_TRANSFORM` (BOOT-001-sec1 F-4, still open).** `run-gate.mjs` records no environment,
  so a gate run performed with that variable set would produce evidence indistinguishable from an
  honest one. I confirmed the variable was unset for my verification runs (set deliberately, and
  only, inside the isolated probe shells) and that my counts match the recorded evidence exactly,
  but I cannot retroactively verify the environment of the recorded runs. Residual risk: test
  integrity, not product security; the fix needs a human change to `run-gate.mjs` or a stub refusal.
- **Real-world markup injection.** I assumed attacker-controlled DOM as instructed, but for a static
  `file://` page there is no channel by which an attacker supplies markup without already
  controlling the file. The impact statements for F-1, F-2 and F-6 are written under that caveat.
- **Evidence provenance.** The unit Log records earlier `latest-unit-red.json` overwrite-and-restore
  repairs. I did not audit them; they concern TDD evidence (gate 3), not the security posture of
  this head, and my own re-runs of the four final gates match the recorded files exactly.
