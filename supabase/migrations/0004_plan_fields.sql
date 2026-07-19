-- =============================================================================
-- 0004_plan_fields.sql
-- Plans gain: advertised speed (mbps), an optional offer end date
-- (valid_until), and soft delete (deleted_at) to match rooms / clients.
--
-- Additive only. No column is dropped, no existing row is rewritten beyond
-- picking up the mbps default, and no policy is loosened.
--
-- duration_days keeps its existing meaning: how many days a payment extends
-- a client's expires_at. valid_until is about the PLAN itself — the date it
-- stops being offered to new clients (promos). The two are independent.
-- =============================================================================

alter table public.plans
  add column if not exists mbps        integer not null default 0 check (mbps >= 0),
  add column if not exists valid_until timestamptz,
  add column if not exists deleted_at  timestamptz;

comment on column public.plans.mbps is
  'Advertised downstream speed in Mbps. 0 = unspecified.';
comment on column public.plans.valid_until is
  'Optional date this plan stops being offered to new clients. Null = always offered. Does not affect already-assigned clients.';
comment on column public.plans.deleted_at is
  'Soft delete. Null = live. Hard deletes stay denied (no DELETE policy) so payment history keeps resolving.';

-- Soft-deleted plans are filtered out of every read path; index the predicate.
create index if not exists idx_plans_deleted_at on public.plans (deleted_at);

-- -----------------------------------------------------------------------------
-- RLS: nothing to add.
--
-- Soft delete is an UPDATE of deleted_at, already covered by the existing
-- plans_update_superadmin policy from 0003_rls.sql. There is still no DELETE
-- policy on plans, so hard deletes remain denied for everyone — which is what
-- we want, since clients.plan_id references plans(id).
-- -----------------------------------------------------------------------------
