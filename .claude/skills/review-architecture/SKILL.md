---
name: review-architecture
description: How to assess structure, boundaries, coupling, testability seams and extensibility of a change against the existing architecture and project constraints, and how to judge whether design is the cause of repeated failures. Use when acting as architecture-reviewer.
---

# Architecture review

Triggers and verdict states: CLAUDE.md §8, §6 (escalation). Decision records: `.agent/templates/decision.md`.

## Checklist
- **Constraints honored**: zero dependencies; classic scripts so `file://` works; no build step (D-001). A design that breaks these needs an explicit decision, not an accident.
- **Boundaries**: is logic separable from I/O? Is DOM access confined to a thin layer? Could core logic be tested without a DOM?
- **State**: hidden global/mutable state; who owns each piece; can state reach an impossible combination (e.g. `justCalculated` with `operator` set)? Prefer a single state object with explicit transitions.
- **Coupling/cohesion**: dependency direction, circular references, God functions, duplicated rules.
- **Testability seams**: can each behavior be driven and observed deterministically?
- **Extensibility vs YAGNI**: cost to add the *next likely* feature (e.g. parentheses, precedence, keyboard input, history) vs speculative abstraction now.
- **Consistency**: naming, patterns, error handling follow CLAUDE.md §4.
- **Migration/rollback cost** of the change.

## Escalation mode (third occurrence of a failure signature)
Read the diagnoses; decide which is the real blocker: requirement conflict, wrong decomposition, structural defect, or environment. Recommend one of: replan units, refactor unit first, change requirement (ask user), accept and document. State cost/benefit and alternatives rejected.

## Output
Verdict + structural findings (location, problem, recommendation, cost) + optional decision record. Avoid style nitpicks and rewrite proposals without a demonstrated need.
