# Adapter — ASP.NET Core REST

Load with `adapters/_ports.md`. Implements the ports in `src/api/adapters/dotnet/`.

```
capabilities: { realtime: false, files: true, rls: false }
```

Set `realtime: true` only when SignalR is actually wired up.

## Answers to the adapter questionnaire

| Question | ASP.NET Core |
|---|---|
| Auth model | JWT bearer, or cookie auth for same-site |
| Authorization enforced at | **the service layer** — `[Authorize]` policies + explicit record scoping |
| Idempotency | `Idempotency-Key` request header + a server-side dedupe table |
| Concurrency | `ETag` / `If-Match`, or a `RowVersion` in the payload |
| Migrations | EF Core migrations |
| Server logic | the service layer itself |

## The critical difference from Supabase

**There is no RLS.** The database will not save you. Every query must be scoped by
owner/tenant **in the query itself**:

```csharp
// WRONG — IDOR. Fetch then check is a race and an information leak.
var invoice = await db.Invoices.FindAsync(id);
if (invoice.TenantId != user.TenantId) return Forbid();

// RIGHT — ownership is part of the predicate.
var invoice = await db.Invoices
    .SingleOrDefaultAsync(i => i.Id == id && i.TenantId == user.TenantId);
if (invoice is null) return NotFound();
```

Returning `404` rather than `403` avoids confirming that the record exists.

Because the same rule is no longer duplicated in a policy, **the service layer is
the only line of defence** — `core/skills/backend.md` §Every endpoint checklist is
not optional here.

## Error mapping

```ts
400 + ModelState/ProblemDetails → 'rejected'  (+ fieldErrors from `errors`)
401 → 'unauthorized'
403 → 'rejected'
404 → 'notFound'
409 → 'conflict'
422 → 'rejected'
429 → 'transient'   // honour Retry-After
5xx / timeout / offline → 'transient'
```

Map RFC 7807 `ProblemDetails.errors` straight onto `BackendError.fieldErrors` so
forms can `setError` per field instead of showing one toast.

## Idempotency

The client already generates a `client_uuid` per queued write
(`profiles/offline-sync.md`). Send it as `Idempotency-Key`. The server stores
key → response for a retention window and **replays the stored response** on a
repeat, rather than re-executing. Without that table, offline replay double-posts.

## Response envelope

One envelope for the whole API, decided once and recorded in the ADR. The adapter
unwraps it so no envelope shape leaks past `api/`.

## Gotchas

- `System.Text.Json` camelCases by default; EF entities are PascalCase. Fix the
  mapping in the adapter, never by renaming domain fields.
- `DateTime` round-trips lossily. Use `DateTimeOffset`, serialize UTC ISO-8601.
- `decimal` → JSON number loses precision in JS. Send money as a string or integer
  minor units.
- Nullable reference types on the server do not imply optional in Zod — model them
  explicitly.
- CORS + credentialed requests need an explicit origin allowlist; `*` is rejected.
