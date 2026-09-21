'use strict';
// Unit layer for calculator-core.js (BOOT-001 AC-1..AC-5 and AC-8). Expectations are the rendered
// { expression, current } strings from .agent/units/BOOT-001.matrix.md; the core API names are
// recorded in .agent/decisions/D-003-core-api.md. This file must not define `document` or
// `window`: every row runs in the same process as the AC-1 "no DOM" row.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CORE_FILE = path.resolve(__dirname, '..', '..', 'calculator-core.js');
const ENTRY_POINTS = ['createState', 'applyInput', 'render'];

// Operator glyphs in the trail. A negative number's sign is the ASCII hyphen-minus, a different
// character from MINUS, so the two must never be typed interchangeably.
const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const OPERATOR_TOKENS = new Set(['+', '-', '*', '/']);
const ACTION_TOKENS = { '=': 'equals', AC: 'clear', DEL: 'delete' };

// A missing core must fail as an assertion about AC-1, never as MODULE_NOT_FOUND at import time.
function assertCoreFileExists() {
  assert.ok(fs.existsSync(CORE_FILE), 'AC-1: calculator-core.js must exist at the repository root');
}

function core() {
  assertCoreFileExists();
  const loaded = require(CORE_FILE);
  for (const name of ENTRY_POINTS) {
    assert.equal(typeof loaded[name], 'function', `AC-1: the core must expose ${name} as a function`);
  }
  return loaded;
}

function toInput(token) {
  if (OPERATOR_TOKENS.has(token)) {
    return { type: 'operator', value: token };
  }
  if (Object.hasOwn(ACTION_TOKENS, token)) {
    return { type: 'action', value: ACTION_TOKENS[token] };
  }
  if (token.length === 1 && '0123456789.'.includes(token)) {
    return { type: 'number', value: token };
  }
  throw new Error(`unit test helper: unknown input token "${token}"`);
}

const tokensOf = (tokens) => tokens.trim().split(/\s+/).filter(Boolean);
const fresh = () => core().createState();
const rendered = (state) => core().render(state);

function press(state, tokens) {
  const { applyInput } = core();
  return tokensOf(tokens).reduce((current, token) => applyInput(current, toInput(token)), state);
}

const run = (tokens) => press(fresh(), tokens);

function expectDisplay(state, expression, current, note) {
  assert.deepEqual(rendered(state), { expression, current }, note);
}

function expectRun(tokens, expression, current) {
  expectDisplay(run(tokens), expression, current, `after "${tokens}"`);
}

// --- AC-1: pure, importable core ---------------------------------------------------------------

test('loads in a Node process that defines no document or window', () => {
  assert.equal(typeof document, 'undefined', 'the test process must not define document');
  assert.equal(typeof window, 'undefined', 'the test process must not define window');
  assertCoreFileExists();

  // A fresh vm context whose only global is `module` proves load time touches no DOM global and
  // runs the file again instead of reusing the require cache.
  const sandbox = { module: { exports: {} } };
  assert.doesNotThrow(() => vm.runInNewContext(fs.readFileSync(CORE_FILE, 'utf8'), sandbox, { filename: CORE_FILE }));
  const exported = sandbox.module.exports;
  assert.ok(exported !== undefined && exported !== null, 'AC-1: the core must export an object');
  assert.ok(Object.keys(exported).length > 0, 'AC-1: the core must not export an empty object');
});

test('exposes fresh-state, apply-input and render entry points as functions', () => {
  assertCoreFileExists();
  const loaded = require(CORE_FILE);

  for (const name of ENTRY_POINTS) {
    assert.equal(typeof loaded[name], 'function', `AC-1: the core must expose ${name} as a function`);
  }
});

test('renders a fresh state as an empty expression line and 0', () => {
  expectDisplay(fresh(), '', '0');
});

