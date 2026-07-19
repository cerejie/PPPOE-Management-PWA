# PPPoE Manager PWA

A mobile-first PWA for managing PPPoE internet clients: connection status,
expirations, payments, and connect/disconnect logging — with full offline
support (offline reads + offline payment entry with idempotent sync).

## Stack

- Vite + React + TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres, Auth, RLS) — no custom backend
- Dexie (IndexedDB) for the offline cache and outbox
- TanStack Query for background revalidation
- `vite-plugin-pwa` for the service worker and manifest

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | The anon/public API key (never the service role key) |
| `VITE_STAFF_EMAIL_DOMAIN` | Domain for synthetic staff emails (default `pppoe.local`) |

The Edge Function also needs a secret:

```sh
supabase secrets set STAFF_EMAIL_DOMAIN=pppoe.local
```

## Running the migrations

With the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project:

```sh
supabase db push          # applies supabase/migrations in order
```

Or paste the three files from `supabase/migrations/` into the SQL editor in
order: `0001_schema.sql`, `0002_functions_triggers.sql`, `0003_rls.sql`.

## Deploying the Edge Function

```sh
supabase functions deploy create-staff
```

## Creating the first SuperAdmin

1. In the Supabase dashboard → Authentication → Users → **Add user**, create a
   user with your real email address and a password. Copy the user's UUID.
2. In the SQL editor, insert the matching profile row:

```sql
insert into public.app_users (id, username, display_name, role, is_active)
values ('<auth-user-uuid>', 'admin', 'Your Name', 'superadmin', true);
```

3. Sign in to the app with that email + password. From **Settings** you can
   now create plans, rooms/routers, and staff accounts.

Staff sign in with just their **username** — the app maps it to
`username@pppoe.local` internally. Only the SuperAdmin uses a real email.

## Development

```sh
npm install
npm run dev        # dev server
npm run build      # typecheck + production build (generates the service worker)
npm run preview    # serve the production build (use this to test PWA/offline)
```

To test offline behaviour: `npm run build && npm run preview`, open in a
mobile browser, install to home screen, then toggle airplane mode. Payments
and connect/disconnect actions made offline are queued in the outbox
(header chip shows `N pending`) and sync automatically on reconnect.
Failed items appear in the Sync screen (tap the header chip) for review.

## Structure

```
supabase/
  migrations/           # schema, triggers + helper functions, RLS
  functions/create-staff/  # SuperAdmin-only staff account creation
src/
  lib/                  # supabase client, Dexie schema, sync engine, formatting
  features/
    auth/               # login, session/role context, settings
    clients/            # dashboard, list, detail, admin form
    payments/           # record-payment sheet + write actions
    rooms/              # rooms tab
    sync/               # status chip, sync queue screen, hooks
  components/           # Screen chrome, TabBar, badges
```

## Design notes / seams for later

- `clients.status_source` and `connection_events.executed_on_router` exist so
  a future router poller can be added without a migration. Nothing reads them
  yet beyond defaults.
- `payments` is append-only (enforced by RLS — no update/delete policies).
  Corrections are new rows with a negative amount.
- `clients.expires_at` is the single source of truth for expiry; a DB trigger
  extends it on each positive payment insert.
- Offline writes are idempotent via a device-generated `client_uuid` unique
  key with `onConflict: 'client_uuid', ignoreDuplicates: true`.
