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

## Deploying the Edge Functions

```sh
supabase functions deploy create-staff
supabase functions deploy mikrotik-sync
```

## MikroTik integration (optional)

Disconnecting a client in the app disables their `/ppp/secret` on the router and
drops any live session; connecting re-enables the secret. The push runs in the
`mikrotik-sync` Edge Function, never in the browser — a PWA cannot open a raw
TCP socket to the API service, and any `VITE_*` credential would be public.

It hangs off `connection_events`, so a disconnect made offline reaches the
router as soon as the device syncs. Skip this whole section and the app behaves
exactly as before.

### 1. Router side (RouterOS v6 — the binary API, since `/rest` is v7-only)

Create a dedicated user; do not reuse the admin account.

```
/user group add name=api-sync policy=api,read,write,test
/user add name=pppoe-app group=api-sync password=<strong-password>

# A CA to trust, and a server certificate signed by it. Two certs, not one:
# a trust anchor must be a CA, a server cert needs tls-server, and Deno's TLS
# stack will not accept one certificate playing both roles.
/certificate add name=api-ca common-name=api-ca days-valid=3650 \
  key-usage=key-cert-sign,crl-sign
/certificate sign api-ca

# common-name AND subject-alt-name must be the exact host the Edge Function
# dials. Deno (rustls) ignores common-name and matches only subject-alt-name,
# so omitting the SAN fails the handshake no matter what else is correct.
/certificate add name=api-cert common-name=<router-host> \
  subject-alt-name=DNS:<router-host> days-valid=3650 \
  key-usage=digital-signature,key-encipherment,tls-server
/certificate sign api-cert ca=api-ca

/ip service set api-ssl certificate=api-cert disabled=no port=8729
/ip service set api disabled=yes

/certificate export-certificate api-ca
```

Use `api-ssl`, not `api`: the plain service sends the password in clear over the
internet. Then make sure **8729** reaches the router, and download the exported
`cert_export_api-ca.crt` from **Files** — that PEM is `MIKROTIK_CA_CERT`. Export
with an **empty passphrase**, which exports only the public certificate; a
passphrase also exports the private key, which must never leave the router.

### 2. Connect from the app

Sign in as SuperAdmin and open **Settings → MikroTik router**. Enter the
address (`host` or `host:port`), the API username and password, and — under
**Show advanced** — paste the `api-ca` PEM if `api-ssl` uses a self-signed
certificate.

**Connect** verifies the credentials against the router before storing
anything, so a connection shown in Settings always means a session actually
succeeded. Credentials are held server-side in `public.router_settings`, which
has RLS enabled and **no policies** — only the Edge Function's service role can
read them, so the password never reaches a browser and is never mirrored into
Dexie.

Note this is not a per-device login like the MikroTik app: it connects the
system once, for every user. That is what lets a disconnect queued offline
still reach the router when the device next syncs.

Only `MIKROTIK_CRON_SECRET` has to be set by hand, for the scheduled sweep:

```sh
supabase secrets set MIKROTIK_CRON_SECRET="$(openssl rand -hex 32)"
```

The `MIKROTIK_HOST` / `PORT` / `TLS` / `USER` / `PASSWORD` / `CA_CERT` secrets
still work as a fallback for deployments configured before the Settings screen
existed. Stored settings win when both are present.

### 3. Verify

**Settings → MikroTik → Test connection** reports the router's identity and
firmware, or the precise reason it could not connect. A client's
`pppoe_username` must match the `/ppp/secret` name exactly; the function
refuses to act on a near-miss and reports `secret_not_found`.

If a push fails, the events stay `executed_on_router = false`, the client detail
screen shows a warning instead of silently claiming the line is cut, and the
next sync retries.

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
yarn install
yarn dev        # dev server
yarn build      # typecheck + production build (generates the service worker)
yarn preview    # serve the production build (use this to test PWA/offline)
```

To test offline behaviour: `yarn build && yarn preview`, open in a
mobile browser, install to home screen, then toggle airplane mode. Payments
and connect/disconnect actions made offline are queued in the outbox
(header chip shows `N pending`) and sync automatically on reconnect.
Failed items appear in the Sync screen (tap the header chip) for review.

## Structure

Hybrid type-based: top level is the technical type, second level is the
business module (`clients`, `payments`, `plans`, `rooms`, `sync`, `auth`).

```
supabase/
  migrations/           # schema, triggers + helper functions, RLS
  functions/create-staff/  # SuperAdmin-only staff account creation
src/
  api/                  # common/ (supabase client, Dexie schema), sync/ (sync engine)
  components/           # common/ (Screen, Sheet, TabBar, badges) + <module>/sheets/
  pages/                # <module>/<Name>Screen.tsx — dashboard, list, detail, forms
  hooks/                # <module>/use<Thing>.ts
  services/             # <module>/<module>.actions.ts — all writes for that module
  store/                # auth/AuthContext.tsx — session/role context
  types/                # <module>/<module>.types.ts
  utils/                # common/format.ts, clients/ledgerPdf.ts
  styles/               # common/formStyles.ts
```

See [CLAUDE.md](CLAUDE.md) for the full architecture and conventions.

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