test('keeps two fresh states independent of each other', () => {
  const a0 = fresh();
  const b0 = fresh();

  const a1 = press(a0, '5');
  const b1 = press(b0, '9');
  expectDisplay(a1, '', '5', 'state A after 5');
  expectDisplay(b1, '', '9', 'state B after 9');

  const a2 = press(a1, '+');
  expectDisplay(a2, '', '5+', 'state A after +');
  expectDisplay(b1, '', '9', 'state B after A received +');
});

test('leaves an earlier state unchanged when a later input is applied', () => {
  const s0 = fresh();
  const s1 = press(s0, '7');
  const s2 = press(s1, '+');

  expectDisplay(s0, '', '0', 's0 after two later inputs');
  expectDisplay(s1, '', '7', 's1 after a later input');
  expectDisplay(s2, '', '7+', 's2');
});

// --- AC-2: chaining, operators, digits ---------------------------------------------------------

test('chains 4+8+9 left to right and splits the display after equals', () => {
  expectRun('4 + 8 + 9 =', '4+8+9', '21');
});

test('shows the growing trail on the main line before equals', () => {
  const expectedCurrent = ['4', '4+', '4+8', '4+8+', '4+8+9'];
  const { applyInput } = core();
  let state = fresh();

  tokensOf('4 + 8 + 9').forEach((token, index) => {
    state = applyInput(state, toInput(token));
    expectDisplay(state, '', expectedCurrent[index], `after token ${index + 1} (${token})`);
  });
});

test('evaluates 2+3*4 left to right without operator precedence', () => {
  expectRun('2 + 3 * 4 =', `2+3${TIMES}4`, '20');
});

test('evaluates subtraction and division chains left to right', () => {
  expectRun('8 - 4 - 2 =', `8${MINUS}4${MINUS}2`, '2');
  expectRun('1 0 0 / 5 / 2 =', `100${DIVIDE}5${DIVIDE}2`, '10');
});

test('applies each of the four operators and renders its display symbol', () => {
  expectRun('9 + 3 =', '9+3', '12');
  expectRun('9 - 3 =', `9${MINUS}3`, '6');
  expectRun('6 * 7 =', `6${TIMES}7`, '42');
  expectRun('8 / 2 =', `8${DIVIDE}2`, '4');
});

test('accepts a long run of typed digits without truncating', () => {
  expectRun('1 2 3 4 5 6 7 8 9 0', '', '1234567890');
  expectRun('1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0', '', '12345678901234567890');
});

test('replaces a lone leading zero with the next digit', () => {
  expectRun('0 0 5', '', '5');
  expectRun('0 5', '', '5');
  expectRun('0 0', '', '0');
});

// --- AC-3: decimals, rounding, signs -----------------------------------------------------------

test('trims floating-point noise so 0.1+0.2 renders 0.3', () => {
  expectRun('0 . 1 + 0 . 2 =', '0.1+0.2', '0.3');
});

test('rounds a result to ten decimal places', () => {
  expectRun('1 / 3 =', `1${DIVIDE}3`, '0.3333333333');
  expectRun('2 / 3 =', `2${DIVIDE}3`, '0.6666666667');
});

test('rounds an intermediate chain result before applying the next operator', () => {
  expectRun('1 / 3 * 3 =', `1${DIVIDE}3${TIMES}3`, '0.9999999999');
});

test('rounds a result below the tenth decimal place to 0', () => {
  const tinyOperand = `0.${'0'.repeat(10)}1`;

  expectRun(`0 . ${'0 '.repeat(10)}1 + 0 =`, `${tinyOperand}+0`, '0');
});

test('renders negative zero as 0', () => {
  expectRun('0 - 5 * 0 =', `0${MINUS}5${TIMES}0`, '0');
});

test('renders a negative result with a leading hyphen-minus', () => {
  const result = run('3 - 5 =');

  expectDisplay(result, `3${MINUS}5`, '-2', 'after 3 - 5 =');
  assert.equal(rendered(result).current.codePointAt(0), 0x2d, 'the sign must be ASCII U+002D, not the operator glyph');
});

