'use strict';
// Regression (KEY-001): keyboard-vs-click parity and the GUARD proof that extending
// tests/helpers/dom-stub.js and adding the click-handler blur() (AC-6) never regress the
// existing mouse-click behavior. Real index.html + real page scripts through the extended
// tests/helpers/dom-stub.js. Registered in tests/regression/REGISTRY.md, origin KEY-001.
//
// D-010 stage order: only the GUARD row is written in this commit (sub-step 1), proved against
// the extended stub but the UNMODIFIED script.js (no keydown listener, no blur() call yet) --
// this is the "before" run, proving the stub extension alone breaks nothing. The remaining six
// rows of this file (key-vs-click parity, Ctrl+R inertness, the two README documentation rows)
// are added in sub-step 3, RED-first against the still-unimplemented keyboard feature. After the
// implementer adds the keydown listener and the blur() call, this same GUARD row is re-run
// unchanged as the "after" proof.

const test = require('node:test');
const { loadPage } = require('../helpers/dom-stub.js');
const assert = require('node:assert/strict');

const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

// Whole-pair equality, so a stray character on either line fails. The message carries both pairs
// so a failure shows the actual values, not only which behavior broke.
function assertDisplay(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label}: page shows ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

test('every README click sequence still renders correctly once the keyboard listener and click blur are installed', () => {
  // GUARD: replays, via clicks only, the same eight sequences tests/regression/readme-behavior.test.js
  // pins for BOOT-001. A mouse-click-only sequence never triggers the keydown listener, and blur()
  // has no visible effect without a following key, so nothing here should ever change -- this row
  // must be green both before (this commit, stub extended, script.js unmodified) and after (the
  // implementer's blur() lands) the KEY-001 implementation.
  const liveTrail = loadPage();
  const steps = [['4', '4'], ['+', '4+'], ['8', '4+8'], ['+', '4+8+'], ['9', '4+8+9']];
  for (const [token, current] of steps) {
    assertDisplay(liveTrail.press(token), display('', current), `GUARD live trail after clicking ${token}`);
  }

  assertDisplay(loadPage().press('4 + 8 + 9 ='), display('4+8+9', '21'), 'GUARD: = splits expression and result');

  assertDisplay(loadPage().press('2 + 3 * 4 ='), display(`2+3${TIMES}4`, '20'), 'GUARD: 2+3*4 is 20, not 14');
  assertDisplay(loadPage().press('8 - 4 - 2 ='), display(`8${MINUS}4${MINUS}2`, '2'), 'GUARD: 8-4-2 is 2, not 6');

  assertDisplay(loadPage().press('4 + 8 + 9 = + 5 ='), display('21+5', '26'), 'GUARD: continue from result 21');

  assertDisplay(loadPage().press('1 . 5 + 2 . 2 5 ='), display('1.5+2.25', '3.75'), 'GUARD: decimal operands');

  assertDisplay(loadPage().press('0 . 1 + 0 . 2 ='), display('0.1+0.2', '0.3'), 'GUARD: 0.1+0.2 is 0.3');
  assertDisplay(loadPage().press('1 / 3 ='), display(`1${DIVIDE}3`, '0.3333333333'), 'GUARD: ten decimal places');

  assertDisplay(loadPage().press('5 / 0 ='), display(`5${DIVIDE}0`, 'Error'), 'GUARD: divide by zero');

  assertDisplay(loadPage().press('5 / 0 = 7'), display('', '7'), 'GUARD: digit after Error starts fresh');
});
