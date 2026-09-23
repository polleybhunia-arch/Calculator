'use strict';
// Integration: real index.html + real page scripts (through tests/helpers/dom-stub.js) driven
// by button clicks. Boundary under test: HTML markup <-> script wiring <-> rendered display.
// The stub is the only fake; it cannot model CSS, layout, focus or real file:// loading (UNVERIFIED).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadPage, readIndexHtml, REPO_ROOT } = require('../helpers/dom-stub.js');

// Exact code points (the operator minus U+2212 differs from the ASCII hyphen-minus sign).
const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

test('shows an empty expression line and 0 when the page loads', () => {
  const page = loadPage();

  assert.ok(page.executedScripts.length > 0, 'boundary: index.html must run at least one script');
  assert.deepEqual(page.executedScripts, page.scripts.map((s) => s.src), 'boundary: every listed script ran');
  assert.deepEqual(page.read(), display('', '0'), 'boundary: initial display after load');
});

test('runs every script tag of index.html in document order without module syntax', () => {
  const { scripts } = readIndexHtml();

  assert.ok(scripts.length > 0, 'boundary: index.html lists no script tags');
  for (const script of scripts) {
    assert.notEqual(script.src, null, 'boundary: every script tag must have a src (no inline script)');
    assert.notEqual(script.type, 'module', `boundary: ${script.src} must not be type="module" (file:// promise)`);
    assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(script.src) && !script.src.startsWith('/'),
      `boundary: ${script.src} must be a relative path without scheme or leading slash`);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, script.src)), `boundary: ${script.src} must exist in the repo`);
  }

  const page = loadPage();
  assert.deepEqual(page.executedScripts, scripts.map((s) => s.src), 'boundary: scripts ran in document order');
  assert.deepEqual(page.press('7'), display('', '7'), 'boundary: click 7 after loading all scripts');
});

test('loads calculator-core.js before script.js in index.html', () => {
  const sources = readIndexHtml().scripts.map((s) => s.src);
  const core = sources.indexOf('calculator-core.js');
  const page = sources.indexOf('script.js');

  assert.notEqual(core, -1, `boundary: index.html must list calculator-core.js (found ${JSON.stringify(sources)})`);
  assert.notEqual(page, -1, `boundary: index.html must list script.js (found ${JSON.stringify(sources)})`);
  assert.ok(core < page, `boundary: calculator-core.js must load before script.js (order was ${JSON.stringify(sources)})`);
});

test('wires every digit button 0 to 9 to the main line', () => {
  const page = loadPage();
  const digits = '1234567890';

  for (let i = 0; i < digits.length; i += 1) {
    assert.deepEqual(page.press(digits[i]), display('', digits.slice(0, i + 1)), `boundary: digit button ${digits[i]}`);
  }
});

test('ignores a second decimal point typed through the buttons', () => {
  assert.deepEqual(loadPage().press('1 . 2 . 3'), display('', '1.23'), 'boundary: second . is ignored');
});

test('shows the display symbol for each operator button', () => {
  const cases = [['9 +', '9+'], ['9 -', `9${MINUS}`], ['9 *', `9${TIMES}`], ['9 /', `9${DIVIDE}`]];

  for (const [sequence, current] of cases) {
    assert.deepEqual(loadPage().press(sequence), display('', current), `boundary: operator button in "${sequence}"`);
  }
});

test('AC clears an unfinished chain, a result and an Error', () => {
  const sequences = ['4 + 8 + 9 AC', '4 + 8 + 9 = AC', '5 / 0 = AC'];

  for (const sequence of sequences) {
    assert.deepEqual(loadPage().press(sequence), display('', '0'), `boundary: AC button after "${sequence.replace(' AC', '')}"`);
  }
});

test('DEL removes the last typed digit', () => {
  assert.deepEqual(loadPage().press('1 2 3 DEL'), display('', '12'), 'boundary: DEL button');
});

