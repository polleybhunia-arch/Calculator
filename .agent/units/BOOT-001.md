---
id: BOOT-001
title: Characterize current behavior and extract a testable calculator core
status: READY
tier: T2
depends_on:
base_ref:
head_ref:
tdd_exempt:
tdd_refactor_skip:
review_status: NONE
review_file:
reviewed_ref:
review_model:
review_fallback:
security_review:
docs:
blocked_reason:
---

# BOOT-001 — Characterize current behavior and extract a testable calculator core

*Amended 2026-09-21 by planner@claude-opus-5 (dispatch `.agent/handoffs/PLAN-03-orchestrator-to-planner.md`):
AC-1, AC-4, AC-6 and AC-7 reworded; AC-8 added; OQ-B1…OQ-B3 resolutions recorded. No AC was
renumbered and the scope is unchanged — this unit stays behavior-preserving.*

*Corrected 2026-09-21 by the orchestrator (FALLBACK(opus->sonnet), claude-sonnet-5): AC-1 said the
core exposes "exactly three" entry points; changed to "at least three" because KEY-001 legitimately
adds a key-map entry point to the same core. Also added AC-8 clause (g), which states an existing
matrix row ("DEL in the second operand changes only that operand", values re-run by the
test-designer against the unmodified script). Wording and traceability only; no new behavior.*

## Objective
Lock today's README-documented calculator behavior into automated tests, then move the state
machine and display-string derivation out of `script.js` into a pure, Node-importable
`calculator-core.js` (classic script, dual browser/Node export), leaving `script.js` as a thin
DOM layer. User-visible behavior must be **identical** before and after.

## Context
CLAUDE.md §1 names this the mandatory first unit: `script.js` reads the DOM and registers
listeners at load and keeps module-global mutable state, so no Node test can import it and no
later unit can follow Red → Green → Refactor. D-001 fixes the mechanics: `node:test`, a
minimal in-repo DOM stub under `tests/helpers/` driving the page scripts through `node:vm`,
and a dual-export guard instead of ES modules (which break `file://`). Required by KEY-001;
see `.agent/plan.md` (approach, RK-1, RK-4, OQ-6, OQ-7).

Today there are **zero** tests, so the characterization suite is also the first content of
`tests/regression/REGISTRY.md`.

One documented behavior is knowingly **not** characterized here: a divide-by-zero in the middle
of a chain (`5 / 0 +`) does not show `Error`, which contradicts README. Per the user's decision
(OQ-B1) this unit neither pins nor fixes it; the defect is owned by `CALC-001`, which runs
immediately after this unit.

## Dependencies
None. This unit is the enabler for every later unit.

## Acceptance Criteria
- AC-1: Given a Node process in which `document` and `window` are undefined, when a test loads
  `calculator-core.js`, then it loads without throwing and exposes at least three function entry
  points — a fresh-state constructor `() -> state`, an input transition `(state, input) -> state`
  and a display renderer `(state) -> { expression, current }` — under the names recorded in this
  unit's core-API decision record; rendering a fresh state gives expression `` (empty) and
  current `0`; two independently created states do not affect each other; and applying an input
  leaves the state that was passed in rendering exactly as before (no module-level mutable
  state, no `document`/`window` access at load or at call time).
- AC-2: Given a fresh core state, when the inputs `4`, `+`, `8`, `+`, `9`, `=` are applied in
  order, then the rendered display is expression `4+8+9` and current `21`; and before `=` was
  applied the rendered display was expression `` (empty) and current `4+8+9`.
- AC-3: Given a fresh core state, when `0`, `.`, `1`, `+`, `0`, `.`, `2`, `=` are applied, then
  the rendered current value is exactly `0.3` (floating-point noise trimmed).
- AC-4: Given a fresh core state, when `5`, `/`, `0`, `=` are applied, then the rendered display
  is expression `5÷0` and current `Error`; and when `7` is applied next, then the rendered
  display is expression `` (empty) and current `7` (a brand-new calculation).
- AC-5: Given a state immediately after `=` produced `21`, when `+` and `5` and `=` are applied,
  then the rendered display is expression `21+5` and current `26` (continue-from-result); and
  given a state immediately after an operator, when another operator is applied, then the
  pending operator is replaced rather than appended (trail shows one operator).
