#!/usr/bin/env node
// Deterministic checks for the agentic workflow. Agents *claim* state; this tool verifies it.
//   node .agent/tools/validate.mjs agents            model policy + agent contract lint
//   node .agent/tools/validate.mjs state             unit state, transitions, evidence, review binding
//   node .agent/tools/validate.mjs all               agents + state
//   node .agent/tools/validate.mjs dashboard [--write]   render .agent/state.md from unit files
//   node .agent/tools/validate.mjs evidence <ID>     render the completion-evidence report
// Exit 0 = no violations, 1 = violations, 2 = tool error.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, STATUSES, TRANSITIONS, git, isFullSha } from './lib.mjs';

const CONTRACT_LABELS = [
  'Purpose', 'Responsibilities', 'Inputs', 'Outputs', 'Skills',
  'Preconditions', 'Postconditions', 'Gates', 'Failure conditions', 'Handoff',
];
const FORCE_VARS = ['CLAUDE_CODE_SUBAGENT_MODEL_FORCE'];
const FINAL_GATES = ['unit', 'integration', 'regression', 'lint', 'typecheck', 'build'];
const LABEL = { unit: 'Unit Tests', integration: 'Integration Tests', regression: 'Regression Tests', lint: 'Lint', typecheck: 'Type Check', build: 'Build' };
const AT_LEAST = {
  READY: ['READY', 'IN_PROGRESS', 'TESTING', 'REVIEW', 'CHANGES_REQUIRED', 'INTEGRATION', 'COMPLETE'],
  STARTED: ['IN_PROGRESS', 'TESTING', 'REVIEW', 'CHANGES_REQUIRED', 'INTEGRATION', 'COMPLETE'],
  TESTING: ['TESTING', 'REVIEW', 'INTEGRATION', 'COMPLETE'],
  REVIEW: ['REVIEW', 'INTEGRATION', 'COMPLETE'],
  INTEGRATION: ['INTEGRATION', 'COMPLETE'],
};

const readJson = (p, dflt) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : dflt);
const familyModels = (policy) => Object.entries(policy).filter(([k, v]) => k !== 'fallback' && Array.isArray(v));
const familyOfAgent = (policy, name) => familyModels(policy).find(([, agents]) => agents.includes(name))?.[0];
const splitTools = (t) => (t || '').split(/,(?![^()]*\))/).map((s) => s.trim()).filter(Boolean);

