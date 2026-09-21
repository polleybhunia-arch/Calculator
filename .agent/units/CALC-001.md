---
id: CALC-001
title: Show Error immediately when a divide-by-zero is resolved by an operator press
status: PLANNED
tier: T1
depends_on: BOOT-001
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

# CALC-001 — Show Error immediately when a divide-by-zero is resolved by an operator press

## Objective
A division by zero that is resolved by pressing an **operator** (instead of `=`) shows `Error`
at once, exactly as pressing `=` does today: `5 / 0 +` displays expression `5÷0` and current
`Error`, the pressed operator is discarded, and the existing `Error` recovery behavior follows
unchanged. Today it instead displays `5÷0+` and a later `=` yields expression `5÷0+Error` with
current `NaN`, contradicting README ("Division-by-zero shows `Error`").

## Context
Requirement R-14 in `.agent/plan.md`. The defect was found during `BOOT-001` gate 2
(`.agent/units/BOOT-001.matrix.md`, open question OQ-B1) and confirmed by running the unmodified
`script.js` at baseline `e02035b`. The user decided on 2026-09-21 that `BOOT-001` stays
behavior-preserving and that this separate unit fixes the defect, RED first, **after** `BOOT-001`
and **before** `KEY-001` (so no two units edit the core concurrently).

Cause in today's `script.js`: `chooseOperator()` calls `computeResult()`, which on a zero divisor
sets `currentInput = 'Error'` and returns; `chooseOperator()` then continues unconditionally,
pushing the operator symbol onto `history`, setting `previousInput = 'Error'` and
`operator = nextOperator`. `equals()` does not have this problem because it finalizes the display
(`lastExpression`, `justCalculated`) right after `computeResult()`. After `BOOT-001` the same
logic lives in the pure `calculator-core.js`, so the fix and its RED test are core-level and need
no DOM.

