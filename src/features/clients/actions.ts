import { db } from '@/lib/db';
import { addDays, newUuid } from '@/lib/format';
import { queueEntityWrite, settleWrite } from '@/lib/sync';
import type { AccountStatus, Client } from '@/lib/types';

// SuperAdmin CRUD. Every write goes through the outbox, so a client can be
// added or edited offline and syncs when the device comes back. Online the
// behaviour is unchanged: the write flushes immediately and a server rejection
// (duplicate username, RLS) comes straight back to the form.

export interface ClientInput {
  full_name: string;
  pppoe_username: string;
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
  return settleWrite(uuid);
}

export async function updateClient(id: string, input: ClientInput): Promise<string | null> {
  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'update',
    row_id: id,
    values: { ...input, updated_at: new Date().toISOString() },
  });
  return settleWrite(uuid);
}

export async function softDeleteClient(id: string): Promise<string | null> {
  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'update',
    row_id: id,
    values: { deleted_at: new Date().toISOString() },
  });
  return settleWrite(uuid);
}
