-- =============================================================================
-- 0003_rls.sql
-- Row Level Security. No anonymous access anywhere.
--
-- Summary of intent:
--   * Any authenticated ACTIVE user: read everything; insert payments and
--     connection_events; update only clients.connection_status.
--   * SuperAdmin only: insert/update/soft-delete clients, rooms, routers,
--     plans, app_users.
--   * payments: nobody may update or delete (corrections are new rows).
--   * audit_log: no direct writes (trigger only); readable by SuperAdmin.
-- =============================================================================

alter table public.app_users         enable row level security;
alter table public.rooms             enable row level security;
alter table public.routers           enable row level security;
alter table public.plans             enable row level security;
alter table public.clients           enable row level security;
alter table public.payments          enable row level security;
alter table public.connection_events enable row level security;
alter table public.audit_log         enable row level security;

-- -----------------------------------------------------------------------------
-- app_users
-- -----------------------------------------------------------------------------
create policy app_users_select_active on public.app_users
  for select to authenticated
  using (public.is_active_user());

create policy app_users_write_superadmin on public.app_users
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- -----------------------------------------------------------------------------
-- rooms  (write = superadmin; soft delete is an UPDATE of deleted_at)
-- -----------------------------------------------------------------------------
create policy rooms_select_active on public.rooms
  for select to authenticated
  using (public.is_active_user());

create policy rooms_insert_superadmin on public.rooms
  for insert to authenticated
  with check (public.is_superadmin());

create policy rooms_update_superadmin on public.rooms
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- -----------------------------------------------------------------------------
-- routers
-- -----------------------------------------------------------------------------
create policy routers_select_active on public.routers
  for select to authenticated
  using (public.is_active_user());

create policy routers_insert_superadmin on public.routers
  for insert to authenticated
  with check (public.is_superadmin());

create policy routers_update_superadmin on public.routers
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- -----------------------------------------------------------------------------
-- plans
-- -----------------------------------------------------------------------------
create policy plans_select_active on public.plans
  for select to authenticated
  using (public.is_active_user());

create policy plans_insert_superadmin on public.plans
  for insert to authenticated
  with check (public.is_superadmin());

create policy plans_update_superadmin on public.plans
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- -----------------------------------------------------------------------------
-- clients
--   SELECT: any active user.
--   INSERT / full UPDATE: superadmin.
--   Staff UPDATE is allowed by RLS but column-restricted to connection status
--   by the guard trigger below (see guard_client_staff_update).
--   No DELETE policy anywhere => hard deletes are denied; use deleted_at.
-- -----------------------------------------------------------------------------
create policy clients_select_active on public.clients
  for select to authenticated
  using (public.is_active_user());

create policy clients_insert_superadmin on public.clients
  for insert to authenticated
  with check (public.is_superadmin());

create policy clients_update_active on public.clients
  for update to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

-- Enforce that non-superadmins may only touch the connection-status columns.
create or replace function public.guard_client_staff_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_superadmin() then
    return new;
  end if;

  -- Non-superadmin: every column except the connection-status pair must be
  -- unchanged. `is distinct from` treats nulls correctly.
  if new.full_name                   is distinct from old.full_name
     or new.pppoe_username           is distinct from old.pppoe_username
     or new.room_id                  is distinct from old.room_id
     or new.router_id                is distinct from old.router_id
     or new.plan_id                  is distinct from old.plan_id
     or new.monthly_fee              is distinct from old.monthly_fee
     or new.account_status           is distinct from old.account_status
     or new.status_source            is distinct from old.status_source
     or new.expires_at               is distinct from old.expires_at
     or new.notes                    is distinct from old.notes
     or new.deleted_at               is distinct from old.deleted_at
     or new.id                       is distinct from old.id
     or new.created_at               is distinct from old.created_at
  then
    raise exception 'staff may only change connection_status';
  end if;

  return new;
end;
$$;

create trigger trg_guard_client_staff_update
  before update on public.clients
  for each row execute function public.guard_client_staff_update();

-- -----------------------------------------------------------------------------
-- payments  (append-only: insert by any active user; never update/delete)
-- -----------------------------------------------------------------------------
create policy payments_select_active on public.payments
  for select to authenticated
  using (public.is_active_user());

create policy payments_insert_active on public.payments
  for insert to authenticated
  with check (public.is_active_user());

-- No UPDATE or DELETE policies => both are denied for everyone.

-- -----------------------------------------------------------------------------
-- connection_events  (insert by any active user; immutable afterwards)
-- -----------------------------------------------------------------------------
create policy connection_events_select_active on public.connection_events
  for select to authenticated
  using (public.is_active_user());

create policy connection_events_insert_active on public.connection_events
  for insert to authenticated
  with check (public.is_active_user());

-- -----------------------------------------------------------------------------
-- audit_log  (no insert policy => only the SECURITY DEFINER trigger writes;
--             readable by superadmin)
-- -----------------------------------------------------------------------------
create policy audit_log_select_superadmin on public.audit_log
  for select to authenticated
  using (public.is_superadmin());
