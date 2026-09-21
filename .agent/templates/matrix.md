# AREA-000 — Test Matrix

Every AC in the unit file must appear at least once. **Column 2 is a quoted test name (`"…"`) and becomes the literal title of a test in the test source**: `validate.mjs state` fails if a named test does not exist verbatim, or if an AC has no named row. Names must not contain double quotes. Tests are designed from behavior, not from the implementation. Categories: happy, boundary, invalid, error, edge, security, state, recovery (omit a category only with a stated reason).

| AC | Test case (behavioral name) | Layer | Category | Input / setup | Expected result |
|---|---|---|---|---|---|
| AC-1 | "…" | unit | happy | … | … |
| AC-1 | "…" | unit | boundary | … | … |
| AC-2 | "…" | integration | error | … | … |

## Not covered (with reason)
- Category / case, why, residual risk.

## Regression impact
Existing tests/behaviors likely affected, and existing tests that must be expanded (list paths). New regression tests to register in `tests/regression/REGISTRY.md`.

## Adequacy self-check
- [ ] Each AC has ≥1 test that would FAIL if the behavior were absent
- [ ] Invalid input and error paths covered
- [ ] State transitions covered (sequence tests, not just single actions)
- [ ] No test asserts implementation details
