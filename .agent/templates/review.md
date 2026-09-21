---
unit: AREA-000
reviewer: reviewer
model_attested: claude-opus-5
reviewed_ref: <40-hex head_ref reviewed>
verdict: CHANGES_REQUIRED
cycle: 1
---

# Review AREA-000 r1 — verdict: CHANGES_REQUIRED

**Verdict** is one of `APPROVED`, `CHANGES_REQUIRED`, `BLOCKED`. `APPROVED` is impossible while any AC is not `SATISFIED` or any Critical/Major finding is open.

## Acceptance criteria verdicts
Format is machine-read — keep exactly `- AC-n: VERDICT — evidence`. VERDICT ∈ SATISFIED | NOT_SATISFIED | UNVERIFIED.
- AC-1: SATISFIED — test "…" fails when behavior removed (mutation probe: …)
- AC-2: UNVERIFIED — no test exercises …

## What I ran myself
Commands + results (gate run-file paths). Independent re-execution, not the implementer's output.

## Findings
| ID | Severity (Critical/Major/Minor/Nit) | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Major | script.js:42 | … | … |

## Assessments
- **Requirement satisfaction**:
- **Test adequacy / false confidence** (weak assertions, untested branches, mutation probes):
- **Edge cases missing**:
- **Regression risk** (existing behavior possibly broken; tests that should have been expanded):
- **Conventions & complexity**:
- **Security implications**:
- **Performance implications**:
- **Architecture fit**:

## Unverifiable
Things I could not verify, and why.
