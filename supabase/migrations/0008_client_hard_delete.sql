-- =============================================================================
-- 0008_client_hard_delete.sql
--
-- Removing a client now removes the client, not a flag on it.
--
-- The soft delete had a bug with no workaround: clients.pppoe_username carries a
-- plain UNIQUE constraint, and a soft-deleted row keeps occupying its username
-- forever. Re-adding the same subscriber — the same person moving back into the
-- same room, which is routine — failed with
--   duplicate key value violates unique constraint "clients_pppoe_username_key"
-- and nothing in the app could release the name.
--
-- Deleting for real also matches what the operator means by "remove this
-- client": the record goes, along with its history.
--
-- What survives: audit_log. write_audit() stores the whole row as jsonb, and
-- cascaded child deletes fire their own row triggers, so every payment,
-- connection event and pause event removed this way is still recorded there.
--
-- Trade-off, stated plainly: a deleted client's payments leave the payments
-- table, so historical revenue totals change. That is the cost of freeing the
-- username, and it is what makes "clear off that client" true.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- payments.client_id was ON DELETE RESTRICT — the constraint that made a hard
-- delete impossible for any client who had ever paid. connection_events and
-- pause_events already cascade.
-- -----------------------------------------------------------------------------
alter table public.payments
  drop constraint payments_client_id_fkey;

alter table public.payments
  add constraint payments_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete cascade;

-- -----------------------------------------------------------------------------
-- Deleting a client is SuperAdmin-only, matching who may create one.
-- -----------------------------------------------------------------------------
create policy clients_delete_superadmin on public.clients
  for delete to authenticated
  using (public.is_superadmin());

grant delete on public.clients to authenticated;
