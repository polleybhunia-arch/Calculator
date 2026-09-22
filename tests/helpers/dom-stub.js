'use strict';
// Minimal DOM stub for driving the real page scripts from Node (decision D-001).
//
// What it does: parses the real index.html, builds an element tree, runs every
// <script src> in document order inside ONE node:vm context that defines `document`
// (and `window`) but no `module`, `exports` or `require`, so a dual-export guard takes
// the browser branch. Clicks are delivered with bubbling from the target up to `document`,
// and focus the clicked element first, like a real browser. `document.activeElement` and
// `element.focus()`/`blur()` are modeled (D-008), as is a focused <button>'s native default
// action for an Enter/Space keydown (a click(), suppressible by preventDefault()).
//
// What it does NOT model (report as UNVERIFIED, never assume): CSS, layout, real focus rings,
// real pointer/touch events, real file:// loading, capture-phase listeners, markup parsing,
// real OS auto-repeat timing, a real browser's default-action semantics for elements other
// than <button>.
//
// Default-off mutation-probe hook (used by the integration-tester to prove tests bite,
// never by a normal run): set CALC_STUB_TRANSFORM to a JSON object
//   { "file": "script.js", "find": "<text>", "replace": "<text>", "count": 1 }
// and the stub rewrites that script's source IN MEMORY before running it. It throws if the
// number of occurrences of `find` differs from `count` (default 1), so a probe cannot
// silently miss. Nothing on disk is modified.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INDEX_HTML = path.join(REPO_ROOT, 'index.html');

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);
const CLASSIC_SCRIPT_TYPES = new Set(['', 'text/javascript', 'application/javascript']);

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&');
}

