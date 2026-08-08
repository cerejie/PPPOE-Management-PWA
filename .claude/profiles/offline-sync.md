# Profile — Offline & Sync

Opt-in. Load with `core/skills/platform.md` and the active adapter.
Depends on the port contract in `adapters/_ports.md` — this engine talks to
`CrudPort`, never to an SDK, which is what makes it backend-portable.

**The contract: the app never loses a user's work silently.**

---

## 1. Reads and writes use different paths — deliberately

| | Path |
|---|---|
| **Reads** | local store (IndexedDB/Dexie) via a live query. **Never** the network directly. |
| **Writes** | **every** write goes through the outbox. No exceptions. |

One write path online and offline means idempotency, optimistic UI, and rollback
are solved in exactly one place. A screen or service that writes directly has
opted out of all three.

The reflex to resist: "this one write is simple, and we're online anyway."
That write is the one that corrupts state on a flaky connection.

---

## 2. The outbox row

```ts
interface OutboxItem {
  readonly id: string;          // device-generated, = the idempotency key
  readonly entity: EntityName;
  readonly op: 'insert' | 'update' | 'delete';
  readonly payload: unknown;
  readonly baseVersion?: string;
  status: 'pending' | 'failed';
  attempts: number;
  lastError?: BackendError;
  readonly undo: Snapshot;      // derived state before this write — see §5
  readonly queuedAt: string;
}
```

- **Entity ids are generated on the device.** A record created offline is
  navigable, linkable, and referenceable immediately — not after it syncs.
- `id` doubles as the idempotency key sent through `WriteOpts`. The adapter maps
  it to `onConflict` / `Idempotency-Key` / whatever the backend offers. **A new
  write kind that skips this will double-post on replay.**
- Replay is ordered **per entity**. Cross-entity ordering only where a real
  dependency exists.

---

## 3. Failure handling — the branch that matters

Classify with `BackendError.kind` (`adapters/_ports.md`), never with a string match
on the message:

| kind | Outcome |
|---|---|
| `transient` | stays `pending`, exponential backoff, auto-retry |
| `rejected` | → `failed`. **Never auto-retried, never dropped.** Visible and actionable. |
| `conflict` | → `failed` with the server's version attached for resolution |
| `unauthorized` | pause the queue, re-auth, resume |

A `rejected` item that auto-retries is an infinite loop. A `rejected` item that is
dropped is lost user work. Both are worse than a visible failure.

Sync status is surfaced whenever it is non-empty: pending count, syncing, failed.
Failed items are inspectable and individually retryable or discardable.

---

## 4. Pull is a replace-all mirror

`pull()` clears and re-writes the mirrored tables, then calls
`replayPendingOutbox()` to re-apply everything the outbox still owns.

> **Anything written to the local store outside the outbox is destroyed on the
> next pull.** This is the enforcement mechanism for §1, not an accident.

Mirror a bounded window (e.g. 6 months of transactions, newest N per event table).
Any "full history" view must surface a truncation warning rather than implying the
local slice is everything.

---

## 5. Optimistic state and rollback

When the backend derives state via triggers or server logic, the client mirrors
that math locally — one `mirror*` function per server rule — purely so offline UI
is correct. Record each pairing in `memory/conventions.md`; they must change
together.

Rollback differs by write kind, and the difference is not cosmetic:

- A rejected **event** drops its optimistic effect on the next pull. The server
  refused it, so the mirror should match the server.
- A rejected **entity write** *keeps* its local row, flagged with a sync badge. A
  record the user created offline must never silently vanish days later.

**Discarding a queued item restores the snapshot taken before the *earliest*
queued write for that entity, then replays the rest.** Restoring the discarded
item's own snapshot double-counts everything queued before it — a subtle,
data-corrupting bug that only appears with two or more queued writes.

---

## 6. Catch-up work

Where the backend has no scheduler, time-based transitions run client-side on app
open, on an interval, and after each pull. **Such a sweep must be idempotent** —
scope it to records not already in the target state, so a second run is a no-op.

---

## 7. Auth and offline

- Every feature works offline **except** the ones that genuinely need the auth
  server (sign-in, account creation). Nothing else may require the network.
- **Never disable a form on `!online`.** Its write is queueable — show an offline
  notice and let the submit through. A disabled form is the single most common
  violation of the contract at the top of this file.
- Sign-out is blocked while offline: it can neither flush queued writes nor revoke
  the token, so it would silently destroy work.
- Session survival: gate the router on a persisted "authenticated" marker rather
  than a live session object, and clear it only on a real server sign-out event.

---

## 8. Storage

IndexedDB for the queue and mirrored data. `localStorage` only for small
non-sensitive flags. **Never** tokens or PII. Clear all user-scoped storage on
sign-out.

**Never edit an existing schema version in place** — add a new version. Editing in
place corrupts every installed client. Persisted caches carry a schema version; on
mismatch, discard rather than guess a migration.
