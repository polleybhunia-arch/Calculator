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
      return finishCalculation(resolved, committed.history.join(''));
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

  // Shows the two-line result view for a resolved calculation. Shared by '=' and by an operator
  // press that hits a divide-by-zero, so the two paths cannot drift apart.
  function finishCalculation(resolved, expression) {
    return { ...resolved, lastExpression: expression, history: [], justCalculated: true };
  }

  function equals(state) {
    if (state.operator === null || state.previousInput === null) {
      return state;
    }

    // Capture the full typed expression before computeResult() overwrites currentInput
    const fullExpression = state.history.join('') + state.currentInput;

    return finishCalculation(computeResult(state), fullExpression);
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

  // The input vocabulary, exported once (D-005 clause 5; recorded in the D-003 API addendum):
  // KEY-001's key map is the third consumer of the digit/operator/action sets, so it reads them
  // from here instead of hand-maintaining a third copy. Reuses the exact same tables applyInput
  // already validates against, so the two can never drift apart. A malformed descriptor (missing
  // type, unknown value, or an inherited-property name such as "constructor"/"__proto__") is
  // rejected, never accepted -- this is a check, so it returns false rather than throwing.
  function isInput(input) {
    if (input === null || typeof input !== 'object') {
      return false;
    }
    switch (input.type) {
      case 'number':
        return isNumberValue(input.value);
      case 'operator':
        return OPERATORS.has(input.value);
      case 'action':
        return ACTIONS.has(input.value);
      default:
        return false;
    }
  }

  // Keyboard channel key map (D-005 clauses 1 and 4): a pure allowlist from a physical key to the
  // same input descriptor a click already produces. event.key is layout- and numpad-normalized
  // (KEY-001 Context), so no separate numpad branch is needed -- a numpad digit reports the
  // identical digit string as its top-row counterpart. The digit/'.' and operator entries are
  // derived from NUMBER_CHARACTERS and OPERATORS (the same single sources applyInput and isInput
  // already use), so the keyboard map can never list a value the rest of the core disagrees with.
  const KEY_MAP = new Map([
    ...[...NUMBER_CHARACTERS].map((char) => [char, { type: 'number', value: char }]),
    [',', { type: 'number', value: '.' }], // an alternate decimal point
    ...[...OPERATORS.keys()].map((op) => [op, { type: 'operator', value: op }]),
    ['x', { type: 'operator', value: '*' }],
    ['X', { type: 'operator', value: '*' }],
    ['Enter', { type: 'action', value: 'equals' }],
    ['=', { type: 'action', value: 'equals' }],
    ['Backspace', { type: 'action', value: 'delete' }],
    ['Escape', { type: 'action', value: 'clear' }],
    ['Delete', { type: 'action', value: 'clear' }],
  ]);

  // key: the KeyboardEvent.key string. modifiers: { ctrlKey, metaKey, altKey }, all optional and
  // default false. Ctrl/Meta/Alt make even a mapped key inert (AC-5); Shift is deliberately not
  // checked here -- it never blocks (the browser itself turns a physical Shift+8 into key '*').
  // Returns a fresh copy of the descriptor so a caller can never mutate the shared map entry.
  function mapKey(key, modifiers) {
    const { ctrlKey = false, metaKey = false, altKey = false } = modifiers || {};
    if (ctrlKey || metaKey || altKey) {
      return null;
    }
    const mapped = KEY_MAP.get(key);
    return mapped === undefined ? null : { ...mapped };
  }

  // Auto-repeat policy (D-005 clause 6, OQ-4): channel-agnostic, so it is pure and core-side
  // rather than a DOM-layer `if`. Digits, the decimal point and delete keep acting on every
  // repeat; equals and every operator act once per press and ignore the repeats.
  function allowsRepeat(input) {
    if (input.type === 'number') {
      return true;
    }
    return input.type === 'action' && input.value === 'delete';
  }

  const CalculatorCore = { createState, applyInput, render, mapKey, allowsRepeat, isInput };

  // Dual export (D-001, D-003): CommonJS under Node, a global under a plain <script> tag.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorCore;
  } else {
    globalThis.CalculatorCore = CalculatorCore;
  }
})();
