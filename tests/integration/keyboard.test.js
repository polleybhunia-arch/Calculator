'use strict';
// Integration (KEY-001): real index.html + real page scripts (through the extended
// tests/helpers/dom-stub.js) driven by synthetic keydown events on document, exactly like a
// physical keyboard. Boundary under test: keydown event -> key map -> shared dispatch(input) ->
// core transition -> rendered display lines -- the same boundary tests/integration/dom-click.test.js
// exercises for clicks. The stub is the only fake; it cannot model real focus rings, real OS
// auto-repeat timing, or a real browser's default-action semantics for elements other than
// <button> (UNVERIFIED, RK-2/RK-3).
//
// RED-first (D-010 stage order, sub-step 3): the key map, the repeat policy, the exported input
// vocabulary and the click handler's blur() call do not exist yet in calculator-core.js/script.js,
// so every row below that depends on them fails against the current code. Two rows (19, 20) close
// a pre-existing coverage gap in behavior that already works today (the data-operator/data-action
// boundary filters, carried-forward item 1) and are expected to already pass -- documented at each
// row, not assumed.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPage } = require('../helpers/dom-stub.js');

const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const display = (expression, current) => ({ expression, current });

// Whole-pair equality, so a stray character on either line fails. The message carries both pairs
// so a failure shows the actual values, not only which boundary broke.
function assertDisplay(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label}: page shows ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

// Dispatches one keydown per space-separated token, in order, on `target` (default
// document.body -- the matrix Notation: a bare token carries no modifier and repeat:false and is
// dispatched on document.body unless a row focuses a button first). Returns the last event.
function typeKeys(page, tokens, target) {
  const dest = target || page.document.body;
  const list = Array.isArray(tokens) ? tokens : String(tokens).trim().split(/\s+/).filter(Boolean);
  let event;
  for (const key of list) {
    event = page.dispatch('keydown', dest, { key, repeat: false });
  }
  return event;
}

// Counts writes to an element's textContent. script.js's updateDisplay() writes both display
// lines exactly once per dispatch(input) call, unconditionally, so counting writes to one line is
// an exact, non-invasive proxy for how many times dispatch()/applyInput() ran -- the
// discriminating oracle AC-6/AC-7 need: a repeated "=" with no pending operator is already a
// no-op (BOOT-001 AC-8(f)) and a same-symbol operator repeat rewrites the trail with an identical
// glyph, so a display-only assertion alone cannot tell "ignored" from "reprocessed" for those two
// input types (see the matrix's AC-6/AC-7 notes). No production file or CalculatorCore export is
// touched; only a property descriptor on one live DOM element instance is wrapped.
function spyOnDispatches(element) {
  let proto = Object.getPrototypeOf(element);
  let original;
  while (proto) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'textContent');
    if (descriptor && descriptor.set) {
      original = descriptor;
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }
  if (!original) {
    throw new Error('test helper: no textContent setter found on the element prototype chain');
  }
  let count = 0;
  Object.defineProperty(element, 'textContent', {
    configurable: true,
    get() { return original.get.call(this); },
    set(value) {
      count += 1;
      original.set.call(this, value);
    },
  });
  return { count: () => count };
}

// --- AC-1 --------------------------------------------------------------------------------------

test('typing four plus eight plus nine then Enter renders the same result as the equivalent clicks', () => {
  const page = loadPage();
  typeKeys(page, '4 + 8 + 9 Enter');
  assertDisplay(page.read(), display('4+8+9', '21'), 'key sequence 4 + 8 + 9 Enter');
});

// --- AC-2 --------------------------------------------------------------------------------------

test('typing a decimal chain through keys renders zero point three like the click path', () => {
  const page = loadPage();
  typeKeys(page, '0 . 1 + 0 . 2 =');
  assertDisplay(page.read(), display('0.1+0.2', '0.3'), 'key sequence 0 . 1 + 0 . 2 =');
});