- AC-6: Given `index.html` loaded into the DOM stub exactly as a browser would load it (plain
  `<script src>` tags, in document order, no `type="module"`, no build step), when the README
  click sequences are performed as `click` events on the buttons — chained arithmetic, decimals,
  divide-by-zero, `AC`, `DEL` (including `DEL` right after an operator and `DEL` on `Error`),
  and the `=` two-line split — then every resulting `#display-expression` / `#display-current`
  text equals the expectation recorded for that sequence in `.agent/units/BOOT-001.matrix.md`,
  which is the record of the unmodified `script.js` at baseline `e02035b`. The mid-chain
  divide-by-zero path (`5 / 0 +` and its follow-ups) is deliberately excluded from this unit and
  is owned by `CALC-001`; no test here may assert an expectation for it.
- AC-7: Given the post-extraction tree, when the three shipped files `index.html`, `script.js`
  and `calculator-core.js` — and only those three, not the repo at large — are scanned as text,
  then none of them contains an `import`/`export` statement or dynamic `import(`, a
  `type="module"` attribute, `eval`, `new Function`, `document.write`,
  `innerHTML`/`outerHTML`/`insertAdjacentHTML`, or an absolute/protocol-relative (third-party or
  CDN) URL, and every display update goes through `textContent`.
- AC-8: Given a fresh core state, when edit, clear and equals inputs are applied, then today's
  behavior is preserved exactly — (a) `4 + 8 AC` renders expression `` (empty) and current `0`,
  and a following `5 =` renders expression `` (empty) and current `5` (no pending operator, no
  trail and no result survive `AC`); (b) `1 2 3 DEL` renders current `12`, `1 . 5 DEL DEL`
  renders current `1.` then `1`, and `5 DEL` and a bare `DEL` on a fresh state each render
  current `0`; (c) `4 + DEL` renders expression `` (empty) and current `0`, and so do
  `4 + 8 + 9 = DEL` and `5 / 0 = DEL` — `DEL` right after an operator, after `=` or on `Error`
  clears the whole calculation including the trail (OQ-B3); (d) `=` with no pending operator
  changes nothing: a bare `=` on a fresh state renders expression `` (empty) and current `0`,
  and `5 =` renders expression `` (empty) and current `5`; (e) `5 + =` renders expression `5+5`
  and current `10` — the held value is reused as the second operand (OQ-B2); (f) a second `=`
  after a result changes nothing: `4 + 8 + 9 = =` renders expression `4+8+9` and current `21`;
  (g) `DEL` while typing the second operand edits only that operand: `4 + 8 DEL` renders
  expression `` (empty) and current `4+0`, and a following `5 =` renders expression `4+5` and
  current `9`.

## Required Tests
- **Unit** (`tests/unit/calculator-core.test.js`): the pure-core behavior of AC-1…AC-5 and AC-8 —
  digits, leading-zero replacement, single decimal point per number, operator chaining
  left-to-right, operator swap, equals with no pending operator (no-op), divide-by-zero →
  `Error`, recovery from `Error` via digit / operator / `AC` / `DEL`, `DEL` reducing to `0`,
  rounding (`0.1+0.2`), render of both display lines in live and post-`=` modes.
- **Integration** (`tests/integration/dom-click.test.js` + `tests/helpers/dom-stub.js`):
  AC-6 — the real `index.html` scripts driven through the stub with `click` events; the stub
  must model `getElementById`, `querySelector`, `addEventListener`, event target/dataset and
  `textContent`.
- **Regression** (`tests/regression/readme-behavior.test.js`, `tests/regression/source-safety.test.js`):
  one test per README bullet (live trail, `=` split, chaining, continue-from-result, decimals,
  `Error`) plus the AC-7 static scan, each registered in `tests/regression/REGISTRY.md` with
  origin unit `BOOT-001`.
- **TDD note**: the RED run is the unit suite requiring `calculator-core.js` before it exists.
  The characterization integration/regression tests are a safety net written against the
  unmodified `script.js` and are expected to pass from the start; they must stay green across
  the extraction commit. Record this in the unit Log rather than claiming a false RED.
- **Matrix note (gate 2 re-run, blocks READY)**: `.agent/units/BOOT-001.matrix.md` already
  contains rows for every AC-8 behavior, currently attached to AC-2 and AC-5. The test-designer
  remaps those rows to AC-8 (no new expectations, no renaming of tests) before this unit leaves
  `PLANNED`; `validate.mjs state` fails at `READY` while AC-8 has no matrix row.

