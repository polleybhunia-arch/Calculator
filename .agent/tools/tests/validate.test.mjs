import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkState, checkAgents, dashboard, evidence } from '../validate.mjs';
import { makeRepo, git, put, commitAll, unitFile, MODEL_POLICY } from './helpers.mjs';

const TS = (m) => `2026-01-01T10:${String(m).padStart(2, '0')}:00Z`;
const FULL_LOG = (id) => [
  `- ${TS(0)} | NEW -> PLANNED | planner@claude-opus-5 | created`,
  `- ${TS(1)} | PLANNED -> READY | orchestrator@claude-opus-5 | gates 1-2 passed`,
  `- ${TS(2)} | READY -> IN_PROGRESS | orchestrator@claude-opus-5 | dispatch`,
  `- ${TS(3)} | IN_PROGRESS -> TESTING | implementer@claude-sonnet-5 | tdd done`,
  `- ${TS(4)} | TESTING -> REVIEW | orchestrator@claude-opus-5 | unit gate green`,
  `- ${TS(5)} | REVIEW -> INTEGRATION | orchestrator@claude-opus-5 | review approved`,
  `- ${TS(6)} | INTEGRATION -> COMPLETE | orchestrator@claude-opus-5 | all gates green`,
];

function result(root, unit, gate, phase, over = {}) {
  const r = {
    unit, gate, phase, command: 'x', exitCode: 0, head: 'HEAD', dirty: false,
    timestamp: TS(9), tests: 2, pass: 2, fail: 0, ...over,
  };
  put(root, `.agent/test-results/${unit}/latest-${gate}-${phase}.json`, JSON.stringify(r));
}

// Builds a repo whose unit U-1 is fully COMPLETE and valid; tests then break one thing at a time.
function completeFixture() {
  const root = makeRepo();
  const base = git(root, 'rev-parse', 'HEAD');
  put(root, 'src.js', '// v2\n');
  put(root, 'tests/unit/new.test.js', "test('test one', () => {});\ntest('test two', () => {});\n");
  const head = commitAll(root, 'impl');
  put(root, '.agent/units/U-1.md', unitFile({
    id: 'U-1', title: 'demo', status: 'COMPLETE', tier: 'T2', depends_on: '',
    base_ref: base, head_ref: head, tdd_exempt: '', tdd_refactor_skip: '',
    review_status: 'APPROVED', review_file: '.agent/reviews/U-1-r1.md',
    reviewed_ref: head, review_model: 'claude-opus-5',
    security_review: 'N/A: no security surface', docs: 'N/A: internal only', blocked_reason: '',
  }, { log: FULL_LOG('U-1') }));
  put(root, '.agent/units/U-1.matrix.md', '| AC-1 | "test one" | unit | happy | x | ok |\n| AC-2 | "test two" | unit | edge | y | ok |\n');
  put(root, '.agent/reviews/U-1-r1.md', '# Review\n- AC-1: SATISFIED — test a\n- AC-2: SATISFIED — test b\n');
  result(root, 'U-1', 'unit', 'red', { exitCode: 1, timestamp: TS(1), pass: 0, fail: 2 });
  result(root, 'U-1', 'unit', 'green', { timestamp: TS(2) });
  result(root, 'U-1', 'unit', 'refactor', { timestamp: TS(3) });
  for (const g of ['unit', 'integration', 'regression', 'lint']) result(root, 'U-1', g, 'final', { head });
  return { root, base, head };
}

const errs = (root) => checkState(root, { home: root });
const has = (errors, needle) => errors.some((e) => e.includes(needle));

test('a fully evidenced COMPLETE unit validates cleanly', () => {
  const { root } = completeFixture();
  assert.deepEqual(errs(root), []);
});

test('unknown status is rejected', () => {
  const { root } = completeFixture();
  put(root, '.agent/units/U-2.md', unitFile({ id: 'U-2', title: 't', status: 'DONEISH' }));
  assert.ok(has(errs(root), 'U-2: invalid status'));
});

