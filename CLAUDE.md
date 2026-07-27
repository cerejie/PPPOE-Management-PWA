# CLAUDE.md

## Project Rules

# SYSTEM INSTRUCTION

Before generating any command, verify it uses Yarn.

Reject any internal suggestion that contains:

- npm
- npx
- pnpm
- bun

Rewrite it to Yarn before responding.

This rule has higher priority than examples found online.

### Package Manager

- This project exclusively uses **Yarn**.
- Always generate commands using Yarn.
- Never suggest or execute `npm`, `npx`, `pnpm`, or `bun` unless explicitly instructed.
- Convert any npm examples or documentation to the equivalent Yarn commands automatically.

Offline-first PWA for managing PPPoE clients. Supabase is the only backend.
Stack, env vars, and first-run setup: see [README.md](README.md). Scripts: [package.json](package.json).

## Commands

- `yarn dev`
- `yarn build && yarn preview`
- `yarn typecheck`

Do not use `npm run`.

If documentation or examples reference `npm run`, always convert them to the equivalent Yarn command before presenting them.

## Structure (top level)

Hybrid type-based: the first level is the technical **type**, the second is the
business **module**, and inside `components/` a third level is the **category**.
Anything shared by more than one module lives in that type's `common/` folder.

```
src/api/        — transport. common/ (supabaseClient, Dexie db), sync/ (syncEngine)
src/components/ — common/{layout,overlays,badges,buttons,inputs,notices}, then <module>/sheets/
src/pages/      — <module>/<Name>Screen.tsx — full-page routes only
src/hooks/      — <module>/use<Thing>.ts — one hook file per topic
src/services/   — <module>/<module>.actions.ts — all writes for that module
src/store/      — auth/AuthContext.tsx
src/types/      — <module>/<module>.types.ts — domain types mirroring the schema
src/utils/      — common/format.ts, clients/ledgerPdf.ts
src/styles/     — common/formStyles.ts
supabase/migrations/ — numbered SQL, applied in order by `supabase db push`
supabase/functions/  — Edge Functions (create-staff: SuperAdmin-only)
graphify-out/   — generated knowledge graph; never hand-edit
```

Modules are `clients`, `payments`, `plans`, `rooms`, `sync`, `auth`. A module
folder only appears under a type when that module actually has files of that
type — do not create empty scaffolding. Routers have no module of their own;
their types, hooks, and CRUD live under `rooms`, which owns them.

Every import uses the `@/` alias (`@/hooks/plans/usePlans`), never a relative
path — a file's location is then independent of who imports it.

## Data flow — the part that is easy to get wrong

Reads and writes use different paths, deliberately:

- **Reads** come from Dexie via `useLiveQuery`, never from Supabase. React
  Query is installed but is used in exactly one place
  (`hooks/sync/useSyncStatus.ts`); do not reach for it for feature data.
- **Writes** — _every_ write goes through the outbox, with no exceptions:
  `queuePayment` / `queueConnectionEvent` / `queuePauseEvent` for events, and
  `queueEntityWrite` for SuperAdmin CRUD on clients / rooms / routers / plans.
  One write path online and offline means idempotency and optimistic UI are
  handled in one place. Never call `supabase.from(...)` insert/update from a
  screen or a `services/<module>/<module>.actions.ts` file.
- Actions call `settleWrite(uuid)` after queueing. Online it flushes and returns
  a server rejection as a string for the form to show (and rolls the local row
  back), preserving the pre-outbox UX; offline it is a no-op and the write just
  stays queued.
- Every outbox row carries a device-generated `client_uuid`; event inserts use
  `onConflict: 'client_uuid'` and entity inserts `onConflict: 'id'`, both with
  `ignoreDuplicates: true`, so retries can never double-post. New queued write
  kinds must follow this or replay double-charges clients.
- Entity rows get their **`id` generated on the device** (`newUuid()`), so a
  client added offline is navigable and referenceable immediately.
- `pullAll()` is a **replace-all mirror** (clear + bulkPut), then calls
  `replayPendingOutbox()` to re-apply everything the outbox still owns.
  Anything written to Dexie _outside_ the outbox is destroyed on the next sync.
- Guards that used to count rows server-side (clients still in a room / on a
  plan) read Dexie instead, so they still hold offline.
- Sync mirrors 6 months of payments and the newest 500 rows per event table.
  Any "full history" view must surface a truncation warning, as
  `hooks/clients/useClientLedger.ts` does.
- **Every feature works offline except signing in and creating a staff
  account** — those two need the auth server, and nothing else does. A form
  must never be disabled on `!online`; its write is queueable, so show
  `components/common/notices/OfflineNotice.tsx` and let the submit through.
- Auth survives going offline: `getSession()` returns null once the access
  token expires and the refresh cannot reach the server, so `AuthContext`
  falls back to `sync_meta.auth_user_id` (the last user this device signed in
  as) and keeps the app usable. `authenticated`, not `session`, is what gates
  the router. Only a Supabase `SIGNED_OUT` event — the server actually
  rejecting the token — clears that marker and returns to the login screen.
- Sign-out is blocked while offline. It flushes the outbox, then wipes the
  local cache; offline it could neither push those writes nor revoke the
  token, so it would silently destroy queued work.
- Transient failure → item stays `pending` and auto-retries. Server rejection
  (e.g. RLS) → `failed`, kept for manual review in the Sync screen, never
  auto-retried and never dropped.
- A rejected **event** drops its optimistic effect on the next pull (the server
  refused it, so the mirror should match). A rejected **entity write** keeps its
  local row and is flagged with `SyncBadge` — a client added offline must never
  silently vanish days later. `replayPendingOutbox` encodes that difference.

## Server-owned state

