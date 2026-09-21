---
name: tdd
description: How to execute Red-Green-Refactor with tool-recorded evidence, including characterization testing of legacy code and valid exemptions. Use when implementing or refactoring any unit.
---

# Test-driven development

Requirements (mandatory TDD, no weakening tests, test-change decisions) are CLAUDE.md §5 and §14. Phase evidence is recorded with `node .agent/tools/run-gate.mjs unit --unit <ID> --phase red|green|refactor`.

## RED
1. Write tests from the matrix rows for your layer. **Use each matrix test name verbatim as the test title** — the validator checks that every named test exists; a missing corner case fails the unit. Name by behavior. Assert specific values from the AC, not implementation details.
2. Run `--phase red`. **Read the output.** RED is valid only if the failure is an *assertion failure or missing-behavior error about the AC*. Import/syntax/typo/setup errors are not RED — fix the test until it fails for the right reason.
3. Write down in the handoff why each test fails and which AC it proves.

## GREEN
1. Write the **minimum** code that makes the tests pass (hard-code/"fake it" is allowed to get green, then triangulate with another test).
2. Run `--phase green`, then the broader gates (`regression`, `integration`) — nothing that passed before may fail.
3. Do not add behavior no test demands. If you think behavior is missing, add a test first (RED again).

## REFACTOR
1. With everything green: remove duplication, clarify names, extract functions, keep small steps.
2. Re-run after each step; finish with `--phase refactor`. No new behavior, no test edits.
3. Skip only with `tdd_refactor_skip: <reason>` in the handoff (orchestrator records it).

## Characterization testing (legacy code with no tests)
Goal: pin *current* behavior before changing it. Tests pass immediately, so RED is not available; instead: derive expected values from README and by running the real code, then run a **mutation probe** (break one line, confirm a test fails, restore) to prove tests bite. Mark the unit `tdd_exempt: characterization — <reason>`; the reviewer must confirm the probes.

## Valid `tdd_exempt` reasons
Docs-only; config with no logic; purely visual CSS with no testable oracle (state residual risk); characterization as above. "Trivial change" is **not** a valid reason.

## Prohibited
Writing implementation first; editing/loosening/skipping a test to get green (`.skip`, `.only`, weaker assertion); deleting a failing test; catching errors to hide failures; leaving debug code; unrelated changes in the same commit.

## When a test seems wrong
Stop. Compare it with its AC. If the test contradicts the AC or is incorrect, write a `kind: test-change` decision (old expectation, new expectation, why) and get it recorded before editing. If the AC is wrong, escalate to the orchestrator/planner.
