'use strict';
// Unit layer for KEY-001 (AC-1..AC-5, AC-7): the pure key map, the auto-repeat policy, and the
// core's single exported input vocabulary (D-005 clause 5). No DOM: calculator-core.js must keep
// loading and running in a Node process where document/window are undefined (D-005 clause 1).
// Expectations are read directly off the resolved OQ-1 key map in .agent/units/KEY-001.md and the
// { type, value } descriptor shape recorded in .agent/decisions/D-003-core-api.md; the mapKey /
// allowsRepeat / isInput names are recorded in the API addendum this unit adds to D-003.

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapKey, allowsRepeat, isInput } = require('../../calculator-core.js');
const { createState, press, expectDisplay, toInput } = require('../helpers/core-input.js');

// --- AC-1 ----------------------------------------------------------------------------------

test('maps each digit key zero through nine to a number input with the same digit', () => {
  for (let digit = 0; digit <= 9; digit += 1) {
    const key = String(digit);
    assert.deepEqual(mapKey(key), { type: 'number', value: key }, `digit key ${key}`);
  }
});

test('maps Enter and the equals key to the equals action', () => {
  assert.deepEqual(mapKey('Enter'), { type: 'action', value: 'equals' }, 'Enter');
  assert.deepEqual(mapKey('='), { type: 'action', value: 'equals' }, 'the equals key');
});

test('exports a single input vocabulary check accepting exactly the documented digit operator and action values', () => {
  const numberValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
  const operatorValues = ['+', '-', '*', '/'];
  const actionValues = ['clear', 'delete', 'equals'];

  for (const value of numberValues) {
    assert.equal(isInput({ type: 'number', value }), true, `number value ${JSON.stringify(value)} must be accepted`);
  }
  for (const value of operatorValues) {
    assert.equal(isInput({ type: 'operator', value }), true, `operator value ${JSON.stringify(value)} must be accepted`);
  }
  for (const value of actionValues) {
    assert.equal(isInput({ type: 'action', value }), true, `action value ${JSON.stringify(value)} must be accepted`);
  }

  // Four known-bad values, each tried against the type an attacker would most plausibly aim at.
  assert.equal(isInput({ type: 'number', value: 'a' }), false, 'a bad number value must be rejected');
  assert.equal(isInput({ type: 'operator', value: '^' }), false, 'a bad operator value must be rejected');
  assert.equal(isInput({ type: 'action', value: 'constructor' }), false, 'constructor must be rejected as an action value');
  assert.equal(isInput({ type: 'action', value: '__proto__' }), false, '__proto__ must be rejected as an action value');
});

test('every descriptor the key map returns for a mapped key is accepted by the core own exported vocabulary check', () => {
  const mappedKeys = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',',
    '+', '-', '*', '/', 'x', 'X',
    'Enter', '=', 'Backspace', 'Escape', 'Delete',
  ];

  for (const key of mappedKeys) {
    const input = mapKey(key);
    assert.notEqual(input, null, `key ${JSON.stringify(key)} must be mapped for this check to be meaningful`);
    assert.equal(isInput(input), true, `the descriptor for key ${JSON.stringify(key)} must be accepted by isInput`);
  }
});

test('the shared press helper applies a token sequence to a fresh state left to right', () => {
  const state = press(createState(), '4 + 8 + 9 =');
  expectDisplay(state, '4+8+9', '21', 'after 4 + 8 + 9 =');
});

test('the shared expectDisplay helper fails when either line of the rendered pair differs from expected', () => {
  const state = press(createState(), '4 + 8 =');
  expectDisplay(state, '4+8', '12', 'precondition: the real rendered pair');
  assert.throws(
    () => expectDisplay(state, '4+8', '99', 'deliberately wrong current line'),
    assert.AssertionError,
    'expectDisplay must throw when the current line is wrong',
  );
});

// --- AC-2 ----------------------------------------------------------------------------------

test('maps the decimal point key and the comma key to a number input of a single decimal point', () => {
  assert.deepEqual(mapKey('.'), { type: 'number', value: '.' }, 'the decimal point key');
  assert.deepEqual(mapKey(','), { type: 'number', value: '.' }, 'the comma key as an alternate decimal point');
});

