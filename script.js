// Calculator state
let currentInput = '0';   // value currently shown on the display
let previousInput = null; // operand stored before an operator was chosen
let operator = null;      // pending operator: '+', '-', '*', '/'
let resetOnNextInput = false; // true right after "=" or after choosing an operator

const display = document.getElementById('display');
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
    calculate();
  }

  updateDisplay();
});

function appendNumber(number) {
  // Start a fresh number after an operator or an "=" result
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
  // Recover from an Error state instead of letting it flow into the next calculation
  if (currentInput === 'Error') {
    clearAll();
  }

  // Chain calculations: resolve the pending operation before starting the next one
  if (operator !== null && !resetOnNextInput) {
    calculate();
  }

  previousInput = currentInput;
  operator = nextOperator;
  resetOnNextInput = true;
}

function calculate() {
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
}

function updateDisplay() {
  display.textContent = currentInput;
}