test('a second decimal point key within the same number is ignored through the keyboard', () => {
  const page = loadPage();
  typeKeys(page, '1 . 2 . 3');
  assertDisplay(page.read(), display('', '1.23'), 'key sequence 1 . 2 . 3');
});

test('the comma key is accepted as an alternate decimal point through the keyboard', () => {
  const page = loadPage();
  typeKeys(page, '1 , 5');
  assertDisplay(page.read(), display('', '1.5'), 'key sequence 1 , 5');
});

// --- AC-3 --------------------------------------------------------------------------------------

test('each operator key including x X and the slash key renders the matching display symbol', () => {
  const cases = [
    ['+', '9+'],
    ['-', `9${MINUS}`],
    ['*', `9${TIMES}`],
    ['x', `9${TIMES}`],
    ['X', `9${TIMES}`],
    ['/', `9${DIVIDE}`],
  ];

  for (const [key, current] of cases) {
    const page = loadPage();
    typeKeys(page, '9');
    typeKeys(page, [key]);
    assertDisplay(page.read(), display('', current), `key 9 then ${key}`);
  }
});

// --- AC-4 --------------------------------------------------------------------------------------

test('the Backspace key removes the last typed digit like the DEL button', () => {
  const page = loadPage();
  typeKeys(page, '1 2 3 Backspace');
  assertDisplay(page.read(), display('', '12'), 'key sequence 1 2 3 Backspace');
});

test('the Escape key clears the display from an unfinished chain and from an Error', () => {
  // Preconditions are asserted first: '0' (empty/cleared) is also the fresh-page display, so
  // without proving the chain/Error actually got typed first, a broken key map could leave the
  // page untouched and this test would pass by coincidence.
  const unfinished = loadPage();
  typeKeys(unfinished, '4 + 8');
  assertDisplay(unfinished.read(), display('', '4+8'), 'precondition: keys 4 + 8 before Escape');
  typeKeys(unfinished, ['Escape']);
  assertDisplay(unfinished.read(), display('', '0'), 'Escape after an unfinished chain (4 + 8)');

  const errored = loadPage();
  typeKeys(errored, '5 / 0 Enter');
  assertDisplay(errored.read(), display(`5${DIVIDE}0`, 'Error'), 'precondition: 5 / 0 Enter shows Error');
  typeKeys(errored, ['Escape']);
  assertDisplay(errored.read(), display('', '0'), 'Escape after an Error');
});

test('the Delete key also clears the display like Escape', () => {
  // Precondition asserted first, same reasoning as the Escape test above.
  const page = loadPage();
  typeKeys(page, '4 + 8');
  assertDisplay(page.read(), display('', '4+8'), 'precondition: keys 4 + 8 before Delete');
  typeKeys(page, ['Delete']);
  assertDisplay(page.read(), display('', '0'), 'Delete after an unfinished chain (4 + 8)');
});

// --- AC-5 --------------------------------------------------------------------------------------

test('an unmapped key leaves the display and preventDefault untouched', () => {
  // 'Space' is dispatched as the real KeyboardEvent.key value for the space bar, a single space
  // character, matching the convention the AC-6 rows already use for Space.
  const unmapped = ['a', 'F5', 'Tab', 'ArrowLeft', ' '];

  for (const key of unmapped) {
    const page = loadPage();
    typeKeys(page, '4 +');
    const before = page.read();

    const event = page.dispatch('keydown', page.document.body, { key, repeat: false });

    assertDisplay(page.read(), before, `unmapped key ${JSON.stringify(key)} must leave the display exactly as it was`);
    assertDisplay(page.read(), display('', '4+'), `unmapped key ${JSON.stringify(key)}: state stays 4+`);
    assert.equal(event.defaultPrevented, false, `unmapped key ${JSON.stringify(key)} must not call preventDefault`);
  }
});

