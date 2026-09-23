---
kind: decision
id: D-011
unit: KEY-001
status: accepted
decided_by: user, 2026-09-22 (chose Option A); proposed by architecture-reviewer@claude-opus-5 during the KEY-001 structural review at ab4b5d1d
---

# D-011 — Focus policy is a function of the activating channel, not of the click event alone

## Context
`KEY-001` adds the keyboard channel. Two things now compete for the browser's focus:

- a **mouse click** focuses the button it hits, so a following `Enter` would natively re-activate
  that button instead of evaluating (the defect the user caught in OQ-3);
- a **`Tab`-reached button** must keep its native `Enter`/`Space` activation, and must keep focus
  afterwards, or the keyboard-only user restarts the focus order from the top of the document after
  every single press.

The user's OQ-3 resolution (`.agent/units/KEY-001.md`) is explicit: `element.blur()` in the click
handler, **mouse-initiated clicks only** — "a `Tab`-then-`Enter`/`Space` activation is unaffected
and keeps native behavior". `script.js:76` at `ab4b5d1d` blurs on *every* click, including the click
a browser synthesizes for native activation. Verified in the existing stub: after
`button.focus()` + `keydown{key:'Enter'}` the display is correct (`7`, exactly one action, AC-6's
count clause) but `document.activeElement` is `null`. In a real browser focus then falls to
`<body>`, so the very next identical `Enter` means *equals* rather than *press this button again*.

The reason given for the simplification is that the DOM stub exposes no signal distinguishing a
real click from a synthesized activation click. That is true of the stub as written — and it is the
wrong direction of dependency: a test double's fidelity gap is being paid for in shipped behavior,
in the one unit whose purpose is keyboard usability. The stub is ours and cheap to extend; the
browser already carries the signal.

## Decision — Option A chosen by the user, 2026-09-22
**Rule (applies to every present and future input channel, whichever option is chosen):** when the
adapter changes focus, it must do so as a function of *which channel initiated the activation*, and
that origin must be read from the event, never inferred from adapter-held state. Concretely, pick
one:

**Option A — read `event.detail` (recommended).**
- `script.js`: `if (event.detail > 0) { event.target.blur(); }` — a pointer click reports a click
  count ≥ 1; a keyboard-synthesized activation (and a programmatic `.click()`) reports `0`.
- `tests/helpers/dom-stub.js`: `page.click()` sends `detail: 1`; the native-activation click in
  `Node.dispatchEvent` sends `detail: 0`.
- one integration row: after a `Tab`-focused native activation `document.activeElement` is still
  the button; after a mouse click it is `null`.
- Cost ≈ 8 lines across three files, no new boundary, no new state. Benefit: the recorded OQ-3
  behavior is restored and pinned by a test. Residual: real-browser `detail` semantics stay
  `UNVERIFIED` (RK-3, manual pass), but the failure mode if a browser disagreed is the *current*
  behavior, not a worse one.

**Option B — never let a pointer focus a button.**
- `buttons.addEventListener('mousedown', (event) => event.preventDefault());` so a click never moves
  focus at all, and no `blur()` and no origin test is needed anywhere.
- Cost: the stub's `page.click()` must dispatch `mousedown` first and honour `preventDefault()`
  before focusing — a change to the click primitive every `BOOT-001`/`CALC-001` integration row
  already uses, so it is the higher-risk edit despite being the cleaner production code.
  Benefit: focus becomes structurally impossible to steal with the mouse; one fewer branch in the
  click handler.

**Option C — accept the unconditional `blur()` as a simplification.**
- No code change. Requires: a user decision superseding OQ-3's "mouse-initiated clicks only", a
  README note that activating a button with `Enter`/`Space` after `Tab` drops focus, an entry in
  `KEY-001`'s Known Issues, and the manual-browser check listed as residual risk.
- Cost: keyboard-only users lose the focus order after every button press and the same physical
  `Enter` changes meaning between the first and second press. Benefit: zero code risk, zero new
  test-double behavior.

## Alternatives considered (rejected)
- **Track the last pointer event in an adapter variable** (`let lastPointerDown`) and blur only if a
  pointer event preceded the click. Rejected: it adds a second mutable binding to the adapter, which
  `D-005` clause 2 exists to prevent, and it re-derives from history what the event already states.
- **`event.pointerType` / a `pointerdown` listener.** Equivalent information, but it requires
  modelling a second event type in the stub and ordering it against `click`; `detail` is one number
  on the event the handler already receives.
- **Move focus policy into the core** so it is unit-testable. Rejected for the reason `D-005`
  already gave for key mapping: focus is a genuinely DOM-level concern, and faking it in the core
  would prove nothing.
- **Leave production as is and assert the focus loss in a test** ("pin the current behavior").
  Rejected: it would freeze a behavior that contradicts a recorded user decision, and pinning is not
  deciding.

## Consequences / residual risk
- Whichever option is chosen, the rule above is the lasting part: focus/blur decisions key off the
  activating channel as reported by the event. A future touch or paste channel inherits it.
- Option A or B closes finding F-1 of `.agent/reviews/KEY-001-arch1.md`; option C closes it only
  together with the README, Known Issues and `UNVERIFIED` entries named there.
- Any of the three requires a new commit, so the SHA-bound gate and review evidence for `KEY-001`
  must be re-run from gate 4 on the new head (CLAUDE.md §11).
- No option affects the zero-dependency, classic-script or `file://` constraints.
