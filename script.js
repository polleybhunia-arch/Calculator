// DOM layer only: reads the page, turns button clicks into core inputs, writes the display with
// textContent. All calculator behavior lives in calculator-core.js, loaded before this file.
(function () {
  'use strict';

  const { createState, applyInput, render } = globalThis.CalculatorCore;

  // Button values are user-controllable markup, so they are checked here, at the boundary,
  // before the core sees them.
  const NUMBER_CHARACTERS = '0123456789.';
  const OPERATOR_VALUES = ['+', '-', '*', '/'];
  const ACTION_VALUES = ['clear', 'delete', 'equals'];

  const expressionDisplay = document.getElementById('display-expression');
  const currentDisplay = document.getElementById('display-current');
  const buttons = document.querySelector('.buttons');

  let state = createState();

  function updateDisplay() {
    const { expression, current } = render(state);
    expressionDisplay.textContent = expression;
    currentDisplay.textContent = current;
  }

  // The single entry point: every input, whatever its source, goes through here.
  function dispatch(input) {
    state = applyInput(state, input);
    updateDisplay();
  }

  // Returns the core input for a clicked element, or null when the click is not on a
  // recognized button (a gap between buttons, or a value outside the allowed sets).
  function inputFromElement(element) {
    const { number, operator, action } = element.dataset;

    if (number !== undefined) {
      return number.length === 1 && NUMBER_CHARACTERS.includes(number) ? { type: 'number', value: number } : null;
    }
    if (operator !== undefined) {
      return OPERATOR_VALUES.includes(operator) ? { type: 'operator', value: operator } : null;
    }
    if (action !== undefined) {
      return ACTION_VALUES.includes(action) ? { type: 'action', value: action } : null;
    }
    return null;
  }

  updateDisplay();

  buttons.addEventListener('click', (event) => {
    const input = inputFromElement(event.target);

    if (input !== null) {
      dispatch(input);
    }
  });
})();
