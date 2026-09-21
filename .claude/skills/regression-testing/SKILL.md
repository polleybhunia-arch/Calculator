---
name: regression-testing
description: How to grow and maintain a cumulative regression suite that acts as the living specification of the product, including impact analysis and rules for intentional behavior change. Use when a change adds, alters or fixes behavior.
---

# Regression testing (cumulative)

Non-negotiable rules (never delete/loosen, decisions for changes, registry): CLAUDE.md §14. This is the method.

## Impact analysis (per change)
1. `git diff <base>..<head> --stat` and read the diff; list touched functions/elements/contracts.
2. For each, find behavior that depends on it (`Grep` callers, DOM ids, shared state) and the existing tests that cover it.
3. Classify each behavior: **unchanged** (must stay green), **intentionally changed** (expand test + decision), **new** (add tests), **at risk but untested** (add a characterization test *now*, before the change).
4. Record the regression-risk list in the matrix and handoff.

## Adding vs expanding
- New user-visible behavior → new integration/regression test(s).
- Changed behavior → modify the existing test's expectation **only** with a `kind: test-change` decision citing the requirement change; keep the old expectation in the decision text.
- Fixed defect → a regression test that fails on the pre-fix commit (prove it: run against the old commit in a scratch worktree, or write RED first).
- Historical behavior worth preserving (README promises, bug fixes) is pinned even if "obvious".

## Registry
Every regression test gets a row in `tests/regression/REGISTRY.md`: file::test, origin unit, behavior preserved. The suite should read as the product specification.

## Health
Fast and deterministic. A flaky test is a defect: quarantine only with a decision record (owner, fix unit), never delete or blind-retry. Regression suite runs in full at every gate 7; never a subset "for speed".

## Output
Regression-risk list, tests added/changed (with reason), registry diff, run-gate evidence paths.
