// Shared fixtures for framework tool tests: builds throwaway git repos that
// mimic a project using the agentic workflow.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

export function git(root, ...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout.trim();
}

export function put(root, rel, content) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

export const MODEL_POLICY = {
  opus: ['orchestrator', 'planner', 'reviewer', 'security-reviewer', 'architecture-reviewer'],
  sonnet: ['implementer', 'test-designer'],
  fallback: { opus: 'sonnet' },
};

export const GATES = {
  test_paths: ['tests'],
  gates: {
    unit: { command: 'node -e "console.log(\'ℹ tests 2\');console.log(\'ℹ pass 2\');console.log(\'ℹ fail 0\')"', min_tests: 1 },
    integration: { command: 'node -e "console.log(\'ℹ tests 1\');console.log(\'ℹ pass 1\');console.log(\'ℹ fail 0\')"', min_tests: 1 },
    regression: { command: 'node -e "console.log(\'ℹ tests 3\');console.log(\'ℹ pass 3\');console.log(\'ℹ fail 0\')"', min_tests: 1 },
    lint: { command: 'node -e "process.exit(0)"' },
    typecheck: { na: 'plain JavaScript, no type system' },
    build: { na: 'no build step' },
  },
};

export function makeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'agentfw-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 't@example.com');
  git(root, 'config', 'user.name', 'T');
  git(root, 'config', 'commit.gpgsign', 'false');
  put(root, '.agent/model-policy.json', JSON.stringify(MODEL_POLICY));
  put(root, '.agent/gates.json', JSON.stringify(GATES));
  put(root, 'tests/regression/old.test.js', '// original\n');
  put(root, 'src.js', '// v1\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'base');
  return root;
}

export function commitAll(root, msg = 'work') {
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', msg);
  return git(root, 'rev-parse', 'HEAD');
}

export function unitFile(fields, { acs = ['AC-1', 'AC-2'], log = [] } = {}) {
  const fm = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
  const acText = acs.map((a) => `- ${a}: does something`).join('\n');
  return `---\n${fm}\n---\n\n# ${fields.id}\n\n## Acceptance Criteria\n${acText}\n\n## Log\n${log.join('\n')}\n`;
}

export const readText = (p) => readFileSync(p, 'utf8');
