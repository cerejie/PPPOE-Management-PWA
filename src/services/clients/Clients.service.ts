import { db } from '@/api/common/db';
import { addDays, newUuid } from '@/common/utils/Format.utils';
import { queueEntityWrite, settleWrite } from '@/api/sync/syncEngine';
import { stampSecretComment } from '@/services/pppoe/Pppoe.service';
import type { AccountStatus, Client } from '@/types/clients/Clients.types';

// SuperAdmin CRUD. Every write goes through the outbox, so a client can be
// added or edited offline and syncs when the device comes back. Online the
// behaviour is unchanged: the write flushes immediately and a server rejection
// (duplicate username, RLS) comes straight back to the form.

export interface ClientInput {
  full_name: string;
  /** The PPPoE line. `pppoe_username` is derived from it, never typed. */
  pppoe_account_id: string | null;
  room_id: string | null;
  router_id: string | null;
  plan_id: string | null;
  monthly_fee: number;
  account_status: AccountStatus;
  installed_at: string | null;
  notes: string | null;
}

/**
 * Expiry a client starts on the day they are installed, before any payment.
 *
 * Without this a new client sits at "no expiry" until their first payment,
 * which reads as "never expires" everywhere in the app. Only creation uses it:
 * afterwards expires_at is server-owned and moved by payments and pauses, so
 * correcting the install date later must not roll it back.
 */
export function initialExpiry(installedAt: string | null, durationDays: number): string | null {
  return installedAt ? addDays(installedAt, durationDays) : null;
}

/**
 * Create a client. The id is generated here rather than by the database, so
 * the new client is immediately navigable and can be referenced by other
 * offline writes (a payment recorded against it, say) before it ever syncs.
 */
export async function createClient(input: ClientInput): Promise<string | null> {
  const now = new Date().toISOString();
  const plan = input.plan_id ? await db.plans.get(input.plan_id) : undefined;
  const row: Client = {
    id: newUuid(),
    ...input,
    // Local half of trg_clients_pppoe_username, so the new client shows their
    // line immediately instead of waiting for the first pull.
    pppoe_username: await usernameOf(input.pppoe_account_id),
    // Server column defaults, restated so the local row is complete.
    connection_status: 'disconnected',
    connection_status_updated_at: now,
    status_source: 'manual',
    expires_at: initialExpiry(input.installed_at, plan?.duration_days ?? 30),
    paused_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'insert',
    row_id: row.id,
    values: row,
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  return input.pppoe_account_id ? stampSecretComment(input.pppoe_account_id, row.id) : null;
}

export async function updateClient(id: string, input: ClientInput): Promise<string | null> {
  // The column is UNIQUE server-side, so taking a line off whoever holds it has
  // to happen first — otherwise the write comes back as a raw constraint error
  // rather than something the operator can act on.
  if (input.pppoe_account_id) {
    const released = await releaseAccountFrom(input.pppoe_account_id, id);
    if (released) return released;
  }

  const previousAccountId = (await db.clients.get(id))?.pppoe_account_id ?? null;

  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'update',
    row_id: id,
    values: {
      ...input,
      pppoe_username: await usernameOf(input.pppoe_account_id),
      updated_at: new Date().toISOString(),
    },
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  // The secret's comment is this client's name, so both a rename and a change
  // of line make it stale. Stamped unconditionally rather than only on a
  // detected rename: the write is idempotent, and one code path is cheaper to
  // keep true than two.
  if (input.pppoe_account_id) {
    const failed = await stampSecretComment(input.pppoe_account_id, id);
    if (failed) return failed;
  }
  if (previousAccountId && previousAccountId !== input.pppoe_account_id) {
    return stampSecretComment(previousAccountId, null);
  }
  return null;
}

/** Mirror of trg_clients_pppoe_username: the assigned account's name, or null. */
async function usernameOf(accountId: string | null): Promise<string | null> {
  if (!accountId) return null;
  const account = await db.pppoe_accounts.get(accountId);
  return account?.name ?? null;
}

/** Unassign `accountId` from any client other than `keepClientId`. */
async function releaseAccountFrom(
  accountId: string,
  keepClientId: string,
): Promise<string | null> {
  const holder = (await db.clients.where('pppoe_account_id').equals(accountId).toArray()).find(
    (c) => !c.deleted_at && c.id !== keepClientId,
  );
  if (!holder) return null;

  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'update',
    row_id: holder.id,
    values: {
      pppoe_account_id: null,
      pppoe_username: null,
      updated_at: new Date().toISOString(),
    },
  });
  const error = await settleWrite(uuid);
  return error && `Could not take that account off ${holder.full_name}: ${error}`;
}

/**
 * Delete a client outright, with their payments and events.
 *
 * Not a soft delete: pppoe_username is UNIQUE across every row, so a flagged
 * row would hold that username forever and re-adding the same subscriber —
 * someone moving back into the same room — would fail on the constraint with no
 * way for the app to release it. The server cascades the history (see
 * migration 0008) and the local mirror does the same; audit_log keeps a copy of
 * everything removed.
 */
export async function deleteClient(id: string): Promise<string | null> {
  // Read before the delete: the FK is ON DELETE SET NULL, so afterwards there
  // is nothing left to say which line was theirs.
  const accountId = (await db.clients.get(id))?.pppoe_account_id ?? null;

  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'delete',
    row_id: id,
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  // The line survives the client and goes back to the pool, so it must stop
  // carrying their name on the router.
  return accountId ? stampSecretComment(accountId, null) : null;
}
