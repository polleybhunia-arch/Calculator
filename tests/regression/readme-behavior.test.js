'use strict';
// Regression: one test per README-documented behavior, driven through the real page
// (index.html + page scripts via tests/helpers/dom-stub.js). Registered in REGISTRY.md.
// Any changed expectation here needs a `kind: test-change` decision record (CLAUDE.md section 14).

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPage } = require('../helpers/dom-stub.js');

const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

test('README live trail shows the whole expression 4+8+9 while typing', () => {
  const page = loadPage();
  const steps = [['4', '4'], ['+', '4+'], ['8', '4+8'], ['+', '4+8+'], ['9', '4+8+9']];

  for (const [token, current] of steps) {
    assert.deepEqual(page.press(token), display('', current), `README live trail after clicking ${token}`);
  }
});

test('README equals shows the expression on the small line and the result below', () => {
  assert.deepEqual(loadPage().press('4 + 8 + 9 ='), display('4+8+9', '21'), 'README: = splits expression and result');
});

test('README chained calculations evaluate left to right', () => {
  assert.deepEqual(loadPage().press('2 + 3 * 4 ='), display(`2+3${TIMES}4`, '20'), 'README: 2+3*4 is 20, not 14');
  assert.deepEqual(loadPage().press('8 - 4 - 2 ='), display(`8${MINUS}4${MINUS}2`, '2'), 'README: 8-4-2 is 2, not 6');
});

test('README operator right after equals continues from the result', () => {
  assert.deepEqual(loadPage().press('4 + 8 + 9 = + 5 ='), display('21+5', '26'), 'README: continue from result 21');
});

test('README decimal point support adds decimal operands', () => {
  assert.deepEqual(loadPage().press('1 . 5 + 2 . 2 5 ='), display('1.5+2.25', '3.75'), 'README: decimal operands');
});

test('README floating-point rounding trims noise and limits decimals', () => {
  assert.deepEqual(loadPage().press('0 . 1 + 0 . 2 ='), display('0.1+0.2', '0.3'), 'README: 0.1+0.2 is 0.3');
  assert.deepEqual(loadPage().press('1 / 3 ='), display(`1${DIVIDE}3`, '0.3333333333'), 'README: ten decimal places');
});

test('README division by zero shows Error', () => {
  assert.deepEqual(loadPage().press('5 / 0 ='), display(`5${DIVIDE}0`, 'Error'), 'README: divide by zero');
});

test('baseline Error recovery starts a fresh calculation on the next digit', () => {
  assert.deepEqual(loadPage().press('5 / 0 = 7'), display('', '7'), 'baseline: digit after Error starts fresh (README silent)');
});
