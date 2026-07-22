import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import type { Room } from '@/types/rooms/rooms.types';

export function useRooms(): Room[] | undefined {
  return useLiveQuery(async () => {
    const rooms = await db.rooms.toArray();
    return rooms
      .filter((r) => !r.deleted_at)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

export function useRoom(id: string | undefined): Room | undefined {
  return useLiveQuery(async () => (id ? await db.rooms.get(id) : undefined), [id]);
}
