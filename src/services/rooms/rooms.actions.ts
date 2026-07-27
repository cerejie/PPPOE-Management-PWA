import { db } from '@/api/common/db';
import { newUuid } from '@/utils/common/format';
import { queueEntityWrite, settleWrite } from '@/api/sync/syncEngine';
import { supabase } from '@/api/common/supabaseClient';
import type {
  MikrotikCredentials,
  MikrotikStatus,
  Room,
  Router,
} from '@/types/rooms/rooms.types';

// SuperAdmin CRUD for rooms and their (at most one) router. Writes go through
// the outbox so rooms can be managed offline; the guards below read the local
// mirror rather than the server, for the same reason.

export interface RoomInput {
  name: string;
  notes: string | null;
  /** Label of the room's router. Empty string detaches any existing router. */
  routerLabel: string;
}

export async function createRoom(input: RoomInput): Promise<string | null> {
  const now = new Date().toISOString();
  const room: Room = {
    id: newUuid(),
    name: input.name.trim(),
    notes: input.notes,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const roomUuid = await queueEntityWrite({
    table: 'rooms',
    op: 'insert',
    row_id: room.id,
    values: room,
  });
  const roomError = await settleWrite(roomUuid);
  if (roomError) return roomError;

  // Queued after the room, so the flush order satisfies the room_id FK.
  const routerError = await syncRoomRouter(room.id, input.routerLabel.trim());
  return routerError && `Room saved, but the router failed: ${routerError}`;
}

export async function updateRoom(id: string, input: RoomInput): Promise<string | null> {
  const uuid = await queueEntityWrite({
    table: 'rooms',
    op: 'update',
    row_id: id,
    values: {
      name: input.name.trim(),
      notes: input.notes,
      updated_at: new Date().toISOString(),
    },
  });
  const roomError = await settleWrite(uuid);
  if (roomError) return roomError;

  return syncRoomRouter(id, input.routerLabel.trim());
}

/**
 * Reconcile the room's router with the submitted label.
 *
 * Detaching clears room_id as well as setting deleted_at: routers.room_id
 * carries a UNIQUE constraint, so a soft-deleted row would otherwise keep
 * squatting the room and block ever attaching a new router to it.
 */
async function syncRoomRouter(roomId: string, label: string): Promise<string | null> {
  const existing = (await db.routers.where('room_id').equals(roomId).toArray()).find(
    (r) => !r.deleted_at,
  );

  if (!label) {
    if (!existing) return null;
    return detachRouter(existing.id);
  }

  if (existing) {
    const uuid = await queueEntityWrite({
      table: 'routers',
      op: 'update',
      row_id: existing.id,
      values: { label, updated_at: new Date().toISOString() },
    });
    return settleWrite(uuid);
  }

  const now = new Date().toISOString();
  const router: Router = {
    id: newUuid(),
    room_id: roomId,
    label,
    model: null,
    notes: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const uuid = await queueEntityWrite({
    table: 'routers',
    op: 'insert',
    row_id: router.id,
    values: router,
  });
  return settleWrite(uuid);
}

async function detachRouter(routerId: string): Promise<string | null> {
  const uuid = await queueEntityWrite({
    table: 'routers',
    op: 'update',
    row_id: routerId,
    values: { deleted_at: new Date().toISOString(), room_id: null },
  });
  return settleWrite(uuid);
}

/**
 * Soft-delete a room. Refused while clients are still assigned to it, so we
 * never leave a client pointing at a room that no read path can resolve.
 *
 * The count comes from the local mirror, which offline is the only source
 * available — and online is equivalent, since clients are mirrored in full.
 */
export async function softDeleteRoom(id: string): Promise<string | null> {
  const assigned = (await db.clients.where('room_id').equals(id).toArray()).filter(
    (c) => !c.deleted_at,
  ).length;

  if (assigned > 0) {
    return `${assigned} client${
      assigned === 1 ? ' is' : 's are'
    } still assigned to this room. Move them to another room first.`;
  }

  const uuid = await queueEntityWrite({
    table: 'rooms',
    op: 'update',
    row_id: id,
    values: { deleted_at: new Date().toISOString() },
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  // Free the router's unique room_id so the room can be recreated cleanly.
  const router = (await db.routers.where('room_id').equals(id).toArray()).find(
    (r) => !r.deleted_at,
  );
  if (router) await detachRouter(router.id);

  return null;
}

// ---------------------------------------------------------------------------
// MikroTik API connection
//
// Deliberately outside the outbox, unlike every other write in this file.
// Router credentials must not be mirrored into Dexie — IndexedDB is readable by
// anyone with the device — and a connection cannot be tested offline anyway.
// So these two are online-only calls into the Edge Function, which owns both
// the credentials and the actual TCP session to the router.
// ---------------------------------------------------------------------------

/** Split `host:port` typed into one field, the way the MikroTik app accepts it. */
function splitAddress(address: string, tls: boolean): { host: string; port: number } {
  const trimmed = address.trim().replace(/^\w+:\/\//, '');
  const colon = trimmed.lastIndexOf(':');

  if (colon > 0) {
    const port = Number(trimmed.slice(colon + 1));
    if (Number.isInteger(port) && port > 0 && port <= 65535) {
      return { host: trimmed.slice(0, colon), port };
    }
  }
  return { host: trimmed, port: tls ? 8729 : 8728 };
}

export interface MikrotikConnectResult {
  status: MikrotikStatus | null;
  error: string | null;
}

/**
 * Save the connection and immediately verify it.
 *
 * Nothing is stored unless the router actually answers and the credentials
 * work, so "connected" in Settings always means a session succeeded rather
 * than merely that a form was filled in.
 */
export async function connectMikrotik(
  input: MikrotikCredentials,
): Promise<MikrotikConnectResult> {
  const { host, port } = splitAddress(input.address, input.tls);

  if (!host) return { status: null, error: 'Enter the router address.' };
  if (!input.username.trim()) return { status: null, error: 'Enter the API username.' };
  if (!input.password) return { status: null, error: 'Enter the API password.' };

  const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
    body: {
      action: 'configure',
      host,
      port,
      tls: input.tls,
      username: input.username.trim(),
      password: input.password,
      ca_cert: input.caCert.trim() || null,
    },
  });

  if (error) return { status: null, error: error.message };

  const body = data as { ok?: boolean; status?: MikrotikStatus; detail?: string } | null;
  if (!body?.ok) {
    return { status: body?.status ?? null, error: body?.detail ?? 'Could not reach the router.' };
  }
  return { status: body.status ?? null, error: null };
}

/** Read the stored connection. Never includes the password. */
export async function readMikrotikStatus(): Promise<MikrotikConnectResult> {
  const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
    body: { action: 'status' },
  });

  if (error) return { status: null, error: error.message };

  const body = data as { ok?: boolean; status?: MikrotikStatus; detail?: string } | null;
  if (!body?.ok) return { status: null, error: body?.detail ?? 'Could not read router settings.' };
  return { status: body.status ?? null, error: null };
}

/** Re-test the stored credentials without changing them. */
export async function testMikrotik(): Promise<MikrotikConnectResult> {
  const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
    body: { action: 'probe' },
  });

  if (error) return { status: null, error: error.message };

  const body = data as { ok?: boolean; status?: MikrotikStatus; detail?: string } | null;
  if (!body?.ok) return { status: null, error: body?.detail ?? 'Could not reach the router.' };
  return { status: body.status ?? null, error: null };
}
