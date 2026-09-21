// Shared helpers for the agentic-workflow tooling. Dependency-free on purpose.
import { spawnSync } from 'node:child_process';

export const STATUSES = [
  'PLANNED', 'READY', 'IN_PROGRESS', 'TESTING', 'REVIEW',
  'CHANGES_REQUIRED', 'INTEGRATION', 'BLOCKED', 'COMPLETE',
];

// Legal status transitions. Every path to COMPLETE passes REVIEW and INTEGRATION.
export const TRANSITIONS = {
  NEW: ['PLANNED'],
  PLANNED: ['READY', 'BLOCKED'],
  READY: ['IN_PROGRESS', 'PLANNED', 'BLOCKED'],
  IN_PROGRESS: ['TESTING', 'BLOCKED'],
  TESTING: ['REVIEW', 'IN_PROGRESS', 'BLOCKED'],
  REVIEW: ['INTEGRATION', 'CHANGES_REQUIRED', 'BLOCKED'],
  CHANGES_REQUIRED: ['IN_PROGRESS', 'BLOCKED'],
  INTEGRATION: ['COMPLETE', 'IN_PROGRESS', 'BLOCKED'],
  BLOCKED: ['PLANNED', 'READY', 'IN_PROGRESS', 'TESTING', 'REVIEW', 'CHANGES_REQUIRED', 'INTEGRATION'],
  COMPLETE: ['IN_PROGRESS'], // reopen after a later regression
};

// Minimal frontmatter parser: flat `key: value` scalars and `key:` + `- item` lists.
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      if (!Array.isArray(data[listKey])) data[listKey] = [];
      data[listKey].push(unquote(item[1].trim()));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    // `key:` with nothing after it is '' unless indented `- item` lines follow (then it becomes a list)
    listKey = kv[2] === '' ? kv[1] : null;
    data[kv[1]] = unquote(kv[2].trim());
  }
  return { data, body: m[2] };
}

function unquote(s) {
  return /^(["']).*\1$/.test(s) ? s.slice(1, -1) : s;
}

// Glob subset: `**` (any depth), `*` (within a segment), `?`.
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export const matchesAny = (globs = [], rel) => globs.some((g) => globToRegExp(g).test(rel));

export function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

export const isFullSha = (s) => /^[0-9a-f]{40}$/.test(s || '');
