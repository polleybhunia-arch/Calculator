---
name: integration-testing
description: How to design and write integration tests that validate realistic workflows across component boundaries without duplicating unit tests. Use when a unit introduces or changes interactions between components, layers or external systems.
---

# Integration testing

Gates 6–7 and ordering: CLAUDE.md §11. Regression growth: `regression-testing` skill. Backend/data layers: `api-testing`, `database-testing`.

## What qualifies
A test is integration only if it crosses a boundary a unit test cannot: UI event → logic → rendered output; multiple modules wired for real; file/markup contract between artifacts; process/network/DB. If it could be a unit test with a stub, make it a unit test.

## Procedure
1. Take integration rows from the matrix; identify the boundary and the real components on each side.
2. Model a **realistic workflow** (user journey) as one test with meaningful intermediate assertions.
3. Use real collaborators; fake only what is out of process/uncontrollable (network, clock). State every fake and what risk it leaves.
4. RED first (the feature isn't wired yet), then green with the implementation.
5. Keep deterministic: fresh state per test, no ordering dependence, no sleeps.

## This repo's boundaries
- **HTML ↔ script contract**: every element id/`data-*` attribute that `script.js` queries must exist in `index.html`, and every button in `index.html` must be handled. Parse `index.html` and check against the script's lookups.
- **Click → state → display**: load unmodified `script.js` with a minimal DOM stub (`tests/helpers/`, via `node:vm`), dispatch button clicks like a user, assert the two display lines. Journeys: type-and-evaluate, chain, continue from result, clear/delete, error recovery.
- **Load compatibility**: page still works as classic scripts (no module syntax) so `file://` works.
- Gap to record honestly: no real browser → layout/CSS/real events are `UNVERIFIED`.

## Output quality bar
Each test states the workflow in its name; failure message identifies which boundary broke; test list in the handoff maps to ACs and to regression registry entries.
