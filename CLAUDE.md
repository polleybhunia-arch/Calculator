# CLAUDE.md — Engineering Constitution

Authoritative for every agent in this repository. Skills (`.claude/skills/`) say *how* to do a capability; this file says *what is required*. Where they disagree, this file wins. Rationale and known weaknesses: [docs/agentic-workflow.md](docs/agentic-workflow.md).

## 1. Project

**Calculator** — a browser calculator (+ − × ÷, live expression trail, chained operations, decimals, `Error` on divide-by-zero, responsive dark theme). Behavior is documented in [README.md](README.md); that behavior is the baseline that must never regress.

- **Stack**: vanilla HTML/CSS/JavaScript, **zero runtime and dev dependencies** (decision [D-001](.agent/decisions/D-001-toolchain.md)). Node ≥ 24 is used only for tests/tooling (`node:test`, `node:assert`).
- **Must keep working when `index.html` is opened via `file://`** (README promise). Therefore: classic `<script>` tags only, no ES-module `<script type="module">`, no build step.
- **Structure**: `index.html` (markup) · `style.css` · `script.js` (logic + DOM wiring, currently global state) · `tests/{unit,integration,regression,helpers}/` · `.agent/` (workflow state) · `.claude/` (agents, skills, hooks) · `docs/`.
- **Known testability debt**: `script.js` touches the DOM at load and keeps global state, so it cannot be imported by Node tests. First unit of work is `BOOT-001` (characterization tests of current behavior, then extraction of a pure calculator core with dual browser/Node export) — before any feature work.

## 2. Running the workflow

Complex work runs under the orchestrator as the **main session**: `claude --agent orchestrator`. Subagents cannot be relied on to coordinate one another, so the orchestrator is the only agent with the `Agent` tool; `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` (`.claude/settings.json`) keeps workers flat. A plain session may still do small tasks, but must obey §5 and §12.

## 3. Commands (single source: [.agent/gates.json](.agent/gates.json))

Never type raw test commands into reports. Run gates through the recorder, which stores machine evidence bound to the current commit:

| Purpose | Command |
|---|---|
| Run a gate (`unit` `integration` `regression` `lint` `typecheck` `build`) | `node .agent/tools/run-gate.mjs <gate> --unit <ID> [--phase red\|green\|refactor\|final]` |
| Validate state, transitions, evidence, review binding | `node .agent/tools/validate.mjs state` |
| Validate agent contracts and model policy | `node .agent/tools/validate.mjs agents` |
| Regenerate `.agent/state.md` | `node .agent/tools/validate.mjs dashboard --write` |
| Completion evidence report | `node .agent/tools/validate.mjs evidence <ID>` |
| Self-test the workflow tooling | `node --test ".agent/tools/tests/*.test.mjs"` |
| Inspect changes | `git status`, `git diff <base>..<head>`, `git log` |

A gate that is neither runnable nor recorded `N/A` (with a reason) in `gates.json` **blocks the work**; it is never skipped.

## 4. Conventions

- **Code**: 2-space indent, single quotes, semicolons, `const`/`let` (never `var`), `camelCase` identifiers, `UPPER_SNAKE` constants, files `kebab-case`. Prefer small pure functions; keep DOM access in one thin layer. Comments explain *why*, not *what*.
- **CSS**: class names `kebab-case`; behavior is bound through `data-*` attributes, not class names.
- **Tests**: `node:test` + `node:assert/strict`. Files `tests/<layer>/<subject>.test.js`. A test name states behavior (`"chains 4+8+9 left to right"`), not implementation. One behavior per test. No test may depend on another test's state, wall-clock time, or randomness without a seed.
- **Errors**: never swallow. No empty `catch`. User-facing failures show `Error` (as today); internal invariant violations throw. Validate at boundaries (button input) and trust internal types after.
- **Security**: never `eval`/`new Function`/`innerHTML` with input-derived data — use `textContent`. No third-party scripts, CDNs or new dependencies without a recorded decision. Do not read or write outside the repository. No secrets in the repo.
- **Docs**: user-visible behavior changes update `README.md` in the same unit. Non-obvious design choices get a decision record in `.agent/decisions/`.
- **Git**: work on branch `agent/<UNIT-ID>-<slug>`, never directly on `main`. Commit message `<UNIT-ID>: <imperative summary>`. Commit **before** running final gates (evidence is bound to the commit SHA and requires a clean tree outside `.agent/`). **Agents never push.** `git push` is denied in `.claude/settings.json` (`permissions.deny`, which beats any allow such as one in `settings.local.json`; `validate.mjs agents` fails if the deny is removed). Do not route around it (`gh`, remote tricks). The human pushes. Merging, force operations and history rewrites also need an explicit user instruction.

