'use strict';
// Integration (CALC-001): a divide-by-zero resolved by an OPERATOR button press must show Error on
// the real page exactly as pressing = does. Real index.html + real page scripts (calculator-core.js
// then script.js) through tests/helpers/dom-stub.js, driven by button clicks.
// Boundary under test: operator button -> DOM layer -> core transition -> rendered display lines.
// The stub is the only fake; it cannot model CSS, layout, focus or real file:// loading (UNVERIFIED).

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPage } = require('../helpers/dom-stub.js');

// Exact code points (the operator minus U+2212 differs from the ASCII hyphen-minus sign).
const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

// Whole-pair equality, so a stray character on either line fails. The message carries both pairs so
// a failure shows the actual page values, not only which boundary broke.
function assertDisplay(actual, expected, boundary) {
  assert.deepEqual(actual, expected, `${boundary}: page shows ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

test('shows Error on the page for each operator button that resolves a divide-by-zero', () => {
  const sequences = ['5 / 0 +', '5 / 0 -', '5 / 0 *', '5 / 0 /'];

  for (const sequence of sequences) {
    // A fresh page per operator: no state carries over between the four cases.
    assertDisplay(loadPage().press(sequence), display(`5${DIVIDE}0`, 'Error'), `boundary: operator button in "${sequence}"`);
  }
});

test('starts a new calculation on the page when a digit is clicked after an operator-resolved Error', () => {
  const page = loadPage();

  // Precondition first: four of the five recovery inputs look the same before and after the fix, so
  // without this assertion the test would pass on the unfixed page and prove nothing.
  assertDisplay(page.press('5 / 0 +'), display(`5${DIVIDE}0`, 'Error'), 'precondition: after "5 / 0 +" and before any recovery click');
  assertDisplay(page.press('7'), display('', '7'), 'boundary: digit button after an operator-resolved Error');
});
