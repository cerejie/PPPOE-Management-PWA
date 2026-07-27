import { db } from '@/api/common/db';
import { newUuid } from '@/utils/common/format';
import {
  discardQueuedClientEvent,
  flushOutbox,
  queueConnectionEvent,
  queueEntityWrite,
  queuePauseEvent,
  queuePayment,
  settleWrite,
} from '@/api/sync/syncEngine';
import type { ConnectionAction, LedgerKind } from '@/types/clients/clients.types';
import type { EntityTable } from '@/types/sync/sync.types';

/**
 * Record a payment. Always goes through the outbox for a single write path:
 * queue locally (UI shows it as pending immediately), then flush right away
 * if we're online. client_uuid makes the server insert idempotent.
 *
 * Paying reconnects the line. A correction (amount <= 0) buys no time, so it
 * must not reconnect anyone.
 */
export async function recordPayment(input: {
  clientId: string;
  amount: number;
  /** When the money was collected. Drives the expiry extension, so a payment
   *  entered late still covers the period it was actually for. */
  paidAt: string;
  method: string | null;
  note: string | null;
  recordedBy: string | null;
}): Promise<void> {
  await queuePayment({
    client_id: input.clientId,
    amount: input.amount,
    paid_at: input.paidAt,
    method: input.method,
    note: input.note,
    recorded_by: input.recordedBy,
    client_uuid: newUuid(),
  });

  if (input.amount > 0) {
    await queueConnectionEvent({
      client_id: input.clientId,
      action: 'connect',
      performed_at: new Date().toISOString(),
      note: 'Auto: payment received',
      performed_by: input.recordedBy,
      client_uuid: newUuid(),
    });
  }

  if (navigator.onLine) await flushOutbox();
}

/**
 * Disconnect every client whose subscription has run out.
 *
 * Nothing runs server-side on a schedule, so this is the app's catch-up: it
 * sweeps on open and after each sync. Reading and writing through Dexie and the
 * outbox means it works offline too, and once a client is marked disconnected
 * the next sweep skips it, so this cannot loop or double-post.
 *
 * A paused client is never swept — a pause freezes the clock, so their expiry
 * date is not really in the past.
 */
export async function sweepExpiredClients(performedBy: string | null): Promise<number> {
  const now = Date.now();

  const expired = (await db.clients.toArray()).filter(
    (c) =>
      !c.deleted_at &&
      c.paused_at === null &&
      c.connection_status === 'connected' &&
      c.expires_at !== null &&
      new Date(c.expires_at).getTime() < now,
  );

  for (const client of expired) {
    await queueConnectionEvent({
      client_id: client.id,
      action: 'disconnect',
      performed_at: new Date().toISOString(),
      note: 'Auto: subscription expired',
      performed_by: performedBy,
      client_uuid: newUuid(),
    });
  }

  if (expired.length > 0 && navigator.onLine) await flushOutbox();
  return expired.length;
}

/**
 * Toggle connect/disconnect: writes a connection_event (server trigger keeps
 * clients.connection_status in sync) and applies the change locally at once.
 */
export async function toggleConnection(input: {
  clientId: string;
  action: ConnectionAction;
  performedBy: string | null;
  note?: string;
}): Promise<void> {
  await queueConnectionEvent({
    client_id: input.clientId,
    action: input.action,
    performed_at: new Date().toISOString(),
    note: input.note ?? null,
    performed_by: input.performedBy,
    client_uuid: newUuid(),
  });
  if (navigator.onLine) await flushOutbox();
}

/**
 * Start or end a vacation pause.
 *
 * Pausing freezes the subscription clock and drops the line (an empty room
 * should not hold a session); resuming credits the paused time back onto
 * expires_at and reconnects. The connection event is queued first so that if
 * the device dies mid-call the line state is never left contradicting the
 * pause state.
 */
export async function setPaused(input: {
  clientId: string;
  paused: boolean;
  performedBy: string | null;
  note?: string;
}): Promise<void> {
  const note = input.note?.trim() || null;

  await queueConnectionEvent({
    client_id: input.clientId,
    action: input.paused ? 'disconnect' : 'connect',
    performed_at: new Date().toISOString(),
    note: input.paused ? 'Auto: vacation pause' : 'Auto: pause resumed',
    performed_by: input.performedBy,
    client_uuid: newUuid(),
  });

  await queuePauseEvent({
    client_id: input.clientId,
    action: input.paused ? 'pause' : 'resume',
    performed_at: new Date().toISOString(),
    note,
    performed_by: input.performedBy,
    client_uuid: newUuid(),
  });

  if (navigator.onLine) await flushOutbox();
}

/** True if a payment with this outbox uuid is still unsynced. */
export async function isPending(clientUuid: string): Promise<boolean> {
  return (await db.outbox.get(clientUuid)) !== undefined;
}

/** Which table each ledger row actually lives in. */
const LEDGER_TABLE: Record<LedgerKind, EntityTable> = {
  payment: 'payments',
  connection: 'connection_events',
  pause: 'pause_events',
};

/**
 * Force-delete one ledger row — the escape hatch for an entry recorded wrongly,
 * where a negative correction would leave the mistake on the statement forever.
 *
 * The two cases are genuinely different. A row still in the outbox has no
 * server counterpart, so it is dropped locally and its optimistic effect
 * unwound. A synced row is queued as an entity delete, and the derived state it
 * produced — an extended expiry, a credited pause, a connection status — is
 * undone by the server's reversal trigger and, offline, by that trigger's local
 * mirror.
 */
export async function deleteLedgerEntry(entry: {
  id: string;
  kind: LedgerKind;
  /** True while the row is only in the outbox (pending, or rejected). */
  queued: boolean;
}): Promise<string | null> {
  if (entry.queued) {
    await discardQueuedClientEvent(entry.id);
    return null;
  }

  const uuid = await queueEntityWrite({
    table: LEDGER_TABLE[entry.kind],
    op: 'delete',
    row_id: entry.id,
  });
  return settleWrite(uuid);
}
