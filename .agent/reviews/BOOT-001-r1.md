---
unit: BOOT-001
reviewer: reviewer
model_attested: claude-opus-5
reviewed_ref: 28a19873b0c03224e111afb30e44829c919c9945
verdict: APPROVED
cycle: 1
---

# Review BOOT-001 r1 — verdict: APPROVED

Scope: `e02035bab13f5365a110b60a86ba3a8ae42063ed..28a19873b0c03224e111afb30e44829c919c9945`,
branch `agent/BOOT-001-core-extraction`. `git rev-parse HEAD` = `28a19873b0c03224e111afb30e44829c919c9945`
(equals `head_ref`). Product and test files are committed and clean; only `.agent/` has working-tree
changes, as the dispatch states. I changed no file on disk except this review and my handoff, created
no worktree, and ran no git state-changing command.

I am running on **claude-opus-5** (no fallback for this review). The orchestrator session runs under
`FALLBACK(opus->sonnet)`; that does not apply to this review file.

## Acceptance criteria verdicts

- AC-1: SATISFIED — `calculator-core.js:170-177` exports `createState`/`applyInput`/`render` (the three names recorded in `.agent/decisions/D-003-core-api.md`) via a dual CommonJS/`globalThis` guard inside one IIFE. Unit rows "loads in a Node process that defines no document or window" (runs the source in a `node:vm` context whose only global is `module`, after asserting `typeof document`/`typeof window` are `'undefined'` in the test process — so any call-time DOM access in any of the other 51 rows would throw `ReferenceError`), "exposes fresh-state, apply-input and render entry points as functions", "renders a fresh state as an empty expression line and 0", "keeps two fresh states independent of each other", "leaves an earlier state unchanged when a later input is applied". Purity is not merely asserted: my mutation M7 (`{ ...base, … }` → `Object.assign(base, … )` in `appendNumber`) and M6 (render ignores `resetOnNextInput`) were both KILLED, M7 by exactly the non-mutation row. No module-level mutable state exists (`OPERATORS`/`ACTIONS` are frozen-by-convention lookup `Map`s, never written).
- AC-2: SATISFIED — unit rows "chains 4+8+9 left to right and splits the display after equals" (`4+8+9` / `21`) and "shows the growing trail on the main line before equals" (asserts `4`,`4+`,`4+8`,`4+8+`,`4+8+9` with an empty expression line after **every** token), plus 5 further AC-2 rows. Probes M1 (`+` computes `a - b`, 19 failures), M5 (operands swapped, 9), M8 (operator appended instead of swapped, 4) all KILLED. I re-ran the unit gate: 52/52.
- AC-3: SATISFIED — "trims floating-point noise so 0.1+0.2 renders 0.3" plus 11 more rows (ten-decimal rounding, intermediate rounding, tiny value → `0`, negative zero, hyphen-minus U+002D asserted by code point, second decimal point ignored, `0.` construction, trailing point). Probe M2 (drop `Math.round(x*1e10)/1e10`) KILLED 4 rows; M9 (leading-zero rule ignores `.`) KILLED 6; A12 (second decimal point allowed) KILLED.
- AC-4: SATISFIED — "renders Error when dividing by zero" gives expression `5÷0` / current `Error`; recovery pinned by digit / operator / `AC` / `DEL` rows plus "ignores a repeated equals while Error is shown". Probes M3 / P3 (divide-by-zero guard removed) KILLED 5 unit and 2 page tests; A7 (`ERROR_TEXT` renamed) KILLED; A10 (operator no longer clears `Error` first) KILLED.
- AC-5: SATISFIED — "continues from a result so 21 then +5= renders 21+5 and 26" asserts the intermediate renders (`21+`, `21+5`) as well as the final `21+5` / `26`; operator replacement pinned by 4 rows. Probes M8 and M13 (digit after a result does not start a new calculation) KILLED.
- AC-6: SATISFIED — 18 integration rows drive the **real** `index.html` (parsed, not hard-coded) through `tests/helpers/dom-stub.js` with bubbling `click` events, plus 8 README regression rows; I re-ran both gates on this SHA (20/20, 13/13). The values match the matrix. Independently of the suite I loaded the **baseline** `git show e02035ba:{index.html,script.js}` and the head tree into the same stub and compared them token by token over **64,046 sequences / 401,502 token steps** (targeted README/`AC`/`DEL`/`Error`/decimal sequences plus seeded pseudo-random sequences up to 12 tokens): **0 differences**, including the initial load. The excluded mid-chain divide-by-zero path is preserved bit-for-bit (`5 / 0 +` → `5÷0+`; `5 / 0 + =` → expression `5÷0+Error`, current `NaN`; `5 / 0 + 3` → `3`), and **no** test asserts it: I grepped every `/ 0` sequence in `tests/` and each one is followed immediately by `=`, so AC-6's prohibition and `CALC-001`'s RED assumption both hold. Residual `UNVERIFIED` (recorded as RK-2/RK-3/RK-4, not a finding): real-browser rendering, CSS, focus and actual `file://` loading cannot be executed here.
- AC-7: SATISFIED — 5 static-scan rows in `tests/regression/source-safety.test.js` over exactly the three shipped files (`tests/helpers/source-scan.js:10`), with a missing file **failing** rather than skipping (`readShipped`), comments stripped before matching, and a vacuity guard on the reference scan (`source-safety.test.js:52`). I verified the patterns are not vacuous by feeding violating snippets to the real helper: `import`/`export`/`import(`, `const f = eval;` (the `\beval\b` superset the matrix asked for), `new Function`, `document.write`, `innerHTML`/`outerHTML`/`insertAdjacentHTML`, `https://cdn…` and protocol-relative `//cdn…` are all CAUGHT, while `module.exports` is correctly allowed, and `type="module"` is matched in both quote styles and upper case. Runtime side: integration rows "updates the display through textContent without writing markup" and "treats a button data attribute containing markup as inert text" with the stub's markup-write traps armed; probe P8 (`expressionDisplay.textContent =` → `.innerHTML =`) KILLED both. `index.html:42-43` uses two plain `<script src>` tags with no `type`, core before DOM layer, and the integration row "loads calculator-core.js before script.js in index.html" pins the order.
- AC-8: SATISFIED — all seven clauses (a)–(g) have named rows with the exact stated values, including clause (g) "DEL in the second operand changes only that operand" (`4+0`, then `4+5` / `9`) and clause (c) `5 / 0 = DEL` via "clears Error with DEL". Probes M4 (`slice(0,-1)` → `slice(0,-2)`), M11 (`DEL` after an operator no longer clears), A6b (`clear` action mapped to `deleteLastDigit`), A9u (`DEL` leaves `''` instead of `'0'`) and A13u (fresh state starts empty) were all KILLED.

