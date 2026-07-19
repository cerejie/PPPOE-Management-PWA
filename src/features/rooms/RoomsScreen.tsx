import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { db } from '@/lib/db';

interface RoomRow {
  id: string;
  name: string;
  notes: string | null;
  routerLabel: string | null;
  clientCount: number;
}

function useRoomRows(): RoomRow[] | undefined {
  return useLiveQuery(async () => {
    const [rooms, routers, clients] = await Promise.all([
      db.rooms.toArray(),
      db.routers.toArray(),
      db.clients.toArray(),
    ]);
    return rooms
      .filter((r) => !r.deleted_at)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((room) => ({
        id: room.id,
        name: room.name,
        notes: room.notes,
        routerLabel:
          routers.find((rt) => rt.room_id === room.id && !rt.deleted_at)?.label ?? null,
        clientCount: clients.filter((c) => c.room_id === room.id && !c.deleted_at).length,
      }));
  }, []);
}

export function RoomsScreen() {
  const rows = useRoomRows();
  const navigate = useNavigate();

  return (
    <Screen title="Rooms">
      {rows === undefined ? (
        <p className="py-16 text-center text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-sm">
          No rooms yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
          {rows.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => navigate(`/clients?room=${room.id}`)}
                className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{room.name}</p>
                  <p className="truncate text-xs text-muted">
                    {room.routerLabel ? `Router: ${room.routerLabel}` : 'No router'}
                    {room.notes ? ` · ${room.notes}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text">
                  {room.clientCount} client{room.clientCount === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
