-- =============================================================================
-- 0007_ledger_deletes_and_self_name.sql
--
-- Two changes:
--
--   1. Ledger rows become deletable (SuperAdmin only). Until now payments were
--      strictly append-only and a mistake was corrected with a negative row.
--      That keeps the arithmetic honest but leaves the wrong row on the client's
--      statement forever, which is not what an operator wants after a typo.
--
--      Deleting a row must undo exactly what inserting it did. That is possible
--      without guesswork because each row already records its own effect:
--      payments.covers_from/covers_to hold the precise window the payment
--      bought, and pause_events.credited_seconds the precise credit a resume
--      gave back. The reversal triggers below read those, so they are true
--      inverses of apply_payment_to_client() and apply_pause_event() rather
--      than an approximation — change one and you must change its partner.
--
--      The timeline stops being an audit trail once rows can vanish from it, so
--      audit_log now captures deletes and becomes the record of what was
--      removed.
--
--   2. A user may edit their own display_name. Only that column, and only on
--      their own row; username stays fixed because the login email is derived
--      from it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- payments -> expiry reversal.
--
-- Give back exactly the window this payment bought. Corrections (amount <= 0)
-- never extended anything, so they have nothing to undo.
--
-- Subtracting the stamped window is exact whenever payments stacked onto a live
-- subscription, which is the normal case. If the subscription had lapsed before
-- a later payment, that later payment restarted the clock from `now()` and this
-- row's days were already spent — the subtraction then pulls expires_at back
-- further than it should. That is visible on the client's card and can be fixed
-- with another payment; silently ignoring the reversal would be worse, because
-- deleting a payment would leave time on the account that nobody paid for.
-- -----------------------------------------------------------------------------
create or replace function public.reverse_payment_on_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window interval;
begin
  if old.amount <= 0 or old.covers_from is null or old.covers_to is null then
    return old;
  end if;

  v_window := old.covers_to - old.covers_from;

  -- Same trusted-write handshake the apply triggers use, so the staff guard on
  -- clients lets this expires_at write through. Transaction-local.
  perform set_config('app.trusted_expiry_write', '1', true);

  update public.clients
     set expires_at = expires_at - v_window
   where id = old.client_id
     and expires_at is not null;

  perform set_config('app.trusted_expiry_write', '0', true);

  return old;
end;
$$;

create trigger trg_payments_reverse_expiry
  before delete on public.payments
  for each row execute function public.reverse_payment_on_client();

-- -----------------------------------------------------------------------------
-- pause_events -> paused_at / expiry reversal.
--
--   'resume' deleted : take credited_seconds back off expires_at and re-open the
--                      pause it had closed, so the client returns to the state
--                      it was in while paused.
--   'pause'  deleted : only an open pause is reflected in derived state. One
--                      already closed by a resume left nothing behind, and its
--                      credit belongs to that resume — deleting it must not
--                      touch expires_at.
-- -----------------------------------------------------------------------------
create or replace function public.reverse_pause_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reopen_at timestamptz;
begin
  perform set_config('app.trusted_expiry_write', '1', true);

  if old.action = 'resume' then
    -- The pause this resume closed: the newest one before it.
    select pe.performed_at
      into v_reopen_at
      from public.pause_events pe
     where pe.client_id = old.client_id
       and pe.action = 'pause'
       and pe.performed_at <= old.performed_at
       and pe.id <> old.id
     order by pe.performed_at desc
     limit 1;

    update public.clients
       set paused_at  = v_reopen_at,
           expires_at = case
                          when expires_at is null then null
                          else expires_at - make_interval(secs => old.credited_seconds)
                        end
     where id = old.client_id;

  else
    update public.clients
       set paused_at = null
     where id = old.client_id
       and paused_at = old.performed_at;
  end if;

  perform set_config('app.trusted_expiry_write', '0', true);

  return old;
end;
$$;

create trigger trg_pause_events_reverse
  before delete on public.pause_events
  for each row execute function public.reverse_pause_event();

-- -----------------------------------------------------------------------------
-- connection_events -> status reversal.
--
-- connection_status is last-write-wins over the event history, so the reversal
-- is a recompute from whatever history survives rather than an inverse of one
-- row: deleting an event that was not the newest correctly changes nothing.
-- -----------------------------------------------------------------------------
create or replace function public.reverse_connection_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action connection_action;
  v_at     timestamptz;
begin
  select ce.action, ce.performed_at
    into v_action, v_at
    from public.connection_events ce
   where ce.client_id = old.client_id
     and ce.id <> old.id
   order by ce.performed_at desc, ce.created_at desc
   limit 1;

  if v_action is null then
    -- Nothing left to derive from: back to the column's own default.
    update public.clients
       set connection_status            = 'disconnected'::connection_state,
           connection_status_updated_at = now()
     where id = old.client_id;
  else
    update public.clients
       set connection_status            = case v_action
                                            when 'connect' then 'connected'::connection_state
                                            else 'disconnected'::connection_state
                                          end,
           connection_status_updated_at = v_at
     where id = old.client_id;
  end if;

  return old;
end;
$$;

create trigger trg_connection_events_reverse
  before delete on public.connection_events
  for each row execute function public.reverse_connection_event();

-- -----------------------------------------------------------------------------
-- Delete policies. SuperAdmin only: staff keep the negative-correction path,
-- which is reversible, rather than one that destroys a row outright.
-- -----------------------------------------------------------------------------
create policy payments_delete_superadmin on public.payments
  for delete to authenticated
  using (public.is_superadmin());

create policy connection_events_delete_superadmin on public.connection_events
  for delete to authenticated
  using (public.is_superadmin());

create policy pause_events_delete_superadmin on public.pause_events
  for delete to authenticated
  using (public.is_superadmin());

grant delete on public.payments          to authenticated;
grant delete on public.connection_events to authenticated;
grant delete on public.pause_events      to authenticated;

-- -----------------------------------------------------------------------------
-- Audit deletes. With rows now removable from a client's timeline, audit_log is
-- the only remaining record that they ever existed — write_audit() already
-- stores the whole row as jsonb on DELETE.
-- -----------------------------------------------------------------------------
drop trigger if exists trg_audit_payments on public.payments;
create trigger trg_audit_payments
  after insert or delete on public.payments
  for each row execute function public.write_audit();

drop trigger if exists trg_audit_connection_events on public.connection_events;
create trigger trg_audit_connection_events
  after insert or delete on public.connection_events
  for each row execute function public.write_audit();

-- pause_events had no audit trigger; it needs one now that it is deletable.
drop trigger if exists trg_audit_pause_events on public.pause_events;
create trigger trg_audit_pause_events
  after insert or delete on public.pause_events
  for each row execute function public.write_audit();

-- -----------------------------------------------------------------------------
-- Self-service display name.
--
-- RLS cannot restrict an UPDATE to one column (WITH CHECK sees only the new
-- row), so the policy grants the row and this guard narrows it to display_name
-- — the same split 0005 uses for the staff guard on clients.
-- -----------------------------------------------------------------------------
create policy app_users_update_self on public.app_users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.guard_app_user_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_superadmin() then
    return new;
  end if;

  -- updated_at is set by trg_app_users_updated and is deliberately not listed.
  if new.id         is distinct from old.id
     or new.username   is distinct from old.username
     or new.role       is distinct from old.role
     or new.is_active  is distinct from old.is_active
     or new.created_at is distinct from old.created_at
  then
    raise exception 'you may only change your own display name';
  end if;

  return new;
end;
$$;

create trigger trg_app_users_guard_self_update
  before update on public.app_users
  for each row execute function public.guard_app_user_self_update();
