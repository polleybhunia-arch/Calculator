// Calculator state
let currentInput = '0';        // value of the operand currently being typed
let previousInput = null;      // operand stored before an operator was chosen
let operator = null;           // pending operator: '+', '-', '*', '/'
let resetOnNextInput = false;  // true right after choosing an operator (next digit starts a new number)
let history = [];              // committed tokens (typed numbers + operator symbols) for the expression trail
let justCalculated = false;    // true right after "=" until a new number/operator is entered
let lastExpression = '';       // the full expression shown on the small line after "="

const operatorSymbols = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

const expressionDisplay = document.getElementById('display-expression');
const currentDisplay = document.getElementById('display-current');
const buttons = document.querySelector('.buttons');

updateDisplay();

buttons.addEventListener('click', (event) => {
  const button = event.target;

  if (button.dataset.number !== undefined) {
    appendNumber(button.dataset.number);
  } else if (button.dataset.operator !== undefined) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action === 'clear') {
    clearAll();
  } else if (button.dataset.action === 'delete') {
    deleteLastDigit();
  } else if (button.dataset.action === 'equals') {
    equals();
  }

  updateDisplay();
});

function appendNumber(number) {
  // A fresh number after a result or an error starts a brand new calculation
  if (currentInput === 'Error' || justCalculated) {
    clearAll();
  }

  // Start a fresh number after an operator
  if (resetOnNextInput) {
    currentInput = '0';
    resetOnNextInput = false;
  }

  // Avoid multiple decimal points in one number
  if (number === '.' && currentInput.includes('.')) {
    return;
  }

  // Replace a lone leading zero, except when typing "0."
  if (currentInput === '0' && number !== '.') {
    currentInput = number;
  } else {
    currentInput += number;
  }
}

function chooseOperator(nextOperator) {
  if (currentInput === 'Error') {
    clearAll();
  }

  if (justCalculated) {
    // Continue the next calculation from the previous result
    history = [currentInput];
    justCalculated = false;
  } else if (resetOnNextInput) {
    // Pressed an operator again without typing a number: swap it instead of appending
    history[history.length - 1] = operatorSymbols[nextOperator];
    operator = nextOperator;
    return;
  } else {
    history.push(currentInput);
  }

  // Chain calculations: resolve the pending operation before starting the next one
  if (operator !== null) {
    computeResult();
  }

  history.push(operatorSymbols[nextOperator]);
  previousInput = currentInput;
  operator = nextOperator;
  resetOnNextInput = true;
}

// Resolves previousInput <operator> currentInput into currentInput. Used both
// for mid-expression chaining and as the final step of equals().
function computeResult() {
  if (operator === null || previousInput === null) {
    return;
  }

  const a = parseFloat(previousInput);
  const b = parseFloat(currentInput);
  let result;

  switch (operator) {
    case '+':
      result = a + b;
      break;
    case '-':
      result = a - b;
      break;
    case '*':
      result = a * b;
      break;
    case '/':
      if (b === 0) {
        currentInput = 'Error';
        previousInput = null;
        operator = null;
        resetOnNextInput = true;
        return;
      }
      result = a / b;
      break;
    default:
      return;
  }

  // Trim floating-point noise (e.g. 0.1 + 0.2)
  currentInput = String(Math.round(result * 1e10) / 1e10);
  previousInput = null;
  operator = null;
  resetOnNextInput = true;
}

function equals() {
  if (operator === null || previousInput === null) {
    return;
  }

  // Capture the full typed expression before computeResult() overwrites currentInput
  const fullExpression = history.join('') + currentInput;

  computeResult();

  lastExpression = fullExpression;
  history = [];
  justCalculated = true;
}

function deleteLastDigit() {
  if (resetOnNextInput || currentInput === 'Error') {
    clearAll();
    return;
  }

  currentInput = currentInput.slice(0, -1);
  if (currentInput === '' || currentInput === '-') {
    currentInput = '0';
  }
}

function clearAll() {
  currentInput = '0';
  previousInput = null;
  operator = null;
  resetOnNextInput = false;
  history = [];
  justCalculated = false;
  lastExpression = '';
}

function updateDisplay() {
  if (justCalculated) {
    // Two-line result view: expression trail on top, bold answer below
    expressionDisplay.textContent = lastExpression;
    currentDisplay.textContent = currentInput;
  } else {
    // Live view: growing expression trail on the main line while typing
    expressionDisplay.textContent = '';
    const liveExpression = history.join('') + (resetOnNextInput ? '' : currentInput);
    currentDisplay.textContent = liveExpression === '' ? '0' : liveExpression;
  }
}
