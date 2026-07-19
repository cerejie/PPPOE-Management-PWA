import { db, setMeta } from './db';
import { supabase } from './supabase';
import type {
  Client,
  ConnectionEvent,
  OutboxConnectionEventPayload,
  OutboxItem,
  OutboxPaymentPayload,
  Payment,
} from './types';

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 183;

/**
 * Mirror server data into Dexie. Called on login and after successful
 * fetches; failures are swallowed into the returned boolean so offline
 * startup never throws.
 */
export async function pullAll(): Promise<boolean> {
  try {
    const paymentsSince = new Date(Date.now() - SIX_MONTHS_MS).toISOString();

    const [clients, rooms, routers, plans, payments, events, users] =
      await Promise.all([
        supabase.from('clients').select('*').is('deleted_at', null),
        supabase.from('rooms').select('*').is('deleted_at', null),
        supabase.from('routers').select('*').is('deleted_at', null),
        supabase.from('plans').select('*'),
        supabase.from('payments').select('*').gte('paid_at', paymentsSince),
        supabase
          .from('connection_events')
          .select('*')
          .order('performed_at', { ascending: false })
          .limit(500),
        supabase.from('app_users').select('*'),
      ]);

    const anyError =
      clients.error ?? rooms.error ?? routers.error ?? plans.error ??
      payments.error ?? events.error ?? users.error;
    if (anyError) throw anyError;

    await db.transaction(
      'rw',
      [db.clients, db.rooms, db.routers, db.plans, db.payments, db.connection_events, db.app_users, db.sync_meta],
      async () => {
        // Replace-all mirror: server is the source of truth for these tables.
        await db.clients.clear();
        await db.clients.bulkPut((clients.data ?? []) as Client[]);
        await db.rooms.clear();
        await db.rooms.bulkPut(rooms.data ?? []);
        await db.routers.clear();
        await db.routers.bulkPut(routers.data ?? []);
        await db.plans.clear();
        await db.plans.bulkPut(plans.data ?? []);
        await db.payments.clear();
        await db.payments.bulkPut((payments.data ?? []) as Payment[]);
        await db.connection_events.clear();
        await db.connection_events.bulkPut((events.data ?? []) as ConnectionEvent[]);
        await db.app_users.clear();
        await db.app_users.bulkPut(users.data ?? []);
        await db.sync_meta.put({ key: 'last_synced_at', value: new Date().toISOString() });
      },
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Flush the outbox oldest-first. Inserts use onConflict: client_uuid with
 * ignoreDuplicates so a retry can never double-post.
 *
 * Transient failures (network) stay 'pending' and retry automatically.
 * Permanent failures (server rejected, e.g. RLS) become 'failed' and are
 * kept for manual review — never silently dropped, never auto-retried.
 */
export async function flushOutbox(): Promise<{ flushed: number; failed: number }> {
  const items = await db.outbox.where('status').equals('pending').sortBy('created_at');

  let flushed = 0;
  let failed = 0;

  for (const item of items) {
    const ok = await pushOutboxItem(item);
    if (ok) {
      await db.outbox.delete(item.client_uuid);
      flushed += 1;
    } else {
      failed += 1;
    }
  }

  if (flushed > 0) {
    // Re-pull so local mirrors (expires_at extensions, event rows) match server.
    await pullAll();
  }

  return { flushed, failed };
}

async function pushOutboxItem(item: OutboxItem): Promise<boolean> {
  let serverError: string | null = null;

  try {
    if (item.kind === 'payment') {
      const p = item.payload as OutboxPaymentPayload;
      const { error } = await supabase
        .from('payments')
        .upsert(p, { onConflict: 'client_uuid', ignoreDuplicates: true });
      if (error) serverError = error.message;
    } else {
      const e = item.payload as OutboxConnectionEventPayload;
      const { error } = await supabase
        .from('connection_events')
        .upsert(e, { onConflict: 'client_uuid', ignoreDuplicates: true });
      if (error) serverError = error.message;
    }
  } catch {
    // Request never reached the server (offline / network blip): keep the
    // item 'pending' so the next flush retries it automatically.
    await db.outbox.update(item.client_uuid, { attempts: item.attempts + 1 });
    return false;
  }

  if (serverError !== null) {
    // The server saw the request and rejected it (e.g. RLS): permanent.
    await db.outbox.update(item.client_uuid, {
      status: 'failed',
      error: serverError,
      attempts: item.attempts + 1,
    });
    return false;
  }

  return true;
}

/** Queue an offline payment; UI shows it immediately as pending. */
export async function queuePayment(payload: OutboxPaymentPayload): Promise<void> {
  await db.outbox.add({
    client_uuid: payload.client_uuid,
    kind: 'payment',
    payload,
    status: 'pending',
    error: null,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
}

/** Queue an offline connection event and apply it optimistically to Dexie. */
export async function queueConnectionEvent(
  payload: OutboxConnectionEventPayload,
): Promise<void> {
  await db.transaction('rw', [db.outbox, db.clients], async () => {
    await db.outbox.add({
      client_uuid: payload.client_uuid,
      kind: 'connection_event',
      payload,
      status: 'pending',
      error: null,
      created_at: new Date().toISOString(),
      attempts: 0,
    });
    // Last-write-wins locally on connection_status.
    await db.clients.update(payload.client_id, {
      connection_status: payload.action === 'connect' ? 'connected' : 'disconnected',
      connection_status_updated_at: payload.performed_at,
    });
  });
}

/** Delete a permanently-failed outbox item after operator review. */
export async function discardOutboxItem(clientUuid: string): Promise<void> {
  await db.outbox.delete(clientUuid);
}

export async function retryOutboxItem(clientUuid: string): Promise<void> {
  await db.outbox.update(clientUuid, { status: 'pending', error: null });
  await flushOutbox();
}

// ---------------------------------------------------------------------------
// Connectivity listener: flush when we come back online.
// ---------------------------------------------------------------------------

let started = false;

export function startSyncEngine(): void {
  if (started) return;
  started = true;

  window.addEventListener('online', () => {
    void flushOutbox();
  });

  // Periodic revalidation while the app is open (every 2 minutes, online only).
  window.setInterval(() => {
    if (navigator.onLine) {
      void flushOutbox().then(() => pullAll());
    }
  }, 2 * 60 * 1000);
}

export async function markSyncedNow(): Promise<void> {
  await setMeta('last_synced_at', new Date().toISOString());
}
