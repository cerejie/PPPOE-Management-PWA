import { db } from '@/lib/db';
import { newUuid } from '@/lib/format';
import { flushOutbox, queueConnectionEvent, queuePauseEvent, queuePayment } from '@/lib/sync';
import type { ConnectionAction } from '@/lib/types';

/**
 * Record a payment. Always goes through the outbox for a single write path:
 * queue locally (UI shows it as pending immediately), then flush right away
 * if we're online. client_uuid makes the server insert idempotent.
 */
export async function recordPayment(input: {
  clientId: string;
  amount: number;
  method: string | null;
  note: string | null;
  recordedBy: string | null;
}): Promise<void> {
  await queuePayment({
    client_id: input.clientId,
    amount: input.amount,
    paid_at: new Date().toISOString(),
    method: input.method,
    note: input.note,
    recorded_by: input.recordedBy,
    client_uuid: newUuid(),
  });
  if (navigator.onLine) await flushOutbox();
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
