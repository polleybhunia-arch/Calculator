---
unit: KEY-001
reviewer: architecture-reviewer
model_attested: claude-opus-5
reviewed_ref: 8c36740af901c680ee4305fcbb0684222201777d
verdict: APPROVED
cycle: 5
---

# Review KEY-001 arch5 — verdict: APPROVED

Fresh full structural review at `head_ref` `8c36740a`. Scope is structure — `D-005` clauses 1–7,
`D-013`'s case-set table and its accuracy, boundaries, coupling, hidden state, testability seams,
extensibility, constraints, migration cost. Code correctness per AC and security are the other two
reviewers' scope.

**Model attestation**: I am running on Opus (`claude-opus-5`). The orchestrator session is on Sonnet
(`FALLBACK(opus->sonnet)`, dispatch `KEY-001-43`); that fallback does **not** extend to this review,
which is a full-assurance Opus review.

**Independence**: I did not open handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24`, `-32`, `-40` (off
limits by dispatch). No implementer or integration-tester rationale informs any statement below;
every claim comes from the shipped files, the tests, the git history and the probes in "What I ran
myself". `D-011` and `D-013` were read as artifacts to judge, not as proof.

**Ref note (verified)**: `git rev-parse HEAD` is `ee66c607`, two commits after `head_ref`.
`git diff 8c36740a..HEAD -- . ':(exclude).agent'` is **empty**, so every product and test file I read
is byte-identical to `head_ref`. The drift is `.agent`-only (same pattern as r1 F-8, arch2–arch4).
`git status --porcelain` was empty before and after every command; I changed no file except this
review and my handoff.

**The delta, verified myself**: `git diff --name-status 377024ba..8c36740a -- . ':(exclude).agent'`
returns exactly one line, `M tests/integration/keyboard.test.js`, +19/−0. And
`git diff --stat fc93ff7a..8c36740a -- script.js calculator-core.js index.html style.css
tests/helpers/dom-stub.js` is **empty**: **no product file has changed since my cycle-3 approval**,
three commits and three review cycles ago. Cycles 4 and 5 are test-only. My structural analysis of
the shipped code therefore carries forward on a git-proven basis; I nonetheless re-ran the purity,
state and constraint audits myself (probes C, S, K) rather than assert it.

**The dispatch's question — is `D-013` now accurate? Yes for clause 3's table, which is what AC-6
turns on; no for one bullet in its Consequences section (F-1).** I re-derived every row of the table
against the shipped test names and against mutation probes, including the two cells the record
declares open. All seven rows are true as written, and the declared gap is real (probe M8). One
follow-up bullet the cycle-4 correction was asked to strike is still listed as open although it was
closed in cycle 3.

No Critical and no Major finding is open. Three findings (two Minor, one Nit) plus one carried Nit
are recorded with cost/benefit; none blocks `APPROVED`, none asks for a product-code change, none is
a rewrite proposal. The Minor/Nit findings the user deferred in cycles 1–4 remain open by that user
decision, are correctly carried in `.agent/units/KEY-001.md` Known Issues, and I re-verified they are
unchanged at this ref; I do not re-raise them.

## Acceptance criteria verdicts
- AC-1: SATISFIED — probe C loads `calculator-core.js` in bare Node with `document`/`window`
  `undefined`; it exports exactly `allowsRepeat, applyInput, createState, isInput, mapKey, render`.
  `mapKey` is still a pure core entry point; the core is byte-identical to `fc93ff7a`.
- AC-2: SATISFIED — the one-decimal-point rule stays in the core's `appendNumber`, not duplicated in
  the key path. Unchanged at this ref.
- AC-3: SATISFIED — operator entries are still derived from the core's `OPERATORS`, so the key channel
  cannot name an operator the core rejects. Unchanged.
- AC-4: SATISFIED — `Backspace`/`Escape`/`Delete` map onto existing `delete`/`clear` actions; no
  keyboard-only transition was added to the core. Unchanged.
- AC-5: SATISFIED — modifier filtering lives in the pure `mapKey`; `script.js` passes only
  `{ctrlKey, metaKey, altKey}` (`script.js:61-63`), and the document-level `preventDefault()` is
  still reached only after a non-`null` map result (`script.js:105-111`). The scope deviation
  (`arch3` F-2: a repeat `Space` on a focused calculator button *is* `preventDefault()`ed) remains
  recorded in `D-013` clause 4 and in the unit file's AC-5 carve-out (`KEY-001.md:67-70`).
- AC-6: SATISFIED, and this is the AC the dispatch asks me to confirm. Both halves hold, and
  **every row of `D-013` clause 3's table is accurate as written** — the six rows that claim a
  pinning test each name a test that exists and that dies to a targeted mutation, and the row-block's
  closing paragraph correctly declares the operator/action-under-`Space` cells unpinned (probe M8
  confirms: a mutation that suppresses `Space` repeats only for digit buttons leaves the suite
  50/50 green). The cycle-4 gap is closed at the family level: probes M6 (`isCalculatorButton` drops
  `data-action`) and M7 (repeat guard skips action buttons) each now fail **exactly one** test, the
  new DEL row, where at `377024ba` both survived.
- AC-7: SATISFIED — the document-level channel still applies the pure core predicate
  (`script.js:113-115`); the native-activation channel suppresses every repeat re-activation
  regardless of input type, and that clause is now pinned across all three button families
  (digit, operator, action) rather than argued from one example.
- AC-8: SATISFIED as a structural check only (docs are the documenter's and code reviewer's scope) —
  `README.md` is not in the diff and the behavior it describes is unchanged.

**`D-013` clause 3 table, re-derived at this ref.** Column "verified" is my own check that the named
test exists, passes, and is load-bearing for that cell.

| key | repeat | target | named test exists | discriminated by | verified |
|---|---|---|---|---|---|
| `Enter` | no | digit / equals | `keyboard.test.js:259, 279` | M9 (over-suppression) kills both | accurate |
| `Enter` | yes | digit | `keyboard.test.js:407` | M1, M3 | accurate |
| `Enter` | yes | operator | `keyboard.test.js:442` | M1, M3, M5 (kills only this + DEL) | accurate |
| `Enter` | yes | action (`DEL`) | `keyboard.test.js:465` | M1, M3, **M5, M6, M7** (M6/M7 kill only this row) | accurate |
| `Space` | no | digit / equals | `keyboard.test.js:269, 293` | M9 | accurate; label reads "digit button" but cites the equals row too (F-3) |
| `Space` | yes | digit | `keyboard.test.js:425` | M1, M3, M4 (kills only this row) | accurate |
| `Enter`/`Space` | either | anything else | AC-5 / AC-7 rows on `document.body` | unchanged | accurate |
| *declared gap*: `Space` × {operator, action} | — | — | none | **M8 survives 50/50** | gap is real and correctly declared |

The table is accurate and, per its own text, not exhaustive. The dispatch's question is answered:
**yes**, with the one Consequences-section exception in F-1.

## What I ran myself
No file on disk was changed outside this review and my handoff, and no git state was touched. As in
cycles 1–4 I ran the gate commands from `.agent/gates.json` **directly** rather than through
`run-gate.mjs`, because the dispatch forbids changing files and `run-gate` would rewrite
`.agent/test-results/KEY-001/latest-*.json`; the SHA-bound evidence at `head_ref` already exists and
my counts match it exactly. Every mutation probe ran **in memory** via the stub's
`CALC_STUB_TRANSFORM` hook, which rewrites source inside `vm` only (it throws if the occurrence count
differs, so a probe cannot silently miss, and it emits a process warning naming itself). I wrote no
probe file anywhere and drove every probe through environment variables.

| Command | Result |
|---|---|
| `node --test "tests/unit/**/*.test.js"` | 83 pass / 0 fail |
| `node --test "tests/integration/**/*.test.js"` | **50 pass / 0 fail** (was 49 at `377024ba`) |
| `node --test "tests/regression/**/*.test.js"` | 25 pass / 0 fail |
| `node --check script.js && node --check calculator-core.js` | pass |
| `node .agent/tools/validate.mjs state` | `state: OK`, exit 0 (read-only, no `--write`) |
| `git diff --name-status 377024ba..8c36740a -- . ':(exclude).agent'` | one file: `M tests/integration/keyboard.test.js`, +19/−0 |
| `git diff --stat fc93ff7a..8c36740a -- script.js calculator-core.js index.html style.css tests/helpers/dom-stub.js` | empty — no product change in three cycles |
| `git diff 8c36740a..HEAD -- . ':(exclude).agent'` | empty |

Recorded evidence cross-check — all four `latest-*-final.json` carry
`head: 8c36740af901c680ee4305fcbb0684222201777d`, `dirty: false`, and counts 83 / 50 / 25 / lint-pass,
matching my independent runs exactly.

**Mutation probes against the integration suite** (in-memory rewrite of `script.js`):

| Probe | Mutation | Result at `8c36740a` | At `377024ba` (cycle 4) |
|---|---|---|---|
| M1 | repeat guard body disabled (`if (false)`) | ✖ 46 / **4 fail** — all four native-repeat rows | ✖ 46/3 |
| M3 | `preventDefault()` dropped, `return` kept | ✖ 46 / **4 fail** — load-bearing for all four | ✖ 46/3 |
| M4 | guard narrowed to `Enter` only | ✖ 49 / **1 fail** — only the held-`Space` digit row | ✖ 48/1 (same row) |
| M5 | target narrowed to digit buttons (the `D-012` shape) | ✖ 48 / **2 fail** — operator row **and** DEL row | ✖ 48/1 |
| M6 | `isCalculatorButton` drops `data-action` | ✖ 49 / **1 fail** — only the DEL row | ✔ **survived 49/49** |
| M7 | repeat guard skips action buttons (`&& dataset.action === undefined`) | ✖ 49 / **1 fail** — only the DEL row | ✔ **survived 49/49** |
| M8 | `Space` repeats suppressed only for *digit* buttons | ✔ **survives 50/50** — the declared gap, reproduced | not probed |
| M9 | over-suppression (`if (true)`: first press suppressed too) | ✖ 42 / **8 fail** — every Tab-activation row | not probed |

M6 and M7 are the two mutants `r4` F-1 named as surviving; both now die, each to exactly the one new
row, and nothing else changes. M4, M5, M6/M7 kill disjoint or nested-by-design row sets, so no new row
is redundant with an older one. M9 is the check nobody asked for: the suite fails *hard* if the fix
were "improved" into suppressing the first press as well, so "acts once" is pinned against zero-action
as firmly as against many-action — at least within the stub's model.

| # | Probe | Result |
|---|---|---|
| C | core purity | `require('./calculator-core.js')` in bare Node: `typeof document`/`typeof window` `undefined`; exports `allowsRepeat, applyInput, createState, isInput, mapKey, render` — unchanged |
| S | state audit | `grep -nE "^\s*(let\|var) " script.js` → exactly one line, `12: let state = createState();`. `applyInput` → 2 (one destructure, one call in `dispatch`); `textContent =` → 2 (both inside `updateDisplay`); `.click(` → 2, both in comments (`script.js:78, 87`), 0 in code |
| K | constraints | no `package.json`; `grep -c 'type="module"' index.html` → 0; `index.html` not in the diff; `node --check` passes on both shipped files |

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | `.agent/decisions/D-013-native-activation-is-the-browser-channel.md:122-124` | **The cycle-4 correction reached clause 3's table but not the Consequences section, which still lists a closed item as an open follow-up.** The bullet reads "Open follow-ups it names, none blocking `KEY-001`: **the unpinned held-`Space` cell (`arch3` F-1, one integration row ≈16 lines)**; the **two** missing matrix rows and one stale matrix note". Both clauses are now false: `arch3` F-1's cell (held `Space` on a focused digit button) was pinned at `c0e1281e` and its absence is refuted by probe M4; and the count of review-driven native-activation tests with no matrix row is now **four**, not two (F-2). A reader who consults the record — the entire point of having written it — is told a cell is unpinned that the suite kills a mutant for, and is given a count that understates the real documentation debt by half. The record's table and its Consequences now disagree with each other, which is worse than either being stale alone, because a reader cannot tell which section was maintained. `arch4` F-1 clause (c) asked for exactly this strike and it is the one part of that finding not applied. | Amend `D-013` in place (it documents shipped behavior: no code, no commit to product files, no gate impact): replace the closed held-`Space` bullet with the *still-open* gap the table now names — operator and action buttons under `Space` (two rows ≈32 lines, or the deliberate acceptance in the note below) — and change "two missing matrix rows" to four. ≈2 lines of prose in one file. **Pair it with the clause-5 amendment proposed under "Proposed decision"**, so the record is touched once more and then stops moving. |
| F-2 | Minor | `.agent/units/KEY-001.matrix.md:87-90, 188` vs `tests/integration/keyboard.test.js:407, 425, 442, 465` | **`arch3` F-3 / `arch4` F-2 has widened again, from three instances to four.** The matrix is the AC→test map the DoD is read against and is meant to read as the specification (CLAUDE.md §9, §12). Grepping the matrix for `holding` / `Tab focused` returns only the four pre-existing AC-7 `document.body` rows (lines 87–90); **none** of the four native-activation-repeat tests produced by review cycles 2–4 has a matrix row. So the four behaviors that cost this unit three review cycles remain precisely the four the matrix does not name, and the gap has grown with every cycle that closed a test gap — the debt is being transferred from the suite to the matrix, one cycle at a time. Matrix line 188's note is also now false in a way that inverts its meaning: it reads "no scenario in this matrix calls `preventDefault()` on a focused-button `Enter`/`Space`", and treats the resulting blindness as an acceptable indirect catch; four shipped rows now do exactly that directly. `validate.mjs state` exits 0 because it checks matrix-row → test, not the converse (confirmed: `state: OK` at this ref), so nothing flags this automatically and it will not self-correct. | Four matrix rows under AC-6/AC-7 (repeat native activation acts once: digit-`Enter`, digit-`Space`, operator-`Enter` with the dispatch-count oracle, action-`Enter`/DEL with the display oracle) plus the one-line correction to the line-188 note. ≈6 lines in one file, no code, no behavior change, no product commit. This is the test-designer's file, so it is a matrix amendment in this unit or in the next unit touching AC-6/AC-7 — non-blocking, consistent with the user's fix-only-Majors decision. Worth doing in the same documentation pass as F-1: they are one traceability debt seen from two files, and this is the fourth consecutive cycle it has been recorded. |
| F-3 | Nit | `D-013:73` (table row 5) and the record's front matter | Two small accuracy blemishes in an otherwise-correct table. (a) Row 5's *target* column reads "digit button" but its `pinned by` column cites both the digit row and "…by `Space` evaluates exactly once", which is the **equals** button; row 1 correctly reads "digit / equals button" for the same pair. A reader comparing rows would conclude the equals-`Space` cell is untested when it is tested. (b) The record is `status: accepted` with a `decided_by` line dated 2026-09-22, but it has since been corrected in place (twice: row 3 and row 4 cite cycle-3 and cycle-4 findings postdating acceptance). Nothing in the record says it was amended, by whom, or when, so its provenance can only be reconstructed from git. For a record whose stated purpose is that "a future change inside this branch must keep this table true and extend it", the amendment trail is part of the artifact. | (a) Row 5 target → "digit / equals button" (1 word). (b) One `amended:` line in the front matter or a dated "Amendments" line at the end naming the cycle-4 and cycle-5 corrections (1 line). Fold into the same documentation pass as F-1/F-2; no code, no commit to product files. |
| F-4 | Nit (carried from `arch4` F-3, unchanged) | `script.js:95` | The guard's comment still cites only "`D-012` rejected, r2 F-1". `D-013` is `accepted` and is the positive rule, yet no product file references it, so the next reader of this branch still reconstructs the rule from a refutation. | Add `D-013` to the citation (1 line). **Do not do it now**: any product commit invalidates the SHA-bound review and gate evidence at `8c36740a` and restarts gates 4–8 for a comment (CLAUDE.md §11) — a plainly bad trade, and it would make this the sixth cycle. Fold into the next unit that edits this branch (`KEY-002` is the natural candidate). Recorded so the cost is a deliberate choice. |

## Assessments
- **Does the change follow `D-005`? (structural core question)** Yes, and this cycle the answer is
  near-trivial: `git diff fc93ff7a..8c36740a` over the product files is empty, so clauses 1–7 are
  byte-identically as I assessed them at `fc93ff7a`, and I re-verified the three a test change could
  in principle have eroded. (1) Core pure — HELD (probe C). (2) One mutable binding — HELD (probe S:
  `let state` is still the only one; no "was the last activation a repeat" flag, no "last key"
  variable and no per-button bookkeeping was smuggled in to make a test pass — the class of fix
  `D-011` explicitly rejected, and the one I watch for hardest when a cycle's brief is "make this
  row green"). (3) One dispatch seam per channel — HELD (one `applyInput` call, two `textContent`
  writes both inside `updateDisplay`, zero `.click(` in code). (6) Channel-agnostic policy is pure —
  HELD: `allowsRepeat` remains a descriptor predicate governing the document-level channel, "one
  activation per physical press" remains an event/default-action predicate governing the adapter, and
  probe M5 shows the suite fails when the two layers are conflated in the `D-012` direction — now on
  two rows rather than one.
- **Did the new test earn its place? (the question that decides this review)** Yes, on the strongest
  evidence available here. The test for a guarantee is whether removing the guarantee turns the suite
  red, and this row was written against two *named* mutants that demonstrably escaped the whole suite
  one commit earlier: M6 (`isCalculatorButton` stops recognizing `data-action`) and M7 (the repeat
  guard exempts action buttons) both went 49/49 green at `377024ba` and both now fail, each killing
  exactly this row and nothing else. The row is also not vacuous in the `arch3` F-4 sense: it passes
  `repeat` explicitly on every dispatch, so the stub's missing `repeat` default cannot make it pass by
  accident, and M9 shows it fails if the first press were suppressed too. Its oracle choice is right
  and is the reason the row is cheap: `DEL` is the one button family where a held `Enter` is
  *non*-idempotent on the display (three deletions read `12` → `1` → `0`, and without the outer branch
  `Enter` maps to `equals` and evaluates instead), so a plain `assertDisplay` discriminates and no
  spy is needed. Compare the operator row, which had to use `spyOnDispatches` because an operator swap
  rewrites the trail with an identical glyph. The file is internally consistent about when the display
  is an insufficient oracle, and this row picks the cheaper correct oracle rather than copying the
  more elaborate one.
- **Should the two remaining `Space` cells be closed now? (the dispatch's second question)** **No —
  the known-issue framing is sound, and I recommend this be the last structural cycle for this area.**
  Reasoning, since the opposite is the intuitive answer after three consecutive test-gap findings:
  (i) *The coverage basis is axis-complete, not cell-complete, and that is the right basis here.* The
  guard is a single expression over two independent axes — key ∈ {`Enter`, `Space`} and target family
  ∈ {digit, operator, action} — and the suite now pins each axis independently: M4 proves the key axis
  is discriminated (via the digit-`Space` row), M5/M6/M7 prove the target-family axis is discriminated
  (via the operator and DEL rows). A 2×3 cross-product would add two rows that test the *conjunction*
  of two properties each already pinned separately. (ii) *The mutant that survives is not one anyone
  would write.* To break a `Space` cell without breaking a pinned cell, a change must special-case
  *both* the key and the target family in the same condition — probe M8 is 60 characters of
  deliberately contorted logic. Every realistic simplification attractor (narrow to `Enter`, narrow to
  digits, forget `data-action`, exempt actions) is trapped. Tests exist to catch plausible futures,
  not to enumerate a truth table (CLAUDE.md §5.3: behavior and requirements, not coverage numbers).
  (iii) *Marginal `Space` rows would buy confidence in the stub, not in the browser.* `D-013`'s own
  residual risk (RK-3) is that real browsers activate a button on `Space` **keyup**, which
  `dom-stub.js` does not model; a held-`Space`-on-operator row would assert the stub's fiction more
  loudly while the real open question — "once, or zero times?" — stays exactly as open. The manual
  checklist item `KEY-001.md:151-153` is the only instrument that can close it, and it already exists.
  (iv) *Cost.* Two rows ≈32 lines is cheap; a sixth review cycle across three Opus reviewers plus
  re-run gates is not, and the expected defect yield is now very low — cycles 3, 4 and 5 each found a
  *test* gap and zero behavior defects, and the orchestrator independently reproduced correct
  behavior each time. The stopping condition should be stated rather than discovered, which is what my
  proposed clause 5 does. If the user's manual pass ever shows a `Space` anomaly, the two rows become
  an evidence-backed 30-minute addition in whatever unit fixes it.
- **Why this unit took five cycles (structural diagnosis, for the record).** Not thrash and not a
  design defect: three consecutive cycles closed *test* gaps in the same four-line region, each found
  by enumerating a combination nobody had written down, exactly as `D-013`'s own Context section
  predicted. The root cause is the negative-lever shape — the adapter can influence the browser's
  activation channel only by declining and by `preventDefault`, so every policy is expressed as an
  omission, and omissions are invisible to both readers and display oracles. That shape is inherent to
  honoring AC-6 and I rejected removing it in `arch3` (the "take activation over entirely" alternative,
  still recorded in `D-013`). What was missing was a *stated stopping rule* for the case set, so each
  reviewer found the next open cell and the loop continued one cell per cycle. The proportionate
  response is to write the rule down, not to add rows until the table is full.
- **Boundaries, coupling, cohesion**: unchanged and good. The new row reuses existing helpers
  (`loadPage`, `typeKeys`, `buttonFor`, `assertDisplay`, `display`) and introduces no new helper, no
  new abstraction, no seventh export, no stub change and **no production hook** — it drives the
  interaction entirely through the public `page.dispatch`/`focus` surface `D-008` already defines.
  `tests/helpers/dom-stub.js` is not in the diff, which matters: pinning this cell required no widening
  of the test double, so the double's fidelity claims are exactly as strong (and as limited) as at
  cycle 3. Dependency direction is still one-way (adapter → core).
- **Hidden state / impossible combinations**: none added, in product or in tests. The new row builds
  its own `loadPage()`, so there is no cross-test state; no wall-clock, no randomness (CLAUDE.md §4).
- **Testability seams**: the cycle's substantive gain. The branch's four behaviors are now covered by
  four mutually independent discriminating rows, and the set of surviving realistic mutants over this
  region is, as far as I can construct, empty (M1, M3, M4, M5, M6, M7, M9 all die; only the contrived
  M8 lives). At `fc93ff7a` this same region had one discriminating test.
- **Extensibility vs YAGNI**: nothing speculative added — no repeat-policy registry, no channel
  abstraction, no parameterized table-driven rewrite of the cells (the tempting over-generalization,
  which would couple the rows to one another and destroy the "each mutant kills exactly one row"
  property that makes this suite diagnostic). One concrete row for one concrete cell. The next channel
  (touch, paste) inherits `D-011`'s origin rule and `D-013`'s layer split, both test-backed.
- **Consistency (CLAUDE.md §4, §14)**: 2-space indent, single quotes, semicolons, `const`/`let`; the
  test name states behavior, not implementation; one behavior per test; the comment explains *why*
  (which `D-013` row it closes, and why the display is a sufficient oracle for this family only).
  §14 is satisfied strictly: the diff is +19/−0, so no pre-existing test was weakened, deleted,
  skipped or loosened, and no `kind: test-change` record is needed. The integration suite only grew
  (49 → 50), per §11.
- **Migration / rollback cost**: the lowest possible. Reverting this commit removes one test and
  restores `377024ba`'s suite exactly; no product code, no stub, no export, no data shape is involved.
  The standing cycle-1 note still applies for reverting the *unit*: `inputFromElement` depends on
  `isInput`, so `calculator-core.js` and `script.js` must be reverted together.
- **Constraints**: zero dependencies (no `package.json`, none added; probe K); classic scripts only
  (`index.html` not in the diff, zero `type="module"`); no build step; `file://` intact — this commit
  touches only a Node-side test file and cannot affect what the browser loads.

## Proposed decision
**No new decision record.** The lasting choice this cycle makes — *where the native-activation case
set stops being tested* — belongs in `D-013`, which already owns that case set. A separate record
would recreate the "read record A to learn record B is incomplete" indirection that `arch4` F-1
objected to, and would be the third record on one four-line branch. I therefore propose an amendment
to `D-013` rather than a `D-014`, as clause 5, alongside the F-1/F-3 corrections (all documentation,
no code, no product commit, no gate impact):

> **5. Coverage basis: axis-complete, not cell-complete.** The case set in clause 3 is pinned along
> its two independent axes — the key (`Enter` vs `Space`) and the target's button family (digit,
> operator, action) — not at every cell of their cross-product. Rationale: the guard is one expression
> over both axes, so a mutation that breaks an untested cell without breaking a tested one must
> special-case the key *and* the family simultaneously, which no plausible simplification does; and
> the untested cells are `Space` cells, whose real-browser semantics are `UNVERIFIED` (RK-3, the stub
> models activation on keydown) so extra rows would strengthen confidence in the test double rather
> than in the browser. The operator/action-under-`Space` cells are therefore **deliberately accepted
> as untested**, not overlooked. Revisit only if the manual pass (`KEY-001.md` checklist item 4)
> shows a `Space` anomaly, or if the guard is ever rewritten so the two axes are handled by separate
> conditions — at which point cell-complete coverage becomes necessary and costs ~2 rows.

Rejected alternatives for this cycle, with cost/benefit: (a) *add the two `Space` rows now* — ≈32 test
lines and a sixth review cycle for a mutant class nobody would write, against a suite whose oracle for
those cells is a known approximation of the browser; rejected under the reasoning above, and it would
leave the stopping rule still unwritten so a seventh cycle could find the next "cell". (b) *restructure
so the branch is positively expressed* (take activation over, `preventDefault` unconditionally and
dispatch from the keydown path) — still the structurally cleanest option and still rejected for the
reasons recorded in `D-013`'s Alternatives: it discards real activation semantics AC-6 exists to
preserve, its failure mode is silent divergence from every browser, and it is unverifiable here.
(c) *supersede `D-013` with a fresh record* — rejected as above.

## Unverifiable
- **Real browser behavior** (no browser available, RK-3) — unchanged by this commit: that a held
  `Enter` on a focused button really drives repeated native activation the way `dom-stub.js:118-139`
  models it; that a browser activates a button on `Space` **keyup** rather than keydown and how it
  treats a cancelled *repeat* keydown (the two possible real outcomes for held `Space` are "acts once"
  and "acts zero times", and the stub models only keydown activation so it can distinguish neither);
  that a native activation really reports `detail === 0` and a pointer click `detail >= 1`
  (`D-011`'s basis). The suite pins the *policy* against the stub's model; it does not and cannot
  settle the browser's semantics. `KEY-001.md:146-154`'s manual checklist items 3–5 remain where that
  is closed, and item 4 already states the "not zero times" expectation correctly.
- **Real OS auto-repeat timing and rate**: not modeled; every "held key" here is a synthetic sequence
  of keydowns, so the tests prove the policy, never the timing.
- **Focus-ring and screen-reader consequences** of suppressing a repeat activation: not observable in
  the stub.
- **Sequential focus navigation after `blur()`** (carried, unchanged): some browsers reset the focus
  navigation starting point after a programmatic `blur()`. Residual risk of the user-chosen `D-011`
  Option A, not a finding.
- **The `AC` half of the action-button family**: the DEL row pins the family through one member; a
  held `Enter` on a focused `AC` button is idempotent on the display, so no display oracle could
  distinguish it anyway. Covered by the same guard, by the same argument as clause 5 above.
- I did not read handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24`, `-32`, `-40` (off limits by
  dispatch), so no implementer or integration-tester narrative informs any statement above.
