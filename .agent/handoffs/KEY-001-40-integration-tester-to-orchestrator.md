---
unit: KEY-001
from: integration-tester
to: orchestrator
sequence: 40
model_attested: claude-sonnet-5
state: IN_PROGRESS
---

# Handoff KEY-001-40: integration-tester → orchestrator

## Context
Executed dispatch `.agent/handoffs/KEY-001-39-orchestrator-to-integration-tester.md` in full, on
branch `agent/KEY-001-keyboard-input`. Added exactly the one named test `r4` F-1 asked for to
`tests/integration/keyboard.test.js`; touched no other file, `script.js` read-only (an `Edit` on it
was attempted to draft the M29 mutation and was correctly BLOCKED by the write-guard hook — used
the sanctioned `CALC_STUB_TRANSFORM` in-memory hook instead for all three probes). Passes on the
current, unmodified `script.js` and is genuinely discriminating against all three mutations F-1
named. Tree clean; `node .agent/tools/validate.mjs state` → `OK`.

## Acceptance criteria
AC-6, AC-7 (`.agent/units/KEY-001.md`) — already SATISFIED in behavior per `r4`; this dispatch adds
the missing action-button pin so D-013's case-set table row "Enter | yes | action button" is
provably true.

## Relevant files
- `tests/integration/keyboard.test.js` — only file changed. One new test appended at the end of the
  AC-7 section, after "holding Enter on a Tab focused operator button performs the action once".

## Tests created / executed
- created:
  - `tests/integration/keyboard.test.js` :: `the DEL button reached by Tab and activated by a held Enter deletes exactly once` (F-1)
- executed (run-gate evidence, all at head `ae9d7c89` (code commit), dirty=false):
  - `.agent/test-results/KEY-001/latest-unit-final.json` — 83 tests, 83 pass (unchanged)
  - `.agent/test-results/KEY-001/latest-integration-final.json` — 50 tests, 50 pass (49→50, +1)
  - `.agent/test-results/KEY-001/latest-regression-final.json` — 25 tests, 25 pass (unchanged)
  - `.agent/test-results/KEY-001/latest-lint-final.json` — PASS
  - These four evidence pointers were then committed in `50388da` (evidence commit, head field
    correctly reads the parent code commit `ae9d7c89`, the same established pattern r3's own
    handoff and r4's review both validated as inert drift).

## Results
Counts match the dispatch's expectations exactly: unit 83 (unchanged), integration 50 (49+1, the
new row), regression 25 (unchanged, no regression test touched), lint PASS. No existing test was
edited, skipped, or loosened (`validate.mjs state` = OK; `git diff --name-status 79e1d04..HEAD`
touches `tests/integration/keyboard.test.js` (+19 lines only) plus the four evidence pointers, no
other file).

**Discriminating-mutation proof** (in-memory only, via `CALC_STUB_TRANSFORM`; nothing on disk
modified — `git status --short` clean after every probe, `diff script.js <backup>` confirmed
byte-identical throughout):

| Probe | Mutation (matches review F-1 exactly) | Result on `tests/integration/keyboard.test.js` + `tests/regression/**` (53 tests) |
|---|---|---|
| M29 | `isCalculatorButton` drops the `action` term: `const { number, operator, action } = element.dataset; return … \|\| action !== undefined;` → `const { number, operator } = element.dataset; return number !== undefined \|\| operator !== undefined;` | 52 pass / **1 fail** — only the new DEL row fails: `current: '123'` vs expected `'12'` (evaluated via `=` instead of deleting). Every other row, including the three prior AC-6/AC-7 rows, stays green. |
| M27 | branch condition gains `&& event.target.dataset.action === undefined`, so the Enter/Space-on-button guard skips action buttons | 52 pass / **1 fail** — only the new DEL row fails, same `'123'` vs `'12'` mismatch. |
| M31 | repeat guard gains the same exclusion: `if (event.repeat) {` → `if (event.repeat && event.target.dataset.action === undefined) {` | 52 pass / **1 fail** — only the new DEL row fails: `current: '0'` vs expected `'12'` (all three deletes applied instead of one, matching r4's measured table exactly). |
| baseline | none | 53 pass / 0 fail |

Each mutation is killed by exactly the new test and by nothing else — confirms it is genuinely
discriminating, not an incidental bystander. Effect on M31 (`'0'`, all three deletes fire) matches
`r4`'s own measured table row for row 3 verbatim.

## Decisions made
None new. D-013 (already accepted, its table already names this exact test in the "Enter | yes |
action button" row) fully covers this dispatch; no code change was made or needed, so no
fix-shaped decision applies. No registry update: this test is integration-only, following the same
pattern as its AC-6/AC-7 siblings, none of which appear in `tests/regression/REGISTRY.md`.

## Known risks
- Same residual `UNVERIFIED` real-browser risk D-013 already recorded (RK-3): `preventDefault()`
  suppressing a repeated native-activation `keydown` is modelled by `tests/helpers/dom-stub.js`'s
  deliberate approximation, not re-verified here, not newly introduced by this dispatch.
- `r4` F-2/F-3/F-4/F-5 (D-013 table/Consequences wording — already corrected in `4c58e60` per the
  git log — matrix rows for the three review-driven tests, the `mapKey` copy-guarantee comment, and
  the `head_ref`/branch-tip drift pattern) are unaddressed by this dispatch — out of scope per the
  dispatch's `Relevant files`/`Required next action`, forwarded unresolved. The optional second `AC`
  row F-1 suggested is not added: the dispatch asked for exactly one test.

## Outstanding issues
None from this dispatch.

## Required next action
Orchestrator: verify `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`
independently, confirm `git log` shows `ae9d7c89` (test commit) then `50388da` (evidence commit) on
`agent/KEY-001-keyboard-input`, and dispatch a fresh cycle-5 review on `50388da` (a new commit landed
after `377024ba`, the SHA `r4` reviewed).
