import Dexie, { type Table } from 'dexie';
import type { AppUser } from '@/types/auth/Auth.types';
import type { Client, ConnectionEvent, PauseEvent } from '@/types/clients/Clients.types';
import type { Payment } from '@/types/payments/Payments.types';
import type { Plan } from '@/types/plans/Plans.types';
import type { PppoeAccount, PppoeProfile } from '@/types/pppoe/Pppoe.types';
import type { Room, Router } from '@/types/rooms/Rooms.types';
import type { OutboxItem, SyncMeta } from '@/types/sync/Sync.types';

/**
 * Local cache + outbox. Reads always come from here so the UI renders
 * instantly; the sync engine mirrors server data in and flushes the outbox.
 */
class PppoeDb extends Dexie {
  clients!: Table<Client, string>;
  rooms!: Table<Room, string>;
  routers!: Table<Router, string>;
  plans!: Table<Plan, string>;
  pppoe_accounts!: Table<PppoeAccount, string>;
  pppoe_profiles!: Table<PppoeProfile, string>;
  payments!: Table<Payment, string>;
  connection_events!: Table<ConnectionEvent, string>;
  pause_events!: Table<PauseEvent, string>;
  app_users!: Table<AppUser, string>;
  outbox!: Table<OutboxItem, string>;
  sync_meta!: Table<SyncMeta, string>;

  constructor() {
    super('pppoe-manager');
    this.version(1).stores({
      clients: 'id, pppoe_username, room_id, connection_status, expires_at',
      rooms: 'id, name',
      routers: 'id, room_id',
      plans: 'id',
      payments: 'id, client_id, paid_at, client_uuid',
      connection_events: 'id, client_id, performed_at, client_uuid',
      app_users: 'id, username',
      outbox: 'client_uuid, status, created_at',
      sync_meta: 'key',
    });

    // v2: vacation pause. Existing installs keep their cached rows; the next
    // pull backfills clients.paused_at and populates pause_events.
    this.version(2).stores({
      pause_events: 'id, client_id, performed_at, client_uuid',
    });

    // v3: PPPoE accounts and profiles mirrored from the router. `clients` is
    // re-declared only to add the pppoe_account_id index — Dexie needs the
    // whole store string when a table's indexes change, and existing rows are
    // kept; the next pull backfills the new column.
    this.version(3).stores({
      clients: 'id, pppoe_username, pppoe_account_id, room_id, connection_status, expires_at',
      pppoe_accounts: 'id, name, synced_to_router',
      pppoe_profiles: 'id, name',
    });
  }
}

export const db = new PppoeDb();

// --- sync_meta helpers ------------------------------------------------------

export async function getMeta(key: string): Promise<string | null> {
  const row = await db.sync_meta.get(key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.sync_meta.put({ key, value });
}

export async function deleteMeta(key: string): Promise<void> {
  await db.sync_meta.delete(key);
}

/** Wipe all cached data (used on logout). */
export async function clearLocalCache(): Promise<void> {
  await db.transaction(
    'rw',
    [db.clients, db.rooms, db.routers, db.plans, db.pppoe_accounts, db.pppoe_profiles, db.payments, db.connection_events, db.pause_events, db.app_users, db.outbox, db.sync_meta],
    async () => {
      await Promise.all([
        db.clients.clear(),
        db.rooms.clear(),
        db.routers.clear(),
        db.plans.clear(),
        db.pppoe_accounts.clear(),
        db.pppoe_profiles.clear(),
        db.payments.clear(),
        db.connection_events.clear(),
        db.pause_events.clear(),
        db.app_users.clear(),
        db.outbox.clear(),
        db.sync_meta.clear(),
      ]);
    },
  );
}
