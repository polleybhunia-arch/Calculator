---
unit: KEY-001
from: orchestrator
to: documenter
sequence: 07
model_attested: claude-sonnet-5
state: TESTING
---

# Handoff KEY-001-07: orchestrator → documenter

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). documenter is a Sonnet agent (no fallback); attest your own model.

## Context
`KEY-001` implemented full keyboard input: the calculator can now be operated entirely from a physical keyboard, with the exact key map below (verified by the orchestrator against `calculator-core.js`'s `KEY_MAP`). Two regression tests are deliberately red until you edit `README.md` (D-010 sub-step 3). I re-ran the suites myself: unit 83/83, integration 46/46, regression 23/25 (only these two rows fail).

**The implemented key map** (source of truth: `calculator-core.js`): digits `0`-`9` and `.` type themselves; `,` is an alternate decimal point; `+ - * /` choose the matching operator; `x` and `X` also choose multiply; `Enter` and `=` evaluate; `Backspace` deletes the last character; `Escape` and `Delete` clear everything. A key held with `Ctrl`, `Meta` (Cmd) or `Alt` is ignored, so browser/OS shortcuts keep working; `Shift` alone never blocks a mapped key. Holding a digit, `.`, `,` or `Backspace` repeats its action; holding `Enter`, `=` or an operator does not repeat.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-8. Documentation only; state the key map exactly as implemented, and do not describe `KEY-002` (on-screen press feedback) — it was not built.

## Relevant files
- `README.md` — the only file to edit
- `calculator-core.js` (read only: `KEY_MAP`, the source of truth for the map), `tests/regression/keyboard-and-click-parity.test.js` (read only: the two failing tests, lines 169–209, are your exact oracle)
- `.claude/skills/documentation/SKILL.md`

## Tests created / executed
none (docs only)

## Results
n/a

## Decisions made
n/a

## Known risks
- The two tests check for literal substrings/patterns, not meaning — read them before writing (paths and line numbers above) so your wording satisfies them on the first try. In particular: `x`/`X` must appear within 40 characters of a word starting "multipl" (either order); `,` must appear within 40 characters of "decimal" (either order); each of `+ - * /` must literally appear somewhere in the keyboard section (or their display glyphs `− × ÷`); a "0 to 9" / "0-9" phrasing or the word "digit" must appear; the keyboard section itself is found by a heading or bullet matching `/keyboard/i`.
- Do not loosen or edit the test. If the exact wording is awkward, choose different phrasing that still contains the required tokens rather than asking to change the test (the `CALC-001` precedent).

## Outstanding issues
none

## Required next action
1. Add a keyboard section to `README.md` (a heading like `## Keyboard` or a clearly marked bullet block under an existing section — your call) documenting the full key map above, including the digit range, decimal point (`.` and `,`), all four operators (`+ - * /`, noting `x`/`X` as an alternate for multiply), `Enter`/`=` for equals, `Backspace` for delete, `Escape`/`Delete` for clear, and a one-line note that Ctrl/Cmd/Alt combinations and Tab are left alone. Verify the phrasing against the exact test assertions.
2. Add one bullet under the existing `## Features` section mentioning keyboard support (must match `/keyboard/i`).
3. Run `node --test tests/regression/keyboard-and-click-parity.test.js` and confirm both rows pass; run `node --test "tests/regression/**/*.test.js"` and confirm 25/25.
4. Commit with message `KEY-001: document keyboard input in the README` on the current branch (never push), tree clean afterwards.
5. Write `.agent/handoffs/KEY-001-08-documenter-to-orchestrator.md` (template `.agent/templates/handoff.md`) with the added text, what you verified, and the commit SHA, and reply with its path plus ≤5 lines.
