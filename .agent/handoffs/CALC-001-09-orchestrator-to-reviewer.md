---
unit: CALC-001
from: orchestrator
to: reviewer
sequence: 09
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff CALC-001-09: orchestrator → reviewer

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given, and must not seek, the implementer's justification (handoff files `CALC-001-04`, `-06`, `-08` are off limits). Everything you need is in the repo and the paths below.

## Context
Independent code review of unit `CALC-001`, tier T1: a division by zero resolved by pressing an **operator** (rather than `=`) must show `Error` at once, exactly as `=` does, in the pure core `calculator-core.js`.

Verified by the orchestrator:
- `base_ref` = `bf27d9cc0718cab6cde9f08e271dcefa7b5db092` (the completed `BOOT-001` state), `head_ref` = `f9426e284219f49816abad088275d219c72bdd81`. `git rev-parse HEAD` equals `head_ref`. Branch `agent/CALC-001-midchain-divide-by-zero`.
- Product and test files are committed and clean. **`.agent/` has uncommitted working-tree changes on purpose** (unit file, your review file, evidence, dashboard): evidence is SHA-bound and `run-gate` excludes `.agent/` from its dirty check. Do not treat that as BLOCKED. Do **not** commit, stash, checkout, reset or otherwise change git state.
- Changed outside `.agent/` (`git diff --name-status --no-renames base_ref..head_ref -- . ':!.agent'`): `calculator-core.js` (M), `README.md` (M), `tests/regression/REGISTRY.md` (M), and three new test files `tests/unit/divide-by-zero.test.js`, `tests/integration/divide-by-zero-click.test.js`, `tests/regression/divide-by-zero.test.js`.
- Final gates on `head_ref`, machine evidence `.agent/test-results/CALC-001/latest-{unit,integration,regression,lint}-final.json`: unit 67/67, integration 22/22, regression 17/17, lint PASS. Phase evidence: `latest-unit-{red,green,refactor}.json`, `latest-{integration,regression}-red.json` and green/refactor equivalents where present.
- Stage order followed decision `.agent/decisions/D-006-calc001-stage-order.md`. `.agent/decisions/D-007-registry-rows-calc001.md` covers the only modified pre-existing test path (`tests/regression/REGISTRY.md`, append-only). `D-003` (core API) and `D-005` (layering rule, accepted) govern the design.
- The orchestrator judged security review not triggered (pure arithmetic guard; no new input surface, DOM or markup write, storage, network or dependency) and architecture review not triggered (T1, no new module boundary). Tell me if you disagree, with reasons.

## Acceptance criteria
`.agent/units/CALC-001.md` AC-1 … AC-6 and its Definition of Done. Matrix: `.agent/units/CALC-001.matrix.md` (21 new named rows, 21 existing guard tests mapped to AC-5, verification checks V-1 to V-4).

## Relevant files
- `git diff bf27d9c..HEAD -- calculator-core.js README.md tests`
- `.agent/units/CALC-001.md`, `.agent/units/CALC-001.matrix.md`, `.agent/units/BOOT-001.matrix.md` (BOOT-001 behavior it must not break), `CLAUDE.md` (§4, §5, §14)
- `git show bf27d9c:calculator-core.js` — the pre-fix core
- `script.js`, `index.html` (unchanged; the DOM layer)

## Tests created / executed
See evidence paths. Re-run the gates yourself.

## Results
n/a

## Decisions made
D-003, D-005, D-006, D-007. Judge them; do not assume them.

## Known risks
From the unit: RK-10 (RED is genuine only if the defect reproduced on the post-BOOT-001 core), RK-11 (the fix sits on the shared operator transition), RK-12 (`=` must still render exactly what it did), RK-14 (preserve the invariant that `resetOnNextInput && !justCalculated` implies a non-empty `history`; follow D-005).

## Outstanding issues
Real-browser rendering and `file://` loading cannot be run in this environment.

## Required next action
Adversarial review of `base_ref..head_ref`:
1. Re-run unit, integration and regression yourself and state the counts.
2. Judge AC-1 … AC-6 as SATISFIED / NOT_SATISFIED / UNVERIFIED with evidence. Confirm each named matrix row exists verbatim and would fail without the fix, that the RED evidence is genuine (assertion failures showing pre-fix values, not import or setup errors), and that AC-5 holds (no pre-existing test or helper modified; check with `git diff --name-status --no-renames base_ref..head_ref -- tests`; counts at least 67, 22, 17).
3. Independent behavior check with **no file changed on disk** (`git status` identical before and after; write nothing outside the repo): evaluate the pre-fix core (`git show bf27d9c:calculator-core.js`) and the fixed core side by side in memory over sequences you choose (exhaustive short sequences plus random longer ones) and classify every mismatch. The intended behavior change is only: an operator press that resolves a divide-by-zero. Report any other difference. Also probe the edge cases: `0 / 0 +`, a `0.0` and a `0.` divisor, continue-from-result then `/ 0 +`, repeated operators after the fixed state, `=` afterwards, and the invariant in RK-14.
4. Mutation probes with no change to disk (for example `CALC_STUB_TRANSFORM` for page-level suites, or an in-memory string replacement evaluated with `node:vm` for the core): show which named tests fail for each mutation of the fix.
5. Check the README bullet against the implemented behavior, the `REGISTRY.md` diff (append-only), conventions (CLAUDE.md §4), and that the change stays inside the core (D-005).

Write `.agent/reviews/CALC-001-r1.md` from `.agent/templates/review.md` (`reviewed_ref` = the exact 40-hex `head_ref`; per-AC lines in the exact machine-read format `- AC-n: VERDICT — evidence`). Write your return handoff to `.agent/handoffs/CALC-001-10-reviewer-to-orchestrator.md`. Reply with the verdict, the review path and at most 5 lines.
