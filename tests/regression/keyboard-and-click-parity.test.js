'use strict';
// Regression (KEY-001): keyboard-vs-click parity and the GUARD proof that extending
// tests/helpers/dom-stub.js and adding the click-handler blur() (AC-6) never regress the
// existing mouse-click behavior. Real index.html + real page scripts through the extended
// tests/helpers/dom-stub.js. Registered in tests/regression/REGISTRY.md, origin KEY-001.
//
// D-010 stage order: the GUARD row was written and proved green in sub-step 1, against the
// extended stub but the UNMODIFIED script.js (no keydown listener, no blur() call yet) -- the
// "before" run, proving the stub extension alone breaks nothing. The remaining six rows below
// (key-vs-click parity, Ctrl+R inertness, the two README documentation rows) are added here in
// sub-step 3, RED-first against the still-unimplemented keyboard feature. After the implementer
// adds the keydown listener and the blur() call, the GUARD row above is re-run unchanged as the
// "after" proof.

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { loadPage, REPO_ROOT } = require('../helpers/dom-stub.js');
const assert = require('node:assert/strict');

const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

// Whole-pair equality, so a stray character on either line fails. The message carries both pairs
// so a failure shows the actual values, not only which behavior broke.
function assertDisplay(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label}: page shows ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

// Dispatches one keydown per space-separated token, in order, on document.body (the matrix
// Notation: a bare token carries no modifier and repeat:false). Same technique as
// tests/integration/keyboard.test.js's typeKeys, duplicated here (a handful of lines) rather than
// factored into dom-stub.js, which D-008 restricts to the six named primitives only.
function typeKeys(page, tokens) {
  const list = Array.isArray(tokens) ? tokens : String(tokens).trim().split(/\s+/).filter(Boolean);
  for (const key of list) {
    page.dispatch('keydown', page.document.body, { key, repeat: false });
  }
}

test('every README click sequence still renders correctly once the keyboard listener and click blur are installed', () => {
  // GUARD: replays, via clicks only, the same eight sequences tests/regression/readme-behavior.test.js
  // pins for BOOT-001. A mouse-click-only sequence never triggers the keydown listener, and blur()
  // has no visible effect without a following key, so nothing here should ever change -- this row
  // must be green both before (this commit, stub extended, script.js unmodified) and after (the
  // implementer's blur() lands) the KEY-001 implementation.
  const liveTrail = loadPage();
  const steps = [['4', '4'], ['+', '4+'], ['8', '4+8'], ['+', '4+8+'], ['9', '4+8+9']];
  for (const [token, current] of steps) {
    assertDisplay(liveTrail.press(token), display('', current), `GUARD live trail after clicking ${token}`);
  }

  assertDisplay(loadPage().press('4 + 8 + 9 ='), display('4+8+9', '21'), 'GUARD: = splits expression and result');

  assertDisplay(loadPage().press('2 + 3 * 4 ='), display(`2+3${TIMES}4`, '20'), 'GUARD: 2+3*4 is 20, not 14');
  assertDisplay(loadPage().press('8 - 4 - 2 ='), display(`8${MINUS}4${MINUS}2`, '2'), 'GUARD: 8-4-2 is 2, not 6');

  assertDisplay(loadPage().press('4 + 8 + 9 = + 5 ='), display('21+5', '26'), 'GUARD: continue from result 21');

  assertDisplay(loadPage().press('1 . 5 + 2 . 2 5 ='), display('1.5+2.25', '3.75'), 'GUARD: decimal operands');

  assertDisplay(loadPage().press('0 . 1 + 0 . 2 ='), display('0.1+0.2', '0.3'), 'GUARD: 0.1+0.2 is 0.3');
  assertDisplay(loadPage().press('1 / 3 ='), display(`1${DIVIDE}3`, '0.3333333333'), 'GUARD: ten decimal places');

  assertDisplay(loadPage().press('5 / 0 ='), display(`5${DIVIDE}0`, 'Error'), 'GUARD: divide by zero');

  assertDisplay(loadPage().press('5 / 0 = 7'), display('', '7'), 'GUARD: digit after Error starts fresh');
});

test('keyboard chain four plus eight plus nine Enter matches the same sequence performed with clicks', () => {
  const clickPage = loadPage();
  const keyPage = loadPage();

  const clicked = clickPage.press('4 + 8 + 9 =');
  typeKeys(keyPage, '4 + 8 + 9 Enter');
  const typed = keyPage.read();

  assertDisplay(clicked, display('4+8+9', '21'), 'click path: 4 + 8 + 9 =');
  assertDisplay(typed, display('4+8+9', '21'), 'key path: 4 + 8 + 9 Enter');
  assert.deepEqual(typed, clicked, 'keyboard and click renders must be identical');
});

