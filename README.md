# Calculator

A simple browser-based calculator with a dark theme, supporting basic arithmetic
(+, −, ×, ÷) and a live expression trail.

## Features

- Live expression display — see the full expression (e.g. `4+8+9`) as you type
- On pressing `=`, the expression is shown above the answer in a smaller, dimmed
  line, with the bold result below
- Chained calculations (e.g. `4+8+9=` evaluates left to right)
- Continue from a previous result by pressing an operator right after `=`
- Decimal point support and floating-point rounding (e.g. `0.1 + 0.2`)
- Division-by-zero shows `Error` as soon as the division is evaluated, including in the middle of a chain (e.g. `5 ÷ 0 +`)
- Responsive layout for small screens
- Full keyboard support — every on-screen button has a matching key (see [Keyboard](#keyboard) below)

## Keyboard

Every button also has a keyboard equivalent, so the calculator can be used without a mouse:

- Digits `0` to `9` type the matching digit
- `.` or `,` types the decimal point (`,` is an alternate decimal separator)
- `+` `-` `*` `/` choose the matching operator (shown on screen as `+` `−` `×` `÷`); `x` and `X` are alternates for multiply
- `Enter` or `=` evaluates the expression, the same as the on-screen `=` button
- `Backspace` deletes the last character, the same as the on-screen `DEL` button
- `Escape` or `Delete` clears everything, the same as the on-screen `AC` button
- Holding down a digit, `.`, `,` or `Backspace` repeats the action on every repeat; `Enter`, `=` and the operator keys act once per press even if held down
- `Ctrl`, `Cmd`/`Meta` and `Alt` combinations are left alone so browser and OS shortcuts keep working; `Shift` alone never blocks a mapped key, and unmapped keys such as `Tab` behave as normal

## Running it

No build step or dependencies required — it's plain HTML, CSS, and JavaScript.

**Option 1: Open directly**

Double-click [index.html](index.html), or open it from your browser with
`File > Open`.

**Option 2: Local server (recommended for consistent behavior)**

```bash
npx serve .
```

Then open the printed URL (e.g. `http://localhost:3000`) in your browser.

## Files

- [index.html](index.html) — markup and button layout
- [style.css](style.css) — dark theme styling
- [calculator-core.js](calculator-core.js) — calculator state machine and display strings (loaded before `script.js`)
- [script.js](script.js) — DOM layer: turns button clicks into calculator inputs and shows the result on the page
