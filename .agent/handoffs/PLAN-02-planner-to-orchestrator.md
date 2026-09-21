---
unit: PLAN
from: planner
to: orchestrator
sequence: 02
model_attested: claude-opus-5
state: PLANNED
---

# Handoff PLAN-02: planner → orchestrator

## Context
Request: add keyboard input to the calculator under the CLAUDE.md TDD workflow. I read
`CLAUDE.md`, `README.md`, `index.html`, `script.js`, `style.css`, `.agent/gates.json`,
`.agent/decisions/D-001-toolchain.md`, `.agent/templates/*`, `.agent/write-policy.json`,
`tests/regression/REGISTRY.md` and `.agent/tools/{validate.mjs,lib.mjs}` (to write units the
validator accepts). `.agent/plan.md` is rewritten; three units exist at `PLANNED`.

Chosen approach: BOOT-001 extracts the state machine **and** display-string derivation into a
new classic script `calculator-core.js` (dual browser/Node export per D-001), `script.js`
becomes a thin DOM layer with a single `dispatch(input)` seam; KEY-001 adds a pure
`mapKey(key, modifiers)` allowlist in the core plus one `document` `keydown` listener feeding
that same seam; KEY-002 adds optional on-screen press feedback. Rejected alternatives
(synthesizing `button.click()`, keyboard before extraction, ES modules + bundler) are recorded
in the plan with reasons.

## Acceptance criteria
Per unit, in the unit files:
- `.agent/units/BOOT-001.md` — AC-1…AC-7 (core loads without a DOM; `4+8+9=` → `4+8+9` / `21`;
  `0.1+0.2=` → `0.3`; `5/0=` → `Error` + recovery; continue-from-result and operator swap;
  README click sequences unchanged through the DOM stub; no module syntax / `eval` / `innerHTML`).
- `.agent/units/KEY-001.md` — AC-1…AC-8 (digits+Enter chain; decimals and single `.`; operator
  keys → `× ÷ − +`; Backspace/Escape; unmapped keys and modifier combos change nothing and are
  not `preventDefault()`ed while mapped keys are, exactly once; focused-button Enter/Space fires
  exactly one action; auto-repeat policy; README documents the map).
- `.agent/units/KEY-002.md` — AC-1…AC-4 (matching button highlights on keydown and clears on
  keyup; no highlight for unmapped/modifier keys; feedback is side-effect free; CSS conventions
  and responsive rules intact).

## Relevant files
- `.agent/plan.md` — goal, tier table, requirements table R-01…R-13, approach + rejected
  alternatives, unit graph, regression plan, risk register RK-1…RK-9, open questions OQ-1…OQ-8
- `.agent/units/BOOT-001.md`, `.agent/units/KEY-001.md`, `.agent/units/KEY-002.md` — status `PLANNED`
- `script.js`, `index.html`, `style.css`, `README.md` — current behavior / baseline
- `.agent/gates.json` — lint command covers only `script.js` (see OQ-7)

## Tests created / executed
- created: none (planner writes no tests or product code)
- executed: `node .agent/tools/validate.mjs state` → `state: OK`, exit 0 (run directly, not a
  gate; no `run-gate` evidence applies to planning)

## Results
Three unit files parse cleanly: IDs match filenames, statuses `PLANNED`, `depends_on` chain
`BOOT-001 → KEY-001 → KEY-002` is acyclic, each has ≥1 AC and one `NEW -> PLANNED` Log line
actor `planner@claude-opus-5`. No unit may go `READY` until its blocking open questions are
answered and a test matrix exists (gate 2).

## Decisions made
- BOOT-001 is kept as the single mandatory enabler (CLAUDE.md §1) rather than split; its ACs
  are the characterization contract.
- Keyboard work is split vertically into KEY-001 (behavior, incl. double-fire and modifier
  safety — a correctness property, not a follow-up) and KEY-002 (optional presentation), so
  KEY-001 ships a complete, non-buggy keyboard channel on its own.
- Key-map input uses `event.key`, not `event.code` (layout/numpad normalized); listener on
  `document`; map is a closed allowlist returning `null` for anything unknown.
- Tiers: BOOT-001 T2 (new module boundary → architecture review), KEY-001 T2 (new input channel
  → security review required, CLAUDE.md §8), KEY-002 T1.
- No decision record written yet for the core API shape — that belongs to the unit that
  implements it (listed in BOOT-001's DoD).

## Known risks
- RK-1 silent behavior drift during extraction (mitigated: characterization tests first).
- RK-2 DOM-stub fidelity — `activeElement`, native Enter/Space activation, `event.repeat`,
  `preventDefault()` recording must be modeled, or KEY-001 AC-5…AC-7 prove nothing and must be
  reported `UNVERIFIED` rather than weakened.
- RK-3 no real browser (D-001 residual): `file://` load and visual feedback stay `UNVERIFIED`;
  a manual user check is needed.
- RK-6 the lint gate (`node --check script.js`) will not cover `calculator-core.js`, and only
  the human may edit `.agent/gates.json` (OQ-7).
- RK-7 the workflow scaffold is untracked, so every `run-gate` run is `dirty` and no evidence is
  valid — your item from PLAN-01, must be resolved before BOOT-001 starts.
- RK-5 over-broad `preventDefault()` could break browser shortcuts or `Tab` navigation.

## Outstanding issues
Open questions for the **user** (defaults proposed in `.agent/plan.md`; none resolved silently):
- **OQ-1 (blocks KEY-001)** exact key map: confirm digits/numpad, `.`, `+ - * /`, `Enter`/`=`,
  `Backspace`→DEL, `Escape`→AC; and decide `x`/`X`→×, `:`→÷, `,`→decimal, `Delete`→AC, `c`/`C`→AC.
- **OQ-2 (blocks KEY-001)** `preventDefault()` on mapped, modifier-free keys only?
- **OQ-3 (blocks KEY-001)** focused-button `Enter`/`Space`: keep native activation and have the
  handler ignore those events, or blur after click?
- **OQ-4 (blocks KEY-001)** held-key auto-repeat: allow for digits/`.`/`Backspace`, ignore for
  `Enter`/`=`/operators?
- **OQ-5 (blocks KEY-002; unit is cancelled if "no")** is on-screen press feedback wanted?
- **OQ-6 (blocks BOOT-001)** should display-string derivation move into the core too?
- **OQ-7 (blocks BOOT-001 gate 8)** will the user extend the `lint` command in
  `.agent/gates.json` to cover `calculator-core.js`?
- OQ-8 (non-blocking) anything else on the page ever needing keyboard focus?

## Required next action
Ask the user OQ-1…OQ-7 (OQ-6/OQ-7 first, since BOOT-001 is next in the graph), record the
answers in `.agent/plan.md` and the affected unit files, then dispatch `BOOT-001` to
`test-designer` for gate 2 (`.agent/units/BOOT-001.matrix.md`) — only after the untracked
workflow scaffold is committed so `run-gate` evidence can be clean (RK-7).
