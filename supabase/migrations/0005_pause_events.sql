-- =============================================================================
-- 0005_pause_events.sql
-- Vacation pause: a client leaving the room can freeze their remaining
-- subscription time and reclaim it on return.
--
-- Modelled exactly like connection_events: an append-only event table with a
-- device-generated client_uuid, so the offline outbox only ever INSERTs and a
-- retry can never double-credit. `clients.paused_at` is derived state written
-- by the trigger, never by the client app.
-- =============================================================================

create type pause_action as enum ('pause', 'resume');

-- -----------------------------------------------------------------------------
-- clients.paused_at — non-null while a pause is open. expires_at is deliberately
-- left untouched during the pause; the resume credits the elapsed time back.
-- That keeps expires_at meaning "paid through" at all times.
-- -----------------------------------------------------------------------------
alter table public.clients
  add column paused_at timestamptz;

create index idx_clients_paused_at on public.clients (paused_at);

-- -----------------------------------------------------------------------------
-- pause_events  (append-only; client_uuid gives idempotent sync)
-- credited_seconds is stamped by the trigger on 'resume' rows so the ledger and
-- the exported statement can show exactly how much time was given back.
-- -----------------------------------------------------------------------------
create table public.pause_events (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  action           pause_action not null,
  performed_by     uuid references public.app_users (id) on delete set null,
  performed_at     timestamptz not null default now(),
  note             text,
  client_uuid      uuid not null unique,   -- device-generated idempotency key
  credited_seconds bigint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_pause_events_client_id    on public.pause_events (client_id);
create index idx_pause_events_performed_at on public.pause_events (performed_at);

create trigger trg_pause_events_updated
  before update on public.pause_events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- pause_events -> clients.paused_at / expires_at
--
-- 'pause'  : opens the window (no-op if one is already open).
-- 'resume' : closes it and pushes expires_at forward by the paused duration,
--            so the client keeps every day they had paid for.
--
-- Both directions are no-ops when the client is already in the target state,
-- which makes a duplicate delivery harmless on top of the client_uuid guard.
-- -----------------------------------------------------------------------------
create or replace function public.apply_pause_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paused_at  timestamptz;
  v_expires_at timestamptz;
  v_credit     bigint := 0;
begin
  select paused_at, expires_at
    into v_paused_at, v_expires_at
    from public.clients
   where id = new.client_id
   for update;

  -- Let the staff-update guard know this expiry change comes from a trusted
  -- trigger, not from a user editing the client directly. Transaction-local
  -- (third arg = true), so it cannot leak into another statement.
  perform set_config('app.trusted_expiry_write', '1', true);

  if new.action = 'pause' then
    if v_paused_at is null then
      update public.clients
         set paused_at = new.performed_at
       where id = new.client_id;
    end if;

  else
    if v_paused_at is not null then
      -- A client with no expiry has no subscription time to give back, so the
      -- row must not claim a credit the statement would then report.
      if v_expires_at is not null then
        -- Never credit negative time if clocks disagree across devices.
        v_credit := greatest(
          0,
          floor(extract(epoch from (new.performed_at - v_paused_at)))::bigint
        );
      end if;

      update public.clients
         set paused_at  = null,
             expires_at = case
                            when v_expires_at is null then null
                            else v_expires_at + make_interval(secs => v_credit)
                          end
       where id = new.client_id;
    end if;
  end if;

  perform set_config('app.trusted_expiry_write', '0', true);

  new.credited_seconds := v_credit;
  return new;
end;
$$;

-- BEFORE INSERT so we can stamp credited_seconds onto the row.
create trigger trg_pause_events_apply
  before insert on public.pause_events
  for each row execute function public.apply_pause_event();

-- -----------------------------------------------------------------------------
-- Staff guard.
--
-- Staff may now pause/resume, so the pause trigger must be able to move
-- expires_at / paused_at on their behalf. Direct staff edits to those columns
-- stay blocked — only the SECURITY DEFINER triggers may do it, signalled by the
-- transaction-local app.trusted_expiry_write flag.
--
-- This also repairs a pre-existing conflict. 0003 lets any active user INSERT a
-- payment, but listed expires_at among the columns staff may not change. Since
-- SECURITY DEFINER does not change auth.uid(), is_superadmin() is still false
-- inside apply_payment_to_client(), so a staff member recording a payment hit
-- 'staff may only change connection_status' and the insert rolled back. Gating
-- expires_at on the trusted-write flag rather than the caller's role fixes that
-- while keeping direct edits locked down.
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
     or new.pppoe_username           is distinct from old.pppoe_username
     or new.room_id                  is distinct from old.room_id
     or new.router_id                is distinct from old.router_id
     or new.plan_id                  is distinct from old.plan_id
     or new.monthly_fee              is distinct from old.monthly_fee
     or new.account_status           is distinct from old.account_status
     or new.status_source            is distinct from old.status_source
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
-- Payment extension must respect an open pause.
--
-- The original version extended from greatest(expires_at, now()). While a pause
-- is open the wall clock keeps moving but the subscription does not, so once
-- expires_at falls behind now() a payment would extend from now() — quietly
-- swallowing part of the paused window that resume is about to credit again,
-- double-counting it. Freezing the reference at paused_at makes a payment taken
-- mid-vacation land on exactly the same expiry as one taken the day they left.
-- -----------------------------------------------------------------------------
create or replace function public.apply_payment_to_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_days integer;
  v_expires_at    timestamptz;
  v_paused_at     timestamptz;
  v_clock         timestamptz;
  v_new_from      timestamptz;
  v_new_to        timestamptz;
begin
  if new.amount > 0 then
    select p.duration_days, c.expires_at, c.paused_at
      into v_duration_days, v_expires_at, v_paused_at
      from public.clients c
      left join public.plans p on p.id = c.plan_id
     where c.id = new.client_id;

    -- If the client has no plan, fall back to a 30-day cycle.
    v_duration_days := coalesce(v_duration_days, 30);

    -- A paused subscription's clock stands still at paused_at.
    v_clock    := coalesce(v_paused_at, now());
    v_new_from := greatest(coalesce(v_expires_at, v_clock), v_clock);
    v_new_to   := v_new_from + make_interval(days => v_duration_days);

    perform set_config('app.trusted_expiry_write', '1', true);
    update public.clients
       set expires_at = v_new_to
     where id = new.client_id;
    perform set_config('app.trusted_expiry_write', '0', true);

    -- Stamp the coverage window if the caller did not supply one.
    if new.covers_from is null then new.covers_from := v_new_from; end if;
    if new.covers_to   is null then new.covers_to   := v_new_to;   end if;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS: same shape as connection_events — any active user may read and insert,
-- nobody may update or delete.
-- -----------------------------------------------------------------------------
alter table public.pause_events enable row level security;

create policy pause_events_select_active on public.pause_events
  for select to authenticated
  using (public.is_active_user());

create policy pause_events_insert_active on public.pause_events
  for insert to authenticated
  with check (public.is_active_user());

grant select, insert on public.pause_events to authenticated;

create trigger trg_audit_pause_events
  after insert on public.pause_events
  for each row execute function public.write_audit();