test('a mapped key held with Ctrl Meta or Alt is inert and does not call preventDefault', () => {
  const ctrlPage = loadPage();
  typeKeys(ctrlPage, '4');
  const ctrlEvent = ctrlPage.dispatch('keydown', ctrlPage.document.body, { key: 'r', ctrlKey: true, repeat: false });
  assertDisplay(ctrlPage.read(), display('', '4'), 'Ctrl+r must not change the display');
  assert.equal(ctrlEvent.defaultPrevented, false, 'Ctrl+r must not call preventDefault');

  const metaPage = loadPage();
  typeKeys(metaPage, '4');
  const metaEvent = metaPage.dispatch('keydown', metaPage.document.body, { key: '/', metaKey: true, repeat: false });
  assertDisplay(metaPage.read(), display('', '4'), 'Cmd+/ must not change the display');
  assert.equal(metaEvent.defaultPrevented, false, 'Cmd+/ must not call preventDefault');
});

test('Shift alone does not block a mapped key on the page', () => {
  const equalsPage = loadPage();
  typeKeys(equalsPage, '5 + 5');
  equalsPage.dispatch('keydown', equalsPage.document.body, { key: '=', shiftKey: true, repeat: false });
  assertDisplay(equalsPage.read(), display('5+5', '10'), 'Shift+= after 5 + 5 must still evaluate');

  const starPage = loadPage();
  typeKeys(starPage, '9');
  starPage.dispatch('keydown', starPage.document.body, { key: '*', shiftKey: true, repeat: false });
  assertDisplay(starPage.read(), display('', `9${TIMES}`), 'Shift+8 arriving as key * after 9 must still map');
});

test('a mapped modifier free key calls preventDefault exactly once', () => {
  const page = loadPage();
  let count = 0;
  const event = page.dispatch('keydown', page.document.body, {
    key: '4',
    repeat: false,
    preventDefault() { count += 1; this.defaultPrevented = true; },
  });

  assert.equal(count, 1, 'preventDefault must be called exactly once for a mapped, modifier-free key');
  assert.equal(event.defaultPrevented, true, 'defaultPrevented must be true for a mapped, modifier-free key');
});

test('Tab never has preventDefault called', () => {
  const page = loadPage();
  const event = page.dispatch('keydown', page.document.body, { key: 'Tab', repeat: false });

  assert.equal(event.defaultPrevented, false, 'Tab must never have preventDefault called');
});

// --- AC-6 --------------------------------------------------------------------------------------

test('a mouse click blurs its button so a following Enter is read as a normal key not a repeat click', () => {
  // D-011 Option A, one combined row: a mouse click must blur its button (so the follow-up keys,
  // routed to whatever is actually focused, land on document.body and are read as plain keys, not
  // as a repeat of the clicked button); a Tab-focused button's native Enter/Space activation must
  // NOT blur it (so a keyboard-only user keeps their place in the Tab order). Routing the follow-up
  // keys to document.activeElement (falling back to document.body) is what makes this row react to
  // blur() at all -- the previous version always dispatched on document.body regardless of focus,
  // so it could not fail when blur() was removed (r1 F-1).
  const page = loadPage();
  page.click(page.buttonFor('4'));
  assert.equal(page.document.activeElement, null, 'a mouse click must blur its button');

  const target = page.document.activeElement || page.document.body;
  typeKeys(page, '+ 8 Enter', target);

  assertDisplay(page.read(), display('4+8', '12'), 'click 4 then keys + 8 Enter must render 4+8 / 12, not 4+84');

  const tabbedPage = loadPage();
  const seven = tabbedPage.buttonFor('7');
  seven.focus();
  tabbedPage.dispatch('keydown', seven, { key: 'Enter', repeat: false });

  assert.equal(
    tabbedPage.document.activeElement,
    seven,
    'a native Enter activation on a Tab-focused button must NOT blur it (mouse-initiated clicks only)',
  );
});

