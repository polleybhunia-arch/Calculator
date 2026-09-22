---
kind: test-change
id: D-009
unit: KEY-001
status: accepted
decided_by: orchestrator@claude-sonnet-5 (FALLBACK(opus->sonnet)); the change is planned in the KEY-001 matrix and will be made by integration-tester
---

# D-009 — widen the static security scan to index.html and fix a comment-stripper blind spot

## Context
Carried forward from the `BOOT-001` reviews with the user's approval (`.agent/units/KEY-001.md`,
"Carried forward from the BOOT-001 reviews", items 2 and 3; findings `BOOT-001-sec1` F-1/F-2,
`BOOT-001-arch1` F-1, `BOOT-001-r1` F-4). `tests/helpers/source-scan.js` and
`tests/regression/source-safety.test.js` are pre-existing `BOOT-001` files; `validate.mjs state`
requires a `kind: test-change` decision for their modification (CLAUDE.md §14). `tests/regression/
REGISTRY.md` is also touched (both a note on the widened existing rows and new `KEY-001`-origin rows)
and is covered by this same decision, following the precedent of `D-004`/`D-007`.

Two gaps, both confirmed by the `BOOT-001` reviewers reading the code:
1. The three security-scan tests in `source-safety.test.js` (no eval/new Function/document.write; no
   innerHTML/outerHTML/insertAdjacentHTML; no third-party/CDN host) apply their patterns to
   `SCRIPT_FILES` (`script.js`, `calculator-core.js`) only. `index.html` is scanned separately for
   `type="module"` and non-relative `src`/`href` only — an inline `onclick="eval(x)"` or a
   protocol-relative URL outside an attribute would pass today.
2. `stripComments` in `source-scan.js` mis-parses a regex literal containing an escaped `//` (e.g.
   `/https?:\/\//`): it treats the second `//` as a line comment and discards the rest of the line,
   which can hide a following `eval(` or `innerHTML=` on the same line.

## Decision
Accept the modification of `tests/helpers/source-scan.js`, `tests/regression/source-safety.test.js`
and `tests/regression/REGISTRY.md`.

- **Old expectation**: the three named security-scan tests pass when `script.js` and
  `calculator-core.js` are clean, regardless of `index.html`'s inline content; `stripComments` can
  silently drop code after a `//`-containing regex literal.
- **New expectation**: the same three tests (same names, unmodified assertions widened to a third
  file) also scan `index.html`'s raw markup (HTML comments stripped first) for the same patterns, and
  fail if it contains dynamic code, a markup-write API name, or a bare protocol-relative host outside
  an attribute; a new fourth test in the same file pins that `stripComments` keeps code following a
  `//`-containing regex literal. `REGISTRY.md` keeps its 17 existing rows unchanged and gains: a note
  on the three widened rows recording the expanded scope, plus new rows for `KEY-001`'s own
  regression file and the one new `source-safety.test.js` row.
- **Why**: the gap is real (confirmed by probe in the `BOOT-001` reviews) and the fix is exactly the
  kind of test-strength improvement CLAUDE.md §14 asks for when a defect class is found.

## Alternatives considered
- Leave `index.html` unscanned and accept the residual risk. Rejected: the user approved fixing it now
  (`KEY-001`'s carried-forward list), and `KEY-001` already touches `index.html` structurally (no —
  in fact it does not; but it does touch the click handler these tests are meant to guard).
- A new scan file instead of modifying `source-safety.test.js`. Rejected: it would duplicate the three
  existing tests instead of widening them, leaving the old, narrower versions to bit-rot.

## Consequences / residual risk
- Reviewers should confirm from `git diff` that only the intended widening happened: the three
  existing test bodies gain a third file to scan and the `stripComments` fix, plus one new test; no
  existing assertion is weakened or removed.
- The scan remains a static approximation (RK-2 residual): it cannot catch every conceivable
  obfuscation of dynamic code or a markup write.