## 5. Principles (non-negotiable)

1. TDD is mandatory: Red → Green → Refactor wherever technically practical; exemptions (`tdd_exempt`) need a written reason and are reviewed.
2. Code written ≠ done. Every unit has explicit acceptance criteria (`AC-n`) and tests mapped to each.
3. Tests verify behavior and requirements, not coverage numbers.
4. Existing tests keep passing after every meaningful change; integration + regression suites only grow.
5. No stage is skipped silently. Any skip is an explicit, recorded, justified decision (unit `Log`, or a decision record).
6. No completion claim without objective evidence (§13). "Should work" is not evidence; unverifiable = say so.
7. A failed gate enters a correction loop (§6) that **continues until the gate passes**; it is never merely reported and never bypassed.
8. Diagnose before fixing. Never edit code until tests go green without knowing *why* they were red.

## 6. RALPH loop (exact definition)

**R**esearch → **A**rrange → **L**aunch → **P**rove → **H**arden, repeated per unit and per failure.

| Step | Meaning | Concrete actions | Exit artifact |
|---|---|---|---|
| **R**esearch | Understand current reality | `validate.mjs state`, read unit + matrix + relevant code/tests + last failure; never rely on chat memory | Handoff "Context" filled |
| **A**rrange | Decide the single next action | Pick next unit / fix strategy; classify any failure (§10); confirm model + agent for the action | Dispatch handoff |
| **L**aunch | Execute the action | Delegate to the owning agent (RED→GREEN→REFACTOR, review, integration run…) | Agent result handoff |
| **P**rove | Verify with tools, not words | `run-gate` runs; independent review; `validate.mjs state` | Evidence files + review file |
| **H**arden | Learn, record, decide | Update unit status/log; add regression test for any escaped/fixed defect; record decisions; regenerate dashboard; choose loop or stop | Updated `.agent/` state |

**Stop conditions** (evaluated every Harden step, in this order):
1. **DONE** — Definition of Done (§12) satisfied for all units and `validate.mjs all` exits 0 → produce final report, stop. Do not keep polishing.
2. **BLOCKED** — required model unavailable, environment/tool failure not fixable in-repo, or architectural blocker → mark unit `BLOCKED` with `blocked_reason`, report, stop that unit.
3. **STAGNATION** (a pause, not a cap) — see the test-failure loop below. Only when the *same* failure signature survives an architecture review twice more does the unit pause as `BLOCKED` (`blocked_reason: STAGNATION`) and ask the user, with what was tried.
4. **ASK** — blocking ambiguity in requirements → ask the user before `READY`; do not guess.

**Test-failure loop (locked user decision).** `implementer` and `debugger` keep looping — failure → `debugger` diagnosis → `implementer` fix → re-run — until the unit gate is green **and every test named in the matrix (all corner cases) exists and passes**. There is no iteration cap. Thrash is handled by escalation, not by giving up: the same failure signature (`<gate>:<test/error head>`) twice → `debugger` is mandatory before any further fix; three times → `architecture-reviewer` judges the design; a fresh signature resets the count. Reviewer `CHANGES_REQUIRED` loops the same way (fix → new review of the new head). Environment, tool, model, and requirement-ambiguity blockers are not test failures and still `BLOCK`/`ASK`.

**Never stop because** code compiles, a subset of tests passes, or an agent said it is finished.

## 7. Workflow tiers

The orchestrator classifies each request and records the tier and reason in `.agent/plan.md`.

