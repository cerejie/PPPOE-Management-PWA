import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { Fab } from '@/components/Fab';
import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/lib/db';
import type { Room } from '@/lib/types';
import { RoomFormSheet } from './RoomFormSheet';

interface RoomRow {
  room: Room;
  routerLabel: string;
  clientCount: number;
  connectedCount: number;
}

function useRoomRows(): RoomRow[] | undefined {
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
          routerLabel:
            routers.find((rt) => rt.room_id === room.id && !rt.deleted_at)?.label ?? '',
          clientCount: inRoom.length,
          connectedCount: inRoom.filter((c) => c.connection_status === 'connected').length,
        };
      });
  }, []);
}

type Editing = { room: Room; routerLabel: string } | 'new' | null;

export function RoomsScreen() {
  const rows = useRoomRows();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <>
      <Screen title="Rooms" eyebrow={rows ? `${rows.length} total` : undefined}>
        {rows === undefined ? (
          <p className="py-16 text-center text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl bg-surface p-10 text-center shadow-card">
            <p className="text-3xl">🏠</p>
            <p className="mt-3 font-semibold text-fg">No rooms yet</p>
            <p className="mt-1 text-sm text-muted">
              {isSuperAdmin
                ? 'Tap + to add your first room.'
                : 'An admin needs to add rooms first.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map(({ room, routerLabel, clientCount, connectedCount }) => (
              <li key={room.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/clients?room=${room.id}`)}
                  className="flex min-h-[76px] flex-1 items-center justify-between gap-3 rounded-3xl bg-surface px-4 py-3.5 text-left shadow-card transition-transform active:scale-[0.98]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-fg">{room.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {routerLabel ? `Router · ${routerLabel}` : 'No router'}
                      {room.notes ? ` · ${room.notes}` : ''}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                        {clientCount} client{clientCount === 1 ? '' : 's'}
                      </span>
                      {connectedCount > 0 && (
                        <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-[11px] font-semibold text-ok">
                          {connectedCount} online
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 text-muted"
                    aria-hidden
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditing({ room, routerLabel })}
                    aria-label={`Edit ${room.name}`}
                    className="flex w-12 shrink-0 items-center justify-center rounded-3xl bg-surface text-muted shadow-card active:opacity-60"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 20h4l10-10-4-4L4 16v4z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Screen>

      {isSuperAdmin && <Fab onClick={() => setEditing('new')} label="Add room" />}

      {editing === 'new' && <RoomFormSheet onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && (
        <RoomFormSheet
          room={editing.room}
          routerLabel={editing.routerLabel}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
