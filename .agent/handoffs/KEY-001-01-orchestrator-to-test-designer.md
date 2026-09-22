---
unit: KEY-001
from: orchestrator
to: test-designer
sequence: 01
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff KEY-001-01: orchestrator → test-designer

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). test-designer is a Sonnet agent (no fallback); attest your own model.

## Context
Gate 2 (TEST DESIGN) for `KEY-001` (keyboard input drives the calculator). Both dependencies are `COMPLETE`: `BOOT-001` (extracted `calculator-core.js`) and `CALC-001` (mid-chain divide-by-zero fix). Spec: `.agent/units/KEY-001.md` — **read it in full**; AC-6 and OQ-3 were rewritten today by the user (2026-09-21) after a defect was caught in the originally proposed policy. Do not use any earlier version from memory.

Current tree (branch to be created from `main`'s scaffold commit plus the two completed unit branches — the orchestrator handles branch setup, not you): `calculator-core.js` exports `createState`, `applyInput`, `render` (`.agent/decisions/D-003-core-api.md`); input descriptor `{ type: 'number'|'operator'|'action', value }`; operators `+ - * /`; actions `clear`/`delete`/`equals`. `script.js` is the DOM layer with one `dispatch(input)` entry point and `inputFromElement()` for clicks. `tests/helpers/dom-stub.js` has `loadPage()` and `press(tokens)`.

**Binding design rule**: `.agent/decisions/D-005-layering-rule.md` (accepted). In particular: clause 3, every channel (clicks, now keys) converts its raw event into an input descriptor and calls the single `dispatch(input)` — no `button.click()` simulation; clause 5, this is the **third consumer** of the input vocabulary (core, `script.js`, now the key map), so the core must **export it once** and both adapters must use that export, not add a third hand-maintained table; clause 6, channel-agnostic policy (which input types may repeat) belongs in the core as a pure function, testable without a DOM; clause 7 is not relevant here (no presentation unit in this dispatch).

**Carried-forward items from the BOOT-001 reviews**, listed in `.agent/units/KEY-001.md` under "Carried forward from the BOOT-001 reviews" (7 items, user-approved 2026-09-21 to fix here rather than re-review `BOOT-001`). Summary: (1) untested `data-operator`/`data-action` boundary filters in `script.js`; (2) the AC-7 static scan never applies its code patterns to `index.html`; (3) `stripComments` in `tests/helpers/source-scan.js` mis-parses a regex literal containing `//`; (4) export the input vocabulary once (also D-005 clause 5, above); (5) `CALC_STUB_TRANSFORM` is not recorded in gate evidence (decide whether to address or record as still-open — a `run-gate.mjs` change is a human-only decision, so at most flag it); (6) optional hardening, no obligation; (7) extract the duplicated unit-test helpers `toInput`/`press`/`expectDisplay` into a **new** `tests/helpers/core-input.js`. Design matrix rows for (1), (2), (3), (4) and (7); each row's AC column must be one of AC-1…AC-8 (the validator requires an exact `AC-n` match) — attach each to the AC it best fits and say why in a note, the way the BOOT-001 test-designer did for its extra malformed-input test. Item (5) is a note for the orchestrator, not a row. Item (6) is optional; include it only if it fits naturally.

**File-placement rule** (same reasoning as `BOOT-001`/`CALC-001`, see `.agent/units/BOOT-001.matrix.md` "Why new files" and `.agent/units/CALC-001.matrix.md` "Why new files"): `validate.mjs state` requires a `kind: test-change` decision for any modification of a pre-existing test file. Prefer new files for new tests (for example `tests/unit/key-map.test.js`, `tests/integration/keyboard.test.js`, `tests/regression/keyboard-and-click-parity.test.js`, matching the unit's "Required Tests" section). **Exception**: items (2) and (3) above are fixes to existing BOOT-001 files (`tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js`) that the user already approved carrying into this unit — design them as modifications of those two files (not new files), and say in the matrix that the orchestrator will write the `kind: test-change` decision recording old versus new scan coverage. Do not modify any other existing test file or helper. `tests/regression/REGISTRY.md` gets new rows (origin `KEY-001`), append-only, as usual.

**AC-6, the Enter/Space policy (read carefully, it changed today)**: a mouse-click handler must call `element.blur()` on the clicked element (so a focused-then-`Enter` sequence is read as a key, not a repeat click); a button reached by `Tab` keeps native `Enter`/`Space` activation, and the key listener ignores `Enter`/`Space` whose `event.target` is a calculator button (so Tab-then-Enter still fires exactly once). Your stub-fidelity requirements must include: `document.activeElement` tracking, `element.blur()` support, a way to simulate reaching a button by `Tab` (activeElement set without a prior click) versus by click, and native `Enter`/`Space` activation of a focused `<button>` that the stub can suppress the same way a real browser's default action can be prevented.

**AC-7, auto-repeat**: `event.repeat`. Digits, `.`, `,` and `Backspace` act on every repeat; `Enter`, `=` and operators are ignored on repeat (state unchanged on the second and later `keydown` while held).

**AC-5, unmapped/modifier keys**: `event.key` values `a`, `F5`, `Tab`, `ArrowLeft`, `Space`, `Shift`, `` ` `` are unmapped; any of `ctrlKey`/`metaKey`/`altKey` true makes even a mapped key inert; `Shift` alone does not block (`Shift+=` still equals, `Shift+8` arrives as `*` per the browser's own key value); `preventDefault()` called exactly once for a mapped, modifier-free key and never otherwise, never for `Tab`.

Key map (OQ-1, user-confirmed): digits `0`-`9` plus numpad, `.` and numpad `.`, `,` as an alternate decimal point; `+ - * /`; `x`/`X` → `×`; `Enter` and `=` → equals; `Backspace` → DEL; `Escape` and `Delete` → AC. Not mapped: `:`, `c`/`C`.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 … AC-8 (AC-6 as rewritten today).

## Relevant files
- `.agent/units/KEY-001.md` (full, including "Carried forward" and the OQ-3 note), `.agent/units/BOOT-001.matrix.md` and `.agent/units/CALC-001.matrix.md` (format and glyph notation), `.agent/templates/matrix.md`
- `.agent/decisions/D-003-core-api.md`, `D-005-layering-rule.md`
- `calculator-core.js`, `script.js`, `index.html`, `README.md`, `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js` (read; items 2/3 modify the latter two)
- `.agent/reviews/BOOT-001-r1.md`, `-sec1.md`, `-arch1.md` for the exact carried-forward finding text if you need more detail than the unit file's summary

## Tests created / executed
none (design only)

## Results
n/a

## Decisions made
- File placement: new files for new keyboard tests; two existing files modified only for the carried-forward scan fixes, under a decision record the orchestrator writes.

## Known risks
- RK-2 (stub fidelity for AC-5/AC-6/AC-7): state exactly what the stub must model; anything it cannot is `UNVERIFIED`.
- RK-5 (over-broad `preventDefault()`).
- Mouse-click parity: every existing BOOT-001/CALC-001 click-path test must keep passing with the new `blur()` call added to the click handler — a blur has no visible effect unless a later key event follows, so this should not break anything, but call it out as a regression risk with a guard row if you judge one needed.

## Outstanding issues
none

## Required next action
Create `.agent/units/KEY-001.matrix.md` from `.agent/templates/matrix.md` (or the richer format `BOOT-001`/`CALC-001` used, with pre-fix/reference tables where useful — your judgment): every AC-1…AC-8 covered by named rows (happy, boundary, invalid, error, edge, security, state, recovery as applicable), plus rows for carried-forward items (1), (2), (3), (4), (7) each attached to a real AC with a note explaining the attachment, plus a mouse-click-parity guard row if warranted. State the TDD phase per row (RED-first for genuinely new behavior; note where an existing BOOT-001/CALC-001 test already guards something so it is not duplicated, the way `CALC-001`'s matrix used a "guard map" of existing tests for AC-5). List which file each row lives in, and confirm none of the untouchable files (`tests/unit/calculator-core.test.js`, `tests/unit/divide-by-zero.test.js`, `tests/integration/dom-click.test.js`, `tests/integration/divide-by-zero-click.test.js`, `tests/regression/readme-behavior.test.js`, `tests/regression/divide-by-zero.test.js`, `tests/helpers/dom-stub.js` structure) needs to change beyond what this handoff already names. Confirm `node .agent/tools/validate.mjs state` exits 0.

Then write `.agent/handoffs/KEY-001-02-test-designer-to-orchestrator.md` (template `.agent/templates/handoff.md`) and reply with its path plus ≤5 lines, naming any open question that needs the user before this unit can leave `PLANNED`.
