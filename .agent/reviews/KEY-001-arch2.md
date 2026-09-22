---
unit: KEY-001
reviewer: architecture-reviewer
model_attested: claude-opus-5
reviewed_ref: 5678cc1b70f39af6859c980a8520bb858418a140
verdict: APPROVED
cycle: 2
---

# Review KEY-001 arch2 — verdict: APPROVED

Fresh full structural review at `head_ref` `5678cc1b`, not a delta review: I re-derived every AC
verdict from evidence I gathered myself at this ref, then judged whether the user-chosen `D-011`
Option A fix for my own cycle-1 `F-1` was implemented soundly. Scope is structure — `D-005`
clauses 1–7, boundaries, coupling, hidden state, testability seams, extensibility, constraints and
migration cost. Code correctness per AC and security are the other two reviewers' scope.

**Model attestation**: I am running on Opus (`claude-opus-5`). The orchestrator's session is on
Sonnet (`FALLBACK(opus->sonnet)` on the dispatch handoff); that fallback does **not** extend to this
review, which is a full-assurance Opus review.

**Ref note (verified, not a blocker)**: `git rev-parse HEAD` is `6d31d7fe`, two commits after
`head_ref`. `git diff 5678cc1b..HEAD -- . ':(exclude).agent'` is **empty**, so every product and
test file in the working tree I read is byte-identical to `head_ref`. The drift is `.agent/`-only,
as the dispatch states (same pattern as r1 F-8).

**Independence**: I did not open handoffs `KEY-001-04`, `-06`, `-08`, `-16` (off limits by
dispatch). No implementer or integration-tester rationale informs any statement below; every claim
comes from the shipped files, the tests, the git history and the probes listed under "What I ran
myself". `D-011` was read as the artifact I am asked to judge as applied, not as proof.

No Critical and no Major finding is open. Three findings (one Minor, two Nits) are recorded below
with cost/benefit; none blocks `APPROVED`, and none is a rewrite proposal. The cycle-1 Minor/Nit
findings the user deferred (`arch1` F-2, F-3, F-4, F-5) are still open by that user decision and are
correctly carried in `.agent/units/KEY-001.md` Known Issues; I re-verified they are unchanged at
this ref and I do **not** re-raise them.