const toDatasetKey = (attr) => attr.slice('data-'.length).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const toDataAttr = (key) => `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

class TextNode {
  constructor(text) {
    this.text = text;
    this.parentNode = null;
  }

  get textContent() {
    return this.text;
  }
}

class Node {
  constructor() {
    this.childNodes = [];
    this.parentNode = null;
    this._listeners = new Map();
  }

  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.childNodes = child.parentNode.childNodes.filter((n) => n !== child);
    }
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  addEventListener(type, listener, options) {
    const capture = options === true || (options && options.capture === true);
    if (capture) {
      throw new Error('dom-stub: capture-phase listeners are not modeled');
    }
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    const list = this._listeners.get(type) || [];
    this._listeners.set(type, list.filter((l) => l !== listener));
  }

  // Bubbles from this node through every ancestor up to `document`, like a browser.
  // Listener exceptions propagate to the caller (a browser would only report them), so a
  // throwing handler fails the test instead of disappearing.
  //
  // Native default action (D-008, matrix item 11): a real browser performs a focused button's
  // default click activation for an Enter/Space keydown once the bubble phase completes,
  // unless some listener called preventDefault() during the bubble. Modeled here, after the
  // bubble loop, for a keydown whose target IS document.activeElement and is a <button>.
  dispatchEvent(event) {
    event.target = this;
    const path = [];
    for (let node = this; node; node = node.parentNode) {
      path.push(node);
      if (!event.bubbles) {
        break;
      }
    }
    for (const node of path) {
      event.currentTarget = node;
      for (const listener of (node._listeners.get(event.type) || []).slice()) {
        listener.call(node, event);
      }
      if (event._stopped) {
        break;
      }
    }
    if (
      event.type === 'keydown'
      && (event.key === 'Enter' || event.key === ' ')
      && !event.defaultPrevented
      && this instanceof Element
      && this.tagName === 'BUTTON'
      && this.ownerDocument
      && this.ownerDocument.activeElement === this
    ) {
      this.dispatchEvent({
        type: 'click',
        bubbles: true,
        defaultPrevented: false,
        _stopped: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this._stopped = true; },
      });
    }
    return !event.defaultPrevented;
  }

  get textContent() {
    return this.childNodes.map((n) => n.textContent).join('');
  }
}

// Supports one compound simple selector: tag, #id, .class, [attr], [attr=value] in any mix.
function parseSelector(selector) {
  const parts = { tag: null, id: null, classes: [], attrs: [] };
  const token = /^(?:([a-zA-Z][\w-]*)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\])/;
  let rest = selector.trim();
  if (rest === '') {
    throw new Error('dom-stub: empty selector');
  }
  while (rest !== '') {
    const m = token.exec(rest);
    if (!m) {
      throw new Error(`dom-stub: unsupported selector "${selector}" (compound simple selectors only)`);
    }
    if (m[1]) parts.tag = m[1].toLowerCase();
    else if (m[2]) parts.id = m[2];
    else if (m[3]) parts.classes.push(m[3]);
    else parts.attrs.push({ name: m[4], value: m[5] ?? m[6] ?? m[7] ?? null });
    rest = rest.slice(m[0].length);
  }
  return parts;
}

class Element extends Node {
  constructor(tagName, ownerDocument) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this._attributes = new Map();
  }

  get id() {
    return this._attributes.get('id') ?? '';
  }

  get className() {
    return this._attributes.get('class') ?? '';
  }

  getAttribute(name) {
    return this._attributes.has(name) ? this._attributes.get(name) : null;
  }

  setAttribute(name, value) {
    this._attributes.set(name.toLowerCase(), String(value));
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  // Focus tracking (D-008, matrix items 7-9): at most one focused element per document, matching
  // a real DOM. focus() models "reached by Tab" when called with no preceding click. blur() is a
  // no-op unless this element currently holds focus (same as a real browser).
  focus() {
    this.ownerDocument._activeElement = this;
  }

  blur() {
    if (this.ownerDocument._activeElement === this) {
      this.ownerDocument._activeElement = null;
    }
  }

  // Live view over the data-* attributes: values are strings, a missing key is undefined
  // (the same contract as HTMLElement.dataset, so `dataset.number !== undefined` behaves).
  get dataset() {
    const attrs = this._attributes;
    return new Proxy({}, {
      get: (_, key) => (typeof key === 'string' ? attrs.get(toDataAttr(key)) : undefined),
      set: (_, key, value) => {
        attrs.set(toDataAttr(String(key)), String(value));
        return true;
      },
      has: (_, key) => typeof key === 'string' && attrs.has(toDataAttr(key)),
      ownKeys: () => [...attrs.keys()].filter((k) => k.startsWith('data-')).map(toDatasetKey),
      getOwnPropertyDescriptor: (_, key) => (
        typeof key === 'string' && attrs.has(toDataAttr(key))
          ? { value: attrs.get(toDataAttr(key)), enumerable: true, configurable: true, writable: true }
          : undefined
      ),
    });
  }

  get children() {
    return this.childNodes.filter((n) => n instanceof Element);
  }

  get textContent() {
    return this.childNodes.map((n) => n.textContent).join('');
  }

  // Setting textContent replaces all children with one literal text node. Markup is never parsed.
  set textContent(value) {
    const text = value === null || value === undefined ? '' : String(value);
    this.childNodes.forEach((n) => { n.parentNode = null; });
    this.childNodes = [];
    if (text !== '') {
      this.appendChild(new TextNode(text));
    }
  }

  _trapMarkupWrite(property, value) {
    this.ownerDocument.markupWrites.push({
      element: `${this.tagName.toLowerCase()}${this.id ? `#${this.id}` : ''}`,
      property,
      value: String(value),
    });
  }

  // Markup writes are trapped (recorded in document.markupWrites). The value is kept as
  // literal text and never parsed, so a script that wrongly used innerHTML still renders and
  // the trap log, not a side effect, is what proves the write happened.
  set innerHTML(value) {
    this._trapMarkupWrite('innerHTML', value);
    this.textContent = value;
  }

  get innerHTML() {
    throw new Error('dom-stub: innerHTML reads are not modeled');
  }

  set outerHTML(value) {
    this._trapMarkupWrite('outerHTML', value);
  }

  get outerHTML() {
    throw new Error('dom-stub: outerHTML reads are not modeled');
  }

  insertAdjacentHTML(position, html) {
    this._trapMarkupWrite(`insertAdjacentHTML(${position})`, html);
  }

  matches(selector) {
    const want = parseSelector(selector);
    if (want.tag && this.tagName.toLowerCase() !== want.tag) return false;
    if (want.id && this.id !== want.id) return false;
    const classes = this.className.split(/\s+/).filter(Boolean);
    if (!want.classes.every((c) => classes.includes(c))) return false;
    return want.attrs.every((a) => this.hasAttribute(a.name) && (a.value === null || this.getAttribute(a.name) === a.value));
  }

  querySelectorAll(selector) {
    parseSelector(selector);
    const found = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class Document extends Node {
  constructor() {
    super();
    this.markupWrites = [];
    // Focus tracking (D-008, matrix item 7): nothing is focused until a click or an explicit
    // focus() call.
    this._activeElement = null;
  }

  get activeElement() {
    return this._activeElement;
  }

  get children() {
    return this.childNodes.filter((n) => n instanceof Element);
  }

  get documentElement() {
    return this.children[0] || null;
  }

  get body() {
    return this.querySelector('body');
  }

  createElement(tagName) {
    return new Element(tagName, this);
  }

  getElementById(id) {
    return this.querySelector(`#${id}`);
  }

  querySelectorAll(selector) {
    parseSelector(selector);
    const found = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  write(html) {
    this.markupWrites.push({ element: 'document', property: 'write', value: String(html) });
  }

  writeln(html) {
    this.markupWrites.push({ element: 'document', property: 'writeln', value: String(html) });
  }
}

