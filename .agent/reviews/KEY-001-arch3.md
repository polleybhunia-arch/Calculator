---
unit: KEY-001
reviewer: architecture-reviewer
model_attested: claude-opus-5
reviewed_ref: fc93ff7a519f5e8ad8674068e6d9dd5a816b875f
verdict: APPROVED
cycle: 3
---

# Review KEY-001 arch3 — verdict: APPROVED

Fresh full structural review at `head_ref` `fc93ff7a`. I re-derived every AC verdict from evidence I
gathered myself at this ref rather than carrying anything forward from my cycle-2 review, then judged
the shipped fix on its own merits. Scope is structure — `D-005` clauses 1–7, boundaries, coupling,
hidden state, testability seams, extensibility, constraints, migration cost. Code correctness per AC
and security are the other two reviewers' scope.

**Model attestation**: I am running on Opus (`claude-opus-5`). The orchestrator's session is on
Sonnet (`FALLBACK(opus->sonnet)` on the dispatch handoff); that fallback does **not** extend to this
review, which is a full-assurance Opus review.

**On my own rejected proposal.** My cycle-2 `D-012` claimed the ungated native-activation repeat was
"inert today". The orchestrator rejected it on a factual gap, and the rejection is correct — I
reproduced it myself at this ref (probe M2): with `D-012`'s own proposed fix in place
(`event.repeat && buttonInput !== null && !allowsRepeat(buttonInput)`), a held `Enter` on a
`Tab`-focused digit button still renders `777`, and the integration suite goes **46 pass / 1 fail**.
My cycle-2 reasoning generalized from two examples (`=`, an operator swap) that are idempotent by
coincidence to a class that is not. The shipped fix is not merely a different choice from `D-012`; it
is the structurally correct one, and `D-012`'s would have been a `D-005` clause-6 violation as well as
a behavioral one (see "Assessments"). I make no attempt below to defend it.

**Ref note (verified, not a blocker)**: `git rev-parse HEAD` is `be19be11`, three commits after
`head_ref`. `git diff fc93ff7a..HEAD -- . ':(exclude).agent'` is **empty**, so every product and test
file I read is byte-identical to `head_ref`. The drift is `.agent/`-only (same pattern as r1 F-8).

