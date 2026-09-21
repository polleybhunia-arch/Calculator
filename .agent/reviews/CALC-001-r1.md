---
unit: CALC-001
reviewer: reviewer
model_attested: claude-opus-5
reviewed_ref: f9426e284219f49816abad088275d219c72bdd81
verdict: APPROVED
cycle: 1
---

# Review CALC-001 r1 — verdict: APPROVED

Scope check: `git rev-parse HEAD` = `f9426e284219f49816abad088275d219c72bdd81` = the dispatched
`head_ref`. Branch `agent/CALC-001-midchain-divide-by-zero`. Tree clean outside `.agent/` (only
`.agent/units/CALC-001.md` modified and four `latest-*-final.json` plus the dispatch handoff
untracked, as the dispatch stated). No commit exists after the final gate evidence
(`latest-unit-final.json` etc. all carry `head` = `f9426e28…`, `dirty: false`).

Changed outside `.agent/` between `bf27d9cc…` and the reviewed head:
`calculator-core.js` (M, +13/−2), `README.md` (M, 1 line), `tests/regression/REGISTRY.md` (M, +4
lines, no deletions), and three added test files. No drive-by edits; `script.js`, `index.html`,
`style.css` untouched.

## Acceptance criteria verdicts
- AC-1: SATISFIED — I executed the fixed core directly: `5 / 0 +` renders `{expression:"5÷0", current:"Error"}`, byte-identical to `5 / 0 =`; the pressed `+` appears on neither line. "No pending operator" is proved two ways: test "ignores equals after an operator resolved a divide-by-zero" (my mutation M7/P4, which leaves `operator`/`previousInput` set, turns it red), and my in-memory equivalence probe below. Test "shows Error at once when an operator press resolves 5 divided by 0" and "leaves the earlier state unchanged when an operator press resolves a divide-by-zero" both die under mutations M1, M2 and M4.
- AC-2: SATISFIED — `5 / 0 +`, `5 / 0 -`, `5 / 0 *`, `5 / 0 /` each render `5÷0` / `Error` (executed directly). Mutation M6/P3 (guard restricted to one operator) kills the unit row "shows Error at once for each of the four operators pressed after 5 divided by 0" and the page row "shows Error on the page for each operator button that resolves a divide-by-zero", so the four-operator coverage is not decorative.
- AC-3: SATISFIED — executed: `2 + 3 / 0 *` → `2+3÷0` / `Error` (the full typed chain, OQ-C1 as resolved, and equal to what `2 + 3 / 0 =` renders); `0 / 0 +` → `0÷0` / `Error`; `5 / 0 . 0 +` → `5÷0.0` / `Error`; `5 / 0 . +` and `5 / . +` → `5÷0.` / `Error`; `4 + 8 = / 0 +` → `12÷0` / `Error`. Mutation M2/P2 (expression built from `history.slice(0,-1)`) and M5 (divisor detected as the literal string `0`) each turn the corresponding rows red.
- AC-4: SATISFIED — executed after `5 / 0 +`: `7` → `""`/`7`; `+` → `""`/`0+` (and `-`,`*`,`/` → `0−`,`0×`,`0÷`); `AC` → `""`/`0`; `DEL` → `""`/`0`; `=` → unchanged `5÷0`/`Error`, second `=` unchanged. Each value equals the same input applied after `5 / 0 =`. The vacuity risk the matrix called out is handled: every recovery test asserts the `5÷0`/`Error` precondition first (`tests/unit/divide-by-zero.test.js:53-57`, `tests/integration/divide-by-zero-click.test.js:37`, `tests/regression/divide-by-zero.test.js:41`), and mutation M1 (guard removed) kills all five unit recovery rows plus both page recovery rows.
- AC-5: SATISFIED — `git diff --name-status --no-renames bf27d9cc..HEAD -- tests` shows `A` for the three new files and a single `M` for `tests/regression/REGISTRY.md` (append-only, 4 `+` lines, 0 `-` lines, covered by `D-007`). No `M`/`D` on `tests/unit/calculator-core.test.js`, `tests/integration/dom-click.test.js`, `tests/regression/readme-behavior.test.js`, `tests/regression/source-safety.test.js`, `tests/helpers/dom-stub.js`, `tests/helpers/source-scan.js`. Per-file counts unchanged: 52 / 20 / 8 / 5, all green, `skipped 0`, `todo 0`, no `.only`/`.skip`. Totals 67 / 22 / 17 match V-1's minimum exactly. Stronger evidence than the suites: my differential run (below) shows the fixed core and the pre-fix core diverge **only** at an operator press whose result is `Error` — so `=`, chaining, operator replacement and continue-from-result are bit-identical (RK-11, RK-12).
- AC-6: SATISFIED — `README.md:14` reads "Division-by-zero shows `Error` as soon as the division is evaluated, including in the middle of a chain (e.g. `5 ÷ 0 +`)". I checked that sentence against the behavior I executed, not only against the test's four tokens: it is accurate for both the `=` and the operator path. The pinning row "README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain" was genuinely red before the documenter's commit (`latest-regression-red.json`, assertion text quotes the old bullet `- Division-by-zero shows \`Error\``).

