# Adapters — The Port Contract

**This file is what makes one project structure survive Supabase, ASP.NET, and
anything after them.** Read it before choosing or writing an adapter.

---

## The rule

> No file outside `src/api/adapters/` may import a backend SDK.

Not `@supabase/supabase-js`, not `axios` with a baked-in base URL, not a
generated OpenAPI client. Everything above `api/` talks to **ports**.

```text
src/api/
├── ports/                 # interfaces only. Zero implementation, zero SDK imports.
│   ├── auth.port.ts
│   ├── crud.port.ts
│   ├── query.port.ts
│   ├── realtime.port.ts
│   ├── files.port.ts
│   └── index.ts           # exports the Backend interface = the sum of the ports
├── adapters/
│   ├── supabase/          # ← the ONLY place @supabase/* appears
│   ├── dotnet/            # ← the ONLY place the REST client appears
│   └── <name>/
├── common/                # local db (Dexie), shared transport helpers
└── sync/                  # outbox/sync engine — depends on ports, never adapters
```

One module — `src/app/config/backend.ts` — picks the adapter and is the single
place any adapter is named:

```ts
import { supabaseAdapter } from '@/api/adapters/supabase';
export const backend: Backend = supabaseAdapter;
```

Swapping backends is editing that file plus writing one adapter folder. Nothing
in `services/`, `hooks/`, `components/`, or `pages/` changes.

---

## The ports

Keep them **capability-shaped**, not endpoint-shaped. An endpoint-shaped port
(`getClientsByRoomId`) leaks one backend's API design into every other adapter.

### `auth.port.ts`

```ts
export interface AuthPort {
  signIn(credentials: Credentials): Promise<Result<Session>>;
  signOut(): Promise<Result<void>>;
  getSession(): Promise<Session | null>;
  onAuthChange(cb: (e: AuthEvent, s: Session | null) => void): Unsubscribe;
}
```

### `crud.port.ts`

The workhorse. Entity name + payload in, `Result` out.

```ts
export interface CrudPort {
  insert<E extends EntityName>(e: E, rows: readonly Insert<E>[], opts?: WriteOpts): Promise<Result<Row<E>[]>>;
  update<E extends EntityName>(e: E, id: Uuid, patch: Update<E>, opts?: WriteOpts): Promise<Result<Row<E>>>;
  remove<E extends EntityName>(e: E, id: Uuid): Promise<Result<void>>;
}

export interface WriteOpts {
  /** Dedupe key. The adapter maps this to its own idempotency mechanism. */
  readonly idempotencyKey?: string;
  /** Optimistic concurrency. Adapter returns a Conflict result on mismatch. */
  readonly expectedVersion?: string;
}
```

`WriteOpts.idempotencyKey` is the important one — it is the seam that lets the
offline outbox work identically everywhere. See `profiles/offline-sync.md`.

### `query.port.ts`

```ts
export interface QueryPort {
  list<E extends EntityName>(e: E, q: Query<E>): Promise<Result<Page<Row<E>>>>;
  byId<E extends EntityName>(e: E, id: Uuid): Promise<Result<Row<E> | null>>;
}
```

`Query` is a small, declarative, backend-neutral shape: `filters`, `sort`,
`limit`, `cursor`. Do not let a backend's filter syntax (PostgREST operators, OData
`$filter`) escape the adapter.

### `realtime.port.ts` / `files.port.ts`

Optional. A backend without them supplies a **capability flag**, not a throwing
stub:

```ts
export interface Backend {
  readonly capabilities: { realtime: boolean; files: boolean; rls: boolean };
}
```

UI branches on the flag. Never on `backend instanceof SupabaseAdapter`.

---

## `Result`, not exceptions

Every port returns a discriminated union. This is what lets one sync engine handle
"retry later" vs "the server refused this" without knowing the backend.

```ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: BackendError };

export interface BackendError {
  /** The classification the sync engine branches on. */
  readonly kind: 'transient' | 'rejected' | 'conflict' | 'unauthorized' | 'notFound';
  readonly code: string;      // backend-specific, for logs
  readonly message: string;   // safe to display
  readonly fieldErrors?: Readonly<Record<string, string>>;
}
```

**Mapping raw backend failures onto `kind` is the adapter's single most important
job.** Get it wrong and offline sync either drops user work or retries a doomed
write forever:

- `transient` — network, timeout, 5xx, rate limit → **retry with backoff**
- `rejected` — validation, RLS/permission denial, business rule → **stop, surface to user**
- `conflict` — stale version → **surface, ask, or merge**
- `unauthorized` — token invalid → **re-auth**

---

## Schemas belong to the app, not the backend

`src/schemas/` is the source of truth. The adapter's job is to **parse into** those
schemas at the boundary and map outward on write. A backend that names a column
`created_dt` is the adapter's problem, not the domain's.

This is also where a backend without real types (a hand-rolled REST API) becomes
as safe as a generated one: the Zod parse at the adapter edge is the type.

---

## Writing a new adapter

1. Copy `adapters/_TEMPLATE.md` into `.claude/adapters/<name>.md`.
2. Answer: auth model · authorization enforcement point · idempotency mechanism ·
   concurrency mechanism · error→`kind` mapping · realtime? · files? · migrations?
3. Implement the ports in `src/api/adapters/<name>/`.
4. Run the port conformance suite (`kits/ignite/BOOTSTRAP.md` step 5) — it tests the
   adapter against the contract, especially the error mapping.
5. Point `src/app/config/backend.ts` at it.

An adapter that cannot express a port honestly must fail loudly at construction,
not silently no-op.

---

## What does *not* go behind a port

Migrations, RLS policies, edge functions, triggers, stored procedures. Those are
backend-native and live in the backend's own folder (`supabase/`, `Api/`,
`server/`). The adapter doc describes them; the port never abstracts them.
Pretending a trigger is portable is how the abstraction starts lying.