test('a digit button reached by Tab and activated by Enter types the digit exactly once', () => {
  const page = loadPage();
  const seven = page.buttonFor('7');
  seven.focus();

  page.dispatch('keydown', seven, { key: 'Enter', repeat: false });

  assertDisplay(page.read(), display('', '7'), 'native Enter activation on a Tab-focused digit button must type it exactly once, not twice');
});

test('a digit button reached by Tab and activated by Space types the digit exactly once', () => {
  const page = loadPage();
  const seven = page.buttonFor('7');
  seven.focus();

  page.dispatch('keydown', seven, { key: ' ', repeat: false });

  assertDisplay(page.read(), display('', '7'), 'native Space activation on a Tab-focused digit button must type it exactly once, not twice');
});

test('the equals button reached by Tab and activated by Enter evaluates exactly once', () => {
  const page = loadPage();
  typeKeys(page, '5 + 5');
  const equalsButton = page.buttonFor('=');
  equalsButton.focus();
  const spy = spyOnDispatches(page.document.getElementById('display-current'));
  const before = spy.count();

  page.dispatch('keydown', equalsButton, { key: 'Enter', repeat: false });

  assertDisplay(page.read(), display('5+5', '10'), 'Tab to = then native Enter must evaluate 5 + 5');
  assert.equal(spy.count(), before + 1, 'exactly one dispatch for the native Enter activation (display alone cannot tell one = from two)');
});

test('the equals button reached by Tab and activated by Space evaluates exactly once', () => {
  const page = loadPage();
  typeKeys(page, '5 + 5');
  const equalsButton = page.buttonFor('=');
  equalsButton.focus();
  const spy = spyOnDispatches(page.document.getElementById('display-current'));
  const before = spy.count();

  page.dispatch('keydown', equalsButton, { key: ' ', repeat: false });

  assertDisplay(page.read(), display('5+5', '10'), 'Tab to = then native Space must evaluate 5 + 5');
  assert.equal(spy.count(), before + 1, 'exactly one dispatch for the native Space activation (display alone cannot tell one = from two)');
});

test('clicking a synthetic button with an out of range data operator value changes nothing and throws nothing', () => {
  // Carried-forward item 1 (BOOT-001-r1 F-1, BOOT-001-sec1 F-3): closes a pre-existing coverage
  // gap. script.js's inputFromElement() already filters data-operator against OPERATOR_VALUES, so
  // this row is expected to already pass today, before any KEY-001 code lands -- attached to AC-6
  // because AC-6 is the AC that edits this same click handler (adding blur()).
  const values = ['constructor', '__proto__', ''];

  for (const value of values) {
    const page = loadPage();
    const container = page.document.querySelector('.buttons');
    const synthetic = page.document.createElement('button');
    synthetic.setAttribute('data-operator', value);
    container.appendChild(synthetic);

    const before = page.read();
    assert.doesNotThrow(() => page.click(synthetic), `clicking data-operator=${JSON.stringify(value)} must not throw`);
    assertDisplay(page.read(), before, `clicking data-operator=${JSON.stringify(value)} must not change the display`);
    assert.deepEqual(page.markupWrites, [], `clicking data-operator=${JSON.stringify(value)} must not write markup`);
  }
});

test('clicking a synthetic button with an out of range data action value changes nothing and throws nothing', () => {
  // Carried-forward item 1, data-action half. Same "already passes today" note as the row above.
  const values = ['__proto__', 'constructor', ''];

  for (const value of values) {
    const page = loadPage();
    const container = page.document.querySelector('.buttons');
    const synthetic = page.document.createElement('button');
    synthetic.setAttribute('data-action', value);
    container.appendChild(synthetic);

    const before = page.read();
    assert.doesNotThrow(() => page.click(synthetic), `clicking data-action=${JSON.stringify(value)} must not throw`);
    assertDisplay(page.read(), before, `clicking data-action=${JSON.stringify(value)} must not change the display`);
    assert.deepEqual(page.markupWrites, [], `clicking data-action=${JSON.stringify(value)} must not write markup`);
  }
});