test('continues a calculation from a negative result', () => {
  expectRun('3 - 5 = + 1 =', '-2+1', '-1');
});

test('keeps a large whole-number result exact', () => {
  expectRun('1 2 3 4 5 6 7 8 9 * 1 0 0 0 =', `123456789${TIMES}1000`, '123456789000');
});

test('ignores a second decimal point in the same operand', () => {
  expectRun('1 . 2 . 3', '', '1.23');
});

test('builds decimal operands with a leading zero', () => {
  expectRun('.', '', '0.');
  expectRun('. 5', '', '0.5');
  expectRun('0 . 0 5', '', '0.05');
});

test('starts the next operand with 0. after an operator even when the held value has a decimal point', () => {
  expectRun('4 + .', '', '4+0.');
  expectRun('4 + . 5 =', '4+0.5', '4.5');
  expectRun('1 / 4 + .', '', `1${DIVIDE}4+0.`);
  expectRun('1 / 4 + . 5 =', `1${DIVIDE}4+0.5`, '0.75');
});

test('keeps a trailing decimal point in the trail', () => {
  expectRun('5 . +', '', '5.+');
  expectRun('5 . + 3 =', '5.+3', '8');
});

// --- AC-4: divide by zero and recovery ---------------------------------------------------------

test('renders Error when dividing by zero', () => {
  expectRun('5 / 0 =', `5${DIVIDE}0`, 'Error');
});

test('starts a brand-new calculation when a digit follows Error', () => {
  const afterDigit = run('5 / 0 = 7');

  expectDisplay(afterDigit, '', '7', 'after 5 / 0 = 7');
  expectDisplay(press(afterDigit, '+ 1 ='), '7+1', '8', 'after + 1 =');
});

test('treats every zero-valued divisor as zero', () => {
  expectRun('0 / 0 =', `0${DIVIDE}0`, 'Error');
  expectRun('5 / 0 . 0 =', `5${DIVIDE}0.0`, 'Error');
});

test('divides zero by a non-zero number without Error', () => {
  expectRun('0 / 5 =', `0${DIVIDE}5`, '0');
});

test('renders Error when the last step of a chain divides by zero', () => {
  expectRun('2 + 3 / 0 =', `2+3${DIVIDE}0`, 'Error');
});

test('clears Error and starts from 0 when an operator follows Error', () => {
  const afterOperator = run('5 / 0 = +');

  expectDisplay(afterOperator, '', '0+', 'after 5 / 0 = +');
  expectDisplay(press(afterOperator, '3 ='), '0+3', '3', 'after 3 =');
});

test('ignores a repeated equals while Error is shown', () => {
  expectRun('5 / 0 = =', `5${DIVIDE}0`, 'Error');
});

test('clears Error with AC', () => {
  const afterClear = run('5 / 0 = AC');

  expectDisplay(afterClear, '', '0', 'after 5 / 0 = AC');
  expectDisplay(press(afterClear, '4 + 4 ='), '4+4', '8', 'after 4 + 4 =');
});

test('clears Error with DEL', () => {
  const afterDelete = run('5 / 0 = DEL');

  expectDisplay(afterDelete, '', '0', 'after 5 / 0 = DEL');
  expectDisplay(press(afterDelete, '7'), '', '7', 'after 7');
});

// --- AC-5: continue from a result, operator replacement ----------------------------------------

test('continues from a result so 21 then +5= renders 21+5 and 26', () => {
  const result = run('4 + 8 + 9 =');
  expectDisplay(result, '4+8+9', '21', 'after 4 + 8 + 9 =');

  const afterOperator = press(result, '+');
  expectDisplay(afterOperator, '', '21+', 'after +');

  const afterDigit = press(afterOperator, '5');
  expectDisplay(afterDigit, '', '21+5', 'after 5');
  expectDisplay(press(afterDigit, '='), '21+5', '26', 'after =');
});

test('continues again from a second result', () => {
  expectRun('4 + 8 + 9 = + 5 = * 2 =', `26${TIMES}2`, '52');
});