// ---------------------------------------------------------------- agents
export function checkAgents(root, { home = homedir(), env = process.env } = {}) {
  const errors = [];
  const policy = readJson(join(root, '.agent', 'model-policy.json'), null);
  if (!policy) return ['.agent/model-policy.json is missing'];
  const dir = join(root, '.claude', 'agents');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
  const seen = new Set();

  for (const file of files) {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
    const name = data.name || basename(file, '.md');
    seen.add(name);
    if (data.name !== basename(file, '.md')) errors.push(`${name}: frontmatter name must equal filename ${file}`);
    if (!data.description) errors.push(`${name}: missing description`);
    const family = familyOfAgent(policy, name);
    if (!family) errors.push(`${name}: not listed in .agent/model-policy.json`);
    if (!data.model) errors.push(`${name}: missing model (mandatory)`);
    else if (family && data.model !== family && !(data.model.startsWith('claude-') && data.model.includes(family))) {
      errors.push(`${name}: model ${data.model} does not match policy family ${family} (inherit/other models are not allowed)`);
    }
    const tools = splitTools(data.tools);
    if (tools.length === 0) errors.push(`${name}: missing explicit tools allowlist`);
    const spawn = tools.find((t) => t === 'Agent' || t.startsWith('Agent('));
    if (name === 'orchestrator') {
      const m = spawn && /^Agent\((.*)\)$/.exec(spawn);
      if (!m) errors.push('orchestrator: missing Agent(...) allowlist');
      else for (const a of m[1].split(',').map((s) => s.trim())) {
        if (!familyOfAgent(policy, a) || a === 'orchestrator') errors.push(`orchestrator: Agent allowlist names unknown agent ${a}`);
      }
    } else if (spawn) errors.push(`${name}: only the orchestrator may have the Agent tool`);
    for (const label of CONTRACT_LABELS) {
      if (!body.includes(`**${label}**`)) errors.push(`${name}: contract missing **${label}**`);
    }
    for (const skill of data.skills || []) {
      if (!existsSync(join(root, '.claude', 'skills', skill, 'SKILL.md'))) errors.push(`${name}: skill ${skill} does not exist`);
    }
  }
  for (const [, agents] of familyModels(policy)) {
    for (const a of agents) if (!seen.has(a)) errors.push(`${a}: has no definition in .claude/agents/ (declared in model-policy.json)`);
  }

  // Fallback policy: only a mapping between two distinct, existing families is meaningful.
  const families = familyModels(policy).map(([f]) => f);
  for (const [from, to] of Object.entries(policy.fallback || {})) {
    if (!families.includes(from) || !families.includes(to) || from === to) {
      errors.push(`model-policy.json fallback ${from}->${to} is invalid (both must be distinct model families in the policy)`);
    }
  }
  // Pushing is denied at the permission layer; deny rules beat any allow (including settings.local.json).
  const deny = readJson(join(root, '.claude', 'settings.json'), {}).permissions?.deny || [];
  if (!(deny.some((d) => d.startsWith('Bash(git push')) && deny.some((d) => d.includes('git * push')))) {
    errors.push('git push is not denied in .claude/settings.json permissions.deny (need Bash(git push*) and Bash(git * push*))');
  }

  // Silent-downgrade vectors outside the agent files.
  for (const v of FORCE_VARS) if (env[v]) errors.push(`environment sets ${v}, which overrides every agent's declared model`);
  for (const [label, p] of [['.claude/settings.json', join(root, '.claude', 'settings.json')],
    ['.claude/settings.local.json', join(root, '.claude', 'settings.local.json')],
    ['~/.claude/settings.json', join(home, '.claude', 'settings.json')]]) {
    try {
      const s = readJson(p, {});
      for (const v of FORCE_VARS) if (s.env?.[v]) errors.push(`${label} sets ${v}, which overrides every agent's declared model`);
    } catch { errors.push(`${label} is not valid JSON`); }
  }
  return errors;
}

// ---------------------------------------------------------------- state
export function loadUnits(root) {
  const dir = join(root, '.agent', 'units');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md') && !f.endsWith('.matrix.md')).sort().map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
    const [pre, logText = ''] = body.split(/^## Log\s*$/m);
    const acs = [...pre.matchAll(/^\s*[-*]\s+\*{0,2}(AC-\d+)\b/gm)].map((m) => m[1]);
    const log = logText.split(/\r?\n/).filter((l) => l.trim().startsWith('-')).map((l) => l.trim());
    return { file, id: basename(file, '.md'), data, body, acs: [...new Set(acs)], log };
  });
}

const LOG_RE = /^- (\S+) \| ([A-Z_]+) -> ([A-Z_]+) \| (\S+) \| (.*)$/;

function loadResult(root, unit, gate, phase) {
  return readJson(join(root, '.agent', 'test-results', unit, `latest-${gate}-${phase}.json`), null);
}

// Verdict for one final-phase gate of one unit, judged against the unit's recorded head.
function finalGate(root, unit, gate, cfg, head) {
  if (cfg?.na) return { status: 'N/A', detail: cfg.na };
  const r = loadResult(root, unit, gate, 'final');
  if (!r) return { status: 'MISSING', detail: 'no recorded run (use run-gate)' };
  if (r.head !== head) return { status: 'STALE', detail: `run was on ${String(r.head).slice(0, 8)}, unit head is ${String(head).slice(0, 8)}` };
  if (r.dirty) return { status: 'DIRTY', detail: 'run happened with uncommitted product changes' };
  if (r.exitCode !== 0) return { status: 'FAIL', detail: `exit ${r.exitCode}` };
  if (cfg?.min_tests && (r.tests ?? 0) < cfg.min_tests) return { status: 'FAIL', detail: `only ${r.tests ?? 0} tests ran (min_tests=${cfg.min_tests})` };
  return { status: 'PASS', detail: r.tests != null ? `${r.pass ?? r.tests}/${r.tests} tests` : '', run: r };
}

