import { supabase } from '@/lib/supabase';
import { pullAll } from '@/lib/sync';

// SuperAdmin CRUD for rooms and their (at most one) router.
// Online-only, matching the clients actions: admin edits are rare and need
// immediate server confirmation. Offline entry stays reserved for payments
// and connection events per the sync design.

export interface RoomInput {
  name: string;
  notes: string | null;
  /** Label of the room's router. Empty string detaches any existing router. */
  routerLabel: string;
}

export async function createRoom(input: RoomInput): Promise<string | null> {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ name: input.name.trim(), notes: input.notes })
    .select('id')
    .single();

  if (error || !room) return error?.message ?? 'Failed to create room.';

  const label = input.routerLabel.trim();
  if (label) {
    const { error: routerError } = await supabase
      .from('routers')
      .insert({ room_id: room.id, label });
    if (routerError) {
      await pullAll();
      return `Room created, but the router failed: ${routerError.message}`;
    }
  }

  await pullAll();
  return null;
}

export async function updateRoom(id: string, input: RoomInput): Promise<string | null> {
  const { error } = await supabase
    .from('rooms')
    .update({ name: input.name.trim(), notes: input.notes })
    .eq('id', id);
  if (error) return error.message;

  const routerError = await syncRoomRouter(id, input.routerLabel.trim());
  await pullAll();
  return routerError;
}

/**
 * Reconcile the room's router with the submitted label.
 *
 * Detaching clears room_id as well as setting deleted_at: routers.room_id
 * carries a UNIQUE constraint, so a soft-deleted row would otherwise keep
 * squatting the room and block ever attaching a new router to it.
 */
async function syncRoomRouter(roomId: string, label: string): Promise<string | null> {
  const { data: existing, error: readError } = await supabase
    .from('routers')
    .select('id')
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .maybeSingle();

  if (readError) return readError.message;

  if (!label) {
    if (!existing) return null;
    const { error } = await supabase
      .from('routers')
      .update({ deleted_at: new Date().toISOString(), room_id: null })
      .eq('id', existing.id);
    return error?.message ?? null;
  }

  if (existing) {
    const { error } = await supabase.from('routers').update({ label }).eq('id', existing.id);
    return error?.message ?? null;
  }

  const { error } = await supabase.from('routers').insert({ room_id: roomId, label });
  return error?.message ?? null;
}

/**
 * Soft-delete a room. Refused while clients are still assigned to it, so we
 * never leave a client pointing at a room that no read path can resolve.
 */
export async function softDeleteRoom(id: string): Promise<string | null> {
  const { count, error: countError } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', id)
    .is('deleted_at', null);

  if (countError) return countError.message;
  if (count && count > 0) {
    return `${count} client${
      count === 1 ? ' is' : 's are'
    } still assigned to this room. Move them to another room first.`;
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('rooms').update({ deleted_at: now }).eq('id', id);
  if (error) return error.message;

  // Free the router's unique room_id so the room can be recreated cleanly.
  await supabase
    .from('routers')
    .update({ deleted_at: now, room_id: null })
    .eq('room_id', id)
    .is('deleted_at', null);

  await pullAll();
  return null;
}
