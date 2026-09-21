---
unit: BOOT-001
from: security-reviewer
to: orchestrator
sequence: 15
model_attested: claude-opus-5
state: REVIEW
---

# Handoff BOOT-001-15: security-reviewer → orchestrator

## Context
Independent security review of `BOOT-001` at `head_ref` `28a19873b0c03224e111afb30e44829c919c9945`
(`base_ref` `e02035bab13f5365a110b60a86ba3a8ae42063ed`), dispatched by
`.agent/handoffs/BOOT-001-12-orchestrator-to-security-reviewer.md`. Attacker model as dispatched:
the DOM is hostile — button markup and every `data-*` attribute value are attacker-controlled.

I am running on **claude-opus-5** (Opus family). No fallback applies to this review; the dispatch
handoff's `FALLBACK(opus->sonnet)` marks the orchestrator session, not this agent.

Independence: handoffs `BOOT-001-06`, `-08` and `-10` were not opened. I did not read the
code reviewer's or architecture reviewer's dispatch either. Verdict is from the code, the tests and
my own runs.

## Acceptance criteria
Security-relevant subset named in the dispatch: AC-1, AC-6, AC-7 of `.agent/units/BOOT-001.md`.
All three are recorded `SATISFIED` in the review file, each with the evidence I produced myself.
AC-2…AC-5 and AC-8 are behavior criteria; I deliberately did not rule on them so the machine-read
AC block stays the code reviewer's.

## Tests created / executed
- created: none (read-only review; the only files I wrote are the review and this handoff)
- executed at `head_ref`, gate commands taken from `.agent/gates.json`, run directly rather than
  through `run-gate.mjs` because the dispatch forbids changing any other file and `run-gate.mjs`
  writes `.agent/test-results/`:
  - `node --test "tests/unit/**/*.test.js"` → 52 tests, 52 pass, 0 fail
  - `node --test "tests/integration/**/*.test.js"` → 20 tests, 20 pass, 0 fail
  - `node --test "tests/regression/**/*.test.js"` → 13 tests, 13 pass, 0 fail
  - `node --check script.js`, `node --check calculator-core.js` → both parse
- read (not trusted, compared against my runs): `.agent/test-results/BOOT-001/latest-unit-final.json`,
  `latest-integration-final.json`, `latest-regression-final.json`, `latest-lint-final.json`
- additional experiments, all via `node --eval` with nothing written to disk: 40 malformed core
  descriptors, 19 hostile click targets through the DOM stub, numeric/unbounded-growth extremes, a
  static-scan evasion battery, and three mutation probes of the `script.js` boundary filter.

## Results
**Verdict: APPROVED.** Review file: `.agent/reviews/BOOT-001-sec1.md`
(`reviewed_ref: 28a19873b0c03224e111afb30e44829c919c9945`, `model_attested: claude-opus-5`).

No exploitable weakness at this ref. Evidence counts above match the orchestrator's final evidence
files exactly (52 / 20 / 13, `dirty: false`, `head` = `28a19873…`).

Five Minor findings, none Critical or Major, none blocking:
- **F-1** `tests/regression/source-safety.test.js` applies the `eval` / `new Function` /
  `document.write` / `innerHTML` / module-syntax scans to `script.js` and `calculator-core.js` only.
  `index.html` is checked for just `type="module"` tags and non-relative `src`/`href`. I verified
  that an injected `onclick="eval(atob(x))"` attribute leaves all five regression tests green.
  AC-7's wording covers all three files, so the test under-implements it. Not exploitable at this
  ref (index.html has zero inline handlers, verified).
- **F-2** `stripComments` in `tests/helpers/source-scan.js` has a false negative, not just the
  documented noise: a regex literal such as `/https?:\/\//` makes the stripper treat the trailing
  `//` as a line comment and discard the rest of the line, hiding a following `eval(` or
  `innerHTML =` from the scan. Demonstrated. No shipped file uses a regex literal today.
