import { db } from '@/api/common/db';
import { newUuid } from '@/utils/common/format';
import { queueEntityWrite, settleWrite } from '@/api/sync/syncEngine';
import type { Room, Router } from '@/types/rooms/rooms.types';

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
 * Soft-delete a room, unassigning any clients still in it.
 *
 * Clients change rooms often, so a room's occupants are not a reason to keep
 * the room itself alive — but they must not be left pointing at a room no read
 * path can resolve, which would strand them out of the rooms list. Unassigning
 * comes first for that reason, and each step is its own outbox write so the
 * whole operation replays in the same order when it syncs.
 *
 * Counts and rows come from the local mirror, which offline is the only source
 * available — and online is equivalent, since clients are mirrored in full.
 */
export async function softDeleteRoom(id: string): Promise<string | null> {
  const assigned = (await db.clients.where('room_id').equals(id).toArray()).filter(
    (c) => !c.deleted_at,
  );

  for (const client of assigned) {
    const uuid = await queueEntityWrite({
      table: 'clients',
      op: 'update',
      row_id: client.id,
      // router_id goes with the room: the room's router is detached below, so
      // keeping it would leave the client pointing at a deleted router.
      values: { room_id: null, router_id: null, updated_at: new Date().toISOString() },
    });
    const error = await settleWrite(uuid);
    if (error) return `Could not unassign ${client.full_name}: ${error}`;
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