## What I ran myself
Gate commands taken verbatim from `.agent/gates.json`, executed on the reviewed head. I ran them
**directly rather than through `run-gate.mjs`** because the dispatch forbade changing any file on
disk and the recorder writes SHA-bound evidence; the orchestrator's authoritative post-approval runs
should still go through the recorder.

| Gate | Command source | My result | Recorded evidence at this SHA |
|---|---|---|---|
| unit | `gates.json.gates.unit` | tests 67, pass 67, fail 0, skipped 0 | `.agent/test-results/CALC-001/latest-unit-final.json` — 67/67, exit 0, head `f9426e28…` |
| integration | `gates.json.gates.integration` | tests 22, pass 22, fail 0 | `.agent/test-results/CALC-001/latest-integration-final.json` — 22/22, exit 0 |
| regression | `gates.json.gates.regression` | tests 17, pass 17, fail 0 | `.agent/test-results/CALC-001/latest-regression-final.json` — 17/17, exit 0 |
| lint | `gates.json.gates.lint` | exit 0 | `.agent/test-results/CALC-001/latest-lint-final.json` — exit 0 |

No discrepancy with the recorded evidence. `node .agent/tools/validate.mjs state` → `state: OK`;
`validate.mjs agents` → `agents: OK`.

**RED genuineness (RK-10).** `latest-unit-red.json` (head `41e8e4e2`, exit 1): 67 tests, 13 fail —
exactly the 13 RED rows, with 2 GUARD rows green, as the matrix predicted. Failures are
`ERR_ASSERTION` carrying the pre-fix values (`actual { expression: '', current: '5÷0+' }` vs
`expected { expression: '5÷0', current: 'Error' }`), not `TypeError`/`ReferenceError`/missing-module
errors. `latest-integration-red.json` 2 fails, `latest-regression-red.json` 4 fails, same shape;
the DOC-RED row's failure message quotes the unedited README bullet. The regression gate being red
on that one row at GREEN and REFACTOR (`latest-regression-{green,refactor}.json`, 16/17) matches the
sequencing note in the matrix and is resolved at the final run.

**Differential behavior check (no file written).** I loaded `git show bf27d9cc…:calculator-core.js`
and the head `calculator-core.js` side by side in one process (`new Function` wrappers, nothing
touched on disk) and compared `render()` after every token over all sequences of length ≤ 4 from the
alphabet `0 1 5 . + - * / = AC DEL` plus 60,000 seeded pseudo-random sequences of length 5–12:
**76,104 sequences, 3,784 diverging, 0 divergences of any other kind** — every first divergence is
an operator token whose fixed render is `Error`. Nothing else in the calculator changed.

