---
kind: decision
id: D-013
unit: KEY-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)), 2026-09-22, no code change required so no user gate needed; proposed by architecture-reviewer@claude-opus-5 during the KEY-001 cycle-3 structural review at fc93ff7a; supersedes the rejected D-012
---

# D-013 — A focused button's native activation is the browser's channel; the adapter's only lever is `preventDefault`

## Context
`KEY-001` gives the calculator two input channels but **three** entrants into the single
`dispatch(input)` seam (`D-005` clause 3):

1. a mouse click → `click` listener → `dispatch`;
2. a `keydown` the adapter maps itself → `mapKey` → `dispatch`;
3. a `Tab`-focused calculator button that the **browser** activates on `Enter`/`Space` → the browser
   synthesizes a click → the same `click` listener → `dispatch`.

Entrant 3 is required, not incidental: AC-6 and OQ-3 say a keyboard-only user must keep standard
button activation, and `D-005` clause 3 forbids simulating it ourselves (`no button.click()`). The
adapter therefore does not *drive* entrant 3; it can only influence it **negatively** — by what the
`keydown` listener declines to handle (`script.js:89-103`, the early `return`) and by
`preventDefault()`, which suppresses the browser's default action.

That negative-lever shape has now produced two defects in two consecutive review cycles, both of the
same form *"we forgot to say no to the browser in case X"*:

- cycle 1 (`KEY-001-r1` F-1, `-arch1` F-1 → `D-011`): the synthesized activation click was
  indistinguishable from a mouse click, so the unconditional `blur()` stole a keyboard user's focus;
- cycle 2 (`KEY-001-r2` F-1): the synthesized activation repeats with the key, so a held `Enter` on a
  focused **digit** button rendered `7`, `77`, `777` — not idempotent, a plain contradiction of AC-6
  and AC-7.

Neither was found by reading the code; each was found when someone enumerated a combination nobody
had written down. The branch's case set is small and closed, and nothing states it.

The cycle-2 fix (`fc93ff7a`, 4 lines) is correct and is what this record documents:

```js
if ((event.key === 'Enter' || event.key === ' ') && isCalculatorButton(event.target)) {
  if (event.repeat) {
    event.preventDefault();
    return;
  }
  return;
}
```

## Decision (proposed)
1. **Native activation acts exactly once per physical press.** When a calculator button has focus and
   the browser would activate it, the adapter does not handle the key itself (entrant 3 stays the
   browser's), and suppresses **only** the browser's *repeat* re-activations, with
   `preventDefault()` on the repeated `keydown`. This is the rule for every focused-control
   activation the page may grow, not only today's buttons.
2. **This rule is deliberately key-agnostic and input-type-agnostic, and it is *not* the auto-repeat
   policy.** `allowsRepeat` (`D-005` clause 6) is a predicate on an input **descriptor**, so it
   governs the channel that builds descriptors — entrant 2, the document-level `keydown` path. "One
   activation per physical press" is a predicate on an **event and a browser default action**
   (`event.target`, focus, `preventDefault`), which clause 6 assigns to the adapter. They are two
   rules in two layers, not one rule applied twice. Concretely: a digit key held on the document
   repeats (OQ-4, correct); a held `Enter`/`Space` on a focused digit *button* does not, because that
   is one press of one button.
3. **The branch's case set is closed and is written here.** `{Enter, Space}` × `{repeat, non-repeat}`
   × `{target is a calculator button, target is anything else}`:

   | key | repeat | target | behavior | pinned by |
   |---|---|---|---|---|
   | `Enter` | no | calculator button | adapter returns; browser activates; one action | `keyboard.test.js` "a digit button reached by Tab and activated by Enter…", "the equals button … by Enter…" |
   | `Enter` | yes | calculator button | `preventDefault()`, return; no activation | `keyboard.test.js` "holding Enter on a Tab focused digit button performs the action once" |
   | `Space` | no | calculator button | adapter returns; browser activates; one action | `keyboard.test.js` "a digit button reached by Tab and activated by Space…", "…by Space evaluates exactly once" |
   | `Space` | yes | calculator button | `preventDefault()`, return; no activation | **unpinned** — `arch3` F-1 (a mutation narrowing the guard to `Enter` leaves the suite 47/47 green) |
   | `Enter`/`Space` | either | anything else | falls through to `mapKey`; `Enter` evaluates, `Space` is inert | AC-5 / AC-7 rows on `document.body`; the *focused non-calculator control* sub-case is a recorded `KEY-001-sec1` Nit |

   A future change inside this branch must keep this table true and extend it, rather than reason
   from one example.
4. **Scope qualification for AC-5 / OQ-2** (`arch3` F-2). OQ-2 reads "`preventDefault()` only for
   mapped keys with no Ctrl/Meta/Alt held; never for `Tab`", and AC-5 lists `Space` as unmapped. Rule
   1 means `preventDefault()` *can* fire for `Space` — an unmapped key — when the target is a focused
   calculator button and the event is a repeat. That is intended and is the narrow exception: OQ-2's
   clause governs keys that do **not** target a calculator button. AC-5's purpose (never steal a
   browser or OS shortcut) is unaffected — `Tab`, the modifier combinations and every unmapped key on
   the document remain untouched and pinned.

