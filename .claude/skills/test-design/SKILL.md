---
name: test-design
description: How to design unit-level test suites from acceptance criteria — categories, techniques, assertion quality and the AC → Test Case → Expected Result matrix. Use when writing or checking a unit's test matrix.
---

# Unit-test design

Template: `.agent/templates/matrix.md`. Rules: every AC maps to ≥1 test (CLAUDE.md §11 gate 2).

## Categories to consider for every unit
happy path · boundary · invalid input · error condition · edge case · security-sensitive · state transition/sequence · failure/recovery. Omit one only with a stated reason in "Not covered".

## Techniques
- **Equivalence partitioning + boundary values**: one test per class; values at, just inside, just outside each boundary (0, −0, 1, max digits, empty).
- **State-transition / sequence tests**: behavior often depends on history. Enumerate sequences (`operator, operator`, `= then digit`, `= then operator`, `DEL after Error`).
- **Decision tables** for multi-condition rules.
- **Error guessing**: numeric traps (floating point, `-0`, `NaN`/`Infinity`, very long input), repeated actions, reset paths.
- **Property/invariant checks** where an oracle is otherwise hard (e.g. `a+b === b+a` within rounding).

## Assertion quality
- The **oracle is independent** of the implementation (hand-computed value from the AC/README), never recomputed with the code under test.
- Assert specific values/text, not truthiness. Assert the *observable*, not internals.
- Each test fails if its behavior is removed (ask: "what one-line change would this test miss?").
- One behavior per test; name states the behavior; no shared mutable state between tests; deterministic (no time/random without control).
- Mock only true external boundaries; never mock the unit under test.

## Matrix output
`AC → Test case → Layer → Category → Input/setup → Expected result`. Add: not-covered list with residual risk; regression impact (existing tests at risk / to expand); adequacy checklist ticked honestly.

## Illustration (this repo)
AC "chained operations evaluate left to right": tests `4+8+9=`→`21`; `2+3×4=`→`20` (left-to-right, not precedence); operator swap `4+×2=`→`8`; `0.1+0.2=`→`0.3`; `5÷0=`→`Error`; digit after `Error` starts fresh.