function reviewVerdicts(root, file) {
  const p = join(root, file || '');
  if (!file || !existsSync(p)) return null;
  const v = {};
  for (const m of readFileSync(p, 'utf8').matchAll(/^\s*[-*]\s+\*{0,2}(AC-\d+)\b\*{0,2}\s*:\s*\*{0,2}([A-Z_]+)/gm)) v[m[1]] = m[2];
  return v;
}

export function checkState(root) {
  const errors = [];
  const policy = readJson(join(root, '.agent', 'model-policy.json'), {});
  const gates = readJson(join(root, '.agent', 'gates.json'), { gates: {} });
  const units = loadUnits(root);
  const byId = new Map(units.map((u) => [u.id, u]));
  const err = (u, msg) => errors.push(`${u.id}: ${msg}`);

  for (const u of units) {
    const d = u.data;
    if (d.id !== u.id) err(u, `frontmatter id '${d.id}' must equal filename`);
    if (!d.title) err(u, 'missing title');
    if (!STATUSES.includes(d.status)) { err(u, `invalid status '${d.status}'`); continue; }
    const at = (k) => AT_LEAST[k].includes(d.status);

    // --- log: legal transitions, consistent with status, actors on the right model
    let prev = 'NEW';
    if (u.log.length === 0) err(u, 'empty Log');
    for (const line of u.log) {
      const m = LOG_RE.exec(line);
      if (!m) { err(u, `malformed log line: ${line}`); continue; }
      const [, , from, to, actor, reason] = m;
      if (from !== prev) err(u, `log discontinuity: expected from ${prev}, got ${from}`);
      if (!(TRANSITIONS[from] || []).includes(to)) err(u, `illegal transition ${from} -> ${to}`);
      const [agent, model] = actor.split('@');
      if (agent !== 'user') {
        const family = familyOfAgent(policy, agent);
        if (!family) err(u, `log actor '${agent}' is not a known agent`);
        else if (!model) err(u, `log actor '${agent}' must record its model (agent@model)`);
        else if (!model.toLowerCase().includes(family)) {
          // The only sanctioned deviation is the policy fallback, and it must be announced on the log line itself.
          const fb = policy.fallback?.[family];
          const sanctioned = fb && model.toLowerCase().includes(fb) && reason.startsWith(`FALLBACK(${family}->${fb})`);
          if (!sanctioned) err(u, `${agent} ran on '${model}' but policy requires ${family} (silent downgrade? a policy fallback must be logged as "FALLBACK(${family}->${fb || '?'}): <reason>")`);
        }
      }
      prev = to;
    }
    if (u.log.length && prev !== d.status) err(u, `log ends at ${prev} but status is ${d.status}`);

    if (d.status === 'BLOCKED' && !d.blocked_reason) err(u, 'BLOCKED requires blocked_reason');

    // --- READY: acceptance criteria + full AC->test matrix
    if (at('READY')) {
      if (u.acs.length === 0) err(u, 'no acceptance criteria (AC-n) defined');
      const mp = join(root, '.agent', 'units', `${u.id}.matrix.md`);
      const matrix = existsSync(mp) ? readFileSync(mp, 'utf8') : null;
      if (matrix === null) err(u, 'test matrix .agent/units/<ID>.matrix.md missing');
      else for (const ac of u.acs) if (!new RegExp(`\\b${ac}\\b`).test(matrix)) err(u, `test matrix does not cover ${ac}`);
    }
    // --- dependencies
    for (const dep of (d.depends_on || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const du = byId.get(dep);
      if (!du) err(u, `unknown dependency ${dep}`);
      else if (at('STARTED') && du.data.status !== 'COMPLETE') err(u, `dependency ${dep} is ${du.data.status}, not COMPLETE`);
    }
    // --- TDD + refs
    if (at('TESTING')) {
      for (const k of ['base_ref', 'head_ref']) {
        if (!isFullSha(d[k])) err(u, `${k} must be a full 40-hex commit SHA`);
        else if (!git(root, ['cat-file', '-e', `${d[k]}^{commit}`]).ok) err(u, `${k} ${d[k].slice(0, 8)} is not a commit in this repo`);
      }
      checkMatrixTestsExist(root, u, gates, errors);
      if (!d.tdd_exempt) {
        const red = loadResult(root, u.id, 'unit', 'red');
        const green = loadResult(root, u.id, 'unit', 'green');
        const refactor = loadResult(root, u.id, 'unit', 'refactor');
        if (!red || red.exitCode === 0) err(u, 'TDD: no failing RED run recorded (a RED run that passes proves nothing)');
        if (!green || !green.passed && green.exitCode !== 0) err(u, 'TDD: no passing GREEN run recorded');
        else if (red && green.timestamp <= red.timestamp) err(u, 'TDD: GREEN run is not after RED run');
        if (!d.tdd_refactor_skip) {
          if (!refactor || refactor.exitCode !== 0) err(u, 'TDD: no passing REFACTOR run (or set tdd_refactor_skip with a reason)');
        }
      }
    }
    // --- review gate + test-change discipline
    if (at('REVIEW') && isFullSha(d.head_ref)) {
      // Review is expensive (Opus): never spend it on a red suite. Integration/regression tests are
      // authored BEFORE review so the reviewer sees the whole unit and the approval SHA stays valid.
      for (const gate of ['unit', 'integration', 'regression']) {
        const g = finalGate(root, u.id, gate, gates.gates?.[gate], d.head_ref);
        if (g.status !== 'PASS' && g.status !== 'N/A') err(u, `${gate} gate is ${g.status} at head_ref (${g.detail})`);
      }
      checkTestChanges(root, u, gates, errors);
    }
    // --- review approval bound to head_ref, by the reviewer's model family
    if (at('INTEGRATION')) {
      if (d.review_status !== 'APPROVED') err(u, `review_status is '${d.review_status}', must be APPROVED`);
      const need = familyOfAgent(policy, 'reviewer');
      const rm = (d.review_model || '').toLowerCase();
      const fb = policy.fallback?.[need];
      if (!rm || !need) err(u, `review_model '${d.review_model}' must be from the ${need} family`);
      else if (!rm.includes(need)) {
        if (fb && rm.includes(fb)) {
          if (!d.review_fallback) err(u, `review_model '${d.review_model}' is the ${fb} fallback for ${need}: review_fallback (why ${need} was unavailable) is required`);
        } else err(u, `review_model '${d.review_model}' must be from the ${need} family`);
      }
      if (d.reviewed_ref !== d.head_ref) err(u, `reviewed_ref (${String(d.reviewed_ref).slice(0, 8)}) != head_ref (${String(d.head_ref).slice(0, 8)}): approval is stale`);
      const verdicts = reviewVerdicts(root, d.review_file);
      if (!verdicts) err(u, `review_file '${d.review_file}' missing`);
      else for (const ac of u.acs) if (verdicts[ac] !== 'SATISFIED') err(u, `review verdict for ${ac} is '${verdicts[ac] ?? 'absent'}', must be SATISFIED`);
    }
    // --- COMPLETE: every configured gate green on head_ref
    if (d.status === 'COMPLETE') {
      for (const gate of FINAL_GATES) {
        const g = finalGate(root, u.id, gate, gates.gates?.[gate], d.head_ref);
        if (!gates.gates?.[gate]) err(u, `gate '${gate}' is not defined in .agent/gates.json`);
        else if (g.status !== 'PASS' && g.status !== 'N/A') err(u, `${gate} gate is ${g.status} (${g.detail})`);
      }
      if (!(d.security_review === 'APPROVED' || /^N\/A: \S/.test(d.security_review || ''))) err(u, 'security_review must be APPROVED or "N/A: <reason>"');
      if (!(d.docs === 'UPDATED' || /^N\/A: \S/.test(d.docs || ''))) err(u, 'docs must be UPDATED or "N/A: <reason>"');
    }
  }

  // --- dependency cycles
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { errors.push(`dependency cycle: ${[...trail, id].join(' -> ')}`); return; }
    state.set(id, 1);
    const deps = (byId.get(id)?.data.depends_on || '').split(',').map((s) => s.trim()).filter((s) => byId.has(s));
    deps.forEach((x) => visit(x, [...trail, id]));
    state.set(id, 2);
  };
  units.forEach((u) => visit(u.id, []));
  return errors;
}

