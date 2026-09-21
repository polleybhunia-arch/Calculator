import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, globToRegExp, matchesAny, STATUSES, TRANSITIONS } from '../lib.mjs';
import { decide } from '../../../.claude/hooks/write-guard.mjs';

const policy = {
  always_deny: ['CLAUDE.md', '.claude/**', '.agent/tools/**', '.agent/test-results/**', '.agent/state.md'],
  roles: {
    orchestrator: { allow: ['.agent/**'] },
    reviewer: { allow: ['.agent/reviews/**'] },
    implementer: { allow: ['**'], deny: ['.agent/units/**', '.agent/reviews/**'] },
    refactorer: { allow: ['**'], deny: ['tests/**'] },
  },
};

test('parseFrontmatter reads scalars, quoted values and lists', () => {
  const { data, body } = parseFrontmatter('---\nname: x\nmodel: "opus"\nskills:\n  - a\n  - b\ntools: Read, Grep\n---\nbody text\n');
  assert.equal(data.name, 'x');
  assert.equal(data.model, 'opus');
  assert.deepEqual(data.skills, ['a', 'b']);
  assert.equal(data.tools, 'Read, Grep');
  assert.equal(body.trim(), 'body text');
});

test('parseFrontmatter: an empty value is an empty string, not a list, unless items follow', () => {
  const { data } = parseFrontmatter('---\ndepends_on:\nreview_status: NONE\nskills:\n  - a\n---\n');
  assert.equal(data.depends_on, '');
  assert.equal(data.review_status, 'NONE');
  assert.deepEqual(data.skills, ['a']);
});

test('parseFrontmatter returns empty data when there is no frontmatter', () => {
  assert.deepEqual(parseFrontmatter('just text').data, {});
});

test('globToRegExp: ** crosses directories, * does not', () => {
  assert.ok(globToRegExp('.agent/**').test('.agent/units/A.md'));
  assert.ok(globToRegExp('tests/**').test('tests/a/b/c.js'));
  assert.ok(globToRegExp('*.md').test('README.md'));
  assert.ok(!globToRegExp('*.md').test('docs/README.md'));
  assert.ok(globToRegExp('**/*.md').test('docs/x/README.md'));
  assert.ok(globToRegExp('**/*.md').test('README.md'));
  assert.ok(!globToRegExp('.agent/**').test('other/.agent/x'));
  assert.ok(matchesAny(['a/**', 'b'], 'b'));
});

test('status model has a legal path from PLANNED to COMPLETE and never skips review', () => {
  assert.ok(STATUSES.includes('COMPLETE'));
  assert.ok(!TRANSITIONS.TESTING.includes('COMPLETE'));
  assert.ok(!TRANSITIONS.REVIEW.includes('COMPLETE'));
  assert.ok(TRANSITIONS.REVIEW.includes('CHANGES_REQUIRED'));
});

test('guard: orchestrator may write state under .agent but not product code', () => {
  assert.equal(decide(policy, 'orchestrator', '.agent/plan.md').allow, true);
  assert.equal(decide(policy, 'orchestrator', 'src.js').allow, false);
  assert.equal(decide(policy, 'orchestrator', 'tests/unit/a.test.js').allow, false);
});

test('guard: reviewer can only write review artifacts', () => {
  assert.equal(decide(policy, 'reviewer', '.agent/reviews/A-1.md').allow, true);
  assert.equal(decide(policy, 'reviewer', 'src.js').allow, false);
});

test('guard: implementer edits code and tests but not unit state or reviews', () => {
  assert.equal(decide(policy, 'implementer', 'src.js').allow, true);
  assert.equal(decide(policy, 'implementer', 'tests/unit/a.test.js').allow, true);
  assert.equal(decide(policy, 'implementer', '.agent/units/A-1.md').allow, false);
  assert.equal(decide(policy, 'implementer', '.agent/reviews/A-1.md').allow, false);
});

test('guard: refactorer may not touch tests (behavior must be preserved)', () => {
  assert.equal(decide(policy, 'refactorer', 'src.js').allow, true);
  assert.equal(decide(policy, 'refactorer', 'tests/unit/a.test.js').allow, false);
});

test('guard: governance files are denied to every agent role (deny beats allow)', () => {
  for (const role of ['orchestrator', 'implementer', 'refactorer']) {
    assert.equal(decide(policy, role, 'CLAUDE.md').allow, false, role);
    assert.equal(decide(policy, role, '.agent/tools/validate.mjs').allow, false, role);
    assert.equal(decide(policy, role, '.agent/test-results/A/unit.json').allow, false, role);
    assert.equal(decide(policy, role, '.claude/agents/x.md').allow, false, role);
  }
});

test('guard: no role (human session) is unrestricted; unknown agent types are only kept off governance files', () => {
  assert.equal(decide(policy, undefined, 'CLAUDE.md').allow, true);
  assert.equal(decide(policy, 'mystery-agent', 'src.js').allow, true);
  assert.equal(decide(policy, 'mystery-agent', 'CLAUDE.md').allow, false);
});

test('guard: paths escaping the project root are denied for known roles', () => {
  assert.equal(decide(policy, 'implementer', '../outside.js').allow, false);
});

// The hook as a real process, with native absolute paths (Windows backslashes included):
// regression for path normalization, which the pure decide() tests cannot cover.
import { spawnSync } from 'node:child_process';
import { join as pjoin, resolve as presolve } from 'node:path';
import { mkdtempSync as mk, mkdirSync as mkd, writeFileSync as wf } from 'node:fs';
import { tmpdir as td } from 'node:os';

const HOOK = presolve(import.meta.dirname, '../../../.claude/hooks/write-guard.mjs');

function hook(root, agent_type, file) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ agent_type, cwd: root, tool_input: { file_path: file } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: 'utf8',
  });
}

test('guard process: enforces the policy on native absolute paths and fails open on garbage input', () => {
  const root = mk(pjoin(td(), 'guard-'));
  mkd(pjoin(root, '.agent'));
  wf(pjoin(root, '.agent', 'write-policy.json'), JSON.stringify(policy));
  assert.equal(hook(root, 'reviewer', pjoin(root, 'script.js')).status, 2);
  assert.equal(hook(root, 'reviewer', pjoin(root, '.agent', 'reviews', 'X-r1.md')).status, 0);
  assert.equal(hook(root, 'implementer', pjoin(root, 'script.js')).status, 0);
  assert.equal(hook(root, 'implementer', pjoin(root, 'CLAUDE.md')).status, 2);
  assert.equal(hook(root, 'orchestrator', pjoin(root, '..', 'evil.txt')).status, 2);
  assert.equal(hook(root, undefined, pjoin(root, 'CLAUDE.md')).status, 0);
  const garbage = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.equal(garbage.status, 0);
});
