---
name: requirements-analysis
description: How to turn a vague request into unambiguous, testable requirements and acceptance criteria. Use when a user request must be understood, clarified, or converted into AC-n statements before planning.
---

# Requirements analysis

Common rules (gates, AC discipline, ASK-before-guess) live in CLAUDE.md §5–§6; this skill is the *method*.

## Procedure
1. **Restate** the requested outcome in one sentence, in user-observable terms. If you cannot, that is your first open question.
2. **Establish the baseline**: read README and existing tests. Existing documented behavior is an implicit requirement — list which parts the request touches and must preserve.
3. **Extract**: explicit requirements; implicit ones (baseline, conventions, `file://` compatibility); non-functional (performance, accessibility, security, compatibility); explicit out-of-scope.
4. **Hunt ambiguity** — for each requirement ask: what are the inputs/boundaries? what on invalid input? what on repeated/sequenced actions? what state does it depend on? what does the user *see*? Quantities without numbers ("fast", "many") and undefined terms are ambiguities.
5. **Resolve or escalate**: resolve only from evidence (README, code, tests). Anything else is an **open question with owner = user**; never pick a default silently. Propose a default *with* the question so the user can answer quickly.
6. **Write ACs** (below) and check each for testability.

## Acceptance criteria format
`AC-n: Given <state>, when <action>, then <observable result>`
- One behavior per AC; observable outcome (display text, returned value, thrown error, persisted state) — never "works", "handles", "properly".
- Concrete values where they define the behavior (`4+8+9=` → `21`).
- IDs are stable: never renumber; retire with a note.
- Cover: happy path, boundaries, invalid input, error behavior, sequencing/state, and preserved baseline behavior.

## Testability check (per AC)
Can an automated test fail if this is unimplemented? What is the oracle (independent expected value)? Is setup deterministic? If not → rewrite or escalate.

## Output
A requirements table (`ID | statement | source: user/README/test | priority`), the AC list, out-of-scope list, and open questions. Hand these to `technical-planning`.
