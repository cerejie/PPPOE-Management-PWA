-- =============================================================================
-- 0009_pppoe_accounts.sql
--
-- Turns the PPPoE username from a free-text column on `clients` into a first
-- class row that mirrors one `/ppp/secret` on the MikroTik.
--
-- Why: the router owns the secret list. Typing a username into the client form
-- created a line that may not exist, with a password the app never knew, and no
-- way to see the secrets already on the box. `pppoe_accounts` is that list,
-- mirrored both ways by the mikrotik-sync Edge Function.
--
-- clients.pppoe_username survives as a trigger-maintained mirror of the
-- assigned account's name, so search, the ledger PDF and the router sweep keep
-- resolving a client to a line without a join.
--
-- Additive apart from two loosened constraints on clients.pppoe_username
-- (documented in §4) and a replaced guard function (§6). No column is dropped
-- and no row is deleted.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. pppoe_accounts  — one /ppp/secret
-- -----------------------------------------------------------------------------
create table public.pppoe_accounts (
  id                uuid primary key default gen_random_uuid(),

  -- Lower-cased by the app before it ever gets here: RouterOS secret names are
  -- case-sensitive and a stray capital is a dead line hours later.
  name              text not null check (name = lower(name)),
  -- Plaintext, because plaintext is the only form RouterOS accepts.
  password          text not null default '',
  -- Not an enum: RouterOS accepts any/async/l2tp/ovpn/pppoe/pptp/sstp and adds
  -- more between releases. The app only ever offers PPPOE_SERVICE_OPTIONS.
  service           text not null default 'pppoe',
  comment           text,

  -- Desired line state. An assigned account follows its client's
  -- connection_status instead; see accounts.ts desiredStateFor().
  disabled          boolean not null default false,

  -- RouterOS's internal id ("*1A"), cached so an update needs no re-print.
  router_secret_id  text,
  present_on_router boolean not null default false,
  last_seen_at      timestamptz,

  -- False means the router has not been told about this row yet. Clearing it is
  -- what queues an account for the next sweep — the same contract
  -- connection_events.executed_on_router has.
  synced_to_router  boolean not null default false,
  router_error      text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Soft delete carries the "remove this secret" instruction to the router; the
  -- Edge Function hard-deletes the row once the secret is actually gone.
  deleted_at        timestamptz
);

-- Unique among live rows only, so a deleted account frees its name for reuse.
create unique index idx_pppoe_accounts_name_live
  on public.pppoe_accounts (name)
  where deleted_at is null;

-- The sweep's two work queries.
create index idx_pppoe_accounts_unsynced
  on public.pppoe_accounts (synced_to_router)
  where deleted_at is null;

create index idx_pppoe_accounts_deleted
  on public.pppoe_accounts (deleted_at)
  where deleted_at is not null;

create trigger trg_pppoe_accounts_updated
  before update on public.pppoe_accounts
  for each row execute function public.set_updated_at();

comment on table public.pppoe_accounts is
  'Mirror of the router''s /ppp/secret list. The router owns it; rows created here are pushed by mikrotik-sync.';

