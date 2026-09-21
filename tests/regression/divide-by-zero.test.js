'use strict';
// Regression (CALC-001): README behavior "division by zero shows Error", also when an operator
// press (not only =) resolves it, and the README wording that promises it. The defect was found
// during BOOT-001 gate 2 (OQ-B1): `5 / 0 +` showed `5÷0+` and a later = showed `5÷0+Error` / `NaN`.
// Registered in REGISTRY.md. Any changed expectation here needs a `kind: test-change` decision
// record (CLAUDE.md section 14).
//
// The three behavior rows drive the real page (index.html + page scripts through
// tests/helpers/dom-stub.js). The fourth row is a static read of README.md and loads no page.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadPage, REPO_ROOT } = require('../helpers/dom-stub.js');

const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

// Whole-pair equality, so a stray character on either line fails. The message carries both pairs so
// a failure shows the actual page values, not only which behavior broke.
function assertDisplay(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label}: page shows ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

test('README division by zero shows Error also when an operator resolves it', () => {
  assertDisplay(loadPage().press('5 / 0 +'), display(`5${DIVIDE}0`, 'Error'), 'README: 5 / 0 + resolves the division');
});

test('README division by zero shows Error also in the middle of a longer chain', () => {
  // The pending 2+3 resolves to 5 on the way; the line still shows the whole typed chain (OQ-C1).
  assertDisplay(loadPage().press('2 + 3 / 0 *'), display(`2+3${DIVIDE}0`, 'Error'), 'README: 2 + 3 / 0 * resolves the division');
});

test('README Error recovery works after a divide-by-zero resolved by an operator', () => {
  const page = loadPage();

  // Precondition first: a digit after Error already starts fresh on the unfixed page, so without this
  // assertion the recovery half of the test would pass before the fix and prove nothing.
  assertDisplay(page.press('5 / 0 +'), display(`5${DIVIDE}0`, 'Error'), 'precondition: after 5 / 0 + and before any recovery input');

  const afterEquals = page.press('=');
  assertDisplay(afterEquals, display(`5${DIVIDE}0`, 'Error'), 'README: = is ignored while Error is shown');
  assert.ok(!afterEquals.expression.includes('NaN') && !afterEquals.current.includes('NaN'),
    `README: neither line may ever show NaN (page shows ${JSON.stringify(afterEquals)})`);

  assertDisplay(page.press('7'), display('', '7'), 'README: a digit after Error starts a fresh calculation');
});

// The README wraps bullets over several lines, so the bullet is the matching line plus every
// immediately following non-empty line that does not start a new bullet. Lines are re-joined with
// one space (markdown reflows them), so a wrap inside `5 ÷ 0 +` does not hide the example.
const DIVIDE_BY_ZERO_BULLET = /^\s*[-*]\s+.*division[\s-]*by[\s-]*zero/i;
const NEXT_BULLET = /^[-*] /;

function readDivideByZeroBullet() {
  const lines = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex((line) => DIVIDE_BY_ZERO_BULLET.test(line));

  // A missing bullet is a failure, never a skip.
  assert.notEqual(start, -1, 'README: no bullet mentions division by zero');

  const bullet = [lines[start]];
  for (let i = start + 1; i < lines.length && lines[i].trim() !== '' && !NEXT_BULLET.test(lines[i]); i += 1) {
    bullet.push(lines[i]);
  }
  return bullet.map((line) => line.trim()).join(' ');
}

test('README divide-by-zero bullet says Error shows as soon as the division is evaluated, also mid-chain', () => {
  const bullet = readDivideByZeroBullet();
  const tokens = [
    ['the word Error', bullet.includes('Error')],
    [`the example 5 ${DIVIDE} 0 +`, bullet.includes(`5 ${DIVIDE} 0 +`)],
    ['a mention of chain', /chain/i.test(bullet)],
    ['as soon as / immediately / at once', /as soon as|immediately|at once/i.test(bullet)],
  ];
  const missing = tokens.filter(([, present]) => !present).map(([name]) => name);

  assert.deepEqual(missing, [], `README: the divide-by-zero bullet is missing ${missing.join('; ')}. Bullet text: ${JSON.stringify(bullet)}`);
});
