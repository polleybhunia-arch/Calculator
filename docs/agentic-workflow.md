# Agentic development workflow — design, critique, verification status

Rules live in [CLAUDE.md](../CLAUDE.md). This document explains *why* the system is shaped this way, maps your requirements to files, records weaknesses, and states exactly what has and has not been verified. Start a session with `claude --agent orchestrator`.

## 1. Design in one page

```
                       user
                        │  (AskUserQuestion for blocking ambiguity)
                ┌───────▼────────┐  opus, main session, only holder of the Agent tool
                │  orchestrator  │  owns unit status/Log · runs authoritative gates · never writes product code
                └───────┬────────┘
   ┌────────┬───────────┼───────────┬─────────────┬────────────┐
 planner  test-     implementer  integration-   reviewer   security-/architecture-   debugger  refactorer  documenter
 (opus)   designer   (sonnet)     tester        (opus)     reviewer (opus)           (sonnet)  (sonnet)    (sonnet)
          (sonnet)               (sonnet)
 ─────────────── flat: workers cannot spawn agents (only orchestrator has `Agent`; spawn depth = 1) ───────────────

 Enforcement is deterministic where possible (prompts alone drift):
   run-gate.mjs   executes gates, writes machine evidence bound to commit SHA, rejects vacuous passes
   validate.mjs   checks state/transitions/evidence/review-binding/model policy/agent contracts
   write-guard    PreToolUse hook: role-based write ownership; governance + evidence not agent-writable
```

