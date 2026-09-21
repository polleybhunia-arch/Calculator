---
name: change-analysis
description: How to inspect git state and diffs to establish exactly what changed, verify commit/branch/cleanliness, detect test modifications and estimate blast radius. Use before dispatching, reviewing, or completing a unit.
---

# Git / change analysis

Git conventions: CLAUDE.md §4. Evidence is bound to commit SHAs, so establishing the exact ref is step one.

## Commands
| Need | Command |
|---|---|
| Branch, cleanliness | `git status --short --branch` (tree must be clean outside `.agent/` for gates) |
| Exact head | `git rev-parse HEAD` (40-hex; compare with unit `head_ref`) |
| What changed | `git diff --stat <base>..<head>`; `git diff <base>..<head> -- <path>` |
| Commits in unit | `git log --oneline <base>..<head>` |
| Test modifications | `git diff --name-status --no-renames <base>..<head> -- tests` (`M`/`D` on old tests need a `test-change` decision) |
| Who touched a line | `git log -L`/`git blame` for intent when diagnosing |
| Last good state | `git log`, `git bisect` |

## Blast radius
For each changed symbol/element/id: `Grep` its usages; list dependent behaviors and the tests covering them; note contracts crossing files (e.g. DOM ids in `index.html` ↔ `script.js`; CSS classes ↔ markup).

## Checks
- Only files relevant to the unit changed (flag drive-by edits).
- No secrets, debug output, `.only/.skip`, commented-out tests, new dependencies.
- No commits after review approval (SHA must equal `reviewed_ref`).
- Branch is `agent/<ID>-…`, not `main`; nothing pushed.

## Output
Facts only: base, head, files changed by category (source/tests/docs/config), test files modified/deleted, blast-radius list, anomalies. No opinions in a handoff destined for the reviewer.
