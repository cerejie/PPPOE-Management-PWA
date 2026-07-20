# CLAUDE.md

Offline-first PWA for managing PPPoE clients. Supabase is the only backend.
Stack, env vars, and first-run setup: see [README.md](README.md). Scripts: [package.json](package.json).

## Commands

- `npm run dev` — Vite dev server. The service worker is **disabled** in dev
  (`devOptions.enabled: false`), so offline behaviour cannot be tested here.
- `npm run build && npm run preview` — the only way to exercise PWA/offline.
- `npm run typecheck` — use this to verify changes.
- `npm run lint` — **broken**: eslint is neither installed nor configured.
  Do not run it or trust its absence of output as a pass.
- No test runner is installed. There are no tests; don't invent a `npm test`.

## Structure (top level)

```
src/lib/        — supabase client, Dexie schema, sync engine, shared formatters
src/features/   — one folder per domain; screens + its actions.ts colocated
src/components/ — cross-feature chrome only (Screen, Sheet, TabBar, badges)
supabase/migrations/ — numbered SQL, applied in order by `supabase db push`
supabase/functions/  — Edge Functions (create-staff: SuperAdmin-only)
graphify-out/   — generated knowledge graph; never hand-edit
```

## Data flow — the part that is easy to get wrong

Reads and writes use different paths, deliberately:

- **Reads** come from Dexie via `useLiveQuery`, never from Supabase. React
  Query is installed but is used in exactly one place (`useSyncStatus.ts`);
  do not reach for it for feature data.
- **Writes** always go through the outbox (`queuePayment` /
  `queueConnectionEvent` / `queuePauseEvent`), then `flushOutbox()` if
  `navigator.onLine`. One write path online and offline means idempotency and
  optimistic UI are handled in one place. Never call `supabase.from(...)`
  insert/update from a screen.
- Every outbox row carries a device-generated `client_uuid`; the server insert
  uses `onConflict: 'client_uuid', ignoreDuplicates: true`, so retries can
  never double-post. New queued write kinds must follow this or replay
  double-charges clients.
- `pullAll()` is a **replace-all mirror** (clear + bulkPut). Anything written
  only to Dexie and not queued to the outbox is destroyed on the next sync.
- Sync mirrors 6 months of payments and the newest 500 rows per event table.
  Any "full history" view must surface a truncation warning, as `ledger.ts` does.
- Transient failure → item stays `pending` and auto-retries. Server rejection
  (e.g. RLS) → `failed`, kept for manual review in the Sync screen, never
  auto-retried and never dropped.

## Server-owned state

`clients.expires_at`, `connection_status`, and `paused_at` are derived state
written by DB triggers. The client mirrors that math locally (see
`queuePauseEvent`) purely so offline UI is correct — that duplication is
intentional, not a bug. Keep the two in sync when either side changes.

`payments` has no update/delete RLS policy by design; a correction is a new row
with a negative amount.

## Conventions

Verified consistent across the codebase; follow these for new code.

- Full-page routes: `<Name>Screen.tsx`. Modal flows: `<Name>Sheet.tsx`.
- All write/mutation functions for a feature live in that feature's `actions.ts`.
- Named exports only — there is not a single `export default` in `src/`.
- Feature hooks go in the feature's `hooks.ts` (or a topic file like
  `ledger.ts`), not one file per hook. `sync/useSyncStatus.ts` is the lone
  exception; don't copy it.
- Styling is Tailwind against CSS-variable tokens (`bg-surface`, `text-muted`,
  `text-danger`). Raw palette classes (`text-gray-500`) and hex values bypass
  theming — use the tokens in `tailwind.config.js` / `index.css`.
- Shared form/button classes live in `components/formStyles.ts`; reuse them
  rather than re-typing the class strings.

## Do not

- Never run or generate database migrations automatically — propose the
  migration and wait for explicit approval before creating or applying it.
- Never edit an existing `db.version(n).stores()` block in `src/lib/db.ts`;
  add a new version. Editing in place corrupts existing installs.
- Never add `runtimeCaching` for Supabase in `vite.config.ts` — API data is
  cached in Dexie, and a second stale cache layer would fight it.
- Never emit `₱` into a PDF: jsPDF's Helvetica has no glyph for it. Use the
  `PHP `-prefixed helper in `ledgerPdf.ts`.
- Never treat a paused client as expiring — a pause freezes the clock, so
  paused clients are excluded from expiry filters and dashboard counts.
