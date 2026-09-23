---
kind: decision
id: D-012
unit: KEY-001
status: rejected
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)), on a factual gap the independent code review exposed; proposed by architecture-reviewer@claude-opus-5 during the KEY-001 cycle-2 structural review at 5678cc1b; flagged to the user in the final report
---

# D-012 — The auto-repeat policy is applied per channel, and native button activation is ungated

## Context
`D-005` clause 6 puts the auto-repeat policy in the pure core (`allowsRepeat`) precisely so it is
**channel-agnostic**. The adapter applies it in exactly one place, the `keydown` listener
(`script.js:103-105`).

Native activation is a second path into `dispatch`. The `keydown` guard at `script.js:89-92`
deliberately returns early for `Enter`/`Space` on a calculator button so the browser performs its
own default activation (AC-6, one action per press instead of two) — and that early return is
*before* the repeat check. So the browser's activation click reaches the click listener and
`dispatch()` without the policy ever being consulted.

This became reachable with the `D-011` Option A fix. Before it, the unconditional `blur()` moved
focus away after the first native activation, so repeats landed on `<body>` and went through the
gated `keydown` path. Restoring focus (which is what OQ-3 and AC-6 require) also restored the
ungated repeat path. Measured at `5678cc1b` with the DOM stub: `5 + 5`, focus `=`, `Enter` with
`repeat:false,true,true` produces **three** dispatches, not one; a focused `+` after `9` likewise
produces two extra dispatches.

**It is inert today.** Every input the policy forbids repeating is idempotent in the state that
immediately follows its own application:

- `equals` with `operator === null` returns the same state (`calculator-core.js:110-112`), and the
  state right after an equals always has `operator === null`;
- an operator press while `resetOnNextInput && !justCalculated` swaps the trailing symbol for an
  identical one (`calculator-core.js:57-60`).

So the extra dispatches change nothing observable: the display, the state and `README.md:28`
("`Enter`, `=` and the operator keys act once per press even if held down") all remain correct. No
test exercises the path (every AC-6 row sends one non-repeat keydown; every AC-7 held-key row
targets `document.body`), and it is `UNVERIFIED` in a real browser (RK-3) — though held `Enter` on a
focused button does repeat activation in real browsers, whereas held `Space` does not (buttons
activate on `Space` keyup), so the real exposure is `Enter` only.

## Decision — REJECTED (orchestrator, 2026-09-22): the "inert today" premise is false
The independent code review (`.agent/reviews/KEY-001-r2.md`, F-1) measured the case this record does
not: a held `Enter` on a **Tab-focused digit button**. `allowsRepeat` marks a digit input `true`
(OQ-4 says a *physically held digit key* should keep typing), so this record's own proposed fix
(`if (event.repeat && !allowsRepeat(buttonInput))`) would **not** suppress the repeat there — the
digit's own button would still be natively re-activated on every repeat, and the reproduced result is
`7`, `77`, `777`: not idempotent, directly visible, and a plain contradiction of AC-6's "exactly once"
and AC-7's "repeats after the first are ignored" in the one input class (digits) where both this
record's chosen examples (`=`, an operator-swap) happen to be safe by coincidence. "It is inert today"
was true for the two cases measured and false for the reachable one that was not. Superseded by the
orchestrator dispatching the code reviewer's option (a): unconditionally suppress a **repeat** native
activation of a calculator button (`if (event.repeat) { event.preventDefault(); return; }`, before the
existing `return`), regardless of the focused button's input type — this also covers the digit case,
which a policy keyed on `allowsRepeat` cannot. See `.agent/units/KEY-001.md` Log for the fix commit.

## Decision as originally proposed (superseded, kept for history)
Accept for `KEY-001` as a documented residual, and record the invariant it depends on — not just
the symptom. The unit's Known Issues entry should state that AC-7 holds on the native-activation
channel *because every non-repeatable input is idempotent in the state that follows it*, and that
this invariant is now load-bearing.

**Trigger for revisiting (the point of recording it):** the first change that makes a repeated
non-repeatable input non-idempotent — most plausibly the common calculator feature "repeated `=`
re-applies the last operation" (`5+5=` `=` `=` → `10`, `15`, `20`). At that moment a held `Enter` on
a `Tab`-focused `=` runs away while the keyboard channel stays correctly gated, i.e. the two
channels diverge on a policy they are supposed to share. Whichever unit introduces such a change
owns the fix.

**The fix, when it is wanted** (~5 lines, no new state, no new boundary) — inside the existing
`Enter`/`Space`-on-a-calculator-button branch of the `keydown` listener, before the `return`:

```js
const buttonInput = inputFromElement(event.target);
// Suppress the browser's own re-activation for a held key the shared policy says acts once.
if (event.repeat && buttonInput !== null && !allowsRepeat(buttonInput)) {
  event.preventDefault();
}
```

`preventDefault()` on the `keydown` is what suppresses a browser's default activation, so the policy
is enforced at the only point in the adapter that can see `event.repeat`; the stub already honours
`defaultPrevented` when deciding whether to synthesize the activation click
(`tests/helpers/dom-stub.js:121`). It reuses the same pure `allowsRepeat` predicate, so the policy
stays single-sourced (`D-005` clauses 5 and 6). Plus two integration rows: held `Enter` on a focused
`=` must dispatch once; held `Enter` on a focused digit must still type on every repeat.

## Alternatives considered
- **Fix it now, in `KEY-001`.** Rejected (recommended against, not forbidden): the observable defect
  count today is zero and that was verified by construction, not assumed; the behavior is
  `UNVERIFIED` in a real browser either way, so the fix would be pinned only by the same stub that
  raised the question; and a new commit re-opens a green, SHA-bound unit and costs a full gate 4–8
  and three-reviewer re-run. If the user prefers certainty over cycle cost, the change above is the
  one to make — it is small, additive and consistent with `D-005`.
- **Move the repeat gate into `dispatch()`** so every channel is covered at one point. Rejected:
  `dispatch(input)` receives a descriptor, not an event; it would need an `isRepeat` argument
  (spreading a DOM concern into the seam) or a module-level "last input" flag, which `D-005`
  clause 2 exists to prevent.
- **Drop the `keydown` guard and handle `Enter`/`Space` on a focused button ourselves**, calling
  `preventDefault()` unconditionally so only our gated path runs. Rejected: it makes the app
  simulate a browser default action for a button the browser already activates correctly, and it
  would silently break native activation for any future focusable control.
- **Leave it as an undifferentiated Known Issue bullet** (the status quo before this record).
  Rejected: the bullet names the symptom but not the invariant, so the next unit that changes
  equals-repeat behavior has no way to know it is standing on it.

## Consequences / residual risk
- `KEY-001` can complete with AC-7 `SATISFIED`; the Known Issue must carry the invariant and this
  record's trigger, not only the observation.
- Residual: real-browser behavior of held `Enter` on a focused button is `UNVERIFIED` (RK-3) and
  belongs in the user's manual pass — hold `Enter` on a `Tab`-focused `=` and confirm nothing
  unexpected happens.
- No effect on the zero-dependency, classic-script, no-build or `file://` constraints; the sketched
  fix has none either.