test('DEL right after an operator clears the whole calculation on the page', () => {
  const page = loadPage();

  assert.deepEqual(page.press('4 + DEL'), display('', '0'), 'boundary: DEL after operator');
  assert.deepEqual(page.press('5 ='), display('', '5'), 'boundary: no operator or 4 survived the DEL');
});

test('DEL on Error clears it on the page', () => {
  const page = loadPage();

  assert.deepEqual(page.press('5 / 0 = DEL'), display('', '0'), 'boundary: DEL on Error');
  assert.deepEqual(page.press('7'), display('', '7'), 'boundary: typing after clearing Error');
});

test('a second operator press replaces the first on the page', () => {
  const page = loadPage();

  assert.deepEqual(page.press('4 + *'), display('', `4${TIMES}`), 'boundary: second operator replaces the first');
  assert.deepEqual(page.press('2 ='), display(`4${TIMES}2`, '8'), 'boundary: the replacing operator is used');
});

test('equals with no pending operator changes nothing on the page', () => {
  assert.deepEqual(loadPage().press('='), display('', '0'), 'boundary: = on a fresh page');
  assert.deepEqual(loadPage().press('5 ='), display('', '5'), 'boundary: = after a lone number');
});

test('equals right after an operator uses the held value as the second operand on the page', () => {
  assert.deepEqual(loadPage().press('5 + ='), display('5+5', '10'), 'boundary: = right after + (baseline behavior, OQ-B2)');
});

test('a digit after a result starts a new calculation on the page', () => {
  assert.deepEqual(loadPage().press('4 + 8 + 9 = 3'), display('', '3'), 'boundary: digit after =');
});

test('an operator after Error clears first and starts from 0 on the page', () => {
  assert.deepEqual(loadPage().press('5 / 0 = +'), display('', '0+'), 'boundary: operator after Error');
});

test('leading zeros are replaced and a zero before a point is kept on the page', () => {
  assert.deepEqual(loadPage().press('0 0 5'), display('', '5'), 'boundary: 0 0 5');
  assert.deepEqual(loadPage().press('0 . 0 5'), display('', '0.05'), 'boundary: 0 . 0 5');
});

test('a decimal point after an operator starts 0. in the next operand on the page', () => {
  const page = loadPage();

  assert.deepEqual(page.press('1 / 4 + .'), display('', `1${DIVIDE}4+0.`), 'boundary: . after an operator');
  assert.deepEqual(page.press('5 ='), display(`1${DIVIDE}4+0.5`, '0.75'), 'boundary: evaluating the 0.5 operand');
});

test('clicking the button container outside any button changes nothing', () => {
  const page = loadPage();
  const container = page.document.querySelector('.buttons');

  assert.ok(container, 'boundary: index.html must contain a .buttons container');
  assert.deepEqual(page.press('4 + 8'), display('', '4+8'), 'boundary: setup 4 + 8');
  assert.doesNotThrow(() => page.click(container), 'boundary: click on the container gap must not throw');
  assert.deepEqual(page.read(), display('', '4+8'), 'boundary: a non-button target is ignored');
});

test('updates the display through textContent without writing markup', () => {
  const page = loadPage();

  assert.deepEqual(page.press('4 + 8 + 9 ='), display('4+8+9', '21'), 'boundary: display text after 4+8+9=');
  assert.deepEqual(page.markupWrites, [], 'boundary: innerHTML/outerHTML/insertAdjacentHTML/document.write must never be used');
});

test('treats a button data attribute containing markup as inert text', () => {
  const page = loadPage();
  const container = page.document.querySelector('.buttons');
  const synthetic = page.document.createElement('button');

  synthetic.setAttribute('data-number', '<img src=x onerror=alert(1)>');
  container.appendChild(synthetic);

  assert.doesNotThrow(() => page.click(synthetic), 'boundary: a markup-bearing data attribute must not throw');
  assert.deepEqual(page.markupWrites, [], 'boundary: no markup write while showing the payload');
  const shown = page.read();
  assert.equal(typeof shown.expression, 'string', 'boundary: expression line stays text');
  assert.equal(typeof shown.current, 'string', 'boundary: current line stays text');
});