- **F-3** Mutation probes: replacing `OPERATOR_VALUES.includes(operator)` or
  `ACTION_VALUES.includes(action)` in `script.js` with `true` leaves the integration suite at 20/20 —
  those two boundary branches are pinned by no test. The `data-number` branch *is* pinned. No
  vulnerability today (the core's `Map` lookups still reject the values), but the degraded failure
  mode is an uncaught `TypeError` in the click handler with no user-visible `Error`, and a future
  `Map`→object-literal "simplification" in the core would reopen prototype-chain resolution with
  zero failing tests.
- **F-4** `tests/helpers/dom-stub.js` silently honours `CALC_STUB_TRANSFORM` and rewrites shipped
  script source in memory; `run-gate.mjs` records command/SHA/dirty but not the environment, so a
  gate run under that variable yields an evidence JSON indistinguishable from an honest one. Evidence
  integrity, not a product vulnerability.
- **F-5** (Nit) `script.js:35` destructures `element.dataset` with no guard; unreachable today,
  reachable the day a button gets an `<svg>` child on an engine without `SVGElement.dataset`.

Positive findings worth recording: the diff is a net security improvement. At `e02035b`,
`script.js` passed `dataset.number` into the state with no validation at all and resolved
`dataset.operator` through an object literal (`operatorSymbols[...]`, so `data-operator="constructor"`
resolved through the prototype chain). Both are gone. The core's use of `Map` for `OPERATORS` and
`ACTIONS` is what makes prototype-keyed values safe; D-003 records this and the code matches. No
dependency, lockfile, third-party script, CDN, absolute URL, network call, storage use or secret
appears anywhere in the diff (grepped). Display writes are `textContent` only, at exactly two sites.

## Decisions made
- Verdict `APPROVED` rather than `CHANGES_REQUIRED`: per the review template, `APPROVED` is blocked
  only by an unsatisfied AC or an open Critical/Major finding. Every security property the findings
  guard (no dynamic code, no markup sink, no prototype pollution, no external reference) I verified
  directly at this ref; F-1…F-3 weaken the *durability* of those guards, not the current state.
- Gates re-run with the raw `.agent/gates.json` commands instead of `run-gate.mjs`, to honour the
  dispatch's "change no file except your review and handoff". This produced no new evidence file;
  the authoritative evidence stays the orchestrator's.

## Known risks
- All DOM conclusions rest on `tests/helpers/dom-stub.js`, which models no CSS, layout, focus, real
  pointer events, capture-phase listeners, real markup parsing or `file://` loading. A divergence
  between its `dataset` Proxy and a real `DOMStringMap` would not be caught. No browser exists in
  this environment, so real-browser DOM safety is `UNVERIFIED`.
- F-1 and F-2 mean the security regression net has two known holes; both are clean today but neither
  will announce itself if a later unit edits `index.html` or adds a regex literal.
- The lint gate does not cover `calculator-core.js` (OQ-7, human-owned, blocks gate 8). I ran
  `node --check calculator-core.js` by hand; that is not gate evidence.

## Outstanding issues
- F-1, F-2 and F-3 are worth a follow-up unit that hardens the security regression net (scan
  `index.html` for the dynamic-code and markup families plus inline `on*=` attributes; fix or
  compensate for the `stripComments` regex-literal hole; add integration rows asserting the
  *display result* of hostile `data-operator` / `data-action` / empty `data-*` clicks). They do not
  block `BOOT-001`.
- F-4 concerns workflow-tool integrity (`dom-stub.js` env hook vs `run-gate.mjs` evidence) and is a
  human/tooling decision, not product code.

## Required next action
Record `security_review: APPROVED` in `.agent/units/BOOT-001.md` frontmatter with this review file
(`.agent/reviews/BOOT-001-sec1.md`, `reviewed_ref` `28a19873b0c03224e111afb30e44829c919c9945`,
`security-reviewer@claude-opus-5`), log the transition line, and carry F-1…F-5 forward as
non-blocking follow-up items (unit Log or a new unit) rather than as open findings against this
head_ref. This verdict is void if any new commit lands on `BOOT-001`.
