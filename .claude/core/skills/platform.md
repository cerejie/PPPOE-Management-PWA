# Skill — Platform (caching, offline, sync, PWA runtime)

Use when: data must survive a reload, a bad network, or two writers.
Design side of mobile/PWA lives in `skills/uiux.md`.

## Caching

Never add a cache without answering all five:

1. **What** is cached (exact key shape)?
2. **Why** — what cost does it remove?
3. **When** does it go stale?
4. **How** is it invalidated when the data changes *elsewhere*?
5. **What breaks** if it serves stale data?

Cannot answer #4 → do not cache.

Layers, cheapest first: request deduplication → in-memory query cache (TanStack Query) → persisted client cache → server cache → CDN. Use the shallowest layer that solves the problem.

- Query keys are structured and hierarchical so invalidation can be surgical: `['invoices','list',filters]`, `['invoices','detail',id]`.
- A mutation invalidates the narrowest set that could have changed. Blanket `invalidateQueries()` is a smell.
- Reference data (long-lived, rarely changed) gets a long `staleTime`; transactional data gets a short one. Do not use one global default for both.
- Persisted caches carry a **schema version**. On version mismatch, discard rather than migrate guesswork.

## Offline

Decide per surface: **read-only offline**, **queued writes**, or **online-only**. State the choice; do not let it emerge by accident.

- Read-only offline: cache last-known data, show it with a visible "last updated" and an offline indicator.
- Online-only surfaces block the action with a clear reason, never a silent failure.

## Sync (queued writes)

The contract: **the app never loses a user's work silently.**

- Each queued mutation is a durable record: client-generated id, entity, operation, payload, base version, attempt count, status, error.
- Client-generated UUIDs so an entity has identity before the server sees it.
- Replay in order per entity. Cross-entity ordering only where a dependency exists.
- Every mutation carries an **idempotency key** so a retry after an ambiguous failure cannot double-apply.
- Retry with exponential backoff and a cap. After the cap, the item moves to a **needs-attention** state that the user can see and act on — never a silent drop, never an infinite loop.
- **Conflicts:** send the base version; the server rejects a stale write with `409`. Default resolution is *server wins for reference data, user is asked for their own edits*. Last-write-wins is acceptable only for a field the user solely owns, and only when recorded as a decision.
- Sync status is visible when it matters: pending count, syncing, failed. Failed items are inspectable and retryable.

## PWA runtime

- Installable: manifest with name, icons (192/512, maskable), theme colour, standalone display, correct start URL.
- App shell precached. Runtime caching: static assets cache-first, API network-first with a cached fallback.
- **Never cache authenticated API responses in the service worker** unless the cache is partitioned per user and cleared on logout.
- A new service worker must not strand the user on a half-updated app — prompt to reload, then `skipWaiting`.
- Handle online/offline transitions: flush the queue on reconnect, refresh stale views, tell the user what happened.
- Deep links and refresh work on every route (SPA fallback configured).

## Storage

`localStorage` for small, non-sensitive, synchronous flags. IndexedDB for queues and cached datasets. **Never store tokens, PII, or secrets in `localStorage`.** Clear all user-scoped storage on logout.