test('keyboard mid chain divide by zero five slash zero plus matches the click result and a following digit starts fresh on both', () => {
  const clickPage = loadPage();
  const keyPage = loadPage();

  const clickedAfterChain = clickPage.press('5 / 0 +');
  typeKeys(keyPage, '5 / 0 +');
  const typedAfterChain = keyPage.read();

  assertDisplay(clickedAfterChain, display(`5${DIVIDE}0`, 'Error'), 'precondition (click path): after 5 / 0 +');
  assertDisplay(typedAfterChain, display(`5${DIVIDE}0`, 'Error'), 'precondition (key path): after 5 / 0 +');
  assert.deepEqual(typedAfterChain, clickedAfterChain, 'both paths must precondition to the same Error state');

  const clickedAfterDigit = clickPage.press('7');
  typeKeys(keyPage, '7');
  const typedAfterDigit = keyPage.read();

  assertDisplay(clickedAfterDigit, display('', '7'), 'click path: digit after mid-chain Error starts fresh');
  assertDisplay(typedAfterDigit, display('', '7'), 'key path: digit after mid-chain Error starts fresh');
  assert.deepEqual(typedAfterDigit, clickedAfterDigit, 'both paths must recover identically');
});

test('keyboard continue from result then plus five equals matches the click path', () => {
  const clickPage = loadPage();
  const keyPage = loadPage();

  const clicked = clickPage.press('4 + 8 + 9 = + 5 =');
  typeKeys(keyPage, '4 + 8 + 9 Enter + 5 Enter');
  const typed = keyPage.read();

  assertDisplay(clicked, display('21+5', '26'), 'click path: continue from result');
  assertDisplay(typed, display('21+5', '26'), 'key path: continue from result');
  assert.deepEqual(typed, clicked, 'keyboard and click renders must be identical');
});

test('Ctrl+R is inert and never calls preventDefault leaving the calculator state untouched', () => {
  const page = loadPage();
  typeKeys(page, '4 +');
  const before = page.read();

  const event = page.dispatch('keydown', page.document.body, { key: 'r', ctrlKey: true, repeat: false });

  assertDisplay(page.read(), before, 'Ctrl+R must not change the calculator state');
  assertDisplay(page.read(), display('', '4+'), 'Ctrl+R: state stays exactly as typed before it');
  assert.equal(event.defaultPrevented, false, 'Ctrl+R: preventDefault must never be called (the browser keeps its own refresh shortcut)');
});

function readReadme() {
  return fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
}

// Locates the keyboard-support documentation: a heading whose text mentions "keyboard" (down to
// the next heading of the same or a shallower level), or failing that a bullet mentioning
// "keyboard" plus its wrapped continuation lines (markdown reflows a bullet over several lines,
// same technique tests/regression/divide-by-zero.test.js uses for the divide-by-zero bullet).
// Returns null, never throws, when nothing mentions keyboard -- a missing section is a test
// failure, not a setup error.
function findKeyboardSection(readme) {
  const lines = readme.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#{1,6}\s.*keyboard/i.test(line));
  if (headingIndex !== -1) {
    const level = lines[headingIndex].match(/^#{1,6}/)[0].length;
    let end = lines.length;
    for (let i = headingIndex + 1; i < lines.length; i += 1) {
      const m = /^(#{1,6})\s/.exec(lines[i]);
      if (m && m[1].length <= level) {
        end = i;
        break;
      }
    }
    return lines.slice(headingIndex, end).join('\n');
  }

  const bulletIndex = lines.findIndex((line) => /^\s*[-*]\s+.*keyboard/i.test(line));
  if (bulletIndex === -1) {
    return null;
  }
  const bullet = [lines[bulletIndex]];
  for (let i = bulletIndex + 1; i < lines.length && lines[i].trim() !== '' && !/^[-*]\s/.test(lines[i]); i += 1) {
    bullet.push(lines[i]);
  }
  return bullet.join('\n');
}

test('README documents every mapped key with its calculator action', () => {
  const section = findKeyboardSection(readReadme());

  assert.notEqual(section, null, 'README: no heading or bullet mentions keyboard');

  const tokens = [
    ['Enter', /\bEnter\b/.test(section)],
    ['Backspace', /\bBackspace\b/.test(section)],
    ['Escape', /\bEscape\b/.test(section)],
    ['Delete', /\bDelete\b/.test(section)],
    ['x/X next to multiply', /\bx\b.{0,40}multipl|multipl.{0,40}\bx\b|\bX\b.{0,40}multipl|multipl.{0,40}\bX\b/i.test(section)],
    ['comma next to decimal', /,.{0,40}decimal|decimal.{0,40},/i.test(section)],
    ['the + operator key', section.includes('+')],
    ['the - operator key', section.includes('-') || section.includes(MINUS)],
    ['the * operator key', section.includes('*') || section.includes(TIMES)],
    ['the / operator key', section.includes('/') || section.includes(DIVIDE)],
    ['a digit range (0 to 9) or the word digit', /0[\s-]*(to|-)[\s-]*9/i.test(section) || /digit/i.test(section)],
  ];
  const missing = tokens.filter(([, present]) => !present).map(([name]) => name);

  assert.deepEqual(missing, [], `README: the keyboard section is missing ${missing.join('; ')}. Section text: ${JSON.stringify(section)}`);
});

function findFeaturesBullets(readme) {
  const lines = readme.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+Features\b/i.test(line));
  assert.notEqual(start, -1, 'README: no Features heading found');

  const bullets = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s/.test(lines[i])) break;
    if (/^\s*[-*]\s/.test(lines[i])) bullets.push(lines[i]);
  }
  return bullets;
}

test('README Features lists keyboard support', () => {
  const bullets = findFeaturesBullets(readReadme());

  assert.ok(bullets.some((b) => /keyboard/i.test(b)), `README: no Features bullet mentions keyboard (bullets: ${JSON.stringify(bullets)})`);
});