-- -----------------------------------------------------------------------------
-- 2. pppoe_profiles  — one /ppp/profile, read-only
--
-- The router owns these entirely; the app never creates one. A plan points at
-- one BY NAME (§3) rather than by id, because the name is what RouterOS wants
-- on the secret and what survives the profile table being re-imported.
-- -----------------------------------------------------------------------------
create table public.pppoe_profiles (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  -- RouterOS's opaque "rx/tx" string, e.g. "10M/10M". Displayed, never parsed.
  rate_limit     text,
  local_address  text,
  remote_address text,
  last_seen_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_pppoe_profiles_updated
  before update on public.pppoe_profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. plans.profile  — the actual bandwidth limit
--
-- plans.mbps stays what it was: an advertised number for display. `profile` is
-- the RouterOS profile asserted on the secret of every client on this plan.
-- Null leaves the router's own default in place.
-- -----------------------------------------------------------------------------
alter table public.plans add column if not exists profile text;

-- -----------------------------------------------------------------------------
-- 4. clients.pppoe_account_id  — the assignment
--
-- 1:1. UNIQUE, so a line cannot be on two subscribers; ON DELETE SET NULL is a
-- backstop only, since deletePppoeAccount() refuses while a client is on it.
-- -----------------------------------------------------------------------------
alter table public.clients
  add column if not exists pppoe_account_id uuid
    unique references public.pppoe_accounts (id) on delete set null;

-- pppoe_username becomes derived (see §7), so the two constraints that made it
-- a user-entered natural key have to go:
--   * NOT NULL — a client can now exist with no line assigned, which is the
--     normal state between "added" and "given an account".
--   * UNIQUE   — uniqueness now belongs to pppoe_accounts.name. Leaving it here
--     would let a rename fail *inside a trigger*, aborting an unrelated write.
alter table public.clients alter column pppoe_username drop not null;
alter table public.clients drop constraint if exists clients_pppoe_username_key;

create index if not exists idx_clients_pppoe_username on public.clients (pppoe_username);

-- -----------------------------------------------------------------------------
-- 5. Backfill — every existing client keeps its line
--
-- One account per distinct existing username, linked to its client.
--
-- synced_to_router = true is deliberate and load-bearing. The password is
-- genuinely unknown here (it only ever lived on the router), and a row left
-- unsynced would be PUSHED to the MikroTik with a blank password on the next
-- sweep, breaking a working line. Marking it synced means the reconciler leaves
-- it alone; the operator then runs Import on the PPPoE screen, which overwrites
-- password/service/disabled from the router — see mirrorSecrets() in
-- accounts.ts, which only overwrites rows already flagged synced.
--
-- present_on_router = false until that import confirms the secret exists.
-- -----------------------------------------------------------------------------
-- `distinct on` collapses the case where two clients share a username: one
-- account is made, and the link step below gives it to the oldest client only.
insert into public.pppoe_accounts (name, password, service, comment, disabled, synced_to_router, present_on_router)
select distinct on (lower(c.pppoe_username))
  lower(c.pppoe_username),
  '',
  'pppoe',
  'Imported from client record on migration 0009',
  c.connection_status = 'disconnected',
  true,
  false
from public.clients c
where c.deleted_at is null
  and c.pppoe_username is not null
  and btrim(c.pppoe_username) <> ''
order by lower(c.pppoe_username), c.created_at asc;

-- Link each client to its account. The correlated subquery is what handles two
-- clients sharing a username: the oldest keeps the line, the rest are left
-- unassigned for an operator to sort out rather than silently overwritten.
--
-- pppoe_username is set explicitly because §7's trigger does not exist yet.
-- Keep this section before §7 — reordering them would leave the mirror stale.
--
-- The staff guard has to come off for the duration. It refuses any change to
-- pppoe_username unless is_superadmin(), and a migration has no auth.uid() to
-- be a superadmin with — SECURITY DEFINER does not supply one. Disabling the
-- trigger is the honest way to say "this write is the migration's, not a
-- user's"; the transaction wrapping the migration puts it back even if the
-- backfill fails.
alter table public.clients disable trigger trg_guard_client_staff_update;

update public.clients c
set pppoe_account_id = a.id,
    pppoe_username   = a.name
from public.pppoe_accounts a
where a.name = lower(c.pppoe_username)
  and c.deleted_at is null
  and c.id = (
    select c2.id from public.clients c2
    where lower(c2.pppoe_username) = a.name and c2.deleted_at is null
    order by c2.created_at asc
    limit 1
  );

alter table public.clients enable trigger trg_guard_client_staff_update;

-- -----------------------------------------------------------------------------
-- 6. Staff guard — pppoe_account_id is a SuperAdmin column
--
-- The guard names the columns staff may NOT change, so a column it does not
-- mention is implicitly writable by them. Adding pppoe_account_id without this
-- would let any staff account move a subscriber onto another line — assignment
-- is a SuperAdmin operation, and the PPPoE screen already gates it that way
-- client-side (usePppoeAccountsPage: canEdit = isSuperAdmin).
--
-- Restated in full from 0006 rather than patched: `create or replace` has no
-- other form, and a partial copy would silently drop the paused_at rule.
-- -----------------------------------------------------------------------------
create or replace function public.guard_client_staff_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_pause boolean := coalesce(current_setting('app.trusted_expiry_write', true), '0') = '1';
begin
  if public.is_superadmin() then
    return new;
  end if;

  if new.full_name                   is distinct from old.full_name
     or new.pppoe_account_id         is distinct from old.pppoe_account_id
     or new.pppoe_username           is distinct from old.pppoe_username
     or new.room_id                  is distinct from old.room_id
     or new.router_id                is distinct from old.router_id
     or new.plan_id                  is distinct from old.plan_id
     or new.monthly_fee              is distinct from old.monthly_fee
     or new.account_status           is distinct from old.account_status
     or new.status_source            is distinct from old.status_source
     or new.installed_at             is distinct from old.installed_at
     or new.notes                    is distinct from old.notes
     or new.deleted_at               is distinct from old.deleted_at
     or new.id                       is distinct from old.id
     or new.created_at               is distinct from old.created_at
  then
    raise exception 'staff may only change connection_status';
  end if;

  -- expires_at / paused_at: writable by staff only through apply_pause_event().
  if not v_from_pause
     and (new.expires_at is distinct from old.expires_at
          or new.paused_at is distinct from old.paused_at)
  then
    raise exception 'staff may only change expires_at via a pause event';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Triggers keeping clients.pppoe_username a true mirror
--
-- Both are the server half of a pair whose client half lives in
-- services/pppoe/Pppoe.service.ts, exactly like the apply*/mirror* pairs in
-- 0002. Change one and you must change the other.
-- -----------------------------------------------------------------------------
create or replace function public.set_client_pppoe_username()
returns trigger
language plpgsql
as $$
begin
  if new.pppoe_account_id is null then
    new.pppoe_username := null;
  else
    select a.name into new.pppoe_username
    from public.pppoe_accounts a
    where a.id = new.pppoe_account_id;
  end if;
  return new;
end;
$$;

create trigger trg_clients_pppoe_username
  before insert or update of pppoe_account_id on public.clients
  for each row execute function public.set_client_pppoe_username();

create or replace function public.rename_client_pppoe_username()
returns trigger
language plpgsql
as $$
begin
  update public.clients
  set pppoe_username = new.name
  where pppoe_account_id = new.id
    and pppoe_username is distinct from new.name;
  return new;
end;
$$;

create trigger trg_pppoe_accounts_rename
  after update of name on public.pppoe_accounts
  for each row
  when (old.name is distinct from new.name)
  execute function public.rename_client_pppoe_username();

-- -----------------------------------------------------------------------------
-- 8. RLS — same shape as rooms / routers / plans
--
-- Reads for any active user (the PPPoE screen is readable by staff, editable
-- by SuperAdmin, and the list must mirror into Dexie for offline).
-- Writes SuperAdmin only. No DELETE policy anywhere: the only hard deletes are
-- the Edge Function's, which runs as the service role and bypasses RLS.
--
-- pppoe_accounts.password is readable by any signed-in user. That is a real and
-- accepted exposure, unlike router_settings.password (§0007): a PPPoE secret is
-- a per-subscriber credential the operator hands out anyway, it must reach the
-- device to be shown and edited offline, and the app already masks it behind
-- PasswordField. The ROUTER's admin password remains service-role only.
-- -----------------------------------------------------------------------------
alter table public.pppoe_accounts enable row level security;
alter table public.pppoe_profiles enable row level security;

create policy pppoe_accounts_select_active on public.pppoe_accounts
  for select to authenticated
  using (public.is_active_user());

create policy pppoe_accounts_insert_superadmin on public.pppoe_accounts
  for insert to authenticated
  with check (public.is_superadmin());

create policy pppoe_accounts_update_superadmin on public.pppoe_accounts
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Profiles are router-owned: readable by everyone active, written only by the
-- import running as the service role.
create policy pppoe_profiles_select_active on public.pppoe_profiles
  for select to authenticated
  using (public.is_active_user());