// "All corner cases pass" starts with "all corner cases exist": every test named in the matrix must
// appear verbatim in the test source, and every AC needs at least one named row.
function checkMatrixTestsExist(root, u, gates, errors) {
  const mp = join(root, '.agent', 'units', `${u.id}.matrix.md`);
  if (!existsSync(mp)) return;
  const rows = [...readFileSync(mp, 'utf8').matchAll(/^\|\s*(AC-\d+)\s*\|\s*"([^"]+)"/gm)].map((m) => ({ ac: m[1], name: m[2] }));
  if (!u.data.tdd_exempt) {
    for (const ac of u.acs) if (!rows.some((r) => r.ac === ac)) errors.push(`${u.id}: ${ac} has no named test row in the matrix (second column must be a quoted test name)`);
  }
  let source = '';
  for (const p of gates.test_paths || ['tests']) {
    const dir = join(root, p);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir, { recursive: true })) {
      if (/\.(m|c)?[jt]s$/.test(f)) source += `${readFileSync(join(dir, f), 'utf8')}\n`;
    }
  }
  for (const r of rows) {
    if (!source.includes(r.name)) errors.push(`${u.id}: matrix test "${r.name}" (${r.ac}) does not exist in the test source under ${(gates.test_paths || ['tests']).join(', ')}`);
  }
}