## Alternatives considered (rejected)
- **Gate the suppression on `allowsRepeat` (`D-012` as proposed).** Rejected — **factually refuted**,
  not out-voted. Measured at `fc93ff7a` with that gate substituted in memory: a held `Enter` on a
  focused digit button still renders `777` and the integration suite goes 46 pass / 1 fail. Digits
  are deliberately repeatable under OQ-4, so a descriptor-level policy cannot express "one press of
  one button"; applying it here would also cross the layer line clause 6 draws.
- **Narrow the guard to `Enter` only**, on the grounds that real browsers activate a button on
  `Space` *keyup* so `Space` cannot repeat-activate. Rejected for now: plausible but `UNVERIFIED`
  (RK-3, no browser), and the suite cannot see the difference (that mutation passes 47/47), so the
  narrowing would rest on an assumption with no oracle. Key-agnostic is the safer default. If the
  user's manual pass shows a browser disarming a pending `Space` activation when a repeat keydown is
  cancelled — the one way the current code could be wrong, producing zero actions instead of one —
  narrowing to `Enter` becomes a 1-line, evidence-backed change.
- **Take activation over entirely**: `preventDefault()` unconditionally on `Enter`/`Space` for a
  calculator button and dispatch from the keydown path. Structurally the cleanest — it collapses
  entrant 3 into entrant 2, so every policy applies uniformly and the negative-lever problem
  disappears. Rejected: it discards the browser's real activation semantics (`Enter` on keydown,
  `Space` on keyup, `:active` feedback, the event sequence assistive technology expects) that AC-6
  exists to preserve; it re-implements a default action the browser already performs correctly; its
  failure mode is silent divergence from every browser rather than a visible bug; and it is
  unverifiable here. ~10 lines of code but a full AC-6 re-review and a browser pass we cannot run,
  versus ~20 lines of tests and prose for the same safety. Recorded because it is the obvious idea
  and will be proposed again.
- **Leave the rationale in the code comment only** (the status quo). Rejected: the comment's only
  referent is `D-012`, a record whose headline is a rejection, so the next reader must reconstruct
  the argument from a refutation — the same situation that let the `Space` half ship unpinned.

## Consequences / residual risk
- Adopting this record requires **no code change and no new commit** to the product files: it
  documents shipped behavior at `fc93ff7a`. It does not affect the SHA-bound gate or review evidence.
- Open follow-ups it names, none blocking `KEY-001`: the unpinned held-`Space` cell (`arch3` F-1, one
  integration row ≈16 lines); the two missing matrix rows and one stale matrix note (`arch3` F-3);
  the manual-checklist line "hold `Space` on a `Tab`-focused button — it must act once, not zero
  times".
- `D-012`'s stated trigger is now moot: AC-7 no longer depends on the invariant that every
  non-repeatable input is idempotent in the state that follows it, so the common next feature
  "repeated `=` re-applies the last operation" carries no hidden trap on the native-activation
  channel.
- Residual: every statement about real-browser activation semantics here is `UNVERIFIED` (RK-3) and
  rests on `tests/helpers/dom-stub.js`'s deliberate approximation, which models activation on
  keydown for both keys. The manual pass is where that gets closed.
- No effect on the zero-dependency, classic-script, no-build or `file://` constraints.
