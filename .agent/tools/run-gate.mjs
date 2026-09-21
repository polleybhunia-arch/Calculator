#!/usr/bin/env node
// Runs a quality-gate command from .agent/gates.json and records a machine-generated
// evidence file. Agents must use this instead of typing "tests passed" into a report:
//   node .agent/tools/run-gate.mjs <gate> --unit <ID> [--phase red|green|refactor|final]
// Evidence: .agent/test-results/<ID>/<gate>-<phase>-<ts>.json (+ latest-<gate>-<phase>.json)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { git } from './lib.mjs';

export const PHASES = ['red', 'green', 'refactor', 'final'];

function count(output, name) {
  const m = new RegExp(`^(?:ℹ|#)\\s+${name}\\s+(\\d+)`, 'm').exec(output);
  return m ? Number(m[1]) : null;
}

export function runGate({ root, gate, unit, phase = 'final' }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(unit || '')) throw new Error(`invalid unit id: ${unit}`);
  if (!PHASES.includes(phase)) throw new Error(`invalid phase: ${phase}`);
  const cfg = JSON.parse(readFileSync(join(root, '.agent', 'gates.json'), 'utf8')).gates?.[gate];
  if (!cfg) throw new Error(`unknown gate: ${gate}`);
  if (cfg.na) return { unit, gate, phase, na: cfg.na, passed: true };

  const run = spawnSync(cfg.command, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${run.stdout || ''}${run.stderr || ''}`;
  const exitCode = run.status ?? 1;
  const tests = count(output, 'tests');
  const result = {
    unit, gate, phase,
    command: cfg.command,
    exitCode,
    head: git(root, ['rev-parse', 'HEAD']).out,
    // .agent/ churns constantly (state, evidence); only product/test/config changes make a run "dirty"
    dirty: git(root, ['status', '--porcelain', '--', '.', ':!.agent']).out !== '',
    timestamp: new Date().toISOString(),
    tests, pass: count(output, 'pass'), fail: count(output, 'fail'),
    outputTail: output.split(/\r?\n/).slice(-40).join('\n'),
  };
  result.passed = exitCode === 0;
  if (result.passed && cfg.min_tests && (tests ?? 0) < cfg.min_tests) {
    result.passed = false;
    result.reason = `exit 0 but ${tests ?? 'unknown'} tests ran; gate requires min_tests=${cfg.min_tests} (vacuous pass rejected)`;
  }

  const dir = join(root, '.agent', 'test-results', unit);
  mkdirSync(dir, { recursive: true });
  const body = JSON.stringify(result, null, 2);
  writeFileSync(join(dir, `${gate}-${phase}-${result.timestamp.replace(/[:.]/g, '-')}.json`), body);
  writeFileSync(join(dir, `latest-${gate}-${phase}.json`), body);
  return result;
}

function main(argv) {
  const gate = argv[0];
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const unit = opt('--unit');
  const phase = opt('--phase') || 'final';
  if (!gate || !unit) {
    console.error('usage: node .agent/tools/run-gate.mjs <gate> --unit <ID> [--phase red|green|refactor|final]');
    return 64;
  }
  const res = runGate({ root: process.cwd(), gate, unit, phase });
  if (res.na) { console.log(`${gate}: N/A (${res.na})`); return 0; }
  console.log(res.outputTail);
  console.log(`\n[run-gate] ${gate}/${phase} unit=${unit} exit=${res.exitCode} tests=${res.tests ?? '?'} ` +
    `head=${res.head.slice(0, 8)} dirty=${res.dirty} => ${res.passed ? 'PASSED' : 'NOT PASSED'}${res.reason ? ` (${res.reason})` : ''}`);
  // RED runs are *expected* to fail; the exit code still reflects reality so callers can see it.
  return res.passed ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exit(main(process.argv.slice(2))); } catch (e) { console.error(`[run-gate] ${e.message}`); process.exit(2); }
}