## What I ran myself

All on `28a19873b0c03224e111afb30e44829c919c9945`, commands taken from `.agent/gates.json`:

| Gate | Command | My result | Recorded evidence | Match |
|---|---|---|---|---|
| unit | `node --test "tests/unit/**/*.test.js"` | 52 tests, 52 pass, 0 fail | `.agent/test-results/BOOT-001/latest-unit-final.json` (52/52) | yes |
| integration | `node --test "tests/integration/**/*.test.js"` | 20 tests, 20 pass, 0 fail | `.agent/test-results/BOOT-001/latest-integration-final.json` (20/20) | yes |
| regression | `node --test "tests/regression/**/*.test.js"` | 13 tests, 13 pass, 0 fail | `.agent/test-results/BOOT-001/latest-regression-final.json` (13/13) | yes |
| lint | `node --check script.js` | exit 0 | `.agent/test-results/BOOT-001/latest-lint-final.json` | yes |
| (extra) | `node --check calculator-core.js` | exit 0 | not a gate (OQ-7) | — |

I did **not** re-run `run-gate.mjs`, because it rewrites `.agent/test-results/` and the dispatch
forbids me any on-disk change outside my review and handoff. I ran the gate commands verbatim
instead; the counts reproduce the recorded evidence exactly.

Also run: `node .agent/tools/validate.mjs state` → `state: OK` (so every matrix-named test exists
verbatim and every AC has a row). TDD evidence chain is coherent and SHA-bound:
`latest-unit-red.json` (`35d3b85`, 52 tests / 52 fail, exit 1, clean tree) fails for the expected
reason — `AssertionError: AC-1: calculator-core.js must exist at the repository root` — then
`latest-unit-green.json` (`ee29dc4`, 52/52) and `latest-unit-refactor.json` (`23cab89`, 52/52);
integration/regression RED at `6281af7` (1 and 5 failures: the load-order row and the source-safety
rows), GREEN and REFACTOR green. `git diff --name-status e02035ba..28a19873 -- tests` shows only
additions plus `M tests/regression/REGISTRY.md`, which is covered by `.agent/decisions/D-004`; the
13 REGISTRY rows correspond one-to-one to the 13 regression test names. No `.only`, `.skip`,
`console.log`, `TODO`/`FIXME` anywhere in the added source or tests. `style.css` is untouched; no
drive-by edits.

