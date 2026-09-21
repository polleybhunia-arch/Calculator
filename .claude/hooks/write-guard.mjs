#!/usr/bin/env node
// PreToolUse hook (Write|Edit|MultiEdit|NotebookEdit): enforces the write-ownership
// matrix in .agent/write-policy.json so role separation does not rely on prompts alone.
// Exit 2 = block (stderr is shown to the agent). No agent_type = human session = allow.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchesAny } from '../../.agent/tools/lib.mjs';

export function decide(policy, role, relPath) {
  if (!role) return { allow: true, reason: 'no agent role (human session)' };
  if (relPath.startsWith('../') || isAbsolute(relPath)) {
    return { allow: false, reason: `path escapes the project root: ${relPath}` };
  }
  if (matchesAny(policy.always_deny, relPath)) {
    return { allow: false, reason: `${relPath} is governance/evidence and not writable by agents` };
  }
  const rule = policy.roles?.[role];
  if (!rule) return { allow: true, reason: `agent type '${role}' has no write policy` };
  if (matchesAny(rule.deny, relPath)) {
    return { allow: false, reason: `role '${role}' must not write ${relPath}` };
  }
  if (matchesAny(rule.allow, relPath)) return { allow: true, reason: 'allowed by role policy' };
  return { allow: false, reason: `role '${role}' may only write: ${(rule.allow || []).join(', ') || '(nothing)'}` };
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.exit(0); // unreadable hook input: never wedge the session
  }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const policyPath = join(root, '.agent', 'write-policy.json');
  if (!existsSync(policyPath)) process.exit(0);
  const target = input.tool_input?.file_path || input.tool_input?.notebook_path;
  if (!target) process.exit(0);
  const rel = relative(root, resolve(root, target)).split('\\').join('/');
  const verdict = decide(JSON.parse(readFileSync(policyPath, 'utf8')), input.agent_type, rel);
  if (!verdict.allow) {
    process.stderr.write(`WRITE-GUARD BLOCKED: ${verdict.reason}. See .agent/write-policy.json and CLAUDE.md.\n`);
    process.exit(2);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