test('a log that jumps TESTING -> COMPLETE is an illegal transition', () => {
  const { root, head } = completeFixture();
  const log = FULL_LOG('U-1').filter((l) => !/REVIEW|INTEGRATION/.test(l));
  log.splice(4, 0, `- ${TS(4)} | TESTING -> COMPLETE | orchestrator@claude-opus-5 | skip`);
  put(root, '.agent/units/U-1.md', unitFile({
    id: 'U-1', title: 'demo', status: 'COMPLETE', base_ref: git(root, 'rev-parse', 'HEAD~1'), head_ref: head,
    review_status: 'APPROVED', reviewed_ref: head, review_model: 'claude-opus-5', review_file: '.agent/reviews/U-1-r1.md',
    security_review: 'N/A: x', docs: 'N/A: x',
  }, { log }));
  assert.ok(has(errs(root), 'illegal transition TESTING -> COMPLETE'));
});

test('log status must equal frontmatter status', () => {
  const { root } = completeFixture();
  const f = join(root, '.agent/units/U-1.md');
  const fs = await_import();
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('status: COMPLETE', 'status: REVIEW'));
  assert.ok(has(errs(root), 'log ends at COMPLETE but status is REVIEW'));
});

test('COMPLETE requires review by the reviewer model family (opus), not sonnet', () => {
  const { root } = completeFixture();
  const f = join(root, '.agent/units/U-1.md');
  const fs = await_import();
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('review_model: claude-opus-5', 'review_model: claude-sonnet-5'));
  assert.ok(has(errs(root), 'review_model'));
});

test('fallback: a Sonnet review is accepted only with a recorded review_fallback reason, and is flagged in evidence', () => {
  const { root } = completeFixture();
  const fs = await_import();
  const f = join(root, '.agent/units/U-1.md');
  const orig = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, orig.replace('review_model: claude-opus-5', 'review_model: claude-sonnet-5'));
  assert.ok(has(errs(root), 'review_fallback'));
  fs.writeFileSync(f, orig.replace('review_model: claude-opus-5', 'review_model: claude-sonnet-5\nreview_fallback: opus unavailable (model not accessible)'));
  assert.deepEqual(errs(root), []);
  assert.match(evidence(root, 'U-1'), /REDUCED ASSURANCE.*fallback/i);
});

test('fallback: an Opus-family agent may log Sonnet only on a line marked FALLBACK(opus->sonnet)', () => {
  const { root, head } = completeFixture();
  const f = join(root, '.agent/units/U-1.md');
  const fs = await_import();
  const orig = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, orig.replace('planner@claude-opus-5 | created', 'planner@claude-sonnet-5 | FALLBACK(opus->sonnet): opus unavailable'));
  assert.ok(!has(errs(root), 'planner'), errs(root).join('\n'));
  fs.writeFileSync(f, orig.replace('planner@claude-opus-5 | created', 'planner@claude-sonnet-5 | created'));
  assert.ok(has(errs(root), 'planner'));
  // Sonnet-family agents have no fallback: a marker does not legitimize a downgrade to haiku
  fs.writeFileSync(f, orig.replace('implementer@claude-sonnet-5 | tdd done', 'implementer@claude-haiku-4-5 | FALLBACK(sonnet->haiku): x'));
  assert.ok(has(errs(root), 'implementer'));
  assert.ok(head);
});

test('approval bound to a different commit than head_ref is stale', () => {
  const { root } = completeFixture();
  const f = join(root, '.agent/units/U-1.md');
  const fs = await_import();
  const other = git(root, 'rev-parse', 'HEAD~1');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/reviewed_ref: \w+/, `reviewed_ref: ${other}`));
  assert.ok(has(errs(root), 'reviewed_ref'));
});

test('gate result recorded against an older commit is stale', () => {
  const { root } = completeFixture();
  result(root, 'U-1', 'regression', 'final', { head: git(root, 'rev-parse', 'HEAD~1') });
  assert.ok(has(errs(root), 'regression'));
});

test('gate result taken on a dirty tree is rejected', () => {
  const { root, head } = completeFixture();
  result(root, 'U-1', 'lint', 'final', { head, dirty: true });
  assert.ok(has(errs(root), 'lint'));
});

test('a vacuous test run (0 tests) does not satisfy a gate with min_tests', () => {
  const { root, head } = completeFixture();
  result(root, 'U-1', 'integration', 'final', { head, tests: 0, pass: 0 });
  assert.ok(has(errs(root), 'integration'));
});