// Modified/deleted pre-existing tests need a recorded decision (kind: test-change, unit: <ID>).
function checkTestChanges(root, u, gates, errors) {
  const paths = gates.test_paths || ['tests'];
  const diff = git(root, ['diff', '--name-status', '--no-renames', `${u.data.base_ref}..${u.data.head_ref}`, '--', ...paths]);
  if (!diff.ok) { errors.push(`${u.id}: cannot diff base_ref..head_ref (${diff.err})`); return; }
  const dir = join(root, '.agent', 'decisions');
  const decisions = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => parseFrontmatter(readFileSync(join(dir, f), 'utf8')))
    : [];
  for (const line of diff.out.split('\n').filter(Boolean)) {
    const [status, path] = line.split('\t');
    if (status !== 'M' && status !== 'D') continue;
    const justified = decisions.some(({ data, body }) => data.kind === 'test-change' && data.unit === u.id && body.includes(path));
    if (!justified) errors.push(`${u.id}: existing test ${status === 'D' ? 'deleted' : 'modified'} without a decision record: ${path} (add .agent/decisions/*.md with kind: test-change, unit: ${u.id}, and the path)`);
  }
}

// ---------------------------------------------------------------- reports
export function dashboard(root) {
  const units = loadUnits(root);
  const done = new Set(units.filter((u) => u.data.status === 'COMPLETE').map((u) => u.id));
  const rows = units.map((u) => {
    const last = u.log.length ? (LOG_RE.exec(u.log[u.log.length - 1]) || [])[4] || '-' : '-';
    return `| ${u.id} | ${u.data.title || ''} | ${u.data.status} | ${u.data.tier || ''} | ${u.data.depends_on || '-'} | ${u.data.review_status || '-'} | ${u.data.blocked_reason || '-'} | ${last} |`;
  });
  const counts = STATUSES.map((s) => `${s}: ${units.filter((u) => u.data.status === s).length}`).join(' · ');
  const ready = units.filter((u) => u.data.status === 'READY' &&
    (u.data.depends_on || '').split(',').map((s) => s.trim()).filter(Boolean).every((d) => done.has(d))).map((u) => u.id);
  const blocked = units.filter((u) => u.data.status === 'BLOCKED').map((u) => `${u.id} (${u.data.blocked_reason})`);
  return [
    '# Project State',
    '',
    '> GENERATED by `node .agent/tools/validate.mjs dashboard --write`. Do not edit by hand; edit unit files.',
    '',
    `Totals — ${counts || 'no units'}`,
    '',
    '| Unit | Title | Status | Tier | Depends on | Review | Blocked reason | Last actor@model |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    `Ready to start (deps complete): ${ready.join(', ') || 'none'}`,
    `Blocked: ${blocked.join('; ') || 'none'}`,
    '',
  ].join('\n');
}

