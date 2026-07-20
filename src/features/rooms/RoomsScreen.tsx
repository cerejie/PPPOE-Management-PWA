import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { Fab } from '@/components/Fab';
import { SyncBadge } from '@/components/SyncBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { useEntitySync } from '@/features/sync/hooks';
import { db } from '@/lib/db';
import type { Room } from '@/lib/types';
import { RoomFormSheet } from './RoomFormSheet';

interface RoomRow {
  room: Room;
  routerLabel: string;
  clientCount: number;
  connectedCount: number;
}

type ActiveFilter = 'all' | 'active' | 'inactive';

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

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: string;
}

function FilterChip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[38px] shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'bg-accent-gradient text-white shadow-float' : 'bg-surface text-muted shadow-card'
      } active:opacity-70`}
    >
      {children}
    </button>
  );
}

export function RoomsScreen() {
  const rows = useRoomRows();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const unsynced = useEntitySync('rooms');
  const [editing, setEditing] = useState<Editing>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const activeCount = rows?.filter((r) => r.connectedCount > 0).length ?? 0;
  const inactiveCount = (rows?.length ?? 0) - activeCount;

  const visible = useMemo(() => {
    if (!rows) return undefined;
    const q = search.trim().toLowerCase();
    return rows.filter(({ room, connectedCount }) => {
      if (activeFilter === 'active' && connectedCount === 0) return false;
      if (activeFilter === 'inactive' && connectedCount > 0) return false;
      return q === '' || room.name.toLowerCase().includes(q);
    });
  }, [rows, search, activeFilter]);

  return (
    <>
      <Screen title="Rooms" eyebrow={visible ? `${visible.length} shown` : undefined}>
        <div className="relative mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Search room number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search rooms"
            className="block w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-base text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </div>

        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <FilterChip active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
            {`All ${activeCount + inactiveCount}`}
          </FilterChip>
          <FilterChip
            active={activeFilter === 'active'}
            onClick={() => setActiveFilter(activeFilter === 'active' ? 'all' : 'active')}
          >
            {`Active ${activeCount}`}
          </FilterChip>
          <FilterChip
            active={activeFilter === 'inactive'}
            onClick={() => setActiveFilter(activeFilter === 'inactive' ? 'all' : 'inactive')}
          >
            {`Not active ${inactiveCount}`}
          </FilterChip>
        </div>

        {rows === undefined || visible === undefined ? (
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
        ) : visible.length === 0 ? (
          <div className="rounded-3xl bg-surface p-10 text-center shadow-card">
            <p className="text-3xl">🔍</p>
            <p className="mt-3 font-semibold text-fg">No rooms match</p>
            <p className="mt-1 text-sm text-muted">Try clearing the filter or the search.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-card">
            {visible.map(({ room, routerLabel, clientCount, connectedCount }) => (
              <li key={room.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => navigate(`/clients?room=${room.id}`)}
                  className="flex min-h-[56px] flex-1 items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{room.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {routerLabel || 'No router'}
                      {room.notes ? ` · ${room.notes}` : ''}
                    </p>
                  </div>

                  <SyncBadge state={unsynced.get(room.id)} />

                  <span className="shrink-0 text-right text-xs tabular-nums text-muted">
                    {connectedCount > 0 && (
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ok align-middle" />
                    )}
                    <span className="font-semibold text-fg">{connectedCount}</span>/{clientCount}
                  </span>

                  {!isSuperAdmin && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0 text-muted/60"
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
                  )}
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditing({ room, routerLabel })}
                    aria-label={`Edit ${room.name}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
