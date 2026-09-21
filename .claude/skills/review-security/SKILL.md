---
name: review-security
description: How to perform a security review of a change — trust boundaries, injection sinks, validation, secrets, dependencies, error leakage — for web front-end and backend code. Use when acting as security-reviewer or when a unit touches input handling, storage, network, auth, dependencies or DOM injection.
---

# Security review

Requirements baseline: CLAUDE.md §4 (Security). Output: `.agent/templates/review.md` (security findings with exploit scenario).

## Procedure
1. **Threat model the diff**: entry points (user input, URL, storage, network, postMessage), trust boundaries, assets, attacker capabilities.
2. **Trace input → sink** for every new/changed path. Read code; do not trust comments.
3. Apply the checklists; record what you examined even when you find nothing.
4. Verify security-sensitive behavior is *tested* (negative tests, hostile inputs).

## Front-end checklist
- DOM sinks with non-constant data: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` → must be `textContent`/safe APIs.
- Code execution: `eval`, `new Function`, string `setTimeout/setInterval`, dynamic `import()` of input.
- URLs: `location`/`href` from input, `javascript:` URLs, open redirects, `target=_blank` without `rel=noopener`.
- Third-party scripts/CDNs (need decision + SRI), new dependencies (typosquatting, install scripts, licenses).
- Storage: sensitive data in `localStorage`; untrusted parsing (`JSON.parse` errors handled).
- Robustness: `NaN`/`Infinity`/huge input, regex catastrophic backtracking, unbounded growth.

## Backend / data checklist (when present)
Injection (SQL/command/template), authn/authz on every route (deny by default, check object ownership), secrets in code/logs, SSRF, deserialization, path traversal, CSRF/CORS, rate limits, error/log leakage of internals, dependency vulnerabilities (`npm audit` if a lockfile exists).

## Findings
Each: severity, location, **exploit/impact scenario**, concrete fix, and the test that would guard it. Distinguish exploitable vs hardening. "No security surface" is a valid conclusion only with the list of what was examined.