**Mutation probes (23 realistic mutations, no file on disk changed).** Core-level probes patched
`Module._extensions['.js']` and `fs.readFileSync` in memory inside a child `node -e` and then required
the real unit test file; page-level probes used the stub's `CALC_STUB_TRANSFORM` hook against the
integration + regression suites. 20 of 23 were killed by behaviour-specific tests (listed per AC
above). The 3 survivors:

- `if (number !== undefined)` → `if (number)` in `script.js:37` — **invalid probe**, not a test gap: `dataset` values are strings and `'0'` is truthy, so the mutation is a no-op. The real hazard (the `0` button rejected at the boundary) is probe A1, which was KILLED by "wires every digit button 0 to 9 to the main line"; the `.` variant (A2) was KILLED too.
- listener moved from the `.buttons` container to `document` (`script.js:51`) — **equivalent mutant**: clicks bubble to `document` in a browser too and non-button targets are filtered, so no observable behavior changes.
- initial `updateDisplay()` removed (`script.js:49`) — **equivalent mutant as shipped**: `index.html:12-13` already renders `''`/`0`, which is exactly `render(createState())`. See F-3.
- removing the `data-operator` / `data-action` whitelist at the boundary (`script.js:41,44`) — **a genuine gap**, see F-1.

## Findings

| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | `script.js:41` and `script.js:44` (claim in `.agent/decisions/D-003-core-api.md`, "Unrecognized-input policy") | The boundary whitelists for `data-operator` and `data-action` are untested. I replaced `return OPERATOR_VALUES.includes(operator) ? {…} : null;` with `return { type: 'operator', value: operator };` and, separately, the same for `ACTION_VALUES`; **all 33 integration + regression tests still passed**. Only the `data-number` whitelist is pinned (by "treats a button data attribute containing markup as inert text", which my probe P10 KILLED). D-003 asserts "The 19 integration rows exercise every real button, so drift between the two would fail there" — that is false in the permissive direction, because every real button already carries a valid value. Without the whitelist, a button with `data-operator="^"` or `data-action="__proto__"` reaches `applyInput`, which throws a `TypeError` inside the click listener. | Add one integration row to `.agent/units/BOOT-001.matrix.md` and `tests/integration/dom-click.test.js` (category `security`/`invalid`), mirroring the existing markup-payload row: append a synthetic `<button data-operator="^">` and a second with `data-action="__proto__"` under `.buttons`, click each, and assert `doesNotThrow`, that `page.read()` is unchanged, and that `page.markupWrites` is empty. Correct the D-003 sentence to say the integration rows guard the *restrictive* direction only. Not blocking: no AC requires this validation and the shipped markup cannot reach it. |
| F-2 | Minor | `.agent/units/BOOT-001.matrix.md:186` ("Not covered" → "Core behavior for an unrecognized input descriptor") vs `tests/unit/calculator-core.test.js:127` | The matrix states this policy is "**not** tested in the unit layer to avoid choosing", but the suite contains "throws a TypeError for a malformed input descriptor" (this is the 52nd test against 51 matrix rows). The matrix is the design of record that `CALC-001` and `KEY-001` will read, and it now contradicts the suite. The test itself is good (14 malformed descriptors including `__proto__`/`constructor`, and it asserts the state is untouched) and was written RED-first (commit `35d3b85`, `latest-unit-red.json`). | `test-designer` adds a named row for it under AC-1 in the matrix and deletes the contradicting "Not covered" bullet, with no change to the test. The unit Log already records the intent ("matrix row to be added at the next test-designer dispatch"); this finding is that it must actually happen before `CALC-001` is designed against this matrix. |
| F-3 | Nit | `tests/integration/dom-click.test.js:19` | "shows an empty expression line and 0 when the page loads" cannot distinguish "the scripts rendered `''`/`0`" from "the scripts never wrote anything", because `index.html:12-13` ships exactly those values. Deleting the initial `updateDisplay()` call leaves all 33 page tests green (probe A4). It is only partly saved by the `executedScripts` assertions on lines 22-23. | Optional: assert the display nodes were actually rewritten (e.g. that `#display-current` has a text child created by the script, or press `AC` first and re-read). The mutation is unobservable in a real browser too, so this is documentation of a limit rather than a defect. |
| F-4 | Nit | `tests/regression/source-safety.test.js:54` | The `index.html` scan passes `PATTERNS.externalHosts.slice(0, 1)`, i.e. only the absolute-URL pattern. A protocol-relative `//cdn.example.com/…` is caught only if it appears in a `src`/`href` attribute (via `findReferences`/`isRelativeReference`); the same string in any other markup position (inline style, `meta` content) would not be flagged, although AC-7 forbids it outright. | Pass the full `PATTERNS.externalHosts` for the HTML too, or add a comment stating the deliberate scope limit and why. |
| F-5 | Nit | `script.js:6` | `const { … } = globalThis.CalculatorCore;` throws a `TypeError` at load if `calculator-core.js` did not load. Correct per CLAUDE.md §4 (do not swallow), but the user-visible result is a frozen page still showing `index.html`'s static `0` — indistinguishable from a working fresh calculator. No test covers a missing core at page level. | Optional: no code change required. If it is ever worth hardening, the DOM layer should render a visible `Error` (via `textContent`) when the core is absent, and one integration row should load `index.html` with the core script omitted. |