// --- AC-7 --------------------------------------------------------------------------------------

test('holding a digit key so it repeats types the digit on every repeat', () => {
  const page = loadPage();
  page.dispatch('keydown', page.document.body, { key: '5', repeat: false });
  page.dispatch('keydown', page.document.body, { key: '5', repeat: true });
  page.dispatch('keydown', page.document.body, { key: '5', repeat: true });

  assertDisplay(page.read(), display('', '555'), 'every repeat of a held digit key must type');
});

test('holding Backspace so it repeats deletes on every repeat', () => {
  const page = loadPage();
  typeKeys(page, '1 2 3');

  page.dispatch('keydown', page.document.body, { key: 'Backspace', repeat: false });
  assertDisplay(page.read(), display('', '12'), 'first Backspace (repeat:false)');

  page.dispatch('keydown', page.document.body, { key: 'Backspace', repeat: true });
  assertDisplay(page.read(), display('', '1'), 'second Backspace (repeat:true) must also delete');

  page.dispatch('keydown', page.document.body, { key: 'Backspace', repeat: true });
  assertDisplay(page.read(), display('', '0'), 'third Backspace (repeat:true) must also delete');
});

test('holding an operator key so it repeats does not dispatch again for the extra repeats', () => {
  const page = loadPage();
  typeKeys(page, '9');
  const spy = spyOnDispatches(page.document.getElementById('display-current'));
  const before = spy.count();

  page.dispatch('keydown', page.document.body, { key: '+', repeat: false });
  const afterFirst = spy.count();
  assert.equal(afterFirst, before + 1, 'the non-repeat operator press must dispatch exactly once');
  assertDisplay(page.read(), display('', '9+'), 'after the non-repeat + press');

  page.dispatch('keydown', page.document.body, { key: '+', repeat: true });
  page.dispatch('keydown', page.document.body, { key: '+', repeat: true });

  assert.equal(spy.count(), afterFirst, 'repeats of + must not dispatch again (a same-symbol swap would look identical on the display alone)');
  assertDisplay(page.read(), display('', '9+'), 'display must stay 9+ throughout the repeats');
});

test('holding Enter so it repeats does not dispatch again for the extra repeats', () => {
  const page = loadPage();
  typeKeys(page, '5 + 5');
  const spy = spyOnDispatches(page.document.getElementById('display-current'));
  const before = spy.count();

  page.dispatch('keydown', page.document.body, { key: 'Enter', repeat: false });
  const afterFirst = spy.count();
  assert.equal(afterFirst, before + 1, 'the non-repeat Enter press must dispatch exactly once');
  assertDisplay(page.read(), display('5+5', '10'), 'after the non-repeat Enter press');

  page.dispatch('keydown', page.document.body, { key: 'Enter', repeat: true });
  page.dispatch('keydown', page.document.body, { key: 'Enter', repeat: true });

  assert.equal(spy.count(), afterFirst, 'repeats of Enter must not dispatch again (a repeated = is already a no-op on the display alone)');
  assertDisplay(page.read(), display('5+5', '10'), 'display must stay 5+5 / 10 throughout the repeats');
});

test('holding Enter on a Tab focused digit button performs the action once', () => {
  // r2 F-1 / D-012 (rejected): a held Enter on a Tab-focused button re-fires the browser's own
  // native activation on every repeat (the stub models this at Node.dispatchEvent, gated only on
  // defaultPrevented, not on event.repeat). Digits are deliberately repeatable through the
  // document-level keydown channel (AC-7, OQ-4), but that is a different channel from a focused
  // button's native activation, which must act once per physical press regardless of the focused
  // button's input type (AC-6). Without the fix this renders 777, not 7.
  const page = loadPage();
  const seven = page.buttonFor('7');
  seven.focus();

  page.dispatch('keydown', seven, { key: 'Enter', repeat: false });
  page.dispatch('keydown', seven, { key: 'Enter', repeat: true });
  page.dispatch('keydown', seven, { key: 'Enter', repeat: true });

  assertDisplay(page.read(), display('', '7'), 'a held Enter on a Tab-focused digit button must type the digit exactly once, not on every repeat');
});