function parseAttributes(text, element) {
  const attr = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = attr.exec(text)) !== null) {
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    element.setAttribute(m[1], decodeEntities(value));
  }
}

// Builds a Document from real markup. No hard-coded element or button table anywhere.
function parseHtml(source) {
  const document = new Document();
  const stack = [document];
  const tokens = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/\s*([a-zA-Z][^\s>]*)\s*>|<([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
  let last = 0;
  let m;
  const addText = (text) => {
    if (text !== '') {
      stack[stack.length - 1].appendChild(new TextNode(decodeEntities(text)));
    }
  };

  while ((m = tokens.exec(source)) !== null) {
    addText(source.slice(last, m.index));
    last = tokens.lastIndex;

    if (m[1]) {
      const name = m[1].toLowerCase();
      let depth = stack.length - 1;
      while (depth > 0 && stack[depth].tagName.toLowerCase() !== name) depth -= 1;
      if (depth === 0) {
        throw new Error(`dom-stub: unmatched closing tag </${name}> at offset ${m.index} of index.html`);
      }
      stack.length = depth;
    } else if (m[2]) {
      const name = m[2].toLowerCase();
      const element = document.createElement(name);
      const selfClosing = /\/\s*$/.test(m[3]);
      parseAttributes(m[3].replace(/\/\s*$/, ''), element);
      stack[stack.length - 1].appendChild(element);

      if (RAW_TEXT_ELEMENTS.has(name) && !selfClosing) {
        const close = new RegExp(`</${name}\\s*>`, 'i');
        const rest = source.slice(last);
        const end = close.exec(rest);
        if (!end) {
          throw new Error(`dom-stub: <${name}> is never closed in index.html`);
        }
        const inner = rest.slice(0, end.index);
        if (inner !== '') element.appendChild(new TextNode(inner));
        last += end.index + end[0].length;
        tokens.lastIndex = last;
      } else if (!VOID_ELEMENTS.has(name) && !selfClosing) {
        stack.push(element);
      }
    }
  }
  addText(source.slice(last));
  return document;
}

// Ordered <script> list of a parsed document: [{ src, type, inline }].
function listScripts(document) {
  return document.querySelectorAll('script').map((el) => ({
    src: el.getAttribute('src'),
    type: (el.getAttribute('type') || '').toLowerCase(),
    inline: el.getAttribute('src') === null ? el.textContent : null,
  }));
}

// Parses the real index.html without running anything (for markup-contract assertions).
function readIndexHtml() {
  const source = fs.readFileSync(INDEX_HTML, 'utf8');
  const document = parseHtml(source);
  return { source, document, scripts: listScripts(document) };
}

function readTransformFromEnv() {
  const raw = process.env.CALC_STUB_TRANSFORM;
  if (!raw) {
    return null;
  }
  const spec = JSON.parse(raw);
  if (typeof spec.file !== 'string' || typeof spec.find !== 'string' || typeof spec.replace !== 'string') {
    throw new Error('dom-stub: CALC_STUB_TRANSFORM needs string fields file, find, replace');
  }
  return spec;
}

let warnedAboutTransform = false;

function applyTransform(file, source, spec) {
  if (!spec || spec.file !== file) {
    return source;
  }
  const parts = source.split(spec.find);
  const found = parts.length - 1;
  const expected = spec.count ?? 1;
  if (found !== expected) {
    throw new Error(`dom-stub: mutation probe expected ${expected} occurrence(s) of ${JSON.stringify(spec.find)} in ${file}, found ${found}`);
  }
  if (!warnedAboutTransform) {
    warnedAboutTransform = true;
    process.emitWarning(`CALC_STUB_TRANSFORM active: ${file} is rewritten in memory (mutation probe, results are not evidence of the shipped code)`);
  }
  return parts.join(spec.replace);
}

function assertLocalScriptPath(src) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('/')) {
    throw new Error(`dom-stub: refusing non-relative script src "${src}" (only repo-relative files are loaded)`);
  }
  const resolved = path.resolve(REPO_ROOT, src);
  if (resolved !== REPO_ROOT && !resolved.startsWith(REPO_ROOT + path.sep)) {
    throw new Error(`dom-stub: script src "${src}" resolves outside the repository`);
  }
  return resolved;
}

