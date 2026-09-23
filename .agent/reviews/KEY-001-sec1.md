---
unit: KEY-001
reviewer: security-reviewer
model_attested: claude-opus-5
reviewed_ref: ab4b5d1d21dcdf8db587cab203f0d9d764ef0043
verdict: APPROVED
cycle: 1
---

# Security review KEY-001 sec1 — verdict: APPROVED

Runtime model attestation: **claude-opus-5** (Opus family, no fallback). The dispatch handoff
`KEY-001-10` was written by the orchestrator under `FALLBACK(opus->sonnet)`; that does not apply to
this review.

Scope: independent security review of the diff `f9426e28..ab4b5d1d` under the assumption that the
DOM (markup and every `data-*` attribute value) **and** keyboard events (synthetic `KeyboardEvent`s
from a malicious page script or extension) are attacker-controlled. Handoffs `KEY-001-04`, `-06`,
`-08` were not opened. No file on disk was changed except this review and
`.agent/handoffs/KEY-001-13-security-reviewer-to-orchestrator.md`; all probing was done with
`node` reading scripts from stdin, writing nothing anywhere. `git status` (clean outside `.agent/`)
and `git rev-parse HEAD` are identical before and after (verified).

**Ref note (not a blocker):** `git rev-parse HEAD` is `ffa4aed6` (one commit ahead of `head_ref`),
not `ab4b5d1d` as the dispatch stated. I verified that `git diff ab4b5d1d..ffa4aed6 -- script.js
calculator-core.js index.html style.css tests/ README.md` is **empty** — `ffa4aed6` touches only
`.agent/` handoffs, evidence and the unit file. Everything reviewed and executed here is therefore
byte-identical to `head_ref`, and this verdict is bound to `ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`.

**No exploitable weakness was found at this ref.** All five findings are Nit-level hardening; none
is reachable by an attacker who does not already fully control the page. The unit is a net security
improvement over the baseline: it removes the duplicated boundary vocabulary from `script.js` and
closes three of the four security-relevant findings carried forward from `BOOT-001`.

## Acceptance criteria verdicts
Only the security-relevant ACs named in the dispatch are judged here. AC-2, AC-3, AC-4, AC-7 and
AC-8 are behavior/documentation criteria and belong to the code review; this file deliberately says
nothing about them, so the machine-read AC block of `review_file` stays the code reviewer's.

- AC-1: SATISFIED — the input vocabulary is exported once (`isInput` in `calculator-core.js:187`) and
  is the only validity source for both adapters; `KEY_MAP` (`calculator-core.js:209`) is *derived*
  from `NUMBER_CHARACTERS` and `OPERATORS`, so no third hand-maintained table exists. I probed every
  descriptor `mapKey` can emit against `isInput`: all accepted, and the click path's hostile-value
  rejection is unchanged (see "What I ran myself", probe B).
- AC-5: SATISFIED — for all 9 unmapped keys I probed (`a`, `F5`, `Tab`, `' '`, `ArrowLeft`, `Shift`,
  `c`, `C`, `:`) and for a mapped key with any of `ctrlKey`/`metaKey`/`altKey` (4 combinations),
  `event.defaultPrevented` stayed `false` and both display lines were unchanged. `preventDefault()`
  is called only after `mapKey` returned non-null (`script.js:89-95`), i.e. only for the 14 keys of
  the closed allowlist with no Ctrl/Meta/Alt — RK-5 ("over-broad preventDefault") is closed. `Tab`
  and `Space` are outside the map and keep their native behavior.
- AC-6: SATISFIED (security aspect) — the click-side boundary filter was **not** weakened by the
  `isInput` refactor: 36 hostile `data-number`/`data-operator`/`data-action` values (`constructor`,
  `__proto__`, `toString`, `valueOf`, `''`, `'12'`, `'9 '`, `'1e3'`, `'CLEAR'`, `'equals;'`, `\u0000`
  …) on synthetic buttons inside `.buttons` produced no state change, no exception and no markup
  write. No double-action path exists: the keyboard listener never synthesizes a `click()`, and the
  `Enter`/`Space`-on-a-calculator-button early return (`script.js:83`) happens *before* any dispatch.