test('replaces the pending operator instead of appending', () => {
  const afterPlus = run('4 +');
  const afterTimes = press(afterPlus, '*');
  const afterDivide = press(afterTimes, '/');

  expectDisplay(afterPlus, '', '4+', 'after +');
  expectDisplay(afterTimes, '', `4${TIMES}`, 'after +, then *');
  expectDisplay(afterDivide, '', `4${DIVIDE}`, 'after +, then *, then /');
});

test('uses the last chosen operator after a replacement', () => {
  expectRun('4 + * 2 =', `4${TIMES}2`, '8');
});

test('applies a replaced operator to the running result of a chain', () => {
  expectRun('4 + 8 + * 9 =', `4+8${TIMES}9`, '108');
});

test('replaces the operator chosen right after a result', () => {
  expectRun('4 + 8 + 9 = + * 5 =', `21${TIMES}5`, '105');
});

test('uses 0 as the left operand when an operator is the first input', () => {
  expectRun('+', '', '0+');
  expectRun('+ 5 =', '0+5', '5');
});

test('starts a new calculation when a digit follows a result', () => {
  expectRun('4 + 8 + 9 = 3', '', '3');
});

test('starts 0. when a decimal point follows a decimal result', () => {
  const result = run('1 / 4 =');
  expectDisplay(result, `1${DIVIDE}4`, '0.25', 'after 1 / 4 =');

  const afterPoint = press(result, '.');
  expectDisplay(afterPoint, '', '0.', 'after .');
  expectDisplay(press(afterPoint, '5'), '', '0.5', 'after 5');
});

// --- AC-8: edit, clear and equals inputs -------------------------------------------------------

test('AC clears the pending operator, the trail and the result', () => {
  const afterClear = run('4 + 8 AC');

  expectDisplay(afterClear, '', '0', 'after 4 + 8 AC');
  expectDisplay(press(afterClear, '5 ='), '', '5', 'after 5 = (no operator may survive AC)');
  expectRun('4 + 8 + 9 = AC', '', '0');
});

test('DEL removes the last typed character including a decimal point', () => {
  expectRun('1 2 3 DEL', '', '12');

  const afterFirstDelete = run('1 . 5 DEL');
  expectDisplay(afterFirstDelete, '', '1.', 'after 1 . 5 DEL');
  expectDisplay(press(afterFirstDelete, 'DEL'), '', '1', 'after the second DEL');
});

test('DEL on the last remaining digit or on a fresh state leaves 0', () => {
  expectRun('5 DEL', '', '0');
  expectRun('DEL', '', '0');
});

test('DEL in the second operand changes only that operand', () => {
  const afterDelete = run('4 + 8 DEL');

  expectDisplay(afterDelete, '', '4+0', 'after 4 + 8 DEL');
  expectDisplay(press(afterDelete, '5 ='), '4+5', '9', 'after 5 =');
});

test('DEL right after an operator clears the whole calculation', () => {
  const afterDelete = run('4 + DEL');

  expectDisplay(afterDelete, '', '0', 'after 4 + DEL');
  expectDisplay(press(afterDelete, '5 ='), '', '5', 'after 5 =');
});

test('DEL after a result clears the result and the expression line', () => {
  expectRun('4 + 8 + 9 = DEL', '', '0');
});

test('ignores equals when no operator is pending', () => {
  expectRun('=', '', '0');

  const afterEquals = run('5 =');
  expectDisplay(afterEquals, '', '5', 'after 5 =');
  expectDisplay(press(afterEquals, '+ 1 ='), '5+1', '6', 'after + 1 =');
});

test('uses the held value as the second operand when equals follows an operator', () => {
  expectRun('5 + =', '5+5', '10');
  expectRun('5 * =', `5${TIMES}5`, '25');
});

test('ignores a second equals after a result', () => {
  expectRun('4 + 8 + 9 = =', '4+8+9', '21');
});
