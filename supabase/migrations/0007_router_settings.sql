-- =============================================================================
-- 0007_router_settings.sql
-- Stores the MikroTik API connection entered in Settings -> MikroTik router.
--
-- The browser cannot reach the router: it has no raw TCP socket, and any
-- credential shipped to it would be public. So the credentials live here and
-- only the mikrotik-sync Edge Function ever uses them. This is also why they
-- are never mirrored into Dexie like the rest of the app's reads — IndexedDB
-- is readable by anyone holding the device.
--
-- Additive only. Nothing existing is touched; the integration is optional and
-- the app behaves exactly as before while this table is empty.
-- =============================================================================

create table if not exists public.router_settings (
  -- Singleton: `check (id)` allows only true, so there can never be a second
  -- row and the Edge Function can upsert on a fixed key.
  id         boolean primary key default true check (id),

  host       text not null,
  port       integer not null default 8729 check (port between 1 and 65535),
  tls        boolean not null default true,
  username   text not null,
  password   text not null,
  -- PEM of the router's CA. Required for api-ssl with a self-signed
  -- certificate, which is the normal case for RouterOS.
  ca_cert    text,

  -- Captured at the last successful connection, so Settings can show which
  -- router answered without opening a session just to render the screen.
  identity   text,
  version    text,
  board      text,
  last_ok_at timestamptz,
  last_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.app_users (id) on delete set null
);

comment on table public.router_settings is
  'MikroTik API connection used by the mikrotik-sync Edge Function. Service-role only; see the RLS note below.';

comment on column public.router_settings.password is
  'RouterOS API password. Reachable only by the service role — no RLS policy grants any client access to this table.';

-- -----------------------------------------------------------------------------
-- RLS: enabled with NO policies, deliberately.
--
-- With RLS on and no policy, every role that respects RLS (anon, authenticated)
-- is denied outright, while the service role bypasses it. That is exactly the
-- boundary we want: the password cannot be selected by any signed-in user, not
-- even a SuperAdmin, and the app reads connection status through the Edge
-- Function's `status` action rather than PostgREST.
--
-- Do not add a policy here to "let the admin screen read it" — that would put
-- the router password one API call away from the browser.
-- -----------------------------------------------------------------------------
alter table public.router_settings enable row level security;

-- Paired with `create table if not exists` above, so re-running the file is safe.
drop trigger if exists trg_router_settings_updated on public.router_settings;

create trigger trg_router_settings_updated
  before update on public.router_settings
  for each row execute function public.set_updated_at();