## What I ran myself
Independent re-execution at the reviewed tree (`CALC_STUB_TRANSFORM` confirmed unset in my shell):

| Command | Result |
|---|---|
| `node --test "tests/unit/*.test.js"` | 83 pass / 0 fail |
| `node --test "tests/integration/*.test.js"` | 46 pass / 0 fail |
| `node --test "tests/regression/*.test.js"` | 25 pass / 0 fail |
| `git diff ab4b5d1d..ffa4aed6 -- <product+tests>` | empty (see ref note) |

Counts match the recorded evidence `.agent/test-results/KEY-001/latest-{unit,integration,regression}-final.json`
(83 / 46 / 25, 0 fail). No test was modified, added or skipped by me.

Hostile probes (all in-memory, stdin scripts, no file written):

- **Probe A — core key map.** `mapKey()` with `constructor`, `__proto__`, `toString`, `valueOf`,
  `hasOwnProperty`, `prototype`, `''`, `Unidentified`, `Process`, a 1 000 000-character string, and
  non-strings (`undefined`, `null`, `4`, `{}`, `[]`, `true`, `Symbol`) → **`null` every time, never a
  throw**. `KEY_MAP`, `OPERATORS` and `ACTIONS` are `Map`s, so inherited property names cannot be
  reached; I also polluted `Object.prototype.q = {type:'action',value:'clear'}` and confirmed
  `mapKey('q')` still returns `null` and `isInput({type:'action',value:'q'})` still returns `false`.
  Modifiers: `undefined`/`null`/`{}` default to false; an *inherited* `ctrlKey:true`
  (`Object.create({ctrlKey:true})`) fails closed (`null`); a modifiers object whose getter throws
  propagates the throw out of the listener (no state change, nothing swallowed — consistent with
  CLAUDE.md §4). Mutating a returned descriptor does not affect the next call (`{...mapped}` copy).
- **Probe B — click boundary.** 3 attributes × 12 hostile values on synthetic buttons appended to
  `.buttons`: zero state changes, zero exceptions, zero `markupWrites`. `isInput` also rejects
  `new String('4')` (object, not primitive) and `{type:'number',value:'12'}` (length > 1).
- **Probe C — keydown boundary on the real page.** Hostile `key` values (incl. a 200 000-character
  key) and malformed events (`key` missing/`null`/`4`/`{}`/`['4']`) → inert, `preventDefault` not
  called, no throw. Spoofed target: an injected `<div data-action="nonsense">` (not a `<button>`)
  receiving `Enter` → the handler returns early and the key does nothing (finding F-1). `keydown`
  targeted at `document`, `.display` and `#display-current` behaves normally.
- **Probe D — scanner efficacy (D-009 claims).** Against an in-memory copy of `index.html` the
  widened scan **does** flag: inline `onclick="eval(x)"`, `onclick="new Function(y)()"`,
  `onclick="document.body.innerHTML=z"`, `<script>document.write(q)</script>`, a bare
  `//evil.example.com` inside a `<meta content=…>`, a protocol-relative `<script src="//host">`, an
  absolute CDN `<link href="https://…">`, `<script type="module">`, and (via the src/href
  relative-path assertion) `href="javascript:alert(1)"`. It correctly does *not* flag a payload that
  only appears inside an HTML comment.
