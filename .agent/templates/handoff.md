---
unit: AREA-000
from: orchestrator
to: implementer
sequence: 01
model_attested: claude-opus-5
state: READY
---

# Handoff AREA-000-01: orchestrator → implementer

## Context
What this recipient needs to know; link to unit file and plan. Facts only.

## Acceptance criteria
Copy of AC list (or reference `.agent/units/AREA-000.md`).

## Relevant files
- path — why

## Tests created / executed
- created: path
- executed: `.agent/test-results/AREA-000/latest-unit-red.json` (gate/phase, result)

## Results
Facts read from evidence files (exit, counts, head SHA). No claims without a path.

## Decisions made
- D-00N or inline, with reason

## Known risks
- …

## Outstanding issues
- …

## Required next action
Exactly one action, phrased so completion is checkable.

<!-- Rules: agent→orchestrator handoffs state `model_attested` from the agent's own runtime identity. Reviewer-bound handoffs MUST NOT contain the implementer's justification or "this is correct" narrative. -->
