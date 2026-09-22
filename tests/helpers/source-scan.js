'use strict';
// Static-scan helpers for the AC-7 source-safety regression rows. Whitespace-tolerant patterns
// run against the shipped files with comments removed, so prose in comments is never flagged.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SHIPPED_FILES = ['index.html', 'script.js', 'calculator-core.js'];
const SCRIPT_FILES = ['script.js', 'calculator-core.js'];

// Removes // and /* */ comments but keeps string literals and regex literals intact (D-009): a
// `/` is treated as the start of a regex literal only when the previous significant character
// indicates an operand is expected next (an operator, opening bracket, comma, colon, semicolon,
// or the very start of the file) -- the same rule real JS tokenizers use to tell `/` division
// from `/regex/`. Without this, a regex literal such as /https?:\/\// was read as a line comment
// starting at its embedded `//`, discarding the rest of the line -- a false negative that could
// hide a following eval( or innerHTML= on the same line (BOOT-001-sec1 F-2). Known limitation: a
// `/` immediately after a keyword like `return` or `typeof` is still read as division, not regex;
// neither shipped script does this.
const OPERAND_EXPECTED_AFTER = /[([{,;:=&|!?+\-*%^~<>]/;

function stripComments(source) {
  let out = '';
  let quote = null;
  let lastSignificant = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += next === undefined ? '' : next;
        i += 2;
        continue;
      }
      if (c === quote) { quote = null; lastSignificant = c; }
      i += 1;
      continue;
    }
    if (c === '"' || c === '\'' || c === '`') {
      quote = c;
      out += c;
      i += 1;
    } else if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
    } else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      out += ' ';
    } else if (c === '/' && (lastSignificant === '' || OPERAND_EXPECTED_AFTER.test(lastSignificant))) {
      // Regex literal: consume verbatim up to an unescaped closing slash, respecting [...]
      // classes, so an embedded // or /* is never mistaken for a comment marker.
      let j = i + 1;
      let inClass = false;
      while (j < source.length) {
        const cj = source[j];
        if (cj === '\\') { j += 2; continue; }
        if (cj === '\n') break;
        if (cj === '[') { inClass = true; j += 1; continue; }
        if (cj === ']') { inClass = false; j += 1; continue; }
        if (cj === '/' && !inClass) { j += 1; break; }
        j += 1;
      }
      out += source.slice(i, j);
      lastSignificant = '/';
      i = j;
    } else {
      out += c;
      if (!/\s/.test(c)) {
        lastSignificant = c;
      }
      i += 1;
    }
  }
  return out;
}

// Removes <!-- ... --> HTML comments before a security scan runs over raw markup, so descriptive
// prose written in a future HTML comment can never trigger (or hide) a pattern match (D-009). No
// other HTML parsing is done.
function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

// A missing shipped file FAILS the test (never skips): AC-7 covers all three files.
function readShipped(name) {
  const file = path.join(REPO_ROOT, name);
  assert.ok(fs.existsSync(file), `AC-7 scan: shipped file ${name} does not exist (all of ${SHIPPED_FILES.join(', ')} must be present and scanned)`);
  return fs.readFileSync(file, 'utf8');
}

// Reads all three shipped files. `code` holds the comment-stripped JS, `html` the raw markup,
// `htmlCode` the markup with <!-- --> HTML comments stripped (D-009) for the same pattern scans
// that run over the two script files.
function readAllShipped() {
  const html = readShipped('index.html');
  const htmlCode = stripHtmlComments(html);
  const code = {};
  const raw = {};
  for (const name of SCRIPT_FILES) {
    raw[name] = readShipped(name);
    code[name] = stripComments(raw[name]);
  }
  return {
    html, htmlCode, code, raw,
  };
}

const PATTERNS = {
  // Statement-form import/export, dynamic import(), import.meta. `module.exports` is allowed.
  moduleSyntax: [
    /(?:^|[;{}])\s*(?:import|export)\b(?!\s*[:=,.)\]])/m,
    /\bimport\s*\(/,
    /\bimport\s*\.\s*meta\b/,
  ],
  // `\beval\b` is a superset of `eval(` so an indirect `const f = eval;` is caught too.
  dynamicCode: [/\beval\b/, /\bnew\s+Function\b/, /\bFunction\s*\(/, /\bdocument\s*\.\s*write/],
  markupWrites: [/\binnerHTML\b/, /\bouterHTML\b/, /\binsertAdjacentHTML\b/],
  // Absolute URLs, and string literals that start with a protocol-relative //host.
  externalHosts: [/\b(?:https?|wss?|ftp):\/\//i, /['"`]\s*\/\/[^\s'"`]/],
};

function findMatches(text, patterns) {
  const found = [];
  for (const pattern of patterns) {
    const m = pattern.exec(text);
    if (m) {
      const line = text.slice(0, m.index).split('\n').length;
      found.push(`${pattern} matched ${JSON.stringify(m[0].trim())} near line ${line}`);
    }
  }
  return found;
}

// <script ...> tags whose attributes declare type="module" (either quote style, any case).
function findModuleScriptTags(html) {
  return (html.match(/<script\b[^>]*>/gi) || []).filter((tag) => /\btype\s*=\s*(?:"\s*module\s*"|'\s*module\s*'|module\b)/i.test(tag));
}

// Every src/href attribute value in the markup.
function findReferences(html) {
  const refs = [];
  const attr = /\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let m;
  while ((m = attr.exec(html)) !== null) {
    refs.push(m[1] ?? m[2] ?? m[3]);
  }
  return refs;
}

const isRelativeReference = (ref) => !/^[a-z][a-z0-9+.-]*:/i.test(ref) && !ref.startsWith('//');

module.exports = {
  PATTERNS, SCRIPT_FILES, SHIPPED_FILES, REPO_ROOT,
  stripComments, stripHtmlComments, readShipped, readAllShipped, findMatches, findModuleScriptTags, findReferences, isRelativeReference,
};