- **Probe E — `stripComments` (D-009 item 3).** With the correctly escaped snippet the fix holds
  (`/https?:\/\//; eval(payload);` keeps `eval(`). I added 13 further cases — regex with an escaped
  `//` followed by `innerHTML=`, a `/` inside a character class, `/a\/\*b/` followed by `eval(`,
  division after an identifier / `)` / `++`, `typeof x / 2`, the documented `return /re/` limitation,
  `"http://x"` and `` `//x` `` strings, an unterminated regex, a ternary — **none** hides a following
  `eval(`/`innerHTML`. Structural reason: the regex branch appends the slice *verbatim*, so a
  misclassification can only cause a false positive, never a false negative. Genuine `//` and `/* */`
  comments are still stripped (the `//` test precedes the regex test). Running the stripper over the
  two shipped scripts keeps all 104 + 254 lines and both `textContent` writes, and yields no pattern
  hit.

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Nit | `script.js:51-57, 83-87` | `isCalculatorButton()` returns true for **any** element carrying a `data-number`/`-operator`/`-action` attribute, regardless of tag name or value validity. An attacker who can inject markup can add `<div data-action="x" tabindex="0">`; while it holds focus, `Enter`/`Space` are swallowed by the early return and the browser performs no native activation either, so those keys become inert (verified in probe C). Impact is denial-of-function only, and requires markup injection, which in a static `file://` page already implies full script control — hence Nit, not exploitable today. | Narrow the guard to elements the browser will actually natively activate: also require `element.tagName === 'BUTTON'` (and, if wanted, `inputFromElement(element) !== null`). Guard test: `keydown` `Enter` on an injected non-button element bearing `data-action` must still evaluate the expression. |
| F-2 | Nit | `script.js:82` (design), `.agent/decisions/D-005-layering-rule.md` | The `keydown` listener is global on `document` and `preventDefault()`s all 14 mapped keys with no check of the event target. Today this is safe **because `index.html` contains no `<input>`, `<textarea>` or `contenteditable` element** (verified by reading the whole file: 18 `<button>`s, 4 `<div>`s, no form control) — I state this as a documented assumption, not an oversight. If any text field is ever added, digits, `.`, operators, `Backspace`, `Escape` and `Delete` typed into it will be stolen and suppressed. | Record the constraint where the next author will see it (D-005 and/or a comment at `script.js:82`), and add the guard when a field first appears: return early when `event.target` is an `INPUT`/`TEXTAREA`/`[contenteditable]`. A regression row asserting "index.html contains no editable field" would make the assumption enforced rather than remembered. |
| F-3 | Nit | `tests/helpers/source-scan.js:10` | `SHIPPED_FILES` omits `style.css`, which is shipped and can itself reach third parties (`@import url('//cdn…')`, a remote `url(…)` font or background). Such an edit would leak the user's IP/User-Agent to a third host and would pass every gate. `style.css` is clean today (verified: no `url(`, `@import`, `http:`, `//`). Out of this unit's declared D-009 scope, so it is not a KEY-001 defect. | Add `style.css` to the `externalHosts` scan (raw text with CSS comments stripped), plus a `url()`/`@import` relative-path assertion mirroring the `findReferences` check for `index.html`. |
| F-4 | Nit | `tests/helpers/source-scan.js:120` | `PATTERNS.dynamicCode` covers `eval`, `new Function`, `Function(` and `document.write`, but not the string forms `setTimeout('…')`/`setInterval('…')` (verified: an injected `onclick="setTimeout('alert(1)',0)"` passes the scan), nor inline `on*=` handler attributes in general. The shipped files contain no timer at all, so nothing is exploitable now. | Add `/\bset(?:Timeout|Interval)\s*\(\s*['"`]/` to `dynamicCode`, and consider an `index.html` assertion that no `on[a-z]+=` attribute exists at all — a stronger and simpler invariant than pattern-matching handler bodies. |
| F-5 | Nit | `tests/unit/key-map.test.js` | `isInput`'s rejection of `constructor`/`__proto__` **is** pinned, but `mapKey`'s is not (the unmapped-key row uses `a`, `F5`, `Tab`, `ArrowLeft`, `Space`, `Shift`, `` ` ``). The safety comes from `KEY_MAP` being a `Map`; if a future refactor turned it into an object literal, `mapKey('constructor')` would return `Object.prototype.constructor` and `applyInput` would throw an uncaught `TypeError` in the listener (fail-closed, but noisy). | Add one unit row: `mapKey('__proto__')`, `mapKey('constructor')`, `mapKey('toString')` each return `null`. |