export function evidence(root, id) {
  const u = loadUnits(root).find((x) => x.id === id);
  if (!u) throw new Error(`unknown unit ${id}`);
  const d = u.data;
  const gates = readJson(join(root, '.agent', 'gates.json'), { gates: {} });
  const verdicts = reviewVerdicts(root, d.review_file) || {};
  const satisfied = u.acs.filter((a) => verdicts[a] === 'SATISFIED').length;
  const lines = [`Unit: ${id}`, '', `Status: ${d.status}`, '', `Acceptance Criteria: ${satisfied}/${u.acs.length} satisfied`, ''];
  for (const gate of FINAL_GATES) {
    const g = finalGate(root, id, gate, gates.gates?.[gate], d.head_ref);
    lines.push(`${LABEL[gate]}: ${g.status}${g.detail ? ` (${g.detail})` : ''}`, '');
  }
  lines.push(`Code Review: ${d.review_status || 'NONE'}${d.review_model ? ` by ${d.review_model}` : ''}${d.reviewed_ref ? ` @ ${d.reviewed_ref.slice(0, 8)}` : ''}`, '');
  if (d.review_fallback) lines.push(`REDUCED ASSURANCE: independent review ran under model fallback (${d.review_fallback})`, '');
  const fallbacks = u.log.filter((l) => l.includes('FALLBACK('));
  lines.push(`Model Fallbacks: ${fallbacks.length ? '' : 'none'}`);
  for (const l of fallbacks) lines.push(`  ${l}`);
  lines.push('');
  lines.push(`Security Review: ${d.security_review || 'NONE'}`, '', `Docs: ${d.docs || 'NONE'}`, '');
  const files = isFullSha(d.base_ref) && isFullSha(d.head_ref) ? git(root, ['diff', '--name-only', `${d.base_ref}..${d.head_ref}`]).out : '';
  lines.push('Files Changed:', files ? files.split('\n').map((f) => `  ${f}`).join('\n') : '  (unknown: base_ref/head_ref not set)', '');
  const known = /## Known Issues\s*\n([\s\S]*?)(?=\n## |\s*$)/.exec(u.body);
  lines.push('Known Issues:', known && known[1].trim() ? known[1].trim() : 'None recorded');
  return lines.join('\n');
}

// ---------------------------------------------------------------- CLI
function main(argv) {
  const root = process.cwd();
  const [cmd, arg] = argv;
  const report = (label, errors) => {
    if (errors.length === 0) { console.log(`${label}: OK`); return 0; }
    console.error(`${label}: ${errors.length} violation(s)\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    return 1;
  };
  switch (cmd) {
    case 'agents': return report('agents', checkAgents(root));
    case 'state': return report('state', checkState(root));
    case 'all': return report('agents', checkAgents(root)) | report('state', checkState(root));
    case 'dashboard': {
      const md = dashboard(root);
      if (argv.includes('--write')) { writeFileSync(join(root, '.agent', 'state.md'), md); console.log('wrote .agent/state.md'); } else console.log(md);
      return 0;
    }
    case 'evidence': console.log(evidence(root, arg)); return 0;
    default: console.error('usage: validate.mjs agents|state|all|dashboard [--write]|evidence <ID>'); return 64;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exit(main(process.argv.slice(2))); } catch (e) { console.error(`[validate] ${e.message}`); process.exit(2); }
}
