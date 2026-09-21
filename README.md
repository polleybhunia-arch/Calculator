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
- Division-by-zero shows `Error`
- Responsive layout for small screens

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