const TOKEN_MATCHERS = [
  [/^[0-9.]$/, (t) => (b) => b.dataset.number === t],
  [/^[+\-*/]$/, (t) => (b) => b.dataset.operator === t],
  [/^=$/, () => (b) => b.dataset.action === 'equals'],
  [/^AC$/, () => (b) => b.dataset.action === 'clear'],
  [/^DEL$/, () => (b) => b.dataset.action === 'delete'],
];

// Loads index.html into a fresh vm context and returns a page handle. Every call is a new,
// independent page (no state shared between tests).
function loadPage(options = {}) {
  const { document, scripts } = readIndexHtml();
  const context = vm.createContext({ document, console });
  vm.runInContext('globalThis.window = globalThis;', context);
  const transform = options.transform === undefined ? readTransformFromEnv() : options.transform;
  const executedScripts = [];

  for (const script of scripts) {
    if (!CLASSIC_SCRIPT_TYPES.has(script.type)) {
      throw new Error(`dom-stub: script type="${script.type}" is not a classic script; the page must load with plain <script> tags`);
    }
    let code;
    let filename;
    if (script.src === null) {
      code = script.inline;
      filename = 'index.html<inline>';
    } else {
      code = applyTransform(script.src, fs.readFileSync(assertLocalScriptPath(script.src), 'utf8'), transform);
      filename = script.src;
    }
    try {
      new vm.Script(code, { filename }).runInContext(context);
    } catch (cause) {
      throw new Error(`index.html script "${filename}" failed to run as a classic script: ${cause.message}`, { cause });
    }
    executedScripts.push(filename);
  }

  const page = {
    document,
    scripts,
    executedScripts,
    get markupWrites() {
      return document.markupWrites;
    },

    // Delivers a bubbling click from `target`, like a user click. A real browser focuses the
    // clicked element before the click event fires (D-008, matrix item 10), so a blur() inside a
    // click handler has an observable effect.
    click(target) {
      target.focus();
      return page.dispatch('click', target);
    },

    dispatch(type, target, init = {}) {
      const event = {
        type,
        bubbles: true,
        defaultPrevented: false,
        _stopped: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this._stopped = true; },
        ...init,
      };
      target.dispatchEvent(event);
      return event;
    },

    // Finds the real button for a matrix token (digit or `.`, + - * /, =, AC, DEL).
    buttonFor(token) {
      const entry = TOKEN_MATCHERS.find(([re]) => re.test(token));
      if (!entry) {
        throw new Error(`dom-stub: unknown input token "${token}"`);
      }
      const matches = document.querySelectorAll('button').filter(entry[1](token));
      if (matches.length !== 1) {
        throw new Error(`dom-stub: expected exactly one button for token "${token}" in index.html, found ${matches.length}`);
      }
      return matches[0];
    },

    // Clicks each token in order and returns the display afterwards. Accepts an array or a
    // space-separated string.
    press(tokens) {
      const list = Array.isArray(tokens) ? tokens : String(tokens).trim().split(/\s+/).filter(Boolean);
      list.forEach((token) => page.click(page.buttonFor(token)));
      return page.read();
    },

    read() {
      const expression = document.getElementById('display-expression');
      const current = document.getElementById('display-current');
      if (!expression || !current) {
        throw new Error('dom-stub: index.html must contain #display-expression and #display-current');
      }
      return { expression: expression.textContent, current: current.textContent };
    },
  };
  return page;
}

module.exports = { loadPage, readIndexHtml, parseHtml, listScripts, REPO_ROOT };
