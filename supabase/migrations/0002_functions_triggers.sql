-- =============================================================================
-- 0002_functions_triggers.sql
-- Helper functions (role lookup), the payment -> expiry trigger, and audit
-- logging triggers.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- current_app_role() / current_app_user_id() / is_superadmin()
-- SECURITY DEFINER so RLS policies can read the caller's role without the
-- policy on app_users recursing back into itself.
-- -----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where id = auth.uid()
    and is_active = true;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'superadmin', false);
$$;

-- Any authenticated user who has an active app_users row.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where id = auth.uid()
      and is_active = true
  );
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_superadmin()    from public;
revoke all on function public.is_active_user()   from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_superadmin()    to authenticated;
grant execute on function public.is_active_user()   to authenticated;

-- -----------------------------------------------------------------------------
-- Payment -> expiry extension.
-- expires_at is the single source of truth. On each positive payment we extend
-- from max(current expiry, now) by the plan's duration, and stamp the coverage
-- window onto the payment row. Corrections (amount <= 0) do not extend.
-- -----------------------------------------------------------------------------
create or replace function public.apply_payment_to_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_days integer;
  v_new_from       timestamptz;
  v_new_to         timestamptz;
begin
  if new.amount > 0 then
    select p.duration_days
      into v_duration_days
      from public.clients c
      left join public.plans p on p.id = c.plan_id
     where c.id = new.client_id;

    -- If the client has no plan, fall back to a 30-day cycle.
    v_duration_days := coalesce(v_duration_days, 30);

    v_new_from := greatest(
      coalesce((select expires_at from public.clients where id = new.client_id), now()),
      now()
    );
    v_new_to := v_new_from + make_interval(days => v_duration_days);

    update public.clients
       set expires_at = v_new_to
     where id = new.client_id;

    -- Stamp the coverage window if the caller did not supply one.
    if new.covers_from is null then new.covers_from := v_new_from; end if;
    if new.covers_to   is null then new.covers_to   := v_new_to;   end if;
  end if;

  return new;
end;
$$;

-- BEFORE INSERT so we can mutate covers_from / covers_to on the row.
create trigger trg_payments_apply_expiry
  before insert on public.payments
  for each row execute function public.apply_payment_to_client();

-- -----------------------------------------------------------------------------
-- Connection event -> keep client's connection_status in sync.
-- -----------------------------------------------------------------------------
create or replace function public.apply_connection_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients
     set connection_status = case new.action
                               when 'connect' then 'connected'::connection_state
                               else 'disconnected'::connection_state
                             end,
         connection_status_updated_at = new.performed_at
   where id = new.client_id;
  return new;
end;
$$;

create trigger trg_connection_events_apply
  after insert on public.connection_events
  for each row execute function public.apply_connection_event();

-- -----------------------------------------------------------------------------
-- Audit logging. Inserts into audit_log are only ever done here (SECURITY
-- DEFINER), so the table can stay locked down to direct writes.
-- -----------------------------------------------------------------------------
create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_id uuid;
  v_payload   jsonb;
begin
  if tg_op = 'DELETE' then
    v_entity_id := old.id;
    v_payload   := to_jsonb(old);
  else
    v_entity_id := new.id;
    v_payload   := to_jsonb(new);
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), lower(tg_op), tg_table_name, v_entity_id, v_payload);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Audit the meaningful write tables.
create trigger trg_audit_clients
  after insert or update or delete on public.clients
  for each row execute function public.write_audit();

create trigger trg_audit_payments
  after insert on public.payments
  for each row execute function public.write_audit();

create trigger trg_audit_connection_events
  after insert on public.connection_events
  for each row execute function public.write_audit();

create trigger trg_audit_plans
  after insert or update or delete on public.plans
  for each row execute function public.write_audit();

create trigger trg_audit_rooms
  after insert or update or delete on public.rooms
  for each row execute function public.write_audit();

create trigger trg_audit_routers
  after insert or update or delete on public.routers
  for each row execute function public.write_audit();

create trigger trg_audit_app_users
  after insert or update or delete on public.app_users
  for each row execute function public.write_audit();
