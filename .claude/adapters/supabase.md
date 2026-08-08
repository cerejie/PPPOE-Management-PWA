# Adapter — Supabase

Load with `adapters/_ports.md`. Implements the ports in `src/api/adapters/supabase/`.

```
capabilities: { realtime: true, files: true, rls: true }
```

## Answers to the adapter questionnaire

| Question | Supabase |
|---|---|
| Auth model | GoTrue JWT, refresh-rotating, session in SDK storage |
| Authorization enforced at | **RLS in the database** — the last honest line |
| Idempotency | `upsert` with `onConflict` + `ignoreDuplicates: true` |
| Concurrency | `updated_at` precondition in `.eq()`, or a version column |
| Migrations | numbered SQL in `supabase/migrations/`, applied by `supabase db push` |
| Server logic | Postgres triggers + Edge Functions |

## Error mapping — the part that must be exact

```ts
// PostgrestError.code → BackendError.kind
'23505' → 'rejected'      // unique violation
'23503' → 'rejected'      // FK violation
'42501' → 'rejected'      // insufficient privilege = RLS refusal. NEVER transient.
'PGRST301' → 'unauthorized'
'PGRST116' → 'notFound'
network / fetch throw / 5xx → 'transient'
```

**`42501` classified as transient is the classic catastrophic bug** — an RLS-denied
write retries forever and never reaches the user.

## RLS

- On by default for every tenant- or user-scoped table. A table without a policy
  is inaccessible, which is the correct default.
- The policy expresses the *same* rule the service does. Defence in depth, not a
  substitute for checking in code.
- Policies are tested. An RLS bug is silent and total.
- `service_role` never reaches the client bundle. Privileged work goes in an Edge
  Function with its own authorization check.

## Triggers and derived state

Server-derived columns (status, expiry, balance) are written by triggers. When the
app must be correct offline, the client **mirrors that math locally** — one
`mirror*` function per trigger.

> Duplication here is intentional. **Change a trigger and you must change its
> mirror in the same commit.** Record the pairing in `memory/conventions.md`.

Every reversal needs the same treatment: a delete that undoes an insert has its
own trigger *and* its own mirror. Reverse using the values stamped on the deleted
row, never a re-derived guess.

## Reads vs writes

With `profiles/offline-sync.md` active, reads come from the local mirror and
**never** from Supabase directly; writes go through the outbox. Do not reach for
`supabase.from(...)` in a screen or service — that path is the adapter's alone.

## Env

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. Anything in a `VITE_` var
is public — the anon key is publishable by design, and RLS is what makes that safe.

## Gotchas

- `supabase-js` retries nothing. Backoff is the sync engine's job.
- Do **not** add service-worker `runtimeCaching` for Supabase when a local mirror
  exists — two caches fight and the stale one wins unpredictably.
- `getSession()` returns null once the access token expires and the refresh cannot
  reach the server. If the app must survive offline, gate the router on a persisted
  "last signed-in user" marker, and clear it only on a real `SIGNED_OUT` event.
- A unique natural key (username, slug) makes soft-delete a trap: the deleted row
  holds the key forever. Hard-delete with an audit copy, or drop the constraint.
