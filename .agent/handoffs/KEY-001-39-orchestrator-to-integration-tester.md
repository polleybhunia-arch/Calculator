---
unit: KEY-001
from: orchestrator
to: integration-tester
sequence: 39
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-39: orchestrator → integration-tester

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). integration-tester is a Sonnet agent (no fallback); attest your own model.

## Context
Cycle-4 code review (`.agent/reviews/KEY-001-r4.md`, F-1, Major) found: no test focuses an `AC` or `DEL` action button and holds a key, so three realistic mutants of `script.js`'s native-activation guard survive the whole suite undetected — dropping `data-action` from `isCalculatorButton`, skipping the branch for action buttons, and skipping the repeat guard for action buttons. The orchestrator independently reproduced that the **current shipped code already behaves correctly** for this case (held `Enter` on a focused `DEL` after `1 2 3` deletes exactly once, giving `12`; held `Enter` on a focused `AC` after `4+8` clears exactly once). **No product code change is needed or permitted** — this is a test-only pass, exactly like cycle 3.

`.agent/decisions/D-013-native-activation-is-the-browser-channel.md` (accepted, corrected in place by the orchestrator) now has an explicit row for this case in its table; your new test fills it.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-6, AC-7 — already SATISFIED in behavior; this makes it provably so for action buttons.

## Relevant files
- `tests/integration/keyboard.test.js` — add exactly one new named test (do not edit any existing test)
- `.agent/reviews/KEY-001-r4.md` finding F-1 (exact reproduction and required test shape)
- `.agent/decisions/D-013-native-activation-is-the-browser-channel.md` (the corrected case-set table)
- `script.js` — read only, no change expected or permitted

## Tests created / executed
none yet

## Results
n/a

## Decisions made
n/a — pinning existing correct behavior.

## Known risks
Do not touch `script.js` or any other file. If the current behavior does not match what F-1 describes, stop and report — do not "fix" anything.

## Outstanding issues
none

## Required next action
1. Write test `"the DEL button reached by Tab and activated by a held Enter deletes exactly once"` (F-1's exact spec: type `1 2 3`, `page.buttonFor('DEL').focus()`, dispatch `{key:'Enter',repeat:false}` then two `{key:'Enter',repeat:true}`, assert display `('', '12')` — one delete, not three).
2. Confirm it passes on the current (unmodified) `script.js`. Run all four gates (`unit`, `integration`, `regression`, `lint`) via `run-gate.mjs --phase final` (expect unit 83, integration 50, regression 25, lint PASS). Commit code, then evidence.
3. Prove the test is genuinely discriminating with the three in-memory-only mutations F-1 named (nothing on disk changed after): dropping `data-action` from `isCalculatorButton`'s check, skipping the Enter/Space-on-button branch for action buttons, and skipping the repeat guard for action buttons. Confirm the new test fails under each and nothing else does.

Return `.agent/handoffs/KEY-001-40-integration-tester-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHA(s), run-gate evidence paths with one-line facts, confirmation the new test is genuinely discriminating under all three mutations, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until all four gates pass and `node .agent/tools/validate.mjs state` exits 0.