## Assessments

- **Requirement satisfaction**: all eight ACs are met on this SHA, each with a named test that I
  proved discriminating by mutation. The unit's extra DoD line — "the mid-chain divide-by-zero path
  still behaves as it does at `e02035b`", which the matrix correctly flags as not automatable here —
  I verified myself by differential execution against the baseline (see AC-6): it is unchanged, so
  RK-1's residual risk did not materialise and `CALC-001`'s RED reference stays valid.
- **Test adequacy / false confidence**: strong. Expected values are literal strings, never recomputed
  with the code under test; `assert.deepEqual` on the whole `{ expression, current }` pair means the
  expression line is asserted on every row, not just the current line; operator glyphs are asserted
  by exact code point (U+2212/U+00D7/U+00F7 vs ASCII `-`); the only fake is the DOM stub, which parses
  the real `index.html` and hard-codes no button table. The RED run for the unit gate is weak in
  itself (all 52 rows fail with the same "core file missing" assertion, which proves nothing about
  individual assertions) — that is inherent to extracting a new file, and my 23 mutation probes are
  the compensating evidence. No test depends on another's state: `loadPage()` builds a fresh `vm`
  context per call and the unit helpers build a fresh state per case. No timing or randomness.
- **Edge cases missing**: F-1 is the only behavioural gap I found, and it is defensive code no AC
  demands. Deliberate, recorded exclusions I checked and accept: the mid-chain divide-by-zero path
  (OQ-B1, owned by `CALC-001`), the unreachable `'-'` branch of the original `deleteLastDigit`
  (I confirmed analytically and by fuzz that no button sequence can produce a lone `-` with
  `resetOnNextInput` false), and exponent/precision formatting beyond the safe integer range.
