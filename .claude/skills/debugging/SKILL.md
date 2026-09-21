---
name: debugging
description: How to diagnose failures scientifically — reproduce, isolate, hypothesize, verify — and classify the cause (implementation, test, test-design, environment, dependency, tool, requirement, architecture). Use whenever a gate or test fails or behavior is unexpected.
---

# Debugging

Classification table and escalation counts: CLAUDE.md §10 and §6. Output template: `.agent/templates/diagnosis.md`.

## Procedure
1. **Capture** the exact failing command and its full output (use the `run-gate` result file `outputTail`). Do not paraphrase.
2. **Reproduce** deterministically; run it 3× to check flakiness. Minimize (single test, smallest input).
3. **What changed?** `git log --oneline`, `git diff base..head`, or `git bisect` between last-known-green and red. Prefer bisecting to guessing.
4. **Hypothesize** — list ≥2 candidate causes; for each state a prediction that would prove it wrong. Test the cheapest discriminating one first.
5. **Instrument in a scratch copy** (`git worktree add "$TMPDIR/dbg" <sha>`); never leave debug edits in the repo. Confirm `git status` is unchanged at the end.
6. **Root cause**: the mechanism with `file:line`, not the symptom. Ask "why?" until the answer is a defect, a wrong assumption, or an environmental fact.
7. **Classify** using the test↔AC check: read the failing test *and its AC*. Test asserts what the AC says and code differs → implementation. Test contradicts the AC or setup is wrong → test. AC uncovered/weak → test-design. Same code passes elsewhere / tool errors → environment/tool. Prior unit's contract broken → dependency.
8. **Recommend** owner + minimal fix + the test that must go green + a regression test that would have caught it.

## Common traps in this stack
Global/module state leaking between tests; test-order dependence; floating-point (`0.1+0.2`, rounding at 1e10); string vs number (`'0'` handling, `-` vs `−`); DOM stub differing from browser behavior; Windows path/quoting in gate commands; run-gate "dirty" or SHA-stale evidence mistaken for test failure.

## Do not
Change code/tests "to see if it helps" in the repo; disable a failing test; retry until green; accept "works on rerun" as a fix.
