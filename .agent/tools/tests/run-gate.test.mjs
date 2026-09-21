import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runGate } from '../run-gate.mjs';
import { makeRepo, put, git, GATES } from './helpers.mjs';

const latest = (root, unit, gate, phase) =>
  JSON.parse(readFileSync(join(root, `.agent/test-results/${unit}/latest-${gate}-${phase}.json`), 'utf8'));

test('records exit code, head commit, test counts and cleanliness from a real execution', () => {
  const root = makeRepo();
  const res = runGate({ root, gate: 'unit', unit: 'U-1' });
  assert.equal(res.exitCode, 0);
  assert.equal(res.passed, true);
  assert.equal(res.head, git(root, 'rev-parse', 'HEAD'));
  assert.equal(res.dirty, false);
  assert.equal(res.tests, 2);
  assert.equal(res.pass, 2);
  assert.deepEqual(latest(root, 'U-1', 'unit', 'final').head, res.head);
});

test('changes outside .agent mark the run dirty; .agent changes do not', () => {
  const root = makeRepo();
  put(root, '.agent/units/x.md', 'state churn');
  assert.equal(runGate({ root, gate: 'lint', unit: 'U-1' }).dirty, false);
  put(root, 'src.js', '// edited, uncommitted\n');
  assert.equal(runGate({ root, gate: 'lint', unit: 'U-1' }).dirty, true);
});

test('a failing command is recorded as failed with its output tail', () => {
  const root = makeRepo();
  const cfg = structuredClone(GATES);
  cfg.gates.unit = { command: 'node -e "console.log(\'boom-marker\');process.exit(3)"', min_tests: 1 };
  put(root, '.agent/gates.json', JSON.stringify(cfg));
  const res = runGate({ root, gate: 'unit', unit: 'U-1', phase: 'red' });
  assert.equal(res.exitCode, 3);
  assert.equal(res.passed, false);
  assert.match(res.outputTail, /boom-marker/);
  assert.equal(latest(root, 'U-1', 'unit', 'red').exitCode, 3);
});

test('exit 0 with fewer tests than min_tests is NOT a pass (vacuous green)', () => {
  const root = makeRepo();
  const cfg = structuredClone(GATES);
  cfg.gates.unit = { command: 'node -e "console.log(\'ℹ tests 0\')"', min_tests: 1 };
  put(root, '.agent/gates.json', JSON.stringify(cfg));
  const res = runGate({ root, gate: 'unit', unit: 'U-1' });
  assert.equal(res.exitCode, 0);
  assert.equal(res.passed, false);
  assert.match(res.reason, /min_tests/);
});

test('N/A gates are reported, not executed; unknown gates throw', () => {
  const root = makeRepo();
  const res = runGate({ root, gate: 'build', unit: 'U-1' });
  assert.equal(res.na, 'no build step');
  assert.ok(!existsSync(join(root, '.agent/test-results/U-1/latest-build-final.json')));
  assert.throws(() => runGate({ root, gate: 'nonsense', unit: 'U-1' }), /unknown gate/);
});

test('rejects unsafe unit ids and phases (no path traversal into evidence dir)', () => {
  const root = makeRepo();
  assert.throws(() => runGate({ root, gate: 'unit', unit: '../x' }), /invalid unit/);
  assert.throws(() => runGate({ root, gate: 'unit', unit: 'U-1', phase: 'sneaky' }), /invalid phase/);
});
