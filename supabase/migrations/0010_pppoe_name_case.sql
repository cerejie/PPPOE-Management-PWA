-- =============================================================================
-- 0010_pppoe_name_case.sql
--
-- `pppoe_accounts.name` stops being lower-cased.
--
-- 0009 forced it to lower case to protect against a stray capital typed into
-- the form. That protection cost more than it bought: RouterOS secret names are
-- case-sensitive, so a secret the router calls `201-ROOM` was mirrored in as
-- `201-room` — a *different line* as far as the router is concerned. The app
-- then could not resolve it (Import silently dropped it, because the insert
-- failed this very check), and a push under the lower-cased name added a second
-- secret instead of editing the one that exists.
--
-- The router owns the secret list, casing included. The mirror holds the name
-- verbatim so the two can be compared at all.
--
-- Additive: one check constraint dropped. No column dropped, no row deleted,
-- no existing name rewritten — rows keep their lower-cased names until the next
-- Import writes the router's casing over them (mirrorSecrets in accounts.ts).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Drop the lower-case check
--
-- Dropped by definition rather than by name: 0009 declared it inline, so its
-- name is whatever Postgres generated (`pppoe_accounts_name_check` on every
-- version we have seen, but that is a convention, not a contract).
-- -----------------------------------------------------------------------------
do $$
declare
  v_name text;
begin
  for v_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'pppoe_accounts'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%lower(name)%'
  loop
    execute format('alter table public.pppoe_accounts drop constraint %I', v_name);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Uniqueness is unchanged, deliberately
--
-- idx_pppoe_accounts_name_live is on `name` itself, so it stays case-sensitive
-- now that case is meaningful — exactly what RouterOS permits. Making it
-- case-insensitive would let an Import silently drop one of two secrets the
-- router genuinely holds, which is the failure this migration exists to end.
-- -----------------------------------------------------------------------------

comment on column public.pppoe_accounts.name is
  'The /ppp/secret name, verbatim from the router. Case-sensitive: 201-ROOM and 201-room are different lines.';
