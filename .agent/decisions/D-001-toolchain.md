---
kind: decision
id: D-001
status: accepted
decided_by: user (zero-dependency choice confirmed); details drafted by claude
---

# D-001 — Zero-dependency toolchain for gates

## Context
The repo has no `package.json`, tests, linter, type checker or build. README promises "no build step or dependencies" and `file://` usage. Node 24 is installed.

## Decision
- **Tests**: Node built-in `node:test` + `node:assert/strict`. Layers: `tests/unit`, `tests/integration`, `tests/regression`.
- **DOM-level tests** (integration): a minimal in-repo DOM stub (`tests/helpers/`) driving the unmodified `script.js` via `node:vm`, until/unless a DOM library is approved.
- **Lint gate**: `node --check` (syntax) only. Extend the command in `gates.json` as JS files are added.
- **Typecheck / Build**: `N/A` with reason (plain JS; no build step).
- **Module format**: classic script with dual browser/Node export (`globalThis`/`module.exports` guard), NOT ES modules — `<script type="module">` fails on `file://` in Chromium, which would break README "Option 1".

## Consequences / residual risk
- No real-browser verification (layout, CSS, real click events). Visual/interaction checks are `UNVERIFIED` until a browser test tool is approved (e.g. Playwright would add a dev dependency — a decision for the user).
- Weak static analysis (no ESLint). Reviewer must compensate.

## Status
`accepted` — zero-dependency approach confirmed by the user. Adding a dependency (jsdom, Playwright, ESLint) needs a new decision record and a `.agent/gates.json` edit by the user.
