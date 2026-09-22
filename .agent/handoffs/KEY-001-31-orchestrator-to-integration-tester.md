---
unit: KEY-001
from: orchestrator
to: integration-tester
sequence: 31
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-31: orchestrator → integration-tester

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). integration-tester is a Sonnet agent (no fallback); attest your own model.

## Context
Cycle-3 code review (`.agent/reviews/KEY-001-r3.md`, F-1 and F-2, both Major) found that the current shipped code in `script.js` (unconditional `event.repeat` guard on native button activation) is **already behaviorally correct**, but two of its guarantees are not pinned by any test — a narrower, wrong implementation would still pass the full suite. The orchestrator independently reproduced both as test gaps, not behavior bugs: no product code change is needed, only two new tests.

`.agent/decisions/D-013-native-activation-is-the-browser-channel.md` (accepted) documents the closed case-set table this branch must satisfy; read it, it states exactly which cell each new test pins.

**F-1**: narrowing the guard to `if (event.repeat && event.key === 'Enter')` leaves the whole suite green while a held `Space` on a Tab-focused digit button renders `777` instead of `7`.

**F-2**: narrowing the guard to digit buttons only (the shape the rejected `D-012` proposed) leaves the suite green while a held `Enter` on a focused operator or equals button fires 3 dispatches instead of 1 — invisible to a display-only assertion because an operator-swap and a repeated `=` are both idempotent, which is exactly why the existing suite already has a `spyOnDispatches` oracle.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-6, AC-7 — both already SATISFIED in behavior; this dispatch makes them SATISFIED and provably so.

## Relevant files
- `tests/integration/keyboard.test.js` — add exactly two new named tests (do not edit any existing test)
- `.agent/reviews/KEY-001-r3.md` findings F-1, F-2 (exact reproduction steps and required test shape)
- `.agent/decisions/D-013-native-activation-is-the-browser-channel.md` (the case-set table)
- `script.js` — read only, no change expected or permitted in this dispatch

## Tests created / executed
none yet

## Results
n/a

## Decisions made
D-013 (accepted). You are not choosing a fix, only pinning existing correct behavior with tests.

## Known risks
- Do not touch `script.js` or any other file. If you find the current behavior does not actually match what F-1/F-2 describe, stop and report — do not "fix" anything.
- F-2's oracle must be the dispatch-count spy (`spyOnDispatches`, already used elsewhere in this file for the equals/operator repeat rows) — a display-only assertion cannot catch the D-012-shaped mutation, by design.

## Outstanding issues
none

## Required next action
1. Write test `"holding Space on a Tab focused digit button performs the action once"` (F-1's exact spec: `page.buttonFor('7').focus()`, dispatch `{key:' ', repeat:false}` then two `{key:' ', repeat:true}`, assert display `('', '7')`).
2. Write test `"holding Enter on a Tab focused operator button performs the action once"` (F-2's spec: type `9`, focus the `+` button, dispatch `{key:'Enter',repeat:false}` then two `{key:'Enter',repeat:true}` using `spyOnDispatches`, assert the dispatch count rose by exactly 1 and the display stays `9+`).
3. Confirm both pass on the current (unmodified) `script.js`. Run `node .agent/tools/run-gate.mjs integration --unit KEY-001 --phase final` (expect 49 tests, 49 pass) and `regression --unit KEY-001 --phase final` (expect 25, unchanged) and `unit --unit KEY-001 --phase final` (83, unchanged) and `lint --unit KEY-001` (PASS). Commit code, then evidence.
4. Prove each new test is genuinely discriminating with an in-memory-only mutation matching the review's M10/M11 (nothing on disk changed): confirm F-1's test fails if narrowed to `event.key === 'Enter'` only, and F-2's test fails if narrowed to digit-button-only.

Return `.agent/handoffs/KEY-001-32-integration-tester-to-orchestrator.md` (template `.agent/templates/handoff.md`): commit SHA(s), run-gate evidence paths with one-line facts, confirmation both new tests are genuinely discriminating, everything `UNVERIFIED`. Reply with its path plus ≤5 lines. Do not return until all four gates pass and `node .agent/tools/validate.mjs state` exits 0.
