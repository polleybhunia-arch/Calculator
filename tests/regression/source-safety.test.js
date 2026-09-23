'use strict';
// Regression (AC-7): static scan of the three shipped files, index.html, script.js and
// calculator-core.js. Classic scripts only, no dynamic code, no markup injection, no
// third-party hosts. A missing shipped file FAILS every test (see readAllShipped); nothing
// here can skip. Scan helpers and patterns live in tests/helpers/source-scan.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PATTERNS, SCRIPT_FILES, readAllShipped, findMatches, findModuleScriptTags, findReferences, isRelativeReference, stripComments,
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
  // Widened (D-009, carried-forward item 2): index.html's raw markup (HTML comments stripped) is
  // scanned too, not only the two script files -- an inline onclick="eval(x)" attribute now fails
  // this test, where it previously passed unnoticed.
  const { code, htmlCode } = readAllShipped();

  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.dynamicCode, 'eval, new Function or document.write');
  }
  assertNoMatches('index.html', htmlCode, PATTERNS.dynamicCode, 'eval, new Function or document.write');
});

test('shipped scripts contain no innerHTML, outerHTML or insertAdjacentHTML', () => {
  // Widened (D-009, carried-forward item 2): same reasoning as the eval/new Function test above.
  const { code, htmlCode } = readAllShipped();

  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.markupWrites, 'innerHTML, outerHTML or insertAdjacentHTML (use textContent)');
  }
  assertNoMatches('index.html', htmlCode, PATTERNS.markupWrites, 'innerHTML, outerHTML or insertAdjacentHTML (use textContent)');
});

test('index.html and scripts reference no third-party or CDN host', () => {
  // Widened (D-009, carried-forward item 2): index.html's raw markup (HTML comments stripped) is
  // now scanned with the FULL externalHosts pattern set (also the protocol-relative //host
  // pattern), not only the absolute-URL pattern -- a bare //evil.example.com outside a src/href
  // attribute (e.g. in an inline style or a <meta> value) now fails this test, where it
  // previously passed unnoticed.
  const { html, htmlCode, code } = readAllShipped();
  const references = findReferences(html);

  assert.ok(references.length > 0, 'AC-7: the scan must find at least one src/href in index.html (otherwise it is vacuous)');
  assert.deepEqual(references.filter((ref) => !isRelativeReference(ref)), [], 'AC-7: every src/href in index.html must be a relative path');
  assertNoMatches('index.html', htmlCode, PATTERNS.externalHosts, 'absolute or protocol-relative URL');
  for (const name of SCRIPT_FILES) {
    assertNoMatches(name, code[name], PATTERNS.externalHosts, 'absolute or protocol-relative URL');
  }
});

test('stripComments does not hide code following a regex literal containing a double slash', () => {
  // New (D-009, carried-forward item 3): a regex literal such as /https?:\/\// contains an
  // escaped // that a naive comment stripper reads as a line-comment marker, discarding the rest
  // of THAT LINE -- which hides a following eval( or innerHTML= on the same line
  // (BOOT-001-sec1 F-2). Both statements are on one line on purpose: that is exactly the
  // construction the defect needs (a second statement on its own line is unaffected either way,
  // since the buggy stripper only eats through the next newline). RED on the pre-fix
  // stripComments: today it drops "eval(payload);" along with the fake line comment.
  const snippet = 'const re = /https?:\\/\\//; eval(payload);';
  const stripped = stripComments(snippet);

  assert.ok(stripped.includes('eval('), `AC-7: stripComments must keep code that follows a regex literal on the same line (stripped output: ${JSON.stringify(stripped)})`);
});
