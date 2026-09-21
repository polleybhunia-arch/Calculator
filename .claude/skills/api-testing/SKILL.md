---
name: api-testing
description: How to design and run tests for HTTP/RPC APIs — contracts, status codes, schemas, auth, error shapes, idempotency. Use when a unit adds or changes an API endpoint. Not applicable to this repository today (no backend).
---

# API testing

Applicability: this project has no API. If a unit introduces one, the planner records a decision and adds this layer to `gates.json` (e.g. `tests/integration/api`).

## Checklist per endpoint
- **Contract**: method, path, request schema, response schema, status codes; validate response *shape*, not just 200.
- **Validation**: missing/extra/wrong-type/oversized fields → 4xx with a stable error shape; no stack traces in bodies.
- **AuthN/AuthZ**: unauthenticated → 401; authenticated but not permitted (other user's object) → 403/404; deny-by-default.
- **Idempotency & safety**: GET side-effect free; PUT/DELETE repeat-safe; POST duplicate handling.
- **State**: create→read→update→delete journeys persist and roll back correctly (pair with `database-testing`).
- **Non-functional**: pagination bounds, rate limiting, timeouts, large payloads.
- **Compatibility**: backward-compatible changes to existing responses are regression tests.

## Method
Start the service on an ephemeral port in the test (or use in-process handler), call with `fetch`, assert status + body + headers + side effects; fresh data per test; no dependence on external network. Record the seed/fixtures used.
