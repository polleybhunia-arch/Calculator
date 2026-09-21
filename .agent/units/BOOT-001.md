---
id: BOOT-001
title: Characterize current behavior and extract a testable calculator core
status: PLANNED
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

## Dependencies
None. This unit is the enabler for every later unit.

## Acceptance Criteria
- AC-1: Given a Node process with no DOM globals defined, when a test requires
  `calculator-core.js`, then the module loads without throwing and exposes the core API (fresh
  state, apply-input, render-display) as pure functions — no `document`, `window` or
  module-level mutable state is touched.
- AC-2: Given a fresh core state, when the inputs `4`, `+`, `8`, `+`, `9`, `=` are applied in
  order, then the rendered display is expression `4+8+9` and current `21`; and before `=` was
  applied the rendered display was expression `` (empty) and current `4+8+9`.
- AC-3: Given a fresh core state, when `0`, `.`, `1`, `+`, `0`, `.`, `2`, `=` are applied, then
  the rendered current value is exactly `0.3` (floating-point noise trimmed).
- AC-4: Given a fresh core state, when `5`, `/`, `0`, `=` are applied, then the rendered current
  value is `Error`; and when `7` is applied next, then the rendered current value is `7` with
  an empty expression line (a brand-new calculation).
- AC-5: Given a state immediately after `=` produced `21`, when `+` and `5` and `=` are applied,
  then the rendered display is expression `21+5` and current `26` (continue-from-result); and
  given a state immediately after an operator, when another operator is applied, then the
  pending operator is replaced rather than appended (trail shows one operator).
- AC-6: Given `index.html` loaded into the DOM stub exactly as a browser would load it (plain
  `<script src>` tags, in document order, no `type="module"`, no build step), when the README
  click sequences are performed as `click` events on the buttons — chained arithmetic, decimals,
  divide-by-zero, `AC`, `DEL` (including `DEL` right after an operator and `DEL` on `Error`),
  and the `=` two-line split — then every resulting `#display-expression` / `#display-current`
  text matches the expectations recorded against the pre-extraction `script.js`.
- AC-7: Given the post-extraction tree, when the whole repo is searched, then no `import`/
  `export` statement, `type="module"` attribute, `eval`, `new Function`, `innerHTML` assignment
  or third-party/CDN reference exists in `index.html`, `script.js` or `calculator-core.js`, and
  display updates go through `textContent`.

## Required Tests
- **Unit** (`tests/unit/calculator-core.test.js`): the pure-core behavior of AC-1…AC-5 —
  digits, leading-zero replacement, single decimal point per number, operator chaining
  left-to-right, operator swap, equals with no pending operator (no-op), divide-by-zero →
  `Error`, recovery from `Error` via digit / operator / `AC` / `DEL`, `DEL` reducing to `0`,
  rounding (`0.1+0.2`), render of both display lines in live and post-`=` modes.
- **Integration** (`tests/integration/dom-click.test.js` + `tests/helpers/dom-stub.js`):
  AC-6 — the real `index.html` scripts driven through the stub with `click` events; the stub
  must model `getElementById`, `querySelector`, `addEventListener`, event target/dataset and
  `textContent`.
- **Regression** (`tests/regression/readme-behavior.test.js`): one test per README bullet
  (live trail, `=` split, chaining, continue-from-result, decimals, `Error`), each registered
  in `tests/regression/REGISTRY.md` with origin unit `BOOT-001`.
- **TDD note**: the RED run is the unit suite requiring `calculator-core.js` before it exists.
  The characterization integration/regression tests are a safety net written against the
  unmodified `script.js` and are expected to pass from the start; they must stay green across
  the extraction commit. Record this in the unit Log rather than claiming a false RED.

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

## Risks / Open Questions
- **OQ-6 (owner: user, BLOCKS READY)**: should display-string derivation move into the core as
  well (proposed: yes)? AC-1/AC-2 assume yes; if the answer is no, AC-2…AC-5 must be rewritten
  against state values instead of rendered strings.
- **OQ-7 (owner: user, blocks gate 8)**: `.agent/gates.json` lint command must be extended to
  `calculator-core.js`; only the human may edit that file.
- RK-1 (owner: implementer/architecture-reviewer): silent behavior drift during extraction —
  mitigated by writing the characterization tests first.
- RK-2 (owner: implementer): DOM-stub fidelity; anything the stub cannot model is `UNVERIFIED`.
- RK-7 (owner: orchestrator): the workflow scaffold is untracked, so no gate evidence is valid
  until it is committed — must be resolved before this unit starts.
- RK-3 (owner: user): no real browser; `file://` loading is verified only by proxy (script tags
  + no module syntax), so a manual open-the-file check stays `UNVERIFIED`.

## Known Issues
(none yet)

## Log
- 2026-09-21T03:18:17Z | NEW -> PLANNED | planner@claude-opus-5 | created from .agent/plan.md (keyboard input, T2); OQ-6/OQ-7 open
