# Standard — Backend (checkable rules)

The *how* lives in `skills/backend.md` and `skills/data.md`.

## Endpoints

- Every route: authenticated check, authorisation check scoped to the record, Zod validation, in that order, before any work.
- Write inputs use `.strict()`; unknown fields are rejected, not ignored.
- Every list endpoint paginates with a hard maximum page size.
- Every create/submit/charge accepts an idempotency key.
- Multi-write operations run in a transaction.
- Updates carry a version or `updated_at` precondition; stale writes return `409`.
- Response uses the project's single success/error envelope.
- Status codes: `400` malformed · `401` unauthenticated · `403` unauthorised · `404` absent or invisible · `409` conflict · `422` business rule violated · `429` rate limited.

## Business logic

- Rules live in `services/`. Handlers and repositories contain none.
- A rule exists in exactly one place. A second implementation is a defect.
- Side effects (email, webhook, push, export) fire after commit and are independently retryable.
- No business branching inside a query layer.

## Data

- UUID primary keys. FKs with an explicit `ON DELETE`. `created_at`/`updated_at` on every table. UTC timestamps.
- Money as integer minor units or `numeric`, never float, always with currency.
- No `SELECT *` in application queries.
- No query inside a loop.
- Indexes exist for every column filtered, joined, or sorted on in a hot path.
- Constraints enforced in the database, not only in code.
- Migrations only. Additive by default. **No column drops or renames without explicit instruction.**
- Tenant-scoped tables have RLS enabled where the platform supports it.

## Errors and logging

- No exception swallowed. No empty `catch`.
- Client-facing messages carry no stack trace, SQL, internal id, or provider text.
- Every error log carries a correlation id and the actor.
- No credential, token, full card/ID number, or unnecessary PII in logs.

## Security

- No string-concatenated SQL.
- No secret in source, config committed to git, or client bundle.
- Rate limits on auth, reset, OTP, search, and export endpoints.
- Uploads validated by content type and size; stored outside the web root.

## Audit

Money, permission, and identity changes write an append-only audit row: actor, action, timestamp, before, after.
