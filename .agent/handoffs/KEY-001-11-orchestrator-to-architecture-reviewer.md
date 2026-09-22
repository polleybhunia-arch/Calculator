---
unit: KEY-001
from: orchestrator
to: architecture-reviewer
sequence: 11
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff KEY-001-11: orchestrator → architecture-reviewer

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given the implementer's or integration-tester's justification and must not seek it (handoff files `KEY-001-04`, `-06`, `-08` are off limits). `.agent/decisions/D-005` through `D-010` are design artifacts you are asked to judge, not proof of soundness.

## Context
Structural review of unit `KEY-001`, tier T2 (per CLAUDE.md §8, T2 alone requires this review — not conditioned on a new module boundary, and this unit does not create one; it adds a second input channel and a third and fourth entry point to the existing `calculator-core.js`/`script.js` boundary `BOOT-001` created and `D-005` (accepted) governs).

Verified by the orchestrator:
- `base_ref` = `f9426e284219f49816abad088275d219c72bdd81`, `head_ref` = `ab4b5d1d21dcdf8db587cab203f0d9d764ef0043`; `git rev-parse HEAD` equals `head_ref`. Product and test files committed and clean. **`.agent/` has uncommitted working-tree changes on purpose.** Do not treat that as BLOCKED. Do **not** commit, stash, checkout, reset or otherwise change git state.
- Machine evidence at `head_ref`: `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json` (unit 83/83, integration 46/46, regression 25/25, lint PASS).
- `.agent/decisions/D-005-layering-rule.md` (accepted during `BOOT-001`'s review) states 7 binding clauses for every future input channel: (1) core stays pure, (2) one mutable state binding in the adapter, (3) one `dispatch(input)` seam per channel, no synthesized clicks, (4) adapter filters raw input silently, core throws on malformed descriptors, (5) **the input vocabulary must be exported once from the core at the third consumer — explicitly named as this unit's key map** — and all adapters must use it, (6) channel-agnostic policy (e.g. auto-repeat) belongs in the core as a pure function, (7) presentation may not read core state (not applicable here, no presentation unit). This unit is the concrete test of clauses 3, 5 and 6.
- `.agent/decisions/D-003-core-api.md` gained an addendum for this unit: `mapKey(key, modifiers)`, `allowsRepeat(input)`, `isInput(input)`.
- Test architecture changes: `tests/helpers/dom-stub.js` extended with focus/blur/native-activation primitives (`D-008`); `tests/helpers/source-scan.js`/`tests/regression/source-safety.test.js` widened (`D-009`); new `tests/helpers/core-input.js` (shared unit-test helpers, closing a duplication `CALC-001`'s review flagged).
- **A residual design question flagged by the implementer**: `script.js`'s click handler calls `element.blur()` unconditionally for every click, mouse-initiated or native-keyboard-triggered, because the DOM stub gives no signal to distinguish the two. Judge whether this is an acceptable simplification or should be recorded as a limitation.

## Acceptance criteria
`.agent/units/KEY-001.md` AC-1 (vocabulary export as a boundary concept), AC-6 (the two-channel coordination), and its Definition of Done.

## Relevant files
- `calculator-core.js`, `script.js`, `index.html`
- `.agent/decisions/D-003` (with the addendum), `D-005`, `D-008`, `D-009`, `D-010`; `.agent/plan.md`
- `tests/helpers/*.js`, `tests/unit/key-map.test.js`, `tests/integration/keyboard.test.js`
- `git show base_ref:script.js`, `git show base_ref:calculator-core.js` — the pre-unit structure
- `.claude/skills/review-architecture/SKILL.md`

## Tests created / executed
Evidence paths above. Re-run the suites yourself.

## Results
n/a

## Decisions made
Assess `D-005` clauses 3, 5, 6 as applied here, and the `D-003` addendum. State agree, disagree or amend, with cost and benefit.

## Known risks
From `BOOT-001`'s architecture review (`.agent/reviews/BOOT-001-arch1.md`): F-2 (input vocabulary duplication, "condition for KEY-001: export it once") — this is the unit that must satisfy that condition; check that it actually does, not that it claims to. F-1 (AC-7 scan not covering `index.html`) is `KEY-001`'s to close per `D-009` — verify.

## Outstanding issues
none

## Required next action
Assess: whether the key map, repeat policy and vocabulary export are cleanly placed in the core with no DOM leakage (run the unit suite in a Node process with no `document`/`window`, as `BOOT-001`'s AC-1 requires, and confirm `key-map.test.js` does so); whether `script.js` truly has one `dispatch(input)` seam for both channels (no second display-write path); whether the exported vocabulary is genuinely used by both adapters (grep for any remaining hand-duplicated value list); coupling and duplication between the click and keyboard code paths in `script.js`; testability seams (the call-count spy technique the matrix and implementer used — is it a reasonable adaptation or a sign of a seam that should exist in production code instead); extensibility for `KEY-002` if it is ever built (clause 7: presentation must key off the descriptor or rendered output, never internal state — does the current structure support that without rework); whether `blur()`-on-every-click is a reasonable simplification. Give trade-offs and rejected alternatives with cost and benefit. Run your experiments **without changing any file on disk** (`git status` identical before and after; write nothing outside the repo).

Write `.agent/reviews/KEY-001-arch1.md` from `.agent/templates/review.md` (verdict `APPROVED` / `CHANGES_REQUIRED` / `BLOCKED`, `reviewed_ref` = the exact 40-hex `head_ref`, concrete structural findings). If a lasting design choice needs recording, propose it as `.agent/decisions/D-011-*.md` with `status: proposed`. Write your return handoff to `.agent/handoffs/KEY-001-14-architecture-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