**Equals-oracle equivalence (the unit's fix rule).** For every operator press that produced `Error`
(1,491 distinct points), I compared the resulting state against the state from pressing `=` at the
same point, then continued both with 14 suffixes (`7`, each operator, `=`, `= =`, `AC`, `DEL`,
`7 + 1 =`, `. 5 =`, `+ 3 =`, `DEL 9 =`): **0 mismatches**. The two paths are indistinguishable, which
is exactly the rule in the unit's objective.

**RK-14 invariant.** Over the same traversal I asserted `resetOnNextInput && !justCalculated ⇒
history.length > 0` on every intermediate state: **0 violations**.

**Mutation probes** — unit layer by priming `require.cache` with an in-memory mutated core; page
layer through the stub's `CALC_STUB_TRANSFORM` hook. Nothing on disk was modified.

| Mutation | Killed by |
|---|---|
| M1 remove the `resolved.currentInput === ERROR_TEXT` guard | 13 unit rows; 2 integration rows; 3 regression rows |
| M2 build the expression from `committed.history.slice(0,-1)` | 13 unit rows; 2 integration; 3 regression |
| M4 `finishCalculation` sets `justCalculated: false` | 15 unit rows **and 33 rows of the pre-existing `calculator-core.test.js`** (the shared finish step is well pinned) |
| M5 detect only a divisor typed literally `'0'` | unit rows "treats a divisor typed as 0.0…", "…as 0.…"; pre-existing "treats every zero-valued divisor as zero" |
| M6/P3 guard restricted to one operator | unit "…for each of the four operators…", "…at the end of a chain"; 2 integration; 2 regression |
| M7/P4 leave the pressed operator pending | unit "ignores equals after an operator resolved a divide-by-zero"; regression "README Error recovery…" |
| M3 `history: resolved.history` instead of `[]` in `finishCalculation` | **survived** — but it is an *equivalent* mutant: I diffed it against the original over all 177,155 sequences of length ≤ 5 and found 0 observable differences (`history` is never read while `justCalculated` is true, and every exit from that state rebuilds it). Not a test gap. |

No probe left the pre-existing suites red on its own that should not be (P1/P2/P3 leave
`dom-click.test.js` and `readme-behavior.test.js` green, correctly: those files never pinned the
mid-chain path — which is precisely why this unit exists).

Matrix conformance: all **42** quoted row names in `.agent/units/CALC-001.matrix.md` exist verbatim
in the test sources (checked programmatically); the three new files declare 15 / 2 / 4 tests, matching
the matrix counts.

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Nit | `README.md:14` | The bullet is one 118-character line while every sibling bullet wraps at ~80 columns (`README.md:8-9` wraps mid-sentence), so the source file is inconsistent even though rendered markdown is identical. | Optional, in a later T0 edit: wrap the bullet after "evaluated," to match the surrounding style. The regression row already re-joins wrapped lines with a space, so wrapping will not break it. |
| F-2 | Nit | `tests/regression/divide-by-zero.test.js:71-82` | The regression suite now pins README *prose* (four tokens). Any future rewording that stays behaviorally correct reds the regression gate and needs a `kind: test-change` record. This is deliberate (matrix AC-6 oracle) but is a standing maintenance cost worth carrying in the unit's Known Issues. | None for this unit. Record it in `.agent/units/CALC-001.md` "Known Issues" so a future documenter is not surprised. |
| F-3 | Nit | `tests/unit/divide-by-zero.test.js:18-49` | `toInput`/`press`/`expectDisplay` duplicate near-identical helpers in `tests/unit/calculator-core.test.js`. Deliberate (matrix "Why new files": the BOOT-001 file must stay byte-identical), but this is now the second copy and `KEY-001` will want a third. | Not in this unit. When `KEY-001` adds its own suite, extract these into a new `tests/helpers/core-input.js` (a *new* file, so no test-change record is needed) and have the new suites use it. |
| F-4 | Nit | `.agent/units/CALC-001.md:16` (`security_review`) | I agree with `N/A`, but the reasoning as written ("no new input surface") skips the one clause of CLAUDE.md §8 that could be read as a trigger: the unit does edit a function on the *input-handling* path (`chooseOperator`). | Extend the recorded reason to say why that clause does not bite: `applyInput`'s descriptor validation, the DOM adapter's raw-input filtering and the `textContent`-only display writes are all unmodified, and the markup-write traps plus `source-safety.test.js` (5 tests) run unchanged and green on this head. |

No Critical, Major or Minor findings.

## Assessments
- **Requirement satisfaction**: Complete. The fix is the minimal correct one: `chooseOperator` now
  routes a zero-divisor resolution through the same `finishCalculation` step that `equals` uses, and
  discards the pressed operator by returning early. The expression handed to it
  (`committed.history.join('')`) is provably the same string `equals` would have built
  (`history.join('') + currentInput`), because `committed.history` already has `currentInput`
  appended one line earlier — I confirmed this over 1,491 reachable cases rather than by reading.
- **Test adequacy / false confidence**: Strong. No expected value is recomputed with the code under
  test; every assertion is a whole-pair `deepEqual` on `{expression, current}` (a stray glyph on
  either line fails), values are hand-derivable from the ACs and cross-checked against the `=` rows
  that `BOOT-001` pins. No mocks of the subject (the DOM stub fakes only the browser, and the three
  page-level probes show the stub path really exercises the core). No truthiness-only assertion
  except the `NaN` guard at `tests/regression/divide-by-zero.test.js:45`, which sits *after* a
  `deepEqual` and only adds a named failure message. RED evidence precedes the fix commit in the
  history (`41e8e4e2`/`95f2685f` before `e0dd8fb`), so this is not a test retro-fitted to the code.
  Six of seven realistic mutations were killed; the survivor is provably equivalent.
- **Edge cases missing**: Nothing that an AC requires. The two inputs not named in AC-4 —
  a decimal point and a `0` as the first recovery input — I executed anyway: `5 / 0 + .` → `""`/`0.`
  and `5 / 0 + 0` → `""`/`0`, identical to the `=` path. Repeated operators after the fixed state
  (`5 / 0 + + + 2 =` → `0+2`/`2`) also match `5 / 0 = + + 2 =`. Non-typed divisors (`-0`, held
  values, `Infinity`) remain unreachable through an operator press, as the matrix argues; I confirmed
  the operator-swap branch returns before `computeResult`, so `5 / *` still swaps rather than
  resolving.
- **Regression risk**: Low and measured. The change sits on a shared transition (RK-11) and
  refactors `equals` (RK-12), so I did not rely on the suites: the 76,104-sequence differential
  bounds the blast radius to exactly the intended behavior change. Mutation M4 shows the refactored
  finish step is pinned by 33 pre-existing tests, so a future drift there fails loudly. `script.js`,
  `index.html` and `style.css` are untouched, and the DOM contract (ids, `data-*`) is unchanged.
- **Conventions & complexity**: Conforms to CLAUDE.md §4 — 2-space indent, single quotes,
  semicolons, `const`, `camelCase`, `UPPER_SNAKE` for `ERROR_TEXT`, no `var`. The two comments say
  *why* ("ends the calculation exactly as '=' does", "so the two paths cannot drift apart"), not
  what. `finishCalculation` is a genuine de-duplication, not speculative abstraction: it has two
  real call sites and net +11 lines for a shared invariant. D-005 clauses 1 and 2 hold — the core
  stays pure, no new mutable binding, no DOM access; the fix is entirely inside `calculator-core.js`
  as the unit required.
- **Security implications**: No new surface. No `eval`/`new Function`/`innerHTML` added (the added
  code is arithmetic and object spread); `Error` is a pre-existing constant already written through
  `textContent` by the unchanged adapter; no storage, network, dependency or markup write. The
  `source-safety.test.js` scans and the runtime markup-write traps in `dom-click.test.js` run
  unmodified and green on this head. I agree with `security_review: N/A` — see F-4 for the one
  clause the recorded reason should address explicitly. Architecture review: agreed not triggered —
  `finishCalculation` is a private function inside the existing IIFE, no new module boundary, T1.
- **Performance implications**: No material risk. The added work per operator press is one string
  comparison and, only on the error path, one `Array.prototype.join` over a trail that is bounded by
  the number of buttons a human presses (O(n) in the current expression, the same join `equals` and
  `render` already do on every keystroke). No new allocation on the hot non-error path beyond the
  existing object spread. Nothing measured because there is no budget and no plausible hazard:
  examined `chooseOperator`, `computeResult`, `finishCalculation` and `render`.
- **Architecture fit**: Good. Sharing the finish step between `=` and the operator path is the
  structural expression of the requirement ("indistinguishable from pressing `=`"), so the two paths
  cannot drift; the equivalence probe is the evidence that they currently do not.

## Unverifiable
- Real-browser rendering, `file://` loading, CSS/layout/focus and real pointer mechanics (RK-3,
  D-001). The DOM stub proves the click path only; it explicitly does not model these. The manual
  check stays with the user. Residual risk: low — no markup, CSS or adapter file changed in this
  unit.
- I did not re-record gate evidence through `run-gate.mjs` (the dispatch forbade writing files), so
  my gate results are my own re-execution of the `gates.json` commands rather than new machine
  evidence. They agree with the recorded `latest-*-final.json` at this SHA in every count.
- My exhaustive differential covers sequences of length ≤ 4 (≤ 5 for the M3 equivalence check) over
  an 11-token alphabet plus 60,000 random sequences of length ≤ 12; it is not a proof for all
  sequences, only very strong evidence.
- Authorship of the uncommitted `.agent/` working-tree changes is taken from the dispatch; I did not
  independently verify which agent wrote them.
