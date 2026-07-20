import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { daysUntil } from '@/lib/format';
import { isClientEvent } from '@/lib/types';
import type { Client, ConnectionStatus, OutboxItem, Plan, Room, Router } from '@/lib/types';

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

export function useRooms(): Room[] | undefined {
  return useLiveQuery(async () => {
    const rooms = await db.rooms.toArray();
    return rooms
      .filter((r) => !r.deleted_at)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

export function useRouters(): Router[] | undefined {
  return useLiveQuery(async () => {
    const routers = await db.routers.toArray();
    return routers.filter((r) => !r.deleted_at);
  }, []);
}

export function usePlans(): Plan[] | undefined {
  return useLiveQuery(
    async () =>
      (await db.plans.toArray())
        .filter((p) => !p.deleted_at)
        .sort((a, b) => a.price - b.price),
    [],
  );
}

export function useRoom(id: string | undefined): Room | undefined {
  return useLiveQuery(async () => (id ? await db.rooms.get(id) : undefined), [id]);
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

export interface DashboardStats {
  total: number;
  /** Sum of monthly_fee across clients whose account_status is 'active'. */
  monthlyRevenue: number;
  connected: number;
  disconnected: number;
  expiring7d: number;
  expired: number;
  /** Clients on a vacation pause; excluded from the expiry counts above. */
  paused: number;
  soonest: Client[];
}

export function useDashboardStats(): DashboardStats | undefined {
  return useLiveQuery(async () => {
    const clients = (await db.clients.toArray()).filter((c) => !c.deleted_at);

    let connected = 0;
    let disconnected = 0;
    let expiring7d = 0;
    let expired = 0;
    let paused = 0;
    let monthlyRevenue = 0;

    for (const c of clients) {
      if (c.connection_status === 'connected') connected += 1;
      else disconnected += 1;
      if (c.account_status === 'active') monthlyRevenue += c.monthly_fee;
      if (c.paused_at !== null) {
        paused += 1;
        continue; // Frozen expiry — not expiring, not expired.
      }
      const d = daysUntil(c.expires_at);
      if (d !== null) {
        if (d < 0) expired += 1;
        else if (d <= 7) expiring7d += 1;
      }
    }

    const soonest = clients
      .filter(
        (c) =>
          c.paused_at === null &&
          c.expires_at !== null &&
          (daysUntil(c.expires_at) ?? 0) >= 0,
      )
      .sort((a, b) => (a.expires_at ?? '').localeCompare(b.expires_at ?? ''))
      .slice(0, 8);

    return {
      total: clients.length,
      monthlyRevenue,
      connected,
      disconnected,
      expiring7d,
      expired,
      paused,
      soonest,
    };
  }, []);
}
