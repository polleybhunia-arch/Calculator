---
unit: BOOT-001
from: architecture-reviewer
to: orchestrator
sequence: 16
model_attested: claude-opus-5
state: REVIEW
---

# Handoff BOOT-001-16: architecture-reviewer → orchestrator

## Context
Structural/boundary review of `BOOT-001` at `head_ref` `28a19873b0c03224e111afb30e44829c919c9945`
(T2, new module boundary: `calculator-core.js` + thin `script.js` DOM layer). Dispatched by
`.agent/handoffs/BOOT-001-13-orchestrator-to-architecture-reviewer.md`. I ran on Opus
(`claude-opus-5`); no fallback applies to this verdict. I did not read handoffs `BOOT-001-06`,
`-08` or `-10`. I changed no file on disk except the three listed below — no commit, stash,
checkout or reset; `git rev-parse HEAD` and `git status --porcelain` are unchanged.

**Verdict: APPROVED** — `.agent/reviews/BOOT-001-arch1.md`.

## Acceptance criteria
Scope per dispatch: AC-1, AC-6, AC-7 (plus the DoD clauses "architecture review APPROVED" and
"a decision record covering the core API shape and dual-export guard").
- AC-1: SATISFIED
- AC-6: SATISFIED
- AC-7: SATISFIED (substantive property verified by me; Minor finding F-1 is about the automated
  guard's file coverage, not the property)
AC-2…AC-5 and AC-8 were out of my scope (`reviewer` owns them).

## Relevant files
- `.agent/reviews/BOOT-001-arch1.md` — the verdict, AC lines, findings F-1…F-5, assessments
- `.agent/decisions/D-005-layering-rule.md` — **new, `status: proposed`**; needs a human/orchestrator
  acceptance decision
- `calculator-core.js`, `script.js`, `index.html` — the reviewed boundary
- `.agent/decisions/D-002`, `D-003` — assessed: agree with both; one amendment to D-003 (see F-2)

## Tests created / executed
- created: none (reviewers write no tests)
- executed (independent re-run by me at `head_ref`, not gate evidence): unit 52/52,
  integration 20/20, regression 13/13, all `fail 0`; `node --check calculator-core.js` passes.
  They agree with the recorded evidence
  `.agent/test-results/BOOT-001/latest-unit-final.json`,
  `.agent/test-results/BOOT-001/latest-integration-final.json`,
  `.agent/test-results/BOOT-001/latest-regression-final.json`,
  `.agent/test-results/BOOT-001/latest-lint-final.json`
  (exitCode 0, `dirty: false`, head `28a19873…`).
- executed (in-memory probes, nothing written to disk):
  - differential baseline-vs-core over an 11-token alphabet — exhaustive for all sequences of
    length 1–4 plus 30,000 seeded random sequences of length 5–9: **46,104 compared, 0 divergences**
    (RK-1 behavior drift not detected; the mid-chain divide-by-zero path still matches `e02035ba`,
    so `CALC-001`'s RED assumption survives — RK-10).
  - deep-frozen state probe: **90,082 transitions, 0 mutation errors** (no hidden mutation, no
    module-level state).
  - impossible-state probes over 40,000 sequences each: 0 states with `justCalculated` plus a
    pending operator; 0 states with a negative operand while `resetOnNextInput === false`.

## Results
APPROVED. The boundary is correctly placed: the core is pure and Node-loadable with no
`document`/`window`, the adapter holds the system's only mutable binding (closure-private), the
dependency direction is one-way with no cycle, and `globalThis.CalculatorCore` is the only new
global. Zero-dependency, no-build and `file://` constraints are honored by construction (classic
`<script src>` in order, dual-export guard, no module syntax). Test-only machinery
(`CALC_STUB_TRANSFORM`, `node:vm`, markup traps) is confined to `tests/helpers/`. The boundary
serves `CALC-001` (core-internal change only) and `KEY-001` (`mapKey` as a fourth entry point +
`keydown` listener feeding the existing `dispatch`) without rework.

No Critical or Major finding. Findings: F-1 Minor (AC-7's `dynamicCode`/`markupWrites` scans skip
`index.html`), F-2 Minor (input vocabulary duplicated in core and adapter — acceptable at two
adapters, must be exported once when `KEY-001` adds the third), F-3/F-4/F-5 Nits (unreachable
`history`-empty swap branch; generic load-order failure message; immutability by convention only).

## Decisions made
- D-002 (stage order): **agree** — the safety net had to characterize the unmodified `script.js`.
- D-003 (core API): **agree, with one amendment** — its "revisit if `KEY-001` needs the same
  validation" becomes a condition, not an option (F-2).
- Proposed **D-005** (`status: proposed`): layering rule — pure core, one mutable binding, one
  `dispatch` seam per input channel, adapter-filters/core-throws validation, export the input
  vocabulary once at the third consumer, channel-agnostic policy stays pure, presentation never
  reads core state. Rejected alternatives with cost/benefit are in the record (tagged-union state,
  `Object.freeze`, ES modules, core-owns-key-policy, leaving the rule implicit).

## Known risks
- RK-3/RK-4 `file://` in a real browser stays **UNVERIFIED** (no browser; verified by proxy only).
- OQ-7: the `lint` gate command still covers `script.js` only, so gate 8 cannot be honest until the
  human extends `.agent/gates.json` to `calculator-core.js`.
- Drift risk from the duplicated input vocabulary (F-2) grows with the third adapter.

## Outstanding issues
- F-1 (Minor) is deliberately **not** a condition of approval: fixing it now needs a commit, which
  would invalidate the SHA-bound review and gate evidence (CLAUDE.md §11). Carry it into
  `KEY-001`/`KEY-002`, or fix it now and re-run gates 4/6/7 plus a fresh review — your call.
- `.agent/decisions/D-005-layering-rule.md` is `proposed` and needs acceptance (or rejection)
  recorded before `KEY-001` starts, since two of its clauses are constraints on that unit.

## Required next action
Record the architecture verdict `APPROVED` for `reviewed_ref` `28a19873b0c03224e111afb30e44829c919c9945`
in `.agent/units/BOOT-001.md` (Log + review fields), collect the outstanding `reviewer` and
`security-reviewer` verdicts for the same SHA, and put D-005's acceptance to the user before
`KEY-001` leaves `PLANNED`.
