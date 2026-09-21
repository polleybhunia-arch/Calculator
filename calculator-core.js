// Pure calculator core: the state machine and the display strings. It never touches the DOM, so
// the same file loads as a classic script in the browser (file:// safe, no modules) and in Node
// tests. The IIFE keeps its names out of the global scope shared with script.js.
(function () {
  'use strict';

  const ERROR_TEXT = 'Error';
  const NUMBER_CHARACTERS = '0123456789.';
  // Results keep ten decimals; this trims floating-point noise such as 0.1 + 0.2.
  const ROUNDING_FACTOR = 1e10;

  // One entry per operator input value. The display symbols are minus U+2212, times U+00D7 and
  // divide U+00F7; a negative number's sign stays the ASCII hyphen-minus.
  const OPERATORS = new Map([
    ['+', { symbol: '+', apply: (a, b) => a + b }],
    ['-', { symbol: '−', apply: (a, b) => a - b }],
    ['*', { symbol: '×', apply: (a, b) => a * b }],
    ['/', { symbol: '÷', apply: (a, b) => a / b }],
  ]);

  // States are never mutated: every transition returns a new object and copies, never edits,
  // the history array it shares with the previous state.
  function createState() {
    return {
      currentInput: '0',         // operand being typed, or the last result
      previousInput: null,       // operand stored before an operator was chosen
      operator: null,            // pending operator: '+', '-', '*', '/'
      resetOnNextInput: false,   // true right after an operator: the next digit starts a new number
      history: [],               // committed tokens (typed numbers and operator symbols) for the trail
      justCalculated: false,     // true right after '=' until a new number or operator is entered
      lastExpression: '',        // the full expression shown on the small line after '='
    };
  }

  function appendNumber(state, number) {
    // A fresh number after a result or an error starts a brand new calculation
    const base = state.currentInput === ERROR_TEXT || state.justCalculated ? createState() : state;

    // Start a fresh number after an operator
    const currentInput = base.resetOnNextInput ? '0' : base.currentInput;
    const next = { ...base, currentInput, resetOnNextInput: false };

    // Avoid multiple decimal points in one number
    if (number === '.' && currentInput.includes('.')) {
      return next;
    }

    // Replace a lone leading zero, except when typing "0."
    next.currentInput = currentInput === '0' && number !== '.' ? number : currentInput + number;
    return next;
  }

  function chooseOperator(state, nextOperator) {
    const base = state.currentInput === ERROR_TEXT ? createState() : state;
    const { symbol } = OPERATORS.get(nextOperator);

    if (base.resetOnNextInput && !base.justCalculated) {
      // Pressed an operator again without typing a number: swap it instead of appending
      return { ...base, history: [...base.history.slice(0, -1), symbol], operator: nextOperator };
    }

    // Right after '=' the next calculation continues from the result; otherwise the number just
    // typed joins the trail.
    const committed = base.justCalculated
      ? { ...base, history: [base.currentInput], justCalculated: false }
      : { ...base, history: [...base.history, base.currentInput] };

    // Chain calculations: resolve the pending operation (if any) before starting the next one
    const resolved = computeResult(committed);

    if (resolved.currentInput === ERROR_TEXT) {
      // A divide-by-zero ends the calculation exactly as '=' does, and the pressed operator is discarded
      return { ...resolved, lastExpression: committed.history.join(''), history: [], justCalculated: true };
    }

    return {
      ...resolved,
      history: [...resolved.history, symbol],
      previousInput: resolved.currentInput,
      operator: nextOperator,
      resetOnNextInput: true,
    };
  }

  // Resolves previousInput <operator> currentInput into currentInput. Used both for
  // mid-expression chaining and as the final step of equals().
  function computeResult(state) {
    if (state.operator === null || state.previousInput === null) {
      return state;
    }

    const a = parseFloat(state.previousInput);
    const b = parseFloat(state.currentInput);
    const settled = { ...state, previousInput: null, operator: null, resetOnNextInput: true };

    if (state.operator === '/' && b === 0) {
      return { ...settled, currentInput: ERROR_TEXT };
    }

    const result = OPERATORS.get(state.operator).apply(a, b);
    return { ...settled, currentInput: String(Math.round(result * ROUNDING_FACTOR) / ROUNDING_FACTOR) };
  }

  function equals(state) {
    if (state.operator === null || state.previousInput === null) {
      return state;
    }

    // Capture the full typed expression before computeResult() overwrites currentInput
    const fullExpression = state.history.join('') + state.currentInput;

    return { ...computeResult(state), lastExpression: fullExpression, history: [], justCalculated: true };
  }

  function deleteLastDigit(state) {
    if (state.resetOnNextInput || state.currentInput === ERROR_TEXT) {
      return createState();
    }

    const remaining = state.currentInput.slice(0, -1);
    return { ...state, currentInput: remaining === '' ? '0' : remaining };
  }

  const ACTIONS = new Map([
    ['clear', createState],
    ['delete', deleteLastDigit],
    ['equals', equals],
  ]);

  function isNumberValue(value) {
    return typeof value === 'string' && value.length === 1 && NUMBER_CHARACTERS.includes(value);
  }

  // Input descriptor: { type: 'number' | 'operator' | 'action', value }. The DOM layer is the
  // boundary that filters user-derived data; a malformed descriptor here is a programming error.
  function applyInput(state, input) {
    if (input === null || typeof input !== 'object') {
      throw new TypeError('applyInput: input must be an object with a type and a value');
    }

    switch (input.type) {
      case 'number':
        if (!isNumberValue(input.value)) {
          throw new TypeError('applyInput: a number input needs one digit or a decimal point');
        }
        return appendNumber(state, input.value);
      case 'operator':
        if (!OPERATORS.has(input.value)) {
          throw new TypeError('applyInput: an operator input needs one of + - * /');
        }
        return chooseOperator(state, input.value);
      case 'action': {
        const action = ACTIONS.get(input.value);
        if (action === undefined) {
          throw new TypeError('applyInput: an action input needs clear, delete or equals');
        }
        return action(state);
      }
      default:
        throw new TypeError('applyInput: input type must be number, operator or action');
    }
  }

  function render(state) {
    if (state.justCalculated) {
      // Two-line result view: expression trail on top, bold answer below
      return { expression: state.lastExpression, current: state.currentInput };
    }

    // Live view: growing expression trail on the main line while typing
    const liveExpression = state.history.join('') + (state.resetOnNextInput ? '' : state.currentInput);
    return { expression: '', current: liveExpression === '' ? '0' : liveExpression };
  }

  const CalculatorCore = { createState, applyInput, render };

  // Dual export (D-001, D-003): CommonJS under Node, a global under a plain <script> tag.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorCore;
  } else {
    globalThis.CalculatorCore = CalculatorCore;
  }
})();
