import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import { daysUntil } from '@/utils/common/format';
import type { Client, ConnectionStatus } from '@/types/clients/clients.types';
import { isClientEvent, type OutboxItem } from '@/types/sync/sync.types';

export type ExpiryFilter = 'all' | 'expiring' | 'expired';

export interface ClientFilters {
  search: string;
  status: ConnectionStatus | 'all';
  roomId: string | 'all';
  expiry: ExpiryFilter;
  /** 'only' narrows to clients currently on a vacation pause. */
  paused: 'all' | 'only';
}

export function useClients(filters: ClientFilters): Client[] | undefined {
  return useLiveQuery(async () => {
    let list = await db.clients.toArray();
    list = list.filter((c) => !c.deleted_at);

    if (filters.status !== 'all') {
      list = list.filter((c) => c.connection_status === filters.status);
    }
    if (filters.roomId !== 'all') {
      list = list.filter((c) => c.room_id === filters.roomId);
    }
    if (filters.paused === 'only') {
      list = list.filter((c) => c.paused_at !== null);
    }
    if (filters.expiry !== 'all') {
      list = list.filter((c) => {
        // A paused client's expiry is frozen, so it is not really approaching.
        // Chasing them for renewal while they are away would be wrong.
        if (c.paused_at !== null) return false;
        const d = daysUntil(c.expires_at);
        if (d === null) return false;
        return filters.expiry === 'expired' ? d < 0 : d >= 0 && d <= 7;
      });
    }

    const q = filters.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.pppoe_username.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [filters.search, filters.status, filters.roomId, filters.expiry, filters.paused]);
}

export function useClient(id: string | undefined): Client | undefined {
  return useLiveQuery(
    async () => (id ? await db.clients.get(id) : undefined),
    [id],
  );
}

/** Outbox items for one client, so its detail screen can mark rows pending. */
export function useClientOutbox(clientId: string | undefined): OutboxItem[] | undefined {
  return useLiveQuery(async () => {
    if (!clientId) return [];
    const items = await db.outbox.toArray();
    return items
      .filter((i) => isClientEvent(i) && i.payload.client_id === clientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [clientId]);
}