**Why these mechanisms** (all confirmed against current Claude Code docs):
- Per-call `model` on the Agent tool *overrides* the agent's frontmatter, and `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` overrides everything. Both are silent-downgrade routes, so the orchestrator is forbidden to pass `model` (the single exception is the approved, logged Opus→Sonnet fallback), and `validate.mjs agents` fails if the FORCE variable is set in the environment or any settings file.
- Subagents *can* nest up to 3 levels by default, so flat topology is enforced (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`, orchestrator-only `Agent(...)` allowlist, validator check).
- The `skills:` frontmatter preloads full skill text into the agent. Each agent preloads only what it needs; optional skills (`api-testing`, `database-testing`) are on demand.
- Agents self-report; a prompt cannot make that trustworthy. So evidence is *produced by tools* (run-gate) and *checked by tools* (validate), and the reviewer/orchestrator re-run gates themselves.

## 2. Your 24 sections → where they live

| Request | Location |
|---|---|
| 1 Principles · 5 TDD · 16 DoD · 13 Evidence · 14 Failure handling | CLAUDE.md §5, §14, §12, §13, §10 |
| 2 CLAUDE.md | [CLAUDE.md](../CLAUDE.md) |
| 3 Skills (15) | [.claude/skills/](../.claude/skills/) |
| 4 Tools | §3 below; commands in CLAUDE.md §3, gates in [.agent/gates.json](../.agent/gates.json) |
| 5–8, 18–19 Agents + model contract | [.claude/agents/](../.claude/agents/) (each has the 10-part contract; validated) |
| 9 Cumulative regression | `regression-testing` skill · CLAUDE.md §14 · [REGISTRY.md](../tests/regression/REGISTRY.md) · validator test-change rule |
| 10 RALPH | CLAUDE.md §6 (Research·Arrange·Launch·Prove·Harden, stop conditions, test-failure loop with stagnation pause) |
| 11 Gates | CLAUDE.md §11 |
| 12 State | CLAUDE.md §9, [.agent/](../.agent/), templates |
| 15 Handoffs | CLAUDE.md §15, [.agent/templates/handoff.md](../.agent/templates/handoff.md) |
| 20–24 Model enforcement/awareness | CLAUDE.md §8, [model-policy.json](../.agent/model-policy.json), orchestrator Step 0, `validate.mjs` |

## 3. Tool requirements

| Need | Tool |
|---|---|
| Read / search / edit / create files | `Read`, `Grep`, `Glob`, `Edit`, `Write` |
| Run unit/integration/regression/lint/typecheck/build | `Bash` → `node .agent/tools/run-gate.mjs <gate> --unit <ID>` |
| Git status / diff / log / bisect | `Bash` (`git …`), `change-analysis` skill |
| Debug failures, inspect logs | run-gate `outputTail`, `debugging` skill, scratch worktree |
| Static analysis | `node --check` (lint gate); reviewer reads; ESLint would be a new dependency (D-001) |
| Delegation, questions | `Agent(...)` (orchestrator only), `AskUserQuestion` (orchestrator only) |

Tool allowlists are least-privilege per agent (see frontmatter): reviewers/security/architecture/debugger have no `Edit`; only the orchestrator has `Agent`.

## 4. Agent × responsibility × model × skills

| Agent | Model | Preloaded skills | May write (hook-enforced) |
|---|---|---|---|
| orchestrator | opus | change-analysis | `.agent/**` (minus governance/evidence) |
| planner | opus | requirements-analysis, technical-planning | plan, units, decisions, handoffs |
| test-designer | sonnet | test-design, regression-testing | `units/*.matrix.md`, handoffs |
| implementer | sonnet | tdd | anything except unit state/reviews/diagnoses/plan + governance |
| integration-tester | sonnet | integration-testing, regression-testing (+api/database on demand) | `tests/integration`, `tests/regression`, `tests/helpers`, decisions, handoffs |
| reviewer | opus | review-code, change-analysis, performance-analysis | `reviews/`, handoffs |
| security-reviewer | opus | review-security | `reviews/`, handoffs |
| architecture-reviewer | opus | review-architecture | `reviews/`, decisions, handoffs |
| debugger | sonnet | debugging | `diagnoses/`, handoffs |
| refactorer | sonnet | tdd | anything except **tests**, unit state, reviews |
| documenter | sonnet | documentation | `docs/`, `README.md`, handoffs |

## 5. Weaknesses, failure modes, improvements

Legend: **Done** = implemented and tested here · **Partial** · **Open** = needs your decision or a live run.

| # | Weakness / failure mode | Mitigation | Status |
|---|---|---|---|
| 1 | Prompt-only discipline drifts; agents "forget" rules | write-guard hook, validator, run-gate; CLAUDE.md kept short, detail in machine-readable files | Done (hook live behavior: see §7) |
| 2 | Self-reported evidence can be fabricated | Evidence is tool-written, SHA-bound, requires clean tree; reviewer + orchestrator re-run gates; `evidence` report is generated from files | Partial — an agent with `Bash` could still hand-write a result file (Bash isn't path-guarded) |
| 3 | Vacuous green (0 tests, exit 0) | `min_tests` per gate; RED must have exit≠0 | Done |
| 4 | Stale approval (code changed after review) | `reviewed_ref == head_ref` check; no commit between APPROVED and COMPLETE | Done |
| 5 | Silent model downgrade | Frontmatter `model` + policy check; `model` param forbidden except the approved Opus→Sonnet fallback; FORCE env detected; Step-0 self-check; `agent@model` in Log checked against policy; fallback must be logged as `FALLBACK(opus->sonnet)`, Sonnet reviews set `review_fallback` and evidence reads REDUCED ASSURANCE; Sonnet-family has no fallback → BLOCKED | Partial — model attestation is self-reported; the env var could be set outside scanned files; a Sonnet review is weaker independence by design |
| 6 | Weak tests pass review ("false confidence") | Test-designer matrix ≠ implementer; reviewer must run mutation probes; AC verdicts machine-read | Partial — probes are a reviewer duty, not tool-enforced |
| 7 | Tests weakened/deleted to go green | Modified/deleted pre-existing tests need a `test-change` decision (validator); refactorer cannot edit tests (hook) | Done |
| 8 | Implementer marks own homework | Implementer cannot edit unit state/reviews (hook); reviewer gets facts only, not justification | Done |
| 9 | Fix loops / thrash (now uncapped by your decision) | Loop until green; failure signatures: ×2 debugger mandatory, ×3 architecture-reviewer, same signature surviving that twice more → pause `STAGNATION` and ask you | Partial — orchestrator-counted (prompt), not tool-counted; cost is unbounded by design |
| 10 | Lost context / compaction | All state on disk; Step 0 re-derives from files; dashboard generated | Done |
| 11 | Ceremony overwhelms small tasks | Tiers T0–T2, recorded not silent | **Open** — see decision Q1 |
| 12 | Parallel work causes conflicts | Sequential by default; parallel only with disjoint files + worktree isolation | Partial |
| 13 | Ambiguous requirements guessed | Planner lists open questions; orchestrator must `ASK` before `READY` | Partial (prompt) |
| 14 | Cost: Opus at orchestrator + every review; preloaded skills consume context | Sonnet for execution; small skills; per-agent preloads; only 3 Opus review roles, security/architecture conditional | Open — measure on first real unit |
| 15 | No real-browser verification; DOM stub may differ from browsers | Recorded as `UNVERIFIED`; D-001 lists Playwright as an opt-in dependency | **Open** — Q3 |
| 16 | Existing `script.js` is untestable (DOM at load, globals) and ES modules would break `file://` | First unit `BOOT-001`: characterization tests via `node:vm` + DOM stub, then dual-export seam | Planned, not started (per your instruction not to touch product code) |
| 17 | Model aliases (`opus`/`sonnet`) drift to new versions | Policy accepts alias or full ID of the family; log records attested full ID | Open — pin to full IDs if you want reproducibility |
| 18 | `settings.local.json` (yours, git-ignored) allows `git push *` | `permissions.deny` for `git push*` and `git * push*` in `.claude/settings.json` (deny beats allow); validator fails if the deny is removed | Done in config; deny precedence is documented behavior but not exercised live (see §7). Removing your local allow rule is still tidy |
| 19 | Reviewer scratch worktrees/mutations could pollute repo | Skill mandates scratch outside repo; reviewer has no Edit; hook blocks writes to code | Partial |
| 20 | Gate commands are Windows/Git-Bash sensitive | Node-only commands, quoted globs; suite passes here | Done (this OS only) |

## 6. Decisions I made that you may want to change

- **Q1 Tiering / T0 skips review** *(still open)* — you said never skip a stage silently; T0 (no executable change) is a *recorded* fast path. If you want the full pipeline always, delete the tier table in CLAUDE.md §7.
- **Q2 Gate order — LOCKED by you: tests first, then review.** Integration/regression tests are authored before review and re-run authoritatively on the approved SHA (CLAUDE.md §11). You also locked the loop: implementer↔debugger repeat until the unit is green and every matrix-named corner case exists and passes (CLAUDE.md §6). I added a *stagnation pause* (same failure surviving an architecture review twice more → ask you) instead of a cap; delete that sentence in §6 if you want truly unbounded looping.
- **Q3 Zero-dependency toolchain (D-001) — ACCEPTED by you.** lint=`node --check`, typecheck/build `N/A`.
- **Q4 Debugger diagnoses, never fixes** — an extra hop, but it stops "edit until green". Say if you want it to patch.
- **Q5 Flat topology** — no agent-to-agent delegation; costs orchestrator context, buys single-writer state.
- **Q6 Skill names** — `review-code`/`review-security` (not `code-review`/`security-review`) to avoid colliding with the bundled skills of those names.
- **Q7 Commits/push — push is LOCKED OFF by you.** Agents commit on `agent/<ID>-*` branches (needed for SHA-bound evidence); `git push` is denied in `.claude/settings.json`; you push.
- **Q8 Model fallback — DEFINED by you: Opus → Sonnet on unavailability only.** My interpretation of "unavailable": model not accessible/enabled, or still failing after 2 same-model retries (not slowness, cost or tokens). Logged, flagged as REDUCED ASSURANCE for reviews; Sonnet agents have no fallback. If the orchestrator *session itself* is not on Opus it announces this and prefixes every Log line with the fallback marker.

## 7. Verification status (honest)

**Verified by execution here** — `node --test ".agent/tools/tests/*.test.mjs"`: 54/54 pass (~20–40 s). Covers frontmatter/glob lib, guard policy and the hook as a real subprocess with native Windows paths, run-gate (real command execution, dirty detection, vacuous-pass rejection, id/phase injection), validator (35 tests: a COMPLETE happy path, fallback rules, corner-case existence, push-deny, dashboard/evidence rendering, and about two dozen negative cases: illegal transitions, model mismatch, stale review, stale/dirty/failed gates, RED/GREEN evidence, AC↔matrix↔review coverage, test-change decisions, deps/cycles, agent contract/model/tools/skills, FORCE env). Mutation probes (disabling the stale-review check, the matrix-test-exists check, and the fallback-marker check) were each caught by their targeted tests. `validate.mjs all` exits 0 on this repo; `run-gate lint` passes on the real `script.js`; `run-gate unit` correctly refuses to pass with 0 tests.

**Not verified — needs one live run** (these depend on Claude Code runtime behavior I could not exercise from inside this session; new agent files may need a session restart):
1. `claude --agent orchestrator` starts on Opus and can spawn only the allowlisted agents.
2. Each subagent actually runs on its declared model (ask each to state its model; the log records it).
3. The PreToolUse hook receives `agent_type` for subagent calls and blocks as designed (I verified the script, not the harness wiring). If `agent_type` is absent, the guard **fails open** to "human session".
4. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` still lets the main-session orchestrator spawn workers.
5. Frontmatter `tools: Agent(a, b)` syntax as the main thread.
6. A project `deny` for `git push` overrides the `git push *` allow in your `settings.local.json` (ask the orchestrator to push a throwaway branch; it must be refused).
7. The `model: "sonnet"` per-call override actually re-runs an Opus agent on Sonnet (needed for the fallback path).

**Smoke test**: `claude --agent orchestrator` → "Dry run: for each agent, spawn it and have it report its runtime model and try to write `script.js`; do not change any files that survive." Expect 11 correct model reports and hook denials for non-implementers. If any check fails, treat the corresponding enforcement as absent.

**Not done, by design**: no product code changed; nothing committed; `BOOT-001` not started.

## 8. Reusing this in another project

Change: CLAUDE.md §1 (purpose/stack/structure) and §4 (conventions), `.agent/gates.json`, `write-policy.json` paths, the "this repo" paragraphs in `integration-testing`/`test-design`/`review-*` skills, D-001. Keep unchanged: agent contracts, model policy, tools, templates, RALPH/gates/DoD.
