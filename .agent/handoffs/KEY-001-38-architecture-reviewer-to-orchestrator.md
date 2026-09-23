---
unit: KEY-001
from: architecture-reviewer
to: orchestrator
sequence: 38
model_attested: claude-opus-5
state: REVIEW
---

# Handoff KEY-001-38: architecture-reviewer → orchestrator (cycle 4)

## Context
Full fresh structural review at `head_ref` `377024ba68675fc48a3f0e5c07f881858d24e746`.
Verdict **APPROVED**. Review file: `.agent/reviews/KEY-001-arch4.md` (`cycle: 4`,
`reviewed_ref: 377024ba68675fc48a3f0e5c07f881858d24e746`).

I am running on Opus (`claude-opus-5`) — no review fallback applies to this verdict, despite the
orchestrator session's `FALLBACK(opus->sonnet)`.

Dispatch's two questions, answered from my own evidence:
1. **No product file changed since my cycle-3 `APPROVED`.**
   `git diff --name-status fc93ff7a..377024ba -- . ':(exclude).agent'` → one line,
   `M tests/integration/keyboard.test.js`, +40/−0. `script.js`, `calculator-core.js`, `index.html`,
   `style.css` and `tests/helpers/dom-stub.js` are byte-identical to `fc93ff7a`.
2. **`D-013`'s case-set table is now fully pinned.** Every cell names a test; the previously
   `unpinned` held-`Space` cell is closed, and the "regardless of input type" clause of the
   `Enter`-repeat cell is now pinned by a non-digit button for the first time.

Ref note: `git rev-parse HEAD` = `6f104c6b`, two commits after `head_ref`;
`git diff 377024ba..HEAD -- . ':(exclude).agent'` is empty (`.agent`-only drift, same pattern as
r1 F-8).

## Acceptance criteria
AC-1..AC-8 all **SATISFIED** (per-AC evidence in the review). AC-6 — the criterion this dispatch
names — is satisfied with the full case-set table re-derived at this ref.

## Relevant files
- `.agent/reviews/KEY-001-arch4.md` — this verdict (written by me)
- `tests/integration/keyboard.test.js:425-463` — the two new rows, the entire delta
- `script.js:88-118` — the reviewed branch, unchanged at this ref
- `.agent/decisions/D-013-native-activation-is-the-browser-channel.md` — accepted; clause 3 table now
  stale in two cells (F-1)
- `.agent/units/KEY-001.matrix.md:90, 188` — traceability gap widened (F-2)

## Tests created / executed
Created: none (reviewers write no tests). Executed independently, by running the `gates.json` commands
directly rather than `run-gate.mjs`, because the dispatch forbids changing files and `run-gate` would
overwrite the SHA-bound `latest-*.json` evidence:

- `node --test "tests/unit/**/*.test.js"` → 83 pass / 0 fail
- `node --test "tests/integration/**/*.test.js"` → 49 pass / 0 fail
- `node --test "tests/regression/**/*.test.js"` → 25 pass / 0 fail
- `node --check script.js && node --check calculator-core.js` → pass
- `node .agent/tools/validate.mjs state` → `state: OK`, exit 0 (read-only)

Cross-checked against `.agent/test-results/KEY-001/latest-{unit,integration,regression,lint}-final.json`:
all four carry `head: 377024ba68675fc48a3f0e5c07f881858d24e746`, `dirty: false`, counts 83 / 49 / 25 /
lint-pass — matching my runs exactly.

## Results
Mutation probes, run in memory via `CALC_STUB_TRANSFORM` (nothing written to disk):

| Probe | Mutation | At `377024ba` | At `fc93ff7a` |
|---|---|---|---|
| M1 | guard body disabled | 46 pass / **3 fail** | 46/1 |
| M3 | `preventDefault()` dropped, `return` kept | 46 pass / **3 fail** | 46/1 |
| M4 | narrowed to `event.key === 'Enter'` | 48/**1** — only the new Space row | **47/0 — escaped** (`arch3` F-1) |
| M5 | narrowed to digit buttons (the `D-012` shape) | 48/**1** — only the new operator row | not probed |

M4 and M5 each kill exactly one row, and different rows: the two new tests are orthogonal and neither
is redundant with the cycle-3 row. Both new rows also fail if the non-repeat press were
over-suppressed, so "acts once" is pinned against zero-action as well as many-action.

Structural audits re-run at this ref: core pure (`document`/`window` `undefined`, six exports
unchanged); exactly one mutable binding in `script.js` (`let state`); one `applyInput` call; two
`textContent` writes, both inside `updateDisplay`; zero `.click(` in code; no `package.json`; zero
`type="module"`. No new helper, no new abstraction, no stub change, no production test hook.

## Decisions made
**No decision record proposed.** `D-013` already states the rule and the case set; this cycle confirms
its table rather than extending it. A second record for a two-cell correction would reproduce the
indirection F-1 objects to — the fix is an in-place amendment to `D-013`, not a supersession.

## Known risks
Unchanged from cycle 3, all `UNVERIFIED` under RK-3 (no browser): whether a real browser activates a
button on `Space` **keyup** rather than keydown, and how it treats a cancelled *repeat* keydown — the
two real outcomes for held `Space` are "acts once" (expected) and "acts zero times". The new tests pin
the policy against `dom-stub.js`'s keydown-only model; they cannot settle browser semantics.
`KEY-001.md:146-154` manual checklist items 3–5 remain the closure path and item 4 already states the
"not zero times" expectation correctly.

## Outstanding issues
No Critical and no Major finding. Three non-blocking findings, **none requiring a product-code change**:

- **F-1 (Minor)** — `D-013` is stale in the cell this review confirms: row 4's `pinned by` still reads
  "**unpinned** … leaves the suite 47/47 green", refuted by probe M4 (48/1); the Consequences section
  still lists the held-`Space` cell as an open follow-up. Its own clause 3 binds future work to keep
  the table true. Fix: amend rows 2 and 4 to name the two new tests and strike the closed bullet.
  ≈4 lines of prose, no commit to product files, no gate impact.
- **F-2 (Minor)** — `arch3` F-3 widened from one instance to three: none of the three native-activation
  repeat rows has a matrix entry, and matrix line 188's note ("no scenario … calls `preventDefault()`
  on a focused-button `Enter`/`Space`") is now false of three shipped rows. `validate.mjs` checks only
  matrix-row → test, so it exits 0 regardless. Fix: three matrix rows plus a one-line correction,
  ≈5 lines, test-designer's file. Consistent with how `arch2` F-2 / `arch3` F-3 were already carried.
- **F-3 (Nit)** — `script.js:95`'s comment still cites only the rejected `D-012`; no product file
  references the accepted `D-013`. Deliberately **not** to be fixed now: a product commit for a comment
  would invalidate the SHA-bound review and gate evidence at `377024ba` and restart gates 4–8
  (CLAUDE.md §11). Fold into the next unit touching this branch.

F-1 and F-2 are the same documentation debt seen from two files and are worth one combined pass; both
are `.agent/` edits only, so neither moves `head_ref` nor invalidates any evidence.

## Required next action
Record the `APPROVED` architecture verdict for `reviewed_ref` `377024ba68675fc48a3f0e5c07f881858d24e746`
against `.agent/reviews/KEY-001-arch4.md`, and decide the disposition of F-1/F-2 (amend now as an
`.agent/`-only documentation pass, or carry as known issues under the standing fix-only-Majors
decision) — either choice is compatible with `APPROVED`; F-3 should be carried, not fixed.