**Independence**: I did not open handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24` (off limits by
dispatch). No implementer or integration-tester rationale informs any statement below; every claim
comes from the shipped files, the tests, the git history and the probes listed under "What I ran
myself". `D-011` and the rejected `D-012` were read as artifacts to judge, not as proof.

No Critical and no Major finding is open. Four findings (three Minor, one Nit) are recorded with
cost/benefit; none blocks `APPROVED` and none is a rewrite proposal. The Minor/Nit findings the user
deferred in cycles 1–2 (`arch1` F-2..F-5, `arch2` F-2..F-4, r1/r2/sec1 items) remain open by that
user decision and are correctly carried in `.agent/units/KEY-001.md` Known Issues; I re-verified they
are unchanged at this ref and I do **not** re-raise them, except where F-3 below extends `arch2` F-2
with a new instance.

## Acceptance criteria verdicts
- AC-1: SATISFIED — `mapKey` is still a pure core entry point; probe C loads `calculator-core.js` in
  bare Node with `document`/`window` `undefined` and it exports exactly `allowsRepeat, applyInput,
  createState, isInput, mapKey, render`. The integration row "typing four plus eight plus nine then
  Enter…" renders `4+8+9` / `21` through the same `dispatch` the click path uses. The fix does not
  touch this path (`calculator-core.js` is not in the diff; the diff is `script.js` +10 lines, of
  which 4 are code, and one new integration row).
- AC-2: SATISFIED — `.`/`,` both map to the same number descriptor; the one-decimal-point rule stays
  in the core's `appendNumber`, not duplicated in the key path. Unaffected by the fix.
- AC-3: SATISFIED — operator entries are derived from the core's `OPERATORS`, so the key channel
  cannot name an operator the core rejects; `x`/`X` are the only hand-written aliases. Unaffected.
- AC-4: SATISFIED — `Backspace`/`Escape`/`Delete` map onto the existing `delete`/`clear` actions; no
  transition was added to the core for the keyboard. Unaffected.
- AC-5: SATISFIED with one recorded scope deviation — modifier filtering lives in the pure `mapKey`;
  `script.js` passes only `{ctrlKey, metaKey, altKey}` (`modifiersOf`, `script.js:61-63`), and the
  document-level `preventDefault()` is still reached only after a non-`null` map result
  (`script.js:105-111`), so the allowlist remains the single gate for both effects. The fix adds a
  **second** `preventDefault()` site (`script.js:98-101`) that can fire for `Space` — a key AC-5 lists
  as unmapped — when the target is a focused calculator button and the event is a repeat (probe P2:
  `defaultPrevented` = `[false, true, true]`). AC-5's *purpose* (never steal a browser or OS
  shortcut) is untouched, since `Space` on a focused button has no shortcut to steal and the
  `Ctrl`/`Meta`/`Alt` and `Tab` rows are unchanged and still green; but AC-5's *letter* and OQ-2
  ("`preventDefault()` only for mapped keys with no Ctrl/Meta/Alt held") now have an unstated
  exception. Recorded as F-2, Minor, with the scope qualification proposed in `D-013`.
- AC-6: SATISFIED — both halves hold and both are pinned. Mouse click → `detail: 1` → blur (probe P6:
  click `4`, then `+ 8 Enter` renders `4+8` / `12`, not `4+84`, and `activeElement` is `null`);
  `Tab`-focused native activation → `detail: 0` → no blur, focus retained (probe P1:
  `focusKept = true`). "Exactly one calculator action occurs" now holds for a *physical press* and not
  only for a single synthetic keydown: probe P1 gives `7` (not `777`) for a held `Enter` on a focused
  digit button, probe P3 gives 1 display write then 0 for a held `Enter` on a focused `=`, probe P4
  the same for a focused `+`. Probe P5 confirms the non-repeat path is untouched (single `Enter` then
  single `Space` on a focused `7` → `77`, i.e. two presses, two actions).
- AC-7: SATISFIED — and, unlike at `5678cc1b`, satisfied **by policy rather than by coincidence**.
  The document-level channel still applies the pure core predicate
  (`if (event.repeat && !allowsRepeat(input)) return;`, `script.js:113-115`), exercised by four
  integration rows; held digits and `Backspace` still repeat (probe P7: `555`). The
  native-activation channel now suppresses every repeat re-activation regardless of input type, so
  the load-bearing idempotence invariant my cycle-2 review leaned on is no longer load-bearing at
  all. The one remaining hole is `Space`, where nothing pins the behavior and the stub's model and a
  real browser's differ — F-1, Minor, `UNVERIFIED` (RK-3), not an AC failure in the stub's model.
- AC-8: SATISFIED as a structural check only (docs are the documenter's and code reviewer's scope) —
  `README.md:28` ("`Enter`, `=` and the operator keys act once per press even if held down") is now
  literally true on both channels instead of true-by-accident, and `README.md:28`'s "Holding down a
  digit… repeats the action on every repeat" still describes the digit *key*, which still repeats
  (probe P7). `README.md:29`'s "unmapped keys such as `Tab` behave as normal" is marginally
  over-broad now that a repeat `Space` on a focused button is `preventDefault()`ed; `Tab` itself is
  still correct and still pinned. Folded into F-2.

## What I ran myself
No file on disk was changed and no git state was touched: `git status --porcelain` was empty before
and after every command below. As in cycles 1–2, I ran the gate commands from `.agent/gates.json`
**directly** rather than through `run-gate.mjs`, because the dispatch forbids changing files and
`run-gate` would rewrite `.agent/test-results/KEY-001/latest-*.json`; the SHA-bound evidence at
`head_ref` already exists and my counts match it exactly. Every mutation probe ran **in memory** via
the stub's `CALC_STUB_TRANSFORM` hook, which rewrites the source inside `vm` only — nothing was
written to `script.js`. (The dispatch's scratchpad is outside the repository, so per CLAUDE.md §4 and
the write-guard hook I wrote no probe file anywhere and drove every probe through `node -e`.)

| Command | Result |
|---|---|
| `node --test "tests/unit/**/*.test.js"` | 83 pass / 0 fail — matches `latest-unit-final.json` (`head` `fc93ff7a`, `dirty: false`) |
| `node --test "tests/integration/**/*.test.js"` | 47 pass / 0 fail — matches `latest-integration-final.json` (`head` `fc93ff7a`, `dirty: false`) |
| `node --test "tests/regression/**/*.test.js"` | 25 pass / 0 fail — matches `latest-regression-final.json` (`head` `fc93ff7a`, `dirty: false`) |
| `node --check script.js && node --check calculator-core.js` | pass — matches `latest-lint-final.json` (`head` `fc93ff7a`) |
| `node .agent/tools/validate.mjs state` | `state: OK`, exit 0 (read-only, no `--write`) |
| `git diff 5678cc1b..fc93ff7a -- . ':(exclude).agent'` | 2 files, +28/−0: `script.js` (+10, 4 lines of code) and `tests/integration/keyboard.test.js` (+18, one row) |
| `git diff fc93ff7a..HEAD -- . ':(exclude).agent'` | empty — working tree ≡ `head_ref` for all code and tests |

**Mutation probes against the integration suite** (in-memory rewrite of `script.js`):

| Probe | Mutation | Result |
|---|---|---|
| M1 | the 4-line guard deleted entirely | ✖ 46 pass / **1 fail** — "holding Enter on a Tab focused digit button performs the action once" (`777` ≠ `7`) |
| M2 | guard replaced by `D-012`'s proposal (`event.repeat && buttonInput !== null && !allowsRepeat(buttonInput)`) | ✖ 46 pass / **1 fail** — same row, `777`. My cycle-2 fix is refuted by the shipped test |
| M3 | `preventDefault()` dropped, `return` kept | ✖ 46 pass / **1 fail** — same row. The `preventDefault()` is load-bearing and pinned, not decorative |
| M4 | guard narrowed to `event.repeat && event.key === 'Enter'` | ✔ **47 pass / 0 fail** — the `Space` half of the guard is entirely unpinned. See F-1 |

**Behavioral probes** (`node -e`, nothing written; run against shipped code and against M1/M2/M4):

| # | Probe | Shipped result |
|---|---|---|
| P1 | held `Enter` on a `Tab`-focused `7` button (`repeat: false,true,true`) | display `7`; `defaultPrevented` `[false,true,true]`; focus retained. Under M1/M2: `777` |
| P2 | held `Space` on a `Tab`-focused `7` button | display `7`; `defaultPrevented` `[false,true,true]`. Under M1/M2/**M4**: `777` |
| P3 | `5 + 5`, focus `=`, held `Enter` | 1 display write for the press, **0** for the two repeats; display `5+5` / `10`. Under M1: 2 extra writes (the `5678cc1b` behavior) |
| P4 | `9`, focus `+`, held `Enter` | 1 write, then 0; display `9+`. Under M1: 2 extra writes |
| P5 | focused `7`: one non-repeat `Enter`, then one non-repeat `Space` | `77` — two physical presses still produce two actions; the fix does not over-suppress |
| P6 | mouse-click `4`, then `+ 8 Enter` on whatever is focused | `4+8` / `12`, `activeElement === null` — OQ-3 / `D-011` intact |
| P7 | held digit `5` on `document.body` | `555` — OQ-4 repeat policy for digits intact on the document channel |
| P8 | `Enter` on a focused **non**-calculator `<button>` after `5 + 5` | evaluates and `preventDefault`s on both the press and the repeat — pre-existing, already a recorded sec1 Nit ("the global keydown listener assumes no future focusable input exists"), unchanged by this fix |
| C | core purity | `require('./calculator-core.js')` in bare Node: `typeof document`/`typeof window` `undefined`; exports unchanged |
| S | state audit | `grep -nE "^\s*(let\|var) " script.js` → exactly one line, `12: let state = createState();`. `grep` for `applyInput` → 1 call (inside `dispatch`); `textContent =` → 2 (both inside `updateDisplay`); `.click(` → 0 in code (2 occurrences, both in comments) |

## Findings
| ID | Severity | Location (file:line) | Problem | Required change |
|---|---|---|---|---|
| F-1 | Minor | `script.js:98-101`; `tests/integration/keyboard.test.js:407-423` | **Half of the new guard is unpinned, and it is the half whose real-browser semantics differ from the stub's.** The guard is key-agnostic — it suppresses repeats for `Space` as well as `Enter` — but only the `Enter` case has a test. Probe M4 narrows the guard to `event.key === 'Enter'` and the whole suite still passes **47/47**, while probe P2 shows held `Space` on a focused digit button regressing to `777` under exactly that mutation. So the most natural future "simplification" of this branch is invisible to the suite. This matters more than a plain coverage gap because the two channels disagree about `Space`: the stub models a button's native activation on **keydown** for both keys (`dom-stub.js:118-139`), whereas a real browser activates a button on `Enter` keydown but on `Space` **keyup** — so in a browser a held `Space` does not auto-re-activate at all, the guard is a no-op there in the expected case, and in the unlucky case (a browser that treats a cancelled repeat keydown as disarming the pending activation) a held `Space` on a focused button could produce **zero** actions instead of one. `UNVERIFIED` either way (RK-3, no browser). | Two cheap, additive things, neither of which changes behavior: (a) one integration row "holding Space on a Tab focused digit button performs the action once", mirroring the `Enter` row — ~16 lines, kills M4; (b) one line on the user's manual checklist: *hold `Space` on a `Tab`-focused button and confirm it still acts exactly once, not zero times*. **Do not** narrow the guard to `Enter` on the strength of the stub alone — the stub is the only oracle available and key-agnostic is the safer default; if the manual pass shows a browser disarming on a cancelled repeat, narrowing to `Enter` is then a 1-line, evidence-backed change. |
| F-2 | Minor | `script.js:98-101` vs `.agent/units/KEY-001.md` AC-5 / OQ-2 and `README.md:29` | **A recorded user decision now has an unstated exception.** OQ-2 (user-resolved) is "`preventDefault()` only for mapped keys with no Ctrl/Meta/Alt held; never for `Tab`", and AC-5 names `Space` explicitly in its unmapped list with "`preventDefault()` was not called". The fix calls `preventDefault()` for a repeat `Space` on a focused calculator button (probe P2). The existing AC-5 row cannot see it — it dispatches on `document.body` with `repeat: false` (`keyboard.test.js:164-180`) — so the deviation is invisible to the suite as well as to the unit file. The behavior is defensible (AC-6's "exactly one action per press" has to win over "an unmapped key is inert" when the key is activating a focused button, and no browser shortcut is bound to `Space` on a focused button), and `Tab` and the modifier rows are unchanged and still green. What is missing is that the exception is stated **only** in a code comment that points at a *rejected* decision record. | Record the scope qualification rather than change the code: AC-5/OQ-2's `preventDefault` clause applies to keys that do **not** target a calculator button; inside the native-activation branch, `preventDefault` is the only lever the adapter has and it is used for repeats only. Covered by the proposed `D-013` below (§2 and §4). Optionally one clause in `README.md:29` ("unmapped keys such as `Tab` behave as normal" → note that `Space` on a focused button activates that button). ≈3 lines of prose, no code. |
| F-3 | Minor | `.agent/units/KEY-001.matrix.md:80-90, 188` vs `tests/integration/keyboard.test.js:247-256, 407-423` | **Traceability: neither of this unit's two defect-fix pinning tests has a matrix row, and one matrix note is now stale.** The matrix is the AC→test map the DoD is read against and is meant to read as the specification (CLAUDE.md §9, §12). The `D-011` focus-retention assertion was folded into a row describing only the mouse-click half (`arch2` F-2, still open), and the cycle-3 row "holding Enter on a Tab focused digit button performs the action once" has no matrix entry at all — so the two behaviors that cost this unit two review cycles are the two the matrix does not name. Separately, matrix line 188 states "no scenario in this matrix calls `preventDefault()` on a focused-button `Enter`/`Space`", which was true when written and is now false of production: the stub's `defaultPrevented` gate at `dom-stub.js:118-122` has become load-bearing for shipped behavior. `validate.mjs` only checks matrix-row → test, not the converse, so nothing flags this. | Two matrix rows under AC-6/AC-7 (focus retention after native activation; repeat native activation acts once) and a one-line correction to the line-188 note. ≈4 lines in one file, no code, no behavior change. This is the test-designer's file, so it is a matrix amendment in this unit or the next one that touches AC-6/AC-7 — not blocking, and consistent with how `arch2` F-2 was already carried. |
| F-4 | Nit | `script.js:98`; `tests/helpers/dom-stub.js:542-554` | **The new guard fails open on a missing `event.repeat`, in the same way `event.detail` does** (`arch2` F-3, still open). `if (event.repeat)` reads `undefined` as "not a repeat", and `page.dispatch` spreads `init` without defaulting `repeat`, so a future test author writing a held-key row and forgetting `repeat: true` gets a silently vacuous pass — the same class of test that cannot fail for the defect it appears to cover, which is what r1 F-1 and my own arch1 F-1 were about. Production is safe (a real `KeyboardEvent` always carries a boolean `repeat`), so this is a test-double hardening item only. | One line in `page.dispatch`: for `type === 'keydown'`, default `repeat: false` explicitly (or require it), alongside the `detail` default `arch2` F-3 already asks for — they are the same fix in the same function. Fold into whichever unit next touches the stub; not this unit's obligation. |

## Assessments
- **Does the fix follow `D-005`? (dispatch question 1)** Yes, on every clause I can check at this ref.
  (1) Core pure — HELD (probe C; `calculator-core.js` is not in the diff). (2) One mutable binding —
  HELD (probe S: `let state` is still the only one; no "was the last activation a repeat" flag, no
  "last key" variable — the class of fix `D-011` explicitly rejected was not smuggled in). (3) One
  dispatch seam per channel — HELD: one `applyInput` call, two `textContent` writes both inside
  `updateDisplay`, zero `.click(` calls in code. The fix does not add a path *into* `dispatch`; it
  removes one the browser was driving. (4) Validation split — HELD (the fix touches neither
  `inputFromElement` nor the core's throws). (5) Vocabulary exported once — HELD; notably the fix
  does **not** call `inputFromElement` at all, so it adds no new consumer. (6) Channel-agnostic
  policy is pure — HELD, and this is the clause the shipped fix gets right and `D-012` got wrong:
  `allowsRepeat` is a predicate on a **descriptor**, so by clause 6 it governs the channel that
  builds descriptors (the document-level keydown path). "A physical press must activate a focused
  button once" is a predicate on an **event and the browser's default action** — `event.target`,
  focus, `preventDefault` — which clause 6's own second sentence assigns to the adapter. `D-012`
  would have applied a descriptor-level policy to a channel it does not govern; the shipped guard
  keeps the two rules in the two layers clause 6 puts them in, and reads `event.repeat` straight off
  the event exactly as `D-011`'s rule requires for origin. (7) Presentation may not read core state —
  not exercised, still supported for `KEY-002`.
- **Two defects in one branch across two cycles: structural problem or incremental discovery?
  (dispatch question 2)** My answer: a **localized structural weakness, real but not a decomposition
  error**, and the proportionate response is a written case set plus the missing coverage — not a
  restructure. The pattern is genuine, not coincidence. The adapter has one dispatch seam but two
  *entrants* into it: the path it drives (`keydown` → `mapKey` → `dispatch`) and a path the **browser**
  drives (focused button → synthesized activation click → click listener → `dispatch`). For the second
  entrant the adapter has only *negative* levers: what it declines to handle (the early `return`) and
  `preventDefault()`. So every policy that must hold across channels has to be re-expressed in
  negative form inside this one branch, and no single place in the code states the branch's full case
  set. Both defects have literally the same shape — "we forgot to say no to the browser in case X"
  (X = the synthesized click is indistinguishable from a mouse click; X = the activation repeats).
  That is a design that makes omissions likely and makes them invisible, which is exactly what
  happened twice.
  What it is **not** is wrong decomposition. Delegating to the browser's native activation is a
  deliberate accessibility requirement (AC-6, OQ-3, and `D-005` clause 3's ban on simulating a
  channel), and the branch is small (4 combinations of key × repeat over one predicate). The
  case set is closed and tiny: `{Enter, Space}` × `{repeat, non-repeat}` × `{calculator-button target,
  other target}` = 8 cells, of which 4 are pinned by tests today, 2 (held `Space`) are unpinned (F-1)
  and 2 (a focused non-calculator control, probe P8) are a recorded sec1 Nit. Writing that table down
  once and pinning the two open cells costs ~20 lines and removes the omission mode; it is the fix
  that matches the evidence.
- **Rejected alternative — take activation over entirely** (`preventDefault()` unconditionally on
  `Enter`/`Space` for a calculator button and `dispatch(inputFromElement(event.target))` from the
  keydown path). This is the structurally cleanest option: it collapses the two entrants into one, so
  every present and future policy applies uniformly and the negative-lever problem disappears. I
  reject it, same as `arch2` did but for sharper reasons now that `Space` is in scope: it discards the
  browser's real activation semantics (`Enter` on keydown, `Space` on keyup, `:active` feedback, the
  activation event sequence assistive technology expects) that this unit exists to preserve, it
  re-implements a default action the browser already performs correctly, its failure mode is
  *silent divergence from every browser* rather than a visible bug, and it is unverifiable here (RK-3)
  in the one area where we have no oracle. Cost: ~10 lines of code but a full re-review of AC-6 and a
  manual browser pass we cannot run. Benefit: uniformity we can buy for ~20 lines of tests and prose
  instead. Wrong trade at two channels. I record it because it is the obvious idea and someone will
  propose it again.
- **Rejected alternative — gate on `allowsRepeat`** (`D-012`): refuted by probe M2, not merely
  out-voted. Recorded in `D-013` §2 so the refutation survives as a positive rule rather than as a
  rejected record a future reader has to reconstruct.
- **Is the 4-line unconditional guard the right shape?** Yes. It is the minimum expression of "the
  browser may activate this button once per physical press" at the only point in the adapter that can
  see `event.repeat`, it adds no state, no function, no indirection and no new boundary, and it sits
  inside the branch that already owns this interaction rather than creating a second place to look.
  The one shape wart is that the branch now has two exits that differ only in a side effect
  (`if (event.repeat) { preventDefault(); return; } return;` where
  `if (event.repeat) event.preventDefault(); return;` says the same thing); harmless, and I would not
  ask for a commit for it — worth folding in only if the branch is edited again.
- **Boundaries, coupling, cohesion**: unchanged and good. Dependency direction is still one-way
  (adapter → core); no new function, no God function, no circular reference. The keydown listener is
  ~20 lines with two clearly separated halves (native-activation branch, then map-and-dispatch).
- **Hidden state / impossible combinations**: none added. The implicit state this design leans on is
  still the browser's focus, read in one handler (`isCalculatorButton(event.target)`) and written in
  the other (`blur()`), and the fix adds no adapter-held memory of the key's press history — it reads
  `event.repeat`, which is the browser's own answer to "is this the same physical press".
- **Testability seams**: improved. The new row drives the exact interaction from a test with no
  production hook, and probes M1–M3 show it is discriminating in three independent directions
  (guard removed, guard mis-gated, `preventDefault` dropped). M4 is where the seam is still blind
  (F-1).
- **Extensibility vs YAGNI**: nothing speculative added — no repeat-policy registry, no channel
  abstraction. The next channel (touch, paste) inherits `D-011`'s origin rule and, via `D-013`, the
  statement that native-activation policy is per-press while descriptor policy is per-descriptor.
  The previously load-bearing coupling — AC-7 holding only because every non-repeatable input happens
  to be idempotent in the state that follows it — is **gone**, which is the main extensibility gain of
  this commit: the common next feature "repeated `=` re-applies the last operation" no longer has a
  trap waiting for it. That was `D-012`'s stated trigger and it is now moot.
- **Consistency (CLAUDE.md §4)**: 2-space indent, single quotes, semicolons, `const`/`let`, comments
  explain *why*. One caveat: the comment cites "`D-012` rejected, r2 F-1" — a pointer to a record
  whose headline decision is a rejection, which is fragile documentation for the unit's most subtle
  behavior. `D-013` exists to give it a positive referent.
- **Constraints**: zero dependencies (no `package.json`, none added); classic scripts only
  (`index.html` is not in the diff, no `type="module"`); no build step; `file://` intact —
  `event.repeat` and `preventDefault()` are plain `KeyboardEvent` members needing nothing a `file://`
  page lacks. `node --check` passes on both shipped files.
- **Migration / rollback cost**: the lowest of the three cycles. The fix is a self-contained 4-line
  guard inside one branch; reverting it restores the `5678cc1b` behavior and fails exactly one named
  test loudly. No stub change, no core change, no new export, no data-shape change. The cycle-1 note
  still applies: `inputFromElement` depends on `isInput`, so `calculator-core.js` and `script.js` must
  be reverted together.

## Proposed decision
`.agent/decisions/D-013-native-activation-is-the-browser-channel.md` (`status: proposed`).

What it protects against that the current fix does not: today the rule lives only in a code comment
that points at a **rejected** record, so a future reader must reconstruct the argument from a
rejection. The two most natural "simplifications" of this branch are both wrong, and one of them the
suite does not even catch (M4: narrowing to `Enter` → 47/47 green while held `Space` regresses). The
record states the positive rule, the closed case table with its pinning status, the AC-5/OQ-2 scope
qualification from F-2, and the two refuted alternatives with the probe results that refute them. It
is documentation of an existing shipped behavior, not a change: adopting it requires no code edit and
no new commit to the product files.

## Unverifiable
- **Real browser behavior** (no browser available, RK-3): that a held `Enter` on a focused button
  really drives repeated native activation the way `dom-stub.js:118-139` models it (the premise the
  fix answers); that a browser activates a button on `Space` **keyup** and how it treats a cancelled
  *repeat* keydown — the two possible outcomes for held `Space` on a focused button are "acts once"
  (expected) and "acts zero times" (the F-1 risk), and the stub can distinguish neither; that a
  native activation really reports `detail === 0` and a pointer click `detail >= 1` (`D-011`'s basis,
  carried from cycle 2); that `preventDefault()` on a repeat does not disturb an IME or assistive
  technology. A manual pass by the user is required; F-1 names the one new line for that checklist.
- **Real OS auto-repeat timing and rate**: not modeled; every "held key" here is a synthetic sequence
  of keydowns, so the tests prove the *policy*, never the timing.
- **Focus-ring and screen-reader consequences** of suppressing a repeat activation: not observable in
  the stub.
- **Sequential focus navigation after `blur()`** (carried from cycle 2, unchanged by this fix): some
  browsers reset the focus navigation starting point after a programmatic `blur()`. Residual risk of
  the user-chosen `D-011` Option A, not a finding.
- I did not read handoffs `KEY-001-04`, `-06`, `-08`, `-16`, `-24` (off limits by dispatch), so no
  implementer or integration-tester narrative informs any statement above.