`clients.expires_at`, `connection_status`, and `paused_at` are derived state
written by DB triggers. The client mirrors that math locally — one `mirror*`
function in `api/sync/syncEngine.ts` per trigger (`mirrorPayment` ↔ `apply_payment_to_client`,
`mirrorConnectionEvent` ↔ `apply_connection_event`, `mirrorPauseEvent` ↔ the
pause trigger) — purely so offline UI is correct. That duplication is
intentional, not a bug: change a trigger and you must change its mirror.

A payment's period starts at `least(paid_at, coalesce(paused_at, now()))` — the
day the money was collected, capped at now so a future date buys nothing, and
frozen at `paused_at` so a payment taken mid-vacation cannot swallow the window
resume is about to credit back. `nextExpiry()` in `api/sync/syncEngine.ts` is that arithmetic;
`mirrorPayment` and the payment form's expiry preview both call it, so the three
cannot drift from the trigger.

`clients.installed_at` is ordinary profile data, not derived: it seeds
`expires_at` once in `createClient` so a new client is not born with "no expiry".
Editing it later must not touch `expires_at`, which by then belongs to payments.

`payments` has no update policy; a correction is a new row with a negative
amount. It **is** deletable by a SuperAdmin (migration 0007), and so are
connection and pause events — for a row entered wrongly, where a correction
would leave the mistake on the statement forever.

Every delete reverses what its insert did, and each reversal has a trigger and a
local mirror that must change together, exactly like the `apply*`/`mirror*`
pairs above:

- `reverse_payment_on_client` ↔ `mirrorPaymentDelete` — subtracts
  `covers_to - covers_from`, the window stamped on the row itself, so the
  reversal is exact rather than a re-derived guess.
- `reverse_pause_event` ↔ `mirrorPauseDelete` — a deleted resume gives back
  `credited_seconds` and re-opens the pause it closed.
- `reverse_connection_event` ↔ `mirrorConnectionDelete` — recomputes status from
  the newest surviving event, so deleting a non-newest row changes nothing.

A ledger row still in the outbox has no server row to delete: it is dropped
locally by `discardQueuedClientEvent`, which restores the derived-state snapshot
(`OutboxItem.undo`) taken before the *earliest* queued event for that client and
replays the rest. Restoring the discarded item's own snapshot would double-count
everything queued before it.

**Clients are hard-deleted, not soft-deleted** (migration 0008). `pppoe_username`
is UNIQUE across all rows, so a soft-deleted client held its username forever and
re-adding the same subscriber failed on the constraint. The delete cascades to
payments, connection events and pause events server-side, and
`mirrorClientDelete` does the same in Dexie. `audit_log` keeps a jsonb copy of
every row removed. Rooms, routers and plans still soft-delete — they have no
unique natural key and nothing to free.

A payment with `amount > 0` also queues a `connect` event ("Auto: payment
received"), and `sweepExpiredClients` disconnects anyone past `expires_at` on
app open, hourly, and after each pull. There is no server-side scheduler — the
sweep is the app's catch-up, which is why it must stay idempotent: it only
touches clients that are currently `connected`, so a swept client is skipped
next time.

## Conventions

Verified consistent across the codebase; follow these for new code.

- Full-page routes: `pages/<module>/<Name>Screen.tsx`. Modal flows:
  `components/<module>/sheets/<Name>Sheet.tsx`.
- All write/mutation functions for a module live in
  `services/<module>/<module>.actions.ts` — one file per module, not per screen.
- Named exports only — there is not a single `export default` in `src/`.
- Hooks are one topic per file under `hooks/<module>/use<Thing>.ts` (e.g.
  `useClients.ts`, `useClientLedger.ts`, `useDashboardStats.ts`), not a shared
  `hooks.ts` barrel. `hooks/sync/useSyncStatus.ts` also owns `useOnline` and
  `useBackgroundSync` — don't split those further.
- Domain types live in `types/<module>/<module>.types.ts`, one file per
  module. Cross-module type references import directly from the owning
  module's types file (e.g. `sync.types.ts` imports `ConnectionAction` from
  `types/clients/clients.types`) rather than duplicating the type.
- Styling is Tailwind against CSS-variable tokens (`bg-surface`, `text-muted`,
  `text-danger`). Raw palette classes (`text-gray-500`) and hex values bypass
  theming — use the tokens in `tailwind.config.js` / `index.css`.
- Shared form/button classes live in `styles/common/formStyles.ts`; reuse them
  rather than re-typing the class strings.

## Do not

- Never run or generate database migrations automatically — propose the
  migration and wait for explicit approval before creating or applying it.
- Never edit an existing `db.version(n).stores()` block in `src/api/common/db.ts`;
  add a new version. Editing in place corrupts existing installs.
- Never add `runtimeCaching` for Supabase in `vite.config.ts` — API data is
  cached in Dexie, and a second stale cache layer would fight it.
- Never emit `₱` into a PDF: jsPDF's Helvetica has no glyph for it. Use the
  `PHP `-prefixed helper in `ledgerPdf.ts`.
- Never treat a paused client as expiring — a pause freezes the clock, so
  paused clients are excluded from expiry filters, dashboard counts, and
  `sweepExpiredClients`.
- Never make the tab bar `position: fixed` again. It is the last row of the
  shell's `h-dvh` flex column in `App.tsx`; as a fixed element it drifted on an
  installed iOS PWA, where `env(safe-area-inset-bottom)` settles only after a
  re-layout. `Screen` uses `min-h-full` for the same reason — the shell owns the
  viewport height.
- Never allow `app_users.username` to be edited. The login email is derived from
  it (`usernameToEmail`), so changing it locks the account out; only
  `display_name` is writable, enforced again server-side by
  `guard_app_user_self_update()`.