// --- AC-3 ----------------------------------------------------------------------------------

test('maps each operator key including the letter x and its capital to the matching operator input', () => {
  assert.deepEqual(mapKey('+'), { type: 'operator', value: '+' }, '+');
  assert.deepEqual(mapKey('-'), { type: 'operator', value: '-' }, '-');
  assert.deepEqual(mapKey('*'), { type: 'operator', value: '*' }, '*');
  assert.deepEqual(mapKey('/'), { type: 'operator', value: '/' }, '/');
  assert.deepEqual(mapKey('x'), { type: 'operator', value: '*' }, 'x');
  // A real Shift+x reports key 'X'; shiftKey must still not block the mapping (AC-5 edge case).
  assert.deepEqual(mapKey('X', { shiftKey: true }), { type: 'operator', value: '*' }, 'X (Shift+x arrives as key X)');
});

// --- AC-4 ----------------------------------------------------------------------------------

test('maps Backspace to the delete action', () => {
  assert.deepEqual(mapKey('Backspace'), { type: 'action', value: 'delete' });
});

test('maps Escape and Delete to the clear action', () => {
  assert.deepEqual(mapKey('Escape'), { type: 'action', value: 'clear' }, 'Escape');
  assert.deepEqual(mapKey('Delete'), { type: 'action', value: 'clear' }, 'Delete');
});

// --- AC-5 ----------------------------------------------------------------------------------

test('returns null for every unmapped key named in the acceptance criteria', () => {
  // ' ' is the real KeyboardEvent.key value for the space bar (AC-5 names it "Space" in prose;
  // tests/integration/keyboard.test.js dispatches the same real value for the same reason).
  const unmapped = ['a', 'F5', 'Tab', 'ArrowLeft', ' ', 'Shift', '`', ':', 'c', 'C'];
  for (const key of unmapped) {
    assert.equal(mapKey(key), null, `key ${JSON.stringify(key)} must be unmapped`);
  }
});

test('returns null for a mapped key held with Ctrl Meta or Alt even though the key alone is mapped', () => {
  assert.equal(mapKey('4', { ctrlKey: true }), null, 'Ctrl+4');
  assert.equal(mapKey('/', { metaKey: true }), null, 'Cmd+/');
  assert.equal(mapKey('Enter', { altKey: true }), null, 'Alt+Enter');
});

test('Shift alone does not block a mapped key', () => {
  assert.deepEqual(mapKey('=', { shiftKey: true }), { type: 'action', value: 'equals' }, 'Shift+=');
  assert.deepEqual(mapKey('*', { shiftKey: true }), { type: 'operator', value: '*' }, 'Shift+8 arriving as key *');
});

test('returns null for an unknown empty or undefined key without throwing', () => {
  assert.doesNotThrow(() => mapKey('Unidentified'), 'Unidentified must not throw');
  assert.doesNotThrow(() => mapKey(''), 'an empty key must not throw');
  assert.doesNotThrow(() => mapKey(undefined), 'an undefined key must not throw');
  assert.equal(mapKey('Unidentified'), null, 'Unidentified');
  assert.equal(mapKey(''), null, 'empty string');
  assert.equal(mapKey(undefined), null, 'undefined');
});

// --- AC-7 ----------------------------------------------------------------------------------

test('the core auto repeat policy allows repetition for number and delete inputs', () => {
  assert.equal(allowsRepeat(toInput('5')), true, 'a digit');
  assert.equal(allowsRepeat(toInput('.')), true, 'the decimal point');
  assert.equal(allowsRepeat(toInput('DEL')), true, 'the delete action');
});

test('the core auto repeat policy blocks repetition for equals and every operator input', () => {
  assert.equal(allowsRepeat(toInput('=')), false, 'equals');
  assert.equal(allowsRepeat(toInput('+')), false, '+');
  assert.equal(allowsRepeat(toInput('-')), false, '-');
  assert.equal(allowsRepeat(toInput('*')), false, '*');
  assert.equal(allowsRepeat(toInput('/')), false, '/');
});
