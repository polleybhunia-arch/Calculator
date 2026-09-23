---
unit: PLAN
from: orchestrator
to: planner
sequence: 03
model_attested: claude-sonnet-5
state: PLANNED
---

# Handoff PLAN-03: orchestrator → planner

FALLBACK(opus->sonnet): orchestrator session runs on claude-sonnet-5 (announced to the user). Spawn on your declared model (no `model` parameter) and attest it.

## Context
Gate 2 for `BOOT-001` produced `.agent/units/BOOT-001.matrix.md` (84 rows, accepted) and surfaced defects in the planning artifacts. The user answered the resulting questions on 2026-09-21. Baseline commit `e02035b`; `script.js` unchanged since.

User decisions (authoritative, recorded verbatim in intent):
- **OQ-B1 — separate fix unit, do NOT pin the bug.** Verified by hand-trace and by the test-designer's probe run of the unmodified `script.js`: a divide-by-zero in the middle of a chain never shows `Error`. `5 / 0 +` displays `5÷0+` (expression line empty); a following `=` displays expression `5÷0+Error`, current `NaN`. It contradicts README ("Division-by-zero shows `Error`"). `BOOT-001` must remain behavior-preserving and its tests must not assert this wrong output. A new unit **`CALC-001`** fixes it, RED first. Proposed correct behavior for the user to have approved: `5 / 0 +` (and `*`, `-`, `/` in the operator position) shows current `Error` at once with expression line `5÷0`, exactly as `5 / 0 =` does today; the pressed operator is discarded; afterwards existing Error recovery applies unchanged (digit starts a new calculation; operator clears and gives `0+`; `AC`/`DEL` clear; `=` is ignored). Also cover a longer chain (`2 + 3 / 0 *`) and the case `0 / 0 +`. `CALC-001` runs **after BOOT-001 and before KEY-001**.
- **OQ-B2 / OQ-B3 — frozen as baseline.** `5 + =` → expression `5+5`, current `10` (held value reused as second operand). `DEL` right after an operator, after `=`, or on `Error` clears the whole calculation including the trail. Both are pinned by required rows already in the matrix.

Weak-AC findings from the test-designer (`.agent/handoffs/BOOT-001-02-test-designer-to-orchestrator.md`, section "AC ambiguities" and matrix section "AC notes for the planner") to resolve in `.agent/units/BOOT-001.md`. IDs are stable — never renumber:
1. **AC-1** does not name the core's entry points. Reword so it binds to the entry points defined in the API decision record the implementer must write (fresh state, apply input, render), without prescribing names.
2. **AC-4** states only current `Error`; the script also shows expression `5÷0` after `5 / 0 =`. State it (expression `5÷0`, current `Error`).
3. **New AC-8**: core-level edit, clear and equals edge behavior that appears in "Required Tests" but in no AC today: `AC` clears pending operator, trail and result; `DEL` removes the last typed character and leaves `0` when nothing remains; `DEL` after an operator, after `=` or on `Error` clears everything including the trail (OQ-B3); `=` with no pending operator changes nothing; `=` right after an operator reuses the held value (OQ-B2); a second `=` after a result changes nothing. The matrix already has rows for these (currently mapped to AC-2/AC-5); the test-designer will remap them once AC-8 exists.
4. **AC-6** "recorded expectations": state that the record is `.agent/units/BOOT-001.matrix.md`, confirmed against the unmodified `script.js` at `e02035b`, and that the mid-chain divide-by-zero path is deliberately excluded (see `CALC-001`).
5. **AC-7** scope: the three named files only (`index.html`, `script.js`, `calculator-core.js`), not the whole repo (the workflow tooling and tests would trip a repo-wide scan). Reword.

Already-recorded resolutions (do not re-ask): OQ-1…OQ-4 accepted defaults, OQ-6 yes, OQ-7 lint extension by the user before gate 8, RK-7 resolved (see `.agent/plan.md` "Resolutions").

## Acceptance criteria
You are writing them. Each must be testable, observable and unambiguous, with stable IDs.

## Relevant files
- `.agent/plan.md` — update unit graph (BOOT-001 → CALC-001 → KEY-001 → KEY-002), tier table, risk register (RK-1 residual now owned by CALC-001), and add resolutions for OQ-B1, OQ-B2, OQ-B3
- `.agent/units/BOOT-001.md` — AC amendments above; record OQ-B1/B2/B3 resolutions in Risks
- `.agent/units/KEY-001.md` — `depends_on` must include `CALC-001` (keep `BOOT-001`); check `.agent/tools/lib.mjs` / `validate.mjs` for the accepted `depends_on` syntax
- `.agent/units/CALC-001.md` — **new**, from `.agent/templates/unit.md`, status `PLANNED`, tier your judgment (a bug fix in the pure core plus a click-path regression; state whether a security review is triggered), `depends_on: BOOT-001`. Required Tests must include: a unit test that fails on the post-BOOT-001 core, an integration/regression test through the DOM stub, and a note that the RED run is genuine only if the bug survives the BOOT-001 extraction (if the extraction happens to fix it, say how that is logged rather than claiming a false RED)
- `.agent/units/BOOT-001.matrix.md` — read only; the test-designer owns it
- `script.js`, `README.md` — behavior reference
- `CLAUDE.md` §5, §6, §14 (every fixed defect gets a regression test that fails without the fix)

## Tests created / executed
none (planning only)

## Results
`node .agent/tools/validate.mjs state` = OK before this dispatch.

## Decisions made
- Bug fix is a separate unit; BOOT-001 stays behavior-preserving (user, OQ-B1).
- KEY-001 is serialized after CALC-001 to avoid two units editing the same core concurrently.

## Known risks
- Do not let AC-8 drift into new behavior: it must describe today's behavior only.
- CALC-001's expected behavior above is a proposal the user approved in principle by choosing the separate-unit option; if you see a genuine ambiguity in it (for example what the expression line should show for `2 + 3 / 0 *`), list it as an open question rather than choosing.

## Outstanding issues
none

## Required next action
Apply the AC amendments to `.agent/units/BOOT-001.md`, create `.agent/units/CALC-001.md`, update `KEY-001.md` `depends_on` and `.agent/plan.md`, and confirm `node .agent/tools/validate.mjs state` exits 0. Write your return handoff `.agent/handoffs/PLAN-04-planner-to-orchestrator.md` (template `.agent/templates/handoff.md`) and reply with its path plus ≤5 lines, including any new open question that needs the user.
