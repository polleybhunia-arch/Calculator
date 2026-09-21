'use strict';
// Unit layer for CALC-001: a divide-by-zero resolved by an OPERATOR press must leave the state that
// pressing = would have left at that point, and the pressed operator is discarded. Runs on the pure
// core with no DOM. Expectations are the rendered { expression, current } strings from
// .agent/units/CALC-001.matrix.md; the core API is recorded in .agent/decisions/D-003-core-api.md.
// This file is separate from calculator-core.test.js on purpose (BOOT-001's test files stay
// unmodified, matrix "Why new files"), so it defines its own small helpers.

const test = require('node:test');
const assert = require('node:assert/strict');
const { createState, applyInput, render } = require('../../calculator-core.js');

// Operator glyphs in the trail: minus is U+2212 (not the ASCII hyphen-minus), times U+00D7, divide U+00F7.
const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const OPERATOR_TOKENS = new Set(['+', '-', '*', '/']);
const ACTION_TOKENS = { '=': 'equals', AC: 'clear', DEL: 'delete' };

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

function press(state, tokens) {
  return tokens
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((current, token) => applyInput(current, toInput(token)), state);
}

const run = (tokens) => press(createState(), tokens);

// Whole-pair equality, so a stray character on either line fails. The message carries the actual
// pair, so a failure shows the value the core rendered, not only which expectation broke.
function expectDisplay(state, expression, current, note) {
  const actual = render(state);
  assert.deepEqual(actual, { expression, current }, `${note}: core rendered ${JSON.stringify(actual)}`);
}

// Precondition of every AC-4 row. Four of the five recovery inputs render the same values before
// and after the fix, so without this assertion an AC-4 row would pass on the unfixed core.
function runToOperatorResolvedError() {
  const state = run('5 / 0 +');
  expectDisplay(state, `5${DIVIDE}0`, 'Error', 'precondition: after "5 / 0 +" and before any recovery input');
  return state;
}

// --- AC-1: an operator press that resolves a divide-by-zero shows Error at once ---------------

test('shows Error at once when an operator press resolves 5 divided by 0', () => {
  expectDisplay(run('5 / 0 +'), `5${DIVIDE}0`, 'Error', 'after "5 / 0 +"');
});

test('leaves the earlier state unchanged when an operator press resolves a divide-by-zero', () => {
  const before = run('5 / 0');
  const after = applyInput(before, toInput('+'));

  expectDisplay(after, `5${DIVIDE}0`, 'Error', 'the state returned by the operator press');
  // The earlier state must still render as typed: the zero-divisor branch may not edit the
  // argument or the history array it shares with it.
  expectDisplay(before, '', `5${DIVIDE}0`, 'the state passed in, rendered again after the operator press');
});

// --- AC-2: the rule is the operator position, not one operator ---------------------------------

test('shows Error at once for each of the four operators pressed after 5 divided by 0', () => {
  for (const operator of ['+', '-', '*', '/']) {
    expectDisplay(run(`5 / 0 ${operator}`), `5${DIVIDE}0`, 'Error', `after "5 / 0 ${operator}"`);
  }
});

// --- AC-3: anywhere in a chain, whatever the divisor was typed as ------------------------------

test('shows the whole typed chain and Error when an operator resolves a divide-by-zero at the end of a chain', () => {
  // The pending 2+3 resolves to 5 on the way; the expression line keeps the typed chain, not 5÷0.
  expectDisplay(run('2 + 3 / 0 *'), `2+3${DIVIDE}0`, 'Error', 'after "2 + 3 / 0 *"');
});

test('shows Error when an operator resolves 0 divided by 0', () => {
  expectDisplay(run('0 / 0 +'), `0${DIVIDE}0`, 'Error', 'after "0 / 0 +"');
});

test('treats a divisor typed as 0.0 as zero when an operator resolves it', () => {
  expectDisplay(run('5 / 0 . 0 +'), `5${DIVIDE}0.0`, 'Error', 'after "5 / 0 . 0 +"');
});

test('treats a divisor typed as 0. as zero when an operator resolves it', () => {
  // (a) the point typed after a zero; (b) a bare point after the operator starts the operand 0.
  expectDisplay(run('5 / 0 . +'), `5${DIVIDE}0.`, 'Error', 'after "5 / 0 . +"');
  expectDisplay(run('5 / . +'), `5${DIVIDE}0.`, 'Error', 'after "5 / . +"');
});