| Tier | Scope | Stages |
|---|---|---|
| **T0** | No executable change (typo, comment, README wording) | edit → `validate.mjs all` → done. Recorded, never silent. |
| **T1** | One small unit, low risk | full gates for one unit; security/architecture review only if triggered (§8) |
| **T2** | Multi-unit, cross-cutting, or new subsystem | full pipeline incl. planner, architecture review where triggered |

Any change to `script.js`/`index.html`/`style.css` behavior is at least **T1**. Doubt → the higher tier.

## 8. Agents, responsibilities, models

Definitions live in [.claude/agents/](.claude/agents/); the model table is enforced by [.agent/model-policy.json](.agent/model-policy.json) and `validate.mjs agents`.

| Agent | Model | Owns |
|---|---|---|
| `orchestrator` | **opus** | Lifecycle, state, dispatch, gate enforcement, final evidence. Does not write product code/tests. |
| `planner` | **opus** | Requirements → units with ACs, dependencies, risks, open questions. |
| `test-designer` | sonnet | AC → test-case → expected-result matrix per unit (design only, no test code). |
| `implementer` | sonnet | RED tests from the matrix, GREEN code, REFACTOR, commits. |
| `reviewer` | **opus** | Independent verdict `APPROVED`/`CHANGES_REQUIRED`/`BLOCKED`. Read-only on code. |
| `security-reviewer` | **opus** | Security verdict. Required when a unit touches input handling, storage, network, auth, dependencies, or DOM injection surfaces. |
| `architecture-reviewer` | **opus** | Structure/boundary verdict. Required for T2, new module boundaries, or third failure of a signature. |
| `integration-tester` | sonnet | Cross-component tests; authors/expands `tests/integration` + `tests/regression` (RED first) **before review**, updates the registry, runs the full suites. |
| `debugger` | sonnet | Root-cause diagnosis and failure classification. Diagnoses; does not fix. |
| `refactorer` | sonnet | Behavior-preserving structural change on a green suite. May not edit tests. |
| `documenter` | sonnet | README/docs updates matching implemented behavior. |

**Model rules (no silent downgrade).** Each agent declares `model:` in its frontmatter; that is the contract.
- The orchestrator **omits** the `model` parameter when spawning (a per-call model overrides the definition). It never substitutes a model for convenience, latency, tokens or cost.
- **Approved fallback (user decision): Opus → Sonnet, only when Opus is *unavailable*** (model not accessible/enabled, or still failing after 2 retries on the same model). Procedure: retry the same model twice → re-spawn with `model: "sonnet"` (the one sanctioned use of that parameter) → log the transition as `FALLBACK(opus->sonnet): <reason>` → the agent's handoff `model_attested` must show Sonnet. A Sonnet review sets `review_fallback: <reason>` and the completion evidence is labelled **REDUCED ASSURANCE**; if Opus returns before `COMPLETE`, redo that step on Opus. Never fall back to any other model, and never for latency, tokens or cost.
- **Sonnet-family agents have no fallback**: if Sonnet is unavailable → `blocked_reason: MODEL_UNAVAILABLE: <agent> requires sonnet`, `BLOCKED`, report, wait.
- Step 0 of every orchestrator session: check the session's own model. Opus → proceed. Not Opus → say so prominently to the user, treat the whole session as running under fallback (every Log line carries the `FALLBACK(opus->sonnet):` prefix), and continue; never present it as normal.
- `validate.mjs` accepts an Opus-family agent on Sonnet only on a line marked `FALLBACK(opus->sonnet)`; anything else fails as a silent downgrade.
- Each agent states the model it is running on in its handoff (`model_attested`); the orchestrator logs `agent@model` in the unit Log. `validate.mjs` rejects a mismatch.
- Reviewers are chosen for independence: they never receive the implementer's justification, only facts (spec, matrix, refs, evidence paths).

**Write ownership** is enforced by a hook ([.agent/write-policy.json](.agent/write-policy.json)): e.g. reviewers cannot edit code; implementers cannot edit unit state or reviews; nobody but the human edits `CLAUDE.md`, `.claude/`, `gates.json`, policies, tools, or `test-results/`.

