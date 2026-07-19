-- =============================================================================
-- 0001_schema.sql
-- Core schema: tables, columns, foreign keys, indexes.
-- UUID PKs, FKs everywhere, created_at/updated_at on all tables,
-- soft deletes (deleted_at) on clients / rooms / routers.
-- =============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------
create type app_role         as enum ('superadmin', 'staff');
create type account_status   as enum ('active', 'suspended', 'terminated');
create type connection_state as enum ('connected', 'disconnected');
create type status_source    as enum ('manual', 'router');
create type connection_action as enum ('connect', 'disconnect');

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- app_users  (mirrors auth.users, holds role + profile)
-- -----------------------------------------------------------------------------
create table public.app_users (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique check (username = lower(username)),
  display_name text not null,
  role         app_role not null default 'staff',
  is_active    boolean  not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_app_users_updated
  before update on public.app_users
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- rooms
-- -----------------------------------------------------------------------------
create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_rooms_updated
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- routers  (at most one router per room)
-- -----------------------------------------------------------------------------
create table public.routers (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid unique references public.rooms (id) on delete set null,
  label      text not null,
  model      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_routers_room_id on public.routers (room_id);

create trigger trg_routers_updated
  before update on public.routers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- plans
-- -----------------------------------------------------------------------------
create table public.plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  price         numeric(10, 2) not null check (price >= 0),
  duration_days integer not null check (duration_days > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_plans_updated
  before update on public.plans
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- clients
-- -----------------------------------------------------------------------------
create table public.clients (
  id                            uuid primary key default gen_random_uuid(),
  full_name                     text not null,
  pppoe_username                text not null unique,
  room_id                       uuid references public.rooms (id) on delete set null,
  router_id                     uuid references public.routers (id) on delete set null,
  plan_id                       uuid references public.plans (id) on delete set null,
  monthly_fee                   numeric(10, 2) not null default 0 check (monthly_fee >= 0),
  account_status                account_status   not null default 'active',
  connection_status             connection_state not null default 'disconnected',
  connection_status_updated_at  timestamptz not null default now(),
  status_source                 status_source not null default 'manual',
  expires_at                    timestamptz,
  notes                         text,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  deleted_at                    timestamptz
);

create index idx_clients_room_id           on public.clients (room_id);
create index idx_clients_router_id         on public.clients (router_id);
create index idx_clients_plan_id           on public.clients (plan_id);
create index idx_clients_expires_at        on public.clients (expires_at);
create index idx_clients_connection_status on public.clients (connection_status);

create trigger trg_clients_updated
  before update on public.clients
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payments  (append-only; client_uuid gives idempotent sync)
-- -----------------------------------------------------------------------------
create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete restrict,
  amount      numeric(10, 2) not null,  -- may be negative for corrections
  paid_at     timestamptz not null default now(),
  method      text,
  covers_from timestamptz,
  covers_to   timestamptz,
  recorded_by uuid references public.app_users (id) on delete set null,
  note        text,
  client_uuid uuid not null unique,     -- device-generated idempotency key
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_payments_client_id on public.payments (client_id);
create index idx_payments_paid_at   on public.payments (paid_at);

create trigger trg_payments_updated
  before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- connection_events
-- -----------------------------------------------------------------------------
create table public.connection_events (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients (id) on delete cascade,
  action            connection_action not null,
  performed_by      uuid references public.app_users (id) on delete set null,
  performed_at      timestamptz not null default now(),
  note              text,
  client_uuid       uuid not null unique,   -- device-generated idempotency key
  executed_on_router boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_connection_events_client_id on public.connection_events (client_id);
create index idx_connection_events_performed_at on public.connection_events (performed_at);

create trigger trg_connection_events_updated
  before update on public.connection_events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- audit_log  (insert via trigger only)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.app_users (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index idx_audit_log_entity on public.audit_log (entity_type, entity_id);
create index idx_audit_log_created_at on public.audit_log (created_at);
