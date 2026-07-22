-- =============================================================================
-- 0006_payment_date_and_install_date.sql
-- Two related changes, both about when a subscription period starts.
--
--   1. payments.paid_at now drives the expiry extension. Collections are often
--      entered days after the money changed hands, and extending from the
--      moment of data entry quietly gifted the client those late-entry days.
--   2. clients.installed_at records the install date, so a new client starts
--      with a real expiry instead of "no expiry" until their first payment.
--
-- Additive only. No column is dropped, no row is rewritten, no policy is
-- loosened. Existing payments keep the expiry they were already given.
-- =============================================================================

alter table public.clients
  add column if not exists installed_at timestamptz;

comment on column public.clients.installed_at is
  'Date the line was installed. Seeds the first expires_at when the client is created; afterwards payments move expires_at on their own and this column is only a record.';

-- -----------------------------------------------------------------------------
-- Staff guard.
--
-- The guard names the columns staff may NOT change, so a column it does not
-- mention is implicitly writable by them. installed_at is profile data and
-- belongs with the rest of the superadmin-only fields.
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
-- The paid period starts when the money was collected.
--
-- Only the reference clock changes; 0005's pause behaviour is preserved. The
-- three cases the clock line has to get right:
--
--   * Backdated  — a payment entered late extends from paid_at, so the operator
--                  does not hand out the days it took them to record it.
--   * Future     — capped at now(): a date typed ahead cannot buy time that has
--                  not passed yet.
--   * Paused     — still frozen at paused_at, so a payment taken mid-vacation
--                  lands on the same expiry as one taken the day they left and
--                  cannot swallow the window resume is about to credit back.
--                  A payment backdated to BEFORE the pause takes paid_at, which
--                  is the earlier of the two and so still cannot double-count.
--
-- src/lib/sync.ts:mirrorPayment() reproduces this for offline UI and must be
-- changed in step with it.
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

    v_clock    := least(new.paid_at, coalesce(v_paused_at, now()));
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
