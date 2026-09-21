'use strict';
// Regression (AC-7): static scan of the three shipped files, index.html, script.js and
// calculator-core.js. Classic scripts only, no dynamic code, no markup injection, no
// third-party hosts. A missing shipped file FAILS every test (see readAllShipped); nothing
// here can skip. Scan helpers and patterns live in tests/helpers/source-scan.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PATTERNS, SCRIPT_FILES, readAllShipped, findMatches, findModuleScriptTags, findReferences, isRelativeReference,
} = require('../helpers/source-scan.js');

function assertNoMatches(name, code, patterns, what) {
  const found = findMatches(code, patterns);
  assert.deepEqual(found, [], `AC-7: ${name} must contain no ${what}`);
}

test('shipped scripts contain no import or export statement', () => {
  const { code } = readAllShipped();

  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.moduleSyntax, 'import/export statement (classic scripts only, file:// promise)');
  }
});

test('index.html contains no script of type module', () => {
  const { html } = readAllShipped();

  assert.deepEqual(findModuleScriptTags(html), [], 'AC-7: index.html must not load any <script type="module"> (breaks file://)');
});

test('shipped scripts contain no eval, new Function or document.write', () => {
  const { code } = readAllShipped();

  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.dynamicCode, 'eval, new Function or document.write');
  }
});

test('shipped scripts contain no innerHTML, outerHTML or insertAdjacentHTML', () => {
  const { code } = readAllShipped();

  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.markupWrites, 'innerHTML, outerHTML or insertAdjacentHTML (use textContent)');
  }
});

test('index.html and scripts reference no third-party or CDN host', () => {
  const { html, code } = readAllShipped();
  const references = findReferences(html);

  assert.ok(references.length > 0, 'AC-7: the scan must find at least one src/href in index.html (otherwise it is vacuous)');
  assert.deepEqual(references.filter((ref) => !isRelativeReference(ref)), [], 'AC-7: every src/href in index.html must be a relative path');
  assertNoMatches('index.html', html, PATTERNS.externalHosts.slice(0, 1), 'absolute URL');
  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.externalHosts, 'absolute or protocol-relative URL');
  }
});
