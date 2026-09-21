---
name: documentation
description: How to write and update README/docs/decision records so they are accurate, verified against code and tests, and minimal. Use when behavior, commands or structure change.
---

# Documentation

Convention summary: CLAUDE.md §4 (Docs). Docs describe what *exists and is tested*.

## Procedure
1. Diff the unit (`git diff base..head`); list user-visible behavior, developer commands, file structure, and constraints that changed.
2. Update only affected sections of README/docs; keep the existing voice and structure (feature list, running, files).
3. **Verify every claim**: run each documented command; for each behavior cite the test that proves it. Unverifiable → mark or omit; never document intent as fact.
4. Remove or fix statements the change made stale (search README for old behavior terms).
5. Record non-obvious *why* decisions as decision records (`.agent/templates/decision.md`), not in README.

## Style
Short declarative sentences; examples with real values (`4+8+9` → `21`); commands in fenced blocks; relative links; no marketing language; no duplicated content (link instead).

## Output
Files changed; claim → evidence table in the handoff; what was intentionally left undocumented.
