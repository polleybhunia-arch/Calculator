---
name: technical-planning
description: How to design a technical approach and decompose work into small, independently verifiable development units with dependencies, risks and required tests. Use when producing plan.md and unit specs.
---

# Technical planning and task decomposition

Unit fields, statuses and gates are defined in CLAUDE.md §9/§11 and `.agent/templates/unit.md`; this skill is the method.

## Procedure
1. **Inspect first**: structure (`Glob`), entry points, state management, existing tests and gate commands, decisions in `.agent/decisions/`. Note testability blockers (e.g. logic that cannot be imported by tests).
2. **Approach**: list 1–3 viable approaches with trade-offs against constraints (zero-dependency, `file://`, existing conventions). Pick one; record the reason (decision record if lasting).
3. **Risks**: regression surface, testability, unknowns, coupling. Each risk gets a mitigation or a spike unit.
4. **Decompose** into units using these rules:
   - A unit delivers one observable behavior slice (vertical), not a layer.
   - Independently verifiable: its ACs can be proven by its own tests.
   - Small: ≤ ~6 ACs, touches few files, reviewable in one sitting. Bigger → split.
   - Enablers first: if the code isn't testable, a bootstrap unit (characterization tests + seam) precedes features.
   - Order by dependency; minimize edges; graph must be acyclic. Declare `depends_on` explicitly.
5. **Per unit** (fill the template): objective, context, dependencies, `AC-n` list, required tests by layer (unit/integration/regression), relevant files, DoD additions, risks/open questions.
6. **Regression plan**: which existing behavior each unit could break; which existing tests will need expansion.
7. **Tier** the request (CLAUDE.md §7) with a one-line reason.

## plan.md contents
Goal · tier+reason · chosen approach + alternatives rejected · unit graph (ID → depends_on) · risk register · open questions (blocking ones marked) · model note.

## Self-check before returning
- Every unit has ≥1 testable AC and a defined test layer.
- No unit needs another unit's unmerged behavior except via `depends_on`.
- Nothing hides an unresolved ambiguity. Blocking questions are listed for the orchestrator to ask.