- **Regression risk**: very low. Behaviors I checked explicitly against the baseline: initial render,
  digit entry and leading zeros, all four operators and their glyphs, left-to-right chaining,
  operator replacement (including after `=`), decimals and the `0.` reset rules, rounding (ten
  decimals, intermediate rounding, tiny values, negative zero, negative results), `=` as a no-op, `=`
  right after an operator, double `=`, `AC`, `DEL` in all five positions, divide-by-zero as the last
  step and all four recoveries, the mid-chain divide-by-zero path, and clicks on non-button targets.
  Zero divergence across 401,502 token steps. One intentional and sanctioned behavior *difference*
  outside real markup: the DOM layer now rejects an out-of-range `data-number` (e.g. a multi-character
  markup payload) instead of displaying it; the matrix explicitly permits this ("the extraction may
  instead reject it at the boundary") and no shipped button can reach it. `tests/` only grew;
  `REGISTRY.md` is the single modified pre-existing file and is covered by D-004.
- **Conventions & complexity**: compliant with CLAUDE.md §4 — 2-space indent, single quotes,
  semicolons, `const`/`let` only, `camelCase`, `UPPER_SNAKE` constants, kebab-case file names, tests
  named for behavior, `node:test` + `node:assert/strict`, comments that explain *why*. `script.js` is
  now 58 lines of pure DOM wiring with a single `dispatch` entry point; `calculator-core.js` is 178
  lines of pure functions. No unnecessary complexity: the `OPERATORS`/`ACTIONS` `Map`s replace the
  original `switch` chains and are shorter, and the spread-based immutable transitions are the minimum
  needed for AC-1. The one duplication (value tables in both layers) is deliberate and recorded in
  D-003; F-1 is its missing guard.
- **Security implications**: improved over baseline, nothing new. No `eval`, `new Function`,
  `document.write`, `innerHTML`/`outerHTML`/`insertAdjacentHTML`, no network, no storage, no
  dependency, no third-party URL — enforced statically (5 rows, patterns verified non-vacuous by me)
  and at runtime (markup-write traps). Display writes go through `textContent` only. `applyInput`
  validates with `Map.has`/`Map.get`, so `__proto__`/`constructor` cannot resolve to inherited
  members, and the unit test covers exactly those two strings. The DOM layer filters user-controllable
  `data-*` before the core sees it; F-1 is that two thirds of that filter are untested. A formal
  security verdict is the `security-reviewer`'s call, not mine.
- **Performance implications**: no material risk. The hot path is one click: `applyInput` allocates a
  handful of small objects and copies the `history` array, and `render` does one `Array.join`, so both
  are O(n) in the number of tokens typed since the last `AC`/`=` — bounded by human typing, typically
  under 20 elements. No loops over unbounded data, no repeated DOM queries (the two display nodes and
  the container are looked up once at load), no layout thrash, no growth that survives `=` (`equals`
  resets `history` to `[]`). The three suites together run in ~0.4 s. Examined and found non-issues:
  `chooseOperator`'s array spreads, `render`'s per-click `join`, and the stub's per-test HTML re-parse
  (test-only). No budget is stated and none is needed.
- **Architecture fit**: the boundary is clean — the core has no DOM reference at all (proved by the
  `vm` sandbox row), `script.js` holds every `document` call, and the dual-export guard keeps the
  `file://` promise without a build step (`index.html` loads two classic `<script src>` tags in the
  right order). This matches CLAUDE.md §1 and D-001. The formal architecture verdict belongs to the
  `architecture-reviewer`.

## Unverifiable

- **Real browser and real `file://`**: no browser in this environment. Proven only by proxy — classic
  `<script src>` tags, no `type="module"`, no module syntax, relative paths, core-before-DOM-layer
  order. The manual open-`index.html`-from-disk check stays `UNVERIFIED` (RK-3, RK-4) and is the
  user's.
- **CSS, layout, dark theme, responsiveness, focus ring, touch and real click mechanics**: outside the
  stub (RK-2). `style.css` is byte-identical to the baseline, which bounds the risk to the markup
  change — and the only markup change is one added `<script>` tag.
- **Gate 8 is not satisfiable yet (not a finding against the implementation)**: `.agent/gates.json`
  still lints only `script.js`, so `calculator-core.js` — 178 of the unit's 236 new product lines — is
  not covered by the lint gate (OQ-7, deferred to the human, only the human may edit that file). I ran
  `node --check calculator-core.js` by hand and it passes, but that is not gate evidence. This unit
  cannot reach `COMPLETE` until the user extends the lint command or records an N/A with a reason.
- **`security-reviewer` and `architecture-reviewer` verdicts**: required by CLAUDE.md §11 and this
  unit's DoD; both are outside my mandate and were still outstanding when I reviewed.
