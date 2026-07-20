import { newUuid } from '@/lib/format';
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
  notes: string | null;
}

/**
 * Create a client. The id is generated here rather than by the database, so
 * the new client is immediately navigable and can be referenced by other
 * offline writes (a payment recorded against it, say) before it ever syncs.
 */
export async function createClient(input: ClientInput): Promise<string | null> {
  const now = new Date().toISOString();
  const row: Client = {
    id: newUuid(),
    ...input,
    // Server column defaults, restated so the local row is complete.
    connection_status: 'disconnected',
    connection_status_updated_at: now,
    status_source: 'manual',
    expires_at: null,
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