## 9. State model

Files under `.agent/` are the system of record; conversation is not.

```
.agent/state.md        GENERATED dashboard (validate.mjs dashboard --write)
.agent/plan.md         goal, tier, unit graph, risks, open questions
.agent/units/<ID>.md   spec + frontmatter status + Log      (orchestrator owns status)
.agent/units/<ID>.matrix.md   AC → test → expected result
.agent/handoffs/       <ID>-<NN>-<from>-to-<to>.md
.agent/reviews/        <ID>-r<N>.md (review verdicts, per-AC SATISFIED/…)
.agent/diagnoses/      <ID>-d<N>.md
.agent/decisions/      D-<NNN>-*.md  (ADRs, test-change justifications, gate skips)
.agent/test-results/<ID>/latest-<gate>-<phase>.json   MACHINE-written by run-gate
.agent/templates/      unit, matrix, handoff, review, diagnosis, decision
```

**Statuses**: `PLANNED → READY → IN_PROGRESS → TESTING → REVIEW → INTEGRATION → COMPLETE`, plus `CHANGES_REQUIRED` (from REVIEW, back to IN_PROGRESS) and `BLOCKED` (any, needs `blocked_reason`). Legal transitions are in `.agent/tools/lib.mjs`; every transition is a Log line `- <ISO-ts> | FROM -> TO | agent@model | reason/evidence path`. Only the orchestrator changes `status`; the planner creates units at `PLANNED`.

**Unit ID** `<AREA>-<NNN>` (`BOOT-001`, `CALC-004`). Unit frontmatter fields: see `.agent/templates/unit.md`.

## 10. Failure handling

Classify first (the debugger does this when it is not obvious), then act. Never "retry until green".

| Class | Signal | Next action |
|---|---|---|
| Test failure — implementation wrong | Test matches AC, code deviates | `implementer` fixes code; keep the test |
| Test failure — test wrong | Test contradicts AC or is flaky/incorrect | `test-designer` re-checks matrix vs AC, then fix test with a **test-change decision record** |
| Test-design failure | AC uncovered / weak assertions found by review | `test-designer` revises matrix → gate 2 again |
| Review failure | `CHANGES_REQUIRED` | `implementer` addresses each finding; **new** review cycle on the new head_ref |
| Environment failure | Node/git/tool broken, not the code | Fix environment or `BLOCKED`; never edit tests/code to dodge it |
| Dependency failure | Depends-on unit failed/blocked | Block dependents; resolve upstream first |
| Tool failure | run-gate/validator/hook crashes | Fix or report; don't hand-write the evidence it should produce |
| Ambiguous requirement | ACs can't be made testable | `ASK` the user; planner records the open question |
| Architectural blocker | Requirement conflicts with structure | `architecture-reviewer`, decision record, possibly replan |

## 11. Quality gates

A gate must pass — with evidence — before the next stage begins. A failed gate triggers its correction loop (§10). Agents cannot waive or bypass a gate: the validator will not accept `COMPLETE` without it. If a gate is genuinely inapplicable or wrong, the unit goes `BLOCKED` with the reason, and only the **human** may change `.agent/gates.json` (e.g. mark `na` with a reason) — recorded in a decision record.

| # | Gate | Passes when | Evidence | Status after |
|---|---|---|---|---|
| 1 | PLAN | Unit has objective, context, deps, `AC-n` list, required tests, open questions resolved | unit file | — |
| 2 | TEST DESIGN | Matrix covers every AC (happy, boundary, invalid, error, edge, security, state, recovery as applicable) | `.matrix.md` | `READY` |
| 3 | TDD | RED failed for the expected reason → GREEN passed → REFACTOR passed (or reasoned skip) | `unit` red/green/refactor run files | `TESTING` |
| 4 | IMPLEMENTATION | Unit gate passes on committed `head_ref`, clean tree | `unit` final run | `REVIEW` |
| 5 | REVIEW | Independent Opus review `APPROVED` for **this** `head_ref`; every AC `SATISFIED`; no open critical findings; security/architecture verdicts when required | review file | `INTEGRATION` |
| 6 | INTEGRATION | Integration suite green on `head_ref` | `integration` final run | — |
| 7 | REGRESSION | Entire regression suite green; new regression tests added where behavior is new/changed | `regression` final run | — |
| 8 | FINAL | lint, typecheck, build (or N/A+reason), docs updated, `validate.mjs all` = 0 | all `latest-*-final.json` + evidence report | `COMPLETE` |

