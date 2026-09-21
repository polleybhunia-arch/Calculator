---
unit: AREA-000
failure_signature: <gate>:<test name or error head>
classification: implementation | test | test-design | environment | dependency | tool | requirement | architecture
occurrence: 1
model_attested: claude-sonnet-5
---

# Diagnosis AREA-000-d1

## Symptom
Exact failing command, run-file path, message (quoted).

## Reproduction
Minimal steps/command that reproduces it deterministically (or "non-deterministic: …").

## Investigation
What was examined (files, git diff, logs) and what each observation ruled in/out.

## Root cause
The mechanism, with file:line evidence. Distinguish cause from symptom.

## Classification and why
Which class (CLAUDE.md §10) and the evidence that excludes the others (is the test wrong? the code? the environment?).

## Recommended fix
Owner agent + concrete minimal change + which test must go green. If classified `test`, cite the AC the test contradicts.

## Regression test to add
The test that would have caught this.

## Confidence / unknowns
