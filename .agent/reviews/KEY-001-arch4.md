---
unit: KEY-001
reviewer: architecture-reviewer
model_attested: claude-opus-5
reviewed_ref: 377024ba68675fc48a3f0e5c07f881858d24e746
verdict: APPROVED
cycle: 4
---

# Review KEY-001 arch4 — verdict: APPROVED

Fresh full structural review at `head_ref` `377024ba`. Scope is structure — `D-005` clauses 1–7,
`D-013`'s case-set table, boundaries, coupling, hidden state, testability seams, extensibility,
constraints, migration cost. Code correctness per AC and security are the other two reviewers' scope.

**Model attestation**: I am running on Opus (`claude-opus-5`). The orchestrator's session is on Sonnet
(`FALLBACK(opus->sonnet)` on dispatch handoff `KEY-001-35`); that fallback does **not** extend to this
review, which is a full-assurance Opus review.

**Independence**: I did not open handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24`, `-32` (off limits
by dispatch). No implementer or integration-tester rationale informs any statement below; every claim
comes from the shipped files, the tests, the git history and the probes listed under "What I ran
myself". `D-011` and `D-013` were read as artifacts to judge, not as proof.

**Ref note (verified)**: `git rev-parse HEAD` is `6f104c6b`, two commits after `head_ref`.
`git diff 377024ba..HEAD -- . ':(exclude).agent'` is **empty**, so every product and test file I read
is byte-identical to `head_ref`. The drift is `.agent`-only (same pattern as r1 F-8, arch2, arch3).

**The delta, verified myself**: `git diff --name-status fc93ff7a..377024ba -- . ':(exclude).agent'`
returns exactly one line, `M tests/integration/keyboard.test.js`, +40/−0. **No product file changed
since my cycle-3 `APPROVED`** — `script.js`, `calculator-core.js`, `index.html`, `style.css` and
`tests/helpers/dom-stub.js` are all byte-identical to `fc93ff7a`. This is a test-only commit, so my
cycle-3 structural analysis of the shipped code carries forward on a git-proven basis; I nonetheless
re-ran the state, purity and constraint audits myself (probes S, C, K below) rather than assert it.

No Critical and no Major finding is open. Three findings (two Minor, one Nit) are recorded with
cost/benefit; none blocks `APPROVED`, none asks for a product-code change, and none is a rewrite
proposal. The Minor/Nit findings the user deferred in cycles 1–3 (`arch1` F-2..F-5, `arch2` F-2..F-4,
`arch3` F-2/F-4, r1/r2/r3/sec1 items) remain open by that user decision and are correctly carried in
`.agent/units/KEY-001.md` Known Issues; I re-verified they are unchanged at this ref and do **not**
re-raise them, except F-2 below, which reports that `arch3` F-3 has widened.

## Acceptance criteria verdicts
- AC-1: SATISFIED — probe C loads `calculator-core.js` in bare Node with `document`/`window`
  `undefined`; it exports exactly `allowsRepeat, applyInput, createState, isInput, mapKey, render`.
  `mapKey` is still a pure core entry point and the core is not in the diff.
- AC-2: SATISFIED — the one-decimal-point rule stays in the core's `appendNumber`, not duplicated in
  the key path. Unchanged at this ref.
- AC-3: SATISFIED — operator entries are still derived from the core's `OPERATORS`, so the key channel
  cannot name an operator the core rejects. Unchanged.
- AC-4: SATISFIED — `Backspace`/`Escape`/`Delete` map onto existing `delete`/`clear` actions; no
  keyboard-only transition was added to the core. Unchanged.
- AC-5: SATISFIED — modifier filtering lives in the pure `mapKey`; `script.js` passes only
  `{ctrlKey, metaKey, altKey}` (`modifiersOf`, `script.js:61-63`), and the document-level
  `preventDefault()` is still reached only after a non-`null` map result (`script.js:105-111`). The
  scope deviation I raised as `arch3` F-2 (a repeat `Space` on a focused calculator button *is*
  `preventDefault()`ed) is **no longer unstated**: it is recorded in `D-013` clause 4 and now carried
  in the unit file's AC-5 text as an explicit carve-out (`KEY-001.md:67-70`). The finding is closed as
  recorded, not as fixed — which was the recommended disposition, since it needs no code change.
- AC-6: SATISFIED, and this is the AC the dispatch asks me to confirm. Both halves hold and **every
  cell of `D-013`'s closed case-set table is now pinned by a named test** (table below). The two new
  rows close the two open cells and each is individually discriminating: probe M4 (narrow the guard
  to `event.key === 'Enter'`) now fails **exactly one** test — the new Space row — where at
  `fc93ff7a` it passed 47/47; probe M5 (narrow to digit buttons, the `D-012`-shaped mistake) fails
  **exactly one** test — the new operator row. Probe M1 (guard deleted) fails all three native-repeat
  rows. The suppression is discriminated in both directions: each new row also fails if the *non*-repeat
  press were over-suppressed (the Space row asserts current `7`, not `0`; the operator row asserts
  `before + 1` dispatches and trail `9+`), so "acts once" is pinned against zero-action as well as
  against many-action, at least in the stub's model.
- AC-7: SATISFIED — the document-level channel still applies the pure core predicate
  (`script.js:113-115`); the native-activation channel suppresses every repeat re-activation regardless
  of input type, and that "regardless of input type" clause — previously provable only by reasoning —
  is now pinned by the operator-button row via the `spyOnDispatches` oracle. The `arch3` F-1 hole is
  closed.
- AC-8: SATISFIED as a structural check only (docs are the documenter's and code reviewer's scope) —
  `README.md` is not in the diff and the behavior it describes is unchanged.

**`D-013` clause 3 case-set table, re-derived at this ref** (`{Enter, Space}` × `{repeat, non-repeat}`
× `{calculator button, other target}`):

| key | repeat | target | pinned by | status |
|---|---|---|---|---|
| `Enter` | no | calculator button | "a digit button reached by Tab and activated by Enter…", "the equals button … by Enter…" | pinned (unchanged) |
| `Enter` | yes | calculator button | "holding Enter on a Tab focused digit button performs the action once" + **new** "holding Enter on a Tab focused operator button performs the action once" | pinned, now also for non-digit inputs (M1, M5) |
| `Space` | no | calculator button | "a digit button reached by Tab and activated by Space…", "…by Space evaluates exactly once" | pinned (unchanged) |
| `Space` | yes | calculator button | **new** "holding Space on a Tab focused digit button performs the action once" | **pinned — was `unpinned` at `fc93ff7a`** (M1, M4) |
| `Enter`/`Space` | either | anything else | AC-5 / AC-7 rows on `document.body`; the focused *non*-calculator control sub-case remains a recorded `KEY-001-sec1` Nit | unchanged |

Every cell now names a test, and no cell is pinned only by a test that another cell already pins.
The dispatch's question is answered: **yes, the table is fully pinned.**

## What I ran myself
No file on disk was changed and no git state was touched: `git status --porcelain` was empty before
and after every command. As in cycles 1–3 I ran the gate commands from `.agent/gates.json` **directly**
rather than through `run-gate.mjs`, because the dispatch forbids changing files and `run-gate` would
rewrite `.agent/test-results/KEY-001/latest-*.json`; the SHA-bound evidence at `head_ref` already
exists and my counts match it exactly. Every mutation probe ran **in memory** via the stub's
`CALC_STUB_TRANSFORM` hook, which rewrites source inside `vm` only. I wrote no probe file anywhere
(the session scratchpad is outside the repository, and CLAUDE.md §4 forbids writing outside it) and
drove every probe through environment variables and `node -e`.

| Command | Result |
|---|---|
| `node --test "tests/unit/**/*.test.js"` | 83 pass / 0 fail |
| `node --test "tests/integration/**/*.test.js"` | **49 pass / 0 fail** (was 47 at `fc93ff7a`) |
| `node --test "tests/regression/**/*.test.js"` | 25 pass / 0 fail |
| `node --check script.js && node --check calculator-core.js` | pass |
| `node .agent/tools/validate.mjs state` | `state: OK`, exit 0 (read-only, no `--write`) |
| `git diff --name-status fc93ff7a..377024ba -- . ':(exclude).agent'` | one file: `M tests/integration/keyboard.test.js`, +40/−0 |
| `git diff 377024ba..HEAD -- . ':(exclude).agent'` | empty |

Recorded evidence cross-check — all four `latest-*-final.json` carry
`head: 377024ba68675fc48a3f0e5c07f881858d24e746`, `dirty: false`, and counts 83 / 49 / 25 / lint-pass,
matching my independent runs exactly.

**Mutation probes against the integration suite** (in-memory rewrite of `script.js`):

| Probe | Mutation | Result at `377024ba` | Result at `fc93ff7a` (cycle 3) |
|---|---|---|---|
| M1 | guard body disabled (`if (false)`) | ✖ 46 pass / **3 fail** — the digit-Enter, digit-Space and operator-Enter rows | ✖ 46/1 |
| M3 | `preventDefault()` dropped, `return` kept | ✖ 46 pass / **3 fail** — `preventDefault()` is load-bearing for all three, not decorative | ✖ 46/1 |
| M4 | guard narrowed to `event.repeat && event.key === 'Enter'` | ✖ 48 pass / **1 fail** — *only* "holding Space on a Tab focused digit button performs the action once" | ✔ 47/0 — **the `arch3` F-1 blind spot** |
| M5 | guard narrowed to `event.repeat && event.target.dataset.number !== undefined` (the `D-012` shape) | ✖ 48 pass / **1 fail** — *only* "holding Enter on a Tab focused operator button performs the action once" | not probed (row did not exist) |

M4 and M5 each kill exactly one row, and different rows. That is the property worth having: the two
new tests are orthogonal, neither is redundant with the cycle-3 row, and the suite now discriminates
the guard along both of its axes (key-agnostic, input-type-agnostic) independently.

| # | Probe | Result |
|---|---|---|
| C | core purity | `require('./calculator-core.js')` in bare Node: `typeof document`/`typeof window` `undefined`; exports `allowsRepeat, applyInput, createState, isInput, mapKey, render` — unchanged |
| S | state audit | `grep -nE "^\s*(let\|var) " script.js` → exactly one line, `12: let state = createState();`. `applyInput` → 2 occurrences (one import destructure, one call inside `dispatch`); `textContent =` → 2 (both inside `updateDisplay`); `.click(` → 0 in code (2 occurrences, both in comments) |
| K | constraints | no `package.json`; `grep -c 'type="module"' index.html` → 0; `index.html` not in the diff; `node --check` passes on both shipped files |

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | `.agent/decisions/D-013-native-activation-is-the-browser-channel.md:72` and `:114-116` | **`D-013` is now stale in exactly the cell whose closure it was accepted to track.** The record is `status: accepted`, and its clause 3 binds future work: *"A future change inside this branch must keep this table true and extend it."* The very first change after acceptance made it untrue. Row 4's `pinned by` cell still reads "**unpinned** — `arch3` F-1 (a mutation narrowing the guard to `Enter` leaves the suite 47/47 green)", which my probe M4 now refutes (48/1, the Space row dies). The Consequences section likewise still lists "the unpinned held-`Space` cell (`arch3` F-1, one integration row ≈16 lines)" as an open follow-up; it is closed. A reader who consults the record — which is the whole point of having written it — is told the branch has an unpinned half and that a named mutation escapes the suite, and both statements are false of the shipped tests. This is the documentation-decay failure mode `D-013` itself exists to prevent, so leaving it is self-defeating rather than merely untidy. | Amend `D-013` in place (it is a record of shipped behavior, so no code, no commit to product files, no gate impact): (a) row 4 `pinned by` → `keyboard.test.js` "holding Space on a Tab focused digit button performs the action once"; (b) row 2 → add the new operator-button row alongside the digit row, since "regardless of input type" is the clause that row pins; (c) strike the closed held-`Space` bullet from Consequences and leave the `arch3` F-3 matrix bullet, which is still open (F-2). ≈4 lines of prose in one file. The record's Decision, Alternatives and residual-risk sections need no change — clause 3's table is the only stale part, and the RK-3 manual check for held `Space` stays open and correctly listed in `KEY-001.md:151-153`. |
| F-2 | Minor | `.agent/units/KEY-001.matrix.md:90, 188` vs `tests/integration/keyboard.test.js:407-423, 425-440, 442-463` | **`arch3` F-3 has widened from one instance to three.** The matrix is the AC→test map the DoD is read against and is meant to read as the specification (CLAUDE.md §9, §12). None of the three native-activation repeat rows — the cycle-3 digit-`Enter` row and both cycle-4 rows — has a matrix entry; `grep` for `holding Enter`/`holding Space`/`Tab focused` across the matrix returns only the pre-existing AC-7 `document.body` row at line 90. So the three behaviors that cost this unit two review cycles remain the three the matrix does not name, and the gap grew with this commit rather than shrinking. Separately, matrix line 188's note — "no scenario in this matrix calls `preventDefault()` on a focused-button `Enter`/`Space`" — was true when written and is now false of three shipped rows instead of one. `validate.mjs state` exits 0 because it checks matrix-row → test, not the converse, so nothing flags this automatically (I confirmed: `state: OK` at this ref). | Three matrix rows under AC-6/AC-7 (repeat native activation acts once: digit-`Enter`, digit-`Space`, operator-`Enter`) plus the one-line correction to the line-188 note. ≈5 lines in one file, no code, no behavior change, no product commit. This is the test-designer's file, so it is a matrix amendment in this unit or the next one touching AC-6/AC-7 — non-blocking, and consistent with how `arch2` F-2 and `arch3` F-3 were already carried under the user's fix-only-Majors decision. Worth pairing with F-1 in a single documentation pass, since both are the same traceability debt seen from two files. |
| F-3 | Nit | `script.js:95` | **The guard's comment still points only at a rejected record.** It reads "`D-012` rejected, r2 F-1" — `D-013` is now `accepted` and is the positive rule, but no product file references it, so the next reader of the unit's most subtle branch still has to reconstruct the argument from a refutation. Giving that comment a positive referent was the stated purpose of proposing `D-013` (`arch3`, "Proposed decision"), and it is the one part of that purpose still unmet. | Add `D-013` to the comment's citation (1 line). **Do not do it now**: any product commit invalidates the SHA-bound review and gate evidence at `377024ba` and restarts gates 4–8 for a comment (CLAUDE.md §11), which is a plainly bad trade. Fold into the next unit that edits this branch — `KEY-002` is the natural candidate. Recorded so the cost is a deliberate choice rather than an oversight. |

## Assessments
- **Does the change follow `D-005`? (structural core question)** Yes, trivially and verifiably: it is a
  test-only commit, so clauses 1–7 are byte-identically as I assessed them at `fc93ff7a`, and I
  re-verified the three that a test change could in principle have eroded. (1) Core pure — HELD
  (probe C). (2) One mutable binding — HELD (probe S: `let state` is still the only one; no "was the
  last activation a repeat" flag and no "last key" variable was smuggled in to make a test pass — the
  class of fix `D-011` explicitly rejected). (3) One dispatch seam per channel — HELD (one `applyInput`
  call, two `textContent` writes both inside `updateDisplay`, zero `.click(` in code). (6)
  Channel-agnostic policy is pure — HELD and now *pinned* rather than merely argued: `allowsRepeat` is
  a descriptor predicate governing the document-level channel, "one activation per physical press" is
  an event/default-action predicate governing the adapter, and probe M5 shows the suite now fails when
  the two layers are conflated in the `D-012` direction. Clause 6 previously rested on prose; it now
  has an oracle.
- **Did the tests earn their place, or is this coverage theater? (the question that decides this
  review)** They earned it, on the strongest evidence available here. The test for a guarantee is
  whether removing the guarantee turns the suite red, and each new row was written against a *named*
  mutation that previously escaped: M4 escaped 47/47 at `fc93ff7a` (my own `arch3` F-1), M5 is the
  exact shape of the rejected `D-012` fix. Both now die, each to one row, and the two rows do not
  overlap. Just as important, neither row is vacuous in the way `arch3` F-4 warns about: both pass
  `repeat` explicitly on every dispatch, so the stub's missing `repeat` default cannot silently make
  them pass — and M1/M3/M4/M5 prove they fail when they should. I also checked the failure direction
  nobody asked about: both rows would fail if the *first*, non-repeat press were suppressed too
  (current `7` not `0`; `before + 1` dispatches and trail `9+`), so the fix cannot be "improved" into
  over-suppression without the suite noticing. That is the one real-browser risk `D-013` flags for
  held `Space` ("zero actions instead of one"), and while the stub cannot settle it, the suite at
  least now has the assertion that would catch it if the stub ever learns `Space`-on-keyup.
- **Oracle choice.** The operator row correctly uses `spyOnDispatches` rather than the display,
  because an operator swap rewrites the trail with an identical glyph and is therefore idempotent —
  a display-only assertion would pass under M5. This matches the oracle the two pre-existing
  operator/equals repeat rows use (`keyboard.test.js:284, 298, 374, 392`), so the file is internally
  consistent about when the display is an insufficient oracle. Note for the record that
  `spyOnDispatches` counts `textContent` writes on `display-current`, not `dispatch` calls; the two
  are 1:1 only because `updateDisplay` is the single write path (probe S), which clause 3 of `D-005`
  guarantees. The name is slightly stronger than the mechanism, but the helper is pre-existing,
  already used by four rows, and its inference is sound under a clause this review re-verified — not
  a finding.
- **Boundaries, coupling, cohesion**: unchanged and good. The two rows reuse the file's existing
  helpers (`loadPage`, `typeKeys`, `spyOnDispatches`, `assertDisplay`, `display`) and introduce no new
  helper, no new abstraction, no seventh export, no stub change and **no production hook** — the
  interaction is driven entirely through the public `page.dispatch`/`focus` surface `D-008` already
  defines. Dependency direction is still one-way (adapter → core). `tests/helpers/dom-stub.js` is not
  in the diff, which matters: pinning these cells required no widening of the test double, so the
  double's fidelity claims are exactly as strong (and as limited) as they were at cycle 3.
- **Hidden state / impossible combinations**: none added, in product or in tests. Each new row builds
  its own `loadPage()`, so no cross-test state; no wall-clock or randomness (CLAUDE.md §4).
- **Testability seams**: this is the cycle's substantive structural gain. At `fc93ff7a` the branch had
  four guard behaviors and one discriminating test; it now has four behaviors and three mutually
  independent discriminating tests, and the two "natural simplification" attractors — narrow to
  `Enter`, narrow to digits — are both trapped. The negative-lever weakness I diagnosed in `arch3`
  (the adapter can only influence the browser's activation channel by declining and by
  `preventDefault`, so every policy is expressed as an omission and omissions are invisible) is not
  removed — it is inherent to honoring AC-6 — but its failure mode is now covered by tests rather than
  only by a table in prose. That was the proportionate response I recommended, and it has been
  delivered at the predicted cost (~40 lines of tests, zero product lines) rather than by the
  restructure I rejected.
- **Extensibility vs YAGNI**: nothing speculative added — no repeat-policy registry, no channel
  abstraction, no parameterized table-driven rewrite of the four cells (which would have been the
  tempting over-generalization and would have coupled the rows to one another). Two concrete rows for
  two concrete cells. The next channel (touch, paste) inherits `D-011`'s origin rule and `D-013`'s
  layer split, both now test-backed.
- **Consistency (CLAUDE.md §4, §14)**: 2-space indent, single quotes, semicolons, `const`/`let`;
  test names state behavior, not implementation ("holding Space on a Tab focused digit button performs
  the action once"); one behavior per test; comments explain *why* and cite the finding and `D-013`
  row each row closes. §14 is satisfied in the strict sense: the diff is +40/−0, so no pre-existing
  test was weakened, deleted, skipped or loosened, and no `kind: test-change` record is needed. The
  integration suite only grew (47 → 49), per §11's "integration + regression suites only grow".
- **Migration / rollback cost**: the lowest possible. Reverting this commit removes two tests and
  restores `fc93ff7a`'s suite exactly; no product code, no stub, no export, no data shape is involved.
  The standing cycle-1 note still applies for reverting the *unit*: `inputFromElement` depends on
  `isInput`, so `calculator-core.js` and `script.js` must be reverted together.
- **Constraints**: zero dependencies (no `package.json`, none added; probe K); classic scripts only
  (`index.html` not in the diff, zero `type="module"`); no build step; `file://` intact — this commit
  touches only a Node-side test file and cannot affect what the browser loads.

## Proposed decision
None. `D-013` already records the rule and the case set; this cycle confirms its table rather than
extending it, and the one thing it needs is the accuracy amendment in F-1, not a new record. I
explicitly do **not** propose superseding `D-013` — a second record for a two-cell correction would
reproduce the very indirection (read record A to learn record B is stale) that F-1 objects to.

## Unverifiable
- **Real browser behavior** (no browser available, RK-3) — unchanged by this commit, and the reason
  the new Space row is necessary but not sufficient: that a held `Enter` on a focused button really
  drives repeated native activation the way `dom-stub.js:118-139` models it; that a browser activates
  a button on `Space` **keyup** rather than keydown and how it treats a cancelled *repeat* keydown —
  the two possible real outcomes for held `Space` are "acts once" (expected) and "acts zero times"
  (the residual risk `D-013` names), and the stub models only keydown activation so it can distinguish
  neither; that a native activation really reports `detail === 0` and a pointer click `detail >= 1`
  (`D-011`'s basis). The new tests pin the *policy* against the stub's model; they do not and cannot
  settle the browser's semantics. `KEY-001.md:146-154`'s manual checklist items 3–5 remain the place
  that gets closed, and item 4 already states the "not zero times" expectation correctly.
- **Real OS auto-repeat timing and rate**: not modeled; every "held key" here is a synthetic sequence
  of keydowns, so the tests prove the policy, never the timing.
- **Focus-ring and screen-reader consequences** of suppressing a repeat activation: not observable in
  the stub.
- **Sequential focus navigation after `blur()`** (carried, unchanged): some browsers reset the focus
  navigation starting point after a programmatic `blur()`. Residual risk of the user-chosen `D-011`
  Option A, not a finding.
- I did not read handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24`, `-32` (off limits by dispatch), so
  no implementer or integration-tester narrative informs any statement above.
