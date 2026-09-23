// DOM layer only: reads the page, turns button clicks into core inputs, writes the display with
// textContent. All calculator behavior lives in calculator-core.js, loaded before this file.
(function () {
  'use strict';

  const { createState, applyInput, render, mapKey, allowsRepeat, isInput } = globalThis.CalculatorCore;

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
  // recognized button (a gap between buttons, or a value outside the allowed sets). Attribute
  // precedence (number, then operator, then action) is unchanged; validity now comes from the
  // core's single exported vocabulary check (D-005 clause 5) instead of a hand-duplicated table.
  function inputFromElement(element) {
    const { number, operator, action } = element.dataset;

    if (number !== undefined) {
      const input = { type: 'number', value: number };
      return isInput(input) ? input : null;
    }
    if (operator !== undefined) {
      const input = { type: 'operator', value: operator };
      return isInput(input) ? input : null;
    }
    if (action !== undefined) {
      const input = { type: 'action', value: action };
      return isInput(input) ? input : null;
    }
    return null;
  }

  // True when `element` is one of the calculator's own buttons (has a recognized data-* input
  // attribute), whether or not its value is valid. Used to let a Tab-focused button keep native
  // Enter/Space activation instead of also being handled by the keydown listener below (AC-6).
  function isCalculatorButton(element) {
    if (!element || !element.dataset) {
      return false;
    }
    const { number, operator, action } = element.dataset;
    return number !== undefined || operator !== undefined || action !== undefined;
  }

  // The subset of a KeyboardEvent mapKey needs: only Ctrl/Meta/Alt make even a mapped key inert
  // (AC-5); Shift is never passed because it never blocks.
  function modifiersOf(event) {
    return { ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey };
  }

  updateDisplay();

  buttons.addEventListener('click', (event) => {
    const input = inputFromElement(event.target);

    if (input !== null) {
      dispatch(input);
    }

    // A clicked button keeps browser focus by default; blurring it here means a following Enter
    // or Space is read as a normal key press, not a native repeat of this same button (AC-6).
    // Only a real pointer click should blur: a mouse click reports event.detail >= 1, while the
    // click the browser synthesizes for a Tab-focused button's native Enter/Space activation (and
    // a programmatic .click()) reports event.detail === 0 (D-011 Option A). Blurring that click
    // too would drop a keyboard-only user's Tab position after every single press.
    if (event.detail > 0) {
      event.target.blur();
    }
  });

  // The keyboard channel (D-005 clause 3): converts a keydown into the same input descriptor a
  // click already produces and calls the same dispatch(input) -- never a second display-write
  // path, never a synthesized button.click().
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && isCalculatorButton(event.target)) {
      // A button reached by Tab keeps its native Enter/Space activation (a click through the
      // handler above); handling it here too would fire two actions from one keypress (AC-6).
      // A held key auto-repeats this same keydown, and the browser would natively re-activate the
      // button on every repeat -- unconditionally, regardless of what input the button represents
      // (a digit button is deliberately repeatable through the document-level channel below, but
      // that is a different channel from a focused button's native activation, D-012 rejected,
      // r2 F-1). preventDefault() suppresses that repeat activation so the button still acts
      // exactly once per physical press.
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      return;
    }

    const input = mapKey(event.key, modifiersOf(event));

    if (input === null) {
      return;
    }

    event.preventDefault();

    if (event.repeat && !allowsRepeat(input)) {
      return;
    }

    dispatch(input);
  });
})();
