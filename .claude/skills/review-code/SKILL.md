---
name: review-code
description: How to perform an independent, adversarial review of a completed unit — requirement satisfaction, test adequacy, regression and convention checks, mutation probing, severity and verdict rules. Use when acting as the reviewer for a unit at a specific commit.
---

# Code review (independent)

Model independence, verdict states and cycles: CLAUDE.md §8, §10, §11. Output: `.agent/templates/review.md`.

## Order of work (requirement first, code last)
1. Read the **requirement, plan, ACs** and matrix *before* the diff. Form your own expectation of what correct looks like.
2. Establish scope: `git rev-parse HEAD` must equal `head_ref`; `git diff base_ref..head_ref --stat`; tree clean.
3. Read the **tests** before the implementation: do they pin the ACs? would each fail if the behavior were missing?
4. Read the implementation and its surroundings (callers, shared state, DOM contract).
5. **Run the gates yourself** (`run-gate` for unit/integration/regression/lint). Compare with claimed results; discrepancies are findings.
6. **Mutation probe** (in a scratch worktree, never the repo): `git worktree add "$TMPDIR/probe" <head>`; apply 3–5 realistic mutations (flip operator, off-by-one boundary, remove a guard, drop an error branch, swap operand order); run the unit command; each mutation **must** turn a test red. Surviving mutants = missing/weak tests → findings. Remove the worktree after.

## Questions you must answer (each with evidence)
1. Does the implementation satisfy every AC? (per-AC verdict) 2. Do the tests meaningfully validate behavior? 3. Which important edge cases are missing? 4. Could existing functionality be broken? (list checked behaviors) 5. Repository conventions followed? 6. Unnecessary complexity? 7. Security or performance risks?

## False-confidence signals
Tests that recompute expected values with the code under test; assertions on truthiness; happy-path-only; mocks of the thing under test; tests added after the code with no RED evidence; edited/deleted pre-existing tests without a decision; coverage without oracles; TODOs standing in for behavior; behavior in README not covered.

## Findings
`ID · Severity · file:line · problem · required change`. Critical = incorrect/unsafe; Major = AC unmet, AC without test, regression risk; Minor; Nit. No vague feedback: say exactly what to change and what test should demonstrate it.

## Verdict rules
APPROVED only if: every AC `SATISFIED` with evidence, no open Critical/Major, gates re-run green on this SHA, mutation probes killed. CHANGES_REQUIRED otherwise. BLOCKED if you cannot verify (wrong SHA, missing evidence, tools broken) — say what is missing. Bind the verdict to the reviewed SHA.