## Acceptance criteria verdicts
- AC-1: SATISFIED — `mapKey` is still a pure core entry point (`calculator-core.js:226`); probe 1
  loads `calculator-core.js` in bare Node where `document`/`window` are `undefined`. Integration row
  "typing four plus eight plus nine then Enter…" renders `4+8+9` / `21` through the same `dispatch`
  the click path uses. Unaffected by the fix (the diff touches only the click listener's blur gate).
- AC-2: SATISFIED — `.`/`,` both map to `{type:'number',value:'.'}` (`calculator-core.js:210-211`);
  the one-decimal-point rule stays in the core's `appendNumber`, not duplicated in the key path.
- AC-3: SATISFIED — operator entries are *derived* from `OPERATORS` (`calculator-core.js:212`), so
  the key channel cannot list an operator the core rejects; `x`/`X` are the only hand-written
  aliases.
- AC-4: SATISFIED — `Backspace`/`Escape`/`Delete` map onto the existing `delete`/`clear` actions; no
  transition was added to the core for the keyboard.
- AC-5: SATISFIED — modifier filtering lives in the pure `mapKey`; `script.js` passes only
  `{ctrlKey, metaKey, altKey}` (`modifiersOf`, `script.js:61-63`), and `preventDefault()` is reached
  only after a non-`null` map result (`script.js:95-101`), so the allowlist is the single gate for
  both effects. Untouched by the fix.
- AC-6: **SATISFIED** (was `NOT_SATISFIED` at `ab4b5d1d`) — both halves now hold and both are pinned.
  First half: `page.click()` → `detail: 1` → `script.js:80-82` blurs, probe 2 and the integration
  row assert `activeElement === null` and the `4+8`/`12` (not `4+84`) display. Second half: a
  `Tab`-focused button's native `Enter`/`Space` activation arrives as a `detail: 0` click, is **not**
  blurred, and `document.activeElement` is still that button (probe 2, and the row's second
  assertion). Exactly one action still occurs per native activation (rows at
  `tests/integration/keyboard.test.js:259-305`, with the write-count spy as the discriminating
  oracle for `=`). The user's OQ-3 resolution — `blur()` for *mouse-initiated clicks only* — is now
  what the code does. Mutation probes A–D (below) each kill the assertion, so this is a
  discriminating test, not a passing one.
- AC-7: SATISFIED for the keyboard channel — `allowsRepeat` is a pure core predicate (`D-005`
  clause 6) and the adapter's only repeat logic is `if (event.repeat && !allowsRepeat(input))
  return;` (`script.js:103-105`), exercised by four integration rows. For the *native-activation*
  channel the policy is not applied at all (probe 3): a held `Enter` on a `Tab`-focused button
  re-activates it on every repeat. AC-7's literal requirement ("repeats after the first are ignored
  (state unchanged)") still holds even there, because every non-repeatable input is idempotent in
  the state that immediately follows its own application (equals with `operator === null` returns
  the same state, `calculator-core.js:110-112`; a same-symbol operator swap rewrites the trail with
  an identical glyph, `calculator-core.js:57-60`) — so the AC is satisfied, but by a property of the
  core's transitions rather than by the stated policy. That coupling is finding F-1, Minor.
- AC-8: SATISFIED as a structural check only (docs are the documenter's and code reviewer's scope):
  `README.md:29` ("unmapped keys such as `Tab` behave as normal") was contradicted by the shipped
  behavior at `ab4b5d1d` and is accurate at this ref. `README.md:28`'s "`Enter`, `=` and the
  operator keys act once per press even if held down" is accurate observationally, subject to the
  same idempotence caveat as AC-7 (F-1).

## What I ran myself
No file on disk was changed and no git state was touched: `git status --porcelain` was empty before
and after every command below. As in cycle 1, I ran the gate commands from `.agent/gates.json`
**directly** rather than through `run-gate.mjs`, because the dispatch forbids changing files and
`run-gate` would rewrite `.agent/test-results/KEY-001/latest-*.json`; the SHA-bound evidence at
`head_ref` already exists and my counts match it exactly. All mutation probes ran **in memory** via
the stub's `CALC_STUB_TRANSFORM` hook (`tests/helpers/dom-stub.js:444-473`), which rewrites the
source inside `vm` only — nothing was written to `script.js`.

| Command | Result |
|---|---|
| `node --test "tests/unit/**/*.test.js"` | 83 pass / 0 fail (matches `latest-unit-final.json`, commit `5678cc1b`) |
| `node --test "tests/integration/**/*.test.js"` | 46 pass / 0 fail (matches `latest-integration-final.json`) |
| `node --test "tests/regression/**/*.test.js"` | 25 pass / 0 fail (matches `latest-regression-final.json`) |
| `node --check script.js && node --check calculator-core.js` | pass (matches `latest-lint-final.json`) |
| `node .agent/tools/validate.mjs state` | `state: OK`, exit 0 (read-only; no `--write`) |
| `git diff 5678cc1b..HEAD -- . ':(exclude).agent'` | empty — working tree ≡ `head_ref` for all code/tests |
| `git diff ab4b5d1d..5678cc1b -- . ':(exclude).agent'` | 3 files only: `script.js` (+7/−1, of which 3 lines are code), `tests/helpers/dom-stub.js` (+8/−3, 1 line of behavior), `tests/integration/keyboard.test.js` (+21/−1, one row) |

**Mutation probes** (all four kill exactly the AC-6 row — the fix is pinned in both directions, and
the row is not vacuous):

| Probe | Mutation of `script.js` | Result |
|---|---|---|
| A | gate removed → `blur()` on every click (the `ab4b5d1d` behavior) | ✖ "a mouse click blurs its button so a following Enter…" fails |
| B | `event.target.blur();` deleted entirely | ✖ same row fails |
| C | gate inverted → `event.detail === 0` | ✖ same row fails |
| D | gate loosened → `event.detail >= 0` | ✖ same row fails |

**Behavioral probes** (`node -e`, nothing written):
1. **Core purity (`D-005` clause 1)** — `require('./calculator-core.js')` in bare Node: loads with
   `document`/`window` `undefined`; exports exactly `createState, applyInput, render, mapKey,
   allowsRepeat, isInput`. Unchanged by the fix (`calculator-core.js` is not in the diff).
2. **Both halves of the fix** — mouse click on `4`: display `4`, `activeElement === null`; then
   `+ 8 Enter` on the focused element → `4+8` / `12`. `focus()` on `7` + `keydown{key:'Enter'}` →
   display `7`, **`activeElement` is still the `7` button**. Cycle-1 F-1 is closed at the behavior
   level, reproduced independently of the test file.
3. **Held activation on a focused button** (the risk the dispatch asked me to judge) — `5 + 5`, then
   `focus()` on `=` and `Enter` with `repeat:false, true, true`: the display-write spy counts
   **1 + 2 = 3** dispatches (the two repeats are *not* suppressed) while the display stays
   `5+5` / `10` and focus is kept. Same shape for a focused `+` after `9`: 2 extra dispatches, display
   stays `9+`. Held `Space` on a focused `7` types `77` (digits may repeat, so that one is correct
   policy anyway). Conclusion: extra dispatches, zero observable state change today. See F-1.
4. **Click event with no `detail` field** — `page.dispatch('click', button)` (no init): the handler
   dispatches the input and does **not** blur, i.e. an undefined `detail` fails open to
   "keyboard origin". No test in the repo takes that path today (`grep` finds exactly one
   `dispatch('click'` in the whole tree, inside `page.click`). See F-3.
5. **`detail: 0` click on an unfocused button** — dispatches the input, focus untouched. Matches a
   real browser's `element.click()` semantics, which `D-011` names explicitly.
6. **Mutable-binding audit (`D-005` clause 2)** — `grep -n "^\s*\(let\|var\) " script.js` returns
   exactly one line: `12: let state = createState();`. The fix added **no** module-level flag,
   notably no "last pointer event" variable — the alternative `D-011` explicitly rejected.

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | `script.js:88-108` (keydown guard) vs `script.js:67-83` (click listener) | **The auto-repeat policy is applied per channel, and one channel is ungated.** `D-005` clause 6 puts the policy in the core precisely so it is channel-agnostic, but the adapter applies it only in the `keydown` listener. Native activation is a second path into `dispatch` — the guard at `:89-92` deliberately returns before the repeat check so the browser's default action fires — so a *held* `Enter` on a `Tab`-focused button re-activates it on every repeat (probe 3: 2 extra dispatches for a focused `=`, 2 for a focused `+`). This is a consequence of the `D-011` fix: before it, the unconditional `blur()` moved focus away after the first activation and masked the path. It is **inert today**: every input the policy forbids repeating is idempotent in the state that immediately follows itself (`equals` with `operator === null` returns the same state; a same-symbol operator swap is a no-op), so no display or state change is observable, and `README.md:28` stays true. The structural cost is that an AC now rests on an unstated property of the core's transitions instead of on the policy: the plausible next feature "repeated `=` re-applies the last operation" (a common calculator behavior) would make a held `Enter` on a `Tab`-focused `=` run away, while the keyboard channel would remain correctly gated — a divergence between two channels that are supposed to share one policy. | **Accept as a documented residual for this unit** (my explicit answer to the dispatch's question — the user-visible defect count today is zero, and fixing it would re-open a green, SHA-bound unit for a latent risk), **but** record the invariant it now depends on rather than only the symptom: see the proposed `.agent/decisions/D-012-native-activation-and-repeat-policy.md` and amend the Known Issue to name the idempotence property. When any non-idempotent repeat behavior is introduced, the fix is ~5 lines in the existing guard and adds no state: inside the `Enter`/`Space`-on-a-calculator-button branch, `const buttonInput = inputFromElement(event.target); if (event.repeat && buttonInput !== null && !allowsRepeat(buttonInput)) { event.preventDefault(); }` before the `return` — `preventDefault()` suppresses the browser's default activation, the stub already honours it (`dom-stub.js:121`), and it reuses the same pure predicate, so the policy stays single-sourced. Plus 2 integration rows (held `Enter` on a focused `=` and on a focused digit). |
| F-2 | Minor | `.agent/units/KEY-001.matrix.md:80` vs `tests/integration/keyboard.test.js:230-257` | **Traceability: the behavior `D-011` was written for has no matrix row.** The focus-retention assertion (`activeElement` is still the button after native activation) was folded into the row whose matrix entry describes only the mouse-click half ("Click `4` (mouse), then keys `+ 8 Enter` → `4+8`/`12`"), and the test name still names only that half. So the matrix — the AC→test map the unit's DoD is read against — does not state anywhere that a `Tab`-focused button must keep focus, and a failure of the new assertion reports under a misleading test name (CLAUDE.md §4, one behavior per test). I can see why it was done this way: `validate.mjs:288` checks that every matrix row name exists in the source, so renaming or splitting the row requires the matrix (the test-designer's file) to change first — which is a process ordering constraint, not a code one. | One new matrix row under AC-6 ("a Tab focused button keeps focus after a native Enter activation", expected `document.activeElement` is still that button) and split the second half of the row into a test of that name. ≈4 lines across two files, no behavior change, and it restores the property that the matrix reads as the specification. Not blocking; suitable for a matrix amendment in this unit or the next one that touches AC-6. |
| F-3 | Nit | `tests/helpers/dom-stub.js:537-554` | **The stub now has two click deliveries with different origin semantics, and only one of them sets `detail`.** `page.click()` sends `detail: 1`, the synthesized native activation sends `detail: 0`, but the public `page.dispatch('click', target)` sends no `detail` at all — and production reads `undefined > 0` as `false`, i.e. as keyboard origin, so such a click does not blur (probe 4). Nothing is wrong today (no test uses that path), but a future test author writing "the user clicks X" with `page.dispatch` would silently get non-mouse semantics — exactly the class of test that cannot fail for the defect it appears to cover, which is what r1 F-1 and my own arch1 F-1 were about. | One line in `page.dispatch`: default `detail: 1` when `type === 'click'` (overridable by `init`), or throw if a click is dispatched without an explicit `detail`. Fold into whichever unit next touches the stub; not this unit's obligation. |
| F-4 | Nit | `tests/integration/keyboard.test.js:240-242` | The row asserts `activeElement === null`, which is a **stub artifact**: `dom-stub.js:205-208` sets `_activeElement = null` on `blur()`, whereas a real browser moves focus to `<body>`. The very next line hedges against exactly that (`page.document.activeElement \|\| page.document.body`), so the two statements disagree about what the stub guarantees — and the hedge is redundant anyway, since `typeKeys` already falls back to `document.body` for a null target (`:37`). The assertion also over-specifies: what the behavior requires is "the clicked button no longer has focus". | Assert `assert.notEqual(activeElement, four, …)` (or keep the `null` assertion and drop the hedge, with a comment that `null` is the stub's model of "focus moved to the body"). 1–2 lines. Not blocking; the row is fully discriminating either way (probes A–D). |

## Assessments
- **Does the implementation match `D-011`'s stated rule?** Yes, literally. The rule is "when the
  adapter changes focus, it must do so as a function of which channel initiated the activation, and
  that origin must be read from the event, never inferred from adapter-held state". `script.js:80`
  reads `event.detail` off the event object the handler already receives; probe 6 confirms the
  adapter still has exactly one mutable binding (`let state`), so nothing is inferred from held
  state and `D-005` clause 2 is intact. The rejected alternative (`let lastPointerDown`) was not
  smuggled in under another name. The stub change mirrors the production change symmetrically
  (`detail: 1` on the pointer path, `detail: 0` on the synthesized-activation path) and matches the
  UI Events semantics `D-011` cited, so the test double's model and the browser's contract are the
  same statement rather than two independent guesses — which is the direction of dependency my
  cycle-1 F-1 said had been inverted. It is now the right way round.
- **Cost against `D-011`'s estimate** ("≈8 lines across three files, no new boundary, no new
  state"): production is 3 lines of code plus 4 of comment; the stub is 1 line of behavior plus
  comment; the test row grew by 21 lines but is still one row. No new boundary, no new state, no new
  file, no new export. The estimate held for the shipped code; the test grew more than "one
  integration row" implied because the row now carries two behaviors — which is F-2, a traceability
  point, not a cost overrun.
- **Is the corrected test structurally sound, or could a different broken fix still pass it?** It is
  sound for every mechanism a test can observe: probes A–D show it kills the unconditional blur, the
  missing blur, the inverted gate and the always-true gate. The two halves are independent
  (`activeElement === null` after a mouse click; `activeElement === button` after native
  activation), and the mouse half is doubly discriminating — with `blur()` removed, the follow-up
  keys are routed to the still-focused button and the display renders `4+84`, so the row fails on
  the display assertion too, not only on the focus assertion. What no behavioral test can
  distinguish is *how* the origin is determined: a fix that inferred the same answer from adapter
  state would pass this row identically. That half of `D-011`'s rule is enforceable only by reading
  the code, which is why I ran probe 6 and state its result explicitly rather than relying on the
  suite. Residual: both halves are stub-defined, so real-browser `detail` semantics stay
  `UNVERIFIED` (RK-3) — `D-011` accepted that, and the failure mode if a browser disagreed is the
  *previous* behavior, not a worse one.
- **The held-`Enter` question — structural risk or acceptable residual?** Acceptable residual for
  this unit, recorded rather than fixed; F-1 states the reasoning and I propose
  `D-012` (`status: proposed`) so the acceptance is an explicit choice with its invariant named,
  not an implicit one. Three reasons for accepting rather than requiring a fix now: the observable
  defect count today is zero and I verified that by construction, not by assumption (probe 3);
  the behavior is `UNVERIFIED` in a real browser either way, so a fix would be pinned only by the
  same stub that raised the question; and re-opening a green, SHA-bound unit costs a full gate 4–8
  re-run for a latent risk that a ~5-line change closes cleanly whenever it becomes real. Against
  that: the risk is not speculative (repeat-`=` is a plausible next feature) and the fix is small —
  which is why it should be *recorded with its trigger*, not merely listed as an oddity.
- **`D-005` clause-by-clause at this ref**: (1) core pure — HELD (probe 1; `calculator-core.js` is
  not in the fix diff). (2) one mutable binding — HELD (probe 6). (3) one dispatch seam per channel
  — HELD: `grep` finds exactly one `applyInput` call (inside `dispatch`), two `textContent` writes
  (both inside `updateDisplay`), and no `.click(` anywhere, so no channel simulates another; native
  activation is the *browser* reusing the click seam, which is the intended shape. (4) validation
  split — HELD (the fix touches neither `inputFromElement` nor the core's throws). (5) vocabulary
  exported once — HELD (unchanged from cycle 1, where I verified it by diff and grep rather than by
  claim). (6) channel-agnostic policy is pure — HELD for the policy itself; its *application* is
  per-channel and one channel does not apply it (F-1). (7) presentation may not read core state —
  not exercised, still supported for `KEY-002`.
- **Boundaries, coupling, cohesion**: unchanged and good. The fix added one `if` to an existing
  ~12-line listener; no new function, no new indirection, no God function, dependency direction
  still one-way (adapter → core). The click listener now has two responsibilities (dispatch, focus
  policy) as it did before, with the focus policy expressed in one guarded line.
- **Hidden state / impossible combinations**: none added. The implicit state this design leans on is
  the browser's focus, which is read (`isCalculatorButton(event.target)`) in one handler and written
  (`blur()`) in the other; after the fix, the invariant tying them together is stated and true —
  *the adapter blurs what a pointer focused, and nothing else*. That is the invariant my cycle-1
  review said was missing.
- **Testability seams**: good and slightly better than cycle 1. Click origin is now an observable,
  injectable property of the event rather than a thing the stub could not express, so the focus
  policy is drivable from a test without any production hook. The write-count spy remains a valid
  dispatch oracle (its unpinned premise is the deferred `arch1` F-4).
- **Extensibility vs YAGNI**: the next channel (touch, paste) inherits `D-011`'s rule and reads its
  own origin off its own event; a touch-derived click reports `detail >= 1` in real browsers, so it
  blurs like a mouse click, which is the behavior a touch user wants. Nothing speculative was added:
  no origin-abstraction layer, no channel registry. Correct trade at two channels.
- **Constraints**: zero dependencies (no `package.json`, none added); classic scripts only
  (`index.html` is not in the diff, no `type="module"`); no build step; `file://` intact —
  `event.detail` is a plain property of the event object and needs nothing a `file://` page lacks.
  `node --check` passes on both shipped files.
- **Migration / rollback cost**: lower than cycle 1's. The fix is a self-contained 3-line guard;
  reverting it restores the `ab4b5d1d` behavior with no other file affected (the stub's `detail`
  fields are inert without it, and the test row would fail loudly rather than silently). The
  unit-level note from cycle 1 still applies: `inputFromElement` depends on `isInput`, so a revert
  of `calculator-core.js` alone would break the click path — revert both shipped files together.

## Unverifiable
- **Real browser behavior** (no browser available, RK-3): that a native `Enter`/`Space` activation
  really produces a click with `detail === 0` while a pointer click produces `detail >= 1` (the UI
  Events definition, and the whole basis of Option A); that real OS auto-repeat drives native
  activation the way the stub models it (the premise of F-1 — note that real browsers activate a
  button on `Space` *keyup*, so the stub's repeated-`Space` activation over-models the risk, while
  held `Enter` is the real case); that `preventDefault()` on the mapped keys does not disturb an IME
  or an accessibility tool. A manual pass by the user is still required.
- **Sequential focus navigation after a `blur()`**: some browsers reset the "focus navigation
  starting point" to the document start after a programmatic `blur()`, so pressing `Tab` right after
  a mouse click may restart the focus order rather than continue from the clicked button. That is an
  inherent cost of the user-chosen Option A (Option B avoided it by never letting a pointer focus a
  button) and it is not observable in the stub. Residual risk, not a finding.
- **Focus-ring and screen-reader consequences**: I verified focus *state* in the stub only; how
  assistive technology announces the retained/lost focus is untested and untestable here.
- I did not read handoffs `KEY-001-04`, `-06`, `-08`, `-16` (off limits by dispatch), so no
  implementer or integration-tester narrative informs any statement above.