test('shows Error when an operator resolves a divide-by-zero after continuing from a result', () => {
  const result = run('4 + 8 =');
  expectDisplay(result, '4+8', '12', 'precondition: after "4 + 8 ="');
  expectDisplay(press(result, '/ 0 +'), `12${DIVIDE}0`, 'Error', 'after "4 + 8 = / 0 +"');
});

// --- AC-4: recovery is identical to the recovery after 5 / 0 = ---------------------------------

test('starts a new calculation when a digit follows a divide-by-zero resolved by an operator', () => {
  const errored = runToOperatorResolvedError();
  const typed = press(errored, '7');
  expectDisplay(typed, '', '7', 'after the digit 7');
  expectDisplay(press(typed, '+ 1 ='), '7+1', '8', 'after "7 + 1 =", no residue of the error');
});

test('starts from 0 when an operator follows a divide-by-zero resolved by an operator', () => {
  const afterPlus = press(runToOperatorResolvedError(), '+');
  expectDisplay(afterPlus, '', '0+', 'after the operator +');
  expectDisplay(press(afterPlus, '3 ='), '0+3', '3', 'after "+ 3 ="');

  expectDisplay(press(runToOperatorResolvedError(), '-'), '', `0${MINUS}`, 'after the operator -');
  expectDisplay(press(runToOperatorResolvedError(), '*'), '', `0${TIMES}`, 'after the operator *');
  expectDisplay(press(runToOperatorResolvedError(), '/'), '', `0${DIVIDE}`, 'after the operator /');
});

test('clears a divide-by-zero resolved by an operator with AC', () => {
  const cleared = press(runToOperatorResolvedError(), 'AC');
  expectDisplay(cleared, '', '0', 'after AC');
  expectDisplay(press(cleared, '4 + 4 ='), '4+4', '8', 'after "4 + 4 =" following AC');
});

test('clears a divide-by-zero resolved by an operator with DEL', () => {
  const cleared = press(runToOperatorResolvedError(), 'DEL');
  expectDisplay(cleared, '', '0', 'after DEL');
  expectDisplay(press(cleared, '7'), '', '7', 'after the digit 7 following DEL');
});

test('ignores equals after an operator resolved a divide-by-zero', () => {
  // The only observable of "no pending operator": a leftover one would make = recompute against Error.
  const errored = runToOperatorResolvedError();
  const equalled = press(errored, '=');
  expectDisplay(equalled, `5${DIVIDE}0`, 'Error', 'after the first =');
  expectDisplay(press(equalled, '='), `5${DIVIDE}0`, 'Error', 'after a second =');
});

// --- AC-5 guards: chaining that must keep working (pass before and after the fix) --------------

test('keeps chaining when an operator resolves a non-division with a zero operand', () => {
  const addition = run('5 + 0 +');
  expectDisplay(addition, '', '5+0+', 'after "5 + 0 +"');
  expectDisplay(press(addition, '1 ='), '5+0+1', '6', 'after "5 + 0 + 1 ="');

  const multiplication = run('5 * 0 +');
  expectDisplay(multiplication, '', `5${TIMES}0+`, 'after "5 * 0 +"');
  expectDisplay(press(multiplication, '1 ='), `5${TIMES}0+1`, '1', 'after "5 * 0 + 1 ="');
});

test('keeps chaining when an operator resolves a division by a non-zero number', () => {
  const zeroDividend = run('0 / 5 +');
  expectDisplay(zeroDividend, '', `0${DIVIDE}5+`, 'after "0 / 5 +"');
  expectDisplay(press(zeroDividend, '3 ='), `0${DIVIDE}5+3`, '3', 'after "0 / 5 + 3 ="');

  const smallDivisor = run('5 / 0 . 5 +');
  expectDisplay(smallDivisor, '', `5${DIVIDE}0.5+`, 'after "5 / 0 . 5 +"');
  expectDisplay(press(smallDivisor, '1 ='), `5${DIVIDE}0.5+1`, '11', 'after "5 / 0 . 5 + 1 ="');
});