## Assessments
- **Input → sink trace (the required map).** `KeyboardEvent` → `script.js:82` listener →
  `modifiersOf(event)` (copies three booleans into a fresh plain object) → `mapKey(event.key, …)`
  (`calculator-core.js:226`, closed `Map` allowlist, returns a fresh descriptor copy or `null`) →
  `dispatch(input)` (`script.js:21`) → `applyInput(state, input)` (`calculator-core.js:142`, which
  re-validates type *and* value and throws on anything malformed) → `render(state)`
  (`calculator-core.js:170`) → **`textContent`** assignments only (`script.js:16-17`). The strings
  that reach the DOM are built from `state.history.join('')` and `state.currentInput`, both of which
  can only contain allowlisted single characters, operator display symbols, `Error`, or
  `String(number)`. There is no `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`, no
  `eval`/`new Function`/string timer, no `import()`, no `location`/`href` write, no `postMessage`, no
  storage and no network call anywhere in the diff — verified by reading both files end to end and by
  the static scan over the comment-stripped sources (probe E). An attacker-supplied `event.key` can
  therefore, at most, cause one of the 14 legitimate calculator actions.
- **Boundary validation.** The DOM layer remains the only place that filters user-derived data, and
  it now does so through the single exported `isInput`. The two validators (`isInput` and
  `applyInput`) read the same three tables, so they cannot drift; `isInput` returns `false` where
  `applyInput` throws, which is the right split (a check must not throw, an invariant violation
  must). `Map`-based lookups make prototype-name inputs structurally impossible to match — I verified
  this survives deliberate `Object.prototype` pollution.
- **`preventDefault()` scope (RK-5).** Bounded to the allowlist and to modifier-free presses; `Tab`
  is never prevented, so keyboard navigation survives. Residual, accepted by OQ-2: while the page has
  focus, `Escape` (stop loading) and `/` (Firefox quick-find) lose their native behavior. This is the
  user-resolved design, affects only this single-purpose page, and has no security impact.
- **The `blur()` residual risk I was asked to judge independently.** `script.js:76` blurs
  `event.target` after *every* click, including the synthetic click a browser generates when a
  `Tab`-focused button is activated by `Enter`/`Space`. **This is not a security issue**: it removes
  focus rather than granting it, it cannot move focus to an attacker-chosen element (focus goes to
  the document body), it causes no double action (I confirmed: `Tab`→`7`→`Enter` types `7` once,
  `activeElement` becomes `null`, a second `Enter` is then read as equals), and it exposes nothing.
  I am saying so explicitly rather than silently agreeing with the implementer's framing: what it
  *is* is an **accessibility/UX regression** — a keyboard-only user loses their tab position after
  every activation and must tab from the top of the document again, and the AC-6 promise that a
  `Tab`-reached button "keeps standard button activation" is only half true (activation happens, the
  focus that a real browser would retain does not). That belongs to the code/architecture reviewers;
  it is not a reason to withhold a security approval.
- **Carried-forward BOOT-001 items — confirmed closed, not merely claimed.**
  1. *Untested boundary filters* — **closed**: two integration rows now click synthetic buttons with
     out-of-range `data-operator`/`data-action` values (`constructor`, `__proto__`, `''`) and assert
     no state change, no throw, no markup write; I reproduced and widened this to 36 values. The
     `D-003` claim was corrected in the `KEY-001` addendum.
  2. *AC-7 scan skipped `index.html`* — **closed**: the `dynamicCode`, `markupWrites` and
     `externalHosts` pattern sets now run over `index.html` (HTML comments stripped). Probe D shows
     the previously-passing `onclick="eval(x)"` and a bare `//host` both fail the scan now.
  3. *`stripComments` false negative* — **closed**: probe E, 14 cases, no false negative found; the
     append-verbatim design makes the failure mode positive-only.
  4. *Input vocabulary copied twice* — **closed**: `script.js` no longer holds any value list, and
     `KEY_MAP` derives its digit and operator entries from the core's own constants. No third table.
  5. *`CALC_STUB_TRANSFORM` not recorded in gate evidence* — **still open, correctly so**: it was not
     carried forward as a fix (changing `run-gate.mjs` is a human decision). The stub still honours
     the variable and only emits a `process.emitWarning`. Residual risk restated below; I verified
     the variable was unset for my own runs.
  6. Optional hardening: `element.dataset` in `inputFromElement` is still unguarded (`script.js:31`)
     while the new `isCalculatorButton` does guard it. Unreachable in practice (a click target is
     always an `Element`, and every element has `dataset`), and explicitly optional — noted, not a
     finding.
