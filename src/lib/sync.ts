import type { Table } from 'dexie';
import { db, setMeta } from './db';
import { newUuid } from './format';
import { supabase } from './supabase';
import type {
  Client,
  ConnectionEvent,
  EntityTable,
  OutboxConnectionEventPayload,
  OutboxEntityPayload,
  OutboxItem,
  OutboxKind,
  OutboxPauseEventPayload,
  OutboxPaymentPayload,
  OutboxStatus,
  PauseEvent,
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

    const [clients, rooms, routers, plans, payments, events, pauses, users] =
      await Promise.all([
        supabase.from('clients').select('*').is('deleted_at', null),
        supabase.from('rooms').select('*').is('deleted_at', null),
        supabase.from('routers').select('*').is('deleted_at', null),
        supabase.from('plans').select('*').is('deleted_at', null),
        supabase.from('payments').select('*').gte('paid_at', paymentsSince),
        supabase
          .from('connection_events')
          .select('*')
          .order('performed_at', { ascending: false })
          .limit(500),
        supabase
          .from('pause_events')
          .select('*')
          .order('performed_at', { ascending: false })
          .limit(500),
        supabase.from('app_users').select('*'),
      ]);

    const anyError =
      clients.error ?? rooms.error ?? routers.error ?? plans.error ??
      payments.error ?? events.error ?? pauses.error ?? users.error;
    if (anyError) throw anyError;

    await db.transaction(
      'rw',
      [db.clients, db.rooms, db.routers, db.plans, db.payments, db.connection_events, db.pause_events, db.app_users, db.sync_meta],
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
        await db.pause_events.clear();
        await db.pause_events.bulkPut((pauses.data ?? []) as PauseEvent[]);
        await db.app_users.clear();
        await db.app_users.bulkPut(users.data ?? []);
        await db.sync_meta.put({ key: 'last_synced_at', value: new Date().toISOString() });
      },
    );

    await replayPendingOutbox();

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
      const { error } = await supabase
        .from('payments')
        .upsert(item.payload, { onConflict: 'client_uuid', ignoreDuplicates: true });
      if (error) serverError = error.message;
    } else if (item.kind === 'pause_event') {
      const { error } = await supabase
        .from('pause_events')
        .upsert(item.payload, { onConflict: 'client_uuid', ignoreDuplicates: true });
      if (error) serverError = error.message;
    } else if (item.kind === 'connection_event') {
      const { error } = await supabase
        .from('connection_events')
        .upsert(item.payload, { onConflict: 'client_uuid', ignoreDuplicates: true });
      if (error) serverError = error.message;
    } else {
      const e = item.payload;
      // Insert carries the device-generated id, so a retry conflicts on the
      // primary key and is ignored rather than creating a second row. Update
      // is a patch and is naturally idempotent.
      const { error } =
        e.op === 'insert'
          ? await supabase
              .from(e.table)
              .upsert(e.values, { onConflict: 'id', ignoreDuplicates: true })
          : await supabase.from(e.table).update(e.values).eq('id', e.row_id);
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

// ---------------------------------------------------------------------------
// Queueing writes. Every queue* function does the same two things atomically:
// append to the outbox, and apply the write to the local mirror — for events
// by reproducing the server trigger, for entity writes by putting the row
// itself — so the UI is correct before anything reaches Supabase.
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24;

/** Tables an optimistic mirror may touch; every queueing transaction needs all of them. */
const MIRROR_TABLES = [db.outbox, db.clients, db.plans, db.rooms, db.routers];

async function queue(item: OutboxItem, mirror: () => Promise<void>): Promise<void> {
  await db.transaction('rw', MIRROR_TABLES, async () => {
    await db.outbox.add(item);
    await mirror();
  });
}

function outboxItem<K extends OutboxKind>(
  kind: K,
  payload: Extract<OutboxItem, { kind: K }>['payload'],
): OutboxItem {
  return {
    client_uuid: payload.client_uuid,
    kind,
    payload,
    status: 'pending',
    error: null,
    created_at: new Date().toISOString(),
    attempts: 0,
  } as OutboxItem;
}

/**
 * Where a positive payment moves expires_at — the arithmetic half of
 * apply_payment_to_client(), split out so the payment form can preview the
 * exact date the trigger will land on instead of approximating it.
 *
 * The period starts at the payment's own clock: `paid_at`, capped at now so a
 * date typed ahead cannot buy time that has not passed, and frozen at
 * `paused_at` while a vacation pause is open so the payment cannot swallow the
 * window that resume is about to credit back.
 */
export function nextExpiry(input: {
  expiresAt: string | null;
  pausedAt: string | null;
  paidAt: string;
  durationDays: number;
}): string {
  const clock = Math.min(
    new Date(input.paidAt).getTime(),
    input.pausedAt ? new Date(input.pausedAt).getTime() : Date.now(),
  );
  const from = Math.max(input.expiresAt ? new Date(input.expiresAt).getTime() : clock, clock);
  return new Date(from + input.durationDays * DAY_MS).toISOString();
}

/**
 * Mirror of apply_payment_to_client(). Falls back to a 30-day cycle when the
 * client has no plan, and corrections (amount <= 0) never extend — exactly as
 * the trigger does.
 */
async function mirrorPayment(p: OutboxPaymentPayload): Promise<void> {
  if (p.amount <= 0) return;

  const client = await db.clients.get(p.client_id);
  if (!client) return;

  const plan = client.plan_id ? await db.plans.get(client.plan_id) : undefined;

  await db.clients.update(p.client_id, {
    expires_at: nextExpiry({
      expiresAt: client.expires_at,
      pausedAt: client.paused_at,
      paidAt: p.paid_at,
      durationDays: plan?.duration_days ?? 30,
    }),
  });
}

/** Mirror of apply_connection_event(). Last-write-wins on connection_status. */
async function mirrorConnectionEvent(e: OutboxConnectionEventPayload): Promise<void> {
  await db.clients.update(e.client_id, {
    connection_status: e.action === 'connect' ? 'connected' : 'disconnected',
    connection_status_updated_at: e.performed_at,
  });
}

/** Mirror of the pause trigger: a resume credits the paused span back onto expires_at. */
async function mirrorPauseEvent(p: OutboxPauseEventPayload): Promise<void> {
  const client = await db.clients.get(p.client_id);
  if (!client) return;

  if (p.action === 'pause') {
    if (client.paused_at === null) {
      await db.clients.update(p.client_id, { paused_at: p.performed_at });
    }
    return;
  }

  if (client.paused_at !== null) {
    const credit = Math.max(
      0,
      new Date(p.performed_at).getTime() - new Date(client.paused_at).getTime(),
    );
    await db.clients.update(p.client_id, {
      paused_at: null,
      expires_at: client.expires_at
        ? new Date(new Date(client.expires_at).getTime() + credit).toISOString()
        : null,
    });
  }
}

/**
 * Apply a queued entity write to the local mirror, so an offline create or
 * edit is visible everywhere in the app the moment it is made.
 *
 * Dexie's typed tables are homogeneous, so the table is resolved by name; the
 * row shape is checked at the call sites in each feature's actions.ts.
 */
async function mirrorEntity(e: OutboxEntityPayload): Promise<void> {
  // Resolved by name, so the row type is only known to the caller in
  // actions.ts; this is the single point where that is taken on trust.
  const table = db.table(e.table) as Table<Record<string, unknown>, string>;
  const values = e.values as Record<string, unknown>;

  if (e.op === 'insert') {
    await table.put(values);
  } else {
    await table.update(e.row_id, values);
  }
}

async function applyMirror(item: OutboxItem): Promise<void> {
  if (item.kind === 'payment') {
    await mirrorPayment(item.payload);
  } else if (item.kind === 'pause_event') {
    await mirrorPauseEvent(item.payload);
  } else if (item.kind === 'connection_event') {
    await mirrorConnectionEvent(item.payload);
  } else {
    await mirrorEntity(item.payload);
  }
}

/**
 * Re-apply the local effect of everything the outbox still owns.
 *
 * pullAll() is a replace-all mirror, so it overwrites the local tables with
 * server rows that, by definition, do not reflect anything unsynced. Without
 * this replay a partial flush (one item synced, the next hitting a network
 * blip) would visibly revert a payment the operator already recorded, and a
 * client created offline would vanish on the next pull.
 *
 * Oldest-first, matching flush order, so a pause/resume pair lands on the same
 * expiry the server will compute and a room created offline is restored before
 * the client that references it.
 *
 * Failed items are treated differently by kind, and deliberately so:
 *   - A rejected payment/pause/connection event drops its optimistic effect.
 *     The server refused the write, so the local mirror should match it.
 *   - A rejected entity write keeps its local row. An operator who added a
 *     client offline should not have it disappear days later because of a
 *     duplicate username; it stays visible, flagged as rejected, and is
 *     resolved from the Sync screen.
 */
async function replayPendingOutbox(): Promise<void> {
  const items = (await db.outbox.orderBy('created_at').toArray()).filter(
    (item) => item.status === 'pending' || item.kind === 'entity_write',
  );
  if (items.length === 0) return;

  await db.transaction('rw', MIRROR_TABLES, async () => {
    for (const item of items) await applyMirror(item);
  });
}

/** Queue a payment and extend expires_at locally; UI shows it as pending at once. */
export async function queuePayment(payload: OutboxPaymentPayload): Promise<void> {
  await queue(outboxItem('payment', payload), () => mirrorPayment(payload));
}

/** Queue a connection event and apply it optimistically to Dexie. */
export async function queueConnectionEvent(
  payload: OutboxConnectionEventPayload,
): Promise<void> {
  await queue(outboxItem('connection_event', payload), () => mirrorConnectionEvent(payload));
}

/**
 * Queue a pause/resume and mirror the server trigger locally so the UI is
 * correct while offline. Flushing is oldest-first, so a pause queued before a
 * resume replays server-side in the same order and lands on the same expiry.
 */
export async function queuePauseEvent(payload: OutboxPauseEventPayload): Promise<void> {
  await queue(outboxItem('pause_event', payload), () => mirrorPauseEvent(payload));
}

/**
 * Queue a create / edit / soft-delete of a domain row and apply it locally.
 *
 * Callers build `values` from their own typed input, and generate `row_id`
 * themselves for an insert so the new row can be referenced (and navigated to)
 * before it ever reaches the server.
 */
export async function queueEntityWrite(
  input: Omit<OutboxEntityPayload, 'client_uuid'>,
): Promise<string> {
  const payload: OutboxEntityPayload = { ...input, client_uuid: newUuid() };
  await queue(outboxItem('entity_write', payload), () => mirrorEntity(payload));
  return payload.client_uuid;
}

/**
 * Resolve a write the operator is still watching, and return an error message
 * for the form if the server refused it.
 *
 * Online, a rejection (duplicate username, RLS, a row someone else deleted) is
 * a validation error they can act on right now, so the optimistic row is rolled
 * back to server truth and the message is surfaced in the form — the same
 * behaviour these actions had when they wrote to Supabase directly.
 *
 * Offline there is nothing to flush: the write stays queued, the local row
 * stands, and any later rejection is surfaced on the Sync screen instead.
 */
export async function settleWrite(clientUuid: string): Promise<string | null> {
  if (!navigator.onLine) return null;

  await flushOutbox();

  const item = await db.outbox.get(clientUuid);
  if (!item || item.status !== 'failed') return null;

  await db.outbox.delete(clientUuid);
  await pullAll();
  return item.error ?? 'The server rejected this change.';
}

/** Sync state of one queued row, for screens that flag unsynced records. */
export interface EntityWriteState {
  status: OutboxStatus;
  error: string | null;
}

/** row_id -> sync state for every queued write against `table`. */
export async function entityWriteStates(
  table: EntityTable,
): Promise<Map<string, EntityWriteState>> {
  const items = await db.outbox.orderBy('created_at').toArray();
  const states = new Map<string, EntityWriteState>();

  for (const item of items) {
    if (item.kind !== 'entity_write' || item.payload.table !== table) continue;
    // Later writes win: a row edited twice reports its most recent state, and
    // a rejection is not hidden by an earlier pending edit.
    states.set(item.payload.row_id, { status: item.status, error: item.error });
  }

  return states;
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
