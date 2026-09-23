'use strict';
// Shared unit-test helpers for suites that drive calculator-core.js with space-separated token
// sequences. Carried-forward item 7 (.agent/reviews/CALC-001-r1.md F-3): toInput/press/
// expectDisplay existed twice already (tests/unit/calculator-core.test.js,
// tests/unit/divide-by-zero.test.js). KEY-001's suite would be a third hand-copy, so this file
// factors them out instead; the two existing files are left byte-for-byte unmodified (CLAUDE.md
// section 14 test-change discipline) -- only new suites (tests/unit/key-map.test.js) use this.

const assert = require('node:assert/strict');
const { createState, applyInput, render } = require('../../calculator-core.js');

const OPERATOR_TOKENS = new Set(['+', '-', '*', '/']);
const ACTION_TOKENS = { '=': 'equals', AC: 'clear', DEL: 'delete' };

// Converts one matrix token (a digit or '.', an operator symbol, '=', 'AC' or 'DEL') into a core
// input descriptor. Mirrors the two existing per-file copies exactly.
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

// Applies a space-separated token sequence to `state`, left to right, returning the final state.
function press(state, tokens) {
  return tokens
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((current, token) => applyInput(current, toInput(token)), state);
}

// Whole-pair equality: a stray character on either display line fails. Delegates to
// assert.deepEqual so a wrong pair throws a real AssertionError with both pairs in the message,
// the same guarantee the two existing per-file copies give CALC-001's AC-4 precondition rows.
function expectDisplay(state, expression, current, note) {
  const actual = render(state);
  const label = note ? `${note}: ` : '';
  assert.deepEqual(actual, { expression, current }, `${label}core rendered ${JSON.stringify(actual)}`);
}

module.exports = { toInput, press, expectDisplay, createState };
