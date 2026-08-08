import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useClients, type ClientFilters, type ExpiryFilter } from '@/hooks/clients/useClients';
import { useRooms } from '@/hooks/rooms/useRooms';
import { useEntitySync } from '@/hooks/sync/useEntitySync';
import type { ClientFilterChip } from '@/constants/clients/ClientFilters.constants';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { Client, ConnectionStatus } from '@/types/clients/Clients.types';

interface ClientsPageState {
  search: string;
}

export interface ClientsPageViewModel {
  /** Undefined until Dexie answers; empty array means nothing matched. */
  readonly clients: readonly Client[] | undefined;
  readonly search: string;
  /** The room the list is scoped to, when the user navigated in from one. */
  readonly roomName: string | undefined;
  readonly canAddClient: boolean;
  setSearch: (value: string) => void;
  clearRoom: () => void;
  isChipActive: (chip: ClientFilterChip) => boolean;
  toggleChip: (chip: ClientFilterChip) => void;
  roomNameOf: (roomId: string | null) => string | undefined;
  syncState: (clientId: string) => EntityWriteState | undefined;
}

/**
 * The URL can hold anything, so both narrow rather than cast — an unknown value
 * falls back to "no filter" instead of widening `ClientFilters`.
 */
function toStatus(value: string | null): ConnectionStatus | 'all' {
  return value === 'connected' || value === 'disconnected' ? value : 'all';
}

function toExpiry(value: string | null): ExpiryFilter {
  return value === 'expiring' || value === 'expired' ? value : 'all';
}

/**
 * The URL owns the filters — a filtered list stays shareable and survives a back
 * navigation. Only the search box, which nothing links to, is component state.
 */
export function useClientsPage(): ClientsPageViewModel {
  const [params, setParams] = useSearchParams();
  const { isSuperAdmin } = useAuth();
  const rooms = useRooms();
  const unsynced = useEntitySync('clients');

  const store = useInstanceStore<ClientsPageState>(() => ({ search: '' }));
  const search = useStore(store, (s) => s.search);

  const roomId = params.get('room') ?? 'all';

  const filters: ClientFilters = useMemo(
    () => ({
      search,
      status: toStatus(params.get('status')),
      roomId,
      expiry: toExpiry(params.get('expiry')),
      paused: params.get('paused') === '1' ? 'only' : 'all',
    }),
    [search, params, roomId],
  );

  const clients = useClients(filters);

  const roomNameOf = (id: string | null): string | undefined =>
    id ? rooms?.find((room) => room.id === id)?.name : undefined;

  function setParam(key: string, value: string | null): void {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  function isChipActive(chip: ClientFilterChip): boolean {
    if (chip.param === null) {
      return !params.has('status') && !params.has('expiry') && !params.has('paused');
    }
    return params.get(chip.param.key) === chip.param.value;
  }

  function toggleChip(chip: ClientFilterChip): void {
    // "All" clears every filter but keeps the room scope the user navigated in with.
    if (chip.param === null) {
      const room = params.get('room');
      setParams(room === null ? new URLSearchParams() : new URLSearchParams({ room }), {
        replace: true,
      });
      return;
    }
    // Setting a key that is already taken by its sibling swaps the two for free
    // (Connected ↔ Disconnected), so only an exact match needs clearing.
    const { key, value } = chip.param;
    setParam(key, isChipActive(chip) ? null : value);
  }

  return {
    clients,
    search,
    roomName: roomNameOf(params.get('room')),
    canAddClient: isSuperAdmin,
    setSearch: (value) => store.setState({ search: value }),
    clearRoom: () => setParam('room', null),
    isChipActive,
    toggleChip,
    roomNameOf,
    syncState: (clientId) => unsynced.get(clientId),
  };
}