## Relevant Files / Components
- `script.js` — source of the behavior; becomes a thin DOM layer
- `calculator-core.js` — **new**; pure state machine + display rendering, dual export
- `index.html` — add `<script src="calculator-core.js"></script>` before `script.js`
- `tests/helpers/dom-stub.js` — **new**; minimal DOM for `node:vm`
- `tests/unit/`, `tests/integration/`, `tests/regression/`, `tests/regression/REGISTRY.md`
- `.agent/decisions/D-001-toolchain.md` — constraints; a new decision record for the core API shape
- `README.md` — only if the "Files" section needs the new file listed

## Definition of Done
Standard DoD (CLAUDE.md §12) plus:
- Architecture review (`architecture-reviewer`) `APPROVED` — this unit creates a module boundary (T2).
- `docs`: README "Files" section lists `calculator-core.js`; no behavior claim changes (behavior is unchanged).
- `tests/regression/REGISTRY.md` has a row for every regression test added.
- A decision record covering the core API shape and the dual-export guard.
- Lint gate honestly covers `calculator-core.js` (OQ-7) or the gap is recorded as a known issue.
- `git diff` shows **no** behavior change: every characterization expectation identical pre- and post-extraction.
- The mid-chain divide-by-zero path still behaves as it does at `e02035b` (`5 / 0 +` → current
  `5÷0+`): this unit must neither fix nor pin it. If the extraction changes that path, it is
  behavior drift (RK-1) and must be reported, not accepted — it would also invalidate `CALC-001`'s
  RED assumption.

## Risks / Open Questions
- **OQ-6 — RESOLVED 2026-09-21 (user: yes)**: display-string derivation moves into the core;
  AC-1…AC-5 stand as written against rendered strings.
- **OQ-7 (owner: user, blocks gate 8) — ACCEPTED, DEFERRED**: the user will extend the
  `.agent/gates.json` lint command to cover `calculator-core.js` before gate 8; only the human may
  edit that file. Until then this unit cannot pass FINAL.
- **OQ-B1 — RESOLVED 2026-09-21 (user: separate fix unit, do not pin)**: the mid-chain
  divide-by-zero defect is excluded from this unit's tests (AC-6) and fixed by `CALC-001`, which
  runs after `BOOT-001` and before `KEY-001`. The matrix's three "proposed rows" for OQ-B1 stay
  deactivated.
- **OQ-B2 — RESOLVED 2026-09-21 (user: freeze as baseline)**: `5 + =` → expression `5+5`,
  current `10`. Pinned by AC-8(e) and the matrix rows that already exist.
- **OQ-B3 — RESOLVED 2026-09-21 (user: freeze as baseline)**: `DEL` right after an operator,
  after `=` or on `Error` clears the whole calculation including the trail. Pinned by AC-8(c).
- RK-1 (owner: implementer/architecture-reviewer): silent behavior drift during extraction —
  mitigated by writing the characterization tests first. Residual: the mid-chain divide-by-zero
  path is unpinned here by design (OQ-B1), so drift on that one path would only be caught by
  `CALC-001`'s RED run.
- RK-2 (owner: implementer): DOM-stub fidelity; anything the stub cannot model is `UNVERIFIED`.
- RK-7 — RESOLVED 2026-09-21: scaffold committed as baseline `e02035b` on `main`; tree is clean,
  so `run-gate` evidence can bind to a clean head.
- RK-3 (owner: user): no real browser; `file://` loading is verified only by proxy (script tags
  + no module syntax), so a manual open-the-file check stays `UNVERIFIED`.

## Known Issues
- Mid-chain divide-by-zero (`5 / 0 +` shows `5÷0+`, then `=` shows expression `5÷0+Error` with
  current `NaN`) contradicts README and is knowingly left in place by this unit. Owner: `CALC-001`.

## Log
- 2026-09-21T03:18:17Z | NEW -> PLANNED | planner@claude-opus-5 | created from .agent/plan.md (keyboard input, T2); OQ-6/OQ-7 open
- 2026-09-21T04:19:22Z | PLANNED -> READY | orchestrator@claude-sonnet-5 | FALLBACK(opus->sonnet): gate 2 passed; matrix .agent/units/BOOT-001.matrix.md by test-designer@claude-sonnet-5 (handoffs BOOT-001-02, BOOT-001-04); OQ-6, OQ-B1..B3 resolved by user; OQ-7 (lint) deferred to gate 8
