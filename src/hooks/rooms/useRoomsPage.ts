import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useRoomRows, type RoomRow } from '@/hooks/rooms/useRoomRows';
import { useEntitySync } from '@/hooks/sync/useEntitySync';
import type { EntityWriteState } from '@/api/sync/syncEngine';

export type RoomActivityFilter = 'all' | 'active' | 'inactive';

/** The room the form sheet is open for; 'new' for a blank one. */
export type RoomEditTarget = RoomRow | 'new' | null;

interface RoomsPageState {
  editing: RoomEditTarget;
  search: string;
  activity: RoomActivityFilter;
}

export interface RoomsPageViewModel {
  /** Undefined until Dexie answers; empty array means no rooms exist. */
  readonly rows: readonly RoomRow[] | undefined;
  readonly visible: readonly RoomRow[] | undefined;
  readonly search: string;
  readonly activity: RoomActivityFilter;
  readonly activeCount: number;
  readonly inactiveCount: number;
  readonly totalCount: number;
  readonly canEdit: boolean;
  readonly editing: RoomEditTarget;
  syncState: (roomId: string) => EntityWriteState | undefined;
  setSearch: (value: string) => void;
  /** Tapping the active filter again clears it. */
  toggleActivity: (filter: RoomActivityFilter) => void;
  edit: (row: RoomRow) => void;
  create: () => void;
  closeForm: () => void;
}

export function useRoomsPage(): RoomsPageViewModel {
  const rows = useRoomRows();
  const { isSuperAdmin } = useAuth();
  const unsynced = useEntitySync('rooms');

  const store = useInstanceStore<RoomsPageState>(() => ({
    editing: null,
    search: '',
    activity: 'all',
  }));

  const { editing, search, activity } = useStore(
    store,
    useShallow((s) => s),
  );

  const activeCount = rows?.filter((r) => r.connectedCount > 0).length ?? 0;
  const totalCount = rows?.length ?? 0;

  const visible = useMemo(() => {
    if (!rows) return undefined;
    const query = search.trim().toLowerCase();
    return rows.filter(({ room, connectedCount }) => {
      if (activity === 'active' && connectedCount === 0) return false;
      if (activity === 'inactive' && connectedCount > 0) return false;
      return query === '' || room.name.toLowerCase().includes(query);
    });
  }, [rows, search, activity]);

  return {
    rows,
    visible,
    search,
    activity,
    activeCount,
    inactiveCount: totalCount - activeCount,
    totalCount,
    canEdit: isSuperAdmin,
    editing,
    syncState: (roomId) => unsynced.get(roomId),
    setSearch: (value) => store.setState({ search: value }),
    toggleActivity: (filter) =>
      store.setState((s) => ({ activity: s.activity === filter ? 'all' : filter })),
    edit: (row) => store.setState({ editing: row }),
    create: () => store.setState({ editing: 'new' }),
    closeForm: () => store.setState({ editing: null }),
  };
}