test('REVIEW status already requires unit, integration and regression green on head_ref (review is not wasted on red suites)', () => {
  const { root } = completeFixture();
  const fs = await_import();
  const f = join(root, '.agent/units/U-1.md');
  const log = FULL_LOG('U-1').slice(0, 5).join('\n');
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace('status: COMPLETE', 'status: REVIEW').replace(/## Log[\s\S]*$/, `## Log\n${log}\n`);
  fs.writeFileSync(f, text);
  assert.deepEqual(errs(root).filter((e) => e.startsWith('U-1')), []);
  fs.rmSync(join(root, '.agent/test-results/U-1/latest-integration-final.json'));
  assert.ok(has(errs(root), 'integration gate is MISSING at head_ref'));
});

test('a failing final gate blocks COMPLETE', () => {
  const { root, head } = completeFixture();
  result(root, 'U-1', 'unit', 'final', { head, exitCode: 1, fail: 1 });
  assert.ok(has(errs(root), 'unit'));
});

test('N/A gates from gates.json do not need results', () => {
  const { root } = completeFixture();
  assert.ok(!has(errs(root), 'typecheck'));
  assert.ok(!has(errs(root), 'build'));
});

test('matrix must cover every acceptance criterion', () => {
  const { root } = completeFixture();
  put(root, '.agent/units/U-1.matrix.md', '| AC-1 | t1 | ok |\n');
  assert.ok(has(errs(root), 'AC-2'));
});

test('corner cases must exist: every named matrix test must appear in the test source', () => {
  const { root } = completeFixture();
  put(root, '.agent/units/U-1.matrix.md',
    '| AC-1 | "test one" | unit | happy | x | ok |\n| AC-2 | "test two" | unit | edge | y | ok |\n| AC-2 | "never written corner case" | unit | boundary | z | ok |\n');
  const e = errs(root);
  assert.ok(has(e, 'never written corner case'));
  assert.ok(!has(e, '"test one"'));
});

test('every AC needs at least one named test row once work reaches TESTING', () => {
  const { root } = completeFixture();
  put(root, '.agent/units/U-1.matrix.md', '| AC-1 | "test one" | unit | happy | x | ok |\n| AC-2 | (todo) | unit | edge | y | ok |\n');
  assert.ok(has(errs(root), 'AC-2 has no named test'));
});

test('reviewer verdict must mark every AC SATISFIED', () => {
  const { root } = completeFixture();
  put(root, '.agent/reviews/U-1-r1.md', '- AC-1: SATISFIED\n- AC-2: UNVERIFIED — no test\n');
  assert.ok(has(errs(root), 'AC-2'));
});

test('TDD evidence: missing RED result blocks TESTING+, unless exempted with a reason', () => {
  const { root } = completeFixture();
  const fs = await_import();
  fs.rmSync(join(root, '.agent/test-results/U-1/latest-unit-red.json'));
  assert.ok(has(errs(root), 'RED'));
  const f = join(root, '.agent/units/U-1.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('tdd_exempt: ', 'tdd_exempt: docs-only unit'));
  assert.ok(!has(errs(root), 'RED'));
});

test('TDD evidence: a RED run that passed proves nothing', () => {
  const { root } = completeFixture();
  result(root, 'U-1', 'unit', 'red', { exitCode: 0, timestamp: TS(1) });
  assert.ok(has(errs(root), 'RED'));
});

test('modifying an existing test without a decision record is an error; with one it passes', () => {
  const { root, head } = completeFixture();
  put(root, 'tests/regression/old.test.js', '// weakened\n');
  const newHead = commitAll(root, 'edit old test');
  const fs = await_import();
  const f = join(root, '.agent/units/U-1.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').split(head).join(newHead));
  for (const g of ['unit', 'integration', 'regression', 'lint']) result(root, 'U-1', g, 'final', { head: newHead });
  assert.ok(has(errs(root), 'tests/regression/old.test.js'));
  put(root, '.agent/decisions/D-9.md', '---\nkind: test-change\nunit: U-1\n---\nChanged tests/regression/old.test.js because requirement X changed.\n');
  assert.ok(!has(errs(root), 'tests/regression/old.test.js'));
});

test('a unit past READY needs its dependencies COMPLETE; unknown deps and cycles are errors', () => {
  const { root } = completeFixture();
  put(root, '.agent/units/U-2.md', unitFile({ id: 'U-2', title: 't', status: 'PLANNED', depends_on: 'U-3' }, { log: [`- ${TS(0)} | NEW -> PLANNED | planner@claude-opus-5 | c`] }));
  put(root, '.agent/units/U-3.md', unitFile({ id: 'U-3', title: 't', status: 'PLANNED', depends_on: 'U-2' }, { log: [`- ${TS(0)} | NEW -> PLANNED | planner@claude-opus-5 | c`] }));
  assert.ok(has(errs(root), 'cycle'));
  put(root, '.agent/units/U-4.md', unitFile({ id: 'U-4', title: 't', status: 'PLANNED', depends_on: 'NOPE' }, { log: [`- ${TS(0)} | NEW -> PLANNED | planner@claude-opus-5 | c`] }));
  assert.ok(has(errs(root), 'unknown dependency NOPE'));
});

test('BLOCKED requires a recorded reason', () => {
  const { root } = completeFixture();
  put(root, '.agent/units/U-5.md', unitFile({ id: 'U-5', title: 't', status: 'BLOCKED', blocked_reason: '' }, {
    log: [`- ${TS(0)} | NEW -> PLANNED | planner@claude-opus-5 | c`, `- ${TS(1)} | PLANNED -> BLOCKED | orchestrator@claude-opus-5 | x`],
  }));
  assert.ok(has(errs(root), 'U-5: BLOCKED requires blocked_reason'));
});

test('log actors must run on their declared model family (silent-downgrade detector)', () => {
  const { root } = completeFixture();
  const fs = await_import();
  const f = join(root, '.agent/units/U-1.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('planner@claude-opus-5', 'planner@claude-sonnet-5'));
  assert.ok(has(errs(root), 'planner'));
});

// ---- agents ----
const GOOD_AGENT = (name, model, extra = {}) => `---
name: ${name}
description: does things
model: ${model}
tools: ${extra.tools || 'Read, Grep'}
skills:
  - tdd
---
## Contract
- **Purpose**: p
- **Responsibilities**: r
- **Inputs**: i
- **Outputs**: o
- **Skills**: s
- **Preconditions**: pre
- **Postconditions**: post
- **Gates**: g
- **Failure conditions**: f
- **Handoff**: h
`;

function agentRepo() {
  const root = makeRepo();
  put(root, '.claude/skills/tdd/SKILL.md', '---\nname: tdd\ndescription: d\n---\n');
  put(root, '.claude/agents/planner.md', GOOD_AGENT('planner', 'opus'));
  put(root, '.claude/agents/implementer.md', GOOD_AGENT('implementer', 'sonnet'));
  put(root, '.claude/settings.json', JSON.stringify({ permissions: { deny: ['Bash(git push*)', 'Bash(git * push*)'] } }));
  return root;
}
const aerr = (root, env = {}) => checkAgents(root, { home: mkdtempSync(join(tmpdir(), 'home-')), env });

test('agents: valid definitions pass except for policy agents that are missing', () => {
  const errors = aerr(agentRepo());
  assert.ok(errors.every((e) => e.includes('has no definition')), errors.join('\n'));
});

test('agents: model is mandatory and must match the policy family', () => {
  const root = agentRepo();
  put(root, '.claude/agents/planner.md', GOOD_AGENT('planner', 'sonnet'));
  assert.ok(has(aerr(root), 'planner: model sonnet does not match policy family opus'));
  put(root, '.claude/agents/planner.md', GOOD_AGENT('planner', 'inherit'));
  assert.ok(has(aerr(root), 'planner: model'));
  put(root, '.claude/agents/planner.md', GOOD_AGENT('planner', 'opus').replace('model: opus\n', ''));
  assert.ok(has(aerr(root), 'planner: missing model'));
});

test('agents: full model ids are accepted when they contain the family', () => {
  const root = agentRepo();
  put(root, '.claude/agents/planner.md', GOOD_AGENT('planner', 'claude-opus-5'));
  assert.ok(!has(aerr(root), 'planner: model'));
});

test('agents: every contract element must be present', () => {
  const root = agentRepo();
  put(root, '.claude/agents/implementer.md', GOOD_AGENT('implementer', 'sonnet').replace('- **Handoff**: h\n', ''));
  assert.ok(has(aerr(root), 'implementer: contract missing **Handoff**'));
});

test('agents: workers cannot spawn agents; unlisted skills are errors', () => {
  const root = agentRepo();
  put(root, '.claude/agents/implementer.md', GOOD_AGENT('implementer', 'sonnet', { tools: 'Read, Agent' }));
  assert.ok(has(aerr(root), 'implementer: only the orchestrator may have the Agent tool'));
  put(root, '.claude/agents/implementer.md', GOOD_AGENT('implementer', 'sonnet').replace('- tdd', '- nonexistent'));
  assert.ok(has(aerr(root), 'skill nonexistent'));
});

test('agents: the orchestrator allowlist may only name policy agents', () => {
  const root = agentRepo();
  put(root, '.claude/agents/orchestrator.md', GOOD_AGENT('orchestrator', 'opus', { tools: 'Agent(planner, rogue), Read' }));
  assert.ok(has(aerr(root), 'orchestrator: Agent allowlist names unknown agent rogue'));
  put(root, '.claude/agents/orchestrator.md', GOOD_AGENT('orchestrator', 'opus', { tools: 'Read' }));
  assert.ok(has(aerr(root), 'orchestrator: missing Agent(...) allowlist'));
});

test('agents: pushing to a remote must be denied in project settings (deny beats any local allow)', () => {
  const root = agentRepo();
  put(root, '.claude/settings.json', JSON.stringify({ permissions: { deny: [] } }));
  assert.ok(has(aerr(root), 'git push is not denied'));
  put(root, '.claude/settings.json', JSON.stringify({ permissions: { deny: ['Bash(git push*)'] } }));
  assert.ok(has(aerr(root), 'git push is not denied'), 'must also cover `git -C x push` style invocations');
  put(root, '.claude/settings.json', JSON.stringify({ permissions: { deny: ['Bash(git push*)', 'Bash(git * push*)'] } }));
  assert.ok(!has(aerr(root), 'git push is not denied'));
});

test('agents: fallback policy may only map a family to a different family that exists', () => {
  const root = agentRepo();
  put(root, '.agent/model-policy.json', JSON.stringify({ ...MODEL_POLICY, fallback: { opus: 'haiku' } }));
  assert.ok(has(aerr(root), 'fallback'));
  put(root, '.agent/model-policy.json', JSON.stringify({ ...MODEL_POLICY, fallback: { opus: 'opus' } }));
  assert.ok(has(aerr(root), 'fallback'));
  put(root, '.agent/model-policy.json', JSON.stringify(MODEL_POLICY));
  assert.ok(!has(aerr(root), 'fallback'));
});

test('agents: CLAUDE_CODE_SUBAGENT_MODEL_FORCE anywhere is a silent-downgrade vector', () => {
  const root = agentRepo();
  assert.ok(has(aerr(root, { CLAUDE_CODE_SUBAGENT_MODEL_FORCE: '1' }), 'CLAUDE_CODE_SUBAGENT_MODEL_FORCE'));
  put(root, '.claude/settings.json', JSON.stringify({ env: { CLAUDE_CODE_SUBAGENT_MODEL_FORCE: '1' } }));
  assert.ok(has(aerr(root), '.claude/settings.json sets CLAUDE_CODE_SUBAGENT_MODEL_FORCE'));
});

// ---- dashboard / evidence ----
test('dashboard lists units with status and is deterministic', () => {
  const { root } = completeFixture();
  const a = dashboard(root);
  assert.match(a, /\| U-1 \| demo \| COMPLETE \|/);
  assert.equal(a, dashboard(root));
});

test('evidence report reflects recorded facts, not claims', () => {
  const { root } = completeFixture();
  const report = evidence(root, 'U-1');
  assert.match(report, /Status: COMPLETE/);
  assert.match(report, /Acceptance Criteria: 2\/2 satisfied/);
  assert.match(report, /Unit Tests: PASS/);
  assert.match(report, /Type Check: N\/A/);
  assert.match(report, /Code Review: APPROVED/);
  assert.match(report, /src\.js/);
});

import * as fsModule from 'node:fs';
function await_import() { return fsModule; }
