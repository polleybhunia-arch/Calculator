# Regression Registry

Living specification of the product. Every regression test appears here with the requirement or defect that justifies it. Tests are never removed for convenience; a changed expectation needs a `kind: test-change` decision in `.agent/decisions/`.

| Test file :: test name | Origin unit | Behavior preserved | Notes |
|---|---|---|---|
| `tests/regression/readme-behavior.test.js` :: README live trail shows the whole expression 4+8+9 while typing | BOOT-001 | README: the main line shows the growing expression while typing (`4`, `4+`, `4+8`, `4+8+`, `4+8+9`), expression line stays empty | Driven through real `index.html` + page scripts via `tests/helpers/dom-stub.js` |
| `tests/regression/readme-behavior.test.js` :: README equals shows the expression on the small line and the result below | BOOT-001 | README: `=` splits the display into expression `4+8+9` (small line) and result `21` | |
| `tests/regression/readme-behavior.test.js` :: README chained calculations evaluate left to right | BOOT-001 | README: chained operations, left to right, no precedence (`2+3×4=20`, `8−4−2=2`) | Operator glyphs are U+00D7 / U+2212 |
| `tests/regression/readme-behavior.test.js` :: README operator right after equals continues from the result | BOOT-001 | README: an operator after `=` continues from the result (`4+8+9=` then `+5=` gives `21+5` / `26`) | |
| `tests/regression/readme-behavior.test.js` :: README decimal point support adds decimal operands | BOOT-001 | README: decimals (`1.5+2.25=3.75`) | |
| `tests/regression/readme-behavior.test.js` :: README floating-point rounding trims noise and limits decimals | BOOT-001 | README: `0.1+0.2` shows `0.3`; results limited to ten decimal places (`1÷3` gives `0.3333333333`) | |
| `tests/regression/readme-behavior.test.js` :: README division by zero shows Error | BOOT-001 | README: `5÷0=` shows `Error` (division by zero as the last step only; the mid-chain path is owned by `CALC-001` and deliberately not pinned here) | |
| `tests/regression/readme-behavior.test.js` :: baseline Error recovery starts a fresh calculation on the next digit | BOOT-001 | Historical baseline (README silent): a digit after `Error` starts a brand-new calculation (`5÷0=` then `7` gives `7`, expression line empty) | Baseline behavior at `e02035b`; changing it needs a `kind: test-change` decision |
