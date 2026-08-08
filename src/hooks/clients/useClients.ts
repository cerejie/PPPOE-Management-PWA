import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import { daysUntil } from '@/common/utils/Format.utils';
import type { ClientSort } from '@/constants/clients/ClientFilters.constants';
import type { Client, ConnectionStatus } from '@/types/clients/Clients.types';
import { isClientEvent, type OutboxItem } from '@/types/sync/Sync.types';

export type ExpiryFilter = 'all' | 'expiring' | 'expired';

/**
 * The list screen offers the two date orders; `name` stays available for pickers,
 * where alphabetical is the only order that helps someone hunting for a person.
 */
export type ClientOrder = ClientSort | 'name';

export interface ClientFilters {
  search: string;
  status: ConnectionStatus | 'all';
  roomId: string | 'all';
  expiry: ExpiryFilter;
  /** 'only' narrows to clients currently on a vacation pause. */
  paused: 'all' | 'only';
  sort: ClientOrder;
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

    // On a date order the name only breaks ties, so clients added in the same
    // batch — an import, or a burst of offline adds — stay in a stable order.
    return list.sort((a, b) => {
      if (filters.sort !== 'name') {
        const byDate = a.created_at.localeCompare(b.created_at);
        if (byDate !== 0) return filters.sort === 'oldest' ? byDate : -byDate;
      }
      return a.full_name.localeCompare(b.full_name);
    });
  }, [
    filters.search,
    filters.status,
    filters.roomId,
    filters.expiry,
    filters.paused,
    filters.sort,
  ]);
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