- **Robustness.** Auto-repeat on digits is uncapped: 5 000 repeated `9` keydowns produce a
  5 000-character operand, and `+ 1 =` then renders `Infinity` (via `textContent`, so still no
  injection). This is self-inflicted, local, pre-existing on the click path, and merely easier to
  reach with a held key; no confidentiality/integrity impact and no cross-user effect, so I record it
  as robustness information rather than a finding. If a maximum operand length is ever wanted, it
  belongs in the core with its own unit row. A 200 000-character `event.key` and a 1 000 000-character
  `mapKey` argument are both O(1) `Map` misses — no catastrophic backtracking anywhere (the only
  regexes in the diff live in test helpers and are linear).
- **Dependencies / supply chain.** Unchanged and still zero: no `package.json`, no lockfile, no
  `node_modules`, no `<script src>` other than the two repo-relative files, no CDN, no SRI needed.
  Nothing in the diff adds a network reference. `npm audit` is not applicable (no manifest).
- **Secrets / data exposure.** No credentials, tokens, paths outside the repo, or personal data in
  the diff. Nothing is persisted (no `localStorage`/`sessionStorage`/cookies). Error text shown to
  the user is the constant `Error` — no internal detail, no stack, no state leakage. Internal
  invariant violations throw `TypeError`s whose messages describe the contract, not user data.
- **Security-sensitive test coverage.** Adequate and it bites: 4 AC-5 rows (unmapped key inert,
  modifier combos inert, `preventDefault` exactly once, `Tab` never prevented), 2 click-boundary
  rows, 1 `Ctrl+R` regression row, 1 vocabulary row pinning `constructor`/`__proto__` rejection, and
  the widened AC-7 static scans. Gaps are F-3/F-4/F-5, all Nit.

## Unverifiable
- **No real browser (RK-3).** Everything above was executed against `tests/helpers/dom-stub.js`. The
  stub models focus, `activeElement`, `event.repeat`, modifiers, `preventDefault()` and a focused
  `<button>`'s native `Enter`/`Space` activation, but not real browser default actions. Whether a
  real browser actually lets `preventDefault()` suppress `Escape` or `/`, and whether real OS
  auto-repeat matches the modeled `repeat:true` flag, is **UNVERIFIED**. Residual risk: low — the
  failure mode is a browser shortcut that still works, not a bypass of the allowlist, because the
  allowlist itself is enforced in pure code I did execute.
- **`CALC_STUB_TRANSFORM` (BOOT-001-sec1 F-4, still open).** `run-gate.mjs` records no environment,
  so a gate run performed with that variable set would produce evidence indistinguishable from an
  honest one. I confirmed the variable was unset in my own shell and that my counts match the
  recorded evidence exactly, but I cannot retroactively verify the environment of the recorded runs.
  Residual risk: test-integrity, not product security; fixing it requires a human change to
  `run-gate.mjs` or a stub refusal, and remains the user's call.
- **Real-world markup injection.** I assumed attacker-controlled DOM as instructed, but for a static
  `file://` page there is no channel by which an attacker supplies markup without already controlling
  the file; F-1's and F-2's impact statements are written under that caveat.
