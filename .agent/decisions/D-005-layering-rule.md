---
kind: decision
id: D-005
unit: BOOT-001
status: accepted
decided_by: user (accepted as written on 2026-09-21, answering the orchestrator's question); proposed by architecture-reviewer@claude-opus-5 during the BOOT-001 structural review at 28a19873
---

# D-005 — Layering rule: one pure core, one DOM adapter, one dispatch seam per input channel

## Context
`BOOT-001` created the boundary between `calculator-core.js` (pure state machine + display strings)
and `script.js` (DOM adapter). D-003 records the *API* of that boundary — names, the
`{ type, value }` descriptor, the dual export, the validation split. What it does not state as a
constraint is the *layering rule* the boundary depends on. Three units are queued against this
boundary (`CALC-001` edits core internals, `KEY-001` adds a second input channel, `KEY-002` adds
presentation feedback), and the cheap wrong move in each of them is well known: let the new channel
reach into the DOM for state, synthesize `button.click()`, or copy the input vocabulary a third
time. `plan.md` already rejects the synthesized-click variant for `KEY-001`; that rejection should
apply to every future channel, not just this one.

Written as a constraint now, this costs nothing and is checkable in review. Discovered later by
reading code, it costs a rework of whichever unit broke it.

## Decision
The following hold for every unit that touches the shipped files, until a superseding record:

1. **The core is pure.** `calculator-core.js` may not reference `document`, `window`, `event`, any
   timer, storage or network API, and may not read or write a global other than the single
   namespace it exports. It receives input descriptors and returns state and strings. It must keep
   loading and running in a Node process where `document` and `window` are `undefined`.
2. **One mutable binding.** The entire application holds calculator state in exactly one
   closure-private binding in the adapter (`let state` in `script.js`). No module-level mutable
   state in the core, no calculator state on `globalThis`, no second copy derived from the DOM
   (the rendered text is output, never a source of truth).
3. **One dispatch seam per channel.** Every input channel — clicks today, keys in `KEY-001`,
   anything later — converts its raw event into an input descriptor and calls the single
   `dispatch(input)`. A channel may not call core transitions directly, may not write the display
   itself, and may not simulate another channel (no `button.click()` for a key press).
4. **Validation split (restates D-003, kept here so it survives with the rule).** The adapter is
   the boundary: unrecognized *raw* input (a click on a gap, a `data-*` outside the allowed set, an
   unmapped key) is ignored silently — no state change, no display write, no exception. The core
   throws a `TypeError` on a malformed *descriptor*, because that is a programming error, not user
   input.
5. **The input vocabulary is copied at most twice.** It exists today in the core and in the DOM
   adapter, deliberately (D-003). **At the third consumer — the `KEY-001` key map — the core must
   export it once** (e.g. `INPUT_VALUES` or `isInput(descriptor)`) and all adapters must use that
   export. No unit may add a third hand-maintained copy of the digit/operator/action sets.
6. **Channel-agnostic policy is pure.** Any rule expressible on the descriptor alone belongs in the
   core, so it is unit-testable without a DOM — including `KEY-001`'s auto-repeat policy (which
   input types may repeat). Only genuinely DOM-level concerns (`event.target`, focus,
   `preventDefault`, modifier keys) stay in the adapter.
7. **Presentation may not read core state.** `KEY-002`-style feedback keys off the descriptor or
   the rendered output, never off the internal state record, which stays opaque to callers.

## Alternatives considered
- **Leave it implicit in D-003 and rely on review.** Rejected: D-003 is written as an
  implementation record of one unit ("`KEY-001` *should* call `dispatch`", "revisit if…"), so a
  later unit can comply with its API and still break the layering. Cost of this record: one file.
- **A stricter rule: the core also owns key mapping, focus and `preventDefault` policy.** Rejected:
  those depend on real event objects, so forcing them into the core would either drag DOM types
  into a pure module or produce a fake event shape that proves nothing. Benefit of the looser line:
  the pure part stays 100% testable, the untestable part stays small and explicitly `UNVERIFIED`.
- **Enforce immutability with `Object.freeze` in `createState`/`applyInput`.** Deferred, not
  rejected: the review's deep-freeze probe (90,082 transitions, zero failures at `28a19873`) shows
  the code is already compatible, so this can be adopted later at near-zero cost if `CALC-001` or
  `KEY-001` make the convention harder to hold. Cost today: a small runtime overhead and noisier
  stacks for no behavior an AC demands.
- **Replace the seven-field state record with a tagged union** (`typing`/`awaiting-operand`/
  `result`/`error`) so impossible combinations cannot be represented. Rejected for now: it would
  rewrite every transition and its tests for a class of bug that is currently unreachable (probed:
  no `justCalculated` with a pending operator, no live negative operand). Revisit only if a fourth
  mode appears.
- **ES modules with real `import`/`export` to make the layering compiler-enforced.** Rejected:
  breaks `file://` (D-001, README Option 1).

## Consequences / residual risk
- `CALC-001` stays inside the core's operator/equals transitions; it must preserve the invariant
  that `resetOnNextInput && !justCalculated` implies a non-empty `history`.
- `KEY-001` must add its key map as a pure core entry point (AC-1 of `BOOT-001` already allows
  "at least three") and must trigger clause 5 — exporting the shared vocabulary — rather than
  adding a third table in `script.js`.
- The rule is not machine-enforced. Its checkable proxies are the existing AC-7 static scans, the
  core's Node-only unit suite (which fails if the core ever touches the DOM), and review.
- Residual: nothing here protects against a unit adding an inline handler or inline `<script>` to
  `index.html`; see finding F-1 of `.agent/reviews/BOOT-001-arch1.md` (extend the source-safety
  scan to the markup).