**Locked ordering — tests first, then review (user decision).** Integration/regression tests are authored *before* review so the reviewer sees the whole unit and the approval stays bound to one SHA; gates 6–7 therefore run pre-review (required to enter `REVIEW`) and again as authoritative runs on the approved SHA (`INTEGRATION` status). No commit may occur between `APPROVED` and `COMPLETE`. Any new commit invalidates review and gate evidence (SHA-bound) → re-run from the earliest affected gate.

Per-unit pipeline: `planner` → `test-designer` (gate 2) → `implementer` (RED→GREEN→REFACTOR) → `integration-tester` → `documenter` if behavior is user-visible → orchestrator runs gates 4/6/7 → `reviewer` (+ `security-reviewer`/`architecture-reviewer` when triggered) → orchestrator runs authoritative gates + `validate.mjs all` → `COMPLETE`.

## 12. Definition of Done

A unit is `COMPLETE` only when **all** hold: every AC satisfied and mapped to tests, and every test named in the matrix (corner cases included) exists and passes · required unit tests exist, TDD cycle done (or exempt with reason) · unit, integration, regression gates pass on the same `head_ref` · independent review `APPROVED` for that `head_ref`, no unresolved critical finding · security review `APPROVED` or `N/A: <reason>` · lint/typecheck/build pass or `N/A` per `gates.json` · docs `UPDATED` or `N/A: <reason>` · unit Log and dashboard current · `validate.mjs all` exits 0 · evidence report (§13) recorded. Fewer than all = not done, and must be reported as such.

## 13. Evidence-based completion

Completion is reported from `node .agent/tools/validate.mjs evidence <ID>` output (facts read from machine-written files), never composed from memory. It contains: unit, status, ACs satisfied n/N, per-gate PASS/FAIL/N/A with test counts, code/security review verdict with model and commit, files changed, known issues. Anything not verified is written as `UNVERIFIED`/`MISSING` — never omitted, never rounded up to PASS.

## 14. Tests: modification and regression rules

- Tests are written **before** implementation from the matrix. Never weaken, delete, skip (`.skip`, `.only`), or loosen an assertion to make code pass.
- Changing or deleting a pre-existing test is allowed only when the test is demonstrably wrong or the requirement intentionally changed. It requires a decision record (`kind: test-change`, `unit: <ID>`, the test path, the old and new expectation, why). `validate.mjs state` fails without it.
- Every fixed defect gets a regression test that fails without the fix. Every new user-visible behavior gets at least one integration/regression test; changed behavior expands the existing test, with the change documented.
- `tests/regression/REGISTRY.md` maps each regression test → originating unit/requirement so the suite reads as a living specification. Regression tests are never removed for convenience.
- Flaky tests are defects: quarantine only via decision record with owner and unit to fix; never silent retry loops.

## 15. Handoffs

All agent-to-agent communication flows through the orchestrator (flat topology) and is a file from `.agent/templates/handoff.md`, not chat. Required fields: `unit`, `from`, `to`, `state`, `model_attested`, `context`, `acceptance_criteria`, `relevant_files`, `tests_created`, `tests_run` (run-gate file paths), `results`, `decisions`, `risks`, `outstanding_issues`, `required_next_action`. A receiving agent that finds a field missing or a claim it cannot verify returns `BLOCKED` naming the gap instead of proceeding on assumption. Agents answer the orchestrator with the handoff path plus ≤5 lines.

## 16. Verification discipline

Agents must execute tools to verify (read, grep, run-gate, git diff, logs) rather than assume. Reviewers and the orchestrator re-run gates themselves; they do not trust another agent's pasted output. If verification is impossible (e.g. no browser available for a visual check), record that as `UNVERIFIED` with the reason and residual risk — do not claim success.
