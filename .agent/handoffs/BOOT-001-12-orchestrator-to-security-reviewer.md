---
unit: BOOT-001
from: orchestrator
to: security-reviewer
sequence: 12
model_attested: claude-sonnet-5
state: REVIEW
---

# Handoff BOOT-001-12: orchestrator → security-reviewer

FALLBACK(opus->sonnet): the orchestrator session runs on claude-sonnet-5 (announced to the user). You are an Opus agent: attest your own runtime model in your review; if you are not running on Opus, say so prominently and stop with BLOCKED.

Facts only. You are not given the implementer's justification and must not seek it (handoff files `BOOT-001-06`, `-08`, `-10` are off limits).

## Context
Independent security review of unit `BOOT-001`. Why it is in scope (CLAUDE.md §8: input handling, DOM injection surfaces): the unit rewrote the DOM layer `script.js` (display writes, click handling, translation of `data-*` attributes into calculator inputs) and added `calculator-core.js`, which receives those inputs. Assume attacker-controlled DOM content: button `data-*` attributes and their values.

Verified by the orchestrator:
- `base_ref` = `e02035bab13f5365a110b60a86ba3a8ae42063ed`, `head_ref` = `28a19873b0c03224e111afb30e44829c919c9945`; `git rev-parse HEAD` equals `head_ref`. Product and test files are committed and clean. **`.agent/` has uncommitted working-tree changes on purpose** (evidence is SHA-bound; `run-gate` excludes `.agent/` from its dirty check). Do not treat that as BLOCKED. Do **not** commit, stash, checkout, reset or otherwise change git state.
- Shipped files: `index.html`, `script.js`, `calculator-core.js`. Baseline for comparison: `git show e02035b:script.js`.
- Static-scan tests for the security rules exist in `tests/regression/source-safety.test.js` with a helper `tests/helpers/source-scan.js`; page-level markup-write traps live in `tests/helpers/dom-stub.js` and `tests/integration/dom-click.test.js`.
- Machine evidence at `head_ref`: `.agent/test-results/BOOT-001/latest-{unit,integration,regression,lint}-final.json`.
- Project security rules: `CLAUDE.md` §4 "Security" (no `eval`/`new Function`/`innerHTML` with input-derived data, use `textContent`; no third-party scripts, CDNs or new dependencies; do not read or write outside the repository; no secrets) and D-001 (`.agent/decisions/D-001-toolchain.md`).
- Scope note: keyboard input does not exist yet; it is a later unit. Review what is in the diff.

## Acceptance criteria
`.agent/units/BOOT-001.md` AC-1 (purity, no `document`/`window` access), AC-6, AC-7 (static safety of the three shipped files) are the security-relevant ones. `.agent/decisions/D-003-core-api.md` is an artifact under review (its unrecognized-input policy in particular), not evidence.

## Relevant files
- `script.js`, `calculator-core.js`, `index.html`
- `tests/regression/source-safety.test.js`, `tests/helpers/source-scan.js`, `tests/helpers/dom-stub.js`, `tests/integration/dom-click.test.js`
- `.agent/units/BOOT-001.md`, `.agent/units/BOOT-001.matrix.md`, `.claude/skills/review-security/SKILL.md`

## Tests created / executed
Evidence paths above. Re-run yourself.

## Results
n/a

## Decisions made
n/a

## Known risks
Stated in the unit: the DOM stub cannot model a real browser; a real-browser check is not possible in this environment. The comment stripper in `tests/helpers/source-scan.js` is documented as unable to handle a regex literal containing a quote or `//`.

## Outstanding issues
none

## Required next action
1. Map every input-to-sink path in the diff: what user- or DOM-controlled value can reach the core, what the core does with it, and every place text is written to the page. Verify by reading the code, not the comments.
2. Try to break the boundary: unusual `data-*` values (non-string-like, multi-character, empty, markup, prototype-keyed strings such as `constructor` or `__proto__`), multiple `data-*` attributes on one element, events whose target is not a button, and malformed descriptors passed straight to the core. Run your experiments **without changing any file on disk** (`git status` identical before and after; use `node -e`/stdin scripts or the stub helper; write nothing outside the repo).
3. Check the static-scan tests for blind spots (patterns an attacker-shaped or careless edit could evade), the export guard, global exposure (`globalThis`), error-message leakage, and that no dependency, network reference or secret was added.
4. Re-run the regression and integration suites yourself and state the counts.

Write `.agent/reviews/BOOT-001-sec1.md` from `.agent/templates/review.md` (verdict `APPROVED` / `CHANGES_REQUIRED` / `BLOCKED`, `reviewed_ref` = the exact 40-hex `head_ref`; each finding needs severity, exploit or impact reasoning and a concrete fix; justify any "no surface" conclusion with what you examined). Write your return handoff to `.agent/handoffs/BOOT-001-15-security-reviewer-to-orchestrator.md`. Reply with the verdict, review path and at most 5 lines.
