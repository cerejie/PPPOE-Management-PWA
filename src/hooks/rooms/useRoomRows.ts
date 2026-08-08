import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import type { Room } from '@/types/rooms/Rooms.types';

export interface RoomRow {
  room: Room;
  /** Empty when no router is attached to the room. */
  routerLabel: string;
  clientCount: number;
  connectedCount: number;
}

/** Every live room with its router and occupancy, name-sorted. */
export function useRoomRows(): RoomRow[] | undefined {
  return useLiveQuery(async () => {
    const [rooms, routers, clients] = await Promise.all([
      db.rooms.toArray(),
      db.routers.toArray(),
      db.clients.toArray(),
    ]);

    const live = clients.filter((c) => !c.deleted_at);

    return rooms
      .filter((r) => !r.deleted_at)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((room) => {
        const inRoom = live.filter((c) => c.room_id === room.id);
        return {
          room,
          routerLabel: routers.find((rt) => rt.room_id === room.id && !rt.deleted_at)?.label ?? '',
          clientCount: inRoom.length,
          connectedCount: inRoom.filter((c) => c.connection_status === 'connected').length,
        };
      });
  }, []);
}