Fix rule (from the user's decision): when an operator press triggers a divide-by-zero, the state
that results is **indistinguishable from pressing `=` at that point** — same two display lines,
same subsequent behavior — and the pressed operator is discarded.

## Dependencies
- `BOOT-001` — must be `COMPLETE` first. It provides the importable pure core (so this fix is a
  unit-testable core change with a real RED run), the DOM stub, and the characterization and
  regression suites that prove the rest of the behavior is untouched.

## Acceptance Criteria
- AC-1: Given a fresh state, when `5`, `/`, `0`, `+` are applied, then the rendered display is
  expression `5÷0` and current `Error` — identical to the display after applying `5`, `/`, `0`,
  `=` — and the pressed `+` appears in neither line and leaves no pending operator (the next
  input behaves exactly as it does after `5 / 0 =`).
- AC-2: Given a fresh state per case, when the fourth input is `+`, `-`, `*` or `/`, then each
  case renders expression `5÷0` and current `Error` (the rule is the operator position, not a
  particular operator).
- AC-3: Given a fresh state per case, then a divide-by-zero resolved by an operator press
  anywhere in a chain renders the full typed expression and `Error`: `2 + 3 / 0 *` renders
  expression `2+3÷0` and current `Error` (subject to OQ-C1); `0 / 0 +` renders expression `0÷0`
  and current `Error`; `5 / 0 . 0 +` renders expression `5÷0.0` and current `Error`.
- AC-4: Given the state produced by `5 / 0 +`, when the next input is applied, then recovery is
  identical to the same input applied after `5 / 0 =` — `7` renders expression `` (empty) and
  current `7`; `+` renders expression `` (empty) and current `0+`; `AC` renders expression ``
  (empty) and current `0`; `DEL` renders expression `` (empty) and current `0`; `=` changes
  nothing (expression stays `5÷0`, current stays `Error`).
- AC-5: Given the `BOOT-001` unit, integration and regression suites exactly as committed by
  `BOOT-001` (no test file edited, so no `kind: test-change` decision record is needed), when
  they are run on this unit's `head_ref`, then all of them pass — in particular `5 / 0 =` still
  renders expression `5÷0` / current `Error`, `2 + 3 / 0 =` still renders expression `2+3÷0` /
  current `Error`, `0 / 5 =` still renders `0`, and every non-error chain, operator-replacement,
  `AC`/`DEL` and continue-from-result expectation is unchanged.
- AC-6: Given `README.md`, when a user reads the divide-by-zero bullet, then it states that
  `Error` is shown as soon as the division is evaluated, including in the middle of a chain
  (e.g. `5 ÷ 0 +`), matching the implemented behavior.

## Required Tests
- **Unit** (`tests/unit/calculator-core.test.js`, extended with new named rows — RED first):
  AC-1…AC-4 against the pure core; each new test must **fail on the post-`BOOT-001` core** for
  the documented reason (it renders `5÷0+` / no `Error`) and pass after the fix. Cover: each of
  the four operators in the failing position, the chained case, `0 / 0`, a `0.0` divisor, and
  each of the five recovery inputs.
- **Integration** (`tests/integration/dom-click.test.js`, extended): the same defect through the
  real click path — click `5 / 0 +` on the page loaded from `index.html` via the DOM stub and
  assert expression `5÷0` / current `Error`, plus one recovery click (`7` → current `7`). Proves
  the fix reaches the user, not only the core.
- **Regression** (`tests/regression/divide-by-zero.test.js`, **new** file, plus new rows in
  `tests/regression/REGISTRY.md` with origin `CALC-001`): the defect regression test required by
  CLAUDE.md §14 — it must fail without the fix — covering `5 / 0 +` and `2 + 3 / 0 *` and the
  `Error`-recovery sequence, phrased as README behavior ("division by zero shows Error, also
  mid-chain"). `tests/regression/readme-behavior.test.js` is **added to, never altered**; if any
  pre-existing `BOOT-001` expectation has to change, stop and raise it (it would need a
  `kind: test-change` decision record and means `BOOT-001` pinned something this fix contradicts —
  none is expected, because the mid-chain path was deliberately left unpinned).
- **TDD note — genuineness of RED**: this RED is only genuine if the defect still reproduces on
  the post-`BOOT-001` core. Before writing the fix, run the new unit tests on the unmodified
  post-`BOOT-001` head and record the actual rendered values in the RED evidence and in the unit
  Log. If the extraction happens to have changed or removed the defect, do **not** claim a RED
  and do not retro-fit a failing test: record the observed values, report it to the orchestrator
  as `BOOT-001` behavior drift (RK-1, `BOOT-001` AC-6/DoD), and proceed only with an explicit
  decision record — either `BOOT-001` is corrected, or `CALC-001` becomes characterization-only
  with `tdd_exempt: <reason>`.

## Relevant Files / Components
- `calculator-core.js` — the operator-transition branch that resolves a pending division (the
  post-`BOOT-001` home of `chooseOperator`/`computeResult`); the whole fix lives here
- `script.js` — expected to need **no** change (thin DOM layer); note it if it does
- `tests/unit/calculator-core.test.js`, `tests/integration/dom-click.test.js`
- `tests/regression/divide-by-zero.test.js` (new), `tests/regression/REGISTRY.md`
- `tests/regression/readme-behavior.test.js` — read, and only appended to
- `README.md` — divide-by-zero bullet (AC-6)
- `.agent/units/BOOT-001.matrix.md` — the recorded pre-fix behavior (OQ-B1 section) that the RED
  run must reproduce
- `script.js` at `e02035b` — the behavior being corrected (via `git show`)

## Definition of Done
Standard DoD (CLAUDE.md §12) plus:
- `security_review`: expected `N/A: pure arithmetic guard in the core; no new input surface, no
  DOM/markup write, no storage, network or dependency change` — orchestrator confirms the trigger
  list in CLAUDE.md §8 before relying on this.
- Architecture review: not triggered (no new module boundary; T1) unless the same failure
  signature occurs three times (CLAUDE.md §6).
- `docs`: `UPDATED` — README's divide-by-zero bullet matches the implemented behavior (AC-6).
- A regression test exists that fails without the fix, registered in
  `tests/regression/REGISTRY.md` with origin `CALC-001`.
- The `BOOT-001` suites pass unmodified on this unit's `head_ref` (AC-5); any test file change
  carries a `kind: test-change` decision record.
- Lint gate covers `calculator-core.js` (the OQ-7 `.agent/gates.json` change the user makes for
  `BOOT-001`; if it is still outstanding, this unit inherits the same gate-8 block).

## Risks / Open Questions
- **OQ-C1 — RESOLVED 2026-09-21 (user confirmed the proposed default, `2+3÷0` / `Error`; AC-3 stands
  as written, "subject to OQ-C1" is now satisfied)**. Original question: what should the expression line show when the
  divide-by-zero happens later in a chain? Proposed default `2 + 3 / 0 *` → expression `2+3÷0`,
  current `Error` — the full typed expression, which is exactly what `2 + 3 / 0 =` renders today
  (verified by hand-trace of `script.js` at `e02035b`: `equals()` builds
  `history.join('') + currentInput` = `2+3÷0`). The alternative would be `5÷0` (only the failing
  operation, using the resolved intermediate `5`). One word settles AC-3.
- **OQ-C2 — RESOLVED 2026-09-21 (user confirmed; AC-4 stands as written)**. Original: after the fix the
  state is treated as fully equivalent to having pressed `=`, so a following `=` is ignored and
  the expression line keeps showing `5÷0` (AC-4). This follows from the user's own wording
  ("exactly as `5 / 0 =` does today"; "existing Error recovery applies unchanged"); contradict it
  only if that reading is wrong.
- RK-10 (owner: implementer/orchestrator): the RED run depends on the defect surviving the
  `BOOT-001` extraction — see the TDD note above; a false RED is never acceptable.
- RK-11 (owner: implementer/reviewer): the fix sits on the shared operator transition, so a
  careless change can alter operator replacement, chaining or continue-from-result. Mitigation:
  `BOOT-001`'s suites run unmodified (AC-5) and the fix must be confined to the zero-divisor
  branch.
- RK-12 (owner: reviewer): the `=` path already produces `Error`; sharing the finalize step
  between the two paths is the clean fix, but it must not change what `=` renders (pinned by the
  `BOOT-001` rows for `5 / 0 =` and `2 + 3 / 0 =`).
- RK-14 (owner: implementer/reviewer, from `.agent/reviews/BOOT-001-arch1.md` F-3): the fix edits the
  operator-swap and operator-resolve transitions, so it must preserve the invariant
  "`resetOnNextInput && !justCalculated` implies a non-empty `history`" (the swap uses
  `history.slice(0, -1)`). It must also follow `.agent/decisions/D-005-layering-rule.md` (accepted):
  the change stays inside the core; no DOM access, no second copy of state.
- RK-3 (owner: user): no real browser — the click-path evidence comes from the DOM stub; a
  manual check stays `UNVERIFIED`.

## Known Issues
(none yet)

## Log
- 2026-09-21T03:53:52Z | NEW -> PLANNED | planner@claude-opus-5 | created from .agent/handoffs/PLAN-03-orchestrator-to-planner.md (user decision OQ-B1: separate fix unit); depends on BOOT-001; OQ-C1 open
