---
name: database-testing
description: How to test persistence layers — schema/migrations, constraints, transactions, data integrity, query behavior and isolation. Use when a unit changes schema, queries or persisted state. Not applicable to this repository today (no database).
---

# Database testing

Applicability: this project has no database. If one is introduced, record a decision and add gates for migrations and data-layer tests.

## Checklist
- **Migrations**: apply to empty DB and to a populated snapshot; down-migration or documented irreversibility; idempotent re-run behavior.
- **Constraints**: NOT NULL/unique/FK/check enforced at the DB, with tests that violate each.
- **Transactions**: atomicity (failure mid-operation leaves no partial state), isolation assumptions, deadlock/retry handling.
- **Queries**: correct results on boundary data (empty, one, many, duplicates, NULLs, unicode); no N+1; expected index use (`EXPLAIN`).
- **Integrity**: referential consistency after the full user journey; cascade behavior deliberate.
- **Security**: parameterized queries only; least-privilege DB role; no secrets in fixtures.

## Method
Use an isolated database per test run (ephemeral instance or transaction rollback per test); deterministic seed data checked into `tests/helpers/`; never point tests at shared or production data; assert on persisted state, not only return values.