test('holding Space on a Tab focused digit button performs the action once', () => {
  // r3 F-1 / D-013 row 4 ("Space, repeat, calculator button"): the row above pins the Enter half
  // of the cycle-3 fix, but narrowing the guard to `event.repeat && event.key === 'Enter'`
  // (dropping the Space case) left the whole 72-test suite green while a held Space on a
  // Tab-focused digit button rendered 777, not 7 -- an asymmetric gap, since AC-6 already names
  // Space explicitly and the non-repeat Space activation row already exists.
  const page = loadPage();
  const seven = page.buttonFor('7');
  seven.focus();

  page.dispatch('keydown', seven, { key: ' ', repeat: false });
  page.dispatch('keydown', seven, { key: ' ', repeat: true });
  page.dispatch('keydown', seven, { key: ' ', repeat: true });

  assertDisplay(page.read(), display('', '7'), 'a held Space on a Tab-focused digit button must type the digit exactly once, not on every repeat');
});

test('holding Enter on a Tab focused operator button performs the action once', () => {
  // r3 F-2 / D-013 row 2: the "regardless of input type" guarantee -- the precise reason the
  // D-012-shaped narrowing (`event.repeat && event.target.dataset.number !== undefined`, i.e.
  // digit buttons only) was rejected -- is unpinned by any row using a non-digit button. That
  // narrowing leaves the suite green while a held Enter on a focused operator button fires 3
  // dispatches instead of 1. The display alone cannot see it (an operator-swap that rewrites the
  // trail with an identical glyph is idempotent), which is exactly why this row uses the same
  // spyOnDispatches oracle as the existing operator/equals repeat rows.
  const page = loadPage();
  typeKeys(page, '9');
  const plus = page.buttonFor('+');
  plus.focus();
  const spy = spyOnDispatches(page.document.getElementById('display-current'));
  const before = spy.count();

  page.dispatch('keydown', plus, { key: 'Enter', repeat: false });
  page.dispatch('keydown', plus, { key: 'Enter', repeat: true });
  page.dispatch('keydown', plus, { key: 'Enter', repeat: true });

  assert.equal(spy.count(), before + 1, 'a held Enter on a Tab-focused operator button must dispatch exactly once, not on every repeat');
  assertDisplay(page.read(), display('', '9+'), 'display must stay 9+ throughout the repeats');
});

test('the DEL button reached by Tab and activated by a held Enter deletes exactly once', () => {
  // r4 F-1 / D-013 row "Enter, yes, action button": the digit- and operator-button rows above pin
  // the "native activation acts exactly once" guarantee for two of the three button families, but
  // no existing row focuses an action button (AC/DEL) -- unlike digit and operator buttons, Enter
  // on an action button is not degenerate (it maps to `equals` through mapKey, not to `clear`/
  // `delete`), so this is the one family where the guard's absence is user-visible on the display
  // alone: without it, a held Enter on a Tab-focused DEL evaluates "123" via = instead of deleting.
  const page = loadPage();
  typeKeys(page, '1 2 3');
  const del = page.buttonFor('DEL');
  del.focus();

  page.dispatch('keydown', del, { key: 'Enter', repeat: false });
  page.dispatch('keydown', del, { key: 'Enter', repeat: true });
  page.dispatch('keydown', del, { key: 'Enter', repeat: true });

  assertDisplay(page.read(), display('', '12'), 'a held Enter on a Tab-focused DEL button must delete exactly once, not on every repeat');
});
