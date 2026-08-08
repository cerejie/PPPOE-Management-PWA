# Skill — Data (schemas, contracts, database)

Use when: defining a data shape, an API contract, a table, or a migration.

## Zod is the source of truth

One schema per boundary, in `schemas/<domain>/`. Types are derived:

```ts
export const invoiceSchema = z.object({ /* … */ });
export type Invoice = z.infer<typeof invoiceSchema>;
```

- **Parse at the edge, trust inside.** Everything crossing the network, `localStorage`, `postMessage`, or a file boundary is parsed once on arrival. After that, the type is real.
- Separate schemas for **input** (what a client may send) and **output** (what we return). They are not the same object — input omits server-owned fields, output omits secrets.
- `.strict()` on write inputs so unknown fields are rejected rather than silently dropped.
- Reuse primitives (`uuidSchema`, `moneySchema`, `phoneSchema`) instead of re-describing them.

## Database design

- **UUID primary keys.**
- Foreign keys wherever a relationship exists, with an explicit `ON DELETE` decision — never leave it to default.
- Normalise. Denormalise only with a measured reason recorded in the ADR.
- Every table: `id`, `created_at`, `updated_at`. Soft-deletable tables also get `deleted_at` and every query filters it.
- Money is integer minor units or `numeric` — never a float. Store currency alongside it.
- Timestamps are UTC with timezone. Formatting is a presentation concern.
- Enums as constrained values, not free text.
- Index what you filter, join, or sort on. Composite index column order follows query shape.
- Constraints in the database, not only in application code. The database is the last honest line of defence.

## Migrations

- Migrations only — never hand-edited production SQL.
- Forward-only and additive by default. **Never drop or rename a column unless explicitly instructed.**
- Expand → backfill → switch reads → (much later, explicitly) contract.
- Every migration must be safe to run against a live table: no long exclusive locks, no unindexed backfills of large tables.
- Production data is sacred. A destructive migration requires explicit instruction and a stated rollback plan.

## Row-level security (when the platform supports it)

RLS on by default for tenant-scoped tables. Policies express the same rule the service does — defence in depth, not a substitute for authorisation in code.

## Contract change rules

Adding an optional field is safe. Anything else — removing a field, tightening a type, changing a meaning — is breaking. Version or deprecate; never silently repurpose a field name.
